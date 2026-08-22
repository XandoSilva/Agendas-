/**
 * rbac.js — Role-Based Access Control Service
 * Controle granular de permissões por perfil de usuário
 * 
 * Perfis: ADMIN, TÉCNICO CAMPO, TÉCNICO B2B, INFRA, LOGÍSTICA, VISUALIZADOR
 */

// ─── Permission Maps ─────────────────────────────────────────────

const MODULE_PERMISSIONS = {
  'ADMIN': {
    dashboard: { view: true, edit: false },
    b2b: { view: true, edit: true, create: true },
    incidentes: { view: true, edit: true, create: true },
    vistorias: { view: true, edit: true, create: true },
    infra: { view: true, edit: true, create: true },
    pops: { view: true, edit: true, create: true },
    zabbix: { view: true, edit: false, create: false },
  },
  'TÉCNICO CAMPO': {
    dashboard: { view: false, edit: false },
    b2b: { view: false, edit: false, create: false },
    incidentes: { view: true, edit: true, create: false },
    vistorias: { view: true, edit: true, create: false },
    infra: { view: true, edit: true, create: false },
    pops: { view: false, edit: false, create: false },
    zabbix: { view: false, edit: false, create: false },
  },
  'TECNICO CAMPO': null, // alias → mapped in init
  'TÉCNICO B2B': {
    dashboard: { view: false, edit: false },
    b2b: { view: true, edit: true, create: false },
    incidentes: { view: true, edit: true, create: false },
    vistorias: { view: false, edit: false, create: false },
    infra: { view: false, edit: false, create: false },
    pops: { view: false, edit: false, create: false },
    zabbix: { view: false, edit: false, create: false },
  },
  'TECNICO B2B': null,
  'INFRA': {
    dashboard: { view: false, edit: false },
    b2b: { view: false, edit: false, create: false },
    incidentes: { view: true, edit: true, create: false },
    vistorias: { view: false, edit: false, create: false },
    infra: { view: true, edit: true, create: true },
    pops: { view: true, edit: true, create: false },
    zabbix: { view: true, edit: false, create: false },
  },
  'INFRAESTRUTURA': null,
  'VISUALIZADOR': {
    dashboard: { view: true, edit: false },
    b2b: { view: true, edit: false, create: false },
    incidentes: { view: true, edit: false, create: false },
    vistorias: { view: true, edit: false, create: false },
    infra: { view: true, edit: false, create: false },
    pops: { view: true, edit: false, create: false },
    zabbix: { view: true, edit: false, create: false },
  },
};

// Editable fields per module (for field-level granularity)
const EDITABLE_FIELDS = {
  b2b: ['Status / Andamento', 'Técnico / Responsável', 'Observações Gerais', 'Dt. Finalizado'],
  incidentes: ['Status', 'Responsável Técnico', 'Observações'],
  vistorias: ['Responsável pela vistoria (Manual)', 'Status Execução (Manual)', 'Observação geral (Manual)'],
  infra: ['Responsável pela infra (Manual)', 'Status Execução (Manual)', 'Observação geral (Manual)'],
  pops: ['Status', 'Observações'],
};

// ─── Alias resolution ────────────────────────────────────────────

const ALIASES = {
  'TECNICO CAMPO': 'TÉCNICO CAMPO',
  'TECNICO B2B': 'TÉCNICO B2B',
  'INFRAESTRUTURA': 'INFRA',
};

function resolveRole(role) {
  if (!role) return 'VISUALIZADOR';
  const upper = role.toUpperCase().trim();
  return ALIASES[upper] || upper;
}

// ─── State ───────────────────────────────────────────────────────

let _currentRole = 'VISUALIZADOR';
let _currentEmail = null;
let _acessosData = null;

// ─── Public API ──────────────────────────────────────────────────

/**
 * Inicializa RBAC com dados da aba Acessos
 * @param {Array<Object>} acessosData - Dados da aba Acessos
 * @param {string} userEmail - E-mail do usuário logado
 */
