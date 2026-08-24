import { THEME } from './theme.js';

/**
 * A car from behind, drawn from plain shapes.
 *
 * One routine for the player and for traffic — they are the same object at
 * different sizes, and the day they diverge is the day the traffic stops
 * looking like it belongs on the same road.
 */
export function drawCarAt(ctx, cx, groundY, w, colors) {
  const h = w * 0.52;
  const cy = groundY - h * 0.55;

  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(cx, groundY, w * 0.5, h * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();

  const wheel = (dx) => {
    ctx.fillStyle = '#15181c';
    ctx.fillRect(cx + dx - w * 0.09, cy + h * 0.08, w * 0.18, h * 0.38);
  };
  wheel(-w * 0.4);
  wheel(w * 0.4);

  ctx.fillStyle = colors.shell;
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, cy - h * 0.18, w, h * 0.62, w * 0.07);
  ctx.fill();

  ctx.beginPath();
  ctx.roundRect(cx - w * 0.33, cy - h * 0.52, w * 0.66, h * 0.4, w * 0.06);
  ctx.fill();

  ctx.fillStyle = colors.glass;
  ctx.beginPath();
  ctx.roundRect(cx - w * 0.27, cy - h * 0.46, w * 0.54, h * 0.26, w * 0.04);
  ctx.fill();

  ctx.fillStyle = colors.lamp;
  ctx.fillRect(cx - w * 0.44, cy + h * 0.04, w * 0.16, h * 0.1);
  ctx.fillRect(cx + w * 0.28, cy + h * 0.04, w * 0.16, h * 0.1);
}

export function drawPlayerCar(ctx, width, height, steer, bounce, w) {
  drawCarAt(ctx, width / 2 + steer * w * 0.35, height - w * 0.14 + bounce, w, THEME.car);
}
