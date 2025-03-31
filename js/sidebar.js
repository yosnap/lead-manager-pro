// Estado global
let state = {
  isRunning: false,
  isPaused: false,
  profiles: [],
  progress: 0,
  statusMessage: 'Listo',
  currentSearchTerm: '',
  currentSearchCity: '',
  currentSearchType: 'people', // Tipo de búsqueda por defecto: personas
  searchStartTime: null,
  logEntries: [], // Almacenar entradas de log para el scroll y los perfiles
  restored: false  // Indicador de si el estado fue restaurado
};

// Referencias a elementos del DOM
let searchTypeSelect;
let searchTermInput;
let searchCityInput;
let cityFilterGroup;
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
  if (statusMessage) {
    statusMessage.textContent = 'Listo';
    statusMessage.className = 'status';
  }
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
    detailedProgressBar.style.width = `${progress}%`;
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
  
  // Enviar actualización de estado a la página principal
  window.parent.postMessage({
    action: 'status_update',
    status: message,
    progress: progress
  }, '*');
}

// Función para actualizar la UI basada en el estado actual
function updateUI() {
  // Verificar que los botones existen antes de modificar sus propiedades
  if (pauseButton) {
    pauseButton.disabled = !state.isRunning;
    pauseButton.textContent = state.isPaused ? 'Reanudar' : 'Pausar';
  }
  
  if (stopButton) {
    stopButton.disabled = !state.isRunning;
  }
  
  // Actualizar operación actual
  if (currentOperation) {
    currentOperation.textContent = state.isRunning 
      ? (state.isPaused ? 'Pausado' : 'En ejecución') 
      : 'Inactivo';
  }
  
  // Actualizar barra de progreso
  if (progressBar) {
    progressBar.style.width = `${state.progress}%`;
  }
  
  // Actualizar información de búsqueda actual
  updateSearchInfo();
}

function updateSearchInfo() {
  if (!currentSearchInfo) return;
  
  if (state.currentSearchTerm) {
    let searchInfoHTML = `<p><strong>Tipo de búsqueda:</strong> ${state.currentSearchType === 'people' ? 'Personas' : 'Grupos'}</p>`;
    searchInfoHTML += `<p><strong>Término de búsqueda:</strong> ${state.currentSearchTerm}</p>`;
    
    if (state.currentSearchCity) {
      searchInfoHTML += `<p><strong>Ciudad:</strong> ${state.currentSearchCity}</p>`;
      
      // Agregar un mensaje de estado para el filtro de ciudad
      const cityFilterApplied = localStorage.getItem('snap_lead_manager_city_filter_applied') === 'true';
      if (cityFilterApplied) {
        searchInfoHTML += `<p class="status success"><i>✓ Filtro de ciudad aplicado correctamente</i></p>`;
      } else {
        searchInfoHTML += `<p class="status"><i>Filtro de ciudad pendiente de aplicar...</i></p>`;
      }
    }
    
    currentSearchInfo.innerHTML = searchInfoHTML;
    currentSearchInfo.style.display = 'block';
  } else {
    currentSearchInfo.style.display = 'none';
  }
}

