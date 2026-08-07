/**
 * App Shell Router
 * Gerencia a troca de Módulos (Agenda / Manutenção) e inicializa os módulos.
 */

import { initAgendaModule } from './modules/AgendaModule.js';
import { initManutencaoModule } from './modules/ManutencaoModule.js';
import { renderMobileNav } from './components/MobileNav.js';

let currentModule = 'agenda'; // 'agenda' | 'manutencao'

function switchModule(moduleName) {
  currentModule = moduleName;

  // Esconder todos
  document.querySelectorAll('.module-container').forEach(el => {
    el.classList.remove('active');
    el.style.display = 'none';
  });

  // Mostrar ativo
  const activeModule = document.getElementById(`module-${moduleName}`);
  if (activeModule) {
    activeModule.classList.add('active');
    activeModule.style.display = 'flex';
  }

  // Atualizar visual da Sidebar Desktop
  document.querySelectorAll('.nav-menu .nav-item').forEach(btn => {
    if (btn.getAttribute('data-module') === moduleName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Atualizar layout Mobile
  if (window.innerWidth <= 1024) {
    document.body.className = moduleName === 'agenda' ? 'tab-agenda' : 'tab-manutencao-lista';
    renderMobileNav(document.getElementById('mobileNavContainer'), handleMobileTabChange, currentModule);
  } else {
    document.body.className = '';
  }
}

function handleMobileTabChange(tab) {
  if (tab === 'config') {
    // A configuração ainda fica no AgendaModule temporariamente ou modal global
    const btnSettings = document.getElementById('btnSettings');
    if (btnSettings) btnSettings.click();
    return;
  }

  // Se clicou em Agenda no menu inferior
  if (tab === 'agenda') {
    switchModule('agenda');
    document.body.className = 'tab-agenda';
  } 
  // Se clicou em Manutencao
  else if (tab === 'manutencao') {
    switchModule('manutencao');
    document.body.className = 'tab-manutencao-lista';
  }
  // Se clicou em Novo
  else if (tab === 'novo') {
    if (currentModule === 'agenda') {
      document.body.className = 'tab-novo';
    } else {
      document.body.className = 'tab-manutencao-novo';
    }
  }
}

async function startApp() {
  // Configurar cliques do menu desktop
  document.querySelectorAll('.nav-menu .nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mod = e.currentTarget.getAttribute('data-module');
      switchModule(mod);
    });
  });

  // Renderizar o Mobile Nav inicial
  renderMobileNav(document.getElementById('mobileNavContainer'), handleMobileTabChange, currentModule);

  // Inicializar módulos
  await initAgendaModule();
  await initManutencaoModule();

  // Forçar o estado inicial
  switchModule('agenda');
}

window.addEventListener('DOMContentLoaded', startApp);
