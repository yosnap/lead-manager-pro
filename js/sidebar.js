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

// Referencias adicionales para tabs e integración con n8n
let tabButtons;
let tabContents;
let n8nIntegrationContainer;

// Variables para el control de la verificación de estado
let statusCheckingInterval = null;

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
    
    // Forzar recarga estableciendo una URL de búsqueda específica
    const currentUrl = window.location.href;
    localStorage.setItem('snap_lead_manager_search_url', currentUrl);
    
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
    
    // Marcar que estamos comenzando una búsqueda
    localStorage.setItem('snap_lead_manager_search_active', 'true');
    localStorage.setItem('snap_lead_manager_force_reload', 'true');
    
    // Actualizar estado antes de recargar
    state.isRunning = true;
    state.isPaused = false;
    state.searchStartTime = Date.now();
    state.profiles = []; // Limpiar resultados anteriores
    
    // Actualizar UI rápidamente antes de recargar
    updateStatus(`Iniciando búsqueda de ${searchType === 'people' ? 'personas' : 'grupos'}: ${searchTerm}`, 5);
    
    // Enviar mensaje a la página para que se prepare para la búsqueda
    window.parent.postMessage({
      action: 'prepare_for_search',
      searchData: searchData
    }, '*');
    
    // Mostrar mensaje de que vamos a recargar
    addLogEntry('Recargando página para iniciar búsqueda...');
    
    // SIEMPRE recargar la página para garantizar que la búsqueda se inicie correctamente
    setTimeout(() => {
      // Recargar la página actual para iniciar la búsqueda con un estado limpio
      window.parent.location.reload();
    }, 300);
    
    return true;
  } catch (error) {
    console.error('Error al iniciar búsqueda:', error);
    showError(`Error: ${error.message}`);
    return false;
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
  if (!searchResultsList) {
    console.error('searchResultsList no está definido');
    return;
  }
  
  console.log('updateResultsList: Actualizando con', profiles?.length || 0, 'perfiles/grupos');
  
  // Limpiar lista actual
  searchResultsList.innerHTML = '';
  
  // Si no hay resultados, mostrar mensaje
  if (!profiles || profiles.length === 0) {
    const noResults = document.createElement('li');
    noResults.className = 'no-results';
    noResults.textContent = 'No se encontraron resultados';
    searchResultsList.appendChild(noResults);
    console.log('No hay resultados para mostrar');
    return;
  }
  
  console.log('Empezando a procesar resultados para UI:', profiles.length, 'items');
  
  // Agregar cada perfil a la lista
  profiles.forEach((profile, index) => {
    const listItem = document.createElement('li');
    listItem.className = 'result-item';
    
    // Intentar determinar si es un grupo o una persona
    // Los grupos generalmente tienen propiedades como 'members', 'type', 'groupUrl' o 'url'
    const isGroup = profile.members !== undefined || 
                    profile.membersCount !== undefined ||
                    profile.type !== undefined || 
                    profile.groupType !== undefined ||
                    profile.groupUrl !== undefined || 
                    (profile.url && profile.url.includes('/groups/'));
    
    console.log(`Procesando item ${index}: ${profile.name} (${isGroup ? 'Grupo' : 'Persona'})`);
    
    // Obtener URL del perfil/grupo
    const url = profile.url || profile.groupUrl || profile.profileUrl || '';
    
    // Crear contenido del item
    let htmlContent = `
      <div class="result-header">
        <span class="result-name">${profile.name || 'Sin nombre'}</span>
        ${url ? `<a href="${url}" target="_blank" class="result-link">Ver</a>` : '<span class="result-link disabled">Ver</span>'}
      </div>
      <div class="result-info">
    `;
    
    // Agregar información adicional según el tipo
    if (!isGroup) {
      // Para perfiles de personas
      if (profile.location) htmlContent += `<div>📍 ${profile.location}</div>`;
      if (profile.occupation) htmlContent += `<div>💼 ${profile.occupation}</div>`;
    } else {
      // Para grupos
      const groupType = profile.groupType || profile.type || '';
      const members = profile.members || profile.membersCount || '';
      const frequency = profile.frequency || '';
      
      if (groupType) htmlContent += `<div>🔒 ${groupType.toLowerCase().includes('público') || groupType.toLowerCase().includes('public') ? 'Público' : 'Privado'}</div>`;
      if (members) htmlContent += `<div>👥 ${typeof members === 'number' ? members.toLocaleString() : members}</div>`;
      if (frequency) htmlContent += `<div>📊 ${frequency}</div>`;
      
      // Fecha de extracción si está disponible
      if (profile.extractedAt) {
        try {
          const date = new Date(profile.extractedAt);
          htmlContent += `<div>🕒 Extraído: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}</div>`;
        } catch (e) {
          console.error('Error al formatear fecha:', e);
        }
      }
    }
    
    htmlContent += `</div>`;
    
    listItem.innerHTML = htmlContent;
    searchResultsList.appendChild(listItem);
  });
  
  // Mostrar un resumen de resultados
  if (resultsSummary) {
    resultsSummary.innerHTML = `<p>Se ${profiles.length === 1 ? 'ha encontrado' : 'han encontrado'} <strong>${profiles.length}</strong> ${state.currentSearchType === 'people' ? 'perfiles' : 'grupos'} que cumplen con tus criterios.</p>`;
    resultsSummary.style.display = 'block';
  }
  
  console.log('Lista de resultados actualizada con éxito. Total:', profiles.length);
  
  // Asegurar que el contenedor de resultados sea visible
  const resultsContainer = document.querySelector('.tab-content[data-tab="resultados"]');
  if (resultsContainer) {
    resultsContainer.style.display = 'block';
    console.log('Contenedor de resultados hecho visible');
  }
  
  // Si hay perfiles, enviarlos a n8n
  if (profiles && profiles.length > 0) {
    console.log('Preparando envío a n8n...');
    sendResultsToN8n(profiles, state.currentSearchType)
      .then(success => {
        if (success) {
          console.log('Resultados enviados a n8n con éxito');
          addLogEntry(`${profiles.length} resultados enviados a n8n con éxito`);
        }
      })
      .catch(error => {
        console.error('Error al enviar resultados a n8n:', error);
      });
  }
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
  console.log('Contenido del criterio:', JSON.stringify(criteria, null, 2));
  
  // Verificar que tenemos referencias a los elementos UI
  if (!searchTypeSelect) {
    console.error('searchTypeSelect no está definido. Reinicializando referencias DOM.');
    initDOMReferences();
  }
  
  if (!searchTypeSelect || !searchTermInput || !searchCityInput) {
    console.error('Referencias DOM críticas no disponibles:', {
      searchTypeSelect: !!searchTypeSelect,
      searchTermInput: !!searchTermInput,
      searchCityInput: !!searchCityInput
    });
    showError('Error al cargar criterios: Elementos del formulario no encontrados');
    return;
  }
  
  try {
    // Establecer valores en los campos - con validaciones
    if (searchTypeSelect && criteria.type) {
      searchTypeSelect.value = criteria.type;
      console.log(`Tipo de búsqueda establecido: ${criteria.type}`);
    }
    
    if (searchTermInput && criteria.term) {
      searchTermInput.value = criteria.term;
      console.log(`Término de búsqueda establecido: ${criteria.term}`);
    }
    
    if (searchCityInput) {
      searchCityInput.value = criteria.city || '';
      console.log(`Ciudad establecida: ${criteria.city || 'vacío'}`);
    }
    
    // Opciones generales
    if (maxScrollsInput) {
      maxScrollsInput.value = criteria.maxScrolls || 50;
      console.log(`MaxScrolls establecido: ${maxScrollsInput.value}`);
    }
    
    if (scrollDelayInput) {
      scrollDelayInput.value = criteria.scrollDelay || 2;
      console.log(`ScrollDelay establecido: ${scrollDelayInput.value}`);
    }
    
    // Manejar cambio de tipo de búsqueda para mostrar/ocultar opciones de grupo
    if (typeof handleSearchTypeChange === 'function') {
      handleSearchTypeChange();
      console.log('handleSearchTypeChange ejecutado');
    } else {
      console.warn('handleSearchTypeChange no está definido');
      
      // Implementación alternativa si la función no existe
      if (groupOptionsContainer) {
        groupOptionsContainer.style.display = criteria.type === 'groups' ? 'block' : 'none';
        console.log(`Opciones de grupo ${criteria.type === 'groups' ? 'mostradas' : 'ocultadas'}`);
      }
    }
    
    // Opciones de grupo si están disponibles
    if (criteria.groupOptions) {
      console.log('Estableciendo opciones de grupo:', criteria.groupOptions);
      
      if (publicGroupsCheckbox) {
        publicGroupsCheckbox.checked = criteria.groupOptions.publicGroups !== false;
        console.log(`Grupos públicos: ${publicGroupsCheckbox.checked}`);
      }
      
      if (privateGroupsCheckbox) {
        privateGroupsCheckbox.checked = criteria.groupOptions.privateGroups !== false;
        console.log(`Grupos privados: ${privateGroupsCheckbox.checked}`);
      }
      
      // Manejar valores vacíos
      if (minUsersInput) {
        minUsersInput.value = criteria.groupOptions.minUsers === '' ? '' : (criteria.groupOptions.minUsers || 0);
        console.log(`Mínimo usuarios: ${minUsersInput.value}`);
      }
      
      if (minPostsYearInput) {
        minPostsYearInput.value = criteria.groupOptions.minPostsYear === '' ? '' : (criteria.groupOptions.minPostsYear || 0);
        console.log(`Mínimo posts año: ${minPostsYearInput.value}`);
      }
      
      if (minPostsMonthInput) {
        minPostsMonthInput.value = criteria.groupOptions.minPostsMonth === '' ? '' : (criteria.groupOptions.minPostsMonth || 0);
        console.log(`Mínimo posts mes: ${minPostsMonthInput.value}`);
      }
      
      if (minPostsDayInput) {
        minPostsDayInput.value = criteria.groupOptions.minPostsDay === '' ? '' : (criteria.groupOptions.minPostsDay || 0);
        console.log(`Mínimo posts día: ${minPostsDayInput.value}`);
      }
    }
  } catch (error) {
    console.error('Error al establecer valores de criterios:', error);
    showError(`Error al cargar criterios: ${error.message}`);
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
  console.log('Inicializando referencias DOM...');
  
  // Crear un mapa de las referencias para inspección
  const domRefs = {};
  
  // Función auxiliar para asignar y registrar referencias
  function assignRef(varName, domId, isRequired = false) {
    const element = document.getElementById(domId);
    if (!element) {
      if (isRequired) {
        console.error(`Elemento requerido no encontrado: #${domId}`);
      } else {
        console.warn(`Elemento no encontrado: #${domId}`);
      }
      domRefs[varName] = null;
      return null;
    } else {
      domRefs[varName] = "OK";
      return element;
    }
  }
  
  // Elementos principales - requeridos
  searchTypeSelect = assignRef('searchTypeSelect', 'search-type', true);
  searchTermInput = assignRef('searchTermInput', 'search-term', true);
  searchCityInput = assignRef('searchCityInput', 'search-city', true);
  cityFilterGroup = assignRef('cityFilterGroup', 'city-filter-group');
  searchButton = assignRef('searchButton', 'search-button', true);
  pauseButton = assignRef('pauseButton', 'pause-button');
  stopButton = assignRef('stopButton', 'stop-button');
  statusMessage = assignRef('statusMessage', 'status-message');
  progressBar = assignRef('progressBar', 'progress-bar');
  searchResultsList = assignRef('searchResultsList', 'search-results');
  currentSearchInfo = assignRef('currentSearchInfo', 'current-search-info');
  openWindowButton = assignRef('openWindowButton', 'open-window-btn');
  
  // Elementos detallados
  searchStatusContainer = assignRef('searchStatusContainer', 'search-status-container');
  detailedStatusMessage = assignRef('detailedStatusMessage', 'detailed-status-message');
  detailedProgressBar = assignRef('detailedProgressBar', 'detailed-progress-bar');
  progressPercentage = assignRef('progressPercentage', 'progress-percentage');
  currentOperation = assignRef('currentOperation', 'current-operation');
  elapsedTime = assignRef('elapsedTime', 'elapsed-time');
  scrollLogContainer = assignRef('scrollLogContainer', 'scroll-log-container');
  resultsSummary = assignRef('resultsSummary', 'results-summary');
  
  // Si no existe el elemento resultsSummary, crearlo
  if (!resultsSummary) {
    console.log('Creando elemento resultsSummary');
    resultsSummary = document.createElement('div');
    resultsSummary.id = 'results-summary';
    resultsSummary.className = 'results-summary';
    resultsSummary.style.margin = '10px 0';
    resultsSummary.style.padding = '10px';
    resultsSummary.style.backgroundColor = '#f0f8ff';
    resultsSummary.style.borderRadius = '4px';
    resultsSummary.style.display = 'none';
    
    // Insertarlo antes de la lista de resultados
    if (searchResultsList && searchResultsList.parentNode) {
      searchResultsList.parentNode.insertBefore(resultsSummary, searchResultsList);
    } else if (document.body) {
      // Si no se puede insertar en el lugar adecuado, agregarlo al body
      document.body.appendChild(resultsSummary);
    }
    
    domRefs['resultsSummary'] = "CREATED";
  }
  
  // Configuración avanzada
  collapsibleTrigger = document.querySelector('.collapsible-trigger');
  collapsibleContent = document.querySelector('.collapsible-content');
  domRefs['collapsibleTrigger'] = collapsibleTrigger ? "OK" : "NOT_FOUND";
  domRefs['collapsibleContent'] = collapsibleContent ? "OK" : "NOT_FOUND";
  
  // Opciones de configuración - importantes para los criterios
  maxScrollsInput = assignRef('maxScrollsInput', 'max-scrolls', true);
  scrollDelayInput = assignRef('scrollDelayInput', 'scroll-delay', true);
  groupOptionsContainer = assignRef('groupOptionsContainer', 'group-options', true);
  
  // Opciones de grupo - cruciales para la funcionalidad
  publicGroupsCheckbox = assignRef('publicGroupsCheckbox', 'public-groups', true);
  privateGroupsCheckbox = assignRef('privateGroupsCheckbox', 'private-groups', true);
  minUsersInput = assignRef('minUsersInput', 'min-users', true);
  minPostsYearInput = assignRef('minPostsYearInput', 'min-posts-year', true);
  minPostsMonthInput = assignRef('minPostsMonthInput', 'min-posts-month', true);
  minPostsDayInput = assignRef('minPostsDayInput', 'min-posts-day', true);
  
  // Intento alternativo si los elementos no se encuentran por su ID
  if (!publicGroupsCheckbox || !privateGroupsCheckbox || !minUsersInput || 
      !minPostsYearInput || !minPostsMonthInput || !minPostsDayInput) {
    console.warn('Intentando buscar elementos de opciones de grupo por selector alternativo');
    
    // Buscar por nombre y tipo en lugar de ID
    if (!publicGroupsCheckbox)
      publicGroupsCheckbox = document.querySelector('input[type="checkbox"][name="public-groups"]');
    if (!privateGroupsCheckbox)
      privateGroupsCheckbox = document.querySelector('input[type="checkbox"][name="private-groups"]');
    if (!minUsersInput)
      minUsersInput = document.querySelector('input[name="min-users"]');
    if (!minPostsYearInput)
      minPostsYearInput = document.querySelector('input[name="min-posts-year"]');
    if (!minPostsMonthInput)
      minPostsMonthInput = document.querySelector('input[name="min-posts-month"]');
    if (!minPostsDayInput)
      minPostsDayInput = document.querySelector('input[name="min-posts-day"]');
    
    // Actualizar referencias en el mapa
    domRefs['publicGroupsCheckbox'] = publicGroupsCheckbox ? "FOUND_ALT" : "NOT_FOUND";
    domRefs['privateGroupsCheckbox'] = privateGroupsCheckbox ? "FOUND_ALT" : "NOT_FOUND";
    domRefs['minUsersInput'] = minUsersInput ? "FOUND_ALT" : "NOT_FOUND";
    domRefs['minPostsYearInput'] = minPostsYearInput ? "FOUND_ALT" : "NOT_FOUND";
    domRefs['minPostsMonthInput'] = minPostsMonthInput ? "FOUND_ALT" : "NOT_FOUND";
    domRefs['minPostsDayInput'] = minPostsDayInput ? "FOUND_ALT" : "NOT_FOUND";
  }
  
  // Gestión de criterios
  clearCriteriaButton = assignRef('clearCriteriaButton', 'clear-criteria');
  saveCriteriaButton = assignRef('saveCriteriaButton', 'save-criteria');
  cancelEditButton = assignRef('cancelEditButton', 'cancel-edit');
  manageCriteriaButton = assignRef('manageCriteriaButton', 'manage-criteria');
  
  // Modales
  saveCriteriaModal = assignRef('saveCriteriaModal', 'save-criteria-modal');
  criteriaNameInput = assignRef('criteriaNameInput', 'criteria-name');
  criteriaNameError = assignRef('criteriaNameError', 'criteria-name-error');
  confirmSaveButton = assignRef('confirmSaveButton', 'confirm-save');
  cancelSaveButton = assignRef('cancelSaveButton', 'cancel-save');
  
  manageCriteriaModal = assignRef('manageCriteriaModal', 'manage-criteria-modal');
  savedCriteriaList = assignRef('savedCriteriaList', 'saved-criteria-list');
  closeManageCriteriaButton = assignRef('closeManageCriteriaButton', 'close-manage-criteria');
  
  // Referencias para tabs
  tabButtons = document.querySelectorAll('.tab-button');
  tabContents = document.querySelectorAll('.tab-content');
  domRefs['tabButtons'] = tabButtons && tabButtons.length > 0 ? `OK (${tabButtons.length})` : "NOT_FOUND";
  domRefs['tabContents'] = tabContents && tabContents.length > 0 ? `OK (${tabContents.length})` : "NOT_FOUND";
  
  // Referencias para integración con n8n
  n8nIntegrationContainer = assignRef('n8nIntegrationContainer', 'n8n-integration-container');
  
  // Registrar resumen del estado de inicialización
  console.log('Resumen de inicialización DOM:', domRefs);
  
  // Verificar si faltan elementos críticos y mostrar error
  const missingCritical = Object.entries(domRefs)
    .filter(([key, status]) => status === null && ['searchTypeSelect', 'searchTermInput', 'searchButton'].includes(key))
    .map(([key]) => key);
    
  if (missingCritical.length > 0) {
    console.error(`Elementos críticos no encontrados: ${missingCritical.join(', ')}`);
    
    // Intentar mostrar un mensaje de error en la interfaz
    if (document.body) {
      const errorDiv = document.createElement('div');
      errorDiv.style.color = 'red';
      errorDiv.style.padding = '10px';
      errorDiv.style.backgroundColor = '#ffeeee';
      errorDiv.style.border = '1px solid red';
      errorDiv.style.borderRadius = '5px';
      errorDiv.style.margin = '10px';
      errorDiv.innerHTML = `
        <h3>Error de inicialización</h3>
        <p>No se pudieron encontrar algunos elementos críticos de la interfaz. La funcionalidad puede estar limitada.</p>
        <p>Elementos faltantes: ${missingCritical.join(', ')}</p>
        <button id="retry-init-btn" style="padding: 5px 10px;">Reintentar</button>
      `;
      
      // Insertar al principio del body
      if (document.body.firstChild) {
        document.body.insertBefore(errorDiv, document.body.firstChild);
      } else {
        document.body.appendChild(errorDiv);
      }
      
      // Agregar listener al botón de reintento
      const retryBtn = document.getElementById('retry-init-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', function() {
          errorDiv.remove();
          initDOMReferences();
        });
      }
    }
  }
  
  return missingCritical.length === 0; // Devolver true si todos los elementos críticos se encontraron
}

