# web · Sitio theadvantia.com

Sitio web público de ADVANTIA hecho con [Astro](https://astro.build). Genera HTML estático que se publica en Hostinger.

## Comandos

Se ejecutan dentro de esta carpeta (`cd web`).

| Comando | Qué hace |
|---|---|
| `npm install` | Instala dependencias (Node 20 o superior) |
| `npm run dev` | Servidor local en `http://localhost:4321` |
| `npm run build` | Genera el sitio en `dist/` |
| `npm run preview` | Sirve `dist/` para revisarlo antes de publicar |

## Publicar en Hostinger

1. `npm run build`
2. Sube el **contenido** de `dist/` a `public_html` (incluye `.htaccess`, que es un archivo oculto).

El build usa salida plana (`marketplaces.html`, `blog/<slug>.html`) y el `.htaccess` sirve las URL limpias (`/marketplaces`, `/blog/<slug>`), redirige `www` y `http` al dominio raíz con HTTPS, y redirige el antiguo `/sitemap.xml` a `/sitemap-index.xml`.

## Estructura

```
src/
  config.ts              Dominio, versión de caché (VERSION), GA4 y HubSpot
  layouts/Base.astro     <head> (SEO, Open Graph, JSON-LD, GA4), nav, footer y scripts
  components/            Nav, Footer, Sprite (íconos) y Announce (barra del piloto)
  pages/                 Una página .astro por URL; el blog está en pages/blog/
public/
  style.css, app.js      Estilos y comportamiento (formularios, calculadora, filtros, eventos GA4)
  assets/, img/          Videos, posters, ilustraciones del blog e imágenes para compartir
  robots.txt, llms.txt   Rastreadores y resumen del sitio para modelos de lenguaje
  .htaccess              Reglas de Apache para Hostinger
```

- **Sitemap:** lo genera `@astrojs/sitemap` en cada build (`sitemap-index.xml` y `sitemap-0.xml`). Excluye `/gracias` y `/404`. Las prioridades están en `astro.config.mjs`.
- **SEO por página:** cada página define `seo` (título, descripción, canonical, Open Graph, Twitter) y `jsonLd` en su frontmatter.
- **Caché:** al cambiar `public/style.css` o `public/app.js`, sube `VERSION` en `src/config.ts`.
- **Nav activo:** cada página pasa `active="/ruta"` a `<Base>`.

## Portal de clientes

Acceso privado para clientes con plan recurrente (Esencial, Crecimiento, Catálogo, Enterprise) y para el equipo.

- **Entrada:** `/acceso` (página pública, `src/pages/acceso.astro`). El formulario envía a `public/portal/login.php`.
- **Sesión en el servidor (PHP en Hostinger):** cookie `adv_portal` con `Secure`, `HttpOnly` y `SameSite=Lax`; se cierra tras 2 horas sin actividad y a las 12 horas como máximo. Bloqueo de 15 minutos tras 5 intentos fallidos por cuenta (o 30 por IP). Verificación de origen del formulario y campo trampa contra robots.
- **Páginas del portal:** se marcan con `<Base ... portal>`. Al compilar, `astro.config.mjs` las mueve a `dist/_portal/` (bloqueada por HTTP) y las quita del sitemap; `public/portal/gate.php` solo las entrega con sesión válida y, si no, redirige a `/acceso`. Las URL no cambian (`/aplicativos`, `/estudios-de-mercado`, etc.).
- **Cerrado por defecto:** si una página usa `robots: 'noindex, nofollow'` sin la marca `portal`, la compilación falla.
- **Nombre del cliente:** `%%PORTAL_USER%%` en cualquier página del portal se reemplaza en el servidor por el nombre de la cuenta.
- **Nunca** poner claves de API, tokens ni datos de otros clientes en las páginas del portal: todo cliente con sesión puede ver el código de la página.

### Cuentas

Se administran con `scripts/portal-usuarios.mjs`. La fuente es `portal-usuarios.json` (solo hashes bcrypt) y cada cambio regenera `public/portal/_users.php`. Después: commit y desplegar.

```bash
node scripts/portal-usuarios.mjs agregar cliente@empresa.com "Empresa S.A.S." "Crecimiento"
node scripts/portal-usuarios.mjs clave cliente@empresa.com
node scripts/portal-usuarios.mjs desactivar cliente@empresa.com
node scripts/portal-usuarios.mjs listar
```

La clave se muestra una sola vez en la terminal: entrégala al cliente por un canal privado. Al desactivar una cuenta, su sesión se corta en la siguiente página que abra.

## Reglas de contenido

- Español de Colombia. Sin guion largo (—).
- Montos completos con separador de miles (`$1.200.000`, nunca `$1.2M`).
- "Mercado Libre" separado. "Alcance SEO" y "venta orgánica" como términos de marca.
- Ninguna cifra sin fuente verificable.
- El precio del Diagnóstico en el sitio debe coincidir con el monto del link de Wompi.
- `/gracias` se mide en GA4 pero no se indexa.
