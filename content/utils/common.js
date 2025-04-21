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

// Indicador de que el módulo se cargó correctamente
console.log('LeadManagerPro: Módulo de utilidades comunes cargado correctamente');
