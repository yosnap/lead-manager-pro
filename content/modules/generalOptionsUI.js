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
    // Contenedor principal
    const formContainer = document.createElement('div');
    formContainer.style.cssText = `
      padding: 16px;
      border: 1px solid #ddd;
      border-radius: 8px;
      margin: 8px 0;
      background-color: white;
    `;

    // Título
    const title = document.createElement('h3');
    title.textContent = 'Opciones Generales';
    title.style.cssText = `
      margin: 0 0 16px 0;
      color: #333;
      font-size: 16px;
      font-weight: bold;
    `;

    // Obtener opciones actuales
    const currentOptions = this.generalOptions.getAllOptions();

    // Campo para scrolls máximos
    const maxScrollsLabel = document.createElement('label');
    maxScrollsLabel.textContent = 'Scrolls máximos para mostrar resultados:';
    maxScrollsLabel.style.cssText = `
      display: block;
      margin: 8px 0 4px 0;
      font-weight: bold;
      color: #333;
    `;

    const maxScrollsInput = document.createElement('input');
    maxScrollsInput.type = 'number';
    maxScrollsInput.min = '1';
    maxScrollsInput.max = '200';
    maxScrollsInput.value = currentOptions.maxScrollsToShowResults || 50;
    maxScrollsInput.style.cssText = `
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box;
    `;

    const maxScrollsHelp = document.createElement('small');
    maxScrollsHelp.textContent = 'Número máximo de scrolls que realizará la extensión antes de mostrar resultados (por defecto: 50)';
    maxScrollsHelp.style.cssText = `
      display: block;
      color: #666;
      margin: 4px 0 8px 0;
      font-size: 12px;
    `;

    // Campo para tiempo de espera entre scrolls
    const scrollDelayLabel = document.createElement('label');
    scrollDelayLabel.textContent = 'Tiempo de espera entre scrolls (segundos):';
    scrollDelayLabel.style.cssText = `
      display: block;
      margin: 8px 0 4px 0;
      font-weight: bold;
      color: #333;
    `;

    const scrollDelayInput = document.createElement('input');
    scrollDelayInput.type = 'number';
    scrollDelayInput.min = '0.5';
    scrollDelayInput.max = '10';
    scrollDelayInput.step = '0.5';
    scrollDelayInput.value = currentOptions.waitTimeBetweenScrolls || 2;
    scrollDelayInput.style.cssText = `
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box;
    `;

    const scrollDelayHelp = document.createElement('small');
    scrollDelayHelp.textContent = 'Tiempo en segundos que esperará entre cada scroll para no sobrecargar la página (por defecto: 2 segundos)';
      const success = this.generalOptions.saveOptions({
        maxScrollsToShowResults: maxScrolls,
        waitTimeBetweenScrolls: scrollDelay
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
    formContainer.appendChild(title);
    formContainer.appendChild(maxScrollsLabel);
    formContainer.appendChild(maxScrollsInput);
    formContainer.appendChild(maxScrollsHelp);
    formContainer.appendChild(scrollDelayLabel);
    formContainer.appendChild(scrollDelayInput);
    formContainer.appendChild(scrollDelayHelp);
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
