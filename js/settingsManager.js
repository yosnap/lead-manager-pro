/**
 * Módulo para gestionar la configuración global del sidebar
 * Permite guardar y cargar la configuración en SessionStorage
 */

// Clave para almacenar la configuración en Extension Storage
const SETTINGS_STORAGE_KEY = 'generalOptions';

// Configuración por defecto
const DEFAULT_SETTINGS = {
  maxScrolls: 4,
  scrollDelay: 2,
  autoSyncEnabled: false
};

/**
 * Guarda la configuración global en Extension Storage
 * @param {Object} settings - Objeto con la configuración a guardar
 */
function saveGlobalSettings(settings) {
  try {
    // Combinar con valores por defecto para asegurar que todos los campos existen
    const settingsToSave = {
      ...DEFAULT_SETTINGS,
      ...settings
    };
    
    // Guardar en Extension Storage
    return new Promise((resolve) => {
      chrome.storage.local.set({ [SETTINGS_STORAGE_KEY]: settingsToSave }, () => {
        // Verificar si se guardaron los datos correctamente
        chrome.storage.local.get([SETTINGS_STORAGE_KEY], (result) => {
          if (result && result[SETTINGS_STORAGE_KEY]) {
            console.log('Configuración global guardada en Extension Storage:', settingsToSave);
            console.log('Configuración global verificada en Extension Storage:', result[SETTINGS_STORAGE_KEY]);
            resolve(true);
          } else {
            console.error('Error al verificar la configuración global guardada');
            resolve(false);
          }
        });
      });
    });
  } catch (error) {
    console.error('Error al guardar la configuración global:', error);
    return Promise.resolve(false);
  }
}

/**
 * Carga la configuración global desde Extension Storage
 * @returns {Promise<Object>} - Promesa que resuelve al objeto con la configuración cargada o valores por defecto
 */
function loadGlobalSettings() {
  return new Promise((resolve) => {
    try {
      // Intentar obtener la configuración de Extension Storage
      chrome.storage.local.get([SETTINGS_STORAGE_KEY], (result) => {
        if (result && result[SETTINGS_STORAGE_KEY]) {
          // Obtener la configuración almacenada
          const settings = result[SETTINGS_STORAGE_KEY];
          console.log('Configuración global cargada desde Extension Storage:', settings);
          
          // Combinar con valores por defecto para asegurar que todos los campos existen
          resolve({
            ...DEFAULT_SETTINGS,
            ...settings
          });
        } else {
          // Si no hay configuración almacenada, devolver valores por defecto
          console.log('No se encontró configuración global en Extension Storage, usando valores por defecto');
          resolve(DEFAULT_SETTINGS);
        }
      });
    } catch (error) {
      console.error('Error al cargar la configuración global:', error);
      resolve(DEFAULT_SETTINGS);
    }
  });
}

/**
 * Inicializa los campos del formulario de configuración con los valores almacenados
 */
async function initializeSettingsForm() {
  try {
    // Cargar la configuración global
    const settings = await loadGlobalSettings();
    
    // Obtener referencias a los elementos del formulario
    const globalMaxScrollsInput = document.getElementById('global-max-scrolls');
    const globalScrollDelayInput = document.getElementById('global-scroll-delay');
    const autoSyncEnabledCheckbox = document.getElementById('auto-sync-enabled');
    
    // Actualizar los valores de los campos
    if (globalMaxScrollsInput) {
      globalMaxScrollsInput.value = settings.maxScrolls;
    }
    
    if (globalScrollDelayInput) {
      globalScrollDelayInput.value = settings.scrollDelay;
    }
    
    if (autoSyncEnabledCheckbox) {
      autoSyncEnabledCheckbox.checked = settings.autoSyncEnabled;
    }
    
    console.log('Formulario de configuración inicializado con valores almacenados');
  } catch (error) {
    console.error('Error al inicializar el formulario de configuración:', error);
  }
}

/**
 * Guarda la configuración del formulario en Extension Storage
 */
