// Constantes y selectores
const SELECTORS = {
  SEARCH_RESULTS: 'div[role="feed"] > div',
  PROFILE_CONTAINER: 'div[role="feed"]',
  PROFILE_LINK: 'a[href*="/profile.php"], a[href*="facebook.com/"], a[role="link"][tabindex="0"]',
  ADD_FRIEND_BUTTON: 'div[aria-label="Añadir a amigos"], div[aria-label="Agregar a amigos"], div[aria-label="Add Friend"]',
  SEARCH_INPUT: 'input[type="search"]',
  MESSAGE_BUTTON: 'div[aria-label="Enviar mensaje"], div[aria-label="Message"]',
  MESSAGE_INPUT: 'div[role="textbox"][contenteditable="true"]'
};

// Estado local
let state = {
  isProcessing: false,
  currentAction: null,
  sidebarVisible: true,
  lastError: null,
  retryAttempts: {},
  timeouts: {}
};

// Constantes
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const OPERATION_TIMEOUT = 30000;

// Función para manejar errores
function handleError(error, operation) {
  console.error(`Error durante ${operation}:`, error);
  state.lastError = { operation, message: error.message, timestamp: Date.now() };
  
  // Inicializar contador de reintentos si no existe
  if (!state.retryAttempts[operation]) {
    state.retryAttempts[operation] = 0;
  }
  
  if (state.retryAttempts[operation] < MAX_RETRIES) {
    state.retryAttempts[operation]++;
    const delay = RETRY_DELAY * state.retryAttempts[operation];
    
    console.log(`Reintentando ${operation} (${state.retryAttempts[operation]}/${MAX_RETRIES}) en ${delay/1000} segundos...`);
    
    // Verificar si chrome.runtime está disponible antes de enviar mensaje
    if (chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'status_update',
        message: `Reintentando ${operation} (intento ${state.retryAttempts[operation]})...`,
        error: true,
        progress: 0
      });
    }
    
    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          switch (operation) {
            case 'search':
              await performSearch(currentSearchTerm);
              break;
            case 'profile_extraction':
              await findProfiles();
              break;
            // Agregar más casos según sea necesario
          }
          state.retryAttempts[operation] = 0;
          resolve(true);
        } catch (retryError) {
          resolve(handleError(retryError, operation));
        }
      }, delay);
    });
  } else {
    state.retryAttempts[operation] = 0;
    
    // Verificar si chrome.runtime está disponible antes de enviar mensaje
    if (chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'status_update',
        message: `Error: No se pudo completar ${operation} después de ${MAX_RETRIES} intentos. ${error.message}`,
        error: true,
        finished: true
      });
    }
    
    return Promise.reject(error);
  }
}

// Función para manejar timeouts
function setupOperationTimeout(operation, timeout = OPERATION_TIMEOUT) {
  if (state.timeouts[operation]) {
    clearTimeout(state.timeouts[operation]);
  }
  
  return new Promise((resolve, reject) => {
    state.timeouts[operation] = setTimeout(() => {
      const error = new Error(`Operación ${operation} excedió el tiempo límite de ${timeout/1000} segundos`);
      reject(error);
    }, timeout);
  });
}

// Función para limpiar timeout
function clearOperationTimeout(operation) {
  if (state.timeouts[operation]) {
    clearTimeout(state.timeouts[operation]);
    delete state.timeouts[operation];
  }
}

// Variables globales
let isProcessing = false;
let currentSearchTerm = '';
let retryCount = 0;

// Función para inyectar el sidebar
function injectSidebar(options = {}) {
  // Verificar si el sidebar ya existe
  if (document.getElementById('snap-lead-manager-overlay')) {
    return;
  }

  // Crear el contenedor del sidebar
  const overlay = document.createElement('div');
  overlay.id = 'snap-lead-manager-overlay';
  
  // Crear la manija para mostrar/ocultar
  const handle = document.createElement('div');
  handle.id = 'snap-lead-manager-handle';
  handle.innerHTML = '⟪';
  handle.title = 'Mostrar/Ocultar Snap Lead Manager';
  
  // Crear el iframe para el contenido del sidebar
  const iframe = document.createElement('iframe');
  iframe.id = 'snap-lead-manager-iframe';
  iframe.src = chrome.runtime.getURL('sidebar.html');
  
  // Ensamblar el sidebar
  overlay.appendChild(handle);
  overlay.appendChild(iframe);
  document.body.appendChild(overlay);
  
  // Añadir clase al body para el margen
  document.body.classList.add('snap-lead-manager-active');
  
  // Manejar eventos de la manija
  handle.addEventListener('click', toggleSidebar);
  
  // Aplicar estado inicial del sidebar (expandido o colapsado)
  let initialStateCollapsed = false;
  
  // Si hay opciones específicas, usarlas primero
  if (options.collapsed !== undefined) {
    initialStateCollapsed = options.collapsed;
  } 
  // Si no hay opciones específicas, usar el estado almacenado en localStorage
  else {
    const sidebarState = localStorage.getItem('snap-lead-manager-state');
    if (sidebarState === 'collapsed') {
      initialStateCollapsed = true;
    }
  }
  
  // Si debe estar colapsado inicialmente, aplicar ese estado
  if (initialStateCollapsed) {
    toggleSidebar();
  }
  
  // Notificar al background script sobre el estado del sidebar
  if (chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({
      action: 'sidebar_state_changed',
      isOpen: state.sidebarVisible
    });
  }
}

// Función para alternar la visibilidad del sidebar
function toggleSidebar() {
  const overlay = document.getElementById('snap-lead-manager-overlay');
  const handle = document.getElementById('snap-lead-manager-handle');
  
  if (state.sidebarVisible) {
    overlay.classList.add('collapsed');
    handle.innerHTML = '⟫';
    document.body.classList.add('snap-lead-manager-collapsed');
    localStorage.setItem('snap-lead-manager-state', 'collapsed');
  } else {
    overlay.classList.remove('collapsed');
    handle.innerHTML = '⟪';
    document.body.classList.remove('snap-lead-manager-collapsed');
    localStorage.setItem('snap-lead-manager-state', 'expanded');
  }
  
  state.sidebarVisible = !state.sidebarVisible;
  
  // Notificar al background script sobre el cambio de estado del sidebar
  if (chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({
      action: 'sidebar_state_changed',
      isOpen: state.sidebarVisible
    });
  }
}

