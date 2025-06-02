    try {
      const options = {
        maxScrolls: parseInt(this.elements.maxScrolls?.value) || 50,
        scrollDelay: parseFloat(this.elements.scrollDelay?.value) || 2
      };
      
      await this.optionsManager.setOptions('general', options);
      
      // También actualizar los campos globales si existen
      if (this.elements.globalMaxScrolls) this.elements.globalMaxScrolls.value = options.maxScrolls;
      if (this.elements.globalScrollDelay) this.elements.globalScrollDelay.value = options.scrollDelay;
      
      console.log('SidebarOptionsController: Opciones generales guardadas:', options);
    } catch (error) {
      console.error('SidebarOptionsController: Error al guardar opciones generales:', error);
    }
  }
  
  async saveGroupOptions() {
    if (!this.isInitialized) return;
    
    try {
      const options = {
        types: {
          public: this.elements.publicGroups?.checked !== false,
          private: this.elements.privateGroups?.checked !== false
        },
        minUsers: parseInt(this.elements.minUsers?.value) || 0,
        minPosts: {
          year: parseInt(this.elements.minPostsYear?.value) || 0,
          month: parseInt(this.elements.minPostsMonth?.value) || 0,
          day: parseInt(this.elements.minPostsDay?.value) || 0
        }
      };
      
      await this.optionsManager.setOptions('groupSearch', options);
      console.log('SidebarOptionsController: Opciones de búsqueda de grupos guardadas:', options);
    } catch (error) {
      console.error('SidebarOptionsController: Error al guardar opciones de grupos:', error);
    }
  }
  
  async saveGlobalConfig() {
    try {
      const generalOptions = {
        maxScrolls: parseInt(this.elements.globalMaxScrolls?.value) || 50,
        scrollDelay: parseFloat(this.elements.globalScrollDelay?.value) || 2
      };
      
      await this.optionsManager.setOptions('general', generalOptions);
      
      // Actualizar también los campos locales
      if (this.elements.maxScrolls) this.elements.maxScrolls.value = generalOptions.maxScrolls;
      if (this.elements.scrollDelay) this.elements.scrollDelay.value = generalOptions.scrollDelay;
      
      this.showStatus('Configuración guardada correctamente', 'success');
      console.log('SidebarOptionsController: Configuración global guardada:', generalOptions);
    } catch (error) {
      this.showStatus('Error al guardar la configuración', 'error');
      console.error('SidebarOptionsController: Error al guardar configuración global:', error);
    }
  }
  
  showStatus(message, type = 'info') {
    if (!this.elements.globalSettingsStatus) return;
    
    this.elements.globalSettingsStatus.textContent = message;
    this.elements.globalSettingsStatus.className = `status ${type}`;
    
    // Auto-limpiar después de 3 segundos
    setTimeout(() => {
      this.elements.globalSettingsStatus.textContent = '';
      this.elements.globalSettingsStatus.className = 'status';
    }, 3000);
  }
  
  // Métodos públicos para obtener valores actuales
  getCurrentGeneralOptions() {
    return this.optionsManager.getOptions('general');
  }
  
  getCurrentGroupOptions() {
    return this.optionsManager.getOptions('groupSearch');
  }
  
  getGroupFilters() {
    return this.optionsManager.getGroupSearchFilters();
  }
  
  // Método para validar un grupo contra los filtros actuales
  validateGroup(group) {
    const filters = this.getGroupFilters();
    return filters.validateGroup(group);
  }
  
  // Listener para cambios de opciones
  onOptionsChange(section, callback) {
    return this.optionsManager.addListener(section, callback);
  }
}

// Crear instancia global
window.LeadManagerPro = window.LeadManagerPro || {};
window.LeadManagerPro.SidebarOptionsController = SidebarOptionsController;

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (window.LeadManagerPro?.OptionsManager) {
        window.LeadManagerPro.sidebarOptionsController = new SidebarOptionsController();
        window.LeadManagerPro.sidebarOptionsController.init();
      }
    }, 100);
  });
} else {
  setTimeout(() => {
    if (window.LeadManagerPro?.OptionsManager) {
      window.LeadManagerPro.sidebarOptionsController = new SidebarOptionsController();
      window.LeadManagerPro.sidebarOptionsController.init();
    }
  }, 100);
}
