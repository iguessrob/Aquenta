const sidebar = document.getElementById('sidebar');
const mobileOverlay = document.getElementById('mobileOverlay');
const menuBtn = document.getElementById('menuBtn');
const closeSidebar = document.getElementById('closeSidebar');

let paymentCache = [];
let billingCache = [];
let concessionerCache = [];
let userCache = [];
let periodCache = [];
let filteredPaymentRows = [];
let currentPaymentPage = 1;

const PAYMENT_PAGE_SIZE = 25;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function pick(obj, keys, fallback = undefined) {
  for (const key of keys) {
    if (typeof obj?.[key] !== 'undefined' && obj[key] !== null) {
      return obj[key];
    }
  }

  return fallback;
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getApi() {
  if (!window.AquentaApiClient) {
    throw new Error('API client is not loaded. Please include script/api-client.js');
  }

  return window.AquentaApiClient;
}

function showNotification(message, type = 'error') {
  if (window.showNotification) {
    window.showNotification(message, type);
  } else {
    alert(message);
  }
}

function formatPeso(value) {
  const num = toNumber(value);
  if (num <= 0) return '--';
  return `₱ ${num.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateTime(value) {
  const date = new Date(value || 0);
  if (Number.isNaN(date.getTime())) return '--';

  return date.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getPeriodStart(period) {
  const val = pick(period, ['periodStart', 'PeriodStart'], null);
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getPeriodEnd(period) {
  const val = pick(period, ['periodEnd', 'PeriodEnd'], null);
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatPeriodOption(period) {
  const start = getPeriodStart(period);
  if (!start) return `Period ${pick(period, ['periodId', 'PeriodId'], '')}`;
  return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}


function formatPeriodCover(period) {
  if (!period) return '--';

  const start = getPeriodStart(period);
  const end = getPeriodEnd(period);
  if (!start || !end) return '--';

  const toShort = (d) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${month}/${day}/${year}`;
  };

  return `${toShort(start)} - ${toShort(end)}`;
}

function getConcessionerDisplayName(concessioner, user) {
  const lastName = String(pick(user, ['lastName', 'LastName'], '')).trim();
  const firstName = String(pick(user, ['firstName', 'FirstName'], '')).trim();

  if (lastName || firstName) {
    return `${lastName}${lastName && firstName ? ', ' : ''}${firstName}`;
  }

  return String(pick(user, ['userName', 'UserName'], '')).trim() || '--';
}

function deriveStatus(amountPaid, totalDue) {
  if (amountPaid >= totalDue && totalDue > 0) return 'paid';
  if (amountPaid > 0 && amountPaid < totalDue) return 'partial';
  return 'unpaid';
}

