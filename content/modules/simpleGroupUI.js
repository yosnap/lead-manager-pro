/**
 * SimpleGroupUI - Una versión simplificada de la interfaz de usuario para búsqueda de grupos
 * Sirve como fallback en caso de que la interfaz principal no esté disponible
 */

class SimpleGroupUI {
  constructor() {
    this.container = null;
    this.isVisible = false;
    this.groups = [];
  }

  // Mostrar la interfaz de usuario
  show(options = {}) {
    if (this.isVisible) return this;
    
    console.log('SimpleGroupUI: Mostrando con opciones', options);
    this.createContainer();
    this.isVisible = true;
    
    return this;
  }

  // Crear el contenedor principal
  createContainer() {
    // Si ya existe el contenedor, no crear otro
    if (this.container) return;
    
    this.container = document.createElement('div');
    this.container.id = 'lmp-simple-group-ui';
    
    // Estilos del contenedor
    Object.assign(this.container.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '300px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
      zIndex: '9999',
      padding: '15px',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#333'
    });
    
    // Contenido inicial
    this.container.innerHTML = `
      <div style="margin-bottom: 10px; font-weight: bold; display: flex; justify-content: space-between; align-items: center;">
        <span>Búsqueda de Grupos</span>
        <button id="lmp-simple-close-btn" style="background: none; border: none; cursor: pointer;">✕</button>
      </div>
      <div id="lmp-simple-status" style="margin-bottom: 10px;">Iniciando búsqueda...</div>
      <div style="margin-bottom: 10px;">
        <div style="margin-bottom: 5px;">Progreso: <span id="lmp-simple-progress">0</span>%</div>
        <div style="width: 100%; height: 10px; background-color: #f0f0f0; border-radius: 5px;">
          <div id="lmp-simple-progress-bar" style="width: 0%; height: 100%; background-color: #4267B2; border-radius: 5px;"></div>
        </div>
      </div>
      <div style="margin-bottom: 10px;">Grupos encontrados: <span id="lmp-simple-count">0</span></div>
      <button id="lmp-simple-stop-btn" style="background-color: #4267B2; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Detener</button>
    `;
    
    // Agregar al DOM
    document.body.appendChild(this.container);
    
    // Configurar event listeners
    const closeBtn = this.container.querySelector('#lmp-simple-close-btn');
    const stopBtn = this.container.querySelector('#lmp-simple-stop-btn');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }
    
    if (stopBtn) {
      stopBtn.addEventListener('click', () => {
        // Detener la búsqueda si está disponible el método
        if (window.leadManagerPro && window.leadManagerPro.groupFinder) {
          window.leadManagerPro.groupFinder.stopSearch();
        }
        
        // Actualizar la interfaz
        this.updateStatus('Búsqueda detenida');
        this.updateProgress(100);
      });
    }
  }

  // Ocultar la interfaz
  hide() {
    if (!this.isVisible || !this.container) return;
    
    document.body.removeChild(this.container);
    this.container = null;
    this.isVisible = false;
  }

  // Procesar actualizaciones de la búsqueda
  processUpdate(data) {
    if (!data || !this.container) return;
    
    console.log('SimpleGroupUI: Procesando actualización', data);
    
    // Actualizar progreso
    if (data.type === 'progress' && data.value !== undefined) {
      this.updateProgress(data.value);
    }
    
    // Actualizar contador de grupos
    if (data.groupsFound !== undefined) {
      this.updateCount(data.groupsFound);
    }
    
    // Actualizar mensaje
    if (data.message) {
      this.updateStatus(data.message);
    }
    
    // Si es nuevo grupo, agregar al contador
    if (data.type === 'newGroup' && data.group) {
      this.groups.push(data.group);
      this.updateCount(this.groups.length);
    }
    
    // Búsqueda completada
    if (data.type === 'complete') {
      this.updateProgress(100);
      this.updateStatus(data.message || 'Búsqueda completada');
    }
  }

  // Actualizar el progreso
  updateProgress(percent) {
    if (!this.container) return;
    
    const progressText = this.container.querySelector('#lmp-simple-progress');
    const progressBar = this.container.querySelector('#lmp-simple-progress-bar');
    
    if (progressText) {
      progressText.textContent = Math.round(percent);
    }
    
    if (progressBar) {
      progressBar.style.width = `${percent}%`;
    }
  }

  // Actualizar el contador de grupos
  updateCount(count) {
    if (!this.container) return;
    
    const countText = this.container.querySelector('#lmp-simple-count');
    
    if (countText) {
      countText.textContent = count;
    }
  }

  // Actualizar el estado
  updateStatus(message) {
    if (!this.container) return;
    
    const statusText = this.container.querySelector('#lmp-simple-status');
    
    if (statusText) {
      statusText.textContent = message;
    }
  }
}

// Exportar la clase
window.leadManagerPro = window.leadManagerPro || {};
window.leadManagerPro.simpleGroupUI = new SimpleGroupUI();
