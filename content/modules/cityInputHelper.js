/**
 * Módulo de apoyo para interactuar directamente con el campo de entrada de ciudad
 * Este módulo contiene funciones específicas para simular interacciones reales 
 * de usuario con el campo de ciudad y solucionar el problema de filtrado.
 */

// Namespace para la organización del código
window.LeadManagerPro = window.LeadManagerPro || {};
window.LeadManagerPro.modules = window.LeadManagerPro.modules || {};

/**
 * Función mejorada para interactuar con el campo de ciudad de manera más realista
 * @param {string} cityName - El nombre de la ciudad a buscar
 * @returns {Promise<boolean>} - true si la operación fue exitosa
 */
window.LeadManagerPro.modules.simulateCityInput = async function(cityName) {
  try {
    // Referencias para usar funciones de utilidad
    const sleep = window.LeadManagerPro.utils.sleep;
    const updateStatus = window.LeadManagerPro.utils.updateStatus;
    
    console.log(`CityInputHelper: Iniciando simulación de entrada para ciudad "${cityName}"`);
    updateStatus(`Intentando método directo para ciudad: ${cityName}...`, 32);
    
    // 1. Encontrar TODOS los posibles campos de ciudad
    const allPossibleInputs = Array.from(document.querySelectorAll(
      // Específicos de Facebook
      'input[placeholder*="Ciudad"], input[placeholder*="ciudad"], ' +
      'input[aria-label*="Ciudad"], input[aria-label*="ciudad"], ' + 
      'input[aria-label*="ubicación"], input[aria-label*="Ubicación"], ' +
      // Genéricos por rol
      'input[role="combobox"], input[aria-autocomplete="list"], ' +
      // Por tipo
      'input[type="search"], input[type="text"]'
    ));
    
    console.log(`CityInputHelper: Encontrados ${allPossibleInputs.length} posibles campos de entrada`);
    
    // Filtrar solo los que parecen ser campos de ciudad basados en atributos
    const cityInputs = allPossibleInputs.filter(input => {
      const placeholder = (input.placeholder || '').toLowerCase();
      const ariaLabel = (input.getAttribute('aria-label') || '').toLowerCase();
      const classes = input.className || '';
      
      // Detectar si es un campo de ciudad por sus atributos
      return (
        placeholder.includes('ciudad') || placeholder.includes('city') || 
        placeholder.includes('ubicación') || placeholder.includes('location') ||
        ariaLabel.includes('ciudad') || ariaLabel.includes('city') ||
        ariaLabel.includes('ubicación') || ariaLabel.includes('location')
      );
    });
    
    // Si encontramos campos específicos de ciudad, trabajamos con ellos
    // Si no, trabajamos con todos los posibles campos encontrados
    const inputsToTry = cityInputs.length > 0 ? cityInputs : allPossibleInputs;
    
    // 2. Para cada campo encontrado, intentaremos la interacción
    let success = false;
    
    for (let i = 0; i < inputsToTry.length; i++) {
      const input = inputsToTry[i];
      updateStatus(`Probando campo ${i+1}/${inputsToTry.length}...`, 35);
      
      // Solo intentar con inputs visibles
      const rect = input.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        console.log(`CityInputHelper: Campo ${i+1} no es visible, omitiendo`);
        continue;
      }
      
      console.log(`CityInputHelper: Probando con campo ${i+1}:`, {
        placeholder: input.placeholder,
        ariaLabel: input.getAttribute('aria-label'),
        type: input.type,
        id: input.id,
        classes: input.className
      });
      
      // Realizar una secuencia completa y realista de interacción
      try {
        // a. Hacer scroll hacia el elemento para asegurar que está visible
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await sleep(500);
        
        // b. Hacer clic en el campo
        input.click();
        await sleep(300);
        
        // c. Enfocar el campo
        input.focus();
        input.dispatchEvent(new Event('focus', {bubbles: true}));
        await sleep(300);
        
        // d. Limpiar el campo actual
        const currentValue = input.value;
        if (currentValue) {
          // Seleccionar todo el texto
          input.select();
          await sleep(200);
          
          // Simular presionar la tecla Delete/Backspace
          input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Delete', bubbles: true}));
          await sleep(100);
          
          // Limpiar valor directamente
          input.value = '';
          input.dispatchEvent(new Event('input', {bubbles: true}));
          input.dispatchEvent(new Event('change', {bubbles: true}));
          await sleep(300);
        }
        
        // e. Escribir el nombre de la ciudad caracter por caracter (simulación realista)
        for (let j = 0; j < cityName.length; j++) {
          const char = cityName.charAt(j);
          
          // Agregar el caracter actual al valor
          input.value = cityName.substring(0, j+1);
          
          // Disparar eventos para cada caracter (extremadamente realista)
          input.dispatchEvent(new KeyboardEvent('keydown', {key: char, bubbles: true}));
          await sleep(50);
          input.dispatchEvent(new KeyboardEvent('keypress', {key: char, bubbles: true}));
          await sleep(20);
          input.dispatchEvent(new Event('input', {bubbles: true}));
          await sleep(30);
          input.dispatchEvent(new KeyboardEvent('keyup', {key: char, bubbles: true}));
          
          // Pause aleatoria entre caracteres para simular entrada humana
          await sleep(50 + Math.random() * 150);
        }
        
        // Emitir un evento especial de entrada completada
        console.log(`CityInputHelper: Escritura de "${cityName}" completada`);
        
        // Esperar más tiempo para que se carguen las sugerencias
        await sleep(1000);
        
        // f. Intentar seleccionar una sugerencia con el módulo existente
        const suggestionSelected = await window.LeadManagerPro.modules.selectFirstCitySuggestion();
        
        if (suggestionSelected) {
          console.log(`CityInputHelper: Sugerencia seleccionada exitosamente con el campo ${i+1}`);
          updateStatus(`Ciudad configurada exitosamente`, 45);
          success = true;
          break;
        }
        
        // g. Si no se pudo seleccionar una sugerencia, simular presionar Enter
        console.log(`CityInputHelper: No se pudo seleccionar sugerencia, intentando con Enter`);
        
        // Presionar Flecha Abajo para seleccionar la primera sugerencia
        input.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', code: 'ArrowDown', keyCode: 40, bubbles: true}));
        await sleep(500);
        
        // Presionar Enter para confirmar
        input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true}));
        await sleep(100);
        input.dispatchEvent(new KeyboardEvent('keypress', {key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true}));
        await sleep(100);
        input.dispatchEvent(new KeyboardEvent('keyup', {key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true}));
        
        // Esperar para ver si se aplica
        await sleep(1000);
        
        // h. Buscar y hacer clic en botones de "Aplicar" o "Aceptar"
        await clickApplyButton();
        
        // Marcar como éxito probable
        success = true;
        updateStatus(`Ciudad aplicada mediante método Enter`, 45);
        break;
        
      } catch (error) {
        console.error(`CityInputHelper: Error al interactuar con el campo ${i+1}:`, error);
        // Continuar con el siguiente campo
      }
    }
    
    // 3. Si no tuvimos éxito con ningún campo, intentar método de último recurso
    if (!success && inputsToTry.length > 0) {
      console.log(`CityInputHelper: Intentando método de último recurso`);
      updateStatus(`Intentando método de último recurso...`, 40);
      
      // Intentar con cualquier input visible
      const visibleInputs = inputsToTry.filter(input => {
        const rect = input.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      
      if (visibleInputs.length > 0) {
        const input = visibleInputs[0];
        
        // Método más directo y bruto
        input.value = cityName;
        input.dispatchEvent(new Event('input', {bubbles: true}));
        input.dispatchEvent(new Event('change', {bubbles: true}));
        
        await sleep(1000);
        
        // Simular Enter para confirmar
        input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true}));
        
        await sleep(500);
        
        // Intentar también hacer clic en botones de confirmar
        await clickApplyButton();
        
        success = true;
        updateStatus(`Ciudad aplicada con método de último recurso`, 45);
      }
    }
    
    return success;
  } catch (error) {
    console.error('CityInputHelper: Error general:', error);
    return false;
  }
};

