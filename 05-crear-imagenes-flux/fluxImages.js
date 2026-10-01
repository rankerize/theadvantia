import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp, where } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { logUserActivity } from '/analytics.js';

const ADMIN_EMAIL = 'rankerize@gmail.com';
const FLUX_JOB_CREATE_URL = 'https://us-central1-falabella-suite.cloudfunctions.net/fluxJobCreate';
const FLUX_JOB_STATUS_URL = 'https://us-central1-falabella-suite.cloudfunctions.net/fluxJobStatus';
const FLUX_WORKER_STATUS_URL = 'https://us-central1-falabella-suite.cloudfunctions.net/fluxWorkerStatus';

const CDN_COUNTRY = { co: 'falabellaCO', cl: 'falabellaCL', pe: 'falabellaPE' };

// Genera URLs candidatas en ambos formatos: _01 (marketplace) y _1 (Falabella propio)
function getProductImageUrls(sku, country, count = 3) {
  const store = CDN_COUNTRY[country] || 'falabellaCO';
  const base = `https://media.falabella.com/${store}`;
  const padded   = Array.from({ length: count }, (_, i) => `${base}/${sku}_${String(i + 1).padStart(2, '0')}/w=800,h=800,fit=pad`);
  const unpadded = Array.from({ length: count }, (_, i) => `${base}/${sku}_${i + 1}/w=800,h=800,fit=pad`);
  // devuelve todas las candidatas (deduplicadas por si count=1 y _1 === _01)
  return [...new Set([...padded, ...unpadded])];
}

// Parsea SKU numérico o URL completa de Falabella
// Soporta: "73038694" o "https://www.falabella.com.co/falabella-co/product/145748659/Nombre/145748660"
function parseProductInput(input) {
  const trimmed = input.trim();
  // Solo número = skuId directo
  if (/^\d{4,}$/.test(trimmed)) return { skuId: trimmed, productId: null };
  try {
    const url = new URL(trimmed);
    if (!url.hostname.toLowerCase().includes('falabella.com')) return null;
    const segments = url.pathname.split('/').filter(Boolean).map((segment) => {
      try { return decodeURIComponent(segment); } catch { return segment; }
    });
    const productIndex = segments.findIndex((segment) => segment.toLowerCase() === 'product');
    if (productIndex >= 0) {
      const numericIds = segments.slice(productIndex + 1).filter((segment) => /^\d+$/.test(segment));
      if (numericIds.length) {
        return {
          productId: numericIds[0],
          skuId: numericIds[numericIds.length - 1],
        };
      }
    }
  } catch {}
  return null;
}

function readBlobAsBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ b64: reader.result.split(',')[1], mime: blob.type || 'image/jpeg' });
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function convertBlobToJpeg(blob) {
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('No se pudo decodificar la imagen'));
      element.src = objectUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    if (!canvas.width || !canvas.height) throw new Error('Imagen sin dimensiones válidas');
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    return { b64: dataUrl.split(',')[1], mime: 'image/jpeg' };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function blobToFluxImage(blob) {
  const mime = (blob.type || '').toLowerCase();
  if (mime === 'image/webp' || mime === 'image/avif' || mime === 'image/jxl') {
    return convertBlobToJpeg(blob);
  }
  return readBlobAsBase64(blob);
}

async function urlToBase64(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`No se pudo descargar imagen (${resp.status})`);
  return blobToFluxImage(await resp.blob());
}

function fileToBase64(file) {
  return blobToFluxImage(file);
}

async function callFlux(payload) {
  const user = getAuth(getApp()).currentUser || window.currentUser;
  if (!user?.uid || typeof user.getIdToken !== 'function') throw new Error('LOGIN_REQUIRED');
  const token = await user.getIdToken();
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const createResponse = await fetch(FLUX_JOB_CREATE_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ payload }),
  });
  const created = await createResponse.json().catch(() => ({}));
  if (!createResponse.ok || !created.jobId) throw new Error(created.error || `Error ${createResponse.status}`);

  const deadline = Date.now() + 150000;
  while (Date.now() < deadline) {
    const statusResponse = await fetch(FLUX_JOB_STATUS_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ jobId: created.jobId }),
    });
    const job = await statusResponse.json().catch(() => ({}));
    if (!statusResponse.ok) throw new Error(job.error || `Error ${statusResponse.status}`);
    if (job.status === 'completed') return job.result;
    if (job.status === 'failed') {
      if (job.error === 'ATENEA_LOGIN_REQUIRED') throw new Error('SESSION_EXPIRED');
      throw new Error(job.error || 'No fue posible generar la imagen.');
    }
    await new Promise(resolve => setTimeout(resolve, 1200));
  }
  throw new Error('FLUX_JOB_TIMEOUT');
}

function initLightbox() {
  const lb = document.getElementById('fluxLightbox');
  if (!lb) return;
  const closeBtn = document.getElementById('fluxLightboxClose');
  if (closeBtn) closeBtn.addEventListener('click', () => lb.style.display = 'none');
  lb.addEventListener('click', (e) => { if (e.target === lb) lb.style.display = 'none'; });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') lb.style.display = 'none'; });
}

function openLightbox(url, downloadUrl, fname) {
  const lb = document.getElementById('fluxLightbox');
  if (!lb) return;
  const img = document.getElementById('fluxLightboxImg');
  if (img) img.src = url;
  const dl = document.getElementById('fluxLightboxDownload');
  if (dl) {
    dl.href = downloadUrl;
    dl.download = fname;
  }
  lb.style.display = 'flex';
}

function getDb() {
  return getFirestore(getApp());
}

async function logGeneration({ skus, imageCount, mode, country, aspectRatio }) {
  try {
    const user = window.currentUser;
    if (!user) return;
    const db = getDb();
    await addDoc(collection(db, 'flux_logs'), {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email,
      skus: Array.isArray(skus) ? skus : [skus],
      skuCount: Array.isArray(skus) ? skus.length : 1,
      imageCount,
      mode,
      country,
      aspectRatio,
      ts: serverTimestamp(),
    });
  } catch(e) { /* silencioso */ }
}

