const CACHE_NAME = 'vero-ops-v1';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/variables.css',
  './css/layout.css',
  './css/components.css',
  './css/mobile.css',
  './js/app.js',
  './js/services/auth.js',
  './js/services/rbac.js',
  './js/services/sheets-api.js',
  './js/services/sheets-write-api.js',
  './js/components/Toast.js',
  './js/components/EditModal.js',
  './js/components/CreateModal.js',
  './js/components/PhotoCapture.js',
  './js/modules/DashboardModule.js',
  './js/modules/ChamadosB2BModule.js',
  './js/modules/IncidentesModule.js',
  './js/modules/VistoriasModule.js',
  './js/modules/InfraModule.js',
  './js/modules/POPsModule.js',
  './js/modules/EstoqueModule.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Ignore Google APIs and non-HTTP requests (like chrome-extension://)
  if (
    e.request.url.includes('googleapis.com') || 
    e.request.url.includes('docs.google.com') || 
    e.request.method !== 'GET' ||
    !e.request.url.startsWith('http')
  ) {
    return;
  }
  
  // Network-first strategy for app shell
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
