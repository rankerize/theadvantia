import { getFunctions, httpsCallable } from 'firebase/functions';
import * as XLSX from 'xlsx';
import { logUserActivity } from '/analytics.js';

// Ejecutor genérico de prompts (reusado del panel "Reescribir con IA" del módulo SEO On Page)
const REWRITE_FUNC_URL = 'https://generateseotitles-in7jw35npq-uc.a.run.app';

let rows = [];

function parseSkus() {
  const raw = document.getElementById('pdSkuInput')?.value || '';
  return raw.split(/[\n,;]+/).map(s => s.trim()).filter(s => /^\d{5,}$/.test(s));
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function setStatus(msg, type = '') {
  const el = document.getElementById('pdStatusSku');
  if (!el) return;
  el.textContent = msg;
  el.className = 'pd-status' + (type ? ` ${type}` : '');
  el.style.display = msg ? 'block' : 'none';
}

function show(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = '';
}

function hide(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

// Mismos clichés prohibidos que en el prompt de generación (functions/index.js) —
// si se cuelan de todas formas, este checklist los detecta antes de que el
// analista los pase por alto en la previsualización.
const BANNED_PHRASES = [
  'en conclusión', 'en resumen', 'excelente opción', 'gran variedad', 'potente',
  'robusto', 'innovador', 'ideal para el día a día', 'perfecto para cualquier ocasión',
];

// Checklist automático de calidad del HTML generado — detecta las causas más
// comunes de "se repite mucho" / "no es coherente" para que el analista sepa,
// de un vistazo, qué filas conviene mandar a "Reescribir" antes de publicar.
function analyzeContentQuality(row) {
  const html = row.newHtml || '';
  if (!html) return [];

  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const h2s = Array.from(tmp.querySelectorAll('h2')).map(h => h.textContent.trim()).filter(Boolean);
  const plainText = (tmp.innerText || tmp.textContent || '').toLowerCase();

  const issues = [];

  const fullLabel = `${row.productName || ''} ${row.brand || ''}`.trim().toLowerCase();
  if (fullLabel) {
    const repeats = h2s.filter(h => h.toLowerCase().includes(fullLabel)).length;
    if (repeats > 1) issues.push(`El nombre completo del producto se repite en ${repeats} encabezados`);
  }

  const foundBanned = BANNED_PHRASES.filter(b => plainText.includes(b));
  if (foundBanned.length) issues.push(`Clichés detectados: "${foundBanned.slice(0, 2).join('", "')}"`);

  const specValues = (row.specs || []).map(s => String(s.value || '').toLowerCase().trim()).filter(v => v.length > 2);
  const usedSpecs = specValues.filter(v => plainText.includes(v));
  if (specValues.length && usedSpecs.length < Math.min(2, specValues.length)) {
    issues.push('Usa pocas specs reales del producto (posible contenido genérico)');
  }

  const hasReviewsWithText = (row.bvReviews || []).some(r => r.text && r.text.length > 10);
  if (hasReviewsWithText && !/<blockquote/i.test(html)) {
    issues.push('Hay reseñas reales con texto pero ninguna se citó');
  }

  const uniqueH2 = new Set(h2s.map(h => h.toLowerCase()));
  if (h2s.length > uniqueH2.size) issues.push('Hay encabezados H2 duplicados exactos');

  return issues;
}

export function initProductDescription() {
  const textarea = document.getElementById('pdSkuInput');
  const counter = document.getElementById('pdSkuCount');
  if (!textarea) return;

  textarea.addEventListener('input', () => {
    const count = parseSkus().length;
    if (counter) {
      counter.textContent = `${count} SKU(s) detectado(s)`;
      counter.style.display = count ? '' : 'none';
    }
  });

  document.getElementById('pdBtnAnalyze')?.addEventListener('click', handleAnalyze);
  document.getElementById('pdBtnGenerateSelected')?.addEventListener('click', handleGenerateSelected);
  document.getElementById('pdBtnDownload')?.addEventListener('click', handleDownload);
}

async function handleAnalyze() {
  const skus = parseSkus();
  if (!skus.length) { alert('No se encontraron SKUs válidos (numéricos, mínimo 5 dígitos).'); return; }

  rows = skus.map(sku => ({
    sku, productName: '', brand: '', specs: [], imageUrls: [],
    bvReviews: [], totalReviews: 0, avgRating: '0',
    oldHtml: '', newHtml: '', status: 'analyzing', selected: true
  }));
  renderTable();
  show('pdBtnGenerateSelected');
  setStatus('Analizando SKUs...');

  const functions = getFunctions();
  const scrapePDP = httpsCallable(functions, 'scrapePDPData');

  await Promise.all(rows.map(async (row, i) => {
    try {
      const { data } = await scrapePDP({ sku: row.sku });
      if (data.success) {
        rows[i] = {
          ...rows[i],
          productName: data.productName || '',
          brand: data.brand || '',
          specs: data.specs || [],
          // El backend devuelve "reviews" (no "bvReviews") y "oldHtml" — antes se
          // perdían silenciosamente aquí porque los nombres no coincidían.
          bvReviews: data.reviews || [],
          oldHtml: rows[i].oldHtml || data.oldHtml || '',
          totalReviews: data.totalReviews || 0,
          avgRating: data.avgRating || '0',
          imageUrls: Array.from({ length: 4 }, (_, n) =>
            `https://media.falabella.com/falabellaCO/${row.sku}_${n + 1}/w=800,h=800,fit=pad`),
          status: 'ready',
        };
      } else {
        rows[i].status = 'error';
        rows[i].productName = data.error || 'Error al analizar';
      }
    } catch (err) {
      rows[i].status = 'error';
      rows[i].productName = err.message;
    }
    renderTable();
  }));

  setStatus('Análisis completado. Selecciona los SKUs y haz clic en Generar HTML.');
}

async function handleGenerateSelected() {
  const selected = rows.filter(r => r.selected && (r.status === 'ready' || r.status === 'done'));
  if (!selected.length) { alert('No hay SKUs listos para generar.'); return; }

  logUserActivity('GENERATE_PRODUCT_DESCRIPTION', { productsCount: selected.length });
  setStatus('Generando HTML...');

  const functions = getFunctions();
  const generateHtml = httpsCallable(functions, 'generateProductHtml');

  for (const row of selected) {
    const i = rows.findIndex(r => r.sku === row.sku);
    rows[i].status = 'generating';
    renderTable();
    try {
      const { data } = await generateHtml({
        mode: 'sku',
        productName: row.productName,
        brand: row.brand,
        specs: row.specs,
        imageUrls: row.imageUrls,
        reviews: row.bvReviews,
        reviewStats: { totalReviews: row.totalReviews, avgRating: row.avgRating },
        oldHtml: row.oldHtml || '',
      });
      if (data.success) {
        rows[i].newHtml = data.html || '';
        rows[i].status = 'done';
      } else {
        rows[i].status = 'error';
      }
    } catch (err) {
      rows[i].status = 'error';
    }
    renderTable();
  }
  show('pdBtnDownload');
  setStatus('Revisa el HTML generado en la tabla.');
}

// Reescribe el HTML ya generado de una fila para corregir repetición/coherencia,
// sin tocar datos reales (specs, reseñas, JSON-LD). Usa el mismo ejecutor de
// prompts que el panel "Reescribir con IA" del módulo SEO On Page.
async function rewriteRow(i) {
  const row = rows[i];
  if (!row || !row.newHtml) return;

  const previousStatus = row.status;
  rows[i].status = 'generating';
  renderTable();

  const prompt = `Reescribe el siguiente HTML de "Información Adicional" de un producto de Falabella Colombia. El objetivo es reducir la repetición y mejorar la coherencia, SIN inventar ni cambiar datos.

PROBLEMA A CORREGIR:
- La marca "${row.brand}" y/o el nombre "${row.productName}" aparecen repetidos en casi todos los H2. Úsalos completos como máximo 1 vez, en el primer H2. En el resto de encabezados usa sinónimos, la categoría del producto o la keyword específica de esa sección — NO repitas literalmente "${row.productName} ${row.brand}".
- Evita frases casi idénticas entre secciones (ej: no repitas "compradores verificados" más de una vez).
- Varía la estructura de las oraciones — no empieces dos párrafos con la misma construcción.
- PROHIBIDO usar: "en conclusión", "en resumen", "excelente opción", "gran variedad", "potente", "robusto", "innovador", "ideal para el día a día", "perfecto para cualquier ocasión".

REGLAS QUE NO PUEDES ROMPER:
1. NO cambies ni un solo dato: specs, cifras, reseñas citadas textualmente, ni el bloque <script type="application/ld+json"> — cópialo EXACTO tal como está, sin tocar una coma.
2. NO agregues ni quites secciones ni imágenes — mismo número de bloques, mismos src de imagen.
3. NO uses H1.
4. NO agregues estilos inline de color ni tipografía — solo las clases ya existentes (pdp-row, pdp-reverse, pdp-txt, pdp-hero).
5. Responde ÚNICAMENTE con un objeto JSON de la forma {"html": "<el HTML completo reescrito>"}, sin markdown ni texto adicional.

HTML ACTUAL:
${row.newHtml}`;

  try {
    const res = await fetch(REWRITE_FUNC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, category: `PDP rewrite - SKU ${row.sku}` }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Error HTTP ${res.status}`);
    const newHtml = data.html || data.promotionalText || data.text ||
      Object.values(data).find(v => typeof v === 'string' && v.length > 50);
    if (!newHtml) throw new Error('La IA no devolvió HTML válido.');

    rows[i].newHtml = newHtml;
    rows[i].status = 'done';
    renderTable();
    showHtmlPreview(rows[i]);
    setStatus(`SKU ${row.sku} reescrito. Revisa la previsualización.`);
  } catch (err) {
    rows[i].status = previousStatus;
    renderTable();
    setStatus(`Error al reescribir SKU ${row.sku}: ${err.message}`, 'error');
  }
}

function handleDownload() {
  const data = rows.map(r => ({
    SKU: r.sku,
    Producto: r.productName,
    Marca: r.brand,
    'HTML Nuevo': r.newHtml,
    'HTML Anterior': r.oldHtml,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [{ wch: 14 }, { wch: 45 }, { wch: 16 }, { wch: 90 }, { wch: 90 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Contenido PDP');
  XLSX.writeFile(wb, `contenido-pdp-${Date.now()}.xlsx`);
}

function renderTable() {
  const container = document.getElementById('pdSkuTableWrap');
  if (!container) return;
  container.style.display = '';

  const statusColor = { ready: '#10b981', done: '#3b82f6', analyzing: '#f59e0b', generating: '#8b5cf6', error: '#ef4444' };
  const statusLabel = { ready: 'Listo', done: 'Generado', analyzing: 'Analizando...', generating: 'Generando...', error: 'Error' };

  container.innerHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:0.88rem;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="padding:8px;text-align:left;"><input type="checkbox" id="pdCheckAll" onchange="window._pdToggleAll(this.checked)" /></th>
          <th style="padding:8px;text-align:left;">SKU</th>
          <th style="padding:8px;text-align:left;">Producto</th>
          <th style="padding:8px;text-align:left;">Marca</th>
          <th style="padding:8px;text-align:left;">Specs</th>
          <th style="padding:8px;text-align:left;">Bazaarvoice</th>
          <th style="padding:8px;text-align:left;">HTML Anterior</th>
          <th style="padding:8px;text-align:left;">HTML Nuevo</th>
          <th style="padding:8px;text-align:left;">Estado</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((r, i) => `
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:8px;">
              <input type="checkbox" ${r.status === 'ready' || r.status === 'done' ? '' : 'disabled'}
                ${r.selected ? 'checked' : ''} onchange="window._pdToggleRow(${i}, this.checked)" />
            </td>
            <td style="padding:8px;font-weight:600;">${escHtml(r.sku)}</td>
            <td style="padding:8px;">${escHtml(r.productName)}</td>
            <td style="padding:8px;">${escHtml(r.brand)}</td>
            <td style="padding:8px;">${r.specs.length}</td>
            <td style="padding:8px;font-size:0.82rem;">
              ${Number(r.totalReviews) > 0
                ? `⭐ ${escHtml(r.avgRating)} <span style="color:#94a3b8;">(${r.totalReviews})</span>` +
                  (r.bvReviews.length ? `<br><span style="color:#64748b;">${r.bvReviews.length} con texto</span>` : `<br><span style="color:#94a3b8;">sin texto</span>`)
                : '<span style="color:#94a3b8;">Sin reseñas</span>'}
            </td>
            <td style="padding:8px;">
              <textarea rows="3" style="width:180px;font-size:0.8rem;"
                onchange="window._pdSetOld(${i}, this.value)">${escHtml(r.oldHtml)}</textarea>
            </td>
            <td style="padding:8px;">
              ${r.newHtml
                ? (() => {
                    const issues = analyzeContentQuality(r);
                    return `<div style="display:flex;gap:6px;flex-wrap:wrap;">
                     <button onclick="window._pdPreviewNew(${i})" style="font-size:0.8rem;padding:4px 8px;border-radius:6px;border:1px solid #ddd6fe;background:#f5f3ff;color:#6d28d9;cursor:pointer;">👁️ Ver previsualización</button>
                     <button data-copy-btn="${i}" onclick="window._pdCopyNew(${i})" style="font-size:0.8rem;padding:4px 8px;border-radius:6px;border:1px solid #e2e8f0;cursor:pointer;">📋 Copiar HTML</button>
                     <button data-rewrite-btn="${i}" onclick="window._pdRewrite(${i})" style="font-size:0.8rem;padding:4px 8px;border-radius:6px;border:1px solid #fbbf24;background:#fffbeb;color:#92400e;cursor:pointer;">🔄 Reescribir</button>
                   </div>
                   ${issues.length
                      ? `<div style="margin-top:5px;font-size:0.68rem;color:#b45309;cursor:help;" title="${escHtml(issues.join(' · '))}">⚠️ ${issues.length} problema${issues.length > 1 ? 's' : ''} detectado${issues.length > 1 ? 's' : ''}</div>`
                      : `<div style="margin-top:5px;font-size:0.68rem;color:#16a34a;">✅ Sin problemas detectados</div>`}`;
                  })()
                : '—'}
            </td>
            <td style="padding:8px;">
              <span style="color:${statusColor[r.status] || '#888'};font-weight:600;">
                ● ${statusLabel[r.status] || r.status}
              </span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  window._pdToggleAll = (checked) => { rows.forEach((r, i) => { if (r.status === 'ready' || r.status === 'done') rows[i].selected = checked; }); renderTable(); };
  window._pdToggleRow = (i, checked) => { rows[i].selected = checked; };
  window._pdSetOld = (i, val) => { rows[i].oldHtml = val; };
  window._pdCopyNew = (i) => {
    navigator.clipboard.writeText(rows[i].newHtml);
    const btn = container.querySelector(`[data-copy-btn="${i}"]`);
    if (btn) { const original = btn.textContent; btn.textContent = '✅ Copiado'; setTimeout(() => { btn.textContent = original; }, 2000); }
  };
  window._pdPreviewNew = (i) => showHtmlPreview(rows[i]);
  window._pdRewrite = (i) => rewriteRow(i);
}

// ── Modal de previsualización del HTML generado ──────────────────────────
function ensurePreviewModal() {
  let modal = document.getElementById('pdPreviewModal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'pdPreviewModal';
  modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(15,23,42,0.6);z-index:9999;align-items:center;justify-content:center;padding:2rem;';
  modal.innerHTML = `
    <div style="background:white;border-radius:14px;width:100%;max-width:900px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;border-bottom:1px solid #e2e8f0;">
        <strong id="pdPreviewTitle" style="font-size:0.95rem;color:#1e293b;">Previsualización</strong>
        <div style="display:flex;gap:8px;align-items:center;">
          <span id="pdPreviewEditHint" style="display:none;font-size:0.72rem;color:#7c3aed;">Haz clic en el texto para editarlo</span>
          <button id="pdPreviewEditToggle" style="border:1px solid #ddd6fe;background:#f5f3ff;color:#6d28d9;padding:5px 12px;border-radius:8px;cursor:pointer;font-size:0.8rem;font-weight:700;">✏️ Editar</button>
          <button id="pdPreviewClose" style="border:none;background:#f1f5f9;color:#475569;width:28px;height:28px;border-radius:8px;cursor:pointer;font-size:0.9rem;">✕</button>
        </div>
      </div>
      <iframe id="pdPreviewIframe" style="flex:1;border:none;width:100%;min-height:400px;background:white;"></iframe>
    </div>
  `;
  document.body.appendChild(modal);

  const editBtn = modal.querySelector('#pdPreviewEditToggle');
  const editHint = modal.querySelector('#pdPreviewEditHint');

  const setEditMode = (on) => {
    const iframe = document.getElementById('pdPreviewIframe');
    const doc = iframe?.contentDocument;
    if (doc?.body) {
      doc.body.contentEditable = on ? 'true' : 'false';
      doc.body.style.outline = on ? '2px dashed #7c3aed' : 'none';
      doc.body.style.outlineOffset = on ? '-2px' : '0';
    }
    editBtn.textContent = on ? '💾 Guardar cambios' : '✏️ Editar';
    editBtn.dataset.editing = on ? 'true' : 'false';
    editHint.style.display = on ? 'inline' : 'none';
  };

  const saveEdits = () => {
    const iframe = document.getElementById('pdPreviewIframe');
    const doc = iframe?.contentDocument;
    const sku = modal.dataset.currentSku;
    if (!doc?.body || !sku) return;
    const i = rows.findIndex(r => r.sku === sku);
    if (i === -1) return;
    rows[i].newHtml = doc.body.innerHTML.trim();
    renderTable();
    setStatus(`✅ Cambios guardados para SKU ${sku} desde la previsualización.`);
  };

  editBtn.addEventListener('click', () => {
    if (editBtn.dataset.editing === 'true') { saveEdits(); setEditMode(false); }
    else setEditMode(true);
  });

  const close = () => {
    // Si había ediciones sin guardar, se guardan al cerrar para no perderlas.
    if (editBtn.dataset.editing === 'true') saveEdits();
    setEditMode(false);
    modal.style.display = 'none';
  };
  modal.querySelector('#pdPreviewClose').addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.style.display !== 'none') close(); });

  modal._pdSetEditMode = setEditMode;
  return modal;
}

function showHtmlPreview(row) {
  const modal = ensurePreviewModal();
  modal.dataset.currentSku = row.sku;
  modal._pdSetEditMode(false); // siempre abre en modo lectura
  const title = document.getElementById('pdPreviewTitle');
  const iframe = document.getElementById('pdPreviewIframe');
  if (title) title.textContent = `Previsualización — ${row.sku}${row.productName ? ' · ' + row.productName : ''}`;
  if (iframe) {
    iframe.srcdoc = `<!doctype html><html><head><meta charset="utf-8">
      <style>body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;padding:24px;color:#1e293b;line-height:1.5;max-width:760px;margin:0 auto;} img{max-width:100%;}</style>
      </head><body>${row.newHtml || '<p style="color:#94a3b8;">Sin HTML generado todavía.</p>'}</body></html>`;
  }
  modal.style.display = 'flex';
}
