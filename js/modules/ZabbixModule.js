/**
 * ZabbixModule - Monitoramento Zabbix
 * Consome a aba "Alarmes_Ativos" exportada pelo script Python
 */
import { escapeHTML } from '../services/sheets-api.js';

export default class ZabbixModule {
  constructor() {
    this.container = null;
    this.data = [];
    this.filteredData = [];
    this.filterSeveridade = 'TODOS';
    this.filterRegional = '';
    this.searchTerm = '';
  }

  init(container) { this.container = container; }

  render(allData) {
    if (!this.container) return;
    this.data = allData.zabbix || [];
    this._applyFilters();

    const regionais = this._getUniqueValues('Regional');

    const desastreCount = this.data.filter(i => (i['Severidade'] || '').toUpperCase().includes('DESASTRE')).length;
    const altaCount = this.data.filter(i => (i['Severidade'] || '').toUpperCase().includes('ALTA')).length;
    const mediaCount = this.data.filter(i => (i['Severidade'] || '').toUpperCase().includes('MÉDIA') || (i['Severidade'] || '').toUpperCase().includes('MEDIA')).length;

    this.container.innerHTML = `
      <div class="module-header">
        <div class="module-title-group">
          <h2 class="module-title">📈 Monitoramento Zabbix</h2>
          <p class="module-subtitle">Alarmes operacionais em tempo real — ${this.data.length} ativos</p>
        </div>
        <div class="filters-container">
          <div class="filters-actions">
            <div class="search-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" class="search-input" id="zbx-search" placeholder="Buscar alarme/host..." value="${escapeHTML(this.searchTerm)}">
            </div>
            <select id="zbx-filter-regional" class="search-input" style="padding-left: 12px; max-width: 150px; text-overflow: ellipsis;">
              <option value="">Regional (Todas)</option>
              ${regionais.map(r => `<option value="${escapeHTML(r)}" ${this.filterRegional === r ? 'selected' : ''}>${escapeHTML(r)}</option>`).join('')}
            </select>
          </div>
          <div class="filters-scroll">
            ${this._renderFilterChips()}
          </div>
        </div>
      </div>

      <div class="stat-row">
        <div class="stat-chip"><span class="stat-chip-value">${this.data.length}</span> Total</div>
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--red)">${desastreCount}</span> Desastres</div>
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--orange)">${altaCount}</span> Alta</div>
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--amber)">${mediaCount}</span> Média</div>
      </div>

      <div class="cards-list" id="zbx-cards">
        ${this._renderCards()}
      </div>
    `;

    this._bindEvents();
  }

  _applyFilters() {
    this.filteredData = this.data.filter(item => {
      const severidade = (item['Severidade'] || '').toUpperCase();
      const reg = (item['Regional'] || '').trim();
      
      if (this.filterRegional && (item['Regional'] || '').trim() !== this.filterRegional) {
        return false;
      }

      let matchSeverity = false;
      if (this.filterSeveridade === 'TODOS') matchSeverity = true;
      else matchSeverity = severidade.includes(this.filterSeveridade.toUpperCase());
      
      if (!this.searchTerm) return matchSeverity;
      const term = this.searchTerm.toLowerCase();
      const searchFields = [
        item['Host'], 
        item['Alarme'], 
        item['Regional'],
        item['ID Evento']
      ].join(' ').toLowerCase();
      return matchSeverity && searchFields.includes(term);
    });
  }


  _renderFilterChips() {
    const filters = [
      { id: 'TODOS', label: 'Todos' },
      { id: 'DESASTRE', label: 'Desastre' }, 
      { id: 'ALTA', label: 'Alta' }, 
      { id: 'MÉDIA', label: 'Média' },
      { id: 'ATENÇÃO', label: 'Atenção' }
    ];
    
    return filters.map(f => {
      const active = this.filterSeveridade === f.id ? 'active' : '';
      let count = 0;
      
      if (f.id === 'TODOS') {
        count = this.data.length;
      } else {
        count = this.data.filter(item => {
          const s = (item['Severidade'] || '').toUpperCase();
          return s.includes(f.id.toUpperCase().replace('É', 'E').replace('Ç', 'C')); // basic normalization
        }).length;
      }
      
      return `<button class="filter-chip ${active}" data-filter="${f.id}">${f.label} (${count})</button>`;
    }).join('');
  }

