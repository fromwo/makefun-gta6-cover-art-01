// Panel geometry for the three poster layouts. Every rect is in unit
// coordinates of the photo area (the part above the caption band), so the
// same layout works at 1080x1080, 1080x1350 and 1920x1080. The caption band
// always takes the bottom 16% of the cover height.

export const CAPTION_FRACTION = 0.16;

// gap: the dark gutter between panels, as a fraction of cover width.
export const GUTTER = 0.012;

const LAYOUTS = {
  // One big hero photo on top, three small panels in a strip below it.
  hero: [
    { x: 0, y: 0, w: 1, h: 0.74 },
    { x: 0, y: 0.74, w: 0.333, h: 0.26 },
    { x: 0.333, y: 0.74, w: 0.334, h: 0.26 },
    { x: 0.667, y: 0.74, w: 0.333, h: 0.26 },
  ],
  // Four equal panels in a 2 x 2 comic grid.
  grid: [
    { x: 0, y: 0, w: 0.5, h: 0.5 },
    { x: 0.5, y: 0, w: 0.5, h: 0.5 },
    { x: 0, y: 0.5, w: 0.5, h: 0.5 },
    { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
  ],
  // A tall panel on the left, two stacked panels on the right.
  duo: [
    { x: 0, y: 0, w: 0.56, h: 1 },
    { x: 0.56, y: 0, w: 0.44, h: 0.5 },
    { x: 0.56, y: 0.5, w: 0.44, h: 0.5 },
  ],
};

export const LAYOUT_NAMES = Object.keys(LAYOUTS);

/** Returns the panel rects (unit coords) for a layout name, defaulting to hero. */
export function layoutPanels(name) {
  return (LAYOUTS[name] ?? LAYOUTS.hero).map((r) => ({ ...r }));
}

/** Default photo slot for each panel: panels cycle through the loaded photos. */
export function defaultPanelPhotos(name, slotCount) {
  return layoutPanels(name).map((_, i) => i % Math.max(1, slotCount));
}

/** Pixel rect of a panel inside the photo area of a cover of size w x h. */
export function panelPixels(rect, w, h) {
  const photoH = h * (1 - CAPTION_FRACTION);
  const g = w * GUTTER;
  return {
    x: rect.x * w + g / 2,
    y: rect.y * photoH + g / 2,
    w: rect.w * w - g,
    h: rect.h * photoH - g,
  };
}
