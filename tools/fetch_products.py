#!/usr/bin/env python3
"""Scrape the live WooCommerce catalogue into data/products.json.

Captures name, price, slug, spec bullets and image for each SKU so the
static catalogue carries real data rather than transcribed approximations.
Run once; the JSON is then the source of truth for tools/build_products.py.
"""
import html
import io
import json
import os
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = {"User-Agent": "Mozilla/5.0 (catalogue migration for site owner)"}
SITEMAP = "https://acrylicpros.com/product-sitemap.xml"

# Range buckets, matched against the product name in order. The first hit wins,
# so the more specific patterns come first.
RANGES = [
    ("frag", r"\bFRAG TANK\b"),
    ("shallow-peninsula", r"\bSHALLOW PENINSULA\b"),
    ("peninsula", r"\bPENINSULA\b"),
    ("reef-pro", r"\bREEF PRO\b"),
    ("aqua-japan", r"\bAQUA JAPAN\b"),
    ("marine", r"\bMARINE AQUARIUM\b"),
    ("aio", r"\bAIO TANK\b"),
    ("starphire", r"\bSTARPHIRE|STAPHIRE\b"),
    ("specialty", r".*"),
]


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        return r.read().decode("utf-8", "replace")


def clean(text):
    text = re.sub(r"<[^>]+>", " ", text)
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def classify(name):
    upper = name.upper()
    for slug, pattern in RANGES:
        if re.search(pattern, upper):
            return slug
    return "specialty"


def main():
    print("Reading product sitemap ...")
    xml = get(SITEMAP)
    ns_img = "{http://www.google.com/schemas/sitemap-image/1.1}"
    ns_sm = "{http://www.sitemaps.org/schemas/sitemap/0.9}"

    entries = []
    for url_el in ET.fromstring(xml).iter(ns_sm + "url"):
        loc = url_el.find(ns_sm + "loc")
        if loc is None:
            continue
        url = loc.text.strip()
        # The sitemap also lists the /shop/ index; only real product URLs qualify.
        if "/product/" not in url:
            continue
        img = url_el.find(ns_img + "image/" + ns_img + "loc")
        entries.append((url, img.text.strip() if img is not None else None))

    print("Found %d product URLs. Fetching ..." % len(entries))
    products = []
    for i, (url, image) in enumerate(entries, 1):
        try:
            page = get(url)
        except Exception as exc:
            print("  !! %s -> %s" % (url, exc))
            continue

        name_m = re.search(r'<h1[^>]*class="[^"]*product_title[^"]*"[^>]*>(.*?)</h1>', page, re.S)
        if not name_m:
            name_m = re.search(r"<h1[^>]*>(.*?)</h1>", page, re.S)
        name = clean(name_m.group(1)) if name_m else ""

        price = ""
        pm = re.search(r'<p[^>]*class="[^"]*\bprice\b[^"]*"[^>]*>(.*?)</p>', page, re.S)
        if pm:
            am = re.search(r"([\d,]+\.\d{2})", clean(pm.group(1)))
            if am:
                price = am.group(1)

        def lines_from(fragment):
            fragment = re.sub(r"<br\s*/?>", "\n", fragment)
            fragment = re.sub(r"</(?:p|li|h\d)>", "\n", fragment)
            out = []
            for line in fragment.split("\n"):
                line = clean(line)
                if line and line.lower() != name.lower() and line not in out:
                    out.append(line)
            return out

        # Short description — carries the freight/shipping note on every SKU.
        short_lines = []
        sm = re.search(
            r'<div[^>]*class="[^"]*woocommerce-product-details__short-description[^"]*"[^>]*>(.*?)'
            r'(?=<form|<div[^>]*class="[^"]*product_meta|</div>\s*</div>)', page, re.S)
        if sm:
            short_lines = lines_from(sm.group(1))

        # Long description tab. The panel contains nested markup, so slice from
        # its opening tag to whichever section follows it rather than trying to
        # balance the divs.
        desc_lines = []
        start = page.find('id="tab-description"')
        if start != -1:
            start = page.find(">", start) + 1
            stops = [
                page.find("woocommerce-Tabs-panel--additional_information", start),
                page.find('id="tab-additional_information"', start),
                page.find("related products", start),
                page.find("Related Products", start),
                page.find("<h2>Related", start),
            ]
            stops = [s for s in stops if s != -1]
            end = min(stops) if stops else start + 6000
            desc_lines = lines_from(page[start:end])

        slug = url.rstrip("/").rsplit("/", 1)[-1]
        local_image = ""
        if image:
            fname = re.sub(r"[^A-Za-z0-9._-]", "-", urllib.parse.unquote(image.rsplit("/", 1)[-1]))
            candidate = os.path.join(ROOT, "assets", "images", "products", fname)
            if os.path.isfile(candidate):
                local_image = "assets/images/products/" + fname

        products.append({
            "slug": slug,
            "name": name,
            "price": price,
            "range": classify(name),
            "image": local_image,
            "source_image": image or "",
            "short_description": short_lines[:6],
            "description": desc_lines[:14],
            "source_url": url,
        })
        if i % 10 == 0:
            print("  %d/%d" % (i, len(entries)))

    products.sort(key=lambda p: (p["range"], p["name"]))
    os.makedirs(os.path.join(ROOT, "data"), exist_ok=True)
    out = os.path.join(ROOT, "data", "products.json")
    with io.open(out, "w", encoding="utf-8") as f:
        json.dump(products, f, indent=1, ensure_ascii=False)

    missing_price = [p["slug"] for p in products if not p["price"]]
    missing_image = [p["slug"] for p in products if not p["image"]]
    print("\nWrote %d products to data/products.json" % len(products))
    print("  without price: %d" % len(missing_price))
    print("  without a local image: %d" % len(missing_image))
    counts = {}
    for p in products:
        counts[p["range"]] = counts.get(p["range"], 0) + 1
    for k in sorted(counts):
        print("  %-20s %d" % (k, counts[k]))


if __name__ == "__main__":
    import urllib.parse
    sys.exit(main())
