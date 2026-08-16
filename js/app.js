import * as sheetsAPI from './services/sheets-api.js';
import * as auth from './services/auth.js';
// Modules
import DashboardModule from './modules/DashboardModule.js';
import ChamadosB2BModule from './modules/ChamadosB2BModule.js';
import IncidentesModule from './modules/IncidentesModule.js';
import VistoriasModule from './modules/VistoriasModule.js';
import InfraModule from './modules/InfraModule.js';
import POPsModule from './modules/POPsModule.js';
import EstoqueModule from './modules/EstoqueModule.js';

class App {
  constructor() {
    this.currentModule = 'dashboard';
    this.modules = {
      dashboard: new DashboardModule(),
      b2b: new ChamadosB2BModule(),
      incidentes: new IncidentesModule(),
      vistorias: new VistoriasModule(),
      infra: new InfraModule(),
      pops: new POPsModule(),
      estoque: new EstoqueModule()
    };
    
    this.moduleTitles = {
      dashboard: 'Painel Operacional',
      b2b: 'Chamados B2B',
      incidentes: 'Incidentes',
      vistorias: 'Vistorias RJ',
      infra: 'Infraestrutura',
      pops: 'POPs & Preventivas',
      estoque: 'Estoque VERO'
    };

    this.data = null;
    this.isSyncing = false;
  }

  async init() {
    this._initModules();
    this._bindNavigation();
    this._bindSyncButton();

    // Setup UI for first load
    this._updateSyncUI('loading');
    Object.values(this.modules).forEach(m => {
      if (m.renderLoading) m.renderLoading();
    });

    // Setup Authentication
    this._setupAuth();

    // Subscribe to data changes
    sheetsAPI.onDataUpdate((data) => {
      this.data = data;
      this._renderCurrentModule();
      this._updateBadges();
      this._updateSyncUI('success');
    });

    // Fetch initial data
    try {
      await sheetsAPI.fetchAllData();
    } catch (err) {
      console.error('Failed initial fetch:', err);
      this._updateSyncUI('error');
    }
  }

  _initModules() {
    Object.keys(this.modules).forEach(key => {
      const container = document.getElementById(`module-${key}`);
      if (container) {
        this.modules[key].init(container);
      }
    });
  }

