/* ============================================================
   ROYAL DROP — render/effectsOverlay.js
   ------------------------------------------------------------
   Vignette "spotlight" du mode cinématique Jackpot : assombrit
   tout sauf un halo autour de la bille suivie par la caméra.
   Dessiné à l'intérieur de la transformation caméra (donc dans
   l'espace monde), pour rester ancré sur la bille pendant le
   zoom/suivi.
   ============================================================ */

export function drawSpotlight(ctx, spotlight) {
    if (!spotlight) return;
    const { x, y, radius, alpha } = spotlight;

    ctx.save();
    const grad = ctx.createRadialGradient(x, y, radius * 0.35, x, y, radius);
    grad.addColorStop(0, 'rgba(5, 1, 10, 0)');
    grad.addColorStop(1, `rgba(5, 1, 10, ${alpha})`);
    ctx.fillStyle = grad;
    // Grand rectangle centré sur la bille : couvre l'écran quel que
    // soit le zoom/pan caméra courant.
    ctx.fillRect(x - 3000, y - 3000, 6000, 6000);
    ctx.restore();
}
