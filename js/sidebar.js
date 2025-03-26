// Estado global
let state = {
  isRunning: false,
  isPaused: false,
  profiles: [],
  progress: 0,
  statusMessage: 'Listo',
  currentSearchTerm: '',
  currentSearchCity: '',
  searchStartTime: null,
  logEntries: [], // Almacenar entradas de log para el scroll y los perfiles
  restored: false  // Indicador de si el estado fue restaurado
};

// Referencias a elementos del DOM
let searchTermInput;
let searchCityInput;
let searchButton;
let pauseButton;
let stopButton;
let statusMessage;
let progressBar;
let searchResultsList;
let currentSearchInfo;
let openWindowButton; // Mantenemos solo esta referencia

// Referencias a elementos de UI detallada
let searchStatusContainer;
let detailedStatusMessage;
let detailedProgressBar;
let progressPercentage;
let currentOperation;
let elapsedTime;
let scrollLogContainer;
let resultsSummary;

// Funciones de utilidad
function formatTime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function addLogEntry(message, isError = false) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const entry = {
    time: timeStr,
    message: message,
    isError: isError,
    timestamp: now.getTime()
  };
  
  // Agregar la entrada al estado
  state.logEntries.push(entry);
  
  // Limitar a 50 entradas para evitar consumo excesivo de memoria
  if (state.logEntries.length > 50) {
    state.logEntries.shift();
  }
  
  // Actualizar la UI
  updateScrollLog();
}

function updateScrollLog() {
  if (!scrollLogContainer) return;
  
  // Limpiar contenedor
  scrollLogContainer.innerHTML = '';
  
  // Agregar entradas
  state.logEntries.forEach(entry => {
    const logEntry = document.createElement('div');
    logEntry.className = 'scroll-log-entry';
    if (entry.isError) {
      logEntry.classList.add('error');
    }
    
    logEntry.innerHTML = `<span class="log-time">[${entry.time}]</span> ${entry.message}`;
    scrollLogContainer.appendChild(logEntry);
  });
  
  // Scroll al final
  scrollLogContainer.scrollTop = scrollLogContainer.scrollHeight;
}

function updateElapsedTime() {
  if (!state.searchStartTime || !elapsedTime) return;
  
  const now = Date.now();
  const elapsed = now - state.searchStartTime;
  elapsedTime.textContent = formatTime(elapsed);
}

function showError(message) {
  updateStatus(message, 0, true);
}

function clearError() {
  statusMessage.textContent = 'Listo';
  statusMessage.className = 'status';
}

function updateStatus(message, progress = state.progress, isError = false) {
  // Actualizar barra de progreso principal
  if (progressBar) {
    progressBar.style.width = `${progress}%`;
  }
  
  // Actualizar mensaje de estado principal
  if (statusMessage) {
    statusMessage.textContent = message;
  }
  
  // Cambiar clase si es un error
  if (statusMessage) {
    statusMessage.classList.toggle('error', isError);
  }
  
  // Actualizar el estado
  state.statusMessage = message;
  state.progress = progress;
  
  // Mostrar contenedor de estado detallado si el progreso está en marcha (>0)
  if (progress > 0 && progress < 100) {
    if (searchStatusContainer) {
      searchStatusContainer.style.display = 'block';
    }
  }
  
  // Actualizar UI detallada
  if (detailedStatusMessage) {
    detailedStatusMessage.textContent = message;
  }
  
  if (detailedProgressBar) {
    detailedProgressBar.value = progress;
  }
  
  if (progressPercentage) {
    progressPercentage.textContent = `${progress}%`;
  }
  
  // Si es un error, agregar al log
  if (isError) {
    addLogEntry(message, true);
  } else if (state.logEntries.length === 0 || state.logEntries[state.logEntries.length - 1].message !== message) {
    // Solo agregar al log si es un mensaje nuevo y no repetido
    addLogEntry(message);
  }
  
  // Iniciar contador de tiempo si se inicia una búsqueda
  if (progress > 0 && !state.searchStartTime) {
    state.searchStartTime = Date.now();
    // Iniciar intervalo para actualizar el tiempo transcurrido
    if (elapsedTime) {
      setInterval(updateElapsedTime, 1000);
    }
  }
  
  // Ocultar contenedor de estado detallado cuando el proceso termina
  if (progress === 0 || progress === 100) {
    // No ocultar inmediatamente para que el usuario pueda ver el resultado final
    setTimeout(() => {
      if (state.progress === 0 || state.progress === 100) {
        if (searchStatusContainer) {
          searchStatusContainer.style.display = 'none';
        }
        state.searchStartTime = null; // Reiniciar timer
      }
    }, 5000);
  }
  
  // Enviar actualización de estado a otras partes de la extensión
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    try {
      chrome.runtime.sendMessage({
        type: 'status_update',
        message: message,
        progress: progress,
        error: isError
      });
    } catch (error) {
      console.error('Error al enviar mensaje de actualización de estado:', error);
    }
  } else {
    console.warn('chrome.runtime.sendMessage no está disponible');
  }
}

// Función para actualizar la UI basada en el estado actual
function updateUI() {
  // Verificar que los botones existen antes de modificar sus propiedades
  if (pauseButton) {
    pauseButton.disabled = false;
  }
  
  if (stopButton) {
    stopButton.disabled = false;
  }
  
  // Actualizar operación actual
  if (statusMessage) {
    let statusText = state.isRunning 
      ? (state.isPaused ? 'Pausado' : 'En ejecución') 
      : 'Listo para comenzar';
    
    if (state.currentOperation) {
      statusText += `: ${state.currentOperation}`;
    }
    
    if (state.error) {
      statusText += ` (Error: ${state.error})`;
    }
    
    statusMessage.textContent = statusText;
  }
  
  // Actualizar barra de progreso
  if (progressBar) {
    progressBar.style.width = `${state.progress}%`;
  }
  
  // Actualizar información de búsqueda actual
  updateSearchInfo();
}

