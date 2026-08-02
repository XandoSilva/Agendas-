/**
 * Ponto de entrada principal da aplicação (Main Orchestrator)
 */
import { initSupabase, fetchEntries, persistEntry, isOnline } from './services/api.js';
import { extractData, uid, parseCSV } from './services/parser.js';
import { renderHeader, updateConnectionStatus } from './components/Header.js';
import { renderTimeline } from './components/Timeline.js';
import { renderMobileNav } from './components/MobileNav.js';
import { renderSettingsModal, openSettingsModal } from './components/SettingsModal.js';
import { renderDashboard } from './components/Dashboard.js';
import { formatPhoneMask } from './utils/formatters.js';

let entries = [];
let currentTipoFilter = 'all';
let currentStatusFilter = 'all';

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

function handleToggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
  renderHeader(document.getElementById('headerContainer'), openSettingsModal, handleToggleTheme);
}

async function main() {
  // Inicializar Tema (localStorage ou preferência do sistema)
  const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  applyTheme(savedTheme);

  // Renderizar componentes estáticos de apoio
  renderHeader(document.getElementById('headerContainer'), openSettingsModal, handleToggleTheme);
  renderMobileNav(document.getElementById('mobileNavContainer'), handleTabChange);
  renderSettingsModal(document.getElementById('modalContainer'), handleSaveSettings);

  // Event Listeners globais do formulário e ferramentas
  document.getElementById('btnParsePaste').addEventListener('click', handleParsePaste);
  document.getElementById('form').addEventListener('submit', handleSaveEntry);
  document.getElementById('btnClearForm').addEventListener('click', clearForm);
  document.getElementById('btnSync').addEventListener('click', handleSyncMessages);
  document.getElementById('search').addEventListener('input', render);
  document.getElementById('syncUrl').addEventListener('change', (e) => {
    localStorage.setItem('agendamentos_sync_url', e.target.value);
  });

  // Máscara dinâmica de telefone no campo contato
  const inputContato = document.getElementById('f_contato');
  if (inputContato) {
    inputContato.addEventListener('input', (e) => {
      e.target.value = formatPhoneMask(e.target.value);
    });
  }

  // Atalhos de Data em 1-Clique
  const btnToday = document.getElementById('btnDateToday');
  const btnTomorrow = document.getElementById('btnDateTomorrow');
  const btnMonday = document.getElementById('btnDateMonday');

  if (btnToday) {
    btnToday.addEventListener('click', () => {
      document.getElementById('f_data').value = new Date().toISOString().split('T')[0];
    });
  }
  if (btnTomorrow) {
    btnTomorrow.addEventListener('click', () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      document.getElementById('f_data').value = d.toISOString().split('T')[0];
    });
  }
  if (btnMonday) {
    btnMonday.addEventListener('click', () => {
      const d = new Date();
      const day = d.getDay();
      const diff = d.getDate() + (day === 0 ? 1 : (8 - day));
      d.setDate(diff);
      document.getElementById('f_data').value = d.toISOString().split('T')[0];
    });
  }

  // Filtros de Tipo de Atividade
  document.querySelectorAll('.chip-tipo').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.chip-tipo').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      currentTipoFilter = e.target.getAttribute('data-tipo');
      render();
    });
  });

  // Filtros de Status
  document.querySelectorAll('.chip-status').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.chip-status').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      currentStatusFilter = e.target.getAttribute('data-status');
      render();
    });
  });

  // Inicializar Supabase / Persistência
  initSupabase((statusType, statusLabel) => {
    updateConnectionStatus(statusType, statusLabel);
  });

  document.getElementById('syncUrl').value = localStorage.getItem('agendamentos_sync_url') || '';

  // Buscar agendamentos iniciais com subscrição Realtime
  entries = await fetchEntries((payload) => {
    if (payload.eventType === 'INSERT') {
      if (!entries.some(e => e.id === payload.new.id)) entries.push(payload.new);
    } else if (payload.eventType === 'UPDATE') {
      const idx = entries.findIndex(e => e.id === payload.new.id);
      if (idx >= 0) entries[idx] = payload.new;
    } else if (payload.eventType === 'DELETE') {
      entries = entries.filter(e => e.id !== payload.old.id);
    }
    render();
  });

  render();

  // Registrar Service Worker para PWA (iOS & Android)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('PWA ServiceWorker registrado com sucesso:', reg.scope))
      .catch(err => console.log('Falha ao registrar PWA ServiceWorker:', err));
  }
}

