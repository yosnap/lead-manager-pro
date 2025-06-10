// Interfaz de usuario para filtros de búsqueda de grupos

class GroupSearchFiltersUI {
  constructor() {
    this.container = null;
    this.groupSearchFilters = null;
  }

  // Inicializar el módulo
  async init() {
    console.log('GroupSearchFiltersUI: Inicializando módulo');

    // Inicializar el módulo de filtros
    this.groupSearchFilters = window.leadManagerPro.groupSearchFilters;

    // Cargar filtros actuales
    await this.groupSearchFilters.loadFilters();

    return this;
  }

  // Crear el formulario de filtros
  createFiltersForm() {
    const formContainer = document.createElement('div');
    formContainer.className = 'lead-manager-group-filters-form';
    formContainer.style.cssText = `
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    `;

    // Obtener filtros actuales
    const filters = this.groupSearchFilters.getAllFilters();

    // Título de la sección
    const title = document.createElement('h3');
    title.textContent = 'Filtros de Búsqueda de Grupos';
    title.style.cssText = `
      margin: 0 0 16px 0;
      color: #4267B2;
      font-size: 16px;
      font-weight: 600;
    `;

    // Separar esta línea y verificar si filters ya existe
    const allFilters = this.groupSearchFilters.getAllFilters();

    // Crear secciones
    const groupTypesSection = this.createGroupTypesSection(filters.groupTypes);
    const minUsersSection = this.createMinUsersSection(filters.minUsers);
    const minPostsSection = this.createMinPostsSection(filters.minPosts);
    const buttonsContainer = this.createButtonsContainer();

    // Ensamblar formulario
    formContainer.appendChild(title);
    formContainer.appendChild(groupTypesSection);
    formContainer.appendChild(minUsersSection);
    formContainer.appendChild(minPostsSection);
    formContainer.appendChild(buttonsContainer);

    return formContainer;
  }

  // Crear sección de tipos de grupo
  createGroupTypesSection(groupTypes) {
    const section = document.createElement('div');
    section.style.marginBottom = '16px';

    const label = document.createElement('label');
    label.textContent = 'Tipos de grupo:';
    label.style.cssText = `
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #1c1e21;
    `;

    const checkboxContainer = document.createElement('div');
    checkboxContainer.style.cssText = `
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    `;

    // Checkbox para grupos públicos
    const publicLabel = document.createElement('label');
    publicLabel.style.cssText = `
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
    `;

    const publicCheckbox = document.createElement('input');
    publicCheckbox.type = 'checkbox';
    publicCheckbox.id = 'group-type-public';
    publicCheckbox.checked = groupTypes.public;

    const publicText = document.createElement('span');
    publicText.textContent = 'Público';

    publicLabel.appendChild(publicCheckbox);
    publicLabel.appendChild(publicText);
    // Checkbox para grupos privados
    const privateLabel = document.createElement('label');
    privateLabel.style.cssText = `
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
    `;

    const privateCheckbox = document.createElement('input');
    privateCheckbox.type = 'checkbox';
    privateCheckbox.id = 'group-type-private';
    privateCheckbox.checked = groupTypes.private;

    const privateText = document.createElement('span');
    privateText.textContent = 'Privado';

    privateLabel.appendChild(privateCheckbox);
    privateLabel.appendChild(privateText);

    checkboxContainer.appendChild(publicLabel);
    checkboxContainer.appendChild(privateLabel);

    section.appendChild(label);
    section.appendChild(checkboxContainer);

    return section;
  }

