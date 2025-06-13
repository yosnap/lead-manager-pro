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
  // Estos valores se sobrescribirán con los valores de chrome.storage.local
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
let onlyPublicGroupsCheckbox;
let minUsersInput;
let minPostsYearInput;
let minPostsMonthInput;
let minPostsDayInput;

// Referencias a gestión de criterios
let applySettingsButton;
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

// Referencias adicionales para configuración centralizada
let globalMaxScrollsInput;
let globalScrollDelayInput;
let autoSyncEnabledCheckbox;
let profileMaxResultsInput;
let profileDelayInput;
let profileAutoScrollCheckbox;
let groupMaxResultsInput;
let groupDelayInput;
let groupPublicOnlyCheckbox;
let groupAutoScrollCheckbox;
let saveGlobalConfigButton;
let globalSettingsStatus;

// Variables para el intervalo de verificación de estado
let statusCheckInterval = null;
const STATUS_CHECK_INTERVAL = 1000; // 1 segundo

// Al inicio del archivo, después de la declaración del estado global
const DEBUG = true;

function debugLog(...args) {
  if (DEBUG) {
    console.log('[Snap Lead Manager]', ...args);
  }
}

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

// Función para actualizar el estado y la UI
function updateStatus(message, progress = null, isError = false) {
  // Actualizar mensaje de estado
  state.statusMessage = message;

  // Actualizar progreso si se proporciona
  if (progress !== null) {
    state.progress = progress;
  }

  // Actualizar elementos de UI básicos
  if (statusMessage) {
    statusMessage.textContent = message;
    statusMessage.className = isError ? 'status error' : 'status';
  }

  if (progressBar && progress !== null) {
    progressBar.style.width = `${progress}%`;
  }

  // Actualizar elementos de UI detallados
  if (detailedStatusMessage) {
    detailedStatusMessage.textContent = message;
  }

  if (detailedProgressBar && progress !== null) {
    detailedProgressBar.style.width = `${progress}%`;
  }

  if (progressPercentage && progress !== null) {
    progressPercentage.textContent = `${Math.round(progress)}%`;
  }

  // Actualizar operación current
  if (currentOperation) {
    currentOperation.textContent = message;
  }

  // Actualizar tiempo transcurrido
  updateElapsedTime();

  // Actualizar estado de los botones
  if (pauseButton) {
    pauseButton.disabled = !state.isRunning;
    pauseButton.textContent = state.isPaused ? 'Reanudar' : 'Pausar';
  }

  if (stopButton) {
    stopButton.disabled = !state.isRunning;
  }

  // Agregar entrada al log
  addLogEntry(message, isError);
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

// Funciones de manejo de estado y búsqueda
function startStatusChecking() {
  debugLog('Iniciando verificación de estado...');

  if (statusCheckInterval) {
    clearInterval(statusCheckInterval);
    debugLog('Intervalo de verificación anterior limpiado');
  }

  // Actualizar tiempo transcurrido cada segundo
  statusCheckInterval = setInterval(() => {
    if (state.isRunning && !state.isPaused) {
      updateElapsedTime();
    }
  }, STATUS_CHECK_INTERVAL);

  // Verificar estado inicial
  getSearchStatus();
  debugLog('Verificación de estado iniciada');
}

function stopStatusChecking() {
  debugLog('Deteniendo verificación de estado...');

  if (statusCheckInterval) {
    clearInterval(statusCheckInterval);
    statusCheckInterval = null;
    debugLog('Verificación de estado detenida');
  }
}

function getSearchStatus() {
  debugLog('Solicitando estado actual de búsqueda...');
  window.parent.postMessage({
    action: 'get_search_status'
  }, '*');
}

// Modificar la función performSearch
function performSearch() {
  debugLog('Iniciando búsqueda...');

  try {
    // Obtener valores de los campos
    const searchType = searchTypeSelect.value;
    const searchTerm = searchTermInput.value.trim();
    const searchCity = searchCityInput.value.trim();

    debugLog('Datos de búsqueda:', { searchType, searchTerm, searchCity });

    // Validaciones básicas
    if (!searchTerm) {
      showError('Por favor ingrese un término de búsqueda');
      return;
    }

    // Limpiar estado previo
    state.profiles = [];
    state.progress = 0;
    state.isRunning = true;
    state.isPaused = false;
    state.searchStartTime = Date.now();
    state.currentSearchTerm = searchTerm;
    state.currentSearchCity = searchCity;
    state.currentSearchType = searchType;

    debugLog('Estado inicial configurado');

    // Limpiar localStorage de búsquedas previas
    localStorage.removeItem('snap_lead_manager_results_pending');
    localStorage.removeItem('snap_lead_manager_search_results');
    localStorage.removeItem('snap_lead_manager_city_filter_applied');
    localStorage.removeItem('snap_lead_manager_force_reload');
    localStorage.removeItem('snap_lead_manager_search_url');

    // Guardar datos de búsqueda
    const searchData = {
      type: searchType,
      term: searchTerm,
      city: searchCity,
      timestamp: Date.now()
    };
    chrome.storage.local.set({ snap_lead_manager_search_data: searchData });
    chrome.storage.local.set({ snap_lead_manager_search_active: true });

    debugLog('Datos de búsqueda guardados');

    // Actualizar UI
    document.body.classList.add('search-active');
    if (pauseButton) pauseButton.disabled = false;
    if (stopButton) stopButton.disabled = false;

    // Guardar opciones generales
    chrome.storage.local.set({
      maxScrolls: maxScrollsInput ? maxScrollsInput.value : 50,
      scrollDelay: scrollDelayInput ? scrollDelayInput.value : 2
    });

    // Guardar opciones de grupo si es una búsqueda de grupos
    if (searchType === 'groups') {
      // Usar la nueva lógica con onlyPublicGroups - validar que no sea undefined
      const onlyPublic = onlyPublicGroupsCheckbox?.checked || false;

      // Validar inputs antes de guardar para evitar claves undefined
      const minUsersValue = minUsersInput?.value || '';
      const minPostsYearValue = minPostsYearInput?.value || '';
      const minPostsMonthValue = minPostsMonthInput?.value || '';
      const minPostsDayValue = minPostsDayInput?.value || '';

      chrome.storage.local.set({
        groupPublic: true, // Siempre buscar públicos
        groupPrivate: !onlyPublic, // Solo buscar privados si onlyPublic es false
        onlyPublicGroups: onlyPublic, // Nueva propiedad
        minUsers: minUsersValue,
        minPostsYear: minPostsYearValue,
        minPostsMonth: minPostsMonthValue,
        minPostsDay: minPostsDayValue
      });
    }

    debugLog('Opciones guardadas');

    // Limpiar resultados previos
    if (searchResultsList) {
      searchResultsList.innerHTML = '';
    }
    if (resultsSummary) {
      resultsSummary.innerHTML = '';
    }

    // Inicializar la sección de estado
    if (searchStatusContainer) {
      searchStatusContainer.style.display = 'block';
    }

    // Actualizar estado inicial
    updateStatus(`Iniciando búsqueda de ${searchType === 'groups' ? 'grupos' : 'perfiles'}: ${searchTerm}`, 5);

    // Actualizar UI
    updateUI();
    updateSearchInfo();

    // Iniciar verificación del estado
    startStatusChecking();

    // Agregar entrada inicial al log
    addLogEntry(`Búsqueda iniciada: ${searchTerm}${searchCity ? ` en ${searchCity}` : ''}`);

    debugLog('Enviando mensaje para iniciar búsqueda...');

    // Enviar mensaje para iniciar la búsqueda
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'find_profiles',
          searchData: {
            type: searchType,
            term: searchTerm,
            city: searchCity,
            userInitiated: true,
            timestamp: Date.now()
          }
        });
        debugLog('Mensaje de búsqueda enviado');
      } else {
        throw new Error('No se encontró la pestaña activa');
      }
    });

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
    chrome.storage.local.set({ snap_lead_manager_search_active: false });

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
  console.log('Actualizando lista de resultados:', profiles);

  if (!searchResultsList) {
    console.error('No se encontró el contenedor de resultados');
    return;
  }

  // Limpiar lista actual
  searchResultsList.innerHTML = '';

  // Si no hay resultados, mostrar mensaje
  if (!profiles || profiles.length === 0) {
    const noResults = document.createElement('li');
    noResults.className = 'no-results';
    noResults.textContent = 'No se encontraron resultados';
    searchResultsList.appendChild(noResults);
    return;
  }

  // Agregar cada grupo a la lista
  profiles.forEach((group, index) => {
    const listItem = document.createElement('li');
    listItem.className = 'result-item';

    // Corregir la URL del grupo para que sea absoluta
    let groupUrl = group.url;
    if (groupUrl && !/^https?:\/\//.test(groupUrl)) {
      // Si no empieza con http o https, asume que es un ID o path
      groupUrl = 'https://www.facebook.com/groups/' + groupUrl.replace(/^\//, '');
    }

    // Crear contenido del item con estilos mejorados
    listItem.innerHTML = `
      <div class="result-item-container" style="padding: 15px; border-bottom: 1px solid #e4e6eb; background: white;">
        <div class="result-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <span class="result-name" style="font-weight: bold; font-size: 16px; color: #1c1e21;">
            ${group.name || 'Sin nombre'}
          </span>
          <a href="${groupUrl}" target="_blank" rel="noopener noreferrer" class="result-link" style="background: #1877f2; color: white; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 14px;">
            Ver grupo
          </a>
      </div>
        <div class="result-info" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; color: #65676b; font-size: 14px;">
          <div style="display: flex; align-items: center;">
            <span style="margin-right: 5px;">🔒</span>
            ${group.type === 'private' ? 'Privado' : 'Público'}
          </div>
          <div style="display: flex; align-items: center;">
            <span style="margin-right: 5px;">👥</span>
            ${typeof group.members === 'number' ? group.members.toLocaleString() : group.members} miembros
          </div>
          ${group.postsYear ? `
            <div style="display: flex; align-items: center;">
              <span style="margin-right: 5px;">📊</span>
              ${group.postsYear} publicaciones/año
            </div>
          ` : ''}
          ${group.postsMonth ? `
            <div style="display: flex; align-items: center;">
              <span style="margin-right: 5px;">📊</span>
              ${group.postsMonth} publicaciones/mes
            </div>
          ` : ''}
          ${group.postsDay ? `
            <div style="display: flex; align-items: center;">
              <span style="margin-right: 5px;">📊</span>
              ${group.postsDay} publicaciones/día
            </div>
          ` : ''}
        </div>
      </div>
    `;

    searchResultsList.appendChild(listItem);
  });

  // Guardar resultados en localStorage
  chrome.storage.local.set({ snap_lead_manager_search_results: profiles });

  // Mostrar resumen y crear botones de exportación con JS (no inline)
  if (resultsSummary) {
    resultsSummary.innerHTML = `
      <div class="results-summary" style="padding: 15px; background: #f0f2f5; border-radius: 8px; margin-top: 15px;">
        <h3 style="margin: 0 0 10px 0; color: #1c1e21;">Resumen de la búsqueda</h3>
        <p style="margin: 0 0 15px 0;">Se encontraron <strong>${profiles.length}</strong> grupos que cumplen con los criterios.</p>
        <div id="export-buttons" style="display: flex; gap: 10px;"></div>
      </div>
    `;
    resultsSummary.style.display = 'block';

    // Crear botones con JS para evitar CSP inline
    const exportButtons = document.getElementById('export-buttons');
    const btnJson = document.createElement('button');
    btnJson.className = 'snap-lead-button';
    btnJson.textContent = 'Exportar JSON';
    btnJson.style = 'background: #1877f2; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;';
    btnJson.addEventListener('click', () => exportResults('json'));

    const btnCsv = document.createElement('button');
    btnCsv.className = 'snap-lead-button';
    btnCsv.textContent = 'Exportar CSV';
    btnCsv.style = 'background: #1877f2; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;';
    btnCsv.addEventListener('click', () => exportResults('csv'));

    exportButtons.appendChild(btnJson);
    exportButtons.appendChild(btnCsv);
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
  onlyPublicGroupsCheckbox.checked = false; // Por defecto buscar públicos y privados
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

// Aplicar configuración actual sin guardar como criterio
function applyCurrentSettings() {
  try {
    // Obtener valores de los campos
    const maxScrollsValue = parseInt(maxScrollsInput.value, 10) || 50;
    const scrollDelayValue = parseFloat(scrollDelayInput.value) || 2;
    const minUsersValue = minUsersInput.value.trim() === '' ? 100 : (parseInt(minUsersInput.value, 10) || 100);
    const minPostsYearValue = minPostsYearInput.value.trim() === '' ? 50 : (parseInt(minPostsYearInput.value, 10) || 50);
    const minPostsMonthValue = minPostsMonthInput.value.trim() === '' ? 10 : (parseInt(minPostsMonthInput.value, 10) || 10);
    const minPostsDayValue = minPostsDayInput.value.trim() === '' ? 1 : (parseInt(minPostsDayInput.value, 10) || 1);

    // Obtener el valor de onlyPublic (definir fuera del bloque if para uso posterior)
    const onlyPublic = onlyPublicGroupsCheckbox ? onlyPublicGroupsCheckbox.checked : false;

    // Guardar opciones generales usando el nuevo módulo
    if (window.leadManagerPro && window.leadManagerPro.generalOptions) {
      const success1 = window.leadManagerPro.generalOptions.saveOptions({
        maxScrollsToShowResults: maxScrollsValue,
        waitTimeBetweenScrolls: scrollDelayValue
      });
      if (success1) {
        console.log('Opciones generales aplicadas:', { maxScrollsValue, scrollDelayValue });
      }
    }

    // Guardar opciones de búsqueda de grupos usando el nuevo módulo
    if (window.leadManagerPro && window.leadManagerPro.groupSearchOptions) {
      // Nueva lógica: onlyPublicGroups determina si buscar solo públicos o ambos
      const success2 = window.leadManagerPro.groupSearchOptions.saveOptions({
        groupTypes: {
          public: true, // Siempre buscar públicos
          private: !onlyPublic // Solo buscar privados si onlyPublic está false
        },
        onlyPublicGroups: onlyPublic, // Nueva propiedad para control
        minMembers: minUsersValue,
        minPosts: {
          year: minPostsYearValue,
          month: minPostsMonthValue,
          day: minPostsDayValue
        }
      });
      if (success2) {
        console.log('Opciones de grupos aplicadas:', {
          groupTypes: { public: true, private: !onlyPublic },
          onlyPublicGroups: onlyPublic,
          minMembers: minUsersValue,
          minPosts: { year: minPostsYearValue, month: minPostsMonthValue, day: minPostsDayValue }
        });
      }
    }

    // Mostrar mensaje de confirmación
    showTemporaryMessage('✓ Configuración aplicada correctamente');

    // Aplicar cambios al switch de Facebook si estamos en una página de búsqueda de grupos
    applyFacebookGroupTypeSwitch(onlyPublic);

  } catch (error) {
    console.error('Error al aplicar configuración:', error);
    showError('Error al aplicar la configuración. Revisa la consola para más detalles.');
  }
}

// Función para aplicar el estado del switch de "Grupos públicos" en Facebook
function applyFacebookGroupTypeSwitch(onlyPublic) {
  try {
    // Buscar el switch de "Grupos públicos" en Facebook usando el aria-label
    const publicGroupsSwitch = document.querySelector('input[aria-label="Grupos públicos"][role="switch"]');

    if (publicGroupsSwitch) {
      // Verificar si el estado actual es diferente al deseado
      const currentState = publicGroupsSwitch.getAttribute('aria-checked') === 'true';

      if (currentState !== onlyPublic) {
        console.log('Facebook switch encontrado. Estado actual:', currentState, 'Estado deseado:', onlyPublic);

        // Hacer click en el switch para cambiarlo
        publicGroupsSwitch.click();

        // Verificar que el cambio se aplicó
        setTimeout(() => {
          const newState = publicGroupsSwitch.getAttribute('aria-checked') === 'true';
          console.log('Estado después del click:', newState);

          if (newState === onlyPublic) {
            showTemporaryMessage('✓ Switch de Facebook actualizado correctamente');
          } else {
            console.warn('El switch no cambió como se esperaba');
          }
        }, 500);

      } else {
        console.log('El switch ya está en el estado correcto:', onlyPublic);
      }
    } else {
      console.log('Switch de grupos públicos no encontrado en esta página');
    }

  } catch (error) {
    console.error('Error al aplicar switch de Facebook:', error);
  }
}

// Función para agregar listener al checkbox para auto-aplicar
function setupAutoApplyFacebookSwitch() {
  if (onlyPublicGroupsCheckbox) {
    onlyPublicGroupsCheckbox.addEventListener('change', function() {
      console.log('Checkbox cambió a:', this.checked);

      // Auto-aplicar cambio al switch de Facebook
      setTimeout(() => {
        applyFacebookGroupTypeSwitch(this.checked);
      }, 100);
    });

    console.log('Auto-apply Facebook switch configurado');
  }
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
      onlyPublicGroups: onlyPublicGroupsCheckbox.checked,
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
  chrome.storage.local.set({ snap_lead_manager_saved_criteria: state.savedCriteria });

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
      onlyPublicGroups: onlyPublicGroupsCheckbox.checked,
      minUsers: minUsersValue,
      minPostsYear: minPostsYearValue,
      minPostsMonth: minPostsMonthValue,
      minPostsDay: minPostsDayValue
    }
  };

  // Agregar a la lista
  state.savedCriteria.push(criteria);

  // NUEVO: Guardar también en los nuevos módulos de opciones
  try {
    // Guardar opciones generales
    if (window.leadManagerPro && window.leadManagerPro.generalOptions) {
      window.leadManagerPro.generalOptions.saveOptions({
        maxScrollsToShowResults: criteria.maxScrolls,
        waitTimeBetweenScrolls: criteria.scrollDelay
      });
    }

    // Guardar opciones de búsqueda de grupos
    if (window.leadManagerPro && window.leadManagerPro.groupSearchOptions) {
      const onlyPublic = criteria.groupOptions.onlyPublicGroups;
      window.leadManagerPro.groupSearchOptions.saveOptions({
        groupTypes: {
          public: true, // Siempre buscar públicos
          private: !onlyPublic // Solo buscar privados si onlyPublic está false
        },
        onlyPublicGroups: onlyPublic,
        minMembers: criteria.groupOptions.minUsers || 100,
        minPosts: {
          year: criteria.groupOptions.minPostsYear || 50,
          month: criteria.groupOptions.minPostsMonth || 10,
          day: criteria.groupOptions.minPostsDay || 1
        }
      });
    }
  } catch (error) {
    console.error('Error al guardar en nuevos módulos:', error);
  }

  // Guardar en localStorage
  chrome.storage.local.set({ snap_lead_manager_saved_criteria: state.savedCriteria });

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
    // Manejar nueva lógica: si tiene onlyPublicGroups usar eso, sino convertir de la lógica antigua
    if (criteria.groupOptions.hasOwnProperty('onlyPublicGroups')) {
      onlyPublicGroupsCheckbox.checked = criteria.groupOptions.onlyPublicGroups;
    } else {
      // Convertir lógica antigua: si solo públicos están marcados, marcar onlyPublic
      const publicOnly = criteria.groupOptions.publicGroups === true && criteria.groupOptions.privateGroups === false;
      onlyPublicGroupsCheckbox.checked = publicOnly;
    }

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
    chrome.storage.local.set({ snap_lead_manager_saved_criteria: state.savedCriteria });

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
    chrome.storage.local.set({ snap_lead_manager_saved_criteria: state.savedCriteria });

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
  onlyPublicGroupsCheckbox = document.getElementById('only-public-groups');
  minUsersInput = document.getElementById('min-users');
  minPostsYearInput = document.getElementById('min-posts-year');
  minPostsMonthInput = document.getElementById('min-posts-month');
  minPostsDayInput = document.getElementById('min-posts-day');

  // Gestión de criterios
  applySettingsButton = document.getElementById('apply-settings');
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

  // Referencias para tabs
  tabButtons = document.querySelectorAll('.tab-button');
  tabContents = document.querySelectorAll('.tab-content');

  // Referencias para integración con n8n
  n8nIntegrationContainer = document.getElementById('n8n-integration-container');

  // Referencias adicionales para configuración centralizada
  globalMaxScrollsInput = document.getElementById('global-max-scrolls');
  globalScrollDelayInput = document.getElementById('global-scroll-delay');
  autoSyncEnabledCheckbox = document.getElementById('auto-sync-enabled');
  profileMaxResultsInput = document.getElementById('profile-max-results');
  profileDelayInput = document.getElementById('profile-delay');
  profileAutoScrollCheckbox = document.getElementById('profile-auto-scroll');
  groupMaxResultsInput = document.getElementById('group-max-results');
  groupDelayInput = document.getElementById('group-delay');
  groupPublicOnlyCheckbox = document.getElementById('group-public-only');
  groupAutoScrollCheckbox = document.getElementById('group-auto-scroll');
  saveGlobalConfigButton = document.getElementById('save-global-config');
  globalSettingsStatus = document.getElementById('global-settings-status');
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

// Función para aplicar criterios de búsqueda
function applySavedCriteria(criteria) {
  if (!criteria) return;

  // Aplicar valores básicos
  if (searchTypeSelect) searchTypeSelect.value = criteria.type || 'groups';
  if (searchTermInput) searchTermInput.value = criteria.term || '';
  if (searchCityInput) searchCityInput.value = criteria.city || '';

  // Aplicar opciones generales
  if (maxScrollsInput) maxScrollsInput.value = criteria.maxScrolls || 50;
  if (scrollDelayInput) scrollDelayInput.value = criteria.scrollDelay || 2;

  // Aplicar opciones de grupo si existen
  if (criteria.groupOptions) {
    // Usar nueva lógica con onlyPublicGroups
    if (onlyPublicGroupsCheckbox) {
      if (criteria.groupOptions.hasOwnProperty('onlyPublicGroups')) {
        onlyPublicGroupsCheckbox.checked = criteria.groupOptions.onlyPublicGroups;
      } else {
        // Convertir lógica antigua
        const publicOnly = criteria.groupOptions.publicGroups === true && criteria.groupOptions.privateGroups === false;
        onlyPublicGroupsCheckbox.checked = publicOnly;
      }
    }
    if (minUsersInput) minUsersInput.value = criteria.groupOptions.minUsers || '';
    if (minPostsYearInput) minPostsYearInput.value = criteria.groupOptions.minPostsYear || '';
    if (minPostsMonthInput) minPostsMonthInput.value = criteria.groupOptions.minPostsMonth || '';
    if (minPostsDayInput) minPostsDayInput.value = criteria.groupOptions.minPostsDay || '';
  }

  // Actualizar estado
  state.currentSearchTerm = criteria.term || '';
  state.currentSearchCity = criteria.city || '';
  state.currentSearchType = criteria.type || 'groups';

  // Manejar cambio de tipo de búsqueda
          handleSearchTypeChange();

        // Actualizar información de búsqueda
        updateSearchInfo();

  // Guardar criterios en localStorage
  chrome.storage.local.set({ snap_lead_manager_search_criteria: criteria });
}

// Función para inicializar eventos
function initializeEvents() {
  debugLog('Inicializando eventos...');

  // Eventos de búsqueda
  if (searchButton) {
    searchButton.addEventListener('click', performSearch);
    debugLog('Evento de búsqueda configurado');
  }

  if (pauseButton) {
    pauseButton.disabled = true;
    pauseButton.addEventListener('click', togglePauseSearch);
    debugLog('Evento de pausa configurado');
  }

  if (stopButton) {
    stopButton.disabled = true;
    stopButton.addEventListener('click', stopSearch);
    debugLog('Evento de detener configurado');
  }

  if (openWindowButton) {
    openWindowButton.addEventListener('click', openInWindow);
    debugLog('Evento de abrir en ventana configurado');
  }

  // Eventos de tipo de búsqueda
  if (searchTypeSelect) {
    searchTypeSelect.addEventListener('change', handleSearchTypeChange);
    handleSearchTypeChange(); // Inicializar tipo de búsqueda
    debugLog('Eventos de tipo de búsqueda configurados');
  }

  // Eventos de configuración
  if (collapsibleTrigger) {
    collapsibleTrigger.addEventListener('click', toggleCollapsible);
    debugLog('Evento de configuración avanzada configurado');
  }

  // Eventos de criterios
  if (clearCriteriaButton) {
    clearCriteriaButton.addEventListener('click', clearSearchCriteria);
    debugLog('Evento de limpiar criterios configurado');
  }

  if (applySettingsButton) {
    applySettingsButton.addEventListener('click', applyCurrentSettings);
    debugLog('Evento de aplicar configuración configurado');
  }

  if (saveCriteriaButton) {
    saveCriteriaButton.addEventListener('click', showSaveCriteriaModal);
    debugLog('Evento de guardar criterios configurado');
  }

  if (cancelEditButton) {
    cancelEditButton.addEventListener('click', () => {
      state.editingCriteriaId = null;
      updateUI();
    });
    debugLog('Evento de cancelar edición configurado');
  }

  if (manageCriteriaButton) {
    manageCriteriaButton.addEventListener('click', showManageCriteriaModal);
    debugLog('Evento de administrar criterios configurado');
  }

  // Eventos de modales
  const closeModalButtons = document.querySelectorAll('.close-modal');
  closeModalButtons.forEach(btn => {
    btn.addEventListener('click', closeModals);
  });
  debugLog('Eventos de modales configurados');

  if (confirmSaveButton) {
    confirmSaveButton.addEventListener('click', saveSearchCriteria);
  }

  if (cancelSaveButton) {
    cancelSaveButton.addEventListener('click', closeModals);
  }

  if (closeManageCriteriaButton) {
    closeManageCriteriaButton.addEventListener('click', closeModals);
  }

  // Configurar auto-aplicación del switch de Facebook
  setupAutoApplyFacebookSwitch();

  debugLog('Todos los eventos inicializados correctamente');
}

// Cargar configuraciones globales desde chrome.storage.local
async function loadGlobalConfig() {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get(['generalOptions'], (result) => {
        if (result && result.generalOptions) {
          // Actualizar estado con las configuraciones globales
          state.maxScrolls = result.generalOptions.maxScrolls || state.maxScrolls;
          state.scrollDelay = result.generalOptions.scrollDelay || state.scrollDelay;

          // Actualizar los campos del formulario si existen
          if (maxScrollsInput) {
            maxScrollsInput.value = state.maxScrolls;
          }

          if (scrollDelayInput) {
            scrollDelayInput.value = state.scrollDelay;
          }

          debugLog('Configuraciones globales cargadas desde Extension Storage:', result.generalOptions);
        } else {
          debugLog('No se encontraron configuraciones globales en Extension Storage, usando valores por defecto');
        }
        resolve();
      });
    } catch (error) {
      console.error('Error al cargar configuraciones globales:', error);
      resolve();
    }
  });
}

