// Módulo para consolidar y migrar sistemas de almacenamiento duplicados

class StorageConsolidator {
  constructor() {
    this.UNIFIED_KEY = 'lmp_group_search_options';
    this.OLD_KEYS = [
      'leadManagerGroupFilters',
      'snap_lead_manager_group_options',
      'groupPublic',
      'groupPrivate',
      'minUsers',
      'minPostsYear',
      'minPostsMonth',
      'minPostsDay',
      'onlyPublicGroups'
    ];
  }

  // Migrar y consolidar todas las configuraciones existentes
  async migrateAndConsolidate() {
    try {
      console.log('StorageConsolidator: Iniciando migración y consolidación...');

      // 1. Leer todas las configuraciones existentes
      const allData = await this.getAllStorageData();

      // 2. Consolidar en un objeto unificado
      const consolidatedOptions = this.consolidateOptions(allData);

      // 3. Guardar en el sistema unificado
      await this.saveConsolidated(consolidatedOptions);

      // 4. Limpiar claves obsoletas
      await this.cleanupOldKeys();

      console.log('StorageConsolidator: Migración completada exitosamente');
      return consolidatedOptions;

    } catch (error) {
      console.error('StorageConsolidator: Error durante la migración:', error);
      return null;
    }
  }

  // Obtener todos los datos de storage
  async getAllStorageData() {
    return new Promise((resolve) => {
      // Obtener de chrome.storage
      chrome.storage.local.get(null, (chromeData) => {
        // Obtener de localStorage
        const localData = {};
        try {
          // Intentar obtener datos del localStorage
          const snapOptions = localStorage.getItem('snap_lead_manager_group_options');
          if (snapOptions) {
            localData.snap_lead_manager_group_options = JSON.parse(snapOptions);
          }

          const lmpOptions = localStorage.getItem('lmp_group_search_options');
          if (lmpOptions) {
            localData.lmp_group_search_options = JSON.parse(lmpOptions);
          }
        } catch (error) {
          console.warn('StorageConsolidator: Error al leer localStorage:', error);
        }

        resolve({
          chrome: chromeData,
          local: localData
        });
      });
    });
  }

  // Consolidar opciones de múltiples fuentes
  consolidateOptions(allData) {
    const defaults = {
      publicGroups: true,
      privateGroups: true,
      onlyPublicGroups: false,
      minUsers: '',
      minPostsYear: '',
      minPostsMonth: '',
      minPostsDay: '',
      groupTypes: {
        public: true,
        private: true
      },
      minMembers: 100,
      minPosts: {
        year: 50,
        month: 10,
        day: 1
      }
    };

    let consolidated = { ...defaults };

    // Prioridad de fuentes (orden de menor a mayor prioridad):
    // 1. leadManagerGroupFilters (más antiguo)
    // 2. snap_lead_manager_group_options (intermedio)
    // 3. Propiedades individuales de chrome.storage (más reciente)
    // 4. lmp_group_search_options (más reciente si existe)

    // 1. Migrar desde leadManagerGroupFilters
    if (allData.chrome.leadManagerGroupFilters) {
      const old = allData.chrome.leadManagerGroupFilters;
      if (old.groupTypes) {
        consolidated.publicGroups = old.groupTypes.public !== undefined ? old.groupTypes.public : true;
        consolidated.privateGroups = old.groupTypes.private !== undefined ? old.groupTypes.private : true;
      }
      if (old.minMembers !== undefined) consolidated.minUsers = old.minMembers;
      if (old.minPosts) {
        if (old.minPosts.year !== undefined) consolidated.minPostsYear = old.minPosts.year;
        if (old.minPosts.month !== undefined) consolidated.minPostsMonth = old.minPosts.month;
        if (old.minPosts.day !== undefined) consolidated.minPostsDay = old.minPosts.day;
      }
    }

    // 2. Migrar desde snap_lead_manager_group_options
    if (allData.local.snap_lead_manager_group_options) {
      const snap = allData.local.snap_lead_manager_group_options;
      if (snap.publicGroups !== undefined) consolidated.publicGroups = snap.publicGroups;
      if (snap.privateGroups !== undefined) consolidated.privateGroups = snap.privateGroups;
      if (snap.minUsers !== undefined) consolidated.minUsers = snap.minUsers;
      if (snap.minPostsYear !== undefined) consolidated.minPostsYear = snap.minPostsYear;
      if (snap.minPostsMonth !== undefined) consolidated.minPostsMonth = snap.minPostsMonth;
      if (snap.minPostsDay !== undefined) consolidated.minPostsDay = snap.minPostsDay;
      if (snap.onlyPublicGroups !== undefined) consolidated.onlyPublicGroups = snap.onlyPublicGroups;
    }

    // 3. Migrar propiedades individuales de chrome.storage (la más reciente)
    if (allData.chrome.groupPublic !== undefined) consolidated.publicGroups = allData.chrome.groupPublic;
    if (allData.chrome.groupPrivate !== undefined) consolidated.privateGroups = allData.chrome.groupPrivate;
    if (allData.chrome.minUsers !== undefined) consolidated.minUsers = allData.chrome.minUsers;
    if (allData.chrome.minPostsYear !== undefined) consolidated.minPostsYear = allData.chrome.minPostsYear;
    if (allData.chrome.minPostsMonth !== undefined) consolidated.minPostsMonth = allData.chrome.minPostsMonth;
    if (allData.chrome.minPostsDay !== undefined) consolidated.minPostsDay = allData.chrome.minPostsDay;
    if (allData.chrome.onlyPublicGroups !== undefined) consolidated.onlyPublicGroups = allData.chrome.onlyPublicGroups;

    // 4. Usar lmp_group_search_options si ya existe (máxima prioridad)
    if (allData.local.lmp_group_search_options) {
      consolidated = { ...consolidated, ...allData.local.lmp_group_search_options };
    } else if (allData.chrome.lmp_group_search_options) {
      consolidated = { ...consolidated, ...allData.chrome.lmp_group_search_options };
    }

    // Asegurar consistencia entre onlyPublicGroups y las opciones de tipos
    if (consolidated.onlyPublicGroups) {
      consolidated.publicGroups = true;
      consolidated.privateGroups = false;
    }

    console.log('StorageConsolidator: Opciones consolidadas:', consolidated);
    return consolidated;
  }

