import { mulberry32 } from './rng.js';
import { SEGMENT_LENGTH } from './road.js';
import { MAX_SPEED } from './player.js';
import { THEME } from './theme.js';

/**
 * Cars sharing the road.
 *
 * They are not driving — each holds a lane and a speed and never deviates.
 * Anything cleverer would be wasted: the player only ever sees a car for the
 * couple of seconds it takes to catch and pass one, and in that window a
 * constant-velocity obstacle is indistinguishable from a driver.
 */

/** Half the length of a car, in track units, for the overlap test. */
const CAR_DEPTH = SEGMENT_LENGTH * 1.1;
/** How close in lanes counts as the same piece of road. */
const CAR_WIDTH = 0.82;

export function createTraffic(seed, trackLen, count = 34) {
  const rand = mulberry32(seed ^ 0x5f3759df);
  const cars = [];

  for (let i = 0; i < count; i++) {
    cars.push({
      // Spread evenly with jitter, so there is never a convoy or a bare lap.
      z: ((i + rand() * 0.7) / count) * trackLen,
      x: -0.7 + rand() * 1.4,
      speed: MAX_SPEED * (0.32 + rand() * 0.3),
      colors: THEME.traffic[Math.floor(rand() * THEME.traffic.length)],
    });
  }

  return cars;
}

export function updateTraffic(cars, dt, trackLen) {
  for (const car of cars) {
    car.z = (car.z + car.speed * dt) % trackLen;
  }
}

/** Signed distance from a to b on a loop, shortest way round. */
function loopDelta(a, b, trackLen) {
  let d = b - a;
  if (d > trackLen / 2) d -= trackLen;
  if (d < -trackLen / 2) d += trackLen;
  return d;
}

/** The car the player is currently occupying the same space as, if any. */
export function collidingCar(player, cars, trackLen) {
  for (const car of cars) {
    const dz = loopDelta(player.position, car.z, trackLen);
    if (dz > -CAR_DEPTH && dz < CAR_DEPTH && Math.abs(car.x - player.x) < CAR_WIDTH) {
      return car;
    }
  }
  return null;
}

/**
 * Hitting one costs speed and knocks you aside.
 *
 * Deliberately not a crash: an arcade racer that ends your run on contact
 * teaches you to stop overtaking, which is the only interesting thing in it.
 */
export function applyCollision(player, car) {
  player.speed = Math.min(player.speed, car.speed * 0.45);
  player.x += player.x > car.x ? 0.22 : -0.22;
}

/** Which segment each car is sitting on, for the back-to-front draw. */
export function trafficBySegment(cars, segmentCount) {
  const bySegment = new Map();
  for (const car of cars) {
    const index = Math.floor(car.z / SEGMENT_LENGTH) % segmentCount;
    const list = bySegment.get(index);
    if (list) list.push(car);
    else bySegment.set(index, [car]);
  }
  return bySegment;
}