// Modificar la función initializeSidebar para incluir la inicialización de eventos
async function initializeSidebar() {
  debugLog('Iniciando sidebar...');

  try {
    // Inicializar referencias DOM
    initDOMReferences();
    debugLog('Referencias DOM inicializadas');

    // Inicializar eventos
    initializeEvents();
    debugLog('Eventos inicializados');

    // Cargar configuraciones globales
    await loadGlobalConfig();
    debugLog('Configuraciones globales cargadas');

    // Cargar estado guardado
    await loadSavedState();
    debugLog('Estado guardado cargado');

    // Configurar listeners de mensajes
    setupMessageListeners();
    debugLog('Listeners de mensajes configurados');

    // Inicializar navegación por tabs
    initTabNavigation();
    debugLog('Navegación por tabs inicializada');

    // Verificar si hay una búsqueda en curso
    const searchActive = chrome.storage.local.get({ snap_lead_manager_search_active: false }, (result) => result.snap_lead_manager_search_active);
    debugLog('Estado de búsqueda activa:', searchActive);

    if (searchActive) {
      debugLog('Recuperando estado de búsqueda activa...');
      // Restaurar estado de búsqueda
      state.isRunning = true;
      updateUI();
      // Solicitar estado actual
      requestSearchStatus();
    }

    // Inicializar tab activo
    const activeTab = document.querySelector('.tab-button.active');
    if (activeTab) {
      const tabId = activeTab.getAttribute('data-tab');
      if (tabId === 'n8n-tab') {
        setTimeout(() => {
        initN8nIntegration();
        }, 500);
      }
    }

    // Actualizar UI inicial
    updateUI();

    debugLog('Sidebar inicializado correctamente');
    return true;
  } catch (error) {
    console.error('Error al inicializar sidebar:', error);
    return false;
  }
}

