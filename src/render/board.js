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
    ctx.strokeStyle = 'rgba(180, 130, 255, 0.18)';
    ctx.lineWidth = 1.5;
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
        ctx.shadowBlur = 10;

        const grad = ctx.createRadialGradient(
            peg.x - r * 0.35, peg.y - r * 0.4, r * 0.15,
            peg.x, peg.y, r
        );
        grad.addColorStop(0, '#fff6d6');
        grad.addColorStop(0.35, '#ffd76a');
        grad.addColorStop(0.75, '#c9932f');
        grad.addColorStop(1, '#8a5f18');

        ctx.beginPath();
        ctx.arc(peg.x, peg.y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.restore();
    }
}
