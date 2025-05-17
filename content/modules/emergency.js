/**
 * Módulo de emergencia para recuperar la funcionalidad de la extensión
 * cuando se encuentra un error crítico
 */

console.log('Iniciando módulo de emergencia para Lead Manager Pro');

// Función para mostrar un botón de emergencia
function showEmergencyButton() {
  // Verificar si ya existe
  if (document.getElementById('lmp-emergency-button')) {
    return;
  }
  
  // Verificar si el botón de emergencia está habilitado en los ajustes
  chrome.storage.local.get(['lmpSettings'], function(result) {
    const settings = result.lmpSettings || { showEmergencyButton: true };
    
    // Solo mostrar el botón si está habilitado en los ajustes
    if (!settings.showEmergencyButton) {
      console.log('Botón de emergencia deshabilitado en ajustes');
      return;
    }
    
    // Crear botón
    const button = document.createElement('div');
    button.id = 'lmp-emergency-button';
    button.textContent = '🔄 LMP';
    button.style.cssText = `
      position: fixed;
      right: 10px;
      bottom: 70px;
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

// Función para restablecer la extensión
function resetExtension() {
  console.log('Restableciendo Lead Manager Pro...');
  
  try {
    // Limpiar localStorage
    const keysToKeep = [];
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('snap_lead_manager_')) {
        keysToRemove.push(key);
      }
    }
    
    console.log('Limpiando localStorage:', keysToRemove);
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Eliminar elementos DOM existentes
    const elementsToRemove = [
      'snap-lead-manager-container',
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
    
    // Crear botón de toggle nuevo
    const toggleButton = document.createElement('div');
    toggleButton.id = 'snap-lead-manager-toggle';
    toggleButton.innerHTML = '►';
    toggleButton.style.cssText = `
      position: fixed;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      background: #4267B2;
      color: white;
      width: 30px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: 5px 0 0 5px;
      font-size: 18px;
      font-weight: bold;
      box-shadow: -2px 0 5px rgba(0,0,0,0.2);
      z-index: 9999;
      transition: all 0.3s ease;
    `;
    
    // Agregar manejador de clic para reiniciar la extensión
    toggleButton.addEventListener('click', function() {
      // Mostrar mensaje de que estamos recargando
      const messageDiv = document.createElement('div');
      messageDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 20px;
        border-radius: 8px;
        z-index: 99999;
        font-family: Arial, sans-serif;
      `;
      messageDiv.textContent = 'Recargando Lead Manager Pro...';
      document.body.appendChild(messageDiv);
      
      // Recargar la página después de un breve retraso
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    });
    
    // Agregar al DOM
    document.body.appendChild(toggleButton);
    
    // Mostrar mensaje de éxito
    alert('Lead Manager Pro restablecido. Haz clic en el botón azul para recargar la página.');
    
  } catch (error) {
    console.error('Error al restablecer Lead Manager Pro:', error);
    alert('Error al restablecer Lead Manager Pro. Intenta recargar la página manualmente.');
  }
}

// Listener para actualizar la configuración cuando cambie
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'updateSettings') {
    console.log('Actualizando configuración del botón de emergencia:', request.settings);
    
    // Si el botón de emergencia está deshabilitado, eliminarlo si existe
    if (!request.settings.showEmergencyButton) {
      const emergencyButton = document.getElementById('lmp-emergency-button');
      if (emergencyButton) {
        emergencyButton.remove();
        console.log('Botón de emergencia eliminado');
      }
    } else {
      // Si está habilitado y no existe, mostrarlo
      if (!document.getElementById('lmp-emergency-button')) {
        showEmergencyButton();
      }
    }
    
    sendResponse({ success: true });
    return true;
  }
});

// Auto-iniciar
showEmergencyButton();

// Exportar funciones
window.leadManagerProEmergency = {
  reset: resetExtension,
  showButton: showEmergencyButton
};

console.log('Módulo de emergencia cargado correctamente');
