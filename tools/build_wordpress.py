#!/usr/bin/env python3
"""Generate the WordPress build from the static site.

Reads the built HTML in the repo root and emits wordpress/ :

    header.html                 Elementor Theme Builder -> Header
    chat.html                   Elementor Theme Builder -> Footer
    pages/<slug>.html           one Elementor HTML widget per page
    products/<slug>.html        the 69 SKU pages
    media/                      every image, flat, ready to bulk-upload
    plugins/acrylic-pros-content/assets/home.css, pages.css, legacy.css,
                                 lenis.min.js, pages.js, home.js, main.js, fonts, video

Run it again after any design change. Nothing here is hand-maintained.

Why the split lands where it does
---------------------------------
Every page has the same shape:

    <body>
      skip-link, SVG sprite, loader, header, menu, transition panels   <- chrome
      <div class="t-page"><div class="t-page__scroller">
        <main id="main"> ... </main>
        <footer class="o-footer"> ... </footer>
      </div></div>
      <div class="m-chat">                                            <- chrome
    </body>

The .t-page wrapper opens before <main> and closes after </footer>, so it
cannot be split across a Theme Builder header and footer -- Elementor's own
closing </div> would close the scroller instead, and the whole page would nest
inside it. So the wrapper and the site footer both travel with the page body,
and the footer is emitted as the [ap_footer] shortcode so there is still only
one copy of it to edit.
"""

from __future__ import annotations

import re
import shutil
import sys
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "wordpress"
PLUGIN = OUT / "plugins" / "acrylic-pros-content"

# Media Library with "organize into month/year folders" switched OFF, so the
# path has no date in it and cannot drift between the staging upload and the
# client's install.
# Where the Media Library serves files from. The default assumes
# "Organize my uploads into month- and year-based folders" is OFF, which is what
# README-WORDPRESS.md tells you to do before uploading anything.
#
# If the media was already uploaded with that box ticked, the files are under a
# dated folder instead and every image on the site 404s. Rather than re-upload
# 458 files, point the build at the real prefix:
#
#     python tools/build_wordpress.py --uploads /wp-content/uploads/2026/09
#
# then reinstall the plugin zip and press "Build the site" again.
UPLOADS = "/wp-content/uploads"
PLUGIN_URL = "/wp-content/plugins/acrylic-pros-content/assets"

# Concatenation order is load order. lenis before pages.js before home.js:
# pages.js clears the loader when a page is entered through the panel
# transition, and home.js assumes that has already happened.
CSS_FILES = ["home.css", "pages.css", "legacy.css"]
JS_FILES = ["lenis.min.js", "pages.js", "home.js"]

# Assets the chrome references directly, which never belong in the Media
# Library because the owner never edits them.
PLUGIN_ASSETS = ["smoke.mp4", "cloud.png", "fin.png"]

SKIP = {"404.html"}  # handled separately: Theme Builder -> Single -> 404


# ---------------------------------------------------------------- extraction

class Extracted:
    __slots__ = ("slug", "body_class", "nav", "chrome", "page", "footer", "chat")


def extract(html: str, slug: str) -> Extracted:
    """Split one built page into its four regions."""
    e = Extracted()
    e.slug = slug

    m = re.search(r'<body class="([^"]*)">\n', html)
    if not m:
        raise SystemExit(f"{slug}: no <body class>")
    e.body_class = m.group(1)
    after_body = m.end()

    start_page = html.find('<div class="t-page" data-page>')
    if start_page < 0:
        raise SystemExit(f"{slug}: no .t-page wrapper")

    end_footer = html.find("</footer>")
    if end_footer < 0:
        raise SystemExit(f"{slug}: no </footer>")
    end_footer += len("</footer>")

    start_chat = html.find('<div class="m-chat" data-chat>')
    if start_chat < 0:
        raise SystemExit(f"{slug}: no chat widget")
    end_chat = html.find("\n</body>", start_chat)
    if end_chat < 0:
        raise SystemExit(f"{slug}: unterminated body")

    e.chrome = html[after_body:start_page].rstrip()
    body = html[start_page:end_footer]
    e.chat = html[start_chat:end_chat].rstrip()

    # Split the page body from the site footer, and remember where the two
    # closing </div>s live so the page can be reassembled around [ap_footer].
    fstart = body.find('<footer class="o-footer">')
    if fstart < 0:
        raise SystemExit(f"{slug}: no site footer")
    e.page = body[:fstart].rstrip()
    e.footer = body[fstart:].strip()

    m = re.search(r'data-nav="([^"]*)"', e.chrome)
    e.nav = m.group(1) if m else ""

    # The chat region on some pages is followed by the JSON-LD block; the
    # schema is re-emitted by the plugin from src/schema/, so drop it here.
    e.chat = re.sub(
        r'\n<script type="application/ld\+json">.*',
        "",
        e.chat,
        flags=re.S,
    ).rstrip()

    return e


# ------------------------------------------------------------ path rewriting

PAGE_SLUGS: set[str] = set()
PRODUCT_SLUGS: set[str] = set()


