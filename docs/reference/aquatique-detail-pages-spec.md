# Aquatique Show service and reference detail pages: design and motion spec

This spec is the third in a set, after:
- `aquatique-homepage-spec.md` (**H**): shared chrome, fonts, colour tokens, easings, the `tx-*` type scale (H 0.4), the grid (H 0.5), buttons and `.a-buttonSlider` (H 0.6), tags (H 0.7), the reveal system (H 0.8), keyframes (H 0.9), Locomotive and Lenis (H 0.10), the product-card drag slider with its custom cursor and dots (H 6), the video band (H 8), the news slider (H 9), the prefooter (H 11) and the footer (H 12).
- `aquatique-inner-pages-spec.md` (**I**): inner heroes including `-cloud` (I 1), the page transition (I 9), the breadcrumb (I 10.1), `.a-cloud` (I 10.2), parallax (I 10.5), images, radius, shadows and lazy-loading (I 10.6), dark UI (I 10.7) and inline videos (I 10.9).

This file covers only what those two do not. References look like "H 6" or "I 10.2".

**Templates covered**
- **Service detail**: `main.t-productsitem.t-page`. Pages: `/en/our-services/water-screen` (primary), `/custom-made-water-show`, `/dancing-fountain`.
- **Reference detail**: `main.t-referencesitem.t-page`. Pages: `/en/our-references/puy-du-fou`, `/summer-show-for-volkswagen-autostadt-wolfsburg-germany` ("VW"). `/vidanta-world` was also dumped, for its navy quote.
- Server HTML from 62 other reference pages was scanned to build the block inventory (section 3.0).

**Measurement conditions**
- Measured on 2026-09-17 in Chrome (Playwright 3.10, `channel="chrome"`), launched **without `--hide-scrollbars`**.
- Desktop: **1440×900**, so the layout viewport is **1425** wide. Mobile: **390×844** with `is_mobile`, `has_touch` and an iPhone UA.
- The French cookie banner was dismissed ("OK pour moi"). Lenis was active. Pages were crawled slowly so lazy images loaded and Locomotive fired.
- `1rem = 10px`. All `y` values are document coordinates. `x` values are viewport coordinates, and the page content spans 0–1425.

**Sources**
- CSS is quoted from `site.Dw46WaF4.css`, JS from `site.CM9KLvG0.js`. Both are still the live bundle URLs.
- They were beautified into a scratch copy (`site.pretty.css` / `site.pretty.js`). Line numbers are from that copy and **match the line numbers quoted in H and I** (same beautifier; spot-checked `.a-buttonSlider` L1592, `.b-video` L4891, `.o-breadcrumb` L5010, `class yc` L7930, `class Xl` L6569).

**Colour names**
- **navy** `#00284d`, **darkblue** `#000d1a`, **gold** `#c79d47`, **black** `#0c0a09`, **white** `#fff`
- **line grey** `#cbcbcb`, **text grey** `#4f4f4f`
- **fontaine** `#4180c9`, **aquatique** `#6541cb`

## Contents
0. Page skeleton and vertical rhythm
1. Detail hero (service vs reference)
2. `t-page__blocks`: the white/navy system, cloud seams, dark UI
3. Blocks: inventory, then each block (`b-textImage`, rich text, `b-content`, `b-twoColumns__wrapper`, `b-images`, `b-gallery`, `b-separator`, `b-video`, `b-quote`, `b-slider`, `b-push` products and single)
4. Breadcrumb and prefooter on these templates
5. Scroll and entrance animations (summary)
6. 390 layout of every block
7. Page-by-page block order and differences
8. Screenshot index (`frames-detail/`)
9. Not determined / caveats

---

## 0. Page skeleton and vertical rhythm

```html
<body data-barba="wrapper" data-module-website="website" data-animate>
  … header / side rail / menu (H 1–3) …
  <main class="t-productsitem t-page" data-menu="t-page" data-barba="container" data-barba-namespace="products-item" data-urls='{"en":"…","fr":"…"}'>
  <!-- reference: class="t-referencesitem t-page", data-barba-namespace="references-item" -->
    <div class="m-pageScroller a-scroll" data-module-scroll="scroll">
      <section class="m-hero -txcenter -clrwhite -cloud js-hero" data-scroll>…</section>      <!-- 1 -->
      <div class="t-page__blocks -bgwhite -clrnavy" …>…blocks…</div>                         <!-- 2, 3 -->
      <div class="o-breadcrumb">…</div>                                                        <!-- 4 -->
      <footer class="o-footer">…</footer>                                                      <!-- H 12 -->
    </div>
  </main>
</body>
```
- Neither template has a section nav (`m-pageSummary`), a text-scroll quote or a prefooter.
- Neither class name has CSS or JS of its own. The page is entirely the hero plus shared blocks.

| page | desktop doc height | hero | blocks | breadcrumb | footer | 390 doc height |
|---|---|---|---|---|---|---|
| water-screen | 11172 | 0/1260 | 1260/8824 | 10084.2/77.8 | 10162/1009.5 | 9568 (hero 898.2, footer 7978.7/1589.7) |
| custom-made | 11246 | 0/1260 | 1260/8898.7 | 10158.7/77.8 | 10236.5 | 9594 |
| dancing-fountain | 11410 | 0/1260 | 1260/9062.5 | 10322.5/77.8 | 10400.3 | 10214 |
| Puy du Fou | 7476 | 0/1260 | 1260/5128.3 | 6388.3/77.8 | 6466.1 | 6780 (hero 981.7, breadcrumb h 124.6) |
| VW Autostadt | 11377 | 0/1260 | 1260/9030 | 10290/77.8 | 10367.8 | 10577 (hero 1035.7) |

Per-block positions are in section 7.

---

## 1. Detail hero

Both templates use the `-cloud` hero from I 1 (same geometry, white-cloud PNG, `smoke.mp4`, z-order, 1260 tall on desktop). Only the differences are listed here.

### 1.1 Markup

Service detail (`t-productsitem`):
```html
<section class="m-hero -txcenter -clrwhite -cloud js-hero" data-scroll>
  <div class="row m-hero__content">
    <div class="m-hero__wrapper column-16 lg-column-12 lg-offset-2 no-width">
      <ul class="m-hero__categoryTagsList">
        <p class="a-tag - m-hero__tag -aquatique -fill -icon">
          <span class="a-tag__iconWrapper"><svg class="a-svg -aquatic-show-symbol"><use href="#icon-aquatic-show-symbol"/></svg></span>
          <span class="a-tag__content">Water effect</span>
        </p>
      </ul>
      <div class="overflow-wrapper">                     <!-- note: NOT -static here (I 1.1 shows -static on universe) -->
        <div class="m-hero__title">
          <h1 class="tx-h1 js-title" data-scroll data-module-title>Water<br><strong>screen</strong></h1>
        </div>
      </div>
      <!-- no m-hero__textContent paragraph on detail pages -->
    </div>
    <div class="m-hero__scrollDown"><span class="-tx600 tx-uni11 -txupp">SCROLL TO DISCOVER</span><svg class="a-svg -arrow-right">…</svg></div>
  </div>
  <figure class="a-video m-hero__background"><video class="a-video__video -cover" … data-module-inline-video="heroCover" …></video></figure>
  <div class="a-cloud"></div>
  <figure class="a-video m-hero__cloudVideo"><video src="/assets/videos/smoke.mp4" …></video></figure>
</section>
```

Reference detail (`t-referencesitem`). The differences are marked:
```html
<section class="m-hero -txcenter -clrwhite -cloud js-hero" data-scroll>
  <div class="row m-hero__content">
    <div class="m-hero__wrapper column-16 lg-column-12 lg-offset-2 no-width">
      <ul class="m-hero__categoryTagsList">
        <p class="a-tag - m-hero__tag -fontaine -fill -icon">…Water show…</p>
        <!-- VW has three: -fontaine "Water show", -fontaine "Water effect" (sic), -aquatique "Immersive fountain" -->
      </ul>
      <div class="overflow-wrapper">
        <div class="m-hero__title">
          <h1 class="tx-h1 js-title" data-scroll data-module-title><strong>Les Noces de Feu<br></strong>Puy du Fou</h1>
        </div>
      </div>
      <ul class="m-hero__referenceTagsList">                                   <!-- NEW -->
        <li class="a-tag - -reference m-textContent -txupp"><span class="a-tag__content"><strong>City</strong>: Les Epesses, France.</span></li>
        <li class="a-tag - -reference m-textContent -txupp"><span class="a-tag__content"><strong>Since</strong>: 2020</span></li>
        <!-- VW: "<strong>City</strong>: Wolfsburg, Germany." and "2008 - 2022" (no <strong> label) -->
      </ul>
    </div>
    <!-- NO .m-hero__scrollDown on reference pages -->
  </div>
  <figure class="a-image -cover js-image">                                      <!-- still image instead of the video -->
    <img src="…-600x-q80.webp" class="a-image__image js-image-image" width="1000" height="667" sizes="100vw" srcset="…600w, …1024w, …1440w, …1920w">
  </figure>
  <div class="a-cloud"></div>
  <figure class="a-video m-hero__cloudVideo">…smoke.mp4…</figure>
</section>
```

| | service detail | reference detail |
|---|---|---|
| background | `figure.a-video.m-hero__background` looping video (z −1, video z −2) | `figure.a-image.-cover` **eager still** (`src` present, no `data-lazy`), z **−2** (`.m-hero .-cover`) |
| category tags | 1+ `a-tag -fill -icon` + colour | same |
| title | `tx-h1`, light + `<strong>` (either line can be bold) | same |
| second tag row | – | `.m-hero__referenceTagsList` |
| scroll cue | yes (`top: calc(100vh - 6.4rem)` = y 836) | **none** |
| paragraph | none | none |
| desktop height | 1260 | 1260 |
| 390 height | 898.2 (water-screen) | 981.7 (Puy du Fou; content-driven, see 6.1) |

Tag colours come from CMS data, not from the category name. VW's "Water effect" pill is `-fontaine` blue, but on service pages "Water effect" is `-aquatique` purple. Reproduce the class given per page.

### 1.2 Category tags (`.a-tag.-icon.-fill.-<colour>`)
The base pill is H 0.7. With `-fill`, the pill takes `--color1` as its background and `--color2` (white) as its text. The icon dot inverts: white disc, symbol in `--color1`.

| measured (desktop = 390) | value |
|---|---|
| pill | **h 19**: "WATER EFFECT" w 99.1, "WATER SHOW" w 94.0, "IMMERSIVE FOUNTAIN" w 131.0; `padding 3px 8px 3px 4px`; radius 24px; `gap 3px`; flex, `align-items:center` |
| text | 10px (inherited from the 10px root; no `tx-` class), line-height normal, weight **600** and uppercase, both from `.a-tag:not(.-xl)`: it sits in the `.-tx600` selector list (`font-weight:600!important`, L632-634) and the `.-txupp` list (L623-625) |
| colours | `-aquatique` bg `rgb(101,65,203)` = `#6541cb`; `-fontaine` bg `rgb(65,128,201)` = `#4180c9`; `-golddark` bg `rgba(206,169,93,.6)`; text white |
| icon wrapper | 13×13, radius 24px, **bg `#fff`**, colour = pill colour; the `icon-aquatic-show-symbol` svg is **7×6**, centred (x+3, y+3.5 inside the pill) |
| list | desktop: flex **row**, `gap .8rem`, centred, **`margin-bottom 5rem`**; 390: flex **column**, gap .8rem, `margin-bottom 2rem` |
| position | service: list at y **325** (wrapper y 325–575, vertically centred in the 900 content box); reference: y **296** (wrapper 296–604, taller because of the second row) |

```css
/* site.pretty.css L2956-2969 */
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
```
```css
/* site.pretty.css L2201-2208 (tag -fill, also quoted in H 0.7) */
.a-tag.-fill {
  background-color:var(--color1);
  color:var(--color2);
}
.a-tag.-fill .a-tag__iconWrapper {
  background-color:var(--color2);
  color:var(--color1);
}
```

### 1.3 Title
- `h1.tx-h1`: **80px / 68px, letter-spacing −4px, weight 300**, white, `padding 1.2rem 1rem`, centred. `<strong>` is weight **600**. At ≥1441px the size is 10rem (I 1.3).
- Two lines give a 160px box: `.m-hero__title` at y 394 (service) or y 365 (reference), `margin-bottom 2.1rem` (21px).
- 390: **56px / 47.6px / −2.24px**. Puy du Fou wraps to 3 lines, so the box is 166.8 tall (y 201). `.m-hero__title` has `margin-bottom 3.2rem`.
- The bold part can be either line:
  - service: `Water<br><strong>screen</strong>`
  - reference: `<strong>Les Noces de Feu<br></strong>Puy du Fou`
  - VW: all bold (`<strong>Volkswagen headquarter Autostadt</strong>`, 2 lines, strong box 839×155)
- Entrance: identical to I 1.6. `.m-hero__title` plays `enter-y` (2s, `cubic-bezier(.23,1,.32,1)`), and the Title module splits the h1 into lines. The wrapper here is **not** `-static`, so the inner `.m-hero__title` animates, as on the other `-cloud` heroes.

### 1.4 Reference tag row (`.m-hero__referenceTagsList` > `.a-tag.-reference`)

