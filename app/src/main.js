// Vice Panels — bootstrap. Collects the DOM handles, builds the editor,
// applies any ?shot= parameters, and renders the first preview. The app is
// plain static files: no network request is ever made except loading the
// kit's own sample photos from samples/ when the user asks for them.

import { defaultState } from './state.js';
import { createEditor } from './editor.js';
import { applyShotParams } from './shots.js';
import { drawCover } from './render.js';

const state = defaultState();

const els = {
  preview: document.getElementById('preview'),
  status: document.getElementById('status'),
  fileA: document.getElementById('file-a'),
  fileB: document.getElementById('file-b'),
  fileC: document.getElementById('file-c'),
  pickA: document.getElementById('pick-a'),
  pickB: document.getElementById('pick-b'),
  pickC: document.getElementById('pick-c'),
  samplePier: document.getElementById('sample-pier'),
  sampleBoulevard: document.getElementById('sample-boulevard'),
  splitRow: document.getElementById('split-row'),
  splitDir: document.getElementById('split-dir'),
  panelLabel: document.getElementById('panel-label'),
  prevPanel: document.getElementById('prev-panel'),
  nextPanel: document.getElementById('next-panel'),
  zoom: document.getElementById('zoom'),
  panX: document.getElementById('pan-x'),
  panY: document.getElementById('pan-y'),
  zoomOut: document.getElementById('zoom-out'),
  panXOut: document.getElementById('pan-x-out'),
  panYOut: document.getElementById('pan-y-out'),
  resetCrop: document.getElementById('reset-crop'),
  titleInput: document.getElementById('title'),
  subtitleInput: document.getElementById('subtitle'),
  exportBtn: document.getElementById('export'),
};

const editor = createEditor(state, els);
editor.bind();
editor.render();

// Test hook used by the headless screenshot script: renders the current
// cover at a full export size and reports the PNG byte count, proving the
// export path works without a download. Not part of the editor UI.
const EXPORT_BY_NAME = {
  square: { w: 1080, h: 1080 },
  portrait: { w: 1080, h: 1350 },
  wide: { w: 1920, h: 1080 },
};
window.__vice = {
  exportPNG(name) {
    const size = EXPORT_BY_NAME[name] ?? EXPORT_BY_NAME.square;
    const off = document.createElement('canvas');
    drawCover(off, state, editor.photos, size.w, size.h);
    return new Promise((resolve) => {
      off.toBlob((blob) => resolve(blob ? { size: `${size.w}x${size.h}`, bytes: blob.size } : { error: 'no blob' }), 'image/png');
    });
  },
};

await applyShotParams(state, editor, new URLSearchParams(location.search));
