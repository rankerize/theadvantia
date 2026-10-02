# ADENDA PROTOCOLO MAESTRO v3.7
## Regla: Doble entregable HTML — Falabella + VTEX (obligatorio por defecto)

**Para pegar dentro de las instrucciones personalizadas del proyecto "HTML INPAGUE FALABELLA", a continuación de la ADENDA v3.6 (PASO 5D).**

---

## PASO 5E — VERSIÓN VTEX (nuevo, obligatorio por defecto)

### Regla de oro

A partir de esta adenda, **todo SKU se entrega en dos formatos de HTML**, no solo uno:

```
1. HTML FALABELLA (formato original, PASO 5/5D) — el que se sube al inPage de Falabella.com
2. HTML VTEX (nuevo, este paso) — versión responsive para renderizar fuera del inPage
   de Falabella (Chrome directo, VTEX, o cualquier página ancha), donde el HTML basado
   en float pierde el centrado y la estructura.
```

No se pide la versión VTEX cada vez — se genera siempre, junto con la de Falabella, como
parte del mismo entregable del SKU. Solo se omite si el cliente pide explícitamente un único
formato.

### Por qué existe esta versión

El HTML de Falabella usa `float: left` para las parejas de imágenes porque es lo único
compatible con el renderer inPage de Falabella (sin `<div>`, sin CSS externo). Ese mismo HTML,
al abrirse fuera del inPage (Chrome directo, VTEX u otra plantilla de página ancha), no se
centra y pierde la estructura de columnas. La versión VTEX resuelve esto con un contenedor
centrado y flexbox, manteniendo el contenido idéntico.

### Regla de oro del contenido: transformación mecánica, nunca reescritura

La versión VTEX se genera **a partir del HTML de Falabella ya aprobado**, cambiando
únicamente el mecanismo de layout (float → flexbox). Texto, alt de imágenes, IDs de Drive,
URLs de video y orden de secciones deben quedar **idénticos** — cero contenido nuevo, cero
contenido perdido. Antes de entregar, se valida por comparación de texto normalizado + lista
de `src` de `<img>` + lista de `src` de `<iframe>` entre el HTML Falabella y el HTML VTEX: deben
coincidir exactamente.

### Transformación exacta (float → flexbox)

**1. Contenedor raíz (envuelve todo el HTML):**
```html
<div style="max-width: 700px;margin: 0 auto;font-family: Inter, sans-serif;">
  ... resto del contenido ...
</div>
```

**2. Cada pareja de imágenes flotadas se convierte en una fila flexbox:**

Falabella (original):
```html
<p style="float: left;width: 265px;margin-right: 20px;...">...</p>
<p style="float: left;width: 265px;...">...</p>
<br style="clear: both;" />
```

VTEX (transformado):
```html
<div style="display: flex;flex-wrap: wrap;justify-content: center;gap: 20px;margin-bottom: 20px;">
  <div style="flex: 1 1 260px;max-width: 265px;text-align: center;color: initial;font-size: 16px;font-family: Inter, sans-serif;">
    <img src="https://lh3.googleusercontent.com/d/[ID]" alt="[igual al original]" style="max-width: 100%;height: auto;border: 0px;margin-bottom: 10px;" />
    <strong style="font-size: 20px;color: #000000;display: block;margin-bottom: 6px;">[igual al original]</strong>
    [texto igual al original]
  </div>
  <div style="flex: 1 1 260px;max-width: 265px;text-align: center;color: initial;font-size: 16px;font-family: Inter, sans-serif;">
    ... segunda imagen de la pareja ...
  </div>
</div>
```
Notas: se elimina el atributo `width="260"` de la imagen (se reemplaza por `max-width:100%` para
que escale), y se elimina el `<br />` interno (el flexbox no lo necesita). El `<br style="clear: both;" />`
que cerraba la pareja en Falabella no se traslada — ya no hace falta.

**3. Video (si existe), se envuelve en contenedor responsive 16:9 en vez del iframe de tamaño fijo:**
```html
<div style="position: relative;max-width: 550px;margin: 0 auto 24px auto;padding-bottom: 56.25%;height: 0;overflow: hidden;">
  <iframe src="https://www.youtube.com/embed/[VIDEO_ID]" style="position: absolute;top: 0;left: 0;width: 100%;height: 100%;border: 0;" allowfullscreen title="[igual al original si existe]"></iframe>
</div>
```
Mantiene su posición original (primero, antes de las imágenes, según Módulo 7 / PASO 5D).

