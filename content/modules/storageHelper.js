/**
 * Módulo para gestionar el almacenamiento de datos
 * Este módulo proporciona una capa de abstracción sobre localStorage y chrome.storage
 * para manejar datos de manera más eficiente y prevenir errores de cuota
 */

(function() {
  console.log('Lead Manager Pro: Inicializando StorageHelper');
  
  // Namespace para la organización del código
  window.LeadManagerPro = window.LeadManagerPro || {};
  
  // Tamaño máximo seguro para localStorage (aproximadamente 4MB)
  const MAX_LOCALSTORAGE_SIZE = 4 * 1024 * 1024;
  
  // Clase StorageHelper
  class StorageHelper {
    /**
     * Guarda datos en almacenamiento, manejando automáticamente el tamaño
     * @param {string} key - Clave para almacenar los datos
     * @param {any} data - Datos a almacenar
     * @param {boolean} preferExtensionStorage - Si es true, intenta usar chrome.storage primero
     * @returns {Promise<boolean>} - Promise que resuelve a true si tuvo éxito
     */
    async save(key, data, preferExtensionStorage = false) {
      try {
        const stringifiedData = JSON.stringify(data);
        const dataSize = stringifiedData.length;
        
        // Si los datos son pequeños o preferimos localStorage
        if (dataSize < MAX_LOCALSTORAGE_SIZE && !preferExtensionStorage) {
          localStorage.setItem(key, stringifiedData);
          return true;
        }
        
        // Si los datos son demasiado grandes o preferimos chrome.storage
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          return new Promise((resolve) => {
            const storageObj = {};
            storageObj[key] = data;
            
            chrome.storage.local.set(storageObj, () => {
              const success = !chrome.runtime.lastError;
              if (!success) {
                console.error('StorageHelper: Error en chrome.storage:', chrome.runtime.lastError);
              }
              resolve(success);
            });
          });
        }
        
        // Si chrome.storage no está disponible, pero los datos son grandes,
        // intentamos guardar una versión reducida en localStorage
        if (dataSize >= MAX_LOCALSTORAGE_SIZE) {
          console.warn('StorageHelper: Datos demasiado grandes para localStorage y chrome.storage no disponible');
          
          // Crear un objeto con datos esenciales
          const essentialData = {
            originalType: typeof data,
            isArray: Array.isArray(data),
            timestamp: Date.now(),
            truncated: true,
            dataSize: dataSize,
            summary: this._generateSummary(data)
          };
          
          localStorage.setItem(key, JSON.stringify(essentialData));
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('StorageHelper: Error al guardar datos:', error);
        return false;
      }
    }
    
    /**
     * Carga datos desde el almacenamiento
     * @param {string} key - Clave para recuperar los datos
     * @param {boolean} tryBothStorages - Si es true, intenta recuperar de localStorage y chrome.storage
     * @returns {Promise<any>} - Promise que resuelve con los datos o null si no se encontraron
     */
    async load(key, tryBothStorages = true) {
      try {
        // Primero intentamos localStorage por velocidad
        const localData = localStorage.getItem(key);
        
        if (localData) {
          try {
            const parsedData = JSON.parse(localData);
            
            // Verificar si son datos truncados
            if (parsedData && parsedData.truncated === true) {
              console.warn('StorageHelper: Los datos recuperados de localStorage están truncados');
              
              // Si se solicita, intentar recuperar la versión completa de chrome.storage
              if (tryBothStorages && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                const extensionData = await this._loadFromExtensionStorage(key);
                if (extensionData !== null) {
                  return extensionData;
                }
              }
            }
            
            return parsedData;
          } catch (parseError) {
            console.error('StorageHelper: Error al parsear datos de localStorage:', parseError);
            return null;
          }
        }
        
        // Si no hay datos en localStorage o queremos intentar ambos
        if (tryBothStorages && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          return await this._loadFromExtensionStorage(key);
        }
        
        return null;
      } catch (error) {
        console.error('StorageHelper: Error al cargar datos:', error);
        return null;
      }
    }
    
    /**
     * Elimina datos del almacenamiento
     * @param {string} key - Clave a eliminar
     * @param {boolean} fromBothStorages - Si es true, elimina de localStorage y chrome.storage
     * @returns {Promise<boolean>} - Promise que resuelve a true si tuvo éxito
     */
    async remove(key, fromBothStorages = true) {
      try {
        // Eliminar de localStorage
        localStorage.removeItem(key);
        
        // Si se solicita, eliminar también de chrome.storage
        if (fromBothStorages && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          return new Promise((resolve) => {
            chrome.storage.local.remove(key, () => {
              const success = !chrome.runtime.lastError;
              if (!success) {
                console.error('StorageHelper: Error al eliminar de chrome.storage:', chrome.runtime.lastError);
              }
              resolve(success);
            });
          });
        }
        
        return true;
      } catch (error) {
        console.error('StorageHelper: Error al eliminar datos:', error);
        return false;
      }
    }
    
    /**
     * Carga datos desde chrome.storage
     * @param {string} key - Clave para recuperar
     * @returns {Promise<any>} - Promise que resuelve con los datos o null
     * @private
     */
    async _loadFromExtensionStorage(key) {
      return new Promise((resolve) => {
        chrome.storage.local.get(key, (result) => {
          if (chrome.runtime.lastError) {
            console.error('StorageHelper: Error al cargar desde chrome.storage:', chrome.runtime.lastError);
            resolve(null);
            return;
          }
          
          resolve(result[key] || null);
        });
      });
    }
    
    /**
     * Genera un resumen de los datos para almacenar cuando son demasiado grandes
     * @param {any} data - Datos originales
     * @returns {Object} - Objeto con información resumida
     * @private
     */
    _generateSummary(data) {
      try {
        if (typeof data !== 'object' || data === null) {
          return {
            type: typeof data,
            preview: String(data).substring(0, 100)
          };
        }
        
        if (Array.isArray(data)) {
          return {
            type: 'array',
            length: data.length,
            preview: data.slice(0, 3)
          };
        }
        
        // Para objetos
        const keys = Object.keys(data);
        const keyCount = keys.length;
        
        return {
          type: 'object',
          keyCount: keyCount,
          keys: keys.slice(0, 10),
          preview: {}
        };
      } catch (error) {
        console.error('StorageHelper: Error al generar resumen:', error);
        return { error: 'Error al generar resumen' };
      }
    }
  }
  
  // Crear una instancia y exportarla
  window.LeadManagerPro.storageHelper = new StorageHelper();
  
  // Método para comprobar si es seguro almacenar en localStorage
  window.LeadManagerPro.isSafeForLocalStorage = function(data) {
    try {
      const stringified = typeof data === 'string' ? data : JSON.stringify(data);
      return stringified.length < MAX_LOCALSTORAGE_SIZE;
    } catch (error) {
      console.error('Error al verificar tamaño para localStorage:', error);
      return false;
    }
  };
  
  console.log('Lead Manager Pro: StorageHelper inicializado correctamente');
})();
