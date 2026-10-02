# PROTOCOLO MAESTRO v3.4
## HTML INPAGE FALABELLA + SEO + KEYWORD SURFER

**VERSION:** 3.4
**FECHA:** Mayo 2026
**DESARROLLADO POR:** MEDHIA CatalogAI
**PARA:** Falabella.com Colombia, Chile, Peru
**STATUS:** ESTABLE — OPERATIVO — VERIFICADO EN PRODUCCION

---

## CAMBIOS v3.4 vs v3.3

| # | Cambio | Razon |
|---|--------|-------|
| 1 | SEO analysis SIEMPRE antes del HTML | El HTML debe construirse con keywords reales, no al reves |
| 2 | Datos Keyword Surfer OBLIGATORIOS | Nunca estimar ni inventar volumenes de busqueda |
| 3 | Si no hay datos KS, DETENER y pedir | Continuar sin datos reales invalida todo el trabajo SEO |
| 4 | Flujo de 9 pasos reordenado | P2B/P3/P4/P5B antes de P5 (HTML) |

---

## REGLA CRITICA v3.4 — DATOS KEYWORD SURFER

### NUNCA ESTIMAR. NUNCA INVENTAR.

Los volumenes de busqueda son la base de toda la optimizacion SEO.
Un volumen inventado produce un titulo incorrecto, un HTML mal optimizado
y proyecciones economicas falsas que enganan al cliente.

### REGLA DE ORO:

```
SI hay acceso a Claude en Chrome con Keyword Surfer activo:
    → Buscar cada keyword directamente en Google (gl=co&hl=es)
    → Capturar volumen EXACTO de la barra de busqueda
    → Capturar overlap del panel de sugerencias
    → Documentar como: [REAL - Keyword Surfer vX.X]

SI NO hay acceso a Chrome / Keyword Surfer:
    → DETENERSE
    → Decirle al usuario: "Necesito los datos de Keyword Surfer
      para continuar. Por favor abre Chrome con Keyword Surfer
      activo o proporcioname los volumenes manualmente."
    → NUNCA continuar con estimaciones propias
    → NUNCA usar frases como "estimado" o "aprox." para volumenes

PROHIBIDO EN CUALQUIER CASO:
    → Inventar volumenes ("patineta electrica: ~33,000")
    → Usar rangos vagos ("10,000-50,000 busquedas")
    → Copiar volumenes de proyectos anteriores
    → Asumir que un keyword tiene alto volumen sin verificar
```

### POR QUE ES TAN IMPORTANTE:

El proyecto Xiaomi ES6 Lite demostro el problema:
- "scooter electrico" estimado: 18,100/mes → REAL: 2,900/mes (error de 524%)
- "patineta xiaomi" estimado: 9,900/mes → REAL: 3,600/mes (error de 175%)
- "xiaomi scooter" estimado: 8,100/mes → REAL: 1,300/mes (error de 523%)
- "scooter electrica" (femenino): NO estaba en estimacion → REAL: 9,900/mes

Resultado de usar estimaciones: titulo y HTML optimizados para un mercado
que no existe en las dimensiones asumidas.

---

## FLUJO COMPLETO v3.4 — 9 PASOS OBLIGATORIOS

```
PASO 1  → Recibir producto + imagenes
           ↓
PASO 2  → Optimizar imagenes + entregar ZIP
           ↓
PASO 2B → Keyword Surfer EN VIVO (DATOS REALES)
           ↓  ← SI NO HAY DATOS: DETENERSE Y PEDIR
PASO 3  → Tabla Maestra de Keywords (OPCION 3)
           ↓
PASO 4  → Titulo Optimizado (OPCION B)
           ↓
PASO 5B → Analisis de Cobertura SEO (OPCION C)
           ↓
           ← SOLO AQUI SE PUEDE GENERAR EL HTML →
PASO 5  → HTML inPage con SEO integrado
           ↓
PASO 6  → Validar HTML (sin emojis, sin tags prohibidos)
           ↓
PASO 7  → Recibir URLs Google Drive → integrar IDs
           ↓
PASO 8  → Tabla Resumen Ejecutiva
           ↓
PASO 9  → Reporte Final v3.4
```

