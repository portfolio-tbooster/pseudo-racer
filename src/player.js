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

/**
 * How hard a corner throws the car outward.
 *
 * Worth doing the arithmetic rather than picking a number that feels right in
 * isolation. Steering moves the car by `dt * 2 * speedPercent`; centrifugal
 * moves it back by that same step times `speedPercent * curve * CENTRIFUGAL`.
 * So the car can only hold a corner while `speedPercent * curve * CENTRIFUGAL`
 * stays under 1 — at 0.24 and a sharpest curve of 5, that is 83% of top speed.
 *
 * Above that the corner is genuinely untakeable and you have to lift, which is
 * the point. Much higher and the track becomes undriveable rather than
 * demanding; much lower and the throttle is the only control that matters.
 */
const CENTRIFUGAL = 0.24;
const OFF_ROAD_DECEL = -MAX_SPEED / 2;
const OFF_ROAD_LIMIT = MAX_SPEED / 4;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function createPlayer() {
  return { position: 0, speed: 0, x: 0 };
}

export function updatePlayer(player, input, dt, trackLen, segment) {
  // Steering authority scales with speed: a stationary car does not turn.
  const steer = dt * 2 * (player.speed / MAX_SPEED);
  if (input.left) player.x -= steer;
  if (input.right) player.x += steer;

  if (input.throttle) player.speed += ACCEL * dt;
  else if (input.brake) player.speed += BRAKING * dt;
  else player.speed += COAST * dt;

  // A corner pushes the car to the outside, harder the faster you take it.
  // This is what makes the track something you drive rather than a corridor
  // you hold a key down in.
  player.speed = clamp(player.speed, 0, MAX_SPEED);
  player.x -= steer * (player.speed / MAX_SPEED) * segment.curve * CENTRIFUGAL;

  // Off the tarmac, scrub off speed down to a crawl. The limit rather than a
  // hard stop is deliberate — a spin that beaches you completely is a reload,
  // and a mistake the player can drive out of is a better mistake.
  player.offRoad = Math.abs(player.x) > 1;
  if (player.offRoad && player.speed > OFF_ROAD_LIMIT) {
    player.speed += OFF_ROAD_DECEL * dt;
  }

  player.speed = clamp(player.speed, 0, MAX_SPEED);
  player.x = clamp(player.x, -2, 2);
  player.position = (player.position + player.speed * dt) % trackLen;
}
