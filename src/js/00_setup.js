import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ---------------------------------------------------------------- renderer / scene
const stage = document.getElementById('stage');
const SMALL = Math.min(innerWidth, innerHeight) < 700;
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  document.getElementById('loadMsg').style.display = 'none';
  document.querySelector('#loading .bar').style.display = 'none';
  document.getElementById('loadErr').style.display = 'block';
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, SMALL ? 1.5 : 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.62;
renderer.outputColorSpace = THREE.SRGBColorSpace;
stage.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.className = 'labels';
stage.appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.5, 6000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI * 0.64; // allow looking up from street level; camera height is clamped in the loop
controls.minDistance = 4;
controls.maxDistance = 900;
controls.screenSpacePanning = true;

// plan coordinates: x = east (m), z = south (m), measured from the NW corner of the satellite frame.
// world = plan - OFF, so the middle of the site sits near the origin
const OFF = new THREE.Vector3(85, 0, 105);
const site = new THREE.Group();
site.position.set(-OFF.x, 0, -OFF.z);
scene.add(site);
const P = (x, y, z) => new THREE.Vector3(x - OFF.x, y, z - OFF.z);

const TICKERS = []; // per-frame callbacks (t, dt)
const EXPORT = new URLSearchParams(location.search).has('export'); // trimmed road for model-file export (local tooling only)
const RX0 = EXPORT ? -40 : -520, RX1 = EXPORT ? 200 : 640;
const ANISO = Math.min(8, renderer.capabilities.getMaxAnisotropy());
const RNG = (() => { let s = 1234567; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
const rand = (a, b) => a + (b - a) * RNG();

// ---------------------------------------------------------------- canvas textures
function canvasTex(w, h, draw, { repeat = null, srgb = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = ANISO;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.repeat.set(repeat[0], repeat[1]);
  return t;
}
function noiseFill(g, w, h, base, amp, n = 2600, size = 2) {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < n; i++) {
    const v = (RNG() - 0.5) * amp;
    g.fillStyle = v > 0 ? `rgba(255,255,255,${v})` : `rgba(0,0,0,${-v})`;
    g.fillRect(RNG() * w, RNG() * h, size, size);
  }
}
// 2 m x 2 m of running-bond brick
function drawBrick(g, x0, y0, w, h, cols, rows, palette, mortar) {
  g.fillStyle = mortar; g.fillRect(x0, y0, w, h);
  const bw = w / cols, bh = h / rows;
  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * bw / 2;
    for (let c = -1; c <= cols; c++) {
      const x = x0 + c * bw + off; if (x > x0 + w) continue;
      g.fillStyle = palette[Math.floor(RNG() * palette.length)];
      const xa = Math.max(x0, x + 1), xb = Math.min(x0 + w, x + bw - 1);
      if (xb > xa) g.fillRect(xa, y0 + r * bh + 1, xb - xa, bh - 2);
    }
  }
}
const BRICK_PAL = ['#a14d38', '#ab573f', '#984632', '#b3603f', '#9a4a3a', '#a85a46'];
const TAN_PAL = ['#c98a5c', '#c48354', '#d09263', '#bf7f55', '#cc8f5f'];
const TEX = {};
TEX.brick = canvasTex(512, 512, (g, w, h) => drawBrick(g, 0, 0, w, h, 8, 24, BRICK_PAL, '#cfc4b8'), { repeat: [0.5, 0.5] });
TEX.brickTan = canvasTex(512, 512, (g, w, h) => drawBrick(g, 0, 0, w, h, 8, 24, TAN_PAL, '#e0d2c2'), { repeat: [0.5, 0.5] });

// facade textures: one bay (3.0 m) x one storey (3.8 m), v=0 at floor level
function facadeTex(kind, glow) {
  return canvasTex(256, 256, (g, w, h) => {
    const Y = v => h - (v / 3.8) * h, X = u => (u / 3.0) * w;
    const win = (u0, v0, u1, v1) => {
      if (glow) { g.fillStyle = RNG() < 0.72 ? '#ffd9a0' : '#3a2a18'; g.fillRect(X(u0), Y(v1), X(u1) - X(u0), Y(v0) - Y(v1)); return; }
      const gr = g.createLinearGradient(0, Y(v1), 0, Y(v0));
      gr.addColorStop(0, '#5f7b8c'); gr.addColorStop(0.5, '#33454f'); gr.addColorStop(1, '#283740');
      g.fillStyle = gr; g.fillRect(X(u0), Y(v1), X(u1) - X(u0), Y(v0) - Y(v1));
      g.fillStyle = '#d9dcdc'; // mullions
      g.fillRect(X((u0 + u1) / 2) - 1.5, Y(v1), 3, Y(v0) - Y(v1));
      g.fillRect(X(u0), Y(v0 + (v1 - v0) * 0.72) - 1.5, X(u1) - X(u0), 3);
    };
    if (glow) g.fillStyle = '#000', g.fillRect(0, 0, w, h);
    if (kind === 'ribbon') {
      if (!glow) { noiseFill(g, w, h, '#eeede8', 0.05, 600); }
      win(0, 0.95, 3.0, 3.0);
      if (!glow) { g.fillStyle = '#f4f3ef'; g.fillRect(0, Y(3.8), w, Y(3.05) - Y(3.8)); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, Y(3.05), w, 3); }
    } else if (kind === 'brick') {
      if (!glow) {
        drawBrick(g, 0, Y(3.8), w, Y(0.45) - Y(3.8), 6, 30, BRICK_PAL, '#cdbfb2');
        g.fillStyle = '#f0efea'; g.fillRect(0, Y(0.45), w, h - Y(0.45));
        g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, Y(0.45), w, 2);
      }
      win(0.55, 1.0, 2.45, 3.2);
    } else if (kind === 'tower') {
      if (!glow) noiseFill(g, w, h, '#efeeea', 0.04, 500);
      win(0.5, 0.9, 2.5, 3.1);
    } else if (kind === 'yellow') {
      if (!glow) noiseFill(g, w, h, '#e3c15a', 0.05, 500);
      win(0.6, 1.0, 2.4, 3.0);
    }
  }, { repeat: [1 / 3.0, 1 / 3.8] });
}