// Función para realizar la búsqueda
function performSearch() {
  try {
    const searchType = searchTypeSelect.value;
    const searchTerm = searchTermInput.value.trim();
    const searchCity = searchCityInput.value.trim();
    
    if (!searchTerm) {
      throw new Error('Por favor ingresa un término de búsqueda');
    }
    
    // Guardar datos de búsqueda
    state.currentSearchTerm = searchTerm;
    state.currentSearchCity = searchCity;
    state.currentSearchType = searchType;
    
    // Actualizar información de búsqueda
    updateSearchInfo();
    
    // Crear mensaje para enviar a la página con formato unificado
    const searchData = {
      type: searchType,
      term: searchTerm,
      city: searchCity,
      timestamp: Date.now(),
      userInitiated: true // Marcar explícitamente como iniciado por el usuario
    };
    
    // Limpiar cualquier estado de búsqueda previo
    localStorage.removeItem('snap_lead_manager_force_reload');
    localStorage.removeItem('snap_lead_manager_search_url');
    
    // Guardar en localStorage para que el content script pueda acceder
    localStorage.setItem('snap_lead_manager_search_data', JSON.stringify(searchData));
    
    // Reiniciar indicador de filtro aplicado
    localStorage.setItem('snap_lead_manager_city_filter_applied', 'false');
    
    // Registrar la acción en la consola para depuración
    console.log('Iniciando búsqueda con datos:', searchData);
    
    // Enviar mensaje a la página para iniciar búsqueda
    window.parent.postMessage({
      action: 'find_profiles',
      searchData: searchData
    }, '*');
    
    // Actualizar estado
    state.isRunning = true;
    state.isPaused = false;
    state.searchStartTime = Date.now();
    state.profiles = []; // Limpiar resultados anteriores
    
    // Limpiar los resultados previos
    if (searchResultsList) {
      searchResultsList.innerHTML = '';
    }
    if (resultsSummary) {
      resultsSummary.innerHTML = '';
    }
    
    updateStatus(`Iniciando búsqueda de ${searchType === 'people' ? 'personas' : 'grupos'}: ${searchTerm}`, 5);
    updateUI();
    
    // Iniciar verificación del estado
    startStatusChecking();
    
    addLogEntry(`Búsqueda iniciada: ${searchTerm}${searchCity ? ` en ${searchCity}` : ''}`);
    
  } catch (error) {
    console.error('Error al iniciar búsqueda:', error);
    showError(`Error al iniciar búsqueda: ${error.message}`);
    addLogEntry(`Error al iniciar búsqueda: ${error.message}`, true);
  }
}

// Función para pausar/reanudar la búsqueda
function togglePauseSearch() {
  try {
    if (state.isRunning) {
      state.isPaused = !state.isPaused;
      
      // Enviar mensaje a la página
      window.parent.postMessage({
        action: state.isPaused ? 'pause_search' : 'resume_search'
      }, '*');
      
      // Feedback visual inmediato
      updateStatus(state.isPaused ? 'Pausando búsqueda...' : 'Reanudando búsqueda...', state.progress);
      
      // Actualizar UI inmediatamente para dar feedback visual
      pauseButton.textContent = state.isPaused ? 'Reanudar' : 'Pausar';
      
      // Actualización completa de la interfaz
      updateUI();
      
      // Agregar entrada en el log
      addLogEntry(state.isPaused ? 'Búsqueda pausada por el usuario' : 'Búsqueda reanudada por el usuario');
      
      // Feedback visual adicional
      if (state.isPaused) {
        pauseButton.classList.add('paused');
        if (currentOperation) currentOperation.textContent = 'Pausado';
      } else {
        pauseButton.classList.remove('paused');
        if (currentOperation) currentOperation.textContent = 'En ejecución';
      }
      
      console.log(`Búsqueda ${state.isPaused ? 'pausada' : 'reanudada'} correctamente`);
      
      return true;
    } else {
      console.warn('No hay búsqueda en curso para pausar/reanudar');
      return false;
    }
  } catch (error) {
    console.error('Error al pausar/reanudar búsqueda:', error);
    showError(`Error: ${error.message}`);
    addLogEntry(`Error al pausar/reanudar búsqueda: ${error.message}`, true);
    return false;
  }
}

// Función para detener la búsqueda
function stopSearch() {
  try {
    if (!state.isRunning) {
      console.warn('No hay búsqueda en curso para detener');
      return false;
    }
    
    // Mensaje visual inmediato
    addLogEntry('Deteniendo búsqueda...');
    
    // Enviar mensaje a la página para detener la búsqueda
    window.parent.postMessage({
      action: 'stop_search'
    }, '*');
    
    // Actualizar estado inmediatamente para retroalimentación visual
    state.isRunning = false;
    state.isPaused = false;
    
    // Detener verificación de estado
    stopStatusChecking();
    
    // Reset UI
    updateStatus('Búsqueda detenida por el usuario', 0);
    pauseButton.disabled = true;
    pauseButton.textContent = 'Pausar';
    pauseButton.classList.remove('paused');
    stopButton.disabled = true;
    
    // Actualización completa de la interfaz
    updateUI();
    
    // Agregar entrada en el log
    addLogEntry('Búsqueda detenida por el usuario');
    
    console.log('Búsqueda detenida correctamente');
    return true;
  } catch (error) {
    console.error('Error al detener búsqueda:', error);
    showError(`Error al detener búsqueda: ${error.message}`);
    addLogEntry(`Error al detener búsqueda: ${error.message}`, true);
    return false;
  }
}

