/**
 * Punto de entrada principal para el script de contenido
 * Este archivo maneja la inicialización de las funcionalidades de la extensión
 * en el contexto de las páginas donde se activará
 */

console.log('Lead Manager Pro: Iniciando...');

// Asegurarse de que el namespace LeadManagerPro está disponible
window.LeadManagerPro = window.LeadManagerPro || {};
window.LeadManagerPro.state = window.LeadManagerPro.state || {};
window.LeadManagerPro.utils = window.LeadManagerPro.utils || {};
window.LeadManagerPro.modules = window.LeadManagerPro.modules || {};

// Inicialización del script de contenido
async function initContentScript() {
  console.log('Lead Manager Pro: Script de contenido inicializado');
  
  // Comprobar si estamos en un perfil que se estaba extrayendo
  const isExtractingProfile = localStorage.getItem('snap_lead_manager_is_extracting_profile') === 'true';
  const profileUrl = localStorage.getItem('snap_lead_manager_profile_url');
  
  if (isExtractingProfile && profileUrl) {
    console.log('Lead Manager Pro: Continuando con la extracción de un perfil');
    
    // Esperar a que la página cargue completamente
    await window.LeadManagerPro.utils.sleep(2000);
    
    // Extraer detalles del perfil
    if (window.LeadManagerPro.modules.extractOpenProfileDetails) {
      window.LeadManagerPro.modules.extractOpenProfileDetails().catch(console.error);
    } else {
      console.error('Lead Manager Pro: Función extractOpenProfileDetails no disponible');
    }
    
    // No continuar con la inicialización normal del sidebar, etc.
    return;
  }
  
  // Insertar el sidebar
  if (window.LeadManagerPro.modules.insertSidebar) {
    window.LeadManagerPro.modules.insertSidebar();
  } else {
    console.error('Lead Manager Pro: Función insertSidebar no disponible');
  }
  
  // Configurar listeners del sidebar
  if (window.LeadManagerPro.modules.setupSidebarListeners) {
    window.LeadManagerPro.modules.setupSidebarListeners();
  } else {
    console.error('Lead Manager Pro: Función setupSidebarListeners no disponible');
  }
  
  // Configurar detección periódica de errores
  if (window.LeadManagerPro.modules.setupErrorDetection) {
    window.LeadManagerPro.modules.setupErrorDetection();
  } else {
    console.error('Lead Manager Pro: Función setupErrorDetection no disponible');
  }
  
  // Manejar acciones para mensajes de Chrome
  setupChromeMessagesListener();
  
  // Comprobar si estamos en una recarga forzada para búsqueda
  const forceReload = localStorage.getItem('snap_lead_manager_force_reload') === 'true';
  const searchUrl = localStorage.getItem('snap_lead_manager_search_url');
  const searchType = localStorage.getItem('snap_lead_manager_search_type');
  const searchTerm = localStorage.getItem('snap_lead_manager_search_term');
  
  if (forceReload && searchUrl) {
    console.log('Lead Manager Pro: Detectada recarga forzada para búsqueda');
    
    // Asegurar que el estado de búsqueda existe
    if (!window.LeadManagerPro.state.searchState) {
      window.LeadManagerPro.state.searchState = {
        isSearching: false,
        searchType: 'people',
        searchTerm: '',
        city: '',
        currentPage: 1,
        totalPages: 1,
        foundProfiles: [],
        pauseSearch: false,
        stopSearch: false,
        startTime: null
      };
    }
    
    // Restaurar el estado de búsqueda desde localStorage
    if (searchType) window.LeadManagerPro.state.searchState.searchType = searchType;
    if (searchTerm) window.LeadManagerPro.state.searchState.searchTerm = searchTerm;
    
    // Limpiar flags de recarga
    localStorage.removeItem('snap_lead_manager_force_reload');
    localStorage.removeItem('snap_lead_manager_search_url');
    localStorage.removeItem('snap_lead_manager_search_type');
    localStorage.removeItem('snap_lead_manager_search_term');
    
    // Verificar si estamos en la página de búsqueda esperada
    const isInExpectedPage = window.location.href.includes(searchUrl) || 
                             (window.location.href.includes('/search/') && 
                              window.location.href.includes(searchTerm));
    
    if (isInExpectedPage) {
      console.log('Lead Manager Pro: Estamos en la página de búsqueda esperada, continuando el proceso');
      
      // Esperar a que la página esté completamente cargada antes de continuar
      setTimeout(() => {
        console.log('Lead Manager Pro: Aplicando filtro de ciudad después de recarga');
        localStorage.setItem('snap_lead_manager_city_filter_applied', 'false');
        if (window.LeadManagerPro.modules.applyCityFilter) {
          window.LeadManagerPro.modules.applyCityFilter().catch(console.error);
        }
      }, 2500);
    } else {
      console.log('Lead Manager Pro: No estamos en la página esperada, intentando navegar nuevamente');
      // Reintentamos la navegación
      setTimeout(() => {
        if (window.LeadManagerPro.modules.navigateToSearchPage) {
          window.LeadManagerPro.modules.navigateToSearchPage(window.LeadManagerPro.state.searchState).catch(console.error);
        }
      }, 1500);
    }
  }
  
  // Verificar periódicamente que el sidebar sigue presente
  setupSidebarPresenceCheck();
}

/**
 * Configura los listeners para los mensajes de Chrome
 */
