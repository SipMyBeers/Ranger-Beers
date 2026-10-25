// Builds the Ranger tab as layered 3D geometry from the public domain
// Wikimedia "Ranger Tab.svg" (765 x 315 viewBox, 5 paths).
//   body    : gold arc, extruded deep with a soft bevel
//   rim     : body minus the field outline, raised so the field sits recessed
//   field   : black inner band (solid; counters read through it)
//   letters : RANGER, built from the holes of the field path minus the counters
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

const W = 765;

function flipShape(points) {
  // SVG is y-down; three is y-up.
  return points.map((p) => new THREE.Vector2(p.x, -p.y));
}

function toShape(points, holes = []) {
  const s = new THREE.Shape(flipShape(points));
  for (const h of holes) s.holes.push(new THREE.Path(flipShape(h)));
  return s;
}

function bbox(points) {
  const b = new THREE.Box2();
  for (const p of points) b.expandByPoint(p);
  return b;
}

function area(points) {
  const s = bbox(points).getSize(new THREE.Vector2());
  return s.x * s.y;
}

// Every subpath of every SVG path as a point list, tagged with its source path.
function subpaths(data) {
  const out = [];
  data.paths.forEach((path, pi) => {
    for (const sp of path.subPaths) out.push({ pi, pts: sp.getPoints(6) });
  });
  return out;
}

export function parseTab(svgText) {
  const data = new SVGLoader().parse(svgText);
  const all = subpaths(data);
  // Largest subpath = gold body outline; second largest = field outline.
  const sorted = [...all].sort((a, b) => area(b.pts) - area(a.pts));
  const body = sorted[0];
  const field = sorted[1];
  const letterOutlines = all.filter((s) => s.pi === field.pi && s !== field);
  const counters = all.filter((s) => s.pi !== field.pi && s.pi !== body.pi);
  return { body: body.pts, field: field.pts, letterOutlines, counters };
}

function containsBox(outer, inner) {
  return bbox(outer).containsBox(bbox(inner));
}

function letterShapes(parsed) {
  return parsed.letterOutlines.map((l) => {
    const holes = parsed.counters.filter((c) => containsBox(l.pts, c.pts)).map((c) => c.pts);
    return toShape(l.pts, holes);
  });
}

export function buildTab(svgText, mats) {
  const p = parseTab(svgText);
  const D = W * 0.06; // body depth, ~6% of width
  const bevel = { bevelEnabled: true, bevelThickness: 7, bevelSize: 6, bevelSegments: 5, curveSegments: 24 };

  const bodyGeo = new THREE.ExtrudeGeometry(toShape(p.body), { depth: D, ...bevel });
  const rimGeo = new THREE.ExtrudeGeometry(toShape(p.body, [p.field]), {
    depth: 7, bevelEnabled: true, bevelThickness: 2.5, bevelSize: 2.5, bevelSegments: 3, curveSegments: 24,
  });
  const fieldGeo = new THREE.ExtrudeGeometry(toShape(p.field), { depth: 4, bevelEnabled: false, curveSegments: 24 });
  const lettersGeo = new THREE.ExtrudeGeometry(letterShapes(p), {
    depth: 7, bevelEnabled: true, bevelThickness: 2, bevelSize: 1.4, bevelSegments: 3, curveSegments: 12,
  });

  const front = D + bevel.bevelThickness; // z of the body face
  const group = new THREE.Group();
  const add = (geo, mat, z) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.z = z;
    group.add(m);
    return m;
  };
  add(bodyGeo, mats.gold, 0);
  add(rimGeo, mats.gold, front - 1); // rim stands ~8.5 proud of the body face
  add(fieldGeo, mats.field, front - 1); // field top at front+3: recessed under the rim
  add(lettersGeo, mats.letters, front + 2); // letters stand proud of field and rim

  // Center on the origin.
  const box = new THREE.Box3().setFromObject(group);
  const c = box.getCenter(new THREE.Vector3());
  for (const m of group.children) m.position.sub(c);
  const size = box.getSize(new THREE.Vector3());
  return { group, width: size.x, height: size.y, depth: size.z };
}
