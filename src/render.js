import { RUMBLE_LENGTH, LANES } from './road.js';

/**
 * Perspective projection, one division per point.
 *
 * `scale = cameraDepth / distance` is the whole trick: a thing twice as far
 * away is drawn half as wide. Everything else here is turning that number
 * into pixels.
 */
export function project(p, cameraX, cameraY, cameraZ, cameraDepth, width, height, roadWidth) {
  p.camera.x = (p.world.x || 0) - cameraX;
  p.camera.y = (p.world.y || 0) - cameraY;
  p.camera.z = (p.world.z || 0) - cameraZ;
  p.screen.scale = cameraDepth / p.camera.z;
  p.screen.x = Math.round(width / 2 + (p.screen.scale * p.camera.x * width) / 2);
  p.screen.y = Math.round(height / 2 - (p.screen.scale * p.camera.y * height) / 2);
  p.screen.w = Math.round((p.screen.scale * roadWidth * width) / 2);
}

function polygon(ctx, x1, y1, x2, y2, x3, y3, x4, y4, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.lineTo(x4, y4);
  ctx.closePath();
  ctx.fill();
}

const rumbleWidth = (projectedWidth) => projectedWidth / Math.max(6, 2 * LANES);

/** One slice of road: verge, rumble strips, tarmac. */
export function drawSegment(ctx, width, x1, y1, w1, x2, y2, w2, palette, dark) {
  const r1 = rumbleWidth(w1);
  const r2 = rumbleWidth(w2);
  const shade = dark ? palette.dark : palette.light;

  ctx.fillStyle = shade.verge;
  ctx.fillRect(0, y2, width, y1 - y2);

  polygon(ctx, x1 - w1 - r1, y1, x1 - w1, y1, x2 - w2, y2, x2 - w2 - r2, y2, shade.rumble);
  polygon(ctx, x1 + w1 + r1, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 + r2, y2, shade.rumble);
  polygon(ctx, x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, shade.road);
}

export { RUMBLE_LENGTH };
