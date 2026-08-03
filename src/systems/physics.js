/* ============================================================
   ROYAL DROP — systems/physics.js
   ------------------------------------------------------------
   Moteur physique en intégration d'Euler : collisions
   bille/picot, bille/murs, et 4 protections anti-blocage :
   1. Détection de vitesse quasi-nulle prolongée
   2. Micro-impulsion aléatoire de déblocage
   3. Limite de billes vérifiées par frame (perf, cf. ball.js)
   4. Filet de sécurité : téléportation verticale forcée
   ============================================================ */

import { CONFIG } from '../core/config.js';

export class Physics {
    /** @param {import('../core/events.js').eventBus} eventBus */
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.collisionCountThisFrame = 0;
        this.lastFrameTimeMs = 0;
    }

    resetFrameCounters() {
        this.collisionCountThisFrame = 0;
    }

    /** Fait avancer une bille d'un pas de temps dt, en plusieurs sous-étapes. */
    step(ball, dt, pegs) {
        const startTime = performance.now();
        const sub = CONFIG.PHYSICS.SUBSTEPS;
        const subDt = dt / sub;

        for (let i = 0; i < sub; i++) {
            this._integrate(ball, subDt);
            this._resolveWallCollisions(ball);
            this._resolvePegCollisions(ball, pegs);
        }

        this._applyAntiStuckProtections(ball, dt);

        this.lastFrameTimeMs = performance.now() - startTime;
    }

    _integrate(ball, dt) {
        const P = CONFIG.PHYSICS;

        ball.vy += P.GRAVITY * dt;

        const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        if (speed > 0) {
            const drag = P.AIR_DRAG * speed;
            ball.vx -= (ball.vx / speed) * drag;
            ball.vy -= (ball.vy / speed) * drag;
        }

        ball.vx *= (1 - P.FRICTION * dt * 10);

        const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        if (currentSpeed > P.MAX_VELOCITY) {
            const ratio = P.MAX_VELOCITY / currentSpeed;
            ball.vx *= ratio;
            ball.vy *= ratio;
        }

        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;

        if (ball.trail) {
            ball.trail.push({ x: ball.x, y: ball.y });
            if (ball.trail.length > CONFIG.BALL.TRAIL_LENGTH) {
                ball.trail.shift();
            }
        }
    }

    _resolveWallCollisions(ball) {
        const margin = CONFIG.BOARD.MARGIN_X;
        const leftWall = margin;
        const rightWall = CONFIG.LOGICAL_WIDTH - margin;

        if (ball.x - CONFIG.BALL.RADIUS < leftWall) {
            ball.x = leftWall + CONFIG.BALL.RADIUS;
            ball.vx = Math.abs(ball.vx) * CONFIG.PHYSICS.WALL_BOUNCE_DAMPING;
        }
        if (ball.x + CONFIG.BALL.RADIUS > rightWall) {
            ball.x = rightWall - CONFIG.BALL.RADIUS;
            ball.vx = -Math.abs(ball.vx) * CONFIG.PHYSICS.WALL_BOUNCE_DAMPING;
        }
    }

    _resolvePegCollisions(ball, pegs) {
        const minDist = CONFIG.BALL.RADIUS + CONFIG.BOARD.PEG_RADIUS;

        for (const peg of pegs) {
            const dx = ball.x - peg.x;
            const dy = ball.y - peg.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < minDist * minDist && distSq > 0) {
                const dist = Math.sqrt(distSq);
                const overlap = minDist - dist;
                const nx = dx / dist;
                const ny = dy / dist;

                ball.x += nx * overlap;
                ball.y += ny * overlap;

                const dot = ball.vx * nx + ball.vy * ny;
                ball.vx -= 2 * dot * nx * CONFIG.PHYSICS.RESTITUTION;
                ball.vy -= 2 * dot * ny * CONFIG.PHYSICS.RESTITUTION;

                // Léger aléa pour éviter des trajectoires trop répétitives
                ball.vx += (Math.random() - 0.5) * 12;

                this.collisionCountThisFrame++;

                this.eventBus.emit('physics:pegHit', {
                    x: peg.x, y: peg.y,
                    intensity: Math.min(1, Math.abs(dot) / 500)
                });
            }
        }
    }

    _applyAntiStuckProtections(ball, dt) {
        const A = CONFIG.PHYSICS.ANTI_STUCK;

        const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        if (speed < A.MIN_VELOCITY_THRESHOLD) {
            ball.stuckTimer = (ball.stuckTimer || 0) + dt;
        } else {
            ball.stuckTimer = 0;
        }

        if (ball.stuckTimer > A.STUCK_TIME_LIMIT * 0.5 && ball.stuckTimer <= A.STUCK_TIME_LIMIT) {
            ball.vx += (Math.random() - 0.5) * A.RANDOM_NUDGE_FORCE;
            ball.vy += A.RANDOM_NUDGE_FORCE * 0.5;
        }

        if (ball.stuckTimer > A.STUCK_TIME_LIMIT) {
            ball.y += CONFIG.BALL.RADIUS * 3;
            ball.vy = Math.max(ball.vy, 200);
            ball.vx = (Math.random() - 0.5) * 100;
            ball.stuckTimer = 0;

            this.eventBus.emit('physics:unstuck', { x: ball.x, y: ball.y });
        }
    }
}
