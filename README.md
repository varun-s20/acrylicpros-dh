# Acrylic Pros — website

A static, multi-page rebuild of acrylicpros.com. HTML5, CSS3 and vanilla
JavaScript. No framework, no runtime dependency, no jQuery.

- **97 pages** — 28 hand-authored, 69 generated product pages
- **One** shared stylesheet (`assets/css/styles.css`) and **one** shared script
  (`assets/js/main.js`)
- Every page is a separate HTML document that can be served from any static host

---

## Quick start

```bash
# preview locally (any static server works)
python -m http.server 8000
# then open http://127.0.0.1:8000/
```

Do not open the files with `file://` — relative asset paths and the fonts will
load, but `fetch` and some module behaviour will not match production.

### Rebuild everything

Run in this order — `fix_images.py` edits the **sources**, so it must come
before the pages are assembled:

```bash
python tools/fetch_acrylic.py     # acrylic shop <- advancedacrylics.com (network; run first: its photos need WebP sizes)
python tools/build_images.py      # WebP derivatives + assets/image-manifest.json
python tools/fix_images.py        # reconcile width/height/srcset in src/ with real files
python tools/build_legacy_css.py  # assets/home/legacy.css <- assets/css/styles.css
python tools/build_instagram.py   # homepage Instagram tiles <- data/instagram.json (--refresh re-downloads covers)
python tools/build_gallery.py     # gallery grid         <- data/gallery.json
python tools/build_products.py    # catalogue + 69 pages <- data/products.json
python tools/build_pages.py       # assemble all pages   <- src/
python tools/build_sitemap.py     # sitemap.xml + robots.txt
python tools/check_site.py        # verify — must print "All checks passed."
```

The pipeline is idempotent: running it twice changes nothing. `build_pages.py
--check` and `fix_images.py --check` both exit non-zero if the output is stale,
which makes them suitable for CI.

---

## ⚠️ Read this before editing

**Pages in the project root are generated. Do not edit them.**

`index.html`, `scratch-removal.html` and the rest are assembled by
`tools/build_pages.py` and will be overwritten. Edit the source instead:

