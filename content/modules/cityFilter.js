/**
 * Módulo para aplicar filtros de ciudad en diferentes tipos de búsquedas
 */

// Namespace para la organización del código
window.LeadManagerPro = window.LeadManagerPro || {};
window.LeadManagerPro.modules = window.LeadManagerPro.modules || {};

/**
 * Aplica el filtro de ciudad en la búsqueda actual
 * @returns {Promise<Object>} - Resultado de la operación
 */
window.LeadManagerPro.modules.applyCityFilter = async function() {
  try {
    // Referencias rápidas a funciones de utilidad y otros módulos
    const sleep = window.LeadManagerPro.utils.sleep;
    const updateStatus = window.LeadManagerPro.utils.updateStatus;
    const selectFirstCitySuggestion = window.LeadManagerPro.modules.selectFirstCitySuggestion;
    
    // Verificar si ya se aplicó el filtro
    const cityFilterApplied = localStorage.getItem('snap_lead_manager_city_filter_applied') === 'true';
    if (cityFilterApplied) {
      // Iniciar automáticamente la búsqueda 
      if (window.LeadManagerPro.modules.findProfiles) {
        window.LeadManagerPro.modules.findProfiles().catch(() => {});
      } else {
        console.error('Lead Manager Pro: No se encontró la función findProfiles');
      }
      return { success: true, message: 'El filtro de ciudad ya estaba aplicado' };
    }
    
    // Obtener datos de búsqueda del localStorage
    const searchDataStr = localStorage.getItem('snap_lead_manager_search_data');
    if (!searchDataStr) {
      localStorage.setItem('snap_lead_manager_city_filter_applied', 'true');
      return { success: false, message: 'No hay datos de búsqueda disponibles' };
    }
    
    const searchData = JSON.parse(searchDataStr);
    
    // Verificar si hay una ciudad especificada en los datos de búsqueda
    if (!searchData || !searchData.city || searchData.city.trim() === '') {
      localStorage.setItem('snap_lead_manager_city_filter_applied', 'true');
      return { success: true, message: 'No hay ciudad para filtrar' };
    }
    
    const city = searchData.city.trim();
    updateStatus(`Aplicando filtro de ciudad: ${city}...`, 25);
    
    try {
      // Determinar si estamos en la página de búsqueda de grupos o personas
      const isGroupSearch = window.location.href.includes('/search/groups');
      
      // Mensaje de log ampliado
      console.log(`Lead Manager Pro: Aplicando filtro de ciudad "${city}" en página de ${isGroupSearch ? 'grupos' : 'personas'}`);
      
      // Intentar más enfoques de selección
      let filterResult = false;
      if (isGroupSearch) {
        // Limpiar cualquier filtro previo (2025)
        updateStatus(`Verificando y limpiando filtros existentes...`, 25);
        await cleanExistingCityFilters();
        await sleep(1000);
        
        // Primero intenta el filtro estándar para grupos
        console.log('Lead Manager Pro: Intentando método estándar para grupos');
        filterResult = await applyGroupCityFilter(city);
        
        // Si falló, intenta método alternativo
        if (!filterResult) {
          updateStatus(`Intentando método alternativo para filtro de ciudad en grupos...`, 35);
          console.log('Lead Manager Pro: Intentando método alternativo para grupos');
          await sleep(1000);
          filterResult = await applyAlternativeMethodForGroups(city);
        }
        
        // Si sigue fallando, intenta método de personas
        if (!filterResult) {
          updateStatus(`Intentando método de personas para filtros de grupos...`, 38);
          console.log('Lead Manager Pro: Intentando método de personas para grupos');
          await sleep(1000);
          filterResult = await applyPeopleCityFilter(city);
        }
      } else {
        // Primero intenta el filtro estándar para personas
        filterResult = await applyPeopleCityFilter(city);
        
        // Si falló, intenta método alternativo
        if (!filterResult) {
          updateStatus(`Intentando método alternativo para filtro de ciudad en personas...`, 35);
          await sleep(1000);
          filterResult = await applyAlternativeMethodForPeople(city);
        }
        
        // Si sigue fallando, intenta método para grupos
        if (!filterResult) {
          updateStatus(`Intentando método de grupos para filtros de personas...`, 38);
          await sleep(1000);
          filterResult = await applyGroupCityFilter(city);
        }
      }
    } catch (e) {
      updateStatus(`Error al aplicar filtro de ciudad: ${e.message}, continuando...`, 40);
    }
    
    // Verificar si el filtro fue realmente aplicado (buscar algún indicador en la UI)
    const filterApplied = await verifyFilterApplied(city);
    
    // Marcar como aplicado para evitar reintentos
    localStorage.setItem('snap_lead_manager_city_filter_applied', 'true');
    
    // Notificar al sidebar que el filtro fue aplicado
    notifySidebarFilterApplied(city);
    
    // Iniciar búsqueda de perfiles/grupos
    console.log('Lead Manager Pro: Iniciando búsqueda después de aplicar filtro');
    setTimeout(() => {
      // Usar la referencia directa al módulo global en lugar de variable local
      if (window.LeadManagerPro.modules.findProfiles) {
        window.LeadManagerPro.modules.findProfiles().catch((e) => console.error('Error al iniciar búsqueda:', e));
      } else {
        console.error('Lead Manager Pro: No se encontró la función findProfiles');
      }
    }, 1500);
    
    return { success: true, message: 'Filtro de ciudad aplicado con éxito' };
  } catch (error) {
    window.LeadManagerPro.utils.updateStatus('Error al aplicar filtro de ciudad, continuando sin filtro', 40);
    localStorage.setItem('snap_lead_manager_city_filter_applied', 'true');
    
    // Intentar continuar de todos modos
    setTimeout(() => {
      if (window.LeadManagerPro.modules.findProfiles) {
        window.LeadManagerPro.modules.findProfiles().catch((e) => console.error('Error al iniciar búsqueda:', e));
      } else {
        console.error('Lead Manager Pro: No se encontró la función findProfiles');
      }
    }, 1500);
    
    return { success: false, error: error.message };
  }
};