function updateCurrentSearchInfo() {
  if (state.currentSearchTerm) {
    let searchInfoHTML = `<p><strong>Término de búsqueda:</strong> ${state.currentSearchTerm}</p>`;
    
    if (state.currentSearchCity) {
      searchInfoHTML += `<p><strong>Ciudad:</strong> ${state.currentSearchCity}</p>`;
    }
    
    // Mostrar término completo (combinado con ciudad)
    if (state.currentSearchCity) {
      searchInfoHTML += `<p><strong>Búsqueda completa:</strong> ${state.currentSearchTerm} (Ciudad: ${state.currentSearchCity})</p>`;
      
      // Agregar un mensaje de estado para el filtro de ciudad
      const cityFilterApplied = localStorage.getItem('snap_lead_manager_city_filter_applied') === 'true';
      if (cityFilterApplied) {
        searchInfoHTML += `<p class="status success"><i>✓ Filtro de ciudad aplicado correctamente</i></p>`;
      } else {
        searchInfoHTML += `<p class="status"><i>Filtro de ciudad pendiente de aplicar...</i></p>`;
      }
    }
    
    if (currentSearchInfo) {
      currentSearchInfo.innerHTML = searchInfoHTML;
      currentSearchInfo.style.display = 'block';
    }
  } else if (currentSearchInfo) {
    currentSearchInfo.style.display = 'none';
  }
}

// Función para realizar la búsqueda
function performSearch() {
  try {
    const searchTerm = searchTermInput.value.trim();
    const searchCity = searchCityInput.value.trim();
    
    if (!searchTerm) {
      throw new Error('Por favor ingresa un término de búsqueda');
    }
    
    console.log('Iniciando búsqueda con término:', searchTerm, 'y ciudad:', searchCity);
    
    // Crear mensaje con estructura exacta
    const searchMessage = {
      action: 'search',
      searchTerm: searchTerm,
      searchData: {
        city: searchCity,
        term: searchTerm
      }
    };
    
    console.log('Enviando mensaje de búsqueda:', searchMessage);
    
    // Enviar mensaje con estructura verificada
    chrome.runtime.sendMessage(searchMessage, function(response) {
      console.log('Respuesta completa de búsqueda:', response);
      
      if (chrome.runtime.lastError) {
        console.error('Error de runtime:', chrome.runtime.lastError);
        addLogEntry('Error de comunicación: ' + chrome.runtime.lastError.message, true);
        return;
      }
      
      if (response && response.success) {
        console.log('Búsqueda iniciada con éxito');
      } else {
        console.error('Error en respuesta:', response);
        addLogEntry('Error al iniciar búsqueda: ' + (response?.error || 'Respuesta inválida'), true);
      }
    });
    
  } catch (error) {
    console.error('Error al ejecutar búsqueda:', error);
    addLogEntry('Error en la búsqueda: ' + error.message, true);
    showError('Error: ' + error.message);
  }
}

// Función para actualizar la información de búsqueda
function updateSearchInfo() {
  if (state.currentSearchTerm) {
    let searchInfoHTML = `<p><strong>Término de búsqueda:</strong> ${state.currentSearchTerm}</p>`;
    
    if (state.currentSearchCity) {
      searchInfoHTML += `<p><strong>Ciudad:</strong> ${state.currentSearchCity}</p>`;
    }
    
    // Mostrar término completo (combinado con ciudad)
    if (state.currentSearchCity) {
      searchInfoHTML += `<p><strong>Búsqueda completa:</strong> ${state.currentSearchTerm} (Ciudad: ${state.currentSearchCity})</p>`;
      
      // Agregar un mensaje de estado para el filtro de ciudad
      const cityFilterApplied = localStorage.getItem('snap_lead_manager_city_filter_applied') === 'true';
      if (cityFilterApplied) {
        searchInfoHTML += `<p class="status success"><i>✓ Filtro de ciudad aplicado correctamente</i></p>`;
      } else {
        searchInfoHTML += `<p class="status"><i>Filtro de ciudad pendiente de aplicar...</i></p>`;
      }
    }
    
    if (currentSearchInfo) {
      currentSearchInfo.innerHTML = searchInfoHTML;
      currentSearchInfo.style.display = 'block';
    }
  } else if (currentSearchInfo) {
    currentSearchInfo.style.display = 'none';
  }
}

// Funciones para iniciar, pausar y detener el proceso
async function startProcess() {
  if (state.isRunning) return;
  
  try {
    updateStatus('Iniciando proceso...', 10);
    
    const response = await chrome.runtime.sendMessage({
      action: 'start'
    });
    
    if (response && response.success) {
      updateStatus('Proceso iniciado', 15);
      state.isRunning = true;
      state.isPaused = false;
      updateUI();
    } else {
      throw new Error(response?.message || 'Error al iniciar el proceso');
    }
  } catch (error) {
    console.error('Error al iniciar:', error);
    showError('Error: ' + error.message);
  }
}

async function pauseProcess() {
  if (!state.isRunning || state.isPaused) return;
  
  try {
    updateStatus('Pausando proceso...', state.progress);
    
    const response = await chrome.runtime.sendMessage({
      action: 'pause'
    });
    
    if (response && response.success) {
      updateStatus('Proceso pausado', state.progress);
      state.isPaused = true;
      updateUI();
    } else {
      throw new Error(response?.message || 'Error al pausar el proceso');
    }
  } catch (error) {
    console.error('Error al pausar:', error);
    showError('Error: ' + error.message);
  }
}

async function stopProcess() {
  try {
    console.log('Sidebar: Solicitando detención del proceso');
    updateStatus('Deteniendo proceso...', state.progress);
    
    // Actualizar estado local inmediatamente para mejor UX
    state.isRunning = false;
    state.isPaused = false;
    updateUI();
    
    // Enviar mensaje al background script
    const response = await chrome.runtime.sendMessage({
      action: 'stop'
    });
    
    console.log('Respuesta a solicitud de detención:', response);
    
    if (response && response.success) {
      updateStatus('Proceso detenido', 0);
    } else {
      console.warn('Respuesta de detención no exitosa:', response);
      // Aún así, mantener el estado como detenido
      updateStatus('Proceso detenido (con advertencias)', 0);
    }
  } catch (error) {
    console.error('Error al detener proceso:', error);
    
    // A pesar del error, asegurar que la UI muestre el estado como detenido
    state.isRunning = false;
    state.isPaused = false;
    updateUI();
    
    updateStatus('Proceso detenido (con errores)', 0);
    showError('Error al detener: ' + (error.message || 'Error desconocido'));
  }
}

