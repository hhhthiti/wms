const statusEl = document.getElementById('status');
const fileInput = document.getElementById('pdfInput');

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

function extractTransportData(text) {
  return {
    transportadora: extractByRegex(text, /Transportadora\s*:?\s*([^\n\r]+)/i),
    motorista: extractByRegex(text, /Nome\s+do\s+Motorista\s*:?\s*([^\n\r]+)/i),
    placa: extractByRegex(text, /Placa\s*:?\s*([A-Z0-9-]{7,10})/i),
    placa2: extractByRegex(text, /Placa\s*2\s*:?\s*([A-Z0-9-]{7,10})/i),
    placa3: extractByRegex(text, /Placa\s*3\s*:?\s*([A-Z0-9-]{7,10})/i),
    tipoVeiculo: extractByRegex(text, /Tipo\s+de\s+Ve[ií]culo\s*:?\s*([^\n\r]+)/i),
    telefone: extractByRegex(text, /Telefone\s*:?\s*([^\n\r]+)/i),
    cnh: extractByRegex(text, /N[º°o]?\s*da\s*CNH\s*:?\s*([^\n\r]+)/i),
    cpf: extractByRegex(text, /CPF\s*:?\s*([0-9.\/-]+)/i)
  };
}

function fillFormFields(data) {
  const mapping = [
    { keys: ['transportadora'], labels: ['Transportadora'] },
    { keys: ['motorista'], labels: ['Nome do Motorista'] },
    { keys: ['placa'], labels: ['Placa'] },
    { keys: ['placa2'], labels: ['Placa 2'] },
    { keys: ['placa3'], labels: ['Placa 3'] },
    { keys: ['telefone'], labels: ['Telefone'] },
    { keys: ['cnh'], labels: ['CNH'] },
    { keys: ['cpf'], labels: ['CPF'] }
  ];

  function findInputByLabel(labelText) {
    const labels = Array.from(document.querySelectorAll('label'));
    const label = labels.find((l) => l.textContent?.trim().toLowerCase().includes(labelText.toLowerCase()));
    if (label?.htmlFor) {
      return document.getElementById(label.htmlFor);
    }
    return label?.querySelector('input,select,textarea') || null;
  }

  mapping.forEach(({ keys, labels }) => {
    const value = data[keys[0]];
    if (!value) return;

    for (const labelName of labels) {
      const el = findInputByLabel(labelName);
      if (el) {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        break;
      }
    }
  });

  // Tipo de veículo (select)
  if (data.tipoVeiculo) {
    const selects = Array.from(document.querySelectorAll('select'));
    const select = selects.find((s) => {
      const idMatch = (s.id || '').toLowerCase().includes('veiculo');
      const nameMatch = (s.name || '').toLowerCase().includes('veiculo');
      return idMatch || nameMatch;
    });

    if (select) {
      const option = Array.from(select.options).find((opt) =>
        opt.textContent.toLowerCase().includes(data.tipoVeiculo.toLowerCase())
      );
      if (option) {
        select.value = option.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }
}
