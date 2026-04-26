(function () {
  const sidebar = document.getElementById('sidebar');
  const mobileOverlay = document.getElementById('mobileOverlay');
  const menuBtn = document.getElementById('menuBtn');
  const closeSidebarBtn = document.getElementById('closeSidebar');
  
  const disconnectionTableBody = document.getElementById('disconnectionTableBody');
  const disconnectionCountElem = document.getElementById('disconnectionCount');
  const recordCountText = document.querySelector('.table-footer p');
  const disconnectionMonthFilter = document.getElementById('disconnectionMonthFilter');

  const PAGE_SIZE = 25;
  let currentPage = 1;

  let disconnectionRows = [];
  let filteredDisconnectionRows = [];

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

  function formatMonthLabel(monthCount) {
    const value = Number(monthCount) || 0;
    return `${value} ${value === 1 ? 'Month' : 'Months'}`;
  }

  function getValue(obj, keys, fallback = 0) {
    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== null) return obj[key];
    }
    return fallback;
  }

  function getMonthCount(row) {
    return Number(getValue(row, ['unpaidBillCount', 'UnpaidBillCount'], 0)) || 0;
  }

  function populateMonthFilter(rows) {
    if (!disconnectionMonthFilter) return;

    const currentValue = disconnectionMonthFilter.value;
    const monthOptions = [...new Set(rows.map((row) => getMonthCount(row)).filter((value) => value > 0))]
      .sort((a, b) => a - b);

    disconnectionMonthFilter.innerHTML = ['<option value="">Months: All</option>']
      .concat(monthOptions.map((monthCount) => `<option value="${monthCount}">${formatMonthLabel(monthCount)}</option>`))
      .join('');

    if (currentValue && disconnectionMonthFilter.querySelector(`option[value="${currentValue}"]`)) {
      disconnectionMonthFilter.value = currentValue;
    }
  }

  function renderDisconnectionList(rows) {
    const totalRecords = rows.length;
    const totalPages = Math.ceil(totalRecords / PAGE_SIZE) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * PAGE_SIZE;
    const end = Math.min(start + PAGE_SIZE, totalRecords);
    const visibleRows = rows.slice(start, end);

    if (disconnectionCountElem) {
      disconnectionCountElem.textContent = `Concessioners to be Disconnected: ${totalRecords}`;
    }

    if (recordCountText) {
      recordCountText.textContent = totalRecords
        ? `Showing ${start + 1} to ${end} of ${totalRecords} records`
        : 'Showing 0 to 0 of 0 records';
    }

    renderPaginationUI(totalPages);

    if (!disconnectionTableBody) return;

    disconnectionTableBody.innerHTML = '';

    if (visibleRows.length === 0) {
      disconnectionTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No accounts subject to disconnection.</td></tr>';
      return;
    }

    visibleRows.forEach((c) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${escapeHtml(getValue(c, ['accountNumber', 'AccountNumber'], ''))}</td>
        <td>${escapeHtml(getValue(c, ['fullName', 'FullName'], ''))}</td>
        <td>${escapeHtml(getValue(c, ['lastReading', 'LastReading'], '0'))}</td>
        <td>${escapeHtml(formatMonthLabel(getMonthCount(c)))}</td>
        <td>${escapeHtml(formatCurrency(getValue(c, ['totalDebt', 'TotalDebt'])))}</td>
      `;
      disconnectionTableBody.appendChild(row);
    });
  }

  function renderPaginationUI(totalPages) {
    const pagination = document.querySelector('.pagination');
    if (!pagination) return;

    pagination.innerHTML = '';

    // Previous Button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.disabled = currentPage === 1;
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderDisconnectionList(filteredDisconnectionRows);
      }
    });
    pagination.appendChild(prevBtn);

    // Page Numbers
    const startPage = Math.max(1, currentPage - 1);
    const endPage = Math.min(totalPages, startPage + 2);
    const finalStart = Math.max(1, endPage - 2);

    for (let i = finalStart; i <= endPage; i++) {
      const btn = document.createElement('button');
      btn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
      btn.textContent = i;
      btn.addEventListener('click', () => {
        currentPage = i;
        renderDisconnectionList(filteredDisconnectionRows);
      });
      pagination.appendChild(btn);
    }

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderDisconnectionList(filteredDisconnectionRows);
      }
    });
    pagination.appendChild(nextBtn);
  }

  function applyFilters() {
    const selectedMonth = Number(disconnectionMonthFilter?.value || 0);

    currentPage = 1;
    filteredDisconnectionRows = disconnectionRows.filter((row) => {
      const rowMonthCount = getMonthCount(row);
      const matchesMonth = !selectedMonth || rowMonthCount === selectedMonth;
      return matchesMonth;
    });

    renderDisconnectionList(filteredDisconnectionRows);
  }

  async function loadDisconnectionList() {
    const loadingOverlay = document.getElementById('disconnectionTableLoading');
    if (loadingOverlay) loadingOverlay.classList.add('active');

    try {
      const api = getApi();
      const data = await api.get('/report/delinquent-customers');
      disconnectionRows = Array.isArray(data) ? data : [];
      populateMonthFilter(disconnectionRows);
      applyFilters();

    } catch (error) {
      console.error('Failed to load disconnection list:', error);
      if (disconnectionTableBody) {
        disconnectionTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Error loading data.</td></tr>';
      }
    } finally {
      if (loadingOverlay) loadingOverlay.classList.remove('active');
    }
  }

  function setupPaginationGuards() {
    // Dynamically handled by renderPaginationUI
  }

  async function init() {
    bindSidebar();
    setupPaginationGuards();
    if (disconnectionMonthFilter) {
      disconnectionMonthFilter.addEventListener('change', applyFilters);
    }
    await loadDisconnectionList();
  }

  init();
})();
