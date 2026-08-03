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
        this.pegs = this._generatePegs();
        this.bucketZones = this._generateBucketZones();
        this.latticeLines = this._generateLatticeLines();
    }

    _generatePegs() {
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
    }

    /** Segments décoratifs reliant chaque picot à ses voisins diagonaux. */
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
    }

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
