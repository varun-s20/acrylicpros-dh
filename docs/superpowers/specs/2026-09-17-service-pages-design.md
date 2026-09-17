# Pass 3 design: the 13 service and livestock pages

**Date:** 2026-09-17
**Status:** Awaiting client approval. Nothing is built yet.
**Reference:** `docs/reference/aquatique-detail-pages-spec.md` (their service and reference detail pages, measured).
**Homepage:** still locked. Pages build on `page-head` / `page-header` / `home-footer` and extend `pages.css` / `pages.js`.

## Client decisions already made

- **Scratch removal:** keep the 6 before/after pairs, restyled as slides of their image slider.
- **Videos:** one featured in-place video per page, using an ID that embeds. Other videos become small cards that open YouTube.
- **Thin pages:** shorter and honest. Keep the `CLIENT COPY REQUIRED` markers.

## The shared template (all 13 pages)

Their detail page is a hero, then one white column of blocks with navy runs cut in, then the "See also" slider, breadcrumb and footer. It has no section nav, no prefooter and no scroll reveals.

| Part | Their design | Our version |
|---|---|---|
| Hero | `-cloud` hero, 1260 tall, smoke and cloud at the bottom, coloured filled category pill, two-weight title, scroll cue, no paragraph. Pills pop in after 1s. | Same. Background is a **still photo** (their reference-page variant), because we have no per-service videos. Pill colour follows the services index: Design & build blue, Restoration & care purple, Livestock gold. |
| Hero paragraph | none | Dropped. Where that sentence is not already in the body, it moves into the first block. |
| Block column | White, 12rem between blocks (6rem on mobile). | Same. |
| Navy runs | Navy wrappers butted together, opened and closed by cloud seams. | Our old dark (`section--deep` / `section--black`) sections become navy runs. |
| Text + photo | `b-textImage`: text beside 1–3 overlapping rounded photos, either side. | Every "copy + photo" section. |
| Text only | `b-content`: optional big title, text left, right or centred. | Intro and text-only sections. |
| Numbered lists | (none on their detail pages) | `b-twoColumns__wrapper`: title over two text columns. Our 01/02/03 step cards become bold lead lines in the columns. |
| Full-bleed photo | `b-images -fullscreen`, cloud dissolving its bottom edge into white. | Our `.bleed` images. |
| Photo sets | Image slider (`b-slider`): tall rounded photos, active one centred, starts on slide 2, gold ring prev/next buttons that fade out at the ends, "Swipe" cursor. 4-up `b-gallery` for exactly four. | Collages and livestock photo sets use the slider (captions under photos). The 8 install photos use two 4-up galleries. |
| Video | `b-video -radius`: rounded 16:9 cover with play pill, plays inline. | One featured video, plus 1–2 link cards under it using the homepage video-card style. |
| Page-end CTA | `b-push__single` (on their reference pages): dark photo card, big title, gold button. | Our gold-band CTA copy goes here: title, gold "Request a quote" button, phone number. It sits just before "See also". |
| See also | `b-push -border`: grey rule, "See also", drag slider of service cards with hover video and dots. | The services index cards: all other services, with the current "Related" four first (13 cards, 10 dots on desktop). Uses the homepage slider as-is. |
| Breadcrumb | White bar: Home / Our services / Page. | Same, for livestock pages too. |
| Motion | None on blocks. Images fade in over 0.15s. Sliders settle with a spring. | Same, so these pages feel calmer than About and Process. That matches their site. |

### Scratch-removal slides

- Each of the 6 slides is a before/after pair at the slider's photo height (58.5rem desktop, 23.5rem mobile).
- Dragging the round compare handle moves the reveal line. Dragging anywhere else swipes the slider.
- The range input stays for keyboard users, so the `test_behaviour.py` hooks keep working.
- Before/After labels and the caption stay.

### Dark header over navy runs

Their header uses "last event wins". Over a run of several navy blocks it turns navy-on-navy: the logo and MENU pill disappear, and only the gold Contact button stays visible.

**Recommended: fix it.** The header should follow whatever is under it: white text over the hero and navy runs, navy text over white blocks. `home.js`'s existing counter cannot express "navy inside white", so `pages.js` handles this on detail pages.

## Page by page

`▼` = white-to-navy cloud seam, `▲` = navy-to-white seam, `N` = inside a navy run.

1. **Scratch removal** (purple). Title: "Got scratches? / **We can help.**"
   - textImage "Fine scuffs to deep, stubborn scratches." (scratch-08)
   - ▼ N textImage, image left: "We work around your livestock…" (scratch-13)
   - N two columns: "Any large acrylic panel." (4 items) ▲
   - content: "Six restorations, start to finish."
   - before/after slider (6)
   - full-bleed project-04
   - content, centred: "Twenty years of proven method"
   - video `-Zy5pNRdqUo`, with link cards for `uwtV-Dp0kc8` and `MJFgcdNB0dA`
   - CTA "Because your tank is worth it", then See also
2. **Acrylic pool panels** (blue). Title: "A window / **into the water.**"
   - content intro
   - single photo pond-3 with caption
   - ▼ N two columns: "Homes and commercial businesses." (spec marker kept) ▲
   - content, right: "We also restore the panels we didn't build." (link to scratch removal)
   - CTA, then See also. No video: none exists.
