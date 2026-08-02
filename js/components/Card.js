/**
 * Componente Card de Agendamento com Ações Rápidas de Campo (Maps/Waze/WhatsApp)
 */
import { escapeHTML } from '../utils/sanitizer.js';
import { buildMapsUrl, buildWhatsAppUrl } from '../utils/formatters.js';

export function createCardHTML(entry) {
  const mapsUrl = buildMapsUrl(entry.endereco);
  const waUrl = buildWhatsAppUrl(entry.contato, entry);
  const safeId = escapeHTML(entry.id);
  const safeStatus = escapeHTML(entry.status);
  const safeTipo = escapeHTML(entry.tipo);
  const safeCliente = escapeHTML(entry.cliente || 'Cliente não informado');
  const safeContrato = escapeHTML(entry.contrato || '—');
  const safeEndereco = escapeHTML(entry.endereco || '');
  const safeHora = escapeHTML(entry.hora || '—');
  const safeAcompanhante = escapeHTML(entry.acompanhante || '—');
  const safeContato = escapeHTML(entry.contato || '—');
  const safeObs = escapeHTML(entry.obs || '');

  return `
    <div class="card st-${safeStatus}">
      <div class="tag-row">
        <span class="tag tag-tipo">${safeTipo}</span>
        <span class="tag tag-status st-${safeStatus}">${safeStatus}</span>
      </div>
      
      <div class="card-top">
        <div>
          <div class="cliente">${safeCliente}</div>
          <div class="contrato">Contrato ${safeContrato}</div>
        </div>
      </div>
      
      ${safeEndereco ? `<div class="endereco">📍 ${safeEndereco}</div>` : ''}
      
      <div class="meta">
        <div><span>Horário</span><span class="hora">${safeHora}</span></div>
        <div><span>Acompanha</span>${safeAcompanhante}</div>
        <div><span>Contato</span>${safeContato}</div>
      </div>
      
      ${entry.endereco || entry.contato ? `
        <div class="card-field-actions">
          ${entry.endereco ? `<a href="${mapsUrl}" target="_blank" rel="noopener" class="quick-action-link maps">🗺️ Abrir no Maps/Waze</a>` : ''}
          ${entry.contato ? `<a href="${waUrl}" target="_blank" rel="noopener" class="quick-action-link wa">💬 WhatsApp / Ligar</a>` : ''}
        </div>
      ` : ''}
      
      ${safeObs ? `<div class="obs">${safeObs}</div>` : ''}
      
      <div class="card-actions">
        <select class="status-select" data-id="${safeId}" data-action="quick-status">
          ${['Confirmada','Pendente','Realizada','Reagendada','Cancelada'].map(s => `<option ${s === entry.status ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
        <button class="icon-btn" data-id="${safeId}" data-action="edit">Editar</button>
        <button class="icon-btn" data-id="${safeId}" data-action="delete">Excluir</button>
      </div>
    </div>
  `;
}
