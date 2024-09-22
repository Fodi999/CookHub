const CACHE_NAME = 'app-cache-v1';
const urlsToCache = [
    '/',
    '/css/components/_header.css',
    '/css/components/_profile.css',
    '/css/components/_feed.css',
    '/css/components/_post.css',
    '/css/components/_modal.css',
    '/css/components/_buttons.css',
    '/css/components/responsive.css',
    '/css/components/dashboard.css',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

// Устанавливаем Service Worker и кэшируем файлы
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

// Обрабатываем запросы
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response; // Возвращаем закэшированный файл
                }
                return fetch(event.request); // Делаем запрос в сеть
            })
    );
});

// Обновляем кэш при изменениях
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
