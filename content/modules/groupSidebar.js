// Módulo para el sidebar específico para páginas de grupos
// Este sidebar contiene herramientas y configuraciones específicas para la interacción con grupos de Facebook

class GroupSidebar {
  constructor() {
    this.container = null;
    this.isVisible = false;
    this.settings = {
      membersToInteract: 10,
      interactionDelay: 3000,
      messageToSend: 'Hola, este es un mensaje de prueba desde la plataforma, has caso omiso ya que solo sirve para pruebas. !Un saludo!',
      messages: ['Hola, este es un mensaje de prueba desde la plataforma, has caso omiso ya que solo sirve para pruebas. !Un saludo!'],
      autoCloseChat: true
    };
    this.eventListeners = [];
    this.messageTextareas = []; // Para almacenar referencias a los textareas de mensajes
    this.authenticationRequired = true; // Marcar como requiere autenticación
    this.loginComponent = null; // Para el componente de login
  }

  // Verificar autenticación antes de ejecutar métodos críticos
  checkAuthentication() {
    if (!this.authenticationRequired) return true;
    
    const authWrapper = window.LeadManagerPro?.AuthenticationWrapper;
    if (authWrapper && !authWrapper.canModuleExecute('groupSidebar')) {
      return false;
    }
    
    return true;
  }

  // Inicializar el sidebar
  async init() {
    console.log('GroupSidebar: Inicializando sidebar para páginas de grupo');
    
    // Configurar listener para cambios de autenticación
    this.setupAuthListener();
    
    // Verificar autenticación antes de mostrar contenido
    if (!this.checkAuthentication()) {
      console.log('GroupSidebar: Inicialización bloqueada - autenticación requerida');
      this.showAuthenticationRequired();
      return this;
    }
    
    // Cargar configuraciones desde Extension Storage
    await this.loadSettings();
    
    return this;
  }
  
