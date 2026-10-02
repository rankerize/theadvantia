---
name: estudios-de-mercado-catalogai
description: Procesamiento de estudios de mercado, clustering semántico multidimensional (nomenclatura, marcas, materiales, capacidades, colores, salud/PFOA) e inteligencia de volumen de búsqueda para optimizaciones CatalogAI.
---

# Skill de Estudios de Mercado Multidimensional — CatalogAI

Esta skill establece el estándar de análisis multidimensional para investigar cómo los usuarios buscan un producto en e-commerce (Google Keyword Planner, SEMrush, Ahrefs, Mercado Libre).

---

## 🌐 Módulo Web Dedicado en el Repositorio

- **URL del Aplicativo:** [theadvantia.com/estudios-de-mercado](file:///Users/cesarandresjimenezarci/Documents/Advantia/web/src/pages/estudios-de-mercado.astro)
- **Componente Portal:** `web/src/pages/aplicativos.astro` (`card-market-research`)
- **Microservicio Backend:** `market-research-service` (Puerto 3004)
- **Directorio de Datos & Informes:** `estudios-de-mercado/`
  - `data/keywords_ollas_sartenes_2026.csv`
  - `data/keywords_ollas_sartenes_2026.json`
  - `informes/informe_estudio_mercado_ollas_sartenes_2026.md`

---

## 📌 Dimensiones Obligatorias de Desagregación

Al procesar cualquier dataset de palabras clave, el análisis **debe clasificar cada término en al menos una de las siguientes 6 dimensiones**:

1. **💬 Nomenclatura & Sinónimos:**
   - Variaciones dialectales y errores ortográficos comunes (*ej: olla a presión vs. olla express vs. pitadora vs. hoya de presión*).
2. **🏷️ Marcas & Competencia:**
   - Búsquedas con intención directa de marca (*ej: Imusa, Universal, Royal Prestige, Tramontina, Oster, Tefal, Ninja, Le Creuset*).
3. **🧱 Materiales & Tecnología:**
   - Especificación técnica de construcción (*ej: acero inoxidable, acero quirúrgico 18/10, hierro fundido, cerámica, piedra volcánica, titanio, peltre, vidrio*).
4. **📏 Capacidades, Diámetros & Tamaños:**
   - Medidas operativas (*ej: 1 libra, 5 tazas, 2L, 4L, 6L, 7L, 10L, 50L industrial, 20 cm, 24 cm, 30 cm*).
5. **🎨 Colores & Estética:**
   - Búsquedas con preferencia de diseño (*ej: ollas negras, rosadas, blancas, rojas, cobre*).
6. **🩺 Consultas de Salud, Toxicidad & FAQ IA:**
   - Preguntas y objeciones de compra (*ej: "¿el teflón es tóxico?", "sartenes libres de PFOA y PTFE", "ventajas de la cerámica vs hierro fundido"*).

---

## 🚀 Identificación de Quick Wins
Toda palabra clave con un **YoY Change ≥ +100%** se clasifica automáticamente como **Quick Win** y debe ser inyectada en el Título Principal y en los subtítulos del **Módulo 7 inPage**.
