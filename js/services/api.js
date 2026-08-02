/**
 * Módulo de API Realtime & Banco de Dados (Supabase + localStorage).
 */

let sbClient = null;
const STORAGE_KEY = 'agendamentos';

const DEFAULT_SB_URL = 'https://cccyycqxasypvzwhcsok.supabase.co';
const DEFAULT_SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3l5Y3F4YXN5cHZ6d2hjc29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2MjU1ODIsImV4cCI6MjEwMTIwMTU4Mn0.Hh4G0FGvVNchjXd7D0G_u-3OMYytusD_PbTs19Gcazw';

export function initSupabase(onStatusChange) {
  const sbUrl = (localStorage.getItem('sb_url') || DEFAULT_SB_URL).trim();
  const sbKey = (localStorage.getItem('sb_key') || DEFAULT_SB_KEY).trim();
  
  if (sbUrl && sbKey && window.supabase) {
    try {
      sbClient = window.supabase.createClient(sbUrl, sbKey);
      if (onStatusChange) onStatusChange('online', 'Online (Supabase)');
      return true;
    } catch (e) {
      console.error('Supabase setup failed', e);
      if (onStatusChange) onStatusChange('error', 'Erro ao Conectar');
    }
  }
  
  if (onStatusChange) onStatusChange('local', 'Modo Local (localStorage)');
  return false;
}

export function isOnline() {
  return Boolean(sbClient);
}

export async function fetchEntries(onRealtimeUpdate) {
  if (sbClient) {
    const { data, error } = await sbClient.from('agendamentos').select('*');
    if (error) {
      console.error('Erro de permissão/busca Supabase', error);
      alert('Erro de permissão no Supabase. Verifique a tabela agendamentos e políticas RLS.');
      return [];
    }

    if (onRealtimeUpdate) {
      sbClient.channel('public:agendamentos')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'agendamentos' }, payload => {
          onRealtimeUpdate(payload);
        }).subscribe();
    }
    return data || [];
  } else {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Falha ao carregar dados do localStorage', e);
      return [];
    }
  }
}

export async function persistEntry(singleEntry, isDelete = false, isUpdate = false, allEntries = []) {
  if (sbClient) {
    if (isDelete) {
      await sbClient.from('agendamentos').delete().eq('id', singleEntry.id);
    } else if (isUpdate) {
      await sbClient.from('agendamentos').update(singleEntry.data).eq('id', singleEntry.id);
    } else if (singleEntry) {
      await sbClient.from('agendamentos').upsert(singleEntry);
    }
  } else {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allEntries));
    } catch (e) {
      console.error('Falha ao salvar no localStorage', e);
    }
  }
}
