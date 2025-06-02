            this.onLoginSuccess();
          }
        } else {
          this.showError('Credenciales incorrectas. Usa: lunai / lunai1234');
        }
      });
    } else {
      this.setLoading(false);
      this.showError('Error: Módulo de autenticación no disponible');
    }
  }
  
  loadSavedCredentials() {
    if (window.LeadManagerPro && window.LeadManagerPro.Auth) {
      window.LeadManagerPro.Auth.loadSavedCredentials((credentials) => {
        if (credentials) {
          document.getElementById('sidebar-username').value = credentials.username || '';
          document.getElementById('sidebar-password').value = credentials.password || '';
          document.getElementById('sidebar-remember').checked = credentials.remember || false;
        }
      });
    }
  }
  
  setLoading(isLoading) {
    const btn = document.getElementById('sidebar-login-btn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoading = btn.querySelector('.btn-loading');
    
    if (isLoading) {
      btn.disabled = true;
      btnText.style.display = 'none';
      btnLoading.style.display = 'flex';
    } else {
      btn.disabled = false;
      btnText.style.display = 'block';
      btnLoading.style.display = 'none';
    }
  }
  
  showError(message) {
    const errorElement = document.getElementById('sidebar-login-error');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      this.hideError();
    }, 5000);
  }
  
  hideError() {
    const errorElement = document.getElementById('sidebar-login-error');
    errorElement.style.display = 'none';
    errorElement.textContent = '';
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
