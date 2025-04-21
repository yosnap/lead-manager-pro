// Módulo para la interfaz de usuario de extracción de miembros de grupos
// Este módulo implementa la interfaz para la funcionalidad de extracción de miembros

class GroupMemberUI {
  constructor() {
    this.container = null;
    this.progressBar = null;
    this.statusText = null;
    this.resultContainer = null;
    this.extractButton = null;
    this.exportButtons = null;
    this.closeButton = null;
    this.isExtracting = false;
    this.memberFinder = null;
    this.filterContainer = null;
    this.memberCounter = null;
    this.groupInfo = {
      id: '',
      name: '',
      url: ''
    };
  }

  // Inicializar el módulo
  init() {
    console.log('GroupMemberUI: Initializing module');
    
    // Inicializar el extractor de miembros
    this.memberFinder = window.leadManagerPro.groupMemberFinder;
    this.memberFinder.init({}, this.updateProgress.bind(this));
    
    // Extraer información del grupo actual
    this.groupInfo = {
      id: this.extractGroupIdFromUrl(),
      name: this.extractGroupNameFromPage(),
      url: window.location.href
    };
    
    // Crear la interfaz de usuario
    this.createUI();
    
    return this;
  }

  // Extraer ID del grupo de la URL actual
  extractGroupIdFromUrl() {
    const url = window.location.href;
    const match = url.match(/groups\/([^/?]+)/);
    return match ? match[1] : '';
  }

  // Extraer nombre del grupo de la página
  extractGroupNameFromPage() {
    // Intentar diferentes selectores para el nombre del grupo
    const selectors = [
      'h1', 
      'a[href*="/groups/"][role="link"]',
      'span[dir="auto"]'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }
    
    return 'Grupo desconocido';
  }

  // Inyectar estilos CSS
  injectStyles() {
    // Verificar si los estilos ya están inyectados
    if (document.getElementById('lead-manager-member-extractor-styles')) {
      return;
    }
    
    // Crear elemento de estilo
    const style = document.createElement('style');
    style.id = 'lead-manager-member-extractor-styles';
    style.textContent = `
      /* Estilos para el extractor de miembros de grupos */
      .lead-manager-container {
        position: fixed;
        top: 70px;
        right: 20px;
        width: 350px;
        max-height: 80vh;
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        z-index: 9999;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }

      .lead-manager-header {
        padding: 12px 16px;
        background-color: #4267B2;
        color: white;
        font-weight: bold;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .lead-manager-header button {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
      }

      .lead-manager-group-info {
        padding: 12px 16px;
        border-bottom: 1px solid #E4E6EB;
      }

      .lead-manager-filters {
        padding: 12px 16px;
        border-bottom: 1px solid #E4E6EB;
      }

      .lead-manager-actions {
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #E4E6EB;
      }

      .lead-manager-button {
        padding: 8px 16px;
        background-color: #4267B2;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
      }

      .lead-manager-button.secondary {
        background-color: #F0F2F5;
        color: #333;
      }

      .lead-manager-progress {
        padding: 12px 16px;
      }

      .lead-manager-progress-bar {
        height: 6px;
        background-color: #EBEDF0;
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 8px;
      }

      .lead-manager-progress-fill {
        height: 100%;
        width: 0%;
        background-color: #4267B2;
        transition: width 0.3s ease;
      }

      .lead-manager-status {
        font-size: 14px;
        color: #333;
      }

      .lead-manager-counter {
        margin-top: 8px;
        font-weight: bold;
        font-size: 14px;
      }

      .lead-manager-results {
        flex: 1;
        padding: 12px 16px;
        overflow-y: auto;
        max-height: 300px;
      }

      .lead-manager-export {
        padding: 12px 16px;
        border-top: 1px solid #E4E6EB;
      }

      .lead-manager-export-buttons {
        display: flex;
        gap: 8px;
      }

      .lead-manager-floating-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background-color: #4267B2;
        color: white;
        font-size: 24px;
        border: none;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        z-index: 9998;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s, transform 0.2s;
      }

      .lead-manager-floating-button:hover {
        background-color: #365899;
        transform: scale(1.05);
      }

      /* Estilos para las tablas de resultados */
      .lead-manager-results table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      }

      .lead-manager-results th {
        text-align: left;
        padding: 6px;
        border-bottom: 1px solid #EBEDF0;
        font-weight: bold;
      }

      .lead-manager-results td {
        padding: 6px;
        border-bottom: 1px solid #EBEDF0;
        max-width: 120px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .lead-manager-results a {
        color: #385898;
        text-decoration: none;
      }

      .lead-manager-results a:hover {
        text-decoration: underline;
      }

      .lead-manager-results h3 {
        margin: 12px 0 8px;
        font-size: 14px;
        color: #1C1E21;
      }
    `;
    
    // Agregar al head
    document.head.appendChild(style);
    console.log('GroupMemberUI: Styles injected');
  }

