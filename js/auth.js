/**
 * Módulo de autenticación para Lead Manager Pro
 * Este archivo centraliza todas las funciones relacionadas con la autenticación
 * para asegurar consistencia entre los diferentes componentes de la extensión.
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

// Objeto global para autenticación
const Auth = {
  /**
   * Verifica si el usuario está autenticado
   * @param {Function} callback - Función a llamar con el resultado (boolean)
   */
  isAuthenticated: function(callback) {
    // Verificar en ambos almacenamientos
    chrome.storage.local.get([AUTH_KEYS.AUTH], function(localResult) {
      if (localResult[AUTH_KEYS.AUTH] === true) {
        console.log('Auth: Usuario autenticado en storage.local');
        callback(true);
        return;
      }
      
      chrome.storage.sync.get([AUTH_KEYS.AUTH], function(syncResult) {
        const isAuth = syncResult[AUTH_KEYS.AUTH] === true;
        console.log('Auth: Estado de autenticación en storage.sync:', isAuth);
        callback(isAuth);
      });
    });
  },
  
  /**
   * Obtiene la información del usuario autenticado
   * @param {Function} callback - Función a llamar con la información del usuario
   */
  getUserInfo: function(callback) {
    // Verificar en ambos almacenamientos
    chrome.storage.local.get([AUTH_KEYS.USER, AUTH_KEYS.TIMESTAMP], function(localResult) {
      if (localResult[AUTH_KEYS.USER]) {
        callback({
          username: localResult[AUTH_KEYS.USER],
          timestamp: localResult[AUTH_KEYS.TIMESTAMP] || Date.now()
        });
        return;
      }
      
      chrome.storage.sync.get([AUTH_KEYS.USER, AUTH_KEYS.TIMESTAMP], function(syncResult) {
        callback({
          username: syncResult[AUTH_KEYS.USER] || null,
          timestamp: syncResult[AUTH_KEYS.TIMESTAMP] || null
        });
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
      
      // Guardar en ambos almacenamientos
      chrome.storage.local.set(authData, function() {
        console.log('Auth: Estado de autenticación guardado en local');
        
        chrome.storage.sync.set(authData, function() {
          console.log('Auth: Estado de autenticación guardado en sync');
          
          // Si se debe recordar, guardar credenciales
          if (remember) {
            const credentialData = {
              [AUTH_KEYS.REMEMBER]: true,
              [AUTH_KEYS.USERNAME]: username,
              [AUTH_KEYS.PASSWORD]: password
            };
            
            chrome.storage.local.set(credentialData);
            chrome.storage.sync.set(credentialData);
          }
          
          // Notificar al sidebar sobre el cambio de estado de autenticación
          Auth.notifySidebarAuthChange();
          
          callback(true);
        });
      });
    } else {
      callback(false);
    }
  },
  
  /**
   * Notifica al sidebar sobre cambios en el estado de autenticación
   */
  notifySidebarAuthChange: function() {
    // Intentar comunicarse con el sidebar a través del content script
    try {
      // Enviar mensaje al background script para que notifique al content script
      chrome.runtime.sendMessage({
        action: 'notifySidebarAuthChange'
      });
      
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
    
    chrome.storage.local.remove(keysToRemove, function() {
      chrome.storage.sync.remove(keysToRemove, function() {
        console.log('Auth: Sesión cerrada correctamente');
        
        // Notificar al sidebar sobre el cambio de estado de autenticación
        Auth.notifySidebarAuthChange();
        
        callback && callback();
      });
    });
  },
  
  /**
   * Carga las credenciales guardadas si existen
   * @param {Function} callback - Función a llamar con las credenciales
   */
  loadSavedCredentials: function(callback) {
    const keys = [AUTH_KEYS.REMEMBER, AUTH_KEYS.USERNAME, AUTH_KEYS.PASSWORD];
    
    chrome.storage.local.get(keys, function(localResult) {
      if (localResult[AUTH_KEYS.REMEMBER] === true) {
        callback({
          username: localResult[AUTH_KEYS.USERNAME],
          password: localResult[AUTH_KEYS.PASSWORD],
          remember: true
        });
        return;
      }
      
      chrome.storage.sync.get(keys, function(syncResult) {
        if (syncResult[AUTH_KEYS.REMEMBER] === true) {
          callback({
            username: syncResult[AUTH_KEYS.USERNAME],
            password: syncResult[AUTH_KEYS.PASSWORD],
            remember: true
          });
        } else {
          callback(null);
        }
      });
    });
  },
  
  /**
   * Limpia las credenciales guardadas
   * @param {Function} callback - Función a llamar cuando se complete
   */
  clearSavedCredentials: function(callback) {
    const keysToRemove = [AUTH_KEYS.REMEMBER, AUTH_KEYS.USERNAME, AUTH_KEYS.PASSWORD];
    
    chrome.storage.local.remove(keysToRemove, function() {
      chrome.storage.sync.remove(keysToRemove, function() {
        console.log('Auth: Credenciales eliminadas correctamente');
        callback && callback();
      });
    });
  }
};

// Exportar el objeto Auth
window.LeadManagerPro = window.LeadManagerPro || {};
window.LeadManagerPro.Auth = Auth;