**4. Imagen de contenido / infografía ("Qué incluye", width 450 o 550) se hace responsive:**
```html
<img src="https://lh3.googleusercontent.com/d/[ID]" alt="[igual al original]" style="max-width: 100%;width: [450 o 550]px;height: auto;border: 0px;margin-bottom: 10px;" />
```
Se elimina el atributo `width="450"`/`width="550"` y se reemplaza por `style` con `max-width:100%`
más el ancho original como tope, para que escale hacia abajo en mobile sin crecer más allá del
tamaño original en desktop.

**5. Todo lo demás (títulos, subtítulos de sección, párrafos, listas, FAQ) se copia sin cambios** —
no llevan float ni necesitan transformación.

### Por qué este patrón funciona sin media queries

`flex-wrap: wrap` en el contenedor de cada pareja hace que las dos columnas se acomoden una
al lado de la otra en pantallas anchas y se apilen automáticamente en una sola columna cuando
el ancho disponible baja de ~260px por columna (mobile) — sin necesidad de `@media queries`,
que de todas formas no se pueden usar sin `<style>` tags. Validado con capturas a 1400px
(desktop, 2 columnas) y 375px (mobile, 1 columna apilada) sobre el SKU 70624.

### Diferencia clave con las reglas de Falabella (PASO 5)

La versión VTEX **no** tiene que cumplir la lista blanca de tags de Falabella — puede usar
`<div>` libremente, porque no se sube al inPage de Falabella.com. Es un artefacto aparte,
pensado para renderizarse en Chrome directo, VTEX, u otras páginas anchas. Nunca se debe
confundir ni mezclar: el archivo Falabella conserva el formato float/sin-div de siempre; el
archivo VTEX es la versión con flexbox/div, en un archivo separado.

### Convención de nombres y entrega

```
[SKU]_INPAGE.html          → versión Falabella (formato original, PASO 5/5D)
[SKU]_VTEX.html            → versión VTEX (este paso, PASO 5E)
```
Ambos se entregan juntos como parte del mismo paquete de entregables del SKU (ver PASO 9 /
checklist final), y ambos se guardan en la carpeta que el cliente indique para ese proyecto
(ej. subcarpeta `VTEX` dentro de la carpeta de HTML finales, cuando exista).

### Checklist antes de entregar la versión VTEX

```
¿Se generó a partir del HTML Falabella ya aprobado (no reescrito desde cero)?   SI / NO
¿El contenedor raíz usa max-width:700px + margin:0 auto?                        SI / NO
¿Cada pareja de imágenes es un flex row con flex-wrap:wrap?                     SI / NO
¿El video (si existe) está en contenedor responsive 16:9, en su posición?       SI / NO
¿Las imágenes de contenido/infografía son responsive (max-width:100%)?          SI / NO
¿Texto, alt, IDs de Drive y URLs son idénticos al HTML Falabella (validado)?    SI / NO
¿Se guardó con el sufijo _VTEX.html en la carpeta correspondiente?              SI / NO

Todos SI → versión VTEX aprobada.
Algún NO → corregir antes de entregar.
```

---

**Origen de esta adenda:** proyecto Meyer/KitchenAid/Farberware (28 SKUs, Falabella Colombia),
donde el cliente reportó que el HTML de Falabella (correcto en el inPage) se veía descentrado
y sin estructura al abrirse en Chrome directo o VTEX. Se validó el patrón flexbox en el SKU
70624 (capturas 1400px/375px) antes de aplicarlo al lote completo de 28 SKUs con un conversor
automático que preserva el contenido exacto.

**Creado por:** MEDHIA CatalogAI
**Versión:** 3.7 (Septiembre 2026)
**Se agrega a:** PROTOCOLO_MAESTRO_v3.4 + ADENDA_v3.5 + ADENDA_v3.6
**Compatibilidad:** Falabella Colombia, Chile, Perú
**Status:** LISTO PARA PRODUCCION
