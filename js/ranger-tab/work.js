// Work run: after the unravel, the Ranger dots tear loose, fly, recolour in
// flight and land as each project's signature object, all through the hero's
// own scanline stipple (scanline.js) and glow (bloom.js).
//
// Timeline, u in units of one viewport of scroll (pure function of u, so
// scrolling back rebuilds every frame):
//   segment i (0..2): u in [i, i+1): 0.3 scatter (dots fly from the previous
//   shape to project i), then 0.7 hold. u in [3, 3.3]: back home to the
//   Ranger ridge lines and palette.
// Projects: 1 LootLens (magnifier), 2 IronParse (terrain), 3 AuraJam (record).
//
// Mesh objects (magnifier, record) are drawn by the stipple: their materials
// write a 0..1 shade into r of the hero's scene target, and the main pass maps
// it through the live palette. The flock is one Points cloud whose dots carry
// a target on every shape; the terrain is drawn by the flock dots themselves,
// as ridge-line rows, which is the Dither Boy ridge look.
import * as THREE from 'three';
import { PAL_GLSL, paletteColors } from './scanline.js';

export const WORK_LEN = 3.3;
const SCATTER = 0.3;
const HOME = 0, LL = 1, IP = 2, AJ = 3;
const MESH = { [LL]: true, [AJ]: true };

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// Five-stop palettes taken from each site (rb_obj.py PAL), dark to bright.
export const PROJECT_PAL = {
  [LL]: [[20, 4, 24], [90, 16, 80], [200, 20, 30], [244, 176, 32], [255, 240, 190]],
  [IP]: [[4, 10, 24], [10, 50, 90], [30, 150, 190], [100, 230, 240], [240, 250, 255]],
  [AJ]: [[14, 4, 20], [80, 20, 90], [220, 60, 160], [255, 140, 200], [255, 235, 250]],
};

// Expand to the stipple's 9-stop ramp. Stop 0 is the ground, so it sits near
// the page backdrop (0.6x, as the mocks do) and the glow never lifts the floor.
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

