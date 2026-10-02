# agents-service

Microservicio HTTP que orquesta los **agentes de IA conversacionales** de la línea **Trastienda** de Advantia. Recibe mensajes de WhatsApp vía webhook de Meta y los enruta a tres agentes especializados: cobros, cotizaciones y pedidos.

Puerto por defecto: **3002**

---

## Arquitectura interna

```
agents-service/
├── src/
│   ├── agents/
│   │   ├── collections.ts  # Cobros: recuperación progresiva de cartera
│   │   ├── quotes.ts       # Cotizaciones: tabla comparativa de proveedores
│   │   └── orders.ts       # Pedidos: interpretación de texto/audio/imagen
│   ├── routes/
│   │   └── webhook.ts      # GET verificación Meta + POST mensajes entrantes
│   ├── types/
│   │   └── index.ts        # WhatsAppMessage, AgentResponse, AgentType
│   └── index.ts            # Servidor Hono en puerto 3002
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Instalación y ejecución local

```bash
cd agents-service
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
| `PORT` | Puerto del servidor (default: `3002`) |
| `WA_VERIFY_TOKEN` | Token que defines tú y configuras en Meta Business Platform |
| `WA_ACCESS_TOKEN` | Token permanente de la WhatsApp Business API de Meta |
| `WA_PHONE_NUMBER_ID` | ID del número de teléfono en Meta |
| `SUPABASE_URL` | URL del proyecto Supabase (facturas, proveedores, pedidos) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio con acceso completo a Supabase |
| `OPENAI_API_KEY` | API Key de OpenAI para el procesamiento de lenguaje |

---

## Endpoints

### `GET /health`
```json
{ "status": "ok", "service": "agents" }
```

---

### `GET /webhook`
Verificación del webhook requerida por Meta al configurarlo. Compara `hub.verify_token` con `WA_VERIFY_TOKEN` y devuelve `hub.challenge` como texto plano (200) si coincide, o 403 si no.

### `POST /webhook`
Recibe mensajes entrantes de WhatsApp y los enruta al agente correspondiente.

```json
// Body
{
  "agentType": "collections",
  "message": {
    "from": "573001234567",
    "body": "Hola, ¿cuándo me pueden pagar la factura 1234?",
    "type": "text",
    "timestamp": 1727820000
  }
}

// Respuesta
{
  "to": "573001234567",
  "message": "Hola, te contactamos sobre tu factura pendiente. ¿Podemos coordinar el pago?"
}
```

Valores de `agentType`: `"collections"` | `"quotes"` | `"orders"`

El campo `type` en el mensaje acepta: `"text"` | `"audio"` | `"image"` | `"document"`. Si el tipo es distinto de `"text"`, se espera `mediaUrl` con la URL del archivo multimedia.

---

## Agentes

### `collections` — Cobros
Identifica facturas vencidas y ejecuta recuperación progresiva de cartera. **Pendiente:** conexión a Supabase para cargar facturas por número de teléfono.

### `quotes` — Cotizaciones
Procesa solicitudes de cotización y devuelve tabla comparativa de proveedores. **Pendiente:** parser de solicitud + consulta a BD de proveedores en Supabase.

### `orders` — Pedidos
Interpreta pedidos en lenguaje natural (texto, voz, foto de lista) y los convierte en órdenes estructuradas. **Pendiente:** extracción de SKUs con LLM + validación de stock.

---

## Configurar el webhook en Meta

1. Meta for Developers → tu App → WhatsApp → Configuración
2. URL del webhook: `https://tu-dominio.com/webhook`
3. Token de verificación: valor de `WA_VERIFY_TOKEN`
4. Suscribirse al evento `messages`

Para pruebas locales: usar `ngrok http 3002` y configurar la URL ngrok en Meta.

---

## Dependencias clave

| Paquete | Motivo |
|---|---|
| `hono` | Framework HTTP ultraligero, compatible con Node.js y Vercel |
| `@hono/node-server` | Adaptador Node.js para Hono |
| `tsx` | Ejecuta TypeScript en desarrollo sin paso de build |
