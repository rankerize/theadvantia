# 📊 Estudios de Mercado & Inteligencia SEO — CatalogAI (Advantia)

Módulo especializado en procesamiento, clasificación semántica (clustering), análisis de volumen de búsqueda e inteligencia de mercado para catálogos e-commerce en Colombia y Latinoamérica.

---

## 📂 Estructura del Módulo

```
estudios-de-mercado/
├── data/
│   ├── keywords_ollas_sartenes_2026.csv        # Dataset procesado en formato CSV
│   └── keywords_ollas_sartenes_2026.json       # Dataset procesado en formato JSON
├── informes/
│   └── informe_estudio_mercado_ollas_sartenes_2026.md # Informe analítico consolidado
├── scripts/
│   └── analizar_keywords.py                    # Script de utilidad para procesar exportaciones
└── README.md                                    # Documentación del módulo
```

---

## 🛠️ Cómo Utilizar este Módulo

1. **Explorador Web Interactivo:**
   Accede a [theadvantia.com/aplicativos](file:///Users/cesarandresjimenezarci/Documents/Advantia/web/src/pages/aplicativos.astro) e ingresa con tus credenciales autorizadas. En la pestaña **`📊 Estudios de Mercado`** podrás filtrar por categoría, sub-cluster semántico y término en tiempo real.

2. **Procesar un nuevo dataset de Keywords:**
   Para procesar un nuevo archivo de Keyword Planner o SEMrush y exportar el informe analítico:
   ```bash
   python3 estudios-de-mercado/scripts/analizar_keywords.py
   ```

3. **Insumos para el Protocolo CatalogAI:**
   Los informes generados en `informes/` alimentan directamente la regla del **PASO 0️⃣ (Validación de especificaciones)** y el **PASO 2️⃣ (Tabla de Palabras Clave OPCIÓN 3)** del protocolo inPage HTML para Falabella y VTEX.

---
Advantia AI Suite · CatalogAI Market Intelligence
