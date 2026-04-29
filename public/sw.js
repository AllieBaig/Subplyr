const VERSION = 'subliminal-v14'; // Increment for update
const CACHE_NAME = `subliminal-player-${VERSION}`;

// Core assets that MUST be available for the app to start
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

// Pre-cache fonts and common icons
const EXTERNAL_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap',
  'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.woff2'
];

// Nature sounds are pre-cached to ensure they work in airplane mode
const NATURE_SOUNDS_ASSETS = [
  'https://assets.mixkit.co/sfx/preview/mixkit-light-rain-loop-2393.mp3',
  'https://assets.mixkit.co/sfx/preview/mixkit-ocean-waves-loop-1196.mp3',
  'https://assets.mixkit.co/sfx/preview/mixkit-forest-birds-ambience-loop-1210.mp3',
  'https://assets.mixkit.co/sfx/preview/mixkit-wind-whistle-loop-1159.mp3',
  'https://assets.mixkit.co/sfx/preview/mixkit-campfire-crackling-loop-1144.mp3',
  'https://assets.mixkit.co/sfx/preview/mixkit-river-flowing-water-loop-1195.mp3',
];

const PRECACHE_ASSETS = [...STATIC_ASSETS, ...EXTERNAL_ASSETS, ...NATURE_SOUNDS_ASSETS];

// Offline-first: Pre-cache core assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching core system assets');
      return Promise.allSettled(
        PRECACHE_ASSETS.map(asset => 
          fetch(asset, { mode: 'no-cors', cache: 'reload' }).then(response => {
            if (response.type === 'opaque' || response.ok) {
              return cache.put(asset, response);
            }
          }).catch(err => console.warn(`[SW] Pre-cache failed for ${asset}:`, err))
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
          .map((name) => {
            console.log('[SW] Purging stale cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Logic: Network-First for navigation, Cache-First for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle Share Target (POST)
  if (event.request.method === 'POST' && url.pathname === '/share-target') {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const audioFiles = formData.getAll('audio_files');
          if (audioFiles.length > 0) {
            const cache = await caches.open('shared-files');
            for (let i = 0; i < audioFiles.length; i++) {
              const file = audioFiles[i];
              if (file instanceof File || file instanceof Blob) {
                const response = new Response(file);
                const headers = new Headers(response.headers);
                headers.set('x-filename', encodeURIComponent((file as any).name || `shared-${i}`));
                const responseWithMeta = new Response(file, { headers });
                await cache.put(`/shared-files/temp-${i}`, responseWithMeta);
              }
            }
            return Response.redirect('/?shared-count=' + audioFiles.length, 303);
          }
        } catch (err) {
          console.error('[SW] Share-target error:', err);
        }
        return Response.redirect('/', 303);
      })()
    );
    return;
  }

  // Skip other non-GET or cross-origin binary data that safari might choke on
  if (event.request.method !== 'GET') return;
  if (url.protocol === 'blob:') return;

  // Bypass for dev tools
  if (url.pathname.startsWith('/@vite') || url.pathname.includes('hot-update')) return;

  // NAVIGATION Strategy: Network-First with Cache Fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match('/') || caches.match('/index.html'))
    );
    return;
  }

  // ASSET Strategy: Cache-First with Network Fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const isStaticAsset = url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff2|json)$/);
        if (isStaticAsset) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        
        return networkResponse;
      }).catch(() => {
        // Silent fail for missing assets offline
        return new Response('', { status: 404, statusText: 'Offline' });
      });
    })
  );
});