---

## PASO 1 — RECIBIR INFORMACION DEL PRODUCTO

### El usuario debe entregar:
- Nombre completo del producto
- Ficha tecnica con todas las especificaciones
- Imagenes del producto (minimo 5, maximo 10)
- Precio de venta (para proyecciones economicas)
- Mercado objetivo (Colombia / Chile / Peru)

### Claude debe:
- Confirmar recepcion de todos los materiales
- Identificar especificaciones verificables
- Detectar si falta informacion critica y pedirla antes de continuar

---

## PASO 2 — OPTIMIZAR IMAGENES Y ENTREGAR ZIP

### Proceso obligatorio:
- Convertir todas las imagenes a JPG 300 DPI, maximo 550px de ancho
- Comando ImageMagick validado:
  `convert "$img" -resize '550x550>' -density 300 -units PixelsPerInch -quality 85 "output.jpg"`
- Empaquetar con `zip -j` para estructura plana
- Entregar SIEMPRE con `present_files` tool — el usuario necesita descargarlo

### Regla de entrega:
El ZIP debe entregarse antes de continuar. El usuario lo sube a Google Drive
y en el PASO 7 entrega las URLs. Sin ZIP descargable no hay imagenes en el HTML.

---

## PASO 2B — KEYWORD SURFER EN VIVO (DATOS REALES)

### Prerequisito OBLIGATORIO:
Claude en Chrome debe estar activo con la extension Keyword Surfer instalada.

### Si NO esta disponible:
```
ACCION: Detenerse completamente.
MENSAJE AL USUARIO:
"Para continuar con el analisis SEO necesito datos reales de
Keyword Surfer. Por favor:
  Opcion A: Abre Chrome con Keyword Surfer y dime que esta listo
  Opcion B: Busca cada keyword en Google y pasame los volumenes
             que aparecen en la barra de busqueda
No puedo continuar con estimaciones — los volumenes falsos
producen un HTML y un titulo incorrectos."
```

### Procedimiento cuando Chrome esta disponible:

1. Navegar a: `https://www.google.com/search?q=[KEYWORD]&gl=co&hl=es`
2. Capturar el volumen de la BARRA DE BUSQUEDA (numero junto al icono de Surfer)
3. Capturar los keywords sugeridos del panel derecho con su overlap y volumen
4. Repetir para TODOS los keywords del listado base

### Keywords a buscar — orden obligatorio:

```
GENERALES (buscar siempre):
  1. [tipo de producto] + electrica/electrico
  2. variante femenina: [tipo] electrica
  3. variante masculina: [tipo] electrico
  4. sinonimos del producto (monopatin, scooter, patineta...)
  5. [producto] + adulto / precio / colombia

ESPECIFICOS (buscar siempre):
  6. [marca] + [tipo de producto]
  7. [tipo de producto] + [marca]
  8. [tipo de producto] + [potencia/especificacion clave]
  9. [tipo de producto] + [autonomia/capacidad clave]
  10. [modelo exacto completo]
```

### Documentacion obligatoria por keyword:
```
Keyword: [termino buscado]
Volumen: [numero exacto de la barra]       FUENTE: Keyword Surfer vX.X
Overlap: [% del panel de sugerencias]
Intencion: [compra generica / compra + marca / etc.]
Mercado: [GENERAL / ESPECIFICO]
```

### Regla de variantes de genero en espanol:
En Colombia los usuarios buscan tanto "electrica" (femenino) como "electrico"
(masculino). Ambas variantes deben buscarse por separado — sus volumenes
pueden diferir significativamente (ejemplo: "scooter electrica" = 9,900 vs
"scooter electrico" = 2,900).

---

