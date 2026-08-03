/* ============================================================
   ROYAL DROP — core/engine.js
   ------------------------------------------------------------
   Boucle de jeu (requestAnimationFrame) découplée de toute
   logique métier : elle reçoit un update(dt) et un render(),
   calcule le delta time (plafonné) et le FPS lissé, c'est tout.
   ============================================================ */

import { CONFIG } from './config.js';

export class Engine {
    /**
     * @param {(dt: number) => void} update
     * @param {() => void} render
     */
    constructor(update, render) {
        this._update = update;
        this._render = render;

        this.running = false;
        this.lastTimestamp = 0;

        this.currentFps = 0;
        this._fpsFrameCount = 0;
        this._fpsTimer = 0;
        this._fpsUpdateInterval = 0.5;

        this._tick = this._tick.bind(this);
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.lastTimestamp = performance.now();
        requestAnimationFrame(this._tick);
    }

    stop() {
        this.running = false;
    }

    _tick(timestamp) {
        if (!this.running) return;

        let dt = (timestamp - this.lastTimestamp) / 1000;
        this.lastTimestamp = timestamp;
        dt = Math.min(dt, CONFIG.PERFORMANCE.MAX_DELTA_TIME);

        this._updateFps(dt);
        this._update(dt);
        this._render();

        requestAnimationFrame(this._tick);
    }

    _updateFps(dt) {
        this._fpsFrameCount++;
        this._fpsTimer += dt;
        if (this._fpsTimer >= this._fpsUpdateInterval) {
            this.currentFps = Math.round(this._fpsFrameCount / this._fpsTimer);
            this._fpsFrameCount = 0;
            this._fpsTimer = 0;
        }
    }
}
