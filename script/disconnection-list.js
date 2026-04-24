(function () {
  const sidebar = document.getElementById('sidebar');
  const mobileOverlay = document.getElementById('mobileOverlay');
  const menuBtn = document.getElementById('menuBtn');
  const closeSidebarBtn = document.getElementById('closeSidebar');
  
  const disconnectionTableBody = document.getElementById('disconnectionTableBody');
  const disconnectionCountElem = document.getElementById('disconnectionCount');
  const recordCountText = document.querySelector('.table-footer p');
  const monthFilter = document.getElementById('monthFilter');

  let allDelinquents = [];

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
  }

  function formatCurrency(amount) {
    return '₱ ' + (Number(amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function getValue(obj, keys, fallback = 0) {
    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== null) return obj[key];
    }
    return fallback;
  }

  function getUnpaidMonthCount(item) {
    return Number(getValue(item, ['unpaidBillCount', 'UnpaidBillCount'], 0)) || 0;
  }

  function renderDisconnectionRows(rows) {
    if (!disconnectionTableBody) return;
    disconnectionTableBody.innerHTML = '';

    if (rows.length === 0) {
      disconnectionTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No accounts subject to disconnection.</td></tr>';
      return;
    }

    rows.forEach(c => {
      const monthCount = getUnpaidMonthCount(c);
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${getValue(c, ['accountNumber', 'AccountNumber'], '')}</td>
        <td>${getValue(c, ['fullName', 'FullName'], '')}</td>
        <td>${getValue(c, ['lastReading', 'LastReading'], '0')}</td>
        <td>${monthCount} Months</td>
        <td>${formatCurrency(getValue(c, ['totalDebt', 'TotalDebt']))}</td>
      `;
      disconnectionTableBody.appendChild(row);
    });
  }

  function populateMonthFilterOptions(rows) {
    if (!monthFilter) return;

    const monthValues = rows.map(getUnpaidMonthCount).filter(month => month >= 2);
    const maxMonth = monthValues.length ? Math.max(...monthValues) : 1;

    monthFilter.innerHTML = '';

    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = 'Months: All';
    monthFilter.appendChild(allOption);

    for (let month = 2; month <= maxMonth; month += 1) {
      const option = document.createElement('option');
      option.value = String(month);
      option.textContent = `Months: ${month}`;
      monthFilter.appendChild(option);
    }
  }

  function applyFilters() {
    const selectedMonth = Number(monthFilter?.value || 0);

    const filtered = selectedMonth
      ? allDelinquents.filter(item => getUnpaidMonthCount(item) === selectedMonth)
      : allDelinquents;

    if (disconnectionCountElem) {
      disconnectionCountElem.textContent = `Concessioners to be Disconnected: ${filtered.length}`;
    }
    if (recordCountText) {
      recordCountText.textContent = `Showing 1 to ${filtered.length} of ${filtered.length} records`;
    }

    renderDisconnectionRows(filtered);
  }

  async function loadDisconnectionList() {
    try {
      const api = getApi();
      const data = await api.get('/report/delinquent-customers');
      allDelinquents = data || [];

      populateMonthFilterOptions(allDelinquents);
      applyFilters();

    } catch (error) {
      console.error('Failed to load disconnection list:', error);
      if (disconnectionTableBody) {
        disconnectionTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Error loading data.</td></tr>';
      }
    }
  }

  function setupPaginationGuards() {
    const pagination = document.querySelector('.pagination');
    if (!pagination) return;

    const prevBtn = pagination.querySelector('button[aria-label="Previous page"]');
    const nextBtn = pagination.querySelector('button[aria-label="Next page"]');
    
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;
  }

  async function init() {
    bindSidebar();
    setupPaginationGuards();
    if (monthFilter) {
      monthFilter.addEventListener('change', applyFilters);
    }
    await loadDisconnectionList();
  }

  init();
})();
