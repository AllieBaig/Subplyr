const VERSION = 'subliminal-v12'; // Increment for update
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

// Fetch Logic: Strictly Cache-First for assets, Network-First for navigation with fallback
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
              const response = new Response(file);
              const headers = new Headers(response.headers);
              headers.set('x-filename', encodeURIComponent(file.name));
              const responseWithMeta = new Response(file, { headers });
              await cache.put(`/shared-files/temp-${i}`, responseWithMeta);
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

  // Skip other non-GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Bypass for dev tools
  if (url.pathname.startsWith('/@vite') || url.pathname.includes('hot-update')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // CACHE-FIRST strategy for static assets and known URLs
      if (cachedResponse) {
        // Kick off background update if online to keep it fresh
        if (navigator.onLine && (url.origin === self.location.origin)) {
           fetch(event.request).then(response => {
             if (response.ok) {
               caches.open(CACHE_NAME).then(cache => cache.put(event.request, response));
             }
           }).catch(() => {});
        }
        return cachedResponse;
      }

      // NETWORK FALLBACK
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        const isAsset = url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff2|mp3|wav|json)$/);
        
        if (isAsset || url.origin === self.location.origin) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        
        return networkResponse;
      }).catch((err) => {
        // OFFLINE FALLBACK
        // For navigation requests, return index.html to allow SPA to handle the route
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        
        // Final fallback for missing images or assets
        console.warn(`[SW] Resource ${url.pathname} unavailable offline.`);
        return new Response('', { status: 404, statusText: 'Offline and not cached' });
      });
    })
  );
});