| | desktop | 390 |
|---|---|---|
| list | flex **row**, `gap 1.6rem`, `margin-top 1.9rem` (y 565 = title bottom 525 + 21 + 19), centred inside the column-flex wrapper → Puy du Fou list x 556.6, w 311.8, h 39 | flex **column**, gap 1.6rem, `margin-top .8rem` → x 100.1, w 189.9 (the widest pill; the narrower pill **stretches** to 189.9 because it is a column flex child with default `align-items: stretch`), y 407.8, h 93.9 |
| pill | `li.a-tag.-reference.m-textContent.-txupp`: **h 39**; "CITY : LES EPESSES, FRANCE." w 189.9; "SINCE : 2020" w 105.9; VW "CITY : WOLFSBURG, GERMANY." w 199.6, "2008 - 2022" w 101.7 | same pills, 189.9 wide each |
| box | `padding 1.2rem 1.9rem`; **`border .1rem solid #fff`**; bg `rgba(255,255,255,.1)` (`--color2`); radius 2.4rem; text white | same |
| type | `.a-tag.-reference` → **11px / 1.18 (12.98px)**, uppercase; `<strong>` weight 600, rest 400 (from `.m-textContent strong`); the label "City" and the value are separated by the literal ": " from the CMS | same |
| display | `display:grid` (because the pill also has `.m-textContent`, whose grid `gap 4.5rem`/2.25rem does nothing with one child) | same |

```css
/* site.pretty.css L3022-3034 */
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
```
```css
/* site.pretty.css L2194-2200 */
.a-tag.-reference {
  --color1: #FFF;
  --color2: rgba(255, 255, 255, .1);
  padding:1.2rem 1.9rem;
  border:solid .1rem #FFF;
  color:#fff;
}
```
```css
/* site.pretty.css L739-742 */
.tx-uni11,.a-tag.-reference {
  font-size:1.1rem;
  line-height:1.18;
}
```

### 1.5 Hero entrance (tags)
Both tag lists start at `opacity:0`. When the hero gets `is-inview` (on load), they play **`enter-popin-up` 1s `cubic-bezier(.23,1,.32,1)`, 1s delay, `forwards`**: opacity 0→1 and `translateY(3rem)`→0. The title lines run at the same time (I 1.6), so the tags arrive **after** the title starts. Measured final state: `transform: matrix(1,0,0,1,0,0)`, opacity 1.

```css
/* site.pretty.css L3236-3238 */
.m-hero.is-inview .m-hero__categoryTagsList,.m-hero.is-inview .m-hero__referenceTagsList,.m-hero.is-inview .m-hero__blogInfo li {
  animation:enter-popin-up 1s cubic-bezier(.23,1,.32,1) 1s forwards;
}
```
```css
/* site.pretty.css L330-339 */
@keyframes enter-popin-up {
  0% {
    opacity:0;
    transform:translateY(3rem);
  }
  to {
    opacity:1;
    transform:translate(0);
  }
}
```

Frames: `ws_00_hero.png`, `m390_ws_00_hero.png`, `ref_puy_00_hero.png`, `m390_ref_puy_00_hero.png`, `ref_vw_00_hero.png`, `cm_00_hero.png`, `df_00_hero.png`.

---

## 2. `t-page__blocks`: the white/navy system, cloud seams, dark UI

### 2.1 Markup
```html
<main class="t-productsitem t-page">            <!-- t-referencesitem on references -->
  <div class="m-pageScroller a-scroll" data-module-scroll="scroll">
    <section class="m-hero … -cloud">…</section>
    <div class="t-page__blocks -bgwhite -clrnavy" data-scroll data-scroll-repeat data-scroll-offset="25%, 25%"
         data-scroll-call="toggleDarkUi, Website, website">
      <section class="b-textImage row -overlapping">…</section>
      <section class="b-images -fullscreen">…<div class="a-cloud"></div></section>
      <div class="a-cloud -bgnavy -top -height"></div>                <!-- white → navy seam -->
      <div class="t-page__revert -bgnavy -clrwhite" data-scroll data-scroll-repeat
           data-scroll-call="toggleDarkUi, Website, website"><section class="b-content row">…</section></div>
      <div class="t-page__revert -bgnavy -clrwhite" …><section class="b-images row">…</section></div>
      …                                                               <!-- ONE revert wrapper PER navy block -->
      <div class="a-cloud -bgnavy -height"></div>                     <!-- navy → white seam -->
      <section class="b-content row">…</section>
      <div class="row"><hr class="b-separator"></div>
      <section class="row"><div class="b-video -radius column-16 lg-column-14 lg-offset-1" …>…</div></section>
      <div class="b-slider" data-scroll data-scroll-call="initModules,Website,website">…</div>
      <div class="b-push -border" data-scroll data-scroll-call="initModules,Website,website" …>…</div>
    </div>
    <div class="o-breadcrumb">…</div>
    <footer class="o-footer">…</footer>
  </div>
</main>
```
- `main.t-page` is navy (`#00284d`), z 10. The `t-page__blocks` grid paints the white.
- Every block is a **direct grid child**, so the 12rem gap separates blocks.
- A navy run is built from consecutive `t-page__revert.-bgnavy.-clrwhite` wrappers, each with one block inside. Negative margins make them touch (2.3), bracketed by two `.a-cloud.-bgnavy` seams.
- The CMS can drop a seam. On custom-made, an `a-cloud -bgnavy -top -height` is followed directly by a **white** `b-images` with no revert (section 7).

### 2.2 CSS
```css
/* site.pretty.css L8040-8104 */
.t-page {
  position:relative;
  z-index:10;
  background-color:#00284d;
  transform-origin:top center;
}
.t-page__blocks {
  display:grid;
  grid-template-columns:1fr;
  gap:6rem;
  width:100%;
}
.t-page__blocks>*:last-child {
  padding-bottom:4.5rem;
}
.t-page__blocks.-blog>*:first-child {
  padding-top:6rem;
}
.t-page__revert {
  padding-top:3rem;
  padding-bottom:3rem;
}
.t-page__revert .b-slider {
  --slider-icon-color: #FFF;
  --slider-border-color: #FFF;
}
.t-page__revert:not(:last-child) {
  margin-bottom:-3rem;
}
.t-page__revert:not(:first-child) {
  margin-top:-3rem;
}
.t-page__cloudTop {
  margin-top:-3rem;
}
.t-page__cloudBottom {
  margin-bottom:-3rem;
}
@media only screen and (min-width: 1025px) {
  .t-page__blocks {
    gap:12rem;
  }
  .t-page__blocks>*:last-child {
    padding-bottom:12rem;
  }
  .t-page__blocks.-blog>*:first-child {
    padding-top:12rem;
  }
  .t-page__revert {
    padding-top:6rem;
    padding-bottom:6rem;
  }
  .t-page__revert:not(:first-child) {
    margin-top:-6rem;
  }
  .t-page__revert:not(:last-child) {
    margin-bottom:-6rem;
  }
  .t-page__cloudTop {
    margin-top:-6rem;
  }
  .t-page__cloudBottom {
    margin-bottom:-6rem;
  }
}
```
```css
/* site.pretty.css L437-442 (colour utilities on the wrappers) */
.-clrnavy {
  color:#00284d;
}
.-bgnavy {
  background-color:#00284d;
}
```
- `-bgwhite` is `background-color:#fff` (L560) and `-clrwhite` is `color:#fff` (L557).
- The block text colour is **inherited**: navy on white, white on navy.
- The cloud CSS (`.a-cloud`, `-top`, `-height`, `-top.-height`, L1792-1842) is quoted in I 10.2.
- The last grid child is the `b-push`, so it gets `padding-bottom:12rem` (4.5rem at 390). That padding is the white space above the breadcrumb.

### 2.3 Seam geometry (water-screen, measured)

| element | desktop y / h | margins (desktop) | 390 |
|---|---|---|---|
| `b-images.-fullscreen` | 2781.4 / 801.6 | – | see 6.5 |
| `a-cloud.-bgnavy.-top.-height` | **3673 / 350** | `-30px 0 -60px` | h **150**, margins `-30px 0 -50px` |
| revert 1 (`b-content`) | **4023** / 343.8, padding 60/60 | `-60px 0` | padding 30/30, margins −30/−30 |
| revert 2 (`b-images` pair) | 4366.8 / 567 | `-60px 0` | |
| revert 3 (`b-textImage`) | 4933.7 / 587.2 | `-60px 0` | |
| revert 4 (`b-textImage` `-revert`) | 5520.9 / 491.4 | `-60px 0` (still `margin-bottom:-6rem`: `:not(:last-child)` refers to the whole grid, not to the navy run) | |
| `a-cloud.-bgnavy.-height` | **6012.3 / 350** | `-60px 0 0` | h 150, margin-top −50 |
| next white block (`b-content`) | 6482.3 | – | |

Desktop arithmetic (gap 120):
- Image bottom 3583 + gap 120 − cloud margin-top 30 = cloud top **3673**.
- Cloud bottom 4023 − margin 60 + gap 120 − revert margin-top 60 = revert top **4023**. The seam is flush.
- Revert *n* bottom − 60 + 120 − 60 = revert *n+1* top. Each revert's 60px padding plus the −60px margins cancel the gap exactly, so the run is one continuous navy band.
- Last revert bottom 6012.3 − 60 + 120 − 60 = bottom cloud top **6012.3**. Flush again.

390 arithmetic (gap 60, revert padding and margins 30, `-top.-height` margins −30/−50, `-height` margin-top −50):
- The seams **overlap by 20px**: cloud bottom − 50 + 60 − 30 = revert top = cloud bottom − 20.
- The cloud is `position:relative; z-index:0`, so it paints **over** the first 20px of the revert. Both are navy there, so the overlap is invisible.

**How the seams look.** The PNG is white smoke on transparent, laid over the element's own navy background:
- `.a-cloud.-bgnavy.-height` (**navy → white**): PNG at `background-size: auto 100%` (a 350-tall band gives a 2477.6×350 tile), `repeat-x`, `bottom center`. The bottom of the band is white smoke and the top is plain navy. Below 1025: `background-size: cover` on a 150px band.
- `.a-cloud.-bgnavy.-top.-height` (**white → navy**): the same box turned `rotate(180deg)` (computed `matrix(-1,0,0,-1,0,0)`). The smoke is at the top and the band fades into navy downward.
- `.a-cloud` inside `b-images.-fullscreen`: absolute over the image (z 2, `bottom:-.1rem`, 100%×100%), natural-size PNG anchored at the bottom, so the image dissolves into white at its bottom edge. Water-screen and dancing-fountain use this, followed by the navy `-top -height` seam.
- `.a-cloud.-top` inside `b-images.-fullscreen` (Puy du Fou and 18 other references): rotated, so the **top** of the image comes out of white and the bottom edge is hard (frame `ref_puy_03_images_fullscreen.png`).
- Below 1025, `.b-images.-fullscreen .a-cloud { background-size: 150% min(10rem, 20%) }` (L4613-4617) squashes the in-image cloud to a band at most 100px tall and 150% wide.
- No cloud animates (I 10.2).

Frames: `ws_04_images_fullscreen.png`, `ws_05_fullscreen_to_navy_cloud.png`, `ws_08_navy_to_white_cloud.png`, `m390_ws_05_fullscreen_to_navy_cloud.png`, `m390_ws_08_navy_to_white_cloud.png`, `ref_puy_03_images_fullscreen.png`.

### 2.4 Dark UI on these templates
The trigger is the Locomotive call `toggleDarkUi` (I 10.7). Rule: `-dark` = (way === "enter") XOR (target has `-bgnavy`).
- White `t-page__blocks`: dark **on** when entering, **off** when leaving. It uses `data-scroll-offset="25%, 25%"`, so it enters when its top passes 75% of the viewport height and leaves when its bottom passes 25%.
- Each navy `t-page__revert` (no offset): **off** when entering at the viewport bottom, **on** when leaving at the viewport top.
- `data-scroll-repeat` makes both fire every time.

```js
/* site.pretty.js L3701-3713 */
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
```

There is no counter, so **the last event wins**. When one navy wrapper leaves at the top while the next navy wrapper is already in view, dark UI turns back **on** over navy. The header logo, the MENU pill and the side rail then render navy on navy; only the gold drop and the gold "Contact us" CTA stay visible (frame `ws_07b_navy_textimage_revert.png`).

Measured on water-screen, desktop, sampled every 150px of `scrollY`:

| scrollY | `-dark` | cause |
|---|---|---|
| 0–450 | off | hero |
| 600–3000 | **on** | blocks entered (scrollY > 1260 − 675 = 585) |
| 3150–4350 | off | revert 1 entered (4023 − 900 = 3123) |
| 4500 | **on** | revert 1 left (bottom 4366.8), although reverts 2–3 are on screen |
| 4650–4800 | off | revert 4 entered (5520.9 − 900 = 4620.9) |
| 4950–9750 | **on** | revert 2 left (4933.7); no later "enter" fires, so dark stays on over reverts 3–4 (navy) and then the white blocks |
| ≥ 9900 | off | blocks left (bottom 10084 − 225 = 9859) |

Puy du Fou (no navy run): off 0–450, on 600–6150, off from 6300 (blocks bottom 6388 − 225).

A faithful rebuild reproduces the "last event wins" behaviour. A nicer rebuild counts how many navy wrappers overlap the header band. **Decide with the designer**; the live site shows the glitch.

---

## 3. Blocks

### 3.0 Inventory
Top-level children of `t-page__blocks`, counted across the 5 measured pages plus 62 reference pages (server HTML):

| block | pages using it | variants seen |
|---|---|---|
| `section.b-textImage.row` | 69/69 | `-overlapping` on almost all (1, 2 or 3 images); plain (no `-overlapping`, 1 image) on dancing-fountain, vidanta, sevilla, national-day-singapore, sheikh-zayed, water-street, yinzhou; inner `.b-twoColumns` with or without `-revert`; optional `.b-textImage__title` |
| `div.b-push.-border` (products slider) | 68/69 | title "See also" (services) or "Discover our services" (references) |
| `section.row > div.b-video` | 64/69 | `-radius column-16 lg-column-14 lg-offset-1` (61), or full-bleed `column-16` without radius (fifa, spectra) |
| `section.b-content.row` | 42 | text `-left`, `-right`, `-center`, `-center -txcenter`; title optional |
| `div.b-slider` (image slider) | 32 | always `-keepOverflow -drag`, `align:center`, `startIndex:1`, controls |
| `section.b-images` | 28 | `-fullscreen` (with `.a-cloud` or `.a-cloud.-top` inside, optionally `.-removeMargins`); `row` with 1 image; `row` with 2 images (`b-twoColumns`). **No 3-image variant exists.** |
| `section.row.b-twoColumns__wrapper` | 30 | title tag `h2/h3/h5/p` with `tx-h2…tx-h5`, `-txleft/-txcenter` |
| `figure.b-gallery.row` | 16 | always exactly 4 images |
| `blockquote.b-quote.row` | 8 | white or navy |
| `div.b-push.-border > .b-push__single` (single CTA card) | 10 | always placed just before the products push |
| `div.row > hr.b-separator` | 2 (water-screen, dancing-fountain) | – |
| `a-cloud.-bgnavy(.-top).-height`, `t-page__revert` | – | see section 2 |