def rewrite(markup: str) -> str:
    """Prototype paths -> WordPress paths. Root-relative throughout, so the
    later move to the client's domain is a database search-replace and
    nothing else."""

    # Internal page links: about.html -> /about/, index.html -> /
    # A product page links to its siblings with a bare `<slug>.html`, because
    # they sit in the same folder.
    # The tail is whatever follows .html -- a fragment, a query string, or
    # both. quote.html?tank=... is a real case: the product pages prefill the
    # quote form that way, and dropping the query would break the prefill.
    def page_link(m: re.Match) -> str:
        attr, folder, slug, tail = m.group(1), m.group(2), m.group(3), m.group(4) or ""
        if folder or slug in PRODUCT_SLUGS:
            return f'{attr}="/product/{slug}/{tail}"'
        if slug == "index":
            return f'{attr}="/{tail}"'
        if slug not in PAGE_SLUGS:
            raise SystemExit(f"link to unknown page: {slug}.html{tail}")
        return f'{attr}="/{slug}/{tail}"'

    markup = re.sub(
        r'\b(href)="(?:\.\./)?(product/)?([a-z0-9-]+)\.html([?#][^"]*)?"',
        page_link,
        markup,
    )

    # Chrome assets the owner never touches -> the plugin's own folder.
    # The `../` form has to go first: the bare form is a substring of it, and
    # replacing that first leaves a stray `../` in front of the new path.
    for name in PLUGIN_ASSETS:
        markup = markup.replace(f"../assets/home/{name}", f"{PLUGIN_URL}/{name}")
        markup = markup.replace(f"assets/home/{name}", f"{PLUGIN_URL}/{name}")

    # Everything else under assets/ -> the Media Library, flattened.
    # No two files in assets/ share a basename (checked in verify()), so the
    # flattening is lossless.
    markup = re.sub(
        r'(?:\.\./)?assets/(?:images|icons|video)/[A-Za-z0-9._/-]*?'
        r'([A-Za-z0-9._-]+\.(?:png|jpe?g|webp|gif|svg|mp4|webm))',
        lambda m: f"{UPLOADS}/{m.group(1)}",
        markup,
    )

    return markup


def normalise_chrome(text: str) -> str:
    """Strip the differences between the homepage chrome and the inner-page
    chrome, so that what is left can be compared for real drift.

    The homepage predates the data-nav mechanism and marks the current link in
    the markup instead; it also has no transition panels, because it was the
    only page when they were written. Everything else must match exactly, and
    assert_identical() is what proves it still does after a design change."""
    text = re.sub(r'<!--\s*Inner-page chrome.*?-->\n*', "", text, flags=re.S)
    text = re.sub(r'\s*data-nav(?:-item)?="[^"]*"', "", text)
    text = re.sub(r'\s*aria-current="page"', "", text)
    text = text.replace('o-menu__link tx-h3 -active"', 'o-menu__link tx-h3"')
    text = re.sub(r'\n*<div class="a-panel [^\n]*\n?', "", text)
    return text.rstrip()


# ------------------------------------------------------------------ assembly

def assemble_page(e: Extracted) -> str:
    """Page body + the footer shortcode + the wrapper's closing divs."""
    return f"{e.page}\n\n[ap_footer]\n\n</div>\n</div>\n"


def build_assets() -> None:
    """Ship the stylesheets and scripts as separate files, exactly as the
    static site loads them.

    They used to be concatenated into one global.css and one global.js served
    on every page. That was wrong, and wrong three times over, because the
    static site deliberately loads different combinations:

        homepage   home.css                      lenis + home.js
        inner      home.css + pages.css          lenis + pages.js + home.js
        legacy     + legacy.css                  + main.js

    Merging them changes the cascade for any page that did not originally load
    all three. Two single-class rules that never met now meet, and load order
    decides the winner. That is how the homepage picked up legacy's body colour
    and background, and how `.a-image { position: relative }` in pages.css beat
    `.o-homeShows__grid { position: absolute }` in home.css -- dropping the
    tile grid into flow, where it became a flex sibling and squeezed the text
    column from 1419px to 720px.

    Keeping the files separate and enqueuing the right set per page makes the
    cascade identical to the static site by construction, rather than by one
    patch per leak. inc/assets.php chooses the set from the body class.
    """
    src = ROOT / "assets" / "home"
    dst = PLUGIN / "assets"
    dst.mkdir(parents=True, exist_ok=True)

    def rewrite_css(text: str) -> str:
        # Images and video move to the Media Library.
        text = re.sub(
            r'url\(["\']?(?:\.\./|assets/)*(?:images|icons|video)/'
            r'[A-Za-z0-9._/-]*?([A-Za-z0-9._-]+\.'
            r'(?:png|jpe?g|webp|gif|svg|mp4|webm))["\']?\)',
            lambda m: f'url("{UPLOADS}/{m.group(1)}")',
            text,
        )
        # Fonts ship inside the plugin, beside the stylesheet. MatterVF is
        # deliberately absent -- it is the licensed reference face, and the
        # @font-face is a placeholder that fails over to Plus Jakarta Sans.
        text = re.sub(
            r'url\(["\']?(?:\.\./|assets/)*fonts/'
            r'[A-Za-z0-9._/-]*?([A-Za-z0-9._-]+\.woff2?)["\']?\)',
            lambda m: f'url("fonts/{m.group(1)}")',
            text,
        )
        for asset in PLUGIN_ASSETS:
            text = text.replace(f"../assets/home/{asset}", asset)
            text = text.replace(f"assets/home/{asset}", asset)
        return text

    # home.css is the only stylesheet every page loads, so the theme
    # neutraliser and the @font-face block ride with it.
    for name in CSS_FILES:
        text = rewrite_css((src / name).read_text(encoding="utf-8"))
        if name == "home.css":
            text = NEUTRALISER + FONT_FACE + "\n" + text
        (dst / name).write_text(text, encoding="utf-8")

    # The nav shim rides with home.js, which every page loads. home.js is
    # enqueued after pages.js, matching the static site's order.
    for name in JS_FILES:
        text = (src / name).read_text(encoding="utf-8")
        if name == "home.js":
            text = NAV_SHIM + "\n" + text
        (dst / name).write_text(text, encoding="utf-8")

    # The 17 legacy pages also load the old main.js, which the new system
    # replaced everywhere else. Leaving it out silently removed their
    # behaviour -- the old accordions, sliders and before/after draggers.
    shutil.copy2(ROOT / "assets" / "js" / "main.js", dst / "main.js")

    for name in PLUGIN_ASSETS:
        shutil.copy2(src / name, dst / name)

    fonts_dst = dst / "fonts"
    fonts_dst.mkdir(exist_ok=True)
    for f in (ROOT / "assets" / "fonts").glob("*.woff2"):
        shutil.copy2(f, fonts_dst / f.name)

    sizes = "  ".join(
        f"{n} {(dst / n).stat().st_size // 1024}K"
        for n in CSS_FILES + JS_FILES + ["main.js"]
    )
    print(f"  assets/         {sizes}")


