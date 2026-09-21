# Acrylic Pros — WordPress install

**Written for:** the developer setting this up. The owner's guide is
`OWNER-HANDOFF.md`.

Everything in this folder is **generated**. Do not hand-edit it:

```bash
python tools/build_wordpress.py                              # pages, chrome, assets, plugin data
python tools/build_products_csv.py --site-url https://YOUR-STAGING-URL
python wordpress/tests/check.py wordpress/ --config wordpress/tests/check-config.json
```

Change the design in `src/`, rebuild the static site, then rebuild this. The
generator fails loudly if the header, footer or chat widget stop being identical
across all 95 pages, because Theme Builder renders exactly one copy of each.

---

## What the build contains

| Path | What it is | Goes where |
|---|---|---|
| `header.html` | skip link, SVG sprite, loader, header, menu, transition panels | Theme Builder → Header |
| `chat.html` | the floating chat widget | Theme Builder → Footer |
| `pages/*.html` | 25 page bodies | one HTML widget per page |
| `products/*.html` | 69 SKU bodies | reference only — WooCommerce renders these |
| `plugins/acrylic-pros-content.zip` | CSS, JS, fonts, CPTs, the footer, and the one-button site builder | Plugins → Add New → Upload |
| `products.csv` | 69 products | WooCommerce → Products → Import |
| `media/` | 458 images and videos, flat | Media Library, bulk upload |
| `tests/check.py` | the static checks | run before every deploy |

---

## Install, in order

The order matters in two places, both flagged below.

### 1. WordPress and the theme

1. Fresh WordPress 6.x, PHP 7.4 or newer.
2. Theme: **Hello Elementor**.
3. **Settings → Permalinks → Post name.** Every link in the build is a
   root-relative pretty URL; nothing works until this is set.
4. **Settings → Reading → Discourage search engines from indexing this site** —
   tick it, and leave it ticked until the domain move. A staging copy of a real
   site that gets indexed competes with the client's own domain in search.

### 2. Media — do this before uploading anything

> **Settings → Media → untick "Organize my uploads into month- and year-based
> folders".**
>
> Every image path in the build is `/wp-content/uploads/<filename>` with no date
> segment. Upload with this box ticked and all 458 images 404, on every page.
> Fixing it afterwards means re-uploading, because WordPress does not move
> existing files.

Then upload everything in `media/` through **Media → Add New**. Drag it in a few
hundred at a time; it is a flat folder with no duplicate filenames.

### 3. Plugins

| Plugin | Why |
|---|---|
| Elementor + Elementor Pro | Theme Builder and the HTML widgets |
| `acrylic-pros-content.zip` | the design and the content types — see below |
| WooCommerce | the 69 products |
| Contact Form 7 | **later phase** — the forms are not wired yet |
| Yoast SEO | titles, descriptions, sitemap |

The content plugin carries the stylesheets, the scripts, the four `.woff2`
fonts, the loader video and the site footer. That is not tidiness — this host
has no SFTP, a plugin is the only thing wp-admin can install that ships its own
files, and the Media Library refuses `.woff2` outright.

CSS and JS ship as separate per-tier files (`home.css`/`pages.css`/`legacy.css`,
`lenis.min.js`/`pages.js`/`home.js`/`main.js`), not one bundle. The static site
loads different combinations on different pages, and `inc/assets.php` picks the
matching set from the page's body class — see §"How the page shell works"
below for why merging them into one file broke the cascade.

It also re-emits the two things that live in `<head>` in the static build and
therefore cannot travel in a page body: the per-page **JSON-LD graph**
(`inc/schema.php`) and the **LCP preload hint** (`inc/preload.php`, 14 pages).
Both are generated. Dropping either is invisible on screen — the pages simply
lose their structured data and their hero image loses its head start — which is
why `tests/test-acrylic-pros-content.php` asserts on both.

### 4. Elementor settings — the pink-button step

**Elementor → Site Settings → Layout:**

- Default Colors → **Disable**
- Default Fonts → **Disable**

Do this even though nothing was ever set in them. They ship enabled and write
`.elementor-kit-NN { font-family: … }` onto `<body>`, which out-specifies a plain
`body` rule and puts every paragraph on the site in the wrong face.

`home.css` — the one stylesheet every page loads — opens with a scoped
neutraliser that handles the rest of the theme's style layer, so Hello
Elementor's pink `a` and `button` rules cannot reach the design. It uses
specificity, not `!important`, so every rule after it still wins — including
anything you add later.

