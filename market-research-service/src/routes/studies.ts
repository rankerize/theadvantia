import { Hono } from 'hono';
import ollasData from '../data/keywords_ollas_sartenes_2026.json' with { type: 'json' };

export const studiesRoute = new Hono();

export interface KeywordItem {
  keyword: string;
  volume: number;
  yoy: string;
  competition: string;
  cluster?: string;
  intent?: string;
}

// 1. List available market studies
studiesRoute.get('/', (c) => {
  return c.json({
    status: 'success',
    studies: [
      {
        id: 'ollas-sartenes-2026',
        category: 'Ollas, Sartenes & Menaje de Cocina',
        market: 'Colombia (COP)',
        totalKeywords: ollasData.length,
        totalVolume: ollasData.reduce((acc, item) => acc + item.volume, 0),
        lastUpdated: '2026-10-01'
      }
    ]
  });
});

// 2. Query keywords by study category
studiesRoute.get('/:categoryId', (c) => {
  const categoryId = c.req.param('categoryId');
  const search = c.req.query('search')?.toLowerCase().trim() || '';
  const cluster = c.req.query('cluster') || 'all';
  const limit = parseInt(c.req.query('limit') || '500', 10);

  let dataset: KeywordItem[] = [];

  if (categoryId === 'ollas-sartenes-2026' || categoryId === 'ollas') {
    dataset = ollasData as KeywordItem[];
  } else {
    return c.json({ error: 'Estudio de mercado no encontrado' }, 404);
  }

  // Enrich with cluster and intent logic
  let filtered = dataset.map((item) => {
    const kw = item.keyword.toLowerCase();
    let itemCluster = 'sartenes';
    let intent = 'general';

    if (kw.includes('presion') || kw.includes('presión') || kw.includes('express') || kw.includes('pitadora')) {
      itemCluster = 'presion';
    } else if (kw.includes('arrocera') || kw.includes('vaporera')) {
      itemCluster = 'arroceras';
    } else if (kw.includes('bateria') || kw.includes('batería')) {
      itemCluster = 'baterias';
    } else if (kw.includes('multifuncional') || kw.includes('multichef') || kw.includes('airfryer') || kw.includes('air fryer')) {
      itemCluster = 'multifuncional';
    } else if (kw.includes('hierro') || kw.includes('barro') || kw.includes('vidrio') || kw.includes('peltre')) {
      itemCluster = 'hierro';
    } else if (kw.includes('toxico') || kw.includes('tóxico') || kw.includes('pfoa') || kw.includes('materiales')) {
      itemCluster = 'salud';
      intent = 'informacional';
    }

    if (item.yoy.includes('+5') || item.yoy.includes('+2') || item.yoy.includes('+4')) {
      intent = 'quickwin';
    } else if (kw.includes('imusa') || kw.includes('universal') || kw.includes('oster') || kw.includes('royal prestige')) {
      intent = 'especifico';
    }

    return {
      ...item,
      cluster: itemCluster,
      intent
    };
  });

  // Apply Filters
  if (cluster !== 'all') {
    filtered = filtered.filter(x => x.cluster === cluster || (cluster === 'quickwins' && x.intent === 'quickwin'));
  }

  if (search) {
    filtered = filtered.filter(x => x.keyword.toLowerCase().includes(search));
  }

  const resultList = filtered.slice(0, limit);
  const totalVol = resultList.reduce((acc, x) => acc + x.volume, 0);

  return c.json({
    status: 'success',
    categoryId,
    totalResults: filtered.length,
    returnedResults: resultList.length,
    totalVolume: totalVol,
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
      if (!kw || kw.toLowerCase().startsWith('keyword') || kw.toLowerCase() === 'colombia') continue;
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
