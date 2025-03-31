/**
 * Módulo para extraer información de perfiles
 */

// Namespace para la organización del código
window.LeadManagerPro = window.LeadManagerPro || {};
window.LeadManagerPro.modules = window.LeadManagerPro.modules || {};

/**
 * Extrae perfiles de la página actual
 * @param {Object} searchState - Estado actual de la búsqueda
 * @returns {Promise<Array>} - Array de perfiles extraídos
 */
window.LeadManagerPro.modules.extractProfilesFromPage = async function(searchState) {
  // Referencias rápidas
  const updateStatus = window.LeadManagerPro.utils.updateStatus;
  const autoScroll = window.LeadManagerPro.modules.autoScroll;
  
  // Mensaje ajustado según el tipo de búsqueda
  const entityType = searchState.searchType === 'people' ? 'perfiles' : 'grupos';
  updateStatus(`Extrayendo ${entityType} de la página ${searchState.currentPage}...`, 40 + (searchState.currentPage / searchState.totalPages) * 20);
  
  let extractedResults = [];
  
  try {
    // Scroll hacia abajo para cargar todos los resultados
    await autoScroll(searchState);
    
    if (searchState.searchType === 'people') {
      // Selectores para resultados de personas
      const profileElements = document.querySelectorAll('[role="article"]');
      
      console.log(`Lead Manager Pro: Encontrados ${profileElements.length} elementos de perfil en la página`);
      
      profileElements.forEach(element => {
        try {
          // Extraer nombre
          const nameElement = element.querySelector('h3');
          if (!nameElement) return;
          
          const name = nameElement.textContent.trim();
          
          // Extraer URL del perfil
          const linkElement = element.querySelector('a[href*="/profile.php"], a[href*="facebook.com/"]');
          const profileUrl = linkElement ? linkElement.href : '';
          
          // Extraer información adicional (ubicación, trabajo, etc.)
          const infoElements = element.querySelectorAll('span');
          let location = '';
          let occupation = '';
          
          infoElements.forEach(span => {
            const text = span.textContent.trim();
            // Intentar detectar si es ubicación u ocupación basado en el contenido
            if (text.includes(',') || text.includes('vive en') || text.includes('from')) {
              location = text;
            } else if (text.includes('trabaja') || text.includes('works') || text.includes('at')) {
              occupation = text;
            }
          });
          
          // Extractar imagen de perfil
          const imgElement = element.querySelector('img');
          const imageUrl = imgElement ? imgElement.src : '';
          
          extractedResults.push({
            name,
            profileUrl,
            location,
            occupation,
            imageUrl,
            searchTerm: searchState.searchTerm,
            searchType: searchState.searchType,
            extractedAt: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error al procesar perfil:', error);
        }
      });
    } else {
      // Selectores para resultados de grupos - Actualizado basado en el HTML proporcionado
      const groupElements = document.querySelectorAll('[role="article"]');
      
      console.log(`Lead Manager Pro: Encontrados ${groupElements.length} elementos de grupo en la página`);
      
      // Variable para contar grupos realmente procesados
      let groupsProcessed = 0;
      
      groupElements.forEach(element => {
        try {
          // Extraer nombre del grupo - Mejores selectores basados en el HTML
          const nameElement = element.querySelector('a[role="link"] + div span a, span.x193iq5w a, div.xu06os2 span a, h3, [role="heading"]');
          if (!nameElement) {
            console.log('Lead Manager Pro: No se encontró elemento de nombre para este grupo');
            return;
          }
          
          const name = nameElement.textContent.trim();
          console.log(`Lead Manager Pro: Procesando grupo '${name}'`);
          
          // Extraer URL del grupo
          const linkElement = element.querySelector('a[href*="/groups/"]');
          const groupUrl = linkElement ? linkElement.href : '';
          
          // Buscar específicamente el elemento que contiene la información del grupo
          // Esto busca el elemento que contiene "Público · X miembros · Y publicaciones"
          const groupInfoElement = element.querySelector('span.x1lliihq span.x1lliihq, div.xu06os2 span.x1lliihq');
          let members = '';
          let groupType = '';
          let frequency = '';
          
          if (groupInfoElement) {
            const infoText = groupInfoElement.textContent.trim();
            console.log(`Lead Manager Pro: Información del grupo: "${infoText}"`);
            
            // Dividir por · para extraer las partes
            const parts = infoText.split('·').map(part => part.trim());
            
            // El primer elemento debería ser el tipo (Público/Privado)
            if (parts.length > 0) {
              groupType = parts[0];
            }
            
            // El segundo elemento debería ser los miembros
            if (parts.length > 1) {
              members = parts[1];
            }
            
            // El tercer elemento debería ser la frecuencia de publicaciones
            if (parts.length > 2) {
              frequency = parts[2];
            }
          } else {
            // Método alternativo: buscar spans individuales
            const infoElements = element.querySelectorAll('span');
            infoElements.forEach(span => {
              const text = span.textContent.trim();
              if (text.includes('miembro') || text.includes('member')) {
                members = text;
              } else if (text.includes('Público') || text.includes('Privado') || text.includes('Public') || text.includes('Private')) {
                groupType = text;
              } else if (text.includes('publicacion') || text.includes('post') || text.includes('al mes') || text.includes('al día') || text.includes('al año')) {
                frequency = text;
              }
            });
          }
          
          // Incrementar contador de grupos procesados
          groupsProcessed++;
          
          // Extraer imagen del grupo
          const imgElement = element.querySelector('img');
          const imageUrl = imgElement ? imgElement.src : '';
          
          // Crear objeto de datos del grupo
          const groupData = {
            name,
            groupUrl,
            members,
            groupType,
            frequency,
            imageUrl,
            searchTerm: searchState.searchTerm,
            searchType: searchState.searchType,
            extractedAt: new Date().toISOString()
          };
          
          // Registrar lo que estamos extrayendo para depuración
          console.log(`Lead Manager Pro: Extrayendo grupo:`, JSON.stringify(groupData));
          
          // Añadir a los resultados
          extractedResults.push(groupData);
        } catch (error) {
          console.error('Error al procesar grupo:', error);
        }
      });
      
      // Registrar cuántos grupos se procesaron realmente
      console.log(`Lead Manager Pro: Se procesaron ${groupsProcessed} grupos de los ${groupElements.length} encontrados`);
      
      // Actualizar el estado global con la cuenta de grupos
      searchState.foundCount = extractedResults.length;
    }
    
    // Mensaje ajustado según el tipo de búsqueda
    const countType = searchState.searchType === 'people' ? 'perfiles' : 'grupos';
    updateStatus(`Extraídos ${extractedResults.length} ${countType} en la página ${searchState.currentPage}.`, 45 + (searchState.currentPage / searchState.totalPages) * 20);
    
    // Verificar si no se encontraron resultados para detener la búsqueda
    if (extractedResults.length === 0) {
      console.log('Lead Manager Pro: No se encontraron resultados, deteniendo búsqueda');
      updateStatus(`No se encontraron resultados para esta búsqueda.`, 100);
      
      // Marcar la búsqueda como completada
      searchState.stopSearch = true;
      searchState.isSearching = false;
      
      // Notificar al sidebar que no se encontraron resultados
      const iframe = document.getElementById('snap-lead-manager-iframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          action: 'search_result',
          result: {
            success: true,
            profiles: [],
            results: [],
            message: 'No se encontraron resultados para esta búsqueda.'
          }
        }, '*');
      }
    } else {
      // Si se encontraron resultados, asegurarse de que el sidebar sea notificado inmediatamente
      console.log(`Lead Manager Pro: Enviando ${extractedResults.length} resultados al sidebar`);
      const iframe = document.getElementById('snap-lead-manager-iframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          action: 'search_result',
          result: {
            success: true,
            profiles: extractedResults,
            results: extractedResults,
            count: extractedResults.length,
            message: `Se encontraron ${extractedResults.length} ${countType}.`
          }
        }, '*');
      }
    }
    
    return extractedResults;
  } catch (error) {
    console.error('Error al extraer perfiles:', error);
    updateStatus(`Error al extraer perfiles: ${error.message}`, searchState.currentPage > 1 ? 50 : 0);
    return [];
  }
};

