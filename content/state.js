/**
 * Estado global de la aplicación
 */

// Namespace para la organización del código
window.LeadManagerPro = window.LeadManagerPro || {};
window.LeadManagerPro.state = window.LeadManagerPro.state || {};

// Estado de opciones globales
window.LeadManagerPro.state.options = {
  // Opciones generales
  maxScrolls: 50,
  scrollDelay: 2,
  
  // Opciones de búsqueda de grupos
  groupPublic: true,
  groupPrivate: true,
  minUsers: 100,
  minPostsYear: 10,
  minPostsMonth: 5,
  minPostsDay: 1,
  
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
  'minPostsDay'
], function(result) {
  Object.keys(result).forEach(key => {
    if (result[key] !== undefined) {
      window.LeadManagerPro.state.options[key] = result[key];
    }
  });
  
  console.log('Opciones cargadas:', window.LeadManagerPro.state.options);
});

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
