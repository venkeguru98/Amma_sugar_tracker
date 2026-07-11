const CACHE_NAME = 'sugar-tracker-cache-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-512.jpg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Let browser extensions and API requests pass through normally
  if (e.request.url.includes('/api/') || !e.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(e.request).then((networkResponse) => {
        // Cache dynamic static assets (js, css, png, jpg, svg) from same origin
        if (
          networkResponse.status === 200 &&
          (e.request.url.includes('/assets/') || 
           e.request.url.endsWith('.js') || 
           e.request.url.endsWith('.css'))
        ) {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, cacheCopy);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback to offline index.html for SPA client-side routing
        return caches.match('/index.html');
      });
    })
  );
});
