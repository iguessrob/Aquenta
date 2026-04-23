(function () {
  const sidebar = document.getElementById('sidebar');
  const mobileOverlay = document.getElementById('mobileOverlay');
  const menuBtn = document.getElementById('menuBtn');
  const closeSidebarBtn = document.getElementById('closeSidebar');
  
  const disconnectionTableBody = document.getElementById('disconnectionTableBody');
  const disconnectionCountElem = document.getElementById('disconnectionCount');
  const recordCountText = document.querySelector('.table-footer p');

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

  async function loadDisconnectionList() {
    try {
      const api = getApi();
      const data = await api.get('/report/delinquent-customers');
      const delinquents = data || [];

      if (disconnectionCountElem) {
        disconnectionCountElem.textContent = `Concessioners to be Disconnected: ${delinquents.length}`;
      }
      if (recordCountText) {
        recordCountText.textContent = `Showing 1 to ${delinquents.length} of ${delinquents.length} records`;
      }

      if (!disconnectionTableBody) return;
      disconnectionTableBody.innerHTML = '';

      if (delinquents.length === 0) {
        disconnectionTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No accounts subject to disconnection.</td></tr>';
        return;
      }

      delinquents.forEach(c => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${getValue(c, ['accountNumber', 'AccountNumber'], '')}</td>
          <td>${getValue(c, ['fullName', 'FullName'], '')}</td>
          <td>${getValue(c, ['lastReading', 'LastReading'], '0')}</td>
          <td>${getValue(c, ['unpaidBillCount', 'UnpaidBillCount'], 0)} Months</td>
          <td>${formatCurrency(getValue(c, ['totalDebt', 'TotalDebt']))}</td>
        `;
        disconnectionTableBody.appendChild(row);
      });

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
    await loadDisconnectionList();
  }

  init();
})();
