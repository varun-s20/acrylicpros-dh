#!/usr/bin/env python3
"""Generate src/partials/gallery-grid.html from data/gallery.json, and
src/partials/featured-chapters.html (Featured Projects page) from data/featured.json.

The gallery is 40+ items; hand-writing each <picture> block invites typos in
alt text and srcset. Descriptions come from a visual audit of the client's
photographs - they describe what is actually in each frame and never assert a
client, project name or location that was not confirmed.

CARD SHAPE. This emits Aquatique Show's `m-referenceCard`: a flat colour tile
with the photograph inset as a portrait behind the title, or - for roughly
half the tiles - a "-fullart" tile where the photograph fills the card. The
colours cycle a fixed run (assets/home/pages.css) so a grid of any length
stays varied without anyone hand-picking one per project.

Each tile's title is a <button data-open> whose ::before covers the card, so
the whole tile opens the lightbox (assets/home/pages.js). data-category drives
the filter pill.
"""
import io
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data", "gallery.json")
MANIFEST = os.path.join(ROOT, "assets", "image-manifest.json")
OUT = os.path.join(ROOT, "src", "partials", "gallery-grid.html")
FEATURED_DATA = os.path.join(ROOT, "data", "featured.json")
FEATURED_OUT = os.path.join(ROOT, "src", "partials", "featured-chapters.html")

# Full-art tiles fill a quarter-column card; inset tiles use 57% of it.
SIZES = "(min-width: 1367px) 24vw, (min-width: 1025px) 32vw, (min-width: 641px) 48vw, 94vw"

COLOURS = ["-bggreen", "-fullart", "-bgocre", "-fullart", "-bgblue",
           "-bgpurple", "-fullart", "-bgorange", "-fullart", "-fullart"]

LABELS = {
    "custom-aquariums": "Custom Aquarium",
    "restoration": "Restoration",
    "commercial": "Commercial",
    "residential": "Residential",
    "ponds": "Pond",
    "pool-panels": "Pool Panel",
    "maintenance": "Maintenance",
    "fabrication": "Fabrication",
}

CARD = """      <article class="o-referenceGrid__item" data-card data-category="%(category)s">
        <div class="m-referenceCard -photo">
          <div class="m-referenceCard__link">
            <h2><button class="m-referenceCard__open" type="button" data-open
                data-full="%(src)s" data-title="%(title)s" data-alt="%(alt)s"><span class="sr-only">%(title)s</span></button></h2>
          </div>
          <picture>
            <source type="image/webp"
                    srcset="%(srcset)s"
                    sizes="%(sizes)s">
            <img class="m-referenceCard__image" src="%(src)s" alt=""
                 width="%(w)d" height="%(h)d" loading="lazy" decoding="async">
          </picture>
        </div>
      </article>"""


def label(cat):
    return LABELS.get(cat, cat.replace("-", " ").title())


# ---- Featured projects page ----------------------------------------------
# Each row is a justified strip: a tile's flex-grow is its aspect ratio, so
# every photo in a row renders at the same height with no cropping. No
# captions (client, 21 Sept); the title still shows in the lightbox. --sum caps
# the row's width (pages.css) so a row of two portraits does not go 900px tall.
CHAPTER = """<section class="o-featured__chapter" id="%(id)s" aria-labelledby="%(id)s-title">
  <div class="row">
    <div class="o-featured__head" data-scroll>
      <p class="o-featured__num" aria-hidden="true">%(num)02d</p>
      <h2 class="tx-h3 o-featured__title" id="%(id)s-title">%(title)s</h2>
      <div class="o-featured__intro">
        <p class="tx-p">%(copy)s</p>
        <a class="a-link tx-cta" href="%(href)s">%(label)s</a>
      </div>
    </div>
%(rows)s
  </div>
</section>"""

PHOTO = """      <div class="m-projectTile" data-card style="--a:%(a).4f">
        <button class="m-projectTile__open" type="button" data-open aria-label="Enlarge: %(title)s"
            data-full="%(src)s" data-title="%(title)s" data-alt="%(alt)s">
          <picture>
            <source type="image/webp" srcset="%(srcset)s" sizes="%(sizes)s">
            <img class="m-projectTile__image" src="%(src)s" alt="" width="%(w)d" height="%(h)d" loading="lazy" decoding="async">
          </picture>
        </button>
      </div>"""

