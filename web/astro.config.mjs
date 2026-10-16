// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readdir, readFile, rename, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

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
  '/politica-de-privacidad': 0.3,
};

const PORTAL_MARK = '<meta name="advantia-portal" content="1">';
const PRIVATE_ROBOTS = '<meta name="robots" content="noindex, nofollow">';

/**
 * Portal de clientes, cerrado por defecto.
 * Las paginas con <Base portal> se mueven a dist/_portal/ (bloqueada por HTTP). El .htaccess envia
 * sus URL a portal/gate.php, que solo las entrega con sesion valida. Tambien se quitan del sitemap.
 * Si una pagina usa robots "noindex, nofollow" (la convencion del portal) sin la marca `portal`,
 * la compilacion falla: asi ninguna herramienta nueva queda publica por olvido.
 */
function portalPrivado() {
  return {
    name: 'advantia-portal-privado',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const priv = join(root, '_portal');
        await mkdir(priv, { recursive: true });
        const moved = [];
        for (const file of await readdir(root)) {
          if (!file.endsWith('.html')) continue;
          const html = await readFile(join(root, file), 'utf8');
          const isPortal = html.includes(PORTAL_MARK);
          if (!isPortal && html.includes(PRIVATE_ROBOTS)) {
            throw new Error(`${file} tiene robots "noindex, nofollow" pero no esta marcada como portal. ` +
              'Si es una herramienta del portal, usa <Base ... portal>; si es publica, cambia su robots.');
          }
          if (isPortal) {
            await rename(join(root, file), join(priv, file));
            moved.push(file.replace(/\.html$/, ''));
          }
        }
        // Fuera del sitemap
        for (const file of await readdir(root)) {
          if (!/^sitemap-\d+\.xml$/.test(file)) continue;
          const path = join(root, file);
          let xml = await readFile(path, 'utf8');
          for (const slug of moved) {
            xml = xml.replace(new RegExp(`<url><loc>https://theadvantia\\.com/${slug}</loc>.*?</url>`, 'g'), '');
          }
          await writeFile(path, xml);
        }
        logger.info(`Portal privado: ${moved.length} paginas protegidas (${moved.join(', ')})`);
      },
    },
  };
}

export default defineConfig({
  site: 'https://theadvantia.com',
  // Salida plana (marketplaces.html, blog/slug.html): el .htaccess de Hostinger sirve las URL limpias
  build: { format: 'file' },
  trailingSlash: 'never',
  // Se conserva el HTML tal como lo escribimos (sin colapsar espacios)
  compressHTML: false,
  integrations: [
    sitemap({
      // /gracias, /404 y /acceso son noindex: no van al sitemap (el portal lo quita portalPrivado)
      filter: (page) => !/\/(gracias|404|acceso)$/.test(page.replace(/\/$/, '')),
      serialize(item) {
        const path = new URL(item.url).pathname.replace(/\.html$/, '').replace(/(.)\/$/, '$1');
        item.url = 'https://theadvantia.com' + path;
        item.priority = PRIORITY[path] ?? 0.5;
        item.lastmod = new Date().toISOString().slice(0, 10);
        return item;
      },
    }),
    // Debe ir despues de sitemap: limpia el sitemap ya generado
    portalPrivado(),
  ],
});
