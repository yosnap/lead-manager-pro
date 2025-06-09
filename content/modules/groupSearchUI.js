// Módulo para mostrar la interfaz de usuario para la búsqueda de grupos
// Esta clase crea una ventana flotante para mostrar el progreso y los resultados
// de la búsqueda de grupos

class GroupSearchUI {
  constructor() {
    this.container = null;
    this.isVisible = false;
    this.groups = [];
    this.progressCallback = null;
  }

  // Mostrar la interfaz de búsqueda
  show(options = {}) {
    if (this.isVisible) return;
    
    this.createContainer();
    this.isVisible = true;
    
    // Configurar título y opciones iniciales
    this.updateHeader(options.title || 'Búsqueda de Grupos');
    
    // Activar el switch de Facebook si corresponde
    this.activateFacebookPublicGroupsSwitch();
    
    return this;
  }

  // Ocultar la interfaz de búsqueda
  hide() {
    if (!this.isVisible || !this.container) return;
    
    document.body.removeChild(this.container);
    this.container = null;
    this.isVisible = false;
    
    return this;
  }

  // Crear el contenedor de la interfaz
  createContainer() {
    // Si ya existe, no crear otro
    if (this.container) return;
    
    // Crear elemento contenedor
    this.container = document.createElement('div');
    this.container.id = 'lmp-group-search-ui';
    this.container.className = 'lmp-ui-container';
    
    // Estilos del contenedor
    Object.assign(this.container.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '350px',
      maxHeight: '500px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
      zIndex: '9999',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#333'
    });
    
    // Estructura interna
    this.container.innerHTML = `
      <div style="padding: 12px 15px; background: #4267B2; color: white; font-weight: bold; display: flex; justify-content: space-between; align-items: center;">
        <span id="lmp-header-title">Búsqueda de Grupos</span>
        <div>
          <button id="lmp-minimize-btn" style="background: none; border: none; color: white; cursor: pointer; margin-right: 8px; font-size: 16px;">_</button>
          <button id="lmp-close-btn" style="background: none; border: none; color: white; cursor: pointer; font-size: 16px;">✕</button>
        </div>
      </div>
      
      <div id="lmp-content" style="flex: 1; display: flex; flex-direction: column; height: 400px;">
        <div id="lmp-progress-section" style="padding: 15px; border-bottom: 1px solid #eee;">
          <div id="lmp-progress-text">Iniciando búsqueda de grupos...</div>
          <div style="margin: 10px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Progreso:</span>
              <span id="lmp-progress-percentage">0%</span>
            </div>
            <progress id="lmp-progress-bar" value="0" max="100" style="width: 100%;"></progress>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <div>Grupos encontrados: <span id="lmp-groups-count">0</span></div>
            <div>
              <button id="lmp-pause-btn" style="background: none; border: none; color: #4267B2; cursor: pointer; text-decoration: underline;">Pausar</button>
              <button id="lmp-stop-btn" style="background: none; border: none; color: #4267B2; cursor: pointer; text-decoration: underline;">Detener</button>
            </div>
          </div>
        </div>
        
        <div id="lmp-groups-section" style="flex: 1; overflow-y: auto; padding: 0; border-bottom: 1px solid #eee;">
          <div id="lmp-groups-list" style="padding: 0;"></div>
        </div>
        
        <div id="lmp-actions-section" style="padding: 12px 15px; display: flex; justify-content: space-between;">
          <div id="lmp-status-text" style="font-size: 12px; color: #777;">Buscando...</div>
          <div>
            <button id="lmp-export-json-btn" class="lmp-btn" style="background: #4267B2; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-left: 8px;">Exportar JSON</button>
            <button id="lmp-export-csv-btn" class="lmp-btn" style="background: #4267B2; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-left: 8px;">Exportar CSV</button>
          </div>
        </div>
      </div>
      
      <div id="lmp-minimized-view" style="padding: 10px 15px; display: none; cursor: pointer;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>Búsqueda de Grupos: <span id="lmp-mini-count">0</span> encontrados</span>
          <button id="lmp-expand-btn" style="background: none; border: none; color: #4267B2; cursor: pointer; font-size: 16px;">⌃</button>
        </div>
      </div>
    `;
    
    // Agregar al DOM
    document.body.appendChild(this.container);
    
