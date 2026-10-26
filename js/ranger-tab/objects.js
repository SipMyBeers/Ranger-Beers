// Signature objects for the work run. Each is built lazily (only the outgoing
// and incoming objects exist at once) and drawn by the hero's own stipple:
// materials write a 0..1 shade into r of the scene target, alpha 1, and the
// scanline pass maps it through the live palette.
//
// A factory returns:
//   group               THREE.Group in object units (radius about 1, facing +z)
//   size                { d: [cx, cy, R], m: [cx, cy, R] } desktop / phone, as
//                       fractions of the viewport (cx, cy of W, H; R of S)
//   tick(c)             per frame: { t, hold, e, isTo, isFrom, mobile }
//   sample(n, R)        n flock targets in group space: { pos, nrm, sh }
//                       (sh: vec2 base shade, brightness; base < 0 means lit)
//   tap?()              optional, a click on the object
//   kind                'mesh' (default) or 'terrain' (flock-drawn, no group)
//   dispose()
import * as THREE from 'three';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

export const objVert = /* glsl */ `
varying vec3 vN; varying vec3 vP; varying vec3 vW;
void main() {
  vN = normalize(normalMatrix * normal); vP = position;
  vW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
// Lambert toward the key plus a front fill, as every object is lit.
const LIT = /* glsl */ `
uniform vec3 uKey;
float litOf(vec3 n) { return max(dot(normalize(n), normalize(uKey + vec3(0.0, 0.5, 1.3))), 0.0); }
`;

export function shadeMat(frag, uniforms = {}, key, opts = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: opts.vert || objVert, fragmentShader: LIT + frag, blending: THREE.NoBlending,
    side: opts.side ?? THREE.FrontSide,
    uniforms: { uKey: { value: key }, ...uniforms },
  });
}

// Area-weighted points on every mesh of a group, in group space.
// shadeOf(mesh) gives [base, bright] for that part (base < 0: lit in the shader).
// front: drop faces turned away from the viewer (z normal below the limit).
export function sampleGroup(group, n, R, shadeOf, front = -0.15) {
  group.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(group.matrixWorld).invert();
  const tris = [];
  let total = 0;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), nr = new THREE.Vector3();
  group.traverse((m) => {
    if (!m.isMesh || m.userData.noSample) return;
    const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry;
    const p = g.attributes.position;
    const mat = new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld);
    const sh = shadeOf(m);
    for (let i = 0; i < p.count; i += 3) {
      a.fromBufferAttribute(p, i).applyMatrix4(mat);
      b.fromBufferAttribute(p, i + 1).applyMatrix4(mat);
      c.fromBufferAttribute(p, i + 2).applyMatrix4(mat);
      nr.subVectors(b, a).cross(c.clone().sub(a));
      const area = nr.length() / 2;
      if (area < 1e-9) continue;
      nr.normalize();
      if (nr.z < front && !m.userData.twoSided) continue;
      total += area;
      tris.push({ a: a.clone(), b: b.clone(), c: c.clone(), n: nr.clone(), sh, acc: total });
    }
    if (g !== m.geometry) g.dispose();
  });
  const pos = new Float32Array(n * 3), nrm = new Float32Array(n * 3), sh = new Float32Array(n * 2);
  if (!tris.length) return { pos, nrm, sh };
  const p = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const x = R() * total;
    let lo = 0, hi = tris.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (tris[mid].acc < x) lo = mid + 1; else hi = mid; }
    const t = tris[lo];
    let u = R(), v = R();
    if (u + v > 1) { u = 1 - u; v = 1 - v; }
    p.copy(t.a).addScaledVector(t.b.clone().sub(t.a), u).addScaledVector(t.c.clone().sub(t.a), v);
    pos.set([p.x, p.y, p.z], i * 3);
    nrm.set([t.n.x, t.n.y, t.n.z], i * 3);
    sh.set(t.sh, i * 2);
  }
  return { pos, nrm, sh };
}

function disposeGroup(group) {
  group.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
      if (m.uniforms) Object.values(m.uniforms).forEach((u) => { if (u.value && u.value.isTexture) u.value.dispose(); });
      m.dispose();
    });
  });
}
export const meshBase = (group, size, tick, shadeOf, extra = {}) => ({
  kind: 'mesh', group, size, tick,
  sample: (n, R) => sampleGroup(group, n, R, shadeOf, extra.front),
  dispose: () => disposeGroup(group),
  ...extra,
});

// ── LootLens: magnifier. Turns slowly, a light runs round the rim. ──
const lensFrag = /* glsl */ `
uniform float uPart, uSweep, uLen;
varying vec3 vN; varying vec3 vP;
const float PI = 3.14159265;
void main() {
  float s;
  if (uPart < 0.5) {
    s = 0.2 + 0.78 * pow(litOf(vN), 1.6);
    float da = mod(atan(vP.y, vP.x) - uSweep + PI, 2.0 * PI) - PI;
    s += 0.5 * exp(-da * da / 0.06);
  } else if (uPart < 1.5) {
    float r = length(vP.xy) / 0.86;
    float a = atan(vP.y, vP.x);
    float arc = exp(-pow((r - 0.72) / 0.06, 2.0)) * smoothstep(1.15, 1.35, a) * (1.0 - smoothstep(2.4, 2.65, a));
    s = 0.13 + 0.85 * arc + 0.06 * (1.0 - r);
  } else {
    float q = vP.y / uLen + 0.5;
    s = 0.18 + 0.62 * max(dot(normalize(vN), uKey), 0.0) - (sin(q * 40.0) > 0.7 ? 0.2 : 0.0);
  }
  gl_FragColor = vec4(clamp(s, 0.0, 1.0), 0.0, 0.0, 1.0);
}
`;
function magnifier(key) {
  const group = new THREE.Group();
  const len = Math.hypot(0.97, 0.97);
  const mk = (part, ex = {}) => shadeMat(lensFrag, { uPart: { value: part }, uSweep: { value: 0 }, uLen: { value: 1 }, ...ex }, key);
  const ringM = mk(0);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.14, 24, 120), ringM);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.86, 72), mk(1));
  glass.position.z = -0.02;
  const handle = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, len, 6, 20), mk(2, { uLen: { value: len + 0.32 } }));
  handle.position.set(1.265, -1.265, 0);
  handle.rotation.z = -135 * Math.PI / 180;
  ring.userData.sh = [-1, 1]; glass.userData.sh = [0.14, 0.5]; handle.userData.sh = [-1, 0.85];
  group.add(glass, handle, ring);
  return meshBase(group, { d: [0.56, 0.40, 0.17], m: [0.45, 0.36, 0.26] }, (c) => {
    const hold = c.isTo ? c.hold : 0;
    // Yaw phase set so the Reduce Motion clock (t 3.7) lands face on.
    group.rotation.set(0.38 + 0.06 * Math.sin(c.t * 0.5), 0.42 * Math.sin((2 * Math.PI * (c.t - 3.7)) / 11) + 0.5 * (hold - 0.5), 0.04 * Math.sin(c.t * 0.37));
    ringM.uniforms.uSweep.value = c.t * 1.5;
  }, (m) => m.userData.sh);
}

// ── AuraJam: record, spinning, grooves pulse on the beat. ──
const discFrag = /* glsl */ `
uniform float uSpin, uT;
varying vec3 vN; varying vec3 vP;
void main() {
  float r = length(vP.xz);
  float a = atan(vP.z, vP.x);
  float s;
  if (abs(vN.y) < 0.5 && r > 0.9) { s = 0.32; }
  else if (r < 0.04) { s = 0.0; }
  else if (r < 0.34) {
    // Pinwheel label (as the mock): four blades that carry the spin.
    float bl = 0.5 + 0.5 * cos(4.0 * (a - uSpin) + r * 9.0);
    s = 0.5 + 0.45 * smoothstep(0.35, 0.75, bl);
  } else {
    float beat = exp(-fract(uT * 2.0) * 4.0);
    float wave = exp(-pow((r - 0.34 - fract(uT * 2.0) * 0.8) * 9.0, 2.0));
    float groove = 0.55 + 0.45 * sin(r * 150.0) * (0.75 + 0.5 * beat);
    float sheen = pow(max(cos(2.0 * (a - 0.6)), 0.0), 6.0) * 0.85;
    s = 0.24 + sheen * groove * 0.9 + 0.14 * wave + 0.05 * beat;
  }
  gl_FragColor = vec4(clamp(s, 0.0, 1.0), 0.0, 0.0, 1.0);
}
`;
function record(key) {
  const prof = [[0.04, 0.012], [0.33, 0.016], [0.345, 0.008], [0.985, 0.008], [1, 0], [1, -0.05], [0.04, -0.05]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const mat = shadeMat(discFrag, { uSpin: { value: 0 }, uT: { value: 0 } }, key);
  const mesh = new THREE.Mesh(new THREE.LatheGeometry(prof, 160), mat);
  mesh.userData.sh = [0.45, 0.9];
  const group = new THREE.Group();
  group.add(mesh);
  return meshBase(group, { d: [0.58, 0.38, 0.30], m: [0.48, 0.36, 0.40] }, (c) => {
    const hold = c.isTo ? c.hold : 0;
    group.rotation.set(0.44 + 0.035 * Math.sin(c.t * 0.6) + 0.04 * (hold - 0.5), 0, 0.05 * Math.sin(c.t * 0.4) - 0.08);
    mat.uniforms.uSpin.value = c.t * 1.6;
    mat.uniforms.uT.value = c.t;
  }, (m) => m.userData.sh, { front: -2 });
}

// ── IronParse: terrain, drawn by the flock itself (ridge-line rows + path). ──
function terrain() {
  return { kind: 'terrain', size: { d: [0.6, 0.45, 0.3], m: [0.5, 0.3, 0.3] }, tick() {}, sample: null, dispose() {} };
}

export const FACTORIES = { magnifier, record, terrain };
export function makeObject(type, key, palette) {
  const f = FACTORIES[type];
  if (!f) throw new Error('unknown work object: ' + type);
  return f(key, palette);
}
