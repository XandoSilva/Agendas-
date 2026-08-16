/**
 * EstoqueModule - Controle de Estoque VERO com IA Vision
 * Consome a aba "Estoque Disponível" (gid=738843736)
 */
import { escapeHTML } from '../services/sheets-api.js';
import { canEdit } from '../services/rbac.js';
import { VisionAPI } from '../services/vision-api.js';
import { enqueueWrite } from '../services/sheets-write-api.js';

export default class EstoqueModule {
  constructor() {
    this.container = null;
    this.data = [];
    this.allData = null;
    this.filterCat = 'TODOS';
    this.searchTerm = '';
    this._editCallback = null;
  }

  setEditCallback(cb) { this._editCallback = cb; }

  init(container) { this.container = container; }

  render(allData) {
    if (!this.container) return;
    this.allData = allData;
    this.data = allData.estoque || [];

    const filtered = this.data.filter(item => {
      const cat = (item['Categoria / Tipo'] || '').toUpperCase();
      let matchCat = this.filterCat === 'TODOS' || cat.includes(this.filterCat.toUpperCase());
      
      if (this.filterCat === 'Módulo') {
        matchCat = matchCat || cat.includes('TRANSCEPTOR');
      }

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
          <div class="module-actions" style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap;">
            <button class="btn" id="btn-ai-scan" style="background:var(--primary); display:flex; align-items:center;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px; height:16px; margin-right:6px;">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>
              </svg>
              Leitor IA
            </button>
            <button class="btn" id="btn-substitute" style="background:var(--purple); display:flex; align-items:center;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px; height:16px; margin-right:6px;">
                <path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>
              </svg>
              Substituição em Campo
            </button>
            <button class="btn btn-icon" id="btn-ai-settings" title="Configurar IA" style="background:transparent; border:1px solid var(--border); color:var(--text);">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px; height:16px;">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>
          </div>
        </div>
        <div class="filters-container">
          <div class="filters-actions">
            <div class="search-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" class="search-input" id="estoque-search" placeholder="Buscar série, modelo..." value="${escapeHTML(this.searchTerm)}">
            </div>
          </div>
          <div class="filters-scroll">
            ${['TODOS', 'ONU', 'Switch', 'Rádio', 'Módulo', 'Cabo'].map(f => {
              const active = this.filterCat === f ? 'active' : '';
              return `<button class="filter-chip ${active}" data-filter="${f}">${f}</button>`;
            }).join('')}
          </div>
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
              ${canEdit('estoque') ? '<th style="width:60px;">Ação</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${filtered.length === 0 ? 
              `<tr><td colspan="${canEdit('estoque') ? '7' : '6'}" style="text-align:center; padding: 40px;"><div class="empty-state"><h3>Nenhum material encontrado</h3><p>Ajuste os filtros ou a busca</p></div></td></tr>` :
              filtered.map((item, i) => this._renderRow(item, i)).join('')
            }
          </tbody>
        </table>
      </div>
    `;

    this._bindEvents();
  }

  _renderRow(item, i) {
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
    } else if (statusUpper.includes('RESERVA') || statusUpper.includes('USO') || statusUpper.includes('REVERSA')) {
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
        ${canEdit('estoque') ? `<td>
          <button class="action-btn action-btn-edit" data-idx="${i}" style="min-height:32px; padding:4px 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </td>` : ''}
      </tr>
    `;
  }

  _bindEvents() {
    const search = this.container.querySelector('#estoque-search');
    if (search) {
      search.addEventListener('input', (e) => {
        this.searchTerm = e.target.value;
        this.render(this.allData);
      });
    }

    this.container.querySelectorAll('.filter-chip[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.filterCat = btn.dataset.filter;
        this.render(this.allData);
      });
    });

    this.container.querySelectorAll('.action-btn-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        const filtered = this.data.filter(item => {
          const cat = (item['Categoria / Tipo'] || '').toUpperCase();
          const matchCat = this.filterCat === 'TODOS' || cat.includes(this.filterCat.toUpperCase());
          if (!this.searchTerm) return matchCat;
          const term = this.searchTerm.toLowerCase();
          const searchFields = [
            item['Nº de Série / Lote'], item['Marca / Fabricante'], item['Modelo'], item['Localização Física']
          ].join(' ').toLowerCase();
          return matchCat && searchFields.includes(term);
        });
        
        if (filtered[idx] && this._editCallback) {
          this._editCallback('estoque', filtered[idx]);
        }
      });
    });

    // IA Settings
    const btnAiSettings = this.container.querySelector('#btn-ai-settings');
    if (btnAiSettings) {
      btnAiSettings.addEventListener('click', () => {
        const currentKey = VisionAPI.getApiKey();
        const newKey = prompt("Insira a chave da API do Google Gemini (AI Studio):", currentKey);
        if (newKey !== null) {
          VisionAPI.setApiKey(newKey);
          alert("Chave de API salva com sucesso!");
        }
      });
    }

    // AI Scan
    const btnAiScan = this.container.querySelector('#btn-ai-scan');
    if (btnAiScan) {
      btnAiScan.addEventListener('click', () => this._handleAIScan());
    }

    // AI Substitute
    const btnSubstitute = this.container.querySelector('#btn-substitute');
    if (btnSubstitute) {
      btnSubstitute.addEventListener('click', () => this._handleSubstitute());
    }
  }

  _showCustomDialog(title, htmlContent, showCancel = false) {
    return new Promise((resolve) => {
      const modalHtml = `
      <div class="modal-overlay" id="custom-dialog-modal">
        <div class="modal-content" style="max-width:400px; width:90%;">
          <div class="modal-header">
            <h3>${title}</h3>
            <button class="close-btn" id="dialog-close-btn">&times;</button>
          </div>
          <div class="modal-body" style="padding: 16px; font-size: 14px; text-align: left;">
            ${htmlContent}
          </div>
          <div class="modal-footer" style="display:flex; justify-content:flex-end; gap:8px;">
            ${showCancel ? `<button class="btn btn-outline" id="dialog-cancel-btn" style="background:var(--bg-hover); color:var(--text-color); border:none; padding:8px 16px; border-radius:6px; cursor:pointer;">Cancelar</button>` : ''}
            <button class="btn btn-primary" id="dialog-confirm-btn" style="background:var(--primary-color); color:#fff; border:none; padding:8px 16px; border-radius:6px; cursor:pointer;">OK</button>
          </div>
        </div>
      </div>`;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
      const modal = document.getElementById('custom-dialog-modal');
      
      const cleanup = () => {
        if (document.body.contains(modal)) document.body.removeChild(modal);
      };
      
      const resolveCancel = () => { cleanup(); resolve({ confirmed: false }); };
      const resolveConfirm = () => { 
        const inputs = {};
        modal.querySelectorAll('.modal-body input').forEach(inp => inputs[inp.id] = inp.value);
        cleanup(); 
        resolve({ confirmed: true, inputs }); 
      };

      modal.querySelector('#dialog-close-btn').addEventListener('click', resolveCancel);
      if (showCancel) {
        modal.querySelector('#dialog-cancel-btn').addEventListener('click', resolveCancel);
      }
      modal.querySelector('#dialog-confirm-btn').addEventListener('click', resolveConfirm);
    });
  }

  async _handleAIScan() {
    if (!VisionAPI.hasApiKey()) {
      await this._showCustomDialog("Atenção", "Configure a chave da API do Gemini primeiro (ícone de engrenagem).", false);
      return;
    }
    const file = await this._promptCamera();
    if (!file) return;

    const overlay = this._showLoading("Analisando imagem com IA...");
    await new Promise(r => setTimeout(r, 50)); // Garante que a UI renderize o overlay
    
    try {
      const { base64, mimeType } = await VisionAPI.fileToBase64(file);
      const prompt = `Analise a imagem desta etiqueta de equipamento e retorne um JSON estrito, sem markdown, contendo as chaves: "marca", "modelo", "serial", "categoria". Se não identificar algo, deixe vazio.`;
      const result = await VisionAPI.analyzeImage(base64, mimeType, prompt);
      
      if (document.body.contains(overlay)) document.body.removeChild(overlay);
      
      const safeCat = escapeHTML(result.categoria || 'Outros');
      const safeMarca = escapeHTML(result.marca || '');
      const safeModelo = escapeHTML(result.modelo || '');
      const safeSerial = escapeHTML(result.serial || 'S/N Desconhecido');

      const msgHtml = `
        <p style="margin-bottom:12px;">Revise os dados capturados pela IA antes de adicionar ao estoque:</p>
        <div style="margin-bottom: 12px;">
          <label style="display:block; font-size:12px; margin-bottom:4px; color:var(--text-muted); font-weight:bold;">Categoria</label>
          <input type="text" id="ai-categoria" value="${safeCat}" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border); background:var(--bg-input); color:var(--text);">
        </div>
        <div style="margin-bottom: 12px;">
          <label style="display:block; font-size:12px; margin-bottom:4px; color:var(--text-muted); font-weight:bold;">Marca</label>
          <input type="text" id="ai-marca" value="${safeMarca}" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border); background:var(--bg-input); color:var(--text);">
        </div>
        <div style="margin-bottom: 12px;">
          <label style="display:block; font-size:12px; margin-bottom:4px; color:var(--text-muted); font-weight:bold;">Modelo</label>
          <input type="text" id="ai-modelo" value="${safeModelo}" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border); background:var(--bg-input); color:var(--text);">
        </div>
        <div style="margin-bottom: 12px;">
          <label style="display:block; font-size:12px; margin-bottom:4px; color:var(--text-muted); font-weight:bold;">Nº de Série / Lote</label>
          <input type="text" id="ai-serial" value="${safeSerial}" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border); background:var(--bg-input); color:var(--text);">
        </div>
      `;
      
      const { confirmed, inputs } = await this._showCustomDialog("Confirmar Entrada", msgHtml, true);
      
      if (confirmed) {
        const row = [
          inputs['ai-categoria'] || 'Outros',
          inputs['ai-marca'] || '',
          inputs['ai-modelo'] || '',
          inputs['ai-serial'] || 'S/N Desconhecido',
          1,
          1,
          'Disponível',
          'Sede / Depósito',
          new Date().toLocaleDateString('pt-BR'),
          'Cadastrado via IA'
        ];
        
        enqueueWrite('append', { sheetName: 'Estoque Disponível', rowData: row });
        await this._showCustomDialog("Sucesso", "Item adicionado à fila de sincronização com sucesso!", false);
        import('../services/sheets-write-api.js').then(m => m.processQueue());
      }
    } catch (err) {
      if (document.body.contains(overlay)) document.body.removeChild(overlay);
      await this._showCustomDialog("Erro na IA", err.message, false);
    }
  }

  async _handleSubstitute() {
    if (!VisionAPI.hasApiKey()) {
      alert("Configure a chave da API do Gemini primeiro (ícone de engrenagem).");
      return;
    }

    const modalHtml = `
      <div class="modal-overlay" id="substitute-modal">
        <div class="modal-content" style="max-width:500px;">
          <div class="modal-header">
            <h3>Substituição em Campo</h3>
            <button class="close-btn" onclick="document.body.removeChild(document.getElementById('substitute-modal'))">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <p><strong>1. Equipamento Retirado (Defeituoso)</strong></p>
            <div id="sub-retirado-data" style="margin-bottom:8px; font-size:13px; color:var(--text-dim);">Aguardando foto...</div>
            <button class="btn btn-outline" id="btn-foto-retirado" style="width:100%; margin-bottom: 24px;">📸 Tirar Foto da Etiqueta</button>

            <p><strong>2. Equipamento Novo (Instalado)</strong></p>
            <div id="sub-novo-data" style="margin-bottom:8px; font-size:13px; color:var(--text-dim);">Aguardando foto...</div>
            <button class="btn btn-outline" id="btn-foto-novo" style="width:100%; margin-bottom: 24px;">📸 Tirar Foto da Etiqueta</button>

            <p><strong>3. Chamado Relacionado</strong></p>
            <select id="sub-chamado-select" class="form-input" style="width:100%; margin-bottom: 24px;">
              <option value="">Selecione um chamado aberto...</option>
              ${this._getOpenTicketsOptions()}
            </select>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" onclick="document.body.removeChild(document.getElementById('substitute-modal'))">Cancelar</button>
            <button class="btn btn-primary" id="btn-sub-confirm" disabled>Confirmar Substituição</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.getElementById('substitute-modal');
    let retiradoData = null;
    let novoData = null;

    modal.querySelector('#btn-foto-retirado').addEventListener('click', async () => {
      const file = await this._promptCamera();
      if (!file) return;
      const overlay = this._showLoading("Analisando equipamento retirado...");
      await new Promise(r => setTimeout(r, 50));
      try {
        const { base64, mimeType } = await VisionAPI.fileToBase64(file);
        const prompt = `Analise a etiqueta e retorne JSON: {"marca":"", "modelo":"", "serial":"", "categoria":""}`;
        retiradoData = await VisionAPI.analyzeImage(base64, mimeType, prompt);
        if (document.body.contains(overlay)) document.body.removeChild(overlay);
        modal.querySelector('#sub-retirado-data').innerHTML = `
          <strong style="color:var(--text);">S/N: ${retiradoData.serial || '?'}</strong> - ${retiradoData.marca} ${retiradoData.modelo} <span class="badge badge-cancelado" style="font-size:10px;">Defeito</span>
        `;
        this._checkSubReady(modal, retiradoData, novoData);
      } catch (e) {
        if (document.body.contains(overlay)) document.body.removeChild(overlay);
        await this._showCustomDialog("Erro na IA", e.message, false);
      }
    });

    modal.querySelector('#btn-foto-novo').addEventListener('click', async () => {
      const file = await this._promptCamera();
      if (!file) return;
      const overlay = this._showLoading("Analisando equipamento novo...");
      await new Promise(r => setTimeout(r, 50));
      try {
        const { base64, mimeType } = await VisionAPI.fileToBase64(file);
        const prompt = `Analise a etiqueta e retorne JSON: {"marca":"", "modelo":"", "serial":"", "categoria":""}`;
        novoData = await VisionAPI.analyzeImage(base64, mimeType, prompt);
        if (document.body.contains(overlay)) document.body.removeChild(overlay);
        modal.querySelector('#sub-novo-data').innerHTML = `
          <strong style="color:var(--text);">S/N: ${novoData.serial || '?'}</strong> - ${novoData.marca} ${novoData.modelo} <span class="badge badge-normalizado" style="font-size:10px;">Novo</span>
        `;
        this._checkSubReady(modal, retiradoData, novoData);
      } catch (e) {
        if (document.body.contains(overlay)) document.body.removeChild(overlay);
        await this._showCustomDialog("Erro na IA", e.message, false);
      }
    });

    modal.querySelector('#btn-sub-confirm').addEventListener('click', () => {
      const select = modal.querySelector('#sub-chamado-select');
      const ticketId = select.value;
      const ticketText = select.options[select.selectedIndex].text;
      
      this._commitSubstitution(retiradoData, novoData, ticketId, ticketText);
      document.body.removeChild(modal);
    });
  }

  _checkSubReady(modal, retiradoData, novoData) {
    const btn = modal.querySelector('#btn-sub-confirm');
    if (retiradoData && novoData) {
      btn.removeAttribute('disabled');
    } else {
      btn.setAttribute('disabled', 'true');
    }
  }

  _commitSubstitution(retirado, novo, ticketVal, ticketText) {
    let sheetName = null;
    let rowIndex = null;

    if (ticketVal) {
      const parts = ticketVal.split('|');
      if (parts.length === 3) {
        rowIndex = parseInt(parts[1], 10);
        sheetName = parts[2];
      }
    }

    // 1. Adicionar o "Defeituoso" na aba "Logística Reversa"
    const rowRetirado = [
      retirado.categoria || 'Outros',     // Categoria
      retirado.marca || '',               // Marca
      retirado.modelo || '',              // Modelo
      retirado.serial || 'S/N Desconhecido', // Série
      1,                                  // Qtd
      1,                                  // Min
      'Defeituoso',                       // Status
      `Retirado em Campo (${ticketText})`, // Localização
      new Date().toLocaleDateString('pt-BR'), // Data
      ticketText || 'Sem chamado'         // Obs
    ];

    enqueueWrite('append', { sheetName: 'Logística Reversa', rowData: rowRetirado });

    // 2. Dar baixa no "Novo" ou cadastrar como "Em Uso"
    const rowNovo = [
      novo.categoria || 'Outros',
      novo.marca || '',
      novo.modelo || '',
      novo.serial || 'S/N Desconhecido',
      1,
      1,
      'Em Uso',
      `Instalado (${ticketText})`,
      new Date().toLocaleDateString('pt-BR'),
      'Instalado via Substituição em Campo'
    ];
    enqueueWrite('append', { sheetName: 'Estoque Disponível', rowData: rowNovo });

    // 3. Atualizar o chamado se selecionado
    if (sheetName && rowIndex) {
      const msgSub = `n[SISTEMA] Substituição em Campo: Retirado (${retirado.marca} ${retirado.serial || 'S/N Desconhecido'}) -> Instalado (${novo.marca} ${novo.serial || 'S/N Desconhecido'})`;
      // Atualizando coluna "Observações / Histórico" (coluna 11/K no B2B, 9/I no Inc)
      const targetCol = sheetName === 'Chamados B2B' ? 11 : 9;
      enqueueWrite('update', { sheetName, row: rowIndex, col: targetCol, value: msgSub });
    }

    alert('Substituição registrada! A fila offline enviará os dados em breve.');
  }

  _getOpenTicketsOptions() {
    let options = '';
    // B2B Pendentes
    const b2bPendentes = (this.allData?.chamadosB2B || []).filter(c => {
      const st = (c['Agendamento / Acesso'] || '').toUpperCase();
      return !st.includes('CONCLUÍDO') && !st.includes('CANCELADO');
    });
    b2bPendentes.forEach(c => {
      options += `<option value="B2B|${c._rowIndex}|Chamados B2B">[B2B] ${c['Cliente / Empresa']} - ${c['Agendamento / Acesso']}</option>`;
    });

    // Incidentes Pendentes
    const incPendentes = (this.allData?.incidentes || []).filter(c => {
      const st = (c['Status'] || '').toUpperCase();
      return !st.includes('CONCLUÍDO') && !st.includes('CANCELADO') && !st.includes('FINALIZADO');
    });
    incPendentes.forEach(c => {
      options += `<option value="INC|${c._rowIndex}|Incidentes">[INC] ${c['Origem']} - ${c['Ativo Relacionado']}</option>`;
    });

    return options;
  }

  _promptCamera() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      input.onchange = (e) => {
        resolve(e.target.files[0] || null);
      };
      input.click();
    });
  }

  _showLoading(msg) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content" style="text-align:center; padding: 40px; background:var(--bg-card);">
        <div class="spinner" style="margin: 0 auto 16px;"></div>
        <p style="color:var(--text); font-weight:500;">${msg}</p>
      </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
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
