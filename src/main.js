/* ============================================================
   ROYAL DROP — main.js
   ------------------------------------------------------------
   Composition root de la nouvelle architecture (v3).
   Étape 4 : couche sociale/économie (joueurs, bots, classement)
   + HUD complet + sauvegarde. Le jeu est maintenant fonctionnel
   de bout en bout, comme la v2, mais sur la nouvelle base.
   ============================================================ */

import { CONFIG } from './core/config.js';
import { eventBus } from './core/events.js';
import { initViewport } from './core/viewport.js';
import { Engine } from './core/engine.js';
import { Camera } from './core/camera.js';
import * as Storage from './core/storage.js';
import { Board } from './entities/board.js';
import { BallManager } from './entities/ball.js';
import { Physics } from './systems/physics.js';
import { AudioEngine } from './systems/audio.js';
import { ParticleSystem } from './systems/particles.js';
import { wireGameFeel } from './systems/gameFeel.js';
import { Players } from './systems/players.js';
import { Leaderboard } from './systems/leaderboard.js';
import { Bots } from './systems/bots.js';
import { RenderPipeline } from './render/pipeline.js';
import { HUD } from './ui/hud.js';

function boot() {
    const save = Storage.loadGame();
    CONFIG.THEMES.CURRENT = save.preferences.theme || CONFIG.THEMES.CURRENT;

    const root = document.getElementById('game-root');
    const canvas = document.getElementById('game-canvas');
    initViewport(root);

    // --- Cœur de jeu ---
    const board = new Board();
    board.generate();

    const camera = new Camera();
    const physics = new Physics(eventBus);
    const ballManager = new BallManager({ physics, board, eventBus });
    const audio = new AudioEngine();
    const particles = new ParticleSystem();

    if (save.settings.volume !== undefined) {
        audio.setVolume(save.settings.volume);
    }

    wireGameFeel({ eventBus, audio, particles, board });

    // --- Couche sociale / économie ---
    const leaderboard = new Leaderboard({ eventBus, initialEntries: save.leaderboard });
    const players = new Players({
        eventBus,
        ballManager,
        audio,
        getEquippedSkin: () => Storage.loadGame().skins.equipped || 'default'
    });
    const bots = new Bots(eventBus);
    if (CONFIG.BOTS.ENABLED) bots.start();

    // --- Rendu + HUD ---
    const pipeline = new RenderPipeline(canvas, { board, ballManager, camera, particles });
    const hud = new HUD({
        eventBus,
        audio,
        debugEnabled: save.settings.debugEnabled,
        onDebugToggle: (enabled) => {
            const current = Storage.loadGame();
            current.settings.debugEnabled = enabled;
            Storage.saveGame(current);
        }
    });
    hud.renderTopGift(leaderboard.getTopEntries());
    hud.renderRecentDrops(players.getRecentDrops());

    // --- Boucle de jeu ---
    const engine = new Engine(
        (dt) => {
            ballManager.updateAll(dt);
            camera.update(dt);
            particles.update(dt);

            if (hud.debugEnabled) {
                hud.updateDebugPanel({
                    fps: engine.currentFps,
                    ballCount: ballManager.activeCount,
                    collisions: physics.collisionCountThisFrame,
                    physTime: physics.lastFrameTimeMs
                });
            }
        },
        () => pipeline.drawScene(hud.debugEnabled ? hud.debugFlags : {})
    );
    engine.start();

    setupAutosave({ leaderboard, audio, hud });
    registerServiceWorker();
    unlockAudioOnFirstInteraction(audio);

    document.getElementById('loading-screen')?.remove();

    console.log('%c ROYAL DROP v3 — étape 4 : social/économie + HUD ', 'background:#ffd76a;color:#1a0a2e;font-weight:bold;');
    console.log('%c ROYAL DROP v3 — prêt ! ', 'background:#2fbf5a;color:#fff;font-weight:bold;');
}

/**
 * L'audio (Web Audio API) doit être initialisé/débloqué après une
 * interaction utilisateur (obligatoire sur iOS/Safari). Sans bouton
 * LANCER, on écoute le tout premier tap/clic sur la page pour ça.
 */
function unlockAudioOnFirstInteraction(audio) {
    const unlock = () => {
        audio.init();
        audio.unlock();
    };
    document.addEventListener('pointerdown', unlock, { once: true });
}

function setupAutosave({ leaderboard, audio, hud }) {
    const persist = () => {
        const previous = Storage.loadGame();
        Storage.saveGame({
            ...previous,
            leaderboard: leaderboard.getFullLeaderboard(),
            preferences: { ...previous.preferences, theme: CONFIG.THEMES.CURRENT },
            settings: {
                volume: audio.masterGain ? audio.masterGain.gain.value : CONFIG.AUDIO.MASTER_VOLUME,
                debugEnabled: hud.debugEnabled
            }
        });
    };

    setInterval(persist, CONFIG.STORAGE.AUTOSAVE_INTERVAL);
    window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') persist();
    });
}

function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then((reg) => console.log('[Game] Service Worker enregistré :', reg.scope))
            .catch((err) => console.warn('[Game] Échec Service Worker :', err));
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
