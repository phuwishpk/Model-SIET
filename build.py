"""Build the 3D viewer page from src/.

    python3 build.py

Writes:
  index.html  - the page, loading three.js from the jsDelivr CDN (open it directly or serve it with GitHub Pages)
  test.html   - the same page loading three.js from ./node_modules (for offline work and the tools/ scripts;
                run `npm install` first)
"""
import glob
import json
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
THREE_VERSION = '0.170.0'


def main():
    tpl = open(os.path.join(ROOT, 'src', 'page.html'), encoding='utf-8').read()
    font = json.load(open(os.path.join(ROOT, 'src', 'font_SIET.json'), encoding='utf-8'))
    parts = []
    for f in sorted(glob.glob(os.path.join(ROOT, 'src', 'js', '*.js'))):
        parts.append(f'// ---- {os.path.basename(f)}\n' + open(f, encoding='utf-8').read())
    js = '\n'.join(parts)
    marker = '// ---------------------------------------------------------------- renderer / scene'
    assert marker in js, 'renderer marker missing from 00_setup.js'
    js = js.replace(marker, 'const FONT_DATA = ' + json.dumps(font, separators=(',', ':')) + ';\n' + marker, 1)
    cdn = {'imports': {
        'three': f'https://cdn.jsdelivr.net/npm/three@{THREE_VERSION}/build/three.module.min.js',
        'three/addons/': f'https://cdn.jsdelivr.net/npm/three@{THREE_VERSION}/examples/jsm/'}}
    local = {'imports': {
        'three': './node_modules/three/build/three.module.js',
        'three/addons/': './node_modules/three/examples/jsm/'}}
    for name, imap in (('index.html', cdn), ('test.html', local)):
        out = tpl.replace('/*IMPORTMAP*/', json.dumps(imap)).replace('/*MAIN*/', js)
        open(os.path.join(ROOT, name), 'w', encoding='utf-8').write(out)
    print(f'built index.html and test.html ({len(js):,} chars of JS)')


if __name__ == '__main__':
    main()
