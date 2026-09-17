# Checkpoint: Aquatique-style rebuild, paused after the "core 6" inner pages

**Date:** 2026-09-17
**Status:** Paused at the client's request. Resume from the "Next" section below; do not redo finished work.

## Ground rules the client set

- Replicate https://www.aquatic-show.com/en exactly: its layout, section design and animations, filled with Acrylic Pros' content, photos and brand.
- Write fresh code. Do not build on the old `assets/css/styles.css` or `assets/js/main.js`.
- **The homepage is locked.** Do not change any of these until the client says so:
  - `src/pages/index.body.html`
  - `src/partials/home-head.html`, `home-header.html`, `home-footer.html`
  - `assets/home/home.css`, `home.js`, `lenis.min.js`
  - `assets/home/cloud.png`, `smoke.mp4`, `fin.png`
- All copy comes only from `src/CONTENT-SOURCE.md`. Invent no facts.
- Ask before building. The client approves each pass's design first.

## Done

| Pass | Pages | Spec |
|---|---|---|
| 1 | Homepage | `2026-09-17-homepage-aquatique-rebuild-design.md` |
| 2 | About (their "Our universe"), Process ("Our expertise"), Services index ("Our services"), Gallery ("Our references"), Contact, Quote ("Contact") | this file |

### Pass 2 architecture

**Partials**
- `src/partials/page-head.html` copies the homepage head and adds:
  - `pages.css` and `pages.js`, with `pages.js` loaded *before* `home.js`
  - an inline check for the `ap:transition` flag, which sets `html.is-entering`
- `src/partials/page-header.html` is generated from `home-header.html` by a scratch script, which added only two things:
  - `data-nav="{{NAV}}"` on the menu list, plus a `data-nav-item` on each link
  - the two transition panels
- The footer is the untouched `home-footer.html`.

**Styles and behaviour**
- `assets/home/pages.css` covers:
  - the inner hero (`-inner`, `-cloud`) and the section nav with its progress rings
  - the about, process, services, gallery and form templates
  - the lightbox, breadcrumb variants and page-transition panels
- `assets/home/pages.js` handles:
  - the transition: on link click it raises the navy and gold panels, then navigates at 800ms. The next page slides in over 1400ms and skips the smoke loader.
  - inner hero reveal and title split, via `data-page-hero` and `data-page-title`. `home.js` ignores both because it only looks for `data-hero` and `data-title`.
  - scroll-linked effects: section rings, word-by-word colour quotes, parallax, and the process step lines
  - the services filter and load more
  - the gallery cascade, load more, sticky filter pill, hover dimming and lightbox
  - form validation, still with `FORM_ENDPOINT = null` and never a fake success
  - the `?email=` prefill on the quote form
- `home.js` (untouched) still supplies Lenis, the menu, the `data-scroll` in-view classes, dark-UI switching and inline video play/pause on every inner page.

**Page setup**
- Each page's meta block sets `head: page-head`, `header: page-header`, `footer: home-footer`, and `nav: <menu key or empty>`.
- `tools/build_gallery.py` now emits the reference-tile markup, including a colour cycle and `-fullart` tiles.

### Verification at pause time (all passing)

| Command | Result |
|---|---|
| `python tools/check_site.py` | all checks pass |
| `python tools/test_inner.py` | 66/66 (new) |
| `python tools/test_behaviour.py` | 43/43 (lightbox, filters and forms updated to the new markup) |
| `python tools/test_home.py` | 44/44 |
| `python tools/test_pages.py` | clean; plain Chromium's aborted MP4 fetches are now ignored because it has no H.264 |
| `python tools/build_pages.py --check` and `python tools/fix_images.py --check` | up to date |

The homepage files are byte-identical to how they were at the start of pass 2 (hash-checked).

### Deliberate departures in pass 2

- **Forms:** keep inline error messages instead of relying on the browser's native bubble.
  - The contact form gained `interest`, `premises` and a required `consent` field.
  - The quote form gained a required `consent` field.
- **About:** has no team, founder or China block, because there is no real content for them. Client testimonials fill that section instead.
- **Transition:** navigation happens at 800ms because each page is a separate HTML file. Their site fetches the next page and swaps it in place.
- **Hero preloads:** removed from inner pages. The hero `<img>` already has `fetchpriority="high"`.

