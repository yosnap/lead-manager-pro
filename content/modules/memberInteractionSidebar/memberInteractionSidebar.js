// Módulo para el sidebar de interacción con miembros de grupo

class MemberInteractionSidebar {
  constructor() {
    this.container = null;
    this.isVisible = false;
    this.autoCloseChat = true;
    this.maxMembersToInteract = 10;
    this.waitTime = 2; // en segundos
    this.messages = ['Hola, este es un mensaje de prueba desde la plataforma, has caso omiso ya que solo sirve para pruebas. !Un saludo!'];
    this.selectedMemberType = 'admins';
    this.interactionInProgress = false;
    this.memberInteraction = null;
    this.interactionHistory = null;
    this.sidebarUI = null;
    this.continueFromLast = true;
  }
  
  init() {
    console.log('MemberInteractionSidebar: Initializing module');
    
    // Inicializar el módulo de interacción con miembros
    this.memberInteraction = window.leadManagerPro.memberInteraction;
    
    // Inicializar el módulo de historial de interacciones
    this.interactionHistory = window.leadManagerPro.interactionHistory;
    
    // Inicializar el módulo de UI para el sidebar
    this.sidebarUI = window.leadManagerPro.memberInteractionSidebarUI;
    if (this.sidebarUI) {
      this.sidebarUI.init();
    }
    
    return this;
  }
  