def build_preview(page_files: list[Path], body_classes: dict[str, str],
                  navs: dict[str, str]) -> None:
    """Reassemble what WordPress will actually render, as plain local files.

    The page bodies in wordpress/pages/ are fragments, so nothing in this build
    could be opened and compared against the static site — which is how the
    homepage shipped with legacy.css repainting it. This puts the chrome, the
    body, the footer and the one global stylesheet back together with the same
    <html> and <body> classes WordPress emits, so the two can be diffed in a
    browser before anything is uploaded.

    It is a diagnostic, not a deliverable: nothing here is installed anywhere.
    """
    out = OUT / "preview"
    out.mkdir(parents=True, exist_ok=True)

    # Each stylesheet carries root-relative url(/wp-content/uploads/...)
    # references, which only resolve on a real WordPress. Served from the repo
    # root they 404, the backgrounds they paint disappear, and a comparison
    # against this measures the harness rather than the build. So the preview
    # links its own copies with just that prefix repointed.
    #
    # Two kinds of path need repointing, and missing either one silently
    # removes backgrounds from the preview and makes the comparison lie:
    #
    #   /wp-content/uploads/x     absolute, only resolves on a real WordPress
    #   cloud.png, fonts/x.woff2  relative to the stylesheet, which has moved
    #
    # The relative ones are the easier mistake: they are correct in
    # plugins/.../assets/*.css and break the moment the file is copied
    # somewhere else.
    assets_rel = "../plugins/acrylic-pros-content/assets"
    for name in CSS_FILES:
        css = (PLUGIN / "assets" / name).read_text(encoding="utf-8")
        css = css.replace(UPLOADS + "/", "../media/")
        for asset in PLUGIN_ASSETS:
            css = css.replace(f'url("{asset}")', f'url("{assets_rel}/{asset}")')
        css = css.replace('url("fonts/', f'url("{assets_rel}/fonts/')

        leftovers = re.findall(r'url\("(?!data:|https?:|\.\./)([^"]+)"\)', css)
        if leftovers:
            raise SystemExit(
                f"preview {name} still has stylesheet-relative url()s that will "
                "404: " + ", ".join(sorted(set(leftovers))[:6])
            )
        (out / name).write_text(css, encoding="utf-8")

    chrome = (OUT / "header.html").read_text(encoding="utf-8")
    chat = (OUT / "chat.html").read_text(encoding="utf-8")
    footer = re.sub(
        r"^<\?php.*?\?>\n", "",
        (PLUGIN / "templates" / "footer.php").read_text(encoding="utf-8"),
        flags=re.S,
    )

    def local(markup: str) -> str:
        """Root-relative WordPress paths -> paths that resolve from preview/."""
        markup = markup.replace(PLUGIN_URL, "../plugins/acrylic-pros-content/assets")
        markup = markup.replace(UPLOADS, "../media")
        return markup

    for f in page_files:
        slug = f.stem
        body = f.read_text(encoding="utf-8").replace("[ap_footer]", footer)
        key = "front" if slug == "index" else slug
        cls = body_classes.get("index" if slug == "index" else slug, "t-inner")
        nav = "home" if slug == "index" else navs.get(slug, "")

        # Same tiering as inc/assets.php. If these two ever disagree the
        # preview stops predicting WordPress, which is the one thing it is for.
        if "t-legacy" in cls:
            css_files = ["home.css", "pages.css", "legacy.css"]
            js_files = ["lenis.min.js", "pages.js", "home.js", "main.js"]
        elif "t-home" in cls:
            css_files = ["home.css"]
            js_files = ["lenis.min.js", "home.js"]
        else:
            css_files = ["home.css", "pages.css"]
            js_files = ["lenis.min.js", "pages.js", "home.js"]

        css_tags = "\n".join(
            f'<link rel="stylesheet" href="{n}">' for n in css_files)
        js_tags = "\n".join(
            f'<script src="../plugins/acrylic-pros-content/assets/{n}" defer></script>'
            for n in js_files)

        html = PREVIEW_HTML.format(
            title=slug,
            body_class=cls,
            nav=nav,
            css=css_tags,
            js=js_tags,
            chrome=local(chrome),
            body=local(body),
            chat=local(chat),
        )
        (out / f"{slug}.html").write_text(html, encoding="utf-8")

    print(f"  preview/        {len(page_files)} pages, openable locally")


def build_setup_payload(page_files: list[Path]) -> None:
    """Ship the page bodies and chrome inside the plugin, with a title for each.

    This is what lets the plugin build the whole site from wp-admin instead of
    someone creating 25 pages by hand and pasting 25 bodies into 25 HTML
    widgets. There is no WP-CLI on this host, so the plugin is the only thing
    that can do it.

    Titles come from each page's own breadcrumb — the "current page" crumb is
    already the short human name ("Scratch Removal", not the 70-character SEO
    title). Two pages have no breadcrumb and fall back to the slug.
    """
    import json

    data = PLUGIN / "data"
    (data / "pages").mkdir(parents=True, exist_ok=True)
    (data / "chrome").mkdir(parents=True, exist_ok=True)

    manifest = []
    for i, f in enumerate(page_files):
        slug = f.stem
        html = f.read_text(encoding="utf-8")

        m = re.search(r'aria-current="page">([^<]+)<', html)
        if slug == "index":
            title = "Home"
        elif m:
            title = unescape(m.group(1)).strip()
        else:
            title = slug.replace("-", " ").title()

        shutil.copy2(f, data / "pages" / f.name)
        manifest.append({"slug": slug, "title": title, "order": i})

    for name in ("header.html", "chat.html"):
        shutil.copy2(OUT / name, data / "chrome" / name)

    (data / "pages.json").write_text(
        json.dumps(manifest, indent=1, ensure_ascii=False), encoding="utf-8")
    print(f"  data/pages/     {len(manifest)} bodies + chrome, for the setup page")