// Función principal de búsqueda
async function performSearch(searchTerm, searchData) {
  console.log('Realizando búsqueda:', searchTerm, 'Datos adicionales:', searchData);
  currentSearchTerm = searchTerm; // Guardar el término de búsqueda
  
  try {
    const timeoutPromise = setupOperationTimeout('search', 60000); // Aumentar el timeout a 60 segundos
    
    // Verificar si chrome.runtime está disponible antes de enviar mensaje
    if (chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'status_update',
        message: 'Iniciando búsqueda en Facebook',
        progress: 10
      });
    }

    // Guardar información de búsqueda en localStorage para mantenerla después de recargas
    localStorage.setItem('snap_lead_manager_search_term', searchTerm);
    localStorage.setItem('snap_lead_manager_search_pending', 'true');
    localStorage.removeItem('snap_lead_manager_city_filter_applied'); // Reiniciar flag del filtro
    
    // Guardar datos adicionales de búsqueda si existen
    if (searchData) {
      localStorage.setItem('snap_lead_manager_search_data', JSON.stringify(searchData));
    } else {
      // Si no hay datos adicionales, eliminar cualquier dato anterior
      localStorage.removeItem('snap_lead_manager_search_data');
    }
    
    // Construir la URL de búsqueda en función de los criterios
    let baseSearchUrl = `https://www.facebook.com/search/people/?q=${encodeURIComponent(searchTerm)}`;
    
    // Si hay datos de ciudad, construir una URL con el filtro específico de ciudad
    if (searchData && searchData.city && searchData.city.trim() !== '') {
      const city = searchData.city.trim();
      console.log(`Aplicando filtro de ciudad: ${city}`);
      
      // Almacenar la búsqueda completa para mostrar en la UI
      localStorage.setItem('snap_lead_manager_full_query', `${searchTerm} (Ciudad: ${city})`);
      
      // Primero navegamos a la búsqueda general de personas
      // El filtro de ciudad se aplicará después de cargar la página
      updateStatus(`Preparando búsqueda con filtro de ciudad: ${city}`, 15);
    } else {
      localStorage.setItem('snap_lead_manager_full_query', searchTerm);
      localStorage.removeItem('snap_lead_manager_search_data'); // Asegurarse de no tener datos antiguos
    }
    
    // Para depuración, intentar enviar otro mensaje antes de la redirección
    try {
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          type: 'status_update',
          message: 'Navegando a la página de búsqueda...',
          progress: 15
        });
        console.log("Mensaje enviado: Navegando a la página de búsqueda");
      }
    } catch (e) {
      console.error("Error al enviar mensaje antes de navegar:", e);
    }
    
    // Navegar a la página de búsqueda
    console.log('Navegando a la página de búsqueda...');
    
    // Usar timeout para asegurarnos de que la respuesta al mensaje original se envía primero
    setTimeout(() => {
      window.location.href = baseSearchUrl;
    }, 100);
    
    clearOperationTimeout('search');
    return { success: true, message: 'Navegando a la página de búsqueda...' };
  } catch (error) {
    clearOperationTimeout('search');
    console.error('Error en performSearch:', error);
    return { success: false, error: error.message };
  }
}