TEX.paving = canvasTex(512, 512, (g, w, h) => {
  noiseFill(g, w, h, '#c3beb5', 0.07, 3000);
  g.strokeStyle = 'rgba(80,70,60,.28)'; g.lineWidth = 2;
  for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * w / 8, 0); g.lineTo(i * w / 8, h); g.stroke(); g.beginPath(); g.moveTo(0, i * h / 8); g.lineTo(w, i * h / 8); g.stroke(); }
}, { repeat: [1 / 4, 1 / 4] });
// argyle paving of the front plaza (one tile = 8 m)
TEX.plaza = canvasTex(512, 512, (g, w, h) => {
  noiseFill(g, w, h, '#b9b5ae', 0.08, 3500);
  const d = w / 2;
  for (let i = -1; i < 3; i++) for (let j = -1; j < 3; j++) {
    const cx = i * d + ((j % 2) ? d / 2 : 0), cy = j * d / 2;
    g.fillStyle = (i + j) % 3 === 0 ? 'rgba(70,72,78,.55)' : 'rgba(120,118,115,.35)';
    g.beginPath(); g.moveTo(cx, cy - d / 4); g.lineTo(cx + d / 4, cy); g.lineTo(cx, cy + d / 4); g.lineTo(cx - d / 4, cy); g.closePath(); g.fill();
  }
  g.strokeStyle = 'rgba(60,55,50,.2)'; g.lineWidth = 1.5;
  for (let i = 0; i <= 16; i++) { g.beginPath(); g.moveTo(i * w / 16, 0); g.lineTo(i * w / 16, h); g.stroke(); g.beginPath(); g.moveTo(0, i * h / 16); g.lineTo(w, i * h / 16); g.stroke(); }
}, { repeat: [1 / 8, 1 / 8] });
TEX.asphalt = canvasTex(256, 256, (g, w, h) => noiseFill(g, w, h, '#5b5e62', 0.1, 4000, 2), { repeat: [1 / 6, 1 / 6] });
TEX.grass = canvasTex(256, 256, (g, w, h) => noiseFill(g, w, h, '#7d9f58', 0.14, 5000, 3), { repeat: [1 / 5, 1 / 5] });
TEX.solar = canvasTex(128, 256, (g, w, h) => {
  g.fillStyle = '#c9cdd2'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#1d2c48'; g.fillRect(4, 4, w - 8, h - 8);
  g.strokeStyle = 'rgba(160,180,210,.45)'; g.lineWidth = 1;
  for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(4 + i * (w - 8) / 6, 4); g.lineTo(4 + i * (w - 8) / 6, h - 4); g.stroke(); }
  for (let i = 1; i < 12; i++) { g.beginPath(); g.moveTo(4, 4 + i * (h - 8) / 12); g.lineTo(w - 4, 4 + i * (h - 8) / 12); g.stroke(); }
});
TEX.ring = canvasTex(256, 256, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  g.strokeStyle = '#ffffff'; g.lineWidth = 22;
  g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 16, 0, Math.PI * 2); g.stroke();
});

