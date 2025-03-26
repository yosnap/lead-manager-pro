// Constantes y selectores
const SELECTORS = {
  SEARCH_RESULTS: 'div[role="feed"] > div',
  PROFILE_CONTAINER: 'div[role="feed"]',
  PROFILE_LINK: 'a[href*="/profile.php"], a[href*="facebook.com/"], a[role="link"][tabindex="0"]',
  ADD_FRIEND_BUTTON: 'div[aria-label="Añadir a amigos"], div[aria-label="Agregar a amigos"], div[aria-label="Add Friend"]',
  SEARCH_INPUT: 'input[type="search"]',
  MESSAGE_BUTTON: 'div[aria-label="Enviar mensaje"], div[aria-label="Message"]',
  MESSAGE_INPUT: 'div[role="textbox"][contenteditable="true"]',
  SEND_BUTTON: 'button[type="submit"]' // Agregar selector para el botón de envío
};

// Estado local
let state = {
  isProcessing: false,
  currentAction: null,
  sidebarVisible: true,
  lastError: null,
  retryAttempts: {},
  timeouts: {}
};

// Constantes
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const OPERATION_TIMEOUT = 30000;

// Variables globales para sincronización con background.js
// ELIMINAR esta línea que causa el error de duplicación
// let isProcessing = true; 
let isPaused = false;
let currentProgress = 0;

// Función para manejar errores
function handleError(error, operation) {
  console.error(`Error durante ${operation}:`, error);
  state.lastError = { operation, message: error.message, timestamp: Date.now() };
  
  // Inicializar contador de reintentos si no existe
  if (!state.retryAttempts[operation]) {
    state.retryAttempts[operation] = 0;
  }
  
  if (state.retryAttempts[operation] < MAX_RETRIES) {
    state.retryAttempts[operation]++;
    const delay = RETRY_DELAY * state.retryAttempts[operation];
    
    console.log(`Reintentando ${operation} (${state.retryAttempts[operation]}/${MAX_RETRIES}) en ${delay/1000} segundos...`);
    
    // Verificar si chrome.runtime está disponible antes de enviar mensaje
    if (chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'status_update',
        message: `Reintentando ${operation} (intento ${state.retryAttempts[operation]})...`,
        error: true,
        progress: 0
      });
    }
    
    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          switch (operation) {
            case 'search':
              await performSearch(currentSearchTerm);
              break;
            case 'profile_extraction':
              await findProfiles();
              break;
            // Agregar más casos según sea necesario
          }
          state.retryAttempts[operation] = 0;
          resolve(true);
        } catch (retryError) {
          resolve(handleError(retryError, operation));
        }
      }, delay);
    });
  } else {
    state.retryAttempts[operation] = 0;
    
    // Verificar si chrome.runtime está disponible antes de enviar mensaje
    if (chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'status_update',
        message: `Error: No se pudo completar ${operation} después de ${MAX_RETRIES} intentos. ${error.message}`,
        error: true,
        finished: true
      });
    }
    
    return Promise.reject(error);
  }
}

// Función para manejar timeouts
function setupOperationTimeout(operation, timeout = OPERATION_TIMEOUT) {
  if (state.timeouts[operation]) {
    clearTimeout(state.timeouts[operation]);
  }
  
  // Aumentar el timeout para la operación de búsqueda
  if (operation === 'search') {
    timeout = 120000; // 2 minutos para búsqueda
  }
  
  return new Promise((resolve, reject) => {
    state.timeouts[operation] = setTimeout(() => {
      const error = new Error(`Operación ${operation} excedió el tiempo límite de ${timeout/1000} segundos`);
      reject(error);
    }, timeout);
  });
}

// Función para limpiar timeout
function clearOperationTimeout(operation) {
  if (state.timeouts[operation]) {
    clearTimeout(state.timeouts[operation]);
    delete state.timeouts[operation];
  }
}

// Variables globales
let isProcessing = false;
let currentSearchTerm = '';
let retryCount = 0;

// Función para inyectar el sidebar
function injectSidebar(options = {}) {
  // Verificar si el sidebar ya existe
  if (document.getElementById('snap-lead-manager-overlay')) {
    console.log('Sidebar ya inyectado, no se necesita volver a crear');
    return;
  }
  
  console.log('Inyectando sidebar...');
  
  // Crear el overlay que contendrá el sidebar
  const overlay = document.createElement('div');
  overlay.id = 'snap-lead-manager-overlay';
  overlay.className = 'snap-lead-manager-overlay';
  
  // Crear el handle para colapsar/expandir el sidebar
  const handle = document.createElement('div');
  handle.id = 'snap-lead-manager-handle';
  handle.className = 'snap-lead-manager-handle';
  handle.innerHTML = '⟪';
  handle.title = 'Colapsar/Expandir Snap Lead Manager';
  
  // Agregar evento de clic al handle
  handle.addEventListener('click', toggleSidebar);
  
  // Crear el iframe para el sidebar
  const iframe = document.createElement('iframe');
  iframe.id = 'snap-lead-manager-iframe';
  iframe.src = chrome.runtime.getURL('sidebar.html');
  iframe.className = 'snap-lead-manager-iframe';
  
  // Agregar elementos al DOM
  overlay.appendChild(handle);
  overlay.appendChild(iframe);
  document.body.appendChild(overlay);
  
  // Verificar si hay un estado guardado
  const savedState = localStorage.getItem('snap-lead-manager-state');
  if (savedState === 'collapsed') {
    // Si estaba colapsado, colapsar ahora
    toggleSidebar();
  }
  
  // Agregar clase al body para ajustar el contenido
  document.body.classList.add('snap-lead-manager-active');
  
  console.log('Sidebar inyectado correctamente');
  
  // Notificar al background script que el sidebar se ha inyectado
  if (chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({
      action: 'sidebar_injected'
    });
  }
}

// Función para alternar la visibilidad del sidebar
function toggleSidebar() {
  const overlay = document.getElementById('snap-lead-manager-overlay');
  const handle = document.getElementById('snap-lead-manager-handle');
  
  if (state.sidebarVisible) {
    overlay.classList.add('collapsed');
    handle.innerHTML = '⟫';
    document.body.classList.add('snap-lead-manager-collapsed');
    localStorage.setItem('snap-lead-manager-state', 'collapsed');
  } else {
    overlay.classList.remove('collapsed');
    handle.innerHTML = '⟪';
    document.body.classList.remove('snap-lead-manager-collapsed');
    localStorage.setItem('snap-lead-manager-state', 'expanded');
  }
  
  state.sidebarVisible = !state.sidebarVisible;
  
  // Notificar al background script sobre el cambio de estado del sidebar
  if (chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({
      action: 'sidebar_state_changed',
      isOpen: state.sidebarVisible
    });
  }
}

// Función principal de búsqueda
async function performSearch(searchTerm, searchData) {
  console.log('Realizando búsqueda:', searchTerm, 'Datos adicionales:', searchData);
  currentSearchTerm = searchTerm; // Guardar el término de búsqueda en la variable global
  
  // Guardar tiempo de inicio
  localStorage.setItem('snap_lead_manager_search_start_time', Date.now().toString());
  
  try {
    const timeoutPromise = setupOperationTimeout('search', 120000); // Aumentar a 2 minutos
    
    // Verificar si chrome.runtime está disponible antes de enviar mensaje
    if (chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'status_update',
        message: 'Iniciando búsqueda en Facebook',
        progress: 10
      });
    }

    // Guardar información de búsqueda en localStorage para mantenerla después de recargas
    localStorage.setItem('snap_lead_manager_search_term', searchTerm);
    localStorage.setItem('snap_lead_manager_search_pending', 'true');
    localStorage.removeItem('snap_lead_manager_city_filter_applied'); // Reiniciar flag del filtro
    
    // Guardar datos adicionales de búsqueda si existen
    if (searchData) {
      localStorage.setItem('snap_lead_manager_search_data', JSON.stringify(searchData));
    } else {
      // Si no hay datos adicionales, eliminar cualquier dato anterior
      localStorage.removeItem('snap_lead_manager_search_data');
    }
    
    // Construir la URL de búsqueda en función de los criterios
    let baseSearchUrl = `https://www.facebook.com/search/people/?q=${encodeURIComponent(searchTerm)}`;
    
    // Si hay datos de ciudad, construir una URL con el filtro específico de ciudad
    if (searchData && searchData.city && searchData.city.trim() !== '') {
      const city = searchData.city.trim();
      console.log(`Aplicando filtro de ciudad: ${city}`);
      
      // Almacenar la búsqueda completa para mostrar en la UI
      localStorage.setItem('snap_lead_manager_full_query', `${searchTerm} (Ciudad: ${city})`);
      
      // Primero navegamos a la búsqueda general de personas
      // El filtro de ciudad se aplicará después de cargar la página
      updateStatus(`Preparando búsqueda con filtro de ciudad: ${city}`, 15);
    } else {
      localStorage.setItem('snap_lead_manager_full_query', searchTerm);
      localStorage.removeItem('snap_lead_manager_search_data'); // Asegurarse de no tener datos antiguos
    }
    
    // Para depuración, intentar enviar otro mensaje antes de la redirección
    try {
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          type: 'status_update',
          message: 'Redirigiendo a la página de búsqueda...',
          progress: 15
        });
      }
    } catch (e) {
      console.error('Error al enviar mensaje de estado antes de redirección:', e);
    }
    
    // Redirigir a la URL de búsqueda
    console.log('Redirigiendo a:', baseSearchUrl);
    updateStatus('Redirigiendo a la página de búsqueda...', 15);
    
    // Verificar si ya estamos en la página de búsqueda
    const currentUrl = window.location.href;
    const isSearchPage = currentUrl.includes('/search/people');
    
    if (isSearchPage) {
      console.log('Ya estamos en una página de búsqueda, aplicando filtros directamente...');
      
      // Si ya estamos en una página de búsqueda, aplicar los filtros directamente
      await applySearchFilters();
    } else {
      // Si no estamos en una página de búsqueda, redirigir
      window.location.href = baseSearchUrl;
    }
    
    // Limpiar el timeout al finalizar con éxito
    clearOperationTimeout('search');
    
    return { success: true, message: 'Búsqueda iniciada' };
  } catch (error) {
    // Limpiar el timeout en caso de error
    clearOperationTimeout('search');
    console.error('Error al realizar búsqueda:', error);
    
    // Notificar al background script sobre el error
    if (chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'status_update',
        message: 'Error al realizar búsqueda: ' + error.message,
        error: true,
        progress: 0
      });
    }
    
    throw error;
  }
}

