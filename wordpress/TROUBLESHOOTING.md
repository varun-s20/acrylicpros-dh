# Troubleshooting

Symptom → cause → fix. Written from what this build actually does, not generic
WordPress advice. Add to it as you hit things.

---

## The design is gone / the site looks like plain text

**The content plugin is deactivated, or its stylesheet 404s.** Everything —
CSS, JS, fonts, the footer — ships inside `acrylic-pros-content`.

Check **Plugins**, then open the page source and confirm
`/wp-content/plugins/acrylic-pros-content/assets/home.css` returns 200. Every
page loads `home.css`; inner and legacy pages also load `pages.css` and/or
`legacy.css` — see `inc/assets.php`'s `ap_asset_set()`.

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

Hello Elementor's own `reset.css`/`theme.css` paint bare `a` and `button`
elements `#C36`, and go further than the colour — they also reset heading and
paragraph margins and image sizing, which out-specifying alone cannot fully
undo (`[type=submit]` is an attribute selector; a neutraliser strong enough to
beat it also beats the design's own single-class button rules).

So the actual fix is not specificity, it is **not loading the theme's
stylesheets at all**: `inc/assets.php` dequeues `hello-elementor`,
`hello-elementor-theme-style` and `hello-elementor-header-footer` outright, at
priority 100 (after the theme enqueues them at the default 10). `home.css`
carries its own complete reset, so nothing depends on the theme's.

1. Confirm the theme's stylesheets are actually gone: view source, there
   should be no `hello-elementor` or `theme-style` `<link>` at all.
2. If they are still there, the dequeue did not run — confirm the plugin is
   active and check for a fatal error earlier in the request (a fatal before
   priority 100 stops every later hook).
3. If the theme's stylesheets are gone and something is *still* pink, it is
   coming from somewhere else (Elementor's own `frontend.css`, a form plugin).
   The scoped neutraliser at the top of `home.css` is the safety net for that
   case: find which of `.o-header` / `.o-footer` / `#main` / `.m-chat` /
   `.o-menu` the element should be inside, add that container to the
   `NEUTRALISER` constant in `tools/build_wordpress.py`, then rebuild. Do not
   add `!important`; it wins today and blocks the owner's own overrides
   forever.

---

## Text disappears when you hover a button

This is the neutraliser winning a fight it should have lost.

`:hover` counts in the class column of a specificity calculation, so
`.o-header button:hover` is (0,2,1) and out-ranks the design's own
`.o-header .a-button` at (0,2,0) — stripping the background while the label keeps
its light colour.

The fix is already in `home.css`: the `:hover` variants are wrapped in
`:where()`, which contributes zero specificity. If this reappears, someone
unwrapped them. Put them back.

---

## Every paragraph is in the wrong font

Elementor's Global Fonts wrote `.elementor-kit-NN { font-family: … }` onto
`<body>`, which out-specifies a plain `body` rule.

Disable Default Fonts as above. `home.css` also carries `:root body {
font-family: var(--font) }` at (0,1,1) to beat the kit class at (0,1,0), so this
should not happen — if it does, the kit is being loaded after `home.css`, which
means the `elementor-frontend` dependency in the enqueue was lost.

---

## The smoke loader never goes away

`pages.js` clears the loader, and it must run **before** `home.js`. They are
separate enqueued files, in that order, per tier in `inc/assets.php`'s
`ap_asset_set()` (`JS_FILES = ["lenis.min.js", "pages.js", "home.js"]` in
`tools/build_wordpress.py` controls the underlying order).

If someone regenerates with that order changed, this is the symptom. It looks
like a hang and it is a load-order bug.

---

## The menu opens and instantly closes

**The script is loading twice** — every handler is bound twice, so the open
handler runs and then the close handler runs.

Almost always: one of the plugin's scripts (`home.js`, `pages.js`) is enqueued
by the plugin *and* pasted into Elementor → Custom Code. Use one route only.
This build uses the plugin; there should be no Custom Code snippet at all.

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

Exclude every `ap-*` script (`home.js`, `pages.js`, `lenis.min.js`, `main.js`)
from JS minification, combination and delay in whichever caching plugin is
installed. Then test in a private window, not just logged out.

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

---

## The wrong page is highlighted in the nav — usually "About", on every page

`header.html` is captured verbatim from one real page (About), so the nav `<ul>`
ships with `data-nav="about"` baked into the markup. `home.js` corrects this at
runtime for the real page, but it has to do the whole job itself — clearing every
`data-nav-item` link and re-applying `-active`/`aria-current` to the right
one — because `pages.js` (which used to own that job) is enqueued *before*
`home.js` and would otherwise read the stale baked-in value first.

If this comes back: something reintroduced the highlighting logic into a script
that runs before `home.js`, or `home.js` failed to load (check the console for
`window.AP_NAV` — `undefined` means the plugin's `wp_head` output is missing).

---

## I edited a page and re-uploaded the plugin, but nothing changed

Two different things can cause this, and they need different fixes:

**1. The edit changed page markup, not just CSS/JS.** Page bodies are not read
from the plugin's files at request time — they were written *once* into the
WordPress database (`_elementor_data`) by **Tools → Acrylic Pros setup → Build
the site**, from the snapshot in `data/pages/*.html` at the time you pressed the
button. Re-uploading the plugin updates the files on disk; it does **not**
re-run that button. Any change to `src/pages/*.body.html` — a new wrapper `<div>`,
reordered markup, anything beyond a class name already in the DOM — needs
**Build the site** pressed again afterward, every time. A pure CSS/JS-only
change (no HTML change) does not need this.

**2. The upload did not actually replace every file.** Dragging the
`acrylic-pros-content` folder straight into File Manager is not the same
operation as WordPress's own **Plugins → Add New → Upload → the zip**. A
folder-by-folder upload can silently create a nested
`acrylic-pros-content/acrylic-pros-content/` (if the tool uploads the folder
*into* the existing one instead of merging its contents), or drop files
partway through on a large tree — this build has already lost 8 of 458 media
files the same way during a zip extraction. Confirm by viewing the source of
a live page and checking the `?ver=` query string on `home.css` — if it still
matches the *previous* deploy's timestamp, the new file never arrived. Prefer
the zip through **Plugins → Add New → Upload** — it replaces the plugin
atomically in one operation, with no folder-merge ambiguity.

## Something is left-aligned, unspaced or the wrong size, only in WordPress

**Cause:** Elementor's own `frontend.css` resets bare elements inside
`.elementor`, and some of those resets out-rank the design's rules:

- `figure { margin: 0 }`: four classes deep, so every figure loses its margin.
  This is what made the scratch-removal film sit hard left, and About lost its
  photo offsets.
- `a { text-decoration: none; box-shadow: none }`, `hr { background:
  transparent }` and `img { height: auto; max-width: 100% }`: one class plus a
  tag, which beats any single-class design rule.

**Fixed in 1.1.0:**

- **Figures:** the page widget carries `elementor-widget-theme-post-content`,
  the one class Elementor exempts from its figure rule (`inc/setup.php`).
  Re-run **Build the site** so existing pages get it.
- **The rest:** `build_wordpress.py` adds a few WordPress-only
  "restore" rules to the top of `home.css`, for the footer background, footer
  phone/email underline, video covers, contact button shadow and hairlines.

**If a new one appears,** find the winning rule in DevTools. If it comes from
`elementor/assets/css/frontend.min.css`, add the element and only the property
it takes to that restore block, at one class plus the tag.
