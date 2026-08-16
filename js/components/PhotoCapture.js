/**
 * PhotoCapture.js — Captura e upload de fotos/evidências
 * Usa câmera nativa + compressão + upload para Google Drive
 */
import { uploadPhoto } from '../services/sheets-write-api.js';
import * as Toast from './Toast.js';

/**
 * Cria o componente de captura de fotos
 * @param {string} prefix - Prefixo para nome do arquivo (ex: "VISTORIA_2928066")
 * @param {Function} onPhotoUploaded - Callback com {url, id, viewUrl}
 * @returns {HTMLElement}
 */
export function createPhotoCaptureUI(prefix = 'evidencia', onPhotoUploaded = null) {
  const container = document.createElement('div');
  container.className = 'photo-capture';
  container.innerHTML = `
    <div class="photo-capture-header">
      <span class="photo-capture-label">📷 Evidências Fotográficas</span>
      <button class="photo-capture-btn" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        Tirar Foto
      </button>
    </div>
    <input type="file" accept="image/*" capture="environment" class="photo-capture-input" style="display:none">
    <div class="photo-capture-gallery"></div>
    <div class="photo-capture-uploading" style="display:none">
      <div class="photo-upload-spinner"></div>
      <span>Enviando foto...</span>
    </div>
  `;

  const input = container.querySelector('.photo-capture-input');
  const gallery = container.querySelector('.photo-capture-gallery');
  const uploading = container.querySelector('.photo-capture-uploading');
  const btn = container.querySelector('.photo-capture-btn');

  btn.addEventListener('click', () => input.click());

  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => {
      const thumb = document.createElement('div');
      thumb.className = 'photo-thumb photo-thumb-uploading';
      thumb.innerHTML = `
        <img src="${ev.target.result}" alt="Preview">
        <div class="photo-thumb-overlay">
          <div class="photo-upload-spinner-sm"></div>
        </div>
      `;
      gallery.appendChild(thumb);

      // Upload
      uploading.style.display = 'flex';
      uploadPhoto(file, prefix)
        .then((result) => {
          thumb.classList.remove('photo-thumb-uploading');
          thumb.querySelector('.photo-thumb-overlay').innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="#4ADE80" stroke-width="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          `;
          thumb.dataset.url = result.url;
          thumb.dataset.viewUrl = result.viewUrl;

          // Click to view fullscreen
          thumb.addEventListener('click', () => {
            openGalleryViewer(result.url, result.viewUrl);
          });

          if (onPhotoUploaded) onPhotoUploaded(result);
          Toast.success('Foto enviada com sucesso!');
        })
        .catch((err) => {
          console.error('Photo upload failed:', err);
          thumb.classList.add('photo-thumb-error');
          thumb.querySelector('.photo-thumb-overlay').innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="#FB7185" stroke-width="3">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          `;
          Toast.error('Falha no upload da foto. Verifique sua conexão.');
        })
        .finally(() => {
          uploading.style.display = 'none';
          input.value = '';
        });
    };
    reader.readAsDataURL(file);
  });

  return container;
}

/**
 * Retorna todas as URLs de fotos capturadas
 */
export function getPhotosFromContainer(container) {
  const thumbs = container.querySelectorAll('.photo-thumb[data-url]');
  return Array.from(thumbs).map(t => ({
    url: t.dataset.url,
    viewUrl: t.dataset.viewUrl,
  }));
}

/**
 * Abre o visualizador de imagem em fullscreen
 */
export function openGalleryViewer(imageUrl, viewUrl) {
  const viewer = document.createElement('div');
  viewer.className = 'gallery-viewer';
  viewer.innerHTML = `
    <div class="gallery-viewer-backdrop"></div>
    <div class="gallery-viewer-content">
      <img src="${imageUrl}" alt="Evidência">
      <div class="gallery-viewer-actions">
        ${viewUrl ? `<a href="${viewUrl}" target="_blank" class="gallery-viewer-btn">Abrir no Drive</a>` : ''}
        <button class="gallery-viewer-btn gallery-viewer-close">Fechar</button>
      </div>
    </div>
  `;

  viewer.querySelector('.gallery-viewer-backdrop').addEventListener('click', () => viewer.remove());
  viewer.querySelector('.gallery-viewer-close').addEventListener('click', () => viewer.remove());

  document.body.appendChild(viewer);
  requestAnimationFrame(() => viewer.classList.add('gallery-viewer-show'));
}
