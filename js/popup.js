document.addEventListener('DOMContentLoaded', function() {
  // Verificar si el usuario está autenticado usando nuestro módulo Auth
  window.LeadManagerPro.Auth.isAuthenticated(function(isAuthenticated) {
    // Si no está autenticado, redirigir a la página de login
    if (!isAuthenticated) {
      console.log('Usuario no autenticado, redirigiendo a login...');
      window.location.href = 'login.html';
      return;
    }
    
    // Obtener información del usuario
    window.LeadManagerPro.Auth.getUserInfo(function(userInfo) {
      if (userInfo && userInfo.username) {
        const headerElement = document.querySelector('header');
        if (headerElement) {
          const userInfoElement = document.createElement('div');
          userInfoElement.className = 'user-info';
          userInfoElement.innerHTML = `<span class="username">${userInfo.username}</span> <a href="#" id="logout">Cerrar sesión</a>`;
          headerElement.appendChild(userInfoElement);
          
          // Añadir evento para cerrar sesión
          document.getElementById('logout').addEventListener('click', function(event) {
            event.preventDefault();
            // Usar nuestro módulo Auth para cerrar sesión
            window.LeadManagerPro.Auth.logout(function() {
              console.log('Sesión cerrada correctamente');
              window.location.href = 'login.html';
            });
          });
        }
      }
      
      // Continuar con la inicialización de la UI
      initializeUI();
    });
  });
  
  // Función para inicializar la UI después de verificar autenticación
  function initializeUI() {

  // Referencias a los elementos del menú
  const accountSettingsBtn = document.getElementById('account-settings');
  const searchSaveBtn = document.getElementById('search-save');
  const interactBtn = document.getElementById('interact');
  const reportsBtn = document.getElementById('reports');
  const optionsBtn = document.getElementById('options');
  const contactBtn = document.getElementById('contact');
  
  // Verificar si estamos en una página de grupo de Facebook
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const activeTab = tabs[0];
    
    if (activeTab.url.includes('facebook.com/groups/') && !activeTab.url.includes('/groups/feed')) {
      // Estamos en una página de grupo, crear y mostrar el botón de extracción de miembros
      const groupActions = document.getElementById('group-actions');
      if (groupActions) {
        // Crear botón de extracción
        const extractButton = document.createElement('button');
        extractButton.id = 'extract-members-btn';
        extractButton.textContent = 'Extraer miembros del grupo';
        extractButton.style.cssText = `
          display: block;
          width: 100%;
          margin-top: 12px;
          padding: 8px 16px;
          background-color: #4267B2;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
        `;
        
        groupActions.appendChild(extractButton);
        
        // Añadir evento al botón
        extractButton.addEventListener('click', function() {
          // Enviar mensaje para iniciar extracción de miembros
          chrome.tabs.sendMessage(activeTab.id, {
            action: 'startGroupMemberExtraction'
          }, function(response) {
            if (response && response.success) {
              showMessage('Iniciando extracción de miembros...', 'info');
            } else {
              showMessage('Error al iniciar la extracción: ' + (response?.error || 'Desconocido'), 'error');
            }
          });
          window.close();
        });
      }
    }
  });
  
  // Función para mostrar un mensaje genérico
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
    
    // Eliminar el mensaje después de 3 segundos
    setTimeout(() => {
      messageElement.remove();
    }, 3000);
  }
  
  // Verificar si estamos en Facebook
  function isOnFacebook(callback) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const activeTab = tabs[0];
      const isFacebook = activeTab.url && activeTab.url.includes('facebook.com');
      callback(isFacebook, activeTab);
    });
  }
  
  // Evento para Ajustes de cuenta
  if (accountSettingsBtn) {
    accountSettingsBtn.addEventListener('click', function() {
      isOnFacebook((isFacebook, activeTab) => {
        if (isFacebook) {
          chrome.tabs.sendMessage(activeTab.id, {
            action: 'openAccountSettings'
          });
          window.close();
        } else {
          showMessage('Esta extensión solo funciona en Facebook', 'error');
        }
      });
    });
  }
  
  // Evento para Buscar y guardar
  if (searchSaveBtn) {
    searchSaveBtn.addEventListener('click', function() {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const activeTab = tabs[0];
        
        // Función para abrir el sidebar de búsqueda de grupos
        const openGroupSearchSidebar = (tabId) => {
          chrome.tabs.sendMessage(tabId, {
            action: 'openGroupSearchSidebar'
          }, function(response) {
            console.log('Sidebar de búsqueda de grupos abierto:', response);
            if (!response || response.error) {
              console.error('Error al abrir el sidebar:', response?.error || 'No hay respuesta');
              showMessage('Error al abrir las herramientas de búsqueda', 'error');
            } else {
              console.log('Herramientas de búsqueda de grupos abiertas correctamente');
              // Mostrar mensaje de éxito cuando se complete exitosamente
              setTimeout(() => {
                showMessage('🔍 ¡Herramientas de búsqueda de grupos abiertas!', 'info');
              }, 1500);
            }
          });
        };
        
        // Verificar si ya estamos en Facebook
        if (activeTab.url && activeTab.url.includes('facebook.com')) {
          console.log('Ya estamos en Facebook, verificando si estamos en la home...');
          
          // Si estamos en la home de Facebook o en una página principal
          if (activeTab.url.includes('facebook.com') && 
              (activeTab.url === 'https://www.facebook.com/' || 
               activeTab.url === 'https://www.facebook.com' ||
               activeTab.url.includes('facebook.com/?') ||
               activeTab.url.includes('facebook.com/home'))) {
            // Ya estamos en la home, abrir sidebar directamente
            openGroupSearchSidebar(activeTab.id);
            window.close();
          } else {
            // Estamos en Facebook pero no en la home, redirigir a la home
            console.log('Redirigiendo a la home de Facebook...');
            chrome.tabs.update(activeTab.id, { url: 'https://www.facebook.com/' }, function() {
              // Esperar a que la página se cargue completamente
              chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo, tab) {
                if (tabId === activeTab.id && changeInfo.status === 'complete') {
                  chrome.tabs.onUpdated.removeListener(listener);
                  
                  // Esperar un momento para que la interfaz esté lista
                  setTimeout(() => {
                    openGroupSearchSidebar(tabId);
                  }, 2000);
                }
              });
            });
            window.close();
          }
        } else {
          // No estamos en Facebook, navegar a la home de Facebook
          console.log('Navegando a la home de Facebook...');
          chrome.tabs.update(activeTab.id, { url: 'https://www.facebook.com/' }, function() {
            showMessage('📱 Abriendo Facebook con herramientas de búsqueda...', 'info');
            
            // Esperar a que la página se cargue completamente
            chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo, tab) {
              if (tabId === activeTab.id && changeInfo.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);
                
                // Esperar un momento adicional para que la interfaz esté lista
                setTimeout(() => {
                  openGroupSearchSidebar(tabId);
                }, 2500);
              }
            });
            
            window.close();
          });
        }
      });
    });
  }
  
  // Evento para Interactuar
  if (interactBtn) {
    interactBtn.addEventListener('click', function() {
      isOnFacebook((isFacebook, activeTab) => {
        if (isFacebook) {
          // Verificar si estamos en un grupo de Facebook
          if (activeTab.url.includes('facebook.com/groups/')) {
            // Ya estamos en un grupo, abrimos la interfaz de interacción
            chrome.tabs.sendMessage(activeTab.id, {
              action: 'openInteractionUI'
            }, function(response) {
              // Si hay un error o no hay respuesta
              if (!response || response.error) {
                console.error('Error al abrir la interfaz de interacción:', response?.error || 'No hay respuesta');
                showMessage('Error al abrir la interfaz de interacción', 'error');
              }
              window.close();
            });
          } else {
            // Estamos en Facebook pero no en un grupo
            showMessage('La función de interacción solo está disponible en grupos de Facebook', 'error');
          }
        } else {
          // No estamos en Facebook, primero navegamos a Facebook
          console.log('Navegando a Facebook...');
          chrome.tabs.update(activeTab.id, { url: 'https://www.facebook.com' }, function() {
            // Mostrar mensaje informando que debe navegar a un grupo
            showMessage('Para usar la función de interacción, navegue a un grupo de Facebook', 'info');
            window.close();
          });
        }
      });
    });
  }
  
  // Evento para Informes y estadísticas
  if (reportsBtn) {
    reportsBtn.addEventListener('click', function() {
      showMessage('Esta función estará disponible próximamente', 'info');
    });
  }
  
  // Evento para Opciones
  if (optionsBtn) {
    optionsBtn.addEventListener('click', function() {
      // Redirigir a la página de opciones
      window.location.href = 'options.html';
    });
  }
  
  // Evento para Contacto y Soporte
  if (contactBtn) {
    contactBtn.addEventListener('click', function() {
      showMessage('Esta función estará disponible próximamente', 'info');
    });
  }
  } // Fin de initializeUI
});
