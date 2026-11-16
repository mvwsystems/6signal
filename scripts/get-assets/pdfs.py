import asyncio, json, sys
from playwright.async_api import async_playwright
A=json.load(open('assets.json'))
only = sys.argv[1:]
FOOT = '<div style="font-family:JetBrains Mono,monospace;font-size:7px;letter-spacing:1px;color:#777;width:100%;padding:0 16mm;display:flex;justify-content:space-between"><span>6 SIGNAL · {kw} · 6SIGNAL.CO/GET/{slug}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        pg = await b.new_page()
        for a in A:
            if only and a['keyword'] not in only: continue
            await pg.goto(f"http://localhost:8765/get/{a['slug']}/", wait_until='networkidle')
            await pg.emulate_media(media='print')
            await pg.pdf(path=f"site/get/{a['slug']}/{a['slug']}-6signal.pdf", format='Letter', print_background=True,
                         display_header_footer=True, header_template='<span></span>',
                         footer_template=FOOT.format(kw=a['keyword'], slug=a['slug'].upper()),
                         margin={'top':'14mm','bottom':'16mm','left':'0','right':'0'}, prefer_css_page_size=False)
        await b.close()
asyncio.run(main())
