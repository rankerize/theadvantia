import { getFunctions, httpsCallable } from 'firebase/functions';

let productPhotos = [];

export function initProductTemplate() {
  const dropZone = document.getElementById('ptDropZone');
  const fileInput = document.getElementById('ptFileInput');
  if (!dropZone) return;

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
  });
  fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

  document.getElementById('btnProcessProductPhotos')?.addEventListener('click', async () => {
    const btn = document.getElementById('btnProcessProductPhotos');
    const status = document.getElementById('ptStatus');
    btn.disabled = true;
    if (status) status.textContent = 'Analizando imágenes con IA...';

    try {
      const functions = getFunctions();
      const analyzePhotos = httpsCallable(functions, 'analyzeProductPhotos');
      const imagesData = productPhotos.map(p => p.base64.split(',')[1]);
      const { data } = await analyzePhotos({ images: imagesData });

      if (data.success) {
        displayResults(data.analysis);
        logUserActivity('product_template_analysis', { photosCount: productPhotos.length });
        if (status) status.textContent = '';
      } else {
        throw new Error(data.error || 'Error en el análisis');
      }
    } catch (err) {
      alert('Error al analizar: ' + err.message);
      if (status) status.textContent = '';
    } finally {
      btn.disabled = false;
    }
  });

  document.getElementById('btnCopyProductData')?.addEventListener('click', () => {
    const title = document.getElementById('resProductTitle')?.textContent?.trim() || '';
    const desc = document.getElementById('resProductDesc')?.textContent?.trim() || '';
    const rows = document.querySelectorAll('#resProductAttrTable tr');
    const attrLines = [];
    rows.forEach(tr => {
      const cells = tr.querySelectorAll('td');
      if (cells.length >= 2) {
        attrLines.push(`${cells[0].textContent.trim()}: ${cells[1].textContent.trim()}`);
      }
    });
    const fullText = `TITULO:\n${title}\n\nDESCRIPCION:\n${desc}\n\nATRIBUTOS:\n${attrLines.join('\n')}`;
    navigator.clipboard.writeText(fullText);
    alert('Copiado al portapapeles');
  });

  document.getElementById('btnDownloadProductJson')?.addEventListener('click', () => {
    const title = document.getElementById('resProductTitle')?.textContent?.trim() || '';
    const desc = document.getElementById('resProductDesc')?.textContent?.trim() || '';
    const rows = document.querySelectorAll('#resProductAttrTable tr');
    const attributes = [];
    rows.forEach(tr => {
      const cells = tr.querySelectorAll('td');
      if (cells.length >= 2) {
        attributes.push({ name: cells[0].textContent.trim(), value: cells[1].textContent.trim() });
      }
    });
    const payload = { title, desc, attributes };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

async function compressImage(base64Str) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 800;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round((h * MAX) / w); w = MAX; }
        else { w = Math.round((w * MAX) / h); h = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.src = base64Str;
  });
}

function handleFiles(files) {
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const compressed = await compressImage(e.target.result);
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      productPhotos.push({ id, file, base64: compressed });
      renderPreviews();
    };
    reader.readAsDataURL(file);
  });
}

function renderPreviews() {
  const grid = document.getElementById('ptPreviewGrid');
  const btn = document.getElementById('btnProcessProductPhotos');
  if (!grid) return;
  grid.innerHTML = '';
  productPhotos.forEach(p => {
    const div = document.createElement('div');
    div.className = 'pt-thumb';
    div.innerHTML = `
      <img src="${p.base64}" alt="preview" style="width:80px;height:80px;object-fit:cover;border-radius:8px;" />
      <button onclick="window._ptRemove('${p.id}')" style="position:absolute;top:2px;right:2px;background:#ef4444;color:white;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;font-size:12px;line-height:1;">×</button>
    `;
    div.style.position = 'relative';
    div.style.display = 'inline-block';
    grid.appendChild(div);
  });
  if (btn) btn.disabled = productPhotos.length === 0;

  window._ptRemove = (id) => {
    productPhotos = productPhotos.filter(p => p.id !== id);
    renderPreviews();
  };
}

function displayResults(analysis) {
  const titleEl = document.getElementById('resProductTitle');
  const descEl = document.getElementById('resProductDesc');
  const table = document.getElementById('resProductAttrTable');
  const resultsSection = document.getElementById('ptResultsSection');

  if (titleEl) { titleEl.textContent = analysis.title || ''; titleEl.contentEditable = true; }
  if (descEl) { descEl.textContent = analysis.description || ''; descEl.contentEditable = true; }
  if (table) {
    table.innerHTML = '';
    (analysis.attributes || []).forEach(attr => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td contenteditable="true" style="padding:6px 10px;border:1px solid #e2e8f0;">${escHtml(attr.name)}</td>
        <td contenteditable="true" style="padding:6px 10px;border:1px solid #e2e8f0;">${escHtml(attr.value)}</td>
      `;
      table.appendChild(tr);
    });
  }
  if (resultsSection) resultsSection.style.display = 'block';
  window.lastProductAnalysis = analysis;
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
