/**
 * Circuits, shared as a challenge rather than just a link.
 *
 * The track is a pure function of its seed, so a link only has to carry that
 * number — and if it carries a lap time alongside, the recipient does not just
 * get the same road, they get something to beat. Both are base36 in the
 * fragment, so nothing reaches a server and the whole thing is a dozen
 * characters.
 *
 *   #s1z3f-t6a2   seed 1z3f, target 65.30s
 */

const encodeTime = (seconds) => Math.round(seconds * 100).toString(36);
const decodeTime = (text) => parseInt(text, 36) / 100;

export function challengeLink(seed, seconds) {
  const target = seconds ? `-t${encodeTime(seconds)}` : '';
  return `${location.origin}${location.pathname}#s${seed.toString(36)}${target}`;
}

/** Returns null rather than throwing — a mangled link must not blank the page. */
export function readChallenge() {
  const match = /^#s([0-9a-z]+)(?:-t([0-9a-z]+))?$/.exec(location.hash);
  if (!match) return null;

  const seed = parseInt(match[1], 36);
  if (!Number.isFinite(seed) || seed <= 0) return null;

  const target = match[2] ? decodeTime(match[2]) : null;
  return { seed: seed >>> 0, target: Number.isFinite(target) ? target : null };
}