/**
 * Abre un perfil y extrae información detallada
 * @param {string} profileUrl - URL del perfil a abrir
 * @returns {Promise<Object>} - Resultado de la operación
 */
window.LeadManagerPro.modules.openAndExtractProfileDetails = async function(profileUrl) {
  // Referencias rápidas
  const updateStatus = window.LeadManagerPro.utils.updateStatus;
  
  if (!profileUrl) {
    console.error('Lead Manager Pro: URL de perfil no proporcionada');
    return { success: false, message: 'URL de perfil no válida' };
  }
  
  updateStatus(`Abriendo perfil: ${profileUrl}...`, 10);
  
  try {
    // Guardar la URL actual para volver después
    const currentUrl = window.location.href;
    localStorage.setItem('snap_lead_manager_return_url', currentUrl);
    
    // Abrir el perfil en una nueva pestaña
    const newTab = window.open(profileUrl, '_blank');
    
    // Si el navegador bloquea la apertura, intentamos navegar en la misma pestaña
    if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
      updateStatus('No se pudo abrir en nueva pestaña, intentando en la misma ventana...', 15);
      
      // Preservar datos para volver a la búsqueda después
      localStorage.setItem('snap_lead_manager_is_extracting_profile', 'true');
      localStorage.setItem('snap_lead_manager_profile_url', profileUrl);
      
      // Navegar a la URL del perfil
      window.location.href = profileUrl;
      return { success: true, message: 'Redirigiendo a la página del perfil', redirect: true };
    }
    
    return { success: true, message: 'Perfil abierto en nueva pestaña' };
  } catch (error) {
    console.error('Error al abrir perfil:', error);
    updateStatus(`Error al abrir perfil: ${error.message}`, 0);
    return { success: false, error: error.message };
  }
};

