/**
 * Toast.js — Sistema de notificações toast
 * Feedback visual para ações do operador (sucesso, erro, warning, info)
 */

let _container = null;
let _toastId = 0;

function _ensureContainer() {
  if (_container) return _container;
  _container = document.createElement('div');
  _container.className = 'toast-container';
  _container.id = 'toast-container';
  document.body.appendChild(_container);
  return _container;
}

/**
 * Exibe um toast
 * @param {string} message - Mensagem
 * @param {'success'|'error'|'warning'|'info'|'sync'} type - Tipo
 * @param {number} duration - Duração em ms (0 = permanente)
 * @returns {string} Toast ID para dismiss manual
 */
export function show(message, type = 'info', duration = 3500) {
  const container = _ensureContainer();
  const id = `toast-${++_toastId}`;

  const icons = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    sync: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.92-10.27"/></svg>',
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.id = id;
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-message">${message}</div>
    <button class="toast-close" aria-label="Fechar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `;

  toast.querySelector('.toast-close').addEventListener('click', () => dismiss(id));

  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('toast-show');
  });

  if (duration > 0) {
    setTimeout(() => dismiss(id), duration);
  }

  return id;
}

/**
 * Remove um toast
 */
export function dismiss(id) {
  const toast = document.getElementById(id);
  if (!toast) return;
  toast.classList.remove('toast-show');
  toast.classList.add('toast-hide');
  setTimeout(() => toast.remove(), 300);
}

/**
 * Atalhos
 */
export function success(msg, duration) { return show(msg, 'success', duration); }
export function error(msg, duration) { return show(msg, 'error', duration || 5000); }
export function warning(msg, duration) { return show(msg, 'warning', duration); }
export function info(msg, duration) { return show(msg, 'info', duration); }
export function sync(msg) { return show(msg, 'sync', 0); }
