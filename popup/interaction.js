// Archivo para manejar la interacción con miembros desde el popup
document.addEventListener('DOMContentLoaded', function() {
  // Obtener referencias a los elementos
  const memberTypeSelect = document.getElementById('member-type');
  const messageTextarea = document.getElementById('message-text');
  const delayInput = document.getElementById('delay-time');
  const maxMembersInput = document.getElementById('max-members');
  const autoCloseCheckbox = document.getElementById('auto-close');
  const startButton = document.getElementById('start-interaction');
  const statusMessage = document.getElementById('status-message');
  
  // Cargar configuración guardada
  loadSavedConfig();
  
  // Evento para iniciar interacción
  if (startButton) {
    startButton.addEventListener('click', function() {
      // Validar valores
      const memberType = memberTypeSelect.value;
      const message = messageTextarea.value.trim();
      const delay = parseFloat(delayInput.value);
      const maxMembers = parseInt(maxMembersInput.value);
      const autoClose = autoCloseCheckbox.checked;
      
      if (!message) {
        showStatusMessage('Por favor, ingresa un mensaje para enviar', 'error');
        return;
      }
      
      if (isNaN(delay) || delay < 1) {
        showStatusMessage('Por favor, ingresa un tiempo de espera válido (mínimo 1 segundo)', 'error');
        return;
      }
      
      if (isNaN(maxMembers) || maxMembers < 1) {
        showStatusMessage('Por favor, ingresa un número válido para el máximo de miembros', 'error');
        return;
      }
      
      // Guardar configuración
      const config = {
        messageToSend: message,
        interactionDelay: delay,
        delay: delay * 1000, // En milisegundos para el content script
        membersToInteract: maxMembers,
        maxMembers: maxMembers,
        autoCloseChat: autoClose,
        lastMemberType: memberType,
        sourceType: "popup" // Agregar un identificador para que la interacción sepa que viene del popup
      };
      
      saveConfig(config);
      
      // Mostrar estado de carga
      showStatusMessage('Iniciando interacción...', 'loading');
      
      // Enviar mensaje al background script, que a su vez lo enviará al content script
        
        // Enviar mensaje al background script, que a su vez lo enviará al content script
        chrome.runtime.sendMessage({
          action: 'startInteractionFromPopup',
          sectionType: memberType,
          config: config
        }, function(response) {
          if (chrome.runtime.lastError) {
            console.error('Error al enviar mensaje:', chrome.runtime.lastError);
            showStatusMessage('Error: No se pudo conectar con la extensión.', 'error');
            return;
          }
          
          if (response && response.success) {
            showStatusMessage('Interacción iniciada correctamente', 'success');
            // Cerrar el popup después de un breve retraso
            setTimeout(() => window.close(), 1500);
          } else {
            showStatusMessage('Error al iniciar la interacción: ' + (response?.error || 'Desconocido'), 'error');
          }
        });
      });
    });
  }
  
  // Función para mostrar mensaje de estado
  function showStatusMessage(message, type = 'info') {
    if (!statusMessage) return;
    
    statusMessage.textContent = message;
    
    // Quitar clases previas
    statusMessage.classList.remove('status-info', 'status-error', 'status-success', 'status-loading');
    
    // Agregar clase según el tipo
    statusMessage.classList.add('status-' + type);
    
    // Mostrar el elemento
    statusMessage.style.display = 'block';
  }
  
  // Función para guardar configuración
  function saveConfig(config) {
    chrome.storage.local.set({ 'leadManagerGroupSettings': config }, function() {
      console.log('Configuración guardada:', config);
    });
  }
  
  // Función para cargar configuración guardada
  function loadSavedConfig() {
    chrome.storage.local.get(['leadManagerGroupSettings'], function(result) {
      const config = result.leadManagerGroupSettings;
      
      if (!config) return;
      
      // Aplicar valores a los campos
      if (memberTypeSelect && config.lastMemberType) {
        memberTypeSelect.value = config.lastMemberType;
      }
      
      if (messageTextarea && config.messageToSend) {
        messageTextarea.value = config.messageToSend;
      }
      
      if (delayInput && config.interactionDelay) {
        delayInput.value = config.interactionDelay;
      }
      
      if (maxMembersInput && config.membersToInteract) {
        maxMembersInput.value = config.membersToInteract;
      }
      
      if (autoCloseCheckbox && config.autoCloseChat !== undefined) {
        autoCloseCheckbox.checked = config.autoCloseChat;
      }
      
      console.log('Configuración cargada:', config);
    });
  }
});
