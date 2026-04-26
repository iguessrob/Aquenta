(function () {
  const DEFAULT_API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5024/api'
    : '/api';

  function getApiBaseUrl() {
    let url = DEFAULT_API_BASE_URL;

    if (window.AQUENTA_API_BASE_URL && typeof window.AQUENTA_API_BASE_URL === 'string') {
      url = window.AQUENTA_API_BASE_URL;
    } else {
      const stored = localStorage.getItem('AQUENTA_API_BASE_URL');
      if (stored && typeof stored === 'string') {
        url = stored;
      }
    }

    url = url.replace(/\/$/, '');

    // Auto-fix: Ensure /api is appended if missing (except for localhost where it might be explicit)
    if (!url.toLowerCase().endsWith('/api')) {
      url += '/api';
    }

    return url;
  }

  async function request(path, options) {
    const baseUrl = getApiBaseUrl();
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const response = await fetch(`${baseUrl}${normalizedPath}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options && options.headers ? options.headers : {}),
        ...(() => {
          const userJson = localStorage.getItem('aquentaUser');
          if (userJson) {
            try {
              const user = JSON.parse(userJson);
              if (user.token) {
                return { 'Authorization': `Bearer ${user.token}` };
              }
            } catch (e) { /* ignore */ }
          }
          return {};
        })()
      },
      ...options,
    });

    if (!response.ok) {
      let message = `Request failed (${response.status})`;
      try {
        const errorText = await response.text();
        if (errorText) {
          message = errorText;
        }
      } catch (err) {
        // no-op
      }
      throw new Error(message);
    }

    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }

    return response.text();
  }

  window.AquentaApiClient = {
    getApiBaseUrl,
    request,
    get: (path) => request(path, { method: 'GET' }),
    post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
    put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (path) => request(path, { method: 'DELETE' }),
  };
})();
