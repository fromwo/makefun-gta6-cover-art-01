// Wires the Vice Panels editor: photo slots, layout and grade buttons,
// per-panel crop controls, drag-to-pan on the preview, caption editing and
// PNG export at 1080x1080, 1080x1350 or 1920x1080. A `?shot=` query sets
// up a fixed scene for a screenshot instead (./shots.js).

import { drawCover, panelAt } from './render.js';
import { layoutPanels } from './panels.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const slotStatus = document.getElementById('slot-status');
const panelPick = document.getElementById('panel-pick');
const zoomInput = document.getElementById('zoom');
const zoomVal = document.getElementById('zoom-val');
const panXInput = document.getElementById('pan-x');
const panYInput = document.getElementById('pan-y');

const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

const state = {
  layout: 'hero',
  grade: 'sunset',
  title: 'VICE CITY',
  subtitle: 'one last score',
  size: '1080x1080',
  photos: [null, null, null],
  panelPhotos: [0, 1, 0, 1],
  crops: [],
  selected: 0,
};

function cropFor(panel) {
  if (!state.crops[panel]) state.crops[panel] = { zoom: 1, panX: 0, panY: 0 };
  return state.crops[panel];
}

function ensureCrops() {
  const n = layoutPanels(state.layout).length;
  while (state.crops.length < n) state.crops.push({ zoom: 1, panX: 0, panY: 0 });
  state.crops.length = n;
  state.panelPhotos.length = n;
  for (let i = 0; i < n; i += 1) {
    if (state.panelPhotos[i] === undefined) state.panelPhotos[i] = i % 3;
  }
}

function redraw() {
  ensureCrops();
  const [w, h] = SIZES[state.size];
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  drawCover(canvas, state);
  syncControls();
}

function syncControls() {
  document.querySelectorAll('.layout-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layout);
  });
  document.querySelectorAll('.grade-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
  });
  const n = layoutPanels(state.layout).length;
  if (panelPick.options.length !== n) {
    panelPick.innerHTML = '';
    for (let i = 0; i < n; i += 1) {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = `Panel ${i + 1} (photo ${'ABC'[state.panelPhotos[i] ?? 0]})`;
      panelPick.appendChild(opt);
    }
  }
  panelPick.value = String(state.selected);
  const crop = cropFor(state.selected);
  zoomInput.value = String(Math.round(crop.zoom * 100));
  zoomVal.textContent = `${Math.round(crop.zoom * 100)}%`;
  panXInput.value = String(Math.round(crop.panX * 100));
  panYInput.value = String(Math.round(crop.panY * 100));
  const loaded = state.photos.filter(Boolean).length;
  slotStatus.textContent = loaded === 0
    ? 'No photos yet — try the samples.'
    : `${loaded} photo${loaded > 1 ? 's' : ''} loaded (${state.photos.map((p, i) => (p ? 'ABC'[i] : '–')).join(' ')}) — panel ${state.selected + 1} selected.`;
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function setSlot(slot, url) {
  state.photos[slot] = await loadImage(url);
  redraw();
}

['a', 'b', 'c'].forEach((letter, slot) => {
  document.getElementById(`photo-${letter}`).addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    state.photos[slot] = await loadImage(URL.createObjectURL(file));
    redraw();
  });
});

document.getElementById('sample-a').addEventListener('click', () => {
  setSlot(0, 'samples/boulevard.jpg').catch(() => { status.textContent = 'Could not load the sample photo.'; });
});
document.getElementById('sample-b').addEventListener('click', () => {
  setSlot(1, 'samples/pier.jpg').catch(() => { status.textContent = 'Could not load the sample photo.'; });
});

document.querySelectorAll('.layout-btn').forEach((b) => {
  b.addEventListener('click', () => {
    state.layout = b.dataset.layout;
    state.selected = 0;
    panelPick.innerHTML = '';
    redraw();
  });
});
document.querySelectorAll('.grade-btn').forEach((b) => {
  b.addEventListener('click', () => {
    state.grade = b.dataset.grade;
    redraw();
  });
});

