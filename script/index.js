// Mobile Menu Toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileNav = document.getElementById('mobileNav');
const menuIcon = document.getElementById('menuIcon');
const closeIcon = document.getElementById('closeIcon');

mobileMenuBtn.addEventListener('click', function() {
    mobileNav.classList.toggle('active');
    if (mobileNav.classList.contains('active')) {
        menuIcon.style.display = 'none';
        closeIcon.style.display = 'block';
    } else {
        menuIcon.style.display = 'block';
        closeIcon.style.display = 'none';
    }
});

function closeMobileMenu() {
    mobileNav.classList.remove('active');
    menuIcon.style.display = 'block';
    closeIcon.style.display = 'none';
}

// FAQ Toggle
let currentOpenIndex = null;

function toggleFAQ(index) {
    const answer = document.getElementById(`answer-${index}`);
    const toggle = document.getElementById(`toggle-${index}`);
    
    if (currentOpenIndex === index) {
        // Close current
        answer.classList.remove('active');
        toggle.classList.remove('active');
        currentOpenIndex = null;
    } else {
        // Close previous
        if (currentOpenIndex !== null) {
            document.getElementById(`answer-${currentOpenIndex}`).classList.remove('active');
            document.getElementById(`toggle-${currentOpenIndex}`).classList.remove('active');
        }
        // Open new
        answer.classList.add('active');
        toggle.classList.add('active');
        currentOpenIndex = index;
    }
}

// Contact Form
function updateCharCount() {
    const messageField = document.getElementById('messageField');
    const charCount = document.getElementById('charCount');
    charCount.textContent = messageField.value.length;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateContactForm(data) {
    const fieldErrors = {};

    if (!data.fullName || !data.fullName.trim()) {
        fieldErrors.fullName = 'Full Name is required.';
    }

    if (!data.contactNumber || !data.contactNumber.trim()) {
        fieldErrors.contactNumber = 'Contact Number is required.';
    }

    if (!data.email || !isValidEmail(data.email.trim())) {
        fieldErrors.email = 'A valid Email Address is required.';
    }

    if (!data.subject || !data.subject.trim()) {
        fieldErrors.subject = 'Please select a subject.';
    }

    if (!data.message || !data.message.trim()) {
        fieldErrors.message = 'Write Your Question is required.';
    }

    if ((data.message || '').trim().length > 300) {
        fieldErrors.message = 'Message cannot exceed 300 characters.';
    }

    return fieldErrors;
}

function displayFormErrors(fieldErrors) {
    const form = document.getElementById('contactForm');
    const fieldNames = ['fullName', 'contactNumber', 'email', 'subject', 'message'];
    
    fieldNames.forEach(fieldName => {
        const input = form.querySelector(`[name="${fieldName}"]`);
        const errorDiv = document.getElementById(`error-${fieldName}`);
        
        if (!input || !errorDiv) return;
        
        if (fieldErrors[fieldName]) {
            input.classList.add('form-input-error');
            if (input.classList.contains('form-select')) {
                input.classList.add('form-select-error');
            }
            errorDiv.textContent = fieldErrors[fieldName];
            errorDiv.classList.add('form-error-show');
        } else {
            input.classList.remove('form-input-error');
            input.classList.remove('form-select-error');
            errorDiv.textContent = '';
            errorDiv.classList.remove('form-error-show');
        }
    });
}

function clearFormErrors() {
    const form = document.getElementById('contactForm');
    const inputs = form.querySelectorAll('.form-input, .form-select');
    const errorDivs = form.querySelectorAll('.form-error');
    
    inputs.forEach(input => {
        input.classList.remove('form-input-error');
    });
    
    errorDivs.forEach(errorDiv => {
        errorDiv.textContent = '';
        errorDiv.classList.remove('form-error-show');
    });
}

function buildContactMailto(payload) {
    const recipient = 's2023100102@firstasia.edu.ph';
    const subject = `[AQUENTA Contact] ${payload.subject}`;
    const bodyLines = [
        'A new contact inquiry was submitted from AQUENTA website.',
        '',
        `Full Name: ${payload.fullName}`,
        `Account Number: ${payload.accountNumber || 'N/A'}`,
        `Contact Number: ${payload.contactNumber}`,
        `Email Address: ${payload.email}`,
        `Subject: ${payload.subject}`,
        '',
        'Message:',
        payload.message,
    ];

    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(bodyLines.join('\n'));

    return `mailto:${recipient}?subject=${encodedSubject}&body=${encodedBody}`;
}

async function handleSubmit(event) {
    event.preventDefault();

    clearFormErrors();

    const form = event.target;
    const submitButton = form.querySelector('.submit-btn');
    const originalButtonLabel = submitButton ? submitButton.textContent : '';

    const rawData = Object.fromEntries(new FormData(form));
    const payload = {
        fullName: (rawData.fullName || '').trim(),
        accountNumber: (rawData.accountNumber || '').trim() || null,
        contactNumber: (rawData.contactNumber || '').trim(),
        email: (rawData.email || '').trim(),
        subject: (rawData.subject || '').trim(),
        message: (rawData.message || '').trim(),
    };

    const fieldErrors = validateContactForm(payload);
    if (Object.keys(fieldErrors).length > 0) {
        displayFormErrors(fieldErrors);
        return;
    }

    try {
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Opening Email...';
        }

        const mailtoLink = buildContactMailto(payload);
        window.location.href = mailtoLink;

        alert('Your default email app will open with a prefilled message. Please click Send to complete submission.');
        form.reset();
        updateCharCount();
    } catch (error) {
        const message = error && error.message ? error.message : 'Unable to open your email app.';
        alert(`Failed to prepare email: ${message}`);
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonLabel;
        }
    }
}

// Get Started button navigation
document.addEventListener('DOMContentLoaded', function() {
    const getStartedBtn = document.querySelector('.hero-btn');
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', function() {
            window.location.href = 'auth.html';
        });
    }
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerHeight = document.querySelector('header').offsetHeight;
            const targetPosition = target.offsetTop - headerHeight;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});