// Función para actualizar la lista de resultados
function updateResultsList(profiles) {
  if (!searchResultsList) return;
  
  // Registrar lo que estamos recibiendo
  console.log('Actualizando lista de resultados con:', profiles);
  
  // Limpiar lista de resultados
  searchResultsList.innerHTML = '';
  
  // Actualizar el resumen de resultados
  if (resultsSummary) {
    resultsSummary.innerHTML = `<p>Se encontraron <strong>${profiles.length}</strong> ${state.currentSearchType === 'people' ? 'perfiles' : 'grupos'}</p>`;
  }
  
  // Si no hay perfiles, mostrar mensaje
  if (!profiles || profiles.length === 0) {
    if (resultsSummary) {
      resultsSummary.innerHTML = `<p>Se encontraron <strong>0</strong> ${state.currentSearchType === 'people' ? 'perfiles' : 'grupos'}</p>`;
    }
    
    const emptyMessage = document.createElement('li');
    emptyMessage.className = 'result-empty';
    emptyMessage.textContent = `No se encontraron ${state.currentSearchType === 'people' ? 'perfiles' : 'grupos'} para esta búsqueda.`;
    searchResultsList.appendChild(emptyMessage);
    return;
  }
  
  // Agregar cada perfil a la lista
  profiles.forEach((profile, index) => {
    const listItem = document.createElement('li');
    listItem.className = 'result-item';
    
    // Determinar el tipo de resultado (persona o grupo)
    const isPerson = !profile.groupUrl;
    
    // Crear contenido del item
    let htmlContent = `
      <div class="result-header">
        <span class="result-name">${profile.name || 'Sin nombre'}</span>
        <a href="${isPerson ? (profile.profileUrl || '#') : (profile.groupUrl || '#')}" target="_blank" class="result-link">Ver</a>
      </div>
      <div class="result-info">
    `;
    
    // Agregar información adicional según el tipo
    if (isPerson) {
      if (profile.location) htmlContent += `<div>📍 ${profile.location}</div>`;
      if (profile.occupation) htmlContent += `<div>💼 ${profile.occupation}</div>`;
    } else {
      if (profile.groupType) htmlContent += `<div>🔒 ${profile.groupType}</div>`;
      if (profile.members) htmlContent += `<div>👥 ${profile.members}</div>`;
      if (profile.frequency) htmlContent += `<div>📊 ${profile.frequency}</div>`;
    }
    
    htmlContent += `</div>`;
    
    listItem.innerHTML = htmlContent;
    searchResultsList.appendChild(listItem);
  });
}

// Función para abrir en ventana separada
function openInWindow() {
  // Solicitar al script de fondo que abra una ventana con el sidebar
  window.parent.postMessage({
    action: 'open_in_window'
  }, '*');
}

// Inicializar referencias a elementos DOM
function initDOMReferences() {
  searchTypeSelect = document.getElementById('search-type');
  searchTermInput = document.getElementById('search-term');
  searchCityInput = document.getElementById('search-city');
  cityFilterGroup = document.getElementById('city-filter-group');
  searchButton = document.getElementById('search-button');
  pauseButton = document.getElementById('pause-button');
  stopButton = document.getElementById('stop-button');
  statusMessage = document.getElementById('status-message');
  progressBar = document.getElementById('progress-bar');
  searchResultsList = document.getElementById('search-results');
  currentSearchInfo = document.getElementById('current-search-info');
  openWindowButton = document.getElementById('open-window-btn');
  
  // Elementos detallados
  searchStatusContainer = document.getElementById('search-status-container');
  detailedStatusMessage = document.getElementById('detailed-status-message');
  detailedProgressBar = document.getElementById('detailed-progress-bar');
  progressPercentage = document.getElementById('progress-percentage');
  currentOperation = document.getElementById('current-operation');
  elapsedTime = document.getElementById('elapsed-time');
  scrollLogContainer = document.getElementById('scroll-log-container');
  resultsSummary = document.getElementById('results-summary');
}

