#!/usr/bin/env python3
"""Generate the glass-tank catalogue from data/products.json.

Produces:
  src/partials/product-grid.html     tank cards for glass-tanks.html
  src/partials/product-ranges.html   "shop by range" tiles
  src/partials/product-compare.html  "ranges at a glance" table
  product/<slug>.html                one page per tank
  src/partials/acrylic-grid.html     quote-only cards for acrylic-tanks.html
  src/partials/acrylic-ranges.html   its "shop by style" tiles  (data/acrylic-tanks.json)

There is NO cart and NO checkout anywhere in the output. Every call to
action routes to the quote page or the phone, because this build has no
commerce backend and must not imply one.

Every word shown comes from the product data (names, prices and
descriptions copied from acrylicpros.com) or the live warranty page.

    python tools/build_products.py
"""
import html
import io
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data", "products.json")
MANIFEST = os.path.join(ROOT, "assets", "image-manifest.json")
PARTIALS = os.path.join(ROOT, "src", "partials")
OUT_DIR = os.path.join(ROOT, "product")

SITE_URL = "https://acrylicpros.com/"

# Display order follows the live shop's first page.
RANGES = [
    ("peninsula", "Peninsula"),
    ("starphire", "Starphire"),
    ("reef-pro", "Reef Pro"),
    ("aqua-japan", "Aqua Japan"),
    ("frag", "Frag Tanks"),
    ("shallow-peninsula", "Shallow Peninsula"),
    ("marine", "Marine"),
    ("aio", "All-in-One"),
    ("specialty", "Specialty"),
]
RANGE_LABELS = dict(RANGES)

ACRYLIC_DATA = os.path.join(ROOT, "data", "acrylic-tanks.json")
ACRYLIC_RANGES = [
    ("curved", "Curved &amp; bow front"),
    ("cylinder", "Cylinders"),
    ("rectangular", "Rectangular"),
    ("overflow", "Built-in overflows"),
    ("in-wall", "In-wall"),
]
ACRYLIC_RANGE_LABELS = dict(ACRYLIC_RANGES)

# Lines in the descriptions that are a label with the value on the next line.
SPEC_LABELS = ["Tank Size", "Glass Thickness", "Capacity", "Overflow Box",
               "Sump Size", "Overall size"]

ARROW = '<svg class="a-svg" aria-hidden="true"><use href="#i-arrow-right"/></svg>'

WARRANTY_SUMMARY = (
    "This aquarium is warranted against leaks and or cracks due to defects from in the "
    "materials or workmanship for a period of 6 months from the date of purchase. In "
    "addition, this aquarium is further warranted against leakage caused by sealant "
    "failure for 2 years from the date of purchase.")


def esc(text):
    return html.escape(text or "", quote=True)


def read(path):
    return io.open(path, encoding="utf-8").read()


def write_if_changed(path, text):
    old = read(path) if os.path.isfile(path) else None
    if old != text:
        io.open(path, "w", encoding="utf-8").write(text)
        return 1
    return 0


def titleise(name):
    """The catalogue is authored in shouting caps; title case reads better.

    Dimension tokens (48x24x24), unit prefixes (120 GAL) and initialisms are
    preserved, because lower-casing those makes the spec unreadable.
    """
    keep = {"GAL", "AIO", "AJ", "T", "W", "S", "LED", "PVC"}
    out = []
    for word in re.split(r"(\s+)", name.strip()):
        if not word.strip():
            out.append(word)
            continue
        # hyphenated words ("TANK-BLACK") are cased part by part
        parts = []
        for part in re.split(r"(-)", word):
            bare = part.strip(",–")
            if (not bare or bare.upper() in keep
                    or re.search(r"\d", bare)   # sizes and model codes (AJ-28P)
                    or len(bare) <= 2):
                parts.append(part)
            else:
                parts.append(part[0].upper() + part[1:].lower())
        out.append("".join(parts))
    return "".join(out)


