/**
 * ChamadosB2BModule - Chamados B2B corporativos
 * Consome a aba "Chamados B2B" (gid=2005931044)
 */
import { escapeHTML } from '../services/sheets-api.js';
import { canEdit } from '../services/rbac.js';

export default class ChamadosB2BModule {
  constructor() {
    this.container = null;
    this.data = [];
    this.filteredData = [];
    this.filterStatus = 'PENDENTES';
    this.filterTecnico = '';
    this.filterDiagnostico = '';
    this.searchTerm = '';
    this._editCallback = null;
  }

  setEditCallback(cb) { this._editCallback = cb; }

  init(container) {
    this.container = container;
  }

  render(allData) {
    if (!this.container) return;
    this.data = allData.chamadosB2B || [];
    this._applyFilters();

    const tecnicos = this._getUniqueValues('Técnico / Responsável');
    const diagnosticos = this._getUniqueValues('Diagnóstico / Tipo de Falha');

    const normalizadoCount = this.data.filter(i => (i['Status / Andamento'] || '').toUpperCase().includes('NORMALIZADO')).length;
    const canceladoCount = this.data.filter(i => (i['Status / Andamento'] || '').toUpperCase().includes('CANCELADO')).length;
    const pendentesCount = this.data.length - normalizadoCount - canceladoCount;
    const atenuacaoCount = this.data.filter(i => {
      const s = (i['Status / Andamento'] || '').toUpperCase();
      return s.includes('ATENUAÇÃO') || s.includes('ATENUACAO');
    }).length;

    this.container.innerHTML = `
      <div class="module-header">
        <div class="module-title-group">
          <h2 class="module-title">📋 Chamados B2B</h2>
          <p class="module-subtitle">Atendimentos corporativos — ${this.data.length} registros</p>
        </div>
        <div class="filters-container">
          <div class="filters-actions">
            <div class="search-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" class="search-input" id="b2b-search" placeholder="Buscar cliente, protocolo..." value="${escapeHTML(this.searchTerm)}">
            </div>
            <select id="b2b-filter-tecnico" class="search-input" style="padding-left: 12px; max-width: 150px; text-overflow: ellipsis;">
              <option value="">Técnico (Todos)</option>
              ${tecnicos.map(t => `<option value="${escapeHTML(t)}" ${this.filterTecnico === t ? 'selected' : ''}>${escapeHTML(t)}</option>`).join('')}
            </select>
            <select id="b2b-filter-diagnostico" class="search-input" style="padding-left: 12px; max-width: 180px; text-overflow: ellipsis;">
              <option value="">Diagnóstico (Todos)</option>
              ${diagnosticos.map(d => `<option value="${escapeHTML(d)}" ${this.filterDiagnostico === d ? 'selected' : ''}>${escapeHTML(d)}</option>`).join('')}
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
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--orange)">${atenuacaoCount}</span> Atenuação</div>
      </div>

      <div class="cards-list" id="b2b-cards">
        ${this._renderCards()}
      </div>
    `;

    this._bindEvents();
  }

  _applyFilters() {
    this.filteredData = this.data.filter(item => {
      const status = (item['Status / Andamento'] || '').toUpperCase();
      
      if (this.filterTecnico && (item['Técnico / Responsável'] || '').trim() !== this.filterTecnico) {
        return false;
      }

      if (this.filterDiagnostico && (item['Diagnóstico / Tipo de Falha'] || '').trim() !== this.filterDiagnostico) {
        return false;
      }

      let matchStatus = false;
      if (this.filterStatus === 'TODOS') matchStatus = true;
      else if (this.filterStatus === 'PENDENTES') matchStatus = !status.includes('NORMALIZADO') && !status.includes('CANCELADO');
      else if (this.filterStatus === 'CONCLUÍDOS') matchStatus = status.includes('NORMALIZADO');
      else matchStatus = status.includes(this.filterStatus.toUpperCase());
      
      if (!this.searchTerm) return matchStatus;
      const term = this.searchTerm.toLowerCase();
      const searchFields = [
        item['Razão Social / Cliente'],
        item['Protocolo'],
        item['Contrato'],
        item['Endereço'],
        item['Diagnóstico / Tipo de Falha'],
        item['Técnico / Responsável'],
      ].join(' ').toLowerCase();
      return matchStatus && searchFields.includes(term);
    });
  }

  _renderFilterChips() {
    const filters = [{ id: 'PENDENTES', label: 'Pendentes' }, { id: 'CONCLUÍDOS', label: 'Concluídos' }, { id: 'TODOS', label: 'Todos' }, { id: 'Agendamento', label: 'Agendamento' }];
    
    return filters.map(f => {
      const active = this.filterStatus === f.id ? 'active' : '';
      let count = 0;
      
      if (f.id === 'TODOS') {
        count = this.data.length;
      } else if (f.id === 'PENDENTES') {
        count = this.data.filter(item => {
          const s = (item['Status / Andamento'] || '').toUpperCase();
          return !s.includes('NORMALIZADO') && !s.includes('CANCELADO');
        }).length;
      } else if (f.id === 'CONCLUÍDOS') {
        count = this.data.filter(item => {
          const s = (item['Status / Andamento'] || '').toUpperCase();
          return s.includes('NORMALIZADO');
        }).length;
      } else {
        count = this.data.filter(item => {
          const s = (item['Status / Andamento'] || '').toUpperCase();
          return s.includes(f.id.toUpperCase());
        }).length;
      }
      
      return `<button class="filter-chip ${active}" data-filter="${f.id}">${f.label} (${count})</button>`;
    }).join('');
  }

