/**
 * The road, as a list of segments.
 *
 * There is no 3D here and never will be. A segment is a slice of road at a
 * known distance, and drawing it is a matter of working out how wide it looks
 * from where the camera is standing — which is one division.
 */

export const SEGMENT_LENGTH = 200;
export const RUMBLE_LENGTH = 3;
export const ROAD_WIDTH = 2000;
export const LANES = 3;

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

/** A straight, flat road of `count` segments. */
export function straightRoad(count = 500) {
  const segments = [];
  for (let n = 0; n < count; n++) addSegment(segments, 0, 0);
  return segments;
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
