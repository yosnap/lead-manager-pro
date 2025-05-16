/**
 * Implementación completa del acordeón de mensajes para la interacción con miembros
 * 
 * Este archivo contiene las funciones necesarias para crear y gestionar
 * un acordeón con 5 mensajes personalizados que se enviarán aleatoriamente
 * durante las interacciones con miembros.
 */

// Clase para gestionar el acordeón de mensajes
class MessagesAccordion {
  constructor() {
    this.messageTextareas = [];
    this.defaultMessage = 'Hola, este es un mensaje de prueba desde la plataforma, has caso omiso ya que solo sirve para pruebas. !Un saludo!';
  }

  // Crear el acordeón de mensajes
  createAccordion() {
    // Contenedor principal de mensajes
    const messagesContainer = document.createElement('div');
    messagesContainer.className = 'lead-manager-messages-container';
    messagesContainer.style.marginBottom = '16px';
    
    // Etiqueta para los mensajes
    const messagesLabel = document.createElement('div');
    messagesLabel.textContent = 'Mensajes personalizados (se enviarán aleatoriamente):';
    messagesLabel.style.fontWeight = 'bold';
    messagesLabel.style.marginBottom = '8px';
    messagesContainer.appendChild(messagesLabel);
    
    // Crear acordeón para los mensajes
    const accordionContainer = document.createElement('div');
    accordionContainer.className = 'lead-manager-accordion';
    accordionContainer.style.cssText = `
      border: 1px solid #CED0D4;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 16px;
    `;
    
    // Limpiar array de textareas
    this.messageTextareas = [];
    
    // Crear 5 paneles de acordeón para los mensajes
    for (let i = 0; i < 5; i++) {
      // Panel del acordeón
      const accordionPanel = document.createElement('div');
      accordionPanel.className = 'lead-manager-accordion-panel';
      accordionPanel.style.borderBottom = i < 4 ? '1px solid #CED0D4' : 'none';
      
      // Botón del acordeón
      const accordionButton = document.createElement('button');
      accordionButton.className = 'lead-manager-accordion-button';
      accordionButton.textContent = `Mensaje ${i + 1}`;
      accordionButton.style.cssText = `
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
      `;
      
      // Icono para el acordeón
      const accordionIcon = document.createElement('span');
      accordionIcon.textContent = '+';
      accordionIcon.style.cssText = `
        font-size: 16px;
        transition: transform 0.3s;
      `;
      accordionButton.appendChild(accordionIcon);
      
      // Contenido del acordeón
      const accordionContent = document.createElement('div');
      accordionContent.className = 'lead-manager-accordion-content';
      accordionContent.style.cssText = `
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease-out;
        background-color: white;
      `;
      
      // Textarea para el mensaje
      const messageTextarea = document.createElement('textarea');
      messageTextarea.className = `message-textarea-${i}`;
      messageTextarea.value = i === 0 ? this.defaultMessage : '';
      messageTextarea.placeholder = `Escribe aquí el mensaje ${i + 1}...`;
      messageTextarea.style.cssText = `
        width: calc(100% - 20px);
        padding: 8px;
        margin: 10px;
        border-radius: 4px;
        border: 1px solid #CED0D4;
        min-height: 80px;
        resize: vertical;
      `;
      
      // Guardar referencia al textarea
      this.messageTextareas.push(messageTextarea);
      
      // Añadir textarea al contenido del acordeón
      accordionContent.appendChild(messageTextarea);
      
      // Evento para el botón del acordeón
      accordionButton.addEventListener('click', function() {
        // Toggle active class
        this.classList.toggle('active');
        
        // Cambiar el icono
        accordionIcon.textContent = this.classList.contains('active') ? '-' : '+';
        
        // Toggle panel de contenido
        if (accordionContent.style.maxHeight !== '0px' && accordionContent.style.maxHeight !== '') {
          accordionContent.style.maxHeight = '0px';
        } else {
          accordionContent.style.maxHeight = messageTextarea.scrollHeight + 40 + 'px';
        }
      });
      
      // Añadir elementos al panel
      accordionPanel.appendChild(accordionButton);
      accordionPanel.appendChild(accordionContent);
      
      // Añadir panel al contenedor del acordeón
      accordionContainer.appendChild(accordionPanel);
    }
    
    // Abrir el primer panel por defecto
    setTimeout(() => {
      const firstButton = accordionContainer.querySelector('.lead-manager-accordion-button');
      if (firstButton) firstButton.click();
    }, 100);
    
    // Añadir acordeón al contenedor de mensajes
    messagesContainer.appendChild(accordionContainer);
    
    return messagesContainer;
  }

  // Obtener los mensajes configurados
  getConfiguredMessages() {
    return this.messageTextareas
      .map(textarea => textarea.value.trim())
      .filter(message => message.length > 0);
  }

  // Cargar mensajes guardados
  loadSavedMessages(messages) {
    if (!Array.isArray(messages) || messages.length === 0) return;
    
    // Limpiar todos los textareas
    this.messageTextareas.forEach(textarea => textarea.value = '');
    
    // Cargar los mensajes guardados
    messages.forEach((message, index) => {
      if (index < this.messageTextareas.length) {
        this.messageTextareas[index].value = message;
      }
    });
  }

  // Seleccionar un mensaje aleatorio
  selectRandomMessage() {
    const messages = this.getConfiguredMessages();
    
    if (messages.length === 0) {
      return this.defaultMessage;
    }
    
    // Seleccionar un mensaje aleatorio del array
    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
  }
}

// Crear instancia global
window.leadManagerPro = window.leadManagerPro || {};
window.leadManagerPro.messagesAccordion = new MessagesAccordion();