function normalizeBillStatus(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function getStatusClassName(status) {
  return String(status || 'unknown')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}

function validateAmountPaidInput(rawValue) {
  const text = String(rawValue ?? '').trim();

  if (!text) {
    return {
      hasValue: false,
      isValid: false,
      value: 0,
      message: 'Amount Paid is required.',
    };
  }

  const value = Number(text);
  if (!Number.isFinite(value) || value < 0) {
    return {
      hasValue: true,
      isValid: false,
      value: 0,
      message: 'Amount Paid must be a valid non-negative number.',
    };
  }

  return {
    hasValue: true,
    isValid: true,
    value,
    message: '',
  };
}

function getPaymentCacheEntry(billingId) {
  const normalizedId = toNumber(billingId, 0);
  return paymentCache.find((payment) => toNumber(pick(payment, ['billingId', 'BillingId'], 0), 0) === normalizedId) || null;
}

function getRenderedPaymentRow(billingId) {
  const normalizedId = toNumber(billingId, 0);
  return filteredPaymentRows.find((row) => toNumber(row?.billingId, 0) === normalizedId) || null;
}

function getConcessionerIdForPayment(payment) {
  // Try to get concessionerID directly from the payment
  const directId = toNumber(pick(payment, ['concessionerId', 'ConcessionerId', 'concessionerID', 'ConcessionerID'], 0), 0);
  if (directId > 0) return directId;

  // Look it up via the linked billing
  const billingId = toNumber(pick(payment, ['billingId', 'BillingId', 'billingID', 'BillingID'], 0), 0);
  if (billingId <= 0) return 0;

  const billing = billingCache.find((b) =>
    toNumber(pick(b, ['billingId', 'BillingId', 'billingID', 'BillingID'], 0), 0) === billingId
  );
  return toNumber(pick(billing, ['concessionerId', 'ConcessionerId', 'concessionerID', 'ConcessionerID'], 0), 0);
}

function setPaymentRowEditState(billingId, isEditing) {
  const payment = getPaymentCacheEntry(billingId);
  if (!payment) return null;

  const currentAmountPaid = toNumber(pick(payment, ['amountPaid', 'AmountPaid'], 0), 0);
  payment.isEditing = isEditing;
  payment.IsEditing = isEditing;
  payment.draftAmountPaid = isEditing
    ? String(pick(payment, ['draftAmountPaid', 'DraftAmountPaid'], '') || currentAmountPaid)
    : '';
  payment.DraftAmountPaid = payment.draftAmountPaid;

  return payment;
}

function updatePaymentCacheAmountPaid(billingId, amountPaid) {
  const payment = getPaymentCacheEntry(billingId);
  if (!payment) return;

  payment.amountPaid = amountPaid;
  payment.AmountPaid = amountPaid;
  payment.draftAmountPaid = '';
  payment.DraftAmountPaid = '';
  payment.isEditing = false;
  payment.IsEditing = false;
}

function getPaymentRowDraftAmount(row) {
  const draft = String(row?.draftAmountPaid ?? row?.DraftAmountPaid ?? '').trim();
  if (draft !== '') return draft;
  return String(toNumber(row?.amountPaid ?? row?.AmountPaid ?? 0, 0));
}

function getPaymentRowBalance(row, amountPaidValue) {
  return Math.max(0, toNumber(row.total, 0) - toNumber(amountPaidValue, 0));
}

function setPaymentAmountInputState(input, validation, isEditing) {
  if (!input) return;

  input.classList.toggle('is-editing', !!isEditing);
  input.classList.toggle('is-invalid', !!validation && !validation.isValid && validation.hasValue);
  input.title = !validation.isValid && validation.hasValue
    ? validation.message
    : isEditing
      ? 'Update the amount paid and click Save.'
      : 'Click Edit to modify amount paid.';
}

function buildPaymentActionButtons(row) {
  const billingId = row.billingId;
  return `
    <button class="payment-action-btn edit-btn" data-role="edit-payment" data-billing-id="${billingId}" title="Edit amount paid" aria-label="Edit amount paid">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 20h9"></path>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"></path>
      </svg>
    </button>
    <button class="payment-action-btn delete-btn" data-role="clear-payment" data-billing-id="${billingId}" title="Clear amount paid" aria-label="Clear amount paid">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6l-1 14H6L5 6"></path>
        <path d="M10 11v6"></path>
        <path d="M14 11v6"></path>
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
      </svg>
    </button>
  `;
}

function isPaymentDraftChanged(payment) {
  const validation = validateAmountPaidInput(getPaymentRowDraftAmount(payment));
  if (!validation.isValid) return false;
  return validation.value !== toNumber(pick(payment, ['amountPaid', 'AmountPaid'], 0), 0);
}

function getPaymentPaginationMeta(rows) {
  const totalRecords = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAYMENT_PAGE_SIZE));
  const safePage = Math.min(Math.max(currentPaymentPage, 1), totalPages);
  const startIndex = totalRecords === 0 ? 0 : (safePage - 1) * PAYMENT_PAGE_SIZE + 1;
  const endIndex = totalRecords === 0 ? 0 : Math.min(safePage * PAYMENT_PAGE_SIZE, totalRecords);

  return {
    totalRecords,
    totalPages,
    currentPage: safePage,
    startIndex,
    endIndex,
  };
}

function renderPaginationFooter(rows) {
  const meta = getPaymentPaginationMeta(rows);
  if (!rows.length) return '';

  return `
    <div class="payment-pagination">
      <div class="payment-pagination-summary">
        Showing ${meta.startIndex} to ${meta.endIndex} of ${meta.totalRecords} records
      </div>
      <div class="payment-pagination-controls" aria-label="Payment pagination">
        <button class="payment-page-btn" data-role="prev-page" ${meta.currentPage <= 1 ? 'disabled' : ''} aria-label="Previous page">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <button class="payment-page-btn payment-page-btn-active" data-role="page-number" aria-current="page">
          ${meta.currentPage}
        </button>
        <button class="payment-page-btn" data-role="next-page" ${meta.currentPage >= meta.totalPages ? 'disabled' : ''} aria-label="Next page">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
    </div>
  `;
}

