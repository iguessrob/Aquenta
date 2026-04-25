// Form validation functions
function validateLoginForm(data) {
    if (!data.accountNumber || !data.accountNumber.trim()) {
        return 'Username is required.';
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
            return 'admin-dashboard';
        }
        return 'concessioner/dashboard';
    }

    function showLoadingOverlay() {
        if (loginLoadingOverlay) {
            loginLoadingOverlay.classList.add('active');
            loginLoadingOverlay.setAttribute('aria-hidden', 'false');
        }
        document.body.classList.add('loading-active');
    }

    function getAuthenticatedUser() {
        const loggedIn = localStorage.getItem('aquentaLoggedIn') === 'true';
        const userRaw = localStorage.getItem('aquentaUser');

        if (!loggedIn || !userRaw) {
            return null;
        }

        try {
            return JSON.parse(userRaw);
        } catch (error) {
            localStorage.removeItem('aquentaUser');
            localStorage.removeItem('aquentaLoggedIn');
            localStorage.removeItem('aquentaLoginTime');
            return null;
        }
    }

    function redirectAuthenticatedUser() {
        const user = getAuthenticatedUser();
        if (!user) return false;

        const dashboardPath = resolveDashboardPath(user);
        window.location.replace(dashboardPath);
        return true;
    }

    if (redirectAuthenticatedUser()) {
        return;
    }

    window.addEventListener('pageshow', function() {
        redirectAuthenticatedUser();
    });

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
            window.location.href = 'index';
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
    
            const dashboardPath = resolveDashboardPath(result);
            showLoadingOverlay();
    
            setTimeout(function() {
                window.location.replace(dashboardPath);
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

    // Forgot Password Modal Logic
    const forgotModalOverlay = document.getElementById('forgotModalOverlay');
    const forgotPasswordLink = document.querySelector('.forgot-password');
    const closeForgotModal = document.getElementById('closeForgotModal');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const modalMessage = document.getElementById('modalMessage');
    const forgotSubmitBtn = document.getElementById('forgotSubmitBtn');

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            forgotModalOverlay.classList.add('active');
            modalMessage.style.display = 'none';
            forgotPasswordForm.reset();
        });
    }

    if (closeForgotModal) {
        closeForgotModal.addEventListener('click', function() {
            forgotModalOverlay.classList.remove('active');
        });
    }

    // Close modal when clicking outside
    forgotModalOverlay.addEventListener('click', function(e) {
        if (e.target === forgotModalOverlay) {
            forgotModalOverlay.classList.remove('active');
        }
    });

    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const identifier = document.getElementById('forgotIdentifier').value.trim();
            if (!identifier) return;

            const originalBtnText = forgotSubmitBtn.textContent;
            forgotSubmitBtn.disabled = true;
            forgotSubmitBtn.textContent = 'Sending...';
            modalMessage.style.display = 'none';

            try {
                // Determine current base URL for the reset link
                const currentUrl = window.location.href;
                const frontendBaseUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/'));

                const response = await fetch(`${window.AQUENTA_API_BASE_URL}/User/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identifier, frontendBaseUrl })
                });

                if (response.ok) {
                    modalMessage.textContent = 'Check your email for the reset link.';
                    modalMessage.className = 'modal-message success';
                    forgotPasswordForm.reset();
                    
                    // Optionally close modal after some time
                    setTimeout(() => {
                        // forgotModalOverlay.classList.remove('active');
                    }, 5000);
                } else {
                    modalMessage.textContent = 'Failed to send reset link. Please try again.';
                    modalMessage.className = 'modal-message error';
                }
            } catch (error) {
                console.error('Forgot password error:', error);
                modalMessage.textContent = 'Network error. Please try again later.';
                modalMessage.className = 'modal-message error';
            } finally {
                forgotSubmitBtn.disabled = false;
                forgotSubmitBtn.textContent = originalBtnText;
            }
        });
    }
});
