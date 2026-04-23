// Form validation functions
function validateLoginForm(data) {
    if (!data.accountNumber || !data.accountNumber.trim()) {
        return 'Account Number is required.';
    }

    if (!data.password || !data.password.trim()) {
        return 'Password is required.';
    }

    return null; // No error
}

function displayFormErrors(fieldErrors) {
    // This function is no longer used - all errors go through credential error box
}

function clearFormErrors() {
    const credentialError = document.getElementById('credentialError');
    
    if (credentialError) {
        credentialError.classList.remove('show');
    }
}

function showCredentialError(message) {
    const credentialError = document.getElementById('credentialError');
    const credentialErrorText = document.getElementById('credentialErrorText');
    
    if (credentialError && credentialErrorText) {
        credentialErrorText.textContent = message;
        credentialError.classList.add('show');
    }
}

// Password visibility toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('password');
    const togglePasswordButton = document.getElementById('togglePassword');
    const eyeIcon = document.getElementById('eyeIcon');
    const eyeOffIcon = document.getElementById('eyeOffIcon');
    const loginForm = document.getElementById('loginForm');
    const accountNumberInput = document.getElementById('accountNumber');
    const homeButton = document.querySelector('.home-button');
    const loginButton = loginForm ? loginForm.querySelector('button[type="submit"]') : null;
    const loginLoadingOverlay = document.getElementById('loginLoadingOverlay');

    function resolveDashboardPath(user) {
        const role = String(user.userRole || user.UserRole || user.role || user.Role || '').trim();
        if (/admin/i.test(role)) {
            return 'admin-dashboard.html';
        }
        return 'concessioner/dashboard.html';
    }

    function showLoadingOverlay() {
        if (loginLoadingOverlay) {
            loginLoadingOverlay.classList.add('active');
            loginLoadingOverlay.setAttribute('aria-hidden', 'false');
        }
        document.body.classList.add('loading-active');
    }

    // Clear credential error when user starts typing
    accountNumberInput.addEventListener('input', clearFormErrors);
    passwordInput.addEventListener('input', clearFormErrors);

    // Toggle password visibility
    togglePasswordButton.addEventListener('click', function() {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            eyeIcon.classList.add('hidden');
            eyeOffIcon.classList.remove('hidden');
        } else {
            passwordInput.type = 'password';
            eyeIcon.classList.remove('hidden');
            eyeOffIcon.classList.add('hidden');
        }
    });

    // Home button navigation
    if (homeButton) {
        homeButton.addEventListener('click', function() {
            window.location.href = 'index.html';
        });
    }

    // Handle form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
    
        clearFormErrors();
    
        const accountNumber = accountNumberInput.value.trim();
        const password = passwordInput.value;
    
        const validationError = validateLoginForm({
            accountNumber,
            password,
        });
        
        if (validationError) {
            showCredentialError(validationError);
            return;
        }
    
        if (!window.AquentaApiClient) {
            alert('API client is not loaded. Please refresh the page.');
            return;
        }
    
        const originalButtonText = loginButton ? loginButton.textContent : 'Login';
        if (loginButton) {
            loginButton.disabled = true;
            loginButton.textContent = 'Signing in...';
        }
    
        try {
            const result = await window.AquentaApiClient.post('/User/login', {
                accountNumber,
                password,
            });
    
            localStorage.setItem('aquentaUser', JSON.stringify(result));
            localStorage.setItem('aquentaLoggedIn', 'true');
            
            // SECURITY: Add login timestamp for session timeout validation
            localStorage.setItem('aquentaLoginTime', new Date().getTime().toString());
    
            // SECURITY: Replace history entry to prevent back navigation to login
            window.history.replaceState({ isLoggedIn: true }, '', window.location.href);
    
            const dashboardPath = resolveDashboardPath(result);
            showLoadingOverlay();
    
            setTimeout(function() {
                window.location.href = dashboardPath;
            }, 1100);
        } catch (error) {
            console.error('Login failed:', error);
            const errorMessage = error && error.message ? error.message : 'The login information you entered is incorrect.';
            showCredentialError(errorMessage);
        } finally {
            if (loginButton) {
                loginButton.disabled = false;
                loginButton.textContent = originalButtonText;
            }
        }
    });
});
