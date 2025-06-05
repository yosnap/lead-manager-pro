/**
 * Módulo para gestionar la interacción con miembros de grupos
 * Incluye configuración de sidebar específica para páginas de grupos
 */

class GroupMemberInteractionManager {
  constructor() {
    this.optionsManager = window.LeadManagerPro?.OptionsManager;
    this.isGroupPage = false;
    this.currentGroupInfo = null;
    this.interactionState = {
      isRunning: false,
      currentMember: 0,
      totalMembers: 0,
      processed: [],
      errors: []
    };

    this.sidebarId = 'group-interaction-sidebar';
    this.sidebarElement = null;
  }

  async init() {
    try {
      await this.detectGroupPage();

      if (this.isGroupPage) {
        await this.initializeGroupSidebar();
        console.log('GroupMemberInteractionManager: Inicializado en página de grupo');
      }

      return true;
    } catch (error) {
      console.error('GroupMemberInteractionManager: Error al inicializar:', error);
      return false;
    }
  }

  async detectGroupPage() {
    // Detectar si estamos en una página de grupo de Facebook
    const url = window.location.href;
    const isGroupUrl = url.includes('/groups/') && !url.includes('/search/');

    if (isGroupUrl) {
      this.isGroupPage = true;
      await this.extractGroupInfo();
    }
  }

  async extractGroupInfo() {
    try {
      // Extraer información básica del grupo
      const groupNameElement = document.querySelector('h1[data-testid="group-name"]') ||
                              document.querySelector('h1') ||
                              document.querySelector('[role="heading"]');

      const groupName = groupNameElement ? groupNameElement.textContent.trim() : 'Grupo sin nombre';

      // Intentar obtener número de miembros
      const memberCountElements = document.querySelectorAll('[data-testid*="member"], [aria-label*="member"], [aria-label*="miembro"]');
      let memberCount = 0;

      for (const element of memberCountElements) {
        const text = element.textContent || element.getAttribute('aria-label') || '';
        const match = text.match(/(\d+[\d\.,]*)\s*(member|miembro)/i);
        if (match) {
          memberCount = parseInt(match[1].replace(/[^\d]/g, ''));
          break;
        }
      }

      this.currentGroupInfo = {
        name: groupName,
        url: window.location.href,
        memberCount: memberCount,
        extractedAt: new Date().toISOString()
      };

      console.log('Información del grupo extraída:', this.currentGroupInfo);
    } catch (error) {
      console.error('Error al extraer información del grupo:', error);
      this.currentGroupInfo = {
        name: 'Grupo desconocido',
        url: window.location.href,
        memberCount: 0,
        extractedAt: new Date().toISOString()
      };
    }
  }

  async initializeGroupSidebar() {
    // Verificar autenticación antes de mostrar la funcionalidad
    if (!window.LeadManagerPro?.Auth) {
      console.warn('GroupMemberInteractionManager: Módulo de autenticación no disponible');
      return;
    }

    window.LeadManagerPro.Auth.isAuthenticated((isAuth) => {
      if (isAuth) {
        this.createGroupSidebar();
      } else {
        this.createAuthRequiredSidebar();
      }
    });
  }

  createGroupSidebar() {
    // Crear o actualizar el sidebar específico para grupos
    this.sidebarElement = document.getElementById(this.sidebarId);

    if (!this.sidebarElement) {
      this.sidebarElement = document.createElement('div');
      this.sidebarElement.id = this.sidebarId;
      this.sidebarElement.className = 'group-interaction-sidebar';
      document.body.appendChild(this.sidebarElement);
    }

    this.sidebarElement.innerHTML = this.getGroupSidebarHTML();
    this.addGroupSidebarStyles();
    this.bindGroupSidebarEvents();
    this.loadGroupInteractionOptions();

    console.log('Sidebar de grupo creado');
  }

