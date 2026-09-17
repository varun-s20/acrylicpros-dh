# Aquatique Show inner pages: design and motion spec

Companion to `ref2/SPEC.md` (homepage + shared chrome). That file already covers: fonts, colour tokens, easings, the `tx-*` type scale, the 16-column grid, buttons (`.a-button`), tags (`.a-tag`), the generic reveal system (`is-inview`, `enter-y`, lazy images), Locomotive/Lenis, page chrome stacking, header, side rail, full-screen menu, homepage hero + Title line-split module, footer, prefooter, and a short Barba note. **Nothing from there is repeated here unless an inner page uses it differently.**

Measured on 2026-09-17 in Chrome (Playwright, `channel="chrome"`), at **1440×900 (layout viewport 1425 — the 15px classic scrollbar is kept by launching without `--hide-scrollbars`)** and at **390×844 (`is_mobile`, `has_touch`, iPhone UA)**. CSS excerpts are verbatim from `ref2/site.pretty.css`, JS from `ref2/site.pretty.js`, with line numbers. 1rem = 10px. All `y` values are document coordinates unless stated. Raw dumps: `ref3/work/*_d.txt` (desktop) and `*_m.txt` (mobile), JSON next to them; scripts `ref3/work/u*.py`; server HTML (pre-JS) `ref3/work/raw_*.html`.

Colour names used below: **navy** `#00284d`, **darkblue** `#000d1a`, **gold** `#c79d47`, **black** `#0c0a09`, **white** `#fff`, **line grey** `#cbcbcb`, **text grey** `#4f4f4f`.

## Contents
1. Inner-page hero variants (`.m-hero`, `-cloud`, plain)
2. Section navigation (`.m-pageSummary`)
3. `/en/our-universe`
4. `/en/our-expertise`
5. `/en/our-services` (`t-productsindex`)
6. `/en/our-references` (`o-referenceGrid`) + reference detail
7. `/en/contact`
8. `/en/faq` accordion (+ `/en/news` list, brief)
9. Page transition (Barba) and first-load loader on inner pages
10. Shared inner-page pieces (breadcrumb, clouds, section eyebrow, text-scroll quote, parallax, dark-UI, utilities)
11. Page vertical rhythm (desktop + mobile)
12. Screenshot index (`ref3/frames/`)
13. Not determined / caveats

---

## 1. Inner-page hero variants

### 1.1 Markup (server HTML)

`-cloud` variant (our-universe, our-expertise, our-services, reference and service detail pages):

```html
<section class="m-hero -txcenter -clrwhite -cloud js-hero" data-scroll>
  <div class="row m-hero__content">
    <div class="m-hero__wrapper column-16 lg-column-12 lg-offset-2 no-width">
      <ul class="m-hero__categoryTagsList">
        <p class="a-tag - m-hero__tag -hero -fill"><span class="a-tag__content"> Our universe </span></p>
      </ul>
      <div class="overflow-wrapper -static">
        <div class="m-hero__title">
          <h1 class="tx-h1 js-title" data-scroll data-module-title>Inspired by nature &amp; <strong>led by emotion</strong></h1>
        </div>
      </div>
      <div class="overflow-wrapper m-hero__textContent tx-p m-textContent">
        <div class="column-16"><p>With a long experience, …</p></div>
      </div>
    </div>
    <div class="m-hero__scrollDown">
      <span class="-tx600 tx-uni11 -txupp">SCROLL TO DISCOVER</span>
      <svg class="a-svg -arrow-right"><use href="#icon-arrow-right"/></svg>
    </div>
  </div>
  <figure class="a-video m-hero__background">
    <video class="a-video__video -cover" playsinline autoplay muted loop data-scroll data-scroll-repeat
           data-module-inline-video="heroCover" data-scroll-call="togglePlay, InlineVideo, heroCover" src="…m4v|mp4"></video>
  </figure>
  <div class="a-cloud"></div>
  <figure class="a-video m-hero__cloudVideo">
    <video src="/assets/videos/smoke.mp4" muted loop playsinline autoplay data-scroll data-scroll-repeat
           data-module-inline-video="heroCloud" data-scroll-call="togglePlay, InlineVideo, heroCloud"></video>
  </figure>
</section>
```

Plain variant (contact, news, terms; FAQ is plain + `tr-hero`): same `row m-hero__content > m-hero__wrapper` block but **no tag list, no `-cloud`, no `.a-cloud`, no smoke**, and the background is a still image instead of a video:

```html
<figure class="a-image -cover js-image">
  <img src="…-600x-q80.webp" class="a-image__image js-image-image" alt="…" width="2000" height="919" sizes="100vw" srcset="…600w, …1024w, …1440w, …1920w">
</figure>
```
(the hero image is eager — `src` present, no `data-lazy`). The news hero keeps the paragraph block; contact has title only.

Reference detail heroes add a second tag list under the title (`.m-hero__referenceTagsList` with `a-tag -reference` pills for city / date) and use coloured `-fill` category tags (e.g. `-aquatique`), see 6.9. The blog article uses `-blog` (not covered).

### 1.2 Differences from the homepage hero (`-home`)
- No `tx-website` brand line, no "+" more-content accordion, no bottom-right "last show" pill.
- **No background zoom**: the inner hero has no `data-scroll-css-progress`, so `--progress` is never written and `.m-hero__background` keeps `transform: none` (measured at every scroll position). The `scale(calc(var(--progress)/8 + 1))` rule is `.m-hero.-home` only.
- The title block is `.overflow-wrapper.-static > .m-hero__title > h1` — the *inner* `.m-hero__title` is not `-static`, so it plays `enter-y` (2s ease-quint) **as well as** the per-line Title animation (see 1.6).
- The paragraph block is itself an `.overflow-wrapper` (its `.column-16` child slides up). Its width is **100% of the wrapper** (1068.75px on `-cloud`), not 72.6667%: `.m-hero .overflow-wrapper{width:100%}` (0,2,0) beats `.m-hero__textContent{width:72.6667%}` (0,1,0).
- `-cloud` adds the static white-cloud PNG layer and makes the section 36rem taller than the viewport; the smoke video is identical to the homepage one.

### 1.3 Geometry

| | `-cloud` desktop | `-cloud` 390 | plain desktop | plain 390 |
|---|---|---|---|---|
| section height | `min-height: calc(100vh + 36rem)` = **1260**, padding 0 | content + `padding 16.2rem 0 48rem` → 1092 (universe), 1116 (services) | content-driven: contact **760**, news **784**, FAQ 760 | contact 555, news 627, FAQ 507 |
| `.m-hero__content` | flex, `align-items:center`, `min-height:100vh` (900), **padding 0** (row side padding removed too) | padding 0 | flex, `padding: 32.6rem 2rem 27.4rem` | `padding: 14.8rem 1.4rem 24rem` |
| wrapper (`lg-column-12 lg-offset-2`) | x 178.1, **w 1068.75** (75% of 1425), vertically centred: universe y 300–600, services y 254–646 | full 390 | x 193.1, **w 1038.75** (75% of 1385) | 362 |
| tag list | flex row, gap .8rem, **mb 5rem**; tag 90×21 | column, mb 2rem | – | – |
| `.m-hero__title` (inner) | mb **2.1rem** | mb 3.2rem | mb 0 | mb 0 |
| `h1.tx-h1` | 80px / lh 68px / ls -4px / 300, strong 600; `padding 1.2rem 1rem`; 2 lines = 160 tall, 3 lines = 228 | 56px / 47.6 / -2.24 | same as desktop | same |
| h1 at ≥1441px wide | `font-size: 10rem` | | | |
| paragraph | 16/24, full wrapper width, centred | `padding 0 2.4rem` → 342 wide | news: directly under h1 (no gap) | same |
| scroll-down | absolute, **`top: calc(100vh - 6.4rem)` = 836**, `bottom:2.4rem` (box 40 tall inside the 900 content box) | `position: relative; margin-top 3.2rem` | absolute `bottom: 2.4rem` → y 702 (contact) | absolute `bottom 1.6rem` |
| background | `figure.m-hero__background` abs 100%×100% z -1, video `.-cover` z -2, `object-fit: cover`, 1425×1260 | 390×1092 | `figure.a-image.-cover` abs full, z -2 (`.m-hero .-cover`), img cover | same |
| `.a-cloud` | abs, `top:1px / bottom:-1px`, full section size, z 2, `white-cloud.png` (2690×380 natural) `no-repeat` `bottom center` at natural size → a 380px band at y 880–1260, 632px cropped each side | band 380 tall, cropped to 390 | – | – |
| smoke | `.m-hero__cloudVideo` abs bottom 0, `translateY(2px)`, `mix-blend-mode: screen`, mask `linear-gradient(to bottom, transparent 0%, #0c0a09 10%)`; video 100% wide → 1425×629.4 (y 630.6–1260) | video `height 50rem; width auto` → 1132×500, left-aligned, clipped by the section's `overflow:hidden` | – | – |

Paint order inside the section: background (z -1/-2) → smoke figure (positioned, z auto) → `.a-cloud` (z 2, so the PNG sits **above** the smoke) → content (z 3). No dark overlay on either variant (`.m-hero::before` is empty); legibility comes from the footage.

Tag (`.a-tag.-hero.-fill`): `padding .5rem 1rem`, `border-radius 2.4rem`, bg `rgba(255,255,255,.1)`, white, 10px (inherited — no `tx-` class), weight 600, uppercase, line-height normal (11px) → 21px tall.

Scroll-down: label `tx-uni11` 11px/12.98 weight 600 uppercase; arrow `arrow-right` 13×13 rotated 90°; column gap .8rem. Static (no bounce).

```css
/* site.pretty.css L2854-2891 */
.m-hero.-cloud {
  padding:16.2rem 0 48rem;
}
.m-hero.-cloud .m-hero__content {
  padding:0;
}
@media only screen and (min-width: 1025px) {
  .m-hero.-cloud .m-hero__content {
    min-height:100vh;
  }
}
.m-hero.-cloud .m-hero__title {
  margin-bottom:3.2rem;
}
@media only screen and (min-width: 1025px) {
  .m-hero.-cloud .m-hero__title {
    margin-bottom:2.1rem;
  }
}
@media only screen and (min-width: 1025px) {
  .m-hero.-cloud .m-hero__scrollDown {
    top:calc(100vh - 6.4rem);
    margin-top:0;
  }
}
@media only screen and (max-width: 1024px) {
  .m-hero.-cloud .m-hero__scrollDown {
    position:relative;
    bottom:0;
    margin-top:3.2rem;
  }
}
@media only screen and (min-width: 1025px) {
  .m-hero.-cloud {
    min-height:calc(100vh + 36rem);
    padding:0;
  }
}
```
```css
/* site.pretty.css L2943-3067 */
.m-hero {
  position:relative;
  overflow:hidden;
}
.m-hero:before {
  content:"";
  position:absolute;
  top:0;
  left:0;
  z-index:-1;
  width:100%;
  height:100%;
}
.m-hero__categoryTagsList {
  display:flex;
  flex-direction:column;
  gap:.8rem;
  align-items:center;
  margin-bottom:2rem;
  opacity:0;
}
@media only screen and (min-width: 1025px) {
  .m-hero__categoryTagsList {
    flex-direction:row;
    margin-bottom:5rem;
  }
}
.m-hero__wrapper {
  display:flex;
  flex-direction:column;
  align-items:center;
}
.m-hero__title {
  display:flex;
  flex-direction:column;
  align-items:center;
  font-kerning:none;
}
@media screen and (width >= 1441px) {
  .m-hero__title .tx-h1,.m-hero__title .m-textContent h1,.m-textContent .m-hero__title h1 {
    font-size:10rem;
  }
}
.m-hero .a-line-wrapper {
  overflow:hidden;
  width:100%;
  padding:1.28% 0;
}
.m-hero .a-line-wrapper:not(:first-child) {
  margin-top:-4%;
}
.m-hero .a-line-wrapper:first-child {
  margin-top:-1.28%;
}
.m-hero .a-line-wrapper .a-line {
  transform:translateY(120%);
}
.m-hero .overflow-wrapper {
  width:100%;
}
.m-hero .tx-h1,.m-hero .m-textContent h1,.m-textContent .m-hero h1 {
  width:100%;
  padding:1.2rem 1rem;
  opacity:0;
}
.m-hero__content {
  position:relative;
  z-index:3;
  display:flex;
  align-items:center;
  padding-top:14.8rem;
  padding-bottom:24rem;
}
@media only screen and (min-width: 1025px) {
  .m-hero__content {
    padding-top:32.6rem;
    padding-bottom:27.4rem;
  }
}
.m-hero__referenceTagsList {
  display:flex;
  flex-direction:column;
  gap:1.6rem;
  margin-top:.8rem;
  opacity:0;
}
@media only screen and (min-width: 1025px) {
  .m-hero__referenceTagsList {
    flex-direction:row;
    margin-top:1.9rem;
  }
}
.m-hero__scrollDown {
  position:absolute;
  bottom:1.6rem;
  left:0%;
  z-index:3;
  display:flex;
  flex-direction:column;
  gap:.8rem;
  align-items:center;
  width:100%;
}
.m-hero__scrollDown .a-svg {
  flex-shrink:0;
  width:1.3rem;
  height:1.3rem;
  transform:rotate(90deg);
}
@media only screen and (min-width: 1025px) {
  .m-hero__scrollDown {
    bottom:2.4rem;
  }
}
.m-hero__textContent {
  padding-right:2.4rem;
  padding-left:2.4rem;
}
@media only screen and (min-width: 1025px) {
  .m-hero__textContent {
    width:72.6667%;
    padding-right:0;
    padding-left:0;
  }
}
```
```css
/* site.pretty.css L3105-3146 */
.m-hero__smoke {
  position:absolute;
  bottom:-.1rem;
  left:0;
  z-index:2;
  width:100%;
  height:auto;
  pointer-events:none;
}
.m-hero__cloudVideo {
  position:absolute;
  bottom:0;
  left:0;
  display:block;
  width:100%;
  height:auto;
  transform:translateY(2px);
  mix-blend-mode:screen;
  -webkit-mask-image:linear-gradient(to bottom,transparent 0%,#0c0a09 10%);
  mask-image:linear-gradient(to bottom,transparent 0%,#0c0a09 10%);
}
.m-hero__cloudVideo video {
  width:auto;
  height:50rem;
}
@media only screen and (min-width: 1025px) {
  .m-hero__cloudVideo video {
    width:100%;
    height:auto;
  }
}
.m-hero__background {
  position:absolute;
  top:0;
  left:0;
  z-index:-1;
  -o-object-fit:cover;
  object-fit:cover;
  width:100%;
  height:100%;
  pointer-events:none;
}
```
```css
/* site.pretty.css L3236-3241 */
.m-hero.is-inview .m-hero__categoryTagsList,.m-hero.is-inview .m-hero__referenceTagsList,.m-hero.is-inview .m-hero__blogInfo li {
  animation:enter-popin-up 1s cubic-bezier(.23,1,.32,1) 1s forwards;
}
.m-hero .-cover {
  z-index:-2;
}
```
```css
/* site.pretty.css L1792-1842 */
.a-cloud {
  position:absolute;
  bottom:-.1rem;
  left:0;
  z-index:2;
  width:100%;
  height:100%;
  background-image:url(/assets/images/white-cloud.png);
  background-position:bottom center;
  background-repeat:no-repeat;
  pointer-events:none;
}
.a-cloud.-top {
  top:-.1rem;
  bottom:auto;
  transform:rotate(180deg);
}
.a-cloud.-top.-height {
  position:relative;
  top:0;
  margin-top:-3rem;
  margin-bottom:-5rem;
}
@media only screen and (min-width: 1025px) {
  .a-cloud.-top.-height {
    margin-bottom:-6rem;
  }
}
.a-cloud.-height {
  position:relative;
  bottom:0;
  z-index:0;
  height:15rem;
  margin-top:-5rem;
}
@media only screen and (max-width: 1024px) {
  .a-cloud.-height {
    background-size:cover;
  }
}
@media only screen and (min-width: 1025px) {
  .a-cloud.-height {
    height:35rem;
    margin-top:-6rem;
    background-size:auto 100%;
    background-repeat:repeat-x;
  }
}
.a-cloud.-noMargin {
  margin:0!important;
}
```
```css
/* site.pretty.css L2185-2193 */
.a-tag.-hero {
  --color1: rgba(255, 255, 255, .1);
  --color2: #FFF;
}
.a-tag.-step {
  --color1: #FFF;
  --color2: rgba(255, 255, 255, .1);
  color:var(--color1);
}
```

### 1.4 Hero at 390
- `-cloud`: tags (column) → h1 (3 lines at 56px) → paragraph (6 lines, 342 wide) → scroll-down (relative, 32px below) → 480px bottom padding in which the smoke (500 tall) and the cloud PNG sit. Frames: `m390_universe_00_hero.png`, `m390_universe_01_hero_bottom.png`, `m390_services_00_hero.png`.
- plain: contact 148 top padding, h1 166.8 tall, scroll-down absolute 16px from bottom; 555 total.

### 1.5 FAQ hero extras
`.m-hero.tr-hero` (plain) adds the category chooser: desktop `ul.m-hero__faqList` (absolute, bottom 0, centred, `max-width 144rem`, `padding 0 1.4rem 6.4rem`, flex wrap, gap 1rem, z 4) of buttons — current category `a-button -primary -bggold -clrwhite` (a `<button>`), others `a-button -primary -bgwhite -clrnavy` links with `data-transition="faq"` (43.8px tall, radius 4.4rem, `padding 1.35rem 2.5rem`). Below 1025: hidden; instead `form.m-hero__faqSelect` = a white pill `<select>` (`padding 1.6rem 5.6rem 1.6rem 2.6rem`, radius 4rem, 18px, 64.4 tall, `margin-bottom 3.2rem`) with an `arrow-toggle` icon 1rem at `right: 4.6rem`; `change` → `barba.go(value)`.

```css
/* site.pretty.css L3188-3235 */
.m-hero__faqList,.m-hero__faqSelect {
  position:absolute;
  bottom:0;
  left:50%;
  z-index:4;
  width:100%;
  transform:translate(-50%);
}
.m-hero__faqList {
  display:flex;
  flex-flow:row wrap;
  gap:1rem;
  justify-content:center;
  max-width:144rem;
  padding:0 1.4rem 6.4rem;
}
@media only screen and (max-width: 1024px) {
  .m-hero__faqList {
    display:none;
  }
}
.m-hero__faqSelect {
  margin-bottom:3.2rem;
  padding:0 1.4rem;
}
.m-hero__faqSelect .a-svg {
  position:absolute;
  top:50%;
  right:4.6rem;
  width:1rem;
  height:1rem;
  transform:translateY(-50%);
}
.m-hero__faqSelect select {
  width:100%;
  padding:1.6rem 5.6rem 1.6rem 2.6rem;
  border:unset;
  border-radius:4rem;
  font-family:inherit;
  -webkit-appearance:none;
  -moz-appearance:none;
  appearance:none;
}
@media only screen and (min-width: 1025px) {
  .m-hero__faqSelect {
    display:none;
  }
}
```

### 1.6 Entrance
Everything is class-driven from the hero's `is-inview` plus the Title module:

| element | animation |
|---|---|
| `.m-hero__categoryTagsList` (and `.m-hero__referenceTagsList`) | starts `opacity: 0`; `enter-popin-up` = opacity 0→1 + translateY(3rem)→0, **1s ease-quint, 1s delay** |
| `.m-hero__title` (inner block) | `enter-y` translateY(120%)→0, **2s ease-quint** (measured 192px → 0 for a 160px block) |
| `h1 .a-line` (Title module) | translateY(120%)→0, **2000ms easeOutExpo**, `stagger(100)` (measured 81.6px → 0 for 68px lines); h1 `opacity 0` until the tween starts |
| `.m-hero__textContent > .column-16` | `enter-y` 2s ease-quint |
| scroll-down, background, cloud, smoke | no entrance animation |

Timing: on a **first load**, `is-inview` is set when Locomotive starts (hero is in the fold), i.e. at the same time the white loader starts its 2.5s wipe (section 9.3) — the title and loader move together. On a **Barba navigation**, `beforeEnter` adds `is-inview` **500ms** and creates the Title instance **700ms** after the new container is inserted (section 9.2).

---

## 2. Section navigation — `.m-pageSummary`

Used on `/en/our-universe` (4 items) and `/en/our-expertise` (3 items). Desktop only.

### 2.1 Markup and placement

```html
<div class="m-pageSummary__container" data-module-section-steps="section-steps">   <!-- wraps ALL anchored sections -->
  <div class="m-pageSummary row" data-module-page-summary="page-summary">
    <div class="m-pageSummary__wrapper column-2">
      <ul class="m-pageSummary__list">
        <li class="m-pageSummary__stepItem" data-page-summary="about-aquatique-show">
          <a href="#about-aquatique-show" data-scroll-to class="m-pageSummary__stepLink" data-scroll-to-offset="-120">
            <svg class="m-pageSummary__progress" viewBox="0 0 15 15">
              <circle class="-base" cx="7.5" cy="7.5" r="6"></circle>
              <circle class="-filled" cx="7.5" cy="7.5" r="6"></circle>
            </svg>
            <span class="tx-uni11 -txupp">About Aquatique Show</span>
          </a>
        </li>
        …
      </ul>
    </div>
  </div>
  <section class="o-universeAbout" id="about-aquatique-show" data-scroll data-scroll-repeat
           data-module-section-steps="about-aquatique-show" data-scroll-module-progress data-scroll-offset="33%,33%">…</section>
  …
</div>
```

