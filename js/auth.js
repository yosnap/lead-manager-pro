/**
 * Módulo de autenticación para Lead Manager Pro
 * Este archivo centraliza todas las funciones relacionadas con la autenticación
 * para asegurar consistencia entre los diferentes componentes de la extensión.
 * SOLO utiliza chrome.storage como método de almacenamiento.
 */

// Claves para el almacenamiento
const AUTH_KEYS = {
  AUTH: 'lmp_auth',
  USER: 'lmp_auth_user',
  TIMESTAMP: 'lmp_auth_timestamp',
  REMEMBER: 'lmp_remember',
  USERNAME: 'lmp_username',
  PASSWORD: 'lmp_password'
};

// Configuración de almacenamiento: SOLO chrome.storage
const STORAGE_CONFIG = {
  PRIMARY: chrome.storage.local,   // Almacenamiento primario
  BACKUP: chrome.storage.sync      // Respaldo para sincronización
};

// Objeto global para autenticación
const Auth = {
  /**
   * Verifica si el usuario está autenticado
   * @param {Function} callback - Función a llamar con el resultado (boolean)
   */
  isAuthenticated: function(callback) {
    // Verificar solo en chrome.storage.local (primario)
    STORAGE_CONFIG.PRIMARY.get([AUTH_KEYS.AUTH], function(result) {
      if (chrome.runtime.lastError) {
        console.error('Error al verificar autenticación:', chrome.runtime.lastError);
        callback(false);
        return;
      }

      const isAuth = result[AUTH_KEYS.AUTH] === true;
      console.log('Auth: Estado de autenticación:', isAuth);
      callback(isAuth);
    });
  },

  /**
   * Obtiene la información del usuario autenticado
   * @param {Function} callback - Función a llamar con la información del usuario
   */
  getUserInfo: function(callback) {
    // Verificar solo en chrome.storage.local (primario)
    STORAGE_CONFIG.PRIMARY.get([AUTH_KEYS.USER, AUTH_KEYS.TIMESTAMP], function(result) {
      if (chrome.runtime.lastError) {
        console.error('Error al obtener información del usuario:', chrome.runtime.lastError);
        callback({ username: null, timestamp: null });
        return;
      }

      callback({
        username: result[AUTH_KEYS.USER] || null,
        timestamp: result[AUTH_KEYS.TIMESTAMP] || null
      });
    });
  },

  /**
   * Autentica al usuario con las credenciales proporcionadas
   * @param {string} username - Nombre de usuario
   * @param {string} password - Contraseña
   * @param {boolean} remember - Si se deben recordar las credenciales
   * @param {Function} callback - Función a llamar con el resultado (boolean)
   */
  login: function(username, password, remember, callback) {
    // Validar credenciales (por ahora, solo aceptamos credenciales fijas)
    if (username === 'lunai' && password === 'lunai1234') {
      // Establecer estado de autenticación
      const authData = {
        [AUTH_KEYS.AUTH]: true,
        [AUTH_KEYS.USER]: username,
        [AUTH_KEYS.TIMESTAMP]: Date.now()
      };

      // Guardar en almacenamiento primario
      STORAGE_CONFIG.PRIMARY.set(authData, function() {
        if (chrome.runtime.lastError) {
          console.error('Error al guardar autenticación:', chrome.runtime.lastError);
          callback(false);
          return;
        }

        console.log('Auth: Estado de autenticación guardado correctamente');

        // También guardar en respaldo para sincronización
        STORAGE_CONFIG.BACKUP.set(authData, function() {
          if (chrome.runtime.lastError) {
            console.warn('Auth: Error al sincronizar autenticación:', chrome.runtime.lastError);
          }
        });

        // Si se debe recordar, guardar credenciales
        if (remember) {
          const credentialData = {
            [AUTH_KEYS.REMEMBER]: true,
            [AUTH_KEYS.USERNAME]: username,
            [AUTH_KEYS.PASSWORD]: password
          };

          STORAGE_CONFIG.PRIMARY.set(credentialData);
          STORAGE_CONFIG.BACKUP.set(credentialData);
        }

        // Notificar al sidebar y otros componentes sobre el cambio
        Auth.notifyAuthChange();

        callback(true);
      });
    } else {
      callback(false);
    }
  },

  /**
   * Notifica a todos los componentes sobre cambios en el estado de autenticación
   */
  notifyAuthChange: function() {
    try {
      // Enviar mensaje al background script
      chrome.runtime.sendMessage({
        action: 'auth_state_changed',
        authenticated: true
      });

      // Notificar a content scripts SOLO si chrome.tabs está disponible
      if (chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({}, function(tabs) {
        tabs.forEach(tab => {
            try {
          chrome.tabs.sendMessage(tab.id, {
            action: 'auth_state_changed',
            authenticated: true
              });
            } catch (error) {
            // Ignorar errores de tabs que no tienen content script
            }
          });
        });
      }

      console.log('Auth: Notificación de cambio de autenticación enviada');
    } catch (error) {
      console.error('Auth: Error al notificar cambio de autenticación', error);
    }
  },

  /**
   * Cierra la sesión del usuario
   * @param {Function} callback - Función a llamar cuando se complete
   */
  logout: function(callback) {
    // Eliminar datos de autenticación de ambos almacenamientos
    const keysToRemove = [AUTH_KEYS.AUTH, AUTH_KEYS.USER, AUTH_KEYS.TIMESTAMP];

    STORAGE_CONFIG.PRIMARY.remove(keysToRemove, function() {
      if (chrome.runtime.lastError) {
        console.error('Error al cerrar sesión:', chrome.runtime.lastError);
        callback && callback(false);
        return;
      }

      // También eliminar del respaldo
      STORAGE_CONFIG.BACKUP.remove(keysToRemove, function() {
        if (chrome.runtime.lastError) {
          console.warn('Error al limpiar respaldo:', chrome.runtime.lastError);
        }
      });

      console.log('Auth: Sesión cerrada correctamente');

      // Notificar el cambio
      Auth.notifyAuthChange();

      callback && callback(true);
    });
  },

  /**
   * Carga las credenciales guardadas si existen
   * @param {Function} callback - Función a llamar con las credenciales
   */
  loadSavedCredentials: function(callback) {
    const keys = [AUTH_KEYS.REMEMBER, AUTH_KEYS.USERNAME, AUTH_KEYS.PASSWORD];

    STORAGE_CONFIG.PRIMARY.get(keys, function(result) {
      if (chrome.runtime.lastError) {
        console.error('Error al cargar credenciales:', chrome.runtime.lastError);
        callback(null);
        return;
      }

      if (result[AUTH_KEYS.REMEMBER] === true) {
        callback({
          username: result[AUTH_KEYS.USERNAME],
          password: result[AUTH_KEYS.PASSWORD],
          remember: true
        });
      } else {
        callback(null);
      }
    });
  },

  /**
   * Limpia las credenciales guardadas
   * @param {Function} callback - Función a llamar cuando se complete
   */
  clearSavedCredentials: function(callback) {
    const keysToRemove = [AUTH_KEYS.REMEMBER, AUTH_KEYS.USERNAME, AUTH_KEYS.PASSWORD];

    STORAGE_CONFIG.PRIMARY.remove(keysToRemove, function() {
      if (chrome.runtime.lastError) {
        console.error('Error al limpiar credenciales:', chrome.runtime.lastError);
        callback && callback(false);
        return;
      }

      // También limpiar del respaldo
      STORAGE_CONFIG.BACKUP.remove(keysToRemove, function() {
        if (chrome.runtime.lastError) {
          console.warn('Error al limpiar respaldo de credenciales:', chrome.runtime.lastError);
        }
      });

      console.log('Auth: Credenciales eliminadas correctamente');
      callback && callback(true);
    });
  }
};

// Exponer el objeto Auth de forma global para el wrapper de autenticación
window.LeadManagerPro = window.LeadManagerPro || {};
window.LeadManagerPro.Auth = Auth;

document.dispatchEvent(new Event('LeadManagerProAuthReady'));

// Log de confirmación
console.log('✅ Auth module loaded and exported successfully to window.LeadManagerPro.Auth');
console.log('🔍 Auth methods available:', Object.keys(Auth));
