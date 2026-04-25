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
  const searchInput = document.getElementById('arrearSearch');
  const districtFilter = document.getElementById('arrearDistrictFilter');
  const statusFilter = document.getElementById('arrearStatusFilter');
  const membershipFilter = document.getElementById('arrearMembershipFilter');

  let allRows = [];

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

  function normalizeText(value) {
    return String(value || '').trim().toLowerCase();
  }

  function populateSelect(selectEl, values, placeholderText) {
    if (!selectEl) return;

    const previous = selectEl.value;
    const sortedValues = [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));

    const options = [`<option value="">${placeholderText}</option>`];
    sortedValues.forEach((value) => {
      options.push(`<option value="${String(value)}">${String(value)}</option>`);
    });

    selectEl.innerHTML = options.join('');
    if (previous && sortedValues.includes(previous)) {
      selectEl.value = previous;
    }
  }

  function getConcessionerId(row) {
    return toNumber(pick(row, ['concessionerId', 'ConcessionerId', 'concessionerID', 'ConcessionerID'], 0), 0);
  }

  function getMembershipName(row) {
    return String(pick(row, ['membershipName', 'MembershipName'], '')).trim();
  }

  function getStatusName(row) {
    return String(pick(row, ['connectionStatus', 'ConnectionStatus', 'status', 'Status'], '')).trim();
  }

  function enrichArrearRows(reportRows, concessioners, memberships) {
    const membershipNameById = new Map(
      (Array.isArray(memberships) ? memberships : []).map((item) => [
        toNumber(pick(item, ['membershipId', 'MembershipId', 'membershipID', 'MembershipID'], 0), 0),
        String(pick(item, ['membershipName', 'MembershipName'], '')).trim(),
      ]),
    );

    const concessionerById = new Map(
      (Array.isArray(concessioners) ? concessioners : []).map((item) => [
        toNumber(pick(item, ['concessionerId', 'ConcessionerId', 'concessionerID', 'ConcessionerID'], 0), 0),
        item,
      ]),
    );

    return reportRows.map((row) => {
      const concessioner = concessionerById.get(getConcessionerId(row)) || {};
      const membershipId = toNumber(pick(concessioner, ['membershipId', 'MembershipId', 'membershipID', 'MembershipID'], 0), 0);
      const membershipName = membershipNameById.get(membershipId) || '';
      const connectionStatus = String(pick(concessioner, ['status', 'Status'], '')).trim();

      return {
        ...row,
        membershipName,
        connectionStatus,
      };
    });
  }

  function applyFilters() {
    const term = normalizeText(searchInput?.value);
    const districtValue = normalizeText(districtFilter?.value);
    const statusValue = normalizeText(statusFilter?.value);
    const membershipValue = normalizeText(membershipFilter?.value);

    const filteredRows = allRows.filter((row) => {
      const accountNumber = normalizeText(pick(row, ['accountNumber', 'AccountNumber']));
      const firstName = normalizeText(pick(row, ['firstName', 'FirstName']));
      const lastName = normalizeText(pick(row, ['lastName', 'LastName']));
      const fullName = `${firstName} ${lastName}`.trim();

      const districtName = normalizeText(pick(row, ['districtName', 'DistrictName']));
      const statusName = normalizeText(getStatusName(row));
      const membershipName = normalizeText(getMembershipName(row));

      const matchesSearch = !term || accountNumber.includes(term) || fullName.includes(term);
      const matchesDistrict = !districtValue || districtName === districtValue;
      const matchesStatus = !statusValue || statusName === statusValue;
      const matchesMembership = !membershipValue || membershipName === membershipValue;

      return matchesSearch && matchesDistrict && matchesStatus && matchesMembership;
    });

    const totalArrears = filteredRows.reduce((sum, row) => sum + toNumber(pick(row, ['totalArrears', 'TotalArrears'], 0)), 0);
    const totalPenalty = filteredRows.reduce((sum, row) => sum + toNumber(pick(row, ['totalPenalty', 'TotalPenalty'], 0)), 0);

    setSummary(totalArrears, totalPenalty, filteredRows.length);
    renderRows(filteredRows);
    updateFooter(filteredRows.length);
  }

  function bindFilters() {
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (districtFilter) districtFilter.addEventListener('change', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);
    if (membershipFilter) membershipFilter.addEventListener('change', applyFilters);
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
    const loadingOverlay = document.getElementById('arrearTableLoading');
    if (loadingOverlay) loadingOverlay.classList.add('active');

    try {
      const api = getApi();
      const [data, concessioners, memberships] = await Promise.all([
        api.get('/report/arrear-summary'),
        api.get('/Concessioner'),
        api.get('/Membership'),
      ]);

      const rows = Array.isArray(data) ? data : [];
      allRows = enrichArrearRows(rows, concessioners, memberships);

      populateSelect(
        districtFilter,
        allRows.map((row) => String(pick(row, ['districtName', 'DistrictName'], '')).trim()),
        'District: All',
      );

      populateSelect(
        statusFilter,
        allRows.map((row) => getStatusName(row)),
        'Status: All',
      );

      populateSelect(
        membershipFilter,
        allRows.map((row) => getMembershipName(row)),
        'Membership: All',
      );

      applyFilters();
    } catch (error) {
      console.error('Failed to load arrear summary:', error);
      setSummary(0, 0, 0);
      if (arrearTableBody) {
        arrearTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Error loading arrear summary.</td></tr>';
      }
      updateFooter(0);
    } finally {
      if (loadingOverlay) loadingOverlay.classList.remove('active');
    }
  }

  async function init() {
    bindSidebar();
    bindFilters();
    await loadArrearSummary();
  }

  init();
})();
