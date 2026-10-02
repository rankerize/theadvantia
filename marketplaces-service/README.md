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

> Las credenciales de **Falabella** no van en `.env` — se inyectan por header en cada request para soportar multi-tenant (ver sección de autenticación).

---

## Endpoints

### `GET /health`
```json
{ "status": "ok", "service": "marketplaces" }
```

---

### Mercado Libre

#### `GET /listings/mercadolibre/:id`
Obtiene un listing por su Item ID de MeLi.
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

#### Autenticación

Todos los endpoints de Falabella requieren estos headers en cada request:

| Header | Valor |
|---|---|
| `x-fala-user-id` | Email del seller registrado en Seller Center |
| `x-fala-api-key` | API Key desde: sellercenter.falabella.com → Cuenta → Integraciones → API |

El conector calcula internamente la firma **HMAC-SHA256** por cada llamada. El algoritmo exacto (descubierto por reconocimiento directo contra la API):

```
1. Armar params: { Action, Format:"JSON", Timestamp, UserID, Version:"1.0", ...extras }
2. Ordenar claves alfabéticamente
3. Construir string firmado CON valores URL-encoded:
   "Action=GetProducts&Format=JSON&Timestamp=2026-10-01T20%3A00%3A00%2B00%3A00&UserID=seller%40gmail.com&Version=1.0"
   ↑ El @ se firma como %40, los : como %3A, el + como %2B
4. HMAC-SHA256(string_firmado, apiKey) → hex minúscula
5. URL final = BASE_URL + "?" + string_firmado + "&Signature=" + firma
```

> **Base URL:** `https://sellercenter-api.falabella.com/`
> **Timestamp:** ISO 8601 sin milisegundos con offset `+00:00` (no `Z`)

---

#### Mapa de endpoints Falabella — verificado en producción (2026-10-01)

| Acción SC | Ruta REST | Estado | Notas |
|---|---|---|---|
| `GetProducts` | `GET /listings/falabella/products` | ✅ | `?offset=0&limit=100&filter=active\|inactive\|all` |
| `GetContentScore` | `GET /listings/falabella/products/score` | ✅ | `?skus=SKU1,SKU2` — requiere SKUs reales |
| `GetCategoryTree` | `GET /listings/falabella/categories` | ✅ | 22 categorías raíz en Colombia |
| `GetCategoryAttributes` | `GET /listings/falabella/categories/:name/attributes` | ✅ | Devuelve `FeedName` + `isMandatory` |
| `GetCategorySuggestion` | `GET /listings/falabella/categories/suggest?q=` | ✅ | Parámetro interno: `Name=` (no `Search=`) |
| `GetBrands` | `GET /listings/falabella/brands` | ✅ | Lista global de marcas con `BrandId` |
| `GetShipmentProviders` | `GET /listings/falabella/shipment-providers` | ✅ | Servientrega (default, COD) + Coordinadora |
| `GetWarehouse` | `GET /listings/falabella/warehouse` | ✅ | Bodega `GSC-SCA067...` configurada |
| `GetOrders` | `GET /listings/falabella/orders` | ✅ | `?createdAfter=&status=&limit=&offset=` |
| `GetFailureReasons` | — | ✅ | Existe pero no expuesto como ruta aún |
| `ProductCreate` | `POST /listings/falabella/products` | ✅ | Crea borrador, devuelve `feedId` |
| `ProductUpdate` | `PATCH /listings/falabella/products/:sku` | ✅ | Actualiza SKU existente |
| `GetFeedRawInput` | `GET /listings/falabella/feeds/:feedId` | ✅ | Estado del feed; `FeedIdList=[id]` |
| `GetMultipleOrderItems` | — | ✅ | Requiere `OrderId` real |
| `GetDocument` | — | ✅ | Requiere `OrderItemId` (no `OrderId`) |
| `GetMetrics` | — | ✅* | Existe pero sin datos en cuentas nuevas |

**❌ No existen en `sellercenter-api.falabella.com` (responden `E008: Invalid Action`):**
`GetFeedList`, `GetFeedStatus`, `GetFeedCount`, `GetProductItem`, `GetAccount`, `GetSeller`, `GetTransactions`

---

#### `GET /listings/falabella/products`
```
?offset=0&limit=100&filter=active
```
```json
{
  "count": 1,
  "products": [{
    "SellerSku": "TV-SAMSUNG-55",
    "Name": "Samsung 55\" QLED 4K",
    "Price": "1899000",
    "SalePrice": "1750000",
    "Status": "active",
    "Quantity": 5,
    "ContentScore": 87,
    "QCStatus": "approved",
    "isPublished": 1,
    "Url": "https://www.falabella.com.co/..."
  }]
}
```

#### `GET /listings/falabella/products/score`
```
?skus=SKU1,SKU2
```
Score de calidad (0–100) por SKU. Clave para detectar fichas incompletas antes de publicar.
```json
{
  "scores": [{
    "SellerSku": "TV-SAMSUNG-55",
    "ContentScore": 87,
    "Attributes": [
      { "Attribute": "Name", "Score": 20, "MaxScore": 20 },
      { "Attribute": "Images", "Score": 15, "MaxScore": 20 }
    ]
  }]
}
```

