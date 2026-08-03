/* ============================================================
   ROYAL DROP — particles.js
   ------------------------------------------------------------
   Système de particules avec object pool (recyclage).
   Aucune allocation mémoire pendant le jeu : toutes les
   particules sont pré-créées puis réutilisées.

   Deux types gérés ici :
   - particules visuelles (étincelles, confettis)
   - textes flottants (ex: "+500", "JACKPOT!")
   ============================================================ */

const ParticleSystem = {

    pool: [],           // pool de particules recyclables
    activeCount: 0,

    textPool: [],       // pool de textes flottants recyclables
    activeTextCount: 0,

    /* --------------------------------------------------------
       init()
       Pré-alloue toutes les particules et textes flottants
       une seule fois au démarrage du jeu.
       -------------------------------------------------------- */
    init() {
        this.pool = [];
        for (let i = 0; i < CONFIG.PARTICLES.POOL_SIZE; i++) {
            this.pool.push(this._createEmptyParticle());
        }

        this.textPool = [];
        for (let i = 0; i < 40; i++) {
            this.textPool.push(this._createEmptyFloatingText());
        }
    },

    /* --------------------------------------------------------
       _createEmptyParticle()
       Structure interne d'une particule (privé au module).
       -------------------------------------------------------- */
    _createEmptyParticle() {
        return {
            active: false,
            x: 0, y: 0,
            vx: 0, vy: 0,
            radius: 0,
            color: '#fff',
            life: 0,
            maxLife: 1,
            alpha: 1
        };
    },

    /* --------------------------------------------------------
       _createEmptyFloatingText()
       Structure interne d'un texte flottant (privé au module).
       -------------------------------------------------------- */
    _createEmptyFloatingText() {
        return {
            active: false,
            x: 0, y: 0,
            text: '',
            color: '#fff',
            life: 0,
            maxLife: 1,
            alpha: 1,
            fontSize: 32
        };
    },

    /* --------------------------------------------------------
       _getFreeParticle()
       Retourne une particule inactive du pool, ou null si le
       pool est plein (évite tout dépassement mémoire).
       -------------------------------------------------------- */
    _getFreeParticle() {
        for (const p of this.pool) {
            if (!p.active) return p;
        }
        return null;
    },

    /* --------------------------------------------------------
       _getFreeText()
       Retourne un texte flottant inactif du pool.
       -------------------------------------------------------- */
    _getFreeText() {
        for (const t of this.textPool) {
            if (!t.active) return t;
        }
        return null;
    },

    /* --------------------------------------------------------
       burst(x, y, count, color)
       Déclenche une explosion de particules à une position
       donnée (utilisé sur impact de bucket, picot, jackpot).
       -------------------------------------------------------- */
    burst(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            const p = this._getFreeParticle();
            if (!p) break; // pool épuisé, on ignore silencieusement

            const angle = Math.random() * Math.PI * 2;
            const speed = 150 + Math.random() * 250;

            p.active = true;
            p.x = x;
            p.y = y;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed - 100; // léger boost vers le haut
            p.radius = 3 + Math.random() * 4;
            p.color = color;
            p.life = 0;
            p.maxLife = CONFIG.PARTICLES.LIFETIME * (0.7 + Math.random() * 0.6);
            p.alpha = 1;

            this.activeCount++;
        }
    },

    /* --------------------------------------------------------
       spawnFloatingText(x, y, text, color, fontSize)
       Fait apparaître un texte flottant recyclé (ex: gains).
       -------------------------------------------------------- */
    spawnFloatingText(x, y, text, color = '#ffd76a', fontSize = 36) {
        const t = this._getFreeText();
        if (!t) return;

        t.active = true;
        t.x = x;
        t.y = y;
        t.text = text;
        t.color = color;
        t.life = 0;
        t.maxLife = CONFIG.ANIMATIONS.FLOATING_TEXT_DURATION;
        t.alpha = 1;
        t.fontSize = fontSize;

        this.activeTextCount++;
    },

    /* --------------------------------------------------------
       update(dt)
       Met à jour toutes les particules et textes actifs.
       Recycle automatiquement ceux dont la durée de vie
       est écoulée (aucune suppression, juste active = false).
       -------------------------------------------------------- */
    update(dt) {
        // --- Particules ---
        for (const p of this.pool) {
            if (!p.active) continue;

            p.life += dt;
            if (p.life >= p.maxLife) {
                p.active = false;
                this.activeCount--;
                continue;
            }

            p.vy += CONFIG.PARTICLES.GRAVITY * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.alpha = 1 - (p.life / p.maxLife);
        }

        // --- Textes flottants ---
        for (const t of this.textPool) {
            if (!t.active) continue;

            t.life += dt;
            if (t.life >= t.maxLife) {
                t.active = false;
                this.activeTextCount--;
                continue;
            }

            const progress = t.life / t.maxLife;
            t.y -= (CONFIG.ANIMATIONS.FLOATING_TEXT_RISE * dt) / t.maxLife;
            t.alpha = 1 - progress;
        }
    },

    /* --------------------------------------------------------
       render(ctx)
       Dessine toutes les particules et textes actifs.
       Appelé par renderer.js à chaque frame.
       -------------------------------------------------------- */
    render(ctx) {
        // --- Particules ---
        for (const p of this.pool) {
            if (!p.active) continue;

            ctx.save();
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // --- Textes flottants ---
        for (const t of this.textPool) {
            if (!t.active) continue;

            ctx.save();
            ctx.globalAlpha = Math.max(0, t.alpha);
            ctx.fillStyle = t.color;
            ctx.font = `900 ${t.fontSize}px Segoe UI, Arial, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0,0,0,0.6)';
            ctx.shadowBlur = 6;
            ctx.fillText(t.text, t.x, t.y);
            ctx.restore();
        }
    },

    /* --------------------------------------------------------
       reset()
       Désactive toutes les particules et textes (utile en
       cas de changement de thème ou de reset complet).
       -------------------------------------------------------- */
    reset() {
        for (const p of this.pool) p.active = false;
        for (const t of this.textPool) t.active = false;
        this.activeCount = 0;
        this.activeTextCount = 0;
    }
};