// Función para actualizar la lista de resultados
function updateResultsList(profiles) {
  if (!searchResultsList) return;
  
  // Limpiar lista de resultados
  searchResultsList.innerHTML = '';
  
  // Actualizar el resumen de resultados
  if (resultsSummary) {
    resultsSummary.innerHTML = `<p>Se encontraron <strong>${profiles.length}</strong> perfiles</p>`;
  }
  
  // Agregar cada perfil a la lista
  profiles.forEach(profile => {
    const listItem = document.createElement('li');
    listItem.className = 'result-item';
    
    // Crear contenido del item
    listItem.innerHTML = `
      <div class="result-header">
        <span class="result-name">${profile.name}</span>
        <a href="${profile.url}" target="_blank" class="result-link">Ver</a>
      </div>
      ${profile.info ? `<div class="result-info">${profile.info}</div>` : ''}
    `;
    
    searchResultsList.appendChild(listItem);
  });
}

// Función para abrir el sidebar en una ventana separada
function openSidebarInWindow() {
  // Verificar si estamos en un iframe
  const isInIframe = window !== window.top;
  
  // Si ya estamos en una ventana separada, no hacer nada
  if (!isInIframe) {
    return;
  }
  
  // Enviar mensaje al content script para que notifique al background
  window.parent.postMessage({
    from: 'snap-lead-manager',
    action: 'open_in_window'
  }, '*');
}

// Listener para mensajes del iframe
window.addEventListener('message', (event) => {
  // Verificar que el mensaje viene de nuestra extensión
  if (event.data && event.data.from === 'snap-lead-manager') {
    console.log('Sidebar recibió mensaje:', event.data);
    
    if (event.data.action === 'search') {
      // Iniciar una búsqueda
      const searchData = event.data.data || {};
      console.log('Solicitando búsqueda con datos:', searchData);
      
      // Guardar el término de búsqueda y datos completos en localStorage para recuperación
      if (event.data.searchTerm) {
        localStorage.setItem('snap_lead_manager_search_term', event.data.searchTerm);
        if (searchData) {
          localStorage.setItem('snap_lead_manager_search_data', JSON.stringify(searchData));
        }
      }
      
      // Actualizar los datos de búsqueda en el estado
      state.currentSearchTerm = event.data.searchTerm;
      state.currentSearchCity = searchData.city || '';
      
      // Actualizar el display de info de búsqueda
      updateSearchInfo();
      
      // Enviar mensaje al script de fondo para iniciar la búsqueda
      chrome.runtime.sendMessage({
        action: 'perform_search',
        searchTerm: event.data.searchTerm,
        searchData: searchData
      }, (response) => {
        if (response && response.success) {
          console.log('Búsqueda iniciada correctamente');
          
          // Aplicar filtros (específicamente el de ciudad) después de un tiempo para que cargue la página
          setTimeout(() => {
            chrome.runtime.sendMessage({ action: 'apply_filters' }, (filterResponse) => {
              if (filterResponse && filterResponse.success) {
                console.log('Filtros aplicados correctamente');
              } else {
                console.error('Error al aplicar filtros:', filterResponse?.error || 'Sin respuesta');
              }
            });
          }, 5000); // Dar tiempo para que se cargue la página de resultados
        } else {
          console.error('Error al iniciar búsqueda:', response?.error || 'Sin respuesta');
          
          // Notificar al iframe el error
          const iframe = document.getElementById('snap-lead-iframe');
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({
              action: 'search_error',
              error: response?.error || 'Error al iniciar la búsqueda'
            }, '*');
          }
        }
      });
    } else if (event.data.action === 'close_sidebar') {
      // Cerrar el sidebar
      const sidebar = document.getElementById('snap-lead-manager-sidebar');
      if (sidebar) {
        document.body.removeChild(sidebar);
      }
    } else if (event.data.action === 'toggle_sidebar') {
      // Alternar visibilidad del sidebar
      const sidebar = document.getElementById('snap-lead-manager-sidebar');
      
      if (sidebar) {
        // Si está colapsado, expandir y viceversa
        const isCollapsed = sidebar.classList.contains('snap-lead-manager-collapsed');
        
        if (isCollapsed) {
          sidebar.classList.remove('snap-lead-manager-collapsed');
        } else {
          sidebar.classList.add('snap-lead-manager-collapsed');
        }
        
        // Guardar estado en localStorage
        localStorage.setItem('snap_lead_manager_sidebar_collapsed', isCollapsed ? 'false' : 'true');
      }
    } else if (event.data.action === 'apply_filters') {
      // Solicitar aplicación de filtros
      console.log('Solicitando aplicar filtros desde sidebar');
      
      // Reiniciar el indicador de filtro aplicado
      localStorage.setItem('snap_lead_manager_city_filter_applied', 'false');
      
      // Enviar mensaje a content script para aplicar filtros
      chrome.runtime.sendMessage({ action: 'apply_filters' }, (response) => {
        if (response && response.success) {
          console.log('Filtros aplicados correctamente');
          
          // Notificar al iframe del éxito
          const iframe = document.getElementById('snap-lead-iframe');
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({
              action: 'filters_applied',
              success: true
            }, '*');
          }
        } else {
          console.error('Error al aplicar filtros:', response?.error || 'Sin respuesta');
          
          // Notificar al iframe del error
          const iframe = document.getElementById('snap-lead-iframe');
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({
              action: 'filters_error',
              error: response?.error || 'Error al aplicar filtros'
            }, '*');
          }
        }
      });
    } else if (event.data.action === 'filter_status_update') {
      // Actualizar el estado del filtro en la UI
      const filterStatusElement = document.querySelector('#current-search-info p.status i');
      if (filterStatusElement) {
        if (event.data.filterApplied) {
          filterStatusElement.textContent = '✓ Filtro de ciudad aplicado correctamente';
          filterStatusElement.parentElement.className = 'status success';
        } else {
          filterStatusElement.textContent = 'Filtro de ciudad pendiente de aplicar...';
          filterStatusElement.parentElement.className = 'status';
        }
      }
    }
  }
});

