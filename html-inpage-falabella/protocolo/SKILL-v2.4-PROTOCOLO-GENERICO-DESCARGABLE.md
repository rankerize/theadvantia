# SKILL v2.4 - PROTOCOLO GENÉRICO DE OPTIMIZACIÓN SEO
## Para cualquier producto de e-commerce

**Versión**: 2.4 (Actualizada)
**Fecha**: Mayo 2026
**Status**: ✅ Listo para usar en cualquier proyecto de Claude
**Compatible**: Falabella Colombia, Amazon, MercadoLibre, Éxito, Carrefour

---

## 🚀 CÓMO USAR ESTE PROTOCOLO

1. **Copiar todo el contenido de este archivo**
2. **Pegar en un nuevo proyecto de Claude** como contexto/instrucciones
3. **Proporcionar datos del producto**: Nombre, marca, especificaciones, URL
4. **Claude aplicará automáticamente TODOS los pasos**

### EJEMPLO DE PROMPT PARA USAR:

```
Aplica la SKILL v2.4 para optimizar este producto:

Producto: [NOMBRE DEL PRODUCTO]
Marca: [MARCA]
Modelo: [MODELO]
Especificaciones clave:
- [Especificación 1]
- [Especificación 2]
- [Especificación 3]
URL o fuente: [LINK SI APLICA]

Sigue PASO 0️⃣, PASO 1️⃣, PASO 2️⃣, etc. hasta PASO 5️⃣
Aplica formato OPCIÓN 3 para tabla
Calcula cobertura OPCIÓN C CORRECTA (0%-100%)
```

---

## 🔴 PASO 0️⃣ - VALIDACIÓN OBLIGATORIA DE CARACTERÍSTICAS

**Este paso SIEMPRE es primero, sin excepción.**

### PROCEDIMIENTO:

1. **Obtener especificaciones REALES del producto**
   - Ir a ficha técnica oficial
   - Leer descripción del fabricante
   - Buscar especificaciones en Google
   - Capturar URL de fuente

2. **Documentar especificaciones**
```
ESPECIFICACIONES VERIFICADAS:
├─ Característica 1: [VALOR] ✓
├─ Característica 2: [VALOR] ✓
├─ Característica 3: [VALOR] ✓
└─ Característica 4: [VALOR] ✓
```

3. **Validar cada palabra clave**
```
| CARACTERÍSTICA | ¿REAL? | ¿INCLUIR? | JUSTIFICACIÓN |
|---|---|---|---|
| [Palabra 1] | ✅ SÍ | ✅ SÍ | [Razón] |
| [Palabra 2] | ❌ NO | ❌ NO | [Razón] |
```

4. **Regla de oro**
```
NUNCA incluir:
- Palabras clave FALSAS
- Características que NO tiene el producto
- Promesas que NO puede cumplir
- Exageraciones sin validación

SÍ incluir:
- Especificaciones VERIFICADAS
- Características CONFIRMADAS
- Beneficios REALES
```

**RESULTADO**: ✅ TODAS características son VERACES o ❌ RECHAZAR

---

## PASO 1️⃣ - IDENTIFICAR MERCADOS

### A) MERCADO GENERAL
Búsquedas genéricas sobre el TIPO de producto
```
Ejemplo: "patineta eléctrica", "bicicleta eléctrica", "multigimnasio"
Volumen: Generalmente ALTO (10,000+ búsquedas/mes)
```

### B) MERCADO ESPECÍFICO
Búsquedas sobre MARCA, MODELO, CARACTERÍSTICAS TÉCNICAS
```
Ejemplo: "patineta xiaomi", "bicicleta auteco 750w", "multigimnasio 72kg"
Volumen: Generalmente BAJO-MEDIO (1,000-10,000 búsquedas/mes)
```

