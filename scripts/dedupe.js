/**
 * Script nativo (Node fetch) para deduplicar registros no Supabase
 * Preservando a diferença entre TIPO (Vistoria vs Passagem de Cabo vs Ativação)
 */

const SUPABASE_URL = 'https://cccyycqxasypvzwhcsok.supabase.co/rest/v1/agendamentos';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3l5Y3F4YXN5cHZ6d2hjc29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2MjU1ODIsImV4cCI6MjEwMTIwMTU4Mn0.Hh4G0FGvVNchjXd7D0G_u-3OMYytusD_PbTs19Gcazw';

const headers = {
  'apikey': API_KEY,
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
};

async function deduplicate() {
  console.log('🔍 Buscando agendamentos no Supabase...');
  
  const res = await fetch(`${SUPABASE_URL}?select=*`, { headers });
  if (!res.ok) {
    console.error('Erro ao buscar registros:', await res.text());
    return;
  }

  const data = await res.json();
  console.log(`📊 Total de registros encontrados no banco: ${data.length}`);

  const seen = new Map();
  const duplicatesToDelete = [];

  for (const entry of data) {
    const tipo = (entry.tipo || '').trim().toLowerCase();
    const contrato = (entry.contrato || '').trim().toLowerCase();
    const cliente = (entry.cliente || '').trim().toLowerCase();
    const dataAg = (entry.data || '').trim();
    
    if (!contrato && !cliente) continue;

    // Chave única que preserva Passagens de Cabo e Vistorias do mesmo contrato
    const key = `${tipo}_${contrato}_${cliente}_${dataAg}`;
    
    if (seen.has(key)) {
      duplicatesToDelete.push(entry.id);
    } else {
      seen.set(key, entry);
    }
  }

  console.log(`⚠️ Registros duplicados idênticos encontrados: ${duplicatesToDelete.length}`);

  if (duplicatesToDelete.length > 0) {
    for (const id of duplicatesToDelete) {
      const delRes = await fetch(`${SUPABASE_URL}?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers
      });
      if (delRes.ok) {
        console.log(`  🗑️ Removida duplicata ID: ${id}`);
      } else {
        console.error(`  ❌ Erro ao deletar ID: ${id}`);
      }
    }
    console.log(`\n✅ Limpeza concluída! ${duplicatesToDelete.length} registros duplicados removidos.`);
  } else {
    console.log('\n✨ Nenhuma duplicata encontrada no banco.');
  }
}

deduplicate();
