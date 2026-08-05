/* ============================================================
   ROYAL DROP — render/pipeline.js
   ------------------------------------------------------------
   Orchestre le dessin de la scène complète, dans l'ordre :
   fond → (caméra) plateau/picots → billes → buckets → cadre.
   Chaque étape est un module autonome dans render/ ; ce fichier
   ne fait que les enchaîner, il ne dessine jamais rien lui-même.
   ============================================================ */

import { CONFIG } from '../core/config.js';
import { drawBackground } from './background.js';
import { drawFrame } from './frame.js';
import { drawLattice, drawPegs } from './board.js';
import { drawBallTrails, drawBalls } from './balls.js';
import { drawBuckets } from './buckets.js';
import { drawParticles } from './particles.js';
import { drawSpotlight } from './effectsOverlay.js';

export class RenderPipeline {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {object} deps
     * @param {import('../entities/board.js').Board} deps.board
     * @param {import('../entities/ball.js').BallManager} deps.ballManager
     * @param {import('../core/camera.js').Camera} deps.camera
     * @param {import('../systems/particles.js').ParticleSystem} deps.particles
     * @param {import('../systems/effectsManager.js').EffectsManager} [deps.effects]
     */
    constructor(canvas, { board, ballManager, camera, particles, effects }) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = true;

        this.board = board;
        this.ballManager = ballManager;
        this.camera = camera;
        this.particles = particles;
        this.effects = effects;
    }

    /** @param {object} debugFlags - { hitbox, vectors, trajectory } */
    drawScene(debugFlags = {}) {
        const ctx = this.ctx;
        const theme = CONFIG.THEMES.LIST[CONFIG.THEMES.CURRENT];
        const balls = this.ballManager.getActiveBalls();
        // Pendant le mode cinématique Jackpot, les buckets zooment AVEC la
        // caméra : l'entrée dans la case reste un plan rapproché clair au
        // lieu d'un cadre fixe déconnecté du zoom. Le reste du temps, ils
        // restent hors caméra pour rester un repère stable et lisible.
        const cinematicActive = !!this.effects?.cinematicActive;

        drawBackground(ctx, theme);

        this.camera.applyTransform(ctx);
        drawLattice(ctx, this.board);
        drawPegs(ctx, this.board);
        drawBallTrails(ctx, balls, debugFlags.trajectory);
        drawBalls(ctx, balls, debugFlags);
        if (cinematicActive) drawBuckets(ctx, this.board);
        drawParticles(ctx, this.particles);
        if (this.effects?.spotlight) drawSpotlight(ctx, this.effects.spotlight);
        this.camera.restoreTransform(ctx);

        if (!cinematicActive) drawBuckets(ctx, this.board);

        drawFrame(ctx, theme);
    }
}