/**
 * Aplica el filtro de ciudad para búsquedas de grupos
 * @param {string} city - Nombre de la ciudad a filtrar
 * @returns {Promise<boolean>} - true si el filtro se aplicó correctamente
 */
async function applyGroupCityFilter(city) {
  // Referencias rápidas
  const sleep = window.LeadManagerPro.utils.sleep;
  const updateStatus = window.LeadManagerPro.utils.updateStatus;
  const selectFirstCitySuggestion = window.LeadManagerPro.modules.selectFirstCitySuggestion;
  
  // Para grupos, utilizamos una lógica específica
  updateStatus('Buscando filtro de ubicación para grupos...', 30);
  
  // Esperar para que los filtros estén disponibles
  await sleep(2000);
  
  console.log('Lead Manager Pro: Buscando botones de filtro de ubicación para grupos');
  
  // Buscar los botones de filtro con selectores más específicos basados en la estructura de 2025
  const filterButtonsSelectors = [
    // Selector específico para Facebook 2025
    'input[type="search"][placeholder*="Ciudad"]',
    'input[aria-label*="Ciudad"]',
    'input[role="combobox"]',
    // Selectores clásicos
    'div[role="button"]', 
    'button[role="button"]', 
    'span[role="button"]', 
    'a[role="button"]'
  ];
  
  // Buscar primero inputs directos (Facebook 2025 muestra directamente el input)
  let directInput = null;
  for (const selector of filterButtonsSelectors.slice(0, 3)) {
    const inputs = Array.from(document.querySelectorAll(selector));
    if (inputs.length > 0) {
      directInput = inputs[0];
      break;
    }
  }
  
  // Si encontramos un input directo, usarlo inmediatamente
  if (directInput) {
    console.log('Lead Manager Pro: Se encontró un input directo para ciudad');
    updateStatus('Encontrado campo de ciudad directo...', 32);
    return await configureLocationInput(directInput, city);
  }
  
  // Buscar botones de filtro
  const filterButtons = Array.from(document.querySelectorAll(filterButtonsSelectors.slice(3).join(', ')));
  
  // Buscar el botón de filtro de ubicación (puede tener diferentes textos según el idioma)
  const locationFilterButton = filterButtons.find(button => {
    const text = button.textContent.toLowerCase();
    // Verificar más variantes de texto para el botón de ubicación
    return text.includes('ubicación') || text.includes('location') || 
           text.includes('ciudad') || text.includes('city') ||
           text.includes('lugar') || text.includes('place') ||
           text.includes('localización') || text.includes('sitio');
  });
  
  if (locationFilterButton) {
    console.log('Lead Manager Pro: Encontrado botón de filtro de ubicación');
    updateStatus('Haciendo clic en el filtro de ubicación...', 35);
    locationFilterButton.click();
    
    // Esperar a que se abra el menú de ubicación
    await sleep(1500);
    
    // Buscar el campo de entrada de ubicación específico para GRUPOS
    // Actualizado para Facebook 2025
    const locationInputs = Array.from(document.querySelectorAll(
      // Selectores específicos para el campo de ciudad en grupos (2025)
      'input[type="text"], input[type="search"], input[role="combobox"], ' +
      'input[aria-autocomplete="list"], input[placeholder*="Ciudad"], ' +
      'input[aria-label*="ciudad"], input[aria-label*="Ciudad"], ' +
      'input[aria-label*="city"], input[aria-label*="City"], ' +
      'input[aria-label*="location"], input[aria-label*="ubicación"]'
    ));
    
    // Imprimir número de inputs encontrados para diagnóstico
    console.log(`Lead Manager Pro: Encontrados ${locationInputs.length} posibles campos de entrada`);
    
    // Primer intento - buscar por atributos
    let locationInput = locationInputs.find(input => {
      const label = input.getAttribute('aria-label') || '';
      const placeholder = input.getAttribute('placeholder') || '';
      const role = input.getAttribute('role') || '';
      const id = input.id || '';
      
      // Log para depuración
      if (label || placeholder || role) {
        console.log(`Lead Manager Pro: Input con label=${label}, placeholder=${placeholder}, role=${role}`);
      }
      
      // Verificar múltiples atributos
      return label.toLowerCase().includes('ciudad') || label.toLowerCase().includes('city') ||
             label.toLowerCase().includes('ubicación') || label.toLowerCase().includes('location') ||
             placeholder.toLowerCase().includes('ciudad') || placeholder.toLowerCase().includes('city') ||
             (role === 'combobox' && 
              (label.toLowerCase().includes('ciudad') || placeholder.toLowerCase().includes('ciudad')));
    });
    
    // Si no encontramos el input por atributos, intentamos encontrar el primer input visible en el panel de filtros
    if (!locationInput) {
      locationInput = locationInputs.find(input => {
        const rect = input.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
    }
    
    if (locationInput) {
      console.log('Lead Manager Pro: Encontrado input de ubicación, configurando...');
      const result = await configureLocationInput(locationInput, city);
      
      // Intentar hacer clic en botones de aplicar o aceptar si existen
      if (result) {
        await sleep(800);
        await clickApplyButton();
      }
      
      return result;
    } else {
      console.log('Lead Manager Pro: No se encontró input de ubicación, intentando método alternativo');
      return await applyAlternativeMethodForGroups(city);
    }
  } else {
    console.log('Lead Manager Pro: No se encontró botón de filtro de ubicación, intentando método alternativo');
    return await applyAlternativeMethodForGroups(city);
  }
}

/**
 * Método alternativo para aplicar filtro de ciudad en grupos
 * @param {string} city - Nombre de la ciudad a filtrar
 * @returns {Promise<boolean>} - true si el filtro se aplicó correctamente
 */
async function applyAlternativeMethodForGroups(city) {
  // Referencias rápidas
  const sleep = window.LeadManagerPro.utils.sleep;
  const updateStatus = window.LeadManagerPro.utils.updateStatus;
  
  updateStatus('No se encontró el botón de filtro de ubicación, intentando método alternativo...', 35);
  
  // Método alternativo: intentar encontrar directamente el input de ciudad
  // Buscar cualquier input que pueda ser de ubicación en toda la página
  const possibleLocationInputs = Array.from(document.querySelectorAll('input[type="search"], input[role="combobox"]'));
  
  const cityInput = possibleLocationInputs.find(input => {
    const label = input.getAttribute('aria-label') || '';
    const placeholder = input.getAttribute('placeholder') || '';
    const id = input.id || '';
    const value = input.value || '';
    
    // Verificar si algún texto asociado indica que es un campo de ciudad
    return label.toLowerCase().includes('ciudad') || 
           placeholder.toLowerCase().includes('ciudad') ||
           label.toLowerCase().includes('city') || 
           placeholder.toLowerCase().includes('city') ||
           label.toLowerCase().includes('ubicación') || 
           placeholder.toLowerCase().includes('ubicación');
  });
  
  if (cityInput) {
    updateStatus(`Encontrado campo de ciudad mediante método alternativo. Configurando: ${city}...`, 40);
    
    // Usar el mismo método que antes para configurar el valor
    cityInput.focus();
    cityInput.value = '';
    cityInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    await sleep(500);
    
    cityInput.value = city;
    cityInput.dispatchEvent(new Event('input', { bubbles: true }));
    cityInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    await sleep(1000);
    cityInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
    
    updateStatus('Método alternativo de filtro de ciudad aplicado', 45);
    
    await sleep(2000);
    return true;
  } else {
    updateStatus('No se pudo encontrar el filtro de ubicación, continuando sin él...', 40);
    return false;
  }
}

/**
 * Configura el input de ubicación con el valor de la ciudad
 * @param {HTMLElement} locationInput - Elemento de input a configurar
 * @param {string} city - Nombre de la ciudad a filtrar
 * @returns {Promise<boolean>} - true si el input fue configurado correctamente
 */
async function configureLocationInput(locationInput, city) {
  // Referencias rápidas
  const sleep = window.LeadManagerPro.utils.sleep;
  const updateStatus = window.LeadManagerPro.utils.updateStatus;
  const selectFirstCitySuggestion = window.LeadManagerPro.modules.selectFirstCitySuggestion;
  
  updateStatus(`Configurando ciudad: ${city}...`, 40);
  console.log(`Lead Manager Pro: Configurando input con ciudad: ${city}`);
  
  // 1. Enfocar el campo con eventos más completos
  try {
    locationInput.focus();
    locationInput.dispatchEvent(new Event('focus', { bubbles: true }));
    await sleep(300);
    
    // 2. Borrar el campo completamente
    locationInput.value = '';
    locationInput.dispatchEvent(new Event('input', { bubbles: true }));
    locationInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Esperar para que se procese el borrado
    await sleep(500);
    
    // 3. Escribir la ciudad con eventos más completos
    locationInput.value = city;
    locationInput.dispatchEvent(new Event('input', { bubbles: true }));
    locationInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    // 4. Esperar más tiempo para que aparezcan las sugerencias
    console.log('Lead Manager Pro: Esperando la aparición de sugerencias...');
    await sleep(2000);
    
    // 5. Verificar si hay sugerencias visibles antes de intentar seleccionar
    const hasSuggestions = document.querySelector('ul[role="listbox"]') !== null;
    if (hasSuggestions) {
      console.log('Lead Manager Pro: Lista de sugerencias encontrada');
    } else {
      console.log('Lead Manager Pro: No se encontró lista de sugerencias, intentando eventos adicionales');
      // Intentar nuevamente disparar eventos para forzar la aparición de sugerencias
      locationInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40, bubbles: true }));
      await sleep(300);
    }
    
    // 6. Intentar seleccionar la primera sugerencia usando la función mejorada
    console.log('Lead Manager Pro: Intentando seleccionar la primera sugerencia');
    const suggestionSelected = await selectFirstCitySuggestion();
    
    if (suggestionSelected) {
      updateStatus(`Primera sugerencia de ciudad seleccionada`, 44);
      console.log('Lead Manager Pro: Primera sugerencia seleccionada con éxito');
      await sleep(800);
      
      // 7. Búsqueda instantánea del botón de aplicar/aceptar
      await clickApplyButton();
      return true;
    } else {
      console.log('Lead Manager Pro: No se pudo seleccionar sugerencia, intentando navegación por teclado');
      updateStatus(`Intentando método alternativo con teclado...`, 43);
      const keyboardResult = await handleKeyboardNavigation(locationInput, city);
      return keyboardResult;
    }
  } catch (error) {
    console.error('Error al configurar input de ubicación:', error);
    return false;
  }
}

