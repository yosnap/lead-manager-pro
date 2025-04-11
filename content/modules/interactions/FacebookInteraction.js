// Clase para manejar interacciones específicas con Facebook
class FacebookInteraction {
  constructor() {
    this.selectors = {
      memberCard: '[role="gridcell"]',
      memberName: '[role="gridcell"] h2',
      memberLink: '[role="gridcell"] a[href*="/user/"]',
      messageButton: '[aria-label="Enviar mensaje"]',
      messageInput: '[contenteditable="true"]',
      sendButton: '[aria-label="Enviar"]',
      commonThingsButton: '[aria-label="Cosas en común"]'
    };
  }

  // Obtener información de un miembro desde su tarjeta
  async getMemberInfo(memberCard) {
    try {
      const nameElement = memberCard.querySelector(this.selectors.memberName);
      const linkElement = memberCard.querySelector(this.selectors.memberLink);
      
      if (!nameElement || !linkElement) {
        throw new Error('No se pudo encontrar la información básica del miembro');
      }

      return {
        id: this.extractUserId(linkElement.href),
        name: nameElement.textContent.trim(),
        profileUrl: linkElement.href,
        element: memberCard
      };
    } catch (error) {
      console.error('Error al obtener información del miembro:', error);
      return null;
    }
  }

  // Extraer ID de usuario de la URL del perfil
  extractUserId(url) {
    try {
      const match = url.match(/\/user\/(\d+)/);
      return match ? match[1] : null;
    } catch (error) {
      console.error('Error al extraer ID de usuario:', error);
      return null;
    }
  }

  // Enviar mensaje a un miembro
  async sendMessage(member, messageTemplate) {
    try {
      // Abrir diálogo de mensaje
      const messageButton = member.element.querySelector(this.selectors.messageButton);
      if (!messageButton) {
        throw new Error('Botón de mensaje no encontrado');
      }
      
      messageButton.click();
      await this.delay(1000); // Esperar a que se abra el diálogo

      // Encontrar el campo de entrada de mensaje
      const messageInput = document.querySelector(this.selectors.messageInput);
      if (!messageInput) {
        throw new Error('Campo de mensaje no encontrado');
      }

      // Insertar mensaje personalizado
      const personalizedMessage = this.personalizeMessage(messageTemplate, member);
      await this.typeMessage(messageInput, personalizedMessage);

      // Enviar mensaje
      const sendButton = document.querySelector(this.selectors.sendButton);
      if (!sendButton) {
        throw new Error('Botón de enviar no encontrado');
      }
      
      sendButton.click();
      await this.delay(1000); // Esperar a que se envíe el mensaje

      return true;
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      return false;
    }
  }

  // Personalizar mensaje con datos del miembro
  personalizeMessage(template, member) {
    return template
      .replace('{nombre}', member.name)
      .replace('{perfil}', member.profileUrl);
  }

  // Simular escritura natural
  async typeMessage(element, text) {
    // Limpiar contenido existente
    element.innerHTML = '';
    
    // Crear estructura del mensaje
    const p = document.createElement('p');
    p.className = 'xat24cr xdj266r xdpxx8g';
    p.setAttribute('dir', 'ltr');
    
    const span = document.createElement('span');
    span.setAttribute('data-lexical-text', 'true');
    span.textContent = text;
    
    p.appendChild(span);
    element.appendChild(p);
    
    // Disparar eventos
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Verificar cosas en común
  async checkCommonThings(member) {
    try {
      const commonButton = member.element.querySelector(this.selectors.commonThingsButton);
      if (!commonButton) {
        return null;
      }

      commonButton.click();
      await this.delay(1000); // Esperar a que se cargue la información

      // Aquí implementaremos la lógica para extraer la información de cosas en común
      // Por ahora retornamos un objeto vacío
      return {};
    } catch (error) {
      console.error('Error al verificar cosas en común:', error);
      return null;
    }
  }

  // Utilidad para esperar
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Exportar la clase
export default FacebookInteraction; 