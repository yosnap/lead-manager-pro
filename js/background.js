// Estado global
let state = {
  isRunning: false,
  isPaused: false,
  currentSearchTerm: '',
  progress: 0,
  statusMessage: 'Listo para comenzar',
  currentTabId: null,
  profilesQueue: [],
  currentProfileIndex: 0,
  wasInterrupted: false,
  lastOperation: null,
  searchData: null, // Para almacenar datos adicionales de búsqueda (término, ciudad, etc.)
  sidebarOpen: false, // Estado del sidebar (abierto/cerrado)
  lastError: null
};

// Manejador de mensajes
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background recibió mensaje:', message, 'de:', sender);
  
  let requestHandled = false; // Flag para verificar si se manejó la solicitud
  
  // Manejar diferentes tipos de mensajes
  if (message.type === 'status_update') {
    // Actualizar información de estado (utilizada para UI)
    state.statusMessage = message.message || 'Estado desconocido';
    state.isRunning = !message.finished; // Si está finalizado, no está corriendo
    state.progress = message.progress || 0;
    state.lastError = message.error ? message.message : null;
    
    // Enviar actualización a todas las pestañas abiertas
    updateAllTabs();
    sendResponse({ success: true });
    requestHandled = true;
  } else if (message.action === 'search') {
    console.log('Procesando acción de búsqueda con término:', message.searchTerm);
    
    // Limpiar el flag de detención cuando se inicia una nueva búsqueda
    chrome.storage.local.remove(['extension_stopped'], function() {
      console.log('Flag de detención limpiado para nueva búsqueda');
    });
    
    // Guardar información de búsqueda
    state.currentSearchTerm = message.searchTerm;
    state.searchData = message.searchData || {};
    
    // Guardar en el storage para persistir entre sesiones
    chrome.storage.local.set({
      currentSearchTerm: message.searchTerm,
      searchData: message.searchData || {}
    });
    
    // Enviar la solicitud de búsqueda a la pestaña activa
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        console.log('Enviando solicitud de búsqueda a la pestaña activa:', tabs[0].id);
        
        try {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'search',
            searchTerm: message.searchTerm,
            searchData: message.searchData
          }, function(response) {
            console.log('Respuesta recibida de la pestaña:', response);
            
            // Comprobar si hay un error de runtime (puede ocurrir si la pestaña se cerró o se desconectó)
            if (chrome.runtime.lastError) {
              console.error('Error al enviar mensaje a la pestaña:', chrome.runtime.lastError);
              sendResponse({ 
                success: false, 
                error: 'Error de comunicación: ' + chrome.runtime.lastError.message 
              });
              return;
            }
            
            // Enviar la respuesta recibida o un error si no hay respuesta
            if (response) {
              sendResponse(response);
            } else {
              sendResponse({ success: false, error: 'No se recibió respuesta de la pestaña' });
            }
          });
        } catch (error) {
          console.error('Error al enviar mensaje a la pestaña:', error);
          sendResponse({ success: false, error: 'Error al enviar mensaje: ' + error.message });
        }
      } else {
        console.error('No hay pestañas activas');
        sendResponse({ success: false, error: 'No hay pestañas activas' });
      }
    });
    
    return true; // Mantener el puerto abierto para respuesta asíncrona
  } else if (message.action === 'start') {
    // Iniciar proceso
    console.log('Background: Iniciando proceso');
    state.isRunning = true;
    state.isPaused = false;
    
    // Enviar mensaje a la pestaña activa
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'start'
        }, function(response) {
          console.log('Respuesta de la pestaña a start:', response);
        });
      }
    });
    
    // Actualizar estado
    state.statusMessage = 'Proceso iniciado';
    broadcastStatusUpdate();
    
    sendResponse({ success: true });
    return false;
  } else if (message.action === 'pause') {
    // Pausar/reanudar proceso
    console.log('Background: Pausando/reanudando proceso');
    state.isPaused = !state.isPaused;
    
    // Enviar mensaje a la pestaña activa
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'pause',
          isPaused: state.isPaused
        }, function(response) {
          console.log('Respuesta de la pestaña a pause:', response);
        });
      }
    });
    
    // Actualizar estado
    state.statusMessage = state.isPaused ? 'Proceso pausado' : 'Proceso reanudado';
    broadcastStatusUpdate();
    
    // Notificar a todas las pestañas sobre el cambio de estado
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.url && tab.url.includes('facebook.com')) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'update_state',
            isPaused: state.isPaused,
            isRunning: state.isRunning
          }).catch(err => console.log(`Error al enviar mensaje a pestaña ${tab.id}:`, err));
        }
      });
    });
    
    sendResponse({ success: true });
    return false;
  } else if (message.action === 'stop') {
    console.log('Recibida solicitud de detención en background');
    
    // Manejar la solicitud de detención
    handleStop(sendResponse);
    
    // Indicar que se manejará la respuesta de forma asíncrona
    requestHandled = true;
    return true; // Mantener el canal abierto para respuesta asíncrona
  } else if (message.action === 'toggle_sidebar') {
    // Cambiar estado de visibilidad del sidebar
    toggleSidebar(message.visible);
    sendResponse({ success: true, visible: state.sidebarVisible });
  } else if (message.action === 'get_state') {
    // Devolver el estado actual
    sendResponse({
      currentSearchTerm: state.currentSearchTerm,
      searchData: state.searchData,
      wasInterrupted: state.isRunning,
      lastOperation: state.lastOperation,
      progress: state.progress,
      statusMessage: state.statusMessage
    });
  } else if (message.action === 'update_profiles') {
    // Actualizar perfiles encontrados
    state.profiles = message.profiles || [];
    sendResponse({ success: true });
  } else if (message.action === 'get_profiles') {
    // Devolver los perfiles guardados
    sendResponse({ success: true, profiles: state.profiles });
  } else if (message.action === 'get_status') {
    // Devolver información de estado
    sendResponse({
      isRunning: state.isRunning,
      isPaused: state.isPaused,
      message: state.statusMessage,
      progress: state.progress,
      error: state.lastError
    });
  } else if (message.action === 'apply_filters') {
    // Solicitar aplicar filtros en la pestaña actual
    console.log('Recibida solicitud para aplicar filtros');
    
    // Verificar si tenemos datos de búsqueda almacenados
    if (!state.searchData || !state.searchData.city) {
      console.warn('No hay datos de ciudad para aplicar filtros');
      
      // Intentar recuperar datos del storage local
      chrome.storage.local.get(['searchData'], async (result) => {
        const searchData = result.searchData || {};
        
        if (!searchData.city) {
          console.error('No se encontraron datos de ciudad en storage');
          sendResponse({ 
            success: false, 
            error: 'No hay datos de ciudad disponibles para aplicar filtros' 
          });
          return;
        }
        
        // Actualizar el estado con los datos recuperados
        state.searchData = searchData;
        console.log('Datos de búsqueda recuperados del storage:', searchData);
        
        // Ahora que tenemos los datos, intentar aplicar los filtros
        applyFiltersToActiveTab(sendResponse);
      });
      
      return true; // Mantener el puerto abierto para respuesta asíncrona
    }
    
    // Si ya tenemos los datos, proceder directamente
    applyFiltersToActiveTab(sendResponse);
    return true; // Mantener el puerto abierto para respuesta asíncrona
  } else if (message.action === 'open_profile') {
    console.log('Recibida solicitud para abrir perfil en nueva pestaña:', message.profileUrl);
    
    if (!message.profileUrl) {
      console.error('Error: No se proporcionó URL del perfil');
      sendResponse({
        success: false,
        error: 'No se proporcionó URL del perfil'
      });
      return false;
    }
    
    try {
      // Guardar información para indicar que esta apertura de pestaña es para un perfil
      // y no debe iniciar automáticamente una búsqueda
      chrome.storage.local.set({
        opening_profile: true,
        profile_url: message.profileUrl,
        search_should_not_auto_start: true
      }, () => {
        console.log('Marcado que la próxima pestaña es para un perfil y no debe iniciar búsqueda automáticamente');
      });
      
      // Abrir el perfil en una nueva pestaña
      chrome.tabs.create({ url: message.profileUrl }, (tab) => {
        if (chrome.runtime.lastError) {
          console.error('Error al crear nueva pestaña:', chrome.runtime.lastError);
          sendResponse({
            success: false,
            error: 'Error al crear nueva pestaña: ' + chrome.runtime.lastError.message
          });
          return;
        }
        
        if (!tab) {
          console.error('Error: No se pudo crear la pestaña');
          sendResponse({
            success: false,
            error: 'No se pudo crear la pestaña'
          });
          return;
        }
        
        console.log('Pestaña creada con ID:', tab.id);
        
        // Guardar el ID de la pestaña para referencia futura
        state.currentProfileTabId = tab.id;
        
        // Actualizar el contador de perfiles procesados
        state.profilesProcessed = (state.profilesProcessed || 0) + 1;
        
        // Notificar que se ha abierto un nuevo perfil
        broadcastMessage({
          type: 'profile_opened',
          tabId: tab.id,
          url: message.profileUrl,
          profilesProcessed: state.profilesProcessed
        });
        
        sendResponse({ 
          success: true, 
          tabId: tab.id,
          profilesProcessed: state.profilesProcessed
        });
      });
    } catch (error) {
      console.error('Error al abrir perfil en nueva pestaña:', error);
      sendResponse({ 
        success: false, 
        error: 'Error al abrir perfil: ' + error.message 
      });
    }
    
    return true; // Mantener el puerto abierto para respuesta asíncrona
  } else if (message.action === 'open_sidebar_window') {
    console.log('Recibida solicitud para abrir sidebar en ventana separada');
    
    // Verificar si ya hay una ventana de sidebar abierta
    chrome.windows.getAll({ populate: true }, (windows) => {
      let sidebarWindowExists = false;
      const sidebarURL = chrome.runtime.getURL('sidebar.html');
      
      // Buscar si ya existe una ventana con el sidebar
      for (const window of windows) {
        for (const tab of window.tabs) {
          if (tab.url === sidebarURL) {
            // Si existe, enfocarla
            chrome.windows.update(window.id, { focused: true });
            sidebarWindowExists = true;
            sendResponse({ success: true, windowId: window.id, alreadyOpen: true });
            break;
          }
        }
        if (sidebarWindowExists) break;
      }
      
      // Si no existe, crear una nueva ventana con el sidebar
      if (!sidebarWindowExists) {
        const width = 400;
        const height = 600;
        const left = (screen.width - width) / 2;
        const top = (screen.height - height) / 2;
        
        chrome.windows.create({
          url: sidebarURL,
          type: 'popup',
          width: width,
          height: height,
          left: Math.round(left),
          top: Math.round(top)
        }, (window) => {
          console.log('Ventana de sidebar creada con ID:', window.id);
          sendResponse({ success: true, windowId: window.id, alreadyOpen: false });
        });
      }
    });
    
    return true; // Mantener el puerto abierto para respuesta asíncrona
  }
  
  // Si no se reconoce la acción, proporcionar un mensaje de error más detallado
  if (!requestHandled) {
    console.warn('Acción no reconocida:', message.action || message.type, 'Mensaje completo:', message);
    sendResponse({ 
      success: false, 
      error: `Acción no reconocida: ${message.action || message.type}. Verifique que el formato del mensaje sea correcto.` 
    });
  }

  return true; // Siempre mantener puerto abierto para respuestas asíncronas
});

