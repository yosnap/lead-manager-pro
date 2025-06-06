class LoginComponent {
  constructor(container) {
    // Si container es un string, buscar el elemento por ID
    if (typeof container === 'string') {
      this.container = document.getElementById(container);
      // Verificar si el elemento existe
      if (!this.container) {
        console.error(`LoginComponent: No se encontró el elemento con ID '${container}'`);
        return;
      }
    } else {
      this.container = container;
    }

    this.onLoginSuccess = null;
    this.onLoginError = null;
    this.init();
  }

  init() {
    // Verificar nuevamente antes de inicializar
    if (!this.container) {
      console.error('LoginComponent: Container no válido, no se puede inicializar');
      return;
    }

    this.render();
    this.bindEvents();
    this.loadSavedCredentials();
  }

  render() {
    if (!this.container) {
      console.error('LoginComponent: Container no encontrado');
      return;
    }

    // Verificar que sea un elemento DOM válido
    if (!(this.container instanceof HTMLElement)) {
      console.error('LoginComponent: Container no es un elemento DOM válido');
      return;
    }

    this.container.innerHTML = `
      <div class="login-component">
        <form id="sidebar-login-form" class="login-form">
          <div class="form-group">
            <label for="sidebar-username">Usuario:</label>
            <input type="text" id="sidebar-username" name="username" required>
          </div>
          <div class="form-group">
            <label for="sidebar-password">Contraseña:</label>
            <input type="password" id="sidebar-password" name="password" required>
          </div>
          <div class="form-group checkbox-group">
            <label>
              <input type="checkbox" id="sidebar-remember" name="remember">
              Recordar credenciales
            </label>
          </div>
          <div id="sidebar-login-error" class="error-message" style="display: none;"></div>
          <button type="submit" id="sidebar-login-btn" class="login-btn">
            <span class="btn-text">Iniciar Sesión</span>
            <span class="btn-loading" style="display: none;">
              <span class="spinner"></span>
              Autenticando...
            </span>
          </button>
        </form>
      </div>
    `;

    this.addStyles();
  }

  addStyles() {
    if (document.getElementById('login-component-styles')) return;

    const style = document.createElement('style');
    style.id = 'login-component-styles';
    style.textContent = `
      .login-component {
        padding: 20px;
        background: #f8f9fa;
        border-radius: 8px;
        margin-bottom: 20px;
      }

      .login-form .form-group {
        margin-bottom: 15px;
      }

      .login-form label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
        color: #333;
      }

      .login-form input[type="text"],
      .login-form input[type="password"] {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
      }

      .checkbox-group label {
        display: flex;
        align-items: center;
        font-weight: normal;
      }

      .checkbox-group input[type="checkbox"] {
        margin-right: 8px;
        width: auto;
      }

      .login-btn {
        width: 100%;
        padding: 12px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 16px;
        cursor: pointer;
        transition: background-color 0.3s;
      }

      .login-btn:hover:not(:disabled) {
        background: #0056b3;
      }

      .login-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .btn-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid #ffffff;
        border-top: 2px solid transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .error-message {
        color: #dc3545;
        font-size: 14px;
        margin-bottom: 10px;
        padding: 8px;
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 4px;
      }
    `;

    document.head.appendChild(style);
  }

  bindEvents() {
    const form = document.getElementById('sidebar-login-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }
  }

  loadSavedCredentials() {
    // Método simplificado para evitar dependencias
    try {
      const saved = localStorage.getItem('leadManagerCredentials');
      if (saved) {
        const credentials = JSON.parse(saved);
        // Esperar a que los elementos estén disponibles
        setTimeout(() => {
          const usernameInput = document.getElementById('sidebar-username');
          const passwordInput = document.getElementById('sidebar-password');
          const rememberInput = document.getElementById('sidebar-remember');

          if (usernameInput) usernameInput.value = credentials.username || '';
          if (passwordInput) passwordInput.value = credentials.password || '';
          if (rememberInput) rememberInput.checked = credentials.remember || false;
        }, 100);
      }
    } catch (error) {
      console.log('No hay credenciales guardadas');
    }
  }

  handleLogin() {
    this.hideError();
    this.setLoading(true);

    const username = document.getElementById('sidebar-username').value;
    const password = document.getElementById('sidebar-password').value;
    const remember = document.getElementById('sidebar-remember').checked;

    // Usar el módulo Auth global para autenticar
    if (window.LeadManagerPro && window.LeadManagerPro.Auth) {
      window.LeadManagerPro.Auth.login(username, password, remember, (success) => {
        this.setLoading(false);
        if (success) {
          if (this.onLoginSuccess) {
            this.onLoginSuccess();
          }
        } else {
          this.showError('Credenciales incorrectas. Usa: lunai / lunai1234');
        }
      });
    } else {
      this.setLoading(false);
      this.showError('Módulo de autenticación no disponible.');
    }
  }

  setLoading(isLoading) {
    const btn = document.getElementById('sidebar-login-btn');
    if (!btn) return;

    const btnText = btn.querySelector('.btn-text');
    const btnLoading = btn.querySelector('.btn-loading');

    if (isLoading) {
      btn.disabled = true;
      if (btnText) btnText.style.display = 'none';
      if (btnLoading) btnLoading.style.display = 'flex';
    } else {
      btn.disabled = false;
      if (btnText) btnText.style.display = 'block';
      if (btnLoading) btnLoading.style.display = 'none';
    }
  }

  showError(message) {
    const errorElement = document.getElementById('sidebar-login-error');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';

      // Auto-ocultar después de 5 segundos
      setTimeout(() => {
        this.hideError();
      }, 5000);
    }
  }

  hideError() {
    const errorElement = document.getElementById('sidebar-login-error');
    if (errorElement) {
      errorElement.style.display = 'none';
      errorElement.textContent = '';
    }
  }

  // Métodos para eventos
  onSuccess(callback) {
    this.onLoginSuccess = callback;
    return this;
  }

  onError(callback) {
    this.onLoginError = callback;
    return this;
  }

  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }

    // Remover estilos si no hay más instancias
    const existingComponents = document.querySelectorAll('.login-component');
    if (existingComponents.length === 0) {
      const styleElement = document.getElementById('login-component-styles');
      if (styleElement) {
        styleElement.remove();
      }
    }
  }
}

// Exportar para uso global
window.LeadManagerPro = window.LeadManagerPro || {};
window.LeadManagerPro.LoginComponent = LoginComponent;
