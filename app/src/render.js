// Vice Panels — the cover renderer. One function, drawCover, paints the
// whole poster onto any canvas at any size: the live preview and the PNG
// export share it, so what you see is exactly what you download.
//
// photos: a map from slot id ('A' | 'B' | 'C' | 'pier' | 'boulevard') to a
// loaded HTMLImageElement. Slots with no photo yet get a striped placeholder.

import { panelRects } from './state.js';
import { gradeOf } from './grades.js';

function drawPhotoCover(ctx, img, rx, ry, rw, rh, zoom, ox, oy) {
  const scale = Math.max(rw / img.naturalWidth, rh / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = rx + (rw - dw) / 2 + ox * rw;
  const dy = ry + (rh - dh) / 2 + oy * rh;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rx, ry, rw, rh);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function drawPlaceholder(ctx, rx, ry, rw, rh, grade) {
  const grad = ctx.createLinearGradient(rx, ry, rx + rw, ry + rh);
  grad.addColorStop(0, '#3a2b4d');
  grad.addColorStop(1, '#191024');
  ctx.fillStyle = grad;
  ctx.fillRect(rx, ry, rw, rh);
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = Math.max(2, rw * 0.004);
  for (let i = -rh; i < rw; i += rw * 0.09) {
    ctx.beginPath();
    ctx.moveTo(rx + i, ry + rh);
    ctx.lineTo(rx + i + rh, ry);
    ctx.stroke();
  }
  ctx.fillStyle = grade.paper;
  ctx.globalAlpha = 0.85;
  ctx.font = `700 ${Math.max(14, rw * 0.055)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ADD A PHOTO', rx + rw / 2, ry + rh / 2);
  ctx.globalAlpha = 1;
}

function gradeWash(ctx, W, H, grade) {
  const wash = ctx.createLinearGradient(0, 0, W * 0.35, H);
  wash.addColorStop(0, grade.wash[0]);
  wash.addColorStop(0.55, grade.wash[1]);
  wash.addColorStop(1, grade.wash[2]);
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  // Gentle vignette so the caption band and the edges read as one poster.
  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(10,4,20,0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}

function fitFont(ctx, text, maxWidth, startPx, family, weight = 900) {
  let px = startPx;
  ctx.font = `${weight} ${px}px ${family}`;
  while (px > 12 && ctx.measureText(text).width > maxWidth) {
    px -= 2;
    ctx.font = `${weight} ${px}px ${family}`;
  }
  return px;
}

function drawCaption(ctx, W, H, state, grade) {
  const bandH = H * 0.26;
  const bandY = H - bandH;
  const band = ctx.createLinearGradient(0, bandY, 0, H);
  band.addColorStop(0, 'rgba(10,4,20,0)');
  band.addColorStop(0.45, grade.band);
  band.addColorStop(1, grade.band);
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY, W, H - bandY);

  // Accent rule above the title.
  const pad = W * 0.045;
  ctx.fillStyle = grade.accent;
  ctx.fillRect(pad, bandY + bandH * 0.16, W * 0.12, Math.max(3, H * 0.006));

  const title = (state.title || 'UNTITLED').toUpperCase();
  const family = `'Arial Black', 'Helvetica Neue', system-ui, sans-serif`;
  const titlePx = fitFont(ctx, title, W - pad * 2, H * 0.105, family);
  const titleY = bandY + bandH * 0.62;
  const titleGrad = ctx.createLinearGradient(0, titleY - titlePx, 0, titleY + titlePx * 0.2);
  titleGrad.addColorStop(0, grade.title[0]);
  titleGrad.addColorStop(0.55, grade.title[1]);
  titleGrad.addColorStop(1, grade.title[2]);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = grade.titleStroke;
  ctx.lineWidth = titlePx * 0.16;
  ctx.strokeText(title, pad, titleY);
  ctx.fillStyle = titleGrad;
  ctx.fillText(title, pad, titleY);
  // Crisp inner highlight: the same letters, thinner, shifted up a touch.
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(title, pad, titleY - titlePx * 0.03);
  ctx.restore();

  const sub = (state.subtitle || '').toUpperCase();
  if (sub) {
    const subPx = fitFont(ctx, sub, W - pad * 2, H * 0.032, `'Helvetica Neue', system-ui, sans-serif`, 700);
    ctx.font = `700 ${subPx}px 'Helvetica Neue', system-ui, sans-serif`;
    ctx.fillStyle = grade.subtitle;
    ctx.globalAlpha = 0.92;
    ctx.fillText(sub, pad, titleY + subPx * 1.9);
    ctx.globalAlpha = 1;
  }
}

function drawCornerTag(ctx, W, H, grade) {
  const tag = 'VICE PANELS • ORIGINAL';
  const px = Math.max(11, W * 0.016);
  ctx.font = `800 ${px}px 'Helvetica Neue', system-ui, sans-serif`;
  const tw = ctx.measureText(tag).width;
  const padX = W * 0.02;
  const padY = H * 0.014;
  ctx.fillStyle = 'rgba(8,4,18,0.55)';
  ctx.fillRect(W * 0.02, H * 0.02, tw + padX * 2, px + padY * 2);
  ctx.fillStyle = grade.paper;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(tag, W * 0.02 + padX, H * 0.02 + (px + padY * 2) / 2);
}

export function drawCover(canvas, state, photos, W, H) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const grade = gradeOf(state.grade);
  ctx.fillStyle = '#120a1e';
  ctx.fillRect(0, 0, W, H);
  const rects = panelRects(state);
  rects.forEach((r, i) => {
    const panel = state.panels[i];
    const rx = r.x * W;
    const ry = r.y * H;
    const rw = r.w * W;
    const rh = r.h * H;
    const img = panel ? photos.get(panel.slot) : null;
    if (img) drawPhotoCover(ctx, img, rx, ry, rw, rh, panel.zoom, panel.ox, panel.oy);
    else drawPlaceholder(ctx, rx, ry, rw, rh, grade);
  });
  gradeWash(ctx, W, H, grade);
  // Thin paper-white seams between the panels.
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = Math.max(2, W * 0.004);
  rects.forEach((r) => {
    ctx.strokeRect(r.x * W + 1, r.y * H + 1, r.w * W - 2, r.h * H - 2);
  });
  drawCaption(ctx, W, H, state, grade);
  drawCornerTag(ctx, W, H, grade);
  return canvas;
}

// Which panel (if any) sits under a point given in canvas pixels.
export function panelAt(state, canvas, px, py) {
  const rects = panelRects(state);
  const W = canvas.width;
  const H = canvas.height;
  for (let i = rects.length - 1; i >= 0; i -= 1) {
    const r = rects[i];
    if (px >= r.x * W && px <= (r.x + r.w) * W && py >= r.y * H && py <= (r.y + r.h) * H) return i;
  }
  return -1;
}
