/**
 * Gestor centralizado de opciones para Lead Manager Pro
 * Maneja todas las configuraciones usando únicamente chrome.storage
 */

class OptionsManager {
  constructor() {
    this.STORAGE_SYNC = chrome.storage.sync;
    // Solo dos claves válidas
    this.VALID_KEYS = ['groupSearchSettings', 'peopleSearchSettings'];
    this.DEFAULTS = {
      groupSearchSettings: {
        types: { public: true, private: true },
        minUsers: 1000,
        minPosts: { year: 100, month: 10, day: 1 },
        maxScrolls: 50,
        scrollDelay: 2
      },
      peopleSearchSettings: {
        maxScrolls: 50,
        scrollDelay: 2
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
      this.STORAGE_SYNC.get(this.VALID_KEYS, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        this.cache.groupSearchSettings = { ...this.DEFAULTS.groupSearchSettings, ...(result.groupSearchSettings || {}) };
        this.cache.peopleSearchSettings = { ...this.DEFAULTS.peopleSearchSettings, ...(result.peopleSearchSettings || {}) };
        console.log('OptionsManager: Opciones cargadas:', this.cache);
        resolve(this.cache);
      });
    });
  }

  /**
   * Obtiene una sección de opciones
   */
  getOptions(key) {
    if (!this.VALID_KEYS.includes(key)) return {};
    return this.cache[key] || this.DEFAULTS[key] || {};
  }

  /**
   * Obtiene una opción específica
   */
  getOption(key, optionKey, defaultValue = null) {
    const sectionOptions = this.getOptions(key);

    // Soporte para claves anidadas (ej: 'types.public')
    if (optionKey.includes('.')) {
      const keys = optionKey.split('.');
      let value = sectionOptions;

      for (const k of keys) {
        value = value?.[k];
        if (value === undefined) break;
      }

      return value !== undefined ? value : defaultValue;
    }

    return sectionOptions[optionKey] !== undefined ? sectionOptions[optionKey] : defaultValue;
  }

  /**
   * Establece opciones para una sección
   */
  async setOptions(key, options) {
    return new Promise((resolve, reject) => {
      if (!this.VALID_KEYS.includes(key)) {
        console.error('OptionsManager: Invalid storage key:', key);
        reject(new Error(`Invalid storage key: ${key}`));
        return;
      }
      this.cache[key] = { ...this.cache[key], ...options };
      const dataToSave = { [key]: this.cache[key] };
      this.STORAGE_SYNC.set(dataToSave, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        this.notifyListeners(key, this.cache[key]);
        console.log(`OptionsManager: Opciones de ${key} actualizadas:`, this.cache[key]);
        resolve(this.cache[key]);
      });
    });
  }

  /**
   * Establece una opción específica
   */
  async setOption(key, optionKey, value) {
    const currentOptions = this.getOptions(key);
    if (optionKey.includes('.')) {
      const keys = optionKey.split('.');
      const updated = { ...currentOptions };
      let current = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return await this.setOptions(key, updated);
    } else {
      return await this.setOptions(key, { [optionKey]: value });
    }
  }

  /**
   * Resetea una sección a valores por defecto
   */
  async resetSection(key) {
    const defaults = this.DEFAULTS[key];
    if (!defaults) {
      throw new Error(`Sección desconocida: ${key}`);
    }

    return await this.setOptions(key, defaults);
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

      for (const [key, sectionOptions] of Object.entries(options)) {
        if (this.DEFAULTS[key]) {
          await this.setOptions(key, sectionOptions);
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
  addListener(key, callback) {
    if (!this.listeners[key]) {
      this.listeners[key] = [];
    }
    this.listeners[key].push(callback);
    return () => {
      this.listeners[key] = this.listeners[key].filter(cb => cb !== callback);
    };
  }

  /**
   * Notifica a los listeners sobre cambios
   */
  notifyListeners(key, newOptions) {
    if (this.listeners[key]) {
      this.listeners[key].forEach(callback => {
        try {
          callback(newOptions, key);
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
    const options = this.getOptions('groupSearchSettings');

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