// Función para aplicar filtros después de cargar la página de resultados
async function applySearchFilters() {
  console.log('Aplicando filtros de búsqueda...');
  updateStatus('Aplicando filtros de búsqueda...', 20);
  
  try {
    // Obtener datos de búsqueda del localStorage
    const searchDataStr = localStorage.getItem('snap_lead_manager_search_data');
    if (!searchDataStr) {
      console.log('No hay datos de búsqueda, omitiendo filtros');
      // Marcar como aplicado para continuar con el proceso
      localStorage.setItem('snap_lead_manager_city_filter_applied', 'true');
      
      // Iniciar la búsqueda de perfiles directamente
      console.log('Iniciando búsqueda de perfiles sin filtros...');
      
      // Notificar al background script sobre el progreso
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          type: 'status_update',
          message: 'Iniciando búsqueda sin filtros...',
          progress: 30
        });
      }
      
      // Iniciar findProfiles con un pequeño retraso para asegurar que la página esté lista
      setTimeout(() => {
        findProfiles().catch(error => {
          console.error('Error al buscar perfiles sin filtros:', error);
        });
      }, 1000);
      
      return { success: true, message: 'No hay datos de filtro para aplicar' };
    }
    
    const searchData = JSON.parse(searchDataStr);
    
    // Aplicar filtro de ciudad si está especificado
    if (searchData && searchData.city && searchData.city.trim() !== '') {
      console.log('Aplicando filtro de ciudad:', searchData.city);
      
      // Comprobar si ya hemos aplicado los filtros
      if (localStorage.getItem('snap_lead_manager_city_filter_applied') === 'true') {
        console.log('Los filtros ya están aplicados, iniciando búsqueda de perfiles...');
        
        // Notificar al background script sobre el progreso
        if (chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({
            type: 'status_update',
            message: 'Filtros ya aplicados, iniciando búsqueda...',
            progress: 35
          });
        }
        
        // Iniciar findProfiles con un pequeño retraso para asegurar que la página esté lista
        setTimeout(() => {
          findProfiles().catch(error => {
            console.error('Error al buscar perfiles después de aplicar filtros:', error);
          });
        }, 1000);
      } else {
        // Aplicar filtros de búsqueda
        console.log('Aplicando filtros y luego buscando perfiles...');
        
        // Notificar al background script sobre el progreso
        if (chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({
            type: 'status_update',
            message: 'Aplicando filtro de ciudad...',
            progress: 25
          });
        }
        
        applyCityFilter()
          .then(result => {
            console.log('Resultado de aplicar filtros:', result);
            
            if (result && result.success) {
              // La función applyCityFilter ya inicia findProfiles() automáticamente
              console.log('Filtro aplicado con éxito, findProfiles() ya iniciado');
              
              // Notificar al background script sobre el progreso
              if (chrome.runtime && chrome.runtime.sendMessage) {
                chrome.runtime.sendMessage({
                  type: 'status_update',
                  message: 'Filtro aplicado con éxito, iniciando búsqueda...',
                  progress: 35
                });
              }
            } else {
              console.error('Error al aplicar filtros:', result?.error || 'Error desconocido');
              
              // Notificar al background script sobre el error
              if (chrome.runtime && chrome.runtime.sendMessage) {
                chrome.runtime.sendMessage({
                  type: 'status_update',
                  message: 'Error al aplicar filtros, intentando continuar...',
                  progress: 30
                });
              }
              
              // Intentar continuar de todos modos
              setTimeout(() => {
                findProfiles().catch(error => {
                  console.error('Error al buscar perfiles después de fallo en filtros:', error);
                });
              }, 1000);
            }
          })
          .catch(error => {
            console.error('Error al aplicar filtros:', error);
            
            // Notificar al background script sobre el error
            if (chrome.runtime && chrome.runtime.sendMessage) {
              chrome.runtime.sendMessage({
                type: 'status_update',
                message: 'Error al aplicar filtros: ' + error.message,
                progress: 30
              });
            }
            
            // Intentar continuar de todos modos
            setTimeout(() => {
              findProfiles().catch(innerError => {
                console.error('Error al buscar perfiles después de excepción en filtros:', innerError);
              });
            }, 1000);
          });
      }
      
      updateStatus('Continuando con la búsqueda después de filtro de ciudad', 40);
    } else {
      console.log('No hay ciudad especificada en los datos de búsqueda');
      // Marcar como aplicado para continuar con el proceso
      localStorage.setItem('snap_lead_manager_city_filter_applied', 'true');
      
      // Notificar al background script sobre el progreso
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          type: 'status_update',
          message: 'Iniciando búsqueda sin filtro de ciudad...',
          progress: 30
        });
      }
      
      // Iniciar la búsqueda de perfiles directamente
      console.log('Iniciando búsqueda de perfiles sin filtro de ciudad...');
      setTimeout(() => {
        findProfiles().catch(error => {
          console.error('Error al buscar perfiles sin filtro de ciudad:', error);
        });
      }, 1000);
    }
    
    return { success: true, message: 'Proceso de filtrado completado' };
  } catch (error) {
    console.error('Error al aplicar filtros:', error);
    // Marcar como aplicado para evitar bloqueos
    localStorage.setItem('snap_lead_manager_city_filter_applied', 'true');
    updateStatus('Error al aplicar filtros, continuando con la búsqueda', 30);
    
    // Notificar al background script sobre el error
    if (chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'status_update',
        message: 'Error al aplicar filtros: ' + error.message,
        progress: 30
      });
    }
    
    // Intentar continuar de todos modos
    console.log('Intentando buscar perfiles a pesar del error...');
    setTimeout(() => {
      findProfiles().catch(innerError => {
        console.error('Error al buscar perfiles después de excepción en applySearchFilters:', innerError);
      });
    }, 1000);
    
    return { success: false, error: error.message };
  }
}

// Función para actualizar el estado y enviar información al sidebar
let lastStatusMessage = '';
let lastStatusProgress = 0;
function updateStatus(message, progress = 0, options = {}) {
  // Evitar actualizaciones de estado innecesarias si el mensaje es el mismo
  if (lastStatusMessage === message && lastStatusProgress === progress) {
    return; // No actualizar si es el mismo mensaje y progreso
  }
  
  // Guardar el último mensaje y progreso
  lastStatusMessage = message;
  lastStatusProgress = progress;
  
  // Solo registrar en consola si es un cambio significativo o un mensaje importante
  if (progress % 10 === 0 || progress === 100 || message.includes('Error') || message.includes('Completada')) {
    console.log(`Estado: ${message} (${progress}%)`);
  }
  
  try {
    // Actualizar el estado en el iframe si existe
    const iframe = document.getElementById('snap-lead-manager-iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        action: 'update_status',
        message: message,
        progress: progress,
        ...options
      }, '*');
    }
    
    // Enviar actualización al background script
    if (chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'status_update',
        message: message,
        progress: progress,
        ...options
      });
    }
  } catch (error) {
    // Solo registrar errores reales, no intentos fallidos de comunicación
    if (!(error.message && error.message.includes('Extension context invalidated'))) {
      console.error('Error al actualizar estado:', error);
    }
  }
}

// Escuchar mensajes del iframe del sidebar
window.addEventListener('message', async (event) => {
  // Verificar que el mensaje viene de nuestro sidebar
  if (event.source !== document.getElementById('snap-lead-manager-iframe')?.contentWindow) {
    return;
  }
  
  console.log('Content script recibió mensaje del iframe:', event.data);
  
  const { action, from, searchTerm, data } = event.data;
  
  if (from === 'snap-lead-manager') {
    switch (action) {
      case 'toggle_sidebar':
        toggleSidebar();
        break;
      case 'sidebar_loaded':
        console.log('Sidebar cargado correctamente');
        break;
      case 'search':
        // Manejar búsqueda enviada vía postMessage (cuando chrome.runtime no está disponible)
        console.log('Recibida solicitud de búsqueda vía postMessage:', searchTerm, data);
        
        if (!isProcessing) {
          isProcessing = true;
          
          // Realizar la búsqueda y responder
          performSearch(searchTerm, data)
            .then(result => {
              console.log('Búsqueda iniciada con éxito:', result);
              isProcessing = false;
            })
            .catch(error => {
              console.error('Error al iniciar búsqueda:', error);
              isProcessing = false;
              
              // Notificar al iframe del error
              const iframe = document.getElementById('snap-lead-manager-iframe');
              if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage({
                  action: 'search_response',
                  success: false,
                  error: error.message
                }, '*');
              }
            });
        } else {
          console.warn('Ya hay una búsqueda en proceso');
          // Notificar al iframe que ya hay una búsqueda en proceso
          const iframe = document.getElementById('snap-lead-manager-iframe');
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({
              action: 'search_response',
              success: false,
              error: 'Ya hay una búsqueda en proceso'
            }, '*');
          }
        }
        break;
      case 'open_in_window':
        // Enviar mensaje al background script para abrir el sidebar en una ventana separada
        if (chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({
            action: 'open_sidebar_window'
          }, (response) => {
            console.log('Respuesta al abrir sidebar en ventana:', response);
          });
        }
        break;
      case 'open_profile':
        console.log('Recibida acción para abrir perfil:', data.profileUrl);
        
        // Esta es una acción separada, no parte del proceso de búsqueda
        openProfileInNewTab(data.profileUrl)
          .then(result => {
            chrome.runtime.sendMessage({
              action: 'open_profile_response',
              success: result
            });
          })
          .catch(error => {
            console.error('Error al abrir perfil:', error);
            chrome.runtime.sendMessage({
              action: 'open_profile_response',
              success: false,
              error: error.message
            });
          });
        
        return true; // Mantener canal abierto para respuesta asíncrona
      case 'search_completed':
        // Notificar al sidebar que puede mostrar los resultados
        const searchResults = event.data.profiles || [];
        
        // Enviar resultados al sidebar
        const iframe = document.getElementById('snap-lead-manager-iframe');
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            action: 'display_profile_links',
            profiles: searchResults
          }, '*');
        }
        break;
    }
  }
});

