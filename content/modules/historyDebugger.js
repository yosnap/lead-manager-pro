// Depurador para la funcionalidad de historial de interacciones (VERSIÓN CORREGIDA)

// Mensaje inicial usando console.log directamente para asegurar que se muestre
console.log('%c 🔍 DEPURADOR DE HISTORIAL INICIALIZADO', 'background: #3498db; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;');

// Función de depuración inmediata
(function() {
  // Estilos para mensajes de consola
  const styles = {
    info: 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;',
    success: 'background: #2ecc71; color: white; padding: 2px 5px; border-radius: 3px;',
    warning: 'background: #f39c12; color: white; padding: 2px 5px; border-radius: 3px;',
    error: 'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;'
  };

  // Funciones de depuración simplificadas
  window.historyDebug = {
    log: (message) => console.log(`%c HISTORIAL 🔍 ${message}`, styles.info),
    success: (message) => console.log(`%c ÉXITO ✅ ${message}`, styles.success),
    warn: (message) => console.log(`%c AVISO ⚠️ ${message}`, styles.warning),
    error: (message) => console.log(`%c ERROR ❌ ${message}`, styles.error)
  };

  // Mensaje de prueba para confirmar que el script se está ejecutando
  window.historyDebug.log('Script de depuración cargado y ejecutándose');
  
  // Observador para el panel de interacción
  function observeInteractionPanel() {
    window.historyDebug.log('Configurando observador para el panel de interacción...');
    
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Comprobar si es el panel de interacción o contiene el panel
              const interactionPanel = node.id === 'lead-manager-interaction-ui' ? 
                node : node.querySelector('#lead-manager-interaction-ui');
              
              if (interactionPanel) {
                window.historyDebug.success('Panel de interacción detectado!');
                
                // Buscar la sección de historial
                setTimeout(() => {
                  const historySection = document.querySelector('#lead-manager-history-container');
                  if (historySection) {
                    window.historyDebug.success('Sección de historial encontrada');
                    examineHistorySection(historySection);
                  } else {
                    window.historyDebug.warn('No se encontró la sección de historial');
                    
                    // Intenta añadir la sección manualmente
                    window.historyDebug.log('Estructura del panel de interacción:');
                    console.log(interactionPanel.innerHTML);
                  }
                }, 500);
              }
            }
          }
        }
      }
    });
    
    // Observar cambios en el cuerpo del documento
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    window.historyDebug.log('Observador configurado');
    
    // Comprobar si el panel ya está visible
    const existingPanel = document.querySelector('#lead-manager-interaction-ui');
    if (existingPanel) {
      window.historyDebug.success('Panel de interacción ya está visible');
      
      // Buscar la sección de historial
      const historySection = document.querySelector('#lead-manager-history-container');
      if (historySection) {
        window.historyDebug.success('Sección de historial encontrada');
        examineHistorySection(historySection);
      } else {
        window.historyDebug.warn('No se encontró la sección de historial');
      }
    }
  }
  
  // Examinar la sección de historial
  function examineHistorySection(section) {
    window.historyDebug.log('Examinando sección de historial...');
    
    // Obtener elementos clave
    const lastIndexElement = section.querySelector('#lmp-last-index');
    const interactionsElement = section.querySelector('#lmp-group-interactions');
    const continueCheckbox = section.querySelector('#lmp-continue-from-last');
    
    if (lastIndexElement) {
      window.historyDebug.log(`Último índice: ${lastIndexElement.textContent}`);
    } else {
      window.historyDebug.warn('No se encontró el elemento del último índice');
    }
    
    if (interactionsElement) {
      window.historyDebug.log(`Interacciones en este grupo: ${interactionsElement.textContent}`);
    } else {
      window.historyDebug.warn('No se encontró el elemento de interacciones');
    }
    
    if (continueCheckbox) {
      window.historyDebug.log(`Continuar desde último índice: ${continueCheckbox.checked ? 'Sí' : 'No'}`);
    } else {
      window.historyDebug.warn('No se encontró el checkbox de continuación');
    }
    
    // Contar botones
    const buttons = section.querySelectorAll('button');
    window.historyDebug.log(`Botones encontrados: ${buttons.length}`);
    
    window.historyDebug.log('Contenido HTML de la sección de historial:');
    console.log(section.innerHTML);
  }
  
  // Monitorear clics en los botones de interacción
  function monitorButtons() {
    window.historyDebug.log('Configurando monitor de botones...');
    
    document.addEventListener('click', (event) => {
      const target = event.target;
      
      // Comprobar si el clic fue en un botón y su texto
      if (target.tagName === 'BUTTON' || target.parentElement.tagName === 'BUTTON') {
        const buttonText = target.textContent || target.parentElement.textContent;
        
        if (buttonText.includes('Iniciar Interacción')) {
          window.historyDebug.log('🚀 Botón "Iniciar Interacción" clickeado');
          
          // Comprobar configuración de historial
          const continueCheckbox = document.querySelector('#lmp-continue-from-last');
          if (continueCheckbox) {
            window.historyDebug.log(`Continuando desde último índice: ${continueCheckbox.checked ? 'Sí' : 'No'}`);
          }
        }
        
        if (buttonText.includes('Guardar')) {
          window.historyDebug.log('💾 Botón de guardar clickeado');
        }
        
        if (buttonText.includes('Reiniciar historial de este grupo')) {
          window.historyDebug.warn('🔄 Reiniciando historial del grupo actual');
        }
        
        if (buttonText.includes('Reiniciar todo el historial')) {
          window.historyDebug.warn('⚠️ Reiniciando todo el historial');
        }
      }
    });
    
    window.historyDebug.log('Monitor de botones configurado');
  }
  
  // Forzar la ejecución inmediata
  window.historyDebug.log('Iniciando funciones de depuración inmediatamente');
  observeInteractionPanel();
  monitorButtons();
  
  // También ejecutar cuando el DOM esté completamente cargado
  window.addEventListener('DOMContentLoaded', () => {
    window.historyDebug.log('DOM completamente cargado');
    observeInteractionPanel();
    monitorButtons();
  });
  
  // Si la página ya está cargada, ejecutar inmediatamente
  if (document.readyState === 'complete') {
    window.historyDebug.log('Página ya cargada, ejecutando inmediatamente');
    observeInteractionPanel();
    monitorButtons();
  }
  
  // Crear un botón especial para probar el depurador
  function createDebugButton() {
    const button = document.createElement('button');
    button.textContent = '🔍 Depurar Historial';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      background-color: #3498db;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 12px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    
    button.addEventListener('click', () => {
      window.historyDebug.log('Botón de depuración clickeado');
      
      // Buscar el panel de interacción
      const panel = document.querySelector('#lead-manager-interaction-ui');
      if (panel) {
        window.historyDebug.success('Panel de interacción encontrado');
        
        // Buscar la sección de historial
        const historySection = document.querySelector('#lead-manager-history-container');
        if (historySection) {
          window.historyDebug.success('Sección de historial encontrada');
          examineHistorySection(historySection);
        } else {
          window.historyDebug.error('No se encontró la sección de historial');
          
          // Mostrar estructura del panel
          window.historyDebug.log('Estructura del panel:');
          console.log(panel.innerHTML);
        }
      } else {
        window.historyDebug.warn('Panel de interacción no encontrado');
      }
    });
    
    document.body.appendChild(button);
    window.historyDebug.log('Botón de depuración añadido a la página');
  }
  
  // Crear el botón de depuración con un retraso para asegurar que el DOM esté listo
  setTimeout(createDebugButton, 2000);
})();

// Mensaje final para confirmar que el script se ha cargado completamente
console.log('%c 🔍 DEPURADOR DE HISTORIAL LISTO', 'background: #2ecc71; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;');
