/**
 * auth.js - Gerenciamento de Autenticação Customizada
 * Baseado no e-mail presente na aba "Acessos"
 */

let currentUser = null; // { email, name, picture, role }
const listeners = [];

export function initAuth() {
  // Checa se há um usuário salvo
  const saved = localStorage.getItem('vero_user');
  if (saved) {
    currentUser = JSON.parse(saved);
    if (currentUser.picture && currentUser.picture.includes('ui-avatars.com')) {
      currentUser.picture = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}&backgroundColor=14b8a6&textColor=ffffff`;
      localStorage.setItem('vero_user', JSON.stringify(currentUser));
    }
    _notifyListeners();
  }
}

/**
 * Tenta fazer login com o e-mail e senha fornecidos
 * @param {string} email 
 * @param {string} password 
 * @param {Array} acessosList - Lista de perfis lida da planilha
 * @returns {boolean} true se o login for bem-sucedido
 */
export function login(email, password, acessosList) {
  if (!acessosList || acessosList.length === 0) return false;
  
  const cleanEmail = email.trim().toLowerCase();
  const profile = acessosList.find(a => (a.Email || '').trim().toLowerCase() === cleanEmail);
  
  // Verifica se o usuário existe e se a senha confere (assumindo que a coluna se chame 'Senha')
  if (profile && profile.Senha && profile.Senha.toString() === password) {
    currentUser = {
      email: profile.Email,
      name: profile.Nome || cleanEmail.split('@')[0],
      picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.Nome || cleanEmail)}&backgroundColor=14b8a6&textColor=ffffff`,
      role: profile.Perfil || 'VISUALIZADOR'
    };
    localStorage.setItem('vero_user', JSON.stringify(currentUser));
    _notifyListeners();
    return true;
  }
  return false;
}

export function logout() {
  currentUser = null;
  localStorage.removeItem('vero_user');
  _notifyListeners();
}

export function getUser() {
  return currentUser;
}

export function setRole(role) {
  if (currentUser) {
    currentUser.role = role;
    localStorage.setItem('vero_user', JSON.stringify(currentUser));
    _notifyListeners();
  }
}

export function onAuthStateChanged(cb) {
  listeners.push(cb);
}

function _notifyListeners() {
  listeners.forEach(cb => cb(currentUser));
}

/**
 * Simula a verificação do token antigo (mantido para compatibilidade, mas sempre retorna true)
 */
export function ensureValidToken() {
  return !!currentUser;
}