No KPI (`b-number`), download (`b-download`), accordion or CTA-bar blocks appear on these templates. Their CSS exists in the bundle (`b-download` L4520-4569, `b-number` L4628-4661) for other templates. The text-scroll quote (I 10.4) is not used here either.

### 3.1 `b-textImage`

**Markup**
```html
<section class="b-textImage row -overlapping">
  <div class=" column-16 lg-column-14 lg-offset-1">
    <div class="b-textImage__title m-titleContent">                         <!-- optional -->
      <h2 class=" tx-h2 -txcenter"><strong>The water screen,<br></strong>a magical projection effect on water!</h2>
      <!-- also seen: h2.tx-h2.-txleft, h3.tx-h3.-txcenter -->
    </div>
    <div class="b-twoColumns -revert">                                       <!-- -revert optional -->
      <div class="b-twoColumns__left">
        <div class="m-textContent">
          <h2><span class="tx-h3">Dimensions and specifications of </span><strong><span class="tx-h3">the water screen</span></strong></h2>
          <!-- or a lead paragraph: <p><strong><span class="tx-h4">A long collaboration …</span></strong></p> -->
          <p>… <strong>the water screen</strong> … <span class="-clrgold">water effect</span> … <a href="…">Grand Rex</a> …</p>
          <ul><li><p>+/- 6 meters height …</p></li>…</ul>
        </div>
      </div>
      <div class="b-twoColumns__right">
        <figure class="b-textImage__imagesWrapper">
          <img class="a-sImage js-image-image -radius" data-lazy data-src="…" data-srcset="…" width="1200" height="800"
               sizes="100vw, (min-width: 1025px) 48vw" alt="…">
          <img class="a-sImage js-image-image -radius" … width="1024" height="683">          <!-- 2nd, optional -->
          <img class="a-sImage js-image-image -radius" … width="2000" height="1333">         <!-- 3rd, optional -->
        </figure>
      </div>
    </div>
  </div>
</section>
```
- The images are bare `img.a-sImage` elements inside the figure (no `.a-image` wrapper). Radius comes from `.-radius`: **10px**, `overflow:hidden`. There is **no shadow**.
- The images lazy-load and fade in over .15s (I 10.6).

**CSS**
```css
/* site.pretty.css L4756-4821 */
.b-textImage__title {
  margin-bottom:4.5rem;
}
@media only screen and (min-width: 1025px) {
  .b-textImage__title {
    margin-bottom:9rem;
  }
}
.b-textImage__imagesWrapper {
  display:flex;
  flex-direction:column;
  gap:2.25rem;
}
.b-textImage.-overlapping .b-textImage__imagesWrapper {
  gap:0!important;
}
.b-textImage.-overlapping .a-sImage:nth-child(1) {
  width:80%;
}
.b-textImage.-overlapping .a-sImage:nth-child(2) {
  width:60%;
  margin-top:-9rem;
  margin-left:auto;
}
@media only screen and (min-width: 1025px) {
  .b-textImage.-overlapping .a-sImage:nth-child(2) {
    margin-top:-7.5rem;
  }
}
.b-textImage.-overlapping .a-sImage:nth-child(3) {
  width:40%;
  margin-top:-4.5rem;
  margin-left:20%;
}
@media only screen and (min-width: 1025px) {
  .b-textImage.-overlapping .a-sImage:nth-child(3) {
    margin-top:-9rem;
  }
}
@media only screen and (max-width: 1024px) {
  .b-textImage .b-twoColumns__left {
    margin-bottom:3rem;
  }
}
@media only screen and (min-width: 1025px) {
  .b-textImage .b-twoColumns__right {
    padding-left:1rem;
  }
}
@media only screen and (min-width: 1025px) {
  .b-textImage .b-twoColumns {
    grid-template-columns:42.8571428571% 50%;
    gap:7.1428571429%;
  }
}
@media only screen and (min-width: 1025px) {
  .b-textImage .-revert .b-twoColumns__right {
    padding-right:1rem;
    padding-left:0;
  }
}
@media only screen and (min-width: 1025px) {
  .b-textImage .-revert {
    grid-template-columns:50% 42.8571428571%;
  }
}
```
```css
/* site.pretty.css L4842-4882 (generic two-column grid) */
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

**Desktop geometry** (water-screen block 1, y 1260; column `lg-column-14 lg-offset-1` = x **106.6**, w **1211.9**)

| part | value |
|---|---|
| title | `h2.tx-h2`: **80px / 80px, −4.8px, 300**, `<strong>` 600, centred; 2 lines → 160 tall; `margin-bottom 9rem` → columns start at y 1510 |
| grid | `42.857% 50%` + gap `7.143%` → text **519.4**, gap **86.6**, images **605.9** |
| default order | text left (x 106.6), images right (x 712.5; column `padding-left 1rem` → wrapper x **722.5**, w **595.9**) |
| `-revert` | columns `50% 42.857%`; `.b-twoColumns__left` gets `order:1` → images **left** (x 106.6, `padding-right 1rem`, wrapper w 595.9), text **right** (x **799.1**, w 519.4) |
| vertical | both columns start at the same y (grid `align-items: stretch`); the block height is the taller column |
| image 1 (`-overlapping`) | **80%** of 595.9 = **476.8** wide, height from `width/height` attributes (1200×800 → 317.8) |
| image 2 | **60%** = **357.6** wide, `margin-top -7.5rem`, `margin-left:auto` (right-aligned) → overlaps image 1 by 75px; x 960.9 (normal) or 344.9 (revert; its wrapper starts at 106.6) |
| image 3 | **40%** = **238.4** wide, `margin-top -9rem`, `margin-left 20%` (119.2) → x 841.7; overlaps image 2 by 90px (VW block 1: 476.8×176.6 → 357.6×238.5 at y +101.6 → 238.4×158.9 at y +250.1) |
| stacking | DOM order: image 2 paints over 1, image 3 over 2 (no z-index) |
| 1 image | only the 80% rule applies (476.8 wide, left-aligned in its wrapper) |
| plain (no `-overlapping`) | wrapper `gap 2.25rem`; every image is **100%** (595.9) and stacked (dancing-fountain block 1: 595.9×397.6) |
| text | `.m-textContent` grid `gap 4.5rem` (45px between paragraphs), see 3.2 |

Measured heights: water-screen 769 (title + 519 columns), 512.4, 467.2 (navy), 371.4 (navy, `-revert`, one image). VW: 409, 317.8, 370.1, 357.6, 540.4, 554.9. Puy du Fou: 596.4, 560.

**Motion**: none. There is no `data-scroll` inside the block, no parallax and no reveal; only the lazy image fade (opacity 0→1, .15s ease-in-out). The `transform 2.6s ease` in the `-loaded` transition has no transform to animate here.

**390**: see 6.3.

Frames: `ws_02_textimage_overlap_revert.png`, `ws_03_textimage_list.png`, `ws_07_navy_textimage.png`, `ws_07b_navy_textimage_revert.png`, `df_01_textImage.png` (plain), `ref_vw_02_textImage_overlapping.png` (3 images), `ref_puy_01_textImage_overlapping.png` (bold `tx-h4` lead paragraph).

### 3.2 Rich text (`.m-textContent`) inside blocks
```css
/* site.pretty.css L4395-4471 */
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
```

| element | computed (desktop; 390 in brackets) |
|---|---|
| `p` | **16px / 24px, 400** (`.m-textContent p` is in the `tx-p` list, L697), colour inherited (navy on white, white on navy) |
| paragraph spacing | grid gap **45px** [22.5]. Inside `b-twoColumns__wrapper`, `.b-twoColumns__left/right` carry `.m-textContent` themselves, and the later `gap:2.25rem` rule wins → **22.5px** at every width |
| `strong` | 600, same colour |
| `span.-clrgold` | `#c79d47`, weight unchanged (400, or 600 inside strong) |
| `a` (inside `p`) | **600, underline**, colour inherited (navy / white); hover `#221c35` over .25s ease-in-out (fine pointers only). A gold span inside a link stays gold, but the underline is drawn in the link's colour (navy). No underline offset or thickness is set, so browser defaults apply. |
| `h2` containing spans | `h2:has(span)` resets `font-size`/`line-height` to **initial (16px / normal)** but keeps `tx-h2`'s weight 300 and `letter-spacing -.06em` (−0.96px). The visible size comes from the inner `span.tx-h3`: **60px / 61.8px, −2.4px** [36 / 38.016 / −0.72]. Light and bold halves are separate spans (`<strong><span class="tx-h3">`). Water-screen: a 3-line heading is 185.4 tall [114]. |
| lead paragraph | `p > strong > span.tx-h4`: **40px / 44px, −0.8px, 600** [30/32]. VW uses `p > span.tx-h4` (weight 300). |
| `ul` | `display:grid` (no gap), `padding-left 3rem`, font-size 1.4rem, but its `p` children are 16/24 again (li 24px tall each; the 4 items stack with no spacing) |
| bullet | `li::before`: 8×8 disc in `currentColor`, `top .9rem`, right edge 12px left of the text → water-screen bullets at x 116.6–124.6, y li+9 |
| `ol` | `counter(listCounter) "."` right-aligned 10px left of the text (not used on the measured pages) |

### 3.3 `b-content`
```html
<section class="b-content row">
  <div class=" column-16 lg-column-14 lg-offset-1">
    <div class="b-content__title m-titleContent">                   <!-- optional -->
      <h3 class=" tx-h3 -txcenter">An equipment of great reliability and stability</h3>
      <!-- seen: h2.tx-h2.-txcenter (with <strong>…<br></strong>), h2.tx-h4.-txcenter, p.tx-h5.-txcenter -->
    </div>
    <div class="m-textContent b-content__text -left"><p>…</p></div>
    <!-- -right | -center | -center -txcenter -->
  </div>
</section>
```
```css
/* site.pretty.css L4477-4511 */
.m-titleContent strong,.m-titleContent b {
  font-weight:600;
}
.b-content__title {
  margin-bottom:4rem;
}
@media only screen and (min-width: 1025px) {
  .b-content__title {
    margin-bottom:9rem;
  }
}
@media only screen and (min-width: 1025px) {
  .b-content__text.-left,.b-content__text.-right {
    width:50%;
  }
}
.b-content__text.-left {
  width:100%;
}
@media only screen and (min-width: 1025px) {
  .b-content__text.-center {
    width:57.1428571429%;
    margin-right:auto;
    margin-left:auto;
  }
}
@media only screen and (min-width: 1025px) {
  .b-content__text.-right {
    margin-left:auto;
    padding-left:1rem;
  }
}
.b-content.-blog .b-content__text.-center {
  width:100%;
}
```

| variant | desktop | measured |
|---|---|---|
| `-left` | **100%** of the column. The un-scoped `.b-content__text.-left{width:100%}` comes **after** the media rule with equal specificity, so it wins at every width. | water-screen navy block: x 106.6, **w 1211.9**, text 16/24 in 3 lines |
| `-right` | 50% + `margin-left:auto` + `padding-left 1rem` | x **712.5**, w 605.9 (text 595.9 from x 722.5) |
| `-center` | 57.143% centred | x **366.3**, w **692.5** (margins 259.7) |
| `-center -txcenter` | same, text centred | custom-made navy intro, VW intro |
| title | `margin-bottom 9rem` (90) [4rem]; `tx-h2` 80/80/−4.8 [40/40/−1.6], `tx-h3` 60/61.8/−2.4 [36/38.016/−0.72], `tx-h4` 40/44/−0.8 [30/32/−0.6], `tx-h5` 34/36.006 400 [22/26.4]; weight 300 (tx-h5: 400), `<strong>` 600 | water-screen: h3 61.8 tall, text at +151.8; h2 (2 lines) 160 tall, text at +250 |
| no title | the text alone (custom-made first block: `-center` paragraph, 72 tall, directly under the hero) | |

`-blog` (`b-content -blog`, blog template only): `-center` becomes 100% wide; `t-page__blocks.-blog > :first-child` gets `padding-top 12rem` [6rem]. Neither appears on these templates.

Frames: `ws_06_navy_content_images2.png`, `ws_09_content_right_images2.png`, `cm_01_content.png`, `ref_vw_01_content.png`, `ref_vw_13_content.png`.

### 3.4 `b-twoColumns__wrapper` (title + two text columns)
```html
<section class="row b-twoColumns__wrapper">
  <div class=" column-16 lg-column-14 lg-offset-1">
    <h5 class="b-content__title m-titleContent tx-h5 -txcenter"><strong>The composition of the Custom-made water show</strong></h5>
    <!-- seen: p.tx-h5.-txleft (dancing-fountain), h2.tx-h4.-txcenter (VW), h3.tx-h3.-txleft (custom-made) -->
    <div class="b-twoColumns -gap">
      <div class="b-twoColumns__left m-textContent"><p>…</p><ul>…</ul></div>
      <div class="b-twoColumns__right m-textContent"><p>…</p></div>
    </div>
  </div>
</section>
```
- Desktop: the title has `margin-bottom 9rem` (90). The grid is `repeat(2,1fr)` with gap **7.143%** (86.6), so the columns are **562.7** each, at x **106.6** and **755.8**.
- Paragraph gap is 22.5 (see 3.2). The columns top-align and the block height is the taller column.
- Measured heights:
  - Puy du Fou: 316.5 (h5 36 + 90 + 190.5)
  - VW: 252.5 (h2.tx-h4 44 + 90 + 118.5)
  - Custom-made (navy): 342.3 (h3 61.8 + 90 + 190.5)
  - Dancing-fountain (navy): 330 (p.tx-h5 2 lines 72 + 90 + 168; the columns are bullet lists of 7 items)
