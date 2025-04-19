// Módulo para gestionar el sidebar específico para páginas de grupos

class GroupSidebar {
  constructor() {
    this.container = null;
    this.iframe = null;
    this.toggleButton = null;
    this.visible = false;
    this.initializationComplete = false;
    this.interactionSettings = {
      membersToInteract: 10,
      interactionDelay: 2, // en segundos
      message: 'Hola, este es un mensaje de prueba desde la plataforma, has caso omiso ya que solo sirve para pruebas. !Un saludo!',
      autoCloseChat: true
    };

    // Iniciar observación de la URL para detectar páginas de grupos
    this.observeUrlChanges();
  }

  // Inicializar el módulo
  init() {
    console.log('GroupSidebar: Inicializando módulo');

    // Verificar si estamos en una página de grupo
    if (!this.isInGroupPage()) {
      console.log('GroupSidebar: No estamos en una página de grupo, no se inicializa');
      return false;
    }

    // Cargar configuración guardada
    this.loadSavedSettings();

    // Inicialización completada
    this.initializationComplete = true;
    
    return true;
  }

  // Comprobar si estamos en una página de grupo
  isInGroupPage() {
    return window.location.href.includes('/groups/') && 
           !window.location.href.includes('/groups/feed');
  }

  // Cargar la configuración guardada
  loadSavedSettings() {
    try {
      chrome.storage.local.get(['leadManagerGroupSettings'], (result) => {
        if (result && result.leadManagerGroupSettings) {
          this.interactionSettings = {
            ...this.interactionSettings,
            ...result.leadManagerGroupSettings
          };
          console.log('GroupSidebar: Configuración cargada', this.interactionSettings);
        }
      });
    } catch (error) {
      console.error('GroupSidebar: Error al cargar configuración', error);
    }
  }

  // Guardar la configuración
  saveSettings(settings) {
    try {
      this.interactionSettings = {
        ...this.interactionSettings,
        ...settings
      };

      chrome.storage.local.set({
        'leadManagerGroupSettings': this.interactionSettings
      }, () => {
        console.log('GroupSidebar: Configuración guardada', this.interactionSettings);
      });

      return true;
    } catch (error) {
      console.error('GroupSidebar: Error al guardar configuración', error);
      return false;
    }
  }

