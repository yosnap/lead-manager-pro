// Módulo para la búsqueda y extracción de grupos de Facebook
// Este módulo implementa la funcionalidad para buscar grupos basados en criterios
// como tipo de grupo (público/privado), cantidad mínima de miembros y actividad mínima

class GroupFinder {
  constructor() {
    this.options = null;
    this.groups = [];
    this.scrollCount = 0;
    this.maxScrolls = 50;
    this.scrollTimeout = 2000;
    this.observer = null;
    this.progressCallback = null;
    this._scrollTimeout = null;
    this.noChangeCount = 0;
    this.authenticationRequired = true; // Marcar como requiere autenticación
  }

  // Verificar autenticación antes de ejecutar métodos críticos
  checkAuthentication() {
    if (!this.authenticationRequired) return true;
    
    const authWrapper = window.LeadManagerPro?.AuthenticationWrapper;
    if (authWrapper && !authWrapper.canModuleExecute('groupFinder')) {
      authWrapper.showAuthRequiredMessage('groupFinder', 'search');
      return false;
    }
    
    return true;
  }

  // Inicializar con opciones
  async init(options, progressCallback = null) {
    // Verificar autenticación
    if (!this.checkAuthentication()) {
      console.log('GroupFinder: Inicialización bloqueada - autenticación requerida');
      return Promise.reject(new Error('Autenticación requerida'));
    }

    // Leer SIEMPRE la configuración más reciente antes de iniciar
    const config = await new Promise((resolve) => {
      chrome.storage.sync.get(['groupSearchSettings'], (result) => {
        resolve(result.groupSearchSettings || {});
      });
    });

    // Mezclar opciones recibidas con las de storage
    this.options = { ...config, ...options };
    this.progressCallback = (typeof progressCallback === 'function') ? progressCallback : null;

    // Reiniciar estado global
    window.LeadManagerPro.state.resetSearchState();
    window.LeadManagerPro.state.updateSearchState({
      searchType: 'groups',
      currentOperation: 'Inicializando búsqueda de grupos...'
    });

    this.groups = [];
    this.scrollCount = 0;

    // Establecer valores de scroll
    this.maxScrolls = this.options.maxScrolls ? Number(this.options.maxScrolls) : 4;
    this.scrollTimeout = this.options.scrollDelay ? Number(this.options.scrollDelay) * 1000 : 2000;

    console.log('GroupFinder: Configuración final:', {
      scroll: {
        maxScrolls: this.maxScrolls,
        scrollTimeout: this.scrollTimeout
      },
      grupos: this.options
    });

    return this;
  }

  // Iniciar la búsqueda de grupos
  async startSearch() {
    // Verificar autenticación
    if (!this.checkAuthentication()) {
      console.log('GroupFinder: Búsqueda bloqueada - autenticación requerida');
      return Promise.reject(new Error('Autenticación requerida'));
    }
    try {
      console.log('GroupFinder: Iniciando búsqueda');

      // --- Sincronizar el switch de "Grupos públicos" en el DOM de Facebook ---
      function sincronizarSwitchGruposPublicos(onlyPublic) {
        const switchInput = document.querySelector('input[aria-label="Grupos públicos"][role="switch"]');
        if (switchInput) {
          if (onlyPublic && !switchInput.checked) {
            switchInput.click();
          } else if (!onlyPublic && switchInput.checked) {
            switchInput.click();
          }
        }
      }
      sincronizarSwitchGruposPublicos(this.options.onlyPublicGroups === true);
      // --- Fin sincronización switch ---

      // Resetear estado
      this.scrollCount = 0;
      this.noChangeCount = 0;
      this.groups = [];
      // Actualizar estado global
      window.LeadManagerPro.state.updateSearchState({
        isSearching: true,
        searchType: 'groups',
        currentOperation: 'Iniciando búsqueda de grupos...',
        progress: 0,
        foundGroups: [],
        errors: []
      });
      // Configurar observer
      this.setupObserver();
      // Iniciar scroll
      this.scrollAndCollect();
    } catch (error) {
      console.error('GroupFinder: Error al iniciar búsqueda:', error);
      window.LeadManagerPro.state.updateSearchState({
        errors: [error.message],
        isSearching: false
      });
    }
  }

