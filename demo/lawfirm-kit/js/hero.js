/* =========================================================================
   HALLOWAY & FINCH — js/hero.js
   Choreographs the home-page hero. Vanilla, dependency-free, no external
   requests. Loaded after main.js; it touches nothing main.js owns.

   Contents
     1. Guards (reduced motion, missing hero, watchdog handshake)
     2. Split the headline into words
     3. Play the sequence
     4. Count the three proof figures up, once

   SAFETY
     The hiding rules in css/hero.css are gated on <html class="hf-stage">,
     which the inline script in index.html adds and then cancels again with
     .hf-stage-off on a fixed timer. If this file fails to parse, fails to
     load, or throws, the watchdog still un-hides the hero. Nothing here is
     required for the hero to be readable.
   ========================================================================= */

(function () {
  'use strict';

  var root = document.documentElement;
  var hero = document.querySelector('.hero');

  /* Not the home page, or the browser is ancient — let the watchdog run. */
  if (!hero || !root.classList || !hero.querySelector) return;

  var reduced = false;
  try {
    reduced =
      !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (err) {
    reduced = false;
  }

  var proofValues = hero.querySelectorAll('[data-count]');

  /* ---------------------------------------------------------------------
     Reduced motion: final state, final numbers, no sequence at all.
     --------------------------------------------------------------------- */
  if (reduced) {
    root.classList.remove('hf-stage');
    root.classList.add('hf-stage-off');
    return;
  }

  /* ---------------------------------------------------------------------
     1. SPLIT THE HEADLINE
     Words, never characters. Per-character on a sentence this long is the
     overdone version of the effect; per-word reads as a line settling.
     The walk preserves the <em>, the entities and every space.
     --------------------------------------------------------------------- */

  var WORD_STEP = 62;   /* ms between words  */
  var WORD_BASE = 170;  /* ms before the first word */
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

        var span = document.createElement('span');
        span.className = 'hf-w';
        span.textContent = parts[p];
        span.style.setProperty('--hf-d', WORD_BASE + wordCount * WORD_STEP + 'ms');
        wordCount++;
        frag.appendChild(span);
      }

      node.replaceChild(frag, child);
    }
  }

  var headline = hero.querySelector('h1');
  if (headline) {
    try {
      splitWords(headline);
    } catch (err) {
      /* Leave the headline exactly as authored. */
    }
  }

  /* ---------------------------------------------------------------------
     2. PLAY
     The hero is above the fold on every viewport we ship, so there is no
     observer here — waiting for an intersection would only add a way for
     the sequence never to start.
     --------------------------------------------------------------------- */

  var words = headline ? headline.querySelectorAll('.hf-w') : [];
  var staged = hero.querySelectorAll('[data-hero-stage]');
  var artwork = hero.querySelector('.hero__art .artwork');
  var artColumn = hero.querySelector('.hero__art');
  var played = false;

  function play() {
    if (played) return;
    played = true;

    for (var s = 0; s < staged.length; s++) staged[s].classList.add('is-in');
    for (var w = 0; w < words.length; w++) words[w].classList.add('is-in');
    if (artwork) artwork.classList.add('is-in');
    if (artColumn) artColumn.classList.add('is-in');

    startCounters();
  }

  /* Two frames: the first commits the hidden state, the second flips it,
     which is what makes the browser interpolate rather than jump. */
  if (window.requestAnimationFrame) {
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(play);
    });
  } else {
    play();
  }

  /* Local belt-and-braces on top of the inline watchdog. */
  window.setTimeout(play, 900);

  /* ---------------------------------------------------------------------
     3. COUNTERS — each figure counts once, then never again.
     The markup already contains the final value, so a failure here is
     invisible rather than destructive. On a short viewport the proof row
     sits below the fold, so the count waits until it is actually on
     screen; there is no point animating a number nobody is looking at.
     --------------------------------------------------------------------- */

  var COUNT_DELAY = 900;
  var COUNT_DUR = 1750;
  var countersStarted = false;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function startCounters() {
    if (countersStarted) return;
    if (!proofValues.length || !window.requestAnimationFrame) return;

    var proofRow = hero.querySelector('.hero__proof');

    if (proofRow && 'IntersectionObserver' in window) {
      var box = proofRow.getBoundingClientRect();
      var onScreen = box.top < window.innerHeight * 0.9 && box.bottom > 0;

      if (!onScreen) {
        var io = new IntersectionObserver(
          function (entries) {
            for (var e = 0; e < entries.length; e++) {
              if (!entries[e].isIntersecting) continue;
              io.disconnect();
              COUNT_DELAY = 120;
              runCounters();
              return;
            }
          },
          { rootMargin: '0px 0px -60px 0px', threshold: 0.2 }
        );
        io.observe(proofRow);
        return;
      }
    }

    runCounters();
  }

  function runCounters() {
    if (countersStarted) return;
    countersStarted = true;

    for (var i = 0; i < proofValues.length; i++) {
      (function (el, index) {
        var target = parseFloat(el.getAttribute('data-count'));
        if (!isFinite(target)) return;

        var suffix = el.getAttribute('data-count-suffix') || '';
        var prefix = el.getAttribute('data-count-prefix') || '';
        var final = el.textContent;
        var started = null;

        /* Reserve the final width before the first frame so the row never
           reflows while the digits change. */
        el.style.minWidth = el.getBoundingClientRect().width + 'px';
        el.textContent = prefix + '0' + suffix;

        var step = function (now) {
          if (started === null) started = now;
          var t = Math.min(1, (now - started) / COUNT_DUR);
          var value = Math.round(target * easeOutCubic(t));

          el.textContent = prefix + value + suffix;

          if (t < 1) {
            window.requestAnimationFrame(step);
          } else {
            el.textContent = final;
            el.style.minWidth = '';
          }
        };

        window.setTimeout(function () {
          window.requestAnimationFrame(step);
        }, COUNT_DELAY + index * 130);
      })(proofValues[i], i);
    }
  }
})();
