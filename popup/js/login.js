document.addEventListener('DOMContentLoaded', function() {
  // Obtener referencias a elementos del DOM
  const loginForm = document.getElementById('login-form');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const rememberCheckbox = document.getElementById('remember');
  const loginError = document.getElementById('login-error');
  const forgotPasswordLink = document.getElementById('forgot-password');
  
  // Verificar si el usuario ya está autenticado
  window.LeadManagerPro.Auth.isAuthenticated(function(isAuth) {
    if (isAuth) {
      // Si ya está autenticado, redirigir a la página principal
      console.log('Usuario ya autenticado, redirigiendo...');
      window.location.href = 'popup.html';
      return;
    }
    
    // Cargar credenciales guardadas si existen
    window.LeadManagerPro.Auth.loadSavedCredentials(function(credentials) {
      if (credentials) {
        usernameInput.value = credentials.username;
        passwordInput.value = credentials.password;
        rememberCheckbox.checked = credentials.remember;
      }
    });
  });
  
  // Manejar envío del formulario
  loginForm.addEventListener('submit', function(event) {
    event.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const remember = rememberCheckbox.checked;
    
    // Validación básica
    if (!username || !password) {
      showError('Por favor, completa todos los campos');
      return;
    }
    
    // Autenticar usuario usando el módulo Auth
    window.LeadManagerPro.Auth.login(username, password, remember, function(success) {
      if (success) {
        // Redirigir a la página principal
        window.location.href = 'popup.html';
      } else {
        showError('Credenciales incorrectas. Usuario: lunai, Contraseña: lunai1234');
      }
    });
  });
  
  // Manejar clic en "Olvidaste tu contraseña"
  forgotPasswordLink.addEventListener('click', function(event) {
    event.preventDefault();
    showError('Función de recuperación de contraseña no implementada aún');
  });
  
  // Función para mostrar mensajes de error
  function showError(message) {
    loginError.textContent = message;
    loginError.style.display = 'block';
    
    // Ocultar el mensaje después de 3 segundos
    setTimeout(() => {
      loginError.textContent = '';
      loginError.style.display = 'none';
    }, 3000);
  }
});
