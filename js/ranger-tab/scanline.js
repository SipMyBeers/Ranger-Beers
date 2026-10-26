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
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const raw = (h) => { const c = new THREE.Color(); c.setHex(h, THREE.LinearSRGBColorSpace); return c; };

// Dark to bright. Reference palette measured off the Dither Boy screenshot.
export const PALETTES = {
  reference: [0x0a0006, 0x600040, 0xc04020, 0xe06020, 0xe08040, 0x8080e0, 0xa0a0e0, 0xe0c0e0, 0xf0f0f0],
  gold: [0x050302, 0x1e1000, 0x3a2200, 0x7d4e08, 0xc07a10, 0xda9e18, 0xf4c220, 0xffe9a0, 0xffffff],
};
// Same blend as the main pass pal(), for any 9-stop ramp (work flock, stills).
export const PAL_GLSL = /* glsl */ `
vec3 palOf(vec3 P[9], float t) {
  float f = clamp(t, 0.0, 1.0) * 8.0;
  float i = floor(f);
  float w = f - i;
  vec3 a = P[0], b = P[0];
  for (int k = 0; k < 9; k++) {
    if (float(k) == i) a = P[k];
    if (float(k) == min(i + 1.0, 8.0)) b = P[k];
  }
  return mix(a, b, smoothstep(0.25, 0.75, w));
}
`;
export const paletteColors = (name) => (PALETTES[name] || PALETTES.reference).map(raw);

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

// Unravel timing, shared by the mask in the main pass and the falling strips.
// Body rows leave top to bottom from p .15; the letters leave last.
export const UNRAVEL = /* glsl */ `
const float DUR = 0.28;
float startOf(float j, float letter) {
  float f = uRowsN > 1.0 ? clamp(j / (uRowsN - 1.0), 0.0, 1.0) : 0.0;
  // A little per-row scatter so neighbouring rows peel apart instead of moving as a sheet.
  float jit = (fract(sin(j * 12.9898 + letter * 4.1) * 43758.5453) - 0.5) * 0.035;
  return letter > 0.5 ? 0.40 + 0.12 * f + jit * 0.5 : 0.15 + 0.30 * f + jit;
}
`;

// Ridge line k's resting height (css px, top origin), parted like curtains
// from the middle as uPart goes 0 to 1.
const LINE_BASE = /* glsl */ `
float lineBase(float k) {
  float b = uTop + k * uSpacing;
  // Upper and lower halves part separately, so the work run can bring the
  // lower lines back up while the upper ones stay gone.
  return b < uCss.y * 0.5 ? b - uPartUp * uCss.y * 0.6 : b + uPart * uCss.y * 0.6;
}
`;

