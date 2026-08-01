const CACHE_NAME = 'profit-tracker-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Forces the waiting service worker to become the active service worker
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => clients.claim()) // Takes control of all open clients/tabs immediately
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache-First / Network Fallback Strategy
      return response || fetch(event.request).then((fetchResponse) => {
        // Optionally cache the new requested network response
        return caches.open(CACHE_NAME).then((cache) => {
          // Make a copy of the response to cache, because responses are streams and can only be consumed once
          if (event.request.method === 'GET') {
            cache.put(event.request, fetchResponse.clone());
          }
          return fetchResponse;
        });
      });
    }).catch(() => {
      // Fallback if both cache and network fail (offline)
      // If we are requesting an HTML page, we might want to return the cached index.html
      if (event.request.mode === 'navigate') {
         return caches.match('/index.html');
      }
    })
  );
});
