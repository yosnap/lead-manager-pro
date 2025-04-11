// Manejo de estadísticas de interacciones
class InteractionStats {
  constructor() {
    this.stats = {
      // Estadísticas generales
      totalInteractions: 0,
      successfulInteractions: 0,
      failedInteractions: 0,
      
      // Estadísticas por día
      daily: {
        date: new Date().toDateString(),
        total: 0,
        successful: 0,
        failed: 0
      },
      
      // Historial de interacciones
      history: [],
      
      // Registro de errores
      errors: [],
      
      // Métricas de rendimiento
      performance: {
        averageResponseTime: 0,
        successRate: 0
      }
    };
  }

  // Cargar estadísticas guardadas
  async loadStats() {
    try {
      const saved = await new Promise(resolve => {
        chrome.storage.local.get('interactionStats', result => {
          resolve(result.interactionStats);
        });
      });

      if (saved) {
        // Actualizar estadísticas manteniendo la estructura
        this.stats = {
          ...this.stats,
          ...saved,
          daily: {
            ...this.stats.daily,
            ...(saved.daily || {})
          }
        };
        
        // Verificar si es un nuevo día
        this.checkAndResetDaily();
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  }

  // Guardar estadísticas actuales
  async saveStats() {
    try {
      await new Promise(resolve => {
        chrome.storage.local.set({
          interactionStats: this.stats
        }, resolve);
      });
    } catch (error) {
      console.error('Error al guardar estadísticas:', error);
    }
  }

  // Verificar y resetear estadísticas diarias si es necesario
  checkAndResetDaily() {
    const today = new Date().toDateString();
    if (this.stats.daily.date !== today) {
      // Guardar estadísticas del día anterior en el historial
      this.stats.history.push({
        ...this.stats.daily
      });

      // Limitar el historial a los últimos 30 días
      if (this.stats.history.length > 30) {
        this.stats.history.shift();
      }

      // Resetear estadísticas diarias
      this.stats.daily = {
        date: today,
        total: 0,
        successful: 0,
        failed: 0
      };
    }
  }

  // Registrar una interacción exitosa
  async logSuccess(memberData) {
    this.checkAndResetDaily();
    
    this.stats.totalInteractions++;
    this.stats.successfulInteractions++;
    this.stats.daily.total++;
    this.stats.daily.successful++;
    
    // Actualizar métricas de rendimiento
    this.updatePerformanceMetrics();
    
    // Guardar en el historial
    this.stats.history.push({
      timestamp: new Date().toISOString(),
      type: 'success',
      memberData
    });
    
    await this.saveStats();
  }

  // Registrar una interacción fallida
  async logFailure(memberData, error) {
    this.checkAndResetDaily();
    
    this.stats.totalInteractions++;
    this.stats.failedInteractions++;
    this.stats.daily.total++;
    this.stats.daily.failed++;
    
    // Registrar error
    this.stats.errors.push({
      timestamp: new Date().toISOString(),
      error: error.message || error,
      memberData
    });
    
    // Limitar registro de errores a los últimos 100
    if (this.stats.errors.length > 100) {
      this.stats.errors.shift();
    }
    
    // Actualizar métricas de rendimiento
    this.updatePerformanceMetrics();
    
    await this.saveStats();
  }

  // Actualizar métricas de rendimiento
  updatePerformanceMetrics() {
    const total = this.stats.totalInteractions;
    if (total > 0) {
      this.stats.performance.successRate = 
        (this.stats.successfulInteractions / total) * 100;
    }
  }

  // Obtener resumen de estadísticas
  getSummary() {
    return {
      total: this.stats.totalInteractions,
      successful: this.stats.successfulInteractions,
      failed: this.stats.failedInteractions,
      successRate: this.stats.performance.successRate,
      daily: { ...this.stats.daily },
      recentErrors: this.stats.errors.slice(-5)
    };
  }

  // Obtener estadísticas detalladas
  getDetailedStats() {
    return { ...this.stats };
  }

  // Obtener historial de interacciones
  getHistory() {
    return [...this.stats.history];
  }

  // Obtener registro de errores
  getErrors() {
    return [...this.stats.errors];
  }

  // Limpiar estadísticas
  async clearStats() {
    this.stats = {
      totalInteractions: 0,
      successfulInteractions: 0,
      failedInteractions: 0,
      daily: {
        date: new Date().toDateString(),
        total: 0,
        successful: 0,
        failed: 0
      },
      history: [],
      errors: [],
      performance: {
        averageResponseTime: 0,
        successRate: 0
      }
    };
    
    await this.saveStats();
  }
}

// Exportar la clase
export default InteractionStats; 