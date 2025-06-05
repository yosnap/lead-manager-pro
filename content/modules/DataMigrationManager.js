/**
 * Script de migración para consolidar todos los datos en chrome.storage
 * Migra datos existentes de localStorage y elimina referencias obsoletas
 */

class DataMigrationManager {
  constructor() {
    this.MIGRATION_VERSION = '0.5.0';
    this.MIGRATION_KEY = 'lmp_migration_completed';

    // Mapeo de claves de localStorage a chrome.storage
    this.MIGRATION_MAP = {
      // Datos de autenticación (ya migrados en auth.js)
      'lmp_auth': 'skip', // Ya manejado por auth.js
      'lmp_auth_user': 'skip',
      'lmp_auth_timestamp': 'skip',

      // Opciones generales
      'snap_lead_manager_general_options': 'lmp_general_options',
      'snap_lead_manager_group_options': 'lmp_group_search_options',

      // Datos de búsqueda y resultados
      'snap_lead_manager_search_results': 'lmp_search_results',
      'snap_lead_manager_search_history': 'lmp_search_history',
      'snap_lead_manager_saved_criteria': 'lmp_saved_criteria',

      // Configuraciones específicas
      'lmp_n8n_config': 'lmp_n8n_config', // Mantener
      'lmp_ui_preferences': 'lmp_ui_preferences', // Mantener

      // Datos temporales (limpiar)
      'snap_lead_manager_temp_data': 'delete',
      'snap_lead_manager_debug_log': 'delete'
    };

    // Claves que deben eliminarse completamente
    this.KEYS_TO_DELETE = [
      'snap_lead_manager_temp_data',
      'snap_lead_manager_debug_log',
      'lmp_temp_search',
      'lmp_temp_results'
    ];
  }

  async performMigration() {
    try {
      // Verificar si la migración ya se realizó
      const migrationStatus = await this.checkMigrationStatus();
      if (migrationStatus.completed) {
        console.log('DataMigrationManager: Migración ya completada');
        return { success: true, message: 'Migration already completed' };
      }

      console.log('DataMigrationManager: Iniciando migración de datos...');

      // 1. Migrar datos de localStorage a chrome.storage
      const migrationResults = await this.migrateLocalStorageData();

      // 2. Limpiar localStorage de claves obsoletas
      await this.cleanupLocalStorage();

      // 3. Validar datos migrados
      const validationResults = await this.validateMigratedData();

      // 4. Marcar migración como completada
      await this.markMigrationCompleted();

      console.log('DataMigrationManager: Migración completada exitosamente');

      return {
        success: true,
        message: 'Migration completed successfully',
        details: {
          migrated: migrationResults.migrated,
          deleted: migrationResults.deleted,
          validation: validationResults
        }
      };

    } catch (error) {
      console.error('DataMigrationManager: Error durante la migración:', error);
      return {
        success: false,
        message: 'Migration failed',
        error: error.message
      };
    }
  }