// Función para aplicar filtros después de cargar la página de resultados
async function applySearchFilters() {
  console.log('Aplicando filtros de búsqueda...');
  updateStatus('Aplicando filtros de búsqueda...', 20);
  
  // Comprobar si ya hemos aplicado los filtros
  if (localStorage.getItem('snap_lead_manager_city_filter_applied') === 'true') {
    console.log('Los filtros ya están aplicados, omitiendo');
    return { success: true, message: 'Filtros ya aplicados' };
  }
  
  try {
    // Obtener datos de búsqueda del localStorage
    const searchDataStr = localStorage.getItem('snap_lead_manager_search_data');
    if (!searchDataStr) {
      console.log('No hay datos de búsqueda, omitiendo filtros');
      return { success: true, message: 'No hay datos de filtro para aplicar' };
    }
    
    const searchData = JSON.parse(searchDataStr);
    if (!searchData.city || searchData.city.trim() === '') {
      console.log('No hay ciudad especificada en los datos de búsqueda');
      return { success: true, message: 'No hay ciudad para filtrar' };
    }
    
    // Marcar que estamos aplicando el filtro
    localStorage.setItem('snap_lead_manager_city_filter_applied', 'false');
    
    updateStatus('Aplicando filtro de ciudad...', 20);
    console.log('Comenzando a aplicar filtro de ciudad:', searchData.city);
    
    // Esperar a que se cargue completamente la página de resultados
    await sleep(3000);
    
    // ENFOQUE MEJORADO PARA SELECCIONAR ESPECÍFICAMENTE EL PRIMER ELEMENTO DEL LISTBOX
    console.log('Aplicando filtro de ciudad con enfoque mejorado...');

    // 1. Buscar el input de ciudad específicamente con los selectores proporcionados
    console.log('Buscando input de ciudad...');
    let cityInput = document.querySelector('input[aria-label="Ciudad"][role="combobox"][placeholder="Ciudad"]');
    
    if (!cityInput) {
      console.log('No se encontró el input de ciudad con el selector exacto, intentando alternativas...');
      
      // Probar con múltiples selectores alternativos basados en el HTML proporcionado
      const alternativeSelectors = [
        'input[placeholder="Ciudad"]',
        'input[aria-label="Ciudad"]',
        'input.x1i10hfl[role="combobox"]',
        'div.x1n2onr6 > input',
        'input[role="combobox"][type="search"]'
      ];
      
      for (const selector of alternativeSelectors) {
        const input = document.querySelector(selector);
        if (input) {
          console.log(`Input de ciudad encontrado con selector alternativo: ${selector}`);
          cityInput = input;
          break;
        }
      }
      
      if (!cityInput) {
        console.error('No se pudo encontrar el input de ciudad con ningún selector');
        return;
      }
    }
    
    console.log('Campo de entrada para ciudad encontrado:', cityInput);
    
    // 2. Focus y borrar el campo
    cityInput.focus();
    cityInput.value = '';
    cityInput.dispatchEvent(new Event('input', { bubbles: true }));
    await sleep(500);
    
    // 3. Escribir la ciudad deseada
    console.log('Escribiendo la ciudad:', searchData.city);
    await simulateTyping(cityInput, searchData.city);
    
    // 4. Esperar a que aparezcan las sugerencias
    await sleep(2000);
    
    // 5. MÉTODO ESPECÍFICO para el HTML proporcionado
    console.log('Intentando seleccionar el primer elemento del listbox de sugerencias...');
    
    // Buscar el listbox usando la estructura exacta proporcionada
    // Primero buscamos el contenedor principal
    const listboxContainer = document.querySelector('div.x1y1aw1k.x1sxyh0.xwib8y2.xurb0ha');
    
    if (listboxContainer) {
      console.log('Contenedor del listbox encontrado');
      
      // Ahora buscamos el ul con role="listbox"
      const listbox = listboxContainer.querySelector('ul[role="listbox"]');
      
      if (listbox) {
        console.log('Listbox encontrado:', listbox);
        console.log('ID del listbox:', listbox.id);
        console.log('Número de opciones según aria-label:', listbox.getAttribute('aria-label'));
        
        // Obtener todos los elementos li con role="option"
        const options = listbox.querySelectorAll('li[role="option"]');
        console.log(`Encontradas ${options.length} opciones en el listbox`);
        
        if (options.length > 0) {
          // Obtener el primer elemento li
          const firstOption = options[0];
          console.log('Primer option ID:', firstOption.id);
          console.log('Primer option text:', firstOption.textContent.trim());
          
          // ESTRATEGIA 1: Hacer clic en el div interno con role="presentation" dentro del li
          const presentationDiv = firstOption.querySelector('div[role="presentation"]');
          if (presentationDiv) {
            console.log('Encontrado div[role="presentation"] dentro del primer li, haciendo clic...');
            presentationDiv.click();
            await sleep(1500);
          } 
          // ESTRATEGIA 2: Si no hay div interno o el clic no funciona, hacer clic directamente en el li
          else {
            console.log('No se encontró div[role="presentation"], haciendo clic directamente en el li...');
            firstOption.click();
            await sleep(1500);
          }
          
          // ESTRATEGIA 3: Si las anteriores no funcionan, intentar con dispatch de eventos
          const clickElementWithMultipleStrategies = async (element, description) => {
            console.log(`Intentando múltiples estrategias de clic en ${description}...`);
            
            // 1. Click normal
            element.click();
            await sleep(500);
            
            // 2. Forzar focus y simular Enter
            element.focus();
            await sleep(300);
            element.dispatchEvent(new KeyboardEvent('keydown', {
              key: 'Enter',
              code: 'Enter',
              keyCode: 13,
              which: 13,
              bubbles: true
            }));
            await sleep(500);
            
            // 3. Usar MouseEvent
            const mouseEvent = new MouseEvent('mousedown', {
              bubbles: true,
              cancelable: true,
              view: window
            });
            element.dispatchEvent(mouseEvent);
            await sleep(300);
            
            const mouseUpEvent = new MouseEvent('mouseup', {
              bubbles: true,
              cancelable: true,
              view: window
            });
            element.dispatchEvent(mouseUpEvent);
            await sleep(300);
            
            // 4. Usar evento táctil para dispositivos móviles
            const touchStartEvent = new TouchEvent('touchstart', {
              bubbles: true,
              cancelable: true,
              view: window
            });
            element.dispatchEvent(touchStartEvent);
            await sleep(300);
            
            const touchEndEvent = new TouchEvent('touchend', {
              bubbles: true,
              cancelable: true,
              view: window
            });
            element.dispatchEvent(touchEndEvent);
            await sleep(500);
          };
          
          // Intentar con múltiples estrategias en elementos específicos
          const clickables = [
            { element: firstOption, description: 'first li option' },
            { element: presentationDiv || firstOption.querySelector('div.x1i10hfl'), description: 'presentation div' },
            { element: firstOption.querySelector('span.x1lliihq'), description: 'text span' }
          ];
          
          for (const clickable of clickables) {
            if (clickable.element) {
              await clickElementWithMultipleStrategies(clickable.element, clickable.description);
              // Verificar si se aplicó el filtro después de cada intento
              if (document.querySelector('input[aria-label="Ciudad"]')?.value.includes(searchData.city)) {
                console.log('Filtro aplicado con éxito usando:', clickable.description);
                break;
              }
            }
          }
          
          // Si llegamos hasta aquí, marcar como aplicado
          localStorage.setItem('snap_lead_manager_city_filter_applied', 'true');
          console.log('Filtro de ciudad aplicado con éxito');
          updateStatus('Filtro de ciudad aplicado, cargando resultados...', 40);
          return;
        } else {
          console.log('No se encontraron elementos li[role="option"] dentro del listbox');
        }
      } else {
        console.log('No se encontró el ul[role="listbox"] dentro del contenedor');
      }
    } else {
      console.log('No se encontró el contenedor del listbox con la clase exacta');
    }
    
    // MÉTODO ALTERNATIVO: Buscar directamente el li[role="option"]
    console.log('Intentando encontrar directamente cualquier elemento li[role="option"]');
    const allOptions = document.querySelectorAll('li[role="option"]');
    
    if (allOptions.length > 0) {
      console.log(`Encontrados ${allOptions.length} elementos li[role="option"] en la página`);
      // Seleccionar el primer elemento
      const firstOption = allOptions[0];
      console.log('Seleccionando primer li[role="option"]:', firstOption.textContent.trim());
      
      // Intentar clic directo
      firstOption.click();
      await sleep(1500);
      
      localStorage.setItem('snap_lead_manager_city_filter_applied', 'true');
      console.log('Filtro de ciudad aplicado con método alternativo');
      updateStatus('Filtro de ciudad aplicado, cargando resultados...', 40);
      return;
    }
    
    // Si todos los métodos anteriores fallan, buscar cualquier elemento que contenga el texto
    console.log('Intentando método de respaldo final...');
    const cityLower = searchData.city.toLowerCase().trim();
    const textMatchingElements = Array.from(document.querySelectorAll('div, span, li'))
      .filter(el => {
        // Solo elementos visibles y que contengan el texto de la ciudad
        const isVisible = el.offsetParent !== null;
        const text = el.textContent.toLowerCase().trim();
        return isVisible && text.includes(cityLower) && text.length < 100;
      });
    
    if (textMatchingElements.length > 0) {
      console.log(`Encontrados ${textMatchingElements.length} elementos con texto coincidente`);
      // Intentar clic en el primer elemento que coincida
      const bestMatch = textMatchingElements[0];
      console.log('Intentando clic en:', bestMatch.textContent.trim());
      
      bestMatch.click();
      await sleep(1500);
      
      localStorage.setItem('snap_lead_manager_city_filter_applied', 'true');
      console.log('Filtro de ciudad aplicado con método de respaldo');
      updateStatus('Filtro de ciudad aplicado, cargando resultados...', 40);
    } else {
      console.log('No se encontraron elementos coincidentes para la ciudad');
      updateStatus('No se pudieron encontrar opciones para la ciudad', 30, true);
    }
  } catch (error) {
    console.error('Error al aplicar filtro de ciudad:', error);
    updateStatus('Error al aplicar filtro de ciudad: ' + error.message, 30, true);
  }
  
  // Esperar a que los resultados se carguen después de aplicar el filtro
  console.log('Esperando a que se carguen los resultados con el filtro aplicado...');
  updateStatus('Esperando a que se carguen los resultados con filtro de ciudad...', 45);
  await sleep(5000);
  
  // Espera adicional después de aplicar el filtro de ciudad
  console.log('Filtro de ciudad aplicado. Esperando 2 segundos adicionales antes de continuar...');
  updateStatus('Filtro de ciudad aplicado. Preparando escaneo...', 48);
  await sleep(2000);
  
  // Iniciar la búsqueda de perfiles para continuar con el proceso
  console.log('Iniciando búsqueda de perfiles después de aplicar filtro de ciudad...');
  try {
    await findProfiles();
    console.log('Búsqueda de perfiles completada con éxito después de aplicar filtro de ciudad');
  } catch (error) {
    console.error('Error al buscar perfiles después de aplicar filtro de ciudad:', error);
    updateStatus('Error en la búsqueda después de aplicar filtro: ' + error.message, 30, true);
  }
}

