# ADENDA PROTOCOLO MAESTRO v3.6
## Regla: MÓDULO 7 como estructura HTML por defecto

**Para pegar dentro de las instrucciones personalizadas del proyecto "HTML INPAGUE FALABELLA", a continuación de la ADENDA v3.5 (PASO 5C).**

---

## PASO 5D — ESTRUCTURA MÓDULO 7 (default, obligatorio salvo indicación contraria del cliente)

### Regla de oro

Todo HTML inPage nuevo se construye en **Módulo 7** por defecto: título + 3 parejas de imágenes
flotadas (6 imágenes totales) + secciones de texto. **Sin imagen de portada/cover** (ninguna
imagen aislada antes de la primera pareja). Solo se usa una estructura distinta si el cliente
lo pide explícitamente.

### Orden obligatorio de bloques

```
1. Título principal (centrado, 24px)
2. Video de YouTube (SOLO si hay URL real) — va de primero, antes de las imágenes,
   SIN encabezado ni texto introductorio
3. Parejas de imágenes (3 parejas = 6 imágenes, sin portada)
4. Especificaciones / Qué incluye este [producto]
   → Si es un set/juego con lista de piezas: agregar la foto de contenido
     (infografía oficial con las piezas listadas), si existe entre las fotos
     fuente y es distinta de las 6 ya usadas arriba — SIEMPRE antes de la lista
     de piezas en texto
5. Guía de materiales y salud (cuando aplique un ángulo de material/salud)
6. Preguntas frecuentes (FAQ)
```

### Formato exacto de cada bloque (validado en producción)

**Título principal:**
```html
<p style="text-align: center;color: #000000;font-size: 24px;font-family: Inter, sans-serif;"><strong>[Título con keywords]</strong></p>
```

**Video (si hay URL real, va inmediatamente después del título, sin encabezado):**
```html
<p style="text-align: center;color: initial;font-size: 16px;font-family: Inter, sans-serif;">
<iframe width="550" height="309" src="https://www.youtube.com/embed/[VIDEO_ID]" frameborder="0" allowfullscreen></iframe>
</p>
```
Regla se mantiene: NUNCA incluir iframe sin URL real entregada/confirmada por el usuario.
Preguntar explícitamente o revisar el archivo de referencia de videos del cliente si existe.

**Pareja de imágenes (izquierda + derecha, repetir 3 veces = 6 imágenes):**
```html
<p style="float: left;width: 265px;margin-right: 20px;text-align: center;color: initial;font-size: 16px;font-family: Inter, sans-serif;">
<img src="https://lh3.googleusercontent.com/d/[ID]" alt="[descripcion exacta y verificada]" width="260" style="border: 0px;margin-bottom: 10px;" />
<br />
<strong style="font-size: 20px;color: #000000;display: block;margin-bottom: 6px;">[Subtítulo del beneficio]</strong>
[Texto descriptivo 1-2 frases]
</p>
<p style="float: left;width: 265px;text-align: center;color: initial;font-size: 16px;font-family: Inter, sans-serif;">
<img src="https://lh3.googleusercontent.com/d/[ID]" alt="[descripcion exacta y verificada]" width="260" style="border: 0px;margin-bottom: 10px;" />
<br />
<strong style="font-size: 20px;color: #000000;display: block;margin-bottom: 6px;">[Subtítulo del beneficio]</strong>
[Texto descriptivo 1-2 frases]
</p>
<br style="clear: both;" />
```
Cada pareja cierra con `<br style="clear: both;" />` antes de iniciar la siguiente.

**Subtítulo de sección de texto (Especificaciones, Qué incluye, Guía de materiales, FAQ):**
```html
<p style="text-align: start;color: #000000;font-size: 20px;font-family: Inter, sans-serif;"><strong>[Título de sección]</strong></p>
```

**Párrafo o pregunta/respuesta dentro de una sección de texto:**
```html
<p style="text-align: start;color: initial;font-size: 16px;font-family: Inter, sans-serif;"><strong>¿Pregunta?</strong> Respuesta directa y verificada.</p>
```

**Lista de especificaciones o piezas incluidas:**
```html
<ul style="text-align: start;color: initial;font-size: 16px;font-family: Inter, sans-serif;">
<li><strong>Campo:</strong> valor</li>
</ul>
```

**Foto de contenido en "Qué incluye" (solo si el producto es un set/juego y existe una
infografía oficial de piezas entre las fotos fuente, distinta de las 6 usadas en las parejas):**
```html
<p style="text-align: start;color: #000000;font-size: 20px;font-family: Inter, sans-serif;"><strong>Qué incluye este [producto]</strong></p>
<p style="text-align: center;color: initial;font-size: 16px;font-family: Inter, sans-serif;">
<img src="https://lh3.googleusercontent.com/d/[ID]" alt="Contenido del set: [lista breve de piezas]" width="450" style="border: 0px;margin-bottom: 10px;" />
</p>
<p style="text-align: start;color: initial;font-size: 16px;font-family: Inter, sans-serif;">[texto intro antes de la lista]</p>
<ul>...</ul>
```
Regla: esta imagen NUNCA repite un ID de Drive ya usado en las 3 parejas de arriba (sin
imágenes duplicadas dentro del mismo HTML). Si no existe una foto de contenido distinta
disponible, se omite (no se inventa ni se reutiliza una imagen ya usada).

### Reglas heredadas que siguen aplicando sin cambios

- Tags permitidos/prohibidos, sin emojis, sin div/style/h1-h6/class/id (PASO 5 original).
- Formato de imagen `https://lh3.googleusercontent.com/d/[ID]` — nunca `drive.google.com/uc?id=`.
- Cada imagen debe coincidir factualmente con su caption (verificar contra metadata de Drive
  e inspección visual directa antes de entregar).
- Regla aditiva de la ADENDA v3.5: al enriquecer un HTML ya aprobado, nunca se quita contenido
  previo, solo se agrega en el lugar temático correcto.
- Video: si el cliente tiene un archivo maestro de videos de YouTube (ej. "VIDEOS YOUTUBE
  MEYER.xlsx"), revisarlo por SKU antes de preguntar al cliente si tiene URL de video.

### Checklist antes de entregar un HTML Módulo 7

```
¿El HTML tiene título + 3 parejas de imágenes (6 total), sin portada?      SI / NO
¿Si hay video real, está de primero, antes de las imágenes, sin título?    SI / NO
¿Si es un set/juego, tiene foto de contenido en "Qué incluye"?             SI / NO
¿Esa foto de contenido es distinta a las 6 de las parejas (sin duplicar)?  SI / NO
¿Cada imagen coincide factualmente con su caption?                        SI / NO
¿Pasó la validación de PASO 6 (emojis, tags, IDs Drive)?                  SI / NO

Todos SI → HTML Módulo 7 aprobado.
Algún NO → corregir antes de entregar.
```

---

**Origen de esta adenda:** iteración de los SKU Farberware/KitchenAid (70624, 75653, 48531,
48552, 48396, 70085) — Falabella Colombia, donde se estandarizó Módulo 7 como estructura
default, se definió la posición del video (primero, sin título) y se agregó la regla de la
foto de contenido en "Qué incluye" para sets/juegos.

**Creado por:** MEDHIA CatalogAI
**Versión:** 3.6 (Septiembre 2026)
**Se agrega a:** PROTOCOLO_MAESTRO_v3.4 + ADENDA_v3.5
**Compatibilidad:** Falabella Colombia, Chile, Perú
**Status:** LISTO PARA PRODUCCION
