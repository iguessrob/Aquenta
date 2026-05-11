(function () {
  const STORAGE_KEY = 'aquentaLandingPageDraft';
  const API_PATH = '/landingpage/home';

  const defaultState = {
    settings: {
      officeName: 'St. Joseph Water Billing Cooperative',
      addressLine1: 'San Jose Sto. Tomas City Batangas',
      officeHoursWeekdays: 'Monday - Saturday: 8:00AM - 5:00PM\nSunday & Holidays: Closed',
      landlineNumber: '0433329827',
      emailAddress: 'stjosephstb@gmail.com',
      googleMapsEmbedUrl: ''
    },
    faqs: [
      {
        question: 'Can I update my personal information online?',
        answer: 'Basic account details may be viewable online, but major changes (like name or address) must be requested at the cooperative office for verification.'
      },
      {
        question: 'What happens if I miss a payment?',
        answer: 'Late payments may incur additional charges. Please contact our office immediately if you anticipate difficulty meeting a payment deadline to discuss possible arrangements.'
      },
      {
        question: 'I forgot my password. What should I do?',
        answer: 'Click on the "Forgot Password" link on the login page. You\'ll receive instructions via email to reset your password securely.'
      },
      {
        question: 'Why was a penalty added to my bill?',
        answer: 'Penalties are typically added for late payments or missed payment deadlines. Check your billing statement for specific details or contact our office for clarification.'
      },
      {
        question: 'Is my personal and billing information secure?',
        answer: 'Yes, we use industry-standard encryption and security measures to protect all customer data. Your information is stored securely and is only accessible to authorized personnel.'
      },
      {
        question: 'What if I cannot log in to my account?',
        answer: 'First, try resetting your password. If issues persist, contact our support team with your account number and we\'ll help you regain access to your account.'
      }
    ]
  };

  const els = {
    form: document.getElementById('landingPageForm'),
    faqList: document.getElementById('faqEditorList'),
    addFaqBtn: document.getElementById('addFaqBtn'),
    saveContactBtn: document.getElementById('saveContactBtn'),
    updateMapBtn: document.getElementById('updateMapBtn'),
    previewMap: document.getElementById('previewMapFrame')
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
          SortOrder: index + 1
        })).filter((faq) => faq.Question || faq.Answer)
      : [];
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
    const editorSettings = mapApiSettingsToEditor(nextState && nextState.settings ? nextState.settings : null);
    state = {
      settings: { ...clone(defaultState).settings, ...editorSettings },
      faqs: Array.isArray(nextState && nextState.faqs) && nextState.faqs.length ? mapFaqsToEditor(nextState.faqs) : clone(defaultState).faqs
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
    if (window.AquentaApiClient && typeof window.AquentaApiClient.getLandingPage === 'function') {
      try {
        const payload = await window.AquentaApiClient.getLandingPage();
        if (payload) {
          applyState(payload);
          persistDraft({
            settings: mapApiSettingsToEditor(payload.settings || payload.Settings || {}),
            faqs: mapFaqsToEditor(payload.faqs || payload.Faqs || [])
          });
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
    const settings = getSettingsFromForm();
    const faqs = getFaqsFromForm();
    const payload = {
      settings: mapEditorSettingsToApi(settings),
      faqs: mapFaqsToApi(faqs)
    };

    if (window.AquentaApiClient && typeof window.AquentaApiClient.saveLandingPage === 'function') {
      try {
        await window.AquentaApiClient.saveLandingPage(payload);
        persistDraft({ settings, faqs });
        setStatus('Landing-page content saved to the API.', 'success');
        return;
      } catch (error) {
        persistDraft({ settings, faqs });
        setStatus('Saved as a local draft because the API is not ready yet.', 'warning');
        return;
      }
    }

    persistDraft({ settings, faqs });
    setStatus('Saved as a local draft.', 'warning');
  }

  function resetContent() {
    localStorage.removeItem(STORAGE_KEY);
    applyState(defaultState);
    setStatus('Reset to the default editor template.', 'info');
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

    els.addFaqBtn.addEventListener('click', addFaq);
    els.saveContactBtn.addEventListener('click', (e) => {
      e.preventDefault();
      saveContent();
    });
    els.updateMapBtn.addEventListener('click', (e) => {
      e.preventDefault();
      updatePreview();
      setStatus('Map preview updated', 'success');
    });

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