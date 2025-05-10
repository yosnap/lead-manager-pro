// Módulo para gestionar la interacción con miembros de grupos

class MemberInteraction {
  constructor() {
    this.isInteracting = false;
    this.currentMemberIndex = 0;
    this.members = [];
    this.interactionDelay = 2000; // tiempo de espera entre acciones en ms
    this.stopInteraction = false;
    this.messageToSend = 'Hola, este es un mensaje de prueba desde la plataforma, has caso omiso ya que solo sirve para pruebas. !Un saludo!'; // mensaje a enviar
    this.autoCloseChat = true; // cerrar ventana de chat automáticamente
    this.maxMembersToInteract = 10; // número máximo de miembros para interactuar
    this.currentGroupInfo = null; // información del grupo actual
    this.lastStatsUpdate = null; // última actualización de estadísticas
  }
  
  // Inicializar interacción con una lista de miembros
  init(memberElements, options = {}) {
    this.members = Array.from(memberElements);
    this.currentMemberIndex = 0;
    this.interactionDelay = options.delay || 2000;
    this.isInteracting = false;
    this.stopInteraction = false;
    
    console.log(`MemberInteraction: Initialized with ${this.members.length} members`);
    return this;
  }
  
  // Iniciar interacción con miembros
  async startInteraction(callback) {
    if (this.isInteracting) {
      console.log('MemberInteraction: Ya hay una interacción en progreso');
      return false;
    }
    
    this.isInteracting = true;
    this.stopInteraction = false;
    this.currentMemberIndex = 0;

    // Ocultar la interfaz de interacción si está visible
    if (window.leadManagerPro.memberInteractionUI) {
      window.leadManagerPro.memberInteractionUI.hide();
    }
    
    // Determinar cuántos miembros procesar
    const membersToProcess = Math.min(this.members.length, this.maxMembersToInteract);
    console.log(`MemberInteraction: Iniciando interacción con ${membersToProcess} miembros de un total de ${this.members.length}`);
    
    // Obtener las últimas configuraciones desde Extension Storage
    await this.loadConfigFromStorage();
    
    let processedMembers = 0;
    
    for (let i = 0; i < membersToProcess; i++) {
      if (this.stopInteraction) {
        console.log('MemberInteraction: Interacción detenida por el usuario');
        break;
      }
      
      const member = this.members[i];
      const memberName = this.extractMemberName(member);
      
      try {
        console.log(`Procesando miembro ${i+1}/${membersToProcess}: ${memberName}`);
        
        // Notificar progreso
        if (callback) {
          callback({
            type: 'progress',
            memberIndex: i,
            totalMembers: membersToProcess,
            memberElement: member,
            messageOpened: false
          });
        }
        
        // PASO 1: Hacer hover sobre el miembro
        console.log(`Paso 1: Haciendo hover sobre ${memberName}`);
        const hoverSuccess = await this.hoverMember(member);
        if (!hoverSuccess) {
          console.error(`No se pudo hacer hover sobre el miembro ${memberName}`);
          continue;
        }
        
        // Esperar a que aparezca el modal de hover
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // PASO 2: Buscar y hacer clic en el botón de mensaje en el modal
        console.log(`Paso 2: Buscando botón de mensaje para ${memberName}`);
        const messageButton = await this.findMessageButton(member);
        if (!messageButton) {
          console.error(`No se encontró el botón de mensaje para ${memberName}`);
          continue;
        }
        
        // PASO 3: Hacer clic en el botón de mensaje
        console.log(`Paso 3: Haciendo clic en botón de mensaje para ${memberName}`);
        messageButton.click();
        
        // PASO 4: Cerrar el modal del usuario haciendo clic en el botón de cierre
        console.log(`Paso 4: Cerrando el modal del usuario para ${memberName}`);
        await this.closeUserModal();
        
        // PASO 5: Esperar a que se abra la ventana de chat
        console.log(`Paso 5: Esperando a que se abra la ventana de chat para ${memberName}`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // PASO 6: Buscar el campo de mensaje
        console.log(`Paso 6: Buscando campo de mensaje para ${memberName}`);
        const messageFieldSelectors = [
          '[contenteditable="true"][role="textbox"]',
          'div[contenteditable="true"]',
          'div[role="textbox"]',
          'div[aria-label="Mensaje"][contenteditable="true"]',
          'div[aria-label="Message"][contenteditable="true"]'
        ];
        
        let messageField = null;
        for (const selector of messageFieldSelectors) {
          try {
            messageField = await this.waitForElement(selector, 2000);
            if (messageField) {
              console.log(`Campo de mensaje encontrado con selector: ${selector}`);
              break;
            }
          } catch (error) {
            // Continuar con el siguiente selector
          }
        }
        
        if (!messageField) {
          console.error(`No se encontró el campo de mensaje para ${memberName}`);
          continue;
        }

        // PASO 7: Escribir y enviar el mensaje
        console.log(`Paso 7: Enviando mensaje a ${memberName}`);
        const messageSent = await this.sendMessage(messageField);
        
        if (messageSent) {
          processedMembers++;
          console.log(`Mensaje enviado exitosamente a ${memberName}`);
          
          // Notificar que se envió el mensaje
          if (callback) {
            callback({
              type: 'progress',
              memberIndex: i,
              totalMembers: membersToProcess,
              memberElement: member,
              messageOpened: true,
              messageSent: true
            });
          }
        } else {
          console.error(`Error al enviar mensaje a ${memberName}`);
        }
        
        // PASO 8: Cerrar la ventana de chat si está configurado
        if (this.autoCloseChat) {
          console.log(`Paso 8: Cerrando ventana de chat para ${memberName}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Buscar el botón de cerrar usando múltiples selectores
          const closeButtonSelectors = [
            'div[aria-label="Cerrar chat"][role="button"]',
            'div[aria-label="Close chat"][role="button"]',
            'div[aria-label="Cerrar"][role="button"]',
            'div[aria-label="Close"][role="button"]',
            '[role="button"][aria-label*="Cerrar"]',
            '[role="button"][aria-label*="Close"]',
            'div[role="dialog"] div[role="button"]:last-child'
          ];
          
          let closeButton = null;
          for (const selector of closeButtonSelectors) {
            closeButton = document.querySelector(selector);
            if (closeButton) {
              console.log(`Botón de cierre encontrado con selector: ${selector}`);
              break;
            }
          }
          
          // Si no se encontró con los selectores específicos, intentar buscar por contenido
          if (!closeButton) {
            // Buscar todos los botones y encontrar el que tiene un icono de cierre
            const allButtons = document.querySelectorAll('[role="button"]');
            for (const button of allButtons) {
              // Verificar si contiene un SVG (los botones de cierre suelen tener un SVG)
              if (button.querySelector('svg') && 
                 (button.textContent.includes('×') || 
                  button.innerHTML.includes('close') || 
                  button.getAttribute('aria-label')?.includes('Cerrar'))) {
                closeButton = button;
                console.log('Botón de cierre encontrado por contenido SVG');
                break;
              }
            }
          }
          
          // Buscar en diálogos si aún no se ha encontrado
          if (!closeButton) {
            const dialog = document.querySelector('[role="dialog"]');
            if (dialog) {
              // El último botón en el diálogo suele ser el de cerrar
              const buttons = dialog.querySelectorAll('[role="button"]');
              if (buttons.length > 0) {
                closeButton = buttons[buttons.length - 1];
                console.log('Botón de cierre encontrado como último botón del diálogo');
              }
            }
          }

          if (closeButton) {
            closeButton.click();
            console.log('Chat cerrado exitosamente');
          } else {
            console.log('No se encontró el botón de cierre del chat');
          }
        }
        
        // Notificar que se envió el mensaje
        if (callback) {
          callback({
            type: 'progress',
            memberIndex: i,
            totalMembers: membersToProcess,
            memberElement: member,
            messageOpened: true,
            messageSent: true
          });
        }
        
        // Esperar un momento antes de continuar con el siguiente miembro
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error al procesar miembro ${i}:`, error);
        if (callback) {
          callback({
            type: 'error',
            memberIndex: i,
            error: error
          });
        }
      }
    }
    
    // Finalizar interacción
    this.isInteracting = false;
    if (callback) {
      callback({
        type: 'complete',
        processedMembers,
        totalMembers: membersToProcess
      });
    }
    
    return true;
  }
  
  // Cargar configuración desde Extension Storage
  async loadConfigFromStorage() {
    try {
      // Obtener configuraciones desde Extension Storage
      const result = await new Promise(resolve => {
        chrome.storage.local.get(['leadManagerGroupSettings'], resolve);
      });
      
      // Actualizar configuraciones si existen
      if (result && result.leadManagerGroupSettings) {
        const settings = result.leadManagerGroupSettings;
        
        this.messageToSend = settings.messageToSend || this.messageToSend;
        this.autoCloseChat = settings.autoCloseChat !== undefined ? settings.autoCloseChat : this.autoCloseChat;
        this.interactionDelay = settings.interactionDelay || this.interactionDelay;
        this.maxMembersToInteract = settings.membersToInteract || this.maxMembersToInteract;
        
        console.log('MemberInteraction: Configuración cargada desde Extension Storage:', settings);
      }
    } catch (error) {
      console.error('MemberInteraction: Error al cargar configuración:', error);
    }
  }
  
  // Detener la interacción
  stopInteractionProcess() {
    this.stopInteraction = true;
    console.log('MemberInteraction: Deteniendo interacción');
    return true;
  }
  
  // Realizar hover sobre un elemento de miembro
  async hoverMember(member) {
    return new Promise((resolve) => {
      try {
        // Encontrar el enlace del nombre del usuario
        const userLink = member.querySelector('a[role="link"][href*="/user/"]');
        
        if (!userLink) {
          console.error('No se encontró el enlace del usuario');
          resolve(false);
          return;
        }

        // Hacer scroll al elemento para asegurarnos que está visible
        userLink.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Esperar un momento para que el scroll termine
        setTimeout(() => {
          console.log('Realizando hover sobre el usuario:', this.extractMemberName(member));
          
          // Simular hover sobre el enlace del usuario
          userLink.dispatchEvent(new MouseEvent('mouseover', {
            bubbles: true,
            cancelable: true,
            view: window
          }));

          userLink.dispatchEvent(new MouseEvent('mouseenter', {
            bubbles: true,
            cancelable: true,
            view: window
          }));
          
          // Esperar a que aparezca el modal de hover
          setTimeout(() => {
            // Verificar si el modal de hover apareció
            const hoverCard = document.querySelector('.x1ey2m1c, div[role="dialog"], .xu96u03');
            if (hoverCard) {
              console.log('Modal de hover detectado correctamente');
            } else {
              console.warn('No se detectó el modal de hover, reintentando...');
              // Intentar nuevamente el hover
              userLink.dispatchEvent(new MouseEvent('mouseover', {
                bubbles: true,
                cancelable: true,
                view: window
              }));
            }
            resolve(true);
          }, 500); // Esperar 500ms para que aparezca el modal
          
        }, 500);

      } catch (error) {
        console.error('Error al hacer hover:', error);
        resolve(false);
      }
    });
  }
  
  // Extraer nombre del miembro
  extractMemberName(element) {
    // Buscar el nombre en el enlace al perfil
    const link = element.querySelector('a[href*="/user/"], a[href*="/profile.php"]');
    if (link) {
      // Si el enlace tiene un texto, es probablemente el nombre
      const linkText = link.textContent.trim();
      if (linkText) return linkText;
      
      // Si no, buscar elementos de texto dentro del enlace
      const spanText = link.querySelector('span')?.textContent.trim();
      if (spanText) return spanText;
    }
    
    // Alternativa: buscar elementos de encabezado o texto destacado
    const nameElement = element.querySelector('span[dir="auto"], strong, h3, h4');
    return nameElement ? nameElement.textContent.trim() : 'Miembro sin nombre';
  }
  
  // Extraer ID de usuario de un enlace
  extractUserIdFromLink(link) {
    const href = link.getAttribute('href');
    
    if (href.includes('/user/')) {
      const match = href.match(/\/user\/([^/?]+)/);
      return match ? match[1] : null;
    } else if (href.includes('/profile.php')) {
      const match = href.match(/id=([^&]+)/);
      return match ? match[1] : null;
    }
    
    return null;
  }
  
  // Abrir ventana de mensaje
  async openMessageWindow(memberElement) {
    return new Promise((resolve) => {
      try {
        // Intentar encontrar el botón de mensaje
        let messageButton = null;
        
        // Primera opción: buscar botón de mensaje en la tarjeta de miembro
        const messageButtons = memberElement.querySelectorAll('button, a[role="button"]');
        
        for (const button of messageButtons) {
          const text = button.textContent.toLowerCase();
          if (text.includes('mensaje') || text.includes('message')) {
            messageButton = button;
            break;
          }
        }
        
        // Segunda opción: buscar enlace al perfil y simular que se abre en nueva pestaña
        if (!messageButton) {
          const profileLink = memberElement.querySelector('a[href*="/user/"], a[href*="/profile.php"]');
          
          if (profileLink) {
            console.log('MemberInteraction: Abriendo perfil de usuario para mensaje');
            
            // Extraer el nombre completo del usuario
            const userName = this.extractMemberName(memberElement);
            
            // Abrir una nueva ventana de mensaje simulando el botón de mensaje de Facebook
            const userId = this.extractUserIdFromLink(profileLink);
            
            if (userId) {
              console.log('MemberInteraction: Usuario encontrado:', userName, userId);
              this.openFacebookMessageWindow(userId, userName);
              resolve(true);
              return;
            }
          }
        }
        
        // Si se encontró un botón de mensaje, hacer clic en él
        if (messageButton) {
          console.log('MemberInteraction: Botón de mensaje encontrado, haciendo clic');
          messageButton.click();
          resolve(true);
        } else {
          console.warn('MemberInteraction: No se pudo encontrar el botón de mensaje');
          resolve(false);
        }
      } catch (error) {
        console.error('MemberInteraction: Error al abrir ventana de mensaje', error);
        resolve(false);
      }
    });
  }
  
  // Abrir ventana de mensaje de Facebook para un usuario específico
  openFacebookMessageWindow(userId, userName = 'Usuario') {
    // Crear un elemento de ventana modal
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'lead-manager-message-window';
    modalOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    
    // Crear el contenido de la ventana modal
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background-color: white;
      border-radius: 8px;
      width: 400px;
      max-width: 90%;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    `;
    
    // Cabecera de la ventana
    const modalHeader = document.createElement('div');
    modalHeader.style.cssText = `
      padding: 12px 16px;
      border-bottom: 1px solid #E4E6EB;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    
    const modalTitle = document.createElement('div');
    modalTitle.textContent = `Mensaje a ${userName}`;
    modalTitle.style.fontWeight = 'bold';
    
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.style.cssText = `
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    `;
    
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);
    
    // Cuerpo de la ventana
    const modalBody = document.createElement('div');
    modalBody.style.cssText = `
      padding: 16px;
      flex: 1;
      overflow-y: auto;
    `;
    
    // Mostrar interfaz de mensaje
    modalBody.innerHTML = `
      <p style="margin-bottom: 16px;">Ventana de mensaje abierta para <strong>${userName}</strong></p>
      
      <div style="margin-bottom: 16px; background-color: #f0f2f5; border-radius: 8px; padding: 12px;">
        <div style="margin-bottom: 8px; font-weight: bold;">Mensaje a enviar:</div>
        <div style="white-space: pre-wrap; background-color: white; padding: 10px; border-radius: 4px; border: 1px solid #ddd;">${this.messageToSend}</div>
      </div>
      
      <div style="margin-bottom: 16px;">
        <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <input type="checkbox" id="confirm-send-message" style="margin: 0;">
          <span>Confirmar envío del mensaje</span>
        </label>
      </div>
      
      <p style="color: #666; font-style: italic; margin-bottom: 16px;">Esta es una simulación. En una implementación real, el mensaje se enviaría automáticamente al chat de Facebook.</p>
    `;
    
    // Footer de la ventana
    const modalFooter = document.createElement('div');
    modalFooter.style.cssText = `
      padding: 12px 16px;
      border-top: 1px solid #E4E6EB;
      display: flex;
      justify-content: flex-end;
    `;
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancelar';
    cancelButton.style.cssText = `
      padding: 8px 16px;
      background-color: #F0F2F5;
      border: none;
      border-radius: 4px;
      margin-right: 8px;
      cursor: pointer;
    `;
    
    const sendButton = document.createElement('button');
    sendButton.textContent = 'Enviar mensaje';
    sendButton.disabled = true;
    sendButton.style.cssText = `
      padding: 8px 16px;
      background-color: #4267B2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      opacity: 0.5;
    `;
    
    modalFooter.appendChild(cancelButton);
    modalFooter.appendChild(sendButton);
    
    // Ensamblar la ventana modal
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);
    modalOverlay.appendChild(modalContent);
    
    // Agregar al DOM
    document.body.appendChild(modalOverlay);
    
    // Manejar evento de confirmación de envío
    const confirmCheckbox = modalOverlay.querySelector('#confirm-send-message');
    confirmCheckbox.addEventListener('change', () => {
      sendButton.disabled = !confirmCheckbox.checked;
      sendButton.style.opacity = confirmCheckbox.checked ? '1' : '0.5';
    });
    
    // Manejar eventos de cierre
    const closeModal = (messageSent = false) => {
      document.body.removeChild(modalOverlay);
      // Notificar que la ventana se ha cerrado, indicando si se envió un mensaje o no
      document.dispatchEvent(new CustomEvent('lead-manager-message-window-closed', {
        detail: { messageSent }
      }));
    };
    
    // Manejar eventos de los botones
    closeButton.addEventListener('click', () => closeModal(false));
    cancelButton.addEventListener('click', () => closeModal(false));
    
    // Manejar evento de envío de mensaje
    sendButton.addEventListener('click', () => {
      // Aquí es donde se implementaría el envío real del mensaje a Facebook
      // Por ahora, simulamos que el mensaje se envió correctamente
      
      // Cambiamos el contenido del botón para indicar éxito
      sendButton.textContent = '✓ Mensaje enviado';
      sendButton.style.backgroundColor = '#4CAF50';
      sendButton.disabled = true;
      
      // Guardamos estadísticas de interacción en chrome.storage
      this.saveInteractionStats(userId, userName);
      
      // Si está configurado para cerrar automáticamente, cerrar después de un breve delay
      if (this.autoCloseChat) {
        setTimeout(() => {
          closeModal(true);
        }, 1500);
      }
    });
    
    // También cerrar al hacer clic fuera del modal
    modalOverlay.addEventListener('click', (event) => {
      if (event.target === modalOverlay) {
        closeModal(false);
      }
    });
    
    return true;
  }
  