  _renderCards() {
    if (!this.filteredData.length) {
      return `<div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        <h3>Nenhum alarme encontrado</h3>
        <p>Ajuste os filtros ou a busca</p>
      </div>`;
    }

    return this.filteredData.map((item, i) => {
      const sevBadge = this._getSeverityBadge(item['Severidade'] || '');
      const reconhecido = (item['Reconhecido'] || '').toUpperCase() === 'SIM' 
        ? '<span class="badge badge-normalizado">Reconhecido (Ack)</span>' 
        : '';

      return `
        <div class="data-card" style="animation-delay: ${i * 30}ms">
          <div class="data-card-header">
            <div class="data-card-title">${escapeHTML(item['Host'] || 'Host Desconhecido')}</div>
            ${sevBadge}
          </div>
          <div class="data-card-meta">
            <span class="meta-tag">📍 ${escapeHTML(item['Regional'] || '-')}</span>
            <span class="meta-tag">⏱️ Duração: ${escapeHTML(item['Duração'] || '-')}</span>
            ${reconhecido}
          </div>
          <div class="data-card-body">
            <div class="field"><span class="field-label">Alarme: </span>${escapeHTML(item['Alarme'] || '-')}</div>
            <div class="field"><span class="field-label">Início: </span>${escapeHTML(item['Início'] || '-')}</div>
          </div>
          <div class="data-card-footer" style="padding-top:12px; margin-top:12px; border-top: 1px solid var(--border)">
            <div class="field"><span class="field-label">ID Zabbix: </span>${escapeHTML(item['ID Evento'] || '-')}</div>
            <div class="field" style="text-align:right"><span class="field-label">Atualizado: </span>${escapeHTML(item['Data/Hora Coleta'] || '-')}</div>
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

  _getSeverityBadge(sev) {
    const s = sev.toUpperCase();
    if (s.includes('DESASTRE')) return '<span class="badge" style="background:#dc2626;color:#fff">Desastre</span>';
    if (s.includes('ALTA'))     return '<span class="badge" style="background:#f97316;color:#fff">Alta</span>';
    if (s.includes('MÉDIA') || s.includes('MEDIA')) return '<span class="badge" style="background:#f59e0b;color:#fff">Média</span>';
    if (s.includes('ATENÇÃO') || s.includes('ATENCAO')) return '<span class="badge" style="background:#3b82f6;color:#fff">Atenção</span>';
    return `<span class="badge" style="background:var(--panel);color:var(--muted)">${escapeHTML(sev) || 'Desconhecida'}</span>`;
  }

  _bindEvents() {
    const search = this.container.querySelector('#zbx-search');
    if (search) {
      search.addEventListener('input', (e) => {
        this.searchTerm = e.target.value;
        this._applyFilters();
        const cardsEl = this.container.querySelector('#zbx-cards');
        if (cardsEl) cardsEl.innerHTML = this._renderCards();
      });
    }

    const selRegional = this.container.querySelector('#zbx-filter-regional');
    if (selRegional) {
      selRegional.addEventListener('change', (e) => {
        this.filterRegional = e.target.value;
        this.render({ zabbix: this.data });
      });
    }

    this.container.querySelectorAll('.filter-chip[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.filterSeveridade = btn.dataset.filter;
        this.render({ zabbix: this.data });
      });
    });
  }

  renderLoading() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="module-header"><div class="module-title-group"><h2 class="module-title">📈 Monitoramento Zabbix</h2></div></div>
      ${Array(4).fill('<div class="skeleton skeleton-card"></div>').join('')}
    `;
  }
}
