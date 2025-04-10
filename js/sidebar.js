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
  restored: false,  // Indicador de si el estado fue restaurado
  
  // Opciones generales con valores por defecto
  maxScrolls: 50,
  scrollDelay: 2,
  
  // Opciones para grupos con valores por defecto
  groupOptions: {
    publicGroups: true,
    privateGroups: true,
    minUsers: 1000,
    minPostsYear: '1000',
    minPostsMonth: '100',
    minPostsDay: '5'
  },
  
  // Criterios guardados
  savedCriteria: [],
  
  // Criterio actual que se está editando (si existe)
  editingCriteriaId: null
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
let openWindowButton;

// Referencias a elementos de UI detallada
let searchStatusContainer;
let detailedStatusMessage;
let detailedProgressBar;
let progressPercentage;
let currentOperation;
let elapsedTime;
let scrollLogContainer;
let resultsSummary;

// Referencias a elementos de configuración avanzada
let collapsibleTrigger;
let collapsibleContent;
let maxScrollsInput;
let scrollDelayInput;
let groupOptionsContainer;
let publicGroupsCheckbox;
let privateGroupsCheckbox;
let minUsersInput;
let minPostsYearInput;
let minPostsMonthInput;
let minPostsDayInput;

// Referencias a gestión de criterios
let clearCriteriaButton;
let saveCriteriaButton;
let cancelEditButton;
let manageCriteriaButton;
let saveCriteriaModal;
let criteriaNameInput;
let criteriaNameError;
let confirmSaveButton;
let cancelSaveButton;
let manageCriteriaModal;
let savedCriteriaList;
let closeManageCriteriaButton;

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

function updateStatus(message, progress = state.progress, isError = false, configInfo = null) {
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
    
    // Si no tenemos información de configuración, intentar obtenerla del estado y localStorage
    if (!configInfo) {
      try {
        const generalOptions = JSON.parse(localStorage.getItem('snap_lead_manager_general_options') || '{}');
        configInfo = {
          maxScrolls: generalOptions.maxScrolls || state.maxScrolls || 50,
          scrollDelay: generalOptions.scrollDelay || state.scrollDelay || 2
        };
      } catch(e) {
        console.warn('No se pudo obtener información de configuración:', e);
      }
    }
    
    // Si tenemos información de configuración, mostrarla en el mensaje detallado
    if (configInfo && detailedStatusMessage) {
      const configText = `Configuración: ${configInfo.maxScrolls} scrolls máx., ${configInfo.scrollDelay}s entre scrolls`;
      
      // Agregar información de configuración si no existe
      if (!detailedStatusMessage.querySelector('.config-info')) {
        const configSpan = document.createElement('span');
        configSpan.className = 'config-info';
        configSpan.style.display = 'block';
        configSpan.style.fontSize = '12px';
        configSpan.style.color = '#666';
        configSpan.style.marginTop = '4px';
        configSpan.textContent = configText;
        detailedStatusMessage.appendChild(configSpan);
      } else {
        detailedStatusMessage.querySelector('.config-info').textContent = configText;
      }
    }
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
    progress: progress,
    config: configInfo
  }, '*');
}

