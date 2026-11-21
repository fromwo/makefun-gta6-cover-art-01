// Vice Panels — shared state: layouts, colour grades and export sizes.
// Everything the renderer and the editor agree on lives here, so a shot
// URL, the editor and the exporter all describe the same cover.

export const SLOT_IDS = ['A', 'B', 'C'];

export const LAYOUTS = {
  hero: {
    label: 'Hero',
    hint: 'One big panel over a two-panel strip',
    panels: ['A', 'B', 'C'],
  },
  four: {
    label: 'Four panels',
    hint: 'A 2 x 2 grid of equal panels',
    panels: ['A', 'B', 'C', 'A'],
  },
  split: {
    label: 'Split duo',
    hint: 'Two panels, side by side or stacked',
    panels: ['A', 'B'],
  },
};

export const GRADES = {
  sunset: {
    label: 'Sunset',
    hint: 'Warm orange-pink Vice City dusk',
    sky: ['#ff9a3d', '#ff5e7a', '#7b2f8e'],
    tint: '#ff7a2f',
    tintStrength: 0.22,
    title: ['#ffe259', '#ff7e2f'],
    titleStroke: '#2b0a3d',
  },
  neon: {
    label: 'Neon',
    hint: 'Hot pink and cyan night lights',
    sky: ['#ff2fb3', '#7a2bff', '#00e5ff'],
    tint: '#ff2fb3',
    tintStrength: 0.2,
    title: ['#7df9ff', '#ff2fb3'],
    titleStroke: '#12002b',
  },
  dusk: {
    label: 'Dusk',
    hint: 'Deep purple evening, low and moody',
    sky: ['#3b2d7a', '#8e2f6e', '#ff8a5c'],
    tint: '#5b3df0',
    tintStrength: 0.18,
    title: ['#ffd9a0', '#ff5e7a'],
    titleStroke: '#160b2e',
  },
};

export const EXPORT_SIZES = [
  { id: 'square', label: '1080 x 1080', w: 1080, h: 1080 },
  { id: 'portrait', label: '1080 x 1350', w: 1080, h: 1350 },
  { id: 'wide', label: '1920 x 1080', w: 1920, h: 1080 },
];

export function defaultState() {
  return {
    layout: 'hero',
    grade: 'sunset',
    title: 'Sunset Heist',
    subtitle: 'VICE CITY \u2022 2026',
    sizeId: 'square',
    // Per-panel crop: zoom >= 1, dx/dy are fractions of the panel size.
    crops: {
      0: { zoom: 1.05, dx: 0, dy: 0 },
      1: { zoom: 1.1, dx: 0, dy: 0 },
      2: { zoom: 1.1, dx: 0, dy: 0 },
      3: { zoom: 1.05, dx: 0, dy: 0 },
    },
    // Which photo slot fills each panel slot (index into LAYOUTS panels).
    panelSlots: { 0: 'A', 1: 'B', 2: 'C', 3: 'A' },
    selectedPanel: 0,
  };
}

// Panel rectangles for a layout, in fractions of the cover (x, y, w, h).
// gap is the gutter between panels, also as a fraction of the cover width.
export function panelRects(layout, coverW, coverH) {
  const gap = Math.round(Math.min(coverW, coverH) * 0.012);
  const wide = coverW >= coverH;
  if (layout === 'four') {
    const halfW = (coverW - gap) / 2;
    const halfH = (coverH - gap) / 2;
    return [
      { x: 0, y: 0, w: halfW, h: halfH },
      { x: halfW + gap, y: 0, w: halfW, h: halfH },
      { x: 0, y: halfH + gap, w: halfW, h: halfH },
      { x: halfW + gap, y: halfH + gap, w: halfW, h: halfH },
    ];
  }
  if (layout === 'split') {
    if (wide) {
      const halfW = (coverW - gap) / 2;
      return [
        { x: 0, y: 0, w: halfW, h: coverH },
        { x: halfW + gap, y: 0, w: halfW, h: coverH },
      ];
    }
    const halfH = (coverH - gap) / 2;
    return [
      { x: 0, y: 0, w: coverW, h: halfH },
      { x: 0, y: halfH + gap, w: coverW, h: halfH },
    ];
  }
  // hero: big panel on top, two small ones in the strip below.
  const bigH = Math.round(coverH * 0.68);
  const stripH = coverH - bigH - gap;
  const halfW = (coverW - gap) / 2;
  return [
    { x: 0, y: 0, w: coverW, h: bigH },
    { x: 0, y: bigH + gap, w: halfW, h: stripH },
    { x: halfW + gap, y: bigH + gap, w: halfW, h: stripH },
  ];
}

export function exportSizeById(id) {
  return EXPORT_SIZES.find((s) => s.id === id) ?? EXPORT_SIZES[0];
}