// Función para manejar el cambio de tipo de búsqueda
function handleSearchTypeChange() {
  console.log('Ejecutando handleSearchTypeChange');
  
  // Verificar que tenemos los elementos necesarios
  if (!searchTypeSelect) {
    console.error('searchTypeSelect no está definido en handleSearchTypeChange');
    return;
  }
  
  const searchType = searchTypeSelect.value;
  state.currentSearchType = searchType;
  
  console.log(`Tipo de búsqueda cambiado a: ${searchType}`);
  
  // Actualizar el placeholder según el tipo
  if (searchTermInput) {
    searchTermInput.placeholder = searchType === 'people' 
      ? 'Nombre, profesión, etc.' 
      : 'Nombre o temática del grupo';
    console.log(`Placeholder de término actualizado: ${searchTermInput.placeholder}`);
  }
  
  // Actualizar placeholder de ciudad
  if (searchCityInput) {
    searchCityInput.placeholder = searchType === 'people'
      ? 'Ej: Madrid, Barcelona'
      : 'Filtrar grupos por ciudad';
    console.log(`Placeholder de ciudad actualizado: ${searchCityInput.placeholder}`);
  }
  
  // Mostrar u ocultar opciones específicas para grupos
  if (groupOptionsContainer) {
    const display = searchType === 'groups' ? 'block' : 'none';
    groupOptionsContainer.style.display = display;
    console.log(`Opciones de grupo: ${display}`);
    
    // Si se muestran las opciones de grupo, asegurarse de que sean visibles
    if (searchType === 'groups') {
      // Asegurar que el contenedor colapsable esté expandido
      if (collapsibleContent && collapsibleTrigger) {
        if (collapsibleContent.style.maxHeight === '' || collapsibleContent.style.maxHeight === 'null') {
          // Expandir manualmente
          collapsibleContent.style.maxHeight = collapsibleContent.scrollHeight + 'px';
          collapsibleTrigger.classList.add('active');
          console.log('Expandido contenedor colapsable para mostrar opciones de grupo');
        }
      }
      
      // Aplicar estilos para asegurarse de que sea visible
      groupOptionsContainer.style.opacity = '1';
      groupOptionsContainer.style.height = 'auto';
      groupOptionsContainer.style.overflow = 'visible';
      groupOptionsContainer.style.marginTop = '10px';
      
      // Asegurarse de que todos los campos de entrada sean interactivos
      if (publicGroupsCheckbox) publicGroupsCheckbox.disabled = false;
      if (privateGroupsCheckbox) privateGroupsCheckbox.disabled = false;
      if (minUsersInput) minUsersInput.disabled = false;
      if (minPostsYearInput) minPostsYearInput.disabled = false;
      if (minPostsMonthInput) minPostsMonthInput.disabled = false;
      if (minPostsDayInput) minPostsDayInput.disabled = false;
    }
  } else {
    console.warn('groupOptionsContainer no está definido, no se puede mostrar/ocultar opciones de grupo');
  }
  
  // Actualizar UI relacionada
  updateSearchInfo();
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

// Verificar si hay resultados pendientes en localStorage
function checkPendingResults() {
  const hasPendingResults = localStorage.getItem('snap_lead_manager_results_pending');
  if (hasPendingResults === 'true') {
    console.log('Detectados resultados pendientes en localStorage');
    
    try {
      const rawResults = localStorage.getItem('snap_lead_manager_search_results');
      if (rawResults) {
        const resultData = JSON.parse(rawResults);
        console.log('Procesando resultados pendientes:', resultData);
        
        // Crear un mensaje simulado con estos resultados
        const syntheticMessage = {
          action: 'found_results',
          results: resultData.results || [],
          success: true,
          message: resultData.message || `Se encontraron ${resultData.results?.length || 0} resultados.`
        };
        
        // Procesar el mensaje
        handleReceivedMessage({data: syntheticMessage});
        
        // Limpiar estado
        localStorage.removeItem('snap_lead_manager_results_pending');
        localStorage.removeItem('snap_lead_manager_search_results');
      }
    } catch (error) {
      console.error('Error al procesar resultados pendientes:', error);
    }
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
  
  // Depuración para mensajes importantes
  if (message.action === 'found_results' || message.action === 'search_result') {
    console.log('MENSAJE IMPORTANTE RECIBIDO:', message);
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
          
          // Cambiar a la pestaña de Resultados
          if (tabButtons && tabButtons.length > 1) {
            tabButtons[1].click(); // El índice 1 debería ser la pestaña de Resultados
          }
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
        console.log('Recibido found_results:', message.results.length, 'grupos');
        
        try {
          // Primero actualizar el estado
          state.profiles = message.results;
          state.foundCount = message.results.length;
          state.isRunning = false;
          state.isPaused = false;
          localStorage.setItem('snap_lead_manager_search_active', 'false');
          
          // Detener cualquier intervalo de actualización
          stopStatusChecking();
          
          // Actualizar la UI con el estado final
          updateStatus(message.message || `Se encontraron ${state.profiles.length} grupos`, 100);
          
          // Registrar en consola cada paso para debug
          console.log('found_results: Actualizando lista de resultados con', state.profiles.length, 'grupos');
          
          // Asegurarse de que los resultados no sean nulos o indefinidos
          if (!state.profiles) {
            console.warn('found_results: profiles es nulo o indefinido, inicializando array vacío');
            state.profiles = [];
          }
          
          // Actualizar la lista de resultados
          try {
            updateResultsList(state.profiles);
            console.log('found_results: Lista de resultados actualizada correctamente');
          } catch (resultError) {
            console.error('Error al actualizar lista de resultados:', resultError);
          }
          
          // Mostrar mensaje de resumen
          if (resultsSummary) {
            console.log('found_results: Actualizando resumen de resultados');
            resultsSummary.innerHTML = `<p>Se encontraron <strong>${state.profiles.length}</strong> grupos que cumplen con tus criterios.</p>`;
            resultsSummary.style.display = 'block';
          }
          
          // Agregar entrada en el log
          addLogEntry(message.message || `Búsqueda completada. Se encontraron ${state.profiles.length} grupos.`);
          
          // Actualizar la UI completa
          document.body.classList.remove('search-active');
          updateUI();
          
          // Cambiar a la pestaña de Resultados
          if (tabButtons && tabButtons.length > 1) {
            console.log('found_results: Cambiando a pestaña de resultados');
            setTimeout(() => {
              try {
                tabButtons[1].click(); // El índice 1 debería ser la pestaña de Resultados
              } catch (tabError) {
                console.warn('Error al cambiar de pestaña:', tabError);
              }
            }, 500);
          }
          
          // Intentar enviar los resultados a n8n si está disponible
          console.log('found_results: Intentando enviar a n8n');
          try {
            sendResultsToN8n(state.profiles, state.currentSearchType)
              .then(success => {
                if (success) {
                  console.log('Resultados enviados a n8n con éxito');
                  addLogEntry(`${state.profiles.length} resultados enviados a n8n con éxito`);
                }
              })
              .catch(error => {
                console.error('Error al enviar resultados a n8n:', error);
              });
          } catch (n8nError) {
            console.warn('Error al intentar enviar a n8n:', n8nError);
          }
        } catch (error) {
          console.error('Error general procesando found_results:', error);
        }
      } else {
        console.warn('found_results recibido pero sin resultados');
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

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
  console.log('⏱️ DOMContentLoaded - Iniciando configuración del sidebar');
  
  // Intentar inicializar referencias DOM con reintentos
  console.log('🔍 Inicializando referencias DOM...');
  let initSuccess = initDOMReferences();
  
  if (!initSuccess) {
    console.warn('⚠️ La inicialización de referencias DOM no fue completamente exitosa, reintentando una vez...');
    // Reintento después de un breve retraso
    setTimeout(() => {
      console.log('🔄 Reintentando inicialización de referencias DOM...');
      initSuccess = initDOMReferences();
      if (!initSuccess) {
        console.error('❌ La inicialización de referencias DOM falló después del reintento');
      } else {
        console.log('✅ Inicialización de referencias DOM exitosa en el segundo intento');
        continueInitialization();
      }
    }, 300);
  } else {
    console.log('✅ Inicialización de referencias DOM exitosa');
    continueInitialization();
  }
  
  function continueInitialization() {
    // Inicializar navegación por tabs
    console.log('🔄 Inicializando navegación por tabs...');
    try {
      initTabNavigation();
      console.log('✅ Navegación por tabs inicializada correctamente');
    } catch (error) {
      console.error('❌ Error al inicializar navegación por tabs:', error);
    }
    
    // Cargar criterios guardados
    console.log('🔄 Cargando criterios guardados...');
    try {
      loadSavedCriteriaFromStorage();
      console.log('✅ Criterios guardados cargados correctamente');
    } catch (error) {
      console.error('❌ Error al cargar criterios guardados:', error);
    }
    
    // Verificar si hay resultados pendientes en localStorage
    console.log('🔄 Verificando resultados pendientes...');
    try {
      checkPendingResults();
      console.log('✅ Verificación de resultados pendientes completada');
    } catch (error) {
      console.error('❌ Error al verificar resultados pendientes:', error);
    }
    
    // Registrar un manejador de mensajes desde la ventana principal
    console.log('🔄 Registrando manejador de mensajes...');
    window.addEventListener('message', handleReceivedMessage);
    
    // Mostrar un mensaje en la consola indicando que todo está listo
    console.log('🚀 Inicialización completada - Sidebar Lead Manager Pro listo');
  }
  
  // Enlazar eventos
  if (searchButton) {
    searchButton.addEventListener('click', performSearch);
  }
  
  if (pauseButton) {
    pauseButton.disabled = true;
    pauseButton.addEventListener('click', togglePauseSearch);
  }
  
  if (stopButton) {
    stopButton.disabled = true;
    stopButton.addEventListener('click', stopSearch);
  }
  
  if (openWindowButton) {
    openWindowButton.addEventListener('click', openInWindow);
  }
  
  if (searchTypeSelect) {
    searchTypeSelect.addEventListener('change', handleSearchTypeChange);
    // Inicializar tipo de búsqueda
    handleSearchTypeChange();
  }
  
  if (collapsibleTrigger) {
    collapsibleTrigger.addEventListener('click', toggleCollapsible);
  }
  
  // Gestión de criterios
  if (clearCriteriaButton) {
    clearCriteriaButton.addEventListener('click', clearSearchCriteria);
  }
  
  if (saveCriteriaButton) {
    saveCriteriaButton.addEventListener('click', showSaveCriteriaModal);
  }
  
  if (cancelEditButton) {
    cancelEditButton.addEventListener('click', () => {
      state.editingCriteriaId = null;
      updateUI();
    });
  }
  
  if (manageCriteriaButton) {
    manageCriteriaButton.addEventListener('click', showManageCriteriaModal);
  }
  
  // Eventos para modales
  const closeModalButtons = document.querySelectorAll('.close-modal');
  closeModalButtons.forEach(btn => {
    btn.addEventListener('click', closeModals);
  });
  
  if (confirmSaveButton) {
    confirmSaveButton.addEventListener('click', saveSearchCriteria);
  }
  
  if (cancelSaveButton) {
    cancelSaveButton.addEventListener('click', closeModals);
  }
  
  if (closeManageCriteriaButton) {
    closeManageCriteriaButton.addEventListener('click', closeModals);
  }
  
  // Intentar inicializar el tab activo inicial
  const activeTab = document.querySelector('.tab-button.active');
  if (activeTab) {
    const tabId = activeTab.getAttribute('data-tab');
    if (tabId === 'n8n-tab') {
      // Inicializar el tab de n8n si está activo por defecto
      setTimeout(() => {
        initN8nIntegration();
      }, 500); // Pequeño retraso para asegurar que todo esté cargado
    }
  }
  
  // Mostrar UI
  updateUI();
});

function initTabNavigation() {
  if (!tabButtons || !tabContents) {
    console.error('Tab buttons or tab contents not found in the DOM');
    return;
  }
  
  console.log('Initializing tab navigation');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Obtener el id del tab a mostrar
      const tabId = button.getAttribute('data-tab');
      console.log('Tab clicked:', tabId);
      
      // Desactivar todos los tabs
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Activar el tab seleccionado
      button.classList.add('active');
      const tabContent = document.getElementById(tabId);
      if (tabContent) {
        tabContent.classList.add('active');
        console.log('Tab activated:', tabId);
      } else {
        console.error('Tab content not found:', tabId);
      }
      
      // Si es el tab de integración con n8n, inicializar si aún no se ha hecho
      if (tabId === 'n8n-tab') {
        console.log('Initializing n8n integration');
        initN8nIntegration();
      }
    });
  });
}