/**
 * Busca y hace clic en botones de Aplicar/Aceptar
 * @returns {Promise<boolean>} - true si se encontró y se pulsó un botón
 */
async function clickApplyButton() {
  const sleep = window.LeadManagerPro.utils.sleep;
  
  try {
    // Textos que pueden indicar botones de aplicar/aceptar
    const applyTexts = ['aplicar', 'aceptar', 'confirmar', 'guardar', 'ok', 'apply', 'save', 'confirm', 'done'];
    
    // Buscar botones con esos textos
    const allButtons = Array.from(document.querySelectorAll('button, div[role="button"], span[role="button"]'));
    
    // Filtrar por texto y visibilidad
    const applyButtons = allButtons.filter(button => {
      const text = button.textContent.toLowerCase().trim();
      const rect = button.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0;
      
      return isVisible && applyTexts.some(applyText => 
        text === applyText || text.includes(applyText)
      );
    });
    
    if (applyButtons.length > 0) {
      console.log(`CityInputHelper: Encontrados ${applyButtons.length} botones de aplicar/aceptar`);
      
      // Hacer clic en cada uno de ellos
      let clicked = false;
      for (const button of applyButtons) {
        try {
          button.click();
          await sleep(300);
          clicked = true;
        } catch (e) {
          console.error('Error al hacer clic en botón de aplicar:', e);
        }
      }
      
      return clicked;
    }
    
    return false;
  } catch (error) {
    console.error('Error en clickApplyButton:', error);
    return false;
  }
}
