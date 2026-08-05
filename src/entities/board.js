/* ============================================================
   ROYAL DROP — entities/board.js
   ------------------------------------------------------------
   Géométrie pure du plateau : grille de picots en quinconce,
   zones des buckets, et le maillage décoratif en losanges qui
   les relie. Ne dessine rien (voir render/board.js) et ne
   connaît rien de la physique : juste des positions.
   ============================================================ */

import { CONFIG } from '../core/config.js';

export class Board {
    pegs = [];
    bucketZones = []; // { index, xStart, xEnd, value, color }
    latticeLines = []; // [{x1,y1,x2,y2}, ...]

    generate() {
        // Les buckets d'abord : les colonnes de picots se calent dessus
        // (une colonne par multiplicateur, sur toute la largeur du plateau
        // — comme sur la référence, pas de vide sur les côtés).
        this.bucketZones = this._generateBucketZones();
        this.pegs = this._generatePegs();
        this.latticeLines = this._generateLatticeLines();
    }

    _generatePegs() {
        const B = CONFIG.BOARD;
        const pegs = [];

        // Une colonne par bucket, mais RECADRÉE avec une marge de sécurité
        // vis-à-vis des murs : un picot collé au mur crée une zone de
        // collision qui chevauche celle du mur (bille+picot+mur trop
        // proches), ce qui peut coincer la bille en boucle infinie de
        // rebonds. safeClearance garantit qu'un picot ne peut jamais
        // toucher un mur en même temps qu'une bille.
        const safeClearance = CONFIG.BALL.RADIUS + B.PEG_RADIUS + 20;
        const minX = B.MARGIN_X + safeClearance;
        const maxX = CONFIG.LOGICAL_WIDTH - B.MARGIN_X - safeClearance;

        const bucketCount = this.bucketZones.length;
        const centerCols = this.bucketZones.map((_, i) => {
            const t = bucketCount > 1 ? i / (bucketCount - 1) : 0.5;
            return minX + t * (maxX - minX);
        });

        // Colonnes "décalées" : aux milieux entre colonnes centrées,
        // pour l'alternance en quinconce classique d'un plateau Plinko.
        const offsetCols = [];
        for (let i = 0; i < centerCols.length - 1; i++) {
            offsetCols.push((centerCols[i] + centerCols[i + 1]) / 2);
        }

        // Écart réel entre colonnes adjacentes, pour le maillage décoratif
        // (les colonnes dérivent des buckets, plus de la constante fixe).
        this._colSpacing = centerCols.length > 1 ? centerCols[1] - centerCols[0] : 0;

        for (let row = 0; row < B.ROWS; row++) {
            const cols = row % 2 === 1 ? offsetCols : centerCols;
            const y = B.BOARD_TOP_Y + row * B.PEG_SPACING_Y;
            for (const x of cols) {
                pegs.push({ x, y });
            }
        }
        return pegs;
    }

    /** Segments décoratifs reliant chaque picot à ses voisins diagonaux. */
    _generateLatticeLines() {
        const B = CONFIG.BOARD;
        const maxDx = (this._colSpacing || B.PEG_SPACING_X) * 0.6;
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
    }

    _generateBucketZones() {
        const values = CONFIG.BUCKETS.VALUES;
        const colors = CONFIG.BUCKETS.COLORS;
        const count = values.length;

        const marginX = CONFIG.BOARD.MARGIN_X;
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
    }

    /** true si une bille à cette hauteur Y a atteint la zone des buckets. */
    isInBucketZone(y) {
        const bucketTopY = CONFIG.LOGICAL_HEIGHT - CONFIG.BUCKETS.HEIGHT - (CONFIG.BUCKETS.BOTTOM_OFFSET + 60);
        return y >= bucketTopY;
    }

    getBucketIndexFromX(x) {
        for (const zone of this.bucketZones) {
            if (x >= zone.xStart && x < zone.xEnd) {
                return zone.index;
            }
        }
        if (x < this.bucketZones[0]?.xStart) return 0;
        return this.bucketZones.length - 1;
    }

    getBucketZone(index) {
        return this.bucketZones[index] || null;
    }
}
