// Scanline stipple render for the Ranger tab, after Dither Boy v3 "Glitch Art":
// the tab is drawn as rows of tiny dots whose rows ripple like a seismograph,
// coloured by a gradient map with a per-material hue split, over
// a field of amber ridge lines that climb the tab's silhouette (a Joy Division
// ridge plot). Rows bend with surface depth and take their hue from the lit
// normal. Glow, chromatic split and glitch bands live in bloom.js.
import * as THREE from 'three';

export const MAX_PTS = 16;
export const RIDGE_LINES = 14;
export const ROW = 4.0; // css px between rows
export const DOT = 3.0; // css px between dots along a row (dots are 2x2)

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
// Two terms, taking the larger: lines that pass behind the tab rise over its
// silhouette (coverage above), and lines below the tab climb toward its
// underside so the arch gap fills with compressed contours instead of a void.
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
  if (yTop < 0.0 || yTop > uCss.y || x < 0.0 || x > uCss.x) return 0.0;
  return step(0.25, texture2D(tScene, vec2(x / uCss.x, 1.0 - yTop / uCss.y)).a);
}
void main() {
  float x = vUv.x * uCss.x;
  float k = floor(vUv.y * uLines);
  float baseY = uTop + k * uSpacing;
  float range = 0.3 * uCss.y;
  float stepY = range / 24.0;
  float urange = 0.5 * uCss.y;
  float ustep = urange / 32.0;
  float lift = 0.0, wsum = 0.0;
  for (int s = -4; s <= 4; s++) {
    float xs = x + float(s) * 26.0;
    float wx = 1.0 - abs(float(s)) / 5.0;
    float acc = 0.0;
    for (int j = 0; j < 24; j++) {
      float fj = float(j);
      acc += covered(xs, baseY - fj * stepY) * (1.0 - 0.85 * fj / 24.0);
    }
    // Distance up to the first covered pixel (the tab's underside).
    float d = -1.0;
    for (int j = 1; j <= 32; j++) {
      if (d < 0.0 && covered(xs, baseY - float(j) * ustep) > 0.5) d = float(j) * ustep;
    }
    // Below the tab: climb toward its underside (never into it). Behind it or
    // beside it: rise over the silhouette.
    bool below = d > 0.0 && covered(xs, baseY) < 0.5;
    lift += wx * (below ? d * 0.78 * max(0.0, 1.0 - d / urange) : acc * stepY);
    wsum += wx;
  }
  lift /= wsum;
  lift *= 1.0 + 0.8 * uScroll;
  // Pointer bump travelling outward along nearby lines.
  float bump = 0.0;
  for (int i = 0; i < ${MAX_PTS}; i++) {
    vec2 p = vec2(uPts[i].x / uDpr, uCss.y - uPts[i].y / uDpr);
    float near = exp(-pow((baseY - lift - p.y) / (uSpacing * 1.2), 2.0));
    float d = abs(x - p.x) - uAge[i] * 420.0;
    bump += near * exp(-d * d / 1600.0) * exp(-uAge[i] / 0.7);
  }
  lift += 22.0 * min(bump, 1.5);
  gl_FragColor = vec4(lift, 0.0, 0.0, 1.0);
}
`;

const mainFrag = /* glsl */ `
precision highp float;
uniform sampler2D tScene;   // tab colour, alpha = material id (1 body, .9 wall, .75 letters, .5 field)
uniform sampler2D tNorm;    // view-space normal in rgb, depth relative to the tab centre in a
uniform sampler2D tPart;    // glitter
uniform sampler2D tRidge;   // ridge lift per (x, line)
uniform vec2 uCss;
uniform float uDpr, uT, uIntro, uBand, uExposure, uScroll;
uniform float uTop, uSpacing, uLines, uRidgeT;
uniform vec4 uPts[${MAX_PTS}];
uniform float uAge[${MAX_PTS}];
uniform float uRadius;      // device px
uniform vec3 uKey;          // key light direction, view space
uniform float uTopo;        // css px of row lift per world unit of depth
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
  // Sharpened blend: big clean regions of one hue, never the grey halfway
  // between orange and violet.
  return mix(a, b, smoothstep(0.25, 0.75, w));
}

float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}

float onIntro(float x, float yTop) {
  float scan = (x / uCss.x + 1.0 - yTop / uCss.y) * 0.5;
  return step(scan, uIntro * 1.05);
}

// Smooth swells, 40-80 css px wavelength; neighbouring rows share phase.
float wave(float x, float y) {
  return 0.65 * sin(x * 0.085 + y * 0.012 + uT * 0.8)
       + 0.35 * sin(x * 0.142 - y * 0.021 - uT * 1.15);
}

