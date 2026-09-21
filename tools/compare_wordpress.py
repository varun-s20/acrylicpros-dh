#!/usr/bin/env python3
"""Pixel-compare the WordPress build against the static site.

    python -m http.server 8899          # from the repo root
    python tools/compare_wordpress.py [--slug about] [--open]

check_wordpress_preview.py compares a handful of computed properties, which
catches a stylesheet leaking onto the wrong pages but not a section that is
40px too tall or an image cropping differently. This renders both versions
full-page at two widths and diffs the actual pixels.

Output goes to wordpress/compare/:

    <slug>-<width>-static.png     what the custom site looks like
    <slug>-<width>-wp.png         what the WordPress build looks like
    <slug>-<width>-diff.png       red where they disagree

Why an exact match is not the target
------------------------------------
Some difference is expected and harmless:

  - the hero and ambient videos decode to different frames on each load, and
    headless Chromium cannot decode H.264 at all, so those areas differ every
    run regardless
  - scroll-triggered reveals settle at slightly different times

So this reports a percentage and ranks pages by it. A page at a few percent is
usually video; a page in double figures has a real layout difference, and the
diff image shows where.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "wordpress" / "compare"
BASE = "http://127.0.0.1:8899"

VIEWPORTS = [(1440, 900, "desktop"), (390, 844, "mobile")]

# Give scroll-driven work a chance to finish, then freeze what moves so the
# two sides are compared in the same state.
SETTLE_JS = """() => {
  // Park every video on its first frame; different decode timing between two
  // page loads is otherwise the largest source of false difference.
  document.querySelectorAll('video').forEach(v => {
    try { v.pause(); v.currentTime = 0; } catch (e) {}
  });
  // Deliberately NOT calling getAnimations().finish().
  //
  // pages.js builds the menu and page-transition timelines up front as paused
  // Web Animations. Finishing everything fast-forwards those to their end
  // state, which scales .t-page down and slides it aside -- the whole page
  // renders as a shrunken card. The static homepage never loads pages.js, so
  // it has no such animations and stays put, and the comparison then reports a
  // huge difference that exists only because the measurement caused it.
  //
  // Waiting is enough for the transitions that actually matter.

  // Hide third-party embeds. The ambient band mounts a YouTube iframe, and
  // whether it has painted a frame by screenshot time is up to YouTube, not
  // us. Left in, it alone swings the homepage figure by eight points and
  // buries any real difference.
  document.querySelectorAll('iframe').forEach(f => { f.style.visibility = 'hidden'; });

  // Hide everything position:fixed before a full-page screenshot.
  //
  // Chromium takes a full-page shot by stretching the viewport, so a fixed
  // element positioned relative to the viewport lands somewhere arbitrary in
  // the middle of the image. The transition panels sit at top:101vh — just
  // below the fold, invisible to a real visitor — and screenshot as a solid
  // gold band across the page. Since the static homepage has no panels and the
  // WordPress one does, that artifact does not cancel out and swamps the diff.
  //
  // The chrome is compared by check_wordpress_preview.py instead, and the
  // header markup is identical by construction.
  document.querySelectorAll('body *').forEach(e => {
    if (getComputedStyle(e).position === 'fixed') { e.style.display = 'none'; }
  });

  window.scrollTo(0, 0);
}"""


def shoot(page, url: str, path: Path) -> bool:
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=45000)
    except Exception as exc:  # noqa: BLE001
        print(f"      load failed: {str(exc)[:70]}")
        return False

    page.wait_for_timeout(1200)
    # Scroll the whole page so lazy images and in-view classes trigger, then
    # come back to the top.
    page.evaluate("""async () => {
        const step = window.innerHeight;
        for (let y = 0; y < document.body.scrollHeight; y += step) {
            window.scrollTo(0, y);
            await new Promise(r => setTimeout(r, 90));
        }
    }""")
    page.wait_for_timeout(1500)
    page.evaluate(SETTLE_JS)
    page.wait_for_timeout(600)
    page.screenshot(path=str(path), full_page=True)
    return True


def compare(a: Path, b: Path, diff: Path) -> tuple[float, str]:
    from PIL import Image, ImageChops
    import numpy as np

    ia = Image.open(a).convert("RGB")
    ib = Image.open(b).convert("RGB")

    note = ""
    if ia.size != ib.size:
        note = f"size {ia.size[0]}x{ia.size[1]} vs {ib.size[0]}x{ib.size[1]}"
        h = min(ia.size[1], ib.size[1])
        w = min(ia.size[0], ib.size[0])
        ia = ia.crop((0, 0, w, h))
        ib = ib.crop((0, 0, w, h))

    delta = np.abs(np.asarray(ia, dtype=np.int16)
                   - np.asarray(ib, dtype=np.int16)).sum(axis=2)
    # A small tolerance: antialiasing and image resampling differ by a shade
    # or two without anything being visibly wrong.
    differing = (delta > 24)
    pct = 100.0 * differing.mean()

    if pct > 0.05:
        mask = Image.fromarray((differing * 255).astype("uint8"), mode="L")
        red = Image.new("RGB", ia.size, (255, 0, 0))
        out = ia.copy()
        out.paste(red, mask=mask)
        out.save(diff)

    return pct, note


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--slug", help="compare one page only")
    ap.add_argument("--width", type=int, help="one viewport width only")
    args = ap.parse_args()

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("playwright not installed", file=sys.stderr)
        return 1

    previews = sorted((ROOT / "wordpress" / "preview").glob("*.html"))
    if args.slug:
        previews = [p for p in previews if p.stem == args.slug]
    if not previews:
        print("nothing to compare — run tools/build_wordpress.py first", file=sys.stderr)
        return 1

    viewports = VIEWPORTS
    if args.width:
        viewports = [v for v in VIEWPORTS if v[0] == args.width]

    OUT.mkdir(parents=True, exist_ok=True)
    results = []

    with sync_playwright() as pw:
        browser = pw.chromium.launch()

        for prev in previews:
            slug = prev.stem
            if not (ROOT / f"{slug}.html").exists():
                continue

            for w, h, label in viewports:
                paths = {}
                ok = True
                for side, url in (
                    ("static", f"{BASE}/{slug}.html"),
                    ("wp", f"{BASE}/wordpress/preview/{slug}.html"),
                ):
                    page = browser.new_page(
                        viewport={"width": w, "height": h},
                        is_mobile=(w < 500), has_touch=(w < 500),
                        device_scale_factor=1,
                    )
                    paths[side] = OUT / f"{slug}-{label}-{side}.png"
                    if not shoot(page, url, paths[side]):
                        ok = False
                    page.close()

                if not ok:
                    continue

                pct, note = compare(
                    paths["static"], paths["wp"],
                    OUT / f"{slug}-{label}-diff.png")
                results.append((pct, slug, label, note))
                flag = "ok  " if pct < 2 else ("look" if pct < 10 else "FAIL")
                print(f"  {flag} {slug:32} {label:8} {pct:6.2f}%  {note}")

        browser.close()

    print()
    results.sort(reverse=True)
    worst = [r for r in results if r[0] >= 2]
    if worst:
        print("Worst differences (look at the -diff.png for each):")
        for pct, slug, label, note in worst[:12]:
            print(f"   {pct:6.2f}%  {slug} ({label}) {note}")
    else:
        print("Every page within 2% — differences are video frames and antialiasing.")

    print(f"\nimages in {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
