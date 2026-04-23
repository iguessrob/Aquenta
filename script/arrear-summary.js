(function () {
  const sidebar = document.getElementById('sidebar');
  const mobileOverlay = document.getElementById('mobileOverlay');
  const menuBtn = document.getElementById('menuBtn');
  const closeSidebarBtn = document.getElementById('closeSidebar');
  const arrearTableBody = document.getElementById('arrearTableBody');
  const totalArrearsStat = document.getElementById('totalArrearsStat');
  const totalPenaltyStat = document.getElementById('totalPenaltyStat');
  const arrearCountStat = document.getElementById('arrearCountStat');
  const recordCountText = document.getElementById('arrearRecordCount');
  const pagination = document.querySelector('.pagination');

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

  function pick(record, keys, fallback = '') {
    for (const key of keys) {
      if (record && record[key] !== undefined && record[key] !== null) {
        return record[key];
      }
    }
    return fallback;
  }

  function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function formatCurrency(amount) {
    return `₱ ${toNumber(amount, 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function formatMonths(count) {
    const value = Math.max(0, toNumber(count, 0));
    return value === 1 ? '1 month' : `${value} months`;
  }

  function setSummary(totalArrears, totalPenalty, count) {
    if (totalArrearsStat) {
      totalArrearsStat.textContent = `Total Arrears: ${formatCurrency(totalArrears)}`;
    }

    if (totalPenaltyStat) {
      totalPenaltyStat.textContent = `Total Penalties: ${formatCurrency(totalPenalty)}`;
    }

    if (arrearCountStat) {
      arrearCountStat.textContent = `Concessioners with Arrears: ${count}`;
    }
  }

  function renderRows(rows) {
    if (!arrearTableBody) return;

    if (!rows.length) {
      arrearTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No unpaid or overdue balances found.</td></tr>';
      return;
    }

    arrearTableBody.innerHTML = rows.map((row) => {
      const accountNumber = pick(row, ['accountNumber', 'AccountNumber']);
      const firstName = pick(row, ['firstName', 'FirstName']);
      const lastName = pick(row, ['lastName', 'LastName']);
      const districtName = pick(row, ['districtName', 'DistrictName']);
      const totalArrears = pick(row, ['totalArrears', 'TotalArrears'], 0);
      const totalPenalty = pick(row, ['totalPenalty', 'TotalPenalty'], 0);
      const monthsWithBalance = pick(row, ['monthsWithBalance', 'MonthsWithBalance'], 0);

      return `
        <tr>
          <td>${String(accountNumber ?? '')}</td>
          <td>${String(firstName ?? '')} ${String(lastName ?? '')}</td>
          <td>${String(districtName ?? '')}</td>
          <td>${formatCurrency(totalArrears)}</td>
          <td>${formatCurrency(totalPenalty)}</td>
          <td>${formatMonths(monthsWithBalance)}</td>
        </tr>
      `;
    }).join('');
  }

  function updateFooter(totalRows) {
    if (recordCountText) {
      recordCountText.textContent = totalRows === 0
        ? 'Showing 0 to 0 of 0 records'
        : `Showing 1 to ${totalRows} of ${totalRows} records`;
    }

    if (!pagination) return;

    const prevBtn = pagination.querySelector('button[aria-label="Previous page"]');
    const nextBtn = pagination.querySelector('button[aria-label="Next page"]');
    const pageBtn = pagination.querySelector('button.active');

    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;
    if (pageBtn) pageBtn.textContent = totalRows > 0 ? '1' : '0';
  }

  async function loadArrearSummary() {
    try {
      const api = getApi();
      const data = await api.get('/report/arrear-summary');
      const rows = Array.isArray(data) ? data : [];

      const totalArrears = rows.reduce((sum, row) => sum + toNumber(pick(row, ['totalArrears', 'TotalArrears'], 0)), 0);
      const totalPenalty = rows.reduce((sum, row) => sum + toNumber(pick(row, ['totalPenalty', 'TotalPenalty'], 0)), 0);

      setSummary(totalArrears, totalPenalty, rows.length);
      renderRows(rows);
      updateFooter(rows.length);
    } catch (error) {
      console.error('Failed to load arrear summary:', error);
      setSummary(0, 0, 0);
      if (arrearTableBody) {
        arrearTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Error loading arrear summary.</td></tr>';
      }
      updateFooter(0);
    }
  }

  async function init() {
    bindSidebar();
    await loadArrearSummary();
  }

  init();
})();
