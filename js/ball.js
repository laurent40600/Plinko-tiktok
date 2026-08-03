/* ============================================================
   ROYAL DROP — ball.js
   ------------------------------------------------------------
   Gère la classe Bille sous forme de pool recyclable
   (object pool) pour éviter toute allocation mémoire pendant
   le jeu. Aucune bille n'est jamais "détruite" : elle est
   simplement désactivée puis réutilisée au prochain lancer.
   ============================================================ */

const BallManager = {

    pool: [],
    activeCount: 0,

    /* --------------------------------------------------------
       init()
       Pré-alloue toutes les billes du pool une seule fois.
       -------------------------------------------------------- */
    init() {
        this.pool = [];
        for (let i = 0; i < CONFIG.BALL.POOL_SIZE; i++) {
            this.pool.push(this._createEmptyBall());
        }
        this.activeCount = 0;
    },

    /* --------------------------------------------------------
       _createEmptyBall()
       Structure interne d'une bille (privé au module).
       -------------------------------------------------------- */
    _createEmptyBall() {
        return {
            active: false,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            radius: CONFIG.BALL.RADIUS,
            color: CONFIG.BALL.DEFAULT_COLOR,
            skin: 'default',

            // Métadonnées liées au joueur (réel ou bot)
            playerName: null,
            playerAvatar: null,
            betAmount: 0,
            source: 'local',       // 'local' | 'bot' | 'tiktok'

            // Anti-blocage (utilisé par physics.js)
            stuckTimer: 0,

            // Debug / visuel
            trail: [],
            landed: false,
            id: null
        };
    },

    /* --------------------------------------------------------
       _getFreeBall()
       Retourne une bille inactive du pool, ou null si le pool
       est plein (empêche tout dépassement mémoire).
       -------------------------------------------------------- */
    _getFreeBall() {
        for (const b of this.pool) {
            if (!b.active) return b;
        }
        return null; // pool épuisé : le lancer sera ignoré ou mis en file
    },

    /* --------------------------------------------------------
       spawn(options)
       Active une bille du pool avec les paramètres fournis.
       options : { playerName, playerAvatar, betAmount, source, skin, color }
       Retourne la bille créée, ou null si le pool est plein.
       -------------------------------------------------------- */
    spawn(options = {}) {
        const ball = this._getFreeBall();
        if (!ball) {
            console.warn('[BallManager] Pool de billes épuisé, lancer ignoré.');
            return null;
        }

        ball.active = true;
        ball.x = CONFIG.LOGICAL_WIDTH / 2 + (Math.random() - 0.5) * 16;
        ball.y = CONFIG.BALL.SPAWN_Y;
        ball.vx = (Math.random() - 0.5) * 20;
        ball.vy = 0;
        ball.radius = CONFIG.BALL.RADIUS;
        ball.color = options.color || CONFIG.BALL.DEFAULT_COLOR;
        ball.skin = options.skin || 'default';

        ball.playerName = options.playerName || null;
        ball.playerAvatar = options.playerAvatar || null;
        ball.betAmount = options.betAmount || CONFIG.ECONOMY.LAUNCH_COST;
        ball.source = options.source || 'local';

        ball.stuckTimer = 0;
        ball.trail = [];
        ball.landed = false;
        ball.id = `ball_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

        this.activeCount++;

        EventBus.emit('ball:spawned', ball);

        return ball;
    },

    /* --------------------------------------------------------
       release(ball)
       Désactive une bille et la remet dans le pool disponible.
       -------------------------------------------------------- */
    release(ball) {
        if (!ball || !ball.active) return;
        ball.active = false;
        ball.trail = [];
        this.activeCount = Math.max(0, this.activeCount - 1);
    },

    /* --------------------------------------------------------
       updateAll(dt, pegs)
       Met à jour toutes les billes actives : physique, puis
       vérifie l'arrivée en bucket. Respecte la limite de
       vérifications anti-blocage par frame (perf).
       -------------------------------------------------------- */
    updateAll(dt, pegs) {
        Physics.resetFrameCounters();

        let stuckChecksThisFrame = 0;
        const maxChecks = CONFIG.PHYSICS.ANTI_STUCK.MAX_STUCK_CHECKS_PER_FRAME;

        for (const ball of this.pool) {
            if (!ball.active || ball.landed) continue;

            Physics.step(ball, dt, pegs);
            stuckChecksThisFrame++;

            // Vérifie si la bille a atteint la zone des buckets
            if (Board.isInBucketZone(ball.y)) {
                this._handleBucketLanding(ball);
            }

            // Sécurité : évite de surcharger une frame si énormément
            // de billes sont actives simultanément (perf).
            if (stuckChecksThisFrame >= maxChecks) {
                break;
            }
        }
    },

    /* --------------------------------------------------------
       _handleBucketLanding(ball)
       Détermine dans quel bucket la bille est tombée, calcule
       le gain, déclenche les effets (son, particules, texte),
       met à jour les statistiques, puis libère la bille.
       -------------------------------------------------------- */
    _handleBucketLanding(ball) {
        const bucketIndex = Board.getBucketIndexFromX(ball.x);
        const multiplier = CONFIG.BUCKETS.VALUES[bucketIndex] ?? 1;
        const winAmount = Math.round(ball.betAmount * multiplier);
        const isJackpot = bucketIndex === CONFIG.BUCKETS.JACKPOT_INDEX;

        ball.landed = true;

        EventBus.emit('ball:landed', {
            ball,
            bucketIndex,
            multiplier,
            winAmount,
            isJackpot
        });

        this.release(ball);
    },

    /* --------------------------------------------------------
       getActiveBalls()
       Retourne la liste des billes actuellement actives.
       Utile pour renderer.js et le mode debug.
       -------------------------------------------------------- */
    getActiveBalls() {
        return this.pool.filter(b => b.active);
    },

    /* --------------------------------------------------------
       reset()
       Désactive toutes les billes (changement de thème, reset).
       -------------------------------------------------------- */
    reset() {
        for (const b of this.pool) {
            b.active = false;
            b.trail = [];
        }
        this.activeCount = 0;
    }
};
