/**
 * Módulo para manejar la navegación de búsqueda
 */

// Namespace para la organización del código
window.LeadManagerPro = window.LeadManagerPro || {};
window.LeadManagerPro.modules = window.LeadManagerPro.modules || {};

/**
 * Navega a la URL de búsqueda de Facebook
 * @param {Object} searchState - Estado actual de la búsqueda
 * @returns {Promise<boolean>} - true si la navegación fue exitosa
 */
window.LeadManagerPro.modules.navigateToSearchPage = async function(searchState) {
  // Referencia a las utilidades
  const updateStatus = window.LeadManagerPro.utils.updateStatus;
  
  const { searchType, searchTerm } = searchState;
  let searchUrl;
  
  // URLs correctas para diferentes tipos de búsqueda en Facebook
  if (searchType === 'people') {
    searchUrl = `https://www.facebook.com/search/people/?q=${encodeURIComponent(searchTerm)}`;
  } else if (searchType === 'groups') {
    searchUrl = `https://www.facebook.com/search/groups/?q=${encodeURIComponent(searchTerm)}`;
  } else {
    searchUrl = `https://www.facebook.com/search/top/?q=${encodeURIComponent(searchTerm)}`;
  }
  
  updateStatus(`Navegando a la página de búsqueda de ${searchType === 'people' ? 'personas' : 'grupos'}...`, 10);
  
  // Comprobar si estamos en la página correcta
  const currentUrl = window.location.href;
  
  // Verificación más flexible para determinar si estamos en el tipo correcto de página de búsqueda
  const isInSearchPage = currentUrl.includes('/search/');
  const hasCorrectType = 
    (searchType === 'people' && currentUrl.includes('/search/people')) || 
    (searchType === 'groups' && currentUrl.includes('/search/groups')) ||
    (searchType === 'top' && currentUrl.includes('/search/top'));
  const hasCorrectQuery = currentUrl.includes(searchTerm);
  
  // Si ya estamos en la página correcta, no navegamos
  if (isInSearchPage && hasCorrectType && hasCorrectQuery) {
    console.log('Lead Manager Pro: Ya estamos en la página de búsqueda correcta');
    updateStatus('Ya estamos en la página de búsqueda correcta.', 15);
    return true;
  }
  
  // Navegación garantizada
  try {
    // Preservamos el estado para después de la recarga
    localStorage.setItem('snap_lead_manager_force_reload', 'true');
    localStorage.setItem('snap_lead_manager_search_url', searchUrl);
    localStorage.setItem('snap_lead_manager_search_type', searchType);
    localStorage.setItem('snap_lead_manager_search_term', searchTerm);
    
    // Debug
    console.log(`Lead Manager Pro: Navegando a ${searchUrl}`);
    
    // Ocultar el sidebar antes de navegar para no interferir
    const sidebarContainer = document.getElementById('snap-lead-manager-container');
    if (sidebarContainer) {
      sidebarContainer.style.transform = 'translateX(100%)';
      const toggleButton = document.getElementById('snap-lead-manager-toggle');
      if (toggleButton) toggleButton.innerHTML = '▶';
    }
    
    // Cambiar la ubicación de la ventana sin interferir con la página actual
    setTimeout(() => {
      window.location.href = searchUrl;
    }, 200);
    
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 300);
    });
  } catch (error) {
    console.error('Error al navegar:', error);
    updateStatus(`Error al navegar: ${error.message}`, 0);
    return false;
  }
};

/**
 * Navega a la siguiente página de resultados
 * @param {Object} searchState - Estado actual de la búsqueda
 * @returns {Promise<boolean>} - true si hay una página siguiente disponible
 */
window.LeadManagerPro.modules.navigateToNextPage = async function(searchState) {
  // Referencias rápidas
  const sleep = window.LeadManagerPro.utils.sleep;
  const updateStatus = window.LeadManagerPro.utils.updateStatus;
  
  // Verificar primero si se debe detener o pausar
  if (searchState.stopSearch) {
    updateStatus('Búsqueda detenida por el usuario.', 0);
    return false;
  }
  
  if (searchState.pauseSearch) {
    updateStatus('Búsqueda pausada. Haga clic en "Reanudar" para continuar.', 50);
    // Esperar mientras esté pausado
    while (searchState.pauseSearch && !searchState.stopSearch) {
      await sleep(1000);
    }
    // Si después del bucle se indicó detener, salimos
    if (searchState.stopSearch) {
      updateStatus('Búsqueda detenida después de pausa.', 0);
      return false;
    }
  }
  
  // Si la búsqueda está marcada como completada, no continuar
  if (!searchState.isSearching) {
    console.log('Búsqueda completada, no se navegará a más páginas');
    return false;
  }
  
  updateStatus(`Navegando a la página ${searchState.currentPage + 1}...`, 50 + (searchState.currentPage / searchState.totalPages) * 30);
  
  try {
    // Buscar botones de siguiente página
    const nextButtons = Array.from(document.querySelectorAll('a, button, [role="button"]')).filter(el => {
      const text = el.textContent.toLowerCase();
      return text.includes('siguiente') || 
             text.includes('next') || 
             text.includes('more') || 
             text.includes('más');
    });
    
    if (nextButtons.length > 0) {
      // No continuar si la búsqueda se detuvo mientras buscábamos botones
      if (searchState.stopSearch || !searchState.isSearching) {
        return false;
      }
      
      // Ordenar por relevancia (preferimos los que tienen texto explícito)
      nextButtons.sort((a, b) => {
        const textA = a.textContent.toLowerCase();
        const textB = b.textContent.toLowerCase();
        
        const hasNextA = textA.includes('siguiente') || textA.includes('next');
        const hasNextB = textB.includes('siguiente') || textB.includes('next');
        
        if (hasNextA && !hasNextB) return -1;
        if (!hasNextA && hasNextB) return 1;
        return 0;
      });
      
      // Deshabilitar navegación automática
      nextButtons.forEach(button => {
        button.style.pointerEvents = 'none';
        button.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }, true);
      });
      
      updateStatus('No se continuará navegando a más páginas.', 80);
      return false;
    } else {
      updateStatus('No se encontraron más páginas de resultados.', 80);
      return false;
    }
  } catch (error) {
    console.error('Error al navegar a la siguiente página:', error);
    updateStatus(`Error al navegar a la siguiente página: ${error.message}`, 50);
    return false;
  }
};

