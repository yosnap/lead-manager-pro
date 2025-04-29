/**
 * Estado global de la aplicación
 */

// Namespace para la organización del código
window.LeadManagerPro = window.LeadManagerPro || {};
window.LeadManagerPro.state = window.LeadManagerPro.state || {};

// Estado de opciones globales
window.LeadManagerPro.state.options = {
  // Opciones generales
  maxScrolls: 4,  // Valor por defecto: 4 scrolls
  scrollDelay: 2,  // Valor por defecto: 2 segundos
  
  // Opciones de búsqueda de grupos
  groupPublic: true,
  groupPrivate: true,
  minUsers: 0,    // Cantidad mínima de usuarios
  minPostsYear: 0, // Mínimo de publicaciones por año
  minPostsMonth: 0, // Mínimo de publicaciones por mes
  minPostsDay: 0,   // Mínimo de publicaciones por día
  
  // Sincronización
  lastSyncTime: null,
  pendingSyncData: false,
  
  // Otras opciones que se puedan agregar en el futuro
};

// Cargar opciones guardadas
chrome.storage.local.get([
  'maxScrolls',
  'scrollDelay',
  'groupPublic',
  'groupPrivate',
  'minUsers',
  'minPostsYear',
  'minPostsMonth',
  'minPostsDay',
  'lastSyncTime',
  'pendingSyncData'
], function(result) {
  Object.keys(result).forEach(key => {
    if (result[key] !== undefined) {
      window.LeadManagerPro.state.options[key] = result[key];
    }
  });
  
  // También intentamos cargar desde localStorage para compatibilidad con las opciones recientes
  try {
    const localStorageOptions = localStorage.getItem('snap_lead_manager_general_options');
    if (localStorageOptions) {
      const parsedOptions = JSON.parse(localStorageOptions);
      // Actualizar solo si existen
      if (parsedOptions.maxScrolls) window.LeadManagerPro.state.options.maxScrolls = parsedOptions.maxScrolls;
      if (parsedOptions.scrollDelay) window.LeadManagerPro.state.options.scrollDelay = parsedOptions.scrollDelay;
    }
    
    // Cargar opciones de grupo si existen
    const groupOptions = localStorage.getItem('snap_lead_manager_group_options');
    if (groupOptions) {
      const parsedGroupOptions = JSON.parse(groupOptions);
      
      // Actualizar opciones de grupo
      if (parsedGroupOptions.publicGroups !== undefined) 
        window.LeadManagerPro.state.options.groupPublic = parsedGroupOptions.publicGroups;
      if (parsedGroupOptions.privateGroups !== undefined) 
        window.LeadManagerPro.state.options.groupPrivate = parsedGroupOptions.privateGroups;
      if (parsedGroupOptions.minUsers !== undefined) 
        window.LeadManagerPro.state.options.minUsers = parsedGroupOptions.minUsers;
      if (parsedGroupOptions.minPostsYear !== undefined) 
        window.LeadManagerPro.state.options.minPostsYear = parsedGroupOptions.minPostsYear;
      if (parsedGroupOptions.minPostsMonth !== undefined) 
        window.LeadManagerPro.state.options.minPostsMonth = parsedGroupOptions.minPostsMonth;
      if (parsedGroupOptions.minPostsDay !== undefined) 
        window.LeadManagerPro.state.options.minPostsDay = parsedGroupOptions.minPostsDay;
    }
  } catch (e) {
    console.error('Error al cargar opciones desde localStorage:', e);
  }
  
  console.log('Opciones cargadas:', window.LeadManagerPro.state.options);
});

// Estado de búsqueda
window.LeadManagerPro.state.searchState = {
  isSearching: false,
  searchType: null, // 'groups' o 'profiles'
  searchTerm: '',
  currentPage: 1,
  totalPages: 1,
  currentOperation: '',
  progress: 0,
  foundProfiles: [],
  foundGroups: [],
  errors: [],
  pauseSearch: false,
  stopSearch: false,
  lastUpdate: null
};

// Estado de recuperación de errores
window.LeadManagerPro.state.recoveryState = {
  recoveryAttempts: 0,
  lastErrorTime: null,
  isInRecoveryMode: false
};

/**
 * Reinicia el estado de búsqueda con nuevos valores
 * @param {Object} newState - Nuevos valores para el estado
 */
window.LeadManagerPro.state.resetSearchState = function() {
  console.log('Reiniciando estado de búsqueda');
  
  this.searchState = {
    isSearching: false,
    searchType: null,
    searchTerm: '',
    currentPage: 1,
    totalPages: 1,
    currentOperation: '',
    progress: 0,
    foundProfiles: [],
    foundGroups: [],
    errors: [],
    pauseSearch: false,
    stopSearch: false,
    lastUpdate: null
  };

  // Notificar reinicio
  this.updateSearchState(this.searchState);

  // Limpiar localStorage
  localStorage.removeItem('searchState');
  localStorage.removeItem('lastSearchResults');
  localStorage.removeItem('lastSearchTime');
};

/**
 * Reinicia el estado de recuperación
 */
window.LeadManagerPro.state.resetRecoveryState = function() {
  window.LeadManagerPro.state.recoveryState = {
    recoveryAttempts: 0,
    lastErrorTime: null,
    isInRecoveryMode: false
  };
};

// Función para actualizar el estado de la búsqueda
window.LeadManagerPro.state.updateSearchState = function(newState) {
  console.log('Actualizando estado de búsqueda:', newState);
  
  // Actualizar estado local
  this.searchState = {
    ...this.searchState,
    ...newState,
    lastUpdate: new Date().toISOString()
  };

  // Notificar al sidebar
  chrome.runtime.sendMessage({
    type: 'SEARCH_STATUS_UPDATE',
    payload: this.searchState
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error al enviar actualización al sidebar:', chrome.runtime.lastError);
    } else {
      console.log('Estado actualizado en sidebar:', response);
    }
  });

  // Notificar al background script
  chrome.runtime.sendMessage({
    type: 'BACKGROUND_STATUS_UPDATE',
    payload: this.searchState
  });

  // Guardar estado en localStorage para persistencia
  try {
    localStorage.setItem('searchState', JSON.stringify(this.searchState));
  } catch (error) {
    console.error('Error al guardar estado en localStorage:', error);
  }
};

// Función para notificar resultados
window.LeadManagerPro.state.notifyResults = function(results, message = '') {
  console.log('Notificando resultados:', { results, message });

  const payload = {
    isSearching: false,
    currentOperation: message,
    progress: 100
  };

  if (Array.isArray(results)) {
    if (this.searchState.searchType === 'groups') {
      payload.foundGroups = results;
    } else {
      payload.foundProfiles = results;
    }
  }

  // Actualizar estado
  this.updateSearchState(payload);

  // Guardar resultados en localStorage
  try {
    localStorage.setItem('lastSearchResults', JSON.stringify(results));
    localStorage.setItem('lastSearchTime', new Date().toISOString());
  } catch (error) {
    console.error('Error al guardar resultados en localStorage:', error);
  }
};

// Cargar estado al inicializar
window.LeadManagerPro.state.loadSavedState = function() {
  try {
    const savedState = localStorage.getItem('searchState');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      this.searchState = {
        ...this.searchState,
        ...parsedState
      };
      console.log('Estado cargado desde localStorage:', this.searchState);
    }
  } catch (error) {
    console.error('Error al cargar estado desde localStorage:', error);
    this.resetSearchState();
  }
};