- 390: one column. `-gap` gives **4.4rem (44px)** between the stacked columns, and the title `margin-bottom` is 4rem.
- Frames: `ref_puy_04_row.png`, `ref_vw_09_row.png`, `cm_05_revert_bgnavy_clrwhite_row.png`, `df_05_revert_bgnavy_clrwhite_row.png`.

### 3.5 `b-images`
Three shapes (there is no 3-image variant):
```html
<!-- A. full-bleed -->
<section class="b-images -fullscreen">
  <div class="column-16">                                    <!-- + " -removeMargins" on 3 references -->
    <figure class="a-image js-image">
      <img class="a-image__image js-image-image" data-lazy … width="1867" height="1050" sizes="100vw">
    </figure>
    <div class="a-cloud"></div>                              <!-- or <div class="a-cloud -top"></div> -->
  </div>
</section>

<!-- B. one boxed image -->
<section class="b-images row">
  <div class="column-16 lg-column-14 lg-offset-1">
    <figure class="a-image js-image"><img class="a-image__image js-image-image -radius" … width="1920" height="1260" sizes="100vw"></figure>
  </div>
</section>

<!-- C. two images side by side -->
<section class="b-images row">
  <div class="b-twoColumns column-16 lg-column-14 lg-offset-1">
    <figure class="a-image js-image"><img class="a-image__image js-image-image -radius" … sizes="100vw, (min-width: 1025px) 48vw"></figure>
    <figure class="a-image js-image"><img class="a-image__image js-image-image -radius" …></figure>
  </div>
</section>
```
```css
/* site.pretty.css L4599-4627 */
.b-images>div {
  position:relative;
}
.b-images.-fullscreen .a-caption {
  text-align:center;
}
.b-images .b-twoColumns {
  gap:2rem;
}
@media only screen and (max-width: 1024px) {
  .b-images .b-twoColumns .a-caption {
    margin-bottom:2.4rem;
  }
}
@media only screen and (max-width: 1024px) {
  .b-images.-fullscreen .a-cloud {
    background-size:150% min(10rem,20%);
  }
}
.b-images .-removeMargins {
  margin-top:-3rem;
  margin-bottom:-3rem;
}
@media only screen and (min-width: 1025px) {
  .b-images .-removeMargins {
    margin-top:-6rem;
    margin-bottom:-6rem;
  }
}
```
```css
/* site.pretty.css L1767-1791 (optional caption; none on the measured pages) */
.a-caption {
  margin-top:1rem;
  color:#4f4f4f;
}
.-bgnavy .a-caption {
  max-width:23.5rem;
  margin-right:auto;
  margin-left:auto;
  color:#fff;
}
@media only screen and (min-width: 641px) {
  .-bgnavy .a-caption {
    max-width:35rem;
  }
}
@media only screen and (min-width: 1025px) {
  .-bgnavy .a-caption {
    max-width:50rem;
  }
}
@media only screen and (min-width: 641px) {
  .a-caption {
    margin-top:2rem;
  }
}
```

| shape | desktop | 390 |
|---|---|---|
| A `-fullscreen` | not a `.row`, so **0 → 1425 edge to edge**, no radius. Height = image aspect: water-screen 1867×1050 → **801.4** (section 801.6); dancing-fountain 1980×1402 → **1009.4**; Puy du Fou 1000×543 → 773.8. The cloud overlays it (2.3). | 390 wide: 219.3 tall (water-screen). The cloud is squashed (`150% min(10rem,20%)`) |
| A + `-removeMargins` | the inner div gets `margin: -6rem 0` [−3rem], so it eats half of each 12rem gap: the neighbouring blocks sit **60px** closer on each side (disney-dreams, dubai-national-day, furdenheim) | −30 each side |
| B one image | x 106.6, **w 1211.9**, radius 10; custom-made 1920×1260 → **795.3** tall | 362 wide (x 14), radius 10 |
| C two images | `b-twoColumns` grid `repeat(2,1fr)`, **gap 2rem** → two **595.9** columns (x 106.6 and 722.5); heights from aspect (water-screen 1024×768 → **447**, 1170×731 → **372.3**); radius 10 | one column, gap 20 → stacked 362×271.5 + 20 + 362×271.5 (section 563) |

- **Motion: none.** No `data-scroll`, no zoom, no parallax; only the lazy fade.
- The `img` elements sit in `.a-image` figures with no fixed aspect box, so before loading they reserve their height from the `width`/`height` attributes (`aspect-ratio: auto W / H`).
- Frames: `ws_04_images_fullscreen.png`, `ws_06_navy_content_images2.png`, `ws_09_content_right_images2.png`, `cm_11_images.png`, `df_03_images_fullscreen.png`, `ref_puy_03_images_fullscreen.png`.

### 3.6 `b-gallery` (4-up grid)
```html
<figure class="b-gallery row">
  <ul class="b-gallery__list column-16">
    <li class="b-gallery__el -radius">
      <img class="a-sImage js-image-image" data-lazy … width="2000" height="1383" sizes=" (max-width: 1024px) 50vw, 25vw">
    </li>
    … (always 4)
  </ul>
</figure>
```
```css
/* site.pretty.css L4570-4598 */
.b-gallery .a-sImage {
  -o-object-fit:cover;
  object-fit:cover;
  width:100%;
  height:100%;
}
.b-gallery__list {
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:1.4rem;
}
.b-gallery__list.-boxed {
  grid-template-columns:1fr;
  gap:2rem;
}
@media only screen and (min-width: 1025px) {
  .b-gallery__list.-boxed {
    grid-template-columns:repeat(2,1fr);
  }
}
@media only screen and (min-width: 1025px) {
  .b-gallery__list {
    grid-template-columns:repeat(4,1fr);
    gap:2rem;
  }
}
.b-gallery__el {
  aspect-ratio:335/236;
}
```
- **Wider than the other blocks.** The list is `column-16` with no offset, so it spans the full row content.
  - Desktop: x **20**, w **1385**. Four columns of **331.25**, gap **20**; each cell **331.3 × 233.3** (`aspect-ratio 335/236`), radius 10.
  - 390: x 14, w 362. Two columns of **174**, gap **14**; cells **174 × 122.6**; 2 rows (section 259.2).
- Images `object-fit: cover`, so portraits (VW 1466×2000) are cropped to the cell.
- No hover, no lightbox, no JS (no `data-module-gallery`; the `Gallery` module in the bundle belongs to other templates). No captions.
- Works on white (VW) and navy (custom-made, inside a `t-page__revert`).
- `-boxed` (not seen on these pages): 1 column (2 at ≥1025), gap 2rem.
- Frames: `ref_vw_10_gallery.png`, `cm_06_revert_bgnavy_clrwhite_gallery.png`, `m390_ref_vw_10_gallery.png`.

### 3.7 `b-separator`
```html
<div class="row"><hr class="b-separator"></div>
```
```css
/* site.pretty.css L65-71 + L4697-4700 */
hr {
  margin:0;
  border-width:.1rem;
  border-style:solid;
  border-color:#000;
  border-top:0;
}
.b-separator {
  width:100%;
  border-color:#cbcbcb;
}
```
- A 1px line in **`#cbcbcb`**, the full row content width: x 20, w **1385** (390: x 14, w 362). Height 1, drawn by the bottom border; the side borders are 1px too, which is invisible at this height.
- It is a grid child, so it has 12rem [6rem] above and below.
- Water-screen puts one before and one after the video. Dancing-fountain puts one between each of its 5 closing `b-textImage` blocks.
- Frames: `ws_09_content_right_images2.png` (the separator is below the image pair), `df_08_textImage_overlapping.png`.

### 3.8 Video (`section.row > .b-video.-radius`)
Same component as H 8 (placeholder, scrim, play pill, YouTube-nocookie inline player, `yc` module L7930-7962). Differences from the homepage band:

| | homepage band (H 8) | detail pages |
|---|---|---|
| wrapper | `section > .b-video.column-16` (no `.row`) | `section.row > .b-video.-radius.column-16.lg-column-14.lg-offset-1` |
| box | 1425 × 801.6, full-bleed, square corners | x **106.6**, **1211.9 × 681.7** (16:9), **radius 10px** with `overflow:hidden` (`.-radius`); 390: x 14, **362 × 203.6** |
| spacing | `t-home__separator` 10.5rem above | grid gap 12rem [6rem] (+ `b-separator` rows on water-screen) |
| cover | `img.b-video__cover.a-sImage.-cover` lazy, `object-fit: cover` | same |
| play pill | 88.6 × 41.2, centred | identical: centred at (712.5, 7902) on water-screen; hover `bg rgba(186,186,186,.1)` + `outline 1px #fff` over .4s `cubic-bezier(.23,1,.32,1)` (measured, frame `ws_10b_video_play_hover.png`) |
| variant | – | `b-video column-16` **without** `-radius` (fifa-world-cup, spectra): the homepage look inside a `.row`, i.e. **1385** wide at x 20 |

- There is no scroll animation.
- On navy (vidanta revert) the component is unchanged; the scrim and white pill already suit a dark background.
- Frames: `ws_10_video.png`, `ws_10b_video_play_hover.png`, `ref_vw_14_row_video.png`, `cm_15_row_video.png`, `m390_ws_10_video.png`.

### 3.9 `b-quote`
```html
<blockquote class="b-quote row">
  <div class="b-quote__icon column-16 lg-column-2 lg-offset-1">
    <svg aria-hidden="true" focusable="false" class="a-svg -quotemark"><use href="#icon-quotemark"/></svg>
  </div>
  <div class="b-quote__content column-16 lg-column-11">
    <p class="tx-h4 -tx600">We quickly understood that Volkswagen management wanted …</p>
    <footer class="b-quote__author">
      <img class="a-sImage js-image-image b-quote__portrait -radius" data-lazy … width="2000" height="2000">
      <div>
        <span class="tx-h5 -tx600">Fabrice Heitz</span><br>
        <span class="tx-uni14">Show designer</span>
      </div>
    </footer>
  </div>
</blockquote>
```
`#icon-quotemark` (13×13 viewBox, `fill="currentColor"`):
```html
<symbol fill="none" viewBox="0 0 13 13" id="icon-quotemark"><path d="M5.688 5.6V0H0v5.68C0 9.52 3.656 10 3.656 10l.488-1.12s-1.625-.24-1.95-1.52c-.325-.96.325-1.76.325-1.76h3.168ZM13 5.6V0H7.312v5.68c0 3.84 3.657 4.32 3.657 4.32l.487-1.12s-1.625-.24-1.95-1.52c-.325-.96.325-1.76.325-1.76H13Z" fill="currentColor"/></symbol>
```
```css
/* site.pretty.css L4662-4696 */
.b-quote__icon {
  margin-bottom:2.4rem;
  color:#c79d47;
}
@media only screen and (min-width: 1025px) {
  .b-quote__icon {
    display:flex;
    align-items:center;
    justify-content:flex-start;
    margin-top:.8rem;
  }
}
.b-quote__author {
  display:flex;
  flex-direction:row;
  gap:2.4rem;
  align-items:center;
  margin-top:8rem;
}
@media only screen and (min-width: 1025px) {
  .b-quote__author {
    margin-top:10rem;
  }
}
.b-quote__portrait {
  -o-object-fit:cover;
  object-fit:cover;
  width:6.4rem;
  height:6.4rem;
  border-radius:50%;
}
.b-quote .a-svg {
  width:8rem;
  height:8rem;
}
```
The quote text and name get weight 600 from the `.-tx600, .b-quote .tx-h4, .b-quote .tx-h5 …` list (L632-634, `!important`).

| part | desktop (VW, y 2043) | 390 |
|---|---|---|
| block | `.row`, h **340** | h 504 |
| icon column | `lg-column-2 lg-offset-1` → x 106.6, w **173.1**; flex column with `align-items:center` → the **80×80 gold (`#c79d47`)** mark is centred at x 153.1; `margin-top .8rem`, `margin-bottom 2.4rem` (still applied) | full width, flex column, `align-items:flex-start` → mark at x 14, 80×80, mb 24 |
| content column | `lg-column-11` (no offset) → x **279.7**, w **952.2** | x 14, w 362 |
| quote text | `p.tx-h4.-tx600`: **40px / 44px, −0.8px, 600**, left-aligned, inherited colour (navy on white, white on navy) | **30px / 32.01px, −0.6px**, 600 |
| author row | `margin-top 10rem` (100), flex, gap 2.4rem, centred vertically; h 64 | `margin-top 8rem` (80) |
| portrait | **64×64**, `border-radius 50%` (`.-radius` 10px is overridden), `object-fit: cover`, lazy | same |
| name | `span.tx-h5.-tx600` **34px / 36px, 600** | 22px / 26.4px |
| role | `span.tx-uni14` **14px / 21px, 400**, after a `<br>` | same |

- No quotation marks around the text beyond the icon. No animation.
- On navy (vidanta: inside a `t-page__revert`) only the inherited colours change; the icon stays gold.
- Frames: `ref_vw_03_quote.png`, `m390_ref_vw_03_quote.png`.

### 3.10 Image slider (`div.b-slider > section.m-slider.-keepOverflow.-drag`)

