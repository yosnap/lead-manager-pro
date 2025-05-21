// Inyector híbrido para el historial - Compatible con funcionalidad original

(function() {
  console.log('Lead Manager Pro: Iniciando inyector híbrido para historial...');
  
  // Esperar a que el DOM esté completamente cargado
  // Solo activar en páginas de grupos
  if (!window.location.href.includes('/groups/')) {
    console.log('No estamos en una página de grupo, no se iniciará el inyector de historial');
    return;
  }
  
  if (document.readyState !== 'complete') {
    window.addEventListener('load', init);
  } else {
    init();
  }
  
  function init() {
    console.log('DOM completamente cargado, inicializando inyector híbrido...');
    
    // Esperar a que los módulos originales estén disponibles
    waitForModules().then(useOriginalModules).catch(() => {
      console.warn('No se pudieron cargar los módulos originales, usando enfoque alternativo');
      // Si no se pueden cargar los módulos originales, usar enfoque alternativo
      setTimeout(createInteractionButton, 1500);
    });
    
    // Configurar observador para inyectar historial en panel existente
    setupMutationObserver();
    
    // También verificar periódicamente el panel flotante
    setInterval(() => {
      const panel = document.querySelector('.lead-manager-interaction-ui');
      if (panel && !panel.querySelector('#lead-manager-history-container')) {
        addHistoryToPanel(panel);
      }
    }, 2000);
  }
  
  // Esperar a que los módulos originales estén disponibles
  function waitForModules() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 10;
      
      const checkModules = () => {
        if (window.leadManagerPro && 
            window.leadManagerPro.memberInteractionUI) {
          resolve();
          return;
        }
        
        attempts++;
        if (attempts >= maxAttempts) {
          reject(new Error('Módulos no disponibles después de varios intentos'));
          return;
        }
        
        setTimeout(checkModules, 500);
      };
      
      checkModules();
    });
  }
  
  // Usar los módulos originales
  function useOriginalModules() {
    console.log('Módulos originales disponibles, integrando historial...');
    
    // Referencia al módulo UI original
    const interactionUI = window.leadManagerPro.memberInteractionUI;
    
    // Obtener la función original para crear la UI
    const originalCreateUI = interactionUI.createUI;
    
    // Reemplazar con nuestra versión que agrega el historial
    interactionUI.createUI = function() {
      // Llamar a la función original
      const container = originalCreateUI.call(this);
      
      // Agregar historial al panel
      setTimeout(() => {
        addHistoryToPanel(container);
      }, 100);
      
      return container;
    };
    
    // Mejorar el método de inicio de interacción para usar el historial
    enhanceStartInteraction(interactionUI);
    
    console.log('Módulos originales mejorados con funcionalidad de historial');
  }
  
  // Mejorar la función de inicio de interacción
  function enhanceStartInteraction(interactionUI) {
    // Guardar referencia a la función original
    const originalStartInteraction = interactionUI.startInteraction;
    
    // Reemplazar con nuestra versión
    interactionUI.startInteraction = async function() {
      try {
        // Verificar si se debe continuar desde el último índice
        const continueFromLastCheckbox = document.getElementById('lmp-continue-from-last');
        const continueFromLast = continueFromLastCheckbox ? continueFromLastCheckbox.checked : true;
        
        // Obtener el último índice del historial si es necesario
        let startFromIndex = 0;
        
        if (continueFromLast) {
          const historyData = await loadHistoryData();
          startFromIndex = historyData.lastIndex || 0;
          console.log(`Continuando desde el índice ${startFromIndex} según historial`);
        }
        
        // Modificar la interacción con miembros para registrar en el historial
        if (window.leadManagerPro && window.leadManagerPro.memberInteraction) {
          const memberInteraction = window.leadManagerPro.memberInteraction;
          
          // Guardar función original
          const originalStartInteractionFn = memberInteraction.startInteraction;
          
          // Reemplazar con nuestra versión
          memberInteraction.startInteraction = async function(callback) {
            // Establecer índice inicial
            this.currentMemberIndex = startFromIndex;
            
            return await originalStartInteractionFn.call(this, async (progress) => {
              try {
                // Actualizar índice real
                if (progress.type === 'progress') {
                  progress.actualMemberIndex = progress.memberIndex + startFromIndex;
                  
                  // Registrar interacción exitosa
                  if (progress.messageSent) {
                    // Obtener el mensaje que se envió
                    let messageText = "Mensaje enviado";
                    if (this.lastSentMessageIndex !== undefined && 
                        Array.isArray(this.messages)) {
                      const msgIndex = this.lastSentMessageIndex;
                      if (msgIndex >= 0 && msgIndex < this.messages.length) {
                        messageText = this.messages[msgIndex];
                      }
                    }
                    
                    // Registrar en el historial
                    await registerInteraction(progress.actualMemberIndex, messageText);
                    
                    // Actualizar UI del historial
                    updateHistoryUI(progress.actualMemberIndex);
                  }
                }
              } catch (error) {
                console.error('Error al procesar progreso:', error);
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
      } catch (error) {
        console.error('Error en startInteraction mejorado:', error);
        // En caso de error, llamar a la función original directamente
        return await originalStartInteraction.call(this);
      }
    };
  }
  
  // Crear botón de interacción (versión alternativa)
  function createInteractionButton() {
    // Verificar si ya existe
    if (document.querySelector('.lead-manager-action-button')) {
      return;
    }
    
    console.log('Creando botón de interacción alternativo...');
    
    // Crear el botón
    const button = document.createElement('button');
    button.className = 'lead-manager-action-button';
    button.textContent = 'Interactuar con Miembros';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 10px 15px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 5px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      z-index: 9998;
    `;
    
    // Agregar evento de clic
    button.addEventListener('click', () => {
      // Verificar si ya existe el panel
      let panel = document.querySelector('.lead-manager-interaction-ui');
      if (panel) {
        // Mostrar panel existente
        panel.style.display = 'flex';
        return;
      }
      
      // Intentar usar el módulo original primero
      if (window.leadManagerPro && window.leadManagerPro.memberInteractionUI) {
        window.leadManagerPro.memberInteractionUI.show();
        return;
      }
      
      // Crear nuevo panel (alternativa)
      const newPanel = createInteractionPanel();
      addHistoryToPanel(newPanel);
    });
    
    // Agregar al documento
    document.body.appendChild(button);
  }
  
  // Crear panel de interacción básico (alternativa)
  function createInteractionPanel() {
    // Crear estructura básica como respaldo
    // [Código omitido por brevedad - ya está en el script anterior]
    console.log('Creando panel alternativo - solo estructura básica');
    
    const panel = document.createElement('div');
    panel.className = 'lead-manager-interaction-ui';
    // Agregar estilos y estructura básica...
    
    document.body.appendChild(panel);
    return panel;
  }
  
  // Agregar historial a un panel existente
  function addHistoryToPanel(panel) {
    console.log('Intentando agregar historial a panel existente...');
    
    // Verificar si ya existe la sección de historial (más completo)
    if (panel.querySelector('#lead-manager-history-container') || 
        panel.querySelectorAll('*:contains("Historial de Interacciones")').length > 0 || 
        panel.textContent.includes('Historial de Interacciones')) {
      console.log('El historial ya existe en el panel, no se duplicará');
      return;
    }
    
    // Buscar dónde insertar (antes de la barra de progreso)
    const progressBar = panel.querySelector('.lead-manager-interaction-progress-bar');
    if (!progressBar) {
      console.warn('No se encontró la barra de progreso');
      return;
    }
    
    const progressContainer = progressBar.parentElement;
    if (!progressContainer) {
      console.warn('No se encontró el contenedor de la barra de progreso');
      return;
    }
    
    // Crear sección de historial
    const historyContainer = document.createElement('div');
    historyContainer.id = 'lead-manager-history-container';
    historyContainer.style.cssText = `
      margin-top: 16px;
      margin-bottom: 16px;
      padding: 12px;
      background-color: #f5f6f7;
      border-radius: 6px;
      border: 1px solid #dddfe2;
    `;
    
    // Cargar datos del historial
    loadHistoryData().then(historyData => {
      historyContainer.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 10px; color: #4267B2;">
          Historial de Interacciones
        </div>
        
        <div style="margin-bottom: 12px;">
          <div style="margin-bottom: 6px;">
            <strong>Último índice:</strong> <span id="lmp-last-index">${historyData.lastIndex || 0}</span>
          </div>
          <div>
            <strong>Interacciones en este grupo:</strong> <span id="lmp-group-interactions">${historyData.interactionCount || 0}</span>
          </div>
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
      progressContainer.parentNode.insertBefore(historyContainer, progressContainer);
      console.log('Historial agregado correctamente al panel');
      
      // Configurar eventos de los botones
      setupHistoryButtonEvents();
    });
  }
  
  // Cargar datos del historial
  async function loadHistoryData() {
    try {
      // Obtener ID del grupo actual
      const url = window.location.href;
      const groupIdMatch = url.match(/groups\/([^/?]+)/);
      const currentGroupId = groupIdMatch ? groupIdMatch[1] : 'unknown';
      
      // Intentar usar el módulo original primero
      if (window.leadManagerPro && window.leadManagerPro.interactionHistory) {
        const groupHistory = await window.leadManagerPro.interactionHistory.getGroupHistory(currentGroupId);
        return {
          lastIndex: groupHistory.lastIndex || 0,
          interactionCount: groupHistory.members ? groupHistory.members.length : 0
        };
      }
      
      // Alternativa: cargar directamente desde storage
      return new Promise(resolve => {
        chrome.storage.local.get(['interactionHistory', 'leadManagerInteractionHistory'], (result) => {
          // Intentar con ambas claves
          let history = result.leadManagerInteractionHistory || result.interactionHistory || {};
          
          // Formato leadManagerInteractionHistory
          if (history.interactions && history.interactions[currentGroupId]) {
            const groupHistory = history.interactions[currentGroupId];
            resolve({
              lastIndex: groupHistory.lastIndex || 0,
              interactionCount: groupHistory.members ? groupHistory.members.length : 0
            });
            return;
          }
          
          // Formato interactionHistory
          if (history[currentGroupId]) {
            const groupHistory = history[currentGroupId];
            resolve({
              lastIndex: groupHistory.lastIndex || 0,
              interactionCount: (groupHistory.interactions || []).length || 0
            });
            return;
          }
          
          // No hay datos
          resolve({ lastIndex: 0, interactionCount: 0 });
        });
      });
    } catch (error) {
      console.error('Error al cargar datos de historial:', error);
      return { lastIndex: 0, interactionCount: 0 };
    }
  }
  
  // Registrar una interacción en el historial
  async function registerInteraction(index, messageText) {
    try {
      // Obtener ID del grupo actual
      const url = window.location.href;
      const groupIdMatch = url.match(/groups\/([^/?]+)/);
      const currentGroupId = groupIdMatch ? groupIdMatch[1] : 'unknown';
      
      // Intentar usar el módulo original primero
      if (window.leadManagerPro && window.leadManagerPro.interactionHistory) {
        const memberData = {
          userId: `user-${Date.now()}`,
          userName: 'Usuario',
          messageText: messageText,
          index: index
        };
        
        await window.leadManagerPro.interactionHistory.registerInteraction(currentGroupId, memberData);
        return true;
      }
      
      // Alternativa: actualizar directamente en storage
      return new Promise((resolve) => {
        chrome.storage.local.get(['interactionHistory', 'leadManagerInteractionHistory'], (result) => {
          // Actualizar leadManagerInteractionHistory si existe
          if (result.leadManagerInteractionHistory) {
            const history = result.leadManagerInteractionHistory;
            
            // Asegurar que existe la estructura
            if (!history.interactions) {
              history.interactions = {};
            }
            
            if (!history.interactions[currentGroupId]) {
              history.interactions[currentGroupId] = {
                lastIndex: 0,
                members: []
              };
            }
            
            // Incrementar contador
            history.totalInteractions = (history.totalInteractions || 0) + 1;
            
            // Agregar miembro
            history.interactions[currentGroupId].members.push({
              userId: `user-${Date.now()}`,
              userName: 'Usuario',
              interactionDate: new Date().toISOString(),
              messageText: messageText,
              interactionId: `${currentGroupId}-${Date.now()}`
            });
            
            // Actualizar último índice
            history.interactions[currentGroupId].lastIndex = index + 1;
            
            // Guardar en storage
            chrome.storage.local.set({ 'leadManagerInteractionHistory': history });
          }
          
          // Actualizar interactionHistory si existe
          if (result.interactionHistory) {
            const history = result.interactionHistory;
            
            // Asegurar que existe la estructura
            if (!history[currentGroupId]) {
              history[currentGroupId] = {
                lastIndex: 0,
                interactions: []
              };
            }
            
            // Agregar interacción
            history[currentGroupId].interactions.push({
              index: index,
              timestamp: new Date().toISOString(),
              message: messageText
            });
            
            // Actualizar último índice
            history[currentGroupId].lastIndex = index + 1;
            
            // Guardar en storage
            chrome.storage.local.set({ 'interactionHistory': history });
          }
          
          resolve(true);
        });
      });
    } catch (error) {
      console.error('Error al registrar interacción:', error);
      return false;
    }
  }
  
  // Actualizar UI del historial después de una interacción
  function updateHistoryUI(index) {
    const lastIndexElement = document.getElementById('lmp-last-index');
    const interactionsElement = document.getElementById('lmp-group-interactions');
    
    if (lastIndexElement) {
      lastIndexElement.textContent = (index + 1).toString();
    }
    
    if (interactionsElement) {
      const currentCount = parseInt(interactionsElement.textContent || '0');
      interactionsElement.textContent = (currentCount + 1).toString();
    }
  }
  
  // Configurar eventos para los botones de historial
  function setupHistoryButtonEvents() {
    // Botón para reiniciar historial del grupo
    const resetGroupButton = document.getElementById('lmp-reset-group');
    if (resetGroupButton) {
      resetGroupButton.addEventListener('click', async () => {
        if (confirm('¿Estás seguro de que deseas reiniciar el historial de este grupo? Esta acción no se puede deshacer.')) {
          // Obtener ID del grupo actual
          const url = window.location.href;
          const groupIdMatch = url.match(/groups\/([^/?]+)/);
          const currentGroupId = groupIdMatch ? groupIdMatch[1] : 'unknown';
          
          // Intentar usar el módulo original primero
          if (window.leadManagerPro && window.leadManagerPro.interactionHistory) {
            await window.leadManagerPro.interactionHistory.resetGroupHistory(currentGroupId);
          } else {
            // Alternativa: resetear directamente en storage
            await resetGroupHistoryDirectly(currentGroupId);
          }
          
          // Actualizar UI
          const lastIndexElement = document.getElementById('lmp-last-index');
          const interactionsElement = document.getElementById('lmp-group-interactions');
          
          if (lastIndexElement) lastIndexElement.textContent = '0';
          if (interactionsElement) interactionsElement.textContent = '0';
        }
      });
    }
    
    // Botón para reiniciar todo el historial
    const resetAllButton = document.getElementById('lmp-reset-all');
    if (resetAllButton) {
      resetAllButton.addEventListener('click', async () => {
        if (confirm('¿Estás seguro de que deseas reiniciar TODO el historial de interacciones? Esta acción no se puede deshacer y afectará a TODOS los grupos.')) {
          // Intentar usar el módulo original primero
          if (window.leadManagerPro && window.leadManagerPro.interactionHistory) {
            await window.leadManagerPro.interactionHistory.resetAllHistory();
          } else {
            // Alternativa: resetear directamente en storage
            await resetAllHistoryDirectly();
          }
          
          // Actualizar UI
          const lastIndexElement = document.getElementById('lmp-last-index');
          const interactionsElement = document.getElementById('lmp-group-interactions');
          
          if (lastIndexElement) lastIndexElement.textContent = '0';
          if (interactionsElement) interactionsElement.textContent = '0';
        }
      });
    }
  }
  
  // Reiniciar historial de un grupo directamente
  function resetGroupHistoryDirectly(groupId) {
    return new Promise(resolve => {
      chrome.storage.local.get(['interactionHistory', 'leadManagerInteractionHistory'], (result) => {
        // Resetear leadManagerInteractionHistory si existe
        if (result.leadManagerInteractionHistory) {
          const history = result.leadManagerInteractionHistory;
          
          if (history.interactions && history.interactions[groupId]) {
            // Guardar cantidad de interacciones para restar del total
            const interactionCount = history.interactions[groupId].members ? 
              history.interactions[groupId].members.length : 0;
            
            // Resetear el grupo
            history.interactions[groupId] = {
              lastIndex: 0,
              members: []
            };
            
            // Actualizar contador total
            history.totalInteractions = Math.max(0, (history.totalInteractions || 0) - interactionCount);
            
            // Guardar en storage
            chrome.storage.local.set({ 'leadManagerInteractionHistory': history });
          }
        }
        
        // Resetear interactionHistory si existe
        if (result.interactionHistory) {
          const history = result.interactionHistory;
          
          if (history[groupId]) {
            // Resetear el grupo
            history[groupId] = {
              lastIndex: 0,
              interactions: []
            };
            
            // Guardar en storage
            chrome.storage.local.set({ 'interactionHistory': history });
          }
        }
        
        resolve();
      });
    });
  }
  
  // Reiniciar todo el historial directamente
  function resetAllHistoryDirectly() {
    return new Promise(resolve => {
      chrome.storage.local.set({
        'leadManagerInteractionHistory': { interactions: {}, totalInteractions: 0 },
        'interactionHistory': {}
      }, resolve);
    });
  }
  
  // Configurar observador para detectar cuando se agrega el panel
  function setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
          for (const node of mutation.addedNodes) {
            if (node.classList && node.classList.contains('lead-manager-interaction-ui')) {
              console.log('Panel detectado por observador, agregando historial...');
              setTimeout(() => {
                addHistoryToPanel(node);
              }, 100);
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
  }
})();