// Listener para eventos de navegación para restaurar el sidebar si es necesario
chrome.webNavigation.onDOMContentLoaded.addListener(async (details) => {
  // Solo procesar eventos para el frame principal
  if (details.frameId !== 0) return;
  
  // Verificar si la URL es de Facebook search o una página de Facebook que podríamos necesitar
  if (details.url.includes('facebook.com')) {
    console.log('Página de Facebook cargada, verificando si necesitamos restaurar el sidebar');
    
    try {
      const { sidebarVisible } = await chrome.storage.local.get('sidebarVisible');
      
      // Solo restaurar si el sidebar estaba visible
      if (sidebarVisible) {
        console.log('Sidebar estaba visible, restaurando...');
        
        // Obtener información de búsqueda guardada
        const { currentSearchTerm, searchData } = await chrome.storage.local.get(['currentSearchTerm', 'searchData']);
        
        // Enviar mensaje a la página para restaurar el sidebar
        try {
          await chrome.tabs.sendMessage(details.tabId, {
            action: 'restore_sidebar',
            searchTerm: currentSearchTerm || '',
            searchData: searchData || {}
          });
          console.log('Mensaje enviado para restaurar sidebar');
          
          // Si estamos en una página de resultados de búsqueda y hay datos de ciudad,
          // también aplicar los filtros automáticamente después de un breve retraso
          if (details.url.includes('/search/') && searchData && searchData.city) {
            // Esperar un momento para asegurarse de que la página ha cargado completamente
            setTimeout(async () => {
              try {
                console.log('Aplicando filtros de ciudad automáticamente después de restaurar sidebar');
                await chrome.tabs.sendMessage(details.tabId, {
                  action: 'apply_filters'
                });
              } catch (error) {
                console.error('Error al aplicar filtros de ciudad automáticamente:', error);
              }
            }, 5000); // Esperar 5 segundos para aplicar filtros
          }
        } catch (error) {
          console.error('Error al enviar mensaje para restaurar sidebar:', error);
          
          // Si hay un error (ej. content script no está listo), intentar inyectar el script
          // y volver a intentar después de un breve retraso
          if (error.message.includes('Could not establish connection') || 
              error.message.includes('The message port closed')) {
            console.log('Content script no está listo, inyectando y reintentando...');
            
            // Inyectar el content script
            await chrome.scripting.executeScript({
              target: { tabId: details.tabId },
              files: ['js/content.js']
            });
            
            // Esperar un momento y volver a intentar
            setTimeout(async () => {
              try {
                await chrome.tabs.sendMessage(details.tabId, {
                  action: 'restore_sidebar',
                  searchTerm: currentSearchTerm || '',
                  searchData: searchData || {}
                });
                console.log('Sidebar restaurado después de reinyectar script');
                
                // Aplicar filtros si es necesario
                if (details.url.includes('/search/') && searchData && searchData.city) {
                  setTimeout(async () => {
                    try {
                      console.log('Aplicando filtros después de reinyectar');
                      await chrome.tabs.sendMessage(details.tabId, {
                        action: 'apply_filters'
                      });
                    } catch (e) {
                      console.error('Error al aplicar filtros después de reinyectar:', e);
                    }
                  }, 3000);
                }
              } catch (retryError) {
                console.error('Error al reintentar restaurar sidebar:', retryError);
              }
            }, 2000);
          }
        }
      }
    } catch (error) {
      console.error('Error al verificar/restaurar el sidebar:', error);
    }
  }
});

