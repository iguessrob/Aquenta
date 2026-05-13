(function () {
  const API_PATH = '/landingpage/home';

  const blankState = {
    settings: {
      officeName: '',
      addressLine1: '',
      officeHoursWeekdays: '',
      landlineNumber: '',
      emailAddress: '',
      googleMapsEmbedUrl: ''
    },
    faqs: []
  };

  const els = {
    form: document.getElementById('landingPageForm'),
    faqList: document.getElementById('faqEditorList'),
    addFaqBtn: document.getElementById('addFaqBtn'),
    saveContactBtn: document.getElementById('saveContactBtn'),
    updateMapBtn: document.getElementById('updateMapBtn'),
    previewMap: document.getElementById('previewMapFrame'),
    // Modals
    addFaqModal: document.getElementById('addFaqModal'),
    addFaqForm: document.getElementById('addFaqForm'),
    editFaqModal: document.getElementById('editFaqModal'),
    editFaqForm: document.getElementById('editFaqForm'),
    deleteFaqModal: document.getElementById('deleteFaqModal'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn')
  };

  let state = clone(blankState);
  let editingFaqIndex = -1;
  let deletingFaqIndex = -1;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function escape(value) {
    return window.AquentaApiClient && typeof window.AquentaApiClient.escapeHtml === 'function'
      ? window.AquentaApiClient.escapeHtml(value)
      : String(value ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
  }

  function setStatus(message, type = 'info') {
    if (window.showNotification) {
      window.showNotification(message, type === 'info' ? 'success' : type);
    }
  }

  function mapApiSettingsToEditor(settings) {
    return {
      officeName: settings && (settings.officeName || settings.OfficeName) ? (settings.officeName || settings.OfficeName) : '',
      addressLine1: settings && (settings.addressLine1 || settings.Address) ? (settings.addressLine1 || settings.Address) : '',
      officeHoursWeekdays: settings && (settings.officeHoursWeekdays || settings.OfficeHours) ? (settings.officeHoursWeekdays || settings.OfficeHours) : '',
      landlineNumber: settings && (settings.landlineNumber || settings.LandlineNumber) ? (settings.landlineNumber || settings.LandlineNumber) : '',
      emailAddress: settings && (settings.emailAddress || settings.EmailAddress) ? (settings.emailAddress || settings.EmailAddress) : '',
      googleMapsEmbedUrl: settings && (settings.googleMapsEmbedUrl || settings.googleMapsEmbedCode || settings.GoogleMapsEmbedCode)
        ? (settings.googleMapsEmbedUrl || settings.googleMapsEmbedCode || settings.GoogleMapsEmbedCode)
        : ''
    };
  }

  function mapEditorSettingsToApi(settings) {
    return {
      LandingPageSettingsID: settings && settings.landingPageSettingsID ? settings.landingPageSettingsID : 0,
      OfficeName: (settings && settings.officeName ? settings.officeName : '').trim(),
      Address: (settings && settings.addressLine1 ? settings.addressLine1 : '').trim(),
      OfficeHours: (settings && settings.officeHoursWeekdays ? settings.officeHoursWeekdays : '').trim(),
      LandlineNumber: (settings && settings.landlineNumber ? settings.landlineNumber : '').trim(),
      EmailAddress: (settings && settings.emailAddress ? settings.emailAddress : '').trim(),
      GoogleMapsEmbedCode: (settings && settings.googleMapsEmbedUrl ? settings.googleMapsEmbedUrl : '').trim()
    };
  }

  function mapFaqsToEditor(faqs) {
    return Array.isArray(faqs)
      ? faqs.map((faq, index) => ({
          landingPageFaqID: faq && (faq.landingPageFaqID || faq.LandingPageFaqID) ? (faq.landingPageFaqID || faq.LandingPageFaqID) : 0,
          question: faq && (faq.question || faq.Question) ? (faq.question || faq.Question) : '',
          answer: faq && (faq.answer || faq.Answer) ? (faq.answer || faq.Answer) : '',
          sortOrder: faq && (faq.sortOrder || faq.SortOrder) ? (faq.sortOrder || faq.SortOrder) : index + 1
        }))
      : [];
  }

  function mapFaqsToApi(faqs) {
    return Array.isArray(faqs)
      ? faqs.map((faq, index) => ({
          LandingPageFaqID: faq && faq.landingPageFaqID ? faq.landingPageFaqID : 0,
          Question: (faq && faq.question ? faq.question : '').trim(),
          Answer: (faq && faq.answer ? faq.answer : '').trim(),
          SortOrder: faq && faq.sortOrder ? faq.sortOrder : index + 1
        })).filter((faq) => faq.Question || faq.Answer)
      : [];
  }

  function mapFaqRowsToState() {
    // No longer used - FAQs are now managed via modals and state object
    // Kept for backward compatibility
    return state.faqs;
  }

  function getSettingsFromForm() {
    return {
      officeName: document.getElementById('officeNameField').value.trim(),
      addressLine1: document.getElementById('addressLine1Field').value.trim(),
      officeHoursWeekdays: document.getElementById('officeHoursWeekdaysField').value.trim(),
      landlineNumber: document.getElementById('landlineNumberField').value.trim(),
      emailAddress: document.getElementById('emailAddressField').value.trim(),
      googleMapsEmbedUrl: document.getElementById('googleMapsEmbedUrlField').value.trim()
    };
  }

  function getFaqsFromForm() {
    // FAQs are now managed via modals and stored in state.faqs
    return state.faqs.filter((item) => item.question || item.answer);
  }

  function syncStateFromForm() {
    // Sync only settings (not FAQs) since FAQs are managed via modals
    state.settings = getSettingsFromForm();
    // state.faqs is already managed by modal handlers
  }

  function renderFaqRows() {
    if (!els.faqList) return;

    els.faqList.innerHTML = state.faqs.length ? state.faqs.map((faq, index) => `
      <article class="faq-editor-row" data-index="${index}" data-faq-id="${faq.landingPageFaqID || 0}">
        <div class="faq-editor-row-header">
          <strong>FAQ ${index + 1}</strong>
          <div class="faq-row-actions">
            <button type="button" class="icon-btn" data-action="move-up" aria-label="Move FAQ up">↑</button>
            <button type="button" class="icon-btn" data-action="move-down" aria-label="Move FAQ down">↓</button>
            <button type="button" class="icon-btn" data-action="edit" aria-label="Edit FAQ">✎</button>
            <button type="button" class="icon-btn danger" data-action="delete" aria-label="Delete FAQ">×</button>
          </div>
        </div>
        <div class="preview-block">
          <strong>Q: ${escape(faq.question)}</strong>
          <p style="margin: 8px 0 0; white-space: pre-wrap;">${escape(faq.answer)}</p>
        </div>
      </article>
    `).join('') : `
      <div class="empty-state">
        Add at least one FAQ so the landing page has content to display.
      </div>
    `;

    els.faqList.querySelectorAll('.faq-editor-row').forEach((row) => {
      const index = Number(row.dataset.index);

      row.querySelector('[data-action="move-up"]').addEventListener('click', () => moveFaq(index, -1));
      row.querySelector('[data-action="move-down"]').addEventListener('click', () => moveFaq(index, 1));
      row.querySelector('[data-action="edit"]').addEventListener('click', () => showEditFaqModal(index));
      row.querySelector('[data-action="delete"]').addEventListener('click', () => showDeleteConfirmModal(index));
    });
  }

  function moveFaq(index, direction) {
    syncStateFromForm();

    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= state.faqs.length) {
      return;
    }

    const [item] = state.faqs.splice(index, 1);
    state.faqs.splice(targetIndex, 0, item);
    renderFaqRows();
    updatePreview();
  }

  function removeFaq(index) {
    syncStateFromForm();
    state.faqs.splice(index, 1);
    renderFaqRows();
    updatePreview();
  }

  function addFaq() {
    syncStateFromForm();
    state.faqs.push({ landingPageFaqID: 0, question: '', answer: '', sortOrder: state.faqs.length + 1 });
    renderFaqRows();
    updatePreview();
  }

  // Modal Management Functions
  function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('visible');
    }
  }

  function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('visible');
    }
  }

  function showAddFaqModal() {
    document.getElementById('addFaqQuestion').value = '';
    document.getElementById('addFaqAnswer').value = '';
    editingFaqIndex = -1;
    showModal('addFaqModal');
  }

  function showEditFaqModal(index) {
    const faq = state.faqs[index];
    if (!faq) return;

    document.getElementById('editFaqQuestion').value = faq.question || '';
    document.getElementById('editFaqAnswer').value = faq.answer || '';
    editingFaqIndex = index;
    showModal('editFaqModal');
  }

  function showDeleteConfirmModal(index) {
    deletingFaqIndex = index;
    showModal('deleteFaqModal');
  }

  function handleAddFaq(event) {
    event.preventDefault();
    const question = document.getElementById('addFaqQuestion').value.trim();
    const answer = document.getElementById('addFaqAnswer').value.trim();

    if (!question || !answer) {
      setStatus('Question and Answer are required', 'error');
      return;
    }

    syncStateFromForm();
    state.faqs.push({
      landingPageFaqID: 0,
      question,
      answer,
      sortOrder: state.faqs.length + 1
    });

    renderFaqRows();
    updatePreview();
    hideModal('addFaqModal');
    setStatus('FAQ added', 'success');
  }

  function handleEditFaq(event) {
    event.preventDefault();
    if (editingFaqIndex < 0) return;

    const question = document.getElementById('editFaqQuestion').value.trim();
    const answer = document.getElementById('editFaqAnswer').value.trim();

    if (!question || !answer) {
      setStatus('Question and Answer are required', 'error');
      return;
    }

    syncStateFromForm();
    state.faqs[editingFaqIndex] = {
      ...state.faqs[editingFaqIndex],
      question,
      answer
    };

    renderFaqRows();
    updatePreview();
    hideModal('editFaqModal');
    setStatus('FAQ updated', 'success');
    editingFaqIndex = -1;
  }

  function handleDeleteFaq() {
    if (deletingFaqIndex < 0) return;

    syncStateFromForm();
    state.faqs.splice(deletingFaqIndex, 1);
    renderFaqRows();
    updatePreview();
    hideModal('deleteFaqModal');
    setStatus('FAQ deleted', 'success');
    deletingFaqIndex = -1;
  }

  function applyState(nextState) {
    const editorSettings = mapApiSettingsToEditor(nextState && nextState.settings ? nextState.settings : null);
    state = {
      settings: { ...clone(blankState).settings, ...editorSettings },
      faqs: Array.isArray(nextState && nextState.faqs) && nextState.faqs.length ? mapFaqsToEditor(nextState.faqs) : clone(blankState).faqs
    };

    document.getElementById('officeNameField').value = state.settings.officeName || '';
    document.getElementById('addressLine1Field').value = state.settings.addressLine1 || '';
    document.getElementById('officeHoursWeekdaysField').value = state.settings.officeHoursWeekdays || '';
    document.getElementById('landlineNumberField').value = state.settings.landlineNumber || '';
    document.getElementById('emailAddressField').value = state.settings.emailAddress || '';
    document.getElementById('googleMapsEmbedUrlField').value = state.settings.googleMapsEmbedUrl || '';

    renderFaqRows();
    updatePreview();
  }

  function updatePreview() {
    syncStateFromForm();
    const formSettings = state.settings;

    if (els.previewMap && formSettings.googleMapsEmbedUrl) {
      try {
        els.previewMap.srcdoc = formSettings.googleMapsEmbedUrl;
      } catch (e) {
        // if srcdoc fails, try to extract src from iframe
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = formSettings.googleMapsEmbedUrl;
        const iframe = tempDiv.querySelector('iframe');
        if (iframe && iframe.src) {
          els.previewMap.src = iframe.src;
          els.previewMap.srcdoc = '';
        }
      }
    }
  }

  async function fetchLandingPageWithRetry(maxAttempts = 4, delayMs = 600) {
    if (!(window.AquentaApiClient && typeof window.AquentaApiClient.getLandingPage === 'function')) {
      throw new Error('API client is not available.');
    }

    let lastError = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await window.AquentaApiClient.getLandingPage();
      } catch (error) {
        lastError = error;
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    throw lastError || new Error('Failed to load landing page content.');
  }

  async function loadContent() {
    try {
      const payload = await fetchLandingPageWithRetry();
      if (payload) {
        applyState(payload);
        setStatus('Loaded landing-page content from the API.', 'success');
        return;
      }
    } catch (error) {
      console.error('Failed to load landing page content from API:', error);
    }

    applyState(blankState);
    setStatus('Unable to load landing-page content from the API.', 'warning');
  }

  async function saveContent() {
    const settings = getSettingsFromForm();
    const faqs = getFaqsFromForm();
    const payload = {
      settings: mapEditorSettingsToApi(settings),
      faqs: mapFaqsToApi(faqs)
    };

    if (window.AquentaApiClient && typeof window.AquentaApiClient.saveLandingPage === 'function') {
      try {
        await window.AquentaApiClient.saveLandingPage(payload);
        await loadContent();
        setStatus('Landing-page content saved to the API.', 'success');
        return;
      } catch (error) {
        console.error('Failed to save landing page content to API:', error);
        setStatus('Unable to save landing-page content to the API.', 'warning');
        return;
      }
    }

    setStatus('API client is not available.', 'warning');
  }

  function resetContent() {
    applyState(blankState);
    setStatus('Reset to blank fields.', 'info');
  }

  function bindFormEvents() {
    const fieldIds = [
      'officeNameField', 'addressLine1Field', 'officeHoursWeekdaysField',
      'landlineNumberField', 'emailAddressField', 'googleMapsEmbedUrlField'
    ];

    fieldIds.forEach((id) => {
      const field = document.getElementById(id);
      if (field) {
        field.addEventListener('input', updatePreview);
        field.addEventListener('change', updatePreview);
      }
    });

    // Add FAQ button
    els.addFaqBtn.addEventListener('click', showAddFaqModal);

    // Add FAQ form submission
    els.addFaqForm.addEventListener('submit', handleAddFaq);

    // Edit FAQ form submission
    els.editFaqForm.addEventListener('submit', handleEditFaq);

    // Delete confirmation
    els.confirmDeleteBtn.addEventListener('click', handleDeleteFaq);

    // Save contact button
    els.saveContactBtn.addEventListener('click', (e) => {
      e.preventDefault();
      saveContent();
    });

    // Update map button
    els.updateMapBtn.addEventListener('click', (e) => {
      e.preventDefault();
      updatePreview();
      setStatus('Map preview updated', 'success');
    });

    // Form submission
    els.form.addEventListener('submit', (event) => {
      event.preventDefault();
      saveContent();
    });

    // Modal close buttons and overlay clicks
    document.querySelectorAll('[data-modal-close]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const modalId = e.target.dataset.modalClose;
        hideModal(modalId);
      });
    });

    // Close modal when clicking overlay
    document.querySelectorAll('.modal-overlay').forEach((overlay) => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          hideModal(overlay.id);
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindFormEvents();
    loadContent();
  });
})();