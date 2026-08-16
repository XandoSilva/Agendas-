/**
 * IncidentesModule - Gestão de Incidentes e Backbone
 * Consome a aba "Incidentes" (gid=1386014215)
 */
import { escapeHTML } from '../services/sheets-api.js';
import { canEdit } from '../services/rbac.js';

export default class IncidentesModule {
  constructor() {
    this.container = null;
    this.data = [];
    this.filterCat = 'TODOS';
    this.ocultarNormalizados = true;
    this.searchTerm = '';
    this._editCallback = null;
  }

  setEditCallback(cb) { this._editCallback = cb; }

  init(container) { this.container = container; }

  render(allData) {
    if (!this.container) return;
    this.data = allData.incidentes || [];

    const filtered = this.data.filter(i => {
      const catMatch = this.filterCat === 'TODOS' || (i['Origem / Categoria'] || '').toUpperCase().includes(this.filterCat.toUpperCase());
      const s = (i['Status'] || '').toUpperCase();
      const statusMatch = this.ocultarNormalizados ? (!s.includes('NORMALIZADO') && !s.includes('CONCLUÍDO')) : true;
      
      if (!this.searchTerm) return catMatch && statusMatch;

      const term = this.searchTerm.toLowerCase();
      const fields = [
        i['Incidente / Problema'], i['Cidade(s) Afetada(s)'], i['Protocolo / Ticket'], i['Designação']
      ].join(' ').toLowerCase();

      return catMatch && statusMatch && fields.includes(term);
    });

    const catCounts = this._countByField('Origem / Categoria');
    
    let abertos = 0;
    const statusCounts = {};
    this.data.forEach(i => {
      const s = (i['Status'] || '').toUpperCase();
      if (!s.includes('NORMALIZADO') && !s.includes('CONCLUÍDO')) abertos++;
      
      if (s.includes('NORMALIZADO')) statusCounts.normalizado = (statusCounts.normalizado || 0) + 1;
      else if (s.includes('PENDENTE')) statusCounts.pendente = (statusCounts.pendente || 0) + 1;
      else statusCounts.outros = (statusCounts.outros || 0) + 1;
    });

    this.container.innerHTML = `
      <div class="module-header">
        <div class="module-title-group">
          <h2 class="module-title">⚠️ Incidentes Múltiplos</h2>
          <p class="module-subtitle">Acompanhamento de falhas massivas e tarefas — ${abertos} abertos de ${this.data.length}</p>
        </div>
        <div class="filters-container">
          <div class="filters-actions">
            <div class="search-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" class="search-input" id="inc-search" placeholder="Buscar incidente..." value="${escapeHTML(this.searchTerm)}">
            </div>
            <label style="display:flex; align-items:center; gap:6px; font-size:12px; color:var(--text-dim); cursor:pointer;">
              <input type="checkbox" id="inc-toggle-status" ${this.ocultarNormalizados ? 'checked' : ''}>
              Ocultar Normalizados
            </label>
          </div>
          <div class="filters-scroll">
            ${['TODOS', 'Backbone down', 'Telefonia', 'Rompi', 'Tarefa', 'Ocorrência'].map(f => {
              const active = this.filterCat === f ? 'active' : '';
              const count = f === 'TODOS' ? this.data.length : (catCounts[f] || 0);
              return `<button class="filter-chip ${active}" data-filter="${f}">${f} (${count})</button>`;
            }).join('')}
          </div>
        </div>
      </div>

      <div class="stat-row">
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--amber)">${statusCounts.pendente || 0}</span> Pendentes</div>
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--violet)">${statusCounts.outros || 0}</span> Em andamento</div>
      </div>

      <div class="cards-list">
        ${filtered.length === 0 ? `
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            <h3>Nenhum incidente encontrado</h3><p>Ajuste os filtros</p>
          </div>` :
          filtered.map((item, i) => this._renderCard(item, i)).join('')
        }
      </div>
    `;

    this.container.querySelectorAll('.filter-chip[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.filterCat = btn.dataset.filter;
        this.render(allData);
      });
    });

    // Edit buttons
    this.container.querySelectorAll('.action-btn-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        const filtered = this.data.filter(i => {
          const catMatch = this.filterCat === 'TODOS' || (i['Origem / Categoria'] || '').toUpperCase().includes(this.filterCat.toUpperCase());
          const s = (i['Status'] || '').toUpperCase();
          const statusMatch = this.ocultarNormalizados ? (!s.includes('NORMALIZADO') && !s.includes('CONCLUÍDO')) : true;
          return catMatch && statusMatch;
        });
        if (filtered[idx] && this._editCallback) {
          this._editCallback('incidentes', filtered[idx]);
        }
      });
    });
  }

  _renderCard(item, i) {
    const catBadge = this._getCatBadge(item['Origem / Categoria'] || '');
    const statusBadge = this._getStatusBadge(item['Status'] || '');

    return `
      <div class="data-card" style="animation-delay: ${i * 30}ms">
        <div class="data-card-header">
          <div class="data-card-title">${escapeHTML(item['Título do Chamado / Trecho'] || 'Sem título')}</div>
          ${statusBadge}
        </div>
        <div class="data-card-meta">
          ${catBadge}
          <span class="meta-tag">📝 ${escapeHTML(item['Task ID'] || '-')}</span>
          <span class="meta-tag">🔗 ${escapeHTML(item['Incidente'] || '-')}</span>
        </div>
        <div class="data-card-body">
          ${item['Diagnóstico / Problema'] && item['Diagnóstico / Problema'] !== '-' ? `<div class="field"><span class="field-label">Diagnóstico: </span>${escapeHTML(item['Diagnóstico / Problema'])}</div>` : ''}
          <div class="field"><span class="field-label">Responsável: </span>${escapeHTML(item['Responsável Técnico'] || 'A Definir')}</div>
          ${item['Observações'] ? `<div class="field"><span class="field-label">Obs: </span>${escapeHTML(item['Observações'])}</div>` : ''}
        </div>
        <div class="data-card-footer">
          <div class="data-card-actions">
            ${canEdit('incidentes') ? `<button class="action-btn action-btn-edit" data-idx="${i}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Editar
            </button>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  _getCatBadge(cat) {
    const c = cat.toUpperCase();
    if (c.includes('BACKBONE'))  return '<span class="badge badge-backbone">Backbone</span>';
    if (c.includes('CAIXA'))     return '<span class="badge badge-caixa">Caixa</span>';
    if (c.includes('TELEFONIA')) return '<span class="badge badge-telefonia">Telefonia</span>';
    if (c.includes('POP'))       return '<span class="badge badge-pop">POP</span>';
    return '<span class="badge badge-tarefas">Tarefa</span>';
  }

  _getStatusBadge(status) {
    const s = status.toUpperCase();
    if (s.includes('NORMALIZADO')) return '<span class="badge badge-normalizado">Normalizado</span>';
    if (s.includes('PENDENTE'))    return '<span class="badge badge-pendente">Pendente</span>';
    if (s.includes('DESIGNADO'))   return '<span class="badge badge-designado">Designado</span>';
    if (s.includes('VALIDAÇÃO') || s.includes('VALIDACAO')) return '<span class="badge badge-validacao">Validação</span>';
    return `<span class="badge" style="background:var(--panel);color:var(--muted)">${escapeHTML(status)}</span>`;
  }

  _countByField(field) {
    const counts = {};
    this.data.forEach(i => {
      const v = (i[field] || 'Outros').trim();
      counts[v] = (counts[v] || 0) + 1;
    });
    return counts;
  }

  renderLoading() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="module-header"><div class="module-title-group"><h2 class="module-title">⚡ Incidentes</h2></div></div>
      ${Array(4).fill('<div class="skeleton skeleton-card"></div>').join('')}
    `;
  }
}
