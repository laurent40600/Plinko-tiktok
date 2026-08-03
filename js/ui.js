/* ============================================================
   ROYAL DROP — ui.js
   ------------------------------------------------------------
   Gère toute l'interface HTML superposée au canvas : HUD,
   panneaux (Top Gift, Derniers Lancers), bouton Lancer,
   menu debug (touche D), écran de chargement.
   Ne contient aucune logique de jeu : ce module lit l'état
   fourni par les autres modules et met à jour le DOM.
   ============================================================ */

const UI = {

    debugEnabled: false,
    debugFlags: {
        hitbox: false,
        vectors: false,
        trajectory: false
    },

    // Cache des éléments DOM fréquemment utilisés
    els: {},

    /* --------------------------------------------------------
       init()
       Récupère les références DOM, branche les écouteurs
       d'événements UI et du jeu, puis fait un premier rendu.
       -------------------------------------------------------- */
    init() {
        this._cacheElements();
        this._bindUIEvents();
        this._bindGameEvents();
        this._loadDebugPreference();

        this.updateLaunchCost(CONFIG.ECONOMY.LAUNCH_COST);
        this.renderTopGift(Leaderboard.getTopEntries());
        this.renderRecentDrops(Players.getRecentDrops());
    },

    /* --------------------------------------------------------
       _cacheElements()
       Stocke les références DOM une seule fois pour éviter
       les querySelector répétés à chaque frame.
       -------------------------------------------------------- */
    _cacheElements() {
        this.els = {
            launchBtn: document.getElementById('launch-btn'),
            launchCostValue: document.getElementById('launch-cost-value'),
            topGiftList: document.getElementById('topgift-list'),
            lastDropsList: document.getElementById('lastdrops-list'),
            bucketsContainer: document.getElementById('ui-buckets'),
            closeBtn: document.getElementById('close-btn'),
            followBtn: document.getElementById('follow-btn'),

            debugPanel: document.getElementById('ui-debug'),
            dbgFps: document.getElementById('dbg-fps'),
            dbgBalls: document.getElementById('dbg-balls'),
            dbgGravity: document.getElementById('dbg-gravity'),
            dbgCollisions: document.getElementById('dbg-collisions'),
            dbgPhysTime: document.getElementById('dbg-phystime'),
            dbgHitbox: document.getElementById('dbg-hitbox'),
            dbgVectors: document.getElementById('dbg-vectors'),
            dbgTrajectory: document.getElementById('dbg-trajectory'),

            loadingScreen: document.getElementById('loading-screen')
        };
    },

    /* --------------------------------------------------------
       _bindUIEvents()
       Branche les interactions utilisateur (clics, touches).
       -------------------------------------------------------- */
    _bindUIEvents() {
        this.els.launchBtn.addEventListener('click', () => this._onLaunchClick());
        this.els.closeBtn.addEventListener('click', () => this._onCloseClick());
        this.els.followBtn.addEventListener('click', () => AudioEngine.playUIClick());

        // Menu debug — touche D
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === CONFIG.DEBUG.TOGGLE_KEY) {
                this.toggleDebug();
            }
        });

        this.els.dbgHitbox.addEventListener('change', (e) => {
            this.debugFlags.hitbox = e.target.checked;
        });
        this.els.dbgVectors.addEventListener('change', (e) => {
            this.debugFlags.vectors = e.target.checked;
        });
        this.els.dbgTrajectory.addEventListener('change', (e) => {
            this.debugFlags.trajectory = e.target.checked;
        });
    },

    /* --------------------------------------------------------
       _bindGameEvents()
       Réagit aux événements émis par les autres modules pour
       rafraîchir l'interface (pattern découplé via EventBus).
       -------------------------------------------------------- */
    _bindGameEvents() {
        EventBus.on('leaderboard:updated', (entries) => this.renderTopGift(entries));
        EventBus.on('players:dropRegistered', (drops) => this.renderRecentDrops(drops));
        EventBus.on('game:jackpotWon', () => this._flashJackpotUI());
    },

    /* --------------------------------------------------------
       _onLaunchClick()
       Déclenche un lancer pour le joueur local (humain), en
       débloquant l'audio si nécessaire (requis sur iPhone).
       -------------------------------------------------------- */
    _onLaunchClick() {
        AudioEngine.unlock();
        AudioEngine.playUIClick();

        TikTokAPI.spawnBall({
            playerName: 'Vous',
            avatar: null,
            betAmount: CONFIG.ECONOMY.LAUNCH_COST,
            source: 'local'
        });
    },

    /* --------------------------------------------------------
       _onCloseClick()
       Comportement du bouton fermeture (à adapter selon le
       contexte d'intégration finale, ex: retour à un menu).
       -------------------------------------------------------- */
    _onCloseClick() {
        AudioEngine.playUIClick();
        console.log('[UI] Bouton fermeture cliqué (comportement à définir).');
    },

    /* --------------------------------------------------------
       renderTopGift(entries)
       Met à jour le panneau "TOP GIFT" avec les meilleures
       entrées du classement.
       -------------------------------------------------------- */
    renderTopGift(entries) {
        const list = this.els.topGiftList;
        list.innerHTML = '';

        entries.forEach((entry, i) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${i + 1}. ${entry.name}</span>
                <span>💎 ${entry.totalValue}</span>
            `;
            list.appendChild(li);
        });
    },

    /* --------------------------------------------------------
       renderRecentDrops(drops)
       Met à jour le panneau "DERNIERS LANCERS" avec l'historique
       le plus récent fourni par players.js.
       -------------------------------------------------------- */
    renderRecentDrops(drops) {
        const list = this.els.lastDropsList;
        list.innerHTML = '';

        drops.forEach((drop) => {
            const secondsAgo = Math.max(0, Math.round((Date.now() - drop.timestamp) / 1000));
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${drop.playerName}<br><small>${secondsAgo}s</small></span>
                <span style="color:${drop.isJackpot ? '#ffd76a' : '#fff'}">${drop.amount}</span>
            `;
            list.appendChild(li);
        });
    },

    /* --------------------------------------------------------
       updateLaunchCost(value)
       Met à jour le montant affiché sur le bouton LANCER.
       -------------------------------------------------------- */
    updateLaunchCost(value) {
        this.els.launchCostValue.textContent = value;
    },

    /* --------------------------------------------------------
       _flashJackpotUI()
       Petit effet visuel sur l'UI quand un jackpot est gagné
       (flash du bouton lancer, par exemple).
       -------------------------------------------------------- */
    _flashJackpotUI() {
        const btn = this.els.launchBtn;
        btn.style.transition = 'box-shadow 0.2s ease';
        btn.style.boxShadow = '0 0 60px 20px rgba(255,215,106,0.9)';
        setTimeout(() => {
            btn.style.boxShadow = '';
        }, CONFIG.BUCKETS.JACKPOT_PULSE_DURATION);
    },

    /* --------------------------------------------------------
       toggleDebug()
       Active/désactive le menu debug et sauvegarde la
       préférence.
       -------------------------------------------------------- */
    toggleDebug() {
        this.debugEnabled = !this.debugEnabled;
        this.els.debugPanel.classList.toggle('hidden', !this.debugEnabled);

        const save = Storage.loadGame();
        save.settings.debugEnabled = this.debugEnabled;
        Storage.saveGame(save);
    },

    /* --------------------------------------------------------
       _loadDebugPreference()
       Restaure l'état du debug depuis la sauvegarde au démarrage.
       -------------------------------------------------------- */
    _loadDebugPreference() {
        const save = Storage.loadGame();
        this.debugEnabled = save.settings.debugEnabled || false;
        this.els.debugPanel.classList.toggle('hidden', !this.debugEnabled);
    },

    /* --------------------------------------------------------
       updateDebugPanel(stats)
       Rafraîchit les valeurs affichées dans le menu debug.
       stats attendu : { fps, ballCount, collisions, physTime }
       Appelé par engine.js à chaque frame si debug actif.
       -------------------------------------------------------- */
    updateDebugPanel(stats) {
        if (!this.debugEnabled) return;

        this.els.dbgFps.textContent = stats.fps;
        this.els.dbgBalls.textContent = stats.ballCount;
        this.els.dbgGravity.textContent = CONFIG.PHYSICS.GRAVITY;
        this.els.dbgCollisions.textContent = stats.collisions;
        this.els.dbgPhysTime.textContent = stats.physTime.toFixed(2);
    },

    /* --------------------------------------------------------
       hideLoadingScreen()
       Masque l'écran de chargement une fois l'initialisation
       du jeu terminée (appelé par game.js).
       -------------------------------------------------------- */
    hideLoadingScreen() {
        this.els.loadingScreen.classList.add('hidden');
        setTimeout(() => {
            this.els.loadingScreen.style.display = 'none';
        }, 700);
    }
};
