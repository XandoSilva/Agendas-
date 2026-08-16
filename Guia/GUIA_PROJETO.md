# GUIA DO PROJETO: Portal Operacional VERO Telecom

Este arquivo serve como **guia de contexto** para IAs e desenvolvedores que atuarão no projeto. Leia-o antes de iniciar novas tarefas para entender a arquitetura, o que já foi feito e quais são as pendências.

## 1. Visão Geral
**Portal Operacional** voltado para operadores de campo da VERO Telecom (iOS/Android). 
O sistema é um **PWA Mobile-First** construído em Vanilla JS que utiliza o **Google Sheets como Banco de Dados**, permitindo leitura de planilhas públicas e escrita direta (write-back) através da Google Sheets API v4, incluindo funcionamento offline (fila de sincronização) e Controle de Acesso (RBAC).

## 2. Arquitetura & Tech Stack
- **Frontend**: HTML5, CSS3 (Mobile-first, variáveis CSS, sem frameworks), JavaScript Vanilla (ES Modules).
- **Backend/DB**: Google Sheets (Planilha `1DfnPaIC5LacCeewL0duOkReLVvNBg00z9B_YRc94fXQ`).
- **Autenticação**: Google Identity Services (OAuth2) via `auth.js`.
- **APIs Utilizadas**:
  - Leitura: Exportação CSV pública (`docs.google.com/spreadsheets/d/e/.../pub?output=csv`).
  - Escrita: Google Sheets API v4 (`sheets-write-api.js`).
  - Imagens: Google Drive API v3 (Upload de fotos/evidências capturadas pelo celular).

## 3. O que já foi implementado (Status Atual)

### ⚙️ Core & Serviços (`js/services/`)
- **`sheets-api.js`**: Lê as abas da planilha via CSV, faz parsing e cache `localStorage`. Modificado para mapear a aba de `ACESSOS`.
- **`sheets-write-api.js`**: Implementa o fluxo de gravação. Possui a lógica de fila offline (salva em `localStorage` quando não há internet e tenta sincronizar quando volta).
- **`rbac.js`**: Controle de Acesso Baseado em Perfis (Admin, Téc Campo, Téc B2B, Infra, Logística, Visualizador). Oculta botões e restringe navegação com base no email logado (que é checado contra a aba "Acessos").
- **`auth.js`**: Gerencia o Token JWT de login e o Access Token para as APIs do Google (Drive e Sheets). Monitora a expiração do token.

### 📱 Componentes UI Mobile (`js/components/` & `css/`)
- **`EditModal.js` / `CreateModal.js`**: Modais fullscreen que no celular abrem como "Bottom Sheets" para edição e criação de registros.
- **`PhotoCapture.js`**: Permite tirar fotos com a câmera do celular, comprime a imagem em canvas e anexa via Drive API.
- **`Toast.js`**: Feedbacks visuais e indicador de sincronização pendente (`pending-sync-badge`).
- **FAB (Floating Action Button)**: Botão flutuante para ações rápidas de criação no celular.
- **CSS Responsivo**: `mobile.css` com áreas seguras (safe-area) para iPhone, e painéis baseados em swipe.

### 🧩 Módulos (`js/modules/`)
Os módulos abaixo já foram integrados com o RBAC e exibem os botões de **"Editar"** que abrem o `EditModal` ou possuem botões de ação rápida:
- `ChamadosB2BModule.js`
- `IncidentesModule.js`
- `VistoriasModule.js` (inclui atalho para Google Maps)
- `InfraModule.js` (inclui atalho para Google Maps)

## 4. O que FALTA implementar (Pendências)

Abaixo estão as próximas tarefas da fila de desenvolvimento (Fases 4 a 6):

1. **Módulo de Estoque (`EstoqueModule.js`)**: 
   - Falta adicionar a capacidade de editar quantidades e registrar saídas/entradas, semelhante aos outros módulos.
2. **PWA Completo (Offline Support)**: 
   - Criar ou atualizar o `sw.js` (Service Worker) para interceptar rotas e fazer cache da aplicação (app shell).
   - Revisar e completar o `manifest.json`.
3. **UX & Micro-Interações**:
   - Componente `PullToRefresh.js`: Para puxar a tela para baixo no celular e recarregar a planilha (igual feed de Instagram).
   - Componente `SwipeCard.js`: Para deslizar um card para a direita/esquerda e realizar ações rápidas.
4. **Configuração Google Cloud (IMPORTANTE)**:
   - Para que o write-back funcione no mundo real, o `CLIENT_ID` dentro de `auth.js` que hoje está como placeholder (`'COLE_SEU_CLIENT_ID_AQUI'`) precisará ser substituído por um Client ID válido de um projeto no Google Cloud com as APIs habilitadas (Drive e Sheets) e permissões de OAuth configuradas.

## 5. Como Iniciar / Navegar no Projeto
- Todo o fluxo principal passa pelo **`app.js`**, que instancia os módulos, o auth e verifica o RBAC.
- Os estilos estão modulares: `variables.css` (cores/fontes), `layout.css` (sidebar/shell desktop), `components.css` (cards, modais, toasts) e `mobile.css` (adaptações específicas para celular).
- Para testar localmente, é necessário rodar com um servidor HTTP (ex: Live Server do VSCode), devido a limitações de módulos ES e do SDK do Google Auth se executados via protocolo `file://`.
