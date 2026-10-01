# ✂️ AGENT: Quitar Fondo (Local AI Background Remover)

## 🎯 1. Propósito y Qué Hace el Módulo
El microservicio **Quitar Fondo** permite eliminar fondos de imágenes de producto de forma 100% masiva, privada y ultrarrápida, ejecutando modelos de segmentación neuronal directamente en el navegador del cliente mediante **WebGPU / WebAssembly (WASM)** y ONNX Runtime.

Características principales:
- **Zero-Server:** No envía imágenes a servidores externos ni consume créditos de APIs de pago.
- **Exportación Versátil:**
  - PNG Transparente con recorte perfecto.
  - Fondo Blanco Puro (`#FFFFFF`) listo para el catálogo de Falabella.
  - Fondo personalizado con color hexadecimal.
- **Procesamiento por Lotes:** Arrastra decenas de imágenes y procesa en paralelo con cola visual y barra de progreso.
- **Descarga Masiva:** Empaquetado automático en un archivo `.zip`.

---

## 🏗️ 2. Arquitectura y Archivos Clave

| Archivo | Rol |
|---|---|
| `bgRemover.js` | Módulo principal con cola de procesamiento, canvas de composición, exportación y control de WebGPU/WASM. |
| `public/models/` | Pesos del modelo de segmentación de fondo ONNX pre-descargados. |
| `vite.config.js` | Configuración de assets `.wasm` y exclusión de bundling para `@imgly/background-removal`. |
| `BG_REMOVER_RULES.md` | Especificaciones de calidad, padding perimetral (5-10%) y fondo blanco puro. |

---

## 🔑 3. Requisitos y Dependencias
- **Librería Core:** `@imgly/background-removal` o `@imgly/background-removal-node`.
- **Motor de Inferencia:** ONNX Runtime Web (`ort.bundle.min.mjs` y `ort.webgpu.bundle.min.mjs`).
- **Empaquetador:** `jszip` para descarga masiva.
- **Compatibilidad de Navegador:** Google Chrome, Microsoft Edge, Firefox, Safari (con soporte WebGPU o fallback WASM).

---

## 🚀 4. Cómo Hacerlo Funcionar (Guía Paso a Paso)

### Modo 1: Desarrollo Local
1. Inicia el servidor de desarrollo: `npm run dev`.
2. Abre la vista **Quitar Fondo** (`#/fondos` o en la tarjeta del Hub).
3. Arrastra una o varias imágenes (`.jpg`, `.png`, `.webp`).
4. Selecciona el modo de salida:
   - ⚪ **Fondo Blanco Puro (Falabella):** Agrega canvas blanco centrado.
   - 🏁 **Transparente (PNG):** Conserva solo el canal alpha.
   - 🎨 **Color Personalizado:** Elige el color de fondo.
5. Ajusta el padding/margen perimetral si el producto queda muy ajustado a los bordes.
6. Haz clic en **Procesar Todo** y luego en **Descargar ZIP**.

---

## 📋 5. Opciones de Configuración

```javascript
const options = {
  background: '#ffffff', // '#ffffff' para blanco, 'transparent' para PNG transparente
  paddingPercent: 8,     // Margen de seguridad alrededor del producto (0-20%)
  outputFormat: 'image/png',
  quality: 0.95,
  device: 'gpu'          // 'gpu' si WebGPU está disponible, 'cpu' como fallback WASM
};
```

---

## 🛡️ 6. Reglas de Catálogo Falabella
- Las imágenes principales de producto en Falabella deben tener fondo **blanco puro (#FFFFFF)** sin sombras duras ni artefactos grises.
- El producto debe ocupar entre el **80% y 90%** del lienzo visual.
- La resolución recomendada de salida es **1000x1000 px** o **1200x1200 px**.