// Función para cargar el estado guardado
async function loadSavedState() {
  debugLog('Cargando estado guardado...');

  try {
    // Cargar criterios guardados
    const savedCriteria = chrome.storage.local.get({ snap_lead_manager_saved_criteria: [] }, (result) => result.snap_lead_manager_saved_criteria);
    if (savedCriteria) {
      state.savedCriteria = savedCriteria;
      debugLog('Criterios guardados cargados:', state.savedCriteria.length);
    }

    // Cargar resultados previos si existen
    const savedResults = chrome.storage.local.get({ snap_lead_manager_search_results: [] }, (result) => result.snap_lead_manager_search_results);
    if (savedResults) {
      const results = savedResults;
      debugLog('Resultados previos encontrados:', results.length);
      // Mostrar resultados previos
      handleSearchResults(results, 'Resultados de búsqueda previa');
    }

    // Cargar datos de búsqueda actual
    const searchData = chrome.storage.local.get({ snap_lead_manager_search_data: {} }, (result) => result.snap_lead_manager_search_data);
    if (searchData) {
      const data = searchData;
      debugLog('Datos de búsqueda actual:', data);

      // Actualizar campos
      if (searchTermInput) searchTermInput.value = data.term || '';
      if (searchCityInput) searchCityInput.value = data.city || '';
      if (searchTypeSelect) {
        searchTypeSelect.value = data.type || 'groups';
        handleSearchTypeChange();
      }

      // Actualizar estado
      state.currentSearchTerm = data.term || '';
      state.currentSearchCity = data.city || '';
      state.currentSearchType = data.type || 'groups';

      updateSearchInfo();
    }

    debugLog('Estado guardado cargado correctamente');
      } catch (error) {
    console.error('Error al cargar estado guardado:', error);
  }
}

