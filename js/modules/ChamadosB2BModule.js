/**
 * ChamadosB2BModule - Chamados B2B corporativos
 * Consome a aba "Chamados B2B" (gid=2005931044)
 */
import { escapeHTML } from '../services/sheets-api.js';

export default class ChamadosB2BModule {
  constructor() {
    this.container = null;
    this.data = [];
    this.filteredData = [];
    this.filterStatus = 'ABERTOS';
    this.searchTerm = '';
  }

  init(container) {
    this.container = container;
  }

  render(allData) {
    if (!this.container) return;
    this.data = allData.chamadosB2B || [];
    this._applyFilters();

    const statusCounts = this._countByField('Status / Andamento');

    this.container.innerHTML = `
      <div class="module-header">
        <div class="module-title-group">
          <h2 class="module-title">📋 Chamados B2B</h2>
          <p class="module-subtitle">Atendimentos corporativos — ${this.data.length} registros</p>
        </div>
        <div class="filters-bar">
          <div class="search-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" class="search-input" id="b2b-search" placeholder="Buscar cliente, protocolo..." value="${escapeHTML(this.searchTerm)}">
          </div>
          ${this._renderFilterChips(statusCounts)}
        </div>
      </div>

      <div class="stat-row">
        <div class="stat-chip"><span class="stat-chip-value">${this.data.length}</span> Total</div>
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--green)">${statusCounts['NORMALIZADO'] || 0}</span> Normalizados</div>
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--amber)">${statusCounts['Pendente'] || 0}</span> Pendentes</div>
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--orange)">${statusCounts['Atenuação'] || 0}</span> Atenuação</div>
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
      let matchStatus = false;
      if (this.filterStatus === 'TODOS') matchStatus = true;
      else if (this.filterStatus === 'ABERTOS') matchStatus = !status.includes('NORMALIZADO') && !status.includes('CANCELADO');
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

  _renderFilterChips(counts) {
    const filters = ['ABERTOS', 'TODOS', 'NORMALIZADO', 'Pendente', 'Atenuação', 'Agendamento'];
    const abertosCount = this.data.filter(item => {
      const s = (item['Status / Andamento'] || '').toUpperCase();
      return !s.includes('NORMALIZADO') && !s.includes('CANCELADO');
    }).length;

    return filters.map(f => {
      const active = this.filterStatus === f ? 'active' : '';
      let count = 0;
      if (f === 'TODOS') count = this.data.length;
      else if (f === 'ABERTOS') count = abertosCount;
      else count = counts[f] || 0;
      return `<button class="filter-chip ${active}" data-filter="${f}">${f} (${count})</button>`;
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
            <span class="meta-tag">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              ${escapeHTML(item['Dt. Abertura'] || '')}
            </span>
            <span class="meta-tag">📝 ${escapeHTML(item['Protocolo'] || '-')}</span>
            ${item['Contrato'] && item['Contrato'] !== '-' ? `<span class="meta-tag">📄 ${escapeHTML(item['Contrato'])}</span>` : ''}
          </div>
          <div class="data-card-body">
            <div class="field">
              <span class="field-label">Endereço: </span>${escapeHTML(endereco)}${numero ? ', ' + escapeHTML(numero) : ''}
            </div>
            <div class="field">
              <span class="field-label">Técnico: </span>${escapeHTML(item['Técnico / Responsável'] || 'A Definir')}
            </div>
            ${item['Observações Gerais'] ? `<div class="field"><span class="field-label">Obs: </span>${escapeHTML(item['Observações Gerais'])}</div>` : ''}
            ${item['Dt. Finalizado / Previsão'] && item['Dt. Finalizado / Previsão'] !== '0' ? `<div class="field"><span class="field-label">Finalizado: </span>${escapeHTML(item['Dt. Finalizado / Previsão'])}</div>` : ''}
          </div>
          <div class="data-card-footer">
            <div class="data-card-actions">
              <a href="${mapsUrl}" target="_blank" class="action-btn" title="Ver no Mapa">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                Maps
              </a>
              <button class="action-btn" onclick="navigator.clipboard.writeText('${escapeHTML(item['Protocolo'] || '')}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                Copiar
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  _getStatusBadge(status) {
    const s = status.toUpperCase();
    if (s.includes('NORMALIZADO')) return '<span class="badge badge-normalizado">Normalizado</span>';
    if (s.includes('PENDENTE'))    return '<span class="badge badge-pendente">Pendente</span>';
    if (s.includes('ATENUAÇÃO') || s.includes('ATENUACAO')) return '<span class="badge badge-atenuacao">Atenuação</span>';
    if (s.includes('AGENDAMENTO')) return '<span class="badge badge-agendado">Agendamento</span>';
    if (s.includes('DESIGNADO'))   return '<span class="badge badge-designado">Designado</span>';
    if (s.includes('CANCELADO'))   return '<span class="badge badge-cancelado">Cancelado</span>';
    return `<span class="badge" style="background:var(--panel);color:var(--muted)">${escapeHTML(status)}</span>`;
  }

  _getDiagBadge(diag) {
    const d = diag.toUpperCase();
    if (d.includes('ROMPIMENTO'))  return '<span class="badge badge-rompimento">Rompimento</span>';
    if (d.includes('QUALIDADE') || d.includes('ATENUAÇÃO')) return '<span class="badge badge-qualidade">Qualidade</span>';
    if (d.includes('RÁDIO') || d.includes('RADIO'))  return '<span class="badge badge-radio">Falha Rádio</span>';
    if (d.includes('SW') || d.includes('HW'))  return '<span class="badge badge-swhw">SW/HW</span>';
    return `<span class="badge" style="background:var(--panel);color:var(--muted)">${escapeHTML(diag)}</span>`;
  }

  _countByField(field) {
    const counts = {};
    this.data.forEach(item => {
      const val = (item[field] || 'Sem status').trim();
      counts[val] = (counts[val] || 0) + 1;
    });
    return counts;
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

    this.container.querySelectorAll('.filter-chip[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.filterStatus = btn.dataset.filter;
        this.render({ chamadosB2B: this.data });
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