**Markup** (server HTML; `data-config` is read and then removed by JS)
```html
<div class="b-slider" data-scroll data-scroll-call="initModules,Website,website">
  <div class="row">
    <div class="column-14 offset-1 lg-column-12 lg-offset-2">
      <section class="m-slider -keepOverflow -drag" data-module-slider data-init-module
               data-config='{"loop":false,"align":"center","containScroll":"","controls":"true","autoplay":0,"tag":"ul","drag":true,"startIndex":1}'>
        <div class="m-slider__viewport" data-slider="viewport">
          <ul class="m-slider__container">
            <li class="m-slider__slide">
              <figure class="a-image js-image">
                <img src="…-600x-q80.webp" srcset="…600w, …1024w, …1440w, …1920w" sizes="90vw"
                     class="a-image__image js-image-image -radius" alt="…" width="1024" height="768">   <!-- eager: no data-lazy -->
              </figure>
            </li>
            … (4–10 slides)
          </ul>
        </div>
        <div class="m-draggerIcon" data-slider="drag">
          <div class="m-draggerIcon__circle" data-slider="dragIcon"><svg class="a-svg -dragging"><use href="#icon-dragging"/></svg></div>
          <p class="tx-ctasmall -tx500 -txupp">Swipe</p>
        </div>
        <div class="m-slider__controls">
          <div class="m-slider__controls--btn -prevBtn">
            <button class="a-buttonField a-buttonSlider flex-center -prev" data-slider=prevBtn type=button>
              <svg xmlns="http://www.w3.org/2000/svg" class="a-buttonSlider__border" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" stroke="currentColor"></circle></svg>
              <span class="sr-only">Previous</span>
              <svg aria-hidden="true" focusable="false" class="a-svg -arrow-down"><use href="#icon-arrow-down"/></svg>
            </button>
          </div>
          <div class="m-slider__controls--btn -nextBtn">
            <button class="a-buttonField a-buttonSlider flex-center -next" data-slider=nextBtn type=button>…<span class="sr-only">Next</span>…</button>
          </div>
        </div>
        <!-- no dots container: dots are off for this slider -->
      </section>
    </div>
  </div>
</div>
```
Every measured slider (water-screen, Puy du Fou, VW ×2, Vidanta) has exactly this config.

**CSS** (the generic `.m-slider`, dots, dragger and controls rules are quoted in H 6, L4310-4394 and L5244-5285; `.a-buttonSlider` in H 0.6, L1592-1635)
```css
/* site.pretty.css L4701-4755 */
.b-slider {
  --slider-border-color: #C79D47;
  --slider-icon-color: #00284D;
  overflow:hidden;
}
.-bgnavy .b-slider .a-caption {
  color:#fff;
  text-align:center;
}
.b-slider.-smallSlides .m-slider {
  --item-spacing: 2rem;
}
@media only screen and (min-width: 1025px) {
  .b-slider.-smallSlides .m-slider {
    --item-spacing: 10.9rem;
  }
}
.b-slider.-smallSlides .m-slider__slide {
  padding-left:var(--item-spacing);
}
.b-slider .m-slider__viewport {
  cursor:none;
}
.b-slider .m-slider__container {
  flex-flow:row nowrap;
}
.b-slider .m-slider__slide {
  flex:0 0 auto;
}
.b-slider .m-slider__slide figure,.b-slider .m-slider__slide img {
  width:auto;
}
.b-slider .m-slider__slide img {
  height:23.5rem;
}
@media only screen and (min-width: 641px) {
  .b-slider .m-slider__slide img {
    height:40rem;
  }
}
@media only screen and (min-width: 1025px) {
  .b-slider .m-slider__slide img {
    height:58.5rem;
  }
}
@media only screen and (min-width: 1025px) {
  .b-slider .m-slider {
    --item-size: 1.3;
  }
}
@media only screen and (min-width: 1367px) {
  .b-slider .m-slider {
    --item-size: 1;
  }
}
```
Navy variant: `.t-page__revert .b-slider { --slider-icon-color:#FFF; --slider-border-color:#FFF }` (L8062-8065). Measured on Vidanta: arrows white, static ring `::before` white at opacity .2, and the hover ring white (frame `ref_vid_slider_navy.png`).

**JS** (module `Xl`; the constructor and custom-cursor handlers L6569-6621 are quoted in H 6)
```js
/* site.pretty.js L6640-6675 */
    setOptions() {
        const t = {
            loop: !1,
            controls: !1,
            dots: !1,
            align: "start",
            autoplay: !1,
            direction: "ltr",
            startIndex: 0,
            skipSnaps: !1,
            watchSlides: !1,
            watchDrag: !1,
            onScroll: null,
            containScroll: "trimSnaps",
            inViewThreshold: .5,
            classes: !0,
            breakpoints: {}
        };
        try {
            const e = JSON.parse(this.el.dataset.config);
            return this.el.removeAttribute("data-config"), Object.assign(t, e)
        } catch {
            return t
        }
    }
    setPlugins() {
        const t = [];
        return this.options.autoplay && t.push(er({
            delay: Number(this.options.autoplay) * 1e3,
            stopOnInteraction: !0
        })), this.options.classes && t.push(ir({
            selected: "-inView",
            draggabble: "-draggable",
            dragging: "-dragging"
        })), t
    }
```
```js
/* site.pretty.js L6676-6699 */
    onSliderResize() {
        const t = this.slider.internalEngine().scrollSnaps.length > 1;
        if (this.el.classList[t ? "remove" : "add"]("-fixed"), this.isActive = t, t ? this.slider.reInit({
                active: !0,
                align: this.options.align,
                controls: this.options.controls,
                progress: this.options.progress
            }) : this.slider.reInit({
                active: !1,
                align: "center",
                controls: !1,
                progress: !1
            }), this.isDrag) {
            const {
                left: e,
                top: i
            } = this.el.getBoundingClientRect();
            this.position = {
                left: e,
                top: i,
                y: window.scrollY
            }
        }
    }
```
```js
/* site.pretty.js L6716-6749 */
    setControls() {
        if (!this.options.controls) return;
        const t = this.disablePrevAndNextBtns.bind(this);
        this.slider.on("select", t).on("init", t), this.events.click.nextBtn = "scrollNext", this.events.click.prevBtn = "scrollPrev", this.scrollNext = this.slider.scrollNext, this.scrollPrev = this.slider.scrollPrev
    }
    setDots() {
        if (!this.options.dots) return;
        const t = this.setSelectedDotBtn.bind(this);
        this.slider.on("select", t).on("init", t), this.events.click.dot = "selectDotBtn", this.generateDotBtns()
    }
    generateDotBtns() {
        const t = document.querySelector("#dotTemplate").innerHTML,
            [e] = this.$("dotsContainer"),
            i = this.slider.scrollSnapList().reduce((n, s, o) => {
                const l = t.replace('data-index=""', `data-index="${o}"`);
                return n + l
            }, "");
        e.innerHTML = i
    }
    selectDotBtn(t) {
        const e = Number(t.currentTarget.dataset.index);
        this.slider.scrollTo(e)
    }
    setSelectedDotBtn() {
        const t = this.slider.previousScrollSnap(),
            e = this.slider.selectedScrollSnap(),
            i = this.$("dot");
        i[t] && i[t].classList.remove("-active"), i[e] && i[e].classList.add("-active")
    }
    disablePrevAndNextBtns() {
        const t = this.$("prevBtn"),
            e = this.$("nextBtn");
        this.slider.canScrollPrev() ? t[0].removeAttribute("disabled") : t[0].setAttribute("disabled", "disabled"), this.slider.canScrollNext() ? e[0].removeAttribute("disabled") : e[0].setAttribute("disabled", "disabled")
    }
```
- **Embla** (v7) library defaults (L6174-6191): `align:"center"`, `containScroll:""`, `dragFree:false`, `draggable:true`, `loop:false`, `skipSnaps:false`, **`speed:10`**, `slidesToScroll:1`.
- `Ht = () => window.innerWidth < 1025` (L2232) disables the custom cursor handlers below 1025. Touch/mouse drag itself still works there.
- The ClassNames plugin adds `-inView` to the selected slide, `is-draggable` to the viewport (the misspelt `draggabble` key means the default name is kept) and `-dragging` while dragging. No CSS targets `.m-slider__slide.-inView`, so there is **no active-slide styling**.
- `-fixed` is added when there is only one snap (not seen).

**Geometry** (desktop 1425; the column is `lg-column-12 lg-offset-2` → x **193.1**, w **1038.8**)

| part | value |
|---|---|
| block | `.b-slider` `overflow:hidden`, full page width; height **727** = 585 + 52 + 90 |
| viewport | x 193.1, w 1038.8, h **585**; `cursor:none` |
| slides | `flex: 0 0 auto`, `padding-left 2rem` (20); container `margin-left -2rem` |
| image | **height 58.5rem = 585**, width auto from its aspect (1024×768 → **780**, 1024×682 → 878.3, 1000×1000 → **585**, 2000×741 → 1235.2); radius 10; no shadow |
| gap between images | 20 (the slide padding) |
| alignment | `align:"center"`, `containScroll:""`: the **selected image is centred on the column centre (x 712.5)**, and the neighbours peek out on both sides, clipped only by the page edge (`-keepOverflow` + `.b-slider{overflow:hidden}`) |
| start | `startIndex:1`, so the **2nd** image is centred on init (water-screen rest `translateX(-719.8px)`; Puy du Fou −847.6; VW −1077.7 and −816.9) |
| first slide | Prev takes it to `translateX(+129.4px)`: image 1 centred, **empty white space to its left** (no trimming). Prev gets `disabled` → **opacity .3**, `cursor:not-allowed` (`.m-slider__controls button[disabled]`, .15s ease-in-out) (frames `ws_12g_slider_first_slide_prev_disabled.png`, `ref_puy_05b_slider_first_prev_disabled.png`) |
| last slide | Next is disabled the same way (`ws_12f_slider_last_slide_next_disabled.png`; container −5146.5 on the 7th of 7) |
| loop / dots / autoplay | none / none / none |
| controls | `.m-slider__controls`: flex, centred, **gap 2.4rem**, **margin-top 5.2rem** → two **90×90** `a-buttonSlider` rings at x **610.5** and **724.5**, y = viewport bottom + 52. Ring `#c79d47` (static `::before` 2px at .2 opacity, SVG arc draws in on hover over 3s, H 0.6), arrows `#00284d` 24px (`arrow-down` rotated ±90°) |
| cursor | custom 70px "SWIPE" circle following the mouse (H 6): `.m-slider.-hover` shows it, `-dragging` scales it to .8 (frames `ws_11b_slider_hover_cursor.png`, `ws_11c_slider_middrag.png`) |

**Motion (measured, water-screen)**
- **Next click**: translateX −719.8 → **−1569.0** (Δ = half of image 2 + 20 + half of image 3 = 849.2). Samples:

  | t (ms) | translateX |
  |---|---|
  | 43 | −1067.5 (41%) |
  | 85 | −1302.5 (69%) |
  | 129 | −1427.3 (83%) |
  | 168 | −1493.7 (91%) |
  | 210 | −1529 (95%) |
  | 300 | −1557.7 (99%) |
  | ≈600 | settled |

  Embla's `speed:10` spring is roughly an exponential ease-out with a ≈45ms half-life.
- **Prev click** (to the first slide): −719.8 → +129.4. Samples:

  | t (ms) | translateX |
  |---|---|
  | 30 | −489.7 |
  | 58 | −276.8 |
  | 114 | −45.5 |
  | 197 | +80 |
  | 308 | +120.2 |
  | ≈600 | settled |

- **Drag**: the track follows the pointer 1:1 (dragged 300px → −1019.8). Released slowly, it snaps **back** to the nearest snap (−719.8), because 300px is less than half the distance to the next snap. Samples:

  | t (ms) | translateX |
  |---|---|
  | 66 | −925.5 |
  | 149 | −786.1 |
  | 232 | −741.2 |
  | 358 | −723.7 |
  | ≈650 | settled |

  Frames `ws_11c_slider_middrag.png`, `ws_11d_slider_release_0300ms.png`, `ws_11e_slider_settled.png`.
- The slide images are **eager** (inline `src`), so they have no lazy fade.
- The module is created only when `.b-slider` first enters the viewport (`initModules`, no repeat). Before that, the strip sits unshifted at slide 1.

**390**
- Column `column-14 offset-1` → x **36.6**, w **316.8**. Images are **235** tall (23.5rem; 40rem from 641px).
- The centred image is wider than the column (1024×682 → 352.9), so it spans x 18.6–371.4. The neighbours start 20px beyond the screen edges, so **only one image is visible**.
- Controls are the same 90px rings at x 93 / 207, y = viewport bottom + 52. Block height **377**.
- No custom cursor. Swipe follows the finger and snaps back the same way (frames `m390_ws_11_slider.png`, `m390_ws_11c_slider_middrag.png`, `m390_ws_11e_slider_settled.png`).

### 3.11 `b-push`: "See also" products slider and the single CTA card

