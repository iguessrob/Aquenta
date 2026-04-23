document.addEventListener('DOMContentLoaded', async () => {
  const concessioner = await conGuardResolveConcessioner();
  const concessionerId = concessioner?.concessionerId || concessioner?.ConcessionerId;
  const user = conGuardGetUser();

  if (!concessionerId) {
    document.getElementById('paymentTableContent').innerHTML = '<div class="empty-state"><p class="empty-state-text">No concessioner account found.</p></div>';
    return;
  }

  loadPayments(concessionerId);
});

async function loadPayments(concessionerId) {
  try {
    const payments = await window.AquentaApiClient.get('/Payment/concessioner/' + concessionerId);
    const paymentList = payments || [];

    paymentList.sort((a, b) => {
      const da = new Date(a.datePaid || a.DatePaid || 0);
      const db = new Date(b.datePaid || b.DatePaid || 0);
      return db - da;
    });

    // Summary
    const totalPaid = paymentList.reduce((sum, p) => {
      return sum + parseFloat(p.amountPaid || p.AmountPaid || 0);
    }, 0);

    const totalPaidEl = document.getElementById('statTotalPayments');
    if (totalPaidEl) totalPaidEl.textContent = conGuardFormatCurrency(totalPaid);

    const countEl = document.getElementById('statPaymentCount');
    if (countEl) countEl.textContent = paymentList.length + ' payment' + (paymentList.length !== 1 ? 's' : '') + ' made';

    renderPayments(paymentList);
  } catch (err) {
    console.error('Failed to load payments:', err);
    document.getElementById('paymentTableContent').innerHTML = '<div class="empty-state"><p class="empty-state-text">Unable to load payment data. Make sure the API is running.</p></div>';
  }
}

function renderPayments(payments) {
  const container = document.getElementById('paymentTableContent');

  if (!payments || payments.length === 0) {
    container.innerHTML = '<div class="empty-state"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg><p class="empty-state-title">No payments found</p><p class="empty-state-text">Your payment records will appear here once payments are made.</p></div>';
    return;
  }

  let html = '<div style="overflow-x:auto;"><table class="data-table"><thead><tr><th>Period Covered</th><th>Total Bill</th><th>Amount Paid</th><th>Date Paid</th></tr></thead><tbody>';

  payments.forEach((p) => {
    const paymentId = p.paymentId || p.PaymentId || '--';
    const amount = parseFloat(p.amountPaid || p.AmountPaid || 0);
    const billAmount = parseFloat(p.billAmount || p.BillAmount || 0);
    const penalty = parseFloat(p.penalty || p.Penalty || 0);
    const totalBill = billAmount + penalty;
    const date = new Date(p.datePaid || p.DatePaid || 0);
    const dateStr = conGuardFormatDate(date);
    const timeStr = date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });

    const start = p.periodStart || p.PeriodStart;
    const end = p.periodEnd || p.PeriodEnd;
    let periodStr = '--';
    if (start && end) {
      const dStart = new Date(start);
      const dEnd = new Date(end);
      if (dStart.getMonth() === dEnd.getMonth() && dStart.getFullYear() === dEnd.getFullYear()) {
        periodStr = dStart.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
      } else {
        periodStr = dStart.toLocaleDateString('en-PH', { month: 'short', year: 'numeric' }) + ' - ' + dEnd.toLocaleDateString('en-PH', { month: 'short', year: 'numeric' });
      }
    }

    html += `<tr>
      <td>${periodStr}</td>
      <td style="font-weight:600;">${conGuardFormatCurrency(totalBill)}</td>
      <td style="font-weight:600; color:#059669;">${conGuardFormatCurrency(amount)}</td>
      <td>${dateStr} ${timeStr}</td>
    </tr>`;
  });

  html += '</tbody></table></div>';
  container.innerHTML = html;
}

