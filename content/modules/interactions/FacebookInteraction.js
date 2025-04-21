// Clase para manejar interacciones específicas con Facebook
class FacebookInteraction {
  constructor() {
    this.selectors = {
      // Selectores generales
      memberCard: '[role="listitem"]',
      memberName: 'a.x1i10hfl[role="link"]:not([aria-hidden="true"])',
      memberLink: 'a.x1i10hfl[role="link"]:not([aria-hidden="true"])',
      messageButton: '[aria-label="Mensaje"], [aria-label="Message"]',
      messageInput: '[contenteditable="true"]',
      sendButton: '[aria-label="Enviar"], [aria-label="Send"]',
      
      // Navegación
      peopleTab: '[role="tablist"] a[href*="/members"]',
      
      // Selector específico para administradores
      adminSection: {
        // El contenedor principal de la sección de administradores
        container: '.x1n2onr6.x1ja2u2z.x9f619.x78zum5.xdt5ytf.x2lah0s.x193iq5w.xx6bls6.x1jx94hy',
        // La lista de miembros
        memberList: '[role="list"]',
        // El indicador de administrador/moderador (el span que contiene el texto)
        adminIndicator: '.x1lliihq.x6ikm8r.x10wlt62.x1n2onr6:contains("Administrador"), .x1lliihq.x6ikm8r.x10wlt62.x1n2onr6:contains("Moderador")'
      }
    };
  }

  // Método de inicialización
  async initialize() {
    try {
      if (document.readyState === 'loading') {
        await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
      }
      await this.navigateToPeopleSection();
    } catch (error) {
      console.error('Error durante la inicialización:', error);
    }
  }

  // Navegar a la sección de personas
  async navigateToPeopleSection() {
    try {
      const peopleTab = document.querySelector(this.selectors.peopleTab);
      if (!peopleTab) {
        throw new Error('No se encontró la pestaña de Personas');
      }
      
      peopleTab.click();
      await this.delay(2000);
      return true;
    } catch (error) {
      console.error('Error al navegar a la sección de personas:', error);
      return false;
    }
  }

  // Obtener administradores y moderadores
  async getAdmins(maxMembers = 10) {
    try {
      // Buscar el contenedor principal de administradores
      const container = document.querySelector(this.selectors.adminSection.container);
      if (!container) {
        throw new Error('No se encontró el contenedor de administradores');
      }

      // Buscar la lista de miembros dentro del contenedor
      const memberList = container.querySelector(this.selectors.adminSection.memberList);
      if (!memberList) {
        throw new Error('No se encontró la lista de administradores');
      }

      // Obtener todas las tarjetas de miembros
      const memberCards = Array.from(memberList.querySelectorAll(this.selectors.memberCard));
      const admins = [];

      for (const card of memberCards) {
        if (admins.length >= maxMembers) break;

        // Verificar si es administrador o moderador
        const isAdmin = card.querySelector(this.selectors.adminSection.adminIndicator);
        if (isAdmin) {
          const adminInfo = await this.getMemberInfo(card);
          if (adminInfo) {
            admins.push(adminInfo);
          }
        }
      }

      return admins;
    } catch (error) {
      console.error('Error al obtener administradores:', error);
      return [];
    }
  }

  // Obtener información de un miembro desde su tarjeta
  async getMemberInfo(memberCard) {
    try {
      const nameElement = memberCard.querySelector(this.selectors.memberName);
      const linkElement = memberCard.querySelector(this.selectors.memberLink);
      const messageButton = memberCard.querySelector(this.selectors.messageButton);
      
      if (!nameElement || !linkElement || !messageButton) {
        return null;
      }

      return {
        name: nameElement.textContent.trim(),
        profileUrl: linkElement.href,
        element: memberCard,
        messageButton: messageButton
      };
    } catch (error) {
      console.error('Error al obtener información del miembro:', error);
      return null;
    }
  }

  // Enviar mensaje a un miembro
  async sendMessage(member, message) {
    try {
      member.messageButton.click();
      await this.delay(1000);

      const messageInput = document.querySelector(this.selectors.messageInput);
      if (!messageInput) {
        throw new Error('No se encontró el campo de mensaje');
      }

      await this.typeMessage(messageInput, message);
      await this.delay(500);

      const sendButton = document.querySelector(this.selectors.sendButton);
      if (!sendButton) {
        throw new Error('No se encontró el botón de enviar');
      }

      sendButton.click();
      await this.delay(1000);

      const closeButton = document.querySelector('[aria-label="Cerrar chat"], [aria-label="Close chat"]');
      if (closeButton) {
        closeButton.click();
        await this.delay(500);
      }

      return true;
    } catch (error) {
      console.error(`Error al enviar mensaje a ${member.name}:`, error);
      return false;
    }
  }

  // Simular escritura natural
  async typeMessage(element, text) {
    element.innerHTML = '';
    
    const p = document.createElement('p');
    p.className = 'xat24cr xdj266r xdpxx8g';
    p.setAttribute('dir', 'ltr');
    
    const span = document.createElement('span');
    span.setAttribute('data-lexical-text', 'true');
    span.textContent = text;
    
    p.appendChild(span);
    element.appendChild(p);
    
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Utilidad para esperar
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Exportar la clase
export default FacebookInteraction; 