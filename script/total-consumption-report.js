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
  const MOTHER_ACCOUNT_NUMBER = 'ACC-MOTHER-0001';
  const MOTHER_METER_NUMBER = 'MTR-MOTHER-0001';
  let selectedYear = new Date().getFullYear();

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
        const waterLoss = Number(item.waterLoss ?? item.WaterLoss ?? (motherMeterConsumption - concessionerConsumption));

        monthlyReport[idx] = {
          motherMeterConsumption,
          concessionerConsumption,
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
      fullName.startsWith(`${MOTHER_FIRST_NAME} `);

    return matchesName || accountNumber === MOTHER_ACCOUNT_NUMBER || meterNumber === MOTHER_METER_NUMBER;
  }

  function aggregateFromBillingSummary(rows, targetYear) {
    const monthlyReport = createEmptyMonthlyReport();

    (rows || []).forEach(item => {
      const createdAtRaw = item.createdAt ?? item.CreatedAt;
      const createdAt = createdAtRaw ? new Date(createdAtRaw) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime())) return;
      if (createdAt.getFullYear() !== targetYear) return;

      const monthIndex = createdAt.getMonth();
      if (monthIndex < 0 || monthIndex > 11) return;

      const consumption = Number(item.consumption ?? item.Consumption ?? 0);
      if (!Number.isFinite(consumption)) return;

      if (isMotherMeterRecord(item)) {
        monthlyReport[monthIndex].motherMeterConsumption += consumption;
      } else {
        monthlyReport[monthIndex].concessionerConsumption += consumption;
      }
    });

    monthlyReport.forEach(m => {
      m.waterLoss = m.motherMeterConsumption - m.concessionerConsumption;
    });

    return monthlyReport;
  }

  async function getMonthlyWaterLossData(api, year) {
    try {
      const endpointRows = await api.get(`/report/consumption-water-loss/${year}`);
      return normalizeReportRows(endpointRows);
    } catch (endpointError) {
      // Fallback path if the running API build does not yet include the new endpoint.
      console.warn('Primary endpoint unavailable; falling back to billing-summary aggregation.', endpointError);
      const billingRows = await api.get('/report/billing-summary');
      return aggregateFromBillingSummary(billingRows, year);
    }
  }

  async function loadConsumptionReport() {
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

      let annualConcessioners = 0;
      let annualWaterLoss = 0;

      MONTH_NAMES.forEach((name, i) => {
        const monthData = monthlyReport[i];
        annualConcessioners += monthData.concessionerConsumption;
        annualWaterLoss += monthData.waterLoss;

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${name}</td>
          <td class="text-right">${monthData.concessionerConsumption.toLocaleString()}</td>
          <td class="text-right">${monthData.waterLoss.toLocaleString()}</td>
        `;
        tableBody.appendChild(row);
      });

      // Total Row
      const totalRow = document.createElement('tr');
      totalRow.className = 'total-row';
      totalRow.innerHTML = `
        <td>TOTAL ${selectedYear}</td>
        <td class="text-right">${annualConcessioners.toLocaleString()}</td>
        <td class="text-right">${annualWaterLoss.toLocaleString()}</td>
      `;
      tableBody.appendChild(totalRow);

    } catch (error) {
      console.error('Failed to load consumption report:', error);
      if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:red;">Error loading data.</td></tr>';
      }
    }
  }

  async function init() {
    bindSidebar();
    if (reportPrevYearBtn) {
      reportPrevYearBtn.addEventListener('click', async () => {
        selectedYear--;
        await loadConsumptionReport();
      });
    }

    if (reportNextYearBtn) {
      reportNextYearBtn.addEventListener('click', async () => {
        selectedYear++;
        await loadConsumptionReport();
      });
    }

    await loadConsumptionReport();
  }

  init();
})();
