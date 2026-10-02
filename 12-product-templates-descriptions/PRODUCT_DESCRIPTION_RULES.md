# Módulo Contenido PDP (`#/product-description`) — Reglas de Negocio

Documento generado a partir del código real en `productDescription.js`. Última revisión: 2026-06-30.

## 1. Objetivo

Para uno o varios SKUs de Falabella Colombia, extraer automáticamente la ficha técnica y reseñas del producto desde la plataforma y luego generar un bloque HTML descriptivo listo para usar en la PDP (Product Description Page), todo sin intervención manual de redacción. El flujo es siempre dos pasos: primero **Analizar** (extracción de datos), luego **Generar HTML** (redacción con IA).

## 2. Cómo funciona / Flujo

### Paso 0 — Entrada de SKUs

El usuario pega uno o más SKUs en el textarea `#pdSkuInput`. Los SKUs se parsean con `parseSkus()` (productDescription.js:27-32): se separan por salto de línea, coma o punto y coma, se hace `trim()` de cada token y se filtra con la expresión regular `/^\d{5,}$/` — es decir, **solo se aceptan cadenas 100% numéricas de 5 dígitos o más**. Cualquier texto alfanumérico o con prefijo de letra (ej. `ABC123`) es descartado en silencio.

Un contador en vivo muestra `N SKU(s) detectado(s)` mientras el usuario escribe (productDescription.js:19-24).

### Paso 1 — Analizar (`handleAnalyze`, productDescription.js:36-78)

Al hacer clic en "Analizar SKUs":

1. Se inicializa el array global `rows` (productDescription.js:7) con un objeto por SKU, todos en estado `analyzing` y `selected: true`:

```js
// productDescription.js:40-44
rows = skus.map(sku => ({
    sku, productName: '', brand: '', specs: [], imageUrls: [],
    bvReviews: [], totalReviews: 0, avgRating: '0',
    oldHtml: '', newHtml: '', status: 'analyzing', selected: true
}));
```

2. Se llama a la Cloud Function **`scrapePDPData`** vía `httpsCallable` (productDescription.js:53) **en paralelo** para todos los SKUs simultáneamente (`Promise.all`, productDescription.js:55). Cada llamada recibe solo `{ sku }`.

3. Si la CF devuelve `success: true`, el objeto `rows[i]` se enriquece con los datos reales (`productName`, `brand`, `specs`, `bvReviews`, `totalReviews`, `avgRating`) y el estado pasa a `ready`. Las URLs de imágenes **no vienen de la CF** — se construyen localmente de forma determinística (productDescription.js:61-63):

```js
// productDescription.js:61-63
imageUrls: Array.from({ length: 4 }, (_, n) =>
    `https://media.falabella.com/falabellaCO/${rows[i].sku}_${n + 1}/w=800,h=800,fit=pad`)
