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
    // Agregamos un manejador específico para restablecer el sidebar
    if (message.action === 'resetSidebar') {
      console.log('Lead Manager Pro: Recibida solicitud para restablecer el sidebar');
      
      // Eliminar el sidebar anterior si existe
      const oldSidebar = document.getElementById('snap-lead-manager-container');
      if (oldSidebar) {
        try {
          document.body.removeChild(oldSidebar);
          console.log('Sidebar anterior eliminado');
        } catch (e) {
          console.error('Error al eliminar sidebar:', e);
        }
      }
      
      // Eliminar el botón de toggle anterior si existe
      const oldToggle = document.getElementById('snap-lead-manager-toggle');
      if (oldToggle) {
        try {
          document.body.removeChild(oldToggle);
          console.log('Botón toggle anterior eliminado');
        } catch (e) {
          console.error('Error al eliminar botón toggle:', e);
        }
      }
      
      // Eliminar preferencia guardada de sidebar oculto
      localStorage.removeItem('snap_lead_manager_sidebar_hidden');
      
      // Recrear el sidebar desde cero
      setTimeout(() => {
        console.log('Recreando sidebar...');
        
        if (window.LeadManagerPro && window.LeadManagerPro.modules && window.LeadManagerPro.modules.insertSidebar) {
          const newSidebar = window.LeadManagerPro.modules.insertSidebar();
          console.log('Nuevo sidebar creado:', newSidebar ? 'Sí' : 'No');
          
          // Asegurarse de que sea visible
          if (newSidebar) {
            newSidebar.style.transform = 'translateX(0)';
          }
          
          // Reconfigurar listeners
          if (window.LeadManagerPro.modules.setupSidebarListeners) {
            window.LeadManagerPro.modules.setupSidebarListeners();
            console.log('Listeners del sidebar reconfigiurados');
          }
        } else {
          console.error('No se pudo recrear el sidebar: módulos no disponibles');
        }
      }, 500);
      
      sendResponse({ success: true, message: 'Acción de restablecimiento iniciada' });
      return true;
    }
    console.log('Lead Manager Pro: Mensaje recibido desde background', message);
    
    if (message.action === 'apply_city_filter') {
      if (window.LeadManagerPro.modules.applyCityFilter) {
        window.LeadManagerPro.modules.applyCityFilter()
          .then(result => sendResponse(result))
          .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
      }
    }
    
    if (message.action === 'startGroupSearch') {
      console.log('%c[GRUPO BUSCADOR] Recibido mensaje para búsqueda de grupos:', 'background: #4267B2; color: white; padding: 3px 5px; border-radius: 3px;', message.options);
      
      // Verificar disponibilidad del módulo de búsqueda de grupos
      console.log('Disponibilidad de módulos:', {
        leadManagerPro: !!window.leadManagerPro,
        groupFinder: window.leadManagerPro ? !!window.leadManagerPro.groupFinder : false,
        groupSearchUI: window.leadManagerPro ? !!window.leadManagerPro.groupSearchUI : false
      });
      
      // Si no están disponibles los módulos, crearlos manualmente para asegurar la funcionalidad
      if (!window.leadManagerPro) {
        console.log('Creando namespace leadManagerPro');
        window.leadManagerPro = {};
      }
      
      // Intentar cargar el módulo GroupFinder si no existe
      if (!window.leadManagerPro.groupFinder) {
        console.log('Intentando cargar manualmente GroupFinder');
        
        // Importar dinámicamente el script si no existe
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('content/modules/groupFinder.js');
        document.head.appendChild(script);
        
        // Crear una instancia temporal
        window.leadManagerPro.groupFinder = new GroupFinder();
      }
      
      // Intentar cargar el módulo GroupSearchUI si no existe
      if (!window.leadManagerPro.groupSearchUI) {
        console.log('Intentando cargar manualmente GroupSearchUI');
        
        // Importar dinámicamente el script si no existe
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('content/modules/groupSearchUI.js');
        document.head.appendChild(script);
        
        // Crear una instancia temporal
        window.leadManagerPro.groupSearchUI = {
          show: function(options) {
            console.log('Mostrando UI con opciones:', options);
            return this;
          },
          processUpdate: function(data) {
            console.log('Actualizando UI con datos:', data);
          }
        };
      }
      
      // Verificar nuevamente si los módulos están disponibles
      if (window.leadManagerPro && window.leadManagerPro.groupFinder) {
        // Usar la interfaz simple si la principal no está disponible
        const uiModule = window.leadManagerPro.groupSearchUI || window.leadManagerPro.simpleGroupUI;
        
        // Obtener opciones desde localStorage primero, luego del message y finalmente del storage local
        try {
          // 1. Primero intentar leer desde localStorage (sidebar)
          let generalOptions = {};
          try {
            const generalOptionsStr = localStorage.getItem('snap_lead_manager_general_options');
            if (generalOptionsStr) {
              generalOptions = JSON.parse(generalOptionsStr);
            }
          } catch (e) {
            console.error('Error al leer opciones de localStorage:', e);
          }
          
          console.log('DIRECT localStorageOptions:', generalOptions);
          
          // 2. Leer opciones del mensaje
          const messageOptions = message.options || {};
          
          // 3. Luego obtener del chrome.storage para complementar
          chrome.storage.local.get(['maxScrolls', 'scrollDelay'], function(result) {
            // Prioridad: localStorage > message > chrome.storage > defaults
            const options = {
              ...message.options,
              maxScrolls: Number(generalOptions.maxScrolls) || Number(messageOptions.maxScrolls) || Number(result.maxScrolls) || 50,
              scrollDelay: Number(generalOptions.scrollDelay) || Number(messageOptions.scrollDelay) || Number(result.scrollDelay) || 2
            };
            
            // Asegurarse de que sean números válidos
            options.maxScrolls = isNaN(options.maxScrolls) ? 50 : Number(options.maxScrolls);
            options.scrollDelay = isNaN(options.scrollDelay) ? 2 : Number(options.scrollDelay);
            
            console.log('CRITICAL: Opciones finales para la búsqueda:', options);
            
            // Guardar también en localStorage para que GroupFinder las lea correctamente
            try {
              localStorage.setItem('snap_lead_manager_general_options', JSON.stringify({
                maxScrolls: options.maxScrolls,
                scrollDelay: options.scrollDelay
              }));
              
              console.log('Opciones guardadas en localStorage:', options.maxScrolls, options.scrollDelay);
            } catch (e) {
              console.error('Error al guardar opciones en localStorage:', e);
            }
            
            // Mostrar la interfaz de búsqueda
            uiModule.show({
              title: 'Búsqueda de Grupos de Facebook'
            });
            
            // Configurar callback para actualizar la interfaz
            const progressCallback = (progressData) => {
              console.log('Progreso de búsqueda:', progressData);
              
              // Actualizar la interfaz de usuario
              uiModule.processUpdate(progressData);
              
              // Enviar actualizaciones de progreso al fondo
              chrome.runtime.sendMessage({
                type: 'status_update',
                message: progressData.message || 'Buscando grupos...',
                progress: progressData.type === 'progress' ? progressData.value : null,
                groupsFound: progressData.groupsFound || 0,
                finished: progressData.type === 'complete'
              });
            };
            
            // Guardar los valores directamente en el objeto GroupFinder para mayor seguridad
            try {
              if (window.leadManagerPro && window.leadManagerPro.groupFinder) {
                // Establecer explícitamente estos valores antes de inicializar
                window.leadManagerPro.groupFinder.maxScrolls = options.maxScrolls;
                window.leadManagerPro.groupFinder.scrollTimeout = options.scrollDelay * 1000;
                
                console.log('DIRECT MAX SCROLLS SET TO:', options.maxScrolls);
                console.log('DIRECT SCROLL TIMEOUT SET TO:', options.scrollDelay * 1000);
              }
            } catch (e) {
              console.error('Error al establecer valores directamente:', e);
            }
            
            try {
              // Inicializar y comenzar la búsqueda de grupos
              window.leadManagerPro.groupFinder.init(options, progressCallback).startSearch();
            } catch (error) {
              console.error("Error al iniciar la búsqueda de grupos:", error);
              sendResponse({ success: false, error: error.message || "Error desconocido al iniciar búsqueda" });
            }
            
            sendResponse({ success: true, message: 'Búsqueda de grupos iniciada' });
          });
          return true;
        } catch (error) {
          console.error('Error en el procesamiento inicial:', error);
          sendResponse({ success: false, error: error.message || "Error desconocido" });
          return false;
        }
      } else {
        console.error('Lead Manager Pro: Módulos de búsqueda de grupos no disponibles');
        sendResponse({ success: false, error: 'Módulos de búsqueda de grupos no disponibles' });
        return false;
      }
    }
    
    if (message.action === 'stopGroupSearch') {
      if (window.leadManagerPro && window.leadManagerPro.groupFinder) {
        console.log('Deteniendo búsqueda de grupos');
        const groups = window.leadManagerPro.groupFinder.stopSearch();
        
        // Usar la interfaz disponible (principal o simple)
        const uiModule = window.leadManagerPro.groupSearchUI || 
                         window.leadManagerPro.simpleGroupUI;
        
        // Actualizar la interfaz si está disponible
        if (uiModule) {
          uiModule.processUpdate({
            type: 'complete',
            message: `Búsqueda finalizada. Se encontraron ${groups.length} grupos.`,
            groupsFound: groups.length
          });
        }
        
        // Guardar resultados en localStorage para futuro uso
        try {
          localStorage.setItem('foundGroups', JSON.stringify(groups));
          console.log('Grupos guardados en localStorage:', groups.length);
        } catch (e) {
          console.error('Error al guardar grupos en localStorage:', e);
        }
        
        sendResponse({ success: true, groupsFound: groups.length });
        return false;
      }
    }
    
    if (message.action === 'exportGroupResults') {
      if (window.leadManagerPro && window.leadManagerPro.groupFinder) {
        const format = message.format || 'json';
        const url = window.leadManagerPro.groupFinder.exportResults(format);
        sendResponse({ success: true, downloadUrl: url });
        return false;
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
    
    // Manejar la acción de iniciar búsqueda directamente desde la ventana de opciones
    if (message.action === 'startSearchDirectly') {
      console.log('Iniciando búsqueda directamente con configuración:', message);
      
      // Configurar el sidebar para búsqueda directa
      if (window.LeadManagerPro.modules.insertSidebar) {
        // Mostrar el sidebar si no está visible
        const sidebarContainer = document.getElementById('snap-lead-manager-container');
        if (sidebarContainer) {
          sidebarContainer.style.transform = 'translateX(0)';
          const toggleButton = document.getElementById('snap-lead-manager-toggle');
          if (toggleButton) {
            toggleButton.innerHTML = '◀';
            toggleButton.setAttribute('title', 'Ocultar Lead Manager');
          }
          localStorage.setItem('snap_lead_manager_sidebar_hidden', 'false');
        } else {
          // Si no existe el sidebar, crearlo
          window.LeadManagerPro.modules.insertSidebar();
        }
        
        // Recopilar criterios de búsqueda existentes
        const searchTerm = localStorage.getItem('snap_lead_manager_search_term') || 'mecánicos';
        const searchCity = localStorage.getItem('snap_lead_manager_search_city') || 'Madrid';
        
        // Asegurarse de que el iframe se ha cargado completamente
        setTimeout(() => {
          // Configurar búsqueda tipo grupo y luego iniciarla
          const iframe = document.getElementById('snap-lead-manager-iframe');
          if (iframe && iframe.contentWindow) {
            // Enviar mensaje para configurar y comenzar búsqueda automáticamente
            iframe.contentWindow.postMessage({
              action: 'search_with_options',
              searchData: {
                type: 'groups',
                term: searchTerm,
                city: searchCity,
                filterOptions: message.options || {}
              }
            }, '*');
          }
        }, 1500);
        
        sendResponse({ success: true });
      } else {
        console.error('Módulo de sidebar no disponible');
        sendResponse({ success: false, error: 'Módulo de sidebar no disponible' });
      }
      return true;
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
    
    // Asegurar que el botón de toggle sea visible, incluso si hay errores
    setTimeout(() => {
      if (window.LeadManagerPro && window.LeadManagerPro.modules && 
          window.LeadManagerPro.modules.ensureToggleButtonVisible) {
        window.LeadManagerPro.modules.ensureToggleButtonVisible();
        console.log('Botón de toggle asegurado después de cargar el DOM');
      }
    }, 1500);
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
  
  // Asegurar que el botón de toggle sea visible, incluso si hay errores
  setTimeout(() => {
    if (window.LeadManagerPro && window.LeadManagerPro.modules && 
        window.LeadManagerPro.modules.ensureToggleButtonVisible) {
      window.LeadManagerPro.modules.ensureToggleButtonVisible();
      console.log('Botón de toggle asegurado (DOM ya cargado)');
    }
  }, 1000);
}

// Exportar funciones para depuración
window._debug_leadManagerPro = {
  initContentScript,
  modules: window.LeadManagerPro.modules,
  utils: window.LeadManagerPro.utils,
  state: window.LeadManagerPro.state
};

console.log('Lead Manager Pro: Script de contenido cargado');