def build_preloads() -> None:
    """Carry each page's LCP preload hint into the plugin.

    These live in the page's meta block, which becomes <head> in the static
    build. WordPress owns <head>, so nothing in wordpress/pages/ can carry
    them and they would silently be lost -- 14 pages' worth of "fetch the hero
    image first" telling the browser nothing at all. That is not a cosmetic
    difference from the static site; it is the largest paint on those pages
    losing its priority.

    Emitted on wp_head early, so the hint precedes the stylesheet it is meant
    to race.
    """
    rows = []
    for f in sorted((ROOT / "src" / "pages").glob("*.body.html")):
        if f.name == "404.body.html":
            continue
        m = re.search(r"^preload:\s*(.+)$",
                      f.read_text(encoding="utf-8"), flags=re.M)
        if not m:
            continue
        html = rewrite(m.group(1).strip())
        slug = f.name[: -len(".body.html")]
        key = "front" if slug == "index" else slug
        rows.append(f"\t\t'{key}' => {php_str(html)},")

    (PLUGIN / "inc").mkdir(parents=True, exist_ok=True)
    (PLUGIN / "inc" / "preload.php").write_text(
        PRELOAD_PHP.format(rows="\n".join(rows)), encoding="utf-8")
    print(f"  inc/preload.php {len(rows)} pages with preload hints")


def build_schema() -> None:
    """Turn src/schema/*.json into inc/schema.php.

    Two rewrites, for two different reasons:

    - `/about.html` -> `/about/`, because the URLs in the graph have to be the
      URLs WordPress actually serves. A JSON-LD @id pointing at a 404 is worse
      than no JSON-LD.
    - the origin -> a {{SITE}} placeholder the plugin swaps for home_url() at
      render time. Schema is one of the few places a spec demands an absolute
      URL, so it cannot be root-relative -- but hardcoding the domain would put
      the staging hostname into every page's structured data and make the
      domain move a search-and-replace through PHP.
    """
    import json

    src = ROOT / "src" / "schema"
    graphs: dict[str, str] = {}

    for f in sorted(src.glob("*.json")):
        text = f.read_text(encoding="utf-8")
        text = re.sub(
            r"https://acrylicpros\.com/([a-z0-9-]+)\.html",
            lambda m: "{{SITE}}/" + m.group(1) + "/",
            text,
        )
        text = re.sub(
            r"https://acrylicpros\.com/product/([a-z0-9-]+)\.html",
            lambda m: "{{SITE}}/product/" + m.group(1) + "/",
            text,
        )
        # Images in the graph point at the prototype's asset tree; in WordPress
        # they are Media Library files, flattened like every other image.
        text = re.sub(
            r"https://acrylicpros\.com/assets/(?:images|icons|video)/"
            r"[A-Za-z0-9._/-]*?([A-Za-z0-9._-]+\."
            r"(?:png|jpe?g|webp|gif|svg|mp4|webm))",
            lambda m: "{{SITE}}" + UPLOADS + "/" + m.group(1),
            text,
        )
        text = text.replace("https://acrylicpros.com", "{{SITE}}")
        # Parse it back, so a broken graph fails the build rather than the page.
        json.loads(text)
        key = "front" if f.stem == "home" else f.stem
        graphs[key] = json.dumps(json.loads(text), separators=(",", ":"))

    # Match the URL form only. `info@acrylicpros.com` is an email address in
    # the contact details and must survive untouched.
    leftover = [k for k, v in graphs.items() if "//acrylicpros.com" in v]
    if leftover:
        raise SystemExit(f"schema still carries a hardcoded domain: {leftover}")

    rows = "\n".join(
        f"\t\t{k!r} => {php_str(v)}," for k, v in sorted(graphs.items())
    )
    (PLUGIN / "inc").mkdir(parents=True, exist_ok=True)
    (PLUGIN / "inc" / "schema.php").write_text(
        SCHEMA_PHP.format(rows=rows), encoding="utf-8")
    print(f"  inc/schema.php  {len(graphs)} graphs")


def php_str(s: str) -> str:
    """Single-quoted PHP literal: only \\ and ' need escaping."""
    return "'" + s.replace("\\", "\\\\").replace("'", "\\'") + "'"


