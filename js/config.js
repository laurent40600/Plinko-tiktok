/* ============================================================
   ROYAL DROP — config.js
   ------------------------------------------------------------
   TOUTES les valeurs modifiables du jeu vivent ici.
   Aucune valeur "importante" (couleur, physique, prix, timing)
   ne doit être écrite en dur ailleurs dans le code.
   Modifier ce fichier = modifier le comportement du jeu.
   ============================================================ */

const CONFIG = {

    // ------------------------------------------------------------
    // ESPACE LOGIQUE FIXE (ne jamais changer même si l'écran change)
    // ------------------------------------------------------------
    LOGICAL_WIDTH: 1080,
    LOGICAL_HEIGHT: 1920,

    // ------------------------------------------------------------
    // PHYSIQUE (méthode d'Euler)
    // ------------------------------------------------------------
    PHYSICS: {
        GRAVITY: 980,              // px/s² — gravité verticale
        RESTITUTION: 0.55,         // rebond sur les picots (0-1)
        FRICTION: 0.02,            // perte de vitesse horizontale par frame
        AIR_DRAG: 0.001,           // résistance de l'air
        MAX_VELOCITY: 2200,        // vitesse plafond pour éviter les bugs
        SUBSTEPS: 2,               // sous-étapes physiques par frame (stabilité)
        WALL_BOUNCE_DAMPING: 0.7,  // amortissement rebond sur les murs latéraux

        // Anti-blocage (4 protections obligatoires)
        ANTI_STUCK: {
            MIN_VELOCITY_THRESHOLD: 5,      // vitesse en dessous de laquelle une bille est "suspecte"
            STUCK_TIME_LIMIT: 1.5,          // secondes avant qu'on considère une bille bloquée
            RANDOM_NUDGE_FORCE: 40,         // micro-impulsion latérale aléatoire pour débloquer
            MAX_STUCK_CHECKS_PER_FRAME: 20  // limite de vérifications par frame (perf)
        }
    },

    // ------------------------------------------------------------
    // PLATEAU (board.js)
    // ------------------------------------------------------------
    BOARD: {
        ROWS: 12,
        PEG_RADIUS: 9,
        PEG_SPACING_X: 78,
        PEG_SPACING_Y: 95,
        BOARD_TOP_Y: 380,
        BOARD_MARGIN_X: 250,       // marge gauche/droite avant premier picot
        PEG_COLOR: '#ffd76a',
        PEG_GLOW_COLOR: 'rgba(255,215,106,0.6)'
    },

    // ------------------------------------------------------------
    // BUCKETS / MULTIPLICATEURS (ordre gauche → droite, symétrique)
    // ------------------------------------------------------------
    BUCKETS: {
        VALUES: [0.5, 1, 2, 3, 20, 3, 2, 1, 0.5],
        COLORS: [
            '#8a3fd1', '#2f6fe0', '#2fbf5a', '#2fbf5a',
            '#ffd76a', '#2fbf5a', '#2fbf5a', '#2f6fe0', '#8a3fd1'
        ],
        JACKPOT_INDEX: 4,          // index du bucket central (JACKPOT, x20)
        HEIGHT: 140,
        BOTTOM_OFFSET: 270,        // distance entre le bas du plateau et le haut des buckets
        JACKPOT_PULSE_DURATION: 600 // ms d'animation quand jackpot touché
    },

    // ------------------------------------------------------------
    // BILLE
    // ------------------------------------------------------------
    BALL: {
        RADIUS: 22,
        SPAWN_Y: 340,
        DEFAULT_COLOR: '#c77dff',
        TRAIL_LENGTH: 8,
        POOL_SIZE: 60              // nombre max de billes recyclées simultanément
    },

    // ------------------------------------------------------------
    // ÉCONOMIE / MISES
    // ------------------------------------------------------------
    ECONOMY: {
        LAUNCH_COST: 100,
        STARTING_JACKPOT: 5000,
        JACKPOT_CONTRIBUTION_RATE: 0.05,  // % de chaque mise qui alimente le jackpot
        CURRENCY_ICON: '💎'
    },

    // ------------------------------------------------------------
    // CAMÉRA
    // ------------------------------------------------------------
    CAMERA: {
        FOLLOW_ENABLED: true,
        FOLLOW_SMOOTHING: 0.08,
        ZOOM_ON_DROP: 1.05,
        ZOOM_DEFAULT: 1.0,
        ZOOM_SMOOTHING: 0.05
    },

    // ------------------------------------------------------------
    // AUDIO (Web Audio API uniquement, aucun fichier son)
    // ------------------------------------------------------------
    AUDIO: {
        MASTER_VOLUME: 0.8,
        MAX_SIMULTANEOUS_BOUNCES: 6,   // limite anti-saturation
        PEG_HIT_FREQ: 880,
        BUCKET_WIN_FREQ: 440,
        JACKPOT_FREQ: 220
    },

    // ------------------------------------------------------------
    // PARTICULES
    // ------------------------------------------------------------
    PARTICLES: {
        POOL_SIZE: 200,
        BURST_COUNT_ON_BUCKET: 18,
        BURST_COUNT_ON_JACKPOT: 60,
        LIFETIME: 0.8,
        GRAVITY: 400
    },

    // ------------------------------------------------------------
    // ANIMATIONS DIVERSES
    // ------------------------------------------------------------
    ANIMATIONS: {
        FLOATING_TEXT_DURATION: 1.2,
        FLOATING_TEXT_RISE: 80,
        BUCKET_FLASH_DURATION: 0.4
    },

    // ------------------------------------------------------------
    // THÈMES (moteur multi-thèmes — seul "royal" est illustré)
    // ------------------------------------------------------------
    THEMES: {
        CURRENT: 'royal',
        LIST: {
            royal: {
                label: 'Royal',
                bgGradient: ['#2a1245', '#0d0518', '#05010a'],
                bgImage: 'assets/backgrounds/royal-throne.jpg',
                frameImage: 'assets/backgrounds/royal-frame.webp',
                accentColor: '#ffd76a',
                ballColor: '#c77dff'
            },
            cyberpunk: {
                label: 'Cyberpunk',
                bgGradient: ['#0d0d0d', '#001a1a'],
                accentColor: '#00ffe1',
                ballColor: '#ff00c8'
                // Graphismes à créer ultérieurement
            },
            egypte: {
                label: 'Égypte',
                bgGradient: ['#3a2a0a', '#1a1200'],
                accentColor: '#ffcc66',
                ballColor: '#e0b84f'
                // Graphismes à créer ultérieurement
            },
            pirate: {
                label: 'Pirate',
                bgGradient: ['#0a1a2a', '#001018'],
                accentColor: '#c0c0c0',
                ballColor: '#4fa3e0'
                // Graphismes à créer ultérieurement
            }
        }
    },

    // ------------------------------------------------------------
    // IA / JOUEURS VIRTUELS (bots.js)
    // ------------------------------------------------------------
    BOTS: {
        ENABLED: true,
        SPAWN_INTERVAL_MIN: 4,     // secondes
        SPAWN_INTERVAL_MAX: 12,
        MAX_ACTIVE_NAMES: 20,
        PERSONALITIES: ['prudent', 'agressif', 'chanceux', 'fidele'],
        NAMES_POOL: [
            'Emma', 'Lea', 'Tom', 'Lucas', 'Chloe', 'Nico',
            'Laura', 'Kevin', 'Jules', 'Sarah', 'Hugo', 'Manon'
        ]
    },

    // ------------------------------------------------------------
    // DEBUG
    // ------------------------------------------------------------
    DEBUG: {
        TOGGLE_KEY: 'd',
        DEFAULT_ENABLED: false,
        SHOW_HITBOX_DEFAULT: false,
        SHOW_VECTORS_DEFAULT: false,
        SHOW_TRAJECTORY_DEFAULT: false
    },

    // ------------------------------------------------------------
    // STOCKAGE LOCAL
    // ------------------------------------------------------------
    STORAGE: {
        SAVE_KEY: 'royalDropSaveV2',
        AUTOSAVE_INTERVAL: 15000 // ms
    },

    // ------------------------------------------------------------
    // PERFORMANCE
    // ------------------------------------------------------------
    PERFORMANCE: {
        TARGET_FPS: 60,
        MAX_DELTA_TIME: 0.05 // évite les gros sauts si le tab est en arrière-plan
    }
};

// Empêche toute modification accidentelle en dehors de ce fichier
Object.freeze(CONFIG.PHYSICS.ANTI_STUCK);
