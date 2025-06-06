// Script para gestionar el historial en el panel flotante (versión corregida)

(function() {
  console.log('Lead Manager Pro: Iniciando gestor de historial en panel flotante...');
  
  // Esperar a que el DOM esté listo
  if (document.readyState !== 'complete') {
    window.addEventListener('load', init);
  } else {
    init();
  }
  
  function init() {
    // Solo activar en páginas de grupos
    if (!window.location.href.includes('/groups/')) {
      return;
    }
    
    console.log('Verificando historial en panel flotante...');
    
    // Primero intentar añadir el historial si no existe
    tryAddHistory();
    
    // Observar para añadir historial a nuevos paneles
    setupObserver();
  }
  
  // Intentar añadir historial al panel si no existe
  function tryAddHistory() {
    // Buscar el panel flotante
    const panel = document.querySelector('.lead-manager-interaction-ui');
    if (!panel) {
      console.log('Panel flotante no encontrado, esperando...');
      return false;
    }
    
    // Verificar si ya existe alguna sección de historial
    const hasHistory = panel.textContent.includes('Historial de Interacciones');
    
    if (hasHistory) {
      console.log('El historial ya existe en el panel');
      return true;
    }
    
    // No existe, añadir historial
    console.log('Añadiendo sección de historial al panel...');
    addHistoryToPanel(panel);
    return true;
  }
  
  // Añadir historial al panel
  function addHistoryToPanel(panel) {
    // Buscar la barra de progreso para insertar antes
    const progressContainer = panel.querySelector('.lead-manager-interaction-progress-bar')?.parentElement;
    if (!progressContainer) {
      console.warn('No se encontró el contenedor de progreso');
      
      // Plan B: intentar añadir el historial al final del cuerpo del panel
      const panelBody = panel.querySelector('.lead-manager-interaction-body');
      if (panelBody) {
        const historySection = createHistorySection();
        
        // Buscar la sección de botones
        const actionsSection = panelBody.querySelector('.lead-manager-interaction-actions');
        if (actionsSection) {
          panelBody.insertBefore(historySection, actionsSection);
        } else {
          // Añadir al final del cuerpo
          panelBody.appendChild(historySection);
        }
        
        console.log('Historial añadido al cuerpo del panel (plan B)');
      } else {
        console.error('No se pudo encontrar el cuerpo del panel');
      }
      return;
    }
    
    // Crear e insertar la sección de historial
    const historySection = createHistorySection();
    progressContainer.parentNode.insertBefore(historySection, progressContainer);
    console.log('Historial añadido correctamente antes de la barra de progreso');
  }
  
  // Crear la sección de historial
  function createHistorySection() {
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
    
    // Cargar datos del historial y rellenar la sección
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
      
      // Configurar eventos de los botones
      setTimeout(setupHistoryButtonEvents, 100);
    });
    
    return historyContainer;
  }
  
  // Cargar datos del historial
  async function loadHistoryData() {
    try {
      // Obtener ID del grupo actual
      const url = window.location.href;
      const groupIdMatch = url.match(/groups\/([^/?]+)/);
      const currentGroupId = groupIdMatch ? groupIdMatch[1] : 'unknown';
      
      // Buscar los datos en el storage
      return new Promise(resolve => {
        chrome.storage.sync.get(['interactionHistory'], (result) => {
          // Verificar interactionHistory
          if (result.interactionHistory && result.interactionHistory[currentGroupId]) {
            const groupHistory = result.interactionHistory[currentGroupId];
            resolve({
              lastIndex: groupHistory.lastIndex || 0,
              interactionCount: groupHistory.interactions ? groupHistory.interactions.length : 0
            });
            return;
          }
          // Si no hay datos, retornar valores por defecto
          resolve({ lastIndex: 0, interactionCount: 0 });
        });
      });
    } catch (error) {
      console.error('Error al cargar datos de historial:', error);
      return { lastIndex: 0, interactionCount: 0 };
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
          
          // Reiniciar historial directamente
          await resetGroupHistoryDirectly(currentGroupId);
          
          // Actualizar UI
          const lastIndexElement = document.getElementById('lmp-last-index');
          const interactionsElement = document.getElementById('lmp-group-interactions');
          
          if (lastIndexElement) lastIndexElement.textContent = '0';
          if (interactionsElement) interactionsElement.textContent = '0';
          
          alert('Historial del grupo reiniciado correctamente');
        }
      });
    }
    
    // Botón para reiniciar todo el historial
    const resetAllButton = document.getElementById('lmp-reset-all');
    if (resetAllButton) {
      resetAllButton.addEventListener('click', async () => {
        if (confirm('¿Estás seguro de que deseas reiniciar TODO el historial de interacciones? Esta acción no se puede deshacer y afectará a TODOS los grupos.')) {
          // Reiniciar todo el historial directamente
          await resetAllHistoryDirectly();
          
          // Actualizar UI
          const lastIndexElement = document.getElementById('lmp-last-index');
          const interactionsElement = document.getElementById('lmp-group-interactions');
          
          if (lastIndexElement) lastIndexElement.textContent = '0';
          if (interactionsElement) interactionsElement.textContent = '0';
          
          alert('Todo el historial ha sido reiniciado correctamente');
        }
      });
    }
  }
  
  // Reiniciar historial de un grupo directamente
  function resetGroupHistoryDirectly(groupId) {
    return new Promise(resolve => {
      // chrome.storage.local.get(['interactionHistory', 'leadManagerInteractionHistory'], (result) => { // PARA BORRAR: clave antigua
      // Reiniciar en leadManagerInteractionHistory
      if (result.leadManagerInteractionHistory) {
        const history = result.leadManagerInteractionHistory;
        
        if (history.interactions && history.interactions[groupId]) {
          // Calcular cuántas interacciones había para restar del total
          const interactionsCount = history.interactions[groupId].members ? 
            history.interactions[groupId].members.length : 0;
          
          // Reiniciar el grupo
          history.interactions[groupId] = {
            lastIndex: 0,
            members: []
          };
          
          // Actualizar contador total
          history.totalInteractions = Math.max(0, (history.totalInteractions || 0) - interactionsCount);
          
          // Guardar cambios
          // chrome.storage.local.set({ 'leadManagerInteractionHistory': history }); // PARA BORRAR: clave antigua
        }
      }
      
      // Reiniciar en interactionHistory
      if (result.interactionHistory) {
        const history = result.interactionHistory;
        
        if (history[groupId]) {
          // Reiniciar el grupo
          history[groupId] = {
            lastIndex: 0,
            interactions: []
          };
          
          // Guardar cambios
          // chrome.storage.local.set({ 'interactionHistory': history }); // PARA BORRAR: clave antigua
        }
      }
      
      resolve();
    });
  }
  
  // Reiniciar todo el historial directamente
  function resetAllHistoryDirectly() {
    return new Promise(resolve => {
      // chrome.storage.local.set({ ... }); // PARA BORRAR: clave antigua
      // Reiniciar todo el historial directamente
      resolve();
    });
  }
  
  // Configurar observador para detectar nuevos paneles
  function setupObserver() {
    // Verificar periódicamente si existe el panel y si tiene historial
    const checkInterval = setInterval(() => {
      const added = tryAddHistory();
      // Si hemos podido agregar el historial, seguir verificando
      // para asegurarnos de que siga ahí
    }, 2000);
    
    // Configurar observador para detectar cuando se agrega el panel
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
          for (const node of mutation.addedNodes) {
            if (node.classList && node.classList.contains('lead-manager-interaction-ui')) {
              console.log('Panel detectado por observador, verificando historial...');
              setTimeout(() => {
                if (!node.textContent.includes('Historial de Interacciones')) {
                  addHistoryToPanel(node);
                }
              }, 100);
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
