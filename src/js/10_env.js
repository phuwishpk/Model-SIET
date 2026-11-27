// ---------------------------------------------------------------- sky (gradient + sun + soft clouds), sun light, environment
const SKY_VS = `varying vec3 vDir;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vDir = wp.xyz - cameraPosition;
  gl_Position = projectionMatrix * viewMatrix * wp; gl_Position.z = gl_Position.w; }`;
const SKY_FS = `uniform vec3 uZenith; uniform vec3 uHorizon; uniform vec3 uGround; uniform vec3 uSunDir; uniform vec3 uSunColor; uniform vec3 uCloudTint; uniform float uCloud; uniform float uTime;
varying vec3 vDir;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; } return v; }
void main(){
  vec3 d = normalize(vDir); float h = d.y;
  vec3 col = mix(uHorizon, uZenith, pow(clamp(h, 0.0, 1.0), 0.5));
  float s = max(dot(d, uSunDir), 0.0);
  col += uSunColor * (pow(s, 1400.0) * 8.0 + pow(s, 16.0) * 0.22 + pow(s, 3.0) * 0.06);
  if (uCloud > 0.0 && h > 0.0) {
    vec2 uv = d.xz / (h + 0.1) * 1.3 + vec2(uTime * 0.003, uTime * 0.001);
    float c = fbm(uv);
    float cov = smoothstep(0.56 - uCloud * 0.16, 0.86, c);
    float lit = fbm(uv + uSunDir.xz * 0.06);
    vec3 cc = uCloudTint * mix(0.78, 1.05, smoothstep(0.35, 0.75, c - lit + 0.5));
    col = mix(col, cc, cov * smoothstep(0.0, 0.2, h) * 0.92);
  }
  col = mix(col, uGround, smoothstep(0.0, -0.06, h));
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;
function skyMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: SKY_VS, fragmentShader: SKY_FS, side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false,
    uniforms: { uZenith: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() }, uGround: { value: new THREE.Color() },
      uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunColor: { value: new THREE.Color() }, uCloudTint: { value: new THREE.Color() },
      uCloud: { value: 1 }, uTime: { value: 0 } },
  });
}
const sky = new THREE.Mesh(new THREE.SphereGeometry(3000, 32, 16), skyMaterial());
sky.renderOrder = -1; sky.frustumCulled = false;
scene.add(sky);
const envSkyMat = skyMaterial();
const envScene = new THREE.Scene();
envScene.add(new THREE.Mesh(new THREE.SphereGeometry(40, 32, 16), envSkyMat));
const pmrem = new THREE.PMREMGenerator(renderer);
let envRT = null;
TICKERS.push(t => { sky.material.uniforms.uTime.value = t; });

const sun = new THREE.DirectionalLight(0xfff4e2, 3.2);
sun.castShadow = true;
sun.shadow.mapSize.set(SMALL ? 2048 : 4096, SMALL ? 2048 : 4096);
const SB = 165;
Object.assign(sun.shadow.camera, { left: -SB, right: SB, top: SB, bottom: -SB, near: 10, far: 900 });
sun.shadow.bias = -0.0003;
sun.shadow.normalBias = 0.5;
scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight(0xd6e8f7, 0x8d8a78, 0.55);
scene.add(hemi);
const fill = new THREE.DirectionalLight(0xdfe9f5, 0.55); // soft bounce from the west so shaded facades keep their detail
fill.position.set(-300, 190, 90);
scene.add(fill);
scene.fog = new THREE.Fog(0xc9dfec, 450, 2600);

const SKY_DAY = { el: 56, az: 42, zenith: '#2369c4', horizon: '#c6e2f3', ground: '#c9dfec', sunCol: '#fff1d6', cloud: 1, cloudTint: '#ffffff',
  exposure: 0.95, sun: 0xfff4e2, sunI: 2.8, hemiI: 0.6, fillI: 1.0, fog: 0xc9dfec, env: 0.85 };
const SKY_DUSK = { el: 5, az: 262, zenith: '#2a3f74', horizon: '#f4a566', ground: '#c99a86', sunCol: '#ffb36b', cloud: 1.1, cloudTint: '#f5b590',
  exposure: 1.05, sun: 0xffa463, sunI: 2.2, hemiI: 0.5, fillI: 0.18, fog: 0xc99a86, env: 0.8 };
function applySky(p) {
  const dir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - p.el), Math.PI - THREE.MathUtils.degToRad(p.az));
  for (const m of [sky.material, envSkyMat]) {
    const U = m.uniforms;
    U.uZenith.value.set(p.zenith); U.uHorizon.value.set(p.horizon); U.uGround.value.set(p.ground);
    U.uSunColor.value.set(p.sunCol); U.uCloudTint.value.set(p.cloudTint); U.uCloud.value = p.cloud; U.uSunDir.value.copy(dir);
  }
  envSkyMat.uniforms.uCloud.value = 0.0;
  sun.position.copy(dir).multiplyScalar(420);
  sun.target.position.set(0, 0, 0);
  sun.color.set(p.sun); sun.intensity = p.sunI;
  hemi.intensity = p.hemiI; fill.intensity = p.fillI;
  renderer.toneMappingExposure = p.exposure;
  scene.fog.color.set(p.fog);
  if (envRT) envRT.dispose();
  envRT = pmrem.fromScene(envScene, 0.03, 0.1, 100);
  scene.environment = envRT.texture;
  scene.environmentIntensity = p.env;
}
applySky(SKY_DAY);

// ---------------------------------------------------------------- ground, roads, paving
function flat(mat, x0, z0, x1, z1, y = 0, id) {
  const b = new Builder(id || 'ground');
  b.box(mat, x0, y - 0.05, z0, x1, y, z1, ['py']);
  const g = b.finish(site, { cast: false, receive: true });
  return g;
}
const GROUND_PLANE = new THREE.Mesh(new THREE.CircleGeometry(5200, 64), MAT.ground);
GROUND_PLANE.rotation.x = -Math.PI / 2; GROUND_PLANE.position.y = -0.12; GROUND_PLANE.receiveShadow = true;
scene.add(GROUND_PLANE);
const GROUND = new Builder('ground');
// main road: ถนนฉลองกรุง (north); two carriageways with a planted median
GROUND.box(MAT.asphalt, RX0, -0.1, -8, RX1, 0.0, 15.5, ['py']);
GROUND.box(MAT.curb, RX0, 0, 2.8, RX1, 0.18, 4.2);
GROUND.box(MAT.grass, RX0, 0.0, 3.0, RX1, 0.2, 4.0, ['py']);
GROUND.box(MAT.sidewalk, RX0, -0.1, 15.5, RX1, 0.15, 20, ['py', 'pz', 'nz']);
GROUND.box(MAT.sidewalk, RX0, -0.1, -13, RX1, 0.15, -8, ['py', 'pz', 'nz']);
// west soi (ซอยฉลองกรุง 1), east driveway, south lane, railway
GROUND.box(MAT.asphalt, 20, -0.1, 20, 31, 0.0, 214, ['py']);
GROUND.box(MAT.asphalt, 132, -0.1, 20, 141, 0.0, 214, ['py']);
GROUND.box(MAT.asphalt, 20, -0.1, 198, 141, 0.0, 211, ['py']);
GROUND.box(MAT.sidewalk, 20, -0.1, 211, 141, 0.12, 214, ['py', 'pz']);
GROUND.box(MAT.roofDark, RX0, -0.1, 214, RX1, 0.25, 244, ['py', 'nz']);
for (const z of [219, 220.5, 226, 227.5, 233, 234.5, 239, 240.5]) GROUND.box(MAT.steelDark, RX0, 0.25, z - 0.04, RX1, 0.42, z + 0.04);
// site base (light paving)
GROUND.box(MAT.paving, 31, -0.1, 20, 132, 0.02, 198, ['py']);
// front plaza (argyle paving) + paving under the canopy
GROUND.box(MAT.plaza, 88.5, 0.03, 30, 131.5, 0.08, 57.5, ['py']);
GROUND.box(MAT.paving, 50, 0.03, 20, 88.5, 0.08, 57.5, ['py']);
// green strips
GROUND.box(MAT.grass, 52, 0.03, 20, 131.5, 0.12, 29.4, ['py', 'pz']);
GROUND.box(MAT.grass, 31, 0.03, 76.5, 39.5, 0.09, 198, ['py']);
GROUND.box(MAT.grass, 75, 0.03, 104, 88, 0.09, 133, ['py']);
GROUND.box(MAT.grass, 54, 0.05, 108.5, 69, 0.09, 117, ['py']);
GROUND.box(MAT.grass, 39.5, 0.03, 166, 47, 0.09, 198, ['py']);
GROUND.box(MAT.grass, 127.5, 0.03, 104, 132, 0.09, 198, ['py']);
// lane markings
for (const z of [-4.4, -0.8, 8, 11.8]) for (let x = RX0 + 20; x < RX1 - 20; x += 9) GROUND.box(MAT.mark, x, 0.0, z - 0.08, x + 4.5, 0.045, z + 0.08, ['py']);
for (const z of [-7.4, 2.5, 4.5, 14.9]) GROUND.box(MAT.mark, RX0 + 10, 0.0, z - 0.08, RX1 - 10, 0.045, z + 0.08, ['py']);
for (let i = 0; i < 5; i++) GROUND.box(MAT.mark, 133 + i * 1.7, 0.0, 16, 134 + i * 1.7, 0.045, 19.5, ['py']);
GROUND.finish(site, { cast: false, receive: true });

// context massing around the faculty (muted, unlabeled)
if (!EXPORT) {
  const C = new Builder('context');
  const ctx = (x0, z0, x1, z1, h) => { C.mass(MAT.ctx, MAT.ctxRoof, x0, 0, z0, x1, h, z1); };
  ctx(-38, 30, 13, 70, 18); ctx(-38, 82, 13, 150, 21); ctx(-38, 158, 13, 200, 14);   // คณะวิทยาศาสตร์ across the soi
  ctx(146, 64, 200, 86, 13); ctx(147, 100, 176, 160, 15); ctx(146, 166, 172, 200, 10); // east of the driveway
  ctx(-40, -64, 20, -26, 9); ctx(40, -70, 100, -28, 12); ctx(118, -64, 176, -28, 7); // north of the road
  C.finish(site, { cast: true, receive: true });
  const pond = new Builder('context');
  pond.box(MAT.grass, 142, 0.02, 20, 184, 0.1, 60, ['py']);
  pond.box(MAT.water, 146, 0.02, 24, 178, 0.14, 55, ['py']);
  pond.finish(site, { cast: false });
}
