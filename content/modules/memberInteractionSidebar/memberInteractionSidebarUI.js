// UI para la configuración de interacción de miembros en el sidebar

class MemberInteractionSidebarUI {
  constructor() {
    this.container = null;
    this.interactionHistory = null;
    this.currentGroupId = null;
    this.interactionStatus = {};
  }
  
  init() {
    // Inicializar el módulo de historial de interacciones
    this.interactionHistory = window.leadManagerPro.interactionHistory;
    
    // Identificar el grupo actual
    this.currentGroupId = this.extractGroupIdFromUrl();
    
    console.log('MemberInteractionSidebarUI: Initialized with groupId:', this.currentGroupId);
    return this;
  }
  
  // Extraer ID del grupo a partir de la URL
  extractGroupIdFromUrl() {
    const url = window.location.href;
    const match = url.match(/groups\/([^/?]+)/);
    return match ? match[1] : '';
  }
  
  // Crear la sección de historial de interacciones para el sidebar
  async createHistorySection() {
    // Contenedor para la sección de historial
    const container = document.createElement('div');
    container.className = 'lead-manager-history-section';
    
    // Título de la sección
    const title = document.createElement('h3');
    title.textContent = 'Historial de Interacciones';
    title.style.cssText = `
      font-size: 16px;
      margin-bottom: 12px;
      color: #050505;
    `;
    
    // Obtener historial del grupo actual
    const groupHistory = await this.interactionHistory.getGroupHistory(this.currentGroupId);
    const lastIndex = groupHistory.lastIndex || 0;
    const interactionCount = groupHistory.members ? groupHistory.members.length : 0;
    
    // Resumen de estadísticas
    const statsContainer = document.createElement('div');
    statsContainer.className = 'lead-manager-history-stats';
    statsContainer.style.cssText = `
      background-color: #f0f2f5;
      padding: 10px;
      border-radius: 8px;
      margin-bottom: 12px;
    `;
    
    statsContainer.innerHTML = `
      <div style="margin-bottom: 8px;"><strong>Último índice:</strong> <span id="lmp-last-index">${lastIndex}</span></div>
      <div><strong>Interacciones en este grupo:</strong> <span id="lmp-group-interactions">${interactionCount}</span></div>
    `;
    
    // Controles de interacción con historial
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'lead-manager-history-controls';
    controlsContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    `;
    
    // Checkbox para continuar desde el último índice
    const continueFromLastContainer = document.createElement('div');
    continueFromLastContainer.style.cssText = `
      display: flex;
      align-items: center;
      margin-bottom: 8px;
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
    
    // Botón para reiniciar historial de este grupo
    const resetGroupButton = document.createElement('button');
    resetGroupButton.textContent = 'Reiniciar historial de este grupo';
    resetGroupButton.className = 'lead-manager-button secondary';
    resetGroupButton.style.cssText = `
      padding: 8px 16px;
      background-color: #f0f2f5;
      color: #050505;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.2s;
    `;
    resetGroupButton.addEventListener('mouseover', () => {
      resetGroupButton.style.backgroundColor = '#e4e6eb';
    });
    resetGroupButton.addEventListener('mouseout', () => {
      resetGroupButton.style.backgroundColor = '#f0f2f5';
    });
    resetGroupButton.addEventListener('click', async () => {
      if (confirm('¿Estás seguro de que deseas reiniciar el historial de este grupo? Esta acción no se puede deshacer.')) {
        await this.interactionHistory.resetGroupHistory(this.currentGroupId);
        this.updateHistoryStats();
      }
    });
    
    // Botón para reiniciar todo el historial
    const resetAllButton = document.createElement('button');
    resetAllButton.textContent = 'Reiniciar todo el historial';
    resetAllButton.className = 'lead-manager-button danger';
    resetAllButton.style.cssText = `
      padding: 8px 16px;
      background-color: #f5f0f0;
      color: #b71c1c;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.2s;
    `;
    resetAllButton.addEventListener('mouseover', () => {
      resetAllButton.style.backgroundColor = '#fde0dc';
    });
    resetAllButton.addEventListener('mouseout', () => {
      resetAllButton.style.backgroundColor = '#f5f0f0';
    });
    resetAllButton.addEventListener('click', async () => {
      if (confirm('¿Estás seguro de que deseas reiniciar TODO el historial de interacciones? Esta acción no se puede deshacer y afectará a TODOS los grupos.')) {
        await this.interactionHistory.resetAllHistory();
        this.updateHistoryStats();
      }
    });
    
    // Ensamblar los controles
    controlsContainer.appendChild(continueFromLastContainer);
    controlsContainer.appendChild(resetGroupButton);
    controlsContainer.appendChild(resetAllButton);
    
    // Ensamblar toda la sección
    container.appendChild(title);
    container.appendChild(statsContainer);
    container.appendChild(controlsContainer);
    
    // Guardar referencias para actualizar luego
    this.continueFromLastCheckbox = continueFromLastCheckbox;
    this.statsContainer = statsContainer;
    
    // Actualizar la configuración de interacción
    this.interactionStatus = {
      continueFromLast: continueFromLastCheckbox.checked,
      lastIndex: lastIndex
    };
    
    return container;
  }
  
  // Actualizar las estadísticas del historial
  async updateHistoryStats() {
    if (!this.statsContainer) return;
    
    const groupHistory = await this.interactionHistory.getGroupHistory(this.currentGroupId);
    const lastIndex = groupHistory.lastIndex || 0;
    const interactionCount = groupHistory.members ? groupHistory.members.length : 0;
    
    // Actualizar los contadores
    const lastIndexElement = this.statsContainer.querySelector('#lmp-last-index');
    const groupInteractionsElement = this.statsContainer.querySelector('#lmp-group-interactions');
    
    if (lastIndexElement) lastIndexElement.textContent = lastIndex;
    if (groupInteractionsElement) groupInteractionsElement.textContent = interactionCount;
    
    // Actualizar la configuración de interacción
    this.interactionStatus = {
      continueFromLast: this.continueFromLastCheckbox ? this.continueFromLastCheckbox.checked : true,
      lastIndex: lastIndex
    };
  }
  
  // Obtener la configuración de interacción actual
  getInteractionConfig() {
    return {
      continueFromLast: this.interactionStatus.continueFromLast,
      lastIndex: this.interactionStatus.lastIndex
    };
  }
  
  // Inyectar sección de historial en un contenedor existente
  async injectHistorySection(container) {
    if (!container) {
      console.error('MemberInteractionSidebarUI: No se proporcionó un contenedor válido');
      return false;
    }
    
    const historySection = await this.createHistorySection();
    container.appendChild(historySection);
    
    return true;
  }
}

// Exportar la clase
window.leadManagerPro = window.leadManagerPro || {};
window.leadManagerPro.memberInteractionSidebarUI = new MemberInteractionSidebarUI();
