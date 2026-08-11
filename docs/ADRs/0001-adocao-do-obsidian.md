# ADR 0001: Adoção do Obsidian para Documentação

**Data:** 10 de Agosto de 2026
**Status:** Aceito

## Contexto
O projeto está crescendo com novas funcionalidades (como relatórios, OCR, auto-save). Conforme a complexidade aumenta, precisamos de um local centralizado para documentar regras de negócio, esquema do banco e decisões arquiteturais.

## Decisão
Decidimos usar a pasta `/docs` como um **Vault do Obsidian**. Todo o conhecimento do projeto será armazenado em arquivos Markdown `.md` locais, versionados no Git junto com o código-fonte.

## Consequências
- **Positivo:** A documentação viaja junto com o código, não dependemos de plataformas externas (Notion, Confluence). Podemos criar links bi-direcionais facilmente.
- **Negativo:** Exige disciplina para manter os arquivos atualizados durante o desenvolvimento de novas features.