// Escuchar mensajes del background script
if (chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Content script recibió mensaje:', message);
    
    if (message.action === 'search') {
      console.log('Content script recibió solicitud de búsqueda:', message);
      
      // Ejecutar la búsqueda en un try-catch para manejar errores
      try {
        // Iniciar la búsqueda y enviar respuesta inmediata
        sendResponse({ success: true, message: 'Iniciando búsqueda' });
        
        // Ejecutar la búsqueda de forma asíncrona
        performSearch(message.searchTerm, message.searchData)
          .then(result => {
            console.log('Búsqueda completada:', result);
          })
          .catch(error => {
            console.error('Error en búsqueda:', error);
            
            // Si es un error de timeout, intentar continuar con el proceso
            if (error.message.includes('excedió el tiempo límite')) {
              console.log('Timeout en búsqueda, intentando continuar con el proceso...');
              
              // Verificar si estamos en una página de resultados
              if (window.location.href.includes('/search/')) {
                console.log('Estamos en página de resultados, intentando aplicar filtros...');
                
                // Intentar aplicar filtros y continuar
                applySearchFilters()
                  .then(() => {
                    console.log('Filtros aplicados después de timeout, continuando...');
                  })
                  .catch(filterError => {
                    console.error('Error al aplicar filtros después de timeout:', filterError);
                  });
              }
            }
            
            // Notificar el error
            updateStatus(`Error en búsqueda: ${error.message}`, 0, true);
          });
        
        return true; // Mantener el canal abierto
      } catch (error) {
        console.error('Error al iniciar búsqueda:', error);
        sendResponse({ success: false, error: error.message });
        return false;
      }
    } else if (message.action === 'toggle_sidebar') {
      console.log('Recibida solicitud para mostrar/ocultar sidebar');
      
      // Si el sidebar no existe, inyectarlo primero
      if (!document.getElementById('snap-lead-manager-overlay')) {
        injectSidebar();
      } else {
        // Si ya existe, alternar su visibilidad
        toggleSidebar();
      }
      
      sendResponse({ success: true });
      return true;
    } else if (message.action === 'start') {
      console.log('Content script recibió comando de inicio');
      
      // Si hay una búsqueda guardada, reanudarla
      const savedSearchTerm = localStorage.getItem('snap_lead_manager_search_term');
      const savedSearchData = localStorage.getItem('snap_lead_manager_search_data');
      
      if (savedSearchTerm) {
        try {
          isProcessing = true;
          isPaused = false;
          
          let searchData = {};
          if (savedSearchData) {
            try {
              searchData = JSON.parse(savedSearchData);
            } catch (e) {
              console.error('Error al parsear datos de búsqueda guardados:', e);
            }
          }
          
          // Actualizar estado en la UI
          updateStatus('Iniciando proceso con búsqueda guardada...', 5);
          
          // Iniciar búsqueda con término guardado
          performSearch(savedSearchTerm, searchData)
            .then(result => {
              console.log('Búsqueda completada con éxito:', result);
            })
            .catch(error => {
              console.error('Error en búsqueda:', error);
              updateStatus('Error: ' + error.message, 0, true);
            });
        } catch (error) {
          console.error('Error al iniciar proceso:', error);
          updateStatus('Error al iniciar: ' + error.message, 0, true);
        }
      } else {
        updateStatus('No hay términos de búsqueda guardados', 0, true);
      }
      
      sendResponse({ success: true });
      return false;
    } else if (message.action === 'pause') {
      console.log('Recibido comando de pausa');
      isPaused = !isPaused;
      updateStatus(isPaused ? 'Proceso pausado' : 'Proceso reanudado', currentProgress);
      sendResponse({ success: true, isPaused: isPaused });
      return false; // Usar return false en lugar de break
    } else if (message.action === 'restore_sidebar') {
      // Restaurar el sidebar
      injectSidebar();
      
      // Si hay datos de búsqueda, guardarlos en localStorage
      if (message.searchTerm) {
        currentSearchTerm = message.searchTerm;
        
        if (message.searchData) {
          console.log('Restaurando datos de búsqueda:', message.searchData);
          localStorage.setItem('snap_lead_manager_search_data', JSON.stringify(message.searchData));
          
          // Resetear el indicador de filtro de ciudad aplicado
          localStorage.setItem('snap_lead_manager_city_filter_applied', 'false');
        }
      }
      
      sendResponse({ success: true, message: 'Sidebar restaurado' });
      return false; // Usar return false en lugar de break
    } else if (message.action === 'apply_filters') {
      // Aplicar filtros de búsqueda (principalmente ciudad)
      console.log('Solicitando aplicar filtros de búsqueda');
      
      // Verificar si ya tenemos filtros aplicados
      const cityFilterApplied = localStorage.getItem('snap_lead_manager_city_filter_applied') === 'true';
      
      if (cityFilterApplied) {
        console.log('Los filtros ya están aplicados, iniciando búsqueda de perfiles...');
        // Aunque los filtros estén aplicados, iniciamos la búsqueda para asegurar que se realice el proceso completo
        findProfiles()
          .then(() => {
            sendResponse({ success: true, message: 'Filtros ya aplicados, búsqueda de perfiles completada' });
          })
          .catch(error => {
            console.error('Error al buscar perfiles después de aplicar filtros:', error);
            sendResponse({ success: false, error: error.message });
          });
      } else {
        // Aplicar filtros de búsqueda
        console.log('Aplicando filtros y luego buscando perfiles...');
        applySearchFilters()
          .then(result => {
            console.log('Resultado de aplicar filtros:', result);
            
            if (result && result.success) {
              return findProfiles()
                .then(() => {
                  sendResponse({ success: true, message: 'Filtros aplicados y búsqueda de perfiles completada' });
                })
                .catch(error => {
                  console.error('Error al buscar perfiles después de aplicar filtros:', error);
                  sendResponse({ success: false, error: error.message });
                });
            } else {
              sendResponse({ success: false, error: result?.error || 'Error al aplicar filtros' });
            }
          })
          .catch(error => {
            console.error('Error al aplicar filtros:', error);
            sendResponse({ success: false, error: error.message });
          });
      }
      
      return true; // Mantener el canal abierto para respuesta asíncrona
    } else if (message.type === 'status_update') {
      // Actualizar estado en la página
      updateStatus(message.message || 'Estado actualizado', message.progress || 0, message.error);
      
      // Solo responder si no viene con flag suppressResponse
      if (!message.suppressResponse) {
        sendResponse({ success: true });
      }
      
      return false; // No necesitamos mantener el canal abierto
    } else if (message.action === 'stop') {
      console.log('Recibido comando de detención');
      
      // Establecer variables de estado
      isProcessing = false;
      isPaused = false;
      
      // Notificar a la UI
      updateStatus('Proceso detenido', 0);
      
      // Limpiar cualquier timeout pendiente
      Object.keys(state.timeouts).forEach(key => {
        clearOperationTimeout(key);
      });
      
      // Guardar el estado de detención en localStorage para persistir entre recargas
      localStorage.setItem('snap_lead_manager_process_stopped', 'true');
      localStorage.removeItem('snap_lead_manager_search_pending');
      
      // Notificar al background script de forma segura
      try {
        chrome.runtime.sendMessage({
          type: 'status_update',
          message: 'Proceso detenido por usuario',
          progress: 0,
          stopped: true,
          // Importante: Indicar que no hay perfiles
          profilesCount: 0
        }, function(response) {
          if (chrome.runtime.lastError) {
            console.warn('Error al notificar detención:', chrome.runtime.lastError);
          }
        });
      } catch (e) {
        console.error('Error al notificar detención al background:', e);
      }
      
      // También notificar al sidebar
      const iframe = document.getElementById('snap-lead-manager-iframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          action: 'process_stopped',
          message: 'Proceso detenido por usuario'
        }, '*');
      }
      
      sendResponse({ success: true, message: 'Todas las operaciones detenidas' });
      return false;
    } else if (message.action === 'update_state') {
      console.log('Actualizando estado local desde background');
      isPaused = message.isPaused;
      state.isProcessing = message.isRunning;
      updateStatus(isPaused ? 'Proceso pausado' : 'Proceso en ejecución', currentProgress);
      sendResponse({ success: true });
      return false; // Usar return false en lugar de break
    } else {
      // Respuesta por defecto para acciones desconocidas
      console.log('Acción no reconocida:', message.action);
      sendResponse({ success: false, error: 'Acción no reconocida' });
      return false; // No necesitamos mantener el canal abierto
    }
  });
} else {
  console.log('chrome.runtime.onMessage no está disponible en este contexto');
}

// Manejar desconexión de la extensión
try {
  if (chrome.runtime && chrome.runtime.onDisconnect) {
    chrome.runtime.onDisconnect.addListener(() => {
      console.log('Extensión desconectada. Limpiando estado...');
      isProcessing = false;
      currentSearchTerm = '';
      retryCount = 0;
    });
  } else {
    console.log('chrome.runtime.onDisconnect no está disponible en este contexto');
  }
} catch (error) {
  console.error('Error al configurar el listener de desconexión:', error);
}

