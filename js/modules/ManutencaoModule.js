import { fetchEntries, persistEntry } from '../services/api.js';
import { escapeHTML, sanitizeManutencoes } from '../utils/sanitizer.js';
import { parseManutencaoOCR } from '../services/parser.js';

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

  // Auto-cleanup: remove entradas com protocolo inválido e duplicatas
  const { validos, paraDeletar } = sanitizeManutencoes(manutencoes);

  if (paraDeletar.length > 0) {
    console.log("Limpando duplicatas ocultas do banco de dados...", paraDeletar);
    manutencoes = validos;
    for (const id of paraDeletar) {
      persistEntry(TABLE_NAME, { id }, true, false, manutencoes).catch(e => console.error(e));
    }
  }
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
        tipo_atendimento: document.getElementById('m_tipo_atendimento') ? document.getElementById('m_tipo_atendimento').value : '',
        equipe_designada: document.getElementById('m_equipe') ? document.getElementById('m_equipe').value : '',
        obs_despacho: document.getElementById('m_obs_despacho').value,
        descricao: document.getElementById('m_descricao').value,
        status: document.getElementById('m_status').value,
      };

      if (!idInput.value) {
        const createdAtInput = document.getElementById('m_created_at');
        if (createdAtInput && createdAtInput.value) {
          record.created_at = createdAtInput.value;
        } else {
          record.created_at = new Date().toISOString();
        }
      }

      if (record.protocolo) {
        const p1 = String(record.protocolo).trim();
        const duplicado = manutencoes.find(m => String(m.protocolo || '').trim() === p1 && m.id !== record.id);
        if (duplicado) {
          alert('Erro: Já existe uma manutenção cadastrada com este protocolo.');
          return;
        }
      }

      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.textContent = 'Salvando...';
      btn.disabled = true;

      try {
        // Update local state FIRST so localStorage backup gets the new record
        const idx = manutencoes.findIndex(m => m.id === record.id);
        if (idx > -1) {
          manutencoes[idx] = { ...manutencoes[idx], ...record };
        } else {
          manutencoes.unshift(record);
        }

        await persistEntry(TABLE_NAME, record, false, false, manutencoes);
        
        form.reset();
        idInput.value = '';
        if (document.getElementById('m_created_at')) document.getElementById('m_created_at').value = '';
        clearOCRPreview();
        renderTimeline();
        
        // Atualizar barra mobile caso mude
        if (window.innerWidth <= 768) {
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
      if (document.getElementById('m_created_at')) document.getElementById('m_created_at').value = '';
      clearOCRPreview();
      
      const inputs = form.querySelectorAll('input, select, textarea, button[type="submit"]');
      inputs.forEach(input => input.disabled = false);
    });
  }

  const btnExport = document.getElementById('btnExportCSV');
  if (btnExport) {
    btnExport.addEventListener('click', exportToCSV);
  }
}

