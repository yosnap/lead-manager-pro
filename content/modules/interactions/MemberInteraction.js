// Clase principal para manejar interacciones con miembros
class MemberInteraction {
  constructor() {
    this.state = {
      isProcessing: false,
      currentMember: null,
      interactionQueue: [],
      processedMembers: new Set(),
      settings: {
        messageTemplate: '',
        interactionDelay: 2000, // 2 segundos por defecto
        maxInteractionsPerHour: 15,
        maxInteractionsPerDay: 100
      },
      stats: {
        totalInteractions: 0,
        successfulInteractions: 0,
        failedInteractions: 0,
        lastInteractionTime: null
      }
    };
    
    // Límites de Facebook
    this.FACEBOOK_LIMITS = {
      MAX_INTERACTIONS_PER_HOUR: 15,
      MAX_INTERACTIONS_PER_DAY: 100,
      MIN_DELAY_BETWEEN_INTERACTIONS: 2000 // 2 segundos
    };
  }
  
  // Inicializar el módulo
  async init() {
    try {
      // Cargar configuración guardada
      await this.loadSettings();
      // Inicializar listeners
      this.setupEventListeners();
      console.log('MemberInteraction inicializado correctamente');
      return true;
    } catch (error) {
      console.error('Error al inicializar MemberInteraction:', error);
      return false;
    }
  }
  
  // Configurar event listeners
  setupEventListeners() {
    // Escuchar mensajes del popup/sidebar
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'startInteractions') {
        this.startInteractions(message.settings);
        sendResponse({ success: true });
      } else if (message.action === 'stopInteractions') {
        this.stopInteractions();
        sendResponse({ success: true });
      }
    });
  }
  
  // Cargar configuración guardada
  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['memberInteractionSettings'], (result) => {
        if (result.memberInteractionSettings) {
          this.state.settings = {
            ...this.state.settings,
            ...result.memberInteractionSettings
          };
        }
        resolve();
      });
    });
  }
  
  // Guardar configuración
  async saveSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.set({
        memberInteractionSettings: this.state.settings
      }, resolve);
    });
  }
  
  // Iniciar proceso de interacciones
  async startInteractions(settings = {}) {
    if (this.state.isProcessing) {
      console.warn('Ya hay un proceso de interacciones en curso');
      return false;
    }
    
    try {
      // Actualizar configuración si se proporciona
      if (Object.keys(settings).length > 0) {
        this.state.settings = {
          ...this.state.settings,
          ...settings
        };
        await this.saveSettings();
      }
      
      this.state.isProcessing = true;
      console.log('Iniciando proceso de interacciones con configuración:', this.state.settings);
      
      // Comenzar procesamiento de la cola
      this.processQueue();
      
      return true;
    } catch (error) {
      console.error('Error al iniciar interacciones:', error);
      this.state.isProcessing = false;
      return false;
    }
  }
  
  // Detener proceso de interacciones
  stopInteractions() {
    this.state.isProcessing = false;
    this.state.interactionQueue = [];
    console.log('Proceso de interacciones detenido');
  }
  
  // Agregar miembro a la cola de interacciones
  addToQueue(member) {
    if (!member || !member.id || this.state.processedMembers.has(member.id)) {
      return false;
    }
    
    this.state.interactionQueue.push(member);
    return true;
  }
  
  // Procesar cola de interacciones
  async processQueue() {
    if (!this.state.isProcessing || this.state.interactionQueue.length === 0) {
      return;
    }
    
    // Verificar límites
    if (!this.canInteract()) {
      console.warn('Límite de interacciones alcanzado');
      this.stopInteractions();
      return;
    }
    
    const member = this.state.interactionQueue.shift();
    if (!member) return;
    
    try {
      // Procesar interacción
      const success = await this.interactWithMember(member);
      
      // Actualizar estadísticas
      this.updateStats(success);
      
      // Marcar como procesado
      this.state.processedMembers.add(member.id);
      
      // Esperar el delay configurado
      await this.delay(this.state.settings.interactionDelay);
      
      // Continuar con el siguiente
      if (this.state.isProcessing) {
        this.processQueue();
      }
    } catch (error) {
      console.error('Error al procesar interacción:', error);
      this.updateStats(false);
    }
  }
  
  // Realizar interacción con un miembro
  async interactWithMember(member) {
    try {
      // Aquí implementaremos la lógica específica de interacción
      // Por ahora solo registramos
      console.log('Interactuando con miembro:', member);
      
      // Simular éxito
      return true;
    } catch (error) {
      console.error('Error al interactuar con miembro:', error);
      return false;
    }
  }
  
  // Verificar si podemos realizar más interacciones
  canInteract() {
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);
    const dayAgo = now - (24 * 60 * 60 * 1000);
    
    // Contar interacciones en la última hora y día
    let hourlyInteractions = 0;
    let dailyInteractions = 0;
    
    for (const time of this.state.stats.interactionTimes || []) {
      if (time > hourAgo) hourlyInteractions++;
      if (time > dayAgo) dailyInteractions++;
    }
    
    return hourlyInteractions < this.state.settings.maxInteractionsPerHour &&
           dailyInteractions < this.state.settings.maxInteractionsPerDay;
  }
  
  // Actualizar estadísticas
  updateStats(success) {
    const now = Date.now();
    this.state.stats.totalInteractions++;
    if (success) {
      this.state.stats.successfulInteractions++;
    } else {
      this.state.stats.failedInteractions++;
    }
    this.state.stats.lastInteractionTime = now;
    
    // Mantener registro de tiempos de interacción
    if (!this.state.stats.interactionTimes) {
      this.state.stats.interactionTimes = [];
    }
    this.state.stats.interactionTimes.push(now);
    
    // Limpiar tiempos antiguos (más de 24 horas)
    const dayAgo = now - (24 * 60 * 60 * 1000);
    this.state.stats.interactionTimes = this.state.stats.interactionTimes.filter(time => time > dayAgo);
  }
  
  // Utilidad para esperar
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Exportar la clase
export default MemberInteraction; 