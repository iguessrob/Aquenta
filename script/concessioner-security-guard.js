/**
 * ============================================================================
 * CONCESSIONER PAGE SECURITY GUARD
 * ============================================================================
 * Enforces strict authentication and prevents unauthorized access via:
 * 1. Session validation before page load
 * 2. Browser cache directives to prevent back-button caching
 * 3. Immediate logout on invalid session
 * 4. Page-level security redirects
 * ============================================================================
 */

(function () {
  // Prevent browser caching of protected pages
  function applyNoCacheHeaders() {
    const noCacheMeta = [
      { name: 'pragma', content: 'no-cache' },
      { name: 'cache-control', content: 'no-store, no-cache, must-revalidate, max-age=0' },
      { name: 'expires', content: '0' },
    ];

    noCacheMeta.forEach(meta => {
      let existing = document.querySelector(`meta[name="${meta.name}"]`);
      if (!existing) {
        existing = document.createElement('meta');
        existing.name = meta.name;
        document.head.appendChild(existing);
      }
      existing.content = meta.content;
    });
  }

  // Validate session before allowing page access
  function validateConcessionerSession() {
    const loggedIn = localStorage.getItem('aquentaLoggedIn');
    const userStr = localStorage.getItem('aquentaUser');

    if (loggedIn !== 'true' || !userStr) {
      redirectToAuth();
      return false;
    }

    try {
      const user = JSON.parse(userStr);
      const role = String(user.userRole || user.UserRole || user.role || user.Role || '').trim();
      
      if (!/concessioner/i.test(role)) {
        redirectToAuth();
        return false;
      }

      return true;
    } catch (e) {
      redirectToAuth();
      return false;
    }
  }

  // Clear all session data and redirect to login
  function forceLogout() {
    localStorage.removeItem('aquentaUser');
    localStorage.removeItem('aquentaLoggedIn');
    sessionStorage.clear();
    
    redirectToAuth();
  }

  function redirectToAuth() {
    window.location.replace('../auth');
  }

  // Export global functions for use in HTML/other scripts
  window.conSecurityValidate = validateConcessionerSession;
  window.conSecurityLogout = forceLogout;

  // Run security checks on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      applyNoCacheHeaders();
      validateConcessionerSession();
    });
  } else {
    applyNoCacheHeaders();
    validateConcessionerSession();
  }
})();
