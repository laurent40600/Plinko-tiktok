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

    // Voile façon panneau capitonné sombre — la référence est un
    // cuir/velours quasi noir avec une légère dominante prune, PAS
    // un panneau violet lumineux (l'éclat vient des picots dorés et
    // des rails néon du cadre, pas d'un fond éclairé).
    ctx.fillStyle = 'rgba(22, 13, 20, 0.86)';
    ctx.fillRect(0, 0, W, H);

    // Très léger halo au centre-haut, juste assez pour suggérer une
    // source de lumière derrière l'arche, sans éclaircir tout le panneau.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(W / 2, H * 0.22, 10, W / 2, H * 0.22, W * 0.3);
    glow.addColorStop(0, 'rgba(180, 90, 190, 0.18)');
    glow.addColorStop(1, 'rgba(180, 90, 190, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
}
