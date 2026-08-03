/* ============================================================
   ROYAL DROP — render/buckets.js
   ------------------------------------------------------------
   Dessine la rangée de buckets multiplicateurs : parois dorées
   pointues façon vrai Plinko, cadre néon coloré + gemmes aux 4
   coins + reflet verre, texte auto-ajusté avec contour sombre
   pour rester lisible sur n'importe quelle couleur de fond.
   ============================================================ */

import { CONFIG } from '../core/config.js';
import { roundedRectPath } from './shapes.js';

function fitText(ctx, text, maxWidth, startSize, weight = 900) {
    let size = startSize;
    ctx.font = `${weight} ${size}px Segoe UI, Arial`;
    while (size > 14 && ctx.measureText(text).width > maxWidth) {
        size -= 2;
        ctx.font = `${weight} ${size}px Segoe UI, Arial`;
    }
    return size;
}

function bucketTopY() {
    return CONFIG.LOGICAL_HEIGHT - CONFIG.BUCKETS.HEIGHT - CONFIG.BUCKETS.BOTTOM_OFFSET;
}

function drawDividers(ctx, board) {
    const bucketY = bucketTopY();
    const peak = 60;

    for (let i = 1; i < board.bucketZones.length; i++) {
        const x = board.bucketZones[i].xStart;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x - 10, bucketY + 6);
        ctx.lineTo(x, bucketY - peak);
        ctx.lineTo(x + 10, bucketY + 6);
        ctx.closePath();

        const grad = ctx.createLinearGradient(x, bucketY - peak, x, bucketY);
        grad.addColorStop(0, '#fff6d6');
        grad.addColorStop(0.4, '#ffd76a');
        grad.addColorStop(1, '#8a5f18');

        ctx.shadowColor = 'rgba(255, 215, 106, 0.55)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 246, 214, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
    }
}

function drawBucketPanel(ctx, zone, h, isJackpot) {
    const width = zone.xEnd - zone.xStart;
    const w = width - 10;
    const bucketY = bucketTopY();

    ctx.save();

    const pulseScale = isJackpot ? 1 + Math.sin(performance.now() / 200) * 0.04 : 1;
    ctx.translate(zone.xStart + width / 2, bucketY + h / 2);
    ctx.scale(pulseScale, pulseScale);

    // Fond façon verre teinté
    const glass = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    glass.addColorStop(0, `${zone.color}55`);
    glass.addColorStop(0.5, 'rgba(8, 3, 16, 0.8)');
    glass.addColorStop(1, `${zone.color}33`);
    roundedRectPath(ctx, -w / 2, -h / 2, w, h, 12);
    ctx.fillStyle = glass;
    ctx.fill();

    // Reflet diagonal (effet verre/gemme)
    ctx.save();
    roundedRectPath(ctx, -w / 2, -h / 2, w, h, 12);
    ctx.clip();
    const shine = ctx.createLinearGradient(-w / 2, -h / 2, 0, 0);
    shine.addColorStop(0, 'rgba(255,255,255,0.22)');
    shine.addColorStop(0.35, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.fillRect(-w / 2, -h / 2, w, h * 0.6);
    ctx.restore();

    // Double bordure façon bijou (glow coloré + trait or)
    ctx.save();
    ctx.shadowColor = zone.color;
    ctx.shadowBlur = isJackpot ? 28 : 14;
    ctx.lineWidth = 5;
    ctx.strokeStyle = zone.color;
    roundedRectPath(ctx, -w / 2, -h / 2, w, h, 12);
    ctx.stroke();
    ctx.restore();

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffd76a';
    roundedRectPath(ctx, -w / 2 + 5, -h / 2 + 5, w - 10, h - 10, 9);
    ctx.stroke();

    // Gemmes dorées aux 4 coins
    const corners = [[-w / 2, -h / 2], [w / 2, -h / 2], [-w / 2, h / 2], [w / 2, h / 2]];
    const gemSize = isJackpot ? 13 : 9;
    for (const [gx, gy] of corners) {
        ctx.save();
        ctx.translate(gx, gy);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = zone.color;
        ctx.strokeStyle = '#ffd76a';
        ctx.lineWidth = 1.5;
        ctx.fillRect(-gemSize / 2, -gemSize / 2, gemSize, gemSize);
        ctx.strokeRect(-gemSize / 2, -gemSize / 2, gemSize, gemSize);
        ctx.restore();
    }

    // Texte (contour sombre pour rester lisible sur tout fond)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (isJackpot) {
        ctx.font = `${Math.min(34, h * 0.24)}px Arial`;
        ctx.fillText('👑', 0, -h * 0.22);

        const size = fitText(ctx, 'x20', w - 14, 44);
        ctx.font = `900 ${size}px Segoe UI, Arial`;
        ctx.lineJoin = 'round';
        ctx.lineWidth = 5;
        ctx.strokeStyle = 'rgba(20, 8, 0, 0.85)';
        ctx.strokeText('x20', 0, h * 0.20);
        ctx.shadowColor = zone.color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ffd76a';
        ctx.fillText('x20', 0, h * 0.20);
    } else {
        const label = `x${zone.value}`;
        const size = fitText(ctx, label, w - 14, 40);
        ctx.font = `900 ${size}px Segoe UI, Arial`;
        ctx.lineJoin = 'round';
        ctx.lineWidth = 5;
        ctx.strokeStyle = 'rgba(10, 4, 20, 0.85)';
        ctx.strokeText(label, 0, 2);
        ctx.shadowColor = zone.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, 0, 2);
    }

    ctx.restore();
}

export function drawBuckets(ctx, board) {
    const h = CONFIG.BUCKETS.HEIGHT;

    drawDividers(ctx, board);

    for (const zone of board.bucketZones) {
        drawBucketPanel(ctx, zone, h, zone.index === CONFIG.BUCKETS.JACKPOT_INDEX);
    }
}
