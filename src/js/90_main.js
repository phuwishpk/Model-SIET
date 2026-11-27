// ================================================================ finalize, UI, camera, loop
B_STEEL.build(site, 'tower');
B_STEELD.build(site);
B_COL.build(site);
B_SOLAR.build(site);
B_GREEN.build(site);
B_FLOWER.build(site);
B_PLANTER.build(site);

const VIEWS = {
  overview: { pos: [252, 128, -96], tgt: [84, 6, 102], tgtM: [62, 10, 62], fov: 40 },
  plaza: { pos: [129.5, 1.3, 39], tgt: [72.2, 29.6, 79.2], fov: 74.5 },
  street: { pos: [112, 24, -30], tgt: [52, 17, 45], fov: 46 },
  road: { pos: [100, 2.5, -5], tgt: [54.1, 19.5, 60.5], fov: 70 },
  drone: { pos: [229, 77, -65], tgt: [163.6, 54.1, -19.6], fov: 30 },
  soi: { pos: [21, 1.6, -9], tgt: [41, 23, 34], fov: 62 },
  top: { pos: [85, 340, 105.2], tgt: [85, 0, 105], fov: 40 },
};
const viewBtns = [...document.querySelectorAll('.view')];
let tween = null;
const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function flyToPose(pos, tgt, fov, dur = 1.6) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (dur <= 0 || reduce) {
    camera.position.copy(pos); controls.target.copy(tgt); camera.fov = fov; camera.updateProjectionMatrix(); controls.update(); tween = null; return;
  }
  tween = { t: 0, dur, p0: camera.position.clone(), p1: pos, t0: controls.target.clone(), t1: tgt, f0: camera.fov, f1: fov };
}
function setView(name, dur = 1.6) {
  const v = VIEWS[name]; if (!v) return;
  const a = camera.aspect;
  let pos = P(...v.pos), tgt = P(...(a < 1 && v.tgtM ? v.tgtM : v.tgt)), fov = v.fov;
  if (a < 1.5) { // keep the composition on tall / narrow screens
    const hHalf = Math.atan(Math.tan(THREE.MathUtils.degToRad(fov / 2)) * 16 / 9);
    const ground = name === 'plaza' || name === 'soi' || name === 'road';
    fov = Math.min(ground ? 84 : 62, fov * (ground ? 1.25 : 1.4));
    if (!ground) {
      const k = Math.min(1.55, Math.max(1, Math.tan(hHalf) / (a * Math.tan(THREE.MathUtils.degToRad(fov / 2)))));
      pos = tgt.clone().add(pos.clone().sub(tgt).multiplyScalar(k));
    }
  }
  flyToPose(pos, tgt, fov, dur);
  viewBtns.forEach(b => b.setAttribute('aria-current', b.dataset.view === name ? 'true' : 'false'));
}

// ---------------------------------------------------------------- labels and selection
const labelEls = {};
for (const L of LABELS) {
  const el = document.createElement('div');
  el.className = 'lbl'; el.textContent = L.name; el.tabIndex = 0; el.setAttribute('role', 'button');
  el.addEventListener('click', e => { e.stopPropagation(); select(L.id, true); });
  el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(L.id, true); } });
  const o = new CSS2DObject(el); o.position.copy(P(...L.pos)); scene.add(o);
  labelEls[L.id] = el;
}
const infoEl = document.getElementById('info');
const hl = new THREE.Box3Helper(new THREE.Box3(), 0xe2589c);
hl.visible = false; scene.add(hl);
let selected = null;
function groupBox(id) {
  const box = new THREE.Box3();
  site.traverse(o => { if (o.userData.id === id && !o.isInstancedMesh) box.expandByObject(o); });
  return box;
}
function select(id, fly) {
  if (!id || !INFO[id]) { selected = null; infoEl.hidden = true; hl.visible = false; Object.values(labelEls).forEach(e => e.classList.remove('on')); return; }
  selected = id;
  const I = INFO[id];
  document.getElementById('infoName').textContent = I.name;
  document.getElementById('infoMeta').textContent = I.meta;
  const ul = document.getElementById('infoLines'); ul.textContent = '';
  for (const s of I.lines) { const li = document.createElement('li'); li.textContent = s; ul.appendChild(li); }
  infoEl.hidden = false;
  Object.entries(labelEls).forEach(([k, e]) => e.classList.toggle('on', k === id));
  const box = groupBox(id);
  if (!box.isEmpty()) { hl.box.copy(box).expandByScalar(0.8); hl.visible = true; }
  if (fly && !box.isEmpty()) {
    const c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
    const dir = camera.position.clone().sub(controls.target).normalize();
    if (dir.y < 0.42) { dir.y = 0.42; dir.normalize(); }
    const dist = Math.max(s.x, s.y * 1.3, s.z) * 1.05 / Math.tan(THREE.MathUtils.degToRad(42 / 2)) * 0.62 + 18;
    flyToPose(c.clone().add(dir.multiplyScalar(dist)), c, 42, 1.4);
    viewBtns.forEach(b => b.setAttribute('aria-current', 'false'));
  }
}
document.getElementById('infoClose').addEventListener('click', () => select(null));
const ray = new THREE.Raycaster();
let down = null;
renderer.domElement.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; stopTour(); });
renderer.domElement.addEventListener('pointerup', e => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
  const r = renderer.domElement.getBoundingClientRect();
  ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
  const hits = ray.intersectObject(site, true);
  for (const h of hits) {
    let o = h.object; while (o && !(o.userData.id && INFO[o.userData.id])) o = o.parent;
    if (o) { select(o.userData.id, false); return; }
    if (h.object.userData.id === 'ground' || h.object.parent?.userData.id === 'ground') break;
  }
  select(null);
});

