# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Negocio

**Advantia** (theadvantia.com) es una startup B2B SaaS colombiana con dos líneas de producto:

- **Vitrina**: Optimización SEO de catálogos en marketplaces (Mercado Libre, Falabella, Amazon, Homecenter). Incluye reescritura de títulos/atributos/descripciones con el protocolo CatalogAI, gestión de contenido visual y estrategia de canal.
- **Trastienda**: Agentes de IA sobre WhatsApp para distribuidoras. Tres agentes especializados: cobros (recuperación de cartera), cotizaciones (comparativas de proveedores) y pedidos (interpretación de texto/audio/imagen). El dato de entrada es siempre un export de Excel o Google Sheets; la salida aparece en un dashboard de gestión.

Mercado objetivo: vendedores/distribuidores colombianos. Pasarela de pago: Wompi (Bancolombia, PSE, Nequi).

## Dominios del sistema

| Dominio | Responsabilidad |
|---|---|
| Catálogo | SKUs, atributos, títulos optimizados, imágenes, A+ content |
| Marketplaces | Conexión con APIs de MeLi, Falabella, Amazon, Homecenter; sincronización de listings |
| Agentes IA | Orquestación de conversaciones WhatsApp (cobros, cotizaciones, pedidos) |
| Analytics | KPIs de embudo: SEO Reach → CTR → visitas orgánicas → conversión |
| Clientes | CRM ligero: empresa, contacto WhatsApp, línea de interés, historial de piloto |
| Pagos | Suscripciones y pagos únicos vía Wompi |

## Integraciones externas clave

- **WhatsApp Business API** (Meta Cloud API o proveedor como Twilio/360dialog): canal principal de los agentes Trastienda.
- **Mercado Libre API**: lectura de listings, actualización de atributos, métricas de visibilidad.
- **Falabella Seller Center API**: base URL `https://sellercenter-api.falabella.com/`. Auth HMAC-SHA256 firmando valores URL-encoded. Credenciales por tenant vía headers `x-fala-user-id` / `x-fala-api-key`. Ver tabla de endpoints en `marketplaces-service/README.md`.
- **Wompi**: checkout y webhooks de confirmación de pago.
- **Google Sheets / Excel**: fuente de datos inicial de los pilotos Trastienda (sin integraciones ERP en la etapa de pilot).

## Falabella API — Guía rápida para no repetir el reconocimiento

Verificado el 2026-10-01 contra producción. Endpoints que **sí existen**:
`GetProducts`, `GetContentScore`, `GetCategoryTree`, `GetCategoryAttributes`, `GetCategorySuggestion` (parámetro `Name=`, no `Search=`), `GetBrands`, `GetShipmentProviders`, `GetWarehouse`, `GetOrders`, `GetFailureReasons`, `GetFeedRawInput` (estado de feed con `FeedIdList=[id]`), `ProductCreate`, `ProductUpdate`.

Endpoints que **no existen** (`E008: Invalid Action`):
`GetFeedList`, `GetFeedStatus`, `GetFeedCount`, `GetProductItem`, `GetAccount`, `GetSeller`, `GetTransactions`.

## Convenciones que deben respetarse

- Los precios y montos se expresan siempre en **COP** (pesos colombianos).
- Los agentes de IA son **stateful por conversación**: cada hilo de WhatsApp mantiene contexto de la sesión activa.
- El piloto Trastienda dura **14 días**; la arquitectura debe soportar onboarding/offboarding de tenants sin downtime.
- Los reportes de Vitrina son **mensuales** e incluyen mapas de posicionamiento competitivo por SKU.

## Sistemas comerciales (agentes de ventas y marketing de ADVANTIA)

Además del producto, el repo contiene dos sistemas que llenan el pipeline de ADVANTIA. Ambos operan en **modo copiloto**: los agentes proponen y Nicolás aprueba; ningún agente publica ni envía mensajes por su cuenta. Cada sistema tiene una fuente de verdad: ante cualquier duda de reglas o formato, se lee ahí y no en este resumen.