  _bindNavigation() {
    const navItems = document.querySelectorAll('.nav-item, .mobile-nav-item');
    
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all nav items
        navItems.forEach(nav => nav.classList.remove('active'));
        
        // Add active class to corresponding desktop/mobile items
        const target = item.dataset.target;
        document.querySelectorAll(`[data-target="${target}"]`).forEach(el => {
          el.classList.add('active');
        });

        this.currentModule = target;
        
        // Update Header Title
        const headerTitle = document.getElementById('header-page-title');
        if (headerTitle) {
          headerTitle.textContent = this.moduleTitles[target] || 'VERO Operações';
        }

        // Switch views
        document.querySelectorAll('.module-view').forEach(view => {
          view.classList.remove('active');
        });
        const activeView = document.getElementById(`module-${target}`);
        if (activeView) {
          activeView.classList.add('active');
        }

        this._renderCurrentModule();
      });
    });
  }

  _bindSyncButton() {
    const btn = document.getElementById('btn-force-sync');
    if (btn) {
      btn.addEventListener('click', async () => {
        if (this.isSyncing) return;
        this.isSyncing = true;
        this._updateSyncUI('loading');
        
        // Force bypass cache
        try {
          await sheetsAPI.fetchAllData(true);
        } catch (err) {
          console.error('Sync failed:', err);
          this._updateSyncUI('error');
        } finally {
          this.isSyncing = false;
        }
      });
    }
  }

  _renderCurrentModule() {
    if (!this.data) return;
    const mod = this.modules[this.currentModule];
    if (mod && mod.render) {
      mod.render(this.data);
    }
  }

  _updateBadges() {
    if (!this.data) return;

    // B2B Pendentes ou Atenuação
    const b2bBadge = document.getElementById('badge-b2b');
    if (b2bBadge && this.data.chamadosB2B) {
      const pendentes = this.data.chamadosB2B.filter(i => {
        const s = (i['Status / Andamento'] || '').toUpperCase();
        return s.includes('PENDENTE') || s.includes('ATENUAÇÃO') || s.includes('ATENUACAO');
      }).length;
      
      b2bBadge.textContent = pendentes;
      b2bBadge.style.display = pendentes > 0 ? 'inline-block' : 'none';
    }

    // Incidentes Pendentes ou Em andamento
    const incBadge = document.getElementById('badge-incidentes');
    if (incBadge && this.data.incidentes) {
      const pendentes = this.data.incidentes.filter(i => {
        const s = (i['Status'] || '').toUpperCase();
        return s.includes('PENDENTE') || s.includes('VALIDAÇÃO') || s.includes('VALIDACAO');
      }).length;
      
      incBadge.textContent = pendentes;
      incBadge.style.display = pendentes > 0 ? 'inline-block' : 'none';
    }
  }

  _updateSyncUI(status) {
    const indicator = document.getElementById('sync-status');
    const text = document.getElementById('sync-text');
    const btn = document.getElementById('btn-force-sync');
    
    if (!indicator || !text || !btn) return;

    indicator.className = 'sync-indicator';
    btn.classList.remove('loading');

    if (status === 'loading') {
      indicator.classList.add('loading');
      text.textContent = 'Sincronizando...';
      btn.classList.add('loading');
    } else if (status === 'success') {
      text.textContent = 'Atualizado agora';
      // Reset after a while to show "Sincronizado"
      setTimeout(() => {
        if (!this.isSyncing) text.textContent = 'Sincronizado';
      }, 5000);
    } else if (status === 'error') {
      indicator.classList.add('error');
      text.textContent = 'Modo Offline';
    }
  }

  _setupAuth() {
    const tryInitAuth = () => {
      if (typeof google !== 'undefined' && google.accounts) {
        auth.initAuth();
        auth.onAuthStateChanged((user) => this._handleAuthStateChanged(user));
      } else {
        setTimeout(tryInitAuth, 100);
      }
    };
    tryInitAuth();
  }

  _handleAuthStateChanged(user) {
    const profileContainer = document.getElementById('user-profile-container');
    if (!profileContainer) return;

    if (user) {
      // Cruzamento com a base de acessos
      this._applyRBAC(user);

      profileContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
          <img src="${user.picture}" alt="Profile" style="width: 48px; height: 48px; border-radius: 50%; border: 2px solid var(--primary);">
          <div>
            <div style="font-size: 14px; font-weight: 600; color: var(--text);">${user.name}</div>
            <div style="font-size: 11px; color: var(--text-dim); background: var(--bg-card); padding: 2px 8px; border-radius: 12px; margin-top: 4px;">${user.role}</div>
          </div>
          <button id="logout-btn" style="background: none; border: none; color: var(--danger); font-size: 12px; cursor: pointer; margin-top: 4px; padding: 4px;">Sair</button>
        </div>
      `;
      document.getElementById('logout-btn').addEventListener('click', () => auth.logout());
    } else {
      profileContainer.innerHTML = '';
      auth.renderLoginButton(profileContainer);
      
      // Se nǜo logado, esconde tudo e mostra um painel vazio ou exige login
      this._applyRBAC(null);
    }
  }

  _applyRBAC(user) {
    const navItems = document.querySelectorAll('.nav-item');
    if (!user) {
      // Bloqueia acesso a tudo, exceto talvez um aviso
      navItems.forEach(item => item.style.display = 'none');
      return;
    }

    // Lógica provisória até ler a planilha "Acessos"
    // Pega os perfis baseados no e-mail na aba "Acessos" (this.data.acessos)
    if (this.data && this.data.acessos) {
      const acessoList = this.data.acessos;
      const myAccess = acessoList.find(a => a['Email'] && a['Email'].toLowerCase() === user.email.toLowerCase());
      if (myAccess && myAccess['Perfil']) {
        if (user.role !== myAccess['Perfil']) {
          auth.setRole(myAccess['Perfil']); // Atualiza no auth state (isso engatilha o observer novamente)
          return;
        }
      }
    }

    // Role-based visibility
    const role = user.role.toUpperCase();
    
    // Regras de Visibilidade das abas
    navItems.forEach(item => {
      const target = item.dataset.target;
      let visible = false;

      if (role === 'ADMIN') {
        visible = true; // Admin vê tudo
      } else if (role === 'TÉCNICO CAMPO' || role === 'TECNICO CAMPO') {
        // Técnico Campo vê Incidentes, Vistorias, Estoque
        if (['incidentes', 'vistorias', 'estoque'].includes(target)) visible = true;
      } else if (role === 'TÉCNICO B2B' || role === 'TECNICO B2B') {
        if (['b2b', 'incidentes'].includes(target)) visible = true;
      } else if (role === 'INFRA' || role === 'INFRAESTRUTURA') {
        if (['infra', 'pops', 'incidentes'].includes(target)) visible = true;
      } else if (role === 'LOGISTICA' || role === 'LOGÍSTICA') {
        if (['estoque'].includes(target)) visible = true;
      } else {
        // Visualizador (padrão)
        if (['dashboard'].includes(target)) visible = true;
      }

      item.style.display = visible ? 'flex' : 'none';
    });

    // Redireciona para o primeiro disponível se o atual estiver escondido
    const currentNav = document.querySelector(`.nav-item[data-target="${this.currentModule}"]`);
    if (currentNav && currentNav.style.display === 'none') {
      const firstVisible = Array.from(navItems).find(i => i.style.display !== 'none');
      if (firstVisible) {
        firstVisible.click();
      }
    }
  }

}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
  window.app.init();
});
