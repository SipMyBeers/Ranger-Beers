// The work run's projects. This array is the ONLY place a project is defined:
// the scroll length, the flock targets and palettes (work.js), the copy blocks,
// buttons, Reduce Motion stills and the side tracker (work-ui.js) all read it.
// Add a project by adding an entry; order here is scroll order. Neighbours are
// kept apart in hue (warm accents alternate with cool ones).
//
// Fields:
//   id       stable slug, used for DOM ids and test hooks
//   name     display name (shown upper-case on the hero, as typed in the tracker)
//   line     the one line of copy under the name, from the live site
//   url      the live site, opened in a new tab by the project's button
//   palette  five [r, g, b] stops, dark to bright, measured off the live site
//            or its logo (homepage capture, 1440 wide). Stop 0 is the ground;
//            stop 3 is the accent (name, button fill, tracker light) unless
//            accent is given; stop 4 is the hot highlight.
//   accent   optional [r, g, b] for the name, button and tracker, when the
//            brand colour is not the stop-3 tone of the shading ramp
//   object   the signature shape the dots form, a key of FACTORIES (objects.js):
//            magnifier, terrain, record, coin, radar, padlock, sticker,
//            mirror, headset, drum, relief-boarhog, relief-numinous, relief-clef
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
  {
    // Ground, olive, die red and engraving gold off the Rollick Reserve note.
    id: 'rollick', name: 'Rollick', line: 'Roll for the price.', url: 'https://rollick.bet/',
    palette: [[13, 17, 8], [81, 80, 43], [166, 36, 25], [213, 191, 100], [246, 236, 196]],
    object: 'coin',
  },
  {
    // Black ground, link blue, the scope blue, white.
    id: 'scopeweb', name: 'Scopeweb', line: 'Domain answers, working shown.', url: 'https://scopeweb.io/',
    palette: [[4, 6, 10], [27, 40, 70], [101, 141, 232], [118, 182, 228], [236, 244, 255]],
    object: 'radar',
  },
  {
    // Gold and green from the BullpenLM favicon, warm brown ground.
    id: 'bullpenlm', name: 'BullpenLM', line: 'Learn to sell anything.', url: 'https://bullpenlm.com/',
    palette: [[12, 10, 10], [63, 40, 38], [111, 179, 138], [216, 161, 58], [242, 228, 190]],
    object: 'headset',
  },
  {
    // Terminal green on cyan, near-black ground.
    id: 'killsesh', name: 'KillSesh', line: "Terminating what shouldn't exist.", url: 'https://killsesh.com/',
    palette: [[10, 10, 15], [14, 40, 48], [27, 158, 179], [0, 254, 135], [215, 255, 236]],
    object: 'padlock',
  },
  {
    // Talent Buyers Network stage rust and ember browns.
    id: 'tbn', name: 'TBN', line: 'Talent buying and booking.', url: 'https://tbn-website-preview.pages.dev/demo',
    palette: [[18, 12, 14], [64, 20, 23], [110, 52, 28], [188, 89, 70], [240, 222, 205]],
    object: 'drum',
  },
  {
    // GifStix sky, the favicon pink, the cream sticker panel.
    id: 'stix', name: 'GifStix / MemeStix', line: 'Meme stickers, collectible packs.', url: 'https://gifstix.com/',
    palette: [[8, 12, 28], [74, 95, 126], [255, 47, 180], [90, 155, 220], [236, 233, 216]],
    object: 'sticker',
  },
  {
    // Midnight ground, the Numinous lavender mark, the orange call to action.
    id: 'numinous', name: 'Numinous Designs', line: 'Experiences that move you.', url: 'https://numinous-redesign.vercel.app/',
    palette: [[11, 9, 25], [69, 61, 101], [148, 103, 97], [255, 107, 53], [229, 218, 234]],
    object: 'relief-numinous',
  },
  {
    // Navy, wordmark blue, swoosh gold, cream from the Boarhog logo.
    id: 'boarhog', name: 'Boarhog', line: 'Mission-critical defense solutions.', url: 'https://www.boarhogllc.com/',
    palette: [[10, 16, 36], [10, 55, 130], [86, 117, 169], [225, 159, 42], [250, 225, 186]],
    accent: [86, 117, 169],
    object: 'relief-boarhog',
  },
  {
    // Night ground, Air Force sky teal, the clef gold, white.
    id: 'maxcrofton', name: 'Max Crofton', line: 'Tubist, U.S. Air Force Band.', url: 'https://maxcrofton.pages.dev/',
    palette: [[8, 10, 14], [6, 77, 104], [72, 134, 157], [194, 168, 120], [237, 237, 235]],
    object: 'relief-clef',
  },
  {
    // Pixel-field purples and the DITTO IT pink.
    id: 'dittomethis', name: 'DittoMeThis', line: 'Adopt a pet Ditto.', url: 'https://dittomethis.com/',
    palette: [[16, 2, 25], [80, 16, 108], [160, 32, 184], [255, 24, 120], [255, 214, 236]],
    object: 'mirror',
  },
];

const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
const rgba = (c, a) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;
const acc = (p) => p.accent || p.palette[3];
// WCAG relative luminance and contrast, to pick the button's text colour.
const lum = (c) => c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); })
  .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
export const accentOf = (p) => hex(acc(p));
export const glowOf = (p, a = 0.55) => rgba(acc(p), a);
// The ground ink on the accent, unless white reads better on it.
export const inkOf = (p) => (contrast(acc(p), p.palette[0]) >= contrast(acc(p), [255, 255, 255]) ? hex(p.palette[0]) : '#ffffff');
export const hotOf = (p) => hex(p.palette[4]);
// "01 / 13": position in the run over the length of this array.
export const counterOf = (i) => `${String(i + 1).padStart(2, '0')} / ${String(PROJECTS.length).padStart(2, '0')}`;
