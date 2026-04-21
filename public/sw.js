const VERSION = 'subliminal-v5';
const CACHE_NAME = `subliminal-player-${VERSION}`;
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Offline-first strategy: Cache essential assets on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching core assets');
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(asset => cache.add(asset))
      );
    })
  );
  self.skipWaiting();
});

// Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('subliminal-player-') && name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Clearing legacy cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle Share Target (must be quick and reliable)
  if (event.request.method === 'POST' && url.pathname === '/share-target') {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const audioFiles = formData.getAll('audio_files');
          
          if (audioFiles && audioFiles.length > 0) {
            const cache = await caches.open('shared-files');
            for (let i = 0; i < audioFiles.length; i++) {
              const file = audioFiles[i];
              const response = new Response(file);
              const headers = new Headers(response.headers);
              headers.set('x-filename', encodeURIComponent(file.name));
              const responseWithMeta = new Response(file, { headers });
              await cache.put(`/shared-files/temp-${i}`, responseWithMeta);
            }
            return Response.redirect('/?shared-count=' + audioFiles.length, 303);
          }
        } catch (err) {
          console.error('[SW] Share-target handling failed:', err);
        }
        return Response.redirect('/', 303);
      })()
    );
    return;
  }

  // Caching Strategy: Cache First, falling back to Network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return from cache if found
      if (cachedResponse) {
        // Asynchronous update: check for updates in background for non-static assets
        if (!ASSETS_TO_CACHE.includes(url.pathname)) {
          fetch(event.request).then(response => {
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
            }
          }).catch(() => {}); // Ignore background fetch errors
        }
        return cachedResponse;
      }

      // Otherwise fetch from network
      return fetch(event.request).then((response) => {
        // Cache successful GET requests for local assets, fonts, and images
        if (response && response.status === 200 && event.request.method === 'GET') {
          const isLocal = url.origin === self.location.origin;
          const isFont = url.hostname === 'fonts.gstatic.com' || url.hostname === 'fonts.googleapis.com';
          const isImage = url.hostname === 'picsum.photos' || url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp)$/);
          
          if (isLocal || isFont || isImage) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
        }
        return response;
      }).catch(() => {
        // Final Fallback: Offline navigation shell
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        return null; // Let the browser handle standard resource failures
      });
    })
  );
});
