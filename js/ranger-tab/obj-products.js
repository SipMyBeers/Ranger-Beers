// Product objects for the work run: Rollick's coin, Scopeweb's radar,
// KillSesh's padlock, Stix's sticker, DittoMeThis's pixel Ditto and
// BullpenLM's headset. Every ambient move is scaled by inHold(), so the pose
// the flock condenses onto is the pose the object is shown in.
import * as THREE from 'three';
import { clamp, smooth, TAU, shadeMat, meshBase, inHold, shadeCanvas, grey } from './obj-core.js';

const OUT = (s) => `gl_FragColor = vec4(clamp(${s}, 0.0, 0.98), 0.0, 0.0, 1.0);`;
const hash2 = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
const ease = (q) => (q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2);

// ── Rollick: a coin with the Rollick Reserve seal, tossed on a loop. ──
function arcText(g, text, cx, cy, r, top, font, fill) {
  g.save();
  g.font = font; g.fillStyle = fill; g.textAlign = 'center'; g.textBaseline = 'middle';
  const chars = [...text];
  const widths = chars.map((ch) => g.measureText(ch).width + 3);
  const total = widths.reduce((a, b) => a + b, 0);
  let a = (top ? -Math.PI / 2 : Math.PI / 2) - (top ? 1 : -1) * (total / r) / 2;
  chars.forEach((ch, i) => {
    const w = widths[i] / r;
    a += (top ? 1 : -1) * w / 2;
    g.save();
    g.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    g.rotate(a + (top ? Math.PI / 2 : -Math.PI / 2));
    g.fillText(ch, 0, 0);
    g.restore();
    a += (top ? 1 : -1) * w / 2;
  });
  g.restore();
}
function coinFace(front) {
  return shadeCanvas(512, (g, S) => {
    const c = S / 2;
    // Scalloped seal edge, as on the Rollick Reserve note.
    g.fillStyle = grey(0.8);
    g.beginPath();
    for (let i = 0; i <= 240; i++) {
      const a = (i / 240) * TAU;
      const r = 246 - 7 * (0.5 + 0.5 * Math.cos(a * 28));
      g.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r);
    }
    g.fill();
    g.fillStyle = grey(0.6); g.beginPath(); g.arc(c, c, 226, 0, TAU); g.fill();
    // Guilloche: fine engraved rings in the field.
    g.strokeStyle = grey(0.52); g.lineWidth = 1.5;
    for (let r = 20; r < 138; r += 7) { g.beginPath(); g.arc(c, c, r, 0, TAU); g.stroke(); }
    g.strokeStyle = grey(0.36); g.lineWidth = 6;
    for (const r of [214, 146]) { g.beginPath(); g.arc(c, c, r, 0, TAU); g.stroke(); }
    const serif = 'bold 40px Georgia, "Times New Roman", serif';
    if (front) {
      arcText(g, 'ROLL THE DICE', c, c, 180, true, serif, grey(0.34));
      arcText(g, 'LICK THE DEAL', c, c, 180, false, serif, grey(0.34));
      for (const a of [0, Math.PI]) { g.fillStyle = grey(0.34); g.beginPath(); g.arc(c + Math.cos(a) * 180, c + Math.sin(a) * 180, 7, 0, TAU); g.fill(); }
      // The split R, engraved: dark on the left, red on the right.
      g.font = 'bold 230px Georgia, "Times New Roman", serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.save(); g.beginPath(); g.rect(0, 0, c - 6, S); g.clip(); g.fillStyle = grey(0.27); g.fillText('R', c, c + 14); g.restore();
      g.save(); g.beginPath(); g.rect(c - 6, 0, S, S); g.clip(); g.fillStyle = grey(0.44); g.fillText('R', c, c + 14); g.restore();
    } else {
      arcText(g, 'SEVEN DOLLARS', c, c, 180, true, serif, grey(0.34));
      arcText(g, 'ROLLICK RESERVE', c, c, 180, false, serif, grey(0.34));
      g.font = 'bold 250px Georgia, "Times New Roman", serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = grey(0.95); g.fillText('7', c, c + 16);
    }
  });
}
const faceFrag = /* glsl */ `
uniform sampler2D uTex; uniform float uGlint;
varying vec3 vN; varying vec3 vP; varying vec2 vUv;
void main() {
  float s = texture2D(uTex, vUv).r;
  float lit = litOf(vN);
  float g = exp(-pow((vP.x + vP.y) * 0.7 - uGlint, 2.0) * 7.0);
  ${OUT('s + 0.16 * (lit - 0.5) + 0.3 * g * smoothstep(0.4, 0.9, s)')}
}`;
const rimFrag = /* glsl */ `
uniform float uGlint;
varying vec3 vN; varying vec3 vP;
void main() {
  float a = atan(vP.y, vP.x);
  float reed = 0.5 + 0.5 * sin(a * 140.0);
  float lit = litOf(vN);
  float da = mod(a - uGlint * 2.0 + 3.14159, 6.28318) - 3.14159;
  ${OUT('0.42 + 0.3 * lit + 0.12 * reed + 0.55 * exp(-da * da / 0.05)')}
}`;
function coin(key) {
  const group = new THREE.Group();
  const toss = new THREE.Group();
  group.add(toss);
  const T = 0.13;
  const faces = [coinFace(true), coinFace(false)];
  const fm = faces.map((f) => shadeMat(faceFrag, { uTex: { value: f.tex }, uGlint: { value: 0 } }, key));
  const rimM = shadeMat(rimFrag, { uGlint: { value: 0 } }, key);
  const front = new THREE.Mesh(new THREE.CircleGeometry(1, 120), fm[0]);
  front.position.z = T / 2;
  const back = new THREE.Mesh(new THREE.CircleGeometry(1, 120), fm[1]);
  back.position.z = -T / 2; back.rotation.y = Math.PI;
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, T, 160, 1, true), rimM);
  rim.rotation.x = Math.PI / 2;
  front.userData.shadeAt = (p, uv) => [faces[0].at(uv.x, uv.y)[0], 1];
  back.userData.shadeAt = (p, uv) => [faces[1].at(uv.x, uv.y)[0], 1];
  rim.userData.sh = [-1, 0.95];
  toss.add(front, back, rim);
  // Loop: a toss every P seconds; a big flip on entering the hold or on a tap.
  const P = 3.4, BIG = 1.7;
  let lastT = 0, lastHold = 0, big = -1e9, loop0 = 0;
  const o = meshBase(group, { d: [0.6, 0.47, 0.21], m: [0.5, 0.4, 0.3] }, (c) => {
    lastT = c.t;
    if (c.isTo && lastHold < 0.12 && c.hold >= 0.12) { big = c.t; loop0 = c.t + BIG + 0.6; }
    if (c.hold < 0.05) big = -1e9;
    lastHold = c.isTo ? c.hold : 1;
    const amp = inHold(c, 0.08);
    let y = 0, rot = 0;
    const bq = (c.t - big) / BIG;
    if (bq >= 0 && bq < 1) {
      y = 0.62 * 4 * bq * (1 - bq);
      rot = 3 * TAU * ease(bq);
    } else {
      // Phase set so the Reduce Motion clock (t 3.7) lands on a resting coin.
      const q = (((c.t - loop0) / P + 0.85) % 1 + 1) % 1;
      const air = clamp(q / 0.45, 0, 1);
      if (q < 0.45) { y = 0.4 * 4 * air * (1 - air); rot = 2 * TAU * ease(air); }
      else if (q < 0.55) y = 0.035 * Math.sin(((q - 0.45) / 0.1) * Math.PI); // the little bounce on landing
    }
    toss.position.y = y * amp;
    toss.rotation.x = rot * amp;
    group.rotation.set(0.22 + 0.05 * Math.sin(c.t * 0.5), 0.32 * Math.sin(c.t * 0.31) * (0.4 + 0.6 * amp) - 0.12, 0.03 * Math.sin(c.t * 0.4));
    const gl = ((c.t * 0.55) % 3) - 1.5;
    fm[0].uniforms.uGlint.value = fm[1].uniforms.uGlint.value = gl * 1.4;
    rimM.uniforms.uGlint.value = c.t;
  }, (m) => m.userData.sh);
  o.tap = () => { big = lastT; loop0 = lastT + BIG + 0.6; };
  return o;
}

