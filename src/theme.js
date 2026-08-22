/**
 * Everything that makes this road *this* road.
 *
 * Palette and scenery live here and nowhere else, so a different setting — a
 * desert, an alpine pass, a city at night — is a different copy of this one
 * file rather than a change to the renderer.
 */
export const THEME = {
  id: 'coast',
  name: 'Coast Road',

  sky: ['#2d5f86', '#7fb3cc'],

  light: { road: '#4a4e57', verge: '#5f8a55', rumble: '#d8dde3' },
  dark: { road: '#454951', verge: '#57804e', rumble: '#b6353c' },
};
