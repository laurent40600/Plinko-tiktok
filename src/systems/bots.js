/* ============================================================
   ROYAL DROP — systems/bots.js
   ------------------------------------------------------------
   Joueurs virtuels (IA) qui jouent automatiquement pour animer
   le live même sans spectateurs actifs. Passent par le même
   point d'entrée que les joueurs réels : 'game:spawnBall'.
   ============================================================ */

import { CONFIG } from '../core/config.js';

const BASE_BET_BY_PERSONALITY = {
    prudent: 50,
    agressif: 300,
    chanceux: 150,
    fidele: 100
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
                history: [], // { betAmount, timestamp }
                baseBet: BASE_BET_BY_PERSONALITY[personality] ?? CONFIG.ECONOMY.LAUNCH_COST
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
        if (bot) this._launchBot(bot);

        const min = CONFIG.BOTS.SPAWN_INTERVAL_MIN * 1000;
        const max = CONFIG.BOTS.SPAWN_INTERVAL_MAX * 1000;
        const nextDelay = min + Math.random() * (max - min);

        this.loopTimeoutId = setTimeout(() => this._loop(), nextDelay);
    }

    _pickRandomBot() {
        if (this.virtualPlayers.length === 0) return null;
        return this.virtualPlayers[Math.floor(Math.random() * this.virtualPlayers.length)];
    }

    _launchBot(bot) {
        const betVariation = 0.7 + Math.random() * 0.6; // ±30%
        const betAmount = Math.round(bot.baseBet * betVariation);

        this.eventBus.emit('game:spawnBall', {
            playerName: bot.name,
            avatar: bot.avatar,
            betAmount,
            source: 'bot'
        });

        bot.history.push({ betAmount, timestamp: Date.now() });
        if (bot.history.length > 20) bot.history.shift();
    }

    reset() {
        for (const bot of this.virtualPlayers) bot.history = [];
    }
}
