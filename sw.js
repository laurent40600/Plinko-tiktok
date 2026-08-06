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

const CACHE_VERSION = 'royal-drop-v3.6.0';
const CACHE_NAME = `royal-drop-cache-${CACHE_VERSION}`;

// Liste de tous les fichiers essentiels au fonctionnement hors ligne.
// Architecture v3 (src/, modules ES natifs) — les anciens js/*.js ne
// sont plus chargés par index.html, donc plus précachés ici.
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './manifest.json',

    './src/main.js',
    './src/core/camera.js',
    './src/core/config.js',
    './src/core/configManager.js',
    './src/core/engine.js',
    './src/core/events.js',
    './src/core/storage.js',
    './src/core/viewport.js',
    './src/entities/ball.js',
    './src/entities/board.js',
    './src/render/background.js',
    './src/render/balls.js',
    './src/render/board.js',
    './src/render/buckets.js',
    './src/render/effectsOverlay.js',
    './src/render/frame.js',
    './src/render/imageCache.js',
    './src/render/particles.js',
    './src/render/pipeline.js',
    './src/render/shapes.js',
    './src/systems/audio.js',
    './src/systems/ballQueueManager.js',
    './src/systems/bossManager.js',
    './src/systems/bots.js',
    './src/systems/comboManager.js',
    './src/systems/communityManager.js',
    './src/systems/effectsManager.js',
    './src/systems/eventManager.js',
    './src/systems/gameFeel.js',
    './src/systems/giftManager.js',
    './src/systems/jackpotManager.js',
    './src/systems/keysManager.js',
    './src/systems/leaderboard.js',
    './src/systems/particles.js',
    './src/systems/physics.js',
    './src/systems/players.js',
    './src/systems/tiktokManager.js',
    './src/systems/voiceManager.js',
    './src/ui/hud.js',
    './src/ui/showUI.js',

    './config/animations.json',
    './config/boss.json',
    './config/events.json',
    './config/gifts.json',
    './config/jackpot.json',
    './config/levels.json',
    './config/sounds.json',

    './assets/icons/icon-192.png',
    './assets/icons/icon-512.png',
    './assets/icons/icon-maskable-192.png',
    './assets/icons/icon-maskable-512.png',
    './assets/icons/apple-touch-icon.png',
    './assets/icons/chest/chest-stage-glow.png',
    './assets/icons/chest/chest-stage-crack.png',
    './assets/icons/chest/chest-stage-shake.png',
    './assets/icons/chest/chest-stage-open.png',
    './assets/icons/wheel/royal-wheel-frame.png',
    './assets/icons/wheel/royal-wheel-disc.png',

    './assets/backgrounds/royal-throne.jpg',
    './assets/backgrounds/royal-frame.webp'
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
