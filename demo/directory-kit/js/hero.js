/* ==========================================================================
   STACKLIST — hero.js
   Three behaviours for the home-page hero. Vanilla, no dependencies, and
   safe to delete — the hero is complete without it.

     1. A placeholder that types real example queries into the search bar
     2. Counters that run up to the live numbers in js/data.js
     3. A watchdog that forces the hero visible if anything above fails

   THE CONTRACT WITH css/hero.css
   css/hero.css only hides things when <html> carries `sl-js`, which a
   two-line inline script in the page <head> adds. So with JavaScript off the
   hero renders complete and static: the search form still submits, the
   counters show their final values in the markup, and the placeholder is the
   one written in the HTML. This file additionally sets `sl-safe` after four
   seconds, which forces every animated piece visible whatever happened.

   Nothing here touches the search form's action, method or field names, so
   search and the browse filters behave exactly as before.
   ========================================================================== */

(function () {
  "use strict";

  var root = document.documentElement;

  function reduced() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  /* ------------------------------------------------------------------ *
   * 0. Split headline
   *
   * Walks the heading's own child nodes instead of reading textContent, so
   * the <em> around "afternoon" survives. Whitespace runs are preserved
   * verbatim and punctuation with no space in front of it is folded into
   * the previous word — each word span is an inline-block, and the line
   * breaker is allowed to break between two adjacent inline-blocks even
   * where the source had no space.
   *
   * The text is unchanged, so the heading reads identically to assistive
   * technology before and after.
   * ------------------------------------------------------------------ */

  function splitHeadline() {
    var title = document.querySelector("[data-hero-split]");
    if (!title || reduced()) return;

    var index = 0;
    var lastWord = null;
    var HAS_LETTER = /[0-9A-Za-zÀ-ɏͰ-῿]/;

    function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();

          child.nodeValue.split(/(\s+)/).forEach(function (part) {
            if (!part) return;

            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(part));
              lastWord = null;
              return;
            }

            if (!HAS_LETTER.test(part) && lastWord) {
              var punct = document.createElement("span");
              punct.className = "hero-punct";
              punct.textContent = part;
              lastWord.appendChild(punct);
              return;
            }

            var span = document.createElement("span");
            span.className = "hero-word";
            span.style.setProperty("--i", String(index));
            index += 1;
            span.textContent = part;
            frag.appendChild(span);
            lastWord = span;
          });

          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && !child.classList.contains("hero-word")) {
          walk(child);
        }
      });
    }

    walk(title);
  }

  /* ------------------------------------------------------------------ *
   * 1. Typed placeholder
   *
   * The <label for="hero-search"> is the field's accessible name, so a
   * churning placeholder is never read out — assistive technology sees a
   * stable "Search developer tools". Typing stops permanently the moment
   * the field is focused or edited, and the original placeholder written
   * in the HTML is put back so nobody is ever left staring at half a word.
   * ------------------------------------------------------------------ */

  var PHRASES = [
    "postgres",
    "self-hosted",
    "free tier",
    "webhooks",
    "vector search",
    "open source",
  ];

  function initTypewriter() {
    var input = document.getElementById("hero-search");
    if (!input) return;

    var original = input.getAttribute("placeholder") || "";
    if (reduced()) return;

    var total =
      window.STACKLIST && STACKLIST.listings ? STACKLIST.listings.length : 24;
    var prefix = "Search " + total + " tools — try “";

    var word = 0;
    var chars = 0;
    var deleting = false;
    var stopped = false;

    function stop() {
      if (stopped) return;
      stopped = true;
      input.placeholder = original;
    }

    input.addEventListener("focus", stop);
    input.addEventListener("input", stop);

    function tick() {
      if (stopped) return;

      var phrase = PHRASES[word % PHRASES.length];
      chars += deleting ? -1 : 1;

      var complete = !deleting && chars >= phrase.length;
      input.placeholder =
        prefix + phrase.slice(0, chars) + (complete ? "”" : "");

      /* Deleting reads faster than typing, which is how people actually
         perceive it — matching the two speeds looks sluggish. */
      var delay = deleting ? 34 : 78;

      if (complete) {
        deleting = true;
        delay = 1700;
      } else if (deleting && chars <= 0) {
        deleting = false;
        word += 1;
        delay = 320;
      }

      window.setTimeout(tick, delay);
    }

    window.setTimeout(tick, 900);
  }

  /* ------------------------------------------------------------------ *
   * 2. Counters
   *
   * The final value is already in the markup, so a visitor with no JS —
   * or one who has asked for reduced motion — reads the right number.
   * When js/data.js is present the targets are re-read from it, so the
   * headline figures can never drift away from the directory itself.
   * ------------------------------------------------------------------ */

  function initCounters() {
    var nodes = Array.prototype.slice.call(
      document.querySelectorAll("[data-hero-count]")
    );
    if (!nodes.length) return;

    syncWithData(nodes);
    if (reduced()) return;

    function run(el) {
      var target = parseFloat(el.getAttribute("data-hero-count"));
      if (isNaN(target)) return;
      var decimals = parseInt(el.getAttribute("data-hero-decimals") || "0", 10);
      var suffix = el.getAttribute("data-hero-suffix") || "";
      var start = null;
      var duration = 1400;

      function paint(value) {
        el.textContent =
          value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + suffix;
      }

      function frame(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        /* Ramp from 30% rather than 0. A counter's first painted frame is the
           one most likely to end up in a screenshot, and "0 tools reviewed by
           hand" is a worse thing to freeze on than a number already climbing. */
        paint(target * (0.3 + 0.7 * eased));
        if (p < 1) window.requestAnimationFrame(frame);
      }

      window.requestAnimationFrame(frame);
    }

    if (!("IntersectionObserver" in window)) {
      nodes.forEach(run);
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          run(entry.target);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.3 }
    );

    nodes.forEach(function (n) {
      io.observe(n);
    });
  }

  function syncWithData(nodes) {
    if (!window.STACKLIST || !STACKLIST.listings) return;
    var listings = STACKLIST.listings;

    var values = {
      tools: listings.length,
      categories: STACKLIST.categories.length,
      rating:
        Math.round(
          (listings.reduce(function (sum, l) {
            return sum + (l.rating || 0);
          }, 0) /
            listings.length) *
            10
        ) / 10,
    };

    nodes.forEach(function (el) {
      var key = el.getAttribute("data-hero-source");
      if (!key || !(key in values)) return;
      var decimals = parseInt(el.getAttribute("data-hero-decimals") || "0", 10);
      var suffix = el.getAttribute("data-hero-suffix") || "";
      el.setAttribute("data-hero-count", String(values[key]));
      el.textContent = values[key].toFixed(decimals) + suffix;
    });
  }

  /* ------------------------------------------------------------------ *
   * 3. Watchdog
   * ------------------------------------------------------------------ */

  function boot() {
    try {
      splitHeadline();
    } catch (err) {
      /* A failed split must never take the headline with it. */
    }
    try {
      initTypewriter();
    } catch (err) {
      /* A failed typewriter must never take the search bar with it. */
    }
    try {
      initCounters();
    } catch (err) {
      /* no-op */
    }
    window.setTimeout(function () {
      root.classList.add("sl-safe");
    }, 4200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
