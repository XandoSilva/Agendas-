/**
 * Componente Dashboard de Métricas & KPIs (Data Visualization)
 */

export function renderDashboard(containerEl, entries) {
  const todayISO = new Date().toISOString().split('T')[0];
  
  let todayCount = 0;
  let confirmadas = 0;
  let pendentes = 0;
  let realizadas = 0;
  let vistorias = 0;
  let passagens = 0;

  entries.forEach(e => {
    if (e.data === todayISO) todayCount++;
    if (e.status === 'Confirmada') confirmadas++;
    else if (e.status === 'Pendente') pendentes++;
    else if (e.status === 'Realizada') realizadas++;

    if (e.tipo === 'Vistoria') vistorias++;
    else if (e.tipo === 'Passagem de Cabo') passagens++;
  });

  const totalValidos = entries.length || 1;
  const taxaConclusao = Math.round((realizadas / totalValidos) * 100);

  containerEl.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card">
        <span class="kpi-title">Vistorias Hoje</span>
        <span class="kpi-value text-teal">${todayCount}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-title">Confirmadas</span>
        <span class="kpi-value text-blue">${confirmadas}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-title">Pendentes</span>
        <span class="kpi-value text-amber">${pendentes}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-title">Realizadas</span>
        <span class="kpi-value text-green">${realizadas}</span>
      </div>
      <div class="kpi-card kpi-progress">
        <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
          <span class="kpi-title">% Conclusão</span>
          <span class="kpi-value-sm text-green">${taxaConclusao}%</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${taxaConclusao}%;"></div>
        </div>
      </div>
    </div>
  `;
}