  // Detener la búsqueda
  stopSearch() {
    console.log('GroupFinder: Deteniendo búsqueda manualmente');
    
    window.LeadManagerPro.state.updateSearchState({
      isSearching: false,
      currentOperation: 'Búsqueda detenida manualmente'
    });

    this.finishSearch();
  }

  // Configurar MutationObserver para detectar nuevos grupos cargados en la página
  setupObserver() {
    if (this.observer) {
      this.observer.disconnect();
    }

    // Crear nuevo observador
    this.observer = new MutationObserver((mutations) => {
      if (!window.LeadManagerPro.state.searchState.isSearching) return;
      
      this.collectVisibleGroups();
    });

    // Configurar observador
    const config = { childList: true, subtree: true };
    this.observer.observe(document.body, config);
  }

  // Realizar scroll y recolectar grupos
  async scrollAndCollect() {
    try {
      if (!window.LeadManagerPro.state.searchState.isSearching) {
        console.log('GroupFinder: Búsqueda detenida');
        return this.finishSearch();
      }
      // --- Control de pausa y detener ---
      if (window.LeadManagerPro.state.searchState.stopSearch) {
        console.log('GroupFinder: Búsqueda detenida por el usuario');
        return this.finishSearch();
      }
      if (window.LeadManagerPro.state.searchState.pauseSearch) {
        console.log('GroupFinder: Búsqueda pausada por el usuario');
        await new Promise(resolve => {
          const interval = setInterval(() => {
            if (!window.LeadManagerPro.state.searchState.pauseSearch || window.LeadManagerPro.state.searchState.stopSearch) {
              clearInterval(interval);
              resolve();
            }
          }, 500);
        });
        if (window.LeadManagerPro.state.searchState.stopSearch) {
          return this.finishSearch();
        }
      }
      // --- Fin control pausa/detener ---

      // Actualizar progreso
      const progress = Math.min(
        ((this.scrollCount + 1) / this.maxScrolls) * 100,
        99
      );

      window.LeadManagerPro.state.updateSearchState({
        progress,
        currentOperation: `Scrolling... (${this.scrollCount + 1}/${this.maxScrolls})`
      });

      // Realizar scroll
      const currentHeight = document.documentElement.scrollHeight;
      window.scrollTo(0, currentHeight);

      // Esperar a que se cargue nuevo contenido
      await new Promise(resolve => setTimeout(resolve, this.scrollTimeout));

      // Verificar si hay nuevo contenido
      const newHeight = document.documentElement.scrollHeight;
      if (newHeight === currentHeight) {
        this.noChangeCount++;
        
        if (this.noChangeCount >= 3) {
          console.log('GroupFinder: No hay más contenido nuevo');
          return this.finishSearch();
        }
      } else {
        this.noChangeCount = 0;
      }

      // Incrementar contador y continuar si no hemos alcanzado el máximo
      this.scrollCount++;
      
      if (this.scrollCount >= this.maxScrolls) {
        console.log('GroupFinder: Alcanzado máximo número de scrolls');
        return this.finishSearch();
      }

      // Programar siguiente scroll
      this._scrollTimeout = setTimeout(() => this.scrollAndCollect(), this.scrollTimeout);

    } catch (error) {
      console.error('GroupFinder: Error durante scroll:', error);
      window.LeadManagerPro.state.updateSearchState({
        errors: [...window.LeadManagerPro.state.searchState.errors, error.message]
      });
      return this.finishSearch();
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
    try {
      if (!window.LeadManagerPro.state.searchState.isSearching) {
        return;
      }

      const groupElements = document.querySelectorAll('[role="article"]');
      const newGroups = Array.from(groupElements)
        .map(element => {
          try {
            return this.extractGroupData(element);
          } catch (error) {
            console.warn('GroupFinder: Error al extraer datos de grupo:', error);
            return null;
          }
        })
        .filter(Boolean);

      // Actualizar grupos encontrados
      const uniqueGroups = [...new Set([...this.groups, ...newGroups])];
      this.groups = uniqueGroups;

      // Notificar progreso
      window.LeadManagerPro.state.updateSearchState({
        foundGroups: uniqueGroups,
        currentOperation: `Encontrados ${uniqueGroups.length} grupos hasta ahora...`
      });

    } catch (error) {
      console.error('GroupFinder: Error al recolectar grupos:', error);
      window.LeadManagerPro.state.updateSearchState({
        errors: [...window.LeadManagerPro.state.searchState.errors, error.message]
      });
    }
  }

  // Determinar si un grupo debe ser incluido según los filtros
  shouldIncludeGroup(groupInfo) {
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
    try {
      console.log('GroupFinder: Finalizando búsqueda');

      // Limpiar timeouts y observer
      if (this._scrollTimeout) {
        clearTimeout(this._scrollTimeout);
        this._scrollTimeout = null;
      }

      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }

      // Actualizar estado final
      const finalGroups = this.groups.filter(Boolean);
      window.LeadManagerPro.state.updateSearchState({
        isSearching: false,
        progress: 100,
        currentOperation: 'Búsqueda completada',
        foundGroups: finalGroups
      });

      // Notificar resultados
      window.LeadManagerPro.state.notifyResults(
        finalGroups,
        `Se encontraron ${finalGroups.length} grupos.`,
        'success'
      );

      return finalGroups;
    } catch (error) {
      console.error('GroupFinder: Error al finalizar búsqueda:', error);
      window.LeadManagerPro.state.updateSearchState({
        isSearching: false,
        errors: [...window.LeadManagerPro.state.searchState.errors, error.message],
        currentOperation: 'Error al finalizar búsqueda'
      });

      window.LeadManagerPro.state.notifyResults(
        [],
        `Error: ${error.message}`,
        'error'
      );

      return [];
    }
  }

