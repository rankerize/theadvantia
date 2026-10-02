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

## Arquitectura de Microservicios

El repositorio contiene los siguientes microservicios y módulos:

1. **`agents-service`**: Microservicio Hono (Node.js/TypeScript) para orquestación de agentes WhatsApp (cobros, cotizaciones, pedidos).
2. **`marketplaces-service`**: Microservicio Hono (Node.js/TypeScript) para conectores de Mercado Libre, Falabella, Amazon, Homecenter.
3. **`payments-service`**: Microservicio Hono (Node.js/TypeScript) para integración con Wompi checkout y webhooks.
4. **`05-crear-imagenes-flux`**: Módulo de ambientación de imágenes IA con Flux / Atenea Worker + Firestore Queue.
5. **`06-quitar-fondo`**: Módulo de remoción masiva de fondo con WebGPU / WASM en el navegador.
6. **`html-inpage-falabella`**: Módulo de especificación y generación de descripciones HTML **inPage** para Falabella (Colombia, Chile, Perú) y VTEX según el protocolo **CatalogAI** (Protocolo Maestro v3.4, Módulo 7 y Adendas v3.5-v3.7). Incluye script de validación `validar_html.py` y skill en `.agents/skills/catalogai-html-inpage/`.
7. **`estudios-de-mercado`**: Módulo de inteligencia SEO, datasets de demanda (CSV/JSON), clustering por categorías e informes analíticos CatalogAI. Incluye skill en `.agents/skills/estudios-de-mercado-catalogai/`.
8. **`web`**: Sitio público theadvantia.com en Astro (HTML estático para Hostinger). Contenido en español de Colombia, sin guion largo, montos completos en COP (`$1.200.000`) y "Mercado Libre" separado; ver `web/README.md`.

Ver `README.md` para más detalles de arquitectura y ejecución.