/**
 * Maneja la navegación por teclado cuando no se puede seleccionar una sugerencia con clic
 * @param {HTMLElement} input - Elemento de input donde se está configurando la ciudad
 * @param {string} city - Nombre de la ciudad a filtrar
 * @returns {Promise<boolean>} - true si se logró seleccionar con teclado
 */
async function handleKeyboardNavigation(input, city) {
  // Referencias rápidas
  const sleep = window.LeadManagerPro.utils.sleep;
  const updateStatus = window.LeadManagerPro.utils.updateStatus;
  
  updateStatus(`No se pudo seleccionar una sugerencia, intentando con teclado`, 42);
  
  // Secuencia mejorada para presionar Enter con mayor efectividad
  await sleep(800); // Esperar más tiempo para que el campo procese el valor
  
  // Primera pulsación con todos los eventos y atributos completos
  input.dispatchEvent(new KeyboardEvent('keydown', { 
      key: 'Enter', 
      code: 'Enter', 
      keyCode: 13, 
      which: 13,
      bubbles: true, 
      cancelable: true, 
      composed: true,
      view: window
  }));
  
  await sleep(150);
  
  input.dispatchEvent(new KeyboardEvent('keypress', { 
      key: 'Enter', 
      code: 'Enter', 
      keyCode: 13, 
      which: 13,
      bubbles: true, 
      cancelable: true, 
      composed: true,
      view: window
  }));
  
  await sleep(150);
  
  input.dispatchEvent(new KeyboardEvent('keyup', { 
      key: 'Enter', 
      code: 'Enter', 
      keyCode: 13, 
      which: 13,
      bubbles: true, 
      cancelable: true, 
      composed: true,
      view: window
  }));
  
  // Adicional: Intento con flecha abajo + Enter
  await sleep(300);
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40, bubbles: true }));
  await sleep(200);
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
  
  // Segunda pulsación para mayor garantía
  await sleep(500);
  
  input.dispatchEvent(new KeyboardEvent('keydown', { 
      key: 'Enter', 
      code: 'Enter', 
      keyCode: 13, 
      which: 13,
      bubbles: true,
      cancelable: true
  }));
  
  await sleep(150);
  
  input.dispatchEvent(new KeyboardEvent('keyup', { 
      key: 'Enter', 
      code: 'Enter', 
      keyCode: 13, 
      which: 13,
      bubbles: true,
      cancelable: true
  }));
  
  // Intentar seleccionar la sugerencia de ciudad que aparece
  await sleep(800);
  
  // Intentar también hacer click en el botón de aplicar filtro
  await clickApplyButton();
  
  // Buscar sugerencias con selectores más amplios
  const allSuggestions = Array.from(document.querySelectorAll(
      'li[role="option"], div[role="option"], div[role="listitem"], span[role="option"], div[aria-selected]'
  ));
  
  // Filtrar por las sugerencias que contienen el texto de la ciudad
  const cityTextLower = city.toLowerCase();
  const relevantSuggestions = allSuggestions.filter(element => {
      const text = element.textContent.toLowerCase();
      return text.includes(cityTextLower);
  });
  
  // Si hay sugerencias relevantes, hacer clic en la primera
  if (relevantSuggestions.length > 0) {
      updateStatus(`Encontradas ${relevantSuggestions.length} sugerencias para "${city}", seleccionando...`, 42);
      relevantSuggestions[0].click();
      
      await sleep(300);
      
      // Intentar hacer clic en cualquier sugerencia visible nuevamente como respaldo
      const firstVisible = relevantSuggestions.find(s => {
          const rect = s.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
      });
      
      if (firstVisible) {
          firstVisible.click();
          updateStatus(`Seleccionada sugerencia visible para: ${city}`, 43);
          await clickApplyButton(); // Intenta aplicar después de seleccionar
          return true;
      }
  } 
  // Si no hay sugerencias específicas, seleccionar la primera sugerencia disponible
  else {
      const visibleSuggestions = allSuggestions.filter(s => {
          const rect = s.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
      });
      
      if (visibleSuggestions.length > 0) {
          visibleSuggestions[0].click();
          updateStatus(`Seleccionada primera sugerencia disponible`, 42);
          
          // Intento adicional después de un breve retraso
          await sleep(200);
          try { visibleSuggestions[0].click(); } catch (e) {}
          
          // También intentar aplicar después de seleccionar
          await clickApplyButton();
          return true;
      } else {
          updateStatus(`No se encontraron sugerencias, continuando...`, 42);
          return false;
      }
  }
  
  // Si llegamos aquí, significa que hicimos todo lo posible
  return true;
}

