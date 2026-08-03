/* ============================================================
   ROYAL DROP — events.js
   ------------------------------------------------------------
   EventBus central du jeu.
   Permet à tous les modules de communiquer sans dépendance
   directe entre eux (pattern pub/sub).

   Prévoit dès maintenant les hooks pour une future connexion
   TikTok Live : onGift(), onLike(), onShare(), onComment().
   Ces fonctions sont déjà câblées au bus mais n'ont aucun
   effet réel tant qu'aucune source TikTok n'est branchée.
   ============================================================ */

const EventBus = {

    // Table des écouteurs : { "nomEvenement": [callback1, callback2, ...] }
    _listeners: {},

    /* --------------------------------------------------------
       on(eventName, callback)
       Enregistre un écouteur sur un événement donné.
       -------------------------------------------------------- */
    on(eventName, callback) {
        if (!this._listeners[eventName]) {
            this._listeners[eventName] = [];
        }
        this._listeners[eventName].push(callback);
    },

    /* --------------------------------------------------------
       off(eventName, callback)
       Retire un écouteur précis d'un événement.
       -------------------------------------------------------- */
    off(eventName, callback) {
        if (!this._listeners[eventName]) return;
        this._listeners[eventName] = this._listeners[eventName]
            .filter(cb => cb !== callback);
    },

    /* --------------------------------------------------------
       emit(eventName, payload)
       Déclenche un événement et appelle tous ses écouteurs.
       -------------------------------------------------------- */
    emit(eventName, payload) {
        if (!this._listeners[eventName]) return;
        for (const callback of this._listeners[eventName]) {
            try {
                callback(payload);
            } catch (err) {
                console.warn(`[EventBus] Erreur dans un écouteur de "${eventName}" :`, err);
            }
        }
    },

    /* --------------------------------------------------------
       clear(eventName)
       Supprime tous les écouteurs d'un événement (ou de tous
       les événements si aucun nom n'est fourni).
       -------------------------------------------------------- */
    clear(eventName) {
        if (eventName) {
            delete this._listeners[eventName];
        } else {
            this._listeners = {};
        }
    }
};


/* ============================================================
   API FUTURE — Connecteurs TikTok Live
   ------------------------------------------------------------
   Ces fonctions sont volontairement vides pour l'instant.
   Elles servent de point d'entrée unique : plus tard, un
   module externe (ex: tiktok-bridge.js) pourra appeler
   directement TikTokAPI.onGift(data), etc., sans toucher
   au reste du code du jeu.
   ============================================================ */

const TikTokAPI = {

    /* --------------------------------------------------------
       onGift(data)
       Appelé quand un spectateur envoie un cadeau.
       data attendu (futur) : { username, giftName, giftValue, avatar }
       -------------------------------------------------------- */
    onGift(data) {
        // TODO : connecter à la source TikTok Live réelle
        EventBus.emit('tiktok:gift', data);
    },

    /* --------------------------------------------------------
       onLike(data)
       Appelé quand un spectateur like le live.
       data attendu (futur) : { username, likeCount }
       -------------------------------------------------------- */
    onLike(data) {
        // TODO : connecter à la source TikTok Live réelle
        EventBus.emit('tiktok:like', data);
    },

    /* --------------------------------------------------------
       onShare(data)
       Appelé quand un spectateur partage le live.
       data attendu (futur) : { username }
       -------------------------------------------------------- */
    onShare(data) {
        // TODO : connecter à la source TikTok Live réelle
        EventBus.emit('tiktok:share', data);
    },

    /* --------------------------------------------------------
       onComment(data)
       Appelé quand un spectateur commente le live.
       data attendu (futur) : { username, message }
       -------------------------------------------------------- */
    onComment(data) {
        // TODO : connecter à la source TikTok Live réelle
        EventBus.emit('tiktok:comment', data);
    },

    /* --------------------------------------------------------
       spawnBall(data)
       Point d'entrée unique pour faire apparaître une bille
       liée à une action spectateur (cadeau, like, etc.).
       Actuellement relié uniquement aux bots et au bouton
       LANCER local ; sera relié à TikTok Live plus tard.
       data attendu : { playerName, avatar, betAmount, source }
       -------------------------------------------------------- */
    spawnBall(data) {
        EventBus.emit('game:spawnBall', data);
    }
};
