# Acrylic Pros — static → WordPress conversion plan

**Written for:** the developer doing the build, not the client.
**Status:** phases A–D and F built and verified. Phase E (Contact Form 7) is
deferred at the client's request, and phase G needs a real WordPress install.
**Date:** 2026-09-18

| Phase | State |
|---|---|
| A — assets, path rewriter | done — `tools/build_wordpress.py` |
| B — chrome + 94 page bodies | done |
| C — content plugin | done — 15 PHP files, lint clean, 64/64 tests |
| D — products.csv | done — `tools/build_products_csv.py` |
| E — Contact Form 7 | **deferred**, see §7 |
| F — handoff docs | done — `wordpress/*.md` |
| G — live install + browser pass | **not started**, needs the install |

Verification, last run: static site `check_site.py` all passed (95 pages),
WordPress build `tests/check.py` 1057/1057, plugin tests 64/64, `php -l` clean
on all 15 PHP files, plugin zip structurally verified.

**Two things this work turned up in the existing repo**, both now fixed:
- the 69 built product pages were stale, carrying a footer block the shared
  partial had already replaced;
- commit `d9f518b` edited the generated `index.html` directly, so any
  `build_pages.py` run would silently revert "our builds backdrop". The edit is
  now in `src/pages/index.body.html`, and a rebuild reproduces the shipped
  homepage byte for byte.

---

## 1. Decisions taken at intake

| Question | Answer |
|---|---|
| Build route | Elementor Pro — Theme Builder chrome + HTML widgets carrying the prototype markup verbatim |
| WordPress install | Fresh, on **our** server first; migrated to the client's domain later |
| Host access | **wp-admin only** — no SFTP, so no child theme |
| Permalinks | Pretty: `/about/`, `/scratch-removal/`, `/product/<slug>/` |
| Products (69 SKUs) | WooCommerce products, **store config deferred** — no gateway, tax or shipping this phase |
| Forms | Contact Form 7. Mail destination and SMTP wired in a later phase |
| Owner must edit | Gallery, Instagram feed, Service pages, Videos |

### What "Elementor" means here, precisely

The design is not Elementor-shaped: 430 KB of hand-written CSS, a Lenis
smooth-scroll rig, a smoke-video loader, page-transition panels, scroll-linked
section rings and parallax. If Elementor *lays out* these pages, the design dies.

So Elementor is a **container, not a designer**:

- Theme Builder holds one header template and one footer template, each a single
  HTML widget.
- Each page is one full-width Container → one or more HTML widgets holding the
  prototype's own markup.
- Elementor's Global Colors and Global Fonts are **disabled**; the theme's style
  layer is neutralised in CSS (§6).

Consequence to state in the handoff: the owner does not restyle these pages by
dragging widgets. They edit text inside HTML widgets, and they edit real content
(gallery, Instagram, videos, products) in proper wp-admin screens.

---

## 2. Because there is no SFTP: the plugin carries everything

One plugin, `acrylic-pros-content`, installed as a zip through
**Plugins → Add New → Upload**. It carries:

| Job | Why it is in the plugin, not elsewhere |
|---|---|
| `global.css`, `global.js`, fonts | wp-admin cannot write theme files, and the Media Library rejects `.woff2`. A plugin ships and enqueues its own files with `filemtime()` cache-busting. |
| `<html class="is-loading js">` | `language_attributes` filter. The prototype's CSS depends on that class. |
| `<body class="t-home">` etc. | `body_class` filter, mapped from the page slug. |
| `do_shortcode` inside HTML widgets | Elementor prints shortcodes literally without the `elementor/widget/render_content` filter. CF7 will not work without it. |
| Gallery / Instagram / Video CPTs + shortcodes | A theme switch must not take the client's content with it. |
| WooCommerce template overrides | No SFTP means no theme `woocommerce/` folder; `woocommerce_locate_template` does the same job from the plugin. |

Elementor Custom Code is used for **nothing**. One route only — two copies of a
script bind every handler twice, and the menu opens and instantly closes.

---

## 3. Asset strategy

| Asset | Where it goes | Path in markup |
|---|---|---|
| `home.css` + `pages.css` + `legacy.css` | concatenated → `plugin/assets/global.css` | enqueued with an `elementor-frontend` dependency |
| `lenis.min.js` + `pages.js` + `home.js` | concatenated in that order → `plugin/assets/global.js` | enqueued, deferred |
| 4 × Plus Jakarta Sans `.woff2` | `plugin/assets/fonts/` | `@font-face` in `global.css`, plugin-relative |
| `cloud.png`, `smoke.mp4`, `fin.png` | `plugin/assets/` | plugin-relative |
| SVG sprite | inline, top of `header.html` | `<use href="#i-name">` |
| 439 content images | Media Library, bulk upload | `/wp-content/uploads/YYYY/MM/<file>` — **root-relative**, so the domain move needs no rewrite |

