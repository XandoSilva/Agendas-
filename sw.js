const CACHE_NAME = 'vistorias-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/variables.css',
  './css/base.css',
  './css/components.css',
  './css/mobile.css',
  './js/main.js',
  './js/utils/sanitizer.js',
  './js/utils/formatters.js',
  './js/services/api.js',
  './js/services/parser.js',
  './js/components/Header.js',
  './js/components/Card.js',
  './js/components/Timeline.js',
  './js/components/MobileNav.js',
  './js/components/SettingsModal.js'
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
  // Ignora requisições de API de terceiros (Supabase / CDN) no cache direto
  if (e.request.url.includes('supabase.co') || e.request.method !== 'GET') {
    return;
  }
  
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Retorna do cache e atualiza em segundo plano
        fetch(e.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(e.request);
    })
  );
});