// ── Ridge lift: one texel per (x, line). R = how far the line climbs, css px.
// Two terms, taking the larger: lines that pass behind the tab rise over its
// silhouette (coverage above), and lines below the tab climb toward its
// underside so the arch gap fills with compressed contours instead of a void.
const ridgeFrag = /* glsl */ `
precision highp float;
uniform sampler2D tScene;
uniform vec2 uCss;
uniform float uTop, uSpacing, uLines, uScroll, uT, uPart, uPartUp, uLiftK;
uniform vec4 uPts[${MAX_PTS}]; // device px, bottom-left origin
uniform float uAge[${MAX_PTS}];
uniform vec4 uShock[4];        // css px x, y (top origin), age s
uniform float uDpr;
varying vec2 vUv;
${common}
${LINE_BASE}
float covered(float x, float yTop) {
  if (yTop < 0.0 || yTop > uCss.y || x < 0.0 || x > uCss.x) return 0.0;
  return step(0.25, texture2D(tScene, vec2(x / uCss.x, 1.0 - yTop / uCss.y)).a);
}
void main() {
  float x = vUv.x * uCss.x;
  float k = floor(vUv.y * uLines);
  float baseY = lineBase(k);
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
  lift *= (1.0 + 0.8 * uScroll) * uLiftK;
  // Pointer bump travelling outward along nearby lines.
  float bump = 0.0;
  for (int i = 0; i < ${MAX_PTS}; i++) {
    vec2 p = vec2(uPts[i].x / uDpr, uCss.y - uPts[i].y / uDpr);
    float near = exp(-pow((baseY - lift - p.y) / (uSpacing * 1.2), 2.0));
    float d = abs(x - p.x) - uAge[i] * 420.0;
    bump += near * exp(-d * d / 1600.0) * exp(-uAge[i] / 0.7);
  }
  lift += 22.0 * min(bump, 1.5);
  // Tap shockwave: a ring travelling out from the hit point, ~600ms.
  for (int i = 0; i < 4; i++) {
    vec4 s = uShock[i];
    if (s.z > 0.6) continue;
    float d = length(vec2(x, baseY) - s.xy) - s.z * 1300.0;
    lift += 34.0 * exp(-d * d / 1600.0) * exp(-s.z / 0.2);
  }
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
uniform float uP, uTabTop, uRowsN, uPart, uPartUp; // unravel progress, tab row grid, curtain
uniform float uWorkObj, uForm, uRidgeRamp; // work run: shade-coded object, dissolve, per-line ramp
uniform vec4 uPts[${MAX_PTS}];
uniform float uAge[${MAX_PTS}];
uniform float uRadius;      // device px
uniform vec3 uKey;          // key light direction, view space
uniform float uTopo;        // css px of row lift per world unit of depth
uniform vec3 uPal[9];
varying vec2 vUv;
${common}
${UNRAVEL}
${LINE_BASE}
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
  bool tabHere = here.a >= 0.25;
  bool isLetter = here.a >= 0.62 && here.a < 0.82;
#ifndef TAB_ONLY
  // Rows that have unravelled leave a hole the ridge field shows through.
  if (tabHere && uP > 0.149 && uWorkObj < 0.5) {
    float j = clamp(floor((y - uTabTop) / ROW), 0.0, max(uRowsN - 1.0, 0.0));
    if (uP >= startOf(j, isLetter ? 1.0 : 0.0)) tabHere = false;
  }
#endif
  if (tabHere) {
    // ── Tab: rows are contours of v = y + wave + surface height, so they bend
    // over the bevels and letters like a topographic scan.
    vec4 nz = texture2D(tNorm, suv);
    vec3 n = normalize(nz.xyz + vec3(0.0, 0.0, 1e-4));
    float h = 1.5 / uCss.y;
    // Work objects are big and steeply tilted: a gentler bend keeps their rows whole.
    float topoK = uWorkObj > 0.5 ? 0.3 : 1.0;
    float topo = nz.a * uTopo * topoK;
    float dTopo = (texture2D(tNorm, suv - vec2(0.0, h)).a - texture2D(tNorm, suv + vec2(0.0, h)).a) * uTopo * topoK / 3.0;
    float v = y + amp * wave(x, y) + topo;
    float dv = 1.0 + dTopo + amp * (0.65 * 0.012 * cos(x * 0.085 + y * 0.012 + uT * 0.8)
                                  - 0.35 * 0.021 * cos(x * 0.142 - y * 0.021 - uT * 1.15));
    float g = clamp(abs(dv), 0.35, 3.0);
    // Letters carry denser rows so RANGER stays legible on a phone.
    bool letter = here.a >= 0.62 && here.a < 0.82;
    float rp = letter ? (uCss.x < 700.0 ? 2.75 : 3.25) : ROW;
    float r = floor(v / rp);
    float vc = (r + 0.5) * rp + (hash(vec2(di, r)) - 0.5) * 1.0; // 1px jitter
    if (abs(v - vc) / g <= (letter ? 0.6 : 0.7) && onIntro(x, y) > 0.5
        && (uWorkObj < 0.5 || hash(vec2(di + 7.3, floor(y / ROW))) < uForm)) { // rows ~1.4 css tall: the glow needs a dark gap to read as lines
      vec3 c = pow(1.0 - exp(-here.rgb * uExposure), vec3(1.0 / 2.2));
      float L = dot(c, vec3(0.2126, 0.7152, 0.0722));
      float ndl = dot(n, uKey);
      // Hue from the lit normal: toward the key = violet to white, sideways =
      // saturated orange, grazing/shadowed = magenta-red.
      float t, dens, gain;
      if (uWorkObj > 0.5) {           // work object: its own material wrote a 0..1 shade into r
        float s = here.r;
        t = s; gain = 1.0;
        dens = s < 0.02 ? 0.0 : 0.38 + 0.62 * smoothstep(0.05, 0.6, s); // even dim fill, never blotchy
      } else if (here.a < 0.62) {           // black recess
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
#ifndef TAB_ONLY
    // ── Background: stippled ridge lines climbing the tab silhouette.
    for (int k = 0; k < ${RIDGE_LINES}; k++) {
      float fk = float(k);
      float base = lineBase(fk);
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
      tt = mix(tt, 0.22 + 0.78 * clamp((fk - 7.0) / 6.0, 0.0, 1.0), uRidgeRamp);
      col = max(col, pal(tt) * 1.15);
    }
#endif
  }
#ifdef TAB_ONLY
  gl_FragColor = vec4(col, tabHere ? (isLetter ? 0.5 : 1.0) : 0.0);
  return;
#endif

  // Glitter: a few dots drifting through.
  vec3 pc = texture2D(tPart, suv).rgb;
  float pl = max(pc.r, max(pc.g, pc.b));
  if (pl > 0.08) col = max(col, pal(0.3 + 0.7 * clamp(pl, 0.0, 1.0)) * (0.5 + 0.5 * pl));

  gl_FragColor = vec4(uPal[0] + col, 1.0);
}
`;