const FAC = {};
for (const k of ['ribbon', 'brick', 'tower', 'yellow']) FAC[k] = { map: facadeTex(k, false), glow: facadeTex(k, true) };

// ---------------------------------------------------------------- materials
const MAT = {};
const std = (color, roughness = 0.85, metalness = 0, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
MAT.white = std(0xf0efea, 0.82);
MAT.white2 = std(0xe2e0da, 0.88);
MAT.granite = std(0xbdb8b0, 0.7);
MAT.brick = std(0xffffff, 0.92, 0, { map: TEX.brick });
MAT.brickTan = std(0xffffff, 0.9, 0, { map: TEX.brickTan });
MAT.glass = std(0x5f8493, 0.08, 0.85, { envMapIntensity: 1.15 });
MAT.glassDark = std(0x2a3842, 0.22, 0.55, { emissive: 0xffcf8f, emissiveIntensity: 0 });
MAT.glassRail = std(0x9fc3cf, 0.1, 0.3, { transparent: true, opacity: 0.35, depthWrite: false });
MAT.steel = std(0xd8dce0, 0.32, 0.65);
MAT.steelDark = std(0x4a5056, 0.45, 0.6);
MAT.edge = std(0x3c4146, 0.6, 0.2);
MAT.soffit = std(0x9ca2a8, 0.8, 0.05, { emissive: 0xfff1d6, emissiveIntensity: 0 });
MAT.canopyTop = std(0xc7cacc, 0.55, 0.25);
MAT.roof = std(0xa9aba9, 0.95);
MAT.roofDark = std(0x85888b, 0.95);
MAT.metalRoof = std(0xb9bec2, 0.45, 0.55);
MAT.vault = std(0xc3ccd3, 0.42, 0.45);
MAT.hip = std(0x6b4a3d, 0.85);
MAT.paving = std(0xffffff, 0.95, 0, { map: TEX.paving });
MAT.plaza = std(0xffffff, 0.92, 0, { map: TEX.plaza });
MAT.asphalt = std(0xffffff, 0.95, 0, { map: TEX.asphalt });
MAT.sidewalk = std(0xbcb7ad, 0.95);
MAT.curb = std(0xd6d3cc, 0.9);
MAT.grass = std(0xffffff, 1, 0, { map: TEX.grass });
MAT.ground = std(0xa3ad8e, 1);
MAT.water = std(0x5fb0cc, 0.04, 0.15, { transparent: true, opacity: 0.9, emissive: 0x2a8fb5, emissiveIntensity: 0 });
MAT.stone = std(0x5f6266, 0.6);
MAT.pink = std(0xe2589c, 0.42, 0.05, { emissive: 0xff5fa8, emissiveIntensity: 0 });
MAT.solar = std(0xffffff, 0.28, 0.55, { map: TEX.solar });
MAT.green = std(0x4c7637, 1);
MAT.foliage = std(0xffffff, 0.95);
MAT.flower = std(0xc23b3b, 0.9);
MAT.yellow = std(0xe3c15a, 0.85);
MAT.blue = std(0x2459b3, 0.55);
MAT.mark = std(0xf3f3ee, 0.8);
MAT.markY = std(0xe8c54a, 0.8);
MAT.ctx = std(0xeef0f0, 0.9, 0, { transparent: true, opacity: 0.5 });
MAT.ctxRoof = std(0xdfe2e2, 0.95, 0, { transparent: true, opacity: 0.5 });
MAT.ring = new THREE.MeshStandardMaterial({ map: TEX.ring, transparent: true, roughness: 0.6, emissive: 0xffffff, emissiveIntensity: 0, emissiveMap: TEX.ring });
for (const k of Object.keys(FAC)) {
  MAT['fac_' + k] = std(0xffffff, 0.85, 0, { map: FAC[k].map, emissive: 0xffffff, emissiveMap: FAC[k].glow, emissiveIntensity: 0 });
}
const GLOWABLE = [MAT.glassDark, MAT.fac_ribbon, MAT.fac_brick, MAT.fac_tower, MAT.fac_yellow];

// ---------------------------------------------------------------- geometry helpers
// axis-aligned box in plan coords, UVs in metres (u along the face, v = height)
const FACES = ['px', 'nx', 'py', 'ny', 'pz', 'nz'];
function boxGeo(x0, y0, z0, x1, y1, z1, faces = FACES) {
  const pos = [], nor = [], uv = [], idx = [];
  const add = (a, b, c, d, n, uvs) => {
    const i = pos.length / 3;
    for (const p of [a, b, c, d]) pos.push(...p);
    for (let k = 0; k < 4; k++) nor.push(...n);
    uv.push(...uvs);
    idx.push(i, i + 1, i + 2, i, i + 2, i + 3);
  };
  for (const f of faces) {
    if (f === 'px') add([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], [-z1, y0, -z0, y0, -z0, y1, -z1, y1]);
    if (f === 'nx') add([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], [z0, y0, z1, y0, z1, y1, z0, y1]);
    if (f === 'pz') add([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], [x0, y0, x1, y0, x1, y1, x0, y1]);
    if (f === 'nz') add([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], [-x1, y0, -x0, y0, -x0, y1, -x1, y1]);
    if (f === 'py') add([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], [x0, -z1, x1, -z1, x1, -z0, x0, -z0]);
    if (f === 'ny') add([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], [x0, z0, x1, z0, x1, z1, x0, z1]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}
// planar polygon (convex quad / triangle) from points, facing roughly `hint`
function polyGeo(pts, hint) {
  const a = new THREE.Vector3(...pts[0]), b = new THREE.Vector3(...pts[1]), c = new THREE.Vector3(...pts[2]);
  let n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
  if (hint && n.dot(new THREE.Vector3(...hint)) < 0) { pts = pts.slice().reverse(); n.negate(); }
  const pos = [], nor = [], uv = [], idx = [];
  // u along first edge, v along y (or z for flat faces)
  const e = new THREE.Vector3(...pts[1]).sub(new THREE.Vector3(...pts[0])); e.y = 0;
  const eLen = e.length() || 1; e.divideScalar(eLen);
  for (const p of pts) {
    pos.push(...p); nor.push(n.x, n.y, n.z);
    if (Math.abs(n.y) > 0.7) uv.push(p[0], -p[2]); else uv.push(p[0] * e.x + p[2] * e.z, p[1]);
  }
  for (let i = 1; i < pts.length - 1; i++) idx.push(0, i, i + 1);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}
function toIndexedStd(g) { // make any geometry merge-compatible (position/normal/uv, indexed)
  if (!g.index) { const n = g.attributes.position.count; g.setIndex([...Array(n).keys()]); }
  for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  return g;
}

// collects geometry per material for one pickable building, merged at the end
class Builder {
  constructor(id) { this.id = id; this.parts = new Map(); this.extra = []; }
  add(mat, geo) { if (!this.parts.has(mat)) this.parts.set(mat, []); this.parts.get(mat).push(toIndexedStd(geo)); return this; }
  box(mat, x0, y0, z0, x1, y1, z1, faces) { return this.add(mat, boxGeo(Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1), Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1), faces)); }
  // walls with one material, roof with another
  mass(wallMat, roofMat, x0, y0, z0, x1, y1, z1) {
    this.box(wallMat, x0, y0, z0, x1, y1, z1, ['px', 'nx', 'pz', 'nz']);
    if (roofMat) this.box(roofMat, x0, y0, z0, x1, y1, z1, ['py']);
    return this;
  }
  parapet(mat, x0, z0, x1, z1, y, h = 1.1, t = 0.3) {
    this.box(mat, x0, y, z0, x1, y + h, z0 + t); this.box(mat, x0, y, z1 - t, x1, y + h, z1);
    this.box(mat, x0, y, z0 + t, x0 + t, y + h, z1 - t); this.box(mat, x1 - t, y, z0 + t, x1, y + h, z1 - t);
    return this;
  }
  poly(mat, pts, hint) { return this.add(mat, polyGeo(pts, hint)); }
  // prism along a plan segment a->b (x,z), from y0 to y1, spanning offsets o0..o1 along the segment's left normal
  seg(mat, a, b, y0, y1, o0, o1, ends = true) {
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), nx = dz / L, nz = -dx / L; // normal pointing to the right of a->b when looking down (x east, z south)
    const P = (p, o, y) => [p[0] + nx * o, y, p[1] + nz * o];
    const A0 = P(a, o0, y0), B0 = P(b, o0, y0), A1 = P(a, o1, y0), B1 = P(b, o1, y0);
    const A0t = P(a, o0, y1), B0t = P(b, o0, y1), A1t = P(a, o1, y1), B1t = P(b, o1, y1);
    this.poly(mat, [A1, B1, B1t, A1t], [nx, 0, nz]);
    this.poly(mat, [B0, A0, A0t, B0t], [-nx, 0, -nz]);
    this.poly(mat, [A0t, B0t, B1t, A1t], [0, 1, 0]);
    this.poly(mat, [A0, B0, B1, A1], [0, -1, 0]);
    if (ends) { this.poly(mat, [A0, A1, A1t, A0t], [-dx, 0, -dz]); this.poly(mat, [B1, B0, B0t, B1t], [dx, 0, dz]); }
    return this;
  }
  mesh(m) { this.extra.push(m); return this; }
  finish(parent = site, { cast = true, receive = true } = {}) {
    const grp = new THREE.Group(); grp.userData.id = this.id;
    for (const [mat, geos] of this.parts) {
      const g = mergeGeometries(geos, false);
      const mesh = new THREE.Mesh(g, mat);
      mesh.castShadow = cast && !mat.transparent; mesh.receiveShadow = receive;
      grp.add(mesh);
    }
    for (const m of this.extra) grp.add(m);
    parent.add(grp);
    return grp;
  }
}

