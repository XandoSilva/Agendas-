import { fetchEntries, persistEntry } from '../services/api.js';

let manutencoes = [];
const TABLE_NAME = 'manutencoes';

export async function initManutencaoModule() {
  await loadManutencoes();
  setupListeners();
  setupOCR();
  renderTimeline();
}

async function loadManutencoes() {
  manutencoes = await fetchEntries(TABLE_NAME, (payload) => {
    if (payload.eventType === 'INSERT') {
      if (!manutencoes.some(m => m.id === payload.new.id)) manutencoes.push(payload.new);
    } else if (payload.eventType === 'UPDATE') {
      const idx = manutencoes.findIndex(m => m.id === payload.new.id);
      if (idx >= 0) manutencoes[idx] = payload.new;
    } else if (payload.eventType === 'DELETE') {
      manutencoes = manutencoes.filter(m => m.id !== payload.old.id);
    }
    renderTimeline();
  });
  // Sort newest first
  manutencoes.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

function setupListeners() {
  const form = document.getElementById('form-man');
  const btnClear = document.getElementById('btnClearFormMan');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const idInput = document.getElementById('m_id');
      
      const existingRecord = manutencoes.find(m => m.id === idInput.value) || {};
      
      const record = {
        ...existingRecord,
        id: idInput.value || 'man-' + Date.now(),
        protocolo: document.getElementById('m_protocolo').value,
        contrato: document.getElementById('m_contrato').value,
        cliente: document.getElementById('m_cliente').value,
        contato: document.getElementById('m_contato').value,
        endereco: document.getElementById('m_endereco').value,
        telefones: document.getElementById('m_telefones').value,
        empreiteira: document.getElementById('m_empreiteira').value,
        tipo_reclamacao: document.getElementById('m_tipo_reclamacao').value,
        obs_despacho: document.getElementById('m_obs_despacho').value,
        descricao: document.getElementById('m_descricao').value,
        status: document.getElementById('m_status').value,
      };

      if (!idInput.value) {
        record.created_at = new Date().toISOString();
      }

      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.textContent = 'Salvando...';
      btn.disabled = true;

      try {
        await persistEntry(TABLE_NAME, record, false, false, manutencoes);
        
        // Update local state
        const idx = manutencoes.findIndex(m => m.id === record.id);
        if (idx > -1) {
          manutencoes[idx] = { ...manutencoes[idx], ...record };
        } else {
          manutencoes.unshift(record);
        }
        
        form.reset();
        idInput.value = '';
        clearOCRPreview();
        renderTimeline();
        
        // Go back to list on mobile
        if (window.innerWidth <= 1024) {
          const mobileListBtn = document.querySelector('.mobile-nav-item[data-tab="manutencao"]');
          if (mobileListBtn) mobileListBtn.click();
        }
      } catch (err) {
        console.error("Erro ao salvar", err);
        alert("Erro ao salvar a manutenção.");
      } finally {
        btn.textContent = originalText;
        btn.disabled = false;
      }
    });
  }

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      form.reset();
      document.getElementById('m_id').value = '';
      clearOCRPreview();
    });
  }
}

/**
 * OCR setup
 */
function setupOCR() {
  const pasteZone = document.getElementById('imagePasteZone');
  if (!pasteZone) return;

  // Listen to paste events globally when zone is clicked, or directly on the zone
  pasteZone.addEventListener('paste', handlePaste);
  // Also globally if inside the tab
  document.addEventListener('paste', (e) => {
    // Only capture if we are in the form-man context
    if (document.getElementById('module-manutencao').style.display !== 'none' 
        && document.getElementById('intake-man').style.display !== 'none') {
      handlePaste(e);
    }
  });

  // Drag and drop support
  pasteZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    pasteZone.style.borderColor = 'var(--accent)';
  });
  pasteZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    pasteZone.style.borderColor = 'var(--teal)';
  });
  pasteZone.addEventListener('drop', (e) => {
    e.preventDefault();
    pasteZone.style.borderColor = 'var(--teal)';
    const items = e.dataTransfer.items;
    processItems(items);
  });
}

function handlePaste(e) {
  const items = e.clipboardData.items;
  processItems(items);
}