// Comunicación con la extensión (background script)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Sidebar recibió mensaje del background:', message);
  
  if (message.action === 'status_update') {
    try {
      // Actualizar estado con la información recibida
      updateStatus(message.message, message.progress || state.progress, message.error || false);
      sendResponse({ success: true });
    } catch (error) {
      console.error('Error al procesar mensaje status_update:', error);
      sendResponse({ success: false, error: error.message });
    }
  } else if (message.action === 'update_profiles') {
    try {
      // Actualizar perfiles encontrados
      state.profiles = message.profiles || [];
      updateResultsList(state.profiles);
      
      // Mostrar mensaje en el log
      addLogEntry(`Se recibieron ${state.profiles.length} perfiles del background`);
      sendResponse({ success: true });
    } catch (error) {
      console.error('Error al procesar mensaje update_profiles:', error);
      sendResponse({ success: false, error: error.message });
    }
  } else if (message.type === 'status_update') {
    try {
      // Manejar actualización de estado desde el background script
      updateStatus(message.message, message.progress || state.progress, message.error || false);
      
      // Actualizar el estado de ejecución
      if (message.finished) {
        state.isRunning = false;
        state.isPaused = false;
      }
      
      updateUI();
      sendResponse({ success: true });
    } catch (error) {
      console.error('Error al procesar mensaje type:status_update:', error);
      sendResponse({ success: false, error: error.message });
    }
  } else {
    sendResponse({ success: false, message: 'Acción no reconocida' });
  }
  
  return true; // Mantener la conexión abierta para respuesta asíncrona
});

// Listener para mensajes del contenido principal
window.addEventListener('message', (event) => {
  // Verificar que el mensaje viene de nuestra extensión
  if (event.data && event.data.action) {
    console.log('Sidebar recibió mensaje:', event.data);
    
    const { action, success, error, message, progress } = event.data;
    
    if (action === 'search_response') {
      // Procesar respuesta de búsqueda enviada vía postMessage
      if (success) {
        addLogEntry('Búsqueda iniciada con éxito', false);
      } else {
        const errorMsg = error || 'Error desconocido al iniciar la búsqueda';
        console.error('Error en búsqueda:', errorMsg);
        addLogEntry(`Error: ${errorMsg}`, true);
        showError(`Error: ${errorMsg}`);
      }
    } else if (action === 'status_update') {
      // Actualizar estado enviado vía postMessage
      try {
        updateStatus(message || 'Actualizando...', progress || 0, !!error);
        if (error) {
          addLogEntry(`Error: ${message}`, true);
        } else {
          addLogEntry(message || 'Actualizando...', false);
        }
        updateUI();
      } catch (e) {
        console.error('Error al procesar status_update vía postMessage:', e);
      }
    }
  }
});

// Inicializar UI
function initializeDOMReferences() {
  console.log('Inicializando referencias DOM');
  
  // Elementos principales
  searchTermInput = document.getElementById('search-term');
  searchCityInput = document.getElementById('search-city');
  searchButton = document.getElementById('search-button');
  pauseButton = document.getElementById('pause-button');
  stopButton = document.getElementById('stop-button');
  openWindowButton = document.getElementById('open-window-btn');
  statusMessage = document.getElementById('status-message');
  progressBar = document.getElementById('progress-bar');
  searchResultsList = document.getElementById('search-results');
  currentSearchInfo = document.getElementById('current-search-info');
  
  // Elementos detallados
  searchStatusContainer = document.getElementById('search-status-container'); // Asegurarse de que el ID sea correcto
  detailedStatusMessage = document.getElementById('detailed-status-message');
  detailedProgressBar = document.getElementById('detailed-progress-bar');
  progressPercentage = document.getElementById('progress-percentage');
  currentOperation = document.getElementById('current-operation');
  elapsedTime = document.getElementById('elapsed-time');
  scrollLogContainer = document.getElementById('scroll-log-container');
  resultsSummary = document.getElementById('results-summary');
  
  // Realizar un log para depuración
  console.log('Estado de las variables de elementos críticos:', {
    searchTermInput: !!searchTermInput,
    searchCityInput: !!searchCityInput,
    searchButton: !!searchButton,
    searchStatusContainer: !!searchStatusContainer,
    pauseButton: !!pauseButton,
    stopButton: !!stopButton
  });
}

initializeDOMReferences();