// Función para actualizar el estado y enviar información al sidebar
function updateStatus(message, progress = 0, isError = false) {
  console.log(message);
  
  // Verificar si chrome.runtime está disponible antes de enviar mensaje
  if (chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({
      type: 'status_update',
      message: message,
      progress: progress,
      error: isError
    });
  }
  
  // También enviar actualización al iframe del sidebar si existe
  const iframe = document.getElementById('snap-lead-manager-iframe');
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage({
      action: 'status_update',
      message: message,
      progress: progress,
      error: isError
    }, '*');
  }
}

// Escuchar mensajes del iframe del sidebar
window.addEventListener('message', async (event) => {
  // Verificar que el mensaje viene de nuestro sidebar
  if (event.source !== document.getElementById('snap-lead-manager-iframe')?.contentWindow) {
    return;
  }
  
  console.log('Content script recibió mensaje del iframe:', event.data);
  
  const { action, from, searchTerm, data } = event.data;
  
  if (from === 'snap-lead-manager') {
    switch (action) {
      case 'toggle_sidebar':
        toggleSidebar();
        break;
      case 'sidebar_loaded':
        console.log('Sidebar cargado correctamente');
        break;
      case 'search':
        // Manejar búsqueda enviada vía postMessage (cuando chrome.runtime no está disponible)
        console.log('Recibida solicitud de búsqueda vía postMessage:', searchTerm, data);
        
        if (!isProcessing) {
          isProcessing = true;
          
          // Realizar la búsqueda y responder
          performSearch(searchTerm, data)
            .then(result => {
              console.log('Búsqueda iniciada con éxito:', result);
              isProcessing = false;
            })
            .catch(error => {
              console.error('Error al iniciar búsqueda:', error);
              isProcessing = false;
              
              // Notificar al iframe del error
              const iframe = document.getElementById('snap-lead-manager-iframe');
              if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage({
                  action: 'search_response',
                  success: false,
                  error: error.message
                }, '*');
              }
            });
        } else {
          console.warn('Ya hay una búsqueda en proceso');
          // Notificar al iframe que ya hay una búsqueda en proceso
          const iframe = document.getElementById('snap-lead-manager-iframe');
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({
              action: 'search_response',
              success: false,
              error: 'Ya hay una búsqueda en proceso'
            }, '*');
          }
        }
        break;
    }
  }
});

