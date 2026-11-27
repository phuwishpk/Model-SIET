"""Export the scene to a .glb file with headless Chrome.

    npm install
    python3 build.py
    python3 -m http.server 8765        # in another terminal, from the repo root
    python3 tools/export_glb.py model/SIET_KMITL_model.glb

Needs: pip install playwright, and a Chrome/Chromium (set CHROME=/path/to/chrome if it is not /usr/bin/google-chrome).
The page is opened with ?export, which trims the main road and leaves out moving cars and the grey context blocks.
"""
import asyncio
import base64
import os
import sys

from playwright.async_api import async_playwright

URL = os.environ.get('MODEL_URL', 'http://localhost:8765/test.html?export#top')
CHROME = os.environ.get('CHROME', '/usr/bin/google-chrome')

JS = r"""
async () => {
  const THREE = window.__THREE, site = window.__site;
  const { GLTFExporter } = await import('./node_modules/three/examples/jsm/exporters/GLTFExporter.js');
  const { mergeGeometries } = await import('./node_modules/three/examples/jsm/utils/BufferGeometryUtils.js');
  const root = new THREE.Group(); root.name = 'SIET_KMITL';
  site.updateMatrixWorld(true);
  const groups = new Map();
  const grp = id => { if (!groups.has(id)) { const g = new THREE.Group(); g.name = id; groups.set(id, g); root.add(g); } return groups.get(id); };
  const clean = g => {
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    return g;
  };
  let tris = 0;
  site.traverse(o => {
    if (o.isPoints || !o.visible) return;
    const id = o.userData.id || (o.parent && o.parent.userData.id) || 'details';
    if (id === 'context') return;
    if (o.isInstancedMesh) {
      const base = clean(o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone());
      const geos = [];
      for (let i = 0; i < o.count; i++) {
        const m = new THREE.Matrix4(); o.getMatrixAt(i, m); m.premultiply(o.matrixWorld);
        const g = base.clone().applyMatrix4(m);
        if (o.instanceColor) {
          const c = new THREE.Color(); o.getColorAt(i, c);
          const n = g.attributes.position.count, a = new Float32Array(n * 3);
          for (let k = 0; k < n; k++) { a[k * 3] = c.r; a[k * 3 + 1] = c.g; a[k * 3 + 2] = c.b; }
          g.setAttribute('color', new THREE.BufferAttribute(a, 3));
        }
        geos.push(g);
      }
      const merged = mergeGeometries(geos, false); tris += merged.attributes.position.count / 3;
      let mat = o.material;
      if (o.instanceColor) { mat = o.material.clone(); mat.vertexColors = true; mat.name = o.material.name + '_vc'; }
      const mesh = new THREE.Mesh(merged, mat); mesh.name = id + '_' + (o.material.name || 'inst'); grp(id).add(mesh);
    } else if (o.isMesh) {
      const g = clean(o.geometry.clone()).applyMatrix4(o.matrixWorld);
      tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
      const mesh = new THREE.Mesh(g, o.material); mesh.name = id + '_' + (o.material.name || 'mesh'); grp(id).add(mesh);
    }
  });
  const glb = await new GLTFExporter().parseAsync(root, { binary: true });
  const bytes = new Uint8Array(glb); let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return { b64: btoa(s), tris: Math.round(tris), groups: [...groups.keys()] };
}
"""


async def main(out):
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 800, 'height': 500})
        await pg.goto(URL)
        await pg.wait_for_function('window.__ready === true', timeout=120000)
        r = await pg.evaluate(JS)
        data = base64.b64decode(r['b64'])
        open(out, 'wb').write(data)
        print('wrote', out, len(data), 'bytes,', r['tris'], 'triangles, groups:', ', '.join(r['groups']))
        await b.close()


if __name__ == '__main__':
    asyncio.run(main(sys.argv[1] if len(sys.argv) > 1 else 'model/SIET_KMITL_model.glb'))