## PASO 3 — TABLA MAESTRA DE KEYWORDS (OPCION 3 — OBLIGATORIO)

### Formato exacto (sin excepciones):

```
PALABRA CLAVE                      | BUSQUEDAS | INTENCION                  | OVERLAP | MERCADO
────────────────────────────────────────────────────────────────────────────────────────────────
[keyword 1]                        | [numero]  | [tipo de intencion]        |   [%]   | ⭐ GENERAL
[keyword 2]                        | [numero]  | [tipo de intencion]        |   [%]   | ⭐ GENERAL
[keyword 3]                        | [numero]  | [tipo de intencion]        |   [%]   | 🎯 ESPECIFICO
[keyword 10]                       | [numero]  | [tipo de intencion]        |   [%]   | ◆ GENERAL-ESPECIFICO
```

### Reglas de la tabla:
- Exactamente 10 keywords (maximo)
- Ordenado por volumen descendente
- Iconos: GENERAL = estrella, ESPECIFICO = diana, HIBRIDO = rombo
- Fuente indicada en cada fila o en nota al pie
- EN BLOQUE CODE siempre
- Todos los volumenes con fuente [REAL - Keyword Surfer] o [PENDIENTE]

### Si algun volumen esta pendiente:
Marcar la celda como [PENDIENTE - solicitar a usuario] y NO inventar el dato.

---

## PASO 4 — TITULO OPTIMIZADO (OPCION B)

### Estructura obligatoria:
```
[TERMINO GENERAL] [DIFERENCIADOR TECNICO] [MARCA] [MODELO] [ESPECIFICACION]
```

### Ejemplo correcto:
```
"Patineta Scooter Electrica Xiaomi 6 Lite 500W 25km Plegable"
 ↑ GENERAL         ↑ TECNICO    ↑ MARCA ↑ MODELO ↑ ESPECIF
```

### Reglas:
- Maximo 120 caracteres
- El termino de mayor volumen va PRIMERO
- Incluir la variante de genero correcta (segun datos reales)
- Sin palabras que no correspondan a caracteristicas verificadas
- Sin solapamiento excesivo entre keywords

### Verificacion obligatoria post-titulo:
Calcular cuantos keywords de la Tabla Maestra activa el titulo.
Minimo 6/10 para considerar el titulo valido.

---

## PASO 5B — ANALISIS DE COBERTURA SEO (OPCION C)

### Formula correcta (unica valida):
```
Cobertura % = Busquedas capturadas / Total busquedas disponibles x 100

RANGO VALIDO: 0% a 100% — NUNCA puede superar 100%
```

### Calcular para titulo INICIAL y titulo FINAL:

```
MERCADO GENERAL:
  Busquedas capturadas (titulo X): [suma de keywords generales que activa]
  Total disponible GENERAL       : [suma de todos los keywords generales]
  Cobertura GENERAL              : capturadas / total = X%

MERCADO ESPECIFICO:
  Busquedas capturadas (titulo X): [suma keywords especificos que activa]
  Total disponible ESPECIFICO    : [suma de todos los keywords especificos]
  Cobertura ESPECIFICO           : capturadas / total = X%

TOTAL:
  Busquedas capturadas total     : general + especifico capturados
  Total disponible               : general + especifico totales
  Cobertura TOTAL                : capturadas / total = X%
```

### Tabla comparativa obligatoria:

```
METRICA                  | INICIAL | FINAL | MEJORA
-------------------------|---------|-------|--------
Cobertura GENERAL        | X%      | X%    | +X%
Cobertura ESPECIFICO     | X%      | X%    | +X%
Cobertura TOTAL          | X%      | X%    | +X%
Busquedas ganadas/mes    | X       | X     | +X
```

### Checklist antes de continuar al HTML:
```
¿Todos los porcentajes estan entre 0% y 100%?   SI / NO
¿La tabla comparativa esta completa?             SI / NO
¿El titulo captura minimo 6/10 keywords?         SI / NO
¿Todos los datos son de Keyword Surfer real?     SI / NO

Si TODOS son SI → continuar al PASO 5 (HTML)
Si ALGUNO es NO → corregir antes de continuar
```

