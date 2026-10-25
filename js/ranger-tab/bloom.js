// Cheap quarter-res bloom over the dither output: threshold the brightest
// glyphs, blur small, add back. Glyph edges stay hard; the tab glows.
import * as THREE from 'three';

const vert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const brightFrag = /* glsl */ `
uniform sampler2D tSrc; uniform vec2 uTexel; varying vec2 vUv;
vec3 pick(vec2 o) {
  vec3 c = texture2D(tSrc, vUv + o * uTexel).rgb;
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  return c * smoothstep(0.6, 0.9, l);
}
void main() {
  vec3 c = pick(vec2(-1.0, -1.0)) + pick(vec2(1.0, -1.0)) + pick(vec2(-1.0, 1.0)) + pick(vec2(1.0, 1.0));
  gl_FragColor = vec4(c * 0.25, 1.0);
}
`;

const blurFrag = /* glsl */ `
uniform sampler2D tSrc; uniform vec2 uDir; varying vec2 vUv;
void main() {
  vec3 c = texture2D(tSrc, vUv).rgb * 0.2270;
  c += (texture2D(tSrc, vUv + uDir * 1.3846).rgb + texture2D(tSrc, vUv - uDir * 1.3846).rgb) * 0.3162;
  c += (texture2D(tSrc, vUv + uDir * 3.2308).rgb + texture2D(tSrc, vUv - uDir * 3.2308).rgb) * 0.0703;
  gl_FragColor = vec4(c, 1.0);
}
`;

const compFrag = /* glsl */ `
uniform sampler2D tBase; uniform sampler2D tBloom; uniform float uStrength; varying vec2 vUv;
void main() {
  vec3 c = texture2D(tBase, vUv).rgb + texture2D(tBloom, vUv).rgb * uStrength;
  gl_FragColor = vec4(c, 1.0);
}
`;

function fsPass(fragmentShader, uniforms) {
  const material = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader, uniforms, depthTest: false, depthWrite: false });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
  const mesh = new THREE.Mesh(geo, material);
  mesh.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(mesh);
  return { scene, material, dispose: () => { geo.dispose(); material.dispose(); } };
}

const rtOpts = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false };

export function makeBloom(strength = 0.9) {
  const base = new THREE.WebGLRenderTarget(1, 1, { ...rtOpts, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
  const a = new THREE.WebGLRenderTarget(1, 1, rtOpts);
  const b = new THREE.WebGLRenderTarget(1, 1, rtOpts);
  const bright = fsPass(brightFrag, { tSrc: { value: base.texture }, uTexel: { value: new THREE.Vector2() } });
  const blur = fsPass(blurFrag, { tSrc: { value: null }, uDir: { value: new THREE.Vector2() } });
  const comp = fsPass(compFrag, { tBase: { value: base.texture }, tBloom: { value: a.texture }, uStrength: { value: strength } });
  let qw = 1, qh = 1;
  const cam = new THREE.Camera();

  function setSize(w, h) {
    base.setSize(w, h);
    qw = Math.max(1, Math.round(w / 4)); qh = Math.max(1, Math.round(h / 4));
    a.setSize(qw, qh); b.setSize(qw, qh);
    bright.material.uniforms.uTexel.value.set(1 / w, 1 / h);
  }

  // Render the dither output into `base`, then call finish() to composite to screen.
  function finish(renderer) {
    renderer.setRenderTarget(a); renderer.render(bright.scene, cam);
    blur.material.uniforms.tSrc.value = a.texture; blur.material.uniforms.uDir.value.set(1 / qw, 0);
    renderer.setRenderTarget(b); renderer.render(blur.scene, cam);
    blur.material.uniforms.tSrc.value = b.texture; blur.material.uniforms.uDir.value.set(0, 1 / qh);
    renderer.setRenderTarget(a); renderer.render(blur.scene, cam);
    renderer.setRenderTarget(null); renderer.render(comp.scene, cam);
  }

  return {
    target: base, setSize, finish, uniforms: comp.material.uniforms,
    dispose() { [base, a, b].forEach((t) => t.dispose()); [bright, blur, comp].forEach((p) => p.dispose()); },
  };
}
