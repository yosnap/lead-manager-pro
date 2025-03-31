/**
 * Módulo para buscar y procesar perfiles en la página
 */

// Namespace para la organización del código
window.LeadManagerPro = window.LeadManagerPro || {};
window.LeadManagerPro.modules = window.LeadManagerPro.modules || {};

/**
 * Función principal para buscar perfiles
 * @returns {Promise<Object>} - Resultado de la operación con información de perfiles encontrados
 */
window.LeadManagerPro.modules.findProfiles = async function() {
  try {
    console.log('Lead Manager Pro: Iniciando función findProfiles');
    
    // Referencias rápidas
    const updateStatus = window.LeadManagerPro.utils.updateStatus;
    const extractProfilesFromPage = window.LeadManagerPro.modules.extractProfilesFromPage;
    const navigateToNextPage = window.LeadManagerPro.modules.navigateToNextPage;
    const navigateToSearchPage = window.LeadManagerPro.modules.navigateToSearchPage;
    const applyCityFilter = window.LeadManagerPro.modules.applyCityFilter;
    const searchState = window.LeadManagerPro.state.searchState;
    
    // Si ya hay una búsqueda en curso, reanudarla
    if (searchState.isSearching && searchState.pauseSearch) {
      console.log('Lead Manager Pro: Reanudando búsqueda pausada');
      searchState.pauseSearch = false;
      updateStatus('Reanudando búsqueda...', searchState.currentPage > 1 ? 50 : 20);
      return { success: true, message: 'Búsqueda reanudada' };
    }
    
    // Si hay una búsqueda en curso y no está pausada, no hacer nada
    if (searchState.isSearching && !searchState.pauseSearch) {
      console.log('Lead Manager Pro: Ya hay una búsqueda en curso');
      return { success: true, message: 'Ya hay una búsqueda en curso' };
    }
    
    // Verificar que estamos en una página de búsqueda
    const isSearchPage = window.location.href.includes('/search/');
    if (!isSearchPage) {
      console.log('Lead Manager Pro: No estamos en una página de búsqueda, redirigiendo...');
      
      // Obtener datos de búsqueda
      const searchDataStr = localStorage.getItem('snap_lead_manager_search_data');
      if (searchDataStr) {
        try {
          const searchData = JSON.parse(searchDataStr);
          
          // Actualizar searchState con los datos encontrados
          searchState.searchType = searchData.type || 'people';
          searchState.searchTerm = searchData.term || '';
          searchState.city = searchData.city || '';
          
          // Iniciar navegación
          await navigateToSearchPage(searchState);
          
          // Como la página va a recargarse, retornamos
          return { success: false, message: 'Redireccionando a página de búsqueda' };
        } catch (e) {
          console.error('Lead Manager Pro: Error al procesar datos de búsqueda:', e);
          return { success: false, message: 'Error al procesar datos de búsqueda' };
        }
      } else {
        return { success: false, message: 'No estamos en una página de búsqueda y no hay datos para iniciar búsqueda' };
      }
    }
    
    // Obtener datos de búsqueda del localStorage
    const searchDataStr = localStorage.getItem('snap_lead_manager_search_data');
    if (!searchDataStr) {
      console.error('Lead Manager Pro: No hay datos de búsqueda disponibles');
      return { success: false, message: 'No hay datos de búsqueda disponibles' };
    }
    
    const searchData = JSON.parse(searchDataStr);
    
    // Validar datos de búsqueda
    if (!searchData || !searchData.term || searchData.term.trim() === '') {
      console.error('Lead Manager Pro: Término de búsqueda no válido');
      return { success: false, message: 'Término de búsqueda no válido' };
    }
    
    // Inicializar estado de búsqueda
    window.LeadManagerPro.state.resetSearchState({
      isSearching: true,
      searchType: searchData.type || 'people',
      searchTerm: searchData.term.trim(),
      city: searchData.city || '',
      currentPage: 1,
      totalPages: 10, // Valor estimado
      foundProfiles: [],
      pauseSearch: false,
      stopSearch: false,
      startTime: new Date()
    });
    
    console.log(`Lead Manager Pro: Estado de búsqueda inicializado: ${JSON.stringify({
      searchType: searchState.searchType,
      searchTerm: searchState.searchTerm,
      city: searchState.city
    })}`);
    
    updateStatus(`Iniciando búsqueda de ${searchState.searchType === 'people' ? 'personas' : 'grupos'} para: ${searchState.searchTerm}`, 5);
    
    // Verificar si el filtro de ciudad ya se aplicó
    const cityFilterApplied = localStorage.getItem('snap_lead_manager_city_filter_applied') === 'true';
    
    // Si hay ciudad para filtrar y no se ha aplicado aún, aplicarlo primero
    if (searchState.city && searchState.city.trim() !== '' && !cityFilterApplied) {
      console.log('Lead Manager Pro: Aplicando filtro de ciudad antes de buscar perfiles');
      await applyCityFilter();
      
      // Como applyCityFilter puede iniciar una redirección o un proceso asíncrono,
      // devolvemos un resultado de "operación en curso"
      return { 
        success: true, 
        message: 'Aplicando filtro de ciudad, la búsqueda continuará automáticamente',
        inProgress: true
      };
    }
    
    // Extraer perfiles o grupos de la primera página
    const firstPageResults = await extractProfilesFromPage(searchState);
    
    // Si la búsqueda ya se detuvo, respetamos esa decisión
    if (searchState.stopSearch) {
      searchState.isSearching = false;
      return { 
        success: true, 
        message: 'Búsqueda completada sin resultados',
        results: []
      };
    }
    
    if (firstPageResults.length === 0) {
      updateStatus('No se encontraron resultados para esta búsqueda.', 100);
      searchState.isSearching = false;
      return { 
        success: true, 
        message: 'Búsqueda completada sin resultados',
        results: []
      };
    }
    
    // Agregar a la lista de resultados encontrados
    searchState.foundProfiles = [...searchState.foundProfiles, ...firstPageResults];
    
    // Mensaje específico según el tipo de búsqueda
    const resultType = searchState.searchType === 'people' ? 'perfiles' : 'grupos';
    updateStatus(`Encontrados ${searchState.foundProfiles.length} ${resultType} en la página ${searchState.currentPage}.`, 50);
    
    // Obtener opciones para controlar la búsqueda
    const options = window.LeadManagerPro.state.options || {};
    const MAX_SCROLLS = options.maxScrolls || 50;
    const SCROLL_DELAY = (options.scrollDelay || 2) * 1000; // Convertir a milisegundos
    
    // Continuar con las siguientes páginas hasta que se alcance el máximo de scrolls
    let hasNextPage = true;
    const MAX_PAGES = Math.ceil(MAX_SCROLLS / 10); // Estimando 10 scrolls por página
    
    while (hasNextPage && searchState.currentPage < MAX_PAGES && !searchState.stopSearch) {
      // Verificar si se debe pausar la búsqueda
      if (searchState.pauseSearch) {
        updateStatus('Búsqueda pausada. Haga clic en "Reanudar" para continuar.', 50);
        return { 
          success: true, 
          message: 'Búsqueda pausada',
          profiles: searchState.foundProfiles,
          paused: true
        };
      }
      
      hasNextPage = await navigateToNextPage(searchState);
      
      if (hasNextPage) {
        const pageProfiles = await extractProfilesFromPage(searchState);
        searchState.foundProfiles = [...searchState.foundProfiles, ...pageProfiles];
      }
    }
    
    // Finalizar búsqueda
    searchState.isSearching = false;
    
    // Calcular tiempo de búsqueda
    const endTime = new Date();
    const duration = Math.round((endTime - searchState.startTime) / 1000); // en segundos
    
    // Reutilizamos la misma variable resultType definida anteriormente
    updateStatus(`Búsqueda completada. Se encontraron ${searchState.foundProfiles.length} ${resultType} en ${duration} segundos.`, 100);
    
    // Enviar resultados encontrados al background y al sidebar
    chrome.runtime.sendMessage({
      action: 'found_results',
      searchType: searchState.searchType,
      results: searchState.foundProfiles
    });
    
    // Enviar mensaje directamente al sidebar con información completa
    const iframe = document.getElementById('snap-lead-manager-iframe');
    if (iframe && iframe.contentWindow) {
      // Mensaje claro y completo sobre los resultados
      const resultMessage = {
        action: 'search_result',
        result: {
          success: true,
          profiles: searchState.foundProfiles, // Para compatibilidad con versiones anteriores
          results: searchState.foundProfiles,  // Nombre más claro para resultados
          count: searchState.foundProfiles.length,
          totalTime: duration,
          searchType: searchState.searchType,
          searchTerm: searchState.searchTerm,
          city: searchState.city,
          message: `Búsqueda completada. Se encontraron ${searchState.foundProfiles.length} ${resultType} en ${duration} segundos.`
        }
      };
      
      // Enviar inmediatamente al sidebar
      iframe.contentWindow.postMessage(resultMessage, '*');
      
      // También notificar que la búsqueda ha terminado por completo
      setTimeout(() => {
        iframe.contentWindow.postMessage({
          action: 'search_complete',
          status: {
            isSearching: false,
            foundCount: searchState.foundProfiles.length,
            searchType: searchState.searchType
          }
        }, '*');
      }, 500);
      
      console.log('Enviados resultados finales al sidebar:', searchState.foundProfiles.length);
    }
    
    return { 
      success: true, 
      message: `Búsqueda de ${resultType} completada con éxito`,
      profiles: searchState.foundProfiles, // Incluimos ambos nombres de propiedad para compatibilidad
      results: searchState.foundProfiles,
      stats: {
        duration,
        pages: searchState.currentPage,
        searchType: searchState.searchType,
        searchTerm: searchState.searchTerm,
        city: searchState.city
      }
    };
    
  } catch (error) {
    console.error('Error al buscar perfiles:', error);
    const updateStatus = window.LeadManagerPro.utils.updateStatus;
    updateStatus(`Error al buscar perfiles: ${error.message}`, 0);
    
    // Restaurar estado
    const searchState = window.LeadManagerPro.state.searchState;
    searchState.isSearching = false;
    
    return {
      success: false,
      error: error.message,
      profiles: searchState.foundProfiles // Devolver los perfiles encontrados hasta el error
    };
  }
};

