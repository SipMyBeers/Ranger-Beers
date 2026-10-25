// Scanline stipple render for the Ranger tab, after Dither Boy v3 "Glitch Art":
// the tab is drawn as rows of tiny dots whose rows ripple like a seismograph,
// coloured by a gradient map on luminance with a per-material hue split, over
// a field of amber ridge lines that climb the tab's silhouette (a Joy Division
// ridge plot). Glow, chromatic split and glitch bands live in glow.js.
import * as THREE from 'three';

export const MAX_PTS = 16;
export const RIDGE_LINES = 14;
export const ROW = 3.0; // css px between rows
export const DOT = 2.0; // css px between dots along a row

// Raw sRGB values: ShaderMaterial output is not colour-managed, so no conversion.
const raw = (h) => { const c = new THREE.Color(); c.setHex(h, THREE.LinearSRGBColorSpace); return c; };

// Dark to bright. Reference palette measured off the Dither Boy screenshot.
export const PALETTES = {
  reference: [0x0a0006, 0x600040, 0xc04020, 0xe06020, 0xe08040, 0x8080e0, 0xa0a0e0, 0xe0c0e0, 0xf0f0f0],
  gold: [0x050302, 0x1e1000, 0x3a2200, 0x7d4e08, 0xc07a10, 0xda9e18, 0xf4c220, 0xffe9a0, 0xffffff],
};
// Where the ridge lines sit on each ramp (amber in both).
const RIDGE_T = { reference: 0.43, gold: 0.55 };

const vert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const common = /* glsl */ `
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float hash3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
`;

// ── Ridge lift: one texel per (x, line). R = how far the line climbs, css px.
const ridgeFrag = /* glsl */ `
precision highp float;
uniform sampler2D tScene;
uniform vec2 uCss;
uniform float uTop, uSpacing, uLines, uScroll, uT;
uniform vec4 uPts[${MAX_PTS}]; // device px, bottom-left origin
uniform float uAge[${MAX_PTS}];
uniform float uDpr;
varying vec2 vUv;
${common}
float covered(float x, float yTop) {
  if (yTop < 0.0 || yTop > uCss.y) return 0.0;
  return step(0.25, texture2D(tScene, vec2(x / uCss.x, 1.0 - yTop / uCss.y)).a);
}
void main() {
  float x = vUv.x * uCss.x;
  float k = floor(vUv.y * uLines);
  float baseY = uTop + k * uSpacing;
  float range = 0.3 * uCss.y;
  float stepY = range / 24.0;
  float lift = 0.0;
  // Coverage of the column above the line, blurred wide in x so lines climb shoulders.
  for (int s = -3; s <= 3; s++) {
    float xs = x + float(s) * 22.0;
    float wx = 1.0 - abs(float(s)) / 4.0;
    float acc = 0.0;
    for (int j = 0; j < 24; j++) {
      float fj = float(j);
      acc += covered(xs, baseY - fj * stepY) * (1.0 - 0.85 * fj / 24.0);
    }
    lift += acc * stepY * wx;
  }
  lift /= 4.0; // sum of wx
  lift *= 1.0 + 0.8 * uScroll;
  // Pointer bump travelling outward along nearby lines.
  float bump = 0.0;
  for (int i = 0; i < ${MAX_PTS}; i++) {
    vec2 p = vec2(uPts[i].x / uDpr, uCss.y - uPts[i].y / uDpr);
    float near = exp(-pow((baseY - p.y) / (uSpacing * 1.2), 2.0));
    float d = abs(x - p.x) - uAge[i] * 420.0;
    bump += near * exp(-d * d / 1600.0) * exp(-uAge[i] / 0.7);
  }
  lift += 22.0 * min(bump, 1.5);
  gl_FragColor = vec4(lift, 0.0, 0.0, 1.0);
}
`;

