// Módulo para corregir el estado del botón de interacción al finalizar

window.addEventListener('DOMContentLoaded', () => {
  // Esperar a que se inicialice el módulo de interacción con miembros
  const waitForInitialization = setInterval(() => {
    if (window.leadManagerPro && window.leadManagerPro.memberInteraction) {
      clearInterval(waitForInitialization);
      
      console.log('Configurando observador de estado de interacción...');
      
      // Obtener la instancia del módulo de interacción
      const memberInteraction = window.leadManagerPro.memberInteraction;
      
      // Configurar un observador para detectar cambios en isInteracting
      let lastInteractingState = memberInteraction.isInteracting || false;
      
      // Crear un intervalo que verifique el estado de isInteracting cada 500ms
      const stateObserver = setInterval(() => {
        const currentState = memberInteraction.isInteracting || false;
        
        // Si el estado cambió de true a false, significa que la interacción terminó
        if (lastInteractingState === true && currentState === false) {
          console.log('La interacción ha finalizado, actualizando botón...');
          
          // Buscar el botón de iniciar/detener interacción en todos los sidebars visibles
          const sidebars = document.querySelectorAll('.lead-manager-member-interaction-sidebar');
          sidebars.forEach(sidebar => {
            if (sidebar.style.transform === 'translateX(0px)' || sidebar.style.transform === 'translateX(0%)') {
              const startButton = sidebar.querySelector('button:last-child');
              if (startButton) {
                startButton.textContent = 'Iniciar Interacción';
                startButton.style.backgroundColor = '#1877f2';
                startButton.disabled = false;
              }
            }
          });
          
          // Comprobar si existe una instancia de sidebar en el objeto global
          if (window.leadManagerPro.memberInteractionSidebar) {
            window.leadManagerPro.memberInteractionSidebar.interactionInProgress = false;
          }
        }
        
        // Actualizar el estado anterior
        lastInteractingState = currentState;
      }, 500);
      
      // Guardar una referencia al intervalo para poder detenerlo si es necesario
      window.leadManagerPro.stateObserver = stateObserver;
      
      console.log('Observador de estado de interacción configurado');
    }
  }, 1000);
});