---

## PASO 5 — GENERAR HTML INPAGE CON SEO INTEGRADO

### Este paso SOLO se ejecuta despues de completar P2B + P3 + P4 + P5B.

### Estructura del HTML:
- Titulo principal: keyword #1 + keyword #2 del mercado general
- Parrafo intro: incluir TOP 5 keywords por volumen en las primeras 3 lineas
- Encabezados de seccion: incluir keywords cuando sea natural
- Bullets: mencionar especificaciones tecnicas con terminos buscados
- Seccion de specs: incluir nombre completo del producto (keyword exacto modelo)

### Integracion de keywords por densidad recomendada:

```
Keyword #1 (mayor volumen) : 10-15 menciones distribuidas en todo el HTML
Keyword #2                 :  6-10 menciones
Keyword #3                 :  3-6 menciones
Keywords #4 al #8          :  1-3 menciones cada uno
Keywords #9 y #10          :  1 mencion minima
```

### Reglas HTML Falabella (inamovibles):

PERMITIDO:
- p, ul, li, img, iframe, em, strong, br, a
- Estilos inline: style=""
- Parrafo estandar: `style="text-align: start;color: initial;font-size: 14px;font-family: Inter, sans-serif;"`
- Titulo principal: `style="text-align: center;color: #000000;font-size: 22px;font-family: Inter, sans-serif;"`
- Subtitulo seccion: `style="text-align: start;color: #000000;font-size: 18px;font-family: Inter, sans-serif;"`
- Imagen: `style="border: 0px;" width="550"`

PROHIBIDO:
- div, style tags, CSS externo
- class=, id=
- h1, h2, h3, h4, h5, h6
- JavaScript
- Emojis en cualquier parte del HTML

### Imagenes en el HTML:
Las imagenes se integran en PASO 7 cuando el usuario entrega URLs de Google Drive.
En PASO 5 el HTML puede incluir placeholders o las URLs si ya estan disponibles.
Formato obligatorio de URL: `https://lh3.googleusercontent.com/d/[ID_GOOGLE_DRIVE]`
NUNCA usar: `drive.google.com/uc?id=` (no funciona en Falabella)

### Videos YouTube:
Preguntar explicitamente: "Tienes URL de video YouTube del producto?"
NUNCA incluir iframe sin URL real entregada por el usuario.
NUNCA usar placeholders de video.

---

## PASO 6 — VALIDAR HTML

### Comando de validacion (ejecutar siempre):
Ver `scripts/validar_html.py` en este repositorio.

```python
import re

with open('archivo.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Anti-emoji
emojis = re.findall(r'[\U0001F300-\U0001F9FF\U0001F000-\U0001F2FF]', content)
print("Emojis:", "NINGUNO" if not emojis else emojis)

# Tags prohibidos
for tag in ['<div', '<style', '<h1', '<h2', '<h3', 'class=', ' id=']:
    print(f"{tag}: {'OK' if tag not in content else 'ALERTA'}")

# Keywords SEO
c = content.lower()
for kw, vol in keywords.items():
    n = c.count(kw)
    print(f"[{'OK' if n>0 else 'FALTA'}] [{n}x] {kw}")

# Imagenes
print(f"Imagenes: {len(re.findall('<img', content))}")
```

### Checklist de validacion:
```
SIN EMOJIS en todo el HTML                          SI / NO
SIN tags prohibidos (div, style, h1-h6, class, id)  SI / NO
TODOS los keywords del TOP 8 presentes              SI / NO
TODAS las imagenes con URL lh3.googleusercontent    SI / NO
SIN IDs de Drive anteriores (de otros proyectos)    SI / NO
SIN placeholders de video sin URL real              SI / NO

Todos SI = HTML APROBADO PARA PRODUCCION
Alguno NO = CORREGIR Y REVALIDAR
```