  // Crear la interfaz del sidebar para grupos
  createSidebar() {
    if (this.container) {
      return this.container;
    }

    // Crear contenedor principal
    const container = document.createElement('div');
    container.className = 'lead-manager-group-sidebar';
    container.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      width: 320px;
      height: 100vh;
      background: white;
      box-shadow: -2px 0 5px rgba(0,0,0,0.2);
      z-index: 9999;
      overflow: auto;
      transition: transform 0.3s ease;
      transform: translateX(100%);
    `;

    // Cabecera
    const header = document.createElement('div');
    header.className = 'lead-manager-group-sidebar-header';
    header.style.cssText = `
      padding: 12px 16px;
      background-color: #4267B2;
      color: white;
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    const title = document.createElement('div');
    title.textContent = 'Lead Manager Pro - Grupo';

    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
      line-height: 1;
    `;
    closeButton.addEventListener('click', () => this.hide());

    header.appendChild(title);
    header.appendChild(closeButton);

    // Cuerpo
    const body = document.createElement('div');
    body.className = 'lead-manager-group-sidebar-body';
    body.style.cssText = `
      padding: 16px;
    `;

    // Estadísticas del grupo
    const statsSection = document.createElement('div');
    statsSection.className = 'lead-manager-group-stats-section';
    statsSection.style.cssText = `
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #ddd;
    `;

    const statsTitle = document.createElement('h3');
    statsTitle.textContent = 'Estadísticas del Grupo';
    statsTitle.style.cssText = `
      margin: 0 0 12px 0;
      font-size: 18px;
      color: #1c1e21;
    `;

    const statsContent = document.createElement('div');
    statsContent.className = 'lead-manager-group-stats-content';
    // Las estadísticas se cargarán dinámicamente

    // Botones de acción principales
    const mainActions = document.createElement('div');
    mainActions.className = 'lead-manager-group-main-actions';
    mainActions.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #ddd;
    `;

    const countMembersButton = document.createElement('button');
    countMembersButton.textContent = '👥 Contar Miembros';
    countMembersButton.className = 'lead-manager-button primary';
    countMembersButton.style.cssText = `
      padding: 10px 16px;
      background-color: #4267B2;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
      width: 100%;
    `;
    countMembersButton.addEventListener('click', () => this.countMembers());

    const interactMembersButton = document.createElement('button');
    interactMembersButton.textContent = '💬 Interactuar con Miembros';
    interactMembersButton.className = 'lead-manager-button secondary';
    interactMembersButton.style.cssText = `
      padding: 10px 16px;
      background-color: #42B72A;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
      width: 100%;
    `;
    interactMembersButton.addEventListener('click', () => this.openInteractionUI());

    mainActions.appendChild(countMembersButton);
    mainActions.appendChild(interactMembersButton);

    // Configuración de interacción
    const interactionConfig = document.createElement('div');
    interactionConfig.className = 'lead-manager-interaction-config';
    interactionConfig.style.cssText = `
      margin-bottom: 20px;
    `;

    const interactionTitle = document.createElement('h3');
    interactionTitle.textContent = 'Configuración de Interacción';
    interactionTitle.style.cssText = `
      margin: 0 0 12px 0;
      font-size: 18px;
      color: #1c1e21;
    `;

    // Número de miembros a interactuar
    const membersCountLabel = document.createElement('label');
    membersCountLabel.textContent = 'Número de miembros a interactuar:';
    membersCountLabel.style.cssText = `
      display: block;
      margin-bottom: 8px;
      font-weight: bold;
    `;

    const membersCountInput = document.createElement('input');
    membersCountInput.type = 'number';
    membersCountInput.min = '1';
    membersCountInput.value = this.interactionSettings.membersToInteract || 10;
    membersCountInput.style.cssText = `
      width: 100%;
      padding: 8px;
      margin-bottom: 16px;
      border-radius: 4px;
      border: 1px solid #ddd;
    `;

    // Tiempo de espera entre interacciones
    const delayLabel = document.createElement('label');
    delayLabel.textContent = 'Tiempo entre interacciones (segundos):';
    delayLabel.style.cssText = `
      display: block;
      margin-bottom: 8px;
      font-weight: bold;
    `;

    const delayInput = document.createElement('input');
    delayInput.type = 'number';
    delayInput.min = '1';
    delayInput.step = '0.5';
    delayInput.value = this.interactionSettings.interactionDelay || 2;
    delayInput.style.cssText = `
      width: 100%;
      padding: 8px;
      margin-bottom: 16px;
      border-radius: 4px;
      border: 1px solid #ddd;
    `;

    // Mensaje a enviar
    const messageLabel = document.createElement('label');
    messageLabel.textContent = 'Mensaje a enviar:';
    messageLabel.style.cssText = `
      display: block;
      margin-bottom: 8px;
      font-weight: bold;
    `;

    const messageTextarea = document.createElement('textarea');
    messageTextarea.value = this.interactionSettings.message || '';
    messageTextarea.style.cssText = `
      width: 100%;
      padding: 8px;
      margin-bottom: 16px;
      border-radius: 4px;
      border: 1px solid #ddd;
      min-height: 80px;
      resize: vertical;
    `;

    // Opción para cerrar chat automáticamente
    const autoCloseLabel = document.createElement('label');
    autoCloseLabel.style.cssText = `
      display: flex;
      align-items: center;
      margin-bottom: 16px;
      cursor: pointer;
    `;

    const autoCloseCheckbox = document.createElement('input');
    autoCloseCheckbox.type = 'checkbox';
    autoCloseCheckbox.checked = this.interactionSettings.autoCloseChat !== false;
    autoCloseCheckbox.style.cssText = `
      margin-right: 8px;
    `;

    const autoCloseText = document.createTextNode('Cerrar chat automáticamente');
    autoCloseLabel.appendChild(autoCloseCheckbox);
    autoCloseLabel.appendChild(autoCloseText);

    // Botón para guardar configuración
    const saveConfigButton = document.createElement('button');
    saveConfigButton.textContent = 'Guardar Configuración';
    saveConfigButton.className = 'lead-manager-button';
    saveConfigButton.style.cssText = `
      padding: 8px 16px;
      background-color: #4267B2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      width: 100%;
    `;

    saveConfigButton.addEventListener('click', () => {
      const settings = {
        membersToInteract: parseInt(membersCountInput.value) || 10,
        interactionDelay: parseFloat(delayInput.value) || 2,
        message: messageTextarea.value,
        autoCloseChat: autoCloseCheckbox.checked
      };

      if (this.saveSettings(settings)) {
        // Mostrar mensaje de éxito
        const successMessage = document.createElement('div');
        successMessage.textContent = '✓ Configuración guardada';
        successMessage.style.cssText = `
          color: #00C851;
          text-align: center;
          margin-top: 8px;
          font-weight: bold;
        `;

        interactionConfig.appendChild(successMessage);
        setTimeout(() => {
          if (interactionConfig.contains(successMessage)) {
            interactionConfig.removeChild(successMessage);
          }
        }, 3000);
      }
    });

    // Estadísticas de interacción
    const interactionStats = document.createElement('div');
    interactionStats.className = 'lead-manager-interaction-stats';
    interactionStats.style.cssText = `
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid #ddd;
    `;

    const interactionStatsTitle = document.createElement('h3');
    interactionStatsTitle.textContent = 'Estadísticas de Interacción';
    interactionStatsTitle.style.cssText = `
      margin: 0 0 12px 0;
      font-size: 18px;
      color: #1c1e21;
    `;

    const interactionsCount = document.createElement('div');
    interactionsCount.id = 'lmp-interactions-count';
    interactionsCount.textContent = '0';
    interactionsCount.style.cssText = `
      font-size: 24px;
      font-weight: bold;
      text-align: center;
      color: #4267B2;
      margin-bottom: 8px;
    `;

    const interactionsLabel = document.createElement('div');
    interactionsLabel.textContent = 'mensajes enviados en total';
    interactionsLabel.style.cssText = `
      text-align: center;
      color: #65676B;
    `;

    // Ensamblar los componentes
    statsSection.appendChild(statsTitle);
    statsSection.appendChild(statsContent);

    interactionConfig.appendChild(interactionTitle);
    interactionConfig.appendChild(membersCountLabel);
    interactionConfig.appendChild(membersCountInput);
    interactionConfig.appendChild(delayLabel);
    interactionConfig.appendChild(delayInput);
    interactionConfig.appendChild(messageLabel);
    interactionConfig.appendChild(messageTextarea);
    interactionConfig.appendChild(autoCloseLabel);
    interactionConfig.appendChild(saveConfigButton);

    interactionStats.appendChild(interactionStatsTitle);
    interactionStats.appendChild(interactionsCount);
    interactionStats.appendChild(interactionsLabel);

    body.appendChild(statsSection);
    body.appendChild(mainActions);
    body.appendChild(interactionConfig);
    body.appendChild(interactionStats);

    container.appendChild(header);
    container.appendChild(body);

    // Botón para mostrar/ocultar el sidebar
    const toggleButton = document.createElement('div');
    toggleButton.className = 'lead-manager-group-sidebar-toggle';
    toggleButton.style.cssText = `
      position: fixed;
      top: 80px;
      right: 0;
      background-color: #4267B2;
      color: white;
      width: 30px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: 5px 0 0 5px;
      font-size: 18px;
      box-shadow: -2px 0 5px rgba(0,0,0,0.2);
      z-index: 9998;
      transition: all 0.3s ease;
    `;
    toggleButton.innerHTML = '◄';
    toggleButton.title = 'Mostrar configuración de grupo';

    toggleButton.addEventListener('click', () => {
      if (this.visible) {
        this.hide();
      } else {
        this.show();
      }
    });

    // Guardar referencias
    this.container = container;
    this.toggleButton = toggleButton;

    // Agregar al DOM
    document.body.appendChild(container);
    document.body.appendChild(toggleButton);

    // Cargar estadísticas iniciales
    this.loadInteractionStats();

    return container;
  }

