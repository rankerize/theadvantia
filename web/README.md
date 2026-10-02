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

## Reglas de contenido

- Español de Colombia. Sin guion largo (—).
- Montos completos con separador de miles (`$1.200.000`, nunca `$1.2M`).
- "Mercado Libre" separado. "Alcance SEO" y "venta orgánica" como términos de marca.
- Ninguna cifra sin fuente verificable.
- El precio del Diagnóstico en el sitio debe coincidir con el monto del link de Wompi.
- `/gracias` se mide en GA4 pero no se indexa.
