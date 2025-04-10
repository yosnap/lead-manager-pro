// Módulo para la búsqueda y extracción de grupos de Facebook
// Este módulo implementa la funcionalidad para buscar grupos basados en criterios
// como tipo de grupo (público/privado), cantidad mínima de miembros y actividad mínima

class GroupFinder {
  constructor() {
    this.options = null;
    this.isSearching = false;
    this.groups = [];
    this.scrollCount = 0;
    this.maxScrolls = 50;
    this.scrollTimeout = 2000;
    this.observer = null;
    this.progressCallback = null;
  }

  // Inicializar con opciones
  init(options, progressCallback = null) {
    this.options = options || {};
    
    // FORZAR LECTURA CORRECTA DE OPCIONES
    console.log("INITIALIZING GROUP FINDER SCROLL OPTIONS");
    console.log("Options received:", options);
    
    // Dar prioridad a opciones pasadas directamente
    const directMaxScrolls = options && !isNaN(Number(options.maxScrolls)) ? Number(options.maxScrolls) : null;
    const directScrollDelay = options && !isNaN(Number(options.scrollDelay)) ? Number(options.scrollDelay) : null;
    
    console.log("Direct options:", { directMaxScrolls, directScrollDelay });
    
    // Intentar cargar opciones del localStorage
    try {
      // Cargar opciones generales
      const generalOptionsStr = localStorage.getItem('snap_lead_manager_general_options');
      let localStorageMaxScrolls = null;
      let localStorageScrollDelay = null;
      
      if (generalOptionsStr) {
        try {
          const generalOptions = JSON.parse(generalOptionsStr);
          localStorageMaxScrolls = !isNaN(Number(generalOptions.maxScrolls)) ? Number(generalOptions.maxScrolls) : null;
          localStorageScrollDelay = !isNaN(Number(generalOptions.scrollDelay)) ? Number(generalOptions.scrollDelay) : null;
          
          console.log('Storage options found:', { localStorageMaxScrolls, localStorageScrollDelay });
        } catch (parseError) {
          console.error('Error parsing localStorage options:', parseError);
        }
      }
      
      // PRIORIDAD: 1. Opciones directas, 2. localStorage, 3. Valores por defecto
      this.maxScrolls = directMaxScrolls || localStorageMaxScrolls || 50;
      this.scrollTimeout = (directScrollDelay || localStorageScrollDelay || 2) * 1000; // Convertir a milisegundos
      
      console.log('FINAL CONFIG VALUES - maxScrolls:', this.maxScrolls, 'scrollTimeout:', this.scrollTimeout);
      
      // FORZAR GUARDADO en localStorage para asegurar coherencia
      try {
        localStorage.setItem('snap_lead_manager_general_options', JSON.stringify({
          maxScrolls: this.maxScrolls,
          scrollDelay: this.scrollTimeout / 1000
        }));
        console.log('Values saved back to localStorage');
      } catch (e) {
        console.error('Error saving config to localStorage:', e);
      }
      
      // Cargar opciones específicas de grupo
      const groupOptionsStr = localStorage.getItem('snap_lead_manager_group_options');
      if (groupOptionsStr) {
        const groupOptions = JSON.parse(groupOptionsStr);
        
        // Usar opciones del sidebar
        this.options.publicGroups = groupOptions.publicGroups !== false;
        this.options.privateGroups = groupOptions.privateGroups !== false;
        this.options.minUsers = parseInt(groupOptions.minUsers) || 0;
        this.options.minPostsYear = groupOptions.minPostsYear === '' ? '' : parseInt(groupOptions.minPostsYear) || 0;
        this.options.minPostsMonth = groupOptions.minPostsMonth === '' ? '' : parseInt(groupOptions.minPostsMonth) || 0;
        this.options.minPostsDay = groupOptions.minPostsDay === '' ? '' : parseInt(groupOptions.minPostsDay) || 0;
        
        console.log('GroupFinder: Opciones cargadas desde localStorage (sidebar):', {
          publicGroups: this.options.publicGroups,
          privateGroups: this.options.privateGroups,
          minUsers: this.options.minUsers,
          minPostsYear: this.options.minPostsYear,
          minPostsMonth: this.options.minPostsMonth,
          minPostsDay: this.options.minPostsDay
        });
      } else if (this.options.groupOptions) {
        // Si no hay opciones en localStorage pero se proporcionan opciones directamente
        this.options.publicGroups = this.options.groupOptions.publicGroups !== false;
        this.options.privateGroups = this.options.groupOptions.privateGroups !== false;
        this.options.minUsers = parseInt(this.options.groupOptions.minUsers) || 0;
        this.options.minPostsYear = this.options.groupOptions.minPostsYear === '' ? '' : parseInt(this.options.groupOptions.minPostsYear) || 0;
        this.options.minPostsMonth = this.options.groupOptions.minPostsMonth === '' ? '' : parseInt(this.options.groupOptions.minPostsMonth) || 0;
        this.options.minPostsDay = this.options.groupOptions.minPostsDay === '' ? '' : parseInt(this.options.groupOptions.minPostsDay) || 0;
      } else {
        // Si no hay opciones ni en localStorage ni proporcionadas directamente, usar valores predeterminados
        this.options.publicGroups = this.options.publicGroups !== false;
        this.options.privateGroups = this.options.privateGroups !== false;
        this.options.minUsers = parseInt(this.options.minUsers) || 0;
      }
    } catch (error) {
      console.error('GroupFinder: Error al cargar opciones desde localStorage:', error);
      // Usar valores predeterminados en caso de error
      this.maxScrolls = 50;
      this.scrollTimeout = 2000;
      this.options.publicGroups = true;
      this.options.privateGroups = true;
      this.options.minUsers = 0;
    }
    
    this.progressCallback = progressCallback;
    
    console.log('GroupFinder: Inicializado con opciones finales:', this.options);
    
    return this;
  }