// Función para encontrar perfiles en la página de resultados de búsqueda
async function findProfiles() {
  try {
    // Añadir al inicio de la función
    console.log('Iniciando búsqueda de perfiles para término:', currentSearchTerm);
    
    // Obtener searchData del localStorage
    const searchData = JSON.parse(localStorage.getItem('snap_lead_manager_search_data') || '{}');
    console.log('Datos de búsqueda recuperados:', searchData);
    
    console.log('Iniciando búsqueda de perfiles...');
    updateStatus('Iniciando búsqueda de perfiles...', 30);
    
    // Verificar si el proceso está detenido
    if (!isProcessing) {
      console.log('Proceso detenido, no se abrirá el perfil en nueva pestaña');
      updateStatus('Proceso detenido', 0);
      return false;
    }
    
    // Verificar si el proceso está pausado antes de continuar
    if (isPaused) {
      console.log('El proceso está pausado, esperando reanudación...');
      updateStatus('Proceso pausado. Haz clic en "Reanudar" para continuar', 30);
      return { success: false, message: 'Proceso pausado' };
    }
    
    // Esperar a que los resultados se carguen
    console.log('Esperando que se cargue el contenedor de perfiles...');
    updateStatus('Esperando que se cargue el contenedor de perfiles...', 35);
    
    // Intentar varios selectores para mayor robustez
    let feedContainer = document.querySelector(SELECTORS.PROFILE_CONTAINER);
    if (!feedContainer) {
      throw new Error('No se pudo encontrar el contenedor de perfiles después de intentar varios selectores');
    }
    
    console.log('Contenedor de perfiles encontrado:', feedContainer);
    updateStatus('Contenedor de perfiles encontrado', 40);
    
    // Dar tiempo adicional para que se carguen todos los resultados
    console.log('Esperando carga inicial de resultados...');
    updateStatus('Esperando carga inicial de resultados...', 45);
    await sleep(3000);
    
    // Función para hacer scroll para cargar más resultados
    const scrollForMoreResults = async (maxScrolls = 50) => {
      console.log(`Comenzando scroll para cargar más resultados (máximo ${maxScrolls} scrolls)...`);
      updateStatus(`Comenzando scroll para cargar más resultados (máximo ${maxScrolls} scrolls)...`, 50);
      
      let scrollCount = 0;
      let lastHeight = document.body.scrollHeight;
      let noChangeCount = 0;
      
      try {
        while (scrollCount < maxScrolls) {
          // Verificar si el proceso está pausado
          if (isPaused) {
            console.log('Scroll pausado, esperando reanudación...');
            updateStatus('Scroll pausado. Haz clic en "Reanudar" para continuar', 50 + (scrollCount / maxScrolls) * 30);
            await sleep(1000); // Esperar y verificar nuevamente
            continue; // Continuar el bucle sin incrementar el contador
          }
          
          // Hacer scroll
          window.scrollTo(0, document.body.scrollHeight);
          scrollCount++;
          
          // Esperar a que se carguen nuevos elementos
          await sleep(1000);
          
          // Verificar si la altura cambió (si se cargaron nuevos elementos)
          const newHeight = document.body.scrollHeight;
          if (newHeight === lastHeight) {
            noChangeCount++;
            
            // Si no hay cambios después de varios intentos, asumir que no hay más resultados
            if (noChangeCount >= 3) {
              console.log('No se detectaron más resultados después de varios intentos de scroll');
              updateStatus(`Scroll ${scrollCount}/${maxScrolls} completado, no hay más resultados`, 80);
              break;
            }
          } else {
            // Resetear contador si la altura cambió
            noChangeCount = 0;
            lastHeight = newHeight;
          }
          
          // Actualizar estado
          const progress = 50 + (scrollCount / maxScrolls) * 30;
          updateStatus(`Scroll ${scrollCount}/${maxScrolls} completado...`, progress);
          console.log(`Scroll ${scrollCount}/${maxScrolls} completado...`);
          
          // Notificar al background script sobre el progreso
          if (chrome.runtime && chrome.runtime.sendMessage) {
            try {
              chrome.runtime.sendMessage({
                type: 'status_update',
                message: `Scroll ${scrollCount}/${maxScrolls} completado...`,
                progress: progress,
                scrollCount: scrollCount,
                maxScrolls: maxScrolls
              });
            } catch (e) {
              console.error('Error al enviar actualización de scroll:', e);
            }
          }
        }
        
        console.log(`Scroll completado: ${scrollCount}/${maxScrolls}`);
        updateStatus(`Scroll completado: ${scrollCount}/${maxScrolls}`, 80);
        
        // Notificar que el scroll ha terminado y se debe continuar con el proceso
        notifyBackgroundOfProgress(`Scroll completado. Procesando ${scrollCount} resultados...`, 85, { 
          scrollCompleted: true,
          scrollCount: scrollCount
        });
        
        // Importante: Continuar con el procesamiento de perfiles incluso si el scroll termina temprano
        return scrollCount;
      } catch (error) {
        console.error('Error durante el scroll:', error);
        
        // Incluso en caso de error, intentar continuar con los resultados que tenemos
        notifyBackgroundOfProgress(`Error durante scroll, pero continuando con ${scrollCount} resultados...`, 80, {
          scrollCompleted: true,
          scrollCount: scrollCount,
          error: error.message
        });
        
        return scrollCount;
      }
    };
    
    // Realizar scroll para cargar más resultados
    const scrollInfo = await scrollForMoreResults();
    
    console.log(`Total de scrolls realizados: ${scrollInfo}`);
    updateStatus(`Total de scrolls realizados: ${scrollInfo}`, 65);
    
    // Asegurarse de que el proceso continúe incluso si el scroll termina temprano
    if (!isProcessing) {
      console.log('El proceso fue detenido durante el scroll, abortando búsqueda de perfiles');
      return [];
    }
    
    // Forzar la continuación del proceso
    console.log('Scroll completado, continuando con la extracción de perfiles...');
    updateStatus('Extrayendo perfiles de los resultados...', 70);
    // Obtener todos los resultados
    feedContainer = document.querySelector(SELECTORS.PROFILE_CONTAINER);
    if (!feedContainer) {
      console.error('No se encontró el contenedor de resultados');
      throw new Error('No se encontró el contenedor de resultados');
    }
    
    // Obtener los resultados dentro del contenedor
    const results = feedContainer.querySelectorAll(':scope > div');
    console.log(`Se encontraron ${results.length} resultados en bruto`);
    updateStatus(`Se encontraron ${results.length} resultados en bruto`, 75);
    
    if (results.length === 0) {
      throw new Error('No se encontraron resultados de búsqueda');
    }
    
    // Array para almacenar datos de perfiles
    const profiles = [];
    
    // Iterar sobre cada resultado para extraer información
    updateStatus('Analizando perfiles...', 70);
    let validProfilesCount = 0;
    
    console.log(`Procesando ${results.length} resultados...`);
    updateStatus(`Procesando ${results.length} resultados...`, 75);
    
    for (let i = 0; i < results.length; i++) {
      try {
        const result = results[i];
        
        // Actualizar progreso
        const extractionProgress = 75 + Math.floor((i / results.length) * 20);
        updateStatus(`Analizando perfil ${i+1}/${results.length}...`, extractionProgress);
        
        // Extraer información del perfil
        const profileInfo = await extractProfileInfo(result);
        
        if (profileInfo) {
          profiles.push(profileInfo);
          validProfilesCount++;
          
          // Log detallado para cada perfil válido
          console.log(`Perfil ${validProfilesCount} extraído:`, profileInfo.name);
        }
      } catch (error) {
        console.error(`Error al procesar resultado ${i}:`, error);
        // Continuar con el siguiente resultado
      }
    }
    
    console.log(`Extracción completada. Perfiles válidos: ${validProfilesCount}/${results.length}`);
    updateStatus(`Extracción completada. Perfiles válidos: ${validProfilesCount}/${results.length}`, 95);
    
    // Mostrar resumen completo de la búsqueda
    const searchSummary = {
      searchTerm: currentSearchTerm,
      searchLocation: searchData.location || 'No especificada',
      totalScrolls: scrollInfo,
      maxScrolls: 50, // El máximo configurado
      scrollCompleted: scrollInfo >= 50 ? 'Sí' : 'No',
      resultsFound: results.length,
      validProfiles: profiles.length,
      timestamp: new Date().toISOString()
    };
    
    console.log('Resumen de búsqueda:', searchSummary);
    
    // Crear mensaje de resumen para mostrar al usuario
    const summaryMessage = `
      Búsqueda completada:
      - Término: ${searchSummary.searchTerm}
      - Ubicación: ${searchSummary.searchLocation}
      - Scrolls realizados: ${searchSummary.totalScrolls}/${searchSummary.maxScrolls}
      - Scrolls completados: ${searchSummary.scrollCompleted}
      - Resultados encontrados: ${searchSummary.resultsFound}
      - Perfiles válidos: ${searchSummary.validProfiles}
    `;
    
    updateStatus(summaryMessage, 95);
    
    // Guardar el resumen en localStorage para referencia futura
    try {
      const savedSearches = JSON.parse(localStorage.getItem('snapLeadManager_searches') || '[]');
      savedSearches.push(searchSummary);
      localStorage.setItem('snapLeadManager_searches', JSON.stringify(savedSearches));
    } catch (error) {
      console.error('Error al guardar resumen de búsqueda:', error);
    }
    
    // Notificar al background script sobre los perfiles encontrados
    if (profiles.length > 0) {
      try {
        const response = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({
            action: 'found_profiles',
            profiles: profiles
          }, response => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(response);
            }
          });
        });
        
        console.log('Background script notificado:', response);
        
        if (chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({
            type: 'status_update',
            message: `Se encontraron ${profiles.length} perfiles`,
            progress: 95
          });
        }
      } catch (error) {
        console.error('Error al notificar perfiles al background script:', error);
      }
      
      updateStatus(`Búsqueda completada. Se encontraron ${profiles.length} perfiles`, 100);
    } else {
      throw new Error('No se encontraron perfiles válidos');
    }
    
    // Para este test, abrir el primer perfil en una nueva pestaña
    if (profiles.length > 0) {
      // Verificar si el proceso está detenido antes de abrir el perfil
      if (!isProcessing) {
        console.log('Proceso detenido, no se abrirán perfiles');
        updateStatus('Proceso detenido', 0);
        return { success: true, profiles };
      }
      
      // Mostrar mensaje antes de abrir el primer perfil
      updateStatus(`Preparando para abrir el primer perfil de ${profiles.length}...`, 98);
      await sleep(2000); // Dar tiempo para que el usuario vea el resumen
      
      try {
        await openProfileInNewTab(profiles[0].url);
      } catch (error) {
        console.error('Error al abrir el primer perfil:', error);
        // Continuar con el proceso a pesar del error al abrir el perfil
      }
    }
    
    // Al final de la función findProfiles(), después de extraer los perfiles:

    // Asegurarse de que los perfiles se envíen correctamente al background
    if (profiles.length > 0) {
      console.log(`Enviando ${profiles.length} perfiles al background script...`);
      
      // Enviar perfiles al background script
      try {
        await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({
            action: 'found_profiles',
            profiles: profiles,
            count: profiles.length,
            searchTerm: currentSearchTerm,
            searchData: JSON.parse(localStorage.getItem('snap_lead_manager_search_data') || '{}')
          }, response => {
            if (chrome.runtime.lastError) {
              console.error('Error al enviar perfiles al background:', chrome.runtime.lastError);
              reject(chrome.runtime.lastError);
            } else {
              console.log('Perfiles enviados correctamente al background:', response);
              resolve(response);
            }
          });
        });
        
        // Actualizar UI con el número correcto de perfiles
        updateStatus(`Búsqueda completada. Se encontraron ${profiles.length} perfiles`, 100);
        
        // Notificar directamente al sidebar
        const iframe = document.getElementById('snap-lead-manager-iframe');
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            action: 'update_profiles',
            profiles: profiles,
            count: profiles.length,
            searchTerm: currentSearchTerm
          }, '*');
        }
      } catch (error) {
        console.error('Error al comunicar perfiles:', error);
        // Continuar a pesar del error
      }
    } else {
      console.log('No se encontraron perfiles válidos');
      updateStatus('No se encontraron perfiles válidos', 100);
    }
    
    // En findProfiles, después de completar el proceso de extracción de perfiles:

    // Asegurarse de que los perfiles se envíen correctamente al background y sidebar
    console.log(`Búsqueda completada. Se encontraron ${profiles.length} perfiles válidos en ${scrollInfo} scrolls`);

    // Mostrar estadísticas completas
    const endTime = Date.now();
    const startTime = parseInt(localStorage.getItem('snap_lead_manager_search_start_time') || endTime);
    const duration = Math.floor((endTime - startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    const stats = {
      perfilesEncontrados: profiles.length,
      scrollsRealizados: scrollInfo,
      tiempoTotal: `${minutes}m ${seconds}s`,
      searchTerm: currentSearchTerm,
      timestamp: new Date().toLocaleTimeString()
    };

    // Guardar estadísticas para mostrarlas en el sidebar
    localStorage.setItem('snap_lead_manager_search_stats', JSON.stringify(stats));

    // Actualizar UI con estadísticas
    updateStatus(`✓ Búsqueda completada en ${stats.tiempoTotal}. Encontrados ${stats.perfilesEncontrados} perfiles en ${stats.scrollsRealizados} scrolls`, 100);
    
    // Marcar el proceso de búsqueda como completado
    console.log("Marcando el proceso de búsqueda como COMPLETADO");
    localStorage.setItem('snap_lead_manager_search_pending', 'false');
    localStorage.setItem('snap_lead_manager_search_completed', 'true');
    
    // Notificar al background que la búsqueda se ha completado
    if (chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'search_completed',
        message: `Búsqueda completada. Se encontraron ${profiles.length} perfiles en ${stats.scrollsRealizados} scrolls`,
        profiles: profiles.length,
        stats: stats
      });
    }
    
    return profiles;
  } catch (error) {
    // En caso de error, mantener isProcessing como true a menos que sea un error fatal
    console.error('Error en findProfiles:', error);
    
    // Solo cambiar isProcessing a false si es un error que no se puede recuperar
    if (error.message.includes('No se encontraron resultados') || 
        error.message.includes('excedió el tiempo límite')) {
      isProcessing = false;
    }
    
    // Manejar específicamente el error de contexto invalidado
    if (error.message.includes('Extension context invalidated')) {
      console.log('Contexto de extensión invalidado, guardando estado para recuperación...');
      
      // Guardar estado en localStorage para recuperar después
      localStorage.setItem('snap_lead_manager_recovery_needed', 'true');
      localStorage.setItem('snap_lead_manager_last_action', 'findProfiles');
      
      updateStatus('Error de conexión con la extensión. Por favor, recarga la página.', 0, true);
      return false;
    }
    
    // Otros errores
    updateStatus(`Error al buscar perfiles: ${error.message}`, 0, true);
    return false;
  }
}