### C) DOCUMENTO REQUERIDO
```
MERCADOS IDENTIFICADOS:

MERCADO GENERAL:
├─ [Término genérico 1]: [búsquedas/mes]
├─ [Término genérico 2]: [búsquedas/mes]
└─ TOTAL GENERAL: [suma] búsquedas

MERCADO ESPECÍFICO:
├─ [Término específico 1]: [búsquedas/mes]
├─ [Término específico 2]: [búsquedas/mes]
└─ TOTAL ESPECÍFICO: [suma] búsquedas

BRECHA A CAPTURAR: [general - específico] búsquedas ([%])
```

---

## PASO 2️⃣ - TABLA DE PALABRAS CLAVE (FORMATO OPCIÓN 3)

**⚠️ ESTE FORMATO ES OBLIGATORIO - SIN EXCEPCIONES**

### ESTRUCTURA:
```
PALABRA CLAVE                      | BÚSQUEDAS | INTENCIÓN              | OVERLAP | MERCADO
─────────────────────────────────────────────────────────────────────────────────────────────
[palabra 1]                        | [número]  | [tipo intención]       | [%]     | ⭐ GENERAL
[palabra 2]                        | [número]  | [tipo intención]       | [%]     | ⭐ GENERAL
[palabra 3]                        | [número]  | [tipo intención]       | [%]     | 🎯 ESPECÍFICO
[palabra 4]                        | [número]  | [tipo intención]       | [%]     | 🎯 ESPECÍFICO
[palabra 5]                        | [número]  | [tipo intención]       | [%]     | 🎯 ESPECÍFICO
[palabra 6]                        | [número]  | [tipo intención]       | [%]     | 🎯 ESPECÍFICO
[palabra 7]                        | [número]  | [tipo intención]       | [%]     | 🎯 ESPECÍFICO
[palabra 8]                        | [número]  | [tipo intención]       | [%]     | 🎯 ESPECÍFICO
[palabra 9]                        | [número]  | [tipo intención]       | [%]     | 🎯 ESPECÍFICO
[palabra 10]                       | [número]  | [tipo intención]       | [%]     | ◆ GENERAL-ESPECÍFICO
```

### REQUISITOS OBLIGATORIOS:
- ✅ Exactamente 10 palabras (máximo)
- ✅ Encabezado + separador (─────)
- ✅ Datos REALES de Keyword Surfer u otra herramienta
- ✅ Columnas: Palabra | Búsquedas | Intención | Overlap | Mercado
- ✅ Íconos: ⭐ (general), 🎯 (específico), ◆ (híbrido)
- ✅ Ordenado por volumen DESC
- ✅ EN BLOQUE CODE (```...```)

### TIPOS DE INTENCIÓN:
- **Compra genérica**: Usuario busca el tipo de producto
- **Compra + marca**: Usuario busca marca específica
- **Compra + característica**: Usuario busca con especificación técnica
- **Compra + ubicación**: Usuario busca en ubicación
- **Información**: Usuario busca información sobre el producto

### OVERLAP:
- Porcentaje de superposición con otras palabras clave
- Si "patineta eléctrica" y "scooter eléctrico" son sinónimos = 100%
- Si son distintos = 0%-50%

---

## PASO 3️⃣ - COBERTURA OPCIÓN C (FÓRMULA CORRECTA)

**⚠️ LA FÓRMULA CORRECTA: Nunca > 100%**

### FÓRMULA UNIVERSAL:
```
COBERTURA = (Búsquedas capturadas del mercado X) 
            ÷ (Total de búsquedas del mercado X) 
            × 100

RANGO VÁLIDO: 0% - 100% SIEMPRE
```

### APLICACIÓN:

#### MERCADO GENERAL:
```
Cobertura General % = (Búsquedas GENERAL en título) 
                      ÷ (Total GENERAL disponible)

Ejemplo:
- Título contiene: "patineta eléctrica" = 40,500 búsquedas
- Total GENERAL: 77,100 búsquedas
- Cobertura: 40,500 / 77,100 = 52.5%
```