// Implementación directa de los módulos de n8n en caso de que la carga falle
function initializeN8nModulesDirect() {
  console.log('Inicializando módulos n8n directamente');
  
  // Namespace para la organización del código
  window.LeadManagerPro = window.LeadManagerPro || {};
  window.LeadManagerPro.modules = window.LeadManagerPro.modules || {};
  
  // Clase N8nIntegrationManager
  class N8nIntegrationManager {
    constructor() {
      this.n8nWebhookUrl = '';
      this.userId = null;
      this.username = '';
      this.apiKey = '';
      this.isConfigured = false;
      this.pendingData = [];
      this.lastSyncTime = null;
      this.dbEnabled = false;
    }
    
    async init() {
      console.log('N8nIntegrationManager: Iniciando módulo');
      
      try {
        // Cargar configuración desde chrome.storage
        const result = await new Promise(resolve => {
          chrome.storage.local.get(['leadManagerN8nConfig', 'leadManagerUserId'], resolve);
        });
        
        if (result && result.leadManagerN8nConfig) {
          this.n8nWebhookUrl = result.leadManagerN8nConfig.webhookUrl || '';
          this.apiKey = result.leadManagerN8nConfig.apiKey || '';
          this.dbEnabled = result.leadManagerN8nConfig.dbEnabled || false;
          this.lastSyncTime = result.leadManagerN8nConfig.lastSyncTime || null;
          this.isConfigured = !!(this.n8nWebhookUrl && this.apiKey);
          
          console.log('N8nIntegrationManager: Configuración cargada');
        }
        
        if (result && result.leadManagerUserId) {
          this.userId = result.leadManagerUserId.id || null;
          this.username = result.leadManagerUserId.username || '';
          
          console.log('N8nIntegrationManager: ID de usuario cargado');
        }
        
        // Cargar datos pendientes
        await this.loadPendingData();
        
        return this;
      } catch (error) {
        console.error('N8nIntegrationManager: Error al inicializar', error);
        return this;
      }
    }
    
    async configure(config) {
      try {
        if (config.webhookUrl !== undefined) this.n8nWebhookUrl = config.webhookUrl;
        if (config.apiKey !== undefined) this.apiKey = config.apiKey;
        if (config.dbEnabled !== undefined) this.dbEnabled = config.dbEnabled;
        if (config.userId !== undefined) this.userId = config.userId;
        if (config.username !== undefined) this.username = config.username;
        
        this.isConfigured = !!(this.n8nWebhookUrl && this.apiKey);
        
        await Promise.all([
          new Promise(resolve => {
            chrome.storage.local.set({
              'leadManagerN8nConfig': {
                webhookUrl: this.n8nWebhookUrl,
                apiKey: this.apiKey,
                dbEnabled: this.dbEnabled,
                lastSyncTime: this.lastSyncTime
              }
            }, resolve);
          }),
          new Promise(resolve => {
            if (this.userId) {
              chrome.storage.local.set({
                'leadManagerUserId': {
                  id: this.userId,
                  username: this.username
                }
              }, resolve);
            } else {
              resolve();
            }
          })
        ]);
        
        return true;
      } catch (error) {
        console.error('N8nIntegrationManager: Error al configurar', error);
        return false;
      }
    }
    
    isAuthenticated() {
      return !!this.userId;
    }
    
    async loadPendingData() {
      try {
        const result = await new Promise(resolve => {
          chrome.storage.local.get(['leadManagerPendingData'], resolve);
        });
        
        if (result && result.leadManagerPendingData) {
          this.pendingData = result.leadManagerPendingData;
        }
        
        return true;
      } catch (error) {
        console.error('N8nIntegrationManager: Error al cargar datos pendientes', error);
        return false;
      }
    }
    
    getStatus() {
      return {
        isConfigured: this.isConfigured,
        userId: this.userId,
        username: this.username,
        n8nWebhookUrl: this.n8nWebhookUrl,
        dbEnabled: this.dbEnabled,
        lastSyncTime: this.lastSyncTime,
        pendingDataCount: this.pendingData.length
      };
    }
    
    // Métodos simplificados para la implementación directa
    async sendToN8n(dataType, data) {
      console.log(`N8nIntegrationManager: Enviando ${data.length} elementos a n8n`);
      return true;
    }
    
    async getUserData(dataType) {
      return [];
    }
  }
  
  // Clase N8nIntegrationUI
  class N8nIntegrationUI {
    constructor() {
      this.initialized = false;
      this.manager = null;
    }
    
    async init() {
      if (this.initialized) return this;
      
      console.log('N8nIntegrationUI: Inicializando módulo');
      
      try {
        // Crear una instancia del gestor si no existe
        if (!window.LeadManagerPro.n8nIntegration) {
          window.LeadManagerPro.n8nIntegration = new N8nIntegrationManager();
        }
        
        this.manager = window.LeadManagerPro.n8nIntegration;
        await this.manager.init();
        
        this.initialized = true;
        
        return this;
      } catch (error) {
        console.error('N8nIntegrationUI: Error al inicializar', error);
        return this;
      }
    }
    
    generateConfigHTML() {
      const status = this.manager?.getStatus() || {};
      const isConfigured = status.isConfigured || false;
      const userId = status.userId || '';
      const username = status.username || '';
      const webhookUrl = status.n8nWebhookUrl || '';
      const dbEnabled = status.dbEnabled || false;
      const lastSyncTime = status.lastSyncTime ? new Date(status.lastSyncTime).toLocaleString() : 'Nunca';
      const pendingDataCount = status.pendingDataCount || 0;
      
      return `
        <div class="snap-lead-section">
          <h3>Integración con n8n</h3>
          <div class="snap-lead-config-form">
            <div class="snap-lead-form-row">
              <label for="n8n-webhook-url">URL de Webhook de n8n:</label>
              <input type="text" id="n8n-webhook-url" value="${webhookUrl}" placeholder="https://tu-instancia-n8n.com/webhook/..." />
            </div>
            
            <div class="snap-lead-form-row">
              <label for="n8n-api-key">API Key:</label>
              <input type="password" id="n8n-api-key" placeholder="Ingresa tu API key" />
            </div>
            
            <div class="snap-lead-form-row">
              <label for="n8n-user-id">ID de Usuario:</label>
              <input type="text" id="n8n-user-id" value="${userId}" placeholder="Tu ID de usuario" />
            </div>
            
            <div class="snap-lead-form-row">
              <label for="n8n-username">Nombre de Usuario:</label>
              <input type="text" id="n8n-username" value="${username}" placeholder="Tu nombre de usuario" />
            </div>
            
            <div class="snap-lead-form-row checkbox-row">
              <label for="n8n-db-enabled">
                <input type="checkbox" id="n8n-db-enabled" ${dbEnabled ? 'checked' : ''} />
                Habilitar almacenamiento local de datos
              </label>
            </div>
            
            <div class="snap-lead-form-row">
              <button id="n8n-save-config" class="snap-lead-button primary">Guardar Configuración</button>
            </div>
            
            <div class="snap-lead-status-info">
              <p>Estado: <span class="status-badge ${isConfigured ? 'success' : 'error'}">${isConfigured ? 'Configurado' : 'No configurado'}</span></p>
              <p>Última sincronización: <span>${lastSyncTime}</span></p>
              <p>Datos pendientes: <span>${pendingDataCount}</span></p>
              ${pendingDataCount > 0 ? `<button id="n8n-sync-now" class="snap-lead-button secondary">Sincronizar Ahora</button>` : ''}
            </div>
          </div>
        </div>
      `;
    }
    
    async generateUserDataHTML() {
      if (!this.manager || !this.manager.isAuthenticated()) {
        return `
          <div class="snap-lead-section">
            <h3>Datos de Usuario</h3>
            <p>Debes configurar la integración y tu ID de usuario para ver tus datos.</p>
          </div>
        `;
      }
      
      return `
        <div class="snap-lead-section">
          <h3>Datos de Usuario</h3>
          
          <div class="snap-lead-data-stats">
            <div class="stat-box">
              <span class="stat-value">0</span>
              <span class="stat-label">Perfiles</span>
            </div>
            <div class="stat-box">
              <span class="stat-value">0</span>
              <span class="stat-label">Grupos</span>
            </div>
            <div class="stat-box">
              <span class="stat-value">0</span>
              <span class="stat-label">Miembros</span>
            </div>
          </div>
          
          <div class="snap-lead-data-actions">
            <button id="view-profiles-btn" class="snap-lead-button secondary">Ver Perfiles</button>
            <button id="view-groups-btn" class="snap-lead-button secondary">Ver Grupos</button>
            <button id="view-members-btn" class="snap-lead-button secondary">Ver Miembros</button>
            <button id="export-data-btn" class="snap-lead-button primary">Exportar Datos</button>
          </div>
        </div>
      `;
    }
    
    attachEvents(container) {
      // Botón de guardar configuración
      const saveConfigBtn = container.querySelector('#n8n-save-config');
      if (saveConfigBtn) {
        saveConfigBtn.addEventListener('click', async () => {
          const webhookUrl = container.querySelector('#n8n-webhook-url').value.trim();
          const apiKey = container.querySelector('#n8n-api-key').value.trim();
          const userId = container.querySelector('#n8n-user-id').value.trim();
          const username = container.querySelector('#n8n-username').value.trim();
          const dbEnabled = container.querySelector('#n8n-db-enabled').checked;
          
          try {
            await this.manager.configure({
              webhookUrl,
              apiKey: apiKey || undefined,
              userId: userId || undefined,
              username: username || undefined,
              dbEnabled
            });
            
            alert('Configuración guardada correctamente');
            
            // Actualizar la interfaz
            this.updateUI(container);
          } catch (error) {
            console.error('N8nIntegrationUI: Error al guardar configuración', error);
            alert(`Error al guardar configuración: ${error.message}`);
          }
        });
      }
    }
    
    async updateUI(container) {
      try {
        // Actualizar sección de configuración
        const configSection = container.querySelector('.snap-lead-section:first-child');
        if (configSection) {
          configSection.innerHTML = this.generateConfigHTML();
        }
        
        // Actualizar sección de datos de usuario
        const dataSection = container.querySelector('.snap-lead-section:last-child');
        if (dataSection) {
          dataSection.innerHTML = await this.generateUserDataHTML();
        }
        
        // Volver a enlazar eventos
        this.attachEvents(container);
      } catch (error) {
        console.error('N8nIntegrationUI: Error al actualizar UI', error);
      }
    }
    
    async render(container) {
      try {
        // Generar HTML
        const configHTML = this.generateConfigHTML();
        const userDataHTML = await this.generateUserDataHTML();
        
        // Insertar en el contenedor
        container.innerHTML = `
          <div class="n8n-integration-ui">
            ${configHTML}
            ${userDataHTML}
          </div>
        `;
        
        // Enlazar eventos
        this.attachEvents(container);
      } catch (error) {
        console.error('N8nIntegrationUI: Error al renderizar', error);
        container.innerHTML = `<p class="error">Error al cargar la interfaz: ${error.message}</p>`;
      }
    }
  }
  
  // Asignar las clases al namespace
  window.LeadManagerPro.n8nIntegration = new N8nIntegrationManager();
  window.LeadManagerPro.modules.n8nIntegrationUI = new N8nIntegrationUI();
  
  return true;
}

