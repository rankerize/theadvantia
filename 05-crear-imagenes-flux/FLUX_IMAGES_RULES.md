# Módulo Crear Imágenes / Flux Images (`#/crear-imagenes`) — Reglas de Negocio

Documento generado a partir del código real en `fluxImages.js`. Última revisión: 2026-06-30.

## 1. Objetivo

Generar imágenes de ambientación de productos de Falabella mediante inteligencia artificial, a partir de un SKU (cuyas imágenes se descargan automáticamente del CDN de Falabella) o de imágenes subidas manualmente. Soporta generación individual y en lote desde una lista de SKUs. Las imágenes resultantes se muestran en una galería con lightbox y se pueden descargar individualmente o como ZIP.

## 2. Cómo funciona / Flujo

### 2.1 Inicialización (`initFluxImages`, fluxImages.js:120)

1. Verifica que el elemento `#view-flux-images` exista en el DOM.
2. Inicializa el lightbox (`initLightbox`, fluxImages.js:52).
3. Configura el bookmarklet de autenticación (`#fluxBookmarklet`, fluxImages.js:127-128) con el código JS inline que extrae el token de Atenea desde las cookies del navegador y lo envía al token bridge.
4. Verifica el estado de la conexión a Atenea llamando a `checkSharedConnection()` (fluxImages.js:92) — `POST FLUX_PROXY_URL` con body `{ checkOnly: true }`.
5. **Solo si el usuario tiene email `ADMIN_EMAIL` (`rankerize@gmail.com`)**, inserta el botón `📊` de estadísticas junto al badge de conexión (fluxImages.js:134-143).
6. Inicializa los grupos de pills (`initPillGroup`) para: aspecto (`fluxAspect`), tamaño (`fluxSize`), cantidad (`fluxQty`), modo (`fluxMode`), y sus equivalentes de lote (`fluxBatchAspect`, `fluxBatchSize`, `fluxBatchQty`).

### 2.2 Autenticación / Conexión con Atenea

El módulo no usa el token de Google/Firebase para la generación — usa un token propio del sistema Atenea (Keycloak de Falabella), que se extrae via bookmarklet desde la cookie `access_token` o `keycloak-token` de `atenea.falabella.com` y se envía al Cloud Function `ateneoTokenBridge` (URL: `https://us-central1-falabella-suite.cloudfunctions.net/ateneoTokenBridge`) con body `{ uid: 'shared', access_token, refresh_token }` (código del bookmarklet, fluxImages.js:107-118).

El proxy luego comparte ese token entre todos los usuarios (uid `'shared'`). El badge de conexión (`#fluxConnectionBadge`) muestra verde si `data.connected === true`.

Si una generación devuelve `err.error === 'SESSION_EXPIRED'` (fluxImages.js:46-47), el módulo actualiza el badge a rojo y muestra el aviso de re-autenticación con el bookmarklet. Antes de responder ese error, el proxy intenta una renovación controlada y un reintento para evitar falsos vencimientos.

### 2.3 Modo SKU — preview automático

Al escribir en `#fluxSkuInput` (debounce de 600ms, fluxImages.js:219), se llama a `loadSkuPreview(sku)`:

1. Determina el país seleccionado en `#fluxCountry` y construye las 3 URLs del CDN con `getProductImageUrls(sku, country, 3)` (fluxImages.js:10-14):
   - Patrón: `https://media.falabella.com/{store}/{sku}_{i+1}/w=800,h=800,fit=pad`
   - Mapa de stores: `co → falabellaCO`, `cl → falabellaCL`, `pe → falabellaPE`.
2. Descarga y convierte a base64 con `Promise.allSettled` + `urlToBase64` (fluxImages.js:17-27). Las imágenes que dan error (404, CORS, etc.) se descartan silenciosamente; si ninguna es válida se muestra el error en el preview.
3. Guarda las imágenes válidas en `loadedSkuImages` para reusar al generar.

### 2.4 Modo upload manual

El drop zone (`#fluxDropZone`) acepta hasta **4 imágenes** (límite estricto, fluxImages.js:277-281). Al superar el límite, el drop zone cambia a fondo rojo con cursor `not-allowed`. Las imágenes se previsualizan como miniaturas con botón de eliminar individual. Se aceptan solo archivos con `file.type.startsWith('image/')`.