  _renderCards() {
    if (!this.filteredData.length) {
      return `<div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
        <h3>Nenhum chamado encontrado</h3>
        <p>Ajuste os filtros ou a busca</p>
      </div>`;
    }

    return this.filteredData.map((item, i) => {
      const statusBadge = this._getStatusBadge(item['Status / Andamento'] || '');
      const diagBadge = this._getDiagBadge(item['Diagnóstico / Tipo de Falha'] || '');
      const endereco = item['Endereço'] || '';
      const numero = item['Número / Complemento'] || '';
      const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(endereco + ' ' + numero)}`;

      return `
        <div class="data-card" style="animation-delay: ${i * 30}ms">
          <div class="data-card-header">
            <div class="data-card-title">${escapeHTML(item['Razão Social / Cliente'] || 'Sem nome')}</div>
            ${statusBadge}
          </div>
          <div class="data-card-meta">
            ${diagBadge}
            <span class="meta-tag">📝 Protocolo: ${escapeHTML(item['Protocolo'] || '-')}</span>
            ${item['Dt. Abertura'] ? `<span class="meta-tag">📅 ${escapeHTML(item['Dt. Abertura'])}</span>` : ''}
          </div>
          <div class="data-card-body">
            <div class="field">
              <span class="field-label">Endereço completo: </span>${escapeHTML(endereco)}${numero ? ', ' + escapeHTML(numero) : ''}
            </div>
            <div class="field">
              <span class="field-label">Observações Gerais: </span>${escapeHTML(item['Observações Gerais'] || '-')}
            </div>
            ${item['Técnico / Responsável'] ? `<div class="field"><span class="field-label">Técnico: </span>${escapeHTML(item['Técnico / Responsável'])}</div>` : ''}
          </div>
          <div class="data-card-footer">
            <div class="data-card-actions">
              <a href="${mapsUrl}" target="_blank" class="action-btn" title="Ver no Mapa">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                Maps
              </a>
              <button class="action-btn" onclick="navigator.clipboard.writeText('${escapeHTML(item['Protocolo'] || '')}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                Copiar Prot.
              </button>
              ${canEdit('b2b') ? `<button class="action-btn action-btn-edit" data-idx="${i}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Editar
              </button>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  _getStatusBadge(status) {
    const s = status.toUpperCase();
    const text = escapeHTML(status) || 'Sem status';
    if (s.includes('NORMALIZADO')) return `<span class="badge badge-normalizado">${text}</span>`;
    if (s.includes('PENDENTE'))    return `<span class="badge badge-pendente">${text}</span>`;
    if (s.includes('ATENUAÇÃO') || s.includes('ATENUACAO')) return `<span class="badge badge-atenuacao">${text}</span>`;
    if (s.includes('AGENDAMENTO')) return `<span class="badge badge-agendado">${text}</span>`;
    if (s.includes('DESIGNADO'))   return `<span class="badge badge-designado">${text}</span>`;
    if (s.includes('CANCELADO'))   return `<span class="badge badge-cancelado">${text}</span>`;
    return `<span class="badge" style="background:var(--panel);color:var(--muted)">${text}</span>`;
  }

  _getDiagBadge(diag) {
    const d = diag.toUpperCase();
    const text = escapeHTML(diag) || 'Sem diagnóstico';
    if (d.includes('ROMPIMENTO'))  return `<span class="badge badge-rompimento">${text}</span>`;
    if (d.includes('QUALIDADE') || d.includes('ATENUAÇÃO')) return `<span class="badge badge-qualidade">${text}</span>`;
    if (d.includes('RÁDIO') || d.includes('RADIO'))  return `<span class="badge badge-radio">${text}</span>`;
    if (d.includes('SW') || d.includes('HW'))  return `<span class="badge badge-swhw">${text}</span>`;
    return `<span class="badge" style="background:var(--panel);color:var(--muted)">${text}</span>`;
  }

  _getUniqueValues(field) {
    const values = new Set();
    this.data.forEach(item => {
      const val = (item[field] || '').trim();
      if (val) values.add(val);
    });
    return Array.from(values).sort();
  }

  _bindEvents() {
    const search = this.container.querySelector('#b2b-search');
    if (search) {
      search.addEventListener('input', (e) => {
        this.searchTerm = e.target.value;
        this._applyFilters();
        const cardsEl = this.container.querySelector('#b2b-cards');
        if (cardsEl) cardsEl.innerHTML = this._renderCards();
      });
    }

    const selTecnico = this.container.querySelector('#b2b-filter-tecnico');
    if (selTecnico) {
      selTecnico.addEventListener('change', (e) => {
        this.filterTecnico = e.target.value;
        this._applyFilters();
        const cardsEl = this.container.querySelector('#b2b-cards');
        if (cardsEl) cardsEl.innerHTML = this._renderCards();
      });
    }

    const selDiag = this.container.querySelector('#b2b-filter-diagnostico');
    if (selDiag) {
      selDiag.addEventListener('change', (e) => {
        this.filterDiagnostico = e.target.value;
        this._applyFilters();
        const cardsEl = this.container.querySelector('#b2b-cards');
        if (cardsEl) cardsEl.innerHTML = this._renderCards();
      });
    }

    this.container.querySelectorAll('.filter-chip[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.filterStatus = btn.dataset.filter;
        this.render({ chamadosB2B: this.data });
      });
    });

    // Edit buttons
    this.container.querySelectorAll('.action-btn-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        const item = this.filteredData[idx];
        if (item && this._editCallback) {
          this._editCallback('b2b', item);
        }
      });
    });
  }

  renderLoading() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="module-header"><div class="module-title-group"><h2 class="module-title">📋 Chamados B2B</h2></div></div>
      ${Array(5).fill('<div class="skeleton skeleton-card"></div>').join('')}
    `;
  }
}