// Función para abrir un perfil en una nueva pestaña
async function openProfileInNewTab(profileUrl) {
  try {
    // Al inicio de la función:
    console.log('Iniciando acción separada: abrir perfil en nueva pestaña');
    
    // Si la búsqueda está completada, no necesitamos verificar isProcessing
    const searchCompleted = localStorage.getItem('snap_lead_manager_search_completed') === 'true';
    
    if (searchCompleted) {
      console.log('La búsqueda ya se completó, continuando con apertura de perfil');
    } else if (!isProcessing) {
      console.log('Proceso detenido, no se abrirá el perfil en nueva pestaña');
      updateStatus('Proceso detenido', 0);
      return false;
    }
    
    // Resto del código existente...
    
    // Al final de la función, después de abrir el perfil:
    console.log('Perfil abierto en nueva pestaña. Acción completada.');
    
    // Actualizar el estado para indicar que ya no estamos procesando
    isProcessing = false;
    
    updateStatus('Proceso completado. Perfil abierto en nueva pestaña.', 100);
    
    return true;
  } catch (error) {
    // Código existente para manejo de errores...
  }
}

// Función para seleccionar un perfil específico
async function selectProfile(index) {
  try {
    console.log(`Seleccionando perfil con índice ${index}...`);
    
    // Obtener todos los perfiles
    const { success, profiles } = await findProfiles();
    
    if (!success || !profiles || !profiles[index]) {
      throw new Error('Perfil no encontrado');
    }
    
    const profile = profiles[index];
    console.log('Perfil seleccionado:', profile);
    
    // Hacer scroll hasta el perfil
    profile.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await sleep(1000);
    
    return {
      success: true,
      profileUrl: profile.url,
      profileName: profile.name
    };
  } catch (error) {
    console.error('Error al seleccionar perfil:', error);
    return { success: false, message: error.message };
  }
}

// Función para extraer datos del perfil
function extractProfileData(resultElement) {
  try {
    // Verificar si el resultado contiene un enlace de perfil
    const profileLink = resultElement.querySelector(SELECTORS.PROFILE_LINK);
    
    if (profileLink) {
      const profileUrl = profileLink.href;
      const profileName = profileLink.textContent.trim();
      
      // Extraer información adicional si está disponible
      let additionalInfo = '';
      const infoElements = resultElement.querySelectorAll('span');
      for (const infoEl of infoElements) {
        const text = infoEl.textContent.trim();
        if (text && text !== profileName && text.length < 100) {
          additionalInfo += text + ' ';
        }
      }
      
      // Generar un ID único para el perfil
      const profileId = `profile-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      
      // Crear objeto con datos del perfil
      return {
        id: profileId,
        name: profileName,
        url: profileUrl,
        processed: false,
        info: additionalInfo.trim(),
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('Error al extraer datos del perfil:', error);
  }
  
  return null;
}

// Función para enviar solicitud de amistad
async function sendFriendRequest() {
  try {
    console.log('Enviando solicitud de amistad...');
    
    // Esperar a que el botón de añadir amigo esté disponible
    const addFriendButton = await waitForElement(SELECTORS.ADD_FRIEND_BUTTON);
    
    // Simular clic en el botón
    addFriendButton.click();
    
    // Esperar un momento para confirmar
    await sleep(1000);
    
    return { success: true, message: 'Solicitud de amistad enviada' };
  } catch (error) {
    console.error('Error al enviar solicitud de amistad:', error);
    return { success: false, message: error.message };
  }
}

// Función para abrir Messenger
async function openMessenger() {
  try {
    console.log('Abriendo Messenger...');
    
    // Esperar a que el botón de Messenger esté disponible
    const messengerButton = await waitForElement(SELECTORS.MESSAGE_BUTTON);
    
    // Simular clic en el botón
    messengerButton.click();
    
    // Esperar a que se abra la ventana de chat
    await sleep(2000);
    
    return { success: true, message: 'Messenger abierto' };
  } catch (error) {
    console.error('Error al abrir Messenger:', error);
    return { success: false, message: error.message };
  }
}

// Función para enviar un mensaje
async function sendMessage(text) {
  try {
    console.log(`Enviando mensaje: ${text}`);
    
    if (!text) {
      return { success: false, message: 'Texto del mensaje vacío' };
    }
    
    // Esperar a que el campo de entrada esté disponible
    const messageInput = await waitForElement(SELECTORS.MESSAGE_INPUT);
    
    // Simular escritura en el campo
    messageInput.focus();
    await sleep(500);
    
    messageInput.textContent = text;
    
    // Disparar evento de input para activar el botón de envío
    messageInput.dispatchEvent(new Event('input', { bubbles: true }));
    await sleep(500);
    
    // Buscar el botón de envío
    const sendButton = document.querySelector(SELECTORS.SEND_BUTTON);
    
    if (sendButton) {
      // Si hay botón de envío, hacer clic en él
      sendButton.click();
    } else {
      // Si no hay botón, simular presionar Enter
      messageInput.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true
      }));
    }
    
    return { success: true, message: 'Mensaje enviado' };
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    return { success: false, message: error.message };
  }
}

// Función de utilidad para esperar a que un elemento esté disponible
function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }
    
    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Elemento no encontrado: ${selector}`));
    }, timeout);
  });
}

// Función de utilidad para esperar
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Función para encontrar un elemento por fragmentos de texto
function findElementByText(selectors, textFragments, exactMatch = false) {
  const elements = document.querySelectorAll(selectors);
  console.log(`Buscando entre ${elements.length} elementos con los selectores: ${selectors}`);
  
  for (const element of elements) {
    const elementText = element.textContent.toLowerCase().trim();
    
    if (exactMatch) {
      // Buscar coincidencia exacta
      if (textFragments.some(fragment => elementText === fragment.toLowerCase())) {
        console.log(`Encontrada coincidencia exacta: "${elementText}"`);
        return element;
      }
    } else {
      // Buscar coincidencia parcial
      if (textFragments.some(fragment => elementText.includes(fragment.toLowerCase()))) {
        console.log(`Encontrada coincidencia parcial: "${elementText}"`);
        return element;
      }
    }
  }
  
  console.log('No se encontraron elementos con los textos especificados');
  return null;
}