/**
 * Extrae detalles completos de un perfil abierto
 * @returns {Promise<Object>} - Detalles del perfil extraído
 */
window.LeadManagerPro.modules.extractOpenProfileDetails = async function() {
  // Referencias rápidas
  const updateStatus = window.LeadManagerPro.utils.updateStatus;
  const sleep = window.LeadManagerPro.utils.sleep;
  
  updateStatus('Extrayendo información detallada del perfil...', 30);
  
  try {
    // Detalles que vamos a recolectar
    const profileDetails = {
      name: '',
      headline: '',
      work: [],
      education: [],
      location: '',
      about: '',
      contactInfo: {},
      interests: [],
      activity: [],
      friendsCount: '',
      extractedAt: new Date().toISOString()
    };
    
    // Extraer nombre
    const nameElement = document.querySelector('h1, [role="heading"]');
    if (nameElement) {
      profileDetails.name = nameElement.textContent.trim();
    }
    
    // Extraer titular/headline
    const headlineElement = document.querySelector('h1 + div, [role="heading"] + div');
    if (headlineElement) {
      profileDetails.headline = headlineElement.textContent.trim();
    }
    
    // Extraer secciones de información (trabajo, educación, ubicación)
    const infoSections = document.querySelectorAll('div[role="article"], section');
    
    infoSections.forEach(section => {
      const sectionText = section.textContent.toLowerCase();
      
      // Extraer trabajo
      if (sectionText.includes('trabaj') || sectionText.includes('work') || sectionText.includes('empleo')) {
        const workItems = section.querySelectorAll('li, div[role="listitem"]');
        workItems.forEach(item => {
          const workInfo = item.textContent.trim();
          if (workInfo) {
            profileDetails.work.push(workInfo);
          }
        });
        
        // Si no hay items pero hay texto en la sección
        if (workItems.length === 0 && section.textContent.trim()) {
          profileDetails.work.push(section.textContent.trim());
        }
      }
      
      // Extraer educación
      if (sectionText.includes('educa') || sectionText.includes('stud') || sectionText.includes('escuela') || sectionText.includes('universidad')) {
        const eduItems = section.querySelectorAll('li, div[role="listitem"]');
        eduItems.forEach(item => {
          const eduInfo = item.textContent.trim();
          if (eduInfo) {
            profileDetails.education.push(eduInfo);
          }
        });
        
        // Si no hay items pero hay texto en la sección
        if (eduItems.length === 0 && section.textContent.trim()) {
          profileDetails.education.push(section.textContent.trim());
        }
      }
      
      // Extraer ubicación
      if (sectionText.includes('vive') || sectionText.includes('live') || sectionText.includes('ubicación') || sectionText.includes('location')) {
        const locationText = section.textContent.trim();
        if (locationText && !profileDetails.location) {
          profileDetails.location = locationText;
        }
      }
      
      // Extraer info de contacto
      if (sectionText.includes('contact') || sectionText.includes('contacto') || sectionText.includes('email') || sectionText.includes('teléfono') || sectionText.includes('phone')) {
        const contactItems = section.querySelectorAll('a, span[dir="auto"]');
        
        contactItems.forEach(item => {
          const text = item.textContent.trim().toLowerCase();
          const href = item.href || '';
          
          // Email
          if (text.includes('@') || href.includes('mailto:')) {
            profileDetails.contactInfo.email = item.textContent.trim();
          }
          // Teléfono
          else if (text.includes('phone') || text.includes('tel') || href.includes('tel:') || /\+\d+/.test(text)) {
            profileDetails.contactInfo.phone = item.textContent.trim();
          }
          // Sitio web
          else if (href && !href.includes('facebook.com') && (href.startsWith('http') || href.includes('www.'))) {
            profileDetails.contactInfo.website = href;
          }
        });
      }
      
      // Extraer sobre mí / about
      if (sectionText.includes('about') || sectionText.includes('sobre') || sectionText.includes('acerca')) {
        const aboutElement = section.querySelector('div[dir="auto"], p');
        if (aboutElement) {
          profileDetails.about = aboutElement.textContent.trim();
        } else if (section.textContent.trim()) {
          profileDetails.about = section.textContent.trim();
        }
      }
      
      // Extraer intereses
      if (sectionText.includes('interest') || sectionText.includes('interés') || sectionText.includes('hobby') || sectionText.includes('afición')) {
        const interestItems = section.querySelectorAll('li, div[role="listitem"], a');
        interestItems.forEach(item => {
          const interestText = item.textContent.trim();
          if (interestText) {
            profileDetails.interests.push(interestText);
          }
        });
      }
    });
    
    // Extraer actividad reciente
    const activityElements = document.querySelectorAll('div[role="article"] div[role="article"]');
    activityElements.forEach((activity, index) => {
      if (index < 5) { // Limitar a las 5 actividades más recientes
        const activityText = activity.textContent.trim();
        if (activityText) {
          profileDetails.activity.push(activityText.substring(0, 200) + (activityText.length > 200 ? '...' : ''));
        }
      }
    });
    
    // Extraer número de amigos
    const friendsCountElement = document.querySelector('a[href*="/friends"], div[data-pagelet*="ProfileAppSection_0"]');
    if (friendsCountElement) {
      const friendsText = friendsCountElement.textContent;
      const friendsMatch = friendsText.match(/\d+/);
      if (friendsMatch) {
        profileDetails.friendsCount = friendsMatch[0];
      }
    }
    
    updateStatus('Información de perfil extraída con éxito', 70);
    
    // Enviar la información al background para guardarla
    chrome.runtime.sendMessage({
      action: 'save_profile_details',
      profileDetails: profileDetails
    });
    
    // Si hay una URL para retornar, hacerlo después de un breve retraso
    const returnUrl = localStorage.getItem('snap_lead_manager_return_url');
    if (returnUrl) {
      updateStatus('Volviendo a los resultados de búsqueda...', 90);
      setTimeout(() => {
        localStorage.removeItem('snap_lead_manager_is_extracting_profile');
        localStorage.removeItem('snap_lead_manager_profile_url');
        localStorage.removeItem('snap_lead_manager_return_url');
        window.location.href = returnUrl;
      }, 2000);
    }
    
    return { success: true, profileDetails };
  } catch (error) {
    console.error('Error al extraer detalles del perfil:', error);
    updateStatus(`Error al extraer detalles: ${error.message}`, 0);
    return { success: false, error: error.message };
  }
};

