/* ============================================================
   ROYAL DROP — systems/bots.js
   ------------------------------------------------------------
   Joueurs virtuels (IA) qui animent le live même sans viewers
   actifs. Comme un vrai spectateur, un bot envoie un CADEAU
   ('tiktok:gift' via TikTokBridge) — jamais un lancer direct :
   c'est GiftManager qui traduit le cadeau en billes. Ça garde
   un point d'entrée unique (les cadeaux) pour toute bille, que
   la source soit un vrai viewer ou cette simulation d'ambiance.
   ============================================================ */

import { CONFIG } from '../core/config.js';
import { TikTokBridge } from '../core/events.js';

const GIFT_WEIGHTS_BY_PERSONALITY = {
    prudent: { rose: 60, tiktok_coins: 30, finger_heart: 8, perfume: 2 },
    agressif: { finger_heart: 20, perfume: 20, gg: 25, garland: 25, galaxy: 8, lion: 2 },
    chanceux: { rose: 20, finger_heart: 15, perfume: 10, gg: 10, garland: 15, galaxy: 20, lion: 10 },
    fidele: { tiktok_coins: 35, finger_heart: 25, perfume: 20, gg: 15, garland: 5 }
};

export class Bots {
    /** @param {import('../core/events.js').eventBus} eventBus */
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.virtualPlayers = this._generateVirtualPlayers();
        this.loopTimeoutId = null;
        this.isRunning = false;
    }

    _generateVirtualPlayers() {
        const names = CONFIG.BOTS.NAMES_POOL.slice(0, CONFIG.BOTS.MAX_ACTIVE_NAMES);
        const personalities = CONFIG.BOTS.PERSONALITIES;

        return names.map((name, i) => {
            const personality = personalities[i % personalities.length];
            return {
                name,
                avatar: null,
                personality,
                history: [] // { giftId, timestamp }
            };
        });
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this._loop();
    }

    stop() {
        this.isRunning = false;
        if (this.loopTimeoutId) {
            clearTimeout(this.loopTimeoutId);
            this.loopTimeoutId = null;
        }
    }

    _loop() {
        if (!this.isRunning) return;

        const bot = this._pickRandomBot();
        if (bot) this._sendGiftFromBot(bot);

        const min = CONFIG.BOTS.SPAWN_INTERVAL_MIN * 1000;
        const max = CONFIG.BOTS.SPAWN_INTERVAL_MAX * 1000;
        const nextDelay = min + Math.random() * (max - min);

        this.loopTimeoutId = setTimeout(() => this._loop(), nextDelay);
    }

    _pickRandomBot() {
        if (this.virtualPlayers.length === 0) return null;
        return this.virtualPlayers[Math.floor(Math.random() * this.virtualPlayers.length)];
    }

    _sendGiftFromBot(bot) {
        const giftId = this._weightedGiftForPersonality(bot.personality);

        TikTokBridge.onGift({
            username: bot.name,
            avatar: bot.avatar,
            giftId,
            giftCount: 1
        });

        bot.history.push({ giftId, timestamp: Date.now() });
        if (bot.history.length > 20) bot.history.shift();
    }

    _weightedGiftForPersonality(personality) {
        const weights = GIFT_WEIGHTS_BY_PERSONALITY[personality] || CONFIG.TIKTOK.GIFT_WEIGHTS;
        const entries = Object.entries(weights);
        const total = entries.reduce((sum, [, w]) => sum + w, 0);
        let roll = Math.random() * total;
        for (const [id, w] of entries) {
            roll -= w;
            if (roll <= 0) return id;
        }
        return entries[0]?.[0] || 'rose';
    }

    reset() {
        for (const bot of this.virtualPlayers) bot.history = [];
    }
}