### 5. Build the site — one button

**Tools → Acrylic Pros setup → Build the site.**

This does steps 5 and 6 below for you: both Theme Builder templates, and all 25
pages with their slug, Elementor Full Width layout, hidden title, container and
HTML widget already filled with the right body. It also sets the static front
page and clears Elementor's CSS cache.

There is no WP-CLI on this host, so this runs inside WordPress instead.

- **Safe to re-run.** Everything it creates is tagged `_ap_managed` and matched
  on slug, so a second run updates in place. A page you made by hand is never
  touched — if one already owns a slug it wants, it says so rather than
  silently creating a duplicate.
- **It never deletes anything.**
- **Re-run it after a new build** to push updated page bodies into the install.
  That is how a design change reaches WordPress.

Then check the two things it cannot confirm for itself:

1. Templates → Theme Builder → the header and footer both show **Entire Site**
   under Display Conditions. Conditions are Elementor **Pro**; on free Elementor
   the setting is ignored and the templates never appear.
2. The 404 template is still manual — Theme Builder → Add New → 404 Page, one
   HTML widget, paste `pages/404.html`.

> **This has not been run against a live WordPress from here.** It is built to
> Elementor's documented data format, and the payload it generates is covered by
> `tests/test-acrylic-pros-content.php`, but the first run on a real install is
> the real test. If a page comes out blank in the editor, its `_elementor_data`
> did not parse — say so and it gets fixed at the generator, not by hand.

Steps 5 and 6 below are what the button automates, kept for reference and for
doing a single page manually.

---

### 5b. Theme Builder (what the button does)

**Templates → Theme Builder → Header → Add New:**

1. One Container: Full Width, content width Full, padding `0`, gap `0`,
   HTML Tag → `header`.
2. One **HTML** widget. Paste all of `header.html`.
3. Display Conditions → **Entire Site** → Publish.

Footer: the same, with `chat.html`, HTML Tag `div`.

> Do **not** put Sticky or Motion Effects on either container. Both add a
> `transform` to an ancestor, and a transformed ancestor becomes the containing
> block for `position: fixed` children — which breaks the fixed header, the
> loader and the chat widget at once. The header's own stickiness is already in
> `home.css`.

The SVG sprite sits at the top of `header.html` and every icon on the site
resolves against it with `<use href="#i-name">`. Delete it and every icon on all
95 pages empties, with no error anywhere.

### 6b. Pages (what the button does)

For each file in `pages/`:

1. **Pages → Add New**, title it, set the slug to the filename without `.html`.
2. **Edit with Elementor** → Page Settings → **Page Layout: Elementor Full Width**.
3. Page Settings → **Hide Title**. The theme prints its own `<h1>` otherwise and
   the page ships two.
4. One Container, padding `0`, gap `0`, **HTML Tag `div`** — not `main`. The
   pasted markup already contains `<main id="main">`, and nesting one inside
   another is invalid.
5. One **HTML** widget. Paste the file.

`index.html` → **Settings → Reading → A static page → Home**.

`404.html` → Theme Builder → Single → 404 page.

**Service pages:** paste the body as several HTML widgets, split at the section
comments, rather than one. It renders identically and it means the owner editing
one section is looking at forty lines instead of nine hundred.

### 7. Content

**Tools → Acrylic Pros import** creates the 35 gallery photos, 12 Instagram posts
and 8 videos, matching each to an image already in the Media Library by filename.
Run it after the media upload, not before. It is safe to run twice — items are
matched on a source key and updated rather than duplicated.

Then put the shortcodes into the page bodies where the static markup had the
generated grids:

| Page | Shortcode |
|---|---|
| Gallery | `[ap_gallery]` |
| Videos | `[ap_videos]` |
| Home | `[ap_instagram]` |

### 8. Products

**WooCommerce → Products → Import**, and feed it `products.csv`.

Regenerate the CSV first with the install's real URL:

```bash
python tools/build_products_csv.py --site-url https://YOUR-STAGING-URL
```

That URL only appears in the Images column, and only while the file is being
read — it is how WooCommerce recognises that each image is already in the Media
Library instead of downloading 69 of them. Nothing it imports carries a domain.

