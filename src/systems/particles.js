/* ============================================================
   ROYAL DROP — systems/particles.js
   ------------------------------------------------------------
   Système de particules à object pool (étincelles + textes
   flottants du type "+500" / "JACKPOT!"), zéro allocation
   pendant le jeu. Ne dessine rien (voir render/particles.js).
   ============================================================ */

import { CONFIG } from '../core/config.js';

export class ParticleSystem {
    pool = [];
    activeCount = 0;

    textPool = [];
    activeTextCount = 0;

    constructor() {
        for (let i = 0; i < CONFIG.PARTICLES.POOL_SIZE; i++) {
            this.pool.push(this.#createEmptyParticle());
        }
        for (let i = 0; i < 40; i++) {
            this.textPool.push(this.#createEmptyFloatingText());
        }
    }

    #createEmptyParticle() {
        return { active: false, x: 0, y: 0, vx: 0, vy: 0, radius: 0, color: '#fff', life: 0, maxLife: 1, alpha: 1 };
    }

    #createEmptyFloatingText() {
        return { active: false, x: 0, y: 0, text: '', color: '#fff', life: 0, maxLife: 1, alpha: 1, fontSize: 32 };
    }

    #getFreeParticle() {
        for (const p of this.pool) if (!p.active) return p;
        return null;
    }

    #getFreeText() {
        for (const t of this.textPool) if (!t.active) return t;
        return null;
    }

    /** Explosion de particules à une position donnée (impact bucket/jackpot). */
    burst(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            const p = this.#getFreeParticle();
            if (!p) break; // pool épuisé : on ignore silencieusement

            const angle = Math.random() * Math.PI * 2;
            const speed = 150 + Math.random() * 250;

            p.active = true;
            p.x = x;
            p.y = y;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed - 100;
            p.radius = 3 + Math.random() * 4;
            p.color = color;
            p.life = 0;
            p.maxLife = CONFIG.PARTICLES.LIFETIME * (0.7 + Math.random() * 0.6);
            p.alpha = 1;

            this.activeCount++;
        }
    }

    spawnFloatingText(x, y, text, color = '#ffd76a', fontSize = 36) {
        const t = this.#getFreeText();
        if (!t) return;

        t.active = true;
        t.x = x;
        t.y = y;
        t.text = text;
        t.color = color;
        t.life = 0;
        t.maxLife = CONFIG.ANIMATIONS.FLOATING_TEXT_DURATION;
        t.alpha = 1;
        t.fontSize = fontSize;

        this.activeTextCount++;
    }

    update(dt) {
        for (const p of this.pool) {
            if (!p.active) continue;

            p.life += dt;
            if (p.life >= p.maxLife) {
                p.active = false;
                this.activeCount--;
                continue;
            }

            p.vy += CONFIG.PARTICLES.GRAVITY * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.alpha = 1 - (p.life / p.maxLife);
        }

        for (const t of this.textPool) {
            if (!t.active) continue;

            t.life += dt;
            if (t.life >= t.maxLife) {
                t.active = false;
                this.activeTextCount--;
                continue;
            }

            const progress = t.life / t.maxLife;
            t.y -= (CONFIG.ANIMATIONS.FLOATING_TEXT_RISE * dt) / t.maxLife;
            t.alpha = 1 - progress;
        }
    }

    reset() {
        for (const p of this.pool) p.active = false;
        for (const t of this.textPool) t.active = false;
        this.activeCount = 0;
        this.activeTextCount = 0;
    }
}
