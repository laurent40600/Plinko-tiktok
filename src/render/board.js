/* ============================================================
   ROYAL DROP — render/board.js
   ------------------------------------------------------------
   Dessine le maillage décoratif en losanges puis les picots en
   petites billes dorées 3D (dégradé + ombre portée + glow).
   Pure fonction de dessin : ne connaît rien de la physique.
   ============================================================ */

import { CONFIG } from '../core/config.js';

export function drawLattice(ctx, board) {
    // Discret, façon cuir capitonné (PAS un néon lumineux) : juste
    // assez visible pour suggérer une texture matelassée en fond.
    ctx.save();
    ctx.strokeStyle = 'rgba(150, 90, 130, 0.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const line of board.latticeLines) {
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
    }
    ctx.stroke();

    // Petits clous/gemmes discrets aux intersections du maillage
    for (const line of board.latticeLines) {
        const mx = (line.x1 + line.x2) / 2;
        const my = (line.y1 + line.y2) / 2;
        ctx.save();
        ctx.translate(mx, my);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = 'rgba(190, 130, 170, 0.25)';
        ctx.fillRect(-2, -2, 4, 4);
        ctx.restore();
    }
    ctx.restore();
}

export function drawPegs(ctx, board) {
    const B = CONFIG.BOARD;
    const r = B.PEG_RADIUS;

    for (const peg of board.pegs) {
        const { x, y } = peg;

        ctx.save();

        // Ombre portée : donne l'impression que le picot dépasse du panneau
        ctx.beginPath();
        ctx.ellipse(x + 3, y + r * 2.1, r * 0.9, r * 0.45, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fill();

        // --- Tige (le picot dépasse nettement du panneau, pas une
        // simple bille plate — une bonne partie doit dépasser sous
        // la tête pour bien se voir une fois la tête dessinée dessus).
        const neckTop = y + r * 0.25;
        const neckBottom = y + r * 2.0;
        const neckTopW = r * 0.56;
        const neckBottomW = r * 0.4;

        const neckGrad = ctx.createLinearGradient(x - neckTopW, 0, x + neckTopW, 0);
        neckGrad.addColorStop(0, '#5a3006');
        neckGrad.addColorStop(0.45, '#c9860f');
        neckGrad.addColorStop(0.55, '#e8a324');
        neckGrad.addColorStop(1, '#4a2705');

        ctx.beginPath();
        ctx.moveTo(x - neckTopW, neckTop);
        ctx.lineTo(x + neckTopW, neckTop);
        ctx.lineTo(x + neckBottomW, neckBottom);
        ctx.lineTo(x - neckBottomW, neckBottom);
        ctx.closePath();
        ctx.fillStyle = neckGrad;
        ctx.fill();

        // --- Tête (sphère dorée, fort contraste highlight/ombre) ---
        ctx.shadowColor = B.PEG_GLOW_COLOR;
        ctx.shadowBlur = 16;

        const grad = ctx.createRadialGradient(
            x - r * 0.4, y - r * 0.45, r * 0.1,
            x, y, r
        );
        grad.addColorStop(0, '#fff8e6');
        grad.addColorStop(0.25, '#ffc766');
        grad.addColorStop(0.6, '#e0891a');
        grad.addColorStop(0.85, '#8a4c08');
        grad.addColorStop(1, '#4a2705');

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Liseré sombre pour détacher la bille du fond
        ctx.strokeStyle = 'rgba(30, 15, 5, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Reflet net et petit (specular), pas un halo diffus
        ctx.beginPath();
        ctx.arc(x - r * 0.38, y - r * 0.42, r * 0.16, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Léger reflet secondaire sur le bord opposé (rim light)
        ctx.beginPath();
        ctx.arc(x + r * 0.5, y + r * 0.35, r * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 220, 160, 0.35)';
        ctx.fill();

        ctx.restore();
    }
}
