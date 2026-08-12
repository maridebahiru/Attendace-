const CACHE_NAME = 'attendace-pwa-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/404.html'
];

// Install Event - Pre-cache essential app shell assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching static app shell');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Pre-cache warning:', err);
      });
    })
  );
});

// Activate Event - Clean up OLD Cache Storage entries ONLY.
// CRITICAL SAFETY GUARANTEE: This event strictly operates on Cache Storage via `caches`.
// It MUST NEVER access or delete IndexedDB databases ('AttendanceDB').
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating new Service Worker version');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing legacy Cache Storage:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Hybrid Cache Strategy
// 1. App Shell & Static Assets: Cache-First
// 2. SPA Navigation: Network-First with fallback to /index.html
// 3. Dynamic requests: Network-First
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests (e.g. POST, PUT, DELETE)
  if (request.method !== 'GET') return;

  // Skip browser extensions, chrome-extension, web-socket, or hot-reload
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Handle SPA Navigation requests (e.g. /admin, /dashboard)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Cache fresh HTML version
          const clonedResponse = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clonedResponse));
          return networkResponse;
        })
        .catch(() => {
          console.log('[ServiceWorker] Offline navigation fallback to /index.html');
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // Handle Static Bundle & Assets (JS, CSS, Images, Fonts): Cache-First
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.startsWith('/assets/')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Asynchronously refresh cache in background (Stale-While-Revalidate)
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          }).catch(() => {/* Ignore background fetch failure when offline */});
          return cachedResponse;
        }

        // If not in cache, fetch over network and cache
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clonedResponse = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clonedResponse));
          }
          return networkResponse;
        }).catch(() => {
          console.warn('[ServiceWorker] Failed to fetch static asset offline:', url.pathname);
        });
      })
    );
    return;
  }

  // Default GET requests: Network-First with Cache Fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clonedResponse = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clonedResponse));
        }
        return networkResponse;
      })
      .catch(() => caches.match(request))
  );
});
