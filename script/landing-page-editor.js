(function () {
  const STORAGE_KEY = 'aquentaLandingPageDraft';
  const API_PATH = '/landing-page/home';

  const defaultState = {
    settings: {
      pageTitle: 'Frequently Asked Questions',
      pageSubtitle: 'Keep the landing page content current without editing HTML.',
      officeName: 'St. Joseph Water Billing Cooperative',
      addressLine1: 'San Jose Sto. Tomas City Batangas',
      addressLine2: '',
      officeHoursWeekdays: 'Monday - Saturday: 8:00 AM - 5:00 PM',
      officeHoursClosed: 'Sunday & Holidays: Closed',
      landlineNumber: '0433329827',
      emailAddress: 'stjosephstb@gmail.com',
      googleMapsEmbedUrl: '',
      googleMapsPlaceId: '',
      mapLatitude: '',
      mapLongitude: '',
      mapZoomLevel: '15'
    },
    faqs: [
      {
        question: 'Can I update my personal information online?',
        answer: 'Basic account details may be viewable online, but major changes must be requested at the cooperative office for verification.'
      },
      {
        question: 'What happens if I miss a payment?',
        answer: 'Late payments may incur additional charges. Please contact the office immediately if you need assistance.'
      }
    ]
  };

  const els = {
    form: document.getElementById('landingPageForm'),
    status: document.getElementById('editorStatus'),
    saveBtn: document.getElementById('saveLandingPageBtn'),
    loadBtn: document.getElementById('loadLandingPageBtn'),
    resetBtn: document.getElementById('resetLandingPageBtn'),
    faqList: document.getElementById('faqEditorList'),
    addFaqBtn: document.getElementById('addFaqBtn'),
    previewMap: document.getElementById('previewMapFrame'),
    previewTitle: document.getElementById('previewTitle'),
    previewSubtitle: document.getElementById('previewSubtitle'),
    previewOfficeName: document.getElementById('previewOfficeName'),
    previewAddress: document.getElementById('previewAddress'),
    previewHours: document.getElementById('previewHours'),
    previewLandline: document.getElementById('previewLandline'),
    previewEmail: document.getElementById('previewEmail')
  };

  let state = clone(defaultState);

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
    if (els.status) {
      els.status.dataset.type = type;
      els.status.textContent = message;
    }

    if (window.showNotification) {
      window.showNotification(message, type === 'info' ? 'success' : type);
    }
  }

  function buildMapSrc(settings) {
    if (settings.googleMapsEmbedUrl) {
      return settings.googleMapsEmbedUrl;
    }

    const latitude = String(settings.mapLatitude || '').trim();
    const longitude = String(settings.mapLongitude || '').trim();

    if (latitude && longitude) {
      return `https://www.google.com/maps?q=${encodeURIComponent(`${latitude},${longitude}`)}&z=${settings.mapZoomLevel || 15}&output=embed`;
    }

    return '';
  }

  function getSettingsFromForm() {
    return {
      pageTitle: document.getElementById('pageTitleField').value.trim(),
      pageSubtitle: document.getElementById('pageSubtitleField').value.trim(),
      officeName: document.getElementById('officeNameField').value.trim(),
      addressLine1: document.getElementById('addressLine1Field').value.trim(),
      addressLine2: document.getElementById('addressLine2Field').value.trim(),
      officeHoursWeekdays: document.getElementById('officeHoursWeekdaysField').value.trim(),
      officeHoursClosed: document.getElementById('officeHoursClosedField').value.trim(),
      landlineNumber: document.getElementById('landlineNumberField').value.trim(),
      emailAddress: document.getElementById('emailAddressField').value.trim(),
      googleMapsEmbedUrl: document.getElementById('googleMapsEmbedUrlField').value.trim(),
      googleMapsPlaceId: document.getElementById('googleMapsPlaceIdField').value.trim(),
      mapLatitude: document.getElementById('mapLatitudeField').value.trim(),
      mapLongitude: document.getElementById('mapLongitudeField').value.trim(),
      mapZoomLevel: document.getElementById('mapZoomLevelField').value.trim()
    };
  }

  function getFaqsFromForm() {
    const rows = Array.from(els.faqList.querySelectorAll('.faq-editor-row'));

    return rows.map((row) => ({
      question: row.querySelector('[data-field="question"]').value.trim(),
      answer: row.querySelector('[data-field="answer"]').value.trim()
    })).filter((item) => item.question || item.answer);
  }

  function syncStateFromForm() {
    state.settings = getSettingsFromForm();
    state.faqs = Array.from(els.faqList.querySelectorAll('.faq-editor-row')).map((row) => ({
      question: row.querySelector('[data-field="question"]').value.trim(),
      answer: row.querySelector('[data-field="answer"]').value.trim()
    }));
  }

  function renderFaqRows() {
    if (!els.faqList) return;

    els.faqList.innerHTML = state.faqs.length ? state.faqs.map((faq, index) => `
      <article class="faq-editor-row" data-index="${index}">
        <div class="faq-editor-row-header">
          <strong>FAQ ${index + 1}</strong>
          <div class="faq-row-actions">
            <button type="button" class="icon-btn" data-action="move-up" aria-label="Move FAQ up">↑</button>
            <button type="button" class="icon-btn" data-action="move-down" aria-label="Move FAQ down">↓</button>
            <button type="button" class="icon-btn danger" data-action="remove" aria-label="Delete FAQ">×</button>
          </div>
        </div>
        <label class="field-label">Question</label>
        <input type="text" class="field-input" data-field="question" value="${escape(faq.question)}" maxlength="300" placeholder="Enter the question">
        <label class="field-label">Answer</label>
        <textarea class="field-textarea" data-field="answer" rows="3" maxlength="1000" placeholder="Enter the answer">${escape(faq.answer)}</textarea>
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
      row.querySelector('[data-action="remove"]').addEventListener('click', () => removeFaq(index));
      row.querySelector('[data-field="question"]').addEventListener('input', updatePreview);
      row.querySelector('[data-field="answer"]').addEventListener('input', updatePreview);
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
    state.faqs.push({ question: '', answer: '' });
    renderFaqRows();
    updatePreview();
  }

  function applyState(nextState) {
    state = {
      settings: { ...clone(defaultState).settings, ...(nextState && nextState.settings ? nextState.settings : {}) },
      faqs: Array.isArray(nextState && nextState.faqs) && nextState.faqs.length ? nextState.faqs : clone(defaultState).faqs
    };

    document.getElementById('pageTitleField').value = state.settings.pageTitle || '';
    document.getElementById('pageSubtitleField').value = state.settings.pageSubtitle || '';
    document.getElementById('officeNameField').value = state.settings.officeName || '';
    document.getElementById('addressLine1Field').value = state.settings.addressLine1 || '';
    document.getElementById('addressLine2Field').value = state.settings.addressLine2 || '';
    document.getElementById('officeHoursWeekdaysField').value = state.settings.officeHoursWeekdays || '';
    document.getElementById('officeHoursClosedField').value = state.settings.officeHoursClosed || '';
    document.getElementById('landlineNumberField').value = state.settings.landlineNumber || '';
    document.getElementById('emailAddressField').value = state.settings.emailAddress || '';
    document.getElementById('googleMapsEmbedUrlField').value = state.settings.googleMapsEmbedUrl || '';
    document.getElementById('googleMapsPlaceIdField').value = state.settings.googleMapsPlaceId || '';
    document.getElementById('mapLatitudeField').value = state.settings.mapLatitude || '';
    document.getElementById('mapLongitudeField').value = state.settings.mapLongitude || '';
    document.getElementById('mapZoomLevelField').value = state.settings.mapZoomLevel || '15';

    renderFaqRows();
    updatePreview();
  }

  function updatePreview() {
    syncStateFromForm();
    const formSettings = state.settings;
    const combinedFaqs = state.faqs;

    if (els.previewTitle) els.previewTitle.textContent = formSettings.pageTitle || 'Landing Page';
    if (els.previewSubtitle) els.previewSubtitle.textContent = formSettings.pageSubtitle || '';
    if (els.previewOfficeName) els.previewOfficeName.textContent = formSettings.officeName || 'Office';
    if (els.previewAddress) {
      els.previewAddress.innerHTML = [formSettings.addressLine1, formSettings.addressLine2].filter(Boolean).map(escape).join('<br>');
    }
    if (els.previewHours) {
      els.previewHours.innerHTML = [formSettings.officeHoursWeekdays, formSettings.officeHoursClosed].filter(Boolean).map(escape).join('<br>');
    }
    if (els.previewLandline) els.previewLandline.textContent = formSettings.landlineNumber || '—';
    if (els.previewEmail) els.previewEmail.textContent = formSettings.emailAddress || '—';

    if (els.previewMap) {
      const mapSrc = buildMapSrc(formSettings);
      els.previewMap.src = mapSrc || 'about:blank';
      els.previewMap.style.opacity = mapSrc ? '1' : '0.45';
    }

  }

  function getPersistedDraft() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function persistDraft(payload) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  async function loadContent() {
    if (window.AquentaApiClient) {
      try {
        const payload = await window.AquentaApiClient.get(API_PATH);
        if (payload) {
          applyState(payload);
          persistDraft(payload);
          setStatus('Loaded landing-page content from the API.', 'success');
          return;
        }
      } catch (error) {
        // fall through to draft/default state
      }
    }

    const draft = getPersistedDraft();
    applyState(draft || defaultState);
    setStatus(draft ? 'Loaded local draft because the API is not available yet.' : 'Loaded default content. Save to create your first draft.', 'warning');
  }

  async function saveContent() {
    const payload = {
      settings: getSettingsFromForm(),
      faqs: getFaqsFromForm()
    };

    if (window.AquentaApiClient) {
      try {
        await window.AquentaApiClient.put(API_PATH, payload);
        persistDraft(payload);
        setStatus('Landing-page content saved to the API.', 'success');
        return;
      } catch (error) {
        persistDraft(payload);
        setStatus('Saved as a local draft because the API is not ready yet.', 'warning');
        return;
      }
    }

    persistDraft(payload);
    setStatus('Saved as a local draft.', 'warning');
  }

  function resetContent() {
    localStorage.removeItem(STORAGE_KEY);
    applyState(defaultState);
    setStatus('Reset to the default editor template.', 'info');
  }

  function bindFormEvents() {
    const fieldIds = [
      'pageTitleField', 'pageSubtitleField', 'officeNameField', 'addressLine1Field', 'addressLine2Field',
      'officeHoursWeekdaysField', 'officeHoursClosedField', 'landlineNumberField', 'emailAddressField',
      'googleMapsEmbedUrlField', 'googleMapsPlaceIdField', 'mapLatitudeField', 'mapLongitudeField', 'mapZoomLevelField'
    ];

    fieldIds.forEach((id) => {
      const field = document.getElementById(id);
      field.addEventListener('input', updatePreview);
      field.addEventListener('change', updatePreview);
    });

    els.addFaqBtn.addEventListener('click', addFaq);
    els.saveBtn.addEventListener('click', saveContent);
    els.loadBtn.addEventListener('click', loadContent);
    els.resetBtn.addEventListener('click', resetContent);

    els.form.addEventListener('submit', (event) => {
      event.preventDefault();
      saveContent();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindFormEvents();
    loadContent();
  });
})();