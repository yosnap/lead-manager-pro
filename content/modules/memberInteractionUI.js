// Módulo para la interfaz de usuario de interacción con miembros

class MemberInteractionUI {
  constructor() {
    this.container = null;
    this.memberInteraction = null;
    this.statusText = null;
    this.progressBar = null;
    this.startButton = null;
    this.stopButton = null;
    this.isInteracting = false;
  }

  // Inicializar el módulo
  init() {
    console.log('MemberInteractionUI: Initializing module');
    
    // Inicializar el módulo de interacción con miembros
    this.memberInteraction = window.leadManagerPro.memberInteraction;
    
    return this;
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
    adminMembersOption.value = 'admin';
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
    messageTextarea.value = 'Hola, me interesa conectar contigo.';
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
      // Obtener valores de configuración
      const memberType = memberSelector.value;
      const delay = parseFloat(delayInput.value) * 1000; // Convertir a milisegundos
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
      
      // Obtener los elementos de miembros según el tipo seleccionado
      const memberElements = this.getMemberElements(memberType);
      
      if (memberElements.length === 0) {
        alert('No se encontraron miembros del tipo seleccionado');
        return;
      }
      
      // Guardar configuración para futuros usos
      try {
        chrome.storage.local.set({
          'leadManagerGroupSettings': {
            messageToSend: message,
            autoCloseChat: autoCloseChat,
            interactionDelay: delay,
            membersToInteract: maxMembers,
            lastMemberType: memberType
          }
        });
      } catch (error) {
        console.error('Error al guardar configuración:', error);
      }
      
      // Inicializar el módulo de interacción con los miembros encontrados
      this.memberInteraction.messageToSend = message;
      this.memberInteraction.autoCloseChat = autoCloseChat;
      this.memberInteraction.maxMembersToInteract = maxMembers;
      this.memberInteraction.init(memberElements, { delay });
      
      // Iniciar la interacción
      this.startInteraction();
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
    advancedOptionsToggle.style.fontWeight = 'bold';
    advancedOptionsToggle.style.marginBottom = '8px';
    advancedOptionsToggle.style.cursor = 'pointer';
    advancedOptionsToggle.style.color = '#4267B2';
    
    const advancedOptionsContainer = document.createElement('div');
    advancedOptionsContainer.style.display = 'none';
    advancedOptionsContainer.style.padding = '8px';
    advancedOptionsContainer.style.marginBottom = '16px';
    advancedOptionsContainer.style.backgroundColor = '#F0F2F5';
    advancedOptionsContainer.style.borderRadius = '4px';
    
    // Cerrar automáticamente el chat
    const autoCloseChatLabel = document.createElement('label');
    autoCloseChatLabel.style.display = 'flex';
    autoCloseChatLabel.style.alignItems = 'center';
    autoCloseChatLabel.style.marginBottom = '8px';
    
    const autoCloseChatCheckbox = document.createElement('input');
    autoCloseChatCheckbox.type = 'checkbox';
    autoCloseChatCheckbox.checked = true;
    autoCloseChatCheckbox.style.marginRight = '8px';
    
    const autoCloseChatText = document.createTextNode('Cerrar ventana de chat automáticamente');
    
    autoCloseChatLabel.appendChild(autoCloseChatCheckbox);
    autoCloseChatLabel.appendChild(autoCloseChatText);
    
    // Opción avanzada adicional futura (placeholder)
    const advancedOptionLabel = document.createElement('label');
    advancedOptionLabel.style.display = 'flex';
    advancedOptionLabel.style.alignItems = 'center';
    advancedOptionLabel.style.marginBottom = '8px';
    
    const advancedOptionCheckbox = document.createElement('input');
    advancedOptionCheckbox.type = 'checkbox';
    advancedOptionCheckbox.checked = false;
    advancedOptionCheckbox.disabled = true;
    advancedOptionCheckbox.style.marginRight = '8px';
    
    const advancedOptionText = document.createTextNode('Modo avanzado (próximamente)');
    
    advancedOptionLabel.appendChild(advancedOptionCheckbox);
    advancedOptionLabel.appendChild(advancedOptionText);
    
    // Máximo de miembros para interactuar
    const maxMembersLabel = document.createElement('div');
    maxMembersLabel.textContent = 'Máximo de miembros para interactuar:';
    maxMembersLabel.style.marginBottom = '4px';
    
    const maxMembersInput = document.createElement('input');
    maxMembersInput.type = 'number';
    maxMembersInput.min = '1';
    maxMembersInput.value = '10';
    maxMembersInput.style.width = '100%';
    maxMembersInput.style.padding = '6px';
    maxMembersInput.style.marginBottom = '8px';
    maxMembersInput.style.borderRadius = '4px';
    maxMembersInput.style.border = '1px solid #CED0D4';
    
    // Ensamblar opciones avanzadas
    advancedOptionsContainer.appendChild(autoCloseChatLabel);
    advancedOptionsContainer.appendChild(advancedOptionLabel);
    advancedOptionsContainer.appendChild(maxMembersLabel);
    advancedOptionsContainer.appendChild(maxMembersInput);
    
    // Evento para mostrar/ocultar opciones avanzadas
    advancedOptionsToggle.addEventListener('click', () => {
      if (advancedOptionsContainer.style.display === 'none') {
        advancedOptionsContainer.style.display = 'block';
        advancedOptionsToggle.innerHTML = '⚙️ Opciones avanzadas <span style="font-size:12px;">(click para ocultar)</span>';
      } else {
        advancedOptionsContainer.style.display = 'none';
        advancedOptionsToggle.innerHTML = '⚙️ Opciones avanzadas <span style="font-size:12px;">(click para mostrar)</span>';
      }
    });
    
    // Ensamblar la interfaz
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
    if (!this.container) {
      this.container = this.createUI();
      document.body.appendChild(this.container);
    } else {
      this.container.style.display = 'flex';
    }
  }
  
