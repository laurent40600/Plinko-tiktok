/* ============================================================
   ROYAL DROP — render/balls.js
   ------------------------------------------------------------
   Dessine la traînée puis le corps de chaque bille active. Une
   bille appartient toujours à un viewer : elle porte sa couleur
   de cadeau, un halo, un symbole, et un badge pseudo temporaire
   au-dessus d'elle. En mode debug, superpose hitbox et vecteur
   de vélocité.
   ============================================================ */

export function drawBallTrails(ctx, balls, showDebugTrajectory) {
    for (const ball of balls) {
        if (!ball.trail || ball.trail.length < 2) continue;

        const intensity = ball.trailIntensity || 1;
        ctx.save();
        ctx.strokeStyle = showDebugTrajectory ? 'rgba(0,255,0,0.8)' : `${ball.color}55`;
        ctx.lineWidth = showDebugTrajectory ? 2 : 3 + intensity * 2;
        ctx.lineCap = 'round';
        if (!showDebugTrajectory && ball.glowColor) {
            ctx.shadowColor = ball.glowColor;
            ctx.shadowBlur = 6 * intensity;
        }
        ctx.beginPath();
        ctx.moveTo(ball.trail[0].x, ball.trail[0].y);
        for (let i = 1; i < ball.trail.length; i++) {
            ctx.lineTo(ball.trail[i].x, ball.trail[i].y);
        }
        ctx.stroke();
        ctx.restore();
    }
}

export function drawBalls(ctx, balls, { showHitbox = false, showVectors = false } = {}) {
    for (const ball of balls) {
        const intensity = ball.trailIntensity || 1;

        ctx.save();

        if (ball.glowColor) {
            ctx.shadowColor = ball.glowColor;
            ctx.shadowBlur = 14 * intensity;
        }

        const grad = ctx.createRadialGradient(
            ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, 2,
            ball.x, ball.y, ball.radius
        );
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, ball.color);
        grad.addColorStop(1, '#000000aa');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();

        if (ball.glowColor && intensity > 1.2) {
            // Halo rare/légendaire supplémentaire, en plus du glow shadow.
            ctx.strokeStyle = ball.glowColor;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
        ctx.restore();

        if (ball.symbol) {
            ctx.save();
            ctx.font = `${Math.round(ball.radius * 1.1)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(ball.symbol, ball.x, ball.y);
            ctx.restore();
        }

        if (ball.playerName) {
            ctx.save();
            ctx.font = '600 18px Segoe UI, Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.lineJoin = 'round';
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(10, 4, 20, 0.85)';
            const label = `@${ball.playerName}`;
            ctx.strokeText(label, ball.x, ball.y - ball.radius - 8);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(label, ball.x, ball.y - ball.radius - 8);
            ctx.restore();
        }

        if (showHitbox) {
            ctx.save();
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        if (showVectors) {
            ctx.save();
            ctx.strokeStyle = '#ff0066';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(ball.x, ball.y);
            ctx.lineTo(ball.x + ball.vx * 0.15, ball.y + ball.vy * 0.15);
            ctx.stroke();
            ctx.restore();
        }
    }
}
