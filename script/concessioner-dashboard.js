document.addEventListener('DOMContentLoaded', async () => {
  const user = conGuardGetUser();
  if (!user) return;

  const concessioner = await conGuardResolveConcessioner();
  const concessionerId = concessioner?.concessionerId || concessioner?.ConcessionerId;
  const userId = user.userId || user.UserId;

  setupNotifications();
  loadDashboardData(concessionerId, userId, concessioner);
});

function setupNotifications() {
  const notifBtn = document.getElementById('notifBtn');
  const notifDropdown = document.getElementById('notifDropdown');

  if (notifBtn) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle('show');
    });
  }

  document.addEventListener('click', (e) => {
    if (notifDropdown && !notifDropdown.contains(e.target) && e.target !== notifBtn) {
      notifDropdown.classList.remove('show');
    }
  });
}

async function loadDashboardData(concessionerId, userId, existingConcessioner) {
  // Clear alerts immediately on reload
  const alertContainer = document.getElementById('billingAlerts');
  const notifBadge = document.getElementById('notifBadge');
  const notifList = document.getElementById('notifList');
  if (alertContainer) alertContainer.innerHTML = '';
  if (notifBadge) notifBadge.classList.add('hidden');
  if (notifList) notifList.innerHTML = '<div class="notif-empty"><p>No active alerts.</p></div>';

  try {
    let concessioner = existingConcessioner;
    if (!concessioner) {
      concessioner = await conGuardResolveConcessioner();
    }

    if (!concessioner) {
      console.warn('No concessioner profile found.');
      return;
    }

    const cId = concessioner.concessionerId || concessioner.ConcessionerId;

    // 2. Load and sort billings
    const billings = await window.AquentaApiClient.get('Billing/concessioner/' + concessionerId);

    if (billings && Array.isArray(billings)) {
      // Sort by CreatedAt descending (newest first)
      billings.sort((a, b) => {
        const da = new Date(a.createdAt || a.CreatedAt || 0);
        const db = new Date(b.createdAt || b.CreatedAt || 0);
        return db - da;
      });

      // 3. Update dashboard statistics cards
      updateDashboardStats(billings, concessioner);

      // 4. Filter for unpaid/overdue bills (for alerts)
      const unpaidBills = billings.filter(b => {
        const s = (b.billStatus || b.BillStatus || '').toLowerCase();
        return s === 'unpaid' || s === 'overdue';
      });

      // 5. Render Recent Bills table (last 5)
      renderRecentBills(billings.slice(0, 5));

      // 6. Check and display automated alerts
      checkBillingAlerts(unpaidBills);
    } else {
      console.warn('No billings found for concessioner:', concessionerId);
      document.getElementById('recentBillsContent').innerHTML = '<div class="empty-state"><p class="empty-state-text">No billing data available.</p></div>';
      updateDashboardStats([], concessioner);
    }
  } catch (err) {
    console.error('Failed to load dashboard data:', err);
    document.getElementById('recentBillsContent').innerHTML = '<div class="empty-state"><p class="empty-state-text">Unable to load data. Make sure the API is running.</p></div>';
  }
}

function updateDashboardStats(billings, concessioner) {
  // A. Account Status Card
  if (concessioner) {
    const status = concessioner.status || concessioner.Status || '--';
    const accountNum = concessioner.accountNumber || concessioner.AccountNumber || '--';
    const statusEl = document.getElementById('statStatus');
    if (statusEl) {
      statusEl.innerHTML = `<span class="badge badge-${status.toLowerCase()}">${status}</span>`;
    }
    const accountNumEl = document.getElementById('statAccountNum');
    if (accountNumEl) accountNumEl.textContent = 'Account #: ' + accountNum;
  }

  // B. Latest Bill & Consumption Cards
  if (billings && billings.length > 0) {
    const latest = billings[0];
    const billStatus = (latest.billStatus || latest.BillStatus || '--').toLowerCase();
    const amount = parseFloat(latest.billAmount || latest.BillAmount || 0) + parseFloat(latest.penalty || latest.Penalty || 0);
    const prev = latest.prevReading || latest.PrevReading || 0;
    const curr = latest.currentReading || latest.CurrentReading || 0;
    const consumption = curr - prev;

    // Update Latest Bill card
    const latestBillEl = document.getElementById('statLatestBill');
    if (latestBillEl) {
      latestBillEl.textContent = '₱' + amount.toLocaleString('en-PH', { minimumFractionDigits: 2 });
    }
    const billStatusEl = document.getElementById('statBillStatus');
    if (billStatusEl) {
      const statusText = billStatus.charAt(0).toUpperCase() + billStatus.slice(1);
      billStatusEl.innerHTML = `<span class="badge badge-${billStatus}">${statusText}</span>`;
    }

    // Update Water Consumed card
    const consumptionEl = document.getElementById('statConsumption');
    if (consumptionEl) {
      consumptionEl.textContent = consumption + ' m³';
    }
  } else {
    // Reset if no billings
    ['statLatestBill', 'statBillStatus', 'statConsumption'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '--';
    });
  }

  // C. Total Unpaid Card
  const unpaidBills = (billings || []).filter(b => {
    const s = (b.billStatus || b.BillStatus || '').toLowerCase();
    return s === 'unpaid' || s === 'overdue';
  });

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Balance: Sum of all unpaid bills EXCLUDING the current month
  const totalBalance = unpaidBills.filter(b => {
    const billDate = new Date(b.periodEnd || b.PeriodEnd || b.createdAt || b.CreatedAt || 0);
    return !(billDate.getMonth() === currentMonth && billDate.getFullYear() === currentYear);
  }).reduce((sum, b) => {
    return sum + parseFloat(b.billAmount || b.BillAmount || 0) + parseFloat(b.penalty || b.Penalty || 0);
  }, 0);

  // Latest Bill Amount (from the first item in the billings array)
  let latestBillAmount = 0;
  if (billings && billings.length > 0) {
    const latest = billings[0];
    const status = (latest.billStatus || latest.BillStatus || '').toLowerCase();
    // Only add it if it is actually unpaid
    if (status === 'unpaid' || status === 'overdue') {
      latestBillAmount = parseFloat(latest.billAmount || latest.BillAmount || 0) + parseFloat(latest.penalty || latest.Penalty || 0);
    }
  }

  // Total Unpaid: Balance + Latest Bill
  const totalUnpaid = totalBalance + latestBillAmount;

  const unpaidEl = document.getElementById('statUnpaid');
  const balanceEl = document.getElementById('statBalance');
  if (unpaidEl) {
    unpaidEl.textContent = '₱' + totalUnpaid.toLocaleString('en-PH', { minimumFractionDigits: 2 });
  }
  if (balanceEl) {
    balanceEl.textContent = '₱' + totalBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 });
  }

  const unpaidCountEl = document.getElementById('statUnpaidCount');
  if (unpaidCountEl) {
    unpaidCountEl.textContent = unpaidBills.length + ' unpaid bill' + (unpaidBills.length !== 1 ? 's' : '');
  }
}