  // Ocultar la interfaz
  hide() {
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
    
    // Detener el proceso de interacción
    this.memberInteraction.stopInteractionProcess();
    
    // Actualizar UI
    this.statusText.textContent = 'Deteniendo interacción...';
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
  
  // Obtener elementos de miembros según el tipo seleccionado
  getMemberElements(memberType) {
    let memberElements = [];
    console.log('MemberInteractionUI: Buscando miembros de tipo:', memberType);
    
    // Seleccionar elementos según el tipo
    if (memberType === 'all') {
      // Todos los miembros en la página
      memberElements = document.querySelectorAll('div[role="listitem"]');
      console.log('MemberInteractionUI: Encontrados', memberElements.length, 'elementos de miembros totales');
    } else if (memberType === 'active') {
      // Miembros activos (publicaciones recientes, etc.)
      memberElements = this.findMembersInSection('Miembros activos', 'Active members', 'Top contributors');
    } else if (memberType === 'common') {
      // Buscar sección "Miembros con cosas en común"
      memberElements = this.findMembersInSection('Miembros con cosas en común', 'Members with things in common');
    } else if (memberType === 'new') {
      // Buscar sección "Nuevos miembros del grupo"
      memberElements = this.findMembersInSection('Nuevos miembros del grupo', 'New group members');
    } else if (memberType === 'admin') {
      // Buscar sección "Administradores"
      memberElements = this.findMembersInSection('Administradores', 'Admins', 'Moderadores', 'Moderators');
    }
    
    // Si no se encontró ningún miembro con los métodos específicos, usar la selección general
    if (memberElements.length === 0 && memberType !== 'all') {
      console.log('MemberInteractionUI: No se encontraron miembros específicos, usando todos los miembros');
      memberElements = document.querySelectorAll('div[role="listitem"]');
      console.log('MemberInteractionUI: Encontrados', memberElements.length, 'miembros en total');
    }
    
    // Devolver como array
    const result = Array.from(memberElements);
    
    // Mostrar en consola los elementos encontrados para debugging
    console.log('MemberInteractionUI: Elementos de miembro encontrados:', result.length);
    if (result.length > 0) {
      console.log('MemberInteractionUI: Primer elemento:', result[0]);
      
      // Verificar si tienen enlaces a perfiles
      const hasProfileLinks = result.every(el => 
        el.querySelector('a[href*="/user/"]') || el.querySelector('a[href*="/profile.php"]')
      );
      
      console.log('MemberInteractionUI: ¿Todos tienen enlaces a perfiles?', hasProfileLinks);
    }
    
    return result;
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
}

// Exportar la clase
window.leadManagerPro = window.leadManagerPro || {};
window.leadManagerPro.memberInteractionUI = new MemberInteractionUI();