```

Se asumen siempre 4 imágenes numeradas `_1` a `_4` en el CDN de Falabella. No hay validación de que esas imágenes existan realmente.

4. Si la CF devuelve `success: false` o lanza excepción, el estado pasa a `error` y `productName` muestra el mensaje de error.

5. La tabla se re-renderiza (`renderTable()`) tras cada respuesta individual, por lo que el usuario ve el progreso en tiempo real.

El campo `oldHtml` se inicializa vacío y puede ser editado manualmente por el usuario en la columna "HTML Anterior" de la tabla antes de generar (productDescription.js:213-215, via `window._pdSetOld`).

### Paso 2 — Generar HTML (`handleGenerateSelected`, productDescription.js:82-118)

Solo procesa los SKUs cuyo `row.selected === true` y cuyo estado sea `ready` o `done`. La selección se controla con checkboxes individuales por fila y un "Seleccionar todo" (productDescription.js:240-244).

Se llama a la Cloud Function **`generateProductHtml`** de forma **secuencial** (`for...of`, productDescription.js:92), una por una, para evitar saturar la CF:

```js
// productDescription.js:97-105
const result = await fn({
    mode: 'sku',
    productName: row.productName,
    brand:       row.brand,
    specs:       row.specs,
    imageUrls:   row.imageUrls,
    reviews:     row.bvReviews,
    reviewStats: { totalReviews: row.totalReviews, avgRating: row.avgRating }
});
```

Si la CF responde con `success: true`, el HTML generado se guarda en `rows[i].newHtml` y el estado pasa a `done`. El campo `oldHtml` no es enviado a la CF — es solo referencia visual para el operador.

La actividad se registra vía `logUserActivity('GENERATE_PRODUCT_DESCRIPTION', { productsCount: selected.length })` (productDescription.js:88).

### Paso 3 — Exportación a Excel (`handleDownload`, productDescription.js:122-135)

Se genera un Excel con la librería `xlsx` (SheetJS), con las columnas:

| Columna | Fuente |
|---|---|
| SKU | `row.sku` |
| Producto | `row.productName` |
| Marca | `row.brand` |
| HTML Nuevo | `row.newHtml` (vacío si no se generó) |
| HTML Anterior | `row.oldHtml` (vacío si el usuario no pegó nada) |

Anchos de columna fijados: SKU=14, Producto=45, Marca=16, HTML Nuevo=90, HTML Anterior=90 (productDescription.js:131). El archivo se descarga como `contenido-pdp-{timestamp}.xlsx`.

## 3. Reglas de negocio específicas

- **SKU válido**: solo numérico, 5 dígitos mínimo (regex `/^\d{5,}$/`). SKUs alfanuméricos o de menos de 5 dígitos se descartan sin aviso visible al usuario (solo se omiten).
- **Paralelo en análisis, secuencial en generación**: el scraping va en paralelo (`Promise.all`); la generación va una por una. Esto es intencional para el flujo de IA (productDescription.js:92 — `for...of` con `await` dentro).
- **Imágenes hardcodeadas**: siempre se mandan 4 URLs de imagen al CDN de Falabella, independientemente de si el producto tiene más o menos fotos disponibles. No existe validación previa de existencia.
- **`oldHtml` es solo referencial**: el HTML anterior no se envía a la CF y no influye en la generación. Su único propósito es mostrarse en la columna de la tabla y en el Excel como referencia del operador.
- **Selección por estado**: los checkboxes solo son habilitados para filas con estado `ready` o `done`. Los estados `analyzing`, `generating` y `error` deshabilitan el checkbox (productDescription.js:174-178).
- **Regeneración**: un row en estado `done` puede volver a seleccionarse y generarse de nuevo; `handleGenerateSelected` incluye `r.status === 'done'` en el filtro (productDescription.js:83).
- **Botón "Descargar"**: solo aparece al terminar al menos una generación exitosa (productDescription.js:117 — `show('pdBtnDownload')`).

## 4. Integraciones externas

| Integración | Endpoint / Identificador | Propósito |
|---|---|---|
| Firebase Cloud Function `scrapePDPData` | `httpsCallable(getFunctions(), 'scrapePDPData')` | Extrae nombre, marca, specs y reseñas BV del producto dado el SKU |
| Firebase Cloud Function `generateProductHtml` | `httpsCallable(getFunctions(), 'generateProductHtml')` | Genera el HTML descriptivo de la PDP a partir de los datos estructurados del producto |
| CDN Falabella Media | `https://media.falabella.com/falabellaCO/{SKU}_{1..4}/w=800,h=800,fit=pad` | URLs de imágenes del producto (construidas localmente, no desde la CF) |
| `logUserActivity` (main.js) | Evento `GENERATE_PRODUCT_DESCRIPTION` | Registro de auditoría de uso |

No hay integración con Firestore, Supabase ni Google Search Console en este módulo.

## 5. Salida / Exportación

- **Tabla en pantalla**: columnas SKU, Producto, Marca, conteo de specs, reseñas BV (rating + cantidad + cantidad con texto), HTML Anterior (editable en textarea), HTML Nuevo (con botón "Copiar HTML" al portapapeles), Estado (punto de color + etiqueta).
- **Copiar al portapapeles**: botón por fila (`window._pdCopyNew`, productDescription.js:246-251). Cambia a "✅ Copiado" durante 2 segundos y luego re-renderiza la tabla.
- **Exportación a Excel**: archivo `contenido-pdp-{timestamp}.xlsx` con 5 columnas (ver sección 2, Paso 3). **No hay push a Firestore ni a Supabase.**

