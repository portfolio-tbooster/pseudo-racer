/**
 * Keyboard and touch, reduced to four booleans.
 *
 * The physics never learns what a key is; it is handed intent. That is what
 * lets touch work without a second code path — the left and right halves of
 * the screen steer, and holding anywhere is the throttle.
 */
export function attachInput() {
  const input = { left: false, right: false, throttle: false, brake: false };

  const KEYS = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'throttle', KeyW: 'throttle',
    ArrowDown: 'brake', KeyS: 'brake',
  };

  const set = (event, value) => {
    const action = KEYS[event.code];
    if (!action) return;
    input[action] = value;
    event.preventDefault();
  };

  addEventListener('keydown', (e) => set(e, true));
  addEventListener('keyup', (e) => set(e, false));

  const touch = (e) => {
    if (!e.touches.length) {
      input.left = input.right = input.throttle = false;
      return;
    }
    const x = e.touches[0].clientX / innerWidth;
    input.throttle = true;
    input.left = x < 0.35;
    input.right = x > 0.65;
  };
  addEventListener('touchstart', touch, { passive: true });
  addEventListener('touchmove', touch, { passive: true });
  addEventListener('touchend', touch, { passive: true });

  return input;
}
