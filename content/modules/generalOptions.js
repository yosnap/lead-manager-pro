// Módulo para gestionar las opciones generales de la extensión

class GeneralOptions {
  constructor() {
    this.defaultOptions = {
      maxScrolls: 50,
      scrollDelay: 2, // en segundos
      maxScrollsToShowResults: 50, // Máximo de scrolls para mostrar resultados (por defecto 50)
      waitTimeBetweenScrolls: 2, // Tiempo de espera entre scrolls (por defecto 2 segundos)
    };
    this.options = { ...this.defaultOptions };
    this.loadOptions();
  }
  
  // Cargar opciones desde chrome.storage.sync
  loadOptions() {
    chrome.storage.sync.get(['peopleSearchSettings'], (result) => {
      if (result && result.peopleSearchSettings) {
        this.options = { ...this.defaultOptions, ...result.peopleSearchSettings };
        console.log('Opciones generales cargadas de chrome.storage.sync:', this.options);
      } else {
        this.saveOptions(this.defaultOptions);
        console.log('No se encontraron opciones en chrome.storage.sync, guardando opciones por defecto');
    }
    });
  }
  
  // Guardar opciones en chrome.storage.sync
  saveOptions(options) {
      const newOptions = { ...this.options, ...options };
      this.options = newOptions;
    chrome.storage.sync.set({ peopleSearchSettings: newOptions }, () => {
      console.log('Opciones generales guardadas en chrome.storage.sync:', newOptions);
    });
      return true;
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
