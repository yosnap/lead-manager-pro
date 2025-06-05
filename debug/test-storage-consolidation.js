// Script de prueba para verificar la consolidación de almacenamiento

console.log('=== INICIO TEST CONSOLIDACIÓN DE ALMACENAMIENTO ===');

// Función para simular datos antiguos en diferentes sistemas
function setupOldData() {
  console.log('1. Configurando datos de prueba en sistemas antiguos...');

  // Simular datos en leadManagerGroupFilters (sistema más antiguo)
  chrome.storage.local.set({
    'leadManagerGroupFilters': {
      publicGroups: true,
      privateGroups: false,
      minUsers: 100
    }
  });

  // Simular datos en snap_lead_manager_group_options (sistema intermedio)
  localStorage.setItem('snap_lead_manager_group_options', JSON.stringify({
    publicGroups: false,  // Conflicto intencional para probar prioridad
    privateGroups: true,
    minUsers: 500,
    minPostsYear: 10
  }));

  // Simular algunas propiedades individuales en chrome.storage
  chrome.storage.local.set({
    'groupPublic': false,
    'groupPrivate': false,
    'minUsers': 200,
    'onlyPublicGroups': true
  });

  console.log('Datos de prueba configurados');
}

// Función para probar la consolidación
async function testConsolidation() {
  console.log('2. Probando consolidación...');

  try {
    // Importar y ejecutar el consolidador
    if (typeof StorageConsolidator === 'undefined') {
      console.error('StorageConsolidator no está disponible');
      return;
    }

    const consolidator = new StorageConsolidator();
    const result = await consolidator.migrateAndConsolidate();

    console.log('3. Resultado de consolidación:', result);

    // Verificar que los datos se guardaron correctamente
    chrome.storage.local.get(['lmp_group_search_options'], (data) => {
      console.log('4. Datos guardados en lmp_group_search_options:', data.lmp_group_search_options);
    });

    // Verificar que se guardó también en localStorage
    const localData = localStorage.getItem('lmp_group_search_options');
    console.log('5. Datos guardados en localStorage:', JSON.parse(localData || '{}'));

  } catch (error) {
    console.error('Error durante la consolidación:', error);
  }
}

// Función para verificar la funcionalidad del checkbox "Solo públicos"
function testPublicGroupsCheckbox() {
  console.log('6. Probando funcionalidad del checkbox "Solo públicos"...');

  // Simular carga de configuración
  chrome.storage.local.get(['lmp_group_search_options'], (result) => {
    const options = result.lmp_group_search_options || {};
    console.log('Opciones cargadas para checkbox:', options);

    // Verificar que publicGroups está definido
    if (options.publicGroups !== undefined) {
      console.log('✓ publicGroups está definido:', options.publicGroups);
    } else {
      console.log('✗ publicGroups NO está definido');
    }

    // Simular cambio del checkbox
    const newOptions = { ...options, publicGroups: !options.publicGroups };

    // Guardar nueva configuración
    chrome.storage.local.set({ 'lmp_group_search_options': newOptions }, () => {
      console.log('7. Nueva configuración guardada:', newOptions);

      // También guardar en localStorage para consistencia
      localStorage.setItem('lmp_group_search_options', JSON.stringify(newOptions));
      console.log('8. Configuración sincronizada en localStorage');
    });
  });
}

// Función para verificar limpieza de claves antiguas
function testCleanup() {
  console.log('9. Verificando limpieza de claves antiguas...');

  chrome.storage.local.get([
    'leadManagerGroupFilters',
    'snap_lead_manager_group_options',
    'groupPublic',
    'groupPrivate',
    'minUsers',
    'onlyPublicGroups'
  ], (result) => {
    console.log('10. Claves antiguas restantes:', result);

    const remainingKeys = Object.keys(result).filter(key => result[key] !== undefined);
    if (remainingKeys.length === 0) {
      console.log('✓ Todas las claves antiguas fueron limpiadas correctamente');
    } else {
      console.log('✗ Claves antiguas restantes:', remainingKeys);
    }
  });

  // También verificar localStorage
  const snapOptions = localStorage.getItem('snap_lead_manager_group_options');
  if (!snapOptions) {
    console.log('✓ snap_lead_manager_group_options limpiado de localStorage');
  } else {
    console.log('✗ snap_lead_manager_group_options todavía en localStorage');
  }
}

// Ejecutar todas las pruebas
async function runAllTests() {
  try {
    setupOldData();

    // Esperar un poco para que se guarden los datos
    setTimeout(async () => {
      await testConsolidation();

      // Esperar otro poco para las verificaciones
      setTimeout(() => {
        testPublicGroupsCheckbox();
        setTimeout(() => {
          testCleanup();
          console.log('=== FIN TEST CONSOLIDACIÓN DE ALMACENAMIENTO ===');
        }, 1000);
      }, 1000);
    }, 500);

  } catch (error) {
    console.error('Error en las pruebas:', error);
  }
}

// Auto-ejecutar si se está cargando el script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runAllTests);
} else {
  runAllTests();
}

// Exportar para uso manual
window.testStorageConsolidation = {
  setupOldData,
  testConsolidation,
  testPublicGroupsCheckbox,
  testCleanup,
  runAllTests
};