function setupChromeMessagesListener() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Lead Manager Pro: Mensaje recibido desde background', message);
    
    if (message.action === 'apply_city_filter') {
      if (window.LeadManagerPro.modules.applyCityFilter) {
        window.LeadManagerPro.modules.applyCityFilter()
          .then(result => sendResponse(result))
          .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
      }
    }
    
    if (message.action === 'find_profiles') {
      // Guardar datos de búsqueda en localStorage si se proporcionan
      if (message.searchData) {
        localStorage.setItem('snap_lead_manager_search_data', JSON.stringify(message.searchData));
      }
      
      if (window.LeadManagerPro.modules.findProfiles) {
        window.LeadManagerPro.modules.findProfiles()
          .then(result => sendResponse(result))
          .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
      }
    }
    
    if (message.action === 'pause_search') {
      if (window.LeadManagerPro.modules.pauseSearch) {
        const result = window.LeadManagerPro.modules.pauseSearch();
        sendResponse(result);
      }
      return false;
    }
    
    if (message.action === 'resume_search') {
      if (window.LeadManagerPro.modules.findProfiles) {
        window.LeadManagerPro.modules.findProfiles()
          .then(result => sendResponse(result))
          .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
      }
    }
    
    if (message.action === 'stop_search') {
      if (window.LeadManagerPro.modules.stopSearch) {
        const result = window.LeadManagerPro.modules.stopSearch();
        sendResponse(result);
      }
      return false;
    }
    
    if (message.action === 'update_status') {
      if (window.LeadManagerPro.utils.updateStatus) {
        window.LeadManagerPro.utils.updateStatus(message.status, message.progress);
        sendResponse({ success: true });
      }
      return false;
    }
    
    if (message.action === 'get_search_status') {
      const searchState = window.LeadManagerPro.state.searchState || {
        isSearching: false,
        pauseSearch: false,
        currentPage: 0,
        totalPages: 0,
        foundProfiles: [],
        searchType: '',
        searchTerm: '',
        city: ''
      };
      
      sendResponse({
        isSearching: searchState.isSearching,
        pauseSearch: searchState.pauseSearch,
        currentPage: searchState.currentPage,
        totalPages: searchState.totalPages,
        foundProfiles: searchState.foundProfiles.length,
        searchType: searchState.searchType,
        searchTerm: searchState.searchTerm,
        city: searchState.city
      });
      return false;
    }
    
    if (message.action === 'open_and_extract_profile') {
      if (window.LeadManagerPro.modules.openAndExtractProfileDetails) {
        window.LeadManagerPro.modules.openAndExtractProfileDetails(message.profileUrl)
          .then(result => sendResponse(result))
          .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
      }
    }
    
    if (message.action === 'extract_profile_details') {
      if (window.LeadManagerPro.modules.extractOpenProfileDetails) {
        window.LeadManagerPro.modules.extractOpenProfileDetails()
          .then(result => sendResponse(result))
          .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
      }
    }
    
    if (message.action === 'save_profile_to_crm') {
      if (window.LeadManagerPro.modules.saveProfileToCRM) {
        window.LeadManagerPro.modules.saveProfileToCRM(message.profileData)
          .then(result => sendResponse(result))
          .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
      }
    }
    
    if (message.action === 'check_for_errors') {
      if (window.LeadManagerPro.modules.detectAndHandleErrors) {
        const hasErrors = window.LeadManagerPro.modules.detectAndHandleErrors();
        sendResponse({ 
          hasErrors, 
          recoveryState: { ...window.LeadManagerPro.state.recoveryState }
        });
      } else {
        sendResponse({ hasErrors: false });
      }
      return false;
    }
    
    // Si no se encontró ningún handler, responder con error
    sendResponse({ success: false, error: 'Acción no implementada o handler no disponible' });
    return false;
  });
}

/**
 * Configura la verificación periódica de la presencia del sidebar
 */
function setupSidebarPresenceCheck() {
  setInterval(() => {
    if (!document.getElementById('snap-lead-manager-iframe')) {
      console.log('Lead Manager Pro: Sidebar no encontrado, reinserting...');
      if (window.LeadManagerPro.modules.insertSidebar) {
        window.LeadManagerPro.modules.insertSidebar();
      }
    }
  }, 5000);
  
  // Observador de mutaciones para detectar cambios en el DOM
  if (window.MutationObserver && window.LeadManagerPro.modules.insertSidebar) {
    const observer = new MutationObserver((mutations) => {
      // Si no existe el sidebar, reinsertarlo
      if (!document.getElementById('snap-lead-manager-iframe')) {
        console.log('Lead Manager Pro: Cambios detectados en el DOM, reinserting sidebar...');
        window.LeadManagerPro.modules.insertSidebar();
      }
    });
    
    // Iniciar el observador después de un breve retraso
    setTimeout(() => {
      if (document.body) {
        observer.observe(document.body, { 
          childList: true,
          subtree: true 
        });
      }
    }, 2000);
  }
}

// Iniciar el script cuando el DOM esté completamente cargado
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Verificar si los módulos necesarios están disponibles
    if (window.LeadManagerPro.modules.detectAndHandleErrors) {
      // Verificar si hay errores antes de inicializar
      if (!window.LeadManagerPro.modules.detectAndHandleErrors()) {
        initContentScript();
      }
    } else {
      console.error('Lead Manager Pro: Módulo de detección de errores no disponible');
      initContentScript();
    }
  });
} else {
  // Verificar si los módulos necesarios están disponibles
  if (window.LeadManagerPro.modules.detectAndHandleErrors) {
    // Verificar si hay errores antes de inicializar
    if (!window.LeadManagerPro.modules.detectAndHandleErrors()) {
      initContentScript();
    }
  } else {
    console.error('Lead Manager Pro: Módulo de detección de errores no disponible');
    initContentScript();
  }
}

// Exportar funciones para depuración
window._debug_leadManagerPro = {
  initContentScript,
  modules: window.LeadManagerPro.modules,
  utils: window.LeadManagerPro.utils,
  state: window.LeadManagerPro.state
};

console.log('Lead Manager Pro: Script de contenido cargado');