function exportToCSV() {
  if (manutencoes.length === 0) {
    alert('Nenhuma manutenção para exportar.');
    return;
  }

  const headers = ['Protocolo', 'Contrato', 'Cliente', 'Contato', 'Telefones', 'Endereço', 'Empreiteira', 'Tipo Reclamação', 'Atendimento', 'Equipe', 'Status', 'Obs Despacho', 'Descrição', 'Criado Em'];
  const rows = manutencoes.map(m => [
    m.protocolo || '',
    m.contrato || '',
    m.cliente || '',
    m.contato || '',
    m.telefones || '',
    m.endereco || '',
    m.empreiteira || '',
    m.tipo_reclamacao || '',
    m.tipo_atendimento || '',
    m.equipe_designada || '',
    m.status || '',
    m.obs_despacho || '',
    m.descricao || '',
    m.created_at || ''
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(','))
    .join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `manutencoes_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
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

let isProcessingOCR = false;

function handlePaste(e) {
  if (isProcessingOCR) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }
  if (!e.clipboardData) return;
  const items = e.clipboardData.items;
  let hasImage = false;
  
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      hasImage = true;
      break;
    }
  }

  if (hasImage) {
    // SEMPRE prevenir o paste nativo — senão o navegador insere a imagem gigante no contenteditable
    e.preventDefault();
    e.stopPropagation();
    processItems(items);
  } else {
    // Não é imagem
    const status = document.getElementById('ocrStatus');
    if (status) {
      status.textContent = "Nenhuma imagem encontrada na área de transferência.";
      setTimeout(() => {
        status.textContent = "Clique, cole (Ctrl+V) ou solte uma imagem aqui";
      }, 3000);
    }
  }
}

function processItems(items) {
  isProcessingOCR = true;
  const pasteZone = document.getElementById('imagePasteZone');
  if (pasteZone) {
    // Remove qualquer imagem ou texto que o navegador tenha colado nativamente no contenteditable
    const statusEl = document.getElementById('ocrStatus');
    const progressEl = document.getElementById('ocrProgress');
    const previewEl = document.getElementById('ocrPreview');
    pasteZone.innerHTML = '';
    if (previewEl) pasteZone.appendChild(previewEl);
    if (statusEl) pasteZone.appendChild(statusEl);
    if (progressEl) pasteZone.appendChild(progressEl);
  }

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

    await parseOCRText(result.data.text);
  } catch (err) {
    console.error("OCR Error Detalhado:", err);
    const errMsg = err.message ? err.message : JSON.stringify(err);
    status.textContent = "Erro OCR (Nova Versão): " + errMsg;
    progressBarContainer.style.display = 'none';
  } finally {
    isProcessingOCR = false;
  }
}

async function parseOCRText(text) {
  console.log("OCR Result Text:", text);
  
  const parsed = parseManutencaoOCR(text);
  
  if (parsed.type === 'ERROR') {
    clearOCRPreview();
    alert('❌ ' + parsed.message);
    return;
  }

  if (parsed.type === 'BULK') {
    const registrosLote = parsed.records;
    const stats = parsed.stats;
    const importados = [];

    // Filter duplicates
    for (const record of registrosLote) {
      if (!manutencoes.find(m => String(m.protocolo || '').trim() === record.protocolo)) {
        record.id = 'man_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
        importados.push(record);
      }
    }

    if (importados.length > 0) {
      const status = document.getElementById('ocrStatus');
      if (status) status.textContent = `Salvando ${importados.length} registros...`;

      for (let i = importados.length - 1; i >= 0; i--) {
        const record = importados[i];
        manutencoes.unshift(record);
        await persistEntry(TABLE_NAME, record, false, false, manutencoes);
      }
      
      renderTimeline();
      clearOCRPreview();
      
      let ignorados = registrosLote.length - importados.length;
      let msg = `✅ ${importados.length} manutenções importadas!\n`;
      if (ignorados > 0) msg += `⏭️ ${ignorados} ignorados (já estavam no sistema)\n`;
      if (stats.failures.length > 0) msg += `⚠️ ${stats.failures.length} linhas não reconhecidas:\n` + stats.failures.slice(0, 5).join('\n');
      
      alert(msg);
    } else {
      clearOCRPreview();
      alert(`Aviso: Foram lidos ${registrosLote.length} chamados na imagem, mas TODOS já constavam no sistema (duplicados). Nenhum chamado novo adicionado.`);
    }
    return;
  }

  if (parsed.type === 'SINGLE') {
    const record = parsed.records[0];
    const protLimpo = record.protocolo;
    const existingTicket = manutencoes.find(m => String(m.protocolo || '').trim() === protLimpo);

    if (existingTicket) {
      const mergedRecord = {
        ...existingTicket,
        protocolo: existingTicket.protocolo || record.protocolo || '',
        contrato: existingTicket.contrato || record.contrato || '',
        cliente: existingTicket.cliente || record.cliente || '',
        contato: existingTicket.contato || record.contato || '',
        endereco: existingTicket.endereco || record.endereco || '',
        telefones: existingTicket.telefones || record.telefones || '',
        empreiteira: existingTicket.empreiteira || record.empreiteira || '',
        tipo_reclamacao: existingTicket.tipo_reclamacao || record.tipo_reclamacao || '',
        created_at: record.created_at || existingTicket.created_at
        // A descrição não é alterada aqui para preservar o histórico original
      };

      try {
        // Atualiza a memória local primeiro
        const idx = manutencoes.findIndex(m => String(m.protocolo || '').trim() === protLimpo);
        if (idx !== -1) {
          manutencoes[idx] = mergedRecord;
        }

        // Usa upsert (isUpdate = false) para salvar corretamente no banco
        await persistEntry(TABLE_NAME, mergedRecord, false, false, manutencoes);
        renderTimeline();
        clearOCRPreview();
        alert(`✅ Chamado ${protLimpo} atualizado automaticamente!\n\nAs informações que estavam em branco foram preenchidas com os dados da imagem.`);
      } catch (e) {
        console.error("Erro ao auto-atualizar ticket:", e);
        alert(`⚠️ Erro ao atualizar o chamado ${protLimpo}.`);
      }
      return;
    }

    // Se for ticket novo, preenche o form
    const f = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
    f('m_protocolo', record.protocolo);
    f('m_contrato', record.contrato);
    f('m_cliente', record.cliente);
    f('m_contato', record.contato);
    f('m_endereco', record.endereco);
    f('m_telefones', record.telefones);
    f('m_empreiteira', record.empreiteira);
    f('m_tipo_reclamacao', record.tipo_reclamacao);
    
    f('m_descricao', record.descricao);
    if (record.created_at) {
      f('m_created_at', record.created_at);
    }

    const form = document.getElementById('form-man');
    if (form) {
      form.style.boxShadow = '0 0 10px rgba(20, 184, 166, 0.5)';
      setTimeout(() => { form.style.boxShadow = 'none'; }, 1000);
    }
    clearOCRPreview();
  }
}

function renderTimeline() {
  const container = document.getElementById('timeline-man');
  if (!container) return;

  container.innerHTML = '';
  
  // Deduplicação visual para ocultar duplicatas legadas do banco (mesmo protocolo)
  const vistos = new Set();
  const unicos = [];
  manutencoes.forEach(m => {
    if (m.protocolo) {
      const p = String(m.protocolo).trim();
      if (!vistos.has(p)) {
        vistos.add(p);
        unicos.push(m);
      }
    } else {
      unicos.push(m);
    }
  });

  const counter = document.getElementById('counter-man');
  if (counter) {
    counter.textContent = `Manutenções (${unicos.length})`;
  }

  if (unicos.length === 0) {
    container.innerHTML = '<p style="color:var(--muted); font-size:14px;">Nenhuma manutenção registrada.</p>';
    return;
  }

  unicos.forEach(m => {
    const dateObj = m.created_at ? new Date(m.created_at) : new Date();
    const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

    const safeStatus = m.status || 'Pendente';
    const statusClass = safeStatus.replace(/\s+/g, '');
    const safeTipo = m.tipo_reclamacao || 'Manutenção';
    let rawCliente = m.cliente || 'Cliente não informado';
    rawCliente = rawCliente.replace(/^\s*[\d\.\-\/]+\s*[-.]?\s*/, '').trim();
    
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
    const safeEndereco = escapeHTML(m.endereco || '');
    const safeEmpreiteira = escapeHTML(m.empreiteira || '—');
    
    let contatoNome = (m.contato || '').trim();
    let contatoTel = (m.telefones || '').trim();
    let combinedContato = [contatoNome, contatoTel].filter(Boolean).join(' - ');
    const safeContato = escapeHTML(combinedContato || '—');
    
    // Isola apenas o primeiro telefone, impedindo que múltiplos números ou números no nome se misturem
    let wppNumber = contatoTel.split('/')[0].replace(/\D/g, '');
    if (!wppNumber) wppNumber = safeContato.replace(/\D/g, ''); // fallback
    
    const safeObs = escapeHTML(m.descricao || m.obs_despacho || '');
    
    const isConcluido = safeStatus === 'Concluído' || safeStatus === 'Finalizado';
    const editable = isConcluido ? 'false' : 'true';

    let statusHtml = '';
    if (isConcluido) {
      statusHtml = `<span class="tag tag-status st-${statusClass}">${safeStatus}</span>`;
    } else {
      statusHtml = `
        <select class="tag tag-status st-${statusClass}" style="cursor:pointer; border:none; outline:none; font-weight:bold;" onchange="window.updateManutencaoStatus('${m.id}', this.value)">
          <option value="Pendente" ${safeStatus === 'Pendente' ? 'selected' : ''}>Pendente</option>
          <option value="Designado" ${safeStatus === 'Designado' ? 'selected' : ''}>Designado</option>
          <option value="Em Deslocamento" ${safeStatus === 'Em Deslocamento' ? 'selected' : ''}>Em Deslocamento</option>
          <option value="Atuando" ${safeStatus === 'Atuando' ? 'selected' : ''}>Atuando</option>
          <option value="Finalizado" ${safeStatus === 'Finalizado' ? 'selected' : ''}>Finalizado</option>
          <option value="Cancelado" ${safeStatus === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
        </select>
      `;
    }

    const card = document.createElement('div');
    card.className = `card st-${statusClass}`;
    
    card.innerHTML = `
      <div class="tag-row">
        <span class="tag tag-tipo">${safeTipo}</span>
        ${statusHtml}
      </div>
      
      <ul class="info-list">
        <li>👤 <b>${safeCliente}</b></li>
        <li>📄 Contrato: <b>${escapeHTML(m.contrato || '—')}</b></li>
        ${reincidenciaHtml ? `<li>🔄 ${reincidenciaHtml.replace(/<[^>]*>?/gm, '')}</li>` : ''}
        <li>📌 Protocolo: <b>${escapeHTML(m.protocolo || '—')}</b></li>
        <li>🕒 Registrado Em: <b>${formattedDate}</b></li>
        <li>🛠️ Empreiteira: <b>${safeEmpreiteira}</b></li>
        <li>📞 Contato Local: <b>${safeContato}</b></li>
        <li>📍 End. do Serviço: <b>${safeEndereco || '—'}</b></li>
        <li>⚠️ Reclamação: <b>${safeTipo}</b></li>
        <li>💼 Atendimento: <b>${escapeHTML(m.tipo_atendimento || '—')}</b></li>
        <li>👷 Equipe designada: <span class="editable-inline" contenteditable="${editable}" data-id="${m.id}" data-field="equipe_designada" onblur="window.saveField(this.getAttribute('data-id'), this.getAttribute('data-field'), this.innerText)">${escapeHTML(m.equipe_designada || '')}</span></li>
      </ul>
      
      ${safeEndereco || wppNumber ? `<div class="card-field-actions">
        ${safeEndereco ? `<button class="btn-action maps-btn" onclick="window.open('https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(safeEndereco)}', '_blank')">🗺️ Abrir no Maps/Waze</button>` : ''}
        ${wppNumber ? `<button class="btn-action wpp-btn" onclick="window.open('https://api.whatsapp.com/send?phone=55${wppNumber}', '_blank')">💬 WhatsApp / Ligar</button>` : ''}
      </div>` : ''}

      <div class="editable-field" data-label="Observações" data-empty="Nenhuma observação." contenteditable="${editable}" data-id="${m.id}" data-field="descricao" onblur="window.saveField(this.getAttribute('data-id'), this.getAttribute('data-field'), this.innerText)">${escapeHTML(m.descricao || m.obs_despacho || '')}</div>
      
      <div class="unified-fields-box">
        <div class="box-title">Andamento do Atendimento</div>
        <div class="editable-field" data-label="Em Deslocamento (Prev. Chegada)" data-empty="-" contenteditable="${editable}" data-id="${m.id}" data-field="prev_chegada" onblur="window.saveField(this.getAttribute('data-id'), this.getAttribute('data-field'), this.innerText)">${escapeHTML(m.prev_chegada || '')}</div>
        <div class="editable-field" data-label="Em Atendimento (Prev. Testes)" data-empty="-" contenteditable="${editable}" data-id="${m.id}" data-field="prev_testes" onblur="window.saveField(this.getAttribute('data-id'), this.getAttribute('data-field'), this.innerText)">${escapeHTML(m.prev_testes || '')}</div>
        <div class="editable-field" data-label="Finalizado" data-empty="-" contenteditable="${editable}" data-id="${m.id}" data-field="horario_finalizado" onblur="window.saveField(this.getAttribute('data-id'), this.getAttribute('data-field'), this.innerText)">${escapeHTML(m.horario_finalizado || '')}</div>
      </div>

      <div class="unified-fields-box">
        <div class="box-title">Execução e Resolução</div>
        <div class="editable-field" data-label="Causa da Falha" data-empty="Causa não informada." contenteditable="${editable}" data-id="${m.id}" data-field="causa_falha" onblur="window.saveField(this.getAttribute('data-id'), this.getAttribute('data-field'), this.innerText)">${escapeHTML(m.causa_falha || '')}</div>
        <div class="editable-field" data-label="Ação Tomada" data-empty="Ação não informada." contenteditable="${editable}" data-id="${m.id}" data-field="acao_tomada" onblur="window.saveField(this.getAttribute('data-id'), this.getAttribute('data-field'), this.innerText)">${escapeHTML(m.acao_tomada || '')}</div>
        <div class="editable-field" data-label="Gasto de Material" data-empty="Nenhum material informado." contenteditable="${editable}" data-id="${m.id}" data-field="gasto_material" onblur="window.saveField(this.getAttribute('data-id'), this.getAttribute('data-field'), this.innerText)">${escapeHTML(m.gasto_material || '')}</div>
      </div>
      
      ${isConcluido ? '' : `
      <div class="card-actions">
        <button class="icon-btn" onclick="window.editManutencao('${m.id}')">Editar</button>
        <button class="icon-btn" onclick="window.deleteManutencao('${m.id}')">Excluir</button>
      </div>`}
    `;
    container.appendChild(card);
  });
}

window.editManutencao = (id) => {
  const record = manutencoes.find(m => m.id === id);
  if (!record) return;

  const isConcluido = record.status === 'Concluído' || record.status === 'Finalizado';

  document.getElementById('m_id').value = record.id;
  document.getElementById('m_protocolo').value = record.protocolo || '';
  document.getElementById('m_contrato').value = record.contrato || '';
  document.getElementById('m_cliente').value = record.cliente || '';
  document.getElementById('m_contato').value = record.contato || '';
  document.getElementById('m_endereco').value = record.endereco || '';
  document.getElementById('m_telefones').value = record.telefones || '';
  document.getElementById('m_empreiteira').value = record.empreiteira || '';
  document.getElementById('m_tipo_reclamacao').value = record.tipo_reclamacao || '';
  if(document.getElementById('m_tipo_atendimento')) document.getElementById('m_tipo_atendimento').value = record.tipo_atendimento || '';
  if(document.getElementById('m_equipe')) document.getElementById('m_equipe').value = record.equipe_designada || '';
  document.getElementById('m_obs_despacho').value = record.obs_despacho || '';
  document.getElementById('m_descricao').value = record.descricao || '';
  document.getElementById('m_status').value = record.status || 'Pendente';

  const form = document.getElementById('form-man');
  const inputs = form.querySelectorAll('input, select, textarea, button[type="submit"]');
  inputs.forEach(input => input.disabled = isConcluido);

  if (isConcluido) {
    alert("Esta manutenção está Concluída/Finalizada e não pode mais ser alterada.");
  }

  // Retornar à aba de lista no mobile (se aplicável)
  if (window.innerWidth <= 768) {
    const mobileNovoBtn = document.querySelector('.mobile-nav-item[data-tab="novo"]');
    if (mobileNovoBtn) mobileNovoBtn.click();
  }
};

window.deleteManutencao = async (id) => {
  if (confirm('Tem certeza que deseja excluir esta manutenção?')) {
    try {
      const record = manutencoes.find(m => m.id === id);
      if (record && record.protocolo) {
        const p = String(record.protocolo).trim();
        const toDelete = manutencoes.filter(m => String(m.protocolo || '').trim() === p);
        
        manutencoes = manutencoes.filter(m => String(m.protocolo || '').trim() !== p);
        
        for (const item of toDelete) {
           await persistEntry(TABLE_NAME, { id: item.id }, true, false, manutencoes);
        }
      } else {
        manutencoes = manutencoes.filter(m => m.id !== id);
        await persistEntry(TABLE_NAME, { id }, true, false, manutencoes);
      }
      renderTimeline();
    } catch(err) {
      alert('Erro ao deletar manutenção');
    }
  }
};

window.saveField = async (id, fieldName, val) => {
  const record = manutencoes.find(m => m.id === id);
  if (!record || record[fieldName] === val) return;

  if (record.status === 'Concluído') {
    renderTimeline(); // reverse visually
    return;
  }

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
window.updateManutencaoStatus = async (id, newStatus) => {
  const record = manutencoes.find(m => m.id === id);
  if (!record) return;
  record.status = newStatus;
  
  try {
    await persistEntry(TABLE_NAME, record, false, false, manutencoes);
    renderTimeline();
  } catch(e) {
    console.error(e);
    alert('Erro ao atualizar status');
  }
}
