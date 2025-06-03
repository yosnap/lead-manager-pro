// Módulo para la interfaz de usuario de opciones de interacción con miembros

class GroupMemberInteractionOptionsUI {
  constructor() {
    this.container = null;
    this.interactionOptions = null;
  }

  // Inicializar el módulo
  init() {
    console.log('GroupMemberInteractionOptionsUI: Initializing module');
    
    // Inicializar el módulo de opciones de interacción
    this.interactionOptions = window.leadManagerPro.groupMemberInteractionOptions;
    
    return this;
  }

  // Crear el formulario de opciones de interacción
  createOptionsForm() {
    // Contenedor principal
    const formContainer = document.createElement('div');
    formContainer.style.cssText = `
      padding: 16px;
      border: 1px solid #ddd;
      border-radius: 8px;
      margin: 8px 0;
      background-color: white;
    `;

    // Título
    const title = document.createElement('h3');
    title.textContent = 'Opciones de Interacción con Miembros';
    title.style.cssText = `
      margin: 0 0 16px 0;
      color: #333;
      font-size: 16px;
      font-weight: bold;
    `;

    // Obtener opciones actuales
    const currentOptions = this.interactionOptions.getAllOptions();

    // Campo para número de miembros a interactuar
    const membersLabel = document.createElement('label');
    membersLabel.textContent = 'Número de miembros a interactuar:';
    membersLabel.style.cssText = `
      display: block;
      margin: 8px 0 4px 0;
      font-weight: bold;
      color: #333;
    `;

    const membersInput = document.createElement('input');
    membersInput.type = 'number';
    membersInput.min = '1';
    membersInput.max = '100';
    membersInput.value = currentOptions.membersToInteract || 10;
    membersInput.style.cssText = `
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box;
    `;

    const membersHelp = document.createElement('small');
    membersHelp.textContent = 'Cantidad máxima de miembros con los que interactuar en cada sesión';
    membersHelp.style.cssText = `
      display: block;
      color: #666;
      margin: 4px 0 8px 0;
      font-size: 12px;
    `;

    // Campo para tiempo de espera entre interacciones
    const delayLabel = document.createElement('label');
    delayLabel.textContent = 'Tiempo de espera entre interacciones (segundos):';
    delayLabel.style.cssText = `
      display: block;
      margin: 8px 0 4px 0;
      font-weight: bold;
      color: #333;
    `;

    const delayInput = document.createElement('input');
    delayInput.type = 'number';
    delayInput.min = '1';
    delayInput.max = '30';
    delayInput.step = '1';
    delayInput.value = (currentOptions.interactionDelay || 3000) / 1000;
    delayInput.style.cssText = `
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box;
    `;

    const delayHelp = document.createElement('small');
    delayHelp.textContent = 'Tiempo que esperará entre cada interacción para evitar spam';
    delayHelp.style.cssText = `
      display: block;
      color: #666;
      margin: 4px 0 8px 0;
      font-size: 12px;
    `;

    // Campo para mensaje a enviar
    const messageLabel = document.createElement('label');
    messageLabel.textContent = 'Mensaje a enviar en el chat:';
    messageLabel.style.cssText = `
      display: block;
      margin: 8px 0 4px 0;
      font-weight: bold;
      color: #333;
    `;

    const messageTextarea = document.createElement('textarea');
    messageTextarea.value = currentOptions.messageToSend || 'Hola, este es un mensaje de prueba.';
    messageTextarea.rows = 4;
    messageTextarea.style.cssText = `
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box;
      resize: vertical;
    `;

    const messageHelp = document.createElement('small');
    messageHelp.textContent = 'Texto del mensaje que se enviará a los miembros del grupo';
    messageHelp.style.cssText = `
      display: block;
      color: #666;
      margin: 4px 0 8px 0;
      font-size: 12px;
    `;

    // Opción de cerrar ventana de chat automáticamente
    const autoCloseLabel = document.createElement('label');
    autoCloseLabel.style.cssText = `
      display: flex;
      align-items: center;
      margin: 8px 0;
      cursor: pointer;
    `;

    const autoCloseCheckbox = document.createElement('input');
    autoCloseCheckbox.type = 'checkbox';
    autoCloseCheckbox.checked = currentOptions.autoCloseChat !== false;
    autoCloseCheckbox.style.cssText = `
      margin-right: 8px;
    `;

    const autoCloseText = document.createElement('span');
    autoCloseText.textContent = 'Cerrar la ventana de chat automáticamente';
    autoCloseText.style.cssText = `
      color: #333;
      font-weight: bold;
    `;

    autoCloseLabel.appendChild(autoCloseCheckbox);
    autoCloseLabel.appendChild(autoCloseText);

    const autoCloseHelp = document.createElement('small');
    autoCloseHelp.textContent = 'Si está marcado, cerrará automáticamente cada ventana de chat después de enviar el mensaje';
    autoCloseHelp.style.cssText = `
      display: block;
      color: #666;
      margin: 4px 0 16px 0;
      font-size: 12px;
    `;

    // Botón de guardar
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Guardar opciones de interacción';
    saveButton.className = 'lead-manager-button';
    saveButton.style.cssText = `
      padding: 8px 16px;
      background-color: #4267B2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      margin-top: 8px;
    `;
    
    // Agregar evento de clic al botón
    saveButton.addEventListener('click', () => {
      // Obtener y validar valores
      const members = parseInt(membersInput.value);
      const delay = parseFloat(delayInput.value);
      const message = messageTextarea.value.trim();
      
      if (isNaN(members) || members < 1) {
        alert('Por favor, ingrese un número válido de miembros');
        return;
      }
      
      if (isNaN(delay) || delay < 1) {
        alert('Por favor, ingrese un tiempo válido de espera');
        return;
      }
      
      if (message === '') {
        alert('Por favor, ingrese un mensaje');
        return;
      }
      
      // Guardar opciones
      const success = this.interactionOptions.saveOptions({
        membersToInteract: members,
        interactionDelay: delay * 1000, // Convertir a milisegundos
        messageToSend: message,
        autoCloseChat: autoCloseCheckbox.checked
      });
      
      if (success) {
        // Mostrar mensaje de éxito
        const successMessage = document.createElement('div');
        successMessage.textContent = '✓ Opciones de interacción guardadas correctamente';
        successMessage.style.cssText = `
          color: #00C851;
          margin-top: 8px;
          font-size: 14px;
        `;
        
        formContainer.appendChild(successMessage);
        
        // Eliminar el mensaje después de 3 segundos
        setTimeout(() => {
          if (formContainer.contains(successMessage)) {
            formContainer.removeChild(successMessage);
          }
        }, 3000);
      } else {
        alert('Error al guardar las opciones. Por favor, intente de nuevo.');
      }
    });
    
    // Ensamblar el formulario
    formContainer.appendChild(title);
    formContainer.appendChild(membersLabel);
    formContainer.appendChild(membersInput);
    formContainer.appendChild(membersHelp);
    formContainer.appendChild(delayLabel);
    formContainer.appendChild(delayInput);
    formContainer.appendChild(delayHelp);
    formContainer.appendChild(messageLabel);
    formContainer.appendChild(messageTextarea);
    formContainer.appendChild(messageHelp);
    formContainer.appendChild(autoCloseLabel);
    formContainer.appendChild(autoCloseHelp);
    formContainer.appendChild(saveButton);
    
    return formContainer;
  }

  // Inyectar formulario de opciones en un contenedor
  injectOptionsForm(container) {
    if (!container) {
      console.error('GroupMemberInteractionOptionsUI: No se proporcionó un contenedor válido');
      return false;
    }
    
    // Limpiar el contenedor
    container.innerHTML = '';
    
    // Crear y agregar el formulario
    const form = this.createOptionsForm();
    container.appendChild(form);
    
    return true;
  }
}

// Exportar la clase
window.leadManagerPro = window.leadManagerPro || {};
window.leadManagerPro.groupMemberInteractionOptionsUI = new GroupMemberInteractionOptionsUI();