async function saveSettingsFromForm() {
  try {
    // Obtener referencias a los elementos del formulario
    const globalMaxScrollsInput = document.getElementById('global-max-scrolls');
    const globalScrollDelayInput = document.getElementById('global-scroll-delay');
    const autoSyncEnabledCheckbox = document.getElementById('auto-sync-enabled');
    
    // Crear objeto con la configuración actual
    const settings = {
      maxScrolls: globalMaxScrollsInput ? parseInt(globalMaxScrollsInput.value, 10) : DEFAULT_SETTINGS.maxScrolls,
      scrollDelay: globalScrollDelayInput ? parseFloat(globalScrollDelayInput.value) : DEFAULT_SETTINGS.scrollDelay,
      autoSyncEnabled: autoSyncEnabledCheckbox ? autoSyncEnabledCheckbox.checked : DEFAULT_SETTINGS.autoSyncEnabled
    };
    
    // Validar valores
    if (isNaN(settings.maxScrolls) || settings.maxScrolls < 1) {
      alert('Por favor, introduce un número válido de scrolls máximos (mínimo 1)');
      return false;
    }
    
    if (isNaN(settings.scrollDelay) || settings.scrollDelay < 0.5) {
      alert('Por favor, introduce un tiempo válido entre scrolls (mínimo 0.5 segundos)');
      return false;
    }
    
    // Guardar la configuración
    const saved = await saveGlobalSettings(settings);
    
    if (saved) {
      // Mostrar mensaje de éxito
      showTemporaryMessage('Configuración guardada correctamente');
    } else {
      // Mostrar mensaje de error
      showTemporaryMessage('Error al guardar la configuración', true);
    }
    
    return saved;
  } catch (error) {
    console.error('Error al guardar la configuración desde el formulario:', error);
    showTemporaryMessage('Error al guardar la configuración', true);
    return false;
  }
}

/**
 * Muestra un mensaje temporal en la interfaz
 * @param {string} message - Mensaje a mostrar
 * @param {boolean} isError - Indica si es un mensaje de error
 */
function showTemporaryMessage(message, isError = false) {
  try {
    // Intentar mostrar el mensaje en el elemento de estado de configuración global
    const globalStatusElement = document.getElementById('global-settings-status');
    
    if (globalStatusElement) {
      // Mostrar el mensaje en el elemento de estado de configuración global
      globalStatusElement.textContent = message;
      globalStatusElement.className = isError ? 'status error' : 'status success';
      
      // Limpiar el mensaje después de 3 segundos
      setTimeout(() => {
        globalStatusElement.textContent = '';
        globalStatusElement.className = 'status';
      }, 3000);
      
      console.log(`Mensaje mostrado en elemento de estado global: ${message}`);
      return;
    }
    
    // Intentar mostrar el mensaje en el elemento de estado general
    const statusElement = document.getElementById('status-message');
    
    if (statusElement) {
      const originalMessage = statusElement.textContent;
      const originalClass = statusElement.className;
      
      statusElement.textContent = message;
      statusElement.className = isError ? 'status error' : 'status success';
      
      // Restaurar mensaje original después de 3 segundos
      setTimeout(() => {
        statusElement.textContent = originalMessage;
        statusElement.className = originalClass;
      }, 3000);
      
      console.log(`Mensaje mostrado en elemento de estado general: ${message}`);
    } else {
      // Si no hay elemento de estado, mostrar un alert
      alert(message);
      console.log(`Mensaje mostrado en alert: ${message}`);
    }
  } catch (error) {
    console.error('Error al mostrar mensaje temporal:', error);
    alert(message);
  }
}

/**
 * Inicializa los eventos para el formulario de configuración
 */
function initializeSettingsEvents() {
  try {
    // Obtener referencia al botón de guardar configuración
    const saveGlobalConfigButton = document.getElementById('save-global-config');
    
    if (saveGlobalConfigButton) {
      // Añadir evento de clic al botón
      saveGlobalConfigButton.addEventListener('click', saveSettingsFromForm);
      console.log('Eventos de configuración inicializados');
    }
  } catch (error) {
    console.error('Error al inicializar eventos de configuración:', error);
  }
}

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
  console.log('Inicializando gestor de configuración...');
  
  // Inicializar formulario con valores almacenados
  initializeSettingsForm();
  
  // Inicializar eventos
  initializeSettingsEvents();
});