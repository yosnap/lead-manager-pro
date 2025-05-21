// Módulo para añadir funcionalidad de historial al panel de interacción existente
// Este archivo debe incluirse después de memberInteractionUI.js

(() => {
  window.addEventListener('DOMContentLoaded', () => {
    // Esperar a que se inicialice la extensión
    const waitForInitialization = setInterval(() => {
      if (window.leadManagerPro && window.leadManagerPro.memberInteractionUI) {
        clearInterval(waitForInitialization);
        
        console.log('Añadiendo funcionalidad de historial al panel de interacción flotante...');
        
        // Referencia al módulo de interacción existente
        const interactionUI = window.leadManagerPro.memberInteractionUI;
        
        // Crear el objeto para gestionar el historial
        const interactionHistory = {
          // Método para extraer el ID de grupo de la URL
          extractGroupIdFromUrl: function() {
            const url = window.location.href;
            const match = url.match(/groups\/([^/?]+)/);
            return match ? match[1] : 'unknown';
          },
          
          // Cargar datos del historial
          loadHistoryData: async function() {
            try {
              const groupId = this.extractGroupIdFromUrl();
              const result = await new Promise(resolve => {
                chrome.storage.local.get(['interactionHistory'], resolve);
              });
              
              if (!result || !result.interactionHistory) {
                return { lastIndex: 0, interactionCount: 0 };
              }
              
              const history = result.interactionHistory;
              
              if (!history[groupId]) {
                return { lastIndex: 0, interactionCount: 0 };
              }
              
              return {
                lastIndex: history[groupId].lastIndex || 0,
                interactionCount: history[groupId].interactions ? history[groupId].interactions.length : 0
              };
            } catch (error) {
              console.error('Error al cargar datos de historial:', error);
              return { lastIndex: 0, interactionCount: 0 };
            }
          },
          
          // Actualizar estadísticas de historial en la UI
          updateHistoryStats: async function(container) {
            if (!container) {
              console.error('Container no proporcionado para updateHistoryStats');
              return;
            }
            
            try {
              const historyData = await this.loadHistoryData();
              
              // Actualizar los elementos del DOM
              const lastIndexElement = container.querySelector('#lmp-last-index');
              const interactionsElement = container.querySelector('#lmp-group-interactions');
              
              if (lastIndexElement) {
                lastIndexElement.textContent = historyData.lastIndex || 0;
              }
              
              if (interactionsElement) {
                interactionsElement.textContent = historyData.interactionCount || 0;
              }
            } catch (error) {
              console.error('Error al actualizar estadísticas de historial:', error);
            }
          },
          
          // Reiniciar historial de un grupo
          resetGroupHistory: async function() {
            const groupId = this.extractGroupIdFromUrl();
            
            try {
              // Obtener el historial actual
              const result = await new Promise(resolve => {
                chrome.storage.local.get(['interactionHistory'], resolve);
              });
              
              const history = result.interactionHistory || {};
              
              // Reiniciar el historial del grupo actual
              if (history[groupId]) {
                history[groupId] = {
                  lastIndex: 0,
                  interactions: []
                };
              }
              
              // Guardar el historial actualizado
              await new Promise(resolve => {
                chrome.storage.local.set({ 'interactionHistory': history }, resolve);
              });
              
              console.log(`Historial del grupo ${groupId} reiniciado`);
              return true;
            } catch (error) {
              console.error('Error al reiniciar el historial del grupo:', error);
              return false;
            }
          },
          
          // Reiniciar todo el historial
          resetAllHistory: async function() {
            try {
              await new Promise(resolve => {
                chrome.storage.local.set({ 'interactionHistory': {} }, resolve);
              });
              
              console.log('Todo el historial de interacciones ha sido reiniciado');
              return true;
            } catch (error) {
              console.error('Error al reiniciar todo el historial:', error);
              return false;
            }
          },
          
          // Registrar una interacción exitosa
          registerInteraction: async function(memberIndex, messageText) {
            try {
              const groupId = this.extractGroupIdFromUrl();
              const result = await new Promise(resolve => {
                chrome.storage.local.get(['interactionHistory'], resolve);
              });
              
              const history = result.interactionHistory || {};
              
              // Inicializar el historial del grupo si no existe
              if (!history[groupId]) {
                history[groupId] = {
                  lastIndex: 0,
                  interactions: []
                };
              }
              
              // Registrar la interacción
              history[groupId].interactions = history[groupId].interactions || [];
              history[groupId].interactions.push({
                index: memberIndex,
                timestamp: new Date().toISOString(),
                message: messageText
              });
              
              // Actualizar el último índice (el próximo a procesar)
              history[groupId].lastIndex = memberIndex + 1;
              
              // Guardar el historial actualizado
              await new Promise(resolve => {
                chrome.storage.local.set({ 'interactionHistory': history }, resolve);
              });
              
              return true;
            } catch (error) {
              console.error('Error al registrar interacción:', error);
              return false;
            }
          }
        };
        
        // Método para crear la sección de historial
        interactionUI.createHistorySection = function(container, insertAfterElement) {
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
          
          // Título de la sección
          const historyTitle = document.createElement('div');
          historyTitle.textContent = 'Historial de Interacciones';
          historyTitle.style.cssText = `
            font-weight: bold;
            margin-bottom: 10px;
            color: #4267B2;
          `;
          historySection.appendChild(historyTitle);
          
          // Cargar y mostrar estadísticas
          interactionHistory.loadHistoryData().then(historyData => {
            // Estadísticas
            const statsContainer = document.createElement('div');
            statsContainer.style.marginBottom = '8px';
            
            // Último índice
            const lastIndexDiv = document.createElement('div');
            lastIndexDiv.innerHTML = `<strong>Último índice:</strong> <span id="lmp-last-index">${historyData.lastIndex || 0}</span>`;
            statsContainer.appendChild(lastIndexDiv);
            
            // Interacciones en este grupo
            const interactionsDiv = document.createElement('div');
            interactionsDiv.innerHTML = `<strong>Interacciones en este grupo:</strong> <span id="lmp-group-interactions">${historyData.interactionCount || 0}</span>`;
            statsContainer.appendChild(interactionsDiv);
            
            historySection.appendChild(statsContainer);
            
            // Opción para continuar desde el último índice
            const continueContainer = document.createElement('div');
            continueContainer.style.cssText = `
              display: flex;
              align-items: center;
              margin-bottom: 8px;
            `;
            
            const continueCheckbox = document.createElement('input');
            continueCheckbox.type = 'checkbox';
            continueCheckbox.id = 'lmp-continue-from-last';
            continueCheckbox.checked = true;
            continueCheckbox.style.marginRight = '8px';
            
            const continueLabel = document.createElement('label');
            continueLabel.htmlFor = 'lmp-continue-from-last';
            continueLabel.textContent = 'Continuar desde el último índice';
            
            continueContainer.appendChild(continueCheckbox);
            continueContainer.appendChild(continueLabel);
            historySection.appendChild(continueContainer);
            
            // Botones para reiniciar historial
            const resetGroupButton = document.createElement('button');
            resetGroupButton.textContent = 'Reiniciar historial de este grupo';
            resetGroupButton.style.cssText = `
              display: block;
              width: 100%;
              padding: 8px;
              margin-bottom: 8px;
              background-color: #f0f0f0;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              color: #333;
            `;
            
            resetGroupButton.addEventListener('click', async () => {
              if (confirm('¿Estás seguro de que deseas reiniciar el historial de este grupo? Esta acción no se puede deshacer.')) {
                await interactionHistory.resetGroupHistory();
                await interactionHistory.updateHistoryStats(historySection);
              }
            });
            
            const resetAllButton = document.createElement('button');
            resetAllButton.textContent = 'Reiniciar todo el historial';
            resetAllButton.style.cssText = `
              display: block;
              width: 100%;
              padding: 8px;
              background-color: #f8d7da;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              color: #721c24;
            `;
            
            resetAllButton.addEventListener('click', async () => {
              if (confirm('¿Estás seguro de que deseas reiniciar TODO el historial de interacciones? Esta acción no se puede deshacer y afectará a TODOS los grupos.')) {
                await interactionHistory.resetAllHistory();
                await interactionHistory.updateHistoryStats(historySection);
              }
            });
            
            historySection.appendChild(resetGroupButton);
            historySection.appendChild(resetAllButton);
            
            // Añadir barra de progreso
            const progressContainer = document.createElement('div');
            progressContainer.style.cssText = `
              margin-top: 16px;
              margin-bottom: 8px;
            `;
            
            // Título de la sección de progreso
            const progressTitle = document.createElement('div');
            progressTitle.textContent = 'Progreso:';
            progressTitle.style.cssText = `
              font-weight: bold;
              margin-bottom: 6px;
            `;
            progressContainer.appendChild(progressTitle);
            
            // Barra de progreso
            const progressBar = document.createElement('div');
            progressBar.className = 'lead-manager-progress-bar';
            progressBar.style.cssText = `
              width: 100%;
              height: 10px;
              background-color: #E4E6EB;
              border-radius: 5px;
              overflow: hidden;
              margin-bottom: 6px;
            `;
            
            const progressFill = document.createElement('div');
            progressFill.className = 'lead-manager-progress-fill';
            progressFill.style.cssText = `
              height: 100%;
              width: 0%;
              background-color: #4267B2;
              transition: width 0.3s;
            `;
            
            progressBar.appendChild(progressFill);
            
            // Estado del progreso
            const progressStatus = document.createElement('div');
            progressStatus.className = 'lead-manager-progress-status';
            progressStatus.textContent = 'Listo para iniciar';
            progressStatus.style.cssText = `
              font-size: 12px;
              color: #65676B;
            `;
            
            progressContainer.appendChild(progressBar);
            progressContainer.appendChild(progressStatus);
            
            historySection.appendChild(progressContainer);
          });
          
          // Insertar la sección de historial después del elemento especificado
          if (insertAfterElement && insertAfterElement.parentNode) {
            insertAfterElement.parentNode.insertBefore(historySection, insertAfterElement.nextSibling);
            console.log('Sección de historial añadida correctamente al panel flotante');
          }
        };
        
        // Método para actualizar las estadísticas del historial
        interactionUI.updateHistoryStats = async function() {
          const historyContainer = document.getElementById('lead-manager-history-container');
          if (historyContainer) {
            await interactionHistory.updateHistoryStats(historyContainer);
          }
        };
        
        // Modificar la función show para actualizar las estadísticas
        const originalShow = interactionUI.show;
        
        interactionUI.show = function() {
          // Llamar a la función original
          originalShow.call(this);
          
          console.log('Mostrando el panel de interacción flotante...');
          
          // Buscar el panel después de un breve retraso para asegurarnos de que se ha renderizado
          setTimeout(() => {
            // Intentar encontrar el panel por su ID o clase
            const interactionPanel = document.querySelector('.lead-manager-interaction-ui');
            console.log('Panel de interacción flotante:', interactionPanel);
            
            if (interactionPanel) {
              // Verificar si ya existe la sección de historial
              if (!interactionPanel.querySelector('#lead-manager-history-container')) {
                console.log('Añadiendo sección de historial al panel flotante...');
                
                // Vamos a intentar encontrar el lugar adecuado para insertar el historial
                // Primero, buscar el tiempo de espera
                let insertAfterElement = null;
                
                // Buscar elementos por su texto
                const allElements = interactionPanel.querySelectorAll('div, label');
                for (const element of allElements) {
                  if (element.textContent && element.textContent.includes('Tiempo de espera')) {
                    // Encontrar el contenedor principal
                    let parent = element;
                    while (parent && !parent.querySelector('input[type="number"]')) {
                      parent = parent.parentNode;
                      if (!parent) break;
                    }
                    
                    if (parent) {
                      insertAfterElement = parent;
                      console.log('Elemento para insertar después encontrado:', insertAfterElement);
                      break;
                    }
                  }
                }
                
                // Si no encontramos por texto, buscar por estructura de DOM
                if (!insertAfterElement) {
                  // Buscar el campo de tiempo de espera
                  const waitTimeInput = interactionPanel.querySelector('input[type="number"]');
                  if (waitTimeInput) {
                    // Subir hasta encontrar el contenedor
                    insertAfterElement = waitTimeInput.closest('div');
                    console.log('Elemento para insertar después encontrado por input:', insertAfterElement);
                  }
                }
                
                // Si aún no encontramos, intentar con las opciones avanzadas
                if (!insertAfterElement) {
                  const advancedOptions = interactionPanel.querySelector('.lead-manager-options-advanced');
                  if (advancedOptions) {
                    insertAfterElement = advancedOptions;
                    console.log('Elemento para insertar después encontrado por opciones avanzadas:', insertAfterElement);
                  }
                }
                
                // Si aún no encontramos, usar el último div antes de los botones
                if (!insertAfterElement) {
                  const buttons = interactionPanel.querySelectorAll('button');
                  if (buttons.length > 0) {
                    // Obtener el botón de iniciar interacción (normalmente el último)
                    const lastButton = buttons[buttons.length - 1];
                    // Buscar el contenedor de botones
                    const buttonContainer = lastButton.parentNode;
                    
                    if (buttonContainer) {
                      insertAfterElement = buttonContainer.previousElementSibling;
                      console.log('Elemento para insertar antes de los botones:', insertAfterElement);
                    }
                  }
                }
                
                // Si hemos encontrado dónde insertar
                if (insertAfterElement) {
                  // Crear la sección de historial
                  this.createHistorySection(interactionPanel, insertAfterElement);
                }
              } else {
                console.log('La sección de historial ya existe en el panel flotante');
                // Actualizar las estadísticas
                this.updateHistoryStats();
              }
            } else {
              console.warn('No se encontró el panel de interacción flotante');
            }
          }, 200); // Damos un poco más de tiempo para que se renderice
        };
        
        // Modificar la función de iniciar interacción para usar el historial
        const originalStartInteraction = interactionUI.startInteraction;
        
        interactionUI.startInteraction = async function() {
          // Establecer el tiempo de inicio
          this.startTime = Date.now();
          
          // Reiniciar la barra de progreso
          const progressFill = document.querySelector('.lead-manager-progress-fill');
          const progressStatus = document.querySelector('.lead-manager-progress-status');
          
          if (progressFill) {
            progressFill.style.width = '0%';
          }
          
          if (progressStatus) {
            progressStatus.textContent = 'Iniciando interacción...';
            progressStatus.style.color = '#65676B';
          }
          
          // Verificar si se debe continuar desde el último índice
          const continueFromLastCheckbox = document.getElementById('lmp-continue-from-last');
          const continueFromLast = continueFromLastCheckbox ? continueFromLastCheckbox.checked : false;
          
          // Obtener el último índice si es necesario
          let startFromIndex = 0;
          if (continueFromLast) {
            const historyData = await interactionHistory.loadHistoryData();
            startFromIndex = historyData.lastIndex || 0;
            console.log(`Continuando desde el índice ${startFromIndex} según historial`);
          } else {
            console.log('Iniciando desde el principio (índice 0)');
          }
          
          // Guardar referencia al indice de inicio
          this.startFromIndex = startFromIndex;
          
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
                // Ajustar el índice considerando el desplazamiento
                if (progress.type === 'progress') {
                  progress.actualMemberIndex = progress.memberIndex + startFromIndex;
                  
                  // Actualizar la barra de progreso
                  const progressFill = document.querySelector('.lead-manager-progress-fill');
                  const progressStatus = document.querySelector('.lead-manager-progress-status');
                  
                  if (progressFill && progressStatus) {
                    // Calcular el porcentaje de progreso
                    const percent = Math.round((progress.memberIndex / progress.totalMembers) * 100);
                    progressFill.style.width = `${percent}%`;
                    
                    // Mostrar índice real (considerando desde donde empezamos)
                    const actualIndex = progress.actualMemberIndex;
                    
                    // Actualizar el texto de estado
                    if (continueFromLast && startFromIndex > 0) {
                      progressStatus.textContent = `Procesando miembro ${progress.memberIndex + 1} de ${progress.totalMembers} (índice real: ${actualIndex + 1})`;
                    } else {
                      progressStatus.textContent = `Procesando miembro ${progress.memberIndex + 1} de ${progress.totalMembers}`;
                    }
                    
                    if (progress.messageSent) {
                      progressStatus.textContent += ' - Mensaje enviado';
                    }
                  }
                  
                  // Registrar interacción exitosa
                  if (progress.messageSent) {
                    // Obtener el mensaje enviado
                    let messageText = "Mensaje enviado";
                    
                    // Intentar obtener el mensaje real que se envió
                    if (this.lastSentMessageIndex !== undefined && 
                        Array.isArray(this.messages)) {
                      const msgIndex = this.lastSentMessageIndex;
                      if (msgIndex >= 0 && msgIndex < this.messages.length) {
                        messageText = this.messages[msgIndex];
                      }
                    }
                    
                    // Registrar en el historial
                    await interactionHistory.registerInteraction(
                      progress.actualMemberIndex,
                      messageText
                    );
                    
                    // Actualizar estadísticas en la UI
                    const historyContainer = document.getElementById('lead-manager-history-container');
                    if (historyContainer) {
                      await interactionHistory.updateHistoryStats(historyContainer);
                    }
                  }
                } else if (progress.type === 'complete') {
                  // Actualizar la UI para mostrar que la interacción ha terminado
                  const progressFill = document.querySelector('.lead-manager-progress-fill');
                  const progressStatus = document.querySelector('.lead-manager-progress-status');
                  
                  if (progressFill) {
                    progressFill.style.width = '100%';
                  }
                  
                  if (progressStatus) {
                    // Calcular la duración
                    const endTime = Date.now();
                    const duration = Math.round((endTime - this.startTime) / 1000);
                    const minutes = Math.floor(duration / 60);
                    const seconds = duration % 60;
                    
                    if (progress.limitReached) {
                      progressStatus.textContent = `Interacción completada. Se alcanzó el límite máximo de ${progress.maxMembersLimit} miembros. Tiempo: ${minutes ? `${minutes}m ` : ''}${seconds}s.`;
                    } else {
                      progressStatus.textContent = `Interacción completada. Se procesaron ${progress.processedMembers} de ${progress.totalMembers} miembros en ${minutes ? `${minutes}m ` : ''}${seconds}s.`;
                    }
                  }
                  
                  // Restaurar el botón de interacción
                  const interactionButtons = document.querySelectorAll('.lead-manager-button.primary');
                  if (interactionButtons.length > 0) {
                    interactionButtons.forEach(button => {
                      button.textContent = 'Iniciar Interacción';
                      button.style.backgroundColor = '#4267B2';
                    });
                  }
                } else if (progress.type === 'error') {
                  // Mostrar error en la UI
                  const progressStatus = document.querySelector('.lead-manager-progress-status');
                  if (progressStatus) {
                    progressStatus.textContent = `Error: ${progress.error.message}`;
                    progressStatus.style.color = '#dc3545';
                  }
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
        
        console.log('Funcionalidad de historial añadida al panel flotante exitosamente');
      }
    }, 1000);
  });
})();