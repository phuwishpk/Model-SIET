// ================================================================ plaza, fountain, letters, brick buildings south of the plaza
function gable(B, mat, x0, x1, z0, z1, yE, yR, endMat = MAT.white) { // ridge along x
  const zm = (z0 + z1) / 2;
  B.poly(mat, [[x0, yE, z0], [x1, yE, z0], [x1, yR, zm], [x0, yR, zm]], [0, 1, -1]);
  B.poly(mat, [[x0, yR, zm], [x1, yR, zm], [x1, yE, z1], [x0, yE, z1]], [0, 1, 1]);
  B.poly(endMat, [[x0, yE, z0], [x0, yR, zm], [x0, yE, z1]], [-1, 0, 0]);
  B.poly(endMat, [[x1, yE, z0], [x1, yR, zm], [x1, yE, z1]], [1, 0, 0]);
}
MAT.stoneDS = MAT.stone.clone(); MAT.stoneDS.side = THREE.DoubleSide;
MAT.vault.side = THREE.DoubleSide;
MAT.glassDS = MAT.glass.clone(); MAT.glassDS.side = THREE.DoubleSide;

// ---------------------------------------------------------------- plaza
{
  const Z = new Builder('plaza');
  const FX = 125.5, FZ = 46.5;
  const lathe = (pts, seg = 72) => {
    const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
    g.translate(FX, 0, FZ); return g;
  };
  Z.add(MAT.granite, lathe([[0, 0.14], [5.6, 0.14], [5.6, 0.02]]));
  Z.add(MAT.stoneDS, lathe([[3.75, 0.1], [3.75, 0.72], [3.35, 0.72], [3.35, 0.3], [2.1, 0.3]]));
  Z.add(MAT.stoneDS, lathe([[2.1, 0.3], [2.1, 1.22], [1.8, 1.22], [1.8, 0.9], [0.45, 0.9], [0.45, 1.6], [0, 1.6]]));
  const water = (r, y) => { const g = new THREE.CircleGeometry(r, 64); g.rotateX(-Math.PI / 2); g.translate(FX, y, FZ); return g; };
  Z.add(MAT.water, water(3.35, 0.56)); Z.add(MAT.water, water(1.8, 1.12));
  // planter + hedge in front of the red-brick block, potted topiary trees
  Z.box(MAT.white2, 90.5, 0.08, 55.4, 117, 0.55, 57.1);
  Z.box(MAT.green, 90.8, 0.55, 55.7, 116.7, 1.35, 56.8);
  for (let x = 92.5; x <= 116; x += 5.8) {
    Z.add(MAT.stone, (() => { const g = new THREE.CylinderGeometry(0.72, 0.58, 0.78, 16); g.translate(x, 0.47, 53.9); return g; })());
    B_GREEN.push(TRS(x, 2.5, 53.9, 0, RNG() * 6, 0, 1.1, 1.0, 1.1), new THREE.Color().setHSL(0.27, 0.45, 0.3));
    B_STEELD.push(SEG([x, 0.8, 53.9], [x, 1.8, 53.9], 0.08));
  }
  // SIET letters (pink) at the front of the canopy, facing the plaza
  const font = new FontLoader().parse(FONT_DATA);
  let zc = 53.6;
  for (const ch of ['S', 'I', 'E', 'T']) {
    const geo = new TextGeometry(ch, { font, size: 2.3, depth: 0.42, curveSegments: 10, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.025, bevelSegments: 2 });
    geo.computeBoundingBox(); const bb = geo.boundingBox, w = bb.max.x - bb.min.x;
    geo.translate(-bb.min.x, 0, 0);
    const m = new THREE.Mesh(geo, MAT.pink); m.rotation.y = Math.PI / 2; m.position.set(86.2, 0.46, zc);
    m.castShadow = true; m.receiveShadow = true; Z.mesh(m);
    Z.box(MAT.edge, 85.95, 0.08, zc - w - 0.18, 86.9, 0.46, zc + 0.18);
    zc -= w + 0.95;
  }
  // faculty name wall at the north edge of the plaza (seen from the main road)
  Z.box(MAT.stone, 60, 0, 29.4, 74, 1.5, 30.2);
  Z.finish();

  // fountain jets: GPU particles on ballistic paths
  const pts = [];
  const NA = 20, PA = 46;
  for (let k = 0; k < NA; k++) {
    const a = (k / NA) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    const vh = 0.9, vv = 5.9, life = 1.34;
    for (let i = 0; i < PA; i++) {
      const j = (RNG() - 0.5) * 0.05;
      pts.push([FX + 1.95 * c, 1.22, FZ + 1.95 * s, c * (vh + j), vv + j, s * (vh + j), (i / PA) * life, life]);
    }
  }
  for (let k = 0; k < 9; k++) {
    const r = k < 3 ? 0.25 : 0.85, a = (k / (k < 3 ? 3 : 6)) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    const vv = k < 3 ? 8.6 : 7.2, life = (2 * vv) / 9.8 * 0.92;
    for (let i = 0; i < 64; i++) {
      pts.push([FX + r * c, 1.62, FZ + r * s, c * 0.18 + (RNG() - 0.5) * 0.05, vv + (RNG() - 0.5) * 0.15, s * 0.18 + (RNG() - 0.5) * 0.05, (i / 64) * life, life]);
    }
  }
  const g = new THREE.BufferGeometry();
  const o = new Float32Array(pts.length * 3), v = new Float32Array(pts.length * 3), ph = new Float32Array(pts.length), lf = new Float32Array(pts.length);
  pts.forEach((p, i) => { o.set(p.slice(0, 3), i * 3); v.set(p.slice(3, 6), i * 3); ph[i] = p[6]; lf[i] = p[7]; });
  g.setAttribute('position', new THREE.BufferAttribute(o, 3));
  g.setAttribute('aVel', new THREE.BufferAttribute(v, 3));
  g.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
  g.setAttribute('aLife', new THREE.BufferAttribute(lf, 1));
  const jetMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uTime: { value: 0 }, uScale: { value: 600 }, uGlow: { value: 0 } },
    vertexShader: `attribute vec3 aVel; attribute float aPhase; attribute float aLife; uniform float uTime; uniform float uScale; varying float vA;
      void main(){ float t = mod(uTime + aPhase, aLife); vec3 p = position + aVel * t + vec3(0.0, -4.9 * t * t, 0.0);
        vA = 1.0 - smoothstep(0.75, 1.0, t / aLife);
        vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = max(1.5, 0.12 * uScale / -mv.z); }`,
    fragmentShader: `uniform float uGlow; varying float vA; void main(){ vec2 c = gl_PointCoord - 0.5; float d = dot(c, c); if (d > 0.25) discard;
        vec3 col = mix(vec3(0.86, 0.94, 1.0), vec3(0.75, 0.9, 1.0) * 1.6, uGlow); gl_FragColor = vec4(col, (1.0 - d * 4.0) * 0.9 * vA); }`,
  });
  const jets = new THREE.Points(g, jetMat); jets.frustumCulled = false;
  site.add(jets);
  TICKERS.push(t => { jetMat.uniforms.uTime.value = t; jetMat.uniforms.uScale.value = renderer.domElement.height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))); });
  window.__jetMat = jetMat;
  register('plaza', 'ลานหน้าคณะ', 'ลานน้ำพุ · ตัวอักษร SIET', [
    'ลานปูหินลายข้าวหลามตัด อยู่ระหว่างหลังคาโครงเหล็กกับอาคารอิฐแดง', 'ตัวอักษร SIET สีชมพูตั้งอยู่หน้าบันไดทางเข้าใต้หลังคาโครงเหล็ก'], [108, 5, 42]);
}

