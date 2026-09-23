/* =====================================================================
   Acrylic Pros — inner-page behaviour
   Runs before home.js (shared chrome, Lenis, in-view classes, dark UI),
   which is locked and must not be edited.
   ===================================================================== */
(function () {
  'use strict';

  // Set to a real endpoint to connect the forms. While null, a form NEVER
  // reports success — nothing was sent, so it says so and offers the phone.
  var FORM_ENDPOINT = null;
  var PHONE_DISPLAY = '+1 (562) 566-0150';
  var PHONE_HREF = 'tel:+15625660150';
  var EMAIL = 'info@acrylicpros.com';

  var doc = document.documentElement;
  var body = document.body;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (any-pointer: fine)').matches;
  var touch = window.matchMedia('(hover: none)').matches;

  var EASE_QUINT = 'cubic-bezier(.23, 1, .32, 1)';
  var EASE_EXPO = 'cubic-bezier(.19, 1, .22, 1)';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }
  function raf(fn) { return window.requestAnimationFrame(fn); }
  function play(video) { var p = video.play(); if (p) p.catch(function () {}); }

  var page = $('[data-page]');
  var loader = $('[data-loader]');
  var panels = $$('[data-panel]');
  var entering = doc.classList.contains('is-entering');

  if (entering && (reduced || !page || !page.animate)) {
    doc.classList.remove('is-entering');
    entering = false;
  }
  // Entered through the panel wipe: no smoke loader (home.js then skips it).
  if (entering && loader) { loader.remove(); loader = null; }

  /* ------------------------------------------------------------------
     Current menu link
     ------------------------------------------------------------------ */
  var nav = $('[data-nav]');
  if (nav) {
    var current = nav.getAttribute('data-nav');
    var link = current && $('[data-nav-item="' + current + '"]', nav);
    if (link) {
      link.classList.add('-active');
      link.setAttribute('aria-current', 'page');
    } else {
      nav.classList.remove('-active');
    }
  }

  /* ------------------------------------------------------------------
     Inner pages: the header reads the band under it
     (light band -> dark header).
     ------------------------------------------------------------------ */
  if (body.classList.contains('t-inner')) {
    // home.js would also flip the header from data-dark-ui markers; with the
    // short page banners those fire too early, so this check owns it here.
    $$('[data-dark-ui]').forEach(function (el) { el.removeAttribute('data-dark-ui'); });
    var CHROME = '.o-header, .a-loader, .o-menu, .a-panel, .skip-link';
    var lightness = function (el) {
      for (; el && el !== body && el !== doc; el = el.parentElement) {
        if (/^(IMG|VIDEO|IFRAME|CANVAS)$/.test(el.tagName)) return 0;
        var cs = getComputedStyle(el);
        if (cs.backgroundImage !== 'none' && cs.backgroundImage.indexOf('gradient') < 0) return 0;
        var c = cs.backgroundColor.match(/[\d.]+/g);
        if (c && (c.length < 4 || +c[3] > 0.5)) return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
      }
      return 1;
    };
    var toneQueued = false;
    var tone = function () {
      toneQueued = false;
      if (doc.classList.contains('menu-open')) return;
      // Sample under the burger and under the logo; either on a light band
      // means the glass pills would vanish, so switch to the dark UI.
      var light = [60, window.innerWidth / 2].some(function (x) {
        var hit = document.elementsFromPoint(x, 60).filter(function (el) {
          return !el.closest(CHROME);
        })[0];
        return lightness(hit) > 0.6;
      });
      body.classList.toggle('-dark', light);
    };
    var queueTone = function () { if (!toneQueued) { toneQueued = true; raf(tone); } };
    window.addEventListener('scroll', queueTone, { passive: true });
    window.addEventListener('resize', queueTone);
    window.addEventListener('load', queueTone);
    new MutationObserver(queueTone).observe(doc, { attributes: true, attributeFilter: ['class'] });
    queueTone();
  }

  /* ------------------------------------------------------------------
     Page transition: navy sheet, gold sheet 150ms later, then the page
     ------------------------------------------------------------------ */
  var leaving = false;

  function transitionTarget(a, event) {
    if (event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
    if ((a.target && a.target !== '_self') || a.hasAttribute('download')) return null;
    var url;
    try { url = new URL(a.getAttribute('href'), location.href); } catch (e) { return null; }
    if (url.origin !== location.origin) return null;
    if (!/(\.html|\/)$/.test(url.pathname)) return null;
    if (url.pathname === location.pathname && url.hash) return null;
    return url;
  }

  if (!reduced && panels.length) {
    document.addEventListener('click', function (event) {
      var a = event.target.closest && event.target.closest('a[href]');
      if (!a || leaving) return;
      var url = transitionTarget(a, event);
      if (!url) return;
      event.preventDefault();
      leaving = true;
      doc.classList.add('is-loading');
      body.classList.remove('-dark');
      panels.forEach(function (panel, i) {
        panel.animate(
          [{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }],
          { duration: 1400, delay: i * 150, easing: EASE_QUINT, fill: 'forwards' }
        );
      });
      // The homepage runs its own intro; only inner pages pick the wipe up.
      if (!/(^|\/)(index\.html)?$/.test(url.pathname)) {
        try { sessionStorage.setItem('ap:transition', String(Date.now())); } catch (e) {}
      }
      setTimeout(function () { location.href = url.href; }, 800);
    });

    // Back/forward cache: never come back to a page hidden behind the sheets.
    window.addEventListener('pageshow', function (event) {
      if (!event.persisted) return;
      leaving = false;
      doc.classList.remove('is-loading');
      panels.forEach(function (p) { p.getAnimations().forEach(function (a) { a.cancel(); }); });
    });
  }

  /* ------------------------------------------------------------------
     Hero: in-view classes + line-split title
     ------------------------------------------------------------------ */
  var hero = $('[data-page-hero]');

  function expoOut(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

  function titleReveal() {
    var el = $('[data-page-title]');
    if (!el) return;
    if (reduced || !el.animate) { el.style.opacity = 1; return; }

    var original = el.innerHTML;
    el.style.height = el.getBoundingClientRect().height + 'px';

    var words = [];
    (function walk(node, strong) {
      Array.prototype.forEach.call(node.childNodes, function (child) {
        if (child.nodeType === 3) {
          child.textContent.split(/\s+/).forEach(function (w) { if (w) words.push({ text: w, strong: strong }); });
        } else if (child.nodeName === 'BR') {
          words.push({ br: true });
        } else if (child.nodeType === 1) {
          walk(child, strong || child.nodeName === 'STRONG' || child.nodeName === 'B');
        }
      });
    })(el, false);

    if (touch && words.some(function (w) { return w.text && w.text.length > 10; })) {
      el.style.opacity = 1;
      el.style.height = '';
      return;
    }

    el.textContent = '';
    var nodes = [];
    words.forEach(function (w) {
      if (w.br) { el.appendChild(document.createElement('br')); return; }
      var n = document.createElement(w.strong ? 'strong' : 'span');
      n.style.display = 'inline-block';
      n.textContent = w.text;
      el.appendChild(n);
      el.appendChild(document.createTextNode(' '));
      nodes.push(n);
    });

    var rows = [];
    nodes.forEach(function (n) {
      var top = n.offsetTop;
      var row = rows.filter(function (r) { return r.top === top; })[0];
      if (!row) { row = { top: top, nodes: [] }; rows.push(row); }
      row.nodes.push(n);
    });

    el.textContent = '';
    var lines = rows.map(function (row) {
      var wrapper = document.createElement('span');
      var line = document.createElement('span');
      wrapper.className = 'a-line-wrapper';
      line.className = 'a-line';
      wrapper.style.display = 'inline-block';
      line.style.display = 'inline-block';
      row.nodes.forEach(function (n) { line.appendChild(n); line.appendChild(document.createTextNode(' ')); });
      wrapper.appendChild(line);
      el.appendChild(wrapper);
      return line;
    });

    el.style.opacity = 1;
    var count = lines.length;
    var longest = 0;
    lines.forEach(function (line, i) {
      var delay = count > 1 ? expoOut(i / (count - 1)) * (count - 1) * 100 : 0;
      longest = Math.max(longest, delay);
      line.animate(
        [{ transform: 'translateY(120%)' }, { transform: 'translateY(0%)' }],
        { duration: 2000, delay: delay, easing: EASE_EXPO, fill: 'both' }
      );
    });
    setTimeout(function () {
      el.innerHTML = original;
      el.style.height = 'auto';
    }, 2000 + longest);
  }

  function revealHero() { if (hero) hero.classList.add('is-inview'); }

  // Same start signal home.js uses for the smoke loader.
  function whenIntro(cb) {
    var done = false;
    var once = function () { if (!done) { done = true; cb(); } };
    if (!loader || reduced) { once(); return; }
    var video = $('video', loader);
    var start = function () {
      if (video.readyState >= 1) once();
      else {
        video.addEventListener('loadedmetadata', once, { once: true });
        setTimeout(once, 1500);
      }
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    setTimeout(once, 4000);
  }

  var pageReady; // resolves when the page is fully shown (for the gallery cascade)
  if (entering) {
    var slide = page.animate(
      [{ transform: 'translateY(100vh)' }, { transform: 'translateY(0)' }],
      { duration: 1400, easing: EASE_QUINT, fill: 'forwards' }
    );
    slide.onfinish = function () {
      doc.classList.remove('is-entering');
      slide.cancel();
    };
    setTimeout(revealHero, 220);
    setTimeout(titleReveal, 430);
    pageReady = function (cb) { setTimeout(cb, 1700); };
  } else {
    whenIntro(function () { revealHero(); titleReveal(); });
    pageReady = function (cb) {
      if (document.readyState === 'complete') cb();
      else window.addEventListener('load', cb, { once: true });
    };
  }

  /* ------------------------------------------------------------------
     Scroll-linked: section rings, word-colour quotes, parallax, step lines
     ------------------------------------------------------------------ */
  var summaryItems = $$('[data-summary]').map(function (li) {
    var id = (li.querySelector('a').getAttribute('href') || '').slice(1);
    return { li: li, section: document.getElementById(id) };
  }).filter(function (s) { return s.section; });

  function hexToRgb(hex) {
    var n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }
  function easeOutInQuad(t) {
    return t < 0.5 ? (1 - Math.pow(1 - t * 2, 2)) / 2 : (Math.pow(t * 2 - 1, 2) + 1) / 2;
  }

  var quotes = $$('[data-text-scroll]').map(function (el) {
    var p = $('p', el);
    var words = p.textContent.trim().split(/\s+/);
    p.textContent = '';
    var spans = words.map(function (w) {
      var s = document.createElement('span');
      s.textContent = w;
      p.appendChild(s);
      p.appendChild(document.createTextNode(' '));
      return s;
    });
    var n = spans.length;
    return {
      el: el,
      spans: spans,
      from: hexToRgb(el.getAttribute('data-color-from')),
      to: hexToRgb(el.getAttribute('data-color-to')),
      delays: spans.map(function (_, i) { return n > 1 ? easeOutInQuad(i / (n - 1)) * (n - 1) * 50 : 0; }),
      duration: 1200 + 50 * Math.max(n - 1, 0),
      last: -1
    };
  });

  var parallaxEls = $$('[data-parallax]');
  var steppers = $$('[data-step-line]');

  function paintQuote(q, p) {
    if (Math.abs(p - q.last) < 0.0005) return;
    q.last = p;
    var t = p * q.duration;
    for (var i = 0; i < q.spans.length; i++) {
      var e = easeOutQuart(clamp((t - q.delays[i]) / 1200, 0, 1));
      q.spans[i].style.color = 'rgb(' +
        Math.round(q.from[0] + (q.to[0] - q.from[0]) * e) + ',' +
        Math.round(q.from[1] + (q.to[1] - q.from[1]) * e) + ',' +
        Math.round(q.from[2] + (q.to[2] - q.from[2]) * e) + ')';
    }
  }

  var ticking = false;
  function onScrollFrame() {
    ticking = false;
    var vh = window.innerHeight;

    summaryItems.forEach(function (s) {
      var r = s.section.getBoundingClientRect();
      var p = clamp((0.67 * vh - r.top) / (r.height + 0.34 * vh), 0, 1);
      s.li.style.setProperty('--progress', (p * 100).toFixed(2));
      s.li.classList.toggle('-is-active', p > 0 && p < 1);
    });

    quotes.forEach(function (q) {
      var r = q.el.getBoundingClientRect();
      paintQuote(q, clamp((0.67 * vh - r.top) / (0.5 * r.height + 0.34 * vh), 0, 1));
    });

    steppers.forEach(function (el) {
      var stepper = el.parentNode; // the progress window is the whole stepper column
      var r = stepper.getBoundingClientRect();
      var p = clamp((0.5 * vh - r.top) / Math.max(0.5 * r.height, 1), 0, 1);
      stepper.style.setProperty('--progress', p.toFixed(4));
    });

    // Parallax runs wherever Lenis drives the scroll (not on touch, where it keeps native scrolling).
    var smooth = !touch && !reduced && doc.classList.contains('lenis');
    parallaxEls.forEach(function (el) {
      if (!smooth) { el.style.transform = ''; return; }
      var speed = parseFloat(el.getAttribute('data-parallax')) || 0;
      var r = el.getBoundingClientRect();
      var base = r.top - (parseFloat(el.dataset.shift) || 0);
      var p = clamp((vh - base) / (vh + r.height), 0, 1);
      var shift = -speed * vh * (p * 2 - 1);
      el.dataset.shift = shift;
      el.style.transform = 'translate3d(0,' + shift.toFixed(2) + 'px,0)';
    });
  }
  function requestFrame() { if (!ticking) { ticking = true; raf(onScrollFrame); } }
  if (summaryItems.length || quotes.length || parallaxEls.length || steppers.length) {
    window.addEventListener('scroll', requestFrame, { passive: true });
    window.addEventListener('resize', requestFrame);
    window.addEventListener('load', requestFrame);
    requestFrame();
  }

  /* ------------------------------------------------------------------
     Lazy background videos (only fetched once near the viewport)
     ------------------------------------------------------------------ */
  if (reduced) {
    // The video never plays here, so the still is all there is to show.
    $$('video[data-poster]').forEach(function (v) { v.poster = v.getAttribute('data-poster'); });
  } else {
    var lazyVideoIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var v = entry.target;
        if (entry.isIntersecting) {
          if (!v.getAttribute('src')) v.src = v.getAttribute('data-lazy-src');
          play(v);
        } else if (v.getAttribute('src')) {
          v.pause();
        }
      });
    }, { rootMargin: '200px 0px' });
    $$('video[data-lazy-src]').forEach(function (v) { lazyVideoIO.observe(v); });
  }

  /* ------------------------------------------------------------------
     Card videos: loaded and played while the card is on screen, paused
     when it leaves so a long page is not decoding a dozen of them at once.
     ------------------------------------------------------------------ */
  function cardVideos(root) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var v = entry.target;
        if (!entry.isIntersecting) { if (v.getAttribute('src')) v.pause(); return; }
        v.parentNode.classList.add('-hover'); // the class that fades it over the still
        // play() before the file has loaded is what starts the download:
        // these carry preload="none", so setting src alone fetches nothing
        // and waiting for loadeddata waits forever.
        if (!v.getAttribute('src')) v.src = v.getAttribute('data-src');
        play(v);
      });
    }, { rootMargin: '200px 0px' });
    $$('video[data-src]', root).forEach(function (v) { io.observe(v); });
  }

  /* ------------------------------------------------------------------
     Category selector (services index; same markup and styles as the homepage's)
     ------------------------------------------------------------------ */
  function catSelector(root, onChange) {
    var buttons = $$('[data-cat-list] button', root);
    var select = $('[data-cat-select]', root);
    function mark(value, moveTo) {
      buttons.forEach(function (b) {
        var on = b.getAttribute('data-value') === value;
        b.classList.toggle('-active', on);
        b.setAttribute('aria-pressed', String(on));
        if (on && moveTo) {
          root.style.setProperty('--offset', b.getAttribute('data-index'));
          root.style.setProperty('--color', b.getAttribute('data-color'));
        }
      });
      select.value = value;
    }
    $('[data-cat-list]', root).addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b || b.classList.contains('-active')) return;
      var value = b.getAttribute('data-value');
      onChange(value);
      raf(function () { mark(value, true); });
    });
    select.addEventListener('change', function () {
      mark(select.value, true);
      onChange(select.value);
    });
    return { mark: mark };
  }

  function setFilterParam(value) {
    try {
      var url = new URL(location.href);
      if (value === 'all') url.searchParams.delete('filter');
      else url.searchParams.set('filter', value);
      history.replaceState(history.state, '', url.toString());
    } catch (e) {}
  }
  function filterParam() {
    try { return new URL(location.href).searchParams.get('filter'); } catch (e) { return null; }
  }

  /* ------------------------------------------------------------------
     Services index: filter, load more, hover videos
     ------------------------------------------------------------------ */
  var productsGrid = $('[data-products-grid]');
  if (productsGrid) {
    var PAGE = 8;
    var cards = $$('li[data-cat]', productsGrid);
    var more = $('[data-products-more]');
    var catRoot = $('[data-cat]');
    var value = 'all';
    var shown = PAGE;

    var renderProducts = function () {
      var matches = cards.filter(function (c) { return value === 'all' || c.getAttribute('data-cat') === value; });
      cards.forEach(function (c) { c.classList.add('-hidden'); });
      matches.slice(0, shown).forEach(function (c) { c.classList.remove('-hidden'); });
      more.classList.toggle('-hidden', matches.length <= shown);
    };

    var selector = catSelector(catRoot, function (v) {
      value = v;
      shown = PAGE;
      setFilterParam(v);
      renderProducts();
    });

    var initial = filterParam();
    if (initial && $('[data-cat-list] [data-value="' + initial + '"]', catRoot)) {
      value = initial;
      selector.mark(initial, true);
    }
    renderProducts();

    more.addEventListener('click', function () {
      var before = $$('li[data-cat]:not(.-hidden)', productsGrid).length;
      shown += PAGE;
      renderProducts();
      var next = $$('li[data-cat]:not(.-hidden) a', productsGrid)[before];
      if (next) next.focus({ preventScroll: true });
    });

    // Client, 23 Sept: a card's video plays from the moment it is on screen.
    // It used to wait for hover, which meant a touch visitor never saw it at
    // all and a mouse visitor only saw the card they were pointing at.
    if (!reduced) {
      cardVideos(productsGrid);
    }
  }

  /* ------------------------------------------------------------------
     Gallery (reference grid): cascade, load more, filter pill, hover,
     lightbox
     ------------------------------------------------------------------ */
  var refRoot = $('[data-references]');
  if (refRoot) {
    var FIRST = 19;
    var STEP = 20;
    var items = $$('[data-card]', refRoot);
    var loadMore = $('[data-references-more]', refRoot);
    var select = $('[data-references-select]', refRoot);
    var toggle = $('[data-references-toggle]', select);
    var list = $('[data-references-list]', select);
    var label = $('[data-references-label]', select);
    var category = 'all';
    var matches = items.slice();
    var hoverable = true;
    var hovered = null;
    var hoverTimer = null;
    var unhoverTimer = null;

    var matchesFor = function (cat) {
      return items.filter(function (it) {
        return cat === 'all' || (' ' + it.getAttribute('data-category') + ' ').indexOf(' ' + cat + ' ') !== -1;
      });
    };

    var activate = function (els) {
      els.forEach(function (it) { it.classList.add('-active'); });
      raf(function () { raf(function () { els.forEach(function (it) { it.classList.add('-visible'); }); }); });
    };

    var updateDelays = function () {
      var i = 0;
      matches.forEach(function (it) {
        if (!it.classList.contains('-active')) return;
        $('.m-referenceCard', it).style.setProperty('--delay', ((i % FIRST) * 100) + 'ms');
        i++;
      });
    };

    var updateMore = function () {
      var remaining = matches.filter(function (it) { return !it.classList.contains('-active'); }).length;
      loadMore.classList.toggle('-hidden', remaining === 0);
    };

    var applyCategory = function (cat) {
      category = cat;
      matches = matchesFor(cat);
      items.forEach(function (it) { it.classList.remove('-active', '-visible', '-backside'); });
      matches.slice(0, FIRST).forEach(function (it) { it.classList.add('-active'); });
      updateDelays();
      updateMore();
    };

    var initialCat = filterParam();
    var initialBtn = initialCat && $('[data-category="' + initialCat + '"]', list);
    applyCategory(initialBtn ? initialCat : 'all');
    if (initialBtn) {
      $$('.m-referencesSelect__item', list).forEach(function (b) { b.classList.toggle('-current', b === initialBtn); });
      label.textContent = initialBtn.textContent;
    }

    var enter = function () {
      raf(function () {
        refRoot.classList.add('-ready');
        matches.forEach(function (it) { if (it.classList.contains('-active')) it.classList.add('-visible'); });
      });
    };
    if (reduced) enter();
    else pageReady(function () { setTimeout(enter, 600); });

    loadMore.addEventListener('click', function () {
      var next = matches.filter(function (it) { return !it.classList.contains('-active'); }).slice(0, STEP);
      activate(next);
      updateDelays();
      updateMore();
      var btn = next[0] && $('[data-open]', next[0]);
      if (btn) btn.focus({ preventScroll: true });
    });

    // Filter pill — sticky, grows upward.
    var setOpen = function (open) {
      list.style.setProperty('--height', list.scrollHeight + 'px');
      select.classList.toggle('-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', function () { setOpen(!select.classList.contains('-open')); });
    document.addEventListener('click', function (e) {
      if (select.classList.contains('-open') && !select.contains(e.target)) setOpen(false);
    });
    select.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && select.classList.contains('-open')) { setOpen(false); toggle.focus(); }
    });
    list.addEventListener('click', function (e) {
      var b = e.target.closest('[data-category]');
      if (!b || b.classList.contains('-current')) return;
      $$('.m-referencesSelect__item', list).forEach(function (x) {
        x.classList.toggle('-current', x === b);
        x.setAttribute('aria-pressed', String(x === b));
      });
      label.textContent = b.textContent;
      setOpen(false);
      setFilterParam(b.getAttribute('data-category'));
      hoverable = false;
      window.scrollTo(0, 0);
      raf(function () {
        applyCategory(b.getAttribute('data-category'));
        var status = $('[data-references-status]', refRoot);
        if (status) status.textContent = matches.length + ' project' + (matches.length === 1 ? '' : 's') + ' in ' + b.textContent + '.';
        raf(function () { enter(); hoverable = true; });
      });
    });

    // Hover: the hovered card grows, every other card dims.
    if (finePointer && !reduced) {
      var changeHover = function (index) {
        if (hovered === index) return;
        hovered = index;
        clearTimeout(hoverTimer);
        if (index === -1) {
          hoverTimer = setTimeout(function () {
            items.forEach(function (it) { it.classList.remove('-backside'); });
            unhoverTimer = setTimeout(function () { refRoot.classList.remove('-hoverable'); }, 700);
          }, 200);
        } else {
          clearTimeout(unhoverTimer);
          raf(function () {
            refRoot.classList.add('-hoverable');
            items.forEach(function (it, i) { it.classList.toggle('-backside', i !== index); });
          });
        }
      };
      var lastMove = 0;
      refRoot.addEventListener('mousemove', function (e) {
        if (e.timeStamp - lastMove < 30 || !hoverable) return;
        lastMove = e.timeStamp;
        if (e.target.closest('.js-nav')) { changeHover(-1); return; }
        var card = e.target.closest('[data-card]');
        changeHover(card ? items.indexOf(card) : -1);
      });
      refRoot.addEventListener('mouseleave', function () { changeHover(-1); });
    }

    lightbox(refRoot, function () { return matches; });
  }

  // Featured projects: every photo tile, in page order, is one lightbox set.
  var featRoot = $('[data-featured]');
  if (featRoot) lightbox(featRoot, function () { return $$('[data-card]', featRoot); });

  /* ------------------------------------------------------------------
     Lightbox (gallery + featured projects): focus trapped while open,
     Escape closes, arrow keys and swipe navigate, focus returns to the
     tile that opened it. getSet() returns the tiles currently in play.
     ------------------------------------------------------------------ */
  function lightbox(root, getSet) {
    var box = $('[data-lightbox]');
    if (!box) return;
    body.appendChild(box); // outside the page so the page can go inert
    var img = $('[data-lightbox-image]', box);
    var titleEl = $('[data-lightbox-title]', box);
    var countEl = $('[data-lightbox-count]', box);
    var header = $('.o-header');
    var sidemenu = $('[data-sidemenu]');
    var set = [];
    var index = 0;
    var opener = null;

    var show = function (i, animate) {
      index = (i + set.length) % set.length;
      var it = set[index];
      var btn = $('[data-open]', it);
      var apply = function () {
        img.src = btn.getAttribute('data-full');
        img.alt = btn.getAttribute('data-alt');
        titleEl.textContent = btn.getAttribute('data-title');
        countEl.textContent = (index + 1) + ' / ' + set.length;
        box.classList.remove('is-swapping');
      };
      if (animate && !reduced) {
        box.classList.add('is-swapping');
        setTimeout(apply, 180);
      } else {
        apply();
      }
    };

    var inertChrome = function (on) {
      if (page) page.inert = on;
      if (header) header.inert = on;
      if (sidemenu) sidemenu.inert = on;
    };

    var openBox = function (item) {
      set = getSet().slice();
      opener = $('[data-open]', item);
      show(set.indexOf(item), false);
      box.classList.add('is-open');
      box.setAttribute('aria-hidden', 'false');
      body.classList.add('is-locked');
      doc.style.overflow = 'hidden';
      inertChrome(true);
      setTimeout(function () { $('[data-lightbox-close]', box).focus(); }, 50);
    };

    var closeBox = function () {
      box.classList.remove('is-open');
      box.setAttribute('aria-hidden', 'true');
      body.classList.remove('is-locked');
      doc.style.overflow = '';
      inertChrome(false);
      if (opener) opener.focus({ preventScroll: true });
    };

    root.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-open]');
      if (btn) openBox(btn.closest('[data-card]'));
    });
    $('[data-lightbox-close]', box).addEventListener('click', closeBox);
    $('[data-lightbox-prev]', box).addEventListener('click', function () { show(index - 1, true); });
    $('[data-lightbox-next]', box).addEventListener('click', function () { show(index + 1, true); });
    box.addEventListener('click', function (e) {
      if (e.target === box || e.target.hasAttribute('data-lightbox-stage')) closeBox();
    });
    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeBox();
      else if (e.key === 'ArrowRight') show(index + 1, true);
      else if (e.key === 'ArrowLeft') show(index - 1, true);
      else if (e.key === 'Tab') {
        var focusables = $$('button', box);
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    var swipeX = null;
    box.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') swipeX = e.clientX; });
    box.addEventListener('pointerup', function (e) {
      if (swipeX === null) return;
      var dx = e.clientX - swipeX;
      swipeX = null;
      if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1), true);
    });
  }

  /* ------------------------------------------------------------------
     Forms: inline validation; never a fake success
     ------------------------------------------------------------------ */
  $$('form[data-validate]').forEach(function (form) {
    form.setAttribute('novalidate', 'novalidate');
    var status = $('[data-form-status]', form);
    var submitBtn = $('button[type="submit"]', form);
    var submitting = false;

    var wrapperFor = function (control) { return control.closest('.a-inputField'); };

    var messageFor = function (control) {
      var v = control.validity;
      var name = control.getAttribute('data-label') || 'This field';
      if (v.valueMissing) {
        if (control.type === 'checkbox') return 'Please tick this box to continue.';
        if (control.type === 'radio') return 'Please choose an option.';
        return name + ' is required.';
      }
      if (v.typeMismatch && control.type === 'email') return 'Enter a valid email address, for example name@example.com.';
      if (v.rangeUnderflow || v.rangeOverflow) return 'Enter a number in range.';
      if (v.badInput) return 'Enter a number.';
      return control.validationMessage || 'Please check this field.';
    };

    var setError = function (control, message) {
      var wrapper = wrapperFor(control);
      if (!wrapper) return;
      var errorEl = $('.a-inputField__error', wrapper);
      wrapper.classList.toggle('-error', Boolean(message));
      control.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (errorEl) errorEl.textContent = message || '';
    };

    var validate = function (control) {
      if (control.disabled || control.type === 'hidden') return true;
      var ok = control.checkValidity();
      setError(control, ok ? '' : messageFor(control));
      return ok;
    };

    $$('input, select, textarea', form).forEach(function (control) {
      var errorEl = wrapperFor(control) && $('.a-inputField__error', wrapperFor(control));
      if (errorEl && errorEl.id) {
        var ids = (control.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
        if (ids.indexOf(errorEl.id) === -1) ids.push(errorEl.id);
        control.setAttribute('aria-describedby', ids.join(' '));
      }
      control.addEventListener('blur', function () { if (control.type !== 'checkbox' && control.type !== 'radio') validate(control); });
      control.addEventListener('input', function () {
        var w = wrapperFor(control);
        if (w && w.classList.contains('-error')) validate(control);
      });
      control.addEventListener('change', function () {
        var w = wrapperFor(control);
        if (w && w.classList.contains('-error')) validate(control);
      });
    });

    var say = function (state, html) {
      if (!status) return;
      status.setAttribute('data-state', state);
      status.innerHTML = html;
    };

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (submitting) return;

      var firstInvalid = null;
      $$('input, select, textarea', form).forEach(function (control) {
        if (!validate(control) && !firstInvalid) firstInvalid = control;
      });
      if (firstInvalid) {
        say('error', 'Please correct the highlighted fields and try again.');
        firstInvalid.focus();
        return;
      }

      if (!FORM_ENDPOINT) {
        say('info',
          '<strong>This form is not connected yet.</strong><br>' +
          'Your details have <em>not</em> been sent. Please call ' +
          '<a href="' + PHONE_HREF + '">' + PHONE_DISPLAY + '</a> or email ' +
          '<a href="mailto:' + EMAIL + '">' + EMAIL + '</a> and we will pick it up straight away.');
        status.focus();
        return;
      }

      submitting = true;
      if (submitBtn) submitBtn.setAttribute('aria-disabled', 'true');
      say('info', 'Sending your request&hellip;');
      fetch(FORM_ENDPOINT, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) })
        .then(function (response) {
          if (!response.ok) throw new Error('Request failed: ' + response.status);
          form.reset();
          say('success', 'Thank you &mdash; your request has been sent. We will be in touch shortly.');
        })
        .catch(function () {
          say('error', 'Sorry, your request could not be sent. Please call ' +
            '<a href="' + PHONE_HREF + '">' + PHONE_DISPLAY + '</a> or email ' +
            '<a href="mailto:' + EMAIL + '">' + EMAIL + '</a>.');
        })
        .then(function () {
          submitting = false;
          if (submitBtn) submitBtn.removeAttribute('aria-disabled');
        });
    });
  });

  // The homepage footer hands its address over as ?email=.
  var prefill = $('[data-prefill-email]');
  if (prefill) {
    var m = /[?&]email=([^&]*)/.exec(location.search);
    if (m) {
      try { prefill.value = decodeURIComponent(m[1].replace(/\+/g, ' ')); } catch (e) {}
    }
  }

  // A product page links here as ?tank=<name>; acrylic cards add &kind=acrylic.
  (function () {
    var box = $('form textarea[name="message"]');
    var tank = /[?&]tank=([^&]*)/.exec(location.search);
    if (!box || !tank || box.value) return;
    var kind = /[?&]kind=acrylic/.test(location.search) ? 'Acrylic tank: ' : 'Glass tank: ';
    try { box.value = kind + decodeURIComponent(tank[1].replace(/\+/g, ' ')) + '\n'; } catch (e) {}
  })();

  /* ------------------------------------------------------------------
     Sound toggle for a muted background film (scratch-removal band).
     Autoplay only works muted, so sound starts off and is opt-in. Under
     reduced motion the lazy loader never ran, so the first press loads
     and plays it too.
     ------------------------------------------------------------------ */
  $$('[data-sound-toggle]').forEach(function (btn) {
    var video = $('video', btn.parentElement);
    btn.addEventListener('click', function () {
      video.muted = !video.muted;
      if (!video.muted) {
        if (!video.getAttribute('src')) video.src = video.getAttribute('data-lazy-src');
        play(video);
      }
      btn.setAttribute('aria-pressed', String(!video.muted));
      btn.classList.toggle('-on', !video.muted);
    });
  });

  /* ------------------------------------------------------------------
     Acrylic product photos: a swipeable, snap-scrolling track (works with
     no JS); the thumbnails scroll it and follow it.
     ------------------------------------------------------------------ */
  $$('[data-gallery]').forEach(function (g) {
    var stage = $('[data-gallery-stage]', g);
    var thumbs = $$('[data-gallery-to]', g);
    if (!thumbs.length) return;
    var mark = function (i) {
      thumbs.forEach(function (t, j) {
        t.classList.toggle('-active', i === j);
        t.setAttribute('aria-current', i === j ? 'true' : 'false');
      });
    };
    thumbs.forEach(function (t) {
      t.addEventListener('click', function () {
        var i = +t.getAttribute('data-gallery-to');
        stage.scrollTo({ left: stage.children[i].offsetLeft, behavior: reduced ? 'auto' : 'smooth' });
        mark(i);
      });
    });
    stage.addEventListener('scroll', function () {
      mark(Math.round(stage.scrollLeft / stage.clientWidth));
    }, { passive: true });
  });

  /* ------------------------------------------------------------------
     Scratch-removal film: the native controls stay in the markup for
     no-JS; with JS the big play button stands in until the first play.
     ------------------------------------------------------------------ */
  $$('[data-film]').forEach(function (film) {
    var video = $('video', film);
    video.controls = false;
    $('[data-film-play]', film).addEventListener('click', function () {
      film.classList.add('is-playing');
      video.controls = true;
      play(video);
      video.focus({ preventScroll: true });
    });
  });

  /* ------------------------------------------------------------------
     Tanks shop (glass + acrylic): range filter, sort, load more (12 at a
     time). The acrylic page has no sort, since it has no prices, and its
     grid counts "styles" (data-shop-noun).
     ------------------------------------------------------------------ */
  (function () {
    var shop = $('[data-shop]');
    if (!shop) return;
    var grid = $('[data-shop-grid]', shop);
    var cards = $$('[data-tank]', grid);
    var chips = $$('[data-shop-range]', shop);
    var rangeButtons = $$('[data-shop-range]'); // chips + range tiles + table rows
    var sortSelect = $('[data-shop-sort]', shop);
    var moreBtn = $('[data-shop-more]', shop);
    var countEl = $('[data-shop-count]', shop);
    var emptyEl = $('[data-shop-empty]', shop);
    var noun = grid.getAttribute('data-shop-noun') || 'tank';
    var STEP = +grid.getAttribute('data-shop-step') || 12; // acrylic: 24
    var state = { range: 'all', sort: 'featured', limit: STEP };
    cards.forEach(function (c, i) { c.setAttribute('data-order', i); });

    var params = new URL(location.href).searchParams;
    if (params.get('range')) state.range = params.get('range');
    if (params.get('sort')) state.sort = params.get('sort');

    var sorters = {
      'featured': function (a, b) { return a.dataset.order - b.dataset.order; },
      'price-asc': function (a, b) { return a.dataset.price - b.dataset.price; },
      'price-desc': function (a, b) { return b.dataset.price - a.dataset.price; },
      'gallons-asc': function (a, b) { return a.dataset.gallons - b.dataset.gallons; },
      'gallons-desc': function (a, b) { return b.dataset.gallons - a.dataset.gallons; },
      'name': function (a, b) { return a.dataset.name < b.dataset.name ? -1 : 1; }
    };

    var render = function () {
      var sorted = cards.slice().sort(sorters[state.sort] || sorters.featured);
      sorted.forEach(function (c) { grid.appendChild(c); });
      var matching = sorted.filter(function (c) { return state.range === 'all' || c.dataset.range === state.range; });
      sorted.forEach(function (c) { c.hidden = true; });
      matching.slice(0, state.limit).forEach(function (c) { c.hidden = false; });
      var shown = Math.min(state.limit, matching.length);
      moreBtn.hidden = shown >= matching.length;
      emptyEl.hidden = matching.length > 0;
      countEl.textContent = matching.length ? 'Showing ' + shown + ' of ' + matching.length + ' ' + noun + (matching.length === 1 ? '' : 's') : '';
      rangeButtons.forEach(function (b) {
        var on = b.getAttribute('data-shop-range') === state.range;
        b.classList.toggle('-active', on);
        if (b.hasAttribute('aria-pressed')) b.setAttribute('aria-pressed', String(on));
      });
      if (sortSelect && sortSelect.value !== state.sort) sortSelect.value = state.sort;
    };

    var remember = function () {
      try {
        var url = new URL(location.href);
        if (state.range === 'all') url.searchParams.delete('range'); else url.searchParams.set('range', state.range);
        if (state.sort === 'featured') url.searchParams.delete('sort'); else url.searchParams.set('sort', state.sort);
        history.replaceState(null, '', url);
      } catch (e) {}
    };

    rangeButtons.forEach(function (b) {
      b.addEventListener('click', function () {
        state.range = b.getAttribute('data-shop-range');
        state.limit = STEP;
        render();
        remember();
        // tiles and table rows live outside the catalogue: bring it into view
        if (!chips.some(function (c) { return c === b; })) {
          shop.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
        }
      });
    });
    if (sortSelect) sortSelect.addEventListener('change', function () {
      state.sort = sortSelect.value;
      render();
      remember();
    });
    moreBtn.addEventListener('click', function () {
      var firstNew = cards.filter(function (c) { return c.hidden && (state.range === 'all' || c.dataset.range === state.range); });
      state.limit += STEP;
      render();
      var sorted = cards.slice().sort(sorters[state.sort] || sorters.featured).filter(function (c) { return !c.hidden; });
      var focusTarget = sorted[state.limit - STEP];
      if (focusTarget && firstNew.length) { var l = $('a', focusTarget); if (l) l.focus({ preventScroll: true }); }
    });
    render();
  })();
})();
