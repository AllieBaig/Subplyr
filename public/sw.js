const VERSION = 'subliminal-v4';
const CACHE_NAME = `subliminal-player-${VERSION}`;
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Force individual asset adds to avoid one failing entire cache
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(asset => cache.add(asset))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('subliminal-player-') && name !== CACHE_NAME)
          .map((name) => {
            console.log('Clearing legacy cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle Share Target
  if (event.request.method === 'POST' && url.pathname === '/share-target') {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const audioFiles = formData.getAll('audio_files');
          
          if (audioFiles && audioFiles.length > 0) {
            const cache = await caches.open('shared-files');
            // Store each file with its original name in the cache for extraction
            // We use a prefix to identify these in the client
            for (let i = 0; i < audioFiles.length; i++) {
              const file = audioFiles[i];
              const response = new Response(file);
              // Use headers to preserve filename for the client
              const headers = new Headers(response.headers);
              headers.set('x-filename', encodeURIComponent(file.name));
              const responseWithMeta = new Response(file, { headers });
              await cache.put(`/shared-files/temp-${i}`, responseWithMeta);
            }
            return Response.redirect('/?shared-count=' + audioFiles.length, 303);
          }
        } catch (err) {
          console.error('Share-target handling failed:', err);
        }
        return Response.redirect('/', 303);
      })()
    );
    return;
  }

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
        // Fallback for navigation requests (HTML shell)
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        return null;
      });
    })
  );
});