  // Crear la interfaz de usuario
  createUI() {
    console.log('GroupMemberUI: Creating UI');
    
    // Inyectar estilos
    this.injectStyles();
    
    // Verificar si ya existe un contenedor
    if (document.getElementById('lead-manager-member-finder-container')) {
      console.log('GroupMemberUI: UI already exists');
      this.container = document.getElementById('lead-manager-member-finder-container');
      return;
    }
    
    // Crear el contenedor principal
    this.container = document.createElement('div');
    this.container.id = 'lead-manager-member-finder-container';
    this.container.className = 'lead-manager-container';
    this.container.style.cssText = `
      position: fixed;
      top: 70px;
      right: 20px;
      width: 350px;
      max-height: 80vh;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      z-index: 9999;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    `;
    
    // Crear la cabecera
    const header = document.createElement('div');
    header.className = 'lead-manager-header';
    header.style.cssText = `
      padding: 12px 16px;
      background-color: #4267B2;
      color: white;
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    
    // Título
    const title = document.createElement('div');
    title.textContent = 'Lead Manager Pro - Extractor de Miembros';
    
    // Botón de cierre
    this.closeButton = document.createElement('button');
    this.closeButton.innerHTML = '&times;';
    this.closeButton.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
    `;
    this.closeButton.addEventListener('click', () => this.hide());
    
    header.appendChild(title);
    header.appendChild(this.closeButton);
    this.container.appendChild(header);
    
    // Contenedor de información del grupo
    const groupInfoContainer = document.createElement('div');
    groupInfoContainer.className = 'lead-manager-group-info';
    groupInfoContainer.style.cssText = `
      padding: 12px 16px;
      border-bottom: 1px solid #E4E6EB;
    `;
    
    // Mostrar información del grupo
    const groupName = document.createElement('div');
    groupName.style.fontWeight = 'bold';
    groupName.textContent = this.groupInfo.name || 'Grupo actual';
    
    // Contador de miembros
    this.groupMemberCount = document.createElement('div');
    this.groupMemberCount.style.marginTop = '4px';
    this.groupMemberCount.style.fontSize = '14px';
    this.groupMemberCount.textContent = 'Haz clic en "Contar Miembros" para ver el total';
    
    groupInfoContainer.appendChild(groupName);
    groupInfoContainer.appendChild(this.groupMemberCount);
    this.container.appendChild(groupInfoContainer);
    
    // Contenedor de opciones
    this.filterContainer = document.createElement('div');
    this.filterContainer.className = 'lead-manager-filters';
    this.filterContainer.style.cssText = `
      padding: 12px 16px;
      border-bottom: 1px solid #E4E6EB;
    `;
    
    // Título de opciones
    const filterTitle = document.createElement('div');
    filterTitle.style.fontWeight = 'bold';
    filterTitle.style.marginBottom = '8px';
    filterTitle.textContent = 'Opciones de extracción';
    
    this.filterContainer.appendChild(filterTitle);
    this.container.appendChild(this.filterContainer);
    
    // Contenedor de acciones
    const actionContainer = document.createElement('div');
    actionContainer.className = 'lead-manager-actions';
    actionContainer.style.cssText = `
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #E4E6EB;
    `;
    
    // Botón de conteo de miembros
    this.countButton = document.createElement('button');
    this.countButton.className = 'lead-manager-button secondary';
    this.countButton.textContent = 'Contar Miembros';
    this.countButton.style.cssText = `
      padding: 8px 16px;
      background-color: #F0F2F5;
      color: #333;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin-right: 8px;
    `;
    this.countButton.addEventListener('click', () => this.countMembers());
    
    // Botón de extracción
    this.extractButton = document.createElement('button');
    this.extractButton.className = 'lead-manager-button primary';
    this.extractButton.textContent = 'Extraer Miembros';
    this.extractButton.style.cssText = `
      padding: 8px 16px;
      background-color: #4267B2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    `;
    this.extractButton.addEventListener('click', () => this.toggleExtraction());
    
    actionContainer.appendChild(this.countButton);
    actionContainer.appendChild(this.extractButton);
    this.container.appendChild(actionContainer);
    
    // Contenedor de progreso
    const progressContainer = document.createElement('div');
    progressContainer.className = 'lead-manager-progress';
    progressContainer.style.cssText = `
      padding: 12px 16px;
      display: none;
    `;
    
    // Barra de progreso
    this.progressBar = document.createElement('div');
    this.progressBar.className = 'lead-manager-progress-bar';
    this.progressBar.style.cssText = `
      height: 6px;
      background-color: #EBEDF0;
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 8px;
    `;
    
    const progressFill = document.createElement('div');
    progressFill.className = 'lead-manager-progress-fill';
    progressFill.style.cssText = `
      height: 100%;
      width: 0%;
      background-color: #4267B2;
      transition: width 0.3s ease;
    `;
    
    this.progressBar.appendChild(progressFill);
    
    // Texto de estado
    this.statusText = document.createElement('div');
    this.statusText.className = 'lead-manager-status';
    this.statusText.textContent = 'Listo para extraer miembros.';
    
    // Contador de miembros
    this.memberCounter = document.createElement('div');
    this.memberCounter.className = 'lead-manager-counter';
    this.memberCounter.style.cssText = `
      margin-top: 8px;
      font-weight: bold;
    `;
    this.memberCounter.textContent = 'Miembros encontrados: 0';
    
    progressContainer.appendChild(this.progressBar);
    progressContainer.appendChild(this.statusText);
    progressContainer.appendChild(this.memberCounter);
    this.container.appendChild(progressContainer);
    
    // Contenedor de resultados
    this.resultContainer = document.createElement('div');
    this.resultContainer.className = 'lead-manager-results';
    this.resultContainer.style.cssText = `
      flex: 1;
      padding: 12px 16px;
      overflow-y: auto;
      max-height: 300px;
      display: none;
    `;
    this.container.appendChild(this.resultContainer);
    
    // Contenedor de exportación
    const exportContainer = document.createElement('div');
    exportContainer.className = 'lead-manager-export';
    exportContainer.style.cssText = `
      padding: 12px 16px;
      border-top: 1px solid #E4E6EB;
      display: none;
    `;
    
    // Botones de exportación
    this.exportButtons = document.createElement('div');
    this.exportButtons.className = 'lead-manager-export-buttons';
    this.exportButtons.style.cssText = `
      display: flex;
      gap: 8px;
    `;
    
    // Botón exportar JSON
    const exportJsonButton = document.createElement('button');
    exportJsonButton.className = 'lead-manager-button secondary';
    exportJsonButton.textContent = 'Exportar JSON';
    exportJsonButton.style.cssText = `
      padding: 8px 16px;
      background-color: #F0F2F5;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    `;
    exportJsonButton.addEventListener('click', () => this.exportResults('json'));
    
    // Botón exportar CSV
    const exportCsvButton = document.createElement('button');
    exportCsvButton.className = 'lead-manager-button secondary';
    exportCsvButton.textContent = 'Exportar CSV';
    exportCsvButton.style.cssText = `
      padding: 8px 16px;
      background-color: #F0F2F5;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    `;
    exportCsvButton.addEventListener('click', () => this.exportResults('csv'));
    
    this.exportButtons.appendChild(exportJsonButton);
    this.exportButtons.appendChild(exportCsvButton);
    exportContainer.appendChild(this.exportButtons);
    this.container.appendChild(exportContainer);
    
    // Agregar el contenedor al cuerpo del documento
    document.body.appendChild(this.container);
    
    console.log('GroupMemberUI: UI created and appended to document');
  }

