/**
 * Módulo alternativo simple para mostrar la interfaz básica durante la búsqueda de grupos
 * cuando la interfaz principal no está disponible
 */

// Namespace para la organización del código
window.leadManagerPro = window.leadManagerPro || {};

/**
 * Interfaz simplificada para cuando la principal no está disponible
 */
window.leadManagerPro.simpleGroupUI = {
  isVisible: false,
  container: null,
  
  // Mostrar interfaz
  show: function(options = {}) {
    console.log('SimpleGroupUI: Mostrando interfaz con opciones:', options);
    
    // Si ya está visible, no hacer nada
    if (this.isVisible) return this;
    
    // Crear contenedor si no existe
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'lmp-simple-group-ui';
      this.container.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 300px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 9999;
        padding: 15px;
        font-family: Arial, sans-serif;
      `;
      
      // Estructura básica
      this.container.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 10px;">${options.title || 'Búsqueda de Grupos'}</div>
        <div id="lmp-simple-status">Iniciando búsqueda...</div>
        <div style="margin: 10px 0;">
          <progress id="lmp-simple-progress" value="0" max="100" style="width: 100%;"></progress>
        </div>
        <div>Grupos encontrados: <span id="lmp-simple-count">0</span></div>
        <div style="margin-top: 10px;">
          <button id="lmp-simple-stop-btn" style="padding: 5px 10px; background: #4267B2; color: white; border: none; border-radius: 4px; cursor: pointer;">Detener</button>
        </div>
      `;
      
      // Agregar al DOM
      document.body.appendChild(this.container);
      
      // Configurar evento de detener
      const stopBtn = this.container.querySelector('#lmp-simple-stop-btn');
      if (stopBtn) {
        stopBtn.addEventListener('click', () => {
          if (window.leadManagerPro && window.leadManagerPro.groupFinder) {
            window.leadManagerPro.groupFinder.stopSearch();
          }
        });
      }
    }
    
    this.isVisible = true;
    return this;
  },
  
  // Procesar actualizaciones de progreso
  processUpdate: function(data) {
    // Verificar que la interfaz está visible
    if (!this.isVisible || !this.container) return;
    
    // Actualizar elementos según el tipo de actualización
    const statusElem = this.container.querySelector('#lmp-simple-status');
    const progressElem = this.container.querySelector('#lmp-simple-progress');
    const countElem = this.container.querySelector('#lmp-simple-count');
    
    // Actualizar mensaje si existe
    if (statusElem && data.message) {
      statusElem.textContent = data.message;
    }
    
    // Actualizar progreso si es una actualización de progreso
    if (progressElem && data.type === 'progress' && data.value !== undefined) {
      progressElem.value = data.value;
    }
    
    // Actualizar contador de grupos
    if (countElem && data.groupsFound !== undefined) {
      countElem.textContent = data.groupsFound;
    }
    
    // Si es finalización, cambiar estilo
    if (data.type === 'complete') {
      if (statusElem) {
        statusElem.style.color = '#4CAF50';
      }
      if (progressElem) {
        progressElem.value = 100;
      }
    }
  },
  
  // Ocultar interfaz
  hide: function() {
    if (!this.isVisible || !this.container) return;
    
    document.body.removeChild(this.container);
    this.container = null;
    this.isVisible = false;
  }
};

console.log('Simple Group UI cargado correctamente');
