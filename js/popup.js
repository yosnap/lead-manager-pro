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
  
  // Abrir la búsqueda (basado en la pestaña activa)
  openSidebarButton.addEventListener('click', function() {
    // Determinar qué pestaña está activa
    const activeTab = document.querySelector('.tabs li.active');
    if (!activeTab) return;
    
    const tabId = activeTab.getAttribute('data-tab');
    
    // Guardar las opciones primero
    saveOptions();
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const activeTabChrome = tabs[0];
      
      // Verificar si la URL es de Facebook
      if (activeTabChrome.url.includes('facebook.com')) {
        // Comportamiento según la pestaña activa
        if (tabId === 'tab-groups') {
          // Para búsqueda de grupos, iniciar directamente la búsqueda
          startGroupSearchDirectly(activeTabChrome.id);
        } else {
          // Para otros tipos, usar el comportamiento por defecto
          chrome.tabs.sendMessage(activeTabChrome.id, {action: 'openSidebar'});
        }
        window.close();
      } else {
        showMessage('Esta extensión solo funciona en Facebook', 'error');
      }
    });
  });
  
  // Función para iniciar la búsqueda directamente usando los criterios actuales
  function startGroupSearchDirectly(tabId) {
    // Primero obtenemos las opciones guardadas
    const searchOptions = JSON.parse(localStorage.getItem('groupSearchOptions') || '{}');
    
    // Enviar mensaje al content script para iniciar la búsqueda directamente
    chrome.tabs.sendMessage(tabId, {
      action: 'startSearchDirectly',
      searchType: 'groups',
      options: {
        publicGroups: searchOptions.groupPublic !== undefined ? searchOptions.groupPublic : true,
        privateGroups: searchOptions.groupPrivate !== undefined ? searchOptions.groupPrivate : true,
        minUsers: searchOptions.minUsers || 100,
        minPostsYear: searchOptions.minPostsYear,
        minPostsMonth: searchOptions.minPostsMonth,
        minPostsDay: searchOptions.minPostsDay
      }
    });
  }
  
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
      console.log('Opciones cargadas:', result);
      
      // Opciones generales
      if (result.maxScrolls) maxScrolls.value = result.maxScrolls;
      if (result.scrollDelay) scrollDelay.value = result.scrollDelay;
      
      // Opciones de grupos
      if (result.groupPublic !== undefined) groupPublic.checked = result.groupPublic;
      if (result.groupPrivate !== undefined) groupPrivate.checked = result.groupPrivate;
      if (result.minUsers) minUsers.value = result.minUsers;
      
      // Para valores que pueden ser vacíos, verificar específicamente
      if (result.minPostsYear !== undefined && result.minPostsYear !== '') {
        minPostsYear.value = result.minPostsYear;
      } else {
        minPostsYear.value = '';
      }
      
      if (result.minPostsMonth !== undefined && result.minPostsMonth !== '') {
        minPostsMonth.value = result.minPostsMonth;
      } else {
        minPostsMonth.value = '';
      }
      
      if (result.minPostsDay !== undefined && result.minPostsDay !== '') {
        minPostsDay.value = result.minPostsDay;
      } else {
        minPostsDay.value = '';
      }
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
      
      // Permitir valores vacíos para publicaciones mínimas
      minPostsYear: minPostsYear.value === '' ? '' : parseInt(minPostsYear.value),
      minPostsMonth: minPostsMonth.value === '' ? '' : parseInt(minPostsMonth.value),
      minPostsDay: minPostsDay.value === '' ? '' : parseInt(minPostsDay.value)
    };
    
    // Guardar en localStorage y chrome.storage.local
    localStorage.setItem('groupSearchOptions', JSON.stringify(options));
    
    chrome.storage.local.set(options, function() {
      console.log('Opciones guardadas en chrome.storage:', options);
    });
    
    // Enviar mensaje al script de contenido para actualizar las opciones
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'updateOptions',
          options: options
        });
      }
    });
    
    // Preparar los datos para sincronizar con la base de datos en el futuro
    syncOptionsWithDatabase(options);
  }
  
  // Función para sincronizar con la base de datos en el futuro
  function syncOptionsWithDatabase(options) {
    // Esta función enviará las opciones a la base de datos cuando esté disponible
    console.log('Opciones para sincronizar con BD:', options);
    
    // Aquí se implementará la llamada a la API o servicio que almacenará las opciones
    // Por ahora, solo guardamos las opciones en localStorage para uso futuro
    try {
      // Guardar también en un formato específico para la sincronización con la BD
      const syncData = {
        timestamp: Date.now(),
        userId: localStorage.getItem('snap_lead_manager_user_id') || 'anonymous',
        options: options
      };
      
      localStorage.setItem('snap_lead_manager_sync_data', JSON.stringify(syncData));
      
      // En el futuro, aquí se realizará la llamada a la API
      /*
      fetch('https://api.example.com/sync-options', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(syncData)
      })
      .then(response => response.json())
      .then(data => {
        console.log('Opciones sincronizadas correctamente:', data);
      })
      .catch(error => {
        console.error('Error al sincronizar opciones:', error);
      });
      */
      
    } catch (error) {
      console.error('Error al preparar datos para sincronización:', error);
    }
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
