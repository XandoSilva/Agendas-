export default class SwipeCard {
  constructor(element, options = {}) {
    this.el = typeof element === 'string' ? document.querySelector(element) : element;
    this.onSwipeRight = options.onSwipeRight || null;
    this.onSwipeLeft = options.onSwipeLeft || null;
    
    this.startX = 0;
    this.currentX = 0;
    this.isSwiping = false;
    this.threshold = 80; // px para acionar
    
    this.init();
  }

  init() {
    if (!this.el) return;
    this.el.style.touchAction = 'pan-y'; // Permite scroll vertical, previne scroll horizontal nativo
    this.el.style.transition = 'transform 0.2s ease';
    this._bindEvents();
  }

  _bindEvents() {
    this.el.addEventListener('touchstart', (e) => {
      this.startX = e.touches[0].clientX;
      this.isSwiping = true;
      this.el.style.transition = 'none';
    }, { passive: true });

    this.el.addEventListener('touchmove', (e) => {
      if (!this.isSwiping) return;
      this.currentX = e.touches[0].clientX;
      const diffX = this.currentX - this.startX;
      
      // Apenas deslizar um pouco, com resistência
      if (Math.abs(diffX) < 150) {
        this.el.style.transform = `translateX(${diffX}px)`;
      }
    }, { passive: true });

    this.el.addEventListener('touchend', (e) => {
      if (!this.isSwiping) return;
      this.isSwiping = false;
      
      this.el.style.transition = 'transform 0.3s ease';
      const diffX = this.currentX - this.startX;
      
      if (diffX > this.threshold && this.onSwipeRight) {
        // Deslizou para a direita
        this.el.style.transform = `translateX(${window.innerWidth}px)`;
        setTimeout(() => this.onSwipeRight(this.el), 300);
      } else if (diffX < -this.threshold && this.onSwipeLeft) {
        // Deslizou para a esquerda
        this.el.style.transform = `translateX(-${window.innerWidth}px)`;
        setTimeout(() => this.onSwipeLeft(this.el), 300);
      } else {
        // Volta pro lugar
        this.el.style.transform = `translateX(0)`;
      }
      
      this.startX = 0;
      this.currentX = 0;
    });
  }
}
