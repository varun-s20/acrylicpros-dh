/* =====================================================================
   Acrylic Pros — homepage behaviour
   Motion values reproduce aquatic-show.com (anime.js easings are mapped
   to their cubic-bezier equivalents and played with the Web Animations API).
   ===================================================================== */
(function () {
  'use strict';

  var doc = document.documentElement;
  var body = document.body;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (any-pointer: fine)').matches;
  var touch = window.matchMedia('(hover: none)').matches;

  var EASE_QUINT = 'cubic-bezier(.22, 1, .36, 1)';    // anime easeOutQuint
  var EASE_EXPO = 'cubic-bezier(.19, 1, .22, 1)';     // anime easeOutExpo
  var EASE_CUBIC = 'cubic-bezier(.215, .61, .355, 1)'; // anime easeOutCubic
  var EASE_IN_OUT_QUAD = 'cubic-bezier(.455, .03, .515, .955)';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }
  function raf(fn) { return window.requestAnimationFrame(fn); }

  /* ------------------------------------------------------------------
     Smooth scroll (Lenis, Locomotive v5 defaults)
     ------------------------------------------------------------------ */
  var lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 2, anchors: true });
    raf(function loop(time) { lenis.raf(time); raf(loop); });
  }

  /* ------------------------------------------------------------------
     Media sources (kept out of the HTML so reduced motion never loads them)
     ------------------------------------------------------------------ */
  var heroVideo = $('[data-hero] video[data-autoplay], [data-page-hero] video[data-autoplay]');
  if (heroVideo) {
    var portrait = window.matchMedia('(orientation: portrait)').matches;
    if (portrait) heroVideo.poster = heroVideo.getAttribute('data-poster-mobile');
    if (reduced) {
      heroVideo.removeAttribute('autoplay');
    } else {
      heroVideo.src = heroVideo.getAttribute(portrait ? 'data-src-mobile' : 'data-src-desktop');
    }
  }
  if (reduced) {
    $$('video[autoplay]').forEach(function (v) { v.removeAttribute('autoplay'); v.pause(); });
  }

  /* ------------------------------------------------------------------
     Scroll-driven state: hero zoom (--progress) and side rail direction
     ------------------------------------------------------------------ */
  var hero = $('[data-hero]');
  var sidemenu = $('[data-sidemenu]');
  var heroHeight = hero ? hero.offsetHeight : 1;
  var lastY = window.scrollY;
  var ticking = false;
  var menuOpen = false;

  function onScroll() {
    ticking = false;
    var y = window.scrollY;
    if (hero && !reduced) {
      hero.style.setProperty('--progress', clamp(y / heroHeight, 0, 1).toFixed(4));
    }
    if (sidemenu && !menuOpen && y !== lastY) {
      var max = Math.max(doc.scrollHeight - window.innerHeight, 1);
      var hidden = y > lastY && y / max > 0.01;
      sidemenu.classList.toggle('-isHidden', hidden);
    }
    lastY = y;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; raf(onScroll); }
  }, { passive: true });

  /* ------------------------------------------------------------------
     In-view classes (Locomotive data-scroll / data-scroll-offset)
     ------------------------------------------------------------------ */
  function rootMarginFor(el) {
    var offset = el.getAttribute('data-scroll-offset');
    if (!offset) return '-1px';
    var parts = offset.split(',').map(function (p) { return parseFloat(p) || 0; });
    // "start, end": in view once the top passes (100 - start)% of the
    // viewport, until the bottom passes end% from the top.
    return '-' + parts[1] + '% 0px -' + parts[0] + '% 0px';
  }

  var darkCount = 0;
  $$('[data-scroll]').forEach(function (el) {
    if (el === hero) return; // the intro reveals the hero
    var dark = el.hasAttribute('data-dark-ui');
    var wasIn = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) el.classList.add('is-inview');
        if (dark && entry.isIntersecting !== wasIn) {
          wasIn = entry.isIntersecting;
          darkCount += wasIn ? 1 : -1;
          raf(function () { body.classList.toggle('-dark', darkCount > 0); });
        }
        if (!dark && entry.isIntersecting) io.disconnect();
      });
    }, { rootMargin: rootMarginFor(el) });
    io.observe(el);
  });

  // Background videos only play while on screen.
  if (!reduced) {
    var videoIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var v = entry.target;
        if (entry.isIntersecting) { var p = v.play(); if (p) p.catch(function () {}); } else v.pause();
      });
    });
    $$('video[data-inview-play]').forEach(function (v) { videoIO.observe(v); });
  }

  // Lazy background image fades in once decoded.
  $$('img[data-fade]').forEach(function (img) {
    function done() { img.classList.add('-loaded'); }
    if (img.complete && img.naturalWidth) done(); else img.addEventListener('load', done);
  });

  /* ------------------------------------------------------------------
     Hero title: split into lines, rise with a 100ms expo stagger
     ------------------------------------------------------------------ */
  function expoOut(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

  function titleReveal() {
    var el = $('[data-title]');
    if (!el) return;
    if (reduced) { el.style.opacity = 1; return; }

    var original = el.innerHTML;
    el.style.height = el.getBoundingClientRect().height + 'px';

    var words = [];
    (function walk(node, strong) {
      Array.prototype.forEach.call(node.childNodes, function (child) {
        if (child.nodeType === 3) {
          child.textContent.split(/\s+/).forEach(function (w) { if (w) words.push({ text: w, strong: strong }); });
        } else if (child.nodeName === 'BR') {
          words.push({ br: true });
        } else {
          walk(child, strong || child.nodeName === 'STRONG');
        }
      });
    })(el, false);

    // Their Title module gives up on phones when a word is too long to split cleanly.
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

  /* ------------------------------------------------------------------
     Intro: loader wipe (2.5s easeOutCubic) + hero reveals, together
     ------------------------------------------------------------------ */
  var loader = $('[data-loader]');
  var introStarted = false;

  function finishLoading() { doc.classList.remove('is-loading'); }

  function intro() {
    if (introStarted) return;
    introStarted = true;
    if (hero) hero.classList.add('is-inview');
    titleReveal();
    if (!loader) { finishLoading(); return; }
    if (reduced || !loader.animate) {
      loader.remove();
      finishLoading();
      return;
    }
    var wipe = loader.animate(
      [{ transform: 'translateY(-100%)' }, { transform: 'translateY(0%)' }],
      { duration: 2500, easing: EASE_CUBIC, fill: 'forwards' }
    );
    wipe.onfinish = function () { loader.remove(); finishLoading(); };
  }

  if (loader && !reduced) {
    var loaderVideo = $('video', loader);
    var start = function () {
      if (loaderVideo.readyState >= 1) intro();
      else {
        loaderVideo.addEventListener('loadedmetadata', intro, { once: true });
        setTimeout(intro, 1500);
      }
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    setTimeout(intro, 4000); // never hold the page behind a white screen
  } else {
    intro();
  }

  /* ------------------------------------------------------------------
     "+" read-more accordions
     ------------------------------------------------------------------ */
  $$('[data-more]').forEach(function (box) {
    var btn = $('[data-more-btn]', box);
    var panel = $('[data-more-panel]', box);
    if (!btn || !panel) return;
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      var h = panel.firstElementChild.scrollHeight;
      panel.style.setProperty('--heightscroll', h + 'px');
      if (panel.hasAttribute('data-auto-duration')) {
        panel.style.setProperty('--atransition', clamp(h / 600, 0.7, 3) + 's');
      }
      btn.setAttribute('aria-expanded', String(open));
      panel.setAttribute('aria-hidden', String(!open));
    });
  });

  /* ------------------------------------------------------------------
     Menu: the page shrinks into a rounded card and slides away
     ------------------------------------------------------------------ */
  var menu = $('[data-menu]');
  var burger = $('[data-burger]');
  var page = $('[data-page]');
  var scroller = $('[data-scroller]');

  if (menu && burger && page && scroller) {
    var nav = $('[data-menu-nav]', menu);
    var links = $$('[data-menu-link]', menu);
    var secondary = $$('[data-menu-secondary]', menu);
    var cards = $$('[data-menu-card]', menu);
    var smoke = $('.o-menu__smoke video', menu);
    var rects = $$('rect', burger);
    var savedY = 0;
    var pageAnim = null;
    var mediaLoaded = false;
    var closeTimer = null;
    var timeline = [];
    var burgerTimeline = [];

    var MS = 1000;
    var quint = { duration: MS, easing: EASE_QUINT, fill: 'both' };
    var withTail = { duration: MS, endDelay: MS, easing: EASE_QUINT, fill: 'both' };

    if (!reduced) {
      timeline.push(nav.animate([{ transform: 'translateY(50%)' }, { transform: 'translateY(0)' }], withTail));
      links.forEach(function (l) {
        timeline.push(l.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], withTail));
      });
      secondary.forEach(function (l) {
        timeline.push(l.animate(
          [{ transform: 'translateY(100%)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }],
          { duration: MS, delay: MS, easing: EASE_QUINT, fill: 'both' }
        ));
      });

      var half = { easing: EASE_QUINT };
      burgerTimeline.push(rects[0].animate([
        Object.assign({ transform: 'translateY(0) rotate(0deg)' }, half),
        Object.assign({ transform: 'translateY(3px) rotate(0deg)', offset: 0.5 }, half),
        { transform: 'translateY(3px) rotate(45deg)' }
      ], { duration: 750, fill: 'both' }));
      burgerTimeline.push(rects[2].animate([
        Object.assign({ transform: 'translateY(0) rotate(0deg)' }, half),
        Object.assign({ transform: 'translateY(-3px) rotate(0deg)', offset: 0.5 }, half),
        { transform: 'translateY(-3px) rotate(-45deg)' }
      ], { duration: 750, fill: 'both' }));
      burgerTimeline.push(rects[1].animate(
        [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-45deg)' }],
        { duration: 375, delay: 375, easing: EASE_QUINT, fill: 'both' }
      ));
      timeline.concat(burgerTimeline).forEach(function (a) { a.pause(); });
    } else {
      // No motion: final states only.
      links.concat(secondary).concat([nav]).forEach(function (el) {
        el.style.transform = 'none';
        el.style.opacity = 1;
      });
    }

    var play = function (anims, forward) {
      anims.forEach(function (a) {
        if ((a.playbackRate > 0) !== forward) a.reverse();
        else a.play();
      });
    };

    var loadMenuMedia = function () {
      if (mediaLoaded || reduced) return;
      mediaLoaded = true;
      $$('video[data-src]', menu).forEach(function (v) {
        if (v === smoke || finePointer) v.src = v.getAttribute('data-src');
      });
    };

    var setInert = function (on) {
      page.inert = on;
      if (sidemenu) sidemenu.inert = on;
    };

    var openMenu = function () {
      if (menuOpen) return;
      menuOpen = true;
      clearTimeout(closeTimer);
      loadMenuMedia();
      savedY = window.scrollY;

      if (lenis) lenis.stop();
      body.style.overflow = 'hidden';
      doc.classList.remove('menu-closing');
      doc.classList.add('menu-open');

      page.classList.add('-cropped');
      scroller.style.transform = 'translateY(' + -savedY + 'px)';

      menu.setAttribute('aria-hidden', 'false');
      burger.setAttribute('aria-expanded', 'true');
      setInert(true);

      if (!reduced) {
        var from = pageAnim ? currentPageFrame() : { transform: 'translateY(0) scale(1)', borderRadius: '0px' };
        if (pageAnim) pageAnim.cancel();
        pageAnim = page.animate(
          [from, { transform: 'translateY(100%) scale(' + 1222 / 1440 + ')', borderRadius: '3.2rem' }],
          { duration: MS, easing: EASE_QUINT, fill: 'forwards' }
        );
        play(timeline, true);
        play(burgerTimeline, true);
        if (smoke) { var p = smoke.play(); if (p) p.catch(function () {}); }
      } else {
        page.style.visibility = 'hidden';
      }

      setTimeout(function () { if (menuOpen && sidemenu) sidemenu.classList.add('-isHidden'); }, 500);
      setTimeout(function () { if (menuOpen && links[0]) links[0].focus({ preventScroll: true }); }, 50);
    };

    var currentPageFrame = function () {
      var cs = getComputedStyle(page);
      return { transform: cs.transform === 'none' ? 'translateY(0) scale(1)' : cs.transform, borderRadius: cs.borderTopLeftRadius };
    };

    var restorePage = function () {
      page.classList.remove('-cropped');
      scroller.style.transform = '';
      page.style.visibility = '';
      if (pageAnim) { pageAnim.cancel(); pageAnim = null; }
      body.style.overflow = '';
      doc.classList.remove('menu-closing');
      if (lenis) {
        lenis.start();
        lenis.resize();
        lenis.scrollTo(savedY, { immediate: true, force: true });
      }
      window.scrollTo(0, savedY);
      if (smoke) smoke.pause();
    };

    var closeMenu = function () {
      if (!menuOpen) return;
      menuOpen = false;
      doc.classList.remove('menu-open');
      doc.classList.add('menu-closing');
      menu.setAttribute('aria-hidden', 'true');
      burger.setAttribute('aria-expanded', 'false');
      setInert(false);
      if (sidemenu) sidemenu.classList.remove('-isHidden');

      if (reduced) { restorePage(); return; }

      play(timeline, false);
      play(burgerTimeline, false);
      var from = currentPageFrame();
      if (pageAnim) pageAnim.cancel();
      pageAnim = page.animate(
        [from, { transform: 'translateY(0) scale(1)', borderRadius: '0px' }],
        { duration: MS, easing: EASE_QUINT, fill: 'forwards' }
      );
      pageAnim.onfinish = function () { if (!menuOpen) restorePage(); };
      // The reversed timeline runs 2s; keep the menu painted until it has.
      closeTimer = setTimeout(function () { if (!menuOpen) doc.classList.remove('menu-closing'); }, 2 * MS);
    };

    burger.addEventListener('click', function () { if (menuOpen) closeMenu(); else openMenu(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuOpen) { closeMenu(); burger.focus(); }
    });

    // Hover cards: swing in from the right of the links, out to the left.
    if (finePointer) {
      links.forEach(function (link, i) {
        var card = cards[i];
        if (!card) return;
        var video = $('video', card);
        link.addEventListener('mouseenter', function () {
          card.getAnimations().forEach(function (a) { a.cancel(); });
          card.animate([
            { opacity: 0, transform: 'scale(.8) translateY(-25%) translateX(-125%) rotate(6deg)' },
            { opacity: 1, transform: 'scale(1) translateY(-50%) translateX(-150%) rotate(-6deg)' }
          ], { duration: 500, easing: EASE_CUBIC, fill: 'forwards' });
          if (video && video.src) { var p = video.play(); if (p) p.catch(function () {}); }
        });
        link.addEventListener('mouseleave', function () {
          var cs = getComputedStyle(card);
          var from = { opacity: cs.opacity, transform: cs.transform };
          card.getAnimations().forEach(function (a) { a.cancel(); });
          var out = card.animate([
            from,
            { opacity: 0, transform: 'scale(.8) translateY(-25%) translateX(-225%) rotate(-12deg)' }
          ], { duration: 500, easing: EASE_CUBIC, fill: 'forwards' });
          out.onfinish = function () { if (video) video.pause(); };
        });
      });
    }
  }

  /* ------------------------------------------------------------------
     Slider (Embla-like: 1:1 drag, exponential settle, trimmed snaps)
     ------------------------------------------------------------------ */
  function Slider(root) {
    var viewport = $('[data-slider-viewport]', root);
    var track = $('[data-slider-track]', root);
    var dotsBox = $('[data-slider-dots]', root);
    var prevBtn = $('[data-slider-prev]', root);
    var nextBtn = $('[data-slider-next]', root);
    var loop = root.hasAttribute('data-loop');
    var slides = [];
    var snaps = [];
    var dots = [];
    var slideW = 0;
    var total = 0;
    var minPos = 0;
    var baseLeft = 0;
    var pos = 0;
    var target = 0;
    var running = false;
    var last = 0;
    var dragging = false;
    var drag = null;
    var suppressClick = false;
    var api = {};

    function visible() {
      return Array.prototype.filter.call(track.children, function (s) { return !s.classList.contains('-hidden'); });
    }

    function measure() {
      track.style.transform = 'translate3d(0,0,0)';
      slides.forEach(function (s) { s.style.transform = ''; });
      slides = visible();
      slideW = slides.length ? slides[0].offsetWidth : 0;
      total = slides.reduce(function (sum, s) { return sum + s.offsetWidth; }, 0);
      baseLeft = track.getBoundingClientRect().left - viewport.getBoundingClientRect().left;
      if (loop) {
        snaps = slides.map(function (s) { return -s.offsetLeft; });
        minPos = -Infinity;
      } else {
        var max = Math.max(0, total - track.clientWidth);
        var seen = {};
        snaps = [];
        slides.forEach(function (s) {
          var v = -Math.min(s.offsetLeft, max);
          var key = Math.round(v);
          if (!seen[key]) { seen[key] = true; snaps.push(v); }
        });
        minPos = -max;
      }
      buildDots();
      render();
    }

    function buildDots() {
      if (!dotsBox) return;
      dotsBox.textContent = '';
      dots = snaps.map(function (_, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'm-slider__dot';
        b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        b.addEventListener('click', function () { goTo(i); });
        dotsBox.appendChild(b);
        return b;
      });
      dotsBox.hidden = snaps.length < 2;
    }

    function wrap(v) { return ((v % total) + total) % total; }

    function nearestIndex(p) {
      var best = 0;
      var bestD = Infinity;
      snaps.forEach(function (s, i) {
        var d = loop ? Math.abs(wrap(s - p + total / 2) - total / 2) : Math.abs(s - p);
        if (d < bestD) { bestD = d; best = i; }
      });
      return best;
    }

    function selected() { return nearestIndex(target); }

    function updateDots() {
      var idx = selected();
      dots.forEach(function (d, i) {
        d.classList.toggle('-active', i === idx);
        if (i === idx) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
      });
    }

    function render() {
      track.style.transform = 'translate3d(' + pos.toFixed(2) + 'px,0,0)';
      var vw = viewport.clientWidth;
      slides.forEach(function (s) {
        var shift = 0;
        if (loop && total) {
          var x = s.offsetLeft + pos;
          shift = wrap(x + total / 2 - slideW / 2) - (total / 2 - slideW / 2) - x;
          s.style.transform = shift ? 'translate3d(' + shift + 'px,0,0)' : '';
        }
        var left = baseLeft + s.offsetLeft + pos + shift;
        var w = s.offsetWidth;
        var seen = Math.max(0, Math.min(left + w, vw) - Math.max(left, 0));
        s.classList.toggle('-inView', w > 0 && seen / w >= 0.5);
      });
    }

    function tick(now) {
      var dt = last ? Math.min(now - last, 64) : 16;
      last = now;
      if (!dragging) {
        pos += (target - pos) * (1 - Math.exp(-dt * 0.013));
        if (Math.abs(target - pos) < 0.5) {
          pos = target;
          running = false;
          if (loop && total) { // renormalise without a visual jump
            var k = Math.round(pos / total) * total;
            pos -= k; target -= k;
          }
        }
      }
      render();
      if (running) raf(tick); else last = 0;
    }

    function kick() { if (!running) { running = true; raf(tick); } }

    function goTo(i) {
      if (!snaps.length) return;
      if (loop) {
        var n = snaps.length;
        var cur = selected();
        var steps = ((i - cur) % n + n) % n;
        if (steps > n / 2) steps -= n;
        target = target - steps * slideW;
      } else {
        target = snaps[clamp(i, 0, snaps.length - 1)];
      }
      updateDots();
      kick();
    }

    function step(dir) {
      if (loop) { target -= dir * slideW; updateDots(); kick(); }
      else goTo(selected() + dir);
    }

    // --- dragging
    viewport.addEventListener('dragstart', function (e) { e.preventDefault(); });
    viewport.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || !snaps.length) return;
      dragging = true;
      drag = { x: e.clientX, y: e.clientY, pos: pos, target: target, lastX: e.clientX, lastT: e.timeStamp, v: 0, moved: false, startIndex: selected(), locked: e.pointerType !== 'touch' };
      if (api.onDragStart) api.onDragStart();
      kick();
    });
    window.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - drag.x;
      if (!drag.locked) {
        var dy = e.clientY - drag.y;
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        if (Math.abs(dy) > Math.abs(dx)) { endDrag(); return; }
        drag.locked = true;
      }
      if (Math.abs(dx) > 5 && !drag.moved) {
        drag.moved = true;
        viewport.classList.add('-dragging');
      }
      var p = drag.pos + dx;
      if (!loop) { // resistance past the ends
        if (p > 0) p *= 0.5;
        else if (p < minPos) p = minPos + (p - minPos) * 0.5;
      }
      pos = p;
      var dt = Math.max(e.timeStamp - drag.lastT, 1);
      drag.v = (e.clientX - drag.lastX) / dt;
      drag.lastX = e.clientX;
      drag.lastT = e.timeStamp;
    }, { passive: true });

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      viewport.classList.remove('-dragging');
      var moved = pos - drag.pos;
      var projected = moved + drag.v * 120;
      // skipSnaps: false — a drag moves at most one snap.
      var dir = Math.abs(moved) > 20 || Math.abs(projected) > slideW / 2 ? (projected < 0 ? 1 : -1) : 0;
      if (loop) {
        target = drag.target - dir * slideW;
      } else {
        target = snaps[clamp(drag.startIndex + dir, 0, snaps.length - 1)];
      }
      suppressClick = drag.moved;
      updateDots();
      kick();
      if (api.onDragEnd) api.onDragEnd();
    }
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    viewport.addEventListener('click', function (e) {
      if (suppressClick) { e.preventDefault(); e.stopPropagation(); suppressClick = false; }
    }, true);

    // Keyboard focus brings the slide into view; overflow containers must not scroll natively.
    track.addEventListener('focusin', function (e) {
      var slide = e.target.closest('.m-slider__slide');
      var i = slides.indexOf(slide);
      if (i < 0) return;
      var vw = viewport.clientWidth;
      var left = baseLeft + slide.offsetLeft + target;
      if (left < 0 || left + slide.offsetWidth > vw + 1) goTo(loop ? i : nearestIndex(-slide.offsetLeft));
    });
    [viewport, root, root.parentNode, root.closest('section')].forEach(function (el) {
      if (el) el.addEventListener('scroll', function () { el.scrollLeft = 0; });
    });

    if (prevBtn) prevBtn.addEventListener('click', function () { step(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { step(1); });

    api.reset = function () { pos = target = 0; measure(); updateDots(); };
    api.measure = function () {
      var idx = selected();
      measure();
      pos = target = loop ? -idx * slideW : snaps[clamp(idx, 0, snaps.length - 1)] || 0;
      updateDots();
      render();
    };
    api.isDragging = function () { return dragging && drag && drag.moved; };

    measure();
    updateDots();
    return api;
  }

  var sliders = [];
  $$('[data-slider]').forEach(function (root) { sliders.push({ root: root, api: new Slider(root) }); });
  function sliderFor(name) {
    var hit = sliders.filter(function (s) { return s.root.getAttribute('data-slider') === name; })[0];
    return hit || null;
  }

  /* ------------------------------------------------------------------
     Services: drag cursor, hover videos, category filter
     ------------------------------------------------------------------ */
  var products = sliderFor('products');
  if (products) {
    var pRoot = products.root;
    var pViewport = $('[data-slider-viewport]', pRoot);
    var dragger = $('[data-dragger]', pRoot);
    var hoverable = true;
    var currentCard = null;

    var setVideo = function (card, on) {
      var video = $('video[data-src]', card);
      if (!video) return;
      var fig = video.parentNode;
      raf(function () {
        fig.classList.toggle('-hover', on);
        if (on) {
          if (!video.getAttribute('src')) {
            video.src = video.getAttribute('data-src');
            video.addEventListener('loadeddata', function () {
              if (fig.classList.contains('-hover')) video.play().catch(function () {});
            });
          } else {
            var p = video.play(); if (p) p.catch(function () {});
          }
        } else {
          video.pause();
        }
      });
    };
    var leaveCard = function () { if (currentCard) { setVideo(currentCard, false); currentCard = null; } };

    products.api.onDragStart = function () { hoverable = false; leaveCard(); };
    products.api.onDragEnd = function () { hoverable = true; };

    if (finePointer && !reduced) {
      pRoot.addEventListener('mouseover', function (e) {
        var card = e.target.closest ? e.target.closest('[data-products]') : null;
        if (!card || !hoverable) { leaveCard(); return; }
        if (card !== currentCard) { leaveCard(); currentCard = card; setVideo(card, true); }
      });
      pRoot.addEventListener('mouseleave', leaveCard);
    }

    if (finePointer && dragger) {
      var lastMove = 0;
      var follow = function (e) {
        var r = pRoot.getBoundingClientRect();
        var x = e.clientX - r.left - 35;
        var y = e.clientY - r.top - 35;
        raf(function () { dragger.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) scale(var(--scale))'; });
      };
      pViewport.addEventListener('mousemove', function (e) {
        if (e.timeStamp - lastMove < 40) return; // their 40ms throttle
        lastMove = e.timeStamp;
        follow(e);
      });
      pViewport.addEventListener('mouseenter', function (e) {
        follow(e);
        raf(function () { pRoot.classList.add('-hover'); });
      });
      pViewport.addEventListener('mouseleave', function () { raf(function () { pRoot.classList.remove('-hover'); }); });
    }

    var cat = $('[data-cat]');
    if (cat) {
      var buttons = $$('[data-cat-list] button', cat);
      var select = $('[data-cat-select]', cat);
      var filterRun = 0;

      var markActive = function (value) {
        buttons.forEach(function (b) {
          var on = b.getAttribute('data-value') === value;
          b.classList.toggle('-active', on);
          b.setAttribute('aria-pressed', String(on));
        });
      };

      var applyFilter = function (value) {
        $$('[data-slider-track] > li', pRoot).forEach(function (li) {
          li.classList.toggle('-hidden', value !== 'all' && li.getAttribute('data-cat') !== value);
        });
        products.api.reset();
      };

      var filter = function (value) {
        var run = ++filterRun;
        if (reduced || !pRoot.animate) { applyFilter(value); return; }
        pRoot.getAnimations().forEach(function (a) { a.cancel(); });
        var out = pRoot.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, easing: EASE_IN_OUT_QUAD, fill: 'forwards' });
        out.onfinish = function () {
          if (run !== filterRun) return;
          applyFilter(value);
          out.cancel();
          pRoot.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: EASE_IN_OUT_QUAD });
        };
      };

      $('[data-cat-list]', cat).addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (!b || b.classList.contains('-active')) return;
        var value = b.getAttribute('data-value');
        filter(value);
        raf(function () {
          cat.style.setProperty('--offset', b.getAttribute('data-index'));
          cat.style.setProperty('--color', b.getAttribute('data-color'));
          markActive(value);
          select.value = value;
        });
      });
      select.addEventListener('change', function () {
        markActive(select.value);
        var b = buttons.filter(function (x) { return x.getAttribute('data-value') === select.value; })[0];
        if (b) {
          cat.style.setProperty('--offset', b.getAttribute('data-index'));
          cat.style.setProperty('--color', b.getAttribute('data-color'));
        }
        filter(select.value);
      });
    }
  }

  /* ------------------------------------------------------------------
     Client marquee: 60px/s leftwards, only while on screen
     ------------------------------------------------------------------ */
  var marquee = $('[data-marquee]');
  if (marquee) {
    var mTrack = $('[data-marquee-track]', marquee);
    var originals = Array.prototype.slice.call(mTrack.children);
    var setWidth = 0;
    var mx = 0;
    var mActive = false;
    var mLast = 0;
    var cloned = false;

    var setupMarquee = function () {
      mTrack.style.transform = '';
      setWidth = originals.reduce(function (sum, li) {
        var cs = getComputedStyle(li);
        return sum + li.offsetWidth + parseFloat(cs.marginRight);
      }, 0);
      var playable = setWidth > marquee.clientWidth && !reduced;
      marquee.classList.toggle('-disabled', !playable);
      if (playable && !cloned) {
        cloned = true;
        [1, 2].forEach(function () {
          originals.forEach(function (li) {
            var c = li.cloneNode(true);
            c.setAttribute('aria-hidden', 'true');
            $$('a', c).forEach(function (a) { a.tabIndex = -1; });
            mTrack.appendChild(c);
          });
        });
      }
      return playable;
    };

    var mLoop = function (now) {
      if (!mActive) { mLast = 0; return; }
      var dt = mLast ? Math.min(now - mLast, 64) : 16;
      mLast = now;
      mx -= dt * 0.06;
      if (-mx >= setWidth) mx += setWidth;
      mTrack.style.transform = 'matrix(1,0,0,1,' + mx.toFixed(2) + ',0)';
      raf(mLoop);
    };

    if (setupMarquee()) {
      new IntersectionObserver(function (entries) {
        var on = entries[0].isIntersecting;
        if (on && !mActive) { mActive = true; raf(mLoop); }
        mActive = on;
      }).observe(marquee);
    }
  }

  /* ------------------------------------------------------------------
     Video band: YouTube (nocookie) plays inline on demand
     ------------------------------------------------------------------ */
  var ytBoxes = $$('[data-yt]');
  // Only one player at a time: stopping = dropping the iframe.
  function stopVideos(except) {
    ytBoxes.forEach(function (other) {
      if (other === except) return;
      other.classList.remove('-playing');
      var m = $('[data-yt-mount]', other);
      if (m) m.innerHTML = '';
    });
  }
  // Moving the videos slider stops whatever is playing in it.
  $$('.o-homeNews [data-slider-prev], .o-homeNews [data-slider-next], .o-homeNews [data-slider-dots]').forEach(function (el) {
    el.addEventListener('click', function () { stopVideos(null); });
  });
  ytBoxes.forEach(function (box) {
    var btn = $('[data-yt-play]', box);
    var mount = $('[data-yt-mount]', box);
    btn.addEventListener('click', function () {
      stopVideos(box);
      box.classList.add('-playing');
      if (mount.firstChild) return;
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(box.getAttribute('data-yt')) +
        '?autoplay=1&modestbranding=1&rel=0&playsinline=1';
      f.title = box.getAttribute('data-yt-title') || 'Video';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      f.setAttribute('data-lenis-prevent', '');
      mount.appendChild(f);
      f.focus();
    });
  });

  /* ------------------------------------------------------------------
     Ambient YouTube band: muted, looping, no controls; loads when near
     the viewport and pauses when off screen
     ------------------------------------------------------------------ */
  $$('[data-yt-ambient]').forEach(function (box) {
    var id = box.getAttribute('data-yt-ambient');
    var mount = $('[data-yt-ambient-mount]', box);
    if (reduced) {
      // no motion wanted: a still frame from the same video instead
      var still = document.createElement('img');
      still.src = 'assets/images/video-thumbs/' + id + '.jpg';
      still.alt = '';
      still.className = 'b-video__still';
      box.appendChild(still);
      return;
    }
    var frame = document.createElement('iframe');
    var send = function (func) {
      if (frame.contentWindow) {
        frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func: func, args: [] }), '*');
      }
    };
    frame.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) +
      '?autoplay=1&mute=1&loop=1&playlist=' + encodeURIComponent(id) +
      '&controls=0&disablekb=1&fs=0&modestbranding=1&playsinline=1&rel=0&iv_load_policy=3&enablejsapi=1' +
      '&origin=' + encodeURIComponent(location.origin);
    frame.title = box.getAttribute('aria-label') || 'Video';
    frame.allow = 'autoplay; encrypted-media';
    frame.tabIndex = -1;
    // Reveal only once the player reports "playing", so YouTube's own
    // thumbnail and spinner are never seen: the band goes straight to motion.
    window.addEventListener('message', function (e) {
      if (e.source !== frame.contentWindow || typeof e.data !== 'string') return;
      var data;
      try { data = JSON.parse(e.data); } catch (err) { return; }
      var state = data.event === 'onStateChange' ? data.info
        : (data.info && typeof data.info.playerState === 'number' ? data.info.playerState : null);
      if (state === 1) box.classList.add('-ready');
      if (state === 0) send('playVideo'); // belt and braces for the loop
    });
    frame.addEventListener('load', function () {
      frame.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 'ambient' }), '*');
      send('mute');
      send('playVideo');
    });
    mount.appendChild(frame);
    // keep it running whenever it is on screen
    new IntersectionObserver(function (entries) {
      send(entries[0].isIntersecting ? 'playVideo' : 'pauseVideo');
    }).observe(box);
  });

  /* ------------------------------------------------------------------
     Chat with the Pros: WhatsApp / text message to the owner's phone
     ------------------------------------------------------------------ */
  var chat = $('[data-chat]');
  if (chat) {
    var PHONE = '15625660150';
    var toggle = $('[data-chat-toggle]', chat);
    var chatPanel = $('[data-chat-panel]', chat);
    var nudge = $('[data-chat-nudge]', chat);
    var msg = $('[data-chat-message]', chat);
    var hint = $('[data-chat-hint]', chat);
    var topic = '';
    var setOpen = function (open) {
      chatPanel.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      if (open) {
        nudge.hidden = true;
        try { sessionStorage.setItem('ap:chat-seen', '1'); } catch (e) {}
        setTimeout(function () { msg.focus(); }, 50);
      }
    };
    toggle.addEventListener('click', function () { setOpen(chatPanel.hidden); });
    $('[data-chat-close]', chat).addEventListener('click', function () { setOpen(false); toggle.focus(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !chatPanel.hidden) { setOpen(false); toggle.focus(); }
    });
    $$('[data-chat-topic]', chat).forEach(function (b) {
      b.addEventListener('click', function () {
        topic = b.getAttribute('data-chat-topic');
        $$('[data-chat-topic]', chat).forEach(function (o) { o.classList.toggle('-active', o === b); });
        if (!msg.value.trim()) msg.value = 'Hi Acrylic Pros, I have a question about ' + topic.toLowerCase() + ': ';
        hint.hidden = true;
        msg.focus();
      });
    });
    var via = 'whatsapp';
    $$('[data-chat-via]', chat).forEach(function (b) {
      b.addEventListener('click', function () { via = b.getAttribute('data-chat-via'); });
    });
    $('[data-chat-form]', chat).addEventListener('submit', function (e) {
      e.preventDefault();
      var text = msg.value.trim();
      if (!text) { hint.hidden = false; msg.focus(); return; }
      text += '\n\n(Sent from ' + location.href + ')';
      if (via === 'whatsapp') {
        window.open('https://wa.me/' + PHONE + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
      } else {
        var sep = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) ? '&' : '?';
        location.href = 'sms:+' + PHONE + sep + 'body=' + encodeURIComponent(text);
      }
    });
    var seen = false;
    try { seen = sessionStorage.getItem('ap:chat-seen') === '1'; } catch (e) {}
    if (!seen && !reduced) {
      setTimeout(function () { if (chatPanel.hidden) nudge.hidden = false; }, 6000);
      setTimeout(function () { nudge.hidden = true; }, 16000);
    }
  }

  /* ------------------------------------------------------------------
     Resize (their Website module debounces 600ms)
     ------------------------------------------------------------------ */
  var resizeTimer = null;
  var lastWidth = window.innerWidth;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      heroHeight = hero ? hero.offsetHeight : 1;
      if (window.innerWidth === lastWidth) return; // mobile URL-bar resizes
      lastWidth = window.innerWidth;
      sliders.forEach(function (s) { s.api.measure(); });
    }, 600);
  });
})();
