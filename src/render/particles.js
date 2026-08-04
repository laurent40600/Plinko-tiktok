/* ============================================================
   ROYAL DROP — render/particles.js
   ------------------------------------------------------------
   Dessine les particules (étincelles) et textes flottants
   actifs du ParticleSystem.
   ============================================================ */

export function drawParticles(ctx, particleSystem) {
    for (const p of particleSystem.pool) {
        if (!p.active) continue;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    for (const t of particleSystem.textPool) {
        if (!t.active) continue;

        ctx.save();
        ctx.globalAlpha = Math.max(0, t.alpha);
        ctx.fillStyle = t.color;
        ctx.font = `900 ${t.fontSize}px Segoe UI, Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 6;
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
    }
}
