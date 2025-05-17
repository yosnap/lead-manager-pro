document.addEventListener('DOMContentLoaded', function() {
  // Referencias a los elementos del menú
  const accountSettingsBtn = document.getElementById('account-settings');
  const searchSaveBtn = document.getElementById('search-save');
  const interactBtn = document.getElementById('interact');
  const reportsBtn = document.getElementById('reports');
  const settingsBtn = document.getElementById('settings');
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
  
  // Evento para Ajustes de la extensión
  if (settingsBtn) {
    settingsBtn.addEventListener('click', function() {
      window.location.href = 'settings.html';
    });
  }
  
  // Evento para Buscar y guardar
  if (searchSaveBtn) {
    searchSaveBtn.addEventListener('click', function() {
      isOnFacebook((isFacebook, activeTab) => {
        if (isFacebook) {
          // Ya estamos en Facebook, abrimos directamente el sidebar
          console.log('Enviando mensaje para abrir el sidebar');
          
          // Establecer un timeout para mostrar un mensaje en caso de que no haya respuesta
          const timeoutId = setTimeout(() => {
            console.log('No se recibió respuesta, asumiendo que el sidebar se abrió correctamente');
            window.close();
          }, 1000);
          
          chrome.tabs.sendMessage(activeTab.id, {
            action: 'openSidebar'
          }, function(response) {
            // Limpiar el timeout ya que obtuvimos respuesta
            clearTimeout(timeoutId);
            
            // Incluso si hay error o no hay respuesta, cerrar el popup
            // Esto es porque en algunos casos Chrome puede desconectar la respuesta
            // pero el comando sí se ejecutó correctamente
            if (!response) {
              console.log('No se recibió respuesta, pero asumiremos que el sidebar se abrió');
            } else if (response.error) {
              console.error('Error al abrir el sidebar:', response.error);
              showMessage('Error al abrir el panel lateral', 'error');
            } else {
              console.log('Sidebar abierto correctamente');
            }
            window.close();
          });
        } else {
          // No estamos en Facebook, primero navegamos a Facebook
          console.log('Navegando a Facebook...');
          chrome.tabs.update(activeTab.id, { url: 'https://www.facebook.com' }, function() {
            // Esperar a que la página se cargue completamente
            chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo, tab) {
              // Verificar que es la pestaña correcta y que ha terminado de cargar
              if (tabId === activeTab.id && changeInfo.status === 'complete') {
                // Eliminar el listener para evitar múltiples llamadas
                chrome.tabs.onUpdated.removeListener(listener);
                
                // Esperar un momento adicional para asegurar que la interfaz esté lista
                setTimeout(() => {
                  // Intentar abrir el sidebar
                  console.log('Enviando mensaje para abrir el sidebar después de navegar');
                  
                  // Establecer un timeout para mostrar un mensaje en caso de que no haya respuesta
                  const timeoutId = setTimeout(() => {
                    console.log('No se recibió respuesta después de navegar, asumiendo que el sidebar se abrió correctamente');
                    window.close();
                  }, 1500);
                  
                  chrome.tabs.sendMessage(tabId, {
                    action: 'openSidebar'
                  }, function(response) {
                    // Limpiar el timeout ya que obtuvimos respuesta
                    clearTimeout(timeoutId);
                    
                    // Manejar errores pero cerrar el popup de todas formas
                    if (!response) {
                      console.log('No se recibió respuesta después de navegar, pero asumiremos que el sidebar se abrió');
                    } else if (response.error) {
                      console.error('Error al abrir el sidebar después de navegar:', response.error);
                      showMessage('Error al abrir el panel lateral', 'error');
                    } else {
                      console.log('Sidebar abierto correctamente después de navegar');
                    }
                    window.close();
                  });
                }, 2000); // Incrementamos el tiempo de espera a 2 segundos para asegurar que todo cargue
                
                window.close();
              }
            });
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
  
  // Evento para Informes y estadísticas (en construcción)
  if (reportsBtn) {
    reportsBtn.addEventListener('click', function() {
      showMessage('Esta función estará disponible próximamente', 'info');
    });
  }
  
  // Evento para Contacto y Soporte (en construcción)
  if (contactBtn) {
    contactBtn.addEventListener('click', function() {
      showMessage('Esta función estará disponible próximamente', 'info');
    });
  }
});
