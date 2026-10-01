# Módulo Quitar Fondo / Background Remover (`#/fondos`) — Reglas de Negocio

Documento generado a partir del código real en `bgRemover.js`. Última revisión: 2026-06-30.

## 1. Objetivo

Permitir a los usuarios eliminar el fondo de imágenes de producto directamente en el navegador — sin enviar ningún archivo a un servidor — usando la librería `@imgly/background-removal` (WASM cliente). El resultado se puede descargar individualmente por imagen o en descarga secuencial de todas las procesadas, en formato PNG (transparencia) o JPEG con fondo blanco.

## 2. Cómo funciona / Flujo

### 2.1 Inicialización (`initBgRemover`, bgRemover.js:9)

Registra todos los event listeners sobre los elementos del DOM (`bgDropZone`, `bgFileInput`, `bgResultsGrid`, etc.). Si el elemento `bgDropZone` no existe en el DOM, la función retorna inmediatamente sin hacer nada (guard para vistas inactivas).

### 2.2 Ingesta de archivos (`handleFiles`, bgRemover.js:71)

1. Rechaza la entrada si hay un procesamiento en curso (`isProcessing === true`) — muestra alerta bloqueante.
2. Filtra los archivos recibidos (drag & drop o input file) para aceptar solo los que tengan `file.type.startsWith('image/')`.
3. Si ya había una sesión completada (todos los ítems tienen `resultBlob`), limpia automáticamente el estado antes de añadir los nuevos archivos.
4. Por cada archivo aceptado, genera un `id` único (`Date.now() + Math.random().toString(36)`), crea un `objectURL` para preview y empuja el objeto `{ id, file, originalUrl, resultBlob: null, resultUrl: null }` al array global `uploadedImages`.
5. Llama a `renderCard(id, url, filename)` para mostrar la tarjeta de preview en `#bgResultsGrid`.

### 2.3 Procesamiento por lote (`btnRemoveAll`, bgRemover.js:123)

1. Filtra los ítems sin `resultBlob` (`pendingImages`). Si no hay pendientes, no hace nada.
2. Registra actividad: `logUserActivity('REMOVE_BG', { imagesCount: pendingImages.length })`.
3. Lee el formato de salida seleccionado: `document.querySelector('input[name="bgExportFormat"]:checked').value` → `'png'` o `'jpeg'`.
4. Procesa las imágenes **secuencialmente** (bucle `for`, no `Promise.all`) para evitar saturar la memoria del navegador con varios procesos WASM simultáneos.
5. Por cada imagen:
   a. Muestra el spinner sobre la tarjeta.
   b. Llama a `imglyRemoveBackground(imgData.file, config)` con `publicPath: "https://unpkg.com/@imgly/background-removal@1.7.0/dist/"` (bgRemover.js:149) — carga los assets WASM desde un CDN externo para evitar problemas de CORS/404 en Vite durante desarrollo.
   c. Convierte el blob transparente al formato final con `processFormat(transparentBlob, exportFormat)`.
   d. Actualiza la tarjeta con el resultado y muestra el botón de descarga individual.
6. Al finalizar todos: deshabilita el spinner, habilita `btnDownloadZip`, cambia la barra de progreso a verde (`#10b981`) y el texto a "¡Proceso Completado!".

### 2.4 Conversión de formato (`processFormat`, bgRemover.js:232)

- Si el formato es `'png'`: retorna el blob transparente directamente, sin conversión.
- Si el formato es `'jpeg'`: crea un `<canvas>` del tamaño exacto de la imagen, rellena con `fillStyle = '#FFFFFF'` (blanco puro), dibuja la imagen recortada encima y exporta con `canvas.toBlob(resolve, 'image/jpeg', 0.95)` — calidad JPEG al 95%.

### 2.5 Descarga secuencial (`btnDownloadZip`, bgRemover.js:198)

No usa zip real (no hay librería JSZip aquí, a diferencia de `fluxImages.js`). Descarga las imágenes completadas una por una con una pausa de 300ms entre cada descarga (`setTimeout`, bgRemover.js:218) para evitar el bloqueo del navegador cuando el usuario tiene múltiples pestañas o el navegador tiene restricciones en descargas simultáneas. El nombre de cada archivo descargado sigue el patrón: `bg-removed-{nombreOriginalSinExtensión}.{formato}`.

### 2.6 Descarga individual

Desde el botón `⬇️ Descargar` de cada tarjeta (bgRemover.js:171): crea un `objectURL` temporal, dispara el click y lo revoca inmediatamente con `URL.revokeObjectURL`.

### 2.7 Limpieza total (`clearAll`, bgRemover.js:25)

Resetea `uploadedImages`, `processedCount`, limpia el grid, oculta controles y reinicia la barra de progreso. Vinculado al botón `#btnBgClearAll`.

## 3. Reglas de negocio específicas

