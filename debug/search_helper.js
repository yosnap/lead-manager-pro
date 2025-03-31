/**
 * Archivo auxiliar para resolver problemas de búsqueda en Facebook
 * Este script proporciona métodos directos que pueden ser invocados desde la consola
 */

console.log('Lead Manager Pro - Search Helper: Inicializando...');

/**
 * Utilidades para depuración y resolución de problemas
 */
window.LeadManagerDebug = {
  // Limpiar el estado de la búsqueda
  resetSearchState: function() {
    console.log('Reseteando estado de búsqueda...');
    localStorage.removeItem('snap_lead_manager_city_filter_applied');
    localStorage.removeItem('snap_lead_manager_force_reload');
    localStorage.removeItem('snap_lead_manager_search_url');
    console.log('Estado de búsqueda reseteado');
    return true;
  },
  
  // Iniciar búsqueda directamente con parámetros específicos
  startSearch: function(searchType, searchTerm, city) {
    console.log(`Iniciando búsqueda directa: ${searchType} - ${searchTerm} - ${city || 'Sin ciudad'}`);
    
    // 1. Resetear estado
    this.resetSearchState();
    
    // 2. Crear y guardar datos de búsqueda
    const searchData = {
      type: searchType || 'people',
      term: searchTerm || '',
      city: city || '',
      timestamp: Date.now(),
      userInitiated: true
    };
    
    localStorage.setItem('snap_lead_manager_search_data', JSON.stringify(searchData));
    
    // 3. Construir URL de búsqueda apropiada
    const searchUrl = searchType === 'groups' 
      ? `https://www.facebook.com/search/groups/?q=${encodeURIComponent(searchTerm)}`
      : `https://www.facebook.com/search/people/?q=${encodeURIComponent(searchTerm)}`;
    
    console.log(`Navegando a: ${searchUrl}`);
    
    // 4. Navegar a la URL
    window.location.href = searchUrl;
    
    return true;
  },
  
  // Aplicar filtro de ciudad desde la consola
  applyCityFilter: function() {
    console.log('Aplicando filtro de ciudad manualmente...');
    
    if (typeof window._debug_leadManagerPro !== 'undefined' && 
        typeof window._debug_leadManagerPro.applyCityFilter === 'function') {
      
      // Marcar como no aplicado para que se aplique de nuevo
      localStorage.setItem('snap_lead_manager_city_filter_applied', 'false');
      
      // Llamar a la función directamente
      window._debug_leadManagerPro.applyCityFilter()
        .then(result => console.log('Resultado de aplicar filtro:', result))
        .catch(error => console.error('Error al aplicar filtro:', error));
      
      return true;
    } else {
      console.error('La función applyCityFilter no está disponible');
      return false;
    }
  },
  
  // Iniciar búsqueda de perfiles
  findProfiles: function() {
    console.log('Iniciando búsqueda de perfiles manualmente...');
    
    if (typeof window._debug_leadManagerPro !== 'undefined' && 
        typeof window._debug_leadManagerPro.findProfiles === 'function') {
      
      // Llamar a la función directamente
      window._debug_leadManagerPro.findProfiles()
        .then(result => console.log('Resultado de findProfiles:', result))
        .catch(error => console.error('Error en findProfiles:', error));
      
      return true;
    } else {
      console.error('La función findProfiles no está disponible');
      return false;
    }
  },
  
  // Obtener estado actual
  getState: function() {
    console.log('Estado del localStorage:');
    
    const searchData = localStorage.getItem('snap_lead_manager_search_data');
    console.log('snap_lead_manager_search_data:', searchData ? JSON.parse(searchData) : 'No hay datos');
    
    const cityFilterApplied = localStorage.getItem('snap_lead_manager_city_filter_applied');
    console.log('snap_lead_manager_city_filter_applied:', cityFilterApplied);
    
    const forceReload = localStorage.getItem('snap_lead_manager_force_reload');
    console.log('snap_lead_manager_force_reload:', forceReload);
    
    const searchUrl = localStorage.getItem('snap_lead_manager_search_url');
    console.log('snap_lead_manager_search_url:', searchUrl);
    
    // Obtener estado de las funciones
    if (typeof window._debug_leadManagerPro !== 'undefined') {
      console.log('Funciones disponibles:', Object.keys(window._debug_leadManagerPro));
    } else {
      console.log('Objeto de funciones de debug no disponible');
    }
    
    return searchData ? JSON.parse(searchData) : null;
  },
  
  // Ejecutar secuencia completa
  runFullSequence: function(searchType, searchTerm, city) {
    console.log(`Ejecutando secuencia completa con: ${searchType} - ${searchTerm} - ${city || 'Sin ciudad'}`);
    
    // 1. Iniciar búsqueda
    this.startSearch(searchType, searchTerm, city);
    
    // 2. Establecer temporizador para el resto
    console.log('La página se recargará. Espera a que cargue completamente y ejecuta LeadManagerDebug.continueSequence() en la consola');
    
    return true;
  },
  
  // Continuar con la secuencia después de la carga
  continueSequence: function() {
    console.log('Continuando secuencia después de carga...');
    
    // 1. Aplicar filtro de ciudad
    this.applyCityFilter();
    
    // 2. Esperar y luego buscar perfiles
    setTimeout(() => {
      console.log('Iniciando búsqueda de perfiles...');
      this.findProfiles();
    }, 3000);
    
    return true;
  }
};

// Log para confirmar que el script está cargado
console.log('Lead Manager Pro - Search Helper: Listo para usar');
console.log('Para usar: LeadManagerDebug.runFullSequence("people", "Camarero", "Madrid")');
console.log('En la siguiente página, ejecuta: LeadManagerDebug.continueSequence()');
