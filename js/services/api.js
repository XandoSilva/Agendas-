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

const activeChannels = {};

export async function fetchEntries(tableName, onRealtimeUpdate) {
  const storageKey = `local_${tableName}`;
  let localData = [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) localData = JSON.parse(raw);
  } catch (e) {
    console.error(`Falha ao carregar dados do localStorage (${storageKey})`, e);
  }

  if (sbClient) {
    try {
      const { data, error } = await sbClient.from(tableName).select('*');
      if (error) {
        console.error(`Erro Supabase em ${tableName}. Tentando carregar local...`, error);
        return localData;
      }

      // Merge remote data with local data (offline-first approach)
      let merged = [...(data || [])];
      localData.forEach(localItem => {
        if (!merged.find(m => m.id === localItem.id)) {
          merged.push(localItem);
        }
      });

      if (onRealtimeUpdate) {
        if (!activeChannels[tableName]) {
          activeChannels[tableName] = [];
          sbClient.channel(`public:${tableName}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, payload => {
              activeChannels[tableName].forEach(cb => cb(payload));
            }).subscribe();
        }
        activeChannels[tableName].push(onRealtimeUpdate);
      }
      return merged;
    } catch (e) {
      console.error(`Falha na conexão Supabase para ${tableName}, usando localStorage`, e);
      return localData;
    }
  } else {
    return localData;
  }
}

export async function persistEntry(tableName, singleEntry, isDelete = false, isUpdate = false, allEntries = []) {
  const storageKey = `local_${tableName}`;
  
  // SEMPRE SALVA LOCAL COMO BACKUP INDEPENDENTE DO SUPABASE
  try {
    localStorage.setItem(storageKey, JSON.stringify(allEntries));
  } catch (e) {
    console.error(`Falha ao salvar backup local (${storageKey})`, e);
  }

  if (sbClient) {
    try {
      let res;
      if (isDelete) {
        res = await sbClient.from(tableName).delete().eq('id', singleEntry.id);
      } else if (isUpdate) {
        const cleanData = { ...singleEntry.data };
        if (tableName === 'manutencoes') {
          delete cleanData.tipo_atendimento;
          delete cleanData.equipe_designada;
        }
        res = await sbClient.from(tableName).update(cleanData).eq('id', singleEntry.id);
      } else if (singleEntry) {
        const cleanEntry = { ...singleEntry };
        if (tableName === 'manutencoes') {
          delete cleanEntry.tipo_atendimento;
          delete cleanEntry.equipe_designada;
        }
        res = await sbClient.from(tableName).upsert(cleanEntry);
      }
      if (res && res.error) {
        console.warn(`Aviso: Falha ao salvar no banco online (${tableName})`, res.error);
      }
    } catch (e) {
      console.error(`Erro de persistência Supabase em ${tableName}`, e);
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

