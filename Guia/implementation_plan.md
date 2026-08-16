# Inteligência Artificial e Fluxos de Logística

O objetivo desta implementação é adicionar capacidades de Visão Computacional (IA) ao aplicativo para automatizar a leitura de etiquetas de equipamentos e criar fluxos de substituição em campo, integrando tudo à planilha.

## Funcionalidades Propostas

1. **Leitor Inteligente de Equipamentos (AI Scanner)**
   - Um novo botão flutuante (ou ação na barra superior) na aba de **Logística / Estoque**.
   - Ao acionar, abrirá a câmera do celular (ou permitirá envio de imagem).
   - A imagem será enviada para a **API do Google Gemini (Vision)** que lerá a etiqueta e extrairá estruturadamente:
     - Marca / Fabricante
     - Modelo
     - Nº de Série (S/N) / MAC Address
     - Categoria (identificada por contexto, ex: "Módulo SFP", "Rádio", etc.)

2. **Fluxo de Entrada / Auditoria Rápida**
   - Ao ler um equipamento avulso, a tela mostrará os dados capturados.
   - O técnico pode conferir e clicar em "Adicionar ao Estoque", que já o preenche na aba de Logística.

3. **Fluxo de Substituição em Campo (Logística Reversa)**
   - Um novo botão **"Substituição em Campo"**.
   - **Passo 1 (Defeituoso):** Tira-se a foto do equipamento retirado da rede. A IA identifica e já marca como "Logística Reversa" / "Defeituoso".
   - **Passo 2 (Novo):** Tira-se a foto do equipamento novo da caixa/carro. A IA identifica, dá baixa no estoque dele (ou adiciona como "Em Uso").
   - **Passo 3 (Vínculo):** O sistema exibe um *dropdown* com os chamados abertos (do B2B ou Incidentes) para vincular essa substituição.
   - **Passo 4 (Sincronização):** Tudo é enviado e amarrado na planilha automaticamente.

## User Review Required

> [!IMPORTANT]
> **Chave de API do Gemini**
> Para que o aplicativo consiga ler as imagens e entender os equipamentos, ele precisa se conectar ao cérebro do **Google Gemini**. Como este é um sistema em HTML/JS estático (Vercel), a forma mais rápida de habilitarmos isso é:
> Eu criarei uma tela de "Configurações de IA" onde você (ou o gestor) insere uma **Chave de API do Gemini** (que é gratuita). Essa chave ficará salva no navegador.
> Você está de acordo em criarmos uma chave de API para o Gemini no Google AI Studio?

> [!WARNING]
> **Planilha de Logística Reversa**
> Atualmente, a aba de Estoque se chama `"Estoque Disponível"`. Quando enviamos o equipamento para "Logística Reversa", devemos adicioná-lo na mesma aba `"Estoque Disponível"` com o *Status do Equipamento* alterado para `"Logística Reversa"`, ou você possui uma **aba separada** na planilha para isso?

## Open Questions

1. O fluxo de "Substituição em Campo" deve criar algum registro no Chamado (ex: preencher a "Observação" dizendo "Equipamento X substituído pelo Y")?
2. Para o novo fluxo, podemos criar as regras via *Javascript frontend* e enviar para o seu atual *script* (`Code.gs`) apenas usando as funções que já existem lá (adicionar linha e atualizar células)?

Assim que aprovado ou respondidas as dúvidas, iniciaremos a construção!
