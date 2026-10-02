# HTML inPage Falabella — MEDHIA CatalogAI

Protocolo, insumos SEO y herramientas para generar descripciones HTML **inPage** optimizadas para SEO en Falabella.com (Colombia, Chile, Perú), con versión responsive para **VTEX**.

## Estructura

```
html-inpage-falabella/
├── protocolo/
│   ├── PROTOCOLO_MAESTRO_v3.4.md            Flujo de 9 pasos (SEO antes del HTML, Keyword Surfer obligatorio)
│   ├── ADENDA_v3.5_CONTENIDO_ADITIVO.md     PASO 5C — enriquecimiento SEO/FAQ IA, nunca sustractivo
│   ├── ADENDA_v3.6_MODULO7.md               PASO 5D — Módulo 7 como estructura HTML por defecto
│   ├── ADENDA_v3.7_VTEX.md                  PASO 5E — doble entregable Falabella + VTEX
│   └── SKILL-v2.4-PROTOCOLO-GENERICO-DESCARGABLE.md   Tabla OPCIÓN 3, título OPCIÓN B, cobertura OPCIÓN C
├── seo/
│   ├── resumen_seo_ollas_falabella.md       Insumo SEO categoría ollas (KitchenAid / Farberware)
│   └── resumen_seo_sartenes_falabella.md    Insumo SEO categoría sartenes (KitchenAid / Farberware)
├── referencias/
│   ├── falabella-centro-ayuda/              Páginas guardadas del Centro de ayuda sellers (inPage, publicaciones)
│   └── guias-marca/                         Guidelines KitchenAid y Farberware (PDF)
├── plantillas/
│   └── plantilla de creacion Inpague Falabella.xlsx
├── scripts/
│   └── validar_html.py                      Validador PASO 6 (+ comparación Falabella vs VTEX)
└── productos/                               Un subdirectorio por SKU con sus entregables
```

## Flujo resumido

1. Producto + imágenes → 2. ZIP imágenes (550px, 300 DPI) → 2B. Keyword Surfer **real** → 3. Tabla maestra → 4. Título → 5B. Cobertura → 5. HTML (Módulo 7) → 5C. Enriquecimiento aditivo → 5E. Versión VTEX → 6. Validación → 7. IDs Google Drive → 8. Resumen ejecutivo → 9. Reporte final.

## Reglas clave HTML Falabella

- Permitido: `p, ul, li, img, iframe, em, strong, br, a` con estilos inline.
- Prohibido: `div`, `<style>`, `class=`, `id=`, `h1–h6`, JavaScript, emojis.
- Imágenes: `https://lh3.googleusercontent.com/d/[ID]` (nunca `drive.google.com/uc?id=`).
- Video YouTube solo con URL real.

## Validar un HTML

```bash
python scripts/validar_html.py productos/SKU/SKU_INPAGE.html --keywords productos/SKU/keywords.txt --vtex productos/SKU/SKU_VTEX.html
```

## Convención de entregables por SKU

```
productos/[SKU]/
├── [SKU]_INPAGE.html
├── [SKU]_VTEX.html
├── [SKU]_KEYWORDS_TABLA_MAESTRA.txt
├── [SKU]_COBERTURA_SEO_SKILL_v2.4.txt
├── [SKU]_TABLA_RESUMEN_EJECUTIVA.txt
└── [SKU]_REPORTE_FINAL.txt
```

---
MEDHIA S.A.S. — CatalogAI
