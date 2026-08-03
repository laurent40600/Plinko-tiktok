/* ============================================================
   ROYAL DROP — core/config.js
   ------------------------------------------------------------
   Toutes les valeurs modifiables du jeu vivent ici. Aucune
   valeur importante (couleur, physique, prix, timing) ne doit
   être écrite en dur ailleurs : modifier ce fichier = modifier
   le comportement du jeu.
   ============================================================ */

export const CONFIG = {

    // Espace logique fixe (ne change jamais, seul le CSS scale à l'écran réel)
    LOGICAL_WIDTH: 1080,
    LOGICAL_HEIGHT: 1920,

    PHYSICS: {
        GRAVITY: 980,
        RESTITUTION: 0.55,
        FRICTION: 0.02,
        AIR_DRAG: 0.001,
        MAX_VELOCITY: 2200,
        SUBSTEPS: 2,
        WALL_BOUNCE_DAMPING: 0.7,

        ANTI_STUCK: {
            MIN_VELOCITY_THRESHOLD: 5,
            STUCK_TIME_LIMIT: 1.5,
            RANDOM_NUDGE_FORCE: 40,
            MAX_STUCK_CHECKS_PER_FRAME: 20
        }
    },

    BOARD: {
        ROWS: 12,
        PEG_RADIUS: 9,
        PEG_SPACING_X: 78,
        PEG_SPACING_Y: 95,
        BOARD_TOP_Y: 380,
        // Marge gauche/droite du terrain de jeu — partagée par les picots,
        // les murs (physics.js) ET les buckets (mêmes bornes horizontales,
        // pour que les picots couvrent bien toute la largeur des buckets).
        MARGIN_X: 100,
        PEG_COLOR: '#ffb347',
        PEG_GLOW_COLOR: 'rgba(255,179,71,0.9)'
    },

    BUCKETS: {
        VALUES: [0.5, 1, 2, 3, 20, 3, 2, 1, 0.5],
        COLORS: [
            '#b81fe0', '#2f8fe8', '#2fd66a', '#2fd66a',
            '#ffd76a', '#2fd66a', '#2fd66a', '#2f8fe8', '#b81fe0'
        ],
        JACKPOT_INDEX: 4,
        HEIGHT: 140,
        BOTTOM_OFFSET: 300, // distance entre le bas du plateau et le haut des buckets (resserré sous les picots)
        JACKPOT_PULSE_DURATION: 600
    },

    BALL: {
        RADIUS: 22,
        SPAWN_Y: 340,
        DEFAULT_COLOR: '#c77dff',
        TRAIL_LENGTH: 8,
        POOL_SIZE: 60
    },

    ECONOMY: {
        LAUNCH_COST: 100,
        STARTING_JACKPOT: 5000,
        JACKPOT_CONTRIBUTION_RATE: 0.05,
        CURRENCY_ICON: '💎'
    },

    CAMERA: {
        FOLLOW_ENABLED: true,
        FOLLOW_SMOOTHING: 0.08,
        ZOOM_ON_DROP: 1.05,
        ZOOM_DEFAULT: 1.0,
        ZOOM_SMOOTHING: 0.05
    },

    AUDIO: {
        MASTER_VOLUME: 0.8,
        MAX_SIMULTANEOUS_BOUNCES: 6,
        PEG_HIT_FREQ: 880,
        BUCKET_WIN_FREQ: 440,
        JACKPOT_FREQ: 220
    },

    PARTICLES: {
        POOL_SIZE: 200,
        BURST_COUNT_ON_BUCKET: 18,
        BURST_COUNT_ON_JACKPOT: 60,
        LIFETIME: 0.8,
        GRAVITY: 400
    },

    ANIMATIONS: {
        FLOATING_TEXT_DURATION: 1.2,
        FLOATING_TEXT_RISE: 80,
        BUCKET_FLASH_DURATION: 0.4
    },

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
            }
        }
    },

    BOTS: {
        ENABLED: true,
        SPAWN_INTERVAL_MIN: 4,
        SPAWN_INTERVAL_MAX: 12,
        MAX_ACTIVE_NAMES: 20,
        PERSONALITIES: ['prudent', 'agressif', 'chanceux', 'fidele'],
        NAMES_POOL: [
            'Emma', 'Lea', 'Tom', 'Lucas', 'Chloe', 'Nico',
            'Laura', 'Kevin', 'Jules', 'Sarah', 'Hugo', 'Manon'
        ]
    },

    DEBUG: {
        TOGGLE_KEY: 'd',
        DEFAULT_ENABLED: false,
        SHOW_HITBOX_DEFAULT: false,
        SHOW_VECTORS_DEFAULT: false,
        SHOW_TRAJECTORY_DEFAULT: false
    },

    STORAGE: {
        SAVE_KEY: 'royalDropSaveV3',
        AUTOSAVE_INTERVAL: 15000
    },

    PERFORMANCE: {
        TARGET_FPS: 60,
        MAX_DELTA_TIME: 0.05
    }
};

Object.freeze(CONFIG.PHYSICS.ANTI_STUCK);
