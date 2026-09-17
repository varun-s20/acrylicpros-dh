#!/usr/bin/env python3
"""Behaviour tests for the rebuilt inner pages (about, process, services,
gallery, contact, quote) — the chrome, motion and page transition.

Gallery lightbox/filters and the form contract live in test_behaviour.py.
Needs a server on 127.0.0.1:8899 and Playwright with Chrome installed.
"""
import sys
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8899/"
PAGES = ["about", "process", "services", "gallery", "contact", "quote"]
results = []


def check(name, condition, detail=""):
    results.append(bool(condition))
    print("  %s %s%s" % ("PASS" if condition else "FAIL", name,
                         ("  -> " + str(detail)) if detail and not condition else ""))


def scroll_to(pg, y):
    pg.evaluate("y => window.scrollTo(0, y)", y)
    pg.wait_for_timeout(700)


with sync_playwright() as p:
    browser = p.chromium.launch(channel="chrome")

    print("\nEvery page (1440)")
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    for name in PAGES:
        pg = ctx.new_page()
        problems = []
        pg.on("console", lambda m: problems.append(m.text) if m.type == "error" else None)
        pg.on("pageerror", lambda e: problems.append(str(e)))
        pg.on("requestfailed", lambda r: problems.append("failed " + r.url) if r.url.startswith(BASE) else None)
        pg.goto(BASE + name + ".html", wait_until="load")
        pg.wait_for_timeout(4300)
        check("%s: loader finished" % name, pg.evaluate("() => !document.querySelector('[data-loader]') && !document.documentElement.classList.contains('is-loading')"))
        if name != "gallery":
            check("%s: hero revealed" % name, pg.evaluate("() => document.querySelector('[data-page-hero]').classList.contains('is-inview')"))
            check("%s: title visible, split undone" % name, pg.evaluate(
                "() => { const t = document.querySelector('[data-page-title]'); return getComputedStyle(t).opacity === '1' && !t.querySelector('.a-line'); }"))
        check("%s: one h1" % name, pg.evaluate("() => document.querySelectorAll('h1').length === 1"))
        check("%s: no console errors" % name, not problems, problems[:2])
        pg.close()

    pg = ctx.new_page()
    pg.goto(BASE + "about.html", wait_until="load")
    pg.wait_for_timeout(4300)
    check("menu marks the current page",
          pg.evaluate("() => { const a = document.querySelector('[data-nav-item=\"about\"]'); return a.classList.contains('-active') && a.getAttribute('aria-current') === 'page'; }"))

    # Section rings and the word-colour quote follow the scroll.
    about_top = pg.evaluate("() => document.getElementById('about').getBoundingClientRect().top + scrollY")
    scroll_to(pg, about_top + 600)
    ring = pg.evaluate("() => parseFloat(document.querySelector('[data-summary]').style.getPropertyValue('--progress'))")
    check("first ring partly filled", 0 < ring < 100, ring)
    check("first item active", pg.evaluate("() => document.querySelector('[data-summary]').classList.contains('-is-active')"))
    check("dark chrome over the white section", pg.evaluate("() => document.body.classList.contains('-dark')"))
    colours = pg.evaluate("() => [...document.querySelectorAll('[data-text-scroll] span')].map(s => s.style.color)")
    check("quote words coloured progressively",
          len(set(colours)) > 1 and colours[0] != colours[-1], colours[:1] + colours[-1:])

    # Anchor link from the section nav scrolls (Lenis + scroll-margin).
    pg.click("[data-summary] a[href='#commitments']")
    pg.wait_for_timeout(2500)
    top = pg.evaluate("() => document.getElementById('commitments').getBoundingClientRect().top")
    check("section nav scrolls to its section", -10 < top < 260, top)

    # Parallax only moves the footer statement while smooth-scrolling.
    text_y = pg.evaluate("() => document.querySelector('[data-parallax]').getBoundingClientRect().top + scrollY")
    scroll_to(pg, text_y - 700)
    t = pg.evaluate("() => document.querySelector('[data-parallax]').style.transform")
    check("parallax applied", "translate3d" in t, t)
    pg.close()

    # Process: the dashed step line draws with the scroll.
    pg = ctx.new_page()
    pg.goto(BASE + "process.html", wait_until="load")
    pg.wait_for_timeout(4300)
    step_top = pg.evaluate("() => document.querySelector('[data-step-line]').getBoundingClientRect().top + scrollY")
    scroll_to(pg, step_top - 450 - 60)
    p1 = pg.evaluate("() => parseFloat(document.querySelector('.m-expertiseStep__stepper').style.getPropertyValue('--progress'))")
    scroll_to(pg, step_top + 400)
    p2 = pg.evaluate("() => parseFloat(document.querySelector('.m-expertiseStep__stepper').style.getPropertyValue('--progress'))")
    check("step line progresses", p1 < p2 and p2 == 1, (p1, p2))
    check("process is the current menu link",
          pg.evaluate("() => (document.querySelector('.o-menu__link.-active') || {}).getAttribute('href') === 'process.html'"))
    pg.close()

    # Services: filter + load more.
    pg = ctx.new_page()
    pg.goto(BASE + "services.html", wait_until="load")
    pg.wait_for_timeout(4300)
    visible = lambda: pg.evaluate("() => document.querySelectorAll('[data-products-grid] > li:not(.-hidden)').length")
    check("services: first 8 shown", visible() == 8, visible())
    pill = pg.evaluate("() => getComputedStyle(document.querySelector('[data-cat]')).getPropertyValue('--color')")
    check("services: pill starts purple", "6541cb" in pill.lower(), pill)
    pg.click("[data-products-more]")
    pg.wait_for_timeout(300)
    check("services: load more shows the rest", visible() == 14, visible())
    check("services: button hidden at the end", not pg.is_visible("[data-products-more]"))
    top = pg.evaluate("() => document.querySelector('[data-cat]').getBoundingClientRect().top + scrollY")
    scroll_to(pg, top - 200)
    pg.click('[data-cat-list] [data-value="livestock"]')
    pg.wait_for_timeout(1200)
    check("services: livestock filter", visible() == 4, visible())
    check("services: filter in the URL", pg.url.endswith("?filter=livestock"), pg.url)
    pg.reload(wait_until="load")
    pg.wait_for_timeout(4300)
    check("services: filter restored from the URL", visible() == 4 and
          pg.get_attribute('[data-value="livestock"]', "aria-pressed") == "true")
    pg.close()

    # Page transition: navy/gold panels, then the page slides in.
    pg = ctx.new_page()
    pg.goto(BASE + "about.html", wait_until="load")
    pg.wait_for_timeout(4300)
    scroll_to(pg, 3000)
    pg.click(".o-header .a-buttonContact")
    pg.wait_for_timeout(300)
    moving = pg.evaluate("() => [...document.querySelectorAll('[data-panel]')].map(p => new DOMMatrix(getComputedStyle(p).transform).m42)")
    check("panels rise before leaving", moving[0] < 0, moving)
    pg.wait_for_url("**/contact.html")
    pg.wait_for_timeout(150)
    entering = pg.evaluate("() => document.documentElement.classList.contains('is-entering') && !document.querySelector('[data-loader]')")
    check("new page enters without the loader", entering)
    pg.wait_for_timeout(2200)
    check("transition cleaned up", pg.evaluate(
        "() => !document.documentElement.classList.contains('is-entering') && getComputedStyle(document.querySelector('[data-page]')).transform === 'none'"))
    check("new page at the top", pg.evaluate("scrollY") == 0)
    check("hero revealed after the transition", pg.evaluate("() => document.querySelector('[data-page-hero]').classList.contains('is-inview')"))
    pg.go_back()
    pg.wait_for_url("**/about.html")
    pg.wait_for_timeout(4500)
    check("back button never leaves the panels over the page", pg.evaluate(
        "() => [...document.querySelectorAll('[data-panel]')].every(p => new DOMMatrix(getComputedStyle(p).transform).m42 === 0)"
        " && !document.documentElement.classList.contains('is-loading')"))
    pg.click(".o-header__logo")
    pg.wait_for_url("**/index.html")
    pg.wait_for_timeout(300)
    check("links to the homepage leave no entering flag",
          pg.evaluate("() => sessionStorage.getItem('ap:transition') === null"))
    pg.close()

    # Menu still opens over an inner page.
    pg = ctx.new_page()
    pg.goto(BASE + "gallery.html", wait_until="load")
    pg.wait_for_timeout(4300)
    pg.click("[data-burger]")
    pg.wait_for_timeout(1200)
    check("menu opens on inner pages", pg.get_attribute("[data-menu]", "aria-hidden") == "false")
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(1300)
    check("menu closes", pg.get_attribute("[data-menu]", "aria-hidden") == "true")
    pg.close()

    # Quote: the homepage footer hands over the e-mail.
    pg = ctx.new_page()
    pg.goto(BASE + "quote.html?email=jane%40example.com", wait_until="load")
    pg.wait_for_timeout(500)
    check("quote: ?email= prefills the field", pg.input_value("[data-prefill-email]") == "jane@example.com")
    pg.close()
    ctx.close()

    print("\nMobile 390")
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    for name in PAGES:
        pg = ctx.new_page()
        pg.goto(BASE + name + ".html", wait_until="load")
        pg.wait_for_timeout(3800)
        check("%s: no horizontal overflow" % name,
              pg.evaluate("() => document.documentElement.scrollWidth <= document.documentElement.clientWidth"))
        pg.close()
    pg = ctx.new_page()
    pg.goto(BASE + "services.html", wait_until="load")
    pg.wait_for_timeout(3800)
    pg.select_option("[data-cat-select]", "care")
    pg.wait_for_timeout(300)
    check("services: native select filters",
          pg.evaluate("() => document.querySelectorAll('[data-products-grid] > li:not(.-hidden)').length") == 5)
    pg.goto(BASE + "about.html", wait_until="load")
    pg.wait_for_timeout(500)
    check("section nav hidden on mobile",
          pg.evaluate("() => getComputedStyle(document.querySelector('.m-pageSummary')).display === 'none'"))
    pg.close()
    ctx.close()

    print("\nReduced motion")
    ctx = browser.new_context(viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
    pg = ctx.new_page()
    pg.goto(BASE + "about.html", wait_until="load")
    pg.wait_for_timeout(500)
    check("no loader", pg.evaluate("() => !document.querySelector('[data-loader]')"))
    check("hero text in place", pg.evaluate("() => [...document.querySelectorAll('.overflow-wrapper > *')].every(e => getComputedStyle(e).transform === 'none')"))
    pg.click(".o-header .a-buttonContact")
    pg.wait_for_url("**/contact.html")
    pg.wait_for_timeout(300)
    check("plain navigation, no entering state", not pg.evaluate("() => document.documentElement.classList.contains('is-entering')"))
    pg.goto(BASE + "gallery.html", wait_until="load")
    pg.wait_for_timeout(300)
    check("gallery tiles visible at once", pg.evaluate("() => [...document.querySelectorAll('[data-card].-active')].every(c => getComputedStyle(c).opacity === '1')"))
    ctx.close()

    browser.close()

failed = results.count(False)
print("\n%d checks, %d failed." % (len(results), failed))
sys.exit(1 if failed else 0)
