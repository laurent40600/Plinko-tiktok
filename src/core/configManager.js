/* ============================================================
   ROYAL DROP — core/configManager.js
   ------------------------------------------------------------
   Charge les fichiers /config/*.json (contenu éditorial : cadeaux,
   événements, jackpot, boss, sons, animations, niveaux) et les
   attache à CONFIG. Tout est modifiable sans toucher au code.
   Ne touche JAMAIS CONFIG.BOARD / CONFIG.BUCKETS / CONFIG.PHYSICS :
   le plateau et ses règles restent pilotés uniquement par core/config.js.
   ============================================================ */

import { CONFIG } from './config.js';

// NB: les clés ne doivent JAMAIS entrer en collision avec les
// namespaces déjà définis dans core/config.js (ex: CONFIG.ANIMATIONS
// existe déjà pour les durées internes du jeu — le fichier JSON
// éditorial équivalent est donc exposé sous CONFIG.SHOW_ANIMATIONS).
const FILES = {
    GIFTS: 'config/gifts.json',
    EVENTS: 'config/events.json',
    JACKPOT: 'config/jackpot.json',
    BOSS: 'config/boss.json',
    SOUNDS: 'config/sounds.json',
    SHOW_ANIMATIONS: 'config/animations.json',
    LEVELS: 'config/levels.json'
};

async function fetchJSON(path) {
    const res = await fetch(path, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status} sur ${path}`);
    return res.json();
}

/** Charge tous les fichiers de /config et les attache à CONFIG.<CLE>. */
export async function loadRuntimeConfig() {
    const entries = Object.entries(FILES);
    const results = await Promise.allSettled(entries.map(([, path]) => fetchJSON(path)));

    results.forEach((result, i) => {
        const [key, path] = entries[i];
        if (result.status === 'fulfilled') {
            CONFIG[key] = result.value;
        } else {
            console.warn(`[ConfigManager] Échec du chargement de ${path} :`, result.reason);
            CONFIG[key] = CONFIG[key] || {};
        }
    });

    // Multiplicateur de gain temporaire (événements type "Double Gains") et
    // case bonus temporaire : couche additive lue au moment du paiement,
    // ne modifie jamais CONFIG.BUCKETS.VALUES ni la position des cases.
    CONFIG.RUNTIME = {
        payoutMultiplier: 1,
        bonusBucketIndex: -1,
        bonusBucketMultiplier: 1,
        goldenBallsActive: false
    };

    return CONFIG;
}
