// Vice Panels — shared editor state: layouts, export sizes and defaults.
// Nothing here touches the DOM; render.js draws from this state, editor.js
// mutates it. A panel is one rectangle of the cover: it holds a photo slot,
// a zoom factor and a pan offset (fractions of the panel size).

export const LAYOUTS = {
  hero: { label: 'Hero', panels: 3 },
  four: { label: 'Four panels', panels: 4 },
  split: { label: 'Split duo', panels: 2 },
};

export const GRADES = ['sunset', 'neon', 'dusk'];

export const EXPORT_SIZES = [
  { id: '1080x1080', label: 'Square 1080 x 1080', w: 1080, h: 1080 },
  { id: '1080x1350', label: 'Portrait 1080 x 1350', w: 1080, h: 1350 },
  { id: '1920x1080', label: 'Wide 1920 x 1080', w: 1920, h: 1080 },
];

export const PHOTO_SLOTS = ['A', 'B', 'C'];

// One panel's crop: slot is 'A' | 'B' | 'C' | 'pier' | 'boulevard' | null,
// zoom multiplies the cover-fit scale, ox/oy shift the photo in panel units.
export function freshPanel(slot) {
  return { slot, zoom: 1, ox: 0, oy: 0 };
}

export function defaultState() {
  return {
    layout: 'hero',
    splitDirection: 'vertical', // 'vertical' (side by side) | 'horizontal' (stacked)
    grade: 'sunset',
    title: 'Sunset Heist',
    subtitle: 'VICE CITY • A STORY IN THREE PANELS',
    exportSize: '1080x1080',
    selectedPanel: 0,
    panels: [freshPanel('pier'), freshPanel('boulevard'), freshPanel('pier')],
  };
}

// Panel rectangles for a layout, as fractions of the cover (x, y, w, h).
// gap is the fraction of the cover width left white between panels.
export function panelRects(state, gap = 0.012) {
  const g = gap;
  if (state.layout === 'four') {
    const half = 0.5 - g / 2;
    return [
      { x: 0, y: 0, w: half, h: half },
      { x: 0.5 + g / 2, y: 0, w: half, h: half },
      { x: 0, y: 0.5 + g / 2, w: half, h: half },
      { x: 0.5 + g / 2, y: 0.5 + g / 2, w: half, h: half },
    ];
  }
  if (state.layout === 'split') {
    if (state.splitDirection === 'horizontal') {
      const half = 0.5 - g / 2;
      return [
        { x: 0, y: 0, w: 1, h: half },
        { x: 0, y: 0.5 + g / 2, w: 1, h: half },
      ];
    }
    const half = 0.5 - g / 2;
    return [
      { x: 0, y: 0, w: half, h: 1 },
      { x: 0.5 + g / 2, y: 0, w: half, h: 1 },
    ];
  }
  // hero: one big panel on the left, two stacked strips on the right.
  const main = 0.64 - g / 2;
  const strip = 1 - main - g;
  const half = 0.5 - g / 2;
  return [
    { x: 0, y: 0, w: main, h: 1 },
    { x: main + g, y: 0, w: strip, h: half },
    { x: main + g, y: 0.5 + g / 2, w: strip, h: half },
  ];
}

// Keep the panel list the right length when the layout changes, reusing the
// photos the user already placed instead of wiping them.
export function fitPanelsToLayout(state) {
  const want = LAYOUTS[state.layout].panels;
  const keep = state.panels.slice(0, want);
  while (keep.length < want) {
    const donor = state.panels[keep.length % Math.max(state.panels.length, 1)] || freshPanel('pier');
    keep.push(freshPanel(donor.slot));
  }
  state.panels = keep;
  state.selectedPanel = Math.min(state.selectedPanel, want - 1);
}
