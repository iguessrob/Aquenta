const sidebar = document.getElementById('sidebar');
const mobileOverlay = document.getElementById('mobileOverlay');
const menuBtn = document.getElementById('menuBtn');
const closeSidebar = document.getElementById('closeSidebar');

let categoriesCache = [];
let tariffsCache = [];
let tariffVersionsCache = [];
let selectedTariffVersionId = null;

let selectedTariffForEdit = null;
let selectedTariffForDelete = null;
let currentTariffType = '';

function getApi() {
  if (!window.AquentaApiClient) {
    throw new Error('API client is not loaded. Please include script/api-client.js');
  }
  return window.AquentaApiClient;
}

function showNotification(message, type = 'info') {
  if (window.showNotification) {
    window.showNotification(message, type);
  } else {
    alert(message);
  }
}

function toNumber(val, fallback = 0) {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

function openSidebar() {
  if (!sidebar || !mobileOverlay) return;
  sidebar.classList.add('open');
  mobileOverlay.classList.add('active');
}

function closeSidebarFunc() {
  if (!sidebar || !mobileOverlay) return;
  sidebar.classList.remove('open');
  mobileOverlay.classList.remove('active');
}

function setupSidebar() {
  if (menuBtn) menuBtn.addEventListener('click', openSidebar);
  if (closeSidebar) closeSidebar.addEventListener('click', closeSidebarFunc);
  if (mobileOverlay) mobileOverlay.addEventListener('click', closeSidebarFunc);

  const navLinks = document.querySelectorAll('.nav-item');
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 1024) closeSidebarFunc();
    });
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) closeSidebarFunc();
  });
}

function findCategoryByTitle(title) {
  const normalized = String(title || '').trim().toLowerCase();
  return categoriesCache.find((c) => {
    const name = String(c.categoryName || c.CategoryName || '').trim().toLowerCase();
    if (normalized.includes('residential')) return name === 'residential';
    if (normalized.includes('commercial')) return name === 'commercial';
    return name === normalized;
  }) || null;
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

function setVersionBadge(version) {
  const badge = document.getElementById('currentVersionBadge');
  if (!badge) return;

  const isActive = Boolean(version && (version.isActive ?? version.IsActive));
  badge.style.display = isActive ? 'inline-flex' : 'none';
  badge.textContent = isActive ? 'CURRENT VERSION' : 'INACTIVE VERSION';

  const setActiveBtn = document.getElementById('setActiveVersionBtn');
  if (setActiveBtn) {
    setActiveBtn.style.display = isActive ? 'none' : 'inline-flex';
  }
}

function renderVersionSelect() {
  const select = document.getElementById('tariffVersionSelect');
  if (!select) return;

  select.innerHTML = tariffVersionsCache.map((version) => {
    const id = Number(version.tariffVersionId ?? version.TariffVersionId ?? 0);
    const name = String(version.versionName ?? version.VersionName ?? `Version ${id}`);
    return `<option value="${id}">${escapeHtml(name)}</option>`;
  }).join('');

  if (selectedTariffVersionId) {
    select.value = String(selectedTariffVersionId);
  }

  const selected = getSelectedVersion();
  setVersionBadge(selected);
}

function getSelectedVersion() {
  return tariffVersionsCache.find((v) => Number(v.tariffVersionId ?? v.TariffVersionId ?? 0) === Number(selectedTariffVersionId)) || null;
}

async function loadTariffVersions(preferredVersionId = null) {
  const api = getApi();
  const versions = await api.get('/TariffVersion');
  tariffVersionsCache = Array.isArray(versions) ? versions : [];

  if (!tariffVersionsCache.length) {
    selectedTariffVersionId = null;
    renderVersionSelect();
    tariffsCache = [];
    renderTariffTables();
    return;
  }

  const active = tariffVersionsCache.find((v) => Boolean(v.isActive ?? v.IsActive));

  if (preferredVersionId && tariffVersionsCache.some((v) => Number(v.tariffVersionId ?? v.TariffVersionId ?? 0) === Number(preferredVersionId))) {
    selectedTariffVersionId = Number(preferredVersionId);
  } else if (!selectedTariffVersionId) {
    selectedTariffVersionId = Number((active?.tariffVersionId ?? active?.TariffVersionId) || (tariffVersionsCache[0].tariffVersionId ?? tariffVersionsCache[0].TariffVersionId));
  }

  renderVersionSelect();
  console.log('Tariff versions loaded:', tariffVersionsCache);
  await loadTariffsByVersion();
}

function setTableLoading(isLoading) {
  const resLoading = document.getElementById('residentialTableLoading');
  const comLoading = document.getElementById('commercialTableLoading');

  if (resLoading) resLoading.classList.toggle('active', isLoading);
  if (comLoading) comLoading.classList.toggle('active', isLoading);
}

async function loadTariffsByVersion() {
  if (!selectedTariffVersionId) {
    tariffsCache = [];
    renderTariffTables();
    return;
  }

  setTableLoading(true);
  try {
    const api = getApi();
    const [categories, tariffs] = await Promise.all([
      api.get('/Category'),
      api.get(`/Tariffs/by-version/${selectedTariffVersionId}`),
    ]);

    categoriesCache = Array.isArray(categories) ? categories : [];
    tariffsCache = Array.isArray(tariffs) ? tariffs : [];
    console.log(`Loaded ${tariffsCache.length} tariffs for version ID ${selectedTariffVersionId}`);
    renderTariffTables();
  } finally {
    setTableLoading(false);
  }
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
      const cubicVal = toNumber(row.cubicMeter ?? row.CubicMeter);
      const cubic = Number.isInteger(cubicVal) ? cubicVal.toString() : cubicVal.toFixed(2).replace(/\.?0+$/, '');
      const amount = toNumber(row.amount ?? row.Amount).toFixed(2);
      return `
        <tr data-rate-id="${rateId}">
          <td>${escapeHtml(cubic)}</td>
          <td>${escapeHtml(amount)}</td>
          <td>${createActionButtons(rateId)}</td>
        </tr>
      `;
    }).join('');
  });
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