// Listener para cambios de pestaña
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Verificar si la página ha terminado de cargar y es una URL de Facebook
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('facebook.com')) {
    state.currentTabId = tabId;
    
    // Verificar si esta pestaña es para ver un perfil y no debe iniciar búsqueda automáticamente
    chrome.storage.local.get(['opening_profile', 'search_should_not_auto_start'], (data) => {
      const isOpeningProfile = data.opening_profile === true;
      const shouldNotAutoStart = data.search_should_not_auto_start === true;
      
      console.log('Estado al cargar pestaña:', {
        isOpeningProfile,
        shouldNotAutoStart,
        url: tab.url
      });
      
      // Restaurar el sidebar si estaba abierto
      if (state.sidebarOpen) {
        chrome.tabs.sendMessage(tabId, { 
          action: 'restore_sidebar',
          searchTerm: state.currentSearchTerm,
          searchData: state.searchData,
          isProfileView: isOpeningProfile,
          shouldNotAutoStart: shouldNotAutoStart
        });
      }
      
      // Si estábamos en medio de una búsqueda y se recargó la página,
      // intentar aplicar los filtros nuevamente - SOLO si no es una vista de perfil
      if (state.isRunning && state.searchData && state.searchData.city && !isOpeningProfile && !shouldNotAutoStart) {
        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, { 
            action: 'apply_filters'
          });
        }, 2000); // Esperar a que la página termine de cargar
      }
      
      // Si era una apertura de perfil, limpiar el flag después de usarlo
      if (isOpeningProfile) {
        chrome.storage.local.remove(['opening_profile', 'search_should_not_auto_start'], () => {
          console.log('Flags de apertura de perfil limpiados');
        });
      }
    });
  }
});

