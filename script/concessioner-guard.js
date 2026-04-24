(function () {
    var loggedIn = localStorage.getItem('aquentaLoggedIn');
    var userStr = localStorage.getItem('aquentaUser');

    if (loggedIn !== 'true' || !userStr) {
        window.location.href = '../auth.html';
        return;
    }

    try {
        var user = JSON.parse(userStr);
        var role = String(user.userRole || user.UserRole || user.role || user.Role || '').trim();
        if (!/concessioner/i.test(role)) {
            window.location.href = '../auth.html';
            return;
        }
    } catch (e) {
        window.location.href = '../auth.html';
    }
})();

function conGuardGetUser() {
    try {
        return JSON.parse(localStorage.getItem('aquentaUser'));
    } catch (e) {
        return null;
    }
}

function conGuardLogout() {
    localStorage.removeItem('aquentaUser');
    localStorage.removeItem('aquentaLoggedIn');
    sessionStorage.clear();
    
    // Prevent back-navigation via history manipulation
    window.location.href = '../auth.html';
    window.history.replaceState({ isLoggedOut: true }, '', '../auth.html');
}

// Side-bar Toggle & Top-bar Initialization for all Concessioner pages
document.addEventListener('DOMContentLoaded', function() {
    const user = conGuardGetUser();
    if (!user) return;

    // A. Populate Top-bar User Information
    const firstName = user.firstName || user.FirstName || '';
    const lastName = user.lastName || user.LastName || '';
    const fullName = (firstName + ' ' + lastName).trim() || 'User';
    const initials = ((firstName[0] || '') + (lastName[0] || '')).toUpperCase() || 'U';

    const topbarUserName = document.getElementById('topbarUserName');
    if (topbarUserName) topbarUserName.textContent = fullName;

    const topbarAvatar = document.getElementById('topbarAvatar');
    if (topbarAvatar) topbarAvatar.textContent = initials;

    const welcomeTitle = document.getElementById('welcomeTitle');
    if (welcomeTitle) welcomeTitle.textContent = 'Welcome back, ' + (firstName || 'User') + '!';

    // B. Sidebar Toggle Logic
    const sidebar = document.getElementById('sidebar');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const menuBtn = document.getElementById('menuBtn');
    const closeSidebar = document.getElementById('closeSidebar');

    if (menuBtn && sidebar && mobileOverlay) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.add('open');
            mobileOverlay.classList.add('active');
        });
    }

    // C. Profile Dropdown Logic
    const userInfo = document.getElementById('userInfoBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    const userProfile = document.querySelector('.user-profile');

    if (userInfo && profileDropdown) {
        const toggleDropdown = (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
            if (userProfile) userProfile.classList.toggle('active');
        };

        userInfo.addEventListener('click', toggleDropdown);

        document.addEventListener('click', (e) => {
            if (!profileDropdown.contains(e.target) && !userInfo.contains(e.target)) {
                profileDropdown.classList.remove('show');
                if (userProfile) userProfile.classList.remove('active');
            }
        });
    }

    const closeActions = [closeSidebar, mobileOverlay];
    closeActions.forEach(el => {
        if (el && sidebar && mobileOverlay) {
            el.addEventListener('click', () => {
                sidebar.classList.remove('open');
                mobileOverlay.classList.remove('active');
            });
        }
    });
});

// Shared Helpers
async function conGuardResolveConcessioner() {
    const user = conGuardGetUser();
    if (!user) return null;

    let concessionerId = user.concessionerId || user.ConcessionerId;
    const userId = user.userId || user.UserId;

    if (!concessionerId && userId) {
        try {
            const concessioner = await window.AquentaApiClient.get('/Concessioner/user/' + userId);
            return concessioner;
        } catch (err) {
            console.error('Failed to resolve concessioner:', err);
            return null;
        }
    } else if (concessionerId) {
        try {
            return await window.AquentaApiClient.get('/Concessioner/' + concessionerId);
        } catch (err) {
            console.error('Failed to fetch concessioner profile:', err);
            return null;
        }
    }
    return null;
}

function conGuardFormatDate(dateStr) {
    const d = new Date(dateStr || 0);
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

function conGuardFormatCurrency(amount) {
    return '₱' + parseFloat(amount || 0).toLocaleString('en-PH', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    });
}

