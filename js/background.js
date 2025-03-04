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
  console.log('Background recibió mensaje:', message);
  
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
  } else if (message.action === 'search') {
    console.log('Recibida solicitud de búsqueda en background:', message.searchTerm);
    
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
  }
  
  // Si no manejamos el mensaje específicamente, enviar respuesta genérica
  if (!message.action && !message.type) {
    sendResponse({ success: false, error: 'Mensaje no reconocido' });
  }
  
  return true; // Mantener el puerto abierto para respuesta asíncrona
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
    
    // Restaurar el sidebar si estaba abierto
    if (state.sidebarOpen) {
      chrome.tabs.sendMessage(tabId, { 
        action: 'restore_sidebar',
        searchTerm: state.currentSearchTerm,
        searchData: state.searchData
      });
    }
    
    // Si estábamos en medio de una búsqueda y se recargó la página,
    // intentar aplicar los filtros nuevamente
    if (state.isRunning && state.searchData && state.searchData.city) {
      setTimeout(() => {
        chrome.tabs.sendMessage(tabId, { 
          action: 'apply_filters'
        });
      }, 2000); // Esperar a que la página termine de cargar
    }
  }
});

// Función para manejar la búsqueda
async function handleSearch(searchTerm, searchData, tabId, sendResponse) {
  if (!searchTerm) {
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
  sendResponse({ success: true });
}

// Función para detener el proceso
function handleStop(sendResponse) {
  if (!state.isRunning) {
    sendResponse({ success: false, message: 'No hay proceso en ejecución' });
    return;
  }
  
  state.isRunning = false;
  state.isPaused = false;
  state.progress = 0;
  state.profilesQueue = [];
  state.currentProfileIndex = 0;
  
  updateStatus('Proceso detenido', 0);
  sendResponse({ success: true });
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
      finished: !state.isRunning
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
function updateAllTabs() {
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