### 2.5 Generación individual (handler `#fluxGenerateBtn`, fluxImages.js:382)

1. Lee los parámetros: `mode` (sku/upload), `aspectRatio`, `imageSize`, `qty`, `prompt`.
2. Registra actividad: `logUserActivity('GENERATE_FLUX_IMAGE', { qty, mode })`.
3. Construye el array `parts` con las imágenes en base64 (`{ inlineData: { data, mimeType } }`). Si hay texto de prompt, lo agrega como `{ text: prompt }` al final.
4. Arma el payload para el modelo:
   ```json
   {
     "model": "gemini-3.1-flash-image",
     "contents": [{ "parts": [...] }],
     "config": { "imageConfig": { "aspectRatio": "1:1", "imageSize": "1K" } }
   }
   ```
5. Lanza `qty` peticiones en paralelo (`Promise.allSettled`) con `callFlux(fluxPayload)` (fluxImages.js:443).
6. Por cada respuesta exitosa, extrae `candidates[].content.parts[]` donde `p.inlineData` existe y llama a `addResult()`.
7. Tras generar al menos 1 imagen, guarda el log en Firestore (`logGeneration`, fluxImages.js:72).

### 2.6 Generación en lote (handler `#fluxBatchGenerateBtn`, fluxImages.js:663)

1. Requiere que `batchRows` (array de `{ sku, prompt }`) esté poblado desde pasta de texto, CSV o Excel.
2. Lee parámetros de los pills de lote: `fluxBatchAspect`, `fluxBatchSize`, `fluxBatchQty`, `fluxBatchCountry`, `fluxBatchBasePrompt`.
3. Ejecuta con concurrencia **2** (`CONCURRENCY = 2`, fluxImages.js:687): mantiene 2 workers en paralelo, cada uno procesando el siguiente SKU disponible.
4. Por cada SKU: descarga imágenes del CDN → convierte a base64 → construye payload → llama a `qty` peticiones en paralelo → guarda resultados en `batchImages[sku]`.
5. Al completar, muestra el botón `#fluxBatchDownloadZip` y llama a `logGeneration` con `mode: 'lote'` y el array completo de SKUs.

### 2.7 Parsing de listas de SKUs (`parseTSV`, `parseCSV`, `parseExcel`, fluxImages.js:578-601)

El módulo acepta tres fuentes para el lote:
- **Pegar texto** (auto-detecta TSV si hay `\t`, o CSV): columna 0 = SKU, columna 1 = prompt opcional.
- **Archivo CSV** (`.csv`): mismo formato por líneas.
- **Archivo Excel** (`.xlsx` / `.xls`): importa `xlsx` dinámicamente (`await import('xlsx')`), lee la primera hoja, columna 0 = SKU, columna 1 = prompt.

El parser también se activa con `input` en el textarea (tiempo real) para mostrar la preview de la tabla antes de generar.

### 2.8 Llamada al proxy (`callFlux`, fluxImages.js:38)

- `POST FLUX_PROXY_URL` con `Content-Type: application/json` y body `{ payload }`.
- Si la respuesta no es OK, parsea el JSON de error. Si `err.error === 'SESSION_EXPIRED'`, lanza un error con ese mensaje exacto para que el llamador lo detecte y actualice el badge.
- No envía ningún header de autenticación desde el cliente — el token de Atenea está guardado en el Cloud Function bajo `uid: 'shared'`, no en el navegador.

## 3. Reglas de negocio específicas

- **Modelo fijo**: siempre se usa `gemini-3.1-flash-image` (fluxImages.js). No hay selector de modelo expuesto al usuario.
- **Opciones de aspecto**: piloteadas por el grupo `fluxAspect` (no se lee el listado del código, está en el HTML). El valor se pasa directamente como string a `config.imageConfig.aspectRatio`.
- **Opciones de tamaño**: `imageSize` del grupo `fluxSize`; por defecto `'1K'` si ningún radio está marcado (fluxImages.js:385).
- **Cantidad por generación**: valor del grupo `fluxQty`; por defecto 2 (individual) o 1 (lote) si no hay radio marcado. Cada unidad = 1 petición paralela al proxy.
- **Límite de imágenes en modo upload**: máximo 4 imágenes (fluxImages.js:277). El límite en SKU mode es implícito (máximo 3 imágenes de CDN, aunque se intenta siempre 3 y se descartan las que no carguen).
- **Concurrencia en lote**: exactamente 2 SKUs en paralelo (fluxImages.js:687). No es configurable desde la UI.
- **Función admin exclusiva**: el botón `📊` de estadísticas solo se inserta si `window.currentUser?.email === ADMIN_EMAIL` (`rankerize@gmail.com`, fluxImages.js:134). El resto de la UI es idéntica para todos los usuarios.
- **Logging de generación**: se registra siempre en Firestore si el usuario está autenticado (`window.currentUser`). Si no hay usuario, la función `logGeneration` retorna silenciosamente (fluxImages.js:75).
- **Nombres de archivo de salida**: patrón `{productName}_flux_{i+1}.{ext}` donde `ext` se extrae del `mimeType` devuelto por el modelo (normalmente `webp`).

