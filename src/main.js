import { buildTrack, segmentAt, trackLength, ROAD_WIDTH, SEGMENT_LENGTH, PLAYER_Z } from './road.js';
import { randomSeed } from './rng.js';
import { createPlayer, updatePlayer, MAX_SPEED } from './player.js';
import { attachInput } from './input.js';
import { drawCarAt, drawPlayerCar } from './car.js';
import { drawHud } from './hud.js';
import { bestFor, recordLap } from './storage.js';
import { challengeLink, readChallenge } from './share.js';
import {
  createTraffic, updateTraffic, collidingCar, applyCollision, trafficBySegment,
} from './traffic.js';
import { project, drawSegment, drawProp, drawHills, carWidthAt } from './render.js';
import { THEME } from './theme.js';

const FIELD_OF_VIEW = 100; // degrees
const CAMERA_HEIGHT = 1000;
const DRAW_DISTANCE = 300; // segments

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');

/**
 * Where a circuit comes from: a shared challenge wins, then an explicit seed
 * in the query, then a fresh one.
 */
const challenge = readChallenge();

function readSeed() {
  if (challenge) return challenge.seed;
  const fromUrl = Number(new URLSearchParams(location.search).get('seed'));
  return Number.isFinite(fromUrl) && fromUrl > 0 ? fromUrl >>> 0 : randomSeed();
}

const seed = readSeed();
const segments = buildTrack(seed);

let lapTime = 0;
let lap = 1;
let lastPosition = 0;
let flash = 0;
let flashTime = 0;
let flashBest = false;
let best = bestFor(seed);
const traffic = createTraffic(seed, trackLength(segments));
const target = challenge?.target ?? null;
const cameraDepth = 1 / Math.tan(((FIELD_OF_VIEW / 2) * Math.PI) / 180);

const player = createPlayer();
let skyOffset = 0;
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
  drawHills(ctx, width, height, THEME, skyOffset);

  const base = segmentAt(segments, player.position);
  // Ride the road rather than float over it: the camera sits a fixed height
  // above whatever the road is doing underneath.
  const cameraY = CAMERA_HEIGHT + base.p1.world.y;

  // Near to far. Each segment is only drawn in the sliver left above the one
  // in front of it, so 300 segments cost barely more than a dozen.
  let maxy = height;
  const visible = [];
  const cars = trafficBySegment(traffic, segments.length);

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

    // The tarmac of this segment may be hidden behind a nearer rise — but a
    // tree or a car standing on it is not. Culling objects along with the road
    // surface is what made distant scenery blink: as the camera crests, each
    // segment flips in and out of this test every frame, taking whatever was
    // standing on it with it.
    if (segment.p2.screen.y < maxy) {
      drawSegment(
        ctx, width,
        segment.p1.screen.x, segment.p1.screen.y, segment.p1.screen.w,
        segment.p2.screen.x, segment.p2.screen.y, segment.p2.screen.w,
        THEME, segment.dark,
      );
      maxy = segment.p2.screen.y;
    }

    segment.cars = cars.get(segment.index);
    if (segment.props || segment.cars) visible.push(segment);
  }

  // Scenery goes back to front, after the road, so a near tree covers a far
  // one and neither is painted over by tarmac drawn later.
  for (let i = visible.length - 1; i >= 0; i--) {
    const segment = visible[i];
    const { x: sx, y: sy, w: sw } = segment.p1.screen;

    for (const prop of segment.props ?? []) {
      drawProp(ctx, prop, THEME, sx, sy, sw);
    }
    // Traffic is positioned by the same projection as everything else, so it
    // shrinks with distance without knowing anything about perspective.
    for (const car of segment.cars ?? []) {
      // A car nearer than the player's own is *behind* it — between the car
      // and the camera — and this projection has no way to show that: it just
      // grows without limit. Drop it once it draws level, a little past the
      // point where a collision would already have fired.
      if (segment.p1.camera.z < PLAYER_Z * 0.7) continue;
      drawCarAt(ctx, sx + sw * car.x, sy, carWidthAt(cameraDepth, segment.p1.camera.z, width), car.colors);
    }
  }

  // Bob the car with the road under it and lean it into the steering.
  const shake = player.offRoad ? (Math.random() - 0.5) * 6 * (player.speed / MAX_SPEED) : 0;
  const bounce = Math.sin(player.position / 40) * (player.speed / MAX_SPEED) * 4 + shake;
  const steer = input.left ? -1 : input.right ? 1 : 0;
  drawPlayerCar(ctx, width, height, steer, bounce, carWidthAt(cameraDepth, PLAYER_Z, width));

  drawHud(ctx, width, {
    lapTime,
    lap,
    best,
    target,
    flash,
    flashTime,
    flashBest,
    // Arbitrary but consistent: the number only has to move with the throttle.
    speed: player.speed / 100,
  });
}

let last = performance.now();
function frame(now) {
  // Clamped at both ends. requestAnimationFrame hands you the timestamp of
  // the *start* of the frame, which can predate the performance.now() taken
  // while this module was still evaluating — so the very first delta can be
  // negative.
  const dt = Math.min(1, Math.max(0, (now - last) / 1000));
  last = now;

  const here = segmentAt(segments, player.position);
  updatePlayer(player, input, dt, trackLength(segments), here);

  updateTraffic(traffic, dt, trackLength(segments));
  const hit = collidingCar(player, traffic, trackLength(segments));
  if (hit) applyCollision(player, hit);

  // The background slides opposite the corner, which is most of what sells a
  // bend as a change of direction rather than the road sliding sideways.
  skyOffset += here.curve * (player.speed / MAX_SPEED) * dt * 220;

  // Position wraps through the modulo at the finish line, so a drop is a lap.
  lapTime += dt;
  flash = Math.max(0, flash - dt);

  if (player.position < lastPosition) {
    flashBest = best === null || lapTime < best;
    flashTime = lapTime;
    flash = 2.5;
    best = recordLap(seed, lapTime);
    lapTime = 0;
    lap++;
  }
  lastPosition = player.position;

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

const shareButton = document.getElementById('share');
shareButton.addEventListener('click', async () => {
  const link = challengeLink(seed, best);
  try {
    await navigator.clipboard.writeText(link);
  } catch {
    // Clipboard access can be refused; putting it in the address bar still
    // leaves the person something they can copy by hand.
  }
  location.hash = link.slice(link.indexOf('#') + 1);
  shareButton.textContent = best ? 'Challenge copied' : 'Link copied';
  shareButton.classList.add('is-done');
  setTimeout(() => {
    shareButton.textContent = 'Share this circuit';
    shareButton.classList.remove('is-done');
  }, 1800);
});

/** Back to the start line, keeping the circuit and the best time. */
function restart() {
  player.position = 0;
  player.speed = 0;
  player.x = 0;
  lapTime = 0;
  lap = 1;
  lastPosition = 0;
  flash = 0;
  skyOffset = 0;
}

addEventListener('keydown', (e) => {
  if (e.code === 'KeyR') restart();
});

addEventListener('resize', resize);
resize();
requestAnimationFrame(frame);
