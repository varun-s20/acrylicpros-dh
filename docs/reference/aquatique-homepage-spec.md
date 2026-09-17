# Aquatique Show (aquatic-show.com/en) homepage: design and motion spec

Reverse-engineered on 2026-09-16 from `site.css` (de-minified as `site.pretty.css`), `site.js` (beautified as `site.pretty.js`), the live page in Chrome (Playwright, 1440x900 and 390x844 touch), and `raw.html` (the server HTML before JS runs). CSS excerpts below are copied verbatim from `site.pretty.css`, with line numbers. Measured values come from `getComputedStyle` (dumps: `work/dump_d.txt` for desktop and `work/dump_m.txt` for mobile).

**Units.** `html { font-size: 62.5% }`, so **1rem = 10px** everywhere. At a 1440 window, Chrome shows a 15px scrollbar (`scrollbar-gutter: stable`), so the layout viewport is **1425px** wide. All desktop pixel numbers below are measured at 1425.

**Stack in the original.** modularjs modules, **Locomotive Scroll v5** (which wraps **Lenis**), **anime.js** for every JS tween (there is no GSAP), **Embla Carousel v7** for sliders, **Barba 2.10.3**, vanilla-lazyload, and the YouTube iframe API.

**Do not reuse.** The rebuild must not reuse their images, videos, copy or logo. The media lists below are only there to explain the layout.

---

## 0. Global

### 0.1 Fonts
- One family: **Matter** variable font (`/assets/fonts/matter/MatterVF.woff2`), `font-weight: 300 900`. Fallbacks are `Helvetica, Arial, sans-serif`. `document.fonts` shows only Matter as loaded.
- **Weights used on the homepage:**
  - 300: display headings (`tx-h1` to `tx-h4`)
  - 400: body text
  - 600: `strong`/`b` inside headings, buttons, `tx-website`, tags
  - 900: footer column headings
- The menu links also use `font-variation-settings: "wght" 300 → 600`.
- `html`: `-webkit-font-smoothing: antialiased; text-rendering: geometricprecision; font-variant-numeric: lining-nums;`.
- `.m-hero__title` also sets `font-kerning: none`.

```css
/* site.pretty.css L116-162 */
@font-face {
  font-weight:300 900;
  font-display:swap;
  font-family:Matter;
  src:url(/assets/fonts/matter/MatterVF.woff2) format("woff2-variations"),url(/assets/fonts/matter/MatterVF.woff2) format("woff2 supports variations"),url(/assets/fonts/matter/MatterVF.woff) format("woff");
}
:root {
  --vr: 3rem;
  --clrfontaine: #4180C9;
  --clraquatique: #6541CB;
  --clrgold: #C79D47;
  --clrgolddark: #CEA95D;
  --clrdarkblue: #000D1A;
}
html {
  width:100%;
  background-color:#221c35;
  color:#fff;
  font-weight:400;
  font-size:62.5%;
  font-family:Matter,Helvetica,Arial,sans-serif;
  scroll-behavior:initial;
  font-variant-numeric:lining-nums;
  -webkit-font-smoothing:antialiased;
  font-smoothing:antialiased;
  -webkit-tap-highlight-color:transparent;
  -webkit-text-size-adjust:100%;
  -moz-text-size-adjust:100%;
  text-size-adjust:100%;
  scrollbar-gutter:stable;
}
html.is-loading {
  cursor:progress;
}
html.is-loading:not(.-fullscreen) {
  pointer-events:none;
}
html body {
  -moz-osx-font-smoothing:grayscale;
  text-rendering:geometricprecision;
}
html.-fullscreen,html.-fullscreen body,html.-fullscreen .t-page,html.-fullscreen .m-pageScroller {
  height:100%;
}
html.-fullscreen .o-footer {
  display:none;
}
```

### 0.2 Colour tokens

`:root` defines only these variables:

```css
/* site.pretty.css L122-129 */
:root {
  --vr: 3rem;
  --clrfontaine: #4180C9;
  --clraquatique: #6541CB;
  --clrgold: #C79D47;
  --clrgolddark: #CEA95D;
  --clrdarkblue: #000D1A;
}
```

Other colours used as literal hex values in the CSS:

| role | value |
|---|---|
| html background (visible in the scrollbar gutter) | `#221c35` |
| page background (`.t-page`) | `#00284d` (navy) |
| navy / "-clrnavy" (dark UI colour) | `#00284d` |
| dark blue / footer / menu | `#000d1a` |
| shows section | `#0c0a09` |
| gold (CTA, prefooter) | `#c79d47`; hover `#b38d3e` |
| gold dark (tag) | `#cea95d` |
| fontaine blue (tag, cat) | `#4180c9` |
| aquatique purple (tag, cat) | `#6541cb` |
| news card cream | `#faf7f1` |
| body grey text | `#4f4f4f` |
| light grey text (inactive cat buttons) | `#c5c5c5` |
| borders | `#cbcbcb`, `#e3e3e3`, `#ececec` |
| cat-selector bg | `#fafafa` |
| breadcrumb text | `#a8a8a8` |
| button hover white | `#f9fcff` |
| translucent chrome | `rgba(255,255,255,.1)`, `.15`, `.2`, `.24`, `.4` |
| dark-mode chrome | `rgba(0,40,77,.1)`, `rgba(0,13,26,.7)` |

The utility classes `.-clr<name>` and `.-bg<name>` map these colours to `color` and `background-color` (lines 401-622). For example, `-bgwhite`, `-bgnavy`, `-bgdarkblue`, `-clrdarkblue` and `-clrnavy` are all used on the homepage.

### 0.3 Easing and duration vocabulary
| name used here | value | used for |
|---|---|---|
| **ease-quint** | `cubic-bezier(.23,1,.32,1)` | Almost every CSS transition: buttons, links, header, side menu, cat pill, reveals (`enter-y`), images |
| ease-expo | `cubic-bezier(.19,1,.22,1)` | Slider button ring (3s) |
| ease-cubic | `cubic-bezier(.215,.61,.355,1)` | News slide opacity (.4s) |
| drag | `cubic-bezier(0,0,.2,1)` | Drag cursor scale (.3s) |

Typical durations are **.4s** (hover micro-interactions), **1s** (colour and background changes, button fill, link underline, cat pill), **2s** (text reveals), and **4s** (image zoom-outs).

JS tweens use anime.js named easings:
- `easeOutExpo`: title lines
- `easeOutCubic`: loader, menu video cards
- `easeOutQuint`: menu timeline, page scale, burger, Barba
- `easeInOutQuad`: product filter fade

### 0.4 Type scale (`tx-*`)

**`strong` mechanism.**
- Headings are light (300), and the emphasised words are wrapped in `<strong>`, which renders at 600. The reset gives `strong` `font: inherit`, so the 600 comes from `[class^=tx-] strong` (this only works when a `tx-` class is the **first** class), `.m-titleContent strong` or `.m-textContent strong`.
- Example: `<h2 class="tx-h2">Our latest <strong>creations</strong></h2>`.
- Caveat: `.m-hero__lastShow strong` stays **400**, because that `p`'s first class is not `tx-`.

| class | mobile (<1025) size / line-height / tracking | desktop (>=1025) | weight |
|---|---|---|---|
| `tx-h1` | 56px / .85 (47.6px) / -.04em (-2.24px) | **80px** / .85 (68px) / -.05em (-4px); in the hero at >=1441px it is 100px | 300 |
| `tx-h2` | 40px / 1 / -.04em | **80px** / 1 / -.06em (-4.8px) | 300 |
| `tx-h3` | 36px / 1.056 (38.0px) / -.02em | **60px** / 1.03 (61.8px) / -.04em (-2.4px) | 300 |
| `tx-h4` | 30px / 1.067 (32px) / -.02em | **40px** / 1.1 (44px) / -.02em (-.8px) | 300 |
| `tx-h5` | 22px / 1.2 | **34px** / 1.059 (36px) | 400 |
| `tx-website` | 36px / 1.75 / -.02em | **50px** / 1.75 (87.5px) / -1px | 600 |
| `tx-p` / `.m-textContent p` | 16px / 1.5 | same | 400 |
| `tx-plarge` | 18px / 1.8 | same | |
| `tx-pxlarge` | 20px / 1.3 | same | |
| `tx-psmall` | 14px / 1.5 | same | |
| `tx-pxsmall` | 12px / 1.5 | same | |
| `tx-cta` (button label) | 14px / 1.2 / -.01em | same | 600 inside `.a-button` |
| `tx-ctasmall` | 11px / 1.2 | same | usually `-txupp -tx600` |
| `tx-uni11` | 11px / 1.18 | same | |
| `tx-uni14` | 14px / 1.5 | same | |

```css
/* site.pretty.css L650-816 */
sup {
  position:relative;
  top:.2rem;
  padding-left:.1rem;
  font-size:.5em;
}
.tx-h1,.m-textContent h1 {
  font-weight:300;
  font-size:5.6rem;
  line-height:.85;
  letter-spacing:-.04em;
}
.tx-h2,.m-textContent h2 {
  font-weight:300;
  font-size:4rem;
  line-height:1;
  letter-spacing:-.04em;
}
.tx-h3,.m-textContent h3 {
  font-weight:300;
  font-size:3.6rem;
  line-height:1.056;
  letter-spacing:-.02em;
}
.tx-h4,.m-textContent h4 {
  font-weight:300;
  font-size:3rem;
  line-height:1.067;
  letter-spacing:-.02em;
}
.tx-h5,.m-textContent h6,.m-textContent h5 {
  font-weight:400;
  font-size:2.2rem;
  line-height:1.2;
}
.tx-website {
  font-weight:600;
  font-size:3.6rem;
  line-height:1.75;
  letter-spacing:-.02em;
}
.tx-kpi {
  font-weight:300;
  font-size:7rem;
  line-height:1.2;
  letter-spacing:-.02em;
}
.tx-p,.o-projectsProjects .b-content .m-textContent>p,.o-projectsProjects .b-content .m-textContent li p:not(:first-child),.b-download__content p,.m-textContent.-small p,.m-textContent ol,.m-textContent s,.m-textContent p,.b-push__single p,.m-newsletterForm__input input,.a-tag.-xl {
  font-size:1.6rem;
  line-height:1.5;
}
.tx-pxsmall {
  font-size:1.2rem;
  line-height:1.5;
}
.tx-psmall {
  font-size:1.4rem;
  line-height:1.5;
}
.tx-plarge {
  font-size:1.8rem;
  line-height:1.8;
}
.tx-pxlarge {
  font-size:2rem;
  line-height:1.3;
}
.tx-pxxlarge,.o-foundationIntroduction .m-textContent p,.o-foundationActions .m-textContent p,.b-content.-foundation p {
  font-size:2.4rem;
  line-height:1.083;
}
.tx-cta {
  font-size:1.4rem;
  line-height:1.2;
  letter-spacing:-.01em;
}
.tx-ctasmall {
  font-size:1.1rem;
  line-height:1.2;
}
.tx-ctalarge {
  font-size:1.6rem;
  line-height:1.2;
  letter-spacing:-.01em;
}
.tx-uni8 {
  font-size:.8rem;
  line-height:1.2;
}
.tx-uni11,.a-tag.-reference {
  font-size:1.1rem;
  line-height:1.18;
}
.tx-uni14,.o-universeVision__textImage p,.o-universeTeam__founder,.o-universeResponsability__section p,.o-universeResponsability__introduction p,.o-contactForm.-foundation .o-contactForm__discoverPanel .a-labelText,.a-sectionTitle {
  font-size:1.4rem;
  line-height:1.5;
}
.tx-uni16 {
  font-size:1.6rem;
  line-height:1.2;
}
[class^=tx-] strong,[class^=tx-] b {
  font-weight:600;
}
[class^=tx-] em,[class^=tx-] i {
  font-style:italic;
}
@media only screen and (min-width: 1025px) {
  .tx-h1,.m-textContent h1 {
    font-size:8rem;
    letter-spacing:-.05em;
  }
  .tx-h2,.m-textContent h2 {
    font-size:8rem;
    letter-spacing:-.06em;
  }
  .tx-h3,.m-textContent h3 {
    font-size:6rem;
    line-height:1.03;
    letter-spacing:-.04em;
  }
  .tx-h4,.m-textContent h4 {
    font-size:4rem;
    line-height:1.1;
  }
  .tx-h5,.m-textContent h6,.m-textContent h5 {
    font-size:3.4rem;
    line-height:1.059;
  }
  .tx-website {
    font-size:5rem;
  }
  .tx-kpi {
    font-size:9rem;
    line-height:1;
    letter-spacing:-.02em;
  }
  .lg-tx-h1 {
    font-size:8rem;
    letter-spacing:-.05em;
  }
  .lg-tx-h2 {
    font-size:8rem;
    letter-spacing:-.06em;
  }
  .lg-tx-h3 {
    font-size:6rem;
    line-height:1.03;
    letter-spacing:-.04em;
  }
  .lg-tx-h4 {
    font-size:4rem;
    line-height:1.1;
  }
  .lg-tx-h5 {
    font-size:3.4rem;
    line-height:1.059;
  }
  .lg-tx-website {
    font-size:5rem;
  }
  .lg-tx-kpi {
    font-size:9rem;
    line-height:1;
    letter-spacing:-.02em;
  }
}
```

### 0.5 Grid system
- There are **16 columns**. Each column is `6.25%` wide, and columns have **no gutter** (they have no padding). Spacing comes only from the row padding and from explicit gaps.
- `.row`: `max-width: 144rem` (1440px), centred.
  - padding `0 1.4rem` below 641px, `0 2rem` from 641px.
  - `.row.-xl` removes the max-width.
- Columns: `.column-N` / `.sm-column-N` (>=0), `.md-` (>=641), `.lg-` (>=1025), `.xlg-` (>=1367). Each sets `flex: 0 0 N*6.25%; max-width: same`.
- Offsets: `.offset-N` and its prefixed variants set `margin-left: N*6.25%`.
- Any `[class*=column-]` is `display: flex; flex-direction: column; align-items: flex-start`, and its children get `width: 100%` (unless the column has `.no-width`).
- **Breakpoints:** 641 / 1025 / 1367. There are also `max-width: 1024px` and `max-width: 1366px` queries, and one `width >= 1441px` query (hero h1).

```css
/* site.pretty.css L850-898 */
.row {
  position:relative;
  display:flex;
  flex-wrap:wrap;
  align-items:stretch;
  justify-content:flex-start;
  width:100%;
  max-width:144rem;
  margin:0 auto;
  padding:0 1.4rem;
}
.row.-xl {
  max-width:100%;
}
@media only screen and (min-width: 641px) {
  .row {
    padding:0 2rem;
  }
}
[class*=column-] {
  display:flex;
  flex-direction:column;
  align-items:flex-start;
}
[class*=column-],[class*=column-]:not(.no-width)>* {
  width:100%;
  max-width:100%;
}
@media only screen and (min-width: 0) {
  .flex,.sm-flex {
    display:flex;
  }
  .column-0,.sm-column-0 {
    flex:0 0 0%;
    width:0%;
    max-width:0%;
  }
  .offset-0,.sm-offset-0 {
    margin-left:0%;
  }
  .column-1,.sm-column-1 {
    flex:0 0 6.25%;
    width:6.25%;
    max-width:6.25%;
  }
  .offset-1,.sm-offset-1 {
    margin-left:6.25%;
  }
  .column-2,.sm-column-2 {
```

### 0.6 Buttons (`.a-button`, `.a-buttonField`)

**Markup.**

```html
<a class="a-buttonField a-button -primary -bgwhite -clrdarkblue">
  <span class="a-buttonField__text tx-cta">Label</span>
  <svg class="a-svg -arrow-right"/>
</a>
```

**Base.**
- `inline-flex`, `gap 1rem`, `padding 1.35rem 2.5rem`, `radius 4.4rem`, `weight 600`, `overflow hidden`.
- Measured height is **43.8px**, from the 14px label plus padding.
- The icon is 13x13px.

**Variants seen on the homepage.**
- `-primary -bgwhite -clrdarkblue`: white pill with `#000d1a` text.
  - "Discover our universe" measures 208.7x43.8.
  - "Discover all our references" also has `-boxed` (`min-width 22.1rem`, 221px) and has no icon.
- `-primary -bgnavy -clrwhite -wide`: navy pill (224x43.8). With `-wide` it is 100% wide below 1025px.
- `-primary -bgdarkblue -clrwhite`: "See article", 140x43.8.
- `-outline`: prefooter "Discover". White background, `1px solid #C79D47` border, gold text, 129x45.8.
- `-secondary`: translucent circle or pill.
  - `bg rgba(255,255,255,.1)`, `radius 5rem`, outline `1px rgba(255,255,255,0)`.
  - On hover: `bg .15` and outline `rgba(255,255,255,.4)`, transitioned over .4s.
  - Used by the "+" more buttons, the mobile EN button and the mobile search button.

**Hover** (only with `(hover:hover) and (any-pointer:fine)`).
1. **`-primary` gloss.** A `::before` layer with `linear-gradient(0deg, #fff0, #ffffff1a)` slides from `translateY(-100%)` to `0` over 1s ease-quint. This is a subtle top-light sheen, not a colour fill.
2. **Icon push.** The arrow gets `margin-left: .8rem` (transition `margin .4s ease-quint`). The pill widens by 8px because it is `inline-flex`. Measured: 208.66 → 216.66px.
3. **Label padding.** `.a-buttonField__text:last-child` gets `padding: 0 .8rem` over 1s. This only applies when the label is the **last** child, so only to buttons without an icon, which then grow by 16px.
4. **`-bgwhite` colour.** The background changes to `#f9fcff` over 1s.

**Frames:**
- `hover_button_white_0300ms.png`, `hover_button_white_settled.png`
- `hover_button_shows.png` (no icon, padding variant)
- `hover_button_outline.png`

```css
/* site.pretty.css L1636-1766 */
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
```

**Text link `.a-link`** (menu secondary links, footer links). A 1px `currentColor` underline sits at `bottom: -.2rem`. It is `scaleX(0)` with `transform-origin: left`, and on hover it becomes `scaleX(1)` over **1s ease-quint**. See `hover_footer_link.png`.

```css
/* site.pretty.css L2030-2057 */
.a-link {
  position:relative;
  display:inline-block;
}
.a-link:before {
  content:"";
  position:absolute;
  bottom:-.2rem;
  left:0;
  width:100%;
  height:.1rem;
  background-color:currentcolor;
  transition:transform 1s cubic-bezier(.23,1,.32,1);
  transform:scaleX(0);
  transform-origin:left;
}
.a-link.-hover:not([aria-disabled]):before,.a-link:focus:not([aria-disabled]):before {
  transform:scaleX(1);
}
.a-link[aria-disabled] {
  opacity:.7;
  cursor:not-allowed;
}
@media (hover: hover) and (any-pointer: fine) {
  .a-link:hover:not([aria-disabled]):before {
    transform:scaleX(1);
  }
}
```

