/**
 * Helper para aplicar autenticación masiva a módulos existentes
 * Este script ayuda a integrar la autenticación en módulos que ya están cargados
 */

class AuthMassApplier {
  constructor() {
    this.appliedModules = new Set();
    this.moduleChecks = {};
    this.authWrapper = window.LeadManagerPro?.AuthenticationWrapper;
  }
  
  /**
   * Aplica autenticación a todos los módulos principales
   */
  applyToAllModules() {
    console.log('AuthMassApplier: Aplicando autenticación a todos los módulos...');
    
    const moduleTargets = [
      { name: 'groupFinder', global: 'window.leadManagerPro?.groupFinder' },
      { name: 'groupMemberFinder', global: 'window.leadManagerPro?.groupMemberFinder' },
      { name: 'memberInteraction', global: 'window.leadManagerPro?.memberInteraction' },
      { name: 'memberInteractionUI', global: 'window.leadManagerPro?.memberInteractionUI' },
      { name: 'profileFinder', global: 'window.LeadManagerPro?.modules?.findProfiles' },
      { name: 'profileExtractor', global: 'window.LeadManagerPro?.modules?.extractProfilesFromPage' },
      { name: 'groupSidebar', global: 'window.leadManagerPro?.groupSidebar' },
      { name: 'n8nIntegration', global: 'window.LeadManagerPro?.n8nIntegration' },
      { name: 'dbSyncManager', global: 'window.leadManagerPro?.dbSyncManager' }
    ];
    
    moduleTargets.forEach(target => {
      this.applyToModule(target.name, target.global);
    });
  }
  
  /**
   * Aplica autenticación a un módulo específico
   */
  applyToModule(moduleName, globalPath) {
    try {
      const moduleObj = this.getModuleByPath(globalPath);
      
      if (!moduleObj) {
        console.log(`AuthMassApplier: Módulo ${moduleName} no encontrado en ${globalPath}`);
        return;
      }
      
      if (this.appliedModules.has(moduleName)) {
        console.log(`AuthMassApplier: Módulo ${moduleName} ya tiene autenticación aplicada`);
        return;
      }
      
      // Métodos principales a proteger
      const methodsToProtect = ['init', 'start', 'startSearch', 'startExtraction', 'startInteraction', 'execute', 'run'];
      
      methodsToProtect.forEach(methodName => {
        if (typeof moduleObj[methodName] === 'function') {
          this.wrapMethod(moduleObj, methodName, moduleName);
        }
      });
      
      // Marcar como aplicado
      this.appliedModules.add(moduleName);
      console.log(`AuthMassApplier: Autenticación aplicada a ${moduleName}`);
      
    } catch (error) {
      console.error(`AuthMassApplier: Error al aplicar autenticación a ${moduleName}:`, error);
    }
  }
  