---

## PASO 7 — INTEGRAR URLs GOOGLE DRIVE

### El usuario entrega:
- Screenshot del folder Drive con nombres de archivos en orden
- Links de Drive en el mismo orden que los archivos del screenshot

### Proceso de extraccion de IDs:
```
URL Drive: https://drive.google.com/file/d/[ID]/view?usp=sharing
              ↓ extraer solo el ID ↓
URL embed:  https://lh3.googleusercontent.com/d/[ID]
```

### Mapeo obligatorio (documentar antes de reemplazar):
```
ARCHIVO                 | ID DRIVE          | SECCION EN HTML
------------------------|-------------------|------------------
[nombre1.jpg]          | [ID extraido]     | [seccion HTML]
[nombre2.jpg]          | [ID extraido]     | [seccion HTML]
```

### Validacion post-reemplazo:
- Confirmar que NINGUN ID de proyecto anterior quedo en el HTML
- Confirmar que todos los IDs son unicos (sin imagenes duplicadas)
- Contar total de imagenes = total de archivos subidos a Drive

---

## PASO 8 — TABLA RESUMEN EJECUTIVA

### Estructura obligatoria (4 niveles):

**NIVEL 1 — MERCADO GENERAL:**
```
Cobertura inicial / final / mejora
Busquedas capturadas inicial / final / incremento
Keywords implementados inicial / final
Ranking esperado inicial / final
Trafico estimado inicial / final
```

**NIVEL 2 — MERCADO ESPECIFICO:**
```
Mismas metricas que Nivel 1
```

**NIVEL 3 — COBERTURA TOTAL PONDERADA:**
```
Cobertura total / busquedas totales / CTR esperado
Trafico total / clics promedio/mes / clics anuales
```

**NIVEL 4 — PROYECCIONES ECONOMICAS:**
```
Conversiones/mes (2-3% tasa)
Ingresos/mes (precio x conversiones)
Ingresos/ano
ROI de la optimizacion
```

### Regla de proyecciones:
Las proyecciones economicas usan el precio real del producto.
Si el precio no fue entregado, pedirlo antes de generar la tabla.
NUNCA inventar un precio de referencia.

---

## PASO 9 — REPORTE FINAL v3.4

### Entregables obligatorios del proyecto:

```
1. HTML inPage optimizado (SIN EMOJIS)
   Archivo: [PRODUCTO]_INPAGE_v3.4.html

2. Tabla maestra de keywords (datos REALES Keyword Surfer)
   Archivo: [PRODUCTO]_KEYWORDS_TABLA_MAESTRA.txt

3. Analisis de cobertura SKILL v2.4
   Archivo: [PRODUCTO]_COBERTURA_SEO_SKILL_v2.4.txt

4. Tabla Resumen Ejecutiva
   Archivo: [PRODUCTO]_TABLA_RESUMEN_EJECUTIVA.txt

5. Reporte Final v3.4
   Archivo: [PRODUCTO]_REPORTE_FINAL_v3.4.txt

6. Imagenes optimizadas ZIP
   Archivo: [PRODUCTO]_Imagenes_Optimizadas.zip
```

### Checklist final del proyecto:
```
PASO 1  Informacion del producto recibida            SI / NO
PASO 2  ZIP de imagenes entregado con present_files  SI / NO
PASO 2B Datos Keyword Surfer REALES capturados       SI / NO
PASO 3  Tabla Maestra OPCION 3 completada            SI / NO
PASO 4  Titulo OPCION B definido (<= 120 chars)      SI / NO
PASO 5B Cobertura OPCION C calculada (0%-100%)       SI / NO
PASO 5  HTML generado con SEO integrado              SI / NO
PASO 6  HTML validado (sin emojis, sin tags)         SI / NO
PASO 7  URLs Drive integradas en HTML                SI / NO
PASO 8  Tabla Resumen Ejecutiva entregada            SI / NO
PASO 9  Reporte Final entregado                      SI / NO

ENTREGABLES:
HTML inPage                                          SI / NO
Tabla Maestra Keywords                               SI / NO
Analisis Cobertura SEO                               SI / NO
Tabla Resumen Ejecutiva                              SI / NO
Reporte Final                                        SI / NO
ZIP Imagenes                                         SI / NO

Todos SI = PROYECTO v3.4 COMPLETO Y APROBADO
Alguno NO = REVISAR Y COMPLETAR
```