// Verificar si hay una búsqueda pendiente después de la recarga
const checkPendingSearch = async () => {
  const pendingSearch = localStorage.getItem('snap_lead_manager_search_pending');
  const searchTerm = localStorage.getItem('snap_lead_manager_search_term');
  let searchData = null;
  
  try {
    const searchDataStr = localStorage.getItem('snap_lead_manager_search_data');
    if (searchDataStr) {
      searchData = JSON.parse(searchDataStr);
    }
  } catch (e) {
    console.error('Error al parsear datos de búsqueda:', e);
  }
  
  // Recuperar el término de búsqueda para mostrar en la UI aunque la búsqueda no esté pendiente
  if (searchTerm) {
    console.log('Recuperando información de búsqueda anterior:', searchTerm);
    // Informar al sidebar sobre la búsqueda actual
    const iframe = document.getElementById('snap-lead-manager-iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        action: 'restore_search_info',
        searchTerm: searchTerm,
        searchData: searchData
      }, '*');
    }
    
    // Verificar si hay perfiles ya almacenados de una búsqueda anterior
    const storedProfiles = localStorage.getItem('snap_lead_manager_profiles');
    if (storedProfiles) {
      try {
        const profiles = JSON.parse(storedProfiles);
        if (profiles && profiles.length > 0) {
          console.log(`Recuperados ${profiles.length} perfiles de búsqueda anterior`);
          
          // Notificar al background script sobre los perfiles recuperados
          if (chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({
              action: 'found_profiles',
              profiles: profiles
            }, response => {
              console.log('Background script notificado de perfiles recuperados:', response);
            });
          }
        }
      } catch (e) {
        console.error('Error al parsear perfiles almacenados:', e);
      }
    }
  }
  
  // Si hay una búsqueda pendiente, procesarla
  if (pendingSearch === 'true' && searchTerm) {
    console.log('Detectada búsqueda pendiente después de recarga:', searchTerm);
    // Esperar a que la página se cargue completamente
    await sleep(3000);
    
    // Verificar si estamos en la página de búsqueda de personas
    const currentUrl = window.location.href;
    const isSearchPeoplePage = currentUrl.includes('/search/people');
    
    if (isSearchPeoplePage) {
      // Si tenemos datos de ciudad, aplicar filtros
      const searchDataStr = localStorage.getItem('snap_lead_manager_search_data');
      if (searchDataStr) {
        try {
          const searchData = JSON.parse(searchDataStr);
          if (searchData.city && searchData.city.trim() !== '') {
            // Aplicar filtros de búsqueda específicos (como el filtro de ciudad)
            await applySearchFilters();
            
            // Después de aplicar los filtros, buscar perfiles
            await findProfiles();
            
            // Marcar la búsqueda como completada para evitar bucles
            localStorage.setItem('snap_lead_manager_search_pending', 'false');
            localStorage.setItem('snap_lead_manager_search_completed', 'true');
            
            // Actualizar el estado en la UI
            updateStatus('Búsqueda completada', 100);
            return;
          }
        } catch (e) {
          console.error('Error al procesar datos de búsqueda:', e);
          // Marcar la búsqueda como no pendiente para evitar bucles infinitos
          localStorage.setItem('snap_lead_manager_search_pending', 'false');
        }
      }
      
      // Si no hay datos de ciudad o hubo un error, proceder con la búsqueda normal
      await findProfiles();
      
      // Marcar la búsqueda como completada para evitar bucles
      localStorage.setItem('snap_lead_manager_search_pending', 'false');
      localStorage.setItem('snap_lead_manager_search_completed', 'true');
      
      // Actualizar el estado en la UI
      updateStatus('Búsqueda completada', 100);
    } else {
      // Si no estamos en una página de búsqueda, redirigir
      await performSearch(searchTerm, searchData);
    }
  }
};

// Función para inicializar el content script
const initialize = async () => {
  console.log('Inicializando content script...');
  
  // Verificar si estamos en Facebook
  if (!window.location.hostname.includes('facebook.com')) {
    console.log('Esta página no es Facebook, no se iniciará el content script');
    return;
  }
  
  console.log('Detectada página de Facebook, iniciando Snap Lead Manager');
  
  // Verificar primero si la extensión fue detenida explícitamente
  if (chrome.runtime && chrome.runtime.sendMessage) {
    chrome.storage.local.get(['extension_stopped'], function(result) {
      if (result.extension_stopped === true) {
        console.log('La extensión fue detenida explícitamente. No se reanudarán acciones.');
        // No continuar con ninguna acción pendiente
        
        // Limpiar datos de búsqueda pendientes
        localStorage.removeItem('snap_lead_manager_search_pending');
        localStorage.removeItem('snap_lead_manager_city_filter_applied');
        
        // Se puede inyectar el sidebar pero sin reanudar acciones
        injectSidebar();
        
        return;
      } else {
        // Si no fue detenida, continuar con la inicialización normal
        continueInitialization();
      }
    });
  } else {
    // Si no podemos verificar el estado, continuar normalmente
    continueInitialization();
  }
};

// Función para continuar con la inicialización normal
const continueInitialization = () => {
  // Verificar si debemos restaurar el sidebar desde el background script
  if (chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({ action: 'restore_sidebar' }, (response) => {
      // Si el sidebar estaba abierto en la sesión anterior, restaurarlo
      if (response && response.sidebarOpen) {
        console.log('Restaurando el sidebar según estado anterior');
        injectSidebar({ collapsed: false });
      } else {
        // Si no hay información previa, inyectar el sidebar normalmente
        injectSidebar();
      }
    });
  } else {
    // Si no podemos comunicarnos con el background, inyectar el sidebar normalmente
    injectSidebar();
  }
  
  // Suscribirse a la creación/actualización de DOM
  const observer = new MutationObserver((mutations) => {
    // Procesar mutaciones si es necesario para detectar cambios en la UI de Facebook
    // ...
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Comprobar si hay una búsqueda pendiente
  checkPendingSearch();
};

// Iniciar content script cuando se carga la página
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Inyectar sidebar después de que el DOM esté completamente cargado
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    injectSidebar();
  });
} else {
  injectSidebar();
}

// Reintentar inyección después de 2 segundos si no funciona inmediatamente
setTimeout(() => {
  if (!document.getElementById('snap-lead-manager-overlay')) {
    console.log('Reintentando inyección del sidebar...');
    injectSidebar();
  }
  
  // Sincronizar información de búsqueda con el sidebar
  const searchTerm = localStorage.getItem('snap_lead_manager_search_term');
  const searchDataStr = localStorage.getItem('snap_lead_manager_search_data');
  const fullQuery = localStorage.getItem('snap_lead_manager_full_query');
  
  if (searchTerm) {
    let searchData = null;
    try {
      if (searchDataStr) {
        searchData = JSON.parse(searchDataStr);
      }
    } catch (e) {
      console.error('Error al parsear datos de búsqueda:', e);
    }
    
    // Informar al sidebar sobre la búsqueda actual
    const iframe = document.getElementById('snap-lead-manager-iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'restore_search_info',
        searchTerm: searchTerm,
        searchData: searchData,
        fullQuery: fullQuery
      }, '*');
    }
  }
}, 2000);

// Función para manejar la acción de detener y limpiar todos los estados
function handleStopAction() {
  console.log('Deteniendo todas las operaciones...');
  
  // Limpiar todos los timeouts
  for (const timeout in state.timeouts) {
    clearTimeout(state.timeouts[timeout]);
    delete state.timeouts[timeout];
  }
  
  // Restablecer estado de procesamiento
  isProcessing = false;
  state.isProcessing = false;
  
  // Limpiar datos de búsqueda
  localStorage.removeItem('snap_lead_manager_search_term');
  localStorage.removeItem('snap_lead_manager_search_data');
  localStorage.removeItem('snap_lead_manager_full_query');
  localStorage.removeItem('snap_lead_manager_search_pending');
  localStorage.removeItem('snap_lead_manager_city_filter_applied');
  
  // Limpiar perfiles almacenados
  localStorage.removeItem('snap_lead_manager_profiles');
  
  // Notificar al background script sobre la detención de operaciones
  if (chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({
      type: 'status_update',
      isRunning: false,
      isPaused: false,
      progress: 0,
      message: 'Proceso detenido',
      suppressResponse: true  // Evitar respuestas en bucle
    });
  }
  
  console.log('Todas las operaciones detenidas y estado limpiado');
}

