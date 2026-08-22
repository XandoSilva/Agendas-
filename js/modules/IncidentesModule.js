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
    this.filteredData = [];
    this.filterStatus = 'PENDENTES';
    this.filterCategoria = '';
    this.filterResponsavel = '';
    this.searchTerm = '';
    this._editCallback = null;
  }

  setEditCallback(cb) { this._editCallback = cb; }

  init(container) { this.container = container; }

  render(allData) {
    if (!this.container) return;
    this.data = allData.incidentes || [];
    this._applyFilters();

    const categorias = this._getUniqueValues('Origem / Categoria');
    const responsaveis = this._getUniqueValues('Responsável Técnico');

    const normalizadoCount = this.data.filter(i => {
      const s = (i['Status'] || '').toUpperCase();
      return s.includes('NORMALIZADO') || s.includes('CONCLUÍDO');
    }).length;
    const pendentesCount = this.data.length - normalizadoCount;

    this.container.innerHTML = `
      <div class="module-header">
        <div class="module-title-group">
          <h2 class="module-title">⚠️ Incidentes Múltiplos</h2>
          <p class="module-subtitle">Acompanhamento de falhas massivas e tarefas — ${this.data.length} registros</p>
        </div>
        <div class="filters-container">
          <div class="filters-actions">
            <div class="search-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" class="search-input" id="inc-search" placeholder="Buscar incidente..." value="${escapeHTML(this.searchTerm)}">
            </div>
            <select id="inc-filter-categoria" class="search-input" style="padding-left: 12px; max-width: 150px; text-overflow: ellipsis;">
              <option value="">Categoria (Todas)</option>
              ${categorias.map(c => `<option value="${escapeHTML(c)}" ${this.filterCategoria === c ? 'selected' : ''}>${escapeHTML(c)}</option>`).join('')}
            </select>
            <select id="inc-filter-responsavel" class="search-input" style="padding-left: 12px; max-width: 180px; text-overflow: ellipsis;">
              <option value="">Responsável (Todos)</option>
              ${responsaveis.map(r => `<option value="${escapeHTML(r)}" ${this.filterResponsavel === r ? 'selected' : ''}>${escapeHTML(r)}</option>`).join('')}
            </select>
          </div>
          <div class="filters-scroll">
            ${this._renderFilterChips()}
          </div>
        </div>
      </div>

      <div class="stat-row">
        <div class="stat-chip"><span class="stat-chip-value">${this.data.length}</span> Total</div>
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--green)">${normalizadoCount}</span> Concluídos</div>
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--amber)">${pendentesCount}</span> Pendentes</div>
      </div>

      <div class="cards-list" id="inc-cards">
        ${this._renderCards()}
      </div>
    `;

    this._bindEvents();
  }

  _applyFilters() {
    this.filteredData = this.data.filter(item => {
      const status = (item['Status'] || '').toUpperCase();
      
      if (this.filterCategoria && (item['Origem / Categoria'] || '').trim() !== this.filterCategoria) {
        return false;
      }

      if (this.filterResponsavel && (item['Responsável Técnico'] || '').trim() !== this.filterResponsavel) {
        return false;
      }

      let matchStatus = false;
      if (this.filterStatus === 'TODOS') matchStatus = true;
      else if (this.filterStatus === 'PENDENTES') matchStatus = !status.includes('NORMALIZADO') && !status.includes('CONCLUÍDO');
      else if (this.filterStatus === 'CONCLUÍDOS') matchStatus = status.includes('NORMALIZADO') || status.includes('CONCLUÍDO');
      else matchStatus = status.includes(this.filterStatus.toUpperCase());
      
      if (!this.searchTerm) return matchStatus;
      const term = this.searchTerm.toLowerCase();
      const searchFields = [
        item['Incidente / Problema'], 
        item['Cidade(s) Afetada(s)'], 
        item['Protocolo / Ticket'], 
        item['Designação'],
        item['Título do Chamado / Trecho'],
        item['Diagnóstico / Problema']
      ].join(' ').toLowerCase();
      return matchStatus && searchFields.includes(term);
    });
  }

  _renderFilterChips() {
    const filters = [
      { id: 'PENDENTES', label: 'Pendentes' }, 
      { id: 'CONCLUÍDOS', label: 'Concluídos' }, 
      { id: 'TODOS', label: 'Todos' },
      { id: 'DESIGNADO', label: 'Designado' },
      { id: 'VALIDAÇÃO', label: 'Validação' }
    ];
    
    return filters.map(f => {
      const active = this.filterStatus === f.id ? 'active' : '';
      let count = 0;
      
      if (f.id === 'TODOS') {
        count = this.data.length;
      } else if (f.id === 'PENDENTES') {
        count = this.data.filter(item => {
          const s = (item['Status'] || '').toUpperCase();
          return !s.includes('NORMALIZADO') && !s.includes('CONCLUÍDO');
        }).length;
      } else if (f.id === 'CONCLUÍDOS') {
        count = this.data.filter(item => {
          const s = (item['Status'] || '').toUpperCase();
          return s.includes('NORMALIZADO') || s.includes('CONCLUÍDO');
        }).length;
      } else if (f.id === 'VALIDAÇÃO') {
        count = this.data.filter(item => {
          const s = (item['Status'] || '').toUpperCase();
          return s.includes('VALIDAÇÃO') || s.includes('VALIDACAO');
        }).length;
      } else {
        count = this.data.filter(item => {
          const s = (item['Status'] || '').toUpperCase();
          return s.includes(f.id.toUpperCase());
        }).length;
      }
      
      return `<button class="filter-chip ${active}" data-filter="${f.id}">${f.label} (${count})</button>`;
    }).join('');
  }

  _renderCards() {
    if (!this.filteredData.length) {
      return `<div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        <h3>Nenhum incidente encontrado</h3>
        <p>Ajuste os filtros ou a busca</p>
      </div>`;
    }

    return this.filteredData.map((item, i) => {
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
    }).join('');
  }

  _getUniqueValues(field) {
    const values = new Set();
    this.data.forEach(item => {
      const val = (item[field] || '').trim();
      if (val) values.add(val);
    });
    return Array.from(values).sort();
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
    if (s.includes('NORMALIZADO') || s.includes('CONCLUÍDO')) return '<span class="badge badge-normalizado">Concluído</span>';
    if (s.includes('PENDENTE'))    return '<span class="badge badge-pendente">Pendente</span>';
    if (s.includes('DESIGNADO'))   return '<span class="badge badge-designado">Designado</span>';
    if (s.includes('VALIDAÇÃO') || s.includes('VALIDACAO')) return '<span class="badge badge-validacao">Validação</span>';
    return `<span class="badge" style="background:var(--panel);color:var(--muted)">${escapeHTML(status) || 'Sem status'}</span>`;
  }

  _bindEvents() {
    const search = this.container.querySelector('#inc-search');
    if (search) {
      search.addEventListener('input', (e) => {
        this.searchTerm = e.target.value;
        this._applyFilters();
        const cardsEl = this.container.querySelector('#inc-cards');
        if (cardsEl) cardsEl.innerHTML = this._renderCards();
      });
    }

    const selCategoria = this.container.querySelector('#inc-filter-categoria');
    if (selCategoria) {
      selCategoria.addEventListener('change', (e) => {
        this.filterCategoria = e.target.value;
        this.render({ incidentes: this.data });
      });
    }

    const selResponsavel = this.container.querySelector('#inc-filter-responsavel');
    if (selResponsavel) {
      selResponsavel.addEventListener('change', (e) => {
        this.filterResponsavel = e.target.value;
        this.render({ incidentes: this.data });
      });
    }

    this.container.querySelectorAll('.filter-chip[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.filterStatus = btn.dataset.filter;
        this.render({ incidentes: this.data });
      });
    });

    // Edit buttons
    this.container.querySelectorAll('.action-btn-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        const item = this.filteredData[idx];
        if (item && this._editCallback) {
          this._editCallback('incidentes', item);
        }
      });
    });
  }

  renderLoading() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="module-header"><div class="module-title-group"><h2 class="module-title">⚡ Incidentes</h2></div></div>
      ${Array(4).fill('<div class="skeleton skeleton-card"></div>').join('')}
    `;
  }
}
