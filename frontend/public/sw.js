// frontend/public/sw.js — Development bypass
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Pass everything to network, no caching
self.addEventListener('fetch', (event) => {
  // Do nothing, let the browser handle the fetch naturally
});