export function initRBAC(acessosData, userEmail) {
  _acessosData = acessosData || [];
  _currentEmail = userEmail;

  if (!userEmail) {
    _currentRole = 'VISUALIZADOR';
    return;
  }

  // Find user in access list
  const userAccess = _acessosData.find(
    a => a['Email'] && a['Email'].toLowerCase().trim() === userEmail.toLowerCase().trim()
  );

  if (userAccess && userAccess['Perfil']) {
    _currentRole = resolveRole(userAccess['Perfil']);
  } else {
    _currentRole = 'VISUALIZADOR';
  }

  console.log(`[RBAC] User ${userEmail} → Role: ${_currentRole}`);
}

/**
 * Retorna o perfil atual do usuário
 */
export function getCurrentRole() {
  return _currentRole;
}

/**
 * Verifica se o perfil pode visualizar um módulo
 */
export function canView(moduleKey) {
  const perms = _getPermissions(moduleKey);
  return perms ? perms.view : false;
}

/**
 * Verifica se o perfil pode editar no módulo
 */
export function canEdit(moduleKey) {
  const perms = _getPermissions(moduleKey);
  return perms ? perms.edit : false;
}

/**
 * Verifica se o perfil pode criar registros no módulo
 */
export function canCreate(moduleKey) {
  const perms = _getPermissions(moduleKey);
  return perms ? perms.create : false;
}

/**
 * Verifica se um campo específico é editável no módulo
 */
export function canEditField(moduleKey, fieldName) {
  if (!canEdit(moduleKey)) return false;
  if (_currentRole === 'ADMIN') return true;
  const fields = EDITABLE_FIELDS[moduleKey] || [];
  return fields.includes(fieldName);
}

/**
 * Retorna a lista de módulos visíveis para o perfil atual
 */
export function getVisibleModules() {
  const allModules = ['dashboard', 'b2b', 'incidentes', 'vistorias', 'infra', 'pops', 'zabbix'];
  return allModules.filter(m => canView(m));
}

/**
 * Retorna o primeiro módulo visível (para redirect)
 */
export function getDefaultModule() {
  const visible = getVisibleModules();
  return visible.length > 0 ? visible[0] : null;
}

/**
 * Retorna todos os dados do perfil do usuário da aba Acessos
 */
export function getUserProfile() {
  if (!_currentEmail || !_acessosData) return null;
  return _acessosData.find(
    a => a['Email'] && a['Email'].toLowerCase().trim() === _currentEmail.toLowerCase().trim()
  ) || null;
}

/**
 * Verifica se o usuário está autenticado e tem algum acesso
 */
export function isAuthorized() {
  return _currentRole !== null && getVisibleModules().length > 0;
}

// ─── Private ─────────────────────────────────────────────────────

function _getPermissions(moduleKey) {
  const rolePerms = MODULE_PERMISSIONS[_currentRole];
  if (!rolePerms) return MODULE_PERMISSIONS['VISUALIZADOR'][moduleKey] || null;
  return rolePerms[moduleKey] || null;
}

// ─── Schema for "Acessos" sheet ──────────────────────────────────
// This is the expected column structure for the access control sheet:
//
// | Email | Nome | Perfil | Ativo | Módulos Extras |
// |-------|------|--------|-------|----------------|
// | admin@vero.com | Admin VERO | ADMIN | SIM | |
// | tecnico@s11.com | João Silva | TÉCNICO CAMPO | SIM | |
//
// Perfis válidos: ADMIN, TÉCNICO CAMPO, TÉCNICO B2B, INFRA, LOGÍSTICA, VISUALIZADOR

export const ACESSOS_SCHEMA = {
  columns: ['Email', 'Nome', 'Perfil', 'Ativo', 'Módulos Extras'],
  validRoles: ['ADMIN', 'TÉCNICO CAMPO', 'TÉCNICO B2B', 'INFRA', 'LOGÍSTICA', 'VISUALIZADOR'],
};
