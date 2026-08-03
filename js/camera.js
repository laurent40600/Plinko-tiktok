/* ============================================================
   ROYAL DROP — camera.js
   ------------------------------------------------------------
   Gère le zoom léger et le suivi visuel des billes.
   IMPORTANT : la caméra ne modifie JAMAIS les coordonnées
   physiques réelles du jeu (espace logique 1080x1920 fixe).
   Elle applique uniquement une transformation de rendu
   (translation + zoom) sur le contexte Canvas avant de dessiner.
   Le scaling global écran (transform:scale CSS) est séparé
   et géré par engine.js / renderer.js.
   ============================================================ */

const Camera = {

    // Position actuelle de la caméra (centre de vue logique)
    x: CONFIG.LOGICAL_WIDTH / 2,
    y: CONFIG.LOGICAL_HEIGHT / 2,

    // Cible que la caméra essaie de suivre
    targetX: CONFIG.LOGICAL_WIDTH / 2,
    targetY: CONFIG.LOGICAL_HEIGHT / 2,

    // Zoom actuel et zoom cible
    zoom: CONFIG.CAMERA.ZOOM_DEFAULT,
    targetZoom: CONFIG.CAMERA.ZOOM_DEFAULT,

    /* --------------------------------------------------------
       reset()
       Remet la caméra dans sa position par défaut (centrée,
       zoom neutre). Utilisé au changement de thème ou reset.
       -------------------------------------------------------- */
    reset() {
        this.x = CONFIG.LOGICAL_WIDTH / 2;
        this.y = CONFIG.LOGICAL_HEIGHT / 2;
        this.targetX = this.x;
        this.targetY = this.y;
        this.zoom = CONFIG.CAMERA.ZOOM_DEFAULT;
        this.targetZoom = CONFIG.CAMERA.ZOOM_DEFAULT;
    },

    /* --------------------------------------------------------
       followBall(ball)
       Définit une bille comme cible de suivi. Appelé par
       ball.js/engine.js quand une nouvelle bille est lancée.
       -------------------------------------------------------- */
    followBall(ball) {
        if (!CONFIG.CAMERA.FOLLOW_ENABLED || !ball) return;

        this.targetX = ball.x;
        this.targetY = ball.y;
        this.targetZoom = CONFIG.CAMERA.ZOOM_ON_DROP;
    },

    /* --------------------------------------------------------
       releaseFollow()
       Relâche le suivi et revient au cadrage par défaut
       (ex: quand la bille est tombée dans un bucket).
       -------------------------------------------------------- */
    releaseFollow() {
        this.targetX = CONFIG.LOGICAL_WIDTH / 2;
        this.targetY = CONFIG.LOGICAL_HEIGHT / 2;
        this.targetZoom = CONFIG.CAMERA.ZOOM_DEFAULT;
    },

    /* --------------------------------------------------------
       update(dt)
       Interpolation douce (lerp) vers la cible, à chaque frame.
       -------------------------------------------------------- */
    update(dt) {
        const posSmoothing = CONFIG.CAMERA.FOLLOW_SMOOTHING;
        const zoomSmoothing = CONFIG.CAMERA.ZOOM_SMOOTHING;

        this.x += (this.targetX - this.x) * posSmoothing;
        this.y += (this.targetY - this.y) * posSmoothing;
        this.zoom += (this.targetZoom - this.zoom) * zoomSmoothing;
    },

    /* --------------------------------------------------------
       applyTransform(ctx)
       Applique la transformation caméra au contexte Canvas
       avant de dessiner la scène de jeu. À appeler avant
       renderer.drawScene() et annuler après avec restoreTransform().
       -------------------------------------------------------- */
    applyTransform(ctx) {
        ctx.save();

        // Centre l'origine sur le centre logique de l'écran
        const cx = CONFIG.LOGICAL_WIDTH / 2;
        const cy = CONFIG.LOGICAL_HEIGHT / 2;

        ctx.translate(cx, cy);
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.x, -this.y);
    },

    /* --------------------------------------------------------
       restoreTransform(ctx)
       Annule la transformation appliquée par applyTransform().
       -------------------------------------------------------- */
    restoreTransform(ctx) {
        ctx.restore();
    },

    /* --------------------------------------------------------
       worldToScreen(x, y)
       Convertit une coordonnée logique du monde en coordonnée
       visuelle tenant compte du zoom/caméra actuels.
       Utile pour positionner des éléments UI liés à la bille
       (ex: texte flottant au-dessus d'une bille suivie).
       -------------------------------------------------------- */
    worldToScreen(x, y) {
        const cx = CONFIG.LOGICAL_WIDTH / 2;
        const cy = CONFIG.LOGICAL_HEIGHT / 2;

        return {
            x: cx + (x - this.x) * this.zoom,
            y: cy + (y - this.y) * this.zoom
        };
    }
};