def build_seed_data() -> None:
    """Bundle the content the CPTs start life with.

    Gallery and Instagram already exist as JSON. The videos were only ever
    markup, so they are read back out of the built page -- which also means
    this cannot drift from what the page currently shows.
    """
    import json

    data = PLUGIN / "data"
    data.mkdir(parents=True, exist_ok=True)

    for name in ("gallery", "instagram"):
        shutil.copy2(ROOT / "data" / f"{name}.json", data / f"{name}.json")

    html = (ROOT / "videos.html").read_text(encoding="utf-8")
    videos = []
    # Two kinds of card. The plain one embeds the player on click. The
    # `-external` one only links out, because YouTube refuses to embed those
    # particular videos -- so importing all eight as embeddable would ship
    # three players that spin and then fail.
    for m in re.finditer(
        r'<article class="m-videoCard([^"]*)">(.*?)</article>', html, flags=re.S
    ):
        mods, card = m.group(1), m.group(2)
        external = "-external" in card
        yt_match = (
            re.search(r'data-yt="([^"]+)"', card)
            or re.search(r'youtube\.com/watch\?v=([A-Za-z0-9_-]+)', card)
        )
        title_match = (
            re.search(r'data-yt-title="([^"]*)"', card)
            or re.search(r'<h3 class="m-videoCard__title">([^<]*)</h3>', card)
        )
        if not yt_match or not title_match:
            raise SystemExit(f"video card with no id or title: {card[:120]}")
        yt = yt_match.group(1)
        videos.append({
            "youtube": yt,
            # &amp; in the markup is &amp; in the title; unescape so the
            # imported post title is the real one.
            "title": unescape(title_match.group(1)),
            # The cover filename is the YouTube id, which is how the
            # thumbnails were generated -- so the importer can find it in the
            # Media Library without being told.
            "image": f"{yt}.jpg",
            "featured": "-featured" in mods,
            "external": external,
        })
    if len(videos) != html.count('<article class="m-videoCard'):
        raise SystemExit("video extraction dropped a card")
    (data / "videos.json").write_text(
        json.dumps(videos, indent=1, ensure_ascii=False), encoding="utf-8")
    print(f"  data/           {len(videos)} videos, gallery + instagram copied")


def build_media() -> None:
    """Flat copy of every content image, for one bulk upload."""
    media = OUT / "media"
    if media.exists():
        shutil.rmtree(media)
    media.mkdir(parents=True)
    seen: dict[str, Path] = {}
    for folder in ("images", "icons", "video"):
        base = ROOT / "assets" / folder
        if not base.exists():
            continue
        for f in base.rglob("*"):
            if not f.is_file():
                continue
            if f.name in seen:
                raise SystemExit(
                    f"duplicate basename {f.name}: {seen[f.name]} and {f}\n"
                    "Flattening into the Media Library needs unique names."
                )
            seen[f.name] = f
            shutil.copy2(f, media / f.name)
    print(f"  media/          {len(seen)} files")

    # ...and the same files as one flat zip. Uploading 458 files through
    # Media -> Add New means fighting PHP's max_file_uploads, which is 20 per
    # batch on most shared hosting. One zip through the host's File Manager,
    # extracted into wp-content/uploads/, is a single step instead of 23.
    #
    # arcname is the bare filename on purpose: extracting must drop the files
    # flat into uploads/, not into a media/ subfolder, or every path in the
    # build is wrong by one directory.
    import zipfile

    zip_path = OUT / "media-upload.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for name in sorted(seen):
            z.write(media / name, arcname=name)
    print(f"  media-upload.zip {zip_path.stat().st_size / 1024 / 1024:.1f} MB, flat")


# ------------------------------------------------------------------ CSS text

NEUTRALISER = """/* =====================================================================
   THEME NEUTRALISER -- keep this first, above every component rule.

   A safety net only. The real fix for Hello Elementor's pink is in
   inc/assets.php, which dequeues the theme's stylesheets outright -- its
   reset.css also rewrites heading margins, paragraph spacing, body font and
   image sizing, and no amount of specificity here would undo all of that.
   This catches bare element rules from whatever else is installed: Elementor's
   frontend.css, Contact Form 7, a plugin added later.

   The weight is deliberate: `body` plus a type selector is (0,0,2), with every
   scope inside :where() contributing nothing. That beats any bare `a`,
   `button` or `[type=submit]` reset at (0,0,1), and still loses to every
   single-class rule in the design at (0,1,0).

   Both extremes have already been shipped and both broke the site. Scoped with
   `#main button` an ID made it (1,0,1), which beat every single-class button
   rule: `.m-catSelector__button` lost its padding and the homepage filter bar
   rendered at half height, along with the play buttons and the burger. Scoped
   entirely inside :where() it fell to (0,0,1), which loses to Hello's
   `[type=submit]` at (0,1,0), and the pink came back.

   :hover stays inside :where() for the same reason. `:hover` counts in the
   class column, so an unwrapped `.o-header button:hover` would be (0,2,1) and
   out-rank the site's own `.o-header .a-btn` at (0,2,0) -- stripping the fill
   while the label keeps its light colour, which reads as "the text disappears
   when I hover".

   If pink ever shows through, add the element's container to the list, or
   dequeue the offending stylesheet. Do not raise the specificity.
   ===================================================================== */
body :where(.o-header, .o-footer, #main, .m-chat, .o-menu) :where(a, a:hover) {
  color: inherit; text-decoration: none; box-shadow: none;
}

body :where(.o-header, .o-footer, #main, .m-chat, .o-menu)
:where(button, button:hover, button:focus, [type="button"], [type="submit"]) {
  font: inherit; color: inherit; background: none;
  border: 0; border-radius: 0; box-shadow: none; padding: 0;
}

/* (0,1,1) -- beats Elementor's .elementor-kit-NN at (0,1,0), which is how the
   builder's global font gets onto every paragraph even when it was never set.
   var(--font), not a literal: the design names Matter (licensed, not shipped)
   first and Plus Jakarta Sans as the fallback. Hardcoding the fallback here
   would quietly drop Matter from the chain the day the licence lands. */
:root body { font-family: var(--font); }

/* Elementor wraps every widget. These wrappers must not introduce spacing or
   a stacking context between the chrome and the page shell. */
.elementor-widget-html, .elementor-widget-container { margin: 0; padding: 0; }

/* Elementor's frontend.css also resets bare elements under .elementor at
   (0,1,1): `a { box-shadow:none; text-decoration:none }`, `hr { background:
   transparent }`, `img { height:auto; max-width:100% }`. That out-ranks the
   design's single-class rules at (0,1,0). These restore only the properties it
   takes, at the same (0,1,1) -- this file loads after Elementor's, so a tie
   goes to us -- and nothing more, so the design's own media-query and :hover
   overrides still apply. The values mirror home.css / styles.css; found by
   diffing every page with Elementor's element rules removed (21 Sept). */
img.o-footer__background, img.b-video__cover, img.b-video__still { height: 100%; }
a.o-footer__tel, a.o-footer__mail { text-decoration-line: underline; }
a.a-buttonContact { box-shadow: 0 8px 10px #0c0a0900; }
hr.hairline { background: var(--border); }
@media (min-width: 1025px) {
  a.a-buttonContact:hover, a.a-buttonContact:focus-visible { box-shadow: 0 8px 10px #0c0a092e; }
}
"""

