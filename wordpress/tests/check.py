#!/usr/bin/env python3
"""Static build checks for a website->WordPress conversion.

    python check_static.py wordpress/
    python check_static.py wordpress/ --config wordpress/tests/check-config.json

No dependencies. Copy this into the project as `wordpress/tests/check.py` and
add project-specific assertions at the bottom -- the copy that must appear
verbatim, the retired slug that must stay gone, the geometry that breaks if a
value drifts. Generic checks catch generic bugs; the project ones catch yours.

Optional config JSON:
{
  "tokens":     { "--ink": "#0A0A0A", "--paper": "#FAF9F6" },
  "contrast":   [ ["--ink", "--paper", 4.5] ],
  "slugs":      ["/", "/about/", "/contact/"],
  "forbidden":  ["localhost", "staging.client.com", "REPLACE_ID_"],
  "chrome":     ["header.html", "footer.html"]
}
"""
import argparse
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

FAILS = []
CHECKED = 0

DEFAULT_FORBIDDEN = [
    "localhost", "127.0.0.1", "file://", "lorem ipsum",
    "REPLACE_ID", "TODO:", "XXX:",
]

# mixed content, without false-positiving on xmlns="http://www.w3.org/…" and
# JSON-LD "@context": "http://schema.org"
MIXED = re.compile(r'(?:src|href)\s*=\s*["\']http://(?!www\.w3\.org)', re.I)


def check(name, ok, detail=""):
    global CHECKED
    CHECKED += 1
    print(f"{'PASS' if ok else 'FAIL'}  {name}{'  - ' + detail if detail else ''}")
    if not ok:
        FAILS.append(name)


def warn(name, ok, detail=""):
    """Worth knowing, not worth failing a build over."""
    if not ok:
        print(f"WARN  {name}{'  - ' + detail if detail else ''}")


# ---------------------------------------------------------------- colour ----

