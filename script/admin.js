// State
let currentYear = new Date().getFullYear();
let chartInstance = null;
let yAxisChart = null;
// Per-month width (pixels) used to size the chart inner container. Lower = narrower months.
const PX_PER_MONTH = 200;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Data
let monthlyData = MONTH_NAMES.map((month) => ({
  month,
  totalAccountReceivable: 0,
  collection: 0,
  balance: 0,
}));

function ensureLoggedIn() {
  const loggedIn = localStorage.getItem('aquentaLoggedIn') === 'true';
  const userRaw = localStorage.getItem('aquentaUser');
  if (!loggedIn || !userRaw) {
    window.location.href = 'auth';
    return null;
  }

  try {
    return JSON.parse(userRaw);
  } catch (error) {
    window.location.href = 'auth';
    return null;
  }
}

function getMonthRange(year, monthIndex) {
  const startDate = new Date(year, monthIndex, 1);
  const endDate = new Date(year, monthIndex + 1, 1);

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clampPercent(value) {
  const numeric = toNumber(value);
  if (numeric < 0) return 0;
  if (numeric > 100) return 100;
  return numeric;
}

async function safeApiGet(path, fallbackValue) {
  if (!window.AquentaApiClient) {
    return fallbackValue;
  }

  try {
    return await window.AquentaApiClient.get(path);
  } catch (error) {
    return fallbackValue;
  }
}

async function safeGetActiveMembersCount() {
  try {
    return await getActiveMembersCount();
  } catch (error) {
    return 0;
  }
}

function resolveBillingDate(item, periodById) {
  const periodId = toNumber(item.periodId ?? item.PeriodID ?? item.PeriodId);
  if (periodId > 0 && periodById.has(periodId)) {
    const period = periodById.get(periodId);
    const periodEndRaw = period.periodEnd ?? period.PeriodEnd;
    if (periodEndRaw) {
      const parsedPeriodEnd = new Date(periodEndRaw);
      if (!Number.isNaN(parsedPeriodEnd.getTime()) && parsedPeriodEnd.getFullYear() > 1900) {
        return parsedPeriodEnd;
      }
    }

    const periodStartRaw = period.periodStart ?? period.PeriodStart;
    if (periodStartRaw) {
      const periodStart = new Date(periodStartRaw);
      if (!Number.isNaN(periodStart.getTime()) && periodStart.getFullYear() > 1900) {
        return periodStart;
      }
    }
  }

  const rawBillDate = item.billDate ?? item.BillDate;
  if (rawBillDate) {
    const billDate = new Date(rawBillDate);
    if (!Number.isNaN(billDate.getTime()) && billDate.getFullYear() > 1900) {
      return billDate;
    }
  }

  const rawCreatedAt = item.createdAt ?? item.CreatedAt;
  if (rawCreatedAt) {
    const createdAt = new Date(rawCreatedAt);
    if (!Number.isNaN(createdAt.getTime()) && createdAt.getFullYear() > 1900) {
      return createdAt;
    }
  }

  return null;
}

function isMotherMeterConcessioner(item) {
  const firstName = String(item.firstName ?? item.FirstName ?? '').trim().toUpperCase();
  const fullName = String(item.fullName ?? item.FullName ?? '').trim().toUpperCase();
  const accountNumber = String(item.accountNumber ?? item.AccountNumber ?? '').trim().toUpperCase();
  const meterNumber = String(item.meterNumber ?? item.MeterNumber ?? '').trim().toUpperCase();

  const isMotherName = fullName.includes('MOTHER');
  const isMotherAccount = accountNumber.includes('MOTHER');
  const isMotherMeter = meterNumber.includes('MOTHER');

  return isMotherName || isMotherAccount || isMotherMeter;
}

function getLatestPeriodId(periodList, billingList) {
  const billingPeriodIds = new Set(
    (billingList || [])
      .map((b) => toNumber(b.periodId ?? b.PeriodID ?? b.PeriodId))
      .filter((id) => id > 0)
  );

  let latestPeriodId = 0;
  let latestPeriodDate = null;

  (periodList || []).forEach((period) => {
    const periodId = toNumber(period.periodId ?? period.PeriodID ?? period.PeriodId);
    if (periodId <= 0 || !billingPeriodIds.has(periodId)) return;

    const effectiveDateRaw = period.periodEnd ?? period.PeriodEnd ?? period.periodStart ?? period.PeriodStart;
    if (!effectiveDateRaw) return;

    const effectiveDate = new Date(effectiveDateRaw);
    if (Number.isNaN(effectiveDate.getTime())) return;

    if (!latestPeriodDate || effectiveDate > latestPeriodDate) {
      latestPeriodDate = effectiveDate;
      latestPeriodId = periodId;
    }
  });

  return latestPeriodId;
}

function computeLatestConcessionerCardMetrics(billingList, paymentList, periodList, concessionerList) {
  const latestPeriodId = getLatestPeriodId(periodList, billingList);
  if (latestPeriodId <= 0) {
    return {
      pendingCollections: 0,
      waterConsumed: 0,
      motherMeterConsumed: 0,
    };
  }

  const motherConcessionerIds = new Set(
    (concessionerList || [])
      .filter((c) => isMotherMeterConcessioner(c))
      .map((c) => toNumber(c.concessionerId ?? c.ConcessionerID ?? c.ConcessionerId))
      .filter((id) => id > 0)
  );

  const allLatestBills = (billingList || []).filter((bill) => {
    const periodId = toNumber(bill.periodId ?? bill.PeriodID ?? bill.PeriodId);
    return periodId === latestPeriodId;
  });

  const latestBillIdSet = new Set(
    allLatestBills
      .filter(bill => {
        const cid = toNumber(bill.concessionerId ?? bill.ConcessionerID ?? bill.ConcessionerId);
        return !motherConcessionerIds.has(cid);
      })
      .map((bill) => toNumber(bill.billingId ?? bill.BillingID ?? bill.BillingId))
      .filter((id) => id > 0)
  );

  const paidByBillingId = new Map();
  (paymentList || []).forEach((payment) => {
    const billingId = toNumber(payment.billingId ?? payment.BillingID ?? payment.BillingId);
    if (!latestBillIdSet.has(billingId)) return;

    const amountPaid = toNumber(payment.amountPaid ?? payment.AmountPaid);
    paidByBillingId.set(billingId, (paidByBillingId.get(billingId) || 0) + amountPaid);
  });

  let pendingCollections = 0;
  let waterConsumed = 0;
  let motherMeterConsumed = 0;

  allLatestBills.forEach((bill) => {
    const billingId = toNumber(bill.billingId ?? bill.BillingID ?? bill.BillingId);
    const concessionerId = toNumber(bill.concessionerId ?? bill.ConcessionerID ?? bill.ConcessionerId);
    const isMother = motherConcessionerIds.has(concessionerId);

    const prevReading = toNumber(bill.prevReading ?? bill.PrevReading);
    const currentReading = toNumber(bill.currentReading ?? bill.CurrentReading);
    const consumption = Math.max(0, currentReading - prevReading);

    if (isMother) {
      motherMeterConsumed += consumption;
    } else {
      waterConsumed += consumption;

      const billAmount = toNumber(bill.billAmount ?? bill.BillAmount);
      const penalty = toNumber(bill.penalty ?? bill.Penalty);
      const paidAmount = toNumber(paidByBillingId.get(billingId) || 0);
      const remaining = (billAmount + penalty) - paidAmount;

      if (remaining > 0) {
        pendingCollections += remaining;
      }
    }
  });

  return {
    pendingCollections,
    waterConsumed,
    motherMeterConsumed,
  };
}

function buildFallbackDashboardMetrics(billings, payments, periods, selectedYear) {
  const billingList = Array.isArray(billings) ? billings : [];
  const paymentList = Array.isArray(payments) ? payments : [];
  const periodList = Array.isArray(periods) ? periods : [];
  const periodById = new Map(
    periodList.map((period) => [toNumber(period.periodId ?? period.PeriodID ?? period.PeriodId), period])
  );

  const monthlyDataForSelectedYear = MONTH_NAMES.map((monthName) => ({
    month: monthName,
    totalAccountReceivable: 0,
    collection: 0,
    balance: 0,
  }));

  const billingIdToBucket = new Map();
  const bucketByYearMonth = new Map();

  if (billingList.length === 0) {
    return {
      latestMonthIndex: new Date().getMonth(),
      totalMonthlyAccountReceivable: 0,
      totalMonthlyCollection: 0,
      latestMonthPendingCollections: 0,
      totalAnnualAccountReceivable: 0,
      monthlyDataForSelectedYear,
      totalAnnualAccountReceivableForSelectedYear: 0,
    };
  }

  let latestDate = null;
  billingList.forEach((item) => {
    const parsedDate = resolveBillingDate(item, periodById);
    if (!parsedDate) return;
    if (!latestDate || parsedDate > latestDate) {
      latestDate = parsedDate;
    }
  });

  if (!latestDate) {
    latestDate = new Date();
  }

  billingList.forEach((item) => {
    const billDate = resolveBillingDate(item, periodById);
    if (!billDate) return;

    const year = billDate.getFullYear();
    const monthIndex = billDate.getMonth();
    const bucketKey = `${year}-${monthIndex}`;

    if (!bucketByYearMonth.has(bucketKey)) {
      bucketByYearMonth.set(bucketKey, {
        year,
        monthIndex,
        receivable: 0,
        collection: 0,
      });
    }

    const bucket = bucketByYearMonth.get(bucketKey);
    bucket.receivable += toNumber(item.billAmount ?? item.BillAmount) + toNumber(item.penalty ?? item.Penalty);

    const billingId = toNumber(item.billingId ?? item.BillingID ?? item.BillingId);
    if (billingId > 0) {
      billingIdToBucket.set(billingId, bucketKey);
    }
  });

  paymentList.forEach((item) => {
    const billingId = toNumber(item.billingId ?? item.BillingID ?? item.BillingId);
    if (!billingIdToBucket.has(billingId)) return;

    const bucketKey = billingIdToBucket.get(billingId);
    const bucket = bucketByYearMonth.get(bucketKey);
    if (!bucket) return;

    bucket.collection += toNumber(item.amountPaid ?? item.AmountPaid);
  });

  bucketByYearMonth.forEach((bucket) => {
    if (bucket.year !== selectedYear) return;

    monthlyDataForSelectedYear[bucket.monthIndex].totalAccountReceivable = bucket.receivable;
    monthlyDataForSelectedYear[bucket.monthIndex].collection = bucket.collection;
    monthlyDataForSelectedYear[bucket.monthIndex].balance = bucket.receivable - bucket.collection;
  });

  const latestYear = latestDate.getFullYear();
  const latestMonthIndex = latestDate.getMonth();
  const latestBucketKey = `${latestYear}-${latestMonthIndex}`;
  const latestBucket = bucketByYearMonth.get(latestBucketKey) || { receivable: 0, collection: 0 };

  const totalMonthlyAccountReceivable = latestBucket.receivable;
  const totalMonthlyCollection = latestBucket.collection;
  const totalAnnualAccountReceivable = Array.from(bucketByYearMonth.values())
    .filter((bucket) => bucket.year === latestYear)
    .reduce((sum, bucket) => sum + bucket.receivable, 0);

  const totalAnnualAccountReceivableForSelectedYear = monthlyDataForSelectedYear.reduce(
    (sum, item) => sum + toNumber(item.totalAccountReceivable),
    0
  );

  return {
    latestMonthIndex,
    totalMonthlyAccountReceivable,
    totalMonthlyCollection,
    latestMonthPendingCollections: totalMonthlyAccountReceivable - totalMonthlyCollection,
    totalAnnualAccountReceivable,
    monthlyDataForSelectedYear,
    totalAnnualAccountReceivableForSelectedYear,
  };
}

async function getActiveMembersCount() {
  if (!window.AquentaApiClient) {
    return 0;
  }

  const total = await window.AquentaApiClient.get('/Concessioner/active/count?status=Active');
  return toNumber(total);
}

async function loadDashboardData() {
  if (!window.AquentaApiClient) {
    return;
  }

  const [
    activeMembersCount,
    latestMonthPendingCollectionsRaw,
    latestMonthWaterConsumed,
    billings,
    payments,
    periods,
    concessioners,
  ] = await Promise.all([
    safeGetActiveMembersCount(),
    safeApiGet('/Report/latest-month-pending-collections', null),
    safeApiGet('/Billing/water-consumption/latest-month', 0),
    safeApiGet('/Billing', []),
    safeApiGet('/Payment', []),
    safeApiGet('/Period', []),
    safeApiGet('/Concessioner', []),
  ]);

  // Water distribution must be anchored to the latest month in billing records.
  const billingList = Array.isArray(billings) ? billings : [];
  const periodList = Array.isArray(periods) ? periods : [];
  const periodById = new Map(
    periodList.map((period) => [toNumber(period.periodId ?? period.PeriodID ?? period.PeriodId), period])
  );

  let latestBillingDate = null;
  billingList.forEach((item) => {
    const billDate = resolveBillingDate(item, periodById);
    if (!billDate) return;
    if (!latestBillingDate || billDate > latestBillingDate) {
      latestBillingDate = billDate;
    }
  });

  const latestWaterYear = latestBillingDate ? latestBillingDate.getFullYear() : new Date().getFullYear();
  const latestWaterMonthIndex = latestBillingDate ? latestBillingDate.getMonth() + 1 : new Date().getMonth() + 1;

  const latestMonthWaterSummary = await safeApiGet('/Report/latest-month-water-distribution', null);
  const monthlyConsumptionReport = await safeApiGet(`/Report/consumption-water-loss/${latestWaterYear}`, []);

  let latestMonthWaterData = null;
  if (latestMonthWaterSummary) {
    latestMonthWaterData = latestMonthWaterSummary;
  }

  if (monthlyConsumptionReport && Array.isArray(monthlyConsumptionReport)) {
    const monthlyRow = monthlyConsumptionReport.find((row) => {
      const rowMonthIndex = toNumber(row.monthIndex ?? row.MonthIndex ?? 0);
      return rowMonthIndex === latestWaterMonthIndex;
    });
    if (monthlyRow) {
      latestMonthWaterData = monthlyRow;
    }
  }

  const fallbackMetrics = buildFallbackDashboardMetrics(billings, payments, periods, currentYear);
  const cardMetrics = computeLatestConcessionerCardMetrics(
    billingList,
    Array.isArray(payments) ? payments : [],
    periodList,
    Array.isArray(concessioners) ? concessioners : []
  );

  const latestMonthPendingCollections = cardMetrics.pendingCollections > 0
    ? cardMetrics.pendingCollections
    : (latestMonthPendingCollectionsRaw === null
      ? fallbackMetrics.latestMonthPendingCollections
      : toNumber(latestMonthPendingCollectionsRaw));
  const latestMonthWaterConsumedConcessioners = cardMetrics.waterConsumed > 0
    ? cardMetrics.waterConsumed
    : toNumber(latestMonthWaterConsumed);

  const activeMembersElement = document.querySelector('.summary-card:nth-of-type(1) .card-value');
  if (activeMembersElement) {
    activeMembersElement.textContent = activeMembersCount.toLocaleString();
  }

  const pendingCollectionsElement = document.querySelector('.summary-card:nth-of-type(2) .card-value');
  const pendingCollections = toNumber(latestMonthPendingCollections);
  if (pendingCollectionsElement) {
    pendingCollectionsElement.textContent = `₱${pendingCollections.toLocaleString()}`;
  }

  monthlyData = fallbackMetrics.monthlyDataForSelectedYear;

  updateChartFooterVisibility();

  const waterConsumedElement = document.querySelector('.summary-card:nth-of-type(3) .card-value');
  if (waterConsumedElement) {
    waterConsumedElement.textContent = `${toNumber(latestMonthWaterConsumedConcessioners).toLocaleString()} m³`;
  }

  const totalAnnualElement = document.getElementById('totalAnnual');
  if (totalAnnualElement) {
    totalAnnualElement.textContent = `₱${toNumber(fallbackMetrics.totalAnnualAccountReceivableForSelectedYear).toLocaleString()}`;
  }

  // Extract unified water distribution data from the monthly report (using report-page calculation logic)
  let motherMeterConsumption = toNumber(latestMonthWaterData?.motherMeterConsumption ?? latestMonthWaterData?.MotherMeterConsumption ?? 0);
  let concessionerConsumption = toNumber(latestMonthWaterData?.concessionerConsumption ?? latestMonthWaterData?.ConcessionerConsumption ?? 0);
  let unaccountedWater = toNumber(latestMonthWaterData?.waterLoss ?? latestMonthWaterData?.WaterLoss ?? 0);

  // Fallback to frontend-calculated metrics if API data is missing mother meter info
  if (motherMeterConsumption <= 0 && cardMetrics.motherMeterConsumed > 0) {
    motherMeterConsumption = cardMetrics.motherMeterConsumed;
    concessionerConsumption = cardMetrics.waterConsumed;
    unaccountedWater = Math.max(0, motherMeterConsumption - concessionerConsumption);
  }

  // Calculate percentages based on mother meter
  let concessionerPercent = 0;
  let unaccountedPercent = 0;
  if (motherMeterConsumption > 0) {
    concessionerPercent = clampPercent(Math.round((concessionerConsumption * 100 / motherMeterConsumption) * 10) / 10);
    unaccountedPercent = clampPercent(Math.round((unaccountedWater * 100 / motherMeterConsumption) * 10) / 10);
  }

  const motherMeterValueEl = document.getElementById('motherMeterValue');
  if (motherMeterValueEl) {
    motherMeterValueEl.textContent = `${motherMeterConsumption.toLocaleString()} m³`;
  }

  const concessionerSegmentEl = document.getElementById('concessionerSegment');
  if (concessionerSegmentEl) {
    concessionerSegmentEl.style.width = `${concessionerPercent}%`;
  }

  const unaccountedSegmentEl = document.getElementById('unaccountedSegment');
  if (unaccountedSegmentEl) {
    unaccountedSegmentEl.style.width = `${unaccountedPercent}%`;
  }

  const concessionerSegmentLabelEl = document.getElementById('concessionerSegmentLabel');
  if (concessionerSegmentLabelEl) {
    concessionerSegmentLabelEl.textContent = `${concessionerPercent.toFixed(1)}%`;
  }

  const unaccountedSegmentLabelEl = document.getElementById('unaccountedSegmentLabel');
  if (unaccountedSegmentLabelEl) {
    unaccountedSegmentLabelEl.textContent = `${unaccountedPercent.toFixed(1)}%`;
  }

  const concessionerLegendValueEl = document.getElementById('concessionerLegendValue');
  if (concessionerLegendValueEl) {
    concessionerLegendValueEl.textContent = `${concessionerConsumption.toLocaleString()} m³ (${concessionerPercent.toFixed(1)}%)`;
  }

  const unaccountedLegendValueEl = document.getElementById('unaccountedLegendValue');
  if (unaccountedLegendValueEl) {
    unaccountedLegendValueEl.textContent = `${unaccountedWater.toLocaleString()} m³ (${unaccountedPercent.toFixed(1)}%)`;
  }

  // Update distribution date based on the latest period end (using PeriodEnd as month basis)
  const distributionDateEl = document.getElementById('distributionDate');
  if (distributionDateEl) {
    const summaryDateRaw = latestMonthWaterData?.LatestPeriodEnd ?? latestMonthWaterData?.latestPeriodEnd;
    const summaryDate = summaryDateRaw ? new Date(summaryDateRaw) : null;
    const displayDate = summaryDate && !Number.isNaN(summaryDate.getTime())
      ? summaryDate
      : latestBillingDate;

    if (displayDate && !Number.isNaN(displayDate.getTime())) {
      const latestMonthName = displayDate.toLocaleString('en-US', { month: 'long' });
      distributionDateEl.textContent = `Data for ${latestMonthName} ${displayDate.getFullYear()}`;
    }
  }

  if (chartInstance) {
    initChart();
    updateChartWidth();
  }
}

function updateChartFooterVisibility() {
  const chartTotal = document.querySelector('.chart-total');
  if (!chartTotal) {
    return;
  }

  const hasNonZeroData = monthlyData.some((item) => {
    return (
      toNumber(item.totalAccountReceivable) > 0 ||
      toNumber(item.collection) > 0 ||
      toNumber(item.balance) > 0
    );
  });

  chartTotal.style.display = hasNonZeroData ? '' : 'none';
}


// DOM Elements
const sidebar = document.getElementById('sidebar');
const mobileOverlay = document.getElementById('mobileOverlay');
const menuBtn = document.getElementById('menuBtn');
const closeSidebar = document.getElementById('closeSidebar');
const prevYearBtn = document.getElementById('prevYear');
const nextYearBtn = document.getElementById('nextYear');
const yearDisplay = document.getElementById('currentYear');
const exportBtn = document.getElementById('exportBtn');
const exportModal = document.getElementById('exportModal');
const closeModal = document.getElementById('closeModal');
const cancelExport = document.getElementById('cancelExport');
const downloadPNG = document.getElementById('downloadPNG');

if (yearDisplay) {
  yearDisplay.textContent = String(currentYear);
}


// Sidebar functionality
function openSidebar() {
  sidebar.classList.add('open');
  mobileOverlay.classList.add('active');
}


function closeSidebarFunc() {
  sidebar.classList.remove('open');
  mobileOverlay.classList.remove('active');
}


menuBtn.addEventListener('click', openSidebar);
closeSidebar.addEventListener('click', closeSidebarFunc);
mobileOverlay.addEventListener('click', closeSidebarFunc);


// Year navigation
prevYearBtn.addEventListener('click', () => {
  currentYear--;
  yearDisplay.textContent = currentYear;
  loadDashboardData().catch(error => {
    console.error('Failed to refresh dashboard data:', error);
  });
});


nextYearBtn.addEventListener('click', () => {
  currentYear++;
  yearDisplay.textContent = currentYear;
  loadDashboardData().catch(error => {
    console.error('Failed to refresh dashboard data:', error);
  });
});


// Calculate total annual
function calculateTotal() {
  let total = 0;
  monthlyData.forEach(item => {
    if (item.totalAccountReceivable) {
      total += item.totalAccountReceivable;
    }
  });
  return total;
}


document.getElementById('totalAnnual').textContent = '₱' + calculateTotal().toLocaleString();


// Chart initialization
function initChart() {
  // Custom plugin: draws a vertical highlight behind the hovered month
  const hoverBgPlugin = {
    id: 'hoverBgPlugin',
    afterEvent(chart, args) {
      const event = args.event;
      const points = chart.getElementsAtEventForMode(event, 'index', { intersect: false }, false);
      if (points && points.length) {
        const idx = points[0].index;
        if (chart.$hoverIndex !== idx) {
          chart.$hoverIndex = idx;
          chart.draw();
        }
      } else if (chart.$hoverIndex != null) {
        chart.$hoverIndex = null;
        chart.draw();
      }
    },
    beforeDatasetsDraw(chart) {
      const idx = chart.$hoverIndex;
      if (idx == null) return;
      const ctx = chart.ctx;
      const xScale = chart.scales.x;
      const chartArea = chart.chartArea;
      const labels = chart.data.labels || [];
      let band = 0;
      if (labels.length > 1) {
        band = xScale.getPixelForTick(1) - xScale.getPixelForTick(0);
      } else {
        band = xScale.width;
      }
      const center = xScale.getPixelForTick(idx);
      const left = center - band / 2;
      const right = center + band / 2;
      ctx.save();
      ctx.fillStyle = 'rgba(229,231,235,0.6)';
      ctx.fillRect(left, chartArea.top, right - left, chartArea.bottom - chartArea.top);
      ctx.restore();
    }
  };


  // Plugin to draw dashed horizontal grid lines across the chart area.
  const dashedGridPlugin = {
    id: 'dashedGridPlugin',
    beforeDraw(chart) {
      const yScale = chart.scales && chart.scales.y;
      const chartArea = chart.chartArea;
      if (!yScale || !chartArea) return;
      const ctx = chart.ctx;
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#e5e7eb';
      const ticks = yScale.ticks || [];
      for (let i = 0; i < ticks.length; i++) {
        // getPixelForTick exists on cartesian scales
        if (typeof yScale.getPixelForTick === 'function') {
          // Skip drawing the bottom-most tick here; we'll draw a solid bottom border instead
          if (i === ticks.length - 1) continue;
          const y = yScale.getPixelForTick(i);
          // skip if outside chart area
          if (y < chartArea.top - 1 || y > chartArea.bottom + 1) continue;
          ctx.beginPath();
          ctx.moveTo(chartArea.left, Math.round(y) + 0.5);
          ctx.lineTo(chartArea.right, Math.round(y) + 0.5);
          ctx.stroke();
        }
      }
      // Draw a solid, thicker bottom border (x-axis baseline)
      ctx.save();
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#d1d5db';
      ctx.beginPath();
      ctx.moveTo(chartArea.left, Math.round(chartArea.bottom) + 0.5);
      ctx.lineTo(chartArea.right, Math.round(chartArea.bottom) + 0.5);
      ctx.stroke();
      ctx.restore();
      ctx.restore();
    }
  };


  // Register plugin locally (so it applies only to this chart instance)
  // We'll attach it via the chart `plugins` option below.
  // DOM elements
  const canvas = document.getElementById('collectionChart');
  const chartInner = document.getElementById('chartInner');


  // Prepare data arrays
  const labels = monthlyData.map(d => d.month);
  const receivableData = monthlyData.map(d => d.totalAccountReceivable);
  const collectionData = monthlyData.map(d => d.collection);
  const balanceData = monthlyData.map(d => d.balance);


  // Compute required width based on number of labels so items don't crowd
  const requiredWidth = Math.max(PX_PER_MONTH * labels.length, chartInner.parentElement.clientWidth || 700);


  // Apply width to inner container and canvas
  chartInner.style.width = requiredWidth + 'px';
  canvas.style.width = requiredWidth + 'px';
  canvas.style.height = '400px';


  // Prepare and size the fixed y-axis canvas (left column)
  const yCanvas = document.getElementById('yAxisChart');
  if (yCanvas) {
    yCanvas.width = 50; // Minimal width for tick labels only
    yCanvas.height = 400;
    yCanvas.style.width = '50px';
    yCanvas.style.height = '400px';
  }


  // Destroy existing chart if present
  if (chartInstance) {
    chartInstance.destroy();
  }


  // Destroy any existing left-axis chart
  if (yAxisChart) {
    yAxisChart.destroy();
    yAxisChart = null;
  }


  // Compute a nice y-axis maximum based on data so both charts share the same scale
  const allValues = [...receivableData, ...collectionData, ...balanceData].filter(v => v != null && !isNaN(v));
  const maxVal = allValues.length ? Math.max(...allValues) : 0;
  let yMax = 100;
  let stepSize = 25;
  if (maxVal > 0) {
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
    yMax = Math.ceil(maxVal / magnitude) * magnitude;
    // Calculate stepSize to ensure max 5 ticks but allow fewer
    stepSize = yMax / 4; // This gives us 5 ticks including 0
  }


  // Prepare data for the left (fixed) y-axis chart: use per-index maximum so the axis matches the chart
  const maxPerIndex = labels.map((_, i) => {
    const a = receivableData[i] || 0;
    const b = collectionData[i] || 0;
    const c = balanceData[i] || 0;
    return Math.max(a, b, c);
  });


  // Create left-axis chart (fixed, not responsive) to render only the y-axis and grid
  const yCanvasCtx = yCanvas ? yCanvas.getContext('2d') : null;
  if (yCanvasCtx) {
    // Note: small tick-drawing removed to avoid extra horizontal tick marks.


    yAxisChart = new Chart(yCanvasCtx, {
      type: 'bar',
      data: {
        labels: [''], // Single empty label
        datasets: [{ label: '', data: [yMax], backgroundColor: 'rgba(0,0,0,0)', borderWidth: 0 }]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        // Keep layout padding in sync with the main chart so chartAreas align vertically
        layout: {
          padding: { top: 26, right: 0, bottom: 45, left: 0 }
        },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: {
            beginAtZero: true,
            suggestedMax: yMax,
            position: 'left',
            // do not draw full horizontal grid lines here; we'll draw dashed lines on the main chart
            grid: {
              display: false,
              drawOnChartArea: false,
              drawBorder: false,
              drawTicks: false,
              lineWidth: 0
            },
            border: {
              display: false
            },
            ticks: {
              color: '#6b7280',
              font: { size: 11 },
              stepSize: stepSize,
              padding: 0,
              align: 'end',
              crossAlign: 'near',
              callback: function(value) {
                try {
                  const v = Number(value);
                  if (isNaN(v)) return value;
                  if (Math.abs(v) >= 1000) {
                    const scaled = v / 1000;
                    // show 1 decimal only if necessary
                    const formatted = scaled % 1 === 0 ? scaled.toLocaleString() : scaled.toLocaleString(undefined, { maximumFractionDigits: 1 });
                    return formatted + 'k';
                  }
                  return v.toString();
                } catch (e) {
                  return value;
                }
              }
            }
          }
        }
      },
      plugins: []
    });
  }


  const ctx = canvas.getContext('2d');


  // Register a tooltip positioner named 'cursor' so the tooltip follows the mouse tip
  // `position` argument comes from Chart.js pointer event and contains x/y in chart coords.
  try {
    if (Chart && Chart.Tooltip && Chart.Tooltip.positioners) {
      Chart.Tooltip.positioners.cursor = function(elements, position) {
        // position may be undefined in some event situations; guard defensively
        const x = position && typeof position.x === 'number' ? position.x : 0;
        const y = position && typeof position.y === 'number' ? position.y : 0;
        return { x, y };
      };
    }
  } catch (e) {
    // ignore if Chart API differs in environment
  }


  // Plugin to draw a single vertical separator at the left edge of the main chart area
  // DISABLED: This causes the line to scroll with the chart
  // const separatorPlugin = {
  //   id: 'separatorPlugin',
  //   afterDraw(chart) {
  //     const ctx = chart.ctx;
  //     const chartArea = chart.chartArea;
  //     if (!chartArea) return;
  //     ctx.save();
  //     ctx.setLineDash([]);
  //     ctx.lineWidth = 2;
  //     ctx.strokeStyle = '#e5e7eb';
  //     const x = Math.round(chartArea.left) + 0.5;
  //     ctx.beginPath();
  //     ctx.moveTo(x, chartArea.top);
  //     ctx.lineTo(x, chartArea.bottom);
  //     ctx.stroke();
  //     ctx.restore();
  //   }
  // };


  chartInstance = new Chart(ctx, {
    type: 'bar',
    plugins: [hoverBgPlugin, dashedGridPlugin, ChartDataLabels],
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Total Account Receivable',
          data: receivableData,
          backgroundColor: '#1e72d3ff',
          borderRadius: 4,
        },
        {
          label: 'Collection',
          data: collectionData,
          backgroundColor: '#3b82f6',
          borderRadius: 4,
        },
        {
          label: 'Balance',
          data: balanceData,
          backgroundColor: '#93c5fd',
          borderRadius: 4,
        },
      ],
    },
    options: {
      // Keep layout padding in sync with the left-axis chart so chartAreas align vertically
      layout: {
        padding: { top: 20, bottom: 24 }
      },
      // Control spacing between bar groups (categories)
      datasets: {
        bar: {
          categoryPercentage: 0.55,
          barPercentage: 0.80,
          maxBarThickness: 80,
        }
      },
      responsive: false,
      maintainAspectRatio: false,
      plugins: {
        datalabels: {
          color: '#08101fff',
          font: {
            size: 14,
            weight: '500',
            family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          },
          anchor: 'start',
          align: 'end',
          offset: 4,
          rotation: -90,
          formatter: function(value, context) {
            if (value === null || value === undefined) {
              return '';
            }
            // Format the number with comma separators
            return value.toLocaleString();
          },
          display: function(context) {
            const value = toNumber(context.dataset.data[context.dataIndex]);
            return value > 0;
          }
        },
        legend: {
          display: false,
        },
        tooltip: {
          position: 'cursor',
          backgroundColor: 'white',
          titleColor: '#111827',
          bodyColor: '#111827',
          titleFont: {
            family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
            size: 14,
          },
          bodyFont: {
            family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
            size: 13,
          },
          borderColor: '#e5e7eb',
          borderWidth: 1,
          padding: 16,
          bodySpacing: 8,
          borderRadius: 8,
          caretSize: 0,
          caretPadding: 0,
          displayColors: true,
          /*
           * Only show tooltip when at least one dataset has a non-null value
           * for the hovered index. If all datasets are null/undefined for
           * that month, the tooltip will be suppressed.
           */
          filter: function(tooltipItem) {
            try {
              const chart = tooltipItem.chart;
              const dataIndex = tooltipItem.dataIndex;
              const datasets = chart.data && chart.data.datasets ? chart.data.datasets : [];
              for (let i = 0; i < datasets.length; i++) {
                const ds = datasets[i];
                if (!ds || !ds.data) continue;
                const v = ds.data[dataIndex];
                if (v !== null && v !== undefined) return true;
              }
            } catch (e) {
              return true;
            }
            return false;
          },
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += '₱' + context.parsed.y.toLocaleString();
              } else {
                return 'No data available';
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false,
            drawOnChartArea: false,
            // draw the bottom border line thicker
            drawBorder: true,
            borderColor: '#d1d5db',
            borderWidth: 2,
          },
          ticks: {
            color: '#6b7280',
            font: {
              size: 11,
            },
            autoSkip: false,
            maxRotation: 45,
            minRotation: 0,
          },
        },
        // Horizontal grid will be drawn by our plugin so disable built-in area drawing
        y: {
          display: false,
          beginAtZero: true,
          suggestedMax: (typeof yMax !== 'undefined') ? yMax : undefined,
          grid: {
            display: false,
            color: '#e5e7eb',
            drawBorder: false,
            drawOnChartArea: false,
            drawTicks: false,
            lineWidth: 0,
          },
          border: {
            display: false,
          },
          ticks: {
            display: false,
            stepSize: stepSize,
          }
        },
      },
      interaction: {
        mode: 'index',
        intersect: false,
      },
    },
  });
}


