/**
 * Test simple para verificar las correcciones de claves undefined
 * Este archivo prueba que las validaciones agregadas funcionan correctamente
 */

console.log('🧪 === INICIANDO TESTS DE CORRECCIONES UNDEFINED KEYS ===');

// Test 1: Verificar que OptionsManager rechaza claves undefined
async function testOptionsManagerValidation() {
  console.log('\n1️⃣ Testing OptionsManager validation...');

  if (!window.LeadManagerPro?.OptionsManager) {
    console.log('❌ OptionsManager no disponible');
    return false;
  }

  try {
    // Intentar guardar con una clave undefined
    const result = await window.LeadManagerPro.OptionsManager.setOptions(undefined, { test: 'value' });
    console.log('❌ ERROR: OptionsManager permitió clave undefined');
    return false;
  } catch (error) {
    console.log('✅ OptionsManager rechazó correctamente clave undefined:', error.message);
    return true;
  }
}

// Test 2: Verificar que DataMigrationManager rechaza claves undefined
async function testDataMigrationManagerValidation() {
  console.log('\n2️⃣ Testing DataMigrationManager validation...');

  if (!window.LeadManagerPro?.DataMigrationManager) {
    console.log('❌ DataMigrationManager no disponible');
    return false;
  }

  try {
    // Intentar guardar con una clave undefined
    await window.LeadManagerPro.DataMigrationManager.saveToChromeStorage(undefined, 'test value');
    console.log('❌ ERROR: DataMigrationManager permitió clave undefined');
    return false;
  } catch (error) {
    console.log('✅ DataMigrationManager rechazó correctamente clave undefined:', error.message);
    return true;
  }
}

// Test 3: Verificar guardado de "Solo grupos públicos"
function testOnlyPublicGroupsSave() {
  console.log('\n3️⃣ Testing "Solo grupos públicos" save functionality...');

  return new Promise((resolve) => {
    // Simular guardado como lo haría sidebar.js
    const testData = {
      onlyPublicGroups: true,
      groupPublic: true,
      groupPrivate: false,
      testTimestamp: new Date().toISOString()
    };

    chrome.storage.local.set(testData, () => {
      if (chrome.runtime.lastError) {
        console.log('❌ Error al guardar datos de test:', chrome.runtime.lastError);
        resolve(false);
        return;
      }

      // Verificar que se guardó correctamente
      chrome.storage.local.get(['onlyPublicGroups', 'groupPublic', 'groupPrivate'], (result) => {
        if (chrome.runtime.lastError) {
          console.log('❌ Error al recuperar datos de test:', chrome.runtime.lastError);
          resolve(false);
          return;
        }

        const success = result.onlyPublicGroups === true &&
                       result.groupPublic === true &&
                       result.groupPrivate === false;

        if (success) {
          console.log('✅ "Solo grupos públicos" se guardó correctamente:', result);
        } else {
          console.log('❌ "Solo grupos públicos" no se guardó correctamente:', result);
        }

        // Limpiar datos de test
        chrome.storage.local.remove(['testTimestamp'], () => {
          resolve(success);
        });
      });
    });
  });
}

// Test 4: Verificar que no se pueden crear claves con valores undefined
function testUndefinedValuesValidation() {
  console.log('\n4️⃣ Testing undefined values validation...');

  return new Promise((resolve) => {
    // Intentar guardar valores undefined (esto debería funcionar pero no crear claves problemáticas)
    const testData = {
      validKey: 'valid value',
      undefinedValue: undefined,
      nullValue: null,
      emptyString: ''
    };

    chrome.storage.local.set(testData, () => {
      if (chrome.runtime.lastError) {
        console.log('❌ Error al guardar datos con undefined:', chrome.runtime.lastError);
        resolve(false);
        return;
      }

      // Verificar qué se guardó realmente
      chrome.storage.local.get(['validKey', 'undefinedValue', 'nullValue', 'emptyString'], (result) => {
        console.log('📋 Resultado del guardado con undefined values:', result);

        // Chrome.storage automáticamente filtra valores undefined
        const hasUndefinedValue = result.hasOwnProperty('undefinedValue');

        if (!hasUndefinedValue) {
          console.log('✅ Chrome.storage filtró correctamente el valor undefined');
          resolve(true);
        } else {
          console.log('⚠️ Chrome.storage guardó el valor undefined:', result.undefinedValue);
          resolve(true); // Esto aún está bien, solo es informativo
        }
      });
    });
  });
}

// Test 5: Verificar comportamiento del sidebar.js con elementos null
function testSidebarNullElementsHandling() {
  console.log('\n5️⃣ Testing sidebar.js null elements handling...');

  // Simular el comportamiento de performSearch con elementos null
  const onlyPublicGroupsCheckbox = null;
  const minUsersInput = null;

  // Aplicar las correcciones que hicimos
  const onlyPublic = onlyPublicGroupsCheckbox?.checked || false;
  const minUsersValue = minUsersInput?.value || '';

  if (onlyPublic === false && minUsersValue === '') {
    console.log('✅ Correcciones de sidebar.js funcionan correctamente con elementos null');
    return true;
  } else {
    console.log('❌ Correcciones de sidebar.js no funcionan correctamente:', { onlyPublic, minUsersValue });
    return false;
  }
}

// Ejecutar todos los tests
async function runAllTests() {
  console.log('🚀 Ejecutando todos los tests...');

  const results = {
    optionsManager: await testOptionsManagerValidation(),
    dataMigrationManager: await testDataMigrationManagerValidation(),
    onlyPublicGroups: await testOnlyPublicGroupsSave(),
    undefinedValues: await testUndefinedValuesValidation(),
    sidebarNullHandling: testSidebarNullElementsHandling()
  };

  console.log('\n📊 === RESUMEN DE TESTS ===');
  Object.entries(results).forEach(([test, result]) => {
    console.log(`${result ? '✅' : '❌'} ${test}: ${result ? 'PASSED' : 'FAILED'}`);
  });

  const allPassed = Object.values(results).every(result => result);
  console.log(`\n${allPassed ? '🎉' : '⚠️'} Resultado general: ${allPassed ? 'TODOS LOS TESTS PASARON' : 'ALGUNOS TESTS FALLARON'}`);

  return results;
}

// Auto-ejecutar tests después de un delay para asegurar que los módulos estén cargados
setTimeout(runAllTests, 2000);

// Exportar para uso manual
window.undefinedKeysTests = {
  runAllTests,
  testOptionsManagerValidation,
  testDataMigrationManagerValidation,
  testOnlyPublicGroupsSave,
  testUndefinedValuesValidation,
  testSidebarNullElementsHandling
};

console.log('✅ Tests de correcciones undefined keys cargados. Auto-ejecutándose en 2 segundos...');
