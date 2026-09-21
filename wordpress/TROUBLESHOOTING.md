# Troubleshooting

Symptom → cause → fix. Written from what this build actually does, not generic
WordPress advice. Add to it as you hit things.

---

## The design is gone / the site looks like plain text

**The content plugin is deactivated, or its stylesheet 404s.** Everything —
CSS, JS, fonts, the footer — ships inside `acrylic-pros-content`.

Check **Plugins**, then open the page source and confirm
`/wp-content/plugins/acrylic-pros-content/assets/global.css` returns 200.

If the plugin is active and the file 404s, the zip was installed with the wrong
folder name. Reinstall from `plugins/acrylic-pros-content.zip` — it is built to
contain a single top-level folder with forward-slash paths, which is what
WordPress requires and what a zip made by Windows Explorer does not do.

---

## Every image on the site is missing

**Uploads went into month/year folders.** Every path in the build is
`/wp-content/uploads/<filename>` with no date segment.

Settings → Media → untick *Organize my uploads into month- and year-based
folders*, then re-upload. WordPress does not move files that are already there,
so unticking it alone fixes nothing.

---

## Buttons and links are pink

Hello Elementor's own `theme.css` paints bare `a` and `button` elements `#C36`.

1. Elementor → Site Settings → Layout → Default Colors **Disable**, Default
   Fonts **Disable**.
2. Elementor → Tools → Regenerate CSS & Data.
3. If it is still pink, the element is outside the neutraliser's container list.
   Inspect it, find which of `.o-header` / `.o-footer` / `#main` / `.m-chat` /
   `.o-menu` it should be inside, and add that container to the neutraliser at
   the top of `tools/build_wordpress.py` — then rebuild. Do not add
   `!important`; it wins today and blocks the owner's own overrides forever.

---

## Text disappears when you hover a button

This is the neutraliser winning a fight it should have lost.

`:hover` counts in the class column of a specificity calculation, so
`.o-header button:hover` is (0,2,1) and out-ranks the design's own
`.o-header .a-button` at (0,2,0) — stripping the background while the label keeps
its light colour.

The fix is already in `global.css`: the `:hover` variants are wrapped in
`:where()`, which contributes zero specificity. If this reappears, someone
unwrapped them. Put them back.

---

## Every paragraph is in the wrong font

Elementor's Global Fonts wrote `.elementor-kit-NN { font-family: … }` onto
`<body>`, which out-specifies a plain `body` rule.

Disable Default Fonts as above. `global.css` also carries `:root body {
font-family: var(--font) }` at (0,1,1) to beat the kit class at (0,1,0), so this
should not happen — if it does, the kit is being loaded after `global.css`, which
means the `elementor-frontend` dependency in the enqueue was lost.

---

## The smoke loader never goes away

`pages.js` clears the loader, and it must run **before** `home.js`. They are
concatenated into `global.js` in that order by `tools/build_wordpress.py`
(`JS_FILES = ["lenis.min.js", "pages.js", "home.js"]`).

If someone regenerates with that order changed, this is the symptom. It looks
like a hang and it is a load-order bug.

---

## The menu opens and instantly closes

**The script is loading twice** — every handler is bound twice, so the open
handler runs and then the close handler runs.

Almost always: `global.js` is enqueued by the plugin *and* pasted into Elementor
→ Custom Code. Use one route only. This build uses the plugin; there should be
no Custom Code snippet at all.

---

## Icons are all empty squares

The SVG sprite lives at the top of `header.html` and every `<use href="#i-name">`
on the site resolves against it. Someone edited or truncated the Theme Builder
header template.

Re-paste `header.html` in full.

---

## A shortcode prints as literal text — `[ap_footer]` appears on the page

Elementor's HTML widget outputs its content verbatim. The plugin's
`elementor/widget/render_content` filter is what expands shortcodes inside it.

The plugin is inactive, or `inc/elementor.php` failed to load. Same symptom will
hit Contact Form 7 when it is added.

---

## A page renders in the wrong colour scheme

The `<body>` class is wrong. It comes from `inc/page-map.php`, keyed on the page
slug.

A page whose slug does not match the map gets `t-inner` and no menu highlight —
plain rather than broken, on purpose. If a page was renamed in wp-admin, either
rename it back or add it to the static site and re-run
`python tools/build_wordpress.py`.

---

## The Glass Tanks filter or the chat widget stops working for visitors, but works for you

**An optimiser plugin is deferring or combining JavaScript,** and it usually only
does so for logged-out visitors. This is the single most common way a working
build breaks a week after launch.

Exclude `global.js` from JS minification, combination and delay in whichever
caching plugin is installed. Then test in a private window, not just logged out.

---

## `SITE`-style debugging

Open the console on any page and check in this order:

1. `document.documentElement.className` — should contain `js`. If not, the
   plugin's `language_attributes` filter is not running.
2. `window.AP_NAV` — should be a string. If `undefined`, the plugin's `wp_head`
   output is missing, and the menu highlight falls back to guessing from the URL.
3. `document.querySelector('[data-scroller]')` — should find an element. If
   `null`, the page body was pasted without its wrapper and the menu animation
   will not run.

That sequence splits "the script never ran" from "the script ran and something
else is wrong" in about ten seconds.

---

## A new class has no styling

`wordpress/tests/check.py` fails with *every class in the html has a rule behind
it*.

Thirteen classes are allowlisted in `tests/check-config.json` — all of them were
already orphans in the static prototype, and most are JavaScript hooks. Anything
**not** on that list means a CSS rule was lost in the conversion. Fix the rule.
Do not extend the allowlist.
