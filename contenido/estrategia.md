# Estrategia de contenido ADVANTIA (LinkedIn + blog theadvantia.com)

Versión 1.0 · noviembre 2026 · Dueño: Nicolás Navarro

## 1. Objetivo

Que los dueños de importadoras, marcas y distribuidoras que venden en marketplaces, y sus gerentes de e-commerce o marketing, reconozcan a ADVANTIA como quien sabe por qué sus productos no aparecen en Google y cómo arreglarlo. El contenido no vende planes: abre conversaciones que terminan en un Diagnóstico.

Métricas que el agente reporta cada mes (solo las que entrega Upload-Post o Google, nunca estimadas):

- Página ADVANTIA: seguidores, impresiones e interacción.
- Blog: visitas a los artículos (cuando Nicolás comparta el dato de Search Console o Hostinger).
- Comercial: conversaciones o solicitudes de Diagnóstico que mencionen LinkedIn o el blog (Nicolás las registra en HubSpot con la propiedad "Línea de interés inicial").

## 2. Ritmo (plan gratis de Upload-Post)

| Pieza | Frecuencia | Cuenta | Día y hora (Bogotá) |
|---|---|---|---|
| Post de opinión o aprendizaje | 1 por semana | Perfil de Nicolás | Martes 7:30 am |
| Post educativo o promoción de artículo | 1 por semana | Página ADVANTIA | Jueves 12:00 m |
| Artículo de blog | 2 por mes | theadvantia.com | Se publica el lunes de la semana en que lo promociona un post |

Tope duro: 10 publicaciones al mes en Upload-Post (plan Free). Con 2 por semana el mes más largo da 10. Si alguna semana se necesitara un post extra, se reemplaza uno, nunca se suma.

## 3. Las dos voces

**Perfil de Nicolás (primera persona).** Fundador que construye una empresa de inteligencia de contenido para marketplaces mientras trabaja en operaciones comerciales. Habla de lo que aprendió, lo que le sorprendió y lo que haría distinto. Puede usar su experiencia previa en retail. Frases cortas, tono "cercano corporativo", una idea por post, termina en una pregunta abierta o una invitación concreta.

**Página ADVANTIA (nosotros).** Educativa y práctica: cómo lee Google una ficha de producto, qué cambia en un título, qué mirar en un HTML. Promociona los artículos del blog. Nada de autobombo sin dato.

## 4. Pilares (rotan en el calendario)

| Código | Pilar | Qué cuenta | Voz principal |
|---|---|---|---|
| P1 | Lo que Google sí lee | Títulos, descripciones HTML, Alcance SEO, errores comunes en fichas de Falabella, Mercado Libre, Homecenter y VTEX | Página |
| P2 | Datos reales, no supuestos | Por qué se trabaja solo con volumen de búsqueda verificado; errores de estimar | Perfil |
| P3 | Detrás del protocolo | Cómo trabajamos: los pasos del Protocolo CatalogAI, el consultor experto que aprueba lo que propone la IA | Página |
| P4 | Casos y resultados | Lo que pasó con clientes reales. Solo con autorización escrita (ver `clientes.yaml`); si no, anonimizado | Ambas |
| P5 | Construir ADVANTIA | Aprendizajes de fundador: vender servicios B2B, trabajar con agentes de IA, tiempo limitado | Perfil |

## 5. Reglas que no se rompen

1. **Cero datos inventados.** Toda cifra viene de `contenido/datos_verificados.md` o de una fuente que Nicolás dé en el PR. Si no hay dato, el texto va sin número. Nunca proyecciones de clics, ventas o ingresos.
2. **Volumen de búsqueda solo de Keyword Surfer.** El agente no puede consultarlo; si un artículo lo necesita, deja `[PENDIENTE: volumen de "<keyword>"]` y Nicolás lo llena antes de aprobar. El validador bloquea el PR mientras exista un `[PENDIENTE`.
3. **Clientes.** Solo se nombra un cliente o sus marcas si en `clientes.yaml` tiene `autorizacion_escrita: true`.
4. **Convenciones de copy colombiano:** sin guiones largos (—), "Mercado Libre" en dos palabras, "venta orgánica" (nunca "venta sin pauta"), "Alcance SEO" (nunca "Cobertura SEO"), montos en pesos completos ($1.200.000, nunca "1,2M").
5. **Precios.** Solo los que estén publicados en theadvantia.com en ese momento. No se ofrecen descuentos en contenido público.
6. **LinkedIn:** máximo 3.000 caracteres; ideal 900 a 1.500. Máximo 3 hashtags al final. Primera línea que funcione sola (es lo que se ve antes de "ver más").
7. **Nada que entregue el alcance gratis.** Se enseña el porqué y el qué; el cómo detallado del protocolo es del cliente.

## 6. Formatos

- `texto`: post solo texto.
- `documento`: carrusel en PDF (4 a 8 láminas, 1080x1350, colores de marca). El agente lo genera con WeasyPrint dentro del repo en `assets/linkedin/<id>.pdf`; Upload-Post lo toma por URL pública después del despliegue.
- `articulo`: post que promociona un artículo del blog; el enlace va al final del texto.

## 7. Temporada

Se publica también entre el 21 de diciembre y el 10 de enero, con temas de cierre de año, medición y planeación (decisión de Nicolás, nov-2026). Diciembre usa exactamente las 10 publicaciones del cupo gratis: no se agrega nada ese mes.