### 1. Contenido (LinkedIn + blog)

Dos agentes mantienen la presencia de ADVANTIA: el editorial redacta los posts de la semana y los artículos del blog y los entrega en un pull request; el publicador programa en Upload-Post lo que ya se aprobó con el merge.

Fuentes de verdad:
- Skills: `.claude/skills/agente-contenido-editorial/SKILL.md` y `.claude/skills/agente-linkedin-publicador/SKILL.md`.
- Flujo, activación y límites: `contenido/README.md` (estrategia, calendario, cifras permitidas y registro de publicaciones viven en `contenido/`).
- Despliegue de artículos: `.github/workflows/desplegar-web.yml` (cada merge a `main` que toque `web/**` compila y sube `web/dist/` a Hostinger).

### 2. Prospección (LinkedIn)

Flujo de punta a punta:

1. **Harvey** (local): descubre empresas y deja el archivo de empresas.
2. **Clay**: identifica al decisor de mercadeo, e-commerce o comercial de cada empresa. Solo nombre, cargo y perfil; sin correos ni teléfonos.
3. **Agente 4 v3** (`agente4-prospeccion-linkedin`): verifica el listado público de la empresa para armar un gancho verificable, redacta las invitaciones y los mensajes (trato de usted) y deja todo en una cola de aprobación; registra en HubSpot (portal 51945405) y lleva los seguimientos como tareas.
4. **Envío manual en LinkedIn**: Nicolás envía a mano. Ningún agente escribe ni navega LinkedIn.

El **Agente 5** (`agente5-crm-hubspot`) es la única fuente de verdad del pipeline: recibe los deals del Agente 4 y valida el decisor antes de avanzar la etapa.

Fuentes de verdad:
- Agente 4 v3: `.claude/skills/agente4-prospeccion-linkedin/SKILL.md` y `references/plantillas-mensajes.md`.
- Agente 5: `.claude/skills/agente5-crm-hubspot/SKILL.md`.
- Logs de cada corrida: `agentes/agente4-prospeccion-linkedin/logs/` y `agentes/agente5-crm-hubspot/logs/`. Los logs llevan solo IDs de HubSpot, nombres de empresa y conteos; nunca nombres de personas ni URLs de perfiles.

Regla del repo: ningún archivo (documentación, logs, plantillas, CSV) incluye nombres de prospectos ni URLs de perfiles de LinkedIn.

## Arquitectura de Microservicios

El repositorio contiene los siguientes microservicios y módulos:

1. **`agents-service`**: Microservicio Hono (Node.js/TypeScript) para orquestación de agentes WhatsApp (cobros, cotizaciones, pedidos).
2. **`marketplaces-service`**: Microservicio Hono (Node.js/TypeScript) para conectores de Mercado Libre, Falabella, Amazon, Homecenter.
3. **`payments-service`**: Microservicio Hono (Node.js/TypeScript) para integración con Wompi checkout y webhooks.
4. **`market-research-service`**: Microservicio Hono (Node.js/TypeScript) en puerto 3004 para API de estudios de mercado, datasets de demanda e inteligencia CatalogAI.
5. **`05-crear-imagenes-flux`**: Módulo de ambientación de imágenes IA con Flux / Atenea Worker + Firestore Queue.
6. **`06-quitar-fondo`**: Módulo de remoción masiva de fondo con WebGPU / WASM en el navegador.
7. **`html-inpage-falabella`**: Módulo de especificación y generación de descripciones HTML **inPage** para Falabella y VTEX.
8. **`estudios-de-mercado`**: Módulo de inteligencia SEO, datasets (CSV/JSON), clustering e informes.
9. **`web`**: Sitio público theadvantia.com en Astro (HTML estático para Hostinger) con portal de clientes privado (login en PHP). Toda herramienta nueva del portal usa `<Base ... portal>` (si no, la compilación falla) y nunca lleva claves de API en la página, porque todo cliente con sesión puede ver su código. Ver `web/README.md`, sección "Portal de clientes".


Ver `README.md` para más detalles de arquitectura y ejecución.



