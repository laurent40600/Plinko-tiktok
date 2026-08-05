/* ============================================================
   ROYAL DROP — systems/giftManager.js
   ------------------------------------------------------------
   Traduit un cadeau TikTok Live ('tiktok:gift') en :
   - N billes mises en file d'attente (BallQueueManager), chacune
     porteuse de l'identité du viewer et du skin de bille du cadeau
   - un événement 'gift:processed' unique, résolu depuis
     /config/gifts.json, que CommunityManager / KeysManager /
     BossManager / ComboManager / UI écoutent chacun de leur côté
     (points, clés, dégâts boss, moment spécial...).
   Ne connaît jamais la physique/le plateau : uniquement de la
   traduction cadeau -> billes + économie.
   ============================================================ */

import { CONFIG } from '../core/config.js';

export class GiftManager {
    /**
     * @param {object} deps
     * @param {import('../core/events.js').eventBus} deps.eventBus
     * @param {import('./ballQueueManager.js').BallQueueManager} deps.ballQueue
     */
    constructor({ eventBus, ballQueue }) {
        this.eventBus = eventBus;
        this.ballQueue = ballQueue;

        eventBus.on('tiktok:gift', (data) => this._onGift(data));
    }

    _findGiftConfig(giftId) {
        const list = CONFIG.GIFTS?.gifts || [];
        return list.find(g => g.id === giftId) || list.find(g => g.id === CONFIG.GIFTS?.defaultGift) || null;
    }

    _onGift(data) {
        const gift = this._findGiftConfig(data.giftId);
        if (!gift) {
            console.warn('[GiftManager] Cadeau inconnu ignoré :', data?.giftId);
            return;
        }

        const ballType = CONFIG.GIFTS.ballTypes?.[gift.ballType] || {};
        const giftCount = Math.max(1, data.giftCount || 1);
        const totalBalls = gift.ballCount * giftCount;

        const requests = [];
        for (let i = 0; i < totalBalls; i++) {
            requests.push({
                playerName: data.username || 'Viewer',
                avatar: data.avatar || null,
                betAmount: Math.max(10, gift.coinValue * 10),
                source: 'tiktok',
                giftId: gift.id,
                ballType: gift.ballType,
                color: ballType.color,
                glowColor: ballType.glowColor,
                symbol: ballType.symbol,
                trailIntensity: ballType.trailIntensity || 1,
                priority: gift.priority || 1
            });
        }
        this.ballQueue.enqueueMany(requests);

        this.eventBus.emit('gift:processed', {
            username: data.username || 'Viewer',
            avatar: data.avatar || null,
            gift,
            ballType,
            giftCount,
            totalBalls,
            giftValue: gift.coinValue * giftCount
        });
    }
}
