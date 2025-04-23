/**
 * Módulo para la interfaz de usuario de integración con n8n
 */

// Namespace para la organización del código
window.LeadManagerPro = window.LeadManagerPro || {};
window.LeadManagerPro.modules = window.LeadManagerPro.modules || {};

class N8nIntegrationUI {
  constructor() {
    this.initialized = false;
    this.manager = null;
  }

  /**
   * Inicializa la interfaz de usuario
   * @returns {Promise<N8nIntegrationUI>}
   */
  async init() {
    if (this.initialized) return this;
    
    console.log('N8nIntegrationUI: Inicializando módulo');
    
    try {
      // Cargar el gestor de integración
      if (!window.LeadManagerPro.n8nIntegration) {
        throw new Error('El módulo n8nIntegration no está inicializado');
      }
      
      this.manager = window.LeadManagerPro.n8nIntegration;
      await this.manager.init();
      
      this.initialized = true;
      
      return this;
    } catch (error) {
      console.error('N8nIntegrationUI: Error al inicializar', error);
      return this;
    }
  }

  /**
   * Genera el HTML para la sección de configuración de n8n
   * @returns {string} - HTML para la sección
   */
  generateConfigHTML() {
    const status = this.manager?.getStatus() || {};
    const dbEnabled = status.dbEnabled || false;
    const lastSyncTime = status.lastSyncTime ? new Date(status.lastSyncTime).toLocaleString() : 'Nunca';
    const pendingDataCount = status.pendingDataCount || 0;
    
    return `
      <div class="snap-lead-section">
        <h3>Integración con Lead Manager Pro Cloud</h3>
        
        <div class="snap-lead-info-box">
          <p><strong>Estado de integración con n8n:</strong> <span class="status-badge success">Conectado</span></p>
          <p><strong>Servidor:</strong> n8n.codeia.dev</p>
          <p><strong>Última sincronización:</strong> ${lastSyncTime}</p>
          <p><strong>Datos pendientes:</strong> ${pendingDataCount}</p>
          
          <div class="snap-lead-note">
            <p><em>Nota: La autenticación con credenciales personales estará disponible en próximas versiones.</em></p>
          </div>
        </div>
        
        <div class="snap-lead-config-form">
          <!-- Solo dejamos la opción de almacenamiento local -->
          <div class="snap-lead-form-row checkbox-row">
            <label for="n8n-db-enabled">
              <input type="checkbox" id="n8n-db-enabled" ${dbEnabled ? 'checked' : ''} />
              Habilitar almacenamiento local de datos
            </label>
            <small class="input-help">Guarda una copia local de los datos enviados a n8n</small>
          </div>
          
          <div class="snap-lead-form-row">
            <button id="n8n-save-config" class="snap-lead-button primary">Guardar Configuración</button>
            ${pendingDataCount > 0 ? `<button id="n8n-sync-now" class="snap-lead-button secondary">Sincronizar Ahora (${pendingDataCount})</button>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Genera el HTML para la sección de datos de usuario
   * @returns {Promise<string>} - HTML para la sección
   */
  async generateUserDataHTML() {
    if (!this.manager || !this.manager.isAuthenticated()) {
      return `
        <div class="snap-lead-section">
          <h3>Datos de Usuario</h3>
          <p>Debes configurar la integración y tu ID de usuario para ver tus datos.</p>
        </div>
      `;
    }
    
    try {
      // Obtener datos del usuario
      const profiles = await this.manager.getUserData('profiles');
      const groups = await this.manager.getUserData('groups');
      const members = await this.manager.getUserData('members');
      
      return `
        <div class="snap-lead-section">
          <h3>Datos de Usuario</h3>
          
          <div class="snap-lead-data-stats">
            <div class="stat-box">
              <span class="stat-value">${profiles.length}</span>
              <span class="stat-label">Perfiles</span>
            </div>
            <div class="stat-box">
              <span class="stat-value">${groups.length}</span>
              <span class="stat-label">Grupos</span>
            </div>
            <div class="stat-box">
              <span class="stat-value">${members.length}</span>
              <span class="stat-label">Miembros</span>
            </div>
          </div>
          
          <div class="snap-lead-data-actions">
            <button id="view-profiles-btn" class="snap-lead-button secondary">Ver Perfiles</button>
            <button id="view-groups-btn" class="snap-lead-button secondary">Ver Grupos</button>
            <button id="view-members-btn" class="snap-lead-button secondary">Ver Miembros</button>
            <button id="export-data-btn" class="snap-lead-button primary">Exportar Datos</button>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('N8nIntegrationUI: Error al generar HTML de datos de usuario', error);
      return `
        <div class="snap-lead-section">
          <h3>Datos de Usuario</h3>
          <p>Error al cargar los datos: ${error.message}</p>
        </div>
      `;
    }
  }

  /**
   * Muestra los datos en una ventana modal
   * @param {string} dataType - Tipo de datos (profiles, groups, members)
   * @param {Array} data - Datos a mostrar
   */
  showDataModal(dataType, data) {
    const modalId = `data-modal-${dataType}`;
    
    // Eliminar modal existente si hay uno
    const existingModal = document.getElementById(modalId);
    if (existingModal) {
      existingModal.remove();
    }
    
    // Crear elemento modal
    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'snap-lead-modal';
    
    // Título según tipo de datos
    let title = '';
    switch (dataType) {
      case 'profiles':
        title = 'Perfiles Guardados';
        break;
      case 'groups':
        title = 'Grupos Guardados';
        break;
      case 'members':
        title = 'Miembros Guardados';
        break;
      default:
        title = 'Datos';
    }
    
    // Generar contenido HTML según el tipo de datos
    let contentHTML = '';
    
    if (data.length === 0) {
      contentHTML = '<p>No hay datos disponibles.</p>';
    } else {
      switch (dataType) {
        case 'profiles':
          contentHTML = `
            <div class="data-list profiles-list">
              ${data.map(profile => `
                <div class="data-item profile-item">
                  <div class="profile-img">
                    <img src="${profile.imageUrl || 'icons/user.png'}" alt="${profile.name}" />
                  </div>
                  <div class="profile-info">
                    <h4>${profile.name}</h4>
                    <p>${profile.location || ''}</p>
                    <p>${profile.occupation || ''}</p>
                    <a href="${profile.profileUrl}" target="_blank" class="profile-link">Ver Perfil</a>
                  </div>
                </div>
              `).join('')}
            </div>
          `;
          break;
          
        case 'groups':
          contentHTML = `
            <div class="data-list groups-list">
              ${data.map(group => `
                <div class="data-item group-item">
                  <div class="group-info">
                    <h4>${group.name}</h4>
                    <p>${group.type || 'Grupo'} · ${group.members || 'N/A miembros'}</p>
                    <p>${group.description || ''}</p>
                    <a href="${group.groupUrl}" target="_blank" class="group-link">Ver Grupo</a>
                  </div>
                </div>
              `).join('')}
            </div>
          `;
          break;
          
        case 'members':
          contentHTML = `
            <div class="data-list members-list">
              ${data.map(member => `
                <div class="data-item member-item">
                  <div class="member-img">
                    <img src="${member.imageUrl || 'icons/user.png'}" alt="${member.name}" />
                  </div>
                  <div class="member-info">
                    <h4>${member.name}</h4>
                    <p>Grupo: ${member.groupName || 'N/A'}</p>
                    <a href="${member.profileUrl}" target="_blank" class="member-link">Ver Perfil</a>
                  </div>
                </div>
              `).join('')}
            </div>
          `;
          break;
          
        default:
          contentHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
      }
    }
    
    // Estructura del modal
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${title}</h3>
          <span class="modal-close">&times;</span>
        </div>
        <div class="modal-body">
          ${contentHTML}
        </div>
        <div class="modal-footer">
          <button class="snap-lead-button secondary modal-close-btn">Cerrar</button>
          <button class="snap-lead-button primary export-data-btn">Exportar</button>
        </div>
      </div>
    `;
    
    // Añadir al DOM
    document.body.appendChild(modal);
    
    // Mostrar modal
    setTimeout(() => {
      modal.classList.add('visible');
    }, 10);
    
    // Manejar eventos
    const closeButtons = modal.querySelectorAll('.modal-close, .modal-close-btn');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        modal.classList.remove('visible');
        setTimeout(() => {
          modal.remove();
        }, 300);
      });
    });
    
    // Manejar exportación
    const exportBtn = modal.querySelector('.export-data-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportData(dataType, data);
      });
    }
  }

  /**
   * Exporta datos a un archivo CSV
   * @param {string} dataType - Tipo de datos
   * @param {Array} data - Datos a exportar
   */
  exportData(dataType, data) {
    if (!data || data.length === 0) {
      alert('No hay datos para exportar');
      return;
    }
    
    try {
      // Obtener encabezados del primer objeto
      const headers = Object.keys(data[0]);
      
      // Crear contenido CSV
      let csvContent = headers.join(',') + '\n';
      
      // Añadir filas
      data.forEach(item => {
        const row = headers.map(header => {
          // Escapar comas y comillas
          let cell = item[header] || '';
          if (typeof cell === 'string') {
            // Eliminar saltos de línea
            cell = cell.replace(/\n/g, ' ').replace(/\r/g, ' ');
            // Escapar comillas
            cell = cell.replace(/"/g, '""');
            // Si contiene comas, comillas o espacios, encerrar en comillas
            if (cell.includes(',') || cell.includes('"') || cell.includes(' ')) {
              cell = `"${cell}"`;
            }
          }
          return cell;
        }).join(',');
        
        csvContent += row + '\n';
      });
      
      // Crear blob
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      // Crear enlace de descarga
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `lead_manager_${dataType}_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.display = 'none';
      
      // Añadir al DOM y hacer clic
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('N8nIntegrationUI: Error al exportar datos', error);
      alert(`Error al exportar datos: ${error.message}`);
    }
  }

  /**
   * Enlaza los eventos a los elementos de la interfaz
   * @param {HTMLElement} container - Contenedor con los elementos
   */
  attachEvents(container) {
    // Guardar configuración
    const saveConfigButton = container.querySelector('#n8n-save-config');
    if (saveConfigButton) {
      saveConfigButton.addEventListener('click', async () => {
        // Solo guardamos la configuración de base de datos local
        const dbEnabled = container.querySelector('#n8n-db-enabled').checked;
        
        // Mostrar estado del botón
        saveConfigButton.textContent = 'Guardando...';
        saveConfigButton.disabled = true;
        
        // Configurar
        const success = await this.manager.configure({
          dbEnabled: dbEnabled
        });
        
        // Restaurar botón
        saveConfigButton.textContent = 'Guardar Configuración';
        saveConfigButton.disabled = false;
        
        // Mostrar mensaje de éxito
        if (success) {
          // Método para mostrar un mensaje temporal de éxito (definido en otra parte)
          if (window.LeadManagerPro.utils && window.LeadManagerPro.utils.showTemporaryMessage) {
            window.LeadManagerPro.utils.showTemporaryMessage('Configuración guardada correctamente', container);
          } else {
            alert('Configuración guardada correctamente');
          }
          
          // Actualizar la UI
          this.updateUI(container);
        } else {
          // Mostrar mensaje de error
          if (window.LeadManagerPro.utils && window.LeadManagerPro.utils.showTemporaryMessage) {
            window.LeadManagerPro.utils.showTemporaryMessage('Error al guardar la configuración', container, true);
          } else {
            alert('Error al guardar la configuración');
          }
        }
      });
    }
    
    // Sincronizar ahora
    const syncNowButton = container.querySelector('#n8n-sync-now');
    if (syncNowButton) {
      syncNowButton.addEventListener('click', async () => {
        // Mostrar estado del botón
        syncNowButton.textContent = 'Sincronizando...';
        syncNowButton.disabled = true;
        
        // Intentar sincronizar datos pendientes
        const success = await this.manager.syncPendingData();
        
        // Actualizar la UI (esto actualizará el botón)
        await this.updateUI(container);
        
        // Mostrar mensaje
        if (success) {
          if (window.LeadManagerPro.utils && window.LeadManagerPro.utils.showTemporaryMessage) {
            window.LeadManagerPro.utils.showTemporaryMessage('Datos sincronizados correctamente', container);
          } else {
            alert('Datos sincronizados correctamente');
          }
        } else {
          if (window.LeadManagerPro.utils && window.LeadManagerPro.utils.showTemporaryMessage) {
            window.LeadManagerPro.utils.showTemporaryMessage('Error al sincronizar algunos datos', container, true);
          } else {
            alert('Error al sincronizar algunos datos');
          }
        }
      });
    }
    
    // Eventos para visualización de datos (si están presentes)
    const viewProfilesBtn = container.querySelector('#view-profiles-btn');
    const viewGroupsBtn = container.querySelector('#view-groups-btn');
    const viewMembersBtn = container.querySelector('#view-members-btn');
    const exportDataBtn = container.querySelector('#export-data-btn');
    
    if (viewProfilesBtn) {
      viewProfilesBtn.addEventListener('click', async () => {
        const profiles = await this.manager.getUserData('profiles');
        this.showDataModal('profiles', profiles);
      });
    }
    
    if (viewGroupsBtn) {
      viewGroupsBtn.addEventListener('click', async () => {
        const groups = await this.manager.getUserData('groups');
        this.showDataModal('groups', groups);
      });
    }
    
    if (viewMembersBtn) {
      viewMembersBtn.addEventListener('click', async () => {
        const members = await this.manager.getUserData('members');
        this.showDataModal('members', members);
      });
    }
    
    if (exportDataBtn) {
      exportDataBtn.addEventListener('click', async () => {
        try {
          const profiles = await this.manager.getUserData('profiles');
          const groups = await this.manager.getUserData('groups');
          const members = await this.manager.getUserData('members');
          
          this.exportData('all', { profiles, groups, members });
        } catch (error) {
          console.error('Error al exportar datos:', error);
          alert('Error al exportar datos: ' + error.message);
        }
      });
    }
  }

  /**
   * Actualiza la interfaz de usuario
   * @param {HTMLElement} container - Contenedor con los elementos
   */
  async updateUI(container) {
    try {
      // Actualizar sección de configuración
      const configSection = container.querySelector('.snap-lead-section:first-child');
      if (configSection) {
        configSection.innerHTML = this.generateConfigHTML();
      }
      
      // Actualizar sección de datos de usuario
      const dataSection = container.querySelector('.snap-lead-section:last-child');
      if (dataSection) {
        dataSection.innerHTML = await this.generateUserDataHTML();
      }
      
      // Volver a enlazar eventos
      this.attachEvents(container);
    } catch (error) {
      console.error('N8nIntegrationUI: Error al actualizar UI', error);
    }
  }

  /**
   * Renderiza la interfaz completa en un contenedor
   * @param {HTMLElement} container - Contenedor donde renderizar
   * @returns {Promise<void>}
   */
  async render(container) {
    try {
      // Generar HTML
      const configHTML = this.generateConfigHTML();
      const userDataHTML = await this.generateUserDataHTML();
      
      // Insertar en el contenedor
      container.innerHTML = `
        <div class="n8n-integration-ui">
          ${configHTML}
          ${userDataHTML}
        </div>
      `;
      
      // Enlazar eventos
      this.attachEvents(container);
    } catch (error) {
      console.error('N8nIntegrationUI: Error al renderizar', error);
      container.innerHTML = `<p class="error">Error al cargar la interfaz: ${error.message}</p>`;
    }
  }
}

// Inicializar y exportar
window.LeadManagerPro.modules.n8nIntegrationUI = new N8nIntegrationUI(); 