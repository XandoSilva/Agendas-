import { fetchEntries } from '../services/api.js';

let manutencoesFull = [];

export async function initRelatoriosModule() {
  const mesFiltro = document.getElementById('relatorioMesFiltro');
  const btnExportar = document.getElementById('btnExportarRelatorio');
  
  if (mesFiltro) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    mesFiltro.value = `${yyyy}-${mm}`;
    mesFiltro.addEventListener('change', renderRelatorio);
  }

  if (btnExportar) {
    btnExportar.addEventListener('click', exportarRelatorioCSV);
  }

  // Load all manutencoes for reporting
  manutencoesFull = await fetchEntries('manutencoes', (payload) => {
    // Keep local list updated
    if (payload.eventType === 'INSERT') {
      if (!manutencoesFull.some(m => m.id === payload.new.id)) manutencoesFull.push(payload.new);
    } else if (payload.eventType === 'UPDATE') {
      const idx = manutencoesFull.findIndex(m => m.id === payload.new.id);
      if (idx >= 0) manutencoesFull[idx] = payload.new;
    } else if (payload.eventType === 'DELETE') {
      manutencoesFull = manutencoesFull.filter(m => m.id !== payload.old.id);
    }
    // Only re-render if the active tab is relatorios
    const activeBtn = document.querySelector('.nav-item.active');
    if (activeBtn && activeBtn.dataset.module === 'relatorios') {
      renderRelatorio();
    }
  });

  renderRelatorio();
}

export function renderRelatorio() {
  const mesFiltroInput = document.getElementById('relatorioMesFiltro');
  if (!mesFiltroInput || !mesFiltroInput.value) return;

  const [ano, mes] = mesFiltroInput.value.split('-');
  const filterMonth = parseInt(mes, 10);
  const filterYear = parseInt(ano, 10);

  // Filtrar dados do mês selecionado
  const dadosMes = manutencoesFull.filter(m => {
    if (!m.created_at) return false;
    const d = new Date(m.created_at);
    return d.getMonth() + 1 === filterMonth && d.getFullYear() === filterYear;
  });

  // Agrupar por Empreiteira -> Equipe
  const agrupamento = {};
  let totalManutencoes = 0;
  const equipesUnicas = new Set();
  const empreiteirasUnicas = new Set();

  dadosMes.forEach(m => {
    const empreiteira = (m.empreiteira || 'NÃO INFORMADA').trim().toUpperCase();
    const equipe = (m.equipe_designada || 'NÃO INFORMADA').trim().toUpperCase();

    if (!agrupamento[empreiteira]) {
      agrupamento[empreiteira] = {};
    }
    if (!agrupamento[empreiteira][equipe]) {
      agrupamento[empreiteira][equipe] = 0;
    }

    agrupamento[empreiteira][equipe]++;
    totalManutencoes++;
    equipesUnicas.add(equipe);
    empreiteirasUnicas.add(empreiteira);
  });

  // Atualizar os Cards Resumo
  document.getElementById('relTotalMes').textContent = totalManutencoes;
  document.getElementById('relTotalEquipes').textContent = equipesUnicas.size;
  document.getElementById('relTotalEmpreiteiras').textContent = empreiteirasUnicas.size;

  // Atualizar a Tabela
  const tbody = document.getElementById('relatoriosTableBody');
  tbody.innerHTML = '';

  if (totalManutencoes === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 20px; color: var(--muted);">Nenhuma manutenção registrada neste mês.</td></tr>`;
    return;
  }

  // Ordenar e renderizar
  const empreiteirasSorted = Object.keys(agrupamento).sort();

  empreiteirasSorted.forEach(emp => {
    const equipes = agrupamento[emp];
    const equipesSorted = Object.keys(equipes).sort();

    equipesSorted.forEach(eq => {
      const total = equipes[eq];
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--line)';
      
      tr.innerHTML = `
        <td style="padding: 12px 8px; color: var(--text); font-weight: 500;">${emp}</td>
        <td style="padding: 12px 8px; color: var(--muted-2);">${eq}</td>
        <td style="padding: 12px 8px; text-align: right; color: var(--teal); font-weight: bold; font-size: 15px;">${total}</td>
      `;
      tbody.appendChild(tr);
    });
  });
}

function exportarRelatorioCSV() {
  const tbody = document.getElementById('relatoriosTableBody');
  if (!tbody || tbody.innerText.includes('Nenhuma manutenção') || tbody.innerText.includes('Carregando')) {
    alert("Não há dados para exportar neste mês.");
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Empreiteira Executora,Equipe Designada,Total Realizado\n";

  const rows = tbody.querySelectorAll('tr');
  rows.forEach(row => {
    const cols = row.querySelectorAll('td');
    if (cols.length === 3) {
      const emp = cols[0].innerText.replace(/,/g, '');
      const eq = cols[1].innerText.replace(/,/g, '');
      const total = cols[2].innerText;
      csvContent += `${emp},${eq},${total}\n`;
    }
  });

  const mesFiltroInput = document.getElementById('relatorioMesFiltro');
  const mesValue = mesFiltroInput ? mesFiltroInput.value : 'relatorio';
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `auditoria_manutencoes_${mesValue}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
