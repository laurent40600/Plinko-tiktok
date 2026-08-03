/* ============================================================
   ROYAL DROP — leaderboard.js
   ------------------------------------------------------------
   Gère le classement "TOP GIFT" affiché dans le panneau UI
   gauche haut. Indépendant de players.js : ce module ne suit
   que les gains cumulés par joueur, pas l'historique brut.
   ============================================================ */

const Leaderboard = {

    entries: [],            // [{ name, avatar, totalValue }]
    MAX_DISPLAYED: 3,

    /* --------------------------------------------------------
       init()
       Charge le classement depuis la sauvegarde et s'abonne
       aux événements de gains.
       -------------------------------------------------------- */
    init() {
        const save = Storage.loadGame();
        this.entries = save.leaderboard || [];

        EventBus.on('ball:landed', (data) => this._onBallLanded(data));
        EventBus.on('tiktok:gift', (data) => this._onGiftReceived(data));
    },

    /* --------------------------------------------------------
       _onBallLanded(data)
       Met à jour le classement quand un gain est remporté.
       Seuls les gains positifs comptent pour le classement
       (un multiplicateur x0.2 ne fait pas progresser le rang).
       -------------------------------------------------------- */
    _onBallLanded({ ball, winAmount }) {
        if (!ball.playerName || winAmount <= 0) return;

        this._addValue(ball.playerName, ball.playerAvatar, winAmount);
    },

    /* --------------------------------------------------------
       _onGiftReceived(data)
       Futur hook TikTok Live : un cadeau reçu alimente
       directement le classement, indépendamment des lancers.
       data attendu : { username, giftValue, avatar }
       -------------------------------------------------------- */
    _onGiftReceived(data) {
        if (!data || !data.username) return;
        this._addValue(data.username, data.avatar, data.giftValue || 0);
    },

    /* --------------------------------------------------------
       _addValue(name, avatar, value)
       Ajoute une valeur au total d'un joueur existant, ou crée
       une nouvelle entrée. Retrie ensuite le classement.
       -------------------------------------------------------- */
    _addValue(name, avatar, value) {
        let entry = this.entries.find(e => e.name === name);

        if (!entry) {
            entry = { name, avatar, totalValue: 0 };
            this.entries.push(entry);
        }

        entry.totalValue += value;
        if (avatar) entry.avatar = avatar;

        this._sortEntries();
        EventBus.emit('leaderboard:updated', this.getTopEntries());
    },

    /* --------------------------------------------------------
       _sortEntries()
       Trie par valeur totale décroissante.
       -------------------------------------------------------- */
    _sortEntries() {
        this.entries.sort((a, b) => b.totalValue - a.totalValue);
    },

    /* --------------------------------------------------------
       getTopEntries()
       Retourne les N meilleures entrées à afficher dans le
       panneau "TOP GIFT" (N défini par MAX_DISPLAYED).
       -------------------------------------------------------- */
    getTopEntries() {
        return this.entries.slice(0, this.MAX_DISPLAYED);
    },

    /* --------------------------------------------------------
       getFullLeaderboard()
       Retourne le classement complet (utile pour la sauvegarde).
       -------------------------------------------------------- */
    getFullLeaderboard() {
        return this.entries;
    },

    /* --------------------------------------------------------
       reset()
       Vide entièrement le classement.
       -------------------------------------------------------- */
    reset() {
        this.entries = [];
    }
};
