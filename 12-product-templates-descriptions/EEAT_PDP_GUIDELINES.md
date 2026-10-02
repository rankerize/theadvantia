# Guías E-E-A-T para Páginas de Producto (PDP) — Falabella

Documento de referencia para la generación de contenido HTML de PDPs con estándares de Experience, Expertise, Authoritativeness y Trustworthiness (E-E-A-T). Última revisión: 2026-06.

---

## 1. ¿Por qué E-E-A-T en PDPs de ecommerce?

Google evalúa las páginas de producto no solo por keywords, sino por la calidad, confiabilidad y utilidad del contenido para el usuario. Un PDP con contenido E-E-A-T fuerte:

- Convierte mejor (el usuario tiene más confianza para comprar)
- Rankea mejor (señales de calidad que Google detecta)
- Tiene menor tasa de rebote (el contenido responde las preguntas del usuario)
- Genera reseñas y contenido generado por usuarios más fácilmente

---

## 2. Experience (Experiencia)

### ¿Qué busca Google?
Contenido que demuestre experiencia real de uso con el producto.

### Cómo aplicarlo en Falabella

- **Incluir reseñas reales de BazaarVoice** con fragmentos textuales citados, no solo el promedio de rating.
- **Casos de uso específicos**: "ideal para corredores que buscan amortiguación" en lugar de "zapato deportivo".
- **Imágenes en contexto**: usar las imágenes AV (alternate views) del producto para mostrar escala, detalles y uso real.
- **Tabla de tallas con guía práctica**: no solo la tabla genérica, sino una recomendación sobre si el producto es fiel a la talla o corre grande/pequeño, basada en las reseñas.

### Señales de contenido con Experience
```html
<!-- BIEN: experiencia real citada -->
<p>Según 245 compradores de Falabella, este modelo "corre una talla grande" — recomendamos pedir una talla menos si tienes pie estrecho.</p>

<!-- MAL: genérico sin experiencia -->
<p>Producto de alta calidad para uso deportivo.</p>
```

---

## 3. Expertise (Conocimiento técnico)

### ¿Qué busca Google?
Contenido técnico preciso que demuestre conocimiento del producto y su categoría.

### Cómo aplicarlo en Falabella

- **Especificaciones completas y formateadas**: nunca omitir datos técnicos disponibles en la ficha del proveedor.
- **Terminología correcta por categoría**:
  - Calzado: pronación, drop, stack height, upper, midsole, outsole
  - Electrónica: resolución, tasa de refresco, latencia, HDR, puertos
  - Textil: composición de fibras con porcentajes, instrucciones de lavado según norma ISO
- **Conversiones de unidades**: si el proveedor da medidas en pulgadas, incluir cm también.
- **Diferenciadores por modelo**: si hay varios SKUs del mismo producto, explicar en qué difieren.

### Estructura recomendada de especificaciones
```html
<section class="pdp-specs">
  <h2>Especificaciones técnicas</h2>
  <table>
    <tr><th>Material exterior</th><td>Cuero sintético 80% / Malla 20%</td></tr>
    <tr><th>Suela</th><td>Goma vulcanizada</td></tr>
    <tr><th>Drop</th><td>10 mm</td></tr>
    <tr><th>Peso</th><td>285 g (talla 42)</td></tr>
  </table>
</section>
```

---

## 4. Authoritativeness (Autoridad)

### ¿Qué busca Google?
Que el contenido provenga o cite fuentes autorizadas en el tema.

### Cómo aplicarlo en Falabella

- **Citar la marca**: "Según Nike, esta tecnología Air Max reduce el impacto en un 30%." — con datos reales del proveedor.
- **Mencionar premios, certificaciones o reconocimientos** del producto si los tiene (p.ej. certificación Oeko-Tex, premio Red Dot).
- **Estadísticas de ventas o popularidad** cuando sean reales: "Uno de los 5 productos más vendidos en Calzado Running Colombia".
- **Schema Markup correcto**: `Product`, `AggregateRating`, `Review`, `Offer` correctamente implementados (ver sección 7).

---

## 5. Trustworthiness (Confianza)

### ¿Qué busca Google?
Que el usuario pueda confiar en la información del producto para tomar una decisión de compra.

### Cómo aplicarlo en Falabella

- **Información de devoluciones y garantía** en el PDP, no solo en el footer.
- **Tallas disponibles en tiempo real** con indicador de stock bajo si aplica.
- **Advertencias claras**: alergias a materiales, limitaciones de edad, contraindicaciones.
- **Precios incluidos impuestos** (en Colombia, IVA incluido en el precio mostrado).
- **Reseñas sin filtrar**: mostrar también reseñas negativas con respuesta de la marca si existe — ocultar críticas reduce la confianza.
- **Política de Alerta de Inflamabilidad** (Gap Catalog): si el campo `flammabilityWarning` no está vacío, mostrarlo de forma visible.

