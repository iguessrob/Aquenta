let currentConcessioner = null;

document.addEventListener('DOMContentLoaded', async () => {
  const accountContent = document.getElementById('accountContent');
  if (accountContent) accountContent.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

  bindChangePasswordModal();

  const concessioner = await conGuardResolveConcessioner();

  if (!concessioner) {
    if (accountContent) accountContent.innerHTML = '<div class="empty-state"><p class="empty-state-text">No account record found.</p></div>';
    return;
  }

  currentConcessioner = concessioner;
  loadAccountDetails();
});

async function loadAccountDetails() {
  try {
    // Load lookup data for display
    let districts = [], categories = [], memberships = [];
    try { districts = await window.AquentaApiClient.get('/District'); } catch (e) {}
    try { categories = await window.AquentaApiClient.get('/Category'); } catch (e) {}
    try { memberships = await window.AquentaApiClient.get('/Membership'); } catch (e) {}

    currentConcessioner._districtName = findName(districts, 'districtId', 'DistrictId', currentConcessioner.districtId || currentConcessioner.DistrictId, 'districtName', 'DistrictName');
    currentConcessioner._categoryName = findName(categories, 'categoryId', 'CategoryId', currentConcessioner.categoryId || currentConcessioner.CategoryId, 'categoryName', 'CategoryName');
    currentConcessioner._membershipName = findName(memberships, 'membershipId', 'MembershipId', currentConcessioner.membershipId || currentConcessioner.MembershipId, 'membershipName', 'MembershipName');

    renderAccountForm();
  } catch (err) {
    console.error('Failed to load lookup data:', err);
    renderAccountForm();
  }
}

function findName(list, key1, key2, id, nameKey1, nameKey2) {
  if (!list || !Array.isArray(list)) return '--';
  var item = list.find(function (x) { 
    if (!x) return false;
    return (x[key1] || x[key2]) === id; 
  });
  if (item) return item[nameKey1] || item[nameKey2] || '--';
  return '--';
}

function renderAccountForm() {
  var c = currentConcessioner;
  if (!c) return;

  var accountNum = c.accountNumber || c.AccountNumber || '--';
  var meterNum = c.meterNumber || c.MeterNumber || '--';
  var address = c.address || c.Address || '';
  var contact = c.contactNumber || c.ContactNumber || '';
  var email = c.emailAddress || c.EmailAddress || '';
  var status = c.status || c.Status || '--';

  var html = '<div class="form-grid">';

  // Read-only fields
  html += '<div class="form-group"><label class="form-label">Account Number</label><input class="form-input" value="' + escHtml(accountNum) + '" disabled style="background:#f8fafc; color:#64748b;"></div>';
  html += '<div class="form-group"><label class="form-label">Meter Number</label><input class="form-input" value="' + escHtml(meterNum) + '" disabled style="background:#f8fafc; color:#64748b;"></div>';
  html += '<div class="form-group"><label class="form-label">Category</label><input class="form-input" value="' + escHtml(c._categoryName) + '" disabled style="background:#f8fafc; color:#64748b;"></div>';
  html += '<div class="form-group"><label class="form-label">Membership</label><input class="form-input" value="' + escHtml(c._membershipName) + '" disabled style="background:#f8fafc; color:#64748b;"></div>';
  html += '<div class="form-group"><label class="form-label">District</label><input class="form-input" value="' + escHtml(c._districtName) + '" disabled style="background:#f8fafc; color:#64748b;"></div>';
  html += '<div class="form-group full"><label class="form-label">Address</label><input class="form-input" value="' + escHtml(address) + '" disabled style="background:#f8fafc; color:#64748b;"></div>';
  html += '<div class="form-group"><label class="form-label">Status</label><div style="padding-top:4px;"><span class="badge badge-' + status.toLowerCase() + '">' + escHtml(status) + '</span></div></div>';

  // Contact fields are display-only in this view
  html += '<div class="form-group full" style="margin-top:12px; padding-top:16px; border-top:1px solid #e2e8f0; grid-column:1/-1;"><label class="form-label" style="font-size:14px; font-weight:600; color:#0f172a;">Contact Information</label></div>';
  html += '<div class="form-group"><label class="form-label">Contact Number</label><input class="form-input" value="' + escHtml(contact) + '" disabled style="background:#f8fafc; color:#64748b;"></div>';
  html += '<div class="form-group"><label class="form-label">Email Address</label><input class="form-input" type="email" value="' + escHtml(email) + '" disabled style="background:#f8fafc; color:#64748b;"></div>';

  html += '</div>';
  document.getElementById('accountContent').innerHTML = html;
}

function bindChangePasswordModal() {
  var triggerBtn = document.getElementById('changePasswordBtn');
  var modal = document.getElementById('changePasswordModal');
  var overlay = document.getElementById('changePasswordOverlay');
  var closeBtn = document.getElementById('changePasswordCloseBtn');
  var cancelBtn = document.getElementById('changePasswordCancelBtn');
  var form = document.getElementById('changePasswordForm');

  if (!modal || !form) return;

  bindPasswordVisibilityToggles();

  var openModal = function () {
    resetPasswordModalState();
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  var closeModal = function () {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    resetPasswordModalState();
  };

  if (triggerBtn) {
    triggerBtn.addEventListener('click', function () {
      if (!currentConcessioner) {
        showModalMessage('Unable to load account details.', 'error');
        return;
      }
      openModal();
    });
  }

  if (overlay) overlay.addEventListener('click', closeModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    await handleChangePasswordSubmit(closeModal);
  });
}

