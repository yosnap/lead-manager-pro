/**
 * Configuración central de autenticación para Lead Manager Pro
 * Define qué módulos requieren autenticación y cómo manejarlos
 */

window.LeadManagerPro = window.LeadManagerPro || {};
window.LeadManagerPro.AuthConfig = {
  
  // Módulos que requieren autenticación obligatoria
  REQUIRED_AUTH_MODULES: [
    'groupFinder',
    'groupMemberFinder', 
    'memberInteraction',
    'memberInteractionUI',
    'profileFinder',
    'profileExtractor',
    'groupSidebar',
    'memberInteractionSidebar',
    'groupMemberInteractionManager',
    'n8nIntegration',
    'dbSyncManager',
    'interactionHistory',
    'groupSearchUI',
    'generalOptionsUI',
    'groupSearchOptionsUI',
    'groupMemberUI',
    'messagesAccordion'
  ],
  
  // Módulos que pueden funcionar sin autenticación (solo lectura)
  OPTIONAL_AUTH_MODULES: [
    'cityFilter',
    'citySuggestions', 
    'searchNavigation',
    'sidebarController',
    'errorHandler',
    'emergency'
  ],
  
  // Métodos específicos que requieren autenticación por módulo
  PROTECTED_METHODS: {
    'groupFinder': ['init', 'startSearch', 'scrollAndCollect'],
    'groupMemberFinder': ['init', 'startExtraction', 'extractMembers'],
    'memberInteraction': ['init', 'startInteraction', 'sendMessage'],
    'memberInteractionUI': ['show', 'startInteraction', 'init'],
    'profileFinder': ['findProfiles', 'extractProfiles'],
    'profileExtractor': ['extractProfilesFromPage', 'openAndExtractProfileDetails'],
    'groupSidebar': ['init', 'show', 'createSidebar'],
    'groupMemberInteractionManager': ['init', 'createGroupSidebar', 'countMembers', 'startMemberInteraction'],
    'n8nIntegration': ['init', 'syncData', 'sendToN8n'],
    'dbSyncManager': ['init', 'syncToDatabase'],
    'interactionHistory': ['addInteraction', 'getHistory'],
    'groupSearchUI': ['show', 'init'],
    'generalOptionsUI': ['show', 'save'],
    'groupSearchOptionsUI': ['show', 'save']
  },
  
  // Mensajes personalizados para cada módulo
  AUTH_MESSAGES: {
    'groupFinder': 'Inicia sesión para buscar grupos de Facebook',
    'groupMemberFinder': 'Inicia sesión para extraer miembros de grupos',
    'memberInteraction': 'Inicia sesión para interactuar con miembros',
    'memberInteractionUI': 'Inicia sesión para usar las herramientas de interacción',
    'profileFinder': 'Inicia sesión para buscar perfiles',
    'profileExtractor': 'Inicia sesión para extraer detalles de perfiles',
    'groupSidebar': 'Inicia sesión para usar las herramientas de grupo',
    'groupMemberInteractionManager': 'Inicia sesión para usar las herramientas de interacción con miembros',
    'n8nIntegration': 'Inicia sesión para sincronizar datos con n8n',
    'dbSyncManager': 'Inicia sesión para sincronizar con la base de datos',
    'interactionHistory': 'Inicia sesión para ver el historial de interacciones',
    'default': 'Inicia sesión para usar esta funcionalidad'
  },
  
  // Configuración de UI para mensajes de autenticación
  AUTH_UI_CONFIG: {
    showNotifications: true,
    notificationDuration: 8000,
    showSidebarMessages: true,
    allowPopupFallback: true,
    autoHideMessages: true
  },
  
  // Excepciones - métodos que NO requieren autenticación aunque el módulo la requiera
  METHOD_EXCEPTIONS: {
    'groupFinder': ['shouldIncludeGroup', 'validateOptions'],
    'memberInteraction': ['validateMessage', 'getDefaultOptions'],
    'n8nIntegration': ['validateConfig', 'testConnection']
  },
  
  // Configuración de timing para verificación de autenticación
  TIMING_CONFIG: {
    initialCheckDelay: 1000,
    recheckInterval: 30000,
    authStateTimeout: 5000
  },
  
  /**
   * Verifica si un módulo requiere autenticación
   * @param {string} moduleName - Nombre del módulo
   * @returns {boolean}
   */
  requiresAuth(moduleName) {
    return this.REQUIRED_AUTH_MODULES.includes(moduleName);
  },
  
  /**
   * Verifica si un método específico requiere autenticación
   * @param {string} moduleName - Nombre del módulo
   * @param {string} methodName - Nombre del método
   * @returns {boolean}
   */
  methodRequiresAuth(moduleName, methodName) {
    if (!this.requiresAuth(moduleName)) {
      return false;
    }
    
    // Verificar excepciones
    const exceptions = this.METHOD_EXCEPTIONS[moduleName] || [];
    if (exceptions.includes(methodName)) {
      return false;
    }
    
    // Verificar si está en la lista de métodos protegidos
    const protectedMethods = this.PROTECTED_METHODS[moduleName] || [];
    return protectedMethods.includes(methodName);
  },
  
  /**
   * Obtiene el mensaje de autenticación para un módulo
   * @param {string} moduleName - Nombre del módulo
   * @returns {string}
   */
  getAuthMessage(moduleName) {
    return this.AUTH_MESSAGES[moduleName] || this.AUTH_MESSAGES.default;
  },
  
  /**
   * Verifica si se deben mostrar notificaciones para un módulo
   * @param {string} moduleName - Nombre del módulo
   * @returns {boolean}
   */
  shouldShowNotification(moduleName) {
    return this.AUTH_UI_CONFIG.showNotifications && this.requiresAuth(moduleName);
  }
};

console.log('LeadManagerPro: Configuración de autenticación cargada');
