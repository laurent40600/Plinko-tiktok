/* ============================================================
   ROYAL DROP — systems/gameFeel.js
   ------------------------------------------------------------
   Réactions sonores/visuelles aux événements de jeu (rebonds,
   atterrissages). Séparé de players.js à dessein : ce module ne
   sait pas QUI a lancé la bille, juste comment réagir au coup.
   ============================================================ */

import { CONFIG } from '../core/config.js';

/**
 * @param {object} deps
 * @param {import('../core/events.js').eventBus} deps.eventBus
 * @param {import('./audio.js').AudioEngine} deps.audio
 * @param {import('./particles.js').ParticleSystem} deps.particles
 * @param {import('../entities/board.js').Board} deps.board
 */
export function wireGameFeel({ eventBus, audio, particles, board }) {
    eventBus.on('physics:pegHit', ({ intensity }) => {
        audio.playPegHit(intensity);
    });

    eventBus.on('ball:landed', ({ ball, bucketIndex, winAmount, multiplier, isJackpot }) => {
        const zone = board.getBucketZone(bucketIndex);
        const bucketY = CONFIG.LOGICAL_HEIGHT - CONFIG.BUCKETS.HEIGHT - (CONFIG.BUCKETS.BOTTOM_OFFSET - 70);
        const bucketX = zone ? (zone.xStart + zone.xEnd) / 2 : ball.x;

        if (isJackpot) {
            audio.playJackpot();
            particles.burst(bucketX, bucketY, CONFIG.PARTICLES.BURST_COUNT_ON_JACKPOT, '#ffd76a');
            particles.spawnFloatingText(bucketX, bucketY, `JACKPOT! +${winAmount}`, '#ffd76a', 48);
            eventBus.emit('game:jackpotWon', { winAmount, playerName: ball.playerName });
        } else {
            audio.playBucketWin(multiplier);
            particles.burst(bucketX, bucketY, CONFIG.PARTICLES.BURST_COUNT_ON_BUCKET, zone?.color || '#fff');
            particles.spawnFloatingText(bucketX, bucketY, `+${winAmount}`, '#ffffff', 34);
        }
    });
}