// ── Scopeweb: a radar scope, its beam sweeping, contacts lighting as it passes. ──
const BLIPS = [[0.62, 0.7], [0.38, 2.1], [0.82, 2.9], [0.55, 3.8], [0.27, 4.6], [0.71, 5.3], [0.9, 1.3], [0.46, 5.9]];
const radarFrag = /* glsl */ `
uniform float uSweep;
varying vec3 vP;
const float TAU = 6.28318;
float blipAt(vec2 p, float r, float a, float sweep) {
  vec2 b = r * vec2(cos(a), sin(a));
  float d = mod(sweep - a, TAU);
  return exp(-dot(p - b, p - b) / 0.0011) * (0.3 + 0.7 * exp(-d * 1.2));
}
void main() {
  vec2 p = vP.xy;
  float r = length(p), a = atan(p.y, p.x);
  if (a < 0.0) a += TAU;
  float rings = 0.0;
  for (int k = 1; k <= 4; k++) rings += exp(-pow((r - float(k) * 0.25) / 0.011, 2.0));
  float cross = (exp(-pow(p.x / 0.007, 2.0)) + exp(-pow(p.y / 0.007, 2.0))) * step(r, 1.0);
  float tick = step(0.94, r) * exp(-pow(fract(a / TAU * 72.0) - 0.5, 2.0) * 900.0);
  float d = mod(uSweep - a, TAU);
  float beam = (exp(-d * 1.7) * 0.6 + exp(-d * d * 900.0)) * step(r, 1.0);
  float bl = 0.0;
  ${BLIPS.map(([r, a]) => `bl += blipAt(p, ${r.toFixed(3)}, ${a.toFixed(3)}, uSweep);`).join('\n  ')}
  float s = 0.07 * (1.0 - 0.5 * r) + 0.42 * rings + 0.26 * cross + 0.3 * tick + 0.5 * beam * (0.4 + 0.6 * r) + 0.95 * bl;
  ${OUT('s')}
}`;
const bezelFrag = /* glsl */ `varying vec3 vN; void main() { ${OUT('0.3 + 0.55 * pow(litOf(vN), 1.4)')} }`;
function radar(key) {
  const group = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1, 160), shadeMat(radarFrag, { uSweep: { value: 0 } }, key));
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.05, 16, 160), shadeMat(bezelFrag, {}, key));
  bezel.userData.sh = [-1, 0.9];
  // The flock lands on the scope's rings, cross and contacts, not its dark glass.
  disc.userData.shadeAt = (p) => {
    const r = Math.hypot(p.x, p.y);
    let s = 0;
    for (let k = 1; k <= 4; k++) s += Math.exp(-Math.pow((r - k * 0.25) / 0.02, 2));
    s += Math.exp(-Math.pow(p.x / 0.012, 2)) + Math.exp(-Math.pow(p.y / 0.012, 2));
    for (const [br, ba] of BLIPS) s += 1.5 * Math.exp(-(Math.pow(p.x - br * Math.cos(ba), 2) + Math.pow(p.y - br * Math.sin(ba), 2)) / 0.002);
    if (s < 0.3 && hash2(p.x, p.y) > 0.12) return null;
    return [clamp(0.2 + 0.6 * s, 0, 0.95), 1];
  };
  group.add(disc, bezel);
  return meshBase(group, { d: [0.6, 0.44, 0.22], m: [0.5, 0.36, 0.33] }, (c) => {
    group.rotation.set(0.32 + 0.04 * Math.sin(c.t * 0.4), 0.18 * Math.sin(c.t * 0.27), 0);
    disc.material.uniforms.uSweep.value = (((c.t * 1.25) % TAU) + TAU) % TAU;
  }, (m) => m.userData.sh);
}