function setupVersionControls() {
  const select = document.getElementById('tariffVersionSelect');
  const openCreateBtn = document.getElementById('openCreateVersionBtn');
  const editBtn = document.getElementById('editVersionBtn');
  const deleteBtn = document.getElementById('deleteVersionBtn');
  const setActiveBtn = document.getElementById('setActiveVersionBtn');

  if (select) {
    select.addEventListener('change', async (event) => {
      selectedTariffVersionId = Number(event.target.value);
      setVersionBadge(getSelectedVersion());
      await loadTariffsByVersion();
    });
  }

  if (openCreateBtn) {
    openCreateBtn.addEventListener('click', () => {
      const input = document.getElementById('createVersionNameInput');
      if (input) {
        input.value = '';
        input.placeholder = 'e.g., Version 2.0';
      }
      openModal('createVersionModal');
    });
  }

  if (editBtn) {
    editBtn.addEventListener('click', () => {
      const selected = getSelectedVersion();
      if (!selected) {
        showNotification('Please select a version first.', 'info');
        return;
      }

      const input = document.getElementById('editVersionNameInput');
      if (input) input.value = String(selected.versionName ?? selected.VersionName ?? '');
      openModal('editVersionModal');
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      const selected = getSelectedVersion();
      if (!selected) {
        showNotification('Please select a version first.', 'info');
        return;
      }

      if (Boolean(selected.isActive ?? selected.IsActive)) {
        showNotification('You cannot delete the active version.', 'error');
        return;
      }

      const nameDisplay = document.getElementById('deleteVersionNameDisplay');
      if (nameDisplay) nameDisplay.textContent = String(selected.versionName ?? selected.VersionName ?? '');
      openModal('deleteVersionModal');
    });
  }

  if (setActiveBtn) {
    setActiveBtn.addEventListener('click', async () => {
      const selected = getSelectedVersion();
      if (!selected) return;

      if (Boolean(selected.isActive ?? selected.IsActive)) {
        showNotification('This version is already active.', 'info');
        return;
      }

      try {
        const api = getApi();
        const id = Number(selected.tariffVersionId ?? selected.TariffVersionId);
        await api.post(`/TariffVersion/set-active/${id}`);

        await loadTariffVersions(id);
        showNotification(`Preset is now the active tariff version.`, 'success');
      } catch (error) {
        console.error(error);
        showNotification(error.message || 'Failed to set active version.', 'error');
      }
    });
  }
}

