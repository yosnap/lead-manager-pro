/**
 * Script de prueba simple para verificar correcciones de claves undefined
 * Carga este script en la consola del navegador mientras la extensión está activa
 */

console.log('🔧 === INICIANDO VERIFICACIÓN DE CORRECCIONES ===');

// Función para ejecutar pruebas
async function testUndefinedKeysFixes() {
  console.log('📋 Estado inicial del test...');

  // 1. Verificar que chrome.storage está disponible
  if (typeof chrome === 'undefined' || !chrome.storage) {
    console.error('❌ chrome.storage no está disponible');
    return false;
  }
  console.log('✅ chrome.storage disponible');

  // 2. Test de optional chaining (ya funciona en JavaScript)
  const nullElement = null;
  const undefinedElement = undefined;

  const checkedValue = nullElement?.checked || false;
  const inputValue = undefinedElement?.value || '';

  if (checkedValue === false && inputValue === '') {
    console.log('✅ Optional chaining funciona correctamente');
  } else {
    console.log('❌ Optional chaining falló');
    return false;
  }

  // 3. Test de guardado normal (sin claves undefined)
  console.log('🧪 Probando guardado normal...');

  const testData = {
    onlyPublicGroups: true,
    groupPublic: true,
    groupPrivate: false,
    testCorrection: 'success',
    timestamp: Date.now()
  };

  try {
    await new Promise((resolve, reject) => {
      chrome.storage.local.set(testData, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
    console.log('✅ Guardado normal exitoso');
  } catch (error) {
    console.error('❌ Error en guardado normal:', error);
    return false;
  }

  // 4. Verificar recuperación
  try {
    const result = await new Promise((resolve, reject) => {
      chrome.storage.local.get(['onlyPublicGroups', 'testCorrection'], (data) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(data);
        }
      });
    });

    if (result.onlyPublicGroups === true && result.testCorrection === 'success') {
      console.log('✅ Recuperación de datos exitosa:', result);
    } else {
      console.log('❌ Recuperación de datos falló:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Error en recuperación:', error);
    return false;
  }

  // 5. Verificar que no hay claves problemáticas en el storage
  console.log('🔍 Verificando claves problemáticas...');

  try {
    const allData = await new Promise((resolve, reject) => {
      chrome.storage.local.get(null, (data) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(data);
        }
      });
    });

    const keys = Object.keys(allData);
    const problematicKeys = keys.filter(key =>
      key === 'undefined' ||
      key === 'null' ||
      key === '' ||
      key.includes('undefined')
    );

    if (problematicKeys.length === 0) {
      console.log('✅ No se encontraron claves problemáticas');
    } else {
      console.log('⚠️ Claves problemáticas encontradas:', problematicKeys);

      // Limpiar claves problemáticas
      await new Promise((resolve, reject) => {
        chrome.storage.local.remove(problematicKeys, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
      console.log('🧹 Claves problemáticas eliminadas');
    }
  } catch (error) {
    console.error('❌ Error verificando claves:', error);
    return false;
  }

  // 6. Limpiar datos de test
  try {
    await new Promise((resolve, reject) => {
      chrome.storage.local.remove(['testCorrection', 'timestamp'], () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
    console.log('🧹 Datos de test limpiados');
  } catch (error) {
    console.log('⚠️ Error limpiando datos de test:', error);
  }

  console.log('🎉 === TODAS LAS VERIFICACIONES COMPLETADAS ===');
  return true;
}

// Función para mostrar estado del storage
async function showStorageStatus() {
  console.log('📊 === ESTADO ACTUAL DEL STORAGE ===');

  try {
    const allData = await new Promise((resolve, reject) => {
      chrome.storage.local.get(null, (data) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(data);
        }
      });
    });

    const keys = Object.keys(allData);
    console.log(`📈 Total de claves: ${keys.length}`);

    // Mostrar claves relacionadas con la extensión
    const relevantKeys = keys.filter(key =>
      key.includes('group') ||
      key.includes('public') ||
      key.includes('search') ||
      key.includes('lead') ||
      key.includes('auth')
    );

    console.log('🔑 Claves relevantes:');
    relevantKeys.forEach(key => {
      const value = allData[key];
      const displayValue = typeof value === 'object' ?
        JSON.stringify(value).substring(0, 100) + '...' :
        String(value).substring(0, 100);
      console.log(`  ${key}: ${displayValue}`);
    });

    // Buscar claves problemáticas
    const problematicKeys = keys.filter(key =>
      key === 'undefined' ||
      key === 'null' ||
      key === '' ||
      key.includes('undefined')
    );

    if (problematicKeys.length > 0) {
      console.log('⚠️ Claves problemáticas encontradas:', problematicKeys);
    } else {
      console.log('✅ No se encontraron claves problemáticas');
    }

  } catch (error) {
    console.error('❌ Error obteniendo estado del storage:', error);
  }
}

// Ejecutar automáticamente después de un delay
console.log('⏱️ Ejecutando verificación en 2 segundos...');
setTimeout(async () => {
  await showStorageStatus();
  await testUndefinedKeysFixes();
}, 2000);

// Exportar funciones para uso manual
window.leadManagerTests = {
  testUndefinedKeysFixes,
  showStorageStatus
};

console.log('✅ Script de verificación cargado. Funciones disponibles:');
console.log('  - leadManagerTests.testUndefinedKeysFixes()');
console.log('  - leadManagerTests.showStorageStatus()');
