/* ============================================================
   ROYAL DROP — engine.js
   ------------------------------------------------------------
   Boucle principale du jeu (game loop). Orchestre chaque frame :
   mise à jour physique, caméra, particules, puis rendu.
   Gère aussi le calcul du delta time et le plafonnement pour
   éviter les gros sauts (ex: onglet en arrière-plan sur iPhone).
   Ne contient aucune logique métier propre à un système
   particulier (ça reste dans physics.js, ball.js, etc.).
   ============================================================ */

const Engine = {

    running: false,
    lastTimestamp: 0,

    // Compteur FPS lissé pour l'affichage debug
    fpsAccumulator: 0,
    fpsFrameCount: 0,
    currentFps: 0,
    fpsUpdateInterval: 0.5, // secondes entre chaque rafraîchissement du FPS affiché
    fpsTimer: 0,

    /* --------------------------------------------------------
       init()
       Prépare la boucle mais ne la démarre pas encore
       (démarrage explicite via start(), appelé par game.js).
       -------------------------------------------------------- */
    init() {
        this.running = false;
        this.lastTimestamp = 0;
        this.fpsAccumulator = 0;
        this.fpsFrameCount = 0;
        this.currentFps = 0;
        this.fpsTimer = 0;
    },

    /* --------------------------------------------------------
       start()
       Démarre la boucle de jeu via requestAnimationFrame.
       -------------------------------------------------------- */
    start() {
        if (this.running) return;
        this.running = true;
        this.lastTimestamp = performance.now();
        requestAnimationFrame((ts) => this._loop(ts));
    },

    /* --------------------------------------------------------
       stop()
       Arrête la boucle de jeu (ex: pause, changement de scène).
       -------------------------------------------------------- */
    stop() {
        this.running = false;
    },

    /* --------------------------------------------------------
       _loop(timestamp)
       Cœur de la boucle : calcule dt, plafonne les valeurs
       aberrantes, met à jour tous les systèmes, puis dessine.
       Se reprogramme elle-même via requestAnimationFrame.
       -------------------------------------------------------- */
    _loop(timestamp) {
        if (!this.running) return;

        let dt = (timestamp - this.lastTimestamp) / 1000;
        this.lastTimestamp = timestamp;

        // Plafonnement du delta time : évite les sauts brutaux
        // si l'onglet était en arrière-plan (ex: iPhone verrouillé)
        dt = Math.min(dt, CONFIG.PERFORMANCE.MAX_DELTA_TIME);

        this._updateFpsCounter(dt);
        this._update(dt);
        this._render();

        requestAnimationFrame((ts) => this._loop(ts));
    },

    /* --------------------------------------------------------
       _update(dt)
       Met à jour tous les systèmes de simulation dans l'ordre
       logique : billes/physique, caméra, particules.
       -------------------------------------------------------- */
    _update(dt) {
        BallManager.updateAll(dt, Board.pegs);
        Camera.update(dt);
        ParticleSystem.update(dt);

        if (UI.debugEnabled) {
            UI.updateDebugPanel({
                fps: this.currentFps,
                ballCount: BallManager.activeCount,
                collisions: Physics.collisionCountThisFrame,
                physTime: Physics.lastFrameTimeMs
            });
        }
    },

    /* --------------------------------------------------------
       _render()
       Délègue tout le dessin à renderer.js, en lui passant
       les indicateurs debug actuellement actifs.
       -------------------------------------------------------- */
    _render() {
        Renderer.drawScene(UI.debugEnabled ? UI.debugFlags : {});
    },

    /* --------------------------------------------------------
       _updateFpsCounter(dt)
       Calcule un FPS lissé (moyenne sur fpsUpdateInterval)
       plutôt qu'un FPS instantané qui varierait trop vite
       pour être lisible dans le menu debug.
       -------------------------------------------------------- */
    _updateFpsCounter(dt) {
        this.fpsFrameCount++;
        this.fpsTimer += dt;

        if (this.fpsTimer >= this.fpsUpdateInterval) {
            this.currentFps = Math.round(this.fpsFrameCount / this.fpsTimer);
            this.fpsFrameCount = 0;
            this.fpsTimer = 0;
        }
    }
};