FONT_FACE = """
/* =====================================================================
   Self-hosted Plus Jakarta Sans. Plugin-relative, because the Media
   Library rejects .woff2 and there is no SFTP to reach the theme folder.
   Both styles are declared: without the italic file the browser fakes it
   by slanting the roman, which shows immediately in the pull quotes.
   ===================================================================== */
@font-face {
  font-family: "Plus Jakarta Sans";
  src: url("fonts/plus-jakarta-sans-latin-normal.woff2") format("woff2");
  font-weight: 200 800; font-style: normal; font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+2000-206F,
                 U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215;
}
@font-face {
  font-family: "Plus Jakarta Sans";
  src: url("fonts/plus-jakarta-sans-latin-italic.woff2") format("woff2");
  font-weight: 200 800; font-style: italic; font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+2000-206F,
                 U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215;
}
@font-face {
  font-family: "Plus Jakarta Sans";
  src: url("fonts/plus-jakarta-sans-latin-ext-normal.woff2") format("woff2");
  font-weight: 200 800; font-style: normal; font-display: swap;
  unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB,
                 U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
@font-face {
  font-family: "Plus Jakarta Sans";
  src: url("fonts/plus-jakarta-sans-latin-ext-italic.woff2") format("woff2");
  font-weight: 200 800; font-style: italic; font-display: swap;
  unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB,
                 U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
"""

NAV_SHIM = """/* =====================================================================
   The header markup is identical on all 95 pages, because Theme Builder
   renders one copy of it site-wide -- captured verbatim from the about page,
   which is why the <ul> ships with data-nav="about" baked in.

   That baked-in value is stale on every other page, and it is not safe to
   rely on pages.js to correct it: pages.js is enqueued BEFORE this file (it
   has to run first, to clear the loader), so on inner/legacy pages pages.js
   reads the stale "about" and highlights the About link regardless of which
   page is actually open. On the home tier pages.js is not loaded at all, so
   nothing highlights anything there either. Symptom in both cases: About
   shows as the active nav item on every page.

   So this does the whole job itself, authoritatively, last -- both setting
   data-nav for anything else that reads it, and directly toggling -active /
   aria-current on the one matching link, clearing it from every link first
   regardless of what pages.js already did.

   The plugin supplies window.AP_NAV. The pathname derivation below is the
   fallback for when the plugin is deactivated: the menu highlight is lost,
   nothing else is, which is the right way round.
   ===================================================================== */
(function () {
  var nav = document.querySelector('[data-nav]');
  if (!nav) return;
  var key = window.AP_NAV;
  if (typeof key !== 'string') {
    var p = location.pathname.replace(/^\\/|\\/$/g, '');
    if (p === '') key = 'home';
    else if (p === 'about' || p === 'process' || p === 'gallery' ||
             p === 'videos' || p === 'services' ||
             p === 'featured-projects' || p === 'acrylic-tanks') key = p;
    else if (p === 'glass-tanks' || p.indexOf('product/') === 0) key = 'glass-tanks';
    else if (['contact', 'quote', 'warranty', 'refund-policy',
              'privacy-policy'].indexOf(p) >= 0) key = '';
    else key = 'services';
  }
  nav.setAttribute('data-nav', key);

  var items = nav.querySelectorAll('[data-nav-item]');
  for (var i = 0; i < items.length; i++) {
    items[i].classList.remove('-active');
    items[i].removeAttribute('aria-current');
  }
  var link = key && nav.querySelector('[data-nav-item="' + key + '"]');
  if (link) {
    link.classList.add('-active');
    link.setAttribute('aria-current', 'page');
  }
})();
"""


PREVIEW_HTML = """<!DOCTYPE html>
<!-- GENERATED by tools/build_wordpress.py. A local stand-in for what
     WordPress renders, for diffing against the static site. Not installed. -->
<html lang="en" class="is-loading js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title} — WordPress preview</title>
{css}
<script>window.AP_NAV={nav!r};</script>
{js}
</head>
<body class="{body_class}">
{chrome}
{body}
{chat}
</body>
</html>
"""


PRELOAD_PHP = '''<?php
/**
 * GENERATED by tools/build_wordpress.py from the pages' meta blocks.
 * Do not edit.
 *
 * The preload hint for each page's largest image. In the static build these
 * sit in <head>; WordPress owns <head>, so they are re-emitted here or they
 * are simply lost, and the hero image on 14 pages loses its head start.
 *
 * Priority 2 on wp_head: after the nav key at 1, and before WordPress prints
 * the enqueued stylesheet at 8 — a preload that arrives after the stylesheet
 * it was meant to race has done nothing.
 */
defined( 'ABSPATH' ) || exit;

function ap_preloads() : array {{
\treturn [
{rows}
\t];
}}

add_action( 'wp_head', function () {{
\t$all = ap_preloads();
\t$key = null;

\tif ( is_front_page() ) {{
\t\t$key = 'front';
\t}} else {{
\t\t$obj = get_queried_object();
\t\tif ( $obj instanceof WP_Post && isset( $all[ $obj->post_name ] ) ) {{
\t\t\t$key = $obj->post_name;
\t\t}}
\t}}

\tif ( null === $key ) {{
\t\treturn;
\t}}

\t// Already-escaped markup generated from our own source, not user input.
\techo $all[ $key ] . "\\n";
}}, 2 );
'''