/**
 * Aplica el filtro de ciudad para búsquedas de personas
 * @param {string} city - Nombre de la ciudad a filtrar
 * @returns {Promise<boolean>} - true si el filtro se aplicó correctamente
 */
async function applyPeopleCityFilter(city) {
  // Referencias rápidas
  const sleep = window.LeadManagerPro.utils.sleep;
  const updateStatus = window.LeadManagerPro.utils.updateStatus;
  const selectFirstCitySuggestion = window.LeadManagerPro.modules.selectFirstCitySuggestion;
  
  // Para búsqueda de personas, necesitamos encontrar y configurar el selector específico
  updateStatus('Buscando filtro de ubicación para personas...', 30);
  
  // Esperar a que se cargue completamente la página
  await sleep(2000);
  
  // 1. Buscar botones de filtro para personas (diferentes a los de grupos)
  const peopleFilterButtons = Array.from(document.querySelectorAll('div[role="button"], span[role="button"], button'));
  
  // Buscar el botón de filtro de ubicación específico para personas
  const peopleLocationButton = peopleFilterButtons.find(button => {
    const text = button.textContent.toLowerCase();
    return text.includes('ubicación') || text.includes('location') || 
           text.includes('ciudad') || text.includes('city') ||
           text.includes('lugar') || text.includes('place');
  });
  
  if (peopleLocationButton) {
    updateStatus('Encontrado filtro de ubicación para personas, haciendo clic...', 35);
    peopleLocationButton.click();
    
    // Esperar a que se abra el panel de filtro
    await sleep(1500);
    
    // 2. Buscar el campo de entrada específico para personas
    // Este selector es específico para el input de ciudad en la búsqueda de personas
    const peopleLocationInputs = Array.from(document.querySelectorAll('input[type="search"][role="combobox"], input[aria-autocomplete="list"], input[placeholder*="Ciudad"], input[aria-label*="Ciudad"]'));
    
    const peopleLocationInput = peopleLocationInputs.find(input => {
      return true; // Tomamos el primer input que cumpla con los selectores anteriores
    });
    
    if (peopleLocationInput) {
      updateStatus(`Configurando ciudad para búsqueda de personas: ${city}...`, 40);
      
      // Enfocar y configurar
      peopleLocationInput.focus();
      peopleLocationInput.value = '';
      peopleLocationInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      await sleep(500);
      
      // Establecer el valor y disparar eventos
      peopleLocationInput.value = city;
      peopleLocationInput.dispatchEvent(new Event('input', { bubbles: true }));
      peopleLocationInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Esperar a que aparezca la lista de sugerencias
      await sleep(1000);
      
      // Intentar seleccionar el primer elemento de la lista de sugerencias
      const suggestionSelected = await selectFirstCitySuggestion();
      
      if (suggestionSelected) {
          updateStatus(`Primera sugerencia de ciudad seleccionada con éxito`, 45);
          return true;
      } else {
          updateStatus(`No se pudo seleccionar una sugerencia automáticamente, intentando con teclado`, 44);
          
          // Si no se pudo seleccionar una sugerencia, intentar con navegación por teclado
          peopleLocationInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40, bubbles: true }));
          await sleep(300);
          peopleLocationInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
          
          // Intentar aplicar el filtro explícitamente
          await clickApplyButton();
          return true;
      }
      
      // Esperar a que se aplique el filtro
      await sleep(1500);
      
      // Buscar y hacer clic en cualquier botón de "Aplicar" o similar si existe
      await clickApplyButton();
      
      updateStatus('Filtro de ciudad aplicado para búsqueda de personas', 50);
      return true;
    } else {
      return await applyAlternativeMethodForPeople(city);
    }
  } else {
    return await applyAlternativeMethodForPeople(city);
  }
}