const mainFrag = /* glsl */ `
precision highp float;
uniform sampler2D tScene;   // tab, alpha = material id (1 body, .9 wall, .75 letters, .5 field)
uniform sampler2D tPart;    // glitter
uniform sampler2D tRidge;   // ridge lift per (x, line)
uniform vec2 uCss;
uniform float uDpr, uT, uIntro, uBand, uExposure, uScroll;
uniform float uTop, uSpacing, uLines, uRidgeT;
uniform vec4 uPts[${MAX_PTS}];
uniform float uAge[${MAX_PTS}];
uniform float uRadius;      // device px
uniform vec3 uPal[9];
varying vec2 vUv;
${common}
const float ROW = ${ROW.toFixed(3)};
const float DOT = ${DOT.toFixed(3)};

vec3 pal(float t) {
  float f = clamp(t, 0.0, 1.0) * 8.0;
  float i = floor(f);
  float w = f - i;
  vec3 a = uPal[0], b = uPal[0];
  for (int k = 0; k < 9; k++) {
    if (float(k) == i) a = uPal[k];
    if (float(k) == min(i + 1.0, 8.0)) b = uPal[k];
  }
  // Sharpened blend: colour regions read as blobs of one hue, never the grey
  // you get halfway between orange and violet.
  return mix(a, b, smoothstep(0.3, 0.7, w));
}

// Low-frequency value noise: drifts colour blobs across the surface.
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}

float onIntro(float x, float yTop) {
  float scan = (x / uCss.x + 1.0 - yTop / uCss.y) * 0.5;
  return step(scan, uIntro * 1.05);
}

void main() {
  vec2 dev = gl_FragCoord.xy;
  float x = dev.x / uDpr;
  float y = uCss.y - dev.y / uDpr;           // css px, top origin
  float hs = max(0.75, 0.75 / uDpr);        // dot half-size, css px (1.5 css dot)
  vec3 col = vec3(0.0);

  // Pointer and sweep agitate the rows.
  float ptr = 0.0;
  for (int i = 0; i < ${MAX_PTS}; i++) {
    vec2 d = dev - uPts[i].xy;
    ptr += exp(-dot(d, d) / (uRadius * uRadius)) * exp(-uAge[i] / 0.5);
  }
  ptr = min(ptr, 1.0);
  float band = 0.0;
  if (uBand > -0.5) {
    float bx = x / uCss.x - uBand + (y / uCss.y - 0.5) * 0.18;
    band = exp(-bx * bx / 0.0035);
  }
  float amp = ROW * (0.9 + 2.6 * ptr + 2.0 * band + 1.0 * uScroll);

  vec4 here = texture2D(tScene, vec2(x / uCss.x, 1.0 - y / uCss.y));
  if (here.a >= 0.25) {
    // ── Tab: wavy rows of dots. Check the rows that could have rippled to here.
    float di = floor(x / DOT);
    float xc = (di + 0.5) * DOT;
    float r0 = floor(y / ROW);
    for (int n = -4; n <= 4; n++) {
      float r = r0 + float(n);
      float yc0 = (r + 0.5) * ROW;
      // Neighbouring rows share their phase so rows ripple together like a
      // seismograph stack instead of crossing into a mesh.
      float h1 = r * 0.045 + 0.2 * hash(vec2(r, 1.0));
      float h2 = r * 0.07 + 0.25 * hash(vec2(r, 2.0));
      float h3 = r * 0.11 + 0.35 * hash(vec2(r, 3.0));
      float wave = 0.35 * sin(xc * 0.023 + h1 * 6.283 + uT * 0.7)
                 + 0.40 * sin(xc * 0.11 + h2 * 6.283 - uT * 1.3)
                 + 0.25 * sin(xc * 0.27 + h3 * 6.283 + uT * 2.1);
      float yc = yc0 + amp * wave + (hash(vec2(di, r)) - 0.5) * 0.35 * ROW;
      if (abs(y - yc) > hs) continue;
      if (onIntro(xc, yc0) < 0.5) continue;
      vec4 s = texture2D(tScene, vec2(xc / uCss.x, 1.0 - yc0 / uCss.y));
      if (s.a < 0.25) continue;
      vec3 c = pow(1.0 - exp(-s.rgb * uExposure), vec3(1.0 / 2.2));
      float L = clamp(dot(c, vec3(0.2126, 0.7152, 0.0722)) + band * 0.8, 0.0, 1.0);
      float blob = vnoise(vec2(xc * 0.011 + uT * 0.05, yc0 * 0.016 - uT * 0.03)) - 0.5;
      float t, dens, gain;
      if (s.a < 0.62) {            // black recess: sparse dim magenta
        t = 0.08 + 0.2 * L; dens = 0.10 + 0.3 * L; gain = 0.55;
      } else if (s.a < 0.82) {     // raised letters: violet to white
        t = 0.6 + 0.4 * L + 0.15 * blob; dens = 0.55 + 0.45 * L; gain = 1.05;
      } else if (s.a < 0.95) {     // shadowed bevel walls: magenta to red-orange
        t = 0.1 + 0.28 * L; dens = 0.35 + 0.5 * L; gain = 0.85;
      } else {                     // body: amber, light-facing faces break to violet/white
        t = 0.1 + 0.34 * pow(L, 1.8) + 0.6 * blob; // bright gold body still lands in saturated orange
        if (L > 0.85) t = 0.62 + 0.38 * (L - 0.85) / 0.15;
        dens = 0.15 + 0.7 * smoothstep(0.1, 0.8, L); gain = 0.8;
      }
      if (hash(vec2(di + 0.37, r * 1.13)) > dens) continue;
      float halfx = mix(hs, DOT * 0.56, smoothstep(0.55, 0.92, L));
      if (abs(x - xc) > halfx) continue;
      col = max(col, pal(t) * gain * (0.65 + 0.5 * L));
    }
  } else {
    // ── Background: stippled ridge lines climbing the tab silhouette.
    float di = floor(x / DOT);
    float xc = (di + 0.5) * DOT;
    for (int k = 0; k < ${RIDGE_LINES}; k++) {
      float fk = float(k);
      float base = uTop + fk * uSpacing;
      float lift = texture2D(tRidge, vec2(xc / uCss.x, (fk + 0.5) / uLines)).r;
      float jit = 2.6 * sin(xc * 0.013 + fk * 1.7 + uT * 0.25)
                + 1.3 * sin(xc * 0.09 + fk * 3.1 + uT * 0.6)
                + (hash(vec2(di, fk)) - 0.5) * 1.8;
      float yl = base - lift + jit;
      if (abs(y - yl) > hs) continue;
      if (abs(x - xc) > DOT * 0.42) continue;
      if (hash(vec2(di * 1.7, fk + 9.0)) > 0.86) continue;
      if (onIntro(xc, yl) < 0.5) continue;
      float tt = uRidgeT + 0.08 * (hash(vec2(fk, 4.0)) - 0.5) + 0.05 * sin(xc * 0.004 + fk);
      col = max(col, pal(tt) * 1.1);
    }
  }

  // Glitter: a few dots drifting through.
  vec3 pc = texture2D(tPart, vec2(x / uCss.x, 1.0 - y / uCss.y)).rgb;
  float pl = max(pc.r, max(pc.g, pc.b));
  if (pl > 0.08) col = max(col, pal(0.3 + 0.7 * clamp(pl, 0.0, 1.0)) * (0.5 + 0.5 * pl));

  gl_FragColor = vec4(uPal[0] + col, 1.0);
}
`;

