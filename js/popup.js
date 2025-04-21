document.addEventListener('DOMContentLoaded', function() {
  // Referencias a elementos del menú
  const accountSettingsOption = document.getElementById('account-settings');
  const searchSaveOption = document.getElementById('search-save');
  const interactOption = document.getElementById('interact');
  const reportsStatsOption = document.getElementById('reports-stats');
  const contactSupportOption = document.getElementById('contact-support');

  // Función para mostrar mensajes
  function showMessage(message, type = 'info') {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.textContent = message;
    
    // Estilo para el mensaje
    messageElement.style.position = 'fixed';
    messageElement.style.top = '50%';
    messageElement.style.left = '50%';
    messageElement.style.transform = 'translate(-50%, -50%)';
    messageElement.style.padding = '15px 20px';
    messageElement.style.backgroundColor = type === 'error' ? '#F44336' : '#4CAF50';
    messageElement.style.color = 'white';
    messageElement.style.borderRadius = '4px';
    messageElement.style.zIndex = '1000';
    
    document.body.appendChild(messageElement);
    
    // Eliminar el mensaje después de 2 segundos
    setTimeout(() => {
      messageElement.remove();
    }, 2000);
  }

  // Opción de Ajustes de cuenta
  if (accountSettingsOption) {
    accountSettingsOption.addEventListener('click', function() {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        // Verificar que estamos en Facebook
        if (tabs[0].url.includes('facebook.com')) {
          // Por ahora, se podría mostrar un mensaje
          showMessage('Funcionalidad de ajustes en desarrollo');
        } else {
          showMessage('Esta extensión solo funciona en Facebook', 'error');
        }
      });
    });
  }

  // Opción de Buscar y guardar (abre el sidebar)
  if (searchSaveOption) {
    searchSaveOption.addEventListener('click', function() {
      console.log('Clic en "Buscar y guardar"');
      
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        console.log('Tab activa:', tabs[0].url);
        
        // Verificar que estamos en Facebook
        if (tabs[0].url.includes('facebook.com')) {
          console.log('Estamos en Facebook, enviando mensaje openSidebar');
          
          // Enviar mensaje para abrir el sidebar
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'openSidebar',
            timestamp: new Date().toISOString()
          }, function(response) {
            console.log('Respuesta recibida del content script:', response);
            
            // Incluso si no hay respuesta, continuamos
            if (chrome.runtime.lastError) {
              console.error('Error en comunicación con content script:', chrome.runtime.lastError);
              showMessage('Error de comunicación. Recargando...', 'error');
              
              // Intentar recargar la página después de un error
              setTimeout(() => {
                chrome.tabs.reload(tabs[0].id);
              }, 1500);
            }
          });
          
          // Mostrar mensaje de confirmación al usuario
          showMessage('Abriendo panel de búsqueda...', 'info');
          
          // Cerrar el popup después de un breve retraso
          setTimeout(() => {
            window.close();
          }, 1000);
        } else {
          showMessage('Esta extensión solo funciona en Facebook', 'error');
        }
      });
    });
  }

  // Opción de Interactuar (muestra la interfaz de interacción con miembros)
  if (interactOption) {
    interactOption.addEventListener('click', function() {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentUrl = tabs[0].url;
        
        // Verificar si estamos en una página de grupo específica
        const isInGroupPage = currentUrl.includes('facebook.com/groups/') && 
                              !currentUrl.includes('/groups/feed') &&
                              !currentUrl.includes('/blocked') &&
                              !currentUrl.includes('/events');
        
        if (isInGroupPage) {
          // Si estamos en un grupo, mostrar la interfaz de interacción
          console.log('Estamos en una página de grupo, mostrando interfaz de interacción');
          
          // Enviar mensaje para mostrar la interfaz
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'showMemberInteraction',
            timestamp: new Date().toISOString()
          }, function(response) {
            console.log('Respuesta de mostrar interacción:', response);
            
            // Manejar posibles errores
            if (chrome.runtime.lastError) {
              console.error('Error al comunicarse con la página:', chrome.runtime.lastError);
              
              // Navegar a la sección de miembros si hay un error
              const currentURL = tabs[0].url;
              const membersURL = currentURL.endsWith('/') 
                ? currentURL + 'members'
                : currentURL + '/members';
              
              chrome.tabs.update(tabs[0].id, {url: membersURL});
            }
          });
          
          showMessage('Mostrando opciones de interacción...', 'info');
        } else if (currentUrl.includes('facebook.com')) {
          // Si estamos en Facebook pero no en un grupo, ir a la página de grupos
          console.log('No estamos en un grupo, navegando a la página de grupos');
          chrome.tabs.update(tabs[0].id, {
            url: 'https://www.facebook.com/groups/feed/'
          });
          
          showMessage('Navegando a tus grupos...', 'info');
        } else {
          // Si no estamos en Facebook
          showMessage('Esta extensión solo funciona en Facebook', 'error');
        }
        
        // Cerrar el popup después de un breve retraso
        setTimeout(() => {
          window.close();
        }, 1000);
      });
    });
  }

  // Opción de Informes y estadísticas (en construcción)
  if (reportsStatsOption) {
    reportsStatsOption.addEventListener('click', function() {
      showMessage('Funcionalidad en construcción', 'info');
    });
  }

  // Opción de Contacto y Soporte (en construcción)
  if (contactSupportOption) {
    contactSupportOption.addEventListener('click', function() {
      showMessage('Funcionalidad en construcción', 'info');
    });
  }
});