// Listener para el clic en el icono de la extensión
chrome.action.onClicked.addListener((tab) => {
  console.log('Clic en el icono de la extensión detectado');
  
  // Verificar si estamos en Facebook
  if (tab.url && tab.url.includes('facebook.com')) {
    // Enviar mensaje al content script para mostrar el sidebar
    chrome.tabs.sendMessage(tab.id, { action: 'toggle_sidebar' }, (response) => {
      // Si hay un error (por ejemplo, content script no cargado), inyectar el script
      if (chrome.runtime.lastError) {
        console.log('Error al enviar mensaje al content script:', chrome.runtime.lastError);
        
        // Inyectar el content script si no está cargado
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['js/content.js']
        }, () => {
          // Intentar nuevamente después de inyectar el script
          setTimeout(() => {
            chrome.tabs.sendMessage(tab.id, { action: 'toggle_sidebar' });
          }, 500);
        });
      }
    });
  } else {
    // Si no estamos en Facebook, abrir Facebook en una nueva pestaña
    chrome.tabs.create({ url: 'https://www.facebook.com/' }, (newTab) => {
      // Esperar a que la página cargue y luego mostrar el sidebar
      chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo, tab) {
        if (tabId === newTab.id && changeInfo.status === 'complete') {
          // Eliminar este listener para evitar múltiples ejecuciones
          chrome.tabs.onUpdated.removeListener(listener);
          
          // Esperar un poco más para asegurar que todo esté cargado
          setTimeout(() => {
            chrome.tabs.sendMessage(tabId, { action: 'toggle_sidebar' });
          }, 1000);
        }
      });
    });
  }
});

