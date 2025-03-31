/**
 * Estado global de la aplicación
 */

// Namespace para la organización del código
window.LeadManagerPro = window.LeadManagerPro || {};
window.LeadManagerPro.state = window.LeadManagerPro.state || {};

// Estado de búsqueda
window.LeadManagerPro.state.searchState = {
  isSearching: false,
  searchType: 'people', // 'people' o 'groups'
  searchTerm: '',
  city: '',
  currentPage: 1,
  totalPages: 1,
  foundProfiles: [], // Se usa tanto para perfiles como para grupos
  foundCount: 0,      // Contador universal
  pauseSearch: false,
  stopSearch: false,
  startTime: null
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
window.LeadManagerPro.state.resetSearchState = function(newState = {}) {
  const defaultState = {
    isSearching: false,
    searchType: 'people',
    searchTerm: '',
    city: '',
    currentPage: 1,
    totalPages: 1,
    foundProfiles: [],
    foundCount: 0,
    pauseSearch: false,
    stopSearch: false,
    startTime: null
  };
  
  window.LeadManagerPro.state.searchState = { ...defaultState, ...newState };
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