- **Solo imágenes**: se filtran todos los archivos que no tengan `file.type.startsWith('image/')`. No hay restricción de extensión específica — cualquier tipo MIME de imagen es aceptado (PNG, JPEG, WebP, GIF, etc.).
- **Procesamiento bloqueante**: si `isProcessing === true`, no se puede iniciar un nuevo lote. El botón `btnRemoveAll` se deshabilita durante el proceso.
- **Auto-limpieza al re-usar**: si todas las imágenes de la sesión anterior ya tienen `resultBlob`, el módulo limpia el estado automáticamente al arrastrar nuevas imágenes — sin confirmación del usuario (bgRemover.js:78-87).
- **Transparencia PNG visual**: al mostrar el resultado PNG en la tarjeta, el fondo del contenedor `<div>` cambia a una cuadrícula de tablero de ajedrez vía imagen base64 incrustada (`url("data:image/png;base64,iVBOR...")`), bgRemover.js:165 — efecto puramente visual, no afecta el archivo descargado.
- **Fondo blanco JPEG**: calidad 0.95 y relleno blanco puro `#FFFFFF` (no transparente). No hay opción de elegir otro color de fondo en la versión actual.
- **Sin límite de imágenes por sesión**: a diferencia del módulo Flux (máximo 4 imágenes), este módulo no impone límite — el usuario puede arrastrar cualquier cantidad. El rendimiento depende de la memoria disponible del navegador.
- **Sin envío de datos al servidor**: toda la inferencia del modelo de segmentación ocurre en el navegador vía WebAssembly. Los archivos WASM se cargan desde `unpkg.com` (CDN) la primera vez y el navegador los cachea. Las imágenes nunca abandonan el dispositivo del usuario.

## 4. Integraciones externas

| Integración | URL / Referencia | Uso |
|---|---|---|
| `@imgly/background-removal` | NPM local (`import * as imglyBgRemoval`) | Librería principal de eliminación de fondo vía WASM |
| CDN unpkg (assets WASM) | `https://unpkg.com/@imgly/background-removal@1.7.0/dist/` | Carga diferida de modelos WASM en tiempo de ejecución (config `publicPath`, bgRemover.js:149) |

No hay llamadas a Cloud Functions, Firestore ni ninguna otra integración remota. Este módulo es completamente cliente-side.

## 5. Salida / Exportación

| Formato | Descripción |
|---|---|
| **PNG transparente** | Blob directo del resultado de `imglyRemoveBackground`. Sin fondo — soporta transparencia alfa. |
| **JPEG con fondo blanco** | Renderizado sobre canvas con `fillStyle = '#FFFFFF'`, exportado con calidad 0.95. |
| **Descarga individual** | Botón por tarjeta; nombre: `bg-removed-{nombre_original}.{ext}` |
| **Descarga en lote** | Descarga secuencial con pausa de 300ms; mismo patrón de nombre por archivo. No genera ZIP. |

El formato se lee una sola vez al iniciar el lote (`document.querySelector('input[name="bgExportFormat"]:checked').value`, bgRemover.js:133) y se aplica a todas las imágenes del lote en curso, independientemente de si el usuario cambia el selector mientras el proceso está corriendo.

## 6. Tabla de funciones clave

| Función | Línea | Propósito |
|---|---|---|
| `initBgRemover()` | 9 | Punto de entrada; registra todos los listeners del módulo |
| `clearAll()` | 25 | Resetea el estado completo de la sesión |
| `handleFiles(files)` | 71 | Valida, filtra y encola archivos de imagen; limpia sesión anterior si estaba completa |
| `renderCard(id, url, filename)` | 100 | Crea la tarjeta DOM con preview, spinner y botón de descarga (inicialmente oculto) |
| `processFormat(transparentBlob, format)` | 232 | Convierte el blob transparente a PNG (sin cambio) o JPEG (canvas + fondo blanco) |
| `updateProgress(current, total)` | 225 | Actualiza la barra de progreso y el contador numérico |
| Handler `btnRemoveAll` | 123 | Orquesta el procesamiento secuencial de todas las imágenes pendientes |
| Handler `btnDownloadZip` | 198 | Descarga secuencial de todas las imágenes completadas (sin ZIP real) |

## 7. Pendientes / oportunidades de mejora

- **El "Descargar Todas" no genera un archivo ZIP**: el botón `btnDownloadZip` descarga archivo por archivo con un delay. El módulo importa `jszip` como dependencia del proyecto (usada en `fluxImages.js`) pero no la usa aquí — un ZIP real mejoraría significativamente la experiencia en lotes grandes.
- **Sin persistencia de resultados**: al navegar a otra vista y volver, `uploadedImages` se vacía — el estado es puramente en memoria. No hay Firestore ni localStorage para las imágenes procesadas.
- **Sin control de calidad configurable para JPEG**: la calidad está hardcodeada en `0.95`. No hay selector de calidad expuesto al usuario.
- **Sin opción de color de fondo configurable para JPEG**: solo se ofrece blanco puro (`#FFFFFF`). Para productos sobre fondos de color o degradados no hay alternativa en la UI actual.
- **Carga de WASM en la primera imagen**: el aviso `bgInitialLoadWarning` (seoMetrics.js:30, bgRemover.js:30) se muestra al iniciar el lote y se oculta cuando el primer resultado llega (bgRemover.js:180). En conexiones lentas, la descarga de los modelos WASM desde CDN puede tardar 10-30 segundos en la primera sesión — no hay estimación de tiempo ni progreso de carga del modelo expuesto en la UI.
- **Sin concurrencia entre imágenes**: el procesamiento es estrictamente secuencial. Dado que `@imgly/background-removal` corre en un worker separado, sería posible procesar 2 imágenes simultáneamente para reducir el tiempo total a la mitad — limitado solo por la memoria del dispositivo.
- **Sin registro de actividad de descarga**: `logUserActivity('REMOVE_BG')` se llama al iniciar el procesamiento pero no al descargar. No hay forma de saber, desde Firestore/analytics, cuántas sesiones resultaron en descarga efectiva vs. sesiones que solo procesaron sin descargar.