  // Mostrar la interfaz de usuario
  show() {
    if (this.container) {
      this.container.style.display = 'flex';
    } else {
      this.createUI();
    }
  }

  // Ocultar la interfaz de usuario
  hide() {
    if (this.container) {
      this.container.style.display = 'none';
      
      // Si estamos extrayendo, detener el proceso
      if (this.isExtracting) {
        this.stopExtraction();
      }
    }
  }

  // Alternar la extracción (iniciar/detener)
  toggleExtraction() {
    if (this.isExtracting) {
      this.stopExtraction();
    } else {
      this.startExtraction();
    }
  }

  // Iniciar la extracción de miembros
  async startExtraction() {
    console.log('GroupMemberUI: Starting extraction');
    
    this.isExtracting = true;
    this.extractButton.textContent = 'Detener Extracción';
    this.extractButton.style.backgroundColor = '#E41E3F';
    
    // Mostrar contenedor de progreso
    const progressContainer = this.container.querySelector('.lead-manager-progress');
    if (progressContainer) {
      progressContainer.style.display = 'block';
    }
    
    // Reiniciar resultados
    this.resultContainer.innerHTML = '';
    this.resultContainer.style.display = 'none';
    
    // Ocultar botones de exportación
    const exportContainer = this.container.querySelector('.lead-manager-export');
    if (exportContainer) {
      exportContainer.style.display = 'none';
    }
    
    // Iniciar la extracción con el GroupMemberFinder
    const success = await this.memberFinder.startExtraction();
    
    if (!success) {
      console.log('GroupMemberUI: Failed to start extraction');
      this.updateProgress({
        type: 'error',
        message: 'Error al iniciar la extracción.'
      });
      this.stopExtraction();
    }
  }