def facts(p):
    """Short, factual chips derived from the product name."""
    n = p["name"].upper()
    chips = []
    g = re.search(r"(\d+)\s*[TWS]?[\s-]*GAL", n)
    if g:
        chips.append("%s gal" % g.group(1))
    d = re.search(r"(\d+)\s*[X×]\s*(\d+)\s*[X×]\s*(\d+)", n)
    if d:
        chips.append("%s × %s × %s″" % d.groups())
    if "STARPHIRE" in n:
        chips.append("Starphire glass")
    elif "LOW IRON" in n:
        chips.append("Low iron glass")
    if "BLACK" in n and "STAND" in n:
        chips.append("Black stand")
    elif "WHITE" in n and "STAND" in n:
        chips.append("White stand")
    if "ALUMINUM FRAME" in n:
        chips.append("Aluminum frame")
    return chips, (int(g.group(1)) if g else 0)


def split_description(lines):
    """-> (spec rows [(label, value)], bullet lines, shipping line or None)"""
    rows, bullets, shipping = [], [], None
    lines = [l.strip() for l in lines if l.strip()]
    i = 0
    while i < len(lines):
        line = lines[i]
        clean = re.sub(r"^[-–•]\s*", "", line).strip()
        if "FREIGHT" in line.upper() and "SHIPPING" in line.upper():
            shipping = clean
        elif clean in SPEC_LABELS and i + 1 < len(lines):
            value = re.sub(r"^[-–•]\s*", "", lines[i + 1]).strip()
            # a second value line (e.g. mm after inches) joins the first
            if (i + 2 < len(lines) and re.match(r"^[\d.]+\s*[x×]\s*[\d.]+", lines[i + 2])
                    and lines[i + 2] not in SPEC_LABELS):
                value += " / " + lines[i + 2]
                i += 1
            rows.append((clean, value))
            i += 1
        else:
            bullets.append(clean)
        i += 1
    return rows, bullets, shipping


def picture(entry, src, alt, sizes, loading="lazy", priority=False, prefix=""):
    if not entry:
        return ""
    srcset = ", ".join("%s%s %dw" % (prefix, d["path"], d["w"]) for d in entry["webp"])
    return ('<picture><source type="image/webp" srcset="%s" sizes="%s">'
            '<img src="%s%s" alt="%s" width="%d" height="%d"%s decoding="async"></picture>'
            % (srcset, sizes, prefix, src, esc(alt), entry["w"], entry["h"],
               ' fetchpriority="high"' if priority else ' loading="%s"' % loading))


def price_value(p):
    try:
        return float(p["price"].replace(",", ""))
    except (AttributeError, ValueError):
        return 0.0


