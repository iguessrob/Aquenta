const sidebar = document.getElementById('sidebar');
const mobileOverlay = document.getElementById('mobileOverlay');
const menuBtn = document.getElementById('menuBtn');
const closeSidebar = document.getElementById('closeSidebar');

let categoriesCache = [];
let tariffsCache = [];
let selectedTariffForEdit = null;
let selectedTariffForDelete = null;
let currentTariffType = '';

/**
 * Show a notification message
 * @param {string} message - The message to display
 * @param {string} type - 'success', 'error', or 'info'
 * @param {number} duration - Duration in milliseconds (default: 4000)
 */
function showNotification(message, type = 'info', duration = 4000) {
  const container = document.getElementById('notificationContainer');
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  // Create icon
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `
      <svg class="notification-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
    `;
  } else if (type === 'error') {
    iconSvg = `
      <svg class="notification-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    `;
  } else {
    iconSvg = `
      <svg class="notification-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
    `;
  }
  
  notification.innerHTML = `${iconSvg}<span class="notification-message">${message}</span>`;
  
  container.appendChild(notification);
  
  // Auto-remove notification
  setTimeout(() => {
    notification.classList.add('removing');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, duration);
}

function getApi() {
  if (!window.AquentaApiClient) {
    throw new Error('API client is not loaded. Please include script/api-client.js');
  }
  return window.AquentaApiClient;
}

function createActionButtons(rateId) {
  return `
    <div class="table-actions">
      <button class="table-action-btn edit-btn" title="Edit" data-rate-id="${rateId}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 20h9"></path>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"></path>
        </svg>
      </button>
      <button class="table-action-btn delete-btn" title="Delete" data-rate-id="${rateId}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6l-1 14H6L5 6"></path>
          <path d="M10 11v6"></path>
          <path d="M14 11v6"></path>
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
        </svg>
      </button>
    </div>
  `;
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
  item.addEventListener('click', function() {
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

function findCategoryByTitle(title) {
  const normalized = String(title || '').trim().toLowerCase();
  return categoriesCache.find((c) => {
    const name = String(c.categoryName || c.CategoryName || '').trim().toLowerCase();
    if (normalized.includes('residential')) return name === 'residential';
    if (normalized.includes('commercial')) return name === 'commercial';
    return name === normalized;
  }) || null;
}

function toNumber(val, fallback = 0) {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

function renderTariffTables() {
  const sections = document.querySelectorAll('.tariff-section');
  sections.forEach((section) => {
    const title = section.querySelector('.section-title')?.textContent || '';
    const tbody = section.querySelector('.tariff-table tbody');
    if (!tbody) return;

    const category = findCategoryByTitle(title);
    if (!category) {
      tbody.innerHTML = '';
      return;
    }

    const categoryId = Number(category.categoryId ?? category.CategoryId ?? 0);
    const rows = tariffsCache
      .filter((t) => Number(t.categoryId ?? t.CategoryId ?? 0) === categoryId)
      .sort((a, b) => toNumber(a.cubicMeter ?? a.CubicMeter) - toNumber(b.cubicMeter ?? b.CubicMeter));

    tbody.innerHTML = rows.map((row) => {
      const rateId = Number(row.rateId ?? row.RateId ?? 0);
      const cubic = toNumber(row.cubicMeter ?? row.CubicMeter).toFixed(2).replace('.00', '');
      const amount = toNumber(row.amount ?? row.Amount).toFixed(2);
      return `
        <tr data-rate-id="${rateId}">
          <td>${cubic}</td>
          <td>${amount}</td>
          <td>${createActionButtons(rateId)}</td>
        </tr>
      `;
    }).join('');
  });
}

async function loadTariffs() {
  const resLoading = document.getElementById('residentialTableLoading');
  const comLoading = document.getElementById('commercialTableLoading');
  
  if (resLoading) resLoading.classList.add('active');
  if (comLoading) comLoading.classList.add('active');

  try {
    const api = getApi();
    const [categories, tariffs] = await Promise.all([
      api.get('/Category'),
      api.get('/Tariffs'),
    ]);

    categoriesCache = Array.isArray(categories) ? categories : [];
    tariffsCache = Array.isArray(tariffs) ? tariffs : [];
    renderTariffTables();
  } catch (error) {
    console.error('Failed to load tariffs:', error);
    throw error;
  } finally {
    if (resLoading) resLoading.classList.remove('active');
    if (comLoading) comLoading.classList.remove('active');
  }
}

function setupAddRateButtons() {
  const addRateBtns = document.querySelectorAll('.add-rate-btn');
  addRateBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const section = this.closest('.tariff-section');
      currentTariffType = section.querySelector('.section-title').textContent;
      document.getElementById('addRateModal').classList.add('active');
    });
  });
}

function closeAddRateModal() {
  document.getElementById('addRateModal').classList.remove('active');
  document.getElementById('addRateForm').reset();
}