// Modificar la función initN8nIntegration para usar la implementación directa como respaldo
async function initN8nIntegration() {
  // Verificar si el contenedor existe
  if (!n8nIntegrationContainer) {
    console.error('n8nIntegrationContainer not found in the DOM');
    return;
  }
  
  console.log('Starting n8n integration initialization');
  n8nIntegrationContainer.innerHTML = `<div class="loading-indicator">Cargando configuración...</div>`;
  
  try {
    // Intentar cargar los módulos desde archivos
    let loaded = false;
    
    try {
      // Intentar el método principal de carga
      await loadN8nModules();
      loaded = true;
    } catch (error) {
      console.warn('No se pudieron cargar los módulos n8n desde archivos, usando implementación directa', error);
      loaded = false;
    }
    
    // Si falló, usar la implementación directa
    if (!loaded) {
      initializeN8nModulesDirect();
    }
    
    // Obtener referencias a los módulos
    const n8nIntegrationUI = window.LeadManagerPro?.modules?.n8nIntegrationUI;
    
    if (!n8nIntegrationUI) {
      throw new Error('No se pudo cargar el módulo de integración con n8n');
    }
    
    // Inicializar el módulo de UI
    await n8nIntegrationUI.init();
    
    // Renderizar la UI en el contenedor
    await n8nIntegrationUI.render(n8nIntegrationContainer);
    
    console.log('Integración con n8n inicializada correctamente');
  } catch (error) {
    console.error('Error al inicializar integración con n8n:', error);
    n8nIntegrationContainer.innerHTML = `
      <div class="error-message">
        <p>Error al cargar la integración con n8n: ${error.message}</p>
        <button class="snap-lead-button" id="retry-n8n-load">Reintentar</button>
      </div>
    `;
    
    // Agregar listener para reintentar
    const retryButton = document.getElementById('retry-n8n-load');
    if (retryButton) {
      retryButton.addEventListener('click', initN8nIntegration);
    }
  }
}