function checkBillingAlerts(unpaidBills) {
  const container = document.getElementById('billingAlerts');
  const notifBadge = document.getElementById('notifBadge');
  const notifList = document.getElementById('notifList');
  
  if (container) container.innerHTML = '';
  if (notifBadge) notifBadge.classList.add('hidden');
  if (notifList) notifList.innerHTML = '<div class="notif-empty"><p>No active alerts.</p></div>';

  if (!unpaidBills || unpaidBills.length === 0) return;

  // Find the oldest unpaid bill based on CreatedAt
  const oldestBill = unpaidBills.reduce((prev, current) => {
    const datePrev = new Date(prev.createdAt || prev.CreatedAt || 0);
    const dateCurr = new Date(current.createdAt || current.CreatedAt || 0);
    return datePrev < dateCurr ? prev : current;
  });

  const billDate = new Date(oldestBill.createdAt || oldestBill.CreatedAt || 0);
  const now = new Date();
  const dateStr = billDate.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
  
  // Calculate difference in months
  const monthDiff = (now.getFullYear() - billDate.getFullYear()) * 12 + (now.getMonth() - billDate.getMonth());

  let alertType = null;
  let alertTitle = '';
  let alertMessage = '';

  if (unpaidBills.length >= 3) {
    alertType = 'disconnection';
    alertTitle = 'NOTICE OF DISCONNECTION';
    alertMessage = `Your water service is scheduled for disconnection due to having <strong>${unpaidBills.length} unpaid bills</strong>. Please settle your account immediately.`;
  } else if (monthDiff >= 2) {
    alertType = 'disconnection';
    alertTitle = 'NOTICE OF DISCONNECTION';
    alertMessage = 'Your water service is scheduled for disconnection due to an outstanding balance from <strong>' + dateStr + '</strong>. Please settle your account immediately.';
  } else if (monthDiff >= 1) {
    alertType = 'reminder';
    alertTitle = 'PAYMENT REMINDER';
    alertMessage = 'Friendly reminder: Your bill from <strong>' + dateStr + '</strong> is now over 1 month old. Please settle it at your earliest convenience.';
  }

  if (alertType) {
    if (container) renderAlert(container, alertType, alertTitle, alertMessage);
    if (notifBadge) {
      notifBadge.textContent = '1';
      notifBadge.classList.remove('hidden');
    }
    if (notifList) renderNotifItem(notifList, alertType, alertTitle, alertMessage);
  }
}

function renderNotifItem(container, type, title, message) {
  const icon = type === 'disconnection' 
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'
    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';

  const colorClass = type === 'disconnection' ? 'notif-danger' : 'notif-warning';

  let html = `<div class="notif-item">
    <div class="notif-item-icon ${colorClass}">${icon}</div>
    <div class="notif-item-content">
      <div class="notif-item-title">${title}</div>
      <div class="notif-item-text">${message}</div>
    </div>
  </div>`;
  
  container.innerHTML = html;
}

function renderAlert(container, type, title, message) {
  const icon = type === 'disconnection' 
    ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'
    : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';

  let html = `<div class="billing-alert alert-${type}">
    <div class="billing-alert-icon">${icon}</div>
    <div class="billing-alert-content">
      <div class="billing-alert-title">${title}</div>
      <div class="billing-alert-text">${message}</div>
    </div>
  </div>`;
  
  container.innerHTML = html;
}

function renderRecentBills(bills) {
  const container = document.getElementById('recentBillsContent');
  if (!bills || bills.length === 0) {
    container.innerHTML = `<div class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
      </svg>
      <p class="empty-state-title">No bills found</p>
      <p class="empty-state-text">Your billing records will appear here.</p>
    </div>`;
    return;
  }

  let html = '<div style="overflow-x:auto;"><table class="data-table"><thead><tr>';
  html += '<th>Period Covered</th><th>Prev</th><th>Curr</th><th>Consumption</th><th>Amount</th><th>Penalty</th><th>Total</th><th>Status</th>';
  html += '</tr></thead><tbody>';

  bills.forEach(b => {
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

