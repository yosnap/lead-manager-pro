// Módulo para la interfaz de usuario del gestor de sincronización con base de datos

class DbSyncManagerUI {
  constructor() {
    this.container = null;
    this.dbSyncManager = null;
  }

  // Inicializar el módulo
  init() {
    console.log('DbSyncManagerUI: Initializing module');
    
    // Inicializar el módulo de sincronización con base de datos
    this.dbSyncManager = window.leadManagerPro.dbSyncManager;
    
    return this;
  }
  
  // Crear el formulario de configuración de base de datos
  createConfigForm() {
    // Crear contenedor para el formulario
    const formContainer = document.createElement('div');
    formContainer.className = 'lead-manager-db-config-form';
    
    // Obtener estado actual de la conexión
    const connectionStatus = this.dbSyncManager.getConnectionStatus();
    
    // Título de la sección
    const titleElement = document.createElement('div');
    titleElement.textContent = 'Configuración de Sincronización con Base de Datos';
    titleElement.style.fontWeight = 'bold';
    titleElement.style.fontSize = '16px';
    titleElement.style.marginBottom = '16px';
    
    // Estado de la conexión
    const statusContainer = document.createElement('div');
    statusContainer.style.marginBottom = '16px';
    statusContainer.style.padding = '8px';
    statusContainer.style.backgroundColor = connectionStatus.enabled ? '#E8F5E9' : '#FAFAFA';
    statusContainer.style.borderRadius = '4px';
    
    const statusText = document.createElement('div');
    statusText.style.marginBottom = '4px';
    statusText.innerHTML = connectionStatus.enabled ? 
      '<span style="color:#4CAF50;font-weight:bold;">✓ Sincronización habilitada</span>' : 
      '<span style="color:#757575;">Sincronización deshabilitada</span>';
    
    const lastSyncText = document.createElement('div');
    lastSyncText.style.fontSize = '12px';
    lastSyncText.style.color = '#757575';
    lastSyncText.textContent = connectionStatus.lastSync ? 
      `Última sincronización: ${new Date(connectionStatus.lastSync).toLocaleString()}` : 
      'Sin sincronizaciones previas';
    
    statusContainer.appendChild(statusText);
    statusContainer.appendChild(lastSyncText);
    
    // Toggle para habilitar/deshabilitar
    const enabledContainer = document.createElement('div');
    enabledContainer.style.marginBottom = '16px';
    
    const enabledLabel = document.createElement('label');
    enabledLabel.style.display = 'flex';
    enabledLabel.style.alignItems = 'center';
    enabledLabel.style.marginBottom = '4px';
    enabledLabel.style.cursor = 'pointer';
    
    const enabledCheckbox = document.createElement('input');
    enabledCheckbox.type = 'checkbox';
    enabledCheckbox.checked = connectionStatus.enabled;
    enabledCheckbox.style.marginRight = '8px';
    
    const enabledText = document.createTextNode('Habilitar sincronización con base de datos');
    
    enabledLabel.appendChild(enabledCheckbox);
    enabledLabel.appendChild(enabledText);
    
    enabledContainer.appendChild(enabledLabel);
    
    // Campo para URL de la API
    const apiUrlLabel = document.createElement('label');
    apiUrlLabel.textContent = 'URL de la API:';
    apiUrlLabel.style.display = 'block';
    apiUrlLabel.style.marginBottom = '4px';
    
    const apiUrlInput = document.createElement('input');
    apiUrlInput.type = 'text';
    apiUrlInput.value = connectionStatus.apiUrl || '';
    apiUrlInput.placeholder = 'https://tu-api.com/lead-manager/sync';
    apiUrlInput.style.width = '100%';
    apiUrlInput.style.padding = '6px';
    apiUrlInput.style.marginBottom = '12px';
    apiUrlInput.style.borderRadius = '4px';
    apiUrlInput.style.border = '1px solid #CED0D4';
    
    // Campo para API key
    const apiKeyLabel = document.createElement('label');
    apiKeyLabel.textContent = 'Clave de API:';
    apiKeyLabel.style.display = 'block';
    apiKeyLabel.style.marginBottom = '4px';
    
    const apiKeyInput = document.createElement('input');
    apiKeyInput.type = 'password';
    apiKeyInput.value = connectionStatus.apiKey || '';
    apiKeyInput.placeholder = 'Tu clave de API secreta';
    apiKeyInput.style.width = '100%';
    apiKeyInput.style.padding = '6px';
    apiKeyInput.style.marginBottom = '12px';
    apiKeyInput.style.borderRadius = '4px';
    apiKeyInput.style.border = '1px solid #CED0D4';
    
    // Intervalo de sincronización
    const syncIntervalLabel = document.createElement('label');
    syncIntervalLabel.textContent = 'Intervalo de sincronización (minutos):';
    syncIntervalLabel.style.display = 'block';
    syncIntervalLabel.style.marginBottom = '4px';
    
    const syncIntervalInput = document.createElement('input');
    syncIntervalInput.type = 'number';
    syncIntervalInput.min = '5';
    syncIntervalInput.value = Math.round(connectionStatus.syncInterval / 60000) || 30;
    syncIntervalInput.style.width = '100%';
    syncIntervalInput.style.padding = '6px';
    syncIntervalInput.style.marginBottom = '16px';
    syncIntervalInput.style.borderRadius = '4px';
    syncIntervalInput.style.border = '1px solid #CED0D4';
    
    // Botones de acción
    const actionContainer = document.createElement('div');
    actionContainer.style.display = 'flex';
    actionContainer.style.justifyContent = 'space-between';
    actionContainer.style.gap = '8px';
    actionContainer.style.marginTop = '8px';
    
    // Botón de sincronización manual
    const syncNowButton = document.createElement('button');
    syncNowButton.textContent = 'Sincronizar ahora';
    syncNowButton.style.cssText = `
      padding: 8px 16px;
      background-color: #4267B2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      flex: 1;
    `;
    
    // Botón de guardar configuración
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Guardar configuración';
    saveButton.style.cssText = `
      padding: 8px 16px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      flex: 1;
    `;
    
    actionContainer.appendChild(syncNowButton);
    actionContainer.appendChild(saveButton);
    
    // Eventos de botones
    
    // Evento para guardar configuración
    saveButton.addEventListener('click', async () => {
      // Obtener valores
      const enabled = enabledCheckbox.checked;
      const apiUrl = apiUrlInput.value.trim();
      const apiKey = apiKeyInput.value.trim();
      const syncInterval = parseInt(syncIntervalInput.value) * 60 * 1000; // Convertir a milisegundos
      
      // Validar entrada
      if (enabled && (!apiUrl || !apiKey)) {
        alert('Para habilitar la sincronización, debes proporcionar una URL de API y una clave de API válidas.');
        return;
      }
      
      if (isNaN(syncInterval) || syncInterval < 300000) { // Mínimo 5 minutos
        alert('El intervalo de sincronización debe ser de al menos 5 minutos.');
        return;
      }
      
      // Guardar configuración
      const success = await this.dbSyncManager.configure({
        enabled,
        apiUrl,
        apiKey,
        syncInterval
      });
      
      if (success) {
        // Mostrar mensaje de éxito
        const successMessage = document.createElement('div');
        successMessage.textContent = '✓ Configuración guardada correctamente';
        successMessage.style.cssText = `
          color: #00C851;
          margin-top: 8px;
          font-size: 14px;
          text-align: center;
        `;
        
        formContainer.appendChild(successMessage);
        
        // Actualizar estado mostrado
        statusText.innerHTML = enabled ? 
          '<span style="color:#4CAF50;font-weight:bold;">✓ Sincronización habilitada</span>' : 
          '<span style="color:#757575;">Sincronización deshabilitada</span>';
        
        // Eliminar el mensaje después de 3 segundos
        setTimeout(() => {
          if (formContainer.contains(successMessage)) {
            formContainer.removeChild(successMessage);
          }
        }, 3000);
      } else {
        alert('Error al guardar la configuración. Por favor, verifica los datos e intenta de nuevo.');
      }
    });
    
    // Evento para sincronización manual
    syncNowButton.addEventListener('click', async () => {
      // Deshabilitar botón durante la sincronización
      syncNowButton.disabled = true;
      syncNowButton.textContent = 'Sincronizando...';
      syncNowButton.style.opacity = '0.7';
      
      try {
        // Intentar sincronizar
        const result = await this.dbSyncManager.syncNow();
        
        if (result) {
          // Actualizar texto de última sincronización
          const connectionStatus = this.dbSyncManager.getConnectionStatus();
          lastSyncText.textContent = connectionStatus.lastSync ? 
            `Última sincronización: ${new Date(connectionStatus.lastSync).toLocaleString()}` : 
            'Sin sincronizaciones previas';
          
          // Mostrar mensaje de éxito
          const successMessage = document.createElement('div');
          successMessage.textContent = '✓ Sincronización completada con éxito';
          successMessage.style.cssText = `
            color: #00C851;
            margin-top: 8px;
            font-size: 14px;
            text-align: center;
          `;
          
          formContainer.appendChild(successMessage);
          
          // Eliminar el mensaje después de 3 segundos
          setTimeout(() => {
            if (formContainer.contains(successMessage)) {
              formContainer.removeChild(successMessage);
            }
          }, 3000);
        } else {
          alert('Error durante la sincronización. Por favor, verifica la configuración e intenta de nuevo.');
        }
      } catch (error) {
        alert(`Error durante la sincronización: ${error.message}`);
      } finally {
        // Restaurar estado del botón
        syncNowButton.disabled = false;
        syncNowButton.textContent = 'Sincronizar ahora';
        syncNowButton.style.opacity = '1';
      }
    });
    
    // Ensamblar el formulario
    formContainer.appendChild(titleElement);
    formContainer.appendChild(statusContainer);
    formContainer.appendChild(enabledContainer);
    formContainer.appendChild(apiUrlLabel);
    formContainer.appendChild(apiUrlInput);
    formContainer.appendChild(apiKeyLabel);
    formContainer.appendChild(apiKeyInput);
    formContainer.appendChild(syncIntervalLabel);
    formContainer.appendChild(syncIntervalInput);
    formContainer.appendChild(actionContainer);
    
    return formContainer;
  }
  
  // Inyectar formulario de configuración en un contenedor
  injectConfigForm(container) {
    if (!container) {
      console.error('DbSyncManagerUI: No se proporcionó un contenedor válido');
      return false;
    }
    
    // Limpiar el contenedor
    container.innerHTML = '';
    
    // Crear y agregar el formulario
    const form = this.createConfigForm();
    container.appendChild(form);
    
    return true;
  }
}

// Exportar la clase
window.leadManagerPro = window.leadManagerPro || {};
window.leadManagerPro.dbSyncManagerUI = new DbSyncManagerUI();
