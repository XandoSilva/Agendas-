/**
 * DashboardModule - Visão Geral + Produtividade
 * Consome a aba "📊 Visão Geral"
 */
import { escapeHTML } from '../services/sheets-api.js';

export default class DashboardModule {
  constructor() {
    this.container = null;
    this.data = null;
  }

  init(container) {
    this.container = container;
  }

  render(data) {
    if (!this.container) return;
    this.data = data;
    const vg = data.visaoGeral || {};
    const kpis = vg.kpis || {};
    const prod = vg.produtividade || [];

    this.container.innerHTML = `
      <div class="module-header">
        <div class="module-title-group">
          <h2 class="module-title">📊 Painel Operacional</h2>
          <p class="module-subtitle">Visão consolidada de produtividade — Período: ${escapeHTML(vg.filtros?.periodo || 'GERAL')}</p>
        </div>
      </div>

      <div class="kpi-grid">
        ${this._renderKPI('Chamados B2B', kpis.totalB2B, kpis.b2bNormalizados, 'teal')}
        ${this._renderKPI('Incidentes', kpis.totalIncidentes, kpis.incidentesConcluidos, 'coral')}
        ${this._renderKPI('Vistorias', kpis.totalVistorias, kpis.vistoriasConcluidas, 'amber')}
        ${this._renderKPI('Infra', kpis.totalInfra, kpis.infraConcluidas, 'violet')}
      </div>

      <div class="kpi-grid" style="margin-bottom: 28px;">
        ${this._renderRateKPI('Taxa Geral', this._calcRate(prod), 'sky')}
        ${this._renderCountKPI('Total Atribuído', this._sumField(prod, 'totalAtrib'), 'blue')}
        ${this._renderCountKPI('Total Concluído', this._sumField(prod, 'totalConcl'), 'green')}
        ${this._renderCountKPI('Técnicos Ativos', prod.filter(p => p.totalAtrib > 0).length, 'cyan')}
      </div>

      <h3 style="font-size:15px; font-weight:700; margin-bottom:14px; color:var(--text);">
        📈 Produtividade Individual
      </h3>
      ${this._renderProdTable(prod)}
    `;
  }

  _renderKPI(label, total, done, color) {
    total = total || 0;
    done = done || 0;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return `
      <div class="kpi-card ${color}">
        <div class="kpi-label">${label}</div>
        <div class="kpi-value">${total}</div>
        <div class="kpi-sub">
          <span class="done">${done}</span> concluídos
          <span style="margin-left:auto; font-family:var(--font-mono); font-weight:600;">${pct}%</span>
        </div>
        <div class="progress-bar" style="margin-top:10px;">
          <div class="progress-bar-fill ${color}" style="width:${pct}%"></div>
        </div>
      </div>
    `;
  }

  _renderRateKPI(label, rate, color) {
    return `
      <div class="kpi-card ${color}">
        <div class="kpi-label">${label}</div>
        <div class="kpi-value">${rate}%</div>
        <div class="kpi-sub">Eficácia consolidada</div>
      </div>
    `;
  }

  _renderCountKPI(label, count, color) {
    return `
      <div class="kpi-card ${color}">
        <div class="kpi-label">${label}</div>
        <div class="kpi-value">${count}</div>
      </div>
    `;
  }

  _renderProdTable(prod) {
    if (!prod.length) return '<div class="empty-state"><h3>Sem dados de produtividade</h3></div>';

    const rows = prod.map(p => {
      const rawRate = p.eficacia.replace(',','.').replace('%','');
      const rate = parseFloat(rawRate) || 0;
      const rateClass = rate >= 80 ? 'high' : rate >= 50 ? 'mid' : 'low';
      const barColor = rate >= 80 ? 'green' : rate >= 50 ? 'amber' : 'coral';

      return `
        <tr>
          <td class="prod-table-name">${escapeHTML(p.tecnico)}</td>
          <td style="text-align:center">${p.b2bAtrib}</td>
          <td style="text-align:center">${p.b2bConcl}</td>
          <td style="text-align:center">${p.incAtrib}</td>
          <td style="text-align:center">${p.incConcl}</td>
          <td style="text-align:center">${p.vistAtrib}</td>
          <td style="text-align:center">${p.vistConcl}</td>
          <td style="text-align:center">${p.infraAtrib}</td>
          <td style="text-align:center">${p.infraConcl}</td>
          <td style="text-align:center; font-weight:600">${p.totalAtrib}</td>
          <td style="text-align:center; font-weight:600; color:var(--green)">${p.totalConcl}</td>
          <td>
            <span class="prod-table-rate ${rateClass}">${escapeHTML(p.eficacia)}</span>
            <div class="progress-bar" style="margin-top:4px; width:80px;">
              <div class="progress-bar-fill ${barColor}" style="width:${rate}%"></div>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Técnico</th>
              <th style="text-align:center">B2B Atrib.</th>
              <th style="text-align:center">B2B Concl.</th>
              <th style="text-align:center">Inc. Atrib.</th>
              <th style="text-align:center">Inc. Concl.</th>
              <th style="text-align:center">Vist. Atrib.</th>
              <th style="text-align:center">Vist. Concl.</th>
              <th style="text-align:center">Infra Atrib.</th>
              <th style="text-align:center">Infra Concl.</th>
              <th style="text-align:center">Total</th>
              <th style="text-align:center">Concl.</th>
              <th>Eficácia</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  _calcRate(prod) {
    const totalA = this._sumField(prod, 'totalAtrib');
    const totalC = this._sumField(prod, 'totalConcl');
    return totalA > 0 ? Math.round((totalC / totalA) * 100) : 0;
  }

  _sumField(arr, field) {
    return arr.reduce((s, p) => s + (p[field] || 0), 0);
  }

  renderLoading() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="kpi-grid">
        ${Array(4).fill('<div class="skeleton skeleton-kpi"></div>').join('')}
      </div>
      ${Array(3).fill('<div class="skeleton skeleton-card"></div>').join('')}
    `;
  }
}