/**
 * Hace scroll automático en la página para cargar más resultados
 * @param {Object} searchState - Estado actual de la búsqueda
 * @returns {Promise<void>}
 */
window.LeadManagerPro.modules.autoScroll = async function(searchState) {
  // Referencias rápidas
  const updateStatus = window.LeadManagerPro.utils.updateStatus;
  const sleep = window.LeadManagerPro.utils.sleep;
  
  // Obtener opciones de configuración desde chrome.storage.local
  const config = await new Promise((resolve) => {
    chrome.storage.local.get(['maxScrolls', 'scrollDelay'], (result) => {
      resolve({
        maxScrolls: result.maxScrolls !== undefined ? Number(result.maxScrolls) : 4,
        scrollDelay: result.scrollDelay !== undefined ? Number(result.scrollDelay) * 1000 : 2000
      });
    });
  });
  
  const MAX_SCROLLS = config.maxScrolls;
  const SCROLL_DELAY = config.scrollDelay;
  
  console.log('autoScroll: Usando configuración de chrome.storage:', {
    maxScrolls: MAX_SCROLLS,
    scrollDelay: SCROLL_DELAY/1000
  });
  
  updateStatus(`Realizando scroll para cargar todos los resultados (máx. ${MAX_SCROLLS} scrolls)...`, 35);
  
  return new Promise(resolve => {
    let totalHeight = 0;
    let distance = 300;
    let scrollCount = 0;
    let lastHeight = document.documentElement.scrollHeight;
    let noChangeCount = 0;
    
    let timer = setInterval(async () => {
      // Verificar si se debe detener la búsqueda
      if (searchState.stopSearch) {
        clearInterval(timer);
        resolve();
        return;
      }
      
      // Verificar si se debe pausar la búsqueda
      if (searchState.pauseSearch) {
        while (searchState.pauseSearch && !searchState.stopSearch) {
          updateStatus('Búsqueda pausada. Esperando para continuar...', 35);
          await sleep(1000);
        }
        if (searchState.stopSearch) {
          clearInterval(timer);
          resolve();
          return;
        }
      }
      
      // Realizar scroll
      window.scrollBy(0, distance);
      totalHeight += distance;
      scrollCount++;
      
      // Actualizar estado cada 5 scrolls
      if (scrollCount % 5 === 0) {
        updateStatus(`Realizando scroll para cargar resultados (${scrollCount}/${MAX_SCROLLS} scrolls)...`, 35);
      }
      
      // Verificar si hemos llegado al final o si ya hemos hecho suficiente scroll
      const currentHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;
      const innerHeight = window.innerHeight;
      
      // Detectar si la altura no ha cambiado después del scroll
      if (currentHeight === lastHeight) {
        noChangeCount++;
      } else {
        noChangeCount = 0;
        lastHeight = currentHeight;
      }
      
      // Condiciones para detener el scroll:
      // 1. Si hemos alcanzado el máximo de scrolls configurado
      // 2. Si estamos cerca del final de la página
      // 3. Si la altura no ha cambiado en 3 intentos consecutivos
      // 4. Si hemos hecho más de 10 scrolls y superado cierta altura total
      if (scrollCount >= MAX_SCROLLS || 
          (scrollTop + innerHeight >= currentHeight - 100) || 
          noChangeCount >= 3 ||
          (scrollCount > 10 && totalHeight > 15000)) {
        
        clearInterval(timer);
        window.scrollTo(0, 0);
        
        // Enviar mensaje de finalización
        window.parent.postMessage({
          action: 'scroll_complete',
          message: noChangeCount >= 3 ? 
            'No se detectaron más resultados para cargar' : 
            'Scroll completado'
        }, '*');
        
        resolve();
      }
    }, SCROLL_DELAY);
  });
};
