// Constantes
const SELECTORS = {
  SEARCH_RESULTS: 'div[role="article"]',
  PROFILE_LINK: 'a[href*="/profile.php"], a[href*="facebook.com/"]',
  ADD_FRIEND_BUTTON: 'div[aria-label="Añadir a amigos"], div[aria-label="Agregar a amigos"], div[aria-label="Add Friend"]',
  MESSENGER_BUTTON: 'div[aria-label="Enviar mensaje"], div[aria-label="Message"]',
  MESSAGE_INPUT: 'div[contenteditable="true"][role="textbox"]',
  SEND_BUTTON: 'div[aria-label="Enviar"], div[aria-label="Press Enter to send"]'
};

// Estado local
let state = {
  isProcessing: false,
  currentAction: null
};

// Escuchar mensajes del background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script recibió mensaje:', message);
  
  switch (message.action) {
    case 'find_profiles':
      findProfiles().then(sendResponse);
      break;
    case 'select_profile':
      selectProfile(message.index).then(sendResponse);
      break;
    case 'extract_profile_data':
      extractProfileData().then(sendResponse);
      break;
    case 'send_friend_request':
      sendFriendRequest().then(sendResponse);
      break;
    case 'open_messenger':
      openMessenger().then(sendResponse);
      break;
    case 'send_message':
      sendMessage(message.text).then(sendResponse);
      break;
    default:
      sendResponse({ success: false, message: 'Acción no reconocida' });
  }
  
  // Devolver true para indicar que se manejará de forma asíncrona
  return true;
});

// Función para encontrar perfiles en la página de resultados de búsqueda
async function findProfiles() {
  try {
    console.log('Buscando perfiles...');
    
    // Esperar a que los resultados se carguen
    await waitForElement(SELECTORS.SEARCH_RESULTS);
    
    // Obtener todos los resultados
    const results = document.querySelectorAll(SELECTORS.SEARCH_RESULTS);
    console.log(`Encontrados ${results.length} resultados`);
    
    if (results.length === 0) {
      return { success: false, message: 'No se encontraron resultados' };
    }
    
    // Filtrar solo perfiles personales (esto requeriría un análisis más detallado)
    const profiles = Array.from(results).slice(0, 10); // Limitar a 10 por ahora
    
    return {
      success: true,
      profiles: profiles.map((profile, index) => ({
        index,
        text: profile.textContent.substring(0, 100) // Texto resumido para identificación
      }))
    };
  } catch (error) {
    console.error('Error al buscar perfiles:', error);
    return { success: false, message: error.message };
  }
}

// Función para seleccionar un perfil específico
async function selectProfile(index) {
  try {
    console.log(`Seleccionando perfil con índice ${index}...`);
    
    // Obtener todos los resultados
    const results = document.querySelectorAll(SELECTORS.SEARCH_RESULTS);
    
    if (!results[index]) {
      return { success: false, message: 'Perfil no encontrado' };
    }
    
    // Encontrar el enlace al perfil
    const profileLink = results[index].querySelector(SELECTORS.PROFILE_LINK);
    
    if (!profileLink) {
      return { success: false, message: 'Enlace al perfil no encontrado' };
    }
    
    // Obtener la URL del perfil
    const profileUrl = profileLink.href;
    
    return {
      success: true,
      profileUrl
    };
  } catch (error) {
    console.error('Error al seleccionar perfil:', error);
    return { success: false, message: error.message };
  }
}

// Función para extraer datos del perfil
async function extractProfileData() {
  try {
    console.log('Extrayendo datos del perfil...');
    
    // Esta función requeriría un análisis detallado de la estructura de la página de perfil
    // Por ahora, solo recopilamos información básica
    
    const name = document.title.replace(' | Facebook', '');
    
    // Recopilar publicaciones recientes (esto es simplificado)
    const posts = Array.from(document.querySelectorAll('div[role="article"]')).map(post => ({
      text: post.textContent.substring(0, 200),
      timestamp: post.querySelector('a[href*="/posts/"] span')?.textContent || 'Desconocido'
    })).slice(0, 5); // Limitar a 5 publicaciones
    
    return {
      success: true,
      profileData: {
        name,
        url: window.location.href,
        posts
      }
    };
  } catch (error) {
    console.error('Error al extraer datos del perfil:', error);
    return { success: false, message: error.message };
  }
}

// Función para enviar solicitud de amistad
async function sendFriendRequest() {
  try {
    console.log('Enviando solicitud de amistad...');
    
    // Esperar a que el botón de añadir amigo esté disponible
    const addFriendButton = await waitForElement(SELECTORS.ADD_FRIEND_BUTTON);
    
    // Simular clic en el botón
    addFriendButton.click();
    
    // Esperar un momento para confirmar
    await sleep(1000);
    
    return { success: true, message: 'Solicitud de amistad enviada' };
  } catch (error) {
    console.error('Error al enviar solicitud de amistad:', error);
    return { success: false, message: error.message };
  }
}

// Función para abrir Messenger
async function openMessenger() {
  try {
    console.log('Abriendo Messenger...');
    
    // Esperar a que el botón de Messenger esté disponible
    const messengerButton = await waitForElement(SELECTORS.MESSENGER_BUTTON);
    
    // Simular clic en el botón
    messengerButton.click();
    
    // Esperar a que se abra la ventana de chat
    await sleep(2000);
    
    return { success: true, message: 'Messenger abierto' };
  } catch (error) {
    console.error('Error al abrir Messenger:', error);
    return { success: false, message: error.message };
  }
}

// Función para enviar un mensaje
async function sendMessage(text) {
  try {
    console.log(`Enviando mensaje: ${text}`);
    
    if (!text) {
      return { success: false, message: 'Texto del mensaje vacío' };
    }
    
    // Esperar a que el campo de entrada esté disponible
    const messageInput = await waitForElement(SELECTORS.MESSAGE_INPUT);
    
    // Simular escritura en el campo
    messageInput.focus();
    messageInput.textContent = text;
    
    // Disparar evento de input para activar el botón de envío
    messageInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Esperar un momento
    await sleep(500);
    
    // Buscar el botón de envío
    const sendButton = document.querySelector(SELECTORS.SEND_BUTTON);
    
    if (sendButton) {
      // Si hay botón de envío, hacer clic en él
      sendButton.click();
    } else {
      // Si no hay botón, simular presionar Enter
      messageInput.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true
      }));
    }
    
    // Esperar a que se envíe el mensaje
    await sleep(1000);
    
    return { success: true, message: 'Mensaje enviado' };
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    return { success: false, message: error.message };
  }
}

// Función de utilidad para esperar a que un elemento esté disponible
function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    
    if (element) {
      return resolve(element);
    }
    
    const observer = new MutationObserver((mutations) => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Establecer un tiempo límite
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Tiempo de espera agotado para el selector: ${selector}`));
    }, timeout);
  });
}

// Función de utilidad para esperar
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Inicialización
console.log('Snap Lead Manager content script cargado');
