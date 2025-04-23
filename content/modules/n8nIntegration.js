/**
 * Módulo para manejar la integración con n8n y la gestión de datos de usuario
 */

// Namespace para la organización del código
window.LeadManagerPro = window.LeadManagerPro || {};
window.LeadManagerPro.modules = window.LeadManagerPro.modules || {};

class N8nIntegrationManager {
  constructor() {
    // URL fija para el webhook (Fase 1)
    this.n8nWebhookUrl = 'https://n8n.codeia.dev/webhook-test/webhook/lead-manager-pro';
    this.userId = null;
    this.username = '';
    this.apiKey = '';
    this.isConfigured = true; // Por defecto configurado con la URL fija
    this.pendingData = [];
    this.lastSyncTime = null;
    this.dbEnabled = false;
  }

  /**
   * Inicializa el módulo de integración con n8n
   * @returns {Promise<N8nIntegrationManager>}
   */
  async init() {
    console.log('N8nIntegrationManager: Iniciando módulo');
    
    try {
      // Cargar configuración desde chrome.storage (solo para la base de datos local)
      const result = await new Promise(resolve => {
        chrome.storage.local.get(['leadManagerN8nConfig', 'leadManagerUserId'], resolve);
      });
      
      if (result && result.leadManagerN8nConfig) {
        // Mantener la URL fija en esta fase
        // this.n8nWebhookUrl = result.leadManagerN8nConfig.webhookUrl || '';
        // this.apiKey = result.leadManagerN8nConfig.apiKey || '';
        this.dbEnabled = result.leadManagerN8nConfig.dbEnabled || false;
        this.lastSyncTime = result.leadManagerN8nConfig.lastSyncTime || null;
        // La configuración siempre es válida en esta fase
        this.isConfigured = true;
        
        console.log('N8nIntegrationManager: Configuración cargada');
      }
      
      if (result && result.leadManagerUserId) {
        this.userId = result.leadManagerUserId.id || null;
        this.username = result.leadManagerUserId.username || '';
        
        console.log('N8nIntegrationManager: ID de usuario cargado');
      }
      
      // Cargar datos pendientes
      await this.loadPendingData();
      
      return this;
    } catch (error) {
      console.error('N8nIntegrationManager: Error al inicializar', error);
      return this;
    }
  }
  
  /**
   * Configura la integración con n8n
   * @param {Object} config - Configuración para la integración
   * @returns {Promise<boolean>}
   */
  async configure(config) {
    try {
      // En esta fase solo configuramos el almacenamiento local y el nombre de usuario
      // Ignoramos webhookUrl y apiKey (los mantenemos fijos)
      if (config.dbEnabled !== undefined) this.dbEnabled = config.dbEnabled;
      if (config.userId !== undefined) this.userId = config.userId;
      if (config.username !== undefined) this.username = config.username;
      
      // Siempre configurado en esta fase
      this.isConfigured = true;
      
      // Guardar configuración en chrome.storage
      await Promise.all([
        new Promise(resolve => {
          chrome.storage.local.set({
            'leadManagerN8nConfig': {
              webhookUrl: this.n8nWebhookUrl, // guardamos la URL fija
              apiKey: this.apiKey,
              dbEnabled: this.dbEnabled,
              lastSyncTime: this.lastSyncTime
            }
          }, resolve);
        }),
        new Promise(resolve => {
          if (this.userId) {
            chrome.storage.local.set({
              'leadManagerUserId': {
                id: this.userId,
                username: this.username
              }
            }, resolve);
          } else {
            resolve();
          }
        })
      ]);
      
      console.log('N8nIntegrationManager: Configuración actualizada');
      
      // Si hay datos pendientes, intentar sincronizar
      if (this.isConfigured && this.pendingData.length > 0) {
        return await this.syncPendingData();
      }
      
      return true;
    } catch (error) {
      console.error('N8nIntegrationManager: Error al configurar', error);
      return false;
    }
  }
  
