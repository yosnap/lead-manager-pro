/**
 * Módulo para manejar el sidebar de la extensión
 * Usando solo comunicación basada en mensajes para evitar problemas de CORS
 */

// Namespace para la organización del código
window.LeadManagerPro = window.LeadManagerPro || {};
window.LeadManagerPro.modules = window.LeadManagerPro.modules || {};

/**
 * Inserta el sidebar en la página
 * @returns {HTMLElement} - El contenedor del sidebar
 */
window.LeadManagerPro.modules.insertSidebar = function() {
  console.log('Lead Manager Pro: Insertando sidebar');
  
  // Verificar si ya existe el sidebar
  if (document.getElementById('snap-lead-manager-container')) {
    console.log('Lead Manager Pro: Sidebar ya existe');
    return document.getElementById('snap-lead-manager-container');
  }
  
  // Crear contenedor para el sidebar
  const sidebarContainer = document.createElement('div');
  sidebarContainer.id = 'snap-lead-manager-container';
  sidebarContainer.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    width: 320px;
    height: 100vh;
    z-index: 9999;
    background: white;
    box-shadow: -2px 0 5px rgba(0,0,0,0.2);
    border-left: 1px solid #ddd;
    overflow: hidden;
    transition: transform 0.3s ease;
  `;
  
  // Crear iframe para el sidebar
  const iframe = document.createElement('iframe');
  iframe.id = 'snap-lead-manager-iframe';
  iframe.src = chrome.runtime.getURL('sidebar.html');
  iframe.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
    overflow: hidden;
  `;
  
  // Añadir iframe al contenedor
  sidebarContainer.appendChild(iframe);
  
  // Crear botón para mostrar/ocultar (FUERA del sidebar)
  const toggleButton = document.createElement('div');
  toggleButton.id = 'snap-lead-manager-toggle';
  toggleButton.innerHTML = '►';
  toggleButton.style.cssText = `
    position: fixed;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    background: #4267B2;
    color: white;
    width: 30px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 5px 0 0 5px;
    font-size: 18px;
    font-weight: bold;
    box-shadow: -2px 0 5px rgba(0,0,0,0.2);
    z-index: 9990;
    transition: all 0.3s ease;
  `;
  // Agregar el botón de toggle directamente al body, fuera del contenedor
  document.body.appendChild(toggleButton);
  
  // Ya no necesitamos un botón de cierre separado, usaremos solo el botón de toggle
  
  // Por defecto, ocultar el sidebar inicialmente
  sidebarContainer.style.transform = 'translateX(100%)';
  
  // Manejar clic en el botón de toggle
  toggleButton.addEventListener('click', function() {
    const isVisible = sidebarContainer.style.transform !== 'translateX(100%)';
    if (isVisible) {
      // Ocultar el sidebar
      sidebarContainer.style.transform = 'translateX(100%)';
      toggleButton.innerHTML = '◄';
      toggleButton.style.right = '0';
      toggleButton.setAttribute('title', 'Mostrar Lead Manager');
      
      // Guardar preferencia del usuario
      localStorage.setItem('snap_lead_manager_sidebar_hidden', 'true');
    } else {
      // Mostrar el sidebar
      sidebarContainer.style.transform = 'translateX(0)';
      toggleButton.innerHTML = '►';
      toggleButton.style.right = '320px';
      toggleButton.setAttribute('title', 'Ocultar Lead Manager');
      
      // Guardar preferencia del usuario
      localStorage.setItem('snap_lead_manager_sidebar_hidden', 'false');
    }
  });
  
  // Ya no necesitamos este manejador de eventos para el botón de cerrar
  
  // Verificar si el sidebar estaba oculto anteriormente
  const wasHidden = localStorage.getItem('snap_lead_manager_sidebar_hidden') === 'true';
  if (!wasHidden) {
    // Mostrar sidebar si no estaba oculto previamente
    sidebarContainer.style.transform = 'translateX(0)';
    toggleButton.innerHTML = '►';
    toggleButton.style.right = '320px';
    toggleButton.setAttribute('title', 'Ocultar Lead Manager');
  } else {
    // Mantener oculto
    toggleButton.innerHTML = '◄';
    toggleButton.style.right = '0';
    toggleButton.setAttribute('title', 'Mostrar Lead Manager');
  }
  
  // Ya no necesitamos agregar ningún botón adicional al sidebar
  
  // Añadir al DOM
  document.body.appendChild(sidebarContainer);
  
  console.log('Lead Manager Pro: Sidebar insertado');
  
  // Enviar un mensaje de "sidebar_ready" para notificar al iframe
  setTimeout(() => {
    const iframe = document.getElementById('snap-lead-manager-iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        action: 'sidebar_ready',
        from: 'content_script'
      }, '*');
    }
  }, 1000);
  
  return sidebarContainer;
};