// Función para manejar el cambio de tipo de búsqueda
function handleSearchTypeChange() {
  const searchType = searchTypeSelect.value;
  state.currentSearchType = searchType;
  
  // Actualizar el placeholder según el tipo
  if (searchTermInput) {
    searchTermInput.placeholder = searchType === 'people' 
      ? 'Nombre, profesión, etc.' 
      : 'Nombre o temática del grupo';
  }
  
  // Actualizar placeholder de ciudad
  if (searchCityInput) {
    searchCityInput.placeholder = searchType === 'people'
      ? 'Ej: Madrid, Barcelona'
      : 'Filtrar grupos por ciudad';
  }
}

// Manejador de mensajes recibidos de la página
function handleReceivedMessage(event) {
  const message = event.data;
  
  if (!message || !message.action) return;
  
  // No loggear status_update para evitar spam en consola
  if (message.action !== 'status_update') {
    console.log('Mensaje recibido:', message.action);
  }
  
  switch (message.action) {
    case 'search_result':
      if (message.result) {
        console.log('Recibido search_result:', message.result);
        
        // Aceptar tanto 'profiles' como 'results' para compatibilidad con ambos tipos de búsqueda
        const results = message.result.profiles || message.result.results || [];
        state.profiles = results;
        
        // Actualizar la cuenta global
        state.foundCount = results.length;
        
        // Actualizar la lista de resultados
        updateResultsList(state.profiles);
        
        // Mostrar mensaje personalizado si hay uno
        if (message.result.message) {
          addLogEntry(message.result.message);
        } else {
          addLogEntry(`Se encontraron ${state.profiles.length} ${state.currentSearchType === 'people' ? 'perfiles' : 'grupos'}.`);
        }
        
        if (message.result.success) {
          state.isRunning = false;
          state.isPaused = false;
          updateStatus('Búsqueda completada', 100);
          updateUI();
        }
      }
      break;
    
    // Mensaje explícito de que la búsqueda ha terminado
    case 'search_complete':
      state.isRunning = false;
      state.isPaused = false;
      state.progress = 100;
      updateStatus('Búsqueda completada', 100);
      
      // Detener cualquier actualización de estado
      clearInterval(state.statusUpdateInterval);
      
      // Actualizar la UI
      updateUI();
      break;
    
    // Nueva acción para manejar resultados enviados con 'found_results'
    case 'found_results':
      if (message.results) {
        console.log('Recibido found_results:', message.results);
        state.profiles = message.results;
        state.foundCount = message.results.length;
        updateResultsList(state.profiles);
      }
      break;
    
    case 'status_update':
      updateStatus(message.status || 'Actualizando...', message.progress || state.progress);
      break;
    
    case 'filter_status_update':
      // Actualizar el estado del filtro de ciudad en la UI
      if (message.filterApplied && state.currentSearchCity) {
        const filterStatusElement = document.querySelector('#current-search-info p.status i');
        if (filterStatusElement) {
          filterStatusElement.textContent = '✓ Filtro de ciudad aplicado correctamente';
          filterStatusElement.parentElement.className = 'status success';
        }
        localStorage.setItem('snap_lead_manager_city_filter_applied', 'true');
      }
      break;
      
    case 'pause_result':
      // Confirmar que la pausa fue procesada
      if (message.result && message.result.success) {
        // Asegurarse de que el estado refleje la pausa
        if (!state.isPaused && pauseButton.textContent === 'Reanudar') {
          state.isPaused = true;
          updateUI();
          addLogEntry('Búsqueda pausada confirmada');
        }
      }
      break;
      
    case 'resume_result':
      // Confirmar que se reanudó la búsqueda
      if (message.result && message.result.success) {
        // Asegurarse de que el estado refleje la reanudación
        if (state.isPaused && pauseButton.textContent === 'Pausar') {
          state.isPaused = false;
          updateUI();
          addLogEntry('Búsqueda reanudada confirmada');
        }
      }
      break;
      
    case 'stop_result':
      // Confirmar que se detuvo la búsqueda
      if (message.result && message.result.success) {
        // Asegurarse de que el estado refleje la detención
        state.isRunning = false;
        state.isPaused = false;
        state.progress = 0;
        updateStatus('Búsqueda detenida', 0);
        updateUI();
        addLogEntry('Búsqueda detenida confirmada');
      }
      break;
      
    case 'sidebar_ready':
      // El content script nos informa que está listo para recibir mensajes
      console.log('Conexión con content script establecida');
      break;
  }
}

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar referencias
  initDOMReferences();
  
  // Añadir estilos CSS adicionales para estados de botones
  const style = document.createElement('style');
  style.textContent = `
    .btn.paused {
      background-color: #f0ad4e;
      color: white;
    }
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `;
  document.head.appendChild(style);
  
  // Configurar manejadores de eventos
  if (searchTypeSelect) {
    searchTypeSelect.addEventListener('change', handleSearchTypeChange);
    handleSearchTypeChange(); // Aplicar configuración inicial
  }
  
  if (searchButton) {
    searchButton.addEventListener('click', performSearch);
  }
  
  if (pauseButton) {
    pauseButton.addEventListener('click', togglePauseSearch);
    pauseButton.disabled = !state.isRunning; // Inicialmente deshabilitado
  }
  
  if (stopButton) {
    stopButton.addEventListener('click', stopSearch);
    stopButton.disabled = !state.isRunning; // Inicialmente deshabilitado
  }
  
  if (openWindowButton) {
    openWindowButton.addEventListener('click', openInWindow);
  }
  
  // Configurar manejo de tecla Enter en inputs
  if (searchTermInput) {
    searchTermInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        performSearch();
      }
    });
  }
  
  if (searchCityInput) {
    searchCityInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        performSearch();
      }
    });
  }
  
  // Restaurar datos de búsqueda guardados si existen
  const savedSearchData = localStorage.getItem('snap_lead_manager_search_data');
  if (savedSearchData) {
    try {
      const searchData = JSON.parse(savedSearchData);
      
      // Actualizar campos de formulario
      if (searchData.term && searchTermInput) {
        searchTermInput.value = searchData.term;
        state.currentSearchTerm = searchData.term;
      }
      
      if (searchData.city && searchCityInput) {
        searchCityInput.value = searchData.city;
        state.currentSearchCity = searchData.city;
      }
      
      if (searchData.type && searchTypeSelect) {
        searchTypeSelect.value = searchData.type;
        state.currentSearchType = searchData.type;
        handleSearchTypeChange();
      }
      
      // Actualizar información de búsqueda
      updateSearchInfo();
    } catch (error) {
      console.error('Error al restaurar datos de búsqueda:', error);
    }
  }
  
  // Revisar si hay búsqueda en curso
  getSearchStatus();
  
  // Notificar que el sidebar está listo
  window.parent.postMessage({
    action: 'sidebar_ready'
  }, '*');
  
  updateUI();
});

