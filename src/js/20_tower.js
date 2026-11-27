// ================================================================ อาคารนวัตกรรมการเรียนรู้ (11F), steel lattice, entrance canopy, podium
// plan coordinates measured from Google satellite imagery (0.145 m/px mosaic), metres; x = east, z = south
const INFO = {};
const LABELS = [];
function register(id, name, meta, lines, labelPos, view) { INFO[id] = { name, meta, lines, view }; if (labelPos) LABELS.push({ id, name, pos: labelPos }); }

const TW = { X0: 31.5, ZN: 21, ZS: 52, NE: [50.5, 21], SE: [56, 52], PL: 1.2, G: 6.0, FH: 3.8, NF: 10, LEAN: 0.3 };
TW.ROOF = TW.G + TW.NF * TW.FH; // 44.0
const eastX = z => TW.NE[0] + (z - TW.NE[1]) * (TW.SE[0] - TW.NE[0]) / (TW.SE[1] - TW.NE[1]); // x of the angled east face at z

// sawtooth "shingle" facade: angled white blades with slit windows, each storey leaning out
// face 'w': wall at x = wall (outward -x), runs along z;  face 'n': wall at z = wall (outward -z), runs along x
// lean: extra outward offset per storey (cumulative), used on the north face that cantilevers toward the road
function sawtooth(B, face, wall, t0, t1, nb, floors, { pB = 0.28, pT = 0.85, g = 0.34, slab = 1.05, lean = 0, flip = false } = {}) {
  const b = (t1 - t0) / nb;
  floors.forEach(([y0f, y1f], fi) => {
    const w = wall - lean * (fi + 1);
    const P3 = (t, y, n) => face === 'w' ? [w - n, y, t] : [t, y, w - n];
    const hintS = face === 'w' ? [-1, 0, -0.4] : [-0.4, 0, -1];
    const hintG = face === 'w' ? [-0.6, 0, 1] : [1, 0, -0.6];
    const y0 = y0f, y1 = y1f - 0.22;
    for (let j = 0; j < nb; j++) {
      const a = t0 + j * b, c = a + b;
      if (!flip) {
        B.poly(MAT.white, [P3(a, y0, 0), P3(c - g, y0, pB), P3(c - g, y1, pT), P3(a, y1, 0)], hintS);
        B.poly(MAT.glassDark, [P3(c - g, y0, pB), P3(c, y0, 0), P3(c, y1, 0), P3(c - g, y1, pT)], hintG);
      } else { // slit glazing faces the start of the run, white blades face the end
        const hS = face === 'w' ? [-1, 0, 0.4] : [0.4, 0, -1], hG = face === 'w' ? [-0.6, 0, -1] : [-1, 0, -0.6];
        B.poly(MAT.glassDark, [P3(a, y0, 0), P3(a + g, y0, pB), P3(a + g, y1, pT), P3(a, y1, 0)], hG);
        B.poly(MAT.white, [P3(a + g, y0, pB), P3(c, y0, 0), P3(c, y1, 0), P3(a + g, y1, pT)], hS);
      }
    }
    const y = y1f;
    if (face === 'w') {
      B.box(MAT.white, w - slab, y - 0.22, t0 - (slab - 0.9), w, y, t1);
      B.box(MAT.edge, w - slab - 0.05, y - 0.3, t0 - (slab - 0.9), w - slab, y + 0.02, t1);
    } else {
      B.box(MAT.white, t0, y - 0.22, w - slab, t1, y, wall + 0.3);
      B.box(MAT.edge, t0, y - 0.3, w - slab - 0.05, t1, y + 0.02, w - slab);
    }
  });
  if (face === 'w') { const y = floors[0][0]; B.box(MAT.white, wall - slab, y - 0.22, t0 - (slab - 0.9), wall, y, t1); }
  else { const y = floors[0][0]; B.box(MAT.white, t0, y - 0.22, wall - slab, t1, y, wall + 0.3); }
}

