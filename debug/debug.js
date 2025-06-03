/**
 * Script de depuración para Lead Manager Pro v0.5.0
 * Versión compatible con CSP
 */

// Esta versión no intenta inyectar scripts
console.log('Lead Manager Pro - Debug: Inicializando...');

// Función para mostrar el estado actual de las funciones
function displayDebugInfo() {
  console.group('Lead Manager Pro - Estado de depuración');
  
  console.log('Objeto de depuración:', window._debug_leadManagerPro ? 'Disponible ✅' : 'No disponible ❌');
  
  if (window._debug_leadManagerPro) {
    const functionNames = Object.keys(window._debug_leadManagerPro);
    console.log('Funciones disponibles:', functionNames.join(', '));
    
    // Verificar cada función principal
    const functions = [
      'applyCityFilter', 
      'findProfiles', 
      'selectFirstCitySuggestion', 
      'sleep', 
      'updateStatus'
    ];
    
    const functionStatus = functions.map(name => ({
      name,
      exists: typeof window._debug_leadManagerPro[name] === 'function' ? '✅' : '❌'
    }));
    
    console.table(functionStatus);
  }
  
  console.groupEnd();
}

// Verificar después de un tiempo para dar oportunidad a que se cargue el script principal
setTimeout(() => {
  console.log('Lead Manager Pro - Verificando estado (3s):');
  displayDebugInfo();
}, 3000);

// Verificar de nuevo después de más tiempo
setTimeout(() => {
  console.log('Lead Manager Pro - Verificando estado (6s):');
  displayDebugInfo();
}, 6000);

// Exponer función global para facilitar el debug manual
window.checkLeadManagerStatus = function() {
  console.log('Lead Manager Pro - Verificación manual:');
  displayDebugInfo();
  
  return {
    functions: window._debug_leadManagerPro || {},
    status: window._debug_leadManagerPro ? 'disponible' : 'no disponible'
  };
};

// Intentar acceder a chrome.storage para verificar permisos
try {
  chrome.storage.local.get(['snap_lead_manager_city_filter_applied', 'snap_lead_manager_search_data'], function(result) {
    console.log('Lead Manager Pro - Estado del almacenamiento:', result);
  });
} catch (error) {
  console.log('Lead Manager Pro - Error al acceder al almacenamiento:', error.message);
}

console.log('Lead Manager Pro - Debug: Script de depuración cargado');
