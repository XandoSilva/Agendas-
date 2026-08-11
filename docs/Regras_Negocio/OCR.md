# Regras e Fluxos do OCR (Tesseract.js)

O módulo de Manutenção usa o `Tesseract.js` para extrair texto de imagens (prints de tabelas ou tickets).

## Fluxo Atual
1. **Captura:** O usuário cola a imagem (evento `paste`) no `ManutencaoModule`.
2. **Pre-processamento:** A imagem é analisada.
3. **Leitura:** O Tesseract tenta extrair o texto em linhas.
4. **Parsing:** O `parser.js` tenta encontrar padrões (Regex).
   - **Protocolo:** Deve ter no mínimo 6 dígitos numéricos, ignorando lixo.
   - **Ticket Único vs Bulk:** O sistema tenta ler como múltiplos tickets (Bulk). Se não conseguir, cai no fallback de Ticket Único.
5. **Auto-Cleanup:** Linhas que geram protocolos inválidos (ex: "123") são bloqueadas de entrarem no banco.

## Pontos de Atenção
- Falsos-positivos: O OCR costuma ler "l" ou "I" como "1". Adicionamos tratamento (sanitização) para converter letras que parecem números no campo de protocolo.
- Duplicidade: A inserção bloqueia caso o protocolo já exista na base ativa.