function processItems(items) {
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      const blob = items[i].getAsFile();
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        
        // Pre-processamento da imagem para melhorar OCR
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const scale = 2.0; // Ampliar 2x
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          
          // Fundo branco
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Suavização
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const processedUrl = canvas.toDataURL('image/jpeg', 1.0);
          
          // MOSTRAR A IMAGEM PROCESSADA NO PREVIEW
          showOCRPreview(processedUrl);
          
          // Passar imagem processada para o OCR
          performOCR(processedUrl);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(blob);
      break; // process only one image
    }
  }
}

function showOCRPreview(dataUrl) {
  const preview = document.getElementById('ocrPreview');
  const status = document.getElementById('ocrStatus');
  
  preview.src = dataUrl;
  preview.style.display = 'block';
  status.textContent = "Imagem carregada. Lendo texto...";
}

function clearOCRPreview() {
  const preview = document.getElementById('ocrPreview');
  const status = document.getElementById('ocrStatus');
  const progressBar = document.getElementById('ocrProgress');
  
  preview.src = '';
  preview.style.display = 'none';
  status.textContent = "Clique, cole (Ctrl+V) ou solte uma imagem aqui";
  progressBar.style.display = 'none';
}

async function performOCR(imageSrc) {
  if (typeof Tesseract === 'undefined') {
    alert("Tesseract OCR não está carregado. Verifique sua conexão com a internet.");
    return;
  }

  const status = document.getElementById('ocrStatus');
  const progressBarContainer = document.getElementById('ocrProgress');
  const progressBar = document.getElementById('ocrProgressBar');

  progressBarContainer.style.display = 'block';
  progressBar.style.width = '0%';

  try {
    status.textContent = "Iniciando motor OCR...";
    const result = await Tesseract.recognize(
      imageSrc,
      'por',
      {
        logger: m => {
          if (m.status === 'recognizing text') {
            const pct = Math.round(m.progress * 100);
            progressBar.style.width = pct + '%';
            status.textContent = `Lendo texto... ${pct}%`;
          }
        }
      }
    );

    status.textContent = "Leitura concluída!";
    setTimeout(() => { progressBarContainer.style.display = 'none'; }, 500);

    parseOCRText(result.data.text);
  } catch (err) {
    console.error("OCR Error Detalhado:", err);
    const errMsg = err.message ? err.message : JSON.stringify(err);
    status.textContent = "Erro OCR (Nova Versão): " + errMsg;
    progressBarContainer.style.display = 'none';
  }
}

function parseOCRText(text) {
  console.log("OCR Result Text:", text);
  
  // Normalizar múltiplos espaços e quebras de linha para uma linha única e limpa
  const cleanText = text.replace(/\s+/g, ' ');

  // Helper para extração segura com regex
  const extract = (regex) => {
    const match = cleanText.match(regex);
    return match ? match[1].trim() : '';
  };

  // Regras de extração baseadas no layout da imagem fornecida
  const protocolo = extract(/Protocolo[:\s]+([A-Z0-9-]+)/i);
  const contrato = extract(/Contrato[:\s]+(\d+)/i);
  
  // Pega tudo após Razão Social ou Nome Cliente até encontrar as próximas palavras chave
  const cliente = extract(/(?:Razão Social|Nome Cliente)[:\s]+(.*?)(?=\s+Contato|\s+Telefone|\s+Nro|\s+End|\s+Status|$)/i);
  
  const contato = extract(/Contato.*?(?:Nome)?[:\s]+(.*?)(?=\s+Telefone|\s+Nro|\s+End|$)/i);
  
  const endereco = extract(/End(?:\.|ere[cç]o)?\s*(?:do\s*Servi[cç]o)?[:\s]+(.*?)(?=\s+Área|\s+Descri[cç]ão|\s+Procedimentos|$)/i);
  
  const telefones = extract(/Telefone.*?(?:1|2|3)?[:\s]+([\d\s\-\(\)]+)/i);
  
  const empreiteira = extract(/EMPREITEIRA(?: DIRECIONADA)?[:\s]+(.*?)(?=\s+T[EÉ]CNICO|\s+TIPO|\s+OBSERVA[CÇ][ÃA]O|$)/i);
  
  const tipo = extract(/TIPO DE RECLAMA[CÇ][ÃA]O[:\s]+(.*?)(?=\s+OBSERVA[CÇ][ÃA]O|\s*$)/i);
  
  const obs = extract(/OBSERVA[CÇ][ÃA]O(?: DO DESPACHO)?[:\s]+(.*?)(?=\s*$)/i);
  
  const descricao = extract(/Descri[cç][ãa]o[:\s]+(.*?)(?=\s+Última|\s+Procedimentos|\s+EMPREITEIRA|$)/i);

  // Auto-fill form
  if (protocolo) document.getElementById('m_protocolo').value = protocolo;
  if (contrato) document.getElementById('m_contrato').value = contrato;
  if (cliente) document.getElementById('m_cliente').value = cliente;
  if (contato) document.getElementById('m_contato').value = contato;
  if (endereco) document.getElementById('m_endereco').value = endereco;
  if (telefones) document.getElementById('m_telefones').value = telefones;
  if (empreiteira) document.getElementById('m_empreiteira').value = empreiteira;
  if (tipo) document.getElementById('m_tipo_reclamacao').value = tipo;
  if (obs) document.getElementById('m_obs_despacho').value = obs;
  
  if (descricao) {
    document.getElementById('m_descricao').value = descricao;
  } else if (!protocolo && !cliente && !contrato) {
    // Fallback: se não achou quase nada, joga o texto bruto na descrição para vermos o que o OCR leu
    document.getElementById('m_descricao').value = "--- OCR RAW TEXT ---\n" + text;
  }
  
  // Highlight to user that fields were filled
  const form = document.getElementById('form-man');
  form.style.boxShadow = '0 0 10px rgba(20, 184, 166, 0.5)';
  setTimeout(() => { form.style.boxShadow = 'none'; }, 1000);
}