// Notificar al content script que el sidebar está listo
try {
  window.parent.postMessage({ 
    from: 'snap-lead-manager',
    action: 'sidebar_loaded' 
  }, '*');
  
  // Solicitar estado actual al background con manejo de errores
  try {
    chrome.runtime.sendMessage({ action: 'get_state' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error al solicitar estado:', chrome.runtime.lastError);
        return;
      }
      
      if (response) {
        console.log('Estado recibido del background:', response);
        
        // Si hay información de búsqueda, restaurarla
        if (response.currentSearchTerm) {
          state.currentSearchTerm = response.currentSearchTerm;
          
          if (response.searchData && response.searchData.city) {
            state.currentSearchCity = response.searchData.city;
          }
          
          // Actualizar campos del formulario si existen
          if (searchTermInput) searchTermInput.value = state.currentSearchTerm;
          if (searchCityInput) searchCityInput.value = state.currentSearchCity;
          
          // Actualizar información mostrada
          try {
            updateSearchInfo();
          } catch (error) {
            console.error('Error al actualizar información de búsqueda:', error);
          }
          
          // Marcar como restaurado
          state.restored = true;
          try {
            addLogEntry('Estado de búsqueda restaurado');
          } catch (error) {
            console.error('Error al agregar entrada de log:', error);
          }
          
          // Si hay un término de búsqueda, también restaurar los criterios
          if (state.currentSearchTerm) {
            try {
              if (response.fullQuery) {
                addLogEntry(`Búsqueda restaurada: "${response.fullQuery}"`);
              } else {
                const cityInfo = state.currentSearchCity ? ` en ${state.currentSearchCity}` : '';
                addLogEntry(`Búsqueda restaurada: "${state.currentSearchTerm}${cityInfo}"`);
              }
            } catch (error) {
              console.error('Error al agregar entrada de log de búsqueda:', error);
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Error al enviar mensaje get_state:', error);
  }
  
  // Solicitar los perfiles encontrados (si existen)
  try {
    chrome.runtime.sendMessage({ action: 'get_profiles' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error al solicitar perfiles:', chrome.runtime.lastError);
        return;
      }
      
      if (response && response.success && response.profiles && response.profiles.length > 0) {
        state.profiles = response.profiles;
        try {
          updateResultsList(state.profiles);
          addLogEntry(`Se recuperaron ${state.profiles.length} perfiles`);
        } catch (error) {
          console.error('Error al procesar perfiles:', error);
        }
      }
    });
  } catch (error) {
    console.error('Error al enviar mensaje get_profiles:', error);
  }
  
  // Solicitar el estado actual del proceso
  try {
    chrome.runtime.sendMessage({ action: 'get_status' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error al solicitar estatus:', chrome.runtime.lastError);
        return;
      }
      
      if (response) {
        state.isRunning = response.isRunning || false;
        state.isPaused = response.isPaused || false;
        
        if (response.message) {
          try {
            updateStatus(response.message, response.progress || 0);
          } catch (error) {
            console.error('Error al actualizar estado:', error);
          }
        }
        
        try {
          updateUI();
        } catch (error) {
          console.error('Error al actualizar UI:', error);
        }
      }
    });
  } catch (error) {
    console.error('Error al enviar mensaje get_status:', error);
  }
  
} catch (error) {
  console.error('Error al comunicarse con el content script:', error);
}

// Listener para mensajes de content script y background
window.addEventListener('message', (event) => {
  // Verificar que el mensaje viene de nuestra extensión
  if (event.data && event.data.action) {
    console.log('Sidebar recibió mensaje:', event.data);
    
    if (event.data.action === 'status_update') {
      // Actualizar estado con la información recibida
      updateStatus(event.data.message, event.data.progress || state.progress, event.data.error || false);
    } else if (event.data.action === 'restore_search_info') {
      // Restaurar información de búsqueda anterior
      state.currentSearchTerm = event.data.searchTerm || '';
      
      if (event.data.searchData && event.data.searchData.city) {
        state.currentSearchCity = event.data.searchData.city;
      }
      
      // Actualizar campos del formulario
      if (searchTermInput) searchTermInput.value = state.currentSearchTerm;
      if (searchCityInput) searchCityInput.value = state.currentSearchCity;
      
      // Actualizar información mostrada
      updateSearchInfo();
      
      // Marcar como restaurado
      state.restored = true;
      addLogEntry('Estado de búsqueda restaurado');
      
      // Si hay un término de búsqueda, también restaurar los criterios
      if (state.currentSearchTerm) {
        if (event.data.fullQuery) {
          addLogEntry(`Búsqueda restaurada: "${event.data.fullQuery}"`);
        } else {
          const cityInfo = state.currentSearchCity ? ` en ${state.currentSearchCity}` : '';
          addLogEntry(`Búsqueda restaurada: "${state.currentSearchTerm}${cityInfo}"`);
        }
      }
    } else if (event.data.action === 'update_profiles') {
      // Actualizar perfiles encontrados
      state.profiles = event.data.profiles || [];
      updateResultsList(state.profiles);
      
      // Mostrar mensaje en el log
      addLogEntry(`Se actualizaron los perfiles encontrados: ${state.profiles.length} perfiles`);
    }
  }
});

// Función para limpiar errores
function clearError() {
  const errorElem = document.getElementById('snap-lead-manager-error');
  if (errorElem) {
    errorElem.style.display = 'none';
    errorElem.textContent = '';
  }
}

// Función para mostrar errores
function showError(message) {
  const sidebar = document.getElementById('snap-lead-manager-sidebar');
  if (!sidebar) return;
  
  let errorElem = document.getElementById('snap-lead-manager-error');
  
  if (!errorElem) {
    errorElem = document.createElement('div');
    errorElem.id = 'snap-lead-manager-error';
    errorElem.style.cssText = `
      position: absolute;
      bottom: 10px;
      left: 10px;
      right: 10px;
      background-color: #ff4d4d;
      color: white;
      padding: 10px;
      border-radius: 5px;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      text-align: center;
      display: none;
    `;
    
    // Agregar botón para cerrar
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
      position: absolute;
      top: 5px;
      right: 5px;
      background: none;
      border: none;
      color: white;
      font-size: 16px;
      cursor: pointer;
    `;
    closeBtn.onclick = clearError;
    
    errorElem.appendChild(closeBtn);
    sidebar.appendChild(errorElem);
  }
  
  // Mostrar el mensaje
  errorElem.style.display = 'block';
  errorElem.textContent = message;
  
  // Cerrar automáticamente después de 10 segundos
  setTimeout(clearError, 10000);
}

// Inicialización de la UI
document.addEventListener('DOMContentLoaded', () => {
  // Obtener referencias a elementos del DOM
  searchTermInput = document.getElementById('search-term');
  searchCityInput = document.getElementById('search-city');
  searchButton = document.getElementById('search-button');
  pauseButton = document.getElementById('pause-button');
  stopButton = document.getElementById('stop-button');
  openWindowButton = document.getElementById('open-window-btn');
  statusMessage = document.getElementById('status-message');
  progressBar = document.getElementById('progress-bar');
  searchResultsList = document.getElementById('search-results');
  currentSearchInfo = document.getElementById('current-search-info');
  
  // Cargar datos de búsqueda guardados
  const savedSearchTerm = localStorage.getItem('snap_lead_manager_search_term');
  const savedSearchData = localStorage.getItem('snap_lead_manager_search_data');
  
  if (savedSearchTerm) {
    searchTermInput.value = savedSearchTerm;
    
    if (savedSearchData) {
      try {
        const searchData = JSON.parse(savedSearchData);
        if (searchData.city) {
          searchCityInput.value = searchData.city;
        }
        
        // Mostrar información de búsqueda actual
        currentSearchInfo.innerHTML = `
          <strong>Búsqueda actual:</strong> ${savedSearchTerm}
          ${searchData.city ? `<br><strong>Ciudad:</strong> ${searchData.city}` : ''}
        `;
        currentSearchInfo.style.display = 'block';
      } catch (error) {
        console.error('Error al parsear datos de búsqueda guardados:', error);
      }
    }
  }
  
  // Event listener para botón de búsqueda
  searchButton.addEventListener('click', () => {
    try {
      const searchTerm = searchTermInput.value.trim();
      const searchCity = searchCityInput.value.trim();
      
      if (!searchTerm) {
        throw new Error('Por favor ingresa un término de búsqueda');
      }
      
      console.log('Iniciando búsqueda con término:', searchTerm, 'y ciudad:', searchCity);
      
      // Crear mensaje con estructura exacta
      const searchMessage = {
        action: 'search',
        searchTerm: searchTerm,
        searchData: {
          city: searchCity,
          term: searchTerm
        }
      };
      
      console.log('Enviando mensaje de búsqueda:', searchMessage);
      
      // Enviar mensaje con estructura verificada
      chrome.runtime.sendMessage(searchMessage, function(response) {
        console.log('Respuesta completa de búsqueda:', response);
        
        if (chrome.runtime.lastError) {
          console.error('Error de runtime:', chrome.runtime.lastError);
          addLogEntry('Error de comunicación: ' + chrome.runtime.lastError.message, true);
          return;
        }
        
        if (response && response.success) {
          console.log('Búsqueda iniciada con éxito');
        } else {
          console.error('Error en respuesta:', response);
          addLogEntry('Error al iniciar búsqueda: ' + (response?.error || 'Respuesta inválida'), true);
        }
      });
      
    } catch (error) {
      console.error('Error al ejecutar búsqueda:', error);
      addLogEntry('Error en la búsqueda: ' + error.message, true);
      showError('Error: ' + error.message);
    }
  });
  
  // Event listener para tecla Enter en campos de búsqueda
  searchTermInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      try {
        performSearch();
      } catch (error) {
        console.error('Error al ejecutar búsqueda con Enter:', error);
        addLogEntry('Error en la búsqueda: ' + error.message, true);
        showError('Error: ' + error.message);
      }
    }
  });
  
  searchCityInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      try {
        performSearch();
      } catch (error) {
        console.error('Error al ejecutar búsqueda con Enter:', error);
        addLogEntry('Error en la búsqueda: ' + error.message, true);
        showError('Error: ' + error.message);
      }
    }
  });
  
  // Event listeners para botones de control
  pauseButton.addEventListener('click', () => {
    console.log('Botón pausa presionado');
    
    // Enviar mensaje al content script
    window.parent.postMessage({
      from: 'snap-lead-manager',
      action: 'pause'
    }, '*');
    
    // También enviar mensaje al background script
    chrome.runtime.sendMessage({
      action: 'pause'
    }, (response) => {
      console.log('Respuesta del background script a pause:', response);
    });
    
    // Actualizar UI
    state.isPaused = !state.isPaused;
    updateStatus(state.isPaused ? 'Proceso pausado' : 'Reanudando proceso...', state.progress);
    updateUI();
  });
  
  stopButton.addEventListener('click', () => {
    console.log('Botón detener presionado');
    
    // Enviar mensaje al content script
    window.parent.postMessage({
      from: 'snap-lead-manager',
      action: 'stop'
    }, '*');
    
    // También enviar mensaje al background script
    chrome.runtime.sendMessage({
      action: 'stop'
    }, (response) => {
      console.log('Respuesta del background script a stop:', response);
    });
    
    // Actualizar UI
    state.isRunning = false;
    state.isPaused = false;
    updateStatus('Proceso detenido', 0);
    updateUI();
  });
  
  // Event listener para botón de abrir en ventana
  openWindowButton.addEventListener('click', openSidebarInWindow);
  
  // Asegurarnos de que los botones estén habilitados independientemente del estado
  if (pauseButton) pauseButton.disabled = false;
  if (stopButton) stopButton.disabled = false;
  
  // Verificar estado inicial
  chrome.runtime.sendMessage({ action: 'get_status' }, (response) => {
    if (response) {
      updateUIStatus(response);
    }
  });
  
  // Función para actualizar el estado en la UI
  function updateUIStatus(status) {
    if (status.isRunning) {
      pauseButton.disabled = false;
      stopButton.disabled = false;
      
      statusMessage.textContent = status.message || 'En ejecución';
      
      if (status.progress !== undefined) {
        progressBar.style.width = `${status.progress}%`;
      }
    } else {
      pauseButton.disabled = false;
      stopButton.disabled = false;
      statusMessage.textContent = status.message || 'Listo para comenzar';
    }
    
    // Actualizar la barra de progreso
    if (status.progress !== undefined) {
      progressBar.style.width = `${status.progress}%`;
    }
  }
});

// Función para mostrar perfiles como lista ordenada con numeración visible
function displayProfileLinks(profiles) {
  console.log('Mostrando perfiles como lista numerada', profiles);
  
  // Verificar si ya estamos en proceso de mostrar perfiles para evitar bucles
  if (window.isDisplayingProfiles) {
    console.log('Ya hay un proceso de mostrar perfiles en curso, evitando bucle');
    return;
  }
  
  // Marcar que estamos en proceso de mostrar perfiles
  window.isDisplayingProfiles = true;
  
  try {
    // Crear o obtener el contenedor de resultados
    let resultsContainer = document.getElementById('profile-results');
    if (!resultsContainer) {
      resultsContainer = document.createElement('div');
      resultsContainer.id = 'profile-results';
      resultsContainer.className = 'profile-results-container';
      
      // Añadir al contenido principal
      const mainContent = document.querySelector('.sidebar-content') || document.body;
      mainContent.appendChild(resultsContainer);
    }
    
    // Limpiar contenido anterior
    resultsContainer.innerHTML = '';
    
    // Título de la sección
    const headerDiv = document.createElement('div');
    headerDiv.className = 'results-header';
    headerDiv.innerHTML = `<h3>RESULTADOS</h3><p>Se encontraron ${profiles.length} perfiles</p>`;
    resultsContainer.appendChild(headerDiv);
    
    // Crear lista con IDs explícitos para mantener compatibilidad
    const searchResults = document.createElement('ul');
    searchResults.id = 'search-results';
    searchResults.className = 'results-list numbered';
    
    // Añadir cada perfil a la lista con número incluido
    profiles.forEach((profile, index) => {
      // Verificar que el perfil tenga los datos necesarios
      if (!profile || !profile.url) {
        console.warn('Perfil inválido en posición', index, profile);
        return; // Saltar este perfil
      }
      
      const resultItem = document.createElement('li');
      resultItem.className = 'result-item';
      
      // Determinar el nombre a mostrar
      let displayName = profile.name;
      if (!displayName || displayName === 'Nombre no disponible') {
        // Intentar extraer un nombre de la URL como último recurso
        const urlParts = profile.url.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        if (lastPart) {
          displayName = lastPart.replace(/\./g, ' ').replace(/-/g, ' ');
          displayName = displayName.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
        } else {
          displayName = 'Nombre no disponible';
        }
      }
      
      // Incluir el número como parte del nombre del perfil
      resultItem.innerHTML = `
        <div class="result-header">
          <span class="result-name"><span class="result-number">${index + 1}.</span> ${displayName}</span>
          <a href="#" class="result-link" data-profile-url="${profile.url}">Ver</a>
        </div>
      `;
      
      searchResults.appendChild(resultItem);
    });
    
    resultsContainer.appendChild(searchResults);
    
    // Añadir evento click a los enlaces "Ver"
    const viewLinks = document.querySelectorAll('.result-link');
    viewLinks.forEach(link => {
      // Remover eventos anteriores para evitar duplicación
      const newLink = link.cloneNode(true);
      link.parentNode.replaceChild(newLink, link);
      
      newLink.addEventListener('click', function(e) {
        e.preventDefault();
        const profileUrl = this.getAttribute('data-profile-url');
        if (profileUrl) {
          console.log('Solicitando abrir perfil:', profileUrl);
          // Enviar mensaje al content script para abrir el perfil
          chrome.runtime.sendMessage({
            action: 'open_profile',
            profileUrl: profileUrl
          });
        }
      });
    });
    
    // Actualizar el resumen de búsqueda una sola vez
    if (!window.summaryUpdated) {
      updateSearchSummary();
      window.summaryUpdated = true;
    }
    
    // Marcar la búsqueda como completada
    localStorage.setItem('snap_lead_manager_search_pending', 'false');
    localStorage.setItem('snap_lead_manager_search_completed', 'true');
    
    console.log('Perfiles mostrados correctamente');
  } catch (error) {
    console.error('Error al mostrar perfiles:', error);
  } finally {
    // Siempre desmarcar el proceso al finalizar
    window.isDisplayingProfiles = false;
  }
}

// Escuchar el mensaje para mostrar perfiles - ÚNICO EVENT LISTENER
window.removeEventListener('message', handleDisplayProfileLinks); // Eliminar cualquier listener previo
function handleDisplayProfileLinks(event) {
  if (event.data && event.data.action === 'display_profile_links') {
    displayProfileLinks(event.data.profiles);
    
    // Esperar a que se rendericen los resultados
    setTimeout(numerateSearchResults, 300);
  }
}
window.addEventListener('message', handleDisplayProfileLinks);

// Función para numerar resultados de búsqueda
function numerateSearchResults() {
  console.log('Numerando resultados de búsqueda');
  
  // Verificar si ya estamos en proceso de numeración para evitar bucles
  if (window.isNumeratingResults) {
    console.log('Ya hay un proceso de numeración en curso, evitando bucle');
    return;
  }
  
  // Marcar que estamos en proceso de numeración
  window.isNumeratingResults = true;
  
  try {
    // Obtener todos los elementos de resultado
    const resultItems = document.querySelectorAll('#search-results .result-item');
    
    if (resultItems.length === 0) {
      console.log('No se encontraron elementos para numerar');
      window.isNumeratingResults = false;
      return;
    }
    
    console.log(`Numerando ${resultItems.length} elementos`);
    
    // Agregar número a cada elemento (solo si no tiene ya uno)
    resultItems.forEach((item, index) => {
      const nameElement = item.querySelector('.result-name');
      
      // Verificar si ya tiene numeración para evitar duplicados
      if (nameElement && !nameElement.querySelector('.result-number')) {
        // Crear número
        const numberElement = document.createElement('span');
        numberElement.className = 'result-number';
        numberElement.textContent = `${index + 1}. `;
        numberElement.style.fontWeight = 'bold';
        numberElement.style.color = '#4267B2';
        numberElement.style.marginRight = '5px';
        
        // Insertar número al inicio del nombre
        nameElement.insertBefore(numberElement, nameElement.firstChild);
      }
    });
    
    // Actualizar el resumen de búsqueda (solo una vez)
    if (!window.summaryUpdated) {
      updateSearchSummary();
      window.summaryUpdated = true;
    }
    
    // Marcar la búsqueda como completada si hay resultados
    if (resultItems.length > 0) {
      // Verificar si la búsqueda ya está marcada como completada
      const isCompleted = localStorage.getItem('snap_lead_manager_search_completed') === 'true';
      
      if (!isCompleted) {
        console.log('Marcando búsqueda como completada después de numerar resultados');
        
        // Notificar al content script que la búsqueda ha sido completada
        chrome.runtime.sendMessage({
          action: 'search_completed',
          results: resultItems.length,
          message: `Búsqueda completada. Se encontraron ${resultItems.length} perfiles.`
        });
        
        // Actualizar el estado en localStorage
        localStorage.setItem('snap_lead_manager_search_pending', 'false');
        localStorage.setItem('snap_lead_manager_search_completed', 'true');
        
        // Actualizar el estado visual
        const statusElement = document.getElementById('status-message');
        if (statusElement) {
          statusElement.textContent = `Búsqueda completada. Se encontraron ${resultItems.length} perfiles.`;
          statusElement.style.color = '#4CAF50'; // Verde para indicar éxito
        }
        
        // Actualizar la barra de progreso
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
          progressBar.style.width = '100%';
          progressBar.style.backgroundColor = '#4CAF50'; // Verde para indicar éxito
        }
      }
    }
  } catch (error) {
    console.error('Error al numerar resultados:', error);
  } finally {
    // Siempre desmarcar el proceso de numeración al finalizar
    window.isNumeratingResults = false;
  }
}

// Agregar un observador del DOM optimizado
function setupResultsObserver() {
  // Remover el observer anterior si existe
  if (window.resultsObserver) {
    window.resultsObserver.disconnect();
  }
  
  // Bandera para evitar múltiples ejecuciones durante cambios rápidos
  let isProcessing = false;
  
  // Crear un observador para detectar cuando se añaden los resultados
  const observer = new MutationObserver((mutations) => {
    if (isProcessing) return;
    
    isProcessing = true;
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && 
          document.getElementById('search-results')) {
        setTimeout(() => {
          numerateSearchResults();
          isProcessing = false;
        }, 200);
        return;
      }
    }
    isProcessing = false;
  });
  
  // Iniciar observación del contenedor principal
  const targetNode = document.querySelector('.sidebar-content') || document.body;
  observer.observe(targetNode, { childList: true, subtree: true });
  
  // Guardar referencia para poder desconectarlo más tarde
  window.resultsObserver = observer;
  
  // También ejecutar numeración al cargar la página
  setTimeout(numerateSearchResults, 500);
  
  // Verificar que el resumen de búsqueda esté en localStorage
  console.log('Verificando datos de búsqueda:');
  console.log('search_summary:', localStorage.getItem('snap_lead_manager_search_summary'));
  console.log('search_term:', localStorage.getItem('snap_lead_manager_search_term'));
  console.log('search_data:', localStorage.getItem('snap_lead_manager_search_data'));
}

// Limpiar listeners existentes antes de agregar nuevos
function cleanupEventListeners() {
  // Remover el listener de DOMContentLoaded (aunque solo se dispara una vez)
  document.removeEventListener('DOMContentLoaded', setupResultsObserver);
  
  // Crear una función vacía para los listeners de mensajes que queremos eliminar
  const emptyHandler = function() {};
  
  // Remover cualquier listener existente para mensajes
  window.removeEventListener('message', emptyHandler);
}

// Limpiar y configurar todo
cleanupEventListeners();

// Ejecutar configuración cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupResultsObserver, { once: true });
} else {
  // Si el DOM ya está listo, ejecutar directamente
  setupResultsObserver();
}

// Asegurarse de que solo hay un listener para mensajes
window.addEventListener('message', function(event) {
  if (event.data && event.data.action === 'display_profile_links') {
    displayProfileLinks(event.data.profiles);
    
    // Esperar a que se rendericen los resultados
    setTimeout(numerateSearchResults, 300);
  }
});

// Ejecutar la numeración ahora para elementos ya existentes
numerateSearchResults();

// Eliminar cualquier listener previo si existe
if (window.messageHandler) {
  window.removeEventListener('message', window.messageHandler);
}

// Crear un único manejador de mensajes centralizado
window.messageHandler = function(event) {
  // Verificar que el mensaje viene de una fuente confiable
  if (!event.data || typeof event.data !== 'object') return;
  
  // Manejar diferentes tipos de mensajes
  switch (event.data.action) {
    case 'display_profile_links':
      // Mostrar los enlaces de perfiles
      displayProfileLinks(event.data.profiles);
      
      // Esperar a que se rendericen los resultados y numerarlos
      setTimeout(numerateSearchResults, 300);
      break;
      
    case 'update_status':
      // Actualizar el estado en la UI
      updateStatusUI(event.data.message, event.data.progress);
      break;
      
    case 'update_search_info':
      // Actualizar información de búsqueda
      updateSearchInfo(event.data);
      break;
      
    case 'search_completed':
      // Marcar la búsqueda como completada
      markSearchAsCompleted(event.data.profiles);
      break;
      
    // Otros casos según sea necesario
  }
};

// Registrar el único manejador de mensajes
window.addEventListener('message', window.messageHandler);

// Función para marcar la búsqueda como completada
function markSearchAsCompleted(profiles) {
  console.log('Marcando búsqueda como completada');
  
  // Actualizar el estado en localStorage
  localStorage.setItem('snap_lead_manager_search_pending', 'false');
  localStorage.setItem('snap_lead_manager_search_completed', 'true');
  
  // Actualizar el estado visual
  const statusElement = document.getElementById('status-message');
  if (statusElement) {
    statusElement.textContent = `Búsqueda completada. Se encontraron ${profiles ? profiles.length : 0} perfiles.`;
    statusElement.style.color = '#4CAF50'; // Verde para indicar éxito
  }
  
  // Actualizar la barra de progreso
  const progressBar = document.getElementById('progress-bar');
  if (progressBar) {
    progressBar.style.width = '100%';
    progressBar.style.backgroundColor = '#4CAF50'; // Verde para indicar éxito
  }
}

// Función para mostrar el resumen de búsqueda basado en la información visible
function updateSearchSummary() {
  console.log('Actualizando resumen de búsqueda desde la interfaz');
  
  // Verificar si ya estamos en proceso de actualización para evitar bucles
  if (window.isUpdatingSummary) {
    console.log('Ya hay un proceso de actualización en curso, evitando bucle');
    return;
  }
  
  // Marcar que estamos en proceso de actualización
  window.isUpdatingSummary = true;
  
  try {
    // Obtener la información de búsqueda actual
    const currentSearchTerm = document.getElementById('search-term')?.value || '';
    const currentSearchCity = document.getElementById('search-city')?.value || '';
    
    // Contar resultados actuales
    const resultItems = document.querySelectorAll('#search-results .result-item');
    const totalResults = resultItems.length;
    
    // Obtener el elemento para el resumen (o crearlo si no existe)
    let summaryElement = document.getElementById('results-summary');
    if (!summaryElement) {
      console.log('Creando elemento de resumen de búsqueda');
      const resultsSection = document.querySelector('.results-section');
      
      if (resultsSection) {
        summaryElement = document.createElement('div');
        summaryElement.id = 'results-summary';
        summaryElement.className = 'results-summary';
        
        // Insertarlo después del título de la sección
        const titleElement = resultsSection.querySelector('h2');
        if (titleElement) {
          titleElement.insertAdjacentElement('afterend', summaryElement);
        } else {
          resultsSection.insertBefore(summaryElement, resultsSection.firstChild);
        }
      } else {
        console.log('No se encontró la sección de resultados');
        return;
      }
    }
    
    // Actualizar el contenido del resumen
    summaryElement.innerHTML = `
      <p>
        <strong>Búsqueda:</strong> ${currentSearchTerm || 'No especificado'}<br>
        <strong>Ubicación:</strong> ${currentSearchCity || 'No especificada'}<br>
        <strong>Resultados encontrados:</strong> ${totalResults} perfiles
      </p>
    `;
    
    console.log('Resumen de búsqueda actualizado con éxito');
  } catch (error) {
    console.error('Error al actualizar resumen de búsqueda:', error);
  } finally {
    // Siempre desmarcar el proceso de actualización al finalizar
    window.isUpdatingSummary = false;
  }
}

// Función para actualizar el estado en la UI
function updateStatusUI(message, progress) {
  const statusElement = document.getElementById('status-message');
  const progressBar = document.getElementById('progress-bar');
  
  if (statusElement) {
    statusElement.textContent = message;
  }
  
  if (progressBar) {
    progressBar.style.width = `${progress}%`;
  }
}
