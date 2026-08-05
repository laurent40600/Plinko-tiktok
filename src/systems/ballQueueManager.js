/* ============================================================
   ROYAL DROP — systems/ballQueueManager.js
   ------------------------------------------------------------
   Point d'entrée UNIQUE vers 'game:spawnBall' (donc vers le
   plateau). Ne laisse jamais plus de MAX_VISIBLE billes actives
   en même temps à l'écran : le reste attend en file, triée par
   priorité (les cadeaux rares passent devant), et se déclenche
   automatiquement dès qu'une bille atterrit et libère une place.

   Les moments spéciaux (Pluie de Billes, Royal Drop) peuvent
   lever temporairement le plafond via setBurstMode(), pour une
   vraie sensation d'averse sans jamais dépasser une limite sûre
   pour le moteur physique (voir CONFIG.PHYSICS.ANTI_STUCK).
   ============================================================ */

import { CONFIG } from '../core/config.js';

export class BallQueueManager {
    /**
     * @param {object} deps
     * @param {import('../core/events.js').eventBus} deps.eventBus
     * @param {import('../entities/ball.js').BallManager} deps.ballManager
     */
    constructor({ eventBus, ballManager }) {
        this.eventBus = eventBus;
        this.ballManager = ballManager;

        this.queue = [];
        this.maxVisible = CONFIG.BALL_QUEUE.MAX_VISIBLE;
        this._burstTimeoutId = null;

        eventBus.on('ball:landed', () => this._tryDequeue());
    }

    enqueue(request) {
        this.queue.push(request);
        this._sortByPriority();
        this._tryDequeue();
        this._emitQueueUpdate();
    }

    enqueueMany(requests) {
        this.queue.push(...requests);
        this._sortByPriority();
        this._tryDequeue();
        this._emitQueueUpdate();
    }

    _sortByPriority() {
        this.queue.sort((a, b) => (b.priority || 1) - (a.priority || 1));
    }

    _tryDequeue() {
        let dequeuedAny = false;
        while (this.ballManager.activeCount < this.maxVisible && this.queue.length > 0) {
            const request = this.queue.shift();
            this.eventBus.emit('game:spawnBall', request);
            dequeuedAny = true;
        }
        if (dequeuedAny) this._emitQueueUpdate();
    }

    /** Notifie l'UI ("Prochains joueurs") de l'état actuel de la file d'attente. */
    _emitQueueUpdate() {
        this.eventBus.emit('queue:updated', {
            pending: this.queue.slice(0, 6).map(r => ({
                playerName: r.playerName,
                ballType: r.ballType,
                symbol: r.symbol,
                color: r.color
            })),
            totalPending: this.queue.length
        });
    }

    /** Lève temporairement le plafond de billes visibles (moments "pluie de billes"). */
    setBurstMode(durationSec = 8) {
        this.maxVisible = CONFIG.BALL_QUEUE.BURST_MAX_VISIBLE;
        this._tryDequeue();

        if (this._burstTimeoutId) clearTimeout(this._burstTimeoutId);
        this._burstTimeoutId = setTimeout(() => {
            this.maxVisible = CONFIG.BALL_QUEUE.MAX_VISIBLE;
        }, durationSec * 1000);
    }

    get pendingCount() {
        return this.queue.length;
    }

    clear() {
        this.queue = [];
        if (this._burstTimeoutId) clearTimeout(this._burstTimeoutId);
        this.maxVisible = CONFIG.BALL_QUEUE.MAX_VISIBLE;
    }
}