function renderTimeline() {
  const container = document.getElementById('timeline-man');
  if (!container) return;

  container.innerHTML = '';
  
  if (manutencoes.length === 0) {
    container.innerHTML = '<p style="color:var(--muted); font-size:14px;">Nenhuma manutenção registrada.</p>';
    return;
  }

  manutencoes.forEach(m => {
    const dateObj = m.created_at ? new Date(m.created_at) : new Date();
    const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

    const safeStatus = m.status || 'Pendente';
    const statusClass = safeStatus.replace(/\s+/g, '');
    const safeTipo = m.tipo_reclamacao || 'Manutenção';
    let rawCliente = m.cliente || 'Cliente não informado';
    rawCliente = rawCliente.replace(/^[\d\.\-\/]+\s*-\s*/, '');
    
    let reincidenciaHtml = '';
    const reinMatch = rawCliente.match(/REINCID[EÊ]NCIA:\s*(.*)/i);
    if (reinMatch) {
      const numMatch = reinMatch[1].match(/\d+/);
      const qty = numMatch ? numMatch[0] : (/[|Il\\]\\[]/.test(reinMatch[1]) ? '1' : '1');
      reincidenciaHtml = `<div class="reincidencia">Reincidências 30 dias: ${qty}</div>`;
      rawCliente = rawCliente.replace(/\s*REINCID[EÊ]NCIA:.*/i, '').trim();
    }
    
    const safeCliente = rawCliente;
    const safeContrato = `Prot: ${m.protocolo || '—'} | Contrato: ${m.contrato || '—'}`;
    const safeEndereco = m.endereco || '';
    const safeEmpreiteira = m.empreiteira || '—';
    const safeContato = m.telefones || m.contato || '—';
    const safeObs = m.descricao || m.obs_despacho || '';

    const card = document.createElement('div');
    card.className = `card st-${statusClass}`;
    
    card.innerHTML = `
      <div class="tag-row">
        <span class="tag tag-tipo">${safeTipo}</span>
        <span class="tag tag-status st-${statusClass}">${safeStatus}</span>
      </div>
      
      <div class="card-top">
        <div>
          <div class="cliente">${safeCliente}</div>
          ${reincidenciaHtml}
          <div class="contrato">${safeContrato}</div>
        </div>
      </div>
      
      ${safeEndereco ? `<div class="endereco">📍 ${safeEndereco}</div>` : ''}
      
      <ul class="meta-list">
        <li><span>Criado em</span> <span class="hora">${formattedDate}</span></li>
        <li><span>Contato Local</span> <b>${[m.contato, m.telefones].filter(Boolean).join(' - ') || '—'}</b></li>
      </ul>
      
      ${safeEndereco || safeContato !== '—' ? `<div class="card-field-actions">
        ${safeEndereco ? `<button class="btn-action maps-btn" onclick="window.open('https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(safeEndereco)}', '_blank')">🗺️ Abrir no Maps/Waze</button>` : ''}
        ${safeContato !== '—' ? `<button class="btn-action wpp-btn" onclick="window.open('https://wa.me/55${safeContato.replace(/\\D/g, '')}', '_blank')">💬 WhatsApp / Ligar</button>` : ''}
      </div>` : ''}

      <div class="editable-field" data-label="Observações" data-empty="Nenhuma observação." contenteditable="true" data-id="${m.id}" data-field="descricao" onblur="window.saveField(this.getAttribute('data-id'), this.getAttribute('data-field'), this.innerText)">${escapeHTML(m.descricao || m.obs_despacho || '')}</div>
      <div class="editable-field" data-label="Equipe Designada" data-empty="Equipe não informada." contenteditable="true" data-id="${m.id}" data-field="equipe_designada" onblur="window.saveField(this.getAttribute('data-id'), this.getAttribute('data-field'), this.innerText)">${escapeHTML(m.equipe_designada || '')}</div>
      <div class="editable-field" data-label="Causa da Falha" data-empty="Causa não informada." contenteditable="true" data-id="${m.id}" data-field="causa_falha" onblur="window.saveField(this.getAttribute('data-id'), this.getAttribute('data-field'), this.innerText)">${escapeHTML(m.causa_falha || '')}</div>
      <div class="editable-field" data-label="Ação Tomada" data-empty="Ação não informada." contenteditable="true" data-id="${m.id}" data-field="acao_tomada" onblur="window.saveField(this.getAttribute('data-id'), this.getAttribute('data-field'), this.innerText)">${escapeHTML(m.acao_tomada || '')}</div>
      <div class="editable-field" data-label="Gasto de Material" data-empty="Nenhum material informado." contenteditable="true" data-id="${m.id}" data-field="gasto_material" onblur="window.saveField(this.getAttribute('data-id'), this.getAttribute('data-field'), this.innerText)">${escapeHTML(m.gasto_material || '')}</div>
      
      <div class="card-actions">
        <button class="icon-btn" onclick="window.editManutencao('${m.id}')">Editar</button>
        <button class="icon-btn" onclick="window.deleteManutencao('${m.id}')">Excluir</button>
      </div>
    `;
    container.appendChild(card);
  });
}

