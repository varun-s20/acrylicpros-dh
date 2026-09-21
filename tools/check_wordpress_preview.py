#!/usr/bin/env python3
"""Compare the WordPress build against the static site, in a real browser.

    python -m http.server 8899          # from the repo root
    python tools/check_wordpress_preview.py

The WordPress build is a set of fragments, so for a long time nothing in it
could actually be looked at without a WordPress. That is how the homepage
shipped with legacy.css repainting it: every file was correct on its own, and
the bug only existed once they were combined.

build_wordpress.py now writes wordpress/preview/, which reassembles the chrome,
the page body and the footer with the same <html> and <body> classes WordPress
emits, against the same single global.css. This script loads each preview page
and the static page it came from, and compares computed styles.

It checks the properties that silently differ rather than visibly break —
colour, background, font, size, position. A page that renders in the wrong
palette looks deliberate until someone compares it with the original.
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = "http://127.0.0.1:8899"

# Elements worth comparing: the page shell, the chrome, and a representative
# heading and paragraph. Add to this when a regression teaches you to.
SELECTORS = [
    "#main",
    ".t-page",
    ".o-header",
    ".o-footer",
    "h2",
    "p",
]

PROPS = ["color", "backgroundColor", "fontFamily", "fontSize", "position"]

PROBE = """(args) => {
  const [sels, props] = args;
  const out = {};
  for (const s of sels) {
    const el = document.querySelector(s);
    if (!el) { out[s] = null; continue; }
    const c = getComputedStyle(el);
    const o = {};
    for (const p of props) { o[p] = c[p]; }
    out[s] = o;
  }
  return out;
}"""


def main() -> int:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("playwright not installed — skipping", file=sys.stderr)
        return 0

    previews = sorted((ROOT / "wordpress" / "preview").glob("*.html"))
    if not previews:
        print("no preview pages — run tools/build_wordpress.py first", file=sys.stderr)
        return 1

    failed = []

    with sync_playwright() as p:
        browser = p.chromium.launch()

        for prev in previews:
            slug = prev.stem
            static_file = ROOT / f"{slug}.html"
            if not static_file.exists():
                continue

            got = {}
            for label, url in (
                ("static", f"{BASE}/{slug}.html"),
                ("preview", f"{BASE}/wordpress/preview/{slug}.html"),
            ):
                page = browser.new_page(viewport={"width": 1440, "height": 900})
                try:
                    page.goto(url, wait_until="domcontentloaded", timeout=30000)
                    page.wait_for_timeout(1500)
                    got[label] = page.evaluate(PROBE, [SELECTORS, PROPS])
                except Exception as exc:  # noqa: BLE001
                    got[label] = {"__error__": str(exc)[:100]}
                finally:
                    page.close()

            diffs = []
            for sel in SELECTORS:
                a = got["static"].get(sel)
                b = got["preview"].get(sel)
                if a is None and b is None:
                    continue
                if a is None or b is None:
                    diffs.append(f"{sel}: only in {'static' if a else 'preview'}")
                    continue
                for prop in PROPS:
                    if a.get(prop) != b.get(prop):
                        diffs.append(
                            f"{sel} {prop}: static={a.get(prop)} preview={b.get(prop)}")

            if diffs:
                failed.append(slug)
                print(f"FAIL  {slug}")
                for d in diffs[:6]:
                    print(f"        {d}")
            else:
                print(f"PASS  {slug}")

        browser.close()

    print()
    print(f"{len(previews) - len(failed)}/{len(previews)} pages match the static site")
    if failed:
        print("differing:", ", ".join(failed))
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
