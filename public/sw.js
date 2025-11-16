// Service Worker для PWA
const CACHE_NAME = 'anonimka-v1';
const urlsToCache = [
  '/webapp/',
  '/webapp/index.html',
  '/webapp/app.js',
  '/webapp/style.css',
  '/webapp/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
