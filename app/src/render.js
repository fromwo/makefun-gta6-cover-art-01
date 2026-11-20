// Draws the whole cover onto a canvas 2D context: photo panels with a
// Vice City colour grade, then the bold gradient caption band at the foot.
// `state` carries layout, grade, title, subtitle, photos and per-panel
// crop settings; `photos` are HTMLImageElements (or null for empty slots).

import { CAPTION_FRACTION, layoutPanels, panelPixels } from './panels.js';

const GRADES = {
  sunset: {
    wash: ['rgba(255,122,24,0.10)', 'rgba(255,45,120,0.28)'],
    band: ['#1c0b2e', '#3d0f4a'],
    title: ['#ffe259', '#ff7a18', '#ff2d78'],
  },
  neon: {
    wash: ['rgba(0,229,255,0.14)', 'rgba(255,45,149,0.30)'],
    band: ['#04122b', '#2b0f54'],
    title: ['#7df9ff', '#00e5ff', '#ff2d95'],
  },
  dusk: {
    wash: ['rgba(88,60,180,0.16)', 'rgba(20,10,60,0.34)'],
    band: ['#0d0a24', '#241145'],
    title: ['#e6d5ff', '#b388ff', '#ff7ad9'],
  },
};

/** Draws one photo into a panel rect, honouring zoom (1 = fit) and pan offsets. */
export function drawPhotoInPanel(ctx, img, rect, zoom, panX, panY) {
  if (!img) return;
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const scale = base * zoom;
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const cx = rect.x + rect.w / 2 + panX * rect.w;
  const cy = rect.y + rect.h / 2 + panY * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, cx - pw / 2, cy - ph / 2, pw, ph);
  ctx.restore();
}

/** Fills a panel that has no photo yet with a sunset placeholder gradient. */
export function drawEmptyPanel(ctx, rect, index) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  const hues = [['#ff7a18', '#ff2d78'], ['#7a2bff', '#ff2d78'], ['#00b4d8', '#7a2bff'], ['#ffb703', '#fb8500']];
  const [a, b] = hues[index % hues.length];
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `800 ${Math.round(rect.h * 0.09)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
}

/** Warm/cool wash + vignette that gives the poster its sunset-or-neon grade. */
function gradeWash(ctx, rect, grade) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  g.addColorStop(0, grade.wash[0]);
  g.addColorStop(1, grade.wash[1]);
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const v = ctx.createRadialGradient(
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) * 0.35,
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(rect.w, rect.h) * 0.75,
  );
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(10,0,25,0.38)');
  ctx.fillStyle = v;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

/** The caption band: dark gradient, big gradient title, letterspaced subtitle. */
function captionBand(ctx, w, h, state, grade) {
  const bandY = h * (1 - CAPTION_FRACTION);
  const bandH = h * CAPTION_FRACTION;
  const g = ctx.createLinearGradient(0, bandY, 0, h);
  g.addColorStop(0, grade.band[0]);
  g.addColorStop(1, grade.band[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, bandY, w, bandH);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillRect(0, bandY, w, Math.max(2, h * 0.004));

  const title = (state.title || '').trim().toUpperCase();
  if (title) {
    let size = bandH * 0.52;
    const face = `"Arial Black", Impact, "Helvetica Neue", sans-serif`;
    ctx.font = `900 ${size}px ${face}`;
    while (ctx.measureText(title).width > w * 0.92 && size > 10) {
      size -= 2;
      ctx.font = `900 ${size}px ${face}`;
    }
    const tg = ctx.createLinearGradient(0, bandY, 0, bandY + bandH * 0.62);
    tg.addColorStop(0, grade.title[0]);
    tg.addColorStop(0.5, grade.title[1]);
    tg.addColorStop(1, grade.title[2]);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, size * 0.09);
    ctx.strokeStyle = 'rgba(20,4,32,0.95)';
    ctx.shadowColor = 'rgba(255,45,120,0.55)';
    ctx.shadowBlur = size * 0.18;
    ctx.shadowOffsetY = size * 0.04;
    const ty = bandY + bandH * 0.34;
    ctx.strokeText(title, w / 2, ty);
    ctx.fillStyle = tg;
    ctx.fillText(title, w / 2, ty);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }

  const sub = (state.subtitle || '').trim();
  if (sub) {
    const size = Math.max(10, bandH * 0.16);
    ctx.font = `600 ${size}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    const spaced = sub.toUpperCase().split('').join(' ');
    ctx.fillText(spaced, w / 2, bandY + bandH * 0.82, w * 0.92);
  }
}

/** Draws the full cover for `state` onto `canvas` (uses its own pixel size). */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  ctx.fillStyle = '#12081d';
  ctx.fillRect(0, 0, w, h);
  const rects = layoutPanels(state.layout);
  rects.forEach((unit, i) => {
    const rect = panelPixels(unit, w, h);
    const slot = state.panelPhotos[i] ?? 0;
    const photo = state.photos[slot] ?? null;
    const crop = state.crops[i] ?? { zoom: 1, panX: 0, panY: 0 };
    if (photo) drawPhotoInPanel(ctx, photo, rect, crop.zoom, crop.panX, crop.panY);
    else drawEmptyPanel(ctx, rect, i);
    gradeWash(ctx, rect, grade);
    ctx.strokeStyle = 'rgba(18,8,29,0.9)';
    ctx.lineWidth = Math.max(2, w * 0.006);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    if (i === state.selected) {
      ctx.strokeStyle = '#ffe259';
      ctx.lineWidth = Math.max(3, w * 0.008);
      ctx.setLineDash([Math.max(8, w * 0.02), Math.max(6, w * 0.012)]);
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      ctx.setLineDash([]);
    }
  });
  captionBand(ctx, w, h, state, grade);
  // Thin outer frame, poster style.
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = Math.max(2, w * 0.004);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
}

/** Picks the panel index whose pixel rect contains (x, y), or -1. */
export function panelAt(state, x, y, w, h) {
  const rects = layoutPanels(state.layout);
  for (let i = rects.length - 1; i >= 0; i -= 1) {
    const r = panelPixels(rects[i], w, h);
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
}
