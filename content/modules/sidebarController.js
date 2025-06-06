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

/**
 * Función específica para mostrar el sidebar con opciones de búsqueda de grupos
 * @returns {boolean} - true si se pudo mostrar el sidebar, false en caso contrario
 */
window.LeadManagerPro.controllers.showGroupSearchSidebar = function() {
  console.log('Lead Manager Pro: Intentando mostrar sidebar de búsqueda de grupos');
  
  // Primero, mostrar el sidebar normal
  const sidebarShown = window.LeadManagerPro.controllers.showSidebar();
  
  if (sidebarShown) {
    // Esperar un momento para que el sidebar se cargue completamente
    setTimeout(() => {
      // Intentar activar automáticamente las opciones de búsqueda de grupos
      const iframe = document.getElementById('snap-lead-manager-iframe');
      if (iframe && iframe.contentWindow) {
        // Enviar mensaje al iframe para activar la pestaña de búsqueda de grupos
        iframe.contentWindow.postMessage({
          action: 'activate_group_search_tab'
        }, '*');
        
        console.log('Lead Manager Pro: Mensaje enviado para activar pestaña de búsqueda de grupos');
      }
      
      // También intentar activar directamente si el módulo está disponible
      if (window.leadManagerPro && window.leadManagerPro.groupSearchOptionsUI) {
        try {
          // Si existe un método para mostrar las opciones de búsqueda de grupos, llamarlo
          if (typeof window.leadManagerPro.groupSearchOptionsUI.show === 'function') {
            window.leadManagerPro.groupSearchOptionsUI.show();
          }
        } catch (error) {
          console.log('Lead Manager Pro: Error al activar opciones de grupo:', error);
        }
      }
      
      // Mostrar mensaje informativo
      console.log('Lead Manager Pro: Sidebar de búsqueda de grupos activado');
    }, 1000);
    
    return true;
  }
  
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
  
  if (message.action === 'openGroupSearchSidebar') {
    console.log('Lead Manager Pro: Recibida solicitud para abrir el sidebar de búsqueda de grupos');
    const success = window.LeadManagerPro.controllers.showGroupSearchSidebar();
    sendResponse({ success: success });
    return true;
  }
});

// Inicialización automática
console.log('Lead Manager Pro: SidebarController inicializado');
