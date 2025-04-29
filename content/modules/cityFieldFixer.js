/**
 * Módulo para asegurar que el campo de ciudad se rellene correctamente
 * Este módulo se encarga de rellenar explícitamente el campo de ciudad
 * cuando se cargan criterios de búsqueda guardados
 */

// Namespace para la organización del código
window.LeadManagerPro = window.LeadManagerPro || {};
window.LeadManagerPro.modules = window.LeadManagerPro.modules || {};

// Función para rellenar el campo de ciudad de forma forzada
window.LeadManagerPro.modules.forceCityField = function() {
  console.log('CityFieldFixer: Verificando campo de ciudad...');
  
  // Esperar a que el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      tryFillCityField();
    });
  } else {
    tryFillCityField();
  }
  
  // Instalamos un MutationObserver para monitorear cambios en el DOM
  installCityFieldObserver();
  
  // Rellenar campo de ciudad con varios reintentos
  function tryFillCityField() {
    console.log('CityFieldFixer: Intentando rellenar campo de ciudad...');
    
    // Obtener datos de búsqueda guardados
    const searchDataStr = localStorage.getItem('snap_lead_manager_search_data');
    if (!searchDataStr) {
      console.log('CityFieldFixer: No hay datos de búsqueda guardados');
      return;
    }
    
    try {
      // Parsear datos de búsqueda
      const searchData = JSON.parse(searchDataStr);
      
      // Si no hay ciudad, no hay nada que hacer
      if (!searchData.city) {
        console.log('CityFieldFixer: No hay ciudad en los datos de búsqueda');
        return;
      }
      
      console.log('CityFieldFixer: Ciudad encontrada en datos de búsqueda:', searchData.city);
      
      // Primer intento: buscar en el iframe del sidebar
      let cityInput = null;
      const sidebarFrame = document.getElementById('snap-lead-manager-iframe');
      
      if (sidebarFrame && sidebarFrame.contentDocument) {
        console.log('CityFieldFixer: Buscando campo de ciudad en el iframe...');
        
        cityInput = sidebarFrame.contentDocument.getElementById('search-city');
        
        if (!cityInput) {
          // Intentar selectores alternativos
          cityInput = sidebarFrame.contentDocument.querySelector('input[name="search-city"]');
        }
        
        if (!cityInput) {
          // Buscar por placeholder
          const inputs = sidebarFrame.contentDocument.querySelectorAll('input');
          for (let i = 0; i < inputs.length; i++) {
            if (inputs[i].placeholder && 
                (inputs[i].placeholder.toLowerCase().includes('ciudad') || 
                 inputs[i].placeholder.toLowerCase().includes('city'))) {
              cityInput = inputs[i];
              break;
            }
          }
        }
      }
      
      // Si encontramos el campo, establecer el valor y disparar eventos
      if (cityInput) {
        console.log('CityFieldFixer: Campo de ciudad encontrado, estableciendo valor:', searchData.city);
        
        // Establecer valor
        cityInput.value = searchData.city;
        
        // Disparar eventos para que Facebook detecte el cambio
        const events = ['input', 'change', 'blur'];
        events.forEach(eventType => {
          const event = new Event(eventType, { bubbles: true });
          cityInput.dispatchEvent(event);
        });
        
        // También intentar modificar directamente
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')
          .set.call(cityInput, searchData.city);
        
        console.log('CityFieldFixer: Campo de ciudad actualizado correctamente');
        
        return true;
      } else {
        console.log('CityFieldFixer: Campo de ciudad no encontrado en el primer intento');
        
        // Programar reintentos
        scheduleRetries(searchData.city);
        
        return false;
      }
    } catch (error) {
      console.error('CityFieldFixer: Error al procesar datos de búsqueda:', error);
      return false;
    }
  }
  
  // Programar reintentos con retrasos crecientes
  function scheduleRetries(cityValue) {
    // Arreglo de tiempos de retraso en ms (1s, 2s, 4s, 8s)
    const delays = [1000, 2000, 4000, 8000];
    
    delays.forEach((delay, index) => {
      setTimeout(() => {
        console.log(`CityFieldFixer: Reintento ${index + 1} para rellenar campo de ciudad...`);
        fillCityField(cityValue);
      }, delay);
    });
  }
  
  // Función para rellenar el campo de ciudad con diferentes estrategias
  function fillCityField(cityValue) {
    if (!cityValue) return false;
    
    let cityInput = null;
    let success = false;
    
    // Estrategia 1: iframe del sidebar
    const sidebarFrame = document.getElementById('snap-lead-manager-iframe');
    if (sidebarFrame && sidebarFrame.contentDocument) {
      // Buscar por ID
      cityInput = sidebarFrame.contentDocument.getElementById('search-city');
      
      if (!cityInput) {
        // Buscar por atributos
        cityInput = sidebarFrame.contentDocument.querySelector('input[name="search-city"], input[placeholder*="ciudad"], input[placeholder*="city"]');
      }
      
      if (!cityInput) {
        // Buscar todos los inputs y encontrar uno que parezca de ciudad
        const inputs = sidebarFrame.contentDocument.querySelectorAll('input[type="text"]');
        
        for (let i = 0; i < inputs.length; i++) {
          const input = inputs[i];
          
          // Verificar atributos que podrían indicar que es un campo de ciudad
          if (input.id && (input.id.toLowerCase().includes('city') || input.id.toLowerCase().includes('ciudad'))) {
            cityInput = input;
            break;
          }
          
          if (input.name && (input.name.toLowerCase().includes('city') || input.name.toLowerCase().includes('ciudad'))) {
            cityInput = input;
            break;
          }
          
          if (input.placeholder && (input.placeholder.toLowerCase().includes('city') || input.placeholder.toLowerCase().includes('ciudad'))) {
            cityInput = input;
            break;
          }
          
          // Verificar si hay un label cerca que menciona 'ciudad' o 'city'
          const labels = sidebarFrame.contentDocument.querySelectorAll('label');
          
          for (let j = 0; j < labels.length; j++) {
            if ((labels[j].textContent.toLowerCase().includes('ciudad') || 
                 labels[j].textContent.toLowerCase().includes('city')) &&
                labels[j].htmlFor === input.id) {
              cityInput = input;
              break;
            }
          }
          
          // Si ya encontramos el input, salir del bucle
          if (cityInput) break;
        }
      }
      
      // Si encontramos el campo, establecer el valor
      if (cityInput) {
        cityInput.value = cityValue;
        
        // Disparar eventos
        const events = ['input', 'change', 'blur'];
        events.forEach(eventType => {
          const event = new Event(eventType, { bubbles: true });
          cityInput.dispatchEvent(event);
        });
        
        success = true;
        console.log('CityFieldFixer: Campo de ciudad rellenado correctamente con valor:', cityValue);
      }
    }
    
    // Estrategia 2: ventana principal
    if (!success) {
      // Buscar directamente en la ventana principal
      cityInput = document.querySelector('input[id="search-city"], input[name="search-city"], input[placeholder*="ciudad"], input[placeholder*="city"]');
      
      if (cityInput) {
        cityInput.value = cityValue;
        
        // Disparar eventos
        const events = ['input', 'change', 'blur'];
        events.forEach(eventType => {
          const event = new Event(eventType, { bubbles: true });
          cityInput.dispatchEvent(event);
        });
        
        success = true;
        console.log('CityFieldFixer: Campo de ciudad rellenado correctamente en ventana principal:', cityValue);
      }
    }
    
    return success;
  }
  
  // Instalar MutationObserver para monitorear cambios en el DOM
  function installCityFieldObserver() {
    // Crear observer para detectar cuándo se añade el iframe o campos de búsqueda
    const observer = new MutationObserver(function(mutations) {
      // Buscar cambios relevantes solo en las mutaciones nuevas
      for (const mutation of mutations) {
        // Solo procesar mutaciones de tipo childList (nodos añadidos/eliminados)
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
          let shouldCheckField = false;
          
          // Verificar si alguno de los nodos añadidos es el iframe o contiene campos de búsqueda
          mutation.addedNodes.forEach(node => {
            // Verificar si es un elemento DOM
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Verificar si es el iframe o contiene el iframe
              const isIframe = node.id === 'snap-lead-manager-iframe';
              const hasIframe = node.querySelector && node.querySelector('#snap-lead-manager-iframe');
              
              // Verificar si contiene campos de texto que podrían ser para ciudad
              const hasPotentialCityField = node.querySelector && (
                node.querySelector('input[type="text"]') || 
                node.querySelector('[placeholder*="ciudad"]') ||
                node.querySelector('[placeholder*="city"]')
              );
              
              if (isIframe || hasIframe || hasPotentialCityField) {
                shouldCheckField = true;
              }
            }
          });
          
          // Si encontramos algo relevante, intentar llenar el campo
          if (shouldCheckField) {
            setTimeout(tryFillCityField, 300);
          }
        }
      }
    });
    
    // Configuración más específica para el observer: solo observar cambios en el DOM que afecten a elementos
    // que probablemente contengan campos de búsqueda o el iframe
    observer.observe(document.body, {
      childList: true,     // Monitorear nodos añadidos/eliminados
      subtree: true,       // Monitorear todo el subárbol
      attributes: false,   // No monitorear cambios de atributos (mejora rendimiento)
      characterData: false // No monitorear cambios de texto (mejora rendimiento)
    });
    
    // Limitar tiempo de observación para evitar fugas de memoria, con tiempo más corto
    setTimeout(function() {
      observer.disconnect();
      console.log('CityFieldFixer: Observer desconectado para evitar fugas de memoria');
    }, 20000); // 20 segundos es suficiente en la mayoría de casos
    
    console.log('CityFieldFixer: Observer instalado para monitorear cambios en el DOM');
    
    // También instalar un listener para el evento DOMContentLoaded
    document.addEventListener('DOMContentLoaded', function() {
      console.log('CityFieldFixer: DOMContentLoaded detectado, verificando campo...');
      setTimeout(tryFillCityField, 500);
    });
    
    // Establecer un temporizador para verificar el campo periódicamente durante un tiempo limitado
    let checkCount = 0;
    const maxChecks = 10;
    const checkInterval = setInterval(function() {
      checkCount++;
      if (checkCount > maxChecks) {
        clearInterval(checkInterval);
        return;
      }
      
      console.log(`CityFieldFixer: Verificación periódica ${checkCount}/${maxChecks}`);
      tryFillCityField();
    }, 1000);
  }
  
  // También podemos escuchar mensajes relacionados con la carga de criterios
  window.addEventListener('message', function(event) {
    if (event.data && 
        (event.data.action === 'criteria_loaded' || 
         event.data.action === 'search_data_updated' ||
         event.data.action === 'sidebar_ready')) {
      
      console.log('CityFieldFixer: Recibido mensaje de carga de criterios, verificando campo de ciudad...');
      setTimeout(tryFillCityField, 200);
    }
  });
  
  return {
    fillCityField: fillCityField,
    tryFillCityField: tryFillCityField
  };
};

// Auto-inicialización
window.LeadManagerPro.cityFieldFixer = window.LeadManagerPro.modules.forceCityField();

console.log('CityFieldFixer: Módulo cargado y listo');