- `.m-pageSummary` is an **absolute overlay over the whole container** (top 0, full height, `max-width 144rem`, centred with `left:50%; translate(-50%)`), `padding-top 8rem` + row side padding 2rem, z 5, `pointer-events: none`.
- The wrapper is `column-2` = 12.5% → **x 20, w 173.1**.
- The list is **`position: sticky; top: 20rem`** (200px), `display:grid; gap:1.5rem`, `padding-bottom:20rem`, `pointer-events:all`. Its natural top is container top + 80 (universe: y 1340) so it scrolls up with the first section until its top reaches 200 (at scrollY 1140), stays pinned at 200 through the whole page, and scrolls away only at the end of the container (universe: container ends at 15239; list top −87 at scrollY 15000).
- Items: link = flex row, gap 1.6rem, `align-items:center`. Ring svg 15×15, `rotate(-450deg)` (= −90°, so the arc starts at 12 o'clock and grows clockwise). Label `tx-uni11` 11px/12.98 uppercase, weight 400, width 133.9 (long labels wrap to two lines: row heights measured 15, 15, 25.9, 25.9; list 326.9 tall incl. padding).
- Colour: `--color` `#FFF` by default, `#00284D` when `body.-dark` (1s ease-quint colour transition). Rings: both circles `stroke: var(--color)`, `stroke-width: .1rem`; `-base` at opacity .2; `-filled` `stroke-dasharray: 37.714` and `stroke-dashoffset: calc(6.2857 * (6 - 6 * var(--progress) / 100))` = 37.714 × (1 − p/100).
- Labels: `opacity .5`, `1` when the item has `-is-active` (1s ease-quint). No hover style (cursor pointer only).
- Hidden: `display:none` at ≤1024px; `opacity:0` while the page is `-cropped` (full-screen menu open).

```css
/* site.pretty.css L3524-3596 */
.m-pageSummary {
  --color: #FFF;
  position:absolute;
  top:0;
  left:50%;
  z-index:5;
  width:100%;
  height:100%;
  padding-top:8rem;
  color:var(--color);
  opacity:1;
  pointer-events:none;
  transition:color 1s cubic-bezier(.23,1,.32,1),opacity 1s cubic-bezier(.23,1,.32,1);
  transform:translate(-50%);
}
.m-pageSummary__container {
  position:relative;
}
.m-pageSummary__list {
  position:sticky;
  top:20rem;
  z-index:2;
  display:grid;
  gap:1.5rem;
  padding-bottom:20rem;
  pointer-events:all;
}
.m-pageSummary__stepItem {
  --progress: 0;
}
.m-pageSummary__stepItem span {
  opacity:.5;
  transition:opacity 1s cubic-bezier(.23,1,.32,1);
}
.m-pageSummary__stepItem.-is-active span {
  opacity:1;
}
.m-pageSummary__stepLink {
  display:flex;
  flex-direction:row;
  gap:1.6rem;
  align-items:center;
  cursor:pointer;
}
.m-pageSummary__progress {
  flex-shrink:0;
  width:1.5rem;
  height:1.5rem;
  transform:rotate(-450deg);
}
.m-pageSummary__progress circle {
  fill:none;
  stroke:var(--color);
  stroke-width:.1rem;
}
.m-pageSummary__progress circle.-base {
  opacity:.2;
}
.m-pageSummary__progress circle.-filled {
  stroke-dashoffset:calc(6.2857142857 * (6 - 6 * var(--progress) / 100));
  stroke-dasharray:37.7142857143;
}
.-dark .m-pageSummary {
  --color: #00284D;
}
.-cropped .m-pageSummary {
  opacity:0;
}
@media only screen and (max-width: 1024px) {
  .m-pageSummary {
    display:none;
  }
}
```

### 2.2 Scroll-spy logic (JS)
Each anchored section is a Locomotive element with `data-scroll-module-progress` and `data-scroll-offset="33%,33%"` (position `start,end`). Locomotive computes, every frame while the section is within the 100% RAF margin:

```
start = sectionTop − vh + 0.33·vh        // section top is 67% down the viewport
end   = sectionTop − 0.33·vh + sectionHeight   // section bottom is 33% down the viewport
p     = clamp((scrollY − start) / (end − start), 0, 1)
```
(`"33%"` is parsed with `parseInt` → 33% of `innerHeight` = 297px at 900.) The `SectionSteps` module forwards `p` to `PageSummary.updateItemProgress`, which writes `--progress = p*100` on the matching `<li>` and toggles `-is-active` while `0 < p < 1`. Several items can be active at once because the ranges overlap (e.g. universe scrollY 3600: About 94%, Vision 4.5%, both labels at opacity 1).

Measured (universe, desktop): About `--progress` 7.8 at y 900, 55.8 at 2400, 94.3 at 3600; Vision 4.5 at 3600 → 89.4 at 6000; Responsibility 0.28 at 6000 → 92.5 at 8400; Team 1.66 at 8400 → 96.4 at 14700.

Load-time artefact: sections that start outside the RAF window get `--progress: 100` (full ring) on first paint (universe items 2 and 3 at scrollY 0), and switch to 0 once they enter the window. Steady state after scrolling: passed sections 100 (full ring), upcoming 0 (empty ring), current partial. A rebuild should use the steady-state rule.

```js
/* site.pretty.js L8519-8534 */
class Rc extends j {
    constructor(t) {
        super(t), this.events = {}
    }
    onScrollProgress(t) {
        this.call("updateItemProgress", [t, this.el.getAttribute("id")], "PageSummary", "page-summary")
    }
}
class Fc extends j {
    constructor(t) {
        super(t), this.events = {}
    }
    updateItemProgress([t, e]) {
        this.$(e)[0] && (this.$(e)[0].style.setProperty("--progress", t * 100), t < 1 && t > 0 ? this.$(e)[0].classList.add("-is-active") : this.$(e)[0].classList.remove("-is-active"))
    }
}
```
```js
/* site.pretty.js L4307-4365 */
    _computeIntersection() {
        const t = this.scrollOrientation === "vertical" ? window.innerHeight : window.innerWidth,
            e = this.scrollOrientation === "vertical" ? this.metrics.bcr.height : this.metrics.bcr.width,
            i = this.attributes.scrollOffset.split(","),
            n = i[0] != null ? i[0].trim() : "0",
            s = i[1] != null ? i[1].trim() : "0",
            o = this.attributes.scrollPosition.split(",");
        let l = o[0] != null ? o[0].trim() : "start";
        const a = o[1] != null ? o[1].trim() : "end",
            d = n.includes("%") ? t * parseInt(n.replace("%", "").trim()) * .01 : parseInt(n),
            u = s.includes("%") ? t * parseInt(s.replace("%", "").trim()) * .01 : parseInt(s);
        switch (this.isInFold && (l = "fold"), l) {
            case "start":
            default:
                this.intersection.start = this.metrics.offsetStart - t + d;
                break;
            case "middle":
                this.intersection.start = this.metrics.offsetStart - t + d + .5 * e;
                break;
            case "end":
                this.intersection.start = this.metrics.offsetStart - t + d + e;
                break;
            case "fold":
                this.intersection.start = 0
        }
        switch (a) {
            case "start":
                this.intersection.end = this.metrics.offsetStart - u;
                break;
            case "middle":
                this.intersection.end = this.metrics.offsetStart - u + .5 * e;
                break;
            default:
                this.intersection.end = this.metrics.offsetStart - u + e
        }
        if (this.intersection.end <= this.intersection.start) switch (a) {
            case "start":
            default:
                this.intersection.end = this.intersection.start + 1;
                break;
            case "middle":
                this.intersection.end = this.intersection.start + .5 * e;
                break;
            case "end":
                this.intersection.end = this.intersection.start + e
        }
    }
    _computeProgress(t) {
        const e = t ?? ((i = Rr(this.intersection.start, this.intersection.end, 0, 1, this.currentScroll)) < 0 ? 0 : i > 1 ? 1 : i);
        var i;
        if (this.progress = e, e != this.lastProgress) {
            if (this.lastProgress = e, this.attributes.scrollCssProgress && this._setCssProgress(e), this.attributes.scrollEventProgress && this._setCustomEventProgress(e), this.attributes.scrollModuleProgress)
                for (const n of this.progressModularModules) this.modularInstance && this.modularInstance.call("onScrollProgress", e, n.moduleName, n.moduleId);
            e > 0 && e < 1 && this.setInview(), e === 0 && this.setOutOfView(), e === 1 && this.setOutOfView()
        }
    }
    _setCssProgress(t = 0) {
        this.$el.style.setProperty("--progress", t.toString())
    }
```

### 2.3 Click
`[data-scroll-to]` links are bound by Locomotive: `lenis.scrollTo('#id', { offset: data-scroll-to-offset, duration: 0.75 })` (Lenis default easing `t => min(1, 1.001 − 2^(−10t))`). Offsets — universe: −120, −60, −200, **+375**; expertise: −120, **+330**, −100. Measured: clicking "Corporate social responsibility" from y 3478 lands on 6396 (= 6596 − 200) and settles in ≈0.65s (y 4753 at 60ms, 5877 at 190ms, 6309 at 375ms, 6392 at 620ms).

```js
/* site.pretty.js L4673-4686 */
    }
    _onScrollTo(t) {
        var e;
        t.preventDefault();
        const i = (e = t.currentTarget) != null ? e : null;
        if (!i) return;
        const n = i.getAttribute("data-scroll-to-href") || i.getAttribute("href"),
            s = i.getAttribute("data-scroll-to-offset") || 0,
            o = i.getAttribute("data-scroll-to-duration") || this.lenisOptions.duration || Dr.duration;
        n && this.scrollTo(n, {
            offset: typeof s == "string" ? parseInt(s) : s,
            duration: typeof o == "string" ? parseInt(o) : o
        })
    }
```

### 2.4 Mobile
Not rendered (`display:none` ≤1024px). No replacement navigation.

Frames: `universe_02_about_top.png` (navy labels on white), `universe_08_vision_top.png` (white labels on navy), `universe_summary_click_landed.png`, `expertise_07_step1_mid.png`.

---

## 3. `/en/our-universe` (`main.t-universe`, Barba namespace `universe`)

Document height 16656 (desktop) / 16725 (390). Order: hero (1) → `.m-pageSummary__container` [About → Vision → Responsibility → Team] → `.o-breadcrumb.-revert` → `.o-prefooter` (homepage spec 11) → footer.

Common inner structure of every section: `.row` → `div.column-16.lg-column-13.lg-offset-3.no-width` (the "content column"): **x 279.7, w 1125.3** at 1425 (81.25% of the 1385 row box, offset 259.7); full 362 at 390 (row padding 1.4rem). All percentage widths below are of that 1125.3 column: 30.769% = 346.25, 38.46% = 432.8, 46.15% = 519.4, 53.85% = 605.9, 61.54% = 692.5, 69.23% = 779.1, 84.6% = 952.2, 92.3% = 1038.75.

Section eyebrow `h2.a-sectionTitle` (see 10.3): 14px/21, weight 400, gold, `margin-bottom 4rem` (3rem at 390).

### 3.1 `section.o-universeAbout` — y 1260, h 2816 (390: 1092, h 2571)
White section (`bg #fff`, navy text, `position:relative; z-index:1`), `padding-top 8rem` (3.2rem at 390). Toggles the dark UI: its `.o-universeAbout__wrapper` has `data-scroll data-scroll-repeat data-scroll-call="toggleDarkUi, Website, website" data-scroll-offset="33%,33%"` (body `-dark` measured on from scrollY ≈740 to ≈2480).

| element | desktop | 390 |
|---|---|---|
| wrapper | content column, `position:relative` | |
| first image `figure.o-universeAbout__firstImage` | **absolute**, `top 18.3rem; right 0`, w 30.769% → **x 1058.8, y 1523, 346×228** (img 2000/1320) | in flow, first child, w 75% (271.5×179), mb 4.8rem |
| eyebrow "About Aquatique Show" | y 1340 | |
| big quote `div.m-textScroll > .m-textScroll__content.tx-h4 > p.-tx600` | content w 61.54% = 692.5, **40px / 44 / −0.8px, weight 600**, 8 lines, 352 tall, colour scroll `#CBCBCB → #00284D` (see 10.4) | 30px / 32 / −0.6px, 362 wide |
| second image | `margin-top 12rem`, w 53.85% → **x 280, y 1873, 606×570** (2000/1881) | w 100% → 362×340 |
| third image | w 30.769%, `margin-top −9.2rem`, `margin-left 61.54%` → **x 972, y 2351, 346×241** (it starts 92px above the second image's bottom, to its right — staggered, not overlapping) | w 50%, `ml 50%`, `mt 4.8rem`, `mb 6.4rem` → 181×126 at x 195 |
| `p.tx-h3.o-universeAbout__quote` | w 61.54%, 60px / 61.8 / −2.4px, weight 300 | 36px / 38 / −0.72px |
| full-bleed footer `div.o-universeAbout__footer` | see below | |

All images are `figure.a-image > img.a-image__image.-radius[data-lazy]` → `border-radius: 1rem` (10px, `overflow:hidden`), lazy fade-in (10.6). No parallax, no transforms, no hover on any of them.

**Full-bleed video with cloud (`.o-universeAbout__footer`)** — y 2894, h 1182 (390: h 1016):
- `margin-top 11.6rem` (8rem), `padding 66.4rem 0 33.3rem` (`45.5rem 0 33.3rem`), `bg #0c0a09`, centred text, `position:relative`.
- `figure.a-video.o-universeAbout__footerImage.-cover` absolute full-size, z 0, `<video>` (no `autoplay` attribute; played/paused by `InlineVideo.togglePlay` when it enters/leaves the viewport), `object-fit: cover`.
- `::before` z 2: `linear-gradient(0deg, #0009 46.76%, #0000 88.81%)` (darkens the bottom half).
- `div.a-cloud.-top` z 2: the white-cloud PNG, rotated 180°, anchored to the **top** (so white from the About section melts down into the video; band ≈380px).
- `.row > .column-16.lg-column-12.lg-offset-2` (x 193.1, w 1038.75) → `h3.o-universeAbout__footerText.tx-h3.m-titleContent.-clrwhite` 60px / 61.8, weight 300, white, z 2, three lines separated by `<br>`, centred, `data-scroll data-scroll-speed="0.05"` → **parallax** (10.5): `translateY` from +45px (entering) to −45px (leaving) at 900 vh.
- The bottom edge meets the navy Vision section directly (no cloud there).

```css
/* site.pretty.css L7493-7584 */
.o-universeAbout {
  position:relative;
  z-index:1;
  padding-top:3.2rem;
  background-color:#fff;
  color:#00284d;
}
.o-universeAbout__wrapper {
  position:relative;
}
.o-universeAbout__firstImage {
  width:75%;
  margin-bottom:4.8rem;
}
@media only screen and (min-width: 1025px) {
  .o-universeAbout__firstImage {
    position:absolute;
    top:18.3rem;
    right:0;
    width:30.7692307692%;
  }
}
.o-universeAbout__secondImage {
  width:100%;
  margin-top:12rem;
}
@media only screen and (min-width: 1025px) {
  .o-universeAbout__secondImage {
    width:53.8461538462%;
  }
}
.o-universeAbout__thirdImage {
  width:50%;
  margin-top:4.8rem;
  margin-bottom:6.4rem;
  margin-left:50%;
}
@media only screen and (min-width: 1025px) {
  .o-universeAbout__thirdImage {
    width:30.7692307692%;
    margin-top:-9.2rem;
    margin-bottom:0;
    margin-left:61.5384615385%;
  }
}
@media only screen and (min-width: 1025px) {
  .o-universeAbout__quote {
    width:61.5384615385%;
  }
}
.o-universeAbout__footer {
  position:relative;
  margin-top:8rem;
  padding-top:45.5rem;
  padding-bottom:33.3rem;
  background-color:#0c0a09;
  text-align:center;
}
.o-universeAbout__footer:before {
  content:"";
  position:absolute;
  top:0;
  left:0;
  z-index:2;
  width:100%;
  height:100%;
  background:linear-gradient(0deg,#0009 46.76%,#0000 88.81%);
}
@media only screen and (min-width: 1025px) {
  .o-universeAbout__footer {
    margin-top:11.6rem;
    padding-top:66.4rem;
  }
}
.o-universeAbout__footerImage {
  position:absolute;
  bottom:0;
  left:0;
  z-index:0;
  width:100%;
  height:100%;
  pointer-events:none;
}
.o-universeAbout__footerText {
  position:relative;
  z-index:2;
}
@media only screen and (min-width: 1025px) {
  .o-universeAbout {
    padding-top:8rem;
  }
}
```

### 3.2 `section.o-universeVision` — y 4076, h 2520 (390: 3663, h 2021)
No background (navy page shows through), white text, `position:relative`, `padding 14rem 0 37rem` (`6rem 0 25rem`).

| element | desktop | 390 |
|---|---|---|
| eyebrow "Our vision & values" | y 4216 | |
| `h3.tx-h5.o-universeVision__subtitle` | w 38.46% (432.8), **34px / 36.0**, weight 400, `<strong>` 600, mb 8rem | w 75%, 22px / 26.4, mb 4rem |
| `div.b-twoColumns.tx-uni14` (two paragraphs) | grid `repeat(2,1fr)`, gap 9.09% → cols **432.8 / 432.8**, w 84.6% (952.2), **14px / 21**, mb 11.5rem | one column, mb 8rem |
| `figure.o-universeVision__visual` | w 92.3% → **1038.75 × 612.7** (img 1068×630), radius 10, mb 16rem | 362×214, mb 8rem |
| `.o-universeVision__textImage > .b-twoColumns` | grid **41.667% 50%**, gap 8.333% → cols **432.8 / 519.4**, w 92.3%, mb 11.5rem | one column, gap 6.4rem, mb 8rem |
| – left | `h3.tx-h5` ("The water show,<br><strong>a universal scope</strong>") + `m-textContent` whose `p` is 14/21 with **margin-top 5.6rem** | p mt 2.4rem |
| – right | `figure.a-image` 519×558 (1860/2000), radius 10 | 362×389 |
| "Contact an expert" bar `div.o-universeVision__contact.-radius` | flex row, space-between, centred; w 92.3% (1038.75), `padding 3.2rem 4.8rem`, **bg #fff**, navy text, `border 1px rgba(0,13,26,.1)`, radius 10 → **109.8 tall** at y 6116 | column, gap 2.8rem, `padding 3.2rem`, 164 tall |
| – title | `h3.tx-h5` "Contact an expert" 34px weight 400 | 22px |
| – button | `a.a-button.-primary.-bggold.-clrwhite.-txupp.o-universeVision__contactButton` → gold pill, `padding 1.35rem 6rem`, radius 4.4rem, 14px 600 uppercase "CONTACT US", **204.6 × 43.8**, no arrow | full width (296) |
| bottom cloud `div.a-cloud` (not `-top`) | z 2, full section, PNG anchored to the section bottom → a 380px band (y ≈6216–6596) that fades the navy into the white Responsibility section; it covers the 370px bottom padding | same |

The "rotated / overlapping photo stack" in this section is **one flat composite image** (`vision-valeurs-compo`, 1068×630, rotated photos baked in on a transparent background) — nothing is rotated or animated in CSS.

Button hover (fine pointer, homepage spec 0.6): the `-primary` `::before` white-to-transparent gradient slides from `translateY(-100%)` to 0 (1s ease-quint) and the label gains `padding: 0 .8rem` (1s ease-quint) → button grows 204.6 → 220.6 wide. Measured at 250ms: `::before` −9.4px, label padding 6.3px. Frame `universe_contact_button_hover.png`.

```css
/* site.pretty.css L7881-7962 */
.o-universeVision {
  position:relative;
  padding-top:6rem;
  padding-bottom:25rem;
}
.o-universeVision__subtitle {
  width:75%;
  margin-bottom:4rem;
}
@media only screen and (min-width: 1025px) {
  .o-universeVision__subtitle {
    width:38.4615384615%;
    margin-bottom:8rem;
  }
}
.o-universeVision .b-twoColumns {
  margin-bottom:8rem;
}
@media only screen and (min-width: 1025px) {
  .o-universeVision .b-twoColumns {
    gap:9.0909090909%;
    width:84.6153846154%;
    margin-bottom:11.5rem;
  }
}
.o-universeVision__visual {
  width:100%;
  margin-bottom:8rem;
}
@media only screen and (min-width: 1025px) {
  .o-universeVision__visual {
    width:92.3076923077%;
    margin-bottom:16rem;
  }
}
.o-universeVision__textImage p {
  margin-top:2.4rem;
}
@media only screen and (min-width: 1025px) {
  .o-universeVision__textImage p {
    margin-top:5.6rem;
  }
}
.o-universeVision__textImage .b-twoColumns {
  gap:6.4rem;
}
@media only screen and (min-width: 1025px) {
  .o-universeVision__textImage .b-twoColumns {
    grid-template-columns:41.6666666667% 50%;
    gap:8.3333333333%;
    width:92.3076923077%;
  }
}
.o-universeVision__contact {
  display:flex;
  flex-direction:column;
  gap:2.8rem;
  width:100%;
  padding:3.2rem;
  border:solid .1rem rgba(0,13,26,.1);
  background-color:#fff;
  color:#00284d;
}
@media only screen and (min-width: 1025px) {
  .o-universeVision__contact {
    flex-direction:row;
    align-items:center;
    justify-content:space-between;
    width:92.3076923077%;
    padding:3.2rem 4.8rem;
  }
}
.o-universeVision__contactButton {
  padding-right:6rem;
  padding-left:6rem;
}
@media only screen and (min-width: 1025px) {
  .o-universeVision {
    padding-top:14rem;
    padding-bottom:37rem;
  }
}
```
```css
/* site.pretty.css L4842-4882 */
.b-twoColumns {
  display:grid;
}
.b-twoColumns__title {
  margin-bottom:4rem;
}
@media only screen and (min-width: 1025px) {
  .b-twoColumns__title {
    margin-bottom:9.6rem;
  }
}
.b-twoColumns__left,.b-twoColumns__right {
  display:grid;
  gap:2.25rem;
}
@media only screen and (min-width: 1025px) {
  .b-twoColumns.-revert .b-twoColumns__left {
    order:1;
  }
}
.b-twoColumns.-gap {
  gap:4.4rem;
}
@media only screen and (min-width: 1025px) {
  .b-twoColumns.-gap {
    gap:7.1428571429%;
  }
}
.b-twoColumns.-gapBlog {
  gap:4.4rem;
}
@media only screen and (min-width: 1025px) {
  .b-twoColumns.-gapBlog {
    gap:2rem;
  }
}
@media only screen and (min-width: 1025px) {
  .b-twoColumns {
    grid-template-columns:repeat(2,1fr);
  }
}
```

### 3.3 `section.o-universeResponsability` — y 6596, h 2296 (390: 5684, h 1857)
White (`bg #fff`, navy), `padding 5rem 0 10rem` (`1rem 0 1rem`). Toggles dark UI (`data-scroll-call="toggleDarkUi…"` on the section; body `-dark` from scrollY ≈5993 to ≈8595 = top − 603 … top − 297 + height).

| element | desktop | 390 |
|---|---|---|
| eyebrow "Corporate social responsibility" | | |
| `p.tx-h2.o-universeResponsability__subtitle` | w 61.54% (692.5), **80px / 80 / −4.8px**, weight 300, strong 600, 3 lines (240), mb 4.8rem | w 61.54% (222.8!), 40px / 40, 5 lines |
| `div.o-universeResponsability__introduction.m-textContent` | w 38.46% (432.8), **margin-left 46.15%** → x 799, mb 12rem, p 14/21 | full width, mb 4.8rem |
| `figure.o-universeResponsability__visual` | w 84.6% → 952 × 496.5 (957×499), radius 10, mb 6.8rem | 362×189, mb 5.4rem |
| three `div.o-universeResponsability__section` | grid **41.667% 41.667%**, gap 8.333% → cols 432.8 / 432.8 (right col x 799), w 92.3% | one column, gap 2rem |
| – divider | every section except the last: `padding-bottom 8.8rem; margin-bottom 8.8rem; border-bottom 1px #CBCBCB` | 4.8rem / 4.8rem |
| – left | `h3.tx-h3` 60px / 61.8, weight 300 ("Water is precious – water is our lifeblood", "Responsible collabs", "Our Foundation") | 36px |
| – right | `m-textContent` (grid gap 4.5rem between paragraphs; 2.25rem at 390), text 14/21. First section is a `ul`: `padding 0` (3rem at 390), bullets = `li::before` 8px navy circle `scale(.6)` (→4.8px) at `top .6rem`, `right: calc(100% + 1.2rem)` → the bullet hangs 12px outside the text column (x ≈779) | |

```css
/* site.pretty.css L7585-7659 */
.o-universeResponsability {
  padding-top:1rem;
  padding-bottom:1rem;
  background-color:#fff;
  color:#00284d;
}
.o-universeResponsability__subtitle {
  margin-bottom:4.8rem;
}
@media only screen and (min-width: 0) {
  .o-universeResponsability__subtitle {
    width:61.5384615385%;
  }
}
.o-universeResponsability__introduction {
  margin-bottom:4.8rem;
}
@media only screen and (min-width: 1025px) {
  .o-universeResponsability__introduction {
    width:38.4615384615%;
    margin-bottom:12rem;
    margin-left:46.1538461538%;
  }
}
.o-universeResponsability__visual {
  width:100%;
  margin-bottom:5.4rem;
}
@media only screen and (min-width: 1025px) {
  .o-universeResponsability__visual {
    width:84.6153846154%;
    margin-bottom:6.8rem;
  }
}
.o-universeResponsability__section {
  display:grid;
  gap:2rem;
}
.o-universeResponsability__section:not(:last-child) {
  margin-bottom:4.8rem;
  padding-bottom:4.8rem;
  border-bottom:solid .1rem #CBCBCB;
}
@media only screen and (min-width: 1025px) {
  .o-universeResponsability__section:not(:last-child) {
    margin-bottom:8.8rem;
    padding-bottom:8.8rem;
  }
}
@media only screen and (min-width: 1025px) {
  .o-universeResponsability__section ul {
    padding:0;
  }
}
.o-universeResponsability__section li:before {
  top:.6rem!important;
  transform:scale(.6)!important;
}
@media only screen and (min-width: 1025px) {
  .o-universeResponsability__section {
    grid-template-columns:41.6666666667% 41.6666666667%;
    gap:8.3333333333%;
    width:92.3076923077%;
    padding-bottom:14.8rem;
  }
  .o-universeResponsability__section:last-child {
    padding-bottom:0;
  }
}
@media only screen and (min-width: 1025px) {
  .o-universeResponsability {
    padding-top:5rem;
    padding-bottom:10rem;
  }
}
```
```css
/* site.pretty.css L4395-4479 */
.m-textContent {
  display:grid;
  gap:2.25rem;
  height:-moz-fit-content;
  height:fit-content;
}
.m-textContent strong,.m-textContent b {
  font-weight:600;
}
.m-textContent strong>span,.m-textContent b>span {
  font-weight:600;
}
.m-textContent p a {
  font-weight:600;
  text-decoration:underline;
  transition:color .25s ease-in-out;
}
@media (hover: hover) and (any-pointer: fine) {
  .m-textContent p a:hover {
    color:#221c35;
  }
}
.m-textContent s {
  display:inline-block;
  line-height:1.28;
  text-decoration:none;
}
.m-textContent ul,.m-textContent ol {
  display:grid;
  padding-left:3rem;
}
.m-textContent ul {
  font-size:1.4rem;
}
.m-textContent ul li {
  position:relative;
}
.m-textContent ul li:before {
  content:"";
  position:absolute;
  top:.9rem;
  right:calc(100% + 1.2rem);
  display:block;
  width:.8rem;
  height:.8rem;
  border-radius:50%;
  background-color:currentcolor;
}
.m-textContent ol {
  counter-reset:listCounter;
}
.m-textContent ol li {
  position:relative;
  counter-increment:listCounter;
}
.m-textContent ol li:before {
  content:counter(listCounter) ".";
  position:absolute;
  top:0;
  right:calc(100% + 1rem);
}
.m-textContent p+input {
  margin-top:1rem;
}
.m-textContent label {
  font-weight:600;
  font-size:1.4rem;
}
.m-textContent h1:has(span),.m-textContent h2:has(span),.m-textContent h3:has(span),.m-textContent h4:has(span),.m-textContent h5:has(span),.m-textContent h6:has(span) {
  font-size:initial;
  line-height:initial;
}
@media only screen and (min-width: 1025px) {
  .m-textContent {
    gap:4.5rem;
  }
}
@media only screen and (min-width: 1025px) {
  .m-textScroll__content {
    width:61.5384615385%;
  }
}
.m-titleContent strong,.m-titleContent b {
  font-weight:600;
}
```

### 3.4 `section.o-universeTeam` — y 8892, h 6347 (390: 7542, h 6939)
`position:relative; overflow:hidden`, no background (navy), white text.

**Top photo + cloud**: `figure.a-image.o-universeTeam__topImage` is a ratio box (`padding-bottom 83%` → **1425 × 1182.75**; 123% → 390×480 at 390) with the `img.-cover` absolute, `object-fit:cover`, `margin-bottom 14rem` (6rem). `div.a-cloud.-top` (z 2, rotated 180°) sits at the top of the section so the white Responsibility section dissolves into the photo; the photo's bottom edge is a hard cut into navy.

Then the content column:

| element | desktop | 390 |
|---|---|---|
| eyebrow "The team & our representatives" | y 10215 | |
| `div.o-universeTeam__subtitle` | grid gap 2.4rem, w 38.46%: `div.tx-h3` "The **Aquatique Show** team" (60px, 2 lines) + `div.tx-uni14 > p` (14/21) | full width, 36px |
| `div.o-universeTeam__gallery` | single-column grid, gap 0, mb 12.4rem | gap 3.2rem, mt 3.2rem, mb 6.4rem |
| – first image | w 46.15%, **mt −16.5rem**, ml 46.15% → **x 799, y 10280, 519×292** (rises beside the subtitle) | 100% (362×204) |
| – second image | w 38.46%, **mt −9.6rem** → x 280, y 10476, 433×288 | 100% (362×241) |
| – text `div.o-universeTeam__galleryText.tx-uni14` | w 38.46%, **mt −1.6rem**, ml 46.15%, mb 8.8rem → x 799, y 10748 | mb 3.2rem |
| – third image | w 38.46%, ml 46.15% → x 799, y 10878, 433×288 | w 75%, ml 25% (272×181) |
| divider + founder `div.o-universeTeam__founder` | `border-top 1px #194c7b`, `padding-top 10.5rem`, w 92.3%, mb 23rem, base 14/21 | pt 5.6rem, mb 4.2rem |
| – `div.o-universeTeam__founderTitle.tx-h5.m-titleContent` | w 41.667%, 34px (strong 600), 3 lines, mb 6.4rem | 22px, mb 4.5rem |
| – `div.b-twoColumns.o-universeTeam__founderGrid` | grid **45.45% 45.45%**, gap 9.09%, w 91.667% → cols 432.8 / 432.8 | one column, gap 6rem |
| – portrait | `img.-radius.-shadow` 433×577 (1500/2000), radius 10, **`box-shadow: 0 24px 34px #071e32`** | 362×483 |
| – text | `m-textContent` (gap 4.5rem), p **16/24**, first p all `<strong>` (600) | gap 2.25rem |
| quote `div.m-textScroll` | content w 69.23% (779), 40px/44 weight 600, 9 lines; colour scroll **`#194C7B → #FFF`**; mb 20.8rem | 30px, mb 14.2rem |
| `div.o-universeTeam__members` | w 92.3%, mb 13rem | mb 4.8rem |
| china block | see 3.5 | |

**Department tabs** (`.o-universeTeam__membersHeader`, desktop only; `display:none` <1025):
- flex row, space-between, centred, mb 3.6rem. Left `p.tx-p` "Department" 16/24, mr 2rem.
- `ul.o-universeTeam__membersFilter`: flex, gap 1.6rem, `padding .8rem`, radius 4rem, **bg rgba(255,255,255,.04)** → 931 × 80.
- `button.tx-plarge` (18px, `line-height: initial` → normal; the long labels wrap to 2 lines → 64px tall; widths 350.6 / 335.7 / auto): `padding 1.3rem 2.6rem`, radius 3.2rem, `outline: .1px solid transparent`; transitions `background-color, color, outline .4s ease-quint`.
  - hover: bg `rgba(255,255,255,.1)`; non-active hover also `outline: .1px solid white` (renders as 1px).
  - active (`-active`): **bg #fff, colour navy**.
- Click (TeamFilter module): moves `-active` to the button and `-visible` to the matching `div.o-universeTeam__membersSlider[data-team-filter=teamN]`; non-visible sliders are `display:none` at ≥1025 → **instant swap, no animation** (only the tab colours cross-fade .4s). Frames `universe_team_tab_hover.png`, `universe_team_tab2.png`.

```js
/* site.pretty.js L8113-8130 */
class Tc extends j {
    constructor(t) {
        super(t), this.events = {
            click: {
                button: "onClick"
            }
        }, this.currentActive = 1
    }
    onClick(t) {
        this.$("button")[this.currentActive - 1].classList.remove("-active"), this.$(`team${this.currentActive}`)[0].classList.remove("-visible");
        const {
            target: e
        } = t;
        e.classList.add("-active");
        const i = parseInt(e.dataset.index, 10);
        this.$(`team${i}`)[0].classList.add("-visible"), this.currentActive = i
    }
}
```

**Team cards** (`section.m-sliderTeam.-keepOverflow`, Slider module with `data-config='{"dots":true}'`):
- Desktop: `.m-slider__container` is a **4-column grid, gap 2rem** (the Embla engine runs but has a single snap → `-fixed`, inactive). Card column 244.7.
- `.m-sliderTeam__slideInner.-radius`: `padding 2rem`, `border 1px solid rgba(203,203,203,.2)`, `bg rgba(203,203,203,.04)`, radius 10, height 100% of the grid row (row 1 = 360.5 because "Charlotte FORMHALS" wraps; row 2 = 334).
- `figure.m-sliderTeam__slidePicture.-radius`: `aspect-ratio 1/1` (202.7), radius 10, mb 3.2rem, img `.-cover`.
- `p.m-sliderTeam__slideName` 22px / 26.4, weight 600, mb 1rem; `p.tx-uni14` role 14/21.
- No hover effect (measured: background, border, transforms unchanged).
- 390: every department slider is shown, stacked (`.o-universeTeam__membersSlidersWrapper` flex column gap 6.4rem), each preceded by `p.o-universeTeam__membersSliderDepartment` (`<br>` + `span.tx-pxlarge.-tx600` 20px/26, mb 2.4rem). The slider is a real Embla carousel: 1 slide per view (`--item-size 1`, 3 at ≥641), `--item-spacing 2rem` (container `margin-left −2rem`, slides `padding-left 2rem`), card 362 wide / 451 tall (picture 320×320); white dots below (`.m-slider__dots` mt 3rem, dot .5rem, active 1.4rem wide, see homepage spec 9).

```css
/* site.pretty.css L4256-4309 */
.m-sliderTeam {
  --item-size: 1;
  --item-spacing: 2rem;
}
@media only screen and (min-width: 1025px) {
  .m-sliderTeam .m-slider__container {
    display:grid;
    grid-template-columns:repeat(4,1fr);
    gap:2rem;
    margin-left:0;
  }
}
.m-sliderTeam__slide {
  flex:0 0 calc(100% / var(--item-size));
  padding-left:var(--item-spacing);
}
@media only screen and (min-width: 1025px) {
  .m-sliderTeam__slide {
    padding-left:0;
  }
}
.m-sliderTeam__slideInner {
  height:100%;
  padding:2rem;
  border:solid 1px rgba(203,203,203,.2);
  background-color:#cbcbcb0a;
}
.m-sliderTeam__slidePicture {
  position:relative;
  margin-bottom:3.2rem;
  aspect-ratio:1/1;
}
.m-sliderTeam__slideName {
  margin-bottom:1rem;
  font-weight:600;
  font-size:2.2rem;
  line-height:1.2;
}
.m-sliderTeam__slideDescription {
  margin-top:1.6rem;
}
@media only screen and (min-width: 1025px) {
  .m-sliderTeam .m-slider__dots {
    display:none;
  }
}
.m-sliderTeam .m-slider__dot {
  background-color:#fff;
}
@media only screen and (min-width: 641px) {
  .m-sliderTeam {
    --item-size: 3;
  }
}
```
```css
/* site.pretty.css L7660-7880 */
.o-universeTeam {
  position:relative;
  overflow:hidden;
}
.o-universeTeam__topImage {
  position:relative;
  margin-bottom:6rem;
  padding-bottom:123%;
}
@media only screen and (min-width: 1025px) {
  .o-universeTeam__topImage {
    margin-bottom:14rem;
    padding-bottom:83%;
  }
}
.o-universeTeam__subtitle {
  display:grid;
  gap:2.4rem;
}
@media only screen and (min-width: 1025px) {
  .o-universeTeam__subtitle {
    width:38.4615384615%;
  }
}
.o-universeTeam__gallery {
  display:grid;
  gap:3.2rem;
  width:100%;
  margin-top:3.2rem;
  margin-bottom:6.4rem;
}
@media only screen and (min-width: 1025px) {
  .o-universeTeam__gallery {
    gap:0;
    margin-top:0;
    margin-bottom:12.4rem;
  }
}
@media only screen and (min-width: 1025px) {
  .o-universeTeam__galleryFirstImage {
    width:46.1538461538%;
    margin-top:-16.5rem;
    margin-left:46.1538461538%;
  }
}
@media only screen and (min-width: 1025px) {
  .o-universeTeam__gallerySecondImage {
    width:38.4615384615%;
    margin-top:-9.6rem;
  }
}
.o-universeTeam__galleryThirdImage {
  width:75%;
  margin-left:25%;
}
@media only screen and (min-width: 1025px) {
  .o-universeTeam__galleryThirdImage {
    width:38.4615384615%;
    margin-left:46.1538461538%;
  }
}
.o-universeTeam__galleryText {
  margin-bottom:3.2rem;
}
@media only screen and (min-width: 1025px) {
  .o-universeTeam__galleryText {
    width:38.4615384615%;
    margin-top:-1.6rem;
    margin-bottom:8.8rem;
    margin-left:46.1538461538%;
  }
}
.o-universeTeam__founder {
  margin-bottom:4.2rem;
  padding-top:5.6rem;
  border-top:solid .1rem #194c7b;
}
.o-universeTeam__founder .b-twoColumns {
  gap:6rem;
}
@media only screen and (min-width: 1025px) {
  .o-universeTeam__founder .b-twoColumns {
    grid-template-columns:45.4545454545% 45.4545454545%;
    gap:9.0909090909%;
    width:91.6666666667%;
  }
}
@media only screen and (min-width: 1025px) {
  .o-universeTeam__founder {
    width:92.3076923077%;
    margin-bottom:23rem;
    padding-top:10.5rem;
  }
}
.o-universeTeam__founderTitle {
  margin-bottom:4.5rem;
}
@media only screen and (min-width: 1025px) {
  .o-universeTeam__founderTitle {
    width:41.6666666667%;
    margin-bottom:6.4rem;
  }
}
.o-universeTeam .m-textScroll {
  margin-bottom:14.2rem;
}
@media only screen and (min-width: 1025px) {
  .o-universeTeam .m-textScroll__content {
    width:69.2307692308%;
  }
}
@media only screen and (min-width: 1025px) {
  .o-universeTeam .m-textScroll {
    margin-bottom:20.8rem;
  }
}
.o-universeTeam__members {
  width:100%;
  margin-bottom:4.8rem;
}
@media only screen and (min-width: 1025px) {
  .o-universeTeam__members {
    width:92.3076923077%;
    margin-bottom:13rem;
  }
}
.o-universeTeam__membersHeader {
  display:none;
}
@media only screen and (min-width: 1025px) {
  .o-universeTeam__membersHeader {
    display:flex;
    flex-direction:row;
    align-items:center;
    justify-content:space-between;
    margin-bottom:3.6rem;
  }
  .o-universeTeam__membersHeader>.tx-p /* +9 alias selectors trimmed */ {
    margin-right:2rem;
  }
}
.o-universeTeam__membersFilter {
  display:flex;
  flex-direction:row;
  gap:1.6rem;
  align-items:center;
  padding:.8rem;
  border-radius:4rem;
  background-color:#ffffff0a;
}
.o-universeTeam__membersFilter button {
  padding:1.3rem 2.6rem;
  border-radius:3.2rem;
  outline:solid .1px rgba(255,255,255,0);
  line-height:initial;
  transition:background-color .4s cubic-bezier(.23,1,.32,1),color .4s cubic-bezier(.23,1,.32,1),outline .4s cubic-bezier(.23,1,.32,1);
}
.o-universeTeam__membersFilter button:hover {
  background-color:#ffffff1a;
}
.o-universeTeam__membersFilter button:hover:not(.-active) {
  outline:solid .1px white;
}
.o-universeTeam__membersFilter button.-active {
  background-color:#fff;
  color:#00284d;
}
.o-universeTeam__membersSlidersWrapper {
  display:flex;
  flex-direction:column;
  gap:6.4rem;
  width:100%;
}
@media only screen and (min-width: 1025px) {
  .o-universeTeam__membersSlider:not(.-visible) {
    display:none;
  }
}
.o-universeTeam__membersSliderDepartment {
  margin-bottom:2.4rem;
}
@media only screen and (min-width: 1025px) {
  .o-universeTeam__membersSliderDepartment {
    display:none;
  }
}
.o-universeTeam__china {
  display:grid;
  gap:4.8rem;
  margin-bottom:9.6rem;
  padding-top:6.4rem;
  border-top:solid .1rem #194c7b;
}
.o-universeTeam__china .b-twoColumns {
  gap:4.8rem;
}
@media only screen and (min-width: 1025px) {
  .o-universeTeam__china .b-twoColumns {
    grid-template-columns:54.5454545455% 36.3636363636%;
    gap:9.0909090909%;
    width:91.6666666667%;
  }
}
@media only screen and (min-width: 1025px) {
  .o-universeTeam__china {
    width:92.3076923077%;
    margin-bottom:27rem;
    padding-top:7.8rem;
  }
}
@media only screen and (min-width: 1025px) {
  .o-universeTeam__chinaContact {
    height:auto;
    margin:auto 0;
  }
}
@media only screen and (min-width: 1025px) {
  .o-universeTeam {
    gap:13rem;
  }
}
```

### 3.5 China block (`div.o-universeTeam__china`) — y 14307, h 662
- `border-top 1px #194c7b`, `padding-top 7.8rem` (6.4rem), grid gap 4.8rem, w 92.3%, mb 27rem (9.6rem).
- Row 1 `b-twoColumns` (**54.545% 36.364%**, gap 9.09%, w 91.667% → 519.4 / 346.25): `div.m-titleContent.tx-h3` "Aquatique Show<br><strong>in China</strong>" (60px, 3 lines incl. the wrapped first line = 189 tall) | `m-textContent` two p 16/24.
- Row 2 same grid: `figure.a-image` 519×346 radius 10 | `div.o-universeTeam__chinaContact.m-textContent` (`margin: auto 0` → vertically centred beside the photo): address p, then two `div.tx-p` with phone/fax `tel:` links and mail/web links (plain links, inherit colour, no underline — the `.m-textContent p a` underline rule does not reach links inside `div`).
- 390: one column, gap 4.8rem.

### 3.6 After the sections
`div.o-breadcrumb.-revert` (navy variant, 10.1) at y 15239, then `section.o-prefooter` (gold) at 15317, footer at 15646.

Frames (desktop): `universe_00_hero.png`, `universe_01_hero_bottom.png`, `universe_02_about_top.png`, `universe_03_about_textscroll.png`, `universe_04_about_images.png`, `universe_05_about_quote.png`, `universe_06_about_footer_video.png`, `universe_07_about_footer_text.png`, `universe_08_vision_top.png`, `universe_09_vision_visual.png`, `universe_10_vision_textimage.png`, `universe_11_vision_contact_cloud.png`, `universe_12_resp_top.png`, `universe_13_resp_visual.png`, `universe_14_resp_sections.png`, `universe_15_resp_last.png`, `universe_16_team_topimage.png`, `universe_17_team_cloud.png`, `universe_18_team_gallery.png`, `universe_19_team_founder.png`, `universe_20_team_textscroll.png`, `universe_21_team_members.png`, `universe_22_team_china.png`, `universe_23_breadcrumb_prefooter.png`, `universe_contact_button_hover.png`, `universe_summary_click_landed.png`, `universe_team_tab2.png`, `universe_team_tab_hover.png`, `universe_textscroll_midway.png` — (390): `m390_universe_00_hero.png`, `m390_universe_01_hero_bottom.png`, `m390_universe_02_about_top.png`, `m390_universe_03_about_textscroll.png`, `m390_universe_04_about_images.png`, `m390_universe_05_about_quote.png`, `m390_universe_06_about_footer_video.png`, `m390_universe_07_about_footer_text.png`, `m390_universe_08_vision_top.png`, `m390_universe_09_vision_visual.png`, `m390_universe_10_vision_textimage.png`, `m390_universe_11_vision_contact_cloud.png`, `m390_universe_12_resp_top.png`, `m390_universe_13_resp_visual.png`, `m390_universe_14_resp_sections.png`, `m390_universe_15_resp_last.png`, `m390_universe_16_team_topimage.png`, `m390_universe_17_team_cloud.png`, `m390_universe_18_team_gallery.png`, `m390_universe_19_team_founder.png`, `m390_universe_20_team_textscroll.png`, `m390_universe_21_team_members.png`, `m390_universe_22_team_china.png`, `m390_universe_23_breadcrumb_prefooter.png`

---

## 4. `/en/our-expertise` (`main.t-expertise`, namespace `expertise`)

Document height 11371 (desktop) / 10515 (390). Order: hero (`-cloud`, tag "OUR EXPERTISE", 2-line title) → `.m-pageSummary__container` [Approach → Process → Clients & awards] → white breadcrumb → footer (**no prefooter**).

### 4.1 `section.o-expertiseApproach` — y 1260, h 1306 (390: 1091, h 1334)
White/navy, `padding 8rem 0 5rem` (`3.6rem 0 6.1rem`), section-steps + `toggleDarkUi`. Content column as in 3.

| element | desktop | 390 |
|---|---|---|
| eyebrow "Our approach" | | |
| `p.tx-h5.o-expertiseApproach__paragraph` (all `<strong>`, 600) | w 69.23% (779), 34px/36, 1 line, **mb 12.6rem** | 22px, mb 5rem |
| `div.o-expertiseApproach__images` | grid **45.45% 27.27%**, **gap 27.27%**, w 84.6% (952.2) | grid gap 6.4rem |
| – image 1 | 433×288 (2000/1333), radius 10 | `margin-right 25%` → 271.5×181 |
| – image 2 | 260×351 (957/1295), **mt 17rem**, mb 3.6rem → x 972, y 1733 | `margin-left 25%`, mb 5.5rem → 271.5×367 |
| big quote `m-textScroll` | content w 61.54% (692.5), 40/44 600, 9 lines (396), `#CBCBCB → #00284D` | 30px |

```css
/* site.pretty.css L5514-5561 */
.o-expertiseApproach {
  padding-top:3.6rem;
  padding-bottom:6.1rem;
  background-color:#fff;
  color:#00284d;
}
.o-expertiseApproach__paragraph {
  margin-bottom:5rem;
}
@media only screen and (min-width: 1025px) {
  .o-expertiseApproach__paragraph {
    width:69.2307692308%;
    margin-bottom:12.6rem;
  }
}
.o-expertiseApproach__images {
  display:grid;
  gap:6.4rem;
}
@media only screen and (min-width: 1025px) {
  .o-expertiseApproach__images {
    grid-template-columns:45.4545454545% 27.2727272727%;
    gap:27.2727272727%;
    width:84.6153846154%;
  }
}
@media only screen and (max-width: 1024px) {
  .o-expertiseApproach__image:nth-child(1) {
    margin-right:25%;
  }
}
.o-expertiseApproach__image:nth-child(2) {
  margin-bottom:5.5rem;
  margin-left:25%;
}
@media only screen and (min-width: 1025px) {
  .o-expertiseApproach__image:nth-child(2) {
    margin-top:17rem;
    margin-bottom:3.6rem;
    margin-left:0;
  }
}
@media only screen and (min-width: 1025px) {
  .o-expertiseApproach {
    padding-top:8rem;
    padding-bottom:5rem;
  }
}
```

### 4.2 `section.o-expertiseProcess` — y 2566, h 5554 (390: 2426, h 5820)
`position:relative`, navy (no bg), **`padding-top 52.8rem`** (31rem) — the empty top area is where the top cloud shows.
- `div.a-cloud.-top` (z 2, rotated): white → navy dissolve at the top (band ≈380px, visible from y 2566). Frame `expertise_04_process_cloud_top.png`.
- `div.a-cloud.-bottom` (plain `.a-cloud`, z 2): navy/photo → white at the bottom (band at y ≈7740–8121). At ≤1024: `background-size: 150% min(10rem, 20%)`.
- Content column: eyebrow "Our process"; `p.tx-h3.o-expertiseProcess__title` w 84.6%, 60px/61.8 weight 300 with a long `<strong>` (5 lines, 309 tall), **mb 23.2rem** (36px, mb 14.4rem).
- `div.m-expertiseStep__container`: grid, **gap 5.6rem** (2rem).
- After the row, directly in the section: **full-bleed `figure.a-image`** (img 2000×1333, lazy, no radius) → **1425 × 950 at y 7171** (390×260). The bottom cloud overlays its lower part.

```css
/* site.pretty.css L5575-5597 */
.o-expertiseProcess {
  position:relative;
  padding-top:31rem;
}
.o-expertiseProcess__title {
  margin-bottom:14.4rem;
}
@media only screen and (min-width: 1025px) {
  .o-expertiseProcess__title {
    width:84.6153846154%;
    margin-bottom:23.2rem;
  }
}
@media only screen and (max-width: 1024px) {
  .o-expertiseProcess .a-cloud.-bottom {
    background-size:150% min(10rem,20%);
  }
}
@media only screen and (min-width: 1025px) {
  .o-expertiseProcess {
    padding-top:52.8rem;
  }
}
```

**Steps (`div.m-expertiseStep` × 5)** — desktop tops 3696 / 4292 / 4960 / 5676 / 6383, heights 400 / 472 / 520 / 510 / 648:

```html
<div class="m-expertiseStep">
  <div class="m-expertiseStep__stepper" data-scroll data-scroll-css-progress data-scroll-offset="50%,50%" data-scroll-position="start,center">
    <p class="a-tag - -step"><span class="a-tag__content"> 01 / 05 </span></p>
    <svg class="m-expertiseStep__stepperSvg" viewBox="0 0 2 240" preserveAspectRatio="xMidYMid slice">
      <line x1="1" y1="0" x2="1" y2="240" stroke="currentColor" stroke-width="2" class="m-expertiseStep__drawingLine"/>
      <line x1="1" y1="0" x2="1" y2="240" stroke="currentColor" stroke-width="2" class="m-expertiseStep__maskLine"/>
      <line x1="1" y1="0" x2="1" y2="240" stroke="currentColor" stroke-width="2" class="m-expertiseStep__placeholderLine"/>
    </svg>
  </div>
  <div class="m-expertiseStep__content">
    <div class="m-expertiseStep__textContent"><h3 class="tx-h5 -tx600">First birth of the water show</h3><div class="m-textContent"><p>…</p><p>…</p></div></div>
    <div class="m-expertiseStep__imagesContent -img1"><figure class="a-image -radius js-image"><img …></figure> ×2 or ×3</div>
  </div>
</div>
```

| part | desktop | 390 |
|---|---|---|
| step | grid **8.333% 83.333%**, gap 8.333%, w 92.3% (1038.75) → stepper col **86.6**, content col **865.6** at x 452.8; **mb 14rem** | grid **25% 75%** (90.5 / 271.5), no gap, mb 2.4rem |
| stepper | flex column, centred | |
| tag "01 / 05" | `a-tag -step`: `padding .5rem 1rem`, radius 2.4rem, bg `rgba(255,255,255,.1)`, white 10px 600 uppercase → 51.4×21; **`position: sticky; top: 50%`** (450px) z 1 → it rides down the stepper column while the step is on screen | same, sticky top 422 |
| tag `::before` | navy rect, `transform: scaleY(3.75)` (78.75px tall), z −2 — hides the dashed line behind/around the tag | `scaleY(3)` |
| tag `::after` | `rgba(255,255,255,.1)`, radius 3.2rem, z −1 | |
| svg | 2px wide, fills the column (347 tall for a 400 step), `margin-top 3.2rem` | mt 1.8rem |
| lines | **drawingLine** white, `stroke-dasharray 2`, opacity 1 · **maskLine** `stroke:#00284d` solid, `dasharray 1000`, `dashoffset: calc(-240 * var(--progress))` · **placeholderLine** white, `dasharray 2`, opacity .3 (painted last) | |
| content | grid **40% 50%**, gap 10% → text 346.25 / images 432.8 | flex column, gap 5.2rem, mt 3.2rem |
| text | flex column gap 2rem; `h3.tx-h5.-tx600` 34px/36 **600**; `m-textContent` gap 2rem, p 16/24 | 22px |
| images box | `margin-top 1.2rem`; every `.a-image` radius 10 + **`box-shadow: 0 2.4rem 3.4rem #071e32`** | |
| image 1 | w 80% → 346×230 | 217×144 |
| image 2 | w 60% → 260 wide, **mt −7.5rem**, `margin-left: auto` (right-aligned) | mt −9rem |
| image 3 | w 40% → 173 wide, **mt −9rem**, ml 20% | mt −4.5rem |

Measured stacks (x, y, w×h): step 1 → (886, 3708, 346×230), (1059, 3864, 260×173); step 3 → (886, 4972, 346×230), (1059, 5128, 260×173), (972, 5210, 173×184). Later images paint on top (DOM order). **The images do not animate** (no transform/opacity change at any scroll position; only the lazy fade).

**Line "drawing" (scroll-linked)**: Locomotive writes `--progress` (0–1) on the stepper with offset 50%,50% and position start,center:
`start = stepperTop − vh + 0.5·vh` (step top at the viewport middle), `end = stepperTop − 0.5·vh + 0.5·stepperHeight` (step centre at the viewport middle).
The navy mask line starts covering the whole bright dashed line; as `--progress` grows its dash is shifted down by `240·p` viewBox units (×1.446 px/unit for a 347px svg), uncovering the bright dashes from the top down. Above the uncovered part you see bright dashes, below it only the 30% placeholder dashes. Measured step 1: p 0.009 at scrollY 3250 (dashoffset −2.2), 0.634 at 3500 (−152), 1 at 3750. Frame `expertise_07_step1_mid.png`.

```css
/* site.pretty.css L2605-2741 */
.m-expertiseStep {
  --progress: 50;
  display:grid;
  grid-template-columns:25% 75%;
  margin-bottom:2.4rem;
}
.m-expertiseStep__container {
  display:grid;
  gap:2rem;
}
@media only screen and (min-width: 1025px) {
  .m-expertiseStep__container {
    gap:5.6rem;
  }
}
.m-expertiseStep .a-tag {
  position:sticky;
  top:50%;
  z-index:1;
}
.m-expertiseStep .a-tag:before,.m-expertiseStep .a-tag:after {
  content:"";
  position:absolute;
  top:0;
  left:0;
  width:100%;
  height:100%;
}
.m-expertiseStep .a-tag:before {
  z-index:-2;
  background-color:#00284d;
  transform:scaleY(3);
}
@media only screen and (min-width: 1025px) {
  .m-expertiseStep .a-tag:before {
    transform:scaleY(3.75);
  }
}
.m-expertiseStep .a-tag:after {
  z-index:-1;
  border-radius:3.2rem;
  background-color:#ffffff1a;
}
.m-expertiseStep__stepper {
  display:flex;
  flex-direction:column;
  align-items:center;
}
.m-expertiseStep__stepperSvg {
  width:.2rem;
  height:100%;
  margin-top:1.8rem;
}
@media only screen and (min-width: 1025px) {
  .m-expertiseStep__stepperSvg {
    margin-top:3.2rem;
  }
}
.m-expertiseStep__drawingLine {
  opacity:1;
  stroke-dasharray:2;
}
.m-expertiseStep__placeholderLine {
  opacity:.3;
  stroke-dasharray:2;
}
.m-expertiseStep__maskLine {
  opacity:1;
  stroke:#00284d;
  stroke-dasharray:1000;
  stroke-dashoffset:calc(-240 * var(--progress));
}
.m-expertiseStep__content {
  display:flex;
  flex-direction:column;
  gap:2rem;
}
@media only screen and (max-width: 1024px) {
  .m-expertiseStep__content {
    gap:5.2rem;
    margin-top:3.2rem;
  }
}
@media only screen and (min-width: 1025px) {
  .m-expertiseStep__content {
    display:grid;
    grid-template-columns:40% 50%;
    gap:10%;
  }
}
.m-expertiseStep__textContent {
  display:flex;
  flex-direction:column;
  gap:2rem;
}
.m-expertiseStep .m-textContent {
  gap:2rem;
}
.m-expertiseStep__imagesContent .a-image {
  box-shadow:0 2.4rem 3.4rem #071e32;
}
.m-expertiseStep__imagesContent .a-image:nth-child(1) {
  width:80%;
}
.m-expertiseStep__imagesContent .a-image:nth-child(2) {
  width:60%;
  margin-top:-9rem;
  margin-left:auto;
}
@media only screen and (min-width: 1025px) {
  .m-expertiseStep__imagesContent .a-image:nth-child(2) {
    margin-top:-7.5rem;
  }
}
.m-expertiseStep__imagesContent .a-image:nth-child(3) {
  width:40%;
  margin-top:-4.5rem;
  margin-left:20%;
}
@media only screen and (min-width: 1025px) {
  .m-expertiseStep__imagesContent .a-image:nth-child(3) {
    margin-top:-9rem;
  }
}
@media only screen and (min-width: 1025px) {
  .m-expertiseStep__imagesContent {
    margin-top:1.2rem;
  }
}
@media only screen and (min-width: 1025px) {
  .m-expertiseStep {
    grid-template-columns:8.3333333333% 83.3333333333%;
    gap:8.3333333333%;
    width:92.3076923077%;
    margin-bottom:14rem;
  }
}
```

### 4.3 `section.o-expertiseClientsAwards` — y 8121, h 2163 (390: 8246, h 602)
White/navy, `overflow:hidden`, **`padding 10rem 0 22.7rem`** (`4rem 0 5.2rem`), section-steps + `toggleDarkUi`. Its column is `column-16 lg-column-13 lg-offset-3` **without** `no-width`, so direct children are forced to `width:100%` (this cancels the `.m-expertiseClients{width:15.38%}` rule).
- eyebrow "Our clients & awards".
- `div.m-expertiseClients` (w 100%, mb 14rem / 9rem): `h3.tx-h3.m-expertiseClients__title` "Incredible partners **trusted us**" w 69.23%, 60px, 1 line, mb 8rem (36px, 3 lines at 390).
- `section.m-sliderClients.-keepOverflow` (Slider, `data-config='{"dots":true,"autoplay":0,"tag":"ul","breakpoints":{"(min-width: 1025px)":{"active":false}}}'`): **w 92.3% (1038.75)**; desktop container = **grid 4 columns, gap 2rem** (Embla inactive) → 27 logo tiles, 7 rows, 1493 tall.
- Tile `div.m-client.-radiusXl` (homepage spec 10): 244.7 × 196.1 (`::before padding-bottom 80%`), `border 1px #CBCBCB`, **radius 2rem**; logo box `calc(100% − 5rem)` centred, img `max-width/max-height 100%`; most tiles wrap the logo in a link to a reference page. Hover: `z-index 2` + `box-shadow 0 3.4rem 3rem rgba(7,30,50,.1)` (.4s ease-quint).
- 390: Embla carousel, `--item-size 2` (3 at ≥641), `--item-spacing 1.4rem`, dots (dark `#4f4f4f` at .2 / active 1).
- The `m-expertiseAwards` / `m-sliderAwards` block (hover-follow image) exists in CSS but is **not on the page** today.

```css
/* site.pretty.css L5562-5574 */
.o-expertiseClientsAwards {
  overflow:hidden;
  padding-top:4rem;
  padding-bottom:5.2rem;
  background-color:#fff;
  color:#00284d;
}
@media only screen and (min-width: 1025px) {
  .o-expertiseClientsAwards {
    padding-top:10rem;
    padding-bottom:22.7rem;
  }
}
```
```css
/* site.pretty.css L4066-4101 */
.m-sliderClients {
  --item-size: 2;
  --item-spacing: 1.4rem;
}
@media only screen and (min-width: 1025px) {
  .m-sliderClients .m-slider__container {
    display:grid;
    grid-template-columns:repeat(4,1fr);
    gap:2rem;
    margin-left:0;
  }
}
.m-sliderClients__slide {
  flex:0 0 calc(100% / var(--item-size));
  padding-left:var(--item-spacing);
}
@media only screen and (min-width: 1025px) {
  .m-sliderClients__slide {
    padding-left:0;
  }
}
@media only screen and (min-width: 1025px) {
  .m-sliderClients .m-slider__dots {
    display:none;
  }
}
@media only screen and (min-width: 641px) {
  .m-sliderClients {
    --item-size: 3;
  }
}
@media only screen and (min-width: 1025px) {
  .m-sliderClients {
    width:92.3076923077%;
  }
}
```
```css
/* site.pretty.css L2587-2604 */
.m-expertiseClients {
  margin-bottom:9rem;
}
.m-expertiseClients__title {
  margin-bottom:5.6rem;
}
@media only screen and (min-width: 0) {
  .m-expertiseClients__title {
    width:69.2307692308%;
    margin-bottom:8rem;
  }
}
@media only screen and (min-width: 1025px) {
  .m-expertiseClients {
    width:15.3846153846%;
    margin-bottom:14rem;
  }
}
```

Frames (desktop): `expertise_00_hero.png`, `expertise_01_approach.png`, `expertise_02_approach_images.png`, `expertise_03_approach_quote.png`, `expertise_04_process_cloud_top.png`, `expertise_05_process_title.png`, `expertise_06_step1.png`, `expertise_07_step1_mid.png`, `expertise_08_step3.png`, `expertise_09_step5.png`, `expertise_11_process_cloud_bottom.png`, `expertise_12_clients.png`, `expertise_13_clients_grid.png`, `expertise_14_clients_bottom.png` — (390): `m390_expertise_00_hero.png`, `m390_expertise_01_approach.png`, `m390_expertise_02_approach_images.png`, `m390_expertise_03_approach_quote.png`, `m390_expertise_04_process_cloud_top.png`, `m390_expertise_05_process_title.png`, `m390_expertise_06_step1.png`, `m390_expertise_07_step1_mid.png`, `m390_expertise_08_step3.png`, `m390_expertise_09_step5.png`, `m390_expertise_11_process_cloud_bottom.png`, `m390_expertise_12_clients.png`, `m390_expertise_13_clients_grid.png`, `m390_expertise_14_clients_bottom.png`

---

## 5. `/en/our-services` (`main.t-productsindex`, namespace `products-index`)

Document height 3834 (desktop, 8 cards) → 4762 after "Load more" (13 cards); 7650 at 390. Order: hero (`-cloud`, tag "OUR SERVICES", 3-line title "Discover / **our amazing / services**", 3-line paragraph) → white products block → white breadcrumb → footer (no prefooter).

### 5.1 Markup
```html
<div class="t-productsindex__content -bgwhite">
  <section class="row" data-scroll data-scroll-call="initModules,Website,website" data-module-products-filter="productsFilter" data-paginate data-url>
    <form action="/en/our-services.json" method="GET" class="t-productsindex__selector lg-column-12 lg-offset-2 xlg-column-10 xlg-offset-3" data-products-filter="form">
      <div class="m-catSelector" data-module-cat-selector data-onchange="onFilterGrid,ProductsFilter,productsFilter" name="filter"
           style="--items-count: 4;  --color: var(--clraquatique); --offset: 0;">
        <select class="m-catSelector__selector tx-plarge" data-cat-selector="select">…</select>
        <div class="m-catSelector__list" data-cat-selector="list">
          <button class="m-catSelector__button tx-plarge -active" data-index="0" data-color="var(--clrdarkblue)" data-value="all">All</button>
          <button class="m-catSelector__button tx-plarge" data-index="1" data-color="var(--clrfontaine)" data-value="water-show">Water show</button>
          <button … data-index="2" data-color="var(--clraquatique)" data-value="water-effect">Water effect</button>
          <button … data-index="3" data-color="var(--clrgolddark)" data-value="immersive-fountain">Immersive fountain</button>
        </div>
      </div>
    </form>
    <ul class="t-productsindex__grid" data-products-filter="content" data-scroll data-scroll-repeat data-scroll-call="toggleDarkUi, Website, website" data-module-products>
      <li class="m-sliderProducts__slide"><a href="…" data-products="product"><div class="m-sliderProducts__slideInner -radius">…same card as the homepage slider…</div></a></li> ×8
    </ul>
    <button class="a-buttonField a-button t-productsindex__more -outline" data-products-filter="more"><span class="a-buttonField__text tx-cta">Load more</span><svg class="a-svg -arrow-right">…</svg></button>
    <p class="t-productsindex__footer tx-psmall -clrgraylight">All our products can be adapted and combined to offer you a unique and remarkable service.</p>
  </section>
</div>
```

### 5.2 Layout

| element | desktop (1425) | 390 |
|---|---|---|
| `.t-productsindex__content` | bg #fff, `padding 6rem 0` → y 1260, h 1487 | `padding 3.75rem 0` |
| `.row` | `flex-flow: column wrap` | |
| selector form | at ≥1367 `xlg-column-10 xlg-offset-3`: **w 62.5% (865.6), ml 18.75% → x 279.7**; (1025–1366: `lg-column-12 lg-offset-2` = 75%/12.5%); **mb 9rem** | full width, mb 3rem |
| category selector | same component as the homepage (homepage spec 6): 865.6 × 76.4, `padding .6rem`, bg #fafafa, border 1px #E3E3E3, radius 4rem; buttons 212.9 × 62.4, `tx-plarge` 18px/32.4, `padding 1.5rem .75rem` | native `<select>` pill: `padding 1.8rem`, 70.4 tall, arrow SVG at right 1.8rem |
| grid `ul.t-productsindex__grid` | grid **4 × 331.25**, **gap 2rem** (x 20 → 1405), y 1486 | 1 column (2 columns from 641) |
| card | **331.25 × 496.9** (`aspect-ratio 320/480`), radius 10; rows at y 1486 and 2003 | 362 × 543, step 563 |
| "Load more" | `a-button -outline` (white bg, 1px gold border, gold text 14px 600, `padding 1.35rem 2.5rem`, radius 4.4rem) **142.9 × 45.8**, `margin: 6rem auto 0` | same, centred |
| footer line | `tx-psmall` 14/21, colour **#cbcbcb**, centred, **w 62.5%** (75% at 641–1024, 100% below), `margin: 6rem auto 0` | |

**The pill starts purple**: the server sets `--color: var(--clraquatique)` with `--offset: 0`, so on load the sliding pill under "All" is **#6541CB**, not the dark-blue `data-color` of the "All" button (measured `rgb(101,65,203)`). After any click it takes the clicked button's `data-color` (All → `#000D1A`, Water show → `#4180C9`, Water effect → `#6541CB`, Immersive fountain → `#CEA95D`). Inactive labels `#c5c5c5`, hover `#4f4f4f` + 1px outline `rgba(79,79,79,.1)`, active white.

**Card** (identical to the homepage product card, homepage spec 6): `::before` `linear-gradient(0deg,#000c 22.43%,#0000 63.69%)` z 2; still image `.-cover` z 0; hover video `figure.a-video.-cover` z 1 at `opacity 0; scale(1.03)` → `.-hover` `opacity 1; scale(1)` (`opacity .1s ease-in-out .15s, transform .3s ease-in-out`; the `Products` module sets `src` on first hover and plays/pauses); content `padding 3.2rem 2.4rem`, column gap 2.4rem, bottom-aligned: tag row (gap .6rem, `a-tag -icon` 19px tall, bg `rgba(255,255,255,.24)`, `backdrop-filter: blur(.4rem)`, 13px coloured icon disc), `h2.m-titleContent.tx-h4` 40px/44 −0.8px weight 300 with strong 600, `p.tx-uni14`. Differences from the homepage slider: no drag cursor / no Embla; `a` is `display:grid`; the slide's `padding-left: var(--item-spacing)` and `flex` resolve to nothing because `--item-spacing/--item-size` are only defined on `.m-sliderProducts` (not an ancestor here) → no gutter besides the grid gap. Cursor pointer. Measured hover: video `opacity 1`, `transform: none`; still image unchanged. Frame `services_hover_card.png` (video did not decode headless).

```css
/* site.pretty.css L8113-8162 */
.t-productsindex__content {
  padding:3.75rem 0;
}
.t-productsindex__content .row {
  flex-flow:column wrap;
}
.t-productsindex__selector {
  margin-bottom:3rem;
}
.t-productsindex__grid {
  display:grid;
  grid-template-columns:1fr;
  gap:2rem;
  width:100%;
}
.t-productsindex .m-sliderProducts__slide a {
  display:grid;
}
.t-productsindex__more {
  margin:6rem auto 0;
}
.t-productsindex__more.-hidden {
  display:none;
}
.t-productsindex__footer {
  margin:6rem auto 0;
  text-align:center;
}
@media only screen and (min-width: 641px) {
  .t-productsindex__grid {
    grid-template-columns:repeat(2,1fr);
  }
  .t-productsindex__footer {
    width:75%;
  }
}
@media only screen and (min-width: 1025px) {
  .t-productsindex__selector {
    margin-bottom:9rem;
  }
  .t-productsindex__content {
    padding:6rem 0;
  }
  .t-productsindex__grid {
    grid-template-columns:repeat(4,1fr);
  }
  .t-productsindex__footer {
    width:62.5%;
  }
}
```
```css
/* site.pretty.css L4137-4255 */
.m-sliderProducts {
  --item-size: 1.1;
  --item-spacing: 2rem;
  --scale: 0;
  --x: 0;
  --y: 0;
  position:relative;
  width:100%;
}
.m-sliderProducts:not(.-keepOverflow) {
  overflow:hidden;
}
.m-sliderProducts__slide {
  flex:0 0 calc(100% / var(--item-size));
  padding-left:var(--item-spacing);
}
.m-sliderProducts__slide a {
  -webkit-user-select:none;
  -moz-user-select:none;
  user-select:none;
}
.m-sliderProducts .is-draggable,.m-sliderProducts .is-draggable a {
  cursor:none;
}
.m-sliderProducts__slideInner {
  position:relative;
  display:flex;
  align-items:flex-end;
  height:100%;
  color:#fff;
  text-align:center;
  pointer-events:none;
  aspect-ratio:320/480;
}
.m-sliderProducts__slideInner:before {
  content:"";
  position:absolute;
  top:0;
  left:0;
  z-index:2;
  width:100%;
  height:100%;
  background:linear-gradient(0deg,#000c 22.43%,#0000 63.69%);
}
.m-sliderProducts__slideInner .a-image {
  z-index:0;
}
.m-sliderProducts__slideInner .a-video {
  z-index:1;
  opacity:0;
  transition:opacity .1s ease-in-out .15s,transform .3s ease-in-out;
  transform:scale(1.03);
}
.m-sliderProducts__slideInner .a-video.-hover {
  opacity:1;
  transition:opacity .1s ease-in-out,transform .3s ease-in-out;
  transform:scale(1);
}
.m-sliderProducts .m-draggerIcon {
  z-index:2;
  width:auto;
  opacity:0;
  pointer-events:none;
  transition:transform .07s ease-out,opacity .4s ease-in-out;
}
.m-sliderProducts .m-draggerIcon__circle {
  transform:scale(var(--scale));
}
.m-sliderProducts .m-draggerIcon .a-svg {
  width:23%;
  height:23%;
}
.m-sliderProducts.-hover {
  --scale: 1;
}
.m-sliderProducts.-hover .m-draggerIcon {
  opacity:1;
}
.m-sliderProducts__viewport.-dragging+.m-draggerIcon {
  --scale: .8;
}
.m-sliderProducts__slideContent {
  z-index:2;
  display:flex;
  flex-direction:column;
  gap:2.4rem;
  align-items:center;
  width:100%;
  padding:3.2rem 2.4rem;
}
.m-sliderProducts__categoriesList {
  display:flex;
  flex-flow:row wrap;
  gap:.6rem;
  align-items:center;
  justify-content:center;
}
.m-sliderProducts__categoriesList .a-tag {
  flex-shrink:0;
  background-color:#ffffff3d;
  color:#fff;
  -webkit-backdrop-filter:blur(.4rem);
  backdrop-filter:blur(.4rem);
}
@media only screen and (min-width: 641px) {
  .m-sliderProducts {
    --item-size: 2.5;
  }
}
@media only screen and (min-width: 1025px) {
  .m-sliderProducts {
    --item-size: 3.5;
  }
}
@media only screen and (min-width: 1367px) {
  .m-sliderProducts {
    --item-size: 4;
  }
}
```
```css
/* site.pretty.css L2415-2505 */
.m-catSelector {
  --color: #000D1A;
  --offset: 0;
  --items-count: 4;
  position:relative;
  width:100%;
}
.m-catSelector:after {
  content:"";
  position:absolute;
  top:50%;
  right:1.8rem;
  display:block;
  width:1rem;
  height:.5rem;
  background:url("data:image/svg+xml;charset=utf-8,%3Csvg width='11' height='6' viewBox='0 0 11 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E %3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M5.72103 5.60791C5.81753 5.60791 5.913 5.5883 6.00156 5.5503C6.08806 5.51317 6.16616 5.45927 6.23128 5.39177L10.6591 1.00222C10.7622 0.900074 10.793 0.746432 10.7372 0.613003C10.6815 0.479575 10.5501 0.392503 10.4044 0.392503L1.03768 0.392502C0.891996 0.392502 0.760646 0.479574 0.704878 0.613002C0.649111 0.746431 0.679877 0.900074 0.782911 1.00222L5.21078 5.39177C5.27591 5.45927 5.35401 5.51317 5.44051 5.5503C5.52907 5.5883 5.62454 5.60791 5.72103 5.60791Z' fill='%23000D1A'/%3E %3C/svg%3E");
  background-position:center center;
  background-size:contain;
  background-repeat:no-repeat;
  transform:translateY(-50%);
}
.m-catSelector__selector {
  width:100%;
  padding:1.8rem;
  border:1px solid #E3E3E3;
  border-radius:4rem;
  background-color:#fafafa;
  color:#00284d;
  text-align:left;
  -webkit-appearance:none;
  -moz-appearance:none;
  appearance:none;
}
.m-catSelector__list {
  display:none;
}
.m-catSelector__button {
  z-index:3;
  border-radius:4rem;
  color:#c5c5c5;
  outline:solid 1px transparent;
  transition:outline .1s cubic-bezier(.23,1,.32,1),color .4s cubic-bezier(.23,1,.32,1);
}
.m-catSelector__button:not(.-active):hover {
  color:#4f4f4f;
  outline:solid 1px rgba(79,79,79,.1);
  transition:outline 1s cubic-bezier(.23,1,.32,1),color .4s cubic-bezier(.23,1,.32,1);
}
.m-catSelector__button.-active {
  color:#fff;
}
@media only screen and (min-width: 1025px) {
  .m-catSelector {
    padding:.6rem;
    border:1px solid #E3E3E3;
    border-radius:4rem;
    background-color:#fafafa;
  }
  .m-catSelector:after {
    display:none;
  }
  .m-catSelector__selector {
    display:none;
  }
  .m-catSelector__list {
    position:initial;
    position:relative;
    display:flex;
    flex-flow:row nowrap;
    align-items:center;
    justify-content:space-between;
  }
  .m-catSelector__list:before {
    content:"";
    position:absolute;
    top:0;
    left:0;
    z-index:2;
    width:calc(100% / var(--items-count));
    height:100%;
    border-radius:4rem;
    background-color:var(--color);
    pointer-events:none;
    transition:transform 1s cubic-bezier(.23,1,.32,1),background-color 1s cubic-bezier(.23,1,.32,1);
    transform:translate(calc(var(--offset) * 100%));
  }
  .m-catSelector__button {
    width:100%;
    padding:1.5rem .75rem;
  }
}
```

### 5.3 Behaviour
- **Filter** (`CatSelector` → `ProductsFilter.onFilterGrid`): `history.pushState` `?filter=<value>`, `fetch('/en/our-services.json?filter=…&page=1&paginate=1')`, then **replace** the grid's `innerHTML` with the returned HTML (no fade on this page — `onFilterSlider`'s 150ms fade is only used by sliders) and re-run lazyload; the "Load more" button gets `-hidden` if `more` is false. The pill moves `translateX(offset × 100%)` and recolours over **1s ease-quint** (measured 12.8px at 0ms → 146px at 190ms → 204px at 470ms → 212.9 at 970ms). The list swap happened ≈0.65s after the click (network). Frame `services_filter_watershow.png`.
- **Load more** (`queryMore`): page += 1, same fetch, **append**; new cards appear instantly, their lazy images fade in (`opacity .15s`); the button gets `.-hidden` (`display:none !important`) when the response says no more (measured: 8 → 13 cards at ≈0.45s, button hidden, page 3834 → 4762). Frames `services_03_loadmore.png`, `services_after_loadmore.png`.
- "Load more" hover (outline button): no `::before` fill, no colour change; only the arrow moves (`margin-left .8rem`, .4s ease-quint) → the button grows 8px. The label-padding rule (`.a-buttonField__text:last-child`) does not match because the arrow follows the label (measured label padding 0). Frame `services_loadmore_hover.png`.
- The grid is the dark-UI trigger (`toggleDarkUi` on the `ul`), so header/side rail turn navy over the white block.

```js
/* site.pretty.js L8407-8518 */
class Lc extends j {
    constructor(t) {
        super(t), this.events = {
            change: {
                select: "onChange"
            },
            click: {
                list: "onClick"
            }
        }
    }
    onChange(t) {
        const {
            value: e
        } = t.target;
        this.updateButtons(this.el.querySelectorAll("button"), e), this.emit("onchange", e)
    }
    onClick(t) {
        if (t.target.nodeName !== "BUTTON") return;
        const e = t.target.getAttribute("data-value"),
            i = t.target.getAttribute("data-index"),
            n = t.target.getAttribute("data-color");
        this.emit("onchange", e);
        const [s] = this.$("select");
        window.requestAnimationFrame(() => {
            this.el.style.setProperty("--offset", i), this.el.style.setProperty("--color", n), this.updateButtons(t.currentTarget.querySelectorAll("button"), e), s.value = e
        })
    }
    updateButtons(t, e) {
        t.forEach(i => {
            i.classList[e === i.getAttribute("data-value") ? "add" : "remove"]("-active")
        })
    }
    emit(t, e) {
        const i = this.el.dataset[t].split(","),
            n = {
                el: this.el,
                value: e
            };
        this.call(i[0], n, i[1], i[2])
    }
}
class kc extends j {
    constructor(t) {
        super(t), this.events = {
            click: {
                more: "queryMore"
            }
        }, this.page = 1, this.paginate = this.el.dataset.paginate !== void 0, this.url = this.el.dataset.url !== void 0, this.value = "all"
    }
    onFilterSlider({
        value: t
    }) {
        q({
            targets: this.$("slider")[0],
            opacity: [1, 0],
            duration: 150,
            easing: "easeInOutQuad",
            complete: () => {
                this.onFilterGrid({
                    value: t
                })
            }
        })
    }
    onFilterGrid({
        value: t
    }) {
        if (!this.updating) {
            if (this.updating = !0, this.value = t, this.page = 1, this.reset = !0, this.url) {
                const e = new URL(window.location.href);
                e.searchParams.set("filter", t), history.pushState({}, "", e.toString())
            }
            this.queryProducts()
        }
    }
    queryMore(t) {
        this.updating || (t.preventDefault(), this.updating = !0, this.page += 1, this.reset = !1, this.queryProducts())
    }
    getAction() {
        const [t] = this.$("form");
        let e = `${t.action}?filter=${this.value}&page=${this.page}`;
        return console.log(e), this.paginate && (e += "&paginate=1"), e
    }
    async queryProducts() {
        return fetch(this.getAction(), {
            method: "GET",
            headers: {
                "Cache-Control": "no-cache",
                "Content-Type": "multipart/form-data",
                "X-Requested-With": "fetch"
            }
        }).then(this.afterUpdate.bind(this)).catch(this.onError.bind(this))
    }
    async afterUpdate(t) {
        const e = await t.json(),
            [i] = this.$("content"),
            [n] = this.$("more"),
            [s] = this.$("slider");
        this.reset ? i.innerHTML = e.products : i.innerHTML += e.products, n && n.classList.toggle("-hidden", !e.more), s && (this.call("reGenerate", {
            startIndex: 0
        }, "Slider", s.getAttribute("data-module-slider")), q({
            targets: this.$("slider")[0],
            opacity: [0, 1],
            duration: 150,
            easing: "easeInOutQuad"
        })), this.call("updateLazy", null, "Website", "website"), this.updating = !1
    }
    onError(t) {
        console.warn(t)
    }
}
```

Breadcrumb: white variant (10.1) at y 2747 → "Home / Our services".

Frames (desktop): `services_00_hero.png`, `services_01_hero_cloud_to_grid.png`, `services_02_selector_grid.png`, `services_03_loadmore.png`, `services_after_loadmore.png`, `services_cat_hover.png`, `services_filter_watershow.png`, `services_hover_card.png`, `services_loadmore_hover.png` — (390): `m390_services_00_hero.png`, `m390_services_01_hero_cloud_to_grid.png`, `m390_services_02_selector_grid.png`, `m390_services_03_loadmore.png`

---

## 6. `/en/our-references` (`main.t-referencesindex`, namespace `references-index`)

**No hero.** Document height 3598 (desktop, 19 cards shown) / 10701 (390). Order: `section.o-referenceGrid` (dark) → breadcrumb (dark) → footer.

### 6.1 Markup
```html
<section class="o-referenceGrid -bgdarkblue" data-module-grid="gridReferences">
  <h1 class="tx-h1 o-referenceGrid__title js-title"><b>Our references</b></h1>
  <div class="o-referenceGrid__list" data-references-select="content" data-grid="content">
    <article class="o-referenceGrid__item -active m-referenceCard -radius -clrwhite -bggreen" data-grid="card" data-index="0" style="--delay: 0ms">
      <div class="m-referenceCard__link">
        <h2 class="tx-pxxlarge">
          <a href="/en/our-references/graton-casino-prism-art-fountain" data-index="0"><b>Aqua Graphic® water curtain</b> <br> Graton Casino Prism Art Fountain</a>
        </h2>
        <div class="m-referenceCard__logoWrapper flex-center"><svg class="a-svg -aquatic-show-symbol"><use href="#icon-aquatic-show-symbol"/></svg></div>
        <p class="tx-uni8 -txupp">Rohnert Park, California <br> <strong>Since</strong> : 2026</p>
      </div>
      <img data-src="…-600x-q80.webp" data-lazy class="a-sImage js-image-image m-referenceCard__image -radius" width="2000" height="1500"
           sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1366px) 33vw, 25vw" data-srcset="…">
    </article>
    … 63 articles (19 with -active) …
    <button class="a-buttonField a-button -secondary o-referenceGrid__button" data-grid="loadMore"><span class="a-buttonField__text tx-cta">Load more</span><svg class="a-svg -arrow-right">…</svg></button>
  </div>
  <div class="m-referencesSelect js-nav" data-module-references-select>
    <ul class="m-referencesSelect__list" data-references-select="list" data-lenis-prevent>
      <li><button data-category="all" data-references-select="filterButton" class="m-referencesSelect__item -current -clrwhite -txupp -tx600">All</button></li>
      <li><button data-category="water-drone-shows-aquastage" …>Water drone shows / AquaStage®</button></li> … 13 categories …
    </ul>
    <button class="m-referencesSelect__currentFilter -clrwhite -txupp -tx600" data-references-select="currentButton">
      <span>Services</span><span data-references-select="currentLabel" class="m-referencesSelect__currentLabel">All</span>
      <svg class="a-svg -arrow-toggle">…</svg>
    </button>
    <form action="/en/our-references.json" data-references-select="form"><select name="category" data-references-select="select">…</select></form>
  </div>
</section>
<div class="o-breadcrumb">…Home / Our references…</div>
```
Card colour modifier: one of `-bggreen` `#767b43`, `-bgocre` `#643232`, `-bgorange` `#d1701e`, `-bgpurple` `#5c175e`, `-bgblue` `#17206b`, or `-fullart` (photo fills the tile). In the current data 31 of 63 cards are `-fullart`. `--delay` = `(index mod 19) × 100ms` (0…1800ms, repeating).

### 6.2 Grid and section

| | desktop | 390 |
|---|---|---|
| section | `display:flex; flex-flow: column wrap`, **`padding 16rem 2rem 4rem`**, bg **#000d1a**, `user-select:none`, h 2511 | same padding, h 9033 |
| top fade `::before` | **`position: fixed`**, top 0, full width, **16rem tall**, `linear-gradient(180deg,#000d1a,#000d1a00)`, z 99, no pointer events — cards dissolve under the header | same |
| list | grid, gap 2rem; **1 col; 2 from 641; 3 from 1025; 4 from 1367** → 4 × 331.25 at 1425 (x 20, 371.25, 722.5, 1073.75), rows every 434px from y 160 | 1 col, 350 wide, rows every 457.5 |
| card | `aspect-ratio 1/1.25` → **331.25 × 414.06**, radius 10, `overflow:hidden` | 350 × 437.5 |
| "Load more" | `a-button -secondary` (bg `rgba(255,255,255,.1)`, radius 5rem, `padding 1.35rem 2.5rem`) 140.9×43.8, `grid-column: 1/-1` (≥641), `justify-self:center`; y 2330 | centred |

Card anatomy (`.m-referenceCard`, centred text, `position:relative; z-index:3`):
- `.m-referenceCard__link`: flex column, `padding 3.2rem 2.4rem`, z 2.
- `h2.tx-pxxlarge` **24px / 25.99** (1.083), white: `<b>` category (600) + `<br>` + name (400); 2–4 lines. The anchor's `::before` is an invisible full-card overlay (z 10) → the whole tile is the link.
- Logo disc `.m-referenceCard__logoWrapper`: 4rem circle, bg `rgba(255,255,255,.4)`, `backdrop-filter: blur(.4rem)`, `margin: auto auto 1.2rem` (pushed to the bottom); the Aquatique symbol 2.4×2.6rem inside. Measured at y 471 in a 414 card (card top 160).
- `p.tx-uni8.-txupp`: 8px / 9.6, uppercase, two lines ("CITY, COUNTRY" / "SINCE : 2026" with `Since` in 600, or a year range).
- Inset photo `img.m-referenceCard__image`: absolute, `top/left 50%`, **57% × 57%** (188.8 × 236 in a 331×414 card), `translate(-50%, -47.5%)`, `object-fit: cover`, radius 10, **z −1** (behind the title, which overlaps the photo's top edge).
- `-fullart`: photo **100% × 100%**, `translate(-50%,-50%)`; `.m-referenceCard__link::before` bottom gradient `linear-gradient(180deg, #000d1900 59.55%, #000d19b3)`; the logo disc gets `position:relative; z-index:2`.

```css
/* site.pretty.css L7103-7263 */
.o-referenceGrid {
  --scale: 1;
  --opacity: 1;
  position:relative;
  display:flex;
  flex-flow:column wrap;
  width:100%;
  padding:16rem 2rem 4rem;
  -webkit-user-select:none;
  -moz-user-select:none;
  user-select:none;
}
.o-referenceGrid>* {
  -webkit-user-select:none;
  -moz-user-select:none;
  user-select:none;
}
.o-referenceGrid:before {
  content:"";
  position:fixed;
  top:0;
  left:0;
  z-index:99;
  width:100%;
  height:16rem;
  background:linear-gradient(180deg,#000d1a,#000d1a00);
  pointer-events:none;
}
.o-referenceGrid+.o-breadcrumb {
  background-color:#000d1a;
}
.o-referenceGrid__list {
  position:relative;
  display:grid;
  grid-template-columns:1fr;
  gap:2rem;
  width:100%;
}
.o-referenceGrid__title,.o-referenceGrid__noResults {
  position:absolute;
  top:50vh;
  left:50%;
  text-align:center;
  pointer-events:none;
  transform:translate(-50%,-50%);
}
.o-referenceGrid__noResults {
  opacity:0;
  transition:opacity .4s ease-in-out;
}
.o-referenceGrid.-ready .o-referenceGrid__title {
  opacity:0;
  transition:opacity .4s ease-out;
}
.o-referenceGrid.-ready .o-referenceGrid__noResults {
  opacity:1;
  transition-delay:.3s;
}
.o-referenceGrid .m-referencesSelect {
  position:sticky;
  z-index:98;
  margin-top:3rem;
}
.o-referenceGrid .m-draggerIcon {
  z-index:100;
  display:none;
  opacity:var(--opacity);
  pointer-events:none;
  transition:transform .07s ease-out,opacity .1s ease-in-out;
  will-change:transform;
}
.o-referenceGrid .m-draggerIcon__circle {
  transform:scale(var(--scale));
}
.o-referenceGrid .m-referenceCard {
  transition:transform .4s cubic-bezier(.23,1,.32,1),opacity 2s cubic-bezier(.23,1,.32,1) var(--delay, 0ms);
  will-change:transform;
}
.o-referenceGrid.-hoverable .m-referenceCard {
  transition:transform .4s cubic-bezier(.23,1,.32,1),opacity .7s ease-in-out;
}
.o-referenceGrid__item {
  position:relative;
  z-index:1;
  display:none;
  width:100%;
  opacity:0;
}
.o-referenceGrid__item.-active {
  display:block;
}
.o-referenceGrid__item.-active.-visible {
  opacity:1;
}
.o-referenceGrid__item.-backside {
  opacity:.5!important;
}
@media (hover: hover) and (any-pointer: fine) {
  .o-referenceGrid__item:hover {
    z-index:96;
  }
  .o-referenceGrid__item:hover .m-referenceCard:hover {
    transform:scale(1);
  }
}
.o-referenceGrid .o-breadcrumb {
  display:none;
}
.o-referenceGrid.-dragging {
  --scale: .8;
}
.o-referenceGrid.-dragging>* {
  pointer-events:none;
}
.o-referenceGrid__button {
  justify-self:center;
}
@media only screen and (min-width: 641px) {
  .o-referenceGrid .o-breadcrumb {
    position:fixed;
    bottom:0;
    left:0;
    z-index:97;
    display:block;
    width:100%;
  }
  .o-referenceGrid .o-breadcrumb .row {
    max-width:initial;
  }
  .o-referenceGrid .m-referencesSelect {
    bottom:7rem;
  }
  .o-referenceGrid__list {
    grid-template-columns:repeat(2,1fr);
  }
  .o-referenceGrid__button {
    grid-column:1/-1;
  }
}
@media only screen and (min-width: 1025px) {
  .o-referenceGrid {
    padding:16rem 2rem 4rem;
  }
  .o-referenceGrid .o-breadcrumb {
    padding:3rem 0 4.5rem;
  }
  .o-referenceGrid .m-referencesSelect {
    bottom:2.4rem;
  }
  .o-referenceGrid .m-draggerIcon {
    display:initial;
  }
  .o-referenceGrid__list {
    grid-template-columns:repeat(3,1fr);
  }
}
@media only screen and (min-width: 1367px) {
  .o-referenceGrid__list {
    grid-template-columns:repeat(4,1fr);
  }
}
```
```css
/* site.pretty.css L3756-3833 */
.m-referenceCard {
  position:relative;
  z-index:3;
  text-align:center;
  transition:transform .4s cubic-bezier(.23,1,.32,1),opacity 2s cubic-bezier(.23,1,.32,1) var(--delay, 0ms);
}
.m-referenceCard__link {
  position:relative;
  z-index:2;
  display:flex;
  flex-direction:column;
  justify-content:flex-start;
  padding:3.2rem 2.4rem;
  -webkit-user-select:none;
  -moz-user-select:none;
  user-select:none;
  aspect-ratio:1/1.25;
}
.m-referenceCard a:before {
  content:"";
  position:absolute;
  top:0;
  left:0;
  z-index:10;
  display:block;
  width:100%;
  height:100%;
}
.m-referenceCard .a-svg {
  width:2.4rem;
  height:2.6rem;
}
.m-referenceCard__logoWrapper {
  width:4rem;
  height:4rem;
  margin:0 auto 1.2rem;
  margin-top:auto;
  border-radius:50%;
  background-color:#fff6;
  -webkit-backdrop-filter:blur(.4rem);
  backdrop-filter:blur(.4rem);
}
.m-referenceCard__image {
  position:absolute;
  top:50%;
  left:50%;
  z-index:-1;
  -o-object-fit:cover;
  object-fit:cover;
  width:57%;
  height:57%;
  pointer-events:none;
  transform:translate(-50%,-47.5%);
}
.m-referenceCard.-fullart .m-referenceCard__image {
  width:100%;
  height:100%;
  transform:translate(-50%,-50%);
}
.m-referenceCard.-fullart .m-referenceCard__link>div {
  position:relative;
  z-index:2;
}
.m-referenceCard.-fullart .m-referenceCard__link:before {
  content:"";
  position:absolute;
  top:0;
  left:0;
  width:100%;
  height:100%;
  background:linear-gradient(180deg,#000d1900 59.55%,#000d19b3);
}
@media (hover: hover) and (any-pointer: fine) {
  .m-referenceCard:hover {
    z-index:4;
    transform:scale(1.05);
  }
}
```

### 6.3 Filter pill `.m-referencesSelect` (sticky, bottom-centre)
- It is the **last flex item of the section** with `position: sticky; bottom: 2.4rem` (`7rem` between 641 and 1024 — room for the fixed breadcrumb variant), plus `left/right 1.6rem` below 641, `margin-top 3rem`, z 98. Result: it floats at the bottom of the viewport (desktop y 809–876 in a 900 viewport) for the whole grid, and scrolls away with the section's end (y −294 at the page bottom). It is **not** `position:fixed`.
- ≥641: `left: 50%; width: 34.4rem; transform: translate(-50%)` → x 540.5, 344 wide. <641: 350 wide.
- Shell: `padding 1rem`, radius 3.2rem, bg `rgba(0,13,26,.8)`, `box-shadow 0 4px 14px rgba(0,0,0,.25)` → 67 tall closed.
- Current-filter button (`.m-referencesSelect__currentFilter`): flex, gap 2.4rem, `padding 1.6rem`, radius 3.2rem, bg `rgba(255,255,255,.1)`, white 600 uppercase at the UA button size **13.333px** (buttons are not in the reset's font list): "SERVICES" + current label (ellipsis) + `arrow-toggle` .6rem pushed right (`margin-left:auto`, rotates 180° when open, .4s ease-quint). 324 × 47.
- List (`ul`, sits **above** the button inside the same shell): `max-height: 0; overflow:hidden; transition: max-height 1s ease-quint`. JS stores `--height` = list `scrollHeight` (645px). Open (`.-open` on the shell): `max-height: min(var(--height), 100vh − 24rem)` (desktop; 32rem below 1025), `overflow:auto`, thin scrollbar `rgba(255,255,255,.4)`, `overscroll-behavior: contain`, `data-lenis-prevent`. Because the shell is bottom-sticky, **it grows upward**: shell top 770 → 409 (170ms) → 190 (620ms) → settled by ≈1s. Frames `references_select_open_0173ms.png`, `references_select_open_1427ms.png`, `m390_references_select_open_*`.
- Items: full-width buttons, `padding 1.4rem 0`, **14px 600 uppercase centred**, white; `li` separators `1px rgba(143,143,143,.2)`; last item `margin-bottom 1.6rem`; current item `opacity .5; pointer-events:none`. Other items are `opacity 1` (transition .4s ease-quint; no hover change measured).
- Choosing a category (`ReferencesSelect.filter`): label text updated, `-current` moved, hidden `<select>` synced, `?filter=<slug>` pushed, list closed, Grid hover disabled, `fetch('/en/our-references.json?filter=…')` → `window.scrollTo(0,0)` → list `innerHTML` replaced → lazyload update → `Grid.reflow()` + `Grid.enter()` (cards get `-visible` next frame) → `Scroll.update()`.
- Measured ("Water screen"): list replaced at ≈0.8s (63 → 14 cards), cards fade 0 → 1 in ≈0.7s (all together, because the grid was still `-hoverable`; otherwise the staggered 2s fade of 6.4 applies). Frames `references_filter_*`.

```css
/* site.pretty.css L3834-3934 */
.m-referencesSelect {
  position:absolute;
  right:1.6rem;
  bottom:2.4rem;
  left:1.6rem;
  z-index:6;
  padding:1rem;
  border-radius:3.2rem;
  background-color:#000d1acc;
  box-shadow:0 4px 14px #00000040;
}
.m-referencesSelect__currentFilter {
  display:flex;
  flex-flow:row nowrap;
  gap:2.4rem;
  align-items:center;
  width:100%;
  padding:1.6rem;
  border-radius:3.2rem;
  background-color:#ffffff1a;
}
.m-referencesSelect .a-svg {
  width:.6rem;
  height:.6rem;
  margin-left:auto;
  transition:transform .4s cubic-bezier(.23,1,.32,1);
  transform:rotate(0);
}
.m-referencesSelect.-open .a-svg {
  transform:rotate(180deg);
}
.m-referencesSelect__list {
  --height: 0;
  overflow:hidden;
  max-height:0;
  transition:max-height 1s cubic-bezier(.23,1,.32,1);
  overscroll-behavior:contain;
}
.m-referencesSelect.-open .m-referencesSelect__list {
  overflow:auto;
  max-height:min(var(--height),32rem);
  scrollbar-color:rgba(255,255,255,.4) transparent;
  scrollbar-width:thin;
}
.m-referencesSelect.-open .m-referencesSelect__list::-webkit-scrollbar {
  width:.6rem;
}
.m-referencesSelect.-open .m-referencesSelect__list::-webkit-scrollbar-track {
  background-color:#000d1acc;
}
.m-referencesSelect.-open .m-referencesSelect__list::-webkit-scrollbar-thumb {
  border-radius:.4rem;
  background-color:#ffffff1a;
  -webkit-transition:background-color .4s cubic-bezier(.23,1,.32,1);
  transition:background-color .4s cubic-bezier(.23,1,.32,1);
}
.m-referencesSelect.-open .m-referencesSelect__list::-webkit-scrollbar-thumb:hover {
  background-color:#fff6;
}
@media only screen and (min-width: 1025px) {
  .m-referencesSelect.-open .m-referencesSelect__list {
    max-height:min(var(--height),100vh - 24rem);
  }
}
.m-referencesSelect li:not(:last-child) {
  border-bottom:solid .1rem rgba(143,143,143,.2);
}
.m-referencesSelect__item {
  display:block;
  width:100%;
  padding:1.4rem 0;
  font-size:1.4rem;
  text-align:center;
  opacity:1;
  transition:opacity .4s cubic-bezier(.23,1,.32,1);
}
.m-referencesSelect__item.-current {
  opacity:.5;
  pointer-events:none;
}
li:last-child .m-referencesSelect__item {
  margin-bottom:1.6rem;
}
.m-referencesSelect__currentLabel {
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  pointer-events:none;
}
.m-referencesSelect form {
  position:absolute;
  visibility:hidden;
}
@media only screen and (min-width: 641px) {
  .m-referencesSelect {
    right:auto;
    left:50%;
    width:34.4rem;
    transform:translate(-50%);
  }
}
```
```js
/* site.pretty.js L8725-8789 */
class qc extends j {
    constructor(t) {
        super(t), this.events = {
            click: {
                currentButton: "toggleList",
                filterButton: "filter"
            }
        }, this.state = !1, this.currentFilterEl = this.$("filterButton")[0], this.resize()
    }
    toggleList() {
        this.state = !this.state, this.el.classList.toggle("-open")
    }
    closeList() {
        this.state = !0, this.toggleList()
    }
    resize() {
        const [t] = this.$("list"), e = t.scrollHeight;
        window.requestAnimationFrame(() => {
            t.style.setProperty("--height", `${e}px`)
        })
    }
    filter(t) {
        const {
            target: e
        } = t, i = e.getAttribute("data-category"), [n] = this.$("currentLabel");
        n.textContent = e.textContent, this.currentFilterEl.classList.remove("-current"), this.currentFilterEl = e, this.currentFilterEl.classList.add("-current");
        const [s] = this.$(`option-${i}`), {
            value: o
        } = s, [l] = this.$("select");
        l.value = o, this.value = l.value;
        const a = new URL(window.location.href);
        a.searchParams.set("filter", o), history.pushState({}, "", a.toString()), this.onFilterCategory(), this.closeList()
    }
    async onFilterCategory() {
        this.call("toggleHoverable", !1, "Grid", "gridReferences"), await this.queryReferences()
    }
    getAction() {
        const [t] = this.$("form");
        return `${t.action}?filter=${this.value}`
    }
    async queryReferences() {
        return fetch(this.getAction(), {
            method: "GET",
            headers: {
                "Cache-Control": "no-cache",
                "Content-Type": "multipart/form-data",
                "X-Requested-With": "fetch"
            }
        }).then(this.afterUpdate.bind(this)).catch(this.onError.bind(this))
    }
    async afterUpdate(t) {
        const e = await t.json(),
            [i] = this.$("content", ut);
        window.scrollTo(0, 0, {
            behavior: "smooth"
        }), window.requestAnimationFrame(() => {
            i.innerHTML = e.references, window.requestAnimationFrame(() => {
                this.call("updateLazy", null, "Website", "website"), this.call("reflow", null, "Grid", "gridReferences"), this.call("enter", null, "Grid", "gridReferences"), this.call("update", null, "Scroll", "scroll"), this.updating = !1
            })
        })
    }
    onError(t) {
        console.warn(t)
    }
}
```

### 6.4 Hover (fine pointer only; `Grid` module)
- CSS: the hovered card `transform: scale(1.05)`, `z-index 4` (**.4s ease-quint**). Measured 331×414 → 348×435.
- JS (`mousemove`, throttled 30ms): on entering a card the grid gets `.-hoverable` and **every other card** gets `.-backside` → `opacity: .5 !important`; while `-hoverable` the card transition is `transform .4s ease-quint, opacity .7s ease-in-out` (measured 1 → .5 in ≈0.55s).
- Leaving the cards: after 200ms `-backside` is removed (fade back to 1 in .7s), 700ms later `-hoverable` is removed.
- Elements with `.js-nav` (the filter pill) count as "outside".
- Frame `references_hover_card.png`.

```js
/* site.pretty.js L8632-8724 */
class zc extends j {
    constructor(t) {
        super(t), this.cards = [], this.hover = null, this.hoverable = !1, this.enterAnimation = null, this.isMobile = Ht(), this.end = !1, this.events = {
            click: {
                loadMore: "onLoadMore"
            }
        }, this.updateCursor = zt(this.updateCursor.bind(this), 30), this.onMouseEnter = this.onMouseEnter.bind(this), this.onMouseLeave = this.onMouseLeave.bind(this)
    }
    static getMousePosition(t) {
        return {
            x: t.touches ? t.touches[0].clientX : t.clientX,
            y: t.touches ? t.touches[0].clientY : t.clientY
        }
    }
    updateCursor(t) {
        if (t.target.closest && t.target.closest(".js-nav")) {
            this.onMouseLeave();
            return
        }
        this.onMouseEnter(), this.toggleHover(t.target)
    }
    onMouseEnter() {
        this.isEnter || (this.isEnter = !0)
    }
    onMouseLeave() {
        this.isEnter && (setTimeout(() => {
            this.isEnter = !1
        }, 50), this.toggleHover(-1))
    }
    toggleHover(t) {
        if (!this.hoverable || !t.dataset) return;
        const e = Number(t.dataset.index ?? "-1");
        this.changeHover(e)
    }
    toggleHoverable(t) {
        this.hoverable = t
    }
    changeHover(t) {
        this.hover !== t && (this.hover = t, clearTimeout(this.hoverTimeout), window.cancelAnimationFrame(this.rafHover), t === -1 ? this.hoverTimeout = setTimeout(() => {
            this.rafHover = window.requestAnimationFrame(() => {
                this.cards.forEach(e => {
                    e.classList.remove("-backside")
                }), this.timeoutHover = setTimeout(() => {
                    this.rafHover = window.requestAnimationFrame(() => {
                        this.el.classList.remove("-hoverable")
                    })
                }, 700)
            })
        }, 200) : (clearTimeout(this.timeoutHover), this.rafHover = window.requestAnimationFrame(() => {
            this.el.classList.add("-hoverable"), this.cards.forEach((e, i) => {
                const n = t !== i;
                e.classList.toggle("-backside", n)
            })
        })))
    }
    init() {
        this.isMobile || (this.el.addEventListener("mousemove", this.updateCursor, {
            passive: !1
        }), this.el.addEventListener("mouseenter", this.onMouseEnter, {
            passive: !1
        }), this.el.addEventListener("mouseleave", this.onMouseLeave, {
            passive: !1
        })), this.reflow()
    }
    reflow() {
        this.setCards(), this.end = !1, this.hoverable = !0
    }
    enter() {
        const t = this.cards.filter(e => e.classList.contains("-active"));
        window.requestAnimationFrame(() => {
            this.el.classList.add("-ready"), t.forEach(e => {
                e.classList.add("-visible")
            })
        })
    }
    onLoadMore(t) {
        const e = this.cards.filter(i => !i.classList.contains("-active")).splice(0, 20);
        e.length < 20 && (t.currentTarget.style.display = "none", this.end = !0), window.requestAnimationFrame(() => {
            e.forEach(i => {
                i.classList.add("-active")
            }), window.requestAnimationFrame(() => {
                e.forEach(i => {
                    i.classList.add("-visible")
                })
            }), this.call("update", null, "Scroll", "scroll")
        })
    }
    setCards() {
        this.cards = [];
        const t = Array.from(this.$("card"));
        this.cards = t
    }
}
```

### 6.5 Entrance
- Server HTML: 19 cards `-active` (displayed) at `opacity:0`; the title `h1.o-referenceGrid__title` ("**Our references**", 80px 600, absolute at `top: 50vh; left: 50%; translate(-50%,-50%)`) is visible alone on the dark background.
- The `references-index` Barba view calls `Grid.enter()` **600ms after `afterEnter`** (first load and Barba navigation alike): the section gets `.-ready` → title `opacity 0` (**.4s ease-out**); active cards get `.-visible` → `opacity 1` with **`transition: opacity 2s ease-quint var(--delay)`** → a left-to-right, row-by-row cascade 0–1800ms.
- Measured first load (t from navigation start): loader wiping 1.36–4.4s; `-ready` at ≈2.1s; card 0 opacity .04 → .48 → .87 → .94 → .998 at +0, +0.22, +0.62, +0.84, +1.5s; card 5 starts ≈0.5s later; card 18 reaches 1 at ≈6s. The white smoke loader plays over it (9.3). Frames `references_load_*`.
- The header's side rail is forced visible on this page (`toggleHeaderVisibility(false)` in `Website.after`).

```js
/* site.pretty.js L3584-3608 */
    rl = {
        init(r, t) {
            this.call = r, this.config = t
        },
        invoke() {
            return {
                namespace: "references-index",
                init: this.init.bind(this),
                afterEnter: this.afterEnter.bind(this)
            }
        },
        afterEnter({
            trigger: r
        }) {
            if (r === "barba") {
                setTimeout(() => {
                    this.call("enter", null, "Grid", "gridReferences")
                }, 600);
                return
            }
            setTimeout(() => {
                this.call("enter", null, "Grid", "gridReferences")
            }, 600)
        }
    }.invoke(),
```

### 6.6 Load more
`Grid.onLoadMore`: takes the next **20** non-active cards, adds `-active` (display) and, one frame later, `-visible` (fade with their `--delay`); if fewer than 20 remained the button is hidden (`style.display = none`). `Scroll.update()` recalculates. Measured 19 → 39 cards; their opacity went .002 → .24 → .74 → 1 in ≈0.65s (grid was `-hoverable`, so the .7s ease-in-out transition applied). Hover on the button: bg `rgba(255,255,255,.15)` + `outline 1px rgba(255,255,255,.4)` (.4s) + arrow `margin-left .8rem`. Frames `references_loadmore_*`, `references_loadmore_hover.png`.

### 6.7 Breadcrumb
`.o-referenceGrid + .o-breadcrumb` → **bg #000d1a** (border-top `1px #ececec` kept, text `#a8a8a8`). The CSS also has a variant for a breadcrumb *inside* the grid (fixed to the bottom at ≥641, pill at `bottom: 7rem`), unused on this page.

### 6.8 390
One column of 350 × 437.5 cards; the pill spans the column (x 20, 350 wide), sticky 24px above the bottom; list max-height 32rem (320px, scrollable); no hover logic (`isMobile`); title 56px. Frames `m390_references_00_top.png`, `m390_references_01_bottom_loadmore.png`, `m390_references_02_end.png`, `m390_references_select_open_0177ms.png`, `m390_references_select_open_1251ms.png`.

### 6.9 Clicking a tile
Plain `<a href="/en/our-references/<slug>">` inside the card (its `::before` covers the tile) → **Barba "basic" transition** (section 9) to the reference detail template: `-cloud` hero (1260 tall) with coloured category tags (`a-tag -icon -fill`, e.g. `-aquatique` bg `#6541cb`, `padding .3rem .8rem .3rem .4rem`, 19px tall), the title, and `.m-hero__referenceTagsList` (`a-tag -reference`: `padding 1.2rem 1.9rem`, 1px white border, bg `rgba(255,255,255,.1)`, 11px), then `t-page__blocks` (white) with `b-textImage`, `b-images`, sliders etc. Measured: URL changed at ≈0.22s, new container inserted ≈0.72s, done ≈2.3s. Frames `references_tileclick_*`, `reference_detail_00_hero.png`.

Desktop frames: `reference_detail_00_hero.png`, `references_00_top.png`, `references_01_bottom_loadmore.png`, `references_02_end.png`, `references_filter_0282ms.png`, `references_filter_1154ms.png`, `references_filter_2254ms.png`, `references_filter_4221ms.png`, `references_hover_card.png`, `references_load_0078ms.png`, `references_load_1575ms.png`, `references_load_2352ms.png`, `references_load_2972ms.png`, `references_load_3859ms.png`, `references_load_4606ms.png`, `references_load_5330ms.png`, `references_load_6057ms.png`, `references_load_6862ms.png`, `references_load_7640ms.png`, `references_load_8359ms.png`, `references_load_9101ms.png`, `references_loadmore_0651ms.png`, `references_loadmore_3470ms.png`, `references_loadmore_hover.png`, `references_select_open_0173ms.png`, `references_select_open_1427ms.png`, `references_tileclick_0226ms.png`, `references_tileclick_0942ms.png`, `references_tileclick_1687ms.png`, `references_tileclick_2511ms.png`, `references_tileclick_3987ms.png`

---

## 7. `/en/contact` (`main`, plain hero)

Document height 3400 (desktop) / 4743 (390). Order: plain hero (760; title "**Contact us** / for your project", no paragraph; still photo) → white form block → info cards → white breadcrumb → footer (no prefooter).

### 7.1 Block and title
```html
<div class="-bgwhite -clrnavy">
  <div class="row">
    <div class="column-16 lg-column-12 lg-offset-2 o-contactForm no-width" data-scroll data-scroll-repeat data-scroll-offset="33%, 33%" data-scroll-call="toggleDarkUi, Website, website">
      <p class="tx-h4 -tx600 o-contactForm__title">For information on our solutions and advice on your project.</p>
      <form action="/en/contact.json" method="POST" data-module-form class="o-contactForm__form m-form" data-contact>
        <input type="hidden" name="captcha" data-form="recaptcha">   <!-- reCAPTCHA v3 token, refreshed every 119s -->
        <div class="o-contactForm__leftPanel">…5 text fields…</div>
        <div class="o-contactForm__rightPanel">…checkboxes, radios, textarea…</div>
        <div class="o-contactForm__rgpdPanel">…consent checkbox, captcha message, submit…</div>
      </form>
      <ul class="o-contactInformations">…3 cards…</ul>
    </div>
  </div>
</div>
```

| | desktop | 390 |
|---|---|---|
| `.o-contactForm` column | x 193.1, **w 1038.75** (75%), `padding 7.6rem 0 15.8rem` | 362, `padding 5.4rem 0 5.2rem` |
| title `p.tx-h4.-tx600` | **40px / 44 / −0.8px, weight 600**, centred, **w 80% (831), margin 0 auto 9.6rem**, 2 lines | 30px, 3 lines, mb 6.4rem |
| form | `display:flex; flex-flow: row wrap` | |
| left panel | grid, gap **2.6rem**, **w 50% (519.4)** | 100% |
| right panel | grid, gap 2.6rem, **w 40% (415.5), margin-left 10% (103.9)** → x 816.4 | 100%, `margin-top 4rem` |
| consent panel | flex column, full width, **margin-top 8.4rem** (y 1699) | mt 5.2rem |
| info cards | grid **3 × 332.9, gap 2rem**, `margin-top 9.6rem` (y 1975) | 1 column, mt 6.4rem |

The whole block toggles the dark UI (offset 33%).

```css
/* site.pretty.css L5054-5168 */
.o-contactForm {
  padding-top:5.4rem;
  padding-bottom:5.2rem;
}
.o-contactForm__title {
  margin-bottom:6.4rem;
  font-weight:600;
  text-align:center;
}
@media only screen and (min-width: 1025px) {
  .o-contactForm__title {
    width:80%;
    margin:auto;
    margin-bottom:9.6rem;
  }
}
.o-contactForm__form {
  display:flex;
  flex-flow:row wrap;
}
.o-contactForm__leftPanel {
  display:grid;
  grid-template-columns:1fr;
  gap:2.6rem;
  width:100%;
}
@media only screen and (min-width: 1025px) {
  .o-contactForm__leftPanel {
    width:50%;
  }
}
.o-contactForm__rightPanel {
  display:grid;
  grid-template-columns:1fr;
  gap:2.6rem;
  width:100%;
  margin-top:4rem;
}
.o-contactForm__rightPanel .a-inputCheckbox {
  padding-bottom:3.2rem;
  border-bottom:solid .1rem #CBCBCB;
}
.o-contactForm__rightPanel .a-inputCheckbox .a-labelText,.o-contactForm__rightPanel .a-inputRadio .a-labelText {
  margin-bottom:3.2rem;
  font-size:1.8rem;
}
.o-contactForm__rightPanel .a-inputField__buttons {
  display:flex;
  flex-flow:row wrap;
  gap:1rem;
}
@media only screen and (min-width: 1025px) {
  .o-contactForm__rightPanel .a-inputField__buttons {
    gap:1rem 4rem;
  }
}
@media only screen and (min-width: 1025px) {
  .o-contactForm__rightPanel {
    width:40%;
    margin-top:0;
    margin-left:10%;
  }
}
.o-contactForm__rgpdPanel {
  display:flex;
  flex-direction:column;
  margin-top:5.2rem;
}
.o-contactForm__rgpdPanel .a-inputField__button {
  padding-left:4.2rem;
}
@media only screen and (min-width: 1025px) {
  .o-contactForm__rgpdPanel .a-inputField__button {
    padding-left:5.5rem;
  }
}
.o-contactForm__rgpdPanel .a-inputField__value:before {
  position:absolute;
  top:0;
  left:0;
  transform:translate(-4.2rem);
}
@media only screen and (min-width: 1025px) {
  .o-contactForm__rgpdPanel .a-inputField__value:before {
    transform:translate(-5.5rem);
  }
}
.o-contactForm__rgpdPanel .a-inputField__value:after {
  left:-3.8rem;
}
@media only screen and (min-width: 1025px) {
  .o-contactForm__rgpdPanel .a-inputField__value:after {
    left:-5.1rem;
  }
}
.o-contactForm__rgpdPanel .a-button {
  margin:4rem auto 0;
}
.o-contactForm__rgpdPanel .a-button[aria-disabled] span,.o-contactForm__rgpdPanel .a-button[aria-disabled] .a-svg {
  display:none;
}
.o-contactForm__rgpdPanel .a-button[aria-disabled] .m-loaderSection__loader {
  display:block;
}
@media only screen and (min-width: 1025px) {
  .o-contactForm__rgpdPanel {
    margin-top:8.4rem;
  }
}
@media only screen and (min-width: 1025px) {
  .o-contactForm {
    padding-top:7.6rem;
    padding-bottom:15.8rem;
  }
}
```
```css
/* site.pretty.css L5220-5243 */
.o-contactInformations {
  display:grid;
  grid-template-columns:1fr;
  gap:2rem;
  width:100%;
  margin-top:6.4rem;
}
.o-contactInformations__item {
  padding:5rem;
  background-color:#fafafa;
}
.o-contactInformations__item h3 {
  margin-bottom:1.8rem;
}
.o-contactInformations__wrapper {
  display:grid;
  gap:1rem;
}
@media only screen and (min-width: 1025px) {
  .o-contactInformations {
    grid-template-columns:repeat(3,1fr);
    margin-top:9.6rem;
  }
}
```

### 7.2 Fields (labels are static, above the control — not floating)

```html
<div class="a-inputField a-inputText" data-form="firstname">
  <label class="a-inputField__label a-labelText tx-p" for="firstname"><span>Your last name</span> <abbr title="Obligatoire" class="a-inputField__attr">*</abbr></label>
  <div class="a-inputField__content">
    <input type="text" id="firstname" name="firstname" class="a-inputText__input tx-p" placeholder="ex: Dupont" required maxlength="80">
  </div>
</div>
```

Left panel, in order (all required, `*` in `#eb0045`):

| label | type / name | placeholder | notes |
|---|---|---|---|
| Your last name | text / `firstname` | ex: Dupont | maxlength 80 (the name/label mismatch is in the source) |
| Your first name | text / `lastname` | ex: Jean | maxlength 80 |
| Your e-mail | email / `email` | ex: jean.dupont@gmail.com | `.a-inputEmail` |
| Phone number | tel / `tel` | 06 23 35 45 65 | `.a-inputTel`, `min=10 max=15` |
| Your country | text / `country` | ex: France | maxlength 80 |

Right panel:
1. `div.a-inputField.a-inputCheckbox[data-form="interest[]"]`: `p.a-inputField__label.a-labelText.tx-p` "You are interested in :" then `ul.a-inputField__buttons` of `li.a-inputField__button > input[type=checkbox].a-inputCheckbox__input + label.a-inputField__value.tx-p` — Water show / Water effect / Immersive fountain (not required).
2. `div.a-inputField.a-inputRadio[data-form=project]`: "For a project about :" — radios Permanent / Temporary (not required).
3. `div.a-inputField.a-inputTextarea[data-form=message]`: label "Your request" (no `*`), `textarea` `cols=30 rows=10` (not required).

Consent panel: `div.a-inputField.a-inputCheckbox[data-form=rgpd]` with one **required** checkbox whose label is the full GDPR paragraph + `*`; then `div.m-loaderSection__captcha[data-form=captcha]` (empty, red text if filled); then the submit button. **No file upload** on this form (the `a-inputFile` styles exist for other forms).

Measurements (desktop):

| part | value |
|---|---|
| label | block, **16px / 24**, weight 400, navy, `margin-bottom 1rem`; `*` is `abbr` in `#eb0045`, no underline |
| text inputs | `width:100%`, **`padding 1.6rem 2rem`**, **`border 1px solid #CBCBCB`**, **radius .4rem**, navy text 16/24, bg #fff, `appearance:none`, no shadow → **519.4 × 58**; field block 98.2 tall; rows at y 1054, 1178, 1302, 1427, 1551 |
| placeholder | `#bababa` |
| focus (and `.-hover`) | `border-color: #00284d; outline: none` — **no transition**, no shadow |
| group labels (`p.a-labelText` in the right panel) | **18px / 27**, `margin-bottom 3.2rem` |
| option list | `display:flex; flex-flow: row wrap; gap: 1rem 4rem` (1rem both ways below 1025) → "Water show", "Water effect" on row 1, "Immersive fountain" on row 2 (x 816 / 986, y 1082 / 1116) |
| checkbox group | `padding-bottom 3.2rem; border-bottom 1px solid #CBCBCB` → 150 tall |
| checkbox | native input `opacity:0`, absolute; `label::before` box **2rem × 2rem**, `border 1px #BABABA`, **radius .4rem**, `margin-right 2rem`, `vertical-align: middle`; `label::after` tick = `1.2rem × .6rem` with `border-left/bottom .2rem currentColor` (navy) at `top .5rem; left .4rem` |
| checkbox animation | unchecked `opacity 0; rotate(-90deg) scale(0)` → checked `opacity 1; rotate(-45deg) scale(1)`, **.4s ease-quint** (measured mid-way at 150ms: rotate ≈ −46.7°, scale .96) |
| radio | `label::before` **1.6rem circle**, `border 1px #BABABA`; `::after` **.8rem navy dot** at `top 50%; left .4rem`, `translateY(calc(-50% + 1px)) scale(0)` → `scale(1)` + opacity, **.4s ease-quint** |
| textarea | same box as inputs, `min-height 14rem`, `resize: vertical`, rows=10 → **415.5 × 274** |
| consent row | `li` `padding-left 5.5rem` (4.2rem < 1025); `::before` box absolute at `translate(-5.5rem)`; tick `left −5.1rem` (−3.8rem); text 16/24, 4 lines (974 wide) |
| submit | `button.a-button.-primary.-bgnavy.-clrwhite.-boxed.m-loaderSection__button`: navy pill, `padding 1.35rem 2.5rem`, radius 4.4rem, `min-width 22.1rem`, **`margin: 4rem auto 0`** → **221 × 43.8** centred (x 602, y 1835); label `tx-cta` 14px 600 "Discuss my project" + 13px arrow (gap 1rem) |
| submit hover | `::before` `linear-gradient(0deg,#fff0,#ffffff1a)` slides `translateY(-100%) → 0` (1s ease-quint) and the arrow gets `margin-left .8rem` (.4s ease-quint); the label does **not** get the extra padding (it is not the last child — the loader div follows), measured label padding 0, width stays 221 |

```css
/* site.pretty.css L1846-2029 */
.a-inputCheckbox .a-inputField__button {
  position:relative;
}
.a-inputCheckbox .a-inputField__value {
  position:relative;
  cursor:pointer;
}
.a-inputCheckbox .a-inputField__value:before {
  content:"";
  display:inline-block;
  vertical-align:middle;
  width:2rem;
  height:2rem;
  margin-right:2rem;
  border:solid .1rem #BABABA;
  border-radius:.4rem;
}
.a-inputCheckbox .a-inputField__value:after {
  content:"";
  position:absolute;
  top:.5rem;
  left:.4rem;
  width:1.2rem;
  height:.6rem;
  border-bottom:solid .2rem currentcolor;
  border-left:solid .2rem currentcolor;
  opacity:0;
  transition-timing-function:cubic-bezier(.23,1,.32,1);
  transition-duration:.4s;
  transition-property:transform,opacity;
  transform:rotate(-90deg) scale(0);
}
.a-inputCheckbox input {
  position:absolute;
  top:0;
  left:0;
  opacity:0;
}
.a-inputCheckbox input:checked+.a-inputField__value:after {
  opacity:1;
  transform:rotate(-45deg) scale(1);
}
.a-inputField__content,.a-inputEmail__content,.a-inputTel__content {
  position:relative;
}
.a-inputField textarea,.a-inputEmail textarea,.a-inputTel textarea {
  min-height:14rem;
  resize:vertical;
}
.a-inputField__error,.a-inputEmail__error,.a-inputTel__error {
  margin-top:.5rem;
  color:#eb0045;
}
.a-inputField input[type=text] /* +11 alias selectors trimmed */ {
  width:100%;
  padding:1.6rem 2rem;
  border:solid .1rem #CBCBCB;
  border-radius:.4rem;
  color:#00284d;
  box-shadow:none;
  font-family:inherit;
  -webkit-appearance:none;
  -moz-appearance:none;
  appearance:none;
}
.a-inputField input[type=text]::-moz-placeholder /* +11 alias selectors trimmed */ {
  color:#bababa;
}
.a-inputField input[type=text]::placeholder /* +11 alias selectors trimmed */ {
  color:#bababa;
}
.a-inputField input[type=text].-hover /* +23 alias selectors trimmed */ {
  border-color:#00284d;
  outline:none;
}
.a-inputField input[type=text].-error /* +23 alias selectors trimmed */ {
  border-color:#eb0045;
  color:#eb0045;
}
.a-inputFile input {
  position:absolute;
  top:0;
  left:0;
  z-index:2;
  width:100%;
  height:100%;
  opacity:0;
  cursor:pointer;
}
.a-inputFile__container {
  position:relative;
}
.a-inputFile .a-inputField__delete {
  position:absolute;
  top:50%;
  right:1rem;
  display:none;
  width:1.5rem;
  height:1.5rem;
  transform:translateY(-50%);
}
.a-inputFile .a-inputField__delete .a-svg {
  width:100%;
  height:100%;
}
.a-inputFile .a-inputField__file {
  position:relative;
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:1.4rem;
}
.a-inputFile .a-inputField__input {
  position:relative;
  padding:1.4rem 2rem;
  border:solid .1rem #CBCBCB;
  border-radius:.4rem;
  color:#cbcbcb;
  font-size:1.4rem;
}
.a-inputFile .a-inputField__filename:not(:empty)+.a-inputField__delete {
  display:block;
}
.a-inputFile .a-button {
  align-self:flex-start;
  border-color:#cbcbcb;
  color:#cbcbcb;
}
.a-inputFile .a-inputFile__warning {
  display:none;
  margin-top:1.6rem;
  color:#ac1c38;
  font-size:1.1rem;
}
.a-inputField__label {
  display:block;
  margin-bottom:1rem;
}
.a-inputField__attr {
  color:#eb0045;
  text-decoration:none;
}
.a-inputRadio .a-inputField__button {
  position:relative;
}
.a-inputRadio .a-inputField__value {
  position:relative;
  cursor:pointer;
}
.a-inputRadio .a-inputField__value:before {
  content:"";
  display:inline-block;
  vertical-align:middle;
  width:1.6rem;
  height:1.6rem;
  margin-right:2rem;
  border:solid .1rem #BABABA;
  border-radius:9rem;
}
.a-inputRadio .a-inputField__value:after {
  content:"";
  position:absolute;
  top:50%;
  left:.4rem;
  width:.8rem;
  height:.8rem;
  border-radius:9rem;
  background-color:#00284d;
  opacity:0;
  transition-timing-function:cubic-bezier(.23,1,.32,1);
  transition-duration:.4s;
  transition-property:transform,opacity;
  transform:translateY(calc(-50% + 1px)) scale(0);
  transform-origin:center;
}
.a-inputRadio input {
  position:absolute;
  top:0;
  left:0;
  opacity:0;
}
.a-inputRadio input:checked+.a-inputField__value:after {
  opacity:1;
  transform:translateY(calc(-50% + 1px)) scale(1);
}
```
```css
/* site.pretty.css L1636-1767 */
.a-button {
  position:relative;
  display:inline-flex;
  gap:1rem;
  align-items:center;
  justify-content:center;
  overflow:hidden;
  padding:1.35rem 2.5rem;
  border-radius:4.4rem;
  font-weight:600;
}
.a-button .m-loaderSection__loader {
  display:none;
  width:6rem;
  height:1.6rem;
}
.a-button .m-loaderSection__loader div {
  top:.5rem;
  width:.6rem;
  height:.6rem;
}
.a-button .m-loaderSection__loader div:nth-child(1) {
  left:.3rem;
}
.a-button .m-loaderSection__loader div:nth-child(2) {
  left:.3rem;
}
.a-button .m-loaderSection__loader div:nth-child(3) {
  left:2.5rem;
}
.a-button .m-loaderSection__loader div:nth-child(4) {
  left:4.7rem;
}
.a-button .a-svg {
  width:1.3rem;
  height:1.3rem;
  color:inherit;
  transition:margin .4s cubic-bezier(.23,1,.32,1);
}
.a-button .a-svg.-left {
  flex-shrink:0;
  order:-1;
}
.a-button .a-buttonField__text,.a-button .a-svg {
  position:relative;
  z-index:1;
}
.a-button.-primary:before {
  content:"";
  position:absolute;
  top:0;
  left:0;
  width:100%;
  height:100%;
  background:linear-gradient(0deg,#fff0,#ffffff1a);
  pointer-events:none;
  transition:transform 1s cubic-bezier(.23,1,.32,1);
  transform:translateY(-100%);
}
@media (hover: hover) and (any-pointer: fine) {
  .a-button.-primary:hover:not([aria-disabled]):before,.a-button.-primary.-hover:not([aria-disabled]):before {
    transform:translateY(0);
  }
}
.a-button .a-buttonField__text:last-child {
  padding:0;
  transition:padding 1s cubic-bezier(.23,1,.32,1);
}
.a-button.-bgwhite {
  transition:background-color 1s cubic-bezier(.23,1,.32,1);
}
.a-button.-bgwhite .a-buttonField__text:last-child {
  padding:0;
  transition:padding 1s cubic-bezier(.23,1,.32,1);
}
@media (hover: hover) and (any-pointer: fine) {
  .a-button.-bgwhite:hover {
    background-color:#f9fcff;
  }
  .a-button.-bgwhite:hover .a-buttonField__text:last-child {
    padding:0 .8rem;
  }
}
@media only screen and (max-width: 1024px) {
  .a-button.-wide {
    width:100%;
  }
}
.a-button.-boxed {
  min-width:22.1rem;
}
.a-button.-outline {
  border:solid 1px #C79D47;
  background-color:#fff;
  color:#c79d47;
}
.a-button.-share {
  background-color:#ffffff1a;
  outline:solid 1px rgba(255,255,255,0);
  transition:outline .4s cubic-bezier(.23,1,.32,1),background-color .4s cubic-bezier(.23,1,.32,1);
}
.a-button.-share:hover,.a-button.-share:focus {
  background-color:#ffffff26;
  outline:solid 1px rgba(255,255,255,.4);
}
.a-button.-secondary {
  border-radius:5rem;
  background-color:#ffffff1a;
  outline:solid 1px rgba(255,255,255,0);
  transition:outline .4s cubic-bezier(.23,1,.32,1),background-color .4s cubic-bezier(.23,1,.32,1),opacity .4s cubic-bezier(.23,1,.32,1);
}
.a-button.-secondary:hover,.a-button.-secondary:focus {
  background-color:#ffffff26;
  outline:solid 1px rgba(255,255,255,.4);
}
.a-button[aria-disabled] {
  opacity:.7;
  cursor:not-allowed;
}
@media (hover: hover) and (any-pointer: fine) {
  .a-button:hover .a-buttonField__text:last-child {
    padding:0 .8rem;
  }
  .a-button:hover .a-svg {
    margin-left:.8rem;
  }
  .a-button:hover .a-svg.-left {
    margin-right:.8rem;
    margin-left:0;
  }
}
.a-caption {
```
```css
/* site.pretty.css L3302-3362 */
.m-loaderSection {
  width:100%;
  padding:2rem 0;
  text-align:center;
}
.m-loaderSection__loader {
  position:relative;
  width:6rem;
  height:6rem;
  margin:0 auto;
}
.m-loaderSection__loader div {
  position:absolute;
  top:2.5rem;
  width:1rem;
  height:1rem;
  border-radius:50%;
  background:#fff;
  animation-timing-function:cubic-bezier(0,1,1,0);
}
.m-loaderSection__loader div:nth-child(1) {
  left:.3rem;
  animation:lds-ellipsis1 .6s infinite;
}
.m-loaderSection__loader div:nth-child(2) {
  left:.3rem;
  animation:lds-ellipsis2 .6s infinite;
}
.m-loaderSection__loader div:nth-child(3) {
  left:2.5rem;
  animation:lds-ellipsis2 .6s infinite;
}
.m-loaderSection__loader div:nth-child(4) {
  left:4.7rem;
  animation:lds-ellipsis3 .6s infinite;
}
.m-loaderSection__error,.m-loaderSection__captcha:not(:empty) {
  margin-top:2rem;
  color:#eb0045;
  text-align:center;
}
.m-loaderSection__success {
  color:#6bbc2b;
}
.m-loaderSection__state {
  display:none;
  width:1.3rem;
  height:1.3rem;
  margin-top:.2rem;
  background:url(/assets/images/icons/validate.png) no-repeat center;
  background-size:contain;
}
.m-loaderSection__button.-success {
  background-color:#6bbc2b;
}
.m-loaderSection__button.-success .m-loaderSection__state {
  display:inline-block;
}
.m-loaderSection__button.-success .a-svg {
  display:none;
}
```

### 7.3 Validation, sending, errors (tested with an empty submit only — nothing was sent)
- **Empty submit**: `Form.onSearch` calls `form.checkValidity()`; when it is false the handler does **not** `preventDefault`, so the browser's **native constraint validation** runs: the submit is blocked (no POST was made), focus jumps to the first invalid control ("Your last name") whose border turns navy (focus style) and Chrome shows its native bubble "Please fill out this field." (captured in `contact_empty_submit_native_validation.png`). There is **no custom client-side error styling**; `:invalid` is not styled.
- **Server-side errors** (valid-looking POST whose JSON has `invalid`): `setErrors` adds `.-error` to each `[data-form=<name>]` wrapper and appends `<p class="a-pxsmall a-inputField__error">message</p>`.
  - `.-error` input/textarea: **border and text `#eb0045`** (placeholder stays `#bababa`).
  - error text: `margin-top .5rem`, colour `#eb0045`. The class `a-pxsmall` does not exist in the CSS (typo for `tx-pxsmall`), so it renders at the inherited **10px**, normal line-height (11px tall).
  - checkbox/radio wrappers get the class too, but no style targets them.
  - global message: `<p class="a-pxsmall m-loaderSection__error">{data-error}<br/>{server message}</p>` inserted after the button: 10px, centred, `#eb0045`, `margin-top 2rem`; button also gets `.-error` (unstyled). Cleared after **6s** (or on the next submit).
  - These states were rendered by applying exactly the classes/elements the module adds (the message text in the frames is a placeholder): `contact_error_state_simulated_fields.png`, `contact_error_state_simulated_submit.png`.
- **Sending**: button `aria-disabled="true"` → `opacity .7`, `cursor: not-allowed`; label and arrow `display:none`; `.m-loaderSection__loader` shown: **6rem × 1.6rem**, 4 white dots **.6rem** at `top .5rem`, `lds-ellipsis1/2/3` **.6s infinite** (dot 1 scales in, dots 2–3 translate 2.1rem, dot 4 scales out). Form gets `.-loading` (unstyled). Frame `contact_submit_sending_simulated.png`.
- **Success**: button `.-success` → **bg `#6bbc2b`**, `.m-loaderSection__state` shown (1.3rem `validate.png` tick, `margin-top .2rem`), arrow hidden, label → "Your request has been sent" (button grows to 244.3); all inputs reset; restored after 6s. A `dataLayer` event `formulaire_contact_succes` is pushed. Frame `contact_submit_success_simulated.png`.
- Toast alternative `.m-formCallback` (fixed bottom-right, green/red) exists in CSS but this form does not use it.

```js
/* site.pretty.js L6814-6970 */
class Kn extends j {
    constructor(t) {
        super(t), this.errors = {}, this.state = !1, this.containerScroll = window, this.loading = !1, this.timeouts = [], this.events = {
            click: {
                submit: "onSearch"
            }
        }
    }
    init() {
        setTimeout(() => {
            this.createRecaptchaScript()
        }, 2e3)
    }
    destroy() {
        clearInterval(this.interval)
    }
    createRecaptchaScript() {
        const [t] = this.$("recaptcha");
        this.recaptchaKey = t.dataset.key, t.removeAttribute("data-key"), this.recaptchaKey && Ea(`https://www.google.com/recaptcha/api.js?render=${this.recaptchaKey}`, {
            id: "recaptcha-id"
        }, e => {
            e.target.setAttribute("data-loaded", "true"), grecaptcha.ready(() => {
                this.call("initRecaptcha", null, "Form"), this.call("initRecaptcha", null, "Newsletter")
            })
        }, e => {
            e.dataset.loaded === "true" && this.initRecaptcha()
        })
    }
    initRecaptcha() {
        this.interval = setInterval(this.setRecaptcha.bind(this), 119 * 1e3), this.setRecaptcha()
    }
    setRecaptcha() {
        return new Promise(t => {
            const [e] = this.$("recaptcha");
            grecaptcha.execute(this.recaptchaKey, {
                action: "homepage"
            }).then(i => {
                e.value = i, t(i)
            })
        })
    }
    onSearch(t) {
        if (this.disabledSubmit) {
            t.preventDefault();
            return
        }
        window.requestAnimationFrame(() => {
            this.clearCallback()
        }), t.currentTarget.blur(), this.el.checkValidity() && (this.disabledSubmit = !0, window.requestAnimationFrame(() => {
            t.currentTarget.setAttribute("aria-disabled", "true")
        }), t.preventDefault(), this.sendForm(this.el))
    }
    async sendForm(t) {
        this.cleanErrors(), window.requestAnimationFrame(() => {
            this.el.classList.add("-loading")
        }), this.loading = !0, this.state = null;
        const e = new FormData(this.el);
        fetch(t.action, {
            method: "POST",
            responseType: "json",
            body: e,
            headers: {
                "Cache-Control": "no-cache",
                "X-Requested-With": "post"
            }
        }).then(async i => {
            const n = await i.json();
            this.formSent(n)
        }).catch(i => {
            this.errorForm(i)
        })
    }
    setCallback(t, e) {
        const [i] = this.$("submit");
        window.requestAnimationFrame(() => {
            if (i.classList.add(e ? "-success" : "-error"), this.el.classList.remove("-loading"), e) this.resetInput(), i.querySelector(".a-buttonField__text").innerText = i.dataset.success;
            else {
                const n = document.createElement("p");
                n.setAttribute("class", "a-pxsmall m-loaderSection__error"), n.setAttribute(this.mAttr, "errorMessage"), n.innerHTML = `${i.dataset.error}<br/>${t}`, i.after(n)
            }
            this.timeoutError = setTimeout(this.clearCallback.bind(this), 6e3)
        })
    }
    clearCallback() {
        clearTimeout(this.timeoutError);
        const [t] = this.$("submit"), [e] = this.$("errorMessage");
        t.classList.remove("-success"), t.classList.remove("-error"), t.querySelector(".a-buttonField__text").innerText = t.dataset.content, e && e.remove()
    }
    cleanErrors() {
        this.$("invalid").forEach(e => {
            window.requestAnimationFrame(() => {
                e.parentNode.classList.remove("-error"), e.remove()
            })
        })
    }
    formSent(t) {
        if (t.invalid && Object.keys(t.invalid).length > 0) {
            this.errorForm(t);
            return
        }
        if (this.state = !0, this.setCallback(t.message, t.success), this.enableForm(), this.setRecaptcha(), this.el.dataset.contact !== void 0) {
            const e = new FormData(this.el);
            window.dataLayer.push({
                event: "formulaire_contact_succes",
                element_name: e.getAll("interest[]").join(", "),
                element_detail: e.get("project")
            })
        }
    }
    errorForm(t) {
        this.setCallback(t.message, t.success), this.state = !1, this.setRecaptcha(), this.enableForm(), t.invalid && this.setErrors(t.invalid)
    }
    setErrors(t) {
        this.errors = t;
        const e = Array.from(Object.entries(t)),
            i = [];
        e.forEach(([n, s]) => {
            const o = this.$(n)[0];
            if (o) {
                const l = document.createElement("p");
                l.innerHTML = Array.isArray(s) ? s.join(", ") : s, o.classList.add("-error"), l.setAttribute("class", "a-pxsmall a-inputField__error"), l.setAttribute(this.mAttr, "invalid"), i.push({
                    el: o,
                    errorEl: l
                })
            }
        }), window.requestAnimationFrame(() => {
            i.forEach(({
                el: n,
                errorEl: s
            }) => {
                n.append(s)
            })
        })
    }
    enableForm() {
        window.requestAnimationFrame(() => {
            this.$("submit")[0].removeAttribute("aria-disabled", "false")
        }), this.disabledSubmit = !1, this.loading = !1
    }
    resetInput() {
        this.el.querySelectorAll("input, textarea, select").forEach(e => {
            if (e.type !== "hidden") {
                if (e.type === "radio" || e.type === "checkbox") {
                    e.checked = !1;
                    return
                }
                e.value = ""
            }
        })
    }
    checkDiscoverInputs() {
        const t = this.$("discover-checkbox");
        let e = !1;
        for (let i = 0; i < t.length; i += 1) t[i].checked === !0 && (e = !0);
        return e
    }
}
```

### 7.4 Info cards (`ul.o-contactInformations`)
Three `li.o-contactInformations__item`: **`padding 5rem`, bg `#fafafa`, no radius, no border** → 332.9 × 180. `h3.tx-pxlarge` **20px / 26**, weight 400, `margin-bottom 1.8rem` ("Phone number", "E-mail", "Address"); body `tx-pxsmall` **12px / 18** — "contact: +33 3 88 24 92 24" (tel link), "commercial@aquatique-show.com" (mailto), "1 rue Jean-Jacques Rousseau <br> 67000 Strasbourg - France" (Google Maps link, new tab). Links are plain (inherit navy, no underline). `.o-contactInformations__wrapper` is a grid with gap 1rem. 390: stacked, 362 × 162, gap 2rem.

