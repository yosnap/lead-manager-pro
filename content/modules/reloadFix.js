/**
 * Parche para arreglar problemas con window.parent.location.reload()
 * Este script intercepta los intentos de recargar la página y los redirecciona
 * a través de una forma más segura que evita problemas de CORS
 */

(function() {
  console.log('Lead Manager Pro: Instalando parche para reload()');
  
  // Esperar a que el sidebar se cargue
  const waitForSidebar = setInterval(() => {
    const iframe = document.getElementById('snap-lead-manager-iframe');
    if (iframe && iframe.contentWindow) {
      clearInterval(waitForSidebar);
      
      // Reemplazar la función de recarga en el iframe
      try {
        // Método 1: Intentar interceptar el acceso a window.parent
        const descriptor = Object.getOwnPropertyDescriptor(window, 'parent');
        if (descriptor && descriptor.configurable) {
          Object.defineProperty(iframe.contentWindow, 'parent', {
            get: function() {
              const original = window;
              // Reemplazar la función reload
              if (!original._patchedReload) {
                const originalReload = original.location.reload;
                original.location.reload = function() {
                  console.log('Lead Manager Pro: Interceptada llamada a reload(), usando método seguro...');
                  
                  // Usar alternativa segura
                  try {
                    // Método 1: postMessage
                    window.postMessage({
                      action: 'reload_safely',
                      source: 'lead_manager_pro'
                    }, '*');
                    
                    // Método 2: history.go
                    setTimeout(() => {
                      try {
                        window.history.go(0);
                      } catch (e) {
                        console.warn('No se pudo usar history.go:', e);
                      }
                    }, 100);
                    
                    return true;
                  } catch (e) {
                    console.error('Error al intentar método alternativo de recarga:', e);
                    // Última opción: intentar el original
                    try {
                      return originalReload.apply(original.location, arguments);
                    } catch (reloadError) {
                      console.error('Error con reload original:', reloadError);
                    }
                  }
                };
                original._patchedReload = true;
              }
              return original;
            }
          });
        }
      } catch (e) {
        console.warn('No se pudo interceptar parent.location.reload:', e);
      }
      
      // Escuchar mensajes del iframe
      window.addEventListener('message', function(event) {
        // Verificar que el mensaje viene del iframe
        if (event.source === iframe.contentWindow) {
          // Si el mensaje es para recargar la página, usar método alternativo
          if (event.data && (event.data.action === 'reload_page' || event.data.action === 'prepare_for_search')) {
            console.log('Lead Manager Pro: Recibido mensaje para recargar página:', event.data);
            
            // Guardar datos para después de la recarga
            if (event.data.searchData) {
              try {
                // Dividir los datos en partes más pequeñas si son demasiado grandes
                const searchDataStr = JSON.stringify(event.data.searchData);
                const maxSize = 4096000; // ~4MB es más seguro para localStorage
                
                if (searchDataStr.length > maxSize) {
                  console.log('Lead Manager Pro: Datos de búsqueda demasiado grandes, dividiendo en chunks');
                  // Guardar solo los campos esenciales
                  const essentialData = {
                    query: event.data.searchData.query,
                    city: event.data.searchData.city,
                    type: event.data.searchData.type,
                    timestamp: event.data.searchData.timestamp || Date.now(),
                    totalResults: event.data.searchData.items ? event.data.searchData.items.length : 0,
                    hasMoreData: true
                  };
                  
                  localStorage.setItem('snap_lead_manager_search_data', JSON.stringify(essentialData));
                  console.log('Lead Manager Pro: Guardados datos esenciales, tamaño total:', JSON.stringify(essentialData).length);
                  
                  // Guardar datos completos en chrome.storage que tiene más capacidad
                  chrome.storage.local.set({'snap_lead_manager_full_search_data': event.data.searchData});
                } else {
                  localStorage.setItem('snap_lead_manager_search_data', searchDataStr);
                }
                
                localStorage.setItem('snap_lead_manager_search_active', 'true');
                localStorage.setItem('snap_lead_manager_start_search_on_load', 'true');
              } catch (error) {
                console.error('Lead Manager Pro: Error al guardar datos de búsqueda:', error);
                
                // Si falla, intentar guardar solo datos esenciales
                try {
                  const minimalData = {
                    query: event.data.searchData.query,
                    city: event.data.searchData.city,
                    type: event.data.searchData.type,
                    timestamp: Date.now(),
                    error: 'Datos completos demasiado grandes para almacenar'
                  };
                  
                  localStorage.setItem('snap_lead_manager_search_data', JSON.stringify(minimalData));
                  localStorage.setItem('snap_lead_manager_search_active', 'true');
                  localStorage.setItem('snap_lead_manager_start_search_on_load', 'true');
                } catch (fallbackError) {
                  console.error('Lead Manager Pro: Error al guardar datos mínimos:', fallbackError);
                }
              }
            }
            
            // Recargar usando history para evitar problemas CORS
            setTimeout(() => {
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
            }, 200);
          }
          
          // Si el mensaje es para iniciar una búsqueda sin recargar
          if (event.data && event.data.action === 'start_search_now') {
            console.log('Lead Manager Pro: Recibido mensaje para iniciar búsqueda sin recargar');
            
            try {
              // Guardar los datos de búsqueda
              if (event.data.searchData) {
                try {
                  // Dividir los datos en partes más pequeñas si son demasiado grandes
                  const searchDataStr = JSON.stringify(event.data.searchData);
                  const maxSize = 4096000; // ~4MB es más seguro para localStorage
                  
                  if (searchDataStr.length > maxSize) {
                    console.log('Lead Manager Pro: Datos de búsqueda demasiado grandes, usando método alternativo');
                    
                    // Guardar solo los campos esenciales
                    const essentialData = {
                      query: event.data.searchData.query,
                      city: event.data.searchData.city,
                      type: event.data.searchData.type,
                      timestamp: event.data.searchData.timestamp || Date.now(),
                      totalResults: event.data.searchData.items ? event.data.searchData.items.length : 0,
                      hasMoreData: true
                    };
                    
                    localStorage.setItem('snap_lead_manager_search_data', JSON.stringify(essentialData));
                    
                    // Guardar datos completos en chrome.storage que tiene más capacidad
                    chrome.storage.local.set({'snap_lead_manager_full_search_data': event.data.searchData});
                  } else {
                    localStorage.setItem('snap_lead_manager_search_data', searchDataStr);
                  }
                  
                  localStorage.setItem('snap_lead_manager_search_active', 'true');
                } catch (error) {
                  console.error('Lead Manager Pro: Error al guardar datos de búsqueda:', error);
                  
                  // Si falla, intentar guardar solo datos esenciales
                  try {
                    const minimalData = {
                      query: event.data.searchData.query,
                      city: event.data.searchData.city,
                      type: event.data.searchData.type,
                      timestamp: Date.now(),
                      error: 'Datos completos demasiado grandes para almacenar'
                    };
                    
                    localStorage.setItem('snap_lead_manager_search_data', JSON.stringify(minimalData));
                    localStorage.setItem('snap_lead_manager_search_active', 'true');
                  } catch (fallbackError) {
                    console.error('Lead Manager Pro: Error al guardar datos mínimos:', fallbackError);
                  }
                }
              }
              
              // Iniciar búsqueda si está disponible la función
              if (window.LeadManagerPro && window.LeadManagerPro.startSearch) {
                window.LeadManagerPro.startSearch(event.data.searchData);
              } else {
                // Si no está disponible, guardar para iniciar en la carga
                localStorage.setItem('snap_lead_manager_start_search_on_load', 'true');
                
                // Recargar usando método seguro
                setTimeout(() => {
                  try {
                    window.history.go(0);
                  } catch (error) {
                    console.error('Error al recargar con history.go:', error);
                  }
                }, 200);
              }
            } catch (error) {
              console.error('Error al procesar solicitud de inicio de búsqueda:', error);
            }
          }
        }
      });
      
      console.log('Lead Manager Pro: Parche para reload() instalado correctamente');
    }
  }, 500);
  
  // Limpiar intervalo después de 10 segundos para evitar fugas de memoria
  setTimeout(() => {
    clearInterval(waitForSidebar);
  }, 10000);
  
  // También manejar eventos en la ventana principal
  window.addEventListener('message', function(event) {
    if (event.data && event.data.action === 'reload_safely') {
      console.log('Lead Manager Pro: Recibido mensaje para recargar de forma segura');
      try {
        window.history.go(0);
      } catch (error) {
        console.error('Error al recargar con history.go:', error);
      }
    }
  });
})();