// Resize handler to recompute chart width on window resize
function updateChartWidth() {
  const chartInner = document.getElementById('chartInner');
  const canvas = document.getElementById('collectionChart');
  if (!chartInner || !canvas) return;
  const labels = monthlyData.map(d => d.month);
  const requiredWidth = Math.max(PX_PER_MONTH * labels.length, chartInner.parentElement.clientWidth || 700);
  chartInner.style.width = requiredWidth + 'px';
  canvas.style.width = requiredWidth + 'px';
  if (chartInstance) {
    chartInstance.resize();
  }
  // Keep the fixed y-axis canvas height in sync
  const yCanvas = document.getElementById('yAxisChart');
  if (yCanvas) {
    yCanvas.style.height = canvas.style.height || '400px';
    if (yAxisChart && typeof yAxisChart.resize === 'function') {
      try { yAxisChart.resize(); } catch (e) { /* ignore */ }
    }
  }
}


window.addEventListener('resize', () => {
  updateChartWidth();
  if (window.innerWidth >= 1024) {
    closeSidebarFunc();
  }
});


// Initialize chart on page load
initChart();

const currentUser = ensureLoggedIn();
if (currentUser) {
  if (typeof window.applyAdminTopbarIdentity === 'function') {
    window.applyAdminTopbarIdentity(currentUser);
  } else {
    const adminLabel = document.querySelector('.admin-label');
    if (adminLabel) {
      const firstName = currentUser.firstName || '';
      const lastName = currentUser.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      adminLabel.textContent = fullName || currentUser.userName || 'Admin Staff';
    }

    const adminRole = document.querySelector('.admin-role');
    if (adminRole) {
      const role = String(currentUser.userRole || currentUser.UserRole || '').trim();
      adminRole.textContent = /admin/i.test(role)
        ? 'Admin Account'
        : (role ? `${role} Account` : 'Admin Account');
    }

    const avatar = document.querySelector('.avatar');
    if (avatar) {
      const firstInitial = (currentUser.firstName || '').trim().charAt(0);
      const lastInitial = (currentUser.lastName || '').trim().charAt(0);
      const nameInitials = `${firstInitial}${lastInitial}`.toUpperCase();
      const userNameInitials = (currentUser.userName || '').trim().slice(0, 2).toUpperCase();
      const initials = nameInitials || userNameInitials;
      avatar.textContent = initials || 'AS';
    }
  }

  loadDashboardData().catch(error => {
    console.error('Failed to load dashboard data:', error);
    alert('Failed to load dashboard data from API. Check if the backend is running on http://localhost:5024.');
  });

  const waterDistributionViewMore = document.getElementById('waterDistributionViewMore');
  if (waterDistributionViewMore) {
    waterDistributionViewMore.addEventListener('click', () => {
      window.location.href = 'total-consumption-report';
    });
  }
}


