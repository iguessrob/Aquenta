let allBillings = [];

document.addEventListener('DOMContentLoaded', async () => {
  const concessioner = await conGuardResolveConcessioner();
  const concessionerId = concessioner?.concessionerId || concessioner?.ConcessionerId;
  const user = conGuardGetUser();

  if (!concessionerId) {
    document.getElementById('billingTableContent').innerHTML = '<div class="empty-state"><p class="empty-state-text">No concessioner account found.</p></div>';
    return;
  }

  loadBillings(concessionerId);

  document.getElementById('statusFilter').addEventListener('change', () => {
    renderBillings(filterBillings());
  });
});

async function loadBillings(concessionerId) {
  try {
    const billings = await window.AquentaApiClient.get('/Billing/concessioner/' + concessionerId);
    allBillings = billings || [];

    allBillings.sort((a, b) => {
      const da = new Date(a.createdAt || a.CreatedAt || 0);
      const db = new Date(b.createdAt || b.CreatedAt || 0);
      return db - da;
    });

    renderBillings(allBillings);
  } catch (err) {
    console.error('Failed to load billings:', err);
    document.getElementById('billingTableContent').innerHTML = '<div class="empty-state"><p class="empty-state-text">Unable to load billing data. Make sure the API is running.</p></div>';
  }
}

function filterBillings() {
  var statusVal = document.getElementById('statusFilter').value;
  if (statusVal === 'ALL') return allBillings;
  return allBillings.filter(function (b) {
    var s = (b.billStatus || b.BillStatus || '').toLowerCase();
    return s === statusVal.toLowerCase();
  });
}

function renderBillings(bills) {
  const container = document.getElementById('billingTableContent');

  if (!bills || bills.length === 0) {
    container.innerHTML = '<div class="empty-state"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg><p class="empty-state-title">No bills found</p><p class="empty-state-text">No billing records match the selected filter.</p></div>';
    return;
  }

  let html = '<div style="overflow-x:auto;"><table class="data-table"><thead><tr>';
  html += '<th>Period Covered</th><th>Prev</th><th>Curr</th><th>Consumption</th><th>Amount</th><th>Penalty</th><th>Total</th><th>Status</th>';
  html += '</tr></thead><tbody>';

  bills.forEach((b) => {
    const id = b.billingId || b.BillingId || '--';
    const dateStr = conGuardFormatDate(b.createdAt || b.CreatedAt);
    const prev = b.prevReading || b.PrevReading || 0;
    const curr = b.currentReading || b.CurrentReading || 0;
    const consumption = curr - prev;
    const amount = parseFloat(b.billAmount || b.BillAmount || 0);
    const penalty = parseFloat(b.penalty || b.Penalty || 0);
    const total = amount + penalty;
    const status = b.billStatus || b.BillStatus || '--';
    const badgeClass = 'badge-' + status.toLowerCase();

    const start = b.periodStart || b.PeriodStart;
    const end = b.periodEnd || b.PeriodEnd;
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
      <td>${prev}</td>
      <td>${curr}</td>
      <td>${consumption} m³</td>
      <td>${conGuardFormatCurrency(amount)}</td>
      <td>${conGuardFormatCurrency(penalty)}</td>
      <td style="font-weight:600;">${conGuardFormatCurrency(total)}</td>
      <td><span class="badge ${badgeClass}">${status}</span></td>
    </tr>`;
  });

  html += '</tbody></table></div>';
  container.innerHTML = html;
}

