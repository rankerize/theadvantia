import { removeBackground as imglyRemoveBackground } from '@imgly/background-removal';
import { logUserActivity } from '/analytics.js';

let uploadedImages = [];
let processedCount = 0;
let failedCount = 0;
let isProcessing = false;
let currentPreviewId = null;

const CHECKERBOARD_BG = 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYBwhmE1wMhAQ3E0DBAxYMBwAwCR0B/yYkK2qQAAAABJRU5ErkJggg==")';
const IMG_LY_PUBLIC_PATH = 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/';

export function initBgRemover() {
  const dropZone = document.getElementById('bgDropZone');
  const uploadButton = document.getElementById('bgUploadButton');
  const fileInput = document.getElementById('bgFileInput');
  const resultsGrid = document.getElementById('bgResultsGrid');
  const exportControls = document.getElementById('bgExportControls');
  const btnRemoveAll = document.getElementById('btnBgRemoveAll');
  const btnDownloadZip = document.getElementById('btnBgDownloadZip');
  const progressContainer = document.getElementById('bgProgressContainer');
  const progressBar = document.getElementById('bgProgressBar');
  const progressText = document.getElementById('bgProgressText');
  const progressCount = document.getElementById('bgProgressCount');
  const initialLoadWarning = document.getElementById('bgInitialLoadWarning');
  const btnClearAll = document.getElementById('btnBgClearAll');
  const previewPanel = document.getElementById('bgPreviewPanel');
  const previewTitle = document.getElementById('bgPreviewTitle');
  const previewSubtitle = document.getElementById('bgPreviewSubtitle');
  const previewBadge = document.getElementById('bgPreviewBadge');
  const previewOriginalImg = document.getElementById('bgPreviewOriginalImg');
  const previewResultWrap = document.getElementById('bgPreviewResultWrap');
  const previewResultImg = document.getElementById('bgPreviewResultImg');
  const previewEmpty = document.getElementById('bgPreviewEmpty');
  const previewDownloadBtn = document.getElementById('bgPreviewDownloadBtn');
  const previewTouchUpBtn = document.getElementById('bgPreviewTouchUpBtn');
  const previewOpenCardBtn = document.getElementById('bgPreviewOpenCardBtn');

  if (!dropZone) return;

  function revokeImageUrls(imgData) {
    if (!imgData) return;
    if (imgData.originalUrl) URL.revokeObjectURL(imgData.originalUrl);
    if (imgData.resultUrl) URL.revokeObjectURL(imgData.resultUrl);
  }

  function getSelectedExportFormat() {
    return document.querySelector('input[name="bgExportFormat"]:checked')?.value || 'jpg';
  }

  function getCompletedImages() {
    return uploadedImages.filter(img => img.resultBlob);
  }

  function updateBatchActions() {
    const completedImages = getCompletedImages();
    btnDownloadZip.disabled = completedImages.length === 0 || isProcessing;
    btnDownloadZip.style.opacity = btnDownloadZip.disabled ? '0.6' : '1';
    btnDownloadZip.style.cursor = btnDownloadZip.disabled ? 'not-allowed' : 'pointer';
  }

  function setCardStatus(id, status, message = '') {
    const statusEl = document.getElementById(`bg-status-${id}`);
    if (!statusEl) return;
    const styles = {
      pending: { text: 'Pendiente', bg: '#f1f5f9', color: '#64748b' },
      processing: { text: 'Procesando...', bg: '#dbeafe', color: '#1d4ed8' },
      done: { text: 'Listo', bg: '#dcfce7', color: '#15803d' },
      error: { text: message || 'Error', bg: '#fee2e2', color: '#b91c1c' }
    };
    const style = styles[status] || styles.pending;
    statusEl.textContent = style.text;
    statusEl.title = message || style.text;
    statusEl.style.background = style.bg;
    statusEl.style.color = style.color;
  }

  if (uploadButton && fileInput) {
    uploadButton.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });
  }

  const formatRadios = document.querySelectorAll('input[name="bgExportFormat"]');

  function updateFormatPillStyles() {
    formatRadios.forEach(radio => {
      const label = radio.closest('label');
      const pill = label?.querySelector('.format-pill');
      if (!pill) return;
      if (radio.checked) {
        pill.classList.add('active-pill');
        pill.style.background = '#ffffff';
        pill.style.color = '#0f172a';
        pill.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      } else {
        pill.classList.remove('active-pill');
        pill.style.background = 'transparent';
        pill.style.color = '#475569';
        pill.style.boxShadow = 'none';
      }
    });
  }

  formatRadios.forEach(radio => {
    radio.addEventListener('change', async () => {
      updateFormatPillStyles();
      const newFormat = radio.value;

      for (const imgData of uploadedImages) {
        if (!imgData.transparentBlob) continue;
        
        try {
          const finalBlob = await processFormat(imgData.transparentBlob, newFormat);
          if (imgData.resultUrl) URL.revokeObjectURL(imgData.resultUrl);

          const finalUrl = URL.createObjectURL(finalBlob);
          imgData.resultBlob = finalBlob;
          imgData.resultUrl = finalUrl;
          imgData.resultFormat = newFormat;

          const imgEl = document.getElementById(`bg-img-${imgData.id}`);
          if (imgEl) {
            imgEl.src = finalUrl;
            imgEl.parentElement.style.background = newFormat === 'png' ? CHECKERBOARD_BG : '#ffffff';
          }

          const btnDownload = document.getElementById(`bg-download-${imgData.id}`);
          if (btnDownload) {
            btnDownload.onclick = () => {
              const dlUrl = URL.createObjectURL(finalBlob);
              const a = document.createElement('a');
              a.href = dlUrl;
              a.download = `bg-removed-${imgData.file.name.replace(/\.[^/.]+$/, "")}.${newFormat === 'png' ? 'png' : 'jpg'}`;
              a.click();
              URL.revokeObjectURL(dlUrl);
            };
          }
        } catch (err) {
          console.error('Error al cambiar formato de exportación:', err);
        }
      }

      if (currentPreviewId) {
        const activeImg = getImageById(currentPreviewId);
        if (activeImg) {
          setPreview(activeImg, newFormat, activeImg.resultBlob ? (newFormat === 'png' ? 'Transparente' : 'Fondo blanco') : 'Pendiente');
        }
      }
    });
  });

  updateFormatPillStyles();

  function clearAll() {
    uploadedImages.forEach(revokeImageUrls);
    uploadedImages = [];
    processedCount = 0;
    failedCount = 0;
    currentPreviewId = null;
    resultsGrid.innerHTML = '';
    exportControls.style.display = 'none';
    progressContainer.style.display = 'none';
    progressBar.style.width = '0%';
    progressBar.style.background = '#0284c7';
    progressText.innerText = 'Procesando imágenes...';
    progressCount.innerText = '0 / 0';
    updateBatchActions();
    btnClearAll.style.display = 'none';
    fileInput.value = '';
    if (previewPanel) {
      previewTitle && (previewTitle.textContent = 'Vista previa');
      previewSubtitle && (previewSubtitle.textContent = 'Sube fotos a la izquierda para procesarlas y ver el resultado aquí.');
      previewBadge && (previewBadge.textContent = 'Sin foto');
      if (previewResultImg) previewResultImg.style.display = 'none';
      if (previewEmpty) previewEmpty.style.display = 'block';
      if (previewDownloadBtn) {
        previewDownloadBtn.disabled = true;
        previewDownloadBtn.style.opacity = '0.6';
        previewDownloadBtn.style.cursor = 'not-allowed';
      }
      if (previewTouchUpBtn) {
        previewTouchUpBtn.disabled = true;
        previewTouchUpBtn.style.opacity = '0.6';
        previewTouchUpBtn.style.cursor = 'not-allowed';
      }
    }
  }

  btnClearAll.addEventListener('click', clearAll);

  // Drag and Drop Events
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.backgroundColor = '#e0f2fe';
    dropZone.style.borderColor = '#3b82f6';
  });

  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.style.backgroundColor = '#f8fafc';
    dropZone.style.borderColor = '#cbd5e1';
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.backgroundColor = '#f8fafc';
    dropZone.style.borderColor = '#cbd5e1';
    
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  });

  function handleFiles(files) {
    if (isProcessing) return alert("Por favor espera a que termine el procesamiento actual.");

    const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (newFiles.length === 0) return;

    // Si ya hubo una sesión previa completada, limpiar antes de empezar de nuevo
    if (uploadedImages.length > 0 && uploadedImages.every(img => img.resultBlob)) {
      uploadedImages.forEach(revokeImageUrls);
      uploadedImages = [];
      processedCount = 0;
      failedCount = 0;
      currentPreviewId = null;
      resultsGrid.innerHTML = '';
      progressContainer.style.display = 'none';
      progressBar.style.width = '0%';
      progressBar.style.background = '#0284c7';
      progressText.innerText = 'Procesando imágenes...';
      updateBatchActions();
    }

    exportControls.style.display = 'flex';
    btnClearAll.style.display = 'inline-flex';

    newFiles.forEach(file => {
      const url = URL.createObjectURL(file);
      const id = Date.now() + Math.random().toString(36).substring(2);
      uploadedImages.push({ id, file, originalUrl: url, resultBlob: null, resultUrl: null, resultFormat: null });
      renderCard(id, url, file.name);
      if (!currentPreviewId) {
        setPreview(uploadedImages[uploadedImages.length - 1], null, 'Pendiente');
      }
    });
  }

  function getImageById(id) {
    return uploadedImages.find(img => img.id === id) || null;
  }

  function setPreview(imgData, exportFormat = null, badgeText = null) {
    if (!previewPanel || !previewOriginalImg || !previewResultWrap || !previewResultImg || !previewEmpty || !previewDownloadBtn) return;
    if (!imgData) return;

    currentPreviewId = imgData.id || currentPreviewId;
    previewPanel.style.display = 'block';
    previewTitle && (previewTitle.textContent = imgData.file?.name ? `Vista previa: ${imgData.file.name}` : 'Vista previa');
    previewSubtitle && (previewSubtitle.textContent = imgData.resultBlob ? 'Así quedará la imagen antes de descargarla.' : 'Vista previa de la imagen cargada. Haz clic en "Iniciar procesamiento" para quitar el fondo.');
    const actualFormat = imgData.resultFormat || exportFormat || 'jpg';
    previewBadge && (previewBadge.textContent = badgeText || (imgData.resultBlob ? (actualFormat === 'png' ? 'Transparente' : 'Fondo blanco') : 'Pendiente'));

    if (previewTouchUpBtn) {
      previewTouchUpBtn.disabled = !imgData.originalUrl;
      previewTouchUpBtn.style.opacity = imgData.originalUrl ? '1' : '0.6';
      previewTouchUpBtn.style.cursor = imgData.originalUrl ? 'pointer' : 'not-allowed';
      previewTouchUpBtn.onclick = () => openTouchUpModal(imgData);
    }

    if (previewOriginalImg) previewOriginalImg.src = imgData.originalUrl || '';
    if (imgData.resultUrl) {
      previewResultImg.src = imgData.resultUrl;
      previewResultImg.style.display = 'block';
      previewEmpty.style.display = 'none';
      previewDownloadBtn.disabled = false;
      previewDownloadBtn.style.opacity = '1';
      previewDownloadBtn.style.cursor = 'pointer';
    } else if (imgData.originalUrl) {
      previewResultImg.src = imgData.originalUrl;
      previewResultImg.style.display = 'block';
      previewEmpty.style.display = 'none';
      previewDownloadBtn.disabled = true;
      previewDownloadBtn.style.opacity = '0.6';
      previewDownloadBtn.style.cursor = 'not-allowed';
    } else {
      previewResultImg.removeAttribute('src');
      previewResultImg.style.display = 'none';
      previewEmpty.style.display = 'block';
      previewDownloadBtn.disabled = true;
      previewDownloadBtn.style.opacity = '0.6';
      previewDownloadBtn.style.cursor = 'not-allowed';
    }

    document.querySelectorAll('[data-bg-selected="true"]').forEach(el => {
      el.dataset.bgSelected = 'false';
      el.style.outline = '';
      el.style.boxShadow = '';
      el.style.transform = '';
    });
    const activeCard = document.getElementById(`bg-card-${imgData.id}`);
    if (activeCard) {
      activeCard.dataset.bgSelected = 'true';
      activeCard.style.outline = '2px solid #0284c7';
      activeCard.style.boxShadow = '0 6px 16px rgba(2,132,199,0.15)';
      activeCard.style.transform = 'translateY(-1px)';
    }

    if (imgData.resultBlob && actualFormat === 'png') {
      previewResultWrap.style.background = 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYBwhmE1wMhAQ3E0DBAxYMBwAwCR0B/yYkK2qQAAAABJRU5ErkJggg==")';
    } else {
      previewResultWrap.style.background = '#f8fafc';
    }

    previewDownloadBtn.onclick = () => {
      if (!imgData.resultBlob) return;
      const dlUrl = URL.createObjectURL(imgData.resultBlob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = `bg-removed-${imgData.file.name.replace(/\.[^/.]+$/, "")}.${actualFormat === 'png' ? 'png' : 'jpg'}`;
      a.click();
      URL.revokeObjectURL(dlUrl);
    };

    if (previewOpenCardBtn) {
      previewOpenCardBtn.onclick = () => {
        const card = document.getElementById(`bg-card-${imgData.id}`);
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      };
    }
  }

  function renderCard(id, url, filename) {
    const card = document.createElement('div');
    card.id = `bg-card-${id}`;
    card.className = 'card';
    card.style.padding = '0';
    card.style.overflow = 'hidden';
    card.style.position = 'relative';
    card.style.width = '130px';
    card.style.minWidth = '130px';
    card.style.maxWidth = '130px';
    card.style.flex = '0 0 130px';
    card.style.cursor = 'pointer';
    card.style.borderRadius = '14px';
    card.style.border = '1px solid #e2e8f0';
    card.style.transition = 'all 0.2s ease';

    card.innerHTML = `
      <div style="height: 110px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; position: relative;">
        <img id="bg-img-${id}" src="${url}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
        <div id="bg-spinner-${id}" style="display: none; position: absolute; inset: 0; background: rgba(255,255,255,0.7); align-items: center; justify-content: center;">
          <span style="font-size: 1.5rem; animation: spin 1s linear infinite;">⏳</span>
        </div>
      </div>
      <div style="padding: 0.6rem; text-align: left; background: white;">
        <p style="margin: 0; font-size: 0.75rem; color: #475569; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${filename}">${filename}</p>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.35rem;">
          <span id="bg-status-${id}" style="display:inline-flex;padding:1px 6px;border-radius:999px;background:#f1f5f9;color:#64748b;font-size:0.65rem;font-weight:800;">Pendiente</span>
          <button id="bg-download-${id}" class="btn primary" style="display: none; font-size: 0.68rem; padding: 0.25rem 0.5rem; border-radius: 6px; font-weight: 700; border: none; background: #10b981; color: white;">Desc.</button>
        </div>
      </div>
    `;
    resultsGrid.appendChild(card);

    card.onclick = (e) => {
      if (e.target.closest('#bg-download-' + id)) return;
      const imgData = getImageById(id);
      if (imgData) {
        setPreview(imgData, imgData.resultBlob ? (document.querySelector('input[name="bgExportFormat"]:checked')?.value || 'jpg') : null, imgData.resultBlob ? 'Resultado listo' : 'Pendiente');
      }
    };
  }

  btnRemoveAll.addEventListener('click', async () => {
    const pendingImages = uploadedImages.filter(img => !img.resultBlob);
    if (pendingImages.length === 0) return;
    if (typeof imglyRemoveBackground !== 'function') {
      alert('No se pudo cargar la librería de quitar fondo. Revisa la conexión e intenta recargar la página.');
      return;
    }

    isProcessing = true;
    failedCount = 0;
    btnRemoveAll.disabled = true;
    updateBatchActions();
    progressContainer.style.display = 'block';
    initialLoadWarning.style.display = 'block';
    logUserActivity('REMOVE_BG', { imagesCount: pendingImages.length });
    
    const exportFormat = getSelectedExportFormat();
    
    processedCount = 0;
    updateProgress(0, pendingImages.length);
    progressText.innerText = 'Procesando imágenes...';
    progressBar.style.background = 'linear-gradient(90deg, #3b82f6, #8b5cf6)';

    for (let i = 0; i < pendingImages.length; i++) {
      const imgData = pendingImages[i];
      const spinner = document.getElementById(`bg-spinner-${imgData.id}`);
      const imgEl = document.getElementById(`bg-img-${imgData.id}`);
      const btnDownload = document.getElementById(`bg-download-${imgData.id}`);
      
      spinner.style.display = 'flex';
      setCardStatus(imgData.id, 'processing');
      
      try {
        // 1. Quitar fondo -> Blob Transparente (Usamos CDN para evitar problemas de CORS/404 en Vite)
        const config = {
          publicPath: IMG_LY_PUBLIC_PATH
        };
        const transparentBlob = await imglyRemoveBackground(imgData.file, config);
        imgData.transparentBlob = transparentBlob;
        
        // 2. Aplicar formato (PNG o JPG con fondo blanco)
        const finalBlob = await processFormat(transparentBlob, exportFormat);
        if (!finalBlob) throw new Error('No se pudo generar el archivo final.');
        
        const finalUrl = URL.createObjectURL(finalBlob);
        
        imgData.resultBlob = finalBlob;
        imgData.resultUrl = finalUrl;
        imgData.resultFormat = exportFormat;
        
        imgEl.src = finalUrl;
        
        if (exportFormat === 'png') {
          // Fondo de cuadritos simulando transparencia
          imgEl.parentElement.style.background = CHECKERBOARD_BG;
        } else {
          imgEl.parentElement.style.background = '#ffffff';
        }

        btnDownload.style.display = 'block';
        btnDownload.onclick = () => {
          const dlUrl = URL.createObjectURL(finalBlob);
          const a = document.createElement('a');
          a.href = dlUrl;
          const downloadExt = exportFormat === 'png' ? 'png' : 'jpg';
          a.download = `bg-removed-${imgData.file.name.replace(/\.[^/.]+$/, "")}.${downloadExt}`;
          a.click();
          URL.revokeObjectURL(dlUrl);
        };

        initialLoadWarning.style.display = 'none'; // Ya cargó el modelo

        if (currentPreviewId === imgData.id || currentPreviewId === null) {
          setPreview(imgData, exportFormat, exportFormat === 'png' ? 'Transparente' : 'Fondo blanco');
        }
        setCardStatus(imgData.id, 'done');
      } catch (err) {
        console.error("Error al procesar", imgData.file.name, err);
        spinner.innerHTML = '<span style="color:red;font-size:1.5rem;">❌ Error</span>';
        failedCount++;
        setCardStatus(imgData.id, 'error', err?.message || 'No se pudo procesar');
      } finally {
        if(spinner) spinner.style.display = 'none';
        processedCount++;
        updateProgress(processedCount, pendingImages.length);
        updateBatchActions();
      }
    }

    isProcessing = false;
    btnRemoveAll.disabled = false;
    updateBatchActions();
    const successCount = pendingImages.length - failedCount;
    if (successCount === pendingImages.length) {
      progressText.innerText = "¡Proceso completado!";
      progressBar.style.background = "#10b981";
    } else if (successCount > 0) {
      progressText.innerText = `Proceso terminado: ${successCount} listas, ${failedCount} con error.`;
      progressBar.style.background = "#f59e0b";
    } else {
      progressText.innerText = "No se pudo procesar ninguna imagen.";
      progressBar.style.background = "#ef4444";
    }
  });

  btnDownloadZip.addEventListener('click', async () => {
    const format = getSelectedExportFormat();
    const completedImages = getCompletedImages();

    if (completedImages.length === 0) return;

    const originalHtml = btnDownloadZip.innerHTML;
    btnDownloadZip.innerText = "Preparando ZIP...";
    btnDownloadZip.disabled = true;

    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();

      completedImages.forEach((img, index) => {
        const actualFormat = img.resultFormat || format || 'jpg';
        const baseName = img.file.name.replace(/\.[^/.]+$/, "") || `imagen-${index + 1}`;
        const extension = actualFormat === 'png' ? 'png' : 'jpg';
        zip.file(`bg-removed-${baseName}.${extension}`, img.resultBlob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const dlUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = `imagenes-sin-fondo-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(dlUrl);
    } catch (err) {
      console.error('Error generando ZIP', err);
      alert('No se pudo crear el ZIP. Puedes descargar cada imagen desde su tarjeta individual.');
    } finally {
      btnDownloadZip.innerHTML = originalHtml;
      updateBatchActions();
    }
  });

  function updateProgress(current, total) {
    const percent = Math.round((current / total) * 100);
    progressBar.style.width = `${percent}%`;
    progressCount.innerText = `${current} / ${total}`;
  }

  // Utilidad para convertir el blob a JPG con fondo blanco si se requiere
  async function processFormat(transparentBlob, format) {
    if (format === 'png') return transparentBlob;

    return new Promise((resolve, reject) => {
      const img = new Image();
      const tempUrl = URL.createObjectURL(transparentBlob);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        // Llenar con blanco puro
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Dibujar la imagen recortada encima
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(tempUrl);
          if (!blob) {
            reject(new Error('El navegador no pudo exportar la imagen a JPG.'));
            return;
          }
          resolve(blob);
        }, 'image/jpeg', 0.95);
      };
      img.onerror = () => {
        URL.revokeObjectURL(tempUrl);
        reject(new Error('No se pudo leer la imagen sin fondo para convertirla.'));
      };
      img.src = tempUrl;
    });
  }

  // ── Touch-Up Pincel Editor Logic ──────────────────────────────────────────────
  const touchUpModal = document.getElementById('bgTouchUpModal');
  const touchUpCloseBtn = document.getElementById('bgTouchUpCloseBtn');
  const touchUpCancelBtn = document.getElementById('bgTouchUpCancelBtn');
  const touchUpSaveBtn = document.getElementById('bgTouchUpSaveBtn');
  const touchUpModeRestore = document.getElementById('bgTouchUpModeRestore');
  const touchUpModeErase = document.getElementById('bgTouchUpModeErase');
  const touchUpBrushSizeInput = document.getElementById('bgTouchUpBrushSize');
  const touchUpBrushSizeVal = document.getElementById('bgTouchUpBrushSizeVal');
  const touchUpPresetFine = document.getElementById('bgTouchUpPresetFine');
  const touchUpPresetMedium = document.getElementById('bgTouchUpPresetMedium');
  const touchUpPresetLarge = document.getElementById('bgTouchUpPresetLarge');
  const touchUpUndoBtn = document.getElementById('bgTouchUpUndoBtn');
  const touchUpResetBtn = document.getElementById('bgTouchUpResetBtn');
  const touchUpCanvas = document.getElementById('bgTouchUpCanvas');
  const touchUpCursor = document.getElementById('bgTouchUpCursor');

  let touchUpCurrentImgData = null;
  let touchUpOrigImage = null;
  let touchUpMaskCanvas = null;
  let touchUpMaskCtx = null;
  let touchUpMode = 'restore'; // 'restore' or 'erase'
  let touchUpBrushSize = 18;
  let touchUpHistory = [];
  let touchUpInitialMaskData = null;
  let touchUpIsDrawing = false;
  let touchUpLastX = null;
  let touchUpLastY = null;

  function setTouchUpMode(mode) {
    touchUpMode = mode;
    if (mode === 'restore') {
      if (touchUpModeRestore) {
        touchUpModeRestore.style.background = '#10b981';
        touchUpModeRestore.style.color = '#ffffff';
      }
      if (touchUpModeErase) {
        touchUpModeErase.style.background = 'transparent';
        touchUpModeErase.style.color = '#64748b';
      }
    } else {
      if (touchUpModeErase) {
        touchUpModeErase.style.background = '#ef4444';
        touchUpModeErase.style.color = '#ffffff';
      }
      if (touchUpModeRestore) {
        touchUpModeRestore.style.background = 'transparent';
        touchUpModeRestore.style.color = '#64748b';
      }
    }
  }

  if (touchUpModeRestore) touchUpModeRestore.onclick = () => setTouchUpMode('restore');
  if (touchUpModeErase) touchUpModeErase.onclick = () => setTouchUpMode('erase');

  function updateBrushSize(newSize) {
    touchUpBrushSize = Math.max(2, Math.min(100, parseInt(newSize, 10) || 18));
    if (touchUpBrushSizeInput) touchUpBrushSizeInput.value = touchUpBrushSize;
    if (touchUpBrushSizeVal) touchUpBrushSizeVal.textContent = `${touchUpBrushSize}px`;
    updateCursorDisplay();

    [touchUpPresetFine, touchUpPresetMedium, touchUpPresetLarge].forEach(btn => {
      if (btn) {
        btn.style.background = '#ffffff';
        btn.style.color = '#475569';
        btn.style.borderColor = '#cbd5e1';
      }
    });

    if (touchUpBrushSize <= 6 && touchUpPresetFine) {
      touchUpPresetFine.style.background = '#e0f2fe';
      touchUpPresetFine.style.color = '#0369a1';
      touchUpPresetFine.style.borderColor = '#0284c7';
    } else if (touchUpBrushSize >= 40 && touchUpPresetLarge) {
      touchUpPresetLarge.style.background = '#e0f2fe';
      touchUpPresetLarge.style.color = '#0369a1';
      touchUpPresetLarge.style.borderColor = '#0284c7';
    } else if (touchUpPresetMedium) {
      touchUpPresetMedium.style.background = '#e0f2fe';
      touchUpPresetMedium.style.color = '#0369a1';
      touchUpPresetMedium.style.borderColor = '#0284c7';
    }
  }

  if (touchUpBrushSizeInput) {
    touchUpBrushSizeInput.oninput = (e) => updateBrushSize(e.target.value);
  }
  if (touchUpPresetFine) touchUpPresetFine.onclick = () => updateBrushSize(4);
  if (touchUpPresetMedium) touchUpPresetMedium.onclick = () => updateBrushSize(18);
  if (touchUpPresetLarge) touchUpPresetLarge.onclick = () => updateBrushSize(45);

  function updateCursorDisplay(e) {
    if (!touchUpCursor || !touchUpCanvas) return;
    const rect = touchUpCanvas.getBoundingClientRect();
    if (!rect.width || !touchUpCanvas.width) return;
    const displayScale = rect.width / touchUpCanvas.width;
    const displaySize = Math.max(4, touchUpBrushSize * displayScale);

    touchUpCursor.style.width = `${displaySize}px`;
    touchUpCursor.style.height = `${displaySize}px`;

    if (e) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      touchUpCursor.style.left = `${x}px`;
      touchUpCursor.style.top = `${y}px`;
      touchUpCursor.style.display = 'block';
    }
  }

  function pushTouchUpHistory() {
    if (!touchUpMaskCtx || !touchUpMaskCanvas) return;
    const snap = touchUpMaskCtx.getImageData(0, 0, touchUpMaskCanvas.width, touchUpMaskCanvas.height);
    touchUpHistory.push(snap);
    if (touchUpHistory.length > 20) touchUpHistory.shift();
    if (touchUpUndoBtn) touchUpUndoBtn.disabled = touchUpHistory.length <= 1;
  }

  if (touchUpUndoBtn) {
    touchUpUndoBtn.onclick = () => {
      if (touchUpHistory.length > 1) {
        touchUpHistory.pop();
        const prev = touchUpHistory[touchUpHistory.length - 1];
        touchUpMaskCtx.putImageData(prev, 0, 0);
        renderTouchUpDisplay();
        if (touchUpUndoBtn) touchUpUndoBtn.disabled = touchUpHistory.length <= 1;
      }
    };
  }

  if (touchUpResetBtn) {
    touchUpResetBtn.onclick = () => {
      if (touchUpInitialMaskData && touchUpMaskCtx) {
        touchUpMaskCtx.putImageData(touchUpInitialMaskData, 0, 0);
        touchUpHistory = [touchUpMaskCtx.getImageData(0, 0, touchUpMaskCanvas.width, touchUpMaskCanvas.height)];
        if (touchUpUndoBtn) touchUpUndoBtn.disabled = true;
        renderTouchUpDisplay();
      }
    };
  }

  function renderTouchUpDisplay() {
    if (!touchUpCanvas || !touchUpOrigImage || !touchUpMaskCanvas) return;
    const ctx = touchUpCanvas.getContext('2d');
    const w = touchUpCanvas.width;
    const h = touchUpCanvas.height;

    ctx.clearRect(0, 0, w, h);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.drawImage(touchUpOrigImage, 0, 0);
    tempCtx.globalCompositeOperation = 'destination-in';
    tempCtx.drawImage(touchUpMaskCanvas, 0, 0);

    ctx.drawImage(tempCanvas, 0, 0);
  }

  function drawStroke(x, y, isFirstPoint = false) {
    if (!touchUpMaskCtx) return;

    touchUpMaskCtx.lineWidth = touchUpBrushSize;
    touchUpMaskCtx.lineCap = 'round';
    touchUpMaskCtx.lineJoin = 'round';

    if (touchUpMode === 'restore') {
      touchUpMaskCtx.globalCompositeOperation = 'source-over';
      touchUpMaskCtx.strokeStyle = 'rgba(255,255,255,1)';
      touchUpMaskCtx.fillStyle = 'rgba(255,255,255,1)';
    } else {
      touchUpMaskCtx.globalCompositeOperation = 'destination-out';
      touchUpMaskCtx.strokeStyle = 'rgba(0,0,0,1)';
      touchUpMaskCtx.fillStyle = 'rgba(0,0,0,1)';
    }

    touchUpMaskCtx.beginPath();
    if (isFirstPoint || touchUpLastX === null) {
      touchUpMaskCtx.arc(x, y, touchUpBrushSize / 2, 0, Math.PI * 2);
      touchUpMaskCtx.fill();
    } else {
      touchUpMaskCtx.moveTo(touchUpLastX, touchUpLastY);
      touchUpMaskCtx.lineTo(x, y);
      touchUpMaskCtx.stroke();
    }

    touchUpLastX = x;
    touchUpLastY = y;
    renderTouchUpDisplay();
  }

  function getCanvasCoords(e) {
    const rect = touchUpCanvas.getBoundingClientRect();
    const scaleX = touchUpCanvas.width / rect.width;
    const scaleY = touchUpCanvas.height / rect.height;
    
    let clientX = e.clientX;
    let clientY = e.clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  if (touchUpCanvas) {
    const startDraw = (e) => {
      e.preventDefault();
      touchUpIsDrawing = true;
      const { x, y } = getCanvasCoords(e);
      touchUpLastX = x;
      touchUpLastY = y;
      drawStroke(x, y, true);
    };

    const moveDraw = (e) => {
      updateCursorDisplay(e);
      if (!touchUpIsDrawing) return;
      e.preventDefault();
      const { x, y } = getCanvasCoords(e);
      drawStroke(x, y, false);
    };

    const stopDraw = () => {
      if (touchUpIsDrawing) {
        touchUpIsDrawing = false;
        touchUpLastX = null;
        touchUpLastY = null;
        pushTouchUpHistory();
      }
    };

    touchUpCanvas.addEventListener('mouseenter', (e) => updateCursorDisplay(e));
    touchUpCanvas.addEventListener('mouseleave', () => {
      if (touchUpCursor) touchUpCursor.style.display = 'none';
      stopDraw();
    });

    touchUpCanvas.addEventListener('mousedown', startDraw);
    touchUpCanvas.addEventListener('mousemove', moveDraw);
    window.addEventListener('mouseup', stopDraw);

    touchUpCanvas.addEventListener('touchstart', startDraw, { passive: false });
    touchUpCanvas.addEventListener('touchmove', moveDraw, { passive: false });
    window.addEventListener('touchend', stopDraw);
  }

  function closeTouchUpModal() {
    if (touchUpModal) touchUpModal.style.display = 'none';
    if (touchUpCursor) touchUpCursor.style.display = 'none';
    touchUpCurrentImgData = null;
    touchUpOrigImage = null;
    touchUpMaskCanvas = null;
    touchUpMaskCtx = null;
    touchUpHistory = [];
    touchUpIsDrawing = false;
  }

  if (touchUpCloseBtn) touchUpCloseBtn.onclick = closeTouchUpModal;
  if (touchUpCancelBtn) touchUpCancelBtn.onclick = closeTouchUpModal;

  async function openTouchUpModal(imgData) {
    if (!imgData || !imgData.originalUrl || !touchUpModal || !touchUpCanvas) return;

    touchUpCurrentImgData = imgData;
    setTouchUpMode('restore');
    updateBrushSize(18);
    touchUpHistory = [];

    const origImg = new Image();
    origImg.crossOrigin = 'anonymous';
    origImg.onload = () => {
      touchUpOrigImage = origImg;
      const w = origImg.width;
      const h = origImg.height;

      touchUpCanvas.width = w;
      touchUpCanvas.height = h;

      touchUpMaskCanvas = document.createElement('canvas');
      touchUpMaskCanvas.width = w;
      touchUpMaskCanvas.height = h;
      touchUpMaskCtx = touchUpMaskCanvas.getContext('2d');

      if (imgData.resultUrl) {
        const resImg = new Image();
        resImg.crossOrigin = 'anonymous';
        resImg.onload = () => {
          touchUpMaskCtx.drawImage(resImg, 0, 0, w, h);
          touchUpInitialMaskData = touchUpMaskCtx.getImageData(0, 0, w, h);
          pushTouchUpHistory();
          renderTouchUpDisplay();
          touchUpModal.style.display = 'flex';
        };
        resImg.src = imgData.resultUrl;
      } else {
        touchUpMaskCtx.fillStyle = '#ffffff';
        touchUpMaskCtx.fillRect(0, 0, w, h);
        touchUpInitialMaskData = touchUpMaskCtx.getImageData(0, 0, w, h);
        pushTouchUpHistory();
        renderTouchUpDisplay();
        touchUpModal.style.display = 'flex';
      }
    };
    origImg.src = imgData.originalUrl;
  }

  if (touchUpSaveBtn) {
    touchUpSaveBtn.onclick = () => {
      if (!touchUpCurrentImgData || !touchUpOrigImage || !touchUpMaskCanvas) return;

      const format = getSelectedExportFormat();
      const w = touchUpOrigImage.width;
      const h = touchUpOrigImage.height;

      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = w;
      exportCanvas.height = h;
      const ctx = exportCanvas.getContext('2d');

      if (format === 'png') {
        ctx.drawImage(touchUpOrigImage, 0, 0);
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(touchUpMaskCanvas, 0, 0);
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(touchUpOrigImage, 0, 0);
        tempCtx.globalCompositeOperation = 'destination-in';
        tempCtx.drawImage(touchUpMaskCanvas, 0, 0);

        ctx.drawImage(tempCanvas, 0, 0);
      }

      const mime = format === 'png' ? 'image/png' : 'image/jpeg';
      exportCanvas.toBlob((blob) => {
        if (!blob) return alert('No se pudo guardar el retoque.');
        
        if (touchUpCurrentImgData.resultUrl) URL.revokeObjectURL(touchUpCurrentImgData.resultUrl);

        const newUrl = URL.createObjectURL(blob);
        touchUpCurrentImgData.resultBlob = blob;
        touchUpCurrentImgData.resultUrl = newUrl;
        touchUpCurrentImgData.resultFormat = format;

        setPreview(touchUpCurrentImgData, format, 'Retocado');
        setCardStatus(touchUpCurrentImgData.id, 'done', 'Retocado');

        const btnDownload = document.getElementById(`bg-download-${touchUpCurrentImgData.id}`);
        if (btnDownload) {
          btnDownload.style.display = 'block';
          btnDownload.onclick = () => {
            const dlUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = dlUrl;
            a.download = `bg-removed-${touchUpCurrentImgData.file.name.replace(/\.[^/.]+$/, "")}.${format === 'png' ? 'png' : 'jpg'}`;
            a.click();
            URL.revokeObjectURL(dlUrl);
          };
        }

        updateBatchActions();
        closeTouchUpModal();
      }, mime, 0.95);
    };
  }
}
