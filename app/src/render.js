// Vice Panels — the cover renderer. Draws a finished cover onto any canvas
// context: panels with per-panel crops, a colour grade, and bold gradient
// lettering with an outline and a drop shadow. Pure canvas, no libraries.

import { GRADES, panelRects } from './state.js';

function coverFitDraw(ctx, img, rect, crop) {
  const { x, y, w, h } = rect;
  const base = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const scale = base * (crop.zoom || 1);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = x + (w - dw) / 2 + (crop.dx || 0) * w;
  const dy = y + (h - dh) / 2 + (crop.dy || 0) * h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function placeholderPanel(ctx, rect, slot, grade) {
  const g = GRADES[grade];
  const sky = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  sky.addColorStop(0, g.sky[0]);
  sky.addColorStop(0.55, g.sky[1]);
  sky.addColorStop(1, g.sky[2]);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.fillStyle = sky;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  // A simple sun disc and a skyline silhouette so an empty slot still
  // reads as a Vice City sunset while the user picks a photo.
  const cx = rect.x + rect.w * 0.72;
  const cy = rect.y + rect.h * 0.34;
  const r = Math.min(rect.w, rect.h) * 0.2;
  ctx.fillStyle = 'rgba(255, 236, 170, 0.95)';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(20, 8, 40, 0.85)';
  const base = rect.y + rect.h;
  const bw = rect.w / 7;
  for (let i = 0; i < 7; i += 1) {
    const bh = rect.h * (0.18 + ((i * 37) % 10) / 10 * 0.22);
    ctx.fillRect(rect.x + i * bw, base - bh, bw * 0.82, bh);
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.font = `900 ${Math.round(Math.min(rect.w, rect.h) * 0.13)}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Keep the label near the top: the bottom of every panel carries the
  // cover's title, so a centred label would collide with the lettering.
  ctx.fillText(`SLOT ${slot}`, rect.x + rect.w / 2, rect.y + rect.h * 0.2);
  ctx.restore();
}

function gradeOverlay(ctx, rect, grade) {
  const g = GRADES[grade];
  const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  wash.addColorStop(0, g.sky[0]);
  wash.addColorStop(1, g.sky[2]);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = g.tintStrength;
  ctx.fillStyle = g.tint;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  // Warm light from the top, dark feet at the bottom for the lettering.
  const shade = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  shade.addColorStop(0, 'rgba(255, 220, 160, 0.10)');
  shade.addColorStop(0.55, 'rgba(0, 0, 0, 0)');
  shade.addColorStop(1, 'rgba(10, 4, 30, 0.42)');
  ctx.globalAlpha = 1;
  ctx.fillStyle = shade;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function drawLettering(ctx, W, H, state) {
  const g = GRADES[state.grade];
  const title = (state.title || '').trim() || 'UNTITLED';
  const sub = (state.subtitle || '').trim();
  const pad = Math.round(W * 0.045);
  const bottom = H - Math.round(H * 0.045);

  // A scrim across the bottom of the cover so the lettering reads over
  // busy photos and bright placeholder panels alike.
  const scrimH = Math.round(H * 0.3);
  const scrim = ctx.createLinearGradient(0, H - scrimH, 0, H);
  scrim.addColorStop(0, 'rgba(8, 3, 24, 0)');
  scrim.addColorStop(1, 'rgba(8, 3, 24, 0.55)');
  ctx.save();
  ctx.fillStyle = scrim;
  ctx.fillRect(0, H - scrimH, W, scrimH);
  ctx.restore();

  // Title: heavy gradient fill, dark outline, hard drop shadow.
  let size = Math.round(W * 0.115);
  ctx.textBaseline = 'alphabetic';
  const setTitleFont = (s) => { ctx.font = `900 ${s}px "Arial Black", Arial, sans-serif`; };
  setTitleFont(size);
  const maxW = W - pad * 2;
  while (ctx.measureText(title.toUpperCase()).width > maxW && size > 24) {
    size = Math.round(size * 0.92);
    setTitleFont(size);
  }
  const titleGrad = ctx.createLinearGradient(0, bottom - size, 0, bottom + size * 0.12);
  titleGrad.addColorStop(0, g.title[0]);
  titleGrad.addColorStop(1, g.title[1]);
  ctx.save();
  ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = Math.round(size * 0.07);
  ctx.shadowOffsetY = Math.round(size * 0.08);
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(3, Math.round(size * 0.14));
  ctx.strokeStyle = g.titleStroke;
  ctx.strokeText(title.toUpperCase(), pad, bottom - (sub ? Math.round(size * 0.42) : 0));
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = titleGrad;
  ctx.fillText(title.toUpperCase(), pad, bottom - (sub ? Math.round(size * 0.42) : 0));
  ctx.restore();

  if (sub) {
    const subSize = Math.max(18, Math.round(W * 0.032));
    ctx.save();
    ctx.font = `800 ${subSize}px Arial, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = Math.round(subSize * 0.25);
    ctx.shadowOffsetY = Math.round(subSize * 0.08);
    // Letterspaced subtitle, drawn glyph by glyph.
    let sx = pad;
    const spaced = sub.toUpperCase().split('').join('\u2009');
    ctx.fillText(spaced, sx, bottom);
    ctx.restore();
  }

  // Small original wordmark, top-left, so the cover is signed by the app.
  const markSize = Math.max(14, Math.round(W * 0.02));
  ctx.save();
  ctx.font = `900 ${markSize}px Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = Math.round(markSize * 0.3);
  ctx.fillText('VICE PANELS', pad, pad + markSize);
  ctx.restore();
}

// Draw the whole cover. images maps slot id ('A' | 'B' | 'C') to an
// HTMLImageElement (or null when that slot has no photo yet).
export function drawCover(ctx, W, H, state, images) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  const rects = panelRects(state.layout, W, H);
  rects.forEach((rect, i) => {
    const slot = state.panelSlots[i] ?? 'A';
    const img = images[slot];
    const crop = state.crops[i] ?? { zoom: 1, dx: 0, dy: 0 };
    if (img && img.naturalWidth > 0) {
      coverFitDraw(ctx, img, rect, crop);
    } else {
      placeholderPanel(ctx, rect, slot, state.grade);
    }
    gradeOverlay(ctx, rect, state.grade);
    // Thin white frame around each panel, the poster look.
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = Math.max(2, Math.round(Math.min(W, H) * 0.004));
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  });
  drawLettering(ctx, W, H, state);
}

// Hit-test: which panel index contains canvas point (px, py), or -1.
export function panelAt(state, W, H, px, py) {
  const rects = panelRects(state.layout, W, H);
  for (let i = rects.length - 1; i >= 0; i -= 1) {
    const r = rects[i];
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i;
  }
  return -1;
}
