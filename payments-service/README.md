# payments-service

Microservicio HTTP que gestiona los pagos de la plataforma Advantia usando **Wompi** (pasarela colombiana de Bancolombia). Recibe webhooks de eventos de transacción, verifica su autenticidad y expone endpoints para consultar el estado de pagos.

Puerto por defecto: **3003**

---

## Arquitectura interna

```
payments-service/
├── src/
│   ├── providers/
│   │   └── wompi.ts       # getTransaction() + verifyChecksum() SHA-256
│   ├── routes/
│   │   └── payments.ts    # GET /payments/transactions/:id
│   ├── webhooks/
│   │   └── wompi.ts       # POST /webhooks/wompi — valida firma y procesa eventos
│   ├── types/
│   │   └── index.ts       # WompiTransaction, WompiEvent, WompiCurrency
│   └── index.ts           # Servidor Hono en puerto 3003
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Instalación y ejecución local

```bash
cd payments-service
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
| `PORT` | Puerto del servidor (default: `3003`) |
| `WOMPI_ENV` | `"sandbox"` para pruebas, `"production"` para producción |
| `WOMPI_PUBLIC_KEY` | Llave pública (se usa en el frontend para el widget de pago) |
| `WOMPI_PRIVATE_KEY` | Llave privada (se usa en el servidor para consultar transacciones) |
| `WOMPI_EVENTS_SECRET` | Secreto de eventos para verificar la firma de los webhooks |
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio para activar suscripciones post-pago |

> Obtener llaves en: dashboard.wompi.co → Configuración → Llaves de API

---

## Endpoints

### `GET /health`
```json
{ "status": "ok", "service": "payments" }
```

---

### `GET /payments/transactions/:id`
Consulta una transacción Wompi por su ID.
```json
{
  "id": "123456-789012-345678",
  "status": "APPROVED",
  "amount_in_cents": 120000000,
  "currency": "COP",
  "payment_method_type": "CARD",
  "reference": "plan-esencial-tenant-abc",
  "customer_email": "cliente@empresa.com",
  "created_at": "2026-10-01T20:00:00.000Z"
}
```

Estados posibles: `PENDING` | `APPROVED` | `DECLINED` | `VOIDED` | `ERROR`

---

### `POST /webhooks/wompi`
Wompi llama a este endpoint cuando una transacción cambia de estado.

```json
// Body enviado por Wompi
{
  "event": "transaction.updated",
  "data": {
    "transaction": {
      "id": "123456-789012-345678",
      "status": "APPROVED",
      "amount_in_cents": 120000000,
      "currency": "COP",
      "payment_method_type": "NEQUI",
      "reference": "plan-esencial-tenant-abc",
      "customer_email": "cliente@empresa.com",
      "created_at": "2026-10-01T20:00:00.000Z"
    }
  },
  "signature": {
    "properties": ["transaction.id", "transaction.status", "transaction.amount_in_cents"],
    "checksum": "abc123..."
  },
  "timestamp": 1727820000,
  "sent_at": "2026-10-01T20:00:00.000Z"
}

// Respuesta exitosa
{ "received": true }

// Firma inválida (401)
{ "error": "Invalid signature" }
```

**Verificación de firma:** `SHA-256(timestamp + WOMPI_EVENTS_SECRET)` en hex, comparado con `signature.checksum`. Cualquier evento con firma inválida se rechaza con 401.

Cuando `status === "APPROVED"`: activa la suscripción del tenant en Supabase (pendiente de implementar).

---

## Métodos de pago soportados

| Código | Método |
|---|---|
| `CARD` | Tarjeta débito/crédito |
| `NEQUI` | Nequi |
| `PSE` | PSE — débito bancario |
| `BANCOLOMBIA_TRANSFER` | Botón Bancolombia |

---

## Configurar el webhook en Wompi

1. Ingresar a dashboard.wompi.co → **Configuración → Eventos**
2. URL del webhook: `https://tu-dominio.com/webhooks/wompi`
3. Copiar el **Secreto de eventos** → agregarlo como `WOMPI_EVENTS_SECRET` en `.env`

Para pruebas locales: `ngrok http 3003` y usar la URL HTTPS en el dashboard de Wompi sandbox.

---

## Dependencias clave

| Paquete | Motivo |
|---|---|
| `hono` | Framework HTTP ultraligero, compatible con Node.js y Vercel |
| `@hono/node-server` | Adaptador Node.js para Hono |
| `tsx` | Ejecuta TypeScript en desarrollo sin paso de build |
| `crypto` (Node.js built-in) | Verificación SHA-256 sin dependencias externas |
