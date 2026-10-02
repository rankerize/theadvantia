# Módulo Product Template (`#/product-template`) — Reglas de Negocio

Documento generado a partir del código real en `productTemplate.js` y `functions/index.js`. Última revisión: 2026-06-30.

## 1. Objetivo

Analizar entre una y varias fotografías de un producto mediante visión artificial (Google Gemini 1.5 Flash) y generar automáticamente un título SEO, una descripción persuasiva y una lista de atributos técnicos inferidos visualmente. La salida se presenta en una vista editable y se puede copiar al portapapeles o descargar como JSON.

## 2. Cómo funciona / Flujo

### 2.1 Carga de imágenes

El usuario puede cargar fotos de dos maneras (productTemplate.js:19-40):
- **Click** en la zona `dropZone` → abre el selector de archivos nativo (`fileInput.click()`).
- **Drag & Drop** sobre `dropZone` → recibe el `FileList` del evento `drop`.

Solo se procesan los archivos cuyo `file.type.startsWith('image/')` (productTemplate.js:79). PDFs, videos u otros tipos se ignoran silenciosamente.

### 2.2 Compresión previa (`compressImage`, productTemplate.js:44-74)

Antes de guardar cada imagen en el array de estado `productPhotos[]`, se comprime a **800×800 px máximo** con calidad JPEG del **70%** usando un `<canvas>` (productTemplate.js:48-73):

1. Se crea un `Image` con la `base64` original.
2. Se calcula el nuevo tamaño manteniendo la proporción (fit-to-box).
3. Se dibuja en un canvas y se exporta como `canvas.toDataURL('image/jpeg', 0.7)`.

El objeto guardado en `productPhotos[]` tiene la forma `{ id, file, base64 }` donde `base64` es ya la versión comprimida.

### 2.3 Vista previa y gestión del array

`renderPreviews()` (productTemplate.js:96-126) redibuía el grid de miniaturas cada vez que se agrega o elimina una foto. El botón `btnProcessProductPhotos` se activa (`disabled = false`) solo cuando `productPhotos.length > 0`.

Cada miniatura tiene un botón `×` que filtra el objeto correspondiente del array por `id` y llama de nuevo a `renderPreviews()` (productTemplate.js:118-125).

### 2.4 Análisis con IA (listener `btnProcessProductPhotos click`, productTemplate.js:128)

1. Se instancia `getFunctions()` de Firebase y se obtiene la callable `'analyzeProductPhotos'` mediante `httpsCallable(functions, 'analyzeProductPhotos')` (productTemplate.js:139-140). Esta llamada requiere que el usuario esté autenticado en Firebase Auth — la SDK de Firebase inyecta automáticamente el token de sesión en las llamadas `httpsCallable`.
2. Se extrae solo el contenido base64 de cada foto (sin el prefijo `data:image/jpeg;base64,`) con `p.base64.split(',')[1]` (productTemplate.js:143).
3. Se envía `{ images: imagesData }` a la función (productTemplate.js:145).
4. Si `data.success === true`, se llama a `displayResults(data.analysis)` (productTemplate.js:149).
5. Se registra la actividad: `logUserActivity("product_template_analysis", { photosCount: productPhotos.length })` (productTemplate.js:150).
6. Si `data.success === false`, se lanza un `Error` con el mensaje del backend y se muestra un `alert` (productTemplate.js:151-153).

### 2.5 Análisis en el backend (`analyzeProductPhotos`, functions/index.js:1057)

La Cloud Function es de tipo `onCall` (requiere auth) y usa **Google Gemini 1.5 Flash** (functions/index.js:1070):

```javascript
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
```

El prompt enviado a Gemini (functions/index.js:1072-1086):

> Actúa como un experto en SEO y E-commerce para Falabella. Analiza las imágenes adjuntas de este producto y genera:
> 1. Un título optimizado para SEO (máximo 60 caracteres).
> 2. Una descripción persuasiva y detallada (máximo 500 caracteres).
> 3. Una lista de atributos técnicos (material, color, marca, dimensiones, etc.) que puedas identificar.

El formato de respuesta exigido al modelo es JSON puro:
```json
{
  "title": "...",
  "description": "...",
  "attributes": [
    { "name": "Nombre del atributo", "value": "Valor" }
  ]
}
```

