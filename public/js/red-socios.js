(() => {
  'use strict';
  const STORAGE_KEY = 'tuplus-partner-application-v1';
  const STORAGE_TTL = 30 * 24 * 60 * 60 * 1000;
  const form = document.getElementById('partner-form');
  const panels = [...document.querySelectorAll('.step-panel')];
  if (!form || panels.length !== 8) return;

  let currentStep = 0;
  const back = document.getElementById('back-step');
  const next = document.getElementById('next-step');
  const finish = document.getElementById('finish-demo');
  const counter = document.getElementById('step-count');
  const progress = document.getElementById('progress');
  const progressFill = progress.querySelector('span');

  const countrySelect = document.getElementById('country-select');
  const cityInput = document.getElementById('territory-select');
  const cityOptions = document.getElementById('city-options');
  const cityLoadStatus = document.getElementById('city-load-status');
  let cityRequest = 0;

  const territoryData = {
    lima: { name: 'Lima', status: 'Abierta', style: 'status-open', copy: 'Puedes postularte ahora.', enabled: true },
    arequipa: { name: 'Arequipa', status: 'Cupos limitados', style: 'status-limited', copy: 'Quedan pocos cupos para iniciar una postulación.', enabled: true },
    trujillo: { name: 'Trujillo', status: 'Futura', style: 'status-future', copy: 'Próximamente disponible. Por ahora no puedes iniciar una postulación aquí.', enabled: false },
    cusco: { name: 'Cusco', status: 'Cerrada', style: 'status-closed', copy: 'No aceptamos más postulaciones por el momento.', enabled: false }
  };

  function normalize(value) {
    return String(value || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
  }

  async function loadCities(preserveValue = false) {
    const requestId = ++cityRequest;
    const selected = countrySelect.selectedOptions[0];
    if (!selected || !selected.value) {
      cityOptions.replaceChildren();
      cityInput.value = '';
      cityInput.disabled = true;
      cityInput.placeholder = 'Primero selecciona un país';
      cityLoadStatus.textContent = 'Selecciona un país para cargar sus ciudades.';
      return;
    }
    const previousCity = preserveValue ? cityInput.value : '';
    if (!preserveValue) cityInput.value = '';
    cityOptions.replaceChildren();
    cityInput.disabled = true;
    cityInput.placeholder = 'Cargando ciudades…';
    cityLoadStatus.textContent = 'Cargando ciudades de ' + selected.textContent + '…';
    try {
      const response = await fetch('https://countriesnow.space/api/v0.1/countries/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: selected.dataset.apiName || selected.textContent.trim() })
      });
      if (!response.ok) throw new Error('City lookup failed');
      const result = await response.json();
      if (requestId !== cityRequest) return;
      if (result.error || !Array.isArray(result.data)) throw new Error('City list unavailable');
      const cities = [...new Set(result.data.filter(city => typeof city === 'string' && city.trim()))]
        .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
      const fragment = document.createDocumentFragment();
      cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        fragment.append(option);
      });
      cityOptions.append(fragment);
      if (preserveValue) cityInput.value = previousCity;
      cityLoadStatus.textContent = cities.length
        ? cities.length.toLocaleString('es') + ' ciudades disponibles para ' + selected.textContent + '. Escribe para buscar.'
        : 'No encontramos ciudades para este país. Puedes escribir tu ciudad.';
    } catch {
      if (requestId !== cityRequest) return;
      if (preserveValue) cityInput.value = previousCity;
      cityLoadStatus.textContent = 'No se pudo cargar la lista de ciudades. Puedes escribir tu ciudad.';
    }
    if (requestId === cityRequest) {
      cityInput.disabled = false;
      cityInput.placeholder = 'Empieza a escribir una ciudad';
      updateTerritory();
      if (!preserveValue) saveDraft();
    }
  }

  function updateTerritory() {
    const city = cityInput.value.trim();
    const country = countrySelect.value;
    let item;
    if (!country) item = { name: 'Elige tu territorio', status: 'Pendiente', style: 'status-unavailable', copy: 'Selecciona primero un país y una ciudad.', enabled: false };
    else if (!city) item = { name: countrySelect.selectedOptions[0]?.textContent || country, status: 'Elige una ciudad', style: 'status-unavailable', copy: 'Selecciona o escribe una ciudad para consultar su disponibilidad.', enabled: false };
    else if (country !== 'PE') item = { name: city, status: 'No disponible', style: 'status-unavailable', copy: 'La Red todavía no está disponible para tu país o región.', enabled: false };
    else item = territoryData[normalize(city)] || { name: city, status: 'Cerrada', style: 'status-closed', copy: 'No aceptamos más postulaciones en este territorio por el momento.', enabled: false };
    const status = document.getElementById('territory-status');
    const result = document.getElementById('territory-result');
    status.className = 'territory-status ' + item.style;
    status.textContent = item.status;
    document.getElementById('territory-result-title').textContent = item.name;
    document.getElementById('territory-result-copy').textContent = item.copy;
    result.dataset.unavailable = String(!item.enabled);
    const startLink = document.getElementById('start-application');
    startLink.setAttribute('aria-disabled', String(!item.enabled));
  }

  function readDraft() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const draft = JSON.parse(raw);
      if (!draft || !Number.isFinite(draft.savedAt) || Date.now() - draft.savedAt > STORAGE_TTL || !Array.isArray(draft.values)) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      const safeFields = new Map([...form.elements].filter(el => el.name && el.type !== 'file' && !el.hasAttribute('data-sensitive')).map(el => [el.name, el]));
      draft.values = draft.values.filter(entry => entry && safeFields.has(entry.name));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      return draft;
    } catch {
      return null;
    }
  }

  function saveDraft() {
    const values = [...form.elements].filter(el => el.name && el.type !== 'file' && !el.hasAttribute('data-sensitive')).map(el => ({
      name: el.name,
      value: el.type === 'checkbox' ? el.checked : el.value
    }));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: Date.now(), step: currentStep, values }));
    } catch { /* Keep the form usable when browser storage is unavailable. */ }
  }

  function restoreDraft() {
    const draft = readDraft();
    if (!draft) return false;
    const byName = new Map([...form.elements].filter(el => el.name).map(el => [el.name, el]));
    draft.values.forEach(({ name, value }) => {
      const field = byName.get(name);
      if (!field || field.type === 'file' || field.hasAttribute('data-sensitive')) return;
      if (field.type === 'checkbox') field.checked = Boolean(value);
      else if (typeof value === 'string') field.value = value;
    });
    currentStep = Math.max(0, Math.min(7, Number.parseInt(draft.step, 10) || 0));
    return true;
  }

  function updateReview() {
    const labels = {
      territoryCountry: 'País', territory: 'Ciudad', name: 'Nombre', email: 'Correo', phone: 'Teléfono',
      referenceName: 'Referencia', referenceRelation: 'Relación profesional', referenceContact: 'Contacto de referencia',
      experienceYears: 'Experiencia', experienceSector: 'Sector', experienceDetails: 'Trayectoria',
      interest: 'Interés', solutionsInterest: 'Soluciones de interés'
    };
    const review = document.getElementById('review-list');
    review.replaceChildren();
    Object.entries(labels).forEach(([name, label]) => {
      const field = form.elements.namedItem(name);
      if (!field) return;
      const value = name === 'territoryCountry'
        ? (countrySelect.selectedOptions[0]?.textContent || '')
        : String(field.value || '').trim();
      if (!value) return;
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = label;
      dd.textContent = value;
      review.append(dt, dd);
    });
    const documentSummary = [
      ['Documento de identidad', form.elements.namedItem('dniNumber')?.value],
      ['RUC', form.elements.namedItem('rucNumber')?.value],
      ['Foto delantera', form.elements.namedItem('dniFront')?.files?.[0]?.name],
      ['Foto posterior', form.elements.namedItem('dniBack')?.files?.[0]?.name]
    ];
    documentSummary.forEach(([label, value]) => {
      if (!value) return;
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = label;
      dd.textContent = value;
      review.append(dt, dd);
    });
  }

  function updateDocumentFields() {
    const isPeru = countrySelect.value === 'PE';
    const dniLabel = document.getElementById('dni-label');
    const dniInput = document.getElementById('dni-number');
    const rucField = document.getElementById('ruc-field');
    const rucInput = document.getElementById('ruc-number');
    dniLabel.childNodes[0].textContent = isPeru ? 'DNI ' : 'Documento de identidad ';
    dniInput.maxLength = isPeru ? 8 : 30;
    dniInput.pattern = isPeru ? '[0-9]{8}' : '.{5,30}';
    dniInput.placeholder = isPeru ? '8 dígitos' : 'Número de documento';
    rucField.hidden = !isPeru;
    rucInput.disabled = !isPeru;
    if (!isPeru) rucInput.value = '';
  }

  const previewUrls = new Map();
  function handleDocumentFile(input) {
    const file = input.files?.[0];
    const status = document.getElementById(input.id + '-name');
    const removeButton = document.getElementById(input.id + '-remove');
    const previews = document.getElementById('document-previews');
    const priorUrl = previewUrls.get(input.id);
    if (priorUrl) URL.revokeObjectURL(priorUrl);
    previewUrls.delete(input.id);
    previews.querySelector('[data-preview-for="' + input.id + '"]')?.remove();
    input.setCustomValidity('');
    if (!file) { status.textContent = ''; removeButton.hidden = true; return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      input.value = '';
      status.textContent = 'Formato no válido. Elige JPG, PNG o WebP.';
      removeButton.hidden = true;
      input.setCustomValidity('Elige una imagen JPG, PNG o WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      input.value = '';
      status.textContent = 'La imagen supera el máximo de 5 MB.';
      removeButton.hidden = true;
      input.setCustomValidity('La imagen debe pesar 5 MB o menos.');
      return;
    }
    status.textContent = file.name;
    removeButton.hidden = false;
    const url = URL.createObjectURL(file);
    previewUrls.set(input.id, url);
    const preview = document.createElement('div');
    preview.className = 'document-preview-item';
    preview.dataset.previewFor = input.id;
    const image = document.createElement('img');
    image.src = url;
    image.alt = input.id === 'dni-front' ? 'Vista previa de la parte delantera' : 'Vista previa de la parte posterior';
    preview.append(image);
    previews.append(preview);
  }

  function renderStep() {
    panels.forEach((panel, index) => {
      panel.hidden = index !== currentStep;
      panel.setAttribute('aria-hidden', String(index !== currentStep));
    });
    counter.textContent = 'Paso ' + (currentStep + 1) + ' de 8';
    progress.setAttribute('aria-valuenow', String(currentStep + 1));
    progressFill.style.width = (((currentStep + 1) / 8) * 100) + '%';
    back.hidden = currentStep === 0;
    next.hidden = currentStep === 7;
    finish.hidden = currentStep !== 7;
    if (currentStep === 6) updateReview();
    panels[currentStep].querySelector('h3')?.focus({ preventScroll: true });
  }

  function validateCurrentStep() {
    const fields = [...panels[currentStep].querySelectorAll('input,select,textarea')];
    const firstInvalid = fields.find(field => !field.checkValidity());
    if (firstInvalid) {
      firstInvalid.reportValidity();
      return false;
    }
    return true;
  }

  countrySelect.addEventListener('change', () => {
    updateDocumentFields();
    updateTerritory();
    saveDraft();
    loadCities();
  });
  cityInput.addEventListener('input', () => {
    updateTerritory();
    saveDraft();
  });
  cityInput.addEventListener('change', updateTerritory);
  document.getElementById('start-application').addEventListener('click', event => {
    if (document.getElementById('territory-result').dataset.unavailable === 'true') event.preventDefault();
  });
  const restored = restoreDraft();
  updateDocumentFields();
  updateTerritory();
  renderStep();
  if (restored && countrySelect.value) loadCities(true);

  form.addEventListener('input', saveDraft);
  form.addEventListener('change', saveDraft);
  ['dni-front', 'dni-back'].forEach(id => {
    const input = document.getElementById(id);
    input.addEventListener('change', () => handleDocumentFile(input));
    document.getElementById(id + '-remove').addEventListener('click', () => {
      input.value = '';
      input.setCustomValidity('');
      handleDocumentFile(input);
    });
  });
  next.addEventListener('click', () => {
    if (!validateCurrentStep()) return;
    currentStep = Math.min(7, currentStep + 1);
    saveDraft();
    renderStep();
  });
  back.addEventListener('click', () => {
    currentStep = Math.max(0, currentStep - 1);
    saveDraft();
    renderStep();
  });
  finish.addEventListener('click', () => {
    if (!validateCurrentStep()) return;
    document.getElementById('submission-result').textContent = 'Revisión completada. No se enviaron datos a TUPLUS.';
    finish.disabled = true;
    finish.textContent = 'Revisión completada';
  });
})();
