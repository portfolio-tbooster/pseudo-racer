/**
 * Best lap times, per circuit.
 *
 * Keyed by seed, because a personal best only means anything against the same
 * track. Every read and write is wrapped: a full or disabled localStorage must
 * never take the game down with it.
 */

const KEY = 'coast-road:best';

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function bestFor(seed) {
  const value = readAll()[seed];
  return typeof value === 'number' ? value : null;
}

export function recordLap(seed, seconds) {
  const best = bestFor(seed);
  if (best !== null && best <= seconds) return best;

  try {
    const all = readAll();
    all[seed] = seconds;
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // Not being able to save a time is not a reason to lose the race.
  }
  return seconds;
}