#### `GET /listings/falabella/categories`
Árbol completo de categorías (22 raíz, con hijos anidados). Cada nodo tiene `CategoryId`, `Name`, `GlobalIdentifier`, `AttributeSetId`.

#### `GET /listings/falabella/categories/:name/attributes`
Atributos para una categoría. El `:name` es el `CategoryId` o el nombre de la categoría.
```json
{
  "total": 34,
  "required": 5,
  "attributes": [{
    "Label": "Marca",
    "FeedName": "brand",
    "IsMandatory": 1,
    "InputType": "dropdown",
    "Options": [{ "GlobalIdentifier": "brand_samsung", "Name": "Samsung" }]
  }]
}
```

#### `GET /listings/falabella/categories/suggest`
```
?q=televisor+samsung+55+pulgadas
```
Predice la categoría correcta dado un nombre de producto. Usar antes de crear un producto para asignar el `PrimaryCategory` correcto.
```json
{
  "suggestions": [{
    "CategoryId": "1626",
    "CategoryName": "Televisores"
  }]
}
```

#### `GET /listings/falabella/brands`
Lista global de marcas aceptadas por Falabella. Usar para validar el campo `Brand` antes de enviar un `ProductCreate`.
```json
{
  "count": 850,
  "brands": [{ "BrandId": "B001", "Name": "Samsung", "GlobalIdentifier": "brand_samsung" }]
}
```

#### `GET /listings/falabella/shipment-providers`
Proveedores de envío disponibles para el seller.
```json
{
  "providers": [
    { "Name": "Servientrega", "Default": "1", "ApiDefault": "1" },
    { "Name": "Coordinadora", "Default": "0", "ApiDefault": "0" }
  ]
}
```

#### `GET /listings/falabella/warehouse`
Bodegas logísticas configuradas para el seller.
```json
{
  "warehouses": [{
    "WarehouseId": "GSC-SCA067EAD756C96",
    "Name": "Bodega principal",
    "AddressType": "only_shipments",
    "IsDefault": "1"
  }]
}
```

#### `GET /listings/falabella/orders`
```
?createdAfter=2026-01-01T00:00:00Z&createdBefore=2026-10-01T00:00:00Z&status=delivered&limit=50&offset=0
```
Valores válidos para `status`: `pending`, `ready_to_ship`, `delivered`, `canceled`.

#### `POST /listings/falabella/products`
Crea un producto en estado borrador. El proceso es **asíncrono**: la API devuelve un `feedId` que hay que consultar con `GET /listings/falabella/feeds/:feedId`.

```json
// Body
{
  "sellerSku": "TV-SAM-55-4K",
  "name": "Televisor Samsung 55\" Crystal UHD 4K Smart TV",
  "description": "Descripción completa del producto...",
  "brand": "Samsung",
  "primaryCategory": "1626",
  "price": 2499000,
  "salePrice": 2199000,
  "taxClass": "IVA19",
  "quantity": 0,
  "images": ["https://cdn.example.com/tv-samsung-55.jpg"],
  "attributes": [
    { "feedName": "color", "value": "Negro" },
    { "feedName": "voltage", "value": "110V" }
  ]
}
// Respuesta 202
{
  "feedId": "98765",
  "message": "Producto enviado a Falabella. Consulta el estado con GET /listings/falabella/feeds/:feedId"
}
```

> **Flujo completo para crear un producto:**
> 1. `GET /categories/suggest?q=nombre` → obtener `categoryId`
> 2. `GET /categories/:categoryId/attributes` → ver campos obligatorios (`IsMandatory: 1`)
> 3. `GET /brands` → validar nombre exacto de la marca
> 4. `POST /products` → crear borrador, guardar `feedId`
> 5. `GET /feeds/:feedId` → esperar `Status: Finished` (puede tardar segundos a minutos)

#### `PATCH /listings/falabella/products/:sku`
Actualiza campos de un SKU existente. Mismo body que el POST, todos los campos son opcionales excepto `sellerSku`.

#### `GET /listings/falabella/feeds/:feedId`
Consulta el resultado de un `ProductCreate` o `ProductUpdate`.
```json
{
  "Feed": "98765",
  "Status": "Finished",
  "Action": "ProductCreate",
  "TotalRecords": 1,
  "ProcessedRecords": 1,
  "FailedRecords": 0,
  "FeedErrors": ""
}
```
Valores de `Status`: `Queued` → `Processing` → `Finished` | `Error`

---

## Dependencias clave

| Paquete | Motivo |
|---|---|
| `hono` | Framework HTTP ultraligero, compatible con Node.js y Vercel |
| `@hono/node-server` | Adaptador Node.js para Hono |
| `tsx` | Ejecuta TypeScript en desarrollo sin paso de build |
