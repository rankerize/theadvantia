# ADENDA PROTOCOLO MAESTRO v3.5
## Regla: Contenido SEO y preguntas para IA es ADITIVO, no sustractivo

**Para pegar dentro de las instrucciones personalizadas del proyecto "HTML INPAGE FALABELLA", a continuación de la sección PASO 5 — HTML INPAGE.**

---

## PASO 5C — ENRIQUECIMIENTO SEO Y FAQ PARA IA (nuevo, obligatorio cuando aplique)

### Regla de oro: aditivo, nunca sustractivo

Cuando exista información de SEO (keyword research, resumen de categoría) o preguntas
que un cliente le haría a una IA sobre el producto, esa información **se agrega** al HTML
ya aprobado — **nunca reemplaza ni elimina** contenido, secciones, fotografías o preguntas
que ya fueron construidas e iteradas con el cliente en el proyecto.

```
PROHIBIDO:
  → Quitar secciones, fotos, especificaciones o preguntas ya aprobadas para "hacer espacio"
    al nuevo contenido SEO.
  → Generar una versión "más completa" que en realidad sea una reescritura desde cero.

OBLIGATORIO:
  → Partir siempre del último HTML aprobado por el cliente.
  → Insertar las secciones nuevas en el lugar temático correcto (ej. una guía de salud
    de materiales va junto a la sección de interior antiadherente/material).
  → Conservar el 100% de las fotografías, specs y preguntas previas salvo que el cliente
    pida explícitamente eliminar algo puntual.
  → Versionar el archivo (ej. v3.4 → v3.5 → v3.6) para que quede trazabilidad de qué
    se agregó en cada iteración.
```

### Qué agregar cuando hay datos de SEO/categoría disponibles

1. **Guía de materiales / salud** (cuando el producto tenga un ángulo de salud o
   comparación de materiales relevante para la categoría): sección propia, no nota al pie,
   comparando el material del producto contra las alternativas reales del mercado
   (ej. cerámica antiadherente vs. teflón, acero inoxidable, hierro fundido, vidrio),
   basada en las categorías/materiales que el resumen de SEO haya identificado como
   relevantes para el comprador.

2. **Preguntas frecuentes para IA**: expandir el FAQ existente con las preguntas reales
   identificadas en el resumen SEO de categoría (sección "Preguntas clave que haría un
   cliente a una IA"), priorizando: salud/seguridad del material, nomenclatura
   (batería vs. set vs. juego), qué incluye el producto, durabilidad, compatibilidad
   (inducción, horno, lavavajillas) y confianza de marca. Formato pregunta/respuesta
   directo, sin relleno, listo para que un asistente de IA lo cite.

3. **Información relevante para el cliente** (no solo para el buscador): cada sección
   agregada debe responder una duda real de compra, no ser solo densidad de keywords.
   Antes de agregar una sección, preguntarse: "¿esto ayuda a decidir la compra, o solo
   suma texto?" Si la respuesta es la segunda, no se agrega.

### Qué NO agregar

- Contenido genérico de categoría que no aplique al producto específico (ej. no hablar
  de acero inoxidable como si fuera el material del producto si el producto es cerámica).
- Secciones que dupliquen información ya cubierta en otra parte del HTML sin agregar
  valor nuevo.
- Afirmaciones de características no verificadas del producto (ver regla general del
  protocolo: nunca inventar specs).

### Checklist antes de entregar una versión "enriquecida"

```
¿Se partió del último HTML aprobado (no de una reescritura)?          SI / NO
¿Se conservaron todas las fotos, specs y preguntas previas?           SI / NO
¿Las secciones nuevas están en el lugar temático correcto?            SI / NO
¿Cada sección nueva responde una duda real de compra?                 SI / NO
¿El archivo quedó versionado con nombre distinto al anterior?         SI / NO

Todos SI → entregar como nueva versión.
Algún NO → corregir antes de entregar.
```

---

**Origen de esta adenda:** iteración del proyecto Batería de Ollas KitchenAid Cerámica
Antiadherente 8 Piezas (Falabella Colombia), donde se generó una versión "enriquecida"
del HTML que inicialmente perdió contenido del original al construirse como documento
aparte en lugar de partir del HTML aprobado. Esta regla evita que se repita.

**Creado por:** MEDHIA CatalogAI
**Se agrega a:** PROTOCOLO_MAESTRO_v3.4