    // Configurar event listeners
    this.setupEventListeners();
  }

  // Configurar manejadores de eventos
  setupEventListeners() {
    if (!this.container) return;
    
    // Botón de cerrar
    const closeBtn = this.container.querySelector('#lmp-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        // Detener la búsqueda si está en progreso
        if (window.leadManagerPro && window.leadManagerPro.groupFinder) {
          window.leadManagerPro.groupFinder.stopSearch();
        }
        this.hide();
      });
    }
    
    // Botón de minimizar
    const minimizeBtn = this.container.querySelector('#lmp-minimize-btn');
    const content = this.container.querySelector('#lmp-content');
    const minimizedView = this.container.querySelector('#lmp-minimized-view');
    
    if (minimizeBtn && content && minimizedView) {
      minimizeBtn.addEventListener('click', () => {
        content.style.display = 'none';
        minimizedView.style.display = 'block';
        this.container.style.maxHeight = 'auto';
        this.container.style.height = 'auto';
      });
    }
    
    // Botón de expandir
    const expandBtn = this.container.querySelector('#lmp-expand-btn');
    if (expandBtn && content && minimizedView) {
      expandBtn.addEventListener('click', () => {
        minimizedView.style.display = 'none';
        content.style.display = 'flex';
        this.container.style.maxHeight = '500px';
      });
    }
    
    // Área minimizada (clic para expandir)
    if (minimizedView && content) {
      minimizedView.addEventListener('click', (e) => {
        if (e.target !== expandBtn) {
          minimizedView.style.display = 'none';
          content.style.display = 'flex';
          this.container.style.maxHeight = '500px';
        }
      });
    }
    
    // Botón de pausar
    const pauseBtn = this.container.querySelector('#lmp-pause-btn');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        const isPaused = pauseBtn.textContent === 'Reanudar';
        
        if (isPaused) {
          // Reanudar búsqueda
          if (window.leadManagerPro && window.leadManagerPro.groupFinder) {
            window.leadManagerPro.groupFinder.startSearch();
            pauseBtn.textContent = 'Pausar';
            this.updateStatus('Búsqueda reanudada');
          }
        } else {
          // Pausar búsqueda
          if (window.leadManagerPro && window.leadManagerPro.groupFinder) {
            window.leadManagerPro.groupFinder.stopSearch();
            pauseBtn.textContent = 'Reanudar';
            this.updateStatus('Búsqueda pausada');
          }
        }
      });
    }
    
    // Botón de detener
    const stopBtn = this.container.querySelector('#lmp-stop-btn');
    if (stopBtn) {
      stopBtn.addEventListener('click', () => {
        if (window.leadManagerPro && window.leadManagerPro.groupFinder) {
          const groups = window.leadManagerPro.groupFinder.stopSearch();
          this.updateProgress(100);
          this.updateStatus(`Búsqueda finalizada. Se encontraron ${groups.length} grupos.`);
          
          // Actualizar la interfaz para mostrar que se ha detenido
          if (pauseBtn) pauseBtn.disabled = true;
          stopBtn.disabled = true;
        }
      });
    }
    
    // Botón de exportar a JSON
    const exportJsonBtn = this.container.querySelector('#lmp-export-json-btn');
    if (exportJsonBtn) {
      exportJsonBtn.addEventListener('click', () => {
        if (window.leadManagerPro && window.leadManagerPro.groupFinder) {
          const downloadUrl = window.leadManagerPro.groupFinder.exportResults('json');
          if (downloadUrl) {
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `grupos-facebook-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(downloadUrl);
            this.updateStatus('Resultados exportados en formato JSON');
          }
        }
      });
    }
    
    // Botón de exportar a CSV
    const exportCsvBtn = this.container.querySelector('#lmp-export-csv-btn');
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', () => {
        if (window.leadManagerPro && window.leadManagerPro.groupFinder) {
          const downloadUrl = window.leadManagerPro.groupFinder.exportResults('csv');
          if (downloadUrl) {
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `grupos-facebook-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(downloadUrl);
            this.updateStatus('Resultados exportados en formato CSV');
          }
        }
      });
    }
  }

  // Actualizar el encabezado de la interfaz
  updateHeader(title) {
    if (!this.container) return;
    
    const headerTitle = this.container.querySelector('#lmp-header-title');
    if (headerTitle) {
      headerTitle.textContent = title;
    }
  }

  // Actualizar el progreso de la búsqueda
  updateProgress(percent) {
    if (!this.container) return;
    
    const progressBar = this.container.querySelector('#lmp-progress-bar');
    const progressPercentage = this.container.querySelector('#lmp-progress-percentage');
    
    if (progressBar && progressPercentage) {
      progressBar.value = percent;
      progressPercentage.textContent = `${Math.round(percent)}%`;
    }
  }

  // Actualizar el contador de grupos
  updateGroupCount(count) {
    if (!this.container) return;
    
    const groupsCount = this.container.querySelector('#lmp-groups-count');
    const miniCount = this.container.querySelector('#lmp-mini-count');
    
    if (groupsCount) {
      groupsCount.textContent = count;
    }
    
    if (miniCount) {
      miniCount.textContent = count;
    }
  }

  // Actualizar el texto de estado
  updateStatus(message) {
    if (!this.container) return;
    
    const statusText = this.container.querySelector('#lmp-status-text');
    const progressText = this.container.querySelector('#lmp-progress-text');
    
    if (statusText) {
      statusText.textContent = message;
    }
    
    if (progressText) {
      progressText.textContent = message;
    }
  }

  // Agregar un nuevo grupo a la lista
  addGroup(group) {
    if (!this.container) return;
    
    const groupsList = this.container.querySelector('#lmp-groups-list');
    if (!groupsList) return;
    
    // Verificar si el grupo ya está en la lista
    if (this.groups.some(g => g.id === group.id)) return;
    
    // Agregar a la lista interna
    this.groups.push(group);
    
    // Crear elemento HTML para el grupo
    const groupElement = document.createElement('div');
    groupElement.className = 'lmp-group-item';
    groupElement.dataset.groupId = group.id;
    
    // Estilos para el elemento
    Object.assign(groupElement.style, {
      padding: '10px 15px',
      borderBottom: '1px solid #eee',
      cursor: 'pointer'
    });
    
    // Determinar si es público o privado para el icono
    const isPrivate = group.type === 'private';
    
    // Información del grupo
    groupElement.innerHTML = `
      <div style="font-weight: bold;">${group.name}</div>
      <div style="display: flex; justify-content: space-between; color: #777; font-size: 12px; margin-top: 4px;">
        <span>${isPrivate ? 'Privado' : 'Público'}</span>
        <span>${group.members.toLocaleString()} miembros</span>
      </div>
    `;
    
    // Event listener para abrir el grupo
    groupElement.addEventListener('click', () => {
      window.open(group.url, '_blank');
    });
    
    // Agregar a la lista
    groupsList.appendChild(groupElement);
    
    // Actualizar contador
    this.updateGroupCount(this.groups.length);
  }

  // Procesar actualizaciones de progreso
  processUpdate(data) {
    if (!data) return;
    
    // Actualizar progreso
    if (data.type === 'progress' && data.value !== undefined) {
      this.updateProgress(data.value);
    }
    
    // Agregar nuevo grupo
    if (data.type === 'newGroup' && data.group) {
      this.addGroup(data.group);
    }
    
    // Actualizar mensaje
    if (data.message) {
      this.updateStatus(data.message);
    }
    
    // Búsqueda completada
    if (data.type === 'complete') {
      this.updateProgress(100);
      this.updateStatus(data.message || `Búsqueda finalizada. Se encontraron ${data.groupsFound || 0} grupos.`);
      
      // Deshabilitar botones de control
      const pauseBtn = this.container.querySelector('#lmp-pause-btn');
      const stopBtn = this.container.querySelector('#lmp-stop-btn');
      
      if (pauseBtn) pauseBtn.disabled = true;
      if (stopBtn) stopBtn.disabled = true;
    }
  }

  // Activa el switch de 'Grupos públicos' en la interfaz de Facebook si corresponde
  activateFacebookPublicGroupsSwitch() {
    // Comprobar la configuración de búsqueda de grupos
    chrome.storage.sync.get(['groupSearchSettings'], (result) => {
      const settings = result.groupSearchSettings || {};
      if (settings.onlyPublicGroups) {
        // Esperar a que el switch esté en el DOM (puede tardar por AJAX)
        const interval = setInterval(() => {
          // Buscar el input del switch por su aria-label
          const switchInput = document.querySelector('input[aria-label="Grupos públicos"][role="switch"]');
          if (switchInput) {
            // Si no está activado, haz click para activarlo
            if (switchInput.getAttribute('aria-checked') !== 'true') {
              switchInput.click();
              console.log('Lead Manager Pro: Switch "Grupos públicos" activado automáticamente');
            }
            clearInterval(interval);
          }
        }, 500);
        // Por si nunca aparece, corta el intervalo tras 10 segundos
        setTimeout(() => clearInterval(interval), 10000);
      }
    });
  }
}

// Exportar la clase
window.leadManagerPro = window.leadManagerPro || {};
window.leadManagerPro.groupSearchUI = new GroupSearchUI();
