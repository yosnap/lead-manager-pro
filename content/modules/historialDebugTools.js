// Herramientas de depuración para su uso directo en la consola

// Script de depuración para monitorear y probar la funcionalidad de historial
// Puedes ejecutar estas funciones directamente desde la consola del navegador

// Mensaje de inicio en la consola
console.log('%c HERRAMIENTAS DE DEPURACIÓN HISTORIAL DISPONIBLES', 'background: #8e44ad; color: white; padding: 10px; font-size: 16px; font-weight: bold; border-radius: 5px;');

// Objeto global para herramientas de depuración
window.historialDebug = {
  // Funciones básicas de logging
  log: function(mensaje) {
    console.log('%c HISTORIAL INFO 🔍', 'background: #3498db; color: white; padding: 4px 6px; border-radius: 4px;', mensaje);
  },
  
  error: function(mensaje) {
    console.log('%c HISTORIAL ERROR ❌', 'background: #e74c3c; color: white; padding: 4px 6px; border-radius: 4px;', mensaje);
  },
  
  success: function(mensaje) {
    console.log('%c HISTORIAL ÉXITO ✅', 'background: #2ecc71; color: white; padding: 4px 6px; border-radius: 4px;', mensaje);
  },
  
  // Verificar si existe el panel de interacción
  verificarPanel: function() {
    const panel = document.getElementById('lead-manager-interaction-ui');
    if (panel) {
      this.success('Panel de interacción encontrado');
      return panel;
    } else {
      this.error('Panel de interacción no encontrado');
      return null;
    }
  },
  
  // Verificar si existe la sección de historial
  verificarHistorial: function() {
    const historial = document.getElementById('lead-manager-history-container');
    if (historial) {
      this.success('Sección de historial encontrada');
      return historial;
    } else {
      this.error('Sección de historial no encontrada');
      return null;
    }
  },
  
  // Mostrar datos del historial
  mostrarDatosHistorial: function() {
    const historial = this.verificarHistorial();
    if (!historial) return;
    
    const lastIndexElement = historial.querySelector('#lmp-last-index');
    const groupInteractionsElement = historial.querySelector('#lmp-group-interactions');
    const continueCheckbox = historial.querySelector('#lmp-continue-from-last');
    
    this.log('Datos del historial:');
    console.table({
      'Último índice': lastIndexElement ? lastIndexElement.textContent : 'No encontrado',
      'Interacciones en grupo': groupInteractionsElement ? groupInteractionsElement.textContent : 'No encontrado',
      'Continuar desde último': continueCheckbox ? (continueCheckbox.checked ? 'Sí' : 'No') : 'No encontrado'
    });
  },
  
  // Mostrar estructura del panel de interacción
  mostrarEstructuraPanel: function() {
    const panel = this.verificarPanel();
    if (!panel) return;
    
    this.log('Estructura del panel de interacción:');
    
    const elementos = Array.from(panel.children);
    elementos.forEach((elemento, i) => {
      console.log(`%c Elemento ${i+1}: ${elemento.tagName}`, 'background: #f39c12; color: white; padding: 2px 4px; border-radius: 2px;', {
        id: elemento.id,
        clase: elemento.className,
        contenido: elemento.innerText.substring(0, 50) + (elemento.innerText.length > 50 ? '...' : '')
      });
    });
    
    // Buscar elementos importantes
    const botonesIniciar = panel.querySelectorAll('button');
    this.log(`Botones encontrados: ${botonesIniciar.length}`);
    botonesIniciar.forEach((boton, i) => {
      console.log(`- Botón ${i+1}: "${boton.textContent}"`);
    });
    
    const mensajesPersonalizados = panel.querySelector('.lead-manager-accordion');
    if (mensajesPersonalizados) {
      this.success('Acordeón de mensajes encontrado');
    } else {
      this.error('Acordeón de mensajes no encontrado');
    }
  },
  
  // Crear un panel de depuración visual
  crearPanelDebug: function() {
    // Eliminar panel existente si lo hay
    const panelExistente = document.getElementById('historial-debug-panel');
    if (panelExistente) {
      panelExistente.remove();
    }
    
    // Crear panel
    const panel = document.createElement('div');
    panel.id = 'historial-debug-panel';
    panel.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 300px;
      background-color: #34495e;
      color: white;
      border-radius: 8px;
      padding: 15px;
      font-family: Arial, sans-serif;
      z-index: 10000;
      box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    `;
    
    // Título
    const titulo = document.createElement('div');
    titulo.textContent = '🔍 Depurador de Historial';
    titulo.style.cssText = `
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 10px;
      text-align: center;
      padding-bottom: 10px;
      border-bottom: 1px solid #4a6785;
    `;
    panel.appendChild(titulo);
    
    // Botones
    const botones = [
      { texto: 'Verificar Panel', accion: 'verificarPanel' },
      { texto: 'Verificar Historial', accion: 'verificarHistorial' },
      { texto: 'Mostrar Datos', accion: 'mostrarDatosHistorial' },
      { texto: 'Mostrar Estructura', accion: 'mostrarEstructuraPanel' }
    ];
    
    botones.forEach(boton => {
      const btn = document.createElement('button');
      btn.textContent = boton.texto;
      btn.style.cssText = `
        background-color: #3498db;
        border: none;
        color: white;
        padding: 8px;
        margin: 5px 0;
        width: 100%;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
      `;
      btn.addEventListener('mouseover', () => {
        btn.style.backgroundColor = '#2980b9';
      });
      btn.addEventListener('mouseout', () => {
        btn.style.backgroundColor = '#3498db';
      });
      btn.addEventListener('click', () => {
        this[boton.accion]();
      });
      panel.appendChild(btn);
    });
    
    // Botón para cerrar el panel
    const cerrarBtn = document.createElement('button');
    cerrarBtn.textContent = 'Cerrar';
    cerrarBtn.style.cssText = `
      background-color: #e74c3c;
      border: none;
      color: white;
      padding: 8px;
      margin-top: 10px;
      width: 100%;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    `;
    cerrarBtn.addEventListener('click', () => {
      panel.remove();
    });
    panel.appendChild(cerrarBtn);
    
    // Agregar al documento
    document.body.appendChild(panel);
    this.success('Panel de depuración creado. Puedes usar los botones para verificar el historial.');
  },
  
  // Función principal que ejecuta todas las verificaciones
  verificarTodo: function() {
    this.log('Iniciando verificación completa...');
    const panel = this.verificarPanel();
    if (panel) {
      this.mostrarEstructuraPanel();
      const historial = this.verificarHistorial();
      if (historial) {
        this.mostrarDatosHistorial();
        this.success('Verificación completa realizada con éxito');
      }
    }
  }
};

// Crear automáticamente un botón flotante para abrir el panel de depuración
setTimeout(() => {
  const botonFlotante = document.createElement('button');
  botonFlotante.textContent = '🔍';
  botonFlotante.title = 'Abrir herramientas de depuración';
  botonFlotante.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #8e44ad;
    color: white;
    font-size: 20px;
    border: none;
    box-shadow: 0 3px 6px rgba(0,0,0,0.2);
    cursor: pointer;
    z-index: 9999;
  `;
  
  botonFlotante.addEventListener('click', () => {
    window.historialDebug.crearPanelDebug();
  });
  
  document.body.appendChild(botonFlotante);
  window.historialDebug.log('Botón de depuración añadido. Haz clic para abrir el panel de depuración.');
}, 2000);

// Mensaje final
console.log('%c PARA INICIAR LA DEPURACIÓN ESCRIBE: window.historialDebug.verificarTodo()', 'background: #8e44ad; color: white; padding: 5px 10px; font-size: 14px; border-radius: 5px;');
