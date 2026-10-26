// Client brand marks for the work run, built from each client's own logo
// (baked into logos.js): a raised relief for Boarhog, Numinous and Max
// Crofton's clef (on a staff), and a turning drum for TBN's wordmark.
import * as THREE from 'three';
import { clamp, shadeMat, meshBase, inHold } from './obj-core.js';
import { LOGOS } from './logos.js';

const OUT = (s) => `gl_FragColor = vec4(clamp(${s}, 0.0, 0.98), 0.0, 0.0, 1.0);`;

// Unpack a mark: alpha and tone, 0..1, row 0 at the top of the logo.
const cache = new Map();
function mark(name) {
  if (cache.has(name)) return cache.get(name);
  const L = LOGOS[name];
  const bin = atob(L.data);
  const n = L.w * L.h;
  const alpha = new Float32Array(n), tone = new Float32Array(n), rgba = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) {
    const b = bin.charCodeAt(i);
    alpha[i] = (b >> 4) / 15; tone[i] = (b & 15) / 15;
    rgba[i * 4] = tone[i] * 255; rgba[i * 4 + 1] = alpha[i] * 255; rgba[i * 4 + 3] = 255;
  }
  const m = { w: L.w, h: L.h, alpha, tone, rgba };
  m.at = (u, v) => { // u, v in 0..1 with v = 0 at the bottom, as a mesh uv
    const x = clamp(Math.round(u * (m.w - 1)), 0, m.w - 1), y = clamp(Math.round((1 - v) * (m.h - 1)), 0, m.h - 1);
    return [m.alpha[y * m.w + x], m.tone[y * m.w + x]];
  };
  cache.set(name, m);
  return m;
}
function maskTex(m) {
  const t = new THREE.DataTexture(m.rgba, m.w, m.h, THREE.RGBAFormat);
  t.colorSpace = THREE.NoColorSpace;
  t.magFilter = t.minFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}
// Alpha blurred twice with a box of radius r, the height of the relief.
function blurred(m, r) {
  let a = Float32Array.from(m.alpha);
  const tmp = new Float32Array(a.length);
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      let s = 0, c = 0;
      for (let k = -r; k <= r; k++) { const xx = x + k; if (xx >= 0 && xx < m.w) { s += a[y * m.w + xx]; c++; } }
      tmp[y * m.w + x] = s / c;
    }
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      let s = 0, c = 0;
      for (let k = -r; k <= r; k++) { const yy = y + k; if (yy >= 0 && yy < m.h) { s += tmp[yy * m.w + x]; c++; } }
      a[y * m.w + x] = s / c;
    }
  }
  return a;
}

const reliefFrag = /* glsl */ `
uniform sampler2D uMask; uniform float uSweep, uFlat, uLift, uTop;
varying vec3 vN; varying vec2 vUv;
void main() {
  vec4 m = texture2D(uMask, vec2(vUv.x, 1.0 - vUv.y));
  if (m.g < 0.5) discard;
  float lit = litOf(vN);
  float tone = mix(m.r, 1.0, uFlat);
  float band = exp(-pow(vUv.x * 0.8 + vUv.y * 0.6 - uSweep, 2.0) * 40.0);
  ${OUT('mix(uLift, uTop, tone * (0.6 + 0.45 * lit)) + 0.06 * lit + 0.3 * band')}
}`;
const lineFrag = /* glsl */ `varying vec3 vN; void main() { ${OUT('0.3 + 0.3 * litOf(vN)')} }`;

