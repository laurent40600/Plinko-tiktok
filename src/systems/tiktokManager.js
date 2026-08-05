/* ============================================================
   ROYAL DROP — systems/tiktokManager.js
   ------------------------------------------------------------
   Point d'entrée unique pour le flux TikTok Live. En production,
   un backend (ex: tiktok-live-connector côté serveur + WebSocket)
   doit appeler TikTokBridge.onGift/onLike/onShare/onComment/onFollow
   — rien d'autre n'a besoin de changer, tout le jeu écoute déjà
   ces événements via l'EventBus.

   Tant qu'aucun flux réel n'est branché, un simulateur de démo
   (désactivable dans CONFIG.TIKTOK.SIMULATOR_ENABLED) émule des
   viewers pour que le show tourne seul pendant les tests/le dev.
   ============================================================ */

import { CONFIG } from '../core/config.js';
import { TikTokBridge } from '../core/events.js';

export class TikTokManager {
    #giftTimeoutId = null;
    #engagementTimeoutId = null;
    #running = false;

    constructor() {
        this.connected = false;
    }

    /** À appeler quand un vrai connecteur TikTok Live est branché. */
    connect() {
        this.connected = true;
        this.stopSimulator();
        console.log('[TikTokManager] Connecté (flux réel) — simulateur désactivé.');
    }

    disconnect() {
        this.connected = false;
    }

    /** Démarre le simulateur de démo si activé en config et si pas déjà connecté à un flux réel. */
    startSimulatorIfEnabled() {
        if (this.connected || !CONFIG.TIKTOK.SIMULATOR_ENABLED || this.#running) return;
        this.#running = true;
        this._loopGifts();
        this._loopEngagement();
    }

    stopSimulator() {
        this.#running = false;
        if (this.#giftTimeoutId) clearTimeout(this.#giftTimeoutId);
        if (this.#engagementTimeoutId) clearTimeout(this.#engagementTimeoutId);
    }

    _loopGifts() {
        if (!this.#running) return;

        TikTokBridge.onGift(this._randomGiftPayload());

        const min = CONFIG.TIKTOK.SIMULATOR_GIFT_INTERVAL_MIN * 1000;
        const max = CONFIG.TIKTOK.SIMULATOR_GIFT_INTERVAL_MAX * 1000;
        this.#giftTimeoutId = setTimeout(() => this._loopGifts(), min + Math.random() * (max - min));
    }

    _loopEngagement() {
        if (!this.#running) return;

        const roll = Math.random();
        const username = this._randomViewerName();
        if (roll < 0.4) {
            TikTokBridge.onComment({ username });
        } else if (roll < 0.7) {
            TikTokBridge.onLike({ username, count: 50 + Math.floor(Math.random() * 200) });
        } else if (roll < 0.9) {
            TikTokBridge.onShare({ username });
        } else {
            TikTokBridge.onFollow({ username });
        }

        const min = CONFIG.TIKTOK.SIMULATOR_ENGAGEMENT_INTERVAL_MIN * 1000;
        const max = CONFIG.TIKTOK.SIMULATOR_ENGAGEMENT_INTERVAL_MAX * 1000;
        this.#engagementTimeoutId = setTimeout(() => this._loopEngagement(), min + Math.random() * (max - min));
    }

    _randomViewerName() {
        const pool = CONFIG.TIKTOK.VIEWER_NAMES_POOL;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    _randomGiftPayload() {
        const giftId = this._weightedRandomGiftId();
        return { username: this._randomViewerName(), avatar: null, giftId, giftCount: 1 };
    }

    _weightedRandomGiftId() {
        const weights = CONFIG.TIKTOK.GIFT_WEIGHTS || {};
        const entries = Object.entries(weights);
        const total = entries.reduce((sum, [, w]) => sum + w, 0);
        let roll = Math.random() * total;
        for (const [id, w] of entries) {
            roll -= w;
            if (roll <= 0) return id;
        }
        return entries[0]?.[0] || 'rose';
    }
}
