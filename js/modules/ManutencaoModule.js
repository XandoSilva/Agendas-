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
      
      const record = {
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
  // Clean up excessive newlines
  const cleanText = text.replace(/\n/g, ' ');

  // Helper function to extract via Regex safely
  const extract = (regex) => {
    const match = cleanText.match(regex);
    return match ? match[1].trim() : '';
  };

  const protocolo = extract(/Protocolo:\s*(\d+)/i) || extract(/Protocolo.*?\s+(\d+)/i);
  const contrato = extract(/Contrato:\s*([^\(Cliente]*)/i);
  const cliente = extract(/(?:Cliente|Razão Social)[\s\/]*:\s*(.*?)(?=\s*Contato:)/i);
  const contato = extract(/Contato:\s*(.*?)(?=\s*Endereço)/i);
  const endereco = extract(/Endereço.*?(?:Serviço)?:\s*(.*?)(?=\s*Telefones?:)/i);
  const telefones = extract(/Telefones?:\s*(.*?)(?=\s*Empreiteira)/i);
  const empreiteira = extract(/Empreiteira.*?(?:Direcionada)?:\s*(.*?)(?=\s*Tipo de)/i);
  const tipo = extract(/Tipo de Reclama(?:ç|c)(?:ã|a)o:\s*(.*?)(?=\s*Observa)/i);
  const obs = extract(/Observa(?:ç|c)(?:ã|a)o do Despacho:\s*(.*?)(?=\s*(?:OBSERVAÇÃO|Descrição|Solicitação|📝))/i);
  const descricao = extract(/Descrição:\s*(.*)/i) || extract(/Solicitação:\s*(.*)/i);

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

    let statusColor = 'var(--text)';
    if (m.status === 'Pendente') statusColor = 'orange';
    if (m.status === 'Em Andamento') statusColor = 'blue';
    if (m.status === 'Concluído') statusColor = 'green';
    if (m.status === 'Cancelado') statusColor = 'red';

    const card = document.createElement('div');
    card.className = 'timeline-card';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '8px';
    
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <strong style="color:var(--text); font-size:15px;">Prot: ${m.protocolo || 'N/A'}</strong>
        <span style="font-size:11px; color:${statusColor}; border:1px solid ${statusColor}; padding:2px 6px; border-radius:12px;">${m.status}</span>
      </div>
      <div style="font-size:13px; color:var(--muted);">
        <div><b>Cliente:</b> ${m.cliente || '-'}</div>
        <div><b>Tipo:</b> ${m.tipo_reclamacao || '-'}</div>
        <div><b>Empreiteira:</b> ${m.empreiteira || '-'}</div>
      </div>
      <div style="font-size:12px; color:var(--text); margin-top:4px;">
        ${m.descricao || m.obs_despacho || 'Sem descrição.'}
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
        <span style="font-size:11px; color:var(--muted);">${formattedDate}</span>
        <div>
          <button class="btn btn-ghost" style="padding:4px 8px; font-size:12px;" onclick="window.editManutencao('${m.id}')">Editar</button>
          <button class="btn btn-ghost" style="padding:4px 8px; font-size:12px; color:red;" onclick="window.deleteManutencao('${m.id}')">Excluir</button>
        </div>
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