// Escuchar mensajes del background script
if (chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Content script recibió mensaje:', message);
    
    if (message.action === 'search') {
      if (!isProcessing) {
        console.log('Iniciando búsqueda con término:', message.searchTerm);
        
        // Marcar como procesando
        isProcessing = true;
        
        // Usar promesa para manejar la búsqueda de forma asíncrona
        performSearch(message.searchTerm, message.searchData)
          .then(result => {
            console.log('Búsqueda iniciada con éxito:', result);
            isProcessing = false; // Restablecer el flag cuando la búsqueda termina
            sendResponse({ success: true, result });
          })
          .catch(error => {
            console.error('Error al iniciar búsqueda:', error);
            isProcessing = false; // Restablecer el flag en caso de error
            sendResponse({ success: false, error: error.message });
          });
        
        // Indicar que la respuesta se enviará asincrónicamente
        return true;
      } else {
        console.warn('Ya hay una búsqueda en proceso');
        sendResponse({ success: false, error: 'Ya hay una búsqueda en proceso' });
        return false; // No es necesario mantener la conexión abierta
      }
    } else if (message.action === 'restore_sidebar') {
      // Restaurar el sidebar
      injectSidebar();
      
      // Si hay datos de búsqueda, guardarlos en localStorage
      if (message.searchTerm) {
        currentSearchTerm = message.searchTerm;
        
        if (message.searchData) {
          console.log('Restaurando datos de búsqueda:', message.searchData);
          localStorage.setItem('snap_lead_manager_search_data', JSON.stringify(message.searchData));
          
          // Resetear el indicador de filtro de ciudad aplicado
          localStorage.setItem('snap_lead_manager_city_filter_applied', 'false');
        }
      }
      
      sendResponse({ success: true, message: 'Sidebar restaurado' });
    } else if (message.action === 'apply_filters') {
      // Aplicar filtros de búsqueda (principalmente ciudad)
      console.log('Solicitando aplicar filtros de búsqueda');
      
      // Verificar si ya tenemos filtros aplicados
      const cityFilterApplied = localStorage.getItem('snap_lead_manager_city_filter_applied') === 'true';
      
      if (cityFilterApplied) {
        console.log('Los filtros ya están aplicados, iniciando búsqueda de perfiles...');
        // Aunque los filtros estén aplicados, iniciamos la búsqueda para asegurar que se realice el proceso completo
        findProfiles()
          .then(() => {
            sendResponse({ success: true, message: 'Filtros ya aplicados, búsqueda de perfiles completada' });
          })
          .catch(error => {
            console.error('Error al buscar perfiles con filtros ya aplicados:', error);
            sendResponse({ success: false, error: error.message });
          });
      } else {
        // Aplicar filtros de búsqueda
        console.log('Aplicando filtros y luego buscando perfiles...');
        applySearchFilters()
          .then(result => {
            console.log('Resultado de aplicar filtros:', result);
            
            if (result && result.success) {
              return findProfiles()
                .then(() => {
                  sendResponse({ success: true, message: 'Filtros aplicados y búsqueda de perfiles completada' });
                })
                .catch(error => {
                  console.error('Error al buscar perfiles después de aplicar filtros:', error);
                  sendResponse({ success: false, error: error.message });
                });
            } else {
              sendResponse({ success: false, error: result?.error || 'Error al aplicar filtros' });
            }
          })
          .catch(error => {
            console.error('Error al aplicar filtros:', error);
            sendResponse({ success: false, error: error.message });
          });
      }
      
      return true; // Mantener el canal abierto para respuesta asíncrona
    } else if (message.action === 'status_update') {
      // Actualizar estado en la página
      updateStatus(message.message || 'Estado actualizado', message.progress || 0, message.error);
      sendResponse({ success: true });
      return false; // No necesitamos mantener el canal abierto
    } else {
      // Respuesta por defecto para acciones desconocidas
      console.log('Acción no reconocida:', message.action);
      sendResponse({ success: false, error: 'Acción no reconocida' });
      return false; // No necesitamos mantener el canal abierto
    }
  });
} else {
  console.log('chrome.runtime.onMessage no está disponible en este contexto');
}

// Manejar desconexión de la extensión
try {
  if (chrome.runtime && chrome.runtime.onDisconnect) {
    chrome.runtime.onDisconnect.addListener(() => {
      console.log('Extensión desconectada. Limpiando estado...');
      isProcessing = false;
      currentSearchTerm = '';
      retryCount = 0;
    });
  } else {
    console.log('chrome.runtime.onDisconnect no está disponible en este contexto');
  }
} catch (error) {
  console.error('Error al configurar el listener de desconexión:', error);
}