// instanced batches
const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _up = new THREE.Vector3(0, 1, 0);
function TRS(x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  _e.set(rx, ry, rz); _q.setFromEuler(_e);
  return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), _q.clone(), new THREE.Vector3(sx, sy, sz));
}
function SEG(a, b, r) { // unit cylinder (r=1,h=1) stretched between plan points a,b
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const d = new THREE.Vector3().subVectors(B, A); const len = d.length();
  const q = new THREE.Quaternion().setFromUnitVectors(_up, d.normalize());
  return new THREE.Matrix4().compose(A.add(B).multiplyScalar(0.5), q, new THREE.Vector3(r, len, r));
}
class Inst {
  constructor(geo, mat, { cast = true, receive = true } = {}) { this.geo = geo; this.mat = mat; this.ms = []; this.cs = []; this.cast = cast; this.receive = receive; }
  push(m, color) { this.ms.push(m); if (color !== undefined) this.cs.push(new THREE.Color(color)); return this; }
  build(parent = site, id) {
    if (!this.ms.length) return null;
    const im = new THREE.InstancedMesh(this.geo, this.mat, this.ms.length);
    this.ms.forEach((m, i) => im.setMatrixAt(i, m));
    if (this.cs.length === this.ms.length) this.cs.forEach((c, i) => im.setColorAt(i, c));
    im.castShadow = this.cast; im.receiveShadow = this.receive;
    if (id) im.userData.id = id;
    im.computeBoundingSphere();
    parent.add(im); return im;
  }
}
const GEO = {
  cyl: new THREE.CylinderGeometry(1, 1, 1, 10, 1),
  cyl6: new THREE.CylinderGeometry(1, 1, 1, 6, 1),
  box: new THREE.BoxGeometry(1, 1, 1),
  crown: new THREE.IcosahedronGeometry(1, 1),
  sphere: new THREE.SphereGeometry(1, 12, 8),
};
// shared instanced batches (built at the end)
const B_STEEL = new Inst(GEO.cyl6, MAT.steel);            // lattice members
const B_STEELD = new Inst(GEO.cyl6, MAT.steelDark);       // struts / rods
const B_COL = new Inst(GEO.cyl, MAT.white);               // round columns
const B_SOLAR = new Inst(GEO.box, MAT.solar, { cast: false });
const B_GREEN = new Inst(GEO.crown, MAT.foliage, { cast: true });
const B_FLOWER = new Inst(GEO.box, MAT.flower, { cast: false });
const B_PLANTER = new Inst(GEO.box, MAT.white2, { cast: false });
function solarArray(x0, z0, x1, z1, y, tilt = 0.17) { // rows run east-west, panels 1 x 1.7 m
  for (let z = z0 + 1; z <= z1 - 0.9; z += 2.1)
    for (let x = x0 + 0.6; x <= x1 - 0.6; x += 1.08)
      B_SOLAR.push(TRS(x, y + 0.45, z, -tilt, 0, 0, 1.02, 0.05, 1.7));
}
function shrubRow(x0, z0, x1, z1, y, step = 2.2, s = 0.75) {
  const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / step));
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t;
    B_GREEN.push(TRS(x, y + s * 0.6, z, 0, RNG() * 6, 0, s * rand(0.8, 1.2), s * rand(0.7, 1), s * rand(0.8, 1.2)), new THREE.Color().setHSL(rand(0.24, 0.3), rand(0.35, 0.5), rand(0.28, 0.38)));
  }
}
