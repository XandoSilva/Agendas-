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
      </div>
    </div>
  `;


}

export function updateConnectionStatus(type, label) {
  const dots = document.querySelectorAll('#onlineDot, .dot');
  const texts = document.querySelectorAll('#connStatus');

  dots.forEach(dot => {
    if (dot.id === 'onlineDot' || dot.classList.contains('dot')) {
      if (type === 'online') {
        dot.style.background = 'var(--green)';
        dot.style.boxShadow = '0 0 12px var(--green)';
      } else if (type === 'error') {
        dot.style.background = 'var(--coral)';
        dot.style.boxShadow = '0 0 12px var(--coral)';
      } else {
        dot.style.background = 'var(--blue)';
        dot.style.boxShadow = '0 0 12px var(--blue)';
      }
    }
  });

  texts.forEach(text => {
    if (type === 'online') {
      text.textContent = label || 'Online (Supabase)';
    } else if (type === 'error') {
      text.textContent = label || 'Erro de Conexão';
    } else {
      text.textContent = label || 'Modo Local (localStorage)';
    }
  });
}
