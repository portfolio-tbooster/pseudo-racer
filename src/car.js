import { THEME } from './theme.js';

/**
 * The car, drawn from behind out of plain shapes.
 *
 * No sprite sheet and nothing to load. It leans with the steering and bobs
 * with the road, which is most of what sells the motion — a rigid car on a
 * moving road reads as a bug.
 */
export function drawCar(ctx, width, height, steer, bounce) {
  const w = Math.min(width * 0.24, height * 0.42);
  const h = w * 0.52;
  const cx = width / 2 + steer * w * 0.35;
  const cy = height - h * 0.75 + bounce;

  const body = THEME.car;

  // Shadow first, so the car sits on the road rather than floats over it.
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + h * 0.46, w * 0.5, h * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();

  const wheel = (dx) => {
    ctx.fillStyle = '#15181c';
    ctx.fillRect(cx + dx - w * 0.09, cy + h * 0.08, w * 0.18, h * 0.38);
  };
  wheel(-w * 0.4);
  wheel(w * 0.4);

  // Body.
  ctx.fillStyle = body.shell;
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, cy - h * 0.18, w, h * 0.62, w * 0.07);
  ctx.fill();

  // Cabin.
  ctx.fillStyle = body.shell;
  ctx.beginPath();
  ctx.roundRect(cx - w * 0.33, cy - h * 0.52, w * 0.66, h * 0.4, w * 0.06);
  ctx.fill();

  ctx.fillStyle = body.glass;
  ctx.beginPath();
  ctx.roundRect(cx - w * 0.27, cy - h * 0.46, w * 0.54, h * 0.26, w * 0.04);
  ctx.fill();

  ctx.fillStyle = body.lamp;
  ctx.fillRect(cx - w * 0.44, cy + h * 0.04, w * 0.16, h * 0.1);
  ctx.fillRect(cx + w * 0.28, cy + h * 0.04, w * 0.16, h * 0.1);
}
