# marketplaces-service

Microservicio HTTP que centraliza la integración con los marketplaces en los que opera Advantia: **Mercado Libre** y **Falabella** (con stubs para Amazon y Homecenter). Forma parte de la línea **Vitrina** — optimización de catálogos y SEO en marketplaces colombianos.

Puerto por defecto: **3001**

---

## Arquitectura interna

```
marketplaces-service/
├── src/
│   ├── connectors/
│   │   ├── mercadolibre.ts  # API pública MeLi — getListing, updateTitle
│   │   ├── falabella.ts     # Seller Center API con HMAC-SHA256 (funcional)
│   │   ├── amazon.ts        # Stub — TODO: Amazon SP-API
│   │   └── homecenter.ts    # Stub — TODO: Homecenter Seller Portal
│   ├── routes/
│   │   └── listings.ts      # Rutas HTTP; extrae credenciales de headers
│   ├── types/
│   │   └── index.ts         # Listing, Marketplace
│   └── index.ts             # Servidor Hono en puerto 3001
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Instalación y ejecución local

```bash
cd marketplaces-service
npm install
cp .env.example .env   # completar variables
npm run dev            # watch mode con tsx
npm run build          # compila a dist/
npm start              # corre dist/index.js
npm run lint           # verifica tipos sin compilar
```

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (default: `3001`) |
| `MELI_ACCESS_TOKEN` | Token OAuth del seller en Mercado Libre |
| `MELI_CLIENT_ID` | App ID en developers.mercadolibre.com.co |
| `MELI_CLIENT_SECRET` | App Secret para renovar tokens OAuth |
| `AMAZON_SP_API_KEY` | Pendiente — conector Amazon no implementado |
| `AMAZON_SELLER_ID` | Pendiente |
| `HOMECENTER_API_KEY` | Pendiente — conector Homecenter no implementado |

> Las credenciales de **Falabella** no van en `.env` — se inyectan por header en cada request para soportar multi-tenant.

---

## Endpoints

### `GET /health`
```json
{ "status": "ok", "service": "marketplaces" }
```

---

### Mercado Libre

#### `GET /listings/mercadolibre/:id`
Obtiene un listing por su Item ID.
```json
{
  "id": "MCO123456789",
  "marketplace": "mercadolibre",
  "title": "Samsung Galaxy S24 128GB",
  "price": 3200000,
  "currency": "COP",
  "stock": 12,
  "url": "https://articulo.mercadolibre.com.co/..."
}
```

#### `PATCH /listings/mercadolibre/:id/title`
Actualiza el título de un listing.
```json
// Body
{ "title": "Nuevo título optimizado con CatalogAI" }
// Respuesta
{ "updated": true }
```

---

### Falabella Seller Center

> Todos los endpoints de Falabella requieren los headers:
> - `x-fala-user-id`: email del seller registrado en Seller Center
> - `x-fala-api-key`: API Key desde Seller Center → Integraciones → API (https://sellercenter.falabella.com)
>
> **Autenticación:** HMAC-SHA256 sobre los parámetros URL-encoded ordenados alfabéticamente. El `@` del email se firma como `%40`.

#### `GET /listings/falabella/products`
```
?offset=0&limit=100&filter=active|inactive|all
```
```json
{
  "count": 42,
  "products": [{
    "SellerSku": "TV-SAMSUNG-55",
    "Name": "Samsung 55\" QLED 4K",
    "Price": "1899000",
    "SalePrice": "1750000",
    "Status": "active",
    "Quantity": 5,
    "ContentScore": 87,
    "QCStatus": "approved",
    "isPublished": 1
  }]
}
```

#### `GET /listings/falabella/products/score`
```
?skus=SKU1,SKU2,SKU3
```
Score de calidad (ContentScore) por SKU. Clave para detectar fichas incompletas.
```json
{
  "scores": [{
    "SellerSku": "TV-SAMSUNG-55",
    "ContentScore": 87,
    "Attributes": [
      { "Attribute": "Name", "Score": 20, "MaxScore": 20 }
    ]
  }]
}
```

#### `GET /listings/falabella/categories`
Árbol completo de categorías de Falabella (22 categorías raíz en Colombia).

#### `GET /listings/falabella/categories/:name/attributes`
Atributos requeridos y opcionales para una categoría.
```json
{ "total": 34, "required": 5, "attributes": [...] }
```

#### `GET /listings/falabella/categories/suggest`
```
?q=televisor+samsung+55+pulgadas
```
Predice la categoría correcta para un nombre de producto.
```json
{ "suggestions": [{ "CategoryId": "1234", "CategoryName": "Televisores" }] }
```

#### `GET /listings/falabella/orders`
```
?createdAfter=2026-01-01T00:00:00Z&status=delivered&limit=50&offset=0
```
Órdenes del seller con filtros por fecha y estado.

---

## Dependencias clave

| Paquete | Motivo |
|---|---|
| `hono` | Framework HTTP ultraligero, compatible con Node.js y Vercel |
| `@hono/node-server` | Adaptador Node.js para Hono |
| `tsx` | Ejecuta TypeScript en desarrollo sin paso de build |
