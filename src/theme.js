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

  car: { shell: '#d9534a', glass: '#2b3038', lamp: '#ffd9a0' },

  /** Rolling hills behind the track: amplitude and shade per parallax layer. */
  hills: [
    { amplitude: 0.10, shade: '#5b7f96', drift: 0.25 },
    { amplitude: 0.06, shade: '#4a6c82', drift: 0.5 },
  ],

  /**
   * Roadside scenery, as flat shapes in units of the prop's own width, with y
   * measured up from the ground. Nothing is loaded — swapping this array for
   * cacti or pine trees is the whole of changing the setting.
   */
  props: [
    {
      name: 'cypress',
      parts: [
        { t: 'rect', x: -0.07, y: 0, w: 0.14, h: 0.35, c: '#6b5a42' },
        { t: 'tri', x: -0.42, y: 0.28, w: 0.84, h: 1.15, c: '#2f5d3a' },
      ],
    },
    {
      name: 'pine',
      parts: [
        { t: 'rect', x: -0.06, y: 0, w: 0.12, h: 0.28, c: '#6b5a42' },
        { t: 'tri', x: -0.55, y: 0.2, w: 1.1, h: 0.8, c: '#38663f' },
      ],
    },
    {
      name: 'marker',
      parts: [
        { t: 'rect', x: -0.05, y: 0, w: 0.1, h: 0.55, c: '#e8ecef' },
        { t: 'rect', x: -0.05, y: 0.45, w: 0.1, h: 0.12, c: '#c4413c' },
      ],
    },
    {
      name: 'boulder',
      parts: [{ t: 'tri', x: -0.5, y: 0, w: 1, h: 0.42, c: '#8e8a80' }],
    },
  ],
};
