// Controlador para el sidebar de interacción en páginas de grupos

class GroupInteractionController {
  constructor() {
    this.sidebar = null;
    this.toolsButton = null;
    this.countMembersButton = null;
    this.interactButton = null;
    this.isInitialized = false;
    this.isInGroupPage = false;
    this.observer = null;
  }
  
  init() {
    // Verificar si estamos en una página de grupo
    this.isInGroupPage = window.location.href.includes('/groups/');
    
    if (!this.isInGroupPage) {
      console.log('GroupInteractionController: No estamos en una página de grupo, no se inicializa');
      return this;
    }
    
    // Inicializar el sidebar
    this.sidebar = window.leadManagerPro.memberInteractionSidebar;
    if (!this.sidebar) {
      this.sidebar = new MemberInteractionSidebar();
      window.leadManagerPro.memberInteractionSidebar = this.sidebar;
    }
    
    this.sidebar.init();
    
    // Configurar observer para detectar cambios en la DOM
    this.setupObserver();
    
    // Intentar inyectar botones inicialmente
    this.injectButtons();
    
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
      // Verificar si es necesario inyectar botones nuevamente
      if (!this.toolsButton || !document.body.contains(this.toolsButton)) {
        this.injectButtons();
      }
    });
    
    // Iniciar la observación
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  injectButtons() {
    // Si ya se han inyectado los botones, no hacer nada
    if (this.toolsButton && document.body.contains(this.toolsButton)) {
      return;
    }
    
    // Buscar la barra de navegación de Facebook
    const navBar = document.querySelector('[role="navigation"]');
    if (!navBar) {
      console.log('GroupInteractionController: No se encontró la barra de navegación');
      return;
    }
    
    // Crear contenedor para botones
    const toolsContainer = document.createElement('div');
    toolsContainer.className = 'lead-manager-group-tools';
    toolsContainer.style.cssText = `
      position: fixed;
      top: 70px;
      right: 20px;
      z-index: 999;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    
    // Crear botón para herramientas de grupo
    this.toolsButton = document.createElement('button');
    this.toolsButton.className = 'lead-manager-group-tools-btn';
    this.toolsButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </svg>
    `;
    this.toolsButton.title = 'Herramientas de interacción con miembros';
    this.toolsButton.style.cssText = `
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
    this.toolsButton.addEventListener('mouseover', () => {
      this.toolsButton.style.backgroundColor = '#166fe5';
    });
    this.toolsButton.addEventListener('mouseout', () => {
      this.toolsButton.style.backgroundColor = '#1877f2';
    });
    this.toolsButton.addEventListener('click', () => {
      this.toggleDropdown();
    });
    
    // Agregar el botón al contenedor
    toolsContainer.appendChild(this.toolsButton);
    
    // Crear menú desplegable
    const dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'lead-manager-group-tools-dropdown';
    dropdownMenu.style.cssText = `
      position: absolute;
      top: 50px;
      right: 0;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
      display: none;
      overflow: hidden;
      width: 220px;
    `;
    
    // Crear botón para contar miembros
    this.countMembersButton = document.createElement('button');
    this.countMembersButton.className = 'lead-manager-group-tool-item';
    this.countMembersButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877f2">
        <path d="M9 13.75c-2.34 0-7 1.17-7 3.5V19h14v-1.75c0-2.33-4.66-3.5-7-3.5zM4.34 17c.84-.58 2.87-1.25 4.66-1.25s3.82.67 4.66 1.25H4.34zM9 12c1.93 0 3.5-1.57 3.5-3.5S10.93 5 9 5 5.5 6.57 5.5 8.5 7.07 12 9 12zm0-5c.83 0 1.5.67 1.5 1.5S9.83 10 9 10s-1.5-.67-1.5-1.5S8.17 7 9 7zm7.04 6.81c1.16.84 1.96 1.96 1.96 3.44V19h4v-1.75c0-2.02-3.5-3.17-5.96-3.44zM15 12c1.93 0 3.5-1.57 3.5-3.5S16.93 5 15 5c-.54 0-1.04.13-1.5.35.63.89 1 1.98 1 3.15s-.37 2.26-1 3.15c.46.22.96.35 1.5.35z"/>
      </svg>
      <span>Contar miembros</span>
    `;
    this.countMembersButton.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 12px 16px;
      border: none;
      background-color: transparent;
      text-align: left;
      cursor: pointer;
      transition: background-color 0.2s;
    `;
    this.countMembersButton.addEventListener('mouseover', () => {
      this.countMembersButton.style.backgroundColor = '#f0f2f5';
    });
    this.countMembersButton.addEventListener('mouseout', () => {
      this.countMembersButton.style.backgroundColor = 'transparent';
    });
    this.countMembersButton.addEventListener('click', () => {
      this.countMembers();
      this.hideDropdown();
    });
    
    // Crear botón para interactuar con miembros
    this.interactButton = document.createElement('button');
    this.interactButton.className = 'lead-manager-group-tool-item';
    this.interactButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877f2">
        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
      </svg>
      <span>Interactuar con miembros</span>
    `;
    this.interactButton.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 12px 16px;
      border: none;
      background-color: transparent;
      text-align: left;
      cursor: pointer;
      transition: background-color 0.2s;
    `;
    this.interactButton.addEventListener('mouseover', () => {
      this.interactButton.style.backgroundColor = '#f0f2f5';
    });
    this.interactButton.addEventListener('mouseout', () => {
      this.interactButton.style.backgroundColor = 'transparent';
    });
    this.interactButton.addEventListener('click', () => {
      this.interactWithMembers();
      this.hideDropdown();
    });
    
    // Agregar los botones al menú desplegable
    dropdownMenu.appendChild(this.countMembersButton);
    dropdownMenu.appendChild(this.interactButton);
    
    // Agregar el menú desplegable al contenedor
    toolsContainer.appendChild(dropdownMenu);
    
    // Agregar el contenedor a la página
    document.body.appendChild(toolsContainer);
    
    // Cerrar el menú al hacer clic fuera
    document.addEventListener('click', (event) => {
      if (!toolsContainer.contains(event.target)) {
        this.hideDropdown();
      }
    });
    
    console.log('GroupInteractionController: Botones inyectados correctamente');
  }
  
  toggleDropdown() {
    const dropdown = document.querySelector('.lead-manager-group-tools-dropdown');
    if (dropdown) {
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
  }
  
  hideDropdown() {
    const dropdown = document.querySelector('.lead-manager-group-tools-dropdown');
    if (dropdown) {
      dropdown.style.display = 'none';
    }
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
    
    // Mostrar el sidebar
    if (this.sidebar) {
      this.sidebar.show();
    }
  }
}

// Exportar la clase
window.leadManagerPro = window.leadManagerPro || {};
window.leadManagerPro.groupInteractionController = new GroupInteractionController();
