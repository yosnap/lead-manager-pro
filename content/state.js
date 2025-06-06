/**
 * Estado global de la aplicación
 */

// Namespace para la organización del código
window.LeadManagerPro = window.LeadManagerPro || {};
window.LeadManagerPro.state = window.LeadManagerPro.state || {};

// Estado de opciones globales
window.LeadManagerPro.state.options = {
  // Opciones generales (personas)
  maxScrolls: 50,
  scrollDelay: 2,
  // Opciones de búsqueda de grupos
  types: { public: true, private: true },
  minUsers: 0,
  minPosts: { year: 0, month: 0, day: 0 },
};

// Cargar opciones guardadas desde chrome.storage.sync
chrome.storage.sync.get(['groupSearchSettings', 'peopleSearchSettings'], function(result) {
  if (result.peopleSearchSettings) {
    window.LeadManagerPro.state.options.maxScrolls = result.peopleSearchSettings.maxScrolls || 50;
    window.LeadManagerPro.state.options.scrollDelay = result.peopleSearchSettings.scrollDelay || 2;
  }
  if (result.groupSearchSettings) {
    window.LeadManagerPro.state.options.types = result.groupSearchSettings.types || { public: true, private: true };
    window.LeadManagerPro.state.options.minUsers = result.groupSearchSettings.minUsers || 0;
    window.LeadManagerPro.state.options.minPosts = result.groupSearchSettings.minPosts || { year: 0, month: 0, day: 0 };
    // Si hay scrolls/delay específicos para grupos
    if (result.groupSearchSettings.maxScrolls) window.LeadManagerPro.state.options.maxScrolls = result.groupSearchSettings.maxScrolls;
    if (result.groupSearchSettings.scrollDelay) window.LeadManagerPro.state.options.scrollDelay = result.groupSearchSettings.scrollDelay;
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

  // Limpiar localStorage solo para estado de búsqueda
  // localStorage.removeItem('searchState'); // PARA BORRAR: clave antigua
  // localStorage.removeItem('lastSearchResults'); // PARA BORRAR: clave antigua
  // localStorage.removeItem('lastSearchTime'); // PARA BORRAR: clave antigua
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

  // Guardar estado en localStorage para persistencia temporal
  // try {
  //   localStorage.setItem('searchState', JSON.stringify(this.searchState));
  // } catch (error) {
  //   console.error('Error al guardar estado en localStorage:', error);
  // }
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
  // try {
  //   localStorage.setItem('lastSearchResults', JSON.stringify(results));
  //   localStorage.setItem('lastSearchTime', new Date().toISOString());
  // } catch (error) {
  //   console.error('Error al guardar resultados en localStorage:', error);
  // }
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
