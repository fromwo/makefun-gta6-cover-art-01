// Vice Panels — the editor. Wires the controls to the state, loads the
// user's own photos into slots A / B / C (or the kit's two sample photos),
// lets each panel be dragged and cropped, and exports the finished cover
// as a PNG in the three common post sizes.

import { EXPORT_SIZES, GRADES, LAYOUTS, SLOT_IDS, defaultState, exportSizeById } from './state.js';
import { drawCover, panelAt } from './render.js';
import { applyShot, loadShotPhoto, markReady, shotParams } from './shots.js';

const state = defaultState();
const images = { A: null, B: null, C: null };
const params = shotParams();
const shotMode = params ? params.shot : '';

const $ = (id) => document.getElementById(id);
const canvas = $('preview');
const ctx = canvas.getContext('2d');
const statusEl = $('status');

function say(msg) {
  statusEl.textContent = msg;
}

function currentSize() {
  return exportSizeById(state.sizeId);
}

function render() {
  const { w, h } = currentSize();
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  drawCover(ctx, w, h, state, images);
  syncPanelControls();
}

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('could not read that image')); };
    img.src = url;
  });
}

async function setSlotPhoto(slot, img, label) {
  images[slot] = img;
  const thumb = $(`thumb-${slot.toLowerCase()}`);
  if (thumb) {
    thumb.innerHTML = '';
    if (img) {
      const mini = img.cloneNode(false);
      mini.alt = `Slot ${slot} photo`;
      thumb.appendChild(mini);
    } else {
      thumb.textContent = slot;
    }
  }
  render();
  say(label ? `${label} loaded into slot ${slot}.` : `Slot ${slot} cleared.`);
}

function bindSlot(slot) {
  const lower = slot.toLowerCase();
  $(`file-${lower}`).addEventListener('change', async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      const img = await loadImageFile(file);
      await setSlotPhoto(slot, img, file.name);
    } catch {
      say('That file could not be read as an image.');
    }
    event.target.value = '';
  });
  $(`sample-${lower}`).addEventListener('click', async () => {
    const src = slot === 'C' ? './samples/pier.jpg' : './samples/boulevard.jpg';
    const img = new Image();
    img.onload = () => setSlotPhoto(slot, img, 'Sample photo');
    img.onerror = () => say('Sample photo failed to load.');
    img.src = src;
  });
  $(`clear-${lower}`).addEventListener('click', () => setSlotPhoto(slot, null, ''));
}

