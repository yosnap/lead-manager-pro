// Módulo para gestionar los filtros de búsqueda de grupos

class GroupSearchFilters {
  constructor() {
    this.defaultFilters = {
      groupTypes: {
        public: true,
        private: true
      },
      minMembers: 100,
      minPosts: {
        year: 50,
        month: 10,
        day: 1
      }
    };
    this.filters = this.loadFilters();
  }

  // Cargar filtros desde chrome.storage.sync
  async loadFilters() {
    try {
      const result = await new Promise(resolve => {
        chrome.storage.sync.get(['groupSearchSettings'], result => resolve(result));
      });
      if (result && result.groupSearchSettings) {
        console.log('Filtros de búsqueda de grupos encontrados:', result.groupSearchSettings);
        return { ...this.defaultFilters, ...result.groupSearchSettings };
      } else {
        console.log('No se encontraron filtros guardados, usando valores por defecto');
        await this.saveFilters(this.defaultFilters);
        return { ...this.defaultFilters };
      }
    } catch (error) {
      console.error('Error al cargar filtros de búsqueda de grupos:', error);
      await this.saveFilters(this.defaultFilters);
      return { ...this.defaultFilters };
    }
  }

  // Guardar filtros en chrome.storage.sync
  async saveFilters(filters) {
    try {
      const newFilters = { ...this.filters, ...filters };
      this.filters = newFilters;
      await new Promise(resolve => {
        chrome.storage.sync.set({ 'groupSearchSettings': newFilters }, resolve);
      });
      console.log('Filtros de búsqueda de grupos guardados:', newFilters);
      return true;
    } catch (error) {
      console.error('Error al guardar filtros de búsqueda de grupos:', error);
      return false;
    }
  }

  // Obtener un filtro específico
  getFilter(key) {
    return this.filters[key];
  }

  // Establecer un filtro específico
  async setFilter(key, value) {
    const filters = { ...this.filters };
    filters[key] = value;
    return await this.saveFilters(filters);
  }

  // Obtener todos los filtros
  getAllFilters() {
    return { ...this.filters };
  }

  // Restablecer filtros a los valores por defecto
  async resetFilters() {
    this.filters = { ...this.defaultFilters };
    return await this.saveFilters(this.filters);
  }

  // Validar si un grupo cumple con los filtros
  validateGroup(groupData) {
    try {
      if (!this.validateGroupType(groupData.type)) {
        return { valid: false, reason: 'Tipo de grupo no permitido' };
      }
      if (!this.validateMemberCount(groupData.memberCount)) {
        return { valid: false, reason: 'No cumple con la cantidad mínima de miembros' };
      }
      if (!this.validatePostCount(groupData.postStats)) {
        return { valid: false, reason: 'No cumple con la cantidad mínima de publicaciones' };
      }
      return { valid: true, reason: 'Grupo válido según filtros' };
    } catch (error) {
      console.error('Error al validar grupo:', error);
      return { valid: false, reason: 'Error en validación' };
    }
  }
  validateGroupType(groupType) {
    if (!groupType) return false;
    const normalizedType = groupType.toLowerCase();
    if (normalizedType.includes('public') || normalizedType.includes('público')) {
      return this.filters.groupTypes.public;
    }
    if (normalizedType.includes('private') || normalizedType.includes('privado')) {
      return this.filters.groupTypes.private;
    }
    return true;
  }
  validateMemberCount(memberCount) {
    if (typeof memberCount !== 'number' || isNaN(memberCount)) {
      return false;
    }
    return memberCount >= this.filters.minMembers;
  }
  validatePostCount(postStats) {
    if (!postStats || typeof postStats !== 'object') {
      return false;
    }
    const yearValid = postStats.year >= this.filters.minPosts.year;
    const monthValid = postStats.month >= this.filters.minPosts.month;
    const dayValid = postStats.day >= this.filters.minPosts.day;
    return yearValid || monthValid || dayValid;
  }
  getValidationCriteria() {
    const criteria = [];
    const allowedTypes = [];
    if (this.filters.groupTypes.public) allowedTypes.push('Público');
    if (this.filters.groupTypes.private) allowedTypes.push('Privado');
    criteria.push(`Tipos: ${allowedTypes.join(', ')}`);
    criteria.push(`Miembros mínimos: ${this.filters.minMembers}`);
    const postCriteria = [];
    if (this.filters.minPosts.year > 0) postCriteria.push(`${this.filters.minPosts.year}/año`);
    if (this.filters.minPosts.month > 0) postCriteria.push(`${this.filters.minPosts.month}/mes`);
    if (this.filters.minPosts.day > 0) postCriteria.push(`${this.filters.minPosts.day}/día`);
    criteria.push(`Publicaciones (cualquiera): ${postCriteria.join(' o ')}`);
    return criteria;
  }
}

// Exportar la clase
window.leadManagerPro = window.leadManagerPro || {};
window.leadManagerPro.groupSearchFilters = new GroupSearchFilters();
