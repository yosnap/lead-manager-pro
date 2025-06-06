/**
 * Wrapper de autenticación para módulos de Lead Manager Pro
 * Este wrapper asegura que todos los módulos requieran autenticación
 */

class AuthenticationWrapper {
  constructor() {
    this.AUTH_MODULE = null;
    this.authenticated = false;
    this.pendingInitializations = [];
    this.wrappedModules = new Set();
    this.initAttempts = 0;
    this.maxInitAttempts = 10;

    // Lista de módulos que requieren autenticación
    this.MODULES_REQUIRING_AUTH = [
      'groupFinder',
      'groupMemberFinder',
      'memberInteraction',
      'memberInteractionUI',
      'profileFinder',
      'profileExtractor',
      'groupSidebar',
      'memberInteractionSidebar',
      'n8nIntegration',
      'dbSyncManager',
      'interactionHistory',
      'groupSearchUI',
      'generalOptionsUI',
      'groupSearchOptionsUI'
    ];

    this.init();
  }

  init() {
    this.initAttempts++;

    // Intentar obtener el módulo de autenticación
    this.AUTH_MODULE = window.LeadManagerPro?.Auth;

    if (!this.AUTH_MODULE) {
      if (this.initAttempts <= this.maxInitAttempts) {
        console.log(`AuthenticationWrapper: Intento ${this.initAttempts}/${this.maxInitAttempts} - Módulo de autenticación no disponible, reintentando en 100ms...`);
        setTimeout(() => this.init(), 100);
        return;
      } else {
        console.error('AuthenticationWrapper: Módulo de autenticación no disponible después de múltiples intentos');
        return;
      }
    }

    // Verificar estado inicial de autenticación
    this.checkAuthenticationStatus();

    // Configurar listeners para cambios de autenticación
    this.setupAuthListeners();

    console.log('AuthenticationWrapper: Inicializado correctamente');
  }

  checkAuthenticationStatus() {
    if (!this.AUTH_MODULE) return;

    this.AUTH_MODULE.isAuthenticated((isAuth) => {
      this.authenticated = isAuth;
      console.log('AuthenticationWrapper: Estado de autenticación:', isAuth);

      if (isAuth) {
        this.processPendingInitializations();
      } else {
        this.blockUnauthenticatedModules();
      }
    });
  }

