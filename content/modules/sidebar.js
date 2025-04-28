/**
 * Módulo para manejar el sidebar de la extensión
 * Usando solo comunicación basada en mensajes para evitar problemas de CORS
 */

// Namespace para la organización del código
window.LeadManagerPro = window.LeadManagerPro || {};
window.LeadManagerPro.modules = window.LeadManagerPro.modules || {};

// Agregar estilos CSS al documento
const style = document.createElement('style');
style.textContent = `
  /* Ajuste global para el contenido cuando el sidebar está activo */
  body.snap-lead-manager-body-shift {
    margin-right: 320px !important;
    transition: margin 0.3s ease;
  }

  /* Contenedor principal del sidebar */
  .snap-lead-manager-container {
    position: fixed;
    top: 0;
    right: -320px; /* Cambiado para iniciar oculto */
    width: 320px;
    height: 100vh;
    background: white;
    box-shadow: -2px 0 5px rgba(0,0,0,0.2);
    border-left: 1px solid #ddd;
    overflow: hidden;
    transition: transform 0.3s ease;
    z-index: 9999;
  }
  
  .snap-lead-manager-container.visible {
    transform: translateX(-320px);
  }
  
  .snap-lead-manager-iframe {
    width: 100%;
    height: 100%;
    border: none;
    overflow: hidden;
  }
  
  .snap-lead-manager-toggle {
    position: fixed;
    right: 320px;
    top: 50%;
    transform: translateY(-50%);
    background: #0866ff;
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
  }

  /* Ajustes específicos para contenedores de Facebook */
  body.snap-lead-manager-body-shift [role="main"],
  body.snap-lead-manager-body-shift [role="complementary"],
  body.snap-lead-manager-body-shift [data-pagelet="RightRail"] {
    margin-right: 0 !important;
    width: auto !important;
  }
`;
document.head.appendChild(style);

/**
 * Verifica si estamos en una página de grupo específica
 * @returns {boolean}
 */
function isSpecificGroupPage() {
  const url = window.location.href;
  return url.includes('/groups/') && !url.includes('/groups/feed');
}

/**
 * Verifica si estamos en el feed general de grupos
 * @returns {boolean}
 */
function isGroupsFeedPage() {
  const url = window.location.href;
  return url.includes('/groups/feed');
}

/**
 * Inserta el sidebar en la página
 * @returns {HTMLElement} - El contenedor del sidebar
 */