// Función para obtener el estado actual de búsqueda
function getSearchStatus() {
  window.parent.postMessage({
    action: 'get_search_status'
  }, '*');
}

// Inicializar un identificador para el intervalo
state.statusUpdateInterval = null;

// Función para iniciar la verificación periódica del estado
function startStatusChecking() {
  // Limpiar cualquier intervalo existente
  if (state.statusUpdateInterval) {
    clearInterval(state.statusUpdateInterval);
  }
  
  // Solo iniciar si está en búsqueda activa
  if (state.isRunning) {
    state.statusUpdateInterval = setInterval(getSearchStatus, 3000);
    console.log('Iniciada verificación periódica de estado');
  }
}

// Función para detener la verificación periódica
function stopStatusChecking() {
  if (state.statusUpdateInterval) {
    clearInterval(state.statusUpdateInterval);
    state.statusUpdateInterval = null;
    console.log('Detenida verificación periódica de estado');
  }
}

// Actualizar cuando cambia el estado de búsqueda
function updateSearchStatus(isRunning) {
  if (isRunning && !state.statusUpdateInterval) {
    startStatusChecking();
  } else if (!isRunning && state.statusUpdateInterval) {
    stopStatusChecking();
  }
}

// Configurar listener para mensajes
window.addEventListener('message', handleReceivedMessage);
