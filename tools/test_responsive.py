"""Responsive check: every page at 11 widths (320-1920px). Fails if the page
scrolls sideways or any text/control sits outside the screen.
Needs a server on 127.0.0.1:8899.   python tools/test_responsive.py [320,768]
"""
import json
import os
import sys
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
pages = sorted(f for f in os.listdir(ROOT) if f.endswith('.html'))
pages.append('product/90-gal-36x24x24-reef-pro-black-stand.html')
widths = [int(w) for w in (sys.argv[1].split(',') if len(sys.argv) > 1 else '320,360,390,414,600,768,834,1024,1280,1440,1920'.split(','))]

JS = r"""() => {
  const vw = document.documentElement.clientWidth;
  const SKIP = '[data-menu], [data-loader], .a-panel, [hidden], .m-slider, [data-slider-track], [data-marquee], .o-homeShows__grid, .o-shop__filters, .o-shopCompare__scroll, .m-hero__lastShow, .sr-only, .skip-link, .m-chat__launcherLabel, .m-lightbox, [data-cat-list], .rail, .ticker';
  const out = [];
  for (const el of document.querySelectorAll('main *, footer *, header *, .m-chat *')) {
    if (el.closest(SKIP)) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    const isText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
    const isCtl = /^(A|BUTTON|INPUT|SELECT|TEXTAREA|IMG|TABLE)$/.test(el.tagName);
    if (!isText && !isCtl) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    if (r.right > vw + 1 || r.left < -1) {
      out.push(el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0] + ' [' + Math.round(r.left) + ',' + Math.round(r.right) + '] "' + el.textContent.trim().slice(0, 24) + '"');
    }
  }
  return {sw: document.documentElement.scrollWidth, vw, issues: [...new Set(out)].slice(0, 10)};
}"""

report = {}
with sync_playwright() as p:
    br = p.chromium.launch(channel="chrome")
    for w in widths:
        ctx = br.new_context(viewport={"width": w, "height": 900 if w > 600 else 800},
                             is_mobile=w < 700, has_touch=w < 1025, reduced_motion="reduce")
        pg = ctx.new_page()
        for name in pages:
            pg.goto("http://127.0.0.1:8899/" + name, wait_until="load")
            pg.wait_for_timeout(250)
            r = pg.evaluate(JS)
            if r['sw'] > r['vw'] + 1 or r['issues']:
                report.setdefault(name, {})[w] = r
                print(w, name, 'overflow' if r['sw'] > r['vw'] else '', r['issues'][:6])
        ctx.close()
    br.close()
print('%d page(s) with problems.' % len(report) if report else 'No overflow at any width.')
sys.exit(1 if report else 0)
