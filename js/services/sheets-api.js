/**
 * Google Sheets Data Layer
 * Busca e parseia dados CSV publicados da planilha Operacao_VERO_FSP_V4.
 * Substitui o Supabase como fonte de dados principal.
 */

const BASE_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQW2W-bMXbTD8M-HcIVsXNuodovb-wBPEQ677zxaNMjyYOr3fax9ZkTapHAPukpHfABbwQ_ywiVb1gt/pub?output=csv';

export const SHEETS = {
  VISAO_GERAL:    { gid: '113587035',  name: '📊 Visão Geral',       key: 'visao_geral' },
  APOIO_LISTAS:   { gid: '1236509559', name: '⚙️ Apoio & Listas',    key: 'apoio_listas' },
  CHAMADOS_B2B:   { gid: '2005931044', name: 'Chamados B2B',         key: 'chamados_b2b' },
  INCIDENTES:     { gid: '1386014215', name: 'Incidentes',           key: 'incidentes' },
  VISTORIAS_RJ:   { gid: '1475053554', name: 'Vistorias RJ',        key: 'vistorias_rj' },
  INFRA_RJ:       { gid: '170808402',  name: 'Infra RJ',            key: 'infra_rj' },
  POPS:           { gid: '705477249',  name: 'POPs & Preventivas',  key: 'pops' },
  DADOS_ACESSO:   { gid: '384155401',  name: 'Dados de acesso',     key: 'dados_acesso' },
  LOGISTICA:      { gid: '1088075983', name: 'Logística Reversa',   key: 'logistica' },
  ESTOQUE:        { gid: '738843736',  name: 'Estoque Disponível',  key: 'estoque' },
  ACESSOS:        { gid: '1550019024',  name: 'Acessos',           key: 'acessos' },
};

const CACHE_PREFIX = 'vero_cache_';
const CACHE_TS_PREFIX = 'vero_ts_';

let _listeners = [];
let _refreshInterval = null;
let _lastRefresh = null;

// ─── CSV Parser robusto ────────────────────────────────────────────
export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (c === '"' && next === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(field.trim());
        field = '';
      } else if (c === '\n') {
        row.push(field.trim());
        if (row.some(f => f !== '')) rows.push(row);
        row = [];
        field = '';
      } else if (c === '\r') {
        // skip carriage return
      } else {
        field += c;
      }
    }
  }
  // Last field/row
  row.push(field.trim());
  if (row.some(f => f !== '')) rows.push(row);

  return rows;
}

// ─── Converte linhas CSV em array de objetos ────────────────────────
function csvToObjects(rows, headerRowIndex = 0) {
  if (rows.length <= headerRowIndex + 1) return [];
  
  const headers = rows[headerRowIndex].map(h => 
    h.replace(/\n/g, ' ')
     .replace(/\s+/g, ' ')
     .trim()
  );
  
  const objects = [];
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    // Pula linhas que são subtítulos ou vazias
    if (row.length < 2) continue;
    // Pula linhas de total
    if ((row[0] || '').toUpperCase().includes('TOTAL')) continue;
    
    const obj = { _rowIndex: i + 1 };
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j] || '';
    }
    objects.push(obj);
  }
  return objects;
}