## 4. Integraciones externas

| Integración | URL / Referencia | Uso |
|---|---|---|
| Flux Proxy (Cloud Function) | `https://us-central1-falabella-suite.cloudfunctions.net/fluxProxyShared` | Proxy hacia Gemini API con token compartido de Atenea; recibe `{ payload }` o `{ checkOnly: true }` |
| Atenea Token Bridge (Cloud Function) | `https://us-central1-falabella-suite.cloudfunctions.net/ateneoTokenBridge` | Recibe el token de Atenea desde el bookmarklet y lo guarda en el proxy con `uid: 'shared'` |
| CDN Falabella (imágenes de producto) | `https://media.falabella.com/{store}/{sku}_{i}/w=800,h=800,fit=pad` | Descarga imágenes de producto por SKU para usar como referencia visual en la generación |
| Firestore (`flux_logs`) | Colección; documentos sin ID predefinido (`addDoc`) | Log de cada sesión de generación: usuario, SKUs, cantidad de imágenes, modo, país, aspecto, timestamp |

## 5. Salida / Exportación

### 5.1 Descarga individual

Desde el enlace `⬇` en cada tarjeta de resultado: usa `href="data:{mimeType};base64,{b64}"` con atributo `download`. No requiere crear un objectURL — la descarga es directa desde el data URL incrustado en el DOM (fluxImages.js:504).

### 5.2 Descarga ZIP (generación individual, `#fluxDownloadAll`, fluxImages.js:543)

Importa `jszip` dinámicamente (`await import('jszip')`). Itera sobre todas las tarjetas `.flux-result-card`, convierte el `data-b64` a `Uint8Array` y agrega cada imagen al ZIP con su nombre. Descarga como `flux_ambientaciones.zip`.

### 5.3 Descarga ZIP por lote (`#fluxBatchDownloadZip`, fluxImages.js:883)

Misma lógica pero organiza los archivos en subcarpetas por SKU dentro del ZIP: `{sku}/{sku}_flux_{n}.{ext}`. Descarga como `flux_lote.zip`.

### 5.4 Lightbox

Al hacer click sobre cualquier imagen de resultado (individual o lote), `openLightbox(url, downloadUrl, fname)` (fluxImages.js:59) muestra la imagen a pantalla completa. Se cierra con el botón X, click fuera del modal, o tecla Escape.

### 5.5 Firestore (`flux_logs`)

Cada sesión exitosa guarda en Firestore:
```
{
  uid, email, displayName,
  skus: string[],
  skuCount: number,
  imageCount: number,
  mode: 'individual' | 'lote',
  country: 'co' | 'cl' | 'pe' | 'upload',
  aspectRatio: string,
  ts: serverTimestamp()
}
```

## 6. Tabla de funciones clave

