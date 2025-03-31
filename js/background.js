// Estado global
let state = {
  isRunning: false,
  isPaused: false,
  currentSearchTerm: '',
  progress: 0,
  statusMessage: 'Listo para comenzar',
  currentTabId: null,
  profiles: []
};

// Inicialización - Establecer estado inicial
chrome.storage.local.set({
  'extension_running': false,
  'extension_stopped': false,
  'extension_paused': false
});

// Manejador de mensajes
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'status_update') {
    // Actualizar información de estado (utilizada para UI)
    state.statusMessage = message.message || 'Estado desconocido';
    state.isRunning = !message.finished; // Si está finalizado, no está corriendo
    state.progress = message.progress || 0;
    
    // Enviar actualización a todas las pestañas abiertas
    updateAllTabs();
    sendResponse({ success: true });
    return false;
  } else if (message.action === 'search' || message.action === 'find_profiles') {
    // Corregir action para usar un nombre estándar
    const actionType = 'find_profiles';
    
    // Verificar si la búsqueda fue iniciada explícitamente por el usuario
    const isUserInitiated = message.searchData && (message.searchData.userInitiated === true);
    
    if (!isUserInitiated) {
      console.log('Background: Búsqueda no iniciada por usuario, bloqueando.');
      sendResponse({ 
        success: false, 
        error: 'Las búsquedas deben ser iniciadas explícitamente por el usuario mediante el botón Buscar' 
      });
      return true;
    }
    
    console.log('Background: Iniciando búsqueda con datos:', message.searchData);
    
    // Limpiar el flag de detención cuando se inicia una nueva búsqueda
    chrome.storage.local.remove(['extension_stopped'], function() {});
    
    // Extraer los datos de búsqueda correctamente
    const searchTerm = message.searchData.term || message.searchTerm || '';
    
    // Guardar información de búsqueda
    state.currentSearchTerm = searchTerm;
    state.searchData = message.searchData || {};
    state.isRunning = true; // Marcar el proceso como en ejecución
    
    // Guardar en el storage para persistir entre sesiones
    chrome.storage.local.set({
      currentSearchTerm: searchTerm,
      searchData: message.searchData || {},
      extension_running: true,
      extension_stopped: false
    });
    
    // Enviar la solicitud de búsqueda a la pestaña activa
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        try {
          console.log(`Background: Enviando mensaje de búsqueda a pestaña ${tabs[0].id}`);
          
          chrome.tabs.sendMessage(tabs[0].id, {
            action: actionType,
            searchData: message.searchData
          }, function(response) {
            // Comprobar si hay un error de runtime
            if (chrome.runtime.lastError) {
              console.error('Background: Error al comunicarse con content script:', chrome.runtime.lastError);
              sendResponse({ 
                success: false, 
                error: 'Error de comunicación: ' + chrome.runtime.lastError.message 
              });
              return;
            }
            
            console.log('Background: Respuesta de content script:', response);
            
            // Enviar respuesta inmediata
            sendResponse({ success: true, message: 'Búsqueda iniciada' });
            
            // Actualizar estado global
            updateStatus(`Búsqueda de ${message.searchData.type === 'people' ? 'personas' : 'grupos'} iniciada en Facebook`, 10);
          });
        } catch (error) {
          console.error('Background: Error al enviar mensaje:', error);
          sendResponse({ success: false, error: 'Error al enviar mensaje: ' + error.message });
        }
      } else {
        console.error('Background: No hay pestañas activas');
        sendResponse({ success: false, error: 'No hay pestañas activas' });
      }
    });
    
    return true; // Mantener el puerto abierto para respuesta asíncrona
  } else if (message.action === 'start') {
    // Iniciar proceso
    state.isRunning = true;
    state.isPaused = false;
    
    // Actualizar estado
    state.statusMessage = 'Proceso iniciado';
    broadcastStatusUpdate();
    
    sendResponse({ success: true });
    return false;
  } else if (message.action === 'pause') {
    // Pausar/reanudar proceso
    state.isPaused = !state.isPaused;
    
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
          }).catch(() => {});
        }
      });
    });
    
    sendResponse({ success: true });
    return false;
  } else if (message.action === 'stop' || message.action === 'emergency_stop') {
    // Detener inmediatamente
    state.isRunning = false;
    state.isPaused = false;
    state.progress = 0;
    
    // Guardar estado de detención en storage
    chrome.storage.local.set({
      'extension_stopped': true,
      'extension_running': false,
      'extension_paused': false
    });
    
    // Notificar a todas las pestañas
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.url && tab.url.includes('facebook.com')) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'stop',
            stopAllTypes: true
          }).catch(() => {});
        }
      });
    });
    
    updateStatus('Proceso detenido', 0);
    sendResponse({ success: true, message: 'Proceso detenido correctamente' });
    return false;
  } else if (message.type === 'search_completed') {
    // Manejar notificación de búsqueda completada
    state.isRunning = false;
    state.isPaused = false;
    state.progress = 100;
    state.statusMessage = 'Búsqueda finalizada';
    
    // Notificar a todas las pestañas
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.url && tab.url.includes('facebook.com')) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'status_update',
            message: 'Búsqueda finalizada',
            progress: 100,
            finished: true
          }).catch(() => {});
        }
      });
    });
    
    // Guardar estado en storage
    chrome.storage.local.set({
      'extension_running': false,
      'extension_paused': false
    });
    
    sendResponse({ success: true, message: 'Estado actualizado a búsqueda finalizada' });
    return false;
  } else if (message.action === 'get_state') {
    // Devolver el estado actual
    sendResponse({
      currentSearchTerm: state.currentSearchTerm,
      searchData: state.searchData,
      isRunning: state.isRunning,
      isPaused: state.isPaused,
      progress: state.progress,
      statusMessage: state.statusMessage
    });
    return false;
  } else if (message.action === 'get_profiles') {
    // Devolver los perfiles guardados
    sendResponse({ success: true, profiles: state.profiles });
    return false;
  } else if (message.action === 'get_status') {
    // Devolver información de estado
    sendResponse({
      isRunning: state.isRunning,
      isPaused: state.isPaused,
      message: state.statusMessage,
      progress: state.progress
    });
    return false;
  } else if (message.action === 'found_profiles') {
    // Guardar los perfiles encontrados
    state.profiles = message.profiles || [];
    
    // Notificar a todas las pestañas sobre los nuevos perfiles
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.url && tab.url.includes('facebook.com')) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'update_profiles',
            profiles: state.profiles
          }).catch(() => {});
        }
      });
    });
    
    sendResponse({ success: true });
    return false;
  } else {
    // Respuesta por defecto para acciones desconocidas
    sendResponse({ success: false, error: 'Acción no reconocida' });
    return false;
  }
});

