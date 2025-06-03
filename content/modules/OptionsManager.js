/**
 * Gestor centralizado de opciones para Lead Manager Pro
 * Maneja todas las configuraciones usando únicamente chrome.storage
 */

class OptionsManager {
  constructor() {
    this.STORAGE = chrome.storage.local;
    this.STORAGE_SYNC = chrome.storage.sync;
    
    // Claves para las diferentes secciones de opciones
    this.KEYS = {
      GENERAL: 'lmp_general_options',
      GROUP_SEARCH: 'lmp_group_search_options',
      MEMBER_INTERACTION: 'lmp_member_interaction_options',
      UI_PREFERENCES: 'lmp_ui_preferences'
    };
    
    // Valores por defecto
    this.DEFAULTS = {
      general: {
        maxScrolls: 50,
        scrollDelay: 2,
        autoSave: true,
        debugMode: false
      },
      groupSearch: {
        types: {
          public: true,
          private: true
        },
        minUsers: 1000,
        minPosts: {
          year: 100,
          month: 10,
          day: 1
        }
      },
      memberInteraction: {
        membersToInteract: 10,
        interactionDelay: 3,
        message: "¡Hola! Me interesa conectar contigo.",
        autoCloseChat: true,
        respectLimits: true
      },
      uiPreferences: {
        sidebarPosition: 'right',
        compactMode: false,
        showNotifications: true,
        theme: 'light'
      }
    };
    
    this.cache = {};
    this.listeners = {};
  }
  
  /**
   * Inicializa el gestor de opciones
   */
  async init() {
    try {
      await this.loadAllOptions();
      console.log('OptionsManager: Inicializado correctamente');
      return true;
    } catch (error) {
      console.error('OptionsManager: Error al inicializar:', error);
      return false;
    }
  }
  
