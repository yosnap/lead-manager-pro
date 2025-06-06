// Módulo para la extracción de miembros de un grupo de Facebook
// Este módulo implementa la funcionalidad para extraer información de miembros
// de un grupo específico de Facebook

class GroupMemberFinder {
  constructor() {
    this.options = null;
    this.isExtracting = false;
    this.members = [];
    this.scrollCount = 0;
    this.maxScrolls = 50;
    this.scrollTimeout = 2000;
    this.observer = null;
    this.progressCallback = null;
    this.currentSection = null; // Sección actual que se está procesando
    this.authenticationRequired = true; // Marcar como requiere autenticación
  }

  // Verificar autenticación antes de ejecutar métodos críticos
  checkAuthentication() {
    if (!this.authenticationRequired) return true;
    
    const authWrapper = window.LeadManagerPro?.AuthenticationWrapper;
    if (authWrapper && !authWrapper.canModuleExecute('groupMemberFinder')) {
      authWrapper.showAuthRequiredMessage('groupMemberFinder', 'extract');
      return false;
    }
    
    return true;
  }

  // Inicializar con opciones
  init(options, progressCallback = null) {
    // Verificar autenticación
    if (!this.checkAuthentication()) {
      console.log('GroupMemberFinder: Inicialización bloqueada - autenticación requerida');
      return Promise.reject(new Error('Autenticación requerida'));
    }
    
    console.log("INITIALIZING GROUP MEMBER FINDER");
    console.log("Options received from parameters:", options);
    
    this.options = options || {};
    
    // Cargar opciones generales desde localStorage
    try {
      const generalOptionsStr = localStorage.getItem('snap_lead_manager_general_options');
      
      if (generalOptionsStr) {
        const generalOptions = JSON.parse(generalOptionsStr);
        console.log('→ Options found in localStorage:', generalOptions);
        
        if (!isNaN(Number(generalOptions.maxScrolls))) {
          this.maxScrolls = Number(generalOptions.maxScrolls);
          console.log('→ Setting maxScrolls from localStorage:', this.maxScrolls);
        } else {
          console.warn('→ Invalid maxScrolls in localStorage, using default value');
          this.maxScrolls = 50;
        }
        
        if (!isNaN(Number(generalOptions.scrollDelay))) {
          // Convertir a milisegundos
          this.scrollTimeout = Number(generalOptions.scrollDelay) * 1000;
          console.log('→ Setting scrollDelay from localStorage:', generalOptions.scrollDelay, 'seconds');
        } else {
          console.warn('→ Invalid scrollDelay in localStorage, using default value');
          this.scrollTimeout = 2000;
        }
      } else {
        console.warn('⚠️ No options in localStorage - using defaults');
        
        // Usar valores por defecto
        this.maxScrolls = 50;
        this.scrollTimeout = 2000;
        
        // Guardar en localStorage para futuros usos
        // localStorage.setItem('snap_lead_manager_general_options', JSON.stringify({
        //   maxScrolls: this.maxScrolls,
        //   scrollDelay: this.scrollTimeout / 1000
        // })); // PARA BORRAR: clave antigua
        
        console.log('→ Default options saved to localStorage:', {
          maxScrolls: this.maxScrolls,
          scrollDelay: this.scrollTimeout / 1000
        });
      }
    } catch (parseError) {
      console.error('⚠️ ERROR parsing options from localStorage:', parseError);
      // En caso de error, usar valores por defecto
      this.maxScrolls = 50;
      this.scrollTimeout = 2000;
    }
    
    this.progressCallback = progressCallback;
    
    console.log('GroupMemberFinder: Initialized with final options:', this.options);
    
    return this;
  }

