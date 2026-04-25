(function () {
  const sidebar = document.getElementById('sidebar');
  const mobileOverlay = document.getElementById('mobileOverlay');
  const menuBtn = document.getElementById('menuBtn');
  const closeSidebarBtn = document.getElementById('closeSidebar');
  const tableBody = document.getElementById('consumptionTableBody');
  const reportPrevYearBtn = document.getElementById('reportPrevYear');
  const reportNextYearBtn = document.getElementById('reportNextYear');
  const reportCurrentYearEl = document.getElementById('reportCurrentYear');
  const reportSectionTitle = document.querySelector('.report-section-title');

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const MOTHER_FIRST_NAME = 'MOTHER METER';
  const MOTHER_ACCOUNT_PREFIX = 'ACC-MOTHER';
  const MOTHER_METER_PREFIX = 'MTR-MOTHER';
  let selectedYear = new Date().getFullYear();
  let availableYears = [];

  function resolveBillingSummaryDate(item) {
    const periodEndRaw = item.periodEnd ?? item.PeriodEnd;
    if (periodEndRaw) {
      const periodEnd = new Date(periodEndRaw);
      if (!Number.isNaN(periodEnd.getTime())) return periodEnd;
    }

    const periodStartRaw = item.periodStart ?? item.PeriodStart;
    if (periodStartRaw) {
      const periodStart = new Date(periodStartRaw);
      if (!Number.isNaN(periodStart.getTime())) return periodStart;
    }

    const billDateRaw = item.billDate ?? item.BillDate;
    if (billDateRaw) {
      const billDate = new Date(billDateRaw);
      if (!Number.isNaN(billDate.getTime())) return billDate;
    }

    const createdAtRaw = item.createdAt ?? item.CreatedAt;
    if (createdAtRaw) {
      const createdAt = new Date(createdAtRaw);
      if (!Number.isNaN(createdAt.getTime())) return createdAt;
    }

    return null;
  }

  function extractYear(item) {
    const resolvedDate = resolveBillingSummaryDate(item);
    if (!resolvedDate) return null;
    return resolvedDate.getFullYear();
  }

  function computeAvailableYears(rows) {
    const years = new Set();
    (rows || []).forEach((item) => {
      const year = extractYear(item);
      if (year !== null) years.add(year);
    });
    return [...years].sort((a, b) => a - b);
  }

  function hasAvailableYear(year) {
    return availableYears.includes(year);
  }

  function updateYearNavigationState() {
    if (!reportPrevYearBtn || !reportNextYearBtn) return;

    if (!availableYears.length) {
      reportPrevYearBtn.disabled = true;
      reportNextYearBtn.disabled = true;
      return;
    }

    reportPrevYearBtn.disabled = !hasAvailableYear(selectedYear - 1);
    reportNextYearBtn.disabled = !hasAvailableYear(selectedYear + 1);
  }

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

  function createEmptyMonthlyReport() {
    return new Array(12).fill(null).map(() => ({
      motherMeterConsumption: 0,
      concessionerConsumption: 0,
      memberConsumption: 0,
      nonMemberConsumption: 0,
      waterLoss: 0,
    }));
  }

  function normalizeReportRows(data) {
    const monthlyReport = createEmptyMonthlyReport();

    (data || []).forEach(item => {
      const idx = (item.monthIndex ?? item.MonthIndex) - 1;
      if (idx >= 0 && idx < 12) {
        const motherMeterConsumption = Number(item.motherMeterConsumption ?? item.MotherMeterConsumption ?? 0);
        const concessionerConsumption = Number(item.concessionerConsumption ?? item.ConcessionerConsumption ?? 0);
        const memberConsumption = Number(item.memberConsumption ?? item.MemberConsumption ?? item.Member ?? item.member ?? 0);
        const nonMemberConsumption = Number(item.nonMemberConsumption ?? item.NonMemberConsumption ?? item.NonMember ?? item.nonMember ?? 0);
        const waterLoss = Number(item.waterLoss ?? item.WaterLoss ?? (motherMeterConsumption - concessionerConsumption));

        monthlyReport[idx] = {
          motherMeterConsumption,
          concessionerConsumption,
          memberConsumption,
          nonMemberConsumption,
          waterLoss,
        };
      }
    });

    return monthlyReport;
  }

  function isMotherMeterRecord(item) {
    const firstName = String(item.firstName ?? item.FirstName ?? '').trim().toUpperCase();
    const fullName = String(item.fullName ?? item.FullName ?? '').trim().toUpperCase();
    const accountNumber = String(item.accountNumber ?? item.AccountNumber ?? '').trim().toUpperCase();
    const meterNumber = String(item.meterNumber ?? item.MeterNumber ?? '').trim().toUpperCase();

    const matchesName =
      firstName === MOTHER_FIRST_NAME ||
      fullName === MOTHER_FIRST_NAME ||
      fullName.includes(MOTHER_FIRST_NAME);

    const matchesAccount = accountNumber.startsWith(MOTHER_ACCOUNT_PREFIX);
    const matchesMeter = meterNumber.startsWith(MOTHER_METER_PREFIX);

    return matchesName || matchesAccount || matchesMeter;
  }

  function aggregateFromBillingSummary(rows, targetYear) {
    const monthlyReport = createEmptyMonthlyReport();

    (rows || []).forEach(item => {
      const billDate = resolveBillingSummaryDate(item);
      if (!billDate) return;
      if (billDate.getFullYear() !== targetYear) return;

      const monthIndex = billDate.getMonth();
      if (monthIndex < 0 || monthIndex > 11) return;

      const consumption = Number(item.consumption ?? item.Consumption ?? 0);
      if (!Number.isFinite(consumption)) return;

      if (isMotherMeterRecord(item)) {
        monthlyReport[monthIndex].motherMeterConsumption += consumption;
      } else {
        monthlyReport[monthIndex].concessionerConsumption += consumption;

        // Split by membership
        const membership = String(item.membershipName ?? item.MembershipName ?? item.Membership ?? item.membership ?? '').trim().toLowerCase();
        if (membership === 'member') {
          monthlyReport[monthIndex].memberConsumption += consumption;
        } else {
          monthlyReport[monthIndex].nonMemberConsumption += consumption;
        }
      }
    });

    monthlyReport.forEach(m => {
      m.waterLoss = m.motherMeterConsumption - m.concessionerConsumption;
    });

    return monthlyReport;
  }

  async function getMonthlyWaterLossData(api, year) {
    // The specific consumption-water-loss endpoint does not return member/non-member data.
    // We use the billing-summary endpoint which contains the necessary membership details to aggregate.
    const billingRows = await api.get('/report/billing-summary');
    const rows = Array.isArray(billingRows) ? billingRows : [];

    availableYears = computeAvailableYears(rows);
    if (availableYears.length && !hasAvailableYear(selectedYear)) {
      selectedYear = availableYears[availableYears.length - 1];
    }

    updateYearNavigationState();

    return aggregateFromBillingSummary(rows, selectedYear);
  }

  async function loadConsumptionReport() {
    const loadingOverlay = document.getElementById('reportTableLoading');
    if (loadingOverlay) loadingOverlay.classList.add('active');

    try {
      const api = getApi();
      const monthlyReport = await getMonthlyWaterLossData(api, selectedYear);

      if (reportCurrentYearEl) {
        reportCurrentYearEl.textContent = String(selectedYear);
      }

      if (reportSectionTitle) {
        reportSectionTitle.textContent = `Total Consumption - ${selectedYear}`;
      }

      if (!tableBody) return;
      tableBody.innerHTML = '';

      let annualMother = 0;
      let annualConcessioners = 0;
      let annualMembers = 0;
      let annualNonMembers = 0;
      let annualWaterLoss = 0;

      MONTH_NAMES.forEach((name, i) => {
        const monthData = monthlyReport[i];
        annualMother += monthData.motherMeterConsumption;
        annualConcessioners += monthData.concessionerConsumption;
        annualMembers += monthData.memberConsumption;
        annualNonMembers += monthData.nonMemberConsumption;
        annualWaterLoss += monthData.waterLoss;

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${name}</td>
          <td class="text-right">${monthData.motherMeterConsumption.toLocaleString()}</td>
          <td class="text-right">${monthData.concessionerConsumption.toLocaleString()}</td>
          <td class="text-right">${monthData.memberConsumption.toLocaleString()}</td>
          <td class="text-right">${monthData.nonMemberConsumption.toLocaleString()}</td>
          <td class="text-right">${monthData.waterLoss.toLocaleString()}</td>
        `;
        tableBody.appendChild(row);
      });

      // Total Row
      const totalRow = document.createElement('tr');
      totalRow.className = 'total-row';
      totalRow.innerHTML = `
        <td>TOTAL ${selectedYear}</td>
        <td class="text-right">${annualMother.toLocaleString()}</td>
        <td class="text-right">${annualConcessioners.toLocaleString()}</td>
        <td class="text-right">${annualMembers.toLocaleString()}</td>
        <td class="text-right">${annualNonMembers.toLocaleString()}</td>
        <td class="text-right">${annualWaterLoss.toLocaleString()}</td>
      `;
      tableBody.appendChild(totalRow);

    } catch (error) {
      console.error('Failed to load consumption report:', error);
      updateYearNavigationState();
      if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Error loading data.</td></tr>';
      }
    } finally {
      if (loadingOverlay) loadingOverlay.classList.remove('active');
    }
  }

  async function init() {
    bindSidebar();
    if (reportPrevYearBtn) {
      reportPrevYearBtn.addEventListener('click', async () => {
        const targetYear = selectedYear - 1;
        if (!hasAvailableYear(targetYear)) return;

        selectedYear = targetYear;
        await loadConsumptionReport();
      });
    }

    if (reportNextYearBtn) {
      reportNextYearBtn.addEventListener('click', async () => {
        const targetYear = selectedYear + 1;
        if (!hasAvailableYear(targetYear)) return;

        selectedYear = targetYear;
        await loadConsumptionReport();
      });
    }

    await loadConsumptionReport();
  }

  init();
})();