  setupAuthListeners() {
    // Listener para mensajes de cambio de autenticación
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'auth_state_changed') {
          this.authenticated = message.authenticated;
          console.log('AuthenticationWrapper: Cambio de autenticación detectado:', this.authenticated);

          if (this.authenticated) {
            this.processPendingInitializations();
          } else {
            this.blockUnauthenticatedModules();
          }
        }
      });
    }

    // Listener para eventos de ventana
    window.addEventListener('message', (event) => {
      if (event.data?.action === 'auth_state_changed') {
        this.authenticated = event.data.authenticated;

        if (this.authenticated) {
          this.processPendingInitializations();
        } else {
          this.blockUnauthenticatedModules();
        }
      }
    });
  }

  /**
   * Wrapper principal para métodos de módulos
   * @param {string} moduleName - Nombre del módulo
   * @param {string} methodName - Nombre del método
   * @param {Function} originalMethod - Método original
   * @param {Object} context - Contexto del módulo
   */
  wrapMethod(moduleName, methodName, originalMethod, context) {
    if (!this.MODULES_REQUIRING_AUTH.includes(moduleName)) {
      return originalMethod; // No requiere autenticación
    }

    return function(...args) {
      return new Promise((resolve, reject) => {
        // Verificar autenticación antes de ejecutar
        if (window.LeadManagerPro?.AuthenticationWrapper?.authenticated) {
          try {
            const result = originalMethod.apply(context, args);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        } else {
          // No autenticado, agregar a lista de pendientes o rechazar
          const errorMessage = `${moduleName}.${methodName}: Autenticación requerida`;
          console.warn(errorMessage);

          // Mostrar mensaje de autenticación requerida
          window.LeadManagerPro?.AuthenticationWrapper?.showAuthRequiredMessage(moduleName, methodName);

          reject(new Error(errorMessage));
        }
      });
    };
  }

  /**
   * Wrapper para la inicialización de módulos
   * @param {string} moduleName - Nombre del módulo
   * @param {Function} initFunction - Función de inicialización
   * @param {Object} context - Contexto del módulo
   */
  wrapInitialization(moduleName, initFunction, context) {
    if (!this.MODULES_REQUIRING_AUTH.includes(moduleName)) {
      return initFunction; // No requiere autenticación
    }

    return function(...args) {
      if (window.LeadManagerPro?.AuthenticationWrapper?.authenticated) {
        console.log(`AuthenticationWrapper: Inicializando ${moduleName} (autenticado)`);
        return initFunction.apply(context, args);
      } else {
        console.log(`AuthenticationWrapper: Posponiendo inicialización de ${moduleName} (no autenticado)`);

        // Agregar a lista de pendientes
        window.LeadManagerPro.AuthenticationWrapper.pendingInitializations.push({
          moduleName,
          initFunction,
          context,
          args
        });

        return Promise.resolve();
      }
    };
  }

  processPendingInitializations() {
    // Restaurar métodos originales de módulos protegidos
    this.MODULES_REQUIRING_AUTH.forEach(moduleName => {
      const module = window.leadManagerPro?.[moduleName] || window.LeadManagerPro?.[moduleName];
      if (module && typeof module === 'object') {
        const methodsToRestore = ['init', 'start', 'execute', 'run', 'search', 'interact'];
        methodsToRestore.forEach(methodName => {
          if (typeof module[`_original_${methodName}`] === 'function') {
            module[methodName] = module[`_original_${methodName}`];
            delete module[`_original_${methodName}`];
          }
        });
      }
    });

    console.log(`AuthenticationWrapper: Procesando ${this.pendingInitializations.length} inicializaciones pendientes`);

    const toProcess = [...this.pendingInitializations];
    this.pendingInitializations = [];

    toProcess.forEach(({ moduleName, initFunction, context, args }) => {
      try {
        console.log(`AuthenticationWrapper: Inicializando ${moduleName}`);
        initFunction.apply(context, args);
      } catch (error) {
        console.error(`AuthenticationWrapper: Error al inicializar ${moduleName}:`, error);
      }
    });
  }

  blockUnauthenticatedModules() {
    console.log('AuthenticationWrapper: Bloqueando módulos no autenticados');

    this.MODULES_REQUIRING_AUTH.forEach(moduleName => {
      const module = window.leadManagerPro?.[moduleName] || window.LeadManagerPro?.[moduleName];

      if (module && typeof module === 'object') {
        // Deshabilitar métodos principales
        const methodsToBlock = ['init', 'start', 'execute', 'run', 'search', 'interact'];

        methodsToBlock.forEach(methodName => {
          if (typeof module[methodName] === 'function') {
            module[`_original_${methodName}`] = module[methodName];
            module[methodName] = () => {
              this.showAuthRequiredMessage(moduleName, methodName);
              return Promise.reject(new Error('Autenticación requerida'));
            };
          }
        });
      }
    });
  }

  showAuthRequiredMessage(moduleName, methodName) {
    // Mostrar mensaje discreto sobre autenticación requerida
    const message = `${moduleName}: Inicia sesión para usar esta funcionalidad`;

    // Intentar mostrar en el sidebar si existe
    const sidebar = document.getElementById('snap-lead-manager-searcher');
    if (sidebar) {
      this.showSidebarAuthMessage(message);
    } else {
      // Fallback: mostrar notificación del navegador
      this.showBrowserNotification(message);
    }
  }

  showSidebarAuthMessage(message) {
    // Crear o actualizar mensaje en el sidebar
    let authMessage = document.getElementById('lmp-auth-required-message');

    if (!authMessage) {
      authMessage = document.createElement('div');
      authMessage.id = 'lmp-auth-required-message';
      authMessage.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        color: #856404;
        padding: 12px 16px;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        z-index: 10001;
        font-size: 14px;
        max-width: 300px;
        cursor: pointer;
        transition: all 0.3s ease;
      `;

      authMessage.addEventListener('click', () => {
        // Abrir sidebar de autenticación o popup
        this.openAuthInterface();
      });

      document.body.appendChild(authMessage);
    }

    authMessage.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 16px;">🔒</span>
        <div>
          <div style="font-weight: 600; margin-bottom: 2px;">Autenticación Requerida</div>
          <div style="font-size: 12px;">${message}</div>
          <div style="font-size: 11px; margin-top: 4px; opacity: 0.8;">Haz clic para iniciar sesión</div>
        </div>
      </div>
    `;

    // Auto-ocultar después de 8 segundos
    setTimeout(() => {
      if (authMessage && authMessage.parentNode) {
        authMessage.style.opacity = '0';
        setTimeout(() => {
          if (authMessage && authMessage.parentNode) {
            authMessage.parentNode.removeChild(authMessage);
          }
        }, 300);
      }
    }, 8000);
  }

  showBrowserNotification(message) {
    // Crear notificación temporal en el navegador
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Lead Manager Pro', {
        body: message,
        icon: '/icons/icon48.png'
      });
    } else {
      // Fallback: console y alerta discreta
      console.warn('AuthenticationWrapper:', message);
    }
  }

  openAuthInterface() {
    // Intentar abrir el sidebar de autenticación
    const sidebar = document.getElementById('snap-lead-manager-searcher');
    if (sidebar) {
      sidebar.style.display = 'block';
      // Forzar verificación de autenticación en el sidebar
      if (window.LeadManagerPro?.Auth) {
        window.postMessage({ action: 'auth_state_changed', authenticated: false }, '*');
      }
    } else {
      // Fallback: abrir popup de la extensión
      try {
        chrome.runtime.sendMessage({ action: 'open_popup' });
      } catch (error) {
        console.error('Error al abrir interfaz de autenticación:', error);
      }
    }
  }

  /**
   * Método público para verificar si un módulo puede ejecutarse
   * @param {string} moduleName - Nombre del módulo
   */
  canModuleExecute(moduleName) {
    if (!this.MODULES_REQUIRING_AUTH.includes(moduleName)) {
      return true; // No requiere autenticación
    }

    return this.authenticated;
  }

  /**
   * Método público para registrar un módulo que requiere autenticación
   * @param {string} moduleName - Nombre del módulo
   */
  registerAuthRequiredModule(moduleName) {
    if (!this.MODULES_REQUIRING_AUTH.includes(moduleName)) {
      this.MODULES_REQUIRING_AUTH.push(moduleName);
      console.log(`AuthenticationWrapper: Módulo ${moduleName} registrado como requerimiento de auth`);
    }
  }

  /**
   * Método público para aplicar wrapping a un módulo existente
   * @param {string} moduleName - Nombre del módulo
   * @param {Object} moduleObject - Objeto del módulo
   */
  applyAuthWrapper(moduleName, moduleObject) {
    if (!moduleObject || typeof moduleObject !== 'object') return moduleObject;

    if (this.MODULES_REQUIRING_AUTH.includes(moduleName)) {
      // Wrap métodos principales
      const methodsToWrap = ['init', 'start', 'execute', 'run', 'search', 'interact'];

      methodsToWrap.forEach(methodName => {
        if (typeof moduleObject[methodName] === 'function') {
          const originalMethod = moduleObject[methodName];
          moduleObject[methodName] = this.wrapMethod(moduleName, methodName, originalMethod, moduleObject);
        }
      });

      this.wrappedModules.add(moduleName);
      console.log(`AuthenticationWrapper: Módulo ${moduleName} wrapped successfully`);
    }

    return moduleObject;
  }
}

// Crear instancia global
window.LeadManagerPro = window.LeadManagerPro || {};
window.LeadManagerPro.AuthenticationWrapper = new AuthenticationWrapper();

// Exportar para uso en otros módulos
window.authWrapper = window.LeadManagerPro.AuthenticationWrapper;