  // Navegar a la pestaña "Personas" del grupo
  async navigateToMembersTab() {
    console.log('GroupMemberFinder: Navigating to Members tab');
    
    // Buscar el enlace "Personas" en la barra de navegación
    const tabSelectors = [
      'a[role="tab"]:not([aria-selected="true"]):not([data-visualcompletion="ignore-dynamic"]):not([data-testid]):not([aria-hidden="true"])',
      'a[role="link"]:not([aria-selected="true"])',
      'div[role="tab"]:not([aria-selected="true"])'
    ];
    
    let personasTab = null;
    
    // Probar diferentes selectores
    for (const selector of tabSelectors) {
      const tabs = document.querySelectorAll(selector);
      personasTab = Array.from(tabs).find(tab => {
        const text = tab.textContent.toLowerCase();
        return text.includes('personas') || text.includes('members') || text.includes('miembros') || text.includes('people');
      });
      
      if (personasTab) break;
    }
    
    if (!personasTab) {
      console.warn('GroupMemberFinder: No se pudo encontrar la pestaña "Personas"');
      if (this.progressCallback) {
        this.progressCallback({
          type: 'error',
          message: 'No se pudo encontrar la pestaña "Personas"'
        });
      }
      return false;
    }
    
    // Hacer clic en la pestaña
    personasTab.click();
    console.log('GroupMemberFinder: Clic en pestaña "Personas" realizado');
    
    // Esperar a que se cargue la sección de miembros
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('GroupMemberFinder: Página de miembros cargada');
        resolve(true);
      }, 2000);
    });
  }

  // Contar miembros del grupo
  async countMembers() {
    console.log('GroupMemberFinder: Iniciando conteo de miembros');
    
    // Navegar a la pestaña de miembros primero
    const navigationSuccess = await this.navigateToMembersTab();
    if (!navigationSuccess) {
      if (this.progressCallback) {
        this.progressCallback({
          type: 'error',
          message: 'No se pudo navegar a la pestaña "Personas"'
        });
      }
      return { success: false, count: 0 };
    }
    
    // Esperar un momento para que cargue el contenido
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Este método utiliza una aproximación directa para contar los miembros
    // Buscamos directamente en el DOM por elementos que representan a los miembros
    const countResult = this.countMembersDirectly();
    
    console.log(`GroupMemberFinder: Total de miembros contados: ${countResult.totalCount}`);
    
    // Notificar del resultado
    if (this.progressCallback) {
      this.progressCallback({
        type: 'countComplete',
        totalCount: countResult.totalCount,
        sectionCounts: countResult.sectionCounts,
        message: `Se encontraron ${countResult.totalCount} miembros en total`
      });
    }
    
    return countResult;
  }
  
  // Método para contar miembros directamente en el DOM
  countMembersDirectly() {
    console.log('GroupMemberFinder: Contando miembros directamente del DOM');
    
    // Objeto para almacenar los conteos por sección
    const sectionCounts = {};
    let totalCount = 0;
    
    // 1. Buscar los encabezados de sección principales
    const sectionHeaders = Array.from(document.querySelectorAll('h2, h3, h4')).filter(header => {
      const text = header.textContent.toLowerCase();
      return text.includes('miembros') || 
             text.includes('colaboradores') || 
             text.includes('administradores') ||
             text.includes('nuevos miembros') ||
             text.includes('miembros con cosas');
    });
    
    console.log(`GroupMemberFinder: Encontradas ${sectionHeaders.length} secciones de miembros`);
    
    // 2. Para cada encabezado, contar los elementos de miembro asociados
    sectionHeaders.forEach(header => {
      const sectionTitle = header.textContent.trim();
      console.log(`GroupMemberFinder: Procesando sección "${sectionTitle}"`);
      
      // Buscar el contenedor principal que contiene los miembros
      // Primero, intentamos encontrar la lista de elementos
      let memberContainer = null;
      let container = header.parentElement;
      
      // Buscar hacia arriba por varios niveles
      for (let i = 0; i < 5 && container; i++) {
        // Buscar un elemento con role="list" dentro del contenedor actual
        const list = container.querySelector('[role="list"]');
        if (list) {
          memberContainer = list;
          break;
        }
        container = container.parentElement;
      }
      
      // Si no encontramos un contenedor específico, intentamos buscar elementos listitem cerca del encabezado
      if (!memberContainer) {
        container = header.parentElement;
        for (let i = 0; i < 5 && container; i++) {
          // Intentar encontrar elementos de lista directamente
          const items = container.querySelectorAll('[role="listitem"]');
          if (items.length > 0) {
            // Crear un array de los items encontrados
            const memberItems = Array.from(items);
            sectionCounts[sectionTitle] = memberItems.length;
            totalCount += memberItems.length;
            console.log(`GroupMemberFinder: Encontrados ${memberItems.length} miembros en sección "${sectionTitle}" (búsqueda directa)`);
            return;
          }
          container = container.parentElement;
        }
        
        // Si aún no encontramos nada, buscar elementos con información de perfil
        container = header.parentElement;
        for (let i = 0; i < 7 && container; i++) {
          const profileElements = container.querySelectorAll('a[href*="/user/"], a[href*="/profile.php"]');
          if (profileElements.length > 0) {
            // Filtrar elementos únicos (puede haber múltiples enlaces al mismo perfil)
            const uniqueProfiles = new Set();
            profileElements.forEach(el => {
              const href = el.getAttribute('href');
              if (href) uniqueProfiles.add(href);
            });
            
            sectionCounts[sectionTitle] = uniqueProfiles.size;
            totalCount += uniqueProfiles.size;
            console.log(`GroupMemberFinder: Encontrados ${uniqueProfiles.size} miembros en sección "${sectionTitle}" (búsqueda por enlaces de perfil)`);
            return;
          }
          container = container.parentElement;
        }
        
        // Si aún no encontramos nada, buscamos divs que puedan contener miembros
        container = header.parentElement;
        for (let i = 0; i < 7 && container; i++) {
          // Buscar divs que parecen contener imágenes de perfil
          const profileDivs = container.querySelectorAll('div > div > div > div > svg, div > div > div > div > img');
          if (profileDivs.length > 0) {
            sectionCounts[sectionTitle] = profileDivs.length;
            totalCount += profileDivs.length;
            console.log(`GroupMemberFinder: Encontrados ${profileDivs.length} miembros en sección "${sectionTitle}" (búsqueda por imágenes de perfil)`);
            return;
          }
          container = container.parentElement;
        }
        
        // No encontramos miembros para esta sección
        console.log(`GroupMemberFinder: No se encontraron miembros en sección "${sectionTitle}"`);
        sectionCounts[sectionTitle] = 0;
        return;
      }
      
      // Contar los elementos listitem dentro del contenedor
      const memberItems = memberContainer.querySelectorAll('[role="listitem"]');
      if (memberItems.length > 0) {
        sectionCounts[sectionTitle] = memberItems.length;
        totalCount += memberItems.length;
        console.log(`GroupMemberFinder: Encontrados ${memberItems.length} miembros en sección "${sectionTitle}"`);
      } else {
        // Intento alternativo: buscar elementos que parezcan miembros
        const possibleMembers = memberContainer.querySelectorAll('div[class*="member"], div > a[href*="/user/"], div > a[href*="/profile.php"]');
        if (possibleMembers.length > 0) {
          sectionCounts[sectionTitle] = possibleMembers.length;
          totalCount += possibleMembers.length;
          console.log(`GroupMemberFinder: Encontrados ${possibleMembers.length} miembros en sección "${sectionTitle}" (método alternativo)`);
        } else {
          console.log(`GroupMemberFinder: No se encontraron miembros en sección "${sectionTitle}"`);
          sectionCounts[sectionTitle] = 0;
        }
      }
    });
    
    // 3. Verificar si no encontramos secciones o si el conteo total es 0
    if (Object.keys(sectionCounts).length === 0 || totalCount === 0) {
      console.log('GroupMemberFinder: No se encontraron secciones o miembros, intentando método directo');
      
      // Método de emergencia: buscar elementos listitem en toda la página
      const allListItems = document.querySelectorAll('[role="listitem"]');
      if (allListItems.length > 0) {
        sectionCounts['Miembros del grupo'] = allListItems.length;
        totalCount = allListItems.length;
        console.log(`GroupMemberFinder: Encontrados ${allListItems.length} miembros en total (búsqueda global)`);
      } else {
        // Buscar enlaces de perfil en toda la página
        const allProfileLinks = document.querySelectorAll('a[href*="/user/"], a[href*="/profile.php"]');
        const uniqueProfiles = new Set();
        allProfileLinks.forEach(el => {
          const href = el.getAttribute('href');
          if (href) uniqueProfiles.add(href);
        });
        
        if (uniqueProfiles.size > 0) {
          sectionCounts['Miembros del grupo'] = uniqueProfiles.size;
          totalCount = uniqueProfiles.size;
          console.log(`GroupMemberFinder: Encontrados ${uniqueProfiles.size} miembros en total (búsqueda global por enlaces de perfil)`);
        }
      }
    }
    
    // Si aún no encontramos miembros, intentar un análisis directo del HTML
    if (totalCount === 0) {
      // Analizar la estructura básica de la página actual
      console.log('GroupMemberFinder: Intentando análisis directo del HTML');
      
      // Buscar elementos que parecen miembros por su estructura
      const memberElements = document.querySelectorAll('div[aria-disabled="false"]');
      if (memberElements.length > 0) {
        sectionCounts['Miembros encontrados'] = memberElements.length;
        totalCount = memberElements.length;
        console.log(`GroupMemberFinder: Encontrados ${memberElements.length} posibles miembros por estructura`);
      }
    }
    
    return { 
      success: true, 
      totalCount: totalCount,
      sectionCounts: sectionCounts
    };
  }

  // Iniciar la extracción de miembros
  async startExtraction() {
    // Verificar autenticación
    if (!this.checkAuthentication()) {
      console.log('GroupMemberFinder: Extracción bloqueada - autenticación requerida');
      return Promise.reject(new Error('Autenticación requerida'));
    }
    
    if (this.isExtracting) {
      console.log('GroupMemberFinder: Ya hay una extracción en progreso');
      return false;
    }
    
    this.isExtracting = true;
    this.members = [];
    this.scrollCount = 0;
    
    console.log('GroupMemberFinder: Iniciando extracción de miembros');
    
    // Navegar a la pestaña de miembros primero
    const navigationSuccess = await this.navigateToMembersTab();
    if (!navigationSuccess) {
      this.isExtracting = false;
      return false;
    }
    
    // Iniciar el observador para detectar nuevos miembros
    this.setupObserver();
    
    // Comenzar el scrolling
    this.scrollAndCollect();
    
    return true;
  }

  // Detener la extracción
  stopExtraction() {
    this.isExtracting = false;
    
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    console.log('GroupMemberFinder: Extracción detenida. Miembros encontrados:', this.members.length);
    
    return this.members;
  }

  // Configurar MutationObserver para detectar nuevos miembros cargados en la página
  setupObserver() {
    if (this.observer) {
      this.observer.disconnect();
    }
    
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Procesar los miembros añadidos
          setTimeout(() => this.collectVisibleMembers(), 500);
        }
      }
    });
    
    // Observar cambios en el contenedor principal de resultados
    const targetNode = document.querySelector('div[role="main"]');
    if (targetNode) {
      this.observer.observe(targetNode, { childList: true, subtree: true });
    } else {
      console.warn('GroupMemberFinder: No se encontró el contenedor principal para observar');
    }
  }

  // Realizar scroll y recolectar miembros
  scrollAndCollect() {
    // Verificar si debemos detener el scrolling
    if (!this.isExtracting || this.scrollCount >= this.maxScrolls) {
      console.log('GroupMemberFinder: Finalizando scrolling - scrollCount:', this.scrollCount, 'maxScrolls:', this.maxScrolls);
      this.finishExtraction();
      return;
    }
    
    // Recolectar miembros visibles
    this.collectVisibleMembers();
    
    // Realizar scroll
    window.scrollTo(0, document.body.scrollHeight);
    this.scrollCount++;
    
    // Registrar tiempo exacto del scroll
    const scrollTime = new Date().toLocaleTimeString();
    console.log(`GroupMemberFinder: Scroll #${this.scrollCount} completado a las ${scrollTime}`);
    
    // Informar del progreso
    if (this.progressCallback) {
      const progress = Math.round((this.scrollCount / this.maxScrolls) * 100);
      const message = `Realizando scroll para cargar todos los miembros (${this.scrollCount}/${this.maxScrolls})...`;
      
      this.progressCallback({
        type: 'progress',
        value: progress,
        message: message,
        membersFound: this.members.length
      });
    }
    
    // Programar el siguiente scroll
    setTimeout(() => {
      this.scrollAndCollect();
    }, this.scrollTimeout);
  }

  // Recolectar miembros visibles en la página
  collectVisibleMembers() {
    // Primero, intentamos identificar las secciones de miembros
    const sections = this.identifySections();
    
    // Iterar a través de cada sección
    for (const section of sections) {
      // Identificar los miembros en la sección actual
      const memberElements = this.getMemberElementsInSection(section);
      
      console.log(`GroupMemberFinder: Procesando sección "${section.title}" con ${memberElements.length} miembros`);
      
      // Extraer información de cada miembro
      memberElements.forEach(memberElement => {
        try {
          const memberId = this.extractMemberId(memberElement);
          
          // Evitar duplicados
          if (!memberId || this.members.some(m => m.id === memberId)) return;
          
          // Extraer información del miembro
          const memberInfo = {
            id: memberId,
            name: this.extractMemberName(memberElement),
            profileUrl: this.extractProfileUrl(memberElement),
            addedBy: this.extractAddedBy(memberElement),
            addedDate: this.extractAddedDate(memberElement),
            jobTitle: this.extractJobTitle(memberElement),
            location: this.extractLocation(memberElement),
            section: section.title,
            dateExtracted: new Date().toISOString()
          };
          
          // Añadir a la lista
          this.members.push(memberInfo);
          
          // Informar del nuevo miembro encontrado
          if (this.progressCallback) {
            this.progressCallback({
              type: 'newMember',
              member: memberInfo,
              membersFound: this.members.length
            });
          }
          
          console.log('GroupMemberFinder: Nuevo miembro encontrado:', memberInfo);
        } catch (error) {
          console.error('GroupMemberFinder: Error al procesar miembro:', error);
        }
      });
    }
  }

  // Identificar las distintas secciones de miembros en la página
  identifySections() {
    const sections = [];
    
    // Secciones prioritarias que queremos buscar específicamente
    const prioritySections = [
      'Miembros con cosas en común',
      'Members with things in common',
      'Nuevos miembros del grupo',
      'New group members'
    ];
    
    // Buscar encabezados que puedan indicar secciones
    const headingElements = document.querySelectorAll('h2, h3, h4');
    
    headingElements.forEach(heading => {
      const headingText = heading.textContent.trim();
      
      // Identificar si es una sección de miembros
      if (
        headingText.includes('Miembros con cosas en común') || 
        headingText.includes('Members with things') ||
        headingText.includes('Nuevos miembros del grupo') ||
        headingText.includes('New group members') ||
        headingText.includes('Administradores') ||
        headingText.includes('Admins') ||
        headingText.includes('Moderadores') ||
        headingText.includes('Moderators')
      ) {
        // Encontrar el contenedor de esta sección
        let sectionContainer = heading.parentElement;
        
        // Buscar hacia arriba para encontrar un contenedor adecuado
        for (let i = 0; i < 5; i++) {
          if (sectionContainer.querySelectorAll('a[href*="/user/"]').length > 0 || 
              sectionContainer.querySelectorAll('a[href*="/profile.php"]').length > 0) {
            break;
          }
          sectionContainer = sectionContainer.parentElement;
          if (!sectionContainer) break;
        }
        
        if (sectionContainer) {
          // Verificar si es una sección prioritaria
          const isPriority = prioritySections.some(section => headingText.includes(section));
          
          sections.push({
            title: headingText,
            element: sectionContainer,
            priority: isPriority ? 1 : 0  // Las secciones prioritarias estarán primero
          });
        }
      }
    });
    
    // Ordenar las secciones para poner las prioritarias primero
    sections.sort((a, b) => b.priority - a.priority);
    
    // Si no encontramos secciones específicas, usar el contenedor principal
    if (sections.length === 0) {
      const mainContainer = document.querySelector('div[role="main"]');
      if (mainContainer) {
        sections.push({
          title: 'Miembros del grupo',
          element: mainContainer,
          priority: 0
        });
      }
    }
    
    console.log('GroupMemberFinder: Secciones identificadas:', sections.map(s => s.title));
    
    return sections;
  }

  // Obtener elementos de miembros en una sección específica
  getMemberElementsInSection(section) {
    // Diferentes selectores para encontrar elementos de miembros
    const memberSelectors = [
      'div[data-visualcompletion="ignore-dynamic"]', // Selector común para elementos de miembros
      'div.x1y1aw1k', // Selector específico para tarjetas de miembros
      'div[role="article"]', // Otro selector para tarjetas de miembros
      'div.x78zum5:not(.x1iyjqo2)' // Otro selector para contenedores de miembros
    ];
    
    let memberElements = [];
    
    // Probar cada selector dentro de la sección
    for (const selector of memberSelectors) {
      const elements = section.element.querySelectorAll(selector);
      
      if (elements && elements.length > 0) {
        // Filtrar elementos que realmente son miembros (contienen enlaces a perfiles)
        memberElements = Array.from(elements).filter(element => {
          return element.querySelector('a[href*="/user/"]') || 
                 element.querySelector('a[href*="/profile.php"]') ||
                 element.querySelector('a[aria-label]');
        });
        
        if (memberElements.length > 0) {
          console.log(`GroupMemberFinder: Encontrados ${memberElements.length} miembros con selector: ${selector}`);
          break;
        }
      }
    }
    
    // Si no encontramos elementos, intentar buscar con un método alternativo
    if (memberElements.length === 0) {
      console.log('GroupMemberFinder: Intentando método alternativo para encontrar miembros');
      
      // Buscar enlaces a perfiles dentro de la sección
      const profileLinks = section.element.querySelectorAll('a[href*="/user/"], a[href*="/profile.php"]');
      
      if (profileLinks.length > 0) {
        console.log(`GroupMemberFinder: Encontrados ${profileLinks.length} enlaces a perfiles`);
        
        // Convertir los enlaces a elementos "padres" que puedan contener la información del miembro
        memberElements = Array.from(profileLinks).map(link => {
          // Buscar un contenedor padre adecuado
          let parent = link.parentElement;
          for (let i = 0; i < 5; i++) {
            if (parent && parent.offsetHeight > 50) return parent;
            parent = parent.parentElement;
            if (!parent) break;
          }
          return link.parentElement;
        });
        
        // Eliminar duplicados
        memberElements = [...new Set(memberElements)].filter(el => el !== null);
      }
    }
    
    return memberElements;
  }

  // Extraer ID del miembro del elemento DOM
  extractMemberId(element) {
    // Intentar extraer ID del miembro de un enlace
    const link = element.querySelector('a[href*="/user/"], a[href*="/profile.php"]');
    if (link) {
      const url = link.getAttribute('href');
      
      // Extraer ID de usuario de la URL
      if (url.includes('/user/')) {
        const match = url.match(/\/user\/([^/?]+)/);
        return match ? match[1] : null;
      } else if (url.includes('/profile.php')) {
        const match = url.match(/id=([^&]+)/);
        return match ? match[1] : null;
      }
    }
    
    return null;
  }

  // Extraer nombre del miembro
  extractMemberName(element) {
    // Buscar el nombre en el enlace al perfil
    const link = element.querySelector('a[href*="/user/"], a[href*="/profile.php"]');
    if (link) {
      // Si el enlace tiene un texto, es probablemente el nombre
      const linkText = link.textContent.trim();
      if (linkText) return linkText;
      
      // Si no, buscar elementos de texto dentro del enlace
      const spanText = link.querySelector('span')?.textContent.trim();
      if (spanText) return spanText;
    }
    
    // Alternativa: buscar elementos de encabezado o texto destacado
    const nameElement = element.querySelector('span[dir="auto"], strong, h3, h4');
    return nameElement ? nameElement.textContent.trim() : 'Miembro sin nombre';
  }

  // Extraer URL del perfil
  extractProfileUrl(element) {
    const link = element.querySelector('a[href*="/user/"], a[href*="/profile.php"]');
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

  // Extraer quién añadió al miembro
  extractAddedBy(element) {
    // Buscar texto como "Agregado por [Nombre]"
    const allText = element.textContent;
    
    const patterns = [
      /Agregado por ([\w\s]+) el/i,
      /Añadido por ([\w\s]+) el/i,
      /Added by ([\w\s]+) on/i
    ];
    
    for (const pattern of patterns) {
      const match = allText.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return '';
  }

  // Extraer fecha de adición
  extractAddedDate(element) {
    // Buscar texto con fecha
    const allText = element.textContent;
    
    // Patrones para fechas en varios formatos
    const patterns = [
      /el (\d+ de [a-zá-úñ]+ de \d{4})/i,
      /on (\w+ \d+, \d{4})/i
    ];
    
    for (const pattern of patterns) {
      const match = allText.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // Buscar texto alternativo como "Se unió el viernes pasado"
    if (allText.includes('Se unió el')) {
      const joinText = allText.match(/Se unió el ([^.]+)/);
      if (joinText && joinText[1]) {
        return joinText[1].trim();
      }
    }
    
    return '';
  }

  // Extraer título de trabajo
  extractJobTitle(element) {
    // Buscar elementos que puedan contener información de trabajo
    const jobElements = Array.from(element.querySelectorAll('span, div'))
      .filter(el => !el.querySelector('a') && el.textContent.trim().length > 0)
      .filter(el => {
        const text = el.textContent.toLowerCase();
        return !text.includes('agregado por') && 
               !text.includes('added by') && 
               !text.includes('se unió') && 
               !text.includes('joined');
      });
    
    // Primer elemento que cumple los criterios puede ser el título de trabajo
    for (const el of jobElements) {
      const text = el.textContent.trim();
      if (text && text.length > 0 && !text.match(/^\d/) && !text.match(/^[.,;:]/)) {
        // Verificar si es un título de trabajo (no fecha, no ubicación común)
        if (!text.match(/^\d{1,2}\s+de\s+[a-zá-úñ]+\s+de\s+\d{4}$/i) && 
            !text.includes('Agregado por') && 
            !text.includes('Added by')) {
          return text;
        }
      }
    }
    
    return '';
  }

  // Extraer ubicación
  extractLocation(element) {
    // Buscar elementos que puedan contener información de ubicación
    const locationElements = Array.from(element.querySelectorAll('span, div'))
      .filter(el => !el.querySelector('a') && el.textContent.trim().length > 0);
    
    // Ubicaciones comunes (ciudades/países)
    const commonLocations = [
      'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza',
      'Málaga', 'México', 'Argentina', 'Colombia', 'Chile', 'España',
      'Peru', 'Perú', 'Bolivia', 'Ecuador', 'Venezuela', 'Miami',
      'New York', 'California', 'Texas', 'Florida'
    ];
    
    // Buscar elementos con texto que coincida con ubicaciones comunes
    for (const el of locationElements) {
      const text = el.textContent.trim();
      for (const location of commonLocations) {
        if (text.includes(location)) {
          return text;
        }
      }
    }
    
    return '';
  }

  // Finalizar la extracción
  finishExtraction() {
    this.isExtracting = false;
    
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    if (this.progressCallback) {
      this.progressCallback({
        type: 'complete',
        membersFound: this.members.length,
        message: `Extracción finalizada. Se encontraron ${this.members.length} miembros.`
      });
    }
    
    console.log('GroupMemberFinder: Extracción finalizada. Miembros encontrados:', this.members.length);
    
    // Guardar resultados en localStorage
    try {
      // Guardar las estadísticas más recientes
      // localStorage.setItem('snap_lead_manager_last_extraction_stats', JSON.stringify({
      //   timestamp: new Date().toISOString(),
      //   totalMembers: this.members.length,
      //   groupInfo: {
      //     id: this.extractGroupIdFromUrl(),
      //     name: this.extractGroupNameFromPage(),
      //     url: window.location.href
      //   },
      //   scrollCount: this.scrollCount
      // })); // PARA BORRAR: clave antigua
      
    } catch (e) {
      console.error('GroupMemberFinder: Error al guardar miembros en localStorage:', e);
    }
    
    return this.members;
  }

  // Extraer ID del grupo de la URL actual
  extractGroupIdFromUrl() {
    const url = window.location.href;
    const match = url.match(/groups\/([^/?]+)/);
    return match ? match[1] : '';
  }

  // Extraer nombre del grupo de la página
  extractGroupNameFromPage() {
    // Intentar diferentes selectores para el nombre del grupo
    const selectors = [
      'h1', 
      'a[href*="/groups/"][role="link"]',
      'span[dir="auto"]'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }
    
    return 'Grupo desconocido';
  }

  // Método para exportar los resultados
  exportResults(format = 'json') {
    if (this.members.length === 0) {
      console.warn('GroupMemberFinder: No hay miembros para exportar');
      return null;
    }
    
    if (format === 'json') {
      const dataStr = JSON.stringify(this.members, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      return URL.createObjectURL(dataBlob);
    } else if (format === 'csv') {
      // Crear cabeceras CSV
      const headers = ['id', 'name', 'profileUrl', 'addedBy', 'addedDate', 'jobTitle', 'location', 'section', 'dateExtracted'];
      
      // Crear filas
      const rows = [
        headers.join(','),
        ...this.members.map(member => {
          return headers.map(field => {
            let value = member[field] || '';
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
window.leadManagerPro.groupMemberFinder = new GroupMemberFinder();
