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
    transition: margin-right 0.3s ease;
  }

  /* Contenedor principal del sidebar */
  .snap-lead-manager-container {
    position: fixed;
    top: 0;
    right: 0;
    width: 320px;
    height: 100vh;
    background: white;
    box-shadow: -2px 0 5px rgba(0,0,0,0.2);
    border-left: 1px solid #ddd;
    overflow: hidden;
    transition: transform 0.3s ease;
    z-index: 9999;
    transform: translateX(100%); /* Por defecto oculto */
  }
  
  .snap-lead-manager-container.visible {
    transform: translateX(0) !important;
    display: block !important;
  }
  
  .snap-lead-manager-container.hidden {
    transform: translateX(100%);
    display: none;
  }
  
  .snap-lead-manager-iframe {
    width: 100%;
    height: 100%;
    border: none;
    overflow: hidden;
  }
  
  .snap-lead-manager-toggle {
    position: fixed;
    right: 0; /* Por defecto a la derecha */
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
    transition: right 0.3s ease;
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
    // Asegurar que tiene la clase visible
    existingSidebar.classList.add('visible');
    // Asegurar que tiene los estilos correctos
    existingSidebar.style.transform = 'translateX(0)';
    existingSidebar.style.display = 'block';
    return existingSidebar;
  }
  
  // Crear contenedor para el sidebar
  const sidebarContainer = document.createElement('div');
  sidebarContainer.id = 'snap-lead-manager-container';
  sidebarContainer.className = 'snap-lead-manager-container';
  // Añadir clase visible para mostrar inmediatamente
  sidebarContainer.classList.add('visible');
  
  // Establecer estilos directamente para mayor seguridad
  sidebarContainer.style.position = 'fixed';
  sidebarContainer.style.top = '0';
  sidebarContainer.style.right = '0';
  sidebarContainer.style.width = '320px';
  sidebarContainer.style.height = '100vh';
  sidebarContainer.style.zIndex = '9999';
  sidebarContainer.style.background = 'white';
  sidebarContainer.style.boxShadow = '-2px 0 5px rgba(0,0,0,0.2)';
  sidebarContainer.style.borderLeft = '1px solid #ddd';
  sidebarContainer.style.overflow = 'hidden';
  sidebarContainer.style.transform = 'translateX(0)'; // Visible por defecto
  sidebarContainer.style.display = 'block';
  
  // Crear iframe para el sidebar
  const iframe = document.createElement('iframe');
  iframe.id = 'snap-lead-manager-iframe';
  iframe.className = 'snap-lead-manager-iframe';
  iframe.src = chrome.runtime.getURL('sidebar.html');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  
  // Crear botón para mostrar/ocultar
  const toggleButton = document.createElement('div');
  toggleButton.id = 'snap-lead-manager-toggle';
  toggleButton.className = 'snap-lead-manager-toggle';
  toggleButton.innerHTML = '►';
  toggleButton.setAttribute('title', 'Ocultar Lead Manager');
  toggleButton.style.position = 'fixed';
  toggleButton.style.right = '0'; // Posición para sidebar visible
  toggleButton.style.top = '50%';
  toggleButton.style.transform = 'translateY(-50%)';
  toggleButton.style.background = '#4267B2';
  toggleButton.style.color = 'white';
  toggleButton.style.width = '30px';
  toggleButton.style.height = '50px';
  toggleButton.style.display = 'flex';
  toggleButton.style.alignItems = 'center';
  toggleButton.style.justifyContent = 'center';
  toggleButton.style.cursor = 'pointer';
  toggleButton.style.borderRadius = '5px 0 0 5px';
  toggleButton.style.fontSize = '18px';
  toggleButton.style.fontWeight = 'bold';
  toggleButton.style.boxShadow = '-2px 0 5px rgba(0,0,0,0.2)';
  toggleButton.style.zIndex = '9999';
  
  // Añadir iframe al contenedor
  sidebarContainer.appendChild(iframe);
  
  // Añadir elementos al DOM
  document.body.appendChild(sidebarContainer);
  document.body.appendChild(toggleButton);
  
  // Establecer el estado visible en localStorage
  localStorage.setItem('snap_lead_manager_sidebar_hidden', 'false');
  
  // Forzar clase de body shift
  document.body.classList.add('snap-lead-manager-body-shift');
  
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
    sidebarContainer.classList.add('hidden');
    sidebarContainer.style.transform = 'translateX(100%)';
    sidebarContainer.style.display = 'none';
    
    // Posicionar el botón en el borde
    toggleButton.style.right = '0';
    toggleButton.innerHTML = '◄';
    toggleButton.setAttribute('title', 'Mostrar Lead Manager');
    
    // No aplicar desplazamiento al contenido
    adjustContent(false);
  } else {
    // Mostrar el sidebar
    sidebarContainer.classList.add('visible');
    sidebarContainer.classList.remove('hidden');
    sidebarContainer.style.transform = 'translateX(0)';
    sidebarContainer.style.display = 'block';
    
    // Posicionar el botón junto al sidebar
    toggleButton.style.right = '320px';
    toggleButton.innerHTML = '►';
    toggleButton.setAttribute('title', 'Ocultar Lead Manager');
    
    // Aplicar desplazamiento al contenido
    adjustContent(true);
  }
  
  // Manejar clic en el botón de toggle
  toggleButton.addEventListener('click', function() {
    const isVisible = sidebarContainer.classList.contains('visible');
    if (isVisible) {
      // Ocultar el sidebar
      sidebarContainer.classList.remove('visible');
      sidebarContainer.classList.add('hidden');
      
      // Forzar transformación
      sidebarContainer.style.transform = 'translateX(100%)';
      // Dejar un pequeño intervalo antes de ocultar completamente
      setTimeout(() => {
        if (!sidebarContainer.classList.contains('visible')) {
          sidebarContainer.style.display = 'none';
        }
      }, 300);
      
      // Mover el botón al borde
      toggleButton.style.right = '0';
      toggleButton.innerHTML = '◄';
      toggleButton.setAttribute('title', 'Mostrar Lead Manager');
      
      // Quitar margen del contenido
      adjustContent(false);
      localStorage.setItem('snap_lead_manager_sidebar_hidden', 'true');
      
      console.log('Sidebar ocultado');
    } else {
      // Mostrar el sidebar
      sidebarContainer.style.display = 'block';
      
      // Pequeño retraso para permitir que se aplique el display
      setTimeout(() => {
        sidebarContainer.classList.add('visible');
        sidebarContainer.classList.remove('hidden');
        sidebarContainer.style.transform = 'translateX(0)';
        
        // Mover el botón junto al sidebar
        toggleButton.style.right = '320px';
        toggleButton.innerHTML = '►';
        toggleButton.setAttribute('title', 'Ocultar Lead Manager');
        
        // Añadir margen al contenido
        adjustContent(true);
        localStorage.setItem('snap_lead_manager_sidebar_hidden', 'false');
        
        console.log('Sidebar mostrado');
      }, 10);
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
          toggleButton.style.right = '0';
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
        toggleButton.style.right = '0';
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
          // Optimizar datos para reducir el tamaño
          const optimizedSearchData = {
            type: message.searchData.type || 'people',
            term: message.searchData.term || '',
            city: message.searchData.city || ''
          };
          
          // Si hay datos adicionales importantes, añadirlos de forma selectiva
          if (message.searchData.options) {
            optimizedSearchData.options = message.searchData.options;
          }
          
          // Usar nuestro sistema seguro de almacenamiento
          const searchDataStr = JSON.stringify(optimizedSearchData);
          window.LeadManagerPro.utils.safeLocalStorage.setItem('snap_lead_manager_search_data', searchDataStr);
          
          // Guardar también los términos de búsqueda individualmente para uso futuro
          try {
            localStorage.setItem('snap_lead_manager_search_term', optimizedSearchData.term);
            localStorage.setItem('snap_lead_manager_search_city', optimizedSearchData.city);
            localStorage.setItem('snap_lead_manager_search_type', optimizedSearchData.type);
          } catch (e) {
            console.warn('No se pudieron guardar términos individuales:', e);
          }
          
          // Reiniciar flag de filtro de ciudad aplicado
          try {
            localStorage.setItem('snap_lead_manager_city_filter_applied', 'false');
          } catch (e) {
            console.warn('No se pudo reiniciar flag de filtro:', e);
          }
          
          // Iniciar navegación
          if (window.LeadManagerPro.state && window.LeadManagerPro.state.searchState && 
              window.LeadManagerPro.modules.navigateToSearchPage) {
            
            // Preparar el estado de búsqueda
            window.LeadManagerPro.state.searchState.searchType = optimizedSearchData.type;
            window.LeadManagerPro.state.searchState.searchTerm = optimizedSearchData.term;
            window.LeadManagerPro.state.searchState.city = optimizedSearchData.city;
            
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
      console.log('Lead Manager Pro: Recibido mensaje openSidebar');
      // Mostrar el sidebar cuando se solicita desde el popup
      const sidebarContainer = document.getElementById('snap-lead-manager-container');
      
      console.log('¿Existe el contenedor del sidebar?', sidebarContainer ? 'Sí' : 'No');
      
      if (sidebarContainer) {
        console.log('Estado actual del sidebar:', {
          'classList': Array.from(sidebarContainer.classList),
          'estilo.display': sidebarContainer.style.display,
          'estilo.transform': sidebarContainer.style.transform,
          'visible en DOM': sidebarContainer.isConnected,
          'guardado en localStorage': localStorage.getItem('snap_lead_manager_sidebar_hidden')
        });
        
        // Forzar visibilidad del sidebar
        sidebarContainer.style.display = 'block';
        
        // Usar un setTimeout para asegurar que el display se aplica primero
        setTimeout(() => {
          sidebarContainer.classList.add('visible');
          sidebarContainer.classList.remove('hidden');
          sidebarContainer.style.transform = 'translateX(0)';
          
          console.log('Forzando visibilidad del sidebar');
          
          const toggleButton = document.getElementById('snap-lead-manager-toggle');
          if (toggleButton) {
            toggleButton.innerHTML = '►';
            toggleButton.style.right = '320px';
            toggleButton.setAttribute('title', 'Ocultar Lead Manager');
            console.log('Toggle button actualizado');
          } else {
            console.log('No se encontró el botón de toggle');
          }
          
          try {
            localStorage.setItem('snap_lead_manager_sidebar_hidden', 'false');
          } catch (e) {
            console.warn('No se pudo guardar estado en localStorage:', e);
          }
          
          // Forzar clase de body
          document.body.classList.add('snap-lead-manager-body-shift');
          console.log('Forzada clase body-shift');
          
          // Enviar mensaje de confirmación
          chrome.runtime.sendMessage({
            action: 'sidebar_status',
            status: 'visible',
            timestamp: new Date().toISOString()
          });
        }, 10);
      } else {
        // Si no existe el sidebar, crearlo y configurarlo como visible
        console.log('Creando nuevo sidebar...');
        const newSidebar = window.LeadManagerPro.modules.insertSidebar();
        
        if (newSidebar) {
          console.log('Nuevo sidebar creado correctamente');
          
          // Esperar a que el DOM se actualice
          setTimeout(() => {
            // Forzar visibilidad inmediata
            newSidebar.style.display = 'block';
            newSidebar.classList.add('visible');
            newSidebar.classList.remove('hidden');
            newSidebar.style.transform = 'translateX(0)';
            
            // Actualizar botón de toggle
            const toggleButton = document.getElementById('snap-lead-manager-toggle');
            if (toggleButton) {
              toggleButton.style.right = '320px';
              toggleButton.innerHTML = '►';
              toggleButton.setAttribute('title', 'Ocultar Lead Manager');
            }
            
            // Forzar clase de body
            document.body.classList.add('snap-lead-manager-body-shift');
            
            try {
              localStorage.setItem('snap_lead_manager_sidebar_hidden', 'false');
            } catch (e) {
              console.warn('No se pudo guardar estado en localStorage:', e);
            }
          }, 10);
        } else {
          console.error('Error: No se pudo crear el sidebar');
        }
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
        // Mostrar el sidebar
        sidebarContainer.style.display = 'block';
        
        setTimeout(() => {
          // Aplicar clases y estilos
          sidebarContainer.classList.add('visible');
          sidebarContainer.classList.remove('hidden');
          sidebarContainer.style.transform = 'translateX(0)';
          
          // Actualizar botón de toggle
          const toggleButton = document.getElementById('snap-lead-manager-toggle');
          if (toggleButton) {
            toggleButton.innerHTML = '►';
            toggleButton.style.right = '320px';
            toggleButton.setAttribute('title', 'Ocultar Lead Manager');
          }
          
          // Aplicar desplazamiento al contenido
          document.body.classList.add('snap-lead-manager-body-shift');
          
          // Usar try/catch para localStorage
          try {
            localStorage.setItem('snap_lead_manager_sidebar_hidden', 'false');
          } catch (e) {
            console.warn('No se pudo guardar estado del sidebar en localStorage:', e);
          }
          
          // Recopilar datos de búsqueda desde localStorage si existen
          let searchTerm = 'mecánicos'; // Valor predeterminado
          let searchCity = 'Madrid';    // Valor predeterminado
          
          try {
            // Intentar obtener datos del último sidebar usado
            searchTerm = localStorage.getItem('snap_lead_manager_search_term') || searchTerm;
            searchCity = localStorage.getItem('snap_lead_manager_search_city') || searchCity;
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
        }, 100);
      } else {
        // Si no existe el sidebar, crearlo
        const newSidebar = window.LeadManagerPro.modules.insertSidebar();
        
        // Esperar a que se cree y luego configurar la búsqueda
        setTimeout(() => {
          // Recopilar datos de búsqueda
          let searchTerm = 'mecánicos'; // Valor predeterminado
          let searchCity = 'Madrid';    // Valor predeterminado
          
          try {
            // Intentar obtener datos del último sidebar usado
            searchTerm = localStorage.getItem('snap_lead_manager_search_term') || searchTerm;
            searchCity = localStorage.getItem('snap_lead_manager_search_city') || searchCity;
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
        }, 1500);
      }
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
    
    else if (message.action === 'showMemberInteraction') {
      console.log('Lead Manager Pro: Recibido mensaje showMemberInteraction');
      
      // Verificar si estamos en una página de grupo
      const isInGroupPage = window.location.href.includes('/groups/') && 
                            !window.location.href.includes('/groups/feed') &&
                            !window.location.href.includes('/blocked') &&
                            !window.location.href.includes('/events');
      
      if (!isInGroupPage) {
        console.log('No estamos en una página de grupo válida');
        sendResponse({ success: false, error: 'No estamos en una página de grupo' });
        return;
      }
      
      try {
        // Verificar si tenemos el módulo de interacción con miembros
        if (window.leadManagerPro && window.leadManagerPro.memberInteractionUI) {
          console.log('Mostrando interfaz de interacción con miembros');
          
          // Verificar si estamos en la sección de miembros
          const isInMembersSection = window.location.href.includes('/members');
          
          if (!isInMembersSection) {
            // Si no estamos en la sección de miembros, navegar a ella
            console.log('Navegando a la sección de miembros...');
            window.leadManagerPro.memberInteractionUI.navigateToPeopleSection();
            
            // Mostrar la interfaz después de un breve retraso para dar tiempo a la navegación
            setTimeout(() => {
              window.leadManagerPro.memberInteractionUI.show();
              sendResponse({ success: true });
            }, 1500);
          } else {
            // Si ya estamos en la sección de miembros, mostrar la interfaz
            window.leadManagerPro.memberInteractionUI.show();
            sendResponse({ success: true });
          }
        } else {
          console.error('Módulo de interacción con miembros no disponible');
          
          // Intentar cargar e inicializar el módulo (en caso de que esté disponible pero no inicializado)
          if (typeof MemberInteractionUI === 'function') {
            console.log('Intentando inicializar MemberInteractionUI');
            window.leadManagerPro = window.leadManagerPro || {};
            window.leadManagerPro.memberInteractionUI = new MemberInteractionUI();
            
            if (window.leadManagerPro.memberInteractionUI) {
              window.leadManagerPro.memberInteractionUI.show();
              sendResponse({ success: true });
            } else {
              sendResponse({ success: false, error: 'No se pudo inicializar MemberInteractionUI' });
            }
          } else {
            sendResponse({ success: false, error: 'MemberInteractionUI no está disponible' });
          }
        }
      } catch (error) {
        console.error('Error al mostrar interfaz de interacción:', error);
        sendResponse({ success: false, error: error.message });
      }
      
      return true; // Indica que sendResponse será llamado asincrónicamente
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

/**
 * Limpia el localStorage para evitar errores de cuota excedida
 */
window.LeadManagerPro.utils = window.LeadManagerPro.utils || {};
window.LeadManagerPro.utils.cleanupLocalStorage = function() {
  try {
    console.log('Realizando limpieza preventiva de localStorage...');
    
    // Lista de claves que pueden eliminarse con seguridad (datos de cache o antiguos)
    const keysToClean = [
      'snap_lead_manager_search_results',
      'snap_lead_manager_old_searches', 
      'snap_lead_manager_temp_data',
      'snap_lead_manager_last_results'
    ];
    
    // Buscar claves antiguas con patrón temporal 
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('_temp_') || key.includes('_cache_') || 
          (key.startsWith('snap_lead_manager_') && key.includes('_backup'))) {
        keysToClean.push(key);
      }
    }
    
    // Eliminar las claves
    let removedCount = 0;
    keysToClean.forEach(key => {
      try {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          removedCount++;
        }
      } catch (e) {
        console.error(`Error al eliminar ${key}:`, e);
      }
    });
    
    console.log(`Limpieza completada: ${removedCount} entradas eliminadas`);
  } catch (e) {
    console.error('Error durante la limpieza de localStorage:', e);
  }
};

/**
 * Configura una limpieza periódica del localStorage
 */
window.LeadManagerPro.utils.setupPeriodicCleanup = function() {
  // Limpiar localStorage cada 30 minutos
  setInterval(() => {
    if (window.LeadManagerPro.utils.cleanupLocalStorage) {
      window.LeadManagerPro.utils.cleanupLocalStorage();
    }
  }, 30 * 60 * 1000); // 30 minutos
  
  // También limpiar cuando cambia la URL
  let lastUrl = location.href;
  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      if (window.LeadManagerPro.utils.cleanupLocalStorage) {
        window.LeadManagerPro.utils.cleanupLocalStorage();
      }
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
};

/**
 * Utilidades para el manejo seguro de localStorage con datos grandes
 */
window.LeadManagerPro.utils.safeLocalStorage = {
  // Guarda un valor grande fragmentándolo si es necesario
  setItem: function(key, value) {
    try {
      // Intentar el método normal primero
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      // Si falla por cuota excedida, intentar fragmentar
      if (error.name === 'QuotaExceededError') {
        console.warn(`Fragmentando datos grandes para '${key}'`);
        
        try {
          // Limpiar cualquier fragmento anterior
          this.removeItem(key);
          
          // Fragmentar en bloques de ~100KB
          const chunkSize = 100 * 1024; // 100KB
          const chunks = Math.ceil(value.length / chunkSize);
          
          // Guardar información de fragmentos
          localStorage.setItem(`${key}_chunks`, chunks.toString());
          
          // Guardar cada fragmento
          for (let i = 0; i < chunks; i++) {
            const chunk = value.substring(i * chunkSize, (i + 1) * chunkSize);
            localStorage.setItem(`${key}_chunk_${i}`, chunk);
          }
          
          return true;
        } catch (fragError) {
          console.error('Error al fragmentar datos:', fragError);
          return false;
        }
      } else {
        console.error('Error al guardar en localStorage:', error);
        return false;
      }
    }
  },
  
  // Obtiene un valor potencialmente fragmentado
  getItem: function(key) {
    try {
      // Comprobar si el valor está fragmentado
      const chunks = localStorage.getItem(`${key}_chunks`);
      
      if (!chunks) {
        // No está fragmentado, usar método normal
        return localStorage.getItem(key);
      }
      
      // Reconstruir a partir de fragmentos
      let result = '';
      const numChunks = parseInt(chunks, 10);
      
      for (let i = 0; i < numChunks; i++) {
        const chunk = localStorage.getItem(`${key}_chunk_${i}`);
        if (chunk) {
          result += chunk;
        } else {
          console.warn(`Fragmento ${i} no encontrado para '${key}'`);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error al leer de localStorage:', error);
      return null;
    }
  },
  
  // Elimina un valor y sus posibles fragmentos
  removeItem: function(key) {
    try {
      // Eliminar el valor principal
      localStorage.removeItem(key);
      
      // Comprobar si hay fragmentos
      const chunks = localStorage.getItem(`${key}_chunks`);
      if (chunks) {
        const numChunks = parseInt(chunks, 10);
        
        // Eliminar cada fragmento
        for (let i = 0; i < numChunks; i++) {
          localStorage.removeItem(`${key}_chunk_${i}`);
        }
        
        // Eliminar información de fragmentos
        localStorage.removeItem(`${key}_chunks`);
      }
      
      return true;
    } catch (error) {
      console.error('Error al eliminar de localStorage:', error);
      return false;
    }
  }
};

// Función de inicialización automática
(function initializeSidebar() {
  // Limpiar localStorage para prevenir errores de cuota
  if (window.LeadManagerPro.utils && window.LeadManagerPro.utils.cleanupLocalStorage) {
    window.LeadManagerPro.utils.cleanupLocalStorage();
    
    // Configurar limpieza periódica
    window.LeadManagerPro.utils.setupPeriodicCleanup();
  }
  
  // Esperar a que el DOM esté completamente cargado
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.LeadManagerPro.modules.insertSidebar();
    });
  } else {
    window.LeadManagerPro.modules.insertSidebar();
  }
})();
