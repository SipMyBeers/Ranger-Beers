// Ranger tab hero: a real-time 3D Ranger tab rendered through a glyph-cell
// dither. Mountable: mount(containerEl, opts) -> { destroy, ready, api }.
//
// Clocks:
//   time    idle yaw +/-16deg on a 9s period, a small float, a light sweep every 5s
//   intro   cells scan on bottom-left to top-right over 1.2s while cells ease 3x -> 1x
//   pointer tilt toward the cursor (critically damped spring) + a velocity smear
//   scroll  as the hero leaves, the tab pitches back 25deg and cells coarsen to 2.5x
// Reduced motion renders one static frame unless opts.motion === true.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildTab } from './geometry.js';
import { makeAtlas, makeDitherPass, MAX_PTS } from './dither.js';

const SVG_URL = new URL('../../images/badges/src/ranger-tab-wikimedia.svg', import.meta.url);
export const FALLBACK_URL = new URL('../../images/badges/ranger-tab-dither.png', import.meta.url).href;

const DEG = Math.PI / 180;
const TAB_W = 10; // world units
const FOV = 28;
const INTRO_S = 1.2;
const SWEEP_EVERY = 5;
const SWEEP_S = 1.4;
const SWEEP_FIRST = 2.0;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
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
  img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;';
  container.appendChild(img);
  return { destroy: () => img.remove(), ready: Promise.resolve('fallback'), api: { mode: 'fallback' } };
}

function makeMaterials() {
  return {
    gold: new THREE.MeshStandardMaterial({ color: 0xc99a14, metalness: 0.9, roughness: 0.42 }),
    // Letters run hotter than the body so RANGER lands a level above the rim.
    letters: new THREE.MeshStandardMaterial({ color: 0xffcc33, metalness: 0.9, roughness: 0.3, emissive: 0x5a3c00 }),
    field: new THREE.MeshStandardMaterial({ color: 0x0c0b09, metalness: 0.25, roughness: 0.55 }),
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
  const isMobile = () => container.clientWidth < 700;
  const baseCell = () => opts.cell || (isMobile() ? 10 : 12);

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
  let atlas = makeAtlas(baseCell() * dpr);
  const pass = makeDitherPass(sceneRT.texture, atlas);
  const U = pass.uniforms;

  const pivot = new THREE.Group(); // tilt + yaw
  scene.add(pivot);
  let tab = null;
  let view = { visW: 1, visH: 1, cssH: 1 };

  const st = {
    tiltX: { x: 0, v: 0 }, tiltY: { x: 0, v: 0 },
    pointer: { nx: 0, ny: 0, active: false },
    trail: [], scroll: 0, running: false, visible: true, raf: 0,
    clockOffset: 0, last: 0, frames: [], errors: 0, sweepOverride: null,
  };
  const t0 = performance.now() / 1000;
  const now = () => performance.now() / 1000 - t0 + st.clockOffset;

  function layout() {
    const w = Math.max(1, container.clientWidth);
    const h = Math.max(1, container.clientHeight);
    renderer.setSize(w, h, false);
    sceneRT.setSize(w, h);
    const aspect = w / h;
    camera.aspect = aspect;
    const frac = w <= 600 ? 0.88 : w >= 1200 ? 0.56 : 0.88 - ((w - 600) / 600) * 0.32;
    const tanH = Math.tan((FOV / 2) * DEG);
    let dist = TAB_W / frac / (2 * tanH * aspect);
    const tabH = tab ? tab.h : TAB_W * 0.41;
    if (tabH / (2 * dist * tanH) > 0.5) dist = tabH / 0.5 / (2 * tanH);
    const visH = 2 * dist * tanH;
    view = { visW: visH * aspect, visH, cssH: h };
    const lift = 0.06 * visH; // tab sits slightly above centre
    camera.position.set(0, -lift, dist);
    camera.lookAt(0, -lift, 0);
    camera.updateProjectionMatrix();
    U.uRes.value.set(renderer.domElement.width, renderer.domElement.height);
    U.uRadius.value = 120 * dpr;
    const slot = Math.round(baseCell() * dpr);
    if (atlas.image.height !== slot) {
      atlas.dispose();
      atlas = makeAtlas(slot);
      U.tAtlas.value = atlas;
    }
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

  function step(t, dt) {
    const motion = !reduce;
    const intro = motion ? clamp(t / INTRO_S, 0, 1) : 1;
    const introScale = 1 + 2 * (1 - easeOut(intro));
    const scrollScale = 1 + 1.5 * st.scroll;
    U.uIntro.value = motion ? easeOut(intro) : 1;
    U.uCell.value = baseCell() * dpr * introScale * scrollScale;

    // Pointer tilt (max ~10deg) through the spring.
    const tx = st.pointer.active ? -st.pointer.ny * 10 * DEG : 0;
    const ty = st.pointer.active ? st.pointer.nx * 10 * DEG : 0;
    if (motion && dt > 0) {
      spring(st.tiltX, tx, 7, dt);
      spring(st.tiltY, ty, 7, dt);
    }
    const yaw = motion ? 16 * DEG * Math.sin((2 * Math.PI * t) / 9) : -9 * DEG;
    const worldPerPx = view.visH / view.cssH;
    const float = motion ? Math.sin((2 * Math.PI * t) / 6.3) * 2.5 * worldPerPx : 0;
    pivot.rotation.set(st.tiltX.x - 25 * DEG * st.scroll, yaw + st.tiltY.x, 0);
    pivot.position.y = float;

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
  }

  function render() {
    renderer.setRenderTarget(sceneRT);
    renderer.setClearColor(0x000000, 0);
    renderer.clear(true, true, true);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.setClearColor(0x0a0a0a, 1);
    renderer.render(pass.scene, camera);
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
  const onScroll = () => {
    const r = container.getBoundingClientRect();
    st.scroll = clamp(-r.top / Math.max(1, r.height), 0, 1);
    if (reduce) renderStatic();
  };
  const onResize = () => { layout(); if (!st.running) renderStatic(); };
  const onVis = () => setRunning();

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  document.addEventListener('pointerleave', onLeave, { passive: true });
  window.addEventListener('blur', onLeave);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVis);
  const io = new IntersectionObserver((ents) => {
    st.visible = ents.some((e) => e.isIntersecting);
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
      tab = { group: built.group, h: built.height * s };
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
    seek(t) { st.clockOffset += t - now(); st.last = 0; },
    setSweep(p) { st.sweepOverride = p; },
    frameStats() {
      const a = [...st.frames].sort((x, y) => x - y);
      const q = (p) => a[Math.min(a.length - 1, Math.floor(p * a.length))];
      return { n: a.length, p50: q(0.5), p95: q(0.95), max: a[a.length - 1] };
    },
    resetFrames() { st.frames.length = 0; },
    renderOnce: renderStatic,
    canvas: renderer.domElement,
  };

  function destroy() {
    st.running = false;
    cancelAnimationFrame(st.raf);
    io.disconnect();
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('pointerleave', onLeave);
    window.removeEventListener('blur', onLeave);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVis);
    scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    Object.values(mats).forEach((m) => m.dispose());
    pass.dispose();
    atlas.dispose();
    sceneRT.dispose();
    envRT.dispose();
    pmrem.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  }

  return { destroy, ready, api };
}
