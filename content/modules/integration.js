/**
 * Integration module - Compatibility placeholder
 * 
 * This file serves as a compatibility layer to ensure the extension loads properly.
 * It redirects functionality to the n8nIntegration module.
 */

// Create a namespace for integration functionality
window.leadManagerPro = window.leadManagerPro || {};

// Redirect to n8nIntegration if it exists
if (window.leadManagerPro.n8nIntegration) {
  console.log('Integration module: Redirecting to n8nIntegration module');
  window.leadManagerPro.integration = window.leadManagerPro.n8nIntegration;
} else {
  // Provide a minimal implementation if n8nIntegration is not available
  console.log('Integration module: Creating minimal implementation');
  window.leadManagerPro.integration = {
    init: function() {
      console.log('Integration module initialized (minimal implementation)');
    },
    sendData: function(data) {
      console.log('Integration module: sendData called with', data);
      return Promise.resolve({ success: false, message: 'Integration not implemented' });
    },
    isConfigured: function() {
      return false;
    }
  };
}

// Export the integration module
console.log('Integration module loaded');
