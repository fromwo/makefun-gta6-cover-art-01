// Vice Panels — deterministic shots. A ?shot= URL sets the whole cover up
// from the query string so a headless browser can reproduce a screenshot:
//   ?shot=cover&photo=pier&caption=Sunset%20Heist
//   ?shot=editor&photo=boulevard&caption=Boulevard%20Queen
// Optional extras: &layout=hero|four|split &grade=sunset|neon|dusk
// &size=square|portrait|wide. The page marks itself ready (data-ready)
// once the sample photo has loaded and the first cover is drawn.

import { GRADES, LAYOUTS, exportSizeById } from './state.js';

const SAMPLES = {
  pier: './samples/pier.jpg',
  boulevard: './samples/boulevard.jpg',
};

export function shotParams() {
  const q = new URLSearchParams(window.location.search);
  const shot = q.get('shot');
  if (!shot) return null;
  return {
    shot,
    photo: q.get('photo') || 'pier',
    caption: q.get('caption') || '',
    layout: q.get('layout') || '',
    grade: q.get('grade') || '',
    size: q.get('size') || '',
  };
}

export function applyShot(state, params) {
  if (params.caption) state.title = params.caption;
  if (params.layout && LAYOUTS[params.layout]) state.layout = params.layout;
  if (params.grade && GRADES[params.grade]) state.grade = params.grade;
  if (params.size) state.sizeId = exportSizeById(params.size).id;
  return params;
}

// Load the shot's sample photo into slot A and resolve with the image
// (or null when the photo name is unknown). Used by main.js at startup.
export function loadShotPhoto(params) {
  return new Promise((resolve) => {
    const src = SAMPLES[params.photo];
    if (!src) { resolve(null); return; }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function markReady() {
  document.documentElement.dataset.ready = 'true';
  document.title = `${document.title} \u2022 ready`;
}