// Función para configurar listeners de mensajes
function setupMessageListeners() {
  debugLog('Configurando listeners de mensajes...');

  // Listener principal de mensajes
  window.addEventListener('message', function(event) {
    const message = event.data;
    if (!message || !message.action) return;

    debugLog('Mensaje recibido:', message.action, message);

    switch (message.action) {
      case 'status_update':
        // Robustecer el mapeo de estado recibido
        const s = message.status || {};
        // Permitir compatibilidad con payload plano o anidado
        state.isRunning = s.isSearching !== undefined ? s.isSearching : (s.isRunning !== undefined ? s.isRunning : false);
        state.isPaused = s.pauseSearch !== undefined ? s.pauseSearch : (s.isPaused !== undefined ? s.isPaused : false);
        state.progress = s.progress !== undefined ? s.progress : 0;
        state.statusMessage = s.message || s.statusMessage || 'Actualizando...';
        updateStatus(state.statusMessage, state.progress);
        updateUI();
        debugLog('Estado actualizado (robusto):', {
          isRunning: state.isRunning,
          isPaused: state.isPaused,
          message: state.statusMessage,
          progress: state.progress
        });
        break;

      case 'search_result':
      case 'found_results':
        if (message.results || (message.result && message.result.profiles)) {
          const results = message.results || message.result.profiles;
          const statusMessage = message.message || message.result.message;
          debugLog('Resultados recibidos:', results.length);

          // Actualizar estado antes de procesar resultados
          state.isRunning = false;
          state.isPaused = false;

          // Procesar resultados
          handleSearchResults(results, statusMessage);

          // Actualizar estado final
          updateStatus(statusMessage || 'Búsqueda completada', 100);
          document.body.classList.remove('search-active');
          chrome.storage.local.set({ snap_lead_manager_search_active: false });

          // Detener verificación de estado
          stopStatusChecking();

          // Actualizar UI final
          updateUI();

          debugLog('Procesamiento de resultados completado');
        }
        break;

      case 'error':
        console.error('Error recibido:', message.error);
        showError(message.error);
        state.isRunning = false;
        state.isPaused = false;
        chrome.storage.local.set({ snap_lead_manager_search_active: false });
        stopStatusChecking();
        updateUI();
        debugLog('Error procesado:', message.error);
        break;

      case 'sidebar_ready':
        debugLog('Sidebar listo, verificando estado inicial...');
        // Si hay una búsqueda activa, solicitar estado
        if (chrome.storage.local.get({ snap_lead_manager_search_active: false }, (result) => result.snap_lead_manager_search_active)) {
          getSearchStatus();
        }
        break;
    }
  });

  // Enviar mensaje de que el sidebar está listo
  window.parent.postMessage({
    action: 'sidebar_ready'
  }, '*');

  debugLog('Listeners de mensajes configurados correctamente');
}

