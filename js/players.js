/* ============================================================
   ROYAL DROP — players.js
   ------------------------------------------------------------
   Gère les joueurs réels (humains) : historique des lancers,
   mise à jour du panneau "DERNIERS LANCERS" de l'UI.
   Les joueurs virtuels (IA) sont gérés séparément dans bots.js,
   mais les deux passent par les mêmes événements du bus.
   ============================================================ */

const Players = {

    recentDrops: [],       // historique affiché dans le panneau UI
    MAX_RECENT_DROPS: 6,

    /* --------------------------------------------------------
       init()
       Abonne le module aux événements pertinents du jeu.
       -------------------------------------------------------- */
    init() {
        this.recentDrops = [];

        EventBus.on('ball:landed', (data) => this._onBallLanded(data));
        EventBus.on('game:spawnBall', (data) => this._onSpawnRequest(data));
    },

    /* --------------------------------------------------------
       _onSpawnRequest(data)
       Point d'entrée quand un joueur (réel ou futur TikTok)
       demande un lancer. Valide la mise puis délègue à
       BallManager.spawn().
       data attendu : { playerName, avatar, betAmount, source }
       -------------------------------------------------------- */
    _onSpawnRequest(data) {
        const skin = Storage.loadGame().skins.equipped || 'default';

        BallManager.spawn({
            playerName: data.playerName || 'Joueur',
            playerAvatar: data.avatar || null,
            betAmount: data.betAmount || CONFIG.ECONOMY.LAUNCH_COST,
            source: data.source || 'local',
            skin
        });

        AudioEngine.playLaunch();
    },

    /* --------------------------------------------------------
       _onBallLanded(data)
       Appelé quand une bille atteint un bucket. Ajoute
       l'entrée à l'historique des derniers lancers et
       déclenche les effets visuels/sonores correspondants.
       -------------------------------------------------------- */
    _onBallLanded({ ball, bucketIndex, multiplier, winAmount, isJackpot }) {
        this.addRecentDrop({
            playerName: ball.playerName || 'Joueur',
            avatar: ball.playerAvatar,
            amount: winAmount,
            multiplier,
            isJackpot,
            timestamp: Date.now()
        });

        // Effets (délégués, pas de dépendance circulaire directe)
        const zone = Board.getBucketZone(bucketIndex);
        const bucketY = CONFIG.LOGICAL_HEIGHT - CONFIG.BUCKETS.HEIGHT - (CONFIG.BUCKETS.BOTTOM_OFFSET - 70);
        const bucketX = zone ? (zone.xStart + zone.xEnd) / 2 : ball.x;

        if (isJackpot) {
            AudioEngine.playJackpot();
            ParticleSystem.burst(bucketX, bucketY, CONFIG.PARTICLES.BURST_COUNT_ON_JACKPOT, '#ffd76a');
            ParticleSystem.spawnFloatingText(bucketX, bucketY, `JACKPOT! +${winAmount}`, '#ffd76a', 48);
            EventBus.emit('game:jackpotWon', { winAmount, playerName: ball.playerName });
        } else {
            AudioEngine.playBucketWin(multiplier);
            ParticleSystem.burst(bucketX, bucketY, CONFIG.PARTICLES.BURST_COUNT_ON_BUCKET, zone?.color || '#fff');
            ParticleSystem.spawnFloatingText(bucketX, bucketY, `+${winAmount}`, '#ffffff', 34);
        }

        EventBus.emit('players:dropRegistered', this.recentDrops);
    },

    /* --------------------------------------------------------
       addRecentDrop(entry)
       Ajoute une entrée en tête de liste et tronque à la
       taille maximale affichable dans le panneau UI.
       -------------------------------------------------------- */
    addRecentDrop(entry) {
        this.recentDrops.unshift(entry);
        if (this.recentDrops.length > this.MAX_RECENT_DROPS) {
            this.recentDrops.length = this.MAX_RECENT_DROPS;
        }
    },

    /* --------------------------------------------------------
       getRecentDrops()
       Retourne l'historique actuel (utilisé par ui.js pour
       rafraîchir le panneau "DERNIERS LANCERS").
       -------------------------------------------------------- */
    getRecentDrops() {
        return this.recentDrops;
    },

    /* --------------------------------------------------------
       reset()
       Vide l'historique (ex: resetSave() global).
       -------------------------------------------------------- */
    reset() {
        this.recentDrops = [];
    }
};
