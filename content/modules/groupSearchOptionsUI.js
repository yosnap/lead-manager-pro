// Módulo para la interfaz de usuario de opciones de búsqueda de grupos

class GroupSearchOptionsUI {
  constructor() {
    this.container = null;
    this.groupSearchOptions = null;
  }

  // Inicializar el módulo
  init() {
    console.log('GroupSearchOptionsUI: Initializing module');
    
    // Inicializar el módulo de opciones de búsqueda de grupos
    this.groupSearchOptions = window.leadManagerPro.groupSearchOptions;
    
    return this;
  }

  // Crear el formulario de opciones de búsqueda
  createOptionsForm() {
    // Crear contenedor para el formulario
    const formContainer = document.createElement('div');
    formContainer.className = 'lead-manager-group-options-form';
    
    // Obtener las opciones actuales
    const options = this.groupSearchOptions.getAllOptions();
    
    // Título de la sección de tipos de grupo
    const groupTypesTitle = document.createElement('div');
    groupTypesTitle.textContent = 'Tipos de grupo:';
    groupTypesTitle.style.fontWeight = 'bold';
    groupTypesTitle.style.marginBottom = '8px';
    
    // Contenedor para checkboxes de tipos de grupo
    const groupTypesContainer = document.createElement('div');
    groupTypesContainer.style.marginBottom = '16px';
    
    // Checkbox para grupos públicos
    const publicGroupLabel = document.createElement('label');
    publicGroupLabel.style.display = 'flex';
    publicGroupLabel.style.alignItems = 'center';
    publicGroupLabel.style.marginBottom = '6px';
    
    const publicGroupCheckbox = document.createElement('input');
    publicGroupCheckbox.type = 'checkbox';
    publicGroupCheckbox.checked = options.publicGroups;
    publicGroupCheckbox.style.marginRight = '8px';
    
    const publicGroupText = document.createTextNode('Público');
    
    publicGroupLabel.appendChild(publicGroupCheckbox);
    publicGroupLabel.appendChild(publicGroupText);
    
    // Checkbox para grupos privados
    const privateGroupLabel = document.createElement('label');
    privateGroupLabel.style.display = 'flex';
    privateGroupLabel.style.alignItems = 'center';
    
    const privateGroupCheckbox = document.createElement('input');
    privateGroupCheckbox.type = 'checkbox';
    privateGroupCheckbox.checked = options.privateGroups;
    privateGroupCheckbox.style.marginRight = '8px';
    
    const privateGroupText = document.createTextNode('Privado');
    
    privateGroupLabel.appendChild(privateGroupCheckbox);
    privateGroupLabel.appendChild(privateGroupText);
    
    // Agregar checkboxes al contenedor
    groupTypesContainer.appendChild(publicGroupLabel);
    groupTypesContainer.appendChild(privateGroupLabel);
    
    // Título de la sección de miembros
    const membersTitle = document.createElement('div');
    membersTitle.textContent = 'Número mínimo de usuarios:';
    membersTitle.style.fontWeight = 'bold';
    membersTitle.style.marginBottom = '8px';
    
    // Campo para número mínimo de usuarios
    const minUsersInput = document.createElement('input');
    minUsersInput.type = 'number';
    minUsersInput.min = '0';
    minUsersInput.value = options.minUsers;
    minUsersInput.style.width = '100%';
    minUsersInput.style.padding = '6px';
    minUsersInput.style.marginBottom = '16px';
    minUsersInput.style.borderRadius = '4px';
    minUsersInput.style.border = '1px solid #CED0D4';
    
    // Título de la sección de publicaciones
    const postsTitle = document.createElement('div');
    postsTitle.textContent = 'Número mínimo de publicaciones:';
    postsTitle.style.fontWeight = 'bold';
    postsTitle.style.marginBottom = '8px';
    
    // Contenedor para las opciones de publicaciones
    const postsContainer = document.createElement('div');
    
    // Opción para publicaciones anuales
    const yearPostsLabel = document.createElement('label');
    yearPostsLabel.textContent = 'Anuales:';
    yearPostsLabel.style.display = 'block';
    yearPostsLabel.style.marginBottom = '4px';
    
    const yearPostsInput = document.createElement('input');
    yearPostsInput.type = 'number';
    yearPostsInput.min = '0';
    yearPostsInput.value = options.minPostsYear;
    yearPostsInput.style.width = '100%';
    yearPostsInput.style.padding = '6px';
    yearPostsInput.style.marginBottom = '12px';
    yearPostsInput.style.borderRadius = '4px';
    yearPostsInput.style.border = '1px solid #CED0D4';
    
    // Opción para publicaciones mensuales
    const monthPostsLabel = document.createElement('label');
    monthPostsLabel.textContent = 'Mensuales:';
    monthPostsLabel.style.display = 'block';
    monthPostsLabel.style.marginBottom = '4px';
    
    const monthPostsInput = document.createElement('input');
    monthPostsInput.type = 'number';
    monthPostsInput.min = '0';
    monthPostsInput.value = options.minPostsMonth;
    monthPostsInput.style.width = '100%';
    monthPostsInput.style.padding = '6px';
    monthPostsInput.style.marginBottom = '12px';
    monthPostsInput.style.borderRadius = '4px';
    monthPostsInput.style.border = '1px solid #CED0D4';
    
    // Opción para publicaciones diarias
    const dayPostsLabel = document.createElement('label');
    dayPostsLabel.textContent = 'Diarias:';
    dayPostsLabel.style.display = 'block';
    dayPostsLabel.style.marginBottom = '4px';
    
    const dayPostsInput = document.createElement('input');
    dayPostsInput.type = 'number';
    dayPostsInput.min = '0';
    dayPostsInput.value = options.minPostsDay;
    dayPostsInput.style.width = '100%';
    dayPostsInput.style.padding = '6px';
    dayPostsInput.style.marginBottom = '12px';
    dayPostsInput.style.borderRadius = '4px';
    dayPostsInput.style.border = '1px solid #CED0D4';
    
    // Agregar opciones de publicaciones al contenedor
    postsContainer.appendChild(yearPostsLabel);
    postsContainer.appendChild(yearPostsInput);
    postsContainer.appendChild(monthPostsLabel);
    postsContainer.appendChild(monthPostsInput);
    postsContainer.appendChild(dayPostsLabel);
    postsContainer.appendChild(dayPostsInput);
    
    // Agregar nota sobre la lógica de filtrado
    const filterNote = document.createElement('div');
    filterNote.style.fontSize = '12px';
    filterNote.style.color = '#65676B';
    filterNote.style.marginTop = '8px';
    filterNote.style.marginBottom = '16px';
    filterNote.innerHTML = '<strong>Nota:</strong> Se deben cumplir siempre el mínimo de usuarios. Para las publicaciones, basta que cumpla cualquiera de los mínimos (anual, mensual o diario).';
    
    // Botón de guardar
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Guardar opciones';
    saveButton.className = 'lead-manager-button';
    saveButton.style.cssText = `
      padding: 8px 16px;
      background-color: #4267B2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      margin-top: 8px;
    `;
    
    // Agregar evento de clic al botón
    saveButton.addEventListener('click', () => {
      // Obtener y validar valores
      const publicGroups = publicGroupCheckbox.checked;
      const privateGroups = privateGroupCheckbox.checked;
      const minUsers = parseInt(minUsersInput.value) || 0;
      
      // Para las publicaciones, debemos mantener los valores como están, 
      // incluso si son strings vacíos, para respetar la lógica de filtrado
      const minPostsYear = yearPostsInput.value.trim() === '' ? '' : parseInt(yearPostsInput.value) || 0;
      const minPostsMonth = monthPostsInput.value.trim() === '' ? '' : parseInt(monthPostsInput.value) || 0;
      const minPostsDay = dayPostsInput.value.trim() === '' ? '' : parseInt(dayPostsInput.value) || 0;
      
      // Validar que al menos un tipo de grupo esté seleccionado
      if (!publicGroups && !privateGroups) {
        alert('Por favor, seleccione al menos un tipo de grupo (público o privado)');
        return;
      }
      
      // Guardar opciones
      const success = this.groupSearchOptions.saveOptions({
        publicGroups: publicGroups,
        privateGroups: privateGroups,
        minUsers: minUsers,
        minPostsYear: minPostsYear,
        minPostsMonth: minPostsMonth,
        minPostsDay: minPostsDay
      });
      
      if (success) {
        // Mostrar mensaje de éxito
        const successMessage = document.createElement('div');
        successMessage.textContent = '✓ Opciones guardadas correctamente';
        successMessage.style.cssText = `
          color: #00C851;
          margin-top: 8px;
          font-size: 14px;
        `;
        
        formContainer.appendChild(successMessage);
        
        // Eliminar el mensaje después de 3 segundos
        setTimeout(() => {
          if (formContainer.contains(successMessage)) {
            formContainer.removeChild(successMessage);
          }
        }, 3000);
      } else {
        alert('Error al guardar las opciones. Por favor, intente de nuevo.');
      }
    });
    
    // Ensamblar el formulario
    formContainer.appendChild(groupTypesTitle);
    formContainer.appendChild(groupTypesContainer);
    formContainer.appendChild(membersTitle);
    formContainer.appendChild(minUsersInput);
    formContainer.appendChild(postsTitle);
    formContainer.appendChild(postsContainer);
    formContainer.appendChild(filterNote);
    formContainer.appendChild(saveButton);
    
    return formContainer;
  }

  // Inyectar formulario de opciones en un contenedor
  injectOptionsForm(container) {
    if (!container) {
      console.error('GroupSearchOptionsUI: No se proporcionó un contenedor válido');
      return false;
    }
    
    // Limpiar el contenedor
    container.innerHTML = '';
    
    // Crear y agregar el formulario
    const form = this.createOptionsForm();
    container.appendChild(form);
    
    return true;
  }
}

// Exportar la clase
window.leadManagerPro = window.leadManagerPro || {};
window.leadManagerPro.groupSearchOptionsUI = new GroupSearchOptionsUI();