  async checkMigrationStatus() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.MIGRATION_KEY], (result) => {
        const status = result[this.MIGRATION_KEY];
        resolve({
          completed: status?.version === this.MIGRATION_VERSION,
          lastMigration: status?.timestamp || null
        });
      });
    });
  }

  async migrateLocalStorageData() {
    const migrated = [];
    const deleted = [];
    const errors = [];

    // Obtener todas las claves de localStorage
    const localStorageKeys = Object.keys(localStorage);
    console.log('LocalStorage keys found:', localStorageKeys);

    for (const [localKey, chromeKey] of Object.entries(this.MIGRATION_MAP)) {
      try {
        const localValue = localStorage.getItem(localKey);

        if (localValue !== null) {
          if (chromeKey === 'skip') {
            console.log(`Skipping migration for ${localKey} (handled elsewhere)`);
            continue;
          }

          if (chromeKey === 'delete') {
            localStorage.removeItem(localKey);
            deleted.push(localKey);
            console.log(`Deleted obsolete key: ${localKey}`);
            continue;
          }

          // Parsear el valor si es JSON
          let parsedValue;
          try {
            parsedValue = JSON.parse(localValue);
          } catch (e) {
            parsedValue = localValue; // Mantener como string si no es JSON
          }

          // Migrar a chrome.storage
          await this.saveToChromeStorage(chromeKey, parsedValue);
          migrated.push({ from: localKey, to: chromeKey, value: parsedValue });

          console.log(`Migrated ${localKey} -> ${chromeKey}`);
        }
      } catch (error) {
        errors.push({ key: localKey, error: error.message });
        console.error(`Error migrating ${localKey}:`, error);
      }
    }

    return { migrated, deleted, errors };
  }

  async saveToChromeStorage(key, value) {
    return new Promise((resolve, reject) => {
      // Validar que la clave no sea undefined, null o vacía
      if (!key || key === 'undefined' || typeof key !== 'string') {
        console.error('DataMigrationManager: Invalid key provided to saveToChromeStorage:', key);
        reject(new Error(`Invalid storage key: ${key}`));
        return;
      }

      const data = { [key]: value };

      chrome.storage.local.set(data, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }

        // También guardar en sync como respaldo
        chrome.storage.sync.set(data, () => {
          if (chrome.runtime.lastError) {
            console.warn(`Warning: Could not sync ${key}:`, chrome.runtime.lastError);
          }
          resolve();
        });
      });
    });
  }

  async cleanupLocalStorage() {
    const cleanedKeys = [];

    // Eliminar claves específicas marcadas para eliminación
    for (const key of this.KEYS_TO_DELETE) {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
        cleanedKeys.push(key);
      }
    }

    // Eliminar claves que ya fueron migradas
    for (const [localKey, chromeKey] of Object.entries(this.MIGRATION_MAP)) {
      if (chromeKey !== 'skip' && chromeKey !== 'delete' && localStorage.getItem(localKey) !== null) {
        localStorage.removeItem(localKey);
        cleanedKeys.push(localKey);
      }
    }

    console.log('LocalStorage keys cleaned:', cleanedKeys);
    return cleanedKeys;
  }

  async validateMigratedData() {
    const validation = {
      success: true,
      validated: [],
      errors: []
    };

    // Validar que los datos críticos se migraron correctamente
    const criticalKeys = ['lmp_general_options', 'lmp_group_search_options'];

    for (const key of criticalKeys) {
      try {
        const data = await this.getFromChromeStorage(key);
        if (data !== null) {
          validation.validated.push(key);
        } else {
          validation.errors.push({ key, error: 'Data not found after migration' });
          validation.success = false;
        }
      } catch (error) {
        validation.errors.push({ key, error: error.message });
        validation.success = false;
      }
    }

    return validation;
  }

  async getFromChromeStorage(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key] || null);
      });
    });
  }

  async markMigrationCompleted() {
    const migrationData = {
      version: this.MIGRATION_VERSION,
      timestamp: new Date().toISOString(),
      completed: true
    };

    await this.saveToChromeStorage(this.MIGRATION_KEY, migrationData);
    console.log('Migration marked as completed:', migrationData);
  }

  // Método para forzar una nueva migración (para desarrollo/debug)
  async resetMigration() {
    return new Promise((resolve) => {
      chrome.storage.local.remove([this.MIGRATION_KEY], () => {
        chrome.storage.sync.remove([this.MIGRATION_KEY], () => {
          console.log('Migration status reset');
          resolve();
        });
      });
    });
  }

  // Método para obtener un reporte del estado actual
  async generateMigrationReport() {
    const status = await this.checkMigrationStatus();
    const chromeStorageData = await this.getAllChromeStorageData();
    const localStorageData = this.getAllLocalStorageData();

    return {
      migrationStatus: status,
      chromeStorageKeys: Object.keys(chromeStorageData),
      localStorageKeys: Object.keys(localStorageData),
      timestamp: new Date().toISOString()
    };
  }

  async getAllChromeStorageData() {
    return new Promise((resolve) => {
      chrome.storage.local.get(null, (result) => {
        resolve(result || {});
      });
    });
  }

  getAllLocalStorageData() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        data[key] = localStorage.getItem(key);
      }
    }
    return data;
  }
}

// Crear instancia global
window.LeadManagerPro = window.LeadManagerPro || {};
window.LeadManagerPro.DataMigrationManager = new DataMigrationManager();

// Auto-ejecutar migración al cargar
if (typeof chrome !== 'undefined' && chrome.storage) {
  // Ejecutar migración después de un pequeño delay para asegurar que otros módulos estén cargados
  setTimeout(async () => {
    try {
      const result = await window.LeadManagerPro.DataMigrationManager.performMigration();
      console.log('DataMigrationManager: Migration result:', result);
    } catch (error) {
      console.error('DataMigrationManager: Auto-migration failed:', error);
    }
  }, 500);
}