// Enable dragging to scroll the chart horizontally (mouse and touch)
function enableChartScrollDrag() {
  const scroller = document.getElementById('chartScroll');
  if (!scroller) return;
  let isDown = false;
  let startX;
  let scrollLeft;


  scroller.addEventListener('mousedown', (e) => {
    isDown = true;
    scroller.classList.add('dragging');
    startX = e.pageX - scroller.offsetLeft;
    scrollLeft = scroller.scrollLeft;
    e.preventDefault();
  });


  scroller.addEventListener('mouseleave', () => {
    isDown = false;
    scroller.classList.remove('dragging');
  });


  scroller.addEventListener('mouseup', () => {
    isDown = false;
    scroller.classList.remove('dragging');
  });


  scroller.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    const x = e.pageX - scroller.offsetLeft;
    const walk = (x - startX) * 1; //scroll-fast
    scroller.scrollLeft = scrollLeft - walk;
  });


  // Touch support
  scroller.addEventListener('touchstart', (e) => {
    startX = e.touches[0].pageX - scroller.offsetLeft;
    scrollLeft = scroller.scrollLeft;
  }, { passive: true });


  scroller.addEventListener('touchmove', (e) => {
    const x = e.touches[0].pageX - scroller.offsetLeft;
    const walk = (x - startX) * 1;
    scroller.scrollLeft = scrollLeft - walk;
  }, { passive: true });
}


