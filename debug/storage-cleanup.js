/**
 * Script de depuración para detectar y limpiar claves undefined en chrome.storage
 * Este script ayuda a identificar y eliminar claves problemáticas que pueden estar
 * causando errores en la extensión.
 */

console.log('🔍 Storage Cleanup Debug Script - Starting...');

// Función para obtener todas las claves del storage
function getAllStorageKeys() {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, (result) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting all storage keys:', chrome.runtime.lastError);
        resolve({});
        return;
      }
      resolve(result);
    });
  });
}

// Función para detectar claves problemáticas
function detectProblematicKeys(storageData) {
  const problematicKeys = [];
  const suspiciousKeys = [];

  for (const [key, value] of Object.entries(storageData)) {
    // Detectar claves undefined o problemáticas
    if (key === 'undefined' || key === 'null' || key === '') {
      problematicKeys.push({ key, value, reason: 'Invalid key name' });
    }

    // Detectar claves que parecen sospechosas
    if (key.includes('undefined') || key.length === 0) {
      suspiciousKeys.push({ key, value, reason: 'Suspicious key pattern' });
    }

    // Detectar valores undefined guardados como strings
    if (value === 'undefined' || value === undefined) {
      suspiciousKeys.push({ key, value, reason: 'Undefined value' });
    }
  }

  return { problematicKeys, suspiciousKeys };
}

// Función para limpiar claves problemáticas
function cleanProblematicKeys(problematicKeys) {
  if (problematicKeys.length === 0) {
    console.log('✅ No se encontraron claves problemáticas para limpiar');
    return Promise.resolve([]);
  }

  const keysToRemove = problematicKeys.map(item => item.key);

  return new Promise((resolve) => {
    chrome.storage.local.remove(keysToRemove, () => {
      if (chrome.runtime.lastError) {
        console.error('Error removing problematic keys:', chrome.runtime.lastError);
        resolve([]);
        return;
      }

      console.log('🧹 Claves problemáticas eliminadas:', keysToRemove);
      resolve(keysToRemove);
    });
  });
}

// Función para generar reporte del storage
function generateStorageReport(storageData, analysis) {
  console.log('\n📊 === REPORTE DE CHROME.STORAGE ===');
  console.log(`Total de claves: ${Object.keys(storageData).length}`);
  console.log(`Claves problemáticas: ${analysis.problematicKeys.length}`);
  console.log(`Claves sospechosas: ${analysis.suspiciousKeys.length}`);

  if (analysis.problematicKeys.length > 0) {
    console.log('\n❌ CLAVES PROBLEMÁTICAS:');
    analysis.problematicKeys.forEach(item => {
      console.log(`  - "${item.key}" (${item.reason}):`, item.value);
    });
  }

  if (analysis.suspiciousKeys.length > 0) {
    console.log('\n⚠️ CLAVES SOSPECHOSAS:');
    analysis.suspiciousKeys.forEach(item => {
      console.log(`  - "${item.key}" (${item.reason}):`, item.value);
    });
  }

  console.log('\n📋 TODAS LAS CLAVES DEL STORAGE:');
  Object.keys(storageData).sort().forEach(key => {
    const value = storageData[key];
    const valueType = typeof value;
    const valuePreview = valueType === 'string' && value.length > 50
      ? value.substring(0, 50) + '...'
      : value;
    console.log(`  - "${key}" (${valueType}):`, valuePreview);
  });
}

