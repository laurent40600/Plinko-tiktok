/* ============================================================
   ROYAL DROP — systems/bossManager.js
   ------------------------------------------------------------
   Boss communautaire, visible uniquement pendant certains
   événements (Royal Drop, ou une série de Galaxy Drop). Chaque
   cadeau reçu pendant que le boss est actif lui inflige des
   dégâts (gift.bossDamage, /config/gifts.json) ; sa défaite
   déclenche une pluie de récompenses.
   ============================================================ */

import { CONFIG } from '../core/config.js';

const GALAXY_STREAK_WINDOW_MS = 20000;
const GALAXY_STREAK_TO_SPAWN = 3;

export class BossManager {
    /**
     * @param {object} deps
     * @param {import('../core/events.js').eventBus} deps.eventBus
     * @param {import('./ballQueueManager.js').BallQueueManager} deps.ballQueue
     * @param {import('./audio.js').AudioEngine} deps.audio
     */
    constructor({ eventBus, ballQueue, audio }) {
        this.eventBus = eventBus;
        this.ballQueue = ballQueue;
        this.audio = audio;

        this.active = false;
        this.maxHp = CONFIG.BOSS?.maxHp || 6000;
        this.hp = this.maxHp;
        this._galaxyStreakTimestamps = [];

        eventBus.on('event:triggered', (cfg) => {
            if (cfg.id === 'royal_drop') this.spawn();
        });
        eventBus.on('event:specialMoment', (data) => {
            if (data.id === 'galaxyDrop') this._trackGalaxyStreak();
        });
        eventBus.on('gift:processed', (data) => {
            if (this.active) this.damage(data.gift?.bossDamage || 0, data.username);
        });
    }

    _trackGalaxyStreak() {
        const now = Date.now();
        this._galaxyStreakTimestamps.push(now);
        this._galaxyStreakTimestamps = this._galaxyStreakTimestamps.filter(t => now - t <= GALAXY_STREAK_WINDOW_MS);

        if (this._galaxyStreakTimestamps.length >= GALAXY_STREAK_TO_SPAWN && !this.active) {
            this._galaxyStreakTimestamps = [];
            this.spawn();
        }
    }

    spawn() {
        if (!CONFIG.BOSS?.enabled || this.active) return;

        this.active = true;
        this.hp = this.maxHp;
        this.audio?.playNamed?.(CONFIG.BOSS?.entrance?.sound);
        this.eventBus.emit('boss:spawned', { maxHp: this.maxHp });
    }

    damage(amount, sourceName) {
        if (!this.active || !amount) return;

        this.hp = Math.max(0, this.hp - amount);
        this.audio?.playNamed?.(CONFIG.BOSS?.hitSound);
        this.eventBus.emit('boss:damaged', {
            hp: this.hp,
            maxHp: this.maxHp,
            percent: (this.hp / this.maxHp) * 100,
            sourceName
        });

        if (this.hp <= 0) this._defeat();
    }

    _defeat() {
        this.active = false;
        this.audio?.playNamed?.(CONFIG.BOSS?.defeat?.sound);
        this.eventBus.emit('boss:defeated', {});

        const rewardCount = CONFIG.BOSS?.defeat?.rewardBallRainCount || 0;
        if (rewardCount > 0) {
            const ballType = CONFIG.GIFTS?.ballTypes?.[CONFIG.BOSS.defeat.rewardBallType] || {};
            this.ballQueue.setBurstMode(10);
            const requests = [];
            for (let i = 0; i < rewardCount; i++) {
                requests.push({
                    playerName: 'Récompense Royale',
                    avatar: null,
                    betAmount: CONFIG.ECONOMY.LAUNCH_COST,
                    source: 'event',
                    ballType: CONFIG.BOSS.defeat.rewardBallType,
                    color: ballType.color,
                    glowColor: ballType.glowColor,
                    symbol: ballType.symbol,
                    trailIntensity: ballType.trailIntensity || 1,
                    priority: 3
                });
            }
            this.ballQueue.enqueueMany(requests);
        }
    }

    getState() {
        return { active: this.active, hp: this.hp, maxHp: this.maxHp, percent: (this.hp / this.maxHp) * 100 };
    }
}