## 6. Tabla de funciones clave

| Función | Línea | Propósito |
|---|---|---|
| `initProductDescription()` | 11 | Inicializa listeners de UI (botones + contador en vivo de SKUs) |
| `parseSkus()` | 27 | Parsea el textarea y filtra solo SKUs numéricos ≥5 dígitos |
| `handleAnalyze()` | 36 | Orquesta el scraping paralelo de todos los SKUs vía CF `scrapePDPData` |
| `handleGenerateSelected()` | 82 | Genera HTML secuencialmente para los SKUs seleccionados vía CF `generateProductHtml` |
| `handleDownload()` | 122 | Exporta todas las filas a Excel con SheetJS |
| `renderTable()` | 139 | Re-renderiza la tabla completa de SKUs con su estado actual |
| `window._pdToggleAll()` | 240 | Selecciona/deselecciona todos los rows en estado `ready` o `done` |
| `window._pdToggleRow()` | 244 | Cambia `selected` de un row individual |
| `window._pdSetOld()` | 245 | Actualiza `oldHtml` de un row cuando el usuario edita el textarea |
| `window._pdCopyNew()` | 246 | Copia `newHtml` al portapapeles y muestra confirmación temporal |
| `setStatus()` | 255 | Muestra/oculta el mensaje de estado global del módulo |
| `escHtml()` | 271 | Escapa HTML para renderizar en textarea sin XSS |

## 7. Pendientes / oportunidades de mejora

- **Sin validación de existencia de imágenes**: las 4 URLs de imagen se construyen asumiendo siempre que el CDN tiene `SKU_1` a `SKU_4`. Si un producto tiene menos imágenes o numeración distinta, la CF `generateProductHtml` recibirá URLs de imágenes que devuelven 404, sin que el módulo lo detecte ni lo corrija. Sería conveniente verificar las URLs antes de enviarlas, o que la CF `scrapePDPData` devuelva las URLs reales del producto en vez de construirlas localmente.

- **SKU inválido descartado en silencio**: `parseSkus()` filtra cualquier token que no sea numérico puro de 5+ dígitos, pero no hay ningún aviso visible al usuario de qué SKUs fueron ignorados. Si el usuario pega `ABC123` junto a SKUs válidos, solo verá que el conteo es menor al esperado.

- **`oldHtml` no influye en la generación**: el campo existe en la tabla y en el Excel, pero la CF `generateProductHtml` no recibe ese valor. La semántica de "HTML Anterior" sugiere que podría usarse como contexto o referencia para mejorar la generación (ej. detectar qué formato se usaba antes), pero esa lógica no existe actualmente.

- **Sin límite de SKUs por lote**: el `Promise.all` en `handleAnalyze` lanza todas las llamadas a `scrapePDPData` en paralelo sin límite. Un lote grande (decenas de SKUs) podría saturar la Cloud Function con múltiples invocaciones simultáneas. La fase de generación sí es secuencial, pero la de análisis no tiene control de concurrencia.

- **La generación no tiene manejo de error parcial visible en la UI final**: si un row queda en estado `error` después de la generación, el botón "Descargar" aparece igual (`show('pdBtnDownload')` se ejecuta siempre al finalizar el loop), y ese row se exporta con `HTML Nuevo` vacío sin advertencia destacada. El status global solo dice "Revisa el HTML generado" sin distinguir cuántas generaciones fallaron.

- **Sin preview del HTML generado**: el único output disponible después de la generación es el botón "Copiar HTML" y el Excel. No hay ningún modal de previsualización renderizada del HTML (como el que existe en el módulo SEO On Page), lo que obliga al operador a abrir el HTML en otro editor para revisar el resultado antes de pegarlo en el CMS.
