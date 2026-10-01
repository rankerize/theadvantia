# 🤖 Agents Service (Trastienda - Advantia)

## 🎯 1. Propósito y Qué Hace el Servicio
**agents-service** es el microservicio responsable de la orquestación de agentes conversacionales de Inteligencia Artificial sobre **WhatsApp Business API** para la línea de producto **Trastienda** de Advantia.

Trastienda automatiza interacciones clave con clientes y proveedores de empresas distribuidoras en Colombia mediante tres agentes especializados:
1. **Cobros (`collections`):** Identifica facturas vencidas y realiza la gestión progresiva de recuperación de cartera por WhatsApp.
2. **Cotizaciones (`quotes`):** Procesa solicitudes de cotización comparativa entre múltiples proveedores.
3. **Pedidos (`orders`):** Interpreta y estructura pedidos recibidos en formato de texto libre, notas de voz o imágenes.

---

## 🏗️ 2. Arquitectura y Estructura del Proyecto

```
agents-service/
├── src/
│   ├── agents/
│   │   ├── collections.ts   # Lógica del agente de cobros / cartera
│   │   ├── orders.ts        # Lógica del agente de toma de pedidos
│   │   └── quotes.ts        # Lógica del agente de cotizaciones
│   ├── routes/
│   │   └── webhook.ts       # Endpoint para webhook de Meta (WhatsApp)
│   ├── types/
│   │   └── index.ts         # Definiciones de TypeScript
│   └── index.ts             # Servidor HTTP Hono y montaje de rutas
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 🛠️ 3. Stack Tecnológico
- **Runtime:** Node.js (ES Modules, TypeScript)
- **Framework Web:** [Hono](https://hono.dev/) + `@hono/node-server`
- **Canal de comunicación:** Meta WhatsApp Cloud API / Webhook
- **Motor de ejecución:** `tsx` para desarrollo rápido

---

## 🔌 4. API Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Chequeo de salud del servicio (retorna `{ status: "ok", service: "agents" }`). |
| `GET` | `/webhook` | Verificación inicial del webhook requerida por Meta (`hub.mode`, `hub.verify_token`, `hub.challenge`). |
| `POST` | `/webhook` | Receptor de mensajes entrantes de WhatsApp. Enruta según el campo `agentType` (`collections`, `quotes`, `orders`). |

### Ejemplo de Payload POST `/webhook`
```json
{
  "agentType": "collections",
  "message": {
    "from": "573001234567",
    "text": "Hola, quiero saber el saldo de mi factura"
  }
}
```

---

## 🔑 5. Variables de Entorno (`.env`)

```env
PORT=3002
WA_VERIFY_TOKEN=tu_token_de_verificacion_meta
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_clave_anonima
```

---

## 🚀 6. Scripts Disponibles

En el directorio `agents-service`:

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
