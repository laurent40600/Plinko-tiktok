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
    _imageCache: {},

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
       _getImage(src)
       Retourne l'image mise en cache pour ce chemin, en lançant
       son chargement au premier appel. Tant qu'elle n'est pas
       prête, retourne null (un repli visuel doit être prévu par
       l'appelant pendant ce court instant).
       -------------------------------------------------------- */
    _getImage(src) {
        let entry = this._imageCache[src];
        if (!entry) {
            const img = new Image();
            entry = { img, loaded: false };
            img.onload = () => { entry.loaded = true; };
            img.src = src;
            this._imageCache[src] = entry;
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
            const img = this._getImage(theme.bgImage);
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
       _roundedRectPath(ctx, x, y, w, h, r)
       Construit un chemin de rectangle à coins arrondis centré
       sur (0,0) (compatible partout, sans dépendre de
       ctx.roundRect qui n'existe pas sur les vieux Safari).
       -------------------------------------------------------- */
    _roundedRectPath(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    },

    /* --------------------------------------------------------
       _fitText(ctx, text, maxWidth, startSize, weight)
       Réduit la taille de police jusqu'à ce que le texte tienne
       dans maxWidth, pour garder les multiplicateurs lisibles
       quelle que soit la largeur du bucket.
       -------------------------------------------------------- */
    _fitText(ctx, text, maxWidth, startSize, weight = 900) {
        let size = startSize;
        ctx.font = `${weight} ${size}px Segoe UI, Arial`;
        while (size > 14 && ctx.measureText(text).width > maxWidth) {
            size -= 2;
            ctx.font = `${weight} ${size}px Segoe UI, Arial`;
        }
        return size;
    },

    /* --------------------------------------------------------
       _drawBuckets()
       Dessine la rangée de buckets multiplicateurs en bas du
       plateau : cadre néon coloré + gemme dorée + texte, avec
       un effet pulsé sur le bucket jackpot.
       -------------------------------------------------------- */
    _drawBuckets() {
        const ctx = this.ctx;
        const H = CONFIG.BUCKETS.HEIGHT;
        const bucketY = CONFIG.LOGICAL_HEIGHT - H - 200;

        for (const zone of Board.bucketZones) {
            const isJackpot = zone.index === CONFIG.BUCKETS.JACKPOT_INDEX;
            const width = zone.xEnd - zone.xStart;
            const w = width - 10;
            const h = H;

            ctx.save();

            // Léger effet de pulsation pour le bucket jackpot
            const pulseScale = isJackpot
                ? 1 + Math.sin(performance.now() / 200) * 0.04
                : 1;

            ctx.translate(zone.xStart + width / 2, bucketY + h / 2);
            ctx.scale(pulseScale, pulseScale);

            // --- Fond façon verre teinté ---
            const glass = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
            glass.addColorStop(0, `${zone.color}33`);
            glass.addColorStop(0.5, 'rgba(10, 4, 20, 0.75)');
            glass.addColorStop(1, `${zone.color}22`);
            this._roundedRectPath(ctx, -w / 2, -h / 2, w, h, 14);
            ctx.fillStyle = glass;
            ctx.fill();

            // --- Bordure néon (glow coloré) ---
            ctx.save();
            ctx.shadowColor = zone.color;
            ctx.shadowBlur = isJackpot ? 26 : 16;
            ctx.lineWidth = 4;
            ctx.strokeStyle = zone.color;
            this._roundedRectPath(ctx, -w / 2, -h / 2, w, h, 14);
            ctx.stroke();
            ctx.restore();

            // --- Liseré doré intérieur ---
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ffd76a';
            this._roundedRectPath(ctx, -w / 2 + 5, -h / 2 + 5, w - 10, h - 10, 10);
            ctx.stroke();

            // --- Gemme dorée en haut du cadre ---
            ctx.save();
            ctx.translate(0, -h / 2);
            ctx.rotate(Math.PI / 4);
            const gemSize = 11;
            ctx.fillStyle = zone.color;
            ctx.strokeStyle = '#ffd76a';
            ctx.lineWidth = 2;
            ctx.fillRect(-gemSize / 2, -gemSize / 2, gemSize, gemSize);
            ctx.strokeRect(-gemSize / 2, -gemSize / 2, gemSize, gemSize);
            ctx.restore();

            // --- Texte ---
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = zone.color;
            ctx.shadowBlur = 10;

            if (isJackpot) {
                ctx.font = `${Math.min(34, h * 0.24)}px Arial`;
                ctx.fillText('👑', 0, -h * 0.22);

                ctx.fillStyle = '#ffd76a';
                const size = this._fitText(ctx, 'x20', w - 16, 44);
                ctx.font = `900 ${size}px Segoe UI, Arial`;
                ctx.fillText('x20', 0, h * 0.20);
            } else {
                const label = `x${zone.value}`;
                ctx.fillStyle = '#ffffff';
                const size = this._fitText(ctx, label, w - 16, 40);
                ctx.font = `900 ${size}px Segoe UI, Arial`;
                ctx.fillText(label, 0, 2);
            }

            ctx.restore();
        }
    }
};