/**
 * Guarda un perfil en el CRM
 * @param {Object} profileData - Datos del perfil a guardar
 * @returns {Promise<Object>} - Resultado de la operación
 */
window.LeadManagerPro.modules.saveProfileToCRM = async function(profileData) {
  // Referencias rápidas
  const updateStatus = window.LeadManagerPro.utils.updateStatus;
  
  if (!profileData) {
    return { success: false, message: 'No hay datos de perfil para guardar' };
  }
  
  updateStatus('Guardando perfil en CRM...', 50);
  
  try {
    // Enviar datos al background para que maneje la comunicación con el servidor
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'save_profile_to_crm',
        profileData: profileData
      }, (response) => {
        if (response && response.success) {
          updateStatus('Perfil guardado en CRM con éxito', 100);
          resolve({ success: true, message: 'Perfil guardado en CRM con éxito', data: response.data });
        } else {
          const errorMsg = response && response.error ? response.error : 'Error desconocido';
          updateStatus(`Error al guardar en CRM: ${errorMsg}`, 0);
          resolve({ success: false, error: errorMsg });
        }
      });
    });
  } catch (error) {
    console.error('Error al guardar perfil en CRM:', error);
    updateStatus(`Error al guardar perfil: ${error.message}`, 0);
    return { success: false, error: error.message };
  }
};
