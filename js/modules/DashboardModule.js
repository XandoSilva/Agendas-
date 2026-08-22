/**
 * DashboardModule - Visão Geral + Produtividade
 * Agora com KPIs dinâmicos calculados pelo cliente
 */
import { escapeHTML } from '../services/sheets-api.js';

export default class DashboardModule {
  constructor() {
    this.container = null;
    this.data = null;
    this.filterPeriod = 'GERAL'; // HOJE, SEMANA, MES, GERAL
  }

  init(container) {
    this.container = container;
  }

  render(data) {
    if (!this.container) return;
    this.data = data;
    
    // Calcula os stats dinamicamente
    const { kpis, produtividade } = this._calculateDynamicStats(data, this.filterPeriod);

    this.container.innerHTML = `
      <div class="module-header">
        <div class="module-title-group">
          <h2 class="module-title">📊 Painel Operacional</h2>
          <p class="module-subtitle">Visão consolidada de produtividade</p>
        </div>
        <div class="filters-bar" style="justify-content: flex-end;">
          <select id="dashboard-period" class="search-input" style="width: auto; padding: 8px 12px; background: var(--panel);">
            <option value="HOJE" ${this.filterPeriod === 'HOJE' ? 'selected' : ''}>Hoje</option>
            <option value="SEMANA" ${this.filterPeriod === 'SEMANA' ? 'selected' : ''}>Últimos 7 dias</option>
            <option value="MES" ${this.filterPeriod === 'MES' ? 'selected' : ''}>Este Mês</option>
            <option value="GERAL" ${this.filterPeriod === 'GERAL' ? 'selected' : ''}>Geral (Todos)</option>
          </select>
        </div>
      </div>

      <div class="kpi-grid">
        ${this._renderKPI('Chamados B2B', kpis.totalB2B, kpis.b2bNormalizados, 'teal')}
        ${this._renderKPI('Incidentes', kpis.totalIncidentes, kpis.incidentesConcluidos, 'coral')}
        ${this._renderKPI('Vistorias', kpis.totalVistorias, kpis.vistoriasConcluidas, 'amber')}
        ${this._renderKPI('Infra', kpis.totalInfra, kpis.infraConcluidas, 'violet')}
      </div>

      <div class="kpi-grid" style="margin-bottom: 28px;">
        ${this._renderRateKPI('Taxa Geral', this._calcRate(produtividade), 'sky')}
        ${this._renderCountKPI('Total Atribuído', this._sumField(produtividade, 'totalAtrib'), 'blue')}
        ${this._renderCountKPI('Total Concluído', this._sumField(produtividade, 'totalConcl'), 'green')}
        ${this._renderCountKPI('Técnicos Ativos', produtividade.filter(p => p.totalAtrib > 0).length, 'cyan')}
      </div>

      <h3 style="font-size:15px; font-weight:700; margin-bottom:14px; color:var(--text);">
        📈 Produtividade Individual
      </h3>
      ${this._renderProdTable(produtividade)}
    `;

    this._bindEvents();
  }

  _bindEvents() {
    const periodSelect = this.container.querySelector('#dashboard-period');
    if (periodSelect) {
      periodSelect.addEventListener('change', (e) => {
        this.filterPeriod = e.target.value;
        this.render(this.data);
      });
    }
  }

