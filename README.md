# Coast Road

A pseudo-3D racer in the browser. Generate a circuit from a seed, drive it,
and share it as a challenge with your lap time attached.

No build step, no dependencies, no assets — every pixel is drawn from shapes.

## Running it

The project is ES modules, which browsers refuse to load over `file://` — so
opening `index.html` by double-clicking gives you a blank page. Serve the
directory instead:

```bash
python3 -m http.server 8000    # or: npx serve .
```

Then open <http://localhost:8000>. It is a static site with no build step, so
GitHub Pages works with no configuration at all.

## Controls

```
↑ / W        throttle
↓ / S        brake
← → / A D    steer
R            restart from the start line
touch        hold anywhere to drive; left and right thirds steer
```

A lap is about a minute. Other cars hold their lane at between a third and
two thirds of your top speed — hitting one costs you most of your momentum and
knocks you sideways, so overtaking is the whole game.

## How it works

### There is no 3D

The road is a list of segments, each a slice at a known distance. Drawing one
is a single division:

```
scale = cameraDepth / distance
```

A thing twice as far away is drawn half as wide. Everything else — the width of
the tarmac, the height of a tree, the position of a rumble strip — falls out of
that one number.

Segments are drawn **near to far**, and each is only painted in the sliver of
screen left above the one in front of it. That clip is what makes a 300-segment
draw distance cost about as much as a dozen segments.

### The road never actually bends

There is no curved geometry anywhere. Each segment is nudged sideways by the
accumulated curve of every segment in front of it:

```
x  += dx
dx += segment.curve
```

Two additions per segment, and the result is indistinguishable from a corner.
The same accumulator is what the car is steered against, so cornering and
rendering agree without either knowing about the other.

### Handling was worked out, not guessed

Steering moves the car by `dt * 2 * speedPercent`. Centrifugal force moves it
back by that same step times `speedPercent * curve * CENTRIFUGAL`. So the car
holds a corner only while

```
speedPercent × curve × CENTRIFUGAL  <  1
```

At `CENTRIFUGAL = 0.24` and a sharpest curve of 5, that is 83% of top speed —
you have to lift for the tightest bends, but the track is a challenge rather
than a punishment. The first attempt used 0.32 against a curve of 6, which put
the limit at half speed and read as the car being broken.

### Circuits are a pure function of a seed

Three octaves of nothing — just sampled sections, eased in and out, with the
elevation walk biased back toward its starting height so the closing stretch
does not have to climb a cliff to meet the finish line. Because the track
derives entirely from one 32-bit number, a share link carries the seed and your
lap time in about a dozen base36 characters, in the fragment, so nothing
reaches a server.

```
src/road.js      segments, curves, hills, scenery
src/render.js    the projection and everything drawn from it
src/player.js    throttle, steering, centrifugal force
src/car.js       the car, from flat shapes
src/theme.js     palette and scenery — the only file a new setting touches
src/share.js     circuits ↔ challenge links
```

## Making it somewhere else

`src/theme.js` holds the palette, the hills and the roadside props, and nothing
else knows the setting is a coast road. Swap that one file for a desert, an
alpine pass or a city at night and the rest keeps working.