#### A. Products slider (last block on every page)
```html
<div class="b-push -border" data-scroll data-scroll-call="initModules,Website,website"
     data-module-products-filter="productsFilter" data-module-products>
  <div class="row -xl">
    <div class="column-16 lg-column-14 lg-offset-1">
      <p class="tx-h5 b-push__suptitle">See also</p>                <!-- references: "Discover our services" -->
      <div class="b-push__product" data-module-products="products">
        <section class="m-sliderProducts -keepOverflow -drag" data-module-slider data-init-module data-products-filter=slider
                 data-config='{"size":{"value":null},"space":{"value":null},"loop":false,"dots":true,"autoplay":0,"tag":"ul","drag":true}'>
          <div class="m-slider__viewport" data-slider="viewport">
            <ul class="m-slider__container" data-products-filter=content>
              <li class="m-sliderProducts__slide"><a href="/en/our-services/…" data-products="product">
                <div class="m-sliderProducts__slideInner -radius"> … same card as H 6 … </div></a></li>
              … (10 cards)
            </ul>
          </div>
          <div class="m-draggerIcon" data-slider="drag">…Swipe…</div>
          <div class="m-slider__dots flex-center" data-slider="dotsContainer"></div>
        </section>
      </div>
    </div>
  </div>
</div>
```
```css
/* site.pretty.css L3659-3662 + L3682-3708 */
.b-push {
  overflow:hidden;
  width:100%;
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
```
```css
/* site.pretty.css L4234-4254 (item size for this slider; the card itself is H 6) */
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

| | homepage products slider (H 6) | detail "See also" |
|---|---|---|
| top rule | – | `.row::before`: **1px `#cbcbcb`** line, `width: calc(100% - 4rem)` = **1385**, centred, at the block top (y 9331.3 on water-screen) |
| row | `.row.-xl` + centred title column | `.row.-xl`, `padding-top 8.2rem` (82) [4.4rem]; column `lg-column-14 lg-offset-1` → x **106.6**, w **1211.9** |
| title | `h2.tx-h3` "Our products", centred, + paragraph, category selector, CTA | **`p.tx-h5.b-push__suptitle`**: **34px / 36px, 400**, navy, **left-aligned**, `margin-bottom 4.8rem` [3.2rem]. No paragraph, no filter UI, no CTA |
| `--item-size` / `--item-spacing` | 4.5 / 1.5rem | **4** / **2rem** (the `.m-sliderProducts` defaults; there is no `.o-homeProducts` override here) |
| slide / card | 311.1 / **296.1 × 444.2** | slide **308** (25% of 1231.9), card **288 × 432** (aspect 320/480), radius 10 |
| card content | tags, `h2.tx-h4` 40/44, `p.tx-uni14` | identical (tags 19 tall with blur .4rem; title 40/44/−0.8, 300 + strong 600; subtitle 14/21) |
| overflow | section clips | `-keepOverflow`, so cards bleed past the column **on both sides** up to the page edge (`.b-push{overflow:hidden}`); at the last snap, cards show to the left of x 106.6 |
| snaps | `align:start`, `trimSnaps` | same defaults. Snaps = cards − 3 at 4 per view (water-screen: 10 cards → **7 snaps / 7 dots**). Last snap `translateX(-1847.8px)` = total slide width 3080 − container 1231.9. With 4 cards or fewer there is one snap, so the module adds `-fixed` and re-inits inactive with `align:center` |
| dots | absolute `top: calc(100% + 5rem); left:0` | **in flow, centred** (`.m-slider__dots.flex-center`, `margin-top 3rem`) → 7 dots from x 672.5, y = viewport bottom + 30 (9959). Viewport height 432, slider 467 |
| dot style | 5px, `#4f4f4f` .2; active 14px, opacity 1 | same; the width transition waits **.6s** (measured: 5px until 612ms, 8.5 at 669, 12.6 at 754, 13.9 at 897, 14 at 1036) |
| hover video, drag cursor | yes | yes, identical (frame `ws_13b_push_card_hover_cursor.png`) |
| block height | – | **753** desktop (82 + 36 + 48 + 467 + 120 bottom padding as last child); 673.3 at 390 |

- **Dot click** (to the last dot): 0 → −1847.8. Samples:

  | t (ms) | translateX |
  |---|---|
  | 74 | −500.8 |
  | 134 | −964 |
  | 204 | −1467.4 |
  | 296 | −1740.4 |
  | 408 | −1827.9 |
  | ≈750 | settled |

  Frames `ws_13e_push_lastdot_0250ms.png`, `ws_13f_push_lastdot_settled.png`.
- **Drag**: 350px drag, release → settles on −308 (one card). Samples:

  | t (ms) | translateX |
  |---|---|
  | 43 | −331.8 |
  | 127 | −315.7 |
  | 315 | −309.4 |
  | ≈550 | settled |

  Frames `ws_13c_push_middrag.png`, `ws_13d_push_settled.png`.
- **Card set**: a CMS-picked list of other services, never the current page. Counts measured: water-screen 10, dancing-fountain 10, VW 8, Puy du Fou 7, custom-made 5, Vidanta 5. So desktop dots = 7, 7, 5, 4, 2, 2, and 390 dots = the card count.
- **390**:
  - `--item-size 1.1` → slide 90.9% (347.3), card **327.3 × 490.9**; the next card peeks 28.7px at the right edge.
  - 10 snaps / **10 dots**, centred (x 138.5–249.5).
  - Suptitle **22px / 26.4px**; row padding-top 44; bottom padding 45.
  - No custom cursor.
  - Frames `m390_ws_13_push_see_also.png`, `m390_ws_13b_push_dots.png`.

#### B. Single CTA card (`b-push__single`, references only)
```html
<div class="b-push -border">
  <div class="row">
    <div class="column-16 lg-column-14 lg-offset-1">
      <div class="b-push__single flex-center -radius">
        <div class="b-push__content -txcenter">
          <h4 class="tx-h2 b-push__title">Discover</h4>
          <a class="a-buttonField a-button -primary -bggold -clrwhite b-push__button -txupp tx-uni11"
             href="/en/our-references/aquatique-show-leading-water-show-company-in-germany">
            <span class="a-buttonField__text tx-cta"> more projects in Germany</span>
          </a>
        </div>
        <img class="a-sImage js-image-image -cover b-push__cover -radius" data-lazy … width="2000" height="1333" sizes="80vw">
      </div>
    </div>
  </div>
</div>
```
```css
/* site.pretty.css L3709-3756 */
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

| part | desktop (VW, block y 8783.2, h 633.8) | 390 |
|---|---|---|
| row | plain `.row` (max 1440), `padding-top 8.2rem` + the same 1px `#cbcbcb` top rule | padding-top 44 |
| card | x 106.6, **1211.9 × 551.8**, `padding 19rem 4rem`, bg black `#0c0a09`, radius 10, flex centred | 362 × 484.8, `padding 20rem 4rem 14.5rem` |
| cover | `img.-cover`: absolute full size, `object-fit: cover`, z 0, radius 10, lazy fade | same |
| scrim | `::before` z 1: flat `rgba(0,0,0,.5)` **plus** bottom darkening `rgba(0,0,0,.6)` 22.85% → transparent 38.22% | same |
| content | z 2, centred, `max-width 57.143%` (shrink-wraps here: 278.5 wide) | no max-width (243.8) |
| title | `h4.tx-h2.b-push__title`: **80px / 80px, −4.8px, weight 600**, white, `margin-bottom 2.4rem` | **40px / 40px, −1.6px**, `margin-bottom 3.2rem` |
| button | `a-button -primary -bggold`: gold `#c79d47` pill, radius 44px, `padding 13.5px 25px`, h **43.8**, label `tx-cta` **14px / 16.8px, 600**, uppercase, white; `margin-top 2.4rem`. Hover (H 0.6): the label's side padding grows 0 → 8px over **1s `cubic-bezier(.23,1,.32,1)`** (button 244.3 → 259.8 wide, still centred) | same button |
| spacing | the next block (products push) follows after the normal 12rem gap, with its own top rule | – |

- No hover on the card or image; only the button reacts.
- Frames: `ref_vw_15_push_border.png`, `ref_vw_15b_push_single_button_hover_0150ms.png`, `ref_vw_15c_push_single_button_hover_1000ms.png`, `m390_ref_vw_15_push_border.png`.

## 4. Breadcrumb and prefooter on these templates

- **Breadcrumb**: always the **default white variant** from I 10.1 (bg `#fff`, `border-top 1px #ececec`, links `#a8a8a8` 14px / 16.8px, "/" separators, `padding 3rem 0`). It follows `t-page__blocks` directly.
  - The `b-push` above it is the last grid child, so its `padding-bottom:12rem` (4.5rem at 390) is the white space above the breadcrumb (2.2).
  - Three items:

| template | item 1 | item 2 | item 3 (current, `aria-current`, not styled differently) |
|---|---|---|---|
| service | Home → `/en` | Our services → `/en/our-services` | page title, e.g. "Water screen" |
| reference | Home | Our references → `/en/our-references` | the page's **meta title**, not the h1: "Les Noces de Feu - Park of Puy du Fou" (h1 is "Les Noces de Feu / Puy du Fou") |

- Geometry: desktop **77.8 tall**, `ol` at x 106.6 (for example, water-screen y 10084.2).
  - At 390 a long third label **wraps** onto a second line. The `ol` row gap is 3rem, so Puy du Fou's bar is **124.6** tall; the third link sits at y +46.8 below the first row.
- **Prefooter**: **none** on either template. It is absent on all 5 measured pages and in all 62 scanned reference HTML files (no `o-prefooter`). `footer.o-footer` (H 12) follows the breadcrumb directly: desktop h 1009.5, 390 h 1589.7.
- Frames: `ws_14_breadcrumb_footer.png`, `ref_puy_99_breadcrumb_footer.png`, `m390_ref_puy_99_breadcrumb_footer.png` (wrapped), `m390_ws_14_breadcrumb_footer.png`.

## 5. Scroll and entrance animations (summary)

| what | trigger | animation | source |
|---|---|---|---|
| hero title | load (`is-inview`) | Title module line split + `.m-hero__title` `enter-y` 2s `cubic-bezier(.23,1,.32,1)` | I 1.6 |
| hero category tags and reference tags | `.m-hero.is-inview` | `enter-popin-up` **1s** `cubic-bezier(.23,1,.32,1)` **1s delay**: opacity 0→1, `translateY(3rem)`→0 | 1.5 |
| hero background / smoke video | `togglePlay` on enter/leave | play/pause only (the reference hero is a still image) | I 10.9 |
| content blocks (`b-textImage`, `b-content`, `b-images`, `b-gallery`, `b-quote`, `b-video`, `b-twoColumns__wrapper`) | – | **none**: no reveal, no stagger, no parallax (no `data-scroll-speed`), no zoom | verified in HTML and CSS |
| lazy images (all block images except the `b-slider` slides, whose `src` is inline) | vanilla-lazyload `-loaded` | `opacity 0 → 1`, **.15s ease-in-out** | I 10.6 |
| white/navy colour | – | static backgrounds; no colour tween between sections | 2 |
| header dark UI | Locomotive `toggleDarkUi` enter/leave | `body.-dark` toggled in rAF (header transitions per H 1) | 2.4 |
| `b-slider`, `b-push` modules | `data-scroll-call="initModules,Website,website"` (**no** `data-scroll-repeat`, so it runs once when the block first enters the viewport) | Embla is created then. The image slider jumps to `startIndex:1` at that moment, while its top edge is at the viewport bottom, so the jump is barely visible | 3.10 |
| slider snap | drag release / arrow / dot | Embla `speed: 10` physics (≈0.6s ease-out; samples in 3.10) | 3.10 |
| drag cursor | `mouseenter`/`mousemove` (≥1025 only) | H 6 | 3.10 |
| hover | – | rich-text links colour .25s; play pill .4s; slider ring 3s; card video .1s/.3s; gold button (H 0.6) | 3.x |
| page change | Barba | I 9 | – |

---

## 6. 390 layout of every block
Viewport 390×844. `.row` padding is `0 1.4rem`, so the content column is **x 14, w 362** (`column-16`). The grid gap between blocks is **6rem (60)**. All values were measured.

### 6.1 Hero
- `-cloud` below 1025 is content-driven: `padding 16.2rem 0 48rem`, no `min-height`.
- **Service** (water-screen), height **898.2**:
  - wrapper y 162 (tag 19, `margin-bottom 2rem`)
  - title 56px / 47.6px / −2.24px (2 lines + 24 padding = 119.2), `.m-hero__title` `margin-bottom 3.2rem`
  - scroll cue `position:relative; margin-top 3.2rem` (y 384.2, h 34)
  - then the 480px bottom padding
- **Reference** (no cue):
  - Puy du Fou **981.7**: 3-line title 166.8; reference pills stacked in a column (gap 16, `margin-top .8rem`), both stretched to the widest pill (189.9); x 100.1.
  - VW **1035.7**: 3 category tags stacked (column, gap 8) → title at y 255.
- The background video/image covers the whole section. The smoke video is `height 50rem; width auto` (I 1.3), y 398 → 900 on water-screen.
- Frames: `m390_ws_00_hero.png`, `m390_ref_puy_00_hero.png`, `m390_ref_vw_00_hero.png`, `m390_cm_00_hero.png`, `m390_df_00_hero.png`.

### 6.2 Wrapper and seams
- Gap 60. The last child has `padding-bottom 4.5rem`.
- Navy reverts: `padding 3rem 0`, margins −3rem.
- Seams: `.a-cloud.-height` **150 tall**, `background-size: cover`, margin-top −5rem; `-top.-height` margins −3rem / −5rem. Each seam overlaps its revert by 20px (2.3).
- Frames `m390_ws_05_fullscreen_to_navy_cloud.png`, `m390_ws_08_navy_to_white_cloud.png`.

### 6.3 `b-textImage`
- One column; `-revert` has **no effect** (the `order:1` rule is desktop-only), so text always comes first and images follow.
- Title: `tx-h2` **40px / 40px, −1.6px** (`tx-h3` 36 / 38.016 / −0.72), `margin-bottom 4.5rem`.
- Text column `margin-bottom 3rem`. `.m-textContent` gap **22.5**; heading spans `tx-h3` 36 / 38.016; lead `tx-h4` 30 / 32.
- Images wrapper 362 wide:
  - `-overlapping` image 1: **80% = 289.6**, left
  - image 2: **60% = 217.2**, `margin-top -9rem` (overlaps by 90), right-aligned (x 158.8)
  - image 3: **40% = 144.8**, `margin-top -4.5rem`, `margin-left 20%` (72.4) → x 86.4
  - plain: 100% (362), stacked with gap 22.5