  /**
   * Carga todas las opciones desde storage
   */
  async loadAllOptions() {
    return new Promise((resolve, reject) => {
      const allKeys = Object.values(this.KEYS);
      
      this.STORAGE.get(allKeys, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        
        // Cargar con valores por defecto si no existen
        this.cache.general = { ...this.DEFAULTS.general, ...(result[this.KEYS.GENERAL] || {}) };
        this.cache.groupSearch = { ...this.DEFAULTS.groupSearch, ...(result[this.KEYS.GROUP_SEARCH] || {}) };
        this.cache.memberInteraction = { ...this.DEFAULTS.memberInteraction, ...(result[this.KEYS.MEMBER_INTERACTION] || {}) };
        this.cache.uiPreferences = { ...this.DEFAULTS.uiPreferences, ...(result[this.KEYS.UI_PREFERENCES] || {}) };
        
        console.log('OptionsManager: Opciones cargadas:', this.cache);
        resolve(this.cache);
      });
    });
  }
  
  /**
   * Obtiene una sección de opciones
   */
  getOptions(section) {
    return this.cache[section] || this.DEFAULTS[section] || {};
  }
  
  /**
   * Obtiene una opción específica
   */
  getOption(section, key, defaultValue = null) {
    const sectionOptions = this.getOptions(section);
    
    // Soporte para claves anidadas (ej: 'types.public')
    if (key.includes('.')) {
      const keys = key.split('.');
      let value = sectionOptions;
      
      for (const k of keys) {
        value = value?.[k];
        if (value === undefined) break;
      }
      
      return value !== undefined ? value : defaultValue;
    }
    
    return sectionOptions[key] !== undefined ? sectionOptions[key] : defaultValue;
  }
  
  /**
   * Establece opciones para una sección
   */
  async setOptions(section, options) {
    return new Promise((resolve, reject) => {
      // Actualizar cache
      this.cache[section] = { ...this.cache[section], ...options };
      
      // Guardar en storage
      const dataToSave = {
        [this.KEYS[section.toUpperCase().replace(/([A-Z])/g, '_$1')]]: this.cache[section]
      };
      
      this.STORAGE.set(dataToSave, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        
        // También sincronizar en storage.sync
        this.STORAGE_SYNC.set(dataToSave, () => {
          if (chrome.runtime.lastError) {
            console.warn('OptionsManager: Error al sincronizar:', chrome.runtime.lastError);
          }
        });
        
        // Notificar a listeners
        this.notifyListeners(section, this.cache[section]);
        
        console.log(`OptionsManager: Opciones de ${section} actualizadas:`, this.cache[section]);
        resolve(this.cache[section]);
      });
    });
  }
  
  /**
   * Establece una opción específica
   */
  async setOption(section, key, value) {
    const currentOptions = this.getOptions(section);
    
    // Soporte para claves anidadas
    if (key.includes('.')) {
      const keys = key.split('.');
      const updated = { ...currentOptions };
      let current = updated;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return await this.setOptions(section, updated);
    } else {
      return await this.setOptions(section, { [key]: value });
    }
  }
  
  /**
   * Resetea una sección a valores por defecto
   */
  async resetSection(section) {
    const defaults = this.DEFAULTS[section];
    if (!defaults) {
      throw new Error(`Sección desconocida: ${section}`);
    }
    
    return await this.setOptions(section, defaults);
  }
  
  /**
   * Exporta todas las opciones
   */
  exportOptions() {
    return {
      ...this.cache,
      exportedAt: new Date().toISOString(),
      version: '0.5.0'
    };
  }
  
  /**
   * Importa opciones desde un objeto
   */
  async importOptions(optionsData) {
    try {
      const { exportedAt, version, ...options } = optionsData;
      
      for (const [section, sectionOptions] of Object.entries(options)) {
        if (this.DEFAULTS[section]) {
          await this.setOptions(section, sectionOptions);
        }
      }
      
      console.log('OptionsManager: Opciones importadas correctamente');
      return true;
    } catch (error) {
      console.error('OptionsManager: Error al importar opciones:', error);
      return false;
    }
  }
  
  /**
   * Añade un listener para cambios en opciones
   */
  addListener(section, callback) {
    if (!this.listeners[section]) {
      this.listeners[section] = [];
    }
    
    this.listeners[section].push(callback);
    
    // Retornar función para remover el listener
    return () => {
      this.listeners[section] = this.listeners[section].filter(cb => cb !== callback);
    };
  }
  
  /**
   * Notifica a los listeners sobre cambios
   */
  notifyListeners(section, newOptions) {
    if (this.listeners[section]) {
      this.listeners[section].forEach(callback => {
        try {
          callback(newOptions, section);
        } catch (error) {
          console.error('OptionsManager: Error en listener:', error);
        }
      });
    }
  }
  
  /**
   * Obtiene las opciones actuales para búsqueda de grupos con filtros aplicados
   */
  getGroupSearchFilters() {
    const options = this.getOptions('groupSearch');
    
    return {
      types: options.types || { public: true, private: true },
      minUsers: options.minUsers || 0,
      minPosts: options.minPosts || { year: 0, month: 0, day: 0 },
      // Función helper para validar si un grupo pasa los filtros
      validateGroup: function(group) {
        // Validar tipo de grupo
        if (group.isPublic && !this.types.public) return false;
        if (!group.isPublic && !this.types.private) return false;
        
        // Validar cantidad mínima de usuarios
        if (group.memberCount < this.minUsers) return false;
        
        // Validar publicaciones (al menos una de las tres condiciones debe cumplirse)
        const hasMinYearPosts = !this.minPosts.year || (group.postsPerYear >= this.minPosts.year);
        const hasMinMonthPosts = !this.minPosts.month || (group.postsPerMonth >= this.minPosts.month);
        const hasMinDayPosts = !this.minPosts.day || (group.postsPerDay >= this.minPosts.day);
        
        // Si no se especifica ningún mínimo de posts, no filtrar por posts
        if (!this.minPosts.year && !this.minPosts.month && !this.minPosts.day) {
          return true;
        }
        
        return hasMinYearPosts || hasMinMonthPosts || hasMinDayPosts;
      }
    };
  }
}

// Crear instancia global
window.LeadManagerPro = window.LeadManagerPro || {};
window.LeadManagerPro.OptionsManager = new OptionsManager();

// Auto-inicializar cuando esté disponible
if (typeof chrome !== 'undefined' && chrome.storage) {
  window.LeadManagerPro.OptionsManager.init().catch(console.error);
}
