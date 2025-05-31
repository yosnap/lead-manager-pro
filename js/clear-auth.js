// Script para limpiar todos los datos de autenticación

// Limpiar chrome.storage.sync
chrome.storage.sync.remove(['lmp_auth', 'lmp_auth_user', 'lmp_auth_timestamp', 'lmp_username', 'lmp_password', 'lmp_remember', 'lmp_saved_username', 'lmp_saved_password'], function() {
  console.log('Datos eliminados de chrome.storage.sync');
});

// Limpiar chrome.storage.local
chrome.storage.local.remove(['lmp_auth', 'lmp_auth_user', 'lmp_auth_timestamp', 'lmp_username', 'lmp_password', 'lmp_remember', 'lmp_saved_username', 'lmp_saved_password'], function() {
  console.log('Datos eliminados de chrome.storage.local');
});

// Limpiar localStorage
const keysToRemove = ['lmp_auth', 'lmp_auth_user', 'lmp_auth_timestamp', 'lmp_username', 'lmp_password', 'lmp_remember', 'lmp_saved_username', 'lmp_saved_password'];
keysToRemove.forEach(key => localStorage.removeItem(key));
console.log('Datos eliminados de localStorage');

console.log('Todos los datos de autenticación han sido eliminados. Por favor, recarga la extensión.');