  // Cargar configuración desde Extension Storage
  async loadConfiguration() {
    try {
      const result = await new Promise(resolve => {
        chrome.storage.local.get(['leadManagerGroupSettings'], resolve);
      });
      
      if (result && result.leadManagerGroupSettings) {
        const settings = result.leadManagerGroupSettings;
        
        // Actualizar configuraciones
        this.maxMembersToInteract = settings.membersToInteract || this.maxMembersToInteract;
        this.waitTime = settings.interactionDelay || this.waitTime;
        this.autoCloseChat = settings.autoCloseChat !== undefined ? settings.autoCloseChat : this.autoCloseChat;
        this.messages = settings.messages && Array.isArray(settings.messages) ? settings.messages : [settings.messageToSend || this.messages[0]];
        this.selectedMemberType = settings.selectedMemberType || this.selectedMemberType;
        
        // Agregar nueva configuración para continuar desde el último índice
        this.continueFromLast = settings.continueFromLast !== undefined ? settings.continueFromLast : true;
        
        console.log('Configuración cargada desde Extension Storage:', settings);
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
    }
  }
  
  // Guardar configuración en Extension Storage
  async saveConfiguration(config) {
    try {
      const newConfig = {
        membersToInteract: config.maxMembersToInteract || this.maxMembersToInteract,
        interactionDelay: config.waitTime || this.waitTime,
        autoCloseChat: config.autoCloseChat !== undefined ? config.autoCloseChat : this.autoCloseChat,
        messages: config.messages || this.messages,
        selectedMemberType: config.selectedMemberType || this.selectedMemberType,
        continueFromLast: config.continueFromLast !== undefined ? config.continueFromLast : this.continueFromLast
      };
      
      await new Promise(resolve => {
        chrome.storage.local.set({
          'leadManagerGroupSettings': newConfig
        }, resolve);
      });
      
      // Actualizar las propiedades locales
      Object.assign(this, newConfig);
      
      console.log('Configuración guardada en Extension Storage:', newConfig);
      
      return true;
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      return false;
    }
  }
  // Crear el sidebar para interacción con miembros
  createSidebar() {
    // Crear contenedor principal
    const container = document.createElement('div');
    container.className = 'lead-manager-member-interaction-sidebar';
    container.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      width: 320px;
      height: 100vh;
      background-color: white;
      box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
      z-index: 9999;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    `;
    
    // Crear cabecera
    const header = document.createElement('div');
    header.className = 'lead-manager-sidebar-header';
    header.style.cssText = `
      padding: 16px;
      border-bottom: 1px solid #E4E6EB;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    
    // Título del sidebar
    const title = document.createElement('h2');
    title.textContent = 'Interacción con Miembros';
    title.style.cssText = `
      margin: 0;
      font-size: 18px;
      font-weight: bold;
      color: #050505;
    `;
    
    // Botón de cierre
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.style.cssText = `
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #65676B;
    `;
    closeButton.addEventListener('click', () => this.hide());
    
    header.appendChild(title);
    header.appendChild(closeButton);
    
    // Crear contenido principal
    const content = document.createElement('div');
    content.className = 'lead-manager-sidebar-content';
    content.style.cssText = `
      padding: 16px;
      flex: 1;
      overflow-y: auto;
    `;
    
    // Sección para seleccionar tipo de miembro
    const memberTypeContainer = document.createElement('div');
    memberTypeContainer.className = 'lead-manager-member-type';
    memberTypeContainer.style.cssText = `
      margin-bottom: 16px;
    `;
    
    const memberTypeLabel = document.createElement('label');
    memberTypeLabel.textContent = 'Tipo de miembros a interactuar:';
    memberTypeLabel.style.cssText = `
      display: block;
      margin-bottom: 8px;
      font-weight: bold;
    `;
    
    const memberTypeSelect = document.createElement('select');
    memberTypeSelect.style.cssText = `
      width: 100%;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid #CED0D4;
    `;
    
    // Opciones para el tipo de miembro
    const memberTypes = [
      { value: 'admins', label: 'Administradores y moderadores' },
      { value: 'newMembers', label: 'Nuevos miembros' },
      { value: 'common', label: 'Miembros con cosas en común' }
    ];
    
    memberTypes.forEach(type => {
      const option = document.createElement('option');
      option.value = type.value;
      option.textContent = type.label;
      option.selected = type.value === this.selectedMemberType;
      memberTypeSelect.appendChild(option);
    });
    
    memberTypeContainer.appendChild(memberTypeLabel);
    memberTypeContainer.appendChild(memberTypeSelect);
    
    // Sección para mensajes
    const messagesContainer = document.createElement('div');
    messagesContainer.className = 'lead-manager-messages';
    messagesContainer.style.cssText = `
      margin-bottom: 16px;
    `;
    
    const messagesLabel = document.createElement('label');
    messagesLabel.textContent = 'Mensaje a enviar:';
    messagesLabel.style.cssText = `
      display: block;
      margin-bottom: 8px;
      font-weight: bold;
    `;
    
    const messagesTextarea = document.createElement('textarea');
    messagesTextarea.value = this.messages[0] || '';
    messagesTextarea.style.cssText = `
      width: 100%;
      height: 100px;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid #CED0D4;
      resize: vertical;
    `;
    
    messagesContainer.appendChild(messagesLabel);
    messagesContainer.appendChild(messagesTextarea);
    
    // Sección para tiempo de espera
    const waitTimeContainer = document.createElement('div');
    waitTimeContainer.className = 'lead-manager-wait-time';
    waitTimeContainer.style.cssText = `
      margin-bottom: 16px;
    `;
    
    const waitTimeLabel = document.createElement('label');
    waitTimeLabel.textContent = 'Tiempo de espera entre interacciones (segundos):';
    waitTimeLabel.style.cssText = `
      display: block;
      margin-bottom: 8px;
      font-weight: bold;
    `;
    
    const waitTimeInput = document.createElement('input');
    waitTimeInput.type = 'number';
    waitTimeInput.min = '1';
    waitTimeInput.step = '1';
    waitTimeInput.value = this.waitTime;
    waitTimeInput.style.cssText = `
      width: 100%;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid #CED0D4;
    `;    
    waitTimeContainer.appendChild(waitTimeLabel);
    waitTimeContainer.appendChild(waitTimeInput);
    
    // Sección para opciones avanzadas
    const advancedOptionsContainer = document.createElement('div');
    advancedOptionsContainer.className = 'lead-manager-advanced-options';
    advancedOptionsContainer.style.cssText = `
      margin-bottom: 16px;
    `;
    
    const advancedOptionsTitle = document.createElement('div');
    advancedOptionsTitle.textContent = 'Opciones avanzadas:';
    advancedOptionsTitle.style.cssText = `
      font-weight: bold;
      margin-bottom: 8px;
    `;
    
    // Opciones de número máximo de interacciones
    const maxMembersContainer = document.createElement('div');
    maxMembersContainer.style.cssText = `
      margin-bottom: 12px;
    `;
    
    const maxMembersLabel = document.createElement('label');
    maxMembersLabel.textContent = 'Número máximo de miembros:';
    maxMembersLabel.style.cssText = `
      display: block;
      margin-bottom: 4px;
    `;
    
    const maxMembersInput = document.createElement('input');
    maxMembersInput.type = 'number';
    maxMembersInput.min = '1';
    maxMembersInput.value = this.maxMembersToInteract;
    maxMembersInput.style.cssText = `
      width: 100%;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid #CED0D4;
    `;
    
    maxMembersContainer.appendChild(maxMembersLabel);
    maxMembersContainer.appendChild(maxMembersInput);
    
    // Opción para cerrar chat automáticamente
    const autoCloseContainer = document.createElement('div');
    autoCloseContainer.style.cssText = `
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    `;
    
    const autoCloseCheckbox = document.createElement('input');
    autoCloseCheckbox.type = 'checkbox';
    autoCloseCheckbox.id = 'autoCloseChat';
    autoCloseCheckbox.checked = this.autoCloseChat;
    autoCloseCheckbox.style.marginRight = '8px';
    
    const autoCloseLabel = document.createElement('label');
    autoCloseLabel.htmlFor = 'autoCloseChat';
    autoCloseLabel.textContent = 'Cerrar chat automáticamente';
    
    autoCloseContainer.appendChild(autoCloseCheckbox);
    autoCloseContainer.appendChild(autoCloseLabel);
    
    // Ensamblar opciones avanzadas
    advancedOptionsContainer.appendChild(advancedOptionsTitle);
    advancedOptionsContainer.appendChild(maxMembersContainer);
    advancedOptionsContainer.appendChild(autoCloseContainer);
    
    // Sección para el historial de interacciones
    const historyContainer = document.createElement('div');
    historyContainer.id = 'lead-manager-history-container';
    historyContainer.style.cssText = `
      margin-bottom: 16px;
    `;
    
    // Agregar sección de historial si existe el módulo de UI
    if (this.sidebarUI) {
      this.sidebarUI.injectHistorySection(historyContainer);
    }
    
    // Sección para el progreso
    const progressContainer = document.createElement('div');
    progressContainer.className = 'lead-manager-progress';
    progressContainer.style.cssText = `
      margin-bottom: 16px;
    `;
    
    const progressLabel = document.createElement('div');
    progressLabel.textContent = 'Progreso:';
    progressLabel.style.cssText = `
      font-weight: bold;
      margin-bottom: 8px;
    `;
    
    // Barra de progreso
    const progressBar = document.createElement('div');
    progressBar.className = 'lead-manager-progress-bar';
    progressBar.style.cssText = `
      width: 100%;
      height: 10px;
      background-color: #E4E6EB;
      border-radius: 5px;
      overflow: hidden;
      margin-bottom: 8px;
    `;
    
    const progressFill = document.createElement('div');
    progressFill.className = 'lead-manager-progress-fill';
    progressFill.style.cssText = `
      height: 100%;
      width: 0%;
      background-color: #1877F2;
      transition: width 0.3s;
    `;
    
    progressBar.appendChild(progressFill);
    
    // Estado del progreso
    const progressStatus = document.createElement('div');
    progressStatus.className = 'lead-manager-progress-status';
    progressStatus.textContent = 'Listo para iniciar';
    progressStatus.style.cssText = `
      font-size: 12px;
      color: #65676B;
    `;
    
    // Guardar referencia para actualizar luego
    this.progressStatus = progressStatus;    
    progressContainer.appendChild(progressLabel);
    progressContainer.appendChild(progressBar);
    progressContainer.appendChild(progressStatus);
    
    // Sección para botones
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'lead-manager-buttons';
    buttonsContainer.style.cssText = `
      display: flex;
      gap: 10px;
    `;
    
    // Botón para guardar configuración
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Guardar Opciones';
    saveButton.style.cssText = `
      flex: 1;
      padding: 10px;
      background-color: #E4E6EB;
      color: #050505;
      border: none;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
    `;
    
    // Botón para iniciar interacción
    const startButton = document.createElement('button');
    startButton.textContent = 'Iniciar Interacción';
    startButton.style.cssText = `
      flex: 1;
      padding: 10px;
      background-color: #1877F2;
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
    `;
    
    // Manejar eventos para los botones
    saveButton.addEventListener('click', async () => {
      // Recopilar valores del formulario
      const message = messagesTextarea.value.trim();
      const waitTime = parseInt(waitTimeInput.value);
      const maxMembers = parseInt(maxMembersInput.value);
      const autoClose = autoCloseCheckbox.checked;
      const memberType = memberTypeSelect.value;
      
      // Validar valores
      if (!message) {
        alert('Por favor, ingrese un mensaje para enviar');
        return;
      }
      
      if (isNaN(waitTime) || waitTime < 1) {
        alert('Por favor, ingrese un tiempo de espera válido (mínimo 1 segundo)');
        return;
      }
      
      if (isNaN(maxMembers) || maxMembers < 1) {
        alert('Por favor, ingrese un número máximo de miembros válido (mínimo 1)');
        return;
      }
      
      // Obtener configuración de historial
      let continueFromLast = true;
      const continueFromLastCheckbox = document.getElementById('lmp-continue-from-last');
      if (continueFromLastCheckbox) {
        continueFromLast = continueFromLastCheckbox.checked;
      }
      
      // Guardar configuración
      await this.saveConfiguration({
        maxMembersToInteract: maxMembers,
        waitTime: waitTime,
        autoCloseChat: autoClose,
        messages: [message], // Por ahora solo un mensaje
        selectedMemberType: memberType,
        continueFromLast: continueFromLast
      });
      
      // Mostrar mensaje de éxito
      progressStatus.textContent = 'Configuración guardada correctamente';
      progressStatus.style.color = '#00C851';
      
      // Restaurar después de 3 segundos
      setTimeout(() => {
        progressStatus.textContent = 'Listo para iniciar';
        progressStatus.style.color = '#65676B';
      }, 3000);
    });
    
    // Manejar evento para iniciar interacción
    startButton.addEventListener('click', async () => {
      // Si ya hay una interacción en progreso, detenerla
      if (this.interactionInProgress) {
        startButton.textContent = 'Deteniendo...';
        startButton.disabled = true;
        await this.stopInteraction();
        return;
      }
      
      try {
        // Cambiar el estado del botón
        startButton.textContent = 'Detener';
        startButton.style.backgroundColor = '#E74C3C';
        this.interactionInProgress = true;
        
        // Reiniciar progreso
        progressFill.style.width = '0%';
        progressStatus.textContent = 'Iniciando interacción...';
        progressStatus.style.color = '#65676B';
        
        // Obtener configuración de historial
        let continueFromLast = true;
        const continueFromLastCheckbox = document.getElementById('lmp-continue-from-last');
        if (continueFromLastCheckbox) {
          continueFromLast = continueFromLastCheckbox.checked;
        }        
        // Iniciar interacción
        const success = await this.startInteraction(progressFill, progressStatus, {
          continueFromLast: continueFromLast
        });
        
        if (!success) {
          // Restaurar el botón
          startButton.textContent = 'Iniciar Interacción';
          startButton.style.backgroundColor = '#1877f2';
          this.interactionInProgress = false;
        }
      } catch (error) {
        console.error('Error al iniciar interacción:', error);
        // Restaurar el botón
        startButton.textContent = 'Iniciar Interacción';
        startButton.style.backgroundColor = '#1877f2';
        this.interactionInProgress = false;
        progressStatus.textContent = `Error: ${error.message}`;
      }
    });
    
    buttonsContainer.appendChild(saveButton);
    buttonsContainer.appendChild(startButton);
    
    // Ensamblar todos los componentes
    content.appendChild(memberTypeContainer);
    content.appendChild(messagesContainer);
    content.appendChild(waitTimeContainer);
    content.appendChild(advancedOptionsContainer);
    content.appendChild(historyContainer); // Nueva sección de historial
    content.appendChild(progressContainer);
    content.appendChild(buttonsContainer);
    
    container.appendChild(header);
    container.appendChild(content);
    
    this.container = container;
    return container;
  }
  
  show() {
    if (!this.container) {
      this.container = this.createSidebar();
      document.body.appendChild(this.container);
    }
    
    this.container.style.transform = 'translateX(0)';
    this.isVisible = true;
    
    // Actualizar estadísticas de historial si está disponible
    if (this.sidebarUI) {
      this.sidebarUI.updateHistoryStats();
    }
  }
  
  hide() {
    if (this.container) {
      this.container.style.transform = 'translateX(100%)';
      this.isVisible = false;
    }
  }
  
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }
  
