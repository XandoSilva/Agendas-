/**
 * auth.js - Gerenciamento de Autenticação Google e RBAC
 */
export const CLIENT_ID = 'COLE_SEU_CLIENT_ID_AQUI.apps.googleusercontent.com';

let tokenClient;
let currentUser = null; // { email, name, picture, accessToken, role }
const listeners = [];

export function initAuth() {
  if (typeof google === 'undefined' || !google.accounts) {
    console.error('Google Identity Services não carregado');
    return;
  }

  // Inicializa o cliente OAuth2 para pegar o Access Token (para ler/escrever na API)
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    callback: (tokenResponse) => {
      if (tokenResponse && tokenResponse.access_token) {
        // Agora temos permissão para editar a planilha!
        currentUser.accessToken = tokenResponse.access_token;
        localStorage.setItem('vero_user', JSON.stringify(currentUser));
        _notifyListeners();
      }
    },
  });

  // Inicializa o One Tap / Sign In button para Autenticação (descobrir quem é o usuário)
  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: handleCredentialResponse
  });

  // Checa se há um usuário salvo
  const saved = localStorage.getItem('vero_user');
  if (saved) {
    currentUser = JSON.parse(saved);
    _notifyListeners();
  }
}

export function renderLoginButton(containerElement) {
  if (typeof google === 'undefined') return;
  google.accounts.id.renderButton(
    containerElement,
    { theme: 'outline', size: 'medium', shape: 'pill' }
  );
}

function handleCredentialResponse(response) {
  // Decodifica o JWT para pegar e-mail, nome, e foto
  const jwt = response.credential;
  const payload = JSON.parse(atob(jwt.split('.')[1]));
  
  currentUser = {
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
    accessToken: null, // Ainda não tem acesso à API, precisa do tokenClient
    role: 'VISUALIZADOR' // Padrão, será sobrescrito ao cruzar com a aba Acessos
  };

  localStorage.setItem('vero_user', JSON.stringify(currentUser));
  _notifyListeners();
  
  // Após descobrir quem é, pede permissão para editar a planilha
  requestSheetAccess();
}

export function requestSheetAccess() {
  if (tokenClient) {
    tokenClient.requestAccessToken();
  }
}

export function logout() {
  if (typeof google !== 'undefined') {
    google.accounts.id.disableAutoSelect();
  }
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