// ---------------------------------------------------------------- red-brick front block (2 storeys)
{
  const F = new Builder('front');
  const X0 = 87, X1 = 119, Z0 = 59.2, Z1 = 84.5, W = Z0 + 0.4;
  F.box(MAT.brick, X0, 0, W, X1, 8.4, Z1, ['px', 'nx', 'pz', 'nz']);
  F.box(MAT.roof, X0, 0, W, X1, 8.4, Z1, ['py']);
  F.box(MAT.white, X0 - 0.4, 8.2, Z0 - 0.2, X1, 10.1, W + 0.4);
  F.box(MAT.white, X0 - 0.4, 8.2, W, X0 + 0.4, 10.1, Z1);
  F.box(MAT.white, X0 - 0.4, 0, Z0 - 0.2, X0 + 2.6, 8.2, W + 0.6);
  F.box(MAT.glassDark, X0 + 2.8, 0.1, Z0 + 0.3, X1 - 1.5, 3.3, W, ['nz']);
  for (let x = X0 + 4.8; x < X1 - 1.5; x += 3.6) {
    F.box(MAT.glassDark, x - 0.42, 4.7, Z0 + 0.28, x + 0.42, 7.9, W, ['nz', 'px', 'nx']);
    F.box(MAT.white, x - 0.6, 4.5, Z0 + 0.15, x + 0.6, 4.68, W);
  }
  F.box(MAT.canopyTop, X0 + 2.8, 3.55, Z0 - 2.9, X1 - 0.6, 3.78, W, ['py', 'nz', 'px', 'nx']);
  F.box(MAT.soffit, X0 + 2.8, 3.55, Z0 - 2.9, X1 - 0.6, 3.78, W, ['ny']);
  for (let x = X0 + 4; x < X1 - 0.6; x += 3.6) B_STEELD.push(SEG([x, 6.6, W], [x, 3.78, Z0 - 2.8], 0.05));
  F.box(MAT.white2, 94.5, 8.4, 64.5, 114.5, 10.2, 79.5, ['px', 'nx', 'pz', 'nz']);
  gable(F, MAT.metalRoof, 93.8, 115.2, 63.8, 80.2, 10.2, 12.6);
  for (let i = 0; i < 4; i++) F.mass(MAT.white2, MAT.roofDark, 89 + (i % 2) * 2.6, 8.4, 66 + i * 4, 91.2 + (i % 2) * 2.6, 9.8, 68.2 + i * 4);
  F.finish();
  register('front', 'อาคารอิฐแดง 2 ชั้น', 'สูงราว 10 ม. · 2 ชั้น', [
    'ผนังอิฐแดง หน้าต่างแนวตั้ง และแถบคานสีขาวด้านบน', 'กันสาดยาวตลอดแนวหน้าอาคารฝั่งลานน้ำพุ'], [104, 14, 70]);
}

