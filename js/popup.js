document.addEventListener('DOMContentLoaded', function() {
  // Variables para los elementos del DOM
  const openSidebarButton = document.getElementById('open-sidebar-btn');
  const resetSidebarButton = document.getElementById('reset-sidebar-btn');
  
  // Función para mostrar un mensaje genérico
  function showMessage(message, type = 'info') {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.textContent = message;
    
    // Estilo para el mensaje
    messageElement.style.position = 'fixed';
    messageElement.style.top = '50%';
    messageElement.style.left = '50%';
    messageElement.style.transform = 'translate(-50%, -50%)';
    messageElement.style.padding = '15px 20px';
    messageElement.style.backgroundColor = type === 'error' ? '#F44336' : '#4CAF50';
    messageElement.style.color = 'white';
    messageElement.style.borderRadius = '4px';
    messageElement.style.zIndex = '1000';
    
    document.body.appendChild(messageElement);
    
    // Eliminar el mensaje después de 3 segundos
    setTimeout(() => {
      messageElement.remove();
    }, 3000);
  }
  
  // Abrir el panel lateral de búsqueda
  openSidebarButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const activeTab = tabs[0];
      
      // Verificar si la URL es de Facebook
      if (activeTab.url.includes('facebook.com')) {
        // Enviar mensaje para abrir el sidebar sin configuraciones específicas
        chrome.tabs.sendMessage(activeTab.id, {
          action: 'openSidebar'
        });
        window.close();
      } else {
        showMessage('Esta extensión solo funciona en Facebook', 'error');
      }
    });
  });
  
  // Restablecer el panel (útil si el panel se pierde)
  if (resetSidebarButton) {
    resetSidebarButton.addEventListener('click', function() {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const activeTab = tabs[0];
        
        // Verificar si la URL es de Facebook
        if (activeTab.url.includes('facebook.com')) {
          // Enviar mensaje para reinicializar completamente el sidebar
          chrome.tabs.sendMessage(activeTab.id, {
            action: 'resetSidebar',
            forceReset: true
          });
          
          // Eliminar indicador de sidebar oculto
          localStorage.removeItem('snap_lead_manager_sidebar_hidden');
          
          showMessage('Panel restablecido. Recargando página...', 'info');
          
          // Recargar la página después de un breve retraso
          setTimeout(() => {
            chrome.tabs.reload(activeTab.id);
            window.close();
          }, 1500);
        } else {
          showMessage('Esta extensión solo funciona en Facebook', 'error');
        }
      });
    });
  }
});