#### MERCADO ESPECÍFICO:
```
Cobertura Específico % = (Búsquedas ESPECÍFICO en título) 
                         ÷ (Total ESPECÍFICO disponible)

Ejemplo:
- Título contiene: "xiaomi" + "300w" = 8,300 búsquedas
- Total ESPECÍFICO: 19,000 búsquedas
- Cobertura: 8,300 / 19,000 = 43.7%
```

#### COBERTURA TOTAL:
```
Cobertura Total % = (Total búsquedas capturadas) 
                    ÷ (Total búsquedas disponible)

Ejemplo:
- Búsquedas capturadas: 48,800
- Total disponible: 96,100
- Cobertura: 48,800 / 96,100 = 50.8%
```

### FORMATO OBLIGATORIO:

```
## 2️⃣ COBERTURA: INICIAL vs FINAL (OPCIÓN C - CORRECTA)

### TÍTULO INICIAL: "[título actual]"

MERCADO GENERAL:
- Búsquedas capturadas: X
- Total disponible: Y
- Cobertura: X/Y = Z%

MERCADO ESPECÍFICO:
- Búsquedas capturadas: X
- Total disponible: Y
- Cobertura: X/Y = Z%

TOTAL INICIAL:
- Búsquedas capturadas: X
- Cobertura: Z%

---

### TÍTULO FINAL (v2.4): "[título optimizado]"

MERCADO GENERAL:
- Búsquedas capturadas: X
- Total disponible: Y
- Cobertura: X/Y = Z%
- Mejora: +Z%

MERCADO ESPECÍFICO:
- Búsquedas capturadas: X
- Total disponible: Y
- Cobertura: X/Y = Z%
- Mejora: +Z%

TOTAL FINAL:
- Búsquedas capturadas: X
- Cobertura: Z%
- Mejora total: +Z%

---

### TABLA COMPARATIVA

| MÉTRICA | INICIAL | FINAL (v2.4) | MEJORA |
|---|---|---|---|
| General | Z% (X) | Z% (X) | +Z% |
| Específico | Z% (X) | Z% (X) | +Z% |
| Total | Z% (X) | Z% (X) | +Z% |
| Búsquedas | X | X | +X |
```

### ✅ CHECKLIST DE VALIDACIÓN:
- ✅ ¿General inicial está entre 0%-100%?
- ✅ ¿Específico inicial está entre 0%-100%?
- ✅ ¿General final está entre 0%-100%?
- ✅ ¿Específico final está entre 0%-100%?
- ✅ ¿Total inicial está entre 0%-100%?
- ✅ ¿Total final está entre 0%-100%?
- ✅ ¿Ningún porcentaje > 100%?

**Si ALGUNO > 100% = ERROR - RECALCULAR**

---

## PASO 4️⃣ - TÍTULO OPTIMIZADO (OPCIÓN B)

### ESTRUCTURA OPCIÓN B (OBLIGATORIA):
```
[GENERAL] [DIFERENCIADOR] [MODELO] [ESPECIFICACIÓN] [MARCA] [LÍNEA]
```

### EJEMPLO:
```
"Patineta Scooter Eléctrica Xiaomi 300W 25km/h Plegable 2Gen"

Análisis:
├─ GENERAL: "Patineta Scooter Eléctrica"
├─ DIFERENCIADOR: "300W 25km/h"
├─ MODELO: (integrado)
├─ ESPECIFICACIÓN: "Plegable"
├─ MARCA: "Xiaomi"
└─ LÍNEA: "2Gen"
```

### REQUISITOS:
- ✅ Máximo 120 caracteres
- ✅ Incluye palabras clave VALIDADAS
- ✅ Orden: General → Específico → Marca
- ✅ SIN palabras engañosas
- ✅ SIN solapamiento de palabras clave

### FÓRMULA DE CÁLCULO:
```
Título nuevo = 
  [Término general más buscado] + 
  [Característica diferenciadora] + 
  [Especificación técnica clave] + 
  [Otra especificación importante] + 
  [Marca] + 
  [Generación o línea si aplica]
```

---

