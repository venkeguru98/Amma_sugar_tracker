const CACHE_NAME = 'sugar-tracker-cache-v3';
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
  
  const isHtml = e.request.url === self.location.origin + '/' || e.request.url.endsWith('/index.html');
  
  if (isHtml) {
    // Network-First strategy for HTML document to ensure immediate production updates
    e.respondWith(
      fetch(e.request).then((networkResponse) => {
        if (networkResponse.status === 200) {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, cacheCopy);
          });
        }
        return networkResponse;
      }).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
  } else {
    // Cache-First strategy for compiled static chunks (Vite hashed JS/CSS, images)
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(e.request).then((networkResponse) => {
          if (
            networkResponse.status === 200 &&
            (e.request.url.includes('/assets/') || 
             e.request.url.endsWith('.js') || 
             e.request.url.endsWith('.css') ||
             e.request.url.endsWith('.jpg') ||
             e.request.url.endsWith('.png'))
          ) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, cacheCopy);
            });
          }
          return networkResponse;
        }).catch(() => {
          return caches.match('/index.html');
        });
      })
    );
  }
});
