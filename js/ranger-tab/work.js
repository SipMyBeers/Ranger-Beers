// Work run: the Ranger dots tear loose, drift as a loose cloud that recolours
// on the way, and condense into each project's signature object, all through
// the hero's own scanline stipple (scanline.js) and glow (bloom.js). Projects
// come from projects.js, the only place one is defined.
// With tear (the lab page), segment 0 starts on the tab itself: the stipple's
// tab dots are read back (seedFromTab), each flock dot lights on the frame its
// pixel stops being drawn, outline first, so there is no cut and no fade.
//
// Timeline, u in units of one viewport (100vh) of scroll, a pure function of u
// so scrolling back rebuilds every frame:
//   segment i (0..N-1): u in [i, i+1): 0.3 scatter (previous shape to project
//   i), then 0.7 hold. u in [N, N + 0.3]: back home to the Ranger ridge lines.
// Scatter e (0..1) has three overlapping stages, staggered per dot:
//   tear 0..0.5 (dots leave the old shape), cloud (a loose drifting cloud
//   between the two centres, recolouring), condense 0.58..1 (onto the target).
//
// Only the outgoing and incoming objects exist at once; they are built when a
// segment needs them and disposed when it no longer does.
import * as THREE from 'three';
import { PAL_GLSL, paletteColors } from './scanline.js';
import { PROJECTS } from './projects.js';
import { makeObject } from './objects.js';

const N = PROJECTS.length;
const SCATTER = 0.3;
export const WORK_LEN = N + SCATTER;
const K_HOME = 0, K_MESH = 1, K_TERRAIN = 2, K_SEED = 3;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// Five stops to the stipple's 9-stop ramp. Stop 0 is the ground, so it sits
// near the page backdrop (0.6x, as the mocks do) and glow never lifts the floor.
function ramp9(stops) {
  const p = stops.map((c) => c.map((v) => v / 255));
  return Array.from({ length: 9 }, (_, i) => {
    if (i === 0) return new THREE.Color(p[0][0] * 0.6, p[0][1] * 0.6, p[0][2] * 0.6);
    const x = (i / 8) * (p.length - 1);
    const k = Math.min(p.length - 2, Math.floor(x));
    const f = x - k;
    return new THREE.Color(...p[k].map((v, j) => v * (1 - f) + p[k + 1][j] * f));
  });
}