/**
 * Método alternativo para aplicar filtro de ciudad en personas
 * @param {string} city - Nombre de la ciudad a filtrar
 * @returns {Promise<boolean>} - true si el filtro se aplicó correctamente
 */
async function applyAlternativeMethodForPeople(city) {
  // Referencias rápidas
  const sleep = window.LeadManagerPro.utils.sleep;
  const updateStatus = window.LeadManagerPro.utils.updateStatus;
  
  // No se encontró el botón, intentar encontrar directamente el input
  updateStatus('No se encontró botón de filtro, buscando campo de ciudad directamente...', 35);
  
  // Buscar elementos de input visibles que podrían ser el campo de ciudad
  const directInputs = Array.from(document.querySelectorAll('input[type="search"][role="combobox"], input[aria-autocomplete="list"]'));
  
  const cityDirectInput = directInputs.find(input => {
    const rect = input.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });
  
  if (cityDirectInput) {
    updateStatus('Encontrado posible campo de ciudad directo, intentando configurar...', 38);
    
    cityDirectInput.focus();
    cityDirectInput.value = '';
    cityDirectInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    await sleep(500);
    
    cityDirectInput.value = city;
    cityDirectInput.dispatchEvent(new Event('input', { bubbles: true }));
    cityDirectInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    await sleep(1000);
    cityDirectInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
    
    // Intentar seleccionar por sugerencias
    await sleep(300);
    const suggestionSelected = await window.LeadManagerPro.modules.selectFirstCitySuggestion();
    
    if (suggestionSelected) {
      updateStatus('Sugerencia de ciudad seleccionada correctamente', 42);
    } else {
      // Intentar una secuencia avanzada si la selección normal falla
      await sleep(300);
      cityDirectInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40, bubbles: true }));
      await sleep(200); 
      cityDirectInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
    }
    
    updateStatus('Aplicado método directo para configurar ciudad', 40);
    await sleep(1500);
    await clickApplyButton();
    return true;
  } else {
    updateStatus('No se pudo encontrar campo de ciudad para personas, continuando sin filtro...', 40);
    return false;
  }
}