## Update: live-content migration (2026-09-17, later)

The client asked for two things:
- **Side rail:** comment it out, not delete it. It is now commented out in `home-header.html` and `page-header.html`.
- **Copy and images:** keep the design, but every page's copy and images must come from acrylicpros.com. This is done on all 26 source pages, both footers and the schema files. `src/CONTENT-SOURCE.md` holds the rules and the added live copy.

Tests were updated to match the new content. `test_home.py` now:
- expects the side rail to be absent;
- expects the video slider to end on "Awesome Shark Moat".

`test_behaviour.py` changed for the gallery:
- it uses the Fabrication filter;
- it expects the load-more button to hide after one click, because the live gallery has 35 photos.

After the migration, all checks and browser tests pass.

## Update: client feedback round (2026-09-17, evening)

These changes are done and verified:

- **Chrome:** every page now wears the same chrome.
  - Old pages and the 69 product pages use `head: legacy-head`.
  - `tools/build_legacy_css.py` generates `assets/home/legacy.css`.
- **Homepage hero:**
  - The "Acrylic Pros" label and both "+" toggles are gone.
  - The hero haze is lighter.
  - A Yelp badge was added. The client asked for nicer Yelp badges on page 10 of `thesharkking1.pdf`.
- **Videos block:**
  - It is shorter and no longer shows a quote mark.
  - Its videos play inline.
- **Homepage testimonials:** "Trusted by" was replaced with the three live testimonials.
- **Footer:**
  - The newsletter/estimate band and the About block are gone.
  - The social links now have icons.
- **Bottom breadcrumbs:** removed from the homepage, Gallery, Contact, Quote, Services and Process.
- **Estimate band:** added to Services, Process, Gallery and Videos.
- **Gallery:** tiles are photo-only.
- **Videos page:** rebuilt on the new system.
- **Menu:** the smoke video is masked, so there is no dark band at the top.
- **Text widths:** inner-page copy blocks are wider.

Lost on old pages: the old floating contact/chat panel (it lived in `footer.html`).

## Update: banners + shop (2026-09-17, night)

- **Page banner:** every page except the homepage now opens with `.m-pageBanner`.
  - The Videos banner plays the homepage video.
  - Product pages use the `-compact` variant.
- **Header colour:** on every inner page, `pages.js` sets it by sampling the band under the header. It strips the `data-dark-ui` markers first.
- **Glass Tanks:** rebuilt in the style of livingoceansaquariums.com.
  - Trust strip, "shop by range" tiles, filter chips, sort, load more (12 at a time) with state in the URL, a "ranges at a glance" table and a help card.
- **Product pages:** on the new system.
  - Sticky image, chips, quote link with `?tank=` (prefills the quote form), freight and warranty cards, spec table and accordions, related tanks.
- **Photo removed:** `scratch-11` (the barefoot worker) is off the site, as the client asked in the chat.

## Update: round 4 (2026-09-17)

- **Page banners:** breadcrumb and title only. Each old short line was moved into the page body, or dropped if the body already had it.
  - The first section below lifts over the banner with rounded top corners.
  - On About and Process, only the first white section is rounded, because their wrapper also holds dark sections.
- **Gallery:** back to its own dark grid with the "Gallery" title, and no banner.
- **About:** the quote is narrower, so the pinned photo no longer covers it.
- **Process:** much less empty navy before "Step by step".
- **Homepage video band:** plays on its own, muted, looping and without controls, through `data-yt-ambient` in `home.js`.
- **Menu:**
  - Glass tanks and Our process are now main links (with nav keys `glass-tanks` and `process`).
  - The social links have brand-coloured round icons.

## Update: round 5 (2026-09-17)

- **Menu:**
  - The seven main links are back at full size, and every link has its own hover card.
  - Process shows the tank video, Glass tanks the shop photo, About the About photo, and Videos a koi video frame.
- **Chat button (every page):**
  - A WhatsApp or text message goes straight to +1 562 566 0150, with a call link and quote link.
  - Topic chips fill in the message, and a nudge appears after 6 seconds.
  - The avatar is a placeholder: `assets/images/brand/chat-avatar.png`.
  - The client's AI character has not been delivered. `shark-king-mascot.png` is The Shark King logo (a different brand), so it is not used.