function setupDeleteVersionModal() {
  const overlay = document.getElementById('deleteVersionOverlay');
  const closeBtn = document.getElementById('deleteVersionCloseBtn');
  const cancelBtn = document.getElementById('deleteVersionCancelBtn');
  const confirmBtn = document.getElementById('confirmDeleteVersionBtn');

  if (overlay) overlay.addEventListener('click', () => closeModal('deleteVersionModal'));
  if (closeBtn) closeBtn.addEventListener('click', () => closeModal('deleteVersionModal'));
  if (cancelBtn) cancelBtn.addEventListener('click', () => closeModal('deleteVersionModal'));

  if (!confirmBtn) return;
  confirmBtn.addEventListener('click', async () => {
    const selected = getSelectedVersion();
    if (!selected) return;

    try {
      const api = getApi();
      const id = Number(selected.tariffVersionId ?? selected.TariffVersionId);
      await api.delete(`/TariffVersion/${id}`);

      closeModal('deleteVersionModal');
      selectedTariffVersionId = null;
      await loadTariffVersions();
      showNotification('Tariff version deleted successfully.', 'success');
    } catch (error) {
      console.error(error);
      showNotification(error.message || 'Failed to delete version.', 'error');
    }
  });
}

function setupCreateVersionModal() {
  const overlay = document.getElementById('createVersionOverlay');
  const closeBtn = document.getElementById('createVersionCloseBtn');
  const cancelBtn = document.getElementById('createVersionCancelBtn');
  const form = document.getElementById('createVersionForm');

  if (overlay) overlay.addEventListener('click', () => closeModal('createVersionModal'));
  if (closeBtn) closeBtn.addEventListener('click', () => closeModal('createVersionModal'));
  if (cancelBtn) cancelBtn.addEventListener('click', () => closeModal('createVersionModal'));

  if (!form) return;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = document.getElementById('createVersionNameInput');
    const versionName = String(input?.value || '').trim();
    if (!versionName) return;

    try {
      const api = getApi();
      const response = await api.post('/TariffVersion/create-current', {
        versionName,
      });

      closeModal('createVersionModal');

      const newVersionId = Number(response);
      await loadTariffVersions(newVersionId || null);
      showNotification('New tariff version created and set as current.', 'success');
    } catch (error) {
      console.error(error);
      showNotification(error.message || 'Failed to create tariff version.', 'error');
    }
  });
}

function setupEditVersionModal() {
  const overlay = document.getElementById('editVersionOverlay');
  const closeBtn = document.getElementById('editVersionCloseBtn');
  const cancelBtn = document.getElementById('editVersionCancelBtn');
  const form = document.getElementById('editVersionForm');

  if (overlay) overlay.addEventListener('click', () => closeModal('editVersionModal'));
  if (closeBtn) closeBtn.addEventListener('click', () => closeModal('editVersionModal'));
  if (cancelBtn) cancelBtn.addEventListener('click', () => closeModal('editVersionModal'));

  if (!form) return;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const selected = getSelectedVersion();
    if (!selected) {
      showNotification('No tariff version selected.', 'error');
      return;
    }

    const input = document.getElementById('editVersionNameInput');
    const versionName = String(input?.value || '').trim();
    if (!versionName) return;

    try {
      const api = getApi();
      const id = Number(selected.tariffVersionId ?? selected.TariffVersionId);
      await api.put(`/TariffVersion/rename/${id}?newName=${encodeURIComponent(versionName)}`);

      closeModal('editVersionModal');
      await loadTariffVersions(id);
      showNotification('Version name updated successfully.', 'success');
    } catch (error) {
      console.error(error);
      showNotification(error.message || 'Failed to update version name.', 'error');
    }
  });
}

function setupAddRateModal() {
  const addRateBtns = document.querySelectorAll('.add-rate-btn');
  addRateBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const section = btn.closest('.tariff-section');
      currentTariffType = section?.querySelector('.section-title')?.textContent || '';
      openModal('addRateModal');
    });
  });

  const overlay = document.getElementById('modalOverlay');
  const closeBtn = document.getElementById('modalCloseBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const form = document.getElementById('addRateForm');

  const closeAddModal = () => {
    closeModal('addRateModal');
    if (form) form.reset();
  };

  if (overlay) overlay.addEventListener('click', closeAddModal);
  if (closeBtn) closeBtn.addEventListener('click', closeAddModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeAddModal);

  if (!form) return;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const cubicMeter = Number(document.getElementById('cubicMeterInput')?.value || 0);
    const amount = Number(document.getElementById('amountInput')?.value || 0);

    if (!selectedTariffVersionId) {
      showNotification('Please select a tariff preset.', 'error');
      return;
    }

    try {
      const api = getApi();
      const category = findCategoryByTitle(currentTariffType);
      if (!category) throw new Error('Category not found for selected tariff type.');

      await api.post('/Tariffs', {
        rateId: 0,
        categoryId: Number(category.categoryId ?? category.CategoryId),
        tariffVersionId: Number(selectedTariffVersionId),
        cubicMeter,
        amount,
      });

      closeAddModal();
      await loadTariffsByVersion();
      showNotification('New rate added successfully.', 'success');
    } catch (error) {
      console.error(error);
      showNotification(error.message || 'Failed to add rate.', 'error');
    }
  });
}

