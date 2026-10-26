const CACHE_NAME = 'vokalys-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// Installation : Mise en cache initiale des fichiers essentiels
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activation : Nettoyage des anciens caches et prise de contrôle
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Stratégie : Network First avec fallback sur le cache (permet les MAJ auto)
self.addEventListener('fetch', (e) => {
  // Ignorer les requêtes non-GET ou externes (ex: Chrome extensions, API tierces)
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseToCache));
        }
        return networkResponse;
      })
      .catch(() => caches.match(e.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        // Repli sur index.html si la page demandée hors-ligne n'est pas trouvée
        return caches.match('./index.html');
      }))
  );
});