// ---------------------------------------------------------------- toggles
const $ = id => document.getElementById(id);
function pressed(btn, on) { btn.setAttribute('aria-pressed', on ? 'true' : 'false'); }
$('tLabels').addEventListener('click', () => {
  const on = $('tLabels').getAttribute('aria-pressed') !== 'true'; pressed($('tLabels'), on);
  document.body.classList.toggle('hide-labels', !on);
});
$('tSpin').addEventListener('click', () => {
  controls.autoRotate = !controls.autoRotate; controls.autoRotateSpeed = 0.7; pressed($('tSpin'), controls.autoRotate);
});
let dusk = false;
function setDusk(on) {
  dusk = on; pressed($('tTime'), on);
  applySky(on ? SKY_DUSK : SKY_DAY);
  for (const m of GLOWABLE) m.emissiveIntensity = on ? 1.0 : 0;
  MAT.glassDark.emissiveIntensity = on ? 0.6 : 0;
  MAT.soffit.emissiveIntensity = on ? 0.32 : 0;
  MAT.ring.emissiveIntensity = on ? 0.9 : 0;
  MAT.pink.emissiveIntensity = on ? 0.35 : 0;
  MAT.water.emissiveIntensity = on ? 0.55 : 0;
  if (window.__onDusk) window.__onDusk(on);
  if (clay) applyClay(true);
}
$('tTime').addEventListener('click', () => setDusk(!dusk));

let clay = false;
const CLAY = std(0xf3f2ee, 0.88), CLAY_GLASS = std(0xc6d0d6, 0.25, 0.2), CLAY_GREEN = std(0xdde6d6, 0.95), CLAY_GROUND = std(0xd9dcdc, 1);
function applyClay(on) {
  clay = on; pressed($('tClay'), on);
  site.traverse(o => {
    if (!o.isMesh) return;
    if (o.userData.mat0 === undefined) { o.userData.mat0 = o.material; o.userData.ic0 = o.instanceColor || null; }
    if (on) {
      const m0 = o.userData.mat0;
      if (m0 === MAT.pink || m0 === MAT.water || m0 === MAT.ring || m0 === MAT.glassRail) { o.material = m0; return; }
      if (o.userData.ic0) o.instanceColor = null;
      o.material = (m0 === MAT.glass || m0 === MAT.glassDark) ? CLAY_GLASS : (m0 === MAT.foliage ? CLAY_GREEN : CLAY);
    } else {
      o.material = o.userData.mat0; if (o.userData.ic0) o.instanceColor = o.userData.ic0;
    }
  });
  sky.visible = !on;
  const bg = dusk ? 0x8d96a1 : 0xc9d0d6;
  scene.background = on ? new THREE.Color(bg) : null;
  scene.fog.color.set(on ? bg : (dusk ? SKY_DUSK.fog : SKY_DAY.fog));
  renderer.toneMappingExposure = on ? (dusk ? 0.9 : 0.74) : (dusk ? SKY_DUSK.exposure : SKY_DAY.exposure);
  GROUND_PLANE.material = on ? CLAY_GROUND : MAT.ground;
  const prof = dusk ? SKY_DUSK : SKY_DAY;
  hemi.intensity = on ? prof.hemiI * 0.5 : prof.hemiI;
  fill.intensity = on ? prof.fillI * 0.35 : prof.fillI;
  scene.environmentIntensity = on ? prof.env * 0.5 : prof.env;
}
$('tClay').addEventListener('click', () => applyClay(!clay));

$('tFull').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch (e) { /* not allowed here */ }
});

// presentation tour
const TOUR = ['overview', 'street', 'plaza', 'road', 'drone', 'soi', 'top'];
let tour = null;
function stopTour() {
  if (!tour) return;
  clearTimeout(tour.timer); tour = null;
  document.body.classList.remove('touring'); pressed($('tTour'), false);
  $('tTour').querySelector('span').textContent = 'นำเสนอ';
  controls.autoRotate = $('tSpin').getAttribute('aria-pressed') === 'true';
}
function tourStep() {
  if (!tour) return;
  const name = TOUR[tour.i % TOUR.length]; tour.i++;
  setView(name, 3.2);
  controls.autoRotate = !['plaza', 'soi', 'road'].includes(name); controls.autoRotateSpeed = 0.45;
  tour.timer = setTimeout(tourStep, 9000);
}
$('tTour').addEventListener('click', e => {
  e.stopPropagation();
  if (tour) { stopTour(); return; }
  select(null);
  tour = { i: 0, timer: 0 };
  document.body.classList.add('touring'); pressed($('tTour'), true);
  $('tTour').querySelector('span').textContent = 'หยุดนำเสนอ';
  tourStep();
});
addEventListener('keydown', e => { if (e.key === 'Escape') { stopTour(); select(null); } });