enableChartScrollDrag();


// Export modal functionality
exportBtn.addEventListener('click', () => {
  exportModal.classList.add('active');
});


closeModal.addEventListener('click', () => {
  exportModal.classList.remove('active');
});


cancelExport.addEventListener('click', () => {
  exportModal.classList.remove('active');
});


// Close modal when clicking outside
exportModal.addEventListener('click', (e) => {
  if (e.target === exportModal) {
    exportModal.classList.remove('active');
  }
});


// Quarter selection
const quarterOptions = document.querySelectorAll('.quarter-option');
quarterOptions.forEach(option => {
  option.addEventListener('click', () => {
    quarterOptions.forEach(opt => opt.classList.remove('selected'));
    option.classList.add('selected');
    option.querySelector('input[type="radio"]').checked = true;
  });
});


// Download PNG functionality
downloadPNG.addEventListener('click', async () => {
  const selectedQuarter = parseInt(document.querySelector('input[name="quarter"]:checked').value);
 
  // Disable button during export
  downloadPNG.disabled = true;
  downloadPNG.textContent = 'Downloading...';
 
  try {
    // Determine which months to show based on quarter
    const quarterMonths = {
      1: [0, 1, 2],    // Jan-Mar
      2: [3, 4, 5],    // Apr-Jun
      3: [6, 7, 8],    // Jul-Sep
      4: [9, 10, 11]   // Oct-Dec
    };
   
    const monthIndices = quarterMonths[selectedQuarter];
    const quarterData = monthIndices.map(i => monthlyData[i]);
    const quarterLabels = quarterData.map(d => d.month);
    const receivableData = quarterData.map(d => d.totalAccountReceivable);
    const collectionData = quarterData.map(d => d.collection);
    const balanceData = quarterData.map(d => d.balance);
   
    // Create a temporary canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 1200;
    tempCanvas.height = 700;
    const tempCtx = tempCanvas.getContext('2d');
   
    // Create white background plugin for export
    const whiteBgPlugin = {
      id: 'whiteBgPlugin',
      beforeDraw: (chart) => {
        const ctx = chart.ctx;
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();
      }
    };
   
    // Create temporary chart with quarter data
    const tempChart = new Chart(tempCtx, {
      type: 'bar',
      plugins: [ChartDataLabels, whiteBgPlugin],
      data: {
        labels: quarterLabels,
        datasets: [
          {
            label: 'Total Account Receivable',
            data: receivableData,
            backgroundColor: '#1e72d3ff',
            borderRadius: 4,
          },
          {
            label: 'Collection',
            data: collectionData,
            backgroundColor: '#3b82f6',
            borderRadius: 4,
          },
          {
            label: 'Balance',
            data: balanceData,
            backgroundColor: '#93c5fd',
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: false,
        animation: false,
        layout: {
          padding: { top: 20, left: 20, right: 20, bottom: 20 }
        },
        datasets: {
          bar: {
            categoryPercentage: 0.55,
            barPercentage: 0.80,
            maxBarThickness: 80,
          }
        },
        plugins: {
          datalabels: {
            color: '#08101fff',
            font: {
              size: 24,
              weight: '500',
              family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
            },
            anchor: 'start',
            align: 'end',
            offset: 4,
            rotation: -90,
            formatter: function(value, context) {
              if (value === null || value === undefined) {
                return '';
              }
              return value.toLocaleString();
            },
            display: function(context) {
              const value = toNumber(context.dataset.data[context.dataIndex]);
              return value > 0;
            }
          },
          legend: {
            display: true,
            position: 'top',
            align: 'center',
            labels: {
              color: '#374151',
              font: {
                size: 20,
                family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
              },
              padding: 15,
              usePointStyle: true,
              pointStyle: 'rect',
              boxWidth: 12,
              boxHeight: 12,
            }
          },
          title: {
            display: true,
            text: `Sales of Water - Q${selectedQuarter} ${currentYear}`,
            color: '#111827',
            font: {
              size: 26,
              weight: 'bold',
              family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
            },
            padding: {
              top: 15,
              bottom: 25
            }
          },
          tooltip: {
            enabled: false
          }
        },
        scales: {
          x: {
            grid: {
              display: false,
              drawBorder: true,
              borderColor: '#d1d5db',
              borderWidth: 2,
            },
            ticks: {
              color: '#6b7280',
              font: {
                size: 20,
              },
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: '#e5e7eb',
              drawBorder: false,
              lineWidth: 1,
            },
            ticks: {
              color: '#6b7280',
              font: {
                size: 20,
              },
              maxTicksLimit: 6,
              callback: function(value) {
                try {
                  const v = Number(value);
                  if (isNaN(v)) return value;
                  if (Math.abs(v) >= 1000) {
                    const scaled = v / 1000;
                    const formatted = scaled % 1 === 0 ? scaled.toLocaleString() : scaled.toLocaleString(undefined, { maximumFractionDigits: 1 });
                    return formatted + 'k';
                  }
                  return v.toString();
                } catch (e) {
                  return value;
                }
              }
            }
          },
        },
      },
    });
   
    // Wait for chart to render
    await new Promise(resolve => setTimeout(resolve, 500));
   
    // Get the chart as base64 image
    const chartImage = tempChart.toBase64Image('image/png', 1);
   
    // Download the image
    const link = document.createElement('a');
    link.download = `collection-chart-Q${selectedQuarter}-${currentYear}.png`;
    link.href = chartImage;
    link.click();
   
    // Clean up
    tempChart.destroy();
    exportModal.classList.remove('active');
   
  } catch (error) {
    console.error('Failed to export chart:', error);
    alert('Failed to export chart. Please try again.');
  } finally {
    downloadPNG.disabled = false;
    downloadPNG.textContent = 'Download PNG';
  }
});


// Distribution date is updated dynamically from latest billing month in loadDashboardData().


// Navigation click handlers (for demonstration)
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach((item, index) => {
  item.addEventListener('click', () => {
    navItems.forEach(nav => nav.classList.remove('active'));
    item.classList.add('active');
   
    // Close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
      closeSidebarFunc();
    }
  });
});


// Handle window resize
window.addEventListener('resize', () => {
  if (window.innerWidth >= 1024) {
    closeSidebarFunc();
  }
});




