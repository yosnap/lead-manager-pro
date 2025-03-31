document.addEventListener('DOMContentLoaded', function() {
  // Variables para los elementos del DOM
  const tabLinks = document.querySelectorAll('.tabs li');
  const tabContents = document.querySelectorAll('.tab-content');
  const saveButton = document.getElementById('save-options-btn');
  const openSidebarButton = document.getElementById('open-sidebar-btn');
  
  // Variables para los campos de opciones
  const maxScrolls = document.getElementById('max-scrolls');
  const scrollDelay = document.getElementById('scroll-delay');
  const groupPublic = document.getElementById('group-public');
  const groupPrivate = document.getElementById('group-private');
  const minUsers = document.getElementById('min-users');
  const minPostsYear = document.getElementById('min-posts-year');
  const minPostsMonth = document.getElementById('min-posts-month');
  const minPostsDay = document.getElementById('min-posts-day');
  
  // Cargar opciones guardadas
  loadOptions();
  
  // Función para cambiar entre pestañas
  function switchTab(clickedTab) {
    // Quitar clase activa de todas las pestañas
    tabLinks.forEach(tab => tab.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Activar la pestaña clickeada
    clickedTab.classList.add('active');
    
    // Activar el contenido correspondiente
    const tabId = clickedTab.getAttribute('data-tab');
    document.getElementById(tabId).classList.add('active');
  }
  
  // Agregar evento click a las pestañas
  tabLinks.forEach(tab => {
    tab.addEventListener('click', function() {
      switchTab(this);
    });
  });
  
  // Guardar opciones
  saveButton.addEventListener('click', function() {
    saveOptions();
    showSavedMessage();
  });
  
  // Abrir la barra lateral
  openSidebarButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const activeTab = tabs[0];
      
      // Verificar si la URL es de Facebook
      if (activeTab.url.includes('facebook.com')) {
        chrome.tabs.sendMessage(activeTab.id, {action: 'openSidebar'});
        window.close();
      } else {
        showMessage('Esta extensión solo funciona en Facebook', 'error');
      }
    });
  });
  
  // Función para cargar opciones guardadas
  function loadOptions() {
    chrome.storage.local.get([
      'maxScrolls',
      'scrollDelay',
      'groupPublic',
      'groupPrivate',
      'minUsers',
      'minPostsYear',
      'minPostsMonth',
      'minPostsDay'
    ], function(result) {
      // Opciones generales
      if (result.maxScrolls) maxScrolls.value = result.maxScrolls;
      if (result.scrollDelay) scrollDelay.value = result.scrollDelay;
      
      // Opciones de grupos
      if (result.groupPublic !== undefined) groupPublic.checked = result.groupPublic;
      if (result.groupPrivate !== undefined) groupPrivate.checked = result.groupPrivate;
      if (result.minUsers) minUsers.value = result.minUsers;
      if (result.minPostsYear) minPostsYear.value = result.minPostsYear;
      if (result.minPostsMonth) minPostsMonth.value = result.minPostsMonth;
      if (result.minPostsDay) minPostsDay.value = result.minPostsDay;
    });
  }
  
  // Función para guardar opciones
  function saveOptions() {
    const options = {
      // Opciones generales
      maxScrolls: parseInt(maxScrolls.value) || 50,
      scrollDelay: parseFloat(scrollDelay.value) || 2,
      
      // Opciones de grupos
      groupPublic: groupPublic.checked,
      groupPrivate: groupPrivate.checked,
      minUsers: parseInt(minUsers.value) || 100,
      minPostsYear: parseInt(minPostsYear.value) || 10,
      minPostsMonth: parseInt(minPostsMonth.value) || 5,
      minPostsDay: parseInt(minPostsDay.value) || 1
    };
    
    chrome.storage.local.set(options, function() {
      console.log('Opciones guardadas');
    });
    
    // Enviar mensaje al script de contenido para actualizar las opciones
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'updateOptions',
        options: options
      });
    });
    
    // TODO: Enviar datos a la base de datos en el futuro
  }
  
  // Función para mostrar un mensaje después de guardar
  function showSavedMessage() {
    const messageElement = document.createElement('div');
    messageElement.classList.add('save-message');
    messageElement.textContent = 'Opciones guardadas correctamente';
    
    // Estilo para el mensaje
    messageElement.style.position = 'fixed';
    messageElement.style.bottom = '60px';
    messageElement.style.left = '50%';
    messageElement.style.transform = 'translateX(-50%)';
    messageElement.style.padding = '8px 15px';
    messageElement.style.backgroundColor = 'var(--success-color)';
    messageElement.style.color = 'white';
    messageElement.style.borderRadius = '4px';
    messageElement.style.zIndex = '1000';
    
    document.body.appendChild(messageElement);
    
    // Eliminar el mensaje después de 2 segundos
    setTimeout(() => {
      messageElement.remove();
    }, 2000);
  }
  
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
    messageElement.style.backgroundColor = type === 'error' ? 'var(--error-color)' : 'var(--success-color)';
    messageElement.style.color = 'white';
    messageElement.style.borderRadius = '4px';
    messageElement.style.zIndex = '1000';
    
    document.body.appendChild(messageElement);
    
    // Eliminar el mensaje después de 3 segundos
    setTimeout(() => {
      messageElement.remove();
    }, 3000);
  }
});
