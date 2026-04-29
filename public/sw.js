const VERSION = 'subliminal-v15'; // Increment for update
const CACHE_NAME = `subliminal-player-${VERSION}`;

// Core assets that MUST be available for the app to start
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './favicon.ico',
];

// Pre-cache fonts and common icons
const EXTERNAL_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
];

// Nature sounds are pre-cached to ensure they work in airplane mode
const NATURE_SOUNDS_ASSETS = [
  'https://assets.mixkit.co/sfx/preview/mixkit-light-rain-loop-2393.mp3',
  'https://assets.mixkit.co/sfx/preview/mixkit-ocean-waves-loop-1196.mp3',
  'https://assets.mixkit.co/sfx/preview/mixkit-forest-birds-ambience-loop-1210.mp3'
];

const PRECACHE_ASSETS = [...STATIC_ASSETS, ...EXTERNAL_ASSETS, ...NATURE_SOUNDS_ASSETS];

// Offline-first: Pre-cache core assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching core system assets');
      // Using relative paths to be base-path safe
      return Promise.allSettled(
        PRECACHE_ASSETS.map(asset => 
          fetch(asset, { cache: 'reload' }).then(response => {
            if (response.ok) return cache.put(asset, response);
          }).catch(() => {})
        )
      );
    })
  );
});

// Activate: Cleanup and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('subliminal-player-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Logic: Focus on delivering offline shell
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle Share Target
  if (event.request.method === 'POST' && url.pathname.includes('/share-target')) {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const audioFiles = formData.getAll('audio_files');
          if (audioFiles.length > 0) {
            const cache = await caches.open('shared-files');
            for (let i = 0; i < audioFiles.length; i++) {
              const file = audioFiles[i];
              const response = new Response(file);
              await cache.put(`/shared-files/temp-${i}`, response);
            }
            return Response.redirect('./?shared-count=' + audioFiles.length, 303);
          }
        } catch (err) {}
        return Response.redirect('./', 303);
      })()
    );
    return;
  }

  if (event.request.method !== 'GET') return;
  if (url.protocol === 'blob:') return;
  if (url.pathname.startsWith('/@vite') || url.pathname.includes('hot-update')) return;

  // NAVIGATION: Optimized for iOS 16 Standalone Offline Launch
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(async () => {
          // Robust fallback to cached shell
          const cache = await caches.open(CACHE_NAME);
          const cachedShell = await cache.match('./index.html') || await cache.match('./') || await cache.match('index.html');
          if (cachedShell) return cachedShell;
          
          // Last resort: find ANY html file in any cache
          const allCaches = await caches.keys();
          for (const name of allCaches) {
            const c = await caches.open(name);
            const match = await c.match('./index.html');
            if (match) return match;
          }
          return new Response('Offline - No cache found', { status: 503 });
        })
    );
    return;
  }

  // ASSETS: Cache-First
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const isStaticAsset = url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff2|json|mp3|wav|ogg)$/);
        if (isStaticAsset) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        
        return networkResponse;
      }).catch(() => new Response('', { status: 404 }));
    })
  );
});
