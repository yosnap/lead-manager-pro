// Módulo para gestionar la interacción con miembros de grupos

class MemberInteraction {
  constructor() {
    this.isInteracting = false;
    this.currentMemberIndex = 0;
    this.members = [];
    this.interactionDelay = 2000; // tiempo de espera entre acciones en ms
    this.stopInteraction = false;
    this.messageToSend = 'Hola, me interesa conectar contigo.'; // mensaje a enviar
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
    
    // Determinar cuántos miembros procesar
    const membersToProcess = Math.min(this.members.length, this.maxMembersToInteract);
    console.log(`MemberInteraction: Iniciando interacción con ${membersToProcess} miembros de un total de ${this.members.length}`);
    
    // Obtener las últimas configuraciones desde Extension Storage
    await this.loadConfigFromStorage();
    
    // Obtener información del grupo actual
    this.currentGroupInfo = this.extractCurrentGroupInfo();
    
    // Verificar si hay miembros para procesar
    if (membersToProcess === 0) {
      console.warn('MemberInteraction: No hay miembros para interactuar');
      
      if (callback) {
        callback({
          type: 'error',
          message: 'No hay miembros disponibles para interactuar'
        });
      }
      
      this.isInteracting = false;
      return false;
    }
    
    let processedMembers = 0;
    
    // Procesar cada miembro hasta alcanzar el límite o hasta que se detenga manualmente
    for (let i = 0; i < membersToProcess; i++) {
      // Verificar si se ha solicitado detener
      if (this.stopInteraction) {
        console.log('MemberInteraction: Interacción detenida por el usuario');
        break;
      }
      
      const member = this.members[i];
      this.currentMemberIndex = i;
      
      try {
        // Notificar que estamos comenzando con este miembro
        if (callback) {
          callback({
            type: 'progress',
            memberIndex: i,
            totalMembers: membersToProcess,
            memberElement: member,
            messageOpened: false,
            message: `Iniciando hover sobre el miembro ${i+1} de ${membersToProcess}...`
          });
        }
        
        // Realizar hover sobre el miembro
        console.log(`MemberInteraction: Realizando hover sobre el miembro ${i+1}`);
        await this.hoverOnMember(member);
        
        // Notificar que se completó el hover
        if (callback) {
          callback({
            type: 'progress',
            memberIndex: i,
            totalMembers: membersToProcess,
            memberElement: member,
            messageOpened: false,
            message: `Hover completado, esperando ${this.interactionDelay/1000} segundos...`
          });
        }
        
        // Esperar el tiempo configurado
        await new Promise(resolve => setTimeout(resolve, this.interactionDelay));
        
        // Verificar nuevamente si se ha solicitado detener
        if (this.stopInteraction) {
          console.log('MemberInteraction: Interacción detenida durante la espera');
          break;
        }
        
        // Notificar que vamos a abrir la ventana de mensaje
        if (callback) {
          callback({
            type: 'progress',
            memberIndex: i,
            totalMembers: membersToProcess,
            memberElement: member,
            messageOpened: false,
            message: 'Abriendo ventana de mensaje...'
          });
        }
        
        // Intentar abrir la ventana de mensaje
        console.log('MemberInteraction: Abriendo ventana de mensaje');
        const messageWindowOpened = await this.openMessageWindow(member);
        
        if (messageWindowOpened) {
          // Notificar que se abrió la ventana
          if (callback) {
            callback({
              type: 'progress',
              memberIndex: i,
              totalMembers: membersToProcess,
              memberElement: member,
              messageOpened: true,
              message: 'Ventana de mensaje abierta, esperando acción...'
            });
          }
          
          // Esperar a que la ventana se cierre antes de continuar
          console.log('MemberInteraction: Esperando a que se cierre la ventana de mensaje');
          const messageResult = await this.waitForMessageWindowToBeClosed();
          
          // Incrementar contador solo si se envió el mensaje
          if (messageResult && messageResult.messageSent) {
            processedMembers++;
          }
          
          // Notificar que se cerró la ventana
          if (callback) {
            callback({
              type: 'progress',
              memberIndex: i,
              totalMembers: membersToProcess,
              memberElement: member,
              messageOpened: false,
              message: messageResult && messageResult.messageSent ? 
                'Mensaje enviado y ventana cerrada.' : 
                'Ventana cerrada sin enviar mensaje.'
            });
          }
        } else {
          console.log('MemberInteraction: No se pudo abrir la ventana de mensaje');
          
          if (callback) {
            callback({
              type: 'progress',
              memberIndex: i,
              totalMembers: membersToProcess,
              memberElement: member,
              messageOpened: false,
              message: 'No se pudo abrir la ventana de mensaje para este miembro.'
            });
          }
        }
        
        // Pequeña pausa antes de continuar con el siguiente miembro
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`MemberInteraction: Error en interacción con miembro ${i+1}`, error);
        
        if (callback) {
          callback({
            type: 'error',
            memberIndex: i,
            totalMembers: membersToProcess,
            error: error,
            message: 'Error durante la interacción: ' + error.message
          });
        }
      }
    }
    