window.LeadManagerPro.modules.insertSidebar = function() {
  console.log('Lead Manager Pro: Insertando sidebar');
  
  // Verificar si ya existe el sidebar
  const existingSidebar = document.getElementById('snap-lead-manager-container');
  const existingToggle = document.getElementById('snap-lead-manager-toggle');
  
  if (existingSidebar && existingToggle) {
    console.log('Lead Manager Pro: Sidebar ya existe');
    return existingSidebar;
  }
  
  // Crear contenedor para el sidebar
  const sidebarContainer = document.createElement('div');
  sidebarContainer.id = 'snap-lead-manager-container';
  sidebarContainer.className = 'snap-lead-manager-container';
  
  // Crear iframe para el sidebar
  const iframe = document.createElement('iframe');
  iframe.id = 'snap-lead-manager-iframe';
  iframe.className = 'snap-lead-manager-iframe';
  iframe.src = chrome.runtime.getURL('sidebar.html');
  
  // Crear botón para mostrar/ocultar
  const toggleButton = document.createElement('div');
  toggleButton.id = 'snap-lead-manager-toggle';
  toggleButton.className = 'snap-lead-manager-toggle';
  toggleButton.innerHTML = '►';
  toggleButton.setAttribute('title', 'Ocultar Lead Manager');
  
  // Añadir iframe al contenedor
  sidebarContainer.appendChild(iframe);
  
  // Añadir elementos al DOM
  document.body.appendChild(sidebarContainer);
  document.body.appendChild(toggleButton);
  
  // Función para ajustar el contenido
  const adjustContent = (show) => {
    if (show) {
      document.body.classList.add('snap-lead-manager-body-shift');
    } else {
      document.body.classList.remove('snap-lead-manager-body-shift');
    }
  };
  
  // Por defecto, mostrar el sidebar excepto en páginas de grupo específicas
  const wasHidden = localStorage.getItem('snap_lead_manager_sidebar_hidden') === 'true';
  const inSpecificGroup = isSpecificGroupPage();
  
  if (wasHidden || inSpecificGroup) {
    // Ocultar el sidebar
    sidebarContainer.classList.remove('visible');
    toggleButton.style.right = '0';
    toggleButton.innerHTML = '◄';
    toggleButton.setAttribute('title', 'Mostrar Lead Manager');
    adjustContent(false);
  } else {
    // Mostrar el sidebar
    sidebarContainer.classList.add('visible');
    toggleButton.style.right = '320px';
    toggleButton.innerHTML = '►';
    toggleButton.setAttribute('title', 'Ocultar Lead Manager');
    adjustContent(true);
  }
  
  // Manejar clic en el botón de toggle
  toggleButton.addEventListener('click', function() {
    const isVisible = sidebarContainer.classList.contains('visible');
    if (isVisible) {
      // Ocultar el sidebar
      sidebarContainer.classList.remove('visible');
      toggleButton.style.right = '0';
      toggleButton.innerHTML = '◄';
      toggleButton.setAttribute('title', 'Mostrar Lead Manager');
      adjustContent(false);
      localStorage.setItem('snap_lead_manager_sidebar_hidden', 'true');
    } else {
      // Mostrar el sidebar
      sidebarContainer.classList.add('visible');
      toggleButton.style.right = '320px';
      toggleButton.innerHTML = '►';
      toggleButton.setAttribute('title', 'Ocultar Lead Manager');
      adjustContent(true);
      localStorage.setItem('snap_lead_manager_sidebar_hidden', 'false');
    }
  });
  
  // Observar cambios en la URL
  let lastUrl = location.href;
  
  // Función para manejar cambios de URL
  const handleUrlChange = () => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      
      const inSpecificGroup = isSpecificGroupPage();
      const inGroupsFeed = isGroupsFeedPage();
      
      if (inSpecificGroup) {
        // En página de grupo específica
        sidebarContainer.style.display = 'none';
        toggleButton.style.display = 'none';
        adjustContent(false);
      } else {
        // En cualquier otra página
        sidebarContainer.style.display = 'block';
        toggleButton.style.display = 'flex';
        
        // Restaurar estado anterior
        const wasHidden = localStorage.getItem('snap_lead_manager_sidebar_hidden') === 'true';
        if (!wasHidden) {
          sidebarContainer.classList.add('visible');
          toggleButton.style.right = '320px';
          toggleButton.innerHTML = '►';
          adjustContent(true);
        }
      }
    }
  };
  
  // Observar cambios en la URL
  const observer = new MutationObserver(() => {
    handleUrlChange();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // También escuchar el evento popstate para cambios en la navegación
  window.addEventListener('popstate', handleUrlChange);
  
  // Enviar mensaje de "sidebar_ready"
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
      
      const isVisible = sidebarContainer.classList.contains('visible');
      if (isVisible) {
        // Ocultar
        sidebarContainer.classList.remove('visible');
        toggleButton.innerHTML = '►';
        toggleButton.style.right = '0';
        localStorage.setItem('snap_lead_manager_sidebar_hidden', 'true');
      } else {
        // Mostrar
        sidebarContainer.classList.add('visible');
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
  
  // Verificar si hay una búsqueda activa pendiente tras recargar la página
  checkPendingSearchAfterReload();
  
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
      
      // Verificar si hay búsqueda pendiente después de recarga
      checkPendingSearchAfterReload();
      
      // Verificar si tenemos los módulos de opciones nuevos
      if (window.leadManagerPro && window.leadManagerPro.generalOptionsUI) {
        // Enviar mensaje al iframe para añadir pestaña de opciones generales
        const iframe = document.getElementById('snap-lead-manager-iframe');
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            action: 'add_general_options_tab',
            tabName: 'Opciones Generales'
          }, '*');
        }
      }
      
      // Verificar si tenemos los módulos de opciones de búsqueda de grupos
      if (window.leadManagerPro && window.leadManagerPro.groupSearchOptionsUI) {
        // Enviar mensaje al iframe para añadir pestaña de opciones de búsqueda de grupos
        const iframe = document.getElementById('snap-lead-manager-iframe');
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            action: 'add_group_search_options_tab',
            tabName: 'Opciones de Grupos'
          }, '*');
        }
      }
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
    
    else if (message.action === 'prepare_for_search') {
      // Guardar datos para iniciar búsqueda después de recargar
      localStorage.setItem('snap_lead_manager_force_reload', 'true');
      console.log('Lead Manager Pro: Preparando para búsqueda después de recarga');
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
        sidebarContainer.classList.add('visible');
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
        sidebarContainer.classList.add('visible');
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
    
    else if (message.action === 'render_general_options') {
      // Solicitud para renderizar opciones generales en el sidebar
      console.log('Renderizando opciones generales en el sidebar');
      
      if (window.leadManagerPro && window.leadManagerPro.generalOptionsUI) {
        // Crear elemento temporal para renderizar las opciones
        const optionsContainer = document.createElement('div');
        
        // Inyectar formulario de opciones en el contenedor
        window.leadManagerPro.generalOptionsUI.injectOptionsForm(optionsContainer);
        
        // Convertir a HTML para enviar al iframe
        const optionsHtml = optionsContainer.innerHTML;
        
        // Enviar HTML al iframe
        const iframe = document.getElementById('snap-lead-manager-iframe');
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            action: 'render_general_options_content',
            content: optionsHtml
          }, '*');
        }
      } else {
        console.error('GeneralOptionsUI no disponible');
      }
    }
    
    else if (message.action === 'render_group_search_options') {
      // Solicitud para renderizar opciones de búsqueda de grupos en el sidebar
      console.log('Renderizando opciones de búsqueda de grupos en el sidebar');
      
      if (window.leadManagerPro && window.leadManagerPro.groupSearchOptionsUI) {
        // Crear elemento temporal para renderizar las opciones
        const optionsContainer = document.createElement('div');
        
        // Inyectar formulario de opciones en el contenedor
        window.leadManagerPro.groupSearchOptionsUI.injectOptionsForm(optionsContainer);
        
        // Convertir a HTML para enviar al iframe
        const optionsHtml = optionsContainer.innerHTML;
        
        // Enviar HTML al iframe
        const iframe = document.getElementById('snap-lead-manager-iframe');
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            action: 'render_group_search_options_content',
            content: optionsHtml
          }, '*');
        }
      } else {
        console.error('GroupSearchOptionsUI no disponible');
      }
    }
    
    else if (message.action === 'save_general_options') {
      // Recibir y guardar opciones generales
      console.log('Guardando opciones generales:', message.options);
      
      if (window.leadManagerPro && window.leadManagerPro.generalOptions) {
        const success = window.leadManagerPro.generalOptions.saveOptions(message.options);
        
        // Notificar resultado al sidebar
        const iframe = document.getElementById('snap-lead-manager-iframe');
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            action: 'general_options_saved',
            success: success
          }, '*');
        }
      }
    }
    
    else if (message.action === 'save_group_search_options') {
      // Recibir y guardar opciones de búsqueda de grupos
      console.log('Guardando opciones de búsqueda de grupos:', message.options);
      
      if (window.leadManagerPro && window.leadManagerPro.groupSearchOptions) {
        const success = window.leadManagerPro.groupSearchOptions.saveOptions(message.options);
        
        // Notificar resultado al sidebar
        const iframe = document.getElementById('snap-lead-manager-iframe');
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            action: 'group_search_options_saved',
            success: success
          }, '*');
        }
      }
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
  
  // Manejar evento de carga de página para verificar búsqueda pendiente
  window.addEventListener('load', () => {
    checkPendingSearchAfterReload();
  });
};

