// Signature objects for the work run. Each is built lazily (only the outgoing
// and incoming objects exist at once) and drawn by the hero's own stipple.
// Shared helpers live in obj-core.js; product objects in obj-products.js and
// brand-mark objects in obj-marks.js. makeObject() is the one entry point.
//
// A factory returns:
//   group               THREE.Group in object units (radius about 1, facing +z)
//   size                { d: [cx, cy, R], m: [cx, cy, R] } desktop / phone, as
//                       fractions of the viewport (cx, cy of W, H; R of S)
//   tick(c)             per frame: { t, hold, e, isTo, isFrom, mobile }
//                       (the outgoing object gets hold 1: it finished its hold)
//   sample(n, R)        n flock targets in group space: { pos, nrm, sh }
//                       (sh: vec2 base shade, brightness; base < 0 means lit)
//   tap?()              optional, a click on the object
//   kind                'mesh' (default) or 'terrain' (flock-drawn, no group)
//   dispose()
import * as THREE from 'three';
import { shadeMat, meshBase } from './obj-core.js';
import { PRODUCT_FACTORIES } from './obj-products.js';
import { MARK_FACTORIES } from './obj-marks.js';

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

export const FACTORIES = { magnifier, record, terrain, ...PRODUCT_FACTORIES, ...MARK_FACTORIES };
export function makeObject(project, key) {
  const f = FACTORIES[project.object];
  if (!f) throw new Error('unknown work object: ' + project.object);
  return f(key, project);
}
