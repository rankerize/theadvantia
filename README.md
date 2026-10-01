# 🚀 Advantia — Plataforma B2B SaaS (Vitrina & Trastienda)

**Advantia** ([theadvantia.com](https://theadvantia.com)) es una plataforma B2B SaaS diseñada para vendedores, marcas y empresas distribuidoras en Colombia y Latinoamérica. 

El sistema combina dos soluciones integradas:
- **Vitrina**: Optimización masiva de catálogos y SEO en marketplaces (Mercado Libre, Falabella, Amazon, Homecenter) mediante el protocolo **CatalogAI** y procesamiento de imágenes con Inteligencia Artificial.
- **Trastienda**: Agentes conversacionales de IA sobre **WhatsApp Business API** especializados en recuperación de cartera (cobros), cotizaciones comparativas y toma e interpretación de pedidos.

---

## 🏗️ Estructura del Repositorio

El proyecto está estructurado en microservicios modulares y utilidades de procesamiento multimedia con Inteligencia Artificial:

```
.
├── agents-service/           # 🤖 Microservicio de Agentes de IA para WhatsApp (Trastienda)
├── marketplaces-service/     # 🛒 Microservicio de Integración y SEO de Marketplaces (Vitrina)
├── payments-service/         # 💳 Microservicio de Procesamiento de Pagos y Webhooks (Wompi)
├── 05-crear-imagenes-flux/   # 🎨 Módulo de Generación y Ambientación de Imágenes IA (Flux / Atenea)
├── 06-quitar-fondo/          # ✂️ Módulo de Segmentación y Remoción Masiva de Fondos (WebGPU / WASM)
├── CLAUDE.md                 # 📄 Guía de arquitectura y convenciones del sistema
└── README.md                 # 📖 Documentación principal del repositorio
```

---

## 📦 Componentes y Servicios

### 1. 🤖 `agents-service` (Trastienda)
Orquestación de agentes conversacionales sobre WhatsApp Business API (Hono / Node.js / TypeScript).
- **Cobros (`collections`):** Gestión y seguimiento de cartera vencida con clientes.
- **Cotizaciones (`quotes`):** Comparativas automatizadas de proveedores.
- **Pedidos (`orders`):** Recepción e interpretación de pedidos en texto, audio o imágenes.

### 2. 🛒 `marketplaces-service` (Vitrina)
Sincronización y optimización de publicaciones en canales e-commerce.
- **Conectores integrados:** Mercado Libre, Falabella Seller Center, Amazon SP-API y Homecenter.
- **CatalogAI Protocol:** Actualización y optimización SEO masiva de títulos, atributos y descripciones.

### 3. 💳 `payments-service`
Gestión de cobros, suscripciones y pasarela de pago local.
- Integración con **Wompi** (Bancolombia, PSE, Nequi, Tarjetas).
- Webhooks de confirmación y estado de transacciones.

### 4. 🎨 `05-crear-imagenes-flux`
Generación de imágenes fotorrealistas de producto con ambientación y cambio de escena.
- Motor **Flux / Gemini Flash Image** integrado con Falabella Atenea AI Studio.
- Sistema de cola en Firestore (`flux_jobs`) y Worker local asistido por Playwright.

### 5. ✂️ `06-quitar-fondo`
Remoción de fondos masiva y privada ejecutada directamente en el navegador del cliente.
- Inferencia ultrarrápida local mediante **WebGPU / WASM (ONNX Runtime)** y `@imgly/background-removal`.
- Formatos de salida: Fondo blanco puro (`#FFFFFF`) para estándares de catálogo (Falabella), PNG transparente o color personalizado con empaquetado ZIP.

---

## 🛠️ Stack Tecnológico Global

- **Lenguajes & Runtimes:** Node.js (TypeScript / ES Modules), Python (scripts auxiliares).
- **Frameworks HTTP:** Hono, `@hono/node-server`.
- **IA & ML:** WebGPU/WASM (ONNX), Flux / Gemini Flash Image via Atenea AI Studio, OpenAI API.
- **Base de Datos & BaaS:** Supabase (PostgreSQL), Firebase Firestore.
- **Canales y Pagos:** Meta WhatsApp Cloud API, Wompi Payment Gateway.

---

## 🚀 Inicio Rápido

### Requisitos Previos
- Node.js >= 20.x
- npm / pnpm / yarn

### Ejecutar un servicio en desarrollo
Navega a cualquiera de los microservicios (`agents-service`, `marketplaces-service`, `payments-service`) e instala dependencias:

```bash
cd agents-service
npm install
npm run dev
```

Cada servicio cuenta con su propio archivo `.env.example` y `README.md` detallado con sus endpoints y configuración específica.

---

## 🔒 Licencia y Propiedad

Propiedad de **Advantia** ([theadvantia.com](https://theadvantia.com)). Todos los derechos reservados.