viewBtns.forEach(b => b.addEventListener('click', () => {
  stopTour();
  if (location.hash.slice(1) === b.dataset.view) setView(b.dataset.view); else location.hash = b.dataset.view;
}));
addEventListener('hashchange', () => { const h = location.hash.slice(1); if (VIEWS[h]) setView(h); });

// ---------------------------------------------------------------- resize + loop
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false); labelRenderer.setSize(w, h);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
const ro = new ResizeObserver(resize); ro.observe(stage); resize();

const startView = VIEWS[location.hash.slice(1)] ? location.hash.slice(1) : 'overview';
setView(startView, 0);
if (startView === 'overview' && !matchMedia('(prefers-reduced-motion: reduce)').matches && !navigator.webdriver) {
  // one gentle fly-in from higher up
  const endPos = camera.position.clone(), endTgt = controls.target.clone();
  camera.position.copy(endTgt.clone().add(endPos.clone().sub(endTgt).multiplyScalar(1.6)).add(new THREE.Vector3(0, 60, 0)));
  controls.update();
  flyToPose(endPos, endTgt, camera.fov, 2.6);
}
const clock = new THREE.Clock();
let firstFrame = true, frameNo = 0;
const occluders = [];
site.traverse(o => { if (o.isMesh && !o.isInstancedMesh && o.parent && INFO[o.parent.userData.id]) occluders.push(o); });
const _lp = new THREE.Vector3(), occRay = new THREE.Raycaster();
function declutter() {
  if (document.body.classList.contains('hide-labels')) return;
  const kept = [];
  for (const L of LABELS) {
    const el = labelEls[L.id];
    if (el.style.display === 'none') continue;
    _lp.copy(P(...L.pos)); const dist = _lp.distanceTo(camera.position);
    occRay.set(camera.position, _lp.sub(camera.position).normalize()); occRay.far = dist - 1.5;
    if (L.id !== selected && (dist > 700 || occRay.intersectObjects(occluders, false).length)) { el.style.visibility = 'hidden'; continue; }
    el.style.visibility = 'visible';
    const r = el.getBoundingClientRect();
    if (!r.width) continue;
    const hit = L.id !== selected && kept.some(k => r.left < k.right + 4 && r.right > k.left - 4 && r.top < k.bottom + 3 && r.bottom > k.top - 3);
    if (hit) el.style.visibility = 'hidden'; else kept.push(r);
  }
}
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1), t = clock.elapsedTime;
  if (tween) {
    tween.t += dt / tween.dur; const k = ease(Math.min(1, tween.t));
    camera.position.lerpVectors(tween.p0, tween.p1, k);
    controls.target.lerpVectors(tween.t0, tween.t1, k);
    camera.fov = tween.f0 + (tween.f1 - tween.f0) * k; camera.updateProjectionMatrix();
    if (tween.t >= 1) tween = null;
  }
  controls.update();
  if (camera.position.y < 0.9) { const d = 0.9 - camera.position.y; camera.position.y += d; if (controls.target.y < 0.5) controls.target.y += d; }
  for (const f of TICKERS) f(t, dt);
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
  if ((frameNo++ % 6) === 0) declutter();
  if (firstFrame) { firstFrame = false; requestAnimationFrame(() => document.getElementById('loading').classList.add('done')); window.__ready = true; }
});
window.__view = n => setView(n, 0);
window.__site = site; window.__THREE = THREE;
for (const [k, m] of Object.entries(MAT)) if (!m.name) m.name = k;
window.__info = () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles, geos: renderer.info.memory.geometries, tex: renderer.info.memory.textures });
window.__dusk = on => setDusk(on);
window.__clay = on => applyClay(on);
window.__select = id => select(id, true);
window.__ortho = (x0, z0, x1, z1, w, h) => { // test hook: orthographic plan render as data URL
  const cam = new THREE.OrthographicCamera(x0 - OFF.x, x1 - OFF.x, -(z0 - OFF.z), -(z1 - OFF.z), 1, 2000);
  cam.position.set(0, 1000, 0); cam.up.set(0, 0, -1); cam.lookAt(0, 0, 0);
  const labelsWas = document.body.classList.contains('hide-labels'); sky.visible = false;
  renderer.setSize(w, h, false); renderer.render(scene, cam);
  const url = renderer.domElement.toDataURL('image/png'); sky.visible = true; resize(); return url;
};
window.__pose = (pos, tgt, fov) => flyToPose(P(...pos), P(...tgt), fov || 45, 0);
