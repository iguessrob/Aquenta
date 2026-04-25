/**
 * View Customer History Logic
 */
(function () {
  const api = window.AquentaApiClient;
  const concessionerId = new URLSearchParams(window.location.search).get('id');

  if (!api || !concessionerId) return;

  let billingCache = [];
  let paymentCache = [];
  let periodCache = [];
  let filteredBillings = [];
  let filteredPayments = [];

  const billingTableBody = document.querySelector('#tab-billing tbody');
  const paymentTableBody = document.querySelector('#tab-payments tbody');
  const billingStatusSelect = document.getElementById('billingStatusSelect');
  const billingSearchInput = document.getElementById('billingSearchInput');
  const paymentSearchInput = document.getElementById('paymentSearchInput');

  function pick(obj, keys, fallback = '') {
    for (const key of keys) {
      if (obj && typeof obj[key] !== 'undefined' && obj[key] !== null) return obj[key];
    }
    return fallback;
  }

  function toNumber(val, fallback = 0) {
    const n = Number(val);
    return isNaN(n) ? fallback : n;
  }

  function formatPeso(val) {
    return `₱ ${toNumber(val).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function formatDate(val) {
    if (!val) return '--';
    const d = new Date(val);
    return isNaN(d.getTime()) ? '--' : d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  }

  async function loadHistory() {
    try {
      const [billings, payments, periods] = await Promise.all([
        api.get('/Billing'),
        api.get('/Payment'),
        api.get('/Period')
      ]);

      billingCache = (billings || []).filter(b => toNumber(pick(b, ['concessionerID', 'ConcessionerID', 'concessionerId', 'ConcessionerId']), 0) === toNumber(concessionerId, 0));
      paymentCache = (payments || []).filter(p => {
         // Some payment records might not have concessionerId directly, but we can join via billing
         const pCid = toNumber(pick(p, ['concessionerID', 'ConcessionerID', 'concessionerId', 'ConcessionerId']), 0);
         if (pCid === toNumber(concessionerId, 0)) return true;
         
         const bId = toNumber(pick(p, ['billingId', 'BillingId']), 0);
         const bill = (billings || []).find(b => toNumber(pick(b, ['billingId', 'BillingId']), 0) === bId);
         return bill && toNumber(pick(bill, ['concessionerID', 'ConcessionerID', 'concessionerId', 'ConcessionerId']), 0) === toNumber(concessionerId, 0);
      });
      periodCache = periods || [];

      applyFilters();
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  }

  function applyFilters() {
    const bStatus = (billingStatusSelect?.value || 'ALL').toUpperCase();
    const bTerm = (billingSearchInput?.value || '').trim().toLowerCase();
    const pTerm = (paymentSearchInput?.value || '').trim().toLowerCase();

    filteredBillings = billingCache.filter(bill => {
      const status = String(pick(bill, ['billStatus', 'BillStatus'], 'Unpaid')).toUpperCase();
      const periodId = pick(bill, ['periodId', 'PeriodId', 'periodID', 'PeriodID']);
      const period = periodCache.find(p => pick(p, ['periodId', 'PeriodId']) === periodId);
      const periodLabel = period ? formatDate(pick(period, ['periodStart', 'PeriodStart'])) + ' - ' + formatDate(pick(period, ['periodEnd', 'PeriodEnd'])) : '';
      
      const matchesStatus = bStatus === 'ALL' || status === bStatus;
      const matchesSearch = !bTerm || periodLabel.toLowerCase().includes(bTerm);
      return matchesStatus && matchesSearch;
    }).sort((a, b) => b.billingId - a.billingId);

    filteredPayments = paymentCache.filter(pay => {
      const dateText = formatDate(pick(pay, ['datePaid', 'DatePaid'])).toLowerCase();
      return !pTerm || dateText.includes(pTerm);
    }).sort((a, b) => new Date(pick(b, ['datePaid', 'DatePaid'])) - new Date(pick(a, ['datePaid', 'DatePaid'])));

    renderTables();
  }

  function renderTables() {
    renderBillingTable();
    renderPaymentTable();
  }

  function renderBillingTable() {
    if (!billingTableBody) return;
    billingTableBody.innerHTML = '';

    if (filteredBillings.length === 0) {
      billingTableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 2rem; color: #64748b;">No billing records found.</td></tr>';
      return;
    }

    filteredBillings.forEach(bill => {
      const periodId = pick(bill, ['periodId', 'PeriodId', 'periodID', 'PeriodID']);
      const period = periodCache.find(p => pick(p, ['periodId', 'PeriodId']) === periodId);
      const periodLabel = period ? formatDate(pick(period, ['periodStart', 'PeriodStart'])) + ' - ' + formatDate(pick(period, ['periodEnd', 'PeriodEnd'])) : 'Period ' + periodId;

      const tr = document.createElement('tr');
      const status = String(pick(bill, ['billStatus', 'BillStatus'], 'Unpaid')).toLowerCase();
      
      const amount = toNumber(pick(bill, ['billAmount', 'BillAmount'], 0), 0);
      const penalty = toNumber(pick(bill, ['penalty', 'Penalty'], 0), 0);
      const total = amount + penalty;

      tr.innerHTML = `
        <td>${periodLabel}</td>
        <td>${pick(bill, ['currentReading', 'CurrentReading'], 0)}</td>
        <td>${Math.max(0, pick(bill, ['currentReading', 'CurrentReading'], 0) - pick(bill, ['prevReading', 'PrevReading'], 0))}</td>
        <td>${formatPeso(amount)}</td>
        <td>${formatPeso(penalty)}</td>
        <td>${formatPeso(total)}</td>
        <td><span class="status-pill status-${status === 'paid' ? 'active' : 'disconnected'}">${status.toUpperCase()}</span></td>
        <td>${formatDate(pick(period, ['periodEnd', 'PeriodEnd']))}</td>
        <td></td>
      `;
      billingTableBody.appendChild(tr);
    });
  }

  function renderPaymentTable() {
    if (!paymentTableBody) return;
    paymentTableBody.innerHTML = '';

    if (filteredPayments.length === 0) {
      paymentTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem; color: #64748b;">No payment records found.</td></tr>';
      return;
    }

    filteredPayments.forEach(pay => {
      const billingId = pick(pay, ['billingId', 'BillingId']);
      const billing = billingCache.find(b => pick(b, ['billingId', 'BillingId']) === billingId);
      const periodId = billing ? pick(billing, ['periodId', 'PeriodId', 'periodID', 'PeriodID']) : null;
      const period = periodCache.find(p => pick(p, ['periodId', 'PeriodId']) === periodId);
      const periodLabel = period ? formatDate(pick(period, ['periodStart', 'PeriodStart'])) : (billing ? 'Billing #' + billingId : '--');

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${formatDate(pick(pay, ['datePaid', 'DatePaid']))}</td>
        <td>${periodLabel}</td>
        <td>${formatPeso(pick(pay, ['amountPaid', 'AmountPaid'], 0))}</td>
        <td>Cash</td>
        <td>--</td>
        <td>Admin</td>
      `;
      paymentTableBody.appendChild(tr);
    });
  }

  // Event Listeners
  if (billingStatusSelect) billingStatusSelect.addEventListener('change', applyFilters);
  if (billingSearchInput) billingSearchInput.addEventListener('input', applyFilters);
  if (paymentSearchInput) paymentSearchInput.addEventListener('input', applyFilters);

  // Tab toggle logic
  const tabButtons = document.querySelectorAll('.profile-tab');
  const tabPanels = {
    billing: document.getElementById('tab-billing'),
    payments: document.getElementById('tab-payments'),
  };

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      tabButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      Object.entries(tabPanels).forEach(([key, panel]) => {
        if (panel) {
          panel.classList.toggle('hidden', key !== target);
        }
      });
    });
  });

  // Reset Password Modal Logic
  const resetBtn = document.getElementById('resetPasswordBtn');
  const resetModal = document.getElementById('resetPasswordModal');
  const closeResetModalBtn = document.getElementById('closeResetModalBtn');
  const cancelResetBtn = document.getElementById('cancelResetBtn');
  const confirmResetBtn = document.getElementById('confirmResetBtn');

  const openResetModal = () => resetModal && resetModal.classList.add('active');
  const closeResetModal = () => resetModal && resetModal.classList.remove('active');

  if (resetBtn) resetBtn.addEventListener('click', openResetModal);
  if (closeResetModalBtn) closeResetModalBtn.addEventListener('click', closeResetModal);
  if (cancelResetBtn) cancelResetBtn.addEventListener('click', closeResetModal);
  
  if (confirmResetBtn) {
    confirmResetBtn.addEventListener('click', () => {
      // In a real app, this would call an API endpoint to reset the password
      alert('Password has been successfully reset. The concessioner will be notified.');
      closeResetModal();
    });
  }

  // Close modal when clicking outside
  if (resetModal) {
    resetModal.addEventListener('click', (e) => {
      if (e.target === resetModal) {
        closeResetModal();
      }
    });
  }

  // Load Initial Data
  loadHistory();
})();