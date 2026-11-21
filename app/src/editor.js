// Vice Panels — editor wiring: photo slots, layout/grade pickers, per-panel
// crop controls, drag-to-pan on the preview, and PNG export.
//
// Photos live only in this page's memory (a Map from slot id to a loaded
// Image). Nothing is uploaded anywhere; files are read with FileReader.

import { EXPORT_SIZES, GRADES, LAYOUTS, PHOTO_SLOTS, fitPanelsToLayout, panelRects } from './state.js';
import { drawCover, panelAt } from './render.js';
import { gradeOf } from './grades.js';

const SAMPLE_FILES = { pier: 'samples/pier.jpg', boulevard: 'samples/boulevard.jpg' };

export function createEditor(state, els) {
  const photos = new Map();
  let statusTimer = 0;

  function showStatus(text) {
    els.status.textContent = text;
    window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => { els.status.textContent = ''; }, 4000);
  }

  function previewSize() {
    const size = EXPORT_SIZES.find((s) => s.id === state.exportSize) ?? EXPORT_SIZES[0];
    const scale = Math.min(760 / size.w, 560 / size.h);
    return { w: Math.round(size.w * scale), h: Math.round(size.h * scale) };
  }

  function render() {
    const { w, h } = previewSize();
    drawCover(els.preview, state, photos, w, h);
    syncControls();
  }

  function syncControls() {
    document.querySelectorAll('[data-layout]').forEach((b) => {
      b.classList.toggle('on', b.dataset.layout === state.layout);
    });
    document.querySelectorAll('[data-grade]').forEach((b) => {
      b.classList.toggle('on', b.dataset.grade === state.grade);
    });
    document.querySelectorAll('[data-size]').forEach((b) => {
      b.classList.toggle('on', b.dataset.size === state.exportSize);
    });
    els.splitRow.hidden = state.layout !== 'split';
    els.splitDir.textContent = state.splitDirection === 'vertical' ? 'Side by side' : 'Stacked';
    const panel = state.panels[state.selectedPanel];
    els.panelLabel.textContent = `Panel ${state.selectedPanel + 1} of ${state.panels.length}`;
    els.zoom.value = panel.zoom;
    els.panX.value = panel.ox;
    els.panY.value = panel.oy;
    els.zoomOut.textContent = `${Math.round(panel.zoom * 100)}%`;
    els.panXOut.textContent = `${Math.round(panel.ox * 100)}`;
    els.panYOut.textContent = `${Math.round(panel.oy * 100)}`;
    document.querySelectorAll('[data-slot]').forEach((b) => {
      b.classList.toggle('on', b.dataset.slot === panel.slot);
    });
    els.titleInput.value = state.title;
    els.subtitleInput.value = state.subtitle;
    const grade = gradeOf(state.grade);
    els.preview.style.setProperty('--accent', grade.accent);
  }

  function loadImageFile(file, slot) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('could not read that file'));
      reader.onload = () => {
        const img = new Image();
        img.onload = () => { photos.set(slot, img); resolve(img); };
        img.onerror = () => reject(new Error('that file is not a readable image'));
        img.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });
  }

  function loadSample(slot) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => { photos.set(slot, img); resolve(img); };
      img.onerror = () => reject(new Error(`could not load sample ${slot}`));
      img.src = SAMPLE_FILES[slot];
    });
  }

  async function usePhoto(slot) {
    try {
      if (SAMPLE_FILES[slot]) await loadSample(slot);
      state.panels[state.selectedPanel].slot = slot;
      render();
      showStatus(`Panel ${state.selectedPanel + 1} now uses “${slot}”.`);
    } catch (err) {
      showStatus(err.message);
    }
  }

  function bind() {
    // Photo slots A / B / C: each has its own file picker.
    PHOTO_SLOTS.forEach((slot) => {
      const input = els[`file${slot}`];
      const button = els[`pick${slot}`];
      button.addEventListener('click', () => input.click());
      input.addEventListener('change', async () => {
        const file = input.files && input.files[0];
        if (!file) return;
        try {
          await loadImageFile(file, slot);
          state.panels[state.selectedPanel].slot = slot;
          render();
          showStatus(`Loaded “${file.name}” into slot ${slot}.`);
        } catch (err) {
          showStatus(err.message);
        }
        input.value = '';
      });
    });

    // One-click sample photos (kit samples, free to use).
    els.samplePier.addEventListener('click', () => usePhoto('pier'));
    els.sampleBoulevard.addEventListener('click', () => usePhoto('boulevard'));

    document.querySelectorAll('[data-layout]').forEach((b) => {
      b.addEventListener('click', () => {
        state.layout = b.dataset.layout;
        fitPanelsToLayout(state);
        render();
      });
    });
    document.querySelectorAll('[data-grade]').forEach((b) => {
      b.addEventListener('click', () => { state.grade = b.dataset.grade; render(); });
    });
    document.querySelectorAll('[data-size]').forEach((b) => {
      b.addEventListener('click', () => { state.exportSize = b.dataset.size; render(); });
    });
    els.splitDir.addEventListener('click', () => {
      state.splitDirection = state.splitDirection === 'vertical' ? 'horizontal' : 'vertical';
      render();
    });

    // Which panel the crop controls edit.
    els.prevPanel.addEventListener('click', () => {
      state.selectedPanel = (state.selectedPanel - 1 + state.panels.length) % state.panels.length;
      render();
    });
    els.nextPanel.addEventListener('click', () => {
      state.selectedPanel = (state.selectedPanel + 1) % state.panels.length;
      render();
    });
    document.querySelectorAll('[data-slot]').forEach((b) => {
      b.addEventListener('click', () => {
        const slot = b.dataset.slot;
        if (SAMPLE_FILES[slot]) { usePhoto(slot); return; }
        if (photos.has(slot)) {
          state.panels[state.selectedPanel].slot = slot;
          render();
        } else {
          showStatus(`Slot ${slot} is empty — pick a photo for it first.`);
        }
      });
    });

    els.zoom.addEventListener('input', () => {
      state.panels[state.selectedPanel].zoom = Number(els.zoom.value);
      render();
    });
    els.panX.addEventListener('input', () => {
      state.panels[state.selectedPanel].ox = Number(els.panX.value);
      render();
    });
    els.panY.addEventListener('input', () => {
      state.panels[state.selectedPanel].oy = Number(els.panY.value);
      render();
    });
    els.resetCrop.addEventListener('click', () => {
      const panel = state.panels[state.selectedPanel];
      panel.zoom = 1; panel.ox = 0; panel.oy = 0;
      render();
      showStatus(`Panel ${state.selectedPanel + 1} crop reset.`);
    });

    els.titleInput.addEventListener('input', () => { state.title = els.titleInput.value; render(); });
    els.subtitleInput.addEventListener('input', () => { state.subtitle = els.subtitleInput.value; render(); });

    // Drag on the preview pans the photo inside the panel under the pointer.
    // Offsets are fractions of the panel, so divide the pointer travel by the
    // panel's own size on the canvas.
    let drag = null;
    els.preview.addEventListener('pointerdown', (ev) => {
      const rect = els.preview.getBoundingClientRect();
      const px = (ev.clientX - rect.left) * (els.preview.width / rect.width);
      const py = (ev.clientY - rect.top) * (els.preview.height / rect.height);
      const hit = panelAt(state, els.preview, px, py);
      if (hit < 0) return;
      state.selectedPanel = hit;
      drag = { x: ev.clientX, y: ev.clientY, panel: state.panels[hit], rect, hit };
      els.preview.setPointerCapture(ev.pointerId);
      render();
    });
    els.preview.addEventListener('pointermove', (ev) => {
      if (!drag) return;
      const panel = drag.panel;
      const panelRect = panelRects(state)[drag.hit];
      const panelW = panelRect.w * els.preview.width;
      const panelH = panelRect.h * els.preview.height;
      panel.ox += ((ev.clientX - drag.x) / drag.rect.width) * (els.preview.width / panelW);
      panel.oy += ((ev.clientY - drag.y) / drag.rect.height) * (els.preview.height / panelH);
      drag.x = ev.clientX;
      drag.y = ev.clientY;
      panel.ox = Math.max(-1, Math.min(1, panel.ox));
      panel.oy = Math.max(-1, Math.min(1, panel.oy));
      render();
    });
    const endDrag = () => { drag = null; };
    els.preview.addEventListener('pointerup', endDrag);
    els.preview.addEventListener('pointercancel', endDrag);

    els.exportBtn.addEventListener('click', async () => {
      const size = EXPORT_SIZES.find((s) => s.id === state.exportSize) ?? EXPORT_SIZES[0];
      const off = document.createElement('canvas');
      drawCover(off, state, photos, size.w, size.h);
      const blob = await new Promise((resolve) => off.toBlob(resolve, 'image/png'));
      if (!blob) { showStatus('Export failed — try again.'); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vice-panels-${size.id}.png`;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 5000);
      showStatus(`Exported ${size.label} PNG.`);
    });
  }

  // Full-resolution render onto the preview canvas (used by ?shot=cover so
  // the screenshot is the exported art at full size, not an upscale).
  function renderFull() {
    const size = EXPORT_SIZES.find((s) => s.id === state.exportSize) ?? EXPORT_SIZES[0];
    drawCover(els.preview, state, photos, size.w, size.h);
  }

  return { photos, render, renderFull, syncControls, bind, loadSample, usePhoto, showStatus };
}