// Función para encontrar perfiles en la página de resultados de búsqueda
async function findProfiles() {
  try {
    console.log('Iniciando búsqueda de perfiles...');
    updateStatus('Iniciando búsqueda de perfiles...', 30);
    
    // Esperar a que los resultados se carguen
    console.log('Esperando que se cargue el contenedor de perfiles...');
    updateStatus('Esperando que se cargue el contenedor de perfiles...', 35);
    
    // Intentar varios selectores para mayor robustez
    let feedContainer = null;
    const possibleSelectors = [
      SELECTORS.PROFILE_CONTAINER,
      'div[role="feed"]',
      'div.x1hc1fzr',
      'div[data-pagelet="MainFeed"]',
      'div.x9f619.x1n2onr6.x1ja2u2z' // Selector alternativo que podría funcionar en diferentes versiones de Facebook
    ];
    
    for (const selector of possibleSelectors) {
      try {
        const container = await waitForElement(selector, 5000);
        if (container) {
          feedContainer = container;
          console.log(`Contenedor de perfiles encontrado con selector: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`No se encontró contenedor con selector: ${selector}`);
      }
    }
    
    if (!feedContainer) {
      throw new Error('No se pudo encontrar el contenedor de perfiles después de intentar varios selectores');
    }
    
    console.log('Contenedor de perfiles encontrado:', feedContainer);
    updateStatus('Contenedor de perfiles encontrado', 40);
    
    // Dar tiempo adicional para que se carguen todos los resultados
    console.log('Esperando carga inicial de resultados...');
    updateStatus('Esperando carga inicial de resultados...', 45);
    await sleep(3000);
    
    // Función para hacer scroll para cargar más resultados
    const scrollForMoreResults = async (maxScrolls = 50) => {
      let prevHeight = 0;
      let scrollCount = 0;
      let noChangeCount = 0;
      
      console.log(`Comenzando scroll para cargar más resultados (máximo ${maxScrolls} scrolls)...`);
      updateStatus(`Comenzando scroll para cargar más resultados (máximo ${maxScrolls} scrolls)...`, 50);
      
      // Verificar si hay un botón de "Ver más resultados" o similar y hacer clic si existe
      try {
        const moreResultsButtons = Array.from(document.querySelectorAll('div[role="button"]')).filter(
          button => button.textContent.includes('Ver más') || 
                   button.textContent.includes('Mostrar más') || 
                   button.textContent.includes('Cargar más')
        );
        
        if (moreResultsButtons.length > 0) {
          console.log('Se encontró botón de "Ver más resultados", haciendo clic...');
          moreResultsButtons[0].click();
          await sleep(3000); // Esperar a que carguen más resultados
        }
      } catch (e) {
        console.log('No se encontró botón de "Ver más resultados" o hubo un error:', e);
      }
      
      while (scrollCount < maxScrolls) {
        // Obtener altura actual del contenedor
        const currentHeight = feedContainer.scrollHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        // Si la altura no ha cambiado después de varios intentos, asumimos que no hay más resultados
        if (currentHeight === prevHeight) {
          noChangeCount++;
          console.log(`Altura sin cambios: ${noChangeCount}/3. Actual: ${currentHeight}px`);
          
          if (noChangeCount >= 3) {
            console.log('No hay más resultados para cargar (altura estable).');
            updateStatus('No hay más resultados para cargar (altura estable)', 60);
            break;
          }
        } else {
          noChangeCount = 0;
          console.log(`Altura cambió de ${prevHeight}px a ${currentHeight}px`);
        }
        
        // Verificar si hemos llegado al final de la página
        const scrollY = window.scrollY;
        const visibleHeight = window.innerHeight;
        const totalHeight = documentHeight;
        
        console.log(`Scroll actual: ${scrollY}px, Altura visible: ${visibleHeight}px, Altura total: ${totalHeight}px`);
        
        // Si estamos cerca del final de la página y no hay cambios, podríamos haber llegado al final
        if (scrollY + visibleHeight >= totalHeight - 200 && noChangeCount >= 2) {
          console.log('Llegamos al final de la página.');
          updateStatus('Llegamos al final de la página', 60);
          break;
        }
        
        // Hacer scroll hasta el final del contenedor y un poco más allá para forzar la carga
        window.scrollTo(0, document.body.scrollHeight + 1000);
        
        // Esperar a que se carguen nuevos resultados (aumentamos el tiempo de espera)
        await sleep(2000);
        
        prevHeight = currentHeight;
        scrollCount++;
        
        console.log(`Scroll ${scrollCount}/${maxScrolls} completado`);
        updateStatus(`Scroll ${scrollCount}/${maxScrolls} completado`, 50 + Math.floor((scrollCount / maxScrolls) * 10));
      }
      
      console.log(`Scroll finalizado después de ${scrollCount} iteraciones.`);
      updateStatus(`Scroll finalizado después de ${scrollCount} iteraciones`, 60);
      // Dar tiempo para que se carguen los últimos resultados
      await sleep(2000);
    };
    
    // Realizar scroll para cargar más resultados
    await scrollForMoreResults();
    
    // Obtener todos los resultados
    const results = feedContainer.querySelectorAll(':scope > div');
    console.log(`Se encontraron ${results.length} resultados en bruto`);
    updateStatus(`Se encontraron ${results.length} resultados en bruto`, 65);
    
    if (results.length === 0) {
      throw new Error('No se encontraron resultados de búsqueda');
    }
    
    // Array para almacenar datos de perfiles
    const profiles = [];
    
    // Iterar sobre cada resultado para extraer información
    updateStatus('Analizando perfiles...', 70);
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      
      try {
        // Verificar si el resultado contiene un enlace de perfil
        const profileLink = result.querySelector(SELECTORS.PROFILE_LINK);
        
        if (profileLink) {
          const profileUrl = profileLink.href;
          const profileName = profileLink.textContent.trim();
          
          // Verificar si ya existe un perfil con la misma URL
          if (!profiles.some(p => p.url === profileUrl)) {
            // Extraer información adicional si está disponible
            let additionalInfo = '';
            const infoElements = result.querySelectorAll('span');
            for (const infoEl of infoElements) {
              const text = infoEl.textContent.trim();
              if (text && text !== profileName && text.length < 100) {
                additionalInfo += text + ' ';
              }
            }
            
            profiles.push({
              id: `profile-${i}`,
              name: profileName,
              url: profileUrl,
              index: i,
              processed: false,
              info: additionalInfo.trim()
            });
            
            console.log(`Perfil encontrado: ${profileName} (${profileUrl})`);
            
            // Actualizar contador cada 5 perfiles
            if (profiles.length % 5 === 0) {
              updateStatus(`Perfiles encontrados: ${profiles.length}`, 70 + Math.min(20, Math.floor((profiles.length / results.length) * 20)));
            }
          }
        }
      } catch (error) {
        console.error(`Error al procesar resultado ${i}:`, error);
        // Continuar con el siguiente resultado
      }
    }
    
    console.log(`Total de perfiles únicos encontrados: ${profiles.length}`);
    updateStatus(`Total de perfiles únicos encontrados: ${profiles.length}`, 90);
    
    // Guardar perfiles encontrados en localStorage para conservarlos después de recargas
    if (profiles.length > 0) {
      localStorage.setItem('snap_lead_manager_profiles', JSON.stringify(profiles));
      
      // Notificar al background script sobre los perfiles encontrados
      try {
        if (chrome.runtime && chrome.runtime.sendMessage) {
          const response = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
              action: 'found_profiles',
              profiles: profiles
            }, response => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                resolve(response);
              }
            });
          });
          
          console.log('Background script notificado:', response);
          
          if (chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({
              type: 'status_update',
              message: `Se encontraron ${profiles.length} perfiles`,
              progress: 95
            });
          }
        }
      } catch (error) {
        console.error('Error al notificar perfiles al background script:', error);
      }
      
      updateStatus(`Búsqueda completada. Se encontraron ${profiles.length} perfiles`, 100);
    } else {
      throw new Error('No se encontraron perfiles válidos');
    }
    
    return profiles;
  } catch (error) {
    console.error('Error en findProfiles:', error);
    if (chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'status_update',
        message: `Error al buscar perfiles: ${error.message}`,
        error: true,
        progress: 0
      });
    }
    
    updateStatus(`Error al buscar perfiles: ${error.message}`, 0, true);
    throw error;
  }
}

// Función para seleccionar un perfil específico
async function selectProfile(index) {
  try {
    console.log(`Seleccionando perfil con índice ${index}...`);
    
    // Obtener todos los perfiles
    const { success, profiles } = await findProfiles();
    
    if (!success || !profiles || !profiles[index]) {
      throw new Error('Perfil no encontrado');
    }
    
    const profile = profiles[index];
    console.log('Perfil seleccionado:', profile);
    
    // Hacer scroll hasta el perfil
    profile.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await sleep(1000);
    
    return {
      success: true,
      profileUrl: profile.url,
      profileName: profile.name
    };
  } catch (error) {
    console.error('Error al seleccionar perfil:', error);
    return { success: false, message: error.message };
  }
}

// Función para extraer datos del perfil
async function extractProfileData() {
  try {
    console.log('Extrayendo datos del perfil...');
    
    // Esta función requeriría un análisis detallado de la estructura de la página de perfil
    // Por ahora, solo recopilamos información básica
    
    const name = document.title.replace(' | Facebook', '');
    
    // Recopilar publicaciones recientes (esto es simplificado)
    const posts = Array.from(document.querySelectorAll('div[role="article"]')).map(post => ({
      text: post.textContent.substring(0, 200),
      timestamp: post.querySelector('a[href*="/posts/"] span')?.textContent || 'Desconocido'
    })).slice(0, 5); // Limitar a 5 publicaciones
    
    return {
      success: true,
      profileData: {
        name,
        url: window.location.href,
        posts
      }
    };
  } catch (error) {
    console.error('Error al extraer datos del perfil:', error);
    return { success: false, message: error.message };
  }
}

// Función para enviar solicitud de amistad
async function sendFriendRequest() {
  try {
    console.log('Enviando solicitud de amistad...');
    
    // Esperar a que el botón de añadir amigo esté disponible
    const addFriendButton = await waitForElement(SELECTORS.ADD_FRIEND_BUTTON);
    
    // Simular clic en el botón
    addFriendButton.click();
    
    // Esperar un momento para confirmar
    await sleep(1000);
    
    return { success: true, message: 'Solicitud de amistad enviada' };
  } catch (error) {
    console.error('Error al enviar solicitud de amistad:', error);
    return { success: false, message: error.message };
  }
}

// Función para abrir Messenger
async function openMessenger() {
  try {
    console.log('Abriendo Messenger...');
    
    // Esperar a que el botón de Messenger esté disponible
    const messengerButton = await waitForElement(SELECTORS.MESSAGE_BUTTON);
    
    // Simular clic en el botón
    messengerButton.click();
    
    // Esperar a que se abra la ventana de chat
    await sleep(2000);
    
    return { success: true, message: 'Messenger abierto' };
  } catch (error) {
    console.error('Error al abrir Messenger:', error);
    return { success: false, message: error.message };
  }
}

// Función para enviar un mensaje
async function sendMessage(text) {
  try {
    console.log(`Enviando mensaje: ${text}`);
    
    if (!text) {
      return { success: false, message: 'Texto del mensaje vacío' };
    }
    
    // Esperar a que el campo de entrada esté disponible
    const messageInput = await waitForElement(SELECTORS.MESSAGE_INPUT);
    
    // Simular escritura en el campo
    messageInput.focus();
    messageInput.textContent = text;
    
    // Disparar evento de input para activar el botón de envío
    messageInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Esperar un momento
    await sleep(500);
    
    // Buscar el botón de envío
    const sendButton = document.querySelector(SELECTORS.SEND_BUTTON);
    
    if (sendButton) {
      // Si hay botón de envío, hacer clic en él
      sendButton.click();
    } else {
      // Si no hay botón, simular presionar Enter
      messageInput.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true
      }));
    }
    
    // Esperar a que se envíe el mensaje
    await sleep(1000);
    
    return { success: true, message: 'Mensaje enviado' };
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    return { success: false, message: error.message };
  }
}

// Función de utilidad para esperar a que un elemento esté disponible
function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }
    
    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Elemento no encontrado: ${selector}`));
    }, timeout);
  });
}

