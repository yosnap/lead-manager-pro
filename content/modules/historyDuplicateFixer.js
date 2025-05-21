// Script para evitar la duplicación del historial y solucionar problemas

(function() {
  console.log('Lead Manager Pro: Iniciando solucionador de duplicación de historial...');
  
  // Esperar a que el DOM esté listo
  if (document.readyState !== 'complete') {
    window.addEventListener('load', init);
  } else {
    init();
  }
  
  function init() {
    // Solo activar en páginas de grupos
    if (!window.location.href.includes('/groups/')) {
      return;
    }
    
    console.log('Verificando duplicaciones de historial...');
    
    // Primero eliminar cualquier duplicación existente
    removeHistoryDuplicates();
    
    // Observar para eliminar duplicaciones futuras
    setupObserver();
  }
  
  // Eliminar duplicados del historial en el panel flotante
  function removeHistoryDuplicates() {
    // Buscar el panel flotante
    const panel = document.querySelector('.lead-manager-interaction-ui');
    if (!panel) {
      return;
    }
    
    // Buscar secciones de historial
    const historySections = Array.from(panel.querySelectorAll('div'))
      .filter(div => {
        return div.textContent.includes('Historial de Interacciones');
      });
    
    console.log(`Encontrados ${historySections.length} secciones de historial`);
    
    // Si hay más de una, dejar solo la primera
    if (historySections.length > 1) {
      for (let i = 1; i < historySections.length; i++) {
        console.log('Eliminando sección de historial duplicada:', historySections[i]);
        historySections[i].remove();
      }
    }
  }
  
  // Configurar observador para detectar y eliminar duplicados
  function setupObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldCheck = false;
      
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
          for (const node of mutation.addedNodes) {
            // Si se agregó un nodo que contiene "Historial de Interacciones"
            if (node.nodeType === Node.ELEMENT_NODE && 
                node.textContent && 
                node.textContent.includes('Historial de Interacciones')) {
              shouldCheck = true;
              break;
            }
          }
        }
      }
      
      // Si debemos verificar, eliminar duplicados
      if (shouldCheck) {
        setTimeout(removeHistoryDuplicates, 50);
      }
    });
    
    // Observar el documento
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
})();