  // Iniciar la búsqueda de grupos
  startSearch() {
    if (this.isSearching) {
      console.log('GroupFinder: Ya hay una búsqueda en progreso');
      return false;
    }
    
    this.isSearching = true;
    this.groups = [];
    this.scrollCount = 0;
    
    console.log('GroupFinder: Iniciando búsqueda de grupos');
    
    // Iniciar el observador para detectar nuevos grupos
    this.setupObserver();
    
    // Comenzar el scrolling
    this.scrollAndCollect();
    
    return true;
  }

  // Detener la búsqueda
  stopSearch() {
    this.isSearching = false;
    
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    console.log('GroupFinder: Búsqueda detenida. Grupos encontrados:', this.groups.length);
    
    return this.groups;
  }

  // Configurar MutationObserver para detectar nuevos grupos cargados en la página
  setupObserver() {
    if (this.observer) {
      this.observer.disconnect();
    }
    
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Procesar los grupos añadidos
          setTimeout(() => this.collectVisibleGroups(), 500);
        }
      }
    });
    
    // Observar cambios en el contenedor principal de resultados
    // Ajustar selector según la estructura de Facebook
    const targetNode = document.querySelector('div[role="main"]');
    if (targetNode) {
      this.observer.observe(targetNode, { childList: true, subtree: true });
    } else {
      console.warn('GroupFinder: No se encontró el contenedor principal para observar');
    }
  }

  // Realizar scroll y recolectar grupos
  scrollAndCollect() {
    // Verificar si debemos detener el scrolling
    if (!this.isSearching || this.scrollCount >= this.maxScrolls) {
      console.log('GroupFinder: Finalizando scrolling - scrollCount:', this.scrollCount, 'maxScrolls:', this.maxScrolls);
      this.finishSearch();
      return;
    }
    
    // Loggear detalles de configuración antes de cada scroll para diagnóstico
    console.log(`GroupFinder: CONFIGURACIÓN ACTUAL - maxScrolls: ${this.maxScrolls}, scrollTimeout: ${this.scrollTimeout}ms`);
    
    // Recolectar grupos visibles
    this.collectVisibleGroups();
    
    // Realizar scroll
    window.scrollTo(0, document.body.scrollHeight);
    this.scrollCount++;
    
    // Registrar tiempo exacto del scroll
    const scrollTime = new Date().toLocaleTimeString();
    console.log(`GroupFinder: Scroll #${this.scrollCount} completado a las ${scrollTime}`);
    
    // Informar del progreso con mensaje personalizado para el scrolling actual
    if (this.progressCallback) {
      const progress = Math.round((this.scrollCount / this.maxScrolls) * 100);
      // Importante: Personalizar el mensaje para mostrar los valores reales de configuración
      // Personalizar el mensaje para mostrar la configuración actual en lugar de valores predeterminados
      const message = `Realizando scroll para cargar todos los resultados (${this.scrollCount}/${this.maxScrolls})...`;
      
      console.log('GroupFinder: ' + message + ' - Esperando ' + (this.scrollTimeout/1000) + 's');
      
      // Incluir información de configuración en la actualización de progreso
      const configInfo = {
        maxScrolls: this.maxScrolls,
        scrollDelay: this.scrollTimeout/1000
      };
      
      this.progressCallback({
        type: 'progress',
        value: progress,
        message: message,
        groupsFound: this.groups.length,
        config: configInfo
      });
      
      // También enviar un evento personalizado para actualizar el estado en la ventana principal
      try {
        window.dispatchEvent(new CustomEvent('LEAD_MANAGER_STATUS_UPDATE', {
          detail: {
            message: message,
            progress: progress,
            config: configInfo
          }
        }));
      } catch (e) {
        console.warn('Error al enviar evento de actualización:', e);
      }
      
      // Actualizar el texto de log con la configuración correcta
      this.addLogMessage(`[${scrollTime}] Realizando scroll para cargar todos los resultados (${this.scrollCount}/${this.maxScrolls})...`);
    }
    
    // Marcar el tiempo de inicio antes de programar el siguiente scroll
    const beforeTimeout = Date.now();
    
    // Usar un enfoque más preciso para medir el tiempo entre scrolls
    setTimeout(() => {
      // Calcular cuánto tiempo pasó realmente
      const actualDelay = Date.now() - beforeTimeout;
      console.log(`GroupFinder: Delay real entre scrolls: ${actualDelay}ms (configurado: ${this.scrollTimeout}ms)`);
      this.scrollAndCollect();
    }, this.scrollTimeout);
  }
  
  // Función auxiliar para añadir mensajes de log
  addLogMessage(message) {
    try {
      // Enviar al sidebar a través de la ventana padre
      window.parent.postMessage({
        action: 'log_message',
        message: message
      }, '*');
      
      // También intentar encontrar el contenedor de log en el DOM
      const logContainer = document.querySelector('#scroll-log-container');
      if (logContainer) {
        const logEntry = document.createElement('div');
        logEntry.className = 'scroll-log-entry';
        logEntry.innerHTML = message;
        logContainer.appendChild(logEntry);
        // Mantener scroll al final
        logContainer.scrollTop = logContainer.scrollHeight;
      }
      
      // También enviar al log local
      console.log(message);
    } catch (e) {
      console.warn('Error al añadir mensaje al log:', e);
    }
  }

  // Recolectar grupos visibles en la página
  collectVisibleGroups() {
    // Intentar seleccionar los elementos de grupos con diferentes selectores
    // Facebook puede cambiar su estructura DOM, por lo que probamos varios selectores
    const selectors = [
      'div[role="article"]',
      'div[data-testid="group-card"]',
      'div.x1yztbdb:not(.xh8yej3)', // Selector específico para tarjetas de grupos
      'a[href*="/groups/"][role="link"]', // Enlaces a grupos
      'div.x78zum5' // Otro selector para contenedores de grupos
    ];
    
    let groupElements = [];
    
    // Probar cada selector hasta encontrar elementos
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements && elements.length > 0) {
        console.log(`GroupFinder: Encontrados ${elements.length} elementos con selector: ${selector}`);
        groupElements = Array.from(elements);
        break;
      }
    }
    
    // Si no se encontraron elementos, intentar buscar en contenedores generales
    if (groupElements.length === 0) {
      console.log('GroupFinder: Intentando buscar grupos con un método alternativo');
      
      // Buscar enlaces a grupos dentro de cualquier elemento
      const groupLinks = document.querySelectorAll('a[href*="/groups/"]');
      
      if (groupLinks.length > 0) {
        console.log(`GroupFinder: Encontrados ${groupLinks.length} enlaces a grupos`);
        
        // Convertir los enlaces a elementos "padres" que puedan contener la información del grupo
        groupElements = Array.from(groupLinks).map(link => {
          // Buscar un contenedor padre que pueda tener la información del grupo
          let parent = link.parentElement;
          for (let i = 0; i < 5; i++) {
            if (parent && parent.offsetHeight > 100) return parent;
            parent = parent.parentElement;
          }
          return link;
        });
        
        // Eliminar duplicados
        groupElements = [...new Set(groupElements)];
      }
    }
    
    console.log(`GroupFinder: Procesando ${groupElements.length} elementos de grupo`);
    
    groupElements.forEach(groupElement => {
      try {
        // Extraer ID del grupo
        const groupId = this.extractGroupId(groupElement);
        
        // Evitar duplicados
        if (!groupId || this.groups.some(g => g.id === groupId)) return;
        
        // Extraer información del grupo
        const groupInfo = {
          id: groupId,
          name: this.extractGroupName(groupElement),
          url: this.extractGroupUrl(groupElement),
          type: this.extractGroupType(groupElement),
          members: this.extractMemberCount(groupElement),
          postsYear: this.extractPostCount(groupElement, 'year'),
          postsMonth: this.extractPostCount(groupElement, 'month'),
          postsDay: this.extractPostCount(groupElement, 'day'),
          dateFound: new Date().toISOString()
        };
        
        console.log('GroupFinder: Información extraída del grupo:', groupInfo);
        
        // Aplicar filtros
        if (this.shouldIncludeGroup(groupInfo)) {
          this.groups.push(groupInfo);
          
          // Informar del nuevo grupo encontrado
          if (this.progressCallback) {
            this.progressCallback({
              type: 'newGroup',
              group: groupInfo,
              groupsFound: this.groups.length
            });
          }
          
          console.log('GroupFinder: Nuevo grupo encontrado:', groupInfo);
        } else {
          console.log('GroupFinder: Grupo no cumple con los filtros:', groupInfo);
        }
      } catch (error) {
        console.error('GroupFinder: Error al procesar grupo:', error);
      }
    });
    
    // Si no encontramos grupos, hay que navegar a la página de búsqueda de grupos
    if (this.groups.length === 0 && this.scrollCount > 3) {
      const currentUrl = window.location.href;
      if (!currentUrl.includes('/groups/feed/')) {
        console.log('GroupFinder: No se encontraron grupos, intentando navegar a la página principal de grupos');
        window.location.href = 'https://www.facebook.com/groups/feed/';
        return;
      }
    }
  }

  // Determinar si un grupo debe ser incluido según los filtros
  shouldIncludeGroup(groupInfo) {
    // Si no hay opciones definidas, incluir todos los grupos
    if (!this.options) return true;
    
    console.log('Evaluando grupo contra filtros:', {
      grupo: groupInfo,
      opciones: this.options
    });
    
    // Verificar tipo de grupo
    const isPublic = groupInfo.type === 'public';
    const isPrivate = groupInfo.type === 'private';
    
    // Check de tipo de grupo (público o privado)
    const publicGroups = this.options.publicGroups === true || this.options.groupPublic === true;
    const privateGroups = this.options.privateGroups === true || this.options.groupPrivate === true;
    
    if ((isPublic && !publicGroups) || (isPrivate && !privateGroups)) {
      console.log('Grupo rechazado por tipo:', isPublic ? 'público' : 'privado');
      return false;
    }
    
    // 1. Verificar mínimo de usuarios - SIEMPRE DEBE CUMPLIRSE
    const minUsers = parseInt(this.options.minUsers) || 0;
    if (groupInfo.members < minUsers) {
      console.log('Grupo rechazado por mínimo de usuarios:', {
        miembros: groupInfo.members,
        mínimo: minUsers
      });
      return false;
    }
    
    // 2. Verificar publicaciones (debe cumplir AL MENOS UNO de los criterios)
    const minPostsYear = this.options.minPostsYear !== '' ? parseInt(this.options.minPostsYear) || 0 : null;
    const minPostsMonth = this.options.minPostsMonth !== '' ? parseInt(this.options.minPostsMonth) || 0 : null;
    const minPostsDay = this.options.minPostsDay !== '' ? parseInt(this.options.minPostsDay) || 0 : null;
    
    console.log('Criterios de publicaciones:', {
      año: minPostsYear,
      mes: minPostsMonth,
      día: minPostsDay
    });
    
    // Verificar si los criterios están vacíos o no definidos
    const yearEmpty = minPostsYear === null || minPostsYear === undefined;
    const monthEmpty = minPostsMonth === null || minPostsMonth === undefined;
    const dayEmpty = minPostsDay === null || minPostsDay === undefined;
    
    // Si todos los criterios están vacíos, se cumple automáticamente (no hay mínimos definidos)
    if (yearEmpty && monthEmpty && dayEmpty) {
      console.log('Todos los criterios de publicaciones están vacíos, grupo aceptado');
      return true;
    }
    
    // Verificar cada criterio individualmente
    let yearCriteriaMet = yearEmpty || (groupInfo.postsYear >= minPostsYear);
    let monthCriteriaMet = monthEmpty || (groupInfo.postsMonth >= minPostsMonth);
    let dayCriteriaMet = dayEmpty || (groupInfo.postsDay >= minPostsDay);
    
    console.log('Evaluación de criterios:', {
      añoCumple: yearCriteriaMet,
      mesCumple: monthCriteriaMet,
      díaCumple: dayCriteriaMet,
      postsYear: groupInfo.postsYear,
      postsMonth: groupInfo.postsMonth,
      postsDay: groupInfo.postsDay
    });
    
    // Debe cumplir con al menos uno de los criterios de publicaciones que estén definidos
    const meetsPostCriteria = yearCriteriaMet || monthCriteriaMet || dayCriteriaMet;
    
    if (!meetsPostCriteria) {
      console.log('Grupo rechazado por no cumplir ningún criterio de publicaciones');
    } else {
      console.log('Grupo aceptado por cumplir al menos uno de los criterios de publicaciones');
    }
    
    return meetsPostCriteria;
  }

  // Finalizar la búsqueda
  finishSearch() {
    this.isSearching = false;
    
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    if (this.progressCallback) {
      this.progressCallback({
        type: 'complete',
        groupsFound: this.groups.length,
        message: `Búsqueda finalizada. Se encontraron ${this.groups.length} grupos.`
      });
    }
    
    console.log('GroupFinder: Búsqueda finalizada. Grupos encontrados:', this.groups.length);
    
    // Guardar resultados en localStorage
    try {
      // Guardar los grupos encontrados
      localStorage.setItem('foundGroups', JSON.stringify(this.groups));
      
      // Guardar estadísticas de la búsqueda para reportes futuros
      const searchStats = {
        timestamp: new Date().toISOString(),
        totalGroups: this.groups.length,
        searchCriteria: {
          publicGroups: this.options.publicGroups,
          privateGroups: this.options.privateGroups,
          minUsers: this.options.minUsers,
          minPostsYear: this.options.minPostsYear,
          minPostsMonth: this.options.minPostsMonth,
          minPostsDay: this.options.minPostsDay
        },
        scrollCount: this.scrollCount
      };
      
      // Guardar las estadísticas más recientes
      localStorage.setItem('snap_lead_manager_last_search_stats', JSON.stringify(searchStats));
      
      // Guardar en el historial de búsquedas (máximo 10 entradas)
      try {
        const searchHistoryStr = localStorage.getItem('snap_lead_manager_search_history') || '[]';
        let searchHistory = JSON.parse(searchHistoryStr);
        
        // Añadir la nueva búsqueda al principio
        searchHistory.unshift(searchStats);
        
        // Limitar a 10 entradas
        if (searchHistory.length > 10) {
          searchHistory = searchHistory.slice(0, 10);
        }
        
        localStorage.setItem('snap_lead_manager_search_history', JSON.stringify(searchHistory));
      } catch (historyError) {
        console.error('GroupFinder: Error al actualizar historial de búsquedas:', historyError);
      }
    } catch (e) {
      console.error('GroupFinder: Error al guardar grupos en localStorage:', e);
    }
    
    return this.groups;
  }

  // Extraer ID del grupo del elemento DOM
  extractGroupId(element) {
    // Intentar extraer ID del grupo de un enlace
    const link = element.querySelector('a[href*="/groups/"]');
    if (link) {
      const url = link.getAttribute('href');
      const match = url.match(/groups\/([^/?]+)/);
      return match ? match[1] : null;
    }
    return null;
  }

  // Extraer nombre del grupo
  extractGroupName(element) {
    // Buscar nombre del grupo (ajustar según estructura de Facebook)
    const nameElement = element.querySelector('a[href*="/groups/"]');
    if (nameElement) {
      const nameText = nameElement.textContent.trim();
      if (nameText) return nameText;
    }
    
    // Alternativa para encontrar el nombre
    const headingElement = element.querySelector('h2, h3, h4');
    return headingElement ? headingElement.textContent.trim() : 'Grupo sin nombre';
  }

  // Extraer URL del grupo
  extractGroupUrl(element) {
    const link = element.querySelector('a[href*="/groups/"]');
    if (link) {
      const href = link.getAttribute('href');
      // Asegurar que la URL sea absoluta
      if (href.startsWith('http')) {
        return href;
      } else {
        return `https://www.facebook.com${href.startsWith('/') ? '' : '/'}${href}`;
      }
    }
    return '#';
  }

  // Extraer tipo de grupo (público/privado)
  extractGroupType(element) {
    // Buscar indicador de privacidad (ajustar según estructura)
    const privacyTexts = ['privado', 'private', 'cerrado', 'closed'];
    const allText = element.textContent.toLowerCase();
    
    for (const text of privacyTexts) {
      if (allText.includes(text)) {
        return 'private';
      }
    }
    
    return 'public'; // Por defecto asumimos público
  }

  // Extraer número de miembros
  extractMemberCount(element) {
    // Buscar texto con número de miembros (ajustar según estructura)
    // Ejemplos: "10K miembros", "1.5M members", etc.
    const allText = element.textContent;
    const memberTexts = ['miembros', 'members', 'integrantes'];
    
    for (const memberText of memberTexts) {
      const regex = new RegExp(`([\\d,.]+[KkMm]?)\\s+${memberText}`, 'i');
      const match = allText.match(regex);
      if (match && match[1]) {
        return this.parseNumericString(match[1]);
      }
    }
    
    return 0;
  }

  // Extraer conteo de publicaciones según período
  // Nota: Facebook no muestra esta info directamente, usamos estimaciones
  extractPostCount(element, period) {
    // Esta es una implementación aproximada, podría necesitar ajustes
    // Intentar extraer texto sobre actividad
    const allText = element.textContent.toLowerCase();
    
    // Patrones comunes de actividad
    if (period === 'day') {
      if (allText.includes('varias publicaciones al día')) return 5;
      if (allText.includes('publicaciones diarias')) return 3;
      if (allText.includes('active today')) return 1;
    } else if (period === 'month') {
      if (allText.includes('muy activo')) return 30;
      if (allText.includes('activo')) return 15;
    } else if (period === 'year') {
      if (allText.includes('comunidad activa')) return 300;
    }
    
    // Valores por defecto basados en el número de miembros
    const memberCount = this.extractMemberCount(element);
    
    if (period === 'day') {
      return Math.floor(memberCount / 1000) + 1; // Estimación básica
    } else if (period === 'month') {
      return Math.floor(memberCount / 100) + 10;
    } else if (period === 'year') {
      return Math.floor(memberCount / 10) + 100;
    }
    
    return 0;
  }

  // Convertir strings con formato a números (ej: "1.2K" → 1200)
  parseNumericString(text) {
    if (!text) return 0;
    
    text = text.replace(/,/g, '');
    const numericMatch = text.match(/[\d.]+/);
    if (!numericMatch) return 0;
    
    let value = parseFloat(numericMatch[0]);
    
    if (text.match(/[kK]/)) {
      value *= 1000;
    } else if (text.match(/[mM]/)) {
      value *= 1000000;
    }
    
    return Math.floor(value);
  }

  // Método para exportar los resultados
  exportResults(format = 'json') {
    if (this.groups.length === 0) {
      console.warn('GroupFinder: No hay grupos para exportar');
      return null;
    }
    
    if (format === 'json') {
      const dataStr = JSON.stringify(this.groups, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      return URL.createObjectURL(dataBlob);
    } else if (format === 'csv') {
      // Crear cabeceras CSV
      const headers = ['id', 'name', 'url', 'type', 'members', 'postsYear', 'postsMonth', 'postsDay', 'dateFound'];
      
      // Crear filas
      const rows = [
        headers.join(','),
        ...this.groups.map(group => {
          return headers.map(field => {
            let value = group[field] || '';
            // Escapar comillas y agregar comillas si hay comas
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              value = `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',');
        })
      ];
      
      const csvContent = rows.join('\n');
      const dataBlob = new Blob([csvContent], { type: 'text/csv' });
      return URL.createObjectURL(dataBlob);
    }
    
    return null;
  }
}

// Exportar la clase
window.leadManagerPro = window.leadManagerPro || {};
window.leadManagerPro.groupFinder = new GroupFinder();
