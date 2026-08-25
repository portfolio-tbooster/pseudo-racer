import { mulberry32 } from './rng.js';
import { SEGMENT_LENGTH, CAR_WIDTH, CAR_HALF_LENGTH, PLAYER_Z, TRAFFIC_LANES } from './road.js';
import { MAX_SPEED } from './player.js';
import { THEME } from './theme.js';

/**
 * Cars sharing the road.
 *
 * Each car holds a lane and a cruising speed, and does exactly one clever
 * thing: it looks at what is directly in front of it. Without that, a faster
 * car simply drives through a slower one in the same lane — which the player
 * sees constantly, because catching up to traffic is how they spend the lap.
 *
 * It changes lane if there is room and slows down if there is not. That is the
 * whole of it; anything more would be invisible at the speed these are passed.
 */

export function createTraffic(seed, trackLen, count = 24) {
  const rand = mulberry32(seed ^ 0x5f3759df);
  const cars = [];

  for (let i = 0; i < count; i++) {
    const cruise = MAX_SPEED * (0.32 + rand() * 0.3);
    const lane = TRAFFIC_LANES[Math.floor(rand() * TRAFFIC_LANES.length)];
    cars.push({
      cruise,
      // Spread evenly with jitter, so there is never a convoy or a bare lap.
      z: ((i + rand() * 0.7) / count) * trackLen,
      // A lane, not a random offset. Cars scattered anywhere across the road
      // leave no gap wide enough to overtake through.
      x: lane,
      lane,
      speed: cruise,
      colors: THEME.traffic[Math.floor(rand() * THEME.traffic.length)],
      kind: THEME.vehicles[Math.floor(rand() * THEME.vehicles.length)],
    });
  }

  return cars;
}

/** How far ahead a car looks before it reacts. */
const LOOK_AHEAD = CAR_HALF_LENGTH * 4;

export function updateTraffic(cars, dt, trackLen) {
  for (const car of cars) {
    const arriving = Math.abs(car.x - car.lane) > 0.005;

    if (arriving) {
      // A manoeuvre already begun is always finished. Re-deciding every frame
      // lets a car stop halfway — far enough sideways that the blocker no
      // longer counts — and traffic ends up strewn across the road with no gap
      // wide enough to overtake through.
      car.x += Math.sign(car.lane - car.x) * Math.min(Math.abs(car.lane - car.x), dt * 0.9);
    } else {
      car.x = car.lane;
      const ahead = nearestAhead(car, cars, trackLen);

      if (ahead) {
        const escape = TRAFFIC_LANES.find(
          (lane) => lane !== car.lane && laneIsClear(car, cars, lane, trackLen),
        );

        if (escape !== undefined) car.lane = escape;
        // Boxed in — tuck in behind at the speed of the car in front.
        else car.speed += (ahead.speed * 0.95 - car.speed) * Math.min(1, dt * 3);
      } else if (car.speed < car.cruise) {
        car.speed += (car.cruise - car.speed) * Math.min(1, dt * 0.8);
      }
    }

    car.z = (car.z + car.speed * dt) % trackLen;
  }
}

/** The closest car in front of this one, in its lane, within looking distance. */
function nearestAhead(car, cars, trackLen) {
  let best = null;
  let bestGap = Infinity;

  for (const other of cars) {
    if (other === car) continue;
    const dz = loopDelta(car.z, other.z, trackLen);
    if (dz <= 0 || dz > LOOK_AHEAD) continue;
    if (Math.abs(other.x - car.x) >= CAR_WIDTH) continue;
    if (dz < bestGap) {
      bestGap = dz;
      best = other;
    }
  }

  return best;
}

/** Is there space in `lane`, both in front and behind, to move across? */
function laneIsClear(car, cars, lane, trackLen) {
  for (const other of cars) {
    if (other === car) continue;
    if (Math.abs(other.x - lane) >= CAR_WIDTH) continue;
    const dz = loopDelta(car.z, other.z, trackLen);
    if (dz > -CAR_HALF_LENGTH * 2 && dz < LOOK_AHEAD) return false;
  }
  return true;
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
  // Tested where the car actually is — a fixed distance ahead of the camera —
  // not at the camera itself.
  const nose = player.position + PLAYER_Z;

  for (const car of cars) {
    const dz = loopDelta(nose, car.z, trackLen);
    const overlapping = dz > -CAR_HALF_LENGTH && dz < CAR_HALF_LENGTH;
    // Two half-widths: they touch when their centres are one car-width apart.
    if (overlapping && Math.abs(car.x - player.x) < CAR_WIDTH) return car;
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

  // Shoved fully clear, not nudged. A knock smaller than the collision box
  // leaves the two cars still overlapping on the next frame, so contact
  // repeats every frame until something drifts apart — which feels like being
  // held against the car rather than bouncing off it.
  const side = player.x >= car.x ? 1 : -1;
  player.x = car.x + side * CAR_WIDTH * 1.08;
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
