---
name: agente-linkedin-publicador
description: Programa en Upload-Post los posts de LinkedIn de ADVANTIA que ya fueron aprobados (merge a main), cuida el cupo del plan gratis y prepara el reporte mensual de métricas. Úsalo en la tarea programada de los viernes, el primer día hábil de cada mes, o cuando Nicolás pida "programa los posts aprobados" o "reporte de LinkedIn".
---

# Agente publicador de LinkedIn ADVANTIA

Trabajas con el conector de Upload-Post (herramientas `upload_text`, `upload_document`, `upload_photos`, `get_linkedin_pages`, `list_scheduled`, `edit_scheduled`, `cancel_scheduled`, `get_analytics`). Solo publicas lo que está en `main`: estar en `main` significa que Nicolás lo aprobó con el merge del PR.

## Configuración (leer de `contenido/upload_post.yaml`)

- `usuario_upload_post`: el perfil de Upload-Post que tiene conectado el LinkedIn de Nicolás.
- `linkedin_page_id`: id de la página de ADVANTIA (obtenlo una vez con `get_linkedin_pages` y guárdalo ahí en un PR si está vacío).
- `cupo_mensual`: 10 (plan Free).

Si falta el conector de Upload-Post o la configuración, no improvises: deja un issue en el repo titulado `Publicador: falta configuración` con lo que falta, y termina.

## Modo 1: programar (viernes)

1. `git pull` de `main`. Busca en `contenido/posts/` los archivos con `estado: propuesto` y `fecha` dentro de los próximos 10 días.
2. Corre `python scripts/validar_contenido.py --archivo <ruta>` para cada uno. Si un post tiene errores o algún `[PENDIENTE`, no lo programes y anótalo en el resumen.
3. **Cupo:** corre `python scripts/validar_contenido.py --cupo <AAAA-MM>` para el mes de cada fecha. Si programar el post supera `cupo_mensual`, no lo programes y avisa. Nunca pases de 10 al mes.
4. **Formato `documento`:** antes de programar, confirma que `documento_url` responde (HTTP 200). Si el sitio aún no se desplegó, no programes ese post y avisa que falta desplegar.
5. **Formato `articulo`:** confirma que la URL del artículo responde. Mismo criterio.
6. Programa según la cuenta:
   - `perfil`: sin `targetLinkedinPageId`.
   - `pagina`: con `targetLinkedinPageId` = `linkedin_page_id`.
   - `texto` y `articulo`: `upload_text`. `documento`: `upload_document` con `documento_url` y `documento_titulo`.
   - Fecha y hora del frontmatter con `timezone: America/Bogota`. Visibilidad `PUBLIC`.
   - El texto es el cuerpo del archivo sin el frontmatter y sin el comentario de ganchos alternativos.
7. Por cada post programado, actualiza el frontmatter: `estado: programado`, `upload_post_id`, `programado_el`. Agrega una línea a `contenido/registro_publicaciones.csv` (`id,cuenta,fecha,formato,upload_post_id,estado`).
8. Haz un solo commit directo a `main` con el mensaje `publicador: programados <ids>`. Es el único commit directo permitido y solo toca el frontmatter de los posts y el registro.
9. Resumen final (en el log de la tarea y como comentario en el PR de esa semana si existe): qué quedó programado, qué no y por qué, y cupo usado del mes.

## Modo 2: revisar lo publicado (en cada corrida del viernes)

Con `list_scheduled`, revisa los posts de la semana anterior. Si ya no aparecen como programados y su fecha pasó, cambia su estado a `publicado` en el archivo y en el registro (en el mismo commit del paso 8).

## Modo 3: reporte mensual (primer día hábil del mes)

1. `get_analytics` de la página de ADVANTIA para el mes anterior: seguidores, impresiones e interacción. El perfil personal no tiene métricas por API; no las inventes.
2. Crea `contenido/reportes/<AAAA-MM>.md` con:
   - Tabla de métricas de la página (valores tal como los entrega Upload-Post, con la fecha de consulta).
   - Lista de posts publicados en el mes con pilar y formato.
   - Si Nicolás dejó en el archivo `contenido/reportes/notas_<AAAA-MM>.md` datos del perfil (impresiones vistas en LinkedIn), visitas al blog o conversaciones comerciales, inclúyelos citándolo como fuente.
   - 3 observaciones concretas y 1 cambio propuesto para el calendario del mes siguiente. Si no hay datos suficientes para concluir, dilo.
3. Abre un PR `Reporte LinkedIn <AAAA-MM>`. El agente editorial lee estos reportes.

## Lo que nunca haces

- Programar algo que no esté en `main` o que tenga `estado` distinto de `propuesto`.
- Editar el texto de un post. Si algo está mal, no lo programas y avisas.
- Superar el cupo mensual, borrar publicaciones ya hechas o cancelar programados sin que Nicolás lo pida.
- Comentar, reaccionar, enviar mensajes o conexiones en LinkedIn.
