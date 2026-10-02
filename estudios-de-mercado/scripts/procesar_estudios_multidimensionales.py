#!/usr/bin/env python3
"""
Procesador de Estudios de Mercado Multidimensional — Advantia CatalogAI
Lee los archivos CSV/TSV de Google Keyword Planner y genera los datasets JSON y CSV
clasificados en las 6 dimensiones de CatalogAI + Quick Wins.
"""

import csv
import json
import os
import glob
import re

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
OUTPUT_SERVICE_DATA_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'market-research-service', 'src', 'data')
INFORMES_DIR = os.path.join(os.path.dirname(__file__), '..', 'informes')

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(OUTPUT_SERVICE_DATA_DIR, exist_ok=True)
os.makedirs(INFORMES_DIR, exist_ok=True)

CATEGORIES = [
    {
        'id': 'ollas-sartenes-2026',
        'name': 'Ollas, Sartenes & Menaje de Cocina',
        'icon': '🍲',
        'file': 'Keyword Stats 2026-10-01 at 19_59_15.csv',
        'keywords_json': 'keywords_ollas_sartenes_2026.json',
        'keywords_csv': 'keywords_ollas_sartenes_2026.csv',
        'clusters': {
            'presion': ['presion', 'presión', 'express', 'pitadora', 'olla a presion', 'olla de presion', 'olla express'],
            'arroceras': ['arrocera', 'vaporera', 'electrica', 'eléctrica', 'multifuncional', 'multichef', 'airfryer', 'freidora'],
            'sartenes': ['sarten', 'sartén', 'sartenes', 'wok', 'comal', 'plancha', 'crepera'],
            'baterias': ['bateria', 'batería', 'juego de ollas', 'set de ollas', 'baterias', 'baterías'],
            'materiales': ['hierro', 'acero', 'inoxidable', 'aluminio', 'barro', 'vidrio', 'peltre', 'ceramica', 'cerámica', 'titanio', 'teflon', 'teflón', 'granito', 'piedra'],
            'marcas': ['imusa', 'universal', 'oster', 'tramontina', 'royal prestige', 'rena ware', 'tefal', 'ninja', 'le creuset', 'flavorstone', 'victoria', 'corona'],
            'salud': ['toxico', 'tóxico', 'pfoa', 'ptfe', 'plomo', 'salud', 'veneno', 'quimico', 'químico', 'seguro', 'peligro', 'ventajas', 'desventajas']
        }
    },
    {
        'id': 'relojes-2026',
        'name': 'Relojes & Accesorios Hombre/Mujer',
        'icon': '⌚',
        'file': 'Keyword Stats 2026-10-01 at 20_38_45.csv',
        'keywords_json': 'keywords_relojes_2026.json',
        'keywords_csv': 'keywords_relojes_2026.csv',
        'clusters': {
            'hombre': ['hombre', 'hombres', 'masculino', 'caballero'],
            'mujer': ['mujer', 'mujeres', 'femenino', 'dama'],
            'smartwatch': ['smartwatch', 'inteligente', 'digital', 'smart', 'pulsera', 'bluetooth'],
            'marcas': ['casio', 'rolex', 'fossil', 'invicta', 'tissot', 'seiko', 'tommy', 'diesel', 'hublot', 'orient', 'citizen', 'swatch', 'tag heuer', 'g shock', 'adidas'],
            'materiales': ['oro', 'plata', 'acero', 'cuero', 'titanio', 'silicona', 'diamantes'],
            'estilo': ['deportivo', 'elegante', 'lujo', 'clasico', 'vintage', 'militar', 'resistente al agua', 'sumergible']
        }
    },
    {
        'id': 'lenceria-2026',
        'name': 'Lencería, Brasieres & Ropa Interior',
        'icon': '👙',
        'file': 'Keyword Stats 2026-10-01 at 20_38_38.csv',
        'keywords_json': 'keywords_lenceria_2026.json',
        'keywords_csv': 'keywords_lenceria_2026.csv',
        'clusters': {
            'brasieres': ['brasier', 'bra', 'sosten', 'strapless', 'push up', 'bralette', 'copa', 'sin varilla'],
            'pantis': ['panti', 'panties', 'tanga', 'hilo', 'cachetero', 'boxer femenino', 'calzon', 'culotte'],
            'fajas': ['faja', 'moldeadora', 'reductora', 'cinturilla', 'postquirurgica', 'control abdomen'],
            'marcas': ['leonisa', 'besame', 'bésame', 'lili pink', 'chamela', 'diane', 'tarrao', 'gef', 'pointelle'],
            'materiales': ['encaje', 'seda', 'algodon', 'algodón', 'transparente', 'seamless', 'blonda', 'lycra'],
            'ocasiones': ['novia', 'boda', 'sensual', 'erotica', 'maternidad', 'deportiva', 'diario']
        }
    },
    {
        'id': 'abrigos-2026',
        'name': 'Abrigos, Chaquetas & Ropa de Invierno',
        'icon': '🧥',
        'file': 'Keyword Stats 2026-10-01 at 20_38_51.csv',
        'keywords_json': 'keywords_abrigos_2026.json',
        'keywords_csv': 'keywords_abrigos_2026.csv',
        'clusters': {
            'chaquetas': ['chaqueta', 'cazadora', 'bomber', 'biker', 'parka', 'rompevientos', 'puffer'],
            'abrigos': ['abrigo', 'trench', 'gabardina', 'sobretodo', 'cardigan', 'saco', 'buzo'],
            'materiales': ['cuero', 'lana', 'plumas', 'impermeable', 'pana', 'jean', 'denim', 'termico', 'térmico'],
            'marcas': ['north face', 'columbia', 'zara', 'arturo calle', 'patagonia', 'chevignon', 'velez', 'moncler'],
            'genero': ['hombre', 'mujer', 'unisex', 'niño', 'niña'],
            'estilo': ['elegante', 'casual', 'oversize', 'largo', 'corto', 'con capota', 'invierno', 'nieve']
        }
    },
    {
        'id': 'camisetas-2026',
        'name': 'Camisetas, Polos & Moda Deportiva',
        'icon': '👕',
        'file': 'Keyword Stats 2026-10-01 at 20_39_04.csv',
        'keywords_json': 'keywords_camisetas_2026.json',
        'keywords_csv': 'keywords_camisetas_2026.csv',
        'clusters': {
            'camisetas': ['camiseta', 'remera', 'polera', 't-shirt', 'camisilla', 'esqueleto'],
            'polos': ['polo', 'cuello polo', 'camisa polo', 'chomba'],
            'futbol_deporte': ['futbol', 'fútbol', 'colombia', 'seleccion', 'real madrid', 'barcelona', 'messi', 'cristiano', 'nacional', 'millonarios', 'deportiva', 'running', 'gym'],
            'marcas': ['adidas', 'nike', 'puma', 'under armour', 'lacoste', 'tommy', 'ralph lauren', 'diesel', 'arturo calle'],
            'materiales': ['algodon', 'algodón', 'poliester', 'dri fit', 'oversize', 'estampada', 'basica', 'blanca', 'negra']
        }
    }
]

