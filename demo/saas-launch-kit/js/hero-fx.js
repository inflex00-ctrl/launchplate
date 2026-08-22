/* ==========================================================================
   NORTHWIND — hero-fx.js
   Live behaviour for the hero dashboard. Vanilla JS, no dependencies.
   --------------------------------------------------------------------------
   This file is PURELY additive. Every number it animates already exists as
   real text in index.html, so with scripting disabled the hero still shows a
   complete, correct dashboard — this only makes the numbers move.

     1. Count-up on the three headline metrics
     2. A slow "live" drift so the panel feels connected to something
     3. prefers-reduced-motion: bail out entirely, markup values stand

   Guard rails
     · Everything is inside try/catch; on any failure the final values are
       written straight back so the panel can never be left mid-count.
     · Nothing here adds or removes a class that controls visibility.
   ========================================================================== */

(function () {
  "use strict";

  var hero = document.querySelector(".hfx");
  if (!hero) return;

  var reduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var nodes = Array.prototype.slice.call(
    hero.querySelectorAll("[data-hfx-count]")
  );
  if (!nodes.length) return;

  /* ----------------------------------------------------------------------
     Model — read everything out of the markup once, so the DOM text stays
     the single source of truth.
     ---------------------------------------------------------------------- */
  var stats = nodes.map(function (el) {
    return {
      el: el,
      card: el.closest(".mock__stat") || el.parentNode,
      target: parseFloat(el.getAttribute("data-hfx-count")),
      decimals: parseInt(el.getAttribute("data-hfx-decimals") || "0", 10),
      prefix: el.getAttribute("data-hfx-prefix") || "",
      suffix: el.getAttribute("data-hfx-suffix") || "",
      /* How far this metric is allowed to wander while "live". 0 = frozen. */
      drift: parseFloat(el.getAttribute("data-hfx-drift") || "0"),
      final: el.textContent,
      shown: null
    };
  });

  function render(s, value) {
    var v = s.decimals > 0 ? value.toFixed(s.decimals) : String(Math.round(value));
    if (v === s.shown) return;
    s.shown = v;
    s.el.textContent = s.prefix + v + s.suffix;
  }

  function restoreAll() {
    stats.forEach(function (s) {
      s.el.textContent = s.final;
    });
  }

  /* Reduced motion: the markup is already correct. Do nothing at all. */
  if (reduced) return;

  /* ----------------------------------------------------------------------
     1. COUNT-UP
     Eased with an expo-out curve so it decelerates into the real number
     instead of stopping dead. Driven by rAF against a timestamp, so a
     backgrounded tab resumes at the right place rather than fast-forwarding.
     ---------------------------------------------------------------------- */
  var COUNT_MS = 1500;
  var COUNT_DELAY = 700;
  var COUNT_FROM = 0.55;

  function easeOutExpo(t) {
    return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function countUp(done) {
    var start = null;
    function frame(now) {
      if (start === null) start = now;
      var t = Math.min((now - start) / COUNT_MS, 1);
      /* Start at 55% of the real figure, not 0 — a dashboard that momentarily
         reads "0 accounts / $0.0M" looks broken rather than loading. */
      var e = COUNT_FROM + (1 - COUNT_FROM) * easeOutExpo(t);
      for (var i = 0; i < stats.length; i++) render(stats[i], stats[i].target * e);
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        restoreAll();
        stats.forEach(function (s) { s.shown = null; });
        if (done) done();
      }
    }
    requestAnimationFrame(frame);
  }

  /* ----------------------------------------------------------------------
     2. LIVE DRIFT
     Every few seconds one eligible metric slides to a nearby value and the
     card flashes. Small, infrequent and never applied to the currency figure
     — a dollar total that jitters reads as broken, not live.
     ---------------------------------------------------------------------- */
  var DRIFT_EVERY = 5200;
  var driftTimer = null;

  function tweenTo(s, to, ms, done) {
    var from = parseFloat(s.el.textContent.replace(/[^0-9.\-]/g, ""));
    if (isNaN(from)) from = s.target;
    var start = null;
    function frame(now) {
      if (start === null) start = now;
      var t = Math.min((now - start) / ms, 1);
      render(s, from + (to - from) * easeOutExpo(t));
      if (t < 1) requestAnimationFrame(frame);
      else if (done) done();
    }
    requestAnimationFrame(frame);
  }

  function flash(card) {
    if (!card || !card.classList) return;
    card.classList.remove("is-ticking");
    /* Force a reflow read so the animation can restart on a repeat hit. */
    void card.offsetWidth;
    card.classList.add("is-ticking");
    window.setTimeout(function () {
      card.classList.remove("is-ticking");
    }, 700);
  }

  var driftable = stats.filter(function (s) { return s.drift > 0; });
  var driftIndex = 0;

  function driftOnce() {
    if (document.hidden || !driftable.length) return;
    var s = driftable[driftIndex % driftable.length];
    driftIndex++;
    var step = Math.random() < 0.5 ? -s.drift : s.drift;
    var to = Math.max(0, s.target + step);
    flash(s.card);
    tweenTo(s, to, 520, function () {
      /* Settle back to the headline figure a beat later. */
      window.setTimeout(function () {
        tweenTo(s, s.target, 900);
      }, 2100);
    });
  }

  function startDrift() {
    if (driftTimer) return;
    driftTimer = window.setInterval(driftOnce, DRIFT_EVERY);
  }

  /* Stop burning frames when the tab is hidden. */
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && driftTimer) {
      window.clearInterval(driftTimer);
      driftTimer = null;
    } else if (!document.hidden) {
      startDrift();
    }
  });

  /* ----------------------------------------------------------------------
     Kick off.
     ---------------------------------------------------------------------- */
  try {
    window.setTimeout(function () {
      try {
        countUp(startDrift);
      } catch (e) {
        restoreAll();
      }
    }, COUNT_DELAY);
  } catch (e) {
    restoreAll();
  }

  /* Watchdog — if anything above wedged, the real numbers go back in. */
  window.setTimeout(function () {
    var unresolved = stats.some(function (s) {
      return s.el.textContent.trim() === "" || s.el.textContent === "0";
    });
    if (unresolved) restoreAll();
  }, 4000);
})();