  // Detener la extracción
  stopExtraction() {
    console.log('GroupMemberUI: Stopping extraction');
    
    this.isExtracting = false;
    this.extractButton.textContent = 'Extraer Miembros';
    this.extractButton.style.backgroundColor = '#4267B2';
    
    // Detener el extractor de miembros
    const members = this.memberFinder.stopExtraction();
    
    // Mostrar resultados
    if (members.length > 0) {
      this.showResults(members);
      
      // Mostrar botones de exportación
      const exportContainer = this.container.querySelector('.lead-manager-export');
      if (exportContainer) {
        exportContainer.style.display = 'block';
      }
    }
  }

  // Mostrar resultados en la interfaz
  showResults(members) {
    console.log('GroupMemberUI: Showing results - ' + members.length + ' members found');
    
    // Limpiar el contenedor de resultados
    this.resultContainer.innerHTML = '';
    this.resultContainer.style.display = 'block';
    
    // Agrupar miembros por sección
    const sectionedMembers = {};
    
    members.forEach(member => {
      const section = member.section || 'Otros miembros';
      if (!sectionedMembers[section]) {
        sectionedMembers[section] = [];
      }
      sectionedMembers[section].push(member);
    });
    
    // Crear tabla para cada sección
    for (const [section, sectionMembers] of Object.entries(sectionedMembers)) {
      // Título de la sección
      const sectionTitle = document.createElement('h3');
      sectionTitle.style.cssText = `
        margin: 12px 0 8px;
        font-size: 14px;
      `;
      sectionTitle.textContent = section + ` (${sectionMembers.length})`;
      this.resultContainer.appendChild(sectionTitle);
      
      // Tabla de miembros
      const table = document.createElement('table');
      table.style.cssText = `
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      `;
      
      // Cabecera de tabla
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      
      ['Nombre', 'Trabajo', 'Ubicación'].forEach(header => {
        const th = document.createElement('th');
        th.style.cssText = `
          text-align: left;
          padding: 6px;
          border-bottom: 1px solid #EBEDF0;
        `;
        th.textContent = header;
        headerRow.appendChild(th);
      });
      
      thead.appendChild(headerRow);
      table.appendChild(thead);
      
      // Cuerpo de tabla
      const tbody = document.createElement('tbody');
      
      sectionMembers.forEach(member => {
        const row = document.createElement('tr');
        
        // Celda de nombre
        const nameCell = document.createElement('td');
        nameCell.style.cssText = `
          padding: 6px;
          border-bottom: 1px solid #EBEDF0;
        `;
        
        const nameLink = document.createElement('a');
        nameLink.href = member.profileUrl;
        nameLink.target = '_blank';
        nameLink.style.color = '#385898';
        nameLink.textContent = member.name;
        
        nameCell.appendChild(nameLink);
        row.appendChild(nameCell);
        
        // Celda de trabajo
        const jobCell = document.createElement('td');
        jobCell.style.cssText = `
          padding: 6px;
          border-bottom: 1px solid #EBEDF0;
          max-width: 120px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        `;
        jobCell.textContent = member.jobTitle || '-';
        row.appendChild(jobCell);
        
        // Celda de ubicación
        const locationCell = document.createElement('td');
        locationCell.style.cssText = `
          padding: 6px;
          border-bottom: 1px solid #EBEDF0;
        `;
        locationCell.textContent = member.location || '-';
        row.appendChild(locationCell);
        
        tbody.appendChild(row);
      });
      
      table.appendChild(tbody);
      this.resultContainer.appendChild(table);
    }
  }

