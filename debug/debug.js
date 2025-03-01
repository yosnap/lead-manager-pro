// Script de depuración para ayudar a identificar problemas con el sidebar
console.log('Script de depuración iniciado');

// Función para registrar información sobre el DOM
function logDOMInfo() {
  console.log('=== INFORMACIÓN DEL DOM ===');
  console.log('- Sidebar existe:', !!document.getElementById('snap-lead-manager-overlay'));
  console.log('- Body tiene clase snap-lead-manager-active:', document.body.classList.contains('snap-lead-manager-active'));
  console.log('- Body tiene clase snap-lead-manager-collapsed:', document.body.classList.contains('snap-lead-manager-collapsed'));
  console.log('- Estado del localStorage:', localStorage.getItem('snap-lead-manager-state'));
}

// Función para forzar la inyección del sidebar
function forceInjectSidebar() {
  console.log('Forzando la inyección del sidebar...');
  
  // Eliminar el sidebar existente si lo hay
  const existingSidebar = document.getElementById('snap-lead-manager-overlay');
  if (existingSidebar) {
    existingSidebar.remove();
    console.log('Sidebar existente eliminado');
  }
  
  document.body.classList.remove('snap-lead-manager-active');
  document.body.classList.remove('snap-lead-manager-collapsed');
  
  // Crear el contenedor del sidebar
  const overlay = document.createElement('div');
  overlay.id = 'snap-lead-manager-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.right = '0';
  overlay.style.bottom = '0';
  overlay.style.width = '300px';
  overlay.style.backgroundColor = 'white';
  overlay.style.boxShadow = '-2px 0 5px rgba(0, 0, 0, 0.2)';
  overlay.style.zIndex = '9999';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  
  // Crear la manija para mostrar/ocultar
  const handle = document.createElement('div');
  handle.id = 'snap-lead-manager-handle';
  handle.innerHTML = '⟪';
  handle.title = 'Mostrar/Ocultar Snap Lead Manager';
  handle.style.position = 'absolute';
  handle.style.left = '-30px';
  handle.style.top = '50%';
  handle.style.transform = 'translateY(-50%)';
  handle.style.width = '30px';
  handle.style.height = '60px';
  handle.style.backgroundColor = 'black';
  handle.style.color = 'white';
  handle.style.display = 'flex';
  handle.style.alignItems = 'center';
  handle.style.justifyContent = 'center';
  handle.style.cursor = 'pointer';
  handle.style.borderRadius = '5px 0 0 5px';
  
  // Crear el iframe para el contenido del sidebar
  const iframe = document.createElement('iframe');
  iframe.id = 'snap-lead-manager-iframe';
  iframe.src = chrome.runtime.getURL('sidebar.html');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  
  // Ensamblar el sidebar
  overlay.appendChild(handle);
  overlay.appendChild(iframe);
  document.body.appendChild(overlay);
  
  // Añadir clase al body para el margen
  document.body.classList.add('snap-lead-manager-active');
  
  console.log('Sidebar inyectado forzosamente');
  
  // Manejar eventos de la manija
  handle.addEventListener('click', () => {
    console.log('Click en la manija');
    const isVisible = !overlay.classList.contains('collapsed');
    
    if (isVisible) {
      overlay.classList.add('collapsed');
      overlay.style.transform = 'translateX(290px)';
      handle.innerHTML = '⟫';
      document.body.classList.add('snap-lead-manager-collapsed');
      localStorage.setItem('snap-lead-manager-state', 'collapsed');
    } else {
      overlay.classList.remove('collapsed');
      overlay.style.transform = '';
      handle.innerHTML = '⟪';
      document.body.classList.remove('snap-lead-manager-collapsed');
      localStorage.setItem('snap-lead-manager-state', 'expanded');
    }
  });
}

// Esperar a que el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    logDOMInfo();
    setTimeout(forceInjectSidebar, 1000);
  });
} else {
  logDOMInfo();
  setTimeout(forceInjectSidebar, 1000);
}

// Registrar cualquier error
window.addEventListener('error', (event) => {
  console.error('Error capturado:', event.error);
});
