/* =====================================================================================
   premium.js — vanilla behaviour layer for premium.css
   -------------------------------------------------------------------------------------
   No dependencies. No build step. Works from file://. ~10KB unminified.

   Design rules followed throughout:
     • CSS does the drawing; JS only ever writes custom properties or toggles a class.
     • Every pointer/scroll handler is rAF-throttled and reads geometry ONCE (on enter
       or on resize), never inside the move handler — no layout thrash.
     • Everything is opt-in via data-attributes, so nothing runs on pages that don't
       ask for it.
     • `prefers-reduced-motion: reduce` short-circuits all motion: reveals resolve
       instantly, tickers jump to their final value, marquees/typewriters stay static.
     • Progressive enhancement: the `pm-js` class is added at parse time, so the CSS
       hidden-state for reveals only exists when this file actually ran.

   Public API:
     Premium.init(root?)     — scan (or re-scan) a subtree and wire everything up
     Premium.refresh()       — re-measure marquees (call after fonts/images change)
     Premium.reveal(el)      — force-reveal an element
     Premium.reducedMotion   — boolean
   ===================================================================================== */

(function (global) {
  "use strict";

  /* --- run-immediately: mark the document so CSS can hide pre-reveal state --------- */
  var docEl = document.documentElement;
  docEl.classList.add("pm-js");

  var mqReduce = global.matchMedia
    ? global.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false, addEventListener: function () {} };

  var REDUCE = mqReduce.matches;

  /* --- tiny helpers ---------------------------------------------------------------- */
  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }
  function num(v, fallback) {
    var n = parseFloat(v);
    return isNaN(n) ? fallback : n;
  }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  /* rAF batching: many elements can queue writes in one frame, we flush once. */
  var writeQueue = [];
  var frameQueued = false;
  function schedule(fn) {
    writeQueue.push(fn);
    if (!frameQueued) {
      frameQueued = true;
      requestAnimationFrame(function () {
        frameQueued = false;
        var q = writeQueue;
        writeQueue = [];
        for (var i = 0; i < q.length; i++) q[i]();
      });
    }
  }

  /* Mark elements so init() is idempotent and can be called repeatedly.
     IMPORTANT: this must NOT write to the element's dataset. An earlier revision did
     (`el.dataset["pm" + key] = "1"`) and it silently overwrote the very attributes it
     was guarding — data-pm-ticker="42" became "1", data-pm-reveal="left" became "1".
     A per-key WeakSet is both faster and invisible to the DOM. */
  var initedSets = Object.create(null);
  function once(el, key) {
    var set = initedSets[key] || (initedSets[key] = new WeakSet());
    if (set.has(el)) return false;
    set.add(el);
    return true;
  }

  /* --- short-form attribute aliases -------------------------------------------------
     The library's own namespace is `data-pm-*` so it can never collide with a host
     page. For ergonomics the common ones also answer to the short names used in the
     docs (data-reveal, data-tilt, data-count-to …). We copy short → namespaced once,
     before anything reads attributes, so there is exactly one code path afterwards. */
  var ALIASES = {
    "data-reveal":      "data-pm-reveal",
    "data-delay":       "data-pm-delay",
    "data-stagger":     "data-pm-stagger",
    "data-tilt":        "data-pm-tilt",
    "data-magnetic":    "data-pm-magnetic",
    "data-spotlight":   "data-pm-spotlight",
    "data-count-to":    "data-pm-ticker",
    "data-decimals":    "data-pm-decimals",
    "data-suffix":      "data-pm-suffix",
    "data-prefix":      "data-pm-prefix",
    "data-typewriter":  "data-pm-typewriter",
    "data-scramble":    "data-pm-scramble",
    "data-split":       "data-pm-split",
    "data-parallax":    "data-pm-parallax",
    "data-marquee":     "data-pm-speed",
    "data-meteors":     "data-pm-meteors"
  };
  function normalizeAliases(root) {
    for (var short in ALIASES) {
      var target = ALIASES[short];
      $$("[" + short + "]", root).forEach(function (el) {
        if (!el.hasAttribute(target)) el.setAttribute(target, el.getAttribute(short));
      });
    }
  }

  /* =================================================================================
     1. SCROLL REVEALS  —  [data-pm-reveal]
     ---------------------------------------------------------------------------------
     One shared IntersectionObserver for the whole page (cheaper than one per element).
     `rootMargin` bottom -8% means the element commits slightly before it is fully in
     view, which feels responsive rather than late. Elements unobserve after firing,
     so long pages don't keep an ever-growing observer list.

     Optional:
       data-pm-delay="120"   extra ms before the transition starts
       data-pm-repeat        re-hide when it leaves the viewport (rarely a good idea)
     ================================================================================= */
  var revealObserver = null;

  function ensureRevealObserver() {
    if (revealObserver || !("IntersectionObserver" in global)) return revealObserver;
    revealObserver = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          var e = entries[i];
          if (e.isIntersecting) {
            e.target.classList.add("pm-in");
            if (!e.target.hasAttribute("data-pm-repeat")) revealObserver.unobserve(e.target);
          } else if (e.target.hasAttribute("data-pm-repeat")) {
            e.target.classList.remove("pm-in");
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    return revealObserver;
  }

  /* Safety sweep. IntersectionObserver only reports once the renderer produces a frame;
     a deep link (#section), a restored scroll position or a stalled/throttled renderer
     can therefore leave content that is already on screen still hidden. This pass
     reveals anything at or above the fold, reading ALL geometry before writing ANY
     class so it can't thrash layout. Cheap, runs at most a few times per page life. */
  function sweepReveals() {
    var els = $$("[data-pm-reveal]").filter(function (el) {
      return el.classList.contains("pm-in") === false;
    });
    if (!els.length) return;
    var vh = global.innerHeight || 800;
    var show = [];
    for (var i = 0; i < els.length; i++) {                 /* read phase */
      if (els[i].getBoundingClientRect().top < vh * 1.02) show.push(els[i]);
    }
    for (var j = 0; j < show.length; j++) show[j].classList.add("pm-in");  /* write phase */
  }

  /* --- one-shot "when this scrolls into view" helper --------------------------------
     Used by tickers, typewriters, scramblers and split lines. Same failsafe story as
     sweepReveals(): if the observer never delivers (deep link, restored scroll, a
     renderer that isn't producing frames) the queued callbacks still fire, so a counter
     never sits at 0 and a typewriter never stays blank. Callbacks are one-shot. */
  var pendingInView = [];

  function whenInView(el, fn, threshold) {
    var fired = false;
    function go() {
      if (fired) return;
      fired = true;
      fn();
    }
    if (REDUCE || !("IntersectionObserver" in global)) { go(); return; }
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { io.disconnect(); go(); }
    }, { threshold: threshold || 0.25 });
    io.observe(el);
    pendingInView.push({ el: el, io: io, go: go });
  }

  function sweepInView() {
    if (!pendingInView.length) return;
    var vh = global.innerHeight || 800;
    var due = [];
    for (var i = pendingInView.length - 1; i >= 0; i--) {        /* read phase */
      var r = pendingInView[i].el.getBoundingClientRect();
      if (r.top < vh * 1.02 && r.bottom > -vh * 0.5) due.push(pendingInView.splice(i, 1)[0]);
    }
    for (var j = 0; j < due.length; j++) {                        /* act phase */
      due[j].io.disconnect();
      due[j].go();
    }
  }

  function initReveals(root) {
    var els = $$("[data-pm-reveal]", root);
    var io = ensureRevealObserver();

    els.forEach(function (el) {
      if (!once(el, "Reveal")) return;
      var d = el.getAttribute("data-pm-delay");
      if (d) el.style.setProperty("--pm-reveal-delay", num(d, 0) + "ms");
      if (REDUCE || !io) { el.classList.add("pm-in"); return; }
      io.observe(el);
    });

    /* Stagger: write --pm-i on each child so CSS can compute the delay. Doing the maths
       in CSS (calc(var(--pm-i) * step)) keeps the step tunable per-section. */
    $$("[data-pm-stagger]", root).forEach(function (group) {
      if (!once(group, "Stagger")) return;
      var step = group.getAttribute("data-pm-stagger");
      if (step) group.style.setProperty("--pm-stagger-step", num(step, 60) + "ms");
      Array.prototype.forEach.call(group.children, function (child, i) {
        child.style.setProperty("--pm-i", i);
      });
    });
  }

  /* =================================================================================
     2. CURSOR SPOTLIGHT  —  [data-pm-spotlight]
     ---------------------------------------------------------------------------------
     Writes --pm-mx / --pm-my in pixels relative to the element. getBoundingClientRect()
     is called on pointerenter (and on resize), NEVER inside pointermove — that is the
     difference between 60fps and a jank festival on a grid of 12 cards.
     Uses pointer events so it covers mouse + pen, and `(hover: hover)` gates it off on
     touch where it would just flash on tap.
     ================================================================================= */
  var canHover = global.matchMedia ? global.matchMedia("(hover: hover)").matches : true;

  function initSpotlights(root) {
    if (!canHover) return;
    $$("[data-pm-spotlight]", root).forEach(function (el) {
      if (!once(el, "Spot")) return;
      var rect = null;

      el.addEventListener("pointerenter", function () {
        rect = el.getBoundingClientRect();
        el.classList.add("pm-spot-on");
      });
      el.addEventListener("pointerleave", function () {
        el.classList.remove("pm-spot-on");
      });
      el.addEventListener("pointermove", function (ev) {
        if (!rect) rect = el.getBoundingClientRect();
        var x = ev.clientX - rect.left;
        var y = ev.clientY - rect.top;
        schedule(function () {
          el.style.setProperty("--pm-mx", x + "px");
          el.style.setProperty("--pm-my", y + "px");
        });
      });
      global.addEventListener("resize", function () { rect = null; }, { passive: true });
    });
  }

  /* Page-level pointer glow: viewport coordinates on a single container. */
  function initCursorGlow(root) {
    if (!canHover || REDUCE) return;
    $$("[data-pm-cursor-glow]", root).forEach(function (el) {
      if (!once(el, "Glow")) return;
      el.classList.add("pm-cursor-glow");
      global.addEventListener(
        "pointermove",
        function (ev) {
          var x = ev.clientX, y = ev.clientY;
          schedule(function () {
            el.style.setProperty("--pm-px", x + "px");
            el.style.setProperty("--pm-py", y + "px");
          });
        },
        { passive: true }
      );
    });
  }

  /* =================================================================================
     3. 3D TILT  —  [data-pm-tilt]
     ---------------------------------------------------------------------------------
     Writes --pm-rx / --pm-ry (and --pm-mx/--pm-my for the glare layer). Max tilt is
     capped at 8deg by default; the `data-pm-tilt="12"` value overrides it. On leave we
     drop the "active" class so CSS swaps back to the slower easing and springs home.
     ================================================================================= */
  function initTilt(root) {
    if (!canHover || REDUCE) return;
    $$("[data-pm-tilt]", root).forEach(function (el) {
      if (!once(el, "Tilt")) return;
      var max = num(el.getAttribute("data-pm-tilt"), 8);
      var rect = null;

      el.addEventListener("pointerenter", function () {
        rect = el.getBoundingClientRect();
        el.classList.add("pm-tilt-active");
      });
      el.addEventListener("pointermove", function (ev) {
        if (!rect) rect = el.getBoundingClientRect();
        var px = (ev.clientX - rect.left) / rect.width;   /* 0..1 */
        var py = (ev.clientY - rect.top) / rect.height;
        var ry = (px - 0.5) * 2 * max;                    /* left/right => rotateY */
        var rx = (0.5 - py) * 2 * max;                    /* up/down    => rotateX */
        var mx = ev.clientX - rect.left;
        var my = ev.clientY - rect.top;
        schedule(function () {
          el.style.setProperty("--pm-ry", ry.toFixed(2) + "deg");
          el.style.setProperty("--pm-rx", rx.toFixed(2) + "deg");
          el.style.setProperty("--pm-mx", mx + "px");
          el.style.setProperty("--pm-my", my + "px");
        });
      });
      el.addEventListener("pointerleave", function () {
        el.classList.remove("pm-tilt-active");
        schedule(function () {
          el.style.setProperty("--pm-rx", "0deg");
          el.style.setProperty("--pm-ry", "0deg");
        });
      });
      global.addEventListener("resize", function () { rect = null; }, { passive: true });
    });
  }

  /* =================================================================================
     4. MAGNETIC BUTTONS  —  [data-pm-magnetic]
     ---------------------------------------------------------------------------------
     The element drifts toward the pointer by a fraction of the offset, capped so it
     never detaches from its hit area.
     ================================================================================= */
  function initMagnetic(root) {
    if (!canHover || REDUCE) return;
    $$("[data-pm-magnetic]", root).forEach(function (el) {
      if (!once(el, "Mag")) return;
      el.classList.add("pm-magnetic");
      var strength = num(el.getAttribute("data-pm-magnetic"), 0.28);
      var cap = 14;
      var rect = null;

      el.addEventListener("pointerenter", function () {
        rect = el.getBoundingClientRect();
        el.classList.add("pm-mag-active");
      });
      el.addEventListener("pointermove", function (ev) {
        if (!rect) rect = el.getBoundingClientRect();
        var dx = clamp((ev.clientX - (rect.left + rect.width / 2)) * strength, -cap, cap);
        var dy = clamp((ev.clientY - (rect.top + rect.height / 2)) * strength, -cap, cap);
        schedule(function () {
          el.style.setProperty("--pm-tx", dx.toFixed(1) + "px");
          el.style.setProperty("--pm-ty", dy.toFixed(1) + "px");
        });
      });
      el.addEventListener("pointerleave", function () {
        el.classList.remove("pm-mag-active");
        schedule(function () {
          el.style.setProperty("--pm-tx", "0px");
          el.style.setProperty("--pm-ty", "0px");
        });
      });
    });
  }

  /* =================================================================================
     5. NUMBER TICKERS  —  [data-pm-ticker="1284"]
     ---------------------------------------------------------------------------------
     Counts up when the element scrolls into view, once. Uses an expo-out ease so most
     of the distance is covered early and the last digits settle slowly — that "settle"
     is what makes it feel mechanical rather than linear.
     Formatting goes through Intl.NumberFormat so thousands separators are correct.

     Attributes: data-pm-ticker (target)  data-pm-decimals  data-pm-duration (ms)
                 data-pm-prefix  data-pm-suffix  data-pm-from

     Write the FINAL value as the element's text: <span data-count-to="12480" …>12,480+</span>.
     That string is what a no-JS visitor (and a crawler) sees; this function overwrites it
     with the start value only once it knows it can animate.
     ================================================================================= */
  var tickerStarted = new WeakSet();   /* module scope: the reduced-motion path calls
                                          runTicker() during the init loop itself */

  function initTickers(root) {
    var els = $$("[data-pm-ticker]", root);
    if (!els.length) return;

    els.forEach(function (el) {
      if (!once(el, "Ticker")) return;
      var decimals = num(el.getAttribute("data-pm-decimals"), 0);
      var from = num(el.getAttribute("data-pm-from"), 0);
      el.classList.add("pm-tnum");
      el.textContent = format(el, from, decimals);
      if (REDUCE) { runTicker(el, true); return; }
      whenInView(el, function () { runTicker(el); }, 0.35);
    });

    function format(el, value, decimals) {
      var str;
      try {
        str = new Intl.NumberFormat(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        }).format(value);
      } catch (err) {
        str = value.toFixed(decimals);
      }
      return (el.getAttribute("data-pm-prefix") || "") + str + (el.getAttribute("data-pm-suffix") || "");
    }

    function runTicker(el, instant) {
      if (tickerStarted.has(el)) return;
      tickerStarted.add(el);
      var target = num(el.getAttribute("data-pm-ticker"), 0);
      var decimals = num(el.getAttribute("data-pm-decimals"), 0);
      var from = num(el.getAttribute("data-pm-from"), 0);
      var dur = num(el.getAttribute("data-pm-duration"), 1900);

      if (instant) { el.textContent = format(el, target, decimals); return; }

      var start = null;
      var done = false;
      function finish() {
        if (done) return;
        done = true;
        el.textContent = format(el, target, decimals);
      }
      function step(ts) {
        if (done) return;
        if (start === null) start = ts;
        var t = clamp((ts - start) / dur, 0, 1);
        var eased = 1 - Math.pow(2, -10 * t);           /* expo-out */
        if (t === 1) eased = 1;
        el.textContent = format(el, from + (target - from) * eased, decimals);
        if (t < 1) requestAnimationFrame(step); else finish();
      }
      requestAnimationFrame(step);
      /* Watchdog: rAF is throttled to a standstill in background tabs and in headless
         renderers, which would leave the number frozen at its start value forever. If
         the frame loop hasn't finished by the time it should have, land on the target. */
      setTimeout(finish, dur + 400);
    }
  }

  /* =================================================================================
     6. TYPEWRITER  —  [data-pm-typewriter='["build", "ship", "scale"]']
     ---------------------------------------------------------------------------------
     Types, holds, deletes, moves to the next word. Deleting is ~2.2x faster than typing
     because that matches how people read it. Reduced motion => the first word, static.
     ================================================================================= */
  function initTypewriter(root) {
    $$("[data-pm-typewriter]", root).forEach(function (el) {
      if (!once(el, "Type")) return;
      var words;
      try { words = JSON.parse(el.getAttribute("data-pm-typewriter")); }
      catch (e) { words = String(el.getAttribute("data-pm-typewriter")).split("|"); }
      if (!words || !words.length) return;

      el.classList.add("pm-caret");
      if (REDUCE) { el.textContent = words[0]; return; }

      var typeMs = num(el.getAttribute("data-pm-type-speed"), 62);
      var holdMs = num(el.getAttribute("data-pm-hold"), 1500);
      var w = 0, i = 0, deleting = false, running = false;

      /* Only start once visible — an off-screen typewriter is pure wasted timer churn.
         (It keeps running after that; stopping mid-word looks broken.) */
      whenInView(el, function () { running = true; tick(); }, 0.1);

      function tick() {
        if (!running) return;
        var word = words[w % words.length];
        i += deleting ? -1 : 1;
        el.textContent = word.slice(0, i);
        var delay = deleting ? typeMs / 2.2 : typeMs;

        if (!deleting && i >= word.length) { deleting = true; delay = holdMs; }
        else if (deleting && i <= 0) { deleting = false; w++; delay = 220; }
        setTimeout(tick, delay);
      }
    });
  }

    /* =================================================================================
     6b. SCRAMBLE / DECODE  —  [data-pm-scramble]
     ---------------------------------------------------------------------------------
     The "decrypting" reveal (Aceternity's Encrypted Text, hover.dev's scramble). Each
     character locks in from left to right; everything to the right of the lock point
     keeps rolling through a glyph set. Two details make it read as *decode* rather than
     *random noise*: (1) spaces never scramble, so the word shape is visible the whole
     time, and (2) it locks strictly left-to-right, so the eye always has a solved
     prefix to hold on to.

     Attributes: data-pm-scramble        (optional target text; defaults to textContent)
                 data-pm-scramble-speed  (ms per frame, default 34)
                 data-pm-scramble-hover  (also re-run on hover)
     ================================================================================= */
  var SCRAMBLE_GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@$?/\\<>*+=-";

  function initScramble(root) {
    $$("[data-pm-scramble]", root).forEach(function (el) {
      if (!once(el, "Scramble")) return;

      var target = el.getAttribute("data-pm-scramble");
      if (!target || target === "true") target = el.textContent.trim();
      el.setAttribute("aria-label", target);
      el.classList.add("pm-scramble");
      el.textContent = target;              /* graceful base state */

      var speed = num(el.getAttribute("data-pm-scramble-speed"), 34);
      var running = false;
      if (REDUCE) return;

      function run() {
        if (running) return;
        running = true;
        var frame = 0;
        var lead = Math.max(4, Math.round(target.length * 0.35));  /* noise runway */
        var timer = setInterval(function () {
          var locked = frame - lead;
          var out = "";
          for (var i = 0; i < target.length; i++) {
            var ch = target.charAt(i);
            if (ch === " " || i < locked) out += ch;
            else out += SCRAMBLE_GLYPHS.charAt((Math.random() * SCRAMBLE_GLYPHS.length) | 0);
          }
          el.textContent = out;
          frame++;
          if (locked >= target.length) {
            clearInterval(timer);
            el.textContent = target;
            running = false;
          }
        }, speed);
      }

      /* Runs once when it scrolls into view; optionally again on hover. */
      whenInView(el, run, 0.3);

      if (el.hasAttribute("data-pm-scramble-hover")) {
        el.addEventListener("pointerenter", run);
      }
    });
  }

  /* =================================================================================
     7. CHARACTER / WORD SPLIT  —  [data-pm-split] · [data-pm-split="words"]
     ---------------------------------------------------------------------------------
     Wraps every character (or word) in a <span> carrying --pm-i so CSS can cascade the
     entrance. Keeps the original text in aria-label and hides the spans from AT, so
     screen readers get one clean string instead of 42 letters.

     Word mode is the one you want for a headline or a paragraph — per-character on a
     long line is the most common way this effect gets used badly. The spans only start
     once `.pm-in` lands, so a split headline below the fold still plays on scroll.
     ================================================================================= */
  function initSplit(root) {
    $$("[data-pm-split]", root).forEach(function (el) {
      if (!once(el, "Split")) return;
      var text = el.textContent.replace(/\s+/g, " ").trim();
      var mode = (el.getAttribute("data-pm-split") || "chars").toLowerCase();
      el.setAttribute("aria-label", text);
      if (REDUCE) return;

      var pieces = mode === "words" ? text.split(" ") : text.split("");
      var frag = document.createDocumentFragment();

      for (var c = 0; c < pieces.length; c++) {
        var span = document.createElement("span");
        span.setAttribute("aria-hidden", "true");
        span.style.setProperty("--pm-i", c);
        span.textContent = pieces[c] === " " ? " " : pieces[c];
        frag.appendChild(span);
        if (mode === "words" && c < pieces.length - 1) {
          frag.appendChild(document.createTextNode(" "));
        }
      }
      el.textContent = "";
      el.classList.add("pm-chars");
      if (mode === "words") el.classList.add("pm-chars--words");
      el.appendChild(frag);

      /* Play on scroll-in rather than on load. */
      if (!el.hasAttribute("data-pm-reveal")) {
        whenInView(el, function () { el.classList.add("pm-in"); }, 0.2);
      }
    });
  }

