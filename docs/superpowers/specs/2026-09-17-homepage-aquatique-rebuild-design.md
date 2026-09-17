# Homepage rebuild on the Aquatique Show system

**Date:** 2026-09-17
**Status:** Built and verified. Other pages are not yet migrated.

## Goal

Rebuild `index.html` from scratch so that its layout, typography and motion match https://www.aquatic-show.com/en section for section. The content, photography and brand are Acrylic Pros' own. Nothing was carried over from the previous homepage CSS or JS.

## Decisions (agreed with the client)

| Question | Decision |
|---|---|
| Scope | Homepage only. It has its own chrome, and the other 25 pages keep the old system until they are migrated. |
| Smooth scroll | The real Lenis 1.3.26, saved into the repo at `assets/home/lenis.min.js`, with Locomotive v5 defaults (`lerp .1`). |
| Typeface | Matter (licence supplied by the client). Until the files arrive, the page falls back to Plus Jakarta Sans. |
| "Blog & news" slider | Shows the client's YouTube videos instead. |
| "They trust us" | Shows only the SpaceX logo until the client sends more logos. With one logo the marquee stays static and centred. |

## Architecture

- `src/pages/index.body.html` declares `head: home-head`, `header: home-header` and `footer: home-footer`.
  - `tools/build_pages.py` now resolves partials per page, falling back to the defaults.
  - A page that supplies its own header also opens `<main>` itself.
- `src/partials/home-header.html` contains the SVG sprite, loader, header, side rail and menu. It also opens `.t-page`, the wrapper that the menu animation moves.
- `src/partials/home-footer.html` closes `main`, contains the footer, and closes `.t-page`.
- `assets/home/home.css` holds all styles. It uses 1rem = 10px and the reference's measured values.
- `assets/home/home.js` holds all behaviour, using the Web Animations API with anime.js easings mapped to cubic-beziers:
  - Lenis
  - in-view classes (`data-scroll`, `data-scroll-offset`)
  - dark-UI triggers
  - hero intro and line split
  - the menu page-shrink
  - the slider
  - the filter
  - the marquee
  - inline YouTube playback
- `tools/make_home_fx.py` generates `cloud.png`, `smoke.mp4` and `fin.png` from FFT noise. The reference's smoke video and cloud PNG are proprietary and are not reused.

## Section mapping

| Reference | Homepage |
|---|---|
| `m-hero` (video, loader wipe, line reveal) | Reef video, "Because your **tank** is **worth** it", read-more accordion |
| `o-homeMagic` (photo zooms 1.5→1, cloud) | God-rays photo, "**Your vision,** brought to life" |
| `o-homeProducts` (category pill, drag slider) | 13 service cards in the categories Design & build, Restoration & care and Livestock |
| `o-homeShows` (grid behind the heading) | 15 gallery tiles as a DOM grid, zooming 1.2→1 |
| Video band (inline YouTube) | `_Xb7Pd0_cWc` (koi pond) |
| `o-homeNews` (loop slider) | 7 YouTube videos, each linking out to YouTube |
| `o-homeClients` (marquee) | SpaceX tile |
| `o-prefooter` (gold) | "Request a **free estimate**", linking to the quote page |
| `o-footer` | Email panel that opens `quote.html?email=`, plus contact, link columns and socials |

## Deliberate departures

- **Hero scrim.** The reference footage is night-dark and ours is a bright reef, so a light radial scrim keeps the white type legible.
- **Descender room.** Masked headings and menu links get extra bottom padding (`.12em`) because Plus Jakarta's descenders are deeper than Matter's. Revisit this once Matter is installed.
- **No search or language controls.** The site has neither. The side rail offers call, contact, gallery and 24/7 instead, and on mobile a call button replaces the language button.
- **Hover videos.** Only the scratch-removal and tropical-fish cards have hover videos, because only those services have footage.
- **Band video.** `uwtV-Dp0kc8`, `1p2a0Rf8mAA` and `q6UxS0Tbc2o` report "unavailable" when embedded (tested on both YouTube embed domains), although their watch pages are fine. They are used only as outbound links.

## Pending from the client

- The Matter font files. Once they arrive, uncomment the `@font-face` block at the top of `home.css`.
- More client logos, plus written permission to show each one, including SpaceX.

## Verification

- `python tools/check_site.py` passes all static checks.
- `python tools/test_home.py` passes 44 behaviour checks across desktop, mobile and reduced motion. It needs Chrome.
- `python tools/test_pages.py` and `python tools/test_behaviour.py` still pass.
- Section heights at 1425px are within a few pixels of the reference (products 1051 / 1050.6, footer block 1209 / 1209.2).