  // Crear sección de miembros mínimos
  createMinUsersSection(minUsers) {
    const section = document.createElement('div');
    section.style.marginBottom = '16px';

    const label = document.createElement('label');
    label.textContent = 'Cantidad mínima de miembros:';
    label.style.cssText = `
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      color: #1c1e21;
    `;

    const input = document.createElement('input');
    input.type = 'number';
    input.id = 'min-users';
    input.min = '1';
    input.value = minUsers;
    input.style.cssText = `
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    `;

    section.appendChild(label);
    section.appendChild(input);

    return section;
  }
  // Crear sección de publicaciones mínimas
  createMinPostsSection(minPosts) {
    const section = document.createElement('div');
    section.style.marginBottom = '16px';

    const label = document.createElement('label');
    label.textContent = 'Cantidad mínima de publicaciones:';
    label.style.cssText = `
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #1c1e21;
    `;

    const note = document.createElement('p');
    note.textContent = 'El grupo será válido si cumple con al menos uno de estos criterios:';
    note.style.cssText = `
      margin: 0 0 12px 0;
      font-size: 12px;
      color: #65676b;
      font-style: italic;
    `;

    const postsContainer = document.createElement('div');
    postsContainer.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
    `;

    // Input para publicaciones por año
    const yearContainer = document.createElement('div');
    const yearLabel = document.createElement('label');
    yearLabel.textContent = 'Por año:';
    yearLabel.style.cssText = `display: block; margin-bottom: 4px; font-size: 12px;`;

    const yearInput = document.createElement('input');
    yearInput.type = 'number';
    yearInput.id = 'min-posts-year';
    yearInput.min = '0';
    yearInput.value = minPosts.year;
    yearInput.style.cssText = `
      width: 100%;
      padding: 6px 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 12px;
    `;

    yearContainer.appendChild(yearLabel);
    yearContainer.appendChild(yearInput);

    // Input para publicaciones por mes
    const monthContainer = document.createElement('div');
    const monthLabel = document.createElement('label');
    monthLabel.textContent = 'Por mes:';
    monthLabel.style.cssText = `display: block; margin-bottom: 4px; font-size: 12px;`;

    const monthInput = document.createElement('input');
    monthInput.type = 'number';
    monthInput.id = 'min-posts-month';
    monthInput.min = '0';
    monthInput.value = minPosts.month;    monthInput.style.cssText = `
      width: 100%;
      padding: 6px 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 12px;
    `;

    monthContainer.appendChild(monthLabel);
    monthContainer.appendChild(monthInput);

    // Input para publicaciones por día
    const dayContainer = document.createElement('div');
    const dayLabel = document.createElement('label');
    dayLabel.textContent = 'Por día:';
    dayLabel.style.cssText = `display: block; margin-bottom: 4px; font-size: 12px;`;

    const dayInput = document.createElement('input');
    dayInput.type = 'number';
    dayInput.id = 'min-posts-day';
    dayInput.min = '0';
    dayInput.value = minPosts.day;
    dayInput.style.cssText = `
      width: 100%;
      padding: 6px 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 12px;
    `;

    dayContainer.appendChild(dayLabel);
    dayContainer.appendChild(dayInput);

    postsContainer.appendChild(yearContainer);
    postsContainer.appendChild(monthContainer);
    postsContainer.appendChild(dayContainer);

    section.appendChild(label);
    section.appendChild(note);
    section.appendChild(postsContainer);

    return section;
  }

  // Crear contenedor de botones
  createButtonsContainer() {
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 20px;
    `;

    // Botón de guardar
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Guardar filtros';
    saveButton.id = 'save-group-filters';
    saveButton.style.cssText = `
      padding: 8px 16px;
      background-color: #4267B2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    `;
    // Botón de reset
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Restablecer';
    resetButton.id = 'reset-group-filters';
    resetButton.style.cssText = `
      padding: 8px 16px;
      background-color: #6c757d;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    `;

    // Event listeners
    saveButton.addEventListener('click', () => this.saveFilters());
    resetButton.addEventListener('click', () => this.resetFilters());

    container.appendChild(resetButton);
    container.appendChild(saveButton);

    return container;
  }

  // Guardar filtros
  async saveFilters() {
    try {
      // Obtener valores del formulario
      const publicChecked = document.getElementById('group-type-public').checked;
      const privateChecked = document.getElementById('group-type-private').checked;
      const minUsers = parseInt(document.getElementById('min-users').value);
      const minPostsYear = parseInt(document.getElementById('min-posts-year').value);
      const minPostsMonth = parseInt(document.getElementById('min-posts-month').value);
      const minPostsDay = parseInt(document.getElementById('min-posts-day').value);

      // Validar
      if (isNaN(minUsers) || minUsers < 1) {
        alert('La cantidad mínima de miembros debe ser un número mayor a 0');
        return;
      }

      if (!publicChecked && !privateChecked) {
        alert('Debe seleccionar al menos un tipo de grupo');
        return;
      }

      // Crear objeto de filtros
      const filters = {
        groupTypes: {
          public: publicChecked,
          private: privateChecked
        },
        minUsers: minUsers,
        minPosts: {
          year: isNaN(minPostsYear) ? 0 : minPostsYear,
          month: isNaN(minPostsMonth) ? 0 : minPostsMonth,
          day: isNaN(minPostsDay) ? 0 : minPostsDay
        }
      };

      // Guardar filtros
      const success = await this.groupSearchFilters.saveFilters(filters);

      if (success) {
        this.showMessage('Filtros guardados correctamente', 'success');
      } else {
        this.showMessage('Error al guardar filtros', 'error');
      }
    } catch (error) {
      console.error('Error al guardar filtros:', error);
      this.showMessage('Error al guardar filtros', 'error');
    }
  }
  // Restablecer filtros
  async resetFilters() {
    try {
      const success = await this.groupSearchFilters.resetFilters();

      if (success) {
        // Recargar el formulario con los valores por defecto
        const container = document.querySelector('.lead-manager-group-filters-form');
        if (container && container.parentNode) {
          const newForm = this.createFiltersForm();
          container.parentNode.replaceChild(newForm, container);
        }

        this.showMessage('Filtros restablecidos a valores por defecto', 'success');
      } else {
        this.showMessage('Error al restablecer filtros', 'error');
      }
    } catch (error) {
      console.error('Error al restablecer filtros:', error);
      this.showMessage('Error al restablecer filtros', 'error');
    }
  }

  // Mostrar mensaje
  showMessage(text, type = 'info') {
    const message = document.createElement('div');
    message.textContent = text;
    message.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 4px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      background-color: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
    `;

    document.body.appendChild(message);

    setTimeout(() => {
      if (message.parentNode) {
        document.body.removeChild(message);
      }
    }, 3000);
  }

  // Inyectar formulario en un contenedor
  injectFiltersForm(container) {
    if (!container) {
      console.error('GroupSearchFiltersUI: No se proporcionó un contenedor válido');
      return false;
    }

    // Limpiar el contenedor
    container.innerHTML = '';

    // Crear y agregar el formulario
    const form = this.createFiltersForm();
    container.appendChild(form);

    return true;
  }
}

// Exportar la clase
window.leadManagerPro = window.leadManagerPro || {};
window.leadManagerPro.groupSearchFiltersUI = new GroupSearchFiltersUI();
