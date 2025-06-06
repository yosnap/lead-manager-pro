/**
 * Módulo para manejar errores y recuperación automática
 */

// Namespace para la organización del código
window.LeadManagerPro = window.LeadManagerPro || {};
window.LeadManagerPro.modules = window.LeadManagerPro.modules || {};

// Asegurarse de que el estado exista
window.LeadManagerPro.state = window.LeadManagerPro.state || {};
// Inicializar el estado de recuperación si no existe
window.LeadManagerPro.state.recoveryState = window.LeadManagerPro.state.recoveryState || {
  recoveryAttempts: 0,
  lastErrorTime: null,
  isInRecoveryMode: false
};

/**
 * Detecta y maneja errores comunes de Facebook
 * @returns {boolean} - true si se detectó un error, false en caso contrario
 */
window.LeadManagerPro.modules.detectAndHandleErrors = function() {
  // Asegurarse de que el estado de recuperación esté inicializado
  if (!window.LeadManagerPro.state.recoveryState) {
    window.LeadManagerPro.state.recoveryState = {
      recoveryAttempts: 0,
      lastErrorTime: null,
      isInRecoveryMode: false
    };
  }
  
  // Referencia rápida al estado de recuperación
  const recoveryState = window.LeadManagerPro.state.recoveryState;
  
  // Detectar errores comunes en la página
  const errorMessages = [
    "Lo sentimos, ha ocurrido un error.",
    "Sorry, something went wrong.",
    "Contenido no disponible",
    "Content not available",
    "Inicia sesión",
    "Log in",
    "You're Temporarily Blocked",
    "Has sido bloqueado temporalmente"
  ];
  
  const pageContent = document.body ? document.body.textContent : '';
  let errorDetected = false;
  
  for (const message of errorMessages) {
    if (pageContent && pageContent.includes(message)) {
      errorDetected = true;
      console.log(`Lead Manager Pro: Error detectado: "${message}"`);
      
      // Registrar el error
      recoveryState.recoveryAttempts++;
      recoveryState.lastErrorTime = new Date();
      recoveryState.isInRecoveryMode = true;
      
      break;
    }
  }
  
  if (errorDetected) {
    // Implementar estrategia de recuperación
    window.LeadManagerPro.modules.handleRecovery();
    return true;
  }
  
  // Si no hay error, resetear el estado de recuperación
  if (recoveryState.isInRecoveryMode) {
    console.log('Lead Manager Pro: No se detectaron errores, saliendo del modo de recuperación');
    recoveryState.isInRecoveryMode = false;
  }
  
  return false;
};

/**
 * Implementa la recuperación de errores
 * @returns {Promise<void>}
 */
window.LeadManagerPro.modules.handleRecovery = async function() {
  // Asegurarse de que el estado y las utilidades estén disponibles
  if (!window.LeadManagerPro.state || !window.LeadManagerPro.utils) {
    console.error('Lead Manager Pro: Estado o utilidades no disponibles para la recuperación');
    return;
  }
  
  // Referencias rápidas
  const recoveryState = window.LeadManagerPro.state.recoveryState;
  const sleep = window.LeadManagerPro.utils.sleep || function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  };
  const updateStatus = window.LeadManagerPro.utils.updateStatus || function(message) {
    console.log(`[LeadManager] ${message}`);
  };
  
  console.log(`Lead Manager Pro: Iniciando recuperación, intento #${recoveryState.recoveryAttempts}`);
  
  // Notificar al usuario
  updateStatus(`Recuperando de error... (Intento #${recoveryState.recoveryAttempts})`, 30);
  
  // Estrategia basada en el número de intentos
  if (recoveryState.recoveryAttempts <= 2) {
    // Para los primeros intentos, simplemente recargar la página
    console.log('Lead Manager Pro: Estrategia de recuperación - Recarga simple');
    // setTimeout(() => {
    //   window.location.reload();
    // }, 3000); // PARA BORRAR: recarga automática
  } 
  else if (recoveryState.recoveryAttempts <= 5) {
    // Para intentos intermedios, esperar más tiempo antes de recargar
    console.log('Lead Manager Pro: Estrategia de recuperación - Espera prolongada');
    updateStatus('Esperando antes de reintentar...', 25);
    
    // Tiempo de espera progresivo (3s, 6s, 9s)
    const waitTime = recoveryState.recoveryAttempts * 3000;
    await sleep(waitTime);
    
    // Recargar después de la espera
    // window.location.reload(); // PARA BORRAR: recarga automática
  }
  else {
    // Para muchos intentos, pausar la búsqueda y notificar al usuario
    console.log('Lead Manager Pro: Demasiados errores, pausando operación');
    updateStatus('Demasiados errores detectados. Operación pausada.', 0);
    
    // Pausar la búsqueda si está en curso
    const searchState = window.LeadManagerPro.state.searchState;
    if (searchState && searchState.isSearching && window.LeadManagerPro.modules.pauseSearch) {
      window.LeadManagerPro.modules.pauseSearch();
    }
    
    // Notificar al sidebar
    const iframe = document.getElementById('snap-lead-manager-iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        action: 'error_recovery_failed',
        message: 'La recuperación automática ha fallado después de múltiples intentos. Posible limitación de Facebook.'
      }, '*');
    }
  }
};

/**
 * Configura la verificación periódica de errores
 */
window.LeadManagerPro.modules.setupErrorDetection = function() {
  // Verificar periódicamente si hay errores en la página
  setInterval(() => {
    window.LeadManagerPro.modules.detectAndHandleErrors();
  }, 10000);
};
