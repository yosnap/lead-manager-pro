// Controlador para el sidebar de interacción en páginas de grupos

class GroupInteractionController {
  constructor() {
    this.sidebar = null;
    this.isInitialized = false;
    this.isInGroupPage = false;
    this.observer = null;
    this.countMembersButton = null;
    this.interactButton = null;
    this.containerWrapper = null;
  }
  
  init() {
    // Verificar si estamos en una página de grupo
    this.isInGroupPage = window.location.href.includes('/groups/');
    
    if (!this.isInGroupPage) {
      console.log('GroupInteractionController: No estamos en una página de grupo, no se inicializa');
      return this;
    }
    
    // Inicializar el sidebar con manejo de errores
    try {
      // Buscar la instancia existente
      this.sidebar = window.leadManagerPro.memberInteractionSidebar;
      
      // Si no existe, intentar crearla
      if (!this.sidebar) {
        // Verificar si existe la clase MemberInteractionSidebar
        if (typeof window.leadManagerPro.MemberInteractionSidebar === 'function') {
          console.log('GroupInteractionController: Creando nueva instancia de MemberInteractionSidebar');
          this.sidebar = new window.leadManagerPro.MemberInteractionSidebar();
          window.leadManagerPro.memberInteractionSidebar = this.sidebar;
        } else {
          console.error('GroupInteractionController: La clase MemberInteractionSidebar no está definida');
          this.sidebar = {
            init: function() { console.log('Dummy sidebar init'); return this; },
            show: function() { console.log('Dummy sidebar show'); },
            hide: function() { console.log('Dummy sidebar hide'); }
          };
        }
      }
      
      // Inicializar el sidebar si tiene método init
      if (typeof this.sidebar.init === 'function') {
        this.sidebar.init();
      } else {
        console.warn('GroupInteractionController: El objeto sidebar no tiene un método init');
      }
    } catch (error) {
      console.error('GroupInteractionController: Error al inicializar el sidebar:', error);
      // Crear un objeto dummy para evitar errores
      this.sidebar = {
        show: function() { console.log('Dummy sidebar show after error'); },
        hide: function() { console.log('Dummy sidebar hide after error'); }
      };
    }
    
    // Configurar observer para detectar cambios en la DOM
    this.setupObserver();
    
    // Crear los botones flotantes
    this.createFloatingButtons();
    
    this.isInitialized = true;
    console.log('GroupInteractionController: Inicializado correctamente');
    
    return this;
  }
  
  setupObserver() {
    // Desconectar el observer anterior si existe
    if (this.observer) {
      this.observer.disconnect();
    }
    
    // Crear un nuevo observer para detectar cambios en la DOM
    this.observer = new MutationObserver((mutations) => {
      // Si los botones se han desconectado del DOM, volver a crearlos
      if (!this.containerWrapper || !document.body.contains(this.containerWrapper)) {
        this.createFloatingButtons();
      }
    });
    
    // Iniciar la observación
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  createFloatingButtons() {
    // Eliminar el contenedor anterior si existe
    if (this.containerWrapper && document.body.contains(this.containerWrapper)) {
      document.body.removeChild(this.containerWrapper);
    }
    
    // Eliminar cualquier contenedor antiguo con la clase lead-manager-group-tools
    const oldToolsContainer = document.querySelector('.lead-manager-group-tools');
    if (oldToolsContainer) {
      oldToolsContainer.parentNode.removeChild(oldToolsContainer);
      console.log('GroupInteractionController: Se eliminó el contenedor de herramientas obsoleto');
    }
    
    // Crear contenedor para el botón en la parte superior derecha
    this.containerWrapper = document.createElement('div');
    this.containerWrapper.className = 'lead-manager-buttons-top-right';
    this.containerWrapper.style.cssText = `
      position: fixed;
      top: 70px;
      right: 20px;
      z-index: 999;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    
    // Crear botón para interactuar con miembros
    this.interactButton = document.createElement('button');
    this.interactButton.id = 'lead-manager-member-interaction-button';
    this.interactButton.className = 'lead-manager-floating-button';
    this.interactButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
      </svg>
    `;
    this.interactButton.title = 'Interactuar con miembros del grupo';
    this.interactButton.style.cssText = `
      background-color: #1877f2;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      transition: background-color 0.2s;
    `;
    
    // Agregar eventos al botón de interacción
    this.interactButton.addEventListener('mouseover', () => {
      this.interactButton.style.backgroundColor = '#166fe5';
    });
    
    this.interactButton.addEventListener('mouseout', () => {
      this.interactButton.style.backgroundColor = '#1877f2';
    });
    
    this.interactButton.addEventListener('click', () => {
      this.interactWithMembers();
    });
    
    // Agregar el botón al contenedor
    this.containerWrapper.appendChild(this.interactButton);
    
    // Agregar el contenedor a la página
    document.body.appendChild(this.containerWrapper);
    
    console.log('GroupInteractionController: Botón creado en la parte superior derecha');
  }
  
  countMembers() {
    console.log('GroupInteractionController: Contando miembros...');
    
    // Esta funcionalidad se implementará en una futura versión
    // Por ahora, mostrar un mensaje al usuario
    alert('La funcionalidad para contar miembros estará disponible próximamente');
  }
  
  interactWithMembers() {
    console.log('GroupInteractionController: Interactuando con miembros...');
    
    // Verificar si estamos en una página de grupo
    if (!this.isInGroupPage) {
      alert('Esta funcionalidad solo está disponible en páginas de grupos de Facebook');
      return;
    }
    
    // Mostrar el panel flotante con manejo de errores
    try {
      if (window.leadManagerPro.memberInteractionUI && typeof window.leadManagerPro.memberInteractionUI.show === 'function') {
        window.leadManagerPro.memberInteractionUI.show();
      } else {
        console.error('GroupInteractionController: No se pudo mostrar el panel flotante (función show no disponible)');
        alert('Error al mostrar el panel de interacción. Por favor, recarga la página e intenta nuevamente.');
      }
    } catch (error) {
      console.error('GroupInteractionController: Error al mostrar el panel flotante:', error);
      alert('Error al mostrar el panel de interacción. Por favor, recarga la página e intenta nuevamente.');
    }
  }
}

// Exportar la clase
window.leadManagerPro = window.leadManagerPro || {};
window.leadManagerPro.groupInteractionController = new GroupInteractionController();
