/**
 * Script para la página de ajustes de Lead Manager Pro
 * Gestiona la configuración de la extensión
 */

document.addEventListener('DOMContentLoaded', function() {
  // Referencias a elementos de la interfaz
  const backButton = document.getElementById('back-button');
  const saveButton = document.getElementById('save-settings');
  const emergencyButtonToggle = document.getElementById('emergency-button-toggle');
  
  // Cargar configuración actual
  loadSettings();
  
  // Evento para el botón de volver
  backButton.addEventListener('click', function() {
    window.location.href = 'popup.html';
  });
  
  // Evento para guardar configuración
  saveButton.addEventListener('click', function() {
    saveSettings();
  });
  
  /**
   * Carga la configuración guardada
   */
  function loadSettings() {
    chrome.storage.local.get(['lmpSettings'], function(result) {
      const settings = result.lmpSettings || { showEmergencyButton: true };
      
      // Aplicar configuración a la interfaz
      emergencyButtonToggle.checked = settings.showEmergencyButton;
    });
  }
  
  /**
   * Guarda la configuración actual
   */
  function saveSettings() {
    const settings = {
      showEmergencyButton: emergencyButtonToggle.checked
    };
    
    chrome.storage.local.set({ lmpSettings: settings }, function() {
      // Mostrar mensaje de confirmación
      showMessage('Configuración guardada correctamente', 'success');
      
      // Enviar mensaje a las pestañas activas para actualizar la configuración
      chrome.tabs.query({}, function(tabs) {
        tabs.forEach(tab => {
          if (tab.url && tab.url.includes('facebook.com')) {
            chrome.tabs.sendMessage(tab.id, {
              action: 'updateSettings',
              settings: settings
            });
          }
        });
      });
    });
  }
  
  /**
   * Muestra un mensaje temporal
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo de mensaje (success, error, info)
   */
  function showMessage(message, type = 'info') {
    // Eliminar mensajes anteriores
    const existingMessages = document.querySelectorAll('.message-toast');
    existingMessages.forEach(msg => msg.remove());
    
    // Crear elemento de mensaje
    const messageElement = document.createElement('div');
    messageElement.classList.add('message-toast');
    messageElement.textContent = message;
    
    // Aplicar estilos según el tipo
    let backgroundColor;
    switch (type) {
      case 'success':
        backgroundColor = '#4CAF50';
        break;
      case 'error':
        backgroundColor = '#F44336';
        break;
      default:
        backgroundColor = '#2196F3';
    }
    
    // Estilos para el mensaje
    messageElement.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 20px;
      background-color: ${backgroundColor};
      color: white;
      border-radius: 4px;
      z-index: 1000;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      font-size: 14px;
    `;
    
    // Agregar al DOM
    document.body.appendChild(messageElement);
    
    // Eliminar después de 3 segundos
    setTimeout(() => {
      messageElement.style.opacity = '0';
      messageElement.style.transition = 'opacity 0.5s ease';
      
      setTimeout(() => {
        messageElement.remove();
      }, 500);
    }, 3000);
  }
});
