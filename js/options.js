document.addEventListener('DOMContentLoaded', function() {
  const backButton = document.getElementById('back-button');
  const emergencyButtonToggle = document.getElementById('emergency-button-toggle');
  const optionLabel = document.querySelector('.option-label');
  
  // Función para mostrar notificación de guardado
  function showSavedNotification() {
    // Crear elemento de notificación si no existe
    let notification = document.getElementById('save-notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'save-notification';
      notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #4CAF50;
        color: white;
        padding: 10px 20px;
        border-radius: 4px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        transition: opacity 0.3s;
        z-index: 1000;
      `;
      document.body.appendChild(notification);
    }
    
    // Mostrar notificación
    notification.textContent = 'Configuración guardada';
    notification.style.opacity = '1';
    
    // Ocultar después de 2 segundos
    setTimeout(() => {
      notification.style.opacity = '0';
    }, 2000);
  }
  
  // Cargar configuración actual
  chrome.storage.local.get(['showEmergencyButton'], function(result) {
    // Por defecto, el botón de emergencia está visible
    const showEmergencyButton = result.showEmergencyButton !== undefined ? result.showEmergencyButton : true;
    emergencyButtonToggle.checked = showEmergencyButton;
    
    // Actualizar texto del estado actual
    updateStatusText(showEmergencyButton);
  });
  
  // Función para actualizar el texto del estado
  function updateStatusText(isEnabled) {
    if (optionLabel) {
      optionLabel.innerHTML = `Botón de emergencia <span style="color: ${isEnabled ? '#4CAF50' : '#F44336'}; font-size: 12px; margin-left: 5px;">(${isEnabled ? 'Activado' : 'Desactivado'})</span>`;
    }
  }
  
  // Evento para volver al popup principal
  backButton.addEventListener('click', function() {
    window.location.href = 'popup.html';
  });
  
  // Evento para cambiar la visibilidad del botón de emergencia
  emergencyButtonToggle.addEventListener('change', function() {
    const showEmergencyButton = this.checked;
    
    // Actualizar texto del estado
    updateStatusText(showEmergencyButton);
    
    // Guardar la configuración
    chrome.storage.local.set({ showEmergencyButton: showEmergencyButton }, function() {
      console.log('Configuración de botón de emergencia guardada:', showEmergencyButton);
      
      // Mostrar notificación de guardado
      showSavedNotification();
      
      // Enviar mensaje al content script para actualizar la visibilidad del botón
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && tabs[0].url.includes('facebook.com')) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'updateEmergencyButtonVisibility',
            showEmergencyButton: showEmergencyButton
          }, function(response) {
            console.log('Respuesta del content script:', response);
          });
        }
      });
    });
  });
});
