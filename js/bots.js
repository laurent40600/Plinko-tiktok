/* ============================================================
   ROYAL DROP — bots.js
   ------------------------------------------------------------
   Gère les joueurs virtuels (IA) qui jouent automatiquement
   pour animer le live même sans spectateurs actifs.
   Chaque bot a un nom, un avatar, une mise, une personnalité
   et un historique. La boucle de jeu des bots est isolée
   dans botLaunchLoop() pour rester facilement désactivable.
   ============================================================ */

const Bots = {

    virtualPlayers: [],
    loopTimeoutId: null,
    isRunning: false,

    /* --------------------------------------------------------
       init()
       Génère la liste des joueurs virtuels à partir du pool
       de noms défini dans config.js, puis démarre la boucle
       si les bots sont activés.
       -------------------------------------------------------- */
    init() {
        this.virtualPlayers = this._generateVirtualPlayers();

        if (CONFIG.BOTS.ENABLED) {
            this.start();
        }
    },

    /* --------------------------------------------------------
       _generateVirtualPlayers()
       Crée un ensemble de joueurs IA avec des attributs
       stables (nom, avatar, personnalité, skins favoris).
       -------------------------------------------------------- */
    _generateVirtualPlayers() {
        const names = CONFIG.BOTS.NAMES_POOL.slice(0, CONFIG.BOTS.MAX_ACTIVE_NAMES);
        const personalities = CONFIG.BOTS.PERSONALITIES;

        return names.map((name, i) => ({
            name,
            avatar: null, // à remplacer par une icône générée/assignée plus tard
            personality: personalities[i % personalities.length],
            history: [],           // { winAmount, multiplier, timestamp }
            favoriteSkins: ['default'],
            baseBet: this._getBaseBetForPersonality(personalities[i % personalities.length])
        }));
    },

    /* --------------------------------------------------------
       _getBaseBetForPersonality(personality)
       Détermine la mise de base typique selon la personnalité
       du bot (utilisé pour varier le rythme des mises).
       -------------------------------------------------------- */
    _getBaseBetForPersonality(personality) {
        switch (personality) {
            case 'prudent': return 50;
            case 'agressif': return 300;
            case 'chanceux': return 150;
            case 'fidele': return 100;
            default: return CONFIG.ECONOMY.LAUNCH_COST;
        }
    },

    /* --------------------------------------------------------
       start()
       Démarre la boucle de lancers automatiques des bots.
       -------------------------------------------------------- */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.botLaunchLoop();
    },

    /* --------------------------------------------------------
       stop()
       Arrête la boucle (ex: désactivation depuis le debug ou
       les paramètres).
       -------------------------------------------------------- */
    stop() {
        this.isRunning = false;
        if (this.loopTimeoutId) {
            clearTimeout(this.loopTimeoutId);
            this.loopTimeoutId = null;
        }
    },

    /* --------------------------------------------------------
       botLaunchLoop()
       Boucle isolée qui fait jouer un bot aléatoire à
       intervalles variables. Reprogrammée récursivement via
       setTimeout pour rester légère et ne jamais bloquer la
       boucle de rendu principale (engine.js).
       -------------------------------------------------------- */
    botLaunchLoop() {
        if (!this.isRunning) return;

        const bot = this._pickRandomBot();
        if (bot) {
            this._launchBot(bot);
        }

        const min = CONFIG.BOTS.SPAWN_INTERVAL_MIN * 1000;
        const max = CONFIG.BOTS.SPAWN_INTERVAL_MAX * 1000;
        const nextDelay = min + Math.random() * (max - min);

        this.loopTimeoutId = setTimeout(() => this.botLaunchLoop(), nextDelay);
    },

    /* --------------------------------------------------------
       _pickRandomBot()
       Sélectionne un bot aléatoire parmi les joueurs virtuels.
       -------------------------------------------------------- */
    _pickRandomBot() {
        if (this.virtualPlayers.length === 0) return null;
        const index = Math.floor(Math.random() * this.virtualPlayers.length);
        return this.virtualPlayers[index];
    },

    /* --------------------------------------------------------
       _launchBot(bot)
       Fait "lancer" un bot : varie légèrement sa mise selon sa
       personnalité, puis passe par le même point d'entrée que
       les joueurs réels (TikTokAPI.spawnBall / EventBus).
       -------------------------------------------------------- */
    _launchBot(bot) {
        const betVariation = 0.7 + Math.random() * 0.6; // ±30%
        const betAmount = Math.round(bot.baseBet * betVariation);

        TikTokAPI.spawnBall({
            playerName: bot.name,
            avatar: bot.avatar,
            betAmount,
            source: 'bot'
        });

        // Historique interne du bot (utile pour un futur affichage
        // de statistiques par joueur virtuel)
        bot.history.push({
            betAmount,
            timestamp: Date.now()
        });
        if (bot.history.length > 20) {
            bot.history.shift();
        }
    },

    /* --------------------------------------------------------
       reset()
       Réinitialise l'historique des bots (ne recrée pas les
       joueurs virtuels, juste leur historique de lancers).
       -------------------------------------------------------- */
    reset() {
        for (const bot of this.virtualPlayers) {
            bot.history = [];
        }
    }
};