/**
 * Asegura que el botón de toggle siempre esté visible
 */
window.LeadManagerPro.modules.ensureToggleButtonVisible = function() {
  // Comprobar si ya existe un botón de toggle
  let toggleButton = document.getElementById('snap-lead-manager-toggle');
  
  // Si no existe, crearlo
  if (!toggleButton) {
    toggleButton = document.createElement('div');
    toggleButton.id = 'snap-lead-manager-toggle';
    toggleButton.innerHTML = '►'; // Por defecto, mostrar flecha para abrir
    toggleButton.style.cssText = `
      position: fixed;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      background: #4267B2;
      color: white;
      width: 30px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: 5px 0 0 5px;
      font-size: 18px;
      font-weight: bold;
      box-shadow: -2px 0 5px rgba(0,0,0,0.2);
      z-index: 9999;
      transition: all 0.3s ease;
    `;
    
    // Agregar manejador de clic para mostrar/ocultar el sidebar
    toggleButton.addEventListener('click', function() {
      const sidebarContainer = document.getElementById('snap-lead-manager-container');
      if (!sidebarContainer) {
        // Si no existe el sidebar, crearlo
        window.LeadManagerPro.modules.insertSidebar();
        return;
      }
      
      const isVisible = sidebarContainer.style.transform !== 'translateX(100%)';
      if (isVisible) {
        // Ocultar
        sidebarContainer.style.transform = 'translateX(100%)';
        toggleButton.innerHTML = '►';
        toggleButton.style.right = '0';
        localStorage.setItem('snap_lead_manager_sidebar_hidden', 'true');
      } else {
        // Mostrar
        sidebarContainer.style.transform = 'translateX(0)';
        toggleButton.innerHTML = '◄';
        toggleButton.style.right = '320px';
        localStorage.setItem('snap_lead_manager_sidebar_hidden', 'false');
      }
    });
    
    // Agregar al DOM
    document.body.appendChild(toggleButton);
    console.log('Botón de toggle creado y agregado al DOM');
  }
  
  return toggleButton;
};

/**
 * Configura los listeners globales para los mensajes del sidebar
 */
