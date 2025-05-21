// Módulo para el controlador de filtros para la búsqueda de grupos
// Este módulo se encarga de aplicar los filtros configurados a los resultados de búsqueda

class GroupSearchFilterController {
  constructor() {
    this.initialized = false;
  }
  
  init() {
    if (this.initialized) return this;
    this.initialized = true;
    
    console.log('GroupSearchFilterController: Inicializando módulo');
    
    // Configurar los event listeners
    this.setupListeners();
    
    return this;
  }
  
  setupListeners() {
    // Escuchar eventos del background para aplicar filtros a los resultados
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'applyGroupFilters') {
        this.applyFilters(message.groups)
          .then(filteredGroups => {
            sendResponse({ success: true, filteredGroups });
          })
          .catch(error => {
            console.error('Error al aplicar filtros a grupos:', error);
            sendResponse({ success: false, error: error.message });
          });
        
        return true; // Mantener canal abierto para respuesta asíncrona
      }
    });
    
    console.log('GroupSearchFilterController: Event listeners configurados');
  }
  
  async applyFilters(groups) {
    if (!groups || !Array.isArray(groups)) {
      console.error('GroupSearchFilterController: Invalid groups array', groups);
      return [];
    }
    
    console.log(`GroupSearchFilterController: Aplicando filtros a ${groups.length} grupos`);
    
    // Obtener los criterios de filtrado
    const filterCriteria = await this.getFilterCriteria();
    console.log('Criterios de filtrado a aplicar:', filterCriteria);
    
    // Filtrar los grupos según los criterios
    const filteredGroups = groups.filter(group => {
      // Verificar tipo de grupo (público/privado)
      const isPublic = group.type === 'public';
      if (isPublic && !filterCriteria.groupTypes.public) return false;
      if (!isPublic && !filterCriteria.groupTypes.private) return false;
      
      // Verificar número mínimo de miembros (SIEMPRE DEBE CUMPLIRSE)
      if (filterCriteria.minMembers > 0 && group.members < filterCriteria.minMembers) return false;
      
      // Verificar publicaciones mínimas (debe cumplir al menos UNA de las condiciones)
      // Si no hay actividad registrada, no se puede aplicar este filtro
      if (!group.activity) return true;
      
      const yearCriteria = filterCriteria.minPosts.year > 0;
      const monthCriteria = filterCriteria.minPosts.month > 0;
      const dayCriteria = filterCriteria.minPosts.day > 0;
      
      // Si no hay criterios de actividad, se acepta el grupo
      if (!yearCriteria && !monthCriteria && !dayCriteria) return true;
      
      // Comprobar si cumple al menos uno de los criterios de actividad
      const meetsYearCriteria = !yearCriteria || (group.activity.year && group.activity.year >= filterCriteria.minPosts.year);
      const meetsMonthCriteria = !monthCriteria || (group.activity.month && group.activity.month >= filterCriteria.minPosts.month);
      const meetsDayCriteria = !dayCriteria || (group.activity.day && group.activity.day >= filterCriteria.minPosts.day);
      
      // Debe cumplir al menos uno de los criterios de actividad
      return meetsYearCriteria || meetsMonthCriteria || meetsDayCriteria;
    });
    
    console.log(`GroupSearchFilterController: Filtrado completado. ${filteredGroups.length} de ${groups.length} grupos cumplen los criterios.`);
    
    return filteredGroups;
  }
  
  async getFilterCriteria() {
    // Intentar obtener los criterios desde el módulo de opciones
    if (window.leadManagerPro && window.leadManagerPro.generalOptions) {
      const options = window.leadManagerPro.generalOptions.getAllOptions();
      if (options.groupTypes && options.minMembers !== undefined && options.minPosts) {
        return {
          groupTypes: options.groupTypes,
          minMembers: options.minMembers,
          minPosts: options.minPosts
        };
      }
    }
    
    // Si no está disponible el módulo, intentar obtener desde localStorage
    try {
      const savedOptions = localStorage.getItem('snap_lead_manager_general_options');
      if (savedOptions) {
        const parsedOptions = JSON.parse(savedOptions);
        if (parsedOptions.groupTypes && parsedOptions.minMembers !== undefined && parsedOptions.minPosts) {
          return {
            groupTypes: parsedOptions.groupTypes,
            minMembers: parsedOptions.minMembers,
            minPosts: parsedOptions.minPosts
          };
        }
      }
    } catch (error) {
      console.error('Error al leer criterios de filtrado desde localStorage:', error);
    }
    
    // Si no se puede obtener de ninguna forma, usar valores por defecto
    return {
      groupTypes: {
        public: true,
        private: true
      },
      minMembers: 100,
      minPosts: {
        year: 50,
        month: 10,
        day: 1
      }
    };
  }
}

// Exportar la clase
window.leadManagerPro = window.leadManagerPro || {};
window.leadManagerPro.groupSearchFilterController = new GroupSearchFilterController();