// ─── Fetch de uma aba específica ────────────────────────────────────
export async function fetchSheet(sheetConfig) {
  const url = `${BASE_URL}&gid=${sheetConfig.gid}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const rows = parseCSV(text);
    
    // Cache local
    try {
      localStorage.setItem(CACHE_PREFIX + sheetConfig.key, JSON.stringify(rows));
      localStorage.setItem(CACHE_TS_PREFIX + sheetConfig.key, Date.now().toString());
    } catch (e) {
      console.warn('Cache overflow, cleaning old data');
    }
    
    return rows;
  } catch (e) {
    console.error(`Erro ao buscar aba "${sheetConfig.name}":`, e);
    // Fallback para cache
    const cached = localStorage.getItem(CACHE_PREFIX + sheetConfig.key);
    if (cached) {
      console.log(`Usando cache local para "${sheetConfig.name}"`);
      return JSON.parse(cached);
    }
    return [];
  }
}

// ─── Fetch específico para cada módulo ──────────────────────────────

// Chamados B2B - header na linha 4 (index 3)
export async function fetchChamadosB2B() {
  const rows = await fetchSheet(SHEETS.CHAMADOS_B2B);
  // Encontrar o header (linha que começa com "Dt. Abertura")
  const headerIdx = rows.findIndex(r => (r[0] || '').includes('Dt. Abertura'));
  if (headerIdx === -1) return [];
  return csvToObjects(rows, headerIdx);
}

// Incidentes - header na linha que começa com "Origem"
export async function fetchIncidentes() {
  const rows = await fetchSheet(SHEETS.INCIDENTES);
  const headerIdx = rows.findIndex(r => (r[0] || '').includes('Origem'));
  if (headerIdx === -1) return [];
  return csvToObjects(rows, headerIdx);
}

// Vistorias RJ - header na linha que começa com "Data Agendada"
export async function fetchVistorias() {
  const rows = await fetchSheet(SHEETS.VISTORIAS_RJ);
  const headerIdx = rows.findIndex(r => (r[0] || '').includes('Data Agendada'));
  if (headerIdx === -1) return [];
  return csvToObjects(rows, headerIdx);
}

// Infra RJ - header na linha que começa com "Data Agendada"
export async function fetchInfra() {
  const rows = await fetchSheet(SHEETS.INFRA_RJ);
  const headerIdx = rows.findIndex(r => (r[0] || '').includes('Data Agendada'));
  if (headerIdx === -1) return [];
  return csvToObjects(rows, headerIdx);
}

// POPs & Preventivas - header na linha que começa com "Sigla"
export async function fetchPOPs() {
  const rows = await fetchSheet(SHEETS.POPS);
  const headerIdx = rows.findIndex(r => (r[0] || '').includes('Sigla'));
  if (headerIdx === -1) return [];
  return csvToObjects(rows, headerIdx);
}

// Estoque - header na linha que começa com "Categoria"
export async function fetchEstoque() {
  const rows = await fetchSheet(SHEETS.ESTOQUE);
  const headerIdx = rows.findIndex(r => (r[0] || '').includes('Categoria'));
  if (headerIdx === -1) return [];
  return csvToObjects(rows, headerIdx);
}

// Apoio & Listas - retorna listas de valores para filtros
export async function fetchApoioListas() {
  const rows = await fetchSheet(SHEETS.APOIO_LISTAS);
  if (rows.length < 2) return {};
  
  const headers = rows[0];
  const lists = {};
  headers.forEach((h, i) => {
    if (!h) return;
    lists[h] = [];
    for (let r = 1; r < rows.length; r++) {
      if (rows[r][i]) lists[h].push(rows[r][i]);
    }
  });
  return lists;
}

// Acessos - retorna lista de controle de acesso
export async function fetchAcessos() {
  const rows = await fetchSheet(SHEETS.ACESSOS);
  const headerIdx = rows.findIndex(r => r.some(cell => typeof cell === 'string' && cell.toLowerCase().replace('-', '').includes('email')));
  if (headerIdx === -1) {
    // Se a aba não existir ou não tiver header, retorna vazio
    console.warn('[Sheets] Aba Acessos não encontrada ou sem header "Email"');
    return [];
  }
  return csvToObjects(rows, headerIdx);
}

// Visão Geral - retorna KPIs e produtividade
export async function fetchVisaoGeral() {
  const rows = await fetchSheet(SHEETS.VISAO_GERAL);
  
  // Extrair KPIs (linhas de totais)
  const kpis = {};
  const kpiLabelsRow = rows.findIndex(r => (r[0] || '').includes('TOTAL B2B'));
  if (kpiLabelsRow >= 0 && rows[kpiLabelsRow + 1]) {
    const labels = rows[kpiLabelsRow];
    const values = rows[kpiLabelsRow + 1];
    kpis.totalB2B = parseInt(values[0]) || 0;
    kpis.totalIncidentes = parseInt(values[2]) || 0;
    kpis.totalVistorias = parseInt(values[4]) || 0;
    kpis.totalInfra = parseInt(values[6]) || 0;
  }
  
  const normLabelsRow = rows.findIndex(r => (r[0] || '').includes('B2B NORMALIZADOS'));
  if (normLabelsRow >= 0 && rows[normLabelsRow + 1]) {
    const values = rows[normLabelsRow + 1];
    kpis.b2bNormalizados = parseInt(values[0]) || 0;
    kpis.incidentesConcluidos = parseInt(values[2]) || 0;
    kpis.vistoriasConcluidas = parseInt(values[4]) || 0;
    kpis.infraConcluidas = parseInt(values[6]) || 0;
  }
  
  // Extrair tabela de produtividade
  const prodHeaderIdx = rows.findIndex(r => (r[0] || '').includes('Técnico / Responsável'));
  const produtividade = [];
  if (prodHeaderIdx >= 0) {
    for (let i = prodHeaderIdx + 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r[0] || r[0].includes('TOTAL')) continue;
      produtividade.push({
        tecnico: r[0],
        b2bAtrib: parseInt(r[1]) || 0,
        b2bConcl: parseInt(r[2]) || 0,
        incAtrib: parseInt(r[3]) || 0,
        incConcl: parseInt(r[4]) || 0,
        vistAtrib: parseInt(r[5]) || 0,
        vistConcl: parseInt(r[6]) || 0,
        infraAtrib: parseInt(r[7]) || 0,
        infraConcl: parseInt(r[8]) || 0,
        totalAtrib: parseInt(r[9]) || 0,
        totalConcl: parseInt(r[10]) || 0,
        eficacia: r[11] || '0%',
      });
    }
  }
  
  // Extrair filtros ativos
  const filtroRow = rows.findIndex(r => (r[0] || '').includes('Período:'));
  const filtros = {};
  if (filtroRow >= 0) {
    filtros.periodo = rows[filtroRow][1] || 'GERAL';
    filtros.tecnico = rows[filtroRow][3] || 'TODOS';
    filtros.dtInicio = rows[filtroRow][5] || '';
    filtros.dtFim = rows[filtroRow][7] || '';
  }
  
  return { kpis, produtividade, filtros };
}

// ─── Fetch de todos os dados ────────────────────────────────────────
export async function fetchAllData() {
  const start = Date.now();
  
  const [visaoGeral, chamadosB2B, incidentes, vistorias, infra, pops, estoque, apoioListas, acessos] = 
    await Promise.all([
      fetchVisaoGeral(),
      fetchChamadosB2B(),
      fetchIncidentes(),
      fetchVistorias(),
      fetchInfra(),
      fetchPOPs(),
      fetchEstoque(),
      fetchApoioListas(),
      fetchAcessos(),
    ]);
  
  _lastRefresh = new Date();
  const elapsed = Date.now() - start;
  console.log(`[Sheets] Todos os dados carregados em ${elapsed}ms (${acessos.length} perfis de acesso)`);
  
  const data = { visaoGeral, chamadosB2B, incidentes, vistorias, infra, pops, estoque, apoioListas, acessos };
  
  // Notificar listeners
  _listeners.forEach(cb => cb(data));
  
  return data;
}

// ─── Auto-Refresh ──────────────────────────────────────────────────
export function startAutoRefresh(intervalMs = 120000) {
  stopAutoRefresh();
  _refreshInterval = setInterval(() => {
    fetchAllData().catch(e => console.error('[Sheets] Auto-refresh failed:', e));
  }, intervalMs);
}

export function stopAutoRefresh() {
  if (_refreshInterval) {
    clearInterval(_refreshInterval);
    _refreshInterval = null;
  }
}

export function onDataUpdate(callback) {
  _listeners.push(callback);
  return () => {
    _listeners = _listeners.filter(cb => cb !== callback);
  };
}

export function getLastRefresh() {
  return _lastRefresh;
}

// ─── Helpers ────────────────────────────────────────────────────────
export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
