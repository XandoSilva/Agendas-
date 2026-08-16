/**
 * EstoqueModule - Controle de Estoque VERO
 * Consome a aba "Estoque Disponível" (gid=738843736)
 */
import { escapeHTML } from '../services/sheets-api.js';

export default class EstoqueModule {
  constructor() {
    this.container = null;
    this.data = [];
    this.filterCat = 'TODOS';
    this.searchTerm = '';
  }

  init(container) { this.container = container; }

  render(allData) {
    if (!this.container) return;
    this.data = allData.estoque || [];

    const filtered = this.data.filter(item => {
      const cat = (item['Categoria / Tipo'] || '').toUpperCase();
      const matchCat = this.filterCat === 'TODOS' || cat.includes(this.filterCat.toUpperCase());

      if (!this.searchTerm) return matchCat;
      
      const term = this.searchTerm.toLowerCase();
      const searchFields = [
        item['Nº de Série / Lote'],
        item['Marca / Fabricante'],
        item['Modelo'],
        item['Localização Física']
      ].join(' ').toLowerCase();

      return matchCat && searchFields.includes(term);
    });

    const statusCounts = { normal: 0, alerta: 0, critico: 0 };
    let totalItems = 0;
    
    this.data.forEach(i => {
      const qtd = parseFloat(i['Qtd. em Estoque']) || 0;
      totalItems += qtd;
      const min = parseFloat(i['Estoque Mínimo']) || 0;
      
      const status = (i['Status do Equipamento'] || '').toUpperCase();
      
      if (status.includes('FALTA') || qtd === 0) {
        statusCounts.critico++;
      } else if (qtd <= min || status.includes('ALERTA')) {
        statusCounts.alerta++;
      } else {
        statusCounts.normal++;
      }
    });

    this.container.innerHTML = `
      <div class="module-header">
        <div class="module-title-group">
          <h2 class="module-title">📦 Estoque VERO</h2>
          <p class="module-subtitle">Controle de equipamentos e sobressalentes — ${this.data.length} registros</p>
        </div>
        <div class="filters-bar">
          <div class="search-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" class="search-input" id="estoque-search" placeholder="Buscar série, modelo..." value="${escapeHTML(this.searchTerm)}">
          </div>
          ${['TODOS', 'ONU', 'Switch', 'Rádio', 'Módulo', 'Cabo'].map(f => {
            const active = this.filterCat === f ? 'active' : '';
            return `<button class="filter-chip ${active}" data-filter="${f}">${f}</button>`;
          }).join('')}
        </div>
      </div>

      <div class="stat-row">
        <div class="stat-chip"><span class="stat-chip-value">${totalItems}</span> Unidades Totais</div>
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--green)">${statusCounts.normal}</span> OK</div>
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--amber)">${statusCounts.alerta}</span> Em Alerta</div>
        <div class="stat-chip"><span class="stat-chip-value" style="color:var(--coral)">${statusCounts.critico}</span> Falta</div>
      </div>

      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width:120px;">Nº Série / Lote</th>
              <th>Modelo / Marca</th>
              <th>Categoria</th>
              <th style="text-align:right;">Qtd</th>
              <th style="width:100px;">Status</th>
              <th>Localização</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.length === 0 ? 
              `<tr><td colspan="6" style="text-align:center; padding: 40px;"><div class="empty-state"><h3>Nenhum material encontrado</h3><p>Ajuste os filtros ou a busca</p></div></td></tr>` :
              filtered.map(item => this._renderRow(item)).join('')
            }
          </tbody>
        </table>
      </div>
    `;

    this._bindEvents();
  }

  _renderRow(item) {
    const qtd = parseFloat(item['Qtd. em Estoque']) || 0;
    const min = parseFloat(item['Estoque Mínimo']) || 0;
    const statusTextRaw = item['Status do Equipamento'] || '';
    const statusUpper = statusTextRaw.toUpperCase();
    
    let badgeClass = 'badge-normalizado';
    let statusText = statusTextRaw || 'OK';
    
    if (statusUpper.includes('FALTA') || qtd === 0) {
      badgeClass = 'badge-cancelado';
      statusText = statusTextRaw || 'Em Falta';
    } else if (qtd <= min || statusUpper.includes('ALERTA')) {
      badgeClass = 'badge-atenuacao';
      statusText = statusTextRaw || 'Atenção';
    } else if (statusUpper.includes('RESERVA') || statusUpper.includes('USO')) {
      badgeClass = 'badge-designado';
    } else {
      badgeClass = 'badge-normalizado';
    }

    const marcaModelo = [item['Marca / Fabricante'], item['Modelo']].filter(Boolean).join(' - ');

    return `
      <tr>
        <td style="font-family:var(--font-mono); font-weight:600;">${escapeHTML(item['Nº de Série / Lote'] || '-')}</td>
        <td style="font-weight:500; color:var(--text);">${escapeHTML(marcaModelo || '-')}</td>
        <td><span class="meta-tag">${escapeHTML(item['Categoria / Tipo'] || 'Outros')}</span></td>
        <td style="text-align:right; font-family:var(--font-mono); font-weight:700; color:var(--text);">
          ${qtd}
          <div style="font-size:9px; color:var(--muted); font-weight:normal;">Mín: ${min}</div>
        </td>
        <td><span class="badge ${badgeClass}">${escapeHTML(statusText)}</span></td>
        <td style="color:var(--text-dim); font-size:11px;">${escapeHTML(item['Localização Física'] || '-')}</td>
      </tr>
    `;
  }

  _bindEvents() {
    const search = this.container.querySelector('#estoque-search');
    if (search) {
      search.addEventListener('input', (e) => {
        this.searchTerm = e.target.value;
        this.render({ estoque: this.data });
      });
    }

    this.container.querySelectorAll('.filter-chip[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.filterCat = btn.dataset.filter;
        this.render({ estoque: this.data });
      });
    });
  }

  renderLoading() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="module-header"><div class="module-title-group"><h2 class="module-title">📦 Estoque VERO</h2></div></div>
      <div class="data-table-wrap">
        <div style="padding:20px;">
          ${Array(5).fill('<div class="skeleton skeleton-card" style="height:40px; margin-bottom:8px;"></div>').join('')}
        </div>
      </div>
    `;
  }
}