// Función para manejar la búsqueda
async function handleSearch(currentSearchTerm, searchData, tabId, sendResponse) {
  if (!currentSearchTerm) {
    sendResponse({ success: false, message: 'Término de búsqueda vacío' });
    return;
  }
  
  try {
    state.currentSearchTerm = searchTerm;
    state.currentTabId = tabId;
    state.searchData = searchData || null;
    state.sidebarOpen = true; // Abrir sidebar al iniciar búsqueda
    
    // Enviar mensaje al content script para realizar la búsqueda
    const response = await chrome.tabs.sendMessage(tabId, {
      action: 'search',
      searchTerm: searchTerm,
      searchData: searchData
    });
    
    if (response && response.success) {
      updateStatus('Búsqueda iniciada en Facebook', 10);
      sendResponse({ success: true });
    } else {
      throw new Error(response?.message || 'Error al realizar la búsqueda');
    }
  } catch (error) {
    console.error('Error en handleSearch:', error);
    updateStatus('Error: ' + error.message, 0);
    sendResponse({ success: false, message: error.message });
  }
}

// Función para iniciar el proceso
function handleStart(sendResponse) {
  if (state.isRunning) {
    sendResponse({ success: false, message: 'El proceso ya está en ejecución' });
    return;
  }
  
  state.isRunning = true;
  state.isPaused = false;
  
  updateStatus('Proceso iniciado', 20);
  sendResponse({ success: true });
  
  // Aquí se iniciaría el proceso de análisis de perfiles
  processProfiles();
}

// Función para pausar el proceso
function handlePause(sendResponse) {
  if (!state.isRunning || state.isPaused) {
    sendResponse({ success: false, message: 'No se puede pausar el proceso' });
    return;
  }
  
  state.isPaused = true;
  updateStatus('Proceso pausado');
  
  // Notificar a todas las pestañas sobre el cambio de estado
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.url && tab.url.includes('facebook.com')) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'update_state',
          isPaused: state.isPaused,
          isRunning: state.isRunning
        }).catch(err => console.log(`Error al enviar mensaje a pestaña ${tab.id}:`, err));
      }
    });
  });
  
  sendResponse({ success: true });
}

