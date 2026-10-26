// Shared pieces for the work-run objects (objects.js and its sibling factory
// files): the shade material, the flock sampler, disposal and small canvas
// helpers. Materials write a 0..1 shade into r of the scene target, alpha 1,
// and the scanline pass maps it through the live palette.
import * as THREE from 'three';

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const TAU = Math.PI * 2;

export const objVert = /* glsl */ `
varying vec3 vN; varying vec3 vP; varying vec3 vW; varying vec2 vUv;
void main() {
  vN = normalize(normalMatrix * normal); vP = position; vUv = uv;
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
// A mesh may instead carry userData.shadeAt(p, uv, n) giving [base, bright] per
// point, or null to refuse the point (outside a die-cut, say); refused points
// are drawn again. front: drop faces turned away from the viewer.
export function sampleGroup(group, n, R, shadeOf, front = -0.15) {
  group.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(group.matrixWorld).invert();
  const tris = [];
  let total = 0;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), nr = new THREE.Vector3();
  group.traverse((m) => {
    if (!m.isMesh || m.userData.noSample || !m.visible) return;
    const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry;
    const p = g.attributes.position;
    const uv = g.attributes.uv;
    const mat = new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld);
    const flip = mat.determinant() < 0; // a mirrored copy turns its winding inside out
    const sh = m.userData.shadeAt ? null : shadeOf(m);
    for (let i = 0; i < p.count; i += 3) {
      const ib = flip ? i + 2 : i + 1, ic = flip ? i + 1 : i + 2;
      a.fromBufferAttribute(p, i).applyMatrix4(mat);
      b.fromBufferAttribute(p, ib).applyMatrix4(mat);
      c.fromBufferAttribute(p, ic).applyMatrix4(mat);
      nr.subVectors(b, a).cross(c.clone().sub(a));
      const area = nr.length() / 2;
      if (area < 1e-9) continue;
      nr.normalize();
      if (nr.z < front && !m.userData.twoSided) continue;
      total += area;
      const t = { a: a.clone(), b: b.clone(), c: c.clone(), n: nr.clone(), sh, m, acc: total };
      if (uv) t.uv = [i, ib, ic].map((k) => new THREE.Vector2().fromBufferAttribute(uv, k));
      tris.push(t);
    }
    if (g !== m.geometry) g.dispose();
  });
  const pos = new Float32Array(n * 3), nrm = new Float32Array(n * 3), sh = new Float32Array(n * 2);
  if (!tris.length) return { pos, nrm, sh };
  const p = new THREE.Vector3(), q = new THREE.Vector2();
  for (let i = 0; i < n; i++) {
    for (let tries = 0; tries < 40; tries++) {
      const x = R() * total;
      let lo = 0, hi = tris.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (tris[mid].acc < x) lo = mid + 1; else hi = mid; }
      const t = tris[lo];
      let u = R(), v = R();
      if (u + v > 1) { u = 1 - u; v = 1 - v; }
      p.copy(t.a).addScaledVector(t.b.clone().sub(t.a), u).addScaledVector(t.c.clone().sub(t.a), v);
      let s = t.sh;
      if (!s) {
        if (t.uv) q.copy(t.uv[0]).multiplyScalar(1 - u - v).addScaledVector(t.uv[1], u).addScaledVector(t.uv[2], v);
        s = t.m.userData.shadeAt(p, q, t.n);
        if (!s && tries < 39) continue;
        s = s || [0, 0];
      }
      pos.set([p.x, p.y, p.z], i * 3);
      nrm.set([t.n.x, t.n.y, t.n.z], i * 3);
      sh.set(s, i * 2);
      break;
    }
  }
  return { pos, nrm, sh };
}

export function disposeGroup(group) {
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

// Motion that lives only inside the hold: 0 as the object forms and as it
// leaves, 1 between, so the pose the dots condense onto is the pose shown.
export const inHold = (c, a = 0.1, b = 0.9) => (c.isTo ? smooth(0, a, c.hold) * (1 - smooth(b, 1, c.hold)) : 0);

// A grey shade canvas (r = shade) as a texture, plus a sampler on its pixels.
// clear: leave the ground transparent, so alpha can cut a shape out.
export function shadeCanvas(size, draw, clear = false) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const g = cv.getContext('2d');
  if (!clear) { g.fillStyle = '#000'; g.fillRect(0, 0, size, size); }
  draw(g, size);
  const img = g.getImageData(0, 0, size, size).data;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = 4;
  const at = (u, v) => {
    const x = clamp(Math.floor(u * size), 0, size - 1), y = clamp(Math.floor((1 - v) * size), 0, size - 1);
    const k = (y * size + x) * 4;
    return [img[k] / 255, img[k + 3] / 255];
  };
  return { tex, at };
}
export const grey = (v) => { const k = Math.round(clamp(v, 0, 1) * 255); return `rgb(${k},${k},${k})`; };