/**
 * Verifica si hay una búsqueda pendiente después de recargar la página
 * y la inicia si es necesario
 */
function checkPendingSearchAfterReload() {
  try {
    // Verificar si hay una búsqueda pendiente
    const forceReload = localStorage.getItem('snap_lead_manager_force_reload') === 'true';
    const searchActive = localStorage.getItem('snap_lead_manager_search_active') === 'true';
    
    console.log('Lead Manager Pro: Verificando búsqueda pendiente - forceReload:', forceReload, 'searchActive:', searchActive);
    
    if (forceReload && searchActive) {
      console.log('Lead Manager Pro: Detectada búsqueda pendiente después de recarga');
      
      // Obtener datos de búsqueda
      const searchDataJson = localStorage.getItem('snap_lead_manager_search_data');
      if (searchDataJson) {
        try {
          const searchData = JSON.parse(searchDataJson);
          console.log('Lead Manager Pro: Recuperados datos de búsqueda:', searchData);
          
          // Limpiar flag de recarga forzada para evitar bucles
          localStorage.removeItem('snap_lead_manager_force_reload');
          
          // Si el módulo de navegación está disponible, iniciar búsqueda
          if (window.LeadManagerPro.state && window.LeadManagerPro.state.searchState && 
              window.LeadManagerPro.modules.navigateToSearchPage && 
              window.LeadManagerPro.modules.findProfiles) {
            
            console.log('Lead Manager Pro: Iniciando búsqueda pendiente...');
            
            // Preparar el estado de búsqueda
            window.LeadManagerPro.state.searchState.searchType = searchData.type || 'people';
            window.LeadManagerPro.state.searchState.searchTerm = searchData.term || '';
            window.LeadManagerPro.state.searchState.city = searchData.city || '';
            window.LeadManagerPro.state.searchState.isSearching = true;
            window.LeadManagerPro.state.searchState.pauseSearch = false;
            
            // Actualizar opciones desde searchData
            if (window.LeadManagerPro.state.options) {
              // Opciones generales
              window.LeadManagerPro.state.options.maxScrolls = searchData.maxScrolls || 4;
              window.LeadManagerPro.state.options.scrollDelay = searchData.scrollDelay || 2;
              
              // Opciones de grupo si corresponde
              if (searchData.groupOptions) {
                window.LeadManagerPro.state.options.groupPublic = searchData.groupOptions.publicGroups;
                window.LeadManagerPro.state.options.groupPrivate = searchData.groupOptions.privateGroups;
                window.LeadManagerPro.state.options.minUsers = searchData.groupOptions.minUsers;
                window.LeadManagerPro.state.options.minPostsYear = searchData.groupOptions.minPostsYear;
                window.LeadManagerPro.state.options.minPostsMonth = searchData.groupOptions.minPostsMonth;
                window.LeadManagerPro.state.options.minPostsDay = searchData.groupOptions.minPostsDay;
              }
            }
            
            // Notificar al sidebar que la búsqueda ha iniciado
            const iframe = document.getElementById('snap-lead-manager-iframe');
            if (iframe && iframe.contentWindow) {
              // Enviar mensaje de estado de búsqueda al sidebar
              iframe.contentWindow.postMessage({
                action: 'search_status',
                status: {
                  isSearching: true,
                  pauseSearch: false,
                  currentPage: 1,
                  totalPages: 1,
                  searchType: searchData.type || 'people',
                  searchTerm: searchData.term || '',
                  city: searchData.city || ''
                }
              }, '*');
              
              // También enviar configuración de búsqueda
              iframe.contentWindow.postMessage({
                action: 'configure_search',
                config: {
                  type: searchData.type || 'people',
                  term: searchData.term || '',
                  city: searchData.city || '',
                  autoStart: false
                }
              }, '*');
            }
            
            // Intentar iniciar la búsqueda en la página actual
            setTimeout(() => {
              console.log('Lead Manager Pro: Ejecutando navegación a página de búsqueda...');
              // Primero navegar a la página de búsqueda
              window.LeadManagerPro.modules.navigateToSearchPage(window.LeadManagerPro.state.searchState)
                .then(() => {
                  console.log('Lead Manager Pro: Navegación completada, iniciando extracción...');
                  // Luego iniciar la búsqueda/extracción
                  return window.LeadManagerPro.modules.findProfiles();
                })
                .catch(error => {
                  console.error('Error al iniciar búsqueda después de recarga:', error);
                  sendMessageToSidebar('search_error', { error: error.message });
                });
            }, 1000); // Pequeño retraso para asegurar que todo esté listo
          } else {
            console.error('Estado de búsqueda o funciones de navegación/búsqueda no disponibles');
          }
        } catch (error) {
          console.error('Error al procesar datos de búsqueda guardados:', error);
        }
      }
    } else if (searchActive) {
      // Si la búsqueda está activa pero no es por recarga, buscar resultados existentes
      checkExistingSearchResults();
    }
  } catch (error) {
    console.error('Error al verificar búsqueda pendiente:', error);
  }
}

