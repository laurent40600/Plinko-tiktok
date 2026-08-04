/* ============================================================
   ROYAL DROP — systems/players.js
   ------------------------------------------------------------
   Joueurs réels (humains) : historique des lancers affiché
   dans le panneau "DERNIERS LANCERS". Les joueurs virtuels
   (IA) sont gérés séparément dans systems/bots.js, mais les
   deux passent par le même point d'entrée : 'game:spawnBall'.
   ============================================================ */

import { CONFIG } from '../core/config.js';

const MAX_RECENT_DROPS = 6;

export class Players {
    /**
     * @param {object} deps
     * @param {import('../core/events.js').eventBus} deps.eventBus
     * @param {import('../entities/ball.js').BallManager} deps.ballManager
     * @param {import('./audio.js').AudioEngine} deps.audio
     * @param {() => string} deps.getEquippedSkin
     */
    constructor({ eventBus, ballManager, audio, getEquippedSkin }) {
        this.eventBus = eventBus;
        this.ballManager = ballManager;
        this.audio = audio;
        this.getEquippedSkin = getEquippedSkin;
        this.recentDrops = [];

        eventBus.on('game:spawnBall', (data) => this._onSpawnRequest(data));
        eventBus.on('ball:landed', (data) => this._onBallLanded(data));
    }

    /** Point d'entrée unique pour tout lancer : cadeau spectateur (à venir), bot, ou test. */
    _onSpawnRequest(data) {
        this.ballManager.spawn({
            playerName: data.playerName || 'Joueur',
            playerAvatar: data.avatar || null,
            betAmount: data.betAmount || CONFIG.ECONOMY.LAUNCH_COST,
            source: data.source || 'local',
            skin: this.getEquippedSkin()
        });

        this.audio.playLaunch();
    }

    _onBallLanded({ ball, winAmount, multiplier, isJackpot }) {
        this.addRecentDrop({
            playerName: ball.playerName || 'Joueur',
            avatar: ball.playerAvatar,
            amount: winAmount,
            multiplier,
            isJackpot,
            timestamp: Date.now()
        });

        this.eventBus.emit('players:dropRegistered', this.recentDrops);
    }

    addRecentDrop(entry) {
        this.recentDrops.unshift(entry);
        if (this.recentDrops.length > MAX_RECENT_DROPS) {
            this.recentDrops.length = MAX_RECENT_DROPS;
        }
    }

    getRecentDrops() {
        return this.recentDrops;
    }

    reset() {
        this.recentDrops = [];
    }
}