SCHEMA_PHP = '''<?php
/**
 * GENERATED by tools/build_wordpress.py from src/schema/. Do not edit.
 *
 * The JSON-LD graph for each page, carried over from the static site.
 *
 * {{{{SITE}}}} is replaced with home_url() when the graph is printed, so the
 * structured data is correct on staging and correct again after the domain
 * move, with nothing to search and replace. Schema is one of the few places a
 * spec requires an absolute URL, which is why this cannot simply be
 * root-relative like everything else in the build.
 */
defined( 'ABSPATH' ) || exit;

function ap_schema_graphs() : array {{
\treturn [
{rows}
\t];
}}

/**
 * Print the graph for the current request.
 *
 * Priority 9 so it lands before Yoast's own output at 10 -- and Yoast's graph
 * is switched off below, because two competing descriptions of the same
 * organisation is worse for search than either one alone.
 */
add_action( 'wp_head', function () {{
\t$graphs = ap_schema_graphs();
\t$key    = null;

\tif ( is_front_page() ) {{
\t\t$key = 'front';
\t}} else {{
\t\t$obj = get_queried_object();
\t\tif ( $obj instanceof WP_Post && isset( $graphs[ $obj->post_name ] ) ) {{
\t\t\t$key = $obj->post_name;
\t\t}}
\t}}

\tif ( null === $key ) {{
\t\treturn; // no graph for this page is fine; a wrong one is not
\t}}

\t$json = str_replace(
\t\t'{{{{SITE}}}}',
\t\tuntrailingslashit( home_url() ),
\t\t$graphs[ $key ]
\t);

\techo '<script type="application/ld+json">' . $json . "</script>\\n";
}}, 9 );

/**
 * Yoast keeps its own schema graph, describing the same organisation and the
 * same pages. Shipping both leaves two entities claiming the same @id, which
 * search engines resolve unpredictably. The graphs here are the hand-written
 * ones carried over from the static site, so Yoast's is the one that goes.
 */
add_filter( 'wpseo_json_ld_output', '__return_false' );
'''


PAGE_MAP_PHP = """<?php
/**
 * GENERATED by tools/build_wordpress.py. Do not edit.
 *
 * slug => [ body class, data-nav key ]
 *
 * The body class drives the design: `t-home` and `t-shop` change the page
 * shell's background and the header's colour logic, so a page with the wrong
 * one renders in the wrong palette. The nav key highlights the current menu
 * item, and is handed to the front end as window.AP_NAV.
 */
defined( 'ABSPATH' ) || exit;

function ap_page_map() : array {{
\treturn [
{rows}
\t];
}}

/** Every product page carries the same shell classes. */
function ap_product_body_class() : string {{
\treturn '{product}';
}}
"""


def build_plugin_zip() -> None:
    """Re-zip the plugin folder into the installable plugins/acrylic-pros-content.zip.

    wp-admin installs plugins only from a zip, and nothing used to rebuild it:
    the folder kept up with every build while the zip stayed frozen at whatever
    day it was last made by hand, so installing it shipped stale CSS, JS and
    page bodies. The top-level folder name must match the plugin slug or
    WordPress installs it as a second plugin instead of replacing this one.
    """
    import zipfile

    zip_path = PLUGIN.parent / (PLUGIN.name + ".zip")
    files = sorted(f for f in PLUGIN.rglob("*") if f.is_file())
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for f in files:
            z.write(f, arcname=f"{PLUGIN.name}/{f.relative_to(PLUGIN).as_posix()}")
    print(f"  plugins/{zip_path.name}  {len(files)} files, "
          f"{zip_path.stat().st_size / 1024:.0f} KB")


def build_media_update(since: str) -> None:
    """media-update.zip: only the media added or changed since a git ref.

    For an install that already has the full Media Library, re-uploading the
    whole 100 MB zip to add a few photos is the wrong trade. This takes the
    files git reports as new or modified under assets/, and keeps only those a
    page, the chrome or the plugin actually references -- a source master that
    nothing links to (e.g. the 44 MB scratch-removal.mp4) stays out.
    """
    import subprocess
    import zipfile

    def git(*a: str) -> list[str]:
        out = subprocess.run(["git", *a], cwd=ROOT, capture_output=True,
                             text=True, check=True).stdout
        return [l for l in out.splitlines() if l.strip()]

    roots = ["assets/images", "assets/icons", "assets/video"]
    changed = set(git("diff", "--name-only", since, "--", *roots))
    changed |= set(git("ls-files", "--others", "--exclude-standard", "--", *roots))

    used = "".join(
        f.read_text(encoding="utf-8", errors="ignore")
        # products/ and products.csv too: the acrylic product photos are only
        # referenced there (WooCommerce imports them from the CSV).
        for f in [*(OUT / "pages").glob("*.html"), *(OUT / "products").glob("*.html"),
                  OUT / "products.csv", OUT / "header.html",
                  OUT / "chat.html", PLUGIN / "templates" / "footer.php",
                  *(PLUGIN / "assets").glob("*.css"), *(PLUGIN / "assets").glob("*.js")]
        if f.exists())

    picked = sorted(p for p in changed
                    if (ROOT / p).is_file() and Path(p).name in used)
    zip_path = OUT / "media-update.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for p in picked:
            z.write(ROOT / p, arcname=Path(p).name)  # flat, like media-upload.zip
    skipped = sorted(Path(p).name for p in changed - set(picked) if (ROOT / p).is_file())
    print(f"  media-update.zip {len(picked)} files since {since}, "
          f"{zip_path.stat().st_size / 1024 / 1024:.1f} MB"
          + (f" (unreferenced, left out: {', '.join(skipped)})" if skipped else ""))


# ---------------------------------------------------------------------- main