// Función de utilidad para esperar
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Función para encontrar un elemento por fragmentos de texto
function findElementByText(selectors, textFragments, exactMatch = false) {
  const elements = document.querySelectorAll(selectors);
  console.log(`Buscando entre ${elements.length} elementos con los selectores: ${selectors}`);
  
  for (const element of elements) {
    const elementText = element.textContent.toLowerCase().trim();
    
    if (exactMatch) {
      // Buscar coincidencia exacta
      if (textFragments.some(fragment => elementText === fragment.toLowerCase())) {
        console.log(`Encontrada coincidencia exacta: "${elementText}"`);
        return element;
      }
    } else {
      // Buscar coincidencia parcial
      if (textFragments.some(fragment => elementText.includes(fragment.toLowerCase()))) {
        console.log(`Encontrada coincidencia parcial: "${elementText}"`);
        return element;
      }
    }
  }
  
  console.log('No se encontraron elementos con los textos especificados');
  return null;
}

// Función mejorada para forzar eventos de entrada de texto más realistas
async function simulateTyping(inputElement, text) {
  // Asegurarse de que el elemento esté visible y tenga el foco
  inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await sleep(300);
  
  // Dar foco explícitamente
  inputElement.focus();
  await sleep(300);
  
  // Limpiar cualquier valor existente
  inputElement.value = '';
  
  // Disparar evento de input para notificar el cambio
  inputElement.dispatchEvent(new Event('input', { bubbles: true }));
  await sleep(300);
  
  // Establecer el valor completo primero (método directo)
  inputElement.value = text;
  
  // Disparar evento de cambio
  inputElement.dispatchEvent(new Event('input', { bubbles: true }));
  await sleep(500);
  
  // Simulación más realista de eventos específicos de Facebook
  // Disparar evento personalizado utilizado por React/Facebook
  const fbInputEvent = new CustomEvent('input', {
    bubbles: true,
    cancelable: true,
    composed: true,
    detail: { value: text }
  });
  inputElement.dispatchEvent(fbInputEvent);
  
  // También disparar eventos nativos de teclado para simular typing
  // Tecla pulsada inicial
  const initialKeyEvent = new KeyboardEvent('keydown', {
    key: text[0],
    code: `Key${text[0].toUpperCase()}`,
    keyCode: text.charCodeAt(0),
    which: text.charCodeAt(0),
    bubbles: true,
    cancelable: true
  });
  inputElement.dispatchEvent(initialKeyEvent);
  
  // Disparar eventos finales
  inputElement.dispatchEvent(new Event('change', { bubbles: true }));
  
  // Disparar eventos keyup
  const finalKeyEvent = new KeyboardEvent('keyup', {
    key: text[text.length - 1],
    code: `Key${text[text.length - 1].toUpperCase()}`,
    keyCode: text.charCodeAt(text.length - 1),
    which: text.charCodeAt(text.length - 1),
    bubbles: true,
    cancelable: true
  });
  inputElement.dispatchEvent(finalKeyEvent);
  
  console.log(`Entrada de texto simulada para: "${text}"`);
  await sleep(500);
}

