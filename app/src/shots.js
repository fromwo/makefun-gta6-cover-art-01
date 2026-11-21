// Vice Panels — deterministic screenshots via ?shot=.
//
//   ?shot=cover&photo=pier&caption=Sunset%20Heist
//   ?shot=editor&photo=boulevard&caption=Boulevard%20Queen
//
// shot=cover hides the editor chrome and paints the cover edge to edge, so a
// headless browser can screenshot exactly the exported art. shot=editor
// shows the full editor with a photo loaded. Extra knobs: grade, layout,
// size (an EXPORT_SIZES id) and subtitle. When the cover is ready the page
// sets window.__vpReady = true so a screenshot script knows when to shoot.

import { EXPORT_SIZES, fitPanelsToLayout } from './state.js';

export async function applyShotParams(state, editor, params) {
  const shot = params.get('shot') ?? 'editor';
  const photo = params.get('photo');
  const caption = params.get('caption');
  const subtitle = params.get('subtitle');
  const grade = params.get('grade');
  const layout = params.get('layout');
  const size = params.get('size');
  const focus = params.get('focus'); // 'top' keeps heads in frame on wide panels

  if (caption) state.title = caption;
  if (subtitle) state.subtitle = subtitle;
  if (grade && ['sunset', 'neon', 'dusk'].includes(grade)) state.grade = grade;
  if (layout && ['hero', 'four', 'split'].includes(layout)) {
    state.layout = layout;
    fitPanelsToLayout(state);
  }
  if (size && EXPORT_SIZES.some((s) => s.id === size)) state.exportSize = size;

  if (photo === 'pier' || photo === 'boulevard') {
    try {
      await editor.loadSample(photo);
      state.panels.forEach((panel) => {
        panel.slot = photo;
        if (focus === 'top') panel.oy = 0.18;
        if (focus === 'bottom') panel.oy = -0.18;
      });
    } catch {
      // No sample: the cover still renders with placeholders.
    }
  }

  document.body.dataset.shot = shot;
  editor.render();
  if (shot === 'cover') editor.renderFull();
  window.__vpReady = true;
  document.documentElement.dataset.ready = 'true';
  return shot;
}