  // Mostrar el sidebar
  show() {
    if (!this.container) {
      this.createSidebar();
    }

    this.container.style.transform = 'translateX(0)';
    this.toggleButton.style.right = '320px';
    this.toggleButton.innerHTML = '►';
    this.toggleButton.title = 'Ocultar configuración de grupo';
    this.visible = true;

    // Actualizar estadísticas
    this.loadInteractionStats();
    this.loadGroupStats();
  }

  // Ocultar el sidebar
  hide() {
    if (this.container) {
      this.container.style.transform = 'translateX(100%)';
      this.toggleButton.style.right = '0';
      this.toggleButton.innerHTML = '◄';
      this.toggleButton.title = 'Mostrar configuración de grupo';
      this.visible = false;
    }
  }

  // Cargar estadísticas de interacción
  loadInteractionStats() {
    try {
      chrome.storage.local.get(['leadManagerInteractionStats'], (result) => {
        if (result && result.leadManagerInteractionStats) {
          const stats = result.leadManagerInteractionStats;
          const counter = document.getElementById('lmp-interactions-count');
          if (counter) {
            counter.textContent = stats.totalInteractions || 0;
          }
        }
      });
    } catch (error) {
      console.error('GroupSidebar: Error al cargar estadísticas de interacción', error);
    }
  }