def main() -> int:
    global UPLOADS
    import argparse

    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--uploads",
        default=UPLOADS,
        help="Media Library base path. Default %(default)s, which assumes "
             "month/year upload folders are OFF. Pass the dated prefix "
             "(e.g. /wp-content/uploads/2026/09) if the media is already "
             "uploaded that way.",
    )
    ap.add_argument(
        "--media-since",
        metavar="GIT_REF",
        help="Also write media-update.zip: only the media added or changed "
             "since this git ref (e.g. HEAD, or the commit the live install "
             "was built from), for an install that already has the rest.",
    )
    args = ap.parse_args()
    UPLOADS = args.uploads.rstrip("/")
    if UPLOADS != "/wp-content/uploads":
        print(f"  uploads base    {UPLOADS}")

    pages = sorted(p for p in ROOT.glob("*.html") if p.name not in SKIP)
    products = sorted((ROOT / "product").glob("*.html"))
    if not pages:
        raise SystemExit("no built pages found -- run tools/build_pages.py first")

    PAGE_SLUGS.update(p.stem for p in ROOT.glob("*.html"))
    PRODUCT_SLUGS.update(p.stem for p in products)

    OUT.mkdir(exist_ok=True)
    (OUT / "pages").mkdir(exist_ok=True)
    (OUT / "products").mkdir(exist_ok=True)

    chrome_seen: dict[str, str] = {}
    footer_seen: dict[str, str] = {}
    chat_seen: dict[str, str] = {}
    body_classes: dict[str, str] = {}
    navs: dict[str, str] = {}

    canonical: dict[str, str] = {}

    def handle(path: Path, out_dir: Path, prefix: str = "") -> None:
        e = extract(path.read_text(encoding="utf-8"), path.stem)
        key = prefix + e.slug
        canonical[key] = e.chrome
        # Compare after the rewrite: a product page sits one folder down,
        # so its chrome differs only by `../` prefixes that the rewrite
        # removes. Comparing before it would report 118 false differences.
        chrome_seen[key] = rewrite(normalise_chrome(e.chrome))
        footer_seen[key] = rewrite(e.footer)
        chat_seen[key] = rewrite(e.chat)
        body_classes[key] = e.body_class
        navs[key] = e.nav
        (out_dir / f"{e.slug}.html").write_text(
            rewrite(assemble_page(e)), encoding="utf-8")

    for p in pages:
        handle(p, OUT / "pages")
    for p in products:
        handle(p, OUT / "products", "product/")

    # The whole point of Theme Builder is one copy of the chrome. If the
    # prototype's chrome is not already identical everywhere, pasting it once
    # would silently change some pages -- so fail here instead.
    def assert_identical(what: str, seen: dict[str, str]) -> str:
        values = set(seen.values())
        if len(values) != 1:
            ref = next(iter(seen))
            for slug, val in seen.items():
                if val != seen[ref]:
                    raise SystemExit(
                        f"{what} differs between {ref} and {slug}. "
                        "Theme Builder renders one copy site-wide, so this "
                        "has to be reconciled in src/partials/ first."
                    )
        return next(iter(values))

    assert_identical("header chrome", chrome_seen)
    footer = assert_identical("site footer", footer_seen)
    chat = assert_identical("chat widget", chat_seen)

    # The inner-page chrome is a strict superset of the homepage's: it carries
    # the data-nav mechanism and the two transition panels. pages.js turns
    # data-nav into exactly the `-active` class and aria-current="page" that the
    # homepage hardcodes, so adopting the inner chrome site-wide reproduces the
    # homepage byte-for-byte in the rendered DOM -- and gains it the panels, so
    # navigating *to* the homepage animates like every other page.
    chrome = rewrite(canonical["about"])

    (OUT / "header.html").write_text(rewrite(chrome) + "\n", encoding="utf-8")
    (OUT / "chat.html").write_text(rewrite(chat) + "\n", encoding="utf-8")
    (PLUGIN / "templates").mkdir(parents=True, exist_ok=True)
    (PLUGIN / "templates" / "footer.php").write_text(
        "<?php defined( 'ABSPATH' ) || exit; ?>\n" + rewrite(footer) + "\n",
        encoding="utf-8")

    build_assets()
    build_preview(sorted((OUT / 'pages').glob('*.html')), body_classes, navs)
    build_setup_payload(sorted((OUT / 'pages').glob('*.html')))
    build_preloads()
    build_schema()
    build_seed_data()
    build_media()

    # The slug -> body class / nav key map the plugin needs. Generated, because
    # it has to stay in step with the page bodies it was extracted from.
    rows = []
    for slug in sorted(body_classes):
        if slug.startswith("product/"):
            continue  # every product page is identical; handled by is_singular
        key = "front" if slug == "index" else slug
        # The homepage marks its own menu link in the markup instead of through
        # data-nav, so the key it never needed has to be supplied here, or the
        # Home link loses its highlight under the now-shared header.
        nav = "home" if slug == "index" else navs[slug]
        rows.append(f"\t\t'{key}' => [ '{body_classes[slug]}', '{nav}' ],")
    product_class = body_classes["product/" + sorted(PRODUCT_SLUGS)[0]]
    php = PAGE_MAP_PHP.format(rows="\n".join(rows), product=product_class)
    (PLUGIN / "inc").mkdir(parents=True, exist_ok=True)
    (PLUGIN / "inc" / "page-map.php").write_text(php, encoding="utf-8")

    build_plugin_zip()
    if args.media_since:
        build_media_update(args.media_since)

    print(f"  pages/          {len(pages)}")
    print(f"  products/       {len(products)}")
    print(f"  header.html     {len(chrome):,} bytes, identical on every page")
    print(f"  chat.html       {len(chat):,} bytes")
    print(f"  templates/footer.php  {len(footer):,} bytes")
    return 0


if __name__ == "__main__":
    sys.exit(main())
