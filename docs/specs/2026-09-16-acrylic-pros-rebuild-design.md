# Acrylic Pros — Website Rebuild Design Spec

**Date:** 2026-09-16
**Status:** Built. Sections 1 and 2 (brand tokens, typography) are
SUPERSEDED — the site was subsequently rebuilt to a 1:1 replication of
aquatic-show.com at the client's direction. The current design language is
documented in the Design system section of README.md and in the header of
`assets/css/styles.css`. Everything else in this spec (the audit findings, the
content decisions, the page inventory, the SEO plan) still stands.
**Source of truth:** acrylicpros.com, audited 2026-09-16 (full-page HTML pull, verbatim copy capture)
**Stack:** HTML5 + CSS3 + vanilla JS. One shared `styles.css`, one shared `main.js`. No framework, no build step for pages, no jQuery.

---

## 0. Audit findings that shape this design

The live site is WordPress 7.0.4 + WooCommerce 10.1.4 + Visual Composer, on a GoDaddy **Go** child theme. Six findings changed the plan:

1. **Twelve of the fifteen required service topics have no page.** Their entire copy is a 2–3 sentence homepage tile. `/corals/`, `/sharks/`, `/relocations/` look like pages but are WordPress attachment URLs that 301 to raw PNG icons. Only Scratch Removal, Fabrication, and Pond Design have real pages. **This is the single largest SEO gain available** — twelve landing pages that currently do not exist.
2. **Undeclared e-commerce.** 69 WooCommerce SKUs with live prices, cart, checkout, and a warranty page. Not mentioned in the brief. Resolved: static catalog, no checkout (§3).
3. **SEO spam injection on ~13 pages.** Tokens such as `Bitnex Crestfort`, `Cresta Valtrion`, `Juvthorix`, `Prämie Invexus` are appended to the content area, and two have leaked into live Yoast meta descriptions. Consistent with a parasite-SEO compromise. **None of it migrates.** The existing WordPress install needs an independent security scan — a static rebuild does not remediate the source.
4. **Two live placeholders on the production homepage:** a YouTube embed of The Muppets' "Bohemian Rhapsody" (`tgbNymZ7vqY`) — the only YouTube embed on the page — and no `og:image` anywhere on the site. Both dropped/fixed.
5. **Legal conflict.** Two privacy policies (`/privacy/` and `/privacy-policy/`) and two refund policies (the real one, plus unedited WooCommerce sample boilerplate at `/payment/` still containing `{email address}` and `{physical address}` tokens). Consolidating to one of each.
6. **No address, no hours, no FAQ, no `og:image`.** Genuinely absent site-wide — not withheld. Only geographic signal is the Yelp slug `acrylic-pros-anaheim` and "Southern California and nationwide."

### Verified facts carried forward

| Fact | Exact value | Source |
|---|---|---|
| Phone | `+1 (562) 566-0150` → `tel:+15625660150` | site-wide |
| Email | `info@acrylicpros.com` | homepage `mailto:` |
| Founded | `Expert Aquarium Services Since 2005` | homepage H4 |
| Tagline | `BECAUSE YOUR TANK IS WORTH IT` | hero |
| Footer line | `WE LOVE FISH. ACRYLIC PROS AQUARIUMS.` | footer |
| Service area | `Southern California and nationwide` | homepage, scratch page |
| Fish safety | `100% fish and coral safe!` | scratch tile |
| Emergency | `24/7 emergency services, temporary holding tanks and life support systems` | homepage tile |
| Clients | `1811 clients we have serviced all over California and the United States` | homepage |
| Warranty | 6-month leaks/cracks, 2-year sealant failure | warranty page |
| Shipping | `NEED TO SHIP BY FREIGHT, NO FREE SHIPPING` | every product |
| Owner | Chris (first name only, appears only inside testimonials) | testimonials |
| Instagram | `@acrylic_pros_corp` | footer |
| Yelp | `acrylic-pros-anaheim` | footer |
| Facebook | `facebook.com/acrylicpros1` | footer |
| YouTube | `youtube.com/@AcrylicPros` — exists, **not currently linked from the site** | oEmbed |
| WhatsApp | `wa.me/15625660150` | float widget |