window.LeadManagerPro.modules.setupSidebarListeners = function() {
  try {
    // Asegurar que el botón de toggle sea visible
    window.LeadManagerPro.modules.ensureToggleButtonVisible();
  } catch (error) {
    console.error("Error al asegurar visibilidad del botón toggle:", error);
  }
  // Escuchar mensajes del iframe del sidebar
  window.addEventListener('message', (event) => {
    // Verificar que el mensaje tiene datos
    if (!event.data) return;
    
    const message = event.data;
    
    // Logging reducido para evitar spam en consola
    if (message.action !== 'status_update') {
      console.log('Lead Manager Pro: Mensaje recibido:', message.action);
    }
    
    // Manejadores para diferentes acciones
    if (message.action === 'sidebar_ready') {
      console.log('Lead Manager Pro: Sidebar listo para recibir mensajes');
    }
    
    else if (message.action === 'find_profiles') {
      // Guardar datos de búsqueda en localStorage
      if (message.searchData) {
        try {
          // Guardar datos en localStorage
          const searchDataStr = JSON.stringify(message.searchData);
          localStorage.setItem('snap_lead_manager_search_data', searchDataStr);
          
          // Reiniciar flag de filtro de ciudad aplicado
          localStorage.setItem('snap_lead_manager_city_filter_applied', 'false');
          
          // Iniciar navegación
          if (window.LeadManagerPro.state && window.LeadManagerPro.state.searchState && 
              window.LeadManagerPro.modules.navigateToSearchPage) {
            
            // Preparar el estado de búsqueda
            window.LeadManagerPro.state.searchState.searchType = message.searchData.type || 'people';
            window.LeadManagerPro.state.searchState.searchTerm = message.searchData.term || '';
            window.LeadManagerPro.state.searchState.city = message.searchData.city || '';
            
            // Iniciar navegación
            window.LeadManagerPro.modules.navigateToSearchPage(window.LeadManagerPro.state.searchState)
              .catch(error => {
                console.error('Error al navegar a página de búsqueda:', error);
                sendMessageToSidebar('search_error', { error: error.message });
              });
          } else {
            console.error('Estado de búsqueda o función de navegación no disponible');
          }
        } catch (error) {
          console.error('Error al procesar datos de búsqueda:', error);
          sendMessageToSidebar('search_error', { error: error.message });
        }
      }
    }
    
    else if (message.action === 'apply_city_filter') {
      if (window.LeadManagerPro.modules.applyCityFilter) {
        window.LeadManagerPro.modules.applyCityFilter()
          .catch(error => {
            console.error('Error al aplicar filtro de ciudad:', error);
            sendMessageToSidebar('filter_error', { error: error.message });
          });
      }
    }
    
    else if (message.action === 'pause_search') {
      if (window.LeadManagerPro.modules.pauseSearch) {
        const result = window.LeadManagerPro.modules.pauseSearch();
        sendMessageToSidebar('pause_result', { result });
      }
    }
    
    else if (message.action === 'resume_search') {
      if (window.LeadManagerPro.modules.findProfiles) {
        window.LeadManagerPro.modules.findProfiles()
          .then(result => sendMessageToSidebar('resume_result', { result }))
          .catch(error => {
            console.error('Error al reanudar búsqueda:', error);
            sendMessageToSidebar('search_error', { error: error.message });
          });
      }
    }
    
    else if (message.action === 'stop_search') {
      if (window.LeadManagerPro.modules.stopSearch) {
        const result = window.LeadManagerPro.modules.stopSearch();
        sendMessageToSidebar('stop_result', { result });
      }
    }
    
    else if (message.action === 'get_search_status') {
      if (window.LeadManagerPro.state && window.LeadManagerPro.state.searchState) {
        const searchState = window.LeadManagerPro.state.searchState;
        sendMessageToSidebar('search_status', {
          status: {
            isSearching: searchState.isSearching,
            pauseSearch: searchState.pauseSearch,
            currentPage: searchState.currentPage,
            totalPages: searchState.totalPages,
            foundProfiles: searchState.foundProfiles ? searchState.foundProfiles.length : 0,
            searchType: searchState.searchType,
            searchTerm: searchState.searchTerm,
            city: searchState.city
          }
        });
      }
    }
    
    else if (message.action === 'open_profile') {
      if (window.LeadManagerPro.modules.openAndExtractProfileDetails) {
        window.LeadManagerPro.modules.openAndExtractProfileDetails(message.profileUrl)
          .then(result => sendMessageToSidebar('open_profile_result', { result }))
          .catch(error => {
            console.error('Error al abrir perfil:', error);
            sendMessageToSidebar('profile_error', { error: error.message });
          });
      }
    }
    
    else if (message.action === 'save_to_crm') {
      if (window.LeadManagerPro.modules.saveProfileToCRM) {
        window.LeadManagerPro.modules.saveProfileToCRM(message.profileData)
          .then(result => sendMessageToSidebar('save_to_crm_result', { result }))
          .catch(error => {
            console.error('Error al guardar perfil en CRM:', error);
            sendMessageToSidebar('crm_error', { error: error.message });
          });
      }
    }
    
    else if (message.action === 'openSidebar') {
      // Mostrar el sidebar cuando se solicita desde el popup
      const sidebarContainer = document.getElementById('snap-lead-manager-container');
      if (sidebarContainer) {
        sidebarContainer.style.transform = 'translateX(0)';
        const toggleButton = document.getElementById('snap-lead-manager-toggle');
        if (toggleButton) {
          toggleButton.innerHTML = '►';
          toggleButton.style.right = '320px';
          toggleButton.setAttribute('title', 'Ocultar Lead Manager');
        }
        localStorage.setItem('snap_lead_manager_sidebar_hidden', 'false');
      } else {
        // Si no existe el sidebar, crearlo
        window.LeadManagerPro.modules.insertSidebar();
      }
    }
    
    else if (message.action === 'configure_search') {
      console.log('Configurando sidebar para búsqueda:', message.config);
      
      // Enviar mensaje al iframe para configurar la interfaz de búsqueda
      const iframe = document.getElementById('snap-lead-manager-iframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          action: 'configure_search',
          config: message.config
        }, '*');
      }
    }
    
    else if (message.action === 'startSearchDirectly') {
      console.log('Iniciando búsqueda directamente con opciones:', message.options);
      
      // Primero, asegurarse de que el sidebar esté visible
      const sidebarContainer = document.getElementById('snap-lead-manager-container');
      if (sidebarContainer) {
        sidebarContainer.style.transform = 'translateX(0)';
        const toggleButton = document.getElementById('snap-lead-manager-toggle');
        if (toggleButton) {
          toggleButton.innerHTML = '►';
          toggleButton.style.right = '320px';
          toggleButton.setAttribute('title', 'Ocultar Lead Manager');
        }
        localStorage.setItem('snap_lead_manager_sidebar_hidden', 'false');
      } else {
        // Si no existe el sidebar, crearlo
        window.LeadManagerPro.modules.insertSidebar();
      }
      
      // Esperar a que el iframe se cargue
      setTimeout(() => {
        // Recopilar datos de búsqueda desde localStorage si existen
        let searchTerm = '';
        let searchCity = '';
        
        try {
          // Intentar obtener datos del último sidebar usado
          searchTerm = localStorage.getItem('snap_lead_manager_search_term') || 'mecánicos';
          searchCity = localStorage.getItem('snap_lead_manager_search_city') || 'Madrid';
        } catch (e) {
          console.error('Error al recuperar datos de búsqueda:', e);
        }
        
        // Enviar mensaje al iframe con los datos de búsqueda y tipo
        const iframe = document.getElementById('snap-lead-manager-iframe');
        if (iframe && iframe.contentWindow) {
          // Configurar búsqueda
          iframe.contentWindow.postMessage({
            action: 'configure_search',
            config: {
              type: message.searchType || 'groups',
              term: searchTerm,
              city: searchCity,
              autoStart: true
            }
          }, '*');
          
          // También enviar opciones de filtrado adicionales 
          if (message.options) {
            iframe.contentWindow.postMessage({
              action: 'set_filter_options',
              options: message.options
            }, '*');
          }
        }
      }, 1000);
    }
    
    else if (message.action === 'updateOptions') {
      // Recibir opciones actualizadas del popup
      console.log('Opciones actualizadas recibidas:', message.options);
      
      // Actualizar opciones en el estado global si existe
      if (window.LeadManagerPro.state) {
        window.LeadManagerPro.state.options = {
          ...window.LeadManagerPro.state.options,
          ...message.options
        };
        
        // Notificar a los otros módulos que las opciones han cambiado
        const event = new CustomEvent('LEAD_MANAGER_OPTIONS_UPDATED', {
          detail: { options: message.options }
        });
        window.dispatchEvent(event);
      }
    }
  });
  
  // También escuchar los mensajes de actualización de estado para reenviarlos al sidebar
  window.addEventListener('LEAD_MANAGER_STATUS_UPDATE', (event) => {
    if (event.detail) {
      sendMessageToSidebar('status_update', {
        status: event.detail.message,
        progress: event.detail.progress
      });
    }
  });
};

/**
 * Función auxiliar para enviar mensajes al sidebar de manera consistente
 * @param {string} action - Acción a realizar
 * @param {Object} data - Datos adicionales
 */
function sendMessageToSidebar(action, data = {}) {
  const iframe = document.getElementById('snap-lead-manager-iframe');
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage({
      action: action,
      ...data
    }, '*');
  }
}
