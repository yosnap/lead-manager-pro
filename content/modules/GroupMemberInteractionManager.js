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
  }

  async init() {
    try {
      await this.detectGroupPage();

      if (this.isGroupPage) {
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
