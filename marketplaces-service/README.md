# 🛒 Marketplaces Service (Vitrina - Advantia)

## 🎯 1. Propósito y Qué Hace el Servicio
**marketplaces-service** es el microservicio encargado de la conexión, sincronización y actualización masiva de publicaciones (*listings*) en diferentes canales de venta e-commerce para la línea de producto **Vitrina** de Advantia.

Su función principal es aplicar el protocolo **CatalogAI** para optimizar títulos, atributos y descripciones de catálogos en los principales marketplaces de la región, mejorando el posicionamiento orgánico (SEO) y las métricas de conversión de los vendedores.

---

## 🏗️ 2. Arquitectura y Estructura del Proyecto

```
marketplaces-service/
├── src/
│   ├── connectors/
│   │   ├── amazon.ts        # Conector para Amazon SP-API
│   │   ├── falabella.ts     # Conector para Falabella Seller Center
│   │   ├── homecenter.ts    # Conector para Homecenter / Sodimac
│   │   └── mercadolibre.ts  # Conector para API de Mercado Libre
│   ├── routes/
│   │   └── listings.ts      # Rutas HTTP para gestión de publicaciones
│   ├── types/
│   │   └── index.ts         # Definiciones de tipos para listings y conectores
│   └── index.ts             # Servidor HTTP Hono y escucha en puerto
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 🛠️ 3. Stack Tecnológico
- **Runtime:** Node.js (ES Modules, TypeScript)
- **Framework Web:** [Hono](https://hono.dev/) + `@hono/node-server`
- **Integraciones:** Mercado Libre API, Falabella API, Amazon SP-API, Homecenter
- **Herramienta de desarrollo:** `tsx` watch mode

---

## 🔌 4. API Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Chequeo de estado del servicio (retorna `{ status: "ok", service: "marketplaces" }`). |
| `GET` | `/listings/:marketplace/:id` | Consulta la información detallada de una publicación por canal e ID de ítem. |
| `PATCH` | `/listings/:marketplace/:id/title` | Actualiza el título optimizado con CatalogAI en el marketplace especificado. |

### Ejemplo de Solicitud PATCH `/listings/mercadolibre/MCO123456789/title`
```json
{
  "title": "Tenis Deportivos Hombre Runflex Transpirables Suela Antideslizante"
}
```

---

## 🔑 5. Variables de Entorno (`.env`)

```env
PORT=3001
MELI_CLIENT_ID=tu_client_id_mercadolibre
MELI_CLIENT_SECRET=tu_client_secret_mercadolibre
FALABELLA_API_KEY=tu_api_key_falabella
```

---

## 🚀 6. Scripts Disponibles

En el directorio `marketplaces-service`:

- **Desarrollo:**
  ```bash
  npm run dev
  ```
- **Compilación:**
  ```bash
  npm run build
  ```
- **Producción:**
  ```bash
  npm run start
  ```
- **Verificación de tipos:**
  ```bash
  npm run lint
  ```