**Resolved claim conflict:** homepage says "Since 2005" and the scratch page says "more than 20 years"; the About page says "over a decade." Per your decision, **"Since 2005" is used site-wide** and the About page wording is dropped. Flagged in README for client sign-off.

### Claims deliberately NOT carried forward

- About page's "comprehensive library of educational resources" — describes a resource that does not exist.
- Four blog posts (all dated 14 Jun 2024, stock AI filler about aquarium supplies the company does not sell, filed under theme-demo categories `Man` / `Woman` / `Fashion` / `Tips`).
- `/payment/` WooCommerce boilerplate, `/shark-king/` "Coming Soon" stub, `/thank-you/`, `/video/` (near-empty duplicate of `/videos/`).
- Anything resembling an award, certification, rating, or review count. Yelp's SERP title shows "108 Photos & 18 Reviews" but no rating was verified, so **no rating, review count, or `AggregateRating` schema is used anywhere.**

---

## 1. Brand tokens

Extracted from the live theme CSS. Nothing invented. The live palette runs four competing blues plus an unused theme gold; this consolidates without changing the brand's identifiable colour.

```
--brand-primary:   #236599   /* steel blue — carries every commerce + form button today */
--brand-accent:    #42a6dc   /* lighter blue — owns every link site-wide today */
--brand-deep:      #0267c1   /* strong blue — homepage CTAs */
--brand-signal:    #eb9622   /* orange — reserved for emergency/urgent only */
--brand-slate:     #6896b0   /* muted slate — panel washes */

--ink:             #05212d   /* heading ink, from --go--color--secondary */
--text-primary:    #0d1519
--text-secondary:  #434a56   /* body, from --go--color--text */
--text-muted:      #6e6e6e

--surface:         #ffffff
--surface-soft:    #f9f4ef   /* warm off-white, from --go--color--tertiary */
--surface-dark:    #05212d
--surface-black:   #08090a

--border:          rgba(5, 33, 45, 0.12)
--hairline:        rgba(5, 33, 45, 0.08)

--container:       1440px
--measure:         68ch
```

`#eb9622` is demoted to a **signal colour** used only on the emergency page and the sticky call bar. Everything else is blue, ink, and white — so the orange actually means something when it appears.

**Logo problem:** there is no vector or transparent logo anywhere. The production header logo is `cropped-WhatsApp-Image-2025-11-21-at-1.56.17-AM.jpeg` — a 1599×479 **JPEG with a baked white background**, which cannot sit on a dark or photographic header. A white-on-black stacked PNG (`ff_l_ogo.png`) exists and will be used on dark surfaces. **An SVG re-trace of the fin + script is the single highest-value asset request** and is logged in the missing-assets list.

---

## 2. Typography

Self-hosted woff2 in `assets/fonts/`, preloaded, `font-display: swap`. No Google Fonts request — one fewer third-party connection on the LCP path. Both faces are SIL Open Font License, free for commercial use.

Chosen by auditing what the four reference sites actually load:

| Reference | Display | Body |
|---|---|---|
| Okeanos | Playfair Display | Inter |
| **CaVenza** | **Cormorant Garamond** | **DM Sans** |
| **Aquarium Architecture** | **Cormorant Garamond** | **DM Sans** |
| Living Oceans | — | Plus Jakarta Sans |

The two most luxury-interiors references converge on the identical pairing, and both faces are OFL — satisfying the brief's condition that the pairing may be used only if freely licensed and appropriate.

- **Display — Cormorant Garamond.** High-contrast Garamond revival. Elegant at display size, genuinely architectural.
- **Body/UI — DM Sans.** Low-contrast geometric grotesk. Clean at small sizes, tabular numerals for prices and tank dimensions.

```
--font-display: "Cormorant Garamond", "Iowan Old Style", Georgia, "Times New Roman", serif;
--font-body:    "DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
```

**Legibility guardrail.** Cormorant's light weights are genuinely fragile — hairline strokes break up on low-DPI displays and fail contrast at small sizes. Therefore: display use only, never below `1.5rem`, minimum weight 400 under `3rem`, weight 300 permitted only above `4rem`. DM Sans carries every functional surface — nav, buttons, forms, body, captions, prices. This keeps the editorial elegance without paying a mobile legibility tax.

