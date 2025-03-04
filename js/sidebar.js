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
let startButton;
let stopButton;
let pauseButton;
let statusMessage;
let progressBar;
let searchResultsList;
let currentSearchInfo;
let toggleSidebarButton;
let applyFiltersButton;

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
        action: 'update_status',
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
  if (startButton) {
    startButton.disabled = state.isRunning && !state.isPaused;
  }
  
  if (pauseButton) {
    pauseButton.disabled = !state.isRunning || state.isPaused;
  }
  
  if (stopButton) {
    stopButton.disabled = !state.isRunning;
  }
  
  // Actualizar operación actual
  if (currentOperation) {
    currentOperation.textContent = state.isRunning 
      ? (state.isPaused ? "Pausado" : "Ejecutando") 
      : "Inactivo";
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
    
    // Ocultar cualquier error previo
    clearError();
    
    // Actualizar estado de la UI
    state.searchStartTime = new Date();
    
    // Limpiar log y resultados
    state.logEntries = [];
    state.profiles = [];
    
    // Actualizar UI
    updateUI();
    updateResultsList([]);
    updateScrollLog();
    
    // Mostrar panel de detalles
    if (searchStatusContainer) {
      searchStatusContainer.style.display = 'block';
    } else {
      console.warn('searchStatusContainer no está disponible');
    }
    
    updateStatus('Iniciando búsqueda...', 5);
    addLogEntry(`Iniciando búsqueda de "${searchTerm}" ${searchCity ? `en ${searchCity}` : ''}`);
    
    // Crear el objeto de datos de búsqueda
    const searchData = {
      term: searchTerm,
      city: searchCity
    };
    
    // Almacenar los datos de búsqueda en el estado
    state.currentSearchTerm = searchTerm;
    state.currentSearchCity = searchCity;
    
    // Actualizar el display de info de búsqueda
    updateSearchInfo();
    
    // Enviar mensaje al script de fondo para iniciar la búsqueda
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      try {
        console.log('Enviando solicitud de búsqueda al background...', {
          searchTerm,
          searchData
        });
        
        chrome.runtime.sendMessage({
          action: 'search',
          searchTerm: searchTerm,
          searchData: searchData
        }, function(response) {
          // Verifica si hay un error de runtime
          if (chrome.runtime.lastError) {
            const errorMsg = chrome.runtime.lastError.message;
            console.error('Error de runtime al enviar mensaje:', errorMsg);
            addLogEntry(`Error de comunicación: ${errorMsg}`, true);
            showError(`Error de comunicación: ${errorMsg}`);
            return;
          }
          
          console.log('Respuesta recibida:', response);
          
          if (response && response.success) {
            console.log('Búsqueda iniciada con éxito');
            addLogEntry('Búsqueda iniciada con éxito, navegando a Facebook...');
            
            // Registrar que estamos usando filtro de ciudad
            if (searchCity) {
              addLogEntry(`Utilizando filtro de ciudad: "${searchCity}"`);
            }
          } else {
            const errorMsg = response?.error || 'Acción no reconocida';
            console.error('Error al iniciar búsqueda:', errorMsg);
            addLogEntry(`Error al iniciar búsqueda: ${errorMsg}`, true);
            showError(`Error: ${errorMsg}`);
          }
        });
      } catch (error) {
        console.error('Error al enviar mensaje de búsqueda:', error);
        addLogEntry(`Error: ${error.message}`, true);
        showError(`Error: ${error.message}`);
      }
    } else {
      // Si chrome.runtime.sendMessage no está disponible, intentamos con window.parent.postMessage
      console.warn('chrome.runtime.sendMessage no está disponible, utilizando postMessage');
      
      try {
        window.parent.postMessage({
          from: 'snap-lead-manager',
          action: 'search',
          searchTerm: searchTerm,
          data: searchData
        }, '*');
        
        console.log('Mensaje de búsqueda enviado vía postMessage:', searchTerm, searchData);
        addLogEntry('Solicitud de búsqueda enviada al contenido principal');
      } catch (error) {
        console.error('Error al enviar mensaje vía postMessage:', error);
        addLogEntry(`Error: ${error.message}`, true);
        showError(`Error: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error en la búsqueda:', error);
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
  if (!state.isRunning) return;
  
  try {
    updateStatus('Deteniendo proceso...', state.progress);
    
    const response = await chrome.runtime.sendMessage({
      action: 'stop'
    });
    
    if (response && response.success) {
      updateStatus('Proceso detenido', 0);
      state.isRunning = false;
      state.isPaused = false;
      updateUI();
    } else {
      throw new Error(response?.message || 'Error al detener el proceso');
    }
  } catch (error) {
    console.error('Error al detener:', error);
    showError('Error: ' + error.message);
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

// Función para alternar la visibilidad del sidebar
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar-container');
  sidebar.classList.toggle('collapsed');
  
  if (sidebar.classList.contains('collapsed')) {
    toggleSidebarButton.textContent = 'Mostrar';
  } else {
    toggleSidebarButton.textContent = 'Ocultar';
  }
}

// Listener para mensajes del iframe
window.addEventListener('message', (event) => {
  // Solo procesar mensajes de nuestro iframe
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
  applyFiltersButton = document.getElementById('apply-filters-button');
  startButton = document.getElementById('start-button');
  pauseButton = document.getElementById('pause-button');
  stopButton = document.getElementById('stop-button');
  toggleSidebarButton = document.getElementById('toggle-sidebar');
  statusMessage = document.getElementById('status-message');
  progressBar = document.getElementById('progress-bar');
  searchResults = document.getElementById('search-results');
  searchResultsList = document.getElementById('search-results-list');
  currentSearchInfo = document.getElementById('current-search-info');
  
  // Elementos detallados
  searchStatusContainer = document.getElementById('search-status-container'); // Asegurarse de que el ID sea correcto
  statusContainer = document.getElementById('status-container');
  controlsContainer = document.getElementById('controls-container');
  logContainer = document.getElementById('log-container');
  logList = document.getElementById('log-list');
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
    startButton: !!startButton,
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
  applyFiltersButton = document.getElementById('apply-filters-button');
  startButton = document.getElementById('start-button');
  stopButton = document.getElementById('stop-button');
  pauseButton = document.getElementById('pause-button');
  toggleSidebarButton = document.getElementById('toggle-sidebar');
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
      performSearch();
    } catch (error) {
      console.error('Error al ejecutar búsqueda:', error);
      addLogEntry('Error en la búsqueda: ' + error.message, true);
      showError('Error: ' + error.message);
    }
  });
  
  // Event listener para botón de aplicar filtros
  applyFiltersButton.addEventListener('click', () => {
    const currentCity = searchCityInput.value.trim();
    
    if (!currentCity) {
      showError('Por favor, ingresa una ciudad para aplicar el filtro');
      return;
    }
    
    console.log('Solicitando aplicar filtro de ciudad:', currentCity);
    
    // Actualizar los datos de búsqueda en localStorage
    const searchTerm = searchTermInput.value.trim() || localStorage.getItem('snap_lead_manager_search_term') || '';
    const searchData = {
      city: currentCity
    };
    
    localStorage.setItem('snap_lead_manager_search_term', searchTerm);
    localStorage.setItem('snap_lead_manager_search_data', JSON.stringify(searchData));
    
    // Resetear el indicador de filtro aplicado
    localStorage.setItem('snap_lead_manager_city_filter_applied', 'false');
    
    // Mostrar información actualizada
    currentSearchInfo.innerHTML = `
      <strong>Búsqueda actual:</strong> ${searchTerm}
      <br><strong>Ciudad:</strong> ${currentCity}
      <br><em>Aplicando filtro de ciudad...</em>
    `;
    currentSearchInfo.style.display = 'block';
    
    // Enviar mensaje para aplicar los filtros
    window.parent.postMessage({
      from: 'snap-lead-manager',
      action: 'apply_filters'
    }, '*');
    
    console.log('Mensaje para aplicar filtros enviado');
  });
  
  // Event listeners para botones de control
  startButton.addEventListener('click', () => {
    console.log('Botón inicio presionado');
    window.parent.postMessage({
      from: 'snap-lead-manager',
      action: 'start'
    }, '*');
  });
  
  pauseButton.addEventListener('click', () => {
    console.log('Botón pausa presionado');
    window.parent.postMessage({
      from: 'snap-lead-manager',
      action: 'pause'
    }, '*');
  });
  
  stopButton.addEventListener('click', () => {
    console.log('Botón detener presionado');
    window.parent.postMessage({
      from: 'snap-lead-manager',
      action: 'stop'
    }, '*');
  });
  
  // Event listener para botón de toggle
  toggleSidebarButton.addEventListener('click', () => {
    console.log('Botón toggle presionado');
    window.parent.postMessage({
      from: 'snap-lead-manager',
      action: 'toggle_sidebar'
    }, '*');
  });
  
  // Verificar estado inicial
  chrome.runtime.sendMessage({ action: 'get_status' }, (response) => {
    if (response) {
      updateUIStatus(response);
    }
  });
  
  // Función para actualizar el estado en la UI
  function updateUIStatus(status) {
    if (status.isRunning) {
      startButton.disabled = true;
      pauseButton.disabled = false;
      stopButton.disabled = false;
      
      if (status.isPaused) {
        statusMessage.textContent = 'Pausado: ' + status.message;
        pauseButton.textContent = 'Reanudar';
      } else {
        statusMessage.textContent = status.message || 'Procesando...';
        pauseButton.textContent = 'Pausar';
      }
    } else {
      startButton.disabled = false;
      pauseButton.disabled = true;
      stopButton.disabled = true;
      statusMessage.textContent = status.message || 'Listo para comenzar';
    }
    
    // Actualizar barra de progreso
    if (status.progress !== undefined) {
      progressBar.style.width = `${status.progress}%`;
    }
    
    // Si hay un error, mostrarlo
    if (status.error) {
      showError(status.message || 'Error en la operación');
    }
  }
});