  /**
   * Verifica si el usuario está autenticado
   * @returns {boolean}
   */
  isAuthenticated() {
    // En esta fase no requerimos autenticación formal
    return true;
  }
  
  /**
   * Envía datos a n8n mediante el webhook configurado
   * @param {string} dataType - Tipo de datos (perfiles, grupos, miembros)
   * @param {Array} data - Array de datos a enviar
   * @returns {Promise<boolean>}
   */
  async sendToN8n(dataType, data) {
    try {
      console.log(`N8nIntegrationManager: Enviando ${data.length} ${dataType} a n8n`);
      
      const payload = {
        userId: this.userId || 'anonymous',
        username: this.username || 'usuario',
        dataType: dataType,
        data: data,
        timestamp: new Date().toISOString()
      };
      
      const response = await fetch(this.n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // Sin Authentication header en esta fase
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Error en respuesta: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Actualizar timestamp de última sincronización
      this.lastSyncTime = new Date().toISOString();
      
      // Guardar en storage
      await new Promise(resolve => {
        chrome.storage.local.set({
          'leadManagerN8nConfig': {
            webhookUrl: this.n8nWebhookUrl,
            apiKey: this.apiKey,
            dbEnabled: this.dbEnabled,
            lastSyncTime: this.lastSyncTime
          }
        }, resolve);
      });
      
      console.log('N8nIntegrationManager: Datos enviados con éxito', result);
      
      // Si la base de datos está habilitada, guardar los datos también localmente
      if (this.dbEnabled) {
        await this.saveToLocalDatabase(dataType, data);
      }
      
      return true;
    } catch (error) {
      console.error('N8nIntegrationManager: Error al enviar datos a n8n', error);
      
      // Almacenar los datos para intentar enviarlos más tarde
      await this.storeDataForLater(dataType, data);
      
      return false;
    }
  }
  
  /**
   * Guarda datos en la base de datos local
   * @param {string} dataType - Tipo de datos
   * @param {Array} data - Datos a guardar
   * @returns {Promise<boolean>}
   */
  async saveToLocalDatabase(dataType, data) {
    if (!this.dbEnabled) return false;
    
    try {
      console.log(`N8nIntegrationManager: Guardando ${data.length} ${dataType} en la base de datos local`);
      
      // Obtener datos existentes
      const storageKey = `leadManagerUserData_${this.userId}_${dataType}`;
      
      const result = await new Promise(resolve => {
        chrome.storage.local.get([storageKey], resolve);
      });
      
      // Combinar con datos existentes
      let existingData = result[storageKey] || [];
      
      // Opcional: eliminar duplicados usando un identificador único como profileUrl o groupUrl
      const uniqueField = dataType === 'profiles' ? 'profileUrl' : (dataType === 'groups' ? 'groupUrl' : 'memberId');
      const existingIds = new Set(existingData.map(item => item[uniqueField]));
      
      // Filtrar para añadir solo elementos nuevos
      const newData = data.filter(item => !existingIds.has(item[uniqueField]));
      
      // Combinar datos
      const combinedData = [...existingData, ...newData];
      
      // Guardar en storage
      await new Promise(resolve => {
        chrome.storage.local.set({
          [storageKey]: combinedData
        }, resolve);
      });
      
      console.log(`N8nIntegrationManager: Guardados ${newData.length} nuevos ${dataType} en la base de datos local`);
      
      return true;
    } catch (error) {
      console.error('N8nIntegrationManager: Error al guardar datos localmente', error);
      return false;
    }
  }
  
  /**
   * Almacena datos para envío posterior
   * @param {string} dataType - Tipo de datos
   * @param {Array} data - Datos a almacenar
   * @returns {Promise<boolean>}
   */
  async storeDataForLater(dataType, data) {
    try {
      // Añadir a la cola de pendientes
      this.pendingData.push({
        dataType,
        data,
        timestamp: new Date().toISOString()
      });
      
      // Guardar pendientes en storage
      await new Promise(resolve => {
        chrome.storage.local.set({
          'leadManagerPendingData': this.pendingData
        }, resolve);
      });
      
      console.log(`N8nIntegrationManager: ${data.length} ${dataType} almacenados para envío posterior`);
      
      return true;
    } catch (error) {
      console.error('N8nIntegrationManager: Error al almacenar datos pendientes', error);
      return false;
    }
  }
  
  /**
   * Carga datos pendientes de envío desde storage
   * @returns {Promise<boolean>}
   */
  async loadPendingData() {
    try {
      const result = await new Promise(resolve => {
        chrome.storage.local.get(['leadManagerPendingData'], resolve);
      });
      
      if (result && result.leadManagerPendingData) {
        this.pendingData = result.leadManagerPendingData;
        console.log(`N8nIntegrationManager: Cargados ${this.pendingData.length} lotes de datos pendientes`);
      }
      
      return true;
    } catch (error) {
      console.error('N8nIntegrationManager: Error al cargar datos pendientes', error);
      return false;
    }
  }
  
  /**
   * Sincroniza todos los datos pendientes
   * @returns {Promise<boolean>}
   */
  async syncPendingData() {
    if (!this.isConfigured || this.pendingData.length === 0) {
      return false;
    }
    
    try {
      console.log(`N8nIntegrationManager: Sincronizando ${this.pendingData.length} lotes de datos pendientes`);
      
      // Copiar la lista de pendientes
      const pendingToSync = [...this.pendingData];
      
      // Limpiar la lista actual
      this.pendingData = [];
      
      // Actualizar en storage
      await new Promise(resolve => {
        chrome.storage.local.set({
          'leadManagerPendingData': this.pendingData
        }, resolve);
      });
      
      // Procesar cada lote
      let successCount = 0;
      
      for (const item of pendingToSync) {
        const success = await this.sendToN8n(item.dataType, item.data);
        
        if (success) {
          successCount++;
        } else {
          // Si falla, volver a añadir a la lista de pendientes
          this.pendingData.push(item);
        }
      }
      
      // Actualizar pendientes en storage si hubo fallos
      if (this.pendingData.length > 0) {
        await new Promise(resolve => {
          chrome.storage.local.set({
            'leadManagerPendingData': this.pendingData
          }, resolve);
        });
      }
      
      console.log(`N8nIntegrationManager: Sincronización completada. ${successCount}/${pendingToSync.length} lotes enviados correctamente.`);
      
      return true;
    } catch (error) {
      console.error('N8nIntegrationManager: Error durante la sincronización de pendientes', error);
      return false;
    }
  }
  
  /**
   * Obtiene datos específicos de usuario desde el almacenamiento local
   * @param {string} dataType - Tipo de datos a obtener (profiles, groups, members)
   * @returns {Promise<Array>}
   */
  async getUserData(dataType) {
    if (!this.userId) return [];
    
    try {
      const storageKey = `leadManagerUserData_${this.userId}_${dataType}`;
      
      const result = await new Promise(resolve => {
        chrome.storage.local.get([storageKey], resolve);
      });
      
      return result[storageKey] || [];
    } catch (error) {
      console.error(`N8nIntegrationManager: Error al obtener datos de ${dataType}`, error);
      return [];
    }
  }
  
  /**
   * Obtiene el estado de la configuración
   * @returns {Object} - Estado actual de la configuración
   */
  getStatus() {
    return {
      isConfigured: this.isConfigured,
      userId: this.userId,
      username: this.username,
      n8nWebhookUrl: this.n8nWebhookUrl,
      dbEnabled: this.dbEnabled,
      lastSyncTime: this.lastSyncTime,
      pendingDataCount: this.pendingData.length
    };
  }
}

// Inicializar y exportar
window.LeadManagerPro.n8nIntegration = new N8nIntegrationManager(); 