const sidebar = document.getElementById('sidebar');
const mobileOverlay = document.getElementById('mobileOverlay');
const menuBtn = document.getElementById('menuBtn');
const closeSidebar = document.getElementById('closeSidebar');

let billingCache = [];
let concessionerCache = [];
let userCache = [];
let periodCache = [];
let tariffsCache = [];
let districtCache = [];
let filteredBilling = [];
let currentBillingPage = 1;
const savingRows = new Set();

const BILLING_PAGE_SIZE = 25;

/**
 * Show a notification message.
 * @param {string} message - The message to display
 * @param {string} type - 'success', 'error', or 'info'
 * @param {number} duration - Duration in milliseconds (default: 4000)
 */
function showNotification(message, type = 'info') {
  if (window.showNotification) {
    window.showNotification(message, type);
  } else {
    console.warn('showNotification not found on window, falling back to alert');
    alert(message);
  }
}

function validatePresentReading(rowData, rawValue) {
  const raw = String(rawValue || '').trim();
  if (!raw) {
    return {
      isValid: true,
      reading: 0,
      hasValue: false,
      message: '',
    };
  }

  const reading = Number(raw);
  if (!Number.isFinite(reading) || reading < 0) {
    return {
      isValid: false,
      reading: 0,
      hasValue: true,
      message: 'Present reading must be a valid non-negative number.',
    };
  }

  if (reading < toNumber(rowData?.previous, 0)) {
    return {
      isValid: false,
      reading,
      hasValue: true,
      message: 'Present reading must be greater than or equal to Previous reading.',
    };
  }

  return {
    isValid: true,
    reading,
    hasValue: true,
    message: '',
  };
}

function setReadingValidationState(input, validation) {
  if (!input) return;

  if (validation.isValid || !validation.hasValue) {
    input.classList.remove('is-invalid');
    input.removeAttribute('title');
    return;
  }

  input.classList.add('is-invalid');
  input.setAttribute('title', validation.message);
}

function setRowEditingState(input, isEditing) {
  if (!input) return;

  input.readOnly = !isEditing;
  input.classList.toggle('is-editing', isEditing);
}

function getRowDisplayValue(row) {
  const draftValue = String(row?.draftPresent ?? '').trim();
  if (draftValue !== '') return draftValue;

  if (toNumber(row?.present, 0) > 0) {
    return String(row.present);
  }

  return '';
}

function normalizeReadingValue(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';

  const numeric = Number(raw);
  return Number.isFinite(numeric) ? String(numeric) : raw;
}

function isRowSavable(row) {
  if (!row) return false;

  const draftValue = String(row.draftPresent ?? '').trim();
  if (!draftValue) return false;

  const validation = validatePresentReading(row, draftValue);
  if (!validation.isValid || !validation.hasValue) return false;

  if (row.hasExistingBilling) {
    return validation.reading !== toNumber(row.present, 0);
  }

  return true;
}

function getVisibleRows(rows) {
  const startIndex = (currentBillingPage - 1) * BILLING_PAGE_SIZE;
  return rows.slice(startIndex, startIndex + BILLING_PAGE_SIZE);
}

function getBillingPaginationMeta(rows) {
  const totalRecords = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / BILLING_PAGE_SIZE));
  const safePage = Math.min(Math.max(currentBillingPage, 1), totalPages);
  const startIndex = totalRecords === 0 ? 0 : (safePage - 1) * BILLING_PAGE_SIZE + 1;
  const endIndex = totalRecords === 0 ? 0 : Math.min(safePage * BILLING_PAGE_SIZE, totalRecords);

  return {
    totalRecords,
    totalPages,
    currentPage: safePage,
    startIndex,
    endIndex,
  };
}

function renderPaginationFooter(rows) {
  const meta = getBillingPaginationMeta(rows);

  if (!rows.length) {
    return '';
  }

  return `
    <div class="billing-pagination">
      <div class="billing-pagination-summary">
        Showing ${meta.startIndex} to ${meta.endIndex} of ${meta.totalRecords} records
      </div>
      <div class="billing-pagination-controls" aria-label="Billing pagination">
        <button class="billing-page-btn" data-role="prev-page" ${meta.currentPage <= 1 ? 'disabled' : ''} aria-label="Previous page">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <button class="billing-page-btn billing-page-btn-active" data-role="page-number" aria-current="page">
          ${meta.currentPage}
        </button>
        <button class="billing-page-btn" data-role="next-page" ${meta.currentPage >= meta.totalPages ? 'disabled' : ''} aria-label="Next page">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
    </div>
  `;
}

function renderPaginationHost(rows) {
  const host = document.querySelector('.billing-pagination-host');
  if (!host) return;

  host.innerHTML = renderPaginationFooter(rows);
}

function getFilledReadingCount() {
  let count = 0;
  filteredBilling.forEach((row) => {
    if (isRowSavable(row)) {
      count += 1;
    }
  });

  return count;
}

function updateSaveButtonCount() {
  const saveBtn = document.getElementById('saveReadingsBtn');
  if (!saveBtn) return;

  saveBtn.textContent = `Save All Readings (${getFilledReadingCount()})`;
}

