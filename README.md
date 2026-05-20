# wms
WMS for small business

## Extensão Edge (MVP) - Autofill por PDF

Foi adicionada uma extensão em `edge-extension/` para Microsoft Edge que:

1. Permite subir um PDF.
2. Tenta extrair os campos de **Dados do Transporte** via regex.
3. Preenche automaticamente o formulário na aba ativa.

### Campos mapeados
- Transportadora
- Nome do Motorista
- Placa
- Placa 2
- Placa 3
- Tipo de Veículo (select)
- Telefone
- Nº da CNH
- CPF

### Como instalar no Edge
1. Abra `edge://extensions`.
2. Ative **Modo de desenvolvedor**.
3. Clique em **Carregar sem compactação**.
4. Selecione a pasta `edge-extension` deste repositório.

### Como usar
1. Abra a página com o formulário de transporte.
2. Clique no ícone da extensão.
3. Selecione o PDF e clique em **Extrair e preencher**.
4. Revise os campos antes de salvar.

### Observações importantes
- Este MVP funciona melhor com PDF baseado em texto (não escaneado).
- A extração usa heurística; dependendo do layout do PDF, regex podem precisar de ajuste.
- Para maior precisão em produção, o ideal é usar `pdfjs-dist` para extração de texto por página.
