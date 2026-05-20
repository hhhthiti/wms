const PDF_DATA = {
  transportadora: 'JOALERIA TRANSPORTES',
  motorista: 'VAGNER RODRIGUES DOS SANTOS',
  placa1: 'EZU-4743',
  placa2: 'EOE-9685',
  placa3: '',
  tipo_veiculo: 'CARRETA',
  observacoes: [
    'DT: 23258415',
    'Número: 052025',
    'Operação: CARGA',
    'Condômino/Cliente: SUZANO PAPEL E CELULOSE',
    'Data Entrada/Início: 19/05/2026 19:58:00',
    'CPF: 301863388/13',
    'Contato: (11)91055-6767',
    'Responsável/Porteiro: MARCOS',
    'RG: 41.823.143-X'
  ].join('\n')
}

const form = document.getElementById('portariaForm')
const status = document.getElementById('status')

function fillFromPdf() {
  Object.entries(PDF_DATA).forEach(([key, value]) => {
    const field = form.elements.namedItem(key)
    if (field) field.value = value
  })
  status.textContent = 'Dados do PDF preenchidos.'
  chrome.storage.local.set({ portariaDraft: PDF_DATA })
}

document.getElementById('fillPdf').addEventListener('click', fillFromPdf)

chrome.storage.local.get(['portariaDraft'], (result) => {
  if (!result.portariaDraft) return
  Object.entries(result.portariaDraft).forEach(([key, value]) => {
    const field = form.elements.namedItem(key)
    if (field) field.value = value
  })
  status.textContent = 'Rascunho restaurado.'
})

form.addEventListener('input', () => {
  const draft = {}
  ;['transportadora', 'motorista', 'placa1', 'placa2', 'placa3', 'tipo_veiculo', 'observacoes'].forEach((name) => {
    draft[name] = form.elements.namedItem(name).value
  })
  chrome.storage.local.set({ portariaDraft: draft })
})
