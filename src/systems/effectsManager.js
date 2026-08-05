/* ============================================================
   ROYAL DROP — systems/effectsManager.js
   ------------------------------------------------------------
   Met en scène les grands moments TV : mode cinématique quand une
   bille approche du Jackpot (ralenti, caméra qui suit, zoom,
   spotlight, traînée dorée) ainsi que les explosions de particules
   des moments forts (couronnement, défaite du boss, ouverture du
   coffre). Les flashs/tremblements d'écran restent en CSS (voir
   ui/showUI.js) : ce module ne pilote que le monde du canvas
   (caméra, particules, vignette) — jamais les picots/la physique.
   ============================================================ */

import { CONFIG } from '../core/config.js';

export class EffectsManager {
    /**
     * @param {object} deps
     * @param {import('../core/events.js').eventBus} deps.eventBus
     * @param {import('../core/camera.js').Camera} deps.camera
     * @param {import('../systems/particles.js').ParticleSystem} deps.particles
     */
    constructor({ eventBus, camera, particles }) {
        this.eventBus = eventBus;
        this.camera = camera;
        this.particles = particles;

        this.timeScale = 1;
        this._targetTimeScale = 1;
        this._cinematicBall = null;
        this._trailAccumMs = 0;
        this.spotlight = null; // { x, y, radius, alpha } | null
        this._spotlightAlphaTarget = 0;
        this._spotlightAlpha = 0;

        eventBus.on('jackpot:approach', ({ ball }) => this._startCinematic(ball));
        eventBus.on('jackpot:approachEnd', () => this._endCinematic());

        eventBus.on('jackpot:coronation', () => this._bigBurst('#ffd76a', 90));
        eventBus.on('boss:defeated', () => this._bigBurst('#ff9d2f', 80));
        eventBus.on('community:stageChanged', ({ stageId }) => {
            if (stageId === 'open') this._bigBurst('#ffd76a', 70);
            else this._smallBurst('#b478ff');
        });
        eventBus.on('event:triggered', () => this._smallBurst('#ffd76a'));
    }

    /** true tant que le mode cinématique Jackpot est actif (voir render/pipeline.js). */
    get cinematicActive() {
        return this._cinematicBall !== null;
    }

    _startCinematic(ball) {
        this._cinematicBall = ball;
        this._targetTimeScale = CONFIG.JACKPOT.cinematic?.slowMotionTimeScale ?? 0.35;
        this._spotlightAlphaTarget = 0.4;
    }

    _endCinematic() {
        this._cinematicBall = null;
        this._targetTimeScale = 1;
        this._spotlightAlphaTarget = 0;
        this.camera.releaseFollow();
    }

    /** Appelé chaque frame avec le dt RÉEL (non ralenti) par la boucle de jeu. */
    update(dt) {
        const rampMs = CONFIG.JACKPOT.cinematic?.slowMotionRampMs || 500;
        const rampStep = rampMs > 0 ? dt * 1000 / rampMs : 1;
        this.timeScale += (this._targetTimeScale - this.timeScale) * Math.min(1, rampStep);
        this._spotlightAlpha += (this._spotlightAlphaTarget - this._spotlightAlpha) * Math.min(1, rampStep);

        if (this._cinematicBall) {
            const zoom = CONFIG.JACKPOT.cinematic?.cameraZoom || 1.5;
            this.camera.targetX = this._cinematicBall.x;
            this.camera.targetY = this._cinematicBall.y;
            this.camera.targetZoom = zoom;

            this.spotlight = {
                x: this._cinematicBall.x,
                y: this._cinematicBall.y,
                radius: CONFIG.JACKPOT.cinematic?.spotlightRadiusPx || 220,
                alpha: this._spotlightAlpha
            };

            this._trailAccumMs += dt * 1000;
            if (this._trailAccumMs > 45) {
                this._trailAccumMs = 0;
                this.particles.burst(this._cinematicBall.x, this._cinematicBall.y, 2, '#ffd76a');
            }
        } else if (this._spotlightAlpha > 0.01) {
            this.spotlight = { x: this.spotlight?.x || 0, y: this.spotlight?.y || 0, radius: CONFIG.JACKPOT.cinematic?.spotlightRadiusPx || 220, alpha: this._spotlightAlpha };
        } else {
            this.spotlight = null;
        }
    }

    _bigBurst(color, count) {
        const x = CONFIG.LOGICAL_WIDTH / 2;
        const y = CONFIG.LOGICAL_HEIGHT * 0.42;
        this.particles.burst(x, y, count, color);
    }

    _smallBurst(color) {
        const x = CONFIG.LOGICAL_WIDTH / 2 + (Math.random() - 0.5) * 200;
        const y = CONFIG.LOGICAL_HEIGHT * 0.35;
        this.particles.burst(x, y, 20, color);
    }
}
