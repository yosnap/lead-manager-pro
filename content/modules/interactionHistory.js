// Módulo para gestionar el historial de interacciones con miembros

class InteractionHistory {
  constructor() {
    this.defaultHistory = {
      interactions: {},  // Objeto con historial por grupo: { groupId: { lastIndex: 0, members: [] } }
      totalInteractions: 0
    };
    
    this.history = this.loadHistory();
  }
  
  // Cargar historial desde chrome.storage
  loadHistory() {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.get(['leadManagerInteractionHistory'], (result) => {
          if (result && result.leadManagerInteractionHistory) {
            console.log('Historial de interacciones cargado desde storage:', result.leadManagerInteractionHistory);
            resolve({ ...this.defaultHistory, ...result.leadManagerInteractionHistory });
          } else {
            console.log('No se encontró historial de interacciones, usando valores por defecto');
            // Guardar historial por defecto
            this.saveHistory(this.defaultHistory);
            resolve({ ...this.defaultHistory });
          }
        });
      });
    } catch (error) {
      console.error('Error al cargar historial de interacciones:', error);
      return { ...this.defaultHistory };
    }
  }
  
  // Guardar historial en chrome.storage
  saveHistory(history) {
    try {
      return new Promise((resolve) => {
        const newHistory = { ...this.history, ...history };
        this.history = newHistory;
        
        chrome.storage.local.set({ 'leadManagerInteractionHistory': newHistory }, () => {
          console.log('Historial de interacciones guardado en chrome.storage:', newHistory);
          resolve(true);
        });
      });
    } catch (error) {
      console.error('Error al guardar historial de interacciones:', error);
      return false;
    }
  }
  
  // Obtener historial para un grupo específico
  async getGroupHistory(groupId) {
    const history = await this.loadHistory();
    return history.interactions[groupId] || { lastIndex: 0, members: [] };
  }
  
  // Obtener último índice de interacción para un grupo
  async getLastInteractionIndex(groupId) {
    const groupHistory = await this.getGroupHistory(groupId);
    return groupHistory.lastIndex || 0;
  }
  
  // Registrar una nueva interacción
  async registerInteraction(groupId, memberData) {
    try {
      const history = await this.loadHistory();
      
      // Inicializar el historial del grupo si no existe
      if (!history.interactions[groupId]) {
        history.interactions[groupId] = {
          lastIndex: 0,
          members: []
        };
      }
      
      // Incrementar contador de interacciones totales
      history.totalInteractions++;
      
      // Agregar miembro al historial del grupo
      history.interactions[groupId].members.push({
        userId: memberData.userId,
        userName: memberData.userName,
        interactionDate: new Date().toISOString(),
        messageText: memberData.messageText,
        interactionId: memberData.interactionId || `${groupId}-${Date.now()}`
      });
      
      // Actualizar el último índice de interacción
      history.interactions[groupId].lastIndex = memberData.index;
      
      // Limitar el tamaño del historial de miembros (últimos 500 por grupo)
      if (history.interactions[groupId].members.length > 500) {
        history.interactions[groupId].members = history.interactions[groupId].members.slice(-500);
      }
      
      // Guardar historial actualizado
      await this.saveHistory(history);
      
      return true;
    } catch (error) {
      console.error('Error al registrar interacción:', error);
      return false;
    }
  }
  
  // Obtener estadísticas de interacción
  async getInteractionStats() {
    const history = await this.loadHistory();
    
    const stats = {
      totalInteractions: history.totalInteractions,
      groupCount: Object.keys(history.interactions).length,
      groups: {}
    };
    
    // Calcular estadísticas por grupo
    Object.keys(history.interactions).forEach(groupId => {
      const groupHistory = history.interactions[groupId];
      stats.groups[groupId] = {
        interactionCount: groupHistory.members.length,
        lastInteractionDate: groupHistory.members.length > 0 
          ? groupHistory.members[groupHistory.members.length - 1].interactionDate 
          : null,
        lastIndex: groupHistory.lastIndex
      };
    });
    
    return stats;
  }
  
  // Reiniciar el historial para un grupo específico
  async resetGroupHistory(groupId) {
    try {
      const history = await this.loadHistory();
      
      // Si el grupo existe en el historial, reiniciarlo
      if (history.interactions[groupId]) {
        // Reducir el contador de interacciones totales
        history.totalInteractions -= history.interactions[groupId].members.length;
        
        // Reiniciar el historial del grupo
        history.interactions[groupId] = {
          lastIndex: 0,
          members: []
        };
        
        // Guardar historial actualizado
        await this.saveHistory(history);
      }
      
      return true;
    } catch (error) {
      console.error('Error al reiniciar historial de grupo:', error);
      return false;
    }
  }
  
  // Reiniciar todo el historial de interacciones
  async resetAllHistory() {
    try {
      await this.saveHistory(this.defaultHistory);
      return true;
    } catch (error) {
      console.error('Error al reiniciar todo el historial:', error);
      return false;
    }
  }
  
  // Generar un ID único para una interacción
  generateInteractionId(groupId, index) {
    return `${groupId}-${Date.now()}-${index}`;
  }
}

// Exportar la clase
window.leadManagerPro = window.leadManagerPro || {};
window.leadManagerPro.interactionHistory = new InteractionHistory();