The live site loads Crimson Text but overrides it away with `!important` so everything renders Nunito Sans. Neither face is retained — no brand equity is lost, because no heading on the live site currently uses the serif it loads.

Scale (fluid, `clamp()`):
```
--step-display: clamp(3rem, 8vw, 9rem)      /* hero, section openers */
--step-h1:      clamp(2.5rem, 5.5vw, 5rem)
--step-h2:      clamp(1.9rem, 3.4vw, 3.25rem)
--step-h3:      clamp(1.35rem, 2vw, 1.75rem)
--step-body:    clamp(1rem, 0.45vw + 0.92rem, 1.19rem)
--step-eyebrow: 0.75rem                      /* uppercase, 0.14em tracking — the ONLY uppercase use */
```

Heading tracking `-0.02em`, display line-height `0.98`, body `1.7`.

---

## 3. Page map

27 hand-authored pages + 69 generated product pages.

### Core
| File | Source | Composition |
|---|---|---|
| `index.html` | homepage (verbatim) | Cinematic — 17 sections per brief |
| `about.html` | `/about-us/` minus the false claim | Editorial, portrait-led, quiet |
| `services.html` | all 12 tiles | Index — large visual panels, no cards |
| `gallery.html` | `/gallery/` 34 photos | Image-dominant asymmetric grid + lightbox |
| `process.html` | **real** steps from `/fabrication/` + `/pond-design/` | Numbered editorial |
| `contact.html` | `/contact/` | Direct, high-contrast |
| `quote.html` | `/contact/` Quote Form fields | Consultation editorial |
| `videos.html` | `/videos/` 9 real YouTube videos | Facade-loaded grid |
| `404.html` | — | Minimal |

**`process.html` uses verified steps only.** The live Fabrication page publishes a genuine four-step workflow — *Design Drawings → Quality Materials → Craftsmanship → Installation* — each with real body copy. Pond Design publishes its own — *Design Drawings → Koi Pond Layout → Pond Construction*. Both carry through verbatim. **No process is invented.**

### Services (15)
`scratch-removal` · `acrylic-pool-panels` · `custom-builds-installations` · `acrylic-sign-fabrication` · `pond-design-construction` · `aquarium-relocations` · `emergency-services` · `maintenance` · `reef-insert-restoration` · `live-corals` · `tropical-fish` · `sharks` · `stingrays-eels` · `glass-tanks` (catalog index) · `aquarium-restoration` (folds into scratch-removal as an anchor, not a separate page — the live site treats them as one service)

### Commerce (static catalog, no checkout)
`glass-tanks.html` — catalog index, filterable by range (Peninsula / Starphire / Reef Pro / Aqua Japan / Frag / Shallow Peninsula / Marine / AIO / specialty).
`product/<slug>.html` × 69 — real name, real price, real spec bullets, `NEED TO SHIP BY FREIGHT, NO FREE SHIPPING`, `Check Warranty Details` link. **Every CTA is "Request a Quote", never "Add to Cart".** No cart, no checkout, no payment UI — nothing that implies a transaction the static site cannot complete.

> **Generated, not hand-written.** 69 product pages from one template would be the exact "15 copies of the same file" the brief forbids — but for a product catalogue a template *is* the correct answer. `tools/build-products.py` reads `data/products.json` and emits static HTML. The generator is a dev tool; the shipped artifact is plain static HTML with no runtime dependency. Documented in README.

### Legal
`warranty.html` (verbatim, `Warrenty` typo corrected) · `refund-policy.html` (verbatim) · `privacy-policy.html` (the two live policies consolidated into one; the unfilled `[ADD CONTACT INFORMATION...]` token removed)

---

## 4. Page differentiation

Shared CSS, per-page `<body class="page page--x">` driving genuinely different compositions:

| Page | Directive |
|---|---|
| Scratch Removal | Transformation-driven. Three before/after sliders, full-bleed. Heaviest page. |
| Pool Panels | Architectural. Technical, wide, restrained. Minimal text, large scale. |
| Custom Builds | Cinematic, project-driven. Largest photography. |
| Pond Design | Natural, immersive. Warm surface palette, wider measure. |
| Maintenance | Calm. Generous whitespace, narrow measure, no full-bleed. |
| Emergency | **Anti-luxury on purpose.** Phone above the fold, orange signal, sticky call bar, shortest path. Conversion beats restraint here. |
| Reef Insert | Colour-transformation. Dark surface so actinic blues read. |
| Relocations | Process-driven, sequential. |
| Livestock (4) | Large photographic panels. No price, no cart, no shop styling. |
| Gallery | Image-dominant. Type recedes. |
| Quote | Editorial consultation. Single column, oversized fields. |

