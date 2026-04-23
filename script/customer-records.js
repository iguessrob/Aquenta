(function () {
  const sidebar = document.getElementById('sidebar');
  const mobileOverlay = document.getElementById('mobileOverlay');
  const menuBtn = document.getElementById('menuBtn');
  const closeSidebarBtn = document.getElementById('closeSidebar');
  const navItems = document.querySelectorAll('.nav-item');

  function openSidebar() {
    if (!sidebar || !mobileOverlay) return;
    sidebar.classList.add('open');
    mobileOverlay.classList.add('active');
  }

  function closeSidebar() {
    if (!sidebar || !mobileOverlay) return;
    sidebar.classList.remove('open');
    mobileOverlay.classList.remove('active');
  }

  if (menuBtn) menuBtn.addEventListener('click', openSidebar);
  if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
  if (mobileOverlay) mobileOverlay.addEventListener('click', closeSidebar);

  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      if (window.innerWidth < 1024) closeSidebar();
    });
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) closeSidebar();
  });

  function parseQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function formatStatusClass(status) {
    if (!status) return 'status-active';
    const key = String(status).toLowerCase();
    if (key === 'active' || key === 'paid') return 'status-active';
    if (key === 'disconnected' || key === 'unpaid') return 'status-disconnected';
    if (key === 'inactive') return 'status-inactive';
    if (key === 'delinquent') return 'status-delinquent';
    return 'status-active';
  }

  function getApi() {
    if (!window.AquentaApiClient) {
      throw new Error('API client is not loaded. Please include script/api-client.js');
    }
    return window.AquentaApiClient;
  }

  function normalizeById(items, idKeys) {
    const map = new Map();
    items.forEach((item) => {
      const id = idKeys.map((k) => item[k]).find((v) => typeof v !== 'undefined' && v !== null);
      if (typeof id !== 'undefined' && id !== null) {
        map.set(Number(id), item);
      }
    });
    return map;
  }

  function pickValue(obj, keys, fallback = '') {
    for (const key of keys) {
      if (typeof obj[key] !== 'undefined' && obj[key] !== null) {
        return obj[key];
      }
    }
    return fallback;
  }

  async function fetchLookups() {
    const api = getApi();
    const [concessioners, users, categories, districts, memberships] = await Promise.all([
      api.get('/Concessioner'),
      api.get('/User'),
      api.get('/Category'),
      api.get('/District'),
      api.get('/Membership'),
    ]);

    const userMap = normalizeById(users || [], ['userId', 'UserId', 'userid']);
    const categoryMap = normalizeById(categories || [], ['categoryId', 'CategoryId', 'categoryID', 'CategoryID']);
    const districtMap = normalizeById(districts || [], ['districtId', 'DistrictId', 'districtID', 'DistrictID']);
    const membershipMap = normalizeById(memberships || [], ['membershipId', 'MembershipId', 'membershipID', 'MembershipID']);

    return {
      concessioners: concessioners || [],
      users: users || [],
      categories: categories || [],
      districts: districts || [],
      memberships: memberships || [],
      userMap,
      categoryMap,
      districtMap,
      membershipMap,
    };
  }

  function mapConcessionerToCustomer(concessioner, lookups) {
    const concessionerId = Number(pickValue(concessioner, ['concessionerId', 'ConcessionerId', 'concessionerID', 'ConcessionerID'], 0));
    const userId = Number(pickValue(concessioner, ['userId', 'UserId', 'userID', 'UserID'], 0));
    const categoryId = Number(pickValue(concessioner, ['categoryId', 'CategoryId', 'categoryID', 'CategoryID'], 0));
    const membershipId = Number(pickValue(concessioner, ['membershipId', 'MembershipId', 'membershipID', 'MembershipID'], 0));
    const districtId = Number(pickValue(concessioner, ['districtId', 'DistrictId', 'districtID', 'DistrictID'], 0));

    const user = lookups.userMap.get(userId) || {};
    const category = lookups.categoryMap.get(categoryId) || {};
    const membership = lookups.membershipMap.get(membershipId) || {};
    const district = lookups.districtMap.get(districtId) || {};

    const firstName = pickValue(user, ['firstName', 'FirstName'], '');
    const lastName = pickValue(user, ['lastName', 'LastName'], '');
    const accountNumber = pickValue(concessioner, ['accountNumber', 'AccountNumber'], '');

    return {
      concessionerId,
      userId,
      categoryId,
      membershipId,
      districtId,
      accountNumber,
      firstName,
      lastName,
      fullName: [lastName, firstName].filter(Boolean).join(', '),
      address: pickValue(concessioner, ['address', 'Address'], ''),
      email: pickValue(concessioner, ['emailAddress', 'EmailAddress'], ''),
      contactNumber: pickValue(concessioner, ['contactNumber', 'ContactNumber'], ''),
      meterNumber: pickValue(concessioner, ['meterNumber', 'MeterNumber'], ''),
      districtSequence: String(pickValue(concessioner, ['accountOrder', 'AccountOrder'], '')),
      rateClassification: pickValue(category, ['categoryName', 'CategoryName'], ''),
      connectionStatus: pickValue(concessioner, ['status', 'Status'], ''),
      membership: pickValue(membership, ['membershipName', 'MembershipName'], ''),
      district: pickValue(district, ['districtName', 'DistrictName'], ''),
      raw: concessioner,
    };
  }

  async function getCustomers() {
    const lookups = await fetchLookups();
    return lookups.concessioners.map((c) => mapConcessionerToCustomer(c, lookups));
  }

  async function getCustomerByConcessionerId(concessionerId) {
    const all = await getCustomers();
    return all.find((c) => Number(c.concessionerId) === Number(concessionerId)) || null;
  }

  function findLookupIdByName(items, idKeys, nameKeys, name) {
    const target = String(name || '').trim().toLowerCase();
    const matched = items.find((item) => {
      const itemName = String(pickValue(item, nameKeys, '')).trim().toLowerCase();
      return itemName === target;
    });

    if (!matched) return null;
    return Number(pickValue(matched, idKeys, 0));
  }

  async function ensureConcessionerUser(data) {
    const api = getApi();
    const users = await api.get('/User');
    let existing = (users || []).find((u) => {
      const username = String(pickValue(u, ['userName', 'UserName', 'username', 'Username'], '')).trim().toLowerCase();
      return username === String(data.accountNumber || '').trim().toLowerCase();
    });

    if (existing) {
      return Number(pickValue(existing, ['userId', 'UserId'], 0));
    }

    await api.post('/User', {
      userId: 0,
      userName: data.accountNumber,
      password: data.accountNumber,
      firstName: data.firstName,
      lastName: data.lastName,
      userRole: 'Concessioner',
      createdAt: new Date().toISOString(),
      isDeleted: false,
    });

    const refreshed = await api.get('/User');
    existing = (refreshed || []).find((u) => {
      const username = String(pickValue(u, ['userName', 'UserName', 'username', 'Username'], '')).trim().toLowerCase();
      return username === String(data.accountNumber || '').trim().toLowerCase();
    });

    if (!existing) {
      throw new Error('Failed to create concessioner user account.');
    }

    return Number(pickValue(existing, ['userId', 'UserId'], 0));
  }

  async function createCustomer(data) {
    const api = getApi();
    const lookups = await fetchLookups();

    const districtId = findLookupIdByName(lookups.districts, ['districtId', 'DistrictId', 'districtID', 'DistrictID'], ['districtName', 'DistrictName'], data.district);
    const categoryId = findLookupIdByName(lookups.categories, ['categoryId', 'CategoryId', 'categoryID', 'CategoryID'], ['categoryName', 'CategoryName'], data.rateClassification);
    const membershipId = findLookupIdByName(lookups.memberships, ['membershipId', 'MembershipId', 'membershipID', 'MembershipID'], ['membershipName', 'MembershipName'], data.membership);

    if (!districtId) throw new Error('Selected district not found in database.');
    if (!categoryId) throw new Error('Selected rate classification not found in database.');
    if (!membershipId) throw new Error('Selected membership not found in database.');

    const userId = await ensureConcessionerUser(data);

    await api.post('/Concessioner', {
      concessionerId: 0,
      userId,
      categoryId,
      membershipId,
      districtId,
      accountNumber: data.accountNumber,
      accountOrder: Number(data.districtSequence || 0),
      meterNumber: data.meterNumber,
      address: data.address,
      contactNumber: data.contactNumber,
      emailAddress: data.email,
      status: data.connectionStatus,
    });

    const createdList = await getCustomers();
    const created = createdList.find((c) => String(c.accountNumber).trim().toLowerCase() === String(data.accountNumber).trim().toLowerCase());
    if (!created) {
      throw new Error('Customer saved but failed to fetch created record.');
    }
    return created;
  }

  async function updateCustomer(concessionerId, updates) {
    const api = getApi();
    const lookups = await fetchLookups();

    const existing = await api.get(`/Concessioner/${concessionerId}`);
    if (!existing) {
      throw new Error('Customer not found.');
    }

    const districtId = findLookupIdByName(lookups.districts, ['districtId', 'DistrictId', 'districtID', 'DistrictID'], ['districtName', 'DistrictName'], updates.district);
    const categoryId = findLookupIdByName(lookups.categories, ['categoryId', 'CategoryId', 'categoryID', 'CategoryID'], ['categoryName', 'CategoryName'], updates.rateClassification);
    const membershipId = findLookupIdByName(lookups.memberships, ['membershipId', 'MembershipId', 'membershipID', 'MembershipID'], ['membershipName', 'MembershipName'], updates.membership);

    if (!districtId) throw new Error('Selected district not found in database.');
    if (!categoryId) throw new Error('Selected rate classification not found in database.');
    if (!membershipId) throw new Error('Selected membership not found in database.');

    const userId = Number(pickValue(existing, ['userId', 'UserId'], 0));
    const user = await api.get(`/User/${userId}`);

    await api.put('/User', {
      userId,
      userName: updates.accountNumber,
      password: pickValue(user, ['password', 'Password'], updates.accountNumber),
      firstName: updates.firstName,
      lastName: updates.lastName,
      userRole: pickValue(user, ['userRole', 'UserRole'], 'Concessioner'),
      createdAt: pickValue(user, ['createdAt', 'CreatedAt'], new Date().toISOString()),
      isDeleted: Boolean(pickValue(user, ['isDeleted', 'IsDeleted'], false)),
    });

    await api.put('/Concessioner', {
      concessionerId: Number(pickValue(existing, ['concessionerId', 'ConcessionerId'], concessionerId)),
      userId,
      categoryId,
      membershipId,
      districtId,
      accountNumber: updates.accountNumber,
      accountOrder: Number(updates.districtSequence || 0),
      meterNumber: updates.meterNumber,
      address: updates.address,
      contactNumber: updates.contactNumber,
      emailAddress: updates.email,
      status: updates.connectionStatus,
    });

    const refreshed = await getCustomerByConcessionerId(concessionerId);
    if (!refreshed) throw new Error('Customer updated but failed to reload record.');
    return refreshed;
  }

  async function initCustomerListPage() {
    const tbody = document.getElementById('customerTableBody');
    if (!tbody) return;

    const searchInput = document.getElementById('customerSearchInput');
    const totalCountEl = document.getElementById('customerTotalCount');
    const rateClassFilter = document.getElementById('rateClassFilter');
    const districtFilter = document.getElementById('districtFilter');
    const statusFilter = document.getElementById('statusFilter');

    let allCustomers = [];
    let visibleCustomers = [];

    function renderTable(rows) {
      tbody.innerHTML = '';
      rows.forEach((customer) => {
        const tr = document.createElement('tr');
        const statusClass = formatStatusClass(customer.connectionStatus);
        const statusLabel = customer.connectionStatus || 'Active';

        tr.innerHTML = `
          <td>${customer.accountNumber || ''}</td>
          <td>${customer.fullName || ''}</td>
          <td>${customer.district || ''}</td>
          <td>${customer.rateClassification || ''}</td>
          <td><span class="status-pill ${statusClass}">${statusLabel}</span></td>
          <td class="action-cell">
            <a href="view-customer.html?id=${encodeURIComponent(customer.concessionerId)}" class="icon-btn view-btn" aria-label="View concessioner">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </a>
            <a href="edit-concessioner.html?id=${encodeURIComponent(customer.concessionerId)}" class="icon-btn edit-btn" aria-label="Edit concessioner">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"></path>
              </svg>
            </a>
          </td>`;
        tbody.appendChild(tr);
      });
    }

    function applyAllFilters() {
      const term = (searchInput && searchInput.value ? searchInput.value : '').trim().toLowerCase();
      const rateValue = (rateClassFilter && rateClassFilter.value ? rateClassFilter.value : 'ALL').toLowerCase();
      const districtValue = (districtFilter && districtFilter.value ? districtFilter.value : 'ALL').toLowerCase();
      const statusValue = (statusFilter && statusFilter.value ? statusFilter.value : 'ALL').toLowerCase();

      visibleCustomers = allCustomers.filter((c) => {
        const account = (c.accountNumber || '').toLowerCase();
        const name = (c.fullName || '').toLowerCase();
        const matchesSearch = !term || account.includes(term) || name.includes(term);

        const rate = (c.rateClassification || '').toLowerCase();
        const matchesRate = rateValue === 'all' || rate === rateValue;

        const district = (c.district || '').toLowerCase();
        const matchesDistrict = districtValue === 'all' || district === districtValue;

        const status = (c.connectionStatus || '').toLowerCase();
        const matchesStatus = statusValue === 'all' || status === statusValue;

        return matchesSearch && matchesRate && matchesDistrict && matchesStatus;
      });

      visibleCustomers.sort((a, b) => String(a.accountNumber || '').localeCompare(String(b.accountNumber || ''), undefined, { numeric: true, sensitivity: 'base' }));

      if (totalCountEl) totalCountEl.textContent = String(visibleCustomers.length);
      renderTable(visibleCustomers);
    }

    try {
      allCustomers = await getCustomers();
      applyAllFilters();
    } catch (error) {
      console.error(error);
      window.alert('Failed to load customer records from API.');
    }

    if (searchInput) searchInput.addEventListener('input', applyAllFilters);
    if (rateClassFilter) rateClassFilter.addEventListener('change', applyAllFilters);
    if (districtFilter) districtFilter.addEventListener('change', applyAllFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyAllFilters);
  }

  async function initAddConcessionerPage() {
    const form = document.getElementById('concessionerForm');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const data = {
        accountNumber: String(formData.get('accountNumber') || '').trim(),
        firstName: String(formData.get('firstName') || '').trim(),
        lastName: String(formData.get('lastName') || '').trim(),
        address: String(formData.get('address') || '').trim(),
        email: String(formData.get('email') || '').trim(),
        contactNumber: String(formData.get('contactNumber') || '').trim(),
        meterNumber: String(formData.get('meterNumber') || '').trim(),
        connectionType: String(formData.get('connectionType') || '').trim(),
        district: String(formData.get('district') || '').trim(),
        districtSequence: String(formData.get('districtSequence') || '').trim(),
        rateClassification: String(formData.get('rateClassification') || '').trim(),
        connectionStatus: String(formData.get('connectionStatus') || '').trim(),
        membership: String(formData.get('membership') || '').trim(),
      };

      const requiredFields = ['accountNumber', 'firstName', 'lastName', 'address', 'contactNumber', 'meterNumber', 'district', 'districtSequence', 'rateClassification', 'connectionStatus', 'membership'];
      const missing = requiredFields.filter((key) => !data[key]);
      if (missing.length > 0) {
        window.alert('Please fill in all required fields.');
        return;
      }

      if (!/^\d+$/.test(data.districtSequence) || Number(data.districtSequence) <= 0) {
        window.alert('Account Order is required and must be a positive whole number.');
        return;
      }

      const allowedRateClassifications = ['Residential', 'Commercial'];
      if (!allowedRateClassifications.includes(data.rateClassification)) {
        window.alert('Rate Classification must be either Residential or Commercial.');
        return;
      }

      const allowedMemberships = ['Member', 'Non-Member', 'Full Subsidy'];
      if (!allowedMemberships.includes(data.membership)) {
        window.alert('Membership must be Member, Non-Member, or Full Subsidy.');
        return;
      }

      try {
        const created = await createCustomer(data);
        window.location.href = `view-customer.html?id=${encodeURIComponent(created.concessionerId)}`;
      } catch (error) {
        console.error(error);
        window.alert(error.message || 'Failed to add concessioner.');
      }
    });
  }

  async function initEditConcessionerPage() {
    const form = document.getElementById('editConcessionerForm');
    if (!form) return;

    const concessionerId = Number(parseQueryParam('id'));
    const header = document.querySelector('.customer-header');

    if (!concessionerId) {
      if (header) {
        const msg = document.createElement('p');
        msg.className = 'customer-header-subtitle';
        msg.textContent = 'No concessioner ID provided. Please return to the list and select a customer.';
        header.appendChild(msg);
      }
      form.querySelectorAll('input, select, button').forEach((el) => { el.disabled = true; });
      return;
    }

    let customer;
    try {
      customer = await getCustomerByConcessionerId(concessionerId);
    } catch (error) {
      console.error(error);
    }

    if (!customer) {
      if (header) {
        const msg = document.createElement('p');
        msg.className = 'customer-header-subtitle';
        msg.textContent = `Customer with Concessioner ID #${concessionerId} was not found.`;
        header.appendChild(msg);
      }
      form.querySelectorAll('input, select, button').forEach((el) => {
        if (el.type !== 'button' && el.type !== 'submit') el.disabled = true;
      });
      return;
    }

    const setValue = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.value = value || '';
    };

    setValue('editFirstName', customer.firstName);
    setValue('editLastName', customer.lastName);
    setValue('editAddress', customer.address);
    setValue('editEmail', customer.email);
    setValue('editContactNumber', customer.contactNumber);
    setValue('editAccountNumber', customer.accountNumber);
    setValue('editMeterNumber', customer.meterNumber);
    setValue('editDistrict', customer.district);
    setValue('editDistrictSequence', customer.districtSequence);
    setValue('editRateClassification', customer.rateClassification);
    setValue('editConnectionStatus', customer.connectionStatus);
    setValue('editMembership', customer.membership);

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(form);

      const updates = {
        accountNumber: String(formData.get('accountNumber') || '').trim(),
        firstName: String(formData.get('firstName') || '').trim(),
        lastName: String(formData.get('lastName') || '').trim(),
        address: String(formData.get('address') || '').trim(),
        email: String(formData.get('email') || '').trim(),
        contactNumber: String(formData.get('contactNumber') || '').trim(),
        meterNumber: String(formData.get('meterNumber') || '').trim(),
        connectionType: String(formData.get('connectionType') || '').trim(),
        district: String(formData.get('district') || '').trim(),
        districtSequence: String(formData.get('districtSequence') || '').trim(),
        rateClassification: String(formData.get('rateClassification') || '').trim(),
        connectionStatus: String(formData.get('connectionStatus') || '').trim(),
        membership: String(formData.get('membership') || '').trim(),
      };

      const requiredFields = ['accountNumber', 'firstName', 'lastName', 'address', 'contactNumber', 'meterNumber', 'district', 'rateClassification', 'connectionStatus', 'membership'];
      const missing = requiredFields.filter((key) => !updates[key]);
      if (missing.length > 0) {
        window.alert('Please fill in all required fields.');
        return;
      }

      try {
        const updated = await updateCustomer(concessionerId, updates);
        window.location.href = `view-customer.html?id=${encodeURIComponent(updated.concessionerId)}`;
      } catch (error) {
        console.error(error);
        window.alert(error.message || 'Failed to save changes.');
      }
    });
  }

  async function initViewCustomerPage() {
    const nameEl = document.getElementById('customerName');
    if (!nameEl) return;

    const accountEl = document.getElementById('customerAccountNumber');
    const addressEl = document.getElementById('customerAddress');
    const rateClassPill = document.getElementById('customerRateClassPill');
    const statusValueEl = document.getElementById('customerStatusValue');
    const districtValueEl = document.getElementById('customerDistrictValue');
    const phoneEl = document.getElementById('customerPhone');
    const emailEl = document.getElementById('customerEmail');
    const editLink = document.getElementById('editCustomerLink');
    const header = document.querySelector('.customer-header');

    const concessionerId = Number(parseQueryParam('id'));
    if (!concessionerId) {
      if (header) {
        const msg = document.createElement('p');
        msg.className = 'customer-header-subtitle';
        msg.textContent = 'No concessioner ID provided. Please return to the list and select a customer.';
        header.appendChild(msg);
      }
      return;
    }

    let customer;
    try {
      customer = await getCustomerByConcessionerId(concessionerId);
    } catch (error) {
      console.error(error);
    }

    if (!customer) {
      if (header) {
        const msg = document.createElement('p');
        msg.className = 'customer-header-subtitle';
        msg.textContent = `Customer with Concessioner ID #${concessionerId} was not found.`;
        header.appendChild(msg);
      }
      return;
    }

    nameEl.textContent = customer.fullName || `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
    if (accountEl) accountEl.textContent = customer.accountNumber || '';
    if (addressEl) addressEl.textContent = customer.address || '';

    if (rateClassPill) {
      rateClassPill.textContent = customer.rateClassification || '';
      rateClassPill.className = `status-pill ${formatStatusClass(customer.connectionStatus)}`;
    }

    if (statusValueEl) statusValueEl.textContent = customer.connectionStatus || '';
    if (districtValueEl) districtValueEl.textContent = customer.district || '';
    if (phoneEl) phoneEl.textContent = customer.contactNumber || '';
    if (emailEl) emailEl.textContent = customer.email || '';
    if (editLink) editLink.href = `edit-concessioner.html?id=${encodeURIComponent(customer.concessionerId)}`;
  }

  const pageType = document.body ? document.body.getAttribute('data-page') : null;
  if (pageType === 'customer-list') {
    initCustomerListPage();
  } else if (pageType === 'add-concessioner') {
    initAddConcessionerPage();
  } else if (pageType === 'edit-concessioner') {
    initEditConcessionerPage();
  } else if (pageType === 'view-customer') {
    initViewCustomerPage();
  }
})();
