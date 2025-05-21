// Módulo para corregir y mejorar el sidebar de interacción con miembros

(() => {
  window.addEventListener('DOMContentLoaded', () => {
    // Esperar a que se inicialice la extensión
    const waitForInitialization = setInterval(() => {
      // Verificar que el módulo principal de interacción esté cargado
      if (window.leadManagerPro && window.leadManagerPro.memberInteractionSidebar) {
        clearInterval(waitForInitialization);
        
        console.log('Aplicando correcciones al sidebar de interacción con miembros...');
        
        // Referencia al módulo de sidebar
        const memberInteractionSidebar = window.leadManagerPro.memberInteractionSidebar;
        
        // Referencia al módulo de historial
        const interactionHistory = window.leadManagerPro.interactionHistory;
        
        // Verificar que tenemos las dependencias necesarias
        if (!interactionHistory) {
          console.error('El módulo de historial no está disponible. Creando uno provisional...');
          
          // Crear una versión básica del módulo de historial si no existe
          window.leadManagerPro.interactionHistory = {
            async getGroupHistory(groupId) {
              return { lastIndex: 0, members: [] };
            },
            async registerInteraction() {
              return true;
            },
            async resetGroupHistory() {
              return true;
            },
            async resetAllHistory() {
              return true;
            }
          };
        }
        
        // Guardar referencia original de createSidebar para modificarla
        const originalCreateSidebar = memberInteractionSidebar.createSidebar;
        
        // Sobreescribir el método con nuestra versión mejorada
        memberInteractionSidebar.createSidebar = function() {
          // Llamar al método original para crear el sidebar base
          const container = originalCreateSidebar.call(this);
          
          // Buscar el contenedor de historial
          const historyContainer = container.querySelector('#lead-manager-history-container');
          
          // Si no existe el contenedor de historial, lo creamos
          if (!historyContainer) {
            console.log('Añadiendo sección de historial al sidebar de interacción...');
            
            // Buscar el contenedor donde insertar el historial (justo antes de la sección de progreso)
            const progressContainer = container.querySelector('.lead-manager-progress');
            
            if (progressContainer) {
              // Crear contenedor para el historial
              const historySection = document.createElement('div');
              historySection.id = 'lead-manager-history-container';
              historySection.className = 'lead-manager-history-section';
              historySection.style.cssText = `
                margin-bottom: 16px;
                padding: 12px;
                background-color: #f0f2f5;
                border-radius: 8px;
              `;
              
              // Extraer el ID del grupo actual de la URL
              const url = window.location.href;
              const groupIdMatch = url.match(/groups\/([^/?]+)/);
              const currentGroupId = groupIdMatch ? groupIdMatch[1] : '';
              
              // Función para cargar el historial
              const loadHistoryData = async () => {
                try {
                  if (!interactionHistory) return { lastIndex: 0, interactionCount: 0 };
                  
                  const groupHistory = await interactionHistory.getGroupHistory(currentGroupId);
                  return {
                    lastIndex: groupHistory.lastIndex || 0,
                    interactionCount: groupHistory.members ? groupHistory.members.length : 0
                  };
                } catch (error) {
                  console.error('Error al cargar datos de historial:', error);
                  return { lastIndex: 0, interactionCount: 0 };
                }
              };
              
              // Cargar y mostrar los datos de historial
              loadHistoryData().then(historyData => {
                // Título de la sección
                const historyTitle = document.createElement('div');
                historyTitle.textContent = 'Historial de Interacciones';
                historyTitle.style.cssText = `
                  font-weight: bold;
                  margin-bottom: 10px;
                `;
                historySection.appendChild(historyTitle);
                
                // Estadísticas
                const statsContainer = document.createElement('div');
                statsContainer.style.marginBottom = '12px';
                
                // Último índice
                const lastIndexDiv = document.createElement('div');
                lastIndexDiv.innerHTML = `<strong>Último índice:</strong> <span id="lmp-last-index">${historyData.lastIndex || 0}</span>`;
                lastIndexDiv.style.marginBottom = '6px';
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
                  margin-bottom: 12px;
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
                  background-color: #E4E6EB;
                  border: none;
                  border-radius: 6px;
                  cursor: pointer;
                  color: #050505;
                  font-weight: bold;
                `;
                
                resetGroupButton.addEventListener('click', async () => {
                  if (confirm('¿Estás seguro de que deseas reiniciar el historial de este grupo? Esta acción no se puede deshacer.')) {
                    if (interactionHistory && interactionHistory.resetGroupHistory) {
                      await interactionHistory.resetGroupHistory(currentGroupId);
                      
                      // Actualizar UI
                      const lastIndexElement = historySection.querySelector('#lmp-last-index');
                      const interactionsElement = historySection.querySelector('#lmp-group-interactions');
                      
                      if (lastIndexElement) lastIndexElement.textContent = '0';
                      if (interactionsElement) interactionsElement.textContent = '0';
                    }
                  }
                });
                
                const resetAllButton = document.createElement('button');
                resetAllButton.textContent = 'Reiniciar todo el historial';
                resetAllButton.style.cssText = `
                  display: block;
                  width: 100%;
                  padding: 8px;
                  background-color: #FFEBE9;
                  border: none;
                  border-radius: 6px;
                  cursor: pointer;
                  color: #B71C1C;
                  font-weight: bold;
                `;
                
                resetAllButton.addEventListener('click', async () => {
                  if (confirm('¿Estás seguro de que deseas reiniciar TODO el historial de interacciones? Esta acción no se puede deshacer y afectará a TODOS los grupos.')) {
                    if (interactionHistory && interactionHistory.resetAllHistory) {
                      await interactionHistory.resetAllHistory();
                      
                      // Actualizar UI
                      const lastIndexElement = historySection.querySelector('#lmp-last-index');
                      const interactionsElement = historySection.querySelector('#lmp-group-interactions');
                      
                      if (lastIndexElement) lastIndexElement.textContent = '0';
                      if (interactionsElement) interactionsElement.textContent = '0';
                    }
                  }
                });
                
                historySection.appendChild(resetGroupButton);
                historySection.appendChild(resetAllButton);
                
                // Insertar la sección de historial antes de la sección de progreso
                progressContainer.parentNode.insertBefore(historySection, progressContainer);
              });
            }
          }
          
          return container;
        };
        
        // Sobreescribir el método startInteraction para usar el historial
        const originalStartInteraction = memberInteractionSidebar.startInteraction;
        
        memberInteractionSidebar.startInteraction = async function(progressFill, progressStatus, options = {}) {
          try {
            // Comprobar si debemos continuar desde el último índice
            const continueFromLastCheckbox = document.getElementById('lmp-continue-from-last');
            const continueFromLast = options.continueFromLast !== undefined ? 
              options.continueFromLast : 
              (continueFromLastCheckbox ? continueFromLastCheckbox.checked : true);
            
            // Si debemos continuar y tenemos historial
            if (continueFromLast && interactionHistory) {
              // Extraer ID del grupo
              const url = window.location.href;
              const groupIdMatch = url.match(/groups\/([^/?]+)/);
              const currentGroupId = groupIdMatch ? groupIdMatch[1] : '';
              
              if (currentGroupId) {
                // Obtener el último índice procesado
                const groupHistory = await interactionHistory.getGroupHistory(currentGroupId);
                const lastIndex = groupHistory.lastIndex || 0;
                
                // Si hay un índice guardado, usarlo como punto de inicio
                if (lastIndex > 0) {
                  console.log(`Continuando interacción desde índice ${lastIndex} según el historial`);
                  options.startFromIndex = lastIndex;
                }
              }
            }
            
            // Llamar al método original con las opciones actualizadas
            return await originalStartInteraction.call(this, progressFill, progressStatus, options);
          } catch (error) {
            console.error('Error al iniciar interacción con historial:', error);
            
            // En caso de error, llamar al método original sin modificar
            return await originalStartInteraction.call(this, progressFill, progressStatus, options);
          }
        };
        
        console.log('Correcciones aplicadas al sidebar de interacción con miembros');
      }
    }, 1000);
  });
})();