/* ============================================================
   ROYAL DROP — entities/ball.js
   ------------------------------------------------------------
   Pool de billes recyclables (object pool) : aucune allocation
   pendant le jeu, une bille "détruite" est juste désactivée et
   réutilisée au prochain lancer.
   ============================================================ */

import { CONFIG } from '../core/config.js';

export class BallManager {
    /**
     * @param {object} deps
     * @param {import('../systems/physics.js').Physics} deps.physics
     * @param {import('./board.js').Board} deps.board
     * @param {import('../core/events.js').eventBus} deps.eventBus
     */
    constructor({ physics, board, eventBus }) {
        this.physics = physics;
        this.board = board;
        this.eventBus = eventBus;

        this.pool = [];
        this.activeCount = 0;
        for (let i = 0; i < CONFIG.BALL.POOL_SIZE; i++) {
            this.pool.push(this._createEmptyBall());
        }
    }

    _createEmptyBall() {
        return {
            active: false,
            x: 0, y: 0, vx: 0, vy: 0,
            radius: CONFIG.BALL.RADIUS,
            color: CONFIG.BALL.DEFAULT_COLOR,
            skin: 'default',

            playerName: null,
            playerAvatar: null,
            betAmount: 0,
            source: 'local', // 'local' | 'bot' | 'tiktok'

            giftId: null,
            ballType: 'rose',
            glowColor: null,
            symbol: null,
            trailIntensity: 1,

            stuckTimer: 0,
            trail: [],
            landed: false,
            id: null
        };
    }

    _getFreeBall() {
        for (const b of this.pool) {
            if (!b.active) return b;
        }
        return null;
    }

    /** @param {object} options - { playerName, playerAvatar, betAmount, source, skin, color } */
    spawn(options = {}) {
        const ball = this._getFreeBall();
        if (!ball) {
            console.warn('[BallManager] Pool de billes épuisé, lancer ignoré.');
            return null;
        }

        ball.active = true;
        ball.x = CONFIG.LOGICAL_WIDTH / 2 + (Math.random() - 0.5) * 16;
        ball.y = CONFIG.BALL.SPAWN_Y;
        ball.vx = (Math.random() - 0.5) * 20;
        ball.vy = 0;
        ball.radius = CONFIG.BALL.RADIUS;
        ball.color = options.color || CONFIG.BALL.DEFAULT_COLOR;
        ball.skin = options.skin || 'default';

        ball.playerName = options.playerName || null;
        ball.playerAvatar = options.playerAvatar || null;
        ball.betAmount = options.betAmount || CONFIG.ECONOMY.LAUNCH_COST;
        ball.source = options.source || 'local';

        ball.giftId = options.giftId || null;
        ball.ballType = options.ballType || 'rose';
        ball.glowColor = options.glowColor || null;
        ball.symbol = options.symbol || null;
        ball.trailIntensity = options.trailIntensity || 1;

        ball.stuckTimer = 0;
        ball.trail = [];
        ball.landed = false;
        ball.id = `ball_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

        this.activeCount++;
        this.eventBus.emit('ball:spawned', ball);
        return ball;
    }

    release(ball) {
        if (!ball || !ball.active) return;
        ball.active = false;
        ball.trail = [];
        this.activeCount = Math.max(0, this.activeCount - 1);
    }

    updateAll(dt) {
        this.physics.resetFrameCounters();

        let checksThisFrame = 0;
        const maxChecks = CONFIG.PHYSICS.ANTI_STUCK.MAX_STUCK_CHECKS_PER_FRAME;

        for (const ball of this.pool) {
            if (!ball.active || ball.landed) continue;

            this.physics.step(ball, dt, this.board.pegs);
            checksThisFrame++;

            if (this.board.isInBucketZone(ball.y)) {
                this._handleBucketLanding(ball);
            }

            if (checksThisFrame >= maxChecks) break;
        }
    }

    _handleBucketLanding(ball) {
        const bucketIndex = this.board.getBucketIndexFromX(ball.x);
        const multiplier = CONFIG.BUCKETS.VALUES[bucketIndex] ?? 1;
        const isJackpot = bucketIndex === CONFIG.BUCKETS.JACKPOT_INDEX;

        // Couche additive purement économique (événements "Double Gains",
        // "Billes Dorées", "Case Bonus") : ne modifie jamais la case
        // touchée, la valeur affichée du bucket ni la trajectoire, juste
        // le gain final versé.
        const runtime = CONFIG.RUNTIME || {};
        let payoutMultiplier = runtime.payoutMultiplier || 1;
        if (bucketIndex === runtime.bonusBucketIndex) {
            payoutMultiplier *= runtime.bonusBucketMultiplier || 1;
        }
        const winAmount = Math.round(ball.betAmount * multiplier * payoutMultiplier);

        ball.landed = true;

        this.eventBus.emit('ball:landed', {
            ball, bucketIndex, multiplier, winAmount, isJackpot,
            bonusApplied: payoutMultiplier !== 1
        });

        this.release(ball);
    }

    getActiveBalls() {
        return this.pool.filter(b => b.active);
    }

    reset() {
        for (const b of this.pool) {
            b.active = false;
            b.trail = [];
        }
        this.activeCount = 0;
    }
}
