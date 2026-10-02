---
name: estudios-de-mercado-catalogai
description: Procesamiento de estudios de mercado, clustering semántico de palabras clave (Keyword Planner / SEMrush) e inteligencia de volumen de búsqueda para optimizaciones CatalogAI.
---

# Skill de Estudios de Mercado & Inteligencia SEO — CatalogAI

Esta skill guía la ejecución de estudios de mercado por categorías, la segmentación en Topic Clusters y la identificación de Quick Wins para publicaciones en Falabella, Mercado Libre, Amazon y VTEX.

---

## 📂 Recursos del Módulo en el Repositorio

- **Directorio raíz del módulo:** `estudios-de-mercado/`
- **Datasets en Data:** [estudios-de-mercado/data/](file:///Users/cesarandresjimenezarci/Documents/Advantia/estudios-de-mercado/data)
  - `keywords_ollas_sartenes_2026.json`
  - `keywords_ollas_sartenes_2026.csv`
- **Informes Generados:** [estudios-de-mercado/informes/](file:///Users/cesarandresjimenezarci/Documents/Advantia/estudios-de-mercado/informes)
  - `informe_estudio_mercado_ollas_sartenes_2026.md`
- **Herramientas de Análisis:** `estudios-de-mercado/scripts/analizar_keywords.py`

---

## 📋 Pasos para Procesar un Nuevo Estudio de Mercado

1. **Recepción del Dataset:**
   - Aceptar datos en formato CSV/TSV de Google Keyword Planner, SEMrush o Ahrefs.
2. **Filtrado de Ruido:**
   - Eliminar términos duplicados, marcas no competidoras e intenciones fuera de alcance.
3. **Generación de Topic Clusters:**
   - Agrupar por línea de producto, material (ej. *hierro fundido, acero inoxidable, cerámica*), capacidad (*1 a 50 litros*) y beneficio de salud (*libre de PFOA, sin tóxicos*).
4. **Identificación de Quick Wins:**
   - Aísla palabras clave con tasa de crecimiento YoY superior al **+100%**.
5. **Conexión con CatalogAI inPage:**
   - Mapear las palabras de mayor volumen al **Título (H1)**, **Bloques del Módulo 7** y **Sección FAQ para IA**.