### 7.5 390
Title 30px/3 lines; fields 362 × 58 at x 14 (label → input step 118); right panel starts 40px under the left; option rows wrap with 1rem gaps ("Water show" / "Water effect" on one row); consent text 316 wide (305 tall); submit centred 221 wide; cards stacked. Frames `m390_contact_00_hero.png`, `m390_contact_01_form_top.png`, `m390_contact_02_rgpd_submit.png`, `m390_contact_03_info_cards.png`, `m390_contact_checked_states.png`, `m390_contact_empty_submit_native_validation.png`, `m390_contact_error_state_simulated_fields.png`, `m390_contact_error_state_simulated_submit.png`, `m390_contact_submit_sending_simulated.png`, `m390_contact_submit_success_simulated.png`.

Desktop frames: `contact_00_hero.png`, `contact_01_form_top.png`, `contact_02_rgpd_submit.png`, `contact_03_info_cards.png`, `contact_checked_states.png`, `contact_empty_submit_native_validation.png`, `contact_error_state_simulated_fields.png`, `contact_error_state_simulated_submit.png`, `contact_focus_typing.png`, `contact_submit_hover.png`, `contact_submit_sending_simulated.png`, `contact_submit_success_simulated.png`

---

## 8. `/en/faq` accordion (and `/en/news`, brief)