// Cargar los módulos de n8n desde el content script
async function loadN8nModules() {
  // Verificar si los módulos ya están cargados
  if (window.LeadManagerPro?.n8nIntegration && window.LeadManagerPro?.modules?.n8nIntegrationUI) {
    console.log('N8n modules already loaded');
    return;
  }
  
  console.log('Loading n8n modules');
  
  try {
    // Cargar el contenido de los archivos
    const integrationResponse = await fetch(chrome.runtime.getURL('content/modules/n8nIntegration.js'));
    const integrationUIResponse = await fetch(chrome.runtime.getURL('content/modules/n8nIntegrationUI.js'));
    
    if (!integrationResponse.ok || !integrationUIResponse.ok) {
      throw new Error('No se pudieron cargar los archivos de integración con n8n');
    }
    
    // Obtener el texto de los scripts
    const integrationCode = await integrationResponse.text();
    const integrationUICode = await integrationUIResponse.text();
    
    // Crear scripts y evaluar el código
    const integrationScript = document.createElement('script');
    integrationScript.textContent = integrationCode;
    document.head.appendChild(integrationScript);
    
    const integrationUIScript = document.createElement('script');
    integrationUIScript.textContent = integrationUICode;
    document.head.appendChild(integrationUIScript);
    
    console.log('n8n modules loaded successfully');
    
    return true;
  } catch (error) {
    console.error('Error loading n8n modules:', error);
    throw error;
  }
}