Las imágenes se pasan a Gemini como `inlineData` con `mimeType: "image/jpeg"` forzado para todas (functions/index.js:1089-1094), independientemente del formato real del archivo. Gemini recibe todas las imágenes en un único request multimodal: `[prompt, ...imageParts]` (functions/index.js:1096).

La respuesta se limpia de bloques de código markdown (`\`\`\`json` y `\`\`\``) antes del `JSON.parse` (functions/index.js:1101-1102).

### 2.6 Presentación de resultados (`displayResults`, productTemplate.js:166)

Los tres campos del objeto `analysis` se mapean a elementos del DOM:
- `analysis.title` → `#resProductTitle` (texto editable con `contenteditable`).
- `analysis.description` → `#resProductDesc` (texto editable).
- `analysis.attributes` → tabla `#resProductAttrTable`, una fila por atributo con dos celdas `contenteditable` (Nombre / Valor).

El análisis completo también se guarda en `window.lastProductAnalysis` (productTemplate.js:192) para facilitar la descarga posterior sin necesidad de releer el DOM.

## 3. Reglas de negocio específicas

- **Límite visual de título: 60 caracteres** — indicado en el prompt al modelo, pero no verificado en el cliente. El usuario puede editar el título resultante a cualquier longitud sin ninguna advertencia.
- **Límite visual de descripción: 500 caracteres** — mismo caso: es una instrucción al modelo, no una restricción en la UI.
- **Solo imágenes**: archivos no imagen se ignoran sin mensaje de error al usuario (productTemplate.js:79).
- **Compresión forzada a JPEG 70%**: independientemente del formato original (PNG, WebP, HEIC), la imagen se convierte a JPEG al 70% de calidad antes de enviarse. Esto puede degradar imágenes con transparencia (PNG con fondo alfa aparecerán con fondo negro en el canvas).
- **`mimeType: "image/jpeg"` hardcodeado**: aunque la imagen original sea PNG, se le dice a Gemini que es JPEG (functions/index.js:1093). El comentario en el código mismo reconoce esto: `"Asumimos jpeg, Gemini suele manejarlo bien aunque sea png"`.
- **Autenticación obligatoria**: al ser `onCall`, Firebase verifica el token del usuario. Si la sesión expiró, la llamada falla con un error de autenticación estándar de Firebase — el módulo lo captura en el `catch` y muestra un `alert` genérico (productTemplate.js:156-158).
- **Las celdas de la tabla de atributos son editables**: tanto el nombre como el valor de cada atributo son `contenteditable`, permitiendo correcciones manuales antes de exportar (productTemplate.js:179-180).

## 4. Integraciones externas

| Integración | Endpoint / Identificador | Tipo | Propósito |
|---|---|---|---|
| Firebase Callable `analyzeProductPhotos` | `'analyzeProductPhotos'` vía SDK `httpsCallable` | Firebase onCall (auth requerida) | Orquesta el análisis visual multimodal |
| Google Gemini 1.5 Flash | API de `@google/generative-ai` interna a la Cloud Function | — | Modelo de visión artificial que analiza las fotos y genera título, descripción y atributos |
| Firebase Auth | SDK Firebase (cliente) | — | Autenticación implícita; sin sesión activa la llamada `httpsCallable` falla |

La API key de Gemini se gestiona como Firebase Secret (`GEMINI_API_KEY`, functions/index.js:11) y nunca se expone al cliente.

## 5. Salida / Exportación

### 5.1 Copia al portapapeles (`btnCopyProductData`, productTemplate.js:195-206)
Lee el DOM en el momento del click (no `window.lastProductAnalysis`) para capturar ediciones manuales. Formatea como texto plano:
```
TITULO:
{título}

DESCRIPCION:
{descripción}

ATRIBUTOS:
{nombre1}: {valor1}
{nombre2}: {valor2}
...
```
Llama a `navigator.clipboard.writeText(fullText)` y muestra un `alert("Copiado al portapapeles")`.

