/* ============================================================
   ROYAL DROP — systems/leaderboard.js
   ------------------------------------------------------------
   Classement "TOP GIFT" (panneau gauche haut) : gains cumulés
   par joueur, indépendamment de l'historique brut (players.js).
   ============================================================ */

const MAX_DISPLAYED = 3;

export class Leaderboard {
    /**
     * @param {object} deps
     * @param {import('../core/events.js').eventBus} deps.eventBus
     * @param {Array} [deps.initialEntries]
     */
    constructor({ eventBus, initialEntries = [] }) {
        this.eventBus = eventBus;
        this.entries = initialEntries;

        eventBus.on('ball:landed', (data) => this._onBallLanded(data));
        eventBus.on('gift:processed', (data) => this._onGiftReceived(data));
        eventBus.on('jackpot:coronation', (data) => this._onCoronation(data));
    }

    /** Le vainqueur du Jackpot déverrouillé reçoit le pool progressif comme bonus de classement,
        et devient le "Roi du Royaume" affiché en permanence jusqu'au prochain couronnement. */
    _onCoronation({ playerName, poolValue }) {
        if (!playerName) return;
        this._addValue(playerName, null, poolValue || 0);
        const entry = this.entries.find(e => e.name === playerName);
        this.eventBus.emit('leaderboard:kingCrowned', { playerName, totalValue: entry?.totalValue || 0 });
    }

    /** Seuls les gains positifs comptent (un x0.5 ne fait pas progresser le rang). */
    _onBallLanded({ ball, winAmount }) {
        if (!ball.playerName || winAmount <= 0) return;
        this._addValue(ball.playerName, ball.playerAvatar, winAmount);
    }

    /** Un cadeau (résolu par GiftManager) alimente aussi directement le classement "TOP GIFT". */
    _onGiftReceived(data) {
        if (!data?.username) return;
        this._addValue(data.username, data.avatar, data.giftValue || 0);
    }

    _addValue(name, avatar, value) {
        let entry = this.entries.find(e => e.name === name);
        if (!entry) {
            entry = { name, avatar, totalValue: 0 };
            this.entries.push(entry);
        }

        entry.totalValue += value;
        if (avatar) entry.avatar = avatar;

        this.entries.sort((a, b) => b.totalValue - a.totalValue);
        this.eventBus.emit('leaderboard:updated', this.getTopEntries());
        // Diffusé pour CHAQUE joueur (pas seulement le top 3) : permet par
        // exemple au bandeau "Roi du Royaume" de suivre son total en direct
        // même s'il sort du top 3 affiché dans le panneau TOP GIFT.
        this.eventBus.emit('leaderboard:entryUpdated', { name, totalValue: entry.totalValue });
    }

    getTopEntries() {
        return this.entries.slice(0, MAX_DISPLAYED);
    }

    getFullLeaderboard() {
        return this.entries;
    }

    reset() {
        this.entries = [];
    }
}