---

## 6. Estructura HTML recomendada para un PDP Falabella

```html
<article itemscope itemtype="https://schema.org/Product">

  <!-- 1. Hero del producto -->
  <header>
    <h1 itemprop="name">[Nombre completo del producto]</h1>
    <p class="brand" itemprop="brand" itemscope itemtype="https://schema.org/Brand">
      <span itemprop="name">[Marca]</span>
    </p>
    <div class="pdp-rating" itemprop="aggregateRating" itemscope itemtype="https://schema.org/AggregateRating">
      <span itemprop="ratingValue">[4.5]</span>/5
      (<span itemprop="reviewCount">[245]</span> opiniones)
    </div>
  </header>

  <!-- 2. Descripción principal — puntos clave con Experience -->
  <section class="pdp-highlights">
    <h2>Características principales</h2>
    <ul>
      <li>[Beneficio 1 basado en uso real]</li>
      <li>[Beneficio 2 con dato técnico]</li>
      <li>[Beneficio 3 diferenciador vs. competencia]</li>
    </ul>
  </section>

  <!-- 3. Descripción extendida — Expertise -->
  <section class="pdp-description" itemprop="description">
    <p>[Párrafo 1: contexto y casos de uso]</p>
    <p>[Párrafo 2: materiales y tecnología con términos técnicos correctos]</p>
  </section>

  <!-- 4. Especificaciones — tabla completa -->
  <section class="pdp-specs">
    <h2>Especificaciones técnicas</h2>
    <table>...</table>
  </section>

  <!-- 5. Reseñas — Trustworthiness + Experience -->
  <section class="pdp-reviews">
    <h2>Opiniones de compradores</h2>
    <!-- Fragmentos de reseñas BazaarVoice con Schema Markup -->
  </section>

  <!-- 6. Cuidado e instrucciones — Trustworthiness -->
  <section class="pdp-care">
    <h2>Cuidado y mantenimiento</h2>
    <p>[Instrucciones de cuidado]</p>
  </section>

</article>
```

---

## 7. Schema Markup requerido

### Product + Offer + AggregateRating
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "[Nombre del producto]",
  "brand": { "@type": "Brand", "name": "[Marca]" },
  "sku": "[SKU]",
  "image": ["[URL imagen 1]", "[URL imagen 2]"],
  "description": "[Descripción breve]",
  "offers": {
    "@type": "Offer",
    "priceCurrency": "COP",
    "price": "[Precio sin IVA o con IVA según país]",
    "availability": "https://schema.org/InStock",
    "seller": { "@type": "Organization", "name": "Falabella" }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "[4.5]",
    "reviewCount": "[245]",
    "bestRating": "5"
  }
}
```

---

## 8. Checklist de QA para PDPs generados

Antes de publicar un PDP generado por IA, verificar:

- [ ] El nombre del producto incluye marca + modelo + característica clave (sin keyword stuffing)
- [ ] La descripción tiene mínimo 200 palabras de contenido original
- [ ] La tabla de especificaciones no tiene celdas vacías sin justificación
- [ ] Las reseñas citadas son reales (vienen del JSON de BazaarVoice)
- [ ] El Schema Markup pasa la prueba de Google Rich Results Test
- [ ] No hay contenido duplicado del proveedor (parafrasear siempre)
- [ ] Las instrucciones de cuidado corresponden al material real del producto
- [ ] Si hay `flammabilityWarning` en el catálogo, está visible en el HTML
- [ ] El precio mostrado incluye IVA (Colombia y Perú) o no incluye IVA (Chile según configuración)
- [ ] Las imágenes tienen atributos `alt` descriptivos con el nombre del producto

---

## 9. Errores comunes a evitar

| Error | Impacto E-E-A-T | Corrección |
|---|---|---|
| Copiar el copy del proveedor sin modificar | Contenido duplicado → penalización | Parafrasear con información adicional |
| Usar solo el rating sin citar reseñas | Falta de Experience | Incluir al menos 2-3 fragmentos textuales |
| Especificaciones en texto corrido en lugar de tabla | Difícil de escanear, falta de Expertise | Usar `<table>` o lista de definición |
| Omitir composición de materiales | Falta de Trustworthiness para alérgicos | Siempre incluir si está disponible |
| Imágenes sin `alt` | Accesibilidad + SEO | `alt="[Marca] [Modelo] - [Color]"` |
| Precio sin claridad de impuestos | Falta de Trustworthiness | Indicar explícitamente si incluye o no IVA |
| H1 con keyword stuffing | Penalización por spam | Nombre natural del producto |
