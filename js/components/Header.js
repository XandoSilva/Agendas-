/**
 * Componente Header / Brand
 */

export function renderHeader(containerEl, onOpenSettings) {
  containerEl.innerHTML = `
    <div class="brand">
      <div class="dot" id="onlineDot"></div>
      <div style="flex:1;">
        <h1>Painel de Agendamentos</h1>
        <span id="connStatus">vistorias &amp; passagens de cabo</span>
      </div>
      <button class="icon-btn" id="btnSettings" style="margin-left:auto; font-size:14px; padding:4px 8px; border:none; background:var(--line); color:var(--text);" title="Configurar Banco de Dados">⚙️</button>
    </div>
  `;

  document.getElementById('btnSettings').addEventListener('click', onOpenSettings);
}

export function updateConnectionStatus(type, label) {
  const dot = document.getElementById('onlineDot');
  const text = document.getElementById('connStatus');
  if (!dot || !text) return;

  if (type === 'online') {
    dot.style.background = '#4ADE80';
    dot.style.boxShadow = '0 0 12px #4ADE80';
    text.textContent = label || 'Online (Supabase)';
  } else if (type === 'error') {
    dot.style.background = '#FB7185';
    dot.style.boxShadow = '0 0 12px #FB7185';
    text.textContent = label || 'Erro de Conexão';
  } else {
    dot.style.background = '#38BDF8';
    dot.style.boxShadow = '0 0 12px #38BDF8';
    text.textContent = label || 'Modo Local (localStorage)';
  }
}