  // Guardar estadísticas de interacción
  saveInteractionStats(userId, userName) {
    try {
      // Recuperar estadísticas existentes
      chrome.storage.local.get(['leadManagerInteractionStats'], (result) => {
        const stats = result.leadManagerInteractionStats || {
          totalInteractions: 0,
          interactions: []
        };
        
        // Incrementar contador total
        stats.totalInteractions++;
        
        // Agregar esta interacción a la lista
        stats.interactions.push({
          userId: userId,
          userName: userName,
          messageText: this.messageToSend,
          timestamp: new Date().toISOString(),
          groupId: this.extractGroupIdFromUrl()
        });
        
        // Limitar a las últimas 100 interacciones para evitar usar demasiado espacio
        if (stats.interactions.length > 100) {
          stats.interactions = stats.interactions.slice(-100);
        }
        
        // Guardar estadísticas actualizadas
        chrome.storage.local.set({ 'leadManagerInteractionStats': stats });
        
        // Actualizar contador en el sidebar si está abierto
        if (window.leadManagerPro && window.leadManagerPro.groupSidebar && 
            window.leadManagerPro.groupSidebar.container) {
          const counter = window.leadManagerPro.groupSidebar.container.querySelector('#lmp-interactions-count');
          if (counter) {
            counter.textContent = stats.totalInteractions;
          }
        }
      });
    } catch (error) {
      console.error('Error al guardar estadísticas de interacción:', error);
    }
  }
  