def parse_raw_tsv(filepath):
    items = []
    with open(filepath, 'r', encoding='utf-16') as fp:
        reader = csv.reader(fp, delimiter='\t')
        rows = list(reader)
        
    header_idx = -1
    for idx, r in enumerate(rows[:10]):
        if r and any('Keyword' in col for col in r):
            header_idx = idx
            break
            
    if header_idx == -1:
        return []
        
    for r in rows[header_idx+1:]:
        if not r or len(r) < 4:
            continue
        kw = r[0].strip()
        if not kw or kw.lower() in ['keyword', 'colombia', 'todo']:
            continue
        try:
            vol = int(float(r[3].replace(',', '').strip())) if r[3].strip() else 0
        except:
            vol = 0
            
        yoy = r[5].strip() if len(r) > 5 and r[5].strip() else '0%'
        comp = r[6].strip() if len(r) > 6 and r[6].strip() else 'Medio'
        
        items.append({
            'keyword': kw,
            'volume': vol,
            'yoy': yoy,
            'competition': comp
        })
    return items

def classify_keyword(item, cluster_defs):
    kw = item['keyword'].lower()
    assigned_cluster = 'general'
    
    for cluster_name, triggers in cluster_defs.items():
        if any(tr in kw for tr in triggers):
            assigned_cluster = cluster_name
            break
            
    # Intent classification
    yoy_val = 0
    try:
        yoy_val = int(re.sub(r'[^\d\-+]', '', item['yoy']))
    except:
        yoy_val = 0
        
    intent = 'general'
    mapping = 'Título Principal'
    
    if yoy_val >= 100 or '+5' in item['yoy'] or '+4' in item['yoy'] or '+2' in item['yoy']:
        intent = 'quickwin'
        mapping = '🚀 Quick Win / Módulo 7 (Pareja 1)'
    elif assigned_cluster == 'salud':
        intent = 'informacional'
        mapping = '🩺 Guía de Salud / FAQ IA'
    elif assigned_cluster == 'marcas':
        intent = 'marca'
        mapping = '🏷️ Competencia / Pareja 2'
    elif assigned_cluster in ['materiales', 'fajas', 'futbol_deporte', 'smartwatch']:
        intent = 'especifico'
        mapping = '🧱 Módulo 7 (Materiales / Innovación)'
    else:
        intent = 'transaccional'
        mapping = 'Módulo 7 (Ficha Técnica & Atributos)'

    return {
        'keyword': item['keyword'],
        'volume': item['volume'],
        'yoy': item['yoy'],
        'competition': item['competition'],
        'cluster': assigned_cluster,
        'intent': intent,
        'mapping': mapping
    }