| To change | Edit |
|---|---|
| A page's content | `src/pages/<name>.body.html` |
| Header, navigation (every page) | `src/partials/home-header.html` + `page-header.html` |
| Footer (every page) | `src/partials/home-footer.html` |
| `<head>` for not-yet-redesigned pages (service pages, legal, 404) | `src/partials/legacy-head.html` |
| A page's title / description / OG tags | the `<!--meta -->` block at the top of its `src/pages/` file |
| Structured data | `src/schema/<name>.json` |
| Gallery contents | `data/gallery.json` |
| Featured Projects page (chapters, photos, the install clip) | `data/featured.json`, then `tools/build_gallery.py` |
| Acrylic Tanks shop + its product pages | `data/acrylic-products.json` (Advanced Acrylics' catalogue, written by `tools/fetch_acrylic.py`), then `tools/build_images.py` + `tools/build_products.py`. Until it exists the page shows the quote-only styles in `data/acrylic-tanks.json` |
| Homepage Instagram feed | `data/instagram.json` (post links + short captions), then `tools/build_instagram.py --refresh` |
| Chat button avatar | replace `assets/images/brand/chat-avatar.png` (square PNG); panel markup is at the end of `src/partials/home-footer.html`, behaviour in `home.js` |
| Contact address / hours / FAQ answers | `src/pages/contact.body.html` (placeholders marked "To be confirmed" and `[...]`) |
| Product catalogue | `data/products.json` (`tools/build_products.py` writes the cards, range tiles, comparison rows and the 69 product pages) |
| **New system** — homepage chrome (header, menu, footer) | `src/partials/home-head.html`, `home-header.html`, `home-footer.html` |
| **New system** — inner-page chrome | `src/partials/page-head.html`, `page-header.html` (footer: `home-footer.html`) |
| **New system** — shared styles / behaviour | `assets/home/home.css`, `assets/home/home.js` |
| **New system** — inner-page styles / behaviour | `assets/home/pages.css`, `assets/home/pages.js` |

Then run `python tools/build_pages.py`.

> **One header, menu and footer everywhere; two body systems.** The homepage,
> About, Process, Services, Gallery, Featured Projects, Contact, Quote, Videos,
> Glass Tanks, Acrylic Tanks and the 69 product pages are fully on the
> Aquatique-style system in `assets/home/`.
> Every page except the homepage opens with the same compact banner
> (`.m-pageBanner` in `pages.css`: breadcrumb, tag, title, one line, photo or
> the homepage video). The rest (service pages, legal, 404) use the same chrome through
> `head: legacy-head`, but keeps its old body markup: its styles come from
> `assets/home/legacy.css`, which `tools/build_legacy_css.py` generates from
> `assets/css/styles.css` (rem x1.6 for the 10px root, every rule scoped to
> `#main`), and `main.js` still runs for those bodies. Edit `styles.css`, then
> rerun the script. `src/partials/header.html`/`footer.html`/`head.html` are
> no longer used. On those pages `pages.js` picks the light/dark header by
> reading the band under it. Progress and next steps:
> `docs/superpowers/specs/2026-09-17-inner-pages-checkpoint.md`.
>
> - A page opts in with `head:`, `header:`, `footer:` and `nav:` lines in its
>   meta block (`nav:` names the menu link to mark current — `home`,
>   `services`, `gallery`, `videos`, `about` — or stays empty).
> - Inner pages load `pages.css`/`pages.js` on top of `home.css`/`home.js`.
>   `pages.js` must stay before `home.js` in `page-head.html`.
> - `page-header.html` is `home-header.html` plus the menu `data-nav` hooks and
>   the two page-transition panels; keep the two in step.
> - Cloud, smoke and fin assets are generated: `python tools/make_home_fx.py`.
> - Browser tests: `python tools/test_home.py`, `python tools/test_inner.py`,
>   `python tools/test_behaviour.py`, `python tools/test_pages.py`
>   (need Chrome installed and a server on 127.0.0.1:8899).
> - YouTube: `uwtV-Dp0kc8`, `1p2a0Rf8mAA` and `q6UxS0Tbc2o` refuse to play
>   embedded, so they open on YouTube; every other video plays inline.
> - Matter font: drop the licensed files in `assets/fonts/matter/` and
>   uncomment the `@font-face` block at the top of `home.css`.
> - Measured reference specs: `docs/reference/`.

### Why there is a build step on a "static site"

The header, footer, contact panel and `<head>` boilerplate are identical on 97
pages. Hand-copying them means one nav change becomes 97 edits and the 98th gets
forgotten. The chrome lives once in `src/partials/`; each page contributes only
its own composition. **The output is plain static HTML** — nothing about the
deployed site needs Python.

---

## Project structure

```
/
├── index.html                    generated ─┐
├── about.html  services.html  gallery.html  │
├── scratch-removal.html  … 15 service pages │  all built from src/
├── quote.html  contact.html  process.html   │
├── warranty.html  refund-policy.html        │
├── privacy-policy.html  404.html            │
├── glass-tanks.html                         │
├── product/  (69 generated SKU pages) ──────┘
│
├── src/                          SOURCE — edit these
│   ├── pages/*.body.html         page content + meta block
│   ├── partials/                 header, footer, head, generated grids
│   ├── schema/*.json             JSON-LD per page
│   └── CONTENT-SOURCE.md         verbatim copy + the rules that govern it
│
├── data/
│   ├── products.json             69 SKUs: name, price, spec, image
│   ├── gallery.json              gallery items: alt text, category
│   ├── featured.json             Featured Projects chapters + photos
│   └── acrylic-tanks.json        acrylic tank styles (quote-only)
│
├── assets/
│   ├── home/                     NEW system: home.css/js, pages.css/js, lenis,
│   │                             generated cloud/smoke/fin
│   ├── css/styles.css            old stylesheet (pages not yet migrated)
│   ├── js/main.js                old script (pages not yet migrated)
│   ├── fonts/                    self-hosted woff2 + fonts.css
│   ├── images/                   originals + generated .webp derivatives
│   ├── video/                    hero video + posters
│   ├── icons/                    social + service icons
│   ├── image-manifest.json       generated — dimensions of every image
│   └── ASSET-MANIFEST.tsv        generated — where each asset came from
│
├── tools/                        build + verification scripts
├── docs/specs/                   design spec and audit
├── sitemap.xml  robots.txt       generated
└── README.md
```

---

## Connecting the forms

**The forms currently do not submit anywhere, and they never claim that they
do.** On submit they validate fully, then tell the visitor the form is not
connected and offer the phone number and email instead. This is deliberate:
showing a "thank you, we'll be in touch" for a message that was never sent is
worse than no form at all.

To connect a real endpoint, set one constant near the top of
`assets/home/pages.js` (the quote and contact pages run on the new system):

```js
var FORM_ENDPOINT = null;   // -> 'https://your-endpoint.example/submit'
```

`assets/js/main.js` has the same constant for any form still on an old page.

With a URL set, submissions are sent by `fetch` as `FormData`, and a success
state is shown **only** on a successful HTTP response. Failures fall back to the
phone number.

Field names posted by the quote form: `premises`, `name`, `company`, `email`,
`phone`, `contact_preference`, `address`, `city`, `state`, `zip`, `country`,
`service`, `length`, `width`, `height`, `water_type`, `panels` (repeated),
`water_state`, `animals`, `message`, `consent` (required tick box).

Contact form: `name`, `email`, `phone`, `subject`, `interest` (repeated),
`premises`, `message`, `consent` (required tick box).

**Photo upload** is intentionally not a working file input. There is no backend
to receive a file, so the page asks for photos by reply-email or text instead.
Add a real `<input type="file">` only once an endpoint can store it.

---

## Replacing media

### Images

1. Drop the new file into the right folder under `assets/images/`.
2. Run `python tools/build_images.py` — this generates the WebP derivatives and
   updates `assets/image-manifest.json`.
3. Run `python tools/fix_images.py` — this rewrites every `width`, `height` and
   `srcset` in the HTML from the manifest.

Never hand-write image dimensions. `fix_images.py` is the source of truth and
will correct them; getting them wrong is a direct Cumulative Layout Shift
regression.

### Homepage video

Replace `assets/video/hero-desktop.mp4`, keeping the filename. Phone-shot MP4
(H.264 + AAC) is fine — no YouTube required.

- Target **under 3 MB**, 1920×1080 or 1280×720, 6–12 seconds, silent
- Also replace `assets/images/hero/hero-poster-desktop.jpg` with a frame from it
- The poster is the LCP element and is preloaded, so the page renders correctly
  even when autoplay is refused (iOS Low Power Mode, Data Saver)

Current file is 756 KB, which is comfortably within budget.

```bash
ffmpeg -i source.mov -t 10 -an -vf "scale=1920:-2" \
       -c:v libx264 -crf 26 -preset slow -movflags +faststart \
       assets/video/hero-desktop.mp4
```

### Logo

`assets/images/brand/logo-primary-transparent.png` (dark UI) and
`logo-primary-white.png` (over photography and on dark surfaces) are both
derived from the client's JPEG by `tools/make_logo_variants.py`.

**This is a stopgap.** See "Outstanding assets" below.

---

## Updating contact details

The phone number appears in the partials and in `main.js`. To change it:

```bash
grep -rl "562) 566-0150\|15625660150" src/ assets/js/main.js
```

Update every hit, then rebuild. The number lives in: `src/partials/header.html`,
`src/partials/footer.html`, most `src/pages/*.body.html`, `src/schema/*.json`,
and the `PHONE_DISPLAY` / `PHONE_HREF` constants in `assets/js/main.js`.

---

## Where things live

| Thing | Location |
|---|---|
| Page metadata (title, description, OG) | the `<!--meta -->` block in `src/pages/<page>.body.html` |
| Structured data (JSON-LD) | `src/schema/<page>.json`, injected at build |
| Canonical URL base | `SITE_URL` in `tools/build_pages.py` |
| Design tokens (colour, type, spacing) | `:root` at the top of `assets/css/styles.css` |
| Chat / contact avatar | `src/partials/footer.html`, `.contact-panel__avatar` |
| Gallery categories | `category` field in `data/gallery.json` |
| Product ranges and filters | `range` field in `data/products.json` |

---

## Design system

A **1:1 replication of aquatic-show.com** (Aquatique Show), applied to Acrylic
Pros' own content and photography. Their system, taken from their compiled
stylesheet and measured in the browser rather than guessed at:

| Their token | Value | Role here |
|---|---|---|
| `--clrdarkblue` | `#000D1A` | `--navy-deep` — deepest ground, menu overlay, hero scrim |
| — | `#00284D` | `--navy` — heading ink on white, panels, footer |
| `--clrgold` | `#C79D47` | `--accent-base` — the contact pill, eyebrows |
| `--clrgolddark` | `#CEA95D` | `--accent-light` — hover, and gold on navy |
| `--clrfontaine` | `#4180C9` | `--water` — links, water accents |
| `--clraquatique` | `#6541CB` | `--coral-purple` — the active pill in the category selector |
| — | `#221C35` | `--violet` — the html ground behind the rounded page |

**Structure** — a page is a stack of alternating full-bleed **dark media bands**
and **white bands**, with nothing between them. White bands carry navy ink, dark
bands carry white, and gold appears on the fixed contact pill and on section
eyebrows and essentially nowhere else, which is what makes it read as brand
rather than as decoration.

**Ground modifiers** — white is the default, so a section only declares a ground
when it departs from it: `.section--tint`, `.section--ice`, `.section--deep`,
`.section--black`.

> One mechanism, two grounds: `.section--deep`, `.section--black` and the footer
> redefine `--surface`, `--ink`, `--text-*`, `--border`, `--accent` and `--tile`
> rather than duplicating every rule. Components inherit whichever context they
> land in.

**The stacked panel** replaced the wave divider. On Aquatique two bands meet on
a 32px top radius: the next band lifts over the one above it, so the page reads
as sheets sliding over each other. `src/partials/wave.html` is no longer
included by any page and the coral artwork with it — Aquatique has no such
device anywhere.

**Type** — they licence **Matter VF** (Displaay, commercial). **Plus Jakarta
Sans** is the closest freely-licensed analogue — geometric grotesk, tall
x-height, low stroke contrast, near-identical width at the same optical size —
and it was already self-hosted here. Same 200–800 axis, so the 300 display
weight is real rather than synthesised.

Their measured desktop scale, matched exactly: h1/h2 **80px**, h3 60, h4 40,
h5 34, body **16 / 24**.

> The signature is the **weight mix**, not colour: display type sets at **300**
> and the one or two words that matter jump to **700** inside the same line —
> "The **wonder** of **water** show", "Our **products**". `.hl` is that jump,
> and it changes weight while inheriting everything else. The second half is
> tracking: their h2 runs `-0.06em` at 1.0 leading, and the tracking tightens as
> the step grows rather than staying fixed.

It is a variable font, so `tools/dedupe_fonts.py` collapses the advertised
weights into one file per subset/style (10 files → 4, 72 KB total).

**Chrome** — not a bar. Three objects floating over the page: a glass burger
pill on the left that says MENU in words, the logo centred, and the gold contact
pill on the right. The header never gains a background on scroll. That only
works because every link lives in the **full-screen overlay menu** — a stack of
very large 300-weight links on `#000D1A`, grey at rest, white on hover, with
secondary links and socials on one thin row along the bottom. The chrome stays
above the overlay and visible while it is open, exactly as theirs does.

**Section archetypes** (styles §27) — their homepage is built from six
archetypes and nothing else, each measured in the browser at 1440px rather
than approximated:

| Archetype | Theirs | Measured values used |
|---|---|---|
| `.band` | `o-homeMagic` | `#00284D`, centred, padding `160px 0 500px` |
| `.showcase` | `o-homeShows` | `#0C0A09`, padding `170px 0 220px`, heading floats **over** the grid |
| `.product-rail` / `.p-card` | `m-slider` | cards `296 x 444`, radius `10px`, content `32px / 24px`, gap `24px` |
| `.feature-card` | `o-homeNews` | cream card, image left, one right-hand column |
| `.logo-strip` | `o-homeClients` | tiles `250 x 200`, radius `20px` |
| `.gold-band` | `o-prefooter` | `#C79D47`, white, padding `75px 0 60px` |

Plus the shared pieces: the tag pill (`rgba(255,255,255,.24)`, 10px/600, radius
24px), the circular stroke button, the segmented category selector with its
sliding pill, and the zoom-on-hover media card.

`.showcase` is the one a conventional layout would never arrive at and the one
that most makes the page theirs: the project grid is the section's *background*
and the heading sits in the middle of it, over the centre tile, with only a
radial scrim for legibility.

**Two layout rules, enforced site-wide**

1. **One axis.** A section heading and its supporting paragraph are always
   centred and stacked on the same centre line. There is no variant that puts
   the heading in a left column facing its own copy in a right one — that reads
   as two unrelated blocks. `.section__head--split` survives only as an alias to
   the centred form so an older page cannot silently reintroduce it.
2. **One line.** Section headings set at 48px against the full container width,
   not 80px against a narrow measure, so a heading of ordinary length fits on a
   single row. `text-wrap` is `pretty`, never `balance` — balancing is what
   splits a heading that would otherwise have fitted. `tools/` aside, this is
   checked directly: every `.section__head` heading on the site measures one
   line at 1440px.

**Radii and shadow** — everything is either a full pill or a 20px card; 32px on
the stacked page panel. Shadow is almost absent by design: the only real one is
what the contact pill grows on hover.

**Product photography is white-background cut-outs**, so on the light ground it
sits directly on the page — a tile there would just be a third nested box. Only
inside a dark band does it get a white tile (`--tile`, `.media--tile`,
`.product-card__media`). No image reprocessing.

**Motion** — both easing curves are lifted from their stylesheet unchanged:
`--ease-out: cubic-bezier(.23, 1, .32, 1)` runs the link underline wipe and the
slider ring, `--ease-expo: cubic-bezier(.19, 1, .22, 1)` runs scroll reveals.
Nothing uses a built-in easing.

**Scrolling is native, deliberately.** An earlier pass reproduced Aquatique's
Lenis smooth scrolling by hand — preventDefault the wheel, hold a target
position, ease the real one towards it each frame. It was removed because that
is exactly what made the page feel laggy. Frame timing was a clean 60fps
throughout; nothing was being dropped. The problem is structural: cancelling the
wheel and then chasing it with a lerp means the page is, by construction, always
behind the input, and no easing constant fixes that. Native scrolling is already
smooth, already compositor-driven, and already respects the visitor's trackpad
and OS settings.

For the same reason `backdrop-filter` is now confined to the two small chrome
pills. It is expensive to composite, and the button variant that carried it
appears many times per page; a flat translucent white is indistinguishable at
that opacity and costs nothing to scroll past.

Every pressable gets `scale(0.97)` on `:active`, and every hover effect is gated
behind `@media (hover: hover) and (pointer: fine)` so taps don't leave states
stuck.

**One deliberate departure.** Their capture panel is a newsletter signup. Ours
is not — a newsletter form on a static site with no list behind it collects
addresses that go nowhere. The footer panel is visually identical but hands the
address straight to the quote form as `?email=`, which is a request this
business actually answers.

---

## Verification

```bash
python tools/check_site.py        # static: links, assets, SEO, a11y, hygiene
python tools/test_pages.py        # browser: every page, 2 viewports
python tools/test_behaviour.py    # browser: lightbox, sliders, forms, filters
python tools/test_home.py         # browser: homepage motion, menu, sliders (Chrome)
python tools/test_inner.py        # browser: inner pages, transitions, scroll effects (Chrome)
```

The browser tests need a server on `127.0.0.1:8899` and Playwright
(`pip install playwright && playwright install chromium`); the last two also
need Google Chrome, because Chromium cannot decode the H.264 videos.

`check_site.py` fails the build on: broken links, missing assets, duplicate or
missing titles/descriptions, missing canonical, zero or multiple `<h1>`, images
without alt, unlabelled form controls, `srcset` without `sizes`, inline
`style=` attributes, Lorem Ipsum, and any SEO-spam token carried over from the
old WordPress install.

`test_behaviour.py` asserts, among other things, that **the forms never report
success**. If someone wires up a backend incorrectly, that test fails.

---

## Deployment

Upload the repository root. No build step runs on the server.

**Publish:** all root `*.html`, `product/`, `assets/`, `sitemap.xml`,
`robots.txt`.
**Do not publish:** `src/`, `tools/`, `data/`, `docs/` — `robots.txt` disallows
them, but excluding them from the upload is better.

Recommended host config:

- `404.html` as the custom error page
- Long cache on `assets/` (they are content-hashed by folder, not filename — bump
  on change), short cache on HTML
- `Content-Encoding: br` or `gzip` for HTML/CSS/JS
- HTTPS with HSTS

### Redirects from the old site

The old WordPress URLs differ. Set these 301s:

| Old | New |
|---|---|
| `/got-scratches-we-can-help/` | `/scratch-removal.html` |
| `/fabrication/` | `/custom-builds-installations.html` |
| `/pond-design/` | `/pond-design-construction.html` |
| `/about-us/` | `/about.html` |
| `/contact/` | `/contact.html` |
| `/gallery/` | `/gallery.html` |
| `/videos/`, `/video/` | `/videos.html` |
| `/shop/` | `/glass-tanks.html` |
| `/product/<slug>/` | `/product/<slug>.html` |
| `/warranty-of-products/` | `/warranty.html` |
| `/refund-and-return-policy/` | `/refund-policy.html` |
| `/privacy/`, `/privacy-policy/` | `/privacy-policy.html` |
| `/request-quote/` | `/quote.html` |
| `/payment/`, `/thank-you/`, `/shark-king/`, `/blog/` | `/` (410 or 301) |

---

## 🔴 Before launch

### 1. The existing WordPress site is compromised

The live site has nonsense brand-like tokens injected into the content area of
roughly 13 pages — `Bitnex Crestfort`, `Cresta Valtrion`, `Juvthorix`,
`Prämie Invexus` and others. Two have leaked into live Yoast meta descriptions.
This is consistent with a parasite-SEO / cloaked-link compromise.

**None of it is carried into this rebuild, and `check_site.py` fails if it ever
appears.** But a static rebuild does not remediate the source: whatever injected
it still has write access to that install. The WordPress site needs its own
security scan and clean-up, independently of this project.

### 2. Facts awaiting client confirmation

| Item | Status |
|---|---|
| "Since 2005" | Used site-wide. The live About page says "over a decade", which contradicts it and was dropped. **Confirm which is correct.** |
| SpaceX logo under "Trusted by" | Reproduced from the live site. Using a client's trademark as an endorsement normally needs written permission. **Confirm it exists.** |
| Before/after pairings | Six pairs identified by visual inspection (see `docs/specs/`). **Client should confirm each pair is the same tank.** |
| Business address and hours | **Neither exists anywhere on the live site.** None invented, no map embedded, and `LocalBusiness` schema carries `areaServed` but no `address`. Supply them and both can be added without a redesign. |
| Google rating | A Google Business Profile exists but no rating was verified. **No rating, review count or `AggregateRating` schema is used anywhere** — and none should be added without real, compliant source data. |

### 3. Legal pages need review

`warranty.html` and `refund-policy.html` reproduce the live text **verbatim**,
including its original grammar, which is unusual in places. Two corrections were
applied and nothing else: the live heading misspells "Warrenty", and the contact
email is typo'd there as `inf{at}acrylicpros{dot}com`.

`privacy-policy.html` **consolidates two conflicting policies** that were
published simultaneously on the live site. It is marked
`<!-- CLIENT LEGAL REVIEW REQUIRED -->` and must be reviewed by the client's
counsel before launch.

The live `/payment/` page — unedited WooCommerce sample boilerplate that
contradicts the real refund policy and still contains `{email address}` and
`{physical address}` tokens — was **not** migrated. It should be deleted.

### 4. Outstanding assets

| Item | Why it matters | Priority |
|---|---|---|
| **Vector logo (SVG)** | The only logo is a compressed, white-boxed WhatsApp JPEG. The transparent and reversed-out PNGs shipped here are derived from it and are a stopgap. The fin and script would trace cleanly. | **Critical** |
| Reef insert before/after photos | The service is promoted with **zero images**. The page's most persuasive element is deliberately absent rather than faked with live-coral shots. | High |
| Sign fabrication photography | None exists. The page is honestly short. | High |
| Pool panel photography | Exactly **one** genuine shot exists (`project-25`). | High |
| Relocation and emergency photography | None exists; warehouse/pallet shots stand in. | Medium |
| Dedicated maintenance photography | None exists; gallery imagery stands in. | Medium |
| Higher-resolution hero video | Current is an ezgif-converted MP4. | Medium |
| Chat avatar | Slot is ready in `src/partials/footer.html`. | Low |

**Images requiring source cleanup**

- `assets/images/brand/logo-primary.jpeg` — baked white background, JPEG
  artefacts. Superseded by the derived PNGs; replace with an SVG.
- `assets/images/video-thumbs/8P91EpgaeNA.jpg` — 480×360; YouTube publishes no
  higher resolution for that video. Re-upload the video or supply a still.
- The live site's About page carries a **stock photo of a dog and a cat**
  (`qtq70fmfjpeg-34.jpg`). It was not migrated.

### 5. Outstanding copy

33 `<!-- CLIENT COPY REQUIRED -->` markers across 14 pages mark every place
where real copy is needed. Nothing was invented to fill space.

```bash
grep -rn "CLIENT COPY REQUIRED" src/pages/
```

The largest gaps: acrylic sign fabrication (5), live corals (5), aquarium
relocations (3), stingrays & eels (3).

**Twelve of the fifteen service topics had no page at all on the live site** —
their entire copy was a two-sentence homepage tile. Those pages now exist and
are honest about what is missing, which is the single biggest SEO gain available
here.

---

## What was deliberately not carried over

- The four blog posts — all dated 14 June 2024, generic AI filler about aquarium
  supplies the company does not sell, filed under the theme's demo categories
  (`Man`, `Woman`, `Fashion`, `Tips`).
- The About page's "comprehensive library of educational resources" — describes
  a resource that does not exist.
- A YouTube embed of The Muppets' "Bohemian Rhapsody" (`tgbNymZ7vqY`) — the only
  YouTube embed on the live homepage, and a leftover template placeholder.
- `/shark-king/` ("Coming Soon" stub), `/thank-you/`, `/video/` (a near-empty
  duplicate of `/videos/`), and `/request-quote/` (an empty WooCommerce page).
- The WooCommerce cart and checkout. This build has **no commerce backend**, so
  it has no cart, no checkout and no "Add to Cart" anywhere. Every product CTA
  routes to the quote page or the phone.

---

## Browser support

Chrome, Edge, Firefox, Safari (current), iOS Safari, Android Chrome.

Notes on the two least-obvious choices:

- `picture { display: contents }` makes `<picture>` transparent to layout. It is
  required — `<picture>` defaults to `display: inline`, which silently collapses
  every `height: 100%` chain passing through it. Safe for accessibility:
  `<picture>` carries no semantics, the `<img>` does.
- The before/after slider's real control is a styled `<input type="range">`, so
  keyboard operation, touch and screen-reader semantics come from the platform
  rather than being reimplemented on a `<div>`.

`prefers-reduced-motion: reduce` disables parallax, reveal transforms and video
autoplay, and forces all content visible. Content never depends on an animation
to appear: if JavaScript fails entirely, the `.js` class is never set and every
reveal target stays visible.
