// AstroDither-style glyph-cell dither pass.
// The scene is rendered to a target; this pass divides the screen into square
// cells, samples the scene once at each cell centre, quantises luminance to 5
// levels and stamps the matching glyph from a 5-slot atlas. Glyph COLOUR comes
// from the sampled material (gold vs black field), never from the atlas.
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
uniform sampler2D tScene;
uniform sampler2D tAtlas;
uniform vec2 uRes;        // drawing buffer size, device px
uniform float uCell;      // cell size, device px
uniform float uIntro;     // 0..1 scan-in progress
uniform float uBand;      // light-sweep band centre in screen x (0..1), <-0.5 = off
uniform float uExposure;
uniform vec4 uPts[${MAX_PTS}];  // pointer trail: xy device px (bottom-left origin), zw velocity px/s
uniform float uAge[${MAX_PTS}]; // seconds since each trail point
uniform float uRadius;    // disturbance radius, device px
uniform vec3 uBg;
varying vec2 vUv;

const vec3 GOLD_LO = vec3(0.773, 0.702, 0.345);  // #C5B358
const vec3 GOLD_HI = vec3(0.957, 0.761, 0.125);  // #F4C220
const vec3 HOT     = vec3(1.0, 0.957, 0.784);    // #FFF4C8
const vec3 FIELD   = vec3(0.165, 0.157, 0.125);  // #2a2820

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

  // Pointer disturbance: offset the sample along recent pointer velocity.
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

  // 5-tap coverage: classify the cell by majority so thin letter strokes
  // survive the grid, then shade it from the taps of the winning material.
  vec2 base = center + off;
  float q4 = uCell * 0.28;
  vec2 taps[5];
  taps[0] = vec2(0.0); taps[1] = vec2(-q4, -q4); taps[2] = vec2(q4, -q4);
  taps[3] = vec2(-q4, q4); taps[4] = vec2(q4, q4);
  float cover = 0.0, goldN = 0.0, lumG = 0.0, lumF = 0.0;
  for (int i = 0; i < 5; i++) {
    vec4 s = texture2D(tScene, (base + taps[i]) / uRes);
    if (s.a < 0.5) continue;
    cover += 1.0;
    vec3 c = pow(1.0 - exp(-s.rgb * uExposure), vec3(1.0 / 2.2)); // soft tonemap
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    float isG = step(0.07, c.r - c.b);
    goldN += isG;
    lumG += l * isG;
    lumF += l * (1.0 - isG);
  }
  if (cover < 2.5) { gl_FragColor = vec4(uBg, 1.0); return; }
  float gold = step(1.5, goldN); // two of five taps on gold is enough: keeps thin letter strokes
  float lum = gold > 0.5 ? lumG / max(goldN, 1.0) : lumF / max(cover - goldN, 1.0);

  // Specular sweep: a narrow slanted band that lifts gold luminance.
  float band = 0.0;
  if (uBand > -0.5) {
    float bx = g.x - uBand + (g.y - 0.5) * 0.18;
    band = exp(-bx * bx / 0.0035);
  }
  float gl = clamp(lum + band * 0.75 * gold, 0.0, 1.0);

  // Small cells (phones) need more size contrast between gold and field dots,
  // so gold starts a level higher and the field stays at the tiny dot.
  float small = step(uCell, 19.5);
  float levelGold = clamp(floor(gl * 5.0), 2.0 + small, 4.0);
  float levelField = mix(clamp(1.0 + floor(lum * 12.0), 1.0, 2.0), 1.0, small);
  float level = mix(levelField, levelGold, step(0.5, gold));

  // Glyph from the atlas, with a 1 cell-pixel gutter so glyphs never touch.
  vec2 f = fract(frag / uCell);
  float e = 1.0 / uCell;
  float inside = step(e, f.x) * step(f.x, 1.0 - e) * step(e, f.y) * step(f.y, 1.0 - e);
  vec2 q = (f - e) / (1.0 - 2.0 * e);
  vec2 auv = vec2((level + clamp(q.x, 0.0, 1.0)) / ${SLOTS}.0, clamp(q.y, 0.0, 1.0));
  float mask = texture2D(tAtlas, auv).r * inside;

  vec3 goldCol = mix(GOLD_LO, GOLD_HI, smoothstep(0.45, 0.85, gl));
  float hot = step(3.5, levelGold) * smoothstep(0.8, 0.97, band) * step(0.95, gl);
  goldCol = mix(goldCol, HOT, hot);
  vec3 fieldCol = FIELD * (0.85 + lum * 1.2);
  vec3 col = mix(fieldCol, goldCol, step(0.5, gold));

  gl_FragColor = vec4(mix(uBg, col, mask), 1.0);
}
`;

export function makeDitherPass(sceneTex, atlas) {
  const pts = Array.from({ length: MAX_PTS }, () => new THREE.Vector4(-1e5, -1e5, 0, 0));
  const ages = new Array(MAX_PTS).fill(99);
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      tScene: { value: sceneTex },
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
