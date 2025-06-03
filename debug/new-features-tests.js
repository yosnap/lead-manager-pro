// Test para las nuevas funcionalidades agregadas

class NewFeaturesTest {
  constructor() {
    this.testResults = [];
  }

  // Ejecutar todos los tests
  async runAllTests() {
    console.log('🧪 Iniciando tests de nuevas funcionalidades...');
    
    await this.testGeneralOptions();
    await this.testGroupSearchFilters();
    await this.testGroupSidebar();
    
    this.showResults();
  }

  // Test de opciones generales
  async testGeneralOptions() {
    console.log('📋 Testing Opciones Generales...');
    
    try {
      // Verificar que el módulo existe
      if (!window.leadManagerPro?.generalOptions) {
        throw new Error('Módulo generalOptions no encontrado');
      }

      const generalOptions = window.leadManagerPro.generalOptions;
      
      // Test 1: Cargar opciones por defecto
      const defaultOptions = generalOptions.getAllOptions();
      console.log('Opciones por defecto:', defaultOptions);
      
      if (!defaultOptions.maxScrollsToShowResults || !defaultOptions.waitTimeBetweenScrolls) {
        throw new Error('Opciones por defecto no están configuradas correctamente');
      }

      // Test 2: Guardar nuevas opciones
      const testOptions = {
        maxScrollsToShowResults: 25,
        waitTimeBetweenScrolls: 3
      };
      
      const saveResult = generalOptions.saveOptions(testOptions);
      if (!saveResult) {
        throw new Error('Error al guardar opciones');
      }

      // Test 3: Verificar que se guardaron
      const savedOptions = generalOptions.getAllOptions();
      if (savedOptions.maxScrollsToShowResults !== 25 || savedOptions.waitTimeBetweenScrolls !== 3) {
        throw new Error('Las opciones no se guardaron correctamente');
      }

      this.testResults.push({
        module: 'GeneralOptions',
        status: 'PASS',
        message: 'Todas las funciones funcionan correctamente'
      });

    } catch (error) {
      this.testResults.push({
        module: 'GeneralOptions',
        status: 'FAIL',
        message: error.message
      });
    }
  }

  // Test de filtros de búsqueda de grupos
  async testGroupSearchFilters() {
    console.log('🔍 Testing Filtros de Búsqueda de Grupos...');
    
    try {
      // Verificar que el módulo existe
      if (!window.leadManagerPro?.groupSearchFilters) {
        throw new Error('Módulo groupSearchFilters no encontrado');
      }

      const groupFilters = window.leadManagerPro.groupSearchFilters;
      
      // Test 1: Cargar filtros por defecto
      await groupFilters.loadFilters();
      const defaultFilters = groupFilters.getAllFilters();
      console.log('Filtros por defecto:', defaultFilters);
      
      if (!defaultFilters.groupTypes || !defaultFilters.minMembers || !defaultFilters.minPosts) {
        throw new Error('Filtros por defecto no están configurados correctamente');
      }

      // Test 2: Validar grupo
      const testGroup = {
        type: 'public',
        memberCount: 150,
        postStats: {
          year: 60,
          month: 5,
          day: 0
        }
      };
      
      const validation = groupFilters.validateGroup(testGroup);
      if (!validation.valid) {
        throw new Error(`Validación falló: ${validation.reason}`);
      }

      // Test 3: Guardar nuevos filtros
      const testFilters = {
        groupTypes: { public: true, private: false },
        minMembers: 200,
        minPosts: { year: 100, month: 20, day: 2 }
      };
      
      const saveResult = await groupFilters.saveFilters(testFilters);
      if (!saveResult) {
        throw new Error('Error al guardar filtros');
      }

      this.testResults.push({
        module: 'GroupSearchFilters',
        status: 'PASS',
        message: 'Todas las funciones funcionan correctamente'
      });

    } catch (error) {
      this.testResults.push({
        module: 'GroupSearchFilters',
        status: 'FAIL',
        message: error.message
      });
    }
  }

  // Test del sidebar de grupos
  async testGroupSidebar() {
    console.log('📱 Testing Group Sidebar...');
    
    try {
      // Verificar que el módulo existe
      if (!window.leadManagerPro?.groupSidebar) {
        throw new Error('Módulo groupSidebar no encontrado');
      }

      const groupSidebar = window.leadManagerPro.groupSidebar;
      
      // Test 1: Inicializar sidebar
      await groupSidebar.init();
      
      // Test 2: Verificar configuraciones por defecto
      if (!groupSidebar.settings.membersToInteract || !groupSidebar.settings.interactionDelay) {
        throw new Error('Configuraciones por defecto no están establecidas');
      }

      // Test 3: Guardar configuraciones
      groupSidebar.settings.membersToInteract = 15;
      groupSidebar.settings.interactionDelay = 2500;
      groupSidebar.settings.messageToSend = 'Mensaje de prueba';
      
      const saveResult = await groupSidebar.saveSettings();
      if (!saveResult) {
        throw new Error('Error al guardar configuraciones del sidebar');
      }

      // Test 4: Crear sidebar (solo si estamos en una página de grupo)
      if (window.location.href.includes('/groups/')) {
        groupSidebar.createSidebar();
        
        if (!groupSidebar.container) {
          throw new Error('No se pudo crear el contenedor del sidebar');
        }
      }

      this.testResults.push({
        module: 'GroupSidebar',
        status: 'PASS',
        message: 'Todas las funciones funcionan correctamente'
      });

    } catch (error) {
      this.testResults.push({
        module: 'GroupSidebar',
        status: 'FAIL',
        message: error.message
      });
    }
  }

  // Mostrar resultados
  showResults() {
    console.log('\n📊 RESULTADOS DE LOS TESTS:');
    console.log('==========================================');
    
    let passCount = 0;
    let failCount = 0;
    
    this.testResults.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${icon} ${result.module}: ${result.status}`);
      console.log(`   ${result.message}`);
      console.log('');
      
      if (result.status === 'PASS') {
        passCount++;
      } else {
        failCount++;
      }
    });
    
    console.log('==========================================');
    console.log(`✅ Tests pasados: ${passCount}`);
    console.log(`❌ Tests fallidos: ${failCount}`);
    console.log(`📊 Total: ${this.testResults.length}`);
    
    // Crear notificación visual si es posible
    this.createVisualNotification(passCount, failCount);
  }

  // Crear notificación visual
  createVisualNotification(passCount, failCount) {
    try {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${failCount > 0 ? '#f44336' : '#4CAF50'};
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10001;
        font-family: Arial, sans-serif;
        font-size: 14px;
        font-weight: 500;
        max-width: 300px;
      `;
      
      notification.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 8px;">Tests Completados</div>
        <div>✅ Pasados: ${passCount}</div>
        <div>❌ Fallidos: ${failCount}</div>
        <div style="margin-top: 8px; font-size: 12px; opacity: 0.9;">
          Ver consola para detalles
        </div>
      `;
      
      document.body.appendChild(notification);
      
      // Remover después de 5 segundos
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 5000);
      
    } catch (error) {
      console.log('No se pudo crear notificación visual:', error);
    }
  }
}

// Función para ejecutar los tests
window.testNewFeatures = async function() {
  const tester = new NewFeaturesTest();
  await tester.runAllTests();
};

// Auto-ejecutar si estamos en modo debug
if (window.location.search.includes('debug=true')) {
  setTimeout(() => {
    window.testNewFeatures();
  }, 2000);
}

console.log('🔧 Tests de nuevas funcionalidades cargados. Ejecuta window.testNewFeatures() para probar.');