VIDEO = """      <div class="m-projectTile -video" style="--a:%(a).4f">
        <video class="m-projectTile__image" muted loop playsinline preload="none" width="%(w)d" height="%(h)d"
               poster="%(poster)s" data-lazy-src="%(video)s" aria-label="%(alt)s"></video>
      </div>"""


def build_featured(manifest):
    chapters = json.load(io.open(FEATURED_DATA, encoding="utf-8"))
    out, missing, no = [], [], 0
    # Chapter 01 is the scratch-removal film, hand-written in the page body
    # (client, 22 Sept: first), so the generated chapters number from 02.
    for n, ch in enumerate(chapters, 2):
        rows = []
        for row in ch["rows"]:
            tiles = []
            for it in row:
                if "video" in it:
                    it["a"] = it["w"] / float(it["h"])
                    continue
                key = it["src"][len("assets/"):]
                entry = manifest.get(key)
                if not entry:
                    missing.append(it["src"])
                    it["a"] = 1.0
                    continue
                it.update(w=entry["w"], h=entry["h"], a=entry["w"] / float(entry["h"]), entry=entry)
            total = sum(it["a"] for it in row)
            for it in row:
                if "video" in it:
                    tiles.append(VIDEO % it)
                elif "entry" in it:
                    no += 1
                    share = int(round(100 * it["a"] / total))
                    tiles.append(PHOTO % dict(
                        it, no=no,
                        sizes="(min-width: 1441px) %dpx, (min-width: 641px) %dvw, 100vw"
                              % (round(1440 * it["a"] / total), share),
                        srcset=", ".join("%s %dw" % (d["path"], d["w"]) for d in it["entry"]["webp"])))
            rows.append('    <div class="m-justified" data-scroll style="--sum:%.4f">\n%s\n    </div>'
                        % (total, "\n".join(tiles)))
        out.append(CHAPTER % dict(ch, num=n, href=ch["link"]["href"], label=ch["link"]["label"],
                                  rows="\n".join(rows)))
    header = ("<!-- Generated by tools/build_gallery.py from data/featured.json.\n"
              "     Edit the JSON, not this file. -->\n")
    io.open(FEATURED_OUT, "w", encoding="utf-8").write(header + "\n\n".join(out) + "\n")
    print("Wrote %d featured chapters (%d photos) to src/partials/featured-chapters.html"
          % (len(chapters), no))
    return missing


def main():
    items = json.load(io.open(DATA, encoding="utf-8"))
    manifest = json.load(io.open(MANIFEST, encoding="utf-8"))

    blocks = []
    missing = []

    for item in items:
        src = item["src"]
        key = src[len("assets/"):] if src.startswith("assets/") else src
        entry = manifest.get(key)
        if not entry:
            missing.append(src)
            continue

        cats = item["category"].split()
        meta = " &middot; ".join(label(c) for c in cats[1:]) or "Project"

        blocks.append(CARD % {
            "category": item["category"],
            "colour": COLOURS[len(blocks) % len(COLOURS)],
            "src": src,
            "title": item["title"],
            "alt": item["alt"],
            "kind": label(cats[0]),
            "meta": meta,
            "sizes": SIZES,
            "srcset": ",\n                      ".join(
                "%s %dw" % (d["path"], d["w"]) for d in entry["webp"]),
            "w": entry["w"],
            "h": entry["h"],
        })

    header = (
        "<!-- Generated by tools/build_gallery.py from data/gallery.json.\n"
        "     Edit the JSON, not this file. -->\n"
    )
    io.open(OUT, "w", encoding="utf-8").write(header + "\n".join(blocks) + "\n")

    print("Wrote %d gallery cards to src/partials/gallery-grid.html" % len(blocks))
    counts = {}
    for item in items:
        for cat in item["category"].split():
            counts[cat] = counts.get(cat, 0) + 1
    for cat in sorted(counts):
        print("  %-20s %d" % (cat, counts[cat]))
    missing += build_featured(manifest)
    if missing:
        print("\nMISSING from image manifest (not rendered):")
        for m in missing:
            print("  " + m)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
