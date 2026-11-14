#!/usr/bin/env python3
"""Validador de contenido ADVANTIA (posts de LinkedIn y artículos del blog).

Uso:
  python scripts/validar_contenido.py --archivo contenido/posts/2026-W48-1.md
  python scripts/validar_contenido.py --archivo web/src/pages/blog/mi-articulo.astro
  python scripts/validar_contenido.py --semana 2026-W48
  python scripts/validar_contenido.py --cambiados            # archivos cambiados frente a origin/main (CI)
  python scripts/validar_contenido.py --cupo 2026-11 [--sumar 1]

Sale con código 1 si hay errores (o si el cupo se supera). Las advertencias no bloquean.
Requiere PyYAML: pip install pyyaml
"""
import argparse
import csv
import html
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path

try:
    import yaml
except ImportError:
    sys.exit("Falta PyYAML. Instálalo con: pip install pyyaml")

RAIZ = Path(__file__).resolve().parent.parent
POSTS = RAIZ / "contenido" / "posts"
BLOG = RAIZ / "web" / "src" / "pages" / "blog"
CLIENTES = RAIZ / "contenido" / "clientes.yaml"
CONFIG = RAIZ / "contenido" / "upload_post.yaml"

CUENTAS = {"perfil", "pagina"}
FORMATOS = {"texto", "articulo", "documento"}
ESTADOS = {"propuesto", "programado", "publicado", "descartado"}
PILARES = {"P1", "P2", "P3", "P4", "P5"}

# (patrón, mensaje, es_error)
REGLAS_COPY = [
    (r"—", 'Usa coma, punto o dos puntos en lugar de guion largo "—"', True),
    (r"–", 'Evita el guion "–"; usa "a" para rangos o reescribe', False),
    (r"(?i)cobertura\s+seo", 'Di "Alcance SEO", no "Cobertura SEO"', True),
    (r"(?i)venta(s)?\s+sin\s+pauta", 'Di "venta orgánica", no "venta sin pauta"', True),
    (r"(?i)\bmercadolibre\b", '"Mercado Libre" va en dos palabras', True),
    (r"\$\s?\d+(?:[.,]\d+)?\s?(?:M|MM|K|k|mil)\b", "Monto abreviado: escribe el valor completo en pesos ($1.200.000)", True),
    (r"(?i)\b\d+(?:[.,]\d+)?\s?(?:millones|millón)\b", "Monto en palabras: prefiere el valor completo en pesos", False),
    (r"\[PENDIENTE", "Hay un [PENDIENTE] sin resolver", True),
    (r"(?i)\b(?:estimad[oa]s?|proyectad[oa]s?|aproximadamente)\b", "Revisa que no sea una cifra estimada (solo datos verificados)", False),
]


class Resultado:
    def __init__(self, nombre):
        self.nombre = nombre
        self.errores = []
        self.avisos = []

    def error(self, msg):
        self.errores.append(msg)

    def aviso(self, msg):
        self.avisos.append(msg)

    def imprimir(self):
        estado = "OK" if not self.errores else "ERROR"
        print(f"\n[{estado}] {self.nombre}")
        for e in self.errores:
            print(f"  x {e}")
        for a in self.avisos:
            print(f"  ! {a}")


def leer_post(ruta):
    texto = Path(ruta).read_text(encoding="utf-8")
    m = re.match(r"^---\n(.*?)\n---\n?(.*)$", texto, re.S)
    if not m:
        return None, texto
    meta = yaml.safe_load(m.group(1)) or {}
    cuerpo = m.group(2)
    return meta, cuerpo


def cuerpo_publicable(cuerpo):
    """Texto que se envía a LinkedIn: sin comentarios HTML y sin espacios sobrantes."""
    sin_comentarios = re.sub(r"<!--.*?-->", "", cuerpo, flags=re.S)
    return sin_comentarios.strip()