| Función | Línea | Propósito |
|---|---|---|
| `initFluxImages()` | 120 | Punto de entrada; inicializa la UI, listeners, bookmarklet y verifica conexión |
| `getProductImageUrls(sku, country, count)` | 10 | Genera las URLs CDN de Falabella para un SKU dado (store + patrón de nombre) |
| `urlToBase64(url)` | 17 | Descarga una URL y la convierte a base64 + mimeType para envío al modelo |
| `fileToBase64(file)` | 29 | Convierte un `File` del input a base64 + mimeType |
| `callFlux(payload)` | 38 | Llama al proxy Cloud Function; maneja error `SESSION_EXPIRED` y errores HTTP |
| `checkSharedConnection()` | 92 | Verifica si el token de Atenea está activo en el proxy (`checkOnly: true`) |
| `initLightbox()` | 52 | Registra los listeners del lightbox (cierre por X, overlay, Escape) |
| `openLightbox(url, downloadUrl, fname)` | 59 | Abre el modal lightbox con la imagen y el link de descarga |
| `logGeneration({skus, imageCount, mode, ...})` | 72 | Escribe el log de uso en Firestore `flux_logs` |
| `loadSkuPreview(sku)` | 222 | Descarga las 3 imágenes del CDN de un SKU y las muestra como preview |
| `addManualFiles(files)` | 300 | Agrega imágenes al modo upload con validación del límite de 4 |
| `renderManualPreviews()` | 319 | Renderiza las miniaturas de imágenes subidas manualmente con botón de eliminar |
| `addResult(name, b64, mimeType, i)` | 487 | Crea la tarjeta de resultado con imagen, botón de descarga y hover de lightbox |
| `addError(name, msg)` | 522 | Crea tarjeta de error para variantes que fallaron |
| `parseTSV(text)` | 578 | Parsea texto tabulado (SKU en col 0, prompt en col 1) |
| `parseCSV(text)` | 585 | Parsea CSV (SKU en col 0, prompt en col 1) |
| `parseExcel(file)` | 592 | Importa `xlsx` dinámicamente y parsea la primera hoja del archivo |
| `renderBatchTable(rows, done)` | 603 | Renderiza la tabla de estado del lote con indicadores ⏳/✅/❌ por SKU |
| `processNext()` | 690 | Worker del pool de concurrencia 2 para generación por lote; consume `batchRows` con índice compartido |
| `addBatchResult(sku, b64, mimeType, fname)` | 763 | Agrega resultado de lote con lightbox y descarga individual |
| `openStatsModal()` | 794 | Solo admin: carga `flux_logs` de Firestore y muestra modal con KPIs de uso |

## 7. Pendientes / oportunidades de mejora

- **Sin selector de modelo**: el modelo `gemini-3.1-flash-image` está hardcodeado (fluxImages.js). Si Gemini actualiza sus modelos o lanza versiones más rápidas/baratas, requiere un cambio de código en lugar de un selector de UI.
- **Token compartido (uid `'shared'`)**: el proxy almacena el token de Atenea bajo un UID fijo para todos los usuarios. Si el token expira, **todos los usuarios** pierden acceso simultáneamente y cualquier usuario que tenga el bookmarklet puede renovarlo. No hay aislamiento por usuario ni rastreo de quién renovó el token por última vez.
- **El log de generación no incluye el prompt usado**: `logGeneration` (fluxImages.js:72) guarda SKUs, cantidad, modo, país y aspecto, pero no el texto de prompt ni el modelo exacto. Imposible reproducir o auditar una generación específica desde los logs.
- **Las imágenes generadas no se guardan en Firestore ni Storage**: solo se registra el *log* de la sesión. Las imágenes existen únicamente como data URLs en el DOM y en el ZIP descargado. Si el usuario cierra la pestaña antes de descargar, las pierde sin recuperación posible.
- **Sin caché de imágenes de SKU**: cada vez que el usuario escribe en `#fluxSkuInput` (después del debounce) se vuelven a descargar las 3 imágenes del CDN. Si el mismo SKU se usa múltiples veces en una sesión, las imágenes se re-descargan innecesariamente.
- **Concurrencia de lote fija en 2**: el valor `CONCURRENCY = 2` (fluxImages.js:687) podría exponerse como opción de UI para usuarios con mejor conectividad o cuando el proxy no tiene límite de rate.
- **El modal de estadísticas carga todos los logs sin paginación**: `openStatsModal()` (fluxImages.js:794) hace `getDocs(query(collection(db, 'flux_logs'), orderBy('ts', 'desc')))` sin límite. Con suficientes logs, esto se vuelve lento y costoso. Se muestra como máximo los últimos 20 en la tabla pero se descargan todos para calcular los KPIs globales.
- **Sin opción de texto de prompt en modo SKU para el lote individual vs. base**: el modo individual (pestaña "Individual") tiene un campo de prompt único. El lote puede usar un prompt por fila o un `basePrompt` global, pero no hay UI para combinar ambos (ej. `basePrompt + prompt_de_fila`). En el código (fluxImages.js:704), si la fila tiene `row.prompt`, usa ese; si no, usa `basePrompt` — no se concatenan.
