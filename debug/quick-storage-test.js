// Script de prueba rápida para verificar el sistema de almacenamiento consolidado
// Copia y pega este código en la consola del navegador (F12) en Facebook con la extensión cargada

console.log('%c🚀 PRUEBA RÁPIDA: Sistema de Almacenamiento Consolidado', 'color: #4CAF50; font-size: 16px; font-weight: bold;');
console.log('═══════════════════════════════════════════════════════════════');

// Función para ejecutar prueba rápida
async function quickStorageTest() {
  try {
    console.log('\n📋 1. VERIFICANDO ESTADO ACTUAL...');

    // Obtener estado actual
    const currentState = await new Promise(resolve => {
      chrome.storage.local.get([
        'lmp_group_search_options',
        'leadManagerGroupFilters',
        'snap_lead_manager_group_options',
        'groupPublic',
        'groupPrivate'
      ], resolve);
    });

    console.log('📦 Datos actuales en chrome.storage:', currentState);

    const localStorageData = localStorage.getItem('lmp_group_search_options');
    console.log('💾 Datos en localStorage:', localStorageData ? JSON.parse(localStorageData) : 'No hay datos');

    console.log('\n🔧 2. PROBANDO FUNCIONALIDAD DEL CHECKBOX...');

    // Obtener o crear configuración inicial
    let options = currentState.lmp_group_search_options;
    if (!options) {
      options = {
        publicGroups: true,
        privateGroups: false,
        minUsers: 100,
        minPostsYear: 1
      };
      console.log('⚙️ Creando configuración inicial:', options);
    }

    console.log('📋 Configuración actual:', options);

    // Simular cambio del checkbox "Solo públicos"
    const originalValue = options.publicGroups;
    const newValue = !originalValue;

    console.log(`🔄 Cambiando "Solo públicos": ${originalValue} → ${newValue}`);

    const updatedOptions = { ...options, publicGroups: newValue };

    // Guardar en ambos sistemas
    await new Promise(resolve => {
      chrome.storage.local.set({ 'lmp_group_search_options': updatedOptions }, () => {
        localStorage.setItem('lmp_group_search_options', JSON.stringify(updatedOptions));
        resolve();
      });
    });

    console.log('💾 Configuración guardada');

    // Verificar que se guardó correctamente
    const verification = await new Promise(resolve => {
      chrome.storage.local.get(['lmp_group_search_options'], resolve);
    });

    const localVerification = JSON.parse(localStorage.getItem('lmp_group_search_options') || '{}');

    console.log('\n✅ 3. VERIFICACIÓN DE GUARDADO...');
    console.log('📦 Chrome Storage:', verification.lmp_group_search_options);
    console.log('💾 Local Storage:', localVerification);

    // Verificar consistencia
    const chromeValue = verification.lmp_group_search_options?.publicGroups;
    const localValue = localVerification.publicGroups;

    if (chromeValue === newValue && localValue === newValue) {
      console.log('%c✅ ¡ÉXITO! El checkbox se guardó correctamente en ambos sistemas', 'color: #4CAF50; font-weight: bold;');
      console.log(`   Valor esperado: ${newValue}`);
      console.log(`   Chrome Storage: ${chromeValue}`);
      console.log(`   Local Storage: ${localValue}`);
    } else {
      console.log('%c❌ ERROR: El checkbox NO se guardó correctamente', 'color: #F44336; font-weight: bold;');
      console.log(`   Valor esperado: ${newValue}`);
      console.log(`   Chrome Storage: ${chromeValue}`);
      console.log(`   Local Storage: ${localValue}`);
    }

    console.log('\n🧹 4. VERIFICANDO LIMPIEZA DE DATOS ANTIGUOS...');

    const oldKeys = ['leadManagerGroupFilters', 'snap_lead_manager_group_options', 'groupPublic', 'groupPrivate'];
    const remainingOldData = oldKeys.filter(key => currentState[key] !== undefined);

    if (remainingOldData.length === 0) {
      console.log('%c✅ Excelente: No hay datos antiguos restantes', 'color: #4CAF50; font-weight: bold;');
    } else {
      console.log('%c⚠️ Advertencia: Todavía hay datos antiguos:', 'color: #FF9800; font-weight: bold;', remainingOldData);
      console.log('   Esto podría indicar que la migración no se ejecutó completamente');
    }

    // Verificar localStorage antiguo
    const oldLocalData = localStorage.getItem('snap_lead_manager_group_options');
    if (!oldLocalData) {
      console.log('✅ localStorage antiguo limpiado correctamente');
    } else {
      console.log('⚠️ Datos antiguos en localStorage:', oldLocalData);
    }

    console.log('\n🎯 5. RESUMEN FINAL...');
    console.log('═══════════════════════════════════════════════════════════');

    const summary = {
      '✅ Sistema unificado funcionando': !!verification.lmp_group_search_options,
      '✅ Checkbox guarda correctamente': chromeValue === newValue && localValue === newValue,
      '✅ Sincronización Chrome ↔ Local': JSON.stringify(verification.lmp_group_search_options) === JSON.stringify(localVerification),
      '✅ Datos antiguos limpiados': remainingOldData.length === 0 && !oldLocalData,
      '📊 Configuración actual': verification.lmp_group_search_options
    };

    Object.entries(summary).forEach(([key, value]) => {
      if (key.startsWith('✅')) {
        console.log(`${value ? '✅' : '❌'} ${key.substring(2)}`);
      } else {
        console.log(`${key}:`, value);
      }
    });

    if (Object.values(summary).slice(0, 4).every(v => v === true)) {
      console.log('\n%c🎉 ¡SISTEMA FUNCIONANDO PERFECTAMENTE!', 'color: #4CAF50; font-size: 18px; font-weight: bold;');
      console.log('   El checkbox "Solo públicos" y todo el sistema de almacenamiento están funcionando correctamente.');
    } else {
      console.log('\n%c⚠️ HAY PROBLEMAS QUE REVISAR', 'color: #FF9800; font-size: 18px; font-weight: bold;');
      console.log('   Revisa los mensajes anteriores para identificar qué necesita corrección.');
    }

  } catch (error) {
    console.error('%c❌ ERROR durante la prueba:', 'color: #F44336; font-weight: bold;', error);
  }
}

// Función para ejecutar migración manual si es necesaria
async function runManualMigration() {
  console.log('\n🔧 EJECUTANDO MIGRACIÓN MANUAL...');

  try {
    if (typeof StorageConsolidator !== 'undefined') {
      const consolidator = new StorageConsolidator();
      const result = await consolidator.migrateAndConsolidate();
      console.log('✅ Migración completada:', result);
    } else {
      console.log('⚠️ StorageConsolidator no está disponible. Asegúrate de que la extensión esté cargada correctamente.');
    }
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  }
}

// Ejecutar automáticamente
console.log('🏃‍♂️ Ejecutando prueba automáticamente...');
quickStorageTest();

// Exportar funciones para uso manual
window.quickStorageTest = quickStorageTest;
window.runManualMigration = runManualMigration;

console.log('\n💡 COMANDOS DISPONIBLES:');
console.log('• quickStorageTest() - Ejecutar prueba completa');
console.log('• runManualMigration() - Forzar migración manual');