// Función para aplicar el filtro de ciudad
async function applyCityFilter() {
  try {
    console.log('Verificando si se debe aplicar filtro de ciudad...');
    
    // Verificar si ya se aplicó el filtro
    const cityFilterApplied = localStorage.getItem('snap_lead_manager_city_filter_applied') === 'true';
    if (cityFilterApplied) {
      console.log('El filtro de ciudad ya está aplicado, continuando...');
      updateStatus('El filtro de ciudad ya está aplicado, continuando...', 35);
      
      // Iniciar automáticamente la búsqueda de perfiles
      console.log('Iniciando búsqueda de perfiles después de verificar filtro de ciudad...');
      findProfiles().catch(error => {
        console.error('Error al buscar perfiles después de verificar filtro de ciudad:', error);
      });
      
      return { success: true, message: 'El filtro de ciudad ya estaba aplicado' };
    }
    
    // Obtener datos de búsqueda del localStorage
    const searchDataStr = localStorage.getItem('snap_lead_manager_search_data');
    if (!searchDataStr) {
      console.log('No hay datos de búsqueda en localStorage');
      localStorage.setItem('snap_lead_manager_city_filter_applied', 'true');
      return { success: false, message: 'No hay datos de búsqueda disponibles' };
    }
    
    const searchData = JSON.parse(searchDataStr);
    
    // Verificar si hay una ciudad especificada en los datos de búsqueda
    if (!searchData || !searchData.city || searchData.city.trim() === '') {
      console.log('No hay ciudad especificada en los datos de búsqueda');
      localStorage.setItem('snap_lead_manager_city_filter_applied', 'true');
      return { success: true, message: 'No hay ciudad para filtrar' };
    }
    
    // Marcar que estamos aplicando el filtro
    localStorage.setItem('snap_lead_manager_city_filter_applied', 'false');
    
    updateStatus('Aplicando filtro de ciudad...', 20);
    console.log('Comenzando a aplicar filtro de ciudad:', searchData.city);
    
    // Establecer un timeout para continuar con el proceso incluso si no se puede aplicar el filtro
    const filterTimeout = setTimeout(() => {
      console.log('Tiempo de espera agotado para el filtro de ciudad. Continuando con el proceso...');
      localStorage.setItem('snap_lead_manager_city_filter_applied', 'true');
      updateStatus('Continuando sin filtro de ciudad debido a timeout', 40);
      // No es necesario hacer nada más aquí, el código continuará después del try/catch
    }, 30000); // Aumentamos el timeout a 30 segundos para dar más tiempo
    
    // Esperar a que se cargue completamente la página de resultados
    await sleep(3000);
    
    // ENFOQUE MEJORADO PARA SELECCIONAR ESPECÍFICAMENTE EL PRIMER ELEMENTO DEL LISTBOX
    console.log('Aplicando filtro de ciudad con enfoque mejorado...');
    
    // 1. Buscar el input de ciudad específicamente con los selectores proporcionados
    console.log('Buscando input de ciudad...');
    let cityInput = document.querySelector('input[aria-label="Ciudad"][role="combobox"][placeholder="Ciudad"]');
    
    if (!cityInput) {
      console.log('No se encontró el input de ciudad con el selector exacto, intentando alternativas...');
      
      // Probar con múltiples selectores alternativos basados en el HTML proporcionado
      const alternativeSelectors = [
        'input[placeholder="Ciudad"]',
        'input[aria-label="Ciudad"]',
        'input.x1i10hfl[role="combobox"]',
        'div.x1n2onr6 > input',
        'input[role="combobox"][type="search"]'
      ];
      
      for (const selector of alternativeSelectors) {
        const input = document.querySelector(selector);
        if (input) {
          console.log(`Input de ciudad encontrado con selector alternativo: ${selector}`);
          cityInput = input;
          break;
        }
      }
      
      if (!cityInput) {
        console.error('No se pudo encontrar el input de ciudad con ningún selector');
        clearTimeout(filterTimeout);
        localStorage.setItem('snap_lead_manager_city_filter_applied', 'true');
        updateStatus('No se pudo encontrar el campo de ciudad, continuando sin filtro', 40);
        return { success: false, message: 'No se pudo encontrar el campo de ciudad' };
      }
    }
    
    console.log('Campo de entrada para ciudad encontrado:', cityInput);
    
    // 2. Focus y establecer el valor directamente
    cityInput.focus();
    await sleep(500);
    
    // 3. Establecer el valor directamente sin usar simulateTyping
    console.log('Estableciendo la ciudad directamente:', searchData.city);
    cityInput.value = searchData.city;
    cityInput.dispatchEvent(new Event('input', { bubbles: true }));
    cityInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Verificar que el texto se haya establecido correctamente
    console.log('Valor actual del input después de establecer:', cityInput.value);
    if (cityInput.value !== searchData.city) {
      console.warn('El valor no se estableció correctamente. Intentando método alternativo...');
      // Método alternativo: usar execCommand
      cityInput.select();
      document.execCommand('insertText', false, searchData.city);
      await sleep(500);
    }
    
    // 4. Esperar a que aparezcan las sugerencias
    console.log('Esperando a que aparezcan las sugerencias...');
    await sleep(3000);
    
    // 5. Verificar que el listbox de sugerencias esté visible
    let listbox = null;
    let listboxFound = false;
    
    // Intentar encontrar el listbox con diferentes selectores
    const listboxSelectors = [
      'ul[role="listbox"]',
      'div.x1y1aw1k ul',
      'ul.x1iyjqo2',
      'div[role="dialog"] ul',
      'div[role="menu"] ul',
      'div.x78zum5 ul',
      'div.x1n2onr6 ul',
      'ul.x6s0dn4',
      'ul.x1jx94hy',
      'div[aria-expanded="true"] ul'
    ];
    
    for (const selector of listboxSelectors) {
      const possibleListbox = document.querySelector(selector);
      if (possibleListbox && possibleListbox.offsetParent !== null) { // Verificar que sea visible
        console.log(`Listbox encontrado con selector: ${selector}`);
        listbox = possibleListbox;
        listboxFound = true;
        break;
      }
    }
    
    if (!listboxFound) {
      console.log('No se encontró el listbox de sugerencias. Intentando activarlo...');
      
      // Intentar activar el listbox con teclas de flecha
      cityInput.focus();
      await sleep(500);
      
      // Presionar tecla de flecha abajo varias veces
      for (let i = 0; i < 3; i++) {
        cityInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        await sleep(500);
        
        // Verificar si apareció el listbox después de cada intento
        for (const selector of listboxSelectors) {
          const visibleListbox = document.querySelector(selector);
          if (visibleListbox && visibleListbox.offsetParent !== null) {
            console.log(`Listbox encontrado después de presionar flecha abajo (intento ${i+1}) con selector: ${selector}`);
            listbox = visibleListbox;
            listboxFound = true;
            break;
          }
        }
        
        if (listboxFound) break;
      }
      
      // Si aún no encontramos el listbox, intentamos con más eventos
      if (!listboxFound) {
        console.log('Intentando activar el listbox con más eventos...');
        
        // Simular clic en el input
        cityInput.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await sleep(1000);
        
        // Verificar nuevamente
        for (const selector of listboxSelectors) {
          const visibleListbox = document.querySelector(selector);
          if (visibleListbox && visibleListbox.offsetParent !== null) {
            console.log(`Listbox encontrado después de eventos adicionales con selector: ${selector}`);
            listbox = visibleListbox;
            listboxFound = true;
            break;
          }
        }
      }
    }
    
    // Si encontramos el listbox, intentamos seleccionar la primera opción
    if (listboxFound && listbox) {
      console.log('Listbox encontrado, intentando seleccionar la primera opción...');
      
      // Obtener todas las opciones del listbox con selectores más amplios
      const options = listbox.querySelectorAll('li[role="option"], li[aria-selected="false"]');
      console.log(`Encontradas ${options.length} opciones en el listbox`);
      
      if (options.length > 0) {
        // Obtener la primera opción
        const firstOption = options[0];
        console.log('Primera opción encontrada:', firstOption.textContent.trim());
        
        // Intentar hacer clic en la primera opción con múltiples estrategias
        console.log('Haciendo clic en la primera opción...');
        
        // Estrategia 1: Buscar y hacer clic en el div clickeable dentro del li
        try {
          // Buscar el div clickeable con la clase x1i10hfl (según el HTML proporcionado)
          const clickableDiv = firstOption.querySelector('div.x1i10hfl');
          if (clickableDiv) {
            console.log('Elemento div.x1i10hfl encontrado, haciendo clic en él');
            clickableDiv.click();
          } else {
            console.log('No se encontró div.x1i10hfl, intentando clic directo en el li');
            firstOption.click();
          }
          console.log('Click directo ejecutado en la primera opción');
        } catch (e) {
          console.error('Error al hacer click directo:', e);
        }
        
        // Estrategia 2: Eventos de mouse más completos
        try {
          firstOption.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
          await sleep(300);
          firstOption.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
          await sleep(300);
          firstOption.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
          await sleep(300);
          firstOption.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          console.log('Eventos de mouse ejecutados en la primera opción');
        } catch (e) {
          console.error('Error al disparar eventos de mouse:', e);
        }
        
        // Estrategia 3: Usar teclas de flecha y Enter
        if (!document.querySelector('ul[role="listbox"]')?.offsetParent) {
          console.log('El listbox ya no está visible después de eventos de mouse');
          clearTimeout(filterTimeout);
          localStorage.setItem('snap_lead_manager_city_filter_applied', 'true');
          updateStatus('Filtro de ciudad aplicado, cargando resultados...', 40);
          await sleep(3000);
          return { success: true, message: 'Filtro de ciudad aplicado con eventos de mouse' };
        }
        
        // Estrategia 4: Simular tecla Tab y luego Enter
        cityInput.focus();
        await sleep(500);
        cityInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
        await sleep(1000);
        cityInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        await sleep(2000);
        
        // Verificar una última vez
        if (!document.querySelector('ul[role="listbox"]')?.offsetParent) {
          console.log('El listbox ya no está visible después del método de respaldo final');
          clearTimeout(filterTimeout);
          localStorage.setItem('snap_lead_manager_city_filter_applied', 'true');
          updateStatus('Filtro de ciudad aplicado, cargando resultados...', 40);
          await sleep(3000);
          return { success: true, message: 'Filtro de ciudad aplicado con método de respaldo final' };
        }
      }
    }
    
    // Verificar si el filtro se aplicó correctamente
    console.log('Verificando si el filtro se aplicó correctamente...');
    
    // Esperar a que se actualice la UI después de seleccionar la ciudad
    await sleep(3000);
    
    // Verificar si hay algún indicador visual de que se aplicó el filtro
    const filterIndicators = document.querySelectorAll('.x1i10hfl, .x1qjc9v5, .xjbqb8w');
    let filterApplied = false;
    
    for (const indicator of filterIndicators) {
      if (indicator.textContent.includes(searchData.city)) {
        console.log('Indicador visual encontrado de que el filtro se aplicó:', indicator.textContent);
        filterApplied = true;
        break;
      }
    }
    
    if (filterApplied || !document.querySelector('ul[role="listbox"]')?.offsetParent) {
      console.log('Filtro de ciudad aplicado con éxito');
      clearTimeout(filterTimeout);
      
      // Actualizar el estado del filtro
      updateFilterStatus(true);
      
      updateStatus('Filtro de ciudad aplicado, cargando resultados...', 40);
      
      // Iniciar automáticamente la búsqueda de perfiles
      console.log('Iniciando búsqueda de perfiles después de aplicar filtro de ciudad...');
      findProfiles().catch(error => {
        console.error('Error al buscar perfiles después de aplicar filtro de ciudad:', error);
      });
      
      // Marcar explícitamente que el filtro se ha aplicado
      localStorage.setItem('snap_lead_manager_city_filter_applied', 'true');
      
      // Notificar al sidebar sobre el cambio de estado
      const iframe = document.getElementById('snap-lead-manager-iframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'filter_applied',
          success: true,
          message: 'Filtro de ciudad aplicado correctamente'
        }, '*');
      }
      
      // También notificar al background script
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          type: 'status_update',
          message: 'Filtro de ciudad aplicado correctamente',
          progress: 40,
          filterApplied: true
        });
      }
      
      // Mejora en la función applyCityFilter para asegurar que continúe con findProfiles
      // Añadir hacia el final de la función applyCityFilter, justo después de aplicar el filtro exitosamente:

      localStorage.setItem('snap_lead_manager_city_filter_applied', 'true');
      updateStatus('Filtro de ciudad aplicado, iniciando búsqueda de perfiles...', 45);

      // Iniciar explícitamente findProfiles con un pequeño retraso para asegurar que se carguen los resultados
      setTimeout(() => {
        isProcessing = true; // Asegurarse de que isProcessing sea true
        console.log('Iniciando búsqueda de perfiles después de aplicar filtro...');
        
        // Guardar el tiempo de inicio antes de realizar la búsqueda
        localStorage.setItem('snap_lead_manager_search_start_time', Date.now().toString());
        
        findProfiles()
          .then(profiles => {
            if (profiles && profiles.length > 0) {
              console.log(`Búsqueda completada con éxito. Se encontraron ${profiles.length} perfiles`);
              
              // Mostrar resumen con estadísticas
              const endTime = Date.now();
              const startTime = parseInt(localStorage.getItem('snap_lead_manager_search_start_time') || endTime);
              const duration = Math.floor((endTime - startTime) / 1000);
              const minutes = Math.floor(duration / 60);
              const seconds = duration % 60;

              const stats = {
                perfilesEncontrados: profiles.length,
                scrollsRealizados: 50, // El máximo configurado
                tiempoTotal: `${minutes}m ${seconds}s`,
                searchTerm: currentSearchTerm,
                timestamp: new Date().toLocaleTimeString()
              };

              // Guardar estadísticas para mostrarlas en el sidebar
              localStorage.setItem('snap_lead_manager_search_stats', JSON.stringify(stats));

              // Actualizar UI con estadísticas
              updateStatus(`✓ Búsqueda completada en ${stats.tiempoTotal}. Encontrados ${stats.perfilesEncontrados} perfiles en ${stats.scrollsRealizados} scrolls`, 100);
            }
          })
          .catch(error => {
            console.error('Error en búsqueda de perfiles:', error);
          });
      }, 2000);
      
      return { success: true, message: 'Filtro de ciudad aplicado con éxito' };
    }
    
    // Si llegamos hasta aquí, intentamos un último método de respaldo
    console.log('Intentando método de respaldo final...');
    
    // Método de respaldo: simular tecla Tab y luego Enter
    cityInput.focus();
    await sleep(500);
    cityInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    await sleep(1000);
    cityInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await sleep(2000);
    
    // Verificar una última vez
    if (!document.querySelector('ul[role="listbox"]')?.offsetParent) {
      console.log('El listbox ya no está visible después del método de respaldo final');
      clearTimeout(filterTimeout);
      localStorage.setItem('snap_lead_manager_city_filter_applied', 'true');
      updateStatus('Filtro de ciudad aplicado, cargando resultados...', 40);
      await sleep(3000);
      return { success: true, message: 'Filtro de ciudad aplicado con método de respaldo final' };
    }
    
    // Si todo falla, marcamos como aplicado para continuar con el proceso
    console.log('No se pudo aplicar el filtro de ciudad después de múltiples intentos');
    clearTimeout(filterTimeout);
    localStorage.setItem('snap_lead_manager_city_filter_applied', 'true');
    updateStatus('No se pudo aplicar el filtro de ciudad, continuando sin filtro', 40);
    
    // Iniciar automáticamente la búsqueda de perfiles cuando el filtro falla
    console.log('Iniciando búsqueda de perfiles a pesar de fallo en filtro de ciudad...');
    findProfiles().catch(error => {
      console.error('Error al buscar perfiles después de fallo en filtro de ciudad:', error);
    });
    
    return { success: false, message: 'No se pudo aplicar el filtro de ciudad, pero continuamos el proceso' };
  } catch (error) {
    console.error('Error al aplicar filtro de ciudad:', error);
    updateStatus('Error al aplicar filtro de ciudad, continuando sin filtro', 40);
    localStorage.setItem('snap_lead_manager_city_filter_applied', 'true');
    return { success: false, error: error.message };
  }
}

