# 📝 AGENT: Product Templates & E-E-A-T PDP Descriptions

## 🎯 1. Propósito y Qué Hace el Módulo
Este microservicio genera descripciones de producto enriquecidas, fichas técnicas y plantillas HTML estandarizadas para páginas de detalle de producto (**PDP - Product Detail Pages**) de Falabella.

Implementa los principios de **E-E-A-T de Google** (Experiencia, Conocimiento, Autoridad y Confianza), garantizando que las descripciones no sean meros textos genéricos del fabricante, sino guías persuasivas con especificaciones claras, modo de uso, compatibilidad, cuidado y preguntas frecuentes.

---

## 🏗️ 2. Arquitectura y Archivos Clave

| Archivo | Rol |
|---|---|
| `productDescription.js` | Generador de descripciones persuasivas con IA adaptadas a la ficha técnica del producto. |
| `productTemplate.js` | Ensamblador de plantillas HTML modulares para PDPs de Falabella. |
| `EEAT_PDP_GUIDELINES.md` | Guía exhaustiva de calidad E-E-A-T para e-commerce y retail. |
| `PRODUCT_DESCRIPTION_RULES.md` & `PRODUCT_TEMPLATE_RULES.md` | Estructuras de encabezados, viñetas técnicas y restricciones editoriales. |

---

## 🚀 3. Cómo Hacerlo Funcionar (Guía Paso a Paso)

### Modo 1: Desde la Suite Web
1. Abre `http://localhost:5173/#/product-description` o `#/product-template`.
2. Ingresa el SKU de Falabella o pega los atributos crudos del producto.
3. Selecciona la categoría (ej. `Belleza y Cuidado Personal`, `Calzado`, `Línea Blanca`, `Tecnología`).
4. Haz clic en **Generar Descripción E-E-A-T**.
5. Obtén la salida en **HTML limpio**, **Markdown** o **Texto enriquecido**.

---

## 📋 4. Estructura HTML Generada

```html
<div class="fala-pdp-description">
  <h3>¿Por qué elegir este producto?</h3>
  <p>Párrafo enfocado en resolver el problema principal del usuario con tono cercano...</p>

  <h3>Características Principales y Beneficios</h3>
  <ul>
    <li><strong>Material de alta resistencia:</strong> Fabricado en acero inoxidable 304 que garantiza durabilidad...</li>
    <li><strong>Tecnología Inverter:</strong> Ahorro de hasta un 40% en consumo eléctrico...</li>
  </ul>

  <h3>Guía de Uso y Mantenimiento</h3>
  <p>Consejos prácticos para maximizar la vida útil del producto...</p>

  <h3>Especificaciones Técnicas</h3>
  <table class="fala-specs-table">
    <tr><th>Marca</th><td>Samsung</td></tr>
    <tr><th>Garantía del proveedor</th><td>12 meses</td></tr>
  </table>
</div>
```

---

## 🛡️ 5. Principios E-E-A-T Obligatorios
- **Transparencia total:** Destacar dimensiones reales, compatibilidad y qué incluye la caja.
- **Sin exageraciones:** No usar adjetivos vacíos ("el mejor producto del universo"). Respaldar cada beneficio con una característica medible.
- **Seguridad:** Para categorías sensibles (salud, belleza, tecnología, bebés), incluir advertencias de uso y certificaciones oficiales.