async function handleChangePasswordSubmit(onDone) {
  if (!currentConcessioner) return;

  var currentPasswordEl = document.getElementById('currentPassword');
  var newPasswordEl = document.getElementById('newPassword');
  var confirmPasswordEl = document.getElementById('confirmNewPassword');
  var submitBtn = document.getElementById('changePasswordSubmitBtn');

  if (!currentPasswordEl || !newPasswordEl || !confirmPasswordEl || !submitBtn) return;

  var currentPassword = String(currentPasswordEl.value || '').trim();
  var newPassword = String(newPasswordEl.value || '').trim();
  var confirmNewPassword = String(confirmPasswordEl.value || '').trim();

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    showModalMessage('All password fields are required.', 'error');
    return;
  }

  if (newPassword.length < 8) {
    showModalMessage('New password must be at least 8 characters.', 'error');
    return;
  }

  if (newPassword !== confirmNewPassword) {
    showModalMessage('New password and confirmation do not match.', 'error');
    return;
  }

  if (newPassword === currentPassword) {
    showModalMessage('New password must be different from the current password.', 'error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Updating...';
  showModalMessage('', '');

  try {
    var accountNumber = String(currentConcessioner.accountNumber || currentConcessioner.AccountNumber || '').trim();
    if (!accountNumber) {
      throw new Error('Account number is missing for this concessioner.');
    }

    // Verify current password before updating.
    await window.AquentaApiClient.post('/User/login', {
      accountNumber: accountNumber,
      password: currentPassword,
    });

    var userId = currentConcessioner.userId || currentConcessioner.UserId;
    if (!userId) {
      throw new Error('User ID is missing for this concessioner.');
    }

    var user = await window.AquentaApiClient.get('/User/' + userId);

    await window.AquentaApiClient.put('/User', {
      userId: user.userId || user.UserId || userId,
      userName: user.userName || user.UserName,
      pass: newPassword,
      firstName: user.firstName || user.FirstName,
      lastName: user.lastName || user.LastName,
      userRole: user.userRole || user.UserRole || 'Concessioner',
      createdAt: user.createdAt || user.CreatedAt || new Date().toISOString(),
      isDeleted: Boolean(user.isDeleted || user.IsDeleted),
    });

    if (typeof onDone === 'function') onDone();
    showNotification('Password changed successfully.', 'success', 3000);
  } catch (error) {
    console.error('Failed to change password:', error);
    showModalMessage(error.message || 'Failed to change password. Please try again.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Update Password';
  }
}

function resetPasswordModalState() {
  var form = document.getElementById('changePasswordForm');
  if (form) form.reset();

  var toggleButtons = document.querySelectorAll('.password-toggle[data-target]');
  toggleButtons.forEach(function (button) {
    var targetId = button.getAttribute('data-target');
    var input = targetId ? document.getElementById(targetId) : null;
    setPasswordVisibility(button, input, false);
  });

  showModalMessage('', '');
}

function bindPasswordVisibilityToggles() {
  var toggleButtons = document.querySelectorAll('.password-toggle[data-target]');
  if (!toggleButtons.length) return;

  toggleButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      var targetId = button.getAttribute('data-target');
      var input = targetId ? document.getElementById(targetId) : null;
      if (!input) return;

      var nextVisible = input.type === 'password';
      setPasswordVisibility(button, input, nextVisible);
    });
  });
}

function setPasswordVisibility(button, input, visible) {
  if (!button || !input) return;

  var openIcon = button.querySelector('.eye-open');
  var closedIcon = button.querySelector('.eye-closed');

  input.type = visible ? 'text' : 'password';
  button.setAttribute('aria-pressed', visible ? 'true' : 'false');

  var inputLabel = (input.getAttribute('id') || 'password').replace(/([A-Z])/g, ' $1').toLowerCase();
  button.setAttribute('aria-label', (visible ? 'Hide ' : 'Show ') + inputLabel);

  if (openIcon) openIcon.style.display = visible ? 'none' : '';
  if (closedIcon) closedIcon.style.display = visible ? '' : 'none';
}

function showModalMessage(message, type) {
  var messageEl = document.getElementById('changePasswordMessage');
  if (!messageEl) return;

  messageEl.className = 'modal-message';
  messageEl.textContent = '';

  if (!message) return;

  messageEl.textContent = message;
  if (type === 'error') {
    messageEl.classList.add('error');
  } else if (type === 'success') {
    messageEl.classList.add('success');
  }
}

function showNotification(message, type, duration) {
  var container = document.getElementById('notificationContainer');
  if (!container) return;

  var safeType = type || 'info';
  var timeout = typeof duration === 'number' ? duration : 4000;
  var notification = document.createElement('div');
  notification.className = 'notification ' + safeType;

  var iconSvg = '';
  if (safeType === 'success') {
    iconSvg = '<svg class="notification-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
  } else if (safeType === 'error') {
    iconSvg = '<svg class="notification-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
  } else {
    iconSvg = '<svg class="notification-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
  }

  notification.innerHTML = iconSvg + '<span class="notification-message">' + escHtml(message) + '</span>';
  container.appendChild(notification);

  setTimeout(function () {
    notification.classList.add('removing');
    setTimeout(function () {
      notification.remove();
    }, 300);
  }, timeout);
}

function escHtml(str) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str || ''));
  return div.innerHTML;
}
