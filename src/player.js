import { SEGMENT_LENGTH } from './road.js';

/**
 * The car's state and how input moves it.
 *
 * Every rate here is per second and multiplied by the frame delta, so the
 * handling is identical on a 60Hz laptop and a 144Hz monitor. Tying any of it
 * to frames is the classic way to ship a game that is unplayably fast on
 * hardware you did not own.
 */

/** One segment per frame at 60fps — the speed the road was designed around. */
export const MAX_SPEED = SEGMENT_LENGTH * 60;

const ACCEL = MAX_SPEED / 5;
const BRAKING = -MAX_SPEED;
const COAST = -MAX_SPEED / 5;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function createPlayer() {
  return { position: 0, speed: 0, x: 0 };
}

export function updatePlayer(player, input, dt, trackLen) {
  // Steering authority scales with speed: a stationary car does not turn.
  const steer = dt * 2 * (player.speed / MAX_SPEED);
  if (input.left) player.x -= steer;
  if (input.right) player.x += steer;

  if (input.throttle) player.speed += ACCEL * dt;
  else if (input.brake) player.speed += BRAKING * dt;
  else player.speed += COAST * dt;

  player.speed = clamp(player.speed, 0, MAX_SPEED);
  player.x = clamp(player.x, -2, 2);
  player.position = (player.position + player.speed * dt) % trackLen;
}
