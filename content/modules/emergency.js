/**
 * Módulo de emergencia para recuperar la funcionalidad de la extensión
 * cuando se encuentra un error crítico
 */

console.log('Iniciando módulo de emergencia para Lead Manager Pro');

// Variable para controlar la visibilidad del botón
let emergencyButtonVisible = true;

// Función para mostrar un botón de emergencia
function showEmergencyButton() {
  // Verificar la configuración guardada
  chrome.storage.local.get(['showEmergencyButton'], function(result) {
    // Por defecto, el botón de emergencia está visible a menos que se haya configurado lo contrario
    emergencyButtonVisible = result.showEmergencyButton !== undefined ? result.showEmergencyButton : true;
    
    // Si el botón no debe mostrarse, salimos
    if (!emergencyButtonVisible) {
      console.log('Botón de emergencia desactivado por configuración');
      removeEmergencyButton();
      return;
    }
    
    // Verificar si ya existe
    if (document.getElementById('lmp-emergency-button')) {
      return;
    }
    
    // Crear botón
    const button = document.createElement('div');
    button.id = 'lmp-emergency-button';
    button.textContent = '🔄 LMP';
    button.style.cssText = `
      position: fixed;
      right: 10px;
      bottom: 10px;
      background: #ff5722;
      color: white;
      padding: 10px;
      border-radius: 50%;
      font-weight: bold;
      cursor: pointer;
      z-index: 99999;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    `;
    
    // Agregar evento
    button.addEventListener('click', resetExtension);
    
    // Agregar al DOM
    document.body.appendChild(button);
    console.log('Botón de emergencia agregado');
  });
}

// Función para eliminar el botón de emergencia
function removeEmergencyButton() {
  const button = document.getElementById('lmp-emergency-button');
  if (button) {
    button.remove();
    console.log('Botón de emergencia eliminado');
  }
}

// Función para actualizar la visibilidad del botón de emergencia
function updateEmergencyButtonVisibility(visible) {
  emergencyButtonVisible = visible;
  
  if (visible) {
    showEmergencyButton();
  } else {
    removeEmergencyButton();
  }
}

// Función para restablecer la extensión
function resetExtension() {
  console.log('Restableciendo Lead Manager Pro...');
  
  try {
    // Eliminar elementos DOM existentes
    const elementsToRemove = [
      'snap-lead-manager-searcher',
      'snap-lead-manager-toggle',
      'snap-lead-manager-iframe',
      'lmp-simple-group-ui',
      'lmp-group-search-ui',
      'lmp-emergency-button'
    ];
    
    elementsToRemove.forEach(id => {
      const element = document.getElementById(id);
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
        console.log(`Elemento ${id} eliminado`);
      }
    });
    
    // Mostrar mensaje de éxito
    alert('Lead Manager Pro restablecido. Haz clic en el botón azul para recargar la página.');
    
  } catch (error) {
    console.error('Error al restablecer Lead Manager Pro:', error);
    alert('Error al restablecer Lead Manager Pro. Intenta recargar la página manualmente.');
  }
}

// Auto-iniciar
showEmergencyButton();

// Exportar funciones
window.leadManagerPro = window.leadManagerPro || {};
window.leadManagerPro.emergency = {
  showEmergencyButton,
  removeEmergencyButton,
  updateEmergencyButtonVisibility,
  resetExtension
};

console.log('Módulo de emergencia cargado correctamente');