// Función principal de análisis y limpieza
async function analyzeAndCleanStorage() {
  try {
    console.log('🔍 Obteniendo datos del chrome.storage...');
    const storageData = await getAllStorageKeys();

    console.log('🔎 Analizando claves problemáticas...');
    const analysis = detectProblematicKeys(storageData);

    generateStorageReport(storageData, analysis);

    // Limpiar claves problemáticas si existen
    if (analysis.problematicKeys.length > 0) {
      console.log('\n🧹 Limpiando claves problemáticas...');
      const removedKeys = await cleanProblematicKeys(analysis.problematicKeys);

      if (removedKeys.length > 0) {
        console.log('✅ Limpieza completada. Generando reporte post-limpieza...');

        // Generar reporte después de la limpieza
        const cleanStorageData = await getAllStorageKeys();
        const cleanAnalysis = detectProblematicKeys(cleanStorageData);

        console.log('\n📊 === REPORTE POST-LIMPIEZA ===');
        console.log(`Total de claves: ${Object.keys(cleanStorageData).length}`);
        console.log(`Claves problemáticas restantes: ${cleanAnalysis.problematicKeys.length}`);
        console.log(`Claves sospechosas restantes: ${cleanAnalysis.suspiciousKeys.length}`);
      }
    }

    // Verificar configuración específica de "Solo grupos públicos"
    console.log('\n🔍 Verificando configuración "Solo grupos públicos"...');
    checkOnlyPublicGroupsConfig(storageData);

  } catch (error) {
    console.error('❌ Error durante el análisis:', error);
  }
}

// Función para verificar específicamente la configuración de "Solo grupos públicos"
function checkOnlyPublicGroupsConfig(storageData) {
  const relevantKeys = [
    'onlyPublicGroups',
    'publicGroups',
    'groupPublic',
    'lmp_group_search_options',
    'snap_lead_manager_group_options'
  ];

  console.log('🔍 Buscando configuraciones relacionadas con grupos públicos:');

  relevantKeys.forEach(key => {
    if (storageData.hasOwnProperty(key)) {
      console.log(`  ✅ "${key}":`, storageData[key]);
    } else {
      console.log(`  ❌ "${key}": No encontrado`);
    }
  });

  // Verificar si hay alguna clave que contenga "undefined" y esté relacionada con grupos
  Object.keys(storageData).forEach(key => {
    if (key.includes('undefined') || key.includes('null')) {
      console.log(`  ⚠️ Clave sospechosa encontrada: "${key}":`, storageData[key]);
    }
  });
}

// Función para probar la funcionalidad de guardado
function testSaveOnlyPublicGroups() {
  console.log('\n🧪 === PRUEBA DE GUARDADO "SOLO GRUPOS PÚBLICOS" ===');

  // Simular el guardado como lo haría sidebar.js
  const testValue = true;
  const testData = {
    onlyPublicGroups: testValue,
    testTimestamp: new Date().toISOString()
  };

  chrome.storage.local.set(testData, () => {
    if (chrome.runtime.lastError) {
      console.error('❌ Error al guardar datos de prueba:', chrome.runtime.lastError);
      return;
    }

    console.log('✅ Datos de prueba guardados correctamente:', testData);

    // Verificar que se guardó correctamente
    chrome.storage.local.get(['onlyPublicGroups', 'testTimestamp'], (result) => {
      if (chrome.runtime.lastError) {
        console.error('❌ Error al recuperar datos de prueba:', chrome.runtime.lastError);
        return;
      }

      console.log('📥 Datos recuperados:', result);

      if (result.onlyPublicGroups === testValue) {
        console.log('✅ Test PASSED: onlyPublicGroups se guardó y recuperó correctamente');
      } else {
        console.log('❌ Test FAILED: onlyPublicGroups no se recuperó correctamente');
      }

      // Limpiar datos de prueba
      chrome.storage.local.remove(['testTimestamp'], () => {
        console.log('🧹 Datos de prueba limpiados');
      });
    });
  });
}

// Exportar funciones para uso manual
window.storageDebug = {
  analyzeAndCleanStorage,
  testSaveOnlyPublicGroups,
  getAllStorageKeys,
  detectProblematicKeys,
  cleanProblematicKeys
};

// Ejecutar análisis automáticamente
analyzeAndCleanStorage();

// Ejecutar prueba de guardado después de un momento
setTimeout(testSaveOnlyPublicGroups, 2000);

console.log('✅ Storage Cleanup Debug Script loaded. Use window.storageDebug for manual operations.');