def nombres_no_autorizados():
    if not CLIENTES.exists():
        return []
    datos = yaml.safe_load(CLIENTES.read_text(encoding="utf-8")) or {}
    bloqueados = []
    for cliente in (datos.get("clientes") or {}).values():
        if cliente.get("autorizacion_escrita"):
            continue
        nombre = cliente.get("nombre_publico") or ""
        primera = nombre.split()[0] if nombre.split() and len(nombre.split()[0]) >= 4 else None
        for n in [nombre, primera] + list(cliente.get("marcas") or []):
            if n:
                bloqueados.append(n)
    return bloqueados


def revisar_copy(texto, res):
    for patron, msg, es_error in REGLAS_COPY:
        hallados = re.findall(patron, texto)
        if hallados:
            (res.error if es_error else res.aviso)(f"{msg} ({len(hallados)} vez/veces)")
    for nombre in nombres_no_autorizados():
        if re.search(rf"(?i)\b{re.escape(nombre)}\b", texto):
            res.error(f'Menciona "{nombre}" sin autorizacion_escrita en clientes.yaml; usa la descripción anónima')


def validar_post(ruta):
    p = Path(ruta)
    res = Resultado(str(p.relative_to(RAIZ)) if p.is_relative_to(RAIZ) else str(p))
    meta, cuerpo = leer_post(ruta)
    if meta is None:
        res.error("No tiene frontmatter YAML entre líneas ---")
        return res

    for campo in ("id", "cuenta", "fecha", "pilar", "formato", "estado"):
        if not meta.get(campo):
            res.error(f"Falta el campo '{campo}'")
    if meta.get("cuenta") and meta["cuenta"] not in CUENTAS:
        res.error(f"cuenta debe ser una de {sorted(CUENTAS)}")
    if meta.get("formato") and meta["formato"] not in FORMATOS:
        res.error(f"formato debe ser uno de {sorted(FORMATOS)}")
    if meta.get("estado") and meta["estado"] not in ESTADOS:
        res.error(f"estado debe ser uno de {sorted(ESTADOS)}")
    if meta.get("pilar") and meta["pilar"] not in PILARES:
        res.error(f"pilar debe ser uno de {sorted(PILARES)}")
    if "fuentes" not in meta:
        res.error("Falta el campo 'fuentes' (lista vacía si no hay cifras)")

    fecha = meta.get("fecha")
    if fecha:
        try:
            datetime.strptime(str(fecha), "%Y-%m-%d %H:%M")
        except ValueError:
            res.error("fecha debe tener el formato AAAA-MM-DD HH:MM (hora de Bogotá)")

    texto = cuerpo_publicable(cuerpo)
    n = len(texto)
    if n == 0:
        res.error("El post está vacío")
    if n > 3000:
        res.error(f"{n} caracteres: LinkedIn admite máximo 3.000")
    elif n and not 700 <= n <= 1800:
        res.aviso(f"{n} caracteres: lo ideal es entre 900 y 1.500")

    lineas = [l for l in texto.splitlines() if l.strip()]
    if lineas and len(lineas[0]) > 120:
        res.aviso(f"La primera línea tiene {len(lineas[0])} caracteres; ideal máximo 120")

    hashtags = re.findall(r"(?<!\w)#\w+", texto)
    if len(hashtags) > 3:
        res.error(f"{len(hashtags)} hashtags: máximo 3")

    # Cifras sin fuente: cualquier número de 3+ dígitos o con % exige fuentes
    if re.search(r"\d{3,}|\d+(?:[.,]\d+)?\s?%", re.sub(r"https?://\S+", "", texto)) and not meta.get("fuentes"):
        res.error("Tiene cifras pero 'fuentes' está vacío (cita la línea de datos_verificados.md)")

    formato = meta.get("formato")
    if formato == "articulo" and "theadvantia.com" not in texto:
        res.error("Formato articulo: falta el enlace al artículo en el texto")
    if formato == "documento":
        if not meta.get("documento_url"):
            res.error("Formato documento: falta documento_url")
        titulo = meta.get("documento_titulo") or ""
        if not titulo:
            res.error("Formato documento: falta documento_titulo")
        elif len(titulo) > 400:
            res.error("documento_titulo supera 400 caracteres")

    if meta.get("id") and Path(ruta).stem != str(meta["id"]):
        res.aviso(f"El nombre del archivo no coincide con el id ({meta['id']})")

    revisar_copy(texto, res)
    return res


