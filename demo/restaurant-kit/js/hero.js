/* ==========================================================================
   EMBER & OAK — hero.js
   Three small behaviours for the home-page hero. Vanilla, no dependencies,
   safe to load with `defer`, and safe to delete.

     1. Split the headline into per-word spans (css/hero.css animates them)
     2. Two-layer parallax between the room and the plated dish
     3. A watchdog that forces the whole hero visible if anything above fails

   THE CONTRACT WITH css/hero.css
   css/hero.css never hides anything unless <html> carries `eo-js`, which is
   set by a two-line inline script in the page <head>. So with JavaScript off
   the hero renders complete and static. This file additionally sets
   `eo-safe` after four seconds, which forces every animated piece visible
   whatever happened — a blank hero is the one failure mode worth insuring
   against twice.
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
   * 1. Split headline
   *
   * Walks the heading's own child nodes rather than reading textContent,
   * so the <em> around "Irish oak" survives and punctuation stays welded
   * to the word it belongs to. Whitespace runs are preserved verbatim,
   * which is what keeps "oak</em>," from gaining a space before the comma.
   *
   * The text itself is unchanged, so the heading's accessible name is
   * identical before and after — no aria-label juggling required.
   * ------------------------------------------------------------------ */

  function splitHeadline() {
    var title = document.getElementById("hero-title");
    if (!title || reduced()) return;
    if (title.getAttribute("data-hero-split") === null) return;

    var index = 0;
    var lastWord = null;
    var HAS_LETTER = /[0-9A-Za-zÀ-ɏͰ-῿]/;

    function walk(node) {
      var kids = Array.prototype.slice.call(node.childNodes);

      kids.forEach(function (child) {
        if (child.nodeType === 3) {
          var parts = child.nodeValue.split(/(\s+)/);
          var frag = document.createDocumentFragment();

          parts.forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(part));
              lastWord = null;
              return;
            }

            /* Punctuation with no space in front of it — the comma right
               after "</em>" here — is folded INTO the previous word span
               rather than becoming a span of its own. Each span is an
               inline-block, and the line breaker is allowed to break between
               two adjacent inline-blocks even with no whitespace between
               them, which would drop the comma onto its own line. Folding it
               in removes the break opportunity entirely. The nested
               .hero-punct keeps it upright when the word it joins is
               italic, so the rendering matches the original markup. */
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
   * 2. Parallax
   *
   * Written to the independent `translate` property rather than to
   * `transform`. The entrance animations in css/hero.css own `transform`
   * on these same elements; because the two properties compose instead of
   * overwriting each other, the drift and the entrance coexist without a
   * wrapper element for each.
   * ------------------------------------------------------------------ */

  function initParallax() {
    var layers = Array.prototype.slice.call(
      document.querySelectorAll("[data-hero-parallax]")
    );
    if (!layers.length || reduced()) return;

    /* No `translate` property (older Safari/Firefox) means no parallax —
       the hero is complete without it, so degrade silently. */
    if (!("translate" in document.documentElement.style)) return;

    /* Parallax on a phone is mostly jitter; skip it. */
    if (window.matchMedia && window.matchMedia("(max-width: 760px)").matches) return;

    var ticking = false;

    function update() {
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      layers.forEach(function (layer) {
        var speed = parseFloat(layer.getAttribute("data-hero-parallax")) || 0;
        var offset = Math.max(-80, Math.min(80, y * speed));
        layer.style.translate = "0 " + offset.toFixed(1) + "px";
      });
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );

    update();
  }

  /* ------------------------------------------------------------------ *
   * 3. Watchdog
   * ------------------------------------------------------------------ */

  function watchdog() {
    window.setTimeout(function () {
      root.classList.add("eo-safe");
    }, 4200);
  }

  function boot() {
    try {
      splitHeadline();
    } catch (err) {
      /* A failed split must never take the headline with it. */
    }
    try {
      initParallax();
    } catch (err) {
      /* no-op */
    }
    watchdog();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
