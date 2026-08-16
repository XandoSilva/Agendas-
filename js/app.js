import * as sheetsAPI from './services/sheets-api.js';
import * as auth from './services/auth.js';
import * as rbac from './services/rbac.js';
import { getPendingCount, onQueueChange, processQueue } from './services/sheets-write-api.js';
import * as Toast from './components/Toast.js';
import * as EditModal from './components/EditModal.js';
import * as CreateModal from './components/CreateModal.js';

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
    this._createFAB();
    this._initPullToRefresh();

    // Setup UI for first load
    this._updateSyncUI('loading');
    Object.values(this.modules).forEach(m => {
      if (m.renderLoading) m.renderLoading();
    });

    // Setup Authentication
    this._setupAuth();

    // Monitor offline queue
    onQueueChange((count) => {
      this._updatePendingBadge(count);
    });
    this._updatePendingBadge(getPendingCount());

    // Subscribe to data changes
    sheetsAPI.onDataUpdate((data) => {
      this.data = data;
      
      // Update RBAC with fresh access data
      const user = auth.getUser();
      if (user) {
        rbac.initRBAC(data.acessos, user.email);
        this._handleAuthStateChanged(user);
      }

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

    // Auto-refresh every 2 minutes
    sheetsAPI.startAutoRefresh(120000);
  }

  _initModules() {
    Object.keys(this.modules).forEach(key => {
      const container = document.getElementById(`module-${key}`);
      if (container) {
        this.modules[key].init(container);
        // Inject edit/create callbacks into modules
        if (this.modules[key].setEditCallback) {
          this.modules[key].setEditCallback((moduleKey, item) => {
            EditModal.open(moduleKey, item, this.data?.apoioListas, (updatedItem) => {
              // Re-render after save
              this._renderCurrentModule();
              Toast.info('Sincronizando com a planilha...');
              processQueue();
            });
          });
        }
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
        this._updateFABVisibility();
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
        
        try {
          await sheetsAPI.fetchAllData(true);
          // Also process pending writes
          processQueue();
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

    // B2B Pendentes (não Normalizado e não Cancelado)
    const b2bBadge = document.getElementById('badge-b2b');
    if (b2bBadge && this.data.chamadosB2B) {
      const pendentes = this.data.chamadosB2B.filter(i => {
        const s = (i['Status / Andamento'] || '').toUpperCase();
        return !s.includes('NORMALIZADO') && !s.includes('CANCELADO');
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
      setTimeout(() => {
        if (!this.isSyncing) text.textContent = 'Sincronizado';
      }, 5000);
    } else if (status === 'error') {
      indicator.classList.add('error');
      text.textContent = 'Modo Offline';
    }
  }

  _updatePendingBadge(count) {
    let badge = document.getElementById('pending-badge');
    if (count > 0) {
      if (!badge) {
        badge = document.createElement('div');
        badge.id = 'pending-badge';
        badge.className = 'pending-sync-badge';
        const header = document.querySelector('.header-right');
        if (header) header.prepend(badge);
      }
      badge.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.92-10.27"/>
        </svg>
        ${count} pendente${count > 1 ? 's' : ''}
      `;
      badge.style.display = 'flex';
    } else if (badge) {
      badge.style.display = 'none';
    }
  }

  _setupAuth() {
    auth.initAuth();
    auth.onAuthStateChanged((user) => this._handleAuthStateChanged(user));

    // Bind Nebula Login Events
    const loginBtn = document.getElementById('nebula-login-btn');
    const emailInput = document.getElementById('nebula-email');
    const passwordInput = document.getElementById('nebula-password');
    const nameInput = document.getElementById('nebula-name');
    const nameGroup = document.getElementById('nebula-group-name');
    const tabLogin = document.getElementById('nebula-tab-login');
    const tabRegister = document.getElementById('nebula-tab-register');
    const tabMarker = document.getElementById('nebula-tab-marker');
    const errorMsg = document.getElementById('nebula-error');
    
    let isRegisterMode = false;

    const setMode = (mode) => {
      isRegisterMode = mode === 'register';
      errorMsg.style.display = 'none';
      if (isRegisterMode) {
        tabLogin.style.opacity = '0.5';
        tabLogin.classList.remove('active');
        tabRegister.style.opacity = '1';
        tabRegister.classList.add('active');
        tabMarker.style.left = 'calc(50% + 4px)';
        nameGroup.style.display = 'flex';
        loginBtn.textContent = 'CREATE ACCOUNT';
      } else {
        tabRegister.style.opacity = '0.5';
        tabRegister.classList.remove('active');
        tabLogin.style.opacity = '1';
        tabLogin.classList.add('active');
        tabMarker.style.left = '4px';
        nameGroup.style.display = 'none';
        loginBtn.textContent = 'LOGIN';
      }
    };

    if (tabLogin && tabRegister) {
      tabLogin.addEventListener('click', () => setMode('login'));
      tabRegister.addEventListener('click', () => setMode('register'));
    }
    
    const handleLogin = async () => {
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();
      if (!email || !password) return;
      
      if (!this.data || !this.data.acessos) {
         Toast.error('Aguarde os dados carregarem...');
         return;
      }
      
      if (isRegisterMode) {
        const name = nameInput.value.trim();
        if (!name) {
          errorMsg.textContent = 'Preencha seu nome completo.';
          errorMsg.style.display = 'block';
          return;
        }

        // Check if email already exists
        const exists = this.data.acessos.find(a => (a.Email || '').trim().toLowerCase() === email.toLowerCase());
        if (exists) {
          errorMsg.textContent = 'Este e-mail já está cadastrado.';
          errorMsg.style.display = 'block';
          return;
        }

        loginBtn.disabled = true;
        loginBtn.textContent = 'ENVIANDO...';

        try {
          const { enqueueWrite } = await import('./services/sheets-write-api.js');
          
          // Build row data dynamically based on headers
          const firstRow = this.data.acessos[0] || { 'Nome': '', 'Email': '', 'Perfil': '', 'Senha': '' };
          const headers = Object.keys(firstRow).filter(k => k !== '_rowIndex');
          
          const rowData = headers.map(h => {
            const hl = h.toLowerCase();
            if (hl.includes('nome')) return name;
            if (hl.includes('email')) return email;
            if (hl.includes('senha')) return password;
            if (hl.includes('perfil')) return 'PENDENTE';
            return '';
          });

          // Fallback if sheet is totally empty
          const finalRowData = headers.length > 0 ? rowData : [name, email, 'PENDENTE', password];

          enqueueWrite('append', {
            sheetName: 'Acessos',
            rowData: finalRowData
          });

          Toast.success('Solicitação enviada! Aguarde a aprovação do administrador.');
          setMode('login');
          passwordInput.value = '';
          nameInput.value = '';
        } catch (e) {
          console.error(e);
          Toast.error('Erro ao solicitar acesso.');
        } finally {
          loginBtn.disabled = false;
          loginBtn.textContent = 'LOGIN'; // Back to login state
        }
      } else {
        // Normal Login
        const success = auth.login(email, password, this.data.acessos);
        if (!success) {
           errorMsg.textContent = 'E-mail ou senha incorretos.';
           errorMsg.style.display = 'block';
        }
      }
    };

    if (loginBtn) {
      loginBtn.addEventListener('click', handleLogin);
      const enterHandler = (e) => {
        if (e.key === 'Enter') handleLogin();
      };
      emailInput.addEventListener('keypress', enterHandler);
      passwordInput.addEventListener('keypress', enterHandler);
    }

    this._handleAuthStateChanged(auth.getUser());
  }

  _handleAuthStateChanged(user) {
    const profileContainer = document.getElementById('user-profile-container');
    if (!profileContainer) return;

    if (user) {
      // Init RBAC with access data
      if (this.data && this.data.acessos) {
        rbac.initRBAC(this.data.acessos, user.email);
      }
      this._applyRBAC(user);

      const roleBadge = rbac.getCurrentRole();
      profileContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
          <img src="${user.picture}" alt="Profile" style="width: 48px; height: 48px; border-radius: 50%; border: 2px solid var(--teal);">
          <div>
            <div style="font-size: 14px; font-weight: 600; color: var(--text);">${user.name}</div>
            <div style="font-size: 10px; color: var(--teal); background: var(--teal-dim); padding: 2px 10px; border-radius: 12px; margin-top: 4px; text-align: center; font-weight: 600;">${roleBadge}</div>
          </div>
          <button id="logout-btn" style="background: none; border: none; color: var(--coral); font-size: 12px; cursor: pointer; margin-top: 4px; padding: 4px;">Sair</button>
        </div>
      `;
      document.getElementById('logout-btn').addEventListener('click', () => auth.logout());
      // Hide overlay
      const overlay = document.getElementById('nebula-login-overlay');
      if (overlay) overlay.classList.add('hidden');
    } else {
      profileContainer.innerHTML = ''; // Limpa o menu lateral
      
      this._applyRBAC(null);
      
      // Show overlay
      const overlay = document.getElementById('nebula-login-overlay');
      if (overlay) {
        overlay.classList.remove('hidden');
        document.getElementById('nebula-error').style.display = 'none';
        document.getElementById('nebula-password').value = '';
      }
    }
  }

  _applyRBAC(user) {
    const navItems = document.querySelectorAll('.nav-item, .mobile-nav-item');
    
    if (!user) {
      // Not logged in — show only dashboard (read-only)
      navItems.forEach(item => {
        item.style.display = item.dataset.target === 'dashboard' ? 'flex' : 'none';
      });
      return;
    }

    // Use RBAC service for visibility
    const visibleModules = rbac.getVisibleModules();

    navItems.forEach(item => {
      const target = item.dataset.target;
      item.style.display = visibleModules.includes(target) ? 'flex' : 'none';
    });

    // Redirect to first visible if current is hidden
    if (!visibleModules.includes(this.currentModule)) {
      const defaultMod = rbac.getDefaultModule();
      if (defaultMod) {
        const firstNav = Array.from(navItems).find(i => i.dataset.target === defaultMod);
        if (firstNav) firstNav.click();
      }
    }

    this._updateFABVisibility();
  }

  // ─── FAB (Floating Action Button) ──────────────────────────────

  _createFAB() {
    const fab = document.createElement('button');
    fab.className = 'fab';
    fab.id = 'fab-create';
    fab.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    `;
    fab.style.display = 'none';
    fab.addEventListener('click', () => {
      if (this.data) {
        CreateModal.open(this.currentModule, this.data.apoioListas, () => {
          Toast.info('Sincronizando novo registro...');
          processQueue();
          // Refresh data after a short delay
          setTimeout(() => sheetsAPI.fetchAllData(), 2000);
        });
      }
    });
    document.body.appendChild(fab);
  }

  _updateFABVisibility() {
    const fab = document.getElementById('fab-create');
    if (!fab) return;
    const canCreateInModule = rbac.canCreate(this.currentModule);
    fab.style.display = canCreateInModule ? 'flex' : 'none';
  }

  // ─── Pull to Refresh ──────────────────────────────────────────

  _initPullToRefresh() {
    const content = document.querySelector('.app-content');
    if (!content) return;

    let startY = 0;
    let pulling = false;
    let indicator = null;

    content.addEventListener('touchstart', (e) => {
      if (content.scrollTop <= 0) {
        startY = e.touches[0].clientY;
        pulling = true;
      }
    }, { passive: true });

    content.addEventListener('touchmove', (e) => {
      if (!pulling) return;
      const delta = e.touches[0].clientY - startY;
      if (delta > 0 && delta < 120) {
        if (!indicator) {
          indicator = document.createElement('div');
          indicator.className = 'pull-refresh-indicator';
          indicator.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--teal)" stroke-width="2" style="width:20px;height:20px">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.92-10.27"/>
            </svg>
            <span>Solte para atualizar</span>
          `;
          content.prepend(indicator);
        }
        indicator.style.opacity = Math.min(1, delta / 80);
        indicator.style.transform = `translateY(${delta / 2}px)`;
      }
    }, { passive: true });

    content.addEventListener('touchend', async () => {
      if (!pulling || !indicator) { pulling = false; return; }
      pulling = false;
      
      const delta = parseFloat(indicator.style.transform.match(/translateY\((.+)px\)/)?.[1] || 0);
      if (delta > 40) {
        indicator.innerHTML = `<div class="btn-spinner"></div><span>Atualizando...</span>`;
        try {
          await sheetsAPI.fetchAllData(true);
          processQueue();
        } catch (e) {
          console.error('Pull refresh failed:', e);
        }
      }
      
      if (indicator) {
        indicator.remove();
        indicator = null;
      }
    });
  }
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
  window.app.init();
});
