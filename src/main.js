/* ============================================================
   ROYAL DROP — main.js
   ------------------------------------------------------------
   Composition root de la nouvelle architecture (v3).
   Étape 3 : audio (Web Audio API) + particules/textes flottants
   réagissant aux rebonds et aux atterrissages. L'économie réelle,
   les joueurs/bots et le HUD complet arrivent à l'étape suivante.
   ============================================================ */

import { CONFIG } from './core/config.js';
import { eventBus } from './core/events.js';
import { initViewport } from './core/viewport.js';
import { Engine } from './core/engine.js';
import { Camera } from './core/camera.js';
import { Board } from './entities/board.js';
import { BallManager } from './entities/ball.js';
import { Physics } from './systems/physics.js';
import { AudioEngine } from './systems/audio.js';
import { ParticleSystem } from './systems/particles.js';
import { RenderPipeline } from './render/pipeline.js';

function boot() {
    const root = document.getElementById('game-root');
    const canvas = document.getElementById('game-canvas');
    initViewport(root);

    const board = new Board();
    board.generate();

    const camera = new Camera();
    const physics = new Physics(eventBus);
    const ballManager = new BallManager({ physics, board, eventBus });
    const audio = new AudioEngine();
    const particles = new ParticleSystem();

    const pipeline = new RenderPipeline(canvas, { board, ballManager, camera, particles });

    const engine = new Engine(
        (dt) => {
            ballManager.updateAll(dt);
            camera.update(dt);
            particles.update(dt);
        },
        () => pipeline.drawScene()
    );
    engine.start();

    wireGameFeel({ eventBus, audio, particles, board });

    // Bouton LANCER temporaire : lance une bille de test et débloque
    // l'audio (obligatoire sur iOS/Safari, doit suivre une interaction).
    // Sera remplacé à l'étape suivante par le vrai flux économie/UI.
    document.getElementById('launch-btn')?.addEventListener('click', () => {
        audio.init();
        audio.unlock();
        audio.playLaunch();
        ballManager.spawn({ betAmount: CONFIG.ECONOMY.LAUNCH_COST, source: 'local' });
    });

    document.getElementById('loading-screen')?.remove();

    console.log('%c ROYAL DROP v3 — étape 3 : audio + particules ', 'background:#ffd76a;color:#1a0a2e;font-weight:bold;');
}

/**
 * Branche les réactions sonores/visuelles sur les événements de jeu.
 * Reste volontairement simple ici (composition root) : la vraie
 * couche joueurs/historique (qui écoute aussi ces événements)
 * arrive à l'étape suivante.
 */
function wireGameFeel({ eventBus, audio, particles, board }) {
    eventBus.on('physics:pegHit', ({ intensity }) => {
        audio.playPegHit(intensity);
    });

    eventBus.on('ball:landed', ({ ball, bucketIndex, multiplier, winAmount, isJackpot }) => {
        const zone = board.getBucketZone(bucketIndex);
        const bucketY = CONFIG.LOGICAL_HEIGHT - CONFIG.BUCKETS.HEIGHT - (CONFIG.BUCKETS.BOTTOM_OFFSET - 70);
        const bucketX = zone ? (zone.xStart + zone.xEnd) / 2 : ball.x;

        if (isJackpot) {
            audio.playJackpot();
            particles.burst(bucketX, bucketY, CONFIG.PARTICLES.BURST_COUNT_ON_JACKPOT, '#ffd76a');
            particles.spawnFloatingText(bucketX, bucketY, `JACKPOT! +${winAmount}`, '#ffd76a', 48);
        } else {
            audio.playBucketWin(multiplier);
            particles.burst(bucketX, bucketY, CONFIG.PARTICLES.BURST_COUNT_ON_BUCKET, zone?.color || '#fff');
            particles.spawnFloatingText(bucketX, bucketY, `+${winAmount}`, '#ffffff', 34);
        }

        console.log(`[Test] Bille atterrie — bucket ${bucketIndex}, x${multiplier}, gain ${winAmount}${isJackpot ? ' (JACKPOT!)' : ''}`);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