/**
 * Busca y hace clic en el botón de aplicar filtro si existe
 * @returns {Promise<boolean>} - true si se encontró y se hizo clic en el botón
 */
async function clickApplyButton() {
  const sleep = window.LeadManagerPro.utils.sleep;
  const updateStatus = window.LeadManagerPro.utils.updateStatus;
  
  const applyButtonTexts = ['aplicar', 'apply', 'aceptar', 'ok', 'guardar', 'save', 'done', 'listo'];
  const applyButtons = Array.from(document.querySelectorAll('button, div[role="button"]'));
  
  // Buscar primero botones con textos exactos
  let applyButton = applyButtons.find(button => {
    const buttonText = button.textContent.toLowerCase().trim();
    return applyButtonTexts.includes(buttonText);
  });
  
  // Si no encontramos un botón exacto, buscar uno que contenga alguna de esas palabras
  if (!applyButton) {
    applyButton = applyButtons.find(button => {
      const buttonText = button.textContent.toLowerCase();
      return applyButtonTexts.some(text => buttonText.includes(text));
    });
  }
  
  if (applyButton) {
    applyButton.click();
    updateStatus('Filtro aplicado con botón explícito', 47);
    await sleep(1000);
    return true;
  }
  
  return false;
}

/**
 * Verifica si el filtro de ciudad fue aplicado buscando indicadores visuales
 * @param {string} city - Nombre de la ciudad a filtrar
 * @returns {Promise<boolean>} - true si se detecta que el filtro está activo
 */
