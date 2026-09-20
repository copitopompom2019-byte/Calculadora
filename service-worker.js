const CACHE_NAME = "calculadora-bcv-v3";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./style.css",
    "./app.js",
    "./manifest.json",
    "./icon-192.png",
    "./icon-512.png"
];


// ========================================
// INSTALACIÓN
// ========================================

self.addEventListener("install", event => {

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then(cache => {

                return cache.addAll(
                    FILES_TO_CACHE
                );

            })

    );

    self.skipWaiting();
});


// ========================================
// ACTIVACIÓN
// ========================================

self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys()
            .then(cacheNames => {

                return Promise.all(

                    cacheNames
                        .filter(
                            cacheName =>
                                cacheName !== CACHE_NAME
                        )
                        .map(
                            cacheName =>
                                caches.delete(cacheName)
                        )

                );

            })

    );

    self.clients.claim();
});


// ========================================
// PETICIONES
// ========================================

self.addEventListener("fetch", event => {

    const request = event.request;

    // Las consultas de las APIs siempre
    // deben ir directamente a Internet.
    if (
        request.url.includes("bcv.today") ||
        request.url.includes("workers.dev")
    ) {
        event.respondWith(
            fetch(request)
        );

        return;
    }


    event.respondWith(

        caches.match(request)
            .then(cachedResponse => {

                if (cachedResponse) {

                    return cachedResponse;
                }

                return fetch(request)
                    .then(response => {

                        return response;
                    });

            })

    );

});
