# ✂️ Módulo: Quitar Fondo (Local AI Background Remover) (`06-quitar-fondo`)

## 🎯 1. Propósito y Descripción General
Este servicio/módulo permite la **eliminación masiva, privada y local de fondos de imágenes de producto**. Ejecuta modelos neuronales de segmentación directa en el navegador mediante **WebGPU / WebAssembly (WASM)** y ONNX Runtime.

Características destacadas:
- **100% Client-Side:** No envía las imágenes a ningún servidor externo.
- **Exportación flexible:** PNG transparente o Fondo Blanco Puro (`#FFFFFF`) listo para catálogo de Falabella / Mercado Libre.
- **Procesamiento masivo:** Soporte para arrastrar lotes de imágenes y empaquetado directo en `.zip`.

---

## 📚 2. Documentación Detallada del Módulo

- 📖 **[AGENT.md](./AGENT.md):** Manual técnico del agente, integración con ONNX Runtime, opciones de configuración y flujo de trabajo.
- 📐 **[BG_REMOVER_RULES.md](./BG_REMOVER_RULES.md):** Guía de calidad de recorte, márgenes de seguridad (padding 5-10%) y especificaciones del lienzo de catálogo.

---

## 🏗️ 3. Componentes Principales

| Archivo | Función |
|---|---|
| `bgRemover.js` | Módulo principal con cola de procesamiento visual, canvas de renderizado y control WebGPU/WASM. |
| `AGENT.md` | Guía de implementación y dependencias. |
| `BG_REMOVER_RULES.md` | Estándares de calidad de imagen para marketplaces. |

---

## 🚀 4. Uso Rápido
Inicia el entorno del cliente y navega a la sección de eliminación de fondos:
```javascript
const options = {
  background: '#ffffff', // blanco puro
  paddingPercent: 8,     // margen perimetral
  device: 'gpu'          // WebGPU acelerado
};
```