  // Configurar listener para cambios de autenticación
  setupAuthListener() {
    // Listener para mensajes de cambio de autenticación
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'auth_state_changed') {
          console.log('GroupSidebar: Cambio de autenticación detectado:', message.authenticated);
          
          if (message.authenticated) {
            // Re-inicializar con contenido completo
            this.handleSuccessfulAuth();
          } else {
            // Mostrar formulario de autenticación
            this.showAuthenticationRequired();
          }
        }
      });
    }
    
    // Listener para eventos de ventana
    window.addEventListener('message', (event) => {
      if (event.data?.action === 'auth_state_changed') {
        if (event.data.authenticated) {
          this.handleSuccessfulAuth();
        } else {
          this.showAuthenticationRequired();
        }
      }
    });
  }

  // Cargar configuraciones desde Extension Storage
  async loadSettings() {
    try {
      // Intentar obtener configuraciones del Extension Storage
      const result = await new Promise(resolve => {
        chrome.storage.local.get(['leadManagerGroupSettings'], result => resolve(result));
      });
      
      if (result && result.leadManagerGroupSettings) {
        this.settings = { ...this.settings, ...result.leadManagerGroupSettings };
        
        // Asegurarse de que messages sea un array
        if (!Array.isArray(this.settings.messages)) {
          // Si no existe messages pero existe messageToSend, usarlo como primer mensaje
          if (this.settings.messageToSend) {
            this.settings.messages = [this.settings.messageToSend];
          } else {
            this.settings.messages = [];
          }
        }
        
        // Si messages está vacío pero hay messageToSend, añadirlo
        if (this.settings.messages.length === 0 && this.settings.messageToSend) {
          this.settings.messages.push(this.settings.messageToSend);
        }
        
        // Si hay messages pero no hay messageToSend, usar el primero
        if (this.settings.messages.length > 0 && !this.settings.messageToSend) {
          this.settings.messageToSend = this.settings.messages[0];
        }
      }
      
      console.log('GroupSidebar: Configuraciones cargadas:', this.settings);
      return this.settings;
    } catch (error) {
      console.error('GroupSidebar: Error al cargar configuraciones:', error);
      return this.settings;
    }
  }

  // Guardar configuraciones en Extension Storage
  async saveSettings() {
    try {
      // Asegurarse de que messages sea un array
      if (!Array.isArray(this.settings.messages)) {
        this.settings.messages = [];
      }
      
      // Filtrar mensajes vacíos
      this.settings.messages = this.settings.messages.filter(msg => msg && msg.trim() !== '');
      
      // Asegurarse de que messageToSend esté actualizado (para compatibilidad)
      if (this.settings.messages.length > 0) {
        this.settings.messageToSend = this.settings.messages[0];
      }
      
      await new Promise(resolve => {
        chrome.storage.local.set({ leadManagerGroupSettings: this.settings }, resolve);
      });
      
      console.log('GroupSidebar: Configuraciones guardadas:', this.settings);
      return true;
    } catch (error) {
      console.error('GroupSidebar: Error al guardar configuraciones:', error);
      return false;
    }
  }

  // Mostrar el sidebar
  show() {
    // Verificar autenticación antes de mostrar contenido
    if (!this.checkAuthentication()) {
      this.showAuthenticationRequired();
      return;
    }
    
    if (!this.container) {
      this.createSidebar();
    }
    
    if (this.container) {
      this.container.style.right = '0';
      this.isVisible = true;
    }
  }

  // Mostrar formulario de autenticación requerida
  showAuthenticationRequired() {
    console.log('GroupSidebar: Mostrando formulario de autenticación');
    
    // Crear container si no existe
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'lead-manager-group-sidebar';
      this.container.style.cssText = `
        position: fixed;
        top: 0;
        right: 0;
        width: 350px;
        height: 100vh;
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        border-left: 1px solid #e1e5e9;
        box-shadow: -2px 0 10px rgba(0,0,0,0.1);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        overflow-y: auto;
        transition: right 0.3s ease;
      `;
      document.body.appendChild(this.container);
    }
    
    // Limpiar contenido existente
    this.container.innerHTML = '';
    
    // Crear contenedor para el login
    const authContainer = document.createElement('div');
    authContainer.id = 'group-sidebar-auth-container';
    authContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100%;
      padding: 40px 30px;
      text-align: center;
    `;
    
    // Agregar header
    const header = document.createElement('div');
    header.innerHTML = `
      <div style="margin-bottom: 30px;">
        <div style="width: 80px; height: 80px; margin: 0 auto 20px auto; background: #4267B2; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
          </svg>
        </div>
        <h2 style="margin: 0 0 8px 0; color: #1c1e21; font-size: 20px; font-weight: 600;">Herramientas de Grupo</h2>
        <p style="margin: 0; color: #65676b; font-size: 14px; line-height: 1.4;">Inicia sesión para acceder a las herramientas de interacción con miembros del grupo</p>
      </div>
    `;
    
    authContainer.appendChild(header);
    
    // Intentar usar el LoginComponent si está disponible
    if (window.LeadManagerPro?.LoginComponent) {
      const loginContainer = document.createElement('div');
      loginContainer.id = 'group-sidebar-login-container';
      loginContainer.style.width = '100%';
      authContainer.appendChild(loginContainer);
      
      // Crear instancia del LoginComponent
      this.loginComponent = new window.LeadManagerPro.LoginComponent('group-sidebar-login-container');
      this.loginComponent.onSuccess(() => {
        console.log('GroupSidebar: Login exitoso, reinicializando...');
        this.handleSuccessfulAuth();
      });
      
    } else {
      // Fallback: mensaje básico
      const fallbackMessage = document.createElement('div');
      fallbackMessage.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-top: 20px;">
          <p style="margin: 0 0 15px 0; color: #1c1e21; font-weight: 500;">Autenticación Requerida</p>
          <p style="margin: 0 0 15px 0; color: #65676b; font-size: 13px;">Para usar las herramientas de grupo, inicia sesión haciendo clic en el icono de la extensión en tu navegador.</p>
          <button id="group-sidebar-open-popup" style="background: #4267B2; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px;">
            Iniciar Sesión
          </button>
        </div>
      `;
      authContainer.appendChild(fallbackMessage);
      
      // Event listener para el botón fallback
      const openPopupBtn = fallbackMessage.querySelector('#group-sidebar-open-popup');
      if (openPopupBtn) {
        openPopupBtn.addEventListener('click', () => {
          try {
            chrome.runtime.sendMessage({ action: 'open_popup' });
          } catch (error) {
            console.error('Error al abrir popup:', error);
          }
        });
      }
    }
    
    this.container.appendChild(authContainer);
    
    // Mostrar el sidebar
    this.container.style.right = '0';
    this.isVisible = true;
  }
  
  // Manejar autenticación exitosa
  handleSuccessfulAuth() {
    // Limpiar el componente de login
    if (this.loginComponent) {
      this.loginComponent.destroy();
      this.loginComponent = null;
    }
    
    // Reinicializar el sidebar con contenido completo
    setTimeout(() => {
      this.init().then(() => {
        // Recrear el sidebar con el contenido normal
        if (this.container) {
          this.container.remove();
          this.container = null;
        }
        this.createSidebar();
        this.show();
      });
    }, 500);
  }

  // Ocultar el sidebar
  hide() {
    if (this.container) {
      this.container.style.right = '-350px';
      this.isVisible = false;
    }
  }

  // Crear el sidebar y sus elementos
  createSidebar() {
    // Verificar autenticación antes de crear contenido
    if (!this.checkAuthentication()) {
      this.showAuthenticationRequired();
      return;
    }
    
    // Crear contenedor principal
    this.container = document.createElement('div');
    this.container.id = 'lead-manager-group-sidebar';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      right: -350px;
      width: 300px;
      height: 100vh;
      background-color: white;
      box-shadow: -2px 0 5px rgba(0, 0, 0, 0.2);
      z-index: 9999;
      transition: right 0.3s ease;
      padding: 20px;
      overflow-y: auto;
      font-family: Arial, sans-serif;
    `;
    
    // Crear contenido HTML del sidebar
    this.container.innerHTML = `
      <div class="lmp-sidebar-content">
        <div class="lmp-sidebar-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #4267B2;">Lead Manager Pro</h2>
          <button id="lmp-close-sidebar" style="background: none; border: none; cursor: pointer; font-size: 20px;">×</button>
        </div>
        
        <div class="lmp-section" style="margin-bottom: 20px;">
          <h3 style="margin-top: 0; margin-bottom: 10px; color: #4267B2;">Herramientas</h3>
          <div class="lmp-actions" style="display: flex; flex-direction: column; gap: 10px;">
            <button id="lmp-count-members-btn" class="lmp-btn" style="padding: 8px 12px; background-color: #42b883; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Contar miembros
            </button>
            <button id="lmp-interact-members-btn" class="lmp-btn" style="padding: 8px 12px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Interactuar con miembros
            </button>
          </div>
        </div>
        
        <div class="lmp-section" style="margin-bottom: 20px;">
          <h3 style="margin-top: 0; margin-bottom: 10px; color: #4267B2;">Configuración de interacción</h3>
          
          <div class="lmp-form-group" style="margin-bottom: 15px;">
            <label for="lmp-members-count" style="display: block; margin-bottom: 5px; font-weight: 500;">Número de miembros a interactuar:</label>
            <input type="number" id="lmp-members-count" value="${this.settings.membersToInteract}" min="1" max="100" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <small style="color: #777; font-size: 12px; display: block; margin-top: 4px;">Número máximo de miembros con los que interactuar en una sesión</small>
          </div>
          
          <div class="lmp-form-group" style="margin-bottom: 15px;">
            <label for="lmp-interaction-delay" style="display: block; margin-bottom: 5px; font-weight: 500;">Tiempo entre interacciones (ms):</label>
            <input type="number" id="lmp-interaction-delay" value="${this.settings.interactionDelay}" min="1000" step="500" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <small style="color: #777; font-size: 12px; display: block; margin-top: 4px;">Tiempo de espera en milisegundos entre cada interacción</small>
          </div>
          
          <div class="lmp-form-group" style="margin-bottom: 15px;">
            <label for="lmp-message-to-send" style="display: block; margin-bottom: 5px; font-weight: 500;">Mensaje a enviar en el chat:</label>
            <textarea id="lmp-message-to-send" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; min-height: 80px; resize: vertical;">${this.settings.messageToSend}</textarea>
            <small style="color: #777; font-size: 12px; display: block; margin-top: 4px;">Mensaje que se enviará a cada miembro en el chat privado</small>
          </div>
          
          <div class="lmp-form-group" style="margin-bottom: 15px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox" id="lmp-auto-close-chat" ${this.settings.autoCloseChat ? 'checked' : ''} style="margin: 0;">
              <span>Cerrar ventana de chat automáticamente</span>
            </label>
            <small style="color: #777; font-size: 12px; display: block; margin-top: 4px; margin-left: 24px;">Si está marcado, se cerrará la ventana de chat después de enviar el mensaje</small>
          </div>
          
          <button id="lmp-save-settings" class="lmp-btn" style="padding: 8px 12px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%;">
            Guardar configuración
          </button>
        </div>
        
        <div class="lmp-section" style="margin-bottom: 20px;">
          <h3 style="margin-top: 0; margin-bottom: 10px; color: #4267B2;">Estadísticas</h3>
          <div id="lmp-stats-container" style="padding: 10px; background-color: #f5f6f7; border-radius: 4px;">
            <p><strong>Grupo actual:</strong> <span id="lmp-current-group-name">Cargando...</span></p>
            <p><strong>Miembros totales:</strong> <span id="lmp-total-members">-</span></p>
            <p><strong>Interacciones realizadas:</strong> <span id="lmp-interactions-count">0</span></p>
          </div>
        </div>
      </div>
    `;
    
    // Agregar al DOM
    document.body.appendChild(this.container);
    
    // Configurar event listeners
    this.setupEventListeners();
    
    // Obtener información del grupo actual
    this.updateGroupInfo();
  }
  
  // Configurar los event listeners de los elementos del sidebar
  setupEventListeners() {
    // Botón de cerrar
    const closeBtn = this.container.querySelector('#lmp-close-sidebar');
    if (closeBtn) {
      const handler = () => this.hide();
      closeBtn.addEventListener('click', handler);
      this.addEventListenerRef(closeBtn, 'click', handler);
    }
    
    // Botón de contar miembros
    const countMembersBtn = this.container.querySelector('#lmp-count-members-btn');
    if (countMembersBtn) {
      const handler = () => this.countMembers();
      countMembersBtn.addEventListener('click', handler);
      this.addEventListenerRef(countMembersBtn, 'click', handler);
    }
    
    // Botón de interactuar con miembros
    const interactMembersBtn = this.container.querySelector('#lmp-interact-members-btn');
    if (interactMembersBtn) {
      const handler = () => this.interactWithMembers();
      interactMembersBtn.addEventListener('click', handler);
      this.addEventListenerRef(interactMembersBtn, 'click', handler);
    }
    
    // Botón de guardar configuración
    const saveSettingsBtn = this.container.querySelector('#lmp-save-settings');
    if (saveSettingsBtn) {
      const handler = () => this.updateSettings();
      saveSettingsBtn.addEventListener('click', handler);
      this.addEventListenerRef(saveSettingsBtn, 'click', handler);
    }
    
    // Inputs de configuración (para actualizar en tiempo real)
    const allInputs = this.container.querySelectorAll('input, textarea');
    allInputs.forEach(input => {
      const handler = () => this.updateSettingPreview(input);
      input.addEventListener('input', handler);
      this.addEventListenerRef(input, 'input', handler);
    });
    
    // Cargar opciones generales guardadas
    this.loadGeneralOptions();
  }
  
  // Inicializar el acordeón después de crear el DOM
  initializeAccordion() {
    // Obtener todos los botones del acordeón
    const accordionButtons = this.container.querySelectorAll('.lmp-accordion-button');
    
    // Añadir event listeners a los botones
    accordionButtons.forEach(button => {
      const handler = () => {
        // Toggle active class
        button.classList.toggle('active');
        
        // Cambiar el icono
        const icon = button.querySelector('.lmp-accordion-icon');
        if (icon) {
          icon.textContent = button.classList.contains('active') ? '-' : '+';
        }
        
        // Toggle panel de contenido
        const content = button.nextElementSibling;
        if (content) {
          if (content.style.maxHeight !== '0px' && content.style.maxHeight !== '') {
            content.style.maxHeight = '0px';
          } else {
  // Cargar opciones generales guardadas
  loadGeneralOptions() {
    try {
      if (window.leadManagerPro && window.leadManagerPro.generalOptions) {
        const generalOptions = window.leadManagerPro.generalOptions.getAllOptions();
        console.log('GroupSidebar: Opciones generales cargadas:', generalOptions);
      }
    } catch (error) {
      console.error('GroupSidebar: Error al cargar opciones generales:', error);
    }
  }
  
  // Agregar referencia de event listener para poder limpiarlos después
  addEventListenerRef(element, type, handler) {
    this.eventListeners.push({ element, type, handler });
  }
  
  // Limpiar todos los event listeners para evitar memory leaks
  clearEventListeners() {
    this.eventListeners.forEach(({ element, type, handler }) => {
      element.removeEventListener(type, handler);
    });
    this.eventListeners = [];
  }
  
  // Actualizar configuraciones desde los inputs
  updateSettings() {
    try {
      // Obtener valores de los campos para interacción con miembros
      const membersCount = parseInt(this.container.querySelector('#lmp-members-count').value, 10);
      const interactionDelay = parseInt(this.container.querySelector('#lmp-interaction-delay').value, 10);
      const messageToSend = this.container.querySelector('#lmp-message-to-send').value.trim();
      const autoCloseChat = this.container.querySelector('#lmp-auto-close-chat').checked;
      
      // Validar valores
      if (isNaN(membersCount) || membersCount < 1) {
        alert('Por favor, introduce un número válido de miembros a interactuar (mínimo 1)');
        return false;
      }
      
      if (isNaN(interactionDelay) || interactionDelay < 1000) {
        alert('Por favor, introduce un tiempo de espera válido (mínimo 1000 ms)');
        return false;
      }
      
      if (!messageToSend) {
        alert('Por favor, introduce un mensaje para enviar a los miembros');
        return false;
      }
      
      // Actualizar configuraciones de interacción de miembros
      this.settings.membersToInteract = membersCount;
      this.settings.interactionDelay = interactionDelay;
      this.settings.messageToSend = messageToSend;
      this.settings.messages = [messageToSend]; // Para compatibilidad con el sistema anterior
      this.settings.autoCloseChat = autoCloseChat;
      
      // Guardar configuraciones de interacción
      this.saveSettings();
      
      // Actualizar también el sidebar flotante si existe
      this.updateFloatingSidebar([messageToSend]);
      
      // Mostrar mensaje de éxito
      this.showToast('Configuración guardada correctamente');
      
      return true;
    } catch (error) {
      console.error('Error al actualizar configuraciones:', error);
      this.showToast('Error al guardar la configuración', true);
      return false;
    }
  }
  
  // Actualizar el sidebar flotante con los mensajes
  updateFloatingSidebar(messages) {
    try {
      // Buscar el sidebar flotante
      const floatingSidebar = document.querySelector('.lead-manager-interaction-ui');
      if (!floatingSidebar) {
        console.log('Sidebar flotante no encontrado para actualizar');
        return;
      }
      
      // Si existe la instancia de MemberInteractionUI, actualizar su configuración
      if (window.leadManagerPro && window.leadManagerPro.memberInteractionUI) {
        const memberInteractionUI = window.leadManagerPro.memberInteractionUI;
        
        // Actualizar la configuración
        if (memberInteractionUI.memberInteraction) {
          memberInteractionUI.memberInteraction.messages = messages;
          memberInteractionUI.memberInteraction.messageToSend = messages[0];
          memberInteractionUI.memberInteraction.membersToInteract = this.settings.membersToInteract;
          memberInteractionUI.memberInteraction.interactionDelay = this.settings.interactionDelay;
          memberInteractionUI.memberInteraction.autoCloseChat = this.settings.autoCloseChat;
        }
        
        console.log('MemberInteractionUI actualizado con la configuración');
      }
    } catch (error) {
      console.error('Error al actualizar el sidebar flotante:', error);
    }
  }
  
  // Actualizar previsualización de configuraciones
  updateSettingPreview(input) {
    // Actualizar la previsualización de la configuración en tiempo real
    // Por ahora, no hacemos nada aquí
  }
  
  // Función para contar miembros del grupo
  countMembers() {
    try {
      // Verificar si existe la instancia de groupMemberFinder
      if (!window.leadManagerPro || !window.leadManagerPro.groupMemberFinder) {
        this.showToast('No se ha encontrado el módulo de conteo de miembros', true);
        return;
      }
      
      // Obtener la instancia de groupMemberFinder
      const groupMemberFinder = window.leadManagerPro.groupMemberFinder;
      
      // Iniciar el conteo de miembros
      if (groupMemberFinder.findMembers) {
        groupMemberFinder.findMembers();
        this.showToast('Conteo de miembros iniciado');
        
        // Actualizar estadísticas después de un tiempo
        setTimeout(() => {
          this.updateMemberCount();
        }, 2000);
      } else {
        this.showToast('Función de conteo no disponible', true);
      }
    } catch (error) {
      console.error('Error al contar miembros:', error);
      this.showToast('Error al contar miembros', true);
    }
  }
  
  // Función para interactuar con miembros
  interactWithMembers() {
    try {
      // Verificar si existe la instancia de memberInteractionUI
      if (!window.leadManagerPro || !window.leadManagerPro.memberInteractionUI) {
        this.showToast('No se ha encontrado el módulo de interacción con miembros', true);
        return;
      }
      
      // Obtener la instancia de memberInteractionUI
      const memberInteractionUI = window.leadManagerPro.memberInteractionUI;
      
      // Actualizar configuraciones en memberInteractionUI
      if (memberInteractionUI.memberInteraction) {
        memberInteractionUI.memberInteraction.membersToInteract = this.settings.membersToInteract;
        memberInteractionUI.memberInteraction.interactionDelay = this.settings.interactionDelay;
        memberInteractionUI.memberInteraction.messages = this.settings.messages;
        memberInteractionUI.memberInteraction.messageToSend = this.settings.messageToSend;
        memberInteractionUI.memberInteraction.autoCloseChat = this.settings.autoCloseChat;
      }
      
      // Buscar el sidebar flotante
      let floatingSidebar = document.querySelector('.lead-manager-interaction-ui');
      
      // Si no existe, crearlo
      if (!floatingSidebar && memberInteractionUI.show) {
        // Mostrar el sidebar flotante
        memberInteractionUI.show();
        
        // Obtener referencia después de crearlo
        floatingSidebar = document.querySelector('.lead-manager-interaction-ui');
      }
      
      // Si existe, asegurarse de que sea visible
      if (floatingSidebar) {
        // Hacer visible el sidebar flotante
        floatingSidebar.style.display = 'block';
        floatingSidebar.style.opacity = '1';
        
        // Ocultar este sidebar
        this.hide();
        
        // Mostrar mensaje de éxito
        this.showToast('Panel de interacción abierto');
      } else {
        // Si no se pudo encontrar o crear, intentar iniciar la interacción directamente
        memberInteractionUI.startInteraction();
        this.showToast('Interacción con miembros iniciada');
      }
    } catch (error) {
      console.error('Error al abrir panel de interacción:', error);
      this.showToast('Error al abrir panel de interacción', true);
    }
  }
  
  // Función para mostrar una notificación toast
  showToast(message, isError = false) {
    // Crear elemento toast
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: ${isError ? '#f44336' : '#4CAF50'};
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
      z-index: 10000;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    `;
    toast.textContent = message;
    
    // Agregar al DOM
    document.body.appendChild(toast);
    
    // Eliminar después de 3 segundos
    setTimeout(() => {
      if (toast.parentNode) {
        document.body.removeChild(toast);
      }
    }, 3000);
  }
  
  // Actualizar conteo de miembros en las estadísticas
  updateMemberCount() {
    try {
      // Buscar elementos del DOM que contengan información de miembros
      const memberCountElement = this.container.querySelector('#lmp-total-members');
      if (!memberCountElement) return;
      
      // Intentar obtener el conteo desde diferentes fuentes
      let memberCount = 0;
      
      // Método 1: Desde el módulo groupMemberFinder
      if (window.leadManagerPro && window.leadManagerPro.groupMemberFinder) {
        const finder = window.leadManagerPro.groupMemberFinder;
        if (finder.memberCount || finder.totalMembers) {
          memberCount = finder.memberCount || finder.totalMembers;
        }
      }
      
      // Método 2: Buscar en la página elementos que contengan el número de miembros
      if (memberCount === 0) {
        const memberSelectors = [
          '[aria-label*="miembro"]',
          '[aria-label*="member"]',
          'a[href*="/members"]',
          'span:contains("miembros")',
          'span:contains("members")'
        ];
        
        for (const selector of memberSelectors) {
          try {
            const element = document.querySelector(selector);
            if (element && element.textContent) {
              const match = element.textContent.match(/[\d,.\s]+/);
              if (match) {
                const cleanNumber = match[0].replace(/[,.\s]/g, '');
                const parsed = parseInt(cleanNumber);
                if (!isNaN(parsed) && parsed > memberCount) {
                  memberCount = parsed;
                }
              }
            }
          } catch (e) {
            // Continuar con el siguiente selector
          }
        }
      }
      
      // Actualizar la UI
      if (memberCount > 0) {
        memberCountElement.textContent = memberCount.toLocaleString();
        console.log('GroupSidebar: Conteo de miembros actualizado:', memberCount);
      } else {
        memberCountElement.textContent = 'Contando...';
      }
    } catch (error) {
      console.error('GroupSidebar: Error al actualizar conteo de miembros:', error);
    }
  }
  
  // Actualizar información del grupo actual
  updateGroupInfo() {
    try {
      // Obtener nombre del grupo de la página
      let groupName = '';
      
      // Intentar diferentes selectores para el nombre del grupo
      const groupNameSelectors = [
        'h1', 
        'a[href*="/groups/"][role="link"]',
        'span[dir="auto"]'
      ];
      
      for (const selector of groupNameSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          groupName = element.textContent.trim();
          break;
        }
      }
      
      // Actualizar nombre del grupo en la UI
      const groupNameElement = this.container.querySelector('#lmp-current-group-name');
      if (groupNameElement) {
        groupNameElement.textContent = groupName || 'Grupo no detectado';
      }
      
      // Extraer ID del grupo de la URL
      const groupId = this.extractGroupIdFromUrl();
      
      // Guardar información del grupo actual
      if (groupId) {
        const groupInfo = {
          id: groupId,
          name: groupName,
          url: window.location.href,
          lastVisited: new Date().toISOString()
        };
        
        // Guardar en chrome.storage
        chrome.storage.local.set({ 'leadManagerCurrentGroup': groupInfo });
        console.log('GroupSidebar: Información del grupo guardada:', groupInfo);
      }
    } catch (error) {
      console.error('GroupSidebar: Error al obtener información del grupo:', error);
    }
  }
  
  // Extraer ID del grupo a partir de la URL
  extractGroupIdFromUrl() {
    const url = window.location.href;
    const match = url.match(/groups\/([^/?]+)/);
    return match ? match[1] : '';
  }
}

// Exportar la clase
window.leadManagerPro = window.leadManagerPro || {};
window.leadManagerPro.groupSidebar = new GroupSidebar();