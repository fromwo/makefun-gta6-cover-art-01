// Fixed scenes for screenshots: ?shot=editor shows the editor with sample
// photos loaded; ?shot=cover shows the finished cover alone (controls
// hidden). Query knobs: photo / photo2 / photo3 (sample names), title,
// subtitle, layout, grade, size (1080x1080, 1080x1350 or 1920x1080).
// window.__shotReady is set once the scene has painted.

export async function runShot(shot, query, apply) {
  const size = query.get('size') ?? '1080x1080';
  const scene = {
    layout: query.get('layout') ?? 'hero',
    grade: query.get('grade') ?? 'sunset',
    title: query.get('title') ?? 'Boulevard Queen',
    subtitle: query.get('subtitle') ?? 'one last score',
    size,
    photos: [
      `samples/${query.get('photo') ?? 'boulevard'}.jpg`,
      `samples/${query.get('photo2') ?? 'pier'}.jpg`,
      `samples/${query.get('photo3') ?? 'boulevard'}.jpg`,
    ],
  };
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await apply(scene);
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
