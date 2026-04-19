const CACHE_NAME = 'subliminal-player-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Strategy: Cache First, fallback to Network, with Shell Fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((response) => {
        // Cache successful GET requests for local assets or fonts
        if (response && response.status === 200 && event.request.method === 'GET') {
          const isLocal = url.origin === self.location.origin;
          const isFont = url.hostname === 'fonts.gstatic.com' || url.hostname === 'fonts.googleapis.com';
          
          if (isLocal || isFont) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
        }
        return response;
      }).catch(() => {
        // Fallback for navigation requests (HTML)
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        return null; // Let it fail for other assets
      });
    })
  );
});
