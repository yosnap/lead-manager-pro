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
        }
      }
    };
    
    this.init();
  }

  // Inicializar el módulo
  init() {
    console.log('MemberInteractionUI: Initializing module');
    
    // Inicializar el módulo de interacción con miembros
    this.memberInteraction = window.leadManagerPro.memberInteraction;
    
    // Observar cambios en el DOM para detectar cuando se carga la página de miembros
    const observer = new MutationObserver((mutations) => {
      if (window.location.href.includes('/members')) {
        this.tryAddPlayButtons();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Intentar añadir los botones inmediatamente si ya estamos en la página de miembros
    if (window.location.href.includes('/members')) {
      this.tryAddPlayButtons();
    }
    
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
    
    // Guardamos la referencia
    this.memberSelector = memberSelector;
    
    // Añadimos el evento change con logs para depuración
    memberSelector.addEventListener('change', (e) => {
      const selectedType = e.target.value;
      console.log('Tipo seleccionado:', selectedType);
      
      if (selectedType === 'admins') { // Cambiado de 'admin' a 'admins'
        console.log('Intentando resaltar sección de administradores');
        this.highlightAdminSection();
      } else {
        console.log('Removiendo resaltado');
        this.removeHighlight();
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
    
    this.removeHighlight();
    
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

  // Nueva función específica para resaltar la sección de administradores
  highlightAdminSection() {
    console.log('Iniciando highlightAdminSection');
    
    // Primero encontramos todos los h2 que contengan el texto de administradores
    const titles = Array.from(document.querySelectorAll('h2'));
    const adminTitle = titles.find(title => title.textContent.includes('Administradores y moderadores'));
    
    if (adminTitle) {
      console.log('Título de administradores encontrado');
      
      // Buscamos el contenedor que incluya tanto el título como la lista
      // Subimos en el DOM hasta encontrar el contenedor que tenga role="list" como hijo
      let currentElement = adminTitle;
      let container = null;
      
      // Iteramos hacia arriba hasta encontrar un contenedor que tenga la lista
      while (currentElement && !container) {
        const parentElement = currentElement.parentElement;
        if (!parentElement) break;
        
        // Verificamos si este contenedor tiene un elemento role="list"
        if (parentElement.querySelector('[role="list"]')) {
          container = parentElement;
          break;
        }
        
        currentElement = parentElement;
      }
      
      if (container) {
        console.log('Contenedor de administradores encontrado (incluye lista)');
        this.lastHighlightedSection = container;
        
        // Aplicamos los estilos
        this.lastHighlightedSection.style.transition = 'all 0.3s ease';
        this.lastHighlightedSection.style.backgroundColor = '#e6f7ff';
        this.lastHighlightedSection.style.padding = '10px';
        this.lastHighlightedSection.style.borderRadius = '8px';
        this.lastHighlightedSection.style.margin = '10px 0';
        
        // Scroll suave a la sección
        this.lastHighlightedSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        console.log('Sección completa de administradores resaltada visualmente');
      } else {
        console.error('No se encontró el contenedor que incluye la lista');
      }
    } else {
      console.error('No se encontró el título de administradores');
    }
  }

  // Obtener elementos de miembros según el tipo seleccionado
  getMemberElements(memberType) {
    let memberElements = [];
    console.log('MemberInteractionUI: Buscando miembros de tipo:', memberType);
    
    const sectionConfig = this.selectors.sections[memberType];
    if (!sectionConfig) {
      console.error('MemberInteractionUI: Tipo de sección no válido:', memberType);
      return [];
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

  async tryAddPlayButtons() {
    await new Promise(resolve => setTimeout(resolve, 1000));

    Object.entries(this.selectors.sections).forEach(([sectionType, config]) => {
      try {
        const sectionContainer = document.querySelector(config.container);
        if (!sectionContainer) return;

        const titleElement = Array.from(sectionContainer.querySelectorAll(config.title))
          .find(el => el.textContent.includes(config.titleText));

        if (titleElement && !titleElement.querySelector('.lmp-play-button')) {
          // Crear un contenedor flex para el título y el botón
          const titleContainer = document.createElement('div');
          titleContainer.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
          `;

          // Mover el contenido del título al nuevo contenedor
          while (titleElement.firstChild) {
            titleContainer.appendChild(titleElement.firstChild);
          }

          const playButton = this.createPlayButton();
          playButton.className = 'lmp-play-button';
          playButton.querySelector('button').setAttribute('data-section-type', sectionType);
          
          playButton.querySelector('button').title = `Iniciar interacción con ${config.titleText}`;

          playButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handlePlayClick(sectionType, config.titleText);
          });

          // Añadir el botón al contenedor
          titleContainer.appendChild(playButton);

          // Insertar el nuevo contenedor en el título
          titleElement.appendChild(titleContainer);
        }
      } catch (error) {
        console.error(`Error al añadir botón para ${sectionType}:`, error);
      }
    });
  }

  createPlayButton() {
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      align-items: center;
      margin-left: auto; // Empuja el botón a la derecha
    `;

    const button = document.createElement('button');
    button.innerHTML = this.icons.play;
    button.style.cssText = `
      background-color: #0866ff;
      border: none;
      border-radius: 6px;
      color: white;
      cursor: pointer;
      padding: 8px;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      min-width: 32px;
      height: 32px;
    `;

    // Efecto hover
    button.addEventListener('mouseover', () => {
      button.style.backgroundColor = '#0055d4';
      button.style.transform = 'scale(1.05)';
    });

    button.addEventListener('mouseout', () => {
      button.style.backgroundColor = '#0866ff';
      button.style.transform = 'scale(1)';
    });

    buttonContainer.appendChild(button);
    return buttonContainer;
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

  async handlePlayClick(sectionType, sectionTitle) {
    console.log('Click en botón Play para:', sectionType, sectionTitle);
    
    try {
      // Si ya está interactuando, detener
      if (this.isInteracting) {
        this.stopInteraction();
        return;
      }

      // Primero mostramos la interfaz
      this.show();
      
      // Esperamos un momento para asegurar que el DOM está listo
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Asegurarnos de seleccionar administradores en el selector
      if (this.memberSelector) {
        this.memberSelector.value = 'admins';
        // Disparar el evento change manualmente
        const event = new Event('change');
        this.memberSelector.dispatchEvent(event);
      }

      // Resaltar la sección
      this.highlightAdminSection();
      
      // Obtener la configuración guardada
      const config = await this.getStoredConfig();
      
      // Obtener los elementos de miembros
      const memberElements = this.getMemberElements('admins');
      
      if (memberElements.length === 0) {
        throw new Error('No se encontraron miembros del tipo seleccionado');
      }
      
      // Inicializar el módulo de interacción con los miembros encontrados
      this.memberInteraction.messageToSend = config.message || 'Hola, me interesa conectar contigo.';
      this.memberInteraction.autoCloseChat = config.autoCloseChat !== undefined ? config.autoCloseChat : true;
      this.memberInteraction.maxMembersToInteract = config.maxMembers || 10;
      
      // Configurar el delay
      const delay = config.delay || 2000; // 2 segundos por defecto
      
      // Inicializar y comenzar la interacción
      this.memberInteraction.init(memberElements, { delay });
      
      // Iniciar la interacción
      this.startInteraction();
      
      // Actualizar el estado del botón
      this.updatePlayButton(sectionType, true);
      
    } catch (error) {
      console.error('Error al iniciar la interacción:', error);
      this.statusText.textContent = 'Error: ' + error.message;
      this.statusText.style.color = 'red';
      // Asegurar que el botón vuelve a su estado original en caso de error
      this.updatePlayButton(sectionType, false);
    }
  }

  async getStoredConfig() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['leadManagerGroupSettings'], (result) => {
        const defaultConfig = {
          message: 'Hola, me interesa conectar contigo.',
          autoCloseChat: true,
          delay: 2000,
          maxMembers: 10
        };

        const savedConfig = result.leadManagerGroupSettings || {};
        resolve({
          ...defaultConfig,
          ...savedConfig,
          // Convertir delay a milisegundos si está en segundos
          delay: (savedConfig.interactionDelay || defaultConfig.delay) * 1000
        });
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
}

// Exportar la clase
window.leadManagerPro = window.leadManagerPro || {};
window.leadManagerPro.memberInteractionUI = new MemberInteractionUI();
