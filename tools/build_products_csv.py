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
import sys
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

        # Advanced Acrylics' catalogue (tools/fetch_acrylic.py), when present.
        # Simple products: the price is the lowest option, and every option
        # with its price is listed in the description, as on the static page.
        # WooCommerce derives each URL from the name, and fetch_acrylic made
        # the static slugs the same way, so the links on /acrylic-tanks/ land.
        acrylic_file = ROOT / "data" / "acrylic-products.json"
        acrylic = json.loads(acrylic_file.read_text(encoding="utf-8")) if acrylic_file.exists() else []
        acrylic = [a for a in acrylic if a["images"]]  # as on the static shop: no photo, not listed
        if acrylic:
            sys.path.insert(0, str(Path(__file__).resolve().parent))
            from fetch_acrylic import GROUPS
            labels = dict(GROUPS)
        for a in acrylic:
            options = "".join(f"<tr><td>{v['title']}</td><td>${v['price']}</td></tr>"
                              for v in a["variants"])
            w.writerow([
                "simple", a["slug"], a["name"], 1, "visible", "",
                as_html(a["description"]) + (f"\n<table><tbody>{options}</tbody></table>" if options else ""),
                1,
                a["price_from"].replace(",", ""),
                f"Acrylic tanks > {labels[a['group']]}",
                ", ".join(f"{base}/wp-content/uploads/{Path(i).name}" for i in a["images"]),
            ])

    # WooCommerce derives each URL from the Name, and the plugin finds a
    # product's designed body by that same slug. A name that does not sanitise
    # to its slug therefore breaks both the links on /glass-tanks/ and the page
    # design, silently, so it is worth a line of arithmetic here.
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from fetch_acrylic import sanitize_title
    drift = [p["name"] for p in products if sanitize_title(p["name"]) != p["slug"]]
    if drift:
        print(f"  warning: {len(drift)} names do not sanitise to their slug, so "
              f"WooCommerce will give them a different URL: {drift[:3]}")

    print(f"wrote {OUT.relative_to(ROOT)} — {len(products)} glass + {len(acrylic)} acrylic products")
    unknown = {p["range"] for p in products} - set(RANGES)
    if unknown:
        print(f"  note: unmapped ranges used as-is: {sorted(unknown)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