- Heights: water-screen 1038.4 / 773.1 / 501.9 / 488.5; dancing-fountain plain block 862 (image 362×241.4).
- Frames `m390_ws_02_textimage_overlap_revert.png`, `m390_ws_02b_textimage_images.png`, `m390_ws_03_textimage_list.png`, `m390_ws_03b_textimage_images.png`, `m390_ws_07_navy_textimage.png`, `m390_ws_07b_navy_textimage_revert.png`, `m390_df_01_textImage.png`, `m390_ref_vw_02_textImage_overlapping.png`.

### 6.4 `b-content`
- Title `margin-bottom 4rem`; `tx-h2` 40/40, `tx-h3` 36/38.016, `tx-h4` 30/32.01, `tx-h5` 22/26.4.
- Every text variant (`-left`, `-right`, `-center`) is **100%** (362).
- Water-screen: navy block 332 (h3 76 + 40 + text 216); white block 288.
- Custom-made: intro `-center` 120 tall; navy `-center -txcenter` title h2 3 lines (120) + 40 + 48.
- Frames `m390_ws_06_navy_content_images2.png`, `m390_ws_09_content_right_images2.png`, `m390_cm_01_content.png`.

### 6.5 `b-images`
- `-fullscreen`: 390 wide, height by aspect (water-screen **219.3**, dancing-fountain 276.1, Puy du Fou 212). The cloud is squashed to `150% min(10rem,20%)`.
- Single: 362 wide, radius 10 (custom-made 237.6).
- Pair: stacked, gap **20** (water-screen 563 = 271.5 + 20 + 271.5; 472.3).
- Frames `m390_ws_04_images_fullscreen.png`, `m390_cm_11_images.png`, `m390_df_03_images_fullscreen.png`, `m390_ref_puy_03_images_fullscreen.png`.

### 6.6 `b-twoColumns__wrapper`
- Title `margin-bottom 4rem`; `tx-h5` 22/26.4, `tx-h4` 30/32.01.
- Columns stacked with **gap 4.4rem (44)**; paragraph gap 22.5.
- Dancing-fountain: 559 (title 79.2 + 40 + 168 + 44 + 168 + padding). VW: 442.
- Frames `m390_ref_puy_04_row.png`, `m390_ref_vw_09_row.png`, `m390_df_05_revert_bgnavy_clrwhite_row.png`, `m390_cm_05_revert_bgnavy_clrwhite_row.png`.

### 6.7 `b-gallery`
- 2×2 grid, cells **174 × 122.6**, gap **14**, radius 10; block **259.2** (VW) / 319 inside a revert (custom-made, incl. 60 padding).
- Frames `m390_ref_vw_10_gallery.png`, `m390_cm_06_revert_bgnavy_clrwhite_gallery.png`.

### 6.8 `b-separator`
- x 14, w 362, 1px `#cbcbcb`, with 60 above and below.

### 6.9 Video
- **362 × 203.6**, radius 10. The play pill is the same 88.6 × 41.2, centred.
- Frames `m390_ws_10_video.png`, `m390_ref_vw_14_row_video.png`.

### 6.10 `b-quote`
- One column: the 80px gold mark sits **left** (x 14) with 24 below it.
- Quote **30px / 32.01px, −0.6px, 600**; author row `margin-top 8rem`; name 22px / 26.4px 600; role 14/21; portrait 64.
- VW block **504**.
- Frame `m390_ref_vw_03_quote.png`.

### 6.11 Image slider
- Column x 36.6, w 316.8. Images **235** tall; only the centred image is visible (3.10).
- Rings 90×90 at x 93 / 207 with `margin-top 5.2rem`. Block **377**. No cursor.
- Frames `m390_ws_11_slider.png`, `m390_ws_11c_slider_middrag.png`, `m390_ws_11e_slider_settled.png`, `m390_ref_puy_05_slider.png`, `m390_ref_vw_06_slider.png`.

### 6.12 Push
- **Products**: row padding-top 44; suptitle 22 / 26.4, `margin-bottom 3.2rem`; cards **327.3 × 490.9** (item-size 1.1) with the next card peeking; dots = one per card, centred, `margin-top 3rem`; block **673.3** (incl. 45 bottom padding).
- **Single**: card 362 × **484.8**, `padding 20rem 4rem 14.5rem`; title 40/40 600, `margin-bottom 3.2rem`; block 528.8.
- Frames `m390_ws_13_push_see_also.png`, `m390_ws_13b_push_dots.png`, `m390_ref_vw_15_push_border.png`, `m390_ref_vw_16_push_border.png`.

### 6.13 Breadcrumb / footer
- `ol` x 36.6 (`offset-1`). Long labels wrap: row gap 30, so Puy du Fou is 124.6 tall; otherwise 77.8.
- Footer h **1589.7**.
- Frames `m390_ws_14_breadcrumb_footer.png`, `m390_ref_puy_99_breadcrumb_footer.png`.

### 6.14 Dark UI at 390 (water-screen, 150px steps)
| scrollY | `-dark` |
|---|---|
| 0–150 | off |
| 300–2250 | on |
| 2400–3600 | off |
| 3750–3900 | on |
| 4050–4200 | off |
| 4350–7650 | **on** (again over the navy run, same "last event wins" glitch as 2.4) |
| ≥ 7800 | off |

---

## 7. Page-by-page block order and differences
Notation: `y/h` in document px. **N** = inside a navy `t-page__revert`. `cloud↓` = `.a-cloud.-bgnavy.-top.-height` (white → navy). `cloud↑` = `.a-cloud.-bgnavy.-height` (navy → white).

### 7.1 `/en/our-services/water-screen` (primary). Doc **11172** (390: 9568)
| # | block | desktop y/h | 390 y/h | notes |
|---|---|---|---|---|
| – | hero (video, 1 tag `-aquatique`, scroll cue) | 0/1260 | 0/898 | |
| 1 | textImage `-overlapping`, title h2 `-txcenter`, `-revert`, 2 images | 1260/769 | 898/1038 | |
| 2 | textImage `-overlapping`, h2 spans + bullet list, 2 images | 2149/512.4 | 1997/773 | |
| 3 | images `-fullscreen` + in-image `.a-cloud` (bottom) | 2781.4/801.6 | 2830/219 | |
| 4 | cloud↓ | 3673/350 | 3079/150 | |
| 5 | **N** content (h3 `-txcenter`, text `-left`) | 4023/343.8 | 3209/392 | |
| 6 | **N** images pair | 4366.8/567 | 3601/623 | |
| 7 | **N** textImage (2 images) | 4933.7/587.2 | 4224/562 | |
| 8 | **N** textImage `-revert` (1 image) | 5520.9/491.4 | 4786/548 | |
| 9 | cloud↑ | 6012.3/350 | 5314/150 | |
| 10 | content (h2 `-txcenter`, text `-right`, one link) | 6482.3/346 | 5524/288 | |
| 11 | images pair | 6948.3/372.3 | 5872/472 | |
| 12 | separator | 7440.6/1 | 6405/1 | |
| 13 | video `-radius` | 7561.6/681.7 | 6466/204 | |
| 14 | separator | 8363.3/1 | 6730/1 | |
| 15 | image slider (7 slides) | 8484.3/727 | 6791/377 | |
| 16 | push "See also" (10 cards, 7 dots) | 9331.3/753 | 7228/673 | |
| – | breadcrumb / footer | 10084.2/77.8, 10162/1009.5 | 7900.9/77.8, 7978.7/1589.7 | no prefooter |

### 7.2 `/en/our-services/custom-made-water-show`. Doc **11246** (390: 9594)
| # | block | desktop y/h | 390 y/h |
|---|---|---|---|
| – | hero (video, 1 tag `-fontaine`) | 0/1260 | 0/898 |
| 1 | content, **no title**, text `-center` | 1260/72 | 898/120 |
| 2 | textImage `-overlapping`, title h2 `-txcenter` (1 line), 2 images | 1452/651.1 | 1078/830 |
| 3 | cloud↓ | 2193.1/350 | 1938/150 |
| 4 | **N** content (title h2, text `-center -txcenter`) | 2543.1/394 | 2068/268 |
| 5 | **N** twoColumns wrapper (h3.tx-h3 `-txleft`) | 2937.1/462.3 | 2336/698 |
| 6 | **N** gallery (4) | 3399.4/353.3 | 3035/319 |
| 7 | cloud↑ | 3752.8/350 | 3334/150 |
| 8 | textImage, title h2 **`-txleft`** | 4222.8/734.1 | 3544/994 |
| 9 | content, no title, `-center` | 5076.9/48 | 4598/72 |
| 10 | cloud↓ **with no navy block after it**: the band ends hard, then 60px of white, then a **white** single image | 5214.9/350 | 4700/150 |
| 11 | images single (1920×1260, radius) | 5624.9/795.3 | 4860/238 |
| 12 | textImage, title **h3.tx-h3** `-txcenter`, `-revert` | 6540.2/715.7 | 5157/736 |
| 13 | cloud↓ | 7345.8/350 | 5923/150 |
| 14 | **N** textImage (title h2 `-txleft`) followed by **no cloud↑**: hard navy edge, 60px white | 7695.8/848.2 | 6053/906 |
| 15 | video `-radius` | 8604/681.7 | 6989/204 |
| 16 | push (5 cards → 2 dots) | 9405.7/753 | 7253/673 |
| – | breadcrumb / footer | 10158.7 / 10236.5 | 7926.3 / 8004.1 |

Differences from water-screen:
- Starts with a `b-content` intro instead of a text-image.
- Has a gallery and a two-column text block.
- Has **three** white→navy seams, with two unmatched: the CMS omitted the navy→white seam (frames `cm_10_cloud_bgnavy_top_height.png`, `cm_15_row_video.png`).
- No fullscreen image, no slider, no separators.
- Dark UI: off 1650–2850, on 3000–6750, off 6900–8400, on 8550–9900.

### 7.3 `/en/our-services/dancing-fountain`. Doc **11410** (390: 10214)
| # | block | desktop y/h | 390 y/h |
|---|---|---|---|
| – | hero (video, `-fontaine`) | 0/1260 | 0/898 |
| 1 | textImage **plain** (no `-overlapping`), title h2, `-revert`, 1 image at 100% | 1260/670 | 898/862 |
| 2 | textImage `-overlapping`, 1 image | 2050/316.1 | 1821/488 |
| 3 | images `-fullscreen` + `.a-cloud` (bottom) | 2486.1/1009.4 | 2369/276 |
| 4 | cloud↓ | 3585.5/350 | 2675/150 |
| 5 | **N** twoColumns wrapper (`p.tx-h5.-txleft`, two 7-item lists) | 3935.5/450 | 2805/559 |
| 6 | **N** textImage | 4385.5/438 | 3364/498 |
| 7 | cloud↑ | 4823.5/350 | 3842/150 |
| 8–16 | 5 × textImage `-overlapping`, each separated by a `b-separator` row | 5293.5 … 8647.9 | 4052 … 7550 |
| 17 | video `-radius` | 8767.8/681.7 | 7610/204 |
| 18 | push (10 cards) | 9569.5/753 | 7873/673 |
| – | breadcrumb / footer | 10322.5 / 10400.3 | 8546.4 / 8624.2 |

Differences: the only measured page with a **plain** text-image and with separators used as dividers between text-images (a "catalogue" rhythm). No slider.

### 7.4 `/en/our-references/puy-du-fou` (reference). Doc **7476** (390: 6780)
| # | block | desktop y/h | 390 y/h |
|---|---|---|---|
| – | hero (**still image**, `-fontaine` tag, h1 bold first line, **City / Since pills**, no scroll cue) | 0/1260 | 0/981.7 |
| 1 | textImage `-overlapping` `-revert`, lead `p>strong>span.tx-h4` | 1260/596.4 | 982/812 |
| 2 | textImage `-overlapping` | 1976.4/560 | 1854/833 |
| 3 | images `-fullscreen` + **`.a-cloud.-top`** (the image fades in from white at its top; hard bottom edge) | 2656.4/773.8 | 2747/212 |
| 4 | twoColumns wrapper (`h5.tx-h5.-txcenter` bold) | 3550.2/316.5 | 3018/614 |
| 5 | image slider (4 slides incl. a 1:1 image 585×585) | 3986.7/727 | 3692/377 |
| 6 | video `-radius` | 4833.7/681.7 | 4129/204 |
| 7 | push "Discover our services" (7 cards → 4 dots) | 5635.4/753 | 4393/673 |
| – | breadcrumb ("Les Noces de Feu - Park of Puy du Fou") / footer | 6388.3 / 6466.1 | 5066.2 (h 124.6) / 5190.8 |

No navy run: dark UI is simply on from 600 to 6150.

### 7.5 `/en/our-references/summer-show-for-volkswagen-autostadt-wolfsburg-germany` (reference). Doc **11377** (390: 10577)
| # | block | desktop y/h | 390 y/h |
|---|---|---|---|
| – | hero (still image, **3** category tags, all-bold h1, City pill + "2008 - 2022" pill) | 0/1260 | 0/1035.7 |
| 1 | content (title `h2.tx-h4.-txcenter`, text `-center -txcenter`) | 1260/134 | 1036/104 |
| 2 | textImage `-overlapping`, **3 images**, lead `p>span.tx-h4` (light) | 1514/409 | 1200/589 |
| 3 | **quote** | 2043/340 | 1848/504 |
| 4 | textImage | 2503/317.8 | 2412/478 |
| 5 | textImage (text in both twoColumns halves) | 2940.7/370.1 | 2950/617 |
| 6 | image slider (10 slides) | 3430.8/727 | 3627/377 |
| 7 | textImage | 4277.8/357.6 | 4064/439 |
| 8 | image slider (7 slides) | 4755.4/727 | 4563/377 |
| 9 | twoColumns wrapper (`h2.tx-h4.-txcenter`) | 5602.4/252.5 | 5000/442 |
| 10 | **gallery** (4) | 5974.9/233.3 | 5502/259 |
| 11 | textImage (3 images) | 6328.2/540.4 | 5822/601 |
| 12 | textImage (3 images) | 6988.6/554.9 | 6482/609 |
| 13 | content (title `p.tx-h5.-txcenter`, text `-left`) | 7663.5/198 | 7152/172 |
| 14 | video `-radius` | 7981.5/681.7 | 7384/204 |
| 15 | **push single** "Discover / more projects in Germany" | 8783.2/633.8 | 7647/529 |
| 16 | push "Discover our services" (8 cards → 5 dots) | 9537/753 | 8236/673 |
| – | breadcrumb / footer | 10290 / 10367.8 | 8909.4 / 8987.2 |

