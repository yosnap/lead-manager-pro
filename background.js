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
  popupWindowId: null  // Para mantener referencia a la ventana del popup
};

// Listener para mensajes
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Manejar diferentes acciones
  switch (message.action) {
    case 'search':
      handleSearch(message.searchTerm, sendResponse);
      break;
    case 'start':
      handleStart(sendResponse);
      break;
    case 'pause':
      handlePause(sendResponse);
      break;
    case 'stop':
      handleStop(sendResponse);
      break;
    case 'get_status':
      sendResponse({
        isRunning: state.isRunning,
        isPaused: state.isPaused,
        message: state.statusMessage,
        progress: state.progress
      });
      break;
    case 'register_popup':
      // Registrar la ventana del popup para mantenerla abierta
      if (sender.tab) {
        state.popupWindowId = sender.tab.windowId;
      }
      sendResponse({ success: true });
      break;
  }
  
  // Devolver true para indicar que se manejará de forma asíncrona
  return true;
});

// Función para manejar la búsqueda
function handleSearch(searchTerm, sendResponse) {
  if (!searchTerm) {
    sendResponse({ success: false, message: 'Término de búsqueda vacío' });
    return;
  }
  
  state.currentSearchTerm = searchTerm;
  
  // En lugar de crear una nueva pestaña, abriremos una ventana independiente
  // para mantener el popup abierto
  chrome.windows.create({
    url: `https://www.facebook.com/search/people/?q=${encodeURIComponent(searchTerm)}`,
    type: 'normal',
    width: 1200,
    height: 800
  }, window => {
    if (chrome.runtime.lastError) {
      sendResponse({ success: false, message: chrome.runtime.lastError.message });
      return;
    }
    
    state.currentTabId = window.tabs[0].id;
    updateStatus('Búsqueda iniciada en Facebook', 10);
    sendResponse({ success: true });
  });
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
  // Por ahora, solo simulamos el proceso
  simulateProcess();
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
  
  // Si hay una pestaña abierta, cerrarla
  if (state.currentTabId) {
    chrome.tabs.remove(state.currentTabId, () => {
      state.currentTabId = null;
    });
  }
  
  updateStatus('Proceso detenido', 0);
  sendResponse({ success: true });
}

// Función para actualizar el estado y notificar al popup
function updateStatus(message, progress = null) {
  state.statusMessage = message;
  
  if (progress !== null) {
    state.progress = progress;
  }
  
  // Notificar al popup sobre el cambio de estado
  chrome.runtime.sendMessage({
    type: 'status_update',
    message: state.statusMessage,
    progress: state.progress,
    finished: !state.isRunning
  });
}

// Función para simular el proceso (para desarrollo)
function simulateProcess() {
  let steps = [
    { message: 'Buscando perfiles...', progress: 30 },
    { message: 'Analizando resultados...', progress: 50 },
    { message: 'Seleccionando perfiles...', progress: 70 },
    { message: 'Proceso completado', progress: 100 }
  ];
  
  let currentStep = 0;
  
  function processNextStep() {
    if (!state.isRunning || currentStep >= steps.length) {
      if (state.isRunning) {
        state.isRunning = false;
        updateStatus('Proceso completado', 100);
      }
      return;
    }
    
    if (state.isPaused) {
      // Si está pausado, esperar y verificar nuevamente
      setTimeout(processNextStep, 1000);
      return;
    }
    
    // Procesar el paso actual
    let step = steps[currentStep];
    updateStatus(step.message, step.progress);
    
    // Avanzar al siguiente paso después de un retraso
    currentStep++;
    setTimeout(processNextStep, 2000);
  }
  
  // Iniciar la simulación
  processNextStep();
}