/**
 * Verifica si hay resultados existentes de una búsqueda activa
 * y los envía al sidebar
 */
function checkExistingSearchResults() {
  try {
    if (window.LeadManagerPro.state && 
        window.LeadManagerPro.state.searchState && 
        window.LeadManagerPro.state.searchState.foundProfiles && 
        window.LeadManagerPro.state.searchState.foundProfiles.length > 0) {
      
      console.log('Lead Manager Pro: Encontrados resultados existentes, enviando al sidebar');
      
      const results = window.LeadManagerPro.state.searchState.foundProfiles;
      const searchType = window.LeadManagerPro.state.searchState.searchType || 'people';
      const entityType = searchType === 'people' ? 'perfiles' : 'grupos';
      
      // Enviar resultados al sidebar
      const iframe = document.getElementById('snap-lead-manager-iframe');
      if (iframe && iframe.contentWindow) {
        // Enviar resultados
        iframe.contentWindow.postMessage({
          action: 'search_result',
          result: {
            success: true,
            profiles: results,
            results: results,
            count: results.length,
            message: `Se encontraron ${results.length} ${entityType}.`
          }
        }, '*');
        
        // También enviar mensaje explícito de búsqueda completada
        iframe.contentWindow.postMessage({
          action: 'found_results',
          results: results,
          message: `Búsqueda completada. Se encontraron ${results.length} ${entityType}.`,
          searchType: searchType
        }, '*');
      }
    }
  } catch (error) {
    console.error('Error al verificar resultados existentes:', error);
  }
}

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

// Función de inicialización automática
(function initializeSidebar() {
  // Esperar a que el DOM esté completamente cargado
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.LeadManagerPro.modules.insertSidebar();
    });
  } else {
    window.LeadManagerPro.modules.insertSidebar();
  }
})();
