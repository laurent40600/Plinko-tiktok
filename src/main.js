/* ============================================================
   ROYAL PLINKO LIVE — main.js
   ------------------------------------------------------------
   Composition root. Le plateau, la physique et les buckets sont
   strictement ceux de ROYAL DROP v3 (inchangés). Cette étape
   ajoute la couche "émission TV" : cadeaux TikTok -> billes,
   Coffre Royal / Clés, Jackpot progressif + Roue Royale, boss,
   combo, effets cinématiques et habillage visuel/sonore.
   ============================================================ */

import { CONFIG } from './core/config.js';
import { eventBus } from './core/events.js';
import { initViewport } from './core/viewport.js';
import { loadRuntimeConfig } from './core/configManager.js';
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
import { TikTokManager } from './systems/tiktokManager.js';
import { GiftManager } from './systems/giftManager.js';
import { BallQueueManager } from './systems/ballQueueManager.js';
import { CommunityManager } from './systems/communityManager.js';
import { KeysManager } from './systems/keysManager.js';
import { BossManager } from './systems/bossManager.js';
import { EventManager } from './systems/eventManager.js';
import { JackpotManager } from './systems/jackpotManager.js';
import { ComboManager } from './systems/comboManager.js';
import { EffectsManager } from './systems/effectsManager.js';
import { VoiceManager } from './systems/voiceManager.js';
import { RenderPipeline } from './render/pipeline.js';
import { HUD } from './ui/hud.js';
import { ShowUI } from './ui/showUI.js';

async function boot() {
    await loadRuntimeConfig();

    const save = Storage.loadGame();
    CONFIG.THEMES.CURRENT = save.preferences.theme || CONFIG.THEMES.CURRENT;

    const root = document.getElementById('game-root');
    const canvas = document.getElementById('game-canvas');
    initViewport(root);

    // --- Cœur de jeu (plateau/physique/billes — INCHANGÉS) ---
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

    // --- Pipeline cadeaux TikTok -> billes ---
    const ballQueue = new BallQueueManager({ eventBus, ballManager });
    const bossManager = new BossManager({ eventBus, ballQueue, audio });
    const eventManager = new EventManager({ eventBus, ballQueue, audio, bossManager });
    const jackpotManager = new JackpotManager({ eventBus, board, eventManager });
    const giftManager = new GiftManager({ eventBus, ballQueue }); // eslint-disable-line no-unused-vars
    const communityManager = new CommunityManager({ eventBus }); // eslint-disable-line no-unused-vars
    const keysManager = new KeysManager({ eventBus }); // eslint-disable-line no-unused-vars
    const comboManager = new ComboManager({ eventBus }); // eslint-disable-line no-unused-vars

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

    const tiktokManager = new TikTokManager();
    tiktokManager.startSimulatorIfEnabled();

    // --- Effets cinématiques + voix + rendu + HUD ---
    const effects = new EffectsManager({ eventBus, camera, particles });
    const voice = new VoiceManager({ eventBus });
    const pipeline = new RenderPipeline(canvas, { board, ballManager, camera, particles, effects });
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

    const showUI = new ShowUI({ eventBus }); // eslint-disable-line no-unused-vars

    // --- Boucle de jeu ---
    const engine = new Engine(
        (dt) => {
            effects.update(dt);
            const scaledDt = dt * effects.timeScale;

            ballManager.updateAll(scaledDt);
            camera.update(dt);
            particles.update(scaledDt);
            jackpotManager.update(ballManager.getActiveBalls());

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
    unlockAudioOnFirstInteraction(audio, voice);

    document.getElementById('loading-screen')?.remove();

    console.log('%c ROYAL PLINKO LIVE — prêt ! ', 'background:#ffd76a;color:#1a0a2e;font-weight:bold;');
}

/**
 * L'audio (Web Audio API) et la synthèse vocale doivent être débloqués
 * après une interaction utilisateur (obligatoire sur iOS/Safari). Sans
 * bouton LANCER, on écoute le tout premier tap/clic sur la page pour ça.
 */
function unlockAudioOnFirstInteraction(audio, voice) {
    const unlock = () => {
        audio.init();
        audio.unlock();
        voice.unlock();
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
