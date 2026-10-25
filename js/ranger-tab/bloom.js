// Neon glow over the stipple: every lit dot gets a halo in its own hue, at two
// sizes (tight quarter-res, wide eighth-res), then a chromatic split along x
// (blue/violet one way, orange the other) and occasional glitch bands.
import * as THREE from 'three';

const vert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

// 4-tap box downsample minus the ground colour, so only lit dots glow.
const downFrag = /* glsl */ `
uniform sampler2D tSrc; uniform vec2 uTexel; uniform vec3 uGround; varying vec2 vUv;
void main() {
  vec3 c = texture2D(tSrc, vUv + vec2(-1.0, -1.0) * uTexel).rgb + texture2D(tSrc, vUv + vec2(1.0, -1.0) * uTexel).rgb
         + texture2D(tSrc, vUv + vec2(-1.0, 1.0) * uTexel).rgb + texture2D(tSrc, vUv + vec2(1.0, 1.0) * uTexel).rgb;
  gl_FragColor = vec4(max(c * 0.25 - uGround, 0.0), 1.0);
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
uniform sampler2D tBase, tTight, tWide;
uniform vec2 uRes;          // device px
uniform float uChroma;      // device px
uniform float uTight, uWide;
uniform float uGlitch, uSeed, uSwap;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec3 split(sampler2D t, vec2 uv, float o) {
  return vec3(texture2D(t, uv + vec2(o, 0.0)).r, texture2D(t, uv).g, texture2D(t, uv - vec2(o, 0.0)).b);
}
void main() {
  vec2 uv = vUv;
  float chroma = uChroma;
  float struck = 0.0;
  if (uGlitch > 0.0) {
    float rows = 12.0 + floor(hash(vec2(uSeed, 1.0)) * 16.0);
    float b = floor(uv.y * rows + hash(vec2(floor(uv.y * 60.0), uSeed)) * 0.6);
    if (hash(vec2(b, uSeed)) > 0.78) {
      float px = (6.0 + 14.0 * hash(vec2(b, uSeed + 3.0))) * sign(hash(vec2(b, uSeed + 5.0)) - 0.5);
      uv.x += px * (uRes.y / 900.0) / uRes.x * uGlitch;
      chroma *= 4.0;
      struck = uGlitch;
    }
  }
  float o = chroma / uRes.x;
  vec3 c = split(tBase, uv, o * 0.35); // dots keep their colour; the split lives mostly in the halo
  c += split(tTight, uv, o * 1.5) * uTight;
  c += split(tWide, uv, o * 2.5) * uWide;
  // Struck bands flash: orange swaps to violet-blue (reference palette), or just lifts (gold).
  if (struck > 0.0) c = mix(c, mix(c * 1.5, c.bgr * 1.35, uSwap), 0.6 * struck);
  // Soft shoulder on the brightest channel only, so stacked halos never clip
  // flat and saturated hues stay saturated instead of washing toward white.
  float m = max(max(c.r, c.g), max(c.b, 1e-4));
  c *= (1.0 - exp(-m * 1.15)) / m;
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

const lin = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, type: THREE.HalfFloatType };

export function makeBloom(ground) {
  const base = new THREE.WebGLRenderTarget(1, 1, { ...lin, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
  const q1 = new THREE.WebGLRenderTarget(1, 1, lin);
  const q2 = new THREE.WebGLRenderTarget(1, 1, lin);
  const e1 = new THREE.WebGLRenderTarget(1, 1, lin);
  const e2 = new THREE.WebGLRenderTarget(1, 1, lin);
  const down = fsPass(downFrag, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uGround: { value: new THREE.Vector3(ground.r, ground.g, ground.b) } });
  const blur = fsPass(blurFrag, { tSrc: { value: null }, uDir: { value: new THREE.Vector2() } });
  const comp = fsPass(compFrag, {
    tBase: { value: base.texture }, tTight: { value: q1.texture }, tWide: { value: e1.texture },
    uRes: { value: new THREE.Vector2() }, uChroma: { value: 3 },
    uTight: { value: 1.9 }, uWide: { value: 1.6 }, uGlitch: { value: 0 }, uSeed: { value: 0 }, uSwap: { value: 1 },
  });
  const cam = new THREE.Camera();
  const size = { w: 1, h: 1, qw: 1, qh: 1, ew: 1, eh: 1 };

  function setSize(w, h, dpr) {
    base.setSize(w, h);
    size.w = w; size.h = h;
    size.qw = Math.max(1, Math.round(w / 4)); size.qh = Math.max(1, Math.round(h / 4));
    size.ew = Math.max(1, Math.round(w / 8)); size.eh = Math.max(1, Math.round(h / 8));
    q1.setSize(size.qw, size.qh); q2.setSize(size.qw, size.qh);
    e1.setSize(size.ew, size.eh); e2.setSize(size.ew, size.eh);
    comp.material.uniforms.uRes.value.set(w, h);
    comp.material.uniforms.uChroma.value = 1.75 * dpr;
  }

  function run(renderer, rt, src, texel, ground) {
    down.material.uniforms.tSrc.value = src;
    down.material.uniforms.uTexel.value.copy(texel);
    down.material.uniforms.uGround.value.copy(ground);
    renderer.setRenderTarget(rt); renderer.render(down.scene, cam);
  }
  function blur2(renderer, a, b, w, h, spread) {
    blur.material.uniforms.tSrc.value = a.texture; blur.material.uniforms.uDir.value.set(spread / w, 0);
    renderer.setRenderTarget(b); renderer.render(blur.scene, cam);
    blur.material.uniforms.tSrc.value = b.texture; blur.material.uniforms.uDir.value.set(0, spread / h);
    renderer.setRenderTarget(a); renderer.render(blur.scene, cam);
  }

  const zero = new THREE.Vector3();
  const g = down.material.uniforms.uGround.value.clone();
  function finish(renderer) {
    run(renderer, q1, base.texture, new THREE.Vector2(1 / size.w, 1 / size.h), g);
    run(renderer, e1, q1.texture, new THREE.Vector2(1 / size.qw, 1 / size.qh), zero);
    blur2(renderer, q1, q2, size.qw, size.qh, 1.0);
    blur2(renderer, e1, e2, size.ew, size.eh, 1.6);
    renderer.setRenderTarget(null); renderer.render(comp.scene, cam);
  }

  return {
    target: base, setSize, finish, uniforms: comp.material.uniforms,
    dispose() { [base, q1, q2, e1, e2].forEach((t) => t.dispose()); [down, blur, comp].forEach((p) => p.dispose()); },
  };
}