def build_acrylic(entry_for):
    """acrylic-tanks.html: the same card and tile markup as the glass
    catalogue, but quote-only. The live shop sells no acrylic SKUs, so each
    card is a style of tank the Pros have built, not a priced product; the
    card links straight to the quote form with the style pre-filled.

    Real SKUs can go into data/acrylic-tanks.json later as extra entries.
    """
    tanks = json.load(io.open(ACRYLIC_DATA, encoding="utf-8"))
    cards = []
    for t in tanks:
        href = "quote.html?kind=acrylic&amp;tank=%s" % esc(re.sub(r"\s+", "+", t["name"]))
        media = picture(entry_for(t["image"]), t["image"], t["name"],
                        "(min-width: 1025px) 22vw, (min-width: 641px) 45vw, 90vw")
        cards.append(
            '<article class="m-tankCard" data-tank data-range="%s" data-price="0" data-gallons="0" data-name="%s">\n'
            '  <a class="m-tankCard__link" href="%s">\n'
            '    <div class="m-tankCard__media">%s</div>\n'
            '    <div class="m-tankCard__body">\n'
            '      <p class="m-tankCard__range">%s</p>\n'
            '      <h3 class="m-tankCard__name">%s</h3>\n'
            '      <ul class="m-tankCard__chips">%s</ul>\n'
            '      <div class="m-tankCard__foot"><span class="m-tankCard__price">Price on request</span>'
            '<span class="m-tankCard__cta">Request a quote %s</span></div>\n'
            '    </div>\n'
            '  </a>\n'
            '</article>' % (t["range"], esc(t["name"].lower()), href, media,
                            ACRYLIC_RANGE_LABELS[t["range"]], esc(t["name"]),
                            "".join("<li>%s</li>" % c for c in t["chips"]), ARROW))
    tiles = []
    for key, label in ACRYLIC_RANGES:
        items = [t for t in tanks if t["range"] == key]
        if items:
            tiles.append(
                '<li><button class="m-rangeTile -photo" type="button" data-shop-range="%s">'
                '<span class="m-rangeTile__media">%s</span>'
                '<span class="m-rangeTile__label">%s</span>'
                '<span class="m-rangeTile__count">%d style%s</span></button></li>'
                % (key, picture(entry_for(items[0]["image"]), items[0]["image"], "",
                                "(min-width: 1025px) 14vw, 40vw"),
                   label, len(items), "" if len(items) == 1 else "s"))
    head = "<!-- Generated by tools/build_products.py from data/acrylic-tanks.json.\n     Edit the JSON, not this file. -->\n"
    return (write_if_changed(os.path.join(PARTIALS, "acrylic-grid.html"), head + "\n".join(cards) + "\n")
            + write_if_changed(os.path.join(PARTIALS, "acrylic-ranges.html"), head + "\n".join(tiles) + "\n"))


