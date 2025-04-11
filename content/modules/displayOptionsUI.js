// Módulo para la interfaz de usuario de opciones de visualización

class DisplayOptionsUI {
  constructor() {
    this.container = null;
    this.generalOptions = null;
  }

  // Inicializar el módulo
  init() {
    console.log('DisplayOptionsUI: Initializing module');
    
    // Inicializar el módulo de opciones generales
    this.generalOptions = window.leadManagerPro.generalOptions;
    
    return this;
  }

  // Crear el formulario de opciones de visualización
  createOptionsForm() {
    // Crear contenedor para el formulario
    const formContainer = document.createElement('div');
    formContainer.className = 'lead-manager-display-options-form';
    
    // Obtener las opciones actuales
    const options = this.generalOptions.getAllOptions();
    
    // Título de la sección
    const title = document.createElement('div');
    title.textContent = 'Opciones de visualización';
    title.style.fontWeight = 'bold';
    title.style.fontSize = '16px';
    title.style.marginBottom = '12px';
    
    // Campo para maxResultsPerScroll
    const maxResultsLabel = document.createElement('label');
    maxResultsLabel.textContent = 'Resultados máximos a mostrar:';
    maxResultsLabel.style.display = 'block';
    maxResultsLabel.style.marginBottom = '4px';
    maxResultsLabel.style.fontWeight = 'normal';
    
    const maxResultsInput = document.createElement('input');
    maxResultsInput.type = 'number';
    maxResultsInput.min = '10';
    maxResultsInput.value = options.maxResultsPerScroll || 50;
    maxResultsInput.style.width = '100%';
    maxResultsInput.style.padding = '6px';
    maxResultsInput.style.marginBottom = '12px';
    maxResultsInput.style.borderRadius = '4px';
    maxResultsInput.style.border = '1px solid #CED0D4';
    
    // Otras opciones de visualización aquí...
    
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
      const maxResults = parseInt(maxResultsInput.value);
      
      if (isNaN(maxResults) || maxResults < 10) {
        alert('Por favor, ingrese un número válido para Resultados máximos (mínimo 10)');
        return;
      }
      
      // Guardar opción en localStorage para que esté disponible para otros módulos
      try {
        localStorage.setItem('snap_lead_manager_display_options', JSON.stringify({
          maxResultsPerScroll: maxResults
        }));
        
        // También actualizar chrome.storage si es posible
        try {
          chrome.storage.local.set({
            'maxResultsPerScroll': maxResults
          });
        } catch (e) {
          console.warn('Error al guardar en chrome.storage:', e);
        }
        
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
      } catch (error) {
        alert('Error al guardar las opciones. Por favor, intente de nuevo.');
      }
    });
    
    // Ensamblar el formulario
    formContainer.appendChild(title);
    formContainer.appendChild(maxResultsLabel);
    formContainer.appendChild(maxResultsInput);
    formContainer.appendChild(saveButton);
    
    return formContainer;
  }

  // Inyectar formulario de opciones en un contenedor
  injectOptionsForm(container) {
    if (!container) {
      console.error('DisplayOptionsUI: No se proporcionó un contenedor válido');
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
window.leadManagerPro.displayOptionsUI = new DisplayOptionsUI();
