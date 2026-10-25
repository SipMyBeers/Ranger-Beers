// AstroDither-style glyph-cell dither pass.
// The scene is rendered to a target; this pass divides the screen into square
// cells, samples the scene once at each cell centre, quantises luminance to 5
// levels and stamps the matching glyph from a 5-slot atlas. Glyph COLOUR comes
// from the sampled material (body, side wall, letters, black field, or an
// ambient particle), never from the atlas. Material ids ride in scene alpha.
import * as THREE from 'three';

export const SLOTS = 5;
export const MAX_PTS = 16;

// Level 0 empty, 1 tiny dot, 2 medium dot, 3 large dot, 4 solid square pixel.
// Drawn per pixel (no antialiasing) so edges stay hard at any scale.
export function makeAtlas(slotPx) {
  const s = Math.max(8, Math.round(slotPx));
  const cv = document.createElement('canvas');
  cv.width = s * SLOTS;
  cv.height = s;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(cv.width, cv.height);
  const radii = [0, 0.17, 0.27, 0.37];
  for (let slot = 0; slot < SLOTS; slot++) {
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const u = (x + 0.5) / s - 0.5;
        const v = (y + 0.5) / s - 0.5;
        const on = slot === 4 ? Math.max(Math.abs(u), Math.abs(v)) <= 0.42 : Math.hypot(u, v) <= radii[slot];
        const i = (y * cv.width + slot * s + x) * 4;
        const val = on && slot > 0 ? 255 : 0;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = val;
        img.data[i + 3] = 255;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cv);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const fragmentShader = /* glsl */ `
precision highp float;
uniform sampler2D tScene;     // tab; alpha = material id (1 body, .9 wall, .75 letters, .5 field)
uniform sampler2D tPart;      // ambient particles, additive rgb, depth-tested against the tab
uniform sampler2D tAtlas;
uniform vec2 uRes;            // drawing buffer size, device px
uniform float uCell;          // cell size, device px
uniform float uIntro;         // 0..1 scan-in progress
uniform float uBand;          // light-sweep band centre in screen x (0..1), <-0.5 = off
uniform float uExposure;
uniform vec4 uPts[${MAX_PTS}];  // pointer trail: xy device px (bottom-left origin), zw velocity px/s
uniform float uAge[${MAX_PTS}]; // seconds since each trail point
uniform float uRadius;        // disturbance radius, device px
uniform vec3 uBg;
varying vec2 vUv;

const vec3 BODY_LO   = vec3(0.851, 0.639, 0.055);  // #D9A30E
const vec3 BODY_HI   = vec3(0.957, 0.761, 0.125);  // #F4C220
const vec3 LETTER_LO = vec3(0.910, 0.745, 0.180);  // #E8BE2E
const vec3 LETTER_HI = vec3(1.0, 0.847, 0.290);    // #FFD84A
const vec3 WALL_LO   = vec3(0.545, 0.420, 0.055);
const vec3 WALL_HI   = vec3(0.780, 0.600, 0.090);
const vec3 HOT       = vec3(1.0, 0.957, 0.784);    // #FFF4C8
const vec3 FIELD     = vec3(0.227, 0.212, 0.157);  // #3a3628

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 cellId = floor(frag / uCell);
  vec2 center = (cellId + 0.5) * uCell;
  vec2 g = center / uRes;

  // Intro: cells switch on in a scan from bottom-left to top-right.
  float scan = (g.x + g.y) * 0.5;
  float jitter = hash(cellId) * 0.12;
  if (scan + jitter > uIntro * 1.12) { gl_FragColor = vec4(uBg, 1.0); return; }

  // Pointer disturbance: offset the tab sample along recent pointer velocity.
  vec2 off = vec2(0.0);
  for (int i = 0; i < ${MAX_PTS}; i++) {
    vec2 d = center - uPts[i].xy;
    float w = exp(-dot(d, d) / (uRadius * uRadius)) * exp(-uAge[i] / 0.2);
    off -= uPts[i].zw * w;
  }
  off *= 0.045;
  float ol = length(off);
  float maxOff = uCell * 3.0;
  if (ol > maxOff) off *= maxOff / ol;

  // 5-tap coverage so thin letter strokes survive the grid.
  float q4 = uCell * 0.28;
  vec2 taps[5];
  taps[0] = vec2(0.0); taps[1] = vec2(-q4, -q4); taps[2] = vec2(q4, -q4);
  taps[3] = vec2(-q4, q4); taps[4] = vec2(q4, q4);
  vec4 n = vec4(0.0);   // counts: body, wall, letters, field
  vec4 l = vec4(0.0);   // luminance sums per class
  for (int i = 0; i < 5; i++) {
    vec4 s = texture2D(tScene, (center + off + taps[i]) / uRes);
    if (s.a < 0.25) continue;
    vec3 c = pow(1.0 - exp(-s.rgb * uExposure), vec3(1.0 / 2.2)); // soft tonemap
    float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
    vec4 k = s.a < 0.62 ? vec4(0, 0, 0, 1) : s.a < 0.82 ? vec4(0, 0, 1, 0) : s.a < 0.95 ? vec4(0, 1, 0, 0) : vec4(1, 0, 0, 0);
    n += k;
    l += k * lum;
  }
  // Particles are pre-snapped to cell centres: one centre sample per cell.
  vec3 pc = texture2D(tPart, center / uRes).rgb;
  float goldN = n.x + n.y + n.z;
  float cover = goldN + n.w;

  // Specular sweep band.
  float band = 0.0;
  if (uBand > -0.5) {
    float bx = g.x - uBand + (g.y - 0.5) * 0.18;
    band = exp(-bx * bx / 0.0035);
  }

  float tabLevel = 0.0;
  vec3 tabCol = vec3(0.0);
  if (cover >= 2.5 && goldN >= 1.5) {
    bool isLetter = n.z > 0.5 && n.z >= max(n.x, n.y);
    bool isWall = !isLetter && n.y > n.x;
    float cnt = isLetter ? n.z : isWall ? n.y : n.x;
    float lum = (isLetter ? l.z : isWall ? l.y : l.x) / max(cnt, 1.0);
    float gl = clamp(lum + band, 0.0, 1.0);
    if (isLetter) {
      tabLevel = 4.0;                                   // letters: solid squares
      tabCol = mix(LETTER_LO, LETTER_HI, smoothstep(0.35, 0.8, gl));
    } else if (isWall) {
      tabLevel = clamp(floor(gl * 5.0), 2.0, 3.0);      // side wall: its own smaller band
      tabCol = mix(WALL_LO, WALL_HI, smoothstep(0.2, 0.7, gl));
    } else {
      tabLevel = gl > 0.93 ? 4.0 : 3.0;                 // body: large dots, squares only on the hottest specular
      tabCol = mix(BODY_LO, BODY_HI, smoothstep(0.2, 0.7, gl));
    }
    float hot = smoothstep(0.55, 0.92, band) * step(0.8, gl);
    tabCol = mix(tabCol, HOT, hot);
    if (hot > 0.5) tabLevel = 4.0;
  } else if (cover >= 2.5) {
    float lum = l.w / max(n.w, 1.0);
    tabLevel = clamp(1.0 + floor(lum * 12.0), 1.0, 2.0);
    tabCol = FIELD * (0.9 + lum * 1.5);
  }

  // Ambient particles: snapped to the same cells, brightest wins over the tab.
  float pl = max(pc.r, max(pc.g, pc.b));
  float level = tabLevel;
  vec3 col = tabCol;
  if (pl > 0.07) {
    float pLevel = clamp(floor(pl * 4.0) + 1.0, 1.0, 4.0);
    if (pLevel > tabLevel) {
      level = pLevel;
      col = (pc / pl) * mix(0.5, 1.0, clamp(pl, 0.0, 1.0));
    }
  }
  if (level < 0.5) { gl_FragColor = vec4(uBg, 1.0); return; }

  // Glyph from the atlas, with a 1 cell-pixel gutter so glyphs never touch.
  vec2 f = fract(frag / uCell);
  float e = 1.0 / uCell;
  float inside = step(e, f.x) * step(f.x, 1.0 - e) * step(e, f.y) * step(f.y, 1.0 - e);
  vec2 q = (f - e) / (1.0 - 2.0 * e);
  vec2 auv = vec2((level + clamp(q.x, 0.0, 1.0)) / ${SLOTS}.0, clamp(q.y, 0.0, 1.0));
  float mask = texture2D(tAtlas, auv).r * inside;

  gl_FragColor = vec4(mix(uBg, col, mask), 1.0);
}
`;

export function makeDitherPass(sceneTex, partTex, atlas) {
  const pts = Array.from({ length: MAX_PTS }, () => new THREE.Vector4(-1e5, -1e5, 0, 0));
  const ages = new Array(MAX_PTS).fill(99);
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      tScene: { value: sceneTex },
      tPart: { value: partTex },
      tAtlas: { value: atlas },
      uRes: { value: new THREE.Vector2(1, 1) },
      uCell: { value: 12 },
      uIntro: { value: 1 },
      uBand: { value: -1 },
      uExposure: { value: 2.6 },
      uPts: { value: pts },
      uAge: { value: ages },
      uRadius: { value: 120 },
      uBg: { value: new THREE.Vector3(10 / 255, 10 / 255, 10 / 255) }, // raw sRGB, not a THREE.Color (that would linearise it)
    },
  });
  // Full-screen triangle.
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
  const mesh = new THREE.Mesh(geo, material);
  mesh.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(mesh);
  return { scene, material, uniforms: material.uniforms, dispose: () => { geo.dispose(); material.dispose(); } };
}