  // Extraer ID del grupo a partir de la URL
  extractGroupIdFromUrl() {
    const url = window.location.href;
    const match = url.match(/groups\/([^/?]+)/);
    return match ? match[1] : '';
  }
  
  // Esperar a que la ventana de mensaje se cierre
  async waitForMessageWindowToBeClosed() {
    return new Promise((resolve) => {
      // Crear un listener para el evento personalizado
      const messageWindowClosedListener = (event) => {
        // Quitar el listener una vez que se cierre la ventana
        document.removeEventListener('lead-manager-message-window-closed', messageWindowClosedListener);
        
        // Obtener información sobre si se envió el mensaje
        const messageSent = event.detail && event.detail.messageSent;
        
        resolve({
          messageSent: messageSent || false
        });
      };
      
      // Agregar el listener
      document.addEventListener('lead-manager-message-window-closed', messageWindowClosedListener);
    });
  }
  
  // Extraer información del grupo actual
  extractCurrentGroupInfo() {
    try {
      // Extraer URL y nombre del grupo
      const url = window.location.href;
      const groupId = this.extractGroupIdFromUrl();
      
      // Intentar obtener el nombre del grupo
      let groupName = '';
      
      // Buscar en diferentes partes de la página
      const possibleNameElements = [
        document.querySelector('h1'),
        document.querySelector('[role="main"] h1'),
        document.querySelector('[role="main"] [role="heading"]'),
        document.querySelector('a[aria-current="page"]')
      ];
      
      for (const element of possibleNameElements) {
        if (element && element.textContent.trim()) {
          groupName = element.textContent.trim();
          break;
        }
      }
      
      // Extraer estadísticas si están disponibles
      let memberCount = 0;
      const memberCountElements = document.querySelectorAll('span');
      for (const el of memberCountElements) {
        if (el.textContent.includes('miembro') || el.textContent.includes('member')) {
          memberCount = this.extractNumberFromText(el.textContent);
          break;
        }
      }
      
      // Determinar si es público o privado
      let isPrivate = false;
      const groupHeaders = document.querySelectorAll('h4, h5, span');
      for (const el of groupHeaders) {
        const text = el.textContent.toLowerCase();
        if (text.includes('privado') || text.includes('private')) {
          isPrivate = true;
          break;
        }
      }
      
      // Estimar publicaciones (esto es aproximado, sería mejor con análisis completo)
      const postsElements = document.querySelectorAll('[role="article"]');
      const postsCount = postsElements.length;
      
      // Calcular publicaciones por período (aproximado)
      const now = new Date();
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      
      let postsLastDay = 0;
      let postsLastMonth = 0;
      let postsLastYear = postsCount; // Valor por defecto
      
      // Si podemos extraer fechas de las publicaciones, contarlas por período
      // (Esto es más conceptual, ya que Facebook no muestra fechas exactas fácilmente)
      
      return {
        id: groupId,
        name: groupName,
        url: url,
        type: isPrivate ? 'private' : 'public',
        members: memberCount,
        postsCount: postsCount,
        postsDay: postsLastDay,
        postsMonth: postsLastMonth,
        postsYear: postsLastYear,
        extractedDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('MemberInteraction: Error al extraer información del grupo', error);
      return {
        id: this.extractGroupIdFromUrl(),
        url: window.location.href,
        extractedDate: new Date().toISOString()
      };
    }
  }
  
  // Extraer número de un texto
  extractNumberFromText(text) {
    if (!text) return 0;
    const match = text.match(/(\d+[.,]?\d*)/);
    if (match) {
      return parseInt(match[1].replace(/[.,]/g, ''));
    }
    return 0;
  }
  
  // Método para futuras implementaciones de sincronización
  async syncData() {
    console.log('MemberInteraction: Sincronización de datos no implementada');
    return false;
  }

  async findMessageButton(member) {
    return new Promise(async (resolve) => {
      const startTime = Date.now();
      
      const findButton = async () => {
        try {
          console.log('Buscando botón de mensaje...');
          
          // ESTRATEGIA 1: Buscar directamente en el DOM global para casos donde el hover no funciona correctamente
          // Esto es útil para cuando estamos en la vista de miembros del grupo donde los botones ya están visibles
          const directButtonSelectors = [
            // Selector exacto basado en el HTML proporcionado - botón de mensaje en la lista de miembros
            '.xh8yej3 div[aria-label="Mensaje"][role="button"]',
            'div[aria-label="Mensaje"][role="button"]',
            'a[aria-label="Mensaje"]',
            'button[aria-label="Mensaje"]'
          ];
          
          // Intentar encontrar el botón directamente en la página
          for (const selector of directButtonSelectors) {
            const directButtons = document.querySelectorAll(selector);
            console.log(`Encontrados ${directButtons.length} botones directos con selector: ${selector}`);
            
            if (directButtons.length > 0) {
              // Si hay múltiples botones, intentar encontrar el más cercano al miembro actual
              if (directButtons.length > 1 && member) {
                // Intentar encontrar el botón dentro o cerca del elemento del miembro
                const memberRect = member.getBoundingClientRect();
                let closestButton = null;
                let minDistance = Infinity;
                
                directButtons.forEach(button => {
                  const buttonRect = button.getBoundingClientRect();
                  const distance = Math.sqrt(
                    Math.pow(buttonRect.top - memberRect.top, 2) + 
                    Math.pow(buttonRect.left - memberRect.left, 2)
                  );
                  
                  if (distance < minDistance) {
                    minDistance = distance;
                    closestButton = button;
                  }
                });
                
                if (closestButton) {
                  console.log('Botón de mensaje encontrado directamente (el más cercano al miembro)');
                  resolve(closestButton);
                  return;
                }
              }
              
              // Si no pudimos encontrar el más cercano, usar el primero
              console.log('Botón de mensaje encontrado directamente con selector:', selector);
              resolve(directButtons[0]);
              return;
            }
          }
          
          // ESTRATEGIA 2: Buscar en el modal de hover que debe haber aparecido
          console.log('Buscando modal de hover...');
          const hoverModals = [
            '.xu96u03.xm80bdy.x10l6tqk.x13vifvy', // Clase del modal de hover
            '.x1ey2m1c',                         // Otra posible clase del modal
            'div[role="dialog"]',                // Modal genérico
            '.xsgj6o6'                           // Clase del contenedor del botón según el HTML proporcionado
          ];
          
          let hoverCard = null;
          for (const modalSelector of hoverModals) {
            const possibleModals = document.querySelectorAll(modalSelector);
            if (possibleModals.length > 0) {
              // Usar el último modal encontrado (suele ser el más reciente)
              hoverCard = possibleModals[possibleModals.length - 1];
              console.log('Modal de hover encontrado con selector:', modalSelector);
              break;
            }
          }
          
          if (hoverCard) {
            // Buscar el botón de mensaje DENTRO del modal de hover
            console.log('Buscando botón de mensaje dentro del modal de hover...');
            
            // Selector exacto basado en el HTML proporcionado
            const messageButtonSelectors = [
              // Selector exacto basado en el HTML proporcionado
              'div[aria-label="Mensaje"][role="button"]',
              'a[role="button"][aria-label="Mensaje"]',
              
              // Selector alternativo para diferentes idiomas
              'div[aria-label="Message"][role="button"]',
              
              // Selectores basados en el HTML proporcionado
              '.xsgj6o6 div[aria-label="Mensaje"]',
              '.xh8yej3 div[aria-label="Mensaje"]',
              
              // Selectores más genéricos
              'div[role="button"] span:contains("Mensaje")',
              'div[role="button"]:has(span:contains("Mensaje"))',
              'div[role="button"] img[alt*="mensaje" i]'
            ];
            
            // Primero intentar buscar dentro del modal
            for (const selector of messageButtonSelectors) {
              // Buscar solo dentro del modal de hover
              const buttons = hoverCard.querySelectorAll(selector);
              console.log(`Encontrados ${buttons.length} botones con selector ${selector} dentro del modal`);
              
              if (buttons.length > 0) {
                console.log('Botón de mensaje encontrado dentro del modal con selector:', selector);
                resolve(buttons[0]);
                return;
              }
            }
            
            // Si no encontramos con selectores específicos, buscar todos los botones dentro del modal
            const modalButtons = hoverCard.querySelectorAll('div[role="button"], a[role="button"]');
            console.log(`Encontrados ${modalButtons.length} botones genéricos dentro del modal`);
            
            for (const button of modalButtons) {
              // Verificar atributo aria-label
              const ariaLabel = button.getAttribute('aria-label');
              if (ariaLabel && (ariaLabel === 'Mensaje' || ariaLabel === 'Message')) {
                console.log('Botón de mensaje encontrado por aria-label exacto:', ariaLabel);
                resolve(button);
                return;
              }
              
              // Verificar texto del botón
              const buttonText = button.textContent.trim().toLowerCase();
              if (buttonText === 'mensaje' || buttonText === 'message') {
                console.log('Botón de mensaje encontrado por texto exacto:', buttonText);
                resolve(button);
                return;
              }
              
              // Buscar texto que contenga "mensaje"
              if (buttonText.includes('mensaje') || buttonText.includes('message')) {
                console.log('Botón de mensaje encontrado por texto parcial:', buttonText);
                resolve(button);
                return;
              }
              
              // Buscar spans dentro del botón
              const spans = button.querySelectorAll('span');
              for (const span of spans) {
                const spanText = span.textContent.trim().toLowerCase();
                if (spanText.includes('mensaje') || spanText.includes('message')) {
                  console.log('Botón de mensaje encontrado por texto en span:', spanText);
                  resolve(button);
                  return;
                }
              }
              
              // Buscar imágenes dentro del botón
              const images = button.querySelectorAll('img');
              for (const img of images) {
                const alt = img.getAttribute('alt');
                const src = img.getAttribute('src');
                if ((alt && (alt.toLowerCase().includes('mensaje') || alt.toLowerCase().includes('message'))) ||
                    (src && (src.toLowerCase().includes('message')))) {
                  console.log('Botón de mensaje encontrado por imagen:', alt || src);
                  resolve(button);
                  return;
                }
              }
            }
            
            // ESTRATEGIA 3: Buscar por posición o estructura
            // Si hay exactamente 2 botones, el segundo suele ser "Mensaje"
            if (modalButtons.length === 2) {
              console.log('Usando el segundo de 2 botones como botón de mensaje');
              resolve(modalButtons[1]);
              return;
            }
            
            // Si hay más de 2 botones, buscar el que tiene la clase o estructura similar al botón de mensaje
            for (const button of modalButtons) {
              // Verificar si tiene la estructura similar al HTML proporcionado
              if (button.querySelector('.x1ey2m1c') || 
                  button.querySelector('.xh8yej3') || 
                  button.querySelector('.xsgj6o6')) {
                console.log('Botón de mensaje encontrado por estructura similar al HTML proporcionado');
                resolve(button);
                return;
              }
            }
          }
          
          // ESTRATEGIA 4: Buscar botones con texto "Mensaje" en cualquier parte de la página
          const allButtons = document.querySelectorAll('div[role="button"], a[role="button"], button');
          console.log(`Buscando entre ${allButtons.length} botones en toda la página`);
          
          for (const button of allButtons) {
            const buttonText = button.textContent.trim().toLowerCase();
            if (buttonText === 'mensaje' || buttonText === 'message') {
              console.log('Botón de mensaje encontrado en la página por texto exacto');
              resolve(button);
              return;
            }
          }
          
          // Si aún no hemos encontrado el botón y no ha pasado el timeout, seguir intentando
          if (Date.now() - startTime < 5000) {
            setTimeout(findButton, 100);
          } else {
            console.log('Tiempo de espera agotado buscando el botón de mensaje');
            console.log('Estructura HTML actual:', document.body.innerHTML);
            resolve(null);
          }
        } catch (error) {
          console.error('Error buscando el botón de mensaje:', error);
          resolve(null);
        }
      };
      
      findButton();
    });
  }

  async waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkElement = () => {
        const element = document.querySelector(selector);
        if (element) {
          resolve(element);
          return;
        }
        
        if (Date.now() - startTime >= timeout) {
          reject(new Error(`Tiempo de espera agotado buscando: ${selector}`));
          return;
        }
        
        setTimeout(checkElement, 100);
      };
      
      checkElement();
    });
  }

  async sendMessage(messageField) {
    try {
      // El messageField ya está disponible, no necesitamos hacer clic y esperar
      
      // Insertar el mensaje con el formato HTML correcto
      messageField.innerHTML = `<p class="xat24cr xdj266r xdpxx8g" dir="ltr"><span data-lexical-text="true">${this.messageToSend}</span></p>`;
      
      // Disparar evento de input para que Facebook detecte el cambio
      messageField.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: this.messageToSend
      }));

      // Esperar un momento para que Facebook procese el evento
      await new Promise(resolve => setTimeout(resolve, 500));

      // Intentar enviar el mensaje de varias maneras
      let messageSent = false;

      // Método 1: Enviar usando la tecla Enter
      try {
        messageField.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true
        }));
        
        // Verificar si el mensaje se envió (desaparece del campo)
        messageSent = await this.checkMessageSent(messageField);
      } catch (error) {
        console.log('Error al enviar mensaje con Enter:', error);
      }

      // Método 2: Si el primer método falló, buscar y hacer clic en el botón Enviar
      if (!messageSent) {
        try {
          console.log('Intentando encontrar el botón Enviar...');
          
          // Buscar el botón enviar usando diferentes selectores
          const sendButtonSelectors = [
            'div[aria-label="Enviar"]',
            'div[aria-label="Send"]',
            '[role="button"][aria-label="Enviar"]',
            '[role="button"][aria-label="Send"]',
            'button[type="submit"]',
            'div[role="button"]:has(svg)' // Muchos botones de enviar tienen un ícono SVG
          ];
          
          let sendButton = null;
          for (const selector of sendButtonSelectors) {
            sendButton = document.querySelector(selector);
            if (sendButton) {
              console.log('Botón Enviar encontrado con selector:', selector);
              break;
            }
          }
          
          // Si no se encontró con los selectores, buscar por contenido o posición
          if (!sendButton) {
            // En Facebook, a menudo el botón de enviar está al final del formulario
            const chatContainer = messageField.closest('[role="dialog"]') || messageField.closest('form');
            if (chatContainer) {
              const buttons = chatContainer.querySelectorAll('[role="button"]');
              if (buttons.length > 0) {
                // El último botón suele ser el de enviar
                sendButton = buttons[buttons.length - 1];
                console.log('Botón Enviar encontrado como último botón del contenedor');
              }
            }
          }
          
          if (sendButton) {
            sendButton.click();
            console.log('Mensaje enviado haciendo clic en botón Enviar');
            messageSent = await this.checkMessageSent(messageField);
          }
        } catch (error) {
          console.log('Error al enviar con botón Enviar:', error);
        }
      }

      // Si ninguno de los métodos anteriores funcionó, intentar con métodos adicionales
      if (!messageSent) {
        console.log('Intentando métodos alternativos para enviar el mensaje...');
        
        // Método 3: Tratar de ejecutar eventos del formulario
        const form = messageField.closest('form');
        if (form) {
          try {
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            messageSent = await this.checkMessageSent(messageField);
            if (messageSent) console.log('Mensaje enviado usando evento submit del formulario');
          } catch (error) {
            console.log('Error al enviar con submit de formulario:', error);
          }
        }
      }

      // Si aún no se ha enviado, comunicar el problema
      if (!messageSent) {
        console.warn('No se pudo enviar el mensaje automáticamente. Considera intentar manualmente.');
      }

      // Esperar un momento adicional para asegurar que el mensaje se procesó
      await new Promise(resolve => setTimeout(resolve, 1000));

      return messageSent;
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      return false;
    }
  }

  // Método para cerrar el modal del usuario
  async closeUserModal() {
    return new Promise((resolve) => {
      try {
        console.log('Buscando botón de cierre del modal de usuario...');
        
        // Buscar el botón de cierre usando el selector proporcionado
        const closeButtonSelectors = [
          // Selector exacto basado en el HTML proporcionado
          'div[aria-label="Cerrar"][role="button"]',
          'div[aria-label="Close"][role="button"]',
          
          // Selectores alternativos
          '.x1i10hfl[aria-label="Cerrar"]',
          '.x1i10hfl[aria-label="Close"]',
          
          // Selectores más genéricos
          '[aria-label="Cerrar"]',
          '[aria-label="Close"]'
        ];
        
        let closeButton = null;
        
        // Intentar encontrar el botón de cierre con los selectores específicos
        for (const selector of closeButtonSelectors) {
          const buttons = document.querySelectorAll(selector);
          console.log(`Encontrados ${buttons.length} botones de cierre con selector: ${selector}`);
          
          if (buttons.length > 0) {
            // Si hay múltiples botones, usar el primero visible
            for (const button of buttons) {
              const style = window.getComputedStyle(button);
              if (style.display !== 'none' && style.visibility !== 'hidden') {
                closeButton = button;
                console.log('Botón de cierre encontrado con selector:', selector);
                break;
              }
            }
            
            if (closeButton) break;
          }
        }
        
        // Si no encontramos el botón con los selectores específicos, buscar por contenido SVG
        if (!closeButton) {
          console.log('Buscando botón de cierre por contenido SVG...');
          
          // Buscar botones que contengan un SVG (común en botones de cierre)
          const buttonsWithSVG = document.querySelectorAll('[role="button"] svg');
          for (const svg of buttonsWithSVG) {
            // Verificar si el SVG parece ser un icono de cierre (X)
            const path = svg.querySelector('path');
            if (path && path.getAttribute('d')?.includes('z')) {
              // Los iconos de X suelen tener una 'z' en el path
              closeButton = svg.closest('[role="button"]');
              console.log('Botón de cierre encontrado por contenido SVG');
              break;
            }
          }
        }
        
        // Si encontramos el botón de cierre, hacer clic en él
        if (closeButton) {
          console.log('Haciendo clic en el botón de cierre del modal...');
          closeButton.click();
          
          // Esperar un momento para que el modal se cierre completamente
          setTimeout(() => {
            console.log('Modal de usuario cerrado exitosamente');
            resolve(true);
          }, 500);
        } else {
          console.warn('No se encontró el botón de cierre del modal, continuando con el flujo...');
          resolve(false);
        }
      } catch (error) {
        console.error('Error al cerrar el modal de usuario:', error);
        resolve(false);
      }
    });
  }

  // Función auxiliar para verificar si el mensaje se envió
  async checkMessageSent(messageField, timeout = 2000) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkContent = () => {
        // Verificar si el campo está vacío o el texto ha desaparecido
        if (!messageField.textContent.trim() || 
            !messageField.innerHTML.includes(this.messageToSend)) {
          console.log('Mensaje enviado exitosamente: campo vacío');
          resolve(true);
          return;
        }
        
        // Verificar si se ha excedido el tiempo de espera
        if (Date.now() - startTime > timeout) {
          console.log('Tiempo de espera excedido, el mensaje puede no haberse enviado');
          resolve(false);
          return;
        }
        
        // Seguir verificando
        setTimeout(checkContent, 100);
      };
      
      // Comenzar a verificar después de un breve retraso
      setTimeout(checkContent, 300);
    });
  }

  async findSendButton() {
    // Buscar el botón de enviar por su atributo aria-label
    const sendButton = await this.waitForElement('div[aria-label="Enviar"]', 5000);
    return sendButton;
  }
}

// Exportar la clase
window.leadManagerPro = window.leadManagerPro || {};
window.leadManagerPro.memberInteraction = new MemberInteraction();