  async startInteraction(progressFill, progressStatus, options = {}) {
    try {
      if (!this.memberInteraction) {
        throw new Error('El módulo de interacción con miembros no está disponible');
      }
      
      // Asegurarse de que estamos en una página de grupo
      if (!window.location.href.includes('/groups/')) {
        throw new Error('Esta funcionalidad solo está disponible en páginas de grupos de Facebook');
      }
      
      // Cargar la configuración actualizada
      await this.loadConfiguration();
      
      // Configurar el módulo de interacción
      this.memberInteraction.autoCloseChat = this.autoCloseChat;
      this.memberInteraction.messages = this.messages;
      this.memberInteraction.messageToSend = this.messages[0] || '';
      this.memberInteraction.interactionDelay = this.waitTime * 1000;
      this.memberInteraction.maxMembersToInteract = this.maxMembersToInteract;
      
      console.log('Iniciando interacción con configuración:');
      console.log('- maxMembersToInteract:', this.maxMembersToInteract);
      console.log('- waitTime:', this.waitTime);
      console.log('- autoCloseChat:', this.autoCloseChat);
      console.log('- Mensajes disponibles:', this.messages.length);
      console.log('- Continuar desde último índice:', options.continueFromLast);
      
      // Si ya hay una interacción en curso, detenerla primero
      if (this.memberInteraction.isInteracting) {
        this.memberInteraction.stopInteraction = true;
        await new Promise(resolve => setTimeout(resolve, 500));
      }      
      // Verificar si estamos en la página de miembros
      if (!window.location.href.includes('/members')) {
        // Navegar a la página de miembros
        const groupIdMatch = window.location.href.match(/\/groups\/([^\/]+)/);
        if (groupIdMatch && groupIdMatch[1]) {
          const groupId = groupIdMatch[1];
          window.location.href = `https://www.facebook.com/groups/${groupId}/members`;
          return;
        } else {
          throw new Error('No se pudo determinar el ID del grupo desde la URL');
        }
      }
      
      // Esperar a que la página cargue completamente
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Buscar la sección correspondiente al tipo de miembro seleccionado
      const memberSelectors = {
        admins: {
          title: 'Administradores y moderadores',
          container: '.x1n2onr6.x1ja2u2z.x9f619.x78zum5.xdt5ytf.x2lah0s.x193iq5w.xx6bls6.x1jx94hy',
          userItem: 'div[data-visualcompletion="ignore-dynamic"][role="listitem"]'
        },
        newMembers: {
          title: 'Nuevos miembros del grupo',
          container: '.x1n2onr6.x1ja2u2z.x9f619.x78zum5.xdt5ytf.x2lah0s.x193iq5w.xx6bls6.x1jx94hy',
          userItem: 'div[data-visualcompletion="ignore-dynamic"][role="listitem"]'
        },
        common: {
          title: 'Miembros con cosas en común',
          container: '.x1n2onr6.x1ja2u2z.x9f619.x78zum5.xdt5ytf.x2lah0s.x193iq5w.xx6bls6.x1jx94hy',
          userItem: 'div[data-visualcompletion="ignore-dynamic"][role="listitem"]'
        }
      };
      
      const selector = memberSelectors[this.selectedMemberType] || memberSelectors.admins;
      
      // Buscar todas las secciones con el selector
      const sections = document.querySelectorAll(selector.container);
      let targetSection = null;
      
      for (const section of sections) {
        const titleElement = section.querySelector('h2, h3');
        if (titleElement && titleElement.textContent.includes(selector.title)) {
          targetSection = section;
          break;
        }
      }
      
      if (!targetSection) {
        throw new Error(`No se encontró la sección "${selector.title}". Asegúrate de estar en la página de miembros del grupo`);
      }
      
      // Buscar los elementos de miembros
      const memberElements = targetSection.querySelectorAll(selector.userItem);
      
      if (!memberElements || memberElements.length === 0) {
        throw new Error(`No se encontraron miembros en la sección de ${selector.title}`);
      }
      
      console.log(`Se encontraron ${memberElements.length} miembros en la sección ${selector.title}`);
      
      // Iniciar la interacción con los miembros, pasando las opciones de continuación
      this.memberInteraction.init(memberElements, { 
        delay: this.waitTime * 1000
      });
      
      const startTime = Date.now();
      
      // Actualizar UI indicando que está iniciando
      progressFill.style.width = '5%';
      progressStatus.textContent = `Preparando interacción con ${memberElements.length} miembros (límite máximo: ${this.maxMembersToInteract})...`;
      
      // Iniciar la interacción con opciones de historial
      await this.memberInteraction.startInteraction((progress) => {
        if (progress.type === 'progress') {
          // Calcular el porcentaje de progreso
          const percent = Math.round((progress.memberIndex / progress.totalMembers) * 100);
          
          // Actualizar la barra de progreso
          progressFill.style.width = `${percent}%`;
          
          // Mostrar índice real (considerando desde donde empezamos)
          const actualIndex = progress.actualMemberIndex !== undefined ? 
            progress.actualMemberIndex : progress.memberIndex;
            
          // Actualizar el texto de estado
          if (options.continueFromLast) {
            progressStatus.textContent = `Procesando miembro ${actualIndex + 1} (índice real: ${progress.memberIndex + 1} de ${progress.totalMembers})`;
          } else {
            progressStatus.textContent = `Procesando miembro ${progress.memberIndex + 1} de ${progress.totalMembers}`;
          }
          
          if (progress.messageOpened) {
            progressStatus.textContent += ' - Mensaje enviado';
          }        } else if (progress.type === 'complete') {
          // Actualizar UI indicando que ha finalizado
          progressFill.style.width = '100%';
          
          const duration = Math.round((Date.now() - startTime) / 1000);
          const minutes = Math.floor(duration / 60);
          const seconds = duration % 60;
          
          // Mensaje específico si se alcanzó el límite máximo
          if (progress.limitReached) {
            progressStatus.textContent = `Interacción completada. Se alcanzó el límite máximo de ${progress.maxMembersLimit} miembros. Tiempo: ${minutes ? `${minutes}m ` : ''}${seconds}s.`;
          } else {
            progressStatus.textContent = `Interacción completada. Se procesaron ${progress.processedMembers} de ${progress.totalMembers} miembros en ${minutes ? `${minutes}m ` : ''}${seconds}s.`;
          }
          
          this.interactionInProgress = false;
          
          // Actualizar el botón
          const startButton = this.container.querySelector('button:last-child');
          if (startButton) {
            startButton.textContent = 'Iniciar Interacción';
            startButton.style.backgroundColor = '#1877f2';
          }
          
          // Actualizar estadísticas de historial si está disponible
          if (this.sidebarUI) {
            this.sidebarUI.updateHistoryStats();
          }
        } else if (progress.type === 'error') {
          // Actualizar UI indicando que ha ocurrido un error
          progressStatus.textContent = `Error: ${progress.error.message}`;
          progressStatus.style.color = '#dc3545';
        }
      }, options);
      
      return true;
    } catch (error) {
      console.error('Error en startInteraction:', error);
      progressStatus.textContent = `Error: ${error.message}`;
      progressStatus.style.color = '#dc3545';
      
      return false;
    }
  }
  
