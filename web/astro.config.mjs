// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Prioridad por URL (la misma del sitemap.xml manual que tenia el sitio)
const PRIORITY = {
  '/': 1.0,
  '/marketplaces': 0.9,
  '/distribuidoras': 0.9,
  '/blog': 0.8,
  '/contacto': 0.7,
  '/blog/errores-al-publicar-en-mercado-libre': 0.7,
  '/blog/ahorro-de-tiempo-con-ia-en-pymes': 0.7,
  '/blog/como-vender-en-amazon-desde-colombia': 0.7,
  '/nosotros': 0.6,
  '/aplicativos': 0.6,
  '/politica-de-privacidad': 0.3,
};

export default defineConfig({
  site: 'https://theadvantia.com',
  // Salida plana (marketplaces.html, blog/slug.html): el .htaccess de Hostinger sirve las URL limpias
  build: { format: 'file' },
  trailingSlash: 'never',
  // Se conserva el HTML tal como lo escribimos (sin colapsar espacios)
  compressHTML: false,
  integrations: [
    sitemap({
      // /gracias y /404 son noindex: no van al sitemap
      filter: (page) => !/\/(gracias|404)$/.test(page.replace(/\/$/, '')),
      serialize(item) {
        const path = new URL(item.url).pathname.replace(/\.html$/, '').replace(/(.)\/$/, '$1');
        item.url = 'https://theadvantia.com' + path;
        item.priority = PRIORITY[path] ?? 0.5;
        item.lastmod = new Date().toISOString().slice(0, 10);
        return item;
      },
    }),
  ],
});