function setupEditRateModal() {
  const overlay = document.getElementById('editModalOverlay');
  const closeBtn = document.getElementById('editModalCloseBtn');
  const cancelBtn = document.getElementById('editCancelBtn');
  const form = document.getElementById('editRateForm');

  const closeEditModal = () => {
    closeModal('editRateModal');
    if (form) form.reset();
    selectedTariffForEdit = null;
  };

  document.addEventListener('click', (event) => {
    const btn = event.target.closest('.edit-btn');
    if (!btn) return;

    const rateId = Number(btn.getAttribute('data-rate-id'));
    selectedTariffForEdit = tariffsCache.find((t) => Number(t.rateId ?? t.RateId ?? 0) === rateId) || null;
    if (!selectedTariffForEdit) return;

    document.getElementById('editCubicMeterInput').value = toNumber(selectedTariffForEdit.cubicMeter ?? selectedTariffForEdit.CubicMeter);
    document.getElementById('editAmountInput').value = toNumber(selectedTariffForEdit.amount ?? selectedTariffForEdit.Amount).toFixed(2);
    openModal('editRateModal');
  });

  if (overlay) overlay.addEventListener('click', closeEditModal);
  if (closeBtn) closeBtn.addEventListener('click', closeEditModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeEditModal);

  if (!form) return;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!selectedTariffForEdit) return;

    try {
      const api = getApi();
      await api.put('/Tariffs', {
        rateId: Number(selectedTariffForEdit.rateId ?? selectedTariffForEdit.RateId),
        categoryId: Number(selectedTariffForEdit.categoryId ?? selectedTariffForEdit.CategoryId),
        tariffVersionId: Number(selectedTariffVersionId || selectedTariffForEdit.tariffVersionId || selectedTariffForEdit.TariffVersionId || 0),
        cubicMeter: Number(document.getElementById('editCubicMeterInput').value),
        amount: Number(document.getElementById('editAmountInput').value),
      });

      closeEditModal();
      await loadTariffsByVersion();
      showNotification('Rate updated successfully.', 'success');
    } catch (error) {
      console.error(error);
      showNotification(error.message || 'Failed to update rate.', 'error');
    }
  });
}

function setupDeleteRateModal() {
  const overlay = document.getElementById('deleteModalOverlay');
  const closeBtn = document.getElementById('deleteModalCloseBtn');
  const cancelBtn = document.getElementById('deleteCancelBtn');
  const confirmBtn = document.getElementById('confirmDeleteBtn');

  const closeDeleteModal = () => {
    closeModal('deleteRateModal');
    selectedTariffForDelete = null;
  };

  document.addEventListener('click', (event) => {
    const btn = event.target.closest('.delete-btn');
    if (!btn) return;

    const rateId = Number(btn.getAttribute('data-rate-id'));
    selectedTariffForDelete = tariffsCache.find((t) => Number(t.rateId ?? t.RateId ?? 0) === rateId) || null;
    if (!selectedTariffForDelete) return;

    document.getElementById('deleteCubicMeterValue').textContent = String(toNumber(selectedTariffForDelete.cubicMeter ?? selectedTariffForDelete.CubicMeter));
    document.getElementById('deleteAmountValue').textContent = toNumber(selectedTariffForDelete.amount ?? selectedTariffForDelete.Amount).toFixed(2);
    openModal('deleteRateModal');
  });

  if (overlay) overlay.addEventListener('click', closeDeleteModal);
  if (closeBtn) closeBtn.addEventListener('click', closeDeleteModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeDeleteModal);

  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      if (!selectedTariffForDelete) return;

      try {
        const api = getApi();
        const rateId = Number(selectedTariffForDelete.rateId ?? selectedTariffForDelete.RateId);
        await api.delete(`/Tariffs?id=${rateId}`);

        closeDeleteModal();
        await loadTariffsByVersion();
        showNotification('Rate deleted successfully.', 'success');
      } catch (error) {
        console.error(error);
        showNotification(error.message || 'Failed to delete rate.', 'error');
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  setupSidebar();
  setupVersionControls();
  setupDeleteVersionModal();
  setupCreateVersionModal();
  setupEditVersionModal();
  setupAddRateModal();
  setupEditRateModal();
  setupDeleteRateModal();

  try {
    await loadTariffVersions();
  } catch (error) {
    console.error(error);
    showNotification('Failed to load tariff versions.', 'error');
  }
});
