#!/usr/bin/env python3
"""
Script de Procesamiento y Clustering SEO para Estudios de Mercado Advantia (CatalogAI).
Procesa exportaciones de Google Keyword Planner o SEMrush y genera informes en Markdown, JSON y CSV.
"""

import sys
import json
import csv
import os

def parse_keyword_data(raw_text):
    lines = raw_text.strip().split('\n')
    data = []
    for line in lines[1:]:
        parts = line.split('\t')
        if len(parts) >= 4:
            kw = parts[0].strip()
            if not kw or kw.lower().startswith('keyword') or kw.lower().startswith('todo') or kw.lower() == 'colombia':
                continue
            try:
                vol = float(parts[3].replace(',', ''))
            except:
                vol = 0.0
            yoy = parts[5].strip() if len(parts) > 5 else '0%'
            comp = parts[6].strip() if len(parts) > 6 else 'Alto'
            data.append({
                'keyword': kw,
                'volume': int(vol),
                'yoy': yoy,
                'competition': comp
            })
    return data

def main():
    print("Módulo de Estudios de Mercado CatalogAI cargado correctamente.")

if __name__ == '__main__':
    main()