function renderPaginationHost(rows) {
  const host = document.querySelector('.payment-pagination-host');
  if (!host) return;

  host.innerHTML = renderPaginationFooter(rows);
}

function buildPaymentRows(periodFilter = 0) {
  const periodMap = new Map(periodCache.map((period) => [toNumber(pick(period, ['periodId', 'PeriodId'], 0), 0), period]));
  const userMap = new Map(userCache.map((user) => [toNumber(pick(user, ['userId', 'UserId', 'userID', 'UserID'], 0), 0), user]));
  const selectedPeriodId = periodFilter > 0 ? periodFilter : toNumber(document.getElementById('paymentPeriodFilter')?.value, 0);

  // Map billings by concessioner and period
  const billingByConcessionerAndPeriod = new Map();
  billingCache.forEach((b) => {
    const cid = toNumber(pick(b, ['concessionerID', 'ConcessionerID', 'concessionerId', 'ConcessionerId'], 0), 0);
    const pid = toNumber(pick(b, ['periodId', 'PeriodId', 'periodID', 'PeriodID'], 0), 0);
    if (!billingByConcessionerAndPeriod.has(cid)) billingByConcessionerAndPeriod.set(cid, new Map());
    billingByConcessionerAndPeriod.get(cid).set(pid, b);
  });

  // Map payments by billing
  const paymentByBilling = new Map();
  paymentCache.forEach((p) => {
    const bid = toNumber(pick(p, ['billingId', 'BillingId', 'billingID', 'BillingID'], 0), 0);
    paymentByBilling.set(bid, p);
  });

  return concessionerCache
    .filter(c => {
      const status = String(pick(c, ['status', 'Status'], '')).trim().toLowerCase();
      return status === '' || status === 'active';
    })
    .map((concessioner) => {
      const concessionerId = toNumber(pick(concessioner, ['concessionerId', 'ConcessionerId', 'concessionerID', 'ConcessionerID'], 0), 0);
      const userId = toNumber(pick(concessioner, ['userId', 'UserId', 'userID', 'UserID'], 0), 0);
      const user = userMap.get(userId) || null;

      // Find billing for selected period (or latest if none selected)
      let targetPeriodId = selectedPeriodId;
      if (targetPeriodId <= 0) {
        // Fallback to latest period in cache
        const sortedPeriods = [...periodCache].sort((a, b) => (getPeriodStart(b)?.getTime() || 0) - (getPeriodStart(a)?.getTime() || 0));
        targetPeriodId = sortedPeriods[0] ? toNumber(pick(sortedPeriods[0], ['periodId', 'PeriodId'], 0), 0) : 0;
      }

      const billing = (billingByConcessionerAndPeriod.get(concessionerId) || new Map()).get(targetPeriodId) || null;
      const billingId = billing ? toNumber(pick(billing, ['billingId', 'BillingId', 'billingID', 'BillingID'], 0), 0) : 0;
      const payment = billingId > 0 ? paymentByBilling.get(billingId) : null;
      const period = periodMap.get(targetPeriodId) || null;

      const amount = billing ? toNumber(pick(billing, ['billAmount', 'BillAmount'], 0), 0) : 0;
      const arrears = billing ? toNumber(pick(billing, ['arrears', 'Arrears'], 0), 0) : 0;
      const lpRf = billing ? toNumber(pick(billing, ['lpRf', 'LpRf', 'lpRF', 'LPRF', 'penalty', 'Penalty'], 0), 0) : 0;
      const total = amount + arrears + lpRf;

      const amountPaid = payment ? toNumber(pick(payment, ['amountPaid', 'AmountPaid'], 0), 0) : 0;
      const balance = Math.max(0, total - amountPaid);
      const status = billing ? normalizeBillStatus(pick(billing, ['billStatus', 'BillStatus'], deriveStatus(amountPaid, total))) : 'unpaid';
      const isEditing = payment ? Boolean(pick(payment, ['isEditing', 'IsEditing'], false)) : false;
      const draftAmountPaid = payment ? pick(payment, ['draftAmountPaid', 'DraftAmountPaid'], '') : '';

      return {
        paymentId: payment ? toNumber(pick(payment, ['paymentId', 'PaymentId'], 0), 0) : 0,
        billingId,
        datePaid: payment ? pick(payment, ['datePaid', 'DatePaid'], null) : null,
        accountNumber: String(pick(concessioner, ['accountNumber', 'AccountNumber'], '--')).trim() || '--',
        name: getConcessionerDisplayName(concessioner, user),
        periodId: targetPeriodId,
        periodCover: formatPeriodCover(period),
        amount,
        arrears,
        lpRf,
        total,
        amountPaid,
        draftAmountPaid,
        isEditing,
        balance,
        districtId: toNumber(pick(concessioner, ['districtId', 'DistrictId', 'districtID', 'DistrictID'], 0), 0),
        accountOrder: toNumber(pick(concessioner, ['accountOrder', 'AccountOrder'], 0), 0),
        status,
      };
    })
    .sort((a, b) => {
      if (a.districtId !== b.districtId) {
        return a.districtId - b.districtId;
      }
      if (a.accountOrder !== b.accountOrder) {
        return a.accountOrder - b.accountOrder;
      }
      return String(a.accountNumber).localeCompare(String(b.accountNumber), undefined, { numeric: true, sensitivity: 'base' });
    });
}

