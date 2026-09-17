#!/usr/bin/env python3
"""Collapse the per-weight woff2 duplicates into one variable file per
family/subset/style, and write a hand-authored fonts.css using variable
font-weight ranges.

Google Fonts serves Plus Jakarta Sans as a variable font but
advertises them as separate static weights, so the same bytes arrive 4-5
times under different filenames. Keeping one copy per axis cuts the font
payload by roughly two thirds with no visual change.
"""
import hashlib
import os
import re

FONT_DIR = r"C:\Users\varun\OneDrive\Desktop\s20\digital-heroes\acrylicpros\assets\fonts"

# unicode-range values as served by Google, kept verbatim so the browser only
# fetches latin-ext when a page actually uses those codepoints.
RANGES = {
    "latin": ("U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,"
              "U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,"
              "U+2212,U+2215,U+FEFF,U+FFFD"),
    "latin-ext": ("U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,"
                  "U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,"
                  "U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF"),
}

FAMILIES = [
    ("plus-jakarta-sans", "Plus Jakarta Sans", "500 800"),
]


def digest(path):
    with open(path, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()


kept, removed = [], 0
faces = []

for slug, family, weight_range in FAMILIES:
    for subset in ("latin", "latin-ext"):
        for style in ("normal", "italic"):
            pattern = re.compile(r"^%s-%s-\d+-%s\.woff2$" % (re.escape(slug), re.escape(subset), style))
            matches = sorted(n for n in os.listdir(FONT_DIR) if pattern.match(n))
            if not matches:
                continue
            digests = {digest(os.path.join(FONT_DIR, n)) for n in matches}
            canonical = "%s-%s-%s.woff2" % (slug, subset, style)
            src = os.path.join(FONT_DIR, matches[0])
            dst = os.path.join(FONT_DIR, canonical)
            os.replace(src, dst)
            for extra in matches[1:]:
                os.remove(os.path.join(FONT_DIR, extra))
                removed += 1
            kept.append((canonical, len(matches), len(digests)))
            faces.append(
                "@font-face {\n"
                "  font-family: '%s';\n"
                "  font-style: %s;\n"
                "  font-weight: %s;\n"
                "  font-display: swap;\n"
                "  src: url('./%s') format('woff2');\n"
                "  unicode-range: %s;\n"
                "}" % (family, style, weight_range, canonical, RANGES[subset])
            )

header = (
    "/* ---------------------------------------------------------------------\n"
    "   Acrylic Pros - self-hosted webfonts\n"
    "\n"
    "   Cormorant Garamond  - display only. SIL Open Font License 1.1.\n"
    "   DM Sans             - body, UI, navigation. SIL Open Font License 1.1.\n"
    "\n"
    "   Both are VARIABLE fonts: one file per subset/style covers weights\n"
    "   300-700. Google Fonts serves the same bytes once per advertised\n"
    "   weight, so these were de-duplicated (24 files -> 8).\n"
    "\n"
    "   Regenerate with tools/fetch_fonts.py then tools/dedupe_fonts.py.\n"
    "   --------------------------------------------------------------------- */\n\n"
)

with open(os.path.join(FONT_DIR, "fonts.css"), "w", encoding="utf-8") as f:
    f.write(header + "\n\n".join(faces) + "\n")

total = sum(os.path.getsize(os.path.join(FONT_DIR, n))
            for n in os.listdir(FONT_DIR) if n.endswith(".woff2"))
print("removed %d duplicate files" % removed)
for name, n, d in kept:
    print("  %-44s <- %d files, %d unique digest(s)" % (name, n, d))
print("font payload now: %.0f KB across %d files" % (total / 1024, len(kept)))
