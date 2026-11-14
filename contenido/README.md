# Sistema de contenido ADVANTIA: LinkedIn + blog

Dos agentes en modo copiloto que mantienen activa la presencia de ADVANTIA:

| Agente | Qué hace | Cuándo |
|---|---|---|
| `agente-contenido-editorial` | Redacta 2 posts por semana (perfil de Nicolás y página ADVANTIA) y 2 artículos al mes para theadvantia.com. Lo entrega en un pull request. | Lunes |
| `agente-linkedin-publicador` | Programa en Upload-Post lo aprobado (merge), cuida el cupo de 10 al mes y hace el reporte mensual. | Viernes y día 2 de cada mes |

Flujo semanal: **lunes** el agente abre el PR de la semana objetivo (la primera del calendario que aún no tiene contenido; puede quedar una semana adelantada) → **martes a jueves** Nicolás revisa, ajusta y hace merge → se despliega el sitio si hay artículo → **viernes** se programan los posts → **martes y jueves** salen en LinkedIn.

## Contenido del paquete

```
.claude/skills/agente-contenido-editorial/SKILL.md
.claude/skills/agente-linkedin-publicador/SKILL.md
.github/workflows/validar-contenido.yml     # valida cada PR de contenido
contenido/estrategia.md                     # voces, pilares, ritmo, reglas
contenido/calendario.yaml                   # 10 semanas: 23-nov-2026 a 29-ene-2027
contenido/clientes.yaml                     # quién se puede nombrar
contenido/datos_verificados.md              # únicas cifras permitidas
contenido/upload_post.yaml                  # configuración del publicador
contenido/registro_publicaciones.csv
contenido/plantillas/post.md
contenido/posts/2026-W47-1.md               # primer post, de muestra de la voz
prompts/tareas_programadas.md               # las 3 tareas programadas
scripts/validar_contenido.py
```

## Activación (cuenta de ADVANTIA, unos 30 minutos)

1. **Subir al repo.** Copia todo el paquete en la raíz de `rankerize/theadvantia` y haz merge a `main`. Si `scripts/` o `.github/` ya existen, solo se agregan archivos; no reemplaza nada.
2. **Upload-Post.** Crea la cuenta gratis en upload-post.com, crea un perfil y conecta tu LinkedIn (debes ser administrador de la página de ADVANTIA). Escribe el nombre del perfil en `contenido/upload_post.yaml`.
3. **Conector en Claude.** En la cuenta de Claude de ADVANTIA: Personalizar > Conectores > busca Upload-Post > Conectar. Si no aparece en el directorio, agrégalo como conector personalizado con la URL `https://mcp.upload-post.com/mcp`.
4. **Primer prueba manual.** En Claude Code (cuenta ADVANTIA) sobre el repo, pide: "usa agente-linkedin-publicador para obtener el id de la página de ADVANTIA y guárdalo en upload_post.yaml en un PR". Eso confirma que el conector funciona.
5. **Tareas programadas.** Crea las 3 tareas de `prompts/tareas_programadas.md`.
6. **Primer ciclo.** La 2026-W47 (semana del 16 de noviembre) se armó a mano y se programa el viernes 14. El lunes 16 la tarea editorial prepara la 2026-W48 (semana del 23 de noviembre), sin duplicar.

## Despliegue de artículos

Al hacer merge a `main`, el workflow `.github/workflows/desplegar-web.yml` compila `web/` y sube `web/dist/` a Hostinger por FTP (ver `web/README.md`, sección "Publicar en Hostinger"). Tarda unos minutos; revisa que el run termine en verde en la pestaña Actions de GitHub. Si el despliegue falla o aún no corrió, el publicador no programa el post cuyo enlace no responde y lo avisa; en ese caso lanza el workflow a mano.

## Límites conocidos

- Upload-Post Free: 10 publicaciones al mes, contando perfil y página. El calendario usa 8 a 10 (diciembre usa las 10).
- LinkedIn no entrega métricas del perfil personal por API. Si quieres incluirlas en el reporte, anótalas en `contenido/reportes/notas_<AAAA-MM>.md`.
- Los agentes no pueden consultar Keyword Surfer. Cuando un artículo necesita un volumen, queda un `[PENDIENTE]` que llenas tú; el PR no pasa la validación hasta que lo resuelvas.
- Comentar, responder y escribir mensajes en LinkedIn sigue siendo manual. Ningún conector con API oficial lo permite.