export function initFluxImages() {
  const section = document.getElementById('view-flux-images');
  if (!section) return;

  initLightbox();

  // ── Verificación de conexión al iniciar ───────────────────────────────
  function waitForRole(timeout = 4000) {
    if (window.currentUserRole !== undefined) return Promise.resolve();
    return new Promise(resolve => {
      const deadline = Date.now() + timeout;
      (function poll() {
        if (window.currentUserRole !== undefined || Date.now() >= deadline) return resolve();
        setTimeout(poll, 80);
      })();
    });
  }

  async function checkConnection(retries = 2) {
    try {
      const user = getAuth(getApp()).currentUser || window.currentUser;
      if (!user?.getIdToken) throw new Error('LOGIN_REQUIRED');
      const response = await fetch(FLUX_WORKER_STATUS_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      });
      const data = await response.json().catch(() => ({}));
      setConnectionStatus(response.ok && data.connected === true);
    } catch (err) {
      console.warn('[FluxImages] Worker status error:', err.message);
      if (retries > 0) {
        setTimeout(() => checkConnection(retries - 1), 2000);
      } else {
        setConnectionStatus(false);
      }
    }
  }

  // ── Botón OAuth: Iniciar sesión en Atenea ─────────────────────────────
  const ateneaSaveBtn = document.getElementById('fluxAteneaSaveBtn');
  if (ateneaSaveBtn) {
    ateneaSaveBtn.style.display = 'none';
  }

  const ateneaClearBtn = document.getElementById('fluxAteneaClearBtn');
  if (ateneaClearBtn) {
    ateneaClearBtn.style.display = 'none';
  }

  // ── Detectar retorno desde OAuth (atenea_session / atenea_error) ──────
  const urlParams = new URLSearchParams(window.location.search);
  const ateneaSession = urlParams.get('atenea_session');
  const ateneaError   = urlParams.get('atenea_error');
  if (ateneaSession || ateneaError) {
    history.replaceState(null, '', window.location.origin + window.location.pathname + window.location.hash);
    const statusEl = document.getElementById('fluxAteneaStatus');
    if (ateneaError) {
      waitForRole().then(() => setConnectionStatus(false));
      if (statusEl) statusEl.textContent = `❌ Error al conectar: ${ateneaError}. Intenta de nuevo.`;
    } else {
      localStorage.setItem('atenea_primary', '1');
      if (statusEl) statusEl.textContent = '✅ Sesión de Atenea actualizada correctamente.';
      waitForRole().then(() => checkConnection());
    }
  } else {
    // Para no-admins: mostrar badge verde de inmediato (optimista).
    // Si la generación falla, setConnectionStatus(false, {fromGeneration:true}) mostrará el error real.
    // El check real confirma o corrige el estado para admins.
    waitForRole().then(() => {
      const isAdmin = window.currentUserRole === 'full';
      if (!isAdmin) {
        setConnectionStatus(true);
      }
      checkConnection();
    });
  }

  // ── Re-chequeo periódico de conexión ───────────────────────────────────
  // El chequeo inicial solo corre una vez al cargar la pestaña. Si el worker
  // central estaba apagado en ese momento y luego se prende, el badge se
  // quedaba en rojo indefinidamente hasta que el usuario recargara la página.
  // Este intervalo lo vuelve a verificar solo para que el badge se autocorrija.
  let connectionCheckInterval = null;
  function startPeriodicConnectionCheck(intervalMs = 30000) {
    if (connectionCheckInterval) clearInterval(connectionCheckInterval);
    connectionCheckInterval = setInterval(() => {
      waitForRole().then(() => checkConnection(0));
    }, intervalMs);
  }
  startPeriodicConnectionCheck();

  // ── Variables de tracking para historial y naming ──────────────────────
  let lastPrompt = '';
  let lastAspectRatio = '1:1';
  let lastOriginalImgUrl = null;

  // ── Historial de generaciones ──────────────────────────────────────────
  const HISTORY_KEY = 'flux_history';
  const MAX_HISTORY = 20;

  function getHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
  }

  function saveToHistory({ sku, prompt, aspectRatio, b64, mimeType, fname }) {
    try {
      const h = getHistory();
      h.unshift({ sku, prompt, aspectRatio, b64, mimeType, fname, ts: Date.now() });
      localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, MAX_HISTORY)));
    } catch(e) {}
    renderHistoryPanel();
  }

  function renderHistoryPanel() {
    const panel = document.getElementById('fluxHistoryList');
    const countEl = document.getElementById('fluxHistoryCount');
    if (!panel) return;
    const history = getHistory();
    if (countEl) countEl.textContent = history.length;
    if (!history.length) {
      panel.innerHTML = '<p style="color:#94a3b8;font-size:0.8rem;text-align:center;padding:1rem;margin:0;">Las generaciones aparecerán aquí</p>';
      return;
    }
    panel.innerHTML = history.map((entry, i) => {
      const url = `data:${entry.mimeType};base64,${entry.b64}`;
      const date = new Date(entry.ts).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
      return `
        <div style="display:flex;gap:0.6rem;align-items:center;padding:0.5rem 0.6rem;border-radius:9px;background:#f8fafc;border:1px solid #e2e8f0;cursor:pointer;"
             onclick="window.fluxHistoryOpen(${i})" onmouseenter="this.style.borderColor='#a5b4fc'" onmouseleave="this.style.borderColor='#e2e8f0'">
          <img src="${url}" style="width:46px;height:46px;border-radius:7px;object-fit:contain;background:white;border:1px solid #e2e8f0;flex-shrink:0;">
          <div style="min-width:0;flex:1;">
            <div style="font-size:0.8rem;font-weight:700;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${entry.sku}</div>
            <div style="font-size:0.7rem;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${entry.prompt || 'Sin prompt'}</div>
            <div style="font-size:0.66rem;color:#94a3b8;margin-top:1px;">${entry.aspectRatio || ''} · ${date}</div>
          </div>
          <a href="${url}" download="${entry.fname}" style="flex-shrink:0;background:#eef2ff;color:#6366f1;border:none;border-radius:7px;padding:4px 8px;font-size:0.72rem;font-weight:700;text-decoration:none;" onclick="event.stopPropagation()">⬇</a>
        </div>`;
    }).join('');
  }

  window.fluxHistoryOpen = (i) => {
    const h = getHistory();
    if (!h[i]) return;
    const e = h[i];
    openLightbox(`data:${e.mimeType};base64,${e.b64}`, `data:${e.mimeType};base64,${e.b64}`, e.fname);
  };

  window.fluxHistoryClear = () => {
    if (!confirm('¿Limpiar historial de generaciones?')) return;
    localStorage.removeItem(HISTORY_KEY);
    renderHistoryPanel();
  };

  renderHistoryPanel();

  // ── Comparador antes/después con slider ────────────────────────────────
  window.fluxOpenCompare = (btn) => {
    const originalUrl = btn.dataset.original;
    const generatedUrl = btn.dataset.generated;
    let modal = document.getElementById('fluxCompareModal');
    if (modal) modal.remove();
    modal = document.createElement('div');
    modal.id = 'fluxCompareModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:10000;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML = `
      <div style="position:relative;width:min(700px,92vw);border-radius:16px;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,0.6);">
        <div style="position:relative;height:500px;overflow:hidden;user-select:none;" id="fluxCompareContainer">
          <img src="${generatedUrl}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#1e293b;">
          <div id="fluxCompareLeft" style="position:absolute;inset:0;width:50%;overflow:hidden;">
            <img src="${originalUrl}" style="position:absolute;inset:0;width:min(700px,92vw);height:100%;object-fit:contain;background:#0f172a;">
            <div style="position:absolute;top:0;bottom:0;right:0;width:2px;background:white;"></div>
          </div>
          <div id="fluxCompareHandle" style="position:absolute;top:0;bottom:0;left:50%;transform:translateX(-50%);width:40px;cursor:ew-resize;display:flex;align-items:center;justify-content:center;z-index:2;">
            <div style="background:white;border-radius:99px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:1rem;box-shadow:0 2px 10px rgba(0,0,0,0.5);pointer-events:none;">⇄</div>
          </div>
          <div style="position:absolute;top:0.6rem;left:0.6rem;background:rgba(0,0,0,0.65);color:white;padding:3px 10px;border-radius:20px;font-size:0.72rem;font-weight:700;pointer-events:none;">Original</div>
          <div style="position:absolute;top:0.6rem;right:0.6rem;background:rgba(99,102,241,0.9);color:white;padding:3px 10px;border-radius:20px;font-size:0.72rem;font-weight:700;pointer-events:none;">Generado ✨</div>
        </div>
        <div style="background:#1e293b;padding:0.7rem 1rem;display:flex;justify-content:center;gap:0.5rem;">
          <span style="font-size:0.75rem;color:#94a3b8;align-self:center;">← Arrastra el divisor para comparar →</span>
          <button onclick="document.getElementById('fluxCompareModal').remove()" style="background:rgba(255,255,255,0.12);color:white;border:1px solid rgba(255,255,255,0.2);padding:0.4rem 1.1rem;border-radius:8px;font-size:0.82rem;font-weight:600;cursor:pointer;margin-left:1rem;">Cerrar</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    const container = document.getElementById('fluxCompareContainer');
    const leftDiv = document.getElementById('fluxCompareLeft');
    const handle = document.getElementById('fluxCompareHandle');
    let dragging = false;

    function setPos(clientX) {
      const rect = container.getBoundingClientRect();
      const pct = Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100));
      leftDiv.style.width = pct + '%';
      handle.style.left = pct + '%';
    }

    handle.addEventListener('mousedown', (e) => { dragging = true; e.preventDefault(); });
    window.addEventListener('mousemove', (e) => { if (dragging) setPos(e.clientX); });
    window.addEventListener('mouseup', () => { dragging = false; });
    handle.addEventListener('touchstart', (e) => { dragging = true; e.preventDefault(); }, { passive: false });
    window.addEventListener('touchmove', (e) => { if (dragging) setPos(e.touches[0].clientX); }, { passive: false });
    window.addEventListener('touchend', () => { dragging = false; });
  };

  // ── Presets de escena por categoría ───────────────────────────────────
  const SCENE_PRESETS = [
    { label: 'Hogar', emoji: '🏠', prompt: 'Ambiente interior moderno con iluminación cálida, sala de estar elegante, decoración minimalista escandinava, materiales naturales, atmósfera acogedora', aspect: '1:1' },
    { label: 'Muebles', emoji: '🛋️', prompt: 'Showroom de interiorismo de lujo moderno, iluminación cálida arquitectónica, sala amplia con techos altos, materiales naturales como madera clara y lino, plantas de interior como acento decorativo, fotografía editorial de revista de diseño', aspect: '16:9' },
    { label: 'Celulares', emoji: '📱', prompt: 'Superficie de mármol blanco con vetas grises, iluminación de estudio minimalista con halo de luz posterior, fondo oscuro degradado, reflejo especular sutil en la superficie, estética premium de lanzamiento tecnológico, fotografía de producto de lujo', aspect: '1:1' },
    { label: 'Electro', emoji: '⚡', prompt: 'Entorno tecnológico moderno, escritorio minimalista de madera con accesorios tech, iluminación LED azul lateral, fondo oscuro con degradado, ambiente de home office premium y productividad', aspect: '16:9' },
    { label: 'Moda', emoji: '👗', prompt: 'Estudio de fotografía de moda de alta gama, fondo blanco limpio, iluminación de estudio profesional difusa, lifestyle fashion editorial, atmósfera aspiracional', aspect: '3:4' },
    { label: 'Tenis', emoji: '👟', prompt: 'Pista urbana con textura de concreto y graffiti artístico de fondo, iluminación lateral dramática que resalta la suela y los detalles del calzado, sombra pronunciada en el suelo, perspectiva 3/4 frontal levemente elevada, estilo campaign sneaker editorial premium', aspect: '3:4' },
    { label: 'Implementos', emoji: '🏋️', prompt: 'Piso de gimnasio profesional con superficie de rubber negro con textura, iluminación LED dinámica lateral azul y blanca, fondo oscuro con rayos de luz, atmósfera de alta performance y energía extrema, fotografía editorial deportiva', aspect: '4:3' },
    { label: 'Deportes', emoji: '🏃', prompt: 'Escena deportiva al aire libre activa, pista de atletismo o cancha, ambiente energético con iluminación natural brillante y dinámica, movimiento y acción, fotografía deportiva editorial', aspect: '4:3' },
    { label: 'Belleza', emoji: '💄', prompt: 'Ambiente elegante y lujoso, fondo pastel suave en tonos nude o rose gold, iluminación difusa suave tipo beauty shot, texturas sedosas, producto en primer plano destacado', aspect: '1:1' },
    { label: 'Outdoor', emoji: '🌿', prompt: 'Entorno exterior natural y vibrante, vegetación exuberante, luz solar natural filtrada entre hojas, ambiente campestre fresco, fotografía lifestyle de naturaleza', aspect: '4:3' },
  ];

  const presetsRow = document.getElementById('fluxPresetsRow');
  if (presetsRow) {
    presetsRow.innerHTML = SCENE_PRESETS.map((p, i) =>
      `<button data-preset="${i}" style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:99px;padding:3px 11px;font-size:0.73rem;font-weight:600;color:#475569;cursor:pointer;white-space:nowrap;transition:all 0.15s;">${p.emoji} ${p.label}</button>`
    ).join('');
    presetsRow.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('mouseenter', () => { btn.style.background = '#eef2ff'; btn.style.borderColor = '#a5b4fc'; btn.style.color = '#4f46e5'; });
      btn.addEventListener('mouseleave', () => { btn.style.background = '#f1f5f9'; btn.style.borderColor = '#e2e8f0'; btn.style.color = '#475569'; });
      btn.addEventListener('click', () => {
        const preset = SCENE_PRESETS[parseInt(btn.dataset.preset)];
        if (!preset) return;
        const promptEl = document.getElementById('fluxPrompt');
        if (promptEl) {
          promptEl.value = preset.prompt;
          promptEl.style.height = 'auto';
          promptEl.style.height = Math.min(promptEl.scrollHeight, 300) + 'px';
        }
        const radio = document.querySelector(`input[name="fluxAspect"][value="${preset.aspect}"]`);
        if (radio) { radio.checked = true; radio.dispatchEvent(new Event('change', { bubbles: true })); }
      });
    });
  }

  // ── Con Modelo ─────────────────────────────────────────────────────────
  const MODEL_PROMPTS = {
    mujer: {
      natural:   'fotografía lifestyle con modelo femenina adulta usando el producto de forma natural y auténtica, pose relajada, sin mirar directamente a cámara',
      espaldas:  'fotografía lifestyle con modelo femenina adulta de espaldas usando el producto, pose relajada y elegante, vista posterior',
      manos:     'primer plano de manos femeninas adultas sosteniendo o interactuando con el producto, sin mostrar rostro, detalle fino y cuidado',
    },
    hombre: {
      natural:   'fotografía lifestyle con modelo masculino adulto interactuando con el producto de forma dinámica y auténtica, sin mirar directamente a cámara',
      espaldas:  'fotografía lifestyle con modelo masculino adulto de espaldas usando el producto, pose dinámica y segura, vista posterior',
      manos:     'primer plano de manos masculinas adultas sosteniendo o usando el producto, sin mostrar rostro, detalle fuerte y definido',
    },
    nina: {
      natural:   'fotografía lifestyle familiar con niña pequeña usando el producto, ambiente cálido y alegre, expresión espontánea y feliz',
      espaldas:  'fotografía lifestyle familiar con niña pequeña de espaldas interactuando con el producto, ambiente cálido y colorido',
      manos:     'primer plano de manos pequeñas y tiernas de niña con el producto, detalle suave e infantil',
    },
    nino: {
      natural:   'fotografía lifestyle familiar con niño usando el producto, ambiente activo y alegre, expresión espontánea y llena de energía',
      espaldas:  'fotografía lifestyle familiar con niño de espaldas interactuando con el producto, ambiente activo y dinámico',
      manos:     'primer plano de manos pequeñas de niño con el producto, detalle activo e infantil',
    },
  };

  const modelToggleBtn = document.getElementById('fluxModelToggleBtn');
  const modelToggleThumb = document.getElementById('fluxModelToggleThumb');
  const modelOptions = document.getElementById('fluxModelOptions');
  let modelEnabled = false;

  if (modelToggleBtn) {
    modelToggleBtn.addEventListener('click', () => {
      modelEnabled = !modelEnabled;
      modelToggleBtn.style.background = modelEnabled ? '#6366f1' : '#e2e8f0';
      modelToggleThumb.style.transform = modelEnabled ? 'translateX(16px)' : 'translateX(0)';
      if (modelOptions) modelOptions.style.display = modelEnabled ? 'block' : 'none';
    });
  }

  // Pills tipo modelo (estilo card con borde activo)
  document.querySelectorAll('input[name="fluxModelType"]').forEach(r => {
    r.addEventListener('change', () => {
      document.querySelectorAll('input[name="fluxModelType"]').forEach(radio => {
        const pill = radio.nextElementSibling;
        if (radio.checked) {
          pill.style.borderColor = '#c7d2fe'; pill.style.background = '#eef2ff'; pill.style.color = '#4f46e5';
        } else {
          pill.style.borderColor = '#e2e8f0'; pill.style.background = '#f8fafc'; pill.style.color = '#475569';
        }
      });
    });
  });

  initPillGroup('fluxModelPose');

  let fluxStyleReferenceFile = null;
  const styleReferenceInput = document.getElementById('fluxStyleReferenceInput');
  const styleReferencePreview = document.getElementById('fluxStyleReferencePreview');
  if (styleReferenceInput) {
    styleReferenceInput.addEventListener('change', () => {
      fluxStyleReferenceFile = Array.from(styleReferenceInput.files || []).find(file => file.type.startsWith('image/')) || null;
      if (!styleReferencePreview) return;
      if (!fluxStyleReferenceFile) {
        styleReferencePreview.style.display = 'none';
        styleReferencePreview.innerHTML = '';
        return;
      }
      const previewUrl = URL.createObjectURL(fluxStyleReferenceFile);
      styleReferencePreview.style.display = 'flex';
      styleReferencePreview.innerHTML = `
        <img src="${previewUrl}" style="width:42px;height:42px;object-fit:cover;border-radius:7px;border:1px solid #cbd5e1;">
        <span style="font-size:0.75rem;color:#475569;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${fluxStyleReferenceFile.name}</span>
        <button type="button" id="fluxStyleReferenceClear" style="margin-left:auto;border:none;background:#fee2e2;color:#b91c1c;border-radius:6px;padding:3px 7px;cursor:pointer;font-weight:700;">✕</button>
      `;
      document.getElementById('fluxStyleReferenceClear')?.addEventListener('click', () => {
        fluxStyleReferenceFile = null;
        styleReferenceInput.value = '';
        styleReferencePreview.style.display = 'none';
        styleReferencePreview.innerHTML = '';
      });
    });
  }

  let fluxBatchStyleReferenceFile = null;
  const batchStyleReferenceInput = document.getElementById('fluxBatchStyleReferenceInput');
  const batchStyleReferenceName = document.getElementById('fluxBatchStyleReferenceName');
  if (batchStyleReferenceInput) {
    batchStyleReferenceInput.addEventListener('change', () => {
      fluxBatchStyleReferenceFile = Array.from(batchStyleReferenceInput.files || []).find(file => file.type.startsWith('image/')) || null;
      if (!batchStyleReferenceName) return;
      batchStyleReferenceName.textContent = fluxBatchStyleReferenceFile ? `✅ ${fluxBatchStyleReferenceFile.name}` : '';
      batchStyleReferenceName.style.display = fluxBatchStyleReferenceFile ? 'block' : 'none';
    });
  }


  // Botón stats solo para admin
  if (window.currentUser?.email === ADMIN_EMAIL) {
    const badge = document.getElementById('fluxConnectionBadge');
    const statsBtn = document.createElement('button');
    statsBtn.id = 'fluxStatsBtn';
    statsBtn.innerHTML = '📊';
    statsBtn.title = 'Ver estadísticas';
    statsBtn.style.cssText = 'margin-left:0.5rem;background:#eef2ff;border:1px solid #c7d2fe;color:#6366f1;border-radius:8px;padding:0.3rem 0.6rem;cursor:pointer;font-size:0.9rem;';
    statsBtn.addEventListener('click', () => openStatsModal());
    badge.parentElement.insertBefore(statsBtn, badge.nextSibling);
  }

  function setConnectionStatus(connected, { fromGeneration = false } = {}) {
    const badge = document.getElementById('fluxConnectionBadge');
    const warningEl = document.getElementById('fluxTokenWarning');
    if (!badge) return;
    if (connected) {
      badge.innerHTML = `<span style="width:7px;height:7px;background:#16a34a;border-radius:50%;display:inline-block;"></span><span style="font-size:0.8rem;color:#15803d;font-weight:600;">Conectado con Atenea</span>`;
      badge.style.background = '#f0fdf4';
      badge.style.borderColor = '#d1fae5';
      if (warningEl) warningEl.style.display = 'none';
    } else {
      badge.innerHTML = `<span style="width:7px;height:7px;background:#ef4444;border-radius:50%;display:inline-block;"></span><span style="font-size:0.8rem;color:#dc2626;font-weight:600;">Servicio no disponible</span>`;
      badge.style.background = '#fff5f5';
      badge.style.borderColor = '#fecaca';
      if (warningEl) {
        warningEl.innerHTML = `
          <div style="font-size:0.82rem;color:#92400e;font-weight:700;margin-bottom:0.35rem;">⚠️ Worker central no disponible</div>
          <p style="font-size:0.78rem;color:#78350f;margin:0;line-height:1.5;">El computador central debe estar encendido y conectado a Atenea.</p>`;
        warningEl.style.display = 'block';
      }
    }
    // Startup sin fallo confirmado: badge queda verde (optimista) o "Verificando..."
  }

  // ── Pills: activar estilo visual al cambiar radio ─────────────────────────
  function initPillGroup(name) {
    document.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
      radio.addEventListener('change', () => {
        document.querySelectorAll(`input[name="${name}"]`).forEach(r => {
          const pill = r.nextElementSibling;
          if (r.checked) {
            pill.style.background = 'white';
            pill.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            pill.style.color = '#1e293b';
          } else {
            pill.style.background = 'transparent';
            pill.style.boxShadow = 'none';
            pill.style.color = '#475569';
          }
        });
      });
    });
  }

  initPillGroup('fluxAspect');
  initPillGroup('fluxSize');
  initPillGroup('fluxQty');

  // ── Modo: SKU vs imagen manual ────────────────────────────────────────────
  document.querySelectorAll('input[name="fluxMode"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const mode = document.querySelector('input[name="fluxMode"]:checked').value;
      document.getElementById('fluxSkuPanel').style.display = mode === 'sku' ? 'block' : 'none';
      document.getElementById('fluxUploadPanel').style.display = mode === 'upload' ? 'block' : 'none';
    });
  });
  initPillGroup('fluxMode');

  // ── Preview automático al escribir SKU ────────────────────────────────────
  let skuDebounce = null;
  let skuRequestId = 0;
  let loadedSkuImages = [];

  document.getElementById('fluxSkuInput').addEventListener('input', () => {
    clearTimeout(skuDebounce);
    const requestId = ++skuRequestId;
    const sku = document.getElementById('fluxSkuInput').value.trim();
    const preview = document.getElementById('fluxSkuPreview');

    if (!sku || sku.length < 5) {
      preview.innerHTML = '';
      loadedSkuImages = [];
      return;
    }

    preview.innerHTML = `
      <div style="display:flex;gap:0.5rem;margin-top:0.5rem;">
        ${[1,2,3].map(() => `<div style="width:70px;height:70px;border-radius:8px;background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);background-size:200% 100%;animation:shimmer 1.2s infinite;"></div>`).join('')}
      </div>
      <p style="font-size:0.75rem;color:#94a3b8;margin:0.4rem 0 0;">Buscando imágenes del producto...</p>
    `;
    loadedSkuImages = [];

    skuDebounce = setTimeout(() => loadSkuPreview(sku, requestId), 600);
  });

  async function loadSkuPreview(rawInput, requestId = ++skuRequestId) {
    const country = document.getElementById('fluxCountry').value;
    const preview = document.getElementById('fluxSkuPreview');
    const isCurrentRequest = () => requestId === skuRequestId
      && document.getElementById('fluxSkuInput').value.trim() === rawInput.trim();

    const parsed = parseProductInput(rawInput);
    if (!parsed) {
      if (!isCurrentRequest()) return;
      preview.innerHTML = `<p style="font-size:0.78rem;color:#dc2626;margin:0.4rem 0 0;">❌ Ingresa un SKU o URL de Falabella válida</p>`;
      loadedSkuImages = [];
      return;
    }

    const { skuId, productId } = parsed;

    // Intento 1: CDN con skuId — prueba _01 y _1 en paralelo
    let urls = getProductImageUrls(skuId, country, 3);
    let results = await Promise.allSettled(urls.map(u => urlToBase64(u)));
    if (!isCurrentRequest()) return;
    let valid = results
      .map((r, i) => r.status === 'fulfilled' ? { ...r.value, url: urls[i] } : null)
      .filter(Boolean)
      .slice(0, 3); // máx 3 fotos

    // Intento 2: CDN con productId si skuId no dio nada
    if (!valid.length && productId && productId !== skuId) {
      if (!isCurrentRequest()) return;
      preview.innerHTML = `<p style="font-size:0.75rem;color:#6366f1;margin:0.4rem 0 0;">🔍 Buscando por ID de producto...</p>`;
      const urlsAlt = getProductImageUrls(productId, country, 3);
      const resultsAlt = await Promise.allSettled(urlsAlt.map(u => urlToBase64(u)));
      if (!isCurrentRequest()) return;
      valid = resultsAlt
        .map((r, i) => r.status === 'fulfilled' ? { ...r.value, url: urlsAlt[i] } : null)
        .filter(Boolean)
        .slice(0, 3);
    }

    if (!valid.length) {
      if (!isCurrentRequest()) return;
      preview.innerHTML = `<p style="font-size:0.78rem;color:#dc2626;margin:0.4rem 0 0;">❌ No se encontraron imágenes. Intenta con "Subir imagen" para este producto.</p>`;
      loadedSkuImages = [];
      return;
    }

    if (!isCurrentRequest()) return;
    loadedSkuImages = valid;
    const foundId = valid[0].url.match(/\/([^/]+)_\d+\//)?.[1] || skuId;
    preview.innerHTML = `
      <div style="display:flex;gap:0.5rem;margin-top:0.5rem;flex-wrap:wrap;">
        ${valid.map(img => `<img src="${img.url}" style="height:70px;width:70px;border-radius:8px;object-fit:contain;border:1px solid #e2e8f0;background:#f8fafc;">`).join('')}
      </div>
      <p style="font-size:0.75rem;color:#16a34a;margin:0.4rem 0 0;">
        ✅ ${valid.length} imagen${valid.length > 1 ? 'es' : ''} encontrada${valid.length > 1 ? 's' : ''}
        <span style="color:#94a3b8;">(ID: ${foundId})</span>
      </p>
    `;
  }

  document.getElementById('fluxCountry').addEventListener('change', () => {
    const sku = document.getElementById('fluxSkuInput').value.trim();
    if (sku.length >= 5) loadSkuPreview(sku, ++skuRequestId);
  });

  // ── Drag & Drop ───────────────────────────────────────────────────────────
  const dropZone = document.getElementById('fluxDropZone');
  const dropZoneContent = document.getElementById('fluxDropZoneContent');
  const manualPreview = document.getElementById('fluxManualPreview');
  const fileInput = document.getElementById('fluxFileInput');
  let manualFiles = [];

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (manualFiles.length < 4) {
      dropZone.style.borderColor = '#6366f1';
      dropZone.style.background = '#eef2ff';
    }
  });
  dropZone.addEventListener('dragleave', () => {
    if (manualFiles.length < 4) {
      dropZone.style.borderColor = '#cbd5e1';
      dropZone.style.background = '#f8fafc';
    } else {
      dropZone.style.borderColor = '#fca5a5';
      dropZone.style.background = '#fef2f2';
    }
  });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    if (manualFiles.length >= 4) {
      dropZone.style.borderColor = '#fca5a5';
      dropZone.style.background = '#fef2f2';
      alert('⚠️ Ya se ha alcanzado el límite de 4 imágenes.');
      return;
    }
    dropZone.style.borderColor = '#cbd5e1';
    dropZone.style.background = '#f8fafc';
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    addManualFiles(files);
  });
  dropZone.addEventListener('click', () => {
    if (manualFiles.length >= 4) {
      alert('⚠️ Ya se ha alcanzado el límite de 4 imágenes. Elimina alguna para subir otra.');
      return;
    }
    fileInput.click();
  });
  fileInput.addEventListener('change', () => {
    const files = Array.from(fileInput.files).filter(f => f.type.startsWith('image/'));
    addManualFiles(files);
  });

  function addManualFiles(files) {
    if (files.length === 0) return;
    let addedCount = 0;
    let skippedCount = 0;
    for (const f of files) {
      if (manualFiles.length < 4) {
        manualFiles.push(f);
        addedCount++;
      } else {
        skippedCount++;
      }
    }
    if (skippedCount > 0) {
      alert(`⚠️ Solo se permiten hasta 4 imágenes. Se omitieron ${skippedCount} imagen(es).`);
    }
    renderManualPreviews();
    fileInput.value = '';
  }

  function renderManualPreviews() {
    if (!manualPreview || !dropZoneContent) return;
    
    if (manualFiles.length === 0) {
      dropZoneContent.innerHTML = `
        <span style="font-size:1.75rem;display:block;">📥</span>
        <p style="color:#64748b;font-size:0.82rem;margin:0.2rem 0 0;">Clic o arrastra hasta 4 imágenes</p>
      `;
      dropZone.style.cursor = 'pointer';
      dropZone.style.background = '#f8fafc';
      dropZone.style.borderColor = '#cbd5e1';
      manualPreview.innerHTML = '';
      return;
    }

    // Actualizar dropzone
    if (manualFiles.length < 4) {
      dropZoneContent.innerHTML = `
        <span style="font-size:1.5rem;display:block;">➕</span>
        <p style="color:#64748b;font-size:0.78rem;margin:0.1rem 0 0;">Añadir más imágenes (${manualFiles.length}/4)</p>
      `;
      dropZone.style.cursor = 'pointer';
      dropZone.style.background = '#f8fafc';
      dropZone.style.borderColor = '#cbd5e1';
    } else {
      dropZoneContent.innerHTML = `
        <span style="font-size:1.5rem;display:block;">🔒</span>
        <p style="color:#dc2626;font-size:0.78rem;margin:0.1rem 0 0;font-weight:600;">Límite de 4 imágenes alcanzado</p>
      `;
      dropZone.style.cursor = 'not-allowed';
      dropZone.style.background = '#fef2f2';
      dropZone.style.borderColor = '#fca5a5';
    }

    // Renderizar miniaturas
    manualPreview.innerHTML = manualFiles.map((file, index) => {
      const url = URL.createObjectURL(file);
      return `
        <div style="position:relative;width:65px;height:65px;border-radius:10px;border:1px solid #cbd5e1;background:#f8fafc;display:flex;align-items:center;justify-content:center;overflow:visible;" class="flux-manual-thumb">
          <img src="${url}" style="width:100%;height:100%;object-fit:contain;border-radius:8px;">
          <button type="button" data-index="${index}" style="position:absolute;top:-6px;right:-6px;background:#ef4444;color:white;border:none;border-radius:50%;width:18px;height:18px;font-size:10px;font-weight:bold;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;line-height:1;box-shadow:0 1px 3px rgba(0,0,0,0.2);" class="flux-delete-thumb-btn">✕</button>
        </div>
      `;
    }).join('');

    // Agregar manejador de click para los botones de eliminar
    manualPreview.querySelectorAll('.flux-delete-thumb-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-index'));
        removeManualFile(idx);
      });
    });
  }

  function removeManualFile(index) {
    if (index >= 0 && index < manualFiles.length) {
      manualFiles.splice(index, 1);
      renderManualPreviews();
    }
  }

  // ── Generar ───────────────────────────────────────────────────────────────
  document.getElementById('fluxGenerateBtn').addEventListener('click', async () => {
    const mode = document.querySelector('input[name="fluxMode"]:checked').value;
    const aspectRatio = document.querySelector('input[name="fluxAspect"]:checked')?.value || '1:1';
    const imageSize = document.querySelector('input[name="fluxSize"]:checked')?.value || '1K';
    const qty = parseInt(document.querySelector('input[name="fluxQty"]:checked')?.value || '2');
    const prompt = document.getElementById('fluxPrompt').value.trim();

    const resultsGrid = document.getElementById('fluxResultsGrid');
    resultsGrid.innerHTML = '';
    document.getElementById('fluxProgressContainer').style.display = 'block';
    document.getElementById('fluxDownloadAll').style.display = 'none';
    document.getElementById('fluxGenerateBtn').disabled = true;
    setStatus('', '');
    logUserActivity('GENERATE_FLUX_IMAGE', { qty, mode });

    let parts = [];
    let productName = 'producto';

    try {
      if (mode === 'sku') {
        const rawInput = document.getElementById('fluxSkuInput').value.trim();
        const country = document.getElementById('fluxCountry').value;
        if (!rawInput) { setStatus('❌ Ingresa un SKU o URL de Falabella', '#dc2626'); reset(); return; }
        const parsedInput = parseProductInput(rawInput);
        if (!parsedInput) { setStatus('❌ Formato inválido. Ingresa un SKU o URL de Falabella', '#dc2626'); reset(); return; }
        const actualSku = parsedInput.skuId || parsedInput.productId || rawInput;
        productName = actualSku;

        if (loadedSkuImages.length) {
          parts = loadedSkuImages.map(img => ({ inlineData: { data: img.b64, mimeType: img.mime } }));
          setProgress(30);
        } else {
          setStatus(`🔍 Cargando imágenes del producto...`, '#6366f1');
          setProgress(10);
          await loadSkuPreview(rawInput);
          if (!loadedSkuImages.length) throw new Error('No se encontraron imágenes. Intenta con "Subir imagen" para este producto.');
          parts = loadedSkuImages.map(img => ({ inlineData: { data: img.b64, mimeType: img.mime } }));
          setProgress(30);
        }

      } else {
        if (manualFiles.length === 0) { setStatus('❌ Sube al menos una imagen', '#dc2626'); reset(); return; }
        setStatus('⏳ Procesando imágenes...', '#6366f1');
        setProgress(15);
        const base64Results = await Promise.all(manualFiles.map(file => fileToBase64(file)));
        parts = base64Results.map(img => ({ inlineData: { data: img.b64, mimeType: img.mime } }));
        productName = manualFiles[0].name.replace(/\.[^.]+$/, '');
        if (manualFiles.length > 1) {
          productName += `_y_${manualFiles.length - 1}_mas`;
        }
        setProgress(30);
      }

      // Prompt + modelo opcional
      let fullPrompt = prompt;
      if (modelEnabled) {
        const mType = document.querySelector('input[name="fluxModelType"]:checked')?.value || 'mujer';
        const mPose = document.querySelector('input[name="fluxModelPose"]:checked')?.value || 'natural';
        const mText = MODEL_PROMPTS[mType]?.[mPose] || '';
        if (mText) fullPrompt = fullPrompt ? `${fullPrompt}. ${mText}` : mText;
      }
      if (fluxStyleReferenceFile) {
        const styleReference = await fileToBase64(fluxStyleReferenceFile);
        parts.push({ inlineData: { data: styleReference.b64, mimeType: styleReference.mime } });
        const stylePrompt = 'usa la última imagen como referencia de estilo visual para la ambientación, pero conserva exactamente la identidad del producto de las primeras imágenes';
        fullPrompt = fullPrompt ? `${fullPrompt}. ${stylePrompt}` : stylePrompt;
      }
      if (fullPrompt) parts.push({ text: fullPrompt });

      // Guardar vars para historial y naming
      lastPrompt = fullPrompt;
      lastAspectRatio = aspectRatio;
      lastOriginalImgUrl = mode === 'sku' ? (loadedSkuImages[0]?.url || null) : null;

      setStatus(`🎨 Generando ${qty} ambientación(es)...`, '#6366f1');
      setProgress(40);

      const fluxPayload = {
        model: 'gemini-3.1-flash-image',
        contents: [{ parts }],
        config: { imageConfig: { aspectRatio, imageSize } },
      };

      const requests = Array.from({ length: qty }, () => callFlux(fluxPayload));
      const results = await Promise.allSettled(requests);
      setProgress(90);

      let count = 0;
      results.forEach((res, i) => {
        if (res.status === 'fulfilled') {
          (res.value.candidates || []).forEach((c) => {
            (c.content?.parts || []).forEach((p) => {
              if (p.inlineData) { addResult(productName, p.inlineData.data, p.inlineData.mimeType, i); count++; }
            });
          });
        } else {
          addError(`Variante ${i + 1}`, res.reason?.message || res.reason);
        }
      });

      setProgress(100);
      document.getElementById('fluxEmptyState').style.display = count > 0 ? 'none' : 'block';
      document.getElementById('fluxResultCount').textContent = count > 0 ? `${count} imagen(es) generada(s)` : '';
      if (count > 0) {
        setStatus(`✅ ${count} imagen(es) generada(s)`, '#16a34a');
        setConnectionStatus(true);
        document.getElementById('fluxDownloadAll').style.display = 'inline-flex';
        logGeneration({
          skus: [productName],
          imageCount: count,
          mode: 'individual',
          country: mode === 'sku' ? document.getElementById('fluxCountry').value : 'upload',
          aspectRatio,
        });
      } else {
        const hasAuthFail = results.some(r => r.status === 'rejected' && r.reason?.message === 'SESSION_EXPIRED');
        if (hasAuthFail) {
          const isAdminNow = window.currentUserRole === 'full';
          setStatus(
            isAdminNow
              ? '❌ Sesión de Atenea expirada. Usa el botón "Iniciar sesión" para renovarla.'
              : '❌ Servicio de Atenea no disponible. Contacta al administrador.',
            '#dc2626'
          );
          setConnectionStatus(false, { fromGeneration: true });
        } else {
          setStatus('❌ No se pudo generar ninguna imagen.', '#dc2626');
        }
      }

    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') {
        const isAdmin = window.currentUserRole === 'full';
        setStatus(
          isAdmin
            ? '❌ Sesión de Atenea expirada. Usa el botón "Iniciar sesión" para renovarla.'
            : '❌ Servicio de Atenea no disponible. Contacta al administrador.',
          '#dc2626'
        );
        setConnectionStatus(false, { fromGeneration: true });
      } else {
        setStatus(`❌ ${err.message || err}`, '#dc2626');
      }
    }

    reset();
  });

  function addResult(name, b64, mimeType, i) {
    const ext = mimeType.split('/')[1] || 'webp';
    const url = `data:${mimeType};base64,${b64}`;
    const dateStr = new Date().toISOString().slice(0, 10);
    const fname = `${name}_${lastAspectRatio.replace(':', 'x')}_${dateStr}_${i + 1}.${ext}`;
    const card = document.createElement('div');
    card.className = 'flux-result-card';
    card.dataset.b64 = b64; card.dataset.mime = mimeType; card.dataset.name = fname;
    card.style.cssText = 'border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;background:white;';

    const compareBtn = lastOriginalImgUrl
      ? `<button onclick="window.fluxOpenCompare(this)" data-original="${lastOriginalImgUrl}" data-generated="${url}" style="background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;padding:4px 9px;border-radius:8px;font-size:0.75rem;font-weight:600;cursor:pointer;white-space:nowrap;" title="Comparar original vs generado">⇄</button>`
      : '';

    card.innerHTML = `
      <div style="position:relative;cursor:zoom-in;" class="flux-img-wrap">
        <img src="${url}" style="width:100%;aspect-ratio:1;object-fit:contain;background:#f8fafc;display:block;">
        <div class="flux-img-overlay" style="position:absolute;inset:0;background:rgba(0,0,0,0);display:flex;align-items:center;justify-content:center;transition:background 0.2s;">
          <span style="color:white;font-size:1.5rem;opacity:0;transition:opacity 0.2s;">🔍</span>
        </div>
      </div>
      <div style="padding:0.6rem 0.75rem;display:flex;justify-content:space-between;align-items:center;gap:0.4rem;">
        <span style="font-size:0.75rem;color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${name}</span>
        <div style="display:flex;gap:0.3rem;flex-shrink:0;">
          ${compareBtn}
          <a href="${url}" download="${fname}" style="background:#6366f1;color:white;padding:4px 12px;border-radius:8px;font-size:0.8rem;font-weight:600;text-decoration:none;white-space:nowrap;">⬇</a>
        </div>
      </div>`;

    const wrap = card.querySelector('.flux-img-wrap');
    const overlay = card.querySelector('.flux-img-overlay');
    wrap.addEventListener('mouseenter', () => {
      overlay.style.background = 'rgba(0,0,0,0.3)';
      overlay.querySelector('span').style.opacity = '1';
    });
    wrap.addEventListener('mouseleave', () => {
      overlay.style.background = 'rgba(0,0,0,0)';
      overlay.querySelector('span').style.opacity = '0';
    });
    wrap.addEventListener('click', () => openLightbox(url, url, fname));

    document.getElementById('fluxResultsGrid').appendChild(card);

    // Guardar en historial
    saveToHistory({ sku: name, prompt: lastPrompt, aspectRatio: lastAspectRatio, b64, mimeType, fname });
  }

  function addError(name, msg) {
    const card = document.createElement('div');
    card.style.cssText = 'border:1px solid #fecaca;border-radius:12px;padding:1rem;background:#fff5f5;';
    card.innerHTML = `<div style="color:#dc2626;font-weight:600;font-size:0.85rem;">❌ ${name}</div><div style="color:#7f1d1d;font-size:0.8rem;margin-top:4px;">${msg}</div>`;
    document.getElementById('fluxResultsGrid').appendChild(card);
  }

  function setStatus(msg, color) {
    const el = document.getElementById('fluxStatusMsg');
    el.textContent = msg; el.style.color = color;
  }

  function setProgress(pct) {
    document.getElementById('fluxProgressBar').style.width = pct + '%';
  }

  function reset() {
    document.getElementById('fluxGenerateBtn').disabled = false;
  }

  // ── Descargar todo ────────────────────────────────────────────────────────
  document.getElementById('fluxDownloadAll').addEventListener('click', async () => {
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    document.querySelectorAll('.flux-result-card').forEach(card => {
      const bin = atob(card.dataset.b64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      zip.file(card.dataset.name, arr);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'flux_ambientaciones.zip'; a.click();
  });

  // ── Tabs ──────────────────────────────────────────────────────────────────
  window.switchFluxTab = (tab) => {
    const isLote = tab === 'lote';
    document.getElementById('fluxPanelIndividual').style.display = isLote ? 'none' : 'grid';
    document.getElementById('fluxPanelLote').style.display = isLote ? 'grid' : 'none';
    document.getElementById('fluxTabIndividual').style.cssText = isLote
      ? 'padding:0.45rem 1.1rem;border:none;border-radius:9px;font-size:0.85rem;font-weight:700;cursor:pointer;background:transparent;color:#64748b;'
      : 'padding:0.45rem 1.1rem;border:none;border-radius:9px;font-size:0.85rem;font-weight:700;cursor:pointer;background:white;color:#1e293b;box-shadow:0 1px 3px rgba(0,0,0,0.1);';
    document.getElementById('fluxTabLote').style.cssText = isLote
      ? 'padding:0.45rem 1.1rem;border:none;border-radius:9px;font-size:0.85rem;font-weight:700;cursor:pointer;background:white;color:#1e293b;box-shadow:0 1px 3px rgba(0,0,0,0.1);'
      : 'padding:0.45rem 1.1rem;border:none;border-radius:9px;font-size:0.85rem;font-weight:700;cursor:pointer;background:transparent;color:#64748b;';
  };

  // ── Pill groups para lote ─────────────────────────────────────────────────
  initPillGroup('fluxBatchAspect');
  initPillGroup('fluxBatchSize');
  initPillGroup('fluxBatchQty');

  // ── Parser TSV/CSV/XLSX ───────────────────────────────────────────────────
  let batchRows = [];

  function parseTSV(text) {
    return text.trim().split('\n')
      .map(line => line.split('\t').map(c => c.trim()).filter(Boolean))
      .filter(cols => cols.length > 0 && cols[0])
      .map(cols => ({ sku: cols[0], prompt: cols[1] || '' }));
  }

  function parseCSV(text) {
    return text.trim().split('\n')
      .map(line => line.split(',').map(c => c.replace(/^"|"$/g, '').trim()))
      .filter(cols => cols.length > 0 && cols[0])
      .map(cols => ({ sku: cols[0], prompt: cols[1] || '' }));
  }

  async function parseExcel(file) {
    const { read, utils } = await import('xlsx');
    const data = await file.arrayBuffer();
    const wb = read(data);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = utils.sheet_to_json(ws, { header: 1 });
    return rows
      .filter(r => r.length > 0 && r[0])
      .map(r => ({ sku: String(r[0]).trim(), prompt: String(r[1] || '').trim() }));
  }

  function renderBatchTable(rows, done = {}) {
    const container = document.getElementById('fluxBatchTableBody');
    container.innerHTML = rows.map((row, i) => {
      const status = done[row.sku];
      const statusHtml = status === 'ok' ? '<span style="color:#16a34a;font-weight:700;">✅</span>'
        : status === 'error' ? '<span style="color:#dc2626;font-weight:700;">❌</span>'
        : status === 'working' ? '<span style="color:#6366f1;font-weight:700;">⏳</span>'
        : '<span style="color:#94a3b8;font-size:0.75rem;">—</span>';
      const bg = i % 2 === 0 ? '#fff' : '#f8fafc';
      return `<div style="display:grid;grid-template-columns:2rem 1fr 2fr 2rem;gap:0.5rem;align-items:center;padding:0.5rem 0.75rem;background:${bg};border-bottom:1px solid #f1f5f9;">
        <span style="font-size:0.72rem;color:#94a3b8;">${i + 1}</span>
        <span style="font-size:0.82rem;font-weight:700;color:#1e293b;">${row.sku}</span>
        <span style="font-size:0.78rem;color:#64748b;">${row.prompt || '<em style="color:#cbd5e1;">prompt base</em>'}</span>
        ${statusHtml}
      </div>`;
    }).join('');
    document.getElementById('fluxBatchTable').style.display = 'block';
    document.getElementById('fluxBatchTableLabel').textContent = `${rows.length} SKU${rows.length !== 1 ? 's' : ''} cargados`;
  }

  document.getElementById('fluxBatchParseBtn').addEventListener('click', () => {
    const text = document.getElementById('fluxBatchPaste').value.trim();
    if (!text) return;
    const rows = text.includes('\t') ? parseTSV(text) : parseCSV(text);
    if (!rows.length) return;
    batchRows = rows;
    renderBatchTable(rows);
  });

  document.getElementById('fluxBatchPaste').addEventListener('input', () => {
    const text = document.getElementById('fluxBatchPaste').value.trim();
    if (!text) return;
    const rows = text.includes('\t') ? parseTSV(text) : parseCSV(text);
    if (!rows.length) return;
    batchRows = rows;
    renderBatchTable(rows);
  });

  document.getElementById('fluxBatchFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      let rows;
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        rows = parseCSV(text);
      } else {
        rows = await parseExcel(file);
      }
      if (!rows.length) return;
      batchRows = rows;
      renderBatchTable(rows);
    } catch(err) {
      alert('Error al leer archivo: ' + err.message);
    }
  });

  // ── Generar lote ──────────────────────────────────────────────────────────
  const batchImages = {};

  document.getElementById('fluxBatchGenerateBtn').addEventListener('click', async () => {
    if (!batchRows.length) { alert('Primero carga una lista de SKUs'); return; }

    const aspectRatio = document.querySelector('input[name="fluxBatchAspect"]:checked')?.value || '1:1';
    const imageSize = document.querySelector('input[name="fluxBatchSize"]:checked')?.value || '1K';
    const qty = parseInt(document.querySelector('input[name="fluxBatchQty"]:checked')?.value || '1');
    const country = document.getElementById('fluxBatchCountry').value;
    const basePrompt = document.getElementById('fluxBatchBasePrompt').value.trim();
    const batchStyleReference = fluxBatchStyleReferenceFile ? await fileToBase64(fluxBatchStyleReferenceFile) : null;
    const styleReferencePrompt = batchStyleReference ? 'usa la última imagen como referencia de estilo visual, pero conserva la identidad del producto de las primeras imágenes' : '';

    document.getElementById('fluxBatchGenerateBtn').disabled = true;
    document.getElementById('fluxBatchProgress').style.display = 'block';
    document.getElementById('fluxBatchResults').innerHTML = '';
    document.getElementById('fluxBatchDownloadZip').style.display = 'none';
    Object.keys(batchImages).forEach(k => delete batchImages[k]);

    const done = {};
    let completed = 0;

    const setBatchProgress = (msg) => {
      document.getElementById('fluxBatchStatusMsg').textContent = msg;
      document.getElementById('fluxBatchCounter').textContent = `${completed}/${batchRows.length}`;
      document.getElementById('fluxBatchProgressBar').style.width = (completed / batchRows.length * 100) + '%';
    };

    const CONCURRENCY = 2;
    let idx = 0;

    async function processNext() {
      while (idx < batchRows.length) {
        const row = batchRows[idx++];
        done[row.sku] = 'working';
        renderBatchTable(batchRows, done);
        setBatchProgress(`⏳ Generando SKU ${row.sku}...`);

        try {
          const urls = getProductImageUrls(row.sku, country, 3);
          const imgResults = await Promise.allSettled(urls.map(u => urlToBase64(u)));
          const validImgs = imgResults.filter(r => r.status === 'fulfilled').map(r => r.value);

          if (!validImgs.length) throw new Error('No se encontraron imágenes');

          const prompt = [row.prompt || basePrompt, styleReferencePrompt].filter(Boolean).join('. ');
          const parts = [
            ...validImgs.map(img => ({ inlineData: { data: img.b64, mimeType: img.mime } })),
            ...(batchStyleReference ? [{ inlineData: { data: batchStyleReference.b64, mimeType: batchStyleReference.mime } }] : []),
            ...(prompt ? [{ text: prompt }] : []),
          ];

          const fluxPayload = {
            model: 'gemini-3.1-flash-image',
            contents: [{ parts }],
            config: { imageConfig: { aspectRatio, imageSize } },
          };

          const requests = Array.from({ length: qty }, () => callFlux(fluxPayload));
          const genResults = await Promise.allSettled(requests);

          batchImages[row.sku] = [];
          genResults.forEach((res, i) => {
            if (res.status === 'fulfilled') {
              (res.value.candidates || []).forEach(c => {
                (c.content?.parts || []).forEach(p => {
                  if (p.inlineData) {
                    const ext = p.inlineData.mimeType.split('/')[1] || 'webp';
                    const batchDateStr = new Date().toISOString().slice(0, 10);
                    const fname = `${row.sku}_${aspectRatio.replace(':', 'x')}_${batchDateStr}_${batchImages[row.sku].length + 1}.${ext}`;
                    batchImages[row.sku].push({ b64: p.inlineData.data, mime: p.inlineData.mimeType, fname });
                    addBatchResult(row.sku, p.inlineData.data, p.inlineData.mimeType, fname);
                  }
                });
              });
            }
          });

          done[row.sku] = 'ok';
        } catch(err) {
          done[row.sku] = 'error';
          addBatchError(row.sku, err.message);
        }

        completed++;
        renderBatchTable(batchRows, done);
        setBatchProgress(`✅ ${completed}/${batchRows.length} completados`);
      }
    }

    const workers = Array.from({ length: CONCURRENCY }, () => processNext());
    await Promise.all(workers);

    document.getElementById('fluxBatchGenerateBtn').disabled = false;
    document.getElementById('fluxBatchStatusMsg').textContent = `✅ Lote completo — ${completed} SKUs procesados`;
    document.getElementById('fluxBatchDownloadZip').style.display = 'inline-flex';
    const totalBatchImgs = Object.values(batchImages).reduce((s, imgs) => s + imgs.length, 0);
    logGeneration({
      skus: batchRows.map(r => r.sku),
      imageCount: totalBatchImgs,
      mode: 'lote',
      country,
      aspectRatio,
    });
  });

  function addBatchResult(sku, b64, mimeType, fname) {
    const url = `data:${mimeType};base64,${b64}`;
    const card = document.createElement('div');
    card.style.cssText = 'border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;background:white;';
    card.innerHTML = `
      <div style="position:relative;cursor:zoom-in;" class="flux-img-wrap">
        <img src="${url}" style="width:100%;aspect-ratio:1;object-fit:contain;background:#f8fafc;display:block;">
        <div class="flux-img-overlay" style="position:absolute;inset:0;background:rgba(0,0,0,0);display:flex;align-items:center;justify-content:center;transition:background 0.2s;">
          <span style="color:white;font-size:1.5rem;opacity:0;transition:opacity 0.2s;">🔍</span>
        </div>
      </div>
      <div style="padding:0.5rem 0.75rem;display:flex;justify-content:space-between;align-items:center;gap:0.5rem;">
        <span style="font-size:0.75rem;color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${fname}</span>
        <a href="${url}" download="${fname}" style="background:#6366f1;color:white;padding:4px 12px;border-radius:8px;font-size:0.8rem;font-weight:600;text-decoration:none;">⬇</a>
      </div>`;
    const wrap = card.querySelector('.flux-img-wrap');
    const overlay = card.querySelector('.flux-img-overlay');
    wrap.addEventListener('mouseenter', () => { overlay.style.background = 'rgba(0,0,0,0.3)'; overlay.querySelector('span').style.opacity = '1'; });
    wrap.addEventListener('mouseleave', () => { overlay.style.background = 'rgba(0,0,0,0)'; overlay.querySelector('span').style.opacity = '0'; });
    wrap.addEventListener('click', () => openLightbox(url, url, fname));
    document.getElementById('fluxBatchResults').appendChild(card);
  }

  function addBatchError(sku, msg) {
    const card = document.createElement('div');
    card.style.cssText = 'border:1px solid #fecaca;border-radius:12px;padding:1rem;background:#fff5f5;';
    card.innerHTML = `<div style="color:#dc2626;font-weight:700;font-size:0.85rem;">❌ ${sku}</div><div style="color:#7f1d1d;font-size:0.78rem;margin-top:4px;">${msg}</div>`;
    document.getElementById('fluxBatchResults').appendChild(card);
  }

  // ── Modal de estadísticas (solo admin) ───────────────────────────────────
  async function openStatsModal() {
    let modal = document.getElementById('fluxStatsModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'fluxStatsModal';
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
      modal.innerHTML = `
        <div style="background:white;border-radius:18px;padding:1.5rem;width:min(700px,95vw);max-height:85vh;overflow-y:auto;position:relative;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem;">
            <h3 style="margin:0;font-size:1.2rem;font-weight:800;color:#1e293b;">📊 Estadísticas de generación</h3>
            <button onclick="document.getElementById('fluxStatsModal').remove()" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:#64748b;">✕</button>
          </div>
          <div id="fluxStatsContent" style="color:#64748b;text-align:center;padding:2rem;">Cargando...</div>
        </div>`;
      document.body.appendChild(modal);
      modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    }
    document.body.appendChild(modal);

    const db = getDb();
    const q = query(collection(db, 'flux_logs'), orderBy('ts', 'desc'));
    const snap = await getDocs(q);
    const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (!logs.length) {
      document.getElementById('fluxStatsContent').innerHTML = '<p>No hay registros aún.</p>';
      return;
    }

    const totalImgs = logs.reduce((s, l) => s + (l.imageCount || 0), 0);
    const totalSkus = logs.reduce((s, l) => s + (l.skuCount || 0), 0);
    const byUser = {};
    logs.forEach(l => {
      if (!byUser[l.email]) byUser[l.email] = { email: l.email, name: l.displayName, imgs: 0, sessions: 0 };
      byUser[l.email].imgs += l.imageCount || 0;
      byUser[l.email].sessions += 1;
    });
    const topUsers = Object.values(byUser).sort((a, b) => b.imgs - a.imgs);

    const fmt = (ts) => ts?.toDate ? ts.toDate().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '—';

    document.getElementById('fluxStatsContent').innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.75rem;margin-bottom:1.25rem;">
        <div style="background:#f0fdf4;border:1px solid #d1fae5;border-radius:12px;padding:1rem;text-align:center;">
          <div style="font-size:1.8rem;font-weight:800;color:#16a34a;">${totalImgs}</div>
          <div style="font-size:0.78rem;color:#15803d;font-weight:600;">Imágenes generadas</div>
        </div>
        <div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:12px;padding:1rem;text-align:center;">
          <div style="font-size:1.8rem;font-weight:800;color:#6366f1;">${logs.length}</div>
          <div style="font-size:0.78rem;color:#4f46e5;font-weight:600;">Sesiones</div>
        </div>
        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:1rem;text-align:center;">
          <div style="font-size:1.8rem;font-weight:800;color:#d97706;">${topUsers.length}</div>
          <div style="font-size:0.78rem;color:#b45309;font-weight:600;">Usuarios activos</div>
        </div>
      </div>

      <div style="margin-bottom:1.25rem;">
        <div style="font-size:0.75rem;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:0.5rem;">Top usuarios</div>
        ${topUsers.map(u => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem 0.75rem;background:#f8fafc;border-radius:8px;margin-bottom:0.35rem;">
            <div>
              <div style="font-size:0.85rem;font-weight:700;color:#1e293b;">${u.name}</div>
              <div style="font-size:0.75rem;color:#64748b;">${u.email}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:0.9rem;font-weight:800;color:#6366f1;">${u.imgs} imgs</div>
              <div style="font-size:0.72rem;color:#94a3b8;">${u.sessions} sesiones</div>
            </div>
          </div>`).join('')}
      </div>

      <div>
        <div style="font-size:0.75rem;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:0.5rem;">Últimas 20 generaciones</div>
        <div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
          ${logs.slice(0, 20).map((l, i) => `
            <div style="display:grid;grid-template-columns:1fr auto auto;gap:0.75rem;align-items:center;padding:0.5rem 0.75rem;${i % 2 === 0 ? 'background:#fff' : 'background:#f8fafc'};border-bottom:1px solid #f1f5f9;">
              <div>
                <span style="font-size:0.8rem;font-weight:700;color:#1e293b;">${l.displayName || l.email}</span>
                <span style="font-size:0.72rem;color:#94a3b8;margin-left:0.4rem;">${l.mode || ''}</span>
                <div style="font-size:0.72rem;color:#64748b;">${(l.skus || []).slice(0,3).join(', ')}${(l.skus||[]).length > 3 ? ` +${l.skus.length-3}` : ''}</div>
              </div>
              <span style="font-size:0.82rem;font-weight:700;color:#6366f1;">${l.imageCount || 0} imgs</span>
              <span style="font-size:0.72rem;color:#94a3b8;white-space:nowrap;">${fmt(l.ts)}</span>
            </div>`).join('')}
        </div>
      </div>`;
  }

  document.getElementById('fluxBatchDownloadZip').addEventListener('click', async () => {
    // Modo Por Fotos: la descarga la maneja el listener con capture:true de runPhotosBatch
    if (photosLoteActive) return;
    // Modo Lista SKU
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    Object.entries(batchImages).forEach(([sku, imgs]) => {
      const folder = zip.folder(sku);
      imgs.forEach(({ b64, fname }) => {
        const bin = atob(b64);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        folder.file(fname, arr);
      });
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `flux_lote_${new Date().toISOString().slice(0, 10)}.zip`; a.click();
  });

  // ── MODO POR FOTOS ────────────────────────────────────────────────────────
  let photosBatchGroups = {}; // { sku: [{file, num, ext}] }
  let photosLoteActive = false;

  // Sub-tabs lote
  window.switchLoteTab = function(tab) {
    const isPhotos = tab === 'photos';
    photosLoteActive = isPhotos;
    document.getElementById('fluxListBatchPanel').style.display = isPhotos ? 'none' : 'flex';
    document.getElementById('fluxPhotosBatchPanel').style.display = isPhotos ? 'flex' : 'none';
    // Ocultar opciones irrelevantes en modo fotos
    const countryRow = document.getElementById('fluxBatchCountryRow');
    const qtyRow = document.getElementById('fluxBatchQtyRow');
    if (countryRow) countryRow.style.display = isPhotos ? 'none' : 'block';
    if (qtyRow) qtyRow.style.display = isPhotos ? 'none' : 'block';
    const stActive = 'flex:1;padding:0.38rem 0.6rem;border:none;border-radius:7px;font-size:0.8rem;font-weight:700;cursor:pointer;background:white;color:#1e293b;box-shadow:0 1px 3px rgba(0,0,0,0.1);';
    const stInactive = 'flex:1;padding:0.38rem 0.6rem;border:none;border-radius:7px;font-size:0.8rem;font-weight:700;cursor:pointer;background:transparent;color:#64748b;';
    document.getElementById('loteSubTabList').style.cssText = isPhotos ? stInactive : stActive;
    document.getElementById('loteSubTabPhotos').style.cssText = isPhotos ? stActive : stInactive;
    document.getElementById('fluxBatchGenerateBtn').textContent = isPhotos ? '✨ Generar e insertar IA' : '✨ Generar todo';
  };

  function groupPhotosBySkuFromFiles(files) {
    const groups = {};
    const rejected = [];
    for (const file of files) {
      // Acepta: 73541603_1.jpg · 73541603_01.jpg · 73541603_1_extra.jpg · 73541603-1.jpg
      const match = file.name.trim().match(/^(\d{5,})[_-](\d+)/);
      if (!match) { rejected.push(file.name); continue; }
      const sku = match[1];
      const num = parseInt(match[2], 10);
      const ext = file.name.split('.').pop().toLowerCase();
      if (!groups[sku]) groups[sku] = [];
      groups[sku].push({ file, num, ext });
    }
    for (const sku in groups) groups[sku].sort((a, b) => a.num - b.num);
    return { groups, rejected };
  }

  function renderPhotosBatchPreview(groups, rejected = []) {
    const preview = document.getElementById('fluxPhotosBatchPreview');
    const skus = Object.keys(groups);

    // Sin ningún archivo reconocido: avisar en vez de no mostrar nada.
    if (!skus.length) {
      if (!rejected.length) { preview.style.display = 'none'; return; }
      preview.style.display = 'block';
      const sample = rejected.slice(0, 4).map(n => `<code>${n}</code>`).join(', ');
      preview.innerHTML = `
        <div style="padding:0.75rem;background:#fff5f5;border:1px solid #fecaca;border-radius:10px;">
          <div style="font-size:0.82rem;font-weight:700;color:#dc2626;margin-bottom:0.3rem;">⚠️ Ningún archivo tiene el nombre esperado</div>
          <p style="font-size:0.76rem;color:#78350f;margin:0 0 0.35rem;line-height:1.5;">
            Deben llamarse <strong>SKU_N.ext</strong> (ej: <code>73541603_1.jpg</code>). El SKU debe tener 5 o más dígitos, seguido de <code>_</code> o <code>-</code> y el número de foto.
          </p>
          <p style="font-size:0.72rem;color:#94a3b8;margin:0;">Archivos recibidos: ${sample}${rejected.length > 4 ? ` y ${rejected.length - 4} más` : ''}</p>
        </div>`;
      return;
    }

    const totalFiles = Object.values(groups).reduce((s, a) => s + a.length, 0);
    const rejectedNote = rejected.length
      ? `<div style="font-size:0.7rem;color:#dc2626;padding:0.35rem 0.75rem;background:#fff5f5;border-bottom:1px solid #fecaca;">⚠️ ${rejected.length} archivo(s) ignorado(s) por nombre no reconocido: ${rejected.slice(0, 3).map(n => `<code>${n}</code>`).join(', ')}${rejected.length > 3 ? '…' : ''}</div>`
      : '';

    preview.style.display = 'block';
    preview.innerHTML = `
      <div style="font-size:0.72rem;font-weight:700;color:#94a3b8;padding:0.4rem 0.75rem;background:#f8fafc;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;">
        <span>${skus.length} SKUs · ${totalFiles} fotos</span>
        <span style="color:#6366f1;">📸 Ultra-realista automático</span>
      </div>
      ${rejectedNote}
      ${skus.map(sku => {
        const p = groups[sku];
        const nums = p.map(x => x.num);
        return `
          <div style="padding:0.55rem 0.75rem;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;">
            <span style="font-size:0.82rem;font-weight:700;color:#1e293b;">📦 ${sku}</span>
            <span style="font-size:0.72rem;color:#64748b;">${p.length} fotos · _${Math.min(...nums)} a _${Math.max(...nums)}</span>
          </div>`;
      }).join('')}
    `;
  }

  function loadPhotosFiles(files) {
    const { groups, rejected } = groupPhotosBySkuFromFiles(Array.from(files));
    photosBatchGroups = groups;
    renderPhotosBatchPreview(photosBatchGroups, rejected);
  }

  document.getElementById('fluxPhotosFileInput').addEventListener('change', e => {
    loadPhotosFiles(e.target.files);
  });

  // Selector cantidad fotos IA (1 o 2) — actualiza estilos y hint
  function updateAiCountUI() {
    const val = document.querySelector('input[name="fluxPhotosAiCount"]:checked')?.value || '1';
    const lbl1 = document.getElementById('fluxPhotosAiCount1Label');
    const lbl2 = document.getElementById('fluxPhotosAiCount2Label');
    const hint = document.getElementById('fluxPhotosAiCountHint');
    if (lbl1) {
      lbl1.style.borderColor = val === '1' ? '#6366f1' : '#e2e8f0';
      lbl1.style.background  = val === '1' ? '#eef2ff' : '#f8fafc';
    }
    if (lbl2) {
      lbl2.style.borderColor = val === '2' ? '#6366f1' : '#e2e8f0';
      lbl2.style.background  = val === '2' ? '#eef2ff' : '#f8fafc';
    }
    if (hint) {
      hint.innerHTML = val === '1'
        ? '💡 Ejemplo (1 IA): subir _1 a _8 → resultado: _1 <strong style="color:#6366f1">_2(IA)</strong> _3 _4 _5 _6 _7 _8 _9<br>📁 ZIP organizado en subcarpetas por SKU'
        : '💡 Ejemplo (2 IA): subir _1 a _8 → resultado: _1 <strong style="color:#6366f1">_2 _3(IA)</strong> _4 _5 _6 _7 _8 _9 _10<br>📁 ZIP organizado en subcarpetas por SKU';
    }
  }
  document.querySelectorAll('input[name="fluxPhotosAiCount"]').forEach(r => r.addEventListener('change', updateAiCountUI));

  window.handlePhotosDrop = function(e) {
    e.preventDefault();
    document.getElementById('fluxPhotosDropZone').style.background = '#f8faff';
    loadPhotosFiles(e.dataTransfer.files);
  };

  // ZIP pendiente de descarga (modo Por Fotos)
  let photosBatchZipBlob = null;

  // Store de imágenes IA generadas: { key → { dataUrl, b64, mimeType, sku, slot } }
  const pbImgStore = {};
  // Datos de referencia por SKU para poder regenerar: { sku → { refImg, prompt, aspectRatio, imageSize } }
  const pbSkuData = {};

  window.__pbOpen = function(key) {
    const entry = pbImgStore[key];
    if (!entry) return;
    openLightbox(entry.dataUrl, entry.dataUrl, `${entry.sku}_${entry.slot}_IA.jpg`);
  };

  window.__pbRegen = async function(sku, slot, key) {
    const data = pbSkuData[sku];
    if (!data) return;
    const btn = document.querySelector(`[data-regen-key="${key}"]`);
    const img = document.querySelector(`[data-pb-key="${key}"]`);
    if (btn) { btn.textContent = '⏳'; btn.disabled = true; }

    try {
      const parts = [
        { inlineData: { data: data.refImg.b64, mimeType: data.refImg.mime } },
        ...(data.prompt ? [{ text: data.prompt }] : []),
      ];
      const payload = {
        model: 'gemini-3.1-flash-image',
        contents: [{ parts }],
        config: { imageConfig: { aspectRatio: data.aspectRatio, imageSize: data.imageSize } },
      };
      const res = await callFlux(payload);
      for (const c of (res.candidates || [])) {
        for (const p of (c.content?.parts || [])) {
          if (!p.inlineData) continue;
          const newUrl = `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`;
          // Actualizar store
          pbImgStore[key] = { dataUrl: newUrl, b64: p.inlineData.data, mimeType: p.inlineData.mimeType, sku, slot };
          // Actualizar imagen en pantalla
          if (img) img.src = newUrl;
          // Actualizar en el ZIP si existe
          if (photosBatchZipBlob) {
            // Marcar ZIP como desactualizado
            const dlBtn = document.getElementById('fluxBatchDownloadZip');
            if (dlBtn) dlBtn.textContent = `⬇️ Descargar ZIP (actualizar)`;
            photosBatchZipBlob = null;
          }
          break;
        }
        break;
      }
    } catch(e) { console.error('Regen error:', e); }
    if (btn) { btn.textContent = '🔄'; btn.disabled = false; }
  };

  // Realism base — siempre aplicado a TODAS las generaciones de Por Fotos
  const REALISM_PROMPT = 'ultra-realistic photorealistic professional commercial photography, shot on DSLR camera, natural lighting, sharp focus, high detail, not illustrated, not AI-looking, real photograph quality';

  // Generar e insertar IA por fotos
  async function runPhotosBatch() {
    const skus = Object.keys(photosBatchGroups);
    if (!skus.length) {
      alert('Primero carga las fotos de los productos.');
      return;
    }

    const basePrompt = document.getElementById('fluxBatchBasePrompt').value.trim();
    const aspectRatio = document.querySelector('input[name="fluxBatchAspect"]:checked')?.value || '1:1';
    const imageSize   = document.querySelector('input[name="fluxBatchSize"]:checked')?.value || '1K';
    const batchStyleReference = fluxBatchStyleReferenceFile ? await fileToBase64(fluxBatchStyleReferenceFile) : null;
    const styleReferencePrompt = batchStyleReference ? 'usa la última imagen como referencia de estilo visual, pero conserva la identidad del producto de la primera imagen' : '';

    const progressDiv = document.getElementById('fluxBatchProgress');
    const statusMsg   = document.getElementById('fluxBatchStatusMsg');
    const counterEl   = document.getElementById('fluxBatchCounter');
    const progressBar = document.getElementById('fluxBatchProgressBar');
    progressDiv.style.display = 'block';

    const aiCountSel = parseInt(document.querySelector('input[name="fluxPhotosAiCount"]:checked')?.value || '1', 10);
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    const INSERT_AT = aiCountSel === 2 ? [2, 3] : [2]; // posiciones IA según selección
    const minInsert = Math.min(...INSERT_AT); // siempre 2
    const shift = INSERT_AT.length;           // 1 o 2

    let processed = 0;
    let totalAiGenerated = 0;

    // Limpiar resultados anteriores y ocultar botón descarga
    const resultsEl = document.getElementById('fluxBatchResults');
    const tableEl   = document.getElementById('fluxBatchTable');
    const dlBtn     = document.getElementById('fluxBatchDownloadZip');
    resultsEl.innerHTML = '';
    resultsEl.style.gridTemplateColumns = '1fr'; // una columna para cards amplias
    tableEl.style.display = 'none';
    dlBtn.style.display = 'none';
    photosBatchZipBlob = null;

    for (const sku of skus) {
      const photos = photosBatchGroups[sku];
      statusMsg.textContent = `🎨 Generando IA para SKU ${sku}…`;
      counterEl.textContent = `${processed + 1} / ${skus.length}`;
      progressBar.style.width = `${Math.round((processed / skus.length) * 88)}%`;

      // Foto de referencia: la _1 (primera)
      let refImg = null;
      try { refImg = await fileToBase64(photos[0].file); } catch(e) {}

      // Generar 2 imágenes IA en paralelo
      let aiImages = [];
      if (refImg) {
        try {
          const fullPrompt = [REALISM_PROMPT, basePrompt, styleReferencePrompt].filter(Boolean).join('. ');

          const parts = [
            { inlineData: { data: refImg.b64, mimeType: refImg.mime } },
            ...(batchStyleReference ? [{ inlineData: { data: batchStyleReference.b64, mimeType: batchStyleReference.mime } }] : []),
            { text: fullPrompt },
          ];
          const payload = {
            model: 'gemini-3.1-flash-image',
            contents: [{ parts }],
            config: { imageConfig: { aspectRatio, imageSize } },
          };
          const fluxCalls = aiCountSel === 2
            ? [callFlux(payload), callFlux(payload)]
            : [callFlux(payload)];
          const fluxResults = await Promise.allSettled(fluxCalls);
          for (const res of fluxResults) {
            if (res.status !== 'fulfilled') continue;
            for (const c of (res.value.candidates || []))
              for (const p of (c.content?.parts || []))
                if (p.inlineData) aiImages.push(p.inlineData);
          }
        } catch(e) { console.warn(`[Photos Lote] ${sku}:`, e.message); }
      }

      // ── Construir ZIP: subcarpeta por SKU ────────────────────────────────
      const folder = zip.folder(sku);

      // Originales: _1 queda en _1; desde _2 en adelante se corre +2
      for (const photo of photos) {
        const newNum = photo.num < minInsert ? photo.num : photo.num + shift;
        folder.file(`${sku}_${newNum}.${photo.ext}`, photo.file);
      }

      // IA en posiciones 2 y 3
      for (let i = 0; i < INSERT_AT.length; i++) {
        if (!aiImages[i]) continue;
        const ext = (aiImages[i].mimeType || 'image/jpeg').split('/')[1] || 'jpg';
        const bin = atob(aiImages[i].data);
        const arr = new Uint8Array(bin.length);
        for (let j = 0; j < bin.length; j++) arr[j] = bin.charCodeAt(j);
        folder.file(`${sku}_${INSERT_AT[i]}.${ext}`, arr);
        totalAiGenerated++;
      }

      // ── Guardar en store para lightbox y regenerar ───────────────────────
      const fullPromptForCard = [REALISM_PROMPT, basePrompt, styleReferencePrompt].filter(Boolean).join('. ');
      pbSkuData[sku] = { refImg, prompt: fullPromptForCard, aspectRatio, imageSize };

      const key1 = `${sku}_2`;
      const key2 = `${sku}_3`;
      if (aiImages[0]) {
        pbImgStore[key1] = { dataUrl: `data:${aiImages[0].mimeType};base64,${aiImages[0].data}`, b64: aiImages[0].data, mimeType: aiImages[0].mimeType, sku, slot: 2 };
      }
      if (aiCountSel === 2 && aiImages[1]) {
        pbImgStore[key2] = { dataUrl: `data:${aiImages[1].mimeType};base64,${aiImages[1].data}`, b64: aiImages[1].data, mimeType: aiImages[1].mimeType, sku, slot: 3 };
      }

      // Miniaturas de todas las fotos originales
      const originalThumbs = await Promise.all(
        photos.slice(0, 8).map(async (p) => {
          const newNum = p.num < minInsert ? p.num : p.num + shift;
          try {
            const b = await fileToBase64(p.file);
            return `<div style="text-align:center;flex-shrink:0;">
              <img src="data:${b.mime};base64,${b.b64}" style="width:60px;height:60px;object-fit:contain;border-radius:6px;background:#f8fafc;border:1px solid #e2e8f0;">
              <div style="font-size:0.6rem;color:#94a3b8;margin-top:2px;">_${newNum}</div>
            </div>`;
          } catch { return ''; }
        })
      );

      // ── Construir card con DOM (listeners reales, no onclick inline) ──────
      const card = document.createElement('div');
      card.style.cssText = 'background:white;border:1px solid #e2e8f0;border-radius:14px;padding:1rem;margin-bottom:0.75rem;';
      card.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem;">
          <div style="font-size:0.85rem;font-weight:700;color:#1e293b;">📦 ${sku}</div>
          <div style="font-size:0.75rem;color:#16a34a;font-weight:600;">✅ ${aiImages.length} IA · ${photos.length + aiImages.length} archivos en ZIP</div>
        </div>

        <div style="font-size:0.68rem;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.5rem;">
          🤖 Imágenes IA <span style="font-weight:400;color:#94a3b8;text-transform:none;">· clic para ampliar</span>
        </div>
        <div style="display:flex;gap:0.75rem;margin-bottom:0.9rem;flex-wrap:wrap;">
          ${aiImages[0] ? `
          <div style="text-align:center;">
            <img data-pb-key="${key1}" src="${pbImgStore[key1].dataUrl}"
              style="width:150px;height:150px;object-fit:contain;border-radius:10px;background:#f0f0ff;border:2px solid #6366f1;cursor:zoom-in;display:block;">
            <div style="display:flex;align-items:center;justify-content:center;gap:0.3rem;margin-top:0.35rem;">
              <span style="font-size:0.68rem;color:#6366f1;font-weight:600;">_2 (IA)</span>
              <button data-regen-key="${key1}" style="font-size:0.65rem;padding:0.1rem 0.35rem;border:1px solid #e2e8f0;border-radius:5px;background:#f8fafc;cursor:pointer;color:#64748b;" title="Regenerar esta imagen">🔄</button>
            </div>
          </div>` : `<div style="font-size:0.75rem;color:#f87171;padding:0.5rem;align-self:center;">❌ IA no generada</div>`}
          ${aiCountSel === 2 && aiImages[1] ? `
          <div style="text-align:center;">
            <img data-pb-key="${key2}" src="${pbImgStore[key2].dataUrl}"
              style="width:150px;height:150px;object-fit:contain;border-radius:10px;background:#f0f0ff;border:2px solid #8b5cf6;cursor:zoom-in;display:block;">
            <div style="display:flex;align-items:center;justify-content:center;gap:0.3rem;margin-top:0.35rem;">
              <span style="font-size:0.68rem;color:#8b5cf6;font-weight:600;">_3 (IA)</span>
              <button data-regen-key="${key2}" style="font-size:0.65rem;padding:0.1rem 0.35rem;border:1px solid #e2e8f0;border-radius:5px;background:#f8fafc;cursor:pointer;color:#64748b;" title="Regenerar esta imagen">🔄</button>
            </div>
          </div>` : ''}
        </div>

        <div style="font-size:0.68rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.4rem;">📂 Originales renombradas</div>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          ${originalThumbs.join('')}
          ${photos.length > 8 ? `<div style="font-size:0.72rem;color:#94a3b8;align-self:center;">+${photos.length - 8} más</div>` : ''}
        </div>
      `;

      // Listeners: ampliar (lightbox) y regenerar
      card.querySelectorAll('img[data-pb-key]').forEach(img => {
        img.style.transition = 'transform 0.15s';
        img.addEventListener('click', () => window.__pbOpen(img.dataset.pbKey));
        img.addEventListener('mouseover', () => { img.style.transform = 'scale(1.04)'; });
        img.addEventListener('mouseout',  () => { img.style.transform = 'scale(1)'; });
      });
      card.querySelectorAll('button[data-regen-key]').forEach(btn => {
        const k = btn.dataset.regenKey;
        const slotNum = parseInt(k.split('_').pop());
        btn.addEventListener('click', (e) => { e.stopPropagation(); window.__pbRegen(sku, slotNum, k); });
      });

      resultsEl.appendChild(card);

      processed++;
    }

    // ── Compilar ZIP ────────────────────────────────────────────────────────
    statusMsg.textContent = '📦 Compilando ZIP…';
    progressBar.style.width = '95%';

    photosBatchZipBlob = await zip.generateAsync({ type: 'blob' });

    progressBar.style.width = '100%';
    statusMsg.textContent = `✅ ${processed} SKU${processed !== 1 ? 's' : ''} listos · ${totalAiGenerated} fotos IA · ZIP listo para descargar`;
    counterEl.textContent = '';

    // Mostrar botón descarga en la zona de tabla
    tableEl.style.display = 'block';
    document.getElementById('fluxBatchTableLabel').textContent = `${processed} SKUs generados — ${totalAiGenerated} fotos IA`;
    dlBtn.style.display = 'inline-flex';
    dlBtn.textContent = `⬇️ Descargar ZIP (${skus.length} SKUs)`;

    logGeneration({ skus, imageCount: totalAiGenerated, mode: 'fotos-lote' });
  }

  // Botón descarga del ZIP de fotos
  document.getElementById('fluxBatchDownloadZip')?.addEventListener('click', async () => {
    if (photosLoteActive && photosBatchZipBlob) {
      const dateStr = new Date().toISOString().slice(0, 10);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(photosBatchZipBlob);
      a.download = `flux_fotos_ia_${dateStr}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }
  }, true); // capture para ir antes del handler existente del ZIP de lote por SKU

  // Override del botón generar para detectar qué modo está activo
  const batchGenBtn = document.getElementById('fluxBatchGenerateBtn');
  if (batchGenBtn) {
    batchGenBtn.addEventListener('click', async (e) => {
      if (photosLoteActive) {
        e.stopImmediatePropagation();
        await runPhotosBatch();
      }
      // Si no es modo fotos, el handler existente se ejecuta normalmente
    }, true);
  }
}
