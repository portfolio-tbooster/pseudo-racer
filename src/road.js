/**
 * The road, as a list of segments.
 *
 * There is no 3D here and never will be. A segment is a slice of road at a
 * known distance, and drawing it is a matter of working out how wide it looks
 * from where the camera is standing — which is one division.
 */

export const SEGMENT_LENGTH = 200;
export const RUMBLE_LENGTH = 3;
export const ROAD_WIDTH = 2000; // half-width, so the road spans -1 to 1 in x
export const LANES = 3;

/**
 * A car's width, as a fraction of ROAD_WIDTH — about two thirds of a lane.
 *
 * This single number drives both how a car is *drawn* and when two of them
 * *touch*. They were separate constants once and drifted apart, which is the
 * only way to get a game where you collide with cars you can see you missed.
 */
export const CAR_WIDTH = 0.42;

/** Half a car's length, in track units, for the overlap test. */
export const CAR_HALF_LENGTH = 700;

/**
 * How far in front of the camera the player's car sits.
 *
 * The camera rides behind the car, so the player is an object in the world at
 * a fixed distance, not a sprite pinned to the bottom of the screen. Getting
 * this wrong is what made oncoming traffic eleven times the size of the car
 * you were driving: collisions were tested at the camera while the player was
 * drawn as though eight segments further down the road.
 */
export const PLAYER_Z = 1600;

/** Traffic holds one of three lanes, far enough apart to drive between. */
export const TRAFFIC_LANES = [-0.62, 0, 0.62];

import { mulberry32 } from './rng.js';

const point = (x, y, z) => ({ world: { x, y, z }, camera: {}, screen: {} });

export const lastY = (segments) =>
  segments.length === 0 ? 0 : segments[segments.length - 1].p2.world.y;

export function addSegment(segments, curve, y) {
  const n = segments.length;
  segments.push({
    index: n,
    curve,
    p1: point(0, lastY(segments), n * SEGMENT_LENGTH),
    p2: point(0, y, (n + 1) * SEGMENT_LENGTH),
    // Alternating bands every few segments are what make speed legible; with
    // one flat colour the road reads as a static triangle.
    dark: Math.floor(n / RUMBLE_LENGTH) % 2 === 1,
  });
}

/**
 * Ease each section in and out rather than snapping to it.
 *
 * A curve that arrives at full strength on one segment is a corner you cannot
 * drive; easing is what turns a list of numbers into a road.
 */
const easeIn = (a, b, t) => a + (b - a) * t * t;
const easeInOut = (a, b, t) => a + (b - a) * (0.5 - Math.cos(t * Math.PI) / 2);

/** One stretch of road: `enter` easing in, `hold` at full, `leave` easing out. */
export function addStretch(segments, enter, hold, leave, curve, height) {
  const startY = lastY(segments);
  const endY = startY + height * SEGMENT_LENGTH;
  const total = enter + hold + leave;

  for (let n = 0; n < enter; n++) {
    addSegment(segments, easeIn(0, curve, n / enter), easeInOut(startY, endY, n / total));
  }
  for (let n = 0; n < hold; n++) {
    addSegment(segments, curve, easeInOut(startY, endY, (enter + n) / total));
  }
  for (let n = 0; n < leave; n++) {
    addSegment(segments, easeInOut(curve, 0, n / leave), easeInOut(startY, endY, (enter + hold + n) / total));
  }
}

/**
 * A circuit from a seed.
 *
 * Sections are sampled rather than sequenced, and the track always closes with
 * a flat straight so the loop point is not a cliff — the last segment sits
 * next to the first one forever.
 */
export function buildTrack(seed, sections = 22) {
  const rand = mulberry32(seed);
  const segments = [];
  const pick = (list) => list[Math.floor(rand() * list.length)];

  addStretch(segments, 40, 40, 40, 0, 0); // start line: flat and straight

  // Elevation is a random walk, and a random walk wanders. Left alone it
  // drifts hundreds of segments off and the closing stretch has to climb a
  // cliff to get back. Biasing each choice against the current drift keeps the
  // circuit undulating instead of descending into the earth.
  const CEILING = 60; // segments of elevation either side of the start

  for (let n = 0; n < sections; n++) {
    const length = pick([[20, 40, 20], [30, 70, 30], [50, 120, 50]]);
    const curve = pick([0, 0, 2, -2, 3, -3, 5, -5]);

    const drift = lastY(segments) / SEGMENT_LENGTH;
    const rise = pick([0, 0, 20, 40]);
    const downhill = drift > 0 ? rand() < 0.5 + drift / (2 * CEILING) : rand() < 0.5 + drift / (2 * CEILING);
    const height = Math.abs(drift) > CEILING ? (drift > 0 ? -rise : rise) : downhill ? -rise : rise;

    addStretch(segments, length[0], length[1], length[2], curve, height);
  }

  scatter(segments, rand);

  // Return to the starting elevation, or the seam is a step.
  const drop = lastY(segments) / SEGMENT_LENGTH;
  addStretch(segments, 40, 60, 40, 0, -drop);

  return segments;
}

/**
 * Scatter scenery down both verges.
 *
 * Density rises the further from the tarmac, which is what reads as a verge
 * thinning into countryside rather than a row of identical bollards.
 */
function scatter(segments, rand) {
  for (const segment of segments) {
    if (rand() > 0.14) continue;
    const side = rand() < 0.5 ? -1 : 1;
    segment.props = [
      {
        offset: side * (1.3 + rand() * 3.2),
        kind: Math.floor(rand() * 4),
        size: 0.7 + rand() * 0.7,
      },
    ];
  }
}

export const trackLength = (segments) => segments.length * SEGMENT_LENGTH;

/**
 * The segment at a distance along the track.
 *
 * The modulo is written the long way because JavaScript's `%` keeps the sign
 * of the dividend: a position that has gone negative — reversing, or a frame
 * that arrives with a backwards delta — would otherwise index off the front of
 * the array and return undefined.
 */
export const segmentAt = (segments, z) => {
  const n = Math.floor(z / SEGMENT_LENGTH);
  return segments[((n % segments.length) + segments.length) % segments.length];
};
