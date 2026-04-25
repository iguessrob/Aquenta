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
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

function validateContactForm(data) {
    const fieldErrors = {};

    if (!data.fullName || !data.fullName.trim()) {
        fieldErrors.fullName = 'Full Name is required.';
    }

    if (!data.contactNumber || !data.contactNumber.trim()) {
        fieldErrors.contactNumber = 'Contact Number is required.';
    } else if (data.contactNumber.trim().length !== 11) {
        fieldErrors.contactNumber = 'Contact Number must be exactly 11 digits.';
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
    const contactMessage = document.getElementById('contactMessage');
    contactMessage.style.display = 'none';

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
        submittedAt: new Date().toISOString(),
        status: 'Pending'
    };

    // Correct payload for backend (matching ContactSubmissionModel)
    const backendPayload = { ...payload };

    const fieldErrors = validateContactForm(payload);
    if (Object.keys(fieldErrors).length > 0) {
        displayFormErrors(fieldErrors);
        return;
    }

    try {
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';
        }

        const response = await fetch(`${window.AQUENTA_API_BASE_URL}/Contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(backendPayload)
        });

        if (response.ok) {
            contactMessage.textContent = 'Your inquiry has been submitted successfully! We will get back to you soon.';
            contactMessage.style.backgroundColor = '#e8f5e9';
            contactMessage.style.color = '#136A4D';
            contactMessage.style.border = '1px solid #c8e6c9';
            contactMessage.style.display = 'block';
            
            form.reset();
            updateCharCount();
            
            // Scroll to message
            contactMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to submit inquiry.');
        }
    } catch (error) {
        console.error('Contact error:', error);
        contactMessage.textContent = 'Failed to submit inquiry. Please try again later.';
        contactMessage.style.backgroundColor = '#ffebee';
        contactMessage.style.color = '#c62828';
        contactMessage.style.border = '1px solid #ffcdd2';
        contactMessage.style.display = 'block';
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
            window.location.href = 'auth';
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