async function persistRowReading(row, readingValue) {
  const api = getApi();
  const currentReading = toNumber(readingValue, 0);
  const billAmount = getTariffAmount(row.categoryId, Math.max(0, currentReading - row.previous));

  const payload = {
    billingId: row.billingId,
    concessionerID: row.concessionerId,
    userId: row.userId,
    periodId: row.periodId,
    prevReading: row.previous,
    currentReading,
    billAmount,
    penalty: row.penalty,
    billStatus: row.billStatus,
    createdAt: row.createdAt || new Date().toISOString(),
  };

  if (row.hasExistingBilling && row.billingId > 0) {
    await api.put('/Billing', payload);
    return;
  }

  await api.post('/Billing', {
    concessionerID: payload.concessionerID,
    userId: payload.userId,
    periodId: payload.periodId,
    prevReading: payload.prevReading,
    currentReading: payload.currentReading,
    billAmount: payload.billAmount,
    penalty: payload.penalty,
    billStatus: payload.billStatus,
    createdAt: new Date().toISOString(),
  });
}

async function saveReadingFromInput(input) {
  if (!input) return;

  const rowKey = toNumber(input.getAttribute('data-row-key'), 0);
  if (rowKey <= 0 || savingRows.has(rowKey)) return;

  const rowData = filteredBilling.find((row) => row.rowKey === rowKey);
  if (!rowData) return;

  const validation = validatePresentReading(rowData, input.value);
  setReadingValidationState(input, validation);

  if (!validation.hasValue) {
    if (rowData.hasExistingBilling && rowData.isEditing) {
      rowData.isEditing = false;
      rowData.draftPresent = '';
      renderBillingRows(filteredBilling);
    }
    return;
  }

  if (!validation.isValid) {
    showNotification(validation.message, 'error');
    return;
  }

  const normalizedInput = normalizeReadingValue(input.value);
  const normalizedSaved = normalizeReadingValue(rowData.present > 0 ? rowData.present : '');

  if (normalizedInput === normalizedSaved) {
    if (rowData.isEditing) {
      rowData.isEditing = false;
      rowData.draftPresent = '';
      renderBillingRows(filteredBilling);
    }
    return;
  }

  savingRows.add(rowKey);
  input.disabled = true;

  try {
    await persistRowReading(rowData, validation.reading);
    await loadBilling();
    showNotification('Reading saved successfully.', 'success', 2200);
  } catch (error) {
    console.error(error);
    showNotification(error.message || 'Failed to save billing reading.', 'error');
  } finally {
    savingRows.delete(rowKey);
  }
}

function getApi() {
  if (!window.AquentaApiClient) {
    throw new Error('API client is not loaded. Please include script/api-client.js');
  }
  return window.AquentaApiClient;
}

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

const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
  item.addEventListener('click', function () {
    navItems.forEach(nav => nav.classList.remove('active'));
    this.classList.add('active');
  });
});

function handleResponsiveMenu() {
  if (window.innerWidth >= 1024) closeSidebarFunc();
}
window.addEventListener('resize', handleResponsiveMenu);

const navLinks = document.querySelectorAll('.nav-item');
navLinks.forEach(link => {
  link.addEventListener('click', () => {
    if (window.innerWidth <= 1024) closeSidebarFunc();
  });
});