function setupModalListeners() {
  const modalOverlay = document.getElementById('modalOverlay');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const addRateForm = document.getElementById('addRateForm');

  modalOverlay.addEventListener('click', closeAddRateModal);
  modalCloseBtn.addEventListener('click', closeAddRateModal);
  cancelBtn.addEventListener('click', (e) => {
    e.preventDefault();
    closeAddRateModal();
  });

  addRateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cubicMeter = document.getElementById('cubicMeterInput').value;
    const amount = document.getElementById('amountInput').value;

    if (!cubicMeter || !amount) return;

    try {
      const api = getApi();
      const category = findCategoryByTitle(currentTariffType);
      if (!category) throw new Error('Category not found for selected tariff type.');

      await api.post('/Tariffs', {
        rateId: 0,
        categoryId: Number(category.categoryId ?? category.CategoryId),
        cubicMeter: Number(cubicMeter),
        amount: Number(amount),
      });

      closeAddRateModal();
      await loadTariffs();
      showNotification('New rate added successfully.', 'success');
    } catch (error) {
      console.error(error);
      showNotification(error.message || 'Failed to add rate.', 'error');
    }
  });
}

function closeEditRateModal() {
  document.getElementById('editRateModal').classList.remove('active');
  document.getElementById('editRateForm').reset();
  selectedTariffForEdit = null;
}

function setupEditButtons() {
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.edit-btn');
    if (!btn) return;

    const rateId = Number(btn.getAttribute('data-rate-id'));
    selectedTariffForEdit = tariffsCache.find((t) => Number(t.rateId ?? t.RateId ?? 0) === rateId) || null;
    if (!selectedTariffForEdit) return;

    document.getElementById('editCubicMeterInput').value = toNumber(selectedTariffForEdit.cubicMeter ?? selectedTariffForEdit.CubicMeter);
    document.getElementById('editAmountInput').value = toNumber(selectedTariffForEdit.amount ?? selectedTariffForEdit.Amount).toFixed(2);
    document.getElementById('editRateModal').classList.add('active');
  });
}

function setupEditModalListeners() {
  const editModalOverlay = document.getElementById('editModalOverlay');
  const editModalCloseBtn = document.getElementById('editModalCloseBtn');
  const editCancelBtn = document.getElementById('editCancelBtn');
  const editRateForm = document.getElementById('editRateForm');

  editModalOverlay.addEventListener('click', closeEditRateModal);
  editModalCloseBtn.addEventListener('click', closeEditRateModal);
  editCancelBtn.addEventListener('click', (e) => {
    e.preventDefault();
    closeEditRateModal();
  });

  editRateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!selectedTariffForEdit) return;

    const cubicMeter = document.getElementById('editCubicMeterInput').value;
    const amount = document.getElementById('editAmountInput').value;

    try {
      const api = getApi();
      await api.put('/Tariffs', {
        rateId: Number(selectedTariffForEdit.rateId ?? selectedTariffForEdit.RateId),
        categoryId: Number(selectedTariffForEdit.categoryId ?? selectedTariffForEdit.CategoryId),
        cubicMeter: Number(cubicMeter),
        amount: Number(amount),
      });

      closeEditRateModal();
      await loadTariffs();
      showNotification('Rate updated successfully.', 'success');
    } catch (error) {
      console.error(error);
      showNotification(error.message || 'Failed to update rate.', 'error');
    }
  });
}

function closeDeleteRateModal() {
  document.getElementById('deleteRateModal').classList.remove('active');
  selectedTariffForDelete = null;
}

function setupDeleteButtons() {
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.delete-btn');
    if (!btn) return;

    const rateId = Number(btn.getAttribute('data-rate-id'));
    selectedTariffForDelete = tariffsCache.find((t) => Number(t.rateId ?? t.RateId ?? 0) === rateId) || null;
    if (!selectedTariffForDelete) return;

    document.getElementById('deleteCubicMeterValue').textContent = toNumber(selectedTariffForDelete.cubicMeter ?? selectedTariffForDelete.CubicMeter).toString();
    document.getElementById('deleteAmountValue').textContent = toNumber(selectedTariffForDelete.amount ?? selectedTariffForDelete.Amount).toFixed(2);
    document.getElementById('deleteRateModal').classList.add('active');
  });
}

function setupDeleteModalListeners() {
  const deleteModalOverlay = document.getElementById('deleteModalOverlay');
  const deleteModalCloseBtn = document.getElementById('deleteModalCloseBtn');
  const deleteCancelBtn = document.getElementById('deleteCancelBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

  deleteModalOverlay.addEventListener('click', closeDeleteRateModal);
  deleteModalCloseBtn.addEventListener('click', closeDeleteRateModal);
  deleteCancelBtn.addEventListener('click', closeDeleteRateModal);

  confirmDeleteBtn.addEventListener('click', async () => {
    if (!selectedTariffForDelete) return;

    try {
      const api = getApi();
      const rateId = Number(selectedTariffForDelete.rateId ?? selectedTariffForDelete.RateId);
      await api.delete(`/Tariffs?id=${rateId}`);
      closeDeleteRateModal();
      await loadTariffs();
      showNotification('Rate deleted successfully.', 'success');
    } catch (error) {
      console.error(error);
      showNotification(error.message || 'Failed to delete rate.', 'error');
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadTariffs();
  } catch (error) {
    console.error(error);
    showNotification('Failed to load tariffs from API.', 'error');
  }

  setupAddRateButtons();
  setupModalListeners();
  setupEditButtons();
  setupEditModalListeners();
  setupDeleteButtons();
  setupDeleteModalListeners();
});
