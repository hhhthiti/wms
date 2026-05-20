# wms

WMS for small business.

## Extensão Edge: Registro de Portaria

A pasta `edge-extension/` contém uma extensão (Manifest V3) para Microsoft Edge com a tela de **Registro de Portaria**.

### Como instalar localmente no Edge

1. Abra `edge://extensions`.
2. Ative o **Modo de desenvolvedor**.
3. Clique em **Carregar sem compactação**.
4. Selecione a pasta `edge-extension` deste repositório.

### O que a extensão faz

- Exibe o formulário base de portaria em popup.
- Botão **Preencher do PDF** insere os dados informados (incluindo `DT: 23258415` em observações).
- Salva rascunho no `chrome.storage.local` automaticamente.
