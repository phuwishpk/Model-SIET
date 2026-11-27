// ================================================================ trees, cars, pedestrian bridge, street lights
const B_TRUNK = new Inst(GEO.cyl6, std(0x6e5c4a, 0.9));
function tree(x, z, h = 9, r = 4.5, kind = 'round', base = 0) {
  const tw = Math.max(0.16, 0.24 * h / 9);
  B_TRUNK.push(TRS(x, base + h * 0.32, z, 0, 0, 0, tw, h * 0.64, tw));
  const col = new THREE.Color().setHSL(rand(0.22, 0.3), rand(0.4, 0.56), rand(0.22, 0.31));
  if (kind === 'rain') {
    for (let i = 0; i < 4; i++) {
      const a = RNG() * 6.28, d = r * (i ? 0.42 : 0);
      B_GREEN.push(TRS(x + Math.cos(a) * d, base + h * 0.8 + rand(-0.5, 0.4), z + Math.sin(a) * d, 0, RNG() * 6, 0, r * rand(0.62, 0.8), r * 0.4, r * rand(0.62, 0.8)), col);
    }
  } else {
    B_GREEN.push(TRS(x, base + h * 0.68, z, 0, RNG() * 6, 0, r, r * rand(0.85, 1.05), r), col);
    B_GREEN.push(TRS(x + rand(-1, 1), base + h * 0.68 + r * 0.45, z + rand(-1, 1), 0, RNG() * 6, 0, r * 0.62, r * 0.55, r * 0.62), col.clone().offsetHSL(0, 0, 0.04));
  }
}
// rain trees along Chalong Krung road in front of the lattice and the plaza
for (let x = 55; x <= 128; x += 9.5) tree(x + rand(-1.2, 1.2), 24.5 + rand(-2.5, 2.5), rand(8.5, 11.5), rand(4.2, 5.4), 'rain');
for (let x = 60; x <= 126; x += 19) tree(x + rand(-2, 2), 28 + rand(-0.5, 0.5), rand(5.5, 7), rand(2.2, 2.8), 'round');
// north side of the main road and the median
for (let x = Math.max(-150, RX0 + 10); x <= Math.min(300, RX1 - 10); x += 13) { tree(x + rand(-2, 2), -17 + rand(-2, 2), rand(7, 11), rand(3.2, 4.6), RNG() < 0.5 ? 'rain' : 'round'); }
for (let x = Math.max(-150, RX0 + 10); x <= Math.min(300, RX1 - 10); x += 16) { if (x > 35 && x < 47) continue; B_GREEN.push(TRS(x, 0.9, 3.5, 0, 0, 0, 2.2, 0.7, 0.55), new THREE.Color().setHSL(0.27, 0.4, 0.3)); }
// planting strip along the soi, east grass strip, gardens
for (let z = 80; z <= 196; z += 9) tree(35.5 + rand(-1.2, 1.2), z + rand(-2, 2), rand(7, 10), rand(2.8, 3.8));
for (let z = 108; z <= 196; z += 11) tree(130 + rand(-0.6, 0.6), z + rand(-2, 2), rand(7, 9.5), rand(2.6, 3.4));
for (const [x, z] of [[79, 108], [85, 113], [79.5, 121], [85.5, 128], [81, 131]]) tree(x, z, rand(10, 13), rand(3.8, 4.8), 'rain');
for (const [x, z] of [[58.5, 111.5], [65, 114]]) tree(x, z, 8, 2.8);
for (const [x, z] of [[43, 170], [43.5, 180], [42.5, 190], [44, 196.5]]) tree(x + rand(-0.6, 0.6), z, rand(6.5, 8.5), rand(2.6, 3.3));
// context trees across the soi and the driveway
for (let z = 22; z <= 200; z += 16) { tree(144 + rand(-1, 1), z, rand(8, 11), rand(3.5, 4.6)); tree(18 + rand(-1, 0.5), z + 6, rand(8, 11), rand(3.2, 4.2)); }
// roof gardens on the podium and terraces
for (const [x, z, h] of [[36, 55.5, 25], [48.5, 55.5, 25], [36, 66.5, 12.1], [47.5, 69, 12.1], [54.2, 63, 21.2]]) tree(x, z, 4.2, 1.8, 'round', h);