// Función para solicitar estado actual de búsqueda
function requestSearchStatus() {
  debugLog('Solicitando estado actual de búsqueda...');
  window.parent.postMessage({
    action: 'get_search_status'
  }, '*');
}

// Modificar el evento DOMContentLoaded
document.addEventListener('DOMContentLoaded', async function() {
  debugLog('DOM cargado, iniciando aplicación...');

  // Inicializar sidebar
  const initialized = await initializeSidebar();

  if (initialized) {
    debugLog('Aplicación iniciada correctamente');
  } else {
    console.error('Error al iniciar la aplicación');
  }
});

function initTabNavigation() {
  debugLog('Inicializando navegación por tabs...');

  if (!tabButtons || !tabContents) {
    console.error('Tab buttons or tab contents not found in the DOM');
    return;
  }

  // Asegurarse de que los contenedores de resultados existan
  const resultsTab = document.getElementById('results-tab');
  if (resultsTab && !document.getElementById('search-results')) {
    const resultsList = document.createElement('ul');
    resultsList.id = 'search-results';
    resultsList.className = 'results-list';
    resultsTab.appendChild(resultsList);
    debugLog('Contenedor de resultados creado');
  }

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      debugLog('Tab clicked:', tabId);

      // Desactivar todos los tabs
      tabButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      });
      tabContents.forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
      });

      // Activar el tab seleccionado
      button.classList.add('active');
      button.setAttribute('aria-selected', 'true');
      const tabContent = document.getElementById(tabId);
      if (tabContent) {
        tabContent.classList.add('active');
        tabContent.style.display = 'block';
        debugLog('Tab activado:', tabId);

        // Si es el tab de resultados, asegurar que los resultados sean visibles
        if (tabId === 'results-tab' && state.profiles && state.profiles.length > 0) {
          const searchResultsList = document.getElementById('search-results');
          const resultsSummary = document.getElementById('results-summary');
          if (searchResultsList) searchResultsList.style.display = 'block';
          if (resultsSummary) resultsSummary.style.display = 'block';
          debugLog('Contenido de resultados mostrado');
        }

        // Si es el tab de integración con n8n, inicializar si es necesario
        if (tabId === 'n8n-tab') {
          debugLog('Inicializando n8n integration');
          initN8nIntegration();
        }
      } else {
        console.error('Tab content not found:', tabId);
      }
    });
  });

  debugLog('Navegación por tabs inicializada');
}

