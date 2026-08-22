import { straightRoad, segmentAt, trackLength, ROAD_WIDTH, SEGMENT_LENGTH } from './road.js';
import { project, drawSegment } from './render.js';
import { THEME } from './theme.js';

const FIELD_OF_VIEW = 100; // degrees
const CAMERA_HEIGHT = 1000;
const DRAW_DISTANCE = 300; // segments

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');

const segments = straightRoad();
const cameraDepth = 1 / Math.tan(((FIELD_OF_VIEW / 2) * Math.PI) / 180);

let position = 0;
let width = 0;
let height = 0;

function draw() {
  // Sky.
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, THEME.sky[0]);
  sky.addColorStop(1, THEME.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  const base = segmentAt(segments, position);

  // Near to far. Each segment is only drawn in the sliver left above the one
  // in front of it, so 300 segments cost barely more than a dozen.
  let maxy = height;

  for (let n = 0; n < DRAW_DISTANCE; n++) {
    const segment = segments[(base.index + n) % segments.length];
    const looped = segment.index < base.index;
    const cameraZ = position - (looped ? trackLength(segments) : 0);

    project(segment.p1, 0, CAMERA_HEIGHT, cameraZ, cameraDepth, width, height, ROAD_WIDTH);
    project(segment.p2, 0, CAMERA_HEIGHT, cameraZ, cameraDepth, width, height, ROAD_WIDTH);

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
}

let last = performance.now();
function frame(now) {
  // Clamped at both ends. requestAnimationFrame hands you the timestamp of
  // the *start* of the frame, which can predate the performance.now() taken
  // while this module was still evaluating — so the very first delta can be
  // negative.
  const dt = Math.min(1, Math.max(0, (now - last) / 1000));
  last = now;

  position = (position + SEGMENT_LENGTH * 12 * dt) % trackLength(segments);

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
