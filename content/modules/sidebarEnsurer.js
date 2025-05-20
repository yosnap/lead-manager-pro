// Script para asegurar la correcta carga del sidebar de búsqueda

(function() {
  console.log('Lead Manager Pro: Iniciando comprobador de sidebar de búsqueda...');
  
  // Esperar a que el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  function init() {
    // Solo activar en páginas que no sean de grupos
    if (window.location.href.includes('/groups/')) {
      console.log('Estamos en una página de grupo, no es necesario el sidebar de búsqueda');
      return;
    }
    
    console.log('Verificando sidebar de búsqueda...');
    
    // Esperar a que los módulos necesarios estén disponibles
    waitForModules().then(() => {
      console.log('Módulos necesarios disponibles, verificando sidebar de búsqueda');
      ensureSidebarExists();
    }).catch(error => {
      console.warn('No se pudieron cargar los módulos necesarios:', error);
    });
  }
  
  // Esperar a que los módulos necesarios estén disponibles
  function waitForModules() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 10;
      
      const checkModules = () => {
        if (window.leadManagerPro && window.leadManagerPro.sidebar) {
          resolve();
          return;
        }
        
        attempts++;
        if (attempts >= maxAttempts) {
          reject(new Error('Módulos no disponibles después de varios intentos'));
          return;
        }
        
        setTimeout(checkModules, 500);
      };
      
      checkModules();
    });
  }
  
  // Asegurar que el sidebar existe
  function ensureSidebarExists() {
    // Verificar si ya existe el sidebar
    if (document.getElementById('snap-lead-manager-container')) {
      console.log('El sidebar ya existe');
      return;
    }
    
    // Si no existe, intentar crearlo
    if (window.leadManagerPro && window.leadManagerPro.sidebar && typeof window.leadManagerPro.sidebar.insert === 'function') {
      console.log('Insertando sidebar de búsqueda...');
      window.leadManagerPro.sidebar.insert();
    } else {
      console.warn('No se puede insertar el sidebar porque la función no está disponible');
    }
    
    // Verificar periódicamente
    const intervalId = setInterval(() => {
      if (document.getElementById('snap-lead-manager-container')) {
        console.log('El sidebar se ha insertado correctamente');
        clearInterval(intervalId);
      } else if (window.leadManagerPro && window.leadManagerPro.sidebar && typeof window.leadManagerPro.sidebar.insert === 'function') {
        console.log('Reintentando insertar sidebar...');
        window.leadManagerPro.sidebar.insert();
      }
    }, 2000);
    
    // Establecer un límite de tiempo para detener la verificación
    setTimeout(() => {
      clearInterval(intervalId);
    }, 20000);
  }
})();
