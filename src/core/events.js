/* ============================================================
   ROYAL DROP — core/events.js
   ------------------------------------------------------------
   EventBus central : permet à tous les modules de communiquer
   sans dépendance directe entre eux (pattern pub/sub).
   ============================================================ */

class EventBus {
    #listeners = new Map();

    on(eventName, callback) {
        if (!this.#listeners.has(eventName)) {
            this.#listeners.set(eventName, []);
        }
        this.#listeners.get(eventName).push(callback);
    }

    off(eventName, callback) {
        const list = this.#listeners.get(eventName);
        if (!list) return;
        this.#listeners.set(eventName, list.filter(cb => cb !== callback));
    }

    emit(eventName, payload) {
        const list = this.#listeners.get(eventName);
        if (!list) return;
        for (const callback of list) {
            try {
                callback(payload);
            } catch (err) {
                console.warn(`[EventBus] Erreur dans un écouteur de "${eventName}" :`, err);
            }
        }
    }

    clear(eventName) {
        if (eventName) {
            this.#listeners.delete(eventName);
        } else {
            this.#listeners.clear();
        }
    }
}

// Bus unique partagé par toute l'application.
export const eventBus = new EventBus();

/* ============================================================
   Connecteurs TikTok Live — points d'entrée volontairement
   vides pour l'instant. Un futur module (tiktok-bridge.js)
   pourra les appeler directement sans toucher au reste du jeu.
   ============================================================ */
export const TikTokBridge = {
    onGift(data) {
        eventBus.emit('tiktok:gift', data);
    },
    onLike(data) {
        eventBus.emit('tiktok:like', data);
    },
    onShare(data) {
        eventBus.emit('tiktok:share', data);
    },
    onComment(data) {
        eventBus.emit('tiktok:comment', data);
    },
    spawnBall(data) {
        eventBus.emit('game:spawnBall', data);
    }
};
