# VERO Telecom Mobile Portal — Task List

## Fase 1 — Google Sheets API Write Service
- [x] Criar `js/services/sheets-write-api.js` (Offline queue integrada)
- [x] Modificar `js/services/sheets-api.js` (adicionar fetchAcessos, row index tracking)
- [x] Modificar `js/services/auth.js` (scopes, token refresh)

## Fase 2 — RBAC
- [x] Criar `js/services/rbac.js`
- [x] Modificar `js/app.js` (integrar RBAC refatorado)

## Fase 3 — Componentes de Edição Mobile
- [x] Criar `js/components/EditModal.js`
- [x] Criar `js/components/CreateModal.js`
- [x] Criar `js/components/PhotoCapture.js`
- [x] Criar `js/components/Toast.js`

## Fase 4 — Módulos com Edição
- [x] Modificar `ChamadosB2BModule.js`
- [x] Modificar `IncidentesModule.js`
- [x] Modificar `VistoriasModule.js`
- [x] Modificar `InfraModule.js`
- [x] Modificar `EstoqueModule.js`

## Fase 5 — PWA Mobile-First
- [x] Modificar `manifest.json`
- [x] Modificar `sw.js`
- [x] Modificar `index.html`
- [x] Modificar `css/mobile.css`
- [x] Modificar `css/components.css`
- [x] Modificar `css/layout.css`

## Fase 6 — UX Premium
- [x] Criar `js/services/offline-queue.js` (Integrada no sheets-write-api)
- [ ] Criar `js/components/PullToRefresh.js`
- [ ] Criar `js/components/SwipeCard.js`
