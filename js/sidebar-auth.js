/**
 * Script para manejar la autenticación en el sidebar
 * Utiliza únicamente chrome.storage como método de almacenamiento
 */
document.addEventListener('DOMContentLoaded', function() {
  const authCheckContainer = document.getElementById('auth-check-container');
  const sidebarContent = document.getElementById('sidebar-content');
  let loginComponent = null;
  
  // Función para verificar autenticación
  function checkAuthentication() {
    console.log('Verificando autenticación en sidebar...');
    
    // Usar solo el módulo Auth centralizado
    if (window.LeadManagerPro && window.LeadManagerPro.Auth) {
      window.LeadManagerPro.Auth.isAuthenticated(function(isAuthenticated) {
        console.log('Estado de autenticación:', isAuthenticated);
        
        if (isAuthenticated) {
          showAuthenticatedContent();
        } else {
          showLoginForm();
        }
      });
    } else {
      console.error('Módulo de autenticación no disponible');
      showLoginForm();
    }
  }
  
  function showAuthenticatedContent() {
    authCheckContainer.style.display = 'none';
    sidebarContent.style.display = 'block';
    
    // Destruir componente de login si existe
    if (loginComponent) {
      loginComponent.destroy();
      loginComponent = null;
    }
    
    // Obtener información del usuario para personalización
    if (window.LeadManagerPro && window.LeadManagerPro.Auth) {
      window.LeadManagerPro.Auth.getUserInfo(function(userInfo) {
        if (userInfo.username) {
          console.log('Usuario autenticado:', userInfo.username);
          // Aquí se puede personalizar la UI con el nombre del usuario
          updateUserInterface(userInfo.username);
        }
      });
    }
  }
  
  function showLoginForm() {
    authCheckContainer.style.display = 'flex';
    sidebarContent.style.display = 'none';
    
    // Primero intentar usar el componente LoginComponent si está disponible
    if (window.LeadManagerPro && window.LeadManagerPro.LoginComponent) {
      // Reemplazar el contenido del contenedor de auth con el componente de login
      authCheckContainer.innerHTML = '<div id="sidebar-login-container"></div>';
      
      loginComponent = new window.LeadManagerPro.LoginComponent('sidebar-login-container');
      loginComponent.onSuccess(() => {
        console.log('Login exitoso desde LoginComponent');
        checkAuthentication(); // Revalidar autenticación
      });
    } else {
      // Fallback: usar formulario inline integrado
      authCheckContainer.innerHTML = createFallbackLoginMessage();
      
      // Cargar credenciales guardadas después de crear el formulario
      setTimeout(() => {
        loadSavedCredentialsInline();
      }, 100);
    }
  }
  
  function createFallbackLoginMessage() {
    return `
      <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; 
                  background-color: #f0f2f5; color: #1c1e21; padding: 20px; text-align: center; height: 100%;">
        <div style="width: 80px; height: 80px; margin-bottom: 20px;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#4267B2">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
          </svg>
        </div>
        <h2 style="font-size: 18px; margin-bottom: 20px; color: #1c1e21;">Lead Manager Pro</h2>
        
        <!-- Formulario de login integrado -->
        <div style="width: 100%; max-width: 300px; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <form id="sidebar-inline-login-form" style="width: 100%;">
            <div style="margin-bottom: 18px;">
              <label for="sidebar-inline-username" style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500; color: #1c1e21; text-align: left;">Usuario</label>
              <input type="text" id="sidebar-inline-username" name="username" required 
                     style="width: 100%; padding: 12px 14px; border: 1px solid #dddfe2; border-radius: 6px; font-size: 14px; box-sizing: border-box; transition: border-color 0.2s; background: #ffffff;"
                     placeholder="Ingresa tu usuario"
                     onfocus="this.style.borderColor='#4267B2'; this.style.boxShadow='0 0 0 2px rgba(66, 103, 178, 0.2)'"
                     onblur="this.style.borderColor='#dddfe2'; this.style.boxShadow='none'">
            </div>
            
            <div style="margin-bottom: 18px;">
              <label for="sidebar-inline-password" style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500; color: #1c1e21; text-align: left;">Contraseña</label>
              <div style="position: relative;">
                <input type="password" id="sidebar-inline-password" name="password" required 
                       style="width: 100%; padding: 12px 40px 12px 14px; border: 1px solid #dddfe2; border-radius: 6px; font-size: 14px; box-sizing: border-box; transition: border-color 0.2s; background: #ffffff;"
                       placeholder="Ingresa tu contraseña"
                       onfocus="this.style.borderColor='#4267B2'; this.style.boxShadow='0 0 0 2px rgba(66, 103, 178, 0.2)'"
                       onblur="this.style.borderColor='#dddfe2'; this.style.boxShadow='none'">
                <button type="button" id="sidebar-toggle-password" 
                        style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #65676b; font-size: 14px; padding: 4px;"
                        title="Mostrar/Ocultar contraseña">👁</button>
              </div>
            </div>
            
            <div style="margin-bottom: 18px;">
              <label style="display: flex; align-items: center; cursor: pointer; font-size: 13px; color: #65676b;">
                <input type="checkbox" id="sidebar-inline-remember" name="remember" style="margin-right: 8px; width: auto;">
                Recordarme en este dispositivo
              </label>
            </div>
            
            <div id="sidebar-inline-login-error" style="display: none; background: #fee; border: 1px solid #fcc; color: #c33; padding: 10px 12px; border-radius: 6px; font-size: 13px; margin-bottom: 16px; text-align: center;"></div>
            
            <button type="submit" id="sidebar-inline-login-btn" 
                    style="width: 100%; padding: 12px 16px; background: #4267B2; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden;"
                    onmouseover="if(!this.disabled) this.style.background='#365899'"
                    onmouseout="if(!this.disabled) this.style.background='#4267B2'">
              <span class="btn-text">Iniciar Sesión</span>
              <span class="btn-loading" style="display: none; align-items: center; justify-content: center; gap: 8px;">
                <span style="display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite;"></span>
                Autenticando...
              </span>
            </button>
            
            <style>
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          </form>
          
          <div style="margin-top: 20px; padding: 15px; background: #f7f8fa; border-radius: 6px; font-size: 13px; color: #65676b; text-align: left;">
            <p style="margin: 0 0 8px 0; font-weight: 600; color: #1c1e21;">Credenciales de prueba:</p>
            <p style="margin: 0 0 4px 0;">Usuario: <code style="background: #e4e6ea; padding: 2px 4px; border-radius: 3px; font-family: Monaco, Menlo, monospace; font-size: 12px;">lunai</code></p>
            <p style="margin: 0;">Contraseña: <code style="background: #e4e6ea; padding: 2px 4px; border-radius: 3px; font-family: Monaco, Menlo, monospace; font-size: 12px;">lunai1234</code></p>
          </div>
        </div>
      </div>
    `;
  }
  
  function updateUserInterface(username) {
    // Actualizar elementos de la UI que muestren información del usuario
    const userElements = document.querySelectorAll('[data-user-info]');
    userElements.forEach(element => {
      element.textContent = username;
    });
    
    // Agregar información del usuario al header si existe
    const header = document.querySelector('header h1');
    if (header && !header.querySelector('.user-info')) {
      const userInfo = document.createElement('span');
      userInfo.className = 'user-info';
      userInfo.style.cssText = 'font-size: 12px; color: #65676b; margin-left: 10px;';
      userInfo.textContent = `(${username})`;
      header.appendChild(userInfo);
    }
  }
  
  // Verificar autenticación al cargar
  checkAuthentication();
  
  // Configurar eventos para el formulario inline y fallback
  document.addEventListener('click', function(event) {
    if (event.target.id === 'open-popup-btn') {
      // Fallback: intentar abrir el popup de la extensión
      try {
        chrome.runtime.sendMessage({ action: 'open_popup' });
      } catch (error) {
        console.error('Error al abrir popup:', error);
        alert('No se pudo abrir el panel de login. Haz clic en el icono de la extensión en la barra de herramientas.');
      }
    }
    
    // Manejar botón de mostrar/ocultar contraseña
    if (event.target.id === 'sidebar-toggle-password') {
      togglePasswordVisibility();
    }
  });
  
  // Manejar formulario de login integrado
  document.addEventListener('submit', function(event) {
    if (event.target.id === 'sidebar-inline-login-form') {
      event.preventDefault();
      handleInlineLogin();
    }
  });
  
  // Manejar tecla Enter en campos del formulario inline y validación en tiempo real
  document.addEventListener('keypress', function(event) {
    const target = event.target;
    if ((target.id === 'sidebar-inline-username' || target.id === 'sidebar-inline-password') && event.key === 'Enter') {
      event.preventDefault();
      handleInlineLogin();
    }
  });
  
  // Validación en tiempo real
  document.addEventListener('input', function(event) {
    const target = event.target;
    if (target.id === 'sidebar-inline-username' || target.id === 'sidebar-inline-password') {
      validateInlineForm();
    }
  });
  
  // Función para validar el formulario inline en tiempo real
  function validateInlineForm() {
    const usernameInput = document.getElementById('sidebar-inline-username');
    const passwordInput = document.getElementById('sidebar-inline-password');
    const submitBtn = document.getElementById('sidebar-inline-login-btn');
    
    if (usernameInput && passwordInput && submitBtn) {
      const isValid = usernameInput.value.trim().length > 0 && passwordInput.value.trim().length > 0;
      
      if (isValid) {
        submitBtn.style.opacity = '1';
        submitBtn.style.transform = 'translateY(0)';
      } else {
        submitBtn.style.opacity = '0.7';
        submitBtn.style.transform = 'translateY(1px)';
      }
    }
  }
  
  // Función para manejar el login desde el formulario inline
  function handleInlineLogin() {
    const usernameInput = document.getElementById('sidebar-inline-username');
    const passwordInput = document.getElementById('sidebar-inline-password');
    const rememberCheckbox = document.getElementById('sidebar-inline-remember');
    const errorElement = document.getElementById('sidebar-inline-login-error');
    const submitBtn = document.getElementById('sidebar-inline-login-btn');
    
    if (!usernameInput || !passwordInput || !submitBtn) {
      console.error('Elementos del formulario inline no encontrados');
      return;
    }
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const remember = rememberCheckbox ? rememberCheckbox.checked : false;
    
    // Validación básica
    if (!username || !password) {
      showInlineError('Por favor, completa todos los campos');
      return;
    }
    
    // Mostrar estado de carga
    setInlineLoadingState(true);
    hideInlineError();
    
    // Usar el módulo Auth global
    if (window.LeadManagerPro && window.LeadManagerPro.Auth) {
      window.LeadManagerPro.Auth.login(username, password, remember, function(success) {
        setInlineLoadingState(false);
        
        if (success) {
          console.log('Login exitoso desde formulario inline');
          // La función checkAuthentication se ejecutará automáticamente por el listener
          checkAuthentication();
        } else {
          showInlineError('Credenciales incorrectas. Usa: lunai / lunai1234');
        }
      });
    } else {
      setInlineLoadingState(false);
      showInlineError('Error: Módulo de autenticación no disponible');
    }
  }
  
  // Función para mostrar errores en el formulario inline
  function showInlineError(message) {
    const errorElement = document.getElementById('sidebar-inline-login-error');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
      
      // Auto-ocultar después de 5 segundos
      setTimeout(() => {
        hideInlineError();
      }, 5000);
    }
  }
  
  // Función para ocultar errores en el formulario inline
  function hideInlineError() {
    const errorElement = document.getElementById('sidebar-inline-login-error');
    if (errorElement) {
      errorElement.style.display = 'none';
      errorElement.textContent = '';
    }
  }
  
  // Función para establecer estado de carga en el formulario inline
  function setInlineLoadingState(isLoading) {
    const submitBtn = document.getElementById('sidebar-inline-login-btn');
    const btnText = submitBtn?.querySelector('.btn-text');
    const btnLoading = submitBtn?.querySelector('.btn-loading');
    
    if (submitBtn) {
      if (isLoading) {
        submitBtn.disabled = true;
        submitBtn.style.background = '#42659a';
        submitBtn.style.cursor = 'not-allowed';
        if (btnText) btnText.style.display = 'none';
        if (btnLoading) btnLoading.style.display = 'flex';
      } else {
        submitBtn.disabled = false;
        submitBtn.style.background = '#4267B2';
        submitBtn.style.cursor = 'pointer';
        if (btnText) btnText.style.display = 'block';
        if (btnLoading) btnLoading.style.display = 'none';
      }
    }
  }
  
  // Función para alternar visibilidad de contraseña
  function togglePasswordVisibility() {
    const passwordInput = document.getElementById('sidebar-inline-password');
    const toggleButton = document.getElementById('sidebar-toggle-password');
    
    if (passwordInput && toggleButton) {
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleButton.textContent = '🙈';
        toggleButton.title = 'Ocultar contraseña';
      } else {
        passwordInput.type = 'password';
        toggleButton.textContent = '👁';
        toggleButton.title = 'Mostrar contraseña';
      }
    }
  }
  
  // Función para cargar credenciales guardadas en el formulario inline
  function loadSavedCredentialsInline() {
    if (window.LeadManagerPro && window.LeadManagerPro.Auth) {
      window.LeadManagerPro.Auth.loadSavedCredentials(function(credentials) {
        if (credentials) {
          const usernameInput = document.getElementById('sidebar-inline-username');
          const passwordInput = document.getElementById('sidebar-inline-password');
          const rememberCheckbox = document.getElementById('sidebar-inline-remember');
          
          if (usernameInput) usernameInput.value = credentials.username || '';
          if (passwordInput) passwordInput.value = credentials.password || '';
          if (rememberCheckbox) rememberCheckbox.checked = credentials.remember || false;
          
          // Validar el formulario después de cargar las credenciales
          setTimeout(validateInlineForm, 100);
        }
      });
    }
  }
  
  // Escuchar mensajes sobre cambios de autenticación
  window.addEventListener('message', function(event) {
    if (!event.data || typeof event.data !== 'object') return;
    
    if (event.data.action === 'auth_state_changed') {
      console.log('Recibido cambio de estado de autenticación');
      checkAuthentication();
    }
  });
  
  // Escuchar mensajes del runtime
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
      if (message.action === 'auth_state_changed') {
        console.log('Recibido cambio de autenticación desde runtime');
        checkAuthentication();
      }
    });
  }
});
