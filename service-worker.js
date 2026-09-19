const CACHE_NAME = "calculadora-bcv-v2";

const APP_FILES = [
    "./",
    "./index.html",
    "./style.css",
    "./app.js",
    "./manifest.json"
];


/* ================================
   INSTALACIÓN
================================ */

self.addEventListener("install", event => {

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_FILES))
    );

    self.skipWaiting();

});


/* ================================
   ACTIVACIÓN
================================ */

self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys().then(cacheNames => {

            return Promise.all(

                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))

            );

        })

    );

    self.clients.claim();

});


/* ================================
   SOLICITUDES
================================ */

self.addEventListener("fetch", event => {

    /*
     * No almacenamos en caché las consultas
     * externas de la tasa BCV.
     *
     * Queremos intentar obtener siempre
     * la tasa actualizada.
     */

    if (
        event.request.url.includes("bcv.today")
    ) {
        return;
    }


    event.respondWith(

        fetch(event.request)

            .then(response => {

                const responseClone = response.clone();

                caches.open(CACHE_NAME)
                    .then(cache => {
                        cache.put(
                            event.request,
                            responseClone
                        );
                    });

                return response;

            })

            .catch(() => {

                return caches.match(event.request);

            })

    );

});
