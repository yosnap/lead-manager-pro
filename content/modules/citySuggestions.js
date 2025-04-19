/**
 * Módulo para manejar las sugerencias de ciudades
 */

// Namespace para la organización del código
window.LeadManagerPro = window.LeadManagerPro || {};
window.LeadManagerPro.modules = window.LeadManagerPro.modules || {};

/**
 * Selecciona el primer elemento de la lista de sugerencias de ciudades
 * @returns {Promise<boolean>} - true si se seleccionó una sugerencia, false en caso contrario
 */
window.LeadManagerPro.modules.selectFirstCitySuggestion = async function() {
  try {
    // Referencia al método sleep para facilitar el acceso
    const sleep = window.LeadManagerPro.utils.sleep;
    
    // Buscar lista de sugerencias usando selectores específicos para Facebook (2025)
    const suggestionSelectors = [
      // Selectores específicos para Facebook 2025
      'ul[aria-busy="false"][aria-label*="sugeridas"][role="listbox"]',
      'ul[aria-busy="false"][role="listbox"]',
      'ul[role="listbox"]',
      // Selectores adicionales para otros formatos de listas desplegables
      'div[role="listbox"]',
      'div.x1y1aw1k ul',
      // Selectores genéricos
      'ul[aria-labelledby]',
      'ul[aria-controls]',
      // Selectores de último recurso
      'div.xeuugli'
    ];
    
    let suggestionsList = null;
    for (const selector of suggestionSelectors) {
      suggestionsList = document.querySelector(selector);
      if (suggestionsList) break;
    }
    
    if (suggestionsList) {
      console.log('Lead Manager Pro: Se encontró lista de sugerencias');
      
      // Obtener todos los elementos li que son opciones
      const options = suggestionsList.querySelectorAll('li[role="option"]');
      
      if (options && options.length > 0) {
        console.log(`Lead Manager Pro: Se encontraron ${options.length} opciones`);
        
        // Seleccionar el primer elemento (Madrid)
        const firstOption = options[0];
        
        // Obtener el ID para poder identificarlo mejor
        const optionId = firstOption.id;
        console.log(`Lead Manager Pro: ID de la primera opción: ${optionId}`);
        
        // Secuencia de clics más completa
        // 1. Intentar hacer clic directamente en el <li>
        firstOption.click();
        await sleep(300);
        
        // 2. Buscar y hacer clic en todos los elementos anidados que puedan ser clickeables
        const clickableElements = firstOption.querySelectorAll('div[role="presentation"], div.x1i10hfl, div[tabindex="-1"]');
        if (clickableElements.length > 0) {
          console.log(`Lead Manager Pro: Encontrados ${clickableElements.length} elementos clickeables`);
          for (const element of clickableElements) {
            try {
              element.click();
              await sleep(200);
            } catch (e) {
              console.error('Error al hacer clic en elemento:', e);
            }
          }
        }
        
        // 3. Intentar encontrar específicamente el div que contiene el nombre de la ciudad
        const cityNameElements = firstOption.querySelectorAll('span.x1lliihq');
        if (cityNameElements.length > 0) {
          console.log('Lead Manager Pro: Encontrado elemento con el nombre de la ciudad');
          cityNameElements[0].click();
          await sleep(200);
        }
        
        // 4. Si tiene ID, intentar seleccionarlo también por ID
        if (optionId) {
          const elementById = document.getElementById(optionId);
          if (elementById) {
            console.log('Lead Manager Pro: Haciendo clic por ID');
            elementById.click();
            await sleep(200);
          }
        }
        
        // 5. Intento adicional en el div principal
        try {
          firstOption.dispatchEvent(new MouseEvent('mousedown', {bubbles: true}));
          await sleep(100);
          firstOption.dispatchEvent(new MouseEvent('mouseup', {bubbles: true}));
          await sleep(100);
          firstOption.dispatchEvent(new MouseEvent('click', {bubbles: true}));
        } catch (e) {
          console.error('Error al disparar eventos de mouse:', e);
        }
        
        console.log('Lead Manager Pro: Selección de sugerencia completada');
        return true;
      } else {
        console.log('Lead Manager Pro: No se encontraron opciones dentro de la lista');
      }
    }
    
    // Si no encontramos la lista con los selectores específicos, intentar con selectores más generales
    console.log('Lead Manager Pro: Intentando selectores alternativos');
    const fallbackSelectors = [
      // Selectores basados en el HTML proporcionado
      'ul[aria-label*="búsquedas sugeridas"] li',
      'li[aria-selected]',
      'div.x1y1aw1k li',
      'div.x1y1aw1k div[role="presentation"]',
      // Selectores genéricos de respaldo
      'ul[role="listbox"] li[role="option"]',
      'li[role="option"]',
      'div[role="option"]'
    ];
    
    let selectedElement = false;
    for (const selector of fallbackSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements && elements.length > 0) {
        console.log(`Lead Manager Pro: Encontrados ${elements.length} elementos con selector "${selector}"`);
        elements[0].click();
        await sleep(200);
        selectedElement = true;
        break;
      }
    }
    
    if (selectedElement) {
      console.log('Lead Manager Pro: Selección alternativa completada');
      return true;
    }
    
    console.log('Lead Manager Pro: No se pudo seleccionar ninguna sugerencia');
    return false;
  } catch (error) {
    console.error('Error al seleccionar sugerencia de ciudad:', error);
    return false;
  }
};