function populatePeriodFilter() {
  const select = document.getElementById('paymentPeriodFilter');
  if (!select) return;

  const current = select.value;
  const sorted = [...periodCache].sort((a, b) => {
    const ad = getPeriodStart(a);
    const bd = getPeriodStart(b);
    if (!ad || !bd) return 0;
    return bd.getTime() - ad.getTime();
  });

  select.innerHTML = sorted
    .map((period) => {
      const id = toNumber(pick(period, ['periodId', 'PeriodId'], 0), 0);
      if (id <= 0) return '';
      return `<option value="${id}">${formatPeriodOption(period)}</option>`;
    })
    .join('');

  if (current && select.querySelector(`option[value="${current}"]`)) {
    select.value = current;
  }
}


function renderRows() {
  const tbody = document.getElementById('paymentRows');
  if (!tbody) return;

  const search = String(document.getElementById('paymentSearch')?.value || '').trim().toLowerCase();
  const periodFilter = toNumber(document.getElementById('paymentPeriodFilter')?.value, 0);
  const statusFilter = String(document.getElementById('paymentStatusFilter')?.value || 'all').trim().toLowerCase();

  const rows = buildPaymentRows(periodFilter).filter((row) => {
    const matchesSearch = !search
      || String(row.name).toLowerCase().includes(search)
      || String(row.accountNumber).toLowerCase().includes(search);

    const matchesStatus = statusFilter === 'all' || row.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  filteredPaymentRows = rows;
  const meta = getPaymentPaginationMeta(rows);
  currentPaymentPage = meta.currentPage;
  const pageRows = rows.slice((meta.currentPage - 1) * PAYMENT_PAGE_SIZE, meta.currentPage * PAYMENT_PAGE_SIZE);

  if (!pageRows.length) {
    tbody.innerHTML = '<tr><td colspan="12" class="empty-cell">No payment records found.</td></tr>';
    renderPaginationHost(rows);
    return;
  }

  tbody.innerHTML = pageRows.map((row) => `
    <tr class="${row.isEditing ? 'editing-row' : row.amountPaid > 0 ? 'saved-row' : ''}" data-row-key="${row.billingId}">
      <td>${row.datePaid ? escapeHtml(formatDateTime(row.datePaid)) : '--'}</td>
      <td>${escapeHtml(row.accountNumber || '--')}</td>
      <td>${escapeHtml(row.name || '--')}</td>
      <td>${escapeHtml(row.periodCover || '--')}</td>
      <td>${escapeHtml(formatPeso(row.amount))}</td>
      <td>${escapeHtml(formatPeso(row.arrears))}</td>
      <td>${escapeHtml(formatPeso(row.lpRf))}</td>
      <td>${escapeHtml(formatPeso(row.total))}</td>
      <td>
        <input
          type="number"
          class="payment-amount-input${row.isEditing ? ' is-editing' : ''}"
          data-role="amount-paid"
          data-billing-id="${row.billingId}"
          value="${escapeHtml(getPaymentRowDraftAmount(row))}"
          min="0"
          step="0.01"
          inputmode="decimal"
          ${row.isEditing ? '' : 'readonly'}
        />
      </td>
      <td data-role="payment-balance">${escapeHtml(formatPeso(row.balance))}</td>
      <td><span class="status-pill ${escapeHtml(getStatusClassName(row.status))}">${escapeHtml(String(row.status || '--').toUpperCase())}</span></td>
      <td>
        <div class="payment-actions">
          ${buildPaymentActionButtons(row)}
        </div>
      </td>
    </tr>
  `).join('');

  renderPaginationHost(rows);
}

function setupSidebar() {
  function openSidebar() {
    sidebar.classList.add('open');
    mobileOverlay.classList.add('active');
  }

  function closeSidebarFunc() {
    sidebar.classList.remove('open');
    mobileOverlay.classList.remove('active');
  }

  if (menuBtn) menuBtn.addEventListener('click', openSidebar);
  if (closeSidebar) closeSidebar.addEventListener('click', closeSidebarFunc);
  if (mobileOverlay) mobileOverlay.addEventListener('click', closeSidebarFunc);

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) closeSidebarFunc();
  });
}

