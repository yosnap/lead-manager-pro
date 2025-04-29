/**
 * Módulo para asegurar la disponibilidad de groupFinder
 * Este módulo se encarga de reparar o reemplazar el módulo groupFinder
 * si no está disponible o presenta errores
 */

// Namespace para la organización del código
window.LeadManagerPro = window.LeadManagerPro || {};
window.LeadManagerPro.modules = window.LeadManagerPro.modules || {};

// Función para verificar y reparar groupFinder
window.LeadManagerPro.modules.ensureGroupFinder = function() {
  console.log('GroupFinderFix: Verificando disponibilidad de groupFinder...');
  
  // Verificar si groupFinder ya está disponible
  if (window.leadManagerPro && window.leadManagerPro.groupFinder) {
    console.log('GroupFinderFix: groupFinder encontrado, verificando funcionamiento...');
    
    // Verificar si tiene los métodos necesarios
    if (typeof window.leadManagerPro.groupFinder.init === 'function' &&
        typeof window.leadManagerPro.groupFinder.startSearch === 'function') {
      
      console.log('GroupFinderFix: groupFinder parece estar funcionando correctamente');
      return true;
    } else {
      console.warn('GroupFinderFix: groupFinder no tiene todos los métodos necesarios, reparando...');
    }
  } else {
    console.warn('GroupFinderFix: groupFinder no encontrado, creando implementación de respaldo...');
  }
  
  // Crear o reparar el objeto groupFinder
  try {
    // Asegurar que el namespace está disponible
    window.leadManagerPro = window.leadManagerPro || {};
    
    // Crear una implementación básica de groupFinder si no existe
    window.leadManagerPro.groupFinder = window.leadManagerPro.groupFinder || {
      options: null,
      isSearching: false,
      groups: [],
      scrollCount: 0,
      maxScrolls: 50,
      scrollTimeout: 2000,
      observer: null,
      progressCallback: null,
      _scrollTimeout: null
    };
    
    // Implementar o reparar el método init
    if (typeof window.leadManagerPro.groupFinder.init !== 'function') {
      window.leadManagerPro.groupFinder.init = function(options, progressCallback = null) {
        console.log('GroupFinderFix: Inicializando groupFinder con opciones:', options);
        
        this.options = options || {};
        this.progressCallback = (typeof progressCallback === 'function') ? progressCallback : null;
        
        return new Promise((resolve) => {
          // Obtener configuración desde almacenamiento
          const getConfigFromStorage = () => {
            try {
              // Intentar usar chrome.storage.local
              if (chrome && chrome.storage && chrome.storage.local) {
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
                  updateConfig(result);
                  resolve(this);
                });
              } else {
                // Fallback: usar localStorage
                const result = {};
                
                // Intentar leer cada clave de localStorage
                const keys = [
                  'maxScrolls',
                  'scrollDelay',
                  'groupPublic',
                  'groupPrivate',
                  'minUsers',
                  'minPostsYear',
                  'minPostsMonth',
                  'minPostsDay'
                ];
                
                keys.forEach(key => {
                  try {
                    const value = localStorage.getItem('lmp_storage_' + key) || 
                                 localStorage.getItem('snap_lead_manager_' + key);
                    
                    if (value !== null) {
                      // Intentar parsear JSON
                      try {
                        result[key] = JSON.parse(value);
                      } catch (e) {
                        // Si no es JSON válido, usar el valor tal cual
                        result[key] = value;
                      }
                    }
                  } catch (e) {
                    console.warn('Error al leer', key, 'de localStorage:', e);
                  }
                });
                
                updateConfig(result);
                resolve(this);
              }
            } catch (error) {
              console.error('Error al obtener configuración:', error);
              // En caso de error, usar configuración por defecto
              updateConfig({});
              resolve(this);
            }
          };
          
          // Actualizar configuración con valores recuperados
          const updateConfig = (result) => {
            console.log('GroupFinderFix: Configuración obtenida:', result);
            
            // Establecer valores de scroll
            this.maxScrolls = result.maxScrolls ? Number(result.maxScrolls) : 4; // Default a 4
            this.scrollTimeout = result.scrollDelay ? Number(result.scrollDelay) * 1000 : 2000;
            
            // Opciones de grupos
            this.options.publicGroups = result.groupPublic !== undefined ? result.groupPublic : true;
            this.options.privateGroups = result.groupPrivate !== undefined ? result.groupPrivate : true;
            this.options.minUsers = result.minUsers !== undefined ? parseInt(result.minUsers) : 0;
            this.options.minPostsYear = result.minPostsYear || '';
            this.options.minPostsMonth = result.minPostsMonth || '';
            this.options.minPostsDay = result.minPostsDay || '';
            
            console.log('GroupFinderFix: Configuración final:', {
              scroll: {
                maxScrolls: this.maxScrolls,
                scrollTimeout: this.scrollTimeout
              },
              grupos: this.options
            });
          };
          
          // Iniciar proceso de obtención de configuración
          getConfigFromStorage();
        });
      };
    }
    
    // Implementar o reparar el método startSearch
    if (typeof window.leadManagerPro.groupFinder.startSearch !== 'function') {
      window.leadManagerPro.groupFinder.startSearch = function() {
        if (this.isSearching) {
          console.log('GroupFinderFix: Ya hay una búsqueda en progreso');
          return false;
        }
        
        this.isSearching = true;
        this.groups = [];
        this.scrollCount = 0;
        
        console.log('GroupFinderFix: Iniciando búsqueda de grupos');
        
        // Usar método original de setupObserver si existe, o implementar uno básico
        if (typeof this.setupObserver === 'function') {
          this.setupObserver();
        } else {
          // Implementación básica de setupObserver
          this.setupObserver = function() {
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
            // Probar varios selectores para adaptarse a diferentes versiones de Facebook
            const selectors = [
              'div[role="main"]',
              'div[role="feed"]',
              '#content_container',
              'div[data-pagelet="MainFeed"]',
              'div[id^="mount_0_0"]',
              'div[data-testid="Keycommand_wrapper"]'
            ];
            
            let targetNode = null;
            for (const selector of selectors) {
              targetNode = document.querySelector(selector);
              if (targetNode) {
                console.log(`GroupFinderFix: Encontrado contenedor con selector: ${selector}`);
                break;
              }
            }
            
            // Si todavía no encontramos un nodo, usar el body como fallback
            if (!targetNode) {
              console.warn('GroupFinderFix: No se encontró un contenedor específico, observando document.body');
              targetNode = document.body;
            }
            
            // Iniciar observación con opciones más amplias
            this.observer.observe(targetNode, { 
              childList: true, 
              subtree: true,
              attributes: true,
              characterData: false,
              attributeFilter: ['class', 'style', 'aria-hidden'] 
            });
            
            console.log('GroupFinderFix: Observador configurado correctamente');
          };
          
          // Llamar a la implementación
          this.setupObserver();
        }
        
        // Usar método original de scrollAndCollect si existe, o implementar uno básico
        if (typeof this.scrollAndCollect === 'function') {
          this.scrollAndCollect();
        } else {
          // Implementación básica de scrollAndCollect
          this.scrollAndCollect = function() {
            // Verificación inmediata del estado
            if (!this.isSearching) {
              console.log('GroupFinderFix: Búsqueda no está activa');
              this.finishSearch();
              return;
            }
            
            if (this.scrollCount >= this.maxScrolls) {
              console.log(`GroupFinderFix: Alcanzado máximo de scrolls (${this.maxScrolls})`);
              this.finishSearch();
              return;
            }
            
            this.collectVisibleGroups();
            
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
              
              // Programar siguiente scroll
              this._scrollTimeout = setTimeout(() => {
                if (this.isSearching) {
                  this.scrollAndCollect();
                } else {
                  this.finishSearch();
                }
              }, this.scrollTimeout);
            }
          };
          
          // Llamar a la implementación
          this.scrollAndCollect();
        }
        
        // Implementación básica de collectVisibleGroups si no existe
        if (typeof this.collectVisibleGroups !== 'function') {
          this.collectVisibleGroups = function() {
            if (!this.isSearching) return;
            
            console.log('GroupFinderFix: Buscando grupos visibles...');
            
            // Lista de selectores para encontrar grupos
            const selectors = [
              'div[role="article"]',
              'div[data-testid="group-card"]',
              'div.x1yztbdb:not(.xh8yej3)',
              'a[href*="/groups/"][role="link"]',
              'div.x78zum5',
              'div[data-pagelet*="GroupSearchResult"]',
              'div[data-pagelet^="GroupCard"]',
              'div[data-pagelet*="EntitySearchResult"]',
              'div.x1qjc9v5.x9f619.x78zum5.xdt5ytf.x1iyjqo2.xs83m0k.xeuugli',
              'div.x1qjc9v5.x9f619.x78zum5',
              'div[data-visualcompletion="ignore-dynamic"]',
              'div.x1iorvi4.x1pi30zi',
              'div.x1uhb9sk'
            ];
            
            let groupElements = [];
            
            // Probar cada selector
            for (const selector of selectors) {
              try {
                const elements = document.querySelectorAll(selector);
                if (elements && elements.length > 0) {
                  console.log(`GroupFinderFix: Encontrados ${elements.length} elementos con selector ${selector}`);
                  groupElements = Array.from(elements);
                  break;
                }
              } catch (error) {
                console.error(`Error al buscar con selector ${selector}:`, error);
              }
            }
            
            // Si no encontramos grupos, buscar por enlaces
            if (groupElements.length === 0 && this.isSearching) {
              console.log('GroupFinderFix: Búsqueda alternativa por enlaces');
              
              try {
                const groupLinks = document.querySelectorAll('a[href*="/groups/"]');
                
                if (groupLinks.length > 0) {
                  console.log(`GroupFinderFix: Encontrados ${groupLinks.length} enlaces a grupos`);
                  
                  // Transformar enlaces en elementos de grupo
                  const tempElements = [];
                  
                  Array.from(groupLinks).forEach(link => {
                    if (tempElements.some(el => el.contains(link) || link.contains(el))) {
                      return;
                    }
                    
                    // Buscar el contenedor padre del enlace
                    let parent = link.parentElement;
                    let found = false;
                    
                    for (let i = 0; i < 8; i++) {
                      if (!parent) break;
                      
                      if (parent.offsetHeight > 80 && 
                         (parent.offsetWidth > 300 || parent.clientWidth > 300)) {
                        tempElements.push(parent);
                        found = true;
                        break;
                      }
                      
                      parent = parent.parentElement;
                    }
                    
                    if (!found) {
                      tempElements.push(link);
                    }
                  });
                  
                  // Eliminar duplicados
                  groupElements = [...new Set(tempElements)];
                  console.log(`GroupFinderFix: Procesados ${groupElements.length} elementos únicos`);
                }
              } catch (error) {
                console.error('Error en búsqueda alternativa:', error);
              }
            }
            
            // Procesar grupos encontrados
            if (groupElements.length > 0) {
              groupElements.forEach(element => {
                // Extraer información básica del grupo
                try {
                  // Extraer ID del grupo
                  let groupId = null;
                  const link = element.querySelector('a[href*="/groups/"]');
                  if (link) {
                    const url = link.getAttribute('href');
                    const match = url.match(/groups\/([^/?]+)/);
                    groupId = match ? match[1] : null;
                  }
                  
                  // Si no hay ID o ya existe, ignorar
                  if (!groupId || this.groups.some(g => g.id === groupId)) return;
                  
                  // Extraer nombre del grupo
                  let name = '';
                  const nameElement = element.querySelector('a[href*="/groups/"]');
                  if (nameElement) {
                    name = nameElement.textContent.trim();
                  } else {
                    const headingElement = element.querySelector('h2, h3, h4');
                    name = headingElement ? headingElement.textContent.trim() : 'Grupo sin nombre';
                  }
                  
                  // Extraer URL del grupo
                  let url = '#';
                  if (link) {
                    const href = link.getAttribute('href');
                    // Asegurar que la URL sea absoluta
                    if (href.startsWith('http')) {
                      url = href;
                    } else {
                      url = `https://www.facebook.com${href.startsWith('/') ? '' : '/'}${href}`;
                    }
                  }
                  
                  // Extraer tipo de grupo (público/privado)
                  const allText = element.textContent.toLowerCase();
                  const isPrivate = allText.includes('privado') || 
                                   allText.includes('private') || 
                                   allText.includes('cerrado') || 
                                   allText.includes('closed');
                  
                  // Extraer número de miembros
                  let members = 0;
                  const memberTexts = ['miembros', 'members', 'integrantes'];
                  
                  for (const memberText of memberTexts) {
                    const regex = new RegExp(`([\\d,.]+[KkMm]?)\\s+${memberText}`, 'i');
                    const match = allText.match(regex);
                    if (match && match[1]) {
                      members = match[1];
                      break;
                    }
                  }
                  
                  // Crear objeto con información del grupo
                  const groupInfo = {
                    id: groupId,
                    name: name,
                    url: url,
                    type: isPrivate ? 'private' : 'public',
                    members: members,
                    postsYear: 100, // Valores estimados
                    postsMonth: 10,
                    postsDay: 1,
                    dateFound: new Date().toISOString()
                  };
                  
                  // Verificar si cumple los criterios de filtrado
                  if (this.shouldIncludeGroup(groupInfo)) {
                    this.groups.push(groupInfo);
                    
                    // Enviar actualización de progreso
                    if (this.progressCallback) {
                      this.progressCallback({
                        type: 'newGroup',
                        group: groupInfo,
                        groupsFound: this.groups.length,
                        maxScrolls: this.maxScrolls
                      });
                    }
                    
                    console.log('GroupFinderFix: Grupo encontrado:', groupInfo.name);
                  }
                } catch (error) {
                  console.error('Error al procesar grupo:', error);
                }
              });
            }
          };
        }
        
        // Implementación básica de shouldIncludeGroup si no existe
        if (typeof this.shouldIncludeGroup !== 'function') {
          this.shouldIncludeGroup = function(groupInfo) {
            // Verificar tipo de grupo
            if (!this.options.publicGroups && groupInfo.type === 'public') return false;
            if (!this.options.privateGroups && groupInfo.type === 'private') return false;
            
            // Verificar número mínimo de usuarios
            const minUsers = parseInt(this.options.minUsers, 10);
            if (!isNaN(minUsers) && minUsers > 0) {
              // Convertir a número
              let memberCount = 0;
              
              if (typeof groupInfo.members === 'string') {
                // Manejar formatos como "1.2K", "500", etc.
                const memberText = groupInfo.members.replace(/,/g, '');
                const numericMatch = memberText.match(/[\d.]+/);
                
                if (numericMatch) {
                  memberCount = parseFloat(numericMatch[0]);
                  
                  if (memberText.match(/[kK]/)) {
                    memberCount *= 1000;
                  } else if (memberText.match(/[mM]/)) {
                    memberCount *= 1000000;
                  }
                }
              } else if (typeof groupInfo.members === 'number') {
                memberCount = groupInfo.members;
              }
              
              if (memberCount < minUsers) {
                return false;
              }
            }
            
            // Verificar criterios de publicaciones
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
                return false;
              }
            }
            
            return true;
          };
        }
        
        // Implementación básica de finishSearch si no existe
        if (typeof this.finishSearch !== 'function') {
          this.finishSearch = function() {
            console.log('GroupFinderFix: Finalizando búsqueda');
            
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
            
            // Notificar al callback con el resultado final
            if (this.progressCallback) {
              this.progressCallback({
                type: 'complete',
                groupsFound: this.groups.length,
                message: `Búsqueda finalizada. Se encontraron ${this.groups.length} grupos que cumplen los criterios.`,
                maxScrolls: this.maxScrolls
              });
            }
            
            // Guardar resultados en localStorage
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
              
              // Enviar resultados al sidebar
              this.sendResultsToSidebar();
            } catch (e) {
              console.error('GroupFinderFix: Error al guardar datos:', e);
            }
            
            return this.groups;
          };
        }
        
        // Implementación básica de sendResultsToSidebar si no existe
        if (typeof this.sendResultsToSidebar !== 'function') {
          this.sendResultsToSidebar = function() {
            console.log('GroupFinderFix: Enviando resultados al sidebar...');
            
            // Método 1: Usando iframe
            const iframe = document.getElementById('snap-lead-manager-iframe');
            if (iframe && iframe.contentWindow) {
              try {
                iframe.contentWindow.postMessage({
                  action: 'found_results',
                  results: this.groups,
                  success: true,
                  message: `Se encontraron ${this.groups.length} grupos.`
                }, '*');
                
                iframe.contentWindow.postMessage({
                  action: 'search_complete',
                  success: true,
                  result: {
                    success: true,
                    profiles: this.groups,
                    results: this.groups,
                    message: `Búsqueda completada. Se encontraron ${this.groups.length} grupos.`
                  }
                }, '*');
                
                return true;
              } catch (error) {
                console.error('Error al enviar mensajes al iframe:', error);
              }
            }
            
            // Método 2: Usando window.parent
            try {
              window.parent.postMessage({
                action: 'found_results',
                results: this.groups,
                success: true,
                message: `Se encontraron ${this.groups.length} grupos.`
              }, '*');
              
              return true;
            } catch (error) {
              console.error('Error al enviar mensajes via window.parent:', error);
            }
            
            // Método 3: Guardar en localStorage
            try {
              localStorage.setItem('snap_lead_manager_search_results', JSON.stringify({
                success: true,
                type: 'groups',
                timestamp: new Date().toISOString(),
                results: this.groups,
                message: `Búsqueda completada. Se encontraron ${this.groups.length} grupos.`
              }));
              
              localStorage.setItem('snap_lead_manager_results_pending', 'true');
              return true;
            } catch (error) {
              console.error('Error al guardar resultados en localStorage:', error);
              return false;
            }
          };
        }
        
        return true;
      };
    }
    
    console.log('GroupFinderFix: groupFinder reparado correctamente');
    return true;
  } catch (error) {
    console.error('GroupFinderFix: Error al reparar groupFinder:', error);
    return false;
  }
};

// Auto-inicialización
window.LeadManagerPro.groupFinderFixResult = window.LeadManagerPro.modules.ensureGroupFinder();

console.log('GroupFinderFix: Módulo cargado y listo');
