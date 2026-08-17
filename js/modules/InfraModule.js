/**
 * InfraModule - Infraestrutura RJ
 * Consome a aba "Infra RJ" (gid=170808402)
 */
import { escapeHTML } from '../services/sheets-api.js';
import { canEdit } from '../services/rbac.js';

export default class InfraModule {
  constructor() {
    this.container = null;
    this.data = [];
    this.filterExec = 'ABERTOS';
    this.searchTerm = '';
    this._editCallback = null;
  }

  setEditCallback(cb) { this._editCallback = cb; }

  init(container) { this.container = container; }

  render(allData) {
    if (!this.container) return;
    this.data = allData.infra || [];

    const filtered = this.data.filter(i => {
      const s = (i['Status Execução (Manual)'] || '').toUpperCase();
      let execMatch = false;
      if (this.filterExec === 'TODOS') execMatch = true;
      else if (this.filterExec === 'ABERTOS') execMatch = !s.includes('CONCLUÍDO') && !s.includes('CONCLUIDO');
      else execMatch = s.includes(this.filterExec.toUpperCase());

      if (!this.searchTerm) return execMatch;

      const term = this.searchTerm.toLowerCase();
      const fields = [
        i['Contrato / Protocolo'], i['Razão Social / Cliente'], i['Localidade (Bairro/RJ)'], i['Endereço'], i['Endereço (Manual)'], i['Responsável pela infra (Manual)']
      ].join(' ').toLowerCase();

      return execMatch && fields.includes(term);
    });

    const execCounts = { 'Concluído': 0, 'Parcial': 0, 'Pendente': 0 };
    this.data.forEach(i => {
      const s = (i['Status Execução (Manual)'] || 'Pendente').trim();
      if (s) execCounts[s] = (execCounts[s] || 0) + 1;
    });

    const groups = {};
    filtered.forEach(item => {
      const dt = item['Data Agendada'] || 'Sem data';
      if (!groups[dt]) groups[dt] = [];
      groups[dt].push(item);
    });

    this.container.innerHTML = `
      <div class="module-header">
        <div class="module-title-group">
          <h2 class="module-title">🏗️ Infraestrutura</h2>
          <p class="module-subtitle">Obras e passagem de cabos — ${this.data.length} registros</p>
        </div>
        <div class="filters-container">
          <div class="filters-actions">
            <div class="search-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" class="search-input" id="infra-search" placeholder="Buscar Nº, endereço..." value="${escapeHTML(this.searchTerm)}">
            </div>
          </div>
          <div class="filters-scroll">
            ${['ABERTOS', 'TODOS', 'Concluído', 'Parcial', 'Pendente'].map(f => {
              const active = this.filterExec === f ? 'active' : '';
              let count = 0;
              if (f === 'TODOS') count = this.data.length;
              else if (f === 'ABERTOS') count = this.data.filter(i => {
                  const s = (i['Status Execução (Manual)'] || '').toUpperCase();
                  return !s.includes('CONCLUÍDO') && !s.includes('CONCLUIDO');
              }).length;
              else count = execCounts[f] || 0;
              return `<button class="filter-chip ${active}" data-filter="${f}">${f} (${count})</button>`;
            }).join('')}
          </div>
        </div>
      </div>

      <div class="stat-row">
        <div class="stat-chip"><span class="stat-chip-value">${this.data.length}</span> Total</div>
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--green)">${execCounts['Concluído'] || 0}</span> Concluídas</div>
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--amber)">${execCounts['Parcial'] || 0}</span> Parciais</div>
      </div>

      ${Object.keys(groups).length === 0 ? `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
          <h3>Nenhuma atividade de infra</h3><p>Ajuste os filtros</p>
        </div>` :
        Object.entries(groups).map(([date, items]) => `
          <div class="date-group">
            <div class="date-group-header">
              <span class="date-group-label">📅 ${escapeHTML(date)}</span>
              <span class="date-group-count">${items.length} atividade${items.length > 1 ? 's' : ''}</span>
            </div>
            <div class="cards-list">
              ${items.map((item, i) => this._renderCard(item, i)).join('')}
            </div>
          </div>
        `).join('')
      }
    `;

    this.container.querySelectorAll('.filter-chip[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.filterExec = btn.dataset.filter;
        this.render(allData);
      });
    });

    // Edit buttons
    this.container.querySelectorAll('.action-btn-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        const allFiltered = this.data.filter(i => {
          const s = (i['Status Execução (Manual)'] || '').toUpperCase();
          if (this.filterExec === 'TODOS') return true;
          if (this.filterExec === 'ABERTOS') return !s.includes('CONCLUÍDO') && !s.includes('CONCLUIDO');
          return s.includes(this.filterExec.toUpperCase());
        });
        if (allFiltered[idx] && this._editCallback) {
          this._editCallback('infra', allFiltered[idx]);
        }
      });
    });
  }

  _renderCard(item, i) {
    const tipo = (item['Tipo de Atividade'] || '').toUpperCase();
    const tipoBadge = tipo.includes('CONECTOR') ?
      '<span class="badge badge-conectorizado">Conectorizado</span>' :
      '<span class="badge badge-mono">Mono</span>';

    const exec = item['Status Execução (Manual)'] || '';
    const execBadge = this._getExecBadge(exec);

    const materiais = item['Materiais Necessários'] || '';
    const hasMateriais = materiais && materiais !== 'NÃO';

    return `
      <div class="data-card" style="animation-delay: ${i * 30}ms">
        <div class="data-card-header">
          <div class="data-card-title">${escapeHTML(item['Razão Social / Cliente'] || 'Sem nome')}</div>
          ${execBadge}
        </div>
        <div class="data-card-meta">
          ${tipoBadge}
          <span class="meta-tag">🕐 ${escapeHTML(item['Período / Horário'] || 'HC')}</span>
          <span class="meta-tag">📄 ${escapeHTML(item['Contrato / Protocolo'] || '-')}</span>
          <span class="meta-tag">📍 ${escapeHTML(item['Localidade (Bairro/RJ)'] || '-')}</span>
          ${hasMateriais ? `<span class="meta-tag" style="color:var(--amber)">🔧 ${escapeHTML(materiais)}</span>` : ''}
        </div>
        <div class="data-card-body">
          <div class="field"><span class="field-label">Atendente: </span>${escapeHTML(item['Atendente'] || '-')}</div>
          <div class="field"><span class="field-label">Detalhes: </span>${escapeHTML(item['Detalhes Atendimento'] || '-')}</div>
          ${item['ADM / Restrição'] && item['ADM / Restrição'] !== 'NÃO' ? `<div class="field"><span class="field-label">ADM: </span>${escapeHTML(item['ADM / Restrição'])}</div>` : ''}
          <div class="field"><span class="field-label">Responsável: </span>${escapeHTML(item['Responsável pela infra (Manual)'] || 'A Definir')}</div>
          ${item['Observações'] ? `<div class="field"><span class="field-label">Obs: </span>${escapeHTML(item['Observações']).substring(0, 200)}</div>` : ''}
          ${item['Observação geral (Manual)'] ? `<div class="field"><span class="field-label">Nota: </span>${escapeHTML(item['Observação geral (Manual)'])}</div>` : ''}
        </div>
        <div class="data-card-footer">
          <div class="data-card-actions">
            ${(item['Endereço (Manual)'] || item['Endereço (manual)'] || item['Endereço'] || item['Localidade (Bairro/RJ)']) ? `<a href="https://www.google.com/maps/search/${encodeURIComponent((item['Endereço (Manual)'] || item['Endereço (manual)'] || item['Endereço'] || item['Localidade (Bairro/RJ)']) + ' RJ')}" target="_blank" class="action-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Maps
            </a>` : ''}
            ${canEdit('infra') ? `<button class="action-btn action-btn-edit" data-idx="${i}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Editar
            </button>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  _getExecBadge(status) {
    const s = (status || '').toUpperCase();
    if (s.includes('CONCLUÍDO') || s.includes('CONCLUIDO')) return '<span class="badge badge-concluido">Concluído</span>';
    if (s.includes('NÃO REALIZADO') || s.includes('NAO REALIZADO')) return '<span class="badge badge-nao-realiz">Não Realizado</span>';
    if (s.includes('PARCIAL')) return '<span class="badge badge-validacao">Parcial</span>';
    if (s.includes('PENDENTE') || !s) return '<span class="badge badge-pendente">Pendente</span>';
    return `<span class="badge" style="background:var(--panel);color:var(--muted)">${escapeHTML(status)}</span>`;
  }

  renderLoading() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="module-header"><div class="module-title-group"><h2 class="module-title">🏗️ Infraestrutura RJ</h2></div></div>
      ${Array(5).fill('<div class="skeleton skeleton-card"></div>').join('')}
    `;
  }
}
