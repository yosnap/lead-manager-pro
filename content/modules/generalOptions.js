// Módulo para gestionar las opciones generales de la extensión

class GeneralOptions {
  constructor() {
    this.defaultOptions = {
      maxScrolls: 50,
      scrollDelay: 2, // en segundos
      maxScrollsLimit: 50 // valor máximo para mostrar resultados
    };
    
    this.options = this.loadOptions();
  }
  
  // Cargar opciones desde localStorage
  loadOptions() {
    try {
      const savedOptions = localStorage.getItem('snap_lead_manager_general_options');
      if (savedOptions) {
        const parsedOptions = JSON.parse(savedOptions);
        console.log('Opciones encontradas en localStorage:', parsedOptions);
        return { ...this.defaultOptions, ...parsedOptions };
      } else {
        console.log('No se encontraron opciones en localStorage, guardando opciones por defecto');
        // Si no hay opciones guardadas, guardar las opciones por defecto
        this.saveOptions(this.defaultOptions);
      }
    } catch (error) {
      console.error('Error al cargar las opciones generales:', error);
      console.log('Guardando opciones por defecto debido al error');
      // En caso de error, guardar las opciones por defecto
      this.saveOptions(this.defaultOptions);
    }
    
    // Devolver las opciones por defecto
    return { ...this.defaultOptions };
  }
  
  // Guardar opciones en localStorage
  saveOptions(options) {
    try {
      const newOptions = { ...this.options, ...options };
      this.options = newOptions;
      localStorage.setItem('snap_lead_manager_general_options', JSON.stringify(newOptions));
      
      // También guardar en chrome.storage para persistencia
      try {
        chrome.storage.local.set({
          'maxScrolls': newOptions.maxScrolls,
          'scrollDelay': newOptions.scrollDelay,
          'maxScrollsLimit': newOptions.maxScrollsLimit
        }, function() {
          console.log('Opciones generales guardadas en chrome.storage.local');
        });
      } catch (storageError) {
        console.error('Error al guardar opciones generales en chrome.storage:', storageError);
      }
      
      return true;
    } catch (error) {
      console.error('Error al guardar las opciones generales:', error);
      return false;
    }
  }
  
  // Obtener una opción específica
  getOption(key) {
    return this.options[key];
  }
  
  // Establecer una opción específica
  setOption(key, value) {
    const options = { ...this.options };
    options[key] = value;
    return this.saveOptions(options);
  }
  
  // Obtener todas las opciones
  getAllOptions() {
    return { ...this.options };
  }
  
  // Restablecer opciones a los valores por defecto
  resetOptions() {
    this.options = { ...this.defaultOptions };
    return this.saveOptions(this.options);
  }
}

// Exportar la clase
window.leadManagerPro = window.leadManagerPro || {};
window.leadManagerPro.generalOptions = new GeneralOptions();
