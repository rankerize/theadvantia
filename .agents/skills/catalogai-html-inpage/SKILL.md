---
name: catalogai-html-inpage
description: Generación y validación de descripciones HTML inPage para Falabella (Colombia, Chile, Perú) y versión responsive VTEX según el Protocolo CatalogAI (v3.4, Adendas 3.5, 3.6 Módulo 7, 3.7 VTEX y SKILL v2.4 SEO).
---

# Protocolo CatalogAI — HTML inPage Falabella & VTEX

Esta skill define el procedimiento estándar para la investigación SEO, estructuración, redacción y validación de descripciones HTML **inPage** para **Falabella Seller Center** y su versión responsive para **VTEX**.

---

## 📂 Ubicación de Recursos e Insumos en el Repositorio

- **Directorio raíz del módulo:** `html-inpage-falabella/`
- **Protocolos y Adendas:** [html-inpage-falabella/protocolo/](file:///Users/cesarandresjimenezarci/Documents/Advantia/html-inpage-falabella/protocolo)
  - `PROTOCOLO_MAESTRO_v3.4.md`: Flujo maestro de 9 pasos.
  - `ADENDA_v3.5_CONTENIDO_ADITIVO.md`: Regla de contenido SEO y FAQ aditivo (nunca sustractivo).
  - `ADENDA_v3.6_MODULO7.md`: Estructura HTML por defecto (Módulo 7: Título + 3 parejas de imágenes + Texto).
  - `ADENDA_v3.7_VTEX.md`: Reglas y conversión a versión responsive VTEX.
  - `SKILL-v2.4-PROTOCOLO-GENERICO-DESCARGABLE.md`: Protocolo SEO de 10 palabras clave y cálculo de cobertura.
- **Script de Validación:** [html-inpage-falabella/scripts/validar_html.py](file:///Users/cesarandresjimenezarci/Documents/Advantia/html-inpage-falabella/scripts/validar_html.py)
- **Plantillas Excel:** [html-inpage-falabella/plantillas/](file:///Users/cesarandresjimenezarci/Documents/Advantia/html-inpage-falabella/plantillas)
- **Documentos SEO:** [html-inpage-falabella/seo/](file:///Users/cesarandresjimenezarci/Documents/Advantia/html-inpage-falabella/seo)

---

## ⚡ Reglas Clave de HTML para Falabella (inPage)

### Etiquetas Permitidas (con estilos inline):
`p`, `ul`, `li`, `img`, `iframe`, `em`, `strong`, `br`, `a`

### Elementos Prohibidos (Fallan validación):
- ❌ No etiquetas `div`, `header`, `footer`, `section`, `style`, `script`.
- ❌ No encabezados `h1`, `h2`, `h3`, `h4`, `h5`, `h6`.
- ❌ No atributos `class=`, `id=`.
- ❌ No emojis.
- ❌ No enlaces a imágenes en `drive.google.com/uc?id=` (usar siempre CDN directo `https://lh3.googleusercontent.com/d/[ID]`).

---

## 🏗️ Estructura por Defecto: Módulo 7

1. **Título Principal Centrado** (24px, fuente Inter).
2. **Video de YouTube** (`iframe` 550x309) — *Solo si existe URL real enviada por el cliente*.
3. **3 Parejas de Imágenes Flotadas** (`float: left`, width 265px cada una, total 6 imágenes) con subtítulo (20px) y descripción breve, cerradas con `<br style="clear: both;" />`.
4. **Sección Qué incluye / Especificaciones** (Subtítulo 20px, lista `<ul><li>`). Si es set/juego y hay infografía oficial de piezas, se incluye la imagen antes de la lista (450px).
5. **Guía de Materiales y Salud** (Cuando aplique ángulo de salud/material).
6. **Preguntas Frecuentes (FAQ)** (Para optimización IA y búsquedas frecuentes).

---

## 🧪 Ejecución del Validador HTML

Para validar cualquier entrega de SKU en Falabella y VTEX, ejecutar:

```bash
python html-inpage-falabella/scripts/validar_html.py productos/[SKU]/[SKU]_INPAGE.html --keywords productos/[SKU]/keywords.txt --vtex productos/[SKU]/[SKU]_VTEX.html
```

---

## 📦 Estructura de Entregables por SKU

Cada SKU procesado se guarda en `html-inpage-falabella/productos/[SKU]/`:
- `[SKU]_INPAGE.html` (Falabella inPage HTML)
- `[SKU]_VTEX.html` (Versión responsive VTEX)
- `[SKU]_KEYWORDS_TABLA_MAESTRA.txt` (Tabla SEO 10 keywords)
- `[SKU]_COBERTURA_SEO_SKILL_v2.4.txt` (Métricas de cobertura)
- `[SKU]_TABLA_RESUMEN_EJECUTIVA.txt` (Resumen de entrega)
- `[SKU]_REPORTE_FINAL.txt` (Reporte completo)
