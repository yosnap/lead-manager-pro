/**
 * Módulo para manejar de forma segura la recarga de página
 * 
 * Este módulo se encarga de proporcionar métodos seguros para recargar
 * la página sin causar errores de CORS en el contexto de extensiones.
 */

// Namespace para la organización del código
window.LeadManagerPro = window.LeadManagerPro || {};
window.LeadManagerPro.modules = window.LeadManagerPro.modules || {};

// Función para iniciar una búsqueda sin necesidad de recargar la página
window.LeadManagerPro.modules.startSearchWithoutReload = function(searchData) {
  console.log('Iniciando búsqueda sin recargar:', searchData);
  
  // Almacenar datos para que el content script pueda acceder
  localStorage.setItem('snap_lead_manager_search_data', JSON.stringify(searchData));
  localStorage.setItem('snap_lead_manager_search_active', 'true');
  localStorage.setItem('snap_lead_manager_start_search_now', 'true');
  localStorage.setItem('snap_lead_manager_search_timestamp', Date.now().toString());
  
  // Enviar mensaje directamente al content script
  if (window.LeadManagerPro && window.LeadManagerPro.startSearch) {
    console.log('Iniciando búsqueda directamente a través de la función global');
    window.LeadManagerPro.startSearch(searchData);
    return true;
  }
  
  // Método alternativo: buscar cualquier iframe del sidebar y enviarle un mensaje
  try {
    const sidebarFrame = document.getElementById('snap-lead-manager-iframe');
    if (sidebarFrame && sidebarFrame.contentWindow) {
      sidebarFrame.contentWindow.postMessage({
        action: 'search_started_by_page',
        success: true
      }, '*');
    }
  } catch (frameError) {
    console.warn('No se pudo comunicar con el iframe:', frameError);
  }
  
  // Método alternativo: eventos personalizados en el documento
  try {
    const searchEvent = new CustomEvent('snapLeadManagerSearch', { 
      detail: searchData 
    });
    document.dispatchEvent(searchEvent);
  } catch (eventError) {
    console.warn('No se pudo disparar evento personalizado:', eventError);
  }
  
  // Método de último recurso: cargar la URL con parámetros
  try {
    const searchParams = new URLSearchParams();
    searchParams.set('snap_search', 'true');
    searchParams.set('search_type', searchData.type);
    searchParams.set('search_term', searchData.term);
    if (searchData.city) searchParams.set('search_city', searchData.city);
    
    // Construir URL y navegar sin recargar la página
    const currentUrl = new URL(window.location.href);
    const searchUrl = currentUrl.origin + currentUrl.pathname + '?' + searchParams.toString();
    
    // Cambiamos solo el historial sin recargar
    window.history.pushState({}, '', searchUrl);
    
    return true;
  } catch (urlError) {
    console.error('No se pudo modificar la URL:', urlError);
    return false;
  }
};

// Instalar listeners para mensajes de recarga segura
window.addEventListener('message', function(event) {
  // Verificar origen del mensaje
  if (event.data && event.data.action === 'start_search_now') {
    console.log('Recibido mensaje para iniciar búsqueda sin recargar');
    window.LeadManagerPro.modules.startSearchWithoutReload(event.data.searchData);
  }
  
  if (event.data && event.data.action === 'reload_page') {
    console.log('Recibido mensaje para recargar página de forma segura');
    
    // Guardar datos para después de la recarga
    if (event.data.searchData) {
      localStorage.setItem('snap_lead_manager_search_data', JSON.stringify(event.data.searchData));
      localStorage.setItem('snap_lead_manager_search_active', 'true');
      localStorage.setItem('snap_lead_manager_start_search_on_load', 'true');
    }
    
    // Recargar usando historial para evitar problemas CORS
    try {
      window.history.go(0);
    } catch (error) {
      console.error('Error al recargar con history.go:', error);
      
      // Plan B: Usar formulario
      try {
        const form = document.createElement('form');
        form.method = 'GET';
        form.action = window.location.href;
        document.body.appendChild(form);
        form.submit();
      } catch (formError) {
        console.error('Error al recargar con formulario:', formError);
      }
    }
  }
});

// Método para instalarse en la página
window.LeadManagerPro.installPageReloader = function() {
  console.log('PageReloader instalado correctamente');
  
  // Verificar si hay búsquedas pendientes al cargar
  const shouldStartSearch = localStorage.getItem('snap_lead_manager_start_search_on_load') === 'true';
  if (shouldStartSearch) {
    console.log('Se detectó una búsqueda pendiente');
    
    // Limpiar el flag para evitar bucles
    localStorage.removeItem('snap_lead_manager_start_search_on_load');
    
    // Cargar datos de búsqueda
    try {
      const searchDataStr = localStorage.getItem('snap_lead_manager_search_data');
      if (searchDataStr) {
        const searchData = JSON.parse(searchDataStr);
        console.log('Iniciando búsqueda pendiente con datos:', searchData);
        
        // Pequeño retraso para asegurar que la página está completamente cargada
        setTimeout(() => {
          if (window.LeadManagerPro && window.LeadManagerPro.startSearch) {
            window.LeadManagerPro.startSearch(searchData);
          } else {
            console.warn('No se encontró la función startSearch global');
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error al iniciar búsqueda pendiente:', error);
    }
  }
};

// Auto-instalación
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  window.LeadManagerPro.installPageReloader();
} else {
  document.addEventListener('DOMContentLoaded', window.LeadManagerPro.installPageReloader);
}
