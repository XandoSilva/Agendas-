export default class PullToRefresh {
  constructor(container, onRefresh) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.onRefresh = onRefresh;
    
    this.startY = 0;
    this.currentY = 0;
    this.isPulling = false;
    this.dist = 0;
    this.threshold = 60; // puxar 60px para ativar
    
    this.init();
  }

  init() {
    if (!this.container) return;
    
    // Criar o indicador visual
    this.ptrEl = document.createElement('div');
    this.ptrEl.className = 'ptr-indicator';
    this.ptrEl.innerHTML = `
      <div class="ptr-spinner">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
      </div>
    `;
    this.container.parentNode.insertBefore(this.ptrEl, this.container);
    
    this._bindEvents();
  }

  _bindEvents() {
    this.container.addEventListener('touchstart', (e) => {
      if (this.container.scrollTop === 0) {
        this.startY = e.touches[0].clientY;
        this.isPulling = true;
        this.ptrEl.style.transition = 'none';
      }
    }, { passive: true });

    this.container.addEventListener('touchmove', (e) => {
      if (!this.isPulling) return;
      
      this.currentY = e.touches[0].clientY;
      this.dist = this.currentY - this.startY;
      
      if (this.dist > 0 && this.container.scrollTop === 0) {
        e.preventDefault(); // Evitar scroll nativo enquanto puxa
        const pullVisual = Math.min(this.dist * 0.4, 80); // Resistência
        this.ptrEl.style.transform = `translateY(${pullVisual}px)`;
        this.ptrEl.style.opacity = Math.min(this.dist / this.threshold, 1);
        
        if (this.dist > this.threshold) {
          this.ptrEl.classList.add('ptr-ready');
        } else {
          this.ptrEl.classList.remove('ptr-ready');
        }
      }
    }, { passive: false }); // Needs to be false to allow preventDefault

    this.container.addEventListener('touchend', async () => {
      if (!this.isPulling) return;
      this.isPulling = false;
      
      this.ptrEl.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
      
      if (this.dist > this.threshold) {
        this.ptrEl.classList.add('ptr-loading');
        this.ptrEl.style.transform = `translateY(40px)`; // Segura o indicador na tela
        
        if (this.onRefresh) {
          try {
            await this.onRefresh();
          } catch (err) {
            console.error('Refresh falhou', err);
          }
        }
        
        // Esconder após terminar
        this.ptrEl.style.transform = `translateY(0)`;
        this.ptrEl.style.opacity = '0';
        setTimeout(() => {
          this.ptrEl.classList.remove('ptr-loading', 'ptr-ready');
        }, 300);
      } else {
        // Cancela
        this.ptrEl.style.transform = `translateY(0)`;
        this.ptrEl.style.opacity = '0';
      }
      
      this.dist = 0;
    });
  }
}
