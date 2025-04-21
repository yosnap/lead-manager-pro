// Módulo para la interfaz de usuario de interacción con miembros

class MemberInteractionUI {
  constructor() {
    this.container = null;
    this.memberInteraction = null;
    this.statusText = null;
    this.progressBar = null;
    this.startButton = null;
    this.stopButton = null;
    this.memberSelector = null;
    this.isInteracting = false;
    this.lastHighlightedSection = null; // Para mantener referencia de la última sección resaltada
    this.isVisible = false;
    this.sidebarHidden = false;
    this.icons = {
      play: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z"/>
      </svg>`,
      pause: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
      </svg>`
    };
    
    // Selectores actualizados para identificar elementos en Facebook
    this.selectors = {
      sections: {
        admins: {
          // Selectores más generales para mayor compatibilidad
          container: 'div[role="main"] > div > div > div > div',
          title: 'h2, h3',
          titleText: "Administradores y moderadores",
          userList: 'div[role="list"]',
          userItem: 'div[role="listitem"]',
          userLink: 'a[role="link"]'
        },
        common: {
          container: 'div[role="main"] > div > div > div > div',
          title: 'h2, h3',
          titleText: "Miembros con cosas en común",
          userList: 'div[role="list"]',
          userItem: 'div[role="listitem"]',
          userLink: 'a[role="link"]'
        },
        newMembers: {
          container: 'div[role="main"] > div > div > div > div',
          title: 'h2, h3',
          titleText: "Nuevos miembros del grupo",
          userList: 'div[role="list"]',
          userItem: 'div[role="listitem"]',
          userLink: 'a[role="link"]'
        },
        // Sección adicional para abarcar todas las listas de miembros
        allMembers: {
          container: 'div[role="main"] > div > div > div > div',
          title: 'h2, h3',
          titleText: "Miembros",
          userList: 'div[role="list"]',
          userItem: 'div[role="listitem"]',
          userLink: 'a[role="link"]'
        }
      },
      navigation: {
        peopleTab: 'a[href*="/members"][role="link"]',
        activeTab: '[role="tab"][aria-selected="true"]'
      },
      // Selectores alternativos como respaldo
      alternativeSelectors: {
        userContainer: '.x1i10hfl, .x1qjc9v5, .xjbqb8w, .xjqpnuy, .xa49m3k, .xqeqjp1, .x2hbi6w, .x13fuv20, .xu3j5b3, .x1q0q8m5, .x26u7qi, .x972fbf, .xcfux6l, .x1qhh985, .xm0m39n, .x9f619, .x78zum5, .xdt5ytf, .x2lah0s, .xdj266r, .x11i5rnm, .xat24cr, .x1mh8g0r, .x889kno, .x1h6gzvc, .x1vd4hk0, .x12ulyr2',
        userLink: 'a[href*="/user/"]',
        userItem: 'div.x1n2onr6'
      }
    };
    
    // Inicializar memberInteraction
    this.memberInteraction = window.leadManagerPro.memberInteraction || new MemberInteraction();
    window.leadManagerPro.memberInteraction = this.memberInteraction;
    
    // Cargar configuración inicial
    this.loadInitialConfig();
    
    // Verificar inmediatamente si estamos en una página de grupo
    this.checkAndHideSidebar();
    
    this.init();
  }

  async loadInitialConfig() {
    try {
      const config = await this.getStoredConfig();
      console.log('Configuración inicial cargada:', config);
      
      // Actualizar el mensaje en memberInteraction
      if (this.memberInteraction) {
        this.memberInteraction.messageToSend = config.messageToSend;
        this.memberInteraction.autoCloseChat = config.autoCloseChat;
        this.memberInteraction.maxMembersToInteract = config.maxMembers;
        console.log('Mensaje inicial configurado:', this.memberInteraction.messageToSend);
      }
    } catch (error) {
      console.error('Error al cargar configuración inicial:', error);
    }
  }

  // Nueva función para verificar y ocultar el sidebar
  checkAndHideSidebar() {
    // Si no estamos en una página de grupo, no hacer nada
    if (!window.location.href.includes('/groups/')) {
      return;
    }

    // Intentar ocultar el sidebar
    this.hideSidebar();

    // Crear un observer específico para el sidebar
    const sidebarObserver = new MutationObserver((mutations, observer) => {
      const sidebar = document.querySelector('.sidebar-container');
      if (sidebar) {
        console.log('MemberInteractionUI: Sidebar encontrado y ocultado');
        sidebar.style.display = 'none';
        this.sidebarHidden = true;
        // Una vez que encontramos y ocultamos el sidebar, podemos detener este observer
        observer.disconnect();
      }
    });

    // Observar el documento completo para detectar cuando se agrega el sidebar
    sidebarObserver.observe(document, {
      childList: true,
      subtree: true
    });
  }

  // Modificar la función hideSidebar para ser más agresiva
  hideSidebar() {
    const sidebar = document.querySelector('.sidebar-container');
    if (sidebar) {
      console.log('MemberInteractionUI: Ocultando sidebar');
      sidebar.style.display = 'none';
      this.sidebarHidden = true;
    }
  }

  // Modificar init para incluir la verificación del sidebar
  init() {
    // Verificar si estamos en una página de grupo
    const inGroupPage = window.location.href.includes('/groups/') && !window.location.href.includes('/feed');
    
    // Limpiar botones existentes
    this.cleanupButtons();
    
    if (!inGroupPage) {
      this.hideInterface();
      return;
    }

    // Intentar añadir botones inicialmente
    this.tryAddPlayButtons();

    // Configurar un observer más específico para las secciones de miembros
    this.observeDOM();
    
    // También programar verificaciones periódicas porque Facebook a veces carga dinámicamente
    // sin disparar events de mutación detectables
    this.schedulePeriodicCheck();
  }
  
