// Módulo dedicado a añadir el historial al panel flotante de interacción (lead-manager-interaction-ui)
// Este archivo es una versión simplificada y corregida

(() => {
  console.log('Iniciando enhancer para el panel flotante de interacción...');
  
  // Función que se ejecutará cuando el DOM esté listo
  function addHistoryToFloatingPanel() {
    // Comprobar si el panel flotante existe
    const floatingPanel = document.querySelector('.lead-manager-interaction-ui');
    if (!floatingPanel) {
      console.log('No se encontró el panel flotante de interacción, esperando...');
      return false; // Señalar que no se encontró el panel
    }
    
    console.log('Panel flotante de interacción encontrado, añadiendo historial...');
    
    // Comprobar si ya existe la sección de historial
    if (floatingPanel.querySelector('#lead-manager-history-container')) {
      console.log('La sección de historial ya existe en el panel flotante');
      return true; // Ya existe, no es necesario añadirlo
    }
    
    // Buscar el lugar donde insertar el historial (antes de la barra de progreso)
    const progressContainer = floatingPanel.querySelector('.lead-manager-interaction-progress-bar')?.parentElement;
    if (!progressContainer) {
      console.warn('No se encontró el contenedor de progreso en el panel flotante');
      return false;
    }
    
    // Obtener la referencia al módulo de historial
    const interactionHistory = window.leadManagerPro?.interactionHistory;
    if (!interactionHistory) {
      console.warn('El módulo de historial no está disponible');
      return false;
    }
    
    // Crear la sección de historial
    const historySection = document.createElement('div');
    historySection.id = 'lead-manager-history-container';
    historySection.className = 'lead-manager-history-section';
    historySection.style.cssText = `
      margin-top: 16px;
      margin-bottom: 16px;
      padding: 12px;
      background-color: #f5f6f7;
      border-radius: 6px;
      border: 1px solid #dddfe2;
    `;
    
    // Extraer el ID del grupo actual de la URL
    const url = window.location.href;
    const groupIdMatch = url.match(/groups\/([^/?]+)/);
    const currentGroupId = groupIdMatch ? groupIdMatch[1] : '';
    
    // Cargar los datos de historial
    interactionHistory.getGroupHistory(currentGroupId).then(groupHistory => {
      // Preparar los datos
      const lastIndex = groupHistory.lastIndex || 0;
      const interactionCount = groupHistory.members ? groupHistory.members.length : 0;
      
      // Construir el contenido HTML
      historySection.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 10px; color: #4267B2;">Historial de Interacciones</div>
        
        <div style="margin-bottom: 12px;">
          <div style="margin-bottom: 6px;"><strong>Último índice:</strong> <span id="lmp-last-index">${lastIndex}</span></div>
          <div><strong>Interacciones en este grupo:</strong> <span id="lmp-group-interactions">${interactionCount}</span></div>
        </div>
        
        <div style="display: flex; align-items: center; margin-bottom: 12px;">
          <input type="checkbox" id="lmp-continue-from-last" checked style="margin-right: 8px;">
          <label for="lmp-continue-from-last">Continuar desde el último índice</label>
        </div>
        
        <button id="lmp-reset-group" style="display: block; width: 100%; padding: 8px; margin-bottom: 8px; background-color: #f0f0f0; border: none; border-radius: 4px; cursor: pointer; color: #333;">
          Reiniciar historial de este grupo
        </button>
        
        <button id="lmp-reset-all" style="display: block; width: 100%; padding: 8px; background-color: #f8d7da; border: none; border-radius: 4px; cursor: pointer; color: #721c24;">
          Reiniciar todo el historial
        </button>
      `;
      
      // Insertar antes de la barra de progreso
      progressContainer.parentNode.insertBefore(historySection, progressContainer);
      
      // Añadir eventos a los botones
      const resetGroupButton = document.getElementById('lmp-reset-group');
      const resetAllButton = document.getElementById('lmp-reset-all');
      
      if (resetGroupButton) {
        resetGroupButton.addEventListener('click', async () => {
          if (confirm('¿Estás seguro de que deseas reiniciar el historial de este grupo? Esta acción no se puede deshacer.')) {
            await interactionHistory.resetGroupHistory(currentGroupId);
            
            // Actualizar UI
            const lastIndexElement = document.getElementById('lmp-last-index');
            const interactionsElement = document.getElementById('lmp-group-interactions');
            
            if (lastIndexElement) lastIndexElement.textContent = '0';
            if (interactionsElement) interactionsElement.textContent = '0';
            
            console.log('Historial del grupo reiniciado');
          }
        });
      }
      
      if (resetAllButton) {
        resetAllButton.addEventListener('click', async () => {
          if (confirm('¿Estás seguro de que deseas reiniciar TODO el historial de interacciones? Esta acción no se puede deshacer y afectará a TODOS los grupos.')) {
            await interactionHistory.resetAllHistory();
            
            // Actualizar UI
            const lastIndexElement = document.getElementById('lmp-last-index');
            const interactionsElement = document.getElementById('lmp-group-interactions');
            
            if (lastIndexElement) lastIndexElement.textContent = '0';
            if (interactionsElement) interactionsElement.textContent = '0';
            
            console.log('Todo el historial de interacciones reiniciado');
          }
        });
      }
      
      console.log('Sección de historial añadida correctamente al panel flotante');
    }).catch(error => {
      console.error('Error al cargar los datos de historial:', error);
    });
    
    return true;
  }
  
  // Función para intentar modificar el método startInteraction
  function modifyStartInteraction() {
    // Verificar que tenemos acceso al objeto de interacción y al historial
    if (!window.leadManagerPro || !window.leadManagerPro.memberInteractionUI || !window.leadManagerPro.interactionHistory) {
      console.warn('No se encontraron los módulos necesarios para modificar startInteraction');
      return false;
    }
    
    const interactionUI = window.leadManagerPro.memberInteractionUI;
    const interactionHistory = window.leadManagerPro.interactionHistory;
    
    // Guardar la implementación original de startInteraction
    const originalStartInteraction = interactionUI.startInteraction;
    
    // Sobrescribir con nuestra versión que usa el historial
    interactionUI.startInteraction = async function() {
      // Establecer el tiempo de inicio
      this.startTime = Date.now();
      
      // Verificar si se debe continuar desde el último índice
      const continueFromLastCheckbox = document.getElementById('lmp-continue-from-last');
      const continueFromLast = continueFromLastCheckbox ? continueFromLastCheckbox.checked : true;
      
      // Obtener el último índice si es necesario
      let startFromIndex = 0;
      if (continueFromLast) {
        try {
          // Extraer el ID del grupo actual
          const url = window.location.href;
          const groupIdMatch = url.match(/groups\/([^/?]+)/);
          const currentGroupId = groupIdMatch ? groupIdMatch[1] : '';
          
          if (currentGroupId) {
            const groupHistory = await interactionHistory.getGroupHistory(currentGroupId);
            startFromIndex = groupHistory.lastIndex || 0;
            console.log(`Continuando desde el índice ${startFromIndex} según historial`);
          }
        } catch (error) {
          console.error('Error al obtener el último índice:', error);
        }
      } else {
        console.log('Iniciando desde el principio (índice 0)');
      }
      
      // Modificar el objeto de interacción para registrar el historial
      if (window.leadManagerPro.memberInteraction) {
        const memberInteraction = window.leadManagerPro.memberInteraction;
        
        // Guardar la función original
        const originalStartInteractionFn = memberInteraction.startInteraction;
        
        // Reemplazar temporalmente
        memberInteraction.startInteraction = async function(callback) {
          // Establecer el índice inicial
          this.currentMemberIndex = startFromIndex;
          
          return await originalStartInteractionFn.call(this, async (progress) => {
            try {
              // Ajustar el índice considerando el desplazamiento
              if (progress.type === 'progress') {
                progress.actualMemberIndex = progress.memberIndex + startFromIndex;
                
                // Registrar interacción exitosa si se envió mensaje
                if (progress.messageSent) {
                  // Extraer el ID del grupo actual
                  const url = window.location.href;
                  const groupIdMatch = url.match(/groups\/([^/?]+)/);
                  const currentGroupId = groupIdMatch ? groupIdMatch[1] : '';
                  
                  if (currentGroupId) {
                    // Obtener el mensaje enviado
                    let messageText = "Mensaje enviado";
                    
                    // Intentar obtener el mensaje real si está disponible
                    if (this.lastSentMessageIndex !== undefined && Array.isArray(this.messages)) {
                      const msgIndex = this.lastSentMessageIndex;
                      if (msgIndex >= 0 && msgIndex < this.messages.length) {
                        messageText = this.messages[msgIndex];
                      }
                    }
                    
                    // Registrar en el historial
                    const memberData = {
                      userId: progress.memberId || `unknown-${Date.now()}`,
                      userName: progress.memberName || 'Usuario',
                      messageText: messageText,
                      index: progress.actualMemberIndex
                    };
                    
                    await interactionHistory.registerInteraction(currentGroupId, memberData);
                    
                    // Actualizar estadísticas en la UI
                    const lastIndexElement = document.getElementById('lmp-last-index');
                    const interactionsElement = document.getElementById('lmp-group-interactions');
                    
                    if (lastIndexElement) {
                      lastIndexElement.textContent = (progress.actualMemberIndex + 1).toString();
                    }
                    
                    if (interactionsElement) {
                      const newCount = parseInt(interactionsElement.textContent || '0') + 1;
                      interactionsElement.textContent = newCount.toString();
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Error al procesar progreso de interacción:', error);
            }
            
            // Llamar al callback original
            if (callback) {
              callback(progress);
            }
          });
        };
      }
      
      // Llamar a la función original
      return await originalStartInteraction.call(this);
    };
    
    console.log('Método startInteraction modificado para usar historial');
    return true;
  }
  
  // Esperar a que el DOM esté listo y los módulos estén cargados
  function initialize() {
    if (document.readyState !== 'loading') {
      // Si el DOM ya está listo, esperar a que los módulos necesarios estén disponibles
      const checkInterval = setInterval(() => {
        if (window.leadManagerPro && window.leadManagerPro.memberInteractionUI) {
          clearInterval(checkInterval);
          
          // Modificar el método startInteraction
          modifyStartInteraction();
          
          // Intentar añadir el historial al panel flotante
          const added = addHistoryToFloatingPanel();
          
          // Si no se pudo añadir inicialmente, configurar un observador para detectar cuando aparezca
          if (!added) {
            // Crear un observador para detectar cuando se agrega el panel flotante
            const observer = new MutationObserver((mutations) => {
              for (const mutation of mutations) {
                if (mutation.addedNodes && mutation.addedNodes.length) {
                  for (const node of mutation.addedNodes) {
                    if (node.classList && node.classList.contains('lead-manager-interaction-ui')) {
                      // Cuando se detecte que se ha añadido el panel flotante, intentar añadir el historial
                      addHistoryToFloatingPanel();
                      break;
                    }
                  }
                }
              }
            });
            
            // Comenzar a observar el body para detectar cambios
            observer.observe(document.body, { childList: true, subtree: true });
            
            // Establecer un intervalo para verificar periódicamente
            const intervalId = setInterval(() => {
              if (addHistoryToFloatingPanel()) {
                clearInterval(intervalId);
              }
            }, 1500);
          }
        }
      }, 500);
    } else {
      // Si el DOM aún no está listo, esperar al evento DOMContentLoaded
      document.addEventListener('DOMContentLoaded', initialize);
    }
  }
  
  // Iniciar el proceso
  initialize();
})();