panelPick.addEventListener('change', () => {
  state.selected = Number(panelPick.value);
  redraw();
});
zoomInput.addEventListener('input', () => {
  cropFor(state.selected).zoom = Number(zoomInput.value) / 100;
  redraw();
});
panXInput.addEventListener('input', () => {
  cropFor(state.selected).panX = Number(panXInput.value) / 100;
  redraw();
});
panYInput.addEventListener('input', () => {
  cropFor(state.selected).panY = Number(panYInput.value) / 100;
  redraw();
});
document.getElementById('swap-photo').addEventListener('click', () => {
  const loaded = [0, 1, 2].filter((i) => state.photos[i]);
  if (loaded.length === 0) return;
  const cur = state.panelPhotos[state.selected];
  const next = loaded[(loaded.indexOf(cur) + 1) % loaded.length];
  state.panelPhotos[state.selected] = next;
  panelPick.innerHTML = '';
  redraw();
});
document.getElementById('reset-panel').addEventListener('click', () => {
  state.crops[state.selected] = { zoom: 1, panX: 0, panY: 0 };
  redraw();
});

// Drag on the preview: click selects a panel, dragging pans its photo.
let drag = null;
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * canvas.width,
    y: ((e.clientY - r.top) / r.height) * canvas.height,
  };
}
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const hit = panelAt(state, p.x, p.y, canvas.width, canvas.height);
  if (hit < 0) return;
  state.selected = hit;
  const crop = cropFor(hit);
  drag = { x: p.x, y: p.y, panX: crop.panX, panY: crop.panY, panel: hit };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const rect = canvas.getBoundingClientRect();
  const panel = layoutPanels(state.layout)[drag.panel];
  const pw = panel.w * canvas.width;
  const ph = panel.h * canvas.height * 0.84;
  const crop = cropFor(drag.panel);
  crop.panX = Math.max(-0.5, Math.min(0.5, drag.panX + (p.x - drag.x) / pw));
  crop.panY = Math.max(-0.5, Math.min(0.5, drag.panY + (p.y - drag.y) / ph));
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });

document.getElementById('title').addEventListener('input', (e) => {
  state.title = e.target.value;
  redraw();
});
document.getElementById('subtitle').addEventListener('input', (e) => {
  state.subtitle = e.target.value;
  redraw();
});
document.getElementById('size').addEventListener('change', (e) => {
  state.size = e.target.value;
  redraw();
});

/** Renders the cover at the chosen export size and returns a PNG data URL. */
export function exportCoverDataURL(sizeName) {
  const [w, h] = SIZES[sizeName ?? state.size];
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off, { ...state, size: sizeName ?? state.size, selected: -1 });
  return off.toDataURL('image/png');
}
// Test hook used by the screenshot script: the real export path, in-page.
window.__exportCover = exportCoverDataURL;

document.getElementById('export').addEventListener('click', () => {
  const [w, h] = SIZES[state.size];
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off, { ...state, selected: -1 });
  off.toBlob((blob) => {
    if (!blob) {
      status.textContent = 'Export failed — try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-panels-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    status.textContent = `Saved vice-panels-${w}x${h}.png`;
  }, 'image/png');
});

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params, async (scene) => {
    state.layout = scene.layout;
    state.grade = scene.grade;
    state.title = scene.title;
    state.subtitle = scene.subtitle;
    state.size = scene.size;
    document.getElementById('title').value = scene.title;
    document.getElementById('subtitle').value = scene.subtitle;
    document.getElementById('size').value = scene.size;
    state.photos = await Promise.all(scene.photos.map((u) => loadImage(u).catch(() => null)));
    state.panelPhotos = [0, 1, 2, 1];
    state.crops = [];
    state.selected = shot === 'cover' ? -1 : 0;
    redraw();
  });
} else {
  redraw();
}