// Función para enviar resultados a n8n
async function sendResultsToN8n(results, searchType) {
  try {
    // Verificar si el módulo está cargado
    if (!window.LeadManagerPro?.n8nIntegration) {
      console.warn('El módulo de integración con n8n no está disponible');
      return false;
    }
    
    const n8nIntegration = window.LeadManagerPro.n8nIntegration;
    
    // Determinar el tipo de datos
    let dataType = '';
    switch (searchType) {
      case 'people':
        dataType = 'profiles';
        break;
      case 'groups':
        dataType = 'groups';
        break;
      case 'members':
        dataType = 'members';
        break;
      default:
        dataType = 'data';
    }
    
    // Enviar datos a n8n
    const success = await n8nIntegration.sendToN8n(dataType, results);
    
    if (success) {
      console.log(`Datos enviados correctamente a n8n: ${results.length} ${dataType}`);
      addLogEntry(`${results.length} ${dataType} enviados a n8n`);
    } else {
      console.warn(`Los datos se almacenaron para envío posterior: ${results.length} ${dataType}`);
      addLogEntry(`${results.length} ${dataType} almacenados para envío posterior a n8n`);
    }
    
    return success;
  } catch (error) {
    console.error('Error al enviar resultados a n8n:', error);
    addLogEntry(`Error al enviar resultados a n8n: ${error.message}`, true);
    return false;
  }
}