---

## REGLAS GENERALES — SIN EXCEPCIONES

### NUNCA:
- Generar HTML antes de completar el analisis SEO (P2B + P3 + P4 + P5B)
- Estimar o inventar volumenes de busqueda
- Usar emojis en ninguna parte del HTML ni en reportes
- Usar tags prohibidos en HTML (div, style, h1-h6, class, id)
- Incluir iframes de video sin URL real entregada por el usuario
- Reutilizar IDs de Google Drive de proyectos anteriores
- Calcular coberturas mayores al 100%
- Incluir caracteristicas falsas o no verificadas del producto

### SIEMPRE:
- Obtener datos Keyword Surfer REALES antes de cualquier keyword decision
- Detenerse y pedir datos si Keyword Surfer no esta disponible
- Validar el HTML con script Python antes de entregarlo
- Entregar el ZIP de imagenes con present_files tool
- Preguntar por URL de video YouTube antes de incluir iframe
- Documentar la fuente de cada volumen de busqueda
- Usar formato lh3.googleusercontent.com/d/[ID] para imagenes

---

## FORMATO HTML — REFERENCIA RAPIDA

### Titulo principal:
```html
<p style="text-align: center;color: #000000;font-size: 22px;font-family: Inter, sans-serif;">
<strong>Titulo con Keywords Principales del Producto</strong>
</p>
```

### Subtitulo de seccion:
```html
<p style="text-align: start;color: #000000;font-size: 18px;font-family: Inter, sans-serif;">
<strong>Subtitulo de Seccion con Keyword</strong>
</p>
```

### Parrafo de descripcion:
```html
<p style="text-align: start;color: initial;font-size: 14px;font-family: Inter, sans-serif;">
Texto descriptivo con <strong>keywords en negrita</strong> donde corresponda.
</p>
```

### Lista de caracteristicas:
```html
<ul style="text-align: start;color: initial;font-size: 14px;font-family: Inter, sans-serif;">
<li><strong>Caracteristica:</strong> descripcion del beneficio</li>
</ul>
```

### Imagen:
```html
<img src="https://lh3.googleusercontent.com/d/[ID]" width="550" style="border: 0px;" />
```

### Video YouTube (solo con URL real):
```html
<iframe width="550" height="309" src="https://www.youtube.com/embed/[VIDEO_ID]"
frameborder="0" allowfullscreen></iframe>
```

---

## TITULO OPTIMIZADO — REFERENCIA RAPIDA

### Estructura OPCION B:
```
[TERMINO GENERAL MAS BUSCADO] + [ESPECIFICACION TECNICA] + [MARCA] + [MODELO] + [DIFERENCIADOR]
```

### Ejemplo aplicado (Xiaomi ES6 Lite):
```
Titulo original : "Xiaomi Electric Scooter 6 Lite"         → Cobertura: 3.7%
Titulo OPCION B : "Patineta Scooter Electrica Xiaomi 6 Lite 500W 25km Plegable"
                                                            → Cobertura: 72.2%
```

La diferencia entre ambos titulos es de +68.5 puntos de cobertura.
El titulo en ingles era invisible para el 96% del mercado colombiano.

---

**Creado por:** MEDHIA CatalogAI
**Version:** 3.4 (Mayo 2026)
**Reemplaza:** PROTOCOLO_MAESTRO_v3.3
**Compatibilidad:** Falabella Colombia, Chile, Peru
**Status:** LISTO PARA PRODUCCION
