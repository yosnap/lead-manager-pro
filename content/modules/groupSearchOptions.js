// Módulo para gestionar las opciones de búsqueda de grupos

class GroupSearchOptions {
  constructor() {
    this.defaultOptions = {
      publicGroups: true,
      privateGroups: true,
      minUsers: 0,
      minPostsYear: 0,
      minPostsMonth: 0,
      minPostsDay: 0
    };
    
    this.options = this.loadOptions();
  }
  
  // Cargar opciones desde localStorage
  loadOptions() {
    try {
      // Intentar cargar desde localStorage
      const savedOptions = localStorage.getItem('snap_lead_manager_group_options');
      if (savedOptions) {
        const parsedOptions = JSON.parse(savedOptions);
        console.log('Opciones de grupos encontradas en localStorage:', parsedOptions);
        return { ...this.defaultOptions, ...parsedOptions };
      } else {
        console.log('No se encontraron opciones de grupo en localStorage, guardando opciones por defecto');
        // Si no hay opciones guardadas, guardar las opciones por defecto
        this.saveOptions(this.defaultOptions);
      }
    } catch (error) {
      console.error('Error al cargar las opciones de búsqueda de grupos:', error);
      console.log('Guardando opciones por defecto debido al error');
      // En caso de error, guardar las opciones por defecto
      this.saveOptions(this.defaultOptions);
    }
    
    // Si no hay opciones guardadas o hay un error, devolver las opciones por defecto
    return { ...this.defaultOptions };
  }
  
  // Guardar opciones en localStorage
  saveOptions(options) {
    try {
      const newOptions = { ...this.options, ...options };
      this.options = newOptions;
      localStorage.setItem('snap_lead_manager_group_options', JSON.stringify(newOptions));
      
      // También guardar en chrome.storage para persistencia y acceso desde background
      try {
        chrome.storage.local.set({
          'groupPublic': newOptions.publicGroups,
          'groupPrivate': newOptions.privateGroups,
          'minUsers': newOptions.minUsers,
          'minPostsYear': newOptions.minPostsYear,
          'minPostsMonth': newOptions.minPostsMonth,
          'minPostsDay': newOptions.minPostsDay
        }, function() {
          console.log('Opciones de grupo guardadas en chrome.storage.local');
        });
      } catch (storageError) {
        console.error('Error al guardar opciones de grupo en chrome.storage:', storageError);
      }
      
      return true;
    } catch (error) {
      console.error('Error al guardar las opciones de búsqueda de grupos:', error);
      return false;
    }
  }
  
  // Obtener una opción específica
  getOption(key) {
    return this.options[key];
  }
  
  // Establecer una opción específica
  setOption(key, value) {
    const options = { ...this.options };
    options[key] = value;
    return this.saveOptions(options);
  }
  
  // Obtener todas las opciones
  getAllOptions() {
    return { ...this.options };
  }
  
  // Restablecer opciones a los valores por defecto
  resetOptions() {
    this.options = { ...this.defaultOptions };
    return this.saveOptions(this.options);
  }
  
  // Verificar si un grupo cumple con los criterios de filtrado
  meetsCriteria(group) {
    // Si no hay datos del grupo, no cumple los criterios
    if (!group) return false;
    
    // Verificar tipo de grupo
    const isPublic = group.type === 'public';
    if (isPublic && !this.options.publicGroups) return false;
    if (!isPublic && !this.options.privateGroups) return false;
    
    // Verificar número mínimo de miembros (SIEMPRE DEBE CUMPLIRSE)
    if (this.options.minUsers && group.members < this.options.minUsers) return false;
    
    // Verificar publicaciones mínimas (debe cumplir al menos UNA de las condiciones)
    const yearEmpty = this.options.minPostsYear === null || 
                     this.options.minPostsYear === undefined || 
                     this.options.minPostsYear === '' ||
                     this.options.minPostsYear === 0;
                     
    const monthEmpty = this.options.minPostsMonth === null || 
                      this.options.minPostsMonth === undefined || 
                      this.options.minPostsMonth === '' ||
                      this.options.minPostsMonth === 0;
                      
    const dayEmpty = this.options.minPostsDay === null || 
                    this.options.minPostsDay === undefined || 
                    this.options.minPostsDay === '' ||
                    this.options.minPostsDay === 0;
    
    // Si todos los criterios de publicaciones están vacíos, se cumple automáticamente esta parte
    if (yearEmpty && monthEmpty && dayEmpty) {
      return true;
    }
    
    // Verificar cada criterio individualmente
    const yearCriteriaMet = yearEmpty || (group.postsYear >= this.options.minPostsYear);
    const monthCriteriaMet = monthEmpty || (group.postsMonth >= this.options.minPostsMonth);
    const dayCriteriaMet = dayEmpty || (group.postsDay >= this.options.minPostsDay);
    
    // El grupo debe cumplir AL MENOS UNO de los criterios de publicaciones si están definidos
    return yearCriteriaMet || monthCriteriaMet || dayCriteriaMet;
  }
}

// Exportar la clase
window.leadManagerPro = window.leadManagerPro || {};
window.leadManagerPro.groupSearchOptions = new GroupSearchOptions();