def main():
    products = json.load(io.open(DATA, encoding="utf-8"))
    manifest = json.load(io.open(MANIFEST, encoding="utf-8"))

    def entry_for(image):
        if not image:
            return None
        key = image[len("assets/"):] if image.startswith("assets/") else image
        return manifest.get(key)

    def card(p, prefix="", link_prefix="product/", heading="h3"):
        name = titleise(p["name"])
        chips, gallons = facts(p)
        entry = entry_for(p["image"])
        media = picture(entry, p["image"], name,
                        "(min-width: 1025px) 22vw, (min-width: 641px) 45vw, 90vw", prefix=prefix)
        price = ("$%s" % esc(p["price"])) if p["price"] else "Price on request"
        return (
            '<article class="m-tankCard" data-tank data-range="%(range)s" data-price="%(pv).2f" '
            'data-gallons="%(gal)d" data-name="%(sort)s">\n'
            '  <a class="m-tankCard__link" href="%(href)s">\n'
            '    <div class="m-tankCard__media">%(media)s</div>\n'
            '    <div class="m-tankCard__body">\n'
            '      <p class="m-tankCard__range">%(label)s</p>\n'
            '      <%(h)s class="m-tankCard__name">%(name)s</%(h)s>\n'
            '      <ul class="m-tankCard__chips">%(chips)s</ul>\n'
            '      <div class="m-tankCard__foot"><span class="m-tankCard__price">%(price)s</span>'
            '<span class="m-tankCard__cta">View tank %(arrow)s</span></div>\n'
            '    </div>\n'
            '  </a>\n'
            '</article>' % {
                "range": esc(p["range"]), "pv": price_value(p), "gal": gallons,
                "sort": esc(name.lower()), "href": link_prefix + p["slug"] + ".html",
                "media": media, "label": esc(RANGE_LABELS.get(p["range"], "Glass Tanks")),
                "h": heading, "name": esc(name),
                "chips": "".join("<li>%s</li>" % esc(c) for c in chips[:3]),
                "price": price, "arrow": ARROW})

    changed = 0

    # ---------- catalogue partials ---------------------------------------
    grid = "\n".join(card(p) for p in products)
    changed += write_if_changed(os.path.join(PARTIALS, "product-grid.html"),
                                "<!-- Generated by tools/build_products.py from data/products.json.\n"
                                "     Edit the JSON, not this file. -->\n" + grid + "\n")

    tiles, rows = [], []
    for key, label in RANGES:
        items = [p for p in products if p["range"] == key]
        if not items:
            continue
        lead = next((p for p in items if entry_for(p["image"])), items[0])
        entry = entry_for(lead["image"])
        tiles.append(
            '<li><button class="m-rangeTile" type="button" data-shop-range="%s">'
            '<span class="m-rangeTile__media">%s</span>'
            '<span class="m-rangeTile__label">%s</span>'
            '<span class="m-rangeTile__count">%d tank%s</span></button></li>'
            % (key, picture(entry, lead["image"], "", "(min-width: 1025px) 14vw, 40vw"),
               esc(label), len(items), "" if len(items) == 1 else "s"))
        gals = sorted(g for g in (facts(p)[1] for p in items) if g)
        prices = sorted(price_value(p) for p in items if price_value(p))
        rows.append(
            '<tr><th scope="row"><button type="button" data-shop-range="%s">%s</button></th>'
            '<td>%d</td><td>%s</td><td>%s</td></tr>'
            % (key, esc(label), len(items),
               ("%d – %d gal" % (gals[0], gals[-1]) if len(gals) > 1 and gals[0] != gals[-1]
                else ("%d gal" % gals[0] if gals else "—")),
               ("from $%s" % "{:,.2f}".format(prices[0])) if prices else "Price on request"))
    changed += write_if_changed(os.path.join(PARTIALS, "product-ranges.html"),
                                "<!-- Generated by tools/build_products.py -->\n"
                                + "\n".join(tiles) + "\n")
    changed += write_if_changed(os.path.join(PARTIALS, "product-compare.html"),
                                "<!-- Generated by tools/build_products.py -->\n"
                                + "\n".join(rows) + "\n")
    changed += build_acrylic(entry_for)

    # ---------- individual pages ------------------------------------------
    head_tpl = read(os.path.join(PARTIALS, "page-head.html"))
    header_tpl = read(os.path.join(PARTIALS, "page-header.html"))
    footer_tpl = read(os.path.join(PARTIALS, "home-footer.html"))

    # Pages live one level down, so every root-relative path shifts.
    def reroot(markup):
        markup = re.sub(r'(href|src|poster)="(assets/)', r'\1="../\2', markup)
        markup = re.sub(r'(href)="(?!\.\./|https?:|mailto:|tel:|sms:|#)([a-z0-9\-]+\.html)',
                        r'\1="../\2', markup)
        markup = markup.replace('srcset="assets/', 'srcset="../assets/')
        markup = markup.replace(' assets/', ' ../assets/')
        return markup

    os.makedirs(OUT_DIR, exist_ok=True)
    written = 0

    for p in products:
        name = titleise(p["name"])
        entry = entry_for(p["image"])
        slug = p["slug"]
        label = RANGE_LABELS.get(p["range"], "Glass Tanks")
        chips, _ = facts(p)
        spec_rows, bullets, shipping = split_description(p["description"])
        shipping = shipping or next((l for l in p["short_description"]
                                     if "FREIGHT" in l.upper()), None)

        media = picture(entry, p["image"], name, "(min-width: 1025px) 45vw, 92vw",
                        priority=True, prefix="../")
        media_block = media or "<!-- CLIENT COPY REQUIRED: product photography for this tank -->"

        spec_table = ("<table class=\"o-tank__table\"><tbody>%s</tbody></table>" % "".join(
            "<tr><th scope=\"row\">%s</th><td>%s</td></tr>" % (esc(k), esc(v)) for k, v in spec_rows)
        ) if spec_rows else ""
        spec_list = ("<ul class=\"o-tank__list\">%s</ul>" % "".join(
            "<li>%s</li>" % esc(b) for b in bullets)) if bullets else ""

        price = ("$%s" % esc(p["price"])) if p["price"] else "Price on request"
        quote_href = "../quote.html?tank=%s" % html.escape(re.sub(r"\s+", "+", name), quote=True)

        related = [q for q in products if q["range"] == p["range"] and q["slug"] != slug]
        related += [q for q in products if q["range"] != p["range"]]
        related_cards = "\n".join(card(q, prefix="../", link_prefix="", heading="h3")
                                  for q in related[:4])

        description = ("%s. %s glass aquarium from Acrylic Pros, %s.%s"
                       % (name, label, price,
                          (" " + shipping.capitalize()) if shipping else ""))[:300]

        meta = {
            "TITLE": "%s | Glass Tanks — Acrylic Pros" % esc(name),
            "DESCRIPTION": esc(description),
            "OG_TITLE": esc(name),
            "OG_DESCRIPTION": esc(description),
            "OG_TYPE": "product",
            "OG_IMAGE": p["image"] or "assets/images/headers/shop-header.jpg",
            "OG_IMAGE_ALT": esc(name),
            "CANONICAL": "product/%s.html" % slug,
            "BODY_CLASS": "t-inner t-shop t-product",
            "NAV": "glass-tanks",
            "SITE_URL": SITE_URL,
            "PRELOAD": "",
        }

        head = head_tpl
        header = header_tpl
        for key, value in meta.items():
            head = head.replace("{{%s}}" % key, value)
            header = header.replace("{{%s}}" % key, value)
        head = reroot(re.sub(r"\{\{[A-Z_]+\}\}", "", head))
        header = reroot(re.sub(r"\{\{[A-Z_]+\}\}", "", header))
        footer = reroot(footer_tpl)

        schema = {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": name,
            "sku": slug,
            "category": "Aquarium Tanks",
            "image": SITE_URL + p["image"] if p["image"] else "",
            "description": re.sub(r"\s+", " ", " ".join(p["description"]))[:500],
            "brand": {"@type": "Brand", "name": "Acrylic Pros"},
            "url": SITE_URL + "product/%s.html" % slug,
        }
        if p["price"]:
            schema["offers"] = {
                "@type": "Offer",
                "price": p["price"].replace(",", ""),
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock",
                "url": SITE_URL + "product/%s.html" % slug,
                "seller": {"@id": SITE_URL + "#business"},
            }

        banner = '''<section class="m-pageBanner -compact" data-page-hero>
  <div class="m-pageBanner__media" aria-hidden="true">
    <picture><source type="image/webp" srcset="../assets/images/headers/shop-header-768.webp 768w, ../assets/images/headers/shop-header-1280.webp 1280w, ../assets/images/headers/shop-header-1920.webp 1920w" sizes="100vw"><img src="../assets/images/headers/shop-header.jpg" alt="" width="1920" height="550" decoding="async"></picture>
  </div>
  <div class="m-pageBanner__inner">
    <nav class="m-pageBanner__crumbs" aria-label="Breadcrumb"><ol><li><a href="../index.html">Home</a></li><li><a href="../glass-tanks.html">Glass Tanks</a></li><li aria-current="page">%(name)s</li></ol></nav>
    <h1 class="m-pageBanner__title" data-page-title>%(name)s</h1>
  </div>
</section>
''' % {"name": esc(name), "label": esc(label)}

        accordions = []
        if spec_table or spec_list:
            accordions.append(('Specifications', spec_table + spec_list, True))
        if shipping:
            accordions.append(('Shipping', '<p>%s</p>' % esc(shipping), False))
        accordions.append(('Warranty', '<p>%s</p><p><a href="../warranty.html">Check Warranty Details</a></p>'
                           % esc(WARRANTY_SUMMARY), False))
        acc_html = "\n".join(
            '        <details class="o-tank__details"%s><summary>%s<span aria-hidden="true"></span></summary>'
            '<div class="o-tank__detailsBody">%s</div></details>' % (" open" if op else "", t, b)
            for t, b, op in accordions)

        trust = []
        if shipping:
            trust.append(('truck', 'Freight shipping', 'Need to ship by freight, no free shipping'))
        trust.append(('shield', 'Warranty', '6 months materials &amp; workmanship, 2 years sealant'))
        trust_html = "".join(
            '<li><span class="o-tank__trustIcon" aria-hidden="true"><svg class="a-svg"><use href="#i-%s"/></svg></span>'
            '<span><strong>%s</strong><span>%s</span></span></li>' % t for t in trust)

        body = '''%(banner)s
<section class="o-tank" aria-label="%(name)s">
  <div class="row">
    <div class="o-tank__grid">
      <div class="o-tank__media">%(media)s</div>
      <div class="o-tank__info">
        <p class="o-tank__range">%(label)s</p>
        <p class="o-tank__name">%(name)s</p>
        <p class="o-tank__price">%(price)s</p>
        <ul class="m-tankCard__chips -large">%(chips)s</ul>
        <div class="o-tank__actions">
          <a class="a-button -primary -bgdarkblue -clrwhite" href="%(quote)s"><span class="tx-cta">Request a quote</span>%(arrow)s</a>
          <a class="a-button -secondary -call" href="tel:+15625660150"><svg class="a-svg" aria-hidden="true"><use href="#i-phone"/></svg><span class="tx-cta">+1 (562) 566-0150</span></a>
        </div>
        <ul class="o-tank__trust">%(trust)s</ul>
%(acc)s
      </div>
    </div>
  </div>
</section>

<section class="o-shopHelp" aria-labelledby="help-title">
  <div class="row">
    <div class="o-shopHelp__card">
      <span class="o-shopHelp__icon" aria-hidden="true">?</span>
      <div>
        <h2 class="tx-h5" id="help-title">Questions about this tank?</h2>
        <p class="tx-p">Contact Us today for a free estimate regarding your new project and to learn more about our aquarium design company.</p>
      </div>
      <div class="o-shopHelp__actions">
        <a class="a-button -primary -bggold" href="%(quote)s"><span class="tx-cta">Request a quote</span>%(arrow)s</a>
        <a class="a-link tx-cta" href="tel:+15625660150">Call +1 (562) 566-0150</a>
      </div>
    </div>
  </div>
</section>

<section class="o-shopRelated" aria-labelledby="related-title">
  <div class="row">
    <div class="o-shopRelated__head">
      <h2 class="tx-h3" id="related-title">More <strong>glass tanks</strong></h2>
      <a class="a-link tx-cta" href="../glass-tanks.html">Back to all tanks</a>
    </div>
    <div class="o-shop__grid">
%(related)s
    </div>
  </div>
</section>
''' % {"banner": banner, "name": esc(name), "label": esc(label), "media": media_block,
       "price": price, "chips": "".join("<li>%s</li>" % esc(c) for c in chips),
       "quote": quote_href, "arrow": ARROW, "trust": trust_html, "acc": acc_html,
       "related": related_cards}

        out = (
            "<!-- Generated by tools/build_products.py from data/products.json.\n"
            "     Edit the JSON and regenerate; do not edit this file. -->\n"
            + head + "\n" + header + body + footer
            + '\n<script type="application/ld+json">\n'
            + json.dumps(schema, indent=1, ensure_ascii=False)
            + "\n</script>\n</body>\n</html>\n"
        )
        written += write_if_changed(os.path.join(OUT_DIR, slug + ".html"), out)

    print("Wrote %d product cards and %d range tiles (%d partial(s) changed)"
          % (len(products), len(tiles), changed))
    print("Generated %d product pages in product/ (%d changed)" % (len(products), written))


if __name__ == "__main__":
    main()
