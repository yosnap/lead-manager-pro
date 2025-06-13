/**
 * Utilidades comunes para la extensión
 */

// Namespace para evitar conflictos
window.LeadManagerPro = window.LeadManagerPro || {};
window.LeadManagerPro.utils = window.LeadManagerPro.utils || {};

/**
 * Función para esperar un tiempo determinado
 * @param {number} ms - Milisegundos a esperar
 * @returns {Promise} - Promesa que se resuelve después del tiempo especificado
 */
window.LeadManagerPro.utils.sleep = function(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Actualiza el estado de la operación en la interfaz
 * @param {string} message - Mensaje de estado a mostrar
 * @param {number} progress - Porcentaje de progreso (0-100)
 */
window.LeadManagerPro.utils.updateStatus = function(message, progress) {
  // Log para depuración
  console.log(`[LeadManager] ${message} (${progress}%)`);
  
  try {
    // Método 1: Usar un evento personalizado para comunicación interna
    // Esto permite que el módulo sidebar.js escuche estos eventos
    const statusEvent = new CustomEvent('LEAD_MANAGER_STATUS_UPDATE', {
      detail: {
        message: message,
        progress: progress
      },
      bubbles: true
    });
    document.dispatchEvent(statusEvent);
    
    // Método 2: Usar comunicación directa con window.postMessage
    // Este método es más seguro y directo, pero evitamos acceder a iframe.contentDocument
    const iframe = document.getElementById('snap-lead-manager-iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        action: 'status_update',
        status: message,
        progress: progress
      }, '*');
    }
  } catch (error) {
    console.error('Error al actualizar estado:', error);
  }
};

/**
 * Función de utilidad para registro y depuración
 * @param {string} message - Mensaje a registrar
 * @param {any} data - Datos adicionales para registro (opcional)
 */
window.LeadManagerPro.utils.log = function(message, data) {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[LeadManager ${timestamp}] ${message}`, data);
  } else {
    console.log(`[LeadManager ${timestamp}] ${message}`);
  }
};

/**
 * Migra automáticamente los datos relevantes de localStorage a chrome.storage.local y limpia localStorage
 */
window.LeadManagerPro.utils.migrateLocalStorageToExtensionStorage = async function() {
  // Lista de claves relevantes a migrar
  const keysToMigrate = [
    'snap_lead_manager_saved_criteria',
    'snap_lead_manager_general_options',
    'snap_lead_manager_group_options',
    'snap_lead_manager_search_data',
    'snap_lead_manager_search_results',
    'snap_lead_manager_city_filter_applied',
    'snap_lead_manager_search_active',
    'snap_lead_manager_search_url',
    'snap_lead_manager_search_type',
    'snap_lead_manager_force_reload',
    'snap_lead_manager_results_pending',
    'foundGroups',
    'lmp_group_search_options',
    'snap_lead_manager_member_interaction_options',
    // Agrega aquí cualquier otra clave relevante
  ];

  const dataToMigrate = {};
  // Recopilar datos existentes en localStorage
  keysToMigrate.forEach(key => {
    const value = localStorage.getItem(key);
    if (value !== null) {
      try {
        // Intenta parsear como JSON, si falla guarda como string
        dataToMigrate[key] = JSON.parse(value);
      } catch (e) {
        dataToMigrate[key] = value;
      }
    }
  });

  // Guardar en chrome.storage.local si hay datos
  if (Object.keys(dataToMigrate).length > 0 && typeof chrome !== 'undefined' && chrome.storage) {
    await new Promise(resolve => {
      chrome.storage.local.set(dataToMigrate, () => {
        // Limpiar las claves migradas de localStorage
        keysToMigrate.forEach(key => localStorage.removeItem(key));
        // Log para depuración
        console.log('LeadManagerPro: Migración de localStorage a chrome.storage.local completada:', Object.keys(dataToMigrate));
        resolve();
      });
    });
  }
};

// Ejecutar la migración automáticamente al cargar el módulo
window.LeadManagerPro.utils.migrateLocalStorageToExtensionStorage();

// Indicador de que el módulo se cargó correctamente
console.log('LeadManagerPro: Módulo de utilidades comunes cargado correctamente');
