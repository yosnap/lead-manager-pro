/**
 * Script para manejar la autenticación en el sidebar
 */
document.addEventListener('DOMContentLoaded', function() {
  const authCheckContainer = document.getElementById('auth-check-container');
  const sidebarContent = document.getElementById('sidebar-content');
  
  // Función para verificar autenticación
  function checkAuthentication() {
    console.log('Verificando autenticación en sidebar...');
    
    // Acceder directamente a chrome.storage para verificar autenticación
    chrome.storage.local.get(['lmp_auth', 'lmp_auth_user'], function(localResult) {
      const isAuthenticated = localResult.lmp_auth === true;
      const username = localResult.lmp_auth_user;
      
      console.log('Estado de autenticación (storage.local):', isAuthenticated);
      
      if (isAuthenticated) {
        // Usuario autenticado, mostrar contenido del sidebar
        authCheckContainer.style.display = 'none';
        sidebarContent.style.display = 'block';
        
        if (username) {
          console.log('Usuario autenticado:', username);
          // Aquí podríamos personalizar la UI con el nombre del usuario si es necesario
        }
      } else {
        // Si no está en local, verificar en sync
        chrome.storage.sync.get(['lmp_auth', 'lmp_auth_user'], function(syncResult) {
          const isAuthSync = syncResult.lmp_auth === true;
          const usernameSync = syncResult.lmp_auth_user;
          
          console.log('Estado de autenticación (storage.sync):', isAuthSync);
          
          if (isAuthSync) {
            // Usuario autenticado, mostrar contenido del sidebar
            authCheckContainer.style.display = 'none';
            sidebarContent.style.display = 'block';
            
            if (usernameSync) {
              console.log('Usuario autenticado:', usernameSync);
              // Aquí podríamos personalizar la UI con el nombre del usuario si es necesario
            }
          } else {
            // Usuario no autenticado, mostrar mensaje de acceso restringido
            authCheckContainer.style.display = 'flex';
            sidebarContent.style.display = 'none';
          }
        });
      }
    });
  }
  
  // Verificar autenticación al cargar
  checkAuthentication();
  
  // Configurar botón de redirección a login
  document.getElementById('login-redirect-btn').addEventListener('click', function() {
    // Enviar mensaje al content script para abrir la página de login
    window.parent.postMessage({ action: 'openLoginPage' }, '*');
  });
  
  // Escuchar mensajes del content script
  window.addEventListener('message', function(event) {
    // Verificar que el mensaje tiene la estructura esperada
    if (!event.data || typeof event.data !== 'object') return;
    
    if (event.data.action === 'refresh_auth') {
      // Refrescar el estado de autenticación
      checkAuthentication();
    }
  });
});
