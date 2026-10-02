#!/usr/bin/env python3
"""
Validador HTML inPage Falabella — PASO 6 del Protocolo Maestro v3.4 (+ adendas v3.6/v3.7).

Uso:
    python scripts/validar_html.py archivo_INPAGE.html
    python scripts/validar_html.py archivo_INPAGE.html --keywords keywords.txt
    python scripts/validar_html.py archivo_INPAGE.html --vtex archivo_VTEX.html

keywords.txt: una keyword por linea (opcional: "keyword|volumen").
"""
import argparse
import re
import sys
from html.parser import HTMLParser

EMOJI_RE = re.compile(
    "[\U0001F300-\U0001FAFF\U0001F000-\U0001F2FF\U00002600-\U000027BF\U0001F900-\U0001F9FF]"
)
PROHIBIDOS = ["<div", "<style", "<script", "<h1", "<h2", "<h3", "<h4", "<h5", "<h6",
              "class=", " id=", "drive.google.com/uc?id="]


class _Text(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts, self.imgs, self.iframes = [], [], []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "img":
            self.imgs.append((a.get("src", ""), a.get("alt", "")))
        elif tag == "iframe":
            self.iframes.append(a.get("src", ""))

    def handle_data(self, data):
        self.parts.append(data)

    def norm_text(self):
        return re.sub(r"\s+", " ", " ".join(self.parts)).strip()


def parse(content):
    p = _Text()
    p.feed(content)
    return p


def validar_falabella(content, keywords):
    ok = True
    emojis = EMOJI_RE.findall(content)
    print("Emojis:", "NINGUNO" if not emojis else emojis)
    ok &= not emojis

    low = content.lower()
    for tag in PROHIBIDOS:
        hit = tag in low
        print(f"{tag:28} {'ALERTA' if hit else 'OK'}")
        ok &= not hit

    p = parse(content)
    srcs = [s for s, _ in p.imgs]
    print(f"Imagenes: {len(srcs)}")
    malas = [s for s in srcs if not s.startswith("https://lh3.googleusercontent.com/d/")]
    if malas:
        print("  ALERTA URLs fuera de formato lh3:", malas)
        ok = False
    dup = {s for s in srcs if srcs.count(s) > 1}
    if dup:
        print("  ALERTA imagenes duplicadas:", dup)
        ok = False
    sin_alt = [s for s, a in p.imgs if not a]
    if sin_alt:
        print(f"  AVISO {len(sin_alt)} imagenes sin alt")

    for src in p.iframes:
        if "youtube.com/embed/" not in src or "[" in src:
            print("  ALERTA iframe sin URL real de YouTube:", src)
            ok = False

    if keywords:
        print("\nKeywords SEO:")
        for kw in keywords:
            n = low.count(kw.lower())
            print(f"[{'OK' if n else 'FALTA'}] [{n}x] {kw}")
    return ok


def comparar_vtex(fal, vtex):
    a, b = parse(fal), parse(vtex)
    checks = {
        "Texto normalizado": a.norm_text() == b.norm_text(),
        "src de <img>": [s for s, _ in a.imgs] == [s for s, _ in b.imgs],
        "alt de <img>": [x for _, x in a.imgs] == [x for _, x in b.imgs],
        "src de <iframe>": a.iframes == b.iframes,
    }
    print("\nComparacion Falabella vs VTEX (ADENDA v3.7):")
    for k, v in checks.items():
        print(f"{k:22} {'OK' if v else 'DIFERENTE'}")
    return all(checks.values())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("html")
    ap.add_argument("--keywords")
    ap.add_argument("--vtex")
    args = ap.parse_args()

    content = open(args.html, encoding="utf-8").read()
    kws = []
    if args.keywords:
        for line in open(args.keywords, encoding="utf-8"):
            line = line.strip()
            if line:
                kws.append(line.split("|")[0].strip())

    ok = validar_falabella(content, kws)
    if args.vtex:
        ok &= comparar_vtex(content, open(args.vtex, encoding="utf-8").read())

    print("\nRESULTADO:", "HTML APROBADO PARA PRODUCCION" if ok else "CORREGIR Y REVALIDAR")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