**Slider arrow button `.a-buttonSlider`** (news section). A 9rem (90px) circle.
- A static ring (`::before`, `2px solid var(--slider-border-color)` at opacity .2).
- An SVG ring drawn over it: `<circle cx=50 cy=50 r=48 stroke=currentColor>` in a 0 0 100 100 viewBox.
  - `stroke-width .3rem`
  - `stroke-dasharray` and `stroke-dashoffset` both 314.2857 (hidden)
  - `rotate(-450deg)`
- On hover the ring draws in: `dashoffset → 0` and `rotate(-90deg)`, over **3s cubic-bezier(.19,1,.22,1)**.
- Icon: `arrow-down` at 24px, rotated 90deg for prev and -90deg for next.
- Colours: `--slider-border-color: #C79D47; --slider-icon-color: #00284D`.
- Disabled: opacity .3.

Frames: `hover_slider_next_0300ms.png`, `hover_slider_next_1000ms.png`, `hover_slider_next_3000ms.png`.

```css
/* site.pretty.css L1592-1635 */
.a-buttonSlider {
  position:relative;
  width:9rem;
  height:9rem;
  color:var(--slider-icon-color);
}
.a-buttonSlider:before {
  content:"";
  border:solid .2rem var(--slider-border-color);
  opacity:.2;
}
.a-buttonSlider:before,.a-buttonSlider__border {
  position:absolute;
  top:0;
  left:0;
  width:100%;
  height:100%;
  border-radius:50%;
  pointer-events:none;
}
.a-buttonSlider__border {
  color:var(--slider-border-color);
  fill:none;
  transition:stroke-dashoffset 3s cubic-bezier(.19,1,.22,1),stroke-dasharray 3s cubic-bezier(.19,1,.22,1),transform 3s cubic-bezier(.19,1,.22,1);
  transform:rotate(-450deg);
  stroke-dashoffset:314.2857142857;
  stroke-dasharray:314.2857142857;
  stroke-width:.3rem;
}
.a-buttonSlider .a-svg {
  width:2.4rem;
  height:2.4rem;
  pointer-events:none;
}
.a-buttonSlider:hover:not(:disabled) .a-buttonSlider__border {
  transform:rotate(-90deg);
  stroke-dashoffset:0;
}
.a-buttonSlider.-prev .a-svg {
  transform:rotate(90deg);
}
.a-buttonSlider.-next .a-svg {
  transform:rotate(-90deg);
}
```