// ── Flock ──
const flockVert = /* glsl */ `
attribute vec4 aRnd;
attribute float aIdx;
attribute vec3 aPA, aNA, aPB, aNB;
attribute vec2 aSA, aSB;
uniform float uSeedPx;      // css px per seed texel
uniform float uKindA, uKindB, uE, uT, uAlpha, uDpr, uPath, uPathN, uMob, uTerrA, uTerrB;
uniform mat4 uWA, uWB, uWIP;
uniform vec2 uCss, uCenA, uCenB, uCloud;
uniform float uTop, uSpacing, uPartLow;
uniform vec3 uKey;
uniform vec3 uPtr;            // css px x, y, on
uniform vec3 uPalA[9], uPalB[9];
uniform vec4 uCam;            // dist, tanH, aspect, unused
uniform vec4 uIP;             // ny far, ny near, height amp, rows
uniform vec4 uPathA;          // start x, y, end x, y (fractions of the viewport)
varying vec3 vCol;
${PAL_GLSL}
vec2 toNdc(vec2 css) { return vec2(css.x / uCss.x * 2.0 - 1.0, 1.0 - css.y / uCss.y * 2.0); }
vec2 proj(mat4 w, vec3 p) { vec4 c = projectionMatrix * viewMatrix * w * vec4(p, 1.0); return c.xy / c.w; }
float terrainH(float u, float i) {
  return exp(-pow(u * 2.2, 2.0)) * (1.0 + 0.5 * sin(u * 7.0 + i * 0.4 + uT * 0.35))
       + 0.25 * sin(u * 15.0 + i * 0.9 - uT * 0.5)
       + 0.14 * sin(i * 0.45 - uT * 0.9 + u * 2.0); // the slow swell rolling toward you
}
bool isStray(float k) { return k == 1.0 ? aRnd.w > 0.955 : k == 2.0 ? aRnd.w > 0.97 : false; }
// Where this dot sits on a shape: ndc, palette position, brightness, size (css px).
void target(float k, mat4 W, vec3 P, vec3 Nr, vec2 S, out vec2 n, out float tt, out float b, out float sz) {
  sz = 2.0;
  if (k == 3.0) { n = toNdc(P.xy); tt = 0.0; b = 1.0; sz = uSeedPx; return; } // the tab's own dot, one read-back texel
  if (isStray(k)) {
    float x = fract(aRnd.z + uT * 0.002 * (aRnd.x - 0.5));
    float y = fract(aRnd.x * 1.7 + aRnd.y - uT * 0.004 * (0.3 + aRnd.y));
    n = toNdc(vec2(x, y) * uCss); tt = 0.55 + 0.45 * aRnd.y; b = 0.35 + 0.65 * aRnd.x; return;
  }
  if (k == 0.0) {
    if (aRnd.w < 0.6) {          // on a lower ridge line, exactly where the stipple draws it
      float kk = 7.0 + floor(aRnd.x * 6.999);
      float x = aRnd.z * uCss.x;
      float y = uTop + kk * uSpacing + uPartLow * uCss.y * 0.6
              + 3.5 * sin(x * 0.02 + kk * 1.7 + uT * 0.25) + 1.5 * sin(x * 0.085 + kk * 3.1 + uT * 0.6);
      n = toNdc(vec2(x, y)); tt = 0.22 + 0.78 * (kk - 7.0) / 6.0; b = 0.45;
    } else {                     // Ranger glitter field
      n = toNdc(vec2(aRnd.z, fract(aRnd.x * 3.1 - uT * 0.003)) * uCss); tt = 0.3 + 0.7 * aRnd.y; b = 0.18 + 0.3 * aRnd.y;
    }
    return;
  }
  if (k == 1.0) {
    n = proj(W, P);
    vec3 nv = normalize(mat3(viewMatrix) * mat3(W) * Nr);
    float lit = max(dot(nv, normalize(uKey + vec3(0.0, 0.5, 1.3))), 0.0);
    tt = S.x < 0.0 ? 0.2 + 0.78 * pow(lit, 1.6) : S.x;
    b = S.y; return;
  }
  // Terrain: path dots first, then the ridge rows.
  if (aIdx < uPathN) {
    float q = aIdx / uPathN;
    float wob = uMob > 0.5 ? 0.0 : 30.0 * sin(q * 5.0);
    vec2 p = mix(uPathA.xy, uPathA.zw, vec2(pow(q, 1.5), q)) * uCss + vec2(0.0, wob);
    p.x += (aRnd.z - 0.5) * 2.0 * (5.0 * (1.0 - q) + 2.6);
    n = toNdc(p); tt = 1.0; b = q <= uPath ? 1.25 : 0.0; return;
  }
  float rows = uIP.w;
  float i = floor(aRnd.x * (rows - 0.001));
  float f = i / (rows - 1.0);
  float dist = uCam.x, tanH = uCam.y, asp = uCam.z;
  float z = mix(-2.2 * dist, 0.3 * dist, pow(f, 0.85));
  float D = dist - z;
  float u = aRnd.z * 2.0 - 1.0;
  float h = terrainH(u, i);
  float sc = 0.2 + 0.8 * f;
  float ny = mix(uIP.x, uIP.y, pow(f, 1.6)) + h * uIP.z * sc * 2.0;
  vec3 p = vec3(u * 1.12 * D * tanH * asp, ny * D * tanH, -D);
  n = proj(uWIP, p);
  tt = clamp(h * 0.55 + 0.25, 0.0, 1.0) * (0.35 + 0.65 * f) + 0.12;
  b = 0.75 + 0.55 * f;
  // Phone: rows fade before the right edge so the side tracker sits on dark.
  if (uMob > 0.5) b *= 1.0 - smoothstep(0.62, 0.86, n.x);
}
void main() {
  vec2 nA, nB; float tA, tB, bA, bB, sA, sB;
  target(uKindA, uWA, aPA, aNA, aSA, nA, tA, bA, sA);
  target(uKindB, uWB, aPB, aNB, aSB, nB, tB, bB, sB);
  float r1 = aRnd.y, r2 = fract(aRnd.x * 7.13 + aRnd.z * 3.71);
  // Tear: each dot lets go of the old shape at its own moment.
  // Off the tab, the outline goes first and the tear works inward (aSA.y = depth into the tab).
  bool seedA = uKindA == 3.0;
  float ta = seedA ? 0.02 + 0.3 * aSA.y + 0.05 * r1 : 0.04 + 0.22 * r1;
  float wa = smoothstep(ta, ta + (seedA ? 0.24 : 0.3), uE);
  // Condense: only in the last part, each dot landing at its own moment.
  float c0 = 0.58 + 0.24 * r2;
  float wb = smoothstep(c0, c0 + 0.18, uE);
  // The cloud: a loose drifting ellipse whose centre travels between the shapes.
  vec2 cen = mix(uCenA, uCenB, smoothstep(0.12, 0.8, uE));
  // Radius and drift come from separate randoms, so the cloud stays a loose
  // haze and never winds into spiral arms.
  float r3 = fract(aRnd.w * 13.7 + aRnd.y * 5.3);
  float ang = aRnd.z * 6.2832 + (uE * 1.1 + uT * 0.04) * (r2 - 0.5) * 2.0;
  // Gaussian falloff: a dense core thinning into a soft edge, no rim.
  float rad = sqrt(-2.0 * log(1.0 - 0.96 * r3)) * 0.5 * uCloud.x * (0.8 + 0.45 * sin(3.14159 * uE));
  vec2 cl = cen + vec2(cos(ang) * 1.25, sin(ang) * 0.85) * rad
          + uCloud.y * vec2(sin(aRnd.y * 41.0 + uE * 6.0 + uT * 0.4), cos(aRnd.z * 37.0 + uE * 5.0 + uT * 0.33));
  vec2 nC = toNdc(cl);
  vec2 p = mix(mix(nA, nC, wa), nB, wb);
  // Colour: torn dots dim to a mid tone of the old palette, turn to the new one
  // in flight, then take their place on the new shape.
  float pt = 0.38 + 0.55 * aRnd.y;
  vec3 cc = mix(palOf(uPalA, pt), palOf(uPalB, pt), smoothstep(0.25, 0.7, uE + 0.2 * (r1 - 0.5))) * 0.42;
  // A tab dot keeps the colour it had on the tab into the flight, then takes the new palette mid-air.
  if (seedA) cc = mix(aNA * 0.5, palOf(uPalB, pt) * 0.42, smoothstep(0.3, 0.62, uE + 0.16 * (r1 - 0.5)));
  cc *= 1.15 - 0.6 * r3;
  // A tab dot lights on the frame the stipple stops drawing its pixel (scanline.js uTearE).
  vec3 cA = seedA ? aNA * aSA.x * step(0.02 + 0.3 * aSA.y, uE) : palOf(uPalA, tA) * bA;
  vec3 c = mix(mix(cA, cc, wa), palOf(uPalB, tB) * bB, wb);
  // Mesh shapes hand over to the stipple: dots appear as it dissolves, vanish as it forms.
  float m = 1.0;
  if (uKindA == 1.0 && !isStray(uKindA)) m *= mix(smoothstep(0.0, 0.1, uE), 1.0, step(0.5, wb));
  if (uKindB == 1.0 && !isStray(uKindB)) m *= 1.0 - smoothstep(0.9, 1.0, uE);
  // Flashlight: dots near the pointer burn brighter.
  vec2 css = vec2((p.x + 1.0) * 0.5 * uCss.x, (1.0 - p.y) * 0.5 * uCss.y);
  vec2 dp = css - uPtr.xy;
  m *= 1.0 + 1.1 * uPtr.z * exp(-dot(dp, dp) / 16000.0) * (seedA ? wa : 1.0);
  vCol = c * m * uAlpha;
  gl_PointSize = m * uAlpha > 0.001 ? mix(mix(sA, 2.0, wa), sB, wb) * uDpr : 0.0;
  gl_Position = vec4(p, 0.0, 1.0);
}
`;
const flockFrag = /* glsl */ `
varying vec3 vCol;
void main() { gl_FragColor = vec4(vCol, 1.0); }
`;

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeFlock(count, pathN) {
  const R = rng(11);
  const rnd = new Float32Array(count * 4);
  const idx = new Float32Array(count);
  for (let i = 0; i < count; i++) { rnd.set([R(), R(), R(), R()], i * 4); idx[i] = i; }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 4));
  geo.setAttribute('aIdx', new THREE.BufferAttribute(idx, 1));
  for (const s of ['A', 'B']) {
    geo.setAttribute('aP' + s, new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute('aN' + s, new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute('aS' + s, new THREE.BufferAttribute(new Float32Array(count * 2), 2));
  }
  const blank = () => Array.from({ length: 9 }, () => new THREE.Color());
  const uniforms = {
    uSeedPx: { value: 1 }, uKindA: { value: 0 }, uKindB: { value: 1 }, uE: { value: 0 }, uT: { value: 0 }, uAlpha: { value: 0 },
    uDpr: { value: 1 }, uPath: { value: 0 }, uPathN: { value: pathN }, uMob: { value: 0 },
    uWA: { value: new THREE.Matrix4() }, uWB: { value: new THREE.Matrix4() }, uWIP: { value: new THREE.Matrix4() },
    uCss: { value: new THREE.Vector2(1, 1) }, uCenA: { value: new THREE.Vector2() }, uCenB: { value: new THREE.Vector2() },
    uCloud: { value: new THREE.Vector2(200, 20) },
    uTop: { value: 0 }, uSpacing: { value: 50 }, uPartLow: { value: 0.2 },
    uKey: { value: new THREE.Vector3(-0.9, 0.25, 0.35) }, uPtr: { value: new THREE.Vector3(-1e4, -1e4, 0) },
    uPalA: { value: blank() }, uPalB: { value: blank() },
    uCam: { value: new THREE.Vector4(10, 0.25, 1, 0) }, uIP: { value: new THREE.Vector4(0.4, -1, 0.16, 46) },
    uPathA: { value: new THREE.Vector4(0.62, 0.92, 0.72, 0.22) },
  };
  const material = new THREE.ShaderMaterial({
    vertexShader: flockVert, fragmentShader: flockFrag, uniforms,
    transparent: true, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false,
  });
  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(points);
  return { scene, uniforms, geo, count, dispose: () => { geo.dispose(); material.dispose(); } };
}

// Where u sits: from and to slots (-1 = home, else a project index), scatter
// progress e, hold progress h, segment.
export function workPhase(u) {
  if (u >= N) return { from: N - 1, to: -1, e: clamp((u - N) / SCATTER, 0, 1), h: 0, seg: N };
  const i = clamp(Math.floor(u), 0, N - 1);
  const s = u - i;
  return { from: i - 1, to: i, e: clamp(s / SCATTER, 0, 1), h: clamp((s - SCATTER) / (1 - SCATTER), 0, 1), seg: i };
}

// ctx: { scene, U (scanline uniforms), lights, camera }
export function makeWork({ scene, U, lights, camera, tear = false }) {
  const keyView = new THREE.Vector3();
  const ipSpace = new THREE.Object3D();
  let flock = null;
  let flockFor = 0;
  const base = U.uPal.value.map((c) => c.clone());
  const homePal = paletteColors('reference');
  const pals = PROJECTS.map((p) => ramp9(p.palette));
  const palOf = (slot) => (slot < 0 ? homePal : pals[slot]);
  const live = new Map(); // slot -> object
  const samples = new Map(); // slot -> { pos, nrm, sh } for the current flock size
  let wired = { A: null, B: null }; // which slot each flock attribute set holds
  let active = false;
  let chromaK = 1;
  let toObj = null, toCenter = null, toR = 0;
  // Tear mode: segment 0 starts on the tab's own rendered dots (read back from
  // the stipple) instead of the ridge lines, so the tab itself comes apart.
  let seed = null;            // { cx, cy, n } once the flock carries the tab's dots
  let seedData = null;        // a copy, put back when the run re-enters segment 0
  let seedT = -1e9;
  let wantSeed = false, tabShown = false, tabHole = -1, seedK = 1;
  let depthTex = null;

  function ensureFlock(mobile) {
    const n = mobile ? 26000 : 52000;
    if (flock && flockFor === n) return;
    if (flock) flock.dispose();
    flock = makeFlock(n, mobile ? 900 : 1800);
    flockFor = n;
    samples.clear();
    wired = { A: null, B: null };
  }

  function objectFor(slot) {
    if (slot < 0) return null;
    let o = live.get(slot);
    if (!o) {
      o = makeObject(PROJECTS[slot], keyView);
      if (o.group) { o.group.visible = false; scene.add(o.group); }
      live.set(slot, o);
    }
    return o;
  }
  // Keep only what this segment draws.
  function prune(keep) {
    for (const [slot, o] of live) {
      if (keep.includes(slot)) continue;
      if (o.group) scene.remove(o.group);
      o.dispose();
      live.delete(slot);
      samples.delete(slot);
    }
  }
  function wire(which, slot, o) {
    if (wired[which] === slot) return;
    wired[which] = slot;
    if (which === 'A') seed = null;
    if (!o || o.kind !== 'mesh') return;
    let s = samples.get(slot);
    if (!s) {
      // Sample with the object at rest pose so dots know their local spot.
      const g = o.group;
      const keep = [g.position.clone(), g.rotation.clone(), g.scale.clone()];
      g.position.set(0, 0, 0); g.rotation.set(0, 0, 0); g.scale.setScalar(1);
      s = o.sample(flock.count, rng(101 + slot));
      g.position.copy(keep[0]); g.rotation.copy(keep[1]); g.scale.copy(keep[2]);
      samples.set(slot, s);
    }
    const geo = flock.geo;
    geo.attributes['aP' + which].array.set(s.pos); geo.attributes['aP' + which].needsUpdate = true;
    geo.attributes['aN' + which].array.set(s.nrm); geo.attributes['aN' + which].needsUpdate = true;
    geo.attributes['aS' + which].array.set(s.sh); geo.attributes['aS' + which].needsUpdate = true;
  }

  // Screen point (css px) to the world point on z = 0 in front of the hero camera.
  function at(view, sx, sy, out) {
    return out.set(-view.shift + (sx / view.cssW * 2 - 1) * view.visW / 2, -view.lift + (1 - sy / view.cssH * 2) * view.visH / 2, 0);
  }
  const kindOf = (o) => (!o ? K_HOME : o.kind === 'terrain' ? K_TERRAIN : K_MESH);

  // Read the tab back as the stipple draws it and put one flock dot on each lit
  // css px, in its colour. Spare dots wait invisibly on random tab dots and fade
  // in as they tear. aSA.y = how deep the dot sits inside the tab's outline (0 edge, 1 core).
  // Phone: one dot per device px (the lit count fits the flock); desktop: per css px.
  function seedFromTab(renderer, pass, k) {
    const { data, w, h } = pass.readTab(renderer, k);
    let x0 = w, x1 = -1, y0 = h, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] < 0.25) continue;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    if (x1 < 0) return false;
    // Chamfer distance to the outline, inside the tab's box only.
    const bw = x1 - x0 + 3, bh = y1 - y0 + 3;
    const d = new Uint16Array(bw * bh);
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
      const sx = x + x0 - 1, sy = y + y0 - 1;
      const inside = sx >= 0 && sy >= 0 && sx < w && sy < h && data[(sy * w + sx) * 4 + 3] >= 0.25;
      d[y * bw + x] = inside ? 65000 : 0;
    }
    for (let y = 1; y < bh; y++) for (let x = 1; x < bw - 1; x++) {
      const i = y * bw + x; if (!d[i]) continue;
      d[i] = Math.min(d[i], d[i - 1] + 3, d[i - bw] + 3, d[i - bw - 1] + 4, d[i - bw + 1] + 4);
    }
    let dmax = 1;
    for (let y = bh - 2; y >= 0; y--) for (let x = bw - 2; x >= 1; x--) {
      const i = y * bw + x; if (!d[i]) continue;
      d[i] = Math.min(d[i], d[i + 1] + 3, d[i + bw] + 3, d[i + bw + 1] + 4, d[i + bw - 1] + 4);
      if (d[i] > dmax) dmax = d[i];
    }
    // The same depths as a texture, so the stipple hides each pixel on its dot's cue.
    if (!depthTex || depthTex.image.width !== w || depthTex.image.height !== h) {
      if (depthTex) depthTex.dispose();
      depthTex = new THREE.DataTexture(new Float32Array(w * h), w, h, THREE.RedFormat, THREE.FloatType);
      depthTex.minFilter = depthTex.magFilter = THREE.NearestFilter;
    }
    const D = depthTex.image.data;
    D.fill(0);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) D[y * w + x] = d[(y - y0 + 1) * bw + (x - x0 + 1)] / dmax;
    depthTex.needsUpdate = true;
    U.tTabDepth.value = depthTex;
    const lit = [];
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const q = (y * w + x) * 4;
      if (data[q + 3] < 0.25 || Math.max(data[q], data[q + 1], data[q + 2]) < 0.02) continue;
      lit.push(q);
    }
    if (!lit.length) return false;
    const geo = flock.geo, n = flock.count;
    const P = geo.attributes.aPA.array, C = geo.attributes.aNA.array, S = geo.attributes.aSA.array;
    const L = lit.length;
    let sx = 0, sy = 0;
    for (let i = 0; i < n; i++) {
      const own = i < L;
      // More lit px than dots: spread the dots evenly over them.
      const q = own ? lit[L > n ? Math.floor((i * L) / n) : i] : lit[(i * 7919) % L];
      const px = (q / 4) % w, py = Math.floor(q / 4 / w);
      const cx = (px + 0.5) / k, cy = (h - py - 0.5) / k;
      P[i * 3] = cx; P[i * 3 + 1] = cy; P[i * 3 + 2] = 0;
      C[i * 3] = data[q]; C[i * 3 + 1] = data[q + 1]; C[i * 3 + 2] = data[q + 2];
      S[i * 2] = own ? 1 : 0;
      S[i * 2 + 1] = D[py * w + px];
      if (own) { sx += cx; sy += cy; }
    }
    geo.attributes.aPA.needsUpdate = true; geo.attributes.aNA.needsUpdate = true; geo.attributes.aSA.needsUpdate = true;
    const m = Math.min(L, n);
    seed = { cx: sx / m, cy: sy / m, n: L, k };
    seedData = { meta: seed, P: P.slice(), C: C.slice(), S: S.slice(), D: D.slice(), w, h, count: n };
    wired.A = -1;
    return true;
  }
  function restoreSeed() {
    if (!seedData || seedData.count !== flock.count) return;
    const a = flock.geo.attributes;
    a.aPA.array.set(seedData.P); a.aNA.array.set(seedData.C); a.aSA.array.set(seedData.S);
    a.aPA.needsUpdate = a.aNA.needsUpdate = a.aSA.needsUpdate = true;
    if (depthTex && depthTex.image.width === seedData.w && depthTex.image.height === seedData.h) {
      depthTex.image.data.set(seedData.D); depthTex.needsUpdate = true;
    }
    seed = seedData.meta;
    wired.A = -1;
  }
  // Called by the hero just before the stipple pass, with the tab in sceneRT.
  function preRender(renderer, pass, t) {
    if (!wantSeed || !flock) return;
    if (seed && t - seedT < 0.15) return;
    try { if (seedFromTab(renderer, pass, seedK)) seedT = t; } catch (err) { seed = null; wantSeed = false; }
    if (!seed) return;
    // Same frame: the flock takes over exactly where the stipple stops drawing the tab.
    const F = flock.uniforms;
    F.uKindA.value = K_SEED; F.uAlpha.value = 1; F.uSeedPx.value = 1 / seed.k;
    F.uCenA.value.set(seed.cx, seed.cy);
    U.uTearE.value = F.uE.value;
  }

  // s: { u, t, view, dpr, pointer: {px, py, active, nx, ny} }
  function update(s) {
    const { u, t, view } = s;
    active = u > 0.0005;
    chromaK = 1;
    toObj = null;
    for (const o of live.values()) if (o.group) o.group.visible = false;
    wantSeed = false; tabShown = false; tabHole = -1; U.uTabHole.value = -1;
    if (!active) {
      U.uWorkObj.value = 0; U.uForm.value = 1; U.uRidgeRamp.value = 0;
      for (let i = 0; i < 9; i++) U.uPal.value[i].copy(base[i]);
      prune([0]);
      return;
    }
    const W = view.cssW, H = view.cssH;
    const mobile = W < 700;
    ensureFlock(mobile);
    seedK = mobile ? Math.min(2, s.dpr) : 1;
    const ph = workPhase(u);
    const { from, to, e } = ph;
    prune([from, to]);
    const oA = objectFor(from), oB = objectFor(to);
    const k = smooth(0.2, 0.8, e);
    for (let i = 0; i < 9; i++) U.uPal.value[i].copy(palOf(from)[i]).lerp(palOf(to)[i], k);
    U.uWorkObj.value = 1;
    U.uRidgeRamp.value = 1;
    const partLow = ph.seg === 0 ? 1 - 0.8 * smooth(0, 0.6, e) : 0.2;
    U.uPart.value = partLow;
    U.uPartUp.value = 1;
    U.uLiftK.value = 0;
    // Tear: the tab is whole and the field at rest when the run starts, so the
    // curtains open and the lines take their ramp as the tab comes apart.
    const tearing = tear && ph.seg === 0 && from < 0;
    if (tearing) {
      U.uRidgeRamp.value = smooth(0.05, 0.6, e);
      U.uPart.value = 0.2 * smooth(0.05, 0.6, e);
      U.uPartUp.value = smooth(0.05, 0.7, e);
      // The tab stays in the scene (dark) while its dots leave, then its hole dissolves.
      // Live re-reads only near the hand-off; deeper in, the last copy is put back.
      if (!seed && e >= 0.06) restoreSeed();
      // From e 0.7 every tab dot has torn and taken the new palette, so the seed
      // no longer shows and nothing needs reading back (the Reduce Motion still).
      wantSeed = e < 0.7 && (e < 0.06 || !seed);
      tabHole = 1 - smooth(0.05, 0.45, e);
      tabShown = tabHole > 0 || wantSeed;
      // -1 everywhere else: a non-negative hole blanks every object in sceneRT.
      U.uTabHole.value = tabShown ? Math.max(0, tabHole) : -1;
      U.uTearE.value = e;
    }
    const seeded = tearing && (!!seed || e >= 0.7);
    const seedC = seed || (seedData && seedData.meta);
    keyView.copy(lights.key.position).transformDirection(camera.matrixWorldInverse);

    const S = Math.min(W, H * 1.4);
    const px = view.visH / H;
    const centre = (o, slot) => {
      if (!o) return [W * 0.5, H * 0.8, 0];
      const [cx, cy, r] = mobile ? o.size.m : o.size.d;
      return [cx * W, cy * H, r * S];
    };
    const cA = seeded ? (seedC ? [seedC.cx, seedC.cy, 0] : [W * 0.5, H * 0.35, 0]) : centre(oA, from), cB = centre(oB, to);
    // The outgoing object dissolves in the first moments, the incoming one forms at the end.
    const showA = oA && oA.group && e < 0.12;
    const showB = oB && oB.group && e > 0.86;
    U.uForm.value = showB ? smooth(0.86, 1, e) : showA ? 1 - smooth(0, 0.12, e) : 1;
    for (const [o, c, isTo, show] of [[oA, cA, false, showA], [oB, cB, true, showB]]) {
      if (!o) continue;
      if (o.group) {
        at(view, c[0], c[1], o.group.position);
        o.group.scale.setScalar(c[2] * px);
        o.group.visible = !!show;
      }
      o.tick({ t, hold: isTo ? ph.h : 1, e, isTo, isFrom: !isTo, mobile });
      if (o.group) o.group.updateMatrixWorld(true);
    }
    if (oB) { toObj = oB; toCenter = cB; toR = cB[2]; }
    ipSpace.position.copy(camera.position);
    ipSpace.rotation.set(0, s.pointer.active ? s.pointer.nx * 0.04 : 0, 0);
    ipSpace.updateMatrixWorld(true);

    wire('A', from, oA);
    wire('B', to, oB);
    const F = flock.uniforms;
    F.uKindA.value = seeded ? K_SEED : kindOf(oA); F.uKindB.value = kindOf(oB);
    F.uE.value = e; F.uT.value = t;
    // Seeded, the flock IS the tab from the first frame: no fade in.
    F.uAlpha.value = seeded ? 1 : smooth(0, 0.05, u);
    if (seeded) F.uSeedPx.value = 1 / (seedC ? seedC.k : 1);
    F.uDpr.value = s.dpr; F.uMob.value = mobile ? 1 : 0;
    F.uCss.value.set(W, H);
    F.uCenA.value.set(cA[0], cA[1]); F.uCenB.value.set(cB[0], cB[1]);
    F.uCloud.value.set(S * (mobile ? 0.34 : 0.27), S * 0.05);
    F.uTop.value = U.uTop.value; F.uSpacing.value = U.uSpacing.value; F.uPartLow.value = partLow;
    F.uKey.value.copy(keyView);
    F.uPtr.value.set(s.pointer.px, s.pointer.py, s.pointer.active ? 1 : 0);
    for (let i = 0; i < 9; i++) { F.uPalA.value[i].copy(palOf(from)[i]); F.uPalB.value[i].copy(palOf(to)[i]); }
    if (oA && oA.group) F.uWA.value.copy(oA.group.matrixWorld);
    if (oB && oB.group) F.uWB.value.copy(oB.group.matrixWorld);
    F.uWIP.value.copy(ipSpace.matrixWorld);
    F.uCam.value.set(view.dist, view.tanH, view.aspect, 0);
    // Phone: the terrain sits lower and calmer, so the top of the screen breathes.
    F.uIP.value.set(mobile ? 0.3 : 0.4, mobile ? -0.46 : -1.0, mobile ? 0.1 : 0.16, mobile ? 30 : 46);
    if (mobile) F.uPathA.value.set(0.6, 0.66, 0.68, 0.24); else F.uPathA.value.set(0.62, 0.92, 0.72, 0.18);
    const toT = kindOf(oB) === K_TERRAIN, fromT = kindOf(oA) === K_TERRAIN;
    F.uPath.value = toT ? smooth(0.6, 1, e) * 0.08 + 0.92 * smooth(0, 0.85, ph.h) : fromT ? 1 : 0;
    // The terrain and its white path read clean: no chroma fringe while they hold.
    const ipw = (toT ? smooth(0.7, 1, e) : 0) + (fromT ? 1 - smooth(0, 0.3, e) : 0);
    chromaK = 1 - 0.85 * clamp(ipw, 0, 1);
  }

  function renderFlock(renderer, cam, target) {
    if (!active || !flock) return;
    renderer.setRenderTarget(target);
    renderer.autoClear = false;
    renderer.render(flock.scene, cam);
    renderer.autoClear = true;
  }

  return {
    update, renderFlock, preRender,
    get active() { return active; },
    // The tab stays in sceneRT (drawn dark by the stipple) while the run needs it.
    get tabShown() { return tabShown; },
    // Lab: how many lit tab px the last read-back found, and the flock size.
    get seedInfo() {
      if (!flock) return null;
      const F = flock.uniforms, P = flock.geo.attributes.aPA.array;
      return { lit: seed && seed.n, k: seed && seed.k, cx: seed && seed.cx, cy: seed && seed.cy, kindA: F.uKindA.value, alpha: F.uAlpha.value,
        seedPx: F.uSeedPx.value, hole: U.uTabHole.value, shown: tabShown, wired: wired.A, p0: [P[0], P[1], P[2]], hasData: !!seedData };
    },
    get chromaK() { return chromaK; },
    // u at which project i holds, settled, with its copy up (tracker target).
    holdU: (i) => i + 0.6,
    // u for project i's Reduce Motion still (terrain later, so its path is drawn).
    stillU: (i) => i + (PROJECTS[i].object === 'terrain' ? 0.97 : 0.65),
    // A click at css (x, y): the held object, if it has a tap and was hit.
    tap(x, y) {
      if (!toObj || !toObj.tap || !toCenter) return false;
      if (Math.hypot(x - toCenter[0], y - toCenter[1]) > toR * 1.3) return false;
      toObj.tap();
      return true;
    },
    dispose() {
      prune([]);
      if (flock) flock.dispose();
      if (depthTex) depthTex.dispose();
    },
  };
}