  createAuthRequiredSidebar() {
    this.sidebarElement = document.getElementById(this.sidebarId);

    if (!this.sidebarElement) {
      this.sidebarElement = document.createElement('div');
      this.sidebarElement.id = this.sidebarId;
      this.sidebarElement.className = 'group-interaction-sidebar';
      document.body.appendChild(this.sidebarElement);
    }

    this.sidebarElement.innerHTML = `
      <div class="sidebar-auth-required">
        <div class="auth-icon">🔒</div>
        <h3>Autenticación Requerida</h3>
        <p>Inicia sesión en Lead Manager Pro para acceder a las herramientas de interacción con miembros.</p>
        <button id="open-auth-popup" class="auth-btn">Iniciar Sesión</button>
      </div>
    `;

    this.addGroupSidebarStyles();

    // Evento para abrir autenticación
    document.getElementById('open-auth-popup')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'open_popup' });
    });
  }

  getGroupSidebarHTML() {
    const groupName = this.currentGroupInfo?.name || 'Grupo actual';

    return `
      <div class="group-sidebar-header">
        <h2>Herramientas de Grupo</h2>
        <div class="group-info">
          <strong>${groupName}</strong>
          ${this.currentGroupInfo?.memberCount ? `<span>${this.currentGroupInfo.memberCount.toLocaleString()} miembros</span>` : ''}
        </div>
      </div>

      <div class="group-sidebar-content">
        <!-- Configuración de interacción -->
        <div class="config-section">
          <h3>Configuración de Interacción</h3>

          <div class="form-group">
            <label for="members-to-interact">Miembros a interactuar</label>
            <input type="number" id="members-to-interact" min="1" max="50" value="10">
            <small>Máximo 50 miembros por sesión</small>
          </div>

          <div class="form-group">
            <label for="interaction-delay">Tiempo entre interacciones (segundos)</label>
            <input type="number" id="interaction-delay" min="1" max="60" step="0.5" value="3">
            <small>Recomendado: 3-5 segundos</small>
          </div>

          <div class="form-group">
            <label for="interaction-message">Mensaje a enviar</label>
            <textarea id="interaction-message" rows="3" maxlength="500"
                      placeholder="¡Hola! Me interesa conectar contigo..."></textarea>
            <small class="char-count">0/500 caracteres</small>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="auto-close-chat" checked>
              <span>Cerrar ventana de chat automáticamente</span>
            </label>
          </div>
        </div>

        <!-- Herramientas -->
        <div class="tools-section">
          <h3>Herramientas Disponibles</h3>

          <div class="tool-buttons">
            <button id="count-members-btn" class="tool-btn">
              <span class="btn-icon">👥</span>
              <div class="btn-content">
                <strong>Contar Miembros</strong>
                <small>Obtener número exacto de miembros</small>
              </div>
            </button>

            <button id="interact-members-btn" class="tool-btn" disabled>
              <span class="btn-icon">💬</span>
              <div class="btn-content">
                <strong>Interactuar con Miembros</strong>
                <small>Enviar mensajes automatizados</small>
              </div>
            </button>
          </div>
        </div>

        <!-- Estado de la operación -->
        <div class="status-section" id="operation-status" style="display: none;">
          <h3>Estado de la Operación</h3>
          <div class="status-display">
            <div class="status-text" id="status-text">Preparando...</div>
            <div class="progress-bar">
              <div class="progress-fill" id="progress-fill"></div>
            </div>
            <div class="status-details" id="status-details">0 de 0 procesados</div>
          </div>

          <div class="operation-controls">
            <button id="pause-operation-btn" class="control-btn">Pausar</button>
            <button id="stop-operation-btn" class="control-btn stop">Detener</button>
          </div>
        </div>

        <!-- Resultados -->
        <div class="results-section" id="results-section" style="display: none;">
          <h3>Resultados</h3>
          <div class="results-summary" id="results-summary"></div>
          <div class="results-actions">
            <button id="export-results-btn" class="action-btn">Exportar Resultados</button>
            <button id="clear-results-btn" class="action-btn secondary">Limpiar</button>
          </div>
        </div>
      </div>

      <div class="group-sidebar-footer">
        <button id="toggle-sidebar-btn" class="toggle-btn">−</button>
        <button id="close-sidebar-btn" class="close-btn">×</button>
      </div>
    `;
  }

  addGroupSidebarStyles() {
    // Verificar si los estilos ya están añadidos
    if (document.getElementById('group-interaction-sidebar-styles')) return;

    const style = document.createElement('style');
    style.id = 'group-interaction-sidebar-styles';
    style.textContent = `
      .group-interaction-sidebar {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 320px;
        max-height: calc(100vh - 40px);
        background: #ffffff;
        border: 1px solid #e1e5e9;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .group-sidebar-header {
        padding: 16px;
        border-bottom: 1px solid #e1e5e9;
        background: #f8f9fa;
      }

      .group-sidebar-header h2 {
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 600;
        color: #1c1e21;
      }

      .group-info {
        font-size: 13px;
        color: #65676b;
      }

      .group-info strong {
        display: block;
        color: #1c1e21;
        margin-bottom: 2px;
      }

      .group-sidebar-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
      }

      .config-section, .tools-section, .status-section, .results-section {
        margin-bottom: 20px;
      }

      .config-section h3, .tools-section h3, .status-section h3, .results-section h3 {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 600;
        color: #1c1e21;
      }

      .form-group {
        margin-bottom: 16px;
      }

      .form-group label {
        display: block;
        margin-bottom: 4px;
        font-size: 13px;
        font-weight: 500;
        color: #1c1e21;
      }

      .form-group input, .form-group textarea {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid #dddfe2;
        border-radius: 4px;
        font-size: 13px;
        box-sizing: border-box;
      }

      .form-group small {
        display: block;
        margin-top: 4px;
        font-size: 11px;
        color: #65676b;
      }

      .checkbox-label {
        display: flex !important;
        align-items: center;
        cursor: pointer;
        font-size: 13px !important;
        margin-bottom: 0 !important;
      }

      .checkbox-label input[type="checkbox"] {
        width: auto !important;
        margin-right: 8px;
      }

      .tool-buttons {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .tool-btn {
        display: flex;
        align-items: center;
        padding: 12px;
        border: 1px solid #dddfe2;
        border-radius: 6px;
        background: #ffffff;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
      }

      .tool-btn:hover:not(:disabled) {
        background: #f8f9fa;
        border-color: #4267b2;
      }

      .tool-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .btn-icon {
        font-size: 20px;
        margin-right: 12px;
      }

      .btn-content strong {
        display: block;
        font-size: 13px;
        color: #1c1e21;
        margin-bottom: 2px;
      }

      .btn-content small {
        font-size: 11px;
        color: #65676b;
      }

      .status-display {
        padding: 12px;
        background: #f8f9fa;
        border-radius: 6px;
        margin-bottom: 12px;
      }

      .status-text {
        font-size: 13px;
        font-weight: 500;
        margin-bottom: 8px;
      }

      .progress-bar {
        height: 6px;
        background: #e1e5e9;
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 8px;
      }

      .progress-fill {
        height: 100%;
        background: #4267b2;
        width: 0%;
        transition: width 0.3s;
      }

      .status-details {
        font-size: 11px;
        color: #65676b;
      }

      .operation-controls, .results-actions {
        display: flex;
        gap: 8px;
      }

      .control-btn, .action-btn {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #dddfe2;
        border-radius: 4px;
        background: #ffffff;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
      }

      .control-btn.stop {
        background: #e74c3c;
        color: white;
        border-color: #e74c3c;
      }

      .action-btn.secondary {
        background: #f8f9fa;
      }

      .group-sidebar-footer {
        display: flex;
        justify-content: space-between;
        padding: 12px 16px;
        border-top: 1px solid #e1e5e9;
        background: #f8f9fa;
      }

      .toggle-btn, .close-btn {
        width: 30px;
        height: 30px;
        border: none;
        border-radius: 4px;
        background: #e1e5e9;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: bold;
        color: #65676b;
      }

      .close-btn {
        background: #e74c3c;
        color: white;
      }

      .sidebar-auth-required {
        padding: 40px 20px;
        text-align: center;
      }

      .auth-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }

      .sidebar-auth-required h3 {
        margin: 0 0 12px 0;
        color: #1c1e21;
      }

      .sidebar-auth-required p {
        margin: 0 0 20px 0;
        color: #65676b;
        font-size: 14px;
        line-height: 1.4;
      }

      .auth-btn {
        padding: 10px 20px;
        background: #4267b2;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
      }
    `;

    document.head.appendChild(style);
  }
    async startMemberInteraction() {
    const config = {
      membersToInteract: parseInt(document.getElementById('members-to-interact')?.value) || 10,
      interactionDelay: parseFloat(document.getElementById('interaction-delay')?.value) || 3,
      message: document.getElementById('interaction-message')?.value.trim() || "",
      autoCloseChat: document.getElementById('auto-close-chat')?.checked !== false
    };

    if (!config.message) {
      alert('Por favor, ingresa un mensaje para enviar.');
      return;
    }

    this.interactionState = {
      isRunning: true,
      currentMember: 0,
      totalMembers: config.membersToInteract,
      processed: [],
      errors: [],
      config: config
    };

    this.showOperationStatus('Iniciando interacción con miembros...');

    try {
      await this.performMemberInteraction();
    } catch (error) {
      console.error('Error durante la interacción:', error);
      this.stopOperation();
      alert('Error durante la interacción. Operación detenida.');
    }
  }

  async performMemberCount() {
    // Simular conteo de miembros - aquí se integraría con el módulo existente
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock: devolver un número simulado
        const mockCount = Math.floor(Math.random() * 10000) + 1000;
        resolve(mockCount);
      }, 2000);
    });
  }

  async performMemberInteraction() {
    const { config } = this.interactionState;

    for (let i = 0; i < config.membersToInteract && this.interactionState.isRunning; i++) {
      this.interactionState.currentMember = i + 1;
      this.updateOperationProgress();

      try {
        // Simular interacción con miembro
        await this.interactWithMember(i);
        this.interactionState.processed.push({
          index: i,
          success: true,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        this.interactionState.errors.push({
          index: i,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }

      // Esperar el delay configurado antes del siguiente miembro
      if (i < config.membersToInteract - 1 && this.interactionState.isRunning) {
        await this.sleep(config.interactionDelay * 1000);
      }
    }

    // Mostrar resultados finales
    this.showResults({
      type: 'member_interaction',
      total: this.interactionState.processed.length,
      errors: this.interactionState.errors.length,
      processed: this.interactionState.processed,
      errorDetails: this.interactionState.errors,
      groupName: this.currentGroupInfo?.name,
      timestamp: new Date().toISOString()
    });

    this.hideOperationStatus();
  }

  async interactWithMember(memberIndex) {
    // Simular interacción - aquí se implementaría la lógica real
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simular éxito/fallo aleatorio
        if (Math.random() > 0.1) { // 90% de éxito
          resolve();
        } else {
          reject(new Error(`Error al interactuar con miembro ${memberIndex + 1}`));
        }
      }, 1000 + Math.random() * 2000); // 1-3 segundos
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Métodos de control de operación
  pauseOperation() {
    this.interactionState.isRunning = false;
    this.updateOperationStatus('Operación pausada');

    // Cambiar el botón de pausa a reanudar
    const pauseBtn = document.getElementById('pause-operation-btn');
    if (pauseBtn) {
      pauseBtn.textContent = 'Reanudar';
      pauseBtn.onclick = () => this.resumeOperation();
    }
  }

  resumeOperation() {
    this.interactionState.isRunning = true;
    this.updateOperationStatus('Reanudando operación...');

    // Cambiar el botón de reanudar a pausa
    const pauseBtn = document.getElementById('pause-operation-btn');
    if (pauseBtn) {
      pauseBtn.textContent = 'Pausar';
      pauseBtn.onclick = () => this.pauseOperation();
    }

    // Continuar con la interacción desde donde se quedó
    this.performMemberInteraction();
  }

  stopOperation() {
    this.interactionState.isRunning = false;
    this.hideOperationStatus();

    // Mostrar resultados parciales si hay alguno
    if (this.interactionState.processed.length > 0) {
      this.showResults({
        type: 'member_interaction_stopped',
        total: this.interactionState.processed.length,
        errors: this.interactionState.errors.length,
        processed: this.interactionState.processed,
        errorDetails: this.interactionState.errors,
        groupName: this.currentGroupInfo?.name,
        timestamp: new Date().toISOString(),
        stopped: true
      });
    }
  }

  // Métodos de UI
  showOperationStatus(message) {
    const statusSection = document.getElementById('operation-status');
    const statusText = document.getElementById('status-text');

    if (statusSection) statusSection.style.display = 'block';
    if (statusText) statusText.textContent = message;

    this.updateOperationProgress();
  }

  updateOperationProgress() {
    const progressFill = document.getElementById('progress-fill');
    const statusDetails = document.getElementById('status-details');

    if (!this.interactionState.isRunning) return;

    const progress = (this.interactionState.currentMember / this.interactionState.totalMembers) * 100;

    if (progressFill) {
      progressFill.style.width = `${progress}%`;
    }

    if (statusDetails) {
      statusDetails.textContent = `${this.interactionState.currentMember} de ${this.interactionState.totalMembers} procesados`;
    }
  }

  updateOperationStatus(message) {
    const statusText = document.getElementById('status-text');
    if (statusText) statusText.textContent = message;
  }

  hideOperationStatus() {
    const statusSection = document.getElementById('operation-status');
    if (statusSection) statusSection.style.display = 'none';

    // Resetear estado
    this.interactionState.isRunning = false;

    // Resetear botón de pausa
    const pauseBtn = document.getElementById('pause-operation-btn');
    if (pauseBtn) {
      pauseBtn.textContent = 'Pausar';
      pauseBtn.onclick = () => this.pauseOperation();
    }
  }

  showResults(results) {
    const resultsSection = document.getElementById('results-section');
    const resultsSummary = document.getElementById('results-summary');

    if (!resultsSection || !resultsSummary) return;

    let summaryHTML = '';

    if (results.type === 'member_count') {
      summaryHTML = `
        <div class="result-item">
          <strong>Conteo de Miembros</strong>
          <p>Grupo: ${results.groupName}</p>
          <p>Total de miembros: <strong>${results.total.toLocaleString()}</strong></p>
          <p>Fecha: ${new Date(results.timestamp).toLocaleString()}</p>
        </div>
      `;
    } else if (results.type.includes('member_interaction')) {
      const successRate = results.total > 0 ? ((results.total / (results.total + results.errors)) * 100).toFixed(1) : 0;

      summaryHTML = `
        <div class="result-item">
          <strong>Interacción con Miembros ${results.stopped ? '(Detenida)' : ''}</strong>
          <p>Grupo: ${results.groupName}</p>
          <p>Interacciones exitosas: <strong>${results.total}</strong></p>
          <p>Errores: <strong>${results.errors}</strong></p>
          <p>Tasa de éxito: <strong>${successRate}%</strong></p>
          <p>Fecha: ${new Date(results.timestamp).toLocaleString()}</p>
        </div>
      `;
    }

    resultsSummary.innerHTML = summaryHTML;
    resultsSection.style.display = 'block';

    // Guardar resultados para exportación
    this.lastResults = results;
  }

  exportResults() {
    if (!this.lastResults) {
      alert('No hay resultados para exportar.');
      return;
    }

    const dataStr = JSON.stringify(this.lastResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `lead-manager-results-${Date.now()}.json`;
    link.click();

    console.log('Resultados exportados:', this.lastResults);
  }

  clearResults() {
    const resultsSection = document.getElementById('results-section');
    if (resultsSection) resultsSection.style.display = 'none';

    this.lastResults = null;
  }

  toggleSidebar() {
    const content = this.sidebarElement.querySelector('.group-sidebar-content');
    const toggleBtn = document.getElementById('toggle-sidebar-btn');

    if (!content || !toggleBtn) return;

    const isCollapsed = content.style.display === 'none';

    content.style.display = isCollapsed ? 'block' : 'none';
    toggleBtn.textContent = isCollapsed ? '−' : '+';
  }

  closeSidebar() {
    if (this.sidebarElement) {
      this.sidebarElement.remove();
      this.sidebarElement = null;
    }
  }

  // Método público para verificar si estamos en una página de grupo
  isOnGroupPage() {
    return this.isGroupPage;
  }

  // Método público para obtener información del grupo actual
  getCurrentGroupInfo() {
    return this.currentGroupInfo;
  }
}

// Crear instancia global
window.LeadManagerPro = window.LeadManagerPro || {};
window.LeadManagerPro.GroupMemberInteractionManager = GroupMemberInteractionManager;

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      window.LeadManagerPro.groupMemberInteractionManager = new GroupMemberInteractionManager();
      window.LeadManagerPro.groupMemberInteractionManager.init();
    }, 1000); // Esperar a que otros módulos se carguen
  });
} else {
  setTimeout(() => {
    window.LeadManagerPro.groupMemberInteractionManager = new GroupMemberInteractionManager();
    window.LeadManagerPro.groupMemberInteractionManager.init();
  }, 1000);
}
