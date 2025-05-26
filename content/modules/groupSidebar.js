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
  }

  // Inicializar el sidebar
  async init() {
    console.log('GroupSidebar: Inicializando sidebar para páginas de grupo');
    
    // Cargar configuraciones desde Extension Storage
    await this.loadSettings();
    
    return this;
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
    if (!this.container) {
      this.createSidebar();
    }
    
    if (this.container) {
      this.container.style.right = '0';
      this.isVisible = true;
    }
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
          <h3 style="margin-top: 0; margin-bottom: 10px; color: #4267B2;">Acciones</h3>
          <div class="lmp-actions" style="display: flex; flex-direction: column; gap: 10px;">
            <button id="lmp-interact-members-btn" class="lmp-btn" style="padding: 8px 12px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Interactuar con miembros
            </button>
          </div>
        </div>
        
        <div class="lmp-section" style="margin-bottom: 20px;">
          <h3 style="margin-top: 0; margin-bottom: 10px; color: #4267B2;">Configuración de interacción</h3>
          
          <div class="lmp-form-group" style="margin-bottom: 15px;">
            <label for="lmp-members-count" style="display: block; margin-bottom: 5px; font-weight: 500;">Número de miembros:</label>
            <input type="number" id="lmp-members-count" value="${this.settings.membersToInteract}" min="1" max="100" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <small style="color: #777; font-size: 12px; display: block; margin-top: 4px;">Número máximo de miembros con los que interactuar en una sesión</small>
          </div>
          
          <div class="lmp-form-group" style="margin-bottom: 15px;">
            <label for="lmp-interaction-delay" style="display: block; margin-bottom: 5px; font-weight: 500;">Tiempo entre interacciones (ms):</label>
            <input type="number" id="lmp-interaction-delay" value="${this.settings.interactionDelay}" min="1000" step="500" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <small style="color: #777; font-size: 12px; display: block; margin-top: 4px;">Tiempo de espera en milisegundos entre cada interacción</small>
          </div>
          
          <div class="lmp-form-group" style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Mensajes personalizados (se enviarán aleatoriamente):</label>
            <div class="lmp-messages-container" style="border: 1px solid #ddd; border-radius: 4px; overflow: hidden; margin-bottom: 8px;">
              ${this.createMessagesAccordion()}
            </div>
            <small style="color: #777; font-size: 12px; display: block; margin-top: 4px;">Puedes configurar hasta 5 mensajes diferentes que se enviarán aleatoriamente</small>
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
  
  // Crear el acordeón de mensajes
  createMessagesAccordion() {
    // Limpiar las referencias anteriores a textareas
    this.messageTextareas = [];
    
    // Crear HTML para el acordeón
    let accordionHtml = '';
    
    // Mensaje por defecto
    const defaultMessage = 'Hola, este es un mensaje de prueba desde la plataforma, has caso omiso ya que solo sirve para pruebas. !Un saludo!';
    
    // Asegurarse de que messages sea un array
    if (!Array.isArray(this.settings.messages)) {
      this.settings.messages = [defaultMessage];
    }
    
    // Si el array está vacío, agregar el mensaje por defecto
    if (this.settings.messages.length === 0) {
      this.settings.messages.push(defaultMessage);
    }
    
    console.log('Mensajes cargados para el acordeón:', this.settings.messages);
    
    // Crear 5 paneles de acordeón para los mensajes
    for (let i = 0; i < 5; i++) {
      // Obtener el mensaje del array o usar string vacío si no existe
      const message = this.settings.messages[i] || '';
      
      // Estado inicial del panel (abierto o cerrado)
      const isActive = message !== '';
      const iconSymbol = isActive ? '-' : '+';
      
      accordionHtml += `
        <div class="lmp-accordion-panel" style="border-bottom: ${i < 4 ? '1px solid #ddd' : 'none'};">
          <button class="lmp-accordion-button ${isActive ? 'active' : ''}" data-index="${i}" style="
            width: 100%;
            background-color: #F0F2F5;
            border: none;
            padding: 10px 15px;
            text-align: left;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
          ">
            Mensaje ${i + 1}
            <span class="lmp-accordion-icon" style="font-size: 16px;">${iconSymbol}</span>
          </button>
          <div class="lmp-accordion-content" style="
            max-height: ${isActive ? '500px' : '0'};
            overflow: hidden;
            transition: max-height 0.3s ease-out;
            background-color: white;
          ">
            <textarea class="lmp-message-textarea" data-index="${i}" style="
              width: calc(100% - 20px);
              padding: 8px;
              margin: 10px;
              border-radius: 4px;
              border: 1px solid #ddd;
              min-height: 80px;
              resize: vertical;
            ">${message}</textarea>
          </div>
        </div>
      `;
    }
    
    return accordionHtml;
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
    
    // Inicializar el acordeón de mensajes
    this.initializeAccordion();
    
    // Inputs de configuración (para actualizar en tiempo real)
    const allInputs = this.container.querySelectorAll('input:not(.lmp-message-textarea)');
    allInputs.forEach(input => {
      const handler = () => this.updateSettingPreview(input);
      input.addEventListener('input', handler);
      this.addEventListenerRef(input, 'input', handler);
    });
    
    // Cargar opciones generales guardadas
    this.loadGeneralOptions();
    
    // Intentar cargar mensajes desde el sidebar flotante si existe
    this.loadMessagesFromFloatingSidebar();
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
            const textarea = content.querySelector('textarea');
            if (textarea) {
              content.style.maxHeight = textarea.scrollHeight + 40 + 'px';
            }
          }
        }
      };
      
      button.addEventListener('click', handler);
      this.addEventListenerRef(button, 'click', handler);
    });
    
    // Abrir el primer panel por defecto
    setTimeout(() => {
      const firstButton = this.container.querySelector('.lmp-accordion-button');
      if (firstButton) firstButton.click();
    }, 100);
    
    // Guardar referencias a los textareas
    const textareas = this.container.querySelectorAll('.lmp-message-textarea');
    this.messageTextareas = Array.from(textareas);
    
    // Añadir event listeners a los textareas para actualizar en tiempo real
    this.messageTextareas.forEach(textarea => {
      const handler = () => this.updateSettingPreview(textarea);
      textarea.addEventListener('input', handler);
      this.addEventListenerRef(textarea, 'input', handler);
    });
  }
  
  // Cargar mensajes desde el sidebar flotante
  loadMessagesFromFloatingSidebar() {
    try {
      // Buscar el sidebar flotante
      const floatingSidebar = document.querySelector('.lead-manager-interaction-ui');
      if (!floatingSidebar) {
        console.log('Sidebar flotante no encontrado');
        return;
      }
      
      // Buscar los textareas de mensajes en el sidebar flotante
      const floatingTextareas = floatingSidebar.querySelectorAll('[class^="message-textarea-"]');
      if (!floatingTextareas || floatingTextareas.length === 0) {
        console.log('No se encontraron textareas de mensajes en el sidebar flotante');
        return;
      }
      
      // Obtener los mensajes del sidebar flotante
      const messages = [];
      floatingTextareas.forEach(textarea => {
        const text = textarea.value.trim();
        if (text) {
          messages.push(text);
        }
      });
      
      // Si hay mensajes, actualizar los textareas en este sidebar
      if (messages.length > 0) {
        console.log('Cargando mensajes desde el sidebar flotante:', messages);
        
        // Actualizar los textareas en este sidebar
        this.messageTextareas.forEach((textarea, index) => {
          if (index < messages.length) {
            textarea.value = messages[index];
          } else {
            textarea.value = '';
          }
        });
        
        // Actualizar la configuración
        this.settings.messages = messages;
        this.settings.messageToSend = messages[0]; // Para compatibilidad
        
        // Guardar la configuración
        this.saveSettings();
      }
    } catch (error) {
      console.error('Error al cargar mensajes desde el sidebar flotante:', error);
    }
  }
  
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
      const autoCloseChat = this.container.querySelector('#lmp-auto-close-chat').checked;
      
      // Obtener mensajes de los textareas
      const messages = [];
      this.messageTextareas.forEach(textarea => {
        const text = textarea.value.trim();
        if (text) {
          messages.push(text);
        }
      });
      
      // Validar valores
      if (isNaN(membersCount) || membersCount < 1) {
        alert('Por favor, introduce un número válido de miembros a interactuar (mínimo 1)');
        return false;
      }
      
      if (isNaN(interactionDelay) || interactionDelay < 1000) {
        alert('Por favor, introduce un tiempo de espera válido (mínimo 1000 ms)');
        return false;
      }
      
      if (messages.length === 0) {
        alert('Por favor, introduce al menos un mensaje para enviar a los miembros');
        return false;
      }
      
      // Actualizar configuraciones de interacción de miembros
      this.settings.membersToInteract = membersCount;
      this.settings.interactionDelay = interactionDelay;
      this.settings.messages = messages;
      this.settings.messageToSend = messages[0]; // Para compatibilidad
      this.settings.autoCloseChat = autoCloseChat;
      
      // Guardar configuraciones de interacción
      this.saveSettings();
      
      // Actualizar también el sidebar flotante si existe
      this.updateFloatingSidebar(messages);
      
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
      
      // Buscar los textareas de mensajes en el sidebar flotante
      const floatingTextareas = floatingSidebar.querySelectorAll('[class^="message-textarea-"]');
      if (!floatingTextareas || floatingTextareas.length === 0) {
        console.log('No se encontraron textareas de mensajes en el sidebar flotante');
        return;
      }
      
      // Actualizar los textareas en el sidebar flotante
      floatingTextareas.forEach((textarea, index) => {
        if (index < messages.length) {
          textarea.value = messages[index];
        } else {
          textarea.value = '';
        }
      });
      
      console.log('Sidebar flotante actualizado con los mensajes:', messages);
      
      // Si existe la instancia de MemberInteractionUI, actualizar su configuración
      if (window.leadManagerPro && window.leadManagerPro.memberInteractionUI) {
        const memberInteractionUI = window.leadManagerPro.memberInteractionUI;
        
        // Actualizar la configuración
        if (memberInteractionUI.memberInteraction) {
          memberInteractionUI.memberInteraction.messages = messages;
          memberInteractionUI.memberInteraction.messageToSend = messages[0];
        }
        
        console.log('MemberInteractionUI actualizado con los mensajes');
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