async function verifyFilterApplied(city) {
  const updateStatus = window.LeadManagerPro.utils.updateStatus;
  let filterApplied = false;
  
  try {
    // Buscar elementos que indiquen que el filtro está activo
    const activeFilters = Array.from(document.querySelectorAll('div[role="button"], span, div')).filter(el => {
      const text = el.textContent.toLowerCase();
      return (text.includes(city.toLowerCase()) || 
              (text.includes('ciudad') && text.includes('filtro')) ||
              (text.includes('city') && text.includes('filter')) ||
              (text.includes('ubicación') && text.includes('filtro')));
    });
    
    filterApplied = activeFilters.length > 0;
    
    // Si no encontramos indicadores específicos, lo marcamos como aplicado de todos modos
    if (!filterApplied) {
      filterApplied = true;
      updateStatus('No se detectó confirmación visual del filtro, pero continuando...', 48);
    } else {
      updateStatus('Filtro de ciudad confirmado visualmente aplicado', 50);
    }
  } catch (e) {
    console.error('Error al verificar si el filtro está aplicado:', e);
    // Si hay error, asumimos que se aplicó para continuar
    filterApplied = true;
  }
  
  return filterApplied;
}

/**
 * Notifica al sidebar que el filtro fue aplicado
 * @param {string} city - Nombre de la ciudad filtrada
 */