// ── KillSesh: a padlock; the shackle snaps shut as the hold starts. ──
const BODY = { w: 1.5, h: 1.2, d: 0.46, y: -0.38 };
const lockFrag = /* glsl */ `
uniform float uGlint, uFront;
varying vec3 vN; varying vec3 vP;
float rbox(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main() {
  float lit = litOf(vN);
  float s = 0.26 + 0.6 * pow(lit, 1.3);
  if (vP.z > uFront - 0.005) {
    vec2 p = vP.xy - vec2(0.0, ${BODY.y.toFixed(3)});
    float key = min(length(p - vec2(0.0, 0.08)) - 0.12, rbox(p - vec2(0.0, -0.12), vec2(0.045, 0.16), 0.02));
    float inset = exp(-pow(rbox(p, vec2(0.6, 0.47), 0.12) / 0.012, 2.0));
    s = key < 0.0 ? 0.03 : s + 0.35 * inset;
  }
  s += 0.32 * exp(-pow((vP.x + vP.y) * 0.8 - uGlint, 2.0) * 9.0);
  ${OUT('s')}
}`;
export const waveFrag = /* glsl */ `uniform float uS; void main() { ${OUT('uS')} }`;
function padlock(key) {
  const group = new THREE.Group();
  const { w, h, d, y } = BODY;
  const shape = new THREE.Shape();
  const r = 0.18, x0 = -w / 2, y0 = -h / 2;
  shape.moveTo(x0 + r, y0); shape.lineTo(x0 + w - r, y0); shape.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
  shape.lineTo(x0 + w, y0 + h - r); shape.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
  shape.lineTo(x0 + r, y0 + h); shape.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
  shape.lineTo(x0, y0 + r); shape.quadraticCurveTo(x0, y0, x0 + r, y0);
  const bg = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 4, curveSegments: 10 });
  bg.translate(0, y, -d / 2);
  const front = d / 2 + 0.05;
  const bodyM = shadeMat(lockFrag, { uGlint: { value: 0 }, uFront: { value: front } }, key);
  const body = new THREE.Mesh(bg, bodyM);
  body.userData.shadeAt = (p) => {
    if (p.z > front - 0.01) {
      const px = p.x, py = p.y - y;
      if (Math.hypot(px, py - 0.08) < 0.13 || (Math.abs(px) < 0.055 && py < 0.0 && py > -0.3)) return null;
    }
    return [-1, 1];
  };
  // Shackle: an arch on a pivot at the long (left) leg.
  const SR = 0.45, ST = 0.11, top = y + h / 2;
  const shM = shadeMat(lockFrag, { uGlint: { value: 0 }, uFront: { value: 99 } }, key);
  const pivot = new THREE.Group();
  pivot.position.set(-SR, 0, 0);
  const arch = new THREE.Mesh(new THREE.TorusGeometry(SR, ST, 18, 48, Math.PI), shM);
  arch.position.set(SR, top + 0.32, 0);
  const longLeg = new THREE.Mesh(new THREE.CylinderGeometry(ST, ST, 0.9, 18), shM);
  longLeg.position.set(0, top + 0.32 - 0.45, 0);
  const shortLeg = new THREE.Mesh(new THREE.CylinderGeometry(ST, ST, 0.5, 18), shM);
  shortLeg.position.set(2 * SR, top + 0.32 - 0.25, 0);
  for (const m of [arch, longLeg, shortLeg]) m.userData.sh = [-1, 0.95];
  pivot.add(arch, longLeg, shortLeg);
  // The shockwave: two rings thrown off as it locks (never sampled).
  const waves = [0, 1].map(() => {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.96, 1, 120), shadeMat(waveFrag, { uS: { value: 0 } }, key, { side: THREE.DoubleSide }));
    m.position.set(0, y + 0.1, front + 0.2);
    m.userData.noSample = true;
    return m;
  });
  group.add(body, pivot, ...waves);
  const LIFT = 0.5;
  return meshBase(group, { d: [0.6, 0.47, 0.2], m: [0.5, 0.4, 0.28] }, (c) => {
    const k = smooth(0.07, 0.13, c.hold);
    // Snap with a small overshoot, then rest: driven by the hold, so it reopens on the way back.
    const back = 1 + 2.4 * Math.pow(k - 1, 3) + 1.4 * Math.pow(k - 1, 2);
    pivot.position.y = LIFT * (1 - clamp(back, -0.2, 1.2));
    pivot.rotation.y = -0.45 * (1 - k);
    waves.forEach((m, i) => {
      const q = clamp((c.hold - 0.11 - i * 0.05) / 0.3, 0, 1);
      m.visible = q > 0 && q < 1;
      m.scale.setScalar(0.9 + 2.0 * Math.pow(q, 0.7));
      m.material.uniforms.uS.value = 0.95 * (1 - q);
    });
    group.rotation.set(0.12, -0.28 + 0.3 * Math.sin(c.t * 0.45) * (0.3 + 0.7 * inHold(c)), 0);
    const gl = ((c.t * 0.5) % 3.2) - 1.6;
    bodyM.uniforms.uGlint.value = shM.uniforms.uGlint.value = gl * 1.5;
  }, (m) => m.userData.sh);
}

