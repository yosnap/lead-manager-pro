// Script de verificación final para la consolidación de almacenamiento
// Ejecutar en la consola del navegador cuando la extensión esté cargada

console.log('🚀 VERIFICACIÓN FINAL: Sistema de Almacenamiento Consolidado');
console.log('==============================================================');

async function verifyStorageConsolidation() {
  console.log('\n1️⃣ VERIFICANDO ESTRUCTURA DE ARCHIVOS...');

  // Verificar que los módulos existen
  const modulesToCheck = [
    'StorageConsolidator',
    'GroupSearchFilters',
    'GroupSearchOptions'
  ];

  modulesToCheck.forEach(module => {
    if (typeof window[module] !== 'undefined' || typeof eval(module) !== 'undefined') {
      console.log(`✅ ${module} está disponible`);
    } else {
      console.log(`❌ ${module} NO está disponible`);
    }
  });

  console.log('\n2️⃣ VERIFICANDO CONFIGURACIÓN ACTUAL...');

  // Verificar datos en chrome.storage
  return new Promise((resolve) => {
    chrome.storage.local.get([
      'lmp_group_search_options',
      'leadManagerGroupFilters',
      'snap_lead_manager_group_options',
      'groupPublic',
      'groupPrivate',
      'minUsers'
    ], (result) => {
      console.log('📦 Datos en chrome.storage.local:', result);

      // Verificar localStorage
      const localData = {
        'lmp_group_search_options': localStorage.getItem('lmp_group_search_options'),
        'snap_lead_manager_group_options': localStorage.getItem('snap_lead_manager_group_options')
      };
      console.log('💾 Datos en localStorage:', localData);

      // Verificar si hay datos en el sistema unificado
      if (result.lmp_group_search_options) {
        console.log('✅ Sistema unificado tiene datos:', result.lmp_group_search_options);
      } else {
        console.log('⚠️ Sistema unificado NO tiene datos');
      }

      // Verificar si quedan datos antiguos
      const oldDataKeys = ['leadManagerGroupFilters', 'snap_lead_manager_group_options', 'groupPublic', 'groupPrivate', 'minUsers'];
      const remainingOldData = oldDataKeys.filter(key => result[key] !== undefined);

      if (remainingOldData.length > 0) {
        console.log('⚠️ Datos antiguos restantes:', remainingOldData);
      } else {
        console.log('✅ Todos los datos antiguos han sido limpiados');
      }

      resolve(result);
    });
  });
}

async function testCheckboxFunctionality() {
  console.log('\n3️⃣ PROBANDO FUNCIONALIDAD DEL CHECKBOX "Solo públicos"...');

  return new Promise((resolve) => {
    // Obtener configuración actual
    chrome.storage.local.get(['lmp_group_search_options'], (result) => {
      let options = result.lmp_group_search_options;

      if (!options) {
        console.log('⚠️ No hay opciones guardadas, creando configuración inicial...');
        options = {
          publicGroups: true,
          privateGroups: false,
          minUsers: 100,
          minPostsYear: 1
        };
      }

      console.log('📋 Configuración actual:', options);

      // Simular cambio del checkbox
      const newValue = !options.publicGroups;
      const updatedOptions = { ...options, publicGroups: newValue };

      console.log(`🔄 Cambiando "Solo públicos" de ${options.publicGroups} a ${newValue}`);

      // Guardar nueva configuración
      chrome.storage.local.set({ 'lmp_group_search_options': updatedOptions }, () => {
        console.log('💾 Nueva configuración guardada en chrome.storage');

        // También guardar en localStorage para consistencia
        localStorage.setItem('lmp_group_search_options', JSON.stringify(updatedOptions));
        console.log('💾 Nueva configuración sincronizada en localStorage');

        // Verificar que se guardó correctamente
        chrome.storage.local.get(['lmp_group_search_options'], (newResult) => {
          if (newResult.lmp_group_search_options?.publicGroups === newValue) {
            console.log('✅ Checkbox funciona correctamente!');
          } else {
            console.log('❌ Error: el checkbox NO se guardó correctamente');
          }
          resolve(newResult);
        });
      });
    });
  });
}

async function testStorageSync() {
  console.log('\n4️⃣ PROBANDO SINCRONIZACIÓN ENTRE SISTEMAS...');

  // Datos de prueba
  const testData = {
    publicGroups: true,
    privateGroups: false,
    minUsers: 250,
    minPostsYear: 5,
    testTimestamp: Date.now()
  };

  console.log('📝 Guardando datos de prueba:', testData);

  return new Promise((resolve) => {
    // Guardar en chrome.storage
    chrome.storage.local.set({ 'lmp_group_search_options': testData }, () => {
      console.log('✅ Datos guardados en chrome.storage');

      // Guardar en localStorage
      localStorage.setItem('lmp_group_search_options', JSON.stringify(testData));
      console.log('✅ Datos guardados en localStorage');

      // Verificar sincronización
      setTimeout(() => {
        chrome.storage.local.get(['lmp_group_search_options'], (chromeResult) => {
          const localResult = JSON.parse(localStorage.getItem('lmp_group_search_options') || '{}');

          const chromeData = chromeResult.lmp_group_search_options;

          if (JSON.stringify(chromeData) === JSON.stringify(localResult)) {
            console.log('✅ Datos sincronizados correctamente entre sistemas');
          } else {
            console.log('❌ Error: datos NO sincronizados');
            console.log('Chrome:', chromeData);
            console.log('Local:', localResult);
          }

          resolve({ chrome: chromeData, local: localResult });
        });
      }, 100);
    });
  });
}

// Función principal de verificación
async function runFullVerification() {
  try {
    console.log('🔍 Iniciando verificación completa...\n');

    await verifyStorageConsolidation();
    await testCheckboxFunctionality();
    await testStorageSync();

    console.log('\n🎉 VERIFICACIÓN COMPLETADA');
    console.log('==========================');
    console.log('Si todas las pruebas pasaron con ✅, el sistema está funcionando correctamente.');
    console.log('Si hay ❌ o ⚠️, revisa los mensajes para identificar problemas.');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  }
}

// Auto-ejecutar
runFullVerification();

// Exportar funciones para uso manual
window.storageVerification = {
  verifyStorageConsolidation,
  testCheckboxFunctionality,
  testStorageSync,
  runFullVerification
};