function pick(obj, keys, fallback = undefined) {
  for (const key of keys) {
    if (typeof obj?.[key] !== 'undefined' && obj[key] !== null) return obj[key];
  }
  return fallback;
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatPeso(value) {
  return `PHP ${toNumber(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getTariffAmount(categoryId, consumption) {
  const safeConsumption = toNumber(consumption, 0);
  if (safeConsumption <= 0) return 0;

  const category = toNumber(categoryId, 0);
  const rates = tariffsCache
    .filter((item) => toNumber(pick(item, ['categoryId', 'CategoryId'], 0), 0) === category)
    .map((item) => ({
      cubicMeter: toNumber(pick(item, ['cubicMeter', 'CubicMeter'], 0), 0),
      amount: toNumber(pick(item, ['amount', 'Amount'], 0), 0),
    }))
    .sort((a, b) => a.cubicMeter - b.cubicMeter);

  if (!rates.length) return 0;

  const exact = rates.find((rate) => rate.cubicMeter === safeConsumption);
  if (exact) return exact.amount;

  const nextBracket = rates.find((rate) => rate.cubicMeter >= safeConsumption);
  if (nextBracket) return nextBracket.amount;

  return rates[rates.length - 1].amount;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getConcessionerDisplayName(concessioner, user) {
  const lastName = String(pick(user, ['lastName', 'LastName'], '')).trim();
  const firstName = String(pick(user, ['firstName', 'FirstName'], '')).trim();

  if (lastName || firstName) {
    return `${lastName}${lastName && firstName ? ', ' : ''}${firstName}`;
  }

  const fallbackUserName = String(pick(user, ['userName', 'UserName'], '')).trim();
  return fallbackUserName || 'Unknown';
}

function getPeriodStart(period) {
  const value = pick(period, ['periodStart', 'PeriodStart'], null);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getPeriodEnd(period) {
  const value = pick(period, ['periodEnd', 'PeriodEnd'], null);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatPeriodLabel(period) {
  const start = getPeriodStart(period);
  if (!start) return `Period ${pick(period, ['periodId', 'PeriodId'], '')}`;

  return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getSelectedPeriodId() {
  const select = document.querySelector('.date-input');
  const id = toNumber(select?.value, 0);
  return id > 0 ? id : 0;
}

function ensureSelectedPeriod() {
  const select = document.querySelector('.date-input');
  if (!select) return;

  const currentId = toNumber(select.value, 0);
  if (currentId > 0) return;

  const sortedPeriods = [...periodCache].sort((a, b) => {
    const ad = getPeriodStart(a);
    const bd = getPeriodStart(b);
    if (!ad || !bd) return 0;
    return bd.getTime() - ad.getTime();
  });

  const latest = sortedPeriods[0];
  if (!latest) return;

  const latestId = toNumber(pick(latest, ['periodId', 'PeriodId'], 0), 0);
  if (latestId > 0) {
    select.value = String(latestId);
  }
}

function populatePeriodFilter() {
  const select = document.querySelector('.date-input');
  if (!select) return;

  const previousValue = select.value;
  const sorted = [...periodCache].sort((a, b) => {
    const ad = getPeriodStart(a);
    const bd = getPeriodStart(b);
    if (!ad || !bd) return 0;
    return bd.getTime() - ad.getTime();
  });

  const options = [];
  sorted.forEach((period) => {
    const periodId = toNumber(pick(period, ['periodId', 'PeriodId'], 0), 0);
    if (periodId <= 0) return;
    options.push(`<option value="${periodId}">${escapeHtml(formatPeriodLabel(period))}</option>`);
  });

  select.innerHTML = options.join('');
  if (previousValue && select.querySelector(`option[value="${previousValue}"]`)) {
    select.value = previousValue;
  }

  ensureSelectedPeriod();
}

function populateDistrictFilter() {
  const select = document.querySelector('.filter-select');
  if (!select) return;

  const previous = select.value;
  const districts = [...districtCache]
    .map((item) => ({
      id: toNumber(pick(item, ['districtId', 'DistrictId', 'districtID', 'DistrictID'], 0), 0),
      name: String(pick(item, ['districtName', 'DistrictName'], '')).trim(),
    }))
    .filter((item) => item.id > 0 && item.name)
    .sort((a, b) => a.id - b.id);

  const options = ['<option value="all">District: All</option>'];
  districts.forEach((district) => {
    options.push(`<option value="${escapeHtml(district.name)}">${escapeHtml(district.name)}</option>`);
  });

  select.innerHTML = options.join('');
  if (previous && select.querySelector(`option[value="${previous}"]`)) {
    select.value = previous;
  } else {
    select.value = 'all';
  }
}

function buildNormalizedRows() {
  const selectedPeriodId = getSelectedPeriodId();
  if (selectedPeriodId <= 0) return [];

  const userMap = new Map(
    userCache.map((item) => [
      toNumber(pick(item, ['userId', 'UserId', 'userID', 'UserID'], 0), 0),
      item,
    ]),
  );

  const periodOrder = new Map();
  [...periodCache]
    .sort((a, b) => {
      const ad = getPeriodStart(a);
      const bd = getPeriodStart(b);
      if (!ad || !bd) return 0;
      return ad.getTime() - bd.getTime();
    })
    .forEach((period, index) => {
      periodOrder.set(toNumber(pick(period, ['periodId', 'PeriodId'], 0), 0), index + 1);
    });

  const billingByConcessioner = new Map();
  billingCache.forEach((billing) => {
    const concessionerId = toNumber(pick(billing, ['concessionerID', 'ConcessionerID', 'concessionerId', 'ConcessionerId'], 0), 0);
    if (concessionerId <= 0) return;

    if (!billingByConcessioner.has(concessionerId)) {
      billingByConcessioner.set(concessionerId, []);
    }

    billingByConcessioner.get(concessionerId).push(billing);
  });

  const selectedOrder = periodOrder.get(selectedPeriodId) || 0;

  const rows = concessionerCache.map((concessioner) => {
    const concessionerId = toNumber(pick(concessioner, ['concessionerId', 'ConcessionerId', 'concessionerID', 'ConcessionerID'], 0), 0);
    const userId = toNumber(pick(concessioner, ['userId', 'UserId', 'userID', 'UserID'], 0), 0);
    const user = userMap.get(userId) || null;
    const billings = billingByConcessioner.get(concessionerId) || [];

    const selectedBilling = billings.find((billing) => {
      const periodId = toNumber(pick(billing, ['periodId', 'PeriodId', 'periodID', 'PeriodID'], 0), 0);
      return periodId === selectedPeriodId;
    }) || null;

    const previousBilling = billings
      .filter((billing) => {
        const periodId = toNumber(pick(billing, ['periodId', 'PeriodId', 'periodID', 'PeriodID'], 0), 0);
        const order = periodOrder.get(periodId) || 0;
        return order > 0 && order < selectedOrder;
      })
      .sort((a, b) => {
        const pa = toNumber(pick(a, ['periodId', 'PeriodId', 'periodID', 'PeriodID'], 0), 0);
        const pb = toNumber(pick(b, ['periodId', 'PeriodId', 'periodID', 'PeriodID'], 0), 0);
        return (periodOrder.get(pb) || 0) - (periodOrder.get(pa) || 0);
      })[0] || null;

    const previous = selectedBilling
      ? toNumber(pick(selectedBilling, ['prevReading', 'PrevReading'], 0), 0)
      : previousBilling
        ? toNumber(pick(previousBilling, ['currentReading', 'CurrentReading'], 0), 0)
        : 0;

    const present = selectedBilling
      ? toNumber(pick(selectedBilling, ['currentReading', 'CurrentReading'], 0), 0)
      : 0;

    const hasReading = present > 0;
    const amount = selectedBilling ? toNumber(pick(selectedBilling, ['billAmount', 'BillAmount'], 0), 0) : 0;

    return {
      rowKey: concessionerId,
      billingId: selectedBilling ? toNumber(pick(selectedBilling, ['billingId', 'BillingId', 'billingID', 'BillingID'], 0), 0) : 0,
      concessionerId,
      userId,
      categoryId: toNumber(pick(concessioner, ['categoryId', 'CategoryId'], 0), 0),
      periodId: selectedPeriodId,
      districtId: toNumber(pick(concessioner, ['districtId', 'DistrictId', 'districtID', 'DistrictID'], 0), 0),
      accountOrder: toNumber(pick(concessioner, ['accountOrder', 'AccountOrder'], 0), 0),
      accountNumber: String(pick(concessioner, ['accountNumber', 'AccountNumber'], '')).trim(),
      concessionerName: getConcessionerDisplayName(concessioner, user),
      previous,
      present,
      draftPresent: '',
      isEditing: false,
      consumption: hasReading ? Math.max(0, present - previous) : 0,
      amount,
      hasExistingBilling: !!selectedBilling,
      billStatus: selectedBilling ? String(pick(selectedBilling, ['billStatus', 'BillStatus'], 'Unpaid')) : 'Unpaid',
      penalty: selectedBilling ? toNumber(pick(selectedBilling, ['penalty', 'Penalty'], 0), 0) : 0,
      createdAt: selectedBilling ? pick(selectedBilling, ['createdAt', 'CreatedAt', 'billDate', 'BillDate'], new Date().toISOString()) : new Date().toISOString(),
    };
  });

  rows.sort((a, b) => a.concessionerId - b.concessionerId);

  return rows;
}

function renderBillingRows(rows) {
  const content = document.querySelector('.billing-content');
  if (!content) return;

  if (!rows.length) {
    content.classList.remove('has-table');
    content.innerHTML = `
      <div class="empty-state">
        <svg class="empty-state-icon" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <h3 class="empty-state-title">No records found</h3>
        <p class="empty-state-message">No concessioners found for the selected filters.</p>
      </div>
    `;
    renderPaginationHost(rows);
    updateSaveButtonCount();
    return;
  }

  const paginationRows = getVisibleRows(rows);

  const bodyRows = paginationRows.map((item) => {
    const displayValue = getRowDisplayValue(item);
    const initialValidation = validatePresentReading(item, displayValue);
    const hasReading = initialValidation.hasValue && initialValidation.isValid;
    const previewConsumption = hasReading ? Math.max(0, toNumber(displayValue, 0) - item.previous) : 0;
    const previewAmount = (item.hasExistingBilling && !item.isEditing)
      ? item.amount
      : (hasReading ? getTariffAmount(item.categoryId, previewConsumption) : 0);
    const account = escapeHtml(item.accountNumber || `#${item.concessionerId}`);
    const name = escapeHtml(item.concessionerName || 'Unknown');
    const presentValue = displayValue;
    const initialValue = normalizeReadingValue(presentValue);
    const consumptionText = hasReading ? String(previewConsumption) : '--';
    const amountText = hasReading ? formatPeso(previewAmount) : '--';
    const inputClassName = `reading-input${!initialValidation.isValid && initialValidation.hasValue ? ' is-invalid' : ''}`;
    const inputTitle = !initialValidation.isValid && initialValidation.hasValue
      ? 'Present reading must be greater than or equal to Previous reading.'
      : '';
    const readOnlyAttribute = item.hasExistingBilling && !item.isEditing ? 'readonly' : '';
    const savedRowClass = item.hasExistingBilling ? ' saved-row' : '';
    const actionsMarkup = item.hasExistingBilling
      ? `
          <button class="table-action-btn edit-btn" data-role="edit-reading" data-row-key="${item.rowKey}" title="Edit reading" aria-label="Edit reading">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"></path>
            </svg>
          </button>
          <button class="table-action-btn delete-btn" data-role="clear-reading" data-row-key="${item.rowKey}" title="Clear reading" aria-label="Clear reading">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6l-1 14H6L5 6"></path>
              <path d="M10 11v6"></path>
              <path d="M14 11v6"></path>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
            </svg>
          </button>
        `
      : '<span class="table-actions-empty">--</span>';

    return `
      <tr class="${savedRowClass}" data-row-key="${item.rowKey}">
        <td>${account}</td>
        <td>${name}</td>
        <td>
          <input
            type="number"
            class="${inputClassName}"
            data-role="current-reading"
            data-row-key="${item.rowKey}"
            data-initial-value="${initialValue}"
            value="${presentValue}"
            min="0"
            inputmode="numeric"
            ${readOnlyAttribute}
            title="${inputTitle}"
          />
        </td>
        <td>${item.previous}</td>
        <td data-role="consumption">${consumptionText}</td>
        <td data-role="amount">${amountText}</td>
        <td>
          <div class="table-actions">
            ${actionsMarkup}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  content.classList.add('has-table');
  content.innerHTML = `
    <div class="table-wrapper">
      <table class="billing-table">
        <thead>
          <tr>
            <th>Account #</th>
            <th>Concessioner</th>
            <th>Present</th>
            <th>Previous</th>
            <th>Consumption</th>
            <th>Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>
  `;
  renderPaginationHost(rows);
  updateSaveButtonCount();
}

function applyBillingFilters() {
  const searchInput = document.querySelector('.search-input');
  const districtSelect = document.querySelector('.filter-select');

  const search = String(searchInput?.value || '').trim().toLowerCase();
  const district = String(districtSelect?.value || 'all').trim().toLowerCase();

  const districtNameById = new Map(
    districtCache.map((item) => [
      toNumber(pick(item, ['districtId', 'DistrictId', 'districtID', 'DistrictID'], 0), 0),
      String(pick(item, ['districtName', 'DistrictName'], '')).trim().toLowerCase(),
    ]),
  );

  const allRows = buildNormalizedRows();

  filteredBilling = allRows.filter((item) => {
    const account = String(item.accountNumber || '').toLowerCase();
    const concessioner = String(item.concessionerName || '').toLowerCase();
    const itemDistrictId = toNumber(item.districtId, 0);
    const itemDistrictName = String(districtNameById.get(itemDistrictId) || '').trim().toLowerCase();

    const matchesSearch = !search || account.includes(search) || concessioner.includes(search);
    const matchesDistrict = district === 'all' || district === itemDistrictName;

    return matchesSearch && matchesDistrict;
  });

  currentBillingPage = 1;

  renderBillingRows(filteredBilling);
}

function setupFilterListeners() {
  const searchInput = document.querySelector('.search-input');
  const districtSelect = document.querySelector('.filter-select');
  const periodSelect = document.querySelector('.date-input');

  if (searchInput) searchInput.addEventListener('input', applyBillingFilters);
  if (districtSelect) districtSelect.addEventListener('change', applyBillingFilters);
  if (periodSelect) periodSelect.addEventListener('change', applyBillingFilters);
}

function setupTableRowActions() {
  const content = document.querySelector('.billing-content');
  if (!content) return;

  content.addEventListener('click', (event) => {
    const editBtn = event.target.closest('[data-role="edit-reading"]');
    if (editBtn) {
      const rowKey = editBtn.getAttribute('data-row-key');
      const rowData = filteredBilling.find((row) => row.rowKey === toNumber(rowKey, 0));
      const input = content.querySelector(`.reading-input[data-row-key="${rowKey}"]`);
      if (rowData && input) {
        rowData.isEditing = true;
        if (String(rowData.draftPresent ?? '').trim() === '') {
          rowData.draftPresent = String(rowData.present > 0 ? rowData.present : '');
        }
        renderBillingRows(filteredBilling);
        const reopenedInput = content.querySelector(`.reading-input[data-row-key="${rowKey}"]`);
        if (reopenedInput) {
          setRowEditingState(reopenedInput, true);
          reopenedInput.focus();
          reopenedInput.select();
        }
        showNotification('Editing enabled for this saved billing row.', 'info');
      }
      return;
    }

    const clearBtn = event.target.closest('[data-role="clear-reading"]');
    if (clearBtn) {
      const rowKey = clearBtn.getAttribute('data-row-key');
      const input = content.querySelector(`.reading-input[data-row-key="${rowKey}"]`);
      const rowData = filteredBilling.find((row) => row.rowKey === toNumber(rowKey, 0));
      if (rowData && input) {
        rowData.draftPresent = '';
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  });

  content.addEventListener('input', (event) => {
    const input = event.target.closest('.reading-input[data-role="current-reading"]');
    if (!input) return;

    const rowKey = toNumber(input.getAttribute('data-row-key'), 0);
    const rowData = filteredBilling.find((row) => row.rowKey === rowKey);
    if (!rowData) return;

    rowData.draftPresent = String(input.value || '').trim();

    const validation = validatePresentReading(rowData, input.value);
    setReadingValidationState(input, validation);

    const present = validation.reading;
    const canCompute = validation.hasValue && validation.isValid;
    const consumption = canCompute ? Math.max(0, present - rowData.previous) : 0;
    const computedAmount = canCompute ? getTariffAmount(rowData.categoryId, consumption) : 0;

    const row = input.closest('tr');
    if (!row) return;

    const consumptionCell = row.querySelector('[data-role="consumption"]');
    const amountCell = row.querySelector('[data-role="amount"]');
    const actionsWrap = row.querySelector('.table-actions');

    if (consumptionCell) {
      consumptionCell.textContent = canCompute ? String(consumption) : '--';
    }

    if (amountCell) {
      amountCell.textContent = canCompute ? formatPeso(computedAmount) : '--';
    }

    if (actionsWrap && rowData.hasExistingBilling) {
      actionsWrap.innerHTML = canCompute
        ? `
          <button class="table-action-btn edit-btn" data-role="edit-reading" data-row-key="${rowData.rowKey}" title="Edit reading" aria-label="Edit reading">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"></path>
            </svg>
          </button>
          <button class="table-action-btn delete-btn" data-role="clear-reading" data-row-key="${rowData.rowKey}" title="Clear reading" aria-label="Clear reading">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6l-1 14H6L5 6"></path>
              <path d="M10 11v6"></path>
              <path d="M14 11v6"></path>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
            </svg>
          </button>
        `
        : '<span class="table-actions-empty">--</span>';
    }

    updateSaveButtonCount();
  });

  content.addEventListener('keydown', (event) => {
    const input = event.target.closest('.reading-input[data-role="current-reading"]');
    if (!input || event.key !== 'Enter') return;

    event.preventDefault();
    setTimeout(() => input.blur(), 0);
  });

  content.addEventListener('blur', async (event) => {
    const input = event.target.closest('.reading-input[data-role="current-reading"]');
    if (!input) return;

    await saveReadingFromInput(input);
  }, true);
}

function setupPaginationActions() {
  const billingContainer = document.querySelector('.billing-container');
  if (!billingContainer) return;

  billingContainer.addEventListener('click', (event) => {
    const prevPageBtn = event.target.closest('[data-role="prev-page"]');
    if (prevPageBtn) {
      const meta = getBillingPaginationMeta(filteredBilling);
      if (meta.currentPage > 1) {
        currentBillingPage = meta.currentPage - 1;
        renderBillingRows(filteredBilling);
      }
      return;
    }

    const nextPageBtn = event.target.closest('[data-role="next-page"]');
    if (nextPageBtn) {
      const meta = getBillingPaginationMeta(filteredBilling);
      if (meta.currentPage < meta.totalPages) {
        currentBillingPage = meta.currentPage + 1;
        renderBillingRows(filteredBilling);
      }
    }
  });
}

function formatProgressPercent(value) {
  const rounded = Number(toNumber(value, 0).toFixed(2));
  return `${rounded}%`;
}

async function getBillingProgressByZone() {
  const selectedPeriodId = getSelectedPeriodId();
  if (selectedPeriodId <= 0) return [];

  const api = getApi();
  const result = await api.get(`/Report/billing-progress-by-zone?periodId=${selectedPeriodId}`);
  const zones = Array.isArray(result) ? result : [];

  return zones
    .filter((item) => toNumber(item.totalReadings ?? item.TotalReadings, 0) > 0)
    .sort((a, b) => toNumber(itemOrZero(a, ['districtId', 'DistrictId']), 0) - toNumber(itemOrZero(b, ['districtId', 'DistrictId']), 0))
    .map((item) => {
      const total = toNumber(item.totalReadings ?? item.TotalReadings, 0);
      const completed = toNumber(item.completedReadings ?? item.CompletedReadings, 0);
      const districtId = toNumber(item.districtId ?? item.DistrictId, 0);
      const districtName = String(item.districtName ?? item.DistrictName ?? '').trim();
      const percentage = total > 0 ? (completed / total) * 100 : 0;

      return {
        zoneLabel: districtName || `Zone ${districtId}`,
        completed,
        total,
        percentage,
      };
    });
}

function itemOrZero(item, keys) {
  return pick(item, keys, 0);
}

async function renderBillingProgressModal() {
  const progressGrid = document.getElementById('billingProgressGrid');
  if (!progressGrid) return;

  let zones = [];
  try {
    zones = await getBillingProgressByZone();
  } catch (error) {
    console.error(error);
    progressGrid.innerHTML = '<div class="billing-progress-empty">Unable to load billing progress.</div>';
    return;
  }

  if (!zones.length) {
    progressGrid.innerHTML = '<div class="billing-progress-empty">No billing data available for the selected period.</div>';
    return;
  }

  progressGrid.innerHTML = zones.map((zone) => {
    const widthValue = Math.max(zone.percentage, 0);

    return `
      <div class="billing-progress-item">
        <div class="billing-progress-item-head">
          <span class="billing-progress-zone">${escapeHtml(zone.zoneLabel)}</span>
          <span class="billing-progress-count">${zone.completed}/${zone.total} Readings</span>
        </div>
        <div class="billing-progress-track">
          <div class="billing-progress-fill" style="width: ${widthValue}%"></div>
        </div>
      </div>
    `;
  }).join('');
}

function toggleBillingProgressModal(show) {
  const modal = document.getElementById('billingProgressModal');
  if (!modal) return;

  modal.classList.toggle('show', show);
  modal.setAttribute('aria-hidden', show ? 'false' : 'true');
  document.body.style.overflow = show ? 'hidden' : '';
}

function setupBillingProgressModal() {
  const modal = document.getElementById('billingProgressModal');
  if (!modal) return;

  modal.addEventListener('click', (event) => {
    if (event.target.closest('[data-role="progress-modal-close"]')) {
      toggleBillingProgressModal(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('show')) {
      toggleBillingProgressModal(false);
    }
  });
}

function setupActionButtons() {
  const viewProgressBtn = document.getElementById('viewProgressBtn');

  if (viewProgressBtn) {
    viewProgressBtn.addEventListener('click', async () => {
      await renderBillingProgressModal();
      toggleBillingProgressModal(true);
    });
  }
}

function setupPrintButton() {
  function getSelectedPeriodLabel() {
    const select = document.querySelector('.date-input');
    if (!select) return '';

    const selectedOption = select.options?.[select.selectedIndex];
    return String(selectedOption?.textContent || '').trim();
  }

  function buildBlankReadingRows(rowCount = 25) {
    const selectedPeriodId = getSelectedPeriodId();

    const periodOrder = new Map();
    [...periodCache]
      .sort((a, b) => {
        const ad = getPeriodStart(a);
        const bd = getPeriodStart(b);
        if (!ad || !bd) return 0;
        return ad.getTime() - bd.getTime();
      })
      .forEach((period, index) => {
        periodOrder.set(toNumber(pick(period, ['periodId', 'PeriodId'], 0), 0), index + 1);
      });

    const selectedOrder = periodOrder.get(selectedPeriodId) || 0;

    const billingByConcessioner = new Map();
    billingCache.forEach((billing) => {
      const concessionerId = toNumber(pick(billing, ['concessionerID', 'ConcessionerID', 'concessionerId', 'ConcessionerId'], 0), 0);
      if (concessionerId <= 0) return;

      if (!billingByConcessioner.has(concessionerId)) {
        billingByConcessioner.set(concessionerId, []);
      }

      billingByConcessioner.get(concessionerId).push(billing);
    });

    const userMap = new Map(
      userCache.map((item) => [
        toNumber(pick(item, ['userId', 'UserId', 'userID', 'UserID'], 0), 0),
        item,
      ]),
    );

    const activeConcessioners = concessionerCache
      .filter((item) => {
        const status = String(pick(item, ['status', 'Status'], '')).trim().toLowerCase();
        return status === '' || status === 'active';
      })
      .sort((a, b) => {
        const districtA = toNumber(pick(a, ['districtId', 'DistrictId', 'districtID', 'DistrictID'], 0), 0);
        const districtB = toNumber(pick(b, ['districtId', 'DistrictId', 'districtID', 'DistrictID'], 0), 0);
        if (districtA !== districtB) return districtA - districtB;

        const orderA = toNumber(pick(a, ['accountOrder', 'AccountOrder'], 0), 0);
        const orderB = toNumber(pick(b, ['accountOrder', 'AccountOrder'], 0), 0);
        if (orderA !== orderB) return orderA - orderB;

        const accountA = String(pick(a, ['accountNumber', 'AccountNumber'], ''));
        const accountB = String(pick(b, ['accountNumber', 'AccountNumber'], ''));
        return accountA.localeCompare(accountB, undefined, { numeric: true, sensitivity: 'base' });
      });

    const rows = [];
    for (let index = 1; index <= rowCount; index += 1) {
      const concessioner = activeConcessioners[index - 1];
      const userId = toNumber(pick(concessioner, ['userId', 'UserId', 'userID', 'UserID'], 0), 0);
      const user = userMap.get(userId) || null;
      const name = concessioner ? getConcessionerDisplayName(concessioner, user) : '';
      const meterNumber = concessioner ? pick(concessioner, ['meterNumber', 'MeterNumber'], '') : '';

      const concessionerId = toNumber(pick(concessioner, ['concessionerId', 'ConcessionerId', 'concessionerID', 'ConcessionerID'], 0), 0);
      const billings = billingByConcessioner.get(concessionerId) || [];
      const selectedBilling = billings.find((billing) => {
        const periodId = toNumber(pick(billing, ['periodId', 'PeriodId', 'periodID', 'PeriodID'], 0), 0);
        return periodId === selectedPeriodId;
      }) || null;
      const previousBilling = billings
        .filter((billing) => {
          const periodId = toNumber(pick(billing, ['periodId', 'PeriodId', 'periodID', 'PeriodID'], 0), 0);
          const order = periodOrder.get(periodId) || 0;
          return order > 0 && order < selectedOrder;
        })
        .sort((a, b) => {
          const pa = toNumber(pick(a, ['periodId', 'PeriodId', 'periodID', 'PeriodID'], 0), 0);
          const pb = toNumber(pick(b, ['periodId', 'PeriodId', 'periodID', 'PeriodID'], 0), 0);
          return (periodOrder.get(pb) || 0) - (periodOrder.get(pa) || 0);
        })[0] || null;

      const previousReading = selectedBilling
        ? toNumber(pick(selectedBilling, ['prevReading', 'PrevReading'], 0), 0)
        : previousBilling
          ? toNumber(pick(previousBilling, ['currentReading', 'CurrentReading'], 0), 0)
          : '';

      const previousText = String(previousReading) === '' ? '&nbsp;' : escapeHtml(String(previousReading));
      const meterText = meterNumber ? escapeHtml(String(meterNumber)) : '&nbsp;';

      rows.push(`
        <tr>
          <td class="center">${index}</td>
          <td>${name ? escapeHtml(name) : '&nbsp;'}</td>
          <td class="center meter-cell">${meterText}</td>
          <td>&nbsp;</td>
          <td class="center">${previousText}</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
        </tr>
      `);
    }

    return rows.join('');
  }

  function buildReadingSheetHtml() {
    const selectedPeriodId = getSelectedPeriodId();
    const period = periodCache.find((item) => toNumber(pick(item, ['periodId', 'PeriodId'], 0), 0) === selectedPeriodId) || null;

    function padDay(day) {
      return String(day).padStart(2, '0');
    }

    function monthName(value) {
      return value.toLocaleDateString('en-US', { month: 'long' });
    }

    function buildPeriodRangeLabel() {
      if (!period) {
        const periodLabel = getSelectedPeriodLabel();
        return periodLabel ? `PERIOD COVERED: ${periodLabel}` : 'PERIOD COVERED:';
      }

      const start = getPeriodStart(period);
      const end = getPeriodEnd(period);
      if (!start || !end) {
        const periodLabel = getSelectedPeriodLabel();
        return periodLabel ? `PERIOD COVERED: ${periodLabel}` : 'PERIOD COVERED:';
      }

      const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
      if (sameMonth) {
        return `PERIOD COVERED: ${monthName(start)} ${padDay(start.getDate())} - ${padDay(end.getDate())}, ${start.getFullYear()}`;
      }

      return `PERIOD COVERED: ${monthName(start)} ${padDay(start.getDate())}, ${start.getFullYear()} - ${monthName(end)} ${padDay(end.getDate())}, ${end.getFullYear()}`;
    }

    const periodText = buildPeriodRangeLabel();

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Reading Sheet</title>
        <style>
          @page {
            size: 8.5in 11in;
            margin: 14mm;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            color: #111;
            font-family: "Arial Narrow", Arial, "Helvetica Neue", sans-serif;
            font-size: 10px;
          }

          .sheet {
            width: 186mm;
            margin: 0 auto;
          }

          .sheet-org-row {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
            margin-bottom: 0;
          }

          .sheet-logo {
            width: 54px;
            height: 54px;
            object-fit: contain;
          }

          .sheet-title-wrap {
            text-align: center;
          }

          .sheet-org {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 4px;
            letter-spacing: 0.2px;
          }

          .sheet-org-sub {
            font-size: 10px;
            margin-bottom: 0;
          }

          .sheet-main-title {
            font-size: 22px;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-align: center;
            margin-top: 14px;
            margin-bottom: 12px;
          }

          .sheet-meta {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            font-size: 11px;
            font-weight: 600;
            margin-bottom: 10px;
          }

          .sheet-period {
            text-align: right;
          }

          .sheet-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            border: 1px solid #222;
          }

          .sheet-table th,
          .sheet-table td {
            border: 0.8px solid #2b2b2b;
            padding: 4px 4px;
            font-size: 10.6px;
            line-height: 1.1;
            vertical-align: middle;
            height: 26px;
          }

          .sheet-table th {
            background: #e2e2e2;
            font-weight: 700;
            text-transform: uppercase;
          }

          .sheet-table .center {
            text-align: center;
          }

          .sheet-table .right {
            text-align: right;
          }

          .meter-cell {
            white-space: normal;
            line-height: 1.05;
          }

          .w-no { width: 5%; }
          .w-name { width: 25%; }
          .w-meter { width: 14%; }
          .w-reading { width: 9%; }
          .w-consumption { width: 13%; }
          .w-amount { width: 11%; }
          .w-remark { width: 14%; }

          @media print {
            .sheet {
              break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="sheet-org-row">
            <img src="/assets/images/Aquenta_logo.png" alt="Aquenta Logo" class="sheet-logo" />
            <div class="sheet-title-wrap">
              <div class="sheet-org">St. Joseph Stb. Multi-Purpose Cooperative</div>
              <div class="sheet-org-sub">Brgy. San Jose, Sto Tomas City, Batangas</div>
            </div>
          </div>

          <div class="sheet-main-title">READING SHEET</div>

          <div class="sheet-meta">
            <div class="sheet-period">${periodText}</div>
          </div>

          <table class="sheet-table">
            <thead>
              <tr>
                <th rowspan="2" class="center w-no">No</th>
                <th rowspan="2" class="center w-name">Concessioner</th>
                <th rowspan="2" class="center w-meter">Meter<br>Number</th>
                <th colspan="2" class="center">Reading</th>
                <th rowspan="2" class="center w-consumption">Total Consumption</th>
                <th rowspan="2" class="center w-amount">Amount</th>
                <th rowspan="2" class="center w-remark">Remark</th>
              </tr>
              <tr>
                <th class="center w-reading">Present</th>
                <th class="center w-reading">Previous</th>
              </tr>
            </thead>
            <tbody>
              ${buildBlankReadingRows(25)}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;
  }

  const printBtn = document.querySelector('.print-btn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      const existingFrame = document.getElementById('readingSheetPrintFrame');
      if (existingFrame) {
        existingFrame.remove();
      }

      const frame = document.createElement('iframe');
      frame.id = 'readingSheetPrintFrame';
      frame.style.position = 'fixed';
      frame.style.right = '0';
      frame.style.bottom = '0';
      frame.style.width = '0';
      frame.style.height = '0';
      frame.style.border = '0';
      frame.style.visibility = 'hidden';
      document.body.appendChild(frame);

      const doc = frame.contentWindow?.document;
      if (!doc || !frame.contentWindow) {
        showNotification('Unable to open print preview.', 'error');
        return;
      }

      doc.open();
      doc.write(buildReadingSheetHtml());
      doc.close();

      frame.onload = () => {
        frame.contentWindow.focus();
        frame.contentWindow.print();
      };
    });
  }
}

async function loadBilling() {
  const loadingOverlay = document.getElementById('billingTableLoading');
  if (loadingOverlay) loadingOverlay.classList.add('active');

  const api = getApi();
  try {
    const [billing, concessioners, users, periods, tariffs, activeVersionResult] = await Promise.all([
      api.get('/Billing'),
      api.get('/Concessioner/active'),
      api.get('/User'),
      api.get('/Period'),
      api.get('/Tariffs/active'),
      api.get('/TariffVersion/active'),
    ]);

    let districts = [];
    try {
      districts = await api.get('/District');
    } catch (error) {
      console.warn('Failed to load districts for billing filter:', error);
      showNotification('District filter options could not be fully loaded.', 'info');
    }

    billingCache = Array.isArray(billing) ? billing : [];
    concessionerCache = Array.isArray(concessioners) ? concessioners : [];
    userCache = Array.isArray(users) ? users : [];
    periodCache = Array.isArray(periods) ? periods : [];
    tariffsCache = Array.isArray(tariffs) ? tariffs : [];
    districtCache = Array.isArray(districts) ? districts : [];

    const versionNameEl = document.getElementById('activeVersionName');
    if (versionNameEl && activeVersionResult) {
      versionNameEl.textContent = activeVersionResult.versionName || activeVersionResult.VersionName || 'Active';
    }

    currentBillingPage = 1;

    populateDistrictFilter();
    populatePeriodFilter();
    applyBillingFilters();
  } finally {
    if (loadingOverlay) loadingOverlay.classList.remove('active');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  setupFilterListeners();
  setupTableRowActions();
  setupPaginationActions();
  setupBillingProgressModal();
  setupActionButtons();
  setupPrintButton();

  try {
    await loadBilling();
  } catch (error) {
    console.error(error);
    showNotification('Failed to load billing data from API.', 'error');
  }
});
