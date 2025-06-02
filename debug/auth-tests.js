/**
 * Script de prueba para validar la funcionalidad del login integrado
 * Este archivo puede ejecutarse en la consola del navegador para probar las funciones
 */

// Test del sistema de autenticación
function testAuthSystem() {
  console.log('🧪 Iniciando tests del sistema de autenticación...');
  
  // Test 1: Verificar que los módulos están cargados
  console.log('📦 Verificando módulos cargados...');
  const authModule = window.LeadManagerPro?.Auth;
  const optionsManager = window.LeadManagerPro?.OptionsManager;
  const loginComponent = window.LeadManagerPro?.LoginComponent;
  
  console.log('Auth Module:', authModule ? '✅' : '❌');
  console.log('Options Manager:', optionsManager ? '✅' : '❌');
  console.log('Login Component:', loginComponent ? '✅' : '❌');
  
  // Test 2: Verificar estado de autenticación
  if (authModule) {
    authModule.isAuthenticated((isAuth) => {
      console.log('🔐 Estado de autenticación:', isAuth ? '✅ Autenticado' : '❌ No autenticado');
      
      if (isAuth) {
        authModule.getUserInfo((userInfo) => {
          console.log('👤 Información del usuario:', userInfo);
        });
      }
    });
  }
  
  // Test 3: Verificar elementos del DOM del formulario inline
  console.log('🎨 Verificando elementos del formulario inline...');
  const formElements = {
    'Contenedor de auth': document.getElementById('auth-check-container'),
    'Formulario inline': document.getElementById('sidebar-inline-login-form'),
    'Campo usuario': document.getElementById('sidebar-inline-username'),
    'Campo contraseña': document.getElementById('sidebar-inline-password'),
    'Checkbox recordar': document.getElementById('sidebar-inline-remember'),
    'Botón login': document.getElementById('sidebar-inline-login-btn'),
    'Botón toggle password': document.getElementById('sidebar-toggle-password'),
    'Área de error': document.getElementById('sidebar-inline-login-error')
  };
  
  for (const [name, element] of Object.entries(formElements)) {
    console.log(`${name}:`, element ? '✅' : '❌');
  }
  
  // Test 4: Verificar configuración de opciones
  if (optionsManager) {
    console.log('⚙️ Verificando opciones cargadas...');
    const generalOptions = optionsManager.getOptions('general');
    const groupOptions = optionsManager.getOptions('groupSearch');
    
    console.log('Opciones generales:', generalOptions);
    console.log('Opciones de grupos:', groupOptions);
  }
  
  // Test 5: Test de login (solo si no está autenticado)
  if (authModule) {
    authModule.isAuthenticated((isAuth) => {
      if (!isAuth) {
        console.log('🧪 Test de login disponible. Ejecutar: testLogin("lunai", "lunai1234", true)');
      }
    });
  }
  
  console.log('✨ Tests completados. Revisa los resultados arriba.');
}

// Función para probar el login
function testLogin(username, password, remember = false) {
  console.log(`🧪 Probando login con usuario: ${username}`);
  
  if (!window.LeadManagerPro?.Auth) {
    console.error('❌ Módulo de autenticación no disponible');
    return;
  }
  
  window.LeadManagerPro.Auth.login(username, password, remember, (success) => {
    if (success) {
      console.log('✅ Login exitoso');
      
      // Verificar que se guardaron los datos
      setTimeout(() => {
        window.LeadManagerPro.Auth.getUserInfo((userInfo) => {
          console.log('👤 Usuario autenticado:', userInfo);
        });
      }, 100);
    } else {
      console.log('❌ Login fallido');
    }
  });
}

// Función para probar logout
function testLogout() {
  console.log('🧪 Probando logout...');
  
  if (!window.LeadManagerPro?.Auth) {
    console.error('❌ Módulo de autenticación no disponible');
    return;
  }
  
  window.LeadManagerPro.Auth.logout((success) => {
    if (success) {
      console.log('✅ Logout exitoso');
    } else {
      console.log('❌ Error durante logout');
    }
  });
}

// Función para simular el flujo completo del formulario inline
function testInlineFormFlow() {
  console.log('🧪 Probando flujo del formulario inline...');
  
  const usernameInput = document.getElementById('sidebar-inline-username');
  const passwordInput = document.getElementById('sidebar-inline-password');
  const rememberCheckbox = document.getElementById('sidebar-inline-remember');
  const form = document.getElementById('sidebar-inline-login-form');
  
  if (!usernameInput || !passwordInput || !form) {
    console.error('❌ Elementos del formulario no encontrados. ¿Está visible el formulario de login?');
    return;
  }
  
  // Llenar campos
  usernameInput.value = 'lunai';
  passwordInput.value = 'lunai1234';
  if (rememberCheckbox) rememberCheckbox.checked = true;
  
  // Simular envío
  console.log('📝 Campos llenados, simulando envío...');
  
  // Disparar evento de submit
  const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
  form.dispatchEvent(submitEvent);
  
  console.log('✅ Evento de submit disparado');
}

// Función para verificar el almacenamiento
function testStorage() {
  console.log('🧪 Verificando almacenamiento...');
  
  // Verificar chrome.storage.local
  chrome.storage.local.get(null, (result) => {
    console.log('📦 Contenido de chrome.storage.local:');
    const authKeys = Object.keys(result).filter(key => key.startsWith('lmp_'));
    
    if (authKeys.length > 0) {
      authKeys.forEach(key => {
        console.log(`  ${key}:`, result[key]);
      });
    } else {
      console.log('  No hay datos de Lead Manager Pro');
    }
  });
  
  // Verificar localStorage (debería estar limpio)
  console.log('🗃️ Verificando localStorage (debería estar limpio de datos LMP):');
  const localStorageKeys = Object.keys(localStorage).filter(key => 
    key.startsWith('lmp_') || key.startsWith('snap_lead_manager')
  );
  
  if (localStorageKeys.length > 0) {
    console.log('⚠️ Datos obsoletos encontrados en localStorage:', localStorageKeys);
  } else {
    console.log('✅ localStorage limpio de datos obsoletos');
  }
}

// Mostrar ayuda
function showTestHelp() {
  console.log(`
🧪 FUNCIONES DE TEST DISPONIBLES:

📋 Funciones principales:
• testAuthSystem() - Ejecuta todos los tests básicos
• testLogin(username, password, remember) - Prueba el login
• testLogout() - Prueba el logout  
• testInlineFormFlow() - Simula el uso del formulario inline
• testStorage() - Verifica el almacenamiento de datos

💡 Ejemplos de uso:
• testAuthSystem()
• testLogin("lunai", "lunai1234", true)
• testLogout()
• testInlineFormFlow()
• testStorage()

🎯 Para empezar, ejecuta: testAuthSystem()
  `);
}

// Auto-mostrar ayuda cuando se carga el script
console.log('🧪 Script de pruebas de Lead Manager Pro cargado');
showTestHelp();

// Exportar funciones para uso global
window.LMPTests = {
  testAuthSystem,
  testLogin,
  testLogout,
  testInlineFormFlow,
  testStorage,
  showTestHelp
};