/**
 * Pausa la búsqueda en curso
 * @returns {Object} - Resultado de la operación
 */
window.LeadManagerPro.modules.pauseSearch = function() {
  const searchState = window.LeadManagerPro.state.searchState;
  const updateStatus = window.LeadManagerPro.utils.updateStatus;
  
  if (searchState.isSearching && !searchState.pauseSearch) {
    searchState.pauseSearch = true;
    updateStatus('Pausando búsqueda...', searchState.currentPage > 1 ? 50 : 20);
    return { success: true, message: 'Búsqueda pausada' };
  }
  
  return { success: false, message: 'No hay búsqueda en curso para pausar' };
};

/**
 * Detiene la búsqueda en curso
 * @returns {Object} - Resultado de la operación
 */
window.LeadManagerPro.modules.stopSearch = function() {
  const searchState = window.LeadManagerPro.state.searchState;
  const updateStatus = window.LeadManagerPro.utils.updateStatus;
  
  if (searchState.isSearching) {
    searchState.stopSearch = true;
    searchState.isSearching = false;
    searchState.pauseSearch = false;
    updateStatus('Búsqueda detenida.', 0);
    return { success: true, message: 'Búsqueda detenida' };
  }
  
  return { success: false, message: 'No hay búsqueda en curso para detener' };
};
