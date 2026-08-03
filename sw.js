/* ============================================================
   ROYAL DROP — sw.js (Service Worker)
   ------------------------------------------------------------
   Permet le fonctionnement 100% hors ligne et l'installation
   en PWA (iPhone/Android/PC). Met en cache tous les fichiers
   essentiels lors de l'installation, puis sert le cache en
   priorité (stratégie "cache first" avec mise à jour en fond).

   IMPORTANT : incrémenter CACHE_VERSION à chaque changement
   de fichiers pour forcer le renouvellement du cache chez
   les utilisateurs déjà installés.
   ============================================================ */

const CACHE_VERSION = 'royal-drop-v2.3.0';
const CACHE_NAME = `royal-drop-cache-${CACHE_VERSION}`;

// Liste de tous les fichiers essentiels au fonctionnement hors ligne
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './manifest.json',

    './js/config.js',
    './js/storage.js',
    './js/events.js',
    './js/audio.js',
    './js/particles.js',
    './js/camera.js',
    './js/physics.js',
    './js/ball.js',
    './js/board.js',
    './js/renderer.js',
    './js/players.js',
    './js/leaderboard.js',
    './js/bots.js',
    './js/ui.js',
    './js/engine.js',
    './js/game.js',

    './assets/icons/icon-192.png',
    './assets/icons/icon-512.png',
    './assets/icons/icon-maskable-192.png',
    './assets/icons/icon-maskable-512.png',
    './assets/icons/apple-touch-icon.png',

    './assets/backgrounds/royal-throne.jpg',
    './assets/icons/royal-plinko-logo.png'
];

/* --------------------------------------------------------
   install
   Met en cache tous les fichiers essentiels dès l'installation
   du service worker. skipWaiting() force l'activation immédiate
   de la nouvelle version (utile en développement).
   -------------------------------------------------------- */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Mise en cache des fichiers essentiels...');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
            .catch((err) => console.warn('[SW] Erreur lors de la mise en cache initiale :', err))
    );
});

/* --------------------------------------------------------
   activate
   Supprime les anciens caches (versions précédentes) pour
   éviter d'accumuler des fichiers obsolètes.
   -------------------------------------------------------- */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name.startsWith('royal-drop-cache-') && name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[SW] Suppression ancien cache :', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

/* --------------------------------------------------------
   fetch
   Stratégie "cache first, fallback network" :
   - Si la ressource est en cache, on la sert immédiatement
     (fonctionnement garanti hors ligne).
   - Sinon, on tente le réseau, et on met en cache le résultat
     pour la prochaine fois (utile pour d'éventuelles requêtes
     futures liées à TikTok Live ou assets ajoutés dynamiquement).
   - En cas d'échec réseau total (vraiment hors ligne et pas
     en cache), on retourne une réponse de secours basique.
   -------------------------------------------------------- */
self.addEventListener('fetch', (event) => {
    // On ne gère que les requêtes GET (évite d'intercepter
    // d'éventuels appels API futurs en POST vers TikTok)
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request)
                .then((networkResponse) => {
                    // Met en cache la nouvelle ressource pour la prochaine fois
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                })
                .catch(() => {
                    // Hors ligne et ressource non trouvée en cache :
                    // on retourne une réponse de secours minimale.
                    if (event.request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }
                    return new Response('Ressource indisponible hors ligne.', {
                        status: 503,
                        statusText: 'Service Unavailable'
                    });
                });
        })
    );
});

/* --------------------------------------------------------
   message
   Permet à game.js de communiquer avec le service worker,
   par exemple pour forcer une mise à jour manuelle du cache
   depuis le menu debug (fonctionnalité future).
   -------------------------------------------------------- */
self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
