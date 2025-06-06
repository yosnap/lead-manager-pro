    class SidebarOptionsController {
      constructor() {
        this.optionsManager = null;
        this.elements = {};
        this.isInitialized = false;
      }

      async init() {
        // Esperar a que OptionsManager esté disponible
        if (!window.LeadManagerPro?.OptionsManager) {
          setTimeout(() => this.init(), 100);
          return;
        }

        this.optionsManager = window.LeadManagerPro.OptionsManager;
        await this.initializeElements();
        await this.loadCurrentOptions();
        this.bindEvents();
        this.isInitialized = true;
        console.log('SidebarOptionsController inicializado');
      }

      async initializeElements() {
        // Elementos de configuración general
        this.elements = {
          maxScrolls: document.getElementById('max-scrolls'),
          scrollDelay: document.getElementById('scroll-delay'),
          globalMaxScrolls: document.getElementById('global-max-scrolls'),
          globalScrollDelay: document.getElementById('global-scroll-delay'),
          publicGroups: document.getElementById('public-groups'),
          privateGroups: document.getElementById('private-groups'),
          minUsers: document.getElementById('min-users'),
          minPostsYear: document.getElementById('min-posts-year'),
          minPostsMonth: document.getElementById('min-posts-month'),
          minPostsDay: document.getElementById('min-posts-day'),
          onlyPublicGroups: document.getElementById('only-public-groups'),
          globalSettingsStatus: document.getElementById('global-settings-status')
        };
      }

      async loadCurrentOptions() {
        try {
          // Cargar opciones de personas
          const peopleOptions = await this.optionsManager.getOptions('peopleSearchSettings');
          if (peopleOptions) {
            if (this.elements.maxScrolls) this.elements.maxScrolls.value = peopleOptions.maxScrolls || 50;
            if (this.elements.scrollDelay) this.elements.scrollDelay.value = peopleOptions.scrollDelay || 2;
            if (this.elements.globalMaxScrolls) this.elements.globalMaxScrolls.value = peopleOptions.maxScrolls || 50;
            if (this.elements.globalScrollDelay) this.elements.globalScrollDelay.value = peopleOptions.scrollDelay || 2;
          }

          // Cargar opciones de búsqueda de grupos
          const groupOptions = await this.optionsManager.getOptions('groupSearchSettings');
          if (groupOptions) {
            if (this.elements.publicGroups) this.elements.publicGroups.checked = groupOptions.types?.public !== false;
            if (this.elements.privateGroups) this.elements.privateGroups.checked = groupOptions.types?.private !== false;
            if (this.elements.minUsers) this.elements.minUsers.value = groupOptions.minUsers || 0;
            if (this.elements.minPostsYear) this.elements.minPostsYear.value = groupOptions.minPosts?.year || 0;
            if (this.elements.minPostsMonth) this.elements.minPostsMonth.value = groupOptions.minPosts?.month || 0;
            if (this.elements.minPostsDay) this.elements.minPostsDay.value = groupOptions.minPosts?.day || 0;
            if (this.elements.onlyPublicGroups) this.elements.onlyPublicGroups.checked = !!groupOptions.onlyPublicGroups;
          }
        } catch (error) {
          console.error('SidebarOptionsController: Error al cargar opciones:', error);
        }
      }

      bindEvents() {
        // Eventos para configuración general
        if (this.elements.maxScrolls) {
          this.elements.maxScrolls.addEventListener('change', () => this.saveGeneralOptions());
        }
        if (this.elements.scrollDelay) {
          this.elements.scrollDelay.addEventListener('change', () => this.saveGeneralOptions());
        }

        // Eventos para configuración global
        if (this.elements.globalMaxScrolls) {
          this.elements.globalMaxScrolls.addEventListener('change', () => this.saveGlobalConfig());
        }
        if (this.elements.globalScrollDelay) {
          this.elements.globalScrollDelay.addEventListener('change', () => this.saveGlobalConfig());
        }

        // Eventos para opciones de grupos
        const groupElements = [
          this.elements.publicGroups,
          this.elements.privateGroups,
          this.elements.minUsers,
          this.elements.minPostsYear,
          this.elements.minPostsMonth,
          this.elements.minPostsDay
        ];

        groupElements.forEach(element => {
          if (element) {
            element.addEventListener('change', () => this.saveGroupOptions());
          }
        });
      }

      async saveGeneralOptions() {
        if (!this.isInitialized) return;

        try {
          const options = {
            maxScrolls: parseInt(this.elements.maxScrolls?.value) || 50,
            scrollDelay: parseFloat(this.elements.scrollDelay?.value) || 2
          };

          await this.optionsManager.setOptions('peopleSearchSettings', options);
          await this.loadCurrentOptions();

          // También actualizar los campos globales si existen
          if (this.elements.globalMaxScrolls) this.elements.globalMaxScrolls.value = options.maxScrolls;
          if (this.elements.globalScrollDelay) this.elements.globalScrollDelay.value = options.scrollDelay;

          console.log('SidebarOptionsController: Opciones de personas guardadas:', options);
        } catch (error) {
          console.error('SidebarOptionsController: Error al guardar opciones de personas:', error);
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
            },
            onlyPublicGroups: this.elements.onlyPublicGroups?.checked === true
          };

          await this.optionsManager.setOptions('groupSearchSettings', options);
          await this.loadCurrentOptions();
          console.log('SidebarOptionsController: Opciones de búsqueda de grupos guardadas:', options);
        } catch (error) {
          console.error('SidebarOptionsController: Error al guardar opciones de grupos:', error);
        }
      }

      async saveGlobalConfig() {
        try {
          const peopleOptions = {
            maxScrolls: parseInt(this.elements.globalMaxScrolls?.value) || 50,
            scrollDelay: parseFloat(this.elements.globalScrollDelay?.value) || 2
          };

          await this.optionsManager.setOptions('peopleSearchSettings', peopleOptions);

          // Actualizar también los campos locales
          if (this.elements.maxScrolls) this.elements.maxScrolls.value = peopleOptions.maxScrolls;
          if (this.elements.scrollDelay) this.elements.scrollDelay.value = peopleOptions.scrollDelay;

          this.showStatus('Configuración guardada correctamente', 'success');
          console.log('SidebarOptionsController: Configuración global guardada:', peopleOptions);
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
        return this.optionsManager.getOptions('peopleSearchSettings');
      }

      getCurrentGroupOptions() {
        return this.optionsManager.getOptions('groupSearchSettings');
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