{
  const { X0, ZN, ZS, NE, SE, PL, G, FH, NF, ROOF, LEAN } = TW;
  const T = new Builder('tower');
  const floors = []; for (let f = 0; f < NF; f++) floors.push([G + f * FH, G + (f + 1) * FH]);
  const ZW = ZN + 3.0; // north wall of the core (ground floor line); upper storeys step out toward the road
  // plinth / entrance deck under the tower and canopy
  T.poly(MAT.granite, [[X0 - 1.2, PL, ZN + 1.5], [eastX(ZN) + 7, PL, ZN + 1.5], [eastX(ZS) + 7.5, PL, ZS + 3], [X0 - 1.2, PL, ZS + 3]], [0, 1, 0]);
  T.box(MAT.granite, X0 - 1.2, 0, ZN + 1.5, X0 - 1.0, PL, ZS + 3);
  // core (angled east face)
  const c0 = [X0 + 0.9, ZW], c1 = [eastX(ZW) - 0.6, ZW], c2 = [eastX(ZS) - 0.6, ZS], c3 = [X0 + 0.9, ZS];
  const wall = (a, b, y0, y1, mat, hint) => T.poly(mat, [[a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]], hint);
  wall(c0, c1, G, ROOF, MAT.fac_tower, [0, 0, -1]); wall(c1, c2, G, ROOF, MAT.fac_tower, [1, 0, -0.18]);
  wall(c2, c3, G, ROOF, MAT.fac_tower, [0, 0, 1]); wall(c3, c0, G, ROOF, MAT.fac_tower, [-1, 0, 0]);
  T.poly(MAT.white, [[c0[0], G, c0[1]], [c1[0], G, c1[1]], [c2[0], G, c2[1]], [c3[0], G, c3[1]]], [0, -1, 0]);
  // top floor plate projects to the satellite roof outline (north edge at ZN)
  T.poly(MAT.roof, [[X0, ROOF, ZN], [eastX(ZN), ROOF, ZN], [eastX(ZS), ROOF, ZS], [X0, ROOF, ZS]], [0, 1, 0]);
  // ground floor: recessed glazing, perimeter columns
  const g0 = [X0 + 2.4, ZW + 1.6], g1 = [eastX(ZW) - 3.0, ZW + 1.6], g2 = [eastX(ZS) - 3.0, ZS - 0.2], g3 = [X0 + 2.4, ZS - 0.2];
  wall(g0, g1, PL, G, MAT.glassDark, [0, 0, -1]); wall(g1, g2, PL, G, MAT.glassDark, [1, 0, -0.18]); wall(g3, g0, PL, G, MAT.glassDark, [-1, 0, 0]);
  for (const z of [ZW + 1, 31, 38, 45]) B_COL.push(TRS(eastX(z) - 1.4, (PL + G) / 2, z, 0, 0, 0, 0.42, G - PL, 0.42));
  for (const x of [X0 + 1.3, 38.5, 45]) B_COL.push(TRS(x, (PL + G) / 2, ZW + 0.9, 0, 0, 0, 0.42, G - PL, 0.42));
  for (const z of [30, 38, 46]) B_COL.push(TRS(X0 + 1.1, (PL + G) / 2, z, 0, 0, 0, 0.42, G - PL, 0.42));
  // west and north shingled facades (north one leans out over the sidewalk, ~3 m at the top)
  sawtooth(T, 'w', X0 + 0.9, ZW, ZS - 1.6, 22, floors, { g: 0.26, pB: 0.22, pT: 0.7 });
  sawtooth(T, 'n', ZW, X0 - 0.1, eastX(ZN) - 2.6, 14, floors, { lean: LEAN, g: 0.26, pB: 0.22, pT: 0.7 });
  // vertical white blades: NE corner (leaning with the facade), south end of west face, glass/white divider on east face
  for (let f = 0; f < NF; f++) {
    const y0 = G + f * FH, y1 = y0 + FH, zf = ZW - LEAN * (f + 1);
    T.box(MAT.white, eastX(ZN) - 2.6, y0, zf - 0.45, eastX(ZN) + 0.45, y1, ZW + 1.6);
  }
  T.box(MAT.white, eastX(ZN) - 2.6, PL, ZW - 0.2, eastX(ZN) + 0.45, G, ZW + 1.6);
  T.box(MAT.white, X0 - 1.35, 0, ZS - 1.6, X0 + 1.3, ROOF + 1.5, ZS + 0.2);
  const zDiv = 39.5;
  T.seg(MAT.white, [eastX(zDiv - 0.4), zDiv - 0.4], [eastX(zDiv + 0.4), zDiv + 0.4], G, ROOF + 1.2, -0.6, 1.6);
  // east face, north part: glass curtain wall with mullions and floor bands
  const a = [eastX(ZN + 1.6), ZN + 1.6], bq = [eastX(zDiv - 0.4), zDiv - 0.4];
  T.seg(MAT.glass, a, bq, G, ROOF, -0.6, -0.3, false);
  const nM = Math.round((zDiv - ZN - 2) / 1.55);
  for (let i = 1; i < nM; i++) { const z = ZN + 1.6 + i * (zDiv - 0.4 - ZN - 1.6) / nM; T.seg(MAT.steel, [eastX(z - 0.06), z - 0.06], [eastX(z + 0.06), z + 0.06], G, ROOF, -0.3, -0.12); }
  for (let f = 0; f <= NF; f++) { const y = G + f * FH; T.seg(MAT.white, a, bq, y - 0.55, y + 0.1, -0.6, 0.35); }
  T.seg(MAT.white, [eastX(24), 24], [eastX(37), 37], 13.75, 14.05, 0, 2.3);                      // balcony (3rd floor)
  T.seg(MAT.glassRail, [eastX(24), 24], [eastX(37), 37], 14.05, 15.15, 2.15, 2.25);
  T.seg(MAT.blue, [eastX(27), 27], [eastX(34), 34], 14.2, 15.0, 2.26, 2.32);
  // east face, south part: white wall with deep balconies
  const s0 = [eastX(zDiv + 0.4), zDiv + 0.4], s1 = [eastX(ZS - 0.2), ZS - 0.2];
  for (let f = 0; f <= NF; f++) {
    const y = G + f * FH;
    T.seg(MAT.white, s0, s1, y - 0.22, y, -0.6, 1.3);
    if (f < NF && f % 2 === 1) T.seg(MAT.white, s0, s1, y, y + 1.0, 1.0, 1.3);
  }
  // roof: parapet, pergola grid, terrace benches, lift core
  T.box(MAT.white, X0, ROOF, ZN, eastX(ZN), ROOF + 1.25, ZN + 0.3);
  T.box(MAT.white, X0, ROOF, ZS - 0.3, eastX(ZS), ROOF + 1.25, ZS);
  T.box(MAT.white, X0, ROOF, ZN, X0 + 0.3, ROOF + 1.25, ZS);
  T.seg(MAT.white, [eastX(ZN), ZN], [eastX(ZS), ZS], ROOF, ROOF + 1.25, -0.3, 0, true);
  for (let x = X0 + 2; x <= 44; x += 1.1) T.box(MAT.white2, x, ROOF + 3.0, ZN + 2, x + 0.18, ROOF + 3.25, 34);
  for (let z = ZN + 2; z <= 34; z += 2.2) T.box(MAT.white2, X0 + 1.6, ROOF + 3.25, z, 44.2, ROOF + 3.45, z + 0.18);
  for (const [x, z] of [[X0 + 1.7, ZN + 2], [44, ZN + 2], [X0 + 1.7, 34], [44, 34]]) T.box(MAT.white2, x, ROOF, z, x + 0.3, ROOF + 3.25, z + 0.3);
  for (let i = 0; i < 5; i++) T.mass(MAT.white2, MAT.roofDark, X0 + 2 + i * 2.2, ROOF, 36.5, X0 + 3.2 + i * 2.2, ROOF + 0.8, 50);
  T.mass(MAT.white, MAT.roof, 45, ROOF, 39, eastX(45) - 1.5, ROOF + 3.6, 51);
  T.finish();

  // ------------------------------------------------ steel lattice: vertical above the roof, sweeping down to the canopy's east edge
  const LZ = [23, 30, 37, 44, 51], XE = 88.5, YB = 14.6, NSEG = 11;
  const profFor = z => {
    const xT = eastX(z) + 1.2, a = XE - xT, b = ROOF - YB;
    const pr = [[xT, 51.5], [xT, (51.5 + ROOF) / 2]];
    for (let s = 0; s <= NSEG; s++) { const t = (s / NSEG) * Math.PI / 2; pr.push([XE - a * Math.cos(t), ROOF - b * Math.sin(t)]); }
    return pr;
  };
  const PR = LZ.map(profFor);
  const NP = PR[0].length;
  for (let k = 0; k < LZ.length; k++) for (let s = 0; s < NP - 1; s++)
    B_STEEL.push(SEG([PR[k][s][0], PR[k][s][1], LZ[k]], [PR[k][s + 1][0], PR[k][s + 1][1], LZ[k]], 0.3));
  for (let s = 0; s < NP; s++) for (let k = 0; k < LZ.length - 1; k++)
    B_STEEL.push(SEG([PR[k][s][0], PR[k][s][1], LZ[k]], [PR[k + 1][s][0], PR[k + 1][s][1], LZ[k + 1]], s === 0 ? 0.32 : 0.2));
  for (let s = 0; s < NP - 1; s++) for (let k = 0; k < LZ.length - 1; k++) {
    B_STEEL.push(SEG([PR[k][s][0], PR[k][s][1], LZ[k]], [PR[k + 1][s + 1][0], PR[k + 1][s + 1][1], LZ[k + 1]], 0.13));
    B_STEEL.push(SEG([PR[k + 1][s][0], PR[k + 1][s][1], LZ[k + 1]], [PR[k][s + 1][0], PR[k][s + 1][1], LZ[k]], 0.13));
  }
  for (const z of LZ) for (const y of [ROOF, 38]) B_STEELD.push(SEG([eastX(z) + 0.1, y, z], [eastX(z) + 1.1, y, z], 0.14));

  // ------------------------------------------------ entrance canopy on tree columns, stairs
  const E = new Builder('tower');
  for (const cv of [[[eastX(ZN), ZN], [XE + 0.6, ZN], [XE + 0.6, 50], [eastX(50), 50]], [[66.2, 50], [XE + 0.6, 50], [XE + 0.6, 57], [66.2, 57]]]) {
    E.poly(MAT.canopyTop, cv.map(([x, z]) => [x, 14.4, z]), [0, 1, 0]);
    E.poly(MAT.soffit, cv.map(([x, z]) => [x, 13.7, z]), [0, -1, 0]);
  }
  E.box(MAT.edge, XE + 0.6, 13.65, ZN, XE + 0.85, 14.5, 57);
  E.box(MAT.soffit, eastX(ZN) + 1, 13.7, ZN - 0.25, XE + 0.6, 14.4, ZN);
  E.box(MAT.soffit, 66.2, 13.7, 57, XE + 0.6, 14.4, 57.25);
  E.box(MAT.soffit, 66, 13.7, 50, 66.2, 14.4, 57);
  for (const x of [66.5, 81.5]) for (const z of [24.5, 31.5, 38.5, 45.5, 52.5]) {
    B_COL.push(TRS(x, 5.6, z, 0, 0, 0, 0.6, 11.2, 0.6));
    for (const [dx, dz] of [[2.6, 2.6], [-2.6, 2.6], [2.6, -2.6], [-2.6, -2.6], [0, 3.2], [0, -3.2]]) B_STEELD.push(SEG([x, 11.0, z], [x + dx, 13.7, z + dz], 0.13));
  }
  const SX = 59.5, SZ0 = ZN + 1.5, SZ1 = 49.4;
  E.poly(MAT.granite, [[eastX(SZ0), PL, SZ0], [SX, PL, SZ0], [SX, PL, SZ1], [eastX(SZ1), PL, SZ1]], [0, 1, 0]);
  E.box(MAT.granite, eastX(SZ0) - 1, 0, SZ0, SX, PL, SZ0 + 0.2, ['nz']);
  for (let i = 0; i < 8; i++) E.box(MAT.granite, SX + i, 0, SZ0, SX + i + 1, PL * (8 - i) / 9, SZ1);
  E.box(MAT.granite, SX - 0.5, 0, SZ1, SX + 8, PL + 0.5, SZ1 + 0.6);
  E.finish();

  // ------------------------------------------------ podium south of the tower: 6F wing, 3F roof-garden block, stepped terraces
  const Pd = new Builder('podium');
  const PH1 = G + 5 * FH; // 25.0
  const P1z = [ZS, 58];
  Pd.box(MAT.granite, X0 - 1.2, 0, P1z[0], 52.5, PL, P1z[1]);
  Pd.box(MAT.fac_ribbon, X0 + 0.9, PL, P1z[0], 52.5, PH1, P1z[1], ['px', 'pz']);
  Pd.box(MAT.roof, X0 + 0.9, PL, P1z[0], 52.5, PH1, P1z[1], ['py']);
  Pd.box(MAT.white, X0 + 0.9, PL, P1z[0], 52.5, PH1, P1z[1], ['nx']);
  const pFloors = []; for (let f = 0; f < 5; f++) pFloors.push([G + f * FH, G + (f + 1) * FH]);
  sawtooth(Pd, 'w', X0 + 0.9, P1z[0] + 0.2, P1z[1], 5, pFloors, { g: 0.26, pB: 0.22, pT: 0.7 });
  Pd.box(MAT.glassDark, X0 + 0.8, PL, P1z[0] + 0.2, X0 + 0.95, G - 0.25, P1z[1], ['nx']);
  Pd.parapet(MAT.white, X0 - 0.25, P1z[0], 52.5, P1z[1], PH1, 1.1, 0.3);
  shrubRow(X0 + 1.5, P1z[1] - 1.2, 51, P1z[1] - 1.2, PH1, 2.0, 0.8);
  const PH2 = 4.5 + 2 * FH; // 12.1, three storeys with a roof garden
  Pd.mass(MAT.fac_ribbon, MAT.roof, X0, 0, 58, 52.5, PH2, 73);
  Pd.parapet(MAT.white, X0, 58, 52.5, 73, PH2, 1.1, 0.3);
  shrubRow(X0 + 1.5, 71.6, 51.5, 71.6, PH2, 2.3, 0.85);
  Pd.mass(MAT.fac_ribbon, MAT.roof, X0 + 1.5, 0, 73, 55, 8.3, 76.5);
  Pd.parapet(MAT.white, X0 + 1.5, 73, 55, 76.5, 8.3, 1.0, 0.25);
  const steps = [[52.5, 56, PH1 - 3.8], [56, 59.2, PH1 - 7.6], [59.2, 62.6, PH1 - 11.4], [62.6, 66, PH1 - 15.2]];
  for (const [xa, xb, h] of steps) {
    Pd.mass(MAT.fac_ribbon, MAT.roof, xa, 0, 50, xb, h, 77);
    Pd.box(MAT.white, xb - 0.3, h, 50, xb, h + 1.05, 77);
    Pd.box(MAT.white, xa, h, 76.7, xb, h + 1.05, 77);
    shrubRow(xb - 0.9, 51.5, xb - 0.9, 75.5, h, 2.0, 0.8);
  }
  Pd.finish();

  register('tower', 'อาคารนวัตกรรมการเรียนรู้', '11 ชั้น · สูงราว 45 ม. · เปิดใช้ปี 2567', [
    'อาคารเรียนรวมและปฏิบัติการของคณะ สร้างด้วยงบปี 2560 เสร็จปี 2563',
    'โครงเหล็กถักโค้งจากหลังคาลงมาเป็นหลังคาทางเข้า ด้านถนนเป็นครีบเฉียงที่ยื่นออกทีละชั้น',
    'ใน Google Maps มีหมุด Maker space SIET และห้องประชุมรูปทรงไข่อยู่ที่อาคารนี้'], [43, ROOF + 7, 36]);
  register('podium', 'ปีกอาคารขั้นบันได', '2–6 ชั้น · ดาดฟ้าสวน', [
    'ต่อจากด้านใต้ของอาคารนวัตกรรมการเรียนรู้', 'ลดหลั่นเป็นดาดฟ้าปลูกต้นไม้ลงไปทางทิศตะวันออก'], [45, PH1 + 3, 63]);
}