**The store is deliberately unconfigured.** No tax, no shipping zones, no
payment gateway. The products import as a published catalogue whose call to
action is the quote form, which is what the static site does today. Checkout is
a later phase — see `CONVERSION-PLAN.md` §1.

---

## How the page shell works

Four pieces have to agree, or the page renders in the wrong palette:

1. `<html class="is-loading js">` — set by the plugin on `language_attributes`.
   `is-loading` gates the smoke loader; `js` gates every enhancement in the CSS.
2. `<body class="t-home">` / `t-inner t-about` / `t-inner t-shop` … — set by the
   plugin from `inc/page-map.php`, keyed on the page slug.
3. `window.AP_NAV` — which menu item is highlighted.
4. Which CSS and JS files load — `inc/assets.php`'s `ap_asset_set()` reads that
   same body class and picks one of three sets:

   | Tier | Body class contains | CSS | JS |
   |---|---|---|---|
   | home | `t-home` | `home.css` | `lenis.min.js`, `home.js` |
   | inner | (neither) | + `pages.css` | + `pages.js` |
   | legacy | `t-legacy` | + `legacy.css` | + `main.js` |

   This exists because the static site loads these combinations, not one
   bundle for every page. They used to be concatenated into a single
   `global.css`/`global.js`, and that broke the cascade for any page that did
   not originally load all three files: two single-class rules that never met
   started meeting, and load order picked the winner. That is how the homepage
   picked up `legacy.css`'s body colour, and how an unrelated rule in
   `pages.css` once overrode a layout rule in `home.css` on the homepage.
   Keeping the files separate and enqueuing the matching set per page makes the
   cascade identical to the static site by construction.

`inc/page-map.php` is **generated**. Add a page and it gets `t-inner` and no menu
highlight: plain, not broken. To give it the right shell, add it to the static
site and re-run the generator.

### Why the footer is a shortcode

The design wraps `<main>` and `<footer>` together inside
`.t-page > .t-page__scroller`, and the menu animation transforms that wrapper.
Splitting it across a Theme Builder header and footer would leave Elementor's own
closing `</div>` closing the scroller, nesting the whole page inside it. So the
wrapper travels with the page body, and `[ap_footer]` keeps there being exactly
one copy of the footer markup. That works because the plugin runs `do_shortcode`
on HTML widgets — Elementor otherwise prints shortcodes as literal text.

---

## Verification

```bash
python wordpress/tests/check.py wordpress/ --config wordpress/tests/check-config.json
php wordpress/plugins/acrylic-pros-content/tests/test-acrylic-pros-content.php
```

Last run: **1057/1057** static checks, **184/184** plugin tests, and `php -l` clean
on all 17 PHP files.

No part of this has been executed inside a real WordPress from the build
machine — there is none available. Everything above is generated, linted and
unit-checked; the first install is the first real test.

Then, on the real install, logged **out**, with every cache purged:

- the mobile menu opens and closes
- the page transition plays between two inner pages
- the gallery filter, lightbox and load-more work
- the Glass Tanks filter, sort and load-more work, and the URL keeps their state
- a product page's "Request a quote" prefills the quote form
- the chat widget opens and its WhatsApp and SMS buttons produce the right links
- no icon is empty anywhere

A whole class of bug on this build appears only for logged-out visitors, because
Elementor and most optimiser plugins behave differently for editors.

---

## Changelog

**1.0.2** — Process: the two top images are now the same height and top-aligned
(was: same-height columns weren't possible with the old percentage widths,
since the two images have fixed, unequal aspect ratios — 3:2 and 957:1295 —
so equal height needed the column widths recalculated to compensate, not
just a bigger gap). Removed the diagonal stagger.

**1.0.1** — About and Process: the top two images now sit side by side, one
wider, at every screen width instead of only above 1025px. Split the single
`global.css`/`global.js` bundle into per-tier files (`home.css`/`pages.css`/
`legacy.css`, `lenis.min.js`/`pages.js`/`home.js`/`main.js`) enqueued per page
via `inc/assets.php`, which is also the actual fix for Hello Elementor's pink
buttons and links — the theme's own stylesheets are dequeued outright, not
merely out-specified. Nav highlighting no longer sticks on "About" on every
page. Fixed the LCP preload and JSON-LD `<head>` injection to run per page
tier.

**1.0.0** — first build. Design, page shells, gallery/Instagram/video content
types, the footer shortcode, the one-time content import.
