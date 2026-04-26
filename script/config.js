// AQUENTA Cloud Configuration
// Update this URL to point to your Azure App Service API
window.AQUENTA_API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5024/api'
    : '/api';
