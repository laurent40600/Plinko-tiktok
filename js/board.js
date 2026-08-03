/* ============================================================
   ROYAL DROP — board.js
   ------------------------------------------------------------
   Génère la géométrie du plateau : disposition des picots en
   quinconce et zones des buckets multiplicateurs en bas.
   Fournit aussi les utilitaires de détection (zone bucket,
   index du bucket touché) utilisés par ball.js et physics.js.
   ============================================================ */

const Board = {

    pegs: [],
    bucketZones: [], // { index, xStart, xEnd, value, color }
    latticeLines: [], // [{x1,y1,x2,y2}, ...] — liaisons diagonales décoratives entre picots

    /* --------------------------------------------------------
       init()
       Génère les picots et les zones de buckets une seule fois
       au démarrage (ou après un changement de configuration).
       -------------------------------------------------------- */
    init() {
        this.pegs = this.generatePegs();
        this.bucketZones = this._generateBucketZones();
        this.latticeLines = this._generateLatticeLines();
    },

    /* --------------------------------------------------------
       generatePegs()
       Construit la grille de picots en quinconce (rangées
       décalées une sur deux) à partir de config.js.
       Retourne un tableau de { x, y }.
       -------------------------------------------------------- */
    generatePegs() {
        const B = CONFIG.BOARD;
        const pegs = [];

        const playWidth = CONFIG.LOGICAL_WIDTH - (B.BOARD_MARGIN_X * 2);
        const pegsPerRow = Math.floor(playWidth / B.PEG_SPACING_X);

        for (let row = 0; row < B.ROWS; row++) {
            const isOffsetRow = row % 2 === 1;
            const rowPegCount = isOffsetRow ? pegsPerRow - 1 : pegsPerRow;
            const rowWidth = (rowPegCount - 1) * B.PEG_SPACING_X;
            const startX = (CONFIG.LOGICAL_WIDTH - rowWidth) / 2;

            for (let col = 0; col < rowPegCount; col++) {
                pegs.push({
                    x: startX + col * B.PEG_SPACING_X,
                    y: B.BOARD_TOP_Y + row * B.PEG_SPACING_Y
                });
            }
        }

        return pegs;
    },

    /* --------------------------------------------------------
       _generateLatticeLines()
       Précalcule les segments décoratifs reliant chaque picot à
       ses voisins diagonaux de la rangée suivante (motif en
       losanges visible en fond du plateau de référence).
       -------------------------------------------------------- */
    _generateLatticeLines() {
        const B = CONFIG.BOARD;
        const maxDx = B.PEG_SPACING_X * 0.6;
        const maxDy = B.PEG_SPACING_Y * 1.15;
        const lines = [];

        for (const a of this.pegs) {
            for (const b of this.pegs) {
                const dy = b.y - a.y;
                if (dy <= 0 || dy > maxDy) continue;
                const dx = Math.abs(b.x - a.x);
                if (dx > maxDx) continue;
                lines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
            }
        }
        return lines;
    },

    /* --------------------------------------------------------
       _generateBucketZones()
       Découpe la largeur logique en zones égales, une par
       valeur de multiplicateur définie dans config.js.
       -------------------------------------------------------- */
    _generateBucketZones() {
        const values = CONFIG.BUCKETS.VALUES;
        const colors = CONFIG.BUCKETS.COLORS;
        const count = values.length;

        const marginX = CONFIG.BOARD.BOARD_MARGIN_X * 0.4;
        const usableWidth = CONFIG.LOGICAL_WIDTH - (marginX * 2);
        const zoneWidth = usableWidth / count;

        const zones = [];
        for (let i = 0; i < count; i++) {
            zones.push({
                index: i,
                xStart: marginX + i * zoneWidth,
                xEnd: marginX + (i + 1) * zoneWidth,
                value: values[i],
                color: colors[i] || '#ffffff'
            });
        }
        return zones;
    },

    /* --------------------------------------------------------
       isInBucketZone(y)
       Indique si une coordonnée Y a atteint la zone des buckets
       (bas du plateau). Utilisé par ball.js pour détecter
       l'arrivée d'une bille.
       -------------------------------------------------------- */
    isInBucketZone(y) {
        const bucketTopY = CONFIG.LOGICAL_HEIGHT - CONFIG.BUCKETS.HEIGHT - (CONFIG.BUCKETS.BOTTOM_OFFSET + 60);
        return y >= bucketTopY;
    },

    /* --------------------------------------------------------
       getBucketIndexFromX(x)
       Retourne l'index du bucket correspondant à une position
       horizontale donnée. Clamp aux bords si hors limites.
       -------------------------------------------------------- */
    getBucketIndexFromX(x) {
        for (const zone of this.bucketZones) {
            if (x >= zone.xStart && x < zone.xEnd) {
                return zone.index;
            }
        }
        // Clamp : si la bille sort légèrement du cadre, on la
        // rattache au bucket le plus proche (gauche ou droite)
        if (x < this.bucketZones[0]?.xStart) return 0;
        return this.bucketZones.length - 1;
    },

    /* --------------------------------------------------------
       getBucketZone(index)
       Retourne les infos complètes d'un bucket (utile pour
       le rendu et les effets visuels).
       -------------------------------------------------------- */
    getBucketZone(index) {
        return this.bucketZones[index] || null;
    },

    /* --------------------------------------------------------
       regenerate()
       Régénère picots et buckets (ex: après un redimensionnement
       majeur de config, ou changement de thème avec géométrie
       différente).
       -------------------------------------------------------- */
    regenerate() {
        this.pegs = this.generatePegs();
        this.bucketZones = this._generateBucketZones();
    }
};