## PASO 5️⃣ - DESCRIPCIÓN MEJORADA

### PÁRRAFO 1 - PUENTE (4-5 líneas)
Conecta mercado general con específico. Menciona:
- Tipo de producto (general)
- Marca y modelo (específico)
- Casos de uso
- Beneficio principal

**Palabras clave incluidas**: Al menos 5 de la tabla de palabras clave

### PÁRRAFO 2 - ESPECIFICACIONES (5-6 líneas)
Detalles técnicos. Menciona:
- Características técnicas principales
- Capacidades y funciones
- Dimensiones/pesos si aplica
- Durabilidad y garantía

**Palabras clave incluidas**: Al menos 3-4 adicionales

### BULLETS (MÁXIMO 12)
Cada bullet: `✓ [Característica] - [Beneficio]`

Ejemplo:
```
✓ Motor 300W - Potencia suficiente para pendientes y velocidad
✓ 25 km/h Velocidad - Máxima velocidad para transporte urbano
✓ Plegable - Transportable y almacenable fácilmente
✓ 100 kg Capacidad - Soporta usuarios adultos y carga
```

---

## RESUMEN EJECUTIVO (PLANTILLA)

```
| MÉTRICA | INICIAL | FINAL | MEJORA |
|---|---|---|---|
| **Búsquedas capturadas** | X | X | +X (+Y%) |
| **Cobertura inicial** | Z% | Z% | +Z% |
| **Tráfico/mes (1 marketplace)** | X-Y | X-Y | +Z% |
| **Conversión** | Z% | Z% | +Z% |
| **Ingresos/mes (1 marketplace)** | $X-Y | $X-Y | +Z% |
| **Multi-canal (5 marketplaces)** | $X-Y | $X-Y | +Z% |
```

---

## ✅ CHECKLIST ANTES DE ENTREGAR

```
PASO 0️⃣ - VALIDACIÓN:
☐ ¿Todas características son VERACES?
☐ ¿Eliminé palabras falsas/engañosas?
☐ ¿Documenté la validación?

PASO 1️⃣ - MERCADOS:
☐ ¿Identifiqué mercado GENERAL?
☐ ¿Identifiqué mercado ESPECÍFICO?
☐ ¿Calculé la brecha a capturar?

PASO 2️⃣ - TABLA:
☐ ¿Exactamente 10 palabras?
☐ ¿Formato OPCIÓN 3 correcto?
☐ ¿Datos REALES de keyword tool?
☐ ¿Íconos ⭐🎯◆ incluidos?
☐ ¿Ordenado por volumen DESC?

PASO 3️⃣ - COBERTURA:
☐ ¿GENERAL inicial: 0%-100%?
☐ ¿ESPECÍFICO inicial: 0%-100%?
☐ ¿GENERAL final: 0%-100%?
☐ ¿ESPECÍFICO final: 0%-100%?
☐ ¿TOTAL inicial: 0%-100%?
☐ ¿TOTAL final: 0%-100%?
☐ ¿Ningún % > 100%?
☐ ¿Tabla comparativa incluida?

PASO 4️⃣ - TÍTULO:
☐ ¿Formato OPCIÓN B aplicado?
☐ ¿≤ 120 caracteres?
☐ ¿Incluye palabras clave validadas?
☐ ¿Sin solapamiento de palabras?

PASO 5️⃣ - DESCRIPCIÓN:
☐ ¿2 párrafos (puente + especificaciones)?
☐ ¿Máximo 12 bullets?
☐ ¿Palabras clave distribuidas?
☐ ¿Beneficios claros?

RESUMEN EJECUTIVO:
☐ ¿Tabla de métricas incluida?
☐ ¿Status ✅ incluido?
☐ ¿Protocolo v2.4 confirmado?

Si TODOS tienen ☑️ = ENTREGABLE APROBADO
Si ALGUNO tiene ☐ = REVISAR Y CORREGIR
```

---

## 🎯 CASOS DE USO EJEMPLOS

