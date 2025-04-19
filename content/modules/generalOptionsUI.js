// Módulo para la interfaz de usuario de opciones generales

class GeneralOptionsUI {
  constructor() {
    this.container = null;
    this.generalOptions = null;
  }

  // Inicializar el módulo
  init() {
    console.log('GeneralOptionsUI: Initializing module');
    
    // Inicializar el módulo de opciones generales
    this.generalOptions = window.leadManagerPro.generalOptions;
    
    return this;
  }

  // Crear el formulario de opciones generales
  createOptionsForm() {
    // Crear contenedor para el formulario
    const formContainer = document.createElement('div');
    formContainer.className = 'lead-manager-options-form';
    
    // Obtener las opciones actuales
    const options = this.generalOptions.getAllOptions();
    
    // Crear campo para maxScrolls
    const maxScrollsLabel = document.createElement('label');
    maxScrollsLabel.textContent = 'Scrolls máximos:';
    maxScrollsLabel.style.display = 'block';
    maxScrollsLabel.style.marginBottom = '4px';
    maxScrollsLabel.style.fontWeight = 'normal';
    
    const maxScrollsInput = document.createElement('input');
    maxScrollsInput.type = 'number';
    maxScrollsInput.min = '1';
    maxScrollsInput.value = options.maxScrolls;
    maxScrollsInput.style.width = '100%';
    maxScrollsInput.style.padding = '6px';
    maxScrollsInput.style.marginBottom = '12px';
    maxScrollsInput.style.borderRadius = '4px';
    maxScrollsInput.style.border = '1px solid #CED0D4';
    
    // Crear campo para maxScrollsLimit
    const maxScrollsLimitLabel = document.createElement('label');
    maxScrollsLimitLabel.textContent = 'Scrolls máximos para mostrar resultados:';
    maxScrollsLimitLabel.style.display = 'block';
    maxScrollsLimitLabel.style.marginBottom = '4px';
    maxScrollsLimitLabel.style.fontWeight = 'normal';
    
    const maxScrollsLimitInput = document.createElement('input');
    maxScrollsLimitInput.type = 'number';
    maxScrollsLimitInput.min = '1';
    maxScrollsLimitInput.value = options.maxScrollsLimit || 50;
    maxScrollsLimitInput.style.width = '100%';
    maxScrollsLimitInput.style.padding = '6px';
    maxScrollsLimitInput.style.marginBottom = '12px';
    maxScrollsLimitInput.style.borderRadius = '4px';
    maxScrollsLimitInput.style.border = '1px solid #CED0D4';
    
    // Crear campo para maxResultsPerScroll
    const maxResultsLabel = document.createElement('label');
    maxResultsLabel.textContent = 'Resultados máximos a mostrar:';
    maxResultsLabel.style.display = 'block';
    maxResultsLabel.style.marginBottom = '4px';
    maxResultsLabel.style.fontWeight = 'normal';
    
    const maxResultsInput = document.createElement('input');
    maxResultsInput.type = 'number';
    maxResultsInput.min = '1';
    maxResultsInput.value = options.maxResultsPerScroll;
    maxResultsInput.style.width = '100%';
    maxResultsInput.style.padding = '6px';
    maxResultsInput.style.marginBottom = '12px';
    maxResultsInput.style.borderRadius = '4px';
    maxResultsInput.style.border = '1px solid #CED0D4';
    
    // Crear campo para scrollDelay
    const scrollDelayLabel = document.createElement('label');
    scrollDelayLabel.textContent = 'Tiempo entre scrolls (segundos):';
    scrollDelayLabel.style.display = 'block';
    scrollDelayLabel.style.marginBottom = '4px';
    scrollDelayLabel.style.fontWeight = 'normal';
    
    const scrollDelayInput = document.createElement('input');
    scrollDelayInput.type = 'number';
    scrollDelayInput.min = '1';
    scrollDelayInput.step = '0.5';
    scrollDelayInput.value = options.scrollDelay;
    scrollDelayInput.style.width = '100%';
    scrollDelayInput.style.padding = '6px';
    scrollDelayInput.style.marginBottom = '12px';
    scrollDelayInput.style.borderRadius = '4px';
    scrollDelayInput.style.border = '1px solid #CED0D4';
    
    // Botón de guardar
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Guardar opciones';
    saveButton.className = 'lead-manager-button';
    saveButton.style.cssText = `
      padding: 8px 16px;
      background-color: #4267B2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      margin-top: 8px;
    `;
    
    // Agregar evento de clic al botón
    saveButton.addEventListener('click', () => {
      // Obtener y validar valores
      const maxScrolls = parseInt(maxScrollsInput.value);
      const maxResults = parseInt(maxResultsInput.value);
      const scrollDelay = parseFloat(scrollDelayInput.value);
      const maxScrollsLimit = parseInt(maxScrollsLimitInput.value);
      
      if (isNaN(maxScrolls) || maxScrolls < 1) {
        alert('Por favor, ingrese un número válido para Scrolls máximos');
        return;
      }
      
      if (isNaN(maxResults) || maxResults < 1) {
        alert('Por favor, ingrese un número válido para Resultados máximos');
        return;
      }
      
      if (isNaN(scrollDelay) || scrollDelay < 0.5) {
        alert('Por favor, ingrese un número válido para Tiempo entre scrolls');
        return;
      }
      
      if (isNaN(maxScrollsLimit) || maxScrollsLimit < 1) {
        alert('Por favor, ingrese un número válido para Scrolls máximos para mostrar resultados');
        return;
      }
      
      // Guardar opciones
      const success = this.generalOptions.saveOptions({
        maxScrolls: maxScrolls,
        maxResultsPerScroll: maxResults,
        scrollDelay: scrollDelay,
        maxScrollsLimit: maxScrollsLimit
      });
      
      if (success) {
        // Mostrar mensaje de éxito
        const successMessage = document.createElement('div');
        successMessage.textContent = '✓ Opciones guardadas correctamente';
        successMessage.style.cssText = `
          color: #00C851;
          margin-top: 8px;
          font-size: 14px;
        `;
        
        formContainer.appendChild(successMessage);
        
        // Eliminar el mensaje después de 3 segundos
        setTimeout(() => {
          if (formContainer.contains(successMessage)) {
            formContainer.removeChild(successMessage);
          }
        }, 3000);
      } else {
        alert('Error al guardar las opciones. Por favor, intente de nuevo.');
      }
    });
    
    // Ensamblar el formulario
    formContainer.appendChild(maxScrollsLabel);
    formContainer.appendChild(maxScrollsInput);
    formContainer.appendChild(maxScrollsLimitLabel);
    formContainer.appendChild(maxScrollsLimitInput);
    formContainer.appendChild(maxResultsLabel);
    formContainer.appendChild(maxResultsInput);
    formContainer.appendChild(scrollDelayLabel);
    formContainer.appendChild(scrollDelayInput);
    formContainer.appendChild(saveButton);
    
    return formContainer;
  }

  // Inyectar formulario de opciones en un contenedor
  injectOptionsForm(container) {
    if (!container) {
      console.error('GeneralOptionsUI: No se proporcionó un contenedor válido');
      return false;
    }
    
    // Limpiar el contenedor
    container.innerHTML = '';
    
    // Crear y agregar el formulario
    const form = this.createOptionsForm();
    container.appendChild(form);
    
    return true;
  }
}

// Exportar la clase
window.leadManagerPro = window.leadManagerPro || {};
window.leadManagerPro.generalOptionsUI = new GeneralOptionsUI();