function setupFilters() {
  const search = document.getElementById('paymentSearch');
  const month = document.getElementById('paymentMonthFilter');
  const period = document.getElementById('paymentPeriodFilter');
  const status = document.getElementById('paymentStatusFilter');

  if (search) {
    search.addEventListener('input', () => {
      currentPaymentPage = 1;
      renderRows();
    });
  }


  if (period) {
    period.addEventListener('change', () => {
      currentPaymentPage = 1;
      renderRows();
    });
  }

  if (status) {
    status.addEventListener('change', () => {
      currentPaymentPage = 1;
      renderRows();
    });
  }
}

async function savePaymentRow(billingId) {
  const payment = getPaymentCacheEntry(billingId);
  if (!payment) return;

  const draftValue = getPaymentRowDraftAmount(payment);
  const validation = validateAmountPaidInput(draftValue);
  if (!validation.isValid) {
    showNotification(validation.message, 'error');
    return;
  }

  const billingIdValue = toNumber(pick(payment, ['billingId', 'BillingId'], 0), 0);
  const concessionerId = getConcessionerIdForPayment(payment);

  if (concessionerId <= 0) {
    showNotification('Could not determine the concessioner for this payment.', 'error');
    return;
  }

  try {
    const api = getApi();

    // Use the arrears-first distribution endpoint
    await api.post('/Payment/distribute', {
      concessionerID: concessionerId,
      amountPaid: validation.value,
      currentBillingID: billingIdValue,
    });

    // Reload all data to reflect the distributed payments across multiple billings
    await loadData();
    showNotification('Payment distributed successfully (arrears resolved first).', 'success');
  } catch (error) {
    console.error(error);
    // Extract error message from API response
    const errorMsg = error?.response?.message || error?.message || 'Failed to distribute payment.';
    showNotification(errorMsg, 'error');
  }
}

function cancelPaymentRowEdit(billingId) {
  const payment = getPaymentCacheEntry(billingId);
  if (!payment) return;

  payment.isEditing = false;
  payment.IsEditing = false;
  payment.draftAmountPaid = '';
  payment.DraftAmountPaid = '';
  renderRows();
}

