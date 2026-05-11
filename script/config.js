// AQUENTA Cloud Configuration
// Update this URL to point to your Azure App Service API
window.AQUENTA_API_BASE_URL = (window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5024/api'
    : 'https://aquentawebapp-bgcjgpgfbbfddmb6.southeastasia-01.azurewebsites.net/api';

console.log('[CONFIG] Page Protocol:', window.location.protocol);
console.log('[CONFIG] Page Hostname:', window.location.hostname);
console.log('[CONFIG] API Base URL Set To:', window.AQUENTA_API_BASE_URL);