/**
 * Carga los criterios guardados desde el almacenamiento local
 */
function loadSavedCriteriaFromStorage() {
  try {
    console.log('Iniciando carga de criterios guardados...');
    
    // Verificar que tenemos referencias a los elementos DOM
    if (!searchTypeSelect || !searchTermInput || !searchCityInput) {
      console.warn('Referencias DOM no inicializadas, reinicializando...');
      initDOMReferences();
    }
    
    // Verificar nuevamente después de inicializar
    if (!searchTypeSelect || !searchTermInput || !searchCityInput) {
      console.error('Referencias DOM críticas siguen faltando después de inicializar');
      return;
    }
    
    // Cargar criterios guardados desde localStorage
    const savedCriteria = localStorage.getItem('snap_lead_manager_saved_criteria');
    if (savedCriteria) {
      try {
        state.savedCriteria = JSON.parse(savedCriteria);
        console.log('Criterios guardados cargados:', state.savedCriteria.length);
      } catch (parseError) {
        console.error('Error al parsear criterios guardados:', parseError);
        state.savedCriteria = [];
      }
    } else {
      console.log('No se encontraron criterios guardados');
      state.savedCriteria = [];
    }
    
    // Mostrar estado actual de los elementos DOM
    console.log('Estado actual de elementos DOM:', {
      searchTypeSelect: searchTypeSelect ? 'OK' : 'No encontrado',
      searchTermInput: searchTermInput ? 'OK' : 'No encontrado',
      searchCityInput: searchCityInput ? 'OK' : 'No encontrado',
      maxScrollsInput: maxScrollsInput ? 'OK' : 'No encontrado',
      scrollDelayInput: scrollDelayInput ? 'OK' : 'No encontrado',
      publicGroupsCheckbox: publicGroupsCheckbox ? 'OK' : 'No encontrado',
      privateGroupsCheckbox: privateGroupsCheckbox ? 'OK' : 'No encontrado',
      minUsersInput: minUsersInput ? 'OK' : 'No encontrado',
      minPostsYearInput: minPostsYearInput ? 'OK' : 'No encontrado',
      minPostsMonthInput: minPostsMonthInput ? 'OK' : 'No encontrado',
      minPostsDayInput: minPostsDayInput ? 'OK' : 'No encontrado'
    });
    
    // Cargar opciones generales desde chrome.storage.local
    chrome.storage.local.get(['maxScrolls', 'scrollDelay', 'groupPublic', 'groupPrivate', 'minUsers', 'minPostsYear', 'minPostsMonth', 'minPostsDay'], function(result) {
      console.log('Opciones cargadas desde chrome.storage.local:', result);
      
      // Opciones generales
      if (maxScrollsInput) maxScrollsInput.value = result.maxScrolls || 4;
      if (scrollDelayInput) scrollDelayInput.value = result.scrollDelay || 2;
      
      state.maxScrolls = result.maxScrolls || 4;
      state.scrollDelay = result.scrollDelay || 2;
      
      // Opciones de grupo
      if (result.groupPublic !== undefined && publicGroupsCheckbox) {
        publicGroupsCheckbox.checked = result.groupPublic;
        console.log('Grupos públicos establecido a:', result.groupPublic);
      }
      
      if (result.groupPrivate !== undefined && privateGroupsCheckbox) {
        privateGroupsCheckbox.checked = result.groupPrivate;
        console.log('Grupos privados establecido a:', result.groupPrivate);
      }
      
      if (result.minUsers !== undefined && minUsersInput) {
        minUsersInput.value = result.minUsers;
        console.log('Mínimo usuarios establecido a:', result.minUsers);
      }
      
      if (result.minPostsYear !== undefined && minPostsYearInput) {
        minPostsYearInput.value = result.minPostsYear;
        console.log('Mínimo posts año establecido a:', result.minPostsYear);
      }
      
      if (result.minPostsMonth !== undefined && minPostsMonthInput) {
        minPostsMonthInput.value = result.minPostsMonth;
        console.log('Mínimo posts mes establecido a:', result.minPostsMonth);
      }
      
      if (result.minPostsDay !== undefined && minPostsDayInput) {
        minPostsDayInput.value = result.minPostsDay;
        console.log('Mínimo posts día establecido a:', result.minPostsDay);
      }
      
      console.log('Opciones generales cargadas:', {
        maxScrolls: state.maxScrolls,
        scrollDelay: state.scrollDelay
      });
      
      // Actualizar información de búsqueda después de cargar todas las opciones
      updateSearchInfo();
    });
    
    // Restaurar datos de búsqueda guardados si existen
    const savedSearchData = localStorage.getItem('snap_lead_manager_search_data');
    if (savedSearchData) {
      try {
        const searchData = JSON.parse(savedSearchData);
        console.log('Datos de búsqueda encontrados:', searchData);
        
        // Actualizar campos de formulario
        if (searchData.term && searchTermInput) {
          searchTermInput.value = searchData.term;
          state.currentSearchTerm = searchData.term;
          console.log('Término de búsqueda restaurado:', searchData.term);
        }
        
        if (searchData.city && searchCityInput) {
          searchCityInput.value = searchData.city;
          state.currentSearchCity = searchData.city;
          console.log('Ciudad restaurada:', searchData.city);
        }
        
        if (searchData.type && searchTypeSelect) {
          searchTypeSelect.value = searchData.type;
          state.currentSearchType = searchData.type;
          console.log('Tipo de búsqueda restaurado:', searchData.type);
          
          // Llamar handleSearchTypeChange con un pequeño retraso
          setTimeout(() => {
            if (typeof handleSearchTypeChange === 'function') {
              handleSearchTypeChange();
              console.log('handleSearchTypeChange ejecutado después de restaurar tipo');
            } else {
              console.warn('handleSearchTypeChange no está definido');
              // Implementación alternativa
              if (groupOptionsContainer) {
                groupOptionsContainer.style.display = searchData.type === 'groups' ? 'block' : 'none';
              }
            }
          }, 100);
        }
        
        // Si hay opciones de grupo en searchData, establecerlas
        if (searchData.groupOptions) {
          console.log('Restaurando opciones de grupo desde searchData:', searchData.groupOptions);
          
          if (publicGroupsCheckbox && searchData.groupOptions.publicGroups !== undefined) {
            publicGroupsCheckbox.checked = searchData.groupOptions.publicGroups;
          }
          
          if (privateGroupsCheckbox && searchData.groupOptions.privateGroups !== undefined) {
            privateGroupsCheckbox.checked = searchData.groupOptions.privateGroups;
          }
          
          if (minUsersInput && searchData.groupOptions.minUsers !== undefined) {
            minUsersInput.value = searchData.groupOptions.minUsers;
          }
          
          if (minPostsYearInput && searchData.groupOptions.minPostsYear !== undefined) {
            minPostsYearInput.value = searchData.groupOptions.minPostsYear;
          }
          
          if (minPostsMonthInput && searchData.groupOptions.minPostsMonth !== undefined) {
            minPostsMonthInput.value = searchData.groupOptions.minPostsMonth;
          }
          
          if (minPostsDayInput && searchData.groupOptions.minPostsDay !== undefined) {
            minPostsDayInput.value = searchData.groupOptions.minPostsDay;
          }
        }
        
        // Actualizar información de búsqueda
        updateSearchInfo();
      } catch (error) {
        console.error('Error al restaurar datos de búsqueda:', error);
      }
    } else {
      console.log('No se encontraron datos de búsqueda guardados');
    }
    
    console.log('Carga de criterios y opciones completada');
  } catch (error) {
    console.error('Error general al cargar datos guardados:', error);
    state.savedCriteria = [];
  }
}