### 8.1 FAQ page
Plain hero (760) with the category chooser (1.5) → `div.-bgwhite.-clrnavy > div.tr-content > .row[data-scroll-call=toggleDarkUi, offset 35%,10%] > .column-16.lg-column-10.lg-offset-3.o-faqList` → `div.b-push.-faq` → breadcrumb → footer. Height 3267 / 3897.

- `.o-faqList`: **w 62.5% (865.6), x 279.7**, `padding 8rem 0 7.2rem` (`5.6rem 0 4.8rem`); `h2.o-faqList__title.tx-h4` 40px/44 **600**, mb 5.2rem (3.2rem).
- 8 × `article.m-accordeon[data-module-accordeon]`:

```html
<article class="m-accordeon" data-module-accordeon="faq-0">
  <div class="m-accordeon__entete" data-accordeon="entete">
    <button class="m-accordeon__button" data-accordeon="button" aria-expanded="false" aria-controls="accordeon-faq-0" data-open="Ouvrir" data-close="Fermer">Ouvrir</button>
    <h3 class="m-accordeon__title tx-pxxlarge">Is Aquatique Show's equipment for rent or for sale?</h3>
    <div class="m-accordeon__icon"></div>
  </div>
  <div id="accordeon-faq-0" class="m-accordeon__scroll" data-accordeon="scroll" aria-hidden="true">
    <div class="m-accordeon__content m-textContent" data-accordeon="content"><p>…</p></div>
  </div>
</article>
```

