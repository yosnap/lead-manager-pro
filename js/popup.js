// Elementos del DOM
const searchTermInput = document.getElementById('search-term');
const searchBtn = document.getElementById('search-btn');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const stopBtn = document.getElementById('stop-btn');
const statusMessage = document.getElementById('status-message');
const progressBar = document.getElementById('progress-bar');

// Estado de la aplicación
let isRunning = false;
let isPaused = false;
let popupWindow = null;

// Función para actualizar el estado visual
function updateStatus(message, progress = 0) {
  statusMessage.textContent = message;
  progressBar.style.width = `${progress}%`;
}

// Función para abrir el popup en una ventana separada
function openPopupAsWindow() {
  // Solo abrir si no está ya abierto
  if (popupWindow && !popupWindow.closed) {
    popupWindow.focus();
    return;
  }
  
  const popupURL = chrome.runtime.getURL('popup.html');
  const width = 400;
  const height = 500;
  const left = (screen.width - width) / 2;
  const top = (screen.height - height) / 2;
  
  chrome.windows.create({
    url: popupURL,
    type: 'popup',
    width: width,
    height: height,
    left: Math.round(left),
    top: Math.round(top)
  }, (window) => {
    popupWindow = window;
    
    // Registrar esta ventana con el background script
    chrome.runtime.sendMessage({
      action: 'register_popup',
      windowId: window.id
    });
  });
}

// Manejador para el botón de búsqueda
searchBtn.addEventListener('click', () => {
  const searchTerm = searchTermInput.value.trim();
  
  if (!searchTerm) {
    updateStatus('Por favor, ingresa un término de búsqueda');
    return;
  }
  
  // Enviar mensaje al background script para realizar la búsqueda
  chrome.runtime.sendMessage({
    action: 'search',
    searchTerm: searchTerm
  }, response => {
    if (response && response.success) {
      updateStatus('Búsqueda iniciada', 10);
    } else {
      updateStatus('Error al iniciar la búsqueda');
    }
  });
});

// Manejador para el botón de inicio
startBtn.addEventListener('click', () => {
  if (isRunning) return;
  
  isRunning = true;
  isPaused = false;
  
  // Actualizar estado de los botones
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  stopBtn.disabled = false;
  
  // Enviar mensaje al background script para iniciar el proceso
  chrome.runtime.sendMessage({
    action: 'start'
  }, response => {
    if (response && response.success) {
      updateStatus('Proceso iniciado', 20);
    } else {
      resetControls();
      updateStatus('Error al iniciar el proceso');
    }
  });
});

// Manejador para el botón de pausa
pauseBtn.addEventListener('click', () => {
  if (!isRunning || isPaused) return;
  
  isPaused = true;
  
  // Actualizar estado de los botones
  pauseBtn.disabled = true;
  
  // Enviar mensaje al background script para pausar el proceso
  chrome.runtime.sendMessage({
    action: 'pause'
  }, response => {
    if (response && response.success) {
      updateStatus('Proceso pausado');
    } else {
      isPaused = false;
      pauseBtn.disabled = false;
      updateStatus('Error al pausar el proceso');
    }
  });
});

// Manejador para el botón de detención
stopBtn.addEventListener('click', () => {
  if (!isRunning) return;
  
  // Enviar mensaje al background script para detener el proceso
  chrome.runtime.sendMessage({
    action: 'stop'
  }, response => {
    if (response && response.success) {
      resetControls();
      updateStatus('Proceso detenido', 0);
    } else {
      updateStatus('Error al detener el proceso');
    }
  });
});

// Función para resetear los controles
function resetControls() {
  isRunning = false;
  isPaused = false;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  stopBtn.disabled = true;
}

// Escuchar mensajes del background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'status_update') {
    updateStatus(message.message, message.progress || 0);
    
    // Si el proceso ha terminado, resetear los controles
    if (message.finished) {
      resetControls();
    }
  }
  
  // Siempre devolver true para indicar que se manejará de forma asíncrona
  return true;
});

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  // Verificar si estamos en un popup o en una ventana
  chrome.windows.getCurrent(window => {
    // Si es una ventana de tipo popup, no necesitamos abrir otra
    if (window.type === 'popup') {
      // Registrar esta ventana con el background script
      chrome.runtime.sendMessage({
        action: 'register_popup',
        windowId: window.id
      });
    } else {
      // Si no es un popup (es el popup normal de la extensión), 
      // añadir un botón para abrir en ventana
      const openWindowBtn = document.createElement('button');
      openWindowBtn.textContent = 'Abrir en ventana';
      openWindowBtn.classList.add('action-btn');
      openWindowBtn.style.marginTop = '20px';
      openWindowBtn.addEventListener('click', openPopupAsWindow);
      
      document.querySelector('.controls-section').appendChild(openWindowBtn);
    }
  });
  
  // Verificar el estado actual
  chrome.runtime.sendMessage({
    action: 'get_status'
  }, response => {
    if (response && response.isRunning) {
      isRunning = true;
      isPaused = response.isPaused || false;
      
      startBtn.disabled = true;
      pauseBtn.disabled = isPaused;
      stopBtn.disabled = false;
      
      updateStatus(response.message || 'Proceso en ejecución', response.progress || 0);
    } else {
      resetControls();
      updateStatus('Listo para comenzar', 0);
    }
  });
});
