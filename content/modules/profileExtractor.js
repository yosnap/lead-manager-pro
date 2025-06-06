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
      // Obtener las opciones para filtrar grupos
      const options = window.LeadManagerPro.state.options || {};
      const filterGroupPublic = options.groupPublic !== undefined ? options.groupPublic : true;
      const filterGroupPrivate = options.groupPrivate !== undefined ? options.groupPrivate : true;
      const minUsers = options.minUsers || 100;
      const minPostsYear = options.minPostsYear || 10;
      const minPostsMonth = options.minPostsMonth || 5;
      const minPostsDay = options.minPostsDay || 1;
      
      console.log(`Lead Manager Pro: Aplicando filtros de grupos - Público: ${filterGroupPublic}, Privado: ${filterGroupPrivate}, Mín. usuarios: ${minUsers}`);
      console.log(`Lead Manager Pro: Mín. publicaciones - Año: ${minPostsYear}, Mes: ${minPostsMonth}, Día: ${minPostsDay}`);
      
      // Selectores para resultados de grupos
      const groupElements = document.querySelectorAll('[role="article"]');
      
      console.log(`Lead Manager Pro: Encontrados ${groupElements.length} elementos de grupo en la página`);
      
      // Variables para contar grupos en diferentes etapas del procesamiento
      let groupsFound = groupElements.length;
      let groupsProcessed = 0;
      let groupsFiltered = {
        total: 0,
        byType: 0,
        byUsers: 0,
        byFrequency: 0
      };
      
      console.log(`Lead Manager Pro: Comenzando a procesar ${groupsFound} grupos encontrados en la página`);
      console.log(`Lead Manager Pro: Filtros aplicados - Público: ${filterGroupPublic}, Privado: ${filterGroupPrivate}, Mín. usuarios: ${minUsers}`);
      console.log(`Lead Manager Pro: Mín. publicaciones - Año: ${minPostsYear}, Mes: ${minPostsMonth}, Día: ${minPostsDay}`);
      
      groupElements.forEach((element, index) => {
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
          
          // Buscar más exhaustivamente los elementos que contienen la información del grupo
          // Esto busca el elemento que contiene "Público · X miembros · Y publicaciones"
          const allSpans = element.querySelectorAll('span');
          let members = '';
          let groupType = '';
          let frequency = '';
          let groupInfoText = '';
          
          // Primero intentamos encontrar el span con toda la información
          for (const span of allSpans) {
            const text = span.textContent.trim();
            // Buscamos un texto que incluya "·" y tenga información de tipo y miembros
            if (text.includes('·') && 
               (text.includes('Público') || text.includes('Privado') || 
                text.includes('Public') || text.includes('Private')) && 
               (text.includes('miembro') || text.includes('member'))) {
              
              groupInfoText = text;
              console.log(`Lead Manager Pro: Información completa del grupo encontrada: "${text}"`);
              
              // Dividir por · para extraer las partes
              const parts = text.split('·').map(part => part.trim());
              
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
              
              break; // Si encontramos la información completa, no necesitamos seguir buscando
            }
          }
          
          // Método alternativo: buscar spans individuales si no encontramos un span con toda la info
          if (!groupInfoText) {
            console.log(`Lead Manager Pro: Buscando información del grupo en spans individuales`);
            
            allSpans.forEach(span => {
              const text = span.textContent.trim();
              
              // Detectar cantidad de miembros
              if ((text.includes('miembro') || text.includes('member')) && !members) {
                members = text;
                console.log(`Lead Manager Pro: Información de miembros encontrada: "${text}"`);
              } 
              // Detectar tipo de grupo
              else if ((text.includes('Público') || text.includes('Privado') || 
                       text.includes('Public') || text.includes('Private')) && !groupType) {
                groupType = text;
                console.log(`Lead Manager Pro: Información de tipo de grupo encontrada: "${text}"`);
              } 
              // Detectar frecuencia de publicaciones
              else if ((text.includes('publicacion') || text.includes('post') || 
                       text.includes('al mes') || text.includes('mensual') || 
                       text.includes('al día') || text.includes('diaria') || 
                       text.includes('al año') || text.includes('anual') ||
                       text.includes('per month') || text.includes('per day') || 
                       text.includes('per year')) && !frequency) {
                frequency = text;
                console.log(`Lead Manager Pro: Información de frecuencia encontrada: "${text}"`);
              }
            });
          }
          
          // Aplicar filtros de tipo de grupo
          let passesTypeFilter = true;
          const groupTypeLower = groupType.toLowerCase();
          let detectedType = 'desconocido';
          
          if (groupTypeLower.includes('público') || groupTypeLower.includes('public')) {
            passesTypeFilter = filterGroupPublic;
            detectedType = 'público';
          } else if (groupTypeLower.includes('privado') || groupTypeLower.includes('private')) {
            passesTypeFilter = filterGroupPrivate;
            detectedType = 'privado';
          }
          
          if (!passesTypeFilter) {
            console.log(`Lead Manager Pro: Grupo ${name} (${index+1}/${groupsFound}) filtrado por tipo: ${groupType}`);
            groupsFiltered.byType++;
            groupsFiltered.total++;
            return;
          }
          
          console.log(`Lead Manager Pro: Grupo ${name} (${index+1}/${groupsFound}) pasa filtro de tipo: ${detectedType}`);
          
          // Aplicar filtro de cantidad mínima de usuarios
          let userCount = 0;
          console.log(`Lead Manager Pro: Procesando texto de miembros: "${members}"`);
          
          if (members) {
            // Primero intentamos el formato con números y multiplicadores (K, M)
            const userMatch = members.match(/(\d+[\.,]?\d*)\s*[kKmM]?/);
            if (userMatch) {
              // Normalizar el string numérico
              let userStr = userMatch[0].trim();
              console.log(`Lead Manager Pro: Match de usuarios encontrado: "${userStr}"`);
              
              // Detectar si son miles (k) o millones (M) y aplicar multiplicador
              let multiplier = 1;
              if (userStr.toLowerCase().includes('k')) {
                multiplier = 1000;
                userStr = userStr.toLowerCase().replace('k', '');
              } else if (userStr.toLowerCase().includes('m')) {
                multiplier = 1000000;
                userStr = userStr.toLowerCase().replace('m', '');
              }
              
              // Normalizar separadores decimales/miles
              userStr = userStr.replace(',', '.').trim();
              
              // Convertir a número y aplicar multiplicador
              userCount = parseFloat(userStr) * multiplier;
              console.log(`Lead Manager Pro: Cantidad de usuarios calculada: ${userCount} (original: ${userStr}, multiplicador: ${multiplier})`);
            }
            
            // Si no pudimos extraer el número, intentamos con texto completo
            if (userCount === 0) {
              console.log(`Lead Manager Pro: Intentando extraer número de usuarios con método alternativo`);
              
              // Extraer cualquier secuencia numérica
              const allNumbers = members.match(/\d+/g);
              if (allNumbers && allNumbers.length > 0) {
                // Tomamos el número más grande como cantidad de usuarios
                userCount = Math.max(...allNumbers.map(num => parseInt(num, 10)));
                console.log(`Lead Manager Pro: Cantidad de usuarios extraída con método alternativo: ${userCount}`);
                
                // Aplicar multiplicador si hay indicadores de K o M
                if (members.toLowerCase().includes('k') || members.toLowerCase().includes('mil')) {
                  userCount *= 1000;
                } else if (members.toLowerCase().includes('m') || members.toLowerCase().includes('mill')) {
                  userCount *= 1000000;
                }
              }
            }
          }
          
          console.log(`Lead Manager Pro: Cantidad final de usuarios: ${userCount}, mínimo requerido: ${minUsers}`);
          if (userCount < minUsers) {
            console.log(`Lead Manager Pro: Grupo ${name} (${index+1}/${groupsFound}) filtrado por usuarios: ${userCount} < ${minUsers}`);
            groupsFiltered.byUsers++;
            groupsFiltered.total++;
            return;
          }
          
          console.log(`Lead Manager Pro: Grupo ${name} (${index+1}/${groupsFound}) pasa filtro de usuarios: ${userCount} >= ${minUsers}`);
          
          // Aplicar filtro de frecuencia de publicaciones
          let passesFrequencyFilter = false;
          if (frequency) {
            const frequencyLower = frequency.toLowerCase();
            const postsMatch = frequency.match(/(\d+[\.,]?\d*)/);
            let postsCount = 0;
            
            if (postsMatch) {
              postsCount = parseFloat(postsMatch[0].replace(',', '.'));
              
              // Verificar si cumple con CUALQUIERA de los mínimos según periodo
              // Si tiene suficientes publicaciones en cualquier categoría, pasa el filtro
              if ((frequencyLower.includes('día') || frequencyLower.includes('day')) && postsCount >= minPostsDay) {
                passesFrequencyFilter = true;
                console.log(`Lead Manager Pro: Grupo ${name} pasa el filtro de publicaciones diarias: ${postsCount} >= ${minPostsDay}`);
              } 
              else if ((frequencyLower.includes('mes') || frequencyLower.includes('month')) && postsCount >= minPostsMonth) {
                passesFrequencyFilter = true;
                console.log(`Lead Manager Pro: Grupo ${name} pasa el filtro de publicaciones mensuales: ${postsCount} >= ${minPostsMonth}`);
              } 
              else if ((frequencyLower.includes('año') || frequencyLower.includes('year')) && postsCount >= minPostsYear) {
                passesFrequencyFilter = true;
                console.log(`Lead Manager Pro: Grupo ${name} pasa el filtro de publicaciones anuales: ${postsCount} >= ${minPostsYear}`);
              }
            }
          } else {
            // Si no hay información de frecuencia, permitimos que pase (podemos cambiar este comportamiento)
            passesFrequencyFilter = true;
            console.log(`Lead Manager Pro: Grupo ${name} no tiene información de frecuencia, permitiendo pasar`);
          }
          
          if (!passesFrequencyFilter) {
            console.log(`Lead Manager Pro: Grupo ${name} (${index+1}/${groupsFound}) filtrado por frecuencia: ${frequency}`);
            groupsFiltered.byFrequency++;
            groupsFiltered.total++;
            return;
          }
          
          console.log(`Lead Manager Pro: Grupo ${name} (${index+1}/${groupsFound}) pasa todos los filtros`);
          
          // Si pasa todos los filtros, incrementar contador
          groupsProcessed++;
          
          // Extraer imagen del grupo
          const imgElement = element.querySelector('img');
          const imageUrl = imgElement ? imgElement.src : '';
          
          // Crear objeto de datos del grupo
          const groupData = {
            name,
            groupUrl,
            members,
            membersCount: userCount,
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
      
      // Registrar cuántos grupos se procesaron realmente y el resumen de filtrado
      console.log(`Lead Manager Pro: Resumen de procesamiento de grupos:`);
      console.log(`- Grupos encontrados inicialmente: ${groupsFound}`);
      console.log(`- Grupos que pasaron todos los filtros: ${groupsProcessed}`);
      console.log(`- Grupos filtrados en total: ${groupsFiltered.total}`);
      console.log(`  - Por tipo (público/privado): ${groupsFiltered.byType}`);
      console.log(`  - Por cantidad mínima de usuarios: ${groupsFiltered.byUsers}`);
      console.log(`  - Por frecuencia de publicaciones: ${groupsFiltered.byFrequency}`);
      
      // Actualizar el estado global con la cuenta de grupos
      searchState.foundCount = extractedResults.length;
      
      // Log detallado de los grupos que pasaron los filtros
      console.log(`Lead Manager Pro: Grupos que pasaron todos los filtros:`);
      extractedResults.forEach((group, index) => {
        console.log(`${index + 1}. ${group.name} - ${group.membersCount} miembros - Tipo: ${group.groupType} - Frecuencia: ${group.frequency}`);
      });
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
      // window.location.href = profileUrl; // PARA BORRAR: navegación automática
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
        // window.location.href = returnUrl; // PARA BORRAR: navegación automática
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
