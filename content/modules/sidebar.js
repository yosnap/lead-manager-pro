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
  .snap-lead-manager-searcher {
    position: fixed;
    top: 0;
    right: -320px; /* Iniciar oculto */
    width: 320px;
    height: 100vh;
    background: white;
    box-shadow: -2px 0 5px rgba(0,0,0,0.2);
    border-left: 1px solid #ddd;
    overflow: hidden;
    transition: transform 0.3s ease;
    z-index: 9999;
    display: none; /* Oculto por defecto */
  }
  
  .snap-lead-manager-searcher.visible {
    transform: translateX(-320px);
    display: block; /* Mostrar cuando tenga la clase visible */
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
 * Abre la página de login de la extensión
 */
function openLoginPage() {
  console.log('Lead Manager Pro: Abriendo página de login');
  // Usar un enfoque alternativo para abrir el popup
  chrome.runtime.sendMessage({ 
    action: 'openLoginPage',
    forceNewTab: true
  });
}

/**
 * Verifica el estado de autenticación del usuario
 * @param {Function} callback - Función a llamar con el resultado de la verificación
 */
function checkAuthStatus(callback) {
  console.log('Lead Manager Pro: Verificando estado de autenticación');
  
  // Verificar si el módulo de autenticación está disponible
  if (window.LeadManagerPro && window.LeadManagerPro.Auth) {
    // Usar el módulo centralizado de autenticación
    window.LeadManagerPro.Auth.isAuthenticated(function(isAuthenticated) {
      console.log('Lead Manager Pro: Estado de autenticación:', isAuthenticated);
      callback(isAuthenticated);
    });
  } else {
    // Fallback al método anterior si el módulo no está disponible
    console.log('Lead Manager Pro: Módulo Auth no disponible, usando método alternativo');
    
    // Primero verificamos en chrome.storage.local
    chrome.storage.local.get(['lmp_auth'], function(localResult) {
      if (localResult.lmp_auth === true) {
        console.log('Lead Manager Pro: Usuario autenticado en storage.local');
        callback(true);
        return;
      }
      
      // Si no está en local, verificamos en chrome.storage.sync
      chrome.storage.sync.get(['lmp_auth'], function(syncResult) {
        const isAuthenticated = syncResult.lmp_auth === true;
        console.log('Lead Manager Pro: Estado de autenticación en storage.sync:', isAuthenticated);
        callback(isAuthenticated);
      });
    });
  }
}

/**
 * Función para limpiar toggles duplicados
 */
window.LeadManagerPro.modules.cleanupDuplicateToggles = function() {
  console.log('Lead Manager Pro: Limpiando toggles duplicados');
  
  // Buscar todos los elementos con ID o clase que contengan 'snap-lead-manager-toggle'
  const togglesById = document.querySelectorAll('[id*="snap-lead-manager-toggle"]');
  const togglesByClass = document.querySelectorAll('[class*="snap-lead-manager-toggle"]');
  
  // Crear un Set para evitar duplicados
  const allToggles = new Set([...togglesById, ...togglesByClass]);
  
  let keepToggle = null;
  let removedCount = 0;
  
  allToggles.forEach(toggle => {
    if (toggle.id === 'snap-lead-manager-toggle') {
      if (!keepToggle) {
        // Mantener el primero que encontremos con el ID correcto
        keepToggle = toggle;
        console.log('Lead Manager Pro: Manteniendo toggle principal');
      } else {
        // Eliminar duplicados
        try {
          toggle.remove();
          removedCount++;
          console.log('Lead Manager Pro: Toggle duplicado eliminado');
        } catch (error) {
          console.error('Lead Manager Pro: Error al eliminar toggle duplicado:', error);
        }
      }
    } else if (toggle.classList.contains('snap-lead-manager-toggle') && !toggle.id) {
      // Eliminar elementos que solo tienen la clase pero no el ID
      try {
        toggle.remove();
        removedCount++;
        console.log('Lead Manager Pro: Toggle con solo clase eliminado');
      } catch (error) {
        console.error('Lead Manager Pro: Error al eliminar toggle con clase:', error);
      }
    }
  });
  
  console.log(`Lead Manager Pro: Limpieza completada. ${removedCount} toggles duplicados eliminados`);
  return keepToggle;
};

/**
 * Inserta el sidebar en la página
 * @returns {HTMLElement} - El contenedor del sidebar
 */
window.LeadManagerPro.modules.insertSidebar = function() {
  console.log('Lead Manager Pro: Insertando sidebar');
  
  // Limpiar toggles duplicados antes de crear uno nuevo
  window.LeadManagerPro.modules.cleanupDuplicateToggles();
  
  // Verificar si ya existe el sidebar
  const existingSidebar = document.getElementById('snap-lead-manager-searcher');
  const existingToggle = document.getElementById('snap-lead-manager-toggle');
  
  if (existingSidebar && existingToggle) {
    console.log('Lead Manager Pro: Sidebar ya existe');
    return existingSidebar;
  }
  
  // Crear contenedor para el sidebar con configuración inicial
  const sidebarContainer = document.createElement('div');
  sidebarContainer.id = 'snap-lead-manager-searcher';
  sidebarContainer.className = 'snap-lead-manager-searcher';
  // Inicialmente oculto (sin clase 'visible')
  
  // Crear iframe para el sidebar
  const iframe = document.createElement('iframe');
  iframe.id = 'snap-lead-manager-iframe';
  iframe.className = 'snap-lead-manager-iframe';
  iframe.src = chrome.runtime.getURL('sidebar.html');
  
  // Usar el sistema unificado de toggles
  const toggleManager = window.leadManagerPro?.unifiedToggleManager;
  let toggleButton;
  
  if (toggleManager) {
    // Crear toggle usando el sistema unificado
    toggleButton = toggleManager.createUnifiedToggle('general');
  } else {
    // Fallback: crear toggle tradicional
    toggleButton = document.createElement('button');
    toggleButton.id = 'snap-lead-manager-toggle';
    toggleButton.className = 'sidebar-closed';
    toggleButton.innerHTML = '<span aria-hidden="true">▶</span>';
    toggleButton.setAttribute('aria-label', 'Mostrar panel lateral de Lead Manager');
    toggleButton.setAttribute('title', 'Mostrar Lead Manager');
    toggleButton.setAttribute('type', 'button');
    toggleButton.style.cssText = `
      position: fixed;
      top: 50%;
      right: 10px;
      transform: translateY(-50%);
      width: 30px;
      height: 80px;
      background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);
      color: white;
      border: none;
      border-radius: 6px 0 0 6px;
      cursor: pointer;
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: bold;
      box-shadow: -3px 0 15px rgba(0,0,0,0.2);
      transition: right 0.4s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease, transform 0.3s ease;
      outline: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    document.body.appendChild(toggleButton);
  }
  
  // Añadir iframe al contenedor
  sidebarContainer.appendChild(iframe);
  
  // Añadir elementos al DOM
  document.body.appendChild(sidebarContainer);
  // El toggle ya está en el DOM si se usó el toggleManager
  
  // Función para ajustar el contenido
  const adjustContent = (show) => {
    if (show) {
      document.body.classList.add('snap-lead-manager-body-shift');
    } else {
      document.body.classList.remove('snap-lead-manager-body-shift');
    }
  };
  
  // Verificar si estamos en una página de grupo específica
  const inSpecificGroup = isSpecificGroupPage();
  const inGroupsFeed = isGroupsFeedPage();
  
  if (inSpecificGroup) {
    // En página de grupo específica, ocultar sidebar general y mostrar el específico para grupos
    sidebarContainer.style.display = 'none';
    if (toggleButton) toggleButton.style.display = 'none';
    
    // Mostrar el sidebar específico para grupos usando el toggle manager
    if (window.leadManagerPro && window.leadManagerPro.groupSidebar) {
      // Crear el toggle específico para grupos usando el sistema unificado
      if (toggleManager) {
        const groupToggle = toggleManager.createUnifiedToggle('group');
        // El groupSidebar usará este toggle
        window.leadManagerPro.groupSidebar.setToggle(groupToggle);
      }
      
      window.leadManagerPro.groupSidebar.show();
      adjustContent(false);
    } else {
      console.log('GroupSidebar no disponible, ocultando sidebar principal');
    }
  } else {
    // En cualquier otra página, mantener el sidebar oculto por defecto
    sidebarContainer.classList.remove('visible');
    if (toggleManager) {
      toggleManager.updateToggleState(false);
    } else if (toggleButton) {
      toggleButton.style.right = '10px';
      toggleButton.innerHTML = '<span aria-hidden="true">▶</span>';
      toggleButton.setAttribute('title', 'Mostrar Lead Manager');
    }
    adjustContent(false);
    localStorage.setItem('snap_lead_manager_sidebar_hidden', 'true');
  }
  
  // Manejar clic en el botón de toggle con transiciones suaves sincronizadas
  toggleButton.addEventListener('click', function() {
    const isVisible = sidebarContainer.classList.contains('visible');
    
    if (isVisible) {
      // Ocultar el sidebar
      sidebarContainer.classList.remove('visible');
      adjustContent(false);
      localStorage.setItem('snap_lead_manager_sidebar_hidden', 'true');
      
      // Actualizar toggle usando el manager o manualmente
      if (toggleManager) {
        toggleManager.updateToggleState(false);
      } else {
        this.classList.remove('sidebar-open');
        this.classList.add('sidebar-closed');
        this.style.right = '10px';
        this.innerHTML = '<span aria-hidden="true">▶</span>';
        this.setAttribute('aria-label', 'Mostrar panel lateral de Lead Manager');
        this.setAttribute('title', 'Mostrar Lead Manager');
        this.style.background = 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)';
      }
    } else {
      // Mostrar el sidebar
      sidebarContainer.classList.add('visible');
      adjustContent(true);
      localStorage.setItem('snap_lead_manager_sidebar_hidden', 'false');
      
      // Actualizar toggle usando el manager o manualmente
      if (toggleManager) {
        toggleManager.updateToggleState(true);
      } else {
        this.classList.remove('sidebar-closed');
        this.classList.add('sidebar-open');
        this.style.right = '320px';
        this.innerHTML = '<span aria-hidden="true">◀</span>';
        this.setAttribute('aria-label', 'Ocultar panel lateral de Lead Manager');
        this.setAttribute('title', 'Ocultar Lead Manager');
        this.style.background = 'linear-gradient(135deg, #4267B2 0%, #365899 100%)';
      }
    }
    
    // Añadir efecto de feedback visual
    this.style.transform = 'translateY(-50%) scale(0.95)';
    setTimeout(() => {
      this.style.transform = 'translateY(-50%) scale(1)';
    }, 150);
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
        
        // Mostrar el sidebar específico para grupos
        if (window.leadManagerPro && window.leadManagerPro.groupSidebar) {
          window.leadManagerPro.groupSidebar.show();
        }
      } else {
        // En cualquier otra página
        sidebarContainer.style.display = 'block';
        toggleButton.style.display = 'flex';
        
        // Ocultar el sidebar específico para grupos si existe
        if (window.leadManagerPro && window.leadManagerPro.groupSidebar) {
          window.leadManagerPro.groupSidebar.hide();
        }
        
        // Mantener el estado anterior o mantener oculto por defecto
        const wasHidden = localStorage.getItem('snap_lead_manager_sidebar_hidden');
        
        // Si hay un estado guardado, restaurarlo; si no, mantener oculto
        if (wasHidden === 'false') {
          // El usuario lo tenía visible
          sidebarContainer.classList.add('visible');
          toggleButton.classList.remove('sidebar-closed');
          toggleButton.classList.add('sidebar-open');
          toggleButton.style.right = '320px';
          toggleButton.innerHTML = '<span aria-hidden="true">◀</span>';
          toggleButton.setAttribute('aria-label', 'Ocultar panel lateral de Lead Manager');
          toggleButton.setAttribute('title', 'Ocultar Lead Manager');
          toggleButton.style.background = 'linear-gradient(135deg, #4267B2 0%, #365899 100%)';
          adjustContent(true);
        } else {
          // Por defecto o si estaba oculto, mantenerlo oculto
          sidebarContainer.classList.remove('visible');
          toggleButton.classList.remove('sidebar-open');
          toggleButton.classList.add('sidebar-closed');
          toggleButton.style.right = '10px';
          toggleButton.innerHTML = '<span aria-hidden="true">▶</span>';
          toggleButton.setAttribute('aria-label', 'Mostrar panel lateral de Lead Manager');
          toggleButton.setAttribute('title', 'Mostrar Lead Manager');
          toggleButton.style.background = 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)';
          adjustContent(false);
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
      
      // También refrescar el estado de autenticación
      iframe.contentWindow.postMessage({
        action: 'refresh_auth',
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
    toggleButton.innerHTML = '<span aria-hidden="true">▶</span>'; // Por defecto, mostrar flecha para abrir
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
      const sidebarContainer = document.getElementById('snap-lead-manager-searcher');
      if (!sidebarContainer) {
        // Si no existe el sidebar, crearlo
        window.LeadManagerPro.modules.insertSidebar();
        return;
      }
      
      const isVisible = sidebarContainer.classList.contains('visible');
      if (isVisible) {
        // Ocultar
        sidebarContainer.classList.remove('visible');
        toggleButton.innerHTML = '<span aria-hidden="true">▶</span>';
        toggleButton.style.right = '0';
        localStorage.setItem('snap_lead_manager_sidebar_hidden', 'true');
      } else {
        // Mostrar
        sidebarContainer.classList.add('visible');
        toggleButton.classList.remove('sidebar-closed');
        toggleButton.classList.add('sidebar-open');
        toggleButton.innerHTML = '<span aria-hidden="true">◀</span>';
        toggleButton.style.right = '320px';
        toggleButton.style.background = 'linear-gradient(135deg, #4267B2 0%, #365899 100%)';
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
  window.addEventListener('message', function(event) {
    // Verificar origen del mensaje (solo aceptar mensajes del iframe)
    const iframe = document.getElementById('snap-lead-manager-iframe');
    if (iframe && event.source !== iframe.contentWindow) {
      return;
    }
    
    // Procesar mensaje según su acción
    const message = event.data;
    if (!message || !message.action) {
      return;
    }
    
    // Manejar acción para abrir página de login
    if (message.action === 'openLoginPage') {
      openLoginPage();
      return;
    }
    
    // Manejar acción para verificar estado de autenticación
    if (message.action === 'checkAuthStatus') {
      checkAuthStatus(function(isAuthenticated) {
        // Responder al iframe con el estado de autenticación
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            action: 'authStatusResponse',
            isAuthenticated: isAuthenticated
          }, '*');
        }
      });
      return;
    }
    
    // Manejar acción para refrescar el estado de autenticación
    if (message.action === 'refreshAuthStatus') {
      // Enviar mensaje al iframe para refrescar el estado de autenticación
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          action: 'refresh_auth',
          from: 'content_script'
        }, '*');
      }
      return;
    }
    
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
      console.log('Lead Manager Pro: Recibida solicitud para abrir el sidebar');
      // Mostrar el sidebar cuando se solicita desde el popup
      let sidebarContainer = document.getElementById('snap-lead-manager-searcher');
      
      if (!sidebarContainer) {
        // Si no existe el sidebar, crearlo
        console.log('Lead Manager Pro: Creando nuevo sidebar');
        sidebarContainer = window.LeadManagerPro.modules.insertSidebar();
      }
      
      if (sidebarContainer) {
        console.log('Lead Manager Pro: Mostrando sidebar');
        // Asegurarse de que el sidebar esté visible
        sidebarContainer.style.display = 'block';
        sidebarContainer.classList.add('visible');
        
        // Ajustar el botón de toggle
        const toggleButton = document.getElementById('snap-lead-manager-toggle');
        if (toggleButton) {
          toggleButton.classList.remove('sidebar-closed');
          toggleButton.classList.add('sidebar-open');
          toggleButton.innerHTML = '<span aria-hidden="true">◀</span>';
          toggleButton.style.right = '320px';
          toggleButton.setAttribute('title', 'Ocultar Lead Manager');
          toggleButton.style.background = 'linear-gradient(135deg, #4267B2 0%, #365899 100%)';
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
        
        // Devolver respuesta exitosa
        sendResponse({ success: true });
      } else {
        console.error('Lead Manager Pro: No se pudo crear/encontrar el sidebar');
        sendResponse({ success: false, error: 'No se pudo crear el sidebar' });
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
      const sidebarContainer = document.getElementById('snap-lead-manager-searcher');
      if (sidebarContainer) {
        sidebarContainer.classList.add('visible');
        const toggleButton = document.getElementById('snap-lead-manager-toggle');
        if (toggleButton) {
          toggleButton.classList.remove('sidebar-closed');
          toggleButton.classList.add('sidebar-open');
          toggleButton.innerHTML = '<span aria-hidden="true">◀</span>';
          toggleButton.style.right = '320px';
          toggleButton.setAttribute('title', 'Ocultar Lead Manager');
          toggleButton.style.background = 'linear-gradient(135deg, #4267B2 0%, #365899 100%)';
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

// Función de inicialización automática
(function initializeSidebar() {
  // Esperar a que el DOM esté completamente cargado
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      window.LeadManagerPro.modules.setupSidebarListeners();
    });
  } else {
    window.LeadManagerPro.modules.setupSidebarListeners();
  }
})();
