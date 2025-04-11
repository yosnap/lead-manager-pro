// Módulo para gestionar la sincronización con la base de datos

class DbSyncManager {
  constructor() {
    this.isConnected = false;
    this.apiUrl = '';
    this.apiKey = '';
    this.lastSyncTime = null;
    this.enabled = false;
    this.syncInterval = 30 * 60 * 1000; // 30 minutos por defecto
    this.syncTimer = null;
  }
  
  // Inicializar el módulo
  async init() {
    console.log('DbSyncManager: Initializing module');
    
    try {
      // Cargar configuración desde chrome.storage
      const result = await new Promise(resolve => {
        chrome.storage.local.get(['leadManagerDbConfig'], resolve);
      });
      
      if (result && result.leadManagerDbConfig) {
        this.apiUrl = result.leadManagerDbConfig.apiUrl || '';
        this.apiKey = result.leadManagerDbConfig.apiKey || '';
        this.enabled = result.leadManagerDbConfig.enabled || false;
        this.syncInterval = result.leadManagerDbConfig.syncInterval || this.syncInterval;
        this.lastSyncTime = result.leadManagerDbConfig.lastSyncTime || null;
        
        console.log('DbSyncManager: Configuración cargada desde storage');
      }
      
      // Si está habilitado, iniciar temporizador de sincronización
      if (this.enabled && this.apiUrl && this.apiKey) {
        this.startSyncTimer();
      }
    } catch (error) {
      console.error('DbSyncManager: Error al inicializar', error);
    }
    
    return this;
  }
  
  // Configurar conexión
  async configure(config) {
    try {
      // Detener sincronización existente si está activa
      this.stopSyncTimer();
      
      // Actualizar configuración
      this.apiUrl = config.apiUrl || this.apiUrl;
      this.apiKey = config.apiKey || this.apiKey;
      this.enabled = config.enabled !== undefined ? config.enabled : this.enabled;
      this.syncInterval = config.syncInterval || this.syncInterval;
      
      // Guardar en chrome.storage
      await new Promise(resolve => {
        chrome.storage.local.set({
          'leadManagerDbConfig': {
            apiUrl: this.apiUrl,
            apiKey: this.apiKey,
            enabled: this.enabled,
            syncInterval: this.syncInterval,
            lastSyncTime: this.lastSyncTime
          }
        }, resolve);
      });
      
      console.log('DbSyncManager: Configuración actualizada');
      
      // Si está habilitado, iniciar temporizador
      if (this.enabled && this.apiUrl && this.apiKey) {
        this.startSyncTimer();
        
        // Intentar sincronizar inmediatamente
        return await this.syncNow();
      }
      
      return true;
    } catch (error) {
      console.error('DbSyncManager: Error al configurar', error);
      return false;
    }
  }
  
  // Iniciar temporizador de sincronización
  startSyncTimer() {
    // Detener temporizador existente si hay alguno
    this.stopSyncTimer();
    
    // Crear nuevo temporizador
    this.syncTimer = setInterval(() => {
      this.syncNow().catch(error => {
        console.error('DbSyncManager: Error en sincronización automática', error);
      });
    }, this.syncInterval);
    
    console.log(`DbSyncManager: Sincronización automática iniciada (cada ${this.syncInterval/60000} minutos)`);
  }
  
  // Detener temporizador de sincronización
  stopSyncTimer() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('DbSyncManager: Sincronización automática detenida');
    }
  }
  
  // Sincronizar ahora (manualmente o por temporizador)
  async syncNow() {
    if (!this.enabled || !this.apiUrl || !this.apiKey) {
      console.log('DbSyncManager: Sincronización no habilitada o faltan credenciales');
      return false;
    }
    
    try {
      console.log('DbSyncManager: Iniciando sincronización con la base de datos');
      
      // Obtener datos a sincronizar desde chrome.storage
      const dataToSync = await this.collectDataForSync();
      
      // Si no hay datos para sincronizar, salir
      if (!dataToSync || Object.keys(dataToSync).length === 0) {
        console.log('DbSyncManager: No hay datos para sincronizar');
        return true;
      }
      
      // Realizar la petición a la API
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          ...dataToSync,
          timestamp: new Date().toISOString()
        })
      });
      
      // Verificar respuesta
      if (!response.ok) {
        throw new Error(`Error en respuesta API: ${response.status} ${response.statusText}`);
      }
      
      // Procesar respuesta
      const result = await response.json();
      
      // Actualizar timestamp de última sincronización
      this.lastSyncTime = new Date().toISOString();
      
      // Guardar en storage
      await new Promise(resolve => {
        chrome.storage.local.set({
          'leadManagerDbConfig': {
            apiUrl: this.apiUrl,
            apiKey: this.apiKey,
            enabled: this.enabled,
            syncInterval: this.syncInterval,
            lastSyncTime: this.lastSyncTime
          }
        }, resolve);
      });
      
      console.log('DbSyncManager: Sincronización completada con éxito', result);
      
      // Notificar si hay callback de sincronización registrado
      if (window.leadManagerPro && window.leadManagerPro.onDbSyncComplete) {
        window.leadManagerPro.onDbSyncComplete(result);
      }
      
      return true;
    } catch (error) {
      console.error('DbSyncManager: Error durante la sincronización', error);
      
      // Notificar error si hay callback registrado
      if (window.leadManagerPro && window.leadManagerPro.onDbSyncError) {
        window.leadManagerPro.onDbSyncError(error);
      }
      
      return false;
    }
  }
  
  // Recopilar datos para sincronizar
  async collectDataForSync() {
    try {
      // Obtener todos los datos relevantes desde chrome.storage
      const result = await new Promise(resolve => {
        chrome.storage.local.get([
          'snap_lead_manager_general_options',
          'snap_lead_manager_group_options',
          'leadManagerInteractionStats',
          'leadManagerExtractedGroups',
          'leadManagerExtractedMembers'
        ], resolve);
      });
      
      // Estructurar los datos para enviar
      const dataToSync = {
        configurations: {
          generalOptions: result.snap_lead_manager_general_options ? 
            JSON.parse(result.snap_lead_manager_general_options) : null,
          groupOptions: result.snap_lead_manager_group_options ? 
            JSON.parse(result.snap_lead_manager_group_options) : null
        },
        statistics: {
          interactions: result.leadManagerInteractionStats || null
        },
        data: {
          extractedGroups: result.leadManagerExtractedGroups || [],
          extractedMembers: result.leadManagerExtractedMembers || []
        }
      };
      
      return dataToSync;
    } catch (error) {
      console.error('DbSyncManager: Error al recopilar datos para sincronización', error);
      return {};
    }
  }
  
  // Obtener estado de conexión
  getConnectionStatus() {
    return {
      enabled: this.enabled,
      connected: this.isConnected,
      apiUrl: this.apiUrl,
      lastSync: this.lastSyncTime,
      syncInterval: this.syncInterval
    };
  }
}

// Exportar la clase
window.leadManagerPro = window.leadManagerPro || {};
window.leadManagerPro.dbSyncManager = new DbSyncManager();
