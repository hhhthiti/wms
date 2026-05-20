const statusEl = document.getElementById('status');
const fileInput = document.getElementById('pdfInput');

const DEFAULTS = {
  sapPortaria: '1111111',
  tipoVeiculo: 'CARRETA BAU',
  cnh: '1'
};

document.getElementById('processBtn').addEventListener('click', async () => {
  const file = fileInput.files?.[0];
  if (!file) {
    statusEl.textContent = 'Selecione um arquivo PDF.';
    return;
  }

  statusEl.textContent = 'Lendo PDF...';
  const buffer = await file.arrayBuffer();

  // MVP: extração simples para PDFs baseados em texto.
  const rawText = new TextDecoder('latin1').decode(buffer);
  const data = extractTransportData(rawText);

  statusEl.textContent = 'Preenchendo formulário na aba ativa...';

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    statusEl.textContent = 'Não foi possível detectar aba ativa.';
    return;
  }

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: fillFormFields,
    args: [data]
  });

  statusEl.textContent = 'Concluído. Revise os campos preenchidos.';
});

function extractByRegex(text, regex) {
  const match = text.match(regex);
  return match?.[1]?.trim() || '';
}

function normalizePlate(value) {
  if (!value) return '';
  return value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
}

function extractTransportData(text) {
  const transportadora = extractByRegex(text, /\b(?:Transportadora|Cond[oô]mino)\b\s*:?[\s\r\n]*([A-Z0-9 .&\-/]{2,})/i);
  const motorista = extractByRegex(text, /\b(?:Motorista\s*\/\s*Visitante\s*\/\s*Respons[aá]vel|Motorista)\b[\s\S]{0,120}?\n\s*([A-ZÀ-Ú' ]{5,})\s+[0-9]{1,2}[\.,]/i)
    || extractByRegex(text, /\bJSL\b[\s\r\n]+([A-ZÀ-Ú' ]{5,})\s+[0-9]/i);

  const dt = extractByRegex(text, /DT\s*[:\-]\s*([0-9]{6,})/i);
  const cpf = extractByRegex(text, /CPF\s*[:\-]\s*([0-9.\-]{11,14})/i);
  const telefone = extractByRegex(text, /\(([0-9]{2})\)\s*([0-9]{4,5}\-?[0-9]{4})/i).replace(/\s+/g, ' ');

  const plateMatches = Array.from(text.matchAll(/\b([A-Z]{3}[\-\s]?[0-9][A-Z0-9][0-9]{2})\b/g))
    .map((m) => normalizePlate(m[1]));

  const uniquePlates = [...new Set(plateMatches)].filter(Boolean);

  return {
    sapPortaria: DEFAULTS.sapPortaria,
    numeroDt: dt,
    transportadora,
    motorista,
    placa: uniquePlates[0] || '',
    placa2: uniquePlates[1] || '',
    placa3: uniquePlates[2] || '',
    tipoVeiculo: DEFAULTS.tipoVeiculo,
    telefone,
    cnh: DEFAULTS.cnh,
    cpf
  };
}

function fillFormFields(data) {
  function normalizeText(str) {
    return (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function findElementByLabel(labelHints) {
    const hints = labelHints.map(normalizeText);
    const labels = Array.from(document.querySelectorAll('label'));

    for (const label of labels) {
      const labelText = normalizeText(label.textContent);
      if (!hints.some((h) => labelText.includes(h))) continue;

      if (label.htmlFor) {
        const target = document.getElementById(label.htmlFor);
        if (target) return target;
      }

      const nested = label.querySelector('input,select,textarea');
      if (nested) return nested;
    }

    const fields = Array.from(document.querySelectorAll('input,select,textarea'));
    return fields.find((el) => {
      const id = normalizeText(el.id);
      const name = normalizeText(el.name);
      const placeholder = normalizeText(el.getAttribute('placeholder') || '');
      const aria = normalizeText(el.getAttribute('aria-label') || '');
      return hints.some((h) => id.includes(h) || name.includes(h) || placeholder.includes(h) || aria.includes(h));
    }) || null;
  }

  function setFieldValue(el, value) {
    if (!el || !value) return;
    el.focus();
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.blur();
  }

  const addDocumentButton = Array.from(document.querySelectorAll('button,[role="button"],a')).find((el) =>
    normalizeText(el.textContent).includes('adicionar documento')
  );
  if (addDocumentButton) addDocumentButton.click();

  const mapping = [
    { value: data.sapPortaria, hints: ['nº sap de portaria', 'sap de portaria', 'sap portaria'] },
    { value: data.numeroDt, hints: ['numero do dt', 'número do dt', 'documentos de transporte', 'dt'] },
    { value: data.transportadora, hints: ['transportadora'] },
    { value: data.motorista, hints: ['nome do motorista', 'motorista'] },
    { value: data.placa, hints: ['placa'] },
    { value: data.placa2, hints: ['placa 2', 'placa2'] },
    { value: data.placa3, hints: ['placa 3', 'placa3'] },
    { value: data.telefone, hints: ['telefone', 'contato'] },
    { value: data.cnh, hints: ['nº da cnh', 'numero da cnh', 'cnh'] },
    { value: data.cpf, hints: ['cpf'] }
  ];

  mapping.forEach(({ value, hints }) => {
    const field = findElementByLabel(hints);
    if (field && field.tagName !== 'SELECT') {
      setFieldValue(field, value);
    }
  });

  const tipoVeiculoSelect = findElementByLabel(['tipo de veiculo', 'tipo veículo']);
  if (tipoVeiculoSelect?.tagName === 'SELECT') {
    const option = Array.from(tipoVeiculoSelect.options).find((opt) =>
      normalizeText(opt.textContent).includes(normalizeText(data.tipoVeiculo))
    );
    if (option) {
      tipoVeiculoSelect.value = option.value;
      tipoVeiculoSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
}
