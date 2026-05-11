(function () {
  const DEFAULT_NAME = 'Admin Staff';
  const DEFAULT_ROLE = 'Admin Account';
  const DEFAULT_INITIALS = 'AS';

  function pick(obj, keys) {
    for (const key of keys) {
      const value = obj && obj[key];
      if (typeof value !== 'undefined' && value !== null) {
        return String(value).trim();
      }
    }
    return '';
  }

  function getStoredUser() {
    const loggedIn = localStorage.getItem('aquentaLoggedIn') === 'true';
    const raw = localStorage.getItem('aquentaUser');

    if (!loggedIn || !raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  function buildDisplayName(user) {
    if (!user) return DEFAULT_NAME;

    const firstName = pick(user, ['firstName', 'FirstName']);
    const lastName = pick(user, ['lastName', 'LastName']);
    const fullName = `${firstName} ${lastName}`.trim();
    const userName = pick(user, ['userName', 'UserName', 'username', 'Username']);

    return fullName || userName || DEFAULT_NAME;
  }

  function buildDisplayRole(user) {
    if (!user) return DEFAULT_ROLE;

    const rawRole = pick(user, ['userRole', 'UserRole', 'role', 'Role']);
    if (!rawRole) return DEFAULT_ROLE;

    if (/admin/i.test(rawRole)) return DEFAULT_ROLE;

    if (/account/i.test(rawRole)) return rawRole;

    return `${rawRole} Account`;
  }

  function buildInitials(user) {
    if (!user) return DEFAULT_INITIALS;

    const firstInitial = pick(user, ['firstName', 'FirstName']).charAt(0);
    const lastInitial = pick(user, ['lastName', 'LastName']).charAt(0);
    const initialsFromName = `${firstInitial}${lastInitial}`.toUpperCase();

    if (initialsFromName) {
      return initialsFromName;
    }

    const userName = pick(user, ['userName', 'UserName', 'username', 'Username']);
    const initialsFromUserName = userName.slice(0, 2).toUpperCase();

    return initialsFromUserName || DEFAULT_INITIALS;
  }

  function applyAdminTopbarIdentity(explicitUser) {
    const user = explicitUser || getStoredUser();
    const displayName = buildDisplayName(user);
    const displayRole = buildDisplayRole(user);
    const initials = buildInitials(user);

    const labels = document.querySelectorAll('.admin-label');
    labels.forEach((el) => {
      el.textContent = displayName;
    });

    const roles = document.querySelectorAll('.admin-role');
    roles.forEach((el) => {
      el.textContent = displayRole;
    });

    const avatars = document.querySelectorAll('.avatar');
    avatars.forEach((el) => {
      el.textContent = initials;
    });
  }

  // --- Global Notification System ---
  window.showNotification = function(message, type = 'success') {
    let container = document.getElementById('notificationContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notificationContainer';
      container.className = 'notification-container';
      document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';

    notification.innerHTML = `
      <i class="fas fa-${icon}"></i>
      <span class="notification-message">${message}</span>
      <button class="notification-close">&times;</button>
    `;

    container.appendChild(notification);

    // Auto-remove after 5 seconds
    const timer = setTimeout(() => {
      notification.classList.add('notification-fade-out');
      notification.addEventListener('transitionend', () => notification.remove());
    }, 5000);

    notification.querySelector('.notification-close').onclick = () => {
      clearTimeout(timer);
      notification.remove();
    };
  };

  function setupAdminDropdown() {
    const infoBtn = document.getElementById('adminInfoBtn');
    const dropdown = document.getElementById('adminDropdown');
    const logoutBtn = document.getElementById('adminLogoutBtn');

    function ensureLandingPageEditorLink() {
      if (!dropdown || dropdown.querySelector('[data-admin-link="landing-page-editor"]')) {
        return;
      }

      const editorLink = document.createElement('a');
      editorLink.className = 'profile-dropdown-item';
      editorLink.href = '/landing-page-editor';
      editorLink.dataset.adminLink = 'landing-page-editor';
      editorLink.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 4h12a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2V4z"></path>
          <path d="M8 4v14"></path>
          <path d="M4 8h10"></path>
          <path d="M9 12h4"></path>
        </svg>
        <span>Landing Page Editor</span>
      `;

      editorLink.addEventListener('click', () => {
        dropdown.classList.remove('show');
        infoBtn?.querySelector('.admin-profile')?.classList.remove('active');
      });

      const insertBeforeNode = logoutBtn || dropdown.firstElementChild;
      dropdown.insertBefore(editorLink, insertBeforeNode);
    }

    if (infoBtn && dropdown) {
      infoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
        infoBtn.querySelector('.admin-profile')?.classList.toggle('active');
      });

      document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !infoBtn.contains(e.target)) {
          dropdown.classList.remove('show');
          infoBtn.querySelector('.admin-profile')?.classList.remove('active');
        }
      });
    }

    ensureLandingPageEditorLink();

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        // Clear all session data
        localStorage.removeItem('aquentaLoggedIn');
        localStorage.removeItem('aquentaUser');
        sessionStorage.clear();
        
        // Prevent back-navigation via history manipulation
        window.location.href = '/auth';
        window.history.replaceState({ isLoggedOut: true }, '', '/auth');
      });
    }
  }

  window.applyAdminTopbarIdentity = applyAdminTopbarIdentity;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      applyAdminTopbarIdentity();
      setupAdminDropdown();
    });
  } else {
    applyAdminTopbarIdentity();
    setupAdminDropdown();
  }
})();
