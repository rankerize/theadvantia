# 🎨 Módulo: Crear Imágenes IA con Flux / Atenea Worker (`05-crear-imagenes-flux`)

## 🎯 1. Propósito y Descripción General
Este servicio/módulo genera **ambientaciones fotorrealistas de producto**, modelos luciendo prendas, cambios de escena y mockups de catálogo utilizando el modelo **Flux / Gemini Flash Image** mediante la infraestructura interna de **Falabella Atenea AI Studio**.

Funciona mediante una arquitectura híbrida de **Cola en Firestore + Worker Central en Node.js/Playwright**, permitiendo a múltiples usuarios generar imágenes de forma concurrente.

---

## 📚 2. Documentación Detallada del Módulo

Para información completa sobre la arquitectura, configuración del worker y reglas de diseño:

- 📖 **[AGENT.md](./AGENT.md):** Guía técnica detallada, comandos de arranque del worker Playwright, payloads de generación y flujo de encolamiento.
- 📐 **[FLUX_IMAGES_RULES.md](./FLUX_IMAGES_RULES.md):** Reglas de composición de imagen, relaciones de aspecto (1:1, 4:5, 16:9), prompts de estilo y estándares visuales.

---

## 🏗️ 3. Componentes Principales

| Archivo | Función |
|---|---|
| `fluxImages.js` | Componente/interfaz frontend en la suite (selección de imágenes, prompts, lightbox y descargas ZIP). |
| `flux_atenea.py` | Script complementario para automatizaciones o scraping de tareas en la plataforma Atenea. |
| `AGENT.md` | Manual operativo del agente y worker. |
| `FLUX_IMAGES_RULES.md` | Directrices de calidad de imagen y especificaciones de prompt. |

---

## 🚀 4. Inicio Rápido (Worker Local)

1. **Levantar el servidor Worker Atenea:**
   ```bash
   ATENEA_WORKER_KEY="<TU_CLAVE>" ATENEA_HEADLESS=false node server.js
   ```
2. **Autenticación inicial:**
   Navegar e iniciar sesión en Microsoft SSO en la instancia de Chromium abierta.
