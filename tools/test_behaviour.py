#!/usr/bin/env python3
"""Interactive behaviour tests for the Acrylic Pros build.

Asserts the things that silently break: lightbox focus management, keyboard
operation of the before/after slider, gallery and product filtering, and —
most importantly — that a form with no backend NEVER reports success.
"""
import sys
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8899/"
results = []


def check(name, condition, detail=""):
    results.append((bool(condition), name, detail))
    print("  %s %s%s" % ("PASS" if condition else "FAIL", name,
                         ("  -> " + str(detail)) if detail and not condition else ""))


with sync_playwright() as p:
    browser = p.chromium.launch()

    # ---------------- LIGHTBOX ----------------
    print("\nLightbox (gallery.html)")
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    pg = ctx.new_page()
    pg.goto(BASE + "gallery.html", wait_until="networkidle")
    pg.wait_for_timeout(1500)

    # A real click, not a scripted one: element.click() in JS does not move
    # focus, so it cannot exercise focus restoration on close.
    pg.click("[data-open] >> nth=0")
    pg.wait_for_timeout(500)

    check("opens", pg.eval_on_selector("[data-lightbox]", "e => e.classList.contains('is-open')"))
    check("scroll locked", pg.eval_on_selector("body", "e => e.classList.contains('is-locked')"))
    check("aria-hidden cleared",
          pg.eval_on_selector("[data-lightbox]", "e => e.getAttribute('aria-hidden') === 'false'"))
    check("page is inert behind it", pg.evaluate("() => document.querySelector('[data-page]').inert"))
    check("focus moved inside",
          pg.evaluate("() => document.querySelector('[data-lightbox]').contains(document.activeElement)"))
    first = pg.eval_on_selector("[data-lightbox-image]", "e => e.getAttribute('src')")
    pg.keyboard.press("ArrowRight")
    pg.wait_for_timeout(350)
    second = pg.eval_on_selector("[data-lightbox-image]", "e => e.getAttribute('src')")
    check("arrow key advances", first != second, "%s vs %s" % (first, second))
    check("alt text populated",
          bool(pg.eval_on_selector("[data-lightbox-image]", "e => e.getAttribute('alt')")))
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(400)
    check("Escape closes",
          not pg.eval_on_selector("[data-lightbox]", "e => e.classList.contains('is-open')"))
    check("scroll unlocked",
          not pg.eval_on_selector("body", "e => e.classList.contains('is-locked')"))
    check("focus returned to the tile",
          pg.evaluate("() => document.activeElement.matches('[data-open]')"))

    # ---------------- GALLERY FILTERS ----------------
    print("\nGallery filters")
    total = pg.eval_on_selector_all("[data-card]", "els => els.length")
    fab = pg.eval_on_selector_all("[data-card][data-category~='fabrication']", "els => els.length")
    first = pg.eval_on_selector_all("[data-card].-active", "els => els.length")
    check("first batch of 19 shown", first == 19, first)
    pg.click("[data-references-toggle]")
    pg.wait_for_timeout(600)
    check("filter list opens",
          pg.get_attribute("[data-references-toggle]", "aria-expanded") == "true")
    pg.click('[data-references-list] [data-category="fabrication"]')
    pg.wait_for_timeout(900)
    shown = pg.eval_on_selector_all("[data-card].-active", "els => els.length")
    check("filter narrows the grid", shown == fab and 0 < shown < total, "%d of %d" % (shown, total))
    check("aria-pressed set",
          pg.eval_on_selector('[data-references-list] [data-category="fabrication"]', "e => e.getAttribute('aria-pressed') === 'true'"))
    check("label updated", pg.text_content("[data-references-label]") == "Fabrication")
    pg.click("[data-references-toggle]")
    pg.wait_for_timeout(600)
    pg.click('[data-references-list] [data-category="all"]')
    pg.wait_for_timeout(900)
    check("reset restores the first batch",
          pg.eval_on_selector_all("[data-card].-active", "els => els.length") == 19)
    # Live gallery has 35 photos: one "Load more" (+20) reaches the end.
    pg.click("[data-references-more]")
    pg.wait_for_timeout(400)
    check("last page hides the button",
          pg.eval_on_selector_all("[data-card].-active", "els => els.length") == total
          and not pg.is_visible("[data-references-more]"))
    ctx.close()

    # ---------------- BEFORE / AFTER ----------------
    print("\nBefore/after slider (scratch-removal.html)")
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    pg = ctx.new_page()
    pg.goto(BASE + "scratch-removal.html", wait_until="networkidle")
    pg.wait_for_timeout(400)
    pg.eval_on_selector("[data-before-after]", "e => e.scrollIntoView({block:'center'})")
    pg.wait_for_timeout(500)

    start = pg.eval_on_selector(".ba__range", "e => e.value")
    pg.focus(".ba__range")
    for _ in range(6):
        pg.keyboard.press("ArrowRight")
    pg.wait_for_timeout(350)
    moved = pg.eval_on_selector(".ba__range", "e => e.value")
    check("keyboard moves the handle", float(moved) > float(start), "%s -> %s" % (start, moved))
    check("clip-path follows",
          pg.eval_on_selector("[data-before-after]",
                              "e => e.style.getPropertyValue('--pos').length > 0"))
    check("aria-valuenow updates",
          pg.eval_on_selector(".ba__range", "e => e.getAttribute('aria-valuenow')") is not None)
    check("both images render",
          pg.eval_on_selector("[data-before-after]",
                              "e => [...e.querySelectorAll('img')].every(i => i.naturalWidth > 0)"))
    check("after image overlays exactly",
          pg.eval_on_selector("[data-before-after]", """e => {
              const b = e.querySelector('.ba__frame img').getBoundingClientRect();
              const a = e.querySelector('.ba__after img').getBoundingClientRect();
              return Math.abs(b.width - a.width) < 2 && Math.abs(b.height - a.height) < 2;
          }"""))
    ctx.close()

    # ---------------- FORMS: must never fake success ----------------
    print("\nForms - no backend, so success must never be claimed")
    for page_name in ("quote.html", "contact.html"):
        ctx = browser.new_context(viewport={"width": 1440, "height": 900})
        pg = ctx.new_page()
        pg.goto(BASE + page_name, wait_until="networkidle")
        pg.wait_for_timeout(300)

        # Submit empty: must block and report errors.
        pg.eval_on_selector("form[data-validate]", "f => f.querySelector('[type=submit]').click()")
        pg.wait_for_timeout(400)
        state = pg.eval_on_selector("[data-form-status]", "e => e.getAttribute('data-state')")
        check("%s: empty submit blocked" % page_name, state == "error", state)
        check("%s: invalid field marked" % page_name,
              pg.eval_on_selector_all(".a-inputField.-error", "els => els.length") > 0)
        check("%s: error text shown" % page_name,
              pg.eval_on_selector_all(".a-inputField__error:not(:empty)", "els => els.length") > 0)

        # Fill required fields and submit properly.
        pg.evaluate("""() => {
            const f = document.querySelector('form[data-validate]');
            f.querySelectorAll('input,select,textarea').forEach(el => {
                if (!el.required) return;
                if (el.type === 'email') el.value = 'test@example.com';
                else if (el.type === 'tel') el.value = '5625660150';
                else if (el.tagName === 'SELECT') el.selectedIndex = 1;
                else if (el.type === 'radio' || el.type === 'checkbox') el.checked = true;
                else el.value = 'Test';
            });
        }""")
        pg.eval_on_selector("form[data-validate]", "f => f.querySelector('[type=submit]').click()")
        pg.wait_for_timeout(500)
        text = pg.eval_on_selector("[data-form-status]", "e => e.textContent.toLowerCase()")
        state = pg.eval_on_selector("[data-form-status]", "e => e.getAttribute('data-state')")
        check("%s: does NOT claim success" % page_name, state != "success", state)
        claims = any(w in text for w in ("thank you", "has been sent", "we have received",
                                         "successfully", "message sent"))
        check("%s: no success wording" % page_name, not claims, text[:110])
        check("%s: says it is not connected" % page_name, "not connected" in text, text[:110])
        check("%s: offers phone instead" % page_name,
              pg.eval_on_selector_all("[data-form-status] a[href^='tel:']", "e => e.length") > 0)
        ctx.close()

    # ---------------- PRODUCT FILTERS ----------------
    print("\nProduct catalogue (glass-tanks.html)")
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    pg = ctx.new_page()
    pg.goto(BASE + "glass-tanks.html", wait_until="networkidle")
    pg.wait_for_timeout(4500)
    visible = lambda: pg.eval_on_selector_all("[data-tank]:not([hidden])", "els => els.length")
    total = pg.eval_on_selector_all("[data-tank]", "els => els.length")
    check("all SKUs rendered", total == 69, total)
    check("first page of 12", visible() == 12, visible())
    pg.click("[data-shop-more]")
    pg.wait_for_timeout(300)
    check("load more adds 12", visible() == 24, visible())
    pg.click('.o-shop__chip[data-shop-range="frag"]')
    pg.wait_for_timeout(300)
    shown = visible()
    check("range filter works", shown == 8, "%d of %d" % (shown, total))
    check("filter state in URL", "range=frag" in pg.url, pg.url)
    check("count updated", pg.text_content("[data-shop-count]").strip() == "Showing 8 of 8 tanks",
          pg.text_content("[data-shop-count]"))
    pg.select_option("[data-shop-sort]", "price-asc")
    pg.wait_for_timeout(300)
    prices = pg.eval_on_selector_all("[data-tank]:not([hidden])", "els => els.map(e => +e.dataset.price)")
    check("sort by price", prices == sorted(prices), prices)
    pg.click('.m-rangeTile[data-shop-range="marine"]')
    pg.wait_for_timeout(900)
    check("range tile filters the grid", visible() == 3, visible())
    check("no cart anywhere",
          pg.evaluate("() => !/add to cart|checkout|add-to-cart/i.test(document.body.innerText)"))
    href = pg.get_attribute("[data-tank]:not([hidden]) a", "href")
    pg.goto(BASE + href, wait_until="networkidle")
    pg.wait_for_timeout(500)
    check("product page has one h1", pg.evaluate("() => document.querySelectorAll('h1').length === 1"))
    quote = pg.get_attribute(".o-tank__actions a[href*='quote.html']", "href")
    pg.goto(BASE + "product/" + quote, wait_until="networkidle")
    pg.wait_for_timeout(300)
    check("quote form names the tank",
          pg.evaluate("() => document.querySelector('textarea[name=message]').value.startsWith('Glass tank: ')"))
    ctx.close()

    # ---------------- REDUCED MOTION ----------------
    print("\nReduced motion")
    ctx = browser.new_context(viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
    pg = ctx.new_page()
    pg.goto(BASE + "index.html", wait_until="networkidle")
    pg.wait_for_timeout(700)
    check("content visible without scrolling",
          pg.evaluate("""() => [...document.querySelectorAll('.overflow-wrapper > *')]
              .every(e => getComputedStyle(e).transform === 'none')"""))
    check("no intro loader", pg.evaluate("() => !document.querySelector('[data-loader]')"))
    check("hero video not autoplaying",
          pg.eval_on_selector("video[data-autoplay]", "v => v.paused"))
    ctx.close()

    browser.close()

failed = [r for r in results if not r[0]]
print("\n%d checks, %d failed." % (len(results), len(failed)))
sys.exit(1 if failed else 0)