// opts: depth of the relief, flat (ignore the logo's own tones), lift and top
// (dimmest and brightest shade on the mark), staff (draw a music staff behind it), size, sway.
function reliefOf(name, opts) {
  return (key) => {
    const m = mark(name);
    const asp = m.w / m.h;
    const W = asp >= 1 ? 2 : 2 * asp, H = asp >= 1 ? 2 / asp : 2;
    const sx = Math.min(m.w - 1, 150), sy = Math.max(8, Math.round(sx * (H / W)));
    const geo = new THREE.PlaneGeometry(W, H, sx, sy);
    const hb = blurred(m, Math.max(1, Math.round(m.w / 90)));
    const P = geo.attributes.position.array, UV = geo.attributes.uv.array;
    for (let i = 0, j = 0; i < P.length; i += 3, j += 2) {
      const x = clamp(Math.round(UV[j] * (m.w - 1)), 0, m.w - 1), y = clamp(Math.round((1 - UV[j + 1]) * (m.h - 1)), 0, m.h - 1);
      P[i + 2] = opts.depth * hb[y * m.w + x];
    }
    geo.computeVertexNormals();
    const tex = maskTex(m);
    const mat = shadeMat(reliefFrag, { uMask: { value: tex }, uSweep: { value: 0 }, uFlat: { value: opts.flat ? 1 : 0 }, uLift: { value: opts.lift }, uTop: { value: opts.top } }, key, { side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.shadeAt = (p, uv) => {
      const [a, t] = m.at(uv.x, uv.y);
      if (a < 0.5) return null;
      const tone = opts.flat ? 1 : t;
      return [opts.lift + (opts.top - opts.lift) * tone * 0.9, 1];
    };
    const group = new THREE.Group();
    const spin = new THREE.Group();
    spin.add(mesh);
    group.add(spin);
    if (opts.staff) {
      for (let k = 0; k < 5; k++) {
        const line = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.022, 0.03), shadeMat(lineFrag, {}, key));
        line.position.set(0, -0.46 + k * 0.205, -0.06);
        line.userData.sh = [0.42, 0.8];
        spin.add(line);
      }
    }
    return meshBase(group, opts.size, (c) => {
      const amp = inHold(c);
      spin.rotation.set(0, opts.sway * Math.sin(c.t * 0.42) * amp, 0);
      group.rotation.set(0.14 + 0.03 * Math.sin(c.t * 0.5), -0.16, 0);
      mat.uniforms.uSweep.value = ((c.t * 0.32) % 2.4) - 0.4;
    }, (x) => x.userData.sh, { front: -2 });
  };
}

// TBN: the wordmark wrapped once round a drum that rocks to show the whole name.
const drumFrag = /* glsl */ `
uniform sampler2D uMask;
varying vec3 vN; varying vec2 vUv;
void main() {
  vec4 m = texture2D(uMask, vec2(vUv.x, 1.0 - vUv.y));
  if (m.g < 0.5) discard;
  float lit = litOf(vN);
  ${OUT('0.22 + 0.62 * m.r * (0.45 + 0.6 * lit)')}
}`;
function drum(key) {
  const m = mark('tbn');
  const H = (2 * Math.PI) / (m.w / m.h);
  const geo = new THREE.CylinderGeometry(1, 1, H, 220, 1, true);
  const mat = shadeMat(drumFrag, { uMask: { value: maskTex(m) } }, key);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.shadeAt = (p, uv) => {
    const [a, t] = m.at(uv.x, uv.y);
    return a < 0.5 ? null : [0.22 + 0.62 * t, 1];
  };
  const spin = new THREE.Group();
  spin.add(mesh);
  for (const y of [-1, 1]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.016, 8, 160), shadeMat(lineFrag, {}, key));
    rim.rotation.x = Math.PI / 2; rim.position.y = y * H * 0.68;
    rim.userData.sh = [0.45, 0.8];
    spin.add(rim);
  }
  const group = new THREE.Group();
  group.add(spin);
  // Rest angle puts "talent buyer" across the front.
  const R0 = -Math.PI / 2 - 0.03;
  return meshBase(group, { d: [0.6, 0.44, 0.25], m: [0.5, 0.37, 0.36] }, (c) => {
    const amp = inHold(c);
    spin.rotation.set(0, R0 + 1.0 * Math.sin(c.t * 0.33) * amp, 0);
    group.rotation.set(0.2 + 0.03 * Math.sin(c.t * 0.5), 0, -0.05);
  }, (x) => x.userData.sh);
}

export const MARK_FACTORIES = {
  drum,
  'relief-boarhog': reliefOf('boarhog', { depth: 0.12, lift: 0.34, top: 0.95, sway: 0.3, size: { d: [0.6, 0.45, 0.24], m: [0.5, 0.37, 0.36] } }),
  'relief-numinous': reliefOf('numinous', { depth: 0.16, lift: 0.2, top: 0.9, sway: 0.4, size: { d: [0.6, 0.45, 0.22], m: [0.5, 0.37, 0.32] } }),
  'relief-clef': reliefOf('clef', { depth: 0.14, flat: true, lift: 0.55, top: 0.85, sway: 0.35, staff: true, size: { d: [0.6, 0.45, 0.23], m: [0.5, 0.37, 0.3] } }),
};
