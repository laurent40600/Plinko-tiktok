/* ============================================================
   ROYAL DROP — render/frame.js
   ------------------------------------------------------------
   Dessine le cadre décoratif (colonnes, arche/logo, socle) par-
   dessus toute la scène. L'image source est évidée en son
   centre : seuls les bords ornementés sont opaques, le jeu
   reste visible et interactif dans la découpe.
   ============================================================ */

import { CONFIG } from '../core/config.js';
import { getImage } from './imageCache.js';

export function drawFrame(ctx, theme) {
    if (!theme.frameImage) return;
    const img = getImage(theme.frameImage);
    if (!img) return;

    const W = CONFIG.LOGICAL_WIDTH;
    const H = CONFIG.LOGICAL_HEIGHT;
    const scale = Math.max(W / img.width, H / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
}
