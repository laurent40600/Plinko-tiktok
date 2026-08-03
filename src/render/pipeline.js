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

export class RenderPipeline {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {object} deps
     * @param {import('../entities/board.js').Board} deps.board
     * @param {import('../entities/ball.js').BallManager} deps.ballManager
     * @param {import('../core/camera.js').Camera} deps.camera
     * @param {import('../systems/particles.js').ParticleSystem} deps.particles
     */
    constructor(canvas, { board, ballManager, camera, particles }) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = true;

        this.board = board;
        this.ballManager = ballManager;
        this.camera = camera;
        this.particles = particles;
    }

    /** @param {object} debugFlags - { hitbox, vectors, trajectory } */
    drawScene(debugFlags = {}) {
        const ctx = this.ctx;
        const theme = CONFIG.THEMES.LIST[CONFIG.THEMES.CURRENT];
        const balls = this.ballManager.getActiveBalls();

        drawBackground(ctx, theme);

        this.camera.applyTransform(ctx);
        drawLattice(ctx, this.board);
        drawPegs(ctx, this.board);
        drawBallTrails(ctx, balls, debugFlags.trajectory);
        drawBalls(ctx, balls, debugFlags);
        drawParticles(ctx, this.particles);
        this.camera.restoreTransform(ctx);

        // Les buckets restent hors transformation caméra : leur zone
        // doit rester un repère fixe pour le joueur, jamais zoomée.
        drawBuckets(ctx, this.board);

        drawFrame(ctx, theme);
    }
}