// Función para obtener el estado actual de búsqueda
function getSearchStatus() {
  window.parent.postMessage({
    action: 'get_search_status'
  }, '*');
}

// Función para preparar datos para la base de datos
function prepareDataForDatabase(groupOptionsForSync) {
  try {
    // Guardar en localStorage para sincronización posterior
    localStorage.setItem('snap_lead_manager_pending_sync_data', JSON.stringify(groupOptionsForSync));
    console.log('Datos preparados para sincronización con base de datos:', groupOptionsForSync);
  } catch (error) {
    console.error('Error al preparar datos para base de datos:', error);
  }
}

// Función para iniciar la verificación periódica del estado de búsqueda
function startStatusChecking() {
  // Detener cualquier intervalo existente primero
  stopStatusChecking();
  
  // Iniciar un nuevo intervalo para verificar el estado cada 2 segundos
  statusCheckingInterval = setInterval(() => {
    // Obtener el estado actual de la búsqueda
    const status = getSearchStatus();
    
    // Actualizar la UI con el estado actual
    if (status) {
      updateStatus(status.message || 'Buscando...', status.progress || 0);
      
      // Actualizar la operación actual si está disponible
      if (currentOperation && status.operation) {
        currentOperation.textContent = status.operation;
      }
      
      // Si la búsqueda ha terminado, detener la verificación
      if (status.isFinished) {
        stopStatusChecking();
        // Restablecer UI
        state.isRunning = false;
        updateUI();
      }
    }
  }, 2000); // Verificar cada 2 segundos
  
  console.log('Iniciada verificación periódica del estado de búsqueda');
}

// Función para detener la verificación de estado
function stopStatusChecking() {
  if (statusCheckingInterval) {
    clearInterval(statusCheckingInterval);
    statusCheckingInterval = null;
    console.log('Detenida verificación periódica del estado de búsqueda');
  }
}
