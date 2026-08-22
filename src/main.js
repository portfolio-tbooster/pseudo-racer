import { buildTrack, segmentAt, trackLength, ROAD_WIDTH, SEGMENT_LENGTH } from './road.js';
import { randomSeed } from './rng.js';
import { createPlayer, updatePlayer, MAX_SPEED } from './player.js';
import { attachInput } from './input.js';
import { drawCar } from './car.js';
import { project, drawSegment } from './render.js';
import { THEME } from './theme.js';

const FIELD_OF_VIEW = 100; // degrees
const CAMERA_HEIGHT = 1000;
const DRAW_DISTANCE = 300; // segments

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');

/** A seed in the URL makes any circuit reproducible by link. */
function readSeed() {
  const fromUrl = Number(new URLSearchParams(location.search).get('seed'));
  return Number.isFinite(fromUrl) && fromUrl > 0 ? fromUrl >>> 0 : randomSeed();
}

const segments = buildTrack(readSeed());
const cameraDepth = 1 / Math.tan(((FIELD_OF_VIEW / 2) * Math.PI) / 180);

const player = createPlayer();
const input = attachInput();
let width = 0;
let height = 0;

function draw() {
  // Sky.
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, THEME.sky[0]);
  sky.addColorStop(1, THEME.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  const base = segmentAt(segments, player.position);
  // Ride the road rather than float over it: the camera sits a fixed height
  // above whatever the road is doing underneath.
  const cameraY = CAMERA_HEIGHT + base.p1.world.y;

  // Near to far. Each segment is only drawn in the sliver left above the one
  // in front of it, so 300 segments cost barely more than a dozen.
  let maxy = height;

  // Curvature is not geometry — the road never actually bends. Each segment is
  // nudged sideways by the accumulated curve of everything in front of it,
  // which is indistinguishable from a corner and costs two additions.
  let x = 0;
  let dx = -(base.curve * ((player.position % SEGMENT_LENGTH) / SEGMENT_LENGTH));

  for (let n = 0; n < DRAW_DISTANCE; n++) {
    const segment = segments[(base.index + n) % segments.length];
    const looped = segment.index < base.index;
    const cameraZ = player.position - (looped ? trackLength(segments) : 0);

    project(segment.p1, player.x * ROAD_WIDTH - x, cameraY, cameraZ, cameraDepth, width, height, ROAD_WIDTH);
    project(segment.p2, player.x * ROAD_WIDTH - x - dx, cameraY, cameraZ, cameraDepth, width, height, ROAD_WIDTH);

    x += dx;
    dx += segment.curve;

    if (segment.p1.camera.z <= cameraDepth) continue; // behind the camera
    if (segment.p2.screen.y >= maxy) continue; // hidden by a nearer segment

    drawSegment(
      ctx, width,
      segment.p1.screen.x, segment.p1.screen.y, segment.p1.screen.w,
      segment.p2.screen.x, segment.p2.screen.y, segment.p2.screen.w,
      THEME, segment.dark,
    );

    maxy = segment.p2.screen.y;
  }

  // Bob the car with the road under it and lean it into the steering.
  const shake = player.offRoad ? (Math.random() - 0.5) * 6 * (player.speed / MAX_SPEED) : 0;
  const bounce = Math.sin(player.position / 40) * (player.speed / MAX_SPEED) * 4 + shake;
  const steer = input.left ? -1 : input.right ? 1 : 0;
  drawCar(ctx, width, height, steer, bounce);
}

let last = performance.now();
function frame(now) {
  // Clamped at both ends. requestAnimationFrame hands you the timestamp of
  // the *start* of the frame, which can predate the performance.now() taken
  // while this module was still evaluating — so the very first delta can be
  // negative.
  const dt = Math.min(1, Math.max(0, (now - last) / 1000));
  last = now;

  updatePlayer(player, input, dt, trackLength(segments), segmentAt(segments, player.position));

  draw();
  requestAnimationFrame(frame);
}

function resize() {
  const dpr = window.devicePixelRatio || 1;
  width = innerWidth;
  height = innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

addEventListener('resize', resize);
resize();
requestAnimationFrame(frame);