// ── Stix: a die-cut sticker peeling off the screen at one corner. ──
const STIX_S = ['   GGGG   ', '  GGPPGG  ', '  GG  PP  ', '  PGGGG   ', '   PPPGG  ', '  GG  GG  ', '  PGGGGP  ', '   PPPP   '];
function stickerArt() {
  return shadeCanvas(512, (g) => {
    const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
    g.fillStyle = grey(0.97); rr(20, 20, 472, 472, 86); g.fill();       // the white die-cut border
    g.fillStyle = grey(0.1); rr(46, 46, 420, 420, 64); g.fill();        // dark panel
    const px = 30, ox = 256 - 5 * px, oy = 78;                           // the Stix pixel S (gifstix.com favicon)
    STIX_S.forEach((row, j) => [...row].forEach((ch, i) => {
      if (ch === ' ') return;
      g.fillStyle = grey(ch === 'P' ? 0.5 : 0.76);
      g.fillRect(ox + i * px + 1, oy + j * px + 1, px - 2, px - 2);
    }));
    g.fillStyle = grey(0.97);
    g.font = 'bold 66px "Courier New", Courier, monospace';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('STIX WAR', 256, 410);
  }, true);
}
const stickerFrag = /* glsl */ `
uniform sampler2D uTex; uniform float uSheen;
varying vec3 vN; varying vec2 vUv; varying vec3 vP;
void main() {
  vec4 tx = texture2D(uTex, vUv);
  if (tx.a < 0.5) discard;
  float s;
  if (gl_FrontFacing) s = tx.r * (0.86 + 0.22 * litOf(vN));
  else {
    // Underside: bright backing paper catching the light as it lifts.
    float lit = litOf(-vN);
    s = 0.7 + 0.28 * pow(lit, 0.6) + 0.2 * exp(-pow(vP.z * 6.0 - uSheen, 2.0));
  }
  ${OUT('s')}
}`;
function sticker(key) {
  const group = new THREE.Group();
  const art = stickerArt();
  const geo = new THREE.PlaneGeometry(2, 2, 44, 44);
  const base = geo.attributes.position.array.slice();
  const mat = shadeMat(stickerFrag, { uTex: { value: art.tex }, uSheen: { value: 0 } }, key, { side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.userData.twoSided = true;
  mesh.userData.shadeAt = (p, uv, n) => {
    const [s, a] = art.at(uv.x, uv.y);
    if (a < 0.5) return null;
    return n.z < 0 ? [0.85, 1] : [s, 1];
  };
  group.add(mesh);
  const D = [Math.SQRT1_2, -Math.SQRT1_2]; // toward the bottom-right corner
  const RAD = 0.17;
  function curl(c) {
    const P = geo.attributes.position.array;
    const fold = Math.SQRT2 - c;
    for (let i = 0; i < P.length; i += 3) {
      const x = base[i], y = base[i + 1];
      const along = x * D[0] + y * D[1];
      const s = along - fold;
      let a = along, z = 0;
      if (s > 0) {
        const th = s / RAD;
        if (th <= Math.PI) { a = fold + RAD * Math.sin(th); z = RAD * (1 - Math.cos(th)); }
        else { a = fold - (s - Math.PI * RAD); z = 2 * RAD; }
      }
      P[i] = x + D[0] * (a - along); P[i + 1] = y + D[1] * (a - along); P[i + 2] = z;
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
  }
  let lastC = -1;
  return meshBase(group, { d: [0.6, 0.45, 0.22], m: [0.5, 0.37, 0.3] }, (c) => {
    const amp = inHold(c);
    const cl = 0.3 + amp * (0.18 + 0.26 * (0.5 - 0.5 * Math.cos(c.t * 0.85)));
    if (Math.abs(cl - lastC) > 1e-4) { curl(cl); lastC = cl; }
    group.rotation.set(-0.18 + 0.04 * Math.sin(c.t * 0.5), 0.3 + 0.1 * Math.sin(c.t * 0.33) * amp, -0.06);
    mat.uniforms.uSheen.value = 0.6 + 1.0 * Math.sin(c.t * 1.1);
  }, () => [-1, 1], { front: -0.15 });
}

// ── DittoMeThis: a Ditto, one soft rounded blob (a smooth outline extruded
// with a deep round bevel, so it reads as a pillow, never as cells or boxes),
// with two dot eyes and a thin smile. It wobbles, blinks and turns slowly.
const DITTO = [
  [-0.95, -0.82], [-0.45, -0.9], [0, -0.86], [0.45, -0.9], [0.95, -0.82],
  [1.02, -0.4], [1.1, -0.02], [0.86, 0.32], [0.62, 0.7], [0.22, 0.9],
  [-0.12, 0.84], [-0.5, 0.74], [-0.82, 0.4], [-1.08, 0.04], [-1.02, -0.42],
];
function dittoShape() {
  const sh = new THREE.Shape();
  sh.moveTo(...DITTO[0]);
  sh.splineThru([...DITTO.slice(1), DITTO[0]].map(([x, y]) => new THREE.Vector2(x, y)));
  return sh;
}
const FACE_Z = 0.305; // just above the flat front cap (z 0.30)
function faceGeometry(kind) {
  const shapes = [];
  if (kind === 'E') {
    for (const x of [-0.3, 0.3]) { const e = new THREE.Shape(); e.absellipse(x, 0, 0.075, 0.11, 0, TAU, false, 0); shapes.push(e); }
  } else {
    const m = new THREE.Shape(), cy = 0.3, R = 0.36, r = 0.3, a0 = Math.PI * 1.22, a1 = Math.PI * 1.78;
    m.absarc(0, cy, R, a0, a1, false);
    m.absarc(0, cy, r, a1, a0, true);
    shapes.push(m);
  }
  const g = new THREE.ShapeGeometry(shapes, 24);
  g.translate(0, 0, FACE_Z);
  return g;
}
// Body: one even fill, its range kept inside the pink stops so the lit side
// never jumps to the white highlight band.
const petFrag = /* glsl */ `
uniform float uBase;
varying vec3 vN;
void main() {
  float s = uBase >= 0.0 ? uBase : 0.36 + 0.36 * pow(litOf(vN), 1.2);
  ${OUT('s')}
}`;
function mirror(key) {
  const group = new THREE.Group();
  const geoBody = new THREE.ExtrudeGeometry(dittoShape(), {
    depth: 0.12, bevelEnabled: true, bevelThickness: 0.24, bevelSize: 0.16, bevelSegments: 10, curveSegments: 64,
  });
  geoBody.translate(0, 0, -0.06);
  geoBody.computeVertexNormals();
  const geoEye = faceGeometry('E');
  const geoMouth = faceGeometry('M');
  const pet = new THREE.Group();
  const mk = (g, b, sh) => { const m = new THREE.Mesh(g, shadeMat(petFrag, { uBase: { value: b } }, key)); m.userData.sh = sh; return m; };
  const body = mk(geoBody, -1, [-1, 1]);
  // Eyes and smile carry no dots (shade 0 reads as a dark hole in the stipple).
  const eyes = mk(geoEye, 0, [0.02, 0.15]);
  eyes.position.y = 0.24;
  const mouth = mk(geoMouth, 0, [0.02, 0.15]);
  pet.add(body, eyes, mouth);
  group.add(pet);
  const o = meshBase(group, { d: [0.58, 0.45, 0.2], m: [0.5, 0.38, 0.23] }, (c) => {
    const amp = inHold(c);
    // Ditto wobble: squash and stretch around its base, volume kept.
    const w = 0.045 * Math.sin(c.t * 2.4) * amp;
    pet.scale.set(1 - w, 1 + w, 1);
    pet.position.y = 0.04 * Math.sin(c.t * 1.2) * amp;
    // A blink every 3.6 s.
    const b = (c.t % 3.6) / 3.6;
    eyes.scale.y = 1 - 0.85 * amp * Math.max(0, 1 - Math.abs(b - 0.96) / 0.03);
    group.rotation.set(0.1, 0.3 * Math.sin(c.t * 0.45) * amp, 0);
  }, (m) => m.userData.sh);
  o.dispose = () => { [geoBody, geoEye, geoMouth].forEach((g) => g.dispose()); group.traverse((m) => m.material && m.material.dispose()); };
  return o;
}

// ── BullpenLM: a call-centre headset; the boom bobs, sound rings pulse out. ──
const plainLit = /* glsl */ `uniform float uB; varying vec3 vN; void main() { ${OUT('(0.22 + 0.72 * pow(litOf(vN), 1.25)) * uB')} }`;
function headset(key) {
  const group = new THREE.Group();
  const mat = (b = 1) => shadeMat(plainLit, { uB: { value: b } }, key);
  const lit = (m, b = 1) => { m.userData.sh = [-1, b]; return m; };
  const band = lit(new THREE.Mesh(new THREE.TorusGeometry(1, 0.075, 16, 80, Math.PI), mat()));
  const pad = lit(new THREE.Mesh(new THREE.TorusGeometry(0.93, 0.045, 10, 64, Math.PI * 0.8), mat(0.7)), 0.7);
  pad.rotation.z = Math.PI * 0.1; pad.position.z = -0.02;
  group.add(band, pad);
  for (const sx of [-1, 1]) {
    const cup = lit(new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.2, 48), mat()));
    cup.rotation.z = Math.PI / 2; cup.position.set(sx * 1.04, -0.14, 0);
    const cushion = lit(new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.085, 12, 40), mat(0.75)), 0.75);
    cushion.rotation.y = Math.PI / 2; cushion.position.set(sx * 0.9, -0.14, 0);
    const yoke = lit(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.34, 0.1), mat()));
    yoke.position.set(sx * 1.04, 0.13, 0);
    group.add(cup, cushion, yoke);
  }
  const boom = new THREE.Group();
  boom.position.set(-1.15, -0.14, 0.05);
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.04, -0.38, 0.32), new THREE.Vector3(0.34, -0.72, 0.56), new THREE.Vector3(0.78, -0.86, 0.58),
  ]);
  boom.add(lit(new THREE.Mesh(new THREE.TubeGeometry(path, 48, 0.036, 10), mat())));
  const mic = lit(new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.12, 6, 16), mat(1.05)), 1.05);
  mic.rotation.z = Math.PI / 2; mic.position.set(0.86, -0.87, 0.58);
  boom.add(mic);
  group.add(boom);
  // Sound rings from the right earpiece (never sampled).
  const rings = [0, 1, 2].map(() => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.014, 6, 96), shadeMat(waveFrag, { uS: { value: 0 } }, key));
    m.rotation.y = Math.PI / 2; m.position.set(1.2, -0.14, 0);
    m.userData.noSample = true;
    group.add(m);
    return m;
  });
  return meshBase(group, { d: [0.58, 0.44, 0.22], m: [0.43, 0.37, 0.25] }, (c) => {
    const amp = inHold(c);
    boom.rotation.set(0.12 * Math.sin(c.t * 1.8) * amp, 0, 0.05 * Math.sin(c.t * 1.8 + 0.6) * amp);
    rings.forEach((m, k) => {
      const q = (((c.t * 0.55 + k / 3) % 1) + 1) % 1;
      const s = 0.9 * (1 - q) * amp;
      m.visible = s > 0.03;
      m.scale.setScalar(0.7 + 1.6 * q);
      m.position.x = 1.2 + 0.45 * q;
      m.material.uniforms.uS.value = s;
    });
    group.rotation.set(0.14, -0.5 + 0.14 * Math.sin(c.t * 0.38), 0);
  }, (m) => m.userData.sh);
}

export const PRODUCT_FACTORIES = { coin, radar, padlock, sticker, mirror, headset };
