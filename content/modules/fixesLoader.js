/* 
 * Lead Manager Pro - Loader de Módulos de Corrección
 * Este archivo carga las correcciones necesarias para solucionar problemas con el historial
 * de interacciones en el sidebar flotante y otros componentes.
 */

// Cargar módulos base
(function() {
  console.log('Lead Manager Pro: Cargando módulos de corrección...');
  
  // Función para cargar scripts dinámicamente
  function loadScript(src, id) {
    return new Promise((resolve, reject) => {
      // Verificar si el script ya existe
      if (document.getElementById(id)) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.id = id;
      script.src = chrome.runtime.getURL(src);
      script.onload = () => resolve();
      script.onerror = (error) => {
        console.error('Error al cargar script:', src, error);
        reject(error);
      };
      document.head.appendChild(script);
    });
  }
  
  // Esperar a que el DOM esté listo
  function waitForDOMReady() {
    return new Promise(resolve => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve();
      }
    });
  }
  
  // Inyectar CSS dinámicamente
  function injectCSS(href, id) {
    return new Promise((resolve, reject) => {
      // Verificar si ya existe
      if (document.getElementById(id)) {
        resolve();
        return;
      }
      
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = chrome.runtime.getURL(href);
      link.onload = () => resolve();
      link.onerror = (error) => {
        console.error('Error al cargar CSS:', href, error);
        reject(error);
      };
      document.head.appendChild(link);
    });
  }
  
  // Esperar a que se carguen los módulos principales
  async function initModules() {
    try {
      // Esperar a que el DOM esté listo
      await waitForDOMReady();
      
      console.log('DOM listo, cargando scripts prioritarios...');
      
      // Cargar script directo para inyectar historial (prioridad alta)
      await loadScript('content/modules/directHistoryInjector.js', 'direct-history-injector');
      console.log('Lead Manager Pro: Inyector directo de historial cargado correctamente');
      
      // Inyectar CSS para el historial
      await injectCSS('css/interaction-history.css', 'interaction-history-css');
      
      // Cargar otros scripts de corrección
      Promise.all([
        loadScript('content/modules/floatingPanelHistoryEnhancer.js', 'floating-panel-history-enhancer'),
        loadScript('content/modules/memberInteractionSidebar/memberInteractionSidebar-fix.js', 'member-interaction-sidebar-fix')
      ]).then(() => {
        console.log('Lead Manager Pro: Todos los módulos de corrección cargados correctamente');
      }).catch(error => {
        console.warn('Algunos módulos secundarios no pudieron cargarse:', error);
      });
      
    } catch (error) {
      console.error('Error durante la inicialización de correcciones:', error);
    }
  }
  
  // Iniciar la carga de módulos
  initModules();
})();