  extractGroupData(element) {
    try {
      const linkElement = element.querySelector('a[href*="/groups/"]');
      if (!linkElement) return null;

      const url = linkElement.href;
      if (!url || !url.includes('/groups/')) return null;

      const name = linkElement.textContent.trim();
      if (!name) return null;

      const membersText = element.textContent.match(/(\d+(?:,\d+)*)\s*miembros?/i);
      const members = membersText ? parseInt(membersText[1].replace(/,/g, '')) : 0;

      const descElement = element.querySelector('span[dir="auto"]');
      const description = descElement ? descElement.textContent.trim() : '';

      const timestamp = new Date().toISOString();

      return {
        name,
        url,
        members,
        description,
        timestamp,
        source: 'facebook-search'
      };
    } catch (error) {
      console.error('Error extrayendo datos del grupo:', error);
      return null;
    }
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

  async searchGroups() {
    try {
      // Inicializar búsqueda
      this.setupObserver();
      this.groups = [];
      this.scrollCount = 0;

      // Actualizar estado inicial
      window.LeadManagerPro.state.updateSearchState({
        isSearching: true,
        currentOperation: 'Iniciando búsqueda de grupos...',
        currentPage: 1,
        totalPages: 1,
        foundProfiles: []
      });

      // Comenzar el proceso de scroll
      await new Promise((resolve) => {
        this.scrollAndCollect();
        
        // Verificar periódicamente si la búsqueda ha terminado
        const checkInterval = setInterval(() => {
          if (!this.state.isSearching) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 1000);
      });

      // Notificar resultados finales
      const results = this.groups;
      window.LeadManagerPro.state.notifyResults(
        results,
        `Búsqueda completada. Se encontraron ${results.length} grupos.`
      );

      return results;
    } catch (error) {
      console.error('Error en searchGroups:', error);
      throw error;
    }
  }
}

// Exportar la clase
window.leadManagerPro = window.leadManagerPro || {};
window.leadManagerPro.groupFinder = new GroupFinder();
