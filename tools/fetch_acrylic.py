#!/usr/bin/env python3
"""Pull Advanced Acrylics' catalogue into data/acrylic-products.json.

    python tools/fetch_acrylic.py            # data + any missing photos
    python tools/fetch_acrylic.py --refresh  # re-download every photo

Client, 22 Sept 2026: "Advanced acrylics said yes copy all his pictures from
his website n put in the shop acrylic aquariums ... Arrange different." So
every product, photo, size and price on advancedacrylics.com (a Shopify store)
goes into our Acrylic Tanks shop, grouped and ordered our way rather than
theirs. Descriptions are kept verbatim; titles only lose their store
artifacts ("Copy of ...", bare handles, five spellings of "REF#").

Shopify serves the whole public catalogue as JSON, so nothing is scraped from
HTML. Photos are resized to 1200px and saved as JPEG under
assets/images/acrylic/ (tools/build_images.py then makes the WebP sizes).

Each product's slug names its static page, its photos and its WooCommerce SKU.
It is NOT always its WordPress URL: WordPress turns the slash in 3/4" into a
hyphen (".../tank-3-4-heavy-duty/") where the slug drops it ("tank-34-..."). The
slugs stay as they are, because the SKUs and photo file names are already live;
tools/build_wordpress.py points every link at sanitize_title(name) instead,
which is WordPress's own answer.
"""
from __future__ import annotations

import concurrent.futures as cf
import html
import io
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "acrylic-products.json"
IMG_DIR = ROOT / "assets" / "images" / "acrylic"
STORE = "https://advancedacrylics.com"
UA = {"User-Agent": "Mozilla/5.0 (catalogue import, with the owner's permission)"}
MAX_EDGE = 1200

# Our arrangement (the client asked for it to differ from theirs): the order
# the groups appear in, their labels, and the first rule that claims a
# product. Title keywords decide, not the store's collections -- theirs file
# sumps, cube tanks and a doser under "Auto Top Off".
GROUPS = [
    ("display", "Display tanks"),
    ("rimless", "Rimless tanks"),
    ("cube", "Cube, nano & pico"),
    ("frag", "Frag tanks"),
    ("sump", "Sumps & refugiums"),
    ("ato", "Auto top-off"),
    ("doser", "Dosing containers"),
    ("accessory", "Accessories"),
]

# Store artifacts: listings whose title is a bare handle.
TITLE_FIXES = {
    "ft121": 'REF# FT-PEN180 - 72x24x24 Peninsula Tank, 3/4" Heavy Duty',
    "pvcs154": 'REF# PVCS154 (84") - PVC/Hybrid Acrylic Sump',
}

# Products kept in the data but taken off the site for now (the file says why).
# Not a field in OUT, because every run of this script rewrites OUT.
HIDDEN = ROOT / "data" / "acrylic-hidden.json"


def hidden_slugs() -> set[str]:
    if not HIDDEN.exists():
        return set()
    return set(json.loads(HIDDEN.read_text(encoding="utf-8"))["slugs"])


def get_json(url: str):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def clean_title(t: str) -> str:
    t = re.sub(r"^\s*copy of\s+", "", t.strip(), flags=re.I)
    t = TITLE_FIXES.get(t, t)
    # REF#: / Ref #: / REF #: / REF:# / Ref# / REF: / Ref #  ->  REF#
    t = re.sub(r"^\s*ref\s*[:#]*\s*#?\s*:?\s*", "REF# ", t, flags=re.I)
    t = re.sub(r"\s+", " ", t).strip(" -")
    return t