function setupRowActions() {
  const container = document.querySelector('.payment-container');
  if (!container) return;

  container.addEventListener('click', (event) => {
    const editBtn = event.target.closest('[data-role="edit-payment"]');
    if (editBtn) {
      const billingId = toNumber(editBtn.getAttribute('data-billing-id'), 0);
      const payment = setPaymentRowEditState(billingId, true);
      if (!payment) return;

      renderRows();

      requestAnimationFrame(() => {
        const input = document.querySelector(`.payment-amount-input[data-billing-id="${billingId}"]`);
        if (input) {
          input.focus();
          input.select();
        }
      });
      return;
    }

    const clearBtn = event.target.closest('[data-role="clear-payment"]');
    if (clearBtn) {
      const billingId = toNumber(clearBtn.getAttribute('data-billing-id'), 0);
      const payment = getPaymentCacheEntry(billingId);
      if (!payment) return;

      const concessionerId = getConcessionerIdForPayment(payment);
      if (concessionerId <= 0) {
        showNotification('Could not determine the concessioner for this payment.', 'error');
        return;
      }

      // Confirm before reversing the distribution
      if (!confirm('This will reverse all payment distributions for this concessioner. Continue?')) {
        return;
      }

      (async () => {
        try {
          const api = getApi();
          await api.post('/Payment/reverse-distribution', {
            concessionerID: concessionerId,
          });
          await loadData();
          showNotification('Payment distribution reversed successfully.', 'success');
        } catch (error) {
          console.error(error);
          const errorMsg = error?.response?.message || error?.message || 'Failed to reverse distribution.';
          showNotification(errorMsg, 'error');
        }
      })();
    }
  });

  container.addEventListener('input', (event) => {
    const input = event.target.closest('.payment-amount-input[data-role="amount-paid"]');
    if (!input) return;

    const billingId = toNumber(input.getAttribute('data-billing-id'), 0);
    const payment = getPaymentCacheEntry(billingId);
    if (!payment) return;
    const renderedRow = getRenderedPaymentRow(billingId);

    payment.draftAmountPaid = String(input.value || '').trim();
    payment.DraftAmountPaid = payment.draftAmountPaid;

    const validation = validateAmountPaidInput(payment.draftAmountPaid);
    setPaymentAmountInputState(input, validation, payment.isEditing);

    const balanceCell = input.closest('tr')?.querySelector('[data-role="payment-balance"]');
    if (balanceCell) {
      balanceCell.textContent = validation.isValid
        ? formatPeso(getPaymentRowBalance(renderedRow || payment, validation.value))
        : '--';
    }
  });

  container.addEventListener('keydown', (event) => {
    const input = event.target.closest('.payment-amount-input[data-role="amount-paid"]');
    if (!input || event.key !== 'Enter') return;

    const billingId = toNumber(input.getAttribute('data-billing-id'), 0);
    const payment = getPaymentCacheEntry(billingId);
    if (!payment) return;

    if (!payment.isEditing) {
      event.preventDefault();
      return;
    }

    const changed = isPaymentDraftChanged(payment);
    if (changed) {
      event.preventDefault();
      savePaymentRow(billingId);
      return;
    }

    event.preventDefault();
    setTimeout(() => input.blur(), 0);
  });

  container.addEventListener('blur', (event) => {
    const input = event.target.closest('.payment-amount-input[data-role="amount-paid"]');
    if (!input) return;

    const billingId = toNumber(input.getAttribute('data-billing-id'), 0);
    const payment = getPaymentCacheEntry(billingId);
    if (!payment || !payment.isEditing) return;

    const validation = validateAmountPaidInput(payment.draftAmountPaid);
    if (!validation.isValid) {
      setPaymentAmountInputState(input, validation, true);
      showNotification(validation.message, 'error');
      return;
    }

    if (isPaymentDraftChanged(payment)) {
      savePaymentRow(billingId);
      return;
    }

    payment.draftAmountPaid = '';
    payment.DraftAmountPaid = '';
    payment.isEditing = false;
    payment.IsEditing = false;
    renderRows();
  }, true);
}

function setupPaginationActions() {
  const container = document.querySelector('.payment-container');
  if (!container) return;

  container.addEventListener('click', (event) => {
    const prevPageBtn = event.target.closest('[data-role="prev-page"]');
    if (prevPageBtn) {
      const meta = getPaymentPaginationMeta(filteredPaymentRows);
      if (meta.currentPage > 1) {
        currentPaymentPage = meta.currentPage - 1;
        renderRows();
      }
      return;
    }

    const nextPageBtn = event.target.closest('[data-role="next-page"]');
    if (nextPageBtn) {
      const meta = getPaymentPaginationMeta(filteredPaymentRows);
      if (meta.currentPage < meta.totalPages) {
        currentPaymentPage = meta.currentPage + 1;
        renderRows();
      }
    }
  });
}

async function loadData() {
  const loadingOverlay = document.getElementById('paymentTableLoading');
  if (loadingOverlay) loadingOverlay.classList.add('active');

  const api = getApi();

  try {
    const [payments, billings, concessioners, users, periods] = await Promise.all([
      api.get('/Payment'),
      api.get('/Billing'),
      api.get('/Concessioner/active'),
      api.get('/User'),
      api.get('/Period'),
    ]);

    paymentCache = Array.isArray(payments) ? payments : [];
    billingCache = Array.isArray(billings) ? billings : [];
    concessionerCache = Array.isArray(concessioners) ? concessioners : [];
    userCache = Array.isArray(users) ? users : [];
    periodCache = Array.isArray(periods) ? periods : [];

    populatePeriodFilter();
    renderRows();
  } finally {
    if (loadingOverlay) loadingOverlay.classList.remove('active');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  setupSidebar();
  setupFilters();
  setupRowActions();
  setupPaginationActions();

  try {
    await loadData();
  } catch (error) {
    console.error(error);
    showNotification('Failed to load payment data from API.', 'error');
  }
});
