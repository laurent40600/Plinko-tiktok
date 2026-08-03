/* ============================================================
   ROYAL DROP — render/pipeline.js
   ------------------------------------------------------------
   Orchestre le dessin de la scène complète, dans l'ordre :
   fond → (plateau/picots → billes/particules → buckets, ajoutés
   aux prochaines étapes) → cadre décoratif toujours par-dessus.
   Chaque étape est un module autonome dans render/ ; ce fichier
   ne fait que les enchaîner, il ne dessine jamais rien lui-même.
   ============================================================ */

import { CONFIG } from '../core/config.js';
import { drawBackground } from './background.js';
import { drawFrame } from './frame.js';

export class RenderPipeline {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = true;
    }

    /**
     * @param {object} state - snapshot de ce qu'il faut dessiner
     *   (rempli progressivement au fil des prochaines étapes :
     *   board, balls, particles, buckets...)
     */
    drawScene(state = {}) {
        const ctx = this.ctx;
        const theme = CONFIG.THEMES.LIST[CONFIG.THEMES.CURRENT];

        drawBackground(ctx, theme);

        // TODO (étape 2/3) : plateau, picots, billes, particules, buckets

        drawFrame(ctx, theme);
    }
}