// Función para detener el proceso
function handleStop(sendResponse) {
  if (!state.isRunning) {
    console.log('No hay proceso en ejecución para detener');
    sendResponse({ success: false, message: 'No hay proceso en ejecución' });
    return;
  }
  
  console.log('Deteniendo proceso en background script');
  
  // Actualizar estado local
  state.isRunning = false;
  state.isPaused = false;
  state.progress = 0;
  state.profilesQueue = [];
  state.currentProfileIndex = 0;
  
  // Guardar estado de detención en storage para persistir entre recargas
  chrome.storage.local.set({
    'extension_stopped': true,
    'extension_running': false,
    'extension_paused': false
  }, function() {
    console.log('Estado de detención guardado en storage');
  });
  
  // Notificar a todas las pestañas abiertas
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.url && tab.url.includes('facebook.com')) {
        try {
          chrome.tabs.sendMessage(tab.id, {
            action: 'stop',
            suppressResponse: true // Evitar ciclos de respuesta
          }, function(response) {
            if (chrome.runtime.lastError) {
              console.log(`Error al enviar mensaje de detención a pestaña ${tab.id}:`, chrome.runtime.lastError);
            } else {
              console.log(`Mensaje de detención enviado a pestaña ${tab.id}:`, response);
            }
          });
        } catch (e) {
          console.error(`Error al enviar mensaje de detención a pestaña ${tab.id}:`, e);
        }
      }
    });
  });
  
  updateStatus('Proceso detenido', 0);
  sendResponse({ success: true, message: 'Proceso detenido correctamente' });
}

// Función para manejar perfiles encontrados
function handleFoundProfiles(profiles, tabId, sendResponse) {
  console.log(`Recibidos ${profiles.length} perfiles del content script`);
  
  // Almacenar los perfiles en el estado
  state.profilesQueue = profiles;
  state.currentProfileIndex = 0;
  
  // Actualizar el estado y notificar
  updateStatus(`Encontrados ${profiles.length} perfiles`, 30);
  
  // Notificar a todas las pestañas sobre los nuevos perfiles
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.url && tab.url.includes('facebook.com')) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'update_profiles',
          profiles: profiles
        });
      }
    });
  });
  
  sendResponse({ success: true });
}

// Función para procesar perfiles
async function processProfiles() {
  if (!state.isRunning || state.isPaused || !state.currentTabId) {
    console.log('Proceso no puede continuar:', { 
      isRunning: state.isRunning, 
      isPaused: state.isPaused, 
      hasTabId: !!state.currentTabId 
    });
    return;
  }
  
  try {
    console.log('Iniciando procesamiento de perfiles...');
    
    // Encontrar perfiles en la página actual
    console.log('Solicitando búsqueda de perfiles al content script...');
    const response = await chrome.tabs.sendMessage(state.currentTabId, {
      action: 'find_profiles'
    });
    
    console.log('Respuesta de búsqueda de perfiles:', response);
    
    if (response.success && response.profiles && response.profiles.length > 0) {
      state.profilesQueue = response.profiles;
      state.currentProfileIndex = 0;
      updateStatus(`Encontrados ${response.profiles.length} perfiles`, 30);
      
      // Procesar el primer perfil
      console.log('Iniciando procesamiento del primer perfil...');
      await processNextProfile();
    } else {
      console.log('No se encontraron perfiles para procesar');
      updateStatus(response.message || 'No se encontraron perfiles', 0);
      state.isRunning = false;
    }
  } catch (error) {
    console.error('Error al procesar perfiles:', error);
    updateStatus('Error al procesar perfiles: ' + error.message, 0);
    state.isRunning = false;
  }
}

// Función para procesar el siguiente perfil
async function processNextProfile() {
  if (!state.isRunning || state.isPaused || state.currentProfileIndex >= state.profilesQueue.length) {
    console.log('Verificación de continuidad:', {
      isRunning: state.isRunning,
      isPaused: state.isPaused,
      currentIndex: state.currentProfileIndex,
      totalProfiles: state.profilesQueue.length
    });
    
    if (!state.isRunning) {
      updateStatus('Proceso detenido', 0);
    } else if (state.isPaused) {
      updateStatus('Proceso en pausa');
    } else if (state.currentProfileIndex >= state.profilesQueue.length) {
      updateStatus('Procesamiento de perfiles completado', 100);
      state.isRunning = false;
    }
    
    return;
  }
  
  try {
    const profile = state.profilesQueue[state.currentProfileIndex];
    updateStatus(`Procesando perfil ${state.currentProfileIndex + 1} de ${state.profilesQueue.length}`, 
                 30 + (70 * state.currentProfileIndex / state.profilesQueue.length));
    
    console.log('Procesando perfil:', profile);
    
    // Aquí iría la lógica de procesamiento de cada perfil
    await sleep(1000); // Simular procesamiento
    
    // Incrementar el índice para el siguiente perfil
    state.currentProfileIndex++;
    
    // Procesar el siguiente perfil
    await processNextProfile();
  } catch (error) {
    console.error('Error al procesar perfil:', error);
    updateStatus('Error al procesar perfil: ' + error.message);
    
    // Incrementar el índice y continuar con el siguiente
    state.currentProfileIndex++;
    await processNextProfile();
  }
}

