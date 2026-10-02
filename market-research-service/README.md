# 📊 Advantia — Market Research Service (`market-research-service`)

Microservicio B2B SaaS de **Inteligencia de Mercado, Análisis Multidimensional de Búsquedas y Tendencias SEO** desarrollado para el protocolo **CatalogAI** en Advantia.

---

## 🛠️ Stack Tecnológico y Arquitectura

- **Runtime:** Node.js (TypeScript / ES Modules)
- **Framework HTTP:** Hono (`@hono/node-server`)
- **Puerto predeterminado:** `3004`
- **Formato de Respuesta:** JSON estándar (`UTF-8`)

---

## 🎯 Propósito del Microservicio

El microservicio procesa, clasifica y expone la demanda real de búsqueda de los compradores en Colombia a partir de datos exportados de Google Keyword Planner (cobertura histórica de 4 años, 2022 a 2026).

Proporciona tres capacidades clave:
1. **Segmentación Multidimensional Automática:** Categorización semántica en 7 dimensiones (Nomenclatura/Sinónimos, Marcas, Materiales, Capacidades/Medidas, Colores, Preguntas de Salud/PFOA, y Quick Wins).
2. **Matriz Estratégica de 4 Ejes:** Cálculo dinámico de métricas para la matriz de posicionamiento (Volumen x Crecimiento YoY x Dificultad x Intención Comercial).
3. **Análisis de Series de Tiempo (4 Años):** Evaluación de aceleración o declive de la demanda entre Septiembre 2022 y Agosto 2026.

---

## 🚀 Inicio Rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor en desarrollo con hot-reload
npm run dev

# 3. Compilar producción
npm run build

# 4. Iniciar en producción
npm start
```

Servidor corriendo en: `http://localhost:3004`

---

## 📌 Especificación Completa de la API

### 1. `GET /health`
Verifica el estado operacional del microservicio.

**Respuesta HTTP 200:**
```json
{
  "status": "online",
  "service": "market-research-service",
  "version": "1.0.0",
  "uptime": 128.45,
  "timestamp": "2026-10-01T20:43:00.000Z"
}
```

---

### 2. `GET /api/studies`
Devuelve la lista de estudios de mercado cargados y disponibles en el catálogo de Advantia.

**Respuesta HTTP 200:**
```json
{
  "status": "success",
  "studies": [
    {
      "id": "ollas-sartenes-2026",
      "category": "Ollas, Sartenes & Menaje de Cocina",
      "market": "Colombia (COP)",
      "totalKeywords": 664,
      "totalVolume": 254800,
      "period": "Sep 2022 - Ago 2026 (4 Años)",
      "lastUpdated": "2026-10-01"
    }
  ]
}
```

---

### 3. `GET /api/studies/:categoryId`
Consulta las palabras clave desagregadas y enriquecidas de una categoría específica.

**Parámetros Query Opción:**
- `search` *(string)*: Término de búsqueda para filtrar la palabra clave (ej: `imusa`, `titanio`, `express`).
- `cluster` *(string)*: Dimensión o clúster de búsqueda (`presion`, `materiales`, `marcas`, `quickwins`, `salud`).
- `limit` *(number)*: Cantidad máxima de registros a retornar (default: `500`).

**Ejemplo de solicitud:**
`GET /api/studies/ollas-sartenes-2026?cluster=quickwins&search=titanio`

**Respuesta HTTP 200:**
```json
{
  "status": "success",
  "categoryId": "ollas-sartenes-2026",
  "totalResults": 1,
  "returnedResults": 1,
  "totalVolume": 170,
  "data": [
    {
      "keyword": "sartenes de titanio",
      "volume": 170,
      "yoy": "+555%",
      "competition": "Alto",
      "cluster": "hierro",
      "intent": "quickwin"
    }
  ]
}
```

---

### 4. `POST /api/studies/analyze`
Ingesta y procesa texto plano copiado directamente desde exportaciones tsv/csv de Google Keyword Planner o SEMrush.

**Body Payload (`application/json`):**
```json
{
  "categoryName": "Relojes & Accesorios 2026",
  "rawText": "Keyword\tCurrency\tAvg. monthly searches\tYoY change\tCompetition\nreloj casio hombre\tCOP\t9900\t0%\tAlto\nsartenes titanio\tCOP\t170\t+555%\tAlto"
}
```

**Respuesta HTTP 200:**
```json
{
  "status": "success",
  "categoryName": "Relojes & Accesorios 2026",
  "totalKeywords": 2,
  "totalVolume": 10070,
  "quickWinsCount": 1,
  "quickWins": [
    {
      "keyword": "sartenes titanio",
      "volume": 170,
      "yoy": "+555%",
      "competition": "Alto"
    }
  ],
  "top10Keywords": [
    {
      "keyword": "reloj casio hombre",
      "volume": 9900,
      "yoy": "0%",
      "competition": "Alto"
    }
  ]
}
```

---

## 🧮 Metodología del Protocolo CatalogAI (Adenda 3.5 & SKILL v2.4 SEO)

### 1. Clasificación por Dimensión de Búsqueda
- **💬 Nomenclatura & Sinónimos:** Título H1 / Módulo 7 (Pareja 1).
- **🏷️ Marcas & Competencia:** Módulo 7 (Pareja 1 / Pareja 2).
- **🧱 Materiales & Tecnología:** Módulo 7 (Materiales e Innovación).
- **📏 Capacidades & Medidas:** Especificaciones Técnicas y SKU.
- **🎨 Colores & Estética:** Variantes visuales de producto.
- **🩺 Preguntas / Salud & FAQ:** Generación de módulos FAQ estructurados para IA.

### 2. Matriz Estratégica de 4 Ejes
- **Eje X:** Volumen de búsqueda mensual en Colombia.
- **Eje Y:** Variación porcentual interanual (YoY %).
- **Tamaño (Radio R):** Índice numérico de competencia en Google Ads.
- **Color:** Intención comercial (*Transaccional*, *Marca*, *Informacional*, *Quick Win*).

---

Advantia B2B SaaS Platform · CatalogAI Market Intelligence Engine