---

## 5. JavaScript

One `assets/js/main.js`. IIFE, no globals, `DOMContentLoaded`, every module guarded by a presence check so no page errors on a component it lacks.

```js
initNavigation, initMobileMenu, initHeaderScroll, initScrollReveal,
initBeforeAfter, initGalleryFilters, initLightbox, initAccordions,
initVideoFallback, initContactPanel, initForms, initStickyMobileCTA,
initYouTubeFacade, initProductFilters
```

Notable:
- **`initBeforeAfter`** — pointer events (mouse + touch in one path), `ArrowLeft`/`ArrowRight`/`Home`/`End` keyboard, `role="slider"` with `aria-valuenow`, `<input type=range>` as the real accessible control, visually styled as the handle. No plugin.
- **`initVideoFallback`** — awaits `video.play()`; on rejection (iOS Low Power Mode, Data Saver) removes the video and leaves the poster as a plain `<img>`. Poster is the LCP element either way, so LCP does not depend on autoplay succeeding.
- **`initYouTubeFacade`** — poster + play button; the iframe is injected on click. Nine embeds would otherwise cost ~4MB and a dozen third-party connections on `videos.html`.
- **`initContactPanel`** — floating button opening real channels only: Call, SMS, WhatsApp (already live on their site), Request a Quote. **Not labelled a chatbot and not styled as one** — there is no AI backend. Avatar slot ready for the client's asset.
- **`initForms`** — constraint-validation API plus inline `aria-live` errors. **On submit it does not claim success.** It surfaces a message stating the form is not yet connected and offers phone/email instead. Endpoint hookup is a documented one-line change (§8).

`prefers-reduced-motion: reduce` disables parallax and reveal transforms, and sets `IntersectionObserver` elements visible immediately — content never depends on animation to appear.

---

## 6. SEO

Every page: unique `<title>`, unique meta description written from real copy (never a Yoast auto-excerpt), canonical, one H1, OG + Twitter tags **including `og:image`** — which the live site lacks entirely.

Heading defects fixed: homepage's two H1s → one; Scratch/Fabrication/Pond starting at H2 with no H1 → proper H1; Pond's empty H1 → removed; Shop's H1-below-H2 inversion → corrected.

JSON-LD (the only inline script permitted):
- `LocalBusiness` — name, phone, email, `areaServed`, `founder`, `foundingDate: 2005`, social `sameAs`. **No `address` and no `openingHours`** — both genuinely unknown. **No `AggregateRating`.**
- `Service` on each service page
- `BreadcrumbList` on all non-home pages
- `Product` on product pages with `offers.availability` and real `price`/`priceCurrency`
- `VideoObject` on `videos.html`
- **No `FAQPage`** — zero FAQ content exists on the live site, so there is nothing to mark up. The markup structure ships ready; the schema switches on once real Q&A is supplied.

`sitemap.xml` + `robots.txt` hand-authored. Descriptive filenames throughout.

---

## 7. Performance & accessibility

Targets: Performance 85+, Accessibility 95+, Best Practices 95+, SEO 95+.

- Hero poster is the LCP element — preloaded, never lazy. Video is `preload="metadata"`, separate mobile source.
- All other images `loading="lazy" decoding="async"` with explicit `width`/`height` to pin CLS at zero.
- AVIF/WebP generated from the scraped originals, `<picture>` with JPEG fallback.
- Zero third-party requests on first load — fonts self-hosted, YouTube facaded, Instagram uses local approved images rather than the Smash Balloon script.

WCAG 2.2 AA: semantic landmarks, skip link, visible focus (never removed, only restyled), `aria-expanded` on nav and accordions, focus trap + restore + scroll lock in the lightbox, labelled form controls with no placeholder-only labels, real alt text on the 34 gallery images that currently all carry `alt=""`.