// Función de utilidad para esperar
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Inicialización
console.log('Snap Lead Manager background script cargado');

// Función para enviar actualización a todas las pestañas abiertas
// Añadimos una variable para controlar la frecuencia de actualizaciones
let lastUpdateTime = 0;
const UPDATE_THROTTLE_MS = 500; // Limitar actualizaciones a una cada 500ms

function updateAllTabs() {
  const now = Date.now();
  
  // Evitar actualizaciones demasiado frecuentes para romper bucles infinitos
  if (now - lastUpdateTime < UPDATE_THROTTLE_MS) {
    console.log('Actualización de pestañas throttled para evitar bucle');
    return;
  }
  
  lastUpdateTime = now;
  
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.url && tab.url.includes('facebook.com')) {
        try {
          chrome.tabs.sendMessage(tab.id, {
            type: 'status_update',
            message: state.statusMessage,
            progress: state.progress,
            finished: !state.isRunning,
            // Añadir flag para evitar que el receptor responda con otro mensaje de estado
            suppressResponse: true
          });
        } catch (e) {
          console.log(`Error al enviar mensaje a pestaña ${tab.id}:`, e);
        }
      }
    });
  });
}

// Función para cambiar el estado del sidebar
function toggleSidebar(visible) {
  state.sidebarVisible = visible;
  chrome.storage.local.set({ sidebarVisible: visible });
}

// Función para aplicar filtros a la pestaña activa
function applyFiltersToActiveTab(sendResponse) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) {
      console.error('No hay pestañas activas para aplicar filtros');
      sendResponse({ success: false, error: 'No hay pestañas activas' });
      return;
    }
    
    const activeTab = tabs[0];
    
    // Verificar que estamos en una página de Facebook
    if (!activeTab.url || !activeTab.url.includes('facebook.com')) {
      console.error('La pestaña activa no es una página de Facebook');
      sendResponse({ 
        success: false, 
        error: 'La pestaña activa no es una página de Facebook' 
      });
      return;
    }
    
    console.log('Enviando mensaje para aplicar filtros a la pestaña:', activeTab.id);
    
    // Enviar el mensaje para aplicar filtros
    chrome.tabs.sendMessage(activeTab.id, {
      action: 'apply_filters'
    }, function(response) {
      console.log('Respuesta de aplicar filtros:', response);
      sendResponse(response || { success: false, error: 'No se recibió respuesta de la pestaña' });
    });
  });
}

// Función para enviar actualización de estado a todas las pestañas
function broadcastStatusUpdate() {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.url && tab.url.includes('facebook.com')) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'status_update',
          message: state.statusMessage,
          progress: state.progress,
          finished: !state.isRunning
        });
      }
    });
  });
}

// Función para actualizar el estado y notificar
function updateStatus(message, progress = null) {
  state.statusMessage = message;
  
  if (progress !== null) {
    state.progress = progress;
  }
  
  // Notificar al content script sobre el cambio de estado
  if (state.currentTabId) {
    chrome.tabs.sendMessage(state.currentTabId, {
      type: 'status_update',
      message: state.statusMessage,
      progress: state.progress,
      finished: !state.isRunning,
      suppressResponse: true // Evitar ciclos de respuesta
    });
  }
}

// Función para manejar perfiles encontrados
function handleFoundProfiles(profiles, tabId, sendResponse) {
  console.log(`Recibidos ${profiles.length} perfiles del content script`);
  
  // Almacenar los perfiles en el estado
  state.profilesQueue = profiles;
  state.currentProfileIndex = 0;
  
  // Actualizar el estado y notificar
  updateStatus(`Encontrados ${profiles.length} perfiles`, 30);
  
  // Notificar a todas las pestañas sobre los nuevos perfiles
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.url && tab.url.includes('facebook.com')) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'update_profiles',
          profiles: profiles
        });
      }
    });
  });
  
  sendResponse({ success: true });
}
