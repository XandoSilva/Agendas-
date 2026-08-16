# Portal Operacional VERO Telecom — Mobile-First PWA

> [!NOTE]
> **Status:** Todas as Fases (1 a 6) relacionadas à infraestrutura, PWA, interface mobile, formulários de edição e RBAC estão implementadas. Faltam apenas configurações reais de ambiente de produção (Client ID).

Extensão do portal existente para uso em celular (iOS/Android) pelos operadores de campo, com controle de acesso por funcionalidade e escrita direta na planilha via Google Sheets API.

---

## Análise do Estado Atual

### Projeto Existente
- **Stack**: HTML + Vanilla JS (ES Modules) + Vite + CSS custom properties
- **Arquitetura**: SPA modular com 7 módulos (`Dashboard`, `ChamadosB2B`, `Incidentes`, `Vistorias`, `Infra`, `POPs`, `Estoque`)
- **Dados**: Leitura via CSV público do Google Sheets (11 abas mapeadas em [`sheets-api.js`](file:///c:/Users/adasi/vscode/Agendas/js/services/sheets-api.js))
- **Auth**: Google Identity Services (OAuth2) com JWT decode + RBAC provisório em [`auth.js`](file:///c:/Users/adasi/vscode/Agendas/js/services/auth.js)
- **PWA**: `manifest.json` e `sw.js` 100% atualizados.
- **Deploy**: Firebase Hosting + Vercel configurados

### Base de Dados (Planilha Google Sheets)
| Aba | GID | Colunas-chave | Registros |
|-----|-----|--------------|-----------|
| 📊 Visão Geral | `113587035` | KPIs + Produtividade por técnico | Agregados |
| ⚙️ Apoio & Listas | `1236509559` | Status, Diagnósticos, Técnicos, Categorias, Períodos | Listas de validação |
| Chamados B2B | `2005931044` | Dt.Abertura, Protocolo, Contrato, Cliente, Endereço, Diagnóstico, Técnico, Status, Dt.Finalizado, Obs | ~53 registros |
| Incidentes | `1386014215` | Origem, Task ID, Incidente, Título, Diagnóstico, Responsável, Status, Dt.Finalizado, Obs | ~20 registros |
| Vistorias RJ | `1475053554` | Data, Tipo, Contrato, Cliente, Horário, Status, Localidade, ADM, Obs, Responsável(Manual), StatusExec(Manual), ObsGeral(Manual) | ~29 registros |
| Infra RJ | `170808402` | Data, Tipo, Contrato, Cliente, Horário, Status, Localidade, ADM, Materiais, Detalhes, Obs, Responsável(Manual), StatusExec(Manual), ObsGeral(Manual) | ~39 registros |
| POPs & Preventivas | `705477249` | Sigla, etc. | POPs |
| Estoque | `738843736` | Categoria, etc. | Itens estoque |

---

## Decisões Técnicas Aprovadas

- **Backend de escrita**: Google Sheets API v4 (write-back direto na planilha)
- **Aba Acessos**: Estrutura de RBAC completa mapeada
- **Funcionalidades mobile**: CRUD completo + UX mobile native-like
- **Plataforma**: PWA mobile-first (instalável em iOS/Android via Add to Home Screen)

---

## Fases de Implementação

### Fase 1 — Google Sheets API Write Service ✅ CONCLUÍDO
- **[`sheets-write-api.js`](file:///c:/Users/adasi/vscode/Agendas/js/services/sheets-write-api.js)**: Serviço de escrita com `updateCell`, `appendRow` e fila offline com retry automático.
- **[`sheets-api.js`](file:///c:/Users/adasi/vscode/Agendas/js/services/sheets-api.js)**: Mapeamento da aba `ACESSOS`.
- **[`auth.js`](file:///c:/Users/adasi/vscode/Agendas/js/services/auth.js)**: Scopes de Auth atualizados.

### Fase 2 — RBAC (Controle de Acesso por Funcionalidade) ✅ CONCLUÍDO
- **[`rbac.js`](file:///c:/Users/adasi/vscode/Agendas/js/services/rbac.js)**: Lógica para controle granular (`canView`, `canEdit`, `canCreate`).
- **[`app.js`](file:///c:/Users/adasi/vscode/Agendas/js/app.js)**: Integrado com Auth para ocultar itens restritos.

### Fase 3 — Componentes de Edição Mobile ✅ CONCLUÍDO
- **[`EditModal.js`](file:///c:/Users/adasi/vscode/Agendas/js/components/EditModal.js)**: Bottom sheet no mobile para edição.
- **[`CreateModal.js`](file:///c:/Users/adasi/vscode/Agendas/js/components/CreateModal.js)**: Formulário para novos registros.
- **[`PhotoCapture.js`](file:///c:/Users/adasi/vscode/Agendas/js/components/PhotoCapture.js)**: Acesso à câmera nativa e preview.
- **[`Toast.js`](file:///c:/Users/adasi/vscode/Agendas/js/components/Toast.js)**: Notificações visuais de sync.

### Fase 4 — Módulos com Edição Inline ✅ CONCLUÍDO
- **Módulos atualizados**: [`ChamadosB2BModule.js`](file:///c:/Users/adasi/vscode/Agendas/js/modules/ChamadosB2BModule.js), [`IncidentesModule.js`](file:///c:/Users/adasi/vscode/Agendas/js/modules/IncidentesModule.js), [`VistoriasModule.js`](file:///c:/Users/adasi/vscode/Agendas/js/modules/VistoriasModule.js), [`InfraModule.js`](file:///c:/Users/adasi/vscode/Agendas/js/modules/InfraModule.js), e [`EstoqueModule.js`](file:///c:/Users/adasi/vscode/Agendas/js/modules/EstoqueModule.js).
- Adicionado checagem de RBAC e botão Editar (`✏️` / Action Buttons) nas tabelas e cards.

### Fase 5 — PWA Mobile-First ✅ CONCLUÍDO
- **[`manifest.json`](file:///c:/Users/adasi/vscode/Agendas/manifest.json)** e **[`sw.js`](file:///c:/Users/adasi/vscode/Agendas/sw.js)** atualizados com nome VERO Ops, cores ajustadas e cache Network-First.
- **CSS Responsivo**: `env(safe-area-inset-bottom)` implementado em `mobile.css`. `overscroll-behavior: none;` adicionado no `layout.css`.

### Fase 6 — UX Premium ✅ CONCLUÍDO
- **[`PullToRefresh.js`](file:///c:/Users/adasi/vscode/Agendas/js/components/PullToRefresh.js)**: Gesto "puxar para baixo" para sincronizar, assim como em apps mobile nativos.
- **[`SwipeCard.js`](file:///c:/Users/adasi/vscode/Agendas/js/components/SwipeCard.js)**: Classes prontas para ações de deslize lateral nas linhas da tabela ou cards mobile.
- Adicionado Spinner na barra de status para feedback visual.

---

## Open Questions

> [!IMPORTANT]
> **Google Cloud Project**: Você já tem um projeto no Google Cloud Console com a **Sheets API v4** e a **Drive API** habilitadas? Preciso do `CLIENT_ID` real (atualmente está `'COLE_SEU_CLIENT_ID_AQUI'` no auth.js) e confirmar que os scopes de escrita estão autorizados na tela de consentimento OAuth.

> [!IMPORTANT]
> **Aba "Acessos"**: Vou criar a estrutura da aba na planilha como parte da implementação. Preciso de acesso de edição à planilha original (`1DfnPaIC5...`) ou devo documentar o schema para você criar manualmente?

---

## Verification Plan

### Automated Tests
```bash
npm run test
```
- Testes unitários para CSV parser, RBAC service, offline queue

### Manual Verification
- **Mobile iOS Safari**: Testar PWA install, câmera, safe areas
- **Mobile Android Chrome**: Testar PWA install, câmera, push
- **Offline**: Desligar WiFi, fazer edições, religar e verificar sync
- **RBAC**: Login com diferentes perfis e verificar visibilidade/permissões
- **Write-back**: Editar campo no celular e confirmar que a planilha foi atualizada