### 0.7 Tags (`.a-tag`)
- Pill: `padding .3rem .8rem .3rem .4rem` (with icon), `radius 2.4rem`, `gap .3rem`.
- Text: 10px uppercase, weight 600.
- Icon: a 13px dot with `--color1` background, holding a 7x6 symbol.
- On product cards the background is overridden to `rgba(255,255,255,.24)` with `backdrop-filter: blur(.4rem)` and white text.
- Colour variants: `-fontaine` (#4180C9), `-aquatique` (#6541CB), `-golddark` (rgba(206,169,93,.6)).

```css
/* site.pretty.css L2126-2208 */
.a-tag {
  display:inline-flex;
  gap:.3rem;
  align-items:center;
  padding:.5rem 1rem;
  border-radius:2.4rem;
  background-color:var(--color2);
  color:#00284d;
}
.a-tag .a-svg {
  position:relative;
  width:.7rem;
  height:.6rem;
  pointer-events:none;
}
.a-tag__iconWrapper {
  display:inline-flex;
  align-items:center;
  justify-content:center;
  width:1.3rem;
  height:1.3rem;
  border-radius:2.4rem;
  background-color:var(--color1);
  color:var(--color2);
}
.a-tag.-icon {
  padding:.3rem .8rem .3rem .4rem;
}
.a-tag.-xl {
  gap:.8rem;
  padding:.4rem 1.4rem;
}
.a-tag.-xl.-icon {
  padding:.4rem 1.4rem .4rem .6rem;
}
.a-tag.-xl .a-tag__iconWrapper {
  width:3.4rem;
  height:3.4rem;
}
.a-tag.-xl .a-svg {
  width:2.2rem;
  height:2rem;
}
.a-tag.-fontaine {
  --color1: #4180C9;
  --color2: #FFF;
}
.a-tag.-gold {
  --color1: #C79D47;
  --color2: #FFF;
}
.a-tag.-aquatique {
  --color1: #6541CB;
  --color2: #FFF;
}
.a-tag.-golddark {
  --color1: rgba(206, 169, 93, .6);
  --color2: #FFF;
}
.a-tag.-hero {
  --color1: rgba(255, 255, 255, .1);
  --color2: #FFF;
}
.a-tag.-step {
  --color1: #FFF;
  --color2: rgba(255, 255, 255, .1);
  color:var(--color1);
}
.a-tag.-reference {
  --color1: #FFF;
  --color2: rgba(255, 255, 255, .1);
  padding:1.2rem 1.9rem;
  border:solid .1rem #FFF;
  color:#fff;
}
.a-tag.-fill {
  background-color:var(--color1);
  color:var(--color2);
}
.a-tag.-fill .a-tag__iconWrapper {
  background-color:var(--color2);
  color:var(--color1);
}
```

### 0.8 Generic reveal system

There is no global stagger system. Reveals are class-driven:

1. **Locomotive Scroll v5** adds **`is-inview`** to every `[data-scroll]` element.
   - Default elements are watched by an IntersectionObserver with `rootMargin: -1px`, so they trigger as soon as 1px is visible.
   - Elements with `data-scroll-offset` or `data-scroll-css-progress` are computed per frame instead.
   - Without `data-scroll-repeat`, the class is added once and never removed.
2. **Line reveal.** Any `.overflow-wrapper` (`overflow: hidden`) inside an `is-inview` ancestor plays its children:
   `@keyframes enter-y { translateY(100%) → translate(0) }`, **2s ease-quint, forwards**.
   - Before that the children sit at `translateY(120%)`.
   - There is **no stagger and no opacity change**. Every wrapper animates at the same moment.
   - Used on: hero `h1` wrapper and paragraph; homeMagic `h2`; homeShows `h2` and paragraph block.
3. **`[data-scroll]` elements on this homepage:**
   - `.m-hero`: in the fold, and has `data-scroll-css-progress`.
   - Hero title `.js-title`.
   - `.o-homeMagic > .a-image`.
   - `.o-homeMagic__content`, with `data-scroll-offset="20%, 20%"`.
   - Wrapper `div`s: `t-home__section`, the `-bgnavy` shows wrapper, `t-home__footer`, and `.t-home__footer > .row` (`data-scroll-offset="80%, 0"`, repeat).
   - The dark-UI trigger div.
   - `.m-marquee`.
   - The two hero `<video>`s (repeat, used to call `togglePlay`).
4. **Lazy images.** `img[data-lazy]` starts at `opacity: 0`. Once vanilla-lazyload adds `.-loaded` it becomes `opacity: 1` with `transition: opacity .15s ease-in-out, transform 2.6s ease`.
5. **There is no `data-scroll-speed` parallax anywhere on the homepage** (0 occurrences in the HTML). The only scroll-linked value is the hero's `--progress` (see 4).

```css
/* site.pretty.css L187-207 */
.overflow-wrapper {
  position:relative;
  overflow:hidden;
}
.overflow-wrapper.-static {
  overflow:visible;
}
.overflow-wrapper>h1 {
  padding-top:.8rem;
}
@media only screen and (min-width: 1025px) {
  .overflow-wrapper>h1 {
    padding-bottom:1.2rem;
  }
}
.overflow-wrapper>.tx-h2,.m-textContent .overflow-wrapper>h2 {
  padding-bottom:.4rem;
}
.overflow-wrapper>span {
  display:block;
}
```
```css
/* site.pretty.css L374-400 */
@keyframes enter-y {
  0% {
    transform:translateY(100%);
  }
  to {
    transform:translate(0);
  }
}
@keyframes leave-y {
  0% {
    opacity:1;
    transform:translate(0);
  }
  to {
    opacity:0;
    transform:translateY(-10%);
  }
}
.overflow-wrapper>* {
  transform:translateY(120%);
}
.is-inview .overflow-wrapper>*:not(.-static) {
  animation:enter-y 2s cubic-bezier(.23,1,.32,1) forwards;
}
.is-inview .overflow-wrapper>*.-static {
  transform:translateY(0);
}
```
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

### 0.9 Keyframes on the homepage
Only these are used:
- `enter-y`: text reveals.
- `enter-popin-up`: `opacity 0→1` and `translateY(3rem)→0`. Used by hero tag lists on other templates, not by the homepage hero.

The loader and cat-selector keyframes (`lds-*`) are for the form loader.

There are **no keyframes** for the scroll indicator arrow (it is static) and **no cloud drift**. The "smoke" is a looping video (`/assets/videos/smoke.mp4`, 1304x576) with `mix-blend-mode: screen`, and the white cloud is a static PNG.

```css
/* site.pretty.css L296-373 */
@keyframes lds-roller {
  0% {
    transform:rotate(0);
  }
  to {
    transform:rotate(360deg);
  }
}
@keyframes enter-popin-overlay {
  0% {
    opacity:0;
  }
  to {
    opacity:1;
  }
}
@keyframes leave-popin-overlay {
  0% {
    opacity:1;
  }
  to {
    opacity:0;
  }
}
@keyframes leave-popin-up {
  0% {
    opacity:1;
    transform:translate(0);
  }
  to {
    opacity:0;
    transform:translateY(3rem);
  }
}
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
@keyframes leave-dragger {
  0% {
    opacity:1;
    transform:translate(0);
  }
  to {
    opacity:0;
    transform:translateY(-3rem);
  }
}
@keyframes lds-ellipsis1 {
  0% {
    transform:scale(0);
  }
  to {
    transform:scale(1);
  }
}
@keyframes lds-ellipsis3 {
  0% {
    transform:scale(1);
  }
  to {
    transform:scale(0);
  }
}
@keyframes lds-ellipsis2 {
  0% {
    transform:translate(0);
  }
  to {
    transform:translate(2.1rem);
  }
}
```

### 0.10 Smooth scroll: Locomotive Scroll v5 and Lenis
Lenis options: Locomotive's defaults, with `orientation` set by the Scroll module. `autoResize: false`; the Website module calls `resize` on a 600ms debounce.

```js
/* site.pretty.js L4557-4575 */
const Dr = {
    wrapper: window,
    content: document.documentElement,
    eventsTarget: window,
    lerp: .1,
    duration: .75,
    orientation: "vertical",
    gestureOrientation: "vertical",
    smoothWheel: !0,
    smoothTouch: !1,
    syncTouch: !1,
    syncTouchLerp: .1,
    touchInertiaMultiplier: 35,
    wheelMultiplier: 1,
    touchMultiplier: 2,
    normalizeWheel: !1,
    autoResize: !0,
    easing: r => Math.min(1, 1.001 - Math.pow(2, -10 * r))
};
```

```js
// Scroll module (modules "Scroll"): new LocomotiveScroll({ lenisOptions:{orientation:'vertical'}, autoResize:false, autoStart:true, scrollCallback:onScroll })
// Locomotive v5 defaults: triggerRootMargin "-1px -1px -1px -1px", rafRootMargin "100% 100% 100% 100%"
```

Rebuild recipe with plain Lenis:
- `new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 2, syncTouch: false })`, driven by a rAF loop.
- Native touch scrolling is kept, because `smoothTouch` and `syncTouch` are false.
- Add `html.lenis`, `html.lenis-smooth` and the lenis CSS from lines 1-15.
- The site locks scroll with `lenis.stop()` / `lenis.start()` when the menu opens. It also sets `body { overflow: hidden }` inline.

The progress formula (from `hl._computeIntersection` / `_computeProgress`):
- `start = elTop - vh + offsetStart` (or `0` if the element is in the first fold)
- `end = elTop - offsetEnd + elHeight`
- `progress = clamp((scrollY - start) / (end - start), 0, 1)`
- `is-inview` is on while `0 < progress < 1`. Per-frame elements are only computed while inside a `100%` root margin.

### 0.11 Page chrome stacking

| element | position / z-index | notes |
|---|---|---|
| `.o-header` | fixed, z 20 | `pointer-events: none`; its buttons use `auto` |
| `.o-sideMenu` | fixed, z 19 | |
| `.a-panel.-bottom` | z 12 | Barba panel, gold |
| `.a-panel.-top` | z 11 | Barba panel, navy |
| `.t-page` (`<main>`) | relative, z 10 | bg `#00284d`, `transform-origin: top center` |
| `.o-menu` | fixed, z 1 | sits behind the page and is revealed by moving the page away (see 3) |
| `#js-loader` | fixed, z 99999 | removed after the intro |

```css
/* site.pretty.css L8040-8045 */
.t-page {
  position:relative;
  z-index:10;
  background-color:#00284d;
  transform-origin:top center;
}
```
```css
/* site.pretty.css L8105-8112 */
.-cropped {
  position:fixed!important;
  top:0;
  left:0;
  overflow:hidden;
  width:100%;
  height:100vh;
}
```
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

---

## 1. Header (`.o-header`)

**Markup.**

```html
<header class="o-header flex-center js-nav">
  <button class="a-burger flex-center"> <svg 13x13> 3x <rect x=1 y=3|6|9 w=11 h=1 rx=1 fill=white/> </svg> <span class="tx-ctasmall -txupp">Menu</span></button>
  <a class="o-header__logo"><svg class="a-svg -aquatic-show-logo"/></a>
  <div class="o-header__language"> (mobile only: EN circle + dropdown) </div>
  <a class="a-buttonContact tx-ctasmall -txupp -tx600"><span class="a-buttonContact__iconWrapper"><svg -contact/></span><span class="a-buttonContact__label">Contact us</span></a>
</header>
```

**Layout at 1425px.**
- The header is fixed, full width, with `padding-top: 3.4rem`. It is `1.4rem` below 641px. Measured height is 122px on desktop and 80px on mobile.
- The header has **no background, no blur, and no bar**.
- **Burger pill:** `left 1.4rem` (both breakpoints). Vertically centred with `top: 50%; translateY(-50%)` → x=14, y=41.5, **91.4x39px**.
  - `padding 1.3rem 1.9rem`, `gap 1rem`, `radius 4.4rem`.
  - `bg rgba(255,255,255,.1)`, **no backdrop blur**.
  - Label: 11px, uppercase, weight 400, `line-height: 1`.
  - Hover: 1px outline at `rgba(255,255,255,.4)`, transition 1s.
- **Logo:** centred in the flex row. SVG `8.5rem x 8.6rem` (6.4rem below 641px), coloured by `currentColor` (the gold drop stays gold). `transition: color 1s ease-quint`.
- **Contact pill:** `right 2rem` (1.4rem below 641px), y=41, **107.6x40px**.
  - `padding 1.4rem 2rem`, `radius 4.4rem`, `bg #C79D47`.
  - Label: 11px, uppercase, weight 600.
  - **Desktop hover:** `padding-left` 20→**43px** and `box-shadow: 0 8px 10px rgba(12,10,9,.18)` (both .4s ease-quint).
  - The mail icon sits in a 13px clip box at `left: 2rem`. It slides in from `translate(100%)` with `opacity: 0` to `0` / `1` (.4s). Final width is 130.6px.
  - **Below 1025px:** a 40x40 circle with only the icon (label `display: none`, icon centred and always visible).
  - Frames: `hover_contact_0200ms.png`, `hover_contact_settled.png`.
- **Mobile EN button** (`.o-header__language`, hidden from 1025px): a 40x40 circle at `right: 6.4rem`.
  - Background `var(--background-color)`, which is `rgba(255,255,255,.2)` and becomes `rgba(0,13,26,.7)` in dark mode.
  - Clicking toggles `-visible`, which shows a 5.4rem-wide dropdown (radius 1.2rem, with a triangle pointer) listing EN and FR.

**Menu button morph** (anime.js timeline, 750ms `easeOutQuint`, played on open and reversed on close):
- `rect[0]`: keyframes `translateY: 3`, then `rotate: 45`. Each keyframe gets half the duration.
- `rect[2]`: `translateY: -3`, then `rotate: -45`.
- `rect[1]`: `rotate: -45` during the last 375ms.
- `rect`s have `transform-origin: center; transform-box: fill-box`.
- The result is a ≡ that turns into an ✕ (see `menu_open_1600ms.png`).

```js
/* site.pretty.js L7084-7133 */
class Jl extends j {
    constructor(t) {
        super(t), this.events = {}, this.setAnimation()
    }
    toggle() {
        this.change(!this.state)
    }
    toggleMenuButton() {
        this.tl.reverse(), this.tl.play()
    }
    toggleHeaderVisibility(t) {
        const [e] = this.$("sidemenu", ut);
        e && e.classList.toggle("-isHidden", t)
    }
    toggleMobileHeaderLanguage() {
        const [t] = this.$("langList", ut);
        t.classList.toggle("-visible")
    }
    change(t) {
        this.state !== t && (this.state = t, this.toggleMenuButton())
    }
    setAnimation() {
        const t = this.$("rect"),
            e = q.timeline({
                easing: "easeOutQuint",
                duration: 750,
                autoplay: !1
            });
        e.add({
            targets: t[0],
            keyframes: [{
                translateY: 3
            }, {
                rotate: 45
            }],
            duration: 750
        }), e.add({
            targets: t[2],
            keyframes: [{
                translateY: -3
            }, {
                rotate: -45
            }],
            duration: 750
        }, "-=750"), e.add({
            targets: t[1],
            rotate: -45,
            duration: 375
        }, "-=375"), this.tl = e, this.tl.reverse()
    }
```

**Colour flip over light sections ("dark UI").**
- **Mechanism:** a class toggle **`body.-dark`**, set by `Website.toggleDarkUi` through Locomotive `data-scroll-call` with `data-scroll-repeat`. It does not use mix-blend or per-section data attributes.
  - `way === "enter"` → dark; `"leave"` → light. The logic is inverted if the trigger element has `-bgnavy`, which never happens on the homepage.
  - The class is applied inside `requestAnimationFrame`.
- **Trigger 1:** `<div data-scroll data-scroll-repeat data-scroll-call="toggleDarkUi,Website,website">` wraps **only** the white products section (`.t-home__section`, doc y 2137→3187, height 1050).
  - It uses the IntersectionObserver trigger (-1px), so the UI is dark **while any part of the white products block is on screen**.
  - Measured: on from scrollY ≈ **1238** (block top enters the viewport bottom) to scrollY ≈ **3190** (block bottom leaves the viewport top).
  - So the header is already navy while it still sits over the blue "magic" section (`scroll_magic_enter.png`), and it stays navy over the top of the black shows section until the white block has fully left (`s009_y03064.png`).
- **Trigger 2:** `.t-home__footer > .row` (news and clients) with `data-scroll-offset="80%, 0"`.
  - Dark between `rowTop - 0.2*vh` and `rowBottom`, i.e. scrollY ≈ 4914 → 6103.
- **Everywhere else it is light** (white chrome): hero, magic, shows, video, breadcrumb, prefooter, footer.
  - The white breadcrumb bar at 6203 is light UI, so the white logo is invisible there (`prefooter.png`). That is the original behaviour.
- **Dark-state values:**
  - `.a-burger`: `bg rgba(0,40,77,.1)`, `color #00284d`, `rect fill #00284d`, hover outline `rgba(0,40,77,.4)`.
  - Logo: `color #00284d`.
  - Side menu and language backgrounds: `rgba(0,13,26,.7)`.
  - The contact pill does not change.
  - Transitions are 1s ease-quint (burger bg/colour/outline, logo colour, side menu bg). The rect fill transitions over .4s.
- **Frames:** `scroll_products_header_dark.png`, `scroll_products.png`, `news_full.png` (dark), and `shows_full.png` (light).

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

**Hide / show on scroll.**
- **The header itself never hides.** `transform: translateY(calc(var(--scroll-direction) * 100%))` is declared, but no script ever sets `--scroll-direction`, so the value is invalid and resolves to `none` (verified at every scroll position).
- The Scroll module's direction callback (`toggleHeaderVisibility`) only toggles **`.o-sideMenu.-isHidden`**:
  - hidden while scrolling down (Lenis `progress` increasing)
  - shown on any upward scroll
  - shown when `progress <= .01`, i.e. within the first ~67px of the 6720px scroll range

```js
/* site.pretty.js L4742-4746 */
    onScroll({
        progress: t
    }) {
        t > this.lastProgress ? this.scrollOrientation !== 1 && (this.scrollOrientation = 1, this.call("toggleHeaderVisibility", !0, "Header", "header")) : this.scrollOrientation !== -1 && (this.scrollOrientation = -1, this.call("toggleHeaderVisibility", !1, "Header", "header")), t <= .01 && (this.scrollOrientation = -1, this.call("toggleHeaderVisibility", !1, "Header", "header")), this.lastProgress = t
    }
```

```css
/* site.pretty.css L6055-6160 */
.o-header {
  position:fixed;
  top:0;
  left:0;
  z-index:20;
  width:100%;
  padding-top:1.4rem;
  pointer-events:none;
  transition:transform .4s cubic-bezier(.23,1,.32,1);
  transform:translateY(calc(var(--scroll-direction) * 100%));
}
.o-header__logo {
  transition:color 1s cubic-bezier(.23,1,.32,1);
}
.o-header__logo .a-svg {
  width:6.4rem;
  height:6.4rem;
}
@media only screen and (min-width: 641px) {
  .o-header__logo .a-svg {
    width:8.5rem;
    height:8.6rem;
  }
}
.o-header__logo,.o-header .a-burger,.o-header .a-buttonContact {
  pointer-events:auto;
}
.-dark .o-header .o-header__logo {
  color:#00284d;
}
.o-header__language {
  --background-color: rgba(255, 255, 255, .2);
  position:absolute;
  top:50%;
  right:6.4rem;
  width:4rem;
  height:4rem;
  pointer-events:auto;
  transform:translateY(-50%);
}
.-dark .o-header__language {
  --background-color: rgba(0, 13, 26, .7);
}
.o-header__language.-visible .o-header__languageList {
  display:block;
}
@media only screen and (min-width: 1025px) {
  .o-header__language {
    display:none;
  }
}
.o-header__languageList {
  position:absolute;
  top:100%;
  display:none;
  width:5.4rem;
  margin-top:.8rem;
  border-radius:1.2rem;
  background-color:var(--background-color);
  outline:solid 1px rgba(255,255,255,0);
  text-align:center;
  transition:outline .4s cubic-bezier(.23,1,.32,1),background-color .4s cubic-bezier(.23,1,.32,1),opacity .4s cubic-bezier(.23,1,.32,1);
  transform:translate(-.8rem);
}
.o-header__languageList:before {
  content:"";
  position:absolute;
  top:0;
  left:50%;
  width:0;
  height:0;
  border-right:.8rem solid transparent;
  border-bottom:.6rem solid var(--background-color);
  border-left:.8rem solid transparent;
  transform:translate(-50%,-100%);
}
.o-header__languageList li:first-child {
  border-bottom:solid 1px rgba(255,255,255,.1);
}
.o-header__languageList a,.o-header__languageList p {
  display:flex;
  align-items:center;
  justify-content:center;
  padding:1.6rem 0;
}
.o-header__languageButton {
  width:100%;
  height:100%;
  padding:0;
  background-color:var(--background-color)!important;
}
@media only screen and (min-width: 641px) {
  .o-header {
    padding-top:3.4rem;
  }
}
.o-header.-foundation .o-header__logo .a-svg {
  width:10rem;
  height:7.2rem;
}
@media only screen and (min-width: 1025px) {
  .o-header.-foundation .o-header__logo .a-svg {
    width:13.8rem;
    height:9.2rem;
  }
}
```
```css
/* site.pretty.css L1493-1591 */
.a-burger {
  position:absolute;
  top:50%;
  left:1.4rem;
  flex-direction:row;
  gap:1rem;
  padding:1.3rem 1.9rem;
  border-radius:4.4rem;
  background-color:#ffffff1a;
  outline:solid 1px rgba(255,255,255,0);
  transition:outline 1s cubic-bezier(.23,1,.32,1),color 1s cubic-bezier(.23,1,.32,1),background-color 1s cubic-bezier(.23,1,.32,1);
  transform:translateY(-50%);
  backface-visibility:hidden;
}
.a-burger:hover,.a-burger:focus {
  outline:solid 1px rgba(255,255,255,.4);
}
.a-burger rect {
  transition:fill .4s cubic-bezier(.23,1,.32,1);
  transform-origin:center center;
  transform-box:fill-box;
}
.a-burger span {
  line-height:1;
}
.-dark .a-burger {
  background-color:#00284d1a;
  color:#00284d;
  outline:solid 1px rgba(0,40,77,0);
}
.-dark .a-burger:hover,.-dark .a-burger:focus {
  outline:solid 1px rgba(0,40,77,.4);
}
.-dark .a-burger rect {
  fill:#00284d;
}
.a-buttonContact {
  position:absolute;
  top:50%;
  right:1.4rem;
  display:inline-flex;
  flex-direction:row;
  overflow:hidden;
  width:4rem;
  height:4rem;
  padding:1.4rem 2rem;
  border-radius:4.4rem;
  background-color:#c79d47;
  box-shadow:0 8px 10px #0c0a0900;
  transform:translateY(-50%);
}
.a-buttonContact__iconWrapper {
  position:absolute;
  top:50%;
  left:2rem;
  overflow:hidden;
  width:1.3rem;
  height:1.3rem;
  transform:translateY(-50%) translate(-50%);
}
@media only screen and (min-width: 1025px) {
  .a-buttonContact__iconWrapper {
    transform:translateY(-50%);
  }
}
@media only screen and (max-width: 1024px) {
  .a-buttonContact__label {
    display:none;
  }
}
.a-buttonContact .a-svg {
  position:relative;
  width:100%;
  height:100%;
  transition:transform .4s cubic-bezier(.23,1,.32,1),opacity .4s cubic-bezier(.23,1,.32,1);
}
@media only screen and (min-width: 1025px) {
  .a-buttonContact .a-svg {
    opacity:0;
    transform:translate(100%);
  }
}
.a-buttonContact:hover .a-svg {
  opacity:1;
  transform:translate(0);
}
@media only screen and (min-width: 1025px) {
  .a-buttonContact:hover {
    padding-left:4.3rem;
    box-shadow:0 8px 10px #0c0a092e;
  }
}
@media only screen and (min-width: 641px) {
  .a-buttonContact {
    right:2rem;
    width:auto;
    transition:padding-left .4s cubic-bezier(.23,1,.32,1),box-shadow .4s cubic-bezier(.23,1,.32,1);
  }
}
```

---

## 2. Side rail (`.o-sideMenu`), desktop only (`display: none` at ≤1024px)

- **Position:** fixed, `left: 0`, `top: 50%`, `translateY(-50%)` → x=0, y=328.5, **76x243px**.
- **Box:** `border-radius: 0 2rem 2rem 0`, `background var(--background-color)` = `rgba(255,255,255,.2)` (dark mode `rgba(0,13,26,.7)`). There is **no blur**.
- **Items:** 4 stacked `li`, each separated by a `1px rgba(255,255,255,.1)` bottom border. Buttons and links are **7.6rem x 6rem** (76x60), each holding a 13px icon.
  1. search
  2. contact: outline icon, swapping to a filled icon on hover (opacity .4s)
  3. references: grid icon, same stroked/filled swap
  4. `EN`: `tx-uni11`, 11px, uppercase
- **Hover:**
  - Siblings dim to `opacity: .5`; the hovered item stays at 1 (.4s).
  - A tooltip label (`tx-uni14 -tx600`, 14px) appears to the right. It moves from `translate(4.8rem,-50%)` at opacity 0 to `translate(3.2rem,-50%)` at opacity 1 (.4s ease-quint).
  - The label has `padding 1.5rem 1.8rem`, `radius .8rem`, the same translucent background, and a CSS triangle pointer (`border-right .8rem`).
  - The language item's tooltip shows "EN | FR" with a 1px `#CBCBCB` divider.
  - Frames: `hover_sidemenu_contact.png`, `hover_sidemenu_lang.png`.
- **`-isHidden`:** `transform: translateY(-50%) translate(-100%)`, transitioned `.4s ease-quint`. It is added on scroll-down, when the menu opens (after a 500ms `setTimeout`), and it starts shown at page top. It is removed on scroll-up and when the menu closes.

```css
/* site.pretty.css L7382-7492 */
.o-sideMenu {
  --background-color: rgba(255, 255, 255, .2);
  position:fixed;
  top:50%;
  left:0;
  z-index:19;
  border-top-right-radius:2rem;
  border-bottom-right-radius:2rem;
  background-color:var(--background-color);
  color:#fff;
  transition:transform .4s cubic-bezier(.23,1,.32,1),background-color 1s cubic-bezier(.23,1,.32,1);
  transform:translateY(-50%);
}
.-dark .o-sideMenu {
  --background-color: rgba(0, 13, 26, .7);
}
.o-sideMenu.-isHidden {
  transform:translateY(-50%) translate(-100%);
}
.o-sideMenu__label {
  position:absolute;
  top:50%;
  left:calc(100% - 2.4rem);
  width:auto;
  padding:1.5rem 1.8rem;
  border-radius:.8rem;
  background-color:var(--background-color);
  white-space:nowrap;
  opacity:0;
  pointer-events:none;
  transition:opacity .4s cubic-bezier(.23,1,.32,1),transform .4s cubic-bezier(.23,1,.32,1);
  transform:translate(4.8rem,-50%);
}
.o-sideMenu__label:before {
  content:"";
  position:absolute;
  top:50%;
  left:0;
  width:0;
  height:0;
  border-top:.8rem solid transparent;
  border-right:.8rem solid var(--background-color);
  border-bottom:.8rem solid transparent;
  transform:translate(-100%,-50%);
}
.o-sideMenu__item {
  position:relative;
  transition:opacity .4s cubic-bezier(.23,1,.32,1);
}
.o-sideMenu__item:not(:last-child) {
  border-bottom:solid .1rem rgba(255,255,255,.1);
}
.o-sideMenu__item>a,.o-sideMenu__item button {
  width:7.6rem;
  height:6rem;
}
.o-sideMenu__item .a-svg {
  width:1.3rem;
  height:1.3rem;
  transition:opacity .4s cubic-bezier(.23,1,.32,1);
}
.o-sideMenu__item .a-svg.-filled {
  position:absolute;
  top:50%;
  left:50%;
  opacity:0;
  transform:translate(-50%,-50%);
}
.o-sideMenu__item:hover .o-sideMenu__label {
  opacity:1;
  pointer-events:all;
  transform:translate(3.2rem,-50%);
}
.o-sideMenu__item:hover.-double .a-svg.-stroked {
  opacity:0;
}
.o-sideMenu__item:hover.-double .a-svg.-filled {
  opacity:1;
}
.o-sideMenu__item:last-child .o-sideMenu__label {
  display:flex;
  gap:1rem;
}
.o-sideMenu__list {
  display:flex;
  flex-direction:column;
}
.o-sideMenu__list:hover .o-sideMenu__item {
  opacity:.5;
}
.o-sideMenu__list:hover .o-sideMenu__item:hover {
  opacity:1;
}
.o-sideMenu__languageButton {
  display:inline-flex;
  flex-direction:row;
  gap:1.4rem;
  align-items:center;
}
.o-sideMenu__languageButton:first-child {
  padding-right:1.4rem;
  border-right:solid .1rem #CBCBCB;
}
.o-sideMenu__languageButton a,.o-sideMenu__languageButton p {
  gap:1rem;
}
@media only screen and (max-width: 1024px) {
  .o-sideMenu {
    display:none;
  }
}
```

---

## 3. Full-screen menu (`.o-menu`)

**How it opens.** There is **no clip-path or fade**. The menu is a fixed `#000d1a` layer at z 1 that sits *behind* the page (`.t-page` z 10), and opening the menu **moves the page away**:
- `.t-page` gets `.-cropped` (position fixed, 100vh, overflow hidden).
- `.m-pageScroller` gets an inline `translateY(-scrollY px)` so the current view stays in place.
- anime.js then tweens `.t-page`: `translateY: 0 → 100%`, `scale → 1222/1440 (0.84861)`, `borderRadius: 0 → 3.2rem`, **1000ms `easeOutQuint`**.
- Because `transform-origin` is top centre, the page shrinks into a rounded card and slides off the bottom of the screen.
- Scroll is locked (`body.style.overflow = hidden` plus Locomotive stop). The header stays on top and shows the ✕.

Measured `.t-page` transform:

| time | transform | border radius |
|---|---|---|
| 0ms | `matrix(.980,…, ty 118)` | 4.2px |
| 150ms | scale .909, ty 538 | 19px |
| 300ms | scale .872, ty 762 | 27px |
| 600ms | scale .850, ty 891 | 31.7px |
| 1000ms | scale .8486, ty 900 | 32px |

Frames: `menu_open_0000ms.png`, `menu_open_0150ms.png`, `menu_open_0300ms.png`, `menu_open_0600ms.png`, `menu_open_1000ms.png`, `menu_open_1600ms.png`; mobile `m390_menu_open_*.png`.

**Content timeline** (anime timeline, autoplay off; played on open, **reversed** on close):

| step | timing | target | tween | ease |
|---|---|---|---|---|
| 1 | 0–1000ms | `[data-menu=navigation]` (the nav wrapper) | `translateY: 50% → 0` | easeOutQuint |
| 2 | 0–1000ms, parallel with step 1 | each main link (`.o-menu__link`, inside `li { overflow: hidden }`) | `translateY: 100% → 0` | easeOutQuint |
| 3 | 1000–2000ms | secondary links (subnav and socials) | `translateY: 100% → 0` and `opacity: 0 → 1` | easeOutQuint |

- In step 2 all links move together (no stagger); they rise out of their clip masks.
- Step 3 therefore appears only after the main links have landed.

**Closing.** The timeline is reversed:
- The secondary links fade out first (1000ms).
- Meanwhile the page returns (`showLayout`): `translateY → 0`, `scale → 1`, `borderRadius 3.2rem → 0`, 1000ms easeOutQuint.
- Then the page's inline styles are cleared, `.-cropped` is removed, the scroll position is restored, and the timeline is seeked to 0.
- Frame: `menu_close_0300ms.png`.

```js
/* site.pretty.js L4844-4872 */
class ml extends Ki {
    constructor(t) {
        super(t);
        const e = {
            mouseenter: {
                link: "showVideo"
            },
            mouseleave: {
                link: "hideVideo"
            }
        };
        this.isVideosLoaded = !1, this.currentActiveLink = null, this.events = Ht() ? {} : e, this.setAnimation(), this.smokeTimeout = setTimeout(this.loadSmoke.bind(this), 1e3)
    }
    loadMedias(t) {
        !t || this.isVideosLoaded || (this.isVideosLoaded = !0, Ht() || this.$("video-element").forEach(e => {
            e.setAttribute("src", e.dataset.src), e.addEventListener("loadeddata", i => {
                i.target.classList.add("-loaded")
            }, !1)
        }), clearTimeout(this.smokeTimeout), this.loadSmoke())
    }
    loadSmoke() {
        const [t] = this.$("smoke");
        t.classList.contains("-loaded") || (t.setAttribute("src", t.dataset.src), t.addEventListener("loadeddata", e => {
            e.target.classList.add("-loaded")
        }, !1))
    }
    change(t) {
        this.visible !== t && (this.loadMedias(t), this.call("change", t, "Header", "header"), this.visible = t, t ? this.enter(t) : this.leave(t))
    }
```
```js
/* site.pretty.js L4912-5001 */
    hideLayout(t) {
        this.stickLayout(t);
        const [e] = this.$("t-page", ut);
        q.remove(e), q({
            targets: e,
            translateY: [0, "100%"],
            scale: 1222 / 1440,
            duration: 1e3,
            borderRadius: ["0", "3.2rem"],
            easing: "easeOutQuint"
        })
    }
    showLayout(t) {
        const [e] = this.$("t-page", ut), [i] = this.$("m-pagescroller", ut);
        q.remove(e), q({
            targets: e,
            translateY: 0,
            scale: 1,
            duration: 1e3,
            borderRadius: ["3.2rem", 0],
            easing: "easeOutQuint",
            complete: () => {
                this.stickLayout(t), e.removeAttribute("style"), i.removeAttribute("style"), this.tl.seek(0)
            }
        })
    }
    toggle() {
        this.change(!this.visible)
    }
    setAnimation() {
        const t = q.timeline({
                autoplay: !1,
                complete: () => {
                    if (!this.visible) {
                        const [i] = this.$("smoke");
                        i.classList.contains("-loaded") && i.pause()
                    }
                }
            }),
            [e] = this.$("navigation");
        t.add({
            targets: e,
            translateY: ["50%", 0],
            duration: 1e3,
            easing: "easeOutQuint"
        }), t.add({
            targets: this.$("link"),
            translateY: ["100%", 0],
            duration: 1e3,
            easing: "easeOutQuint"
        }, "-=1000"), t.add({
            targets: this.$("secondary-link"),
            translateY: ["100%", 0],
            opacity: [0, 1],
            duration: 1e3,
            easing: "easeOutQuint",
            changeBegin: () => {
                e.removeAttribute("style")
            }
        }), this.tl = t
    }
    stickLayout(t) {
        const [e] = this.$("t-page", ut), [i] = this.$("m-pagescroller", ut);
        e.classList.toggle("-cropped", t), i.style.transform = t ? `translateY(${-this.scrollY}px)` : "translateY(0)", t || window.scrollTo(0, this.scrollY)
    }
    resetScrollY() {
        this.scrollY = 0
    }
    toggleTimeline() {
        this.tl.began && (this.tl.reverse(), this.tl.progress === 100 && this.tl.direction === "reverse" && (this.tl.completed = !1)), this.tl.paused && this.tl.play()
    }
    enter(t) {
        if (window.requestAnimationFrame(() => {
                this.scrollBehaviour(t), this.el.setAttribute("aria-hidden", !t)
            }), this.toggleEvents(t), this.call("toggle", !t, "Scroll", "mainScroll"), this.scrollY = window.scrollY, this.visible) {
            const [e] = this.$("smoke");
            e.classList.contains("-loaded") && e.play()
        }
        this.toggleTimeline(), this.hideLayout(t), setTimeout(() => {
            const [e] = this.$("sidemenu", ut);
            e && e.classList.add("-isHidden")
        }, 500)
    }
    leave(t, e = !1) {
        window.requestAnimationFrame(() => {
            this.scrollBehaviour(t), this.el.setAttribute("aria-hidden", !t)
        }), this.toggleTimeline(), e || this.showLayout(t);
        const [i] = this.$("sidemenu", ut);
        i && i.classList.remove("-isHidden")
    }
```

**Layout (desktop 1425x900).**
- `.o-menu .row`: flex column, full height, padding `0 2rem`.
- **Main nav** `nav.o-menu__mainNavWrapper.lg-offset-7.lg-column-9`: left edge at 43.75% (x=626), width 56.25%, `margin-top: auto`. It shares the free space with the secondary wrapper, which puts the list top at about y=247.
  - The `ul` is a column with `gap: 1rem`.
  - Links are `tx-h3` (**60px / 61.8px, weight 300, -2.4px tracking**). Items are 61.8px tall.
- **Link states:**
  - All links default to `opacity .2` once the current-page link is marked `-active`. The active one is `opacity 1` with `font-variation-settings "wght" 600`.
  - While hovering the list, every link is `.2`, and the hovered link gets `opacity 1` plus `"wght" 600` (the others get `"wght" 300`).
  - Transition: `font-variation-settings, opacity, letter-spacing` at **1s ease-quint**, so the weight morphs smoothly.
  - Frames: `menu_hover_0250ms.png`, `menu_hover_settled.png`.
- **Hover video card** (desktop only):
  - Five `figure.o-menu__videoCard` elements (342x457, `radius 2rem`, `aspect-ratio 342/457`), absolutely positioned at `top: 50%; left: 50%`, with `transform-origin: bottom right` and `opacity 0`.
  - `mouseenter` on link *i* → anime 500ms `easeOutCubic`: `opacity 0→1`, `scale .8→1`, `translateY -25%→-50%`, `translateX -125%→-150%`, `rotate 6deg→-6deg`. Its video starts playing.
  - `mouseleave` → 500ms: `opacity→0`, `scale→.8`, `translateY→-25%`, `translateX→-225%`, `rotate→-12deg`. The video is then paused.
  - Net effect: a tilted video card swings in to the left of the links (centred about x 350) and swings out further left.
- **Bottom row:**
  - `.o-menu__subnav` ("Blog & news · Press room · FAQ") is absolutely positioned at `bottom: 4rem; left: 2rem`, flex with `gap 1rem`.
  - `.o-menu__secondaryMenuWrapper` (socials) is a row with `justify-content: flex-end`, `padding-bottom: 4rem`, and `gap: 1.6rem 3.2rem`.
  - All of these are `tx-cta` 14px `.a-link`s with the underline hover (`menu_secondary_hover.png`).
- **Smoke:**
  - `figure.o-menu__smoke` is absolute at the bottom, full width, `opacity .3`, `mix-blend-mode: screen`, z -1. It holds a looping muted `smoke.mp4` (desktop `height: auto`, about 631px).
  - A `::before` covers the top 15% with `linear-gradient(180deg, #000d1a, transparent)` in `multiply`.
  - The video plays only while the menu is open.
- **Mobile (<1025):**
  - Nav wrapper: `padding-top: 27lvh`, full width, links centred at 36px.
  - The subnav follows in normal flow (`margin-top: auto`).
  - Socials are centred and wrap.
  - A 40px `-secondary` search circle sits at `right 1.4rem; bottom 8rem`.
  - Smoke is `height: 36rem`.
  - Video cards are hidden.
  - The page card animation is the same (scale .8486, ty = 100vh).

```css
/* site.pretty.css L6682-6892 */
.o-menu {
  position:fixed;
  top:0;
  left:0;
  z-index:1;
  overflow:hidden;
  width:100%;
  height:100vh;
  background-color:#000d1a;
}
@supports (height: 100dvh) {
  .o-menu {
    height:100dvh;
  }
}
.o-menu .row {
  flex-flow:column nowrap;
  height:100%;
}
.o-menu__mainNavWrapper {
  flex:initial;
  height:100%;
  padding-top:27lvh;
  padding-bottom:2.25rem;
}
@media only screen and (min-width: 1025px) {
  .o-menu__mainNavWrapper {
    position:initial;
    height:initial;
    margin-top:auto;
    padding-top:initial;
    padding-bottom:0;
  }
}
.o-menu__subnav {
  margin-top:auto;
}
.o-menu__subnav ul {
  display:flex;
  gap:1rem;
  align-items:center;
  justify-content:center;
}
.o-menu__subnav .a-link {
  opacity:0;
}
@media only screen and (min-width: 1025px) {
  .o-menu__subnav {
    position:absolute;
    bottom:4rem;
    left:2rem;
  }
}
.o-menu__mainItem {
  overflow:hidden;
}
.o-menu__mainNav {
  display:flex;
  flex-flow:column nowrap;
  gap:1rem;
  height:100%;
}
@media only screen and (max-width: 1024px) {
  .o-menu__mainNav .o-menu__mainItem {
    text-align:center;
  }
}
.o-menu__mainNav.-active .o-menu__link {
  opacity:.2;
}
@media (hover: hover) and (any-pointer: fine) {
  .o-menu__mainNav:hover .o-menu__link {
    opacity:.2;
  }
}
@media only screen and (min-width: 1025px) {
  .o-menu__mainNav {
    position:initial;
  }
}
.o-menu__link {
  transition:font-variation-settings 1s cubic-bezier(.23,1,.32,1),opacity 1s cubic-bezier(.23,1,.32,1),letter-spacing 1s cubic-bezier(.23,1,.32,1);
  transform:translateY(100%);
}
.o-menu__link:before {
  content:unset;
}
.o-menu__link.-active {
  letter-spacing:-.02em;
  opacity:1!important;
  font-variation-settings:"wght" 600,"wdth" 50;
}
@media (hover: hover) and (any-pointer: fine) {
  .o-menu__link {
    font-variation-settings:"wght" 300,"wdth" 50;
  }
  .o-menu__link:hover {
    letter-spacing:-.02em;
    opacity:1!important;
    font-variation-settings:"wght" 600,"wdth" 50;
  }
}
.o-menu__secondaryMenuWrapper {
  display:flex;
  flex:initial;
  flex-direction:column;
  gap:2rem;
  justify-content:center;
  margin-top:auto;
  padding-bottom:4rem;
}
@media only screen and (min-width: 1025px) {
  .o-menu__secondaryMenuWrapper {
    flex-direction:row;
    justify-content:flex-end;
  }
}
.o-menu__secondary {
  display:flex;
  flex-flow:row wrap;
  gap:1.6rem 3.2rem;
}
@media only screen and (min-width: 1025px) {
  .o-menu__secondary:last-child {
    justify-content:flex-end;
  }
}
@media only screen and (max-width: 1366px) {
  .o-menu__secondary {
    justify-content:center;
  }
}
.o-menu__search {
  position:absolute;
  right:1.4rem;
  bottom:8rem;
  width:4rem;
  height:4rem;
  padding:0;
  pointer-events:auto;
  transform:translateY(-50%);
}
.o-menu__search:hover .a-svg {
  margin:0;
}
.o-menu__search .a-svg {
  position:relative;
  top:-.1rem;
  left:-.1rem;
}
@media only screen and (min-width: 1025px) {
  .o-menu__search {
    display:none;
  }
}
.o-menu__smoke {
  position:absolute;
  bottom:0;
  left:50%;
  z-index:-1;
  width:100%;
  max-width:none;
  height:36rem;
  opacity:.3;
  transform:translate(-50%);
  mix-blend-mode:screen;
}
.o-menu__smoke:before {
  content:"";
  position:absolute;
  top:0;
  left:0;
  display:block;
  width:100%;
  height:15%;
  background:linear-gradient(180deg,#000d1a,#000d1a00);
  mix-blend-mode:multiply;
}
.o-menu__smoke video {
  -o-object-fit:cover;
  object-fit:cover;
  width:100%;
  height:100%;
}
@media only screen and (min-width: 1025px) {
  .o-menu__smoke {
    width:100%;
    height:auto;
  }
  .o-menu__smoke video {
    height:auto;
  }
}
@media only screen and (max-width: 1024px) {
  .o-menu__videosWrapper {
    display:none;
  }
}
.o-menu__videoCard {
  position:absolute;
  top:50%;
  left:50%;
  overflow:hidden;
  width:34.2rem;
  border-radius:2rem;
  opacity:0;
  pointer-events:none;
  transform:translate(-100%,-50%);
  transform-origin:bottom right;
  aspect-ratio:342/457;
}
```

---

## 4. Hero (`section.m-hero.-home`)

**Markup.**

```html
<section class="m-hero -txcenter -clrwhite -home js-hero" data-scroll data-scroll-css-progress data-scroll-call="initModules,Website,website">
  <div class="row m-hero__content">
    <div class="m-hero__title column-16 lg-column-12 lg-offset-2 no-width">
      <div class="overflow-wrapper -static">
        <h1 class="m-titleContent m-hero__title">
          <span class="tx-website">Aquatique Show<sup>®</sup></span>
          <span class="tx-h1 js-title" data-scroll data-module-title>The <strong>wonder</strong> of<br><strong>water</strong> show</span>
        </h1>
      </div>
      <div class="m-moreContent" data-module-more-content>
        <div class="overflow-wrapper"><div class="m-textContent"><p>…</p></div></div>
        <div class="m-accordeon__scroll" data-more-content="scroll" aria-hidden="true"><div class="m-accordeon__content m-textContent"><p>…</p></div></div>
        <button class="m-moreContent__btn a-button -secondary"><span class="m-moreContent__details"></span><span class="sr-only">Open</span></button>
      </div>
    </div>
  </div>
  <div class="m-hero__scrollDown opacity-wrapper"><span class="-tx600 tx-uni11 -txupp">Scroll to discover</span><svg class="a-svg -arrow-right"/></div>
  <p class="m-hero__lastShow m- tx-ctasmall -txupp"><strong>Discover our creations, …</strong></p>
  <figure class="a-video m-hero__background"><video class="a-video__video -cover" playsinline autoplay muted loop data-scroll data-scroll-repeat data-scroll-call="togglePlay, InlineVideo, heroCover" src="…mp4"></video></figure>
  <figure class="a-video m-hero__cloudVideo"><video src="/assets/videos/smoke.mp4" muted loop playsinline autoplay data-scroll data-scroll-repeat …></video></figure>
</section>
```

**Background.**
- `figure.m-hero__background` is absolute, 100% x 100%, z -1. The video uses `object-fit: cover` (the source is 1350x720) with `.-cover` at z -2.
- **There is no dark overlay or gradient.** `.m-hero:before` exists but has no background; the footage itself is dark.
- The video play/pause is toggled when the hero enters or leaves the viewport.

**Smoke overlay.**
- `figure.m-hero__cloudVideo` is absolute at `bottom: 0`, full width.
- Desktop: the video is `width: 100%; height: auto`, about 629px tall on 1425.
- Mobile: `height: 50rem; width: auto`, i.e. 1132px wide and cropped.
- It uses `mix-blend-mode: screen` (black becomes transparent, leaving white mist) and `mask-image: linear-gradient(to bottom, transparent 0%, #0c0a09 10%)`, with `translateY(2px)`.
- It creates the white fog rising from the bottom that blends into the next section's cloud.

**Scroll effect.**
- The only scroll-driven effect is `.m-hero__background { transform: scale(calc(var(--progress) / 8 + 1)) }`.
- Locomotive writes `--progress` on the section. Because the hero is in the first fold, `progress = scrollY / heroHeight` (clamped to 0–1).
- The video therefore zooms from **1 → 1.125** over the first 900px of scroll. Measured at y=454: scale 1.063.
- There is no translate parallax.

**Layout (desktop).**
- `.m-hero__content` is a flex column, `justify-content: center`, `min-height: 100vh`, `padding: 14rem 0 10rem`, z 3.
- The title column is 75% wide (offset 12.5%), x=178, width 1069, with items centred.

| element | position (desktop) | measured |
|---|---|---|
| `tx-website` "Aquatique Show®" | y=230 | 50px/87.5px, weight 600, -1px tracking, 385px wide; `sup` 25px with `top: .2rem` |
| `h1.tx-h1` | y=317 | 80px/68px, weight 300, -4px tracking, `padding 1.2rem 1rem`, 160px tall (2 lines) |
| `h1` wrapper | | `padding: .8rem 0 1.2rem`, `margin-bottom: 3rem` |
| intro paragraph | y=519 | 16/24px, width **72.6667%** of the column (776.6px) |
| "+" button | y=635 | 53x53 circle: `padding 2rem`, `margin-top 2rem`, `bg rgba(255,255,255,.1)`; plus sign = two white 10x2 bars |

- **"+" button:**
  - Hover: `bg .15` and outline `.4`.
  - Click: the accordion opens. `.m-accordeon__scroll` height goes `0 → var(--heightscroll)` (the content's `scrollHeight`, 101px here). The duration is `--atransition = clamp(contentHeight/600, .7, 3)s` (measured **.7s**), `ease-in-out`.
  - The icon rotates 90deg and its `::before` rotates 90deg, so "+" becomes "−" (.3s ease-in-out).
  - The extra content has `padding-top 2.25rem` and `padding-bottom var(--vr)=3rem`.
  - Frames: `hover_hero_plus.png`, `hero_more_open.png`.
- **"SCROLL TO DISCOVER"** (`.m-hero__scrollDown`): absolute at `bottom 2.4rem` (1.6rem on mobile), full width, flex column, `gap .8rem`, centred.
  - Label: 11px, weight 600, uppercase.
  - Arrow: `arrow-right` at 13px, rotated 90deg so it points down.
  - It is **static** (no bounce).
  - Mobile: `position: relative; margin-top: 3.2rem`.
- **Bottom-right pill** (`.m-hero__lastShow`):
  - Desktop: absolute at `right 2rem; bottom 3rem`, measured 399.8x37.2.
  - `padding 1.2rem 2.6rem`, `radius 5rem`, `bg rgba(255,255,255,.1)`, 11px uppercase at weight **400**.
  - Enters with `opacity 0→1` and `translateY(100%)→0` over **1s ease-quint with a 1s delay** once the hero is `is-inview`.
  - Mobile: an inline-block in normal flow, `margin: 4.5rem 0 2.25rem`.
- **Mobile layout:**
  - `padding: 14rem 0 3rem`, and the hero height follows its content (869px at 390).
  - `tx-website` 36px, `h1` 56px/47.6px.
  - The paragraph has `1.4rem` side padding and full width.

**Entrance on load.** Everything starts together at `window.load`, as soon as the smoke video's metadata has loaded.
1. **Loader wipe** (`#js-loader`, fixed, z 99999, `mix-blend-mode: screen`):
   - Structure: a white `smoke.mp4` strip (masked to fade in at the top) on top of a 100vh white panel. The panel has a 35vh white-to-transparent gradient above it.
   - It starts at `top: 100%; translateY(-100%)`, so the white panel covers the screen.
   - anime tweens `translateY -100% → 0%` over **2500ms easeOutCubic**. The white panel slides down off-screen and the smoke strip trails over the page.
   - The loader is then removed.
   - Frames: `intro_t0000.png` (almost all white with smoke at the top), `intro_t0300.png`, `intro_t0600.png`, `intro_t1000.png`, `intro_t1500.png`, `intro_t2200.png`, `intro_t3000.png`, `intro_t4500.png`.
   - Measured loader `ty`: -1221 → -735 (300ms) → -388 (600ms) → -102 (1s) → -16 (1.5s), for a loader height of 1529.
2. **Title lines** (Title module on `.js-title`):
   - The text is split into words (`<span>` or `<strong>`, inline-block) and then grouped by `offsetTop` into lines: `span.a-line-wrapper` (`overflow: hidden; padding: 1.28% 0; margin-top: -4%`, with `-1.28%` for the first line) containing `span.a-line`.
   - anime: `translateY: 120% → 0%`, **2000ms easeOutExpo**, `delay: stagger(100ms, {easing: easeOutExpo})` (only when there is more than one line).
   - The element's opacity is set to 1 when it starts; CSS keeps `.m-hero .tx-h1 { opacity: 0 }` until then.
   - On complete, the original HTML is restored.
   - On mobile, a word longer than 10 characters disables the effect.
3. **CSS reveals**, started by the hero's `is-inview`:
   - The `h1` block (`tx-website` and the lines) and the paragraph run `enter-y` over 2s ease-quint.
   - The pill appears after a 1s delay.
   - Measured: paragraph `ty` 64.8px at load, 20px at 300ms, 5px at 600ms, 0 at 1.5s.

```js
/* site.pretty.js L3303-3375 */
class Vn extends j {
    constructor(t) {
        super(t), this.events = {}, this.isMobile = Ht(), this.el.style.height = `${this.el.getBoundingClientRect().height}px`, this.originalText = this.el.innerHTML, this.resizeEnabled = !1, this.enabled = !0, this.splitWords(this.el), this.enabled ? (this.splitLines(this.el), this.setAnimation()) : (this.revert(), this.el.style.hyphens = "auto")
    }
    splitWords(t) {
        const e = t.innerHTML.split(/\s+/);
        let i = !1;
        this.el.innerHTML = "";
        const n = [];
        e.forEach(s => {
            let o = "",
                l = "";
            s.includes("<br>") ? (o = s.split("<br>")[0], l = s.split("<br>")[1], o !== "" && (o = o.replace("<br>", ""), n.push(o)), n.push("<br>"), l !== "" && n.push(l)) : n.push(s)
        }), n.forEach(s => {
            const o = s;
            if (o.includes("<strong>") && (i = !0, s = s.replace("<strong>", "")), o.includes("</strong>") && (s.startsWith("</strong>") && (i = !1), s = s.replace("</strong>", "")), s.includes("<br>") && (this.el.innerHTML += "<br>"), s !== "" && s !== "<br>") {
                const l = this.createNodeElement(s, i);
                this.el.appendChild(l), this.el.innerHTML += " "
            }
            o.includes("</strong>") && (i = !1), s.length > 10 && this.isMobile && (this.el.style.opacity = 1, this.enabled = !1)
        })
    }
    createNodeElement(t, e) {
        const i = document.createElement(e ? "strong" : "span");
        return i.style.display = "inline-block", i.innerHTML = `${t}`, i
    }
    splitLines(t) {
        const e = t.children;
        this.lines = [];
        const i = [],
            n = [];
        for (let o = 0; o < e.length; o++) {
            const l = e[o].offsetTop;
            e[o].nodeName !== "BR" && (i.push({
                el: e[o],
                offset: l
            }), n.push(l))
        }
        const s = [...new Set(n)];
        this.el.innerHTML = "", s.forEach(o => {
            const l = i.filter(a => a.offset === o);
            this.lines.push(this.createLineElements(l, this.el))
        })
    }
    createLineElements(t, e) {
        const i = document.createElement("span"),
            n = document.createElement("span");
        return i.classList.add("a-line-wrapper"), n.classList.add("a-line"), i.style.display = "inline-block", n.style.display = "inline-block", t.forEach(s => {
            n.appendChild(s.el), n.innerHTML += " "
        }), i.appendChild(n), e.appendChild(i), n
    }
    setAnimation() {
        const t = this.lines,
            e = q.timeline({});
        this.el.style.opacity = 1, e.add({
            targets: t,
            translateY: ["120%", "0%"],
            delay: t.length > 1 ? q.stagger(100, {
                easing: "easeOutExpo"
            }) : 0,
            easing: "easeOutExpo",
            duration: 2e3,
            complete: () => {
                this.revert()
            }
        }), this.tl = e
    }
    revert() {
        this.el.innerHTML = this.originalText, this.el.style.height = "auto";
        const t = this.el.parentNode.parentNode;
        t.classList.contains("overflow-wrapper") && t.classList.add("-static")
    }
}
```
```css
/* site.pretty.css L2892-3146 */
.m-hero.-home .m-hero__content {
  padding:14rem 0 3rem;
}
@media only screen and (min-width: 1025px) {
  .m-hero.-home .m-hero__content {
    display:flex;
    flex-flow:column wrap;
    align-items:flex-start;
    justify-content:center;
    min-height:100vh;
    padding:14rem 0 10rem;
  }
}
.m-hero.-home .m-hero__title {
  margin-bottom:3rem;
}
.m-hero.-home .m-hero__background {
  transform:scale(calc(var(--progress) / 8 + 1));
}
.m-hero.-home .m-hero__scrollDown {
  margin-top:0;
}
@media only screen and (max-width: 1024px) {
  .m-hero.-home .m-hero__scrollDown {
    position:relative;
    bottom:0;
    margin-top:3.2rem;
  }
}
.m-hero.-home .m-moreContent {
  padding-right:1.4rem;
  padding-left:1.4rem;
}
@media only screen and (min-width: 1025px) {
  .m-hero.-home .m-moreContent {
    width:72.6667%;
    padding-right:0;
    padding-left:0;
  }
}
.m-hero.-home.--homeFoundation .m-hero__textContent {
  margin-bottom:3rem;
}
.m-hero.-home.--homeFoundation .m-hero__textContent .tx-h5 /* +5 alias selectors trimmed */ {
  margin-bottom:1.5rem;
}
@media only screen and (max-width: 1024px) {
  .m-hero.-home.--homeFoundation .m-hero__scrollDown {
    margin-bottom:3.2rem;
  }
}
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
.m-hero__lastShow {
  position:relative;
  z-index:3;
  display:inline-block;
  margin-top:4.5rem;
  margin-bottom:2.25rem;
  padding:1.2rem 2.6rem;
  border-radius:5rem;
  background-color:#ffffff1a;
  outline:solid 1px rgba(255,255,255,0);
  opacity:0;
  transition:opacity 1s cubic-bezier(.23,1,.32,1) 1s,transform 1s cubic-bezier(.23,1,.32,1) 1s;
  transform:translateY(100%);
}
.m-hero__lastShow .-tx600:after /* +31 alias selectors trimmed */ {
  content:"-";
  margin:0 .5rem;
}
.is-inview .m-hero__lastShow {
  opacity:1;
  transform:translateY(0);
}
@media only screen and (min-width: 1025px) {
  .m-hero__lastShow {
    position:absolute;
    right:2rem;
    bottom:3rem;
    margin-top:0;
    margin-bottom:0;
  }
  .m-hero__lastShow .-tx600:after /* +31 alias selectors trimmed */ {
    display:none;
  }
  .m-hero__lastShow span {
    display:block;
  }
}
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
/* site.pretty.css L3395-3433 */
.m-moreContent .m-accordeon__content {
  padding-top:2.25rem;
}
.m-moreContent__details {
  position:relative;
  display:inline-block;
  width:1.3rem;
  height:1.3rem;
  transition:transform .3s ease-in-out;
}
.m-moreContent__details:before,.m-moreContent__details:after {
  content:"";
  position:absolute;
  top:50%;
  left:50%;
  width:10px;
  height:2px;
  background-color:#fff;
  transform:translate(-50%,-50%);
}
.m-moreContent__details:before {
  transition:transform .3s ease-in-out;
}
.m-moreContent__details:after {
  transform:translate(-50%,-50%) rotate(90deg);
}
.m-moreContent__btn {
  margin-top:2rem;
  padding:2rem;
  border-radius:4.5rem;
  background-color:#ffffff1a;
  line-height:0;
}
.m-moreContent__btn[aria-expanded=true] .m-moreContent__details {
  transform:rotate(90deg);
}
.m-moreContent__btn[aria-expanded=true] .m-moreContent__details:before {
  transform:translate(-50%,-50%) rotate(90deg);
}
```
```css
/* site.pretty.css L2275-2292 */
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
```
```css
/* site.pretty.css L2058-2091 */
.a-loader {
  position:fixed;
  top:100%;
  left:0;
  z-index:99999;
  width:100%;
  transform:translateY(-100%);
  mix-blend-mode:screen;
}
.a-loader video {
  display:block;
  width:100%;
  height:auto;
  -webkit-mask-image:linear-gradient(to bottom,transparent 0%,#0c0a09 10%);
  mask-image:linear-gradient(to bottom,transparent 0%,#0c0a09 10%);
}
.a-loader__panel {
  position:relative;
  display:block;
  width:100%;
  height:100vh;
  background-color:#fff;
}
.a-loader__panel:before {
  content:"";
  position:absolute;
  top:0;
  left:0;
  display:block;
  width:100%;
  height:35vh;
  background:linear-gradient(0deg,#fff,#fff0 75%);
  transform:translateY(-99%);
}
```

Hero media (for reference only): `media/site/.../as_home-header_v4.mp4` (1350x720, dark fireworks and crowd footage) and `/assets/videos/smoke.mp4` (1304x576, white smoke on black).

---

## 5. Magic section (`section.o-homeMagic`)

**Box.**
- Background `#00284d`, `text-align: center`, `overflow: hidden`.
- Desktop: `display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 16rem 0 50rem`, measured **1236.8px** tall (doc y 900–2137).
- Mobile: `padding: 5.7rem 0 45rem`, 1005.8px tall.

**Background photo.**
- `figure.a-image` (a `[data-scroll]`) is `position: absolute; inset: 0; overflow: hidden`, covering the **whole section**.
- It is **not sticky and has no parallax.** The `img` uses `object-fit: cover` (source 1408x1024) and starts at `transform: scale(1.5)`.
- When the figure gets `is-inview` (its first pixel on screen), the image eases to `scale(1)` over **4s cubic-bezier(.23,1,.32,1)**. This is a slow zoom-out as you arrive.
  - Measured scale: 1.466 at y=25, 1.285 at y=219, 1.156 at y=454, 1.04 at y=931, 1 at about y=1600.
- `::before` adds a 15rem-tall top fade, `linear-gradient(0deg, #00284d00, #00284d)`, so the photo blends out of navy at the top.

**Cloud.**
- `.a-cloud.o-homeMagic__cloud` is absolute, full size, `bottom: -.1rem`, z 0, `pointer-events: none`.
- Background: `url(/assets/images/white-cloud.png)`, **2690x380** natural size, `background-position: bottom center`, no-repeat, at natural size (not scaled). It is cropped on both sides at 1425.
- It is a static white cloud band that makes the bottom of the section melt into the white products section. There is no animation.

**Content.**
- `.row` is `justify-content: center`, z 1.
- `.o-homeMagic__content.column-24.lg-column-8`: 50% wide (692.5px, x=366), a `display: grid` with `gap: 6rem` (4.5rem on mobile), z 2. It has `data-scroll-offset="20%, 20%"`, so its `.overflow-wrapper` children reveal once its top is 20% into the viewport.
- **Heading:** `h2.tx-h2` = `<strong>The Wonder of water,<br></strong>day after day`.
  - 80px/80px, -4.8px tracking. The bold part is 600, the rest 300. 244px tall (3 lines).
  - Wrapper `padding-bottom: .4rem`.
  - Reveal: `enter-y` 2s.
  - Mobile: 40px/40px, -1.6px.
- **Paragraph:** `p.tx-p.overflow-wrapper`, 16/24, white.
- **"+" button** (same component as the hero):
  - It reveals an `.m-accordeon__content` with a second paragraph.
  - Measured `--heightscroll` 173px; this instance kept the default `--atransition: .3s`.
  - `.m-textContent` gap is 4.5rem on desktop.
  - Frames: `magic_more_opening_0350ms.png`, `magic_more_open.png`.
- **CTA:** `a.a-button.-primary.-bgwhite.-clrdarkblue` "Discover our universe" with an arrow, 208.7x43.8.

Frames: `magic_top.png`, `magic_bottom_cloud.png`, `scroll_magic_mid.png`, `s003_y00967.png`.

```css
/* site.pretty.css L6322-6385 */
.o-homeMagic {
  position:relative;
  overflow:hidden;
  padding-top:5.7rem;
  padding-bottom:45rem;
  background-color:#00284d;
  text-align:center;
}
.o-homeMagic__cloud {
  z-index:0;
}
.o-homeMagic .a-image {
  position:absolute;
  bottom:0;
  left:0;
  overflow:hidden;
  width:100%;
  height:100%;
}
.o-homeMagic .a-image:before {
  content:"";
  position:absolute;
  top:0;
  left:0;
  width:100%;
  height:15rem;
  background:linear-gradient(0deg,#00284d00,#00284d);
}
.o-homeMagic .a-image img {
  -o-object-fit:cover;
  object-fit:cover;
  width:100%;
  height:100%;
  transition:transform 4s cubic-bezier(.23,1,.32,1);
  transform:scale(1.5);
}
.o-homeMagic .a-image.is-inview img {
  transform:scale(1);
}
.o-homeMagic .row {
  position:relative;
  z-index:1;
  justify-content:center;
}
.o-homeMagic__content {
  position:relative;
  z-index:2;
  display:grid;
  grid-template-columns:1fr;
  gap:4.5rem;
}
@media only screen and (min-width: 1025px) {
  .o-homeMagic {
    display:flex;
    align-items:center;
    justify-content:center;
    min-height:100vh;
    padding-top:16rem;
    padding-bottom:50rem;
  }
  .o-homeMagic__content {
    gap:6rem;
  }
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

Media: `test-magie-de-leau-copie-8` webp (night aerial of a fountain lake, blue light) and `white-cloud.png`.

---

## 6. Products (`.t-home__section.-bgwhite.-clrnavy > section.o-homeProducts`)

**Box.**
- White background, `text-align: center`, `overflow: hidden`.
- `padding: 6.5rem 0 10.5rem` on desktop (4rem 0 on mobile). Height 1050.6px.
- The inner row is `.row.-xl` (no max-width, 2rem side padding).

**Title block.**
- `form.o-homeProducts__title.lg-column-12.lg-offset-2.xlg-column-10.xlg-offset-3`: at ≥1367px it is 62.5% wide with an 18.75% offset (x=280, width 865.6). `margin-bottom: 7rem`.
- `h2.tx-h3.-clrdarkblue`: "Our **products**", 60px, `#000d1a`, `margin-bottom 3.75rem`.
- `.m-textContent.-clrgraydark` paragraph: 16/24 in `#4f4f4f`. Width 60% of the column at ≥1367 (50% at ≥1025), centred, `margin-bottom 4.5rem`.

**Category selector (`.m-catSelector`), desktop.**
- Container: `padding .6rem`, `border 1px #E3E3E3`, `radius 4rem`, `bg #fafafa`. Measured 865.6x76.4.
- Inner `.m-catSelector__list` is a flex row with `justify-content: space-between`.
- Four buttons (`tx-plarge`, 18px/32.4px), each `width: 100%` (212.9px), `padding 1.5rem .75rem`, `radius 4rem`, z 3.
  - Colour: inactive `#c5c5c5`; hover `#4f4f4f` with outline `1px rgba(79,79,79,.1)`; active `#fff`.
  - Transitions: colour .4s; outline .1s, or 1s on hover-in.
- **Sliding pill:** `.m-catSelector__list::before` is absolute, z 2, `width: calc(100% / var(--items-count))` (4 items → 212.9px), `height 100%`, `radius 4rem`, `background: var(--color)`, `transform: translate(calc(var(--offset) * 100%))`.
  - Transition: **`transform 1s cubic-bezier(.23,1,.32,1), background-color 1s`** (pure CSS).
  - On click, JS sets inline `--offset: <index>` and `--color: <button data-color>` on `.m-catSelector` inside rAF.
  - Button colours: All = `var(--clrdarkblue)`, Water show = `--clrfontaine`, Water effect = `--clraquatique`, Immersive fountain = `--clrgolddark`.
  - Quirk: the initial inline style is `--color: var(--clraquatique); --offset: 0`, so on load the "All" pill is **purple** (`#6541CB`).
  - Measured pill `tx`: 155px at 80ms, 339px at 250ms, 413px at 500ms, 426px at 1s (target 425.8 = 2×212.9).
  - Frames: `catselector_hover.png`, `catselector_hover2.png`, `catselector_click_0080ms.png` … `catselector_click_1000ms.png`.
- **Mobile (<1025):**
  - The list is hidden and a native `<select class="m-catSelector__selector tx-plarge">` shows instead: 100% wide, `padding 1.8rem`, `border 1px #E3E3E3`, `radius 4rem`, `bg #fafafa`, colour `#00284d`, left-aligned.
  - A custom chevron sits in `.m-catSelector::after` (10x5 data-URI SVG at `right 1.8rem`).
- **Filtering animation:**
  1. anime fades the slider section `opacity 1 → 0` over **150ms easeInOutQuad**.
  2. `fetch('/en/our-services.json?filter=<value>&page=1')` returns `{products: html}`, and the `ul` innerHTML is replaced.
  3. Embla `reInit({startIndex: 0})`, the dots are regenerated, and lazy images are updated.
  4. anime fades `opacity 0 → 1` over 150ms.
  - Example: "Water effect" goes from 13 cards to 8, and the dots from 10 to 5.
  - Rebuild tip: filter client-side with the same 150ms out / 150ms in, then rebuild the carousel.

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
```js
/* site.pretty.js L8407-8448 */
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
```
```js
/* site.pretty.js L8449-8471 */
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
```

**Card slider (`section.m-slider.-drag`, Embla v7).**
- Options: `{dots:true, loop:false, drag:true}` merged with the defaults `align:'start', containScroll:'trimSnaps', skipSnaps:false, inViewThreshold:.5, speed:10`. The ClassNames plugin adds `-inView`, `is-draggable` and `-dragging`.
- **Sizing:** `.o-homeProducts .m-slider { --item-size; --item-spacing: 1.5rem; overflow: visible }`, so cards run off the right edge. The page section clips at the viewport.
  - Each slide is `flex: 0 0 calc(100% / var(--item-size)); padding-left: var(--item-spacing)`.
  - The container has `margin-left: calc(var(--item-spacing) * -1)`.

| viewport | `--item-size` | card size |
|---|---|---|
| below 641px | **1.1** | 327.7x491.6 at 390 |
| ≥641px | **2.1** | |
| ≥1025px | **3.1** | |
| ≥1367px | **4.5** | slide 311.1px → card **296.1 x 444.2** at 1425 |

- **Card** `.m-sliderProducts__slideInner.-radius`:
  - `aspect-ratio: 320/480`, **`border-radius: 1rem`** (`.-radius`), `overflow: hidden`, `display: flex; align-items: flex-end`, white text, centred, `pointer-events: none` (the whole card is the `<a>`).
  - Layers:
    1. `figure.a-image.-cover` (z 0): the `img` uses `object-fit: cover`.
    2. `figure.a-video.-cover` (z 1): `opacity 0; transform: scale(1.03)`.
    3. Gradient `::before` (z 2): `linear-gradient(0deg, rgba(0,0,0,.8) 22.43%, rgba(0,0,0,0) 63.69%)`.
    4. Content (z 2): `.m-sliderProducts__slideContent`, a flex column with `gap 2.4rem` and `padding 3.2rem 2.4rem`.
  - Content order:
    1. Tag row (`gap .6rem`, wrap, centred). Each tag is a translucent `rgba(255,255,255,.24)` pill with `blur(.4rem)`, a 13px coloured dot icon and 10px uppercase weight 600 text.
    2. `h2.m-titleContent.tx-h4` title, e.g. `<strong>AquaStage®<br></strong>Water drone shows`. 40px/44px, -.8px; bold part 600, rest 300. Mobile 30px/32px.
    3. `p.tx-uni14` subtitle, 14/21.
- **Card hover** (Products module, desktop):
  - On `mouseover` of an `a[data-products]`, the card's video figure gets `-hover`. Its video `src` is lazily set from `data-src` and played.
  - The figure animates `opacity → 1` (.1s ease-in-out) and `scale(1.03) → 1` (.3s ease-in-out).
  - On leave: `-hover` is removed, the opacity fade has a .15s delay, and the video is paused.
  - While dragging, hover is disabled.
  - There is no image zoom.
  - Frame: `products_card_hover_drag_cursor.png`.
- **Custom drag cursor** (`.m-draggerIcon`, desktop only; there is no pointer cursor):
  - `cursor: none` on the viewport and links.
  - A 70x70 circle (`border 1px #fff`, `radius 50%`, `backdrop-filter: blur(10px)`) with a hand icon (`icon-dragging`, 23% size) and a "SWIPE" label (11px, weight 500, uppercase) 7px below.
  - It follows the mouse through `transform: translate3d(x-35px, y-35px, 0) scale(var(--scale))`. `mousemove` is throttled to 40ms, and the transform has a `.07s ease-out` transition.
  - Parent `.m-slider.-hover` (on mouseenter) sets `--scale: 1` and `opacity 1` (.4s ease-in-out). The circle's own transform is `.3s cubic-bezier(0,0,.2,1)`.
  - While dragging (`.m-slider__viewport.-dragging + .m-draggerIcon`), `--scale` is `.8`.
  - Hovering the circle itself scales it to 1.1.
- **Drag behaviour:** Embla's native mouse and touch drag, with free-scroll physics snapping to the nearest snap.
  - Measured: the content follows the pointer 1:1 (30px move → 30px). After release it settles from -333 to the snap at **-311.1px** (one slide) in about 0.6s with an exponential ease-out.
  - Frame: `products_dragging.png`.
- **Dots** (`.m-slider__dots`):
  - 5px dots, `gap .6rem`, `bg #4f4f4f` at opacity .2.
  - Active: `width 1.4rem`, opacity 1. Width animates .4s ease-quint **with a .6s delay**; opacity .4s.
  - Desktop: absolutely placed at `top: calc(100% + 5rem); left: 0` (y=3058).
  - Mobile: centred with `margin-top 3rem`.
- **Card entrance animation:** none. There is no rise or stagger rule for the slides in the CSS or JS (verified). Cards appear with the section; only lazy images fade in (.15s).
- **CTA:** `a.a-button.-primary.-bgnavy.-clrwhite.-wide` "Discover all our services" with an arrow.
  - `margin-top: 3rem; margin-left: auto`, so it is right-aligned on the dots row (x=1181, y=3038).
  - Full width on mobile.

```css
/* site.pretty.css L6564-6633 */
.o-homeProducts {
  overflow:hidden;
  padding-top:4rem;
  padding-bottom:4rem;
  text-align:center;
}
.o-homeProducts__title {
  margin-bottom:4.5rem;
}
.o-homeProducts .tx-h3,.o-homeProducts .m-textContent h3,.m-textContent .o-homeProducts h3 {
  margin-bottom:3.75rem;
}
.o-homeProducts .m-textContent {
  margin-bottom:4.5rem;
}
.o-homeProducts .a-button {
  margin-top:3rem;
  margin-left:auto;
}
.o-homeProducts .m-slider {
  --item-size: 1.1;
  --item-spacing: 1.5rem;
  overflow:visible;
}
.o-homeProducts .m-slider__viewport {
  cursor:none;
}
.o-homeProducts .m-sliderProducts__slide.-hidden {
  display:none;
}
.o-homeProducts .m-sliderProducts__slide a {
  cursor:none;
}
@media only screen and (min-width: 641px) {
  .o-homeProducts .m-slider {
    --item-size: 2.1;
  }
}
@media only screen and (min-width: 1025px) {
  .o-homeProducts {
    padding-top:6.5rem;
    padding-bottom:10.5rem;
  }
  .o-homeProducts__title {
    margin-bottom:7rem;
  }
  .o-homeProducts .m-textContent {
    width:50%;
    margin-right:auto;
    margin-left:auto;
  }
  .o-homeProducts .m-slider {
    --item-size: 3.1;
    position:relative;
  }
  .o-homeProducts .m-slider__dots {
    position:absolute;
    top:calc(100% + 5rem);
    left:0;
    margin-top:0;
  }
}
@media only screen and (min-width: 1367px) {
  .o-homeProducts .m-slider {
    --item-size: 4.5;
  }
  .o-homeProducts .m-textContent {
    width:60%;
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
/* site.pretty.css L4310-4394 */
.m-slider {
  --item-size: 1;
  --item-spacing: 2rem;
  --scale: 0;
  --x: 0;
  --y: 0;
  position:relative;
  width:100%;
}
.m-slider:not(.-keepOverflow) {
  overflow:hidden;
}
.m-slider__container {
  display:flex;
  height:auto;
  margin-left:calc(var(--item-spacing) * -1);
  backface-visibility:hidden;
  touch-action:pan-y;
}
.m-slider__slide {
  flex:0 0 calc(100% / var(--item-size));
  padding-left:2rem;
}
.m-slider__slide a {
  -webkit-user-select:none;
  -moz-user-select:none;
  user-select:none;
}
.m-slider__dots {
  gap:.6rem;
  height:.5rem;
  margin-top:3rem;
}
.m-slider__dot {
  display:inline-block;
  width:.5rem;
  height:.5rem;
  border-radius:2.4rem;
  background-color:#4f4f4f;
  opacity:.2;
  transition:width .4s cubic-bezier(.23,1,.32,1),opacity .4s cubic-bezier(.23,1,.32,1);
}
.m-slider__dot.-active {
  width:1.4rem;
  opacity:1;
  transition:width .4s cubic-bezier(.23,1,.32,1) .6s,opacity .4s cubic-bezier(.23,1,.32,1);
}
.m-slider .m-draggerIcon {
  z-index:2;
  width:auto;
  opacity:0;
  pointer-events:none;
  transition:transform .07s ease-out,opacity .4s ease-in-out;
}
.m-slider .m-draggerIcon__circle {
  transform:scale(var(--scale));
}
.m-slider .m-draggerIcon .a-svg {
  width:23%;
  height:23%;
}
.m-slider.-hover {
  --scale: 1;
}
.m-slider.-hover .m-draggerIcon {
  opacity:1;
}
.m-slider__viewport.-dragging+.m-draggerIcon {
  --scale: .8;
}
.m-slider__controls {
  display:flex;
  gap:2.4rem;
  align-items:center;
  justify-content:center;
  margin-top:5.2rem;
}
.m-slider__controls button {
  opacity:1;
  transition:opacity .15s ease-in-out;
}
.m-slider__controls button[disabled] {
  opacity:.3;
  cursor:not-allowed;
}
```
```css
/* site.pretty.css L5244-5285 */
.m-draggerIcon {
  position:absolute;
  top:0;
  left:0;
  color:#fff;
  text-align:center;
  will-change:transform;
}
.m-draggerIcon__circle {
  position:relative;
  width:7rem;
  height:7rem;
  border:1px solid #FFF;
  border-radius:50%;
  cursor:grab;
  transition:transform .3s cubic-bezier(0,0,.2,1);
  transform:scale(1);
  -webkit-backdrop-filter:blur(10px);
  backdrop-filter:blur(10px);
}
@media (hover: hover) and (any-pointer: fine) {
  .m-draggerIcon__circle:hover:not([aria-disabled]) {
    transform:scale(1.1);
  }
}
.m-draggerIcon .a-svg {
  position:absolute;
  top:50%;
  left:50%;
  width:30%;
  height:30%;
  transform:translate(-50%,-50%);
}
.m-draggerIcon .tx-ctasmall {
  position:absolute;
  top:calc(100% + .7rem);
  left:50%;
  width:7rem;
  text-align:center;
  transition:opacity .3s cubic-bezier(0,0,.2,1);
  transform:translate(-50%);
}
```
```js
/* site.pretty.js L6569-6621 */
class Xl extends j {
    constructor(t) {
        super(t), this.isActive = !0;
        const [e] = this.$("drag");
        this.drag = e, this.isDrag = e !== void 0 && !Ht(), this.isDrag ? (this.onMouseMove = zt(this.onMouseMove.bind(this), 40), this.events = {
            click: {},
            mousemove: {
                viewport: "onMouseMove"
            },
            mousedown: {
                viewport: "enterDrag"
            },
            mouseup: {
                viewport: "leaveDrag"
            },
            mouseleave: {
                viewport: "onMouseLeave"
            },
            mouseenter: {
                viewport: "onMouseEnter"
            }
        }) : this.events = {
            click: {}
        }
    }
    enterDrag() {
        this.call("toggleHoverable", !1, "Products", "products")
    }
    leaveDrag(t) {
        this.call("toggleHoverable", !0, "Products", "products"), this.call("onMouseMove", t, "Products", "products")
    }
    onMouseMove(t) {
        if (!this.isActive || !t.currentTarget) return;
        const e = {
                x: t.touches ? t.touches[0].clientX : t.clientX,
                y: t.touches ? t.touches[0].clientY : t.clientY
            },
            i = e.x - this.position.left - 35,
            n = e.y - this.position.top + (window.scrollY - this.position.y) - 35;
        window.requestAnimationFrame(() => {
            this.drag.style.transform = `translate3d(${i}px, ${n}px, 0) scale(var(--scale))`
        })
    }
    onMouseLeave() {
        this.isActive && window.requestAnimationFrame(() => {
            this.el.classList.remove("-hover")
        })
    }
    onMouseEnter() {
        this.isActive && window.requestAnimationFrame(() => {
            this.el.classList.add("-hover")
        })
    }
```
```js
/* site.pretty.js L7999-8035 */
class Ec extends j {
    constructor(t) {
        super(t), this.open = this.change.bind(this, !0), this.close = this.change.bind(this, !1), this.current = null, this.hoverable = !0, this.events = {
            mouseover: "onMouseMove",
            mouseleave: "onMouseLeave"
        }
    }
    toggleHoverable(t) {
        this.hoverable = t, t || this.onMouseLeave()
    }
    onMouseLeave() {
        this.current && (this.close(), this.current = null)
    }
    onMouseMove(t) {
        if (!t.target.dataset.products || !this.hoverable) {
            this.onMouseLeave();
            return
        }
        t.target !== this.current && (this.current = t.target, this.open())
    }
    change(t) {
        const {
            current: e
        } = this, [i] = this.$("video", e);
        if (!i) return;
        const n = i.parentNode;
        window.requestAnimationFrame(() => {
            n.classList.toggle("-hover", t), t ? i.src ? i.play() : (i.classList.add("-loaded"), i.dataset.poster && i.setAttribute("poster", i.dataset.poster), i.setAttribute("src", i.dataset.src), i.addEventListener("loadeddata", s => {
                n.classList.contains("-hover") ? s.target.play() : s.target.pause()
            }, !1)) : i.pause()
        })
    }
}

function Ur(r, t, e) {
    return (1 - e) * r + e * t
}
```

Media: 13 product cards, each a 600–1920px webp still plus a short `…_header_sticker_v2.m4v`/`.mp4` hover loop. All are dark night shots of fountains.

---

## 7. Shows (`div.-clrwhite.-bgnavy > section.o-homeShows`)

**Box.**
- Background `#0c0a09`, `display: flex; align-items: center; justify-content: center; min-height: 100vh; overflow: hidden`.
- Padding: `17rem 0 22rem` on desktop, `16rem 0` on mobile. Measured height 900 (doc y 3187–4087).

**The "grid" behind the heading is a single flat image, not DOM tiles.**
- `figure.a-image.-cover` is absolute, full size, z 0, `opacity: .7`, and holds a `<picture>`:
  - `home-show-placeholder-l` webp for ≥1024px. The real 1920 file is **1920x1020**.
  - `home-show-mobile` png for <1024px.
  - `object-fit: cover`.
- **There are no `data-scroll-speed` values and no column parallax.**
- The only motion: `transform: scale(1.2)` becomes `scale(1)` when the wrapper div is `is-inview`, with `transition: transform 4s ease-quint`. Measured 1.176 at 150ms, 1.075 at 600ms, 1.019 at 1.5s.
- The baked image content, measured on the 1920 file:
  - **3 full columns plus partial columns at both edges**: tiles about **486px wide** with **about 22–24px gaps**, columns at x 208–693, 716–1203 and 1225–1711.
  - Rows about **607px tall** (y 205–811), with partial rows above and below and the same gap.
  - Columns are aligned, not staggered.
  - Rounded tiles (radius about 16px at 1920) on a near-black `#090909` background, all heavily darkened (about 50% black).
  - Each tile has a solid tinted fill (maroon, purple or navy), a two-line centred title at the top (line 1 medium weight, line 2 regular), an inset rounded photo, a small circular logo mark, and two tiny uppercase lines (location / "DEPUIS <date>") at the bottom.
  - At 1425x900 the image is scaled by 0.882, so tiles appear about 429x535 with 20px gaps.
- To rebuild with your own content, bake an equivalent image, or build a static CSS grid of tiles (`grid-template-columns: repeat(3, 429px)`, gap 20px, centred, overflowing) inside the same `opacity: .7` and `scale(1.2 → 1)` figure.
- There is no extra scrim beyond the 70% opacity on the black background.

**Content** (z 2, centred):
- `.o-homeShows__content.lg-column-6`: 37.5% wide (519px), flex column, `gap 4rem`.
- **Heading:** `h2.tx-h2` "Our latest **creations**", 80px, 2 lines, 164px tall. Mobile 40px on one line.
- **Text:** `.m-textContent` (desktop `gap 1.2rem`) holding 2 paragraphs of 16/24. The first is wrapped in `<strong>` (600).
- Both heading and text are `.overflow-wrapper` reveals (`enter-y` 2s).
  - Measured `ty`: h2 126px and paragraph 138px at 150ms; 18/19px at 600ms; 0.5px at 1.5s.
- **Button:** `a.a-button.-primary.-bgwhite.-clrdarkblue.-boxed` "Discover all our references" (no icon, 221px).
  - It starts at `opacity 0; translateY(200%)` and goes to `1` / `0` with **2s ease-quint, .4s delay** when in view.
- Frames: `shows_enter_0150ms.png`, `shows_enter_0600ms.png`, `shows_enter_1500ms.png`, `shows_enter_4500ms.png`, `s009_y03064.png`, `m390_06_shows.png`.

```css
/* site.pretty.css L6634-6681 */
.o-homeShows {
  position:relative;
  display:flex;
  align-items:center;
  justify-content:center;
  overflow:hidden;
  min-height:100vh;
  padding:16rem 0;
  background-color:#0c0a09;
}
.o-homeShows .row {
  z-index:2;
  justify-content:center;
}
.o-homeShows__content {
  display:flex;
  gap:4rem;
  align-items:center;
  justify-content:center;
  text-align:center;
}
.o-homeShows .a-button {
  opacity:0;
  transition:transform 2s cubic-bezier(.23,1,.32,1) .4s,opacity 2s cubic-bezier(.23,1,.32,1) .4s;
  transform:translateY(200%);
}
.o-homeShows .a-video,.o-homeShows .a-image {
  transition:transform 4s cubic-bezier(.23,1,.32,1);
  transform:scale(1.2);
}
.o-homeShows .a-image {
  opacity:.7;
}
.is-inview .o-homeShows .a-video,.is-inview .o-homeShows .a-image {
  transform:scale(1);
}
.is-inview .o-homeShows .a-button {
  opacity:1;
  transform:translateY(0);
}
@media only screen and (min-width: 1025px) {
  .o-homeShows {
    padding:17rem 0 22rem;
  }
  .o-homeShows .m-textContent {
    gap:1.2rem;
  }
}
```

---

## 8. Video band (`.t-home__separator` + `section > .b-video`)

- **Separator:** `.t-home__separator.-bgwhite` is a white spacer, **10.5rem** on desktop and 4rem on mobile.
- **`.b-video.column-16`** is full width, so the section is full-bleed with no row.
  - `.b-video__iframe.a-ratio` has `aspect-ratio: 16/9` (1425x801.6; 390x219.4 on mobile) and is the YouTube mount point.
  - `.b-video__placeholder` is absolute and covers it. It contains:
    - an `img.b-video__cover` (`object-fit: cover`)
    - a `::before` scrim: `linear-gradient(0deg, rgba(0,0,0,.6) 22.85%, transparent 38.22%), linear-gradient(0deg, rgba(0,0,0,.5), rgba(0,0,0,.5))` (flat 50% black plus extra darkening at the bottom)
    - the play button
- **Play button:** absolutely centred with `translate(-50%,-50%)`, 88.6x41.2.
  - Flex with `gap 1rem`, `padding 1.4rem 2rem`, `radius 2.4rem`, `bg rgba(255,255,255,.1)`, outline `.1rem transparent`.
  - Contents: a 13px `icon-play` outline triangle and "PLAY" (11px, weight 600, uppercase, `top: .1rem`).
  - Hover: `bg rgba(186,186,186,.1)` and `outline .1rem #fff`, over .4s ease-quint (`hover_play_button.png`).
- **Click:** the video plays **inline, with no modal**.
  - `.b-video` gets `-playing`, so the placeholder goes to `opacity 0` (.4s ease-quint) with `pointer-events: none`.
  - The YouTube API creates an iframe (`youtube-nocookie.com`, `modestbranding=1&rel=0&showinfo=0&controls=2`) in the 16:9 box and plays video id `J8jqhjluCk0`.
  - When the video ends, `-playing` is removed.
  - Frames: `video_band.png`, `video_band_playing.png`.
- There is **no scroll animation** (no scale or clip) on this block.

```css
/* site.pretty.css L4891-4956 */
.b-video {
  position:relative;
}
.b-video__placeholder {
  position:absolute;
  width:100%;
  height:100%;
  transition:opacity .4s cubic-bezier(.23,1,.32,1);
}
.b-video__placeholder:before {
  content:"";
  position:absolute;
  top:0;
  left:0;
  z-index:1;
  width:100%;
  height:100%;
  background:linear-gradient(0deg,#0009 22.85%,#0000 38.22%),linear-gradient(0deg,#00000080,#00000080);
}
.b-video__playButton {
  position:absolute;
  top:50%;
  left:50%;
  z-index:2;
  display:flex;
  gap:1rem;
  align-items:center;
  padding:1.4rem 2rem;
  border-radius:2.4rem;
  background-color:#ffffff1a;
  color:#fff;
  outline:solid .1rem transparent;
  transform:translate(-50%,-50%);
}
.b-video__playButton span {
  position:relative;
  top:.1rem;
}
@media (hover: hover) and (any-pointer: fine) {
  .b-video__playButton {
    transition:background-color .4s cubic-bezier(.23,1,.32,1),outline .4s cubic-bezier(.23,1,.32,1);
  }
  .b-video__playButton:hover {
    background-color:#bababa1a;
    outline:solid .1rem #FFF;
  }
}
.b-video .a-svg {
  width:1.3rem;
  height:1.3rem;
}
.b-video__cover {
  -o-object-fit:cover;
  object-fit:cover;
}
.b-video__iframe {
  aspect-ratio:16/9;
}
.b-video iframe {
  width:100%;
  height:100%;
}
.b-video.-playing .b-video__placeholder {
  opacity:0;
  pointer-events:none;
}
```
```js
/* site.pretty.js L7930-7962 */
class yc extends j {
    constructor(t) {
        super(t), this.events = {
            click: {
                button: "onClick"
            }
        }, this.isVideoPlaying = !1, this.videoId = this.el.dataset.videoId
    }
    onClick() {
        this.el.classList.add("-playing"), this.player || (this.player = mc(`player-${this.videoId}`, {
            host: "https://www.youtube-nocookie.com",
            playerVars: {
                origin: window.location.host,
                modestbranding: 1,
                rel: 0,
                showinfo: 0,
                controls: 2
            }
        }), this.initEventChanges(), this.player.loadVideoById(this.videoId)), this.isVideoPlaying || this.player.playVideo()
    }
    initEventChanges() {
        this.player.on("stateChange", t => {
            switch (t.data) {
                case 1:
                    this.el.classList.add("-playing"), this.isVideoPlaying = !0;
                    break;
                case 0:
                    this.el.classList.remove("-playing"), this.isVideoPlaying = !1;
                    break
            }
        })
    }
}
```

---

## 9. News (`.t-home__footer > .row > section.o-homeNews.-radiusXl.-clrdarkblue`)

**Wrapper.**
- `.t-home__footer` is white, `padding: 10rem 0`, `overflow: hidden`.
- Its `.row` is a column with `gap: 10rem` between news and clients (the dark-UI trigger, see 1).

**Card.**
- `bg #faf7f1`, `border 1px solid rgba(0,13,26,.1)`, **radius 2rem** (`-radiusXl`), `overflow hidden`.
- Padding: `2.5rem` on desktop, `1.2rem 1.2rem 3rem` on mobile.
- Measured 1385x602 at x=20.

**Decor.**
- A gold quote SVG (`icon-quote`, `fill #C79D47`): desktop absolute at `top 6rem; right 4.5rem`, 138x109. Mobile 50x40, centred at `top 32.5rem`.
- `h2.tx-h3.-tx600` "Blog & news", 60px weight 600:
  - Desktop: absolute at `top 6rem; left 50%`, left-aligned, so it starts at the text column.
  - Mobile: `top 39rem`, centred, 36px.

**Slider** (Embla v7, `{controls:true, dots:true, loop:true, drag:false}`).
- The unknown `drag` key is ignored, so it is still mouse and touch draggable (`is-draggable`). The viewport has `cursor: default`.
- One slide per view (`--item-size: 1`), and the slide has `padding-left: 2rem`.
- **Slide `.m-homeNewsItem`**, desktop: `display: grid; grid-template-columns: 45% 35%; gap: 5%; align-items: flex-end; text-align: left`.
  - Image: `figure.a-image.-radiusXl` (radius 2rem) with `padding-bottom: 55rem`, so the box is **599.8 x 550**. The `img` is absolute with `object-fit: cover`.
  - Content (`.m-homeNewsItem__content`): a flex column with `gap 3.75rem`, `padding-bottom 1.5rem`, aligned left and bottom-aligned with the image. It holds:
    1. `p.tx-h5.-tx600` title (34/36, weight 600)
    2. `p.tx-pxlarge` excerpt (20/26)
    3. `a.a-button.-primary.-bgdarkblue.-clrwhite` "See article" with an arrow
- **Mobile slide:** block, centred. The image is 28rem tall with `margin-bottom 19rem`; the quote and title sit in that gap.
- **Slide transition:** Embla's physics scroll (`speed 10`), not a CSS transition.
  - Measured container `tx` after clicking next: -554 at 59ms, -928 at 99ms, -1127 at 140ms, -1233 at 182ms, -1319 at 265ms, -1343 at 359ms, -1350 at 446ms, settling at -1353 by about 900ms. That is a strong ease-out of about 0.45s.
  - At the same time, desktop slides fade: `.m-homeNewsItem { opacity: 0; transition: opacity .4s cubic-bezier(.215,.61,.355,1) }` becomes `1` on `.-inView`, and `.-dragging` sets `.5`. The result is a crossfade while sliding.
  - Frames: `news_slide_0250ms.png`, `news_slide2.png`.
- **Controls:** desktop `.m-slider__controls` is absolute at `right 4.5rem; bottom 2.5rem`, a `flex-direction: column-reverse` with `gap 1.8rem`, so **next is above prev**.
  - The two 90px `a-buttonSlider` rings are described in 0.6.
  - Loop is on, so they are never disabled.
  - Hidden on mobile.
- **Dots:** hidden on desktop. On mobile they are centred with `margin-top 3rem`.

Frames: `news_full.png`, `scroll_news.png`, `m390_08_news.png`, `m390_09_news_content.png`.

```css
/* site.pretty.css L6386-6503 */
.o-homeNews {
  position:relative;
  padding:1.2rem 1.2rem 3rem;
  border:1px solid rgba(0,13,26,.1);
  background-color:#faf7f1;
}
.o-homeNews .m-slider {
  --slider-border-color: #C79D47;
  --slider-icon-color: #00284D;
}
.o-homeNews .tx-h3,.o-homeNews .m-textContent h3,.m-textContent .o-homeNews h3 {
  position:absolute;
  top:39rem;
  left:0;
  z-index:1;
  width:100%;
  text-align:center;
}
.o-homeNews>.a-svg {
  position:absolute;
  top:32.5rem;
  left:50%;
  z-index:1;
  width:5rem;
  height:4rem;
  transform:translate(-50%);
}
.o-homeNews .m-slider__viewport {
  cursor:default;
}
.o-homeNews .m-slider__controls {
  display:none;
}
@media only screen and (min-width: 1025px) {
  .o-homeNews {
    padding:2.5rem;
  }
  .o-homeNews .tx-h3,.o-homeNews .m-textContent h3,.m-textContent .o-homeNews h3 {
    top:6rem;
    left:50%;
    text-align:left;
  }
  .o-homeNews>.a-svg {
    top:6rem;
    right:4.5rem;
    left:initial;
    width:13.8rem;
    height:10.9rem;
    transform:initial;
  }
  .o-homeNews .m-slider__dots {
    display:none;
  }
  .o-homeNews .m-slider__controls {
    position:absolute;
    right:4.5rem;
    bottom:2.5rem;
    display:flex;
    flex-flow:column-reverse;
    gap:1.8rem;
  }
}
.m-homeNewsItem {
  width:100%;
  text-align:center;
}
.m-homeNewsItem .a-image {
  position:relative;
  overflow:hidden;
  width:100%;
  margin-bottom:19rem;
  padding-bottom:28rem;
}
.m-homeNewsItem .a-image img {
  position:absolute;
  top:0;
  left:0;
  -o-object-fit:cover;
  object-fit:cover;
  width:100%;
  height:100%;
}
.m-homeNewsItem__content {
  display:flex;
  flex-flow:column nowrap;
  gap:3.75rem;
  align-items:center;
  justify-content:center;
}
@media (hover: hover) and (any-pointer: fine) {
  .m-homeNewsItem {
    opacity:0;
    transition:opacity .4s cubic-bezier(.215,.61,.355,1);
  }
  .-dragging .m-homeNewsItem {
    opacity:.5;
  }
  .m-homeNewsItem.-inView {
    opacity:1;
  }
}
@media only screen and (min-width: 1025px) {
  .m-homeNewsItem {
    display:grid;
    grid-template-columns:45% 35%;
    gap:5%;
    align-items:flex-end;
    text-align:left;
  }
  .m-homeNewsItem .a-image {
    margin-bottom:0;
    padding-bottom:55rem;
  }
  .m-homeNewsItem__content {
    align-items:flex-start;
    padding-bottom:1.5rem;
  }
}
```

Media: 3 article images (1000x718, 1000x749, 2000x1414 webp).

---

## 10. Clients (`.o-homeClients.column-16.-clrdarkblue`)

- **Title:** `h2.tx-h3` "They **trust** us", 60px, left-aligned on desktop (centred on mobile), `margin-bottom 4.5rem`.
- **Marquee:**
  - `.m-marquee` is a flex row. Its overflow is **visible** inside `.t-home__footer`, which clips at the viewport, so tiles bleed edge to edge.
  - `.m-marquee__viewport` is one long flex row: 27 client tiles repeated 3 times, 81 in total, 21870px wide.
- **Tile `.m-client.-radiusXl`:**
  - **250px wide** (15rem on mobile), `margin-right 2rem` (1rem on mobile).
  - The height comes from `::before { padding-bottom: 80% }`, giving **250x200.4**.
  - `border 1px solid #CBCBCB`, **radius 2rem**, white.
  - The logo sits centred inside a box of `calc(100% - 5rem)` in both directions, with `img { width: auto; max-width: 100%; max-height: 100% }`.
  - The link covers the tile.
  - **Hover:** `z-index 2; box-shadow: 0 3.4rem 3rem rgba(7,30,50,.1)` (.4s ease-quint). There is no scale (`hover_client_tile.png`).
- **Motion (Marquee module):**
  - Options `{autoplay:false}` plus the defaults `direction:true, speed:1, hover:false`.
  - It moves **1px per requestAnimationFrame, leftwards** (about 60px/s at 60Hz; measured 144px/s at 144fps). The loop is JS-driven by rAF, not a CSS animation, with `matrix(1,0,0,1,x,0)`.
  - It is toggled on and off by `data-scroll-call="toggle,Marquee"` (repeat), so it runs **only while the marquee is in the viewport**.
  - **It does not pause on hover.**
  - Looping: when `|x| ≥ viewport width` the position resets to 0. Each tile that has scrolled out on the left gets `left: 100%`, i.e. `position: relative`, pushed past the end, and the style is removed when it wraps.
  - Rebuild tip: use a duplicated track with `translateX` driven by rAF at 1px/frame, or a CSS `linear infinite` animation at about 60px/s that pauses via IntersectionObserver.

```css
/* site.pretty.css L6161-6179 */
.o-homeClients {
  text-align:center;
}
.o-homeClients .tx-h3,.o-homeClients .m-textContent h3,.m-textContent .o-homeClients h3 {
  margin-bottom:4.5rem;
}
.o-homeClients .m-client {
  width:15rem;
  margin-right:1rem;
}
@media only screen and (min-width: 1025px) {
  .o-homeClients {
    text-align:left;
  }
  .o-homeClients .m-client {
    width:25rem;
    margin-right:2rem;
  }
}
```
```css
/* site.pretty.css L2506-2551 */
.m-client {
  position:relative;
  width:100%;
  border:1px solid #CBCBCB;
  box-shadow:0 3.4rem 3rem 0 transparent;
  transition:box-shadow .4s cubic-bezier(.23,1,.32,1);
}
.m-client:hover {
  z-index:2;
  box-shadow:0 3.4rem 3rem #071e321a;
}
.m-client:before {
  content:"";
  display:block;
  padding-bottom:80%;
}
.m-client .a-image {
  position:absolute;
  top:50%;
  left:50%;
  display:flex;
  align-items:center;
  justify-content:center;
  width:calc(100% - 5rem);
  height:calc(100% - 5rem);
  transform:translate(-50%,-50%);
}
.m-client a {
  position:absolute;
  top:0;
  left:0;
  display:flex;
  align-items:center;
  justify-content:center;
  width:100%;
  height:100%;
}
.m-client a .a-image {
  width:calc(100% - 5rem);
  height:calc(100% - 5rem);
}
.m-client img {
  width:auto;
  max-width:100%;
  max-height:100%;
}
```
```css
/* site.pretty.css L3363-3394 */
.m-marquee {
  display:flex;
  flex-flow:row nowrap;
  overflow:hidden;
  width:100%;
  white-space:nowrap;
}
.m-marquee.-disabled {
  justify-content:center;
}
.m-marquee__viewport {
  display:flex;
  flex:0 0 auto;
  flex-flow:row nowrap;
  align-items:center;
  white-space:initial;
}
.m-marquee__item {
  position:relative;
  flex-shrink:0;
  height:12rem;
  margin-right:3rem;
}
.m-marquee__item img {
  width:auto;
  height:100%;
}
@media only screen and (min-width: 1025px) {
  .m-marquee__item {
    margin-right:10rem;
  }
}
```
```js
/* site.pretty.js L8294-8393 */
class Pc extends j {
    constructor(t) {
        super(t), this.play = this.change.bind(this, !0), this.stop = this.change.bind(this, !1), this.options = this.setOptions(), this.active = this.options.autoplay, this.options.direction && (this.options.speed = -this.options.speed), this.width = 0, this.position = 0, this.els = [];
        const [e] = this.$("viewport");
        this.viewport = e, this.options.hover && (this.events = {
            mouseenter: "stop",
            mouseleave: "play"
        })
    }
    setOptions() {
        const t = {
            pause: !1,
            hover: !1,
            autoplay: !1,
            direction: !0,
            speed: 1
        };
        try {
            const e = JSON.parse(this.el.dataset.config);
            return this.el.removeAttribute("data-config"), Object.assign(t, e)
        } catch {
            return t
        }
    }
    setEls() {
        const t = this.$("slide"),
            e = [],
            i = t.length - 1;
        for (let n = 0; n <= i; n += 1) {
            const s = t[n];
            s.removeAttribute("style");
            const o = s.getBoundingClientRect(),
                l = o.width;
            e.push({
                el: s,
                width: l,
                left: o.left,
                moved: !1
            })
        }
        this.els = e
    }
    setSizes() {
        this.width = this.viewport.offsetWidth, this.limit = this.el.offsetWidth, this.maxRevert = -this.width + this.limit, this.position = this.options.direction ? 0 : this.maxRevert, this.setPosition(), this.setEls(), this.playable = this.width > this.limit, this.options.autoplay && (this.active = this.playable);
        const t = this.playable ? "remove" : "add";
        window.requestAnimationFrame(() => {
            this.el.classList[t]("-disabled")
        })
    }
    resize() {
        this.active && this.setSizes()
    }
    toggle() {
        this.change(!this.active)
    }
    toggleEnter({
        enter: t
    }) {
        this.change(t)
    }
    change(t) {
        this.playable && (this.active = t)
    }
    animate() {
        if (!this.active) return;
        const t = this.updatePosition();
        this.updateEls(t)
    }
    updatePosition() {
        let t = !1,
            e = this.position + this.options.speed;
        return this.options.direction && Math.abs(e) >= this.width && (e = 0, t = !0), !this.options.direction && e >= this.limit && (e = this.maxRevert, t = !0), this.position = e, t
    }
    aAnimate() {
        this.active && this.setPosition()
    }
    setPosition() {
        const t = Ac(Cc(this.position, 0));
        this.viewport.style.transform = Ic(t)
    }
    updateEls(t) {
        const {
            els: e
        } = this, i = e.length - 1;
        for (let n = i; n >= 0; n -= 1) {
            const s = e[n];
            s.outside = this.isOutsideViewport(s), t && s.moved && !s.outside ? (s.moved = !1, s.el.removeAttribute("style")) : this.updateElPosition(s)
        }
    }
    updateElPosition(t) {
        t.moved || t.outside && (t.moved = !0, t.el.style.left = this.options.direction ? "100%" : "-100%")
    }
    isOutsideViewport(t) {
        const e = t.left + this.position;
        return this.options.direction && e + t.width < 0 || !this.options.direction && e + this.maxRevert > 0
    }
    initModule() {
        this.setSizes()
    }
}
```

Media: 27 client logos (png and webp).

**Breadcrumb** (between clients and prefooter): a white bar with `padding 3rem 0`, `border-top 1px #ececec`, and `#a8a8a8` 14px text ("Home") at the 1-column offset (x=106.6).

```css
/* site.pretty.css L5010-5034 */
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
```

---

## 11. Prefooter (`section.o-prefooter`)

- **Box:** background **`#c79d47`**, white text, `overflow: hidden`.
  - Padding: `7.5rem 0 6rem` on desktop (from 641px), `6rem 0` on mobile, where it is also `text-align: center`.
  - Height 329.3px on desktop.
- **Row** (z 2), three columns:
  1. `.lg-column-3` holding `.o-prefooter__logo`: a centred **17.7rem** (177x119) white logo image, `margin-bottom 7.5rem` (it overflows the band height on desktop, which is harmless).
  2. `h3.tx-h3.o-prefooter__title.lg-column-6.lg-offset-1`: "Aquatique Show<br><strong>Foundation</strong>", 60px/61.8px. Line 1 is 300, line 2 is 600. `margin-bottom 3.75rem`. Mobile 36px.
  3. `.lg-column-5.lg-offset-1` holding `.o-prefooter__contentWrapper`:
     - `div.tx-p.o-prefooter__description` (16/24, `margin-bottom 3.75rem`; 4.5rem on mobile)
     - `a.a-button.-outline` "Discover" with an arrow: white pill, gold `1px` border, gold text, 129x45.8
- **Watermark:** `svg.o-prefooter__symbol` (the brand "aS" mark) is absolute and centred (`top/left 50%`, `translate(-50%,-50%)`), `width 100%; max-width 73rem` (730x886 with `aspect-ratio 351/426`), **opacity .07**, white. On mobile it sits at `bottom -4rem; left 0`.
- There is no motion.

Frames: `prefooter.png`, `m390_11_prefooter.png`.

```css
/* site.pretty.css L6897-6978 */
.o-prefooter {
  position:relative;
  overflow:hidden;
  padding:6rem 0;
  background-color:#c79d47;
  color:#fff;
}
.o-prefooter__logo {
  display:flex;
  margin-bottom:7.5rem;
}
.o-prefooter__logo img {
  width:17.7rem;
  margin:0 auto;
}
.o-prefooter__title {
  margin-bottom:3.75rem;
}
@media only screen and (max-width: 1024px) {
  .o-prefooter__title {
    align-items:center;
    width:100%;
  }
}
.o-prefooter__contentWrapper {
  align-items:flex-start;
}
.o-prefooter__description {
  margin-bottom:4.5rem;
}
@media only screen and (min-width: 641px) {
  .o-prefooter__description {
    align-items:flex-start;
    margin-bottom:3.75rem;
  }
}
.o-prefooter__symbol {
  position:absolute;
  bottom:-4rem;
  left:0;
  width:100%;
  max-width:73rem;
  opacity:.07;
  aspect-ratio:351/426;
}
@media only screen and (min-width: 641px) {
  .o-prefooter__symbol {
    top:50%;
    bottom:auto;
    left:50%;
    text-align:center;
    transform:translate(-50%,-50%);
  }
}
.o-prefooter__background {
  position:absolute;
  top:0;
  left:0;
  -o-object-fit:cover;
  object-fit:cover;
  width:100%;
  height:100%;
  opacity:0;
  pointer-events:none;
}
.o-prefooter__background[data-lazy].-loaded {
  opacity:.2;
}
.o-prefooter .row {
  position:relative;
  z-index:2;
}
@media only screen and (max-width: 1024px) {
  .o-prefooter {
    text-align:center;
  }
}
@media only screen and (min-width: 641px) {
  .o-prefooter {
    padding-top:7.5rem;
  }
}
```

---

## 12. Footer (`footer.o-footer`)

**Box.**
- `bg #000d1a`, white, `overflow: hidden`.
- Padding: `8rem 0 2.25rem` from 641px (2.25rem 0 below).
- **Background image:** `<picture>` with `visuel-footer.jpg` (1600x1067) for ≥800px and `visuel-footer-mobile.jpg` below. The `img.o-footer__background` is absolute, `object-fit: cover`, at **opacity .2** once loaded (0 before). It shows a dark crowd and fountain photo faintly.

**Upper row.**
1. **Newsletter panel** `form.m-newsletterForm.lg-column-14.lg-offset-1` (x=106.6, 1211.9 wide):
   - Background **`#00284d`**, **radius 2rem**, **padding 6rem**, `margin-bottom 7.5rem`.
   - Desktop: `display: grid; grid-template-columns: 1fr 1fr; gap: 1rem 3.2rem; align-items: center`. Height 202.
   - Label: `label.tx-h5` "Subscribe to keep up<br><strong>all Aquatique Show news</strong>" (34/36; line 2 at 600).
   - Right panel (`max-width 48rem`): an email input pill, 480x50.
     - `padding 1.3rem 4.8rem 1.3rem 2.5rem`, `radius 7rem`, `bg rgba(255,255,255,.1)`, white 16px text, placeholder "Your e-mail" in inherited colour.
     - A submit arrow (22px, `arrow-down` rotated 270deg) sits at `right 1.8rem`.
   - A hidden GDPR checkbox row appears under it (`-visible`).
   - Mobile: flex column, `padding 2.25rem 1.5rem`, centred 22px label.
2. **About** `.o-footer__about.lg-column-7.lg-offset-1`:
   - Label "ABOUT": `tx-uni14`, weight 900, uppercase, `margin-bottom 4.5rem`.
   - `p.tx-h5` statement: 34/36, 4 lines, 606px wide.
   - The block has `margin-bottom 6rem`.

**Middle row** (`.row.o-footer__middle`): `border-top: .1rem solid rgba(255,255,255,.2)`, `padding-top 4.5rem`, `gap 3.75rem`, `margin-bottom 3.75rem`. Three columns:
1. **Contact** (`lg-column-3 lg-offset-1`): heading (14px, weight 900, `margin-bottom 3.75rem`) and an address in `tx-psmall` (14/21).
2. **Direct access** (`lg-column-3`): heading, then a `ul` grid with **2 columns** and `gap 1.5rem` of `tx-cta` 14px `.a-link` items (underline hover 1s).
3. **Our services** (`lg-column-7`): the same, with **3 columns** from 641px.

**Lower row** (`.row.o-footer__lower`): `border-top` in the same style, `padding-top 3rem`. The desktop visual order is set with `order`:
1. `p.o-footer__credit.tx-pxsmall.lg-column-4.lg-offset-1` "©2024 …" (12px)
2. `ul.o-footer__socials.lg-column-5`: flex row, `gap 3rem`, 14px links
3. `a.o-footer__iaapaMember.lg-column-1.lg-offset-1`: a 9rem-wide logo
4. `.o-footer__language.lg-column-1.lg-offset-1`: "English ▾" button
   - The arrow is a 10px `arrow-toggle` that rotates 180deg when open (.4s).
   - Dropdown: a white card, `radius .8rem`, text `#00284d`, items `padding 1rem 1.6rem` (hover `bg rgba(186,186,186,.2)`).
   - It opens **upwards**: `opacity 0→1` and `translateY(-80%)→(-100%)`, .4s ease-quint (`footer_language_open.png`).
- **Mobile:**
  - Socials and language form two 50% columns.
  - IAAPA moves to the right with `margin-top -10rem`.
  - The credit goes last, with a full-bleed top rule (`::before` 100vw, 1px `rgba(255,255,255,.2)`), `margin-top 3.75rem`, `padding-top 3rem`.

Frames: `footer_full.png`, `hover_footer_link.png`, `m390_12_footer.png`, `m390_13_footer_links.png`, `m390_14_footer_bottom.png`.

```css
/* site.pretty.css L5620-5804 */
.o-footer {
  position:relative;
  overflow:hidden;
  padding:2.25rem 0;
  background-color:#000d1a;
  color:#fff;
}
.o-footer__background {
  position:absolute;
  top:0;
  left:0;
  -o-object-fit:cover;
  object-fit:cover;
  width:100%;
  height:100%;
  opacity:0;
  pointer-events:none;
}
.o-footer__background[data-lazy].-loaded {
  opacity:.2;
}
.o-footer__linksList {
  display:grid;
  gap:1.5rem;
}
.o-footer__links:nth-child(2) .o-footer__linksList {
  grid-template-columns:1fr 1fr;
}
@media only screen and (min-width: 641px) {
  .o-footer__links:nth-child(3) .o-footer__linksList {
    grid-template-columns:repeat(3,1fr);
  }
}
.o-footer__columnHeading {
  margin-bottom:1.5rem;
}
@media only screen and (min-width: 641px) {
  .o-footer__columnHeading {
    margin-bottom:3.75rem;
  }
}
.o-footer .a-link {
  text-align:left;
}
.o-footer__about {
  margin-bottom:4.5rem;
}
.o-footer__about span {
  display:block;
  margin-bottom:2.25rem;
}
@media only screen and (min-width: 641px) {
  .o-footer__about span {
    margin-bottom:4.5rem;
  }
}
@media only screen and (min-width: 641px) {
  .o-footer__about {
    margin-bottom:6rem;
  }
}
.o-footer__middle {
  gap:3.75rem;
  margin-bottom:3.75rem;
  padding-top:3rem;
  border-top:solid .1rem rgba(255,255,255,.2);
}
@media only screen and (min-width: 641px) {
  .o-footer__middle {
    padding-top:4.5rem;
  }
}
.o-footer__lower {
  padding-top:3.75rem;
  border-top:solid .1rem rgba(255,255,255,.2);
}
@media only screen and (min-width: 1025px) {
  .o-footer__lower {
    padding-top:3rem;
  }
}
@media only screen and (min-width: 1025px) {
  .o-footer__socials {
    display:flex;
    flex-direction:row;
    gap:3rem;
    order:2;
  }
}
.o-footer__language {
  position:relative;
}
.o-footer__language div {
  display:flex;
  justify-content:flex-end;
}
.o-footer__language .a-svg {
  width:1rem;
  height:1rem;
  margin-left:1rem;
  transition:transform .4s cubic-bezier(.23,1,.32,1);
}
@media only screen and (min-width: 1025px) {
  .o-footer__language {
    order:3;
  }
}
.o-footer__languageCurrent,.o-footer__languageItem {
  display:flex;
  flex-direction:row;
  gap:1rem;
  align-items:center;
  justify-content:center;
}
.o-footer__languageList {
  position:absolute;
  top:-.8rem;
  right:0;
  overflow:hidden;
  border-radius:.8rem;
  background-color:#fff;
  color:#00284d;
  opacity:0;
  pointer-events:none;
  transition:opacity .4s cubic-bezier(.23,1,.32,1),transform .4s cubic-bezier(.23,1,.32,1);
  transform:translateY(-80%);
}
.o-footer__languageList .o-footer__languageItem {
  padding:1rem 1.6rem;
  transition:background-color .4s cubic-bezier(.23,1,.32,1);
}
.o-footer__languageList .o-footer__languageItem:hover {
  background-color:#bababa33;
}
.o-footer .-open .a-svg {
  transform:rotate(180deg);
}
.o-footer .-open .o-footer__languageList {
  opacity:1;
  pointer-events:initial;
  transform:translateY(-100%);
}
.o-footer__credit {
  position:relative;
}
@media only screen and (max-width: 1024px) {
  .o-footer__credit {
    margin-top:3.75rem;
    padding-top:3rem;
  }
  .o-footer__credit:before {
    content:"";
    position:absolute;
    top:0;
    left:50%;
    width:100vw;
    height:.1rem;
    background-color:#fff3;
    transform:translate(-50%);
  }
}
@media only screen and (min-width: 1025px) {
  .o-footer__credit {
    order:1;
  }
}
.o-footer__iaapaMember {
  position:relative;
  z-index:1;
  width:9rem;
  margin-top:-10rem;
  margin-left:auto;
}
@media only screen and (min-width: 1025px) {
  .o-footer__iaapaMember {
    order:2;
    margin-top:initial;
    margin-left:6.25%;
  }
}
@media only screen and (min-width: 641px) {
  .o-footer {
    padding-top:8rem;
  }
}
```
```css
/* site.pretty.css L3434-3523 */
.m-newsletterForm {
  margin-bottom:3rem;
  padding:2.25rem 1.5rem;
  border-radius:2rem;
  background-color:#00284d;
}
.m-newsletterForm__label {
  flex-grow:1;
  width:100%;
}
@media only screen and (max-width: 1024px) {
  .m-newsletterForm__label {
    margin-bottom:2.4rem;
    text-align:center;
  }
}
.m-newsletterForm .m-loaderSection__error,.m-newsletterForm .m-loaderSection__success {
  margin-top:1rem;
  text-align:left;
}
.m-newsletterForm__rightPanel {
  position:relative;
  width:100%;
  margin-bottom:2.4rem;
}
@media only screen and (min-width: 1025px) {
  .m-newsletterForm__rightPanel {
    max-width:48rem;
    margin-bottom:0;
  }
}
.m-newsletterForm__input {
  position:relative;
}
.m-newsletterForm__input input {
  width:100%;
  padding:1.3rem 4.8rem 1.3rem 2.5rem;
  border:unset;
  border-radius:7rem;
  background-color:transparent;
  background-color:#ffffff1a;
  color:#fff;
  font-family:inherit;
  -webkit-appearance:none;
  -moz-appearance:none;
  appearance:none;
}
.m-newsletterForm__input input::-moz-placeholder {
  color:inherit;
}
.m-newsletterForm__input input::placeholder {
  color:inherit;
}
.m-newsletterForm__input button {
  position:absolute;
  top:50%;
  right:1.8rem;
  height:2.2rem;
  background-color:transparent;
  transform:translateY(-50%);
}
.m-newsletterForm__input svg {
  width:2.2rem;
  height:2.2rem;
}
.m-newsletterForm .a-inputCheckbox {
  display:none;
  flex-direction:row-reverse;
}
.m-newsletterForm .a-inputCheckbox.-visible {
  display:flex;
}
.m-newsletterForm .a-inputCheckbox .a-inputField__label {
  font-size:1.4rem;
}
@media only screen and (min-width: 1025px) {
  .m-newsletterForm__more {
    grid-column:2/3;
  }
}
@media only screen and (min-width: 1025px) {
  .m-newsletterForm {
    display:grid;
    grid-template-columns:repeat(2,1fr);
    gap:1rem 3.2rem;
    align-items:center;
    margin-bottom:7.5rem;
    padding:6rem;
  }
}
```

---

## 13. Page-level vertical rhythm (desktop 1425, measured document y)

| block | top | height | background | padding |
|---|---|---|---|---|
| hero | 0 | 900 (100vh) | video | content `140 0 100` |
| o-homeMagic | 900 | 1236.8 | #00284d + photo | `160 0 500` |
| products (white) | 2136.8 | 1050.6 | #fff | `65 0 105` |
| o-homeShows | 3187.4 | 900 | #0c0a09 | `170 0 220` |
| separator | 4087.4 | 105 | #fff | – |
| b-video | 4192.4 | 801.6 | 16:9 | – |
| t-home__footer | 4994 | 1209.2 | #fff | `100 0` |
| news card | 5094 | 602 | #faf7f1 | 25 |
| clients | 5796 | 307.2 | – | – |
| breadcrumb | 6203.2 | 77.8 | #fff | `30 0` |
| prefooter | 6281 | 329.3 | #c79d47 | `75 0 60` |
| footer | 6610.3 | 1009.5 | #000d1a | `80 0 22.5` |
| **total** | | **7620** | | |

At 390px the total is 7731; see `work/dump_m.txt` for every mobile box.

---

## 14. Barba page transition (brief)
Barba 2.10.3, `timeout: 10000`, transition `basic`.
- **once (first load):** the loader wipe described in 4, 2500ms easeOutCubic.
- **leave:** `beforeLeave` clears the dark UI and sets `html.is-loading`. `afterLeave` closes the menu without the page animation.
- **beforeEnter:**
  - The new container is fixed at `top: 100%`, z 13, full size, `overflow: hidden`.
  - Its `.js-hero` gets `is-inview` after 500ms.
  - A new Title animation starts after 700ms.
- **enter:** anime timeline, **1400ms easeOutQuint**, `translateY: 0 → -100%` with `stagger(150)`, applied in order to:
  1. `.a-panel.-top` (navy `#00284d`, z 11)
  2. `.a-panel.-bottom` (gold `#c79d47`, z 12)
  3. the new container
  - Both panels start at `top: 101vh`.
  - Result: a navy sheet, then a gold sheet, then the new page slide up over the old one.
- **afterEnter:** the old container is removed, inline styles are cleared, and modules are re-initialised. `after` scrolls to top (except on Barba-triggered internal navigation).

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

---

## 15. Media inventory (layout reference only; do not reuse)
- **Hero:** `media/site/d134436b23-…/as_home-header_v4.mp4` (1350x720); `/assets/videos/smoke.mp4` (1304x576, also used by the loader and the menu; menu poster `/assets/images/menu-smoke-placeholder.png`).
- **Magic:** `media/site/5800a5863f-…/test-magie-de-leau-copie-8-*.webp` (1408x1024); `/assets/images/white-cloud.png` (2690x380).
- **Products:** 13 × (`…-600x-q80.webp` still + `…header_sticker_v2.m4v`/`.mp4` hover video): aquastage, custom-made water show, aqua graphic, water screen, giant water show, aquavision, dancing fountain, tornado, water tunnel, interactive fountain, fog, labyrinth, water tree.
- **Shows:** `home-show-placeholder-l-{600,1024,1440,1920}x-q80.webp` (2000x1062 declared, 1920x1020 real); `home-show-mobile-*.png` below 1024px.
- **Video band:** poster `custom-made-water-show-la-seyne-sur-mer-2-*.webp` (2000x1389); YouTube `J8jqhjluCk0`.
- **Menu:** `as_vidmenu_homepage.mp4`, `universe_header_v2.m4v` (poster webp), `menu_expertise.mp4`, `as_vidmenu_services.mp4`, `as_vidmenu_ref.mp4`.
- **News:** `collab_asdronisos_blog-siteweb` (1000x718), `vidanta-world-lake-water-show-fountain-3` (1000x749), `iaapabarcelona_bandeau-site-web` (2000x1414).
- **Clients:** 27 logos (for example `puy-du-fou-600x-q80.png` 294x210, `logo-jaeger-lecoultre` 372x94, `expo2020_dubai`).
- **Prefooter:** `/assets/images/fondation-aquatique-show.svg` (177x118); sprite `#icon-aquatic-show-symbol`.
- **Footer:** `/assets/images/visuel-footer.jpg` (1600x1067) and `visuel-footer-mobile.jpg`; `iaapamemberlogo-2026-positive-white` png (1103x334).
- **Generic icons** (inline SVG sprite, 13x13 viewBox, `currentColor`). These are simple enough to redraw:
  - `arrow-right`: a filled triangle head plus a 0.73-thick shaft.
  - `arrow-down`: a stroked chevron arrow, round caps.
  - `play`: a stroked rounded triangle, stroke-width 1.1.
  - `search`: a circle of r 4.33 plus a handle.
  - `contact`: a rounded envelope.
  - `dashboard-square`: 4 rounded squares.
  - `dragging`: an open hand.
  - `quote`: two block quote marks, 138x109, fill `#C79D47`.
  - `arrow-toggle`: a filled down triangle.

---

## 16. Screenshot index (all in this `ref2/` folder)
- **Pre-existing:** `01-hero.png`, `01b-hero.png`, `s003_y00967.png`, `s006_y02018.png`, `s009_y03064.png`, `s012_y04114.png`, `s015_y05164.png`, `s018_y06220.png`, `s021_y06715.png`, `menu-0300.png`, `menu-1500.png`, `menu-hover.png`.
- **Intro / loader:** `intro_t0000.png`, `intro_t0300.png`, `intro_t0600.png`, `intro_t1000.png`, `intro_t1500.png`, `intro_t2200.png`, `intro_t3000.png`, `intro_t4500.png`.
- **Header / side rail hovers:** `hover_burger.png`, `hover_contact_0200ms.png`, `hover_contact_settled.png`, `hover_sidemenu_contact.png`, `hover_sidemenu_lang.png`.
- **Menu:** `menu_open_0000ms.png`, `menu_open_0150ms.png`, `menu_open_0300ms.png`, `menu_open_0600ms.png`, `menu_open_1000ms.png`, `menu_open_1600ms.png`, `menu_close_0300ms.png`, `menu_hover_0250ms.png`, `menu_hover_settled.png`, `menu_secondary_hover.png`.
- **Hero:** `hover_hero_plus.png`, `hero_more_open.png`.
- **Scroll states** (dark-UI flips, side rail hidden): `scroll_magic_enter.png`, `scroll_magic_mid.png`, `scroll_products_header_dark.png`, `scroll_products.png`, `scroll_products_bottom.png`, `scroll_shows.png`, `scroll_video.png`, `scroll_news.png`, `scroll_clients.png`, `scroll_prefooter.png`.
- **Magic:** `magic_top.png`, `magic_bottom_cloud.png`, `magic_more_opening_0350ms.png`, `magic_more_open.png`, `hover_button_white_0300ms.png`, `hover_button_white_settled.png`.
- **Products:** `products_default.png`, `products_card_hover_drag_cursor.png`, `products_dragging.png`, `catselector_hover.png`, `catselector_hover2.png`, `catselector_click_0080ms.png`, `catselector_click_0250ms.png`, `catselector_click_0500ms.png`, `catselector_click_1000ms.png`.
- **Shows:** `shows_enter_0150ms.png`, `shows_enter_0600ms.png`, `shows_enter_1500ms.png`, `shows_enter_4500ms.png`, `shows_full.png` (captured before the lazy background loaded; use `shows_enter_4500ms.png`), `hover_button_shows.png`; `work/shows_bg_small.png` is a downscaled copy of the baked grid image, for geometry only.
- **Video:** `video_band.png`, `hover_play_button.png`, `video_band_playing.png`.
- **News:** `news_full.png`, `news_slide_0250ms.png`, `news_slide2.png`, `hover_slider_next_0300ms.png`, `hover_slider_next_1000ms.png`, `hover_slider_next_3000ms.png`.
- **Clients:** `clients_marquee.png`, `hover_client_tile.png`.
- **Prefooter / footer:** `prefooter.png`, `hover_button_outline.png`, `footer_full.png`, `footer_language_open.png`, `hover_footer_link.png`.
- **Mobile 390x844:** `m390_00_hero.png`, `m390_01_hero_bottom.png`, `m390_02_magic.png`, `m390_03_magic_bottom.png`, `m390_04_products.png`, `m390_05_products_slider.png`, `m390_06_shows.png`, `m390_07_video.png`, `m390_08_news.png`, `m390_09_news_content.png`, `m390_10_clients.png`, `m390_11_prefooter.png`, `m390_12_footer.png`, `m390_13_footer_links.png`, `m390_14_footer_bottom.png`, `m390_menu_open_0000ms.png`, `m390_menu_open_0300ms.png`, `m390_menu_open_1000ms.png`, `m390_menu_open_1600ms.png`; `work/m390_contact.png` is a contact sheet.
- **Data:** `work/dump_d.txt`, `work/dump_m.txt` (computed styles for about 220 selectors), `work/scroll_log.json` (per-scroll state), `site.pretty.css`, `site.pretty.js`, `raw.html`; the scripts are `work/s*.py`.

## 17. Not determined / caveats
- The hover videos in product cards and menu cards did not decode in headless Chrome (`paused` stayed true), so their playing look was not captured. The code path (set `src` → `play()`) is certain.
- The Matter VF `wdth` axis used in `font-variation-settings "wdth" 50` may not exist in the font. If it doesn't, only the `wght` part has a visible effect.
- The cookie banner (Axeptio) is third-party and not part of the design.
- The marquee speed is frame-rate dependent (1px/frame). "About 60px/s" assumes a 60Hz display.
