/* ==========================================================================
   BRIGHTWATER DENTAL — js/hero.js
   Choreographs the home-page hero and draws the trust-bar icons. Vanilla,
   dependency-free, no external requests. Loaded after main.js and touching
   nothing main.js owns.

   Contents
     1. Guards (reduced motion, missing hero, watchdog handshake)
     2. Split the headline into words
     3. Play the hero sequence
     4. Draw the trust-bar icons when the bar comes into view

   SAFETY
     The hiding rules in css/hero.css are gated on <html class="bw-stage">,
     added by the inline script in index.html and cancelled again by that
     same script with .bw-stage-off. If this file never loads or throws
     halfway, the hero still becomes visible. The icon drawing is applied
     from here only, so with JavaScript off the icons are drawn already.
   ========================================================================== */

(function () {
  "use strict";

  var root = document.documentElement;
  var hero = document.querySelector(".hero");

  if (!root.classList) return;

  var reduced = false;
  try {
    reduced = !!(
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  } catch (err) {
    reduced = false;
  }

  if (reduced) {
    root.classList.remove("bw-stage");
    root.classList.add("bw-stage-off");
    return;
  }

  /* ----------------------------------------------------------------------
     1. SPLIT THE HEADLINE
     The walk preserves the <br>, the entities and every space.
     ---------------------------------------------------------------------- */

  var WORD_STEP = 58;
  var WORD_BASE = 150;
  var wordCount = 0;

  function splitWords(node) {
    var kids = Array.prototype.slice.call(node.childNodes);

    for (var i = 0; i < kids.length; i++) {
      var child = kids[i];

      if (child.nodeType === 1) {
        splitWords(child);
        continue;
      }
      if (child.nodeType !== 3) continue;

      var text = child.nodeValue;
      if (!text || !/\S/.test(text)) continue;

      var frag = document.createDocumentFragment();
      var parts = text.split(/(\s+)/);

      for (var p = 0; p < parts.length; p++) {
        if (!parts[p]) continue;

        if (/^\s+$/.test(parts[p])) {
          frag.appendChild(document.createTextNode(parts[p]));
          continue;
        }

        var span = document.createElement("span");
        span.className = "bw-w";
        span.textContent = parts[p];
        span.style.setProperty("--bw-d", WORD_BASE + wordCount * WORD_STEP + "ms");
        wordCount++;
        frag.appendChild(span);
      }

      node.replaceChild(frag, child);
    }
  }

  var headline = hero ? hero.querySelector("h1") : null;
  if (headline) {
    try {
      splitWords(headline);
    } catch (err) {
      /* Leave the headline exactly as authored. */
    }
  }

  /* ----------------------------------------------------------------------
     2. PLAY
     The hero is above the fold at every width the kit ships, so this runs
     on the second frame rather than waiting for an intersection. Waiting
     would only add a way for the sequence never to start.
     ---------------------------------------------------------------------- */

  var played = false;

  function play() {
    if (played || !hero) return;
    played = true;

    var groups = [
      hero.querySelectorAll("[data-hero-stage]"),
      headline ? headline.querySelectorAll(".bw-w") : [],
      hero.querySelectorAll(".ph-frame"),
      hero.querySelectorAll(".scene-part"),
      hero.querySelectorAll(".chip-anchor"),
      hero.querySelectorAll(".hero-rings")
    ];

    for (var g = 0; g < groups.length; g++) {
      for (var i = 0; i < groups[g].length; i++) groups[g][i].classList.add("is-in");
    }
  }

  if (hero && window.requestAnimationFrame) {
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(play);
    });
  } else {
    play();
  }

  window.setTimeout(play, 900);

  /* ----------------------------------------------------------------------
     3. TRUST-BAR ICONS DRAW THEMSELVES
     Every icon in the bar is stroke-only line art, so each shape can be
     measured and re-drawn with a dash pair. Anything that cannot be
     measured is left exactly as authored.
     ---------------------------------------------------------------------- */

  var trustItems = document.querySelectorAll(".trust-bar .trust-item");
  if (!trustItems.length) return;

  var SHAPES = "path, circle, ellipse, rect, line, polyline, polygon";
  var armedShapes = [];

  function prepare(item, itemIndex) {
    var svg = item.querySelector("svg");
    if (!svg) return false;
    if (svg.getAttribute("fill") !== "none") return false;

    var shapes = svg.querySelectorAll(SHAPES);
    if (!shapes.length) return false;

    var prepared = 0;

    for (var i = 0; i < shapes.length; i++) {
      var shape = shapes[i];
      if (typeof shape.getTotalLength !== "function") continue;

      var length = 0;
      try {
        length = shape.getTotalLength();
      } catch (err) {
        continue;
      }
      if (!length || !isFinite(length)) continue;

      /* transition:none while the undrawn state is written, or the browser
         animates the icon UN-drawing itself the moment the dash pair lands
         — and the real draw then reads as a reversal of that. The inline
         suppression is lifted a frame before the class that draws them. */
      shape.style.transition = "none";
      shape.setAttribute("data-draw", "");
      shape.style.strokeDasharray = length + " " + length;
      shape.style.strokeDashoffset = length;
      shape.style.setProperty("--bw-d", 320 + itemIndex * 120 + i * 80 + "ms");
      armedShapes.push(shape);
      prepared++;
    }

    return prepared > 0;
  }

  var armed = [];

  for (var t = 0; t < trustItems.length; t++) {
    if (prepare(trustItems[t], t)) armed.push(trustItems[t]);
  }

  if (!armed.length) return;

  var bar = armed[0].parentNode;
  var drawn = false;

  function draw() {
    if (drawn) return;
    drawn = true;

    var light = function () {
      for (var i = 0; i < armed.length; i++) armed[i].classList.add("is-drawn");
    };

    /* Hand the transition back to the stylesheet, force the undrawn state to
       be committed, and only then — a whole frame later — add the class that
       draws the icons. Doing both in one style pass gives no animation. */
    var arm = function () {
      for (var i = 0; i < armedShapes.length; i++) armedShapes[i].style.transition = "";
      void bar.getBoundingClientRect();
      window.requestAnimationFrame(light);
    };

    if (window.requestAnimationFrame) {
      window.requestAnimationFrame(arm);
    } else {
      for (var i = 0; i < armedShapes.length; i++) armedShapes[i].style.transition = "";
      light();
    }
  }

  if (!("IntersectionObserver" in window)) {
    draw();
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (!entries[i].isIntersecting) continue;
          draw();
          io.disconnect();
          return;
        }
      },
      { rootMargin: "0px 0px -40px 0px", threshold: 0.15 }
    );
    io.observe(bar);
  }

  /* Nothing may stay undrawn because the observer never fired — a very tall
     viewport, a restored scroll position, a background tab that never
     composited. Four seconds is well past any legitimate entrance. */
  window.setTimeout(draw, 4000);
})();