/* =================================================================================
     8. MARQUEE  —  .pm-marquee > .pm-marquee__track
     ---------------------------------------------------------------------------------
     CSS runs the animation; JS only (a) duplicates the track so the loop is seamless
     and (b) derives the duration from the measured track width so every marquee on the
     page scrolls at the SAME pixel speed regardless of content length. Hard-coding a
     duration is why most marquees look wrong next to each other.

     Attributes: data-pm-speed="60"  (pixels per second, default 55)
     ================================================================================= */
  var marquees = [];

  function initMarquee(root) {
    $$(".pm-marquee", root).forEach(function (el) {
      if (!once(el, "Marquee")) return;
      var track = el.querySelector(".pm-marquee__track");
      if (!track) return;

      /* Clone once for the seamless wrap; the clone is decorative. */
      var clone = track.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      el.appendChild(clone);
      marquees.push(el);
      measureMarquee(el);
    });
  }

  function measureMarquee(el) {
    var track = el.querySelector(".pm-marquee__track");
    if (!track) return;
    var speed = num(el.getAttribute("data-pm-speed"), 55);       /* px per second */
    var vertical = el.classList.contains("pm-marquee--v");
    var size = vertical ? track.scrollHeight : track.scrollWidth;
    if (!size) return;
    var dur = Math.max(6, size / speed);
    el.style.setProperty("--pm-marquee-dur", dur.toFixed(2) + "s");
  }

  function refreshMarquees() { marquees.forEach(measureMarquee); }

  /* =================================================================================
     9. PARALLAX  —  [data-pm-parallax="0.15"]
     ---------------------------------------------------------------------------------
     Translate only, computed from the element's distance from viewport centre. One
     shared scroll listener, one rAF, all elements updated together. Elements outside
     the viewport are skipped.
     ================================================================================= */
  var parallaxItems = [];

  function initParallax(root) {
    $$("[data-pm-parallax]", root).forEach(function (el) {
      if (!once(el, "Par")) return;
      el.classList.add("pm-parallax");
      parallaxItems.push({ el: el, k: num(el.getAttribute("data-pm-parallax"), 0.12) });
    });
    if (parallaxItems.length && !REDUCE) startScrollLoop();
  }

  /* =================================================================================
     10. STICKY SCROLL STEPS  —  [data-pm-steps] with .pm-step children
     ---------------------------------------------------------------------------------
     Marks the step nearest the viewport middle as active and mirrors its index onto the
     container as data-pm-active, so a sticky panel can react with pure CSS selectors.
     ================================================================================= */
  var stepGroups = [];

  function initSteps(root) {
    $$("[data-pm-steps]", root).forEach(function (el) {
      if (!once(el, "Steps")) return;
      stepGroups.push(el);
    });
    if (stepGroups.length) startScrollLoop();
  }

  function updateSteps() {
    var mid = global.innerHeight * 0.45;
    stepGroups.forEach(function (group) {
      var steps = $$(".pm-step", group);
      var best = -1, bestDist = Infinity;
      steps.forEach(function (s, i) {
        var r = s.getBoundingClientRect();
        var d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      steps.forEach(function (s, i) { s.classList.toggle("pm-step-active", i === best); });
      if (group.getAttribute("data-pm-active") !== String(best)) {
        group.setAttribute("data-pm-active", best);
      }
    });
  }

  /* =================================================================================
     11. SCROLL PROGRESS FALLBACK  —  [data-pm-progress]
     ---------------------------------------------------------------------------------
     Browsers with `animation-timeline: scroll()` do this off-thread with no JS at all
     (see premium.css §12); we only run when that's unsupported.
     ================================================================================= */
  var progressEls = [];
  var supportsScrollTimeline =
    global.CSS && CSS.supports && CSS.supports("animation-timeline: scroll()");

  function initProgress(root) {
    if (supportsScrollTimeline) return;
    $$("[data-pm-progress]", root).forEach(function (el) {
      if (!once(el, "Prog")) return;
      progressEls.push(el);
    });
    if (progressEls.length) startScrollLoop();
  }

  function updateProgress() {
    var h = document.documentElement.scrollHeight - global.innerHeight;
    var p = h > 0 ? clamp(global.scrollY / h, 0, 1) : 0;
    progressEls.forEach(function (el) { el.style.setProperty("--pm-progress", p.toFixed(4)); });
  }

  /* --- one shared, rAF-throttled scroll loop for parallax / steps / progress -------- */
  var scrollLoopRunning = false;
  var scrollTicking = false;

  function startScrollLoop() {
    if (scrollLoopRunning) return;
    scrollLoopRunning = true;
    global.addEventListener("scroll", onScroll, { passive: true });
    global.addEventListener("resize", onScroll, { passive: true });
    onScroll();
  }

  function onScroll() {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(function () {
      scrollTicking = false;
      if (!REDUCE && parallaxItems.length) {
        var vh = global.innerHeight;
        parallaxItems.forEach(function (item) {
          var r = item.el.getBoundingClientRect();
          if (r.bottom < -200 || r.top > vh + 200) return;   /* skip off-screen work */
          var centre = r.top + r.height / 2 - vh / 2;
          item.el.style.setProperty("--pm-par", (-centre * item.k).toFixed(1) + "px");
        });
      }
      if (stepGroups.length) updateSteps();
      if (progressEls.length) updateProgress();
    });
  }

  /* =================================================================================
     12. DECORATIVE GENERATORS — meteors / ripple rings / orbit dots
     ---------------------------------------------------------------------------------
     Purely visual DOM that would be noise in the HTML source. All skipped under
     reduced motion.
     ================================================================================= */
  function initDecor(root) {
    $$("[data-pm-meteors]", root).forEach(function (el) {
      if (!once(el, "Meteors")) return;
      if (REDUCE) return;
      var count = num(el.getAttribute("data-pm-meteors"), 14);
      var layer = document.createElement("div");
      layer.className = "pm-meteors";
      layer.setAttribute("aria-hidden", "true");
      for (var i = 0; i < count; i++) {
        var m = document.createElement("span");
        m.className = "pm-meteor";
        m.style.left = (Math.random() * 130 - 15).toFixed(2) + "%";
        m.style.setProperty("--pm-meteor-delay", (Math.random() * 8).toFixed(2) + "s");
        m.style.setProperty("--pm-meteor-dur", (4 + Math.random() * 7).toFixed(2) + "s");
        layer.appendChild(m);
      }
      el.appendChild(layer);
    });

    $$("[data-pm-ripple]", root).forEach(function (el) {
      if (!once(el, "Ripple")) return;
      var count = num(el.getAttribute("data-pm-ripple"), 5);
      el.classList.add("pm-ripple");
      for (var i = 0; i < count; i++) {
        var ring = document.createElement("span");
        ring.className = "pm-ripple__ring";
        ring.setAttribute("aria-hidden", "true");
        var size = 120 + i * 86;
        ring.style.width = size + "px";
        ring.style.height = size + "px";
        ring.style.setProperty("--pm-i", i);
        ring.style.opacity = (1 - i / (count + 1)).toFixed(2);
        el.appendChild(ring);
      }
    });

    /* Tap ripple — [data-pm-tap]. One <span> per click, positioned at the pointer,
       removed on animationend so the DOM never accumulates. Sized to the element's
       diagonal so the ink always reaches every corner. */
    $$("[data-pm-tap]", root).forEach(function (el) {
      if (!once(el, "Tap")) return;
      el.classList.add("pm-tap");
      el.addEventListener("pointerdown", function (ev) {
        if (REDUCE) return;
        var rect = el.getBoundingClientRect();
        var d = Math.hypot(rect.width, rect.height) * 2;
        var ink = document.createElement("span");
        ink.className = "pm-tap__ink";
        ink.setAttribute("aria-hidden", "true");
        ink.style.width = ink.style.height = d + "px";
        ink.style.left = (ev.clientX - rect.left - d / 2) + "px";
        ink.style.top = (ev.clientY - rect.top - d / 2) + "px";
        el.appendChild(ink);
        ink.addEventListener("animationend", function () { ink.remove(); });
      });
    });

    /* Checkmark draw — [data-pm-check]. CSS owns the stroke animation; all we do is
       add .pm-in when it enters the viewport (same contract as a reveal). */
    $$("[data-pm-check]", root).forEach(function (el) {
      if (!once(el, "Check")) return;
      whenInView(el, function () { el.classList.add("pm-in"); }, 0.5);
    });
  }

  /* =================================================================================
     13. INIT
     ================================================================================= */
  function init(root) {
    root = root || document;
    normalizeAliases(root);
    initReveals(root);
    initSpotlights(root);
    initCursorGlow(root);
    initTilt(root);
    initMagnetic(root);
    initTickers(root);
    initTypewriter(root);
    initScramble(root);
    initSplit(root);
    initMarquee(root);
    initParallax(root);
    initSteps(root);
    initProgress(root);
    initDecor(root);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { init(document); });
  } else {
    init(document);
  }

  /* Re-measure marquees once webfonts/images settle, and make sure nothing that is
     already on screen is still sitting in its hidden pre-reveal state. */
  global.addEventListener("load", function () {
    refreshMarquees();
    sweepReveals();
    sweepInView();
    setTimeout(function () { sweepReveals(); sweepInView(); }, 400);
  });
  global.addEventListener("hashchange", function () {
    setTimeout(function () { sweepReveals(); sweepInView(); }, 60);
  });
  if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
    document.fonts.ready.then(refreshMarquees);
  }
  var rt;
  global.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(refreshMarquees, 180);
  }, { passive: true });

  /* React live to a reduced-motion preference change without a reload. */
  if (mqReduce.addEventListener) {
    mqReduce.addEventListener("change", function (e) {
      REDUCE = e.matches;
      if (REDUCE) $$("[data-pm-reveal]").forEach(function (el) { el.classList.add("pm-in"); });
    });
  }

  global.Premium = {
    init: init,
    scramble: initScramble,
    refresh: refreshMarquees,
    reveal: function (el) { el.classList.add("pm-in"); },
    get reducedMotion() { return REDUCE; }
  };
})(window);