---

## 8. Known gaps

### Missing assets
| Item | Impact | Priority |
|---|---|---|
| **Vector/transparent logo (SVG)** | Current logo is a white-boxed WhatsApp JPEG; cannot sit on dark or photographic surfaces | **Critical** |
| Higher-quality hero video | Current is an ezgif-converted MP4 | High |
| ~~Before/after pairs for scratch removal~~ | **Resolved** — 6 pairs identified by inspection (§8.1) | — |
| Reef insert restoration photography | Service is promoted with **zero images** on the live site | High |
| Pool panel photography | One usable shot exists (`project-25`, an outdoor pool viewing window) | High |
| Sign fabrication photography | None exists | Medium |
| Relocation / emergency photography | None exists | Medium |
| Chat avatar | Client-supplied, slot ready | Low |

### 8.1 Before/after pairings (identified by inspection, 2026-09-16)

The 20 scratch photos carry no before/after labelling. Pairs below were established by matching background, setting, fixtures and tank geometry across frames. **Every pairing requires client sign-off before launch** — logged in README.

| # | Before | After | Subject | Evidence |
|---|---|---|---|---|
| 1 | `scratch-01` | `scratch-02` | Long acrylic tank, driveway | Same driveway, same green + yellow houses across the street |
| 2 | `scratch-06` | `scratch-07` | Corner tank, marina view | Same room and marina view, daylight → dusk |
| 3 | `scratch-17` | `scratch-18` | Rectangular tank, twin blue overflows | Same garage, same overflow boxes |
| 4 | `scratch-15` | `scratch-16` | Cylinder tank with rock column | Same rock column, same wooden base, same warehouse |
| 5 | `scratch-13` | `scratch-14` | **Full tank, water and rockwork in place** | Same wooden cabinet, same room, same tile floor |
| 6 | `scratch-19` | `scratch-20` | Tapered cylinder | Same tapered geometry — *likely, lower confidence* |

**Pair 5 is the single most valuable asset on the site.** It shows a technician polishing a tank *still full of water with live rockwork in it*, then the finished result — photographic proof of the "with or without water, 100% fish and coral safe" claim. It currently sits unused on a page that hot-links it from a decommissioned host.

Not pairs — used as process and proof imagery instead: `03`/`04`/`05` (one install's build sequence), `08`, `11` (technician at work), `09`/`10`, `12` (finished standalone).

### Missing copy
Twelve services have 2–3 sentences each. Pages ship with that real copy plus `<!-- CLIENT COPY REQUIRED -->` markers. A `COPY-NEEDED.md` gives a per-page brief and target length.

### Location policy (decided)
**Service area only.** "Southern California & nationwide" plus phone and email. `LocalBusiness` schema carries `areaServed` but **no `address` and no `openingHours`** — both are genuinely unknown and will not be invented. No map embed. If the client later supplies a street address and hours, both the schema and the contact page accept them without a redesign.

### Needs client confirmation
Business address and hours (if they ever want them published) · "Since 2005" vs "over a decade" · written permission for the SpaceX logo · sign-off on all six before/after pairings in §8.1 · Google rating (unverified — omitted until confirmed).

### Not this project
The live WordPress SEO injection. Static rebuild does not remediate it; the source install needs its own scan.

---

## 9. Form endpoint

Per decision, no backend. `initForms` validates fully and **never fabricates a success state.** To connect production, one constant in `main.js`:

```js
const FORM_ENDPOINT = null; // set to your POST URL to enable real submission
```

Null → validate, then show "not yet connected, call or email us" with live contact links. Set → real `fetch` POST with error handling and a genuine success state. README documents the expected field names.

---

## 10. Build order

1. Tokens + reset + typography + layout primitives
2. Header, nav, mobile drawer, footer, buttons, contact panel
3. **`index.html` — review gate**
4. Priority services: scratch-removal, custom-builds, pool-panels, maintenance, reef-insert-restoration
5. Remaining services + livestock
6. gallery, about, contact, quote, process, videos
7. glass-tanks + generated product pages
8. Legal pages
9. SEO, schema, sitemap, robots
10. Accessibility + performance + cross-browser QA
11. README, COPY-NEEDED.md, missing-assets list