// Implementación directa de los módulos de n8n en caso de que la carga falle
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

// Función para manejar los resultados de búsqueda
function handleSearchResults(results, message = '') {
  debugLog('Manejando resultados de búsqueda:', results);

  if (!Array.isArray(results)) {
    console.error('Los resultados no son un array:', results);
    return;
  }

  // Mapear group.groupUrl a group.url si es necesario
  results = results.map(group => ({
    ...group,
    url: group.url || group.groupUrl || ''
  }));

  // Actualizar estado
  state.profiles = results;
  state.foundCount = results.length;

  // Obtener referencias a los elementos necesarios
  const resultsTab = document.querySelector('.tab-button[data-tab="results-tab"]');
  const resultsContent = document.getElementById('results-tab');

  // Activar la pestaña de resultados sin deshabilitar la navegación
  if (resultsTab && resultsContent) {
    // Cambiar a la pestaña de resultados
    tabButtons.forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    });
    tabContents.forEach(content => {
      content.classList.remove('active');
      content.style.display = 'none';
    });

    resultsTab.classList.add('active');
    resultsTab.setAttribute('aria-selected', 'true');
    resultsContent.classList.add('active');
    resultsContent.style.display = 'block';
  }

  // Actualizar contenido de resultados
  let searchResultsList = document.getElementById('search-results');
  if (!searchResultsList) {
    debugLog('Creando nuevo contenedor de resultados');
    const newResultsList = document.createElement('ul');
    newResultsList.id = 'search-results';
    newResultsList.className = 'results-list';
    resultsContent.appendChild(newResultsList);
    searchResultsList = newResultsList;
  }

  // Limpiar y mostrar el contenedor de resultados
  searchResultsList.innerHTML = '';
  searchResultsList.style.display = 'block';

  // Agregar cada resultado a la lista
  results.forEach((group) => {
    const listItem = document.createElement('li');
    listItem.className = 'result-item';
    // Corregir la URL del grupo para que sea absoluta
    let groupUrl = group.url;
    if (groupUrl && !/^https?:\/\//.test(groupUrl)) {
      groupUrl = 'https://www.facebook.com/groups/' + groupUrl.replace(/^\//, '');
    }
    listItem.innerHTML = `
      <div class="result-item-container">
        <div class="result-header">
          <span class="result-name">${group.name || 'Sin nombre'}</span>
          <a href="${groupUrl}" target="_blank" rel="noopener noreferrer" class="result-link">Ver grupo</a>
        </div>
        <div class="result-info">
          <div>
            <span>🔒</span>
            ${group.type === 'private' ? 'Privado' : 'Público'}
          </div>
          <div>
            <span>👥</span>
            ${typeof group.members === 'number' ? group.members.toLocaleString() : group.members} miembros
          </div>
          ${group.postsYear ? `
            <div>
              <span>📊</span>
              ${group.postsYear} publicaciones/año
            </div>
          ` : ''}
          ${group.postsMonth ? `
            <div>
              <span>📊</span>
              ${group.postsMonth} publicaciones/mes
            </div>
          ` : ''}
          ${group.postsDay ? `
            <div>
              <span>📊</span>
              ${group.postsDay} publicaciones/día
            </div>
          ` : ''}
        </div>
      </div>
       `;
    searchResultsList.appendChild(listItem);
  });

  // Crear o actualizar el resumen y los botones de exportación (sin inline onclick)
  if (!resultsSummary) {
    resultsSummary = document.createElement('div');
    resultsSummary.id = 'results-summary';
    if (resultsContent) {
      resultsContent.appendChild(resultsSummary);
    }
  }

  resultsSummary.innerHTML = `
    <div class="results-summary">
      <h3>Resumen de la búsqueda</h3>
      <p>Se encontraron <strong>${results.length}</strong> grupos que cumplen con los criterios.</p>
      <div id="export-buttons" class="export-buttons"></div>
    </div>
  `;
  resultsSummary.style.display = 'block';

  // Crear botones de exportación con JS para evitar CSP inline
  const exportButtons = document.getElementById('export-buttons');
  const btnJson = document.createElement('button');
  btnJson.className = 'snap-lead-button';
  btnJson.textContent = 'Exportar JSON';
  btnJson.addEventListener('click', () => exportResults('json'));

  const btnCsv = document.createElement('button');
  btnCsv.className = 'snap-lead-button';
  btnCsv.textContent = 'Exportar CSV';
  btnCsv.addEventListener('click', () => exportResults('csv'));

  exportButtons.appendChild(btnJson);
  exportButtons.appendChild(btnCsv);

  // Agregar entrada al log
  addLogEntry(message || `Búsqueda completada. Se encontraron ${results.length} grupos.`);

  // Guardar resultados en localStorage
  chrome.storage.local.set({ snap_lead_manager_search_results: results });

  // Actualizar UI
  updateUI();

  // Forzar un reflow para asegurar que los cambios se apliquen
  resultsContent?.offsetHeight;

  debugLog('Resultados procesados y mostrados');
}

