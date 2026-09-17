#!/usr/bin/env python3
"""Behaviour tests for the homepage (index.html).

Needs a server on 127.0.0.1:8899 and Playwright with Chrome installed
(channel="chrome": plain Chromium cannot decode the H.264 hero video).

    python -m http.server 8899 --bind 127.0.0.1
    python tools/test_home.py
"""
import sys
from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:8899/index.html"
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

    print("\nDesktop 1440")
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    pg = ctx.new_page()
    problems = []
    pg.on("console", lambda m: problems.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: problems.append(str(e)))
    # Only first-party failures count; the YouTube player's own telemetry is noisy.
    pg.on("requestfailed", lambda r: problems.append("failed: " + r.url)
          if r.url.startswith("http://127.0.0.1") else None)
    pg.goto(URL, wait_until="load")

    check("page is locked while the loader plays",
          pg.evaluate("() => document.documentElement.classList.contains('is-loading')"))
    pg.wait_for_timeout(4200)
    check("loader removed after the intro", pg.evaluate("() => !document.querySelector('[data-loader]')"))
    check("page unlocked", not pg.evaluate("() => document.documentElement.classList.contains('is-loading')"))
    check("hero revealed", pg.evaluate("() => document.querySelector('[data-hero]').classList.contains('is-inview')"))
    check("title visible and restored",
          pg.evaluate("""() => { const t = document.querySelector('[data-title]');
              return getComputedStyle(t).opacity === '1' && !t.querySelector('.a-line'); }"""))
    check("hero video playing", pg.evaluate("() => !document.querySelector('[data-hero] video').paused"))

    # Hero zoom follows scroll.
    scroll_to(pg, 450)
    prog = pg.evaluate("() => parseFloat(document.querySelector('[data-hero]').style.getPropertyValue('--progress'))")
    check("hero --progress tracks scroll", 0.4 < prog < 0.6, prog)
    # Side rail is commented out in the header partials (client request 2026-09-17).
    check("side rail removed", pg.evaluate("() => !document.querySelector('[data-sidemenu]')"))

    # Dark chrome over the white services block, light over the builds grid.
    top = pg.evaluate("() => document.querySelector('.o-homeProducts').getBoundingClientRect().top + scrollY")
    scroll_to(pg, top)
    check("dark UI over services", pg.evaluate("() => document.body.classList.contains('-dark')"))
    top = pg.evaluate("() => document.querySelector('.o-homeShows').getBoundingClientRect().top + scrollY")
    scroll_to(pg, top + 500)
    check("light UI over builds", not pg.evaluate("() => document.body.classList.contains('-dark')"))
    check("builds grid revealed", pg.evaluate("() => document.querySelector('.t-home__shows').classList.contains('is-inview')"))

    # Hero: no brand label, no "+" toggles, a Yelp badge (client requests 2026-09-17).
    scroll_to(pg, 0)
    check("no read-more toggles", pg.evaluate("() => !document.querySelector('[data-more-btn]')"))
    check("no brand label above the title", pg.evaluate("() => !document.querySelector('[data-hero] .tx-website')"))
    check("hero Yelp badge",
          pg.evaluate("() => (document.querySelector('[data-hero] .a-yelpBadge') || {}).href === 'https://www.yelp.com/biz/acrylic-pros-anaheim'"))

    # Services filter + slider.
    top = pg.evaluate("() => document.querySelector('.o-homeProducts').getBoundingClientRect().top + scrollY")
    scroll_to(pg, top + 100)
    total = pg.evaluate("() => document.querySelectorAll('[data-products-slider] .m-slider__slide').length")
    dots_all = pg.evaluate("() => document.querySelectorAll('[data-products-slider] .m-slider__dot').length")
    check("13 service cards", total == 13, total)
    check("trimmed snaps give 10 dots at 1440", dots_all == 10, dots_all)
    pg.click('[data-cat-list] [data-value="livestock"]')
    pg.wait_for_timeout(1200)
    shown = pg.evaluate("() => document.querySelectorAll('[data-products-slider] .m-slider__slide:not(.-hidden)').length")
    check("filter narrows to livestock", shown == 4, shown)
    check("pill moved", pg.evaluate("() => document.querySelector('[data-cat]').style.getPropertyValue('--offset')") == "3")
    check("aria-pressed follows", pg.get_attribute('[data-value="livestock"]', "aria-pressed") == "true")
    pg.click('[data-cat-list] [data-value="all"]')
    pg.wait_for_timeout(1200)

    box = pg.eval_on_selector("[data-products-slider] [data-slider-viewport]",
                              "e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; }")
    x0, y0 = box[0] + 600, box[1] + box[3] / 2
    pg.mouse.move(x0, y0)
    pg.wait_for_timeout(200)
    check("drag cursor shown", pg.evaluate("() => document.querySelector('[data-products-slider]').classList.contains('-hover')"))
    pg.mouse.down()
    for i in range(1, 11):
        pg.mouse.move(x0 - i * 30, y0)
        pg.wait_for_timeout(16)
    pg.mouse.up()
    pg.wait_for_timeout(1200)
    tx = pg.evaluate("() => new DOMMatrix(getComputedStyle(document.querySelector('[data-products-slider] [data-slider-track]')).transform).m41")
    card_w = pg.evaluate("() => document.querySelector('[data-products-slider] .m-slider__slide').offsetWidth")
    check("drag snaps one card", abs(tx + card_w) < 2, "%s vs %s" % (tx, -card_w))
    check("drag did not follow the link", pg.url.endswith("index.html"), pg.url)

    # Videos slider (loop).
    pg.eval_on_selector(".o-homeNews", "e => e.scrollIntoView({block: 'center'})")
    pg.wait_for_timeout(800)
    first = pg.evaluate("() => document.querySelector('.o-homeNews .-inView h3').textContent")
    pg.click("[data-slider-prev]")
    pg.wait_for_timeout(1000)
    prev = pg.evaluate("() => document.querySelector('.o-homeNews .-inView h3').textContent")
    check("prev wraps to the last video", prev != first and "shark moat" in prev.lower(), prev)
    pg.click("[data-slider-next]")
    pg.wait_for_timeout(1000)
    check("next returns", pg.evaluate("() => document.querySelector('.o-homeNews .-inView h3').textContent") == first)
    check("glass tanks + scratch removal banners",
          pg.evaluate("() => ['glass-tanks.html','scratch-removal.html'].every(h => document.querySelector('.o-homePromos a[href=\"' + h + '\"]'))"))
    check("12 Instagram posts link to instagram.com",
          pg.evaluate("() => { const a = [...document.querySelectorAll('.m-igTile a')]; return a.length === 12 && a.every(x => x.href.startsWith('https://www.instagram.com/')); }"))
    check("every main menu link has a hover card",
          pg.evaluate("() => document.querySelectorAll('[data-menu-link]').length === document.querySelectorAll('[data-menu-card]').length"))
    pg.click("[data-chat-toggle]")
    pg.wait_for_timeout(300)
    check("chat panel opens", pg.evaluate("() => !document.querySelector('[data-chat-panel]').hidden"))
    pg.click('[data-chat-topic="Maintenance"]')
    check("chat topic fills the message",
          "maintenance" in pg.input_value("[data-chat-message]"))
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(200)
    check("Escape closes the chat", pg.evaluate("() => document.querySelector('[data-chat-panel]').hidden"))
    check("three client testimonials", pg.evaluate("() => document.querySelectorAll('.m-testimonial').length") == 3)
    check("no quote mark in the videos block", pg.evaluate("() => !document.querySelector('.o-homeNews .o-homeNews__quote')"))

    # Videos slider plays inline and stops when moved.
    pg.click(".o-homeNews .-inView [data-yt-play]")
    pg.wait_for_timeout(300)
    check("slide video plays inline",
          pg.evaluate("() => !!document.querySelector('.o-homeNews .-inView [data-yt-mount] iframe')"))
    pg.click("[data-slider-next]")
    pg.wait_for_timeout(600)
    check("moving the slider stops it",
          pg.evaluate("() => !document.querySelector('.o-homeNews [data-yt-mount] iframe')"))

    # Video band plays by itself: muted, looping, no controls, no Play button.
    pg.eval_on_selector(".b-video.-ambient", "e => e.scrollIntoView({block: 'center'})")
    pg.wait_for_timeout(1500)
    src = pg.evaluate("() => (document.querySelector('[data-yt-ambient-mount] iframe') || {}).src || ''")
    check("video band autoplays muted without controls",
          all(k in src for k in ("autoplay=1", "mute=1", "loop=1", "controls=0")), src)
    check("no play button on the band", pg.evaluate("() => !document.querySelector('.b-video.-ambient [data-yt-play]')"))

    # Menu.
    scroll_to(pg, 3300)
    pg.click("[data-burger]")
    pg.wait_for_timeout(1200)
    check("menu open", pg.get_attribute("[data-menu]", "aria-hidden") == "false")
    check("page cropped and moved",
          pg.evaluate("""() => { const p = document.querySelector('[data-page]');
              return p.classList.contains('-cropped') && new DOMMatrix(getComputedStyle(p).transform).m42 > 800; }"""))
    check("page is inert while open", pg.evaluate("() => document.querySelector('[data-page]').inert"))
    check("focus moved into the menu",
          pg.evaluate("() => document.querySelector('[data-menu]').contains(document.activeElement)"))
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(1500)
    check("Escape closes", pg.get_attribute("[data-menu]", "aria-hidden") == "true")
    check("scroll position restored", abs(pg.evaluate("scrollY") - 3300) < 2, pg.evaluate("scrollY"))
    check("page uncropped", not pg.evaluate("() => document.querySelector('[data-page]').classList.contains('-cropped')"))

    check("footer has no estimate band (the prefooter carries it)",
          pg.evaluate("() => !document.querySelector('.o-footer .m-newsletterForm, .o-footer__about')"))
    check("footer social icons",
          pg.evaluate("() => document.querySelectorAll('.o-footer__social svg use').length") == 4)
    check("no console errors or failed requests", not problems, problems[:3])
    ctx.close()

    print("\nMobile 390")
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    pg = ctx.new_page()
    pg.goto(URL, wait_until="load")
    pg.wait_for_timeout(4200)
    check("no horizontal overflow",
          pg.evaluate("() => document.documentElement.scrollWidth <= document.documentElement.clientWidth"))
    check("call button shown", pg.evaluate("() => getComputedStyle(document.querySelector('.o-header__call')).display !== 'none'"))
    pg.select_option("[data-cat-select]", "care")
    pg.wait_for_timeout(600)
    shown = pg.evaluate("() => document.querySelectorAll('[data-products-slider] .m-slider__slide:not(.-hidden)').length")
    check("native select filters", shown == 5, shown)
    check("portrait hero video", pg.evaluate("() => document.querySelector('[data-hero] video').src.endsWith('hero-mobile.mp4')"))
    ctx.close()

    print("\nReduced motion")
    ctx = browser.new_context(viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
    pg = ctx.new_page()
    pg.goto(URL, wait_until="load")
    pg.wait_for_timeout(500)
    check("no loader", pg.evaluate("() => !document.querySelector('[data-loader]')"))
    check("reveals already in place",
          pg.evaluate("() => [...document.querySelectorAll('.overflow-wrapper > *')].every(e => getComputedStyle(e).transform === 'none')"))
    check("hero video not loaded", pg.evaluate("() => !document.querySelector('[data-hero] video').getAttribute('src')"))
    check("smooth scroll off", not pg.evaluate("() => document.documentElement.classList.contains('lenis')"))
    ctx.close()

    browser.close()

failed = results.count(False)
print("\n%d checks, %d failed." % (len(results), failed))
sys.exit(1 if failed else 0)