// ── Object materials: write shade (r) and the body id (alpha 1) ──
const objVert = /* glsl */ `
varying vec3 vN; varying vec3 vP;
void main() { vN = normalize(normalMatrix * normal); vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const lensFrag = /* glsl */ `
uniform vec3 uKey; uniform float uPart, uSweep, uLen;
varying vec3 vN; varying vec3 vP;
const float PI = 3.14159265;
void main() {
  float ndl = max(dot(normalize(vN), uKey), 0.0);
  float s;
  if (uPart < 0.5) {            // ring: lit, plus a light sweeping round the rim
    vec3 n = normalize(vN);
    float lit = max(dot(n, normalize(uKey + vec3(0.0, 0.5, 1.3))), 0.0);
    s = 0.2 + 0.78 * pow(lit, 1.6);
    float da = mod(atan(vP.y, vP.x) - uSweep + PI, 2.0 * PI) - PI;
    s += 0.5 * exp(-da * da / 0.06);
  } else if (uPart < 1.5) {     // glass: faint, with a specular arc upper left
    float r = length(vP.xy) / 0.86;
    float a = atan(vP.y, vP.x);
    float arc = exp(-pow((r - 0.72) / 0.06, 2.0)) * smoothstep(1.15, 1.35, a) * (1.0 - smoothstep(2.4, 2.65, a));
    s = 0.13 + 0.85 * arc + 0.06 * (1.0 - r);
  } else {                      // handle: grip bands along its length
    float q = vP.y / uLen + 0.5;
    s = 0.18 + 0.62 * ndl - (sin(q * 40.0) > 0.7 ? 0.2 : 0.0);
  }
  gl_FragColor = vec4(clamp(s, 0.0, 1.0), 0.0, 0.0, 1.0);
}
`;
const discFrag = /* glsl */ `
uniform float uSpin, uT;
varying vec3 vN; varying vec3 vP;
void main() {
  float r = length(vP.xz);
  float a = atan(vP.z, vP.x);
  float s;
  if (abs(vN.y) < 0.5 && r > 0.9) { s = 0.32; }  // rim
  else if (r < 0.04) { s = 0.0; }               // spindle hole
  else if (r < 0.34) { s = 0.62 + 0.36 * cos(2.0 * (a - uSpin)); } // label shows the spin
  else {
    // Grooves pulse on a 120 BPM beat; a ring of light runs out from the label on each hit.
    float beat = exp(-fract(uT * 2.0) * 4.0);
    float wave = exp(-pow((r - 0.34 - fract(uT * 2.0) * 0.8) * 9.0, 2.0));
    float groove = 0.55 + 0.45 * sin(r * 150.0) * (0.75 + 0.5 * beat);
    float sheen = pow(max(cos(2.0 * (a - 0.6)), 0.0), 6.0) * 0.85;   // fixed in the room: the disc turns under it
    s = 0.2 + sheen * groove * 0.95 + 0.14 * wave + 0.05 * beat;
  }
  gl_FragColor = vec4(clamp(s, 0.0, 1.0), 0.0, 0.0, 1.0);
}
`;

function makeLens(key) {
  const group = new THREE.Group();
  const mk = (part, extra = {}) => new THREE.ShaderMaterial({
    vertexShader: objVert, fragmentShader: lensFrag, blending: THREE.NoBlending,
    uniforms: { uKey: { value: key }, uPart: { value: part }, uSweep: { value: 0 }, uLen: { value: 1 }, ...extra },
  });
  const ringM = mk(0), glassM = mk(1);
  const len = Math.hypot(0.97, 0.97);
  const handleM = mk(2, { uLen: { value: len + 0.32 } });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.14, 24, 120), ringM);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.86, 72), glassM);
  glass.position.z = -0.02;
  const handle = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, len, 6, 20), handleM);
  handle.position.set(1.265, -1.265, 0);
  handle.rotation.z = -135 * Math.PI / 180;
  group.add(glass, handle, ring);
  return { group, mats: [ringM, glassM, handleM], ringM };
}

function makeRecord() {
  // Lathe profile (radius, height): label raised, flat grooved field, thick rim.
  const prof = [[0.04, 0.012], [0.33, 0.016], [0.345, 0.008], [0.985, 0.008], [1, 0], [1, -0.05], [0.04, -0.05]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const mat = new THREE.ShaderMaterial({
    vertexShader: objVert, fragmentShader: discFrag, blending: THREE.NoBlending,
    uniforms: { uSpin: { value: 0 }, uT: { value: 0 } },
  });
  const geo = new THREE.LatheGeometry(prof, 160);
  const mesh = new THREE.Mesh(geo, mat);
  const group = new THREE.Group();
  group.add(mesh);
  return { group, mat };
}

// ── Flock ──
const flockVert = /* glsl */ `
attribute vec4 aRnd;
attribute float aIdx, aPartLL;
attribute vec3 aLL, aNLL, aAJ;
uniform float uFrom, uTo, uE, uT, uAlpha, uDpr, uPath, uPathN, uMob;
uniform mat4 uWLL, uWAJ, uWIP;
uniform vec2 uCss;
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
bool isStray(float id) { return id == 3.0 || id == 1.0 ? aRnd.w > 0.955 : id == 2.0 ? aRnd.w > 0.97 : false; }
// Where this dot sits on shape 'id': ndc, palette position, brightness, size (css px).
void target(float id, out vec2 n, out float tt, out float b, out float sz) {
  sz = 2.0;
  if (isStray(id)) {
    // Loose dots drifting up around the object, as in the hero.
    float x = fract(aRnd.z + uT * 0.002 * (aRnd.x - 0.5));
    float y = fract(aRnd.x * 1.7 + aRnd.y - uT * 0.004 * (0.3 + aRnd.y));
    n = toNdc(vec2(x, y) * uCss); tt = 0.55 + 0.45 * aRnd.y; b = 0.35 + 0.65 * aRnd.x; return;
  }
  if (id == 0.0) {
    if (aRnd.w < 0.6) {          // on a lower ridge line, exactly where the stipple draws it
      float k = 7.0 + floor(aRnd.x * 6.999);
      float x = aRnd.z * uCss.x;
      float y = uTop + k * uSpacing + uPartLow * uCss.y * 0.6
              + 3.5 * sin(x * 0.02 + k * 1.7 + uT * 0.25) + 1.5 * sin(x * 0.085 + k * 3.1 + uT * 0.6);
      n = toNdc(vec2(x, y)); tt = 0.22 + 0.78 * (k - 7.0) / 6.0; b = 0.45; // over the stipple line, not doubling it
    } else {                     // Ranger glitter field
      n = toNdc(vec2(aRnd.z, fract(aRnd.x * 3.1 - uT * 0.003)) * uCss); tt = 0.3 + 0.7 * aRnd.y; b = 0.18 + 0.3 * aRnd.y;
    }
    return;
  }
  if (id == 1.0) {
    n = proj(uWLL, aLL);
    vec3 nv = normalize(mat3(viewMatrix) * mat3(uWLL) * aNLL);
    float ndl = max(dot(nv, uKey), 0.0);
    float lit = max(dot(nv, normalize(uKey + vec3(0.0, 0.5, 1.3))), 0.0);
    tt = aPartLL < 0.5 ? 0.2 + 0.78 * pow(lit, 1.6) : aPartLL < 1.5 ? 0.14 : 0.18 + 0.62 * ndl;
    b = aPartLL > 0.5 && aPartLL < 1.5 ? 0.5 : 1.0; return;
  }
  if (id == 3.0) {
    n = proj(uWAJ, aAJ);
    float r = length(aAJ.xz);
    tt = r < 0.34 ? 0.75 : 0.2 + 0.55 * aRnd.y; b = 0.9; return;
  }
  // IronParse: path dots first, then the terrain rows.
  if (aIdx < uPathN) {
    float q = aIdx / uPathN;
    float wob = uMob > 0.5 ? 0.0 : 30.0 * sin(q * 5.0);
    vec2 p = mix(uPathA.xy, uPathA.zw, vec2(pow(q, 1.5), q)) * uCss + vec2(0.0, wob);
    p.x += (aRnd.z - 0.5) * 2.0 * (5.0 * (1.0 - q) + 2.6);
    n = toNdc(p); tt = 0.85 + 0.15 * q; b = q <= uPath ? 1.15 : 0.0; return;
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
  // Terrain space: the camera sits at its origin, so rows span the view at their depth.
  vec3 p = vec3(u * 1.12 * D * tanH * asp, ny * D * tanH, -D);
  n = proj(uWIP, p);
  tt = clamp(h * 0.55 + 0.25, 0.0, 1.0) * (0.35 + 0.65 * f) + 0.12;
  b = 0.75 + 0.55 * f;
}
void main() {
  vec2 nA, nB; float tA, tB, bA, bB, sA, sB;
  target(uFrom, nA, tA, bA, sA);
  target(uTo, nB, tB, bB, sB);
  float ed = clamp((uE - aRnd.y * 0.3) / 0.7, 0.0, 1.0);
  // Fast out, slow in: most of the flight is spent closing on the new shape, so it reads early.
  float k = 1.0 - pow(1.0 - ed, 3.0);
  vec2 p = mix(nA, nB, k);
  // Tear loose: each dot swings out on its own arc (early in the flight), rows shred sideways.
  float arc = sin(3.14159 * ed) * (1.0 - ed) * 1.6;
  p += arc * vec2(0.32 * (aRnd.x - 0.5) + 0.08 * sin(aRnd.z * 40.0 + uT * 0.4),
                  0.16 * (aRnd.z - 0.5) + 0.05 * cos(aRnd.x * 31.0 + uT * 0.33));
  vec3 c = mix(palOf(uPalA, tA) * bA, palOf(uPalB, tB) * bB, smoothstep(0.25, 0.75, ed));
  // Mesh shapes hand over to the stipple: dots vanish as it forms, appear as it dissolves.
  float m = 1.0;
  if ((uFrom == 1.0 || uFrom == 3.0) && !isStray(uFrom)) m *= smoothstep(0.0, 0.2, uE);
  if ((uTo == 1.0 || uTo == 3.0) && !isStray(uTo)) m *= 1.0 - smoothstep(0.78, 1.0, uE);
  // Flashlight: dots near the pointer burn brighter.
  vec2 css = vec2((p.x + 1.0) * 0.5 * uCss.x, (1.0 - p.y) * 0.5 * uCss.y);
  vec2 dp = css - uPtr.xy;
  m *= 1.0 + 1.1 * uPtr.z * exp(-dot(dp, dp) / 16000.0);
  vCol = c * m * uAlpha;
  gl_PointSize = m * uAlpha > 0.001 ? mix(sA, sB, k) * uDpr : 0.0;
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
  const ll = new Float32Array(count * 3), nll = new Float32Array(count * 3), part = new Float32Array(count);
  const aj = new Float32Array(count * 3);
  const len = Math.hypot(0.97, 0.97);
  for (let i = 0; i < count; i++) {
    rnd.set([R(), R(), R(), R()], i * 4);
    idx[i] = i;
    // Magnifier surface, front half only so flying dots never show the back.
    const pick = R();
    let p, n, k;
    if (pick < 0.62) {
      const u = R() * Math.PI * 2, v = (R() * 1.15 - 0.075) * Math.PI;
      const rr = 1 + 0.14 * Math.cos(v);
      p = [rr * Math.cos(u), rr * Math.sin(u), 0.14 * Math.sin(v)];
      n = [Math.cos(v) * Math.cos(u), Math.cos(v) * Math.sin(u), Math.sin(v)];
      k = 0;
    } else if (pick < 0.72) {
      const r = 0.86 * Math.sqrt(R()), a = R() * Math.PI * 2;
      p = [r * Math.cos(a), r * Math.sin(a), -0.02]; n = [0, 0, 1]; k = 1;
    } else {
      const s = R(), f = R() * Math.PI, c = Math.cos(f), sn = Math.sin(f), q = Math.SQRT1_2;
      const ax = 0.78 + s * len * q, ay = -(0.78 + s * len * q);
      n = [c * q, c * q, sn];
      p = [ax + 0.16 * n[0], ay + 0.16 * n[1], 0.16 * n[2]]; k = 2;
    }
    ll.set(p, i * 3); nll.set(n, i * 3); part[i] = k;
    const r = Math.sqrt(0.0016 + R() * (1 - 0.0016)), a = R() * Math.PI * 2;
    aj.set([r * Math.cos(a), r < 0.34 ? 0.016 : 0.008, r * Math.sin(a)], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 4));
  geo.setAttribute('aIdx', new THREE.BufferAttribute(idx, 1));
  geo.setAttribute('aLL', new THREE.BufferAttribute(ll, 3));
  geo.setAttribute('aNLL', new THREE.BufferAttribute(nll, 3));
  geo.setAttribute('aPartLL', new THREE.BufferAttribute(part, 1));
  geo.setAttribute('aAJ', new THREE.BufferAttribute(aj, 3));
  const blank = () => Array.from({ length: 9 }, () => new THREE.Color());
  const uniforms = {
    uFrom: { value: 0 }, uTo: { value: 1 }, uE: { value: 0 }, uT: { value: 0 }, uAlpha: { value: 0 },
    uDpr: { value: 1 }, uPath: { value: 0 }, uPathN: { value: pathN }, uMob: { value: 0 },
    uWLL: { value: new THREE.Matrix4() }, uWAJ: { value: new THREE.Matrix4() }, uWIP: { value: new THREE.Matrix4() },
    uCss: { value: new THREE.Vector2(1, 1) }, uTop: { value: 0 }, uSpacing: { value: 50 }, uPartLow: { value: 0.2 },
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
  return { scene, uniforms, dispose: () => { geo.dispose(); material.dispose(); } };
}

// Where u sits: from-shape, to-shape, scatter progress e, hold progress h, project index.
export function workPhase(u) {
  if (u >= 3) return { from: AJ, to: HOME, e: clamp((u - 3) / SCATTER, 0, 1), h: 0, seg: 3 };
  const i = clamp(Math.floor(u), 0, 2);
  const s = u - i;
  return { from: i === 0 ? HOME : i, to: i + 1, e: clamp(s / SCATTER, 0, 1), h: clamp((s - SCATTER) / (1 - SCATTER), 0, 1), seg: i };
}

// ctx: { scene, U (scanline uniforms), lights, camera, mobile }
export function makeWork({ scene, U, lights, camera }) {
  const keyView = new THREE.Vector3();
  const lens = makeLens(keyView);
  const disc = makeRecord();
  lens.group.visible = disc.group.visible = false;
  scene.add(lens.group, disc.group);
  const ipSpace = new THREE.Object3D();
  let flock = null;
  let flockFor = 0;
  const base = U.uPal.value.map((c) => c.clone());
  const pals = { [HOME]: paletteColors('reference'), [LL]: ramp9(PROJECT_PAL[LL]), [IP]: ramp9(PROJECT_PAL[IP]), [AJ]: ramp9(PROJECT_PAL[AJ]) };
  let active = false;

  function ensureFlock(mobile) {
    const n = mobile ? 26000 : 52000;
    if (flock && flockFor === n) return;
    if (flock) flock.dispose();
    flock = makeFlock(n, mobile ? 900 : 1800);
    flockFor = n;
  }

  // Screen point (css px) to the world point on z = 0 in front of the hero camera.
  function at(view, sx, sy, out) {
    return out.set(-view.shift + (sx / view.cssW * 2 - 1) * view.visW / 2, -view.lift + (1 - sy / view.cssH * 2) * view.visH / 2, 0);
  }

  // s: { u, t, view, dpr, pointer: {px, py, active, nx, ny} }
  function update(s) {
    const { u, t, view } = s;
    active = u > 0.0005;
    lens.group.visible = disc.group.visible = false;
    if (!active) {
      U.uWorkObj.value = 0; U.uForm.value = 1; U.uRidgeRamp.value = 0;
      for (let i = 0; i < 9; i++) U.uPal.value[i].copy(base[i]);
      return;
    }
    const W = view.cssW, H = view.cssH;
    const mobile = W < 700;
    ensureFlock(mobile);
    const ph = workPhase(u);
    const { from, to, e } = ph;
    // Global palette (stipple, ridge lines, glitter) turns as the dots fly.
    const k = smooth(0.2, 0.8, e);
    for (let i = 0; i < 9; i++) U.uPal.value[i].copy(pals[from][i]).lerp(pals[to][i], k);
    U.uWorkObj.value = 1;
    U.uRidgeRamp.value = 1;
    // Lower ridge lines come back up into a band under the object; upper ones stay gone.
    const partLow = ph.seg === 0 ? 1 - 0.8 * smooth(0, 0.6, e) : 0.2;
    U.uPart.value = partLow;
    U.uPartUp.value = 1;
    U.uLiftK.value = 0;
    U.uForm.value = MESH[to] ? smooth(0.65, 1, e) : MESH[from] ? 1 - smooth(0, 0.25, e) : 1;
    keyView.copy(lights.key.position).transformDirection(camera.matrixWorldInverse);

    const S = Math.min(W, H * 1.4);
    const px = view.visH / H;
    // LootLens: magnifier. Turns slowly at rest, a light runs round the rim, scroll adds a little yaw.
    // The yaw phase is set so the Reduce Motion clock (t 3.7) lands face on.
    if (from === LL || to === LL) {
      const cx = mobile ? W * 0.45 : W * 0.56, cy = mobile ? H * 0.36 : H * 0.40;
      const R = S * (mobile ? 0.26 : 0.17) * px;
      at(view, cx, cy, lens.group.position);
      lens.group.scale.setScalar(R);
      const hold = to === LL ? ph.h : 0;
      lens.group.rotation.set(0.38 + 0.06 * Math.sin(t * 0.5), 0.42 * Math.sin((2 * Math.PI * (t - 3.7)) / 11) + 0.5 * (hold - 0.5), 0.04 * Math.sin(t * 0.37));
      lens.ringM.uniforms.uSweep.value = t * 1.5;
      lens.group.visible = true;
    }
    // AuraJam: record, tilted so the face reads as the mock's ellipse, spinning.
    if (from === AJ || to === AJ) {
      const cx = mobile ? W * 0.5 : W * 0.58, cy = mobile ? H * 0.36 : H * 0.38;
      const R = S * (mobile ? 0.44 : 0.30) * px;
      at(view, cx, cy, disc.group.position);
      disc.group.scale.setScalar(R);
      const hold = to === AJ ? ph.h : 0;
      disc.group.rotation.set(0.44 + 0.035 * Math.sin(t * 0.6) + 0.04 * (hold - 0.5), 0, 0.05 * Math.sin(t * 0.4) - 0.08);
      disc.mat.uniforms.uSpin.value = t * 1.6;
      disc.mat.uniforms.uT.value = t;
      disc.group.visible = true;
    }
    // IronParse terrain: its own space at the camera, yawing a touch toward the pointer.
    ipSpace.position.copy(camera.position);
    ipSpace.rotation.set(0, s.pointer.active ? s.pointer.nx * 0.04 : 0, 0);
    ipSpace.updateMatrixWorld(true);
    lens.group.updateMatrixWorld(true);
    disc.group.updateMatrixWorld(true);

    const F = flock.uniforms;
    F.uFrom.value = from; F.uTo.value = to; F.uE.value = e; F.uT.value = t;
    F.uAlpha.value = smooth(0, 0.05, u);
    F.uDpr.value = s.dpr; F.uMob.value = mobile ? 1 : 0;
    F.uCss.value.set(W, H);
    F.uTop.value = U.uTop.value; F.uSpacing.value = U.uSpacing.value; F.uPartLow.value = partLow;
    F.uKey.value.copy(keyView);
    F.uPtr.value.set(s.pointer.px, s.pointer.py, s.pointer.active ? 1 : 0);
    for (let i = 0; i < 9; i++) { F.uPalA.value[i].copy(pals[from][i]); F.uPalB.value[i].copy(pals[to][i]); }
    F.uWLL.value.copy(lens.group.matrixWorld);
    F.uWAJ.value.copy(disc.group.matrixWorld);
    F.uWIP.value.copy(ipSpace.matrixWorld);
    F.uCam.value.set(view.dist, view.tanH, view.aspect, 0);
    // Phone: the terrain and its path stay above the name block.
    F.uIP.value.set(mobile ? 0.52 : 0.4, mobile ? -0.4 : -1.0, mobile ? 0.13 : 0.16, mobile ? 34 : 46);
    if (mobile) F.uPathA.value.set(0.64, 0.7, 0.72, 0.16); else F.uPathA.value.set(0.62, 0.92, 0.72, 0.18);
    // The path draws upward through the hold; it is already climbing as the terrain lands.
    F.uPath.value = to === IP ? smooth(0.5, 1, e) * 0.08 + 0.92 * smooth(0, 0.85, ph.h) : from === IP ? 1 : 0;
  }

  function renderFlock(renderer, cam, target) {
    if (!active || !flock) return;
    renderer.setRenderTarget(target);
    renderer.autoClear = false;
    renderer.render(flock.scene, cam);
    renderer.autoClear = true;
  }

  return {
    update, renderFlock,
    get active() { return active; },
    // u that holds project i (0 LootLens, 1 IronParse, 2 AuraJam) fully formed.
    // (0.65 = mid hold, the rest pose; IronParse later so its path is drawn.)
    holdU: (i) => [0.65, 1.97, 2.65][i],
    dispose() {
      if (flock) flock.dispose();
      lens.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
      lens.mats.forEach((m) => m.dispose());
      disc.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
      disc.mat.dispose();
    },
  };
}