// ---------------------------------------------------------------- 5-storey teaching & lab block (long balconies, logo cube)
{
  const M = new Builder('middle');
  const X0 = 40, X1 = 119, Z0 = 84.5, Z1 = 104, H = 19;
  M.box(MAT.fac_brick, X0, 0, Z0 + 2.1, X1, H, Z1, ['px', 'nx', 'pz', 'nz']);
  M.box(MAT.roof, X0, 0, Z0 + 2.1, X1, H, Z1, ['py']);
  for (let k = 1; k <= 5; k++) {
    const y = 3.8 * k;
    M.box(MAT.white, X0 + 0.3, y - 0.24, Z0, X1 - 0.3, y, Z0 + 2.1);
    if (k < 5) {
      M.box(MAT.white, X0 + 0.3, y, Z0, X1 - 0.3, y + 1.05, Z0 + 0.25);
      for (let x = X0 + 5; x < X1 - 4; x += 8.5) B_FLOWER.push(TRS(x + rand(-1, 1), y + 1.18, Z0 + 0.14, 0, 0, 0, 2.0, 0.28, 0.36));
      for (let x = X0 + 9; x < X1 - 4; x += 17) B_GREEN.push(TRS(x, y + 1.3, Z0 + 0.15, 0, 0, 0, 0.9, 0.35, 0.3), new THREE.Color().setHSL(0.3, 0.45, 0.3));
    }
  }
  for (let x = X0 + 0.3; x <= X1; x += 8.9) M.box(MAT.white, x, 0, Z0, x + 0.5, H, Z0 + 0.5);
  M.parapet(MAT.white, X0, Z0, X1, Z1, H, 1.2, 0.3);
  M.box(MAT.brickTan, 77, H, 87, 86, H + 6.2, 95);
  M.box(MAT.white2, 76.8, H + 6.2, 86.8, 86.2, H + 6.5, 95.2);
  const ringG = new THREE.PlaneGeometry(4.3, 4.3); ringG.rotateY(Math.PI); ringG.translate(81.5, H + 3.2, 86.97);
  const ringE = new THREE.PlaneGeometry(3.8, 3.8); ringE.rotateY(Math.PI / 2); ringE.translate(86.03, H + 3.2, 91);
  M.mesh(new THREE.Mesh(ringG, MAT.ring)); M.mesh(new THREE.Mesh(ringE, MAT.ring));
  M.mass(MAT.brick, MAT.roof, 52, H, 90, 58, H + 3.8, 96);
  M.mass(MAT.brick, MAT.roof, 100, H, 89, 106, H + 3.8, 95);
  M.finish();
  solarArray(41.5, 88, 51, 102.5, H); solarArray(59, 88, 76, 102.5, H); solarArray(87.5, 88, 99, 102.5, H); solarArray(107, 88, 117.5, 102.5, H);
  register('middle', 'อาคารเรียนและปฏิบัติการ 5 ชั้น', 'สูงราว 20 ม. · 5 ชั้น', [
    'ตามประวัติคณะ อาคาร 5 ชั้น พื้นที่ใช้สอย 8,410 ตร.ม. เปิดใช้ปี 2536',
    'ระเบียงยาวพร้อมกระบะดอกไม้ด้านทิศเหนือ บนหลังคามีกล่องอิฐติดตราคณะ', 'ใน Google Maps มีหมุด Maker Space IE.Tech อยู่ที่อาคารนี้'], [62, 25, 94]);
}