def static_slug(t: str) -> str:
    """The static page / SKU / photo slug. An earlier, rougher copy of
    sanitize_title() that drops slashes and non-ASCII outright; kept because
    what it made is already live (see the module docstring)."""
    s = html.unescape(t).lower()
    s = re.sub(r"<[^>]*>", "", s)
    s = s.replace(".", "-")
    s = re.sub(r"[^a-z0-9\s_-]", "", s)
    s = re.sub(r"[\s_]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s


# sanitize_title_with_dashes(), 'save' context (wp-includes/formatting.php).
_WP_TO_HYPHEN = ("\u00a0", "\u2013", "\u2014", "&nbsp;", "&#160;", "&ndash;", "&#8211;",
                 "&mdash;", "&#8212;", "/", *map(chr, range(0x2000, 0x200b)), "\u205f", "\u3000")
_WP_STRIP = set("\u00ad\u00a1\u00bf\u00ab\u00bb\u2039\u203a\u2018\u2019\u201c\u201d\u201a\u201b"
                "\u201e\u201f\u2022\u00a9\u00ae\u00b0\u2026\u2122\u00b4\u02ca\u0301\u0341\u0300"
                "\u0304\u030c\u200b\u200c\u200d\u200e\u200f\u202a\u202b\u202c\u202d\u202e"
                "\u2060\u2061\u2062\u2063\u2064\u2065\u2066\u2067\u2068\u2069\u206a\u206b"
                "\u206c\u206d\u206e\u206f\ufeff\ufffc")


def sanitize_title(t: str) -> str:
    """The URL WordPress gives a post with this title (so WooCommerce, a
    product imported with this name). Slashes and dashes become hyphens, x
    replaces the multiplication sign, and any other non-ASCII character stays
    in as its percent-encoded bytes. (WordPress first transliterates accented
    letters; no product name has one, so that step is not copied.)"""
    s = re.sub(r"<[^>]*>", "", t).replace("%", "").lower()
    for ch in _WP_TO_HYPHEN:
        s = s.replace(ch, "-")
    s = "".join(c for c in s if c not in _WP_STRIP).replace("\u00d7", "x")
    s = re.sub(r"&.+?;", "", s).replace(".", "-")
    s = "".join(c if ord(c) < 128 else urllib.parse.quote(c).lower() for c in s)[:200]
    s = re.sub(r"[^%a-z0-9 _-]", "", s)
    s = re.sub(r"\s+", "-", s)
    return re.sub(r"-+", "-", s).strip("-")


def group_of(title: str) -> str:
    t = title.lower()
    if re.search(r"dosing|doser(?! holder)", t):
        return "doser"
    # "tank" excluded: FT140 etc. are frag *tanks* sold with frag racks.
    if "tank" not in t and re.search(r"camera|viewing box|sneeze|silencer|cleaner|probe holder|"
                                     r"frag rack|filtersock holder|sock holder|doser holder", t):
        return "accessory"
    if "cube tank combo" in t:
        return "cube"
    if re.search(r"sump|refugium|fuge", t):
        return "sump"
    if re.search(r"\bato\b|auto top off|a\.t\.o", t):
        return "ato"
    if "rimless" in t:
        return "rimless"
    if re.search(r"\bcube\b|pico|nano", t):
        return "cube"
    if "frag" in t:
        return "frag"
    return "display"


def description_lines(body: str) -> list[str]:
    """Their descriptions are HTML with <p>, <br> and <li>. One list item per
    line, verbatim."""
    body = re.sub(r"(?i)<br\s*/?>|</p>|</li>|</div>|</h\d>", "\n", body or "")
    text = html.unescape(re.sub(r"<[^>]+>", "", body))
    lines = [re.sub(r"\s+", " ", l).strip("  ") for l in text.split("\n")]
    return [l for l in lines if l]


def price_str(v: str) -> str:
    return "{:,.2f}".format(float(v))


def fetch_image(url: str, dest: Path, refresh: bool) -> tuple[int, int] | None:
    if dest.exists() and not refresh:
        with Image.open(dest) as im:
            return im.size
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=90) as r:
                data = r.read()
            im = ImageOps.exif_transpose(Image.open(io.BytesIO(data)))
            if im.mode in ("RGBA", "LA", "P"):
                bg = Image.new("RGB", im.size, (255, 255, 255))
                im = im.convert("RGBA")
                bg.paste(im, mask=im.split()[-1])
                im = bg
            im = im.convert("RGB")
            im.thumbnail((MAX_EDGE, MAX_EDGE), Image.LANCZOS)
            im.save(dest, "JPEG", quality=80, optimize=True, progressive=True)
            return im.size
        except Exception as exc:  # network hiccups: retry, then report
            err = exc
            time.sleep(1.5 * (attempt + 1))
    print(f"  !! {dest.name}: {err}")
    return None


