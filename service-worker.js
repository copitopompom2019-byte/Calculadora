const CACHE_NAME = "calculadora-bcv-v2";

const APP_FILES = [
    "./",
    "./index.html",
    "./style.css",
    "./app.js",
    "./manifest.json"
];


// ========================================
// INSTALACIÓN
// ========================================

self.addEventListener("install", event => {

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_FILES))
    );

    self.skipWaiting();

});


// ========================================
// ACTIVACIÓN
// ========================================

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


// ========================================
// SOLICITUDES
// ========================================

self.addEventListener("fetch", event => {

    /*
     * Las consultas externas de la tasa
     * no deben quedar almacenadas en caché.
     */

    if (
        event.request.url.includes(
            "calculadora-bcv-api.copitopompom2019.workers.dev"
        )
    ) {
        return;
    }


    event.respondWith(

        fetch(event.request)

            .then(response => {

                const responseClone =
                    response.clone();

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

                return caches.match(
                    event.request
                );

            })

    );

});


// ========================================
// NOTIFICACIONES PUSH
// ========================================

self.addEventListener(
    "push",
    event => {

        let data = {};

        try {

            data =
                event.data
                    ? event.data.json()
                    : {};

        } catch (error) {

            data = {
                title: "Calculadora BCV",
                body: event.data
                    ? event.data.text()
                    : "Nueva actualización disponible."
            };

        }


        const title =
            data.title ||
            "Calculadora BCV";


        const options = {

            body:
                data.body ||
                "Hay una nueva actualización.",

            icon:
                "./icon-192.png",

            badge:
                "./icon-192.png",

            tag:
                data.tag ||
                "calculadora-bcv",

            renotify: true,

            data: {

                url:
                    data.url ||
                    "./"

            }

        };


        event.waitUntil(

            self.registration
                .showNotification(
                    title,
                    options
                )

        );

    }
);


// ========================================
// AL HACER CLIC EN LA NOTIFICACIÓN
// ========================================

self.addEventListener(
    "notificationclick",
    event => {

        event.notification.close();


        const targetUrl =
            event.notification.data?.url ||
            "./";


        event.waitUntil(

            clients.matchAll({
                type: "window",
                includeUncontrolled: true
            })

            .then(clientList => {

                for (
                    const client of clientList
                ) {

                    if (
                        "focus" in client
                    ) {

                        client.navigate(
                            targetUrl
                        );

                        return client.focus();

                    }

                }


                if (
                    clients.openWindow
                ) {

                    return clients.openWindow(
                        targetUrl
                    );

                }

            })

        );

    }
);