### 5.2 Descarga JSON (`btnDownloadProductJson`, productTemplate.js:209-225)
Lee el DOM para capturar ediciones manuales. Genera un JSON con la estructura:
```json
{ "title": "...", "desc": "...", "attributes": [{ "name": "...", "value": "..." }] }
```
Nota: el campo se llama `"desc"` (no `"description"`) en el JSON descargado (productTemplate.js:213), mientras que en la respuesta original de la Cloud Function se llama `"description"`. Esta inconsistencia puede afectar a cualquier sistema que consuma el JSON descargado esperando el nombre estándar.

El archivo se descarga como `product-data-{timestamp}.json` (productTemplate.js:220).

No hay push a Firestore, no hay exportación a Excel y no hay almacenamiento persistente de sesión.

## 6. Tabla de funciones clave

| Función | Línea (productTemplate.js) | Propósito |
|---|---|---|
| `initProductTemplate()` | 6 | Inicializa listeners de drag & drop, file input y botones |
| `compressImage(base64Str)` | 44 | Redimensiona a 800×800 máx. y convierte a JPEG 70% via canvas |
| `handleFiles(files)` | 76 | Itera `FileList`, filtra imágenes, comprime y agrega a `productPhotos[]` |
| `renderPreviews()` | 96 | Redibuia el grid de miniaturas y actualiza el estado del botón Procesar |
| Listener `btnProcessProductPhotos click` | 128 | Llama a `analyzeProductPhotos` vía Firebase httpsCallable, registra actividad |
| `displayResults(analysis)` | 166 | Rellena el DOM con título, descripción y tabla de atributos editables |
| `analyzeProductPhotos` (backend) | functions/index.js:1057 | Recibe imágenes base64, llama a Gemini 1.5 Flash y parsea la respuesta JSON |

## 7. Pendientes / oportunidades de mejora

- **Sin validación de longitud en la UI**: el prompt instruye al modelo con límites de 60 caracteres para el título y 500 para la descripción, pero el cliente no verifica estos límites ni antes ni después de recibir la respuesta. Si Gemini ignora la restricción (lo cual ocurre en promedio con nombres de producto largos), el usuario puede no notarlo hasta publicar en el CMS.

- **`mimeType: "image/jpeg"` hardcodeado para todas las imágenes**: imágenes PNG con transparencia se convertirán a JPEG con fondo negro en el canvas antes del envío, y aun así se declaran como JPEG a Gemini. Aunque Gemini generalmente lo maneja, es técnicamente incorrecto y puede producir análisis de color erróneos (ej. detectar "negro" como color base de productos con fondo transparente).

- **El JSON descargado usa `"desc"` en vez de `"description"`**: inconsistencia entre el esquema de la Cloud Function (`analysis.description`) y el objeto del JSON descargado (productTemplate.js:213). Cualquier pipeline automatizado que consuma el JSON descargado fallará al buscar `description`.

- **`window.lastProductAnalysis` no se actualiza con ediciones manuales**: si el usuario edita el título o los atributos en las celdas `contenteditable` y luego descarga el JSON, el código lee el DOM correctamente (productTemplate.js:210-215). Pero si algún otro módulo o script futuro consume `window.lastProductAnalysis` directamente, recibirá los datos originales de la IA, no los editados.

- **Sin límite de número de imágenes ni de tamaño total**: el módulo no impone un máximo de fotos ni controla el tamaño del payload enviado a Firebase. Con muchas imágenes de alta resolución (antes de la compresión), el `FileReader` y el canvas pueden consumir memoria significativa. La Cloud Function `analyzeProductPhotos` tampoco valida un máximo de imágenes (solo verifica que `images.length > 0`, functions/index.js:1062).

- **Sin reintento automático en caso de error**: si la llamada a `analyzeProductPhotos` falla (timeout, error de red, cuota de Gemini agotada), se muestra un `alert` y `emptyView` vuelve a aparecer. No hay botón de reintento ni preservación del intento fallido — el usuario debe hacer click de nuevo en "Procesar" con las mismas fotos aún cargadas.

- **El módulo no limpia `productPhotos[]` después del análisis**: tras un análisis exitoso, las fotos siguen cargadas y el usuario puede ejecutar el análisis de nuevo sin necesidad de volver a cargar las imágenes. Esto es conveniente, pero también significa que un segundo click en "Procesar" generará un segundo consumo de cuota de Gemini con exactamente las mismas imágenes.