function handleTabChange(tab) {
  document.body.className = `tab-${tab}`;
  if (tab === 'config') {
    openSettingsModal();
  }
}

function handleSaveSettings(url, key) {
  if (!url || !key) {
    localStorage.removeItem('sb_url');
    localStorage.removeItem('sb_key');
  } else {
    localStorage.setItem('sb_url', url);
    localStorage.setItem('sb_key', key);
  }
  location.reload();
}

function render() {
  const searchInput = document.getElementById('search').value.toLowerCase();
  
  // 1. Filtragem por busca, tipo de atividade e status
  let list = entries.filter(e => {
    // Filtro por Atividade (Vistoria, Passagem de Cabo, Ativação)
    if (currentTipoFilter !== 'all' && e.tipo !== currentTipoFilter) return false;

    // Filtro por Status
    if (currentStatusFilter === 'Cancelada' && !['Cancelada', 'Reagendada'].includes(e.status)) return false;
    if (currentStatusFilter !== 'all' && currentStatusFilter !== 'Cancelada' && e.status !== currentStatusFilter) return false;
    
    // Filtro por texto livre
    if (searchInput && !(`${e.contrato} ${e.cliente}`.toLowerCase().includes(searchInput))) return false;
    
    return true;
  });

  // 2. Deduplicação inteligente por TIPO + CONTRATO + CLIENTE + DATA + HORA
  const seenKeys = new Set();
  list = list.filter(e => {
    const tipo = (e.tipo || '').trim().toLowerCase();
    const contrato = (e.contrato || '').trim().toLowerCase();
    const cliente = (e.cliente || '').trim().toLowerCase();
    const dataAg = (e.data || '').trim();
    const horaAg = (e.hora || '').trim();

    // Se não houver contrato nem cliente (entrada genérica/sem identificador), mantém
    if (!contrato && !cliente) return true;

    // Chave única preservando a diferença entre Vistoria e Passagem de Cabo
    const key = `${tipo}_${contrato}_${cliente}_${dataAg}_${horaAg}`;
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });

  list.sort((a, b) => (a.data || '9999').localeCompare(b.data || '9999'));

  // 3. Atualizar Dashboard de KPIs e Métricas (Sincronizado com os itens deduplicados da lista)
  const dashEl = document.getElementById('dashboardContainer');
  if (dashEl) renderDashboard(dashEl, list);

  document.getElementById('counter').textContent = `Agenda (${list.length})`;
  
  renderTimeline(document.getElementById('timeline'), list, handleCardAction);
}

