/**
 * Controlador para manejar la apertura del sidebar desde el popup
 */

// Namespace para la organización del código
window.LeadManagerPro = window.LeadManagerPro || {};
window.LeadManagerPro.controllers = window.LeadManagerPro.controllers || {};

/**
 * Función para mostrar el sidebar
 * @returns {boolean} - true si se pudo mostrar el sidebar, false en caso contrario
 */
window.LeadManagerPro.controllers.showSidebar = function() {
  console.log('Lead Manager Pro: Intentando mostrar sidebar');
  
  // Obtener o crear el sidebar
  let sidebarContainer = document.getElementById('snap-lead-manager-searcher');
  
  if (!sidebarContainer) {
    console.log('Lead Manager Pro: Sidebar no encontrado, intentando crearlo');
    
    // Verificar si el módulo de sidebar está disponible
    if (window.LeadManagerPro && window.LeadManagerPro.modules && window.LeadManagerPro.modules.insertSidebar) {
      sidebarContainer = window.LeadManagerPro.modules.insertSidebar();
    } else {
      console.error('Lead Manager Pro: Módulo de sidebar no disponible');
      return false;
    }
  }
  
  if (sidebarContainer) {
    console.log('Lead Manager Pro: Sidebar encontrado, mostrándolo');
    
    // Asegurarse de que el sidebar esté visible
    sidebarContainer.style.display = 'block';
    sidebarContainer.classList.add('visible');
    
    // Ajustar el botón de toggle
    const toggleButton = document.getElementById('snap-lead-manager-toggle');
    if (toggleButton) {
      toggleButton.innerHTML = '►';
      toggleButton.style.right = '320px';
      toggleButton.setAttribute('title', 'Ocultar Lead Manager');
      toggleButton.style.display = 'flex';
    }
    
    // Ajustar el contenido de la página
    document.body.classList.add('snap-lead-manager-body-shift');
    
    // Guardar estado en localStorage
    localStorage.setItem('snap_lead_manager_sidebar_hidden', 'false');
    
    // Notificar al iframe que el sidebar está abierto
    const iframe = document.getElementById('snap-lead-manager-iframe');
    if (iframe && iframe.contentWindow) {
      setTimeout(() => {
        iframe.contentWindow.postMessage({
          action: 'sidebar_opened',
          from: 'content_script'
        }, '*');
        
        // También refrescar el estado de autenticación
        iframe.contentWindow.postMessage({
          action: 'refresh_auth',
          from: 'content_script'
        }, '*');
      }, 500);
    }
    
    return true;
  }
  
  console.error('Lead Manager Pro: No se pudo crear/encontrar el sidebar');
  return false;
};

// Listener para mensajes del runtime (popup, background, etc.)
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log('Lead Manager Pro: Mensaje recibido en sidebarController:', message);
  
  if (message.action === 'openSidebar') {
    console.log('Lead Manager Pro: Recibida solicitud para abrir el sidebar');
    const success = window.LeadManagerPro.controllers.showSidebar();
    sendResponse({ success: success });
    return true; // Mantener el canal de comunicación abierto para respuesta asíncrona
  }
});

// Inicialización automática
console.log('Lead Manager Pro: SidebarController inicializado');
