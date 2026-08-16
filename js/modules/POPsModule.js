/**
 * POPsModule - POPs & Preventivas
 * Consome a aba "POPs & Preventivas" (gid=705477249)
 */
import { escapeHTML } from '../services/sheets-api.js';

export default class POPsModule {
  constructor() {
    this.container = null;
    this.data = [];
  }

  init(container) { this.container = container; }

  render(allData) {
    if (!this.container) return;
    this.data = allData.pops || [];

    const totalAssinantes = this.data.reduce((s, p) => s + (parseInt(p['Assinantes']) || 0), 0);
    const totalReceita = this.data.reduce((s, p) => {
      const val = (p['Receita Mensal (R$)'] || '').replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
      return s + (parseFloat(val) || 0);
    }, 0);

    const p1 = this.data.filter(p => (p['Peso / Prioridade'] || '').includes('P1'));
    const p2 = this.data.filter(p => (p['Peso / Prioridade'] || '').includes('P2'));
    const p3 = this.data.filter(p => (p['Peso / Prioridade'] || '').includes('P3'));

    this.container.innerHTML = `
      <div class="module-header">
        <div class="module-title-group">
          <h2 class="module-title">📡 POPs & Preventivas</h2>
          <p class="module-subtitle">Estações ativas e cronograma de manutenção preventiva</p>
        </div>
      </div>

      <div class="kpi-grid" style="margin-bottom: 24px;">
        <div class="kpi-card sky">
          <div class="kpi-label">Total POPs</div>
          <div class="kpi-value">${this.data.length}</div>
        </div>
        <div class="kpi-card coral">
          <div class="kpi-label">POPs Críticos (P1)</div>
          <div class="kpi-value">${p1.length}</div>
        </div>
        <div class="kpi-card green">
          <div class="kpi-label">Assinantes</div>
          <div class="kpi-value">${totalAssinantes.toLocaleString('pt-BR')}</div>
        </div>
        <div class="kpi-card teal">
          <div class="kpi-label">Receita Protegida</div>
          <div class="kpi-value" style="font-size:22px;">R$ ${totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      ${this._renderSection('🔴 Prioridade P1 — CRÍTICA', p1)}
      ${this._renderSection('🟡 Prioridade P2 — ALTA', p2)}
      ${this._renderSection('🟢 Prioridade P3 — PADRÃO', p3)}
    `;
  }

  _renderSection(title, pops) {
    if (!pops.length) return '';
    return `
      <h3 style="font-size:14px; font-weight:700; margin: 20px 0 12px; color:var(--text);">${title}</h3>
      <div class="cards-grid" style="margin-bottom: 16px;">
        ${pops.map((p, i) => this._renderPOPCard(p, i)).join('')}
      </div>
    `;
  }

  _renderPOPCard(p, i) {
    const prio = (p['Peso / Prioridade'] || '').toUpperCase();
    const prioClass = prio.includes('P1') ? 'badge-p1' : prio.includes('P2') ? 'badge-p2' : 'badge-p3';
    const tech = (p['Tecnologia Principal'] || '').toUpperCase();
    const techBadge = tech.includes('FIBRA') ? 
      '<span class="badge badge-conectorizado">Fibra Óptica</span>' :
      '<span class="badge badge-mono">Rádio / RF</span>';

    const endereco = p['Endereço Completo'] || '';
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(endereco)}`;

    const receita = p['Receita Mensal (R$)'] || 'R$ 0,00';

    return `
      <div class="pop-card" style="animation: slideUp 0.4s var(--ease-out) ${i * 50}ms both;">
        <div class="pop-card-header">
          <div>
            <span class="pop-sigla">${escapeHTML(p['Sigla'] || '-')}</span>
            <div style="font-size:13px; font-weight:600; color:var(--text); margin-top:2px;">
              ${escapeHTML(p['Nome do POP / Estação'] || '-')}
            </div>
            <div style="font-size:11px; color:var(--muted); margin-top:2px;">
              ${escapeHTML(p['Região / Município'] || '-')}
            </div>
          </div>
          <span class="badge ${prioClass}">${escapeHTML(p['Peso / Prioridade'] || '-')}</span>
        </div>

        <div class="data-card-meta" style="margin-bottom:10px;">
          ${techBadge}
          <span class="meta-tag">${escapeHTML(p['Frequência Preventiva'] || '-')}</span>
          <span class="meta-tag" style="color:${p['Status Preventiva'] === 'Em Dia' ? 'var(--green)' : 'var(--amber)'}">${escapeHTML(p['Status Preventiva'] || '-')}</span>
        </div>

        <div class="pop-info">
          <div class="pop-stat">
            <span class="pop-stat-label">Assinantes</span>
            <span class="pop-stat-value">${escapeHTML(p['Assinantes'] || '0')}</span>
          </div>
          <div class="pop-stat">
            <span class="pop-stat-label">Receita Mensal</span>
            <span class="pop-stat-value currency">${escapeHTML(receita)}</span>
          </div>
          <div class="pop-stat">
            <span class="pop-stat-label">Papel na Rede</span>
            <span class="pop-stat-value" style="font-size:11px;">${escapeHTML(p['Papel na Rede / Hub'] || '-')}</span>
          </div>
          <div class="pop-stat">
            <span class="pop-stat-label">Checklist</span>
            <span class="pop-stat-value" style="font-size:10px; color:var(--muted);">${escapeHTML((p['Checklist Principal de Campo'] || '-').substring(0, 60))}</span>
          </div>
        </div>

        <div class="data-card-footer" style="margin-top:12px; padding-top:10px; border-top:1px solid var(--line-subtle);">
          <div style="font-size:10px; color:var(--muted);">${escapeHTML((p['Contrato Locação / Observações'] || '').substring(0, 80))}</div>
          <a href="${mapsUrl}" target="_blank" class="action-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Maps
          </a>
        </div>
      </div>
    `;
  }

  renderLoading() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="module-header"><div class="module-title-group"><h2 class="module-title">📡 POPs & Preventivas</h2></div></div>
      <div class="kpi-grid">${Array(4).fill('<div class="skeleton skeleton-kpi"></div>').join('')}</div>
      <div class="cards-grid">${Array(6).fill('<div class="skeleton skeleton-card"></div>').join('')}</div>
    `;
  }
}
