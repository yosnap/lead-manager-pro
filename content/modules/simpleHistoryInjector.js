// Inyector simple e independiente para el historial e interacciones
// No depende de otros módulos para funcionar correctamente

(function() {
  console.log('Lead Manager Pro: Iniciando inyector simple de historial e interacciones...');
  
  // Esperar a que el DOM esté completamente cargado
  if (document.readyState !== 'complete') {
    window.addEventListener('load', init);
  } else {
    init();
  }
  
  function init() {
    console.log('DOM completamente cargado, inicializando inyector simple...');
    
    // Primero restaurar el botón de interacción
    setTimeout(createInteractionButton, 1000);
    
    // Verificar periódicamente si el panel flotante existe para agregar el historial
    const checkInterval = setInterval(() => {
      const panel = document.querySelector('.lead-manager-interaction-ui');
      if (panel && !panel.querySelector('#lead-manager-history-container')) {
        clearInterval(checkInterval);
        addHistoryToPanel(panel);
      }
    }, 1000);
    
    // Observar cambios en el DOM para detectar cuando se agrega el panel
    setupMutationObserver();
  }
  
  // Crear botón de interacción en la esquina inferior derecha
  function createInteractionButton() {
    // Verificar si ya existe
    if (document.querySelector('.lead-manager-action-button')) {
      return;
    }
    
    console.log('Creando botón de interacción...');
    
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
      
      // Crear nuevo panel
      createInteractionPanel();
    });
    
    // Agregar al documento
    document.body.appendChild(button);
  }
  
  // Crear panel de interacción desde cero
  function createInteractionPanel() {
    console.log('Creando panel de interacción desde cero...');
    
    // Crear el contenedor principal
    const panel = document.createElement('div');
    panel.className = 'lead-manager-interaction-ui';
    panel.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 350px;
      max-height: 90vh;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 9999;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;
    
    // Crear la cabecera
    const header = document.createElement('div');
    header.className = 'lead-manager-interaction-header';
    header.style.cssText = `
      padding: 12px 16px;
      background-color: rgb(66, 103, 178);
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
    
    // Crear el cuerpo
    const body = document.createElement('div');
    body.className = 'lead-manager-interaction-body';
    body.style.cssText = `
      padding: 16px;
      max-height: calc(90vh - 50px);
      overflow-y: auto;
      scrollbar-width: thin;
    `;
    
    // Agregar contenido básico
    body.innerHTML = `
      <style>
        .lead-manager-interaction-body::-webkit-scrollbar {
          width: 8px;
        }
        .lead-manager-interaction-body::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .lead-manager-interaction-body::-webkit-scrollbar-thumb {
          background: #CED0D4;
          border-radius: 4px;
        }
        .lead-manager-interaction-body::-webkit-scrollbar-thumb:hover {
          background: #AAAAAA;
        }
      </style>
      
      <div style="margin-bottom: 16px;">
        Esta herramienta te permite interactuar con miembros del grupo de Facebook,
        haciendo hover sobre cada uno y abriendo una ventana de mensaje después de un tiempo de espera.
      </div>
      
      <div style="font-weight: bold; margin-bottom: 8px;">
        Selecciona el tipo de miembros:
      </div>
      
      <select style="width: 100%; padding: 8px; margin-bottom: 16px; border-radius: 4px; border: 1px solid #CED0D4;">
        <option value="common">Miembros con cosas en común</option>
        <option value="newMembers">Nuevos miembros del grupo</option>
        <option value="admins">Administradores y moderadores</option>
      </select>
    `;
    
    // Agregar la sección de historial
    const historySection = createHistorySection();
    body.appendChild(historySection);
    
    // Agregar la barra de progreso
    const progressSection = document.createElement('div');
    progressSection.style.cssText = `margin-bottom: 16px;`;
    progressSection.innerHTML = `
      <div class="lead-manager-interaction-progress-bar" style="height: 6px; background-color: #EBEDF0; border-radius: 3px; overflow: hidden; margin-bottom: 8px;">
        <div class="lead-manager-interaction-progress-fill" style="height: 100%; width: 0%; background-color: #4267B2; transition: width 0.3s ease;"></div>
      </div>
      <div class="lead-manager-interaction-status" style="font-size: 14px;">Listo para iniciar interacción con miembros.</div>
    `;
    body.appendChild(progressSection);
    
    // Agregar botones de acción
    const actionsSection = document.createElement('div');
    actionsSection.className = 'lead-manager-interaction-actions';
    actionsSection.style.cssText = `
      display: flex;
      justify-content: space-between;
      gap: 8px;
    `;
    
    // Botón para guardar ajustes
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Guardar ajustes';
    saveButton.className = 'lead-manager-button save';
    saveButton.style.cssText = `
      flex: 1;
      padding: 8px 16px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    `;
    
    // Botón para iniciar interacción
    const startButton = document.createElement('button');
    startButton.textContent = 'Iniciar Interacción';
    startButton.className = 'lead-manager-button primary';
    startButton.style.cssText = `
      flex: 1;
      padding: 8px 16px;
      background-color: #4267B2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    `;
    
    // Agregar eventos a los botones (simplemente mostrar mensajes)
    saveButton.addEventListener('click', () => {
      const statusEl = panel.querySelector('.lead-manager-interaction-status');
      if (statusEl) statusEl.textContent = 'Configuración guardada correctamente';
      
      // Mostrar notificación
      alert('Configuración guardada correctamente. Esta es una versión simplificada del panel.');
    });
    
    startButton.addEventListener('click', () => {
      const statusEl = panel.querySelector('.lead-manager-interaction-status');
      if (statusEl) statusEl.textContent = 'Iniciando interacción...';
      
      // Mostrar notificación
      alert('Iniciando interacción. Esta es una versión simplificada del panel.');
    });
    
    actionsSection.appendChild(saveButton);
    actionsSection.appendChild(startButton);
    body.appendChild(actionsSection);
    
    // Ensamblar el panel
    panel.appendChild(header);
    panel.appendChild(body);
    
    // Agregar al documento
    document.body.appendChild(panel);
    
    console.log('Panel de interacción creado correctamente');
    
    return panel;
  }
  
  // Crear sección de historial
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
    
    // Cargar datos del historial desde el storage
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
      
      // Agregar eventos a los botones
      setTimeout(() => {
        setupHistoryButtonEvents();
      }, 100);
    });
    
    return historyContainer;
  }
  
  // Agregar sección de historial a un panel existente
  function addHistoryToPanel(panel) {
    console.log('Agregando historial a panel existente...');
    
    // Verificar si ya existe la sección de historial
    if (panel.querySelector('#lead-manager-history-container')) {
      console.log('El historial ya existe en el panel');
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
    const historySection = createHistorySection();
    
    // Insertar antes de la barra de progreso
    if (progressContainer.parentNode) {
      progressContainer.parentNode.insertBefore(historySection, progressContainer);
      console.log('Historial agregado correctamente al panel existente');
    } else {
      console.warn('No se pudo encontrar el nodo padre para insertar el historial');
    }
  }
  
  // Cargar datos del historial desde el storage
  async function loadHistoryData() {
    try {
      // Obtener ID del grupo actual
      const url = window.location.href;
      const groupIdMatch = url.match(/groups\/([^/?]+)/);
      const currentGroupId = groupIdMatch ? groupIdMatch[1] : 'unknown';
      
      // Cargar desde el storage
      return new Promise(resolve => {
        chrome.storage.local.get(['interactionHistory', 'leadManagerInteractionHistory'], (result) => {
          // Verificar las dos posibles fuentes de datos
          let history = result.interactionHistory || result.leadManagerInteractionHistory || {};
          let groupHistory = history[currentGroupId] || {};
          
          resolve({
            lastIndex: groupHistory.lastIndex || 0,
            interactionCount: (groupHistory.members || groupHistory.interactions || []).length || 0
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
          
          // Reiniciar historial directamente en el storage
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
      // Intentar con ambas claves utilizadas en la extensión
      chrome.storage.local.get(['interactionHistory', 'leadManagerInteractionHistory'], (result) => {
        // Actualizar leadManagerInteractionHistory si existe
        if (result.leadManagerInteractionHistory) {
          const history = result.leadManagerInteractionHistory;
          
          if (history[groupId]) {
            history[groupId] = {
              lastIndex: 0,
              members: []
            };
          }
          
          chrome.storage.local.set({ 'leadManagerInteractionHistory': history });
        }
        
        // Actualizar interactionHistory si existe
        if (result.interactionHistory) {
          const history = result.interactionHistory;
          
          if (history[groupId]) {
            history[groupId] = {
              lastIndex: 0,
              interactions: []
            };
          }
          
          chrome.storage.local.set({ 'interactionHistory': history });
        }
        
        resolve();
      });
    });
  }
  
  // Reiniciar todo el historial directamente
  function resetAllHistoryDirectly() {
    return new Promise(resolve => {
      // Reiniciar ambas claves
      chrome.storage.local.set({
        'interactionHistory': {},
        'leadManagerInteractionHistory': { interactions: {}, totalInteractions: 0 }
      }, resolve);
    });
  }
  
  // Configurar observador de mutaciones para detectar cuando se agrega el panel
  function setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
          for (const node of mutation.addedNodes) {
            if (node.classList && node.classList.contains('lead-manager-interaction-ui')) {
              console.log('Panel detectado por observador, agregando historial...');
              addHistoryToPanel(node);
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
