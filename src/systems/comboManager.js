/* ============================================================
   ROYAL DROP — systems/comboManager.js
   ------------------------------------------------------------
   Jauge de "hype" façon émission live : chaque cadeau reçu dans
   la fenêtre de temps du précédent fait grimper un combo global.
   Le combo retombe après une pause. Sert uniquement de retour
   visuel/sonore ("ça chauffe !") — n'a aucun effet sur l'économie
   ou la physique.
   ============================================================ */

const COMBO_TIMEOUT_MS = 4000;
const MILESTONES = [5, 10, 20, 30, 50];

export class ComboManager {
    /** @param {object} deps @param {import('../core/events.js').eventBus} deps.eventBus */
    constructor({ eventBus }) {
        this.eventBus = eventBus;
        this.count = 0;
        this._lastGiftAt = 0;
        this._timeoutId = null;

        eventBus.on('gift:processed', () => this._onGift());
    }

    _onGift() {
        const now = Date.now();
        if (now - this._lastGiftAt > COMBO_TIMEOUT_MS) {
            this.count = 0;
        }
        this._lastGiftAt = now;
        this.count++;

        this.eventBus.emit('combo:updated', { count: this.count });
        if (MILESTONES.includes(this.count)) {
            this.eventBus.emit('combo:milestone', { count: this.count });
        }

        if (this._timeoutId) clearTimeout(this._timeoutId);
        this._timeoutId = setTimeout(() => this._reset(), COMBO_TIMEOUT_MS);
    }

    _reset() {
        this.count = 0;
        this.eventBus.emit('combo:updated', { count: 0 });
    }
}