function segmented(id, options, current, onPick) {
  const host = $(id);
  host.innerHTML = '';
  Object.entries(options).forEach(([key, def]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = def.label;
    btn.title = def.hint || def.label;
    btn.setAttribute('aria-pressed', key === current ? 'true' : 'false');
    if (key === current) btn.classList.add('on');
    btn.addEventListener('click', () => {
      onPick(key);
      host.querySelectorAll('button').forEach((b) => {
        b.classList.remove('on');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('on');
      btn.setAttribute('aria-pressed', 'true');
    });
    host.appendChild(btn);
  });
}

function buildControls() {
  segmented('layout-pick', LAYOUTS, state.layout, (key) => {
    state.layout = key;
    state.selectedPanel = 0;
    render();
    say(`Layout: ${LAYOUTS[key].label}.`);
  });
  segmented('grade-pick', GRADES, state.grade, (key) => {
    state.grade = key;
    render();
    say(`Grade: ${GRADES[key].label}.`);
  });
  const sizeHost = $('size-pick');
  sizeHost.innerHTML = '';
  EXPORT_SIZES.forEach((size) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = size.label;
    btn.setAttribute('aria-pressed', size.id === state.sizeId ? 'true' : 'false');
    if (size.id === state.sizeId) btn.classList.add('on');
    btn.addEventListener('click', () => {
      state.sizeId = size.id;
      sizeHost.querySelectorAll('button').forEach((b) => {
        b.classList.remove('on');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('on');
      btn.setAttribute('aria-pressed', 'true');
      render();
      say(`Export size: ${size.label}.`);
    });
    sizeHost.appendChild(btn);
  });

  $('title').addEventListener('input', (e) => { state.title = e.target.value; render(); });
  $('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; render(); });

  SLOT_IDS.forEach(bindSlot);
  buildPanelControls();
}

function buildPanelControls() {
  const host = $('panel-pick');
  host.innerHTML = '';
  const count = state.layout === 'four' ? 4 : state.layout === 'split' ? 2 : 3;
  for (let i = 0; i < count; i += 1) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = `Panel ${i + 1}`;
    btn.setAttribute('aria-pressed', i === state.selectedPanel ? 'true' : 'false');
    if (i === state.selectedPanel) btn.classList.add('on');
    btn.addEventListener('click', () => {
      state.selectedPanel = i;
      host.querySelectorAll('button').forEach((b) => {
        b.classList.remove('on');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('on');
      btn.setAttribute('aria-pressed', 'true');
      syncPanelControls();
      say(`Panel ${i + 1} selected — drag its photo on the preview to move it.`);
    });
    host.appendChild(btn);
  }

  const slotSel = $('panel-slot');
  slotSel.innerHTML = '';
  SLOT_IDS.forEach((slot) => {
    const opt = document.createElement('option');
    opt.value = slot;
    opt.textContent = `Photo slot ${slot}`;
    slotSel.appendChild(opt);
  });
  if (!panelListenersBound) {
    panelListenersBound = true;
    slotSel.addEventListener('change', () => {
      state.panelSlots[state.selectedPanel] = slotSel.value;
      render();
    });

    const crop = () => state.crops[state.selectedPanel];
    $('zoom').addEventListener('input', (e) => { crop().zoom = Number(e.target.value); render(); });
    $('move-x').addEventListener('input', (e) => { crop().dx = Number(e.target.value); render(); });
    $('move-y').addEventListener('input', (e) => { crop().dy = Number(e.target.value); render(); });
    $('reset-crop').addEventListener('click', () => {
      state.crops[state.selectedPanel] = { zoom: 1.05, dx: 0, dy: 0 };
      render();
      say(`Panel ${state.selectedPanel + 1} crop reset.`);
    });
  }
}

let panelListenersBound = false;

function syncPanelControls() {
  // Rebuild the panel buttons when the layout changed the panel count.
  const host = $('panel-pick');
  const want = state.layout === 'four' ? 4 : state.layout === 'split' ? 2 : 3;
  if (host.children.length !== want) buildPanelControls();
  const crop = state.crops[state.selectedPanel] ?? { zoom: 1.05, dx: 0, dy: 0 };
  $('zoom').value = String(crop.zoom);
  $('move-x').value = String(crop.dx);
  $('move-y').value = String(crop.dy);
  $('zoom-val').textContent = `${Math.round(crop.zoom * 100)}%`;
  $('move-x-val').textContent = `${Math.round(crop.dx * 100)}`;
  $('move-y-val').textContent = `${Math.round(crop.dy * 100)}`;
  const slotSel = $('panel-slot');
  if (slotSel.value !== (state.panelSlots[state.selectedPanel] ?? 'A')) {
    slotSel.value = state.panelSlots[state.selectedPanel] ?? 'A';
  }
}

function bindDrag() {
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  const toCanvas = (event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  };
  canvas.addEventListener('pointerdown', (event) => {
    const p = toCanvas(event);
    const hit = panelAt(state, canvas.width, canvas.height, p.x, p.y);
    if (hit < 0) return;
    state.selectedPanel = hit;
    dragging = true;
    lastX = p.x;
    lastY = p.y;
    canvas.setPointerCapture(event.pointerId);
    syncPanelControls();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const p = toCanvas(event);
    const crop = state.crops[state.selectedPanel];
    crop.dx += (p.x - lastX) / canvas.width;
    crop.dy += (p.y - lastY) / canvas.height;
    crop.dx = Math.max(-0.6, Math.min(0.6, crop.dx));
    crop.dy = Math.max(-0.6, Math.min(0.6, crop.dy));
    lastX = p.x;
    lastY = p.y;
    render();
  });
  const stop = () => { dragging = false; };
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);
}

async function exportPNG(sizeId) {
  const size = exportSizeById(sizeId);
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off.getContext('2d'), size.w, size.h, state, images);
  const blob = await new Promise((resolve) => off.toBlob(resolve, 'image/png'));
  return { blob, size };
}

function bindExport() {
  $('export').addEventListener('click', async () => {
    const btn = $('export');
    btn.disabled = true;
    try {
      const { blob, size } = await exportPNG(state.sizeId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safe = (state.title || 'cover').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cover';
      a.href = url;
      a.download = `vice-panels-${safe}-${size.w}x${size.h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      say(`Exported ${size.label} PNG — check your downloads.`);
    } catch {
      say('Export failed — try again.');
    } finally {
      btn.disabled = false;
    }
  });
}

// Headless / test hook: lets a screenshot run prove the export works
// without a download dialog.
window.__vice = {
  state,
  images,
  render,
  exportPNG: async (sizeId) => {
    const { blob, size } = await exportPNG(sizeId);
    return { bytes: blob.size, w: size.w, h: size.h, type: blob.type };
  },
};

buildControls();
bindDrag();
bindExport();

// After a ?shot= URL changes the state, light up the matching buttons
// without rebinding every control.
function refreshSegmented() {
  const mark = (hostId, current) => {
    $(hostId).querySelectorAll('button').forEach((b) => {
      const on = b.textContent === current;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  };
  mark('layout-pick', LAYOUTS[state.layout].label);
  mark('grade-pick', GRADES[state.grade].label);
  mark('size-pick', exportSizeById(state.sizeId).label);
}

async function start() {
  if (params) {
    applyShot(state, params);
    document.body.classList.add(`shot-${shotMode}`);
    const img = await loadShotPhoto(params);
    if (img) images.A = img;
    $('title').value = state.title;
    $('subtitle').value = state.subtitle;
    refreshSegmented();
  }
  render();
  say('Ready — load a photo into slot A, B or C, pick a layout and grade, then export.');
  if (params) markReady();
}

start();