def texto_visible_html(contenido):
    sin_scripts = re.sub(r"<(script|style)\b.*?</\1>", " ", contenido, flags=re.S | re.I)
    sin_tags = re.sub(r"<[^>]+>", " ", sin_scripts)
    return html.unescape(re.sub(r"\s+", " ", sin_tags))


def _campo_seo(contenido, campo):
    """Lee seo.<campo> de un .astro (objeto JS con claves entre comillas)."""
    m = re.search(rf'"{campo}"\s*:\s*"((?:[^"\\]|\\.)*)"', contenido)
    return html.unescape(m.group(1)) if m else None


def validar_articulo(ruta):
    """Valida un artículo del blog: web/src/pages/blog/<slug>.astro (o .html)."""
    res = Resultado(str(Path(ruta).relative_to(RAIZ)) if Path(ruta).is_relative_to(RAIZ) else str(ruta))
    contenido = Path(ruta).read_text(encoding="utf-8")
    es_astro = str(ruta).endswith(".astro")

    if es_astro:
        titulo = _campo_seo(contenido, "title")
        desc = _campo_seo(contenido, "description")
        # Cuerpo: lo que sigue al segundo '---' (frontmatter de Astro)
        partes = contenido.split("---", 2)
        cuerpo = partes[2] if len(partes) == 3 else contenido
        if "<Base" not in cuerpo:
            res.error("Falta el layout <Base ...>")
        if "portal" in re.search(r"<Base[^>]*>", cuerpo).group(0).split() if re.search(r"<Base[^>]*>", cuerpo) else False:
            res.error("Un artículo del blog no debe usar <Base portal>")
        tiene_jsonld = "const jsonLd" in contenido and '"@type"' in contenido
    else:
        t = re.search(r"<title>(.*?)</title>", contenido, re.S | re.I)
        titulo = html.unescape(t.group(1).strip()) if t else None
        d = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']', contenido, re.S | re.I)
        desc = html.unescape(d.group(1)) if d else None
        cuerpo = contenido
        tiene_jsonld = "application/ld+json" in contenido

    if not titulo:
        res.error("Falta el title (seo.title)")
    elif len(titulo) > 60:
        res.error(f"title de {len(titulo)} caracteres: máximo 60")

    if not desc:
        res.error("Falta la meta description (seo.description)")
    elif len(desc) > 155:
        res.error(f"Meta description de {len(desc)} caracteres: máximo 155")

    h1 = re.findall(r"<h1\b", cuerpo, re.I)
    if len(h1) != 1:
        res.error(f"Debe haber exactamente un <h1> (hay {len(h1)})")

    if not tiene_jsonld:
        res.error("Falta el JSON-LD")
    elif es_astro:
        for tipo in ("BlogPosting", "BreadcrumbList"):
            if f'"{tipo}"' not in contenido:
                res.error(f"El JSON-LD no incluye {tipo}")

    if es_astro:
        slug = Path(ruta).stem
        blog_idx = BLOG.parent / "blog.astro"
        if blog_idx.exists() and f"/blog/{slug}" not in blog_idx.read_text(encoding="utf-8"):
            res.error("El artículo no está en el índice web/src/pages/blog.astro")
        cfg = RAIZ / "web" / "astro.config.mjs"
        if cfg.exists() and f"/blog/{slug}" not in cfg.read_text(encoding="utf-8"):
            res.aviso("Falta la prioridad de /blog/" + slug + " en PRIORITY de astro.config.mjs")
        llms = RAIZ / "web" / "public" / "llms.txt"
        if llms.exists() and f"/blog/{slug}" not in llms.read_text(encoding="utf-8"):
            res.aviso("Falta la línea del artículo en web/public/llms.txt")

    visible = texto_visible_html(cuerpo)
    palabras = len(visible.split())
    if palabras < 900:
        res.aviso(f"{palabras} palabras: el objetivo es 1.200 a 1.800")

    enlaces_internos = re.findall(r'href=["\'](?:/|https://theadvantia\.com)[^"\']*["\']', cuerpo)
    if len(enlaces_internos) < 2:
        res.aviso("Menos de 2 enlaces internos")

    revisar_copy(visible, res)
    return res


