/**
 * Componente Timeline
 */
import { fmtDate } from '../utils/formatters.js';
import { createCardHTML } from './Card.js';

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

  // Event Delegation para status, edição e exclusão
  containerEl.querySelectorAll('[data-action]').forEach(el => {
    const action = el.getAttribute('data-action');
    const id = el.getAttribute('data-id');

    if (action === 'quick-status') {
      el.addEventListener('change', (ev) => onCardAction('quick-status', id, ev.target.value));
    } else if (action === 'edit') {
      el.addEventListener('click', () => onCardAction('edit', id));
    } else if (action === 'delete') {
      el.addEventListener('click', () => onCardAction('delete', id));
    }
  });
}
