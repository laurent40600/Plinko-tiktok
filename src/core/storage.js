/* ============================================================
   ROYAL DROP — core/storage.js
   ------------------------------------------------------------
   Persistance via localStorage. Responsabilité unique : lire /
   écrire / réinitialiser la sauvegarde. Aucun autre module ne
   doit toucher localStorage directement.
   ============================================================ */

import { CONFIG } from './config.js';

export function getDefaultSave() {
    return {
        version: 3,
        leaderboard: [],
        records: {
            biggestWin: 0,
            totalLaunches: 0,
            totalWinnings: 0
        },
        preferences: {
            theme: CONFIG.THEMES.CURRENT,
            selectedSkin: 'default'
        },
        skins: {
            unlocked: ['default'],
            equipped: 'default'
        },
        settings: {
            volume: CONFIG.AUDIO.MASTER_VOLUME,
            debugEnabled: CONFIG.DEBUG.DEFAULT_ENABLED
        },
        statistics: {
            bucketHits: {},
            jackpotHits: 0,
            sessionsPlayed: 0
        },
        lastSavedAt: null
    };
}

export function saveGame(state) {
    try {
        const payload = { ...state, lastSavedAt: new Date().toISOString() };
        localStorage.setItem(CONFIG.STORAGE.SAVE_KEY, JSON.stringify(payload));
        return true;
    } catch (err) {
        console.warn('[Storage] Échec de la sauvegarde :', err);
        return false;
    }
}

export function loadGame() {
    try {
        const raw = localStorage.getItem(CONFIG.STORAGE.SAVE_KEY);
        if (!raw) return getDefaultSave();
        return mergeWithDefaults(JSON.parse(raw));
    } catch (err) {
        console.warn('[Storage] Save corrompue, réinitialisation :', err);
        return getDefaultSave();
    }
}

/** Fusion récursive avec les valeurs par défaut : évite les undefined
    quand une save vient d'une version plus ancienne du jeu. */
export function mergeWithDefaults(saved) {
    const defaults = getDefaultSave();

    const merge = (target, source) => {
        const result = { ...target };
        for (const key in source) {
            if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                result[key] = merge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        return result;
    };

    return merge(defaults, saved);
}

export function resetSave() {
    try {
        localStorage.removeItem(CONFIG.STORAGE.SAVE_KEY);
    } catch (err) {
        console.warn('[Storage] Échec du reset :', err);
    }
    return getDefaultSave();
}

export function isStorageAvailable() {
    try {
        const testKey = '__royalDropTest__';
        localStorage.setItem(testKey, '1');
        localStorage.removeItem(testKey);
        return true;
    } catch {
        return false;
    }
}
