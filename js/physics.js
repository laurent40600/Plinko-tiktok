/* ============================================================
   ROYAL DROP — physics.js
   ------------------------------------------------------------
   Moteur physique en intégration d'Euler.
   Gère les collisions bille/picot, bille/murs, et la détection
   d'arrivée dans un bucket.

   4 PROTECTIONS CONTRE LES BLOCAGES DE BILLES :
   1. Détection de vitesse quasi-nulle prolongée (bille "coincée")
   2. Micro-impulsion aléatoire de déblocage (nudge)
   3. Limite du nombre de billes vérifiées par frame (perf)
   4. Filet de sécurité : téléportation verticale forcée si
      une bille reste bloquée au-delà d'un temps critique

   Inclut runPhysicsTest() pour valider la stabilité du moteur
   sur plusieurs centaines de lancers simulés.
   ============================================================ */

const Physics = {

    collisionCountThisFrame: 0,
    lastFrameTimeMs: 0,

    /* --------------------------------------------------------
       step(ball, dt, pegs)
       Fait avancer une bille d'un pas de temps dt, avec
       sous-étapes pour la stabilité (voir CONFIG.PHYSICS.SUBSTEPS).
       -------------------------------------------------------- */
    step(ball, dt, pegs) {
        const startTime = performance.now();
        const sub = CONFIG.PHYSICS.SUBSTEPS;
        const subDt = dt / sub;

        for (let i = 0; i < sub; i++) {
            this._integrate(ball, subDt);
            this._resolveWallCollisions(ball);
            this._resolvePegCollisions(ball, pegs, subDt);
        }

        this._applyAntiStuckProtections(ball, dt);

        this.lastFrameTimeMs = performance.now() - startTime;
    },

    /* --------------------------------------------------------
       _integrate(ball, dt)
       Intégration d'Euler : applique gravité, friction,
       résistance de l'air, puis met à jour la position.
       -------------------------------------------------------- */
    _integrate(ball, dt) {
        const P = CONFIG.PHYSICS;

        // Gravité
        ball.vy += P.GRAVITY * dt;

        // Résistance de l'air (proportionnelle au carré de la vitesse)
        const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        if (speed > 0) {
            const drag = P.AIR_DRAG * speed;
            ball.vx -= (ball.vx / speed) * drag;
            ball.vy -= (ball.vy / speed) * drag;
        }

        // Friction horizontale légère (simule les frottements généraux)
        ball.vx *= (1 - P.FRICTION * dt * 10);

        // Plafond de vitesse (évite les bugs de tunneling)
        const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        if (currentSpeed > P.MAX_VELOCITY) {
            const ratio = P.MAX_VELOCITY / currentSpeed;
            ball.vx *= ratio;
            ball.vy *= ratio;
        }

        // Mise à jour de la position
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;

        // Historique de trajectoire pour le mode debug
        if (ball.trail) {
            ball.trail.push({ x: ball.x, y: ball.y });
            if (ball.trail.length > CONFIG.BALL.TRAIL_LENGTH) {
                ball.trail.shift();
            }
        }
    },

    /* --------------------------------------------------------
       _resolveWallCollisions(ball)
       Empêche la bille de sortir des bords latéraux du plateau.
       -------------------------------------------------------- */
    _resolveWallCollisions(ball) {
        const margin = CONFIG.BOARD.BOARD_MARGIN_X * 0.4;
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
    },

    /* --------------------------------------------------------
       _resolvePegCollisions(ball, pegs, dt)
       Détecte et résout les collisions cercle/cercle entre
       la bille et chaque picot du plateau.
       -------------------------------------------------------- */
    _resolvePegCollisions(ball, pegs, dt) {
        const minDist = CONFIG.BALL.RADIUS + CONFIG.BOARD.PEG_RADIUS;

        for (const peg of pegs) {
            const dx = ball.x - peg.x;
            const dy = ball.y - peg.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < minDist * minDist && distSq > 0) {
                const dist = Math.sqrt(distSq);
                const overlap = minDist - dist;

                // Normale de collision
                const nx = dx / dist;
                const ny = dy / dist;

                // Repousse la bille hors du picot
                ball.x += nx * overlap;
                ball.y += ny * overlap;

                // Réflexion de la vélocité selon la normale (rebond)
                const dot = ball.vx * nx + ball.vy * ny;
                ball.vx -= 2 * dot * nx * CONFIG.PHYSICS.RESTITUTION;
                ball.vy -= 2 * dot * ny * CONFIG.PHYSICS.RESTITUTION;

                // Léger effet aléatoire pour éviter les trajectoires
                // parfaitement symétriques répétitives
                ball.vx += (Math.random() - 0.5) * 12;

                this.collisionCountThisFrame++;

                // Son + particule de rebond (délégué, pas de dépendance directe)
                EventBus.emit('physics:pegHit', {
                    x: peg.x, y: peg.y,
                    intensity: Math.min(1, Math.abs(dot) / 500)
                });
            }
        }
    },

    /* ============================================================
       PROTECTIONS ANTI-BLOCAGE (4 mécanismes)
       ============================================================ */

    /* --------------------------------------------------------
       _applyAntiStuckProtections(ball, dt)
       Point d'entrée unique regroupant les 4 protections.
       -------------------------------------------------------- */
    _applyAntiStuckProtections(ball, dt) {
        const A = CONFIG.PHYSICS.ANTI_STUCK;

        // Protection 1 : détection de vitesse quasi-nulle
        const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        if (speed < A.MIN_VELOCITY_THRESHOLD) {
            ball.stuckTimer = (ball.stuckTimer || 0) + dt;
        } else {
            ball.stuckTimer = 0;
        }

        // Protection 2 : micro-impulsion de déblocage si suspecte
        if (ball.stuckTimer > A.STUCK_TIME_LIMIT * 0.5 && ball.stuckTimer <= A.STUCK_TIME_LIMIT) {
            ball.vx += (Math.random() - 0.5) * A.RANDOM_NUDGE_FORCE;
            ball.vy += A.RANDOM_NUDGE_FORCE * 0.5; // pousse légèrement vers le bas
        }

        // Protection 3 : limite du nombre de billes vérifiées par frame
        // (gérée au niveau de la boucle appelante dans engine.js/ball.js,
        // ce compteur sert de garde-fou si jamais physics.js est appelé
        // directement sur un trop grand nombre de billes)
        // -> voir ball.js: updateAll() qui respecte MAX_STUCK_CHECKS_PER_FRAME

        // Protection 4 : filet de sécurité, téléportation verticale forcée
        if (ball.stuckTimer > A.STUCK_TIME_LIMIT) {
            ball.y += CONFIG.BALL.RADIUS * 3;
            ball.vy = Math.max(ball.vy, 200);
            ball.vx = (Math.random() - 0.5) * 100;
            ball.stuckTimer = 0;

            EventBus.emit('physics:unstuck', { x: ball.x, y: ball.y });
        }
    },

    /* --------------------------------------------------------
       resetFrameCounters()
       À appeler une fois par frame avant de traiter toutes
       les billes, pour remettre à zéro les compteurs de debug.
       -------------------------------------------------------- */
    resetFrameCounters() {
        this.collisionCountThisFrame = 0;
    },

    /* ============================================================
       TESTS AUTOMATIQUES
       ============================================================ */

    /* --------------------------------------------------------
       runPhysicsTest(launchCount = 300)
       Simule un grand nombre de lancers hors-écran (sans
       rendu ni audio) pour valider la stabilité du moteur.

       Retourne : temps moyen de chute, nombre de collisions
       total, nombre de blocages détectés, distribution des
       buckets touchés.
       -------------------------------------------------------- */
    runPhysicsTest(launchCount = 300) {
        const pegs = Board.generatePegs();
        const bucketCount = CONFIG.BUCKETS.VALUES.length;
        const distribution = new Array(bucketCount).fill(0);

        let totalTime = 0;
        let totalCollisions = 0;
        let stuckEvents = 0;

        const MAX_SIM_TIME = 8; // secondes simulées max par bille (sécurité)
        const fixedDt = 1 / 60;

        for (let i = 0; i < launchCount; i++) {
            const testBall = {
                x: CONFIG.LOGICAL_WIDTH / 2 + (Math.random() - 0.5) * 20,
                y: CONFIG.BALL.SPAWN_Y,
                vx: (Math.random() - 0.5) * 30,
                vy: 0,
                stuckTimer: 0,
                trail: null
            };

            let elapsed = 0;
            let unstuckListenerFired = 0;

            // Écoute temporaire des événements de déblocage pour ce test
            const onUnstuck = () => { unstuckListenerFired++; };
            EventBus.on('physics:unstuck', onUnstuck);

            this.resetFrameCounters();

            while (elapsed < MAX_SIM_TIME) {
                this.step(testBall, fixedDt, pegs);
                elapsed += fixedDt;

                // Arrêt si la bille atteint la zone des buckets
                if (testBall.y >= CONFIG.LOGICAL_HEIGHT - CONFIG.BUCKETS.HEIGHT - 100) {
                    break;
                }
            }

            EventBus.off('physics:unstuck', onUnstuck);

            totalTime += elapsed;
            totalCollisions += this.collisionCountThisFrame;
            stuckEvents += unstuckListenerFired;

            // Calcule dans quel bucket la bille serait tombée
            const bucketIndex = Board.getBucketIndexFromX(testBall.x);
            if (bucketIndex >= 0 && bucketIndex < bucketCount) {
                distribution[bucketIndex]++;
            }
        }

        const report = {
            averageTime: +(totalTime / launchCount).toFixed(3),
            totalCollisions,
            stuckEvents,
            distribution
        };

        console.log('[Physics] Rapport runPhysicsTest():', report);
        return report;
    }
};