  async stopInteraction() {
    if (this.memberInteraction) {
      this.memberInteraction.stopInteraction = true;
      this.progressStatus.textContent = 'Deteniendo interacción...';
      // Esperar un momento para que la interacción se detenga
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    this.interactionInProgress = false;
  }
  
  // Método para verificar si estamos en una página de grupo
  isInGroupPage() {
    return window.location.href.includes('/groups/');
  }
  
  // Método para navegar a la página de miembros del grupo
  navigateToMembersPage() {
    if (!this.isInGroupPage()) {
      console.error('No estamos en una página de grupo');
      return false;
    }
    
    // Extraer el ID del grupo de la URL
    const groupIdMatch = window.location.href.match(/\/groups\/([^\/]+)/);
    if (!groupIdMatch || !groupIdMatch[1]) {
      console.error('No se pudo extraer el ID del grupo de la URL');
      return false;
    }
    
    const groupId = groupIdMatch[1];
    window.location.href = `https://www.facebook.com/groups/${groupId}/members`;
    return true;
  }
}

// Exportar la clase
window.leadManagerPro = window.leadManagerPro || {};
window.leadManagerPro.MemberInteractionSidebar = MemberInteractionSidebar; // Exportar la clase
window.leadManagerPro.memberInteractionSidebar = new MemberInteractionSidebar(); // Instancia