Load order inside `global.js` is non-negotiable: **lenis → pages.js → home.js**.
`pages.js` must run before `home.js` because it clears the loader on a transition
entry. Reversed, the smoke loader stays stuck on screen.

`legacy.css` is already scoped under `:where(#main)`, so concatenating it after
`pages.css` is safe — it cannot reach the chrome.

### Path rewrites applied to every page body

| From | To |
|---|---|
| `about.html` | `/about/` |
| `index.html` | `/` |
| `product/<slug>.html` | `/product/<slug>/` |
| `assets/images/…` and `../assets/images/…` | `/wp-content/uploads/…` |
| `assets/home/*.css`, `*.js` | deleted — enqueued instead |
| absolute `https://acrylicpros.com/…` | root-relative, except canonical/OG/JSON-LD |

No `../` and no hardcoded domain survives the rewrite. That is what makes the
later domain move a DB search-replace and nothing else.

---

## 4. Page inventory

Chrome (header, footer, SVG sprite, chat widget) comes out of `src/partials/`
**once** and is shared by all 95 pages through Theme Builder.

### Pages (26)

| Source file | WP page | Slug | Notes |
|---|---|---|---|
| `index.html` | Home | `/` | Settings → Reading → static front page |
| `about.html` | About | `/about/` | |
| `services.html` | Services | `/services/` | filter + load-more JS |
| `process.html` | Process | `/process/` | |
| `gallery.html` | Gallery | `/gallery/` | `[ap_gallery]` — CPT-driven |
| `videos.html` | Videos | `/videos/` | `[ap_videos]` — CPT-driven |
| `contact.html` | Contact | `/contact/` | CF7 |
| `quote.html` | Request a Quote | `/quote/` | CF7, 20 fields, `?tank=` prefill |
| `glass-tanks.html` | Glass Tanks | `/glass-tanks/` | Woo shop landing |
| `scratch-removal.html` | Service | `/scratch-removal/` | |
| `custom-builds-installations.html` | Service | `/custom-builds-installations/` | |
| `maintenance.html` | Service | `/maintenance/` | |
| `aquarium-relocations.html` | Service | `/aquarium-relocations/` | |
| `emergency-services.html` | Service | `/emergency-services/` | |
| `reef-insert-restoration.html` | Service | `/reef-insert-restoration/` | |
| `pond-design-construction.html` | Service | `/pond-design-construction/` | |
| `acrylic-pool-panels.html` | Service | `/acrylic-pool-panels/` | |
| `acrylic-sign-fabrication.html` | Service | `/acrylic-sign-fabrication/` | |
| `sharks.html` | Service | `/sharks/` | |
| `stingrays-eels.html` | Service | `/stingrays-eels/` | |
| `tropical-fish.html` | Service | `/tropical-fish/` | |
| `live-corals.html` | Service | `/live-corals/` | |
| `warranty.html` | Warranty | `/warranty/` | legal — verbatim, do not reflow |
| `refund-policy.html` | Refund Policy | `/refund-policy/` | legal — verbatim |
| `privacy-policy.html` | Privacy Policy | `/privacy-policy/` | legal — verbatim |
| `404.html` | 404 | — | Theme Builder → Single → 404 |

### Products (69)

`data/products.json` → `products.csv` → **WooCommerce → Products → Import**, which
is built into wp-admin and needs no SFTP. Fields: name, slug, regular price,
description, short description, category (from `range`), image.

Woo single-product and archive templates are overridden from the plugin so the
markup stays the prototype's. Cart, checkout, tax, shipping and gateways are
**not configured this phase** — the catalog renders, buying does not.

---

## 5. Editable content

| Content | Mechanism | Owner edits at |
|---|---|---|
| Gallery, 35 items | CPT `ap_gallery` + taxonomy `ap_gallery_cat` + `[ap_gallery]` | Gallery → All Items |
| Instagram, 12 posts | CPT `ap_instagram` + `[ap_instagram]` | Instagram → All Posts |
| Videos | CPT `ap_video` + `[ap_videos]` | Videos → All Videos |
| Products, 69 | WooCommerce products | Products |
| Service pages, 15 | WP Pages, body split into **one HTML widget per section** | Pages → Edit with Elementor |
| Static prose (legal, About copy) | inside the HTML widget | same |

**The honest limit, to be written into OWNER-HANDOFF.md:** editing a service page
means editing HTML inside a code box. Splitting each page into per-section HTML
widgets keeps that edit small and local, but it is not drag-and-drop. Anything the
owner will change *often* belongs in a CPT above, not in a page body. If the list
is wrong, now is the cheap time to say so.

**Instagram feed:** shipped as a CPT the owner refreshes by hand. A live-API feed
plugin was not chosen because every one of them breaks when Meta rotates tokens,
and the breakage is silent.

---

## 6. Killing theme bleed

1. Hello Elementor as parent theme. Elementor → Site Settings → Layout → Default
   Colors **Disable**, Default Fonts **Disable**.