  _parseDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (match) {
      return new Date(match[3], parseInt(match[2]) - 1, match[1]);
    }
    return null;
  }

  _isDateInPeriod(dateStr, period) {
    if (period === 'GERAL') return true;
    const d = this._parseDate(dateStr);
    if (!d) return false;
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const dTime = d.getTime();
    
    if (period === 'HOJE') {
      return dTime === today.getTime();
    }
    if (period === 'SEMANA') {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      return d >= weekAgo && d <= today;
    }
    if (period === 'MES') {
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    }
    return true;
  }

  _calculateDynamicStats(data, period) {
    const kpis = {
      totalB2B: 0, b2bNormalizados: 0,
      totalIncidentes: 0, incidentesConcluidos: 0,
      totalVistorias: 0, vistoriasConcluidas: 0,
      totalInfra: 0, infraConcluidas: 0
    };
    
    const prodMap = {};

    const getProd = (tecnico) => {
      const t = (tecnico || '').trim();
      if (!t || t === '-' || t.toUpperCase() === 'A DEFINIR' || t.toUpperCase() === 'SEM ATUAÇÃO') return null;
      if (!prodMap[t]) {
        prodMap[t] = {
          tecnico: t,
          b2bAtrib: 0, b2bConcl: 0,
          incAtrib: 0, incConcl: 0,
          vistAtrib: 0, vistConcl: 0,
          infraAtrib: 0, infraConcl: 0,
          totalAtrib: 0, totalConcl: 0,
          eficacia: '0%'
        };
      }
      return prodMap[t];
    };

    // Chamados B2B
    (data.chamadosB2B || []).forEach(item => {
      const isAberto = this._isDateInPeriod(item['Dt. Abertura'], period);
      const isConcluido = this._isDateInPeriod(item['Dt. Finalizado'] || item['Dt. Finalizado / Previsão'], period) && 
                          ((item['Status'] || '').toUpperCase().includes('NORMALIZADO') || (item['Status'] || '').toUpperCase().includes('CONCLU'));
      
      const inScope = isAberto || isConcluido;
      const p = getProd(item['Técnico / Responsável']);

      if (inScope) {
        kpis.totalB2B++;
        if (p) { p.b2bAtrib++; p.totalAtrib++; }
      }
      if (isConcluido) {
        kpis.b2bNormalizados++;
        if (p) { p.b2bConcl++; p.totalConcl++; }
      }
    });

    // Incidentes
    (data.incidentes || []).forEach(item => {
      const isConcluido = (item['Status'] || '').toUpperCase().includes('NORMALIZADO') || (item['Status'] || '').toUpperCase().includes('CONCLU');
      const isConcluidoInPeriod = isConcluido && this._isDateInPeriod(item['Data Finalizado'], period);
      
      // Consider pending as open if Geral, otherwise we need an opening date which we don't have.
      // So if not concluded, we consider it open in any period it's viewed?
      // For Hojee/Semana, we only count incidentes closed in that period as 'Atribuídos' too, so efficacy works.
      const isAberto = !isConcluido && period === 'GERAL'; 
      const inScope = isAberto || isConcluidoInPeriod;
      
      const p = getProd(item['Responsável Técnico']);

      if (inScope) {
        kpis.totalIncidentes++;
        if (p) { p.incAtrib++; p.totalAtrib++; }
      }
      if (isConcluidoInPeriod) {
        kpis.incidentesConcluidos++;
        if (p) { p.incConcl++; p.totalConcl++; }
      }
    });

    // Vistorias
    (data.vistorias || []).forEach(item => {
      const isAberto = this._isDateInPeriod(item['Data Agendada'], period);
      const exec = item['Status Execução (Manual)'] || item['Concluído'] || '';
      const isConcluido = (item['Status da Vistoria'] || '').toUpperCase().includes('CONCLU') || 
                          (item['Status da Vistoria'] || '').toUpperCase().includes('REALIZAD') ||
                          exec.toUpperCase().includes('NORMALIZADO') ||
                          exec.toUpperCase().includes('CONCLU');
      
      const isConcluidoInPeriod = isConcluido && isAberto;
      const inScope = isAberto;

      const p = getProd(item['Responsável pela vistoria (Manual)'] || item['Atendente']);

      if (inScope) {
        kpis.totalVistorias++;
        if (p) { p.vistAtrib++; p.totalAtrib++; }
      }
      if (isConcluidoInPeriod) {
        kpis.vistoriasConcluidas++;
        if (p) { p.vistConcl++; p.totalConcl++; }
      }
    });

    // Infra
    (data.infra || []).forEach(item => {
      const isAberto = this._isDateInPeriod(item['Data Agendada'], period);
      const isConcluido = (item['Status Execução (Manual)'] || '').toUpperCase().includes('NORMALIZADO') ||
                          (item['Status Execução (Manual)'] || '').toUpperCase().includes('CONCLU');
      
      const isConcluidoInPeriod = isConcluido && isAberto;
      const inScope = isAberto;

      const p = getProd(item['Responsável pela infra (Manual)'] || item['Atendente']);

      if (inScope) {
        kpis.totalInfra++;
        if (p) { p.infraAtrib++; p.totalAtrib++; }
      }
      if (isConcluidoInPeriod) {
        kpis.infraConcluidas++;
        if (p) { p.infraConcl++; p.totalConcl++; }
      }
    });

    // Calcula eficácia e array
    const produtividade = Object.values(prodMap).map(p => {
      const rate = p.totalAtrib > 0 ? Math.round((p.totalConcl / p.totalAtrib) * 100) : 0;
      p.eficacia = rate + '%';
      return p;
    });

    // Ordenar por eficácia desc
    produtividade.sort((a, b) => parseInt(b.eficacia) - parseInt(a.eficacia));

    return { kpis, produtividade };
  }

  _renderKPI(label, total, done, color) {
    total = total || 0;
    done = done || 0;
    const pending = total - done;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return `
      <div class="kpi-card ${color}">
        <div class="kpi-label">${label}</div>
        <div class="kpi-value">${total}</div>
        <div class="kpi-sub">
          <span class="done">${done}</span> concluídos | <span class="pending">${pending}</span> pendentes
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
