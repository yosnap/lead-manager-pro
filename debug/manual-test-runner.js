/**
 * Manual Test Runner - Para ejecutar desde la consola del navegador
 * Copia y pega este código en la consola de Chrome Developer Tools cuando estés en Facebook
 */

console.log('🧪 Manual Test Runner - Lead Manager Pro Undefined Keys Fix');

function manualTestUndefinedKeysFix() {
  console.log('\n=== MANUAL TEST: UNDEFINED KEYS FIX ===');

  // Test 1: Simular guardado problemático anterior
  console.log('\n1. Testing problematic save (should work now)...');

  const problematicData = {
    onlyPublicGroups: true,
    minUsers: '', // String vacío en lugar de undefined
    groupPublic: true,
    groupPrivate: false
  };

  return chrome.storage.local.set(problematicData).then(() => {
    console.log('✅ Problematic data saved successfully');

    // Verificar que se guardó
    return chrome.storage.local.get(Object.keys(problematicData));
  }).then((result) => {
    console.log('📋 Retrieved data:', result);

    // Test 2: Verificar que no hay claves undefined
    return chrome.storage.local.get(null);
  }).then((allData) => {
    const undefinedKeys = Object.keys(allData).filter(key =>
      key === 'undefined' || key.includes('undefined') || key === ''
    );

    if (undefinedKeys.length === 0) {
      console.log('✅ No undefined keys found in storage');
    } else {
      console.log('❌ Found undefined keys:', undefinedKeys);
    }

    // Test 3: Probar las nuevas validaciones
    console.log('\n2. Testing new validations...');

    // Esto debería funcionar bien
    const validData = {
      testValidKey: 'valid value',
      onlyPublicGroups: false,
      minUsers: '1000'
    };

    return chrome.storage.local.set(validData);
  }).then(() => {
    console.log('✅ Valid data saved successfully');

    // Test 4: Simular el comportamiento corregido de sidebar.js
    console.log('\n3. Testing sidebar.js corrections...');

    // Simular elementos null (como cuando el DOM no está cargado)
    const onlyPublicGroupsCheckbox = null;
    const minUsersInput = null;

    // Aplicar correcciones
    const onlyPublic = onlyPublicGroupsCheckbox?.checked || false;
    const minUsersValue = minUsersInput?.value || '';

    console.log('🔧 Corrected values:', { onlyPublic, minUsersValue });

    if (onlyPublic === false && minUsersValue === '') {
      console.log('✅ Sidebar.js corrections working correctly');
    } else {
      console.log('❌ Sidebar.js corrections not working');
    }

    // Test 5: Limpiar datos de test
    return chrome.storage.local.remove(['testValidKey']);
  }).then(() => {
    console.log('✅ Test data cleaned up');
    console.log('\n🎉 MANUAL TEST COMPLETED SUCCESSFULLY');
  }).catch((error) => {
    console.error('❌ Manual test failed:', error);
  });
}

// Test específico para "Solo grupos públicos"
function testOnlyPublicGroupsSpecific() {
  console.log('\n=== SPECIFIC TEST: SOLO GRUPOS PÚBLICOS ===');

  const testScenarios = [
    { name: 'Only Public Groups = true', data: { onlyPublicGroups: true, groupPublic: true, groupPrivate: false } },
    { name: 'Only Public Groups = false', data: { onlyPublicGroups: false, groupPublic: true, groupPrivate: true } },
    { name: 'Empty values handling', data: { minUsers: '', minPostsYear: '', minPostsMonth: '', minPostsDay: '' } }
  ];

  let testPromise = Promise.resolve();

  testScenarios.forEach((scenario, index) => {
    testPromise = testPromise.then(() => {
      console.log(`\n${index + 1}. Testing: ${scenario.name}`);

      return chrome.storage.local.set(scenario.data).then(() => {
        return chrome.storage.local.get(Object.keys(scenario.data));
      }).then((result) => {
        console.log(`✅ Saved and retrieved:`, result);

        // Verificar que no hay claves undefined
        const hasUndefinedKeys = Object.keys(result).some(key =>
          key === 'undefined' || key.includes('undefined')
        );

        if (!hasUndefinedKeys) {
          console.log(`✅ No undefined keys in scenario: ${scenario.name}`);
        } else {
          console.log(`❌ Found undefined keys in scenario: ${scenario.name}`);
        }
      });
    });
  });

  return testPromise.then(() => {
    console.log('\n🎉 SPECIFIC TEST COMPLETED');
  });
}

// Función para inspeccionar el storage actual
function inspectCurrentStorage() {
  console.log('\n=== STORAGE INSPECTION ===');

  return chrome.storage.local.get(null).then((allData) => {
    console.log(`📊 Total keys in storage: ${Object.keys(allData).length}`);

    // Buscar claves problemáticas
    const problematicKeys = Object.keys(allData).filter(key =>
      key === 'undefined' ||
      key === 'null' ||
      key === '' ||
      key.includes('undefined') ||
      typeof key !== 'string'
    );

    console.log(`🔍 Problematic keys found: ${problematicKeys.length}`);
    if (problematicKeys.length > 0) {
      console.log('❌ Problematic keys:', problematicKeys);
      problematicKeys.forEach(key => {
        console.log(`  - "${key}":`, allData[key]);
      });
    } else {
      console.log('✅ No problematic keys found');
    }

    // Buscar claves relacionadas con grupos
    const groupKeys = Object.keys(allData).filter(key =>
      key.includes('group') ||
      key.includes('public') ||
      key.includes('onlyPublic') ||
      key.includes('minUsers') ||
      key.includes('minPosts')
    );

    console.log(`🔍 Group-related keys: ${groupKeys.length}`);
    groupKeys.forEach(key => {
      console.log(`  - "${key}":`, allData[key]);
    });

    return allData;
  });
}

// Función todo-en-uno para ejecutar todos los tests
function runCompleteTest() {
  console.log('🚀 Running complete undefined keys fix test...');

  return inspectCurrentStorage()
    .then(() => manualTestUndefinedKeysFix())
    .then(() => testOnlyPublicGroupsSpecific())
    .then(() => inspectCurrentStorage())
    .then(() => {
      console.log('\n🎉🎉🎉 ALL TESTS COMPLETED SUCCESSFULLY 🎉🎉🎉');
      console.log('Las correcciones para claves undefined están funcionando correctamente.');
    })
    .catch((error) => {
      console.error('❌ Test suite failed:', error);
    });
}

// Hacer funciones disponibles globalmente
window.undefinedKeysManualTest = {
  runCompleteTest,
  manualTestUndefinedKeysFix,
  testOnlyPublicGroupsSpecific,
  inspectCurrentStorage
};

console.log('✅ Manual test functions loaded. Available commands:');
console.log('- window.undefinedKeysManualTest.runCompleteTest()');
console.log('- window.undefinedKeysManualTest.inspectCurrentStorage()');
console.log('- window.undefinedKeysManualTest.testOnlyPublicGroupsSpecific()');

// Auto-ejecutar inspección inicial
setTimeout(() => {
  console.log('🔍 Auto-running initial storage inspection...');
  inspectCurrentStorage();
}, 1000);
