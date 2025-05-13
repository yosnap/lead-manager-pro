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
    this.selectors = {
      sections: {
        admins: {
          container: '.x1n2onr6.x1ja2u2z.x9f619.x78zum5.xdt5ytf.x2lah0s.x193iq5w.xx6bls6.x1jx94hy',
          title: 'h2.xdj266r',
          titleText: "Administradores y moderadores",
          userList: 'div[role="list"]',
          userItem: 'div[data-visualcompletion="ignore-dynamic"][role="listitem"]',
          userLink: 'a[href*="/groups/"][href*="/user/"][role="link"]'
        },
        common: {
          container: '.x1n2onr6.x1ja2u2z.x9f619.x78zum5.xdt5ytf.x2lah0s.x193iq5w.xx6bls6.x1jx94hy',
          title: 'h2.xdj266r',
          titleText: "Miembros con cosas en común",
          userList: 'div[role="list"]',
          userItem: 'div[data-visualcompletion="ignore-dynamic"][role="listitem"]',
          userLink: 'a[href*="/groups/"][href*="/user/"][role="link"]'
        },
        newMembers: {
          container: '.x1n2onr6.x1ja2u2z.x9f619.x78zum5.xdt5ytf.x2lah0s.x193iq5w.xx6bls6.x1jx94hy',
          title: 'h2.xdj266r',
          titleText: "Nuevos miembros del grupo",
          userList: 'div[role="list"]',
          userItem: 'div[data-visualcompletion="ignore-dynamic"][role="listitem"]',
          userLink: 'a[href*="/groups/"][href*="/user/"][role="link"]'
        }
      },
      navigation: {
        peopleTab: 'a[href*="/members"][role="link"]',
        activeTab: '[role="tab"][aria-selected="true"]'
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

    // Configurar observer para cambios en el DOM
    const observer = new MutationObserver(() => {
      if (document.querySelector(this.selectors.sections.admins.title)) {
        this.tryAddPlayButtons();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Intentar añadir botones inicialmente
    this.tryAddPlayButtons();
    
    // Registrar receptor de mensajes
    this.setupMessageListener();
  }
  
  // Configurar receptor de mensajes desde el popup
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('MemberInteractionUI: Mensaje recibido:', message);
      
      if (message.action === 'startInteractionWithMembers') {
        try {
          // Iniciar interacción con el tipo de miembros especificado
          const sectionType = message.sectionType || 'admins'; // Por defecto, administradores
          
          console.log(`MemberInteractionUI: Iniciando interacción con ${sectionType} por comando desde popup`);
          
          // Responder inmediatamente para evitar timeouts
          sendResponse({ success: true });
          
          // Crear una nueva instancia de MemberInteraction para evitar problemas de estado
          const memberInteraction = new MemberInteraction();
          window.leadManagerPro.memberInteraction = memberInteraction;
          
          // Obtener configuración
          this.getStoredConfig().then(config => {
            // Comprobar si estamos en la sección de miembros
            if (!this.isInPeopleSection()) {
              console.log('No estamos en la sección de miembros, navegando...');
              // Redirigir a la página de miembros
              window.location.href = window.location.href.replace(/\/$/, '') + '/members';
              return;
            }
            
            console.log('Ya estamos en la sección de miembros, ejecutando interacción directamente');
            // Ya estamos en la sección correcta, ejecutar directamente
            this.performInteractionWithSection(sectionType, config);
          });
          
          return false; // No mantener el canal abierto, ya respondimos
          
        } catch (error) {
          console.error('Error al iniciar interacción desde mensaje:', error);
          sendResponse({ success: false, error: error.message });
          return false;
        }
      }
      
      return false; // Para otros tipos de mensajes
    });
  }
  
  // Método para ejecutar la interacción con una sección específica
  async performInteractionWithSection(sectionType, config) {
    try {
      console.log(`Ejecutando interacción con sección ${sectionType}`);
      
      // Forzar la creación de una nueva instancia de MemberInteraction
      // en lugar de usar la existente, para evitar problemas de estado
      this.memberInteraction = new MemberInteraction();
      window.leadManagerPro.memberInteraction = this.memberInteraction;
      
      // Resaltar la sección
      this.highlightSection(sectionType);
      
      // Obtener miembros de la sección
      const memberElements = await this.getMemberElements(sectionType);
      
      if (!memberElements || memberElements.length === 0) {
        throw new Error(`No se encontraron miembros en la sección ${sectionType}`);
      }
      
      console.log(`Encontrados ${memberElements.length} miembros para interactuar`);
      
      // Aplicar configuración
      this.memberInteraction.messageToSend = config.messageToSend;
      this.memberInteraction.autoCloseChat = config.autoCloseChat;
      this.memberInteraction.maxMembersToInteract = config.maxMembers;
      this.memberInteraction.stopInteraction = false; // Asegurar que no está marcado para detener
      
      // Mostrar la interfaz si no está visible
      if (!this.isVisible) {
        this.show();
      }
      
      // Inicializar la interacción
      this.isInteracting = true;
      const delay = config.delay || 2000;
      
      // Actualizar UI
      if (this.startButton) {
        this.startButton.style.backgroundColor = '#dc3545';
        this.startButton.textContent = 'Detener Interacción';
      }
      
      if (this.statusText) {
        this.statusText.textContent = `Iniciando interacción con ${memberElements.length} miembros...`;
      }
      
      // Iniciar la interacción
      this.memberInteraction.init(memberElements, { delay });
      
      await this.memberInteraction.startInteraction((progress) => {
        this.updateProgress(progress);
        if (progress.type === 'complete') {
          this.isInteracting = false;
          if (this.startButton) {
            this.startButton.style.backgroundColor = '#4267B2';
            this.startButton.textContent = 'Iniciar Interacción';
          }
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error al ejecutar interacción:', error);
      if (this.statusText) {
        this.statusText.textContent = 'Error: ' + error.message;
        this.statusText.style.color = 'red';
      }
      this.isInteracting = false;
      if (this.startButton) {
        this.startButton.style.backgroundColor = '#4267B2';
        this.startButton.textContent = 'Iniciar Interacción';
      }
      return false;
    }
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
    
    // Añadimos el evento change con logs para depuración
    memberSelector.addEventListener('change', async (e) => {
      const selectedType = e.target.value;
      console.log('Tipo seleccionado:', selectedType);
      console.log('Selector completo:', this.selectors.sections[selectedType]?.container);
      
      try {
        if (!this.isInPeopleSection()) {
          await this.navigateToPeopleSection();
          return;
        }

        // Remover highlight anterior
        this.removeHighlight();
        
        // Ahora usamos directamente el valor del selector que corresponde a los tipos de sección
        this.highlightSection(selectedType);
      } catch (error) {
        console.error('Error al cambiar selección:', error);
        e.target.value = '';
      }
    });
    
    // Opciones para el selector
    // Estas opciones corresponden directamente a las secciones en la página de Facebook
    // Valor 'common' => 'Miembros con cosas en común'
    // Valor 'newMembers' => 'Nuevos miembros del grupo'
    // Valor 'admins' => 'Administradores y moderadores'
    
    const commonMembersOption = document.createElement('option');
    commonMembersOption.value = 'common';
    commonMembersOption.textContent = 'Miembros con cosas en común';
    
    const newMembersOption = document.createElement('option');
    newMembersOption.value = 'newMembers';
    newMembersOption.textContent = 'Nuevos miembros del grupo';
    
    const adminMembersOption = document.createElement('option');
    adminMembersOption.value = 'admins';
    adminMembersOption.textContent = 'Administradores y moderadores';
    
    // Agregamos las opciones al selector en orden de mayor utilidad
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
          membersToInteract: maxMembers,
          lastMemberType: memberType
        };
        
        await new Promise((resolve, reject) => {
          chrome.storage.local.set({ 'leadManagerGroupSettings': settings }, () => {
            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
            else resolve();
          });
        });

        // Asegurar que estamos en la página correcta
        if (!this.isInPeopleSection()) {
          await this.navigateToPeopleSection();
          return;
        }

        // Intentar encontrar el botón de play de la sección correspondiente
        let playButtonFound = false;

        // Buscar secciones que coincidan con el título esperado
        const allSections = document.querySelectorAll(this.selectors.sections[memberType].container);
        console.log(`Buscando botón de play en ${allSections.length} secciones de tipo ${memberType}`);
        
        for (const section of allSections) {
          const title = section.querySelector(this.selectors.sections[memberType].title);
          
          if (title && title.textContent.includes(this.selectors.sections[memberType].titleText)) {
            console.log(`Sección encontrada con título: ${title.textContent}`);
            
            // Buscar el botón de play en esta sección o en sus alrededores
            let playButton = null;
            
            // Intentar encontrar en el padre directo del título
            playButton = title.parentElement.querySelector('.lmp-play-button');
            
            if (!playButton) {
              // Intentar buscar en toda la sección
              playButton = section.querySelector('.lmp-play-button');
            }
            
            if (playButton) {
              console.log(`Botón de play encontrado para la sección ${memberType}, simulando clic`);
              playButton.click();
              playButtonFound = true;
              break;
            } else {
              console.log(`No se encontró el botón de play en la sección ${memberType}`);
            }
          }
        }

        // Si no se encontró el botón, ejecutar la interacción directamente
        if (!playButtonFound) {
          console.log(`No se encontró ningún botón de play, ejecutando interacción directamente`);
          
          // Asegurar que memberInteraction esté inicializado
          if (!this.memberInteraction) {
            this.memberInteraction = window.leadManagerPro.memberInteraction || new MemberInteraction();
            window.leadManagerPro.memberInteraction = this.memberInteraction;
          }

          // Resaltar la sección correspondiente
          this.highlightSection(sectionType);

          // Obtener los elementos de la sección resaltada
          const memberElements = await this.getMemberElements(sectionType);
          
          if (!memberElements || memberElements.length === 0) {
            throw new Error('No se encontraron miembros en la sección seleccionada');
          }

          // Inicializar el módulo de interacción
          this.memberInteraction.messageToSend = message;
          this.memberInteraction.autoCloseChat = autoCloseChat;
          this.memberInteraction.maxMembersToInteract = maxMembers;
          
          // Actualizar estado y UI
          this.isInteracting = true;
          startButton.style.backgroundColor = '#dc3545';
          startButton.textContent = 'Detener Interacción';
          
          // Inicializar y comenzar la interacción
          this.memberInteraction.init(memberElements, { delay });
          await this.memberInteraction.startInteraction((progress) => {
            this.updateProgress(progress);
            if (progress.type === 'complete') {
              this.isInteracting = false;
              startButton.style.backgroundColor = '#4267B2';
              startButton.textContent = 'Iniciar Interacción';
            }
          });
        }

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
  async startInteraction() {
    if (this.isInteracting) {
      console.log('MemberInteractionUI: Ya hay una interacción en progreso');
      return;
    }
    
    this.isInteracting = true;
    
      // Actualizar UI
      this.startButton.style.display = 'none';
      this.stopButton.style.display = 'block';
    this.statusText.textContent = 'Iniciando interacción con miembros...';
    
    // Limpiar barra de progreso
    const progressFill = this.progressBar.querySelector('.lead-manager-interaction-progress-fill');
    if (progressFill) {
      progressFill.style.width = '0%';
    }
    
    try {
      // Iniciar la interacción con callback para actualizar progreso
      await this.memberInteraction.startInteraction(this.updateProgress.bind(this));
    } catch (error) {
      console.error('MemberInteractionUI: Error durante la interacción', error);
      this.statusText.textContent = 'Error: ' + error.message;
      this.statusText.style.color = 'red';
    } finally {
      this.finishInteraction();
    }
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
    
    // Modificar el event listener existente para incluir la funcionalidad de diagnóstico
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Si se mantiene presionada la tecla Alt, activar el modo diagnóstico
      if (e.altKey) {
        this.setupDiagnosticMode();
        console.log('Modo diagnóstico activado. Haz clic en los elementos para ver sus selectores.');
        return;
      }
      
      try {
        // Si ya está interactuando, detener
        if (this.isInteracting) {
          this.stopInteraction();
          return;
        }

        // Obtener la configuración guardada
        const config = await this.getStoredConfig();
        console.log('Configuración cargada:', config);

        // Resaltar la sección correspondiente
        this.highlightSection(sectionType);
        
        // Obtener los elementos de la sección
        const memberElements = await this.getMemberElements(sectionType);
        
        if (!memberElements || memberElements.length === 0) {
          throw new Error('No se encontraron miembros en esta sección');
        }

        // Asegurar que memberInteraction esté inicializado
        if (!this.memberInteraction) {
          this.memberInteraction = window.leadManagerPro.memberInteraction || new MemberInteraction();
          window.leadManagerPro.memberInteraction = this.memberInteraction;
        }
        
        // Inicializar el módulo de interacción
        this.memberInteraction.messageToSend = config.messageToSend;
        this.memberInteraction.autoCloseChat = config.autoCloseChat;
        this.memberInteraction.maxMembersToInteract = config.maxMembers;
        
        // Actualizar estado y UI
        this.isInteracting = true;
        button.innerHTML = this.icons.pause;
        button.style.backgroundColor = '#dc3545';
        
        // Inicializar y comenzar la interacción
        this.memberInteraction.init(memberElements, { delay: config.delay || 2000 });
        await this.memberInteraction.startInteraction((progress) => {
          if (progress.type === 'complete') {
            this.isInteracting = false;
            button.innerHTML = this.icons.play;
            button.style.backgroundColor = '#1b74e4';
          }
        });
        
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
    // Buscar títulos para todas las secciones
    const titleElements = document.querySelectorAll(this.selectors.sections.admins.title + ', ' + this.selectors.sections.common.title + ', ' + this.selectors.sections.newMembers.title);
    
    titleElements.forEach((titleElement) => {
      // Verificar si el título corresponde a alguna de las secciones
      const isAdminSection = titleElement.textContent.includes(this.selectors.sections.admins.titleText);
      const isCommonSection = titleElement.textContent.includes(this.selectors.sections.common.titleText);
      const isNewMembersSection = titleElement.textContent.includes(this.selectors.sections.newMembers.titleText);
      
      if (!isAdminSection && !isCommonSection && !isNewMembersSection) {
        return;
      }

      // Verificar si ya existe un botón para este título
      const existingButton = titleElement.parentElement.querySelector('.lmp-play-button');
      if (existingButton) {
        return;
      }

      // Determinar el tipo de sección
      let sectionType = 'admins'; // valor por defecto
      if (isCommonSection) {
        sectionType = 'common';
      } else if (isNewMembersSection) {
        sectionType = 'newMembers';
      }
      const sectionConfig = this.selectors.sections[sectionType];
      const sectionContainer = titleElement.closest(sectionConfig.container);
      
      if (!sectionContainer) {
        return;
      }

      const button = this.createPlayButton(sectionType);
      
      // Crear contenedor flex para el título y el botón
      const container = document.createElement('div');
      container.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
      `;

      // Reemplazar el título con el nuevo contenedor
      titleElement.parentNode.insertBefore(container, titleElement);
      container.appendChild(titleElement);
      container.appendChild(button);

      console.log(`Botón Play añadido a la sección de ${isAdminSection ? 'administradores' : isCommonSection ? 'miembros con cosas en común' : 'nuevos miembros del grupo'}`);
    });
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

  // Agregar después del constructor o al final de la clase, pero antes del cierre
  setupDiagnosticMode() {
    console.log('Modo diagnóstico activado: haciendo clic en elementos para identificar selectores');
    
    // Crear un indicador visual para mostrar que el modo diagnóstico está activo
    const diagnosticIndicator = document.createElement('div');
    diagnosticIndicator.id = 'lmp-diagnostic-mode';
    diagnosticIndicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background-color: rgba(255, 0, 0, 0.7);
      color: white;
      padding: 10px;
      border-radius: 5px;
      z-index: 10000;
      font-size: 12px;
      max-width: 300px;
      max-height: 300px;
      overflow: auto;
    `;
    diagnosticIndicator.innerHTML = '<div>Modo diagnóstico ACTIVO</div><div>Haz clic en los elementos para ver sus selectores</div><div id="diagnostic-log"></div>';
    document.body.appendChild(diagnosticIndicator);
    
    // Función para generar un selector para un elemento
    const generateSelector = (element) => {
      // Colección de selectores posibles
      let selectors = [];
      
      // Agregar por atributos principales
      if (element.id) {
        selectors.push(`#${element.id}`);
      }
      
      if (element.hasAttribute('class')) {
        const classNames = Array.from(element.classList).join('.');
        if (classNames) {
          selectors.push(`.${classNames}`);
        }
      }
      
      // Atributos específicos que podrían ser útiles
      ['role', 'aria-label', 'data-testid', 'name', 'type'].forEach(attr => {
        if (element.hasAttribute(attr)) {
          selectors.push(`[${attr}="${element.getAttribute(attr)}"]`);
        }
      });
      
      // Tipo del elemento
      selectors.push(element.tagName.toLowerCase());
      
      // Selector completo (camino del DOM)
      let current = element;
      let path = [];
      while (current && current !== document.body) {
        let selector = current.tagName.toLowerCase();
        
        if (current.id) {
          selector = `#${current.id}`;
        } else if (current.hasAttribute('aria-label')) {
          selector = `${selector}[aria-label="${current.getAttribute('aria-label')}"]`;
        } else if (current.classList.length > 0) {
          const importantClasses = Array.from(current.classList)
            .filter(cls => !cls.includes(' ') && cls.length > 0 && cls.length < 10)
            .slice(0, 2);
          if (importantClasses.length > 0) {
            selector = `${selector}.${importantClasses.join('.')}`;
          }
        }
        
        path.unshift(selector);
        current = current.parentElement;
      }
      
      selectors.push(path.join(' > '));
      
      return selectors;
    };
    
    // Agregar listener a toda la página
    document.addEventListener('click', (event) => {
      // Ignorar si se hace clic en nuestro propio indicador diagnóstico
      if (event.target.closest('#lmp-diagnostic-mode')) {
        return;
      }

      const element = event.target;
      const selectors = generateSelector(element);
      
      // Mostrar información en consola
      console.log('Elemento clicado:', element);
      console.log('Selectores posibles:', selectors);
      console.log('HTML:', element.outerHTML.substring(0, 300) + '...');
      console.log('Atributos:', Object.fromEntries(
        Array.from(element.attributes).map(attr => [attr.name, attr.value])
      ));
      
      // Mostrar en el indicador visual
      const log = document.getElementById('diagnostic-log');
      if (log) {
        const entry = document.createElement('div');
        entry.style.cssText = 'margin-top: 10px; border-top: 1px solid white; padding-top: 5px;';
        
        let selectorText = selectors.map(s => `<div style="margin: 2px 0; word-break: break-all;">${s}</div>`).join('');
        
        entry.innerHTML = `
          <div style="font-weight: bold; margin-bottom: 5px;">Elemento: ${element.tagName}</div>
          <div style="margin-bottom: 5px;">Aria-Label: ${element.getAttribute('aria-label') || 'ninguno'}</div>
          <div style="margin-bottom: 5px;">Role: ${element.getAttribute('role') || 'ninguno'}</div>
          <div style="font-size: 10px; margin-bottom: 5px;">Selectores principales:</div>
          ${selectorText}
        `;
        
        log.prepend(entry);
        
        // Limitar el número de entradas para evitar demasiado contenido
        if (log.children.length > 5) {
          log.removeChild(log.lastChild);
        }
      }
    }, true);
    
    // Método para desactivar el modo diagnóstico
    window.disableLMPDiagnosticMode = () => {
      const indicator = document.getElementById('lmp-diagnostic-mode');
      if (indicator) {
        document.body.removeChild(indicator);
      }
      console.log('Modo diagnóstico desactivado');
    };
    
    return {
      disable: window.disableLMPDiagnosticMode
    };
  }
}

// Exportar la clase
window.leadManagerPro = window.leadManagerPro || {};
window.leadManagerPro.memberInteractionUI = new MemberInteractionUI();
