/**
 * Estado global de la aplicación
 */

// Namespace para la organización del código
window.LeadManagerPro = window.LeadManagerPro || {};
window.LeadManagerPro.state = window.LeadManagerPro.state || {};

// Estado de opciones globales
window.LeadManagerPro.state.options = {
  // Opciones generales
  maxScrolls: 50,  // Valor por defecto: 50 scrolls
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