    // Finalizar la interacción
    this.isInteracting = false;
    
    if (callback) {
      callback({
        type: 'complete',
        processedMembers: processedMembers,
        totalMembers: membersToProcess,
        message: `Interacción completada: Se envió mensaje a ${processedMembers} de ${membersToProcess} miembros.`
      });
    }
    
    console.log(`MemberInteraction: Interacción completada. Se procesaron ${membersToProcess} miembros.`);
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
  async hoverOnMember(memberElement) {
    return new Promise((resolve) => {
      try {
        console.log('MemberInteraction: Intentando realizar hover en elemento:', memberElement);
        
        // Buscar el enlace principal (perfil de usuario)
        const profileLinks = memberElement.querySelectorAll('a[href*="/user/"], a[href*="/profile.php"]');
        
        if (profileLinks.length > 0) {
          // Seleccionar el primer enlace (normalmente es el nombre del usuario)
          const nameLink = profileLinks[0];
          
          console.log('MemberInteraction: Enlace de perfil encontrado:', nameLink);
          
          // Hacer scroll para asegurar que el elemento esté visible
          nameLink.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Pequeña pausa para que se complete el scroll
          setTimeout(() => {
            // Crear y disparar el evento de mouse over
            const mouseoverEvent = new MouseEvent('mouseover', {
              bubbles: true,
              cancelable: true,
              view: window
            });
            
            nameLink.dispatchEvent(mouseoverEvent);
            console.log('MemberInteraction: Evento mouseover disparado en el enlace de perfil');
            
            // También intentar hacer hover sobre el elemento contenedor (tarjeta completa)
            const parentCard = nameLink.closest('div[role="listitem"]');
            if (parentCard) {
              parentCard.dispatchEvent(new MouseEvent('mouseover', {
                bubbles: true,
                cancelable: true,
                view: window
              }));
              console.log('MemberInteraction: Evento mouseover disparado en la tarjeta completa');
            }
            
            // Intento adicional: encontrar la imagen del usuario y hacer hover en ella también
            const userImage = memberElement.querySelector('svg, img');
            if (userImage) {
              userImage.dispatchEvent(new MouseEvent('mouseover', {
                bubbles: true,
                cancelable: true,
                view: window
              }));
              console.log('MemberInteraction: Evento mouseover disparado en la imagen de perfil');
            }
            
            console.log('MemberInteraction: Hover realizado exitosamente sobre el miembro');
            
            // Resolver después de un pequeño retraso para permitir que aparezca la tarjeta informativa
            setTimeout(resolve, 500);
          }, 500);
        } else {
          console.warn('MemberInteraction: No se encontró ningún enlace de perfil para hacer hover');
          
          // Intentar hacer hover en todo el elemento de la tarjeta
          memberElement.dispatchEvent(new MouseEvent('mouseover', {
            bubbles: true,
            cancelable: true,
            view: window
          }));
          
          console.log('MemberInteraction: Intento alternativo de hover en el elemento completo');
          setTimeout(resolve, 500);
        }
      } catch (error) {
        console.error('MemberInteraction: Error al realizar hover:', error);
        resolve(); // Resolver la promesa incluso en caso de error
      }
    });
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
}

// Exportar la clase
window.leadManagerPro = window.leadManagerPro || {};
window.leadManagerPro.memberInteraction = new MemberInteraction();