void main() {
  vec2 dev = gl_FragCoord.xy;
  float x = dev.x / uDpr;
  float y = uCss.y - dev.y / uDpr;           // css px, top origin
  vec2 suv = vec2(x / uCss.x, 1.0 - y / uCss.y);
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
  float amp = 4.5 * (1.0 + 1.6 * ptr + 1.2 * band + 0.8 * uScroll);
  float di = floor(x / DOT);
  float xc = (di + 0.5) * DOT;

  vec4 here = texture2D(tScene, suv);
  if (here.a >= 0.25) {
    // ── Tab: rows are contours of v = y + wave + surface height, so they bend
    // over the bevels and letters like a topographic scan.
    vec4 nz = texture2D(tNorm, suv);
    vec3 n = normalize(nz.xyz + vec3(0.0, 0.0, 1e-4));
    float h = 1.5 / uCss.y;
    float topo = nz.a * uTopo;
    float dTopo = (texture2D(tNorm, suv - vec2(0.0, h)).a - texture2D(tNorm, suv + vec2(0.0, h)).a) * uTopo / 3.0;
    float v = y + amp * wave(x, y) + topo;
    float dv = 1.0 + dTopo + amp * (0.65 * 0.012 * cos(x * 0.085 + y * 0.012 + uT * 0.8)
                                  - 0.35 * 0.021 * cos(x * 0.142 - y * 0.021 - uT * 1.15));
    float g = clamp(abs(dv), 0.35, 3.0);
    // Letters carry denser rows so RANGER stays legible on a phone.
    bool letter = here.a >= 0.62 && here.a < 0.82;
    float rp = letter ? (uCss.x < 700.0 ? 2.75 : 3.25) : ROW;
    float r = floor(v / rp);
    float vc = (r + 0.5) * rp + (hash(vec2(di, r)) - 0.5) * 1.0; // 1px jitter
    if (abs(v - vc) / g <= (letter ? 0.6 : 0.7) && onIntro(x, y) > 0.5) { // rows ~1.4 css tall: the glow needs a dark gap to read as lines
      vec3 c = pow(1.0 - exp(-here.rgb * uExposure), vec3(1.0 / 2.2));
      float L = dot(c, vec3(0.2126, 0.7152, 0.0722));
      float ndl = dot(n, uKey);
      // Hue from the lit normal: toward the key = violet to white, sideways =
      // saturated orange, grazing/shadowed = magenta-red.
      float t, dens, gain;
      if (here.a < 0.62) {           // black recess
        t = 0.13 + 0.1 * clamp(ndl, 0.0, 1.0); dens = 0.1; gain = 0.5;
      } else if (here.a < 0.82) {    // raised letters: violet to white
        t = 0.7 + 0.3 * smoothstep(-0.2, 0.9, ndl); // lavender to white cores
        dens = 0.97; gain = 1.25;
      } else {                        // body face, bevels and walls
        if (here.a < 0.95) {         // side wall and bevels: magenta-red owns them
          t = 0.12 + 0.16 * smoothstep(-0.4, 0.9, ndl);
          dens = 0.45 + 0.45 * smoothstep(-0.4, 0.6, ndl); gain = 1.0;
        } else {
          t = 0.12 + 0.88 * smoothstep(-0.25, 1.6, ndl);
          if (L > 0.93) t = max(t, 0.8 + 0.2 * (L - 0.93) / 0.07);
          dens = 0.18 + 0.82 * smoothstep(-0.35, 0.55, ndl); gain = 1.0;
        }
      }
      t = clamp(t + band * 0.35, 0.0, 1.0);
      dens = clamp(dens + band * 0.6 + ptr * 0.2, 0.0, 1.0);
      // Coherent dashes: bright = near-continuous line, mid = dashes, dark = sparse dots.
      float run = 0.8 * vnoise(vec2(xc * 0.07, r * 5.31 + uT * 0.12)) + 0.2 * hash(vec2(di + 0.37, r * 1.13));
      if (run < dens * 1.05) {
        float halfx = mix(1.0, 1.55, smoothstep(0.6, 0.95, dens));
        if (abs(x - xc) <= halfx) col = mix(pal(t), vec3(1.0), (letter ? 0.25 : 0.06) * dens) * gain * (1.35 + 0.6 * dens); // hot cores, coloured glow
      }
    }
  } else {
    // ── Background: stippled ridge lines climbing the tab silhouette.
    for (int k = 0; k < ${RIDGE_LINES}; k++) {
      float fk = float(k);
      float base = uTop + fk * uSpacing;
      float lift = texture2D(tRidge, vec2(xc / uCss.x, (fk + 0.5) / uLines)).r;
      float jit = 3.5 * sin(xc * 0.02 + fk * 1.7 + uT * 0.25)
                + 1.5 * sin(xc * 0.085 + fk * 3.1 + uT * 0.6)
                + (hash(vec2(di, fk)) - 0.5) * 1.0;
      float yl = base - lift + jit;
      if (abs(y - yl) > 1.0) continue;
      if (abs(x - xc) > 1.0) continue;
      if (0.8 * vnoise(vec2(xc * 0.05, fk * 7.7 + uT * 0.1)) + 0.2 * hash(vec2(di * 1.7, fk + 9.0)) > 0.78) continue;
      if (onIntro(xc, yl) < 0.5) continue;
      float tt = uRidgeT + 0.08 * (hash(vec2(fk, 4.0)) - 0.5) + 0.05 * sin(xc * 0.004 + fk);
      col = max(col, pal(tt) * 1.15);
    }
  }

  // Glitter: a few dots drifting through.
  vec3 pc = texture2D(tPart, suv).rgb;
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

export function makeScanlinePass(sceneTex, normTex, partTex, paletteName = 'reference') {
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
      tNorm: { value: normTex },
      tPart: { value: partTex },
      uKey: { value: new THREE.Vector3(-0.9, 0.25, 0.35) },
      uTopo: { value: 20 },
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
      const spacing = (cssH * 0.97) / (RIDGE_LINES - 1);
      shared.uSpacing.value = spacing * (1 + 1.1 * scroll);
      shared.uTop.value = cssH * 0.06 - scroll * cssH * 0.35;
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

