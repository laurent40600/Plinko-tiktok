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

    // Voile façon panneau capitonné quasi noir. La référence ne
    // montre PAS un couloir/portail visible derrière les picots :
    // c'est un panneau de cuir sombre uni. Voile très opaque pour
    // que la photo de fond (utile ailleurs, hors de cette découpe)
    // n'y laisse plus transparaître son motif (mandala, colonnes...).
    ctx.fillStyle = 'rgba(18, 11, 16, 0.95)';
    ctx.fillRect(0, 0, W, H);

    // Très léger halo au centre-haut, juste assez pour suggérer une
    // source de lumière derrière l'arche, sans éclaircir le panneau
    // ni laisser deviner la photo dessous.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(W / 2, H * 0.22, 10, W / 2, H * 0.22, W * 0.22);
    glow.addColorStop(0, 'rgba(180, 90, 190, 0.12)');
    glow.addColorStop(1, 'rgba(180, 90, 190, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
}