window.editManutencao = (id) => {
  const record = manutencoes.find(m => m.id === id);
  if (!record) return;

  document.getElementById('m_id').value = record.id;
  document.getElementById('m_protocolo').value = record.protocolo || '';
  document.getElementById('m_contrato').value = record.contrato || '';
  document.getElementById('m_cliente').value = record.cliente || '';
  document.getElementById('m_contato').value = record.contato || '';
  document.getElementById('m_endereco').value = record.endereco || '';
  document.getElementById('m_telefones').value = record.telefones || '';
  document.getElementById('m_empreiteira').value = record.empreiteira || '';
  document.getElementById('m_tipo_reclamacao').value = record.tipo_reclamacao || '';
  document.getElementById('m_obs_despacho').value = record.obs_despacho || '';
  document.getElementById('m_descricao').value = record.descricao || '';
  document.getElementById('m_status').value = record.status || 'Pendente';

  // Open form if mobile
  if (window.innerWidth <= 1024) {
    const mobileNovoBtn = document.querySelector('.mobile-nav-item[data-tab="novo"]');
    if (mobileNovoBtn) mobileNovoBtn.click();
  }
};

window.deleteManutencao = async (id) => {
  if (confirm('Tem certeza que deseja excluir esta manutenção?')) {
    try {
      await persistEntry(TABLE_NAME, { id }, true, false, manutencoes);
      manutencoes = manutencoes.filter(m => m.id !== id);
      renderTimeline();
    } catch(err) {
      alert('Erro ao deletar manutenção');
    }
  }
};

window.saveField = async (id, fieldName, val) => {
  const record = manutencoes.find(m => m.id === id);
  if (!record || record[fieldName] === val) return;

  const oldVal = record[fieldName];
  record[fieldName] = val;
  
  try {
    await persistEntry(TABLE_NAME, { id, data: { [fieldName]: val } }, false, true, manutencoes);
  } catch (err) {
    console.error("Erro ao salvar " + fieldName, err);
    record[fieldName] = oldVal; // revert
    alert('Erro ao salvar o campo');
    renderTimeline();
  }
};