// Función para simular la escritura en un campo de texto
async function simulateTyping(element, text) {
  console.log(`Simulando escritura de: "${text}" en elemento:`, element);
  
  // Enfocar el elemento primero
  element.focus();
  
  // Limpiar el campo si tiene contenido - MÉTODO MEJORADO
  console.log('Valor actual antes de limpiar:', element.value);
  
  // Método 1: Establecer valor vacío
  element.value = '';
  element.dispatchEvent(new Event('input', { bubbles: true }));
  
  // Método 2: Seleccionar todo el texto y eliminarlo
  element.select();
  document.execCommand('delete');
  
  // Método 3: Simular Control+A y luego Delete
  element.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', ctrlKey: true, bubbles: true }));
  element.dispatchEvent(new KeyboardEvent('keyup', { key: 'a', ctrlKey: true, bubbles: true }));
  element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
  element.dispatchEvent(new KeyboardEvent('keyup', { key: 'Delete', bubbles: true }));
  
  // Verificar que el campo esté vacío
  console.log('Valor después de limpiar:', element.value);
  if (element.value !== '') {
    console.warn('El campo no se limpió correctamente. Intentando método alternativo...');
    
    // Método alternativo: Simular Backspace múltiples veces
    const currentLength = element.value.length;
    for (let i = 0; i < currentLength; i++) {
      element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
      element.dispatchEvent(new KeyboardEvent('keyup', { key: 'Backspace', bubbles: true }));
      // Actualizar manualmente el valor
      element.value = element.value.slice(0, -1);
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
  
  await sleep(500);
  
  // Verificar nuevamente antes de escribir
  if (element.value !== '') {
    console.error('No se pudo limpiar el campo. Estableciendo valor directamente.');
    element.value = text;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
  
  // Escribir el texto caracter por caracter
  console.log('Comenzando a escribir texto:', text);
  for (let i = 0; i < text.length; i++) {
    // Agregar el caracter actual al valor del elemento
    element.value += text[i];
    
    // Disparar eventos para simular una escritura real
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keydown', { key: text[i], bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keypress', { key: text[i], bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keyup', { key: text[i], bubbles: true }));
    
    // Pequeña pausa entre cada caracter para simular escritura humana
    await sleep(50);
  }
  
  // Disparar evento change al finalizar
  element.dispatchEvent(new Event('change', { bubbles: true }));
  
  // Verificar el valor final
  console.log(`Escritura completada. Valor final: "${element.value}"`);
  if (element.value !== text) {
    console.warn(`El valor final (${element.value}) no coincide con el texto deseado (${text})`);
  }
  
  await sleep(500);
  
  return true;
}

// Función para actualizar el estado del filtro en el sidebar
function updateFilterStatus(applied = true) {
  // Actualizar localStorage
  localStorage.setItem('snap_lead_manager_city_filter_applied', applied ? 'true' : 'false');
  
  // Enviar mensaje al iframe del sidebar
  const iframe = document.getElementById('snap-lead-manager-iframe');
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage({
      action: 'filter_status_update',
      filterApplied: applied,
      message: applied ? 'Filtro de ciudad aplicado correctamente' : 'Filtro de ciudad pendiente de aplicar'
    }, '*');
  }
  
  // También notificar al background script
  if (chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({
      type: 'filter_status_update',
      filterApplied: applied,
      message: applied ? 'Filtro de ciudad aplicado correctamente' : 'Filtro de ciudad pendiente de aplicar'
    });
  }
}

// Modificar la función que envía mensajes al background para manejar errores de contexto invalidado
let lastNotificationMessage = '';
let lastNotificationTime = 0;
function notifyBackgroundOfProgress(message, progress, data = {}) {
  // Evitar enviar el mismo mensaje repetidamente en un corto período de tiempo
  const now = Date.now();
  if (message === lastNotificationMessage && (now - lastNotificationTime) < 2000) {
    return; // No enviar el mismo mensaje más de una vez cada 2 segundos
  }
  
  // Actualizar el último mensaje y tiempo
  lastNotificationMessage = message;
  lastNotificationTime = now;
  
  if (chrome.runtime && chrome.runtime.sendMessage) {
    try {
      chrome.runtime.sendMessage({
        type: 'status_update',
        message: message,
        progress: progress,
        ...data
      }, function(response) {
        // Verificar si hay un error de contexto invalidado
        if (chrome.runtime.lastError) {
          // Solo registrar errores de contexto invalidado una vez
          if (chrome.runtime.lastError.message.includes('Extension context invalidated')) {
            // Guardar estado en localStorage para recuperarlo después
            localStorage.setItem('snap_lead_manager_last_status', JSON.stringify({
              message: message,
              progress: progress,
              data: data,
              timestamp: Date.now()
            }));
          }
        }
      });
    } catch (e) {
      // No registrar errores repetitivos de comunicación
    }
  }
}

// Usar esta función en lugar de las llamadas directas a chrome.runtime.sendMessage

// Añadir al inicio del script (después de las declaraciones de variables)
// Verificar si el proceso estaba detenido al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  const wasStopped = localStorage.getItem('snap_lead_manager_process_stopped') === 'true';
  
  if (wasStopped) {
    console.log('El proceso estaba detenido, manteniendo estado detenido');
    isProcessing = false;
    isPaused = false;
    updateStatus('Proceso detenido', 0);
  } else {
    // Verificar si hay una búsqueda pendiente
    const searchPending = localStorage.getItem('snap_lead_manager_search_pending') === 'true';
    
    if (searchPending) {
      console.log('Hay una búsqueda pendiente, verificando si debemos continuar...');
      
      // Aquí podrías implementar lógica para preguntar al usuario si desea continuar
      // o continuar automáticamente
    }
  }
});

// Añadir esta función justo antes o después de findProfiles()

// Función para extraer información de un perfil (actualizada)
async function extractProfileInfo(resultElement) {
  try {
    // Selector específico para los enlaces que contienen nombres de perfiles en Facebook
    // Este selector busca enlaces con los atributos específicos que has mostrado
    const profileLink = resultElement.querySelector('a[aria-hidden="true"][role="presentation"][tabindex="-1"]');
    
    if (!profileLink) {
      console.log('No se encontró enlace de perfil con el selector específico');
      
      // Selector alternativo más genérico como respaldo
      const alternativeProfileLink = resultElement.querySelector('a[href*="facebook.com/"]:not([href*="search"])');
      if (!alternativeProfileLink) {
        console.log('No se encontró enlace de perfil con selector alternativo');
        return null;
      }
      
      return processProfileLink(alternativeProfileLink);
    }
    
    return processProfileLink(profileLink);
  } catch (error) {
    console.error('Error al extraer información del perfil:', error);
    return null;
  }
}

// Función auxiliar para procesar el enlace del perfil
function processProfileLink(profileLink) {
  // Extraer URL y limpiarla
  let profileUrl = profileLink.href || '';
  if (profileUrl.includes('?')) {
    profileUrl = profileUrl.split('?')[0];
  }
  
  if (!profileUrl || !profileUrl.includes('facebook.com')) {
    console.log('URL de perfil no válida:', profileUrl);
    return null;
  }
  
  // Extraer nombre directamente del texto del enlace
  // Este es el cambio principal - obtenemos el texto directamente del enlace
  const name = profileLink.textContent.trim();
  console.log('Nombre extraído correctamente:', name);
  
  // Crear objeto de perfil
  const profileInfo = {
    name: name,
    url: profileUrl,
    processed: false,
    timestamp: Date.now()
  };
  
  console.log('Perfil extraído completo:', profileInfo);
  return profileInfo;
}