| part | value |
|---|---|
| row (`__entete`) | flex, space-between, **`padding 3.2rem 0`**, **`border-top 1px #CBCBCB`** → 97 tall for one line (143 for three lines at 390) |
| click target | `button.m-accordeon__button` absolute over the whole row, `opacity 0`, z 1 (its text toggles "Ouvrir"/"Fermer" for screen readers); cursor pointer (`[aria-controls]`) |
| question | `h3.tx-pxxlarge` **24px / 26**, weight 400, navy |
| icon | **3.2rem circle**, `border .2rem solid var(--color)` with `--color #4F4F4F`, `margin-left 5.8rem`; two bars **.9rem × .2rem** centred (`::before` rotated 90° = the vertical stroke) |
| open (`.-open` on the row) | row colour **gold `#C79D47`** (question text) and `--color` gold (ring + bars) — **instant** (no colour transition); `::before` rotate 90° → 0 and `::after` 0 → −180° (**.4s ease-quint**) → "+" becomes "−" |
| panel | `.m-accordeon__scroll` `overflow:hidden; height:0; transition: height var(--atransition) ease-in-out` → `height: var(--heightscroll)` (= `scrollHeight`, set inline on open, 0 on close). On this page `--atransition` stays at its CSS default **.3s** (the module's `initModule` that would set `clamp(h/600, .7, 3)s` is not run for these items). Measured 0 → 28px at 120ms → 78px at 340ms. |
| content | `.m-accordeon__content.m-textContent`: `padding 0 0 3rem`, colour **#4f4f4f**, p 16/24 at **w 80%** (≥1025) |
| one at a time | opening an item first calls `change(false)` on every Accordeon → the previously open one collapses simultaneously (measured) |
| hover | no hover style on the row |

```css
/* site.pretty.css L2209-2300 */
.m-accordeon {
  width:100%;
}
.m-accordeon__entete {
  position:relative;
  display:flex;
  flex-flow:row nowrap;
  justify-content:space-between;
  width:100%;
  padding:3.2rem 0;
  border-top:.1rem solid #CBCBCB;
  color:currentcolor;
}
.m-accordeon__entete.-open {
  color:#c79d47;
}
.m-accordeon__icon {
  --color: #4F4F4F;
  position:relative;
  flex-shrink:0;
  width:3.2rem;
  height:3.2rem;
  margin-left:5.8rem;
  border:solid .2rem var(--color);
  border-radius:50%;
}
.m-accordeon__icon:before,.m-accordeon__icon:after {
  content:"";
  position:absolute;
  top:50%;
  left:50%;
  width:.9rem;
  height:.2rem;
  background-color:var(--color);
  transition:transform .4s cubic-bezier(.23,1,.32,1);
  transform:translate(-50%,-50%);
}
.m-accordeon__icon:before {
  transform:translate(-50%,-50%) rotate(90deg);
}
.m-accordeon__icon:after {
  transform:translate(-50%,-50%) rotate(0);
}
.-open .m-accordeon__icon {
  --color: #C79D47;
}
.-open .m-accordeon__icon:before {
  transform:translate(-50%,-50%) rotate(0);
}
.-open .m-accordeon__icon:after {
  transform:translate(-50%,-50%) rotate(-180deg);
}
.m-accordeon__button {
  position:absolute;
  top:0;
  left:0;
  z-index:1;
  width:100%;
  height:100%;
  border:0;
  opacity:0;
}
.m-accordeon__right {
  flex-shrink:0;
  margin-left:2rem;
}
.m-accordeon__scroll {
  --heightscroll: 0;
  --atransition: .3s;
  overflow:hidden;
  height:0;
  transition:height var(--atransition) ease-in-out;
}
.m-accordeon__scroll[aria-hidden=false] {
  height:var(--heightscroll);
}
.m-accordeon__content {
  padding:0 0 var(--vr) 0;
}
@media only screen and (min-width: 1025px) {
  .m-accordeon__content>p {
    width:80%;
  }
}
.m-accordeon .b-twoColumns {
  gap:3.2rem;
}
@media only screen and (min-width: 1025px) {
  .m-accordeon .b-twoColumns {
    gap:2rem;
  }
}
```
```css
/* site.pretty.css L5598-5619 */
.o-faqList {
  padding-top:5.6rem;
  padding-bottom:4.8rem;
}
.o-faqList__title {
  margin-bottom:3.2rem;
  font-weight:600;
}
@media only screen and (min-width: 1025px) {
  .o-faqList__title {
    margin-bottom:5.2rem;
  }
}
.o-faqList .m-accordeon__content {
  color:#4f4f4f;
}
@media only screen and (min-width: 1025px) {
  .o-faqList {
    padding-top:8rem;
    padding-bottom:7.2rem;
  }
}
```
```js
/* site.pretty.js L6774-6813 */
class Qn extends j {
    constructor(t) {
        super(t), this.initialized = !1, this.config = {
            duration: 1,
            height: 0
        }, this.events = {
            click: {
                button: "toggle"
            }
        }
    }
    resize() {
        if (!this.initialized) return;
        const [t] = this.$("content"), [e] = this.$("scroll");
        this.config.height = t.offsetHeight;
        let i = this.config.height * 1 / 600;
        i = Math.min(Math.max(i, .7), 3), this.config.duration = i, this.config.height = e.scrollHeight, window.requestAnimationFrame(() => {
            e.style.setProperty("--atransition", `${this.config.duration}s`), e.style.setProperty("--heightscroll", `${this.config.height}px`)
        })
    }
    toggle() {
        const t = this.state;
        this.call("change", !1, "Accordeon"), this.change(!t)
    }
    change(t) {
        if (this.state === t) return;
        this.state = t;
        const [e] = this.$("scroll"), [i] = this.$("button");
        let n = 0;
        i.setAttribute("aria-expanded", this.state), e.setAttribute("aria-hidden", !this.state), this.state && (n = e.scrollHeight);
        const [s] = this.$("entete");
        s && s.classList.toggle("-open", this.state), this.updateButton(i), e.style.setProperty("--heightscroll", `${n}px`)
    }
    updateButton(t) {
        this.state ? t.innerText = t.dataset.close : t.innerText = t.dataset.open
    }
    initModule() {
        this.initialized || (this.initialized = !0, this.resize())
    }
}
```

`div.b-push.-faq` ("Another question ?"): `padding-bottom 5.6rem` (4.5rem); `.b-push__single` (same 62.5% column) `bg #0c0a09`, radius 10, **`padding 10.6rem 9rem 8rem`** (`16rem 4rem 13.4rem`), flex centre, `overflow:hidden`; background `<video class="-cover b-push__cover">` (played in view) under `::before` = `linear-gradient(#00000080,#00000080), linear-gradient(0deg,#0009 22.85%,#0000 38.22%)`; content z 2, centred: `h4.tx-h3.b-push__title` 60px **600**, mb 2.4rem; gold uppercase button (`-primary -bggold -clrwhite -txupp tx-uni11`) mt 2.4rem → 865.6 × 339.6.

```css
/* site.pretty.css L3659-3755 */
.b-push {
  overflow:hidden;
  width:100%;
}
.b-push.-faq {
  padding-bottom:4.5rem;
}
.b-push.-faq .b-push__content {
  max-width:none;
}
.b-push.-faq .b-push__single {
  padding:16rem 4rem 13.4rem;
}
@media only screen and (min-width: 1025px) {
  .b-push.-faq .b-push__single {
    padding:10.6rem 9rem 8rem;
  }
}
@media only screen and (min-width: 1025px) {
  .b-push.-faq {
    padding-bottom:5.6rem;
  }
}
.b-push.-border .row {
  padding-top:4.4rem;
}
.b-push.-border .row:before {
  content:"";
  position:relative;
  position:absolute;
  top:0;
  left:50%;
  width:calc(100% - 4rem);
  height:.1rem;
  background-color:#cbcbcb;
  transform:translate(-50%);
}
@media only screen and (min-width: 1025px) {
  .b-push.-border .row {
    padding-top:8.2rem;
  }
}
.b-push__suptitle {
  margin-bottom:3.2rem;
}
@media only screen and (min-width: 1025px) {
  .b-push__suptitle {
    margin-bottom:4.8rem;
  }
}
.b-push__title {
  margin-bottom:3.2rem;
  font-weight:600;
}
@media only screen and (min-width: 1025px) {
  .b-push__title {
    margin-bottom:2.4rem;
  }
}
.b-push__single {
  position:relative;
  padding:20rem 4rem 14.5rem;
  background-color:#0c0a09;
  color:#fff;
}
.b-push__single:before {
  content:"";
  position:absolute;
  top:0;
  left:0;
  z-index:1;
  width:100%;
  height:100%;
  background:linear-gradient(0deg,#00000080,#00000080),linear-gradient(0deg,#0009 22.85%,#0000 38.22%);
}
@media only screen and (min-width: 1025px) {
  .b-push__single {
    padding:19rem 4rem;
  }
}
.b-push__cover {
  z-index:0;
  -o-object-fit:cover;
  object-fit:cover;
}
.b-push__button {
  margin-top:2.4rem;
}
.b-push__content {
  position:relative;
  z-index:2;
}
@media only screen and (min-width: 1025px) {
  .b-push__content {
    max-width:57.1428571429%;
  }
}
```

FAQ category links use the **`faq` Barba transition** (not the panel wipe): the hero is kept (old hero reused, title text swapped), `.tr-content` fades `opacity 1 → 0` (**600ms easeInOutCubic**), the new content fades `0 → 1` (600ms), then the page scrolls to `.tr-content` after 400ms.

```js
/* site.pretty.js L3467-3542 */
    Za = {
        after() {},
        afterEnter({
            next: r
        }) {
            this.call("update", r.container, "app"), setTimeout(() => {
                const t = r.container.querySelector(".tr-content");
                this.call("scrollTo", {
                    target: t
                }, "Scroll", "scroll")
            }, 400)
        },
        afterLeave() {},
        before() {},
        beforeEnter({
            current: r,
            next: t
        }) {
            this.call("destroy", r.container, "app"), r.container.remove();
            const e = t.container.querySelector(".tr-hero"),
                i = e.querySelector(".tr-list"),
                n = e.querySelector(".js-title");
            console.log(n);
            const s = r.container.querySelector(".tr-hero"),
                o = s.querySelector(".tr-list"),
                l = r.container.querySelector(".tr-title"),
                a = l.querySelector(".js-title");
            a.innerHTML = n.innerHTML, l.classList.add("-static"), e.parentNode.insertBefore(s, e), s.insertBefore(i, o), e.remove(), o.remove(), t.container.querySelector("[data-module-scroll]").setAttribute("data-prevent-reset", "")
        },
        beforeLeave() {},
        enter({
            next: r
        }) {
            const t = r.container.querySelector(".tr-content");
            return q({
                targets: t,
                opacity: [0, 1],
                easing: "easeInOutCubic",
                duration: 600
            }).finished
        },
        init(r, t) {
            this.call = r, this.config = t
        },
        custom: ({
            trigger: r
        }) => {
            if (!r.dataset) return !1;
            const {
                transition: t
            } = r.dataset;
            return t === "faq"
        },
        invoke() {
            return {
                afterEnter: this.afterEnter.bind(this),
                beforeEnter: this.beforeEnter.bind(this),
                enter: this.enter.bind(this),
                init: this.init.bind(this),
                custom: this.custom.bind(this),
                leave: this.leave.bind(this),
                name: "faq"
            }
        },
        leave({
            current: r
        }) {
            const t = r.container.querySelector(".tr-content");
            return q({
                targets: t,
                opacity: 0,
                easing: "easeInOutCubic",
                duration: 600
            }).finished
        }
    }.invoke(),
```

Frames: `faq_00_hero.png`, `faq_01_list_closed.png`, `faq_02_push.png`, `faq_open_0126ms.png`, `faq_open_0452ms.png`, `faq_open_1197ms.png`, `m390_faq_00_hero.png`, `m390_faq_01_list_closed.png`, `m390_faq_02_push.png`, `m390_faq_open_0119ms.png`, `m390_faq_open_0416ms.png`, `m390_faq_open_1133ms.png`

### 8.2 News list (`/en/news`) — brief
- Plain hero 784 (title 2 lines + one-line paragraph directly under it), footer at 3018; 4028 total.
- `div.o-blogList.-bgwhite` (`ShowMore` module, dark-UI trigger offset 25%): **`padding 10.7rem 0 7rem`** (`4.6rem 0 5.2rem`), `position:relative`.
- `ul.o-blogList__grid` in `column-16 lg-column-12 lg-offset-2` (x 193.1, w 1038.75): grid **3 × 332.9 (2 from 641, 1 below), gap 2rem**.
- `a.m-blogItem.-radius`: **`aspect-ratio 347/470`** → 332.9 × 450.9, bg navy, radius 10, white text.
  - image `figure.a-image.-cover.m-blogItem__image` z 1 (`transition: transform 1.2s ease-quint`);
  - `::before` z 2 `linear-gradient(0deg, #000000b8 35%, #0000 85%)`, opacity 1 (.4s ease-quint);
  - `.m-blogItem__upper` z 3: flex column, bottom-aligned, gap 1.6rem, `padding 2.2rem 3.2rem`; `h2.tx-pxxlarge.-tx600` 24/26 **600**; `p.tx-pxsmall` 12/18 (4 lines);
  - `.m-blogItem__lower` z 3: flex space-between, `padding 1.6rem 3.2rem`, `border-top 1px rgba(255,255,255,.2)`; date `span.tx-ctasmall.-tx500` 11px 600 ("19.02.2026"); `arrow-right` 2.1rem.
  - hover: overlay `opacity .8`, image `scale(1.05)` (1.2s ease-quint), arrow `translate(25%)` (.4s). Frame `news_card_hover.png`.
- "More news": `a-button -outline` centred, `margin-top 7rem` (4.2rem). Click → `.o-blogList.-loading` shows `.o-blogList__loading` (absolute full overlay `rgba(0,40,77,.4)`, `cursor: wait`, z 3) until the JSON arrives; items appended; the button gets `.-hidden` (global `display:none !important`) when `more` is false (measured: 10 items, nothing more → button hidden after ≈0.45s). Frame `news_moreclick_loading.png`.

```css
/* site.pretty.css L2341-2414 */
.m-blogItem {
  position:relative;
  display:block;
  background-color:#00284d;
  aspect-ratio:347/470;
}
.m-blogItem:before {
  content:"";
  position:absolute;
  top:0;
  left:0;
  z-index:2;
  width:100%;
  height:100%;
  background:linear-gradient(0deg,#000000b8 35%,#0000 85%);
  opacity:1;
  transition:opacity .4s cubic-bezier(.23,1,.32,1);
}
.m-blogItem__image {
  z-index:1;
  transition:transform 1.2s cubic-bezier(.23,1,.32,1);
}
.m-blogItem__content {
  display:flex;
  flex-direction:column;
  justify-content:flex-end;
  width:100%;
  height:100%;
}
.m-blogItem__upper {
  position:relative;
  z-index:3;
  display:flex;
  flex-grow:1;
  flex-direction:column;
  gap:1.6rem;
  justify-content:flex-end;
  padding:2.2rem 3.2rem;
  pointer-events:none;
}
.m-blogItem__lower {
  position:relative;
  z-index:3;
  display:flex;
  flex-direction:row;
  align-items:center;
  justify-content:space-between;
  padding:1.6rem 3.2rem;
  border-top:solid .1rem rgba(255,255,255,.2);
  pointer-events:none;
}
.m-blogItem__lower .a-svg {
  width:2.1rem;
  height:2.1rem;
  transition:transform .4s cubic-bezier(.23,1,.32,1);
  transform:translate(0);
}
.m-blogItem__lower .a-video {
  z-index:-1;
}
@media (hover: hover) and (any-pointer: fine) {
  .m-blogItem:hover:before {
    opacity:.8;
  }
  .m-blogItem:hover .m-blogItem__image {
    transform:scale(1.05);
  }
  .m-blogItem:hover.-video .m-blogItem__image {
    opacity:0;
  }
  .m-blogItem:hover .a-svg {
    transform:translate(25%);
  }
}
```
```css
/* site.pretty.css L4957-5009 */
.o-blogList {
  position:relative;
  padding-top:4.6rem;
  padding-bottom:5.2rem;
}
.o-blogList__grid {
  display:grid;
  grid-template-columns:1fr;
  gap:2rem;
}
@media only screen and (min-width: 641px) {
  .o-blogList__grid {
    grid-template-columns:repeat(2,1fr);
  }
}
@media only screen and (min-width: 1025px) {
  .o-blogList__grid {
    grid-template-columns:repeat(3,1fr);
  }
}
.o-blogList__buttonWrapper {
  display:flex;
  justify-content:center;
  width:100%;
}
.o-blogList__buttonWrapper .a-button {
  margin-top:4.2rem;
}
@media only screen and (min-width: 1025px) {
  .o-blogList__buttonWrapper .a-button {
    margin-top:7rem;
  }
}
.o-blogList__loading {
  position:absolute;
  top:0;
  left:0;
  z-index:3;
  display:none;
  width:100%;
  height:100%;
  background-color:#00284d66;
  cursor:wait;
}
.o-blogList.-loading .o-blogList__loading {
  display:block;
}
@media only screen and (min-width: 1025px) {
  .o-blogList {
    padding-top:10.7rem;
    padding-bottom:7rem;
  }
}
```
```js
/* site.pretty.js L8547-8583 */
class Nc extends j {
    constructor(t) {
        super(t), this.page = 1, this.updating = !1, this.paginate = this.el.dataset.paginate !== void 0, this.events = {
            click: {
                more: "displayMore"
            }
        }
    }
    onClick(t) {
        t.preventDefault(), this.displayMore()
    }
    displayMore() {
        this.updating || (this.page += 1, this.updating = !0, this.el.classList.add("-loading"), this.queryItems())
    }
    getAction() {
        return `${this.el.dataset.url}?page=${this.page}`
    }
    async queryItems() {
        return fetch(this.getAction(), {
            method: "GET",
            headers: {
                "Cache-Control": "no-cache",
                "Content-Type": "multipart/form-data",
                "X-Requested-With": "fetch"
            }
        }).then(this.afterUpdate.bind(this)).catch(this.onError.bind(this))
    }
    async afterUpdate(t) {
        const e = await t.json(),
            [i] = this.$("content"),
            [n] = this.$("more");
        i.innerHTML += e.content, n && n.classList.toggle("-hidden", !e.more), this.call("updateLazy", null, "Website", "website"), this.updating = !1, this.el.classList.remove("-loading")
    }
    onError(t) {
        console.warn(t)
    }
}
```

Frames: `m390_news_00_hero.png`, `m390_news_01_grid.png`, `m390_news_02_after_more.png`, `news_00_hero.png`, `news_01_grid.png`, `news_02_after_more.png`, `news_card_hover.png`, `news_moreclick_loading.png`

---

## 9. Page transition (Barba 2.10.3) and first load

### 9.1 Elements
```html
<body data-barba="wrapper" data-module-website="website" data-animate>
  … header (fixed, z 20), side rail (fixed, z 19), menu (fixed, z 1) …
  <main class="t-universe t-page" data-barba="container" data-barba-namespace="universe" data-urls='{"en":…,"fr":…}'>…</main>
  <div class="a-panel -top js-panel"></div>      <!-- navy #00284d, z 11 -->
  <div class="a-panel -bottom js-panel"></div>   <!-- gold #c79d47, z 12 -->
  <div id="js-loader" class="a-loader">…</div>   <!-- first load only -->
</body>
```
Both panels are `position:fixed; top:101vh; left:0; width:100%; height:100%` — parked 1vh below the viewport (this is the gold rectangle that leaks into full-page screenshots). `.t-page` is `position:relative; z-index:10; background:#00284d`.

```css
/* site.pretty.css L250-265 */
.a-panel {
  position:fixed;
  top:101vh;
  left:0;
  z-index:0;
  width:100%;
  height:100%;
}
.a-panel.-top {
  z-index:11;
  background-color:#00284d;
}
.a-panel.-bottom {
  z-index:12;
  background-color:#c79d47;
}
```

### 9.2 "basic" transition (every normal link, e.g. universe → contact)
Timeline measured with a rAF logger (`ref3/work/transition*.json`; 1425×900):

| t (ms) | what happens |
|---|---|
| click | Barba intercepts the link. **Leave has no animation**: the old page stays exactly where it is (even when scrolled — it stayed at `top −5699`). `beforeLeave` → `Website.toggleDarkUi(leave)` (body `-dark` off) and `html.is-loading` (`pointer-events:none`, `cursor:progress`). `afterLeave` closes the full-screen menu without its page animation. |
| +fetch (237–790ms measured) | **`beforeEnter`**: the new `<main>` is appended with inline style `position: fixed; top: 100%; left: 0; width: 100%; z-index: 13; height: 100%; overflow: hidden;` (so it is a viewport-sized window showing the top of the new page). Its `.js-hero` will get `is-inview` in 500ms and its Title instance is created in 700ms. Inline videos with `data-responsive` get their mobile/desktop `src`. |
| T = insert | **`enter`**: one anime.js timeline, **`easing: easeOutQuint`, `duration: 1400`**, targets `[navy panel, gold panel, new container]`, **`translateY: [0, '-100%']`**, **`delay: stagger(150)`** → navy starts at T, gold at T+150, page at T+300. |
| T+105 | navy top 621 (it rises from 909), gold 909, page 900 |
| T+209 | navy 411, gold 737, page 900 |
| T+314 | navy 264, gold 495, page 861 |
| T+417 | navy 163, gold 322, page 583 |
| T+522 | navy 97, gold 202, page 381 — hero gets `is-inview` (≈T+520): title block `enter-y`, tags `enter-popin-up` (1s delay) |
| T+627 | navy 56, gold 122, page 240 |
| T+730 | navy 32, gold 71, page 144 — Title module starts: lines at `translateY(77.8px)` (120%) → 0, 2000ms easeOutExpo |
| T+834 / 939 / 1043 | 19/41/82 · 13/23/43 · 10/15/21 |
| T+1147 … T+1400 | navy parks at **top 9px** (101vh − 100%), gold reaches 9px at ≈T+1550, page reaches 0 at ≈T+1700 |
| T+1700 | **`afterEnter`**: old container's modules destroyed and the node removed; next frame the new container's inline style and both panels' inline transforms are removed (panels snap back to `top:101vh`, hidden under nothing — they are offscreen); 30ms later modules are initialised on the new page. Then **`after`**: `html.is-loaded` (loading off), header URLs/menu state updated, lazyload update after 200ms, `window.scrollTo(0,0)` (skipped only when the trigger is the string `"barba"`, e.g. history back/forward). |

Visual summary: a flat **navy sheet** slides up over the old page, a **gold sheet** follows 150ms behind it, and the **new page slides up over both** 150ms later; all three decelerate hard (easeOutQuint), so ~75% of the travel happens in the first 450ms of each. Header and side rail stay on top throughout (z 20/19). No opacity changes, no scaling, no clip-paths. Frames `transition_*ms.png` (from the header "Contact us" click, top of page) and `transition_scrolled_after_insert_*ms.png` (from the "Contact us" button at scrollY 5699; t counted from insertion).

```js
/* site.pretty.js L3376-3466 */
const Ja = {
        after({
            trigger: r
        }) {
            r !== "barba" && window.scrollTo(0, 0)
        },
        afterOnce() {
            this.call("setCurrentLink", null, "Menu", "menu");
            const r = this.container.querySelector("video"),
                t = q.timeline({
                    pause: !0,
                    easing: "easeOutCubic",
                    duration: 2500
                });
            return t.add({
                targets: this.container,
                translateY: ["-100%", "0%"],
                complete: () => {
                    r.pause(), r.remove(), this.container.remove()
                }
            }), r.onloadedmetadata = () => {
                t.play(), r.play()
            }, t.finished
        },
        afterEnter({
            current: r,
            next: t
        }) {
            this.call("destroy", r.container, "app"), window.requestAnimationFrame(() => {
                r.container.remove(), window.requestAnimationFrame(() => {
                    t.container.removeAttribute("style"), this.panels.forEach(e => {
                        e.removeAttribute("style")
                    }), setTimeout(() => {
                        this.call("update", t.container, "app")
                    }, 30)
                })
            })
        },
        beforeEnter({
            next: r
        }) {
            const {
                container: t
            } = r;
            t.setAttribute("style", "position: fixed; top: 100%; left: 0; width: 100%; z-index: 13; height: 100%; overflow: hidden;");
            const e = t.querySelector(".js-title"),
                i = t.querySelector(".js-hero");
            !e || !i || (e.removeAttribute("data-module-title"), setTimeout(() => {
                i.classList.add("is-inview")
            }, 500), setTimeout(() => {
                this.titleInstance = new Vn({
                    dataName: "title",
                    el: e
                })
            }, 700))
        },
        enter({
            next: r
        }) {
            const {
                container: t
            } = r, e = q.timeline({
                easing: "easeOutQuint",
                duration: 1400
            });
            return e.add({
                targets: [...this.panels, t],
                translateY: [0, "-100%"],
                delay: q.stagger(150)
            }), e.finished
        },
        init(r, t) {
            this.container = document.querySelector("#js-loader"), this.panels = document.querySelectorAll(".js-panel"), this.call = r, this.config = t
        },
        invoke() {
            return {
                after: this.after.bind(this),
                afterEnter: this.afterEnter.bind(this),
                beforeEnter: this.beforeEnter.bind(this),
                enter: this.enter.bind(this),
                init: this.init.bind(this),
                name: "basic",
                once: this.once.bind(this)
            }
        },
        once(r) {
            this.afterOnce(r).then(() => {
                this.call("after", r, "Website", "website")
            })
        }
    }.invoke(),
```
```js
/* site.pretty.js L3622-3650 */
class ol extends j {
    constructor(t) {
        super(t), this.updateModules = !1, this.toAnimate = this.el.dataset.animate !== void 0, this.isAnimating = !1, this.interval = null, this.isDark = !1, this.size = {
            width: 0,
            height: 0
        }, this.animate = this.animate.bind(this), this.debounceResize = wa(this.resize.bind(this, !1), 600), dt.hooks.afterLeave(this.afterLeave.bind(this)), dt.hooks.afterEnter(this.afterEnter.bind(this)), dt.hooks.enter(this.enter.bind(this)), dt.hooks.once(this.once.bind(this)), dt.hooks.afterOnce(this.afterOnce.bind(this)), dt.hooks.after(this.after.bind(this)), dt.hooks.beforeLeave(this.beforeLeave.bind(this)), dt.hooks.beforeEnter(this.beforeEnter.bind(this))
    }
    beforeEnter({
        next: t
    }) {
        Array.from(t.container.querySelectorAll("[data-module-inline-video]")).forEach(i => {
            i.dataset.responsive !== void 0 && (i.src = window.innerWidth < 768 ? i.dataset.mobile : i.dataset.desktop)
        })
    }
    init() {
        const t = {
            debug: Zt,
            transitions: this.initConfigArray(tl),
            views: this.initConfigArray(nl)
        };
        Zt && (t.logLevel = "info"), t.timeout = 1e4, dt.init(t)
    }
    setStats() {
        this.stats = new ho, this.stats.showPanel(0), this.stats.dom.style.top = "auto", this.stats.dom.style.left = "auto", this.stats.dom.style.right = "0", this.stats.dom.style.bottom = "0", ut.appendChild(this.stats.dom)
    }
    once() {
        this.lazy = new ie({
            elements_selector: "[data-lazy]",
            class_loaded: "-loaded",
```
```js
/* site.pretty.js L3673-3728 */
    after({
        next: t,
        trigger: e
    }) {
        if (this.resize(!0), this.toggleLoad(!1), e === "barba") return;
        this.call("updateUrls", t.container.dataset.urls, "Header", "header");
        const i = t.container.querySelector(".js-title");
        window.dataLayer.push({
            event: "TPV",
            pagevuevirtuelle: t.url.path,
            pagetitle: i.innerText
        }), this.call("resetScrollY", null, "Menu", "menu"), this.call("setCurrentLink", null, "Menu", "menu"), document.querySelector(".t-referencesindex") && this.call("toggleHeaderVisibility", !1, "Header", "header"), setTimeout(() => {
            this.updateLazy()
        }, 200)
    }
    beforeLeave() {
        this.toggleDarkUi({
            way: "leave",
            target: null
        }), this.toggleLoad(!0)
    }
    afterLeave() {
        this.call("leaveTransition", null, "Menu", "menu"), this.updateModules = !1
    }
    enter() {}
    updateLazy() {
        this.lazy.update()
    }
    setDarkUi(t) {
        this.isDark = t, window.requestAnimationFrame(() => {
            ut.classList[t ? "add" : "remove"]("-dark")
        })
    }
    toggleDarkUi({
        way: t,
        target: e
    }) {
        const i = e ? e.classList.contains("-bgnavy") : !1;
        let n = !1;
        t === "enter" && (n = !0), i && (n = !n), this.setDarkUi(n)
    }
    loadImage({
        item: t,
        config: e = {}
    }) {
        t.dataset.llStatus !== "loaded" && ie.load(t, e)
    }
    afterEnter() {
        this.updateModules = !0
    }
    toggleLoad(t) {
        window.requestAnimationFrame(() => {
            ve.classList[t ? "remove" : "add"]("is-loaded"), ve.classList[t ? "add" : "remove"]("is-loading")
        }), this.isAnimating = !t
    }
    parseModulesFunctions(t, e = null) {
```

Rebuild recipe (vanilla): on link click `fetch` the page, parse its `<main>`, append it with the inline style above, then
```js
const ease = t => 1 - Math.pow(1 - t, 5);            // easeOutQuint
[navy, gold, next].forEach((el, i) => el.animate(
  [{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }],
  { duration: 1400, delay: i * 150, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'forwards' }));
// after 1700ms: remove old <main>, clear inline styles on next + panels, scrollTo(0,0), init modules
```
(`cubic-bezier(.23,1,.32,1)` is the CSS stand-in for easeOutQuint used everywhere else on the site.)

### 9.3 First load of an inner page (the white smoke loader)
**Yes — it plays on every full page load**, not only on the homepage: `#js-loader` is in the shared layout and Barba's `once` hook runs `afterOnce` (homepage spec 4/14): the loader (`position:fixed; top:100%; transform: translateY(-100%)`, z 99999, `mix-blend-mode: screen`; white smoke strip + 100vh white panel + 35vh white gradient above it) animates `translateY(-100%) → 0%` over **2500ms easeOutCubic**, starting when `smoke.mp4` metadata is loaded, then removes itself.
Measured on a cold load of `/en/contact`: loader height 1050 until the video metadata arrived, then 1529; `translateY` −1529 at t≈1.78s → −1288 (+0.2s) → −976 (+0.42s) → −610 (+0.73s) → −349 (+1.04s) → −100 (+1.57s) → −11 (+2.09s) → removed at ≈4.4s (`html.is-loaded`). The hero title animated during the wipe: block 192 → 0px and lines 81.6 → 0px, both starting at t≈1.89s (2s). On `/en/our-references` the loader wipes over the dark title while the cards cascade in (6.5). Frames `firstload_contact_*ms.png`, `references_load_*ms.png`.

### 9.4 Other transition: `faq`
Only for FAQ category links (`data-transition="faq"`): see 8.1.

---

## 10. Shared inner-page pieces

### 10.1 Breadcrumb bar (`.o-breadcrumb`)
Sits between the last content block and the prefooter/footer on every inner page.

```html
<div class="o-breadcrumb [-revert]">
  <div class="row">
    <ol class="column-22 offset-1 no-width" itemscope itemtype="https://schema.org/BreadcrumbList">
      <li itemprop="itemListElement" …><a href="/en" class="tx-cta" itemprop="item"><span itemprop="name">Home</span></a><meta itemprop="position" content="1"></li>
      <li …><a href="/en/our-universe" class="tx-cta" aria-current="page" itemprop="item"><span itemprop="name">Our universe</span></a>…</li>
    </ol>
  </div>
</div>
```

| variant | where | bg | border-top | text | link hover |
|---|---|---|---|---|---|
| default | services, expertise, contact, faq, news | `#fff` | `1px #ececec` | `#a8a8a8` | none |
| `-revert` | universe (after the navy team section) | `#00284d` | `1px #344759` | `#536677` | `#fff` |
| after `.o-referenceGrid` | references | `#000d1a` | `1px #ececec` | `#a8a8a8` | none |
| `-transparent` | (other templates) | transparent, no border | – | inherit | `#fff` |

Geometry (all widths): `padding 3rem 0` → **77.8 tall**. `ol` = `column-22 offset-1` (22 is not a grid class, so only the generic `width:100%` applies; `offset-1` = 6.25% → **x 106.6** at 1425, x 36.6 at 390), flex wrap, **gap 3rem**, centred. Links `tx-cta` **14px / 16.8, −0.14px, weight 400**. Separator: `li:not(:last-child)::after { content:"/" }` absolute at `left: calc(100% + 1.5rem)`, `translate(-50%,-50%)`, 14px Matter, inherits the colour. The current page (`aria-current`) is not styled differently. Frames `universe_23_breadcrumb_prefooter.png`, `references_02_end.png`.

```css
/* site.pretty.css L5010-5053 */
.o-breadcrumb {
  padding:3rem 0;
  border-top:1px solid #ececec;
  background-color:#fff;
  color:#a8a8a8;
}
.o-breadcrumb ol {
  display:flex;
  flex-flow:row wrap;
  gap:3rem;
  align-items:center;
}
.o-breadcrumb ol li {
  position:relative;
}
.o-breadcrumb ol li:not(:last-child):after {
  content:"/";
  position:absolute;
  top:50%;
  left:calc(100% + 1.5rem);
  color:inherit;
  font-size:1.4rem;
  font-family:Matter,Helvetica,Arial,sans-serif;
  transform:translate(-50%,-50%);
}
.o-breadcrumb.-revert {
  border-color:#344759;
  background-color:#00284d;
  color:#536677;
}
@media (hover: hover) and (any-pointer: fine) {
  .o-breadcrumb.-revert ol a:hover,.o-breadcrumb.-revert ol a.-hover {
    color:#fff;
  }
}
.o-breadcrumb.-transparent {
  border:0;
  background-color:transparent;
}
@media (hover: hover) and (any-pointer: fine) {
  .o-breadcrumb.-transparent ol a:hover,.o-breadcrumb.-transparent ol a.-hover {
    color:#fff;
  }
}
```

### 10.2 Cloud transitions (`.a-cloud`)
One static PNG (`/assets/images/white-cloud.png`, 2690×380, white smoke on transparent) used four ways:

| class | used on | behaviour |
|---|---|---|
| `.a-cloud` | `-cloud` heroes; bottom of `o-universeVision`; `-bottom` of `o-expertiseProcess` | `position:absolute; inset: auto 0 -.1rem 0` sized 100%×100% of the section, z 2, `background: url() no-repeat bottom center` at natural size (a 380px band at the section bottom; wider than any viewport → cropped left/right). Pointer-events none. Fades **dark → white** downward. |
| `.a-cloud.-top` | `o-universeAbout__footer`, `o-universeTeam`, `o-expertiseProcess` | same box, `top:-.1rem; bottom:auto; transform: rotate(180deg)` → the band sits at the **top**, upside down → fades **white → dark** downward. |
| `.a-cloud.-height` | (other templates: `t-page__cloudTop/Bottom`) | in flow, `position:relative`, `height 15rem` (35rem ≥1025, `background-size: auto 100%` + `repeat-x`; `cover` <1025), `margin-top -5rem` (-6rem) |
| `.a-cloud.-top.-height` | (other templates) | in flow, `margin-top -3rem; margin-bottom -5rem` (-6rem ≥1025) |
| `.a-cloud.-noMargin` | – | `margin:0 !important` |

`.o-expertiseProcess .a-cloud.-bottom` below 1025: `background-size: 150% min(10rem, 20%)`. No cloud animation anywhere (no keyframes, no parallax); the only moving smoke is the hero `smoke.mp4`.

### 10.3 Section eyebrow (`h2.a-sectionTitle`)
**14px / 21 (tx-uni14), weight 400, colour gold `#c79d47`**, sentence case, `margin-bottom 4rem` (3rem < 1025). Always the first child of the content column (x 279.7).

```css
/* site.pretty.css L2099-2107 */
.a-sectionTitle {
  margin-bottom:3rem;
  color:#c79d47;
}
@media only screen and (min-width: 1025px) {
  .a-sectionTitle {
    margin-bottom:4rem;
  }
}
```

### 10.4 Scroll-coloured quote (`.m-textScroll`)
```html
<div class="m-textScroll" data-scroll data-module-text-scroll data-scroll-module-progress data-scroll-offset="33%,33%"
     data-scroll-position="start,center" data-init-module data-color-from="#CBCBCB" data-color-to="#00284D">
  <div class="m-textScroll__content tx-h4"><p class="-tx600" data-text-scroll="text">"Aquatique Show was born …"</p></div>
</div>
```
- Text: `tx-h4` **40px / 44 / −0.8px** (30/32/−0.6 below 1025) but `p.-tx600` → **weight 600**. Content width 61.54% of the column (69.23% in the team section) at ≥1025; 100% below.
- JS (`TextScroll`): splits the text on spaces into `<span>word</span> ` (inline), builds a paused anime timeline: `color: [from, to]`, **1200ms easeOutQuart**, `delay: stagger(50, {easing: 'easeOutInQuad'})` (total = 1200 + 50·(n−1) ms, e.g. 3350ms for 44 words), and **seeks** it to `progress × duration` on every scroll frame.
- Progress window: `start = top − vh + 0.33vh`, `end = top − 0.33vh + 0.5·height` (position `start,center`) → at 900vh the About quote (top 1401, h 352) colours between scrollY 798 and 1280; the words fill left-to-right, top-to-bottom, each word easing from grey to navy. Scrolling back reverses it.
- Colours: About/Approach `#CBCBCB → #00284D` (on white); Team `#194C7B → #FFF` (on navy).
- Frames `universe_03_about_textscroll.png`, `universe_textscroll_midway.png`, `universe_20_team_textscroll.png`, `expertise_03_approach_quote.png`.

```js
/* site.pretty.js L8790-8831 */
class Hc extends j {
    constructor(t) {
        super(t), this.events = {}
    }
    initModule() {
        this.text = this.splitText(), this.setAnimation()
    }
    getItemsToAnimate() {
        return this.text.words
    }
    splitText() {
        const t = this.$("text")[0].innerText;
        let e = "";
        t.split(" ").forEach(n => {
            e += `<span>${n}</span> `
        });
        const i = document.createElement("div");
        return i.innerHTML = e, this.$("text")[0].innerHTML = i.innerHTML, {
            words: this.$("text")[0].querySelectorAll("span")
        }
    }
    setAnimation() {
        const t = this.el.getAttribute("data-color-from"),
            e = this.el.getAttribute("data-color-to"),
            i = this.getItemsToAnimate(),
            n = q.timeline({
                autoplay: !1
            });
        n.add({
            targets: i,
            color: [t, e],
            delay: i.length > 1 ? q.stagger(50, {
                easing: "easeOutInQuad"
            }) : 0,
            easing: "easeOutQuart",
            duration: 1200
        }), this.tl = n
    }
    onScrollProgress(t) {
        this.tl && this.tl.seek(this.tl.duration * t)
    }
}
```
```css
/* site.pretty.css L4472-4476 */
@media only screen and (min-width: 1025px) {
  .m-textScroll__content {
    width:61.5384615385%;
  }
}
```

### 10.5 Parallax (`data-scroll-speed`)
Only one element on these pages: `.o-universeAbout__footerText` (`speed 0.05`). Locomotive (while Lenis is smooth-scrolling, i.e. wheel/programmatic; touch devices keep `translate3d(0,0,0)` because `smoothTouch` is off):
`translateY = −speed · vh · map(progress, 0→1, −1→1)` → **+45px when the element enters at the bottom, 0 at mid-viewport, −45px when it leaves at the top** (900vh). Measured +45 (y 1800–2400), +16.6 (3000), −8.3 (3300), −33.1 (3600), −45 (≥3900). `progress` uses the element's default window (`start,end`, no offset).

```js
/* site.pretty.js L4260-4276 */
    onRender({
        currentScroll: t,
        smooth: e
    }) {
        const i = this.scrollOrientation === "vertical" ? window.innerHeight : window.innerWidth;
        if (this.currentScroll = t, this._computeProgress(), this.attributes.scrollSpeed && !isNaN(this.attributes.scrollSpeed))
            if (this.attributes.scrollEnableTouchSpeed || e) {
                if (this.isInFold) {
                    const n = Math.max(0, this.progress);
                    this.translateValue = n * i * this.attributes.scrollSpeed * -1
                } else {
                    const n = Rr(0, 1, -1, 1, this.progress);
                    this.translateValue = n * i * this.attributes.scrollSpeed * -1
                }
                this.$el.style.transform = this.scrollOrientation === "vertical" ? `translate3d(0, ${this.translateValue}px, 0)` : `translate3d(${this.translateValue}px, 0, 0)`
            } else this.translateValue && (this.$el.style.transform = "translate3d(0, 0, 0)"), this.translateValue = 0
    }
```

### 10.6 Images, radius, shadows, lazy
- Content images: `figure.a-image.js-image > img.a-image__image.js-image-image[data-lazy][data-src][data-srcset]` (+ `.-radius` → `border-radius: 1rem; overflow:hidden`; + `.-shadow` → `box-shadow: 0 24px 34px #071e32`; + `.-cover` → absolute, full, `object-fit: cover`). vanilla-lazyload adds `-entered`/`-loaded`; `img[data-lazy]` is `opacity 0` until `-loaded` → `opacity 1` (**.15s ease-in-out**). No reveal/zoom animation on any inner-page image.
- `-radiusXl` → `border-radius: 2rem` (client tiles).
- Responsive sources: 600w / 1024w / 1440w / 1920w webp; hero images eager, everything else lazy.

```css
/* site.pretty.css L163-175 */
img {
  display:block;
  width:100%;
  max-width:100%;
  height:auto;
}
img[data-lazy] {
  opacity:0;
}
img[data-lazy].-loaded {
  opacity:1;
  transition:opacity .15s ease-in-out,transform 2.6s ease;
}
```
```css
/* site.pretty.css L208-235 */
.-radius {
  overflow:hidden;
  border-radius:1rem;
}
.-radiusXl {
  overflow:hidden;
  border-radius:2rem;
}
img.-cover,video.-cover {
  -o-object-fit:cover;
  object-fit:cover;
}
.-cover {
  position:absolute;
  top:0;
  left:0;
  z-index:0;
  width:100%;
  height:100%;
}
.-cover img,.-cover video,.-cover iframe {
  width:100%;
  height:100%;
}
.-cover img,.-cover video {
  -o-object-fit:cover;
  object-fit:cover;
}
```
```css
/* site.pretty.css L1843-1845 */
.a-image.-shadow,.a-image .-shadow {
  box-shadow:0 24px 34px #071e32;
}
```

### 10.7 Dark UI on inner pages
Same mechanism as the homepage (`body.-dark`, homepage spec 1): triggers found — universe `.o-universeAbout__wrapper` and `.o-universeResponsability`; expertise `.o-expertiseApproach` and `.o-expertiseClientsAwards`; services `.t-productsindex__grid`; contact `.o-contactForm`; faq list row (offset `35%,10%`); news `.o-blogList` (offset `25%,25%`). While `-dark` is on, the header/side rail go navy and the page-summary turns navy. It is cleared on every Barba leave.

### 10.8 Utilities used by these pages
```css
/* site.pretty.css L820-838 */
[aria-controls] {
  cursor:pointer;
}
[aria-disabled] {
  cursor:not-allowed;
}
.-visible {
  opacity:1!important;
  visibility:visible!important;
}
.-invisible {
  opacity:0!important;
  visibility:hidden!important;
}
.-hidden {
  display:none!important;
  visibility:hidden!important;
}
@media not print {
```

### 10.9 Inline videos (`InlineVideo`)
Hero background, hero smoke, universe footer video and FAQ push video are `data-scroll data-scroll-repeat data-scroll-call="togglePlay, InlineVideo, <id>"` → Locomotive calls `togglePlay` on enter and on leave, which flips play/pause. Muted, looped, `playsinline`.

```js
/* site.pretty.js L8832-8839 */
class Uc extends j {
    constructor(t) {
        super(t), this.events = {}, this.isVideoPlaying = !1
    }
    togglePlay() {
        this.isVideoPlaying = !this.isVideoPlaying, this.el.src && (this.isVideoPlaying ? this.el.play() : this.el.pause())
    }
}
```

---

## 11. Page vertical rhythm

### 11.1 Desktop (1425 wide, document y / height)

| page | blocks |
|---|---|
| universe (16656) | hero 0/1260 · pageSummary container 1260/13979 · about 1260/2816 (footer video 2894/1182) · vision 4076/2520 (contact bar 6116/110) · responsibility 6596/2296 · team 8892/6347 (top image 8892/1183, founder 11290/1223, members 13347/831, china 14307/662) · breadcrumb 15239/78 · prefooter 15317/329 · footer 15646/1009 |
| expertise (11371) | hero 0/1260 · approach 1260/1306 · process 2566/5554 (steps 3696/400, 4292/472, 4960/520, 5676/510, 6383/648; full-bleed image 7171/950) · clients 8121/2163 (logo grid 8423/1493) · breadcrumb 10283/78 · footer 10361/1009 |
| services (3834) | hero 0/1260 · products 1260/1487 (selector 1320/76, grid 1486/1014, load more 2560/46, note 2666/21) · breadcrumb 2747/78 · footer 2825/1009 |
| references (3598) | grid 0/2511 (list 160/2214, load more 2330/44, pill sticky at viewport 809–876) · breadcrumb 2511/78 · footer 2589/1009 |
| contact (3400) | hero 0/760 · form block 760/1553 (title 836/88, form 1020/859, consent 1699/180, cards 1975/180) · breadcrumb 2313/78 · footer 2391/1009 |
| faq (3267) | hero 0/760 · list 760/1024 · push 1784/396 · breadcrumb 2180/78 · footer 2257/1009 |
| news (4028) | hero 0/784 · list 784/2156 (grid 891/1864, button 2825/46) · breadcrumb 2940/78 · footer 3018/1009 |

### 11.2 390 × 844

| page | blocks |
|---|---|
| universe (16725) | hero 0/1092 · about 1092/2571 · vision 3663/2021 · responsibility 5684/1857 · team 7542/6939 (members 11565/1866, china 13479/906) · breadcrumb 14481/78 · prefooter 14559/577 · footer 15135/1590 |
| expertise (10515) | hero 0/1091 · approach 1091/1334 · process 2426/5820 (steps 3273/700, 4016/820, 4880/938, 5862/959, 6865/1097; image 7986/260) · clients 8246/602 · breadcrumb 8847/78 |
| services (7650) | hero 0/1116 · products 1116/4867 (cards 362×543 every 563 from 1254) |
| references (10701) | grid 0/9033 (cards 350×437.5 every 457.5 from 160) |
| contact (4743) | hero 0/555 · form block 555/2521 (fields from 803 step 118; right panel 1373; consent 2020; submit 2372; cards 2480 → 3024) · breadcrumb 3076/78 |
| faq (3897) | hero 0/507 (select pill 411/64) · list 507/1208 · push 1715/470 |
| news (7563) | hero 0/627 · list 627/5269 (cards 362×490) |

---

## 12. Screenshot index (`ref3/frames/`)
All desktop frames are 1440×900 viewport captures (scrollbar visible on the right); `m390_*` are 390×844.

- **Hero / first load**: `universe_00_hero.png`, `universe_01_hero_bottom.png`, `expertise_00_hero.png`, `services_00_hero.png`, `services_01_hero_cloud_to_grid.png`, `contact_00_hero.png`, `faq_00_hero.png`, `news_00_hero.png`, `reference_detail_00_hero.png`; loader on an inner page: `firstload_contact_0000ms.png`, `firstload_contact_0067ms.png`, `firstload_contact_1700ms.png`, `firstload_contact_2121ms.png`, `firstload_contact_2712ms.png`, `firstload_contact_3369ms.png`, `firstload_contact_3990ms.png`
- **Universe**: `universe_00_hero.png`, `universe_01_hero_bottom.png`, `universe_02_about_top.png`, `universe_03_about_textscroll.png`, `universe_04_about_images.png`, `universe_05_about_quote.png`, `universe_06_about_footer_video.png`, `universe_07_about_footer_text.png`, `universe_08_vision_top.png`, `universe_09_vision_visual.png`, `universe_10_vision_textimage.png`, `universe_11_vision_contact_cloud.png`, `universe_12_resp_top.png`, `universe_13_resp_visual.png`, `universe_14_resp_sections.png`, `universe_15_resp_last.png`, `universe_16_team_topimage.png`, `universe_17_team_cloud.png`, `universe_18_team_gallery.png`, `universe_19_team_founder.png`, `universe_20_team_textscroll.png`, `universe_21_team_members.png`, `universe_22_team_china.png`, `universe_23_breadcrumb_prefooter.png`, `universe_contact_button_hover.png`, `universe_summary_click_landed.png`, `universe_team_tab2.png`, `universe_team_tab_hover.png`, `universe_textscroll_midway.png`
- **Expertise**: `expertise_00_hero.png`, `expertise_01_approach.png`, `expertise_02_approach_images.png`, `expertise_03_approach_quote.png`, `expertise_04_process_cloud_top.png`, `expertise_05_process_title.png`, `expertise_06_step1.png`, `expertise_07_step1_mid.png`, `expertise_08_step3.png`, `expertise_09_step5.png`, `expertise_11_process_cloud_bottom.png`, `expertise_12_clients.png`, `expertise_13_clients_grid.png`, `expertise_14_clients_bottom.png`
- **Services**: `services_00_hero.png`, `services_01_hero_cloud_to_grid.png`, `services_02_selector_grid.png`, `services_03_loadmore.png`, `services_after_loadmore.png`, `services_cat_hover.png`, `services_filter_watershow.png`, `services_hover_card.png`, `services_loadmore_hover.png`
- **References**: `references_00_top.png`, `references_01_bottom_loadmore.png`, `references_02_end.png`, `references_filter_0282ms.png`, `references_filter_1154ms.png`, `references_filter_2254ms.png`, `references_filter_4221ms.png`, `references_hover_card.png`, `references_load_0078ms.png`, `references_load_1575ms.png`, `references_load_2352ms.png`, `references_load_2972ms.png`, `references_load_3859ms.png`, `references_load_4606ms.png`, `references_load_5330ms.png`, `references_load_6057ms.png`, `references_load_6862ms.png`, `references_load_7640ms.png`, `references_load_8359ms.png`, `references_load_9101ms.png`, `references_loadmore_0651ms.png`, `references_loadmore_3470ms.png`, `references_loadmore_hover.png`, `references_select_open_0173ms.png`, `references_select_open_1427ms.png`, `references_tileclick_0226ms.png`, `references_tileclick_0942ms.png`, `references_tileclick_1687ms.png`, `references_tileclick_2511ms.png`, `references_tileclick_3987ms.png`
- **Contact**: `contact_00_hero.png`, `contact_01_form_top.png`, `contact_02_rgpd_submit.png`, `contact_03_info_cards.png`, `contact_checked_states.png`, `contact_empty_submit_native_validation.png`, `contact_error_state_simulated_fields.png`, `contact_error_state_simulated_submit.png`, `contact_focus_typing.png`, `contact_submit_hover.png`, `contact_submit_sending_simulated.png`, `contact_submit_success_simulated.png`
- **FAQ / News**: `faq_00_hero.png`, `faq_01_list_closed.png`, `faq_02_push.png`, `faq_open_0126ms.png`, `faq_open_0452ms.png`, `faq_open_1197ms.png`, `news_00_hero.png`, `news_01_grid.png`, `news_02_after_more.png`, `news_card_hover.png`, `news_moreclick_loading.png`
- **Barba transition**: `transition_0000ms.png`, `transition_0577ms.png`, `transition_1118ms.png`, `transition_1424ms.png`, `transition_1961ms.png`, `transition_2500ms.png`, `transition_3020ms.png`, `transition_scrolled_0000ms.png`, `transition_scrolled_0413ms.png`, `transition_scrolled_0771ms.png`, `transition_scrolled_1145ms.png`, `transition_scrolled_1502ms.png`, `transition_scrolled_1858ms.png`, `transition_scrolled_2230ms.png`, `transition_scrolled_2590ms.png`, `transition_scrolled_after_insert_0000ms.png`, `transition_scrolled_after_insert_0272ms.png`, `transition_scrolled_after_insert_0553ms.png`, `transition_scrolled_after_insert_0987ms.png`, `transition_scrolled_after_insert_1451ms.png`, `transition_scrolled_after_insert_1888ms.png`, `transition_scrolled_after_insert_2324ms.png`
- **390 × 844**: `m390_contact_00_hero.png`, `m390_contact_01_form_top.png`, `m390_contact_02_rgpd_submit.png`, `m390_contact_03_info_cards.png`, `m390_contact_checked_states.png`, `m390_contact_empty_submit_native_validation.png`, `m390_contact_error_state_simulated_fields.png`, `m390_contact_error_state_simulated_submit.png`, `m390_contact_submit_sending_simulated.png`, `m390_contact_submit_success_simulated.png`, `m390_expertise_00_hero.png`, `m390_expertise_01_approach.png`, `m390_expertise_02_approach_images.png`, `m390_expertise_03_approach_quote.png`, `m390_expertise_04_process_cloud_top.png`, `m390_expertise_05_process_title.png`, `m390_expertise_06_step1.png`, `m390_expertise_07_step1_mid.png`, `m390_expertise_08_step3.png`, `m390_expertise_09_step5.png`, `m390_expertise_11_process_cloud_bottom.png`, `m390_expertise_12_clients.png`, `m390_expertise_13_clients_grid.png`, `m390_expertise_14_clients_bottom.png`, `m390_faq_00_hero.png`, `m390_faq_01_list_closed.png`, `m390_faq_02_push.png`, `m390_faq_open_0119ms.png`, `m390_faq_open_0416ms.png`, `m390_faq_open_1133ms.png`, `m390_news_00_hero.png`, `m390_news_01_grid.png`, `m390_news_02_after_more.png`, `m390_references_00_top.png`, `m390_references_01_bottom_loadmore.png`, `m390_references_02_end.png`, `m390_references_select_open_0177ms.png`, `m390_references_select_open_1251ms.png`, `m390_services_00_hero.png`, `m390_services_01_hero_cloud_to_grid.png`, `m390_services_02_selector_grid.png`, `m390_services_03_loadmore.png`, `m390_universe_00_hero.png`, `m390_universe_01_hero_bottom.png`, `m390_universe_02_about_top.png`, `m390_universe_03_about_textscroll.png`, `m390_universe_04_about_images.png`, `m390_universe_05_about_quote.png`, `m390_universe_06_about_footer_video.png`, `m390_universe_07_about_footer_text.png`, `m390_universe_08_vision_top.png`, `m390_universe_09_vision_visual.png`, `m390_universe_10_vision_textimage.png`, `m390_universe_11_vision_contact_cloud.png`, `m390_universe_12_resp_top.png`, `m390_universe_13_resp_visual.png`, `m390_universe_14_resp_sections.png`, `m390_universe_15_resp_last.png`, `m390_universe_16_team_topimage.png`, `m390_universe_17_team_cloud.png`, `m390_universe_18_team_gallery.png`, `m390_universe_19_team_founder.png`, `m390_universe_20_team_textscroll.png`, `m390_universe_21_team_members.png`, `m390_universe_22_team_china.png`, `m390_universe_23_breadcrumb_prefooter.png`

Recon captures from the earlier pass are in `ref3/` (`<page>_full.png`, `<page>_tiles.jpg`, `<page>.html` post-JS markup, `info.json`). In those full-page shots the gold block is the parked `.a-panel.-bottom`, and several lazy images are still blank.

---

## 13. Not determined / caveats
- **Hover videos** (service cards, blog cards) do not decode in headless Chrome, so their playing look was not captured; the class/opacity changes were measured.
- **Server-side validation messages**: no data was submitted, so the real error strings and the exact JSON shape were not observed. The error/sending/success frames were produced by applying the same classes and elements that `Form.setErrors`/`sendForm`/`setCallback` add (texts in the frames are placeholders). The native "Please fill out this field." bubble is Chrome's own UI and is locale-dependent.
- **reCAPTCHA v3** badge is hidden by CSS (`.grecaptcha-badge{display:none}`); the token field is refreshed every 119s. Not part of the visual design.
- **Page-summary first-paint artefact** (2.2): some rings render full before their section is reached; described, not "designed".
- **Filter pill list items** hover: no visual change was measured (only `-current` is dimmed).
- **Reference grid un-hover** timing (200ms / 700ms) is read from the code; the capture moved the mouse onto the scrollbar, which did not fire `mouseleave`, so it is not measured.
- **Fetch timings** (filter, load more, Barba page fetch) depend on the network (237–790ms observed); the animations after the response are deterministic.
- **Mobile transition** was not captured separately; the code path is identical (panels use `100%`/`101vh`, so distances scale with the viewport).
- **`-blog` hero / article template, service & reference detail blocks (`b-textImage`, `b-images`, `m-sliderActualite`)** were only glanced at (6.9) — not part of this brief.
- The Matter VF, colour tokens, buttons, tags and the Title line-split module are documented in `ref2/SPEC.md`; values here that repeat them were re-measured on these pages and match.
