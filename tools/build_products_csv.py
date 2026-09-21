#!/usr/bin/env python3
"""Turn data/products.json into a WooCommerce product import CSV.

    python tools/build_products_csv.py --site-url https://staging.example.com

WooCommerce's own importer lives at Products -> Import in wp-admin, so this
needs no SFTP and no WP-CLI.

Why --site-url is required
--------------------------
The Images column has to be a resolvable URL. WooCommerce checks whether an
attachment with that URL already exists before downloading anything, so if
wordpress/media/ has already been uploaded to the Media Library, the import
reuses those attachments instead of fetching 69 images over HTTP. Point it at
whichever install you are importing into. Nothing else in the build carries a
domain, and neither does the imported product: only this CSV does, and only
while it is being read.

The store is deliberately left unconfigured -- no tax, no shipping, no gateway.
These import as published catalogue entries whose call to action is the quote
form, which is what the static site does today.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "wordpress" / "products.csv"

# range slug -> the category name a human sees in wp-admin
RANGES = {
    "starphire": "Starphire glass",
    "aqua-japan": "Aqua Japan",
    "reef-pro": "Reef Pro",
    "frag": "Frag tanks",
    "peninsula": "Peninsula",
    "specialty": "Specialty",
    "marine": "Marine",
    "shallow-peninsula": "Shallow peninsula",
    "aio": "All-in-one",
}


def as_html(lines: list[str]) -> str:
    """The JSON holds the description as a list of lines, most of which start
    with a dash because that is how the original site wrote them. Keep them as
    a list, which is what they are, rather than shipping literal hyphens."""
    items = [re.sub(r"^[-–—]\s*", "", line).strip() for line in lines]
    items = [i for i in items if i]
    if not items:
        return ""
    if len(items) == 1:
        return f"<p>{items[0]}</p>"
    return "<ul>\n" + "\n".join(f"<li>{i}</li>" for i in items) + "\n</ul>"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--site-url",
        required=True,
        help="Base URL of the install being imported into, e.g. "
             "https://staging.example.com (no trailing slash)",
    )
    args = ap.parse_args()
    base = args.site_url.rstrip("/")

    products = json.loads((ROOT / "data" / "products.json").read_text(encoding="utf-8"))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", newline="", encoding="utf-8-sig") as fh:
        # utf-8-sig: WooCommerce's importer reads the BOM as the encoding hint,
        # and without it the ″ inch marks in every tank description arrive as
        # mojibake in the product copy.
        w = csv.writer(fh)
        w.writerow([
            "Type", "SKU", "Name", "Published", "Visibility in catalogue",
            "Short description", "Description", "In stock?",
            "Regular price", "Categories", "Images",
        ])

        for p in products:
            image = f"{base}/wp-content/uploads/{Path(p['image']).name}"
            w.writerow([
                "simple",
                p["slug"],
                p["name"],
                1,
                "visible",
                as_html(p.get("short_description", [])),
                as_html(p.get("description", [])),
                1,
                # "1,499.99" -> "1499.99". A thousands separator makes
                # WooCommerce read the price as 1.00 without complaining.
                p["price"].replace(",", ""),
                RANGES.get(p["range"], p["range"]),
                image,
            ])

    print(f"wrote {OUT.relative_to(ROOT)} — {len(products)} products")
    unknown = {p["range"] for p in products} - set(RANGES)
    if unknown:
        print(f"  note: unmapped ranges used as-is: {sorted(unknown)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