// Función para enviar actualización a todas las pestañas abiertas
// Limitamos la frecuencia de actualizaciones
let lastUpdateTime = 0;
const UPDATE_THROTTLE_MS = 500; // Limitar actualizaciones a una cada 500ms

function updateAllTabs() {
  const now = Date.now();
  
  // Evitar actualizaciones demasiado frecuentes para romper bucles infinitos
  if (now - lastUpdateTime < UPDATE_THROTTLE_MS) {
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
            profiles: state.profiles,
            suppressResponse: true
          });
        } catch (e) {}
      }
    });
  });
}

// Listener para cuando una pestaña termine de cargar
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('facebook.com/search/')) {
    // Si hemos cargado una página de búsqueda y tenemos estado de ejecución activo
    if (state.isRunning) {
      // Enviar mensaje para aplicar filtros y buscar perfiles
      setTimeout(() => {
        chrome.tabs.sendMessage(tabId, {
          action: 'apply_filters'
        });
      }, 2000); // Dar tiempo para que la página cargue completamente
    }
  }
});

// Función para actualizar el estado y notificar
function updateStatus(message, progress = null) {
  state.statusMessage = message;
  
  if (progress !== null) {
    state.progress = progress;
  }
  
  // Si el mensaje es sobre detención, asegurarnos de actualizar los flags correctamente
  if (message.includes('detenido') || message.includes('Proceso detenido')) {
    state.isRunning = false;
    state.progress = 0;
    
    // Actualizar el storage
    chrome.storage.local.set({
      'extension_running': false,
      'extension_stopped': true,
      'extension_paused': false
    });
  }
  
  // Notificar a las pestañas
  updateAllTabs();
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

// Listener para eventos de instalación
chrome.runtime.onInstalled.addListener(() => {
  // Establecer estado inicial
  state.isRunning = false;
  state.isPaused = false;
  
  chrome.storage.local.set({
    'extension_running': false,
    'extension_stopped': false,
    'extension_paused': false
  });
});
