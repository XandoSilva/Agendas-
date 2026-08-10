import { fetchEntries, persistEntry } from '../services/api.js';
import { escapeHTML } from '../utils/sanitizer.js';

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
        tipo_atendimento: document.getElementById('m_tipo_atendimento') ? document.getElementById('m_tipo_atendimento').value : '',
        equipe_designada: document.getElementById('m_equipe') ? document.getElementById('m_equipe').value : '',
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

function handlePaste(e) {
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
  }
}

async function parseOCRText(text) {
  console.log("OCR Result Text:", text);
  
  // 1. Tentar Bulk Mode (Tabela)
  const linhas = text.split('\n');
  const registrosLote = [];

  // Padrão de linha da tabela: Data Hora Protocolo ...
  const bulkRowRegex = /^(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})\s+(\d{8,15})\s+(.+)$/;

  for (let linha of linhas) {
    const limpa = linha.trim().replace(/\s+/g, ' ');
    const match = limpa.match(bulkRowRegex);
    if (match) {
      const dataHora = match[1];
      const protocolo = match[2];
      const resto = match[3];

      let cliente = resto;
      let endereco = "";

      const addressMatch = resto.match(/\s+(RUA|AVENIDA|AV\.|ESTRADA|RODOVIA|PRA[CÇ]A|ALAMEDA|ROD\.|R\.|AV)\s+/i);
      if (addressMatch) {
        const idx = addressMatch.index;
        cliente = resto.substring(0, idx).trim();
        endereco = resto.substring(idx).trim();
      }

      // Tenta converter para ISO Date (Considerando timezone BR)
      let isoDate = new Date().toISOString();
      try {
        const [dataPart, horaPart] = dataHora.split(' ');
        const [d, m, y] = dataPart.split('/');
        const parsed = new Date(`${y}-${m}-${d}T${horaPart}-03:00`);
        if (!isNaN(parsed.getTime())) isoDate = parsed.toISOString();
      } catch (e) {}

      registrosLote.push({
        id: 'man_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
        created_at: isoDate,
        protocolo: protocolo,
        cliente: cliente,
        endereco: endereco,
        status: 'Pendente',
        descricao: "Chamado importado em lote via OCR da tabela.",
        equipe_designada: '',
        empreiteira: '',
        tipo_reclamacao: '',
        obs_despacho: ''
      });
    }
  }

  if (registrosLote.length > 1) {
    console.log("Modo lote ativado!", registrosLote);
    
    // Mostra estado visual enquanto salva
    const status = document.getElementById('ocrStatus');
    if (status) status.textContent = `Salvando ${registrosLote.length} registros...`;

    // Processa de trás para frente para manter a ordem cronológica visual no unshift
    for (let i = registrosLote.length - 1; i >= 0; i--) {
      const record = registrosLote[i];
      manutencoes.unshift(record);
      await persistEntry(TABLE_NAME, record, false, false, manutencoes);
    }
    
    renderTimeline();
    clearOCRPreview();
    alert(`Sucesso! ${registrosLote.length} manutenções foram importadas da tabela e criadas.\nElas estão listadas como 'Pendente'.\nClique em cada uma na lista para completar os dados (Equipe, Problema, Empreiteira, etc).`);
    return;
  }

  // 2. Fallback para 1 ticket (Bloco de texto único)
  // Normalizar múltiplos espaços e quebras de linha para uma linha única e limpa
  const cleanText = text.replace(/\s+/g, ' ');

  // Helper para extração segura com regex
  const extract = (regex) => {
    const match = cleanText.match(regex);
    return match ? match[1].trim() : '';
  };

  // Regras de extração baseadas no layout da imagem fornecida
  const protocolo = extract(/Protoco?lo[:\s]+([A-Z0-9-]+)/i);
  const contrato = extract(/Contrato[:\s]+(\d+)/i);
  
  // Procura por Razão Social ou Nome Cliente, parando nas próximas chaves
  // Usamos Raz[ãa]o Soc.*? para lidar com o OCR lendo "Razão Sociat"
  let cliente = extract(/Raz[ãa]o\s*Soc.*?[:\s]+(.*?)(?=\s+(?:Contato|Telefone|Tel\.|Status|Origem|Nro|End\.|Endere[cç]o|$))/i);
  if (!cliente) {
    cliente = extract(/Nome Cliente[:\s]+(.*?)(?=\s+(?:Atendente|Reincid[eê]ncia|Contato|Telefone|Tel\.|Status|Origem|Nro|End\.|Endere[cç]o|$))/i);
  }
  if (cliente) {
    if (cliente.includes('-')) cliente = cliente.substring(cliente.indexOf('-') + 1).trim();
    cliente = cliente.replace(/lacre\]\s*\|\s*NOS ULTIMOS 30 DIAS/ig, '').trim();
    cliente = cliente.replace(/Reincid[eê]ncia.*?dias/ig, '').trim();
  }
  
  let contato = extract(/Contato.*?(?:Nome)?[:\s]+(.*?)(?=\s+(?:Telefone|Tel\.|Status|Origem|Nro|End\.|Endere[cç]o|$))/i);
  if (contato) {
    contato = contato.replace(/\(Nome\):?\s*\|?/ig, '').replace(/^[\s\|\[\]]+/, '').trim();
  }
  
  let endereco = extract(/End(?:\.|ere[cç]o)?\s*(?:do\s*Servi[cç]o)?[:\s]+(.*?)(?=\s+(?:CEP|Área|Motivo|Sub|Atividade|Descri[cç]ão|Procedimentos|$))/i);
  if (endereco) {
    endereco = endereco.replace(/^[\s\|\[\]]+/, '').replace(/\s*-?\s*CEP[:\s]*\d{5}-?\d{3}/ig, '').trim();
  }
  
  let telefones = extract(/(?:Telefones?|Tel\.?\s*1)[:\s]+(.*?)(?=\s+(?:Tel\.\s*2|Status|Origem|Nro|End\.|Endere[cç]o|$))/i);
  if (telefones) {
    telefones = telefones.replace(/[\s\|\-\.,=]+$/, '').replace(/^1:\s*/, '').trim();
  }
  
  let empreiteira = extract(/FILA.*?((?:VERO|SIMASTEL).*?)(?=\s+Oo\s+|\s+AGENDAMENTO|\s+Atividade|\s+MATERIAIS|\s+Contato|$)/i);
  if (empreiteira) {
    const empUpper = empreiteira.toUpperCase();
    if (empUpper.includes('SIMASTEL')) {
      empreiteira = 'SIMASTEL SERVIÇOS';
    } else if (empUpper.includes('VERO')) {
      const veroMatch = empUpper.match(/VERO\s+[A-Z]+/);
      empreiteira = veroMatch ? veroMatch[0] : 'VERO';
    }
  }

  const registradoEm = extract(/Registrado Em[:\s]+(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})/i);
  
  let tipo = extract(/TIPO DE RECLAMA[CÇ][ÃA]O[:\s]+(.*?)(?=\s+OBSERVA[CÇ][ÃA]O|\s*$)/i);
  if (!tipo) {
    tipo = extract(/Atividade[:\s]+(.*?)(?=\s+(?:Descri[cç][ãa]o|Pescri[cç][ãa]o|Detalhes|Procedimentos|Última|$))/i);
    if (tipo && tipo.includes('-')) {
      tipo = tipo.substring(tipo.indexOf('-') + 1).trim();
    }
  }

  // Inteligência artificial simples: se a atividade for apenas "DESPACHO PENDENTE", vamos tentar achar o problema real na descrição
  if (tipo && tipo.toUpperCase().includes('DESPACHO PENDENTE')) {
    const keywords = ['LINK OFFLINE', 'LINK DOWN', 'LENTIDÃO', 'ROMPIMENTO', 'FALHA', 'PERDA DE PACOTE', 'SEM CONEXÃO', 'FIBRA ROMPIDA', 'SEM SINAL'];
    for (let kw of keywords) {
      if (cleanText.toUpperCase().includes(kw)) {
        tipo = kw;
        break;
      }
    }
  }

  // Trava de segurança para impedir que falhas do OCR coloquem textos gigantes nos campos curtos
  if (tipo && tipo.length > 80) tipo = tipo.substring(0, 80) + '...';
  if (cliente && cliente.length > 80) cliente = cliente.substring(0, 80) + '...';
  
  const obs = extract(/OBSERVA[CÇ][ÃA]O(?: DO DESPACHO)?[:\s]+(.*?)(?=\s*$)/i);
  
  let descricao = extract(/Descri[cç][ãa]o[:\s]+(.*?)(?=\s+Última|\s+Procedimentos|\s+EMPREITEIRA|$)/i);

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
  
  let finalDescricao = descricao;
  if (registradoEm) {
    finalDescricao = `Registrado Em: ${registradoEm}\n` + (finalDescricao || '');
  }

  if (finalDescricao) {
    document.getElementById('m_descricao').value = finalDescricao;
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
    
    const isConcluido = safeStatus === 'Concluído';
    const editable = isConcluido ? 'false' : 'true';

    const card = document.createElement('div');
    card.className = `card st-${statusClass}`;
    
    card.innerHTML = `
      <div class="tag-row">
        <span class="tag tag-tipo">${safeTipo}</span>
        <span class="tag tag-status st-${statusClass}">${safeStatus}</span>
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

  const isConcluido = record.status === 'Concluído';

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
    alert("Esta manutenção está Concluída e não pode mais ser alterada.");
  }

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
