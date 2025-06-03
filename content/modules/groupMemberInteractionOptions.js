// Módulo para gestionar las opciones de interacción con miembros de grupos

class GroupMemberInteractionOptions {
  constructor() {
    this.defaultOptions = {
      membersToInteract: 10,
      interactionDelay: 3000, // 3 segundos en milisegundos
      messageToSend: 'Hola, este es un mensaje de prueba.',
      autoCloseChat: true
    };
    
    this.options = this.loadOptions();
  }
  
  // Cargar opciones desde Extension Storage
  loadOptions() {
    try {
      // Intentar cargar desde Extension Storage primero
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['leadManagerGroupMemberInteraction'], (result) => {
          if (result && result.leadManagerGroupMemberInteraction) {
            this.options = { ...this.defaultOptions, ...result.leadManagerGroupMemberInteraction };
            console.log('Opciones de interacción cargadas desde Extension Storage:', this.options);
          }
        });
      }
      
      // Intentar cargar desde localStorage como respaldo
      const savedOptions = localStorage.getItem('snap_lead_manager_member_interaction_options');
      if (savedOptions) {
        const parsedOptions = JSON.parse(savedOptions);
        console.log('Opciones de interacción encontradas en localStorage:', parsedOptions);
        return { ...this.defaultOptions, ...parsedOptions };
      } else {
        console.log('No se encontraron opciones de interacción, guardando opciones por defecto');
        this.saveOptions(this.defaultOptions);
      }
    } catch (error) {
      console.error('Error al cargar las opciones de interacción:', error);
      this.saveOptions(this.defaultOptions);
    }
    
    return { ...this.defaultOptions };
  }
  
  // Guardar opciones
  saveOptions(options) {
    try {
      const newOptions = { ...this.options, ...options };
      this.options = newOptions;
      
      // Guardar en Extension Storage
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({
          'leadManagerGroupMemberInteraction': newOptions
        }, () => {
          console.log('Opciones de interacción guardadas en Extension Storage');
        });
      }
      
      // Guardar en localStorage como respaldo
      localStorage.setItem('snap_lead_manager_member_interaction_options', JSON.stringify(newOptions));
      
      return true;
    } catch (error) {
      console.error('Error al guardar las opciones de interacción:', error);
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
window.leadManagerPro.groupMemberInteractionOptions = new GroupMemberInteractionOptions();