  // Cargar estadísticas del grupo actual
  loadGroupStats() {
    if (!this.isInGroupPage() || !this.container) return;

    const statsContent = this.container.querySelector('.lead-manager-group-stats-content');
    if (!statsContent) return;

    // Limpiar contenido anterior
    statsContent.innerHTML = '<div style="text-align: center; padding: 10px;">Cargando información del grupo...</div>';

    try {
      // Extraer información del grupo usando MemberInteraction
      if (window.leadManagerPro && window.leadManagerPro.memberInteraction) {
        const groupInfo = window.leadManagerPro.memberInteraction.extractCurrentGroupInfo();
        
        if (groupInfo) {
          // Formato para mostrar estadísticas
          statsContent.innerHTML = `
            <div style="margin-bottom: 10px">
              <strong>Nombre:</strong> ${groupInfo.name || 'No disponible'}
            </div>
            <div style="margin-bottom: 10px">
              <strong>Tipo:</strong> ${groupInfo.type === 'private' ? 'Privado' : 'Público'}
            </div>
            <div style="margin-bottom: 10px">
              <strong>Miembros:</strong> ${groupInfo.members ? groupInfo.members.toLocaleString() : 'No disponible'}
            </div>
            <div style="margin-bottom: 10px">
              <strong>URL:</strong> <a href="${groupInfo.url}" target="_blank" style="color: #4267B2; text-decoration: none;">${groupInfo.url.length > 30 ? groupInfo.url.substring(0, 30) + '...' : groupInfo.url}</a>
            </div>
          `;
        } else {
          statsContent.innerHTML = '<div style="text-align: center; padding: 10px;">No se pudo extraer información del grupo</div>';
        }
      } else {
        statsContent.innerHTML = '<div style="text-align: center; padding: 10px;">Herramienta de extracción no disponible</div>';
      }
    } catch (error) {
      console.error('GroupSidebar: Error al cargar estadísticas del grupo', error);
      statsContent.innerHTML = '<div style="text-align: center; padding: 10px; color: red;">Error al cargar datos</div>';
    }
  }

  // Método para contar miembros
  countMembers() {
    // Verificar si estamos en una página de grupo
    if (!this.isInGroupPage()) {
      alert('Debes estar en una página de grupo para contar miembros');
      return;
    }

    // Verificar si tenemos la funcionalidad de contar miembros
    if (window.leadManagerPro && window.leadManagerPro.groupMemberFinder) {
      if (window.location.href.includes('/members')) {
        // Ya estamos en la página de miembros, iniciar conteo
        window.leadManagerPro.groupMemberFinder.startCountingMembers();
      } else {
        // Redirigir a la página de miembros
        const baseUrl = window.location.href.endsWith('/') ? window.location.href : window.location.href + '/';
        window.location.href = baseUrl + 'members';
      }
    } else {
      alert('La funcionalidad de contar miembros no está disponible');
    }
  }

  // Método para abrir la interfaz de interacción
  openInteractionUI() {
    // Verificar si estamos en una página de grupo
    if (!this.isInGroupPage()) {
      alert('Debes estar en una página de grupo para interactuar con miembros');
      return;
    }

    // Verificar si tenemos la funcionalidad de interacción
    if (window.leadManagerPro && window.leadManagerPro.memberInteractionUI) {
      // Ocultar el sidebar de grupo
      this.hide();
      
      // Mostrar la interfaz de interacción
      window.leadManagerPro.memberInteractionUI.show();
    } else {
      alert('La funcionalidad de interacción no está disponible');
    }
  }

  // Observar cambios en la URL
  observeUrlChanges() {
    let lastUrl = location.href;
    
    // Crear un MutationObserver para detectar cambios en el DOM (que pueden indicar cambios de navegación)
    const observer = new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        this.onUrlChange();
      }
    });
    
    // Iniciar observación
    observer.observe(document, { subtree: true, childList: true });
    
    // También escuchar el evento popstate
    window.addEventListener('popstate', () => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        this.onUrlChange();
      }
    });
  }

  // Manejar cambios de URL
  onUrlChange() {
    // Si estamos en una página de grupo, mostrar el sidebar
    if (this.isInGroupPage()) {
      // Si no está inicializado, inicializar
      if (!this.initializationComplete) {
        this.init();
      }
      
      // Si no existe el sidebar, crearlo
      if (!this.container) {
        this.createSidebar();
      } else {
        // Asegurar que sea visible en la UI
        this.toggleButton.style.display = 'flex';
      }
    } else {
      // Si no estamos en una página de grupo y el sidebar existe, ocultarlo
      if (this.container) {
        this.hide();
        this.toggleButton.style.display = 'none';
      }
    }
  }
}

// Exportar la clase
window.leadManagerPro = window.leadManagerPro || {};
window.leadManagerPro.groupSidebar = new GroupSidebar();
