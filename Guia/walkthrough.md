# Scanner de Inteligência Artificial para Logística 📦🤖

A funcionalidade solicitada foi construída com sucesso. Agora, o seu módulo de **Estoque** possui inteligência artificial integrada, permitindo automatizar grande parte da digitação através da câmera do celular.

## O que foi implementado

1. **Serviço de IA (`vision-api.js`)**
   - Construímos uma ponte direta com a API do Google Gemini Vision, que recebe as imagens em Base64 e um prompt pedindo para extrair as chaves do equipamento em formato JSON (`marca`, `modelo`, `serial`, `categoria`).

2. **Novos Botões na Tela de Estoque**
   - **Leitor IA**: Permite bater foto de qualquer etiqueta para extrair e visualizar os dados.
   - **Substituição em Campo**: Abre o modal interativo com o novo fluxo de trabalho.
   - **Configurar IA (⚙️)**: Onde o técnico pode inserir sua Chave de API do Gemini para habilitar o Scanner.

3. **Fluxo de Substituição em Campo (Modal)**
   - O modal guia o técnico em 3 passos simples:
     1. Tira foto do equipamento **defeituoso** (a IA lê o S/N e Marca).
     2. Tira foto do equipamento **novo** (a IA lê o S/N e Marca).
     3. O técnico seleciona a qual **Chamado B2B ou Incidente** a troca pertence (através de um menu flutuante que lista apenas os chamados em aberto).
   - Ao confirmar, o aplicativo envia comandos para a planilha:
     - Adiciona a baixa do equipamento novo.
     - Adiciona a entrada na Logística Reversa do equipamento defeituoso.
     - Adiciona uma observação automática no chamado selecionado vinculando a troca dos seriais.

## Como testar

1. Acesse o aplicativo e abra a aba de **Estoque**.
2. Clique no ícone de engrenagem transparente (Configurar IA) e cole a chave de API do Gemini Studio (ou gere uma gratuitamente na página do Google AI Studio se ainda não tiver feito).
3. Pegue algum equipamento em mãos (ou tire foto de uma caixa) utilizando o botão **Leitor IA** para ver a magia acontecer.
4. Tente realizar um fluxo completo de **Substituição em Campo** para ver como as informações são lançadas na planilha com zero necessidade de digitação.

> [!TIP]
> Por usarmos o *Gemini 2.5 Flash*, a leitura levará em média apenas de 2 a 3 segundos e consegue entender etiquetas amassadas, reflexos ou textos de ponta cabeça.

> [!NOTE]
> Para testar pelo computador, quando ele pedir a câmera, ele também te dará a opção de anexar um arquivo salvo, como a imagem `media_1786904829016.jpg` que você nos enviou anteriormente.
