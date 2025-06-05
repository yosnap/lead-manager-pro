/**
 * Inicializa las opciones por defecto para la extensión
 * Este módulo se asegura de que siempre existan valores por defecto válidos para evitar errores
 */

// Namespace para la organización del código
window.LeadManagerPro = window.LeadManagerPro || {};
window.LeadManagerPro.modules = window.LeadManagerPro.modules || {};

/**
 * Inicializa las opciones por defecto en localStorage y chrome.storage
 */
window.LeadManagerPro.modules.initializeDefaultOptions = function() {
  console.log('Lead Manager Pro: Inicializando opciones por defecto');

  // Opciones generales por defecto
  const defaultGeneralOptions = {
    maxScrolls: 50,
    scrollDelay: 2
  };

  // Opciones de grupo por defecto
  const defaultGroupOptions = {
    publicGroups: true,
    privateGroups: true,
    minUsers: 0,
    minPostsYear: '',
    minPostsMonth: '',
    minPostsDay: ''
  };

  // Guardar en localStorage
  try {
    // Comprobar si ya existen opciones generales
    const existingGeneralOptions = localStorage.getItem('snap_lead_manager_general_options');
    if (!existingGeneralOptions) {
      localStorage.setItem('snap_lead_manager_general_options', JSON.stringify(defaultGeneralOptions));
      console.log('Opciones generales por defecto guardadas en localStorage');
    }

    // Comprobar si ya existen opciones de grupo
    const existingGroupOptions = localStorage.getItem('lmp_group_search_options');
    if (!existingGroupOptions) {
      localStorage.setItem('lmp_group_search_options', JSON.stringify(defaultGroupOptions));
      console.log('Opciones de grupo por defecto guardadas en localStorage');
    }
  } catch (storageError) {
    console.error('Error al guardar opciones por defecto en localStorage:', storageError);
  }

  // Guardar en chrome.storage
  try {
    chrome.storage.local.get(['maxScrolls', 'scrollDelay', 'groupPublic', 'groupPrivate', 'minUsers'], function(result) {
      const storageData = {};

      // Solo guardar valores que no existan ya
      if (result.maxScrolls === undefined) storageData.maxScrolls = defaultGeneralOptions.maxScrolls;
      if (result.scrollDelay === undefined) storageData.scrollDelay = defaultGeneralOptions.scrollDelay;
      if (result.groupPublic === undefined) storageData.groupPublic = defaultGroupOptions.publicGroups;
      if (result.groupPrivate === undefined) storageData.groupPrivate = defaultGroupOptions.privateGroups;
      if (result.minUsers === undefined) storageData.minUsers = defaultGroupOptions.minUsers;

      // Solo guardar si hay nuevos valores
      if (Object.keys(storageData).length > 0) {
        chrome.storage.local.set(storageData, function() {
          console.log('Opciones por defecto guardadas en chrome.storage.local:', storageData);
        });
      }
    });
  } catch (chromeError) {
    console.error('Error al guardar opciones por defecto en chrome.storage:', chromeError);
  }

  return true;
};

// Ejecutar inicialización al cargar
window.LeadManagerPro.modules.initializeDefaultOptions();

// Exponer en namespace leadManagerPro para compatibilidad
window.leadManagerPro = window.leadManagerPro || {};
window.leadManagerPro.initializeDefaults = {
  initialize: window.LeadManagerPro.modules.initializeDefaultOptions
};
