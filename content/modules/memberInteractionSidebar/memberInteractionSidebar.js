          startButton.textContent = 'Iniciar Interacción';
          startButton.style.backgroundColor = '#1877f2';
          this.interactionInProgress = false;
          progressStatus.textContent = `Error: ${error.message}`;
        }
      }
    });
    
    buttonsContainer.appendChild(saveButton);
    buttonsContainer.appendChild(startButton);
    
    // Ensamblar todos los componentes
    content.appendChild(memberTypeContainer);
    content.appendChild(messagesContainer);
    content.appendChild(waitTimeContainer);
    content.appendChild(advancedOptionsContainer);
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
  
  async startInteraction(progressFill, progressStatus) {
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
      
      // Asegurarse de pasar el valor correcto de maxMembersToInteract
      this.memberInteraction.maxMembersToInteract = this.maxMembersToInteract;
      
      console.log('Iniciando interacción con configuración:');
      console.log('- maxMembersToInteract:', this.maxMembersToInteract);
      console.log('- waitTime:', this.waitTime);
      console.log('- autoCloseChat:', this.autoCloseChat);
      console.log('- Mensajes disponibles:', this.messages.length);
      
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
      
      // Iniciar la interacción con los miembros
      this.memberInteraction.init(memberElements, { delay: this.waitTime * 1000 });
      
      const startTime = Date.now();
      
      // Actualizar UI indicando que está iniciando
      progressFill.style.width = '5%';
      progressStatus.textContent = `Preparando interacción con ${memberElements.length} miembros (límite máximo: ${this.maxMembersToInteract})...`;
      
      // Iniciar la interacción
      await this.memberInteraction.startInteraction((progress) => {
        if (progress.type === 'progress') {
          // Calcular el porcentaje de progreso
          const percent = Math.round((progress.memberIndex / progress.totalMembers) * 100);
          
          // Actualizar la barra de progreso
          progressFill.style.width = `${percent}%`;
          
          // Actualizar el texto de estado
          progressStatus.textContent = `Procesando miembro ${progress.memberIndex + 1} de ${progress.totalMembers}`;
          
          if (progress.messageOpened) {
            progressStatus.textContent += ' - Mensaje enviado';
          }
        } else if (progress.type === 'complete') {
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
        } else if (progress.type === 'error') {
          // Actualizar UI indicando que ha ocurrido un error
          progressStatus.textContent = `Error: ${progress.error.message}`;
          progressStatus.style.color = '#dc3545';
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error en startInteraction:', error);
      progressStatus.textContent = `Error: ${error.message}`;
      progressStatus.style.color = '#dc3545';
      
      return false;
    }
  }
  
  stopInteraction() {
    if (this.memberInteraction) {
      this.memberInteraction.stopInteraction = true;
      this.progressStatus.textContent = 'Deteniendo interacción...';
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
window.leadManagerPro.memberInteractionSidebar = new MemberInteractionSidebar();