def main() -> int:
    refresh = "--refresh" in sys.argv
    products = []
    for page in range(1, 10):
        batch = get_json(f"{STORE}/products.json?limit=250&page={page}")["products"]
        products += batch
        if len(batch) < 250:
            break
    print(f"{len(products)} products in the store")

    items, seen = [], {}
    for p in products:
        if "gift" in (p.get("product_type") or "").lower() or "gift card" in p["title"].lower():
            continue  # their store credit, not a product
        name = clean_title(p["title"])
        prices = sorted({float(v["price"]) for v in p["variants"]})
        item = {
            "slug": static_slug(name),
            "name": name,
            "group": group_of(name),
            "price_from": price_str(prices[0]) if prices else "",
            "price_to": price_str(prices[-1]) if prices else "",
            "variants": [
                # their option names often repeat the price ("... Tank - $425.00")
                {"title": re.sub(r"\s*[-–]?\s*\$\s?[\d,]+(\.\d+)?\s*$", "", v["title"]).strip() or v["title"],
                 "price": price_str(v["price"])}
                for v in p["variants"] if v["title"] not in ("Default Title", "Default")
            ],
            "description": description_lines(p.get("body_html", "")),
            "images": [i["src"].split("?")[0] for i in p["images"]],
            "source_url": f"{STORE}/products/{p['handle']}",
        }
        # Same name twice in their store: keep the listing that has photos.
        if name in seen:
            other = seen[name]
            if len(item["images"]) > len(other["images"]):
                items[items.index(other)] = item
                seen[name] = item
            print(f"  duplicate name, kept the one with photos: {name}")
            continue
        seen[name] = item
        items.append(item)

    slugs = [i["slug"] for i in items]
    dupes = {s for s in slugs if slugs.count(s) > 1}
    if dupes:
        raise SystemExit(f"slug collision: {sorted(dupes)}")
    glass = {p["slug"] for p in json.loads((ROOT / "data" / "products.json").read_text(encoding="utf-8"))}
    if glass & set(slugs):
        raise SystemExit(f"slug collides with a glass tank: {sorted(glass & set(slugs))}")

    # Photos: <slug>-<n>.jpg, downloaded in parallel.
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    jobs = {}
    with cf.ThreadPoolExecutor(max_workers=8) as pool:
        for it in items:
            for n, url in enumerate(it["images"], 1):
                dest = IMG_DIR / f"{it['slug'][:80].rstrip('-')}-{n}.jpg"
                jobs[pool.submit(fetch_image, url, dest, refresh)] = (it, n, dest)
        for fut in cf.as_completed(jobs):
            it, n, dest = jobs[fut]
            size = fut.result()
            if size:
                it.setdefault("_imgs", {})[n] = f"assets/images/acrylic/{dest.name}"
    for it in items:
        got = it.pop("_imgs", {})
        it["images"] = [got[n] for n in sorted(got)]

    order = {g: i for i, (g, _) in enumerate(GROUPS)}
    # Stable sort: our group order, photographed products before the few with
    # no photo, then the store's own order.
    items.sort(key=lambda i: (order[i["group"]], not i["images"]))

    OUT.write_text(json.dumps(items, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    counts = {g: sum(1 for i in items if i["group"] == g) for g, _ in GROUPS}
    print(f"wrote {OUT.relative_to(ROOT)}: {len(items)} products, "
          f"{sum(len(i['images']) for i in items)} photos")
    for g, label in GROUPS:
        print(f"  {label:20s} {counts[g]}")
    print(f"  no photo: {[i['name'] for i in items if not i['images']]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
