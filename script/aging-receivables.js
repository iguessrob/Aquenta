(function () {
  const sidebar = document.getElementById('sidebar');
  const mobileOverlay = document.getElementById('mobileOverlay');
  const menuBtn = document.getElementById('menuBtn');
  const closeSidebarBtn = document.getElementById('closeSidebar');

  const agingSummaryBody = document.getElementById('agingSummaryBody');
  const agingDetailsBody = document.getElementById('agingDetailsBody');
  const bannerBalance = document.querySelector('.summary-banner div');
  const recordCountText = document.querySelector('.table-footer p');
  const searchInput = document.querySelector('.search-box input');
  const districtFilter = document.getElementById('districtFilter');
  const membershipFilter = document.getElementById('membershipFilter');

  let allDebtors = [];

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
    if (amount === 0 || amount === null || amount === undefined) return '₱ -';
    return '₱ ' + Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function getFullName(customer) {
    return `${customer.firstName ?? customer.FirstName ?? ''} ${customer.lastName ?? customer.LastName ?? ''}`.trim();
  }

  function getMembershipValue(customer) {
    const membership = String(customer.membership ?? customer.Membership ?? '').trim().toLowerCase();

    if (membership.includes('non')) return 'non-member';
    if (membership.includes('member')) return 'member';
    return '';
  }

  function getDistrictValue(customer) {
    return String(customer.district ?? customer.District ?? customer.districtName ?? customer.DistrictName ?? '').trim();
  }

  function getValue(obj, keys, fallback = 0) {
    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== null) return obj[key];
    }
    return fallback;
  }

  function getSearchHaystack(customer) {
    return [
      customer.accountNumber ?? customer.AccountNumber ?? '',
      getFullName(customer),
      getDistrictValue(customer),
      customer.membership ?? customer.Membership ?? '',
    ].join(' ').toLowerCase();
  }

  function populateDistrictFilter(debtors) {
    if (!districtFilter) return;

    const currentValue = districtFilter.value || 'all';
    const districts = Array.from(new Set(
      debtors
        .map(getDistrictValue)
        .filter(Boolean)
    )).sort((a, b) => a.localeCompare(b));

    districtFilter.innerHTML = '<option value="all">District: All</option>';
    districts.forEach((district) => {
      const option = document.createElement('option');
      option.value = district;
      option.textContent = district;
      districtFilter.appendChild(option);
    });

    if ([...districtFilter.options].some((option) => option.value === currentValue)) {
      districtFilter.value = currentValue;
    } else {
      districtFilter.value = 'all';
    }
  }

  function filterDebtors() {
    const searchTerm = (searchInput?.value || '').trim().toLowerCase();
    const districtValue = districtFilter?.value || 'all';
    const membershipValue = membershipFilter?.value || 'all';

    return allDebtors.filter((customer) => {
      const matchesSearch = !searchTerm || getSearchHaystack(customer).includes(searchTerm);
      const matchesDistrict = districtValue === 'all' || getDistrictValue(customer) === districtValue;
      const matchesMembership = membershipValue === 'all' || getMembershipValue(customer) === membershipValue;
      return matchesSearch && matchesDistrict && matchesMembership;
    });
  }

  function renderSummary(debtors) {
    if (!agingSummaryBody) return;

    const summary = {
      member: { total: 0, current: 0, b1_30: 0, b31_60: 0, b61_90: 0, bOver90: 0 },
      nonMember: { total: 0, current: 0, b1_30: 0, b31_60: 0, b61_90: 0, bOver90: 0 }
    };

    debtors.forEach((customer) => {
      const isMember = getMembershipValue(customer) === 'member';
      const key = isMember ? 'member' : 'nonMember';
      
      summary[key].total += Number(getValue(customer, ['totalOwed', 'TotalOwed']));
      summary[key].current += Number(getValue(customer, ['bucketCurrent', 'BucketCurrent']));
      summary[key].b1_30 += Number(getValue(customer, ['bucket1_30', 'Bucket1_30']));
      summary[key].b31_60 += Number(getValue(customer, ['bucket31_60', 'Bucket31_60']));
      summary[key].b61_90 += Number(getValue(customer, ['bucket61_90', 'Bucket61_90']));
      summary[key].bOver90 += Number(getValue(customer, ['bucketOver90', 'BucketOver90']));
    });

    const grandTotal = summary.member.total + summary.nonMember.total;

    if (bannerBalance) {
      bannerBalance.textContent = `Total Outstanding Balance: ${formatCurrency(grandTotal)}`;
    }

    const rowHtml = (label, data, isTotal = false) => `
      <tr class="${isTotal ? 'total-row' : ''}">
        <td class="label-col">${label}</td>
        <td>${formatCurrency(data.total)}</td>
        <td>${formatCurrency(data.current)}</td>
        <td>${formatCurrency(data.b1_30)}</td>
        <td>${formatCurrency(data.b31_60)}</td>
        <td>${formatCurrency(data.b61_90)}</td>
        <td>${formatCurrency(data.bOver90)}</td>
      </tr>
    `;

    const totals = {
      total: grandTotal,
      current: summary.member.current + summary.nonMember.current,
      b1_30: summary.member.b1_30 + summary.nonMember.b1_30,
      b31_60: summary.member.b31_60 + summary.nonMember.b31_60,
      b61_90: summary.member.b61_90 + summary.nonMember.b61_90,
      bOver90: summary.member.bOver90 + summary.nonMember.bOver90
    };

    agingSummaryBody.innerHTML = 
      rowHtml('Member', summary.member) +
      rowHtml('Non-Member', summary.nonMember) +
      rowHtml('Total', totals, true);
  }

  function renderDetails(debtors) {
    if (!agingDetailsBody) return;

    agingDetailsBody.innerHTML = '';

    if (!debtors.length) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="9" style="text-align:center; padding: 20px; color: #64748b;">No records match the selected filters.</td>';
      agingDetailsBody.appendChild(row);
      return;
    }

    debtors.forEach((customer) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${customer.accountNumber ?? customer.AccountNumber ?? ''}</td>
        <td>${getFullName(customer)}</td>
        <td>${getMembershipValue(customer) === 'member' ? 'M' : 'NM'}</td>
        <td>${formatCurrency(getValue(customer, ['totalOwed', 'TotalOwed']))}</td>
        <td>${formatCurrency(getValue(customer, ['bucketCurrent', 'BucketCurrent']))}</td>
        <td>${formatCurrency(getValue(customer, ['bucket1_30', 'Bucket1_30']))}</td>
        <td>${formatCurrency(getValue(customer, ['bucket31_60', 'Bucket31_60']))}</td>
        <td>${formatCurrency(getValue(customer, ['bucket61_90', 'Bucket61_90']))}</td>
        <td>${formatCurrency(getValue(customer, ['bucketOver90', 'BucketOver90']))}</td>
      `;
      agingDetailsBody.appendChild(row);
    });
  }

  function updateView() {
    const filteredDebtors = filterDebtors();
    renderSummary(filteredDebtors);
    renderDetails(filteredDebtors);

    if (recordCountText) {
      recordCountText.textContent = `Showing 1 to ${filteredDebtors.length} of ${filteredDebtors.length} records`;
    }
  }

  async function loadAgingReceivables() {
    const summaryLoading = document.getElementById('agingSummaryLoading');
    const detailsLoading = document.getElementById('agingDetailsLoading');
    
    if (summaryLoading) summaryLoading.classList.add('active');
    if (detailsLoading) detailsLoading.classList.add('active');

    try {
      const api = getApi();
      const data = await api.get('/report/active-customers-debt');

      allDebtors = (data || []);

      populateDistrictFilter(allDebtors);
      updateView();
    } catch (error) {
      console.error('Failed to load aging receivables:', error);
    } finally {
      if (summaryLoading) summaryLoading.classList.remove('active');
      if (detailsLoading) detailsLoading.classList.remove('active');
    }
  }

  function bindFilters() {
    if (searchInput) searchInput.addEventListener('input', updateView);
    if (districtFilter) districtFilter.addEventListener('change', updateView);
    if (membershipFilter) membershipFilter.addEventListener('change', updateView);
  }

  async function init() {
    bindSidebar();
    bindFilters();
    await loadAgingReceivables();
  }

  init();
})();
