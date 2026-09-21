#!/usr/bin/env python3
"""Generate sitemap.xml and robots.txt from the built pages.

Priorities are set by role rather than guessed per page: the homepage first,
then the conversion pages, then services, then the catalogue, with legal and
the 404 excluded or demoted.
"""
import io
import os
import re
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://acrylicpros.com/"

# Never indexed.
EXCLUDE = {"404.html"}

PRIORITY = [
    (r"^index\.html$", "1.0", "weekly"),
    (r"^(quote|contact)\.html$", "0.9", "monthly"),
    (r"^(scratch-removal|services|gallery|featured-projects)\.html$", "0.9", "monthly"),
    (r"^(custom-builds-installations|acrylic-pool-panels|maintenance|"
     r"pond-design-construction|reef-insert-restoration|aquarium-relocations|"
     r"emergency-services|acrylic-sign-fabrication)\.html$", "0.8", "monthly"),
    (r"^(live-corals|tropical-fish|sharks|stingrays-eels|glass-tanks|acrylic-tanks|videos|"
     r"about|process)\.html$", "0.7", "monthly"),
    (r"^product/", "0.5", "monthly"),
    (r"^(warranty|refund-policy|privacy-policy)\.html$", "0.3", "yearly"),
]


def classify(path):
    for pattern, priority, freq in PRIORITY:
        if re.match(pattern, path):
            return priority, freq
    return "0.5", "monthly"


def main():
    pages = []
    for name in sorted(os.listdir(ROOT)):
        if name.endswith(".html") and name not in EXCLUDE:
            pages.append(name)

    product_dir = os.path.join(ROOT, "product")
    if os.path.isdir(product_dir):
        for name in sorted(os.listdir(product_dir)):
            if name.endswith(".html"):
                pages.append("product/" + name)

    # Homepage first, then the rest alphabetically — a sitemap that opens on
    # about.html reads as machine output rather than an ordered site.
    pages.sort(key=lambda n: (n != "index.html", n.startswith("product/"), n))

    today = time.strftime("%Y-%m-%d")
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']

    for path in pages:
        loc = SITE + ("" if path == "index.html" else path)
        priority, freq = classify(path)
        lines.append("  <url>")
        lines.append("    <loc>%s</loc>" % loc)
        lines.append("    <lastmod>%s</lastmod>" % today)
        lines.append("    <changefreq>%s</changefreq>" % freq)
        lines.append("    <priority>%s</priority>" % priority)
        lines.append("  </url>")

    lines.append("</urlset>")
    io.open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8").write(
        "\n".join(lines) + "\n")

    robots = """# robots.txt — acrylicpros.com
User-agent: *
Allow: /

# Build sources and tooling are not content.
Disallow: /src/
Disallow: /tools/
Disallow: /data/
Disallow: /docs/

Sitemap: %ssitemap.xml
""" % SITE
    io.open(os.path.join(ROOT, "robots.txt"), "w", encoding="utf-8").write(robots)

    print("sitemap.xml: %d URLs" % len(pages))
    print("robots.txt written")
    return 0


if __name__ == "__main__":
    sys.exit(main())
