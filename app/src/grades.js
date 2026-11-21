// Vice Panels — colour grades. Each grade is an original palette: a warm
// sky gradient washed over the photos, a caption gradient, and the ink and
// paper colours the lettering sits on. No licensed artwork, no game assets.

export const GRADES = {
  sunset: {
    label: 'Sunset',
    // sky wash, top to bottom, drawn with 'soft-light' over the photos
    wash: ['#ff9a3c', '#ff5e78', '#7b2ff7'],
    // caption letters, top to bottom
    title: ['#fff3d6', '#ffb347', '#ff5e62'],
    titleStroke: '#2b0a3d',
    subtitle: '#ffe9c9',
    band: 'rgba(20, 4, 32, 0.62)',
    accent: '#ffb347',
    paper: '#fff3d6',
  },
  neon: {
    label: 'Neon',
    wash: ['#00e5ff', '#ff2fb3', '#7b2ff7'],
    title: ['#e8fbff', '#4de8ff', '#ff4fd8'],
    titleStroke: '#0a1030',
    subtitle: '#c8f6ff',
    band: 'rgba(6, 8, 38, 0.66)',
    accent: '#4de8ff',
    paper: '#e8fbff',
  },
  dusk: {
    label: 'Dusk',
    wash: ['#f7b733', '#c86dd7', '#2b1055'],
    title: ['#fdf0d5', '#f7b733', '#c86dd7'],
    titleStroke: '#1d0b2e',
    subtitle: '#f3ddba',
    band: 'rgba(24, 8, 40, 0.64)',
    accent: '#f7b733',
    paper: '#fdf0d5',
  },
};

export function gradeOf(name) {
  return GRADES[name] ?? GRADES.sunset;
}
