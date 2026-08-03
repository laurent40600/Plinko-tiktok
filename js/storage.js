/* ============================================================
   ROYAL DROP — storage.js
   ------------------------------------------------------------
   Gère toute la persistance via localStorage.
   Responsabilité unique : lire / écrire / réinitialiser la save.
   Aucune autre logique de jeu ne doit toucher localStorage
   directement : tout passe par ce module.
   ============================================================ */

const Storage = {

    /* --------------------------------------------------------
       Structure par défaut de la sauvegarde.
       Utilisée si aucune save n'existe ou si elle est corrompue.
       -------------------------------------------------------- */
    getDefaultSave() {
        return {
            version: 2,
            jackpot: CONFIG.ECONOMY.STARTING_JACKPOT,
            leaderboard: [],           // classement top gifts
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
            lastTheme: CONFIG.THEMES.CURRENT,
            statistics: {
                bucketHits: {},        // ex: { "0": 12, "4": 3, ... }
                jackpotHits: 0,
                sessionsPlayed: 0
            },
            lastSavedAt: null
        };
    },

    /* --------------------------------------------------------
       saveGame()
       Sauvegarde l'état complet du jeu passé en paramètre.
       -------------------------------------------------------- */
    saveGame(state) {
        try {
            const payload = {
                ...state,
                lastSavedAt: new Date().toISOString()
            };
            localStorage.setItem(
                CONFIG.STORAGE.SAVE_KEY,
                JSON.stringify(payload)
            );
            return true;
        } catch (err) {
            console.warn('[Storage] Échec de la sauvegarde :', err);
            return false;
        }
    },

    /* --------------------------------------------------------
       loadGame()
       Charge la sauvegarde existante, ou retourne une save
       par défaut si absente ou corrompue.
       -------------------------------------------------------- */
    loadGame() {
        try {
            const raw = localStorage.getItem(CONFIG.STORAGE.SAVE_KEY);
            if (!raw) return this.getDefaultSave();

            const parsed = JSON.parse(raw);

            // Fusion défensive : garantit que les nouvelles clés
            // ajoutées dans une future version soient présentes
            // même si la save vient d'une version plus ancienne.
            return this.mergeWithDefaults(parsed);

        } catch (err) {
            console.warn('[Storage] Save corrompue, réinitialisation :', err);
            return this.getDefaultSave();
        }
    },

    /* --------------------------------------------------------
       mergeWithDefaults()
       Fusionne récursivement une save existante avec la
       structure par défaut pour éviter les undefined.
       -------------------------------------------------------- */
    mergeWithDefaults(saved) {
        const defaults = this.getDefaultSave();

        const merge = (target, source) => {
            const result = { ...target };
            for (const key in source) {
                if (
                    typeof source[key] === 'object' &&
                    source[key] !== null &&
                    !Array.isArray(source[key])
                ) {
                    result[key] = merge(target[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
            return result;
        };

        return merge(defaults, saved);
    },

    /* --------------------------------------------------------
       resetSave()
       Efface complètement la sauvegarde et repart de zéro.
       -------------------------------------------------------- */
    resetSave() {
        try {
            localStorage.removeItem(CONFIG.STORAGE.SAVE_KEY);
            return this.getDefaultSave();
        } catch (err) {
            console.warn('[Storage] Échec du reset :', err);
            return this.getDefaultSave();
        }
    },

    /* --------------------------------------------------------
       isStorageAvailable()
       Vérifie que localStorage est utilisable (utile pour
       runDiagnostics() dans game.js).
       -------------------------------------------------------- */
    isStorageAvailable() {
        try {
            const testKey = '__royalDropTest__';
            localStorage.setItem(testKey, '1');
            localStorage.removeItem(testKey);
            return true;
        } catch (err) {
            return false;
        }
    }
};
