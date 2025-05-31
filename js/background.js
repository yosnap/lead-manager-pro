// Background script para manejar la comunicación entre el popup y la página de Facebook

// Escuchar mensajes del popup de interacción
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script recibió mensaje:', message);
  
  // Si el mensaje es para abrir la página de login
  if (message.action === 'openLoginPage') {
    // Verificar si debemos forzar la apertura en una nueva pestaña
    if (message.forceNewTab) {
      // Abrir la página de login en una nueva pestaña
      chrome.tabs.create({ url: chrome.runtime.getURL('popup/login.html') });
    } else {
      // Intentar abrir el popup (puede no funcionar desde un content script)
      try {
        chrome.action.openPopup();
      } catch (error) {
        console.error('Error al abrir popup:', error);
        // Fallback: abrir en nueva pestaña
        chrome.tabs.create({ url: chrome.runtime.getURL('popup/login.html') });
      }
    }
    return true;
  }
  
  // Si el mensaje es para notificar al sidebar sobre cambios en la autenticación
  if (message.action === 'notifySidebarAuthChange') {
    console.log('Background: Notificando cambio de autenticación a las pestañas activas');
    
    // Enviar mensaje a todas las pestañas activas de Facebook
    chrome.tabs.query({url: "*://*.facebook.com/*"}, function(tabs) {
      tabs.forEach(function(tab) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'refreshAuthStatus'
        }, function(response) {
          // Ignorar errores de comunicación (algunas pestañas pueden no tener el content script)
          if (chrome.runtime.lastError) {
            console.log('Background: No se pudo notificar a la pestaña', tab.id);
          } else {
            console.log('Background: Notificación enviada a la pestaña', tab.id);
          }
        });
      });
    });
    
    return true;
  }
  
  // Si el mensaje es para iniciar la interacción desde el popup
  if (message.action === 'startInteractionFromPopup') {
    // Obtener la pestaña activa donde queremos ejecutar la interacción
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs.length === 0) {
        sendResponse({success: false, error: 'No se encontró la pestaña activa'});
        return;
      }
      
      const activeTab = tabs[0];
      
      // Verificar si estamos en una página de grupo de Facebook
      if (!activeTab.url.includes('facebook.com/groups/')) {
        sendResponse({success: false, error: 'Debes estar en la página de un grupo de Facebook'});
        return;
      }
      
      // Guardar configuración
      const config = message.config || {};
      chrome.storage.local.set({ 'leadManagerGroupSettings': config }, function() {
        console.log('Configuración guardada en background:', config);
        
        // Añadir un retraso para asegurar que la configuración se guarde
        setTimeout(() => {
          // Enviar el mensaje al content script en la pestaña activa
          chrome.tabs.sendMessage(activeTab.id, {
            action: 'startInteractionWithMembers',
            sectionType: message.sectionType
          }, function(response) {
            // Manejar errores de comunicación
            if (chrome.runtime.lastError) {
              console.error('Error al enviar mensaje al content script:', chrome.runtime.lastError);
              sendResponse({success: false, error: 'No se pudo contactar con la página. Intenta recargar la página.'});
            } else {
              // Enviar la respuesta del content script de vuelta al popup
              sendResponse(response || {success: true});
            }
          });
        }, 500);
      });
    });
    
    // Mantener el canal de mensajes abierto para respuesta asíncrona
    return true;
  }
});

// Manejar instalación o actualización
chrome.runtime.onInstalled.addListener(function(details) {
  console.log('Lead Manager Pro instalado/actualizado:', details.reason);
  
  // Si es una nueva instalación, establecer valores predeterminados
  if (details.reason === 'install') {
    const defaultSettings = {
      messageToSend: 'Hola, este es un mensaje de prueba desde la plataforma, has caso omiso ya que solo sirve para pruebas. !Un saludo!',
      autoCloseChat: true,
      interactionDelay: 2,
      delay: 2000,
      membersToInteract: 10,
      maxMembers: 10,
      lastMemberType: 'admins'
    };
    
    chrome.storage.local.set({ 'leadManagerGroupSettings': defaultSettings }, function() {
      console.log('Configuración inicial establecida:', defaultSettings);
    });
  }
});
