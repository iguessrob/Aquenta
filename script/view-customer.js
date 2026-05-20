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

  const billingDetailTableBody = document.getElementById('billingDetailTableBody');
  const paymentTableBody = document.querySelector('#tab-payments tbody');
  const billingSearchInput = document.getElementById('billingSearchInput');
  const paymentSearchInput = document.getElementById('paymentSearchInput');
  const transactionTableBody = document.getElementById('transactionTableBody');
  const transactionYearSelect = document.getElementById('transactionYearSelect');
  const billingYearSelect = document.getElementById('billingYearSelect');
  const transactionSearchInput = document.getElementById('transactionSearchInput');
  const summaryTotalBilling = document.getElementById('summaryTotalBilling');
  const summaryTotalBalance = document.getElementById('summaryTotalBalance');
  const BILLING_MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

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

  function formatPesoDash(val, hasValue = true) {
    return hasValue ? formatPeso(val) : '₱ -';
  }

  function formatDate(val) {
    if (!val) return '--';
    const d = new Date(val);
    // Handle invalid dates or default "0001-01-01" (Year 1) dates
    if (isNaN(d.getTime()) || d.getFullYear() <= 1) return '--';
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  }

  function getBillPeriodStart(bill) {
    const periodId = pick(bill, ['periodId', 'PeriodId', 'periodID', 'PeriodID']);
    const period = periodCache.find(p => pick(p, ['periodId', 'PeriodId']) === periodId);
    if (!period) return null;
    const start = new Date(pick(period, ['periodStart', 'PeriodStart']));
    return isNaN(start.getTime()) ? null : start;
  }

  function getDisplayYear() {
    const selectedYear = billingYearSelect?.value || 'ALL';
    if (selectedYear !== 'ALL') return toNumber(selectedYear, new Date().getFullYear());

    const years = filteredBillings
      .map(getBillPeriodStart)
      .filter(Boolean)
      .map(d => d.getFullYear());

    if (years.length > 0) return Math.max(...years);

    const cacheYears = billingCache
      .map(getBillPeriodStart)
      .filter(Boolean)
      .map(d => d.getFullYear());

    return cacheYears.length > 0 ? Math.max(...cacheYears) : new Date().getFullYear();
  }

  function toDisplayNumber(val) {
    if (val === null || typeof val === 'undefined' || val === '') return '';
    const n = Number(val);
    return isNaN(n) ? '' : n;
  }

  async function loadHistory() {
    try {
      showLoading();
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

      seedYearFilters();
      applyFilters();
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  }

  function applyFilters() {
    const bTerm = (billingSearchInput?.value || '').trim().toLowerCase();
    const pTerm = (paymentSearchInput?.value || '').trim().toLowerCase();
    const tTerm = (transactionSearchInput?.value || '').trim().toLowerCase();
    const bYear = billingYearSelect?.value || 'ALL';
    const tYear = transactionYearSelect?.value || 'ALL';

    filteredBillings = billingCache.filter(bill => {
      const periodId = pick(bill, ['periodId', 'PeriodId', 'periodID', 'PeriodID']);
      const period = periodCache.find(p => pick(p, ['periodId', 'PeriodId']) === periodId);
      const periodLabel = period ? formatDate(pick(period, ['periodStart', 'PeriodStart'])) + ' - ' + formatDate(pick(period, ['periodEnd', 'PeriodEnd'])) : '';
      const periodYear = period ? new Date(pick(period, ['periodStart', 'PeriodStart'])).getFullYear().toString() : '';
      
      const matchesSearch = !bTerm || periodLabel.toLowerCase().includes(bTerm);
      const matchesYear = bYear === 'ALL' || periodYear === bYear;
      return matchesSearch && matchesYear;
    }).sort((a, b) => b.billingId - a.billingId);

    filteredPayments = paymentCache.filter(pay => {
      const dateText = formatDate(pick(pay, ['datePaid', 'DatePaid'])).toLowerCase();
      return !pTerm || dateText.includes(pTerm);
    }).sort((a, b) => new Date(pick(b, ['datePaid', 'DatePaid'])) - new Date(pick(a, ['datePaid', 'DatePaid'])));

    renderTables();
  }

  function seedYearFilters() {
    const yearSelects = [billingYearSelect, transactionYearSelect];
    
    yearSelects.forEach(select => {
      if (!select) return;
      
      // Clear existing options except "All"
      while (select.options.length > 1) {
        select.remove(1);
      }

      const years = new Set();
      billingCache.forEach(bill => {
        const periodId = pick(bill, ['periodId', 'PeriodId', 'periodID', 'PeriodID']);
        const period = periodCache.find(p => pick(p, ['periodId', 'PeriodId']) === periodId);
        if (period) {
          const start = new Date(pick(period, ['periodStart', 'PeriodStart']));
          if (!isNaN(start.getFullYear())) years.add(start.getFullYear());
        }
      });

      const sortedYears = Array.from(years).sort((a, b) => b - a);
      sortedYears.forEach(year => {
        const opt = document.createElement('option');
        opt.value = year;
        opt.textContent = year;
        select.appendChild(opt);
      });
    });
  }

  function showLoading() {
    const loadingHtml = '<tr><td colspan="10" style="text-align:center; padding: 3rem;"><div class="loading-spinner"></div><div style="margin-top: 10px; color: #64748b; font-size: 14px;">Loading data...</div></td></tr>';
    if (billingDetailTableBody) billingDetailTableBody.innerHTML = loadingHtml;
    if (paymentTableBody) paymentTableBody.innerHTML = loadingHtml;
    if (transactionTableBody) transactionTableBody.innerHTML = loadingHtml;
  }

  function renderTables() {
    renderBillingDetailTable();
    renderPaymentTable();
    renderTransactionsTable();
    updateSummaryCards();
  }

  function renderBillingDetailTable() {
    if (!billingDetailTableBody) return;
    billingDetailTableBody.innerHTML = '';

    const displayYear = getDisplayYear();
    const searchTerm = (billingSearchInput?.value || '').trim().toLowerCase();
    const monthRows = BILLING_MONTHS
      .map((label, monthIndex) => ({ label, monthIndex }))
      .filter(month => !searchTerm || month.label.toLowerCase().includes(searchTerm));

    if (monthRows.length === 0) {
      billingDetailTableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 2rem; color: #64748b;">No billing records found.</td></tr>';
      return;
    }

    const billByMonth = new Map();
    filteredBillings.forEach((bill) => {
      const periodStart = getBillPeriodStart(bill);
      if (!periodStart || periodStart.getFullYear() !== displayYear) return;

      const monthIndex = periodStart.getMonth();
      const current = billByMonth.get(monthIndex);
      const billId = toNumber(pick(bill, ['billingId', 'BillingId']), 0);
      const currentBillId = current ? toNumber(pick(current, ['billingId', 'BillingId']), 0) : -1;
      if (!current || billId > currentBillId) {
        billByMonth.set(monthIndex, bill);
      }
    });

    monthRows.forEach(({ label, monthIndex }) => {
      const bill = billByMonth.get(monthIndex);
      const tr = document.createElement('tr');

      if (!bill) {
        tr.innerHTML = `
          <td>${label}</td>
          <td></td>
          <td></td>
          <td></td>
          <td>${formatPesoDash(0, false)}</td>
          <td>${formatPesoDash(0, false)}</td>
          <td></td>
          <td>${formatPesoDash(0, false)}</td>
        `;
        billingDetailTableBody.appendChild(tr);
        return;
      }

      const bId = pick(bill, ['billingId', 'BillingId']);
      const present = toDisplayNumber(pick(bill, ['currentReading', 'CurrentReading']));
      const previous = toDisplayNumber(pick(bill, ['prevReading', 'PrevReading']));
      const consumption = (present === '' || previous === '') ? '' : Math.max(0, present - previous);

      const billAmount = toNumber(pick(bill, ['billAmount', 'BillAmount'], 0));
      const penalty = toNumber(pick(bill, ['penalty', 'Penalty'], 0));
      const totalBill = billAmount + penalty;

      const payments = paymentCache.filter(p => toNumber(pick(p, ['billingId', 'BillingId'])) === toNumber(bId, 0));
      const collection = payments.reduce((sum, p) => sum + toNumber(pick(p, ['amountPaid', 'AmountPaid'], 0)), 0);
      const hasCollection = payments.length > 0;
      const datePaid = hasCollection ? formatDate(pick(payments[0], ['datePaid', 'DatePaid'])) : '';
      const balance = Math.max(0, totalBill - collection);
      const balanceDisplay = balance > 0 ? formatPeso(balance) : '-';
      const balanceClass = balance > 0 ? 'billing-balance-due' : '';

      tr.innerHTML = `
        <td>${label}</td>
        <td>${present}</td>
        <td>${previous}</td>
        <td>${consumption}</td>
        <td>${formatPeso(totalBill)}</td>
        <td>${formatPesoDash(collection, hasCollection)}</td>
        <td>${datePaid}</td>
        <td class="${balanceClass}">${balanceDisplay}</td>
      `;
      billingDetailTableBody.appendChild(tr);
    });
  }

  function updateSummaryCards() {
    let totalBilling = 0;
    let totalBalance = 0;

    filteredBillings.forEach(bill => {
      const billAmount = toNumber(pick(bill, ['billAmount', 'BillAmount'], 0));
      const penalty = toNumber(pick(bill, ['penalty', 'Penalty'], 0));
      const totalBill = billAmount + penalty;

      const bId = pick(bill, ['billingId', 'BillingId']);
      const payments = paymentCache.filter(p => toNumber(pick(p, ['billingId', 'BillingId'])) === bId);
      const collection = payments.reduce((sum, p) => sum + toNumber(pick(p, ['amountPaid', 'AmountPaid'], 0)), 0);

      const balance = Math.max(0, totalBill - collection);

      totalBilling += totalBill;
      totalBalance += balance;
    });

    if (summaryTotalBilling) summaryTotalBilling.textContent = formatPeso(totalBilling);
    if (summaryTotalBalance) summaryTotalBalance.textContent = formatPeso(totalBalance);
  }

  function renderPaymentTable() {
    if (!paymentTableBody) return;
    paymentTableBody.innerHTML = '';

    if (filteredPayments.length === 0) {
      paymentTableBody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 2rem; color: #64748b;">No payment records found.</td></tr>';
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
      `;
      paymentTableBody.appendChild(tr);
    });
  }

  function renderTransactionsTable() {
    if (!transactionTableBody) return;
    transactionTableBody.innerHTML = '';

    const tTerm = (transactionSearchInput?.value || '').trim().toLowerCase();
    const tYear = transactionYearSelect?.value || 'ALL';

    let totalBilling = 0;
    let totalCollection = 0;
    let totalBalance = 0;

    // Filter billings based on search term and year
    const displayBillings = billingCache.filter(bill => {
      const periodId = pick(bill, ['periodId', 'PeriodId', 'periodID', 'PeriodID']);
      const period = periodCache.find(p => pick(p, ['periodId', 'PeriodId']) === periodId);
      const periodLabel = period ? formatDate(pick(period, ['periodStart', 'PeriodStart'])) + ' - ' + formatDate(pick(period, ['periodEnd', 'PeriodEnd'])) : '';
      const periodYear = period ? new Date(pick(period, ['periodStart', 'PeriodStart'])).getFullYear().toString() : '';

      const matchesSearch = !tTerm || periodLabel.toLowerCase().includes(tTerm);
      const matchesYear = tYear === 'ALL' || periodYear === tYear;
      return matchesSearch && matchesYear;
    }).sort((a, b) => a.billingId - b.billingId);

    if (displayBillings.length === 0) {
      transactionTableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 2rem; color: #64748b;">No transaction records found.</td></tr>';
      return;
    }

    displayBillings.forEach(bill => {
      const bId = pick(bill, ['billingId', 'BillingId']);
      const periodId = pick(bill, ['periodId', 'PeriodId', 'periodID', 'PeriodID']);
      const period = periodCache.find(p => pick(p, ['periodId', 'PeriodId']) === periodId);
      const periodLabel = period ? formatDate(pick(period, ['periodStart', 'PeriodStart'])) + ' - ' + formatDate(pick(period, ['periodEnd', 'PeriodEnd'])) : 'Period ' + periodId;

      const present = toNumber(pick(bill, ['currentReading', 'CurrentReading'], 0));
      const previous = toNumber(pick(bill, ['prevReading', 'PrevReading'], 0));
      const consumption = Math.max(0, present - previous);
      
      const billAmount = toNumber(pick(bill, ['billAmount', 'BillAmount'], 0));
      const penalty = toNumber(pick(bill, ['penalty', 'Penalty'], 0));
      const totalBill = billAmount + penalty;

      // Calculate collection (payments for this billing)
      const payments = paymentCache.filter(p => toNumber(pick(p, ['billingId', 'BillingId'])) === bId);
      const collection = payments.reduce((sum, p) => sum + toNumber(pick(p, ['amountPaid', 'AmountPaid'], 0)), 0);
      const datePaid = payments.length > 0 ? formatDate(pick(payments[0], ['datePaid', 'DatePaid'])) : '--';

      const balance = Math.max(0, totalBill - collection);

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${periodLabel}</td>
        <td>${present}</td>
        <td>${previous}</td>
        <td>${consumption}</td>
        <td>${formatPeso(totalBill)}</td>
        <td>${formatPeso(collection)}</td>
        <td>${datePaid}</td>
        <td>${formatPeso(balance)}</td>
      `;
      transactionTableBody.appendChild(tr);

      totalBilling += totalBill;
      totalCollection += collection;
      totalBalance += balance;
    });

    // Update Totals
    const totalBillingEl = document.getElementById('totalBillingValue');
    const totalCollectionEl = document.getElementById('totalCollectionValue');
    const totalBalanceEl = document.getElementById('totalBalanceValue');

    if (totalBillingEl) totalBillingEl.textContent = formatPeso(totalBilling);
    if (totalCollectionEl) totalCollectionEl.textContent = formatPeso(totalCollection);
    if (totalBalanceEl) totalBalanceEl.textContent = formatPeso(totalBalance);
  }

  // Event Listeners
  if (billingSearchInput) billingSearchInput.addEventListener('input', applyFilters);
  if (billingYearSelect) billingYearSelect.addEventListener('change', applyFilters);
  if (paymentSearchInput) paymentSearchInput.addEventListener('input', applyFilters);
  if (transactionSearchInput) transactionSearchInput.addEventListener('input', applyFilters);
  if (transactionYearSelect) transactionYearSelect.addEventListener('change', applyFilters);

  // Tab toggle logic
  const tabButtons = document.querySelectorAll('.profile-tab');
  const tabPanels = {
    billing: document.getElementById('tab-billing'),
    payments: document.getElementById('tab-payments'),
    transactions: document.getElementById('tab-transactions'),
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
  const deleteBtn = document.getElementById('deleteConcessionerBtn');
  const deleteModal = document.getElementById('deleteConcessionerModal');
  const closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const deleteDescription = document.getElementById('deleteConcessionerDescription');

  const openResetModal = () => resetModal && resetModal.classList.add('active');
  const closeResetModal = () => resetModal && resetModal.classList.remove('active');
  const openDeleteModal = () => deleteModal && deleteModal.classList.add('active');
  const closeDeleteModal = () => deleteModal && deleteModal.classList.remove('active');

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

  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      if (deleteDescription) {
        deleteDescription.textContent = `Are you sure you want to delete ${deleteBtn.dataset.customerName || 'this concessioner'}? This action will hide the record from all lists.`;
      }
      openDeleteModal();
    });
  }

  if (closeDeleteModalBtn) closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
  if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
      closeDeleteModal();

      try {
        const api = window.AquentaApiClient;
        await api.delete(`/Concessioner?id=${concessionerId}`);

        if (window.showNotification) {
          window.showNotification('Concessioner has been successfully deleted.', 'success');
        } else {
          window.alert('Concessioner has been successfully deleted.');
        }

        setTimeout(() => {
          window.location.href = 'customer-record.html';
        }, 1500);
      } catch (error) {
        console.error('Delete concessioner failed:', error);
        if (window.showNotification) {
          window.showNotification('Failed to delete concessioner: ' + (error.message || 'Unknown error'), 'error');
        } else {
          window.alert('Failed to delete concessioner: ' + (error.message || 'Unknown error'));
        }
      }
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

  if (deleteModal) {
    deleteModal.addEventListener('click', (e) => {
      if (e.target === deleteModal) {
        closeDeleteModal();
      }
    });
  }

  // Load Initial Data
  loadHistory();
})();