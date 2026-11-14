# Marca ADVANTIA para contenido

Fuente de verdad visual: `web/public/style.css`. Este archivo reemplaza a `ADVANTIA_OVERRIDE.md` y `REFERENCIA_ESTILO.md`, que no existen en el repo.

## Colores

| Token | Valor | Uso |
|---|---|---|
| `--ink` | #1E2761 | Titulares y CTA |
| `--gold` | #B08D57 | Solo acento, entre 8 y 12% de la lámina. Nunca relleno ni fondo |
| `--green` | #1BAF7A | Estado positivo |
| `--ink-deep` | #0B1F3A | Solo en gradientes de fondo oscuro |

## Tipografía de carruseles

Igual que la web: **Plus Jakarta Sans** en títulos e **Inter** en texto.

Las fuentes están embebidas en `contenido/fuentes/` (woff2, subconjunto latino, licencia OFL incluida) para que WeasyPrint las renderice sin depender de internet. Usa este `@font-face` en el HTML del carrusel (la ruta es relativa a `web/public/assets/linkedin/`):

```css
@font-face { font-family: "Plus Jakarta Sans"; font-weight: 700; src: url("../../../../contenido/fuentes/plus-jakarta-sans-latin-700-normal.woff2"); }
@font-face { font-family: "Plus Jakarta Sans"; font-weight: 800; src: url("../../../../contenido/fuentes/plus-jakarta-sans-latin-800-normal.woff2"); }
@font-face { font-family: "Inter"; font-weight: 400; src: url("../../../../contenido/fuentes/inter-latin-400-normal.woff2"); }
@font-face { font-family: "Inter"; font-weight: 600; src: url("../../../../contenido/fuentes/inter-latin-600-normal.woff2"); }
```

Pesos disponibles: títulos 700 y 800, texto 400 y 600. No pidas otros pesos: el navegador los sintetizaría.

## Tono

"Cercano corporativo": profesional y claro, sin jerga ni solemnidad, hablándole de tú o de usted según la voz de la cuenta definida en `estrategia.md`.

## Datos

Cero datos inventados. Si no hay dato verificado en `datos_verificados.md`, no hay número.

## Copy colombiano

- Sin guiones largos ("—").
- "Mercado Libre" en dos palabras.
- "Venta orgánica", no "venta sin pauta".
- "Alcance SEO", no "Cobertura SEO".
- Montos en pesos completos ($1.200.000), nunca abreviados.

## Logo (archivos en `web/public/img/`)

| Dónde | Archivo | Reglas |
|---|---|---|
| Portada del carrusel (fondo navy) | `advantia-logo-nav-blanco.png` (400 px de ancho) | Sobre fondo navy |
| Última lámina (fondo claro) | `advantia-logo-completo.png` (600 px de ancho) + texto "theadvantia.com" | No usarlo a más de 400 px en la lámina para que no se pixele |
| Láminas intermedias | `advantia-favicon-512.png` pequeño (unos 48 px) en una esquina, o nada | |

Nunca estirar el logo, recolorearlo ni ponerlo sobre fondos que no contrasten. Los artículos del blog no llevan logo: ya lo pone el layout del sitio.
