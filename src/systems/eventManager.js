/* ============================================================
   ROYAL DROP — systems/eventManager.js
   ------------------------------------------------------------
   Applique les événements spéciaux (Double Gains, Pluie de
   Billes, Case Bonus, Billes Dorées, Royal Drop) sélectionnés par
   la Roue Royale (JackpotManager), et les moments spéciaux liés à
   un cadeau rare (Galaxy Drop, Lion Royal). Toujours une couche
   ADDITIVE et TEMPORAIRE au-dessus de l'économie (CONFIG.RUNTIME) :
   ne touche jamais les picots, la position des cases ni leur
   valeur affichée de base (CONFIG.BUCKETS reste intact).
   ============================================================ */

import { CONFIG } from '../core/config.js';

export class EventManager {
    /**
     * @param {object} deps
     * @param {import('../core/events.js').eventBus} deps.eventBus
     * @param {import('./ballQueueManager.js').BallQueueManager} deps.ballQueue
     * @param {import('./audio.js').AudioEngine} deps.audio
     * @param {import('./bossManager.js').BossManager} [deps.bossManager]
     */
    constructor({ eventBus, ballQueue, audio, bossManager }) {
        this.eventBus = eventBus;
        this.ballQueue = ballQueue;
        this.audio = audio;
        this.bossManager = bossManager;
        this._activeTimeouts = [];

        eventBus.on('gift:processed', (data) => {
            if (data.gift?.specialMoment) this.triggerSpecialMoment(data.gift.specialMoment, data);
        });
    }

    /**
     * Déclenche un événement de /config/events.json par son id (résultat de la
     * Roue Royale).
     * @param {object} [context] - { playerName } : le joueur dont la bille a
     * déclenché la roue. Pour les événements qui font tomber des billes bonus
     * (Pluie de Billes, Royal Drop), ces billes lui appartiennent — c'est lui
     * qui empoche leurs gains, pas un "Royal Event" anonyme.
     */
    trigger(eventId, context = {}) {
        const cfg = (CONFIG.EVENTS?.events || []).find(e => e.id === eventId);
        if (!cfg) return null;

        this.eventBus.emit('event:triggered', cfg);
        this._playSound(cfg.sound);

        if (cfg.payoutMultiplier) this._applyPayoutMultiplier(cfg.payoutMultiplier, cfg.durationSec);
        if (cfg.bonusBucketMultiplier) this._applyBonusBucket(cfg.bonusBucketMultiplier, cfg.durationSec);
        if (cfg.ballRainCount) this._triggerBallRain(cfg, context.playerName);
        if (cfg.goldenBallSkin) this._applyGoldenBalls(cfg.durationSec);

        return cfg;
    }

    /** Moment TV lié à un cadeau rare (Galaxy -> galaxyDrop, Lion -> lionRoyal). */
    triggerSpecialMoment(momentId, giftData) {
        const cfg = CONFIG.EVENTS?.specialMoments?.[momentId];
        if (!cfg) return null;

        this.eventBus.emit('event:specialMoment', { id: momentId, ...cfg, viewer: giftData?.username });
        this._playSound(cfg.sound);

        if (momentId === 'lionRoyal' && cfg.bossBonusDamage) {
            this.bossManager?.damage(cfg.bossBonusDamage, giftData?.username);
        }

        return cfg;
    }

    _playSound(soundId) {
        if (soundId) this.audio?.playNamed?.(soundId);
    }

    _applyPayoutMultiplier(multiplier, durationSec) {
        CONFIG.RUNTIME.payoutMultiplier = multiplier;
        this._scheduleRevert(() => { CONFIG.RUNTIME.payoutMultiplier = 1; }, durationSec);
    }

    _applyBonusBucket(multiplier, durationSec) {
        const total = CONFIG.BUCKETS.VALUES.length;
        const jackpotIdx = CONFIG.BUCKETS.JACKPOT_INDEX;
        let idx;
        do {
            idx = Math.floor(Math.random() * total);
        } while (idx === jackpotIdx);

        CONFIG.RUNTIME.bonusBucketIndex = idx;
        CONFIG.RUNTIME.bonusBucketMultiplier = multiplier;
        this.eventBus.emit('event:bonusBucket', { index: idx, multiplier });

        this._scheduleRevert(() => {
            CONFIG.RUNTIME.bonusBucketIndex = -1;
            CONFIG.RUNTIME.bonusBucketMultiplier = 1;
            this.eventBus.emit('event:bonusBucket', { index: -1, multiplier: 1 });
        }, durationSec);
    }

    _applyGoldenBalls(durationSec) {
        CONFIG.RUNTIME.goldenBallsActive = true;
        this._scheduleRevert(() => { CONFIG.RUNTIME.goldenBallsActive = false; }, durationSec);
    }

    _triggerBallRain(cfg, playerName) {
        this.ballQueue.setBurstMode(10);

        const ballType = CONFIG.GIFTS?.ballTypes?.[cfg.ballType] || {};
        const requests = [];
        for (let i = 0; i < cfg.ballRainCount; i++) {
            requests.push({
                // Ces billes appartiennent au joueur qui a déclenché la roue :
                // ses gains (points, classement) selon la case touchée par
                // chacune des N billes lui reviennent, comme un lancer normal.
                playerName: playerName || 'Royal Event',
                avatar: null,
                betAmount: CONFIG.ECONOMY.LAUNCH_COST,
                source: 'event',
                giftId: null,
                ballType: cfg.ballType,
                color: ballType.color,
                glowColor: ballType.glowColor,
                symbol: ballType.symbol,
                trailIntensity: ballType.trailIntensity || 1,
                priority: 3
            });
        }
        this.ballQueue.enqueueMany(requests);
    }

    _scheduleRevert(fn, durationSec) {
        if (!durationSec) return;
        const id = setTimeout(fn, durationSec * 1000);
        this._activeTimeouts.push(id);
    }
}