// Función para presionar la tecla Enter en un elemento
async function pressEnter(element) {
  const enterEvent = new KeyboardEvent('keydown', {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true
  });
  element.dispatchEvent(enterEvent);
  
  // También disparar evento keyup
  const enterUpEvent = new KeyboardEvent('keyup', {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true
  });
  
  await sleep(100);
  element.dispatchEvent(enterUpEvent);
  console.log('Tecla Enter presionada');
}

// Verificar si hay una búsqueda pendiente después de la recarga
const checkPendingSearch = async () => {
  const pendingSearch = localStorage.getItem('snap_lead_manager_search_pending');
  const searchTerm = localStorage.getItem('snap_lead_manager_search_term');
  let searchData = null;
  
  try {
    const searchDataStr = localStorage.getItem('snap_lead_manager_search_data');
    if (searchDataStr) {
      searchData = JSON.parse(searchDataStr);
    }
  } catch (e) {
    console.error('Error al parsear datos de búsqueda:', e);
  }
  
  // Recuperar el término de búsqueda para mostrar en la UI aunque la búsqueda no esté pendiente
  if (searchTerm) {
    console.log('Recuperando información de búsqueda anterior:', searchTerm);
    // Informar al sidebar sobre la búsqueda actual
    const iframe = document.getElementById('snap-lead-manager-iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        action: 'restore_search_info',
        searchTerm: searchTerm,
        searchData: searchData
      }, '*');
    }
    
    // Verificar si hay perfiles ya almacenados de una búsqueda anterior
    const storedProfiles = localStorage.getItem('snap_lead_manager_profiles');
    if (storedProfiles) {
      try {
        const profiles = JSON.parse(storedProfiles);
        if (profiles && profiles.length > 0) {
          console.log(`Recuperados ${profiles.length} perfiles de búsqueda anterior`);
          
          // Notificar al background script sobre los perfiles recuperados
          if (chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({
              action: 'found_profiles',
              profiles: profiles
            }, response => {
              console.log('Background script notificado de perfiles recuperados:', response);
            });
          }
        }
      } catch (e) {
        console.error('Error al parsear perfiles almacenados:', e);
      }
    }
  }
  
  // Si hay una búsqueda pendiente, procesarla
  if (pendingSearch === 'true' && searchTerm) {
    console.log('Detectada búsqueda pendiente después de recarga:', searchTerm);
    // Esperar a que la página se cargue completamente
    await sleep(3000);
    
    // Verificar si estamos en la página de búsqueda de personas
    const currentUrl = window.location.href;
    const isSearchPeoplePage = currentUrl.includes('/search/people');
    
    if (isSearchPeoplePage) {
      // Si tenemos datos de ciudad, aplicar filtros
      const searchDataStr = localStorage.getItem('snap_lead_manager_search_data');
      if (searchDataStr) {
        try {
          const searchData = JSON.parse(searchDataStr);
          if (searchData.city && searchData.city.trim() !== '') {
            // Aplicar filtros de búsqueda específicos (como el filtro de ciudad)
            await applySearchFilters();
            return;
          }
        } catch (e) {
          console.error('Error al procesar datos de búsqueda:', e);
        }
      }
      
      // Si no hay datos de ciudad o hubo un error, proceder con la búsqueda normal
      await findProfiles();
    } else {
      // Si no estamos en la página de búsqueda, redirigir
      await performSearch(searchTerm, searchData);
    }
  }
};

// Función para inicializar el content script
const initialize = async () => {
  console.log('Inicializando content script...');
  
  // Verificar si estamos en Facebook
  if (!window.location.hostname.includes('facebook.com')) {
    console.log('Esta página no es Facebook, no se iniciará el content script');
    return;
  }
  
  console.log('Detectada página de Facebook, iniciando Snap Lead Manager');
  
  // Verificar si debemos restaurar el sidebar desde el background script
  if (chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({ action: 'restore_sidebar' }, (response) => {
      // Si el sidebar estaba abierto en la sesión anterior, restaurarlo
      if (response && response.sidebarOpen) {
        console.log('Restaurando el sidebar según estado anterior');
        injectSidebar({ collapsed: false });
      } else {
        // Si no hay información previa, inyectar el sidebar normalmente
        injectSidebar();
      }
    });
  } else {
    // Si no podemos comunicarnos con el background, inyectar el sidebar normalmente
    injectSidebar();
  }
  
  // Suscribirse a la creación/actualización de DOM
  const observer = new MutationObserver((mutations) => {
    // Procesar mutaciones si es necesario para detectar cambios en la UI de Facebook
    // ...
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Comprobar si hay una búsqueda pendiente
  await checkPendingSearch();
};

// Iniciar content script cuando se carga la página
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Inyectar sidebar después de que el DOM esté completamente cargado
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    injectSidebar();
  });
} else {
  injectSidebar();
}

// Reintentar inyección después de 2 segundos si no funciona inmediatamente
setTimeout(() => {
  if (!document.getElementById('snap-lead-manager-overlay')) {
    console.log('Reintentando inyección del sidebar...');
    injectSidebar();
  }
  
  // Sincronizar información de búsqueda con el sidebar
  const searchTerm = localStorage.getItem('snap_lead_manager_search_term');
  const searchDataStr = localStorage.getItem('snap_lead_manager_search_data');
  const fullQuery = localStorage.getItem('snap_lead_manager_full_query');
  
  if (searchTerm) {
    let searchData = null;
    try {
      if (searchDataStr) {
        searchData = JSON.parse(searchDataStr);
      }
    } catch (e) {
      console.error('Error al parsear datos de búsqueda:', e);
    }
    
    // Informar al sidebar sobre la búsqueda actual
    const iframe = document.getElementById('snap-lead-manager-iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        action: 'restore_search_info',
        searchTerm: searchTerm,
        searchData: searchData,
        fullQuery: fullQuery
      }, '*');
    }
  }
}, 2000);