def main():
    summary_report = []
    
    for cat in CATEGORIES:
        source_file = os.path.join(DATA_DIR, cat['file'])
        if not os.path.exists(source_file):
            print(f"Warning: file {source_file} does not exist.")
            continue
            
        raw_items = parse_raw_tsv(source_file)
        classified = [classify_keyword(item, cat['clusters']) for item in raw_items]
        
        # Sort by volume desc
        classified.sort(key=lambda x: x['volume'], reverse=True)
        
        total_vol = sum(x['volume'] for x in classified)
        total_kw = len(classified)
        quick_wins = [x for x in classified if x['intent'] == 'quickwin']
        
        # Save JSON in estudios-de-mercado/data/
        json_out = os.path.join(DATA_DIR, cat['keywords_json'])
        with open(json_out, 'w', encoding='utf-8') as f:
            json.dump(classified, f, ensure_ascii=False, indent=2)
            
        # Save JSON in market-research-service/src/data/
        service_json_out = os.path.join(OUTPUT_SERVICE_DATA_DIR, cat['keywords_json'])
        with open(service_json_out, 'w', encoding='utf-8') as f:
            json.dump(classified, f, ensure_ascii=False, indent=2)
            
        # Save CSV in estudios-de-mercado/data/
        csv_out = os.path.join(DATA_DIR, cat['keywords_csv'])
        with open(csv_out, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['keyword', 'volume', 'yoy', 'competition', 'cluster', 'intent', 'mapping'])
            for x in classified:
                writer.writerow([x['keyword'], x['volume'], x['yoy'], x['competition'], x['cluster'], x['intent'], x['mapping']])
                
        print(f"✓ Procesado {cat['name']}: {total_kw} keywords, {total_vol:,} búsquedas/mes, {len(quick_wins)} Quick Wins.")
        
        summary_report.append({
            'name': cat['name'],
            'id': cat['id'],
            'total_kw': total_kw,
            'total_vol': total_vol,
            'quick_wins': len(quick_wins),
            'top_quick_wins': quick_wins[:5],
            'top_keywords': classified[:5]
        })
        
    # Generate consolidate markdown report
    report_md = os.path.join(INFORMES_DIR, 'informe_estudios_mercado_multicategoria_2026.md')
    with open(report_md, 'w', encoding='utf-8') as f:
        f.write("# 📊 Informe Consolidado de Estudios de Mercado Multidimensional — Advantia CatalogAI\n\n")
        f.write("Dataset de Demanda Real en Colombia (Google Keyword Planner, Cobertura Histórica 2022 - 2026).\n\n")
        f.write("---\n\n")
        f.write("## 📈 Resumen Global de Categorías\n\n")
        f.write("| Categoría | Total Palabras Clave | Volumen Mensual COP | Quick Wins (YoY > 100%) |\n")
        f.write("|---|:---:|:---:|:---:|\n")
        for s in summary_report:
            f.write(f"| **{s['name']}** | {s['total_kw']} | {s['total_vol']:,} | {s['quick_wins']} |\n")
        f.write("\n---\n\n")
        
        for s in summary_report:
            f.write(f"## 🏆 {s['name']}\n\n")
            f.write(f"- **Total Keywords:** {s['total_kw']}\n")
            f.write(f"- **Demanda Total:** {s['total_vol']:,} búsquedas/mes\n\n")
            f.write("### 🚀 Top 5 Quick Wins (Aceleración Explosiva YoY):\n\n")
            for q in s['top_quick_wins']:
                f.write(f"- **{q['keyword']}** — {q['volume']:,} búsquedas/mes (`{q['yoy']}` YoY, Comp: {q['competition']})\n")
            f.write("\n### ⭐ Top 5 Palabras Clave de Máximo Volumen:\n\n")
            for k in s['top_keywords']:
                f.write(f"- **{k['keyword']}** — {k['volume']:,} búsquedas/mes (`{k['yoy']}` YoY)\n")
            f.write("\n---\n\n")

    print(f"\n✓ Informe consolidado generado en: {report_md}")

if __name__ == '__main__':
    main()
