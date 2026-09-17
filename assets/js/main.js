/* =====================================================================
   ACRYLIC PROS — shared behaviour
   Vanilla JS, no dependencies, no globals. Loaded once by every page.

   Every module is guarded by a presence check, so a page that lacks a
   component simply never runs its code and never throws.

   CONTENTS
     config
     helpers
     initDocumentFlags
     initHeaderScroll
     initMobileMenu
     initNavigation
     initScrollReveal
     initVideoFallback
     initYouTubeFacade
     initBeforeAfter
     initGalleryFilters
     initLightbox
     initAccordions
     initTestimonials
     initContactPanel
     initStickyMobileCTA
     initProductFilters
     initForms
   ===================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     CONFIG
     ------------------------------------------------------------------ */

  /**
   * Production form endpoint.
   *
   * null  -> forms validate fully, then tell the visitor the form is not
   *          yet connected and offer phone/email. NO success state is
   *          ever shown, because nothing was submitted.
   * string-> a POST URL. Submissions are sent with fetch() and a real
   *          success state is shown only on a successful response.
   *
   * See README.md ("Connecting the forms") before changing this.
   */
  var FORM_ENDPOINT = null;

  var PHONE_DISPLAY = '+1 (562) 566-0150';
  var PHONE_HREF = 'tel:+15625660150';
  var EMAIL = 'info@acrylicpros.com';

  var REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ------------------------------------------------------------------
     HELPERS
     ------------------------------------------------------------------ */

  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function $$(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function on(el, type, handler, opts) {
    el.addEventListener(type, handler, opts || false);
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function prefersReducedMotion() {
    return REDUCED_MOTION.matches;
  }

  /** Elements that can hold focus, for focus trapping. */
  var FOCUSABLE = [
    'a[href]', 'button:not([disabled])', 'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  function focusableWithin(container) {
    return $$(FOCUSABLE, container).filter(function (el) {
      return el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement;
    });
  }

  /**
   * Keeps Tab cycling inside an open overlay. Returns a teardown function.
   */
  function trapFocus(container) {
    function onKeydown(event) {
      if (event.key !== 'Tab') return;
      var items = focusableWithin(container);
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    on(container, 'keydown', onKeydown);
    return function () { container.removeEventListener('keydown', onKeydown); };
  }

  /**
   * Scroll locking. Reference-counted, because the lightbox can be opened
   * from a page that already has the mobile drawer open.
   */
  var lockCount = 0;

  function lockScroll() {
    if (lockCount === 0) {
      var gap = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.setProperty('--scrollbar-w', gap + 'px');
      document.body.classList.add('is-locked');
    }
    lockCount += 1;
  }

  function unlockScroll() {
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) {
      document.body.classList.remove('is-locked');
      document.documentElement.style.removeProperty('--scrollbar-w');
    }
  }

  /* ------------------------------------------------------------------
     DOCUMENT FLAGS
     Adds `.js` so CSS can hide reveal targets. Without this class every
     [data-reveal] element stays visible, so a blocked or failed script
     degrades to plain readable content instead of a blank page.
     ------------------------------------------------------------------ */

  function initDocumentFlags() {
    document.documentElement.classList.add('js');
  }

  /* ------------------------------------------------------------------
     HEADER SCROLL
     ------------------------------------------------------------------ */

  function initHeaderScroll() {
    var header = $('[data-header]');
    if (!header) return;

    var HIDE_AFTER = 160;   // never hide while still near the top
    var DELTA = 6;          // ignore sub-pixel scroll jitter

    var lastY = window.scrollY;
    var ticking = false;

    /**
     * Relative luminance of a computed `rgb()` / `rgba()` string, or null
     * when the colour is transparent enough to see through.
     *
     * sRGB coefficients, not a naive average: 0.5 grey and pure blue have
     * very different perceived brightness and only the weighted form puts
     * the flip point where the eye expects it.
     */
    function luminance(color) {
      var m = /rgba?\(([^)]+)\)/.exec(color || '');
      if (!m) return null;
      var parts = m[1].split(',').map(parseFloat);
      if (parts.length > 3 && parts[3] < 0.5) return null;
      return (0.2126 * parts[0] + 0.7152 * parts[1] + 0.0722 * parts[2]) / 255;
    }

    /**
     * What is actually behind the header right now.
     *
     * The header floats over the page with no ground of its own, so on a
     * white band its white logo and glass pill disappear. Rather than
     * tagging every section by hand - which drifts the moment someone adds
     * one - this reads the page: it takes the topmost element under the
     * header's own centre line and walks up until it finds one that
     * actually paints a background, then measures that colour.
     */
    function groundIsLight() {
      var box = header.getBoundingClientRect();
      var y = Math.min(box.height * 0.5, window.innerHeight - 1);
      var x = Math.round(window.innerWidth / 2);

      // elementsFromPoint, not elementFromPoint. The header is fixed across
      // the full width, so the SINGULAR form returns the header itself at
      // every scroll position - and walking up from there lands on <body>,
      // which is white, so the chrome would report "light" over even the
      // darkest hero. The plural form gives the whole stack at that point
      // and lets the header be stepped over properly.
      var stack = document.elementsFromPoint(x, Math.round(y));

      for (var i = 0; i < stack.length; i++) {
        var el = stack[i];
        if (header.contains(el) || el === document.body ||
            el === document.documentElement) continue;

        var lum = luminance(getComputedStyle(el).backgroundColor);
        if (lum !== null) return lum > 0.55;
      }
      return false;
    }

    function update() {
      ticking = false;
      var y = window.scrollY;

      // The overlay menu supplies its own dark ground and pins the page,
      // so neither behaviour applies while it is open.
      if (header.classList.contains('is-nav-open')) {
        header.classList.remove('is-hidden');
        lastY = y;
        return;
      }

      var diff = y - lastY;
      if (Math.abs(diff) > DELTA) {
        header.classList.toggle('is-hidden', diff > 0 && y > HIDE_AFTER);
        lastY = y;
      }

      header.classList.toggle('is-stuck', y > 24);
      header.classList.toggle('is-on-light', groundIsLight());
    }

    on(window, 'scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });

    on(window, 'resize', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });

    update();
  }

  /* ------------------------------------------------------------------
     MOBILE MENU
     ------------------------------------------------------------------ */

  function initMobileMenu() {
    var toggle = $('[data-nav-toggle]');
    var nav = $('[data-nav]');
    var top = $('[data-header]');
    if (!toggle || !nav) return;

    var label = $('[data-nav-label]', toggle);
    var srLabel = $('[data-nav-sr]', toggle);
    var releaseTrap = null;
    var lastFocused = null;

    // The overlay ships with `hidden` so that a visitor with no JS never
    // meets a full-screen panel they cannot dismiss. Removing it here is
    // the first thing the module does; the CSS keeps it invisible until
    // `.is-open` runs the reveal.
    nav.removeAttribute('hidden');

    // Each row's stagger index. Set here rather than in the markup so
    // the menu can grow or shrink without anyone re-numbering it.
    $$('.primary-nav__link', nav).forEach(function (link, i) {
      link.style.setProperty('--i', i);
    });

    // `will-change` is a promise to the compositor, not a decoration: six
    // permanently-promoted layers cost memory for the whole life of the
    // page. It goes on when the panel starts moving and comes off when it
    // stops, keyed off the longest transition on the rows.
    var settle = null;

    function markAnimating() {
      nav.classList.add('is-animating');
      if (settle) clearTimeout(settle);
      settle = setTimeout(function () {
        nav.classList.remove('is-animating');
        settle = null;
      }, 1100);
    }

    function isOpen() {
      return nav.classList.contains('is-open');
    }

    function open() {
      lastFocused = document.activeElement;
      markAnimating();
      nav.classList.add('is-open');
      if (top) top.classList.add('is-nav-open');
      toggle.setAttribute('aria-expanded', 'true');
      if (label) label.textContent = 'Close';
      if (srLabel) srLabel.textContent = 'Close menu';
      lockScroll();
      releaseTrap = trapFocus(nav);
      var target = focusableWithin(nav)[0];
      if (target) target.focus();
    }

    function close() {
      markAnimating();
      nav.classList.remove('is-open');
      if (top) top.classList.remove('is-nav-open');
      toggle.setAttribute('aria-expanded', 'false');
      if (label) label.textContent = 'Menu';
      if (srLabel) srLabel.textContent = 'Open menu';
      unlockScroll();
      if (releaseTrap) { releaseTrap(); releaseTrap = null; }
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    }

    on(toggle, 'click', function () {
      if (isOpen()) close(); else open();
    });

    // Tapping any link closes the overlay, because the visitor is leaving.
    // Unlike the old drawer there is no submenu trigger to exempt: every
    // row in the overlay is a destination.
    on(nav, 'click', function (event) {
      var link = event.target.closest('a[href]');
      if (link && isOpen()) close();
    });

    on(document, 'keydown', function (event) {
      if (event.key === 'Escape' && isOpen()) close();
    });
  }

  /* ------------------------------------------------------------------
     NAVIGATION
     Marks the current page and makes the Services submenu keyboard
     operable. Hover alone is not an accessible affordance.
     ------------------------------------------------------------------ */

  function initNavigation() {
    var nav = $('[data-nav]');
    if (!nav) return;

    // aria-current, derived from the filename so it survives any host path.
    var here = window.location.pathname.split('/').pop() || 'index.html';
    $$('a[href]', nav).forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href || href.charAt(0) === '#' || /^(https?:|tel:|mailto:)/.test(href)) return;
      var target = href.split('/').pop().split('#')[0].split('?')[0];
      if (target && target === here) link.setAttribute('aria-current', 'page');
    });

    // The overlay carries no submenus — every service has its own row —
    // so marking the current page is all this module still does. The
    // matching row also gets `.is-current`, which is how the overlay
    // shows it at full white instead of the resting grey.
    $$('.primary-nav__item', nav).forEach(function (item) {
      var link = $('a[aria-current="page"]', item);
      if (link) item.classList.add('is-current');
    });
  }

  /* ------------------------------------------------------------------
     SCROLL REVEAL
     ------------------------------------------------------------------ */

  function initScrollReveal() {
    var targets = $$('[data-reveal], [data-reveal-stagger], [data-reveal-media]');
    if (!targets.length) return;

    // Index children so CSS can stagger them.
    $$('[data-reveal-stagger]').forEach(function (group) {
      Array.prototype.forEach.call(group.children, function (child, i) {
        child.style.setProperty('--i', i);
      });
    });

    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    targets.forEach(function (el) { observer.observe(el); });
  }

  /* ------------------------------------------------------------------
     VIDEO FALLBACK
     Autoplay can be refused (iOS Low Power Mode, Data Saver, some
     enterprise policies). The poster is the LCP element either way, so
     failure degrades to a still image with no layout shift.
     ------------------------------------------------------------------ */

  function initVideoFallback() {
    var videos = $$('video[data-autoplay]');
    if (!videos.length) return;

    videos.forEach(function (video) {
      // Reduced motion: never autoplay video.
      if (prefersReducedMotion()) {
        video.removeAttribute('autoplay');
        video.pause();
        video.classList.add('is-paused');
        return;
      }

      var attempt = video.play();
      if (attempt && typeof attempt.catch === 'function') {
        attempt.catch(function () {
          // Leave the poster showing. Removing the element entirely would
          // drop the poster with it, so we just stop trying.
          video.classList.add('is-paused');
          video.removeAttribute('autoplay');
        });
      }
    });
  }

  /* ------------------------------------------------------------------
     YOUTUBE FACADE
     Nine embeds on videos.html would cost megabytes and a dozen
     third-party connections before anyone presses play.
     ------------------------------------------------------------------ */

  function initYouTubeFacade() {
    var facades = $$('[data-youtube]');
    if (!facades.length) return;

    facades.forEach(function (facade) {
      on(facade, 'click', function () {
        var id = facade.getAttribute('data-youtube');
        if (!id) return;
        // These refuse to play on other sites (checked 2026-09-17): open YouTube.
        if (['uwtV-Dp0kc8', '1p2a0Rf8mAA', 'q6UxS0Tbc2o'].indexOf(id) > -1) {
          window.open('https://www.youtube.com/watch?v=' + id, '_blank', 'noopener');
          return;
        }
        var title = facade.getAttribute('data-title') || 'Acrylic Pros video';
        var iframe = document.createElement('iframe');
        iframe.setAttribute('src',
          'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0');
        iframe.setAttribute('title', title);
        iframe.setAttribute('allow',
          'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('loading', 'lazy');
        facade.innerHTML = '';
        facade.appendChild(iframe);
        facade.removeAttribute('data-youtube');
      });
    });
  }

  /* ------------------------------------------------------------------
     BEFORE / AFTER
     A range input is the real control. That gives keyboard operation,
     screen-reader semantics and touch support natively, instead of
     reimplementing all three on a div.
     ------------------------------------------------------------------ */

  function initBeforeAfter() {
    var sliders = $$('[data-before-after]');
    if (!sliders.length) return;

    sliders.forEach(function (slider) {
      var range = $('.ba__range', slider);
      var after = $('.ba__after', slider);
      var divider = $('.ba__divider', slider);
      if (!range || !after) return;

      function apply(value) {
        var pct = clamp(parseFloat(value), 0, 100);
        slider.style.setProperty('--pos', pct + '%');
        range.setAttribute('aria-valuenow', Math.round(pct));
        range.setAttribute('aria-valuetext', Math.round(pct) + '% restored');
        if (divider) divider.style.left = pct + '%';
      }

      on(range, 'input', function () { apply(range.value); });
      on(range, 'change', function () { apply(range.value); });

      // Dragging anywhere on the frame, not just on the thumb.
      var dragging = false;

      function positionFromEvent(event) {
        var rect = slider.getBoundingClientRect();
        if (!rect.width) return null;
        var x = event.clientX - rect.left;
        return clamp((x / rect.width) * 100, 0, 100);
      }

      on(slider, 'pointerdown', function (event) {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        dragging = true;
        var pct = positionFromEvent(event);
        if (pct === null) return;
        range.value = pct;
        apply(pct);
        if (slider.setPointerCapture) {
          try { slider.setPointerCapture(event.pointerId); } catch (e) { /* not capturable */ }
        }
      });

      on(slider, 'pointermove', function (event) {
        if (!dragging) return;
        var pct = positionFromEvent(event);
        if (pct === null) return;
        range.value = pct;
        apply(pct);
      });

      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (type) {
        on(slider, type, function () { dragging = false; });
      });

      apply(range.value || 50);
    });
  }

  /* ------------------------------------------------------------------
     GALLERY FILTERS
     ------------------------------------------------------------------ */

  function initGalleryFilters() {
    var group = $('[data-gallery-filters]');
    var grid = $('[data-gallery]');
    if (!group || !grid) return;

    var buttons = $$('[data-filter]', group);
    var items = $$('[data-category]', grid);
    var status = $('[data-gallery-status]');

    function applyFilter(value) {
      var shown = 0;
      items.forEach(function (item) {
        var categories = (item.getAttribute('data-category') || '').split(/\s+/);
        var match = value === 'all' || categories.indexOf(value) !== -1;
        item.classList.toggle('is-hidden', !match);
        if (match) shown += 1;
      });

      buttons.forEach(function (btn) {
        btn.setAttribute('aria-pressed', btn.getAttribute('data-filter') === value ? 'true' : 'false');
      });

      if (status) {
        status.textContent = shown + (shown === 1 ? ' project shown' : ' projects shown');
      }

      // The lightbox must only cycle through what is currently visible.
      document.dispatchEvent(new CustomEvent('gallery:filtered'));
    }

    buttons.forEach(function (btn) {
      on(btn, 'click', function () {
        applyFilter(btn.getAttribute('data-filter'));
      });
    });

    applyFilter('all');
  }

  /* ------------------------------------------------------------------
     LIGHTBOX
     ------------------------------------------------------------------ */

  function initLightbox() {
    var lightbox = $('[data-lightbox]');
    var grid = $('[data-gallery]');
    if (!lightbox || !grid) return;

    var imgEl = $('[data-lightbox-image]', lightbox);
    var titleEl = $('[data-lightbox-title]', lightbox);
    var countEl = $('[data-lightbox-count]', lightbox);
    var closeBtn = $('[data-lightbox-close]', lightbox);
    var prevBtn = $('[data-lightbox-prev]', lightbox);
    var nextBtn = $('[data-lightbox-next]', lightbox);

    var items = [];
    var index = 0;
    var releaseTrap = null;
    var lastFocused = null;

    function collect() {
      items = $$('[data-category]', grid).filter(function (el) {
        return !el.classList.contains('is-hidden');
      });
    }

    function render() {
      var item = items[index];
      if (!item || !imgEl) return;
      var full = item.getAttribute('data-full');
      var img = $('img', item);
      imgEl.setAttribute('src', full || (img ? img.currentSrc || img.src : ''));
      imgEl.setAttribute('alt', item.getAttribute('data-alt') || (img ? img.alt : ''));
      if (titleEl) titleEl.textContent = item.getAttribute('data-title') || '';
      if (countEl) countEl.textContent = (index + 1) + ' / ' + items.length;
    }

    function open(startIndex) {
      collect();
      if (!items.length) return;
      index = clamp(startIndex, 0, items.length - 1);
      lastFocused = document.activeElement;
      render();
      lightbox.classList.add('is-open');
      lightbox.removeAttribute('aria-hidden');
      lockScroll();
      releaseTrap = trapFocus(lightbox);
      if (closeBtn) closeBtn.focus();
    }

    function close() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      unlockScroll();
      if (releaseTrap) { releaseTrap(); releaseTrap = null; }
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    }

    function step(delta) {
      if (!items.length) return;
      index = (index + delta + items.length) % items.length;
      render();
    }

    on(grid, 'click', function (event) {
      var item = event.target.closest('[data-category]');
      if (!item) return;
      collect();
      var at = items.indexOf(item);
      if (at !== -1) open(at);
    });

    if (closeBtn) on(closeBtn, 'click', close);
    if (prevBtn) on(prevBtn, 'click', function () { step(-1); });
    if (nextBtn) on(nextBtn, 'click', function () { step(1); });

    // Clicking the backdrop (but not the image) closes.
    on(lightbox, 'click', function (event) {
      if (event.target === lightbox || event.target.hasAttribute('data-lightbox-stage')) close();
    });

    on(document, 'keydown', function (event) {
      if (!lightbox.classList.contains('is-open')) return;
      if (event.key === 'Escape') { close(); }
      else if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
      else if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
    });

    // Swipe on touch devices.
    var startX = 0;
    var startY = 0;
    var tracking = false;

    on(lightbox, 'touchstart', function (event) {
      if (event.touches.length !== 1) return;
      tracking = true;
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
    }, { passive: true });

    on(lightbox, 'touchend', function (event) {
      if (!tracking) return;
      tracking = false;
      var touch = event.changedTouches[0];
      var dx = touch.clientX - startX;
      var dy = touch.clientY - startY;
      // Horizontal intent only, so vertical scrolling is not hijacked.
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        step(dx < 0 ? 1 : -1);
      }
    }, { passive: true });

    on(document, 'gallery:filtered', function () {
      if (lightbox.classList.contains('is-open')) close();
    });
  }

  /* ------------------------------------------------------------------
     ACCORDIONS
     ------------------------------------------------------------------ */

  function initAccordions() {
    var triggers = $$('[data-accordion-trigger]');
    if (!triggers.length) return;

    triggers.forEach(function (trigger) {
      var panel = document.getElementById(trigger.getAttribute('aria-controls'));
      if (!panel) return;

      // Establish a known starting state rather than trusting the markup.
      var expanded = trigger.getAttribute('aria-expanded') === 'true';
      panel.setAttribute('data-open', expanded ? 'true' : 'false');

      on(trigger, 'click', function () {
        var open = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', open ? 'false' : 'true');
        panel.setAttribute('data-open', open ? 'false' : 'true');
      });
    });
  }

  /* ------------------------------------------------------------------
     TESTIMONIALS
     Manual advance only. No autoplay carousel — it steals reading time
     and is a well-known accessibility irritant.
     ------------------------------------------------------------------ */

  function initTestimonials() {
    var root = $('[data-testimonials]');
    if (!root) return;

    var slides = $$('[data-testimonial]', root);
    if (slides.length < 2) return;

    var prev = $('[data-testimonial-prev]', root);
    var next = $('[data-testimonial-next]', root);
    var count = $('[data-testimonial-count]', root);
    var live = $('[data-testimonial-live]', root);
    var index = 0;

    function show(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (slide, n) {
        var active = n === index;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
      if (count) count.textContent = (index + 1) + ' / ' + slides.length;
      if (live) live.textContent = 'Testimonial ' + (index + 1) + ' of ' + slides.length;
    }

    if (prev) on(prev, 'click', function () { show(index - 1); });
    if (next) on(next, 'click', function () { show(index + 1); });

    on(root, 'keydown', function (event) {
      if (event.key === 'ArrowLeft') { event.preventDefault(); show(index - 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); show(index + 1); }
    });

    show(0);
  }

  /* ------------------------------------------------------------------
     CONTACT PANEL
     Real channels only: call, SMS, WhatsApp, quote. This is NOT an AI
     chatbot and is never labelled as one — there is no AI backend.
     ------------------------------------------------------------------ */

  function initContactPanel() {
    var fab = $('[data-contact-fab]');
    var panel = $('[data-contact-panel]');
    if (!fab || !panel) return;

    var releaseTrap = null;

    function isOpen() { return panel.classList.contains('is-open'); }

    function open() {
      panel.classList.add('is-open');
      panel.removeAttribute('aria-hidden');
      fab.setAttribute('aria-expanded', 'true');
      releaseTrap = trapFocus(panel);
      var first = focusableWithin(panel)[0];
      if (first) first.focus();
    }

    function close(returnFocus) {
      panel.classList.remove('is-open');
      panel.setAttribute('aria-hidden', 'true');
      fab.setAttribute('aria-expanded', 'false');
      if (releaseTrap) { releaseTrap(); releaseTrap = null; }
      if (returnFocus) fab.focus();
    }

    on(fab, 'click', function () {
      if (isOpen()) close(true); else open();
    });

    on(document, 'keydown', function (event) {
      if (event.key === 'Escape' && isOpen()) close(true);
    });

    on(document, 'click', function (event) {
      if (!isOpen()) return;
      if (panel.contains(event.target) || fab.contains(event.target)) return;
      close(false);
    });
  }

  /* ------------------------------------------------------------------
     STICKY MOBILE CTA
     Hidden while a form or the footer is on screen, so it never covers
     the thing the visitor is trying to use.
     ------------------------------------------------------------------ */

  function initStickyMobileCTA() {
    var bar = $('[data-sticky-cta]');
    if (!bar) return;

    var blockers = $$('form, [data-cta-blocker], .site-footer');
    var hero = $('.hero, .page-hero');
    var blocked = false;

    if ('IntersectionObserver' in window && blockers.length) {
      var visibleBlockers = 0;
      var blockerObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) visibleBlockers += 1;
          else visibleBlockers = Math.max(0, visibleBlockers - 1);
        });
        blocked = visibleBlockers > 0;
        sync();
      }, { threshold: 0.01 });
      blockers.forEach(function (el) { blockerObserver.observe(el); });
    }

    var pastHero = !hero;

    if (hero && 'IntersectionObserver' in window) {
      var heroObserver = new IntersectionObserver(function (entries) {
        pastHero = !entries[0].isIntersecting;
        sync();
      }, { threshold: 0.12 });
      heroObserver.observe(hero);
    }

    function sync() {
      bar.classList.toggle('is-visible', pastHero && !blocked);
    }

    sync();
  }

  /* ------------------------------------------------------------------
     PRODUCT FILTERS
     ------------------------------------------------------------------ */

  function initProductFilters() {
    var group = $('[data-product-filters]');
    var grid = $('[data-product-grid]');
    if (!group || !grid) return;

    var buttons = $$('[data-range]', group);
    var cards = $$('[data-ranges]', grid);
    var status = $('[data-product-status]');

    function apply(value) {
      var shown = 0;
      cards.forEach(function (card) {
        var ranges = (card.getAttribute('data-ranges') || '').split(/\s+/);
        var match = value === 'all' || ranges.indexOf(value) !== -1;
        card.hidden = !match;
        if (match) shown += 1;
      });
      buttons.forEach(function (btn) {
        btn.setAttribute('aria-pressed', btn.getAttribute('data-range') === value ? 'true' : 'false');
      });
      if (status) status.textContent = shown + (shown === 1 ? ' tank shown' : ' tanks shown');
    }

    buttons.forEach(function (btn) {
      on(btn, 'click', function () { apply(btn.getAttribute('data-range')); });
    });

    apply('all');
  }

  /* ------------------------------------------------------------------
     FORMS

     Validation uses the Constraint Validation API, surfaced as inline
     aria-live messages.

     IMPORTANT: when FORM_ENDPOINT is null the form NEVER reports
     success, because nothing was submitted anywhere. It reports that
     submission is not yet connected and offers phone and email instead.
     ------------------------------------------------------------------ */

  function initForms() {
    var forms = $$('form[data-validate]');
    if (!forms.length) return;

    forms.forEach(function (form) {
      form.setAttribute('novalidate', 'novalidate');
      var status = $('[data-form-status]', form);
      var submitting = false;

      function fieldFor(control) {
        return control.closest('.field') || control.closest('.form__group');
      }

      function messageFor(control) {
        var validity = control.validity;
        var label = control.getAttribute('data-label') || 'This field';
        if (validity.valueMissing) {
          return control.type === 'checkbox' || control.type === 'radio'
            ? 'Please choose an option.'
            : label + ' is required.';
        }
        if (validity.typeMismatch && control.type === 'email') {
          return 'Enter a valid email address, for example name@example.com.';
        }
        if (validity.typeMismatch && control.type === 'url') return 'Enter a valid URL.';
        if (validity.patternMismatch && control.type === 'tel') {
          return 'Enter a valid phone number, digits only if you prefer.';
        }
        if (validity.patternMismatch) return 'Please match the requested format.';
        if (validity.tooShort) return label + ' is too short.';
        if (validity.rangeUnderflow || validity.rangeOverflow) return 'Enter a number in range.';
        return control.validationMessage || 'Please check this field.';
      }

      function setError(control, message) {
        var wrapper = fieldFor(control);
        if (!wrapper) return;
        var errorEl = $('.field__error', wrapper);
        wrapper.classList.toggle('field--invalid', Boolean(message));
        control.setAttribute('aria-invalid', message ? 'true' : 'false');
        if (errorEl) errorEl.textContent = message || '';
      }

      function validateControl(control) {
        if (control.disabled || control.type === 'hidden') return true;
        var ok = control.checkValidity();
        setError(control, ok ? '' : messageFor(control));
        return ok;
      }

      // Validate on blur, then live-correct once a field has been touched.
      $$('input, select, textarea', form).forEach(function (control) {
        on(control, 'blur', function () { validateControl(control); });
        on(control, 'input', function () {
          var wrapper = fieldFor(control);
          if (wrapper && wrapper.classList.contains('field--invalid')) validateControl(control);
        });
      });

      on(form, 'submit', function (event) {
        event.preventDefault();
        if (submitting) return;

        var controls = $$('input, select, textarea', form);
        var firstInvalid = null;

        controls.forEach(function (control) {
          if (!validateControl(control) && !firstInvalid) firstInvalid = control;
        });

        if (firstInvalid) {
          if (status) {
            status.setAttribute('data-state', 'error');
            status.textContent = 'Please correct the highlighted fields and try again.';
          }
          firstInvalid.focus();
          return;
        }

        if (!FORM_ENDPOINT) {
          // No backend. Say so plainly — never fake a success state.
          if (status) {
            status.setAttribute('data-state', 'info');
            status.innerHTML =
              '<strong>This form is not connected yet.</strong><br>' +
              'Your details have <em>not</em> been sent. Please call ' +
              '<a href="' + PHONE_HREF + '">' + PHONE_DISPLAY + '</a> or email ' +
              '<a href="mailto:' + EMAIL + '">' + EMAIL + '</a> and we will pick it up straight away.';
            status.focus();
          }
          return;
        }

        submitting = true;
        var button = $('button[type="submit"]', form);
        if (button) { button.disabled = true; }
        if (status) {
          status.setAttribute('data-state', 'info');
          status.textContent = 'Sending your request…';
        }

        fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: new FormData(form)
        }).then(function (response) {
          if (!response.ok) throw new Error('Request failed: ' + response.status);
          form.reset();
          if (status) {
            status.setAttribute('data-state', 'success');
            status.textContent = 'Thank you — your request has been sent. We will be in touch shortly.';
          }
        }).catch(function () {
          if (status) {
            status.setAttribute('data-state', 'error');
            status.innerHTML =
              'Sorry, your request could not be sent. Please call ' +
              '<a href="' + PHONE_HREF + '">' + PHONE_DISPLAY + '</a> or email ' +
              '<a href="mailto:' + EMAIL + '">' + EMAIL + '</a>.';
          }
        }).then(function () {
          submitting = false;
          if (button) button.disabled = false;
        });
      });
    });
  }

  /* ------------------------------------------------------------------
     BOOT
     ------------------------------------------------------------------ */

  /* ------------------------------------------------------------------
     SMOOTH SCROLL - deliberately absent

     An earlier pass here reproduced Aquatique's Lenis smooth scrolling by
     hand: preventDefault the wheel, hold a target position, and ease the
     real one towards it every frame.

     It was removed because that is precisely what made the page feel
     laggy. Frame timing was a clean 60fps throughout - nothing was being
     dropped. The problem is structural: cancelling the wheel event and
     then chasing it with a lerp means the page is, by construction,
     always behind the input. No easing constant fixes that; a faster one
     just makes the effect pointless.

     Native scrolling is already smooth, already compositor-driven, and
     already matches the visitor's trackpad and OS settings. Nothing in
     this design language depends on hijacking it.
     ------------------------------------------------------------------ */

  /* ------------------------------------------------------------------
     HERO TICKER

     The marquee needs its content twice so the -50% translate loops
     seamlessly. Duplicating it here rather than in the markup keeps the
     copy written once and keeps the duplicate out of the accessibility
     tree and out of the page's word count.
     ------------------------------------------------------------------ */

  function initTicker() {
    $$('[data-ticker]').forEach(function (track) {
      if (track.dataset.tickerReady) return;
      var clone = track.cloneNode(true);

      // The clone's own wrapper is discarded when its children are moved
      // across, so aria-hidden has to go on each child rather than on it,
      // or the duplicate copy is read out a second time.
      $$('a', clone).forEach(function (a) { a.setAttribute('tabindex', '-1'); });
      while (clone.firstChild) {
        var node = clone.firstChild;
        if (node.nodeType === 1) node.setAttribute('aria-hidden', 'true');
        track.appendChild(node);
      }

      track.dataset.tickerReady = '1';
    });
  }

  /* ------------------------------------------------------------------
     DRAG SLIDER

     Aquatique's product and reference rails: a row that overflows the
     container, scrolls horizontally, and can be dragged with a mouse as
     well as flicked on touch. The underlying element is a real
     overflow-x container, so touch, trackpad, keyboard and scrollbar all
     work with no help from this module — it only adds mouse dragging and
     the prev/next buttons.
     ------------------------------------------------------------------ */

  function initDragSliders() {
    $$('[data-slider]').forEach(function (slider) {
      var viewport = $('[data-slider-viewport]', slider) || slider;
      var prev = $('[data-slider-prev]', slider);
      var next = $('[data-slider-next]', slider);

      var down = false;
      var startX = 0;
      var startLeft = 0;
      var moved = 0;

      function step() {
        var first = viewport.firstElementChild;
        var width = first ? first.getBoundingClientRect().width : viewport.clientWidth * 0.8;
        return width + 20;
      }

      function syncButtons() {
        var end = viewport.scrollWidth - viewport.clientWidth - 1;
        if (prev) prev.disabled = viewport.scrollLeft <= 0;
        if (next) next.disabled = viewport.scrollLeft >= end;
      }

      on(viewport, 'scroll', syncButtons, { passive: true });
      on(window, 'resize', syncButtons, { passive: true });
      syncButtons();

      if (prev) on(prev, 'click', function () {
        viewport.scrollBy({ left: -step(), behavior: 'smooth' });
      });

      if (next) on(next, 'click', function () {
        viewport.scrollBy({ left: step(), behavior: 'smooth' });
      });

      on(viewport, 'pointerdown', function (event) {
        if (event.pointerType !== 'mouse') return;
        down = true;
        moved = 0;
        startX = event.clientX;
        startLeft = viewport.scrollLeft;
        viewport.classList.add('is-dragging');
      });

      on(viewport, 'pointermove', function (event) {
        if (!down) return;
        var dx = event.clientX - startX;
        moved = Math.abs(dx);
        viewport.scrollLeft = startLeft - dx;
      });

      function release() {
        if (!down) return;
        down = false;
        viewport.classList.remove('is-dragging');
      }

      on(viewport, 'pointerup', release);
      on(viewport, 'pointercancel', release);
      on(viewport, 'pointerleave', release);

      // A drag that ends on a card must not also follow its link.
      on(viewport, 'click', function (event) {
        if (moved > 6) { event.preventDefault(); event.stopPropagation(); }
        moved = 0;
      }, true);
    });
  }

  /* ------------------------------------------------------------------
     CATEGORY SELECTOR

     Drives the sliding pill behind Aquatique's segmented control. It
     owns nothing but the slider's position: the buttons keep whatever
     behaviour their own module gave them, and `aria-pressed` — which
     this reads rather than writes — stays the single source of truth.

     A MutationObserver rather than a click handler, so the pill follows
     the state no matter who changed it: the filter module, a reset
     button, or keyboard activation.
     ------------------------------------------------------------------ */

  function initCatSelectors() {
    $$('[data-cat-selector]').forEach(function (group) {
      var slider = $('[data-cat-slider]', group);
      if (!slider) return;

      function move() {
        var active = $('[aria-pressed="true"]', group);
        if (!active) { slider.style.opacity = '0'; return; }

        slider.style.opacity = '1';
        slider.style.width = active.offsetWidth + 'px';
        slider.style.transform = 'translateX(' + active.offsetLeft + 'px)';
      }

      // The first pass must not animate from 0, or the pill flies in from
      // the left edge on load.
      var initial = slider.style.transition;
      slider.style.transition = 'none';
      move();
      // Force a reflow so the no-transition position is committed before
      // the real transition is restored.
      void slider.offsetWidth;
      slider.style.transition = initial;

      new MutationObserver(move).observe(group, {
        subtree: true,
        attributes: true,
        attributeFilter: ['aria-pressed']
      });

      on(window, 'resize', move, { passive: true });
      on(group, 'scroll', move, { passive: true });
    });
  }

  /* ------------------------------------------------------------------
     SCROLL PROGRESS

     Drives three of Aquatique's interior components from one shared
     scroll handler, because three separate rAF loops reading layout is
     three forced reflows a frame:

       .step          the dashed rail that draws itself as a step is read
       .page-summary  the circular ring beside each section in the rail
       .text-scroll   the oversized line that lights word by word

     Everything is written to a `--progress` custom property and animated
     in CSS, so this function never touches a style that causes layout.
     Reads are batched before any write.
     ------------------------------------------------------------------ */

  function initScrollProgress() {
    var steps = $$('[data-step]');
    var summaries = $$('[data-summary]');
    var scrollTexts = $$('[data-text-scroll]');

    if (!steps.length && !summaries.length && !scrollTexts.length) return;

    // Split the scroll-reveal lines into words up front. Done once, and
    // only when the component is present, so no page pays for it twice.
    var wordSets = scrollTexts.map(function (el) {
      var text = el.textContent.replace(/\s+/g, ' ').trim();
      el.textContent = '';
      return text.split(' ').map(function (word, i, all) {
        var span = document.createElement('span');
        span.className = 'text-scroll__word';
        span.textContent = word + (i < all.length - 1 ? ' ' : '');
        el.appendChild(span);
        return span;
      });
    });

    // Tracked sections for each summary rail, resolved from the rail's
    // own links so the markup stays the single source of truth.
    var rails = summaries.map(function (rail) {
      return {
        rail: rail,
        items: $$('.page-summary__item', rail).map(function (item) {
          var link = $('a[href^="#"]', item);
          var target = link && document.getElementById(link.getAttribute('href').slice(1));
          return { item: item, target: target };
        }).filter(function (x) { return x.target; })
      };
    });

    var ticking = false;

    /** How far through an element the viewport has travelled, 0 to 1. */
    function progressOf(rect) {
      var vh = window.innerHeight;
      var total = rect.height + vh;
      if (total <= 0) return 0;
      return clamp((vh - rect.top) / total, 0, 1);
    }

    function update() {
      ticking = false;

      steps.forEach(function (step) {
        var rect = step.getBoundingClientRect();
        // The rail should be full by the time the step leaves the middle
        // of the screen, not when it leaves the viewport entirely.
        var p = clamp((window.innerHeight * 0.55 - rect.top) / rect.height, 0, 1);
        step.style.setProperty('--progress', p.toFixed(3));
      });

      rails.forEach(function (r) {
        var activeIndex = -1;
        r.items.forEach(function (entry, i) {
          var rect = entry.target.getBoundingClientRect();
          entry.item.style.setProperty('--progress', progressOf(rect).toFixed(3));
          if (rect.top <= window.innerHeight * 0.4 && rect.bottom > window.innerHeight * 0.4) {
            activeIndex = i;
          }
        });
        r.items.forEach(function (entry, i) {
          entry.item.classList.toggle('is-active', i === activeIndex);
        });
      });

      wordSets.forEach(function (words, i) {
        var rect = scrollTexts[i].getBoundingClientRect();
        var p = clamp((window.innerHeight * 0.8 - rect.top) / (rect.height + window.innerHeight * 0.25), 0, 1);
        var lit = Math.round(p * words.length);
        words.forEach(function (w, n) { w.classList.toggle('is-lit', n < lit); });
      });
    }

    on(window, 'scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });

    on(window, 'resize', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });

    update();
  }

  /* ------------------------------------------------------------------
     QUOTE PREFILL

     The footer capture panel is a GET form pointing at quote.html, so
     the address arrives as ?email=. Moving it into the real field saves
     the visitor typing it twice.
     ------------------------------------------------------------------ */

  function initQuotePrefill() {
    var field = document.getElementById('email');
    if (!field || field.value) return;

    var match = /[?&]email=([^&]*)/.exec(window.location.search);
    if (!match) return;

    try {
      field.value = decodeURIComponent(match[1].replace(/\+/g, ' '));
    } catch (err) {
      /* a malformed query string is not worth failing the page over */
    }
  }

  function boot() {
    initDocumentFlags();
    initTicker();
    initDragSliders();
    initCatSelectors();
    initScrollProgress();
    initQuotePrefill();
    initHeaderScroll();
    initMobileMenu();
    initNavigation();
    initScrollReveal();
    initVideoFallback();
    initYouTubeFacade();
    initBeforeAfter();
    initGalleryFilters();
    initLightbox();
    initAccordions();
    initTestimonials();
    initContactPanel();
    initStickyMobileCTA();
    initProductFilters();
    initForms();
  }

  // `.js` must land as early as possible to avoid a flash of hidden
  // content, so it runs immediately rather than waiting for DOMContentLoaded.
  initDocumentFlags();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
