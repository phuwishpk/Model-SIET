// ================================================================ buildings behind (south of) the front group
// courtyard building: 3 storeys of white bands, 5-storey brick stair towers at the west end
{
  const C = new Builder('courtyard');
  const H = 11.4;
  const wing = (x0, z0, x1, z1) => C.mass(MAT.fac_brick, MAT.roof, x0, 0, z0, x1, H, z1);
  wing(40, 104, 75, 108.5); wing(40, 117, 75, 133); wing(40, 108.5, 54, 117); wing(69, 108.5, 75, 117);
  C.parapet(MAT.white, 40, 104, 75, 133, H, 1.2, 0.3);
  C.parapet(MAT.white, 54, 108.5, 69, 117, H, 1.1, 0.25);
  for (let k = 1; k <= 3; k++) C.box(MAT.white, 39.7, 3.8 * k - 0.4, 103.7, 75.3, 3.8 * k, 133.3, ['px', 'nx', 'pz', 'nz', 'ny']);
  for (const [x0, z0] of [[39.6, 104], [39.6, 128.4]]) {
    C.mass(MAT.brick, MAT.roof, x0, 0, z0, x0 + 4.6, 19, z0 + 4.6);
    for (let k = 1; k <= 4; k++) C.box(MAT.white, x0 - 0.2, 3.8 * k + 3.2, z0 - 0.2, x0 + 4.8, 3.8 * k + 3.8, z0 + 4.8);
  }
  C.box(MAT.paving, 54, 0, 108.5, 69, 0.1, 117, ['py']);
  C.finish();
  solarArray(44.5, 105, 74, 108, H); solarArray(44.5, 118, 74, 132, H); solarArray(41, 109, 53, 116.5, H);
  register('courtyard', 'อาคารคอร์ตกลาง', 'สูงราว 12 ม. · 3 ชั้น', ['อาคารล้อมคอร์ตต้นไม้ มีหอบันไดอิฐ 5 ชั้นที่มุมฝั่งซอย', 'ใน Google Maps มีหมุด IETECH PHOTO อยู่ที่อาคารนี้'], [57, 16, 125]);
}
// garden east of the courtyard building
// อาคารปฏิบัติการพิเศษจอมไตร: 6-storey main block with roof frame + 4-storey west block
{
  const J = new Builder('jomtrai');
  const H6 = 22.8, H4 = 15.2;
  J.mass(MAT.fac_brick, MAT.roof, 106, 0, 104, 127, H6, 151);
  J.parapet(MAT.white, 106, 104, 127, 151, H6, 1.2, 0.3);
  for (let k = 1; k <= 6; k++) J.box(MAT.white, 105.7, 3.8 * k - 0.45, 103.7, 127.3, 3.8 * k, 151.3, ['px', 'nx', 'pz', 'nz', 'ny']);
  J.mass(MAT.fac_ribbon, MAT.roof, 88, 0, 104, 106, H4, 151);
  J.parapet(MAT.white, 88, 104, 106, 151, H4, 1.1, 0.3);
  // white frame grid over the roof of the main block
  for (let x = 107.5; x <= 125.6; x += 4.5) J.box(MAT.white, x, H6 + 2.2, 105.5, x + 0.3, H6 + 2.6, 149.5);
  for (let z = 105.5; z <= 149.6; z += 4.4) J.box(MAT.white, 107.5, H6 + 2.6, z, 125.9, H6 + 2.9, z + 0.3);
  for (const [x, z] of [[107.5, 105.5], [125.6, 105.5], [107.5, 149.2], [125.6, 149.2], [116.5, 127.5]]) J.box(MAT.white, x, H6, z, x + 0.35, H6 + 2.6, z + 0.35);
  // brick entrance portico on the north side
  J.mass(MAT.brick, MAT.roof, 110, 0, 100.5, 118, 7.2, 104);
  J.box(MAT.white, 109.7, 7.2, 100.2, 118.3, 8.0, 104);
  J.finish();
  solarArray(107.5, 106, 125.5, 149.5, H6); solarArray(89.5, 105.5, 104.5, 149.5, H4);
  register('jomtrai', 'อาคารปฏิบัติการพิเศษจอมไตร', '6 ชั้น · พื้นที่ใช้สอย 10,400 ตร.ม.', [
    'อาคารเรียนและปฏิบัติงานหลังที่ 2 ของคณะ ได้รับพระราชทานชื่อเมื่อปี 2544',
    'ใน Google Maps มีหมุดสำนักงานคณบดีคณะศิลปศาสตร์อยู่ในอาคารนี้ด้วย'], [116, 29, 128]);
}
// long north-south block with bleachers facing the sports field
{
  const L = new Builder('long');
  const H = 19;
  L.mass(MAT.fac_ribbon, MAT.roof, 73, 0, 136, 87.5, H, 196);
  L.parapet(MAT.white, 73, 136, 87.5, 196, H, 1.1, 0.3);
  for (let k = 1; k <= 5; k++) L.box(MAT.white, 72.7, 3.8 * k - 0.4, 135.7, 87.8, 3.8 * k, 196.3, ['px', 'nx', 'pz', 'nz', 'ny']);
  for (const z0 of [138, 190]) {
    L.mass(MAT.brick, MAT.roof, 76, H, z0, 84.5, H + 3.6, z0 + 5);
    L.box(MAT.white, 75.8, H + 1.2, z0 - 0.2, 84.7, H + 1.7, z0 + 5.2);
  }
  for (let i = 0; i < 3; i++) L.box(MAT.granite, 87.5, 0, 152, 90.5 - i * 1.0, 0.45 * (i + 1), 194);
  for (let i = 0; i < 5; i++) L.box(MAT.granite, 73, 0, 196 + i * 0.6, 90, 0.9 - i * 0.18, 196.6 + i * 0.6);
  L.finish();
  solarArray(74.5, 144, 86, 188, H);
  register('long', 'อาคารยาว 5 ชั้น', 'สูงราว 20 ม. · 5 ชั้น', ['อาคารแนวเหนือ–ใต้ระหว่างโรงอาหารกับลานกีฬา', 'มีขั้นอัฒจันทร์หันไปทางลานกีฬา'], [80, 25, 166]);
}
// multipurpose sports field (2545)
{
  const S = new Builder('court');
  const tex = canvasTex(1024, 1024, (g, w, h) => {
    noiseFill(g, w, h, '#a4a6a4', 0.08, 6000, 3);
    g.strokeStyle = '#f2f2ee'; g.lineWidth = 5;
    const sx = w / 37, sy = h / 44;
    const court = (cx, cy) => {
      const W = 15 * sx, L = 28 * sy;
      g.save(); g.translate(cx, cy);
      g.strokeRect(-W / 2, -L / 2, W, L);
      g.beginPath(); g.moveTo(-W / 2, 0); g.lineTo(W / 2, 0); g.stroke();
      g.beginPath(); g.arc(0, 0, 1.8 * sx, 0, Math.PI * 2); g.stroke();
      for (const sgn of [-1, 1]) {
        g.strokeRect(-2.45 * sx, sgn > 0 ? L / 2 - 5.8 * sy : -L / 2, 4.9 * sx, 5.8 * sy);
        g.beginPath(); g.arc(0, sgn * (L / 2 - 1.6 * sy), 6.75 * sx, sgn > 0 ? Math.PI * 1.08 : 0.08 * Math.PI, sgn > 0 ? Math.PI * 1.92 : Math.PI * 0.92); g.stroke();
      }
      g.restore();
    };
    court(w * 0.27, h * 0.5); court(w * 0.73, h * 0.5);
    g.strokeStyle = '#e9c64e'; g.lineWidth = 4; g.strokeRect(w * 0.05, h * 0.06, w * 0.9, h * 0.88);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(37, 44), std(0xffffff, 0.92, 0, { map: tex }));
  m.rotation.x = -Math.PI / 2; m.position.set(109, 0.1, 174.5); m.receiveShadow = true;
  S.mesh(m);
  S.box(MAT.curb, 90.5, 0, 152, 127.5, 0.16, 152.6); S.box(MAT.curb, 90.5, 0, 196.4, 127.5, 0.16, 197);
  for (let i = 0; i < 3; i++) S.box(MAT.granite, 127.5 + i * 1.0, 0, 154, 131, 0.45 * (i + 1), 195);
  S.finish(site, { cast: false });
  register('court', 'ลานกีฬาอเนกประสงค์', 'ลานคอนกรีตกลางแจ้ง', ['สร้างพร้อมการปรับภูมิทัศน์หน้าคณะเมื่อปี 2545', 'มีขั้นอัฒจันทร์สองฝั่ง'], [109, 4, 174]);
}
// cafeteria: big brown hip roof (the X seen from above) with a gablet, plus a flat-roof wing
{
  const F = new Builder('cafeteria');
  const H = 7.6, HF = 8.0;
  F.mass(MAT.fac_brick, MAT.roof, 41, 0, 140, 50, HF, 166);
  F.parapet(MAT.white, 41, 140, 50, 166, HF, 1.0, 0.3);
  F.box(MAT.white2, 50, 0, 140.5, 73, H, 165.5, ['px', 'nx', 'pz', 'nz']);
  F.box(MAT.glassDark, 50.6, 0.1, 140.4, 72.4, 3.4, 140.5, ['nz']);
  F.box(MAT.glassDark, 50.6, 0.1, 165.5, 72.4, 3.4, 165.6, ['pz']);
  const x0 = 49.3, x1 = 73.7, z0 = 139.6, z1 = 166.4, ap = [61.5, H + 5.6, 153];
  const e = [[x0, H, z0], [x1, H, z0], [x1, H, z1], [x0, H, z1]];
  F.poly(MAT.hip, [e[0], e[1], ap], [0, 1, -1]); F.poly(MAT.hip, [e[1], e[2], ap], [1, 1, 0]);
  F.poly(MAT.hip, [e[2], e[3], ap], [0, 1, 1]); F.poly(MAT.hip, [e[3], e[0], ap], [-1, 1, 0]);
  F.box(MAT.white, x0, H - 0.45, z0, x1, H, z1, ['ny', 'px', 'nx', 'pz', 'nz']);
  // gablet (small gable vent) at the apex
  F.box(MAT.white2, ap[0] - 2.2, ap[1] - 1.4, ap[2] - 0.6, ap[0] + 2.2, ap[1] - 0.2, ap[2] + 0.6);
  gable(F, MAT.hip, ap[0] - 2.6, ap[0] + 2.6, ap[2] - 1.2, ap[2] + 1.2, ap[1] - 0.2, ap[1] + 0.9, MAT.white2);
  F.finish();
  for (const c of e) B_COL.push(SEG([c[0], c[1] + 0.12, c[2]], [ap[0], ap[1] + 0.12, ap[2]], 0.16));
  for (const [dx, dz] of [[0, -8], [0, 8], [-7, 0], [7, 0]]) {
    const x = ap[0] + dx, z = ap[2] + dz, k = 1 - (Math.abs(dx) / 12.2 + Math.abs(dz) / 13.4);
    B_PLANTER.push(TRS(x, H + 5.6 * k + 0.3, z, 0, dx ? Math.PI / 2 : 0, 0, 2.4, 0.35, 0.45));
  }
  solarArray(41.8, 141, 49.2, 165, HF);
  register('cafeteria', 'โรงอาหาร คณะครุศาสตร์ฯ', '2 ชั้น · หลังคาทรงปั้นหยา', ['หลังคาสีน้ำตาลมีสันหลังคาสีขาว เป็นรูปตัว X เมื่อมองจากด้านบน', 'ชั้นล่างเปิดโล่ง ฝั่งตะวันตกเป็นปีกหลังคาเรียบติดแผงโซลาร์'], [61.5, 17, 153]);
}
// student club with the basketball court on its roof, and the yellow building
{
  const G = new Builder('club');
  const H = 7.8;
  G.mass(MAT.fac_ribbon, MAT.roof, 47, 0, 172, 64, H, 186);
  const tex = canvasTex(512, 420, (g, w, h) => {
    g.fillStyle = '#d98a5a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#e8b04f'; g.fillRect(w * 0.07, h * 0.08, w * 0.86, h * 0.84);
    g.fillStyle = '#8a5a9a'; g.fillRect(0, h * 0.36, w * 0.17, h * 0.28); g.fillRect(w * 0.83, h * 0.36, w * 0.17, h * 0.28);
    g.strokeStyle = '#ffffff'; g.lineWidth = 4;
    g.strokeRect(w * 0.07, h * 0.08, w * 0.86, h * 0.84);
    g.beginPath(); g.moveTo(w / 2, h * 0.08); g.lineTo(w / 2, h * 0.92); g.stroke();
    g.beginPath(); g.arc(w / 2, h / 2, h * 0.11, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(w * 0.07, h / 2, h * 0.32, -Math.PI / 2, Math.PI / 2); g.stroke();
    g.beginPath(); g.arc(w * 0.93, h / 2, h * 0.32, Math.PI / 2, Math.PI * 1.5); g.stroke();
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(16.4, 13.4), std(0xffffff, 0.8, 0, { map: tex }));
  m.rotation.x = -Math.PI / 2; m.position.set(55.5, H + 0.04, 179); m.receiveShadow = true;
  G.mesh(m);
  G.parapet(MAT.white, 47, 172, 64, 186, H, 1.0, 0.25);
  G.finish();
  for (const [a, b] of [[[47.2, 172.2], [63.8, 172.2]], [[47.2, 185.8], [63.8, 185.8]], [[47.2, 172.2], [47.2, 185.8]], [[63.8, 172.2], [63.8, 185.8]]]) {
    B_STEELD.push(SEG([a[0], H + 3.2, a[1]], [b[0], H + 3.2, b[1]], 0.05));
    const n = Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3);
    for (let i = 0; i <= n; i++) { const t = i / n; B_STEELD.push(SEG([a[0] + (b[0] - a[0]) * t, H, a[1] + (b[1] - a[1]) * t], [a[0] + (b[0] - a[0]) * t, H + 3.2, a[1] + (b[1] - a[1]) * t], 0.05)); }
  }
  register('club', 'สโมสรนักศึกษา คณะครุศาสตร์ฯ', '2 ชั้น · สนามบาสบนหลังคา', ['หลังคาทาสีเป็นสนามบาสเกตบอล'], [55.5, 13.5, 179]);

  const Y = new Builder('yellow');
  Y.mass(MAT.fac_yellow, MAT.roof, 47, 0, 186.2, 64, 7.2, 194);
  Y.parapet(MAT.white, 47, 186.2, 64, 194, 7.2, 0.9, 0.25);
  Y.finish();
  solarArray(48, 187, 63, 193.5, 7.2);

  const K = new Builder('kiosk');
  K.mass(MAT.white2, MAT.roofDark, 44, 0, 133.5, 72, 3.6, 139.5);
  K.box(MAT.green, 47, 0, 166.5, 64, 0.9, 171.5);
  K.finish();
}
