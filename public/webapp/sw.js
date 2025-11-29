// Service Worker для принудительного обновления кеша
const CACHE_VERSION = 'v1.0.1';
const CACHE_NAME = `anonimka-${CACHE_VERSION}`;

// При установке - удаляем старые кеши
self.addEventListener('install', event => {
    console.log('[SW] Installing version', CACHE_VERSION);
    self.skipWaiting(); // Активируем сразу
});

// При активации - удаляем старые кеши
self.addEventListener('activate', event => {
    console.log('[SW] Activating version', CACHE_VERSION);
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// Стратегия: Network First (всегда пытаемся получить свежую версию)
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Для app.js и других критичных файлов - всегда сеть
    if (url.pathname.includes('app.js') || url.pathname.includes('style.css')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Кешируем свежую версию
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // Если сеть недоступна - берём из кеша
                    return caches.match(event.request);
                })
        );
    } else {
        // Для остальных - стандартная стратегия
        event.respondWith(
            caches.match(event.request)
                .then(response => response || fetch(event.request))
        );
    }
});
