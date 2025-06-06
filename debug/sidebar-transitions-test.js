// Script de prueba para verificar las transiciones del sidebar y toggle

window.testSidebarTransitions = function() {
  console.log('🧪 Iniciando pruebas de transiciones del sidebar...');
  
  // Función auxiliar para esperar
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Limpiar y crear sidebar
  console.log('1. Limpiando y creando sidebar...');
  if (window.LeadManagerPro && window.LeadManagerPro.modules) {
    window.LeadManagerPro.modules.cleanupDuplicateToggles();
    window.LeadManagerPro.modules.insertSidebar();
  }
  
  // Verificar elementos
  const sidebar = document.getElementById('snap-lead-manager-searcher');
  
  if (!sidebar) {
    console.error('❌ Error: Sidebar no encontrado');
    return;
  }
  
  console.log('✅ Elemento encontrado:', { sidebar: !!sidebar });
  
  // Test 1: Verificar estado inicial
  console.log('2. Verificando estado inicial...');
  const initiallyVisible = sidebar.classList.contains('visible');
  console.log(`Estado inicial - Sidebar visible: ${initiallyVisible}`);
  
  // Test 2: Abrir sidebar (si está cerrado)
  setTimeout(async () => {
    console.log('3. Probando apertura del sidebar...');
    
    if (!initiallyVisible) {
      toggle.click();
      console.log('👆 Click simulado para abrir');
      
      await wait(500); // Esperar transición
      
      const isNowVisible = sidebar.classList.contains('visible');
      
      console.log(`Después de abrir - Sidebar visible: ${isNowVisible}`);
      
      if (isNowVisible) {
        console.log('✅ Apertura exitosa');
      } else {
        console.log('❌ Error en apertura');
      }
    }
    
    // Test 3: Cerrar sidebar
    setTimeout(async () => {
      console.log('4. Probando cierre del sidebar...');
      
      toggle.click();
      console.log('👆 Click simulado para cerrar');
      
      await wait(500); // Esperar transición
      
      const isNowHidden = !sidebar.classList.contains('visible');
      
      console.log(`Después de cerrar - Sidebar oculto: ${isNowHidden}`);
      
      if (isNowHidden) {
        console.log('✅ Cierre exitoso');
      } else {
        console.log('❌ Error en cierre');
      }
      
      // Test 4: Verificar transiciones CSS
      console.log('5. Verificando propiedades CSS...');
      const sidebarStyles = window.getComputedStyle(sidebar);
      
      console.log(`Sidebar transition: ${sidebarStyles.transition}`);
      
      if (sidebarStyles.transition.includes('0.4s')) {
        console.log('✅ Transiciones CSS configuradas correctamente');
      } else {
        console.log('❌ Transiciones CSS incorrectas');
      }
      
      console.log('🏁 Tests completados');
      
    }, 1000);
    
  }, 1000);
};

// Auto-ejecutar si estamos en modo debug
if (window.location.search.includes('test-transitions=true')) {
  setTimeout(() => {
    window.testSidebarTransitions();
  }, 2000);
}

console.log('🔧 Tests de transiciones del sidebar cargados. Ejecuta window.testSidebarTransitions() para probar.');
