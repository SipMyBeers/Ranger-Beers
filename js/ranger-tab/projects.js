// The work run's projects. This array is the ONLY place a project is defined:
// the scroll length, the flock targets and palettes (work.js), the copy blocks,
// buttons, Reduce Motion stills and the side tracker (work-ui.js) all read it.
// Add a project by adding an entry; order here is scroll order.
//
// Fields:
//   id       stable slug, used for DOM ids and test hooks
//   name     display name (shown upper-case on the hero, as typed in the tracker)
//   line     the one line of copy under the name
//   url      the live site, opened in a new tab by the project's button
//   palette  five [r, g, b] stops, dark to bright, taken from the site.
//            Stop 0 is the ground and the button ink; stop 3 is the accent
//            (name, button fill, tracker light); stop 4 is the hot highlight.
//   object   signature shape the dots form: 'magnifier' | 'terrain' | 'record'
export const PROJECTS = [
  {
    id: 'lootlens', name: 'LootLens', line: 'AI resale scanner for iOS.', url: 'https://lootlens.ai/',
    palette: [[20, 4, 24], [90, 16, 80], [200, 20, 30], [244, 176, 32], [255, 240, 190]],
    object: 'magnifier',
  },
  {
    id: 'ironparse', name: 'IronParse', line: 'Mainframe COBOL, modernized.', url: 'https://ironparse.com/',
    palette: [[4, 10, 24], [10, 50, 90], [30, 150, 190], [100, 230, 240], [240, 250, 255]],
    object: 'terrain',
  },
  {
    id: 'aurajam', name: 'AuraJam', line: 'AI DJ transitions.', url: 'https://aurajam.com/',
    palette: [[14, 4, 20], [80, 20, 90], [220, 60, 160], [255, 140, 200], [255, 235, 250]],
    object: 'record',
  },
];

const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
const rgba = (c, a) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;
export const accentOf = (p) => hex(p.palette[3]);
export const glowOf = (p, a = 0.55) => rgba(p.palette[3], a);
export const inkOf = (p) => hex(p.palette[0]);
export const hotOf = (p) => hex(p.palette[4]);
// "01 / 03": position in the run over the length of this array.
export const counterOf = (i) => `${String(i + 1).padStart(2, '0')} / ${String(PROJECTS.length).padStart(2, '0')}`;