// Función para exportar resultados
function exportResults(format) {
  let results = state.profiles;
  // Si no hay resultados en el estado, intenta recuperarlos de localStorage
  if (!results || !Array.isArray(results) || results.length === 0) {
    try {
      const saved = chrome.storage.local.get({ snap_lead_manager_search_results: [] }, (result) => result.snap_lead_manager_search_results);
      if (saved) {
        results = saved;
      }
    } catch (e) {}
  }
  if (!results || !Array.isArray(results) || results.length === 0) {
    showError('No hay resultados para exportar');
    return;
  }

  // Obtener datos de búsqueda actual del estado
  const searchTerm = state.currentSearchTerm || '';
  const searchType = state.currentSearchType || '';
  const location = state.currentSearchCity || '';

  // Normalizar y limpiar los datos antes de exportar
  const exportData = results.map(group => {
    // Limpiar la url de parámetros
    let cleanUrl = group.groupUrl || group.url || '';
    if (cleanUrl.includes('?')) cleanUrl = cleanUrl.split('?')[0];
    // Mapear publicaciones según frequency si no existen los campos
    let postsYear = group.postsYear || 0;
    let postsMonth = group.postsMonth || 0;
    let postsDay = group.postsDay || 0;
    if ((!postsYear && !postsMonth && !postsDay) && group.frequency) {
      const freq = group.frequency.toLowerCase();
      const match = group.frequency.match(/(\d+[\.,]?\d*)/);
      const num = match ? parseFloat(match[0].replace(',', '.')) : 0;
      if (freq.includes('año')) postsYear = num;
      else if (freq.includes('mes')) postsMonth = num;
      else if (freq.includes('día')) postsDay = num;
    }
    return {
      name: group.name || '',
      groupType: group.groupType || '',
      groupUrl: cleanUrl,
      imageUrl: group.imageUrl || '',
      members: group.members || '',
      membersCount: group.membersCount || '',
      frequency: group.frequency || '',
      postsYear,
      postsMonth,
      postsDay,
      searchTerm, // Siempre desde el estado global
      searchType, // Siempre desde el estado global
      location,   // Siempre desde el estado global
      extractedAt: group.extractedAt || ''
    };
  });

  if (format === 'json') {
    const content = JSON.stringify(exportData, null, 2);
    const filename = 'grupos_facebook.json';
    const type = 'application/json';
    downloadFile(content, filename, type);
  } else if (format === 'csv') {
    const headers = [
      'name', 'groupType', 'groupUrl', 'imageUrl', 'members', 'membersCount', 'frequency',
      'postsYear', 'postsMonth', 'postsDay', 'searchTerm', 'searchType', 'location', 'extractedAt'
    ];
    const rows = [
      headers.join(','),
      ...exportData.map(group => headers.map(h => {
        let val = group[h];
        if (typeof val === 'string') {
          val = val.replace(/"/g, '""'); // Escapar comillas
          if (val.includes(',') || val.includes('\n')) val = '"' + val + '"';
        }
        return val;
      }).join(','))
    ];
    const content = rows.join('\n');
    const filename = 'grupos_facebook.csv';
    const type = 'text/csv';
    downloadFile(content, filename, type);
  }
}

// --- Auto-save group settings and show toast ---
function showGroupSettingsToast() {
  const toast = document.getElementById('group-settings-toast');
  if (toast) {
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 2000);
  }
}

function saveGroupSettings() {
  // Get values from group settings inputs
  const minUsers = document.getElementById('min-users')?.valueAsNumber || 0;
  const minPostsYear = document.getElementById('min-posts-year')?.valueAsNumber || 0;
  const minPostsMonth = document.getElementById('min-posts-month')?.valueAsNumber || 0;
  const minPostsDay = document.getElementById('min-posts-day')?.valueAsNumber || 0;
  const onlyPublicGroups = document.getElementById('only-public-groups')?.checked || false;

  // Save to chrome.storage.sync
  chrome.storage.sync.set({
    groupFilters: {
      minUsers,
      minPostsYear,
      minPostsMonth,
      minPostsDay,
      onlyPublicGroups
    }
  }, () => {
    showGroupSettingsToast();
  });
}

function loadGroupSettings() {
  chrome.storage.sync.get('groupFilters', (result) => {
    const filters = result.groupFilters || {};
    if (document.getElementById('min-users')) document.getElementById('min-users').value = filters.minUsers ?? 1000;
    if (document.getElementById('min-posts-year')) document.getElementById('min-posts-year').value = filters.minPostsYear ?? 1000;
    if (document.getElementById('min-posts-month')) document.getElementById('min-posts-month').value = filters.minPostsMonth ?? 100;
    if (document.getElementById('min-posts-day')) document.getElementById('min-posts-day').value = filters.minPostsDay ?? 5;
    if (document.getElementById('only-public-groups')) document.getElementById('only-public-groups').checked = !!filters.onlyPublicGroups;
  });
}

function setupGroupSettingsButton() {
  const saveBtn = document.getElementById('save-group-settings');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveGroupSettings);
  }
}

// Call setup and load on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  setupGroupSettingsButton();
  loadGroupSettings();
});

// --- Advanced settings logic for both search types ---
function showAdvancedSettingsToast() {
  const toast = document.getElementById('advanced-settings-toast');
  if (toast) {
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 2000);
  }
}

function saveAdvancedSettings() {
  const searchType = document.getElementById('search-type')?.value || 'people';
  const maxScrolls = document.getElementById('max-scrolls')?.valueAsNumber || 50;
  const scrollDelay = document.getElementById('scroll-delay')?.valueAsNumber || 2;

  if (searchType === 'groups') {
    const minUsers = document.getElementById('min-users')?.valueAsNumber || 0;
    const minPostsYear = document.getElementById('min-posts-year')?.valueAsNumber || 0;
    const minPostsMonth = document.getElementById('min-posts-month')?.valueAsNumber || 0;
    const minPostsDay = document.getElementById('min-posts-day')?.valueAsNumber || 0;
    const onlyPublicGroups = document.getElementById('only-public-groups')?.checked || false;
    chrome.storage.sync.set({
      groupSearchSettings: {
        maxScrolls,
        scrollDelay,
        minUsers,
        minPostsYear,
        minPostsMonth,
        minPostsDay,
        onlyPublicGroups
      }
    }, showAdvancedSettingsToast);
  } else {
    chrome.storage.sync.set({
      peopleSearchSettings: {
        maxScrolls,
        scrollDelay
      }
    }, showAdvancedSettingsToast);
  }
}