2. Hello Elementor → Settings → theme style layer off.
3. Hide the page title on every page, or the theme prints its own `<h1>` and every
   page ships two.
4. Scoped neutraliser at the **top** of `global.css`, above all component rules,
   one specificity step over bare element selectors, `:hover` variants wrapped in
   `:where()`, no `!important`. Container list: `.o-header`, `.o-footer`, `#main`,
   `.m-chat`, `.a-loader`.

---

## 7. Forms (CF7, wiring deferred)

| Form | Fields | This phase | Later phase |
|---|---|---|---|
| Contact | `name, email, phone, subject, interest[], premises, message, consent` | CF7 form built, markup matches prototype, validation intact | mail destination, SMTP, SPF/DKIM/DMARC |
| Quote | `premises, name, company, email, phone, contact_preference, address, city, state, zip, country, service, length, width, height, water_type, panels[], water_state, animals, message, consent` | same | same |
| Chat widget | — | no backend needed; WhatsApp and SMS deep links, ships as-is | — |

The prototype's own validation lives in `pages.js` and shows inline errors. CF7 has
its own. Running both double-reports every error, so `pages.js` form handling is
disabled on the two CF7 pages and CF7 owns validation. Field `name` attributes are
preserved exactly, so nothing downstream changes.

**Until SMTP is configured, a live form validates and appears to send while the
mail is silently dropped.** The forms therefore keep the prototype's existing
"not connected — call us" notice until the mail phase, unless you say otherwise
(§10.1).

---

## 8. SEO

- Yoast. Title and description per page, ported from each `src/pages/*.body.html`
  meta block.
- JSON-LD: `src/schema/*.json` already exists per page. Injected by the plugin on
  `wp_head`, with Yoast's own schema output disabled so there are not two
  competing entity graphs.
- Canonical and OG URLs generated from `home_url()`, never hardcoded, so the
  domain move is free.
- Redirect map from the old WordPress URLs, ported from README.md §"Redirects from
  the old site" and re-targeted at pretty URLs (`/got-scratches-we-can-help/` →
  `/scratch-removal/`). Loaded before launch, not after.
- Staging build is `noindex` site-wide until the domain move. This matters more
  than usual: a staging copy of a real site that gets indexed competes with the
  client's own domain.

---

## 9. Build order

| Phase | Output | Verified by |
|---|---|---|
| A | `wordpress/assets/global.css`, `global.js`, fonts, the path-rewrite script | `tests/check.py` passes |
| B | `header.html`, `footer.html`, 26 page bodies | markup diff against the prototype |
| C | `acrylic-pros-content` plugin + zip: enqueue, body class, shortcode filter, CPTs, templates | plugin activates clean, CPT screens render |
| D | `products.csv` + Woo template overrides | 69 products import, single product matches prototype |
| E | CF7 form definitions | forms render, validation fires |
| F | README-WORDPRESS, OWNER-HANDOFF, GO-LIVE, FORMS, SEO, REDIRECTS, TROUBLESHOOTING | — |
| G | Live install on our WP, browser pass while logged out | real install, caches purged first |

---

## 10. Open questions — answer before phase E and G

1. **Forms before SMTP.** Publish them sending to the WP admin address and accept
   that some mail is silently dropped, or keep the prototype's "not connected —
   call us" notice until SMTP exists? Default if unanswered: **keep the notice.**
2. **Instagram source.** Confirm the hand-maintained CPT is acceptable, or that the
   client wants a live feed later.
3. **Legacy pages.** 17 of the 26 pages still run `legacy.css` — the Aquatique
   rebuild is paused at pass 2, per
   `docs/superpowers/specs/2026-09-17-inner-pages-checkpoint.md`. Converting now
   freezes them in that state. That is fine in itself — they are complete and
   tested, just built on the older stylesheet — but if pass 3 is still coming, the
   conversion should follow it rather than precede it. **Which way?**
4. **Facts still unconfirmed by the client**, from README §"Before launch": "since
   2005", the SpaceX logo under Trusted by, and the missing business address and
   hours. These go live as they stand unless corrected.
5. **The client's existing WordPress is compromised** — parasite-SEO injection,
   with two tokens leaked into live Yoast meta. A fresh install avoids inheriting
   the content, but whatever has write access to that install still has it. It
   needs its own cleanup before or at the domain cutover, or the new site inherits
   the problem through the same hosting account.

---

## 11. Deliverables

```
wordpress/
├── assets/            global.css, global.js, fonts/
├── header.html  footer.html
├── *.html             26 page bodies
├── plugins/acrylic-pros-content/   + .zip
├── products.csv
├── forms/             CF7 form definitions
├── tests/check.py
├── README-WORDPRESS.md
├── OWNER-HANDOFF.md
├── GO-LIVE.md
├── FORMS.md  SEO.md  REDIRECTS.md
└── TROUBLESHOOTING.md
```
