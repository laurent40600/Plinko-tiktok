/* ============================================================
   ROYAL DROP — main.js
   ------------------------------------------------------------
   Composition root de la nouvelle architecture (v3).
   Étape 2 : cœur de jeu jouable — plateau, physique, billes,
   buckets, caméra. L'économie (mises réelles), l'audio, les
   particules et le HUD complet arrivent aux étapes suivantes ;
   pour l'instant le bouton LANCER envoie une bille de test.
   ============================================================ */

import { CONFIG } from './core/config.js';
import { eventBus } from './core/events.js';
import { initViewport } from './core/viewport.js';
import { Engine } from './core/engine.js';
import { Camera } from './core/camera.js';
import { Board } from './entities/board.js';
import { BallManager } from './entities/ball.js';
import { Physics } from './systems/physics.js';
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

    const pipeline = new RenderPipeline(canvas, { board, ballManager, camera });

    const engine = new Engine(
        (dt) => {
            ballManager.updateAll(dt);
            camera.update(dt);
        },
        () => pipeline.drawScene()
    );
    engine.start();

    // Confirmation console qu'une bille a bien atterri (le HUD/l'économie
    // réelle arrivent à l'étape 5 ; pour l'instant on vérifie juste que
    // le cœur physique fonctionne de bout en bout).
    eventBus.on('ball:landed', ({ bucketIndex, multiplier, winAmount, isJackpot }) => {
        console.log(`[Test] Bille atterrie — bucket ${bucketIndex}, x${multiplier}, gain ${winAmount}${isJackpot ? ' (JACKPOT!)' : ''}`);
    });

    // Bouton LANCER temporaire : lance une bille de test.
    // Sera remplacé à l'étape 5 par le vrai flux économie/UI.
    document.getElementById('launch-btn')?.addEventListener('click', () => {
        ballManager.spawn({ betAmount: CONFIG.ECONOMY.LAUNCH_COST, source: 'local' });
    });

    document.getElementById('loading-screen')?.remove();

    console.log('%c ROYAL DROP v3 — étape 2 : cœur de jeu (plateau + physique + billes) ', 'background:#ffd76a;color:#1a0a2e;font-weight:bold;');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
