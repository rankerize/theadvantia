# 🎨 AGENT: Crear Imágenes IA con Flux / Atenea Worker

## 🎯 1. Propósito y Qué Hace el Módulo
El microservicio **Crear Imágenes IA** genera ambientaciones fotorrealistas de productos, modelos luciendo prendas, cambios de escena y mockups de catálogo utilizando el modelo **Flux / Gemini Flash Image** a través de la infraestructura interna de **Falabella Atenea AI Studio**.

Funciona mediante una arquitectura híbrida de **Cola en Firestore + Worker Central**, permitiendo que múltiples usuarios en la Suite generen imágenes en paralelo sin necesidad de compartir credenciales o cookies personales.

---

## 🏗️ 2. Arquitectura y Componentes

```
┌─────────────────────────┐       ┌────────────────────────┐       ┌──────────────────────┐
│  Suite Web (Frontend)   │ ───>  │ Cloud Functions Queue  │ <───> │ Atenea Local Worker  │
│  `fluxImages.js`        │       │ `fluxWorkerQueue`      │       │ `atenea-worker/`     │
└─────────────────────────┘       └────────────────────────┘       └──────────────────────┘
                                                                               │
                                                                               ▼
                                                                  ┌──────────────────────┐
                                                                  │ Atenea AI Studio     │
                                                                  │ (Playwright Session) │
                                                                  └──────────────────────┘
```

| Archivo / Componente | Rol |
|---|---|
| `fluxImages.js` | Interfaz de usuario en la Suite (selección de modo SKU/Subir archivo, prompts, aspectos, lightbox y descarga ZIP). |
| `atenea-worker/server.js` | Servidor Node.js con Playwright que mantiene la sesión corporativa de Microsoft/Atenea y procesa los jobs. |
| `atenea-worker/open-login.js` | Utilidad para abrir el navegador y realizar el login inicial en Microsoft SSO. |
| `functions/index.js` (`fluxJobCreate`, `fluxJobStatus`, `fluxWorkerQueue`, `fluxWorkerStatus`) | Backend serverless que encola trabajos en Firestore (`flux_jobs`) y coordina las peticiones. |
| `FLUX_IMAGES_RULES.md` | Reglas de composición, prompts de estilo, aspectos (1:1, 4:5, 16:9) y post-procesamiento. |

---

## 🔑 3. Requisitos y Secretos

1. **Firebase Functions Secret:**
   - `ATENEA_WORKER_KEY`: Clave secreta compartida entre el backend y el worker local.
2. **Dependencias del Worker:**
   - Node.js LTS, Playwright Chromium (`npx playwright install chromium`).
3. **Plan Firebase:** Blaze activo con facturación habilitada en Google Cloud.

---

## 🚀 4. Cómo Poner en Marcha el Worker (Guía Paso a Paso)

### Paso 1: Iniciar el Worker
En la carpeta `atenea-worker`:
```bash
cd "/Users/cesarandresjimenezarci/Documents/Fala Cesar/atenea-worker"
ATENEA_WORKER_KEY="<TU_CLAVE>" ATENEA_HEADLESS=false node server.js
```

### Paso 2: Abrir e Iniciar Sesión en Atenea
En otra terminal o mediante petición HTTP:
```bash
curl -X POST http://127.0.0.1:8787/auth/start -H "X-Atenea-Worker-Key: <TU_CLAVE>"
```
En la ventana de Chromium que se abre:
1. Inicia sesión con tus credenciales de Microsoft Falabella.
2. Navega hasta **Flux AI Studio** (`https://atenea.falabella.com/services/aistudio/flux`).
3. La sesión queda persistida en `data/atenea-profile-fresh`.

### Paso 3: Comprobar Estado
```bash
curl -s http://127.0.0.1:8787/status -H "X-Atenea-Worker-Key: <TU_CLAVE>"
# Debe responder: {"authenticated":true,"url":"...","queueEnabled":true}
```

---

## 📋 5. Formato del Payload de Generación

```json
{
  "payload": {
    "model": "gemini-3.1-flash-image",
    "contents": [
      {
        "parts": [
          { "inlineData": { "data": "<BASE64_IMAGEN_PRODUCTO>", "mimeType": "image/jpeg" } },
          { "text": "ambientación minimalista moderna sobre mesa de madera, iluminación de estudio suave, 4k" }
        ]
      }
    ],
    "config": {
      "imageConfig": {
        "aspectRatio": "1:1",
        "imageSize": "1K"
      }
    }
  }
}
```

---

## 🛡️ 6. Reglas de Entrega y Calidad
- **Preservación del Producto:** El producto original de la foto nunca debe distorsionarse ni perder logos o etiquetas de marca.
- **Formato de Guardado:** Únicamente se extrae `candidates.content.parts.inlineData` para evitar errores de anidación en Firestore.
- **Relaciones de Aspecto Admitidas:** `1:1` (Cuadrado), `4:5` (Catálogo móvil), `16:9` (Banners).
