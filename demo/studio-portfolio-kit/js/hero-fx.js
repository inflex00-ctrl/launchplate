/* =========================================================================
   MERIDIAN — hero-fx.js
   Three small enhancements for the hero. Vanilla JS, no dependencies.
   -------------------------------------------------------------------------
     1. Cursor spotlight over the hero artwork (pointer devices only)
     2. Scroll parallax on the artwork — two layers, two rates
     3. Count-up on the three studio figures

   All three are strictly additive. The composition, the headline reveal and
   the artwork assembly are pure CSS, so with scripting off the hero still
   plays in full; these only add what genuinely needs a pointer, a scroll
   position or a timer. Nothing here hides anything, ever.

   Under `prefers-reduced-motion: reduce` the file does nothing at all: the
   markup already carries the final figures and CSS pins everything still.
   ========================================================================= */

(function () {
  "use strict";

  var hero = document.querySelector(".mfx");
  var art = document.querySelector(".mfx-art");

  var reduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* One shared rAF slot: every writer coalesces into the next frame, so a
     fast pointer or a fast scroll can never queue up work. */
  var frame = null;
  var pending = [];
  function schedule(fn) {
    pending.push(fn);
    if (frame) return;
    frame = requestAnimationFrame(function () {
      frame = null;
      var jobs = pending;
      pending = [];
      for (var i = 0; i < jobs.length; i++) jobs[i]();
    });
  }

  /* ----------------------------------------------------------------------
     1. CURSOR SPOTLIGHT
     Only for real pointers — on touch there is no cursor to follow, and the
     `hover: hover` query is the reliable way to ask.
     ---------------------------------------------------------------------- */
  if (art && !reduced && window.matchMedia &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches) {

    var rect = null;

    art.addEventListener("pointerenter", function () {
      rect = art.getBoundingClientRect();
      art.classList.add("is-spot");
    });

    art.addEventListener("pointerleave", function () {
      art.classList.remove("is-spot");
    });

    art.addEventListener("pointermove", function (ev) {
      if (!rect) rect = art.getBoundingClientRect();
      var x = ((ev.clientX - rect.left) / rect.width) * 100;
      var y = ((ev.clientY - rect.top) / rect.height) * 100;
      schedule(function () {
        art.style.setProperty("--mfx-mx", x.toFixed(2) + "%");
        art.style.setProperty("--mfx-my", y.toFixed(2) + "%");
      });
    }, { passive: true });

    window.addEventListener("resize", function () { rect = null; }, { passive: true });
    window.addEventListener("scroll", function () { rect = null; }, { passive: true });
  }

  /* ----------------------------------------------------------------------
     2. PARALLAX
     Written to the `translate` property (via two custom properties) rather
     than `transform`, so it composes with the keyframed assembly and the
     endless drift instead of overwriting them. Travel is deliberately tiny:
     the field has 6% of overscan, and staying well inside it means the crop
     can never reveal an edge.
     ---------------------------------------------------------------------- */
  if (art && !reduced) {
    var field = art.querySelector(".art__field");
    var parts = art.querySelector(".mfx-art__parts");
    var ticking = false;

    function updateParallax() {
      ticking = false;
      var r = art.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;

      /* Off-screen? Nothing to do. */
      if (r.bottom < -200 || r.top > vh + 200) return;

      /* -1 .. 1, zero when the artwork's centre sits at the viewport centre */
      var progress = (r.top + r.height / 2 - vh / 2) / vh;
      if (progress < -1.4) progress = -1.4;
      if (progress > 1.4) progress = 1.4;

      var a = (progress * 26).toFixed(1) + "px";     /* background: slower  */
      var b = (progress * -14).toFixed(1) + "px";    /* rules: opposite way */

      if (field) art.style.setProperty("--mfx-par-a", a);
      if (parts) art.style.setProperty("--mfx-par-b", b);
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      schedule(updateParallax);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();
  }

  /* ----------------------------------------------------------------------
     3. COUNT-UP ON THE STUDIO FIGURES
     The markup already contains 11 / 68 / 91. This only replays the last
     stretch of each number; if anything throws, the originals go straight
     back in.
     ---------------------------------------------------------------------- */
  if (!hero || reduced) return;

  var counters = Array.prototype.slice.call(
    hero.querySelectorAll("[data-mfx-count]")
  );
  if (!counters.length) return;

  var model = counters.map(function (el) {
    return {
      el: el,
      target: parseInt(el.getAttribute("data-mfx-count"), 10),
      final: el.textContent
    };
  });

  function restore() {
    model.forEach(function (m) { m.el.textContent = m.final; });
  }

  function easeOutExpo(t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); }

  function run() {
    var start = null;
    var DUR = 1400;
    /* Begin at 40% of the figure rather than 0 — a studio page that flashes
       "0 years independent" undoes the credibility the number is there for. */
    var FROM = 0.4;
    function step(now) {
      if (start === null) start = now;
      var t = Math.min((now - start) / DUR, 1);
      var e = FROM + (1 - FROM) * easeOutExpo(t);
      for (var i = 0; i < model.length; i++) {
        model[i].el.textContent = String(Math.round(model[i].target * e));
      }
      if (t < 1) requestAnimationFrame(step);
      else restore();
    }
    requestAnimationFrame(step);
  }

  try {
    window.setTimeout(function () {
      try { run(); } catch (e) { restore(); }
    }, 780);
  } catch (e) {
    restore();
  }

  /* Watchdog — a wedged count must never be left showing a stale figure. */
  window.setTimeout(function () {
    for (var i = 0; i < model.length; i++) {
      if (model[i].el.textContent !== model[i].final) { restore(); return; }
    }
  }, 3600);
})();
