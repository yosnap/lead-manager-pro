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
      autoCloseChat: true
    };
    this.eventListeners = [];
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
        chrome.storage.local.get(['leadManagerGroupSettings'], (result) => {
          resolve(result);
        });
      });

      // Si hay configuraciones guardadas, usar esas
      if (result && result.leadManagerGroupSettings) {
        this.settings = { ...this.settings, ...result.leadManagerGroupSettings };
        console.log('GroupSidebar: Configuraciones cargadas desde Extension Storage:', this.settings);
      } else {
        // Si no hay configuraciones guardadas, usar las predeterminadas
        this.saveSettings();
        console.log('GroupSidebar: Usando configuraciones predeterminadas');
      }
    } catch (error) {
      console.error('GroupSidebar: Error al cargar configuraciones:', error);
    }
  }

  // Guardar configuraciones en Extension Storage
  async saveSettings() {
    try {
      // Guardar en Extension Storage
      await new Promise(resolve => {
        chrome.storage.local.set({ 'leadManagerGroupSettings': this.settings }, resolve);
      });
      
      console.log('GroupSidebar: Configuraciones guardadas en Extension Storage:', this.settings);
      
      // Opcionalmente, también guardar en localStorage como respaldo
      localStorage.setItem('lead_manager_group_settings', JSON.stringify(this.settings));
      
      return true;
    } catch (error) {
      console.error('GroupSidebar: Error al guardar configuraciones:', error);
      return false;
    }
  }

  // Mostrar el sidebar
  show() {
    if (this.isVisible) return;
    
    this.createSidebar();
    this.isVisible = true;
    
    return this;
  }

  // Ocultar el sidebar
  hide() {
    if (!this.isVisible || !this.container) return;
    
    document.body.removeChild(this.container);
    this.container = null;
    this.isVisible = false;
    
    // Limpiar event listeners
    this.clearEventListeners();
    
    return this;
  }

  // Crear el sidebar y sus elementos
  createSidebar() {
    // Si ya existe, no crear otro
    if (this.container) return;
    
    // Crear elemento contenedor
    this.container = document.createElement('div');
    this.container.id = 'lmp-group-sidebar';
    this.container.className = 'lmp-sidebar-container';
    
    // Estilos del contenedor
    Object.assign(this.container.style, {
      position: 'fixed',
      top: '50px',
      right: '0',
      width: '300px',
      height: 'calc(100vh - 50px)',
      backgroundColor: 'white',
      boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.1)',
      zIndex: '9998',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#333',
      borderLeft: '1px solid #ddd',
      transition: 'transform 0.3s ease'
    });
    
    // Estructura interna
    this.container.innerHTML = `
      <div class="lmp-sidebar-header" style="padding: 15px; background: #4267B2; color: white; display: flex; justify-content: space-between; align-items: center;">
        <span>Lead Manager Pro - Grupo</span>
        <button id="lmp-close-sidebar" style="background: none; border: none; color: white; cursor: pointer; font-size: 16px;">&times;</button>
      </div>
      
      <div class="lmp-sidebar-content" style="flex: 1; overflow-y: auto; padding: 15px;">
        <div class="lmp-section" style="margin-bottom: 20px;">
          <h3 style="margin-top: 0; margin-bottom: 10px; color: #4267B2;">Herramientas</h3>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <button id="lmp-count-members-btn" class="lmp-btn" style="padding: 8px 12px; background-color: #4267B2; color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 5px;">
              <span style="font-size: 16px;">👥</span>
              <span>Contar miembros</span>
            </button>
            <button id="lmp-interact-members-btn" class="lmp-btn" style="padding: 8px 12px; background-color: #4267B2; color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 5px;">
              <span style="font-size: 16px;">💬</span>
              <span>Interactuar con miembros</span>
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
            <label for="lmp-message-text" style="display: block; margin-bottom: 5px; font-weight: 500;">Mensaje a enviar:</label>
            <textarea id="lmp-message-text" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; height: 80px; resize: vertical;">${this.settings.messageToSend}</textarea>
            <small style="color: #777; font-size: 12px; display: block; margin-top: 4px;">Mensaje que se enviará a cada miembro</small>
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
      // Obtener valores de los campos
      const membersCount = parseInt(this.container.querySelector('#lmp-members-count').value, 10);
      const interactionDelay = parseInt(this.container.querySelector('#lmp-interaction-delay').value, 10);
      const messageText = this.container.querySelector('#lmp-message-text').value;
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
      
      // Actualizar configuraciones
      this.settings.membersToInteract = membersCount;
      this.settings.interactionDelay = interactionDelay;
      this.settings.messageToSend = messageText;
      this.settings.autoCloseChat = autoCloseChat;
      
      // Guardar configuraciones
      this.saveSettings();
      
      // Mostrar mensaje de éxito
      this.showToast('Configuración guardada correctamente');
      
      return true;
    } catch (error) {
      console.error('GroupSidebar: Error al actualizar configuraciones:', error);
      return false;
    }
  }
  
  // Actualizar previsualización de configuraciones
  updateSettingPreview(input) {
    // No hacer nada por ahora, solo para futuras funcionalidades
    // Podría usarse para mostrar una vista previa del mensaje, etc.
  }
  
  // Función para contar miembros
  countMembers() {
    console.log('GroupSidebar: Contando miembros del grupo');
    
    if (window.leadManagerPro && window.leadManagerPro.groupMemberUI) {
      // Inicializar UI de conteo de miembros
      if (!window.leadManagerPro.groupMemberUI.container) {
        window.leadManagerPro.groupMemberUI.init();
      }
      
      // Mostrar UI
      window.leadManagerPro.groupMemberUI.show();
      
      // Iniciar conteo
      window.leadManagerPro.groupMemberUI.countMembers()
        .then(result => {
          if (result && result.totalCount) {
            // Actualizar estadísticas
            const totalMembersElement = this.container.querySelector('#lmp-total-members');
            if (totalMembersElement) {
              totalMembersElement.textContent = result.totalCount.toLocaleString();
            }
            
            // Guardar en chrome.storage
            chrome.storage.local.set({ 
              'leadManagerCurrentGroupStats': {
                totalMembers: result.totalCount,
                lastCountDate: new Date().toISOString()
              }
            });
          }
        })
        .catch(error => {
          console.error('GroupSidebar: Error al contar miembros:', error);
        });
    } else {
      console.error('GroupSidebar: módulo groupMemberUI no disponible');
      alert('Error: No se pudo iniciar el conteo de miembros. Módulo no disponible.');
    }
  }
  
  // Función para interactuar con miembros
  interactWithMembers() {
    console.log('GroupSidebar: Iniciando interacción con miembros');
    
    if (window.leadManagerPro && window.leadManagerPro.memberInteractionUI) {
      // Abrir la interfaz de interacción con miembros
      window.leadManagerPro.memberInteractionUI.show();
      
      // Actualizar configuraciones de interacción
      if (window.leadManagerPro.memberInteraction) {
        // Pasar la configuración actual al módulo de interacción
        window.leadManagerPro.memberInteraction.messageToSend = this.settings.messageToSend;
        window.leadManagerPro.memberInteraction.autoCloseChat = this.settings.autoCloseChat;
        window.leadManagerPro.memberInteraction.interactionDelay = this.settings.interactionDelay;
        window.leadManagerPro.memberInteraction.maxMembersToInteract = this.settings.membersToInteract;
      }
    } else {
      console.error('GroupSidebar: módulo memberInteractionUI no disponible');
      alert('Error: No se pudo iniciar la interacción con miembros. Módulo no disponible.');
    }
  }
  
  // Función para mostrar una notificación toast
  showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = 'lmp-toast';
    toast.textContent = message;
    
    // Estilos del toast
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: isError ? '#f44336' : '#4CAF50',
      color: 'white',
      padding: '10px 20px',
      borderRadius: '4px',
      zIndex: '10000',
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px'
    });
    
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
