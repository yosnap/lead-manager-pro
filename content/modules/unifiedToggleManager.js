// Módulo para gestionar toggles de manera unificada en toda la extensión

// Módulo para gestionar toggles de manera unificada en toda la extensión

class UnifiedToggleManager {
  constructor() {
    this.currentToggle = null;
    this.currentSidebar = null;
    this.toggleType = null; // 'general' | 'group'
  }

  // Limpiar toggle existente
  clearExistingToggle() {
    // Buscar y remover toggles existentes
    const existingToggles = document.querySelectorAll('#snap-lead-manager-toggle, #lead-manager-group-toggle');
    existingToggles.forEach(toggle => {
      if (toggle && toggle.parentNode) {
        toggle.parentNode.removeChild(toggle);
      }
    });

    this.currentToggle = null;
    this.currentSidebar = null;
    this.toggleType = null;
  }

  // Crear toggle unificado
  createUnifiedToggle(type = 'general') {
    // Limpiar toggle existente
    this.clearExistingToggle();

    const toggle = document.createElement('button');
    toggle.id = type === 'group' ? 'lead-manager-group-toggle' : 'snap-lead-manager-toggle';
    toggle.className = 'sidebar-closed';
    toggle.innerHTML = '<span aria-hidden="true">▶</span>';
    toggle.setAttribute('aria-label', `Mostrar panel lateral de Lead Manager - ${type === 'group' ? 'Grupos' : 'General'}`);
    toggle.setAttribute('title', `Mostrar Lead Manager - ${type === 'group' ? 'Grupos' : 'General'}`);
    toggle.setAttribute('type', 'button');

    // Estilos base unificados
    toggle.style.cssText = `
      position: fixed;
      top: 50%;
      right: 10px;
      transform: translateY(-50%);
      width: 30px;
      height: 80px;
      background: linear-gradient(135deg, ${type === 'group' ? '#1f4e79' : '#28a745'} 0%, ${type === 'group' ? '#0f3460' : '#1e7e34'} 100%);
      color: white;
      border: none;
      border-radius: 6px 0 0 6px;
      cursor: pointer;
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: bold;
      box-shadow: -3px 0 15px rgba(0,0,0,0.2);
      transition: right 0.4s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease, transform 0.3s ease;
      outline: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Efectos de hover
    this.addToggleEffects(toggle, type);

    // Agregar al DOM
    document.body.appendChild(toggle);

    this.currentToggle = toggle;
    this.toggleType = type;

    return toggle;
  }

  // Agregar efectos de hover y eventos
  addToggleEffects(toggle, type) {
    const colors = type === 'group'
      ? {
          base: 'linear-gradient(135deg, #1f4e79 0%, #0f3460 100%)',
          hover: 'linear-gradient(135deg, #2564a8 0%, #1f4e79 100%)',
          open: 'linear-gradient(135deg, #4267B2 0%, #365899 100%)',
          openHover: 'linear-gradient(135deg, #5578c7 0%, #4267B2 100%)'
        }
      : {
          base: 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)',
          hover: 'linear-gradient(135deg, #34ce57 0%, #28a745 100%)',
          open: 'linear-gradient(135deg, #4267B2 0%, #365899 100%)',
          openHover: 'linear-gradient(135deg, #5578c7 0%, #4267B2 100%)'
        };

    toggle.addEventListener('mouseenter', function() {
      const isOpen = this.classList.contains('sidebar-open');
      this.style.background = isOpen ? colors.openHover : colors.hover;
      this.style.transform = 'translateY(-50%) translateX(-2px)';
      this.style.boxShadow = '-5px 0 20px rgba(0,0,0,0.3)';
    });

    toggle.addEventListener('mouseleave', function() {
      const isOpen = this.classList.contains('sidebar-open');
      this.style.background = isOpen ? colors.open : colors.base;
      this.style.transform = 'translateY(-50%) translateX(0)';
      this.style.boxShadow = '-3px 0 15px rgba(0,0,0,0.2)';
    });

    toggle.addEventListener('focus', function() {
      this.style.outline = '2px solid #fff';
      this.style.outlineOffset = '2px';
    });

    toggle.addEventListener('blur', function() {
      this.style.outline = 'none';
    });

    // Soporte para teclado
    toggle.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.click();
      }
    });
  }

  // Obtener el toggle actual
  getCurrentToggle() {
    return this.currentToggle;
  }

  // Obtener el tipo actual
  getCurrentType() {
    return this.toggleType;
  }

  // Verificar si hay un toggle activo
  hasActiveToggle() {
    return this.currentToggle !== null;
  }

  // Actualizar estado del toggle
  updateToggleState(isOpen) {
    if (!this.currentToggle) return;

    const colors = this.toggleType === 'group'
      ? {
          base: 'linear-gradient(135deg, #1f4e79 0%, #0f3460 100%)',
          open: 'linear-gradient(135deg, #4267B2 0%, #365899 100%)'
        }
      : {
          base: 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)',
          open: 'linear-gradient(135deg, #4267B2 0%, #365899 100%)'
        };

    if (isOpen) {
      this.currentToggle.classList.remove('sidebar-closed');
      this.currentToggle.classList.add('sidebar-open');
      this.currentToggle.style.right = '320px';
      this.currentToggle.innerHTML = '<span aria-hidden="true">◀</span>';
      this.currentToggle.setAttribute('title', 'Ocultar Lead Manager');
      this.currentToggle.style.background = colors.open;
    } else {
      this.currentToggle.classList.remove('sidebar-open');
      this.currentToggle.classList.add('sidebar-closed');
      this.currentToggle.style.right = '10px';
      this.currentToggle.innerHTML = '<span aria-hidden="true">▶</span>';
      this.currentToggle.setAttribute('title', 'Mostrar Lead Manager');
      this.currentToggle.style.background = colors.base;
    }
  }
}

// Exportar instancia única
window.leadManagerPro = window.leadManagerPro || {};
window.leadManagerPro.unifiedToggleManager = new UnifiedToggleManager();
