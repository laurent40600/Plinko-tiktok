/* ============================================================
   ROYAL DROP — core/viewport.js
   ------------------------------------------------------------
   Met à l'échelle l'espace logique fixe (CONFIG.LOGICAL_*) pour
   qu'il tienne dans l'écran réel, via une variable CSS --scale
   sur #game-root. Aucune coordonnée de jeu ne change jamais :
   seul cet habillage visuel s'adapte à l'écran.
   ============================================================ */

import { CONFIG } from './config.js';

export function initViewport(rootElement) {
    const applyScale = () => {
        const scaleX = window.innerWidth / CONFIG.LOGICAL_WIDTH;
        const scaleY = window.innerHeight / CONFIG.LOGICAL_HEIGHT;
        const scale = Math.min(scaleX, scaleY);
        rootElement.style.setProperty('--scale', scale);
    };

    applyScale();
    window.addEventListener('resize', applyScale);
    window.addEventListener('orientationchange', applyScale);
}
