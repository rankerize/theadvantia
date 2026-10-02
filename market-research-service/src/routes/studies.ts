import { Hono } from 'hono';
import ollasData from '../data/keywords_ollas_sartenes_2026.json' with { type: 'json' };
import relojesData from '../data/keywords_relojes_2026.json' with { type: 'json' };
import lenceriaData from '../data/keywords_lenceria_2026.json' with { type: 'json' };
import abrigosData from '../data/keywords_abrigos_2026.json' with { type: 'json' };
import camisetasData from '../data/keywords_camisetas_2026.json' with { type: 'json' };

export const studiesRoute = new Hono();

export interface KeywordItem {
  keyword: string;
  volume: number;
  yoy: string;
  competition: string;
  cluster?: string;
  intent?: string;
  mapping?: string;
}

const CATEGORY_MAP: Record<string, { name: string; icon: string; data: KeywordItem[] }> = {
  'ollas-sartenes-2026': { name: 'Ollas, Sartenes & Menaje de Cocina', icon: '🍲', data: ollasData as KeywordItem[] },
  'ollas': { name: 'Ollas, Sartenes & Menaje de Cocina', icon: '🍲', data: ollasData as KeywordItem[] },
  'relojes-2026': { name: 'Relojes & Accesorios Hombre/Mujer', icon: '⌚', data: relojesData as KeywordItem[] },
  'relojes': { name: 'Relojes & Accesorios Hombre/Mujer', icon: '⌚', data: relojesData as KeywordItem[] },
  'lenceria-2026': { name: 'Lencería, Brasieres & Ropa Interior', icon: '👙', data: lenceriaData as KeywordItem[] },
  'lenceria': { name: 'Lencería, Brasieres & Ropa Interior', icon: '👙', data: lenceriaData as KeywordItem[] },
  'abrigos-2026': { name: 'Abrigos, Chaquetas & Ropa de Invierno', icon: '🧥', data: abrigosData as KeywordItem[] },
  'abrigos': { name: 'Abrigos, Chaquetas & Ropa de Invierno', icon: '🧥', data: abrigosData as KeywordItem[] },
  'camisetas-2026': { name: 'Camisetas, Polos & Moda Deportiva', icon: '👕', data: camisetasData as KeywordItem[] },
  'camisetas': { name: 'Camisetas, Polos & Moda Deportiva', icon: '👕', data: camisetasData as KeywordItem[] },
};

// 1. List available market studies
studiesRoute.get('/', (c) => {
  const studies = [
    {
      id: 'ollas-sartenes-2026',
      category: 'Ollas, Sartenes & Menaje de Cocina',
      icon: '🍲',
      market: 'Colombia (COP)',
      totalKeywords: ollasData.length,
      totalVolume: ollasData.reduce((acc, item) => acc + item.volume, 0),
      period: 'Sep 2022 - Ago 2026 (4 Años)',
      lastUpdated: '2026-10-01'
    },
    {
      id: 'relojes-2026',
      category: 'Relojes & Accesorios Hombre/Mujer',
      icon: '⌚',
      market: 'Colombia (COP)',
      totalKeywords: relojesData.length,
      totalVolume: relojesData.reduce((acc, item) => acc + item.volume, 0),
      period: 'Sep 2022 - Ago 2026 (4 Años)',
      lastUpdated: '2026-10-01'
    },
    {
      id: 'lenceria-2026',
      category: 'Lencería, Brasieres & Ropa Interior',
      icon: '👙',
      market: 'Colombia (COP)',
      totalKeywords: lenceriaData.length,
      totalVolume: lenceriaData.reduce((acc, item) => acc + item.volume, 0),
      period: 'Sep 2022 - Ago 2026 (4 Años)',
      lastUpdated: '2026-10-01'
    },
    {
      id: 'abrigos-2026',
      category: 'Abrigos, Chaquetas & Ropa de Invierno',
      icon: '🧥',
      market: 'Colombia (COP)',
      totalKeywords: abrigosData.length,
      totalVolume: abrigosData.reduce((acc, item) => acc + item.volume, 0),
      period: 'Sep 2022 - Ago 2026 (4 Años)',
      lastUpdated: '2026-10-01'
    },
    {
      id: 'camisetas-2026',
      category: 'Camisetas, Polos & Moda Deportiva',
      icon: '👕',
      market: 'Colombia (COP)',
      totalKeywords: camisetasData.length,
      totalVolume: camisetasData.reduce((acc, item) => acc + item.volume, 0),
      period: 'Sep 2022 - Ago 2026 (4 Años)',
      lastUpdated: '2026-10-01'
    }
  ];

  return c.json({
    status: 'success',
    totalStudies: studies.length,
    studies
  });
});

// 2. Query keywords by study category
studiesRoute.get('/:categoryId', (c) => {
  const categoryId = c.req.param('categoryId').toLowerCase();
  const search = c.req.query('search')?.toLowerCase().trim() || '';
  const cluster = c.req.query('cluster') || 'all';
  const limit = parseInt(c.req.query('limit') || '1000', 10);

  const entry = CATEGORY_MAP[categoryId];
  if (!entry) {
    return c.json({ error: 'Estudio de mercado no encontrado. Categorías válidas: ollas-sartenes-2026, relojes-2026, lenceria-2026, abrigos-2026, camisetas-2026' }, 404);
  }

  let filtered = entry.data;

  // Apply Cluster Filter
  if (cluster !== 'all') {
    filtered = filtered.filter(x => x.cluster === cluster || (cluster === 'quickwins' && x.intent === 'quickwin'));
  }

  // Apply Search Filter
  if (search) {
    filtered = filtered.filter(x => x.keyword.toLowerCase().includes(search));
  }

  const resultList = filtered.slice(0, limit);
  const totalVol = resultList.reduce((acc, x) => acc + x.volume, 0);
  const quickWins = resultList.filter(x => x.intent === 'quickwin');

  return c.json({
    status: 'success',
    categoryId,
    categoryName: entry.name,
    icon: entry.icon,
    totalResults: filtered.length,
    returnedResults: resultList.length,
    totalVolume: totalVol,
    quickWinsCount: quickWins.length,
    data: resultList
  });
});

// 3. Analyze raw Keyword Planner / SEMrush text import
studiesRoute.post('/analyze', async (c) => {
  const body = await c.req.json<{ rawText: string; categoryName?: string }>();
  if (!body.rawText) {
    return c.json({ error: 'Campo rawText es requerido' }, 400);
  }

  const lines = body.rawText.trim().split('\n');
  const items: KeywordItem[] = [];

  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length >= 4) {
      const kw = parts[0].trim();
      if (!kw || kw.toLowerCase().startsWith('keyword') || kw.toLowerCase() === 'colombia' || kw.toLowerCase() === 'todo') continue;
      const vol = parseInt(parts[3].replace(/,/g, ''), 10) || 0;
      const yoy = parts[5] ? parts[5].trim() : '0%';
      const comp = parts[6] ? parts[6].trim() : 'Alto';
      items.push({ keyword: kw, volume: vol, yoy, competition: comp });
    }
  }

  items.sort((a, b) => b.volume - a.volume);
  const totalVolume = items.reduce((acc, x) => acc + x.volume, 0);
  const quickWins = items.filter(x => x.yoy.startsWith('+') && parseInt(x.yoy) >= 50);

  return c.json({
    status: 'success',
    categoryName: body.categoryName || 'Estudio Personalizado',
    totalKeywords: items.length,
    totalVolume,
    quickWinsCount: quickWins.length,
    quickWins: quickWins.slice(0, 10),
    top10Keywords: items.slice(0, 10)
  });
});
