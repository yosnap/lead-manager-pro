import InteractionConfig from './InteractionConfig';
import InteractionStats from './InteractionStats';

class InteractionManager {
  constructor() {
    this.config = new InteractionConfig();
    this.stats = new InteractionStats();
    this.isRunning = false;
    this.isPaused = false;
    this.currentMember = null;
    this.queue = [];
  }

  // Inicializar el manager
  async initialize() {
    try {
      await this.config.loadSavedConfig();
      await this.stats.loadStats();
      return true;
    } catch (error) {
      console.error('Error al inicializar InteractionManager:', error);
      return false;
    }
  }

  // Comenzar el proceso de interacciones
  async start(membersList) {
    if (this.isRunning) {
      throw new Error('El proceso de interacciones ya está en ejecución');
    }

    this.isRunning = true;
    this.isPaused = false;
    this.queue = [...membersList];
    
    await this.processQueue();
  }

  // Procesar la cola de miembros
  async processQueue() {
    while (this.isRunning && this.queue.length > 0 && !this.isPaused) {
      this.currentMember = this.queue.shift();
      
      // Verificar límites antes de interactuar
      if (!await this.config.canInteract()) {
        this.pause();
        return;
      }

      // Verificar si ya interactuamos con este miembro
      if (this.stats.hasInteracted(this.currentMember.id)) {
        continue;
      }

      try {
        await this.interactWithMember(this.currentMember);
      } catch (error) {
        console.error('Error al interactuar con miembro:', error);
        await this.stats.recordFailure();
      }

      // Esperar el tiempo de cooldown
      await this.wait(this.config.getCooldownTime());
    }

    if (this.queue.length === 0) {
      this.stop();
    }
  }

  // Interactuar con un miembro específico
  async interactWithMember(member) {
    try {
      // Verificar filtros
      if (!this.meetsFilters(member)) {
        return;
      }

      // Obtener plantilla de mensaje
      const messageTemplate = this.config.getMessageTemplate();
      
      // Personalizar mensaje
      const message = this.personalizeMessage(messageTemplate, member);
      
      // Enviar mensaje
      await this.sendMessage(member, message);
      
      // Registrar interacción exitosa
      await this.stats.recordSuccess(member.id);
      
      return true;
    } catch (error) {
      console.error('Error en interacción con miembro:', error);
      await this.stats.recordFailure();
      return false;
    }
  }

  // Verificar si el miembro cumple con los filtros
  meetsFilters(member) {
    const filters = this.config.getFilters();
    
    // Verificar intereses en común si está activado el filtro
    if (filters.commonInterests && !member.hasCommonInterests) {
      return false;
    }
    
    // Verificar historial de interacciones si está activado el filtro
    if (filters.interactionHistory && this.stats.hasInteracted(member.id)) {
      return false;
    }
    
    return true;
  }

  // Personalizar mensaje con datos del miembro
  personalizeMessage(template, member) {
    return template
      .replace('{nombre}', member.name)
      .replace('{grupo}', member.groupName)
      .replace('{intereses}', member.interests?.join(', ') || '');
  }

  // Enviar mensaje al miembro
  async sendMessage(member, message) {
    // Implementar lógica de envío de mensaje
    // Esta función debe ser implementada según la API de Facebook
    throw new Error('Método sendMessage debe ser implementado');
  }

  // Pausar el proceso
  pause() {
    this.isPaused = true;
  }

  // Reanudar el proceso
  async resume() {
    if (!this.isRunning) {
      throw new Error('El proceso no está en ejecución');
    }
    
    this.isPaused = false;
    await this.processQueue();
  }

  // Detener el proceso
  stop() {
    this.isRunning = false;
    this.isPaused = false;
    this.currentMember = null;
    this.queue = [];
  }

  // Obtener estado actual
  getStatus() {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      currentMember: this.currentMember,
      queueLength: this.queue.length,
      stats: this.stats.getSummary(),
      config: this.config.getCurrentConfig()
    };
  }

  // Utilidad para esperar
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Exportar la clase
export default InteractionManager; 