- **Homepage banners:** "Check out our glass aquarium selection" and "Got scratches? We can help!" (before/after reveal).
- **Homepage Instagram feed:** 12 real posts. Covers come from Instagram embed pages via `tools/build_instagram.py`.
- **Contact page:** the "Visit Acrylic Pros" section (map, address and hours placeholders) and a 10-question FAQ. Six answers come from live copy; four are placeholders.

## Next

1. ~~README: document the inner-page system.~~ **Done** after the first resume: the edit table, the two-systems note, the new form contract with `FORM_ENDPOINT` in `pages.js`, the project tree and the test list.
2. **Pass 3 (13 service pages): design written, awaiting client approval.** The spec is done (`docs/reference/aquatique-detail-pages-spec.md`, plus 180 frames). The page-by-page design is in `2026-09-17-service-pages-design.md`. Once the client says "build it", follow that file's build plan. The notes below are history.
   - **Client decisions already made:**
     - **Scratch removal:** keep the 6 before/after pairs, restyled as the slides of their drag image slider. Each keeps its compare handle and the range-input keyboard control; the `data-before-after`, `.ba__range`, `.ba__frame img` and `.ba__after img` hooks are tested in `test_behaviour.py`.
     - **Videos:** each page gets one featured in-place video block. It must use an ID that embeds: `-Zy5pNRdqUo` or `MJFgcdNB0dA` for scratch removal, `txtw546G9_8` for custom builds and sharks, `_Xb7Pd0_cWc` for ponds. The remaining videos become small cards linking out to YouTube. `uwtV-Dp0kc8`, `1p2a0Rf8mAA` and `q6UxS0Tbc2o` do not embed.
     - **Thin pages** (sign fabrication, emergency services, reef insert and similar): make them shorter and honest. Use their blocks only where real content exists, and keep the `CLIENT COPY REQUIRED` markers.
   - **Assumed defaults to confirm in the design:**
     - The 4 livestock pages (corals, tropical fish, sharks, stingrays & eels) use the same detail template.
     - Each page's current "Related" list becomes their "See also" service-card drag slider.
   - **Recon done so far:**
     - The content outline of all 13 pages; re-create it with a script that walks `src/pages/<slug>.body.html`.
     - 49 reference screenshots of their detail pages in `docs/reference/frames-detail/`, from a stopped spec agent.
     - **Not done:** the written spec `docs/reference/aquatique-detail-pages-spec.md`. Re-run the extraction for these blocks:
       - the service/reference detail hero with coloured category tags and reference city/date pills
       - `t-page__blocks`, `b-textImage` (`-overlapping` and its left/right variants), `b-content`, `b-twoColumns__wrapper`
       - `b-images` (`-fullscreen` and in-row) with their clouds
       - the in-place video block, the `m-slider -keepOverflow -drag` image slider with prev/next buttons, and the "See also" `m-sliderProducts` slider
       - breadcrumb and prefooter presence, and every block at 390px
   - **Resume steps:**
     1. Finish the spec.
     2. Present the pass-3 design in chat and get approval.
     3. Build the pages on `page-head`/`page-header`/`home-footer`, extending `pages.css`/`pages.js`.
     4. Extend `test_inner.py`, and keep `test_behaviour.py`'s before/after checks passing.
3. **Pass 4:** Videos (their "Blog & news" list), Glass tanks and the 69 product pages, Warranty, Refund and Privacy (their "Terms of use"), and 404.
4. **When all pages are migrated:** unlock the homepage and merge `home-header.html` into `page-header.html`. Give the homepage the panel transition, then retire `styles.css` and `main.js`.

## Waiting on the client

- The Matter font files. When they arrive, uncomment the `@font-face` block at the top of `home.css`; this needs the homepage unlocked.
- More client logos, and written permission for each, including SpaceX.

## Reference material

- `docs/reference/aquatique-homepage-spec.md` and `docs/reference/aquatique-inner-pages-spec.md` hold measured values and CSS/JS excerpts from the reference site, kept for design parity only.
- The screenshots from recon were session-temporary. Re-capture them with Playwright (`channel="chrome"`) if needed.
- Claude in Chrome was not connected during these passes.
