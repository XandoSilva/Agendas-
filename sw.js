const CACHE_NAME = 'vistorias-v11';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/variables.css',
  './css/base.css',
  './css/components.css',
  './css/layout.css',
  './css/mobile.css',
  './js/app.js',
  './js/modules/AgendaModule.js',
  './js/modules/ManutencaoModule.js',
  './js/utils/sanitizer.js',
  './js/utils/formatters.js',
  './js/services/api.js',
  './js/services/parser.js',
  './js/components/Header.js',
  './js/components/Card.js',
  './js/components/Timeline.js',
  './js/components/Calendar.js',
  './js/components/MobileNav.js',
  './js/components/SettingsModal.js',
  './js/components/Dashboard.js'
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
  if (e.request.url.includes('supabase.co') || e.request.method !== 'GET') {
    return;
  }
  
  // Network-first: tenta rede, fallback para cache (offline)
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
