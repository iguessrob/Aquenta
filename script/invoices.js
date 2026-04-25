const sidebar = document.getElementById('sidebar');
const mobileOverlay = document.getElementById('mobileOverlay');
const menuBtn = document.getElementById('menuBtn');
const closeSidebar = document.getElementById('closeSidebar');

let billingCache = [];
let paymentCache = [];
let concessionerCache = [];
let userCache = [];
let categoryCache = [];
let periodCache = [];
let filteredInvoiceRows = [];
let currentInvoicePage = 1;

const INVOICE_PAGE_SIZE = 25;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showNotification(message, type = 'error') {
  const container = document.getElementById('notificationContainer');
  if (!container) return;

  const note = document.createElement('div');
  note.className = `notification ${type}`;
  note.textContent = message;
  container.appendChild(note);

  setTimeout(() => {
    note.remove();
  }, 3500);
}

function getApi() {
  if (!window.AquentaApiClient) {
    throw new Error('API client is not loaded. Please include script/api-client.js');
  }

  return window.AquentaApiClient;
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function pick(obj, keys, fallback = undefined) {
  for (const key of keys) {
    if (typeof obj?.[key] !== 'undefined' && obj[key] !== null) return obj[key];
  }

  return fallback;
}

function getConcessionerDisplayName(concessioner, user) {
  const lastName = String(pick(user, ['lastName', 'LastName'], '')).trim();
  const firstName = String(pick(user, ['firstName', 'FirstName'], '')).trim();

  if (lastName || firstName) {
    return `${lastName}${lastName && firstName ? ', ' : ''}${firstName}`;
  }

  return String(pick(user, ['userName', 'UserName'], '')).trim() || 'Unknown';
}

function formatPeso(value) {
  return `₱ ${toNumber(value).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getInvoicePaginationMeta(rows) {
  const totalRecords = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / INVOICE_PAGE_SIZE));
  const safePage = Math.min(Math.max(currentInvoicePage, 1), totalPages);
  const startIndex = totalRecords === 0 ? 0 : (safePage - 1) * INVOICE_PAGE_SIZE + 1;
  const endIndex = totalRecords === 0 ? 0 : Math.min(safePage * INVOICE_PAGE_SIZE, totalRecords);

  return {
    totalRecords,
    totalPages,
    currentPage: safePage,
    startIndex,
    endIndex,
  };
}

function renderPaginationFooter(rows) {
  const meta = getInvoicePaginationMeta(rows);
  if (!rows.length) return '';

  return `
    <div class="invoice-pagination">
      <div class="invoice-pagination-summary">
        Showing ${meta.startIndex} to ${meta.endIndex} of ${meta.totalRecords} records
      </div>
      <div class="invoice-pagination-controls" aria-label="Invoice pagination">
        <button class="invoice-page-btn" data-role="prev-page" ${meta.currentPage <= 1 ? 'disabled' : ''} aria-label="Previous page">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <button class="invoice-page-btn invoice-page-btn-active" data-role="page-number" aria-current="page">
          ${meta.currentPage}
        </button>
        <button class="invoice-page-btn" data-role="next-page" ${meta.currentPage >= meta.totalPages ? 'disabled' : ''} aria-label="Next page">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
    </div>
  `;
}

function renderPaginationHost(rows) {
  const host = document.querySelector('.invoice-pagination-host');
  if (!host) return;

  host.innerHTML = renderPaginationFooter(rows);
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

function openPrintWindow(title, bodyMarkup) {
  const existingFrame = document.getElementById('invoicePrintFrame');
  if (existingFrame) {
    existingFrame.remove();
  }

  const frame = document.createElement('iframe');
  frame.id = 'invoicePrintFrame';
  frame.name = 'invoicePrintFrame';
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
    showNotification('Unable to prepare print preview.', 'error');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapeHtml(title)}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 8px;
            font-family: "Times New Roman", Georgia, serif;
            color: #111111;
            background: #fff;
          }
          .soa-sheet {
            width: 100%;
            max-width: 760px;
            margin: 0 auto;
            background: #fff;
            border: 1px solid #111;
            padding: 18px 24px 14px;
          }
          .sheet-break {
            page-break-after: always;
            break-after: page;
            height: 0;
          }
          .coop-name {
            text-align: center;
            font-size: 17px;
            margin: 2px 0 4px;
          }
          .coop-address {
            text-align: center;
            font-size: 13px;
            margin: 0;
          }
          .soa-main-title {
            text-align: center;
            border-top: 4px solid #111;
            margin: 12px auto 2px;
            padding-top: 4px;
            font-size: 44px;
            font-weight: 700;
            letter-spacing: 0.4px;
          }
          .soa-sub-title {
            text-align: center;
            font-size: 21px;
            font-weight: 700;
            margin: 0 0 6px;
          }
          .soa-service-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px 24px;
            font-size: 15px;
            font-weight: 700;
            margin-bottom: 10px;
          }
          .soa-line {
            border-top: 1px solid #111;
            margin: 10px 0;
          }
          .soa-line-text {
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.2px;
            margin: 8px 0;
            white-space: nowrap;
            overflow: hidden;
          }
          .soa-section-title {
            text-align: center;
            font-size: 22px;
            font-weight: 700;
            margin: 4px 0 6px;
          }
          .meter-table {
            width: 100%;
            border-collapse: collapse;
            margin: 0 0 10px;
          }
          .meter-table th,
          .meter-table td {
            border: 2px solid #111;
            padding: 4px 6px;
            text-align: center;
            font-size: 16px;
            height: 30px;
          }
          .meter-table th {
            font-weight: 400;
          }
          .billing-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            gap: 20px;
            font-size: 16px;
            font-weight: 700;
            margin: 3px 0;
          }
          .billing-row .label {
            flex: 1;
          }
          .billing-row .value {
            min-width: 170px;
            text-align: right;
          }
          .period-line {
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 6px;
          }
          .notes {
            margin-top: 8px;
            font-size: 11px;
            font-weight: 700;
            line-height: 1.45;
          }
          .notes .red {
            color: #d40000;
          }
          .notes p {
            margin: 0;
            margin-bottom: 2px;
          }
          @media print {
            body {
              padding: 0;
              background: #fff;
            }
            .soa-sheet {
              border: none;
              max-width: none;
              width: 100%;
              min-height: 0;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        ${bodyMarkup}
      </body>
    </html>
  `;

  doc.open();
  doc.write(html);
  doc.close();

  const runPrint = () => {
    try {
      frame.contentWindow.focus();
      frame.contentWindow.print();
    } catch (error) {
      showNotification('Unable to open print dialog.', 'error');
    }
  };

  if (doc.readyState === 'complete') {
    setTimeout(runPrint, 100);
  } else {
    frame.onload = () => setTimeout(runPrint, 100);
  }
}

function getSelectedPeriodLabel() {
  const selectedPeriodId = getSelectedPeriodId();
  const period = periodCache.find((item) => toNumber(pick(item, ['periodId', 'PeriodId'], 0), 0) === selectedPeriodId);
  return period ? formatPeriodOption(period) : 'Latest Period';
}

function getPrintRowsSource() {
  if (filteredInvoiceRows.length) return filteredInvoiceRows;
  return buildInvoiceRows();
}

function formatPesoCompact(value) {
  const formatted = toNumber(value).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `«${formatted}»`;
}

function buildStatementMarkup(row) {
  return `
    <section class="soa-sheet">
      <p class="coop-name">St. Joseph-STB Multi-Purpose Cooperative</p>
      <p class="coop-address">San Jose, City of Sto. Tomas, Batangas</p>

      <h1 class="soa-main-title">STATEMENT OF ACCOUNT</h1>
      <h2 class="soa-sub-title">SERVICE INFORMATION</h2>

      <div class="soa-service-grid">
        <div>Account No: ${escapeHtml(row.accountNumber || '--')}</div>
        <div>Rate Class: ${escapeHtml(row.rateClass || '--')}</div>
        <div>Account Name: ${escapeHtml(row.name || '--')}</div>
        <div></div>
        <div>Address: ${escapeHtml(row.address || '--')}</div>
        <div></div>
        <div>Contact No: ${escapeHtml(row.contactNo || '--')}</div>
        <div></div>
      </div>

      <div class="soa-line-text">===========================================================</div>
      <h2 class="soa-section-title">METERING INFORMATION</h2>

      <table class="meter-table">
        <thead>
          <tr>
            <th rowspan="2">Meter no.</th>
            <th colspan="2">Meter Reading</th>
            <th rowspan="2">Consumed</th>
          </tr>
          <tr>
            <th>Previous</th>
            <th>Present</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${escapeHtml(row.meterNumber || '--')}</td>
            <td>${row.previous === '' ? '--' : escapeHtml(row.previous)}</td>
            <td>${row.present === '' ? '--' : escapeHtml(row.present)}</td>
            <td>${row.consumed === '' ? '--' : escapeHtml(row.consumed)}</td>
          </tr>
        </tbody>
      </table>

      <div class="soa-line-text">===========================================================</div>
      <h2 class="soa-section-title">BILLING INFORMATION</h2>

      <p class="period-line">Period Covered: ${escapeHtml(row.periodCover || '--')}</p>
      <div class="billing-row"><span class="label">Amount:</span><span class="value">${escapeHtml(formatPesoCompact(row.amount))}</span></div>
      <div class="billing-row"><span class="label">Arrears:</span><span class="value">${escapeHtml(formatPesoCompact(row.arrears))}</span></div>
      <div class="billing-row"><span class="label">LP/RF:</span><span class="value">${escapeHtml(formatPesoCompact(row.penalty))}</span></div>
      <div class="billing-row"><span class="label">TOTAL AMOUNT DUE:</span><span class="value">${escapeHtml(formatPesoCompact(row.total))}</span></div>

      <div class="notes">
        <p><span class="red">DUE DATE:</span> Every 20<sup>th</sup> of the month.</p>
        <p><span class="red">NOTE:</span> Payments delayed by 2 months or more will incur a 200 pesos penalty.</p>
        <p>Please pay your monthly bill to avoid additional charges.</p>
      </div>
    </section>
  `;
}

function printAllInvoices() {
  const rows = getPrintRowsSource();
  if (!rows.length) {
    showNotification('No invoices to print for the current filter.', 'error');
    return;
  }

  const sheets = rows.map((row, idx) => `${buildStatementMarkup(row)}${idx < rows.length - 1 ? '<div class="sheet-break"></div>' : ''}`).join('');
  openPrintWindow(`Invoice Summary - ${getSelectedPeriodLabel()}`, sheets);
}

function printSingleInvoice(rowIndex) {
  const rows = getPrintRowsSource();
  const row = rows[rowIndex];
  if (!row) {
    showNotification('Invoice row not found for printing.', 'error');
    return;
  }

  openPrintWindow(`Invoice ${row.accountNumber || ''}`, buildStatementMarkup(row));
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

window.addEventListener('resize', () => {
  if (window.innerWidth >= 1024) closeSidebarFunc();
});

function getSelectedPeriodId() {
  const select = document.getElementById('invoicePeriodFilter');
  const id = toNumber(select?.value, 0);
  if (id > 0) return id;

  const sorted = [...periodCache].sort((a, b) => {
    const ad = getPeriodStart(a);
    const bd = getPeriodStart(b);
    if (!ad || !bd) return 0;
    return bd.getTime() - ad.getTime();
  });

  const latest = sorted[0];
  return latest ? toNumber(pick(latest, ['periodId', 'PeriodId'], 0), 0) : 0;
}

function populatePeriodFilter() {
  const select = document.getElementById('invoicePeriodFilter');
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
    return;
  }

  if (sorted.length) {
    const latestId = toNumber(pick(sorted[0], ['periodId', 'PeriodId'], 0), 0);
    select.value = latestId > 0 ? String(latestId) : '';
  }
}

function buildInvoiceRows() {
  const selectedPeriodId = getSelectedPeriodId();
  if (selectedPeriodId <= 0) return [];

  const periodMap = new Map(periodCache.map((period) => [toNumber(pick(period, ['periodId', 'PeriodId'], 0), 0), period]));
  const userMap = new Map(userCache.map((user) => [toNumber(pick(user, ['userId', 'UserId', 'userID', 'UserID'], 0), 0), user]));
  const categoryMap = new Map(categoryCache.map((cat) => [toNumber(pick(cat, ['categoryId', 'CategoryId'], 0), 0), String(pick(cat, ['categoryName', 'CategoryName'], '')).trim()]));

  const paymentByBilling = new Map();
  paymentCache.forEach((payment) => {
    const billingId = toNumber(pick(payment, ['billingId', 'BillingId'], 0), 0);
    const amountPaid = toNumber(pick(payment, ['amountPaid', 'AmountPaid'], 0), 0);
    paymentByBilling.set(billingId, (paymentByBilling.get(billingId) || 0) + amountPaid);
  });

  const periodOrder = new Map();
  [...periodCache]
    .sort((a, b) => {
      const ad = getPeriodStart(a);
      const bd = getPeriodStart(b);
      if (!ad || !bd) return 0;
      return ad.getTime() - bd.getTime();
    })
    .forEach((period, idx) => {
      const id = toNumber(pick(period, ['periodId', 'PeriodId'], 0), 0);
      periodOrder.set(id, idx + 1);
    });

  const selectedOrder = periodOrder.get(selectedPeriodId) || 0;

  const billingByConcessioner = new Map();
  billingCache.forEach((billing) => {
    const cid = toNumber(pick(billing, ['concessionerID', 'ConcessionerID', 'concessionerId', 'ConcessionerId'], 0), 0);
    if (cid <= 0) return;

    if (!billingByConcessioner.has(cid)) {
      billingByConcessioner.set(cid, []);
    }

    billingByConcessioner.get(cid).push(billing);
  });

  const concessioners = concessionerCache
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

  return concessioners.map((concessioner, index) => {
    const concessionerId = toNumber(pick(concessioner, ['concessionerId', 'ConcessionerId', 'concessionerID', 'ConcessionerID'], 0), 0);
    const billings = billingByConcessioner.get(concessionerId) || [];

    const selectedBilling = billings.find((billing) => {
      const periodId = toNumber(pick(billing, ['periodId', 'PeriodId', 'periodID', 'PeriodID'], 0), 0);
      return periodId === selectedPeriodId;
    }) || null;

    const arrears = billings
      .filter((billing) => {
        const periodId = toNumber(pick(billing, ['periodId', 'PeriodId', 'periodID', 'PeriodID'], 0), 0);
        const order = periodOrder.get(periodId) || 0;
        return order > 0 && order < selectedOrder;
      })
      .reduce((sum, billing) => {
        const billingId = toNumber(pick(billing, ['billingId', 'BillingId', 'billingID', 'BillingID'], 0), 0);
        const billAmount = toNumber(pick(billing, ['billAmount', 'BillAmount'], 0), 0);
        const penalty = toNumber(pick(billing, ['penalty', 'Penalty'], 0), 0);
        const paid = paymentByBilling.get(billingId) || 0;
        const balance = Math.max(0, billAmount + penalty - paid);
        return sum + balance;
      }, 0);

    const amount = selectedBilling ? toNumber(pick(selectedBilling, ['billAmount', 'BillAmount'], 0), 0) : 0;
    let penalty = selectedBilling ? toNumber(pick(selectedBilling, ['penalty', 'Penalty'], 0), 0) : 0;
    const billingId = selectedBilling ? toNumber(pick(selectedBilling, ['billingId', 'BillingId', 'billingID', 'BillingID'], 0), 0) : 0;

    // CRITICAL: Automatic penalty (₱200)
    // If a customer was unpaid last month and is still unpaid by the 20th of the current month
    const now = new Date();
    const currentDay = now.getDate();
    if (currentDay >= 20 && selectedBilling && selectedBilling.billStatus === 'Unpaid' && penalty === 0) {
      // Check if there was a previous month's unpaid bill
      const previousBilling = billings
        .filter((b) => {
          const pid = toNumber(pick(b, ['periodId', 'PeriodId', 'periodID', 'PeriodID'], 0), 0);
          const order = periodOrder.get(pid) || 0;
          return order > 0 && order < selectedOrder;
        })
        .sort((a, b) => {
          const pa = toNumber(pick(a, ['periodId', 'PeriodId', 'periodID', 'PeriodID'], 0), 0);
          const pb = toNumber(pick(b, ['periodId', 'PeriodId', 'periodID', 'PeriodID'], 0), 0);
          return (periodOrder.get(pb) || 0) - (periodOrder.get(pa) || 0);
        })[0];

      if (previousBilling && previousBilling.billStatus === 'Unpaid') {
        penalty = 200;
        // In a real app, we might call an API here to persist this penalty
      }
    }

    const present = selectedBilling ? toNumber(pick(selectedBilling, ['currentReading', 'CurrentReading'], 0), 0) : null;
    const previous = selectedBilling ? toNumber(pick(selectedBilling, ['prevReading', 'PrevReading'], 0), 0) : null;
    const consumed = selectedBilling ? Math.max(0, present - previous) : null;

    const userId = toNumber(pick(concessioner, ['userId', 'UserId', 'userID', 'UserID'], 0), 0);
    const user = userMap.get(userId) || null;
    const categoryId = toNumber(pick(concessioner, ['categoryId', 'CategoryId'], 0), 0);

    const period = periodMap.get(selectedPeriodId) || null;

    return {
      billingId,
      name: getConcessionerDisplayName(concessioner, user),
      accountNumber: String(pick(concessioner, ['accountNumber', 'AccountNumber'], '')).trim(),
      meterNumber: String(pick(concessioner, ['meterNumber', 'MeterNumber'], '')).trim(),
      address: String(pick(concessioner, ['address', 'Address'], '')).trim(),
      contactNo: String(pick(concessioner, ['contactNumber', 'ContactNumber'], '')).trim(),
      rateClass: categoryMap.get(categoryId) || '--',
      periodCover: formatPeriodCover(period),
      present: present === null ? '' : present,
      previous: previous === null ? '' : previous,
      consumed: consumed === null ? '' : consumed,
      amount,
      arrears,
      penalty,
      total: amount + arrears + penalty,
    };
  });
}

function renderRows() {
  const tbody = document.getElementById('invoiceRows');
  if (!tbody) return;

  const search = String(document.getElementById('invoiceSearch')?.value || '').trim().toLowerCase();
  const rows = buildInvoiceRows().filter((row) => {
    if (!search) return true;

    return (
      String(row.name).toLowerCase().includes(search)
      || String(row.accountNumber).toLowerCase().includes(search)
    );
  });

  filteredInvoiceRows = rows;
  const meta = getInvoicePaginationMeta(rows);
  currentInvoicePage = meta.currentPage;
  const pageRows = rows.slice((meta.currentPage - 1) * INVOICE_PAGE_SIZE, meta.currentPage * INVOICE_PAGE_SIZE);

  if (!pageRows.length) {
    tbody.innerHTML = '<tr><td colspan="15" class="empty-cell">No invoice rows found.</td></tr>';
    renderPaginationHost(rows);
    return;
  }

  tbody.innerHTML = pageRows.map((row) => `
    <tr>
      <td>${row.accountNumber || '--'}</td>
      <td>${row.name}</td>
      <td>${row.meterNumber || '--'}</td>
      <td>${row.address || '--'}</td>
      <td>${row.contactNo || '--'}</td>
      <td>${row.rateClass}</td>
      <td>${row.periodCover}</td>
      <td>${row.present === '' ? '--' : row.present}</td>
      <td>${row.previous === '' ? '--' : row.previous}</td>
      <td>${row.consumed === '' ? '--' : row.consumed}</td>
      <td>${formatPeso(row.amount)}</td>
      <td>${formatPeso(row.arrears)}</td>
      <td>${formatPeso(row.penalty)}</td>
      <td>${formatPeso(row.total)}</td>
      <td>
        <div class="invoice-actions" style="display: flex; gap: 4px;">
          <button class="invoice-row-print-btn" type="button" data-role="print-row" data-row-index="${filteredInvoiceRows.indexOf(row)}" aria-label="Print invoice for ${escapeHtml(row.accountNumber || row.name)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Print
          </button>
          <button class="invoice-row-edit-btn" type="button" data-role="edit-row" data-billing-id="${row.billingId}" data-amount="${row.amount}" data-penalty="${row.penalty}" style="display: inline-flex; align-items: center; justify-content: center; gap: 4px; height: 30px; padding: 0 10px; border: 1px solid #cbd5e1; border-radius: 6px; background: white; cursor: pointer; font-size: 12px; font-weight: 600;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"></path>
            </svg>
            Edit
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  renderPaginationHost(rows);
}

function setupFilters() {
  const search = document.getElementById('invoiceSearch');
  const periodFilter = document.getElementById('invoicePeriodFilter');
  const printAllBtn = document.getElementById('printAllInvoicesBtn');

  if (search) {
    search.addEventListener('input', () => {
      currentInvoicePage = 1;
      renderRows();
    });
  }

  if (periodFilter) {
    periodFilter.addEventListener('change', () => {
      currentInvoicePage = 1;
      renderRows();
    });
  }

  if (printAllBtn) {
    printAllBtn.addEventListener('click', printAllInvoices);
  }
}

function setupPaginationActions() {
  const container = document.querySelector('.invoice-container');
  if (!container) return;

  container.addEventListener('click', (event) => {
    const prevPageBtn = event.target.closest('[data-role="prev-page"]');
    if (prevPageBtn) {
      const meta = getInvoicePaginationMeta(filteredInvoiceRows);
      if (meta.currentPage > 1) {
        currentInvoicePage = meta.currentPage - 1;
        renderRows();
      }
      return;
    }

    const nextPageBtn = event.target.closest('[data-role="next-page"]');
    if (nextPageBtn) {
      const meta = getInvoicePaginationMeta(filteredInvoiceRows);
      if (meta.currentPage < meta.totalPages) {
        currentInvoicePage = meta.currentPage + 1;
        renderRows();
      }
      return;
    }

    const printRowBtn = event.target.closest('[data-role="print-row"]');
    if (printRowBtn) {
      const rowIndex = toNumber(printRowBtn.getAttribute('data-row-index'), -1);
      if (rowIndex >= 0) {
        printSingleInvoice(rowIndex);
      }
      return;
    }

    const editRowBtn = event.target.closest('[data-role="edit-row"]');
    if (editRowBtn) {
      const billingId = editRowBtn.getAttribute('data-billing-id');
      const amount = editRowBtn.getAttribute('data-amount');
      const penalty = editRowBtn.getAttribute('data-penalty');
      
      const modal = document.getElementById('editInvoiceModal');
      const idInput = document.getElementById('editBillingId');
      const amountInput = document.getElementById('editAmount');
      const penaltyInput = document.getElementById('editLPRF');

      if (modal && idInput && amountInput && penaltyInput) {
        idInput.value = billingId;
        amountInput.value = amount;
        penaltyInput.value = penalty;
        modal.style.display = 'flex';
      }
    }
  });

  const closeBtn = document.getElementById('closeEditInvoiceModal');
  const cancelBtn = document.getElementById('cancelEditInvoice');
  const editModal = document.getElementById('editInvoiceModal');
  const editForm = document.getElementById('editInvoiceForm');

  if (closeBtn) closeBtn.addEventListener('click', () => { editModal.style.display = 'none'; });
  if (cancelBtn) cancelBtn.addEventListener('click', () => { editModal.style.display = 'none'; });
  
  if (editForm) {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const billingId = toNumber(document.getElementById('editBillingId').value);
      const amount = toNumber(document.getElementById('editAmount').value);
      const penalty = toNumber(document.getElementById('editLPRF').value);

      if (billingId <= 0) return;

      try {
        const api = getApi();
        const existing = billingCache.find(b => toNumber(pick(b, ['billingId', 'BillingId'], 0)) === billingId);
        if (!existing) throw new Error('Billing record not found.');

        await api.put('/Billing', {
          ...existing,
          billAmount: amount,
          penalty: penalty
        });

        editModal.style.display = 'none';
        showNotification('Invoice updated successfully.', 'success');
        await loadData();
      } catch (error) {
        console.error(error);
        showNotification(error.message || 'Failed to update invoice.', 'error');
      }
    });
  }
}

async function loadData() {
  const api = getApi();
  const [billings, payments, concessioners, users, categories, periods] = await Promise.all([
    api.get('/Billing'),
    api.get('/Payment'),
    api.get('/Concessioner/active'),
    api.get('/User'),
    api.get('/Category'),
    api.get('/Period'),
  ]);

  billingCache = Array.isArray(billings) ? billings : [];
  paymentCache = Array.isArray(payments) ? payments : [];
  concessionerCache = Array.isArray(concessioners) ? concessioners : [];
  userCache = Array.isArray(users) ? users : [];
  categoryCache = Array.isArray(categories) ? categories : [];
  periodCache = Array.isArray(periods) ? periods : [];

  populatePeriodFilter();
  renderRows();
}

document.addEventListener('DOMContentLoaded', async () => {
  setupFilters();
  setupPaginationActions();

  try {
    await loadData();
  } catch (error) {
    console.error(error);
    showNotification('Failed to load invoice data from API.', 'error');
  }
});