### PRODUCTO 1: Patineta eléctrica
- Mercado general: scooter/patineta eléctrica
- Mercado específico: XIAOMI, 300W, 25km/h
- Título: "Patineta Scooter Eléctrica Xiaomi 300W 25km/h Plegable"

### PRODUCTO 2: Bicicleta eléctrica
- Mercado general: bicicleta eléctrica
- Mercado específico: AUTECO, 750W, PRAIA
- Título: "Bicicleta Eléctrica Praia 750W Auteco STARKER"

### PRODUCTO 3: Multigimnasio
- Mercado general: máquina multifuncional
- Mercado específico: LD6001, 72kg, prensa piernas, predicador
- Título: "Multigimnasio Máquina Multifuncional 72kg Prensa Piernas Predicador LD6001"

### PRODUCTO 4: Elíptica
- Mercado general: bicicleta estática/elíptica
- Mercado específico: XTERRA, electromagnética, 24 niveles
- Título: "Elíptica Electromagnética Xterra Fitness FS380 24 Niveles"

---

## 📋 DATOS QUE NECESITA PROPORCIONAR

Para que Claude aplique la SKILL, proporcione:

```
PRODUCTO: [nombre]
MARCA: [marca]
MODELO: [modelo]
GENERACIÓN: [si aplica]

ESPECIFICACIONES CLAVE:
- [característica 1]: [valor]
- [característica 2]: [valor]
- [característica 3]: [valor]
- [característica 4]: [valor]
- [característica 5]: [valor]

FUENTE/URL: [si tiene]
PAÍS/MERCADO: Colombia (default)
MARKETPLACE: Falabella, Amazon, MercadoLibre, etc.
```

---

## 🚨 REGLAS CRÍTICAS

**NUNCA hacer:**
- ❌ Incluir palabras clave FALSAS
- ❌ Prometer características que NO tiene
- ❌ Calcular cobertura > 100%
- ❌ Omitir PASO 0️⃣
- ❌ Usar formato diferente a OPCIÓN 3 para tabla
- ❌ Títulos > 120 caracteres
- ❌ Descripciones sin palabras clave

**SIEMPRE hacer:**
- ✅ Validar PASO 0️⃣ primero
- ✅ Separar GENERAL y ESPECÍFICO
- ✅ Fórmula de cobertura CORRECTA (0%-100%)
- ✅ Formato OPCIÓN 3 obligatorio
- ✅ Estructura OPCIÓN B para título
- ✅ Documentar mejoras
- ✅ Verificar checklist completo

---

## 📞 SOPORTE Y REFERENCIAS

**Documentos complementarios:**
- PASO-0-VALIDACION-CARACTERISTICAS-OBLIGATORIA.md
- COBERTURA-OPCION-C-FORMULA-CORRECTA.md
- COBERTURA-OPCION-C-NUEVO-FORMATO-OBLIGATORIO.md
- VALIDACION-TABLA-OBLIGATORIA.md
- FORMATO-OPCION3-REFERENCIA.md
- INSTRUCCIONES-OPCION-C-COBERTURA-INICIAL.md

**Versión**: 2.4 (Última: Mayo 2026)
**Estado**: ✅ Testeado en 4+ productos
**Compatibilidad**: Todos los marketplaces de LatAm

---

## 📥 CÓMO USAR ESTE ARCHIVO

1. **Guardar/descargar este archivo** en tu dispositivo
2. **Crear nuevo proyecto en Claude** (Projects > New Project)
3. **Pegar este contenido COMPLETO** en instrucciones del proyecto
4. **Para cada producto**, usar el prompt de ejemplo arriba
5. **Claude seguirá automáticamente TODOS los pasos**

**Resultado**: Entregables SEO optimizados, validados y listos para implementar en e-commerce.

---

**Creado por**: Protocol SEO v2.4
**Última actualización**: Mayo 2026
**Licencia**: Libre para usar en proyectos comerciales
**Status**: ✅ LISTO PARA PRODUCCIÓN
