/* ============================================================
   ROYAL DROP — game.js
   ------------------------------------------------------------
   Point d'entrée unique de l'application.
   Initialise tous les modules dans le bon ordre, restaure la
   sauvegarde, enregistre le service worker (PWA), et démarre
   la boucle de jeu.

   Contient également runDiagnostics() : un rapport de santé
   complet du jeu (canvas, audio, stockage, fps, service worker,
   compatibilité, physique).
   ============================================================ */

const Game = {

    /* --------------------------------------------------------
       init()
       Séquence d'initialisation complète du jeu.
       -------------------------------------------------------- */
    async init() {
        console.log('%c ROYAL DROP — initialisation... ', 'background:#ffd76a;color:#1a0a2e;font-weight:bold;');

        // 1. Charge la sauvegarde existante (ou crée une save par défaut)
        const save = Storage.loadGame();
        CONFIG.THEMES.CURRENT = save.preferences.theme || CONFIG.THEMES.CURRENT;

        // 2. Initialise les systèmes fondamentaux (ordre important)
        const canvas = document.getElementById('game-canvas');
        Renderer.init(canvas);
        Camera.reset();
        Board.init();
        BallManager.init();
        ParticleSystem.init();

        // 3. Initialise les systèmes liés aux joueurs et à l'économie
        Leaderboard.init();
        Players.init();
        Bots.init();

        // 4. Initialise l'interface utilisateur
        UI.init();
        UI.updateLaunchCost(CONFIG.ECONOMY.LAUNCH_COST);

        // 5. Initialise l'audio (le contexte réel se débloquera
        //    au premier tap utilisateur, cf. AudioEngine.unlock())
        AudioEngine.init();
        if (save.settings.volume !== undefined) {
            AudioEngine.setVolume(save.settings.volume);
        }

        // 6. Gère le redimensionnement / mise à l'échelle responsive
        this._setupResponsiveScaling();

        // 7. Enregistre le service worker (PWA hors-ligne)
        this._registerServiceWorker();

        // 8. Sauvegarde automatique périodique
        this._setupAutosave();

        // 9. Démarre la boucle de jeu
        Engine.init();
        Engine.start();

        // 10. Masque l'écran de chargement
        UI.hideLoadingScreen();

        console.log('%c ROYAL DROP — prêt ! ', 'background:#2fbf5a;color:#fff;font-weight:bold;');
    },

    /* --------------------------------------------------------
       _setupResponsiveScaling()
       Calcule et applique le facteur d'échelle CSS (--scale)
       pour adapter l'espace logique fixe 1080x1920 à la taille
       réelle de l'écran, sans jamais toucher aux coordonnées
       physiques internes du jeu.
       -------------------------------------------------------- */
    _setupResponsiveScaling() {
        const root = document.getElementById('game-root');

        const applyScale = () => {
            const scaleX = window.innerWidth / CONFIG.LOGICAL_WIDTH;
            const scaleY = window.innerHeight / CONFIG.LOGICAL_HEIGHT;
            const scale = Math.min(scaleX, scaleY);
            root.style.setProperty('--scale', scale);
        };

        applyScale();
        window.addEventListener('resize', applyScale);
        window.addEventListener('orientationchange', applyScale);
    },

    /* --------------------------------------------------------
       _registerServiceWorker()
       Enregistre sw.js pour permettre le fonctionnement hors
       ligne et l'installation en PWA (iPhone/Android).
       -------------------------------------------------------- */
    _registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.warn('[Game] Service Worker non supporté sur ce navigateur.');
            return;
        }

        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then((reg) => console.log('[Game] Service Worker enregistré :', reg.scope))
                .catch((err) => console.warn('[Game] Échec Service Worker :', err));
        });
    },

    /* --------------------------------------------------------
       _setupAutosave()
       Met en place la sauvegarde automatique périodique de
       l'état courant du jeu (jackpot, classement, stats...).
       -------------------------------------------------------- */
    _setupAutosave() {
        setInterval(() => {
            this.saveCurrentState();
        }, CONFIG.STORAGE.AUTOSAVE_INTERVAL);

        // Sauvegarde également à la fermeture/masquage de l'app
        window.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.saveCurrentState();
            }
        });
    },

    /* --------------------------------------------------------
       saveCurrentState()
       Rassemble l'état actuel de tous les modules concernés
       et l'écrit via Storage.saveGame().
       -------------------------------------------------------- */
    saveCurrentState() {
        const previousSave = Storage.loadGame();

        const currentState = {
            ...previousSave,
            leaderboard: Leaderboard.getFullLeaderboard(),
            preferences: {
                theme: CONFIG.THEMES.CURRENT,
                selectedSkin: previousSave.skins.equipped
            },
            settings: {
                volume: AudioEngine.masterGain ? AudioEngine.masterGain.gain.value : CONFIG.AUDIO.MASTER_VOLUME,
                debugEnabled: UI.debugEnabled
            },
            lastTheme: CONFIG.THEMES.CURRENT
        };

        Storage.saveGame(currentState);
    },

    /* --------------------------------------------------------
       runDiagnostics()
       Vérifie la santé globale du jeu et affiche un rapport
       dans la console. Utile en développement (PC ou iPhone)
       pour valider rapidement qu'un environnement fonctionne.
       -------------------------------------------------------- */
    runDiagnostics() {
        const report = {
            canvas: !!document.getElementById('game-canvas')?.getContext('2d'),
            audio: AudioEngine.isAvailable(),
            storage: Storage.isStorageAvailable(),
            fps: Engine.currentFps,
            serviceWorker: 'serviceWorker' in navigator,
            compatibility: {
                touchSupport: 'ontouchstart' in window,
                devicePixelRatio: window.devicePixelRatio || 1,
                userAgent: navigator.userAgent
            },
            physics: null
        };

        console.log('%c[Diagnostics] Lancement du test physique (300 billes)...', 'color:#ffd76a;');
        report.physics = Physics.runPhysicsTest(300);

        console.log('%c=== ROYAL DROP — RAPPORT DE DIAGNOSTIC ===', 'background:#1a0a2e;color:#ffd76a;font-weight:bold;padding:4px;');
        console.table({
            'Canvas OK': report.canvas,
            'Audio OK': report.audio,
            'Storage OK': report.storage,
            'FPS actuel': report.fps,
            'Service Worker supporté': report.serviceWorker,
            'Support tactile': report.compatibility.touchSupport,
            'Pixel Ratio': report.compatibility.devicePixelRatio
        });
        console.log('Physique :', report.physics);

        return report;
    }
};

/* ============================================================
   DÉMARRAGE
   Attend que le DOM soit complètement chargé avant d'initialiser
   le jeu (nécessaire pour garantir que tous les éléments UI
   existent déjà dans index.html).
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});

// Expose runDiagnostics() globalement pour un accès facile
// depuis la console du navigateur (PC ou Safari iPhone via
// débogage distant).
window.runDiagnostics = () => Game.runDiagnostics();