// ---------------------------------------------------------------- cars
const CAR_COLS = [0xf4f4f2, 0xd9dcdf, 0x9aa0a6, 0x2a2d31, 0x8d1f24, 0x2b4f8a, 0xf4f4f2, 0xbfc3c7];
const carBody = new Inst(GEO.box, std(0xffffff, 0.3, 0.55));
const carCab = new Inst(GEO.box, std(0x26313b, 0.15, 0.7));
function car(x, z, rot, col) {
  const fx = Math.cos(rot), fz = -Math.sin(rot);
  carBody.push(TRS(x, 0.72, z, 0, rot, 0, 4.4, 0.82, 1.8), col);
  carCab.push(TRS(x - fx * 0.25, 1.4, z - fz * 0.25, 0, rot, 0, 2.3, 0.58, 1.58));
}
for (let z = 26; z < 205; z += 6.2) if (RNG() < 0.72) car(22.6, z, Math.PI / 2, CAR_COLS[Math.floor(RNG() * CAR_COLS.length)]);
for (let x = 40; x < 130; x += 6.0) if (RNG() < 0.55) car(x, 207.6, 0, CAR_COLS[Math.floor(RNG() * CAR_COLS.length)]);
for (let z = 62; z < 100; z += 6.2) if (RNG() < 0.6) car(139.2, z, Math.PI / 2, CAR_COLS[Math.floor(RNG() * CAR_COLS.length)]);
carBody.build(); carCab.build();
// moving traffic on the main road (drive on the left: eastbound on the north carriageway)
if (!EXPORT) {
  const N = 16, lanes = [[-6.2, 1], [-2.6, 1], [1.0, 1], [6.1, -1], [9.9, -1], [13.6, -1]];
  const body = new THREE.InstancedMesh(GEO.box, carBody.mat, N), cab = new THREE.InstancedMesh(GEO.box, carCab.mat, N);
  body.castShadow = cab.castShadow = true;
  const cars = [];
  for (let i = 0; i < N; i++) {
    const [z, dir] = lanes[i % lanes.length];
    cars.push({ x0: rand(-450, 450), z, dir, v: rand(9, 14) });
    body.setColorAt(i, new THREE.Color(CAR_COLS[i % CAR_COLS.length]));
  }
  site.add(body, cab);
  const m = new THREE.Matrix4();
  TICKERS.push(t => {
    cars.forEach((c, i) => {
      const x = ((c.x0 + c.dir * c.v * t) % 900 + 900) % 900 - 450;
      const rot = c.dir > 0 ? 0 : Math.PI;
      body.setMatrixAt(i, TRS(x, 0.72, c.z, 0, rot, 0, 4.4, 0.82, 1.8));
      cab.setMatrixAt(i, TRS(x - c.dir * 0.25, 1.4, c.z, 0, rot, 0, 2.3, 0.58, 1.58));
    });
    body.instanceMatrix.needsUpdate = cab.instanceMatrix.needsUpdate = true;
  });
}

// ---------------------------------------------------------------- pedestrian bridge over the main road, in front of the tower
{
  const BR = new Builder('bridge');
  const xa = 39.0, xb = 43.0, za = -13.5, zb = 18.2, y = 6.0;
  BR.box(MAT.white2, xa, y - 0.6, za, xb, y, zb);
  BR.box(MAT.blue, xa - 0.12, y - 0.55, za, xa, y + 0.5, zb);
  BR.box(MAT.blue, xb, y - 0.55, za, xb + 0.12, y + 0.5, zb);
  BR.box(MAT.glassRail, xa, y, za, xa + 0.06, y + 1.2, zb); BR.box(MAT.glassRail, xb - 0.06, y, za, xb, y + 1.2, zb);
  BR.box(MAT.metalRoof, xa - 0.4, y + 2.9, za, xb + 0.4, y + 3.05, zb);
  for (let z = za; z <= zb + 0.01; z += 3.15) {
    for (const x of [xa, xb]) B_STEELD.push(SEG([x, y, z], [x, y + 2.9, z], 0.07));
    if (z + 3.15 <= zb + 0.01) for (const x of [xa, xb]) B_STEELD.push(SEG([x, y, z], [x, y + 2.9, z + 3.15], 0.05));
  }
  for (const z of [-10.5, 3.5, 16.8]) for (const x of [39.6, 42.4]) B_COL.push(TRS(x, (y - 0.6) / 2, z, 0, 0, 0, 0.32, y - 0.6, 0.32));
  const steps = 17, rise = y / steps, run = 1.0;
  for (let i = 0; i < steps; i++) {
    BR.box(MAT.granite, xb + i * run, 0, 16.4, xb + (i + 1) * run, y - i * rise, 19.0);
    BR.box(MAT.granite, xa - (i + 1) * run, 0, -13.2, xa - i * run, y - i * rise, -10.6);
  }
  BR.box(MAT.blue, xb, y - 0.4, 19.0, xb + steps * run, y + 0.3, 19.12);
  BR.finish();
}

// ---------------------------------------------------------------- street lights (glow at dusk)
{
  const poles = new Inst(GEO.cyl6, MAT.steelDark), heads = new Inst(GEO.box, std(0xfff3dc, 0.5, 0, { emissive: 0xffe2b0, emissiveIntensity: 0 }), { cast: false });
  for (let x = Math.max(-140, RX0 + 10); x <= Math.min(290, RX1 - 10); x += 32) for (const [z, s] of [[17.6, -1], [-10.6, 1], [3.5, 0]]) {
    if (z > 10 && x > 36 && x < 64) continue;
    poles.push(TRS(x, 4.5, z, 0, 0, 0, 0.12, 9, 0.12));
    if (s) { B_STEELD.push(SEG([x, 9, z], [x, 9, z + s * 2.2], 0.06)); heads.push(TRS(x, 8.95, z + s * 2.2, 0, 0, 0, 0.5, 0.18, 0.9)); }
    else { for (const k of [-1, 1]) { B_STEELD.push(SEG([x, 9, z], [x, 9, z + k * 2.2], 0.06)); heads.push(TRS(x, 8.95, z + k * 2.2, 0, 0, 0, 0.5, 0.18, 0.9)); } }
  }
  poles.build(); const hm = heads.build();
  GLOWABLE.push(hm.material);
}
B_TRUNK.build();
