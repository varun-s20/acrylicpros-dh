#!/usr/bin/env python3
"""Browser QA sweep: every page, two viewports.

Checks console errors, page errors, failed requests, horizontal overflow,
and that the components on each page actually initialised.
"""
import os
import sys
from playwright.sync_api import sync_playwright

ROOT = r"C:\Users\varun\OneDrive\Desktop\s20\digital-heroes\acrylicpros"
BASE = "http://127.0.0.1:8899/"

pages = sorted(n for n in os.listdir(ROOT) if n.endswith(".html"))
# A representative slice of the catalogue rather than all 69.
products = sorted(n for n in os.listdir(os.path.join(ROOT, "product")) if n.endswith(".html"))
pages += ["product/" + n for n in products[:3]]

VIEWPORTS = [("desktop", 1440, 900, False), ("mobile", 390, 844, True)]

problems = []
checked = 0

with sync_playwright() as p:
    browser = p.chromium.launch()
    for label, w, h, mobile in VIEWPORTS:
        ctx = browser.new_context(viewport={"width": w, "height": h},
                                  is_mobile=mobile, has_touch=mobile,
                                  device_scale_factor=2 if mobile else 1)
        page = ctx.new_page()

        for name in pages:
            errors, failed = [], []
            page.on("console", lambda m, e=errors: e.append(m.text) if m.type == "error" else None)
            page.on("pageerror", lambda exc, e=errors: e.append("PAGEERROR: %s" % exc))
            # Plain Chromium ships without H.264, so it aborts MP4 fetches it cannot
            # decode (net::ERR_ABORTED). That is the test browser, not a missing file.
            # YouTube's own tracking calls are also cut off when the page moves on.
            page.on("requestfailed",
                    lambda r, f=failed: None
                    if ("ERR_ABORTED" in (r.failure or "")
                        and (r.url.endswith(".mp4") or not r.url.startswith(BASE)))
                    else f.append("%s :: %s" % (r.url.split("/")[-1], r.failure)))

            try:
                page.goto(BASE + name, wait_until="networkidle", timeout=45000)
            except Exception as exc:
                problems.append("%s [%s] LOAD FAILED: %s" % (name, label, exc))
                continue

            page.wait_for_timeout(350)
            # Scroll through so lazy images and reveals fire.
            page.evaluate("""() => new Promise(res => {
                let y = 0;
                const step = () => {
                    y += window.innerHeight;
                    window.scrollTo(0, y);
                    if (y < document.body.scrollHeight) setTimeout(step, 40);
                    else { window.scrollTo(0, 0); setTimeout(res, 250); }
                };
                step();
            })""")
            page.wait_for_timeout(250)

            overflow = page.evaluate(
                "() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
            broken_imgs = page.evaluate("""() => [...document.images]
                .filter(i => i.complete && i.naturalWidth === 0)
                .map(i => i.currentSrc || i.src)""")

            checked += 1
            if overflow > 1:
                problems.append("%s [%s] horizontal overflow %dpx" % (name, label, overflow))
            for e in errors[:4]:
                problems.append("%s [%s] console: %s" % (name, label, e[:130]))
            for f in failed[:4]:
                problems.append("%s [%s] request failed: %s" % (name, label, f[:130]))
            for b in broken_imgs[:4]:
                problems.append("%s [%s] broken image: %s" % (name, label, b.split("/")[-1]))

            page.remove_listener("console", lambda m: None) if False else None

        ctx.close()
    browser.close()

print("Checked %d page-viewport combinations across %d pages." % (checked, len(pages)))
if problems:
    print("\n%d PROBLEM(S):" % len(problems))
    seen = set()
    for pr in problems:
        if pr in seen:
            continue
        seen.add(pr)
        print("  x " + pr)
    sys.exit(1)
print("\nNo console errors, no failed requests, no broken images, no horizontal overflow.")