All white: no clouds and no reverts. Dark UI on from 600 to 10050.

### 7.6 Vidanta (dump only, for navy variants)
- A navy run containing content, video, textImage, **quote** and **slider**, each in its own revert.
- In it, the quote text is white with a gold mark (`ref_vid_quote_navy.png`), and the slider rings and arrows are white (`ref_vid_slider_navy.png`).

---

## 8. Screenshot index (`docs/reference/frames-detail/`)
All desktop frames are 1440×900 viewport captures with the 15px scrollbar visible. `m390_*` frames are 390×844 at DPR 2 (780×1688 px). Frames `ws_*` and `m390_ws_*` come from the earlier pass; everything else is new in this pass.

- **Water-screen, desktop 1440 (`ws_`). 00–14 follow the page top to bottom; 10b–13f are interaction states: play hover; slider cursor, mid-drag, release at 300ms, settled; Next-ring hover at 300/1000/3000ms; Next click at 200ms and settled; last slide (Next disabled) and first slide (Prev disabled); push card hover with cursor, mid-drag, settled, last-dot click at 250ms and settled; rich-text link hover** (33): `ws_00_hero.png`, `ws_01_hero_to_blocks.png`, `ws_02_textimage_overlap_revert.png`, `ws_03_textimage_list.png`, `ws_04_images_fullscreen.png`, `ws_05_fullscreen_to_navy_cloud.png`, `ws_06_navy_content_images2.png`, `ws_07_navy_textimage.png`, `ws_07b_navy_textimage_revert.png`, `ws_08_navy_to_white_cloud.png`, `ws_09_content_right_images2.png`, `ws_09b_link_hover.png`, `ws_10_video.png`, `ws_10b_video_play_hover.png`, `ws_11_slider.png`, `ws_11b_slider_hover_cursor.png`, `ws_11c_slider_middrag.png`, `ws_11d_slider_release_0300ms.png`, `ws_11e_slider_settled.png`, `ws_12_slider_next_hover_0300ms.png`, `ws_12b_slider_next_hover_1000ms.png`, `ws_12c_slider_next_hover_3000ms.png`, `ws_12d_slider_next_click_0200ms.png`, `ws_12e_slider_next_click_settled.png`, `ws_12f_slider_last_slide_next_disabled.png`, `ws_12g_slider_first_slide_prev_disabled.png`, `ws_13_push_see_also.png`, `ws_13b_push_card_hover_cursor.png`, `ws_13c_push_middrag.png`, `ws_13d_push_settled.png`, `ws_13e_push_lastdot_0250ms.png`, `ws_13f_push_lastdot_settled.png`, `ws_14_breadcrumb_footer.png`
- **Water-screen, 390 (`m390_ws_`)** (20): `m390_ws_00_hero.png`, `m390_ws_01_hero_to_blocks.png`, `m390_ws_02_textimage_overlap_revert.png`, `m390_ws_02b_textimage_images.png`, `m390_ws_03_textimage_list.png`, `m390_ws_03b_textimage_images.png`, `m390_ws_04_images_fullscreen.png`, `m390_ws_05_fullscreen_to_navy_cloud.png`, `m390_ws_06_navy_content_images2.png`, `m390_ws_07_navy_textimage.png`, `m390_ws_07b_navy_textimage_revert.png`, `m390_ws_08_navy_to_white_cloud.png`, `m390_ws_09_content_right_images2.png`, `m390_ws_10_video.png`, `m390_ws_11_slider.png`, `m390_ws_11c_slider_middrag.png`, `m390_ws_11e_slider_settled.png`, `m390_ws_13_push_see_also.png`, `m390_ws_13b_push_dots.png`, `m390_ws_14_breadcrumb_footer.png`
- **Custom-made water show, desktop (`cm_`, numbered by `t-page__blocks` child index)** (18): `cm_00_hero.png`, `cm_01_content.png`, `cm_02_textImage_overlapping.png`, `cm_03_cloud_bgnavy_top_height.png`, `cm_04_revert_bgnavy_clrwhite_content.png`, `cm_05_revert_bgnavy_clrwhite_row.png`, `cm_06_revert_bgnavy_clrwhite_gallery.png`, `cm_07_cloud_bgnavy_height.png`, `cm_08_textImage_overlapping.png`, `cm_09_content.png`, `cm_10_cloud_bgnavy_top_height.png`, `cm_11_images.png`, `cm_12_textImage_overlapping.png`, `cm_13_cloud_bgnavy_top_height.png`, `cm_14_revert_bgnavy_clrwhite_textImage_overlapping.png`, `cm_15_row_video.png`, `cm_16_push_border.png`, `cm_99_breadcrumb_footer.png`
- **Custom-made water show, 390** (18): `m390_cm_00_hero.png`, `m390_cm_01_content.png`, `m390_cm_02_textImage_overlapping.png`, `m390_cm_03_cloud_bgnavy_top_height.png`, `m390_cm_04_revert_bgnavy_clrwhite_content.png`, `m390_cm_05_revert_bgnavy_clrwhite_row.png`, `m390_cm_06_revert_bgnavy_clrwhite_gallery.png`, `m390_cm_07_cloud_bgnavy_height.png`, `m390_cm_08_textImage_overlapping.png`, `m390_cm_09_content.png`, `m390_cm_10_cloud_bgnavy_top_height.png`, `m390_cm_11_images.png`, `m390_cm_12_textImage_overlapping.png`, `m390_cm_13_cloud_bgnavy_top_height.png`, `m390_cm_14_revert_bgnavy_clrwhite_textImage_overlapping.png`, `m390_cm_15_row_video.png`, `m390_cm_16_push_border.png`, `m390_cm_99_breadcrumb_footer.png`
- **Dancing fountain, desktop (`df_`; separator rows 09/11/13/15 have no frame)** (16): `df_00_hero.png`, `df_01_textImage.png`, `df_02_textImage_overlapping.png`, `df_03_images_fullscreen.png`, `df_04_cloud_bgnavy_top_height.png`, `df_05_revert_bgnavy_clrwhite_row.png`, `df_06_revert_bgnavy_clrwhite_textImage_overlapping.png`, `df_07_cloud_bgnavy_height.png`, `df_08_textImage_overlapping.png`, `df_10_textImage_overlapping.png`, `df_12_textImage_overlapping.png`, `df_14_textImage_overlapping.png`, `df_16_textImage_overlapping.png`, `df_17_row_video.png`, `df_18_push_border.png`, `df_99_breadcrumb_footer.png`
- **Dancing fountain, 390** (16): `m390_df_00_hero.png`, `m390_df_01_textImage.png`, `m390_df_02_textImage_overlapping.png`, `m390_df_03_images_fullscreen.png`, `m390_df_04_cloud_bgnavy_top_height.png`, `m390_df_05_revert_bgnavy_clrwhite_row.png`, `m390_df_06_revert_bgnavy_clrwhite_textImage_overlapping.png`, `m390_df_07_cloud_bgnavy_height.png`, `m390_df_08_textImage_overlapping.png`, `m390_df_10_textImage_overlapping.png`, `m390_df_12_textImage_overlapping.png`, `m390_df_14_textImage_overlapping.png`, `m390_df_16_textImage_overlapping.png`, `m390_df_17_row_video.png`, `m390_df_18_push_border.png`, `m390_df_99_breadcrumb_footer.png`
- **Puy du Fou reference, desktop (`ref_puy_`; 05b = first slide with Prev disabled)** (10): `ref_puy_00_hero.png`, `ref_puy_01_textImage_overlapping.png`, `ref_puy_02_textImage_overlapping.png`, `ref_puy_03_images_fullscreen.png`, `ref_puy_04_row.png`, `ref_puy_05_slider.png`, `ref_puy_05b_slider_first_prev_disabled.png`, `ref_puy_06_row_video.png`, `ref_puy_07_push_border.png`, `ref_puy_99_breadcrumb_footer.png`
- **Puy du Fou reference, 390** (9): `m390_ref_puy_00_hero.png`, `m390_ref_puy_01_textImage_overlapping.png`, `m390_ref_puy_02_textImage_overlapping.png`, `m390_ref_puy_03_images_fullscreen.png`, `m390_ref_puy_04_row.png`, `m390_ref_puy_05_slider.png`, `m390_ref_puy_06_row_video.png`, `m390_ref_puy_07_push_border.png`, `m390_ref_puy_99_breadcrumb_footer.png`
- **VW Autostadt reference, desktop (`ref_vw_`; 15 = single push, 15b/15c = its button hover at 150/1000ms, 16 = products push)** (20): `ref_vw_00_hero.png`, `ref_vw_01_content.png`, `ref_vw_02_textImage_overlapping.png`, `ref_vw_03_quote.png`, `ref_vw_04_textImage_overlapping.png`, `ref_vw_05_textImage_overlapping.png`, `ref_vw_06_slider.png`, `ref_vw_07_textImage_overlapping.png`, `ref_vw_08_slider.png`, `ref_vw_09_row.png`, `ref_vw_10_gallery.png`, `ref_vw_11_textImage_overlapping.png`, `ref_vw_12_textImage_overlapping.png`, `ref_vw_13_content.png`, `ref_vw_14_row_video.png`, `ref_vw_15_push_border.png`, `ref_vw_15b_push_single_button_hover_0150ms.png`, `ref_vw_15c_push_single_button_hover_1000ms.png`, `ref_vw_16_push_border.png`, `ref_vw_99_breadcrumb_footer.png`
- **VW Autostadt reference, 390** (18): `m390_ref_vw_00_hero.png`, `m390_ref_vw_01_content.png`, `m390_ref_vw_02_textImage_overlapping.png`, `m390_ref_vw_03_quote.png`, `m390_ref_vw_04_textImage_overlapping.png`, `m390_ref_vw_05_textImage_overlapping.png`, `m390_ref_vw_06_slider.png`, `m390_ref_vw_07_textImage_overlapping.png`, `m390_ref_vw_08_slider.png`, `m390_ref_vw_09_row.png`, `m390_ref_vw_10_gallery.png`, `m390_ref_vw_11_textImage_overlapping.png`, `m390_ref_vw_12_textImage_overlapping.png`, `m390_ref_vw_13_content.png`, `m390_ref_vw_14_row_video.png`, `m390_ref_vw_15_push_border.png`, `m390_ref_vw_16_push_border.png`, `m390_ref_vw_99_breadcrumb_footer.png`
- **Vidanta reference, desktop (navy quote and navy slider)** (2): `ref_vid_quote_navy.png`, `ref_vid_slider_navy.png`

Total: 180 frames.

---

## 9. Not determined / caveats

- **Slider easing formula.** Embla v7's scroll body is in the bundle (`function Ol`, L5510-5569; pointer-up speed/mass choice L5420-5431; arrows/dots use `useBaseMass().useSpeed(options.speed)`, L6347). Each animation frame it steers the velocity toward `(target − location) × speed / 100` with mass 1.
  - The measured curves in 3.10 and 3.11 behave like an exponential approach with **τ ≈ 70ms** after a 1–2 frame ramp (95% at ≈250ms, under 0.5px by ≈600ms).
  - I did not reconcile that timing exactly with the per-frame formula; headless frame pacing was irregular, with samples 28–42ms apart.
  - For an exact match, use `embla-carousel@7` (jsDelivr) with the same options. Otherwise tune a lerp against the frames `ws_11d`/`ws_11e`/`ws_12d`/`ws_12e`.
- **Real touch momentum** (a fast flick at 390) was not tested. Only a slow synthetic CDP swipe was, and it snapped back.
- **Hover videos on cards** do not decode in headless Chrome (same as I 13). Only the `-hover` class and its opacity/scale were measured.
- **Playing YouTube state**: not re-captured; identical to H 8.
- **CMS-driven content** cannot be derived from CSS: which tag colour a category gets (VW's blue "Water effect"), which service cards appear in "See also" (5–10), missing navy→white seams (custom-made), and the third breadcrumb label (the meta title on references).
- **`.a-caption`**, the `-removeMargins` fullscreen image, the radius-less full-width `b-video column-16` (fifa, spectra), `-boxed` galleries, `-smallSlides` sliders, `b-content -blog`, `-foundation` variants, `b-download` and `b-number` were **not measured live**. They come from CSS and/or server HTML only. The geometry given for them is derived from the rules.
- **Dark-UI glitch** (2.4, 6.14) is reproduced from the live site. Whether to copy or fix it is a design decision. Custom-made also shows the opposite case: light UI (white logo) over the white area after an unmatched navy edge (`cm_15_row_video.png`).
- **Lazy fade timing** (.15s) is read from CSS. Real image arrival depends on the network, so an image may pop in later than the section.
- There are **no template-specific CSS or JS hooks**. Neither `t-productsitem`/`t-referencesitem` nor the Barba namespaces `products-item`/`references-item` are referenced in the bundle. Everything comes from the shared block classes, so the two templates differ only in their hero (1.1) and content.
- The earlier-pass DOM dumps show several images with `-entered -exited` and `opacity:0`. That is an artefact of the fast crawl (lazy load cancelled on exit). The slow crawl in this pass shows them `-loaded`, opacity 1. The geometry is identical because `width`/`height` attributes reserve the space.