  // Contar miembros del grupo
  async countMembers() {
    console.log('GroupMemberUI: Iniciando conteo de miembros');
    
    // Cambiar el texto del botón para mostrar que está contando
    this.countButton.textContent = 'Contando...';
    this.countButton.disabled = true;
    
    // Mostrar un mensaje de estado con animación
    this.groupMemberCount.innerHTML = 'Contando miembros <span class="counting-animation">...</span>';
    
    // Agregar estilos para la animación si no existen
    if (!document.getElementById('counting-animation-style')) {
      const style = document.createElement('style');
      style.id = 'counting-animation-style';
      style.textContent = `
        @keyframes countingDots {
          0% { content: '.'; }
          33% { content: '..'; }
          66% { content: '...'; }
          100% { content: ''; }
        }
        .counting-animation {
          display: inline-block;
          width: 20px;
          animation: countingDots 1.5s infinite;
        }
      `;
      document.head.appendChild(style);
    }
    
    try {
      // Usar el GroupMemberFinder para contar los miembros
      const result = await this.memberFinder.countMembers();
      
      if (result.success) {
        // Actualizar la UI con el resultado
        this.groupMemberCount.innerHTML = `<strong>Total: ${result.totalCount} miembros</strong>`;
        this.groupMemberCount.style.color = '#4267B2';
        this.groupMemberCount.style.fontWeight = 'bold';
        
        // Crear un elemento para mostrar el desglose por secciones
        if (!this.countDetailsElement) {
          this.countDetailsElement = document.createElement('div');
          this.countDetailsElement.style.fontSize = '12px';
          this.countDetailsElement.style.marginTop = '8px';
          this.countDetailsElement.style.color = '#65676B';
          this.countDetailsElement.style.maxHeight = '100px';
          this.countDetailsElement.style.overflowY = 'auto';
          this.countDetailsElement.style.padding = '4px 0';
          this.groupMemberCount.parentNode.appendChild(this.countDetailsElement);
        }
        
        // Mostrar desglose por secciones
        this.countDetailsElement.innerHTML = '';
        
        // Crear un elemento para cada sección, ordenados por cantidad de miembros (mayor a menor)
        const sortedSections = Object.entries(result.sectionCounts)
          .sort((a, b) => b[1] - a[1])
          .filter(([_, count]) => count > 0); // Solo mostrar secciones con miembros
        
        if (sortedSections.length > 0) {
          for (const [section, count] of sortedSections) {
            const sectionElement = document.createElement('div');
            sectionElement.style.padding = '2px 0';
            sectionElement.style.borderBottom = '1px solid #F0F2F5';
            sectionElement.innerHTML = `• <span style="color: #4267B2; font-weight: 500;">${count}</span> ${count === 1 ? 'miembro' : 'miembros'} en ${section}`;
            this.countDetailsElement.appendChild(sectionElement);
          }
        } else {
          // Si no hay secciones con miembros, mostrar un mensaje
          const noSectionsElement = document.createElement('div');
          noSectionsElement.textContent = 'No se encontraron secciones de miembros';
          noSectionsElement.style.fontStyle = 'italic';
          this.countDetailsElement.appendChild(noSectionsElement);
        }
        
        console.log(`GroupMemberUI: Conteo completado - ${result.totalCount} miembros encontrados`);
      } else {
        this.groupMemberCount.innerHTML = '<span style="color: #E41E3F;">Error al contar miembros</span>';
        console.error('GroupMemberUI: Error al contar miembros');
      }
    } catch (error) {
      console.error('GroupMemberUI: Error durante el conteo de miembros', error);
      this.groupMemberCount.innerHTML = '<span style="color: #E41E3F;">Error al contar miembros</span>';
    } finally {
      // Restaurar el botón
      this.countButton.textContent = 'Contar Miembros';
      this.countButton.disabled = false;
    }
  }