3. **Custom builds & installations** (blue). Title: "Vision, / **built to last a lifetime.**"
   - textImage "More than construction." (project-03)
   - full-bleed machinery-bw
   - ▼ N content: "Four stages, one standard."
   - N two columns (4 stages)
   - N textImage, image left: "If you have a specific vision…" (cad-renders) ▲
   - content "Our own floor, our own hands.", then slider of 3 collages captioned Warehouse / Fabrication / Showroom
   - content "Built into the architecture.", then 2 × 4-up gallery (8 installs)
   - video `txtw546G9_8`, with cards for `1p2a0Rf8mAA` and `5GzYcYq7j4A`
   - CTA "Let's build your dream aquarium", then See also
4. **Acrylic sign fabrication** (blue). Title: "Brand visibility / **matters.**"
   - Hero is navy with smoke only; no sign photo exists (marker kept).
   - content, centred: the two real paragraphs (4 markers kept)
   - CTA card with no photo (plain dark card), then See also. Deliberately short.
5. **Pond design & construction** (blue). Title: "Backyard paradise / **awaits.**"
   - textImage "The landscape of your dreams." (pond-1)
   - full-bleed koi-pond-collage
   - ▼ N content: "Drawn, laid out, then built."
   - N two columns (3 steps) ▲
   - textImage, image left: "Designed around the fish…" (pond-2)
   - textImage "Ponds with a window." (pond-3, link to pool panels)
   - video `_Xb7Pd0_cWc`, with cards for `8P91EpgaeNA` and `q6UxS0Tbc2o`
   - CTA "Let us bring your dream backyard to life", then See also
6. **Aquarium relocations** (purple). Title: "Point A / **to point B.**"
   - textImage "A move is the most fragile thing…" (project-28)
   - ▼ N two columns: "Three things we bring to every move." (markers kept)
   - N textImage, image left: "Tank and stand, moved together." (project-32) ▲
   - CTA "Moving? Tell us about the tank", then See also
7. **24hr emergency services** (purple). Title: "Tank emergency? / **Call now.**"
   - The hero keeps its gold "Call" button. This is a deliberate departure: the phone number must be visible without scrolling.
   - content, centred: "Any hour, any day", with Call / Text / WhatsApp / email links
   - ▼ N two columns: "What we bring to an emergency" (markers kept) ▲
   - CTA "Not an emergency? Still happy to help", then See also (this page had no Related list before)
8. **Maintenance** (purple). Title: "Balanced, beautiful, / **thriving.**"
   - content intro
   - ▼ N textImage "The same team, every time." (project-11, markers kept) ▲
   - textImage, image left: "Guidance from the first gallon." (project-27)
   - content, right: "Someone answers at any hour."
   - CTA "Worry-free enjoyment of your aquarium", then See also
9. **Live corals** (gold). Title: "Live / **corals**"
   - textImage "Live coral reef and invertebrates." (coral-reef-dense)
   - two columns: "Zoanthids. Acropora. Euphyllia." (names only, markers kept)
   - full-bleed project-04
   - ▼ N content "Colour, close up.", then navy slider (3 photos, white rings)
   - N textImage, image left: "Seen in person." (project-29) ▲
   - CTA, then See also
10. **Tropical fish** (gold). Title: "Tropical / **fish**"
    - textImage "No one offers a better selection…" (reef-tank-blue-light)
    - textImage, image left: "Neon Tetras. Angelfish. Clownfish." (angelfish, markers kept)
    - ▼ N content "Stocked and running.", then navy slider (3) ▲
    - full-bleed reef-tank-footer
    - CTA, then See also
11. **Sharks** (gold). Title: "**Sharks**"
    - textImage "We carry a large selection of sharks." (blacktip)
    - two columns: "The species we name…" (6 names in two lists, marker kept)
    - content, right: "World Wide Shipping." (marker kept)
    - ▼ N video `txtw546G9_8`, with cards for `1p2a0Rf8mAA` and `5GzYcYq7j4A`
    - N single photo project-19 ▲
    - CTA, then See also. The old Related link to Videos is dropped; Videos is in the menu.
12. **Stingrays & eels** (gold). Title: "Stingrays / **& eels**"
    - textImage "A great selection, freshwater and saltwater." (stingray)
    - two columns: "Freshwater. Saltwater." (markers kept)
    - full-bleed project-24
    - CTA, then See also. No navy run.
13. **Reef insert restoration** (purple). Title: "Color, / **put back.**"
    - textImage "Tired of a dead, colorless reef insert?" (soft-corals-macro; the empty before/after marker is kept)
    - ▼ N content "What a reef is supposed to look like.", then navy slider (3)
    - N content, centred: "Under actinic light" (marker kept) ▲
    - CTA "Give your reef insert its color back", then See also

## Build plan (after approval)

1. **`pages.css`**
   - detail hero pills and title
   - `t-page__blocks`, reverts and cloud seams
   - `b-textImage`, `b-content`, `b-twoColumns__wrapper`, `b-images`, `b-gallery`, `b-separator`, `b-video -radius`
   - `b-slider` and its rings, `b-push -border`, `b-push__single`
   - before/after slide styling and the video link cards
   - 390 rules and the reduced-motion rules
2. **`pages.js`**
   - the centred image slider: start on slide 2, no trimming, buttons disabled at the ends, spring settle with τ ≈ 70ms, drag cursor
   - the before/after compare (ported from `main.js`)
   - the detail-page dark-UI rule
   - the featured video player
3. **Page bodies:** rewrite the 13 bodies (`nav: services`). Keep each page's meta, schema and markers.
4. **Tests:**
   - extend `test_inner.py`: every page for hero, pills, seams, slider start/ends/drag, See also, CTA card, breadcrumb, no overflow at 390, and dark UI over navy
   - keep `test_behaviour.py` passing; rerun `check_site`, `test_home`, `test_pages` and the homepage lock
5. **Docs:** update the checkpoint and README.
