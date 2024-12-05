var CACHE_NAME = 'my-app-cache-v1'; 
var urlsToCache = [
    '/',
    'index.html',
    'style.css',
    'app.js',
    '\images\icon.png',
    '\images\iconoV.png',
    '\images\paw.png'
];

self.addEventListener("install", function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(function(cache) {
            console.log("Archivos en caché");
            return cache.addAll(urlsToCache);
        })
        .catch(function(error) {
            console.error("Fallo al guardar archivos en caché:", error);
        })
    );
});

// Activar el Service Worker y limpiar el cache antiguo
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME, DATA_CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});





// Interceptar solicitudes y servir desde caché si no hay red
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                // Si la solicitud está en caché, se sirve desde allí
                return cachedResponse;
            }
            // Si no está en caché, se hace la solicitud a la red
            return fetch(event.request).then(response => {
                // Cachear la respuesta para futuras solicitudes
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, response.clone());
                    return response;
                });
            }).catch(() => {
                // Si la red no está disponible, se sirve la página offline
                return caches.match('/offline.html');
            });
        })
    );
});



// Recuperar archivos desde el cache o desde la red
self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('/api/')) {
        // Si la petición es a la API (como guardar o obtener datos de pacientes)
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Hacer una copia de la respuesta
                    const clonedResponse = response.clone();
                    // Guardar los datos en el cache
                    caches.open(DATA_CACHE_NAME).then((cache) => {
                        cache.put(event.request, clonedResponse);
                    });
                    return response;
                })
                .catch(() => {
                    // Si no hay conexión, buscar en el cache de datos
                    return caches.match(event.request);
                })
        );
    } else {
        // Para archivos estáticos, intentar obtenerlos del cache
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                return cachedResponse || fetch(event.request);
            })
        );
    }
});

// Escuchar cuando el usuario vuelva a estar en línea
self.addEventListener('sync', (event) => {
    if (event.tag === 'send-patient-data') {
        event.waitUntil(sendPatientData());
    }
});

// Función para enviar los datos de pacientes cuando haya conexión
async function sendPatientData() {
    const cache = await caches.open(DATA_CACHE_NAME);
    const cachedRequests = await cache.keys();

    cachedRequests.forEach(async (request) => {
        const response = await cache.match(request);
        const patientData = await response.json();

        // Enviar los datos al servidor (puedes modificar esto para tu API real)
        fetch('/api/patients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patientData),
        }).then((res) => {
            if (res.ok) {
                // Si los datos se enviaron correctamente, eliminamos del cache
                cache.delete(request);
            }
        });
    });
}