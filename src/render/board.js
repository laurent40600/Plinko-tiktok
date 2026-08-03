/* ============================================================
   ROYAL DROP — render/board.js
   ------------------------------------------------------------
   Dessine le maillage décoratif en losanges puis les picots en
   petites billes dorées 3D (dégradé + ombre portée + glow).
   Pure fonction de dessin : ne connaît rien de la physique.
   ============================================================ */

import { CONFIG } from '../core/config.js';

export function drawLattice(ctx, board) {
    ctx.save();
    ctx.strokeStyle = 'rgba(230, 110, 245, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(220, 90, 240, 0.55)';
    ctx.shadowBlur = 3;
    ctx.beginPath();
    for (const line of board.latticeLines) {
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
    }
    ctx.stroke();
    ctx.restore();
}

export function drawPegs(ctx, board) {
    const B = CONFIG.BOARD;
    const r = B.PEG_RADIUS;

    for (const peg of board.pegs) {
        ctx.save();

        // Ombre portée : donne l'impression que le picot dépasse du panneau
        ctx.beginPath();
        ctx.ellipse(peg.x + 2, peg.y + 3, r * 0.95, r * 0.7, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fill();

        ctx.shadowColor = B.PEG_GLOW_COLOR;
        ctx.shadowBlur = 20;

        const grad = ctx.createRadialGradient(
            peg.x - r * 0.35, peg.y - r * 0.4, r * 0.15,
            peg.x, peg.y, r
        );
        grad.addColorStop(0, '#fff3d0');
        grad.addColorStop(0.3, '#ffb347');
        grad.addColorStop(0.7, '#e07a12');
        grad.addColorStop(1, '#7a3d05');

        ctx.beginPath();
        ctx.arc(peg.x, peg.y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Petit éclat brillant (sparkle) pour un effet gemme polie
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(peg.x - r * 0.35, peg.y - r * 0.4, r * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fill();

        ctx.restore();
    }
}