function loadAdvancedSettings() {
  const searchType = document.getElementById('search-type')?.value || 'people';
  if (searchType === 'groups') {
    chrome.storage.sync.get('groupSearchSettings', (result) => {
      const s = result.groupSearchSettings || {};
      document.getElementById('max-scrolls').value = s.maxScrolls ?? 50;
      document.getElementById('scroll-delay').value = s.scrollDelay ?? 2;
      document.getElementById('min-users').value = s.minUsers ?? 1000;
      document.getElementById('min-posts-year').value = s.minPostsYear ?? 1000;
      document.getElementById('min-posts-month').value = s.minPostsMonth ?? 100;
      document.getElementById('min-posts-day').value = s.minPostsDay ?? 5;
      document.getElementById('only-public-groups').checked = !!s.onlyPublicGroups;
    });
  } else {
    chrome.storage.sync.get('peopleSearchSettings', (result) => {
      const s = result.peopleSearchSettings || {};
      document.getElementById('max-scrolls').value = s.maxScrolls ?? 50;
      document.getElementById('scroll-delay').value = s.scrollDelay ?? 2;
    });
  }
}

function updateAdvancedSettingsVisibility() {
  const searchType = document.getElementById('search-type')?.value || 'people';
  const scrollsDelayFields = document.getElementById('scrolls-delay-fields');
  const groupOptions = document.getElementById('group-options');
  if (scrollsDelayFields) scrollsDelayFields.style.display = 'block';
  if (groupOptions) groupOptions.style.display = (searchType === 'groups') ? 'block' : 'none';
}

function setupAdvancedSettingsEvents() {
  const saveBtn = document.getElementById('save-advanced-settings');
  if (saveBtn) saveBtn.addEventListener('click', saveAdvancedSettings);
  const searchTypeSelect = document.getElementById('search-type');
  if (searchTypeSelect) {
    searchTypeSelect.addEventListener('change', () => {
      updateAdvancedSettingsVisibility();
      loadAdvancedSettings();
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  setupAdvancedSettingsEvents();
  updateAdvancedSettingsVisibility();
  loadAdvancedSettings();
});

// --- TEMPORARY: Clean up old/unused storage keys ---
function cleanOldStorageKeys() {
  // Remove old keys from local storage
  chrome.storage.local.remove([
    'maxScrolls',
    'minUsers',
    'scrollDelay',
    // Add any other old keys you want to remove
  ]);

  // Remove unused keys from sync storage
  chrome.storage.sync.remove([
    'lmp_migration_completed',
    'lmp_general_options',
    'groupFilters',
    'generalSettings',
    'interactionSettings',
    // Add any other old keys you want to remove
  ]);
}

window.addEventListener('DOMContentLoaded', () => {
  cleanOldStorageKeys(); // Remove after first run if not needed anymore
});

// Utilidad para descargar archivos desde el navegador
function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type: `${type};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Migración: lectura de resultados de búsqueda desde chrome.storage.local en vez de localStorage
async function getSearchResults() {
  return new Promise(resolve => {
    chrome.storage.local.get(['snap_lead_manager_search_results'], (result) => {
      resolve(result.snap_lead_manager_search_results || []);
    });
  });
}

// Función para precargar los datos de la última búsqueda y reflejarlos en la UI y el estado global
async function precargarBusqueda() {
  const searchData = await getSearchData();
  console.log('[Precarga] Datos recuperados para precarga:', searchData);
  console.log('[Precarga] Referencias de inputs:', {
    searchTypeSelect,
    searchTermInput,
    searchCityInput
  });
  if (searchData) {
    if (searchTypeSelect) {
      searchTypeSelect.value = searchData.type || 'groups';
      searchTypeSelect.dispatchEvent(new Event('change'));
      console.log('[Precarga] Asignado searchTypeSelect:', searchTypeSelect.value);
    } else {
      console.warn('[Precarga] searchTypeSelect no está disponible');
    }
    if (searchTermInput) {
      searchTermInput.value = searchData.term || '';
      console.log('[Precarga] Asignado searchTermInput:', searchTermInput.value);
    } else {
      console.warn('[Precarga] searchTermInput no está disponible');
    }
    if (searchCityInput) {
      searchCityInput.value = searchData.city || '';
      console.log('[Precarga] Asignado searchCityInput:', searchCityInput.value);
    } else {
      console.warn('[Precarga] searchCityInput no está disponible');
    }
    // Actualiza el estado global
    state.currentSearchTerm = searchData.term || '';
    state.currentSearchCity = searchData.city || '';
    state.currentSearchType = searchData.type || 'groups';
    // Actualiza la UI de estado
    if (typeof updateSearchInfo === 'function') updateSearchInfo();
  } else {
    console.warn('[Precarga] No se recuperaron datos de búsqueda para precargar');
  }
}

// Función para precargar criterios guardados y reflejarlos en la UI
async function precargarCriteriosGuardados() {
  const criterios = await new Promise(resolve => {
    chrome.storage.local.get(['snap_lead_manager_saved_criteria'], (result) => {
      resolve(result.snap_lead_manager_saved_criteria || []);
    });
  });
  state.savedCriteria = criterios;
  if (typeof updateSavedCriteriaList === 'function') updateSavedCriteriaList();
}

// Función para precargar resultados y reflejarlos en la UI
async function precargarResultados() {
  const resultados = await getSearchResults();
  if (typeof updateResultsList === 'function') updateResultsList(resultados);
}

// Llamar a las funciones de precarga al cargar la UI, asegurando que el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    await precargarBusqueda();
    await precargarCriteriosGuardados();
    await precargarResultados();
    // Trigger automático del filtro de ciudad si hay valor precargado
    if (searchCityInput && searchCityInput.value) {
      console.log('[Precarga] Forzando flag de filtro de ciudad a false y aplicando filtro...');
      chrome.storage.local.set({ 'snap_lead_manager_city_filter_applied': 'false' }, async () => {
        if (window.LeadManagerPro && window.LeadManagerPro.modules && window.LeadManagerPro.modules.applyCityFilter) {
          await window.LeadManagerPro.modules.applyCityFilter();
        } else {
          console.warn('[Precarga] No se encontró applyCityFilter en LeadManagerPro.modules');
        }
      });
    }
  });
} else {
  (async () => {
    await precargarBusqueda();
    await precargarCriteriosGuardados();
    await precargarResultados();
    // Trigger automático del filtro de ciudad si hay valor precargado
    if (searchCityInput && searchCityInput.value) {
      console.log('[Precarga] Forzando flag de filtro de ciudad a false y aplicando filtro...');
      chrome.storage.local.set({ 'snap_lead_manager_city_filter_applied': 'false' }, async () => {
        if (window.LeadManagerPro && window.LeadManagerPro.modules && window.LeadManagerPro.modules.applyCityFilter) {
          await window.LeadManagerPro.modules.applyCityFilter();
        } else {
          console.warn('[Precarga] No se encontró applyCityFilter en LeadManagerPro.modules');
        }
      });
    }
  })();
}

// Utilidad para obtener los datos de búsqueda desde chrome.storage.local
async function getSearchData() {
  return new Promise(resolve => {
    chrome.storage.local.get(['snap_lead_manager_search_data'], (result) => {
      resolve(result.snap_lead_manager_search_data);
    });
  });
}

