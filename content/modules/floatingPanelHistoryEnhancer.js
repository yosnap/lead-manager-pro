// Módulo dedicado a añadir el historial al panel flotante con clase lead-manager-interaction-ui
// Este archivo es una solución específica para agregar funcionalidad de historial

(() => {
  // Esperar a que el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  function init() {
    console.log('Iniciando el enhancer para el panel flotante lead-manager-interaction-ui...');
    
    // Esperar a que los módulos principales estén disponibles
    const waitForModules = setInterval(() => {
      if (window.leadManagerPro && 
          window.leadManagerPro.memberInteractionUI && 
          window.leadManagerPro.interactionHistory) {
        
        clearInterval(waitForModules);
        console.log('Módulos de interacción y historial detectados, aplicando mejoras...');
        
        // Referencia a los módulos
        const interactionUI = window.leadManagerPro.memberInteractionUI;
        const interactionHistory = window.leadManagerPro.interactionHistory;
        
        // Función para obtener el ID del grupo actual
        function extractGroupIdFromUrl() {
          const url = window.location.href;
          const match = url.match(/groups\/([^/?]+)/);
          return match ? match[1] : 'unknown';
        }
        
        // Función para inyectar el historial en el panel flotante
        function injectHistoryToFloatingPanel() {
          // Buscar el panel flotante
          const floatingPanel = document.querySelector('.lead-manager-interaction-ui');
          if (!floatingPanel) {
            console.log('No se encontró el panel flotante, esperando...');
            return false;
          }
          
          // Verificar si ya existe la sección de historial
          if (floatingPanel.querySelector('#lead-manager-history-container')) {
            console.log('El historial ya existe en el panel flotante');
            return true;
          }
          
          console.log('Agregando sección de historial al panel flotante...');
          
          // Buscar el lugar donde insertar el historial (antes de la barra de progreso)
          const progressSection = floatingPanel.querySelector('.lead-manager-interaction-progress-bar')?.parentElement;
          if (!progressSection) {
            console.warn('No se pudo encontrar la sección de progreso');
            return false;
          }
          
          // Crear la sección de historial
          const historySection = document.createElement('div');
          historySection.id = 'lead-manager-history-container';
          historySection.style.cssText = `
            margin-top: 16px;
            margin-bottom: 16px;
            padding: 12px;
            background-color: #f5f6f7;
            border-radius: 6px;
            border: 1px solid #dddfe2;
          `;
          
          // Obtener el ID del grupo actual
          const groupId = extractGroupIdFromUrl();
          
          // Obtener el historial del grupo actual
          interactionHistory.getGroupHistory(groupId).then(groupHistory => {
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
            progressSection.parentNode.insertBefore(historySection, progressSection);
            
            // Añadir eventos a los botones
            const resetGroupButton = document.getElementById('lmp-reset-group');
            if (resetGroupButton) {
              resetGroupButton.addEventListener('click', async () => {
                if (confirm('¿Estás seguro de que deseas reiniciar el historial de este grupo? Esta acción no se puede deshacer.')) {
                  await interactionHistory.resetGroupHistory(groupId);
                  
                  // Actualizar UI
                  const lastIndexElement = document.getElementById('lmp-last-index');
                  const interactionsElement = document.getElementById('lmp-group-interactions');
                  
                  if (lastIndexElement) lastIndexElement.textContent = '0';
                  if (interactionsElement) interactionsElement.textContent = '0';
                  
                  console.log('Historial del grupo reiniciado');
                }
              });
            }
            
            const resetAllButton = document.getElementById('lmp-reset-all');
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
            console.error('Error al obtener el historial del grupo:', error);
          });
          
          return true;
        }
        
        // Función para modificar el método startInteraction
        function enhanceStartInteraction() {
          // Guardar la función original
          const originalStartInteraction = interactionUI.startInteraction;
          
          // Sobreescribir con nuestra versión
          interactionUI.startInteraction = async function() {
            // Guardar referencia al tiempo de inicio
            this.startTime = Date.now();
            
            // Verificar si se debe continuar desde el último índice
            const continueFromLastCheckbox = document.getElementById('lmp-continue-from-last');
            const continueFromLast = continueFromLastCheckbox ? continueFromLastCheckbox.checked : true;
            
            // Obtener el ID del grupo actual
            const groupId = extractGroupIdFromUrl();
            
            // Obtener el último índice si es necesario
            let startFromIndex = 0;
            if (continueFromLast) {
              try {
                const groupHistory = await interactionHistory.getGroupHistory(groupId);
                startFromIndex = groupHistory.lastIndex || 0;
                console.log(`Continuando desde el índice ${startFromIndex} según historial`);
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
                      
                      // Registrar interacción exitosa
                      if (progress.messageSent) {
                        // Obtener el mensaje enviado
                        let messageText = "Mensaje enviado";
                        
                        // Intentar obtener el mensaje real
                        if (this.lastSentMessageIndex !== undefined && Array.isArray(this.messages)) {
                          const msgIndex = this.lastSentMessageIndex;
                          if (msgIndex >= 0 && msgIndex < this.messages.length) {
                            messageText = this.messages[msgIndex];
                          }
                        }
                        
                        // Registrar la interacción en el historial
                        const memberData = {
                          userId: progress.memberId || `unknown-${Date.now()}`,
                          userName: progress.memberName || 'Usuario',
                          messageText: messageText,
                          index: progress.actualMemberIndex
                        };
                        
                        await interactionHistory.registerInteraction(groupId, memberData);
                        
                        // Actualizar UI del historial
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
                  } catch (error) {
                    console.error('Error al procesar la interacción:', error);
                  }
                  
                  // Llamar al callback original
                  if (callback) {
                    callback(progress);
                  }
                });
              };
              
              // Guardar el tiempo de inicio
              memberInteraction.startTime = this.startTime;
            }
            
            // Llamar a la función original
            return await originalStartInteraction.call(this);
          };
          
          console.log('Método startInteraction mejorado para usar historial');
        }
        
        // Inyectar historial inmediatamente si el panel ya existe
        if (!injectHistoryToFloatingPanel()) {
          // Configurar un observador para detectar cuando se crea el panel
          console.log('Configurando observador para detectar el panel flotante...');
          
          const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
              if (mutation.type === 'childList' && mutation.addedNodes.length) {
                for (const node of mutation.addedNodes) {
                  if (node.classList && node.classList.contains('lead-manager-interaction-ui')) {
                    console.log('Panel flotante detectado, agregando historial...');
                    injectHistoryToFloatingPanel();
                    break;
                  }
                }
              }
            }
          });
          
          observer.observe(document.body, {
            childList: true,
            subtree: true
          });
          
          // También verificar periódicamente
          const intervalId = setInterval(() => {
            if (injectHistoryToFloatingPanel()) {
              clearInterval(intervalId);
            }
          }, 2000);
        }
        
        // Mejorar el método startInteraction
        enhanceStartInteraction();
        
        console.log('Mejoras aplicadas correctamente al panel flotante');
      }
    }, 500);
  }
})();
