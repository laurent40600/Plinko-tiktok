/* ============================================================
   ROYAL DROP — main.js
   ------------------------------------------------------------
   Composition root de la nouvelle architecture (v3). Étape 1 :
   boucle de jeu minimale + fond/cadre affichés, pour valider le
   socle avant de porter le plateau, la physique, l'économie et
   l'UI dans les étapes suivantes.
   ============================================================ */

import { initViewport } from './core/viewport.js';
import { Engine } from './core/engine.js';
import { RenderPipeline } from './render/pipeline.js';

function boot() {
    const root = document.getElementById('game-root');
    const canvas = document.getElementById('game-canvas');

    initViewport(root);

    const pipeline = new RenderPipeline(canvas);
    const engine = new Engine(
        /* update */ () => {},
        /* render */ () => pipeline.drawScene()
    );

    engine.start();

    document.getElementById('loading-screen')?.remove();

    console.log('%c ROYAL DROP v3 — étape 1 : socle (fond + cadre + boucle) ', 'background:#ffd76a;color:#1a0a2e;font-weight:bold;');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
