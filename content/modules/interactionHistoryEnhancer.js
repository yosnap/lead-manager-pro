// Modificamos el sidebar para incluir la funcionalidad de historial y continuar desde donde se quedó
// manteniendo la compatibilidad con el sistema existente de 5 mensajes personalizados aleatorios

window.addEventListener('DOMContentLoaded', () => {
  // Esperar a que se inicialice la extensión
  const waitForInitialization = setInterval(() => {
    if (window.leadManagerPro && window.leadManagerPro.memberInteractionSidebar) {
      clearInterval(waitForInitialization);
      
      console.log('Mejorando el sidebar con funcionalidad de historial...');
      
      // Obtener la instancia del sidebar
      const sidebar = window.leadManagerPro.memberInteractionSidebar;
      
      // Guardar la función original de creación del sidebar
      const originalCreateSidebar = sidebar.createSidebar;
      
      // Ampliar el método createSidebar para incluir la sección de historial
      sidebar.createSidebar = function() {
        // Llamar al método original primero
        const container = originalCreateSidebar.call(this);
        
        // Agregar sección de historial antes del contenedor de progreso
        const progressContainer = container.querySelector('.lead-manager-progress');
        
        if (progressContainer && !container.querySelector('#lead-manager-history-container')) {
          const historyContainer = document.createElement('div');
          historyContainer.id = 'lead-manager-history-container';
          historyContainer.className = 'lead-manager-history-section';
          historyContainer.style.cssText = `
            margin-bottom: 16px;
            background-color: #f0f2f5;
            padding: 12px;
            border-radius: 6px;
          `;
          
          // Título de la sección
          const title = document.createElement('div');
          title.textContent = 'Historial de Interacciones';
          title.style.cssText = `
            font-weight: bold;
            margin-bottom: 8px;
          `;
          historyContainer.appendChild(title);
          
          // Cargar información del historial
          this.loadHistoryData().then(history => {
            // Mostrar último índice e interacciones
            const statsContainer = document.createElement('div');
            statsContainer.style.cssText = `
              margin-bottom: 12px;
            `;
            
            // Mostrar el último índice procesado
            const lastIndexDiv = document.createElement('div');
            lastIndexDiv.innerHTML = `<strong>Último índice:</strong> <span id="lmp-last-index">${history.lastIndex || 0}</span>`;
            statsContainer.appendChild(lastIndexDiv);
            
            // Mostrar el número de interacciones en este grupo
            const interactionsDiv = document.createElement('div');
            interactionsDiv.innerHTML = `<strong>Interacciones en este grupo:</strong> <span id="lmp-group-interactions">${history.interactionCount || 0}</span>`;
            statsContainer.appendChild(interactionsDiv);
            
            historyContainer.appendChild(statsContainer);
            
            // Opción para continuar desde el último índice
            const continueFromLastContainer = document.createElement('div');
            continueFromLastContainer.style.cssText = `
              display: flex;
              align-items: center;
              margin-bottom: 10px;
            `;
            
            const continueFromLastCheckbox = document.createElement('input');
            continueFromLastCheckbox.type = 'checkbox';
            continueFromLastCheckbox.id = 'lmp-continue-from-last';
            continueFromLastCheckbox.checked = true;
            continueFromLastCheckbox.style.marginRight = '8px';
            
            const continueFromLastLabel = document.createElement('label');
            continueFromLastLabel.htmlFor = 'lmp-continue-from-last';
            continueFromLastLabel.textContent = 'Continuar desde el último índice';
            
            continueFromLastContainer.appendChild(continueFromLastCheckbox);
            continueFromLastContainer.appendChild(continueFromLastLabel);
            historyContainer.appendChild(continueFromLastContainer);
            
            // Botones para reiniciar historial
            const resetGroupButton = document.createElement('button');
            resetGroupButton.textContent = 'Reiniciar historial de este grupo';
            resetGroupButton.className = 'lead-manager-secondary-button';
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
            
            resetGroupButton.addEventListener('mouseover', () => {
              resetGroupButton.style.backgroundColor = '#e4e4e4';
            });
            
            resetGroupButton.addEventListener('mouseout', () => {
              resetGroupButton.style.backgroundColor = '#f0f0f0';
            });
            
            resetGroupButton.addEventListener('click', () => {
              if (confirm('¿Estás seguro de que deseas reiniciar el historial de este grupo? Esta acción no se puede deshacer.')) {
                this.resetGroupHistory().then(() => {
                  this.updateHistoryStats();
                });
              }
            });
            
            const resetAllButton = document.createElement('button');
            resetAllButton.textContent = 'Reiniciar todo el historial';
            resetAllButton.className = 'lead-manager-danger-button';
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
            
            resetAllButton.addEventListener('mouseover', () => {
              resetAllButton.style.backgroundColor = '#f5c6cb';
            });
            
            resetAllButton.addEventListener('mouseout', () => {
              resetAllButton.style.backgroundColor = '#f8d7da';
            });
            
            resetAllButton.addEventListener('click', () => {
              if (confirm('¿Estás seguro de que deseas reiniciar TODO el historial de interacciones? Esta acción no se puede deshacer y afectará a TODOS los grupos.')) {
                this.resetAllHistory().then(() => {
                  this.updateHistoryStats();
                });
              }
            });
            
            historyContainer.appendChild(resetGroupButton);
            historyContainer.appendChild(resetAllButton);
          });
          
          // Insertar el contenedor de historial antes del contenedor de progreso
          progressContainer.parentNode.insertBefore(historyContainer, progressContainer);
        }
        
        // Asegurarse de que se use el acordeón de mensajes
        this.ensureMessageAccordion(container);
        
        // Agregar funcionalidad para detener interacción
        this.enhanceStopInteractionButton(container);
        
        return container;
      };
      
      // Método para cargar datos de historial
      sidebar.loadHistoryData = async function() {
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
      };
      
      // Método para actualizar las estadísticas del historial
      sidebar.updateHistoryStats = async function() {
        const historyData = await this.loadHistoryData();
        
        // Actualizar los elementos del DOM
        const lastIndexElement = document.getElementById('lmp-last-index');
        const interactionsElement = document.getElementById('lmp-group-interactions');
        
        if (lastIndexElement) {
          lastIndexElement.textContent = historyData.lastIndex || 0;
        }
        
        if (interactionsElement) {
          interactionsElement.textContent = historyData.interactionCount || 0;
        }
      };
      
      // Método para reiniciar el historial de un grupo
      sidebar.resetGroupHistory = async function() {
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
      };
      
      // Método para reiniciar todo el historial
      sidebar.resetAllHistory = async function() {
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
      };
      
      // Método para extraer el ID del grupo de la URL
      sidebar.extractGroupIdFromUrl = function() {
        const url = window.location.href;
        const match = url.match(/groups\/([^/?]+)/);
        return match ? match[1] : 'unknown';
      };      // Método para asegurarse de que se use el acordeón de mensajes
      sidebar.ensureMessageAccordion = function(container) {
        console.log('Añadiendo acordeón de mensajes al sidebar...');
        
        // Buscar la sección de mensajes
        const messagesSection = container.querySelector('.lead-manager-messages');
        
        if (!messagesSection) {
          console.error('No se encontró la sección de mensajes en el sidebar');
          return;
        }
        
        // Verificar si ya existe un acordeón
        if (messagesSection.querySelector('.lead-manager-accordion')) {
          console.log('El acordeón ya está presente en el sidebar');
          return;
        }
        
        // Verificar que exista el módulo de acordeón
        if (!window.leadManagerPro.messagesAccordion) {
          console.error('El módulo messagesAccordion no está disponible');
          return;
        }
        
        console.log('Reemplazando textarea simple por acordeón de mensajes...');
        
        try {
          // Guardar el mensaje original (si existe)
          const originalTextarea = messagesSection.querySelector('textarea');
          const originalMessage = originalTextarea ? originalTextarea.value : '';
          
          // Limpiar la sección de mensajes
          messagesSection.innerHTML = '';
          
          // Crear etiqueta para la sección
          const messagesLabel = document.createElement('div');
          messagesLabel.textContent = 'Mensajes personalizados (se enviarán aleatoriamente):';
          messagesLabel.style.fontWeight = 'bold';
          messagesLabel.style.marginBottom = '8px';
          messagesSection.appendChild(messagesLabel);
          
          // Crear y añadir el acordeón
          const accordionContainer = window.leadManagerPro.messagesAccordion.createAccordion();
          messagesSection.appendChild(accordionContainer);
          
          // Si había un mensaje original, colocarlo en el primer textarea
          if (originalMessage && window.leadManagerPro.messagesAccordion.messageTextareas.length > 0) {
            window.leadManagerPro.messagesAccordion.messageTextareas[0].value = originalMessage;
          }
          
          // Cargar mensajes guardados
          this.loadSavedMessages();
          
          console.log('Acordeón de mensajes añadido correctamente');
        } catch (error) {
          console.error('Error al añadir acordeón de mensajes:', error);
          
          // Restaurar el estado original en caso de error
          if (messagesSection.innerHTML === '') {
            const textarea = document.createElement('textarea');
            textarea.value = 'Hola, este es un mensaje de prueba desde la plataforma, has caso omiso ya que solo sirve para pruebas. !Un saludo!';
            textarea.style.cssText = `
              width: 100%;
              height: 100px;
              padding: 8px;
              border-radius: 4px;
              border: 1px solid #CED0D4;
              resize: vertical;
            `;
            messagesSection.appendChild(textarea);
          }
        }
      };
      
      // Método para configurar los botones de guardar y comenzar interacción
      sidebar.setupButtonHandlers = function(container) {
        console.log('Configurando manejadores para los botones...');
        
        // Botón "Guardar Opciones"
        const saveButton = container.querySelector('button:first-of-type');
        if (saveButton) {
          saveButton.onclick = null; // Eliminar handler existente
          
          saveButton.addEventListener('click', async () => {
            await this.saveAllSettings(container);
          });
          
          console.log('Botón de guardar opciones configurado');
        } else {
          console.error('No se encontró el botón de guardar opciones');
        }
        
        // Botón "Iniciar Interacción"
        const startButton = container.querySelector('button:last-of-type');
        if (startButton) {
          console.log('Configurando botón de iniciar/detener interacción...');
          
          startButton.onclick = null; // Eliminar handler existente
          
          startButton.addEventListener('click', async () => {
            // Si ya hay una interacción en curso, detenerla
            if (this.interactionInProgress) {
              console.log('Deteniendo interacción en curso...');
              
              // Cambiar la apariencia del botón
              startButton.textContent = 'Deteniendo...';
              startButton.disabled = true;
              startButton.style.backgroundColor = '#f0f0f0';
              startButton.style.color = '#999';
              
              // Detener la interacción
              if (this.memberInteraction) {
                this.memberInteraction.stopInteraction = true;
                
                // Esperar un momento para que la detención sea efectiva
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
              
              // Restaurar el botón
              startButton.textContent = 'Iniciar Interacción';
              startButton.disabled = false;
              startButton.style.backgroundColor = '#1877f2';
              startButton.style.color = 'white';
              this.interactionInProgress = false;
              
              return;
            }
            
            try {
              // Cambiar el estado del botón
              startButton.textContent = 'Detener';
              startButton.style.backgroundColor = '#dc3545';
              this.interactionInProgress = true;
              
              // Obtener elementos de la UI para actualizar progreso
              const progressFill = container.querySelector('.lead-manager-progress-fill');
              const progressStatus = container.querySelector('.lead-manager-progress-status');
              
              if (!progressFill || !progressStatus) {
                throw new Error('No se encontraron los elementos de progreso');
              }
              
              // Reiniciar progreso
              progressFill.style.width = '0%';
              progressStatus.textContent = 'Iniciando interacción...';
              progressStatus.style.color = '#65676B';
              
              // Obtener configuración de continuación
              const continueFromLastCheckbox = document.getElementById('lmp-continue-from-last');
              const continueFromLast = continueFromLastCheckbox ? continueFromLastCheckbox.checked : false;
              
              console.log('Iniciando interacción con continuación:', continueFromLast);
              
              // Iniciar la interacción
              await this.startInteractionWithTracking(progressFill, progressStatus, continueFromLast);
            } catch (error) {
              console.error('Error al iniciar la interacción:', error);
              
              // Restaurar el botón en caso de error
              startButton.textContent = 'Iniciar Interacción';
              startButton.style.backgroundColor = '#1877f2';
              this.interactionInProgress = false;
              
              // Mostrar error
              const progressStatus = container.querySelector('.lead-manager-progress-status');
              if (progressStatus) {
                progressStatus.textContent = `Error: ${error.message}`;
                progressStatus.style.color = '#dc3545';
              }
            }
          });
          
          console.log('Botón de iniciar/detener interacción configurado');
        } else {
          console.error('No se encontró el botón de iniciar interacción');
        }
      };
      
      // Método para guardar todos los ajustes
      sidebar.saveAllSettings = async function(container) {
        console.log('Guardando configuración...');
        
        try {
          // Obtener mensajes del acordeón (si existe)
          let messages = [];
          if (window.leadManagerPro.messagesAccordion) {
            messages = window.leadManagerPro.messagesAccordion.getConfiguredMessages();
            
            // Asegurarse de que haya al menos un mensaje
            if (messages.length === 0) {
              alert('Por favor, ingrese al menos un mensaje para enviar');
              return false;
            }
          } else {
            // Si no hay acordeón, buscar el textarea simple
            const textarea = container.querySelector('.lead-manager-messages textarea');
            if (textarea) {
              const message = textarea.value.trim();
              if (message) {
                messages = [message];
              } else {
                alert('Por favor, ingrese un mensaje para enviar');
                return false;
              }
            }
          }
          
          // Obtener el resto de valores del formulario
          const waitTimeInput = container.querySelector('input[type="number"][min="1"][step="1"]');
          const maxMembersInput = container.querySelectorAll('input[type="number"]')[1];
          const autoCloseCheckbox = container.querySelector('input[type="checkbox"]#autoCloseChat');
          const memberTypeSelect = container.querySelector('select');
          
          const waitTime = parseInt(waitTimeInput?.value) || 2;
          const maxMembers = parseInt(maxMembersInput?.value) || 10;
          const autoClose = autoCloseCheckbox?.checked !== undefined ? autoCloseCheckbox.checked : true;
          const memberType = memberTypeSelect?.value || 'newMembers';
          
          // Obtener configuración de historial
          const continueFromLastCheckbox = document.getElementById('lmp-continue-from-last');
          const continueFromLast = continueFromLastCheckbox ? continueFromLastCheckbox.checked : true;
          
          // Configuración completa a guardar
          const config = {
            messages: messages,
            waitTime: waitTime,
            maxMembersToInteract: maxMembers,
            autoCloseChat: autoClose,
            selectedMemberType: memberType,
            continueFromLast: continueFromLast
          };
          
          console.log('Guardando configuración:', config);
          
          // Guardar en chrome.storage
          await new Promise(resolve => {
            chrome.storage.local.set({ 'leadManagerGroupSettings': config }, resolve);
          });
          
          console.log('Configuración guardada en chrome.storage.local');
          
          // Actualizar mensajes en messagesAccordion si existe
          if (window.leadManagerPro.messagesAccordion) {
            window.leadManagerPro.messagesAccordion.loadSavedMessages(messages);
          }
          
          // Actualizar las propiedades del sidebar
          Object.assign(sidebar, config);
          
          // Mostrar mensaje de éxito
          const progressStatus = container.querySelector('.lead-manager-progress-status');
          if (progressStatus) {
            const originalText = progressStatus.textContent;
            const originalColor = progressStatus.style.color;
            
            progressStatus.textContent = 'Configuración guardada correctamente';
            progressStatus.style.color = '#00C851';
            
            setTimeout(() => {
              progressStatus.textContent = originalText;
              progressStatus.style.color = originalColor;
            }, 3000);
          }
          
          return true;
        } catch (error) {
          console.error('Error al guardar configuración:', error);
          alert('Error al guardar la configuración');
          return false;
        }
      };
      
      // Mejora de las funcionalidades de detener interacción
      sidebar.enhanceStopInteractionButton = function(container) {
        // Encontrar el botón de iniciar/detener interacción
        const startButton = container.querySelector('button:last-child');
        
        if (startButton) {
          // Guardar la función original
          const originalClickHandler = startButton.onclick;
          startButton.onclick = null;
          
          // Agregar nuevo manejador de eventos
          startButton.addEventListener('click', async (event) => {
            // Si ya hay una interacción en progreso, detenerla
            if (this.interactionInProgress) {
              console.log('Deteniendo interacción en progreso...');
              
              // Cambiar la apariencia del botón
              startButton.textContent = 'Deteniendo...';
              startButton.disabled = true;
              
              // Detener la interacción
              if (this.memberInteraction) {
                this.memberInteraction.stopInteraction = true;
                
                // Esperar un momento para que los procesos internos se detengan
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Restaurar el botón
                startButton.textContent = 'Iniciar Interacción';
                startButton.disabled = false;
                startButton.style.backgroundColor = '#1877f2';
                this.interactionInProgress = false;
              }
              
              return;
            }
            
            // Obtener el estado del checkbox para continuar desde el último índice
            const continueFromLastCheckbox = document.getElementById('lmp-continue-from-last');
            const continueFromLast = continueFromLastCheckbox ? continueFromLastCheckbox.checked : false;
            
            // Modificar el comportamiento de startInteraction para incluir el historial
            const originalStartInteraction = this.startInteraction;
            
            this.startInteraction = async function(progressFill, progressStatus) {
              try {
                if (!this.memberInteraction) {
                  throw new Error('El módulo de interacción con miembros no está disponible');
                }
                
                // Cargar la configuración
                await this.loadConfiguration();
                
                // Configurar mensajes aleatorios
                const messages = window.leadManagerPro.messagesAccordion.getConfiguredMessages();
                if (messages.length > 0) {
                  this.memberInteraction.messages = messages;
                  
                  // Para compatibilidad también establecer messageToSend
                  if (messages.length > 0) {
                    this.memberInteraction.messageToSend = messages[0];
                  }
                  
                  console.log(`Se han configurado ${messages.length} mensajes aleatorios`);
                } else {
                  console.warn('No se encontraron mensajes configurados, usando mensaje por defecto');
                  this.memberInteraction.messages = [window.leadManagerPro.messagesAccordion.defaultMessage];
                  this.memberInteraction.messageToSend = window.leadManagerPro.messagesAccordion.defaultMessage;
                }
                
                // Configurar el resto de opciones
                this.memberInteraction.autoCloseChat = this.autoCloseChat;
                this.memberInteraction.interactionDelay = this.waitTime * 1000;
                this.memberInteraction.maxMembersToInteract = this.maxMembersToInteract;
                
                // Registrar la configuración actual
                console.log('Configuración de interacción:', {
                  messages: this.memberInteraction.messages,
                  autoCloseChat: this.autoCloseChat,
                  interactionDelay: this.waitTime * 1000,
                  maxMembersToInteract: this.maxMembersToInteract,
                  continueFromLast: continueFromLast
                });
                
                // Si hay una interacción en curso, detenerla
                if (this.memberInteraction.isInteracting) {
                  this.memberInteraction.stopInteraction = true;
                  await new Promise(resolve => setTimeout(resolve, 500));
                }
                
                // Verificar si estamos en la página de miembros
                if (!window.location.href.includes('/members')) {
                  // Navegación a página de miembros...
                  return false;
                }
                
                // La lógica específica para localizar miembros en la sección seleccionada
                // se mantiene igual a la implementación original
                
                // Esta parte debe mantenerse igual a la implementación existente para
                // garantizar que se seleccione correctamente la sección de miembros
                
                // Después de inicializar la interacción, actualizar historial
                const originalCallback = this.memberInteraction.startInteraction;
                
                // Aplicar continuar desde último índice si está habilitado
                let startIndex = 0;
                if (continueFromLast) {
                  const historyData = await this.loadHistoryData();
                  startIndex = historyData.lastIndex || 0;
                  
                  // Actualizar el índice actual
                  this.memberInteraction.currentMemberIndex = startIndex;
                  console.log(`Continuando desde el índice ${startIndex} según historial`);
                }
                
                // Reemplazar temporalmente la función de callback
                this.memberInteraction.startInteraction = async function(callback) {
                  return await originalCallback.call(this, async (progress) => {
                    // Ajustar el índice para considerar la continuación
                    if (progress.type === 'progress') {
                      progress.actualMemberIndex = progress.memberIndex + startIndex;
                    }
                    
                    // Actualizar el historial después de cada interacción exitosa
                    if (progress.type === 'progress' && progress.messageSent) {
                      try {
                        const groupId = sidebar.extractGroupIdFromUrl();
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
                        
                        // Obtener información del mensaje enviado (aleatorio)
                        let messageText = "Mensaje enviado";
                        
                        // Si usamos el acordeón, es posible que se haya enviado un mensaje aleatorio
                        // Intentamos obtener la referencia al mensaje que se envió realmente
                        if (window.leadManagerPro.memberInteraction && 
                            window.leadManagerPro.memberInteraction.lastSentMessageIndex !== undefined &&
                            Array.isArray(window.leadManagerPro.memberInteraction.messages)) {
                            
                            const msgIndex = window.leadManagerPro.memberInteraction.lastSentMessageIndex;
                            if (msgIndex >= 0 && msgIndex < window.leadManagerPro.memberInteraction.messages.length) {
                                messageText = window.leadManagerPro.memberInteraction.messages[msgIndex];
                            }
                        }
                        
                        history[groupId].interactions.push({
                          index: progress.actualMemberIndex,
                          timestamp: new Date().toISOString(),
                          message: messageText
                        });
                        
                        // Actualizar el último índice (el próximo a procesar)
                        history[groupId].lastIndex = progress.actualMemberIndex + 1;
                        
                        // Guardar el historial actualizado
                        await new Promise(resolve => {
                          chrome.storage.local.set({ 'interactionHistory': history }, resolve);
                        });
                        
                        // Actualizar las estadísticas mostradas
                        sidebar.updateHistoryStats();
                      } catch (error) {
                        console.error('Error al actualizar historial:', error);
                      }
                    }
                    
                    // Llamar al callback original
                    if (callback) {
                      callback(progress);
                    }
                  });
                };
                
                // Continuar con la implementación original...
                return await originalStartInteraction.call(this, progressFill, progressStatus);
              } catch (error) {
                console.error('Error en startInteraction:', error);
                return false;
              }
            };
            
            // Llamar al manejador original
            if (typeof originalClickHandler === 'function') {
              originalClickHandler.call(startButton, event);
            }
          });
        }
      };
      
      console.log('Sidebar mejorado con funcionalidad de historial');
    }
  }, 1000);
});      // Método para cargar mensajes guardados
      sidebar.loadSavedMessages = async function() {
        try {
          console.log('Cargando mensajes guardados...');
          
          const result = await new Promise(resolve => {
            chrome.storage.local.get(['leadManagerGroupSettings'], resolve);
          });
          
          if (result && result.leadManagerGroupSettings && result.leadManagerGroupSettings.messages) {
            const messages = result.leadManagerGroupSettings.messages;
            console.log(`Se encontraron ${messages.length} mensajes guardados`);
            
            // Cargar los mensajes en el acordeón
            if (window.leadManagerPro.messagesAccordion) {
              window.leadManagerPro.messagesAccordion.loadSavedMessages(messages);
              console.log('Mensajes cargados en el acordeón');
            } else {
              console.warn('El módulo messagesAccordion no está disponible para cargar mensajes');
            }
            
            // Actualizar la propiedad messages del sidebar
            this.messages = messages;
          } else {
            console.log('No se encontraron mensajes guardados');
          }
        } catch (error) {
          console.error('Error al cargar mensajes guardados:', error);
        }
      };
      
      // Método para iniciar la interacción con tracking de historial
      sidebar.startInteractionWithTracking = async function(progressFill, progressStatus, continueFromLast) {
        try {
          if (!this.memberInteraction) {
            throw new Error('El módulo de interacción con miembros no está disponible');
          }
          
          // Guardar la configuración actual
          await this.saveAllSettings(this.container);
          
          // Configurar mensajes aleatorios
          let messages = [];
          if (window.leadManagerPro.messagesAccordion) {
            messages = window.leadManagerPro.messagesAccordion.getConfiguredMessages();
          }
          
          if (messages.length > 0) {
            this.memberInteraction.messages = messages;
            
            // Para compatibilidad también establecer messageToSend
            if (messages.length > 0) {
              this.memberInteraction.messageToSend = messages[0];
            }
            
            console.log(`Se han configurado ${messages.length} mensajes aleatorios:`, messages);
          } else {
            console.warn('No se encontraron mensajes configurados, usando mensaje por defecto');
            const defaultMessage = 'Hola, este es un mensaje de prueba desde la plataforma, has caso omiso ya que solo sirve para pruebas. !Un saludo!';
            this.memberInteraction.messages = [defaultMessage];
            this.memberInteraction.messageToSend = defaultMessage;
          }
          
          // Configurar el resto de opciones
          this.memberInteraction.autoCloseChat = this.autoCloseChat;
          this.memberInteraction.interactionDelay = this.waitTime * 1000;
          this.memberInteraction.maxMembersToInteract = this.maxMembersToInteract;
          
          // Registrar la configuración actual
          console.log('Configuración de interacción:', {
            messages: this.memberInteraction.messages,
            autoCloseChat: this.autoCloseChat,
            interactionDelay: this.waitTime * 1000,
            maxMembersToInteract: this.maxMembersToInteract,
            continueFromLast: continueFromLast
          });
          
          // Si hay una interacción en curso, detenerla primero
          if (this.memberInteraction.isInteracting) {
            this.memberInteraction.stopInteraction = true;
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          // Verificar si estamos en la página de miembros
          if (!window.location.href.includes('/members')) {
            // Navegar a la página de miembros
            const groupIdMatch = window.location.href.match(/\/groups\/([^\/]+)/);
            if (groupIdMatch && groupIdMatch[1]) {
              const groupId = groupIdMatch[1];
              window.location.href = `https://www.facebook.com/groups/${groupId}/members`;
              return true;
            } else {
              throw new Error('No se pudo determinar el ID del grupo desde la URL');
            }
          }
          
          // Esperar a que la página cargue completamente
          await new Promise(resolve => setTimeout(resolve, 1000));                  // Actualizar el último índice (el próximo a procesar)
                  history[groupId].lastIndex = progress.actualMemberIndex + 1;
                  
                  // Guardar el historial actualizado
                  await new Promise(resolve => {
                    chrome.storage.local.set({ 'interactionHistory': history }, resolve);
                  });
                  
                  // Actualizar las estadísticas mostradas
                  sidebar.updateHistoryStats();
                } catch (error) {
                  console.error('Error al actualizar historial:', error);
                }
              } 
              
              if (progress.type === 'complete') {
                // Actualizar el botón de interacción al finalizar
                const startButton = sidebar.container.querySelector('button:last-of-type');
                if (startButton) {
                  startButton.textContent = 'Iniciar Interacción';
                  startButton.style.backgroundColor = '#1877f2';
                  sidebar.interactionInProgress = false;
                }
              }
              
              // Llamar al callback original
              if (callback) {
                callback(progress);
              }
            });
          };
          
          // Iniciar la interacción
          await this.memberInteraction.startInteraction((progress) => {
            if (progress.type === 'progress') {
              // Calcular el porcentaje de progreso
              const percent = Math.round((progress.memberIndex / progress.totalMembers) * 100);
              
              // Actualizar la barra de progreso
              progressFill.style.width = `${percent}%`;
              
              // Mostrar índice real (considerando desde donde empezamos)
              const actualIndex = progress.actualMemberIndex !== undefined ? 
                progress.actualMemberIndex : progress.memberIndex + startIndex;
                
              // Actualizar el texto de estado
              progressStatus.textContent = `Procesando miembro ${progress.memberIndex + 1} de ${progress.totalMembers}`;
              
              if (continueFromLast && startIndex > 0) {
                progressStatus.textContent += ` (índice real: ${actualIndex + 1})`;
              }
              
              if (progress.messageOpened) {
                progressStatus.textContent += ' - Mensaje enviado';
              }
            } else if (progress.type === 'complete') {
              // Actualizar UI indicando que ha finalizado
              progressFill.style.width = '100%';
              
              const duration = Math.round((Date.now() - startTime) / 1000);
              const minutes = Math.floor(duration / 60);
              const seconds = duration % 60;
              
              // Mensaje específico si se alcanzó el límite máximo
              if (progress.limitReached) {
                progressStatus.textContent = `Interacción completada. Se alcanzó el límite máximo de ${progress.maxMembersLimit} miembros. Tiempo: ${minutes ? `${minutes}m ` : ''}${seconds}s.`;
              } else {
                progressStatus.textContent = `Interacción completada. Se procesaron ${progress.processedMembers} de ${progress.totalMembers} miembros en ${minutes ? `${minutes}m ` : ''}${seconds}s.`;
              }
              
              // Actualizar el botón
              const startButton = this.container.querySelector('button:last-of-type');
              if (startButton) {
                startButton.textContent = 'Iniciar Interacción';
                startButton.style.backgroundColor = '#1877f2';
              }
              
              this.interactionInProgress = false;
            } else if (progress.type === 'error') {
              // Actualizar UI indicando que ha ocurrido un error
              progressStatus.textContent = `Error: ${progress.error.message}`;
              progressStatus.style.color = '#dc3545';
              
              // Actualizar el botón
              const startButton = this.container.querySelector('button:last-of-type');
              if (startButton) {
                startButton.textContent = 'Iniciar Interacción';
                startButton.style.backgroundColor = '#1877f2';
              }
              
              this.interactionInProgress = false;
            }
          });
          
          return true;
        } catch (error) {
          console.error('Error en startInteractionWithTracking:', error);
          this.interactionInProgress = false;
          
          // Actualizar UI con el error
          if (progressStatus) {
            progressStatus.textContent = `Error: ${error.message}`;
            progressStatus.style.color = '#dc3545';
          }
          
          return false;
        }
      };
      
      // Método para mejorar el sidebar existente
      sidebar.enhanceSidebar = function() {
        // Esperar a que el sidebar se muestre
        const waitForSidebar = setInterval(() => {
          if (this.container && this.isVisible) {
            clearInterval(waitForSidebar);
            
            console.log('Mejorando el sidebar existente...');
            
            try {
              // Agregar acordeón de mensajes
              this.ensureMessageAccordion(this.container);
              
              // Configurar botones
              this.setupButtonHandlers(this.container);
              
              // Agregar sección de historial
              if (!this.container.querySelector('#lead-manager-history-container')) {
                console.log('Agregando sección de historial...');
                
                // Buscar la ubicación adecuada (antes del contenedor de progreso)
                const progressContainer = this.container.querySelector('.lead-manager-progress');
                
                if (progressContainer) {
                  // Crear contenedor de historial
                  const historyContainer = document.createElement('div');
                  historyContainer.id = 'lead-manager-history-container';
                  historyContainer.className = 'lead-manager-history-section';
                  historyContainer.style.cssText = `
                    margin-bottom: 16px;
                    background-color: #f0f2f5;
                    padding: 12px;
                    border-radius: 6px;
                  `;
                  
                  // Título de la sección
                  const title = document.createElement('div');
                  title.textContent = 'Historial de Interacciones';
                  title.style.cssText = `
                    font-weight: bold;
                    margin-bottom: 8px;
                  `;
                  historyContainer.appendChild(title);
                  
                  // Cargar información del historial
                  this.loadHistoryData().then(history => {
                    // Mostrar último índice e interacciones
                    const statsContainer = document.createElement('div');
                    statsContainer.style.cssText = `
                      margin-bottom: 12px;
                    `;
                    
                    // Mostrar el último índice procesado
                    const lastIndexDiv = document.createElement('div');
                    lastIndexDiv.innerHTML = `<strong>Último índice:</strong> <span id="lmp-last-index">${history.lastIndex || 0}</span>`;
                    statsContainer.appendChild(lastIndexDiv);
                    
                    // Mostrar el número de interacciones en este grupo
                    const interactionsDiv = document.createElement('div');
                    interactionsDiv.innerHTML = `<strong>Interacciones en este grupo:</strong> <span id="lmp-group-interactions">${history.interactionCount || 0}</span>`;
                    statsContainer.appendChild(interactionsDiv);
                    
                    historyContainer.appendChild(statsContainer);
                    
                    // Opción para continuar desde el último índice
                    const continueFromLastContainer = document.createElement('div');
                    continueFromLastContainer.style.cssText = `
                      display: flex;
                      align-items: center;
                      margin-bottom: 10px;
                    `;
                    
                    const continueFromLastCheckbox = document.createElement('input');
                    continueFromLastCheckbox.type = 'checkbox';
                    continueFromLastCheckbox.id = 'lmp-continue-from-last';
                    continueFromLastCheckbox.checked = true;
                    continueFromLastCheckbox.style.marginRight = '8px';
                    
                    const continueFromLastLabel = document.createElement('label');
                    continueFromLastLabel.htmlFor = 'lmp-continue-from-last';
                    continueFromLastLabel.textContent = 'Continuar desde el último índice';
                    
                    continueFromLastContainer.appendChild(continueFromLastCheckbox);
                    continueFromLastContainer.appendChild(continueFromLastLabel);
                    historyContainer.appendChild(continueFromLastContainer);
                    
                    // Botones para reiniciar historial
                    const resetGroupButton = document.createElement('button');
                    resetGroupButton.textContent = 'Reiniciar historial de este grupo';
                    resetGroupButton.className = 'lead-manager-secondary-button';
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
                    
                    resetGroupButton.addEventListener('mouseover', () => {
                      resetGroupButton.style.backgroundColor = '#e4e4e4';
                    });
                    
                    resetGroupButton.addEventListener('mouseout', () => {
                      resetGroupButton.style.backgroundColor = '#f0f0f0';
                    });
                    
                    resetGroupButton.addEventListener('click', () => {
                      if (confirm('¿Estás seguro de que deseas reiniciar el historial de este grupo? Esta acción no se puede deshacer.')) {
                        this.resetGroupHistory().then(() => {
                          this.updateHistoryStats();
                        });
                      }
                    });
                    
                    const resetAllButton = document.createElement('button');
                    resetAllButton.textContent = 'Reiniciar todo el historial';
                    resetAllButton.className = 'lead-manager-danger-button';
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
                    
                    resetAllButton.addEventListener('mouseover', () => {
                      resetAllButton.style.backgroundColor = '#f5c6cb';
                    });
                    
                    resetAllButton.addEventListener('mouseout', () => {
                      resetAllButton.style.backgroundColor = '#f8d7da';
                    });
                    
                    resetAllButton.addEventListener('click', () => {
                      if (confirm('¿Estás seguro de que deseas reiniciar TODO el historial de interacciones? Esta acción no se puede deshacer y afectará a TODOS los grupos.')) {
                        this.resetAllHistory().then(() => {
                          this.updateHistoryStats();
                        });
                      }
                    });
                    
                    historyContainer.appendChild(resetGroupButton);
                    historyContainer.appendChild(resetAllButton);
                  });
                  
                  // Insertar el contenedor de historial antes del contenedor de progreso
                  progressContainer.parentNode.insertBefore(historyContainer, progressContainer);
                  console.log('Sección de historial agregada correctamente');
                } else {
                  console.error('No se encontró el contenedor de progreso para insertar el historial');
                }
              } else {
                console.log('La sección de historial ya existe en el sidebar');
              }
              
              console.log('Sidebar mejorado correctamente');
            } catch (error) {
              console.error('Error al mejorar el sidebar:', error);
            }
          }
        }, 500);
      };      // Modificar el método show para mejorar el sidebar al mostrarse
      const originalShow = sidebar.show;
      sidebar.show = function() {
        // Llamar al método original primero
        originalShow.call(this);
        
        // Mejorar el sidebar después de mostrarlo
        setTimeout(() => {
          this.enhanceSidebar();
        }, 100);
      };
      
      console.log('Sidebar mejorado con funcionalidad de historial');
    }
  }, 1000);
});