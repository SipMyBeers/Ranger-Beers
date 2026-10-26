// Ranger tab hero: a real-time 3D Ranger tab rendered as glowing wavy
// scanline stipple (after Dither Boy v3 "Glitch Art").
// Mountable: mount(containerEl, opts) -> { destroy, ready, api }.
// opts: { motion, palette: 'reference' | 'gold', quietEl }
//
// Clocks:
//   time    idle yaw +/-24deg on a 9s period with a constant 8deg pitch, a small float, a light sweep every 5s
//   intro   rows scan on bottom-left to top-right over 1.2s
//   pointer tilt toward the cursor (critically damped spring); rows ripple harder and ridge lines bump near it
//   scroll  as the hero leaves, the tab pitches back 25deg and ridge lines stretch and stream up
//   glitch  every 6-9s (never in the first 2s) a 120-250ms band offset with a stronger chroma split
//   ambient 40 glitter dots drift up
//   reveal  opts.pinEl (a tall wrapper around a sticky hero) gives progress p 0..1,
//           smoothed by the spring: the tab stills (0-.15), unravels row by row into
//           the ridge field (.15-.8), then the ridge lines part like curtains (.8-1).
//           Pure function of p, so scrolling back rebuilds it. opts.onProgress(p).
//   work    opts.workEl (a marker whose top is where the unravel ends) gives u 0..3.3
//           viewports of scroll: the dots fly into LootLens, IronParse, AuraJam,
//           then home. opts.work = true builds it without scroll (Reduce Motion stills).
//           opts.onWork(u). See work.js.
//   input   the key light follows the pointer (flashlight); a tap sends a shockwave
//           through the ridge lines plus a 150ms glitch; a drag spins the tab with inertia.
// Reduced motion renders one static frame unless opts.motion === true.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildTab } from './geometry.js';
import { makeScanlinePass, MAX_PTS, ROW, DOT } from './scanline.js';
import { makeParticles } from './particles.js';
import { makeBloom } from './bloom.js';
import { makeWork, WORK_LEN } from './work.js';

const SVG_URL = new URL('../../images/badges/src/ranger-tab-wikimedia.svg', import.meta.url);
export const FALLBACK_URL = new URL('../../images/badges/ranger-tab-dither.png', import.meta.url).href;