function fsScene(material) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
  const mesh = new THREE.Mesh(geo, material);
  mesh.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(mesh);
  return { scene, geo };
}

export function makeScanlinePass(sceneTex, partTex, paletteName = 'reference') {
  const pts = Array.from({ length: MAX_PTS }, () => new THREE.Vector4(-1e5, -1e5, 0, 0));
  const ages = new Array(MAX_PTS).fill(99);
  const ridgeRT = new THREE.WebGLRenderTarget(1, RIDGE_LINES, {
    type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false,
  });
  const shared = {
    uCss: { value: new THREE.Vector2(1, 1) },
    uDpr: { value: 1 },
    uT: { value: 0 },
    uScroll: { value: 0 },
    uTop: { value: 0 },
    uSpacing: { value: 50 },
    uLines: { value: RIDGE_LINES },
    uPts: { value: pts },
    uAge: { value: ages },
  };
  const ridgeMat = new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: ridgeFrag, depthTest: false, depthWrite: false,
    uniforms: { ...shared, tScene: { value: sceneTex } },
  });
  const pal = (PALETTES[paletteName] || PALETTES.reference).map(raw);
  const mainMat = new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: mainFrag, depthTest: false, depthWrite: false,
    uniforms: {
      ...shared,
      tScene: { value: sceneTex },
      tPart: { value: partTex },
      tRidge: { value: ridgeRT.texture },
      uIntro: { value: 0 },
      uBand: { value: -1 },
      uExposure: { value: 2.6 },
      uRadius: { value: 120 },
      uPal: { value: pal },
      uRidgeT: { value: RIDGE_T[paletteName] ?? RIDGE_T.reference },
    },
  });
  const ridge = fsScene(ridgeMat);
  const main = fsScene(mainMat);
  const cam = new THREE.Camera();

  return {
    uniforms: mainMat.uniforms,
    ground: pal[0],
    setSize(cssW, cssH, dpr) {
      ridgeRT.setSize(Math.max(1, Math.ceil(cssW / 2)), RIDGE_LINES);
      shared.uCss.value.set(cssW, cssH);
      shared.uDpr.value = dpr;
    },
    // Ridge lines: ~50 css px apart, scaled to the viewport, stretching on scroll-out.
    setRidge(cssH, scroll) {
      const spacing = (cssH * 0.84) / (RIDGE_LINES - 1);
      shared.uSpacing.value = spacing * (1 + 1.1 * scroll);
      shared.uTop.value = cssH * 0.08 - scroll * cssH * 0.35;
    },
    render(renderer, target) {
      renderer.setRenderTarget(ridgeRT);
      renderer.render(ridge.scene, cam);
      renderer.setRenderTarget(target);
      renderer.render(main.scene, cam);
    },
    dispose() {
      ridgeRT.dispose(); ridgeMat.dispose(); mainMat.dispose();
      ridge.geo.dispose(); main.geo.dispose();
    },
  };
}