def _rgb(hex_str):
    h = hex_str.strip().lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    if len(h) != 6:
        return None
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def _luminance(rgb):
    def chan(c):
        c = c / 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (chan(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(fg, bg):
    """WCAG contrast ratio between two hex colours, or None if unparseable."""
    a, b = _rgb(fg), _rgb(bg)
    if not a or not b:
        return None
    la, lb = _luminance(a), _luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


# ------------------------------------------------------------------ html ----

class Page(HTMLParser):
    """Collects the facts the checks need from one HTML file."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.classes = set()
        self.ids = []
        self.links = []
        self.images = []          # (src, alt_or_None)
        self.headings = []        # 1..6 in document order
        self.labels_for = set()
        self.inputs = []          # (type, id, has_label)
        self.in_label = False

    def handle_endtag(self, tag):
        if tag == "label":
            self.in_label = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get("class"):
            self.classes.update(a["class"].split())
        if a.get("id"):
            self.ids.append(a["id"])
        if tag == "a" and a.get("href"):
            self.links.append(a["href"])
        if tag == "img":
            self.images.append((a.get("src", ""), a.get("alt")))
        if tag in ("h1", "h2", "h3", "h4", "h5", "h6"):
            self.headings.append(int(tag[1]))
        if tag == "label":
            if a.get("for"):
                self.labels_for.add(a["for"])
            # A label wrapping its control associates implicitly, with no
            # `for` and often no id on the field at all.
            self.in_label = True
        if tag in ("input", "select", "textarea"):
            self.inputs.append((
                a.get("type", "text"),
                a.get("id"),
                bool(a.get("aria-label") or a.get("aria-labelledby"))
                or self.in_label,
            ))


def parse(path):
    p = Page()
    text = path.read_text(encoding="utf-8", errors="replace")
    # comments carry install notes and placeholders; strip for markup checks
    p.feed(re.sub(r"<!--.*?-->", "", text, flags=re.S))
    return p, text


# ------------------------------------------------------------------ main ----

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("build", help="folder holding the html + assets/")
    ap.add_argument("--config", help="JSON with tokens/contrast/slugs/forbidden")
    # This build keeps its assets inside the plugin, because the host has
    # no SFTP and a plugin is the only thing wp-admin can install that
    # ships its own files. There is no single combined stylesheet any more --
    # home/pages/legacy are enqueued separately per page tier, so checking for
    # a class needs the union of all three, comma-separated.
    ap.add_argument(
        "--css",
        default=(
            "plugins/acrylic-pros-content/assets/home.css,"
            "plugins/acrylic-pros-content/assets/pages.css,"
            "plugins/acrylic-pros-content/assets/legacy.css"
        ),
    )
    args = ap.parse_args()

    build = Path(args.build).resolve()
    if not build.is_dir():
        sys.exit(f"not a directory: {build}")

    cfg = {}
    if args.config:
        cfg = json.loads(Path(args.config).read_text(encoding="utf-8"))

    # Page bodies live in pages/ and products/; the chrome fragments sit
    # at the top level.
    pages = sorted(build.glob("*.html"))
    pages += sorted((build / "pages").glob("*.html"))
    pages += sorted((build / "products").glob("*.html"))
    if not pages:
        sys.exit(f"no .html files in {build}")

    css_rel_paths = [p.strip() for p in args.css.split(",") if p.strip()]
    css_parts = []
    for rel in css_rel_paths:
        p = build / rel
        if p.exists():
            css_parts.append(p.read_text(encoding="utf-8"))
    css = "\n".join(css_parts)
    check(f"stylesheet(s) found ({args.css})", bool(css), ", ".join(css_rel_paths))

    # -- stylesheet parses -------------------------------------------------
    if css:
        bare = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
        check("css braces balance",
              bare.count("{") == bare.count("}"),
              f"{bare.count('{')} open / {bare.count('}')} close")
        check("no two opening braces on one line",
              not [l for l in bare.splitlines() if l.count("{") > 1 and "}" not in l])
        # @import must be the first statement or browsers drop it silently.
        # Search the comment-stripped copy: prose mentioning @import is not one.
        imp = re.search(r"@import", bare)
        if imp:
            check("@import is the first statement",
                  bare[:imp.start()].strip() == "",
                  "a rule above @import makes browsers ignore it")

    # -- design tokens -----------------------------------------------------
    tokens = {}
    if css:
        m = re.search(r":root\s*\{(.*?)\n\s*\}", css, flags=re.S)
        if m:
            tokens = {k: v.strip() for k, v in
                      re.findall(r"(--[\w-]+)\s*:\s*([^;]+);", m.group(1))}
    for name, want in (cfg.get("tokens") or {}).items():
        got = tokens.get(name, "")
        check(f"token {name}", got.strip().upper() == want.strip().upper(),
              f"got {got!r}")

    for pair in cfg.get("contrast") or []:
        fg, bg, minimum = pair[0], pair[1], (pair[2] if len(pair) > 2 else 4.5)
        ratio = contrast(tokens.get(fg, fg), tokens.get(bg, bg))
        check(f"contrast {fg} on {bg} >= {minimum}",
              ratio is not None and ratio >= minimum,
              f"{ratio:.2f}:1" if ratio else "unparseable")

    # -- per page ----------------------------------------------------------
    used_classes = set()
    forbidden = DEFAULT_FORBIDDEN + (cfg.get("forbidden") or [])
    known = set(cfg.get("slugs") or [])
    known |= {"/" + p.stem + "/" for p in pages} | {"/"}
    # Every generated product body is a real /product/<slug>/ once imported;
    # the config list only ever named the 69 glass tanks.
    known |= {"/product/" + p.stem + "/" for p in (build / "products").glob("*.html")}
    chrome_text = {}

    for path in pages:
        page, raw = parse(path)
        name = path.name
        used_classes |= page.classes

        dupes = {i for i in page.ids if page.ids.count(i) > 1}
        check(f"{name}: no duplicate ids", not dupes, str(sorted(dupes)))

        h1s = page.headings.count(1)
        # header/footer partials legitimately have no h1
        if name not in (cfg.get("chrome") or ["header.html", "footer.html"]):
            check(f"{name}: exactly one h1", h1s == 1, f"found {h1s}")
        jumps = [(a, b) for a, b in zip(page.headings, page.headings[1:]) if b > a + 1]
        check(f"{name}: no skipped heading levels", not jumps, str(jumps[:3]))

        noalt = [s for s, alt in page.images if alt is None]
        check(f"{name}: every img has an alt attribute", not noalt,
              f"{len(noalt)} missing, e.g. {noalt[:2]}")

        dead = [h for h in page.links if h.strip() in ("#", "")]
        check(f"{name}: no placeholder href='#'", not dead, f"{len(dead)} found")

        internal = [h for h in page.links
                    if h.startswith("/") and "#" not in h[1:2]]
        # Split on ? as well as #: /quote/?tank=... is the quote page, and the
        # product pages rely on that query to prefill the form.
        unknown = [h for h in internal
                   if re.split(r"[?#]", h)[0] not in known]
        check(f"{name}: internal links resolve to a known page", not unknown,
              str(sorted(set(unknown))[:4]))

        rel = [h for h in page.links if h.startswith("../") or h.endswith(".html")]
        check(f"{name}: no relative or .html links", not rel,
              str(sorted(set(rel))[:4]))

        hits = [w for w in forbidden if w.lower() in raw.lower()]
        check(f"{name}: no forbidden strings", not hits, str(hits))

        mixed = MIXED.findall(raw)
        check(f"{name}: no http:// assets or links", not mixed,
              f"{len(mixed)} mixed-content URLs")

        unlabelled = [i for t, i, aria in page.inputs
                      if t not in ("hidden", "submit", "button")
                      and not aria and (i is None or i not in page.labels_for)]
        check(f"{name}: every field has a label or aria-label", not unlabelled,
              f"{len(unlabelled)} unlabelled")

        if name in (cfg.get("chrome") or ["header.html", "footer.html"]):
            chrome_text[name] = raw
        else:
            # chrome lives in its own template; a page carrying its own
            # <header>/<footer> means it will render twice, or drift
            stray = re.findall(r"<(header|footer)[\s>]", raw, flags=re.I)
            check(f"{name}: no chrome markup inside the page body",
                  not stray, str(sorted(set(stray))))

    # -- classes with no rule behind them ---------------------------------
    if css:
        defined = set(re.findall(r"\.(-?[A-Za-z_][\w-]*)",
                                 re.sub(r"/\*.*?\*/", "", css, flags=re.S)))
        # Classes that carry no styling on purpose — JS hooks, and a few that
        # were already dead in the prototype. Listed explicitly so that a
        # *new* orphan, which usually means a rule was lost in the
        # conversion, still fails this check.
        allowed = set(cfg.get("orphan_classes_allowed") or [])
        orphans = sorted(c for c in used_classes
                         if c not in defined
                         and c not in allowed
                         and not c.startswith(("wp-", "elementor")))
        check("every class in the html has a rule behind it",
              not orphans, f"{len(orphans)} orphans, e.g. {orphans[:6]}")

    # -- js ------------------------------------------------------------
    # Same per-tier split as the CSS above -- no single combined file exists.
    js_names = ["lenis.min.js", "pages.js", "home.js", "main.js"]
    js_parts = []
    for name in js_names:
        p = build / "plugins/acrylic-pros-content/assets" / name
        if p.exists():
            js_parts.append(p.read_text(encoding="utf-8", errors="replace"))
    if js_parts:
        js = "\n".join(js_parts)
        check("js braces balance (all tiers)", js.count("{") == js.count("}"),
              f"{js.count('{')} / {js.count('}')}")
        warn("js has console.log left",
             "console.log(" not in js,
             f"{js.count('console.log(')} calls - fine while debugging, noise at handover")

    print()
    print(f"{CHECKED - len(FAILS)}/{CHECKED} passed")
    if FAILS:
        print("\nfailed:")
        for f in FAILS:
            print("  -", f)
        sys.exit(1)


if __name__ == "__main__":
    main()