  // Actualizar el progreso en la interfaz
  updateProgress(progressData) {
    console.log('GroupMemberUI: Updating progress - ', progressData);
    
    if (progressData.type === 'progress') {
      // Actualizar barra de progreso
      const progressFill = this.progressBar.querySelector('.lead-manager-progress-fill');
      if (progressFill) {
        progressFill.style.width = `${progressData.value}%`;
      }
      
      // Actualizar texto de estado
      this.statusText.textContent = progressData.message;
      
      // Actualizar contador de miembros
      this.memberCounter.textContent = `Miembros encontrados: ${progressData.membersFound || 0}`;
    } else if (progressData.type === 'complete') {
      // Actualizar texto de estado
      this.statusText.textContent = progressData.message;
      
      // Actualizar contador de miembros
      this.memberCounter.textContent = `Miembros encontrados: ${progressData.membersFound || 0}`;
      
      // Actualizar barra de progreso al 100%
      const progressFill = this.progressBar.querySelector('.lead-manager-progress-fill');
      if (progressFill) {
        progressFill.style.width = '100%';
      }
      
      // Detener la extracción
      this.stopExtraction();
    } else if (progressData.type === 'error') {
      // Actualizar texto de estado con el error
      this.statusText.textContent = progressData.message;
      this.statusText.style.color = '#E41E3F';
      
      // Reiniciar barra de progreso
      const progressFill = this.progressBar.querySelector('.lead-manager-progress-fill');
      if (progressFill) {
        progressFill.style.width = '0%';
      }
    } else if (progressData.type === 'newMember') {
      // Actualizar contador de miembros
      this.memberCounter.textContent = `Miembros encontrados: ${progressData.membersFound || 0}`;
    } else if (progressData.type === 'countComplete') {
      // Actualizar el contador de miembros en la parte superior de la interfaz
      this.groupMemberCount.textContent = `Total: ${progressData.totalCount} miembros`;
      
      // También podríamos actualizar un desglose por secciones si lo deseamos
      if (progressData.sectionCounts && Object.keys(progressData.sectionCounts).length > 0) {
        if (!this.countDetailsElement) {
          this.countDetailsElement = document.createElement('div');
          this.countDetailsElement.style.fontSize = '12px';
          this.countDetailsElement.style.marginTop = '8px';
          this.countDetailsElement.style.color = '#65676B';
          this.groupMemberCount.parentNode.appendChild(this.countDetailsElement);
        }
        
        this.countDetailsElement.innerHTML = '';
        for (const [section, count] of Object.entries(progressData.sectionCounts)) {
          const sectionElement = document.createElement('div');
          sectionElement.textContent = `• ${section}: ${count} miembros`;
          this.countDetailsElement.appendChild(sectionElement);
        }
      }
    }
  }

  // Exportar resultados
  exportResults(format) {
    console.log('GroupMemberUI: Exporting results as ' + format);
    
    const members = this.memberFinder.members;
    if (!members || members.length === 0) {
      alert('No hay miembros para exportar');
      return;
    }
    
    let fileName, downloadUrl;
    
    if (format === 'json') {
      fileName = `grupo_miembros_${this.groupInfo.id || 'unknown'}_${new Date().toISOString().split('T')[0]}.json`;
      downloadUrl = this.memberFinder.exportResults('json');
    } else if (format === 'csv') {
      fileName = `grupo_miembros_${this.groupInfo.id || 'unknown'}_${new Date().toISOString().split('T')[0]}.csv`;
      downloadUrl = this.memberFinder.exportResults('csv');
    }
    
    if (downloadUrl) {
      // Crear enlace de descarga
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = fileName;
      downloadLink.style.display = 'none';
      document.body.appendChild(downloadLink);
      
      // Iniciar descarga
      downloadLink.click();
      
      // Limpiar
      setTimeout(() => {
        URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(downloadLink);
      }, 100);
    }
  }
}

// Exportar la clase
window.leadManagerPro = window.leadManagerPro || {};
window.leadManagerPro.groupMemberUI = new GroupMemberUI();