const DEG = Math.PI / 180;
const TAB_W = 10; // world units
const FOV = 28;
const PITCH = 8 * DEG; // constant tilt: top edge toward the viewer so the top wall shows
const INTRO_S = 1.2;
const SWEEP_EVERY = 5;
const SWEEP_S = 1.4;
const SWEEP_FIRST = 2.0;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const KEY_REST = new THREE.Vector3(-9, 2.5, 3.2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

// Implicit critically damped spring (stable at any dt).
function spring(s, target, w, dt) {
  const f = 1 + 2 * dt * w;
  const ww = dt * dt * w * w;
  const x1 = (f * s.x + dt * s.v + ww * target) / (f + ww);
  s.v = (x1 - s.x) / dt;
  s.x = x1;
}

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function showFallback(container) {
  const img = document.createElement('img');
  img.src = FALLBACK_URL;
  img.alt = 'Ranger tab';
  const w = container.clientWidth;
  const frac = w <= 600 ? 88 : w >= 1200 ? 56 : 88 - ((w - 600) / 600) * 32;
  img.style.cssText = `position:absolute;left:50%;top:44%;width:${frac}%;height:auto;transform:translate(-50%,-50%);`;
  container.appendChild(img);
  return { destroy: () => img.remove(), ready: Promise.resolve('fallback'), api: { mode: 'fallback' } };
}

function makeMaterials() {
  return {
    gold: new THREE.MeshStandardMaterial({ color: 0xc99a14, metalness: 0.9, roughness: 0.42 }),
    // Material ids ride in alpha (body 1, wall .9, letters .75, field .5). With
    // NoBlending and transparent off, three skips the OPAQUE define, so opacity
    // reaches the target untouched and the dither pass can tell them apart.
    goldSide: new THREE.MeshStandardMaterial({ color: 0x8c6a0e, metalness: 0.85, roughness: 0.55, opacity: 0.9, blending: THREE.NoBlending }),
    letters: new THREE.MeshStandardMaterial({ color: 0xffcc33, metalness: 0.9, roughness: 0.3, emissive: 0x5a3c00, opacity: 0.75, blending: THREE.NoBlending }),
    field: new THREE.MeshStandardMaterial({ color: 0x0c0b09, metalness: 0.25, roughness: 0.55, opacity: 0.5, blending: THREE.NoBlending }),
  };
}

function makeLights(scene) {
  const key = new THREE.DirectionalLight(0xfff1d6, 3.2); // rakes across the face from the left
  key.position.set(-9, 2.5, 3.2);
  const fill = new THREE.DirectionalLight(0xffffff, 0.35);
  fill.position.set(6, -3, 6);
  const sweep = new THREE.PointLight(0xfff6dc, 0, 0, 2);
  scene.add(key, fill, sweep);
  return { key, fill, sweep };
}

export function mount(container, opts = {}) {
  if (!webglAvailable()) return showFallback(container);

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches && opts.motion !== true;
  const palette = opts.palette === 'gold' ? 'gold' : 'reference';

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
  } catch {
    return showFallback(container);
  }
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x0a0a0a, 1);
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.55;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
  const lights = makeLights(scene);
  const mats = makeMaterials();

  const sceneRT = new THREE.WebGLRenderTarget(1, 1, {
    minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true,
  });
  // Particles: own target with its own depth, primed by a depth-only tab pass.
  const partRT = new THREE.WebGLRenderTarget(1, 1, {
    minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true,
  });
  const depthMat = new THREE.MeshBasicMaterial({ colorWrite: false });
  // Normals + relative depth: drives row bending and the hue-by-normal map.
  const normRT = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true,
  });
  const normMat = new THREE.ShaderMaterial({
    blending: THREE.NoBlending,
    uniforms: { uZRef: { value: 0 } },
    vertexShader: `varying vec3 vN; varying float vZ;
      void main() { vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vZ = mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uZRef; varying vec3 vN; varying float vZ;
      void main() { gl_FragColor = vec4(normalize(vN), vZ - uZRef); }`,
  });
  const keyView = new THREE.Vector3();
  const particles = makeParticles(40);
  const pass = makeScanlinePass(sceneRT.texture, normRT.texture, partRT.texture, palette);
  const bloom = makeBloom(pass.ground);
  const U = pass.uniforms;
  const G = bloom.uniforms;
  G.uSwap.value = palette === 'gold' ? 0 : 1;
  // opts.tear: the work run starts on the whole, stilled tab and tears it apart
  // (no unravel); see work.js seedFromTab.
  const tear = !!opts.tear;
  const work = opts.workEl || opts.work ? makeWork({ scene, U, lights, camera, tear }) : null;

  const pivot = new THREE.Group(); // tilt + yaw
  scene.add(pivot);
  let tab = null;
  let view = { visW: 1, visH: 1, cssH: 1 };

  const st = {
    tiltX: { x: 0, v: 0 }, tiltY: { x: 0, v: 0 },
    pointer: { nx: 0, ny: 0, px: 0, py: 0, active: false },
    trail: [], scroll: 0, running: false, visible: true, raf: 0,
    clockOffset: 0, last: 0, frames: [], errors: 0, sweepOverride: null,
    glitchAt: 2 + 6 + Math.random() * 3, glitchLen: 0.18, glitchSeed: 1, glitchOverride: null,
    p: { x: 0, v: 0 }, pRaw: 0, frozen: null, u: { x: 0, v: 0 }, uRaw: 0,
    keyX: { x: KEY_REST.x, v: 0 }, keyY: { x: KEY_REST.y, v: 0 },
    spin: { x: 0, v: 0 }, drag: null, shocks: [], burstUntil: -1,
  };
  const box = new THREE.Box3();
  const corner = new THREE.Vector3();
  const t0 = performance.now() / 1000;
  const now = () => (st.frozen !== null ? st.frozen : performance.now() / 1000 - t0 + st.clockOffset);

  function layout() {
    const w = Math.max(1, container.clientWidth);
    const h = Math.max(1, container.clientHeight);
    renderer.setSize(w, h, false);
    sceneRT.setSize(w, h);
    normRT.setSize(w, h);
    partRT.setSize(w, h);
    bloom.setSize(renderer.domElement.width, renderer.domElement.height, dpr);
    pass.setSize(w, h, dpr);
    const aspect = w / h;
    camera.aspect = aspect;
    // Set back in the field: ~75% of a phone, ~55% of a desktop, so ridge lines frame it.
    const frac = w <= 600 ? 0.75 : w >= 1200 ? 0.55 : 0.75 - ((w - 600) / 600) * 0.2;
    const tanH = Math.tan((FOV / 2) * DEG);
    let dist = TAB_W / frac / (2 * tanH * aspect);
    const tabH = tab ? tab.h : TAB_W * 0.41;
    if (tabH / (2 * dist * tanH) > 0.62) dist = tabH / 0.62 / (2 * tanH);
    const visH = 2 * dist * tanH;
    // Camera a touch low so the tab sits above centre with more lines below it;
    // on desktop a little right so the copy block clears it.
    const desk = clamp((w - 700) / 500, 0, 1);
    const lift = (0.07 - 0.04 * desk) * visH;
    const shift = 0.05 * desk * visH * aspect;
    view = { visW: visH * aspect, visH, cssW: w, cssH: h, dist, tanH, aspect, lift, shift };
    camera.position.set(-shift, -lift, dist);
    camera.lookAt(-shift, -lift, 0);
    camera.updateProjectionMatrix();
    U.uRadius.value = 120 * dpr;
    normMat.uniforms.uZRef.value = -dist;
    U.uTopo.value = (h / visH) * 0.18;
    if (tab) st.capRows = (tab.capRatio * (TAB_W / view.visW) * w) / ROW;
  }

  // Glitch: 120-250ms every 6-9s, never in the first 2s.
  function glitchLevel(t) {
    if (st.glitchOverride !== null) return st.glitchOverride;
    if (t >= st.glitchAt + st.glitchLen) {
      st.glitchAt = t + 6 + Math.random() * 3;
      st.glitchLen = 0.12 + Math.random() * 0.13;
      st.glitchSeed = Math.random() * 100;
    }
    return t >= st.glitchAt && t >= 2 ? 1 : 0;
  }

  // Optional overlay (name + roles) to keep clear of bright dust.
  function quietRect() {
    if (!opts.quietEl) return null;
    const c = container.getBoundingClientRect();
    const r = opts.quietEl.getBoundingClientRect();
    return { x0: r.left - c.left - 16, y0: r.top - c.top - 16, x1: r.right - c.left + 16, y1: r.bottom - c.top + 16 };
  }

  function sweepPhase(t) {
    if (st.sweepOverride !== null) return st.sweepOverride;
    if (t < SWEEP_FIRST) return -1;
    const p = ((t - SWEEP_FIRST) % SWEEP_EVERY) / SWEEP_S;
    return p <= 1 ? p : -1;
  }

  function project(x) {
    const v = new THREE.Vector3(x, 0, 0).project(camera);
    return v.x * 0.5 + 0.5;
  }

  function updateTrail(t) {
    const pts = U.uPts.value;
    const ages = U.uAge.value;
    for (let i = 0; i < MAX_PTS; i++) {
      const p = st.trail[i];
      if (!p) { pts[i].set(-1e5, -1e5, 0, 0); ages[i] = 99; continue; }
      pts[i].set(p.x, p.y, p.vx, p.vy);
      ages[i] = Math.max(0, t - p.t);
    }
  }

  // Tab extent on screen (css px), from its world bounding box.
  function tabRect() {
    if (!tab) return null;
    box.setFromObject(tab.group);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (let i = 0; i < 8; i++) {
      corner.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).project(camera);
      const x = (corner.x * 0.5 + 0.5) * view.cssW;
      const y = (0.5 - corner.y * 0.5) * view.cssH;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
    return { x0, x1, y0, y1 };
  }

  function step(t, dt) {
    const motion = !reduce;
    if (motion && dt > 0) spring(st.p, st.pRaw, 9, dt);
    const p = motion ? clamp(st.p.x, 0, 1) : 0;
    // Sway damps to still before the unravel (tear: before the work run tears the tab).
    const still = tear ? smooth(0, 0.5, p) : smooth(0, 0.15, p);
    const intro = motion ? clamp(t / INTRO_S, 0, 1) : 1;
    U.uIntro.value = motion ? easeOut(intro) : 1;
    U.uT.value = motion ? t : 3.7;
    U.uScroll.value = st.scroll;
    pass.setRidge(view.cssH, st.scroll);
    const burst = t < st.burstUntil ? 1 : 0;
    G.uGlitch.value = motion ? Math.max(glitchLevel(t) * (1 - still), burst) : 0;
    G.uSeed.value = st.glitchSeed;
    // Anticipation: the wide glow pulls in a little while the tab stills.
    const tight = still * (1 - smooth(0.6, 0.8, p));
    G.uWide.value = 1.15 * (1 - 0.3 * tight);
    G.uTight.value = 0.8 * (1 + 0.1 * tight);

    // Pointer tilt (max ~10deg) through the spring.
    const tx = st.pointer.active ? -st.pointer.ny * 10 * DEG : 0;
    const ty = st.pointer.active ? st.pointer.nx * 10 * DEG : 0;
    if (motion && dt > 0) {
      spring(st.tiltX, tx, 7, dt);
      spring(st.tiltY, ty, 7, dt);
      // Flashlight: the key light chases the pointer, so the hue bands slide across the face.
      const kx = st.pointer.active ? st.pointer.nx * 11 : KEY_REST.x;
      const ky = st.pointer.active ? -st.pointer.ny * 7 : KEY_REST.y;
      spring(st.keyX, kx, 6, dt);
      spring(st.keyY, ky, 6, dt);
      // Spin: free while dragging; after release the spring carries the throw then settles on the nearest turn.
      if (!st.drag || !st.drag.spinning) spring(st.spin, Math.round(st.spin.x / (2 * Math.PI)) * 2 * Math.PI, 2.4, dt);
    }
    lights.key.position.set(motion ? st.keyX.x : KEY_REST.x, motion ? st.keyY.x : KEY_REST.y, KEY_REST.z);
    const sway = 1 - still;
    const yaw = motion ? 24 * DEG * Math.sin((2 * Math.PI * t) / 9) * sway : -18 * DEG;
    const worldPerPx = view.visH / view.cssH;
    const float = motion ? Math.sin((2 * Math.PI * t) / 6.3) * 2.5 * worldPerPx * sway : 0;
    pivot.rotation.set(PITCH + (st.tiltX.x - 25 * DEG * st.scroll) * sway, yaw + st.tiltY.x * sway + st.spin.x, 0);
    pivot.position.y = float;
    pivot.updateMatrixWorld(true);

    // Unravel + curtains.
    if (work && motion && dt > 0) spring(st.u, st.uRaw, 9, dt);
    const u = work ? clamp(st.u.x, 0, WORK_LEN) : 0;
    const inWork = u > 0.0005;
    if (tab) tab.group.visible = !inWork;
    // Tear: no unravel rows, no curtains; p only stills the tab and lays the lines flat.
    const pU = tear ? Math.min(p, 0.149) : p;
    const r = pU > 0.149 && !inWork ? tabRect() : null;
    st.shocks = st.shocks.filter((s) => t - s.t < 0.7);
    pass.setUnravel({
      p: pU,
      tabTop: r ? r.y0 : 0, tabBottom: r ? r.y1 : 0, x0: r ? r.x0 : 0, x1: r ? r.x1 : 1,
      part: tear ? 0 : (() => { const c = smooth(0.8, 1, p); return c * c * (3 - 2 * c); })(),
      liftK: tear ? 1 - smooth(0.3, 1, p) : 1 - smooth(0.2, 0.6, p),
      shocks: st.shocks.slice(0, 4).map((s) => [s.x, s.y, t - s.t]),
    });
    if (opts.onProgress) opts.onProgress(p);
    if (work) {
      work.update({ u, t: motion ? t : 3.7, view, dpr, pointer: st.pointer });
      if (tab) tab.group.visible = !inWork || work.tabShown;
      G.uChroma.value = 1.75 * dpr * work.chromaK;
      if (opts.onWork) opts.onWork(u);
    }

    // Light sweep: a point light crossing left to right plus a screen band.
    const sp = motion ? sweepPhase(t) : -1;
    if (sp >= 0) {
      const e = sp * sp * (3 - 2 * sp);
      const lx = (-0.75 + 1.5 * e) * TAB_W;
      lights.sweep.position.set(lx, 0.6, 2.4);
      lights.sweep.intensity = 26 * Math.sin(Math.PI * sp);
      U.uBand.value = project(lx * 0.5);
    } else {
      lights.sweep.intensity = 0;
      U.uBand.value = -1;
    }
    updateTrail(t);
    particles.update({
      t, dt, w: view.cssW, h: view.cssH, cell: DOT,
      camDist: view.dist, camY: -view.lift, tanH: view.tanH, aspect: view.aspect,
      pointer: { x: st.pointer.px, y: st.pointer.py, active: st.pointer.active },
      scroll: st.scroll, sweepX: U.uBand.value, motion, quiet: quietRect(),
    });
  }

  function render() {
    renderer.setRenderTarget(sceneRT);
    renderer.setClearColor(0x000000, 0);
    renderer.clear(true, true, true);
    renderer.render(scene, camera);
    renderer.setRenderTarget(normRT);
    renderer.clear(true, true, true);
    scene.overrideMaterial = normMat;
    renderer.render(scene, camera);
    scene.overrideMaterial = null;
    keyView.copy(lights.key.position).transformDirection(camera.matrixWorldInverse);
    U.uKey.value.copy(keyView);
    // particles, depth-tested against the tab
    renderer.setRenderTarget(partRT);
    renderer.clear(true, true, true);
    scene.overrideMaterial = depthMat;
    renderer.render(scene, camera);
    scene.overrideMaterial = null;
    renderer.autoClear = false;
    renderer.render(particles.scene, camera);
    renderer.autoClear = true;
    // stipple into the glow base, then halo, chroma split and composite to screen
    if (work) work.preRender(renderer, pass, now());
    pass.render(renderer, bloom.target);
    if (work) work.renderFlock(renderer, camera, bloom.target);
    bloom.finish(renderer);
  }

  function frame() {
    st.raf = 0;
    try {
      const t = now();
      const dt = st.last ? Math.min(0.05, t - st.last) : 1 / 60;
      if (st.last) st.frames.push((t - st.last) * 1000);
      if (st.frames.length > 900) st.frames.shift();
      st.last = t;
      step(t, dt);
      render();
    } catch (err) {
      if (st.errors++ < 3) console.error('[ranger-tab] frame failed', err);
    }
    if (st.running) schedule();
  }

  function schedule() {
    cancelAnimationFrame(st.raf);
    st.raf = requestAnimationFrame(frame);
  }

  function setRunning() {
    const want = !reduce && tab && st.visible && !document.hidden;
    if (want === st.running) return;
    st.running = want;
    st.last = 0;
    if (want) schedule();
    else { cancelAnimationFrame(st.raf); st.raf = 0; }
  }

  function renderStatic() {
    if (!tab) return;
    step(reduce ? INTRO_S + 0.01 : now(), 0);
    render();
  }

  // ── Input ──
  let lastPt = null;
  function onPoint(cx, cy) {
    const r = container.getBoundingClientRect();
    if (cy < r.top || cy > r.bottom) { st.pointer.active = false; return; }
    st.pointer.nx = clamp(((cx - r.left) / r.width) * 2 - 1, -1, 1);
    st.pointer.ny = clamp(((cy - r.top) / r.height) * 2 - 1, -1, 1);
    st.pointer.active = true;
    st.pointer.px = cx - r.left;
    st.pointer.py = cy - r.top;
    const t = now();
    const x = (cx - r.left) * dpr;
    const y = (r.height - (cy - r.top)) * dpr;
    let vx = 0, vy = 0;
    if (lastPt && t - lastPt.t > 0.001) {
      const k = Math.min(1, t - lastPt.t);
      vx = (x - lastPt.x) / k; vy = (y - lastPt.y) / k;
      const m = Math.hypot(vx, vy);
      const cap = 4000 * dpr;
      if (m > cap) { vx *= cap / m; vy *= cap / m; }
    }
    lastPt = { x, y, t };
    st.trail.unshift({ x, y, vx, vy, t });
    if (st.trail.length > MAX_PTS) st.trail.length = MAX_PTS;
  }
  const onPointerMove = (e) => onPoint(e.clientX, e.clientY);
  const onTouchMove = (e) => { const t = e.touches[0]; if (t) onPoint(t.clientX, t.clientY); };
  const onLeave = () => { st.pointer.active = false; lastPt = null; };
  function readProgress() {
    if (!opts.pinEl) return 0;
    const r = opts.pinEl.getBoundingClientRect();
    const run = r.height - window.innerHeight;
    return run > 1 ? clamp(-r.top / run, 0, 1) : 0;
  }
  function readWork() {
    if (!opts.workEl) return 0;
    const r = opts.workEl.getBoundingClientRect();
    // One unit = one CSS vh, read off the marker (WORK_LEN + 1 vh tall). Not
    // innerHeight: iOS Safari shrinks that with its toolbar while vh stays put,
    // so u would jump as the toolbar collapses.
    const unit = r.height / (WORK_LEN + 1);
    return clamp(-r.top / Math.max(1, unit), 0, WORK_LEN);
  }
  const onScroll = () => {
    const r = container.getBoundingClientRect();
    st.scroll = clamp(-r.top / Math.max(1, r.height), 0, 1);
    st.pRaw = readProgress();
    st.uRaw = readWork();
    if (reduce) renderStatic();
  };

  // Tap = shockwave + glitch burst; drag = spin. Never blocks scrolling: no
  // preventDefault anywhere, and touch-action: pan-y hands vertical drags to the page.
  const live = () => !reduce && st.p.x <= 0.15;
  const onDown = (e) => {
    if (!live() || (e.pointerType === 'mouse' && e.button !== 0)) return;
    st.drag = { id: e.pointerId, type: e.pointerType, x0: e.clientX, y0: e.clientY, x: e.clientX, t: now(), moved: 0, spinning: false, vel: 0 };
  };
  const onDragMove = (e) => {
    const d = st.drag;
    if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
    d.moved = Math.max(d.moved, Math.hypot(dx, dy));
    if (!d.spinning && live()) {
      if (d.type === 'mouse' ? d.moved > 4 : Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) d.spinning = true;
    }
    if (d.spinning) {
      const t = now();
      const k = 0.011; // rad per css px
      const step = (e.clientX - d.x) * k;
      st.spin.x += step;
      const dt = Math.max(1 / 240, t - d.t);
      d.vel = d.vel * 0.5 + (step / dt) * 0.5;
      d.t = t;
    }
    d.x = e.clientX;
  };
  const onUp = (e) => {
    const d = st.drag;
    if (!d || e.pointerId !== d.id) return;
    st.drag = null;
    if (d.spinning) { st.spin.v = clamp(d.vel, -14, 14); return; }
    if (d.moved < 8 && live()) tap(e.clientX, e.clientY);
  };
  const onCancel = () => { if (st.drag && st.drag.spinning) st.spin.v = st.drag.vel; st.drag = null; };
  function tap(cx, cy) {
    const r = container.getBoundingClientRect();
    const t = now();
    st.shocks.unshift({ x: cx - r.left, y: cy - r.top, t });
    st.burstUntil = t + 0.15;
    st.glitchSeed = Math.random() * 100;
  }
  const onResize = () => { layout(); if (!st.running) renderStatic(); };
  const onVis = () => setRunning();

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  container.addEventListener('pointerdown', onDown, { passive: true });
  window.addEventListener('pointermove', onDragMove, { passive: true });
  window.addEventListener('pointerup', onUp, { passive: true });
  window.addEventListener('pointercancel', onCancel, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  document.addEventListener('pointerleave', onLeave, { passive: true });
  window.addEventListener('blur', onLeave);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVis);
  const io = new IntersectionObserver((ents) => {
    st.visible = ents.some((e) => e.isIntersecting);
    // Leaving the screen stops the loop, so land the reveal where the scroll is.
    if (!st.visible && !reduce) {
      st.pRaw = readProgress(); st.p.x = st.pRaw; st.p.v = 0;
      st.uRaw = readWork(); st.u.x = st.uRaw; st.u.v = 0;
      if (opts.onProgress) opts.onProgress(st.p.x);
    }
    setRunning();
  });
  io.observe(container);

  layout();

  const ready = fetch(SVG_URL)
    .then((r) => {
      if (!r.ok) throw new Error('svg ' + r.status);
      return r.text();
    })
    .then((svg) => {
      const built = buildTab(svg, mats);
      const s = TAB_W / built.width;
      built.group.scale.setScalar(s);
      tab = { group: built.group, h: built.height * s, capRatio: built.capRatio };
      pivot.add(built.group);
      layout();
      onScroll();
      if (reduce) renderStatic();
      else setRunning();
      return reduce ? 'webgl-static' : 'webgl';
    })
    .catch((err) => {
      console.error('[ranger-tab] could not build the tab', err);
      destroy();
      showFallback(container);
      return 'fallback';
    });

  const api = {
    get mode() { return renderer.capabilities.isWebGL2 ? 'webgl2' : 'webgl1'; },
    reduce,
    palette,
    get capRows() { return st.capRows; },
    seek(t) { st.clockOffset += t - now(); st.last = 0; },
    setSweep(p) { st.sweepOverride = p; },
    setGlitch(level, seed = 7) { st.glitchOverride = level; st.glitchSeed = seed; },
    // Verification hooks: pin the clock, jump the reveal, fire input without a real pointer.
    freeze(t) { st.frozen = t; st.last = 0; },
    setProgress(p) { st.pRaw = p; st.p.x = p; st.p.v = 0; },
    get progress() { return st.p.x; },
    get progressRaw() { return st.pRaw; },
    get work() { return st.u.x; },
    setWork(u) { st.uRaw = u; st.u.x = u; st.u.v = 0; },
    get workSeed() { return work ? work.seedInfo : null; },
    // A still of project i fully formed (Reduce Motion list); leaves the hero as it was.
    workStill(i) {
      if (!work || !tab) return null;
      const keep = { x: st.u.x, raw: st.uRaw, p: st.p.x };
      st.u.x = st.uRaw = work.stillU(i);
      st.p.x = 1;
      step(reduce ? INTRO_S + 0.01 : now(), 0);
      render();
      const url = renderer.domElement.toDataURL('image/png');
      st.u.x = keep.x; st.uRaw = keep.raw; st.p.x = keep.p;
      renderStatic();
      return url;
    },
    tap(cx, cy) { tap(cx, cy); },
    // A click on the work run's held object (css px); true when it took it.
    workTap(cx, cy) { return work ? work.tap(cx, cy) : false; },
    workHoldU: (i) => (work ? work.holdU(i) : 0),
    setSpin(x, v = 0) { st.spin.x = x; st.spin.v = v; },
    setPointer(nx, ny) {
      if (nx === null) { st.pointer.active = false; return; }
      st.pointer.nx = nx; st.pointer.ny = ny; st.pointer.active = true;
      st.keyX.x = nx * 11; st.keyY.x = -ny * 7; st.keyX.v = st.keyY.v = 0;
    },
    settle() { st.tiltX.x = st.tiltX.v = st.tiltY.x = st.tiltY.v = 0; st.keyX.x = KEY_REST.x; st.keyY.x = KEY_REST.y; st.keyX.v = st.keyY.v = 0; st.spin.x = st.spin.v = 0; st.shocks = []; st.burstUntil = -1; st.pointer.active = false; st.trail.length = 0; },
    frameStats() {
      const a = [...st.frames].sort((x, y) => x - y);
      const q = (p) => a[Math.min(a.length - 1, Math.floor(p * a.length))];
      return { n: a.length, p50: q(0.5), p95: q(0.95), max: a[a.length - 1] };
    },
    resetFrames() { st.frames.length = 0; },
    renderOnce: renderStatic,
    // Render and read back in one task (no preserveDrawingBuffer needed).
    snapshot() { renderStatic(); return renderer.domElement.toDataURL('image/png'); },
    canvas: renderer.domElement,
  };

  function destroy() {
    st.running = false;
    cancelAnimationFrame(st.raf);
    io.disconnect();
    window.removeEventListener('pointermove', onPointerMove);
    container.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onCancel);
    window.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('pointerleave', onLeave);
    window.removeEventListener('blur', onLeave);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVis);
    scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    Object.values(mats).forEach((m) => m.dispose());
    pass.dispose();
    if (work) work.dispose();
    particles.dispose();
    bloom.dispose();
    partRT.dispose();
    depthMat.dispose();
    normMat.dispose();
    normRT.dispose();
    sceneRT.dispose();
    envRT.dispose();
    pmrem.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  }

  return { destroy, ready, api };
}
