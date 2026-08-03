/* ============================================================
   ROYAL DROP — renderer.js
   ------------------------------------------------------------
   Responsable UNIQUEMENT du dessin Canvas 2D.
   Ne contient aucune logique de jeu, physique ou économie :
   il lit l'état actuel (billes, picots, buckets, thème) et
   le dessine, frame après frame.
   ============================================================ */

const Renderer = {

    ctx: null,
    canvas: null,
    _bgImageCache: {},

    /* --------------------------------------------------------
       init(canvasElement)
       Récupère le contexte 2D et configure les réglages de
       rendu de base (lissage, etc.).
       -------------------------------------------------------- */
    init(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        this.ctx.imageSmoothingEnabled = true;
    },

    /* --------------------------------------------------------
       _getBgImage(src)
       Retourne l'image de fond mise en cache pour ce chemin,
       en lançant son chargement au premier appel. Tant qu'elle
       n'est pas prête, retourne null (le dégradé sert de repli).
       -------------------------------------------------------- */
    _getBgImage(src) {
        let entry = this._bgImageCache[src];
        if (!entry) {
            const img = new Image();
            entry = { img, loaded: false };
            img.onload = () => { entry.loaded = true; };
            img.src = src;
            this._bgImageCache[src] = entry;
        }
        return entry.loaded ? entry.img : null;
    },

    /* --------------------------------------------------------
       clear()
       Efface le canvas et redessine le fond du thème courant.
       -------------------------------------------------------- */
    clear() {
        const ctx = this.ctx;
        const theme = CONFIG.THEMES.LIST[CONFIG.THEMES.CURRENT];
        const W = CONFIG.LOGICAL_WIDTH;
        const H = CONFIG.LOGICAL_HEIGHT;

        ctx.clearRect(0, 0, W, H);

        // Fond dégradé selon le thème actif
        const gradient = ctx.createRadialGradient(
            W / 2, H * 0.3, 100,
            W / 2, H * 0.5, H
        );
        theme.bgGradient.forEach((color, i) => {
            gradient.addColorStop(i / (theme.bgGradient.length - 1), color);
        });
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, W, H);

        // Image de fond du thème (recouvre le dégradé, en mode "cover")
        if (theme.bgImage) {
            const img = this._getBgImage(theme.bgImage);
            if (img) {
                const scale = Math.max(W / img.width, H / img.height);
                const dw = img.width * scale;
                const dh = img.height * scale;
                ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);

                // Voile sombre léger pour garder les picots/billes lisibles
                ctx.fillStyle = 'rgba(5, 1, 10, 0.35)';
                ctx.fillRect(0, 0, W, H);
            }
        }
    },

    /* --------------------------------------------------------
       drawScene(debugFlags)
       Dessine la scène complète dans l'ordre : plateau, picots,
       buckets, billes, particules. Applique la transformation
       caméra pendant le dessin du plateau/billes uniquement
       (l'UI HTML reste indépendante).
       debugFlags : { hitbox, vectors, trajectory }
       -------------------------------------------------------- */
    drawScene(debugFlags = {}) {
        const ctx = this.ctx;

        this.clear();

        Camera.applyTransform(ctx);

        this._drawPegs();
        this._drawBallTrails(debugFlags.trajectory);
        this._drawBalls(debugFlags.hitbox, debugFlags.vectors);
        ParticleSystem.render(ctx);

        Camera.restoreTransform(ctx);

        // Les buckets sont dessinés hors transformation caméra
        // car leur zone reste fixe visuellement (repère joueur)
        this._drawBuckets();
    },

    /* --------------------------------------------------------
       _drawPegs()
       Dessine tous les picots du plateau avec un léger glow doré.
       -------------------------------------------------------- */
    _drawPegs() {
        const ctx = this.ctx;
        const B = CONFIG.BOARD;

        for (const peg of Board.pegs) {
            ctx.save();
            ctx.shadowColor = B.PEG_GLOW_COLOR;
            ctx.shadowBlur = 10;
            ctx.fillStyle = B.PEG_COLOR;
            ctx.beginPath();
            ctx.arc(peg.x, peg.y, B.PEG_RADIUS, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    },

    /* --------------------------------------------------------
       _drawBallTrails(showDebugTrajectory)
       Dessine la traînée douce de chaque bille (effet visuel),
       et en mode debug, la trajectoire complète en surbrillance.
       -------------------------------------------------------- */
    _drawBallTrails(showDebugTrajectory) {
        const ctx = this.ctx;

        for (const ball of BallManager.getActiveBalls()) {
            if (!ball.trail || ball.trail.length < 2) continue;

            ctx.save();
            ctx.strokeStyle = showDebugTrajectory
                ? 'rgba(0,255,0,0.8)'
                : `${ball.color}55`;
            ctx.lineWidth = showDebugTrajectory ? 2 : 4;
            ctx.beginPath();
            ctx.moveTo(ball.trail[0].x, ball.trail[0].y);
            for (let i = 1; i < ball.trail.length; i++) {
                ctx.lineTo(ball.trail[i].x, ball.trail[i].y);
            }
            ctx.stroke();
            ctx.restore();
        }
    },

    /* --------------------------------------------------------
       _drawBalls(showHitbox, showVectors)
       Dessine chaque bille active. En mode debug, superpose
       la hitbox exacte et le vecteur de vélocité.
       -------------------------------------------------------- */
    _drawBalls(showHitbox, showVectors) {
        const ctx = this.ctx;

        for (const ball of BallManager.getActiveBalls()) {
            // Corps de la bille avec dégradé simple (effet 3D léger)
            const grad = ctx.createRadialGradient(
                ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, 2,
                ball.x, ball.y, ball.radius
            );
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.4, ball.color);
            grad.addColorStop(1, '#000000aa');

            ctx.save();
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            if (showHitbox) {
                ctx.save();
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }

            if (showVectors) {
                ctx.save();
                ctx.strokeStyle = '#ff0066';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(ball.x, ball.y);
                ctx.lineTo(ball.x + ball.vx * 0.15, ball.y + ball.vy * 0.15);
                ctx.stroke();
                ctx.restore();
            }
        }
    },

    /* --------------------------------------------------------
       _drawBuckets()
       Dessine la rangée de buckets multiplicateurs en bas du
       plateau, avec un effet pulsé sur le bucket jackpot.
       -------------------------------------------------------- */
    _drawBuckets() {
        const ctx = this.ctx;
        const bucketY = CONFIG.LOGICAL_HEIGHT - CONFIG.BUCKETS.HEIGHT - 200;

        for (const zone of Board.bucketZones) {
            const isJackpot = zone.index === CONFIG.BUCKETS.JACKPOT_INDEX;
            const width = zone.xEnd - zone.xStart;

            ctx.save();
            ctx.fillStyle = zone.color;
            ctx.globalAlpha = isJackpot ? 1 : 0.85;

            // Léger effet de pulsation pour le bucket jackpot
            const pulseScale = isJackpot
                ? 1 + Math.sin(performance.now() / 200) * 0.03
                : 1;

            ctx.translate(zone.xStart + width / 2, bucketY + CONFIG.BUCKETS.HEIGHT / 2);
            ctx.scale(pulseScale, pulseScale);
            ctx.fillRect(-width / 2 + 3, -CONFIG.BUCKETS.HEIGHT / 2, width - 6, CONFIG.BUCKETS.HEIGHT);

            ctx.fillStyle = '#ffffff';
            ctx.font = `900 ${isJackpot ? 40 : 30}px Segoe UI, Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`x${zone.value}`, 0, 0);

            ctx.restore();
        }
    }
};