def validar_archivo(ruta):
    ruta = Path(ruta)
    if not ruta.is_absolute():
        ruta = RAIZ / ruta
    if ruta.suffix == ".md":
        return validar_post(ruta)
    if ruta.suffix in {".html", ".astro"}:
        return validar_articulo(ruta)
    r = Resultado(str(ruta))
    r.aviso("Tipo de archivo no validado")
    return r


def archivos_cambiados():
    salida = subprocess.run(
        ["git", "diff", "--name-only", "--diff-filter=AM", "origin/main...HEAD"],
        cwd=RAIZ, capture_output=True, text=True, check=False,
    ).stdout.split()
    elegidos = []
    for f in salida:
        if f.startswith("contenido/posts/") and f.endswith(".md"):
            elegidos.append(f)
        elif f.startswith("web/src/pages/blog/") and f.endswith(".astro"):
            elegidos.append(f)
    return elegidos


def archivos_de_semana(semana):
    archivos = sorted(POSTS.glob(f"{semana}-*.md"))
    cal = RAIZ / "contenido" / "calendario.yaml"
    if cal.exists():
        datos = yaml.safe_load(cal.read_text(encoding="utf-8")) or {}
        for s in datos.get("semanas", []):
            if s.get("semana") == semana and s.get("articulo"):
                slug = s["articulo"]["slug"]
                candidatos = [p for p in [BLOG / f"{slug}.astro"] if p.exists()]
                if not candidatos:
                    print(f"! No encontré el artículo (web/src/pages/blog/<slug>.astro) '{slug}'")
                archivos.extend(candidatos)
    return archivos


def revisar_cupo(mes, sumar):
    cupo = 10
    if CONFIG.exists():
        cupo = (yaml.safe_load(CONFIG.read_text(encoding="utf-8")) or {}).get("cupo_mensual", 10)
    usados = 0
    for p in POSTS.glob("*.md"):
        meta, _ = leer_post(p)
        if meta and meta.get("estado") in {"programado", "publicado"} and str(meta.get("fecha", "")).startswith(mes):
            usados += 1
    total = usados + sumar
    print(f"Cupo {mes}: {usados} usados + {sumar} por programar = {total} de {cupo}")
    return total <= cupo


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--archivo", nargs="+")
    g.add_argument("--semana")
    g.add_argument("--cambiados", action="store_true")
    g.add_argument("--cupo")
    ap.add_argument("--sumar", type=int, default=0, help="Con --cupo: publicaciones que se quieren agregar")
    args = ap.parse_args()

    if args.cupo:
        sys.exit(0 if revisar_cupo(args.cupo, args.sumar) else 1)

    if args.archivo:
        archivos = args.archivo
    elif args.semana:
        archivos = archivos_de_semana(args.semana)
    else:
        archivos = archivos_cambiados()

    if not archivos:
        print("No hay archivos para validar.")
        sys.exit(0)

    resultados = [validar_archivo(a) for a in archivos]
    for r in resultados:
        r.imprimir()
    total_err = sum(len(r.errores) for r in resultados)
    total_av = sum(len(r.avisos) for r in resultados)
    print(f"\n{len(resultados)} archivo(s), {total_err} error(es), {total_av} aviso(s).")
    sys.exit(1 if total_err else 0)


if __name__ == "__main__":
    main()
