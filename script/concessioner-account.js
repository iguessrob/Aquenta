let currentConcessioner = null;
let isEditing = false;

document.addEventListener('DOMContentLoaded', async () => {
  const accountContent = document.getElementById('accountContent');
  if (accountContent) accountContent.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

  const concessioner = await conGuardResolveConcessioner();
  
  if (!concessioner) {
    if (accountContent) accountContent.innerHTML = '<div class="empty-state"><p class="empty-state-text">No account record found.</p></div>';
    return;
  }

  currentConcessioner = concessioner;
  
  const editBtn = document.getElementById('editBtn');
  if (editBtn) {
    editBtn.addEventListener('click', function() {
      console.log('Edit button clicked');
      toggleEdit();
    });
  }

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

    renderAccountForm(false);
  } catch (err) {
    console.error('Failed to load lookup data:', err);
    renderAccountForm(false);
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

function renderAccountForm(editing) {
  var c = currentConcessioner;
  if (!c) return;

  var accountNum = c.accountNumber || c.AccountNumber || '--';
  var meterNum = c.meterNumber || c.MeterNumber || '--';
  var address = c.address || c.Address || '';
  var contact = c.contactNumber || c.ContactNumber || '';
  var email = c.emailAddress || c.EmailAddress || '';
  var status = c.status || c.Status || '--';

  var disabledAttr = editing ? '' : 'disabled';
  var inputBg = editing ? '' : 'style="background:#f8fafc; color:#64748b;"';

  var html = '<form id="accountForm" onsubmit="saveAccount(event)"><div class="form-grid">';

  // Read-only fields
  html += '<div class="form-group"><label class="form-label">Account Number</label><input class="form-input" value="' + escHtml(accountNum) + '" disabled style="background:#f8fafc; color:#64748b;"></div>';
  html += '<div class="form-group"><label class="form-label">Meter Number</label><input class="form-input" value="' + escHtml(meterNum) + '" disabled style="background:#f8fafc; color:#64748b;"></div>';
  html += '<div class="form-group"><label class="form-label">Category</label><input class="form-input" value="' + escHtml(c._categoryName) + '" disabled style="background:#f8fafc; color:#64748b;"></div>';
  html += '<div class="form-group"><label class="form-label">Membership</label><input class="form-input" value="' + escHtml(c._membershipName) + '" disabled style="background:#f8fafc; color:#64748b;"></div>';
  html += '<div class="form-group"><label class="form-label">District</label><input class="form-input" value="' + escHtml(c._districtName) + '" disabled style="background:#f8fafc; color:#64748b;"></div>';
  html += '<div class="form-group full"><label class="form-label">Address</label><input class="form-input" value="' + escHtml(address) + '" disabled style="background:#f8fafc; color:#64748b;"></div>';
  html += '<div class="form-group"><label class="form-label">Status</label><div style="padding-top:4px;"><span class="badge badge-' + status.toLowerCase() + '">' + escHtml(status) + '</span></div></div>';

  // Editable fields
  html += '<div class="form-group full" style="margin-top:12px; padding-top:16px; border-top:1px solid #e2e8f0; grid-column:1/-1;"><label class="form-label" style="font-size:14px; font-weight:600; color:#0f172a;">Contact Information</label></div>';
  html += '<div class="form-group"><label class="form-label">Contact Number</label><input class="form-input" id="inputContact" value="' + escHtml(contact) + '" ' + disabledAttr + ' ' + (editing ? '' : inputBg) + '></div>';
  html += '<div class="form-group"><label class="form-label">Email Address</label><input class="form-input" id="inputEmail" type="email" value="' + escHtml(email) + '" ' + disabledAttr + ' ' + (editing ? '' : inputBg) + '></div>';

  html += '</div>';

  if (editing) {
    html += '<div class="form-actions"><button type="button" class="btn-secondary" onclick="cancelEdit()">Cancel</button><button type="submit" class="btn-primary" id="saveBtn">Save Changes</button></div>';
  }

  html += '</form>';
  document.getElementById('accountContent').innerHTML = html;
}

function toggleEdit() {
  isEditing = true;
  var btn = document.getElementById('editBtn');
  btn.style.display = 'none';
  renderAccountForm(true);
  document.getElementById('saveMsg').classList.remove('show');
}

function cancelEdit() {
  isEditing = false;
  var btn = document.getElementById('editBtn');
  btn.style.display = '';
  btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:4px;"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg> Edit';
  renderAccountForm(false);
  document.getElementById('saveMsg').classList.remove('show');
}

async function saveAccount(e) {
  e.preventDefault();
  if (!currentConcessioner) return;

  var saveBtn = document.getElementById('saveBtn');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving...'; }

  var contact = document.getElementById('inputContact').value.trim();
  var email = document.getElementById('inputEmail').value.trim();
  var address = currentConcessioner.address || currentConcessioner.Address || '';

  var updated = {
    concessionerId: currentConcessioner.concessionerId || currentConcessioner.ConcessionerId,
    userId: currentConcessioner.userId || currentConcessioner.UserId,
    categoryId: currentConcessioner.categoryId || currentConcessioner.CategoryId,
    membershipId: currentConcessioner.membershipId || currentConcessioner.MembershipId,
    districtId: currentConcessioner.districtId || currentConcessioner.DistrictId,
    accountNumber: currentConcessioner.accountNumber || currentConcessioner.AccountNumber,
    accountOrder: currentConcessioner.accountOrder || currentConcessioner.AccountOrder,
    meterNumber: currentConcessioner.meterNumber || currentConcessioner.MeterNumber,
    address: address,
    contactNumber: contact,
    emailAddress: email,
    status: currentConcessioner.status || currentConcessioner.Status
  };

  try {
    await window.AquentaApiClient.put('/Concessioner', updated);

    // Update local data
    currentConcessioner.address = address;
    currentConcessioner.Address = address;
    currentConcessioner.contactNumber = contact;
    currentConcessioner.ContactNumber = contact;
    currentConcessioner.emailAddress = email;
    currentConcessioner.EmailAddress = email;

    isEditing = false;
    var btn = document.getElementById('editBtn');
    btn.style.display = '';
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:4px;"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg> Edit';
    renderAccountForm(false);
    document.getElementById('saveMsg').classList.add('show');
    setTimeout(function () { document.getElementById('saveMsg').classList.remove('show'); }, 3000);
  } catch (err) {
    console.error('Failed to save account:', err);
    alert('Failed to save changes. Please try again.');
  }

  if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save Changes'; }
}

function escHtml(str) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str || ''));
  return div.innerHTML;
}
