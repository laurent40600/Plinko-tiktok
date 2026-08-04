/* ============================================================
   ROYAL DROP — render/balls.js
   ------------------------------------------------------------
   Dessine la traînée puis le corps de chaque bille active.
   En mode debug, superpose hitbox et vecteur de vélocité.
   ============================================================ */

export function drawBallTrails(ctx, balls, showDebugTrajectory) {
    for (const ball of balls) {
        if (!ball.trail || ball.trail.length < 2) continue;

        ctx.save();
        ctx.strokeStyle = showDebugTrajectory ? 'rgba(0,255,0,0.8)' : `${ball.color}55`;
        ctx.lineWidth = showDebugTrajectory ? 2 : 4;
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
        const grad = ctx.createRadialGradient(
            ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, 2,
            ball.x, ball.y, ball.radius
        );
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, ball.color);
        grad.addColorStop(1, '#000000aa');

        ctx.save();
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

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
