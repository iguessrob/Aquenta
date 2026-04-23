(function () {
  const PAGE_SIZE = 8;

  const sidebar = document.getElementById('sidebar');
  const mobileOverlay = document.getElementById('mobileOverlay');
  const menuBtn = document.getElementById('menuBtn');
  const closeSidebarBtn = document.getElementById('closeSidebar');

  const customerTableBody = document.getElementById('customerTableBody');
  const customerTotalCount = document.getElementById('customerTotalCount');
  const customerSearchInput = document.getElementById('customerSearchInput');
  const rateClassFilter = document.getElementById('rateClassFilter');
  const districtFilter = document.getElementById('districtFilter');
  const statusFilter = document.getElementById('statusFilter');

  const paginationText = document.getElementById('paginationText');
  const currentPageBtn = document.getElementById('currentPageBtn');
  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');

  let allCustomers = [];
  let filteredCustomers = [];
  let currentPage = 1;

  function getApi() {
    if (!window.AquentaApiClient) {
      throw new Error('API client is not loaded. Please include script/api-client.js');
    }
    return window.AquentaApiClient;
  }

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

  function bindSidebar() {
    if (menuBtn) menuBtn.addEventListener('click', openSidebar);
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
    if (mobileOverlay) mobileOverlay.addEventListener('click', closeSidebar);

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach((item) => {
      item.addEventListener('click', () => {
        if (window.innerWidth < 1024) closeSidebar();
      });
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024) closeSidebar();
    });
  }

  function pick(obj, keys, fallback) {
    for (const key of keys) {
      if (typeof obj[key] !== 'undefined' && obj[key] !== null) {
        return obj[key];
      }
    }
    return fallback;
  }

  function normalizeById(items, idKeys) {
    const map = new Map();
    (items || []).forEach((item) => {
      const id = idKeys.map((key) => item[key]).find((value) => value !== null && typeof value !== 'undefined');
      if (typeof id !== 'undefined' && id !== null) {
        map.set(Number(id), item);
      }
    });
    return map;
  }

  function formatStatusClass(status) {
    const key = String(status || '').trim().toLowerCase();
    if (key === 'active' || key === 'paid') return 'cr-status-active';
    if (key === 'disconnected' || key === 'unpaid') return 'cr-status-disconnected';
    if (key === 'inactive') return 'cr-status-inactive';
    if (key === 'delinquent') return 'cr-status-delinquent';
    return 'cr-status-active';
  }

  function getDistrictSortOrder(districtName) {
    const normalized = String(districtName || '').trim().toUpperCase();
    const match = normalized.match(/^PUROK\s*(\d+)$/);
    if (!match) return 9999;

    const value = Number(match[1]);
    return Number.isFinite(value) ? value : 9999;
  }

  function sortCustomersByDistrictAndAccountOrder(items) {
    items.sort((a, b) => {
      const districtOrderA = getDistrictSortOrder(a.district);
      const districtOrderB = getDistrictSortOrder(b.district);
      if (districtOrderA !== districtOrderB) {
        return districtOrderA - districtOrderB;
      }

      const accountOrderA = Number(a.accountOrder || 0);
      const accountOrderB = Number(b.accountOrder || 0);
      if (accountOrderA !== accountOrderB) {
        return accountOrderA - accountOrderB;
      }

      const accountNumberCompare = String(a.accountNumber || '').localeCompare(
        String(b.accountNumber || ''),
        undefined,
        { numeric: true, sensitivity: 'base' }
      );

      if (accountNumberCompare !== 0) {
        return accountNumberCompare;
      }

      return Number(a.concessionerId || 0) - Number(b.concessionerId || 0);
    });
  }

  function mapConcessionerToCustomer(concessioner, lookups) {
    const userId = Number(pick(concessioner, ['userId', 'UserId', 'userID', 'UserID'], 0));
    const categoryId = Number(pick(concessioner, ['categoryId', 'CategoryId', 'categoryID', 'CategoryID'], 0));
    const districtId = Number(pick(concessioner, ['districtId', 'DistrictId', 'districtID', 'DistrictID'], 0));

    const user = lookups.userMap.get(userId) || {};
    const category = lookups.categoryMap.get(categoryId) || {};
    const district = lookups.districtMap.get(districtId) || {};

    const firstName = pick(user, ['firstName', 'FirstName'], '');
    const lastName = pick(user, ['lastName', 'LastName'], '');

    return {
      concessionerId: Number(pick(concessioner, ['concessionerId', 'ConcessionerId', 'concessionerID', 'ConcessionerID'], 0)),
      accountNumber: String(pick(concessioner, ['accountNumber', 'AccountNumber'], '')),
      accountOrder: Number(pick(concessioner, ['accountOrder', 'AccountOrder'], 0)),
      fullName: [lastName, firstName].filter(Boolean).join(', '),
      district: String(pick(district, ['districtName', 'DistrictName'], '')),
      rateClassification: String(pick(category, ['categoryName', 'CategoryName'], '')),
      connectionStatus: String(pick(concessioner, ['status', 'Status'], 'Active')),
    };
  }

  async function getCustomers() {
    const api = getApi();
    const [concessioners, users, categories, districts] = await Promise.all([
      api.get('/Concessioner'),
      api.get('/User'),
      api.get('/Category'),
      api.get('/District'),
    ]);

    const lookups = {
      userMap: normalizeById(users || [], ['userId', 'UserId', 'userID', 'UserID']),
      categoryMap: normalizeById(categories || [], ['categoryId', 'CategoryId', 'categoryID', 'CategoryID']),
      districtMap: normalizeById(districts || [], ['districtId', 'DistrictId', 'districtID', 'DistrictID']),
    };

    return (concessioners || []).map((item) => mapConcessionerToCustomer(item, lookups));
  }

  function appendUniqueOptions(selectEl, values) {
    if (!selectEl) return;
    values.forEach((value) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      selectEl.appendChild(option);
    });
  }

  function seedFilterOptions(customers) {
    const rateClasses = [...new Set(customers.map((item) => item.rateClassification).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
    const districts = [...new Set(customers.map((item) => item.district).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));

    appendUniqueOptions(rateClassFilter, rateClasses);
    appendUniqueOptions(districtFilter, districts);
  }

  function applyFilters() {
    const term = String(customerSearchInput ? customerSearchInput.value : '').trim().toLowerCase();
    const rate = String(rateClassFilter ? rateClassFilter.value : 'ALL').toLowerCase();
    const district = String(districtFilter ? districtFilter.value : 'ALL').toLowerCase();
    const status = String(statusFilter ? statusFilter.value : 'ALL').toLowerCase();

    filteredCustomers = allCustomers.filter((item) => {
      const account = String(item.accountNumber || '').toLowerCase();
      const fullName = String(item.fullName || '').toLowerCase();
      const itemRate = String(item.rateClassification || '').toLowerCase();
      const itemDistrict = String(item.district || '').toLowerCase();
      const itemStatus = String(item.connectionStatus || '').toLowerCase();

      const matchesSearch = !term || account.includes(term) || fullName.includes(term);
      const matchesRate = rate === 'all' || itemRate === rate;
      const matchesDistrict = district === 'all' || itemDistrict === district;
      const matchesStatus = status === 'all' || itemStatus === status;

      return matchesSearch && matchesRate && matchesDistrict && matchesStatus;
    });

    sortCustomersByDistrictAndAccountOrder(filteredCustomers);

    currentPage = 1;
    renderPage();
  }

  function getPageCount() {
    return Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
  }

  function renderTable(rows) {
    if (!customerTableBody) return;
    customerTableBody.innerHTML = '';

    if (!rows.length) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="6" class="cr-empty">No customer records found for the selected filters.</td>';
      customerTableBody.appendChild(row);
      return;
    }

    rows.forEach((customer) => {
      const row = document.createElement('tr');
      const statusClass = formatStatusClass(customer.connectionStatus);
      const statusLabel = customer.connectionStatus || 'Active';

      row.innerHTML = `
        <td>${customer.accountNumber || ''}</td>
        <td>${customer.fullName || ''}</td>
        <td>${customer.district || ''}</td>
        <td>${customer.rateClassification || ''}</td>
        <td><span class="cr-status ${statusClass}">${statusLabel}</span></td>
        <td class="cr-action-cell">
          <div class="cr-action">
            <a href="customer/view-customer.html?id=${encodeURIComponent(customer.concessionerId)}" class="cr-icon-btn view-btn" aria-label="View concessioner">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </a>
            <a href="customer/edit-concessioner.html?id=${encodeURIComponent(customer.concessionerId)}" class="cr-icon-btn edit-btn" aria-label="Edit concessioner">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"></path>
              </svg>
            </a>
          </div>
        </td>
      `;

      customerTableBody.appendChild(row);
    });
  }

  function renderPagination() {
    const totalRecords = filteredCustomers.length;
    const pageCount = getPageCount();

    if (currentPage > pageCount) currentPage = pageCount;
    if (currentPage < 1) currentPage = 1;

    const startIndex = totalRecords === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
    const endIndex = totalRecords === 0 ? 0 : Math.min(currentPage * PAGE_SIZE, totalRecords);

    if (paginationText) paginationText.textContent = `Showing ${startIndex} to ${endIndex} of ${totalRecords} records`;
    if (currentPageBtn) currentPageBtn.textContent = String(currentPage);
    if (prevPageBtn) prevPageBtn.disabled = currentPage <= 1;
    if (nextPageBtn) nextPageBtn.disabled = currentPage >= pageCount;
  }

  function renderPage() {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageRows = filteredCustomers.slice(start, end);

    renderTable(pageRows);
    renderPagination();

    if (customerTotalCount) {
      customerTotalCount.textContent = Number(allCustomers.length).toLocaleString('en-US');
    }
  }

  function bindFilterEvents() {
    if (customerSearchInput) customerSearchInput.addEventListener('input', applyFilters);
    if (rateClassFilter) rateClassFilter.addEventListener('change', applyFilters);
    if (districtFilter) districtFilter.addEventListener('change', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);

    if (prevPageBtn) {
      prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage -= 1;
          renderPage();
        }
      });
    }

    if (nextPageBtn) {
      nextPageBtn.addEventListener('click', () => {
        if (currentPage < getPageCount()) {
          currentPage += 1;
          renderPage();
        }
      });
    }
  }

  async function init() {
    bindSidebar();
    bindFilterEvents();

    try {
      allCustomers = await getCustomers();
      seedFilterOptions(allCustomers);
      filteredCustomers = [...allCustomers];
      sortCustomersByDistrictAndAccountOrder(filteredCustomers);
      renderPage();
    } catch (error) {
      console.error(error);
      if (customerTableBody) {
        customerTableBody.innerHTML = '<tr><td colspan="6" class="cr-empty">Failed to load customer records from API.</td></tr>';
      }
      window.alert('Failed to load customer records from API. Make sure the backend is running on localhost:5024.');
    }
  }

  init();
})();
