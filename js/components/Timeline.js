/**
 * Componente Timeline
 */
import { fmtDate } from '../utils/formatters.js';
import { createCardHTML } from './Card.js';

// Guarda referência para evitar registrar listener duplicado
const delegatedContainers = new WeakSet();

export function renderTimeline(containerEl, list, onCardAction) {
  if (!list || list.length === 0) {
    containerEl.innerHTML = '<div id="empty">Nenhum agendamento por aqui ainda. Cole uma mensagem do Teams ao lado ou clique em "+ Novo" para começar.</div>';
    return;
  }

  const groups = {};
  list.forEach(e => { (groups[e.data || ''] = groups[e.data || ''] || []).push(e); });

  containerEl.innerHTML = Object.keys(groups).map(dateKey => {
    const { label, dow } = fmtDate(dateKey);
    const cards = groups[dateKey].map(e => createCardHTML(e)).join('');

    return `
      <div class="day-group">
        <div class="day-marker"></div>
        <div class="day-header">${label} <span class="dow">${dow}</span></div>
        ${cards}
      </div>
    `;
  }).join('');

  // Event Delegation única no container (registra só 1 vez)
  if (!delegatedContainers.has(containerEl)) {
    delegatedContainers.add(containerEl);

    containerEl.addEventListener('change', (ev) => {
      const select = ev.target.closest('[data-action="quick-status"]');
      if (select) {
        onCardAction('quick-status', select.getAttribute('data-id'), select.value);
      }
    });

    containerEl.addEventListener('click', (ev) => {
      const btn = ev.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      if (action === 'edit') onCardAction('edit', id);
      if (action === 'delete') onCardAction('delete', id);
    });
  }
}
