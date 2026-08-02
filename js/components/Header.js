/**
 * Componente Header / Brand com seletor de Tema (Modo Claro / Modo Escuro)
 */

export function renderHeader(containerEl, onOpenSettings, onToggleTheme) {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const themeIcon = currentTheme === 'light' ? '🌙' : '☀️';
  const themeTitle = currentTheme === 'light' ? 'Alternar para Modo Escuro' : 'Alternar para Modo Claro';

  containerEl.innerHTML = `
    <div class="brand">
      <div class="dot" id="onlineDot"></div>
      <div style="flex:1;">
        <h1>Painel de Agendamentos</h1>
        <span id="connStatus">vistorias &amp; passagens de cabo</span>
      </div>
      <button class="icon-btn" id="btnThemeToggle" style="margin-left:auto; font-size:14px; padding:5px 9px; border:1px solid var(--line); background:var(--input-bg); color:var(--text);" title="${themeTitle}">${themeIcon}</button>
      <button class="icon-btn" id="btnSettings" style="font-size:14px; padding:5px 9px; border:1px solid var(--line); background:var(--input-bg); color:var(--text);" title="Configurar Banco de Dados">⚙️</button>
    </div>
  `;

  document.getElementById('btnSettings').addEventListener('click', onOpenSettings);
  document.getElementById('btnThemeToggle').addEventListener('click', onToggleTheme);
}

export function updateConnectionStatus(type, label) {
  const dot = document.getElementById('onlineDot');
  const text = document.getElementById('connStatus');
  if (!dot || !text) return;

  if (type === 'online') {
    dot.style.background = 'var(--green)';
    dot.style.boxShadow = '0 0 12px var(--green)';
    text.textContent = label || 'Online (Supabase)';
  } else if (type === 'error') {
    dot.style.background = 'var(--coral)';
    dot.style.boxShadow = '0 0 12px var(--coral)';
    text.textContent = label || 'Erro de Conexão';
  } else {
    dot.style.background = 'var(--blue)';
    dot.style.boxShadow = '0 0 12px var(--blue)';
    text.textContent = label || 'Modo Local (localStorage)';
  }
}
