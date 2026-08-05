/* ============================================================
   ROYAL DROP — systems/keysManager.js
   ------------------------------------------------------------
   "Clés Royales" : chemin alternatif vers l'ouverture du Coffre
   Royal. Certains cadeaux donnent des clés (voir gift.keys dans
   /config/gifts.json) ; à 50 clés le coffre s'ouvre directement
   (CommunityManager écoute 'keys:goalReached').
   ============================================================ */

import { CONFIG } from '../core/config.js';

export class KeysManager {
    /** @param {object} deps @param {import('../core/events.js').eventBus} deps.eventBus */
    constructor({ eventBus }) {
        this.eventBus = eventBus;

        const cfg = CONFIG.LEVELS?.keys || {};
        this.goal = cfg.goal || 50;
        this.keys = cfg.startingKeys || 0;

        eventBus.on('gift:processed', (data) => this._addKeys((data.gift?.keys || 0) * (data.giftCount || 1)));

        this._emitUpdate();
    }

    _addKeys(amount) {
        if (!amount) return;

        this.keys += amount;
        this.eventBus.emit('keys:gained', { amount });

        if (this.keys >= this.goal) {
            this.keys = 0;
            this._emitUpdate();
            this.eventBus.emit('keys:goalReached', {});
            return;
        }

        this._emitUpdate();
    }

    _emitUpdate() {
        this.eventBus.emit('keys:updated', { keys: Math.round(this.keys), goal: this.goal });
    }

    getState() {
        return { keys: Math.round(this.keys), goal: this.goal };
    }
}