  // Guardar opciones consolidadas
  async saveConsolidated(options) {
    return new Promise((resolve, reject) => {
      // Validar que las claves no sean undefined
      const validatedOptions = {};
      for (const [key, value] of Object.entries(options)) {
        if (key !== 'undefined' && typeof key === 'string' && key.length > 0) {
          validatedOptions[key] = value;
        }
      }

      // Guardar en chrome.storage
      chrome.storage.local.set({
        [this.UNIFIED_KEY]: validatedOptions,
        // Mantener compatibilidad con propiedades individuales por ahora
        groupPublic: validatedOptions.publicGroups,
        groupPrivate: validatedOptions.privateGroups,
        minUsers: validatedOptions.minUsers,
        minPostsYear: validatedOptions.minPostsYear,
        minPostsMonth: validatedOptions.minPostsMonth,
        minPostsDay: validatedOptions.minPostsDay,
        onlyPublicGroups: validatedOptions.onlyPublicGroups
      }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          // También guardar en localStorage para acceso rápido
          try {
            localStorage.setItem(this.UNIFIED_KEY, JSON.stringify(validatedOptions));
            console.log('StorageConsolidator: Configuración guardada en ambos sistemas');
            resolve(validatedOptions);
          } catch (error) {
            console.warn('StorageConsolidator: Error al guardar en localStorage:', error);
            resolve(validatedOptions); // Aún así consideramos exitoso el guardado en chrome.storage
          }
        }
      });
    });
  }

  // Limpiar claves obsoletas (pero mantener compatibilidad por ahora)
  async cleanupOldKeys() {
    return new Promise((resolve) => {
      // Solo remover las claves realmente obsoletas, no las de compatibilidad
      const keysToRemove = [
        'leadManagerGroupFilters'
        // Mantener las otras por compatibilidad: groupPublic, groupPrivate, etc.
      ];

      if (keysToRemove.length > 0) {
        chrome.storage.local.remove(keysToRemove, () => {
          console.log('StorageConsolidator: Claves obsoletas removidas:', keysToRemove);
          resolve();
        });
      } else {
        resolve();
      }

      // Limpiar localStorage obsoleto
      try {
        localStorage.removeItem('snap_lead_manager_group_options');
        console.log('StorageConsolidator: localStorage obsoleto limpiado');
      } catch (error) {
        console.warn('StorageConsolidator: Error al limpiar localStorage:', error);
      }
    });
  }

  // Obtener configuración consolidada actual
  async getCurrentOptions() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.UNIFIED_KEY], (result) => {
        if (result && result[this.UNIFIED_KEY]) {
          resolve(result[this.UNIFIED_KEY]);
        } else {
          // Si no existe, ejecutar migración
          this.migrateAndConsolidate().then(resolve);
        }
      });
    });
  }

  // Verificar si necesita migración
  async needsMigration() {
    const allData = await this.getAllStorageData();

    // Si ya existe la clave unificada, verificar si hay datos obsoletos
    const hasUnified = allData.chrome[this.UNIFIED_KEY] || allData.local[this.UNIFIED_KEY];
    const hasObsolete = allData.chrome.leadManagerGroupFilters || allData.local.snap_lead_manager_group_options;

    return !hasUnified || hasObsolete;
  }
}

// Exportar la clase
window.leadManagerPro = window.leadManagerPro || {};
window.leadManagerPro.storageConsolidator = new StorageConsolidator();

// Auto-ejecutar migración si es necesario
(async () => {
  try {
    const consolidator = window.leadManagerPro.storageConsolidator;
    if (await consolidator.needsMigration()) {
      console.log('StorageConsolidator: Ejecutando migración automática...');
      await consolidator.migrateAndConsolidate();
    }
  } catch (error) {
    console.error('StorageConsolidator: Error en migración automática:', error);
  }
})();