// ---------------------------------------------------------------- east wing on the driveway: 3 storeys by the plaza, 4 storeys further south
{
  const E = new Builder('east');
  const X0 = 119, X1 = 130.5, Z0 = 59, ZM = 80, Z1 = 112, H3 = 11.4, H4 = 15.2;
  const part = (z0, z1, H, n) => {
    E.box(MAT.fac_brick, X0, 0, z0, X1, H, z1, ['px', 'nx', 'pz', 'nz']);
    E.box(MAT.roof, X0, 0, z0, X1, H, z1, ['py']);
    for (let k = 1; k <= n; k++) {
      const y = 3.8 * k;
      E.box(MAT.white, X1, y - 0.5, z0 - 0.3, X1 + 0.35, y, z1);
      E.box(MAT.white, X0 - 0.35, y - 0.5, z0 - 0.3, X0, y, z1);
      E.box(MAT.white, X0, y - 0.5, z0 - 0.35, X1, y, z0);
    }
    for (let z = z0 + 1; z < z1 - 1; z += 1.2) E.box(MAT.metalRoof, X0 + 0.6, H, z, X1 - 0.6, H + 0.25, z + 0.6);
    E.box(MAT.white, X0, H, z0, X1, H + 1.1, z0 + 0.3); E.box(MAT.white, X0, H, z1 - 0.3, X1, H + 1.1, z1);
    E.box(MAT.white, X0, H, z0, X0 + 0.3, H + 1.1, z1); E.box(MAT.white, X1 - 0.3, H, z0, X1, H + 1.1, z1);
  };
  part(Z0, ZM, H3, 3); part(ZM, Z1, H4, 4);
  E.finish();
  register('east', 'ปีกอาคารฝั่งตะวันออก', '3–4 ชั้น', ['อาคารอิฐสลับแถบคานขาว ต่อจากปลายอาคารอิฐแดงไปตามถนนทางเข้าฝั่งตะวันออก'], [125, 18, 70]);
}

// ---------------------------------------------------------------- barrel-vault hall
{
  const V = new Builder('vault');
  const X0 = 72, X1 = 86.5, Z0 = 58, Z1 = 82, HW = 7.6, R = (X1 - X0) / 2, RISE = 3.3;
  V.box(MAT.fac_ribbon, X0, 0, Z0, X1, HW, Z1, ['px', 'nx', 'pz', 'nz']);
  const vg = new THREE.CylinderGeometry(R + 0.3, R + 0.3, Z1 - Z0 + 1, 32, 1, true, Math.PI / 2, Math.PI);
  vg.rotateX(Math.PI / 2); vg.scale(1, RISE / R, 1); vg.translate((X0 + X1) / 2, HW, (Z0 + Z1) / 2);
  V.add(MAT.vault, vg);
  for (const [z, rot] of [[Z0 - 0.45, Math.PI], [Z1 + 0.45, 0]]) {
    const cg = new THREE.CircleGeometry(R + 0.3, 32, 0, Math.PI); cg.scale(1, RISE / R, 1); cg.rotateY(rot); cg.translate((X0 + X1) / 2, HW, z);
    V.add(MAT.glassDS, cg);
  }
  V.finish();
  register('vault', 'อาคารหลังคาโค้ง', 'สูงราว 11 ม.', ['หลังคาโลหะทรงโค้ง อยู่ระหว่างปีกอาคารขั้นบันไดกับอาคารอิฐแดง'], [79, 14, 70]);
}
