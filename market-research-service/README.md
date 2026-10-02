# 📊 Advantia — Market Research Service (`market-research-service`)

Microservicio B2B SaaS de Inteligencia SEO y Estudios de Mercado para el protocolo **CatalogAI** en Advantia.

---

## 🛠️ Stack Tecnológico
- **Runtime:** Node.js (TypeScript / ES Modules)
- **Framework:** Hono (`@hono/node-server`)
- **Puerto:** `3004` (por defecto)

---

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Modo desarrollo con auto-reload
npm run dev

# Compilar producción
npm run build

# Iniciar producción
npm start
```

---

## 📌 Endpoints API

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/health` | Estado de salud e información de uptime del microservicio |
| `GET` | `/api/studies` | Lista los estudios de mercado disponibles en la base de datos |
| `GET` | `/api/studies/:categoryId` | Consulta palabras clave filtradas por búsqueda, cluster o intención |
| `POST` | `/api/studies/analyze` | Procesa y analiza en tiempo real datos raw de Keyword Planner / SEMrush |

---
Advantia AI Suite · CatalogAI B2B Platform
