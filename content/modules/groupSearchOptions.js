// Módulo para gestionar las opciones de búsqueda de grupos

class GroupSearchOptions {
  constructor() {
    this.defaultOptions = {
      groupTypes: {
        public: true,
        private: true
      },
      onlyPublicGroups: false, // Nueva opción: solo públicos
      minMembers: 100,
      minPosts: {
        year: 50,
        month: 10,
        day: 1
      },
      // Nuevas opciones para interacción con miembros de grupo
      memberInteraction: {
        membersToInteract: 10,
        interactionDelay: 3000, // 3 segundos en milisegundos
        messageToSend: 'Hola, este es un mensaje de prueba.',
        autoCloseChat: true
      }
    };
    this.options = { ...this.defaultOptions };
    this.loadOptions();
  }

  // Cargar opciones desde chrome.storage.sync
  loadOptions() {
    chrome.storage.sync.get(['groupSearchSettings'], (result) => {
      if (result && result.groupSearchSettings) {
        this.options = { ...this.defaultOptions, ...result.groupSearchSettings };
        console.log('Opciones de grupos cargadas de chrome.storage.sync:', this.options);
      } else {
        this.saveOptions(this.defaultOptions);
        console.log('No se encontraron opciones de grupo en chrome.storage.sync, guardando opciones por defecto');
      }
    });
  }

  // Guardar opciones en chrome.storage.sync
  saveOptions(options) {
    const newOptions = { ...this.options, ...options };
    this.options = newOptions;
    chrome.storage.sync.set({ groupSearchSettings: newOptions }, () => {
      console.log('Opciones de grupo guardadas en chrome.storage.sync:', newOptions);
    });
    return true;
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
    if (isPublic && !this.options.groupTypes.public) return false;
    if (!isPublic && !this.options.groupTypes.private) return false;

    // Verificar número mínimo de miembros (SIEMPRE DEBE CUMPLIRSE)
    if (this.options.minMembers && group.members < this.options.minMembers) return false;

    // Verificar publicaciones mínimas (debe cumplir al menos UNA de las condiciones)
    const yearEmpty = this.options.minPosts.year === null ||
                     this.options.minPosts.year === undefined ||
                     this.options.minPosts.year === '' ||
                     this.options.minPosts.year === 0;

    const monthEmpty = this.options.minPosts.month === null ||
                      this.options.minPosts.month === undefined ||
                      this.options.minPosts.month === '' ||
                      this.options.minPosts.month === 0;

    const dayEmpty = this.options.minPosts.day === null ||
                    this.options.minPosts.day === undefined ||
                    this.options.minPosts.day === '' ||
                    this.options.minPosts.day === 0;

    // Si todos los criterios de publicaciones están vacíos, se cumple automáticamente esta parte
    if (yearEmpty && monthEmpty && dayEmpty) {
      return true;
    }

    // Verificar cada criterio individualmente
    const yearCriteriaMet = yearEmpty || (group.postsYear >= this.options.minPosts.year);
    const monthCriteriaMet = monthEmpty || (group.postsMonth >= this.options.minPosts.month);
    const dayCriteriaMet = dayEmpty || (group.postsDay >= this.options.minPosts.day);

    // El grupo debe cumplir AL MENOS UNO de los criterios de publicaciones si están definidos
    return yearCriteriaMet || monthCriteriaMet || dayCriteriaMet;
  }
}

// Exportar la clase
window.leadManagerPro = window.leadManagerPro || {};
window.leadManagerPro.groupSearchOptions = new GroupSearchOptions();