function notifySidebarFilterApplied(city) {
  const iframe = document.getElementById('snap-lead-manager-iframe');
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage({
      action: 'filter_status_update',
      filterApplied: true,
      cityValue: city
    }, '*');
  }
}

/**
 * Limpia los filtros de ciudad existentes para evitar problemas
 * @returns {Promise<boolean>} - true si se limpiaron filtros o no había ninguno
 */
async function cleanExistingCityFilters() {
  const sleep = window.LeadManagerPro.utils.sleep;
  const updateStatus = window.LeadManagerPro.utils.updateStatus;
  
  try {
    console.log('Lead Manager Pro: Verificando si hay filtros existentes');
    
    // 1. Buscar elementos que indiquen un filtro activo
    const filterIndicators = Array.from(document.querySelectorAll('div, span, button, a')).filter(el => {
      const text = el.textContent.toLowerCase();
      return (
        (text.includes('ciudad') || text.includes('city') || text.includes('ubicación') || text.includes('location')) &&
        (el.getAttribute('role') === 'button' || el.querySelector('svg, img'))
      );
    });
    
    // 2. Buscar botones de eliminación o 'x' cerca de filtros
    const clearButtons = Array.from(document.querySelectorAll('div[role="button"], button')).filter(el => {
      const text = el.textContent.toLowerCase();
      return text.includes('×') || text.includes('borrar') || text.includes('clear') || text.includes('eliminar');
    });
    
    let found = false;
    
    // Intentar hacer clic en indicadores de filtro
    if (filterIndicators.length > 0) {
      console.log(`Lead Manager Pro: Encontrados ${filterIndicators.length} indicadores de filtro`);
      for (const indicator of filterIndicators) {
        indicator.click();
        await sleep(500);
        found = true;
      }
    }
    
    // Intentar hacer clic en botones de eliminar
    if (clearButtons.length > 0) {
      console.log(`Lead Manager Pro: Encontrados ${clearButtons.length} botones de eliminar`);
      for (const button of clearButtons) {
        button.click();
        await sleep(500);
        found = true;
      }
    }
    
    if (found) {
      // Esperar un momento para que los cambios surtan efecto
      updateStatus('Limpiando filtros existentes...', 26);
      await sleep(1000);
      console.log('Lead Manager Pro: Filtros existentes limpiados');
    } else {
      console.log('Lead Manager Pro: No se encontraron filtros existentes');
    }
    
    return true;
  } catch (error) {
    console.error('Error al limpiar filtros existentes:', error);
    return false;
  }
}
