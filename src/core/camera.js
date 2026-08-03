/* ============================================================
   ROYAL DROP — core/camera.js
   ------------------------------------------------------------
   Zoom léger et suivi visuel des billes. Ne modifie jamais les
   coordonnées physiques réelles (espace logique fixe) : elle
   n'applique qu'une transformation de rendu (translation +
   zoom) sur le contexte Canvas, à annuler juste après.
   ============================================================ */

import { CONFIG } from './config.js';

export class Camera {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = CONFIG.LOGICAL_WIDTH / 2;
        this.y = CONFIG.LOGICAL_HEIGHT / 2;
        this.targetX = this.x;
        this.targetY = this.y;
        this.zoom = CONFIG.CAMERA.ZOOM_DEFAULT;
        this.targetZoom = CONFIG.CAMERA.ZOOM_DEFAULT;
    }

    followBall(ball) {
        if (!CONFIG.CAMERA.FOLLOW_ENABLED || !ball) return;
        this.targetX = ball.x;
        this.targetY = ball.y;
        this.targetZoom = CONFIG.CAMERA.ZOOM_ON_DROP;
    }

    releaseFollow() {
        this.targetX = CONFIG.LOGICAL_WIDTH / 2;
        this.targetY = CONFIG.LOGICAL_HEIGHT / 2;
        this.targetZoom = CONFIG.CAMERA.ZOOM_DEFAULT;
    }

    update(dt) {
        const posSmoothing = CONFIG.CAMERA.FOLLOW_SMOOTHING;
        const zoomSmoothing = CONFIG.CAMERA.ZOOM_SMOOTHING;

        this.x += (this.targetX - this.x) * posSmoothing;
        this.y += (this.targetY - this.y) * posSmoothing;
        this.zoom += (this.targetZoom - this.zoom) * zoomSmoothing;
    }

    applyTransform(ctx) {
        ctx.save();
        const cx = CONFIG.LOGICAL_WIDTH / 2;
        const cy = CONFIG.LOGICAL_HEIGHT / 2;
        ctx.translate(cx, cy);
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.x, -this.y);
    }

    restoreTransform(ctx) {
        ctx.restore();
    }
}