// Unravelled rows: one screen-wide strip per tab row (bodies, then letters),
// sampling the tab-only stipple at its source row while it falls to a ridge
// line, stretching to the full width and cooling to the ridge amber.
const stripVert = /* glsl */ `
attribute float aIdx;
uniform vec2 uCss;
uniform float uP, uTabTop, uRowsN, uTop, uSpacing, uKmin, uKmax;
varying float vE, vSrcTop, vCurTop, vLetter, vDx;
const float ROW = ${ROW.toFixed(3)};
${UNRAVEL}
float back(float t) { float c1 = 1.0; float c3 = c1 + 1.0; float u = t - 1.0; return 1.0 + c3 * u * u * u + c1 * u * u; }
void main() {
  float letter = step(uRowsN - 0.5, aIdx);
  float j = aIdx - letter * uRowsN;
  float e = clamp((uP - startOf(j, letter)) / DUR, 0.0, 1.0);
  float f = uRowsN > 1.0 ? j / (uRowsN - 1.0) : 0.0;
  float k = floor(mix(uKmax, uKmin, f) + 0.5);
  float landY = uTop + k * uSpacing - ROW * 0.5;
  float srcTop = uTabTop + j * ROW;
  float curTop = mix(srcTop, landY, back(e));
  vE = e; vSrcTop = srcTop; vCurTop = curTop; vLetter = letter;
  // Each row drifts sideways in flight, so the sheet visibly comes apart.
  vDx = sin(3.14159 * e) * (fract(sin(j * 78.233 + letter) * 12345.678) - 0.5) * 90.0;
  float yy = curTop + position.y * ROW;
  bool off = e <= 0.0 || j >= uRowsN;
  gl_Position = off ? vec4(2.0, 2.0, 2.0, 1.0) : vec4(position.x * 2.0 - 1.0, 1.0 - yy / uCss.y * 2.0, 0.0, 1.0);
}
`;
const stripFrag = /* glsl */ `
precision highp float;
uniform sampler2D tTab;
uniform vec2 uCss;
uniform float uDpr, uTabX0, uTabX1;
uniform vec3 uAmber;
varying float vE, vSrcTop, vCurTop, vLetter, vDx;
void main() {
  float x = gl_FragCoord.x / uDpr - vDx;
  float y = uCss.y - gl_FragCoord.y / uDpr;
  float srcY = vSrcTop + (y - vCurTop);
  float s = smoothstep(0.05, 0.6, vE);
  float k = uCss.x / max(1.0, uTabX1 - uTabX0);
  float srcX = (x + s * uTabX0 * k) / ((1.0 - s) + s * k);
  if (srcX < 0.0 || srcX > uCss.x) discard;
  vec4 t = texture2D(tTab, vec2(srcX / uCss.x, 1.0 - srcY / uCss.y));
  bool isL = t.a > 0.3 && t.a < 0.7;
  bool isB = t.a > 0.7;
  if (vLetter > 0.5 ? !isL : !isB) discard;
  float m = max(t.r, max(t.g, t.b));
  float land = smoothstep(0.45, 1.0, vE);
  vec3 c = mix(t.rgb, uAmber * step(0.02, m), land);
  gl_FragColor = vec4(c * (1.0 - smoothstep(0.8, 1.0, vE)), 1.0);
}
`;
const MAX_STRIPS = 640;

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
    uP: { value: 0 },
    uTabTop: { value: 0 },
    uRowsN: { value: 0 },
    uPart: { value: 0 },
    uPartUp: { value: 0 },
    uWorkObj: { value: 0 },
    uForm: { value: 1 },
    uRidgeRamp: { value: 0 },
    uLiftK: { value: 1 },
    uShock: { value: Array.from({ length: 4 }, () => new THREE.Vector4(0, 0, 99, 0)) },
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

  // Tab-only stipple (rgb) with its kind in alpha (1 body, .5 letters), sampled by the strips.
  const tabRT = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false,
  });
  const tabMat = new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: mainFrag, depthTest: false, depthWrite: false,
    uniforms: mainMat.uniforms, defines: { TAB_ONLY: 1 },
  });
  const tabOnly = fsScene(tabMat);
  const stripGeo = new THREE.InstancedBufferGeometry();
  stripGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0], 3));
  stripGeo.setAttribute('aIdx', new THREE.InstancedBufferAttribute(new Float32Array(MAX_STRIPS).map((_, i) => i), 1));
  stripGeo.instanceCount = 0;
  const stripMat = new THREE.ShaderMaterial({
    vertexShader: stripVert, fragmentShader: stripFrag, depthTest: false, depthWrite: false,
    transparent: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, // y is flipped into clip space, so the winding is reversed
    uniforms: {
      tTab: { value: tabRT.texture }, uCss: shared.uCss, uDpr: shared.uDpr, uP: shared.uP,
      uTabTop: shared.uTabTop, uRowsN: shared.uRowsN, uTop: shared.uTop, uSpacing: shared.uSpacing,
      uKmin: { value: 0 }, uKmax: { value: RIDGE_LINES - 2 },
      uTabX0: { value: 0 }, uTabX1: { value: 1 },
      uAmber: { value: pal[0].clone() },
    },
  });
  {
    // Ridge amber as the main pass draws it: pal(uRidgeT) * 1.15.
    const t = clamp01(mainMat.uniforms.uRidgeT.value) * 8;
    const i = Math.floor(t), w = t - i;
    const a = pal[i], b = pal[Math.min(i + 1, 8)];
    const sw = w <= 0.25 ? 0 : w >= 0.75 ? 1 : ((x) => x * x * (3 - 2 * x))((w - 0.25) / 0.5);
    stripMat.uniforms.uAmber.value.copy(a).lerp(b, sw).multiplyScalar(1.15);
  }
  const stripMesh = new THREE.Mesh(stripGeo, stripMat);
  stripMesh.frustumCulled = false;
  const stripScene = new THREE.Scene();
  stripScene.add(stripMesh);
  let unravelOn = false;

  return {
    uniforms: mainMat.uniforms,
    ground: pal[0],
    setSize(cssW, cssH, dpr) {
      ridgeRT.setSize(Math.max(1, Math.ceil(cssW / 2)), RIDGE_LINES);
      tabRT.setSize(Math.max(1, Math.round(cssW * dpr)), Math.max(1, Math.round(cssH * dpr)));
      shared.uCss.value.set(cssW, cssH);
      shared.uDpr.value = dpr;
    },
    // Ridge lines: ~50 css px apart, scaled to the viewport, stretching on scroll-out.
    setRidge(cssH, scroll) {
      const spacing = (cssH * 0.97) / (RIDGE_LINES - 1);
      shared.uSpacing.value = spacing * (1 + 1.1 * scroll);
      shared.uTop.value = cssH * 0.06 - scroll * cssH * 0.35;
    },
    // u: { p, tabTop, tabBottom, x0, x1, part, liftK, shocks: [[x, y, age]] }
    setUnravel(u) {
      shared.uP.value = u.p;
      shared.uPart.value = u.part;
      shared.uPartUp.value = u.partUp ?? u.part;
      shared.uLiftK.value = u.liftK;
      const rows = Math.max(0, Math.min(MAX_STRIPS / 2, Math.ceil((u.tabBottom - u.tabTop) / ROW)));
      shared.uTabTop.value = u.tabTop;
      shared.uRowsN.value = rows;
      stripMat.uniforms.uTabX0.value = u.x0;
      stripMat.uniforms.uTabX1.value = u.x1;
      // Rows land on the ridge lines below the tab (the top row on the lowest).
      const sp = shared.uSpacing.value, top = shared.uTop.value;
      const kmax = RIDGE_LINES - 2;
      const kmin = Math.min(kmax, Math.max(0, Math.ceil((u.tabBottom - top) / sp + 0.4)));
      stripMat.uniforms.uKmin.value = kmin;
      stripMat.uniforms.uKmax.value = kmax;
      unravelOn = u.p > 0.15 && rows > 0;
      stripGeo.instanceCount = unravelOn ? rows * 2 : 0;
      const sh = shared.uShock.value;
      for (let i = 0; i < 4; i++) {
        const s = u.shocks[i];
        if (s) sh[i].set(s[0], s[1], s[2], 0); else sh[i].set(0, 0, 99, 0);
      }
    },
    render(renderer, target) {
      renderer.setRenderTarget(ridgeRT);
      renderer.render(ridge.scene, cam);
      if (unravelOn) {
        renderer.setRenderTarget(tabRT);
        renderer.render(tabOnly.scene, cam);
      }
      renderer.setRenderTarget(target);
      renderer.render(main.scene, cam);
      if (unravelOn) {
        renderer.autoClear = false;
        renderer.render(stripScene, cam);
        renderer.autoClear = true;
      }
    },
    dispose() {
      ridgeRT.dispose(); ridgeMat.dispose(); mainMat.dispose();
      ridge.geo.dispose(); main.geo.dispose();
      tabRT.dispose(); tabMat.dispose(); tabOnly.geo.dispose(); stripGeo.dispose(); stripMat.dispose();
    },
  };
}