async function handleCardAction(action, id, value) {
  if (action === 'quick-status') {
    const e = entries.find(x => x.id === id);
    if (!e) return;
    e.status = value;
    await persistEntry({ id, data: { status: value } }, false, true, entries);
    if (!isOnline()) render();
  } else if (action === 'edit') {
    const e = entries.find(x => x.id === id);
    if (!e) return;
    document.getElementById('f_id').value = e.id;
    document.getElementById('f_tipo').value = e.tipo;
    document.getElementById('f_status').value = e.status;
    document.getElementById('f_data').value = e.data;
    document.getElementById('f_hora').value = e.hora;
    document.getElementById('f_contrato').value = e.contrato;
    document.getElementById('f_cliente').value = e.cliente;
    document.getElementById('f_endereco').value = e.endereco;
    document.getElementById('f_acompanhante').value = e.acompanhante;
    document.getElementById('f_contato').value = e.contato;
    document.getElementById('f_obs').value = e.obs;
    document.getElementById('f_source_id').value = e.sourceId || '';
    
    // Em mobile, alterna para a aba de formulário
    handleTabChange('novo');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (action === 'delete') {
    const target = entries.find(x => x.id === id);
    if (!target) return;
    entries = entries.filter(e => e.id !== id);
    await persistEntry(target, true, false, entries);
    if (!isOnline()) render();
  }
}

function handleParsePaste() {
  const raw = document.getElementById('pasteBox').value;
  const dataArr = extractData(raw);
  if (!dataArr || dataArr.length === 0) return;

  if (dataArr.length > 1) {
    dataArr.forEach(async (data, index) => {
      const entry = { id: uid() + index, sourceId: '', ...data };
      entries.push(entry);
      await persistEntry(entry, false, false, entries);
    });
    render();
    clearForm();
    alert(dataArr.length + ' agendamentos importados com sucesso!');
  } else {
    const parsed = dataArr[0];
    document.getElementById('f_id').value = '';
    document.getElementById('f_source_id').value = '';
    document.getElementById('f_tipo').value = parsed.tipo;
    document.getElementById('f_status').value = parsed.status;
    document.getElementById('f_data').value = parsed.data;
    document.getElementById('f_hora').value = parsed.hora;
    document.getElementById('f_contrato').value = parsed.contrato;
    document.getElementById('f_cliente').value = parsed.cliente;
    document.getElementById('f_endereco').value = parsed.endereco;
    document.getElementById('f_acompanhante').value = parsed.acompanhante;
    document.getElementById('f_contato').value = parsed.contato;
    document.getElementById('f_obs').value = parsed.obs;
  }
}

async function handleSaveEntry(ev) {
  ev.preventDefault();
  const id = document.getElementById('f_id').value || uid();
  const entry = {
    id,
    tipo: document.getElementById('f_tipo').value,
    status: document.getElementById('f_status').value,
    data: document.getElementById('f_data').value,
    hora: document.getElementById('f_hora').value,
    contrato: document.getElementById('f_contrato').value,
    cliente: document.getElementById('f_cliente').value,
    endereco: document.getElementById('f_endereco').value,
    acompanhante: document.getElementById('f_acompanhante').value,
    contato: document.getElementById('f_contato').value,
    obs: document.getElementById('f_obs').value,
    sourceId: document.getElementById('f_source_id').value,
  };

  const idx = entries.findIndex(e => e.id === id);
  if (idx >= 0) entries[idx] = entry; else entries.push(entry);

  await persistEntry(entry, false, false, entries);
  clearForm();
  if (!isOnline()) render();
  
  // No mobile, volta para a agenda após salvar
  handleTabChange('agenda');
}

function clearForm() {
  document.getElementById('form').reset();
  document.getElementById('f_id').value = '';
  document.getElementById('f_source_id').value = '';
  document.getElementById('pasteBox').value = '';
}

async function handleSyncMessages() {
  const btn = document.getElementById('btnSync');
  const urlInput = document.getElementById('syncUrl').value.trim();
  if (!urlInput) {
    alert('Por favor, insira a URL do CSV (Google Sheets/Excel) primeiro.');
    return;
  }

  btn.textContent = 'Sincronizando...';
  try {
    const res = await fetch(urlInput);
    const text = await res.text();
    const rows = parseCSV(text);

    let added = 0;
    for (let i = 1; i < rows.length; i++) {
      const idMsg = rows[i][0];
      const texto = rows[i][1];
      if (!idMsg || !texto) continue;
      if (entries.some(e => e.sourceId === idMsg)) continue;

      const dataArr = extractData(texto);
      if (dataArr && dataArr.length > 0) {
        for (let j = 0; j < dataArr.length; j++) {
          const data = dataArr[j];
          if (data && (data.contrato || data.cliente || data.endereco)) {
            const entry = { id: uid() + j, sourceId: idMsg, ...data };
            entries.push(entry);
            await persistEntry(entry, false, false, entries);
            added++;
          }
        }
      }
    }

    if (!isOnline()) render();
    alert(added > 0 ? `${added} novo(s) agendamento(s) sincronizado(s)!` : 'Nenhuma mensagem nova.');
  } catch (e) {
    console.error(e);
    alert('Erro ao buscar o CSV. Verifique se o link é público e válido.');
  } finally {
    btn.textContent = 'Sincronizar Mensagens';
  }
}

// Inicializar aplicativo
window.addEventListener('DOMContentLoaded', main);
