/* ============================================================
   ROYAL DROP — render/background.js
   ------------------------------------------------------------
   Dessine le fond du thème courant : dégradé de repli, photo
   de fond (mode "cover"), puis un voile sombre qui sert aussi
   de panneau vitré derrière les picots/buckets (masqué par le
   cadre décoratif dessiné par-dessus, cf. render/frame.js).
   ============================================================ */

import { CONFIG } from '../core/config.js';
import { getImage } from './imageCache.js';

export function drawBackground(ctx, theme) {
    const W = CONFIG.LOGICAL_WIDTH;
    const H = CONFIG.LOGICAL_HEIGHT;

    ctx.clearRect(0, 0, W, H);

    const gradient = ctx.createRadialGradient(
        W / 2, H * 0.3, 100,
        W / 2, H * 0.5, H
    );
    theme.bgGradient.forEach((color, i) => {
        gradient.addColorStop(i / (theme.bgGradient.length - 1), color);
    });
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    if (!theme.bgImage) return;
    const img = getImage(theme.bgImage);
    if (!img) return;

    const scale = Math.max(W / img.width, H / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);

    // Voile sombre façon panneau vitré. Un seul calque plein canvas,
    // masqué par la même découpe que le cadre : jamais de décalage
    // de bord possible entre les deux (cf. leçon de la v1).
    ctx.fillStyle = 'rgba(4, 1, 9, 0.72)';
    ctx.fillRect(0, 0, W, H);
}
