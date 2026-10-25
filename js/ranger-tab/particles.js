// Ambient dust: point sprites rendered into their own target, depth-tested
// against the tab, then snapped to the dither grid by the dither pass.
// Motion lives in screen space (css px) so drift speeds are exact; depth only
// sets size, brightness, parallax and occlusion.
import * as THREE from 'three';

const GOLD = [0.957, 0.761, 0.125];
const SPARK = [1.0, 0.957, 0.784];
const PUSH_R = 140; // px

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const vertexShader = /* glsl */ `
attribute float aSize;
attribute vec3 aColor;
varying vec3 vColor;
void main() {
  vColor = aColor;
  gl_PointSize = aSize;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */ `
varying vec3 vColor;
void main() {
  float r = length(gl_PointCoord - 0.5);
  if (r > 0.5) discard;
  gl_FragColor = vec4(vColor * (1.0 - smoothstep(0.38, 0.5, r)), 1.0);
}
`;

export function makeParticles(count, seed = 7) {
  const rand = rng(seed);
  const P = Array.from({ length: count }, () => {
    const near = Math.pow(rand(), 1.6); // most dust is far and small
    return {
      x: rand(), y: rand(), // normalised screen position
      near,
      z: -9 + near * 13, // world z: behind the tab to in front of it
      ox: 0, oy: 0, ovx: 0, ovy: 0, // pointer push offset (px), springs home
      spark: rand() < 0.1,
      phase: rand() * Math.PI * 2,
      period: 1 + rand() * 2,
      base: 0.35 + 0.65 * rand(),
      sx: rand() * 10, sy: rand() * 10,
    };
  });

  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const color = new Float32Array(count * 3);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('aColor', new THREE.BufferAttribute(color, 3).setUsage(THREE.DynamicDrawUsage));
  const material = new THREE.ShaderMaterial({
    vertexShader, fragmentShader,
    blending: THREE.AdditiveBlending, depthTest: true, depthWrite: false, transparent: true,
  });
  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(points);

  // ctx: { t, dt, w, h, cell (css px), quiet:{x0,y0,x1,y1}|null, camDist, camY, tanH, aspect, pointer:{x,y,active}, scroll, sweepX, motion }
  function update(ctx) {
    const { t, dt, w, h } = ctx;
    for (let i = 0; i < count; i++) {
      const p = P[i];
      const par = 0.45 + 0.9 * p.near; // parallax: near dust moves faster
      if (ctx.motion && dt > 0) {
        // curl-ish drift: up and sideways, 10-30 px/s
        const vx = (6 + 12 * Math.sin(p.y * 6.0 + t * 0.21 + p.sx)) * par;
        const vy = -(14 + 8 * Math.cos(p.x * 5.0 + t * 0.17 + p.sy) + 260 * ctx.scroll) * par;
        p.x += (vx * dt) / w;
        p.y += (vy * dt) / h;
        if (p.x > 1.05) p.x -= 1.1; else if (p.x < -0.05) p.x += 1.1;
        if (p.y < -0.05) p.y += 1.1; else if (p.y > 1.05) p.y -= 1.1;
        // pointer push, spring back home
        let ax = -16 * p.ox - 8 * p.ovx;
        let ay = -16 * p.oy - 8 * p.ovy;
        if (ctx.pointer.active) {
          const dx = p.x * w + p.ox - ctx.pointer.x;
          const dy = p.y * h + p.oy - ctx.pointer.y;
          const d = Math.hypot(dx, dy);
          if (d < PUSH_R && d > 0.001) {
            const f = 2600 * (1 - d / PUSH_R) * (0.6 + p.near);
            ax += (dx / d) * f; ay += (dy / d) * f;
          }
        }
        p.ovx += ax * dt; p.ovy += ay * dt;
        p.ox += p.ovx * dt; p.oy += p.ovy * dt;
      }
      // Snap to the dither cell centre (grid origin is bottom-left) so each
      // particle lights exactly one cell and steps cell to cell as it drifts.
      const c = ctx.cell;
      const sxp = (Math.floor((p.x * w + p.ox) / c) + 0.5) * c;
      const syp = h - (Math.floor((h - (p.y * h + p.oy)) / c) + 0.5) * c;
      const halfH = (ctx.camDist - p.z) * ctx.tanH;
      pos[i * 3] = ((sxp / w) * 2 - 1) * halfH * ctx.aspect;
      pos[i * 3 + 1] = (1 - (syp / h) * 2) * halfH + ctx.camY;
      pos[i * 3 + 2] = p.z;
      size[i] = c * 0.9; // one cell; nearness shows as a bigger glyph via brightness
      let b = p.base * (0.3 + 0.7 * p.near);
      if (p.spark) b = (0.55 + 0.45 * p.near) * (0.3 + 0.7 * (0.5 + 0.5 * Math.sin((t * Math.PI * 2) / p.period + p.phase)));
      const q = ctx.quiet;
      if (q && sxp > q.x0 && sxp < q.x1 && syp > q.y0 && syp < q.y1) b *= 0.22; // keep overlay text readable
      if (ctx.sweepX >= 0) {
        const bx = sxp / w - ctx.sweepX;
        b += 0.9 * Math.exp((-bx * bx) / 0.004);
      }
      const k = p.spark ? SPARK : GOLD;
      color[i * 3] = k[0] * b; color[i * 3 + 1] = k[1] * b; color[i * 3 + 2] = k[2] * b;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.aSize.needsUpdate = true;
    geo.attributes.aColor.needsUpdate = true;
  }

  return { scene, update, dispose: () => { geo.dispose(); material.dispose(); } };
}
