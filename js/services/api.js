/**
 * Módulo de API Realtime & Banco de Dados (Supabase + localStorage).
 * Refatorado para suportar múltiplas tabelas (Módulos).
 */

let sbClient = null;

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

export async function fetchEntries(tableName, onRealtimeUpdate) {
  const storageKey = `local_${tableName}`;
  if (sbClient) {
    try {
      const { data, error } = await sbClient.from(tableName).select('*');
      if (error) {
        console.error(`Erro de permissão/busca Supabase em ${tableName}`, error);
        alert(`Erro de permissão no Supabase. Verifique a tabela ${tableName} e políticas RLS.`);
        return [];
      }

      if (onRealtimeUpdate) {
        sbClient.channel(`public:${tableName}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, payload => {
            onRealtimeUpdate(payload);
          }).subscribe();
      }
      return data || [];
    } catch (e) {
      console.error(`Falha na conexão Supabase para ${tableName}, usando localStorage`, e);
      // Fallback para localStorage
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    }
  } else {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error(`Falha ao carregar dados do localStorage (${storageKey})`, e);
      return [];
    }
  }
}

export async function persistEntry(tableName, singleEntry, isDelete = false, isUpdate = false, allEntries = []) {
  const storageKey = `local_${tableName}`;
  if (sbClient) {
    try {
      if (isDelete) {
        await sbClient.from(tableName).delete().eq('id', singleEntry.id);
      } else if (isUpdate) {
        await sbClient.from(tableName).update(singleEntry.data).eq('id', singleEntry.id);
      } else if (singleEntry) {
        await sbClient.from(tableName).upsert(singleEntry);
      }
    } catch (e) {
      console.error(`Erro de persistência Supabase em ${tableName}, salvando local`, e);
      localStorage.setItem(storageKey, JSON.stringify(allEntries));
    }
  } else {
    try {
      localStorage.setItem(storageKey, JSON.stringify(allEntries));
    } catch (e) {
      console.error(`Falha ao salvar no localStorage (${storageKey})`, e);
    }
  }
}

export async function uploadFile(bucket, filePath, file) {
  if (!sbClient) throw new Error('Supabase não inicializado');
  const { data, error } = await sbClient.storage.from(bucket).upload(filePath, file, {
    cacheControl: '3600',
    upsert: true
  });
  if (error) throw error;
  
  const { data: publicData } = sbClient.storage.from(bucket).getPublicUrl(filePath);
  return publicData.publicUrl;
}

