// Módulo para limpiar componentes antiguos y garantizar compatibilidad

class CleanupOldComponents {
  constructor() {
    this.componentsToRemove = [
      {
        id: 'lead-manager-count-members-button',
        className: null
      },
      {
        id: 'lead-manager-member-interaction-button',
        className: null
      },
      {
        id: null,
        className: 'lead-manager-member-interaction-sidebar'
      }
    ];
  }
  
  init() {
    console.log('CleanupOldComponents: Iniciando limpieza de componentes antiguos');
    
    // Realizar la limpieza inicial
    this.cleanup();
    
    // Configurar un MutationObserver para monitorear cambios en el DOM
    this.setupObserver();
    
    return this;
  }
  
  cleanup() {
    this.componentsToRemove.forEach(component => {
      try {
        if (component.id) {
          const element = document.getElementById(component.id);
          if (element) {
            console.log(`CleanupOldComponents: Eliminando elemento con ID ${component.id}`);
            element.remove();
          }
        }
        
        if (component.className) {
          const elements = document.getElementsByClassName(component.className);
          if (elements.length > 0) {
            console.log(`CleanupOldComponents: Eliminando ${elements.length} elementos con clase ${component.className}`);
            Array.from(elements).forEach(el => el.remove());
          }
        }
      } catch (error) {
        console.error(`CleanupOldComponents: Error al eliminar componente:`, error);
      }
    });
  }
  
  setupObserver() {
    // Crear un observador para detectar nuevos componentes
    const observer = new MutationObserver(mutations => {
      let shouldCleanup = false;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          Array.from(mutation.addedNodes).forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Verificar si el nuevo nodo es uno de los componentes a eliminar
              const found = this.componentsToRemove.some(component => 
                (component.id && node.id === component.id) || 
                (component.className && node.classList && node.classList.contains(component.className))
              );
              
              if (found) {
                shouldCleanup = true;
              }
            }
          });
        }
      });
      
      if (shouldCleanup) {
        this.cleanup();
      }
    });
    
    // Configurar observador para monitorear todo el documento
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('CleanupOldComponents: Observador configurado');
  }
}

// Exportar la clase
window.leadManagerPro = window.leadManagerPro || {};
window.leadManagerPro.cleanupOldComponents = new CleanupOldComponents();
