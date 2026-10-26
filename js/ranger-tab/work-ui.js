// DOM for the work run, all built from PROJECTS (projects.js): the copy block
// and button per project, the Reduce Motion stills, the side scroll tracker,
// and the pin lengths. Everything moves by transform; nothing starts at opacity 0.
import { PROJECTS, accentOf, glowOf, inkOf, hotOf, counterOf } from './projects.js';
import { WORK_LEN } from './work.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ARROW = '<svg class="rt-btn-arrow" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>';

const vars = (p) => `--acc:${accentOf(p)};--glow:${glowOf(p)};--ink:${inkOf(p)};--hot:${hotOf(p)}`;
function block(p, i, live) {
  return `<div class="rt-proj" data-i="${i}" style="${vars(p)}">
    <div class="rt-proj-in">
      <div class="rt-proj-text"><p class="rt-proj-idx">${counterOf(i)}</p><h2 class="rt-proj-name">${esc(p.name.toUpperCase())}</h2><p class="rt-proj-line">${esc(p.line)}</p></div>
      <a class="rt-btn" href="${esc(p.url)}" target="_blank" rel="noopener" data-id="${esc(p.id)}"${live ? ' tabindex="-1"' : ''}
        aria-label="Visit ${esc(p.name)} (opens in a new tab)"><span>VISIT SITE</span>${ARROW}</a>
    </div>
  </div>`;
}

// Pin lengths follow the array: 150vh of unravel, then (WORK_LEN + 1) x 100vh of run.
// lead: vh of scroll before the work run starts (the unravel, or with tear
// only the tab stilling and the lines laying flat).
export function sizePin({ pin, run, unravel, lead = 150 }) {
  const runVh = (WORK_LEN + 1) * 100;
  run.style.height = runVh + 'vh';
  run.style.top = lead + 'vh';
  pin.style.height = lead + runVh + 'vh';
  if (unravel) unravel.style.height = 100 + lead + 'vh';
}

export function buildCopy(hero) {
  hero.insertAdjacentHTML('beforeend', PROJECTS.map((p, i) => block(p, i, true)).join(''));
  return [...hero.querySelectorAll(':scope > .rt-proj')];
}

export function buildStills(section) {
  section.innerHTML = PROJECTS.map((p, i) => `<figure class="rt-still" data-i="${i}">
    <img alt="${esc(p.name)}, drawn in scanline dots" width="1440" height="900">${block(p, i, false)}</figure>`).join('');
  return [...section.querySelectorAll('.rt-still')];
}

// Copy for project i rises in as its object settles (end of its scatter, into
// the hold) and leaves at the very start of the next scatter, before the cloud.
// 0 = in place, 1 = below its clip box, -1 = above.
export function slide(i, u) {
  const s = u - i;
  if (s < 0.6) return 1 - smooth(0.26, 0.36, s);
  if (s < 1.5) return -smooth(1.0, 1.066, s);
  return -1;
}

export function buildTracker(hero, { holdU, scrollToU, reduce }) {
  const nav = document.createElement('nav');
  nav.className = 'rt-track';
  nav.setAttribute('aria-label', 'Work projects');
  nav.innerHTML = `<p class="rt-track-count" aria-live="polite">${counterOf(0)}</p>
    <div class="rt-track-rail"><div class="rt-track-fill"></div>
    ${PROJECTS.map((p, i) => `<button type="button" class="rt-tick" data-i="${i}" style="top:${(holdU(i) / WORK_LEN * 100).toFixed(2)}%;${vars(p)}"
      aria-label="Go to ${esc(p.name)}"><span class="rt-tick-name">${esc(p.name)}</span><span class="rt-tick-dot"></span></button>`).join('')}
    </div><p class="rt-track-now"></p>`;
  hero.appendChild(nav);
  const ticks = [...nav.querySelectorAll('.rt-tick')];
  const fill = nav.querySelector('.rt-track-fill');
  const count = nav.querySelector('.rt-track-count');
  const now = nav.querySelector('.rt-track-now');
  ticks.forEach((b, i) => b.addEventListener('click', () => scrollToU(holdU(i), reduce())));
  // Hit areas are 44px tall unless the ticks sit closer than that; then each
  // takes exactly its share of the rail, so neighbours never overlap.
  const rail = nav.querySelector('.rt-track-rail');
  const fit = () => { nav.style.setProperty('--tick-h', Math.min(44, Math.floor(rail.clientHeight / WORK_LEN)) + 'px'); };
  if (window.ResizeObserver) new ResizeObserver(fit).observe(rail);
  fit();
  let last = { on: null, act: -2, f: -1 };
  function update(u) {
    const on = u > 0.12 && u < WORK_LEN - 0.08;
    const act = u >= PROJECTS.length ? -1 : clamp(Math.floor(u), 0, PROJECTS.length - 1);
    const f = clamp(u / WORK_LEN, 0, 1);
    if (on !== last.on) {
      nav.classList.toggle('is-on', on);
      ticks.forEach((b) => { b.tabIndex = on ? 0 : -1; });
      nav.setAttribute('aria-hidden', on ? 'false' : 'true');
    }
    if (act !== last.act) {
      ticks.forEach((b, i) => { b.classList.toggle('is-active', i === act); b.setAttribute('aria-current', i === act ? 'step' : 'false'); });
      const p = PROJECTS[act < 0 ? PROJECTS.length - 1 : act];
      count.textContent = counterOf(act < 0 ? PROJECTS.length - 1 : act);
      now.textContent = p.name;
      for (const [k, v] of vars(p).split(';').map((d) => d.split(':'))) nav.style.setProperty(k, v);
    }
    if (Math.abs(f - last.f) > 0.0005) fill.style.transform = `scaleY(${f.toFixed(4)})`;
    last = { on, act, f };
  }
  return { nav, ticks, update };
}
