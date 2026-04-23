// Simple tab toggle for billing vs payment history
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

// Sorting / filtering controls in View Customer
const billingStatusSelect = document.getElementById('billingStatusSelect');
const paymentMethodSelect = document.getElementById('paymentMethodSelect');
const billingSearchInput = document.getElementById('billingSearchInput');
const paymentSearchInput = document.getElementById('paymentSearchInput');
const billingTableBody = document.querySelector('#tab-billing tbody');
const paymentTableBody = document.querySelector('#tab-payments tbody');

// Keep original row order so we can always start from it
const originalBillingRows = billingTableBody
  ? Array.from(billingTableBody.querySelectorAll('tr'))
  : [];
const originalPaymentRows = paymentTableBody
  ? Array.from(paymentTableBody.querySelectorAll('tr'))
  : [];

// Status filter for Billing History
if (billingStatusSelect && billingTableBody) {
  const applyBillingFilter = () => {
    const current = (billingStatusSelect.value || 'ALL').toUpperCase();
    const term = (billingSearchInput && billingSearchInput.value
      ? billingSearchInput.value
      : ''
    ).trim().toLowerCase();

    // Reset table body to original rows
    billingTableBody.innerHTML = '';
    originalBillingRows.forEach((row) => {
      const status = (row.dataset.status || '').toLowerCase();
      const periodText = (row.cells[0]?.textContent || '').toLowerCase();
      const matchesStatus =
        current === 'ALL' ||
        (current === 'PAID' && status === 'paid') ||
        (current === 'UNPAID' && status !== 'paid');
      const matchesSearch = !term || periodText.includes(term);

      if (matchesStatus && matchesSearch) {
        billingTableBody.appendChild(row);
      }
    });
  };

  billingStatusSelect.addEventListener('change', applyBillingFilter);
  if (billingSearchInput) {
    billingSearchInput.addEventListener('input', applyBillingFilter);
  }

  // Initial render to ensure filters apply on first load
  applyBillingFilter();
}

// Payment Method filter for Payment History
if (paymentMethodSelect && paymentTableBody) {
  const applyPaymentFilter = () => {
    const current = (paymentMethodSelect.value || 'ALL').toUpperCase();
    const term = (paymentSearchInput && paymentSearchInput.value
      ? paymentSearchInput.value
      : ''
    ).trim().toLowerCase();

    paymentTableBody.innerHTML = '';
    originalPaymentRows.forEach((row) => {
      const method = (row.dataset.method || '').toLowerCase();
      const dateText = (row.cells[0]?.textContent || '').toLowerCase();
      const matchesMethod =
        current === 'ALL' ||
        (current === 'CASH' && method === 'cash') ||
        (current === 'ONLINE' && method === 'online') ||
        (current === 'CHECK' && method === 'check');
      const matchesSearch = !term || dateText.includes(term);

      if (matchesMethod && matchesSearch) {
        paymentTableBody.appendChild(row);
      }
    });
  };

  paymentMethodSelect.addEventListener('change', applyPaymentFilter);
  if (paymentSearchInput) {
    paymentSearchInput.addEventListener('input', applyPaymentFilter);
  }

  // Initial render
  applyPaymentFilter();
}