  /**
   * Obtiene un módulo por su ruta global
   */
  getModuleByPath(path) {
    try {
      return eval(path);
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Envuelve un método con verificación de autenticación
   */
  wrapMethod(moduleObj, methodName, moduleName) {
    const originalMethod = moduleObj[methodName];
    const authWrapper = this.authWrapper;
    
    moduleObj[`_original_${methodName}`] = originalMethod;
    
    moduleObj[methodName] = function(...args) {
      // Verificar autenticación
      if (!authWrapper || !authWrapper.canModuleExecute(moduleName)) {
        const errorMessage = `${moduleName}.${methodName}: Autenticación requerida`;
        console.warn(errorMessage);
        
        // Mostrar mensaje de autenticación
        if (authWrapper) {
          authWrapper.showAuthRequiredMessage(moduleName, methodName);
        }
        
        return Promise.reject(new Error(errorMessage));
      }
      
      // Ejecutar método original si está autenticado
      try {
        const result = originalMethod.apply(this, args);
        return result;
      } catch (error) {
        console.error(`${moduleName}.${methodName}: Error durante ejecución:`, error);
        throw error;
      }
    };
    
    console.log(`AuthMassApplier: Método ${moduleName}.${methodName} protegido`);
  }
  
  /**
   * Aplica autenticación a módulos UI específicos
   */
  applyToUIModules() {
    console.log('AuthMassApplier: Aplicando autenticación a módulos UI...');
    
    const uiModules = [
      'groupSearchUI',
      'generalOptionsUI', 
      'groupSearchOptionsUI',
      'memberInteractionUI',
      'groupMemberUI'
    ];
    
    uiModules.forEach(moduleName => {
      const moduleObj = window.leadManagerPro?.[moduleName];
      if (moduleObj) {
        this.applyToModule(moduleName, `window.leadManagerPro.${moduleName}`);
      }
    });
  }
  
  /**
   * Protege el sidebar principal
   */
  applySidebarProtection() {
    console.log('AuthMassApplier: Protegiendo sidebar principal...');
    
    // Proteger funciones del sidebar
    const sidebarFunctions = [
      'window.LeadManagerPro?.modules?.insertSidebar',
      'window.LeadManagerPro?.modules?.findProfiles',
      'window.LeadManagerPro?.modules?.applyCityFilter'
    ];
    
    sidebarFunctions.forEach(funcPath => {
      const func = this.getModuleByPath(funcPath);
      if (typeof func === 'function') {
        this.wrapSidebarFunction(funcPath, func);
      }
    });
  }
  
  /**
   * Envuelve funciones del sidebar
   */
  wrapSidebarFunction(funcPath, originalFunction) {
    const pathParts = funcPath.split('.');
    const funcName = pathParts.pop();
    const parentPath = pathParts.join('.');
    const parentObj = this.getModuleByPath(parentPath);
    
    if (!parentObj) return;
    
    const authWrapper = this.authWrapper;
    
    parentObj[`_original_${funcName}`] = originalFunction;
    
    parentObj[funcName] = function(...args) {
      // Verificar autenticación para funciones críticas del sidebar
      if (!authWrapper || !authWrapper.authenticated) {
        const errorMessage = `Sidebar.${funcName}: Autenticación requerida`;
        console.warn(errorMessage);
        
        if (authWrapper) {
          authWrapper.showAuthRequiredMessage('sidebar', funcName);
        }
        
        return Promise.reject(new Error(errorMessage));
      }
      
      return originalFunction.apply(this, args);
    };
    
    console.log(`AuthMassApplier: Función ${funcPath} protegida`);
  }
  
  /**
   * Método para verificar qué módulos están protegidos
   */
  getProtectedModules() {
    return Array.from(this.appliedModules);
  }
  
  /**
   * Método para deshacer la protección (para debugging)
   */
  removeProtection(moduleName) {
    if (!this.appliedModules.has(moduleName)) {
      console.log(`AuthMassApplier: ${moduleName} no tiene protección aplicada`);
      return;
    }
    
    const moduleObj = window.leadManagerPro?.[moduleName] || window.LeadManagerPro?.[moduleName];
    if (!moduleObj) return;
    
    const methodsToRestore = ['init', 'start', 'startSearch', 'startExtraction', 'startInteraction', 'execute', 'run'];
    
    methodsToRestore.forEach(methodName => {
      const originalMethod = moduleObj[`_original_${methodName}`];
      if (originalMethod) {
        moduleObj[methodName] = originalMethod;
        delete moduleObj[`_original_${methodName}`];
      }
    });
    
    this.appliedModules.delete(moduleName);
    console.log(`AuthMassApplier: Protección removida de ${moduleName}`);
  }
  
  /**
   * Genera un reporte del estado de protección
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      authWrapperAvailable: !!this.authWrapper,
      authenticationStatus: this.authWrapper?.authenticated || false,
      protectedModules: this.getProtectedModules(),
      availableModules: [],
      missingModules: []
    };
    
    // Verificar qué módulos están disponibles
    const expectedModules = [
      'groupFinder', 'groupMemberFinder', 'memberInteraction', 
      'memberInteractionUI', 'groupSidebar', 'n8nIntegration'
    ];
    
    expectedModules.forEach(moduleName => {
      const moduleObj = window.leadManagerPro?.[moduleName] || window.LeadManagerPro?.[moduleName];
      if (moduleObj) {
        report.availableModules.push(moduleName);
      } else {
        report.missingModules.push(moduleName);
      }
    });
    
    return report;
  }
}

// Crear instancia global
window.LeadManagerPro = window.LeadManagerPro || {};
window.LeadManagerPro.AuthMassApplier = new AuthMassApplier();

// Función de utilidad para aplicar autenticación fácilmente
window.applyAuthToAllModules = () => {
  const applier = window.LeadManagerPro.AuthMassApplier;
  applier.applyToAllModules();
  applier.applyToUIModules();
  applier.applySidebarProtection();
  
  console.log('✅ Autenticación aplicada a todos los módulos');
  console.log('📊 Reporte:', applier.generateReport());
};

// Función para verificar el estado de autenticación
window.checkAuthStatus = () => {
  const applier = window.LeadManagerPro.AuthMassApplier;
  const report = applier.generateReport();
  
  console.log('📊 REPORTE DE AUTENTICACIÓN:');
  console.log('🔐 Estado autenticación:', report.authenticationStatus ? '✅ Autenticado' : '❌ No autenticado');
  console.log('🛡️ Módulos protegidos:', report.protectedModules);
  console.log('📦 Módulos disponibles:', report.availableModules);
  console.log('❌ Módulos faltantes:', report.missingModules);
  
  return report;
};

// Auto-aplicar cuando esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (window.LeadManagerPro?.AuthenticationWrapper) {
        window.applyAuthToAllModules();
      }
    }, 2000); // Esperar a que se carguen otros módulos
  });
} else {
  setTimeout(() => {
    if (window.LeadManagerPro?.AuthenticationWrapper) {
      window.applyAuthToAllModules();
    }
  }, 2000);
}