// Función para actualizar la UI basada en el estado actual
function updateUI() {
  // Verificar que los botones existen antes de modificar sus propiedades
  if (pauseButton) {
    // Activar botón de pausa durante la búsqueda
    pauseButton.disabled = !state.isRunning;
    pauseButton.textContent = state.isPaused ? 'Reanudar' : 'Pausar';
    
    // Cambiar estilo visual según el estado
    if (state.isPaused) {
      pauseButton.classList.add('paused');
    } else {
      pauseButton.classList.remove('paused');
    }
  }
  
  if (stopButton) {
    // Activar botón de detener durante la búsqueda
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
  
  // Deshabilitar botones de búsqueda mientras se ejecuta una búsqueda
  if (searchButton) {
    searchButton.disabled = state.isRunning;
  }
  
  // Deshabilitar campos de entrada durante la búsqueda
  if (searchTermInput) {
    searchTermInput.disabled = state.isRunning;
  }
  
  if (searchCityInput) {
    searchCityInput.disabled = state.isRunning;
  }
  
  if (searchTypeSelect) {
    searchTypeSelect.disabled = state.isRunning;
  }
  
  // Deshabilitar opciones avanzadas durante la búsqueda
  if (collapsibleTrigger) {
    collapsibleTrigger.disabled = state.isRunning;
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
    
    // Añadir clase para indicar que la búsqueda está activa
    document.body.classList.add('search-active');
    
    // Crear mensaje para enviar a la página con formato unificado
    const searchData = {
      type: searchType,
      term: searchTerm,
      city: searchCity,
      timestamp: Date.now(),
      userInitiated: true // Marcar explícitamente como iniciado por el usuario
    };
    
    // Agregar opciones generales - convertir explícitamente a números
    const maxScrollsValue = parseInt(maxScrollsInput.value, 10);
    const scrollDelayValue = parseFloat(scrollDelayInput.value);
    
    searchData.maxScrolls = isNaN(maxScrollsValue) ? 50 : maxScrollsValue;
    searchData.scrollDelay = isNaN(scrollDelayValue) ? 2 : scrollDelayValue;
    
    console.log('Opciones configuradas - maxScrolls:', searchData.maxScrolls, 'scrollDelay:', searchData.scrollDelay);
    
    // Guardar en el estado
    state.maxScrolls = searchData.maxScrolls;
    state.scrollDelay = searchData.scrollDelay;
    
    // Si es búsqueda de grupos, agregar opciones específicas
    if (searchType === 'groups') {
      // Obtener valores de los campos y permitir valores vacíos
      const minUsersValue = minUsersInput.value.trim() === '' ? '' : (parseInt(minUsersInput.value, 10) || 0);
      const minPostsYearValue = minPostsYearInput.value.trim() === '' ? '' : (parseInt(minPostsYearInput.value, 10) || 0);
      const minPostsMonthValue = minPostsMonthInput.value.trim() === '' ? '' : (parseInt(minPostsMonthInput.value, 10) || 0);
      const minPostsDayValue = minPostsDayInput.value.trim() === '' ? '' : (parseInt(minPostsDayInput.value, 10) || 0);
      
      // Verificar que al menos hay un valor de usuarios
      if (minUsersValue === '') {
        throw new Error('Por favor ingresa una cantidad mínima de usuarios para filtrar grupos');
      }
      
      const groupOptions = {
        publicGroups: publicGroupsCheckbox.checked,
        privateGroups: privateGroupsCheckbox.checked,
        minUsers: minUsersValue,
        minPostsYear: minPostsYearValue,
        minPostsMonth: minPostsMonthValue,
        minPostsDay: minPostsDayValue
      };
      
      searchData.groupOptions = groupOptions;
      state.groupOptions = groupOptions;
      
      // Agregar información del filtro y explicación sobre cómo se aplica
      console.log('Criterios de filtrado para grupos:', {
        'Mínimo de usuarios': minUsersValue,
        'Mínimo publicaciones por año': minPostsYearValue,
        'Mínimo publicaciones por mes': minPostsMonthValue,
        'Mínimo publicaciones por día': minPostsDayValue,
        'Lógica aplicada': 'Debe cumplir mínimo de usuarios Y cualquiera de los mínimos de publicaciones'
      });
      
      // Guardar estas opciones también en chrome.storage.local para acceso desde el background script
      try {
        // Guardar TODAS las opciones en chrome.storage.local
        chrome.storage.local.set({
          // Opciones de configuración general
          maxScrolls: maxScrollsValue,
          scrollDelay: scrollDelayValue,
          // Opciones específicas para grupos
          groupPublic: publicGroupsCheckbox.checked,
          groupPrivate: privateGroupsCheckbox.checked,
          minUsers: minUsersValue,
          minPostsYear: minPostsYearValue,
          minPostsMonth: minPostsMonthValue,
          minPostsDay: minPostsDayValue
        });
        
        console.log('Opciones guardadas correctamente en chrome.storage.local:', {
          maxScrolls: maxScrollsValue,
          scrollDelay: scrollDelayValue,
          groupPublic: publicGroupsCheckbox.checked,
          groupPrivate: privateGroupsCheckbox.checked,
          minUsers: minUsersValue,
          minPostsYear: minPostsYearValue,
          minPostsMonth: minPostsMonthValue,
          minPostsDay: minPostsDayValue
        });
      } catch (e) {
        console.warn('No se pudieron guardar las opciones en chrome.storage:', e);
      }
    }
    
    // Limpiar cualquier estado de búsqueda previo
    localStorage.removeItem('snap_lead_manager_force_reload');
    localStorage.removeItem('snap_lead_manager_search_url');
    
    // Guardar en localStorage para que el content script pueda acceder
    // Asegurarse de que los valores numéricos sean tratados correctamente
    localStorage.setItem('snap_lead_manager_search_data', JSON.stringify(searchData));
    
    // Guardar opciones generales como números explícitamente
    const generalOptions = {
      maxScrolls: Number(searchData.maxScrolls),
      scrollDelay: Number(searchData.scrollDelay)
    };
    
    console.log('Guardando opciones generales en localStorage:', generalOptions);
    localStorage.setItem('snap_lead_manager_general_options', JSON.stringify(generalOptions));
    
    if (searchType === 'groups') {
      localStorage.setItem('snap_lead_manager_group_options', JSON.stringify(searchData.groupOptions));
      
      // Guardar las opciones de grupo en una tabla específica para sincronización posterior
      try {
        const groupOptionsForSync = {
          ...searchData.groupOptions,
          timestamp: Date.now(),
          searchTerm: searchTerm,
          searchType: searchType,
          maxScrolls: Number(searchData.maxScrolls),
          scrollDelay: Number(searchData.scrollDelay)
        };
        
        // Guardar para sincronización futura con base de datos
        localStorage.setItem('snap_lead_manager_group_options_for_sync', JSON.stringify(groupOptionsForSync));
        
        // Preparar datos para enviar posteriormente a la base de datos
        prepareDataForDatabase(groupOptionsForSync);
        
        // Loggear las opciones guardadas para debugging
        console.log('Opciones de grupo guardadas para sincronización:', groupOptionsForSync);
      } catch (error) {
        console.error('Error al guardar opciones para sincronización:', error);
      }
    }
    
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
    
    // Guardar indicador de búsqueda activa
    localStorage.setItem('snap_lead_manager_search_active', 'true');
    
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
        
        // Cambiar apariencia del botón de pausa
        pauseButton.style.backgroundColor = '#f0ad4e';
        pauseButton.style.color = 'white';
      } else {
        pauseButton.classList.remove('paused');
        if (currentOperation) currentOperation.textContent = 'En ejecución';
        
        // Restaurar apariencia del botón de pausa
        pauseButton.style.backgroundColor = '';
        pauseButton.style.color = '';
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
    
    // Guardar indicador de búsqueda inactiva
    localStorage.setItem('snap_lead_manager_search_active', 'false');
    
    // Detener verificación de estado
    stopStatusChecking();
    
    // Reset UI
    updateStatus('Búsqueda detenida por el usuario', 0);
    pauseButton.disabled = true;
    pauseButton.textContent = 'Pausar';
    pauseButton.classList.remove('paused');
    stopButton.disabled = true;
    
    // Remover clase search-active
    document.body.classList.remove('search-active');
    
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

// Funciones para la gestión de criterios de búsqueda

// Limpiar los criterios de búsqueda actuales
function clearSearchCriteria() {
  // Limpiar campos de entrada
  searchTermInput.value = '';
  searchCityInput.value = '';
  
  // Restablecer opciones generales a valores por defecto
  maxScrollsInput.value = '50';
  scrollDelayInput.value = '2';
  
  // Restablecer opciones de grupo a valores por defecto
  publicGroupsCheckbox.checked = true;
  privateGroupsCheckbox.checked = true;
  minUsersInput.value = '0';
  minPostsYearInput.value = '0';
  minPostsMonthInput.value = '0';
  minPostsDayInput.value = '0';
  
  // Limpiar estado
  state.currentSearchTerm = '';
  state.currentSearchCity = '';
  
  // Actualizar estado visual
  updateSearchInfo();
  
  // Mostrar mensaje de confirmación
  showTemporaryMessage('Criterios de búsqueda limpiados');
}

// Mostrar modal para guardar criterios
function showSaveCriteriaModal() {
  if (!searchTermInput.value.trim()) {
    showError('Debes ingresar al menos un término de búsqueda para guardar');
    return;
  }
  
  // Si estamos editando, no mostrar el modal y actualizar directamente
  if (state.editingCriteriaId) {
    updateExistingCriteria();
    return;
  }
  
  // De lo contrario, mostrar el modal para ingresar un nombre
  criteriaNameInput.value = '';
  criteriaNameError.textContent = '';
  saveCriteriaModal.style.display = 'block';
}

// Actualizar un criterio existente que está siendo editado
function updateExistingCriteria() {
  console.log('Actualizando criterio existente, ID:', state.editingCriteriaId);
  // Buscar el criterio que estamos editando
  const criteriaIndex = state.savedCriteria.findIndex(c => c.id === state.editingCriteriaId);
  
  if (criteriaIndex === -1) {
    showError('No se encontró el criterio que estás editando');
    console.error('No se encontró el criterio ID:', state.editingCriteriaId);
    return;
  }
  
  const originalCriteria = state.savedCriteria[criteriaIndex];
  console.log('Criterio original:', originalCriteria);
  
  // Obtener valores de los campos y permitir valores vacíos
  const minUsersValue = minUsersInput.value.trim() === '' ? '' : (parseInt(minUsersInput.value, 10) || 0);
  const minPostsYearValue = minPostsYearInput.value.trim() === '' ? '' : (parseInt(minPostsYearInput.value, 10) || 0);
  const minPostsMonthValue = minPostsMonthInput.value.trim() === '' ? '' : (parseInt(minPostsMonthInput.value, 10) || 0);
  const minPostsDayValue = minPostsDayInput.value.trim() === '' ? '' : (parseInt(minPostsDayInput.value, 10) || 0);
  
  // Actualizar el criterio con los nuevos valores
  const updatedCriteria = {
    ...originalCriteria,
    type: searchTypeSelect.value,
    term: searchTermInput.value.trim(),
    city: searchCityInput.value.trim(),
    maxScrolls: parseInt(maxScrollsInput.value, 10) || 50,
    scrollDelay: parseFloat(scrollDelayInput.value) || 2,
    groupOptions: {
      publicGroups: publicGroupsCheckbox.checked,
      privateGroups: privateGroupsCheckbox.checked,
      minUsers: minUsersValue,
      minPostsYear: minPostsYearValue,
      minPostsMonth: minPostsMonthValue,
      minPostsDay: minPostsDayValue
    }
  };
  
  console.log('Criterio actualizado:', updatedCriteria);
  
  // Reemplazar el criterio en el array
  state.savedCriteria[criteriaIndex] = updatedCriteria;
  
  // Guardar en localStorage
  localStorage.setItem('snap_lead_manager_saved_criteria', JSON.stringify(state.savedCriteria));
  
  // Restaurar estado de edición
  state.editingCriteriaId = null;
  if (saveCriteriaButton) {
    saveCriteriaButton.textContent = 'Guardar criterios';
    saveCriteriaButton.classList.remove('editing');
    console.log('Texto del botón restaurado:', saveCriteriaButton.textContent);
  }
  
  // Ocultar botón de cancelar edición
  if (cancelEditButton) {
    cancelEditButton.style.display = 'none';
    console.log('Botón de cancelar ocultado');
  }
  
  // Mostrar mensaje de confirmación
  showTemporaryMessage(`Criterios "${updatedCriteria.name}" actualizados correctamente`);
}

// Guardar criterios actuales
function saveSearchCriteria() {
  const criteriaName = criteriaNameInput.value.trim();
  
  if (!criteriaName) {
    criteriaNameError.textContent = 'Por favor ingresa un nombre para esta búsqueda';
    return;
  }
  
  // Comprobar si ya existe un criterio con ese nombre
  const criteriaExists = state.savedCriteria.some(criteria => criteria.name === criteriaName);
  if (criteriaExists) {
    // Preguntar si desea sobrescribir
    if (!confirm(`Ya existe una búsqueda con el nombre "${criteriaName}". ¿Deseas sobrescribirla?`)) {
      return;
    } else {
      // Eliminar el criterio existente
      state.savedCriteria = state.savedCriteria.filter(c => c.name !== criteriaName);
    }
  }
  
  // Obtener valores de los campos y permitir valores vacíos
  const minUsersValue = minUsersInput.value.trim() === '' ? '' : (parseInt(minUsersInput.value, 10) || 0);
  const minPostsYearValue = minPostsYearInput.value.trim() === '' ? '' : (parseInt(minPostsYearInput.value, 10) || 0);
  const minPostsMonthValue = minPostsMonthInput.value.trim() === '' ? '' : (parseInt(minPostsMonthInput.value, 10) || 0);
  const minPostsDayValue = minPostsDayInput.value.trim() === '' ? '' : (parseInt(minPostsDayInput.value, 10) || 0);
  
  // Crear objeto de criterios
  const criteria = {
    id: Date.now().toString(),
    name: criteriaName,
    type: searchTypeSelect.value,
    term: searchTermInput.value.trim(),
    city: searchCityInput.value.trim(),
    maxScrolls: parseInt(maxScrollsInput.value, 10) || 50,
    scrollDelay: parseFloat(scrollDelayInput.value) || 2,
    groupOptions: {
      publicGroups: publicGroupsCheckbox.checked,
      privateGroups: privateGroupsCheckbox.checked,
      minUsers: minUsersValue,
      minPostsYear: minPostsYearValue,
      minPostsMonth: minPostsMonthValue,
      minPostsDay: minPostsDayValue
    }
  };
  
  // Agregar a la lista
  state.savedCriteria.push(criteria);
  
  // Guardar en localStorage
  localStorage.setItem('snap_lead_manager_saved_criteria', JSON.stringify(state.savedCriteria));
  
  // Cerrar modal
  saveCriteriaModal.style.display = 'none';
  
  // Mostrar mensaje de confirmación
  showTemporaryMessage(`Criterios guardados como "${criteriaName}"`);
}

// Mostrar modal para administrar criterios guardados
function showManageCriteriaModal() {
  // Actualizar lista de criterios guardados
  updateSavedCriteriaList();
  
  // Mostrar modal
  manageCriteriaModal.style.display = 'block';
}

// Actualizar la lista de criterios guardados en el modal
function updateSavedCriteriaList() {
  if (!savedCriteriaList) return;
  
  // Limpiar lista
  savedCriteriaList.innerHTML = '';
  
  // Si no hay criterios guardados, mostrar mensaje
  if (!state.savedCriteria || state.savedCriteria.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'No hay criterios guardados';
    savedCriteriaList.appendChild(emptyState);
    return;
  }
  
  // Agregar cada criterio a la lista
  state.savedCriteria.forEach(criteria => {
    const criteriaItem = document.createElement('div');
    criteriaItem.className = 'saved-criteria-item';
    criteriaItem.dataset.id = criteria.id;
    
    const nameSpan = document.createElement('span');
    nameSpan.className = 'saved-criteria-name';
    nameSpan.textContent = criteria.name;
    
    // Crear un elemento para mostrar detalles del criterio
    const detailsSpan = document.createElement('span');
    detailsSpan.className = 'saved-criteria-details';
    
    // Mostrar tipo de búsqueda y término
    const typeLabel = criteria.type === 'people' ? 'Personas' : 'Grupos';
    detailsSpan.textContent = `${typeLabel}: ${criteria.term}`;
    if (criteria.city) {
      detailsSpan.textContent += ` en ${criteria.city}`;
    }
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'saved-criteria-actions';
    
    const loadButton = document.createElement('button');
    loadButton.className = 'criteria-action';
    loadButton.innerHTML = '&#x1F4E5;'; // Ícono de cargar
    loadButton.title = 'Cargar criterios';
    loadButton.addEventListener('click', () => loadSavedCriteria(criteria.id));
    
    const editButton = document.createElement('button');
    editButton.className = 'criteria-action';
    editButton.innerHTML = '&#x1F4DD;'; // Ícono de documento con lápiz
    editButton.title = 'Editar criterios';
    editButton.addEventListener('click', () => {
      // Cargar para editar y luego cerrar el modal
      loadSavedCriteria(criteria.id, true);
      manageCriteriaModal.style.display = 'none';
    });
    
    const renameButton = document.createElement('button');
    renameButton.className = 'criteria-action';
    renameButton.innerHTML = '&#x270F;'; // Ícono de editar
    renameButton.title = 'Renombrar';
    renameButton.addEventListener('click', () => renameSavedCriteria(criteria.id));
    
    const deleteButton = document.createElement('button');
    deleteButton.className = 'criteria-action';
    deleteButton.innerHTML = '&#x1F5D1;'; // Ícono de eliminar
    deleteButton.title = 'Eliminar';
    deleteButton.addEventListener('click', () => deleteSavedCriteria(criteria.id));
    
    actionsDiv.appendChild(loadButton);
    actionsDiv.appendChild(editButton);
    actionsDiv.appendChild(renameButton);
    actionsDiv.appendChild(deleteButton);
    
    // Crear contenedor para nombre y detalles
    const infoDiv = document.createElement('div');
    infoDiv.className = 'saved-criteria-info';
    infoDiv.appendChild(nameSpan);
    infoDiv.appendChild(detailsSpan);
    
    criteriaItem.appendChild(infoDiv);
    criteriaItem.appendChild(actionsDiv);
    
    savedCriteriaList.appendChild(criteriaItem);
  });
}

// Cargar criterios guardados
function loadSavedCriteria(criteriaId, forEditing = false) {
  const criteria = state.savedCriteria.find(c => c.id === criteriaId);
  if (!criteria) {
    showError('No se encontraron los criterios guardados');
    return;
  }
  
  console.log(`Cargando criterio ${criteriaId} para edición: ${forEditing}`);
  
  // Establecer valores en los campos
  searchTypeSelect.value = criteria.type;
  searchTermInput.value = criteria.term;
  searchCityInput.value = criteria.city || '';
  
  // Opciones generales
  maxScrollsInput.value = criteria.maxScrolls || 50;
  scrollDelayInput.value = criteria.scrollDelay || 2;
  
  // Manejar cambio de tipo de búsqueda para mostrar/ocultar opciones de grupo
  handleSearchTypeChange();
  
  // Opciones de grupo si están disponibles
  if (criteria.groupOptions) {
    publicGroupsCheckbox.checked = criteria.groupOptions.publicGroups !== false;
    privateGroupsCheckbox.checked = criteria.groupOptions.privateGroups !== false;
    
    // Manejar valores vacíos
    minUsersInput.value = criteria.groupOptions.minUsers === '' ? '' : (criteria.groupOptions.minUsers || 0);
    minPostsYearInput.value = criteria.groupOptions.minPostsYear === '' ? '' : (criteria.groupOptions.minPostsYear || 0);
    minPostsMonthInput.value = criteria.groupOptions.minPostsMonth === '' ? '' : (criteria.groupOptions.minPostsMonth || 0);
    minPostsDayInput.value = criteria.groupOptions.minPostsDay === '' ? '' : (criteria.groupOptions.minPostsDay || 0);
  }
  
  // Actualizar estado
  state.currentSearchTerm = criteria.term;
  state.currentSearchCity = criteria.city || '';
  state.currentSearchType = criteria.type;
  
  // Si es para edición, recordar el ID y actualizar la interfaz
  if (forEditing) {
    state.editingCriteriaId = criteriaId;
    
    // Cambiar el texto del botón para indicar que está editando
    if (saveCriteriaButton) {
      // Truncar el nombre si es muy largo
      const displayName = criteria.name.length > 15 ? 
        criteria.name.substring(0, 12) + '...' : 
        criteria.name;
        
      saveCriteriaButton.textContent = `Actualizar "${displayName}"`;
      saveCriteriaButton.classList.add('editing');
      console.log('Botón de guardar actualizado:', saveCriteriaButton.textContent);
    }
    
    // Mostrar botón de cancelar edición
    if (cancelEditButton) {
      cancelEditButton.style.display = 'block';
      console.log('Botón de cancelar mostrado');
    }
  } else {
    state.editingCriteriaId = null;
    
    // Restaurar texto del botón
    if (saveCriteriaButton) {
      saveCriteriaButton.textContent = 'Guardar criterios';
      saveCriteriaButton.classList.remove('editing');
    }
    
    // Ocultar botón de cancelar edición
    if (cancelEditButton) {
      cancelEditButton.style.display = 'none';
    }
  }
  
  // Actualizar información de búsqueda
  updateSearchInfo();
  
  // Cerrar modal
  manageCriteriaModal.style.display = 'none';
  
  // Mostrar mensaje de confirmación
  const action = forEditing ? 'editando' : 'cargados';
  showTemporaryMessage(`Criterios "${criteria.name}" ${action}`);
}

// Renombrar criterios guardados
function renameSavedCriteria(criteriaId) {
  const criteriaIndex = state.savedCriteria.findIndex(c => c.id === criteriaId);
  if (criteriaIndex === -1) return;
  
  const criteria = state.savedCriteria[criteriaIndex];
  const newName = prompt('Ingresa un nuevo nombre para estos criterios:', criteria.name);
  
  if (newName && newName.trim()) {
    // Comprobar si ya existe otro criterio con ese nombre
    const nameExists = state.savedCriteria.some(c => c.id !== criteriaId && c.name === newName.trim());
    
    if (nameExists) {
      alert('Ya existe una búsqueda con ese nombre');
      return;
    }
    
    // Actualizar nombre
    state.savedCriteria[criteriaIndex].name = newName.trim();
    
    // Guardar en localStorage
    localStorage.setItem('snap_lead_manager_saved_criteria', JSON.stringify(state.savedCriteria));
    
    // Actualizar lista
    updateSavedCriteriaList();
  }
}

// Eliminar criterios guardados
function deleteSavedCriteria(criteriaId) {
  if (confirm('¿Estás seguro de que deseas eliminar estos criterios guardados?')) {
    // Filtrar para eliminar el criterio
    state.savedCriteria = state.savedCriteria.filter(c => c.id !== criteriaId);
    
    // Guardar en localStorage
    localStorage.setItem('snap_lead_manager_saved_criteria', JSON.stringify(state.savedCriteria));
    
    // Actualizar lista
    updateSavedCriteriaList();
  }
}

// Mostrar mensaje temporal
function showTemporaryMessage(message, isError = false) {
  const originalMessage = statusMessage.textContent;
  const originalClass = statusMessage.className;
  
  statusMessage.textContent = message;
  statusMessage.className = isError ? 'status error' : 'status success';
  
  // Restaurar mensaje original después de 3 segundos
  setTimeout(() => {
    statusMessage.textContent = originalMessage;
    statusMessage.className = originalClass;
  }, 3000);
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
  
  // Configuración avanzada
  collapsibleTrigger = document.querySelector('.collapsible-trigger');
  collapsibleContent = document.querySelector('.collapsible-content');
  maxScrollsInput = document.getElementById('max-scrolls');
  scrollDelayInput = document.getElementById('scroll-delay');
  groupOptionsContainer = document.getElementById('group-options');
  publicGroupsCheckbox = document.getElementById('public-groups');
  privateGroupsCheckbox = document.getElementById('private-groups');
  minUsersInput = document.getElementById('min-users');
  minPostsYearInput = document.getElementById('min-posts-year');
  minPostsMonthInput = document.getElementById('min-posts-month');
  minPostsDayInput = document.getElementById('min-posts-day');
  
  // Gestión de criterios
  clearCriteriaButton = document.getElementById('clear-criteria');
  saveCriteriaButton = document.getElementById('save-criteria');
  cancelEditButton = document.getElementById('cancel-edit');
  manageCriteriaButton = document.getElementById('manage-criteria');
  
  // Modales
  saveCriteriaModal = document.getElementById('save-criteria-modal');
  criteriaNameInput = document.getElementById('criteria-name');
  criteriaNameError = document.getElementById('criteria-name-error');
  confirmSaveButton = document.getElementById('confirm-save');
  cancelSaveButton = document.getElementById('cancel-save');
  
  manageCriteriaModal = document.getElementById('manage-criteria-modal');
  savedCriteriaList = document.getElementById('saved-criteria-list');
  closeManageCriteriaButton = document.getElementById('close-manage-criteria');
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
  
  // Mostrar u ocultar opciones específicas para grupos
  if (groupOptionsContainer) {
    groupOptionsContainer.style.display = searchType === 'groups' ? 'block' : 'none';
  }
}

// Función para manejar el comportamiento de secciones colapsables
function toggleCollapsible() {
  this.classList.toggle('active');
  const content = this.nextElementSibling;
  
  if (content.style.maxHeight) {
    content.style.maxHeight = null;
  } else {
    content.style.maxHeight = content.scrollHeight + 'px';
  }
}

// Función para cerrar modales
function closeModals() {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    modal.style.display = 'none';
  });
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
          localStorage.setItem('snap_lead_manager_search_active', 'false');
          document.body.classList.remove('search-active');
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
      
      // Guardar indicador de búsqueda inactiva
      localStorage.setItem('snap_lead_manager_search_active', 'false');
      
      // Detener cualquier actualización de estado
      clearInterval(state.statusUpdateInterval);
      
      // Remover clase search-active
      document.body.classList.remove('search-active');
      
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
      // Si el mensaje incluye información de configuración, usarla
      if (message.config) {
        updateStatus(
          message.status || 'Actualizando...', 
          message.progress || state.progress, 
          false, 
          message.config
        );
      } else {
        updateStatus(message.status || 'Actualizando...', message.progress || state.progress);
      }
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
      
    case 'configure_search':
      // Configurar la interfaz para búsqueda
      if (message.config) {
        console.log('Configurando búsqueda:', message.config);
        
        // Establecer tipo de búsqueda
        if (message.config.type && searchTypeSelect) {
          searchTypeSelect.value = message.config.type;
          state.currentSearchType = message.config.type;
          handleSearchTypeChange();
        }
        
        // Establecer término de búsqueda
        if (message.config.term && searchTermInput) {
          searchTermInput.value = message.config.term;
          state.currentSearchTerm = message.config.term;
          
          // Guardar para referencias futuras
          localStorage.setItem('snap_lead_manager_search_term', message.config.term);
        }
        
        // Establecer ciudad
        if (message.config.city && searchCityInput) {
          searchCityInput.value = message.config.city;
          state.currentSearchCity = message.config.city;
          
          // Guardar para referencias futuras
          localStorage.setItem('snap_lead_manager_search_city', message.config.city);
        }
        
        // Actualizar información de búsqueda
        updateSearchInfo();
        
        // Si todo está configurado, iniciar la búsqueda automáticamente
        if (message.config.autoStart && searchButton) {
          // Pequeño retraso para asegurar que la UI esté actualizada
          setTimeout(() => {
            // Hacer clic en el botón de búsqueda
            console.log('Iniciando búsqueda automáticamente');
            searchButton.click();
          }, 500);
        }
      }
      break;
      
    case 'set_filter_options':
      // Guardar opciones de filtrado adicionales para usarlas durante la búsqueda
      if (message.options) {
        console.log('Recibidas opciones de filtrado adicionales:', message.options);
        state.filterOptions = message.options;
        
        // Guardar para uso persistente
        localStorage.setItem('snap_lead_manager_filter_options', JSON.stringify(message.options));
      }
      break;
      
    case 'search_with_options':
      // Iniciar búsqueda directa con opciones
      if (message.searchData) {
        console.log('Iniciando búsqueda con datos y opciones:', message.searchData);
        
        // Configurar la interfaz primero
        if (message.searchData.type && searchTypeSelect) {
          searchTypeSelect.value = message.searchData.type;
          state.currentSearchType = message.searchData.type;
          handleSearchTypeChange();
        }
        
        if (message.searchData.term && searchTermInput) {
          searchTermInput.value = message.searchData.term;
          state.currentSearchTerm = message.searchData.term;
        }
        
        if (message.searchData.city && searchCityInput) {
          searchCityInput.value = message.searchData.city;
          state.currentSearchCity = message.searchData.city;
        }
        
        // Guardar opciones de filtrado si están presentes
        if (message.searchData.filterOptions) {
          state.filterOptions = message.searchData.filterOptions;
          localStorage.setItem('snap_lead_manager_filter_options', JSON.stringify(message.searchData.filterOptions));
        }
        
        // Actualizar información de búsqueda
        updateSearchInfo();
        
        // Iniciar la búsqueda automáticamente
        setTimeout(() => {
          console.log('Ejecutando búsqueda automática');
          performSearch();
        }, 500);
      }
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
  
  // Configurar manejadores de eventos para elementos básicos
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
  
  // Configurar sección colapsable
  if (collapsibleTrigger) {
    collapsibleTrigger.addEventListener('click', toggleCollapsible);
  }
  
  // Configurar gestión de criterios
  if (clearCriteriaButton) {
    clearCriteriaButton.addEventListener('click', () => {
      // Si estamos editando, preguntar antes de limpiar
      if (state.editingCriteriaId) {
        if (confirm('¿Estás seguro de que deseas limpiar los criterios que estás editando?')) {
          // Restaurar estado de edición
          state.editingCriteriaId = null;
          if (saveCriteriaButton) {
            saveCriteriaButton.textContent = 'Guardar criterios';
            saveCriteriaButton.classList.remove('editing');
          }
          clearSearchCriteria();
        }
      } else {
        clearSearchCriteria();
      }
    });
  }
  
  if (saveCriteriaButton) {
    saveCriteriaButton.addEventListener('click', showSaveCriteriaModal);
  }
  
  if (cancelEditButton) {
    cancelEditButton.addEventListener('click', () => {
      if (confirm('¿Estás seguro de que deseas cancelar la edición?')) {
        // Restaurar estado de edición
        state.editingCriteriaId = null;
        if (saveCriteriaButton) {
          saveCriteriaButton.textContent = 'Guardar criterios';
          saveCriteriaButton.classList.remove('editing');
        }
        
        // Ocultar botón de cancelar edición
        cancelEditButton.style.display = 'none';
        
        // Limpiar formulario o recargar valores originales
        clearSearchCriteria();
        
        // Mostrar mensaje
        showTemporaryMessage('Edición cancelada');
      }
    });
  }
  
  if (manageCriteriaButton) {
    manageCriteriaButton.addEventListener('click', showManageCriteriaModal);
  }
  
  // Configurar modales
  if (confirmSaveButton) {
    confirmSaveButton.addEventListener('click', saveSearchCriteria);
  }
  
  if (cancelSaveButton) {
    cancelSaveButton.addEventListener('click', () => {
      saveCriteriaModal.style.display = 'none';
    });
  }
  
  if (closeManageCriteriaButton) {
    closeManageCriteriaButton.addEventListener('click', () => {
      manageCriteriaModal.style.display = 'none';
    });
  }
  
  // Configurar cierre de modales con X
  document.querySelectorAll('.close-modal').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
      closeModals();
    });
  });
  
  // Cerrar modales al hacer clic fuera de ellos
  window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
      event.target.style.display = 'none';
    }
  });
  
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
  
  if (criteriaNameInput) {
    criteriaNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveSearchCriteria();
      }
    });
  }
  
  // Cargar criterios guardados desde localStorage
  try {
    const savedCriteria = localStorage.getItem('snap_lead_manager_saved_criteria');
    if (savedCriteria) {
      state.savedCriteria = JSON.parse(savedCriteria);
    }
  } catch (error) {
    console.error('Error al cargar criterios guardados:', error);
    state.savedCriteria = [];
  }
  
  // Cargar opciones generales desde localStorage
  try {
    const generalOptions = localStorage.getItem('snap_lead_manager_general_options');
    if (generalOptions) {
      const options = JSON.parse(generalOptions);
      if (maxScrollsInput) maxScrollsInput.value = options.maxScrolls || 50;
      if (scrollDelayInput) scrollDelayInput.value = options.scrollDelay || 2;
      
      state.maxScrolls = options.maxScrolls || 50;
      state.scrollDelay = options.scrollDelay || 2;
      
      console.log('Opciones generales cargadas desde localStorage:', {
        maxScrolls: state.maxScrolls,
        scrollDelay: state.scrollDelay
      });
    }
  } catch (error) {
    console.error('Error al cargar opciones generales:', error);
  }
  
  // Cargar opciones de grupo desde localStorage
  try {
    const groupOptions = localStorage.getItem('snap_lead_manager_group_options');
    if (groupOptions) {
      const options = JSON.parse(groupOptions);
      if (publicGroupsCheckbox) publicGroupsCheckbox.checked = options.publicGroups !== false;
      if (privateGroupsCheckbox) privateGroupsCheckbox.checked = options.privateGroups !== false;
      if (minUsersInput) minUsersInput.value = options.minUsers || 0;
      
      // Manejo correcto de valores vacíos para las publicaciones
      if (minPostsYearInput) minPostsYearInput.value = options.minPostsYear === '' ? '' : (options.minPostsYear || '');
      if (minPostsMonthInput) minPostsMonthInput.value = options.minPostsMonth === '' ? '' : (options.minPostsMonth || '');
      if (minPostsDayInput) minPostsDayInput.value = options.minPostsDay === '' ? '' : (options.minPostsDay || '');
      
      state.groupOptions = options;
      
      console.log('Opciones de grupo cargadas desde localStorage:', {
        publicGroups: options.publicGroups,
        privateGroups: options.privateGroups,
        minUsers: options.minUsers,
        minPostsYear: options.minPostsYear,
        minPostsMonth: options.minPostsMonth,
        minPostsDay: options.minPostsDay
      });
    }
  } catch (error) {
    console.error('Error al cargar opciones de grupo:', error);
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
  
  // Verificar si hay una búsqueda en curso para activar correctamente los botones
  if (localStorage.getItem('snap_lead_manager_search_active') === 'true') {
    state.isRunning = true;
    document.body.classList.add('search-active');
  } else {
    state.isRunning = false;
    document.body.classList.remove('search-active');
    
    // Asegurar que los botones de control estén deshabilitados
    if (pauseButton) pauseButton.disabled = true;
    if (stopButton) stopButton.disabled = true;
  }
  
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

// Prepara los datos de configuración para enviarlos a la base de datos
function prepareDataForDatabase(options) {
  try {
    // Estructurar los datos para guardarlos
    const dataForSync = {
      timestamp: Date.now(),
      user_id: localStorage.getItem('user_id') || 'anonymous',
      search_term: options.searchTerm || state.currentSearchTerm,
      search_type: options.searchType || state.currentSearchType,
      // Opciones generales
      max_scrolls: options.maxScrolls || state.maxScrolls,
      scroll_delay: options.scrollDelay || state.scrollDelay,
      // Opciones específicas para grupos
      group_options: {
        public_groups: options.publicGroups !== undefined ? options.publicGroups : true,
        private_groups: options.privateGroups !== undefined ? options.privateGroups : true,
        min_users: options.minUsers,
        min_posts_year: options.minPostsYear !== undefined ? options.minPostsYear : '',
        min_posts_month: options.minPostsMonth !== undefined ? options.minPostsMonth : '',
        min_posts_day: options.minPostsDay !== undefined ? options.minPostsDay : ''
      },
      // Datos del cliente
      user_agent: navigator.userAgent,
      client_version: '1.0.0'
    };
    
    // Guardamos en localStorage para futura sincronización con la base de datos
    localStorage.setItem('lead_manager_pro_db_sync_data', JSON.stringify(dataForSync));
    console.log('Datos preparados para sincronización con base de datos:', dataForSync);
    
    // Aquí se agregaría el código para enviar a la base de datos
    // Por ahora solo lo guardaremos en localStorage
    
    // También podríamos incluir un timestamp de cuándo se deberá intentar sincronizar
    localStorage.setItem('lead_manager_pro_db_sync_timestamp', Date.now());
  } catch (error) {
    console.error('Error al preparar datos para base de datos:', error);
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
