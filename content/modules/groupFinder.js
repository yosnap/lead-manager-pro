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
    this._scrollTimeout = null;
  }

  // Inicializar con opciones
  init(options, progressCallback = null) {
    console.log("INITIALIZING GROUP FINDER SCROLL OPTIONS");
    
    this.options = options || {};
    this.progressCallback = (typeof progressCallback === 'function') ? progressCallback : null;
    
    // Leer configuración desde chrome.storage.local
    return new Promise((resolve) => {
      chrome.storage.local.get([
        'maxScrolls',
        'scrollDelay',
        'groupPublic',
        'groupPrivate',
        'minUsers',
        'minPostsYear',
        'minPostsMonth',
        'minPostsDay'
      ], (result) => {
        console.log('GroupFinder: Leyendo opciones desde chrome.storage.local:', result);
        
        // Establecer valores de scroll
        this.maxScrolls = result.maxScrolls ? Number(result.maxScrolls) : 4; // Default a 4
        this.scrollTimeout = result.scrollDelay ? Number(result.scrollDelay) * 1000 : 2000;
        
        console.log('GroupFinder: Configuración de scroll establecida:', {
          maxScrolls: this.maxScrolls,
          scrollTimeout: this.scrollTimeout
        });
        
        // Opciones de grupos
        this.options.publicGroups = result.groupPublic !== undefined ? result.groupPublic : true;
        this.options.privateGroups = result.groupPrivate !== undefined ? result.groupPrivate : true;
        this.options.minUsers = result.minUsers ? parseInt(result.minUsers) : 0;
        this.options.minPostsYear = result.minPostsYear || '';
        this.options.minPostsMonth = result.minPostsMonth || '';
        this.options.minPostsDay = result.minPostsDay || '';
        
        console.log('GroupFinder: Configuración final:', {
          scroll: {
            maxScrolls: this.maxScrolls,
            scrollTimeout: this.scrollTimeout
          },
          grupos: this.options
        });
        
        resolve(this);
      });
    });
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
    console.log('GroupFinder: Deteniendo búsqueda manualmente');
    this.isSearching = false;
    
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    // Detener cualquier scroll programado
    if (this._scrollTimeout) {
      clearTimeout(this._scrollTimeout);
      this._scrollTimeout = null;
    }
    
    // Llamar a finishSearch para asegurar limpieza completa
    this.finishSearch();
    
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
    // Verificación inmediata del estado
    if (!this.isSearching) {
      console.log('GroupFinder: Búsqueda no está activa');
      this.finishSearch();
      return;
    }

    if (this.scrollCount >= this.maxScrolls) {
      console.log(`GroupFinder: Alcanzado máximo de scrolls (${this.maxScrolls})`);
      this.finishSearch();
      return;
    }

    const heightBeforeScroll = document.documentElement.scrollHeight;
    const groupsBeforeScroll = this.groups.length;
    
    this.collectVisibleGroups();
    
    const groupsAfterScroll = this.groups.length;

    // Verificar si se encontraron nuevos grupos
    if (this.scrollCount > 3 && groupsBeforeScroll === groupsAfterScroll) {
      console.log('GroupFinder: No se encontraron nuevos grupos después de 3 scrolls');
      this.finishSearch();
      return;
    }

    // Solo continuar si la búsqueda sigue activa
    if (this.isSearching) {
      window.scrollTo(0, document.body.scrollHeight);
      this.scrollCount++;
      
      // Informar del progreso
      if (this.progressCallback) {
        const progress = Math.round((this.scrollCount / this.maxScrolls) * 100);
        this.progressCallback({
          type: 'progress',
          value: progress,
          message: `Realizando scroll (${this.scrollCount}/${this.maxScrolls})...`,
          groupsFound: this.groups.length,
          maxScrolls: this.maxScrolls
        });
      }

      // Verificar altura después del scroll
      this._scrollTimeout = setTimeout(() => {
        if (!this.isSearching) {
          this.finishSearch();
          return;
        }

        const heightAfterScroll = document.documentElement.scrollHeight;
        if (heightBeforeScroll === heightAfterScroll && this.scrollCount > 3) {
          console.log('GroupFinder: No hay más contenido para cargar');
          this.finishSearch();
          return;
        }
        
        // Programar siguiente scroll solo si no hemos alcanzado el máximo
        if (this.scrollCount < this.maxScrolls && this.isSearching) {
          this._scrollTimeout = setTimeout(() => {
            if (this.isSearching) {
              this.scrollAndCollect();
            } else {
              this.finishSearch();
            }
          }, this.scrollTimeout);
        } else {
          this.finishSearch();
        }
      }, 1000);
    }
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
    if (!this.isSearching) return;

    const selectors = [
      'div[role="article"]',
      'div[data-testid="group-card"]',
      'div.x1yztbdb:not(.xh8yej3)',
      'a[href*="/groups/"][role="link"]',
      'div.x78zum5'
    ];
    
    let groupElements = [];
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements && elements.length > 0) {
        groupElements = Array.from(elements);
        break;
      }
    }
    
    if (groupElements.length === 0 && this.isSearching) {
      const groupLinks = document.querySelectorAll('a[href*="/groups/"]');
      
      if (groupLinks.length > 0) {
        groupElements = Array.from(groupLinks).map(link => {
          let parent = link.parentElement;
          for (let i = 0; i < 5; i++) {
            if (parent && parent.offsetHeight > 100) return parent;
            parent = parent.parentElement;
          }
          return link;
        });
        
        groupElements = [...new Set(groupElements)];
      }
    }
    
    if (!this.isSearching) return;
    
    groupElements.forEach(groupElement => {
      if (!this.isSearching) return;
      
      try {
        const groupId = this.extractGroupId(groupElement);
        if (!groupId || this.groups.some(g => g.id === groupId)) return;
        
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
        
        if (this.shouldIncludeGroup(groupInfo)) {
          this.groups.push(groupInfo);
          
          if (this.progressCallback && this.isSearching) {
            this.progressCallback({
              type: 'newGroup',
              group: groupInfo,
              groupsFound: this.groups.length,
              maxScrolls: this.maxScrolls
            });
          }
        }
      } catch (error) {
        console.error('GroupFinder: Error al procesar grupo:', error);
      }
    });
    
    // Si no hay grupos después de varios intentos, finalizar
    if (this.groups.length === 0 && this.scrollCount > 3) {
      console.log('GroupFinder: No se encontraron grupos después de varios intentos');
      this.finishSearch();
    }
  }

  // Determinar si un grupo debe ser incluido según los filtros
  shouldIncludeGroup(groupInfo) {
    // Verificar tipo de grupo
    if (!this.options.publicGroups && groupInfo.type === 'public') return false;
    if (!this.options.privateGroups && groupInfo.type === 'private') return false;

    // Verificar cantidad mínima de usuarios
    const minUsers = parseInt(this.options.minUsers, 10);
    if (!isNaN(minUsers) && minUsers > 0) {
      // Convertir el string de miembros a número (ej: "1,2k miembros" -> 1200)
      const memberText = typeof groupInfo.members === 'string' ? groupInfo.members : String(groupInfo.members);
      const memberCount = this.parseNumericString(memberText);
      
      console.log('Verificando miembros del grupo:', {
        nombre: groupInfo.name,
        textoMiembros: memberText,
        cantidadCalculada: memberCount,
        minimoRequerido: minUsers,
        cumpleCriterio: memberCount >= minUsers
      });

      if (memberCount < minUsers) {
        console.log('Grupo rechazado por usuarios:', {
          grupo: groupInfo.name,
          miembros: memberCount,
          minimo: minUsers
        });
        return false;
      }
    }

    // Verificar criterios de publicaciones (al menos uno debe cumplirse)
    const hasPostsCriteria = 
      this.options.minPostsYear !== '' || 
      this.options.minPostsMonth !== '' || 
      this.options.minPostsDay !== '';

    if (hasPostsCriteria) {
      const postsYear = parseInt(groupInfo.postsYear) || 0;
      const postsMonth = parseInt(groupInfo.postsMonth) || 0;
      const postsDay = parseInt(groupInfo.postsDay) || 0;

      // Si hay criterios de publicaciones, al menos uno debe cumplirse
      const yearCriteria = this.options.minPostsYear !== '' ? postsYear >= parseInt(this.options.minPostsYear) : false;
      const monthCriteria = this.options.minPostsMonth !== '' ? postsMonth >= parseInt(this.options.minPostsMonth) : false;
      const dayCriteria = this.options.minPostsDay !== '' ? postsDay >= parseInt(this.options.minPostsDay) : false;

      if (!(yearCriteria || monthCriteria || dayCriteria)) {
        console.log('Grupo rechazado por publicaciones:', {
          grupo: groupInfo.name,
          año: postsYear,
          mes: postsMonth,
          día: postsDay,
          criterios: {
            año: this.options.minPostsYear,
            mes: this.options.minPostsMonth,
            día: this.options.minPostsDay
          }
        });
        return false;
      }
    }

    // Si llegamos aquí, el grupo cumple todos los criterios
    console.log('Grupo aceptado:', {
      nombre: groupInfo.name,
      miembros: groupInfo.members,
      tipo: groupInfo.type,
      publicacionesAño: groupInfo.postsYear,
      publicacionesMes: groupInfo.postsMonth,
      publicacionesDia: groupInfo.postsDay
    });

    return true;
  }

  // Finalizar la búsqueda
  finishSearch() {
    console.log('GroupFinder: Finalizando búsqueda');
    
    // Asegurar que la búsqueda se detenga
    this.isSearching = false;
    
    // Limpiar observer
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    // Detener cualquier scroll programado
    if (this._scrollTimeout) {
      clearTimeout(this._scrollTimeout);
      this._scrollTimeout = null;
    }
    
    // Volver al inicio de la página
    window.scrollTo(0, 0);
    
    // Remover cualquier event listener que pudiera causar navegación
    document.querySelectorAll('a[href*="/groups/"]').forEach(link => {
      link.style.pointerEvents = 'none';
      link.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }, true);
    });
    
    if (this.progressCallback) {
      this.progressCallback({
        type: 'complete',
        groupsFound: this.groups.length,
        message: `Búsqueda finalizada. Se encontraron ${this.groups.length} grupos que cumplen los criterios.`,
        maxScrolls: this.maxScrolls
      });
    }
    
    // Guardar resultados
    try {
      localStorage.setItem('foundGroups', JSON.stringify(this.groups));
      
      const searchStats = {
        timestamp: new Date().toISOString(),
        totalGroups: this.groups.length,
        searchCriteria: {
          publicGroups: this.options.publicGroups,
          privateGroups: this.options.privateGroups,
          minUsers: this.options.minUsers,
          minPostsYear: this.options.minPostsYear,
          minPostsMonth: this.options.minPostsMonth,
          minPostsDay: this.options.minPostsDay,
          maxScrolls: this.maxScrolls,
          scrollDelay: this.scrollTimeout / 1000
        },
        scrollCount: this.scrollCount
      };
      
      localStorage.setItem('snap_lead_manager_last_search_stats', JSON.stringify(searchStats));
    } catch (e) {
      console.error('GroupFinder: Error al guardar datos:', e);
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
