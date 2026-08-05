/* ============================================================
   ROYAL DROP — systems/jackpotManager.js
   ------------------------------------------------------------
   Habillage/spectacle autour de la case JACKPOT. Le paiement réel
   d'une bille qui tombe dedans reste calculé exactement comme
   avant (voir entities/ball.js — même case, même multiplicateur,
   même probabilité). Ce module ajoute uniquement :
   - le pool progressif affiché ("JACKPOT PROGRESSIF")
   - le verrouillage/déverrouillage (piloté par le Coffre Royal)
   - la détection d'approche (pour le mode cinématique)
   - la Roue Royale des événements quand le jackpot est déverrouillé
   - le couronnement du gagnant
   ============================================================ */

import { CONFIG } from '../core/config.js';

export class JackpotManager {
    /**
     * @param {object} deps
     * @param {import('../core/events.js').eventBus} deps.eventBus
     * @param {import('../entities/board.js').Board} deps.board
     * @param {import('./eventManager.js').EventManager} deps.eventManager
     */
    constructor({ eventBus, board, eventManager }) {
        this.eventBus = eventBus;
        this.board = board;
        this.eventManager = eventManager;

        const jCfg = CONFIG.JACKPOT || {};
        this.pool = jCfg.progressivePool?.startingValue || 0;
        this.locked = jCfg.lock?.startsLocked !== false;
        this.hitCount = 0;
        this._cinematicBallId = null;
        this._unlockTimeoutId = null;

        eventBus.on('gift:processed', (data) => this._contributeToPool(data));
        eventBus.on('community:chestOpen', () => this._unlock());
        eventBus.on('ball:landed', (data) => this._onBallLanded(data));

        this._emitPoolUpdate();
    }

    /** Appelé chaque frame par la boucle de jeu (main.js) avec les billes actives. */
    update(balls) {
        if (this.locked) return;

        const jackpotZone = this.board.getBucketZone(CONFIG.BUCKETS.JACKPOT_INDEX);
        if (!jackpotZone) return;

        const jackpotX = (jackpotZone.xStart + jackpotZone.xEnd) / 2;
        // Le zoom démarre dans les 3 dernières rangées (c'est là que la
        // trajectoire converge vraiment vers une colonne — plus haut, la
        // position d'une bille est encore trop dispersée pour dire si elle
        // vise le Jackpot) et reste actif jusqu'à l'atterrissage : pendant
        // ce court moment, les buckets sont dessinés DANS la caméra (voir
        // render/pipeline.js) pour que l'entrée dans la case reste un plan
        // rapproché clair, au lieu de disparaître derrière un cadre fixe.
        const approachY = CONFIG.BOARD.BOARD_TOP_Y + (CONFIG.BOARD.ROWS - 3) * CONFIG.BOARD.PEG_SPACING_Y;
        const approachDist = CONFIG.JACKPOT.cinematic?.approachDistancePx || 260;

        let candidate = null;
        for (const ball of balls) {
            if (ball.landed || ball.y < approachY) continue;
            if (Math.abs(ball.x - jackpotX) <= approachDist) {
                candidate = ball;
                break;
            }
        }

        if (candidate && this._cinematicBallId !== candidate.id) {
            this._cinematicBallId = candidate.id;
            this.eventBus.emit('jackpot:approach', { ball: candidate });
        } else if (!candidate && this._cinematicBallId) {
            this._cinematicBallId = null;
            this.eventBus.emit('jackpot:approachEnd', {});
        }
    }

    _contributeToPool(data) {
        const rate = CONFIG.JACKPOT.progressivePool?.contributionPerGift || 0;
        this.pool += (data.giftValue || 0) * rate;
        this._emitPoolUpdate();
    }

    _onBallLanded({ ball, isJackpot }) {
        const wasApproaching = this._cinematicBallId === ball.id;
        if (wasApproaching) {
            this._cinematicBallId = null;
            this.eventBus.emit('jackpot:approachEnd', {});
            if (!isJackpot) this.eventBus.emit('jackpot:nearMiss', { playerName: ball.playerName });
        }

        if (!isJackpot || this.locked) return;

        this.hitCount++;
        this._triggerWheel({ playerName: ball.playerName });

        const maxHits = CONFIG.JACKPOT.lock?.unlockMaxJackpotHits;
        if (maxHits && this.hitCount >= maxHits) this._relock();
    }

    _unlock() {
        this.locked = false;
        this.hitCount = 0;
        this.eventBus.emit('jackpot:unlocked', { durationSec: CONFIG.JACKPOT.lock?.unlockDurationSec || 60 });
        this._emitPoolUpdate();

        if (this._unlockTimeoutId) clearTimeout(this._unlockTimeoutId);
        this._unlockTimeoutId = setTimeout(() => this._relock(), (CONFIG.JACKPOT.lock?.unlockDurationSec || 60) * 1000);
    }

    _relock() {
        if (this.locked) return;
        this.locked = true;
        if (this._unlockTimeoutId) {
            clearTimeout(this._unlockTimeoutId);
            this._unlockTimeoutId = null;
        }
        this.eventBus.emit('jackpot:relocked', {});
        this._emitPoolUpdate();
    }

    _triggerWheel({ playerName }) {
        const wheelCfg = CONFIG.EVENTS?.wheel;
        const segments = wheelCfg?.segments || [];
        if (segments.length === 0) return;

        const chosenId = segments[Math.floor(Math.random() * segments.length)];
        const spinMs = wheelCfg.spinDurationMs || 4000;

        this.eventBus.emit('jackpot:wheelStart', {
            segments,
            spinDurationMs: spinMs,
            spinTurns: wheelCfg.spinTurns || 8,
            chosenId
        });

        setTimeout(() => {
            this.eventBus.emit('jackpot:wheelResult', { eventId: chosenId, playerName });
            // La bille qui a déclenché la roue reste "propriétaire" de l'événement :
            // si celui-ci fait tomber des billes bonus (Pluie de Billes, Royal
            // Drop), leurs gains lui reviennent (voir EventManager._triggerBallRain).
            this.eventManager?.trigger(chosenId, { playerName });
            this._triggerCoronation({ playerName });
        }, spinMs);
    }

    _triggerCoronation({ playerName }) {
        const poolValue = Math.round(this.pool);
        this.eventBus.emit('jackpot:coronation', { playerName: playerName || 'Joueur', poolValue });

        this.pool = CONFIG.JACKPOT.progressivePool?.startingValue || this.pool;
        this._emitPoolUpdate();
    }

    _emitPoolUpdate() {
        this.eventBus.emit('jackpot:poolUpdated', {
            pool: Math.round(this.pool),
            displayMultiplier: CONFIG.JACKPOT.progressivePool?.displayMultiplier || 1,
            locked: this.locked
        });
    }
}