  observeDOM() {
    // Observer para todo el documento con opciones específicas para mejor rendimiento
    const mainObserver = new MutationObserver((mutations) => {
      let shouldCheck = false;
      
      // Solo revisamos si hubo cambios relevantes
      for (const mutation of mutations) {
        // Si se añadieron nodos
        if (mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1) { // Elemento DOM
              // Verificar si contiene encabezados o listas
              if (node.querySelector && (
                  node.querySelector('h1, h2, h3, h4') || 
                  node.querySelector('[role="list"]')
                )) {
                shouldCheck = true;
                break;
              }
            }
          }
        }
        
        // Si se modificaron atributos en elementos que podrían ser secciones
        if (mutation.type === 'attributes' && mutation.target.nodeType === 1) {
          const target = mutation.target;
          if (target.querySelector && (
              target.querySelector('h1, h2, h3, h4') || 
              target.querySelector('[role="list"]')
            )) {
            shouldCheck = true;
            break;
          }
        }
        
        if (shouldCheck) break;
      }
      
      // Si detectamos cambios relevantes, intentamos añadir los botones
      if (shouldCheck) {
        console.log('Cambios relevantes en el DOM detectados, verificando botones Play');
        this.tryAddPlayButtons();
      }
    });
    
    // Observar todo el documento, pero solo para cambios en la estructura y atributos
    mainObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['role', 'class'] // Solo observar cambios en estos atributos
    });
    
    console.log('Observer DOM configurado para detectar cambios en secciones de miembros');
  }
  
  schedulePeriodicCheck() {
    // Verificar cada 5 segundos por si acaso
    this.periodicCheckInterval = setInterval(() => {
      if (document.querySelector('h2, h3') && !document.querySelector('.lmp-play-button')) {
        console.log('Verificación periódica: intentando añadir botones Play');
        this.tryAddPlayButtons();
      }
    }, 5000);
    
    console.log('Verificación periódica configurada para botones Play');
  }

  cleanupButtons() {
    const existingButtons = document.querySelectorAll('.lmp-play-button');
    existingButtons.forEach(button => button.remove());
  }

  hideInterface() {
    const existingButtons = document.querySelectorAll('.lmp-play-button');
    existingButtons.forEach(button => button.style.display = 'none');
  }

  // Crear la interfaz de usuario
  createUI() {
    // Crear contenedor principal
    const container = document.createElement('div');
    container.className = 'lead-manager-interaction-ui';
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 350px;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      z-index: 9999;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;
    
    // Cabecera
    const header = document.createElement('div');
    header.className = 'lead-manager-interaction-header';
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
    title.textContent = 'Interacción con Miembros';
    
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
    `;
    closeButton.addEventListener('click', () => this.hide());
    
    header.appendChild(title);
    header.appendChild(closeButton);
    
    // Cuerpo
    const body = document.createElement('div');
    body.className = 'lead-manager-interaction-body';
    body.style.cssText = `
      padding: 16px;
    `;
    
    // Descripción
    const description = document.createElement('div');
    description.textContent = 'Esta herramienta te permite interactuar con miembros del grupo de Facebook, haciendo hover sobre cada uno y abriendo una ventana de mensaje después de un tiempo de espera.';
    description.style.marginBottom = '16px';
    
    // Selector de miembros
    const memberSelectorLabel = document.createElement('div');
    memberSelectorLabel.textContent = 'Selecciona el tipo de miembros:';
    memberSelectorLabel.style.fontWeight = 'bold';
    memberSelectorLabel.style.marginBottom = '8px';
    
    const memberSelector = document.createElement('select');
    memberSelector.style.width = '100%';
    memberSelector.style.padding = '8px';
    memberSelector.style.marginBottom = '16px';
    memberSelector.style.borderRadius = '4px';
    memberSelector.style.border = '1px solid #CED0D4';
    
    // Guardamos la referencia
    this.memberSelector = memberSelector;
    
    // Añadimos el evento change para el selector de miembros
    memberSelector.addEventListener('change', async (e) => {
      const selectedType = e.target.value;
      console.log('Tipo seleccionado:', selectedType);
      
      try {
        // Si no estamos en la sección de Personas, navegar primero
        if (!this.isInPeopleSection()) {
          await this.navigateToPeopleSection();
          return;
        }

        // Remover highlight anterior
        this.removeHighlight();
        
        // Mapear el valor del selector al título de sección correspondiente
        let sectionTitle = '';
        let sectionType = '';
        
        switch(selectedType) {
          case 'admins':
            sectionTitle = 'Administradores y moderadores';
            sectionType = 'admins';
            break;
          case 'common':
            sectionTitle = 'Miembros con cosas en común';
            sectionType = 'common';
            break;
          case 'new':
            sectionTitle = 'Nuevos miembros del grupo';
            sectionType = 'newMembers';
            break;
          case 'active':
            sectionTitle = 'colaboradores del grupo';
            sectionType = 'collaborators';
            break;
          case 'all':
          default:
            sectionTitle = 'Miembros';
            sectionType = 'allMembers';
            break;
        }
        
        console.log('Buscando sección:', sectionTitle);
        
        // Buscar el encabezado de la sección
        const headings = document.querySelectorAll('h1, h2, h3, h4');
        let targetHeading = null;
        let targetSection = null;
        
        for (const heading of headings) {
          if (heading.textContent.toLowerCase().includes(sectionTitle.toLowerCase())) {
            targetHeading = heading;
            console.log('Encabezado encontrado:', heading.textContent);
            break;
          }
        }
        
        if (targetHeading) {
          // Buscar el contenedor de la sección (subir hasta encontrar un contenedor grande)
          let container = targetHeading;
          for (let i = 0; i < 5; i++) {
            container = container.parentElement;
            if (!container) break;
            
            // Verificar si el contenedor tiene una lista de miembros
            if (container.querySelector('[role="list"]')) {
              targetSection = container;
              break;
            }
          }
          
          // Si encontramos una sección, resaltarla
          if (targetSection) {
            // Aplicar highlight a la sección encontrada
            targetSection.style.backgroundColor = 'rgba(24, 119, 242, 0.1)';
            targetSection.style.padding = '12px';
            targetSection.style.borderRadius = '8px';
            targetSection.style.transition = 'background-color 0.3s ease';
            
            // Guardar referencia a la sección resaltada
            this.lastHighlightedSection = targetSection;
            
            // Hacer scroll a la sección
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Actualizar el botón play correspondiente
            const playButton = targetSection.querySelector('.lmp-play-button');
            if (playButton) {
              playButton.style.backgroundColor = '#1b74e4';
              playButton.style.boxShadow = '0 0 0 3px rgba(24, 119, 242, 0.3)';
            }
            
            console.log('Sección resaltada correctamente');
          } else {
            console.log('No se encontró el contenedor de la sección');
          }
        } else {
          console.log('No se encontró la sección:', sectionTitle);
        }
      } catch (error) {
        console.error('Error al cambiar selección:', error);
        e.target.value = '';
      }
    });
    
    // Opciones para el selector
    const allMembersOption = document.createElement('option');
    allMembersOption.value = 'all';
    allMembersOption.textContent = 'Todos los miembros';
    
    const activeMembersOption = document.createElement('option');
    activeMembersOption.value = 'active';
    activeMembersOption.textContent = 'Miembros activos';
    
    const commonMembersOption = document.createElement('option');
    commonMembersOption.value = 'common';
    commonMembersOption.textContent = 'Miembros con cosas en común';
    
    const newMembersOption = document.createElement('option');
    newMembersOption.value = 'new';
    newMembersOption.textContent = 'Nuevos miembros del grupo';
    
    const adminMembersOption = document.createElement('option');
    adminMembersOption.value = 'admins'; // Cambiado de 'admin' a 'admins'
    adminMembersOption.textContent = 'Administradores';
    
    memberSelector.appendChild(allMembersOption);
    memberSelector.appendChild(activeMembersOption);
    memberSelector.appendChild(commonMembersOption);
    memberSelector.appendChild(newMembersOption);
    memberSelector.appendChild(adminMembersOption);
    
    // Mensaje personalizado
    const messageLabel = document.createElement('div');
    messageLabel.textContent = 'Mensaje personalizado:';
    messageLabel.style.fontWeight = 'bold';
    messageLabel.style.marginBottom = '8px';
    
    const messageTextarea = document.createElement('textarea');
    messageTextarea.value = 'Hola, este es un mensaje de prueba desde la plataforma, has caso omiso ya que solo sirve para pruebas. !Un saludo!';
    messageTextarea.style.width = '100%';
    messageTextarea.style.padding = '8px';
    messageTextarea.style.marginBottom = '16px';
    messageTextarea.style.borderRadius = '4px';
    messageTextarea.style.border = '1px solid #CED0D4';
    messageTextarea.style.minHeight = '80px';
    messageTextarea.style.resize = 'vertical';
    
    // Tiempo de espera
    const delayLabel = document.createElement('div');
    delayLabel.textContent = 'Tiempo de espera entre interacciones (segundos):';
    delayLabel.style.fontWeight = 'bold';
    delayLabel.style.marginBottom = '8px';
    
    const delayInput = document.createElement('input');
    delayInput.type = 'number';
    delayInput.min = '1';
    delayInput.step = '0.5';
    delayInput.value = '2';
    delayInput.style.width = '100%';
    delayInput.style.padding = '8px';
    delayInput.style.marginBottom = '16px';
    delayInput.style.borderRadius = '4px';
    delayInput.style.border = '1px solid #CED0D4';
    
    // Barra de progreso
    const progressContainer = document.createElement('div');
    progressContainer.style.marginBottom = '16px';
    
    const progressBar = document.createElement('div');
    progressBar.className = 'lead-manager-interaction-progress-bar';
    progressBar.style.cssText = `
      height: 6px;
      background-color: #EBEDF0;
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 8px;
    `;
    
    const progressFill = document.createElement('div');
    progressFill.className = 'lead-manager-interaction-progress-fill';
    progressFill.style.cssText = `
      height: 100%;
      width: 0%;
      background-color: #4267B2;
      transition: width 0.3s ease;
    `;
    
    progressBar.appendChild(progressFill);
    this.progressBar = progressBar;
    
    // Texto de estado
    const statusText = document.createElement('div');
    statusText.className = 'lead-manager-interaction-status';
    statusText.textContent = 'Listo para iniciar interacción con miembros.';
    statusText.style.fontSize = '14px';
    this.statusText = statusText;
    
    progressContainer.appendChild(progressBar);
    progressContainer.appendChild(statusText);
    
    // Botones de acción
    const actionContainer = document.createElement('div');
    actionContainer.className = 'lead-manager-interaction-actions';
    actionContainer.style.cssText = `
      display: flex;
      justify-content: space-between;
      gap: 8px;
    `;
    
    const startButton = document.createElement('button');
    startButton.textContent = 'Iniciar Interacción';
    startButton.className = 'lead-manager-button primary';
    startButton.style.cssText = `
      flex: 1;
      padding: 8px 16px;
      background-color: #4267B2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    `;
    this.startButton = startButton;
    
    const stopButton = document.createElement('button');
    stopButton.textContent = 'Detener';
    stopButton.className = 'lead-manager-button secondary';
    stopButton.style.cssText = `
      flex: 1;
      padding: 8px 16px;
      background-color: #F0F2F5;
      color: #333;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      display: none;
    `;
    this.stopButton = stopButton;
    
    // Evento para iniciar interacción
    startButton.addEventListener('click', async () => {
      try {
        // Si ya está interactuando, detener
        if (this.isInteracting) {
          this.stopInteraction();
          return;
        }

        // Obtener valores de configuración
        const memberType = memberSelector.value;
        const delay = parseFloat(delayInput.value) * 1000;
        const message = messageTextarea.value.trim();
        const autoCloseChat = autoCloseChatCheckbox.checked;
        const maxMembers = parseInt(maxMembersInput.value);
        
        // Validaciones
        if (isNaN(delay) || delay < 1000) {
          alert('Por favor, ingrese un tiempo de espera válido (mínimo 1 segundo)');
          return;
        }
        
        if (!message) {
          alert('Por favor, ingrese un mensaje para enviar a los miembros');
          return;
        }
        
        if (isNaN(maxMembers) || maxMembers < 1) {
          alert('Por favor, ingrese un número válido para el máximo de miembros');
          return;
        }
        
        // Guardar configuración
        const settings = {
          messageToSend: message,
          autoCloseChat: autoCloseChat,
          interactionDelay: delay / 1000,
          maxMembers: maxMembers,
          lastMemberType: memberType
        };
        
        await new Promise((resolve, reject) => {
          chrome.storage.local.set({ 'leadManagerGroupSettings': settings }, () => {
            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
            else resolve();
          });
        });

        // Asegurar que memberInteraction esté inicializado
        if (!this.memberInteraction) {
          this.memberInteraction = window.leadManagerPro.memberInteraction || new MemberInteraction();
          window.leadManagerPro.memberInteraction = this.memberInteraction;
        }

        // Convertir del tipo de vista al tipo de sección
        let sectionType;
        switch (memberType) {
          case 'admins':
            sectionType = 'admins';
            break;
          case 'common':
            sectionType = 'common';
            break;
          case 'new':
            sectionType = 'newMembers';
            break;
          case 'all':
          case 'active':
          default:
            sectionType = 'allMembers';
            break;
        }

        // Inicializar el módulo de interacción
        this.memberInteraction.messageToSend = message;
        this.memberInteraction.autoCloseChat = autoCloseChat;
        this.memberInteraction.maxMembersToInteract = maxMembers;
        
        // Actualizar estado y UI
        this.isInteracting = true;
        startButton.style.backgroundColor = '#dc3545';
        startButton.textContent = 'Detener Interacción';

        // Iniciar la interacción con la sección correspondiente
        this.startInteraction(sectionType);

      } catch (error) {
        console.error('Error al iniciar la interacción:', error);
        this.statusText.textContent = 'Error: ' + error.message;
        this.statusText.style.color = 'red';
        
        // Restaurar UI
        this.isInteracting = false;
        startButton.style.backgroundColor = '#4267B2';
        startButton.textContent = 'Iniciar Interacción';
      }
    });
    
    // Evento para detener interacción
    stopButton.addEventListener('click', () => {
      this.stopInteraction();
    });
    
    actionContainer.appendChild(startButton);
    actionContainer.appendChild(stopButton);
    
    // Opciones avanzadas (expandible)
    const advancedOptionsToggle = document.createElement('div');
    advancedOptionsToggle.innerHTML = '⚙️ Opciones avanzadas <span style="font-size:12px;">(click para mostrar)</span>';
    advancedOptionsToggle.style.cssText = `
      font-weight: bold;
      margin-bottom: 8px;
      cursor: pointer;
      color: #4267B2;
      user-select: none;
    `;
    
    const advancedOptionsContainer = document.createElement('div');
    advancedOptionsContainer.style.cssText = `
      display: none;
      padding: 12px;
      margin-bottom: 16px;
      background-color: #F0F2F5;
      border-radius: 8px;
    `;

    // Opción de cerrar chat automáticamente
    const autoCloseChatLabel = document.createElement('label');
    autoCloseChatLabel.style.cssText = `
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      cursor: pointer;
    `;
    
    const autoCloseChatCheckbox = document.createElement('input');
    autoCloseChatCheckbox.type = 'checkbox';
    autoCloseChatCheckbox.checked = true;
    autoCloseChatCheckbox.style.marginRight = '8px';
    
    const autoCloseChatText = document.createTextNode('Cerrar ventana de chat automáticamente');
    
    autoCloseChatLabel.appendChild(autoCloseChatCheckbox);
    autoCloseChatLabel.appendChild(autoCloseChatText);
    
    // Nueva opción de agregar amigos (próximamente)
    const addFriendLabel = document.createElement('label');
    addFriendLabel.style.cssText = `
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      opacity: 0.7;
      cursor: not-allowed;
    `;
    
    const addFriendCheckbox = document.createElement('input');
    addFriendCheckbox.type = 'checkbox';
    addFriendCheckbox.checked = false;
    addFriendCheckbox.disabled = true;
    addFriendCheckbox.style.marginRight = '8px';
    
    const addFriendText = document.createElement('span');
    addFriendText.style.display = 'flex';
    addFriendText.style.alignItems = 'center';
    addFriendText.innerHTML = 'Agregar como amigo antes de enviar mensaje <span style="background-color: #e4e6eb; color: #65676b; font-size: 12px; padding: 2px 6px; border-radius: 10px; margin-left: 8px;">Próximamente</span>';
    
    addFriendLabel.title = 'Esta función permitirá enviar solicitud de amistad antes de iniciar la conversación';
    
    addFriendLabel.appendChild(addFriendCheckbox);
    addFriendLabel.appendChild(addFriendText);
    
    // Máximo de miembros para interactuar
    const maxMembersLabel = document.createElement('div');
    maxMembersLabel.textContent = 'Máximo de miembros para interactuar:';
    maxMembersLabel.style.marginBottom = '8px';
    
    const maxMembersInput = document.createElement('input');
    maxMembersInput.type = 'number';
    maxMembersInput.min = '1';
    maxMembersInput.value = '10';
    maxMembersInput.style.cssText = `
      width: 100%;
      padding: 8px;
      margin-bottom: 12px;
      border-radius: 6px;
      border: 1px solid #CED0D4;
    `;
    
    // Ensamblar opciones avanzadas
    advancedOptionsContainer.appendChild(autoCloseChatLabel);
    advancedOptionsContainer.appendChild(addFriendLabel);
    advancedOptionsContainer.appendChild(maxMembersLabel);
    advancedOptionsContainer.appendChild(maxMembersInput);
    
    // Evento para mostrar/ocultar opciones avanzadas
    advancedOptionsToggle.addEventListener('click', () => {
      const isHidden = advancedOptionsContainer.style.display === 'none';
      advancedOptionsContainer.style.display = isHidden ? 'block' : 'none';
      advancedOptionsToggle.innerHTML = `⚙️ Opciones avanzadas <span style="font-size:12px;">(click para ${isHidden ? 'ocultar' : 'mostrar'})</span>`;
    });

    // Ensamblar la interfaz completa
    body.appendChild(description);
    body.appendChild(memberSelectorLabel);
    body.appendChild(memberSelector);
    body.appendChild(messageLabel);
    body.appendChild(messageTextarea);
    body.appendChild(delayLabel);
    body.appendChild(delayInput);
    body.appendChild(advancedOptionsToggle);
    body.appendChild(advancedOptionsContainer);
    body.appendChild(progressContainer);
    body.appendChild(actionContainer);
    
    container.appendChild(header);
    container.appendChild(body);
    
    this.container = container;
    return container;
  }

  // Mostrar la interfaz
  show() {
    this.isVisible = true;
    if (!this.container) {
      this.container = this.createUI();
      document.body.appendChild(this.container);
    }
      this.container.style.display = 'flex';
    
    // Verificar y ocultar el sidebar si es necesario
    if (window.location.href.includes('/groups/')) {
      this.checkAndHideSidebar();
    }
  }
  
  // Ocultar la interfaz
  hide() {
    this.isVisible = false;
    if (this.container) {
      // Si estamos interactuando, detener primero
      if (this.isInteracting) {
        this.stopInteraction();
      }
      
      this.container.style.display = 'none';
    }
  }
  
  // Iniciar la interacción con miembros
  startInteraction(sectionType) {
    console.log(`Iniciando interacción con sección: ${sectionType}`);
    
    // Si ya hay una interacción en curso, detenerla
    if (this.isInteracting) {
      this.stopInteraction();
    }
    
    this.isInteracting = true;
    this.processedMembers = 0;
    this.totalMembers = 0;
    
    // Buscar la sección correspondiente
    const sectionInfo = this.selectors.sections[sectionType];
    if (!sectionInfo) {
      console.error(`Tipo de sección no válido: ${sectionType}`);
      return;
    }
    
    // Buscar primero por el título de la sección
    let targetSection = null;
    const headings = document.querySelectorAll('h1, h2, h3, h4');
    
    // Mapear el tipo de sección a un texto de título para buscar
    let titleText = '';
    switch(sectionType) {
      case 'admins':
        titleText = 'Administradores y moderadores';
        break;
      case 'common':
        titleText = 'Miembros con cosas en común';
        break;
      case 'newMembers':
        titleText = 'Nuevos miembros del grupo';
        break;
      case 'collaborators':
        titleText = 'colaboradores del grupo';
        break;
      case 'allMembers':
      default:
        titleText = 'Miembros';
        break;
    }
    
    // Buscar el encabezado que coincide con el título
    let targetHeading = null;
    for (const heading of headings) {
      if (heading.textContent.toLowerCase().includes(titleText.toLowerCase())) {
        targetHeading = heading;
        break;
      }
    }
    
    // Si encontramos el encabezado, buscar la sección contenedora
    if (targetHeading) {
      // Buscar el contenedor de la sección (subir hasta encontrar un contenedor con lista)
      let container = targetHeading;
      for (let i = 0; i < 5; i++) {
        container = container.parentElement;
        if (!container) break;
        
        // Verificar si el contenedor tiene una lista de miembros
        if (container.querySelector('[role="list"]')) {
          targetSection = container;
          break;
        }
      }
    }
    
    if (!targetSection) {
      console.log(`No se encontró la sección: ${titleText}`);
      this.showError(`No se encontró la sección: ${titleText}`);
      this.isInteracting = false;
      return;
    }
    
    // Una vez encontrada la sección, iniciar la interacción
    this.startInteractionWithSection(sectionType, targetSection);
  }
  
  // Método para iniciar interacción con una sección específica
  startInteractionWithSection(sectionType, sectionContainer) {
    console.log(`Iniciando interacción con sección específica: ${sectionType}`);
    
    // Si ya hay una interacción en curso, detenerla
    if (this.isInteracting) {
      this.stopInteraction();
    }
    
    this.isInteracting = true;
    this.processedMembers = 0;
    this.totalMembers = 0;
    
    // Obtener los elementos de miembros de la sección proporcionada
    const memberList = sectionContainer.querySelector('[role="list"]');
    if (!memberList) {
      console.error('No se encontró la lista de miembros en la sección');
      this.showError('No se encontró la lista de miembros en la sección');
      this.isInteracting = false;
      return;
    }
    
    // Usar selectores específicos o genéricos para encontrar los items de miembros
    let memberItems = memberList.querySelectorAll('[role="listitem"]');
    
    // Si no encontramos items con ese selector, intentar con alternativas
    if (!memberItems || memberItems.length === 0) {
      memberItems = memberList.querySelectorAll('div > a[href*="/user/"], div > a[href*="/profile.php"]');
      
      // Si aún no encontramos, buscar cualquier enlace que podría ser un perfil
      if (!memberItems || memberItems.length === 0) {
        const allLinks = memberList.querySelectorAll('a');
        memberItems = Array.from(allLinks).filter(link => {
          const href = link.getAttribute('href');
          return href && (href.includes('/user/') || href.includes('/profile.php') || 
                         !href.includes('/groups/') && !href.includes('/pages/'));
        });
      }
    }
    
    this.totalMembers = memberItems.length;
    console.log(`Encontrados ${this.totalMembers} miembros en la sección`);
    
    if (this.totalMembers === 0) {
      console.error('No se encontraron miembros en la sección');
      this.showError('No se encontraron miembros en la sección');
      this.isInteracting = false;
      return;
    }
    
    // Crear panel de control para mostrar progreso
    this.createControlPanel(sectionType);
    
    // Procesar cada miembro con un intervalo para no sobrecargar el DOM
    memberItems.forEach((memberItem, index) => {
      setTimeout(() => {
        this.addInteractionButtons(memberItem, index);
        this.processedMembers++;
        this.updateProgressBar();
      }, index * 100); // 100ms entre cada miembro
    });
    
    // Actualizar botón de reproducción
    this.updatePlayButton(sectionType, true);
  }
  
  addInteractionButtons(memberItem, index) {
    // Verificar si ya se ha añadido un botón de interacción
    if (memberItem.querySelector('.lmp-member-interaction-button')) {
      console.log(`El elemento #${index} ya tiene botones de interacción`);
      this.processedMembers++;
      this.updateProgressBar();
      return;
    }
    
    // Buscar el enlace al perfil del miembro
    const profileLink = memberItem.querySelector('a');
    if (!profileLink) {
      console.log(`No se encontró enlace de perfil para el elemento #${index}`);
      this.processedMembers++;
      this.updateProgressBar();
      return;
    }
    
    // Extraer el ID del miembro del enlace del perfil
    const href = profileLink.getAttribute('href');
    if (!href) {
      console.log(`No se encontró href en el enlace de perfil para el elemento #${index}`);
      this.processedMembers++;
      this.updateProgressBar();
      return;
    }
    
    // Intentar obtener el ID del miembro
    const memberId = this.extractMemberId(href);
    if (!memberId) {
      console.log(`No se pudo extraer ID del miembro del href: ${href}`);
      this.processedMembers++;
      this.updateProgressBar();
      return;
    }
    
    // Buscar avatar/imagen para determinar dónde posicionar los botones
    const avatarImg = memberItem.querySelector('img');
    
    // Crear contenedor para los botones
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'lmp-member-interaction-buttons';
    buttonContainer.style.cssText = `
      display: flex;
      align-items: center;
      margin-left: 10px;
    `;
    
    // Añadir botones de interacción
    const interactionTypes = ['message', 'friend', 'profile'];
    interactionTypes.forEach(type => {
      const button = document.createElement('button');
      button.className = `lmp-member-interaction-button lmp-${type}-button`;
      button.setAttribute('data-member-id', memberId);
      button.setAttribute('data-member-action', type);
      
      // Establecer estilo e ícono según el tipo
      let iconClass, buttonLabel;
      switch (type) {
        case 'message':
          iconClass = 'fas fa-comment';
          buttonLabel = 'Mensaje';
          break;
        case 'friend':
          iconClass = 'fas fa-user-plus';
          buttonLabel = 'Agregar';
          break;
        case 'profile':
          iconClass = 'fas fa-user';
          buttonLabel = 'Perfil';
          break;
      }
      
      button.innerHTML = `<i class="${iconClass}"></i>`;
      button.title = buttonLabel;
      
      button.style.cssText = `
        background-color: #1877f2;
        color: white;
        border: none;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        margin-right: 5px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
      `;
      
      button.addEventListener('mouseover', () => {
        button.style.backgroundColor = '#166fe5';
      });
      
      button.addEventListener('mouseout', () => {
        button.style.backgroundColor = '#1877f2';
      });
      
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleInteractionButtonClick(button);
      });
      
      buttonContainer.appendChild(button);
    });
    
    // Determinar dónde insertar los botones
    if (avatarImg) {
      // Buscar el contenedor del avatar
      let avatarContainer = avatarImg;
      while (avatarContainer && avatarContainer !== memberItem) {
        if (avatarContainer.style.display === 'flex' || 
            window.getComputedStyle(avatarContainer).display === 'flex') {
          break;
        }
        avatarContainer = avatarContainer.parentElement;
      }
      
      // Si encontramos un contenedor flex, insertar después del avatar
      if (avatarContainer && avatarContainer !== memberItem) {
        avatarContainer.appendChild(buttonContainer);
      } else {
        // Si no, crear un nuevo contenedor flex
        const flexContainer = document.createElement('div');
        flexContainer.style.cssText = `
          display: flex;
          align-items: center;
        `;
        
        avatarImg.parentNode.insertBefore(flexContainer, avatarImg.nextSibling);
        flexContainer.appendChild(buttonContainer);
      }
    } else {
      // Si no hay avatar, simplemente añadir al final del elemento
      memberItem.appendChild(buttonContainer);
    }
    
    this.processedMembers++;
    this.updateProgressBar();
    console.log(`Añadidos botones de interacción al miembro #${index} con ID: ${memberId}`);
  }
  
  // Detener la interacción
  stopInteraction() {
    if (!this.isInteracting) return;
    
    this.removeHighlight();
    
    // Detener el proceso de interacción
    if (this.memberInteraction) {
    this.memberInteraction.stopInteractionProcess();
    
      // Cerrar el chat si está abierto
      const chatWindow = document.querySelector('[role="dialog"]');
      if (chatWindow) {
        const closeButton = chatWindow.querySelector('[aria-label="Cerrar"]');
        if (closeButton) {
          closeButton.click();
        }
      }
    }
    
    // Restaurar todos los botones Play
    const playButtons = document.querySelectorAll('.lmp-play-button');
    playButtons.forEach(button => {
      button.innerHTML = this.icons.play;
      button.style.backgroundColor = '#1b74e4';
    });
    
    // Restaurar botón de Iniciar Interacción
    if (this.startButton) {
      this.startButton.style.backgroundColor = '#4267B2';
      this.startButton.textContent = 'Iniciar Interacción';
    }
    
    this.isInteracting = false;
  }
  
  // Finalizar la interacción (llamado cuando se completa o se detiene)
  finishInteraction() {
    this.isInteracting = false;
    
    // Actualizar UI
    this.startButton.style.display = 'block';
    this.stopButton.style.display = 'none';
    this.statusText.textContent = 'Interacción finalizada.';
    this.statusText.style.color = '';
    
    // Actualizar barra de progreso al 100%
    const progressFill = this.progressBar.querySelector('.lead-manager-interaction-progress-fill');
    if (progressFill) {
      progressFill.style.width = '100%';
    }

    // Actualizar el botón de Play
    this.updatePlayButton('admins', false);
  }
  
  // Actualizar progreso (callback para el proceso de interacción)
  updateProgress(progressData) {
    if (!this.isInteracting) return;
    
    if (progressData.type === 'progress') {
      // Calcular porcentaje de progreso
      const progress = Math.round((progressData.memberIndex / progressData.totalMembers) * 100);
      
      // Actualizar barra de progreso
      const progressFill = this.progressBar.querySelector('.lead-manager-interaction-progress-fill');
      if (progressFill) {
        progressFill.style.width = `${progress}%`;
      }
      
      // Actualizar texto de estado
      this.statusText.textContent = `Procesando miembro ${progressData.memberIndex + 1} de ${progressData.totalMembers}`;
      
      if (progressData.messageOpened) {
        this.statusText.textContent += ' - Ventana de mensaje abierta';
      }
    } else if (progressData.type === 'complete') {
      // Finalización del proceso
      this.statusText.textContent = `Interacción completada. Se procesaron ${progressData.processedMembers} de ${progressData.totalMembers} miembros.`;
      this.finishInteraction();
    } else if (progressData.type === 'error') {
      // Error durante el proceso
      this.statusText.textContent = `Error en miembro ${progressData.memberIndex + 1}: ${progressData.error.message}`;
      this.statusText.style.color = 'red';
    }
  }
  
  // Nueva función para remover el highlight
  removeHighlight() {
    if (this.lastHighlightedSection) {
      this.lastHighlightedSection.style.backgroundColor = '';
      this.lastHighlightedSection.style.padding = '';
      this.lastHighlightedSection.style.borderRadius = '';
      this.lastHighlightedSection.style.transition = '';
      this.lastHighlightedSection = null;
    }
  }

  // Renombrar y actualizar la función para manejar múltiples secciones
  highlightSection(type) {
    // Primero, remover el highlight anterior si existe
    this.removeHighlight();

    // Logs para debugging
    console.log('Buscando sección:', type);
    console.log('Selector del contenedor:', this.selectors.sections[type].container);

    // Buscar directamente el contenedor usando el selector de clases
    const containers = document.querySelectorAll(this.selectors.sections[type].container);
    console.log('Contenedores encontrados:', containers.length);

    // Encontrar el contenedor correcto verificando el título dentro de él
    let targetContainer = null;
    containers.forEach(container => {
      const title = container.querySelector(this.selectors.sections[type].title);
      if (title && title.textContent.includes(this.selectors.sections[type].titleText)) {
        targetContainer = container;
        console.log('Contenedor encontrado con título:', title.textContent);
      }
    });

    if (targetContainer) {
      // Aplicar el highlight
      targetContainer.style.backgroundColor = 'rgba(24, 119, 242, 0.1)';
      targetContainer.style.padding = '12px';
      targetContainer.style.borderRadius = '8px';
      targetContainer.style.transition = 'background-color 0.3s ease';
      
      // Guardar referencia de la sección resaltada
      this.lastHighlightedSection = targetContainer;
      
      console.log(`Sección ${type} resaltada correctamente`);
    } else {
      console.log(`No se encontró la sección ${type} para resaltar`);
    }
  }
  
  // Obtener elementos de miembros según el tipo seleccionado
  async getMemberElements(memberType) {
    if (!this.isInPeopleSection()) {
      console.log('MemberInteractionUI: No estamos en la sección de Personas, intentando navegar...');
      const success = await this.navigateToPeopleSection();
      if (!success) {
        throw new Error('Por favor, navega a la sección "Personas" del grupo para comenzar la interacción.');
      }
      // Esperar a que el contenido se cargue
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    let memberElements = [];
    console.log('MemberInteractionUI: Buscando miembros de tipo:', memberType);
    
    const sectionConfig = this.selectors.sections[memberType];
    if (!sectionConfig) {
      console.error('MemberInteractionUI: Tipo de sección no válido:', memberType);
      throw new Error('Tipo de sección no válido');
    }

    const allSections = document.querySelectorAll(sectionConfig.container);
    console.log('MemberInteractionUI: Secciones encontradas:', allSections.length);

    let targetSection = null;
    allSections.forEach(section => {
      const title = section.querySelector(sectionConfig.title);
      if (title && title.textContent.includes(sectionConfig.titleText)) {
        console.log('MemberInteractionUI: Título encontrado:', title.textContent);
        targetSection = section;
      }
    });

    if (!targetSection) {
      console.error('MemberInteractionUI: No se encontró la sección con el título correcto');
      return [];
    }

    const userList = targetSection.querySelector(sectionConfig.userList);
    if (!userList) {
      console.error('MemberInteractionUI: No se encontró la lista de usuarios');
      return [];
    }

    const userItems = userList.querySelectorAll(sectionConfig.userItem);
    console.log('MemberInteractionUI: Items de usuario encontrados:', userItems.length);

    memberElements = Array.from(userItems).filter(item => {
      const link = item.querySelector(sectionConfig.userLink);
      if (link) {
        console.log('MemberInteractionUI: Enlace de perfil encontrado:', link.href);
        return true;
      }
      console.log('MemberInteractionUI: Item sin enlace de perfil válido');
      return false;
    });

    console.log('MemberInteractionUI: Elementos válidos encontrados:', memberElements.length);
    return memberElements;
  }
  
  // Método para encontrar miembros en una sección específica mediante el título
  findMembersInSection(...sectionTitles) {
    const sectionHeaders = Array.from(document.querySelectorAll('h2, h3, h4'));
    
    console.log('MemberInteractionUI: Títulos de sección encontrados:', sectionHeaders.length);
    console.log('MemberInteractionUI: Títulos:', sectionHeaders.map(h => h.textContent));
    
    // Buscar encabezado que coincida con alguno de los títulos proporcionados
    const targetHeader = sectionHeaders.find(header => {
      const text = header.textContent.toLowerCase();
      return sectionTitles.some(title => 
        text.includes(title.toLowerCase())
      );
    });
    
    if (targetHeader) {
      console.log('MemberInteractionUI: Sección encontrada:', targetHeader.textContent);
      
      // Buscar hacia arriba para encontrar el contenedor adecuado
      let container = targetHeader;
      for (let i = 0; i < 5; i++) {
        container = container.parentElement;
        if (!container) break;
        
        // Buscar el elemento con role="list"
        const listElement = container.querySelector('[role="list"]');
        if (listElement) {
          // Obtener todos los elementos de lista
          const items = listElement.querySelectorAll('[role="listitem"]');
          if (items.length > 0) {
            console.log('MemberInteractionUI: Encontrados', items.length, 'miembros en la sección');
            return items;
          }
        }
        
        // Alternativa: buscar directamente elementos de lista
        const directItems = container.querySelectorAll('[role="listitem"]');
        if (directItems.length > 0) {
          console.log('MemberInteractionUI: Encontrados', directItems.length, 'miembros (método directo)');
          return directItems;
        }
        
        // Otra alternativa: buscar enlaces a perfiles
        const profileLinks = container.querySelectorAll('a[href*="/user/"], a[href*="/profile.php"]');
        if (profileLinks.length > 0) {
          // Obtener los elementos contenedores de los perfiles
          const containers = Array.from(profileLinks).map(link => {
            // Subir hasta encontrar un contenedor adecuado
            let parentContainer = link.parentElement;
            for (let j = 0; j < 3; j++) {
              if (!parentContainer) break;
              if (parentContainer.offsetHeight > 40) return parentContainer;
              parentContainer = parentContainer.parentElement;
            }
            return link.parentElement;
          });
          
          console.log('MemberInteractionUI: Encontrados', containers.length, 'miembros (por enlaces)');
          return containers;
        }
      }
    } else {
      console.log('MemberInteractionUI: No se encontró la sección buscada');
    }
    
    // Si no se encontraron miembros, intentar con un selector específico para la estructura de Facebook
    console.log('MemberInteractionUI: Intentando buscar miembros con selectores adicionales');
    
    // Buscar en la sección principal
    const mainContent = document.querySelector('[role="main"]');
    if (mainContent) {
      // Buscar elementos que tengan enlaces a perfiles de usuario
      const potentialMemberElements = mainContent.querySelectorAll('div[aria-disabled="false"]');
      
      // Filtrar para incluir solo los que contienen enlaces a perfiles
      const filteredElements = Array.from(potentialMemberElements).filter(el => 
        el.querySelector('a[href*="/user/"]') || el.querySelector('a[href*="/profile.php"]')
      );
      
      console.log('MemberInteractionUI: Encontrados', filteredElements.length, 'miembros con método alternativo');
      return filteredElements;
    }
    
    return [];
  }

  createPlayButton(sectionType) {
    const button = document.createElement('button');
    button.className = 'lmp-play-button';
    button.setAttribute('data-section-type', sectionType);
    
    // Estilos del botón
    button.style.cssText = `
      background-color: #1b74e4;
      border: none;
      border-radius: 6px;
      color: white;
      padding: 8px 12px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      margin-left: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    `;

    // Hover effect
    button.addEventListener('mouseover', () => {
      button.style.backgroundColor = '#0a60cc';
    });

    button.addEventListener('mouseout', () => {
      if (!this.isInteracting) {
        button.style.backgroundColor = '#1b74e4';
      } else {
        button.style.backgroundColor = '#dc3545';
      }
    });

    // Añadir icono SVG de play
    button.innerHTML = this.icons.play;
    
    // Click handler
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      try {
        // Si ya está interactuando, detener
        if (this.isInteracting) {
          this.stopInteraction();
          return;
        }

        // Obtener la configuración guardada para los mensajes
        const config = await this.getStoredConfig();
        console.log('Configuración cargada para interacción:', config);

        // Encontrar la sección que contiene este botón
        let sectionHeading = button.closest('div').querySelector('h1, h2, h3, h4');
        if (!sectionHeading) {
          console.error('No se encontró el encabezado de la sección');
          throw new Error('No se pudo encontrar la sección');
        }
        
        console.log('Iniciando interacción con sección:', sectionHeading.textContent);
        
        // Cambiar estado del botón
        button.innerHTML = this.icons.pause;
        button.style.backgroundColor = '#dc3545';
        
        // Encontrar el contenedor principal de la sección
        let sectionContainer = sectionHeading.parentElement;
        while (sectionContainer && !sectionContainer.querySelector('[role="list"]')) {
          sectionContainer = sectionContainer.parentElement;
          if (!sectionContainer) break;
        }
        
        if (!sectionContainer) {
          throw new Error('No se pudo encontrar la lista de miembros');
        }
        
        // Encontrar la lista de miembros
        const memberList = sectionContainer.querySelector('[role="list"]');
        if (!memberList) {
          throw new Error('No se encontró la lista de miembros');
        }
        
        // Encontrar todos los elementos de miembro
        const memberItems = memberList.querySelectorAll('[role="listitem"]');
        if (!memberItems || memberItems.length === 0) {
          throw new Error('No se encontraron miembros en esta sección');
        }
        
        console.log(`Encontrados ${memberItems.length} miembros para interactuar`);
        
        // Iniciar interacción con miembros
        this.isInteracting = true;
        
        // Configurar MemberInteraction
        if (!window.leadManagerPro.memberInteraction) {
          window.leadManagerPro.memberInteraction = new MemberInteraction();
        }
        
        const memberInteraction = window.leadManagerPro.memberInteraction;
        memberInteraction.messageToSend = config.messageToSend || 'Hola, este es un mensaje de prueba desde la plataforma, has caso omiso ya que solo sirve para pruebas. !Un saludo!';
        memberInteraction.autoCloseChat = config.autoCloseChat !== undefined ? config.autoCloseChat : true;
        memberInteraction.interactionDelay = config.delay || 2000;
        memberInteraction.maxMembersToInteract = config.maxMembers || 10;
        
        // Crear panel de control
        this.createControlPanel(sectionType);
        this.totalMembers = memberItems.length;
        this.processedMembers = 0;
        
        // Procesar cada miembro
        let processedCount = 0;
        for (let i = 0; i < memberItems.length; i++) {
          if (processedCount >= memberInteraction.maxMembersToInteract) {
            console.log(`Alcanzado el máximo de ${memberInteraction.maxMembersToInteract} miembros a interactuar`);
            break;
          }
          
          const memberItem = memberItems[i];
          
          // Encontrar enlace al perfil
          const profileLink = memberItem.querySelector('a[href*="/user/"], a[href*="/profile.php"]');
          if (!profileLink) continue;
          
          // Extraer ID del miembro
          const memberId = this.extractMemberId(profileLink.href);
          if (!memberId) continue;
          
          // Actualizar progreso
          this.processedMembers++;
          this.updateProgressBar();
          
          // Simular clic en el perfil para abrir mensaje
          setTimeout(async () => {
            try {
              console.log(`Procesando miembro #${i+1}: ${memberId}`);
              
              // Intentar abrir perfil y mensaje
              profileLink.click();
              
              // Esperar a que se abra el modal
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Buscar botón de mensaje
              const messageButton = document.querySelector('[role="dialog"] button:has-text("Mensaje"), [role="dialog"] button:contains("Mensaje")');
              if (messageButton) {
                messageButton.click();
                
                // Esperar a que se abra el chat
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Buscar área de texto e insertar mensaje
                const textArea = document.querySelector('[role="textbox"][contenteditable="true"]');
                if (textArea) {
                  textArea.textContent = memberInteraction.messageToSend;
                  textArea.dispatchEvent(new Event('input', { bubbles: true }));
                  
                  // Buscar y hacer clic en botón enviar
                  await new Promise(resolve => setTimeout(resolve, 500));
                  const sendButton = Array.from(document.querySelectorAll('div[role="button"]')).find(btn => 
                    btn.textContent.includes('Enviar')
                  );
                  
                  if (sendButton) {
                    sendButton.click();
                    console.log(`Mensaje enviado a miembro #${i+1}`);
                    processedCount++;
                    
                    // Cerrar chat si está configurado
                    if (memberInteraction.autoCloseChat) {
                      await new Promise(resolve => setTimeout(resolve, 1000));
                      const closeButton = document.querySelector('[role="dialog"] [aria-label="Cerrar"]');
                      if (closeButton) closeButton.click();
                    }
                  }
                }
              }
            } catch (error) {
              console.error(`Error al interactuar con miembro #${i+1}:`, error);
            }
          }, i * memberInteraction.interactionDelay);
        }
        
        // Finalizar cuando termine
        setTimeout(() => {
          this.isInteracting = false;
          button.innerHTML = this.icons.play;
          button.style.backgroundColor = '#1b74e4';
          
          // Actualizar el panel de control
          if (this.progressInfo) {
            this.progressInfo.textContent = `¡Completado! Se procesaron ${processedCount} miembros`;
            this.progressInfo.style.color = '#00a400';
          }
          
          console.log(`Interacción finalizada. Procesados ${processedCount} miembros`);
        }, (memberInteraction.maxMembersToInteract * memberInteraction.interactionDelay) + 2000);
        
      } catch (error) {
        console.error('Error al iniciar la interacción:', error);
        this.isInteracting = false;
        button.innerHTML = this.icons.play;
        button.style.backgroundColor = '#1b74e4';
        this.showError(error.message);
      }
    });

    return button;
  }

  tryAddPlayButtons() {
    console.log('Intentando añadir botones de interacción a las secciones de miembros');
    
    // Objetos que contienen información de las secciones
    const sectionDefinitions = [
      {
        titleText: "Administradores y moderadores",
        sectionType: "admins"
      },
      {
        titleText: "colaboradores del grupo",
        sectionType: "collaborators"
      },
      {
        titleText: "Miembros con cosas en común",
        sectionType: "common"
      },
      {
        titleText: "Nuevos miembros del grupo",
        sectionType: "newMembers"
      },
      {
        titleText: "Miembros",
        sectionType: "allMembers"
      }
    ];
    
    // Buscar todos los encabezados que podrían ser títulos de secciones
    const headings = document.querySelectorAll('h1, h2, h3, h4');
    console.log(`Encontrados ${headings.length} encabezados posibles`);
    
    // Para cada encabezado, verificar si corresponde a una de nuestras secciones
    headings.forEach(heading => {
      const headingText = heading.textContent.trim().toLowerCase();
      console.log(`Analizando encabezado: "${headingText}"`);
      
      // Buscar qué sección coincide con este encabezado
      for (const sectionDef of sectionDefinitions) {
        if (headingText.includes(sectionDef.titleText.toLowerCase())) {
          console.log(`Encabezado coincide con sección: ${sectionDef.sectionType}`);
          
          // Verificar si ya existe un botón play para este encabezado
          let parentElement = heading.parentElement;
          if (parentElement.querySelector('.lmp-play-button')) {
            console.log(`Ya existe un botón para la sección: ${sectionDef.sectionType}`);
            continue;
          }
          
          // Si el encabezado ya está en un contenedor flex, no creamos uno nuevo
          let flexContainer = null;
          
          // Verificar si el encabezado está dentro de un contenedor flex
          if (window.getComputedStyle(parentElement).display === 'flex') {
            flexContainer = parentElement;
            console.log('Usando contenedor flex existente');
          } else {
            // Crear un nuevo contenedor flex
            flexContainer = document.createElement('div');
            flexContainer.style.cssText = `
              display: flex;
              align-items: center;
              justify-content: space-between;
              width: 100%;
              margin-bottom: 10px;
            `;
            
            // Insertar el contenedor antes del encabezado
            heading.parentNode.insertBefore(flexContainer, heading);
            
            // Mover el encabezado dentro del contenedor flex
            flexContainer.appendChild(heading);
            console.log('Creado nuevo contenedor flex');
          }
          
          // Crear y añadir el botón play
          const playButton = this.createPlayButton(sectionDef.sectionType);
          flexContainer.appendChild(playButton);
          console.log(`Botón Play añadido a la sección: ${sectionDef.sectionType}`);
          
          break; // Ya encontramos una coincidencia para este encabezado
        }
      }
    });
    
    // Verificar si se han añadido botones
    const addedButtons = document.querySelectorAll('.lmp-play-button');
    console.log(`Total de botones Play añadidos: ${addedButtons.length}`);
  }

  updatePlayButton(sectionType, isPlaying) {
    const playButton = document.querySelector(`[data-section-type="${sectionType}"]`);
    if (playButton) {
      const button = playButton.querySelector('button');
      if (button) {
        if (isPlaying) {
          button.innerHTML = this.icons.pause;
          button.title = 'Pausar interacción';
          button.style.backgroundColor = '#dc3545';
        } else {
          button.innerHTML = this.icons.play;
          button.title = 'Iniciar interacción';
          button.style.backgroundColor = '#0866ff';
        }
      }
    }
  }

  async getStoredConfig() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['leadManagerGroupSettings'], (result) => {
        console.log('Configuración recuperada de storage:', result); // Debug
        
        const defaultConfig = {
          messageToSend: 'Hola, este es un mensaje de prueba desde la plataforma, has caso omiso ya que solo sirve para pruebas. !Un saludo!',
          autoCloseChat: true,
          delay: 2000,
          maxMembers: 10
        };

        const savedConfig = result.leadManagerGroupSettings || {};
        console.log('Configuración guardada:', savedConfig); // Debug
        
        const finalConfig = {
          ...defaultConfig,
          ...savedConfig
        };
        
        console.log('Configuración final:', finalConfig); // Debug
        resolve(finalConfig);
      });
    });
  }

  showError(message) {
    // Crear y mostrar un mensaje de error estilizado
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #ff4444;
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      z-index: 10000;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    errorDiv.textContent = message;

    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
  }

  // Función para verificar si estamos en la sección de Personas
  isInPeopleSection() {
    return window.location.href.endsWith('/members');
  }

  // Función para navegar a la sección de Personas
  async navigateToPeopleSection() {
    const currentURL = window.location.href;
    
    // Si ya estamos en la sección de miembros, no hacer nada
    if (this.isInPeopleSection()) {
      return true;
    }

    // Asegurarnos de que la URL termine en /members
    const newURL = currentURL.endsWith('/') 
      ? currentURL + 'members'
      : currentURL + '/members';

    console.log('MemberInteractionUI: Navegando a la sección de miembros:', newURL);
    
    // Guardar el estado de visibilidad antes de navegar
    const wasVisible = this.isVisible;
    
    // Navegar a la sección de miembros
    window.location.href = newURL;
    
    // La página se recargará, y el init() restaurará la visibilidad
    return true;
  }

  // Extraer ID de miembro de una URL de perfil
  extractMemberId(url) {
    // Patrones comunes para URLs de perfiles
    const patterns = [
      /\/profile\.php\?id=(\d+)/,     // formato profile.php?id=123456789
      /\/user\/(\d+)/,                // formato /user/123456789
      /\/([a-zA-Z0-9.]+)(?:\?|$)/     // formato /username o /usuario.nombre
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    // Si todo falla, usar la URL completa como identificador único
    return encodeURIComponent(url);
  }
  
  createControlPanel(sectionType) {
    // Eliminar panel existente si hay uno
    const existingPanel = document.querySelector('.lmp-control-panel');
    if (existingPanel) {
      existingPanel.remove();
    }
    
    // Crear panel de control
    const controlPanel = document.createElement('div');
    controlPanel.className = 'lmp-control-panel';
    controlPanel.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #fff;
      box-shadow: 0 1px 6px rgba(0, 0, 0, 0.2);
      padding: 15px;
      border-radius: 8px;
      z-index: 9999;
      width: 300px;
    `;
    
    // Añadir título
    const title = document.createElement('h3');
    title.textContent = `Interacción: ${this.getSectionName(sectionType)}`;
    title.style.cssText = `
      margin: 0 0 10px 0;
      font-size: 16px;
      color: #1877f2;
    `;
    controlPanel.appendChild(title);
    
    // Añadir barra de progreso
    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = `
      background-color: #f0f2f5;
      border-radius: 4px;
      height: 10px;
      margin-bottom: 10px;
      overflow: hidden;
    `;
    
    const progressBar = document.createElement('div');
    progressBar.className = 'lmp-progress-bar';
    progressBar.style.cssText = `
      background-color: #1877f2;
      height: 100%;
      width: 0%;
      transition: width 0.3s ease;
    `;
    progressContainer.appendChild(progressBar);
    controlPanel.appendChild(progressContainer);
    
    // Añadir información de progreso
    const progressInfo = document.createElement('div');
    progressInfo.className = 'lmp-progress-info';
    progressInfo.textContent = `Procesando 0 de ${this.totalMembers} miembros`;
    progressInfo.style.cssText = `
      font-size: 14px;
      margin-bottom: 15px;
    `;
    controlPanel.appendChild(progressInfo);
    
    // Añadir botón para cancelar
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancelar';
    cancelButton.style.cssText = `
      background-color: #e4e6eb;
      border: none;
      border-radius: 4px;
      padding: 8px 12px;
      font-weight: 500;
      cursor: pointer;
      font-size: 14px;
    `;
    cancelButton.addEventListener('click', () => {
      controlPanel.remove();
    });
    controlPanel.appendChild(cancelButton);
    
    // Guardar referencias
    this.controlPanel = controlPanel;
    this.progressBar = progressBar;
    this.progressInfo = progressInfo;
    
    // Añadir al DOM
    document.body.appendChild(controlPanel);
  }
  
  updateProgressBar() {
    if (!this.progressBar || !this.progressInfo) return;
    
    const percentage = Math.round((this.processedMembers / this.totalMembers) * 100);
    this.progressBar.style.width = `${percentage}%`;
    this.progressInfo.textContent = `Procesando ${this.processedMembers} de ${this.totalMembers} miembros`;
    
    // Si completamos todos, mostrar mensaje
    if (this.processedMembers >= this.totalMembers) {
      this.progressInfo.textContent = `¡Completado! Se procesaron ${this.totalMembers} miembros`;
      this.progressInfo.style.color = '#00a400';
    }
  }
  
  getSectionName(sectionType) {
    switch (sectionType) {
      case 'admins': return 'Administradores';
      case 'common': return 'Miembros con cosas en común';
      case 'newMembers': return 'Nuevos miembros';
      case 'allMembers': return 'Todos los miembros';
      default: return 'Sección desconocida';
    }
  }
  
  handleInteractionButtonClick(button) {
    const memberId = button.getAttribute('data-member-id');
    const action = button.getAttribute('data-member-action');
    
    console.log(`Botón ${action} clickeado para miembro ID: ${memberId}`);
    
    // Cambiar el color del botón para indicar que se ha clickeado
    const originalColor = button.style.backgroundColor;
    button.style.backgroundColor = '#00a400';
    
    // Ejecutar acción según el tipo de botón
    switch (action) {
      case 'message':
        // Obtener el mensaje predefinido
        this.getStoredConfig().then(config => {
          this.openMessageDialog(memberId, config.messageToSend);
          
          // Restaurar el color original después de un tiempo
          setTimeout(() => {
            button.style.backgroundColor = originalColor;
          }, 2000);
        });
        break;
      case 'friend':
        this.sendFriendRequest(memberId);
        // Restaurar el color original después de un tiempo
        setTimeout(() => {
          button.style.backgroundColor = originalColor;
        }, 2000);
        break;
      case 'profile':
        this.openProfilePage(memberId);
        // Restaurar el color original después de un tiempo
        setTimeout(() => {
          button.style.backgroundColor = originalColor;
        }, 2000);
        break;
    }
  }
  
  openMessageDialog(memberId, message) {
    console.log(`Abriendo diálogo de mensaje para miembro ID: ${memberId}`);
    
    // Si estamos en un grupo, usar el método correspondiente
    if (window.location.href.includes('/groups/')) {
      // Intentar primero abrir el chat desde el perfil en la misma página
      const memberItem = document.querySelector(`[data-member-id="${memberId}"]`).closest('[role="listitem"]');
      if (memberItem) {
        // Buscar el enlace de perfil dentro del elemento
        const profileLink = memberItem.querySelector('a[href*="/user/"], a[href*="/profile.php"]');
        if (profileLink) {
          // Simular clic en el enlace para abrir el modal de perfil
          profileLink.click();
          
          // Esperar a que se abra el modal
          setTimeout(() => {
            // Buscar el botón de mensaje en el modal
            const messageButton = document.querySelector('[role="dialog"] button:has-text("Mensaje")');
            if (messageButton) {
              messageButton.click();
              
              // Esperar a que se abra el chat
              setTimeout(() => {
                // Buscar el área de texto e insertar el mensaje
                const textArea = document.querySelector('[role="textbox"][contenteditable="true"]');
                if (textArea) {
                  // Insertar el mensaje en el área de texto
                  textArea.textContent = message;
                  
                  // Disparar evento de input para activar el botón de enviar
                  textArea.dispatchEvent(new Event('input', { bubbles: true }));
                  
                  // Buscar y hacer clic en el botón de enviar
                  setTimeout(() => {
                    const sendButton = Array.from(document.querySelectorAll('div[role="button"]'))
                      .find(btn => btn.textContent.includes('Enviar'));
                    if (sendButton) {
                      sendButton.click();
                      
                      // Si está habilitado el cierre automático, cerramos la ventana
                      if (this.memberInteraction && this.memberInteraction.autoCloseChat) {
                        setTimeout(() => {
                          const closeButton = document.querySelector('[role="dialog"] [aria-label="Cerrar"]');
                          if (closeButton) closeButton.click();
                        }, 1500);
                      }
                    }
                  }, 500);
                }
              }, 1000);
            }
          }, 1000);
          return;
        }
      }
      
      // Si no podemos usar el método anterior, abrir en nueva pestaña
      window.open(`/messages/t/${memberId}`, '_blank');
    } else {
      // Si no estamos en un grupo, abrir el chat en una nueva pestaña
      window.open(`/messages/t/${memberId}`, '_blank');
    }
  }
  
  sendFriendRequest(memberId) {
    console.log(`Enviando solicitud de amistad a miembro ID: ${memberId}`);
    // Aquí implementarías la lógica para enviar solicitud de amistad
    // Esto podría requerir simular clicks en botones existentes o usar API
  }
  
  openProfilePage(memberId) {
    console.log(`Abriendo perfil de miembro ID: ${memberId}`);
    // Abrir el perfil en una nueva pestaña
    if (memberId.includes('http') || memberId.startsWith('/')) {
      window.open(decodeURIComponent(memberId), '_blank');
    } else if (memberId.match(/^\d+$/)) {
      window.open(`/profile.php?id=${memberId}`, '_blank');
    } else {
      window.open(`/${memberId}`, '_blank');
    }
  }
}

// Exportar la clase
window.leadManagerPro = window.leadManagerPro || {};
window.leadManagerPro.memberInteractionUI = new MemberInteractionUI();
