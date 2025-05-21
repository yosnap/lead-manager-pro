// Script simplificado para inyectar el historial directamente en el panel flotante

(function() {
  console.log('Iniciando inyector directo de historial en panel flotante...');
  
  // Función para inyectar el historial
  function injectHistory() {
    // Buscar el panel flotante
    const floatingPanel = document.querySelector('.lead-manager-interaction-ui');
    if (!floatingPanel) {
      console.log('Panel flotante no encontrado, se intentará más tarde.');
      return false;
    }
    
    console.log('Panel flotante encontrado, intentando inyectar historial...');
    
    // Verificar si ya existe el historial
    if (floatingPanel.querySelector('#lead-manager-history-container')) {
      console.log('El historial ya existe en el panel.');
      return true;
    }
    
    // Buscar donde insertar (antes de la sección de progreso)
    const progressBar = floatingPanel.querySelector('.lead-manager-interaction-progress-bar');
    if (!progressBar) {
      console.log('No se encontró la barra de progreso.');
      return false;
    }
    
    const progressContainer = progressBar.parentElement;
    if (!progressContainer) {
      console.log('No se encontró el contenedor de la barra de progreso.');
      return false;
    }
    
    console.log('Insertando historial antes de:', progressContainer);
    
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
    
    // Cargar datos de historial
    loadHistoryData().then(historyData => {
      historyContainer.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 10px; color: #4267B2;">Historial de Interacciones</div>
        <div style="margin-bottom: 8px;">
          <div style="margin-bottom: 4px;"><strong>Último índice:</strong> <span id="lmp-last-index">${historyData.lastIndex || 0}</span></div>
          <div><strong>Interacciones en este grupo:</strong> <span id="lmp-group-interactions">${historyData.interactionCount || 0}</span></div>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
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
      
      // Insertar antes del contenedor de progreso
      progressContainer.parentNode.insertBefore(historyContainer, progressContainer);
      
      // Agregar eventos a los botones
      setupHistoryButtonEvents();
      
      console.log('Historial insertado correctamente.');
    });
    
    return true;
  }
  
  // Cargar datos de historial
  async function loadHistoryData() {
    try {
      // Obtener ID del grupo actual
      const url = window.location.href;
      const groupIdMatch = url.match(/groups\/([^/?]+)/);
      const currentGroupId = groupIdMatch ? groupIdMatch[1] : 'unknown';
      
      // Si tenemos acceso al módulo de historial, úsalo
      if (window.leadManagerPro && window.leadManagerPro.interactionHistory) {
        const groupHistory = await window.leadManagerPro.interactionHistory.getGroupHistory(currentGroupId);
        return {
          lastIndex: groupHistory.lastIndex || 0,
          interactionCount: groupHistory.members ? groupHistory.members.length : 0
        };
      }
      
      // Alternativa: cargar directamente desde storage
      return new Promise(resolve => {
        chrome.storage.local.get(['interactionHistory'], (result) => {
          const history = result.interactionHistory || {};
          const groupHistory = history[currentGroupId] || { lastIndex: 0, interactions: [] };
          
          resolve({
            lastIndex: groupHistory.lastIndex || 0,
            interactionCount: groupHistory.interactions ? groupHistory.interactions.length : 0
          });
        });
      });
    } catch (error) {
      console.error('Error al cargar datos de historial:', error);
      return { lastIndex: 0, interactionCount: 0 };
    }
  }
  
  // Configurar eventos para los botones del historial
  function setupHistoryButtonEvents() {
    // Botón para reiniciar historial del grupo actual
    const resetGroupButton = document.getElementById('lmp-reset-group');
    if (resetGroupButton) {
      resetGroupButton.addEventListener('click', async () => {
        if (confirm('¿Estás seguro de que deseas reiniciar el historial de este grupo? Esta acción no se puede deshacer.')) {
          // Obtener ID del grupo actual
          const url = window.location.href;
          const groupIdMatch = url.match(/groups\/([^/?]+)/);
          const currentGroupId = groupIdMatch ? groupIdMatch[1] : 'unknown';
          
          // Reiniciar historial
          if (window.leadManagerPro && window.leadManagerPro.interactionHistory) {
            await window.leadManagerPro.interactionHistory.resetGroupHistory(currentGroupId);
          } else {
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
          // Reiniciar todo el historial
          if (window.leadManagerPro && window.leadManagerPro.interactionHistory) {
            await window.leadManagerPro.interactionHistory.resetAllHistory();
          } else {
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
  
  // Reiniciar historial de un grupo directamente en storage
  function resetGroupHistoryDirectly(groupId) {
    return new Promise(resolve => {
      chrome.storage.local.get(['interactionHistory'], (result) => {
        const history = result.interactionHistory || {};
        
        // Reiniciar el grupo
        if (history[groupId]) {
          history[groupId] = { lastIndex: 0, interactions: [] };
        }
        
        // Guardar en storage
        chrome.storage.local.set({ 'interactionHistory': history }, resolve);
      });
    });
  }
  
  // Reiniciar todo el historial directamente en storage
  function resetAllHistoryDirectly() {
    return new Promise(resolve => {
      chrome.storage.local.set({ 'interactionHistory': {} }, resolve);
    });
  }
  
  // Función para reinsertar los botones verdes en la parte inferior derecha
  function restoreActionButtons() {
    // Verificar si ya existen
    if (document.querySelector('.lead-manager-action-buttons')) {
      return;
    }
    
    // Crear contenedor de botones
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'lead-manager-action-buttons';
    buttonContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 9998;
    `;
    
    // Crear botón para abrir el panel flotante
    const openPanelButton = document.createElement('button');
    openPanelButton.textContent = 'Interactuar con Miembros';
    openPanelButton.style.cssText = `
      padding: 10px 15px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    
    // Evento para abrir el panel flotante
    openPanelButton.addEventListener('click', () => {
      // Si el panel ya existe, mostrarlo
      let panel = document.querySelector('.lead-manager-interaction-ui');
      if (panel) {
        panel.style.display = 'flex';
        return;
      }
      
      // Verificar si podemos usar el módulo de interacción
      if (window.leadManagerPro && window.leadManagerPro.memberInteractionUI) {
        window.leadManagerPro.memberInteractionUI.show();
      } else {
        console.warn('No se encontró el módulo de interacción, intentando método alternativo...');
        createBasicInteractionPanel();
      }
    });
    
    // Añadir botón al contenedor
    buttonContainer.appendChild(openPanelButton);
    
    // Añadir contenedor al body
    document.body.appendChild(buttonContainer);
    
    console.log('Botones de acción restaurados.');
  }
  
  // Función para crear un panel de interacción básico si el módulo falla
  function createBasicInteractionPanel() {
    // Verificar si ya existe
    if (document.querySelector('.lead-manager-interaction-ui')) {
      return;
    }
    
    // Crear panel
    const panel = document.createElement('div');
    panel.className = 'lead-manager-interaction-ui';
    panel.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 350px;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;
    
    // Crear cabecera
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 12px 16px;
      background-color: #4267B2;
      color: white;
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    
    const title = document.createElement('div');
    title.textContent = 'Interacción con Miembros';
    
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
    `;
    closeButton.addEventListener('click', () => panel.style.display = 'none');
    
    header.appendChild(title);
    header.appendChild(closeButton);
    
    // Crear cuerpo
    const body = document.createElement('div');
    body.style.cssText = `
      padding: 16px;
      max-height: 80vh;
      overflow-y: auto;
    `;
    
    // Añadir mensaje de información
    body.innerHTML = `
      <div style="margin-bottom: 16px;">
        Para usar esta funcionalidad, refresca la página y vuelve a intentarlo.
        Si el problema persiste, contacta con el desarrollador.
      </div>
    `;
    
    // Ensamblar panel
    panel.appendChild(header);
    panel.appendChild(body);
    
    // Añadir al documento
    document.body.appendChild(panel);
  }
  
  // Iniciar inyección
  function initialize() {
    // Intentar inyectar historial inmediatamente
    const injected = injectHistory();
    
    // Si no se pudo inyectar, configurar para detectar cuando aparezca el panel
    if (!injected) {
      console.log('Configurando detección continua para el panel flotante...');
      
      // Usar MutationObserver para detectar cambios en el DOM
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length) {
            for (const node of mutation.addedNodes) {
              if (node.classList && node.classList.contains('lead-manager-interaction-ui')) {
                console.log('Panel flotante detectado por MutationObserver, inyectando historial...');
                injectHistory();
                break;
              }
            }
          }
        }
      });
      
      // Observar cambios en el body
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      // También usar un intervalo para verificar periódicamente
      const intervalId = setInterval(() => {
        if (injectHistory()) {
          clearInterval(intervalId);
        }
      }, 1000);
    }
    
    // Restaurar botones de acción
    setTimeout(restoreActionButtons, 1000);
  }
  
  // Iniciar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
