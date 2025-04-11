// Configuración y límites para las interacciones
class InteractionConfig {
  constructor() {
    this.config = {
      // Límites de interacción
      limits: {
        daily: 50,      // Máximo de interacciones por día
        hourly: 10,     // Máximo de interacciones por hora
        cooldown: 30,   // Tiempo de espera entre interacciones (segundos)
        pauseTime: 3600 // Tiempo de pausa cuando se alcanza un límite (segundos)
      },

      // Filtros para interacciones
      filters: {
        commonInterests: true,    // Filtrar por intereses comunes
        minFriends: 50,          // Mínimo de amigos
        maxFriends: 5000,        // Máximo de amigos
        profileAge: 180,         // Edad mínima del perfil en días
        mustBeMember: true,      // Debe ser miembro del grupo
        excludeInteracted: true,  // Excluir miembros con interacciones previas
        language: 'es'           // Idioma preferido del perfil
      },

      // Plantillas de mensajes
      messageTemplates: [
        {
          id: 1,
          name: "Saludo formal",
          text: "Hola [nombre], vi que compartimos interés en [interés]. Me gustaría conectar contigo.",
          tags: ["formal", "networking"]
        },
        {
          id: 2,
          name: "Saludo casual",
          text: "¡Hola [nombre]! 👋 Noté que también te interesa [interés]. ¿Qué opinas sobre [tema]?",
          tags: ["casual", "friendly"]
        }
      ],

      // Configuración de retrasos
      delays: {
        betweenMessages: {
          min: 60,   // Mínimo segundos entre mensajes
          max: 180   // Máximo segundos entre mensajes
        },
        typing: {
          min: 2,    // Mínimo segundos escribiendo
          max: 5     // Máximo segundos escribiendo
        }
      },

      // Configuración de horarios
      schedule: {
        enabled: true,
        activeHours: {
          start: "09:00",
          end: "18:00"
        },
        timezone: "America/Mexico_City",
        workDays: [1, 2, 3, 4, 5] // Lunes a Viernes
      }
    };
  }

  // Cargar configuración guardada
  async loadConfig() {
    try {
      const saved = await new Promise(resolve => {
        chrome.storage.local.get('interactionConfig', result => {
          resolve(result.interactionConfig);
        });
      });

      if (saved) {
        this.config = {
          ...this.config,
          ...saved,
          filters: {
            ...this.config.filters,
            ...(saved.filters || {})
          },
          limits: {
            ...this.config.limits,
            ...(saved.limits || {})
          }
        };
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
    }
  }

  // Guardar configuración actual
  async saveConfig() {
    try {
      await new Promise(resolve => {
        chrome.storage.local.set({
          interactionConfig: this.config
        }, resolve);
      });
    } catch (error) {
      console.error('Error al guardar configuración:', error);
    }
  }

  // Obtener configuración completa
  getConfig() {
    return { ...this.config };
  }

  // Actualizar configuración
  async updateConfig(newConfig) {
    this.config = {
      ...this.config,
      ...newConfig,
      filters: {
        ...this.config.filters,
        ...(newConfig.filters || {})
      },
      limits: {
        ...this.config.limits,
        ...(newConfig.limits || {})
      }
    };
    
    await this.saveConfig();
  }

  // Métodos para plantillas de mensajes
  getMessageTemplates() {
    return [...this.config.messageTemplates];
  }

  async addMessageTemplate(template) {
    const newId = Math.max(...this.config.messageTemplates.map(t => t.id), 0) + 1;
    const newTemplate = {
      ...template,
      id: newId
    };
    
    this.config.messageTemplates.push(newTemplate);
    await this.saveConfig();
    return newTemplate;
  }

  async removeMessageTemplate(templateId) {
    this.config.messageTemplates = this.config.messageTemplates.filter(t => t.id !== templateId);
    await this.saveConfig();
  }

  // Verificar si está dentro del horario activo
  isWithinActiveHours() {
    if (!this.config.schedule.enabled) return true;

    const now = new Date();
    const [startHour, startMinute] = this.config.schedule.activeHours.start.split(':').map(Number);
    const [endHour, endMinute] = this.config.schedule.activeHours.end.split(':').map(Number);
    
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay();

    // Verificar día de trabajo
    if (!this.config.schedule.workDays.includes(currentDay)) return false;

    // Convertir a minutos para comparación más fácil
    const currentTime = currentHour * 60 + currentMinute;
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    return currentTime >= startTime && currentTime <= endTime;
  }

  // Obtener delay aleatorio para mensajes
  getMessageDelay() {
    const { min, max } = this.config.delays.betweenMessages;
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  // Obtener delay aleatorio para escritura
  getTypingDelay() {
    const { min, max } = this.config.delays.typing;
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  // Verificar si un miembro cumple con los filtros
  meetsFilters(memberData) {
    const filters = this.config.filters;
    
    if (filters.minFriends && memberData.friendCount < filters.minFriends) return false;
    if (filters.maxFriends && memberData.friendCount > filters.maxFriends) return false;
    if (filters.profileAge) {
      const profileAgeInDays = (Date.now() - memberData.profileCreated) / (1000 * 60 * 60 * 24);
      if (profileAgeInDays < filters.profileAge) return false;
    }
    if (filters.mustBeMember && !memberData.isMember) return false;
    if (filters.language && memberData.language !== filters.language) return false;
    if (filters.commonInterests && (!memberData.interests || memberData.interests.length === 0)) return false;
    if (filters.excludeInteracted && memberData.hasInteracted) return false;

    return true;
  }

  // Restablecer configuración por defecto
  async resetToDefault() {
    this.config = new InteractionConfig().config;
    await this.saveConfig();
  }
}

// Exportar la clase
export default InteractionConfig; 