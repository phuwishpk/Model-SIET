# usage: python3 tools/shot.py URL out.png [w h] [js_before_shot] [wait_ms]
import sys, asyncio, json
from playwright.async_api import async_playwright
async def main():
    url=sys.argv[1]; out=sys.argv[2]
    w=int(sys.argv[3]) if len(sys.argv)>3 else 1280
    h=int(sys.argv[4]) if len(sys.argv)>4 else 720
    js=sys.argv[5] if len(sys.argv)>5 else ''
    wait=int(sys.argv[6]) if len(sys.argv)>6 else 2500
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path=__import__('os').environ.get('CHROME', '/usr/bin/google-chrome'),args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl'])
        pg=await b.new_page(viewport={'width':w,'height':h})
        logs=[]
        pg.on('console',lambda m: logs.append(f'[{m.type}] {m.text}'))
        pg.on('pageerror',lambda e: logs.append(f'[pageerror] {e}'))
        await pg.goto(url)
        await pg.wait_for_timeout(wait)
        if js:
            r=await pg.evaluate(js)
            if r is not None: print('JS->',json.dumps(r)[:2000])
            await pg.wait_for_timeout(1500)
        await pg.screenshot(path=out)
        for l in logs[:40]: print(l)
        await b.close()
asyncio.run(main())
