/* ==========================================================================
   LUMEN — hero-fx.js
   Makes the hero console *feel* live. Vanilla JS, no dependencies.
   --------------------------------------------------------------------------
   demo.js owns the transcript (typing, tool calls, token counter). This file
   only watches it and reflects what is happening onto the surrounding chrome:

     1. `.is-streaming` on .console-wrap while tokens are arriving  -> the
        panel glows and the little equaliser moves.
     2. `.is-done` on a tool-call chip the moment its spinner resolves -> a
        one-shot amber flash.
     3. A live tokens/second read-out on the floating chip.

   Purely additive and completely optional: with scripting off, index.html
   already contains the finished transcript and a static "64 tok/s" figure.
   Nothing here can hide anything.
   ========================================================================== */

(function () {
  "use strict";

  /* ----------------------------------------------------------------------
     Page-wide reveal watchdog.
     style.css hides `.reveal` unconditionally and main.js is what brings it
     back. If that observer never ran — an old browser, a script error, an
     extension — whole sections would stay invisible. Three seconds after
     load, if not a single `.reveal` has been un-hidden, assume it is broken
     and show everything. Never the other way round: this can only reveal.
     ---------------------------------------------------------------------- */
  window.setTimeout(function () {
    var all = document.querySelectorAll(".reveal");
    if (!all.length) return;
    for (var i = 0; i < all.length; i++) {
      if (all[i].classList.contains("is-visible")) return;   /* working fine */
    }
    for (var j = 0; j < all.length; j++) all[j].classList.add("is-visible");
  }, 3000);

  var hero = document.querySelector(".afx");
  if (!hero) return;

  var wrap = hero.querySelector(".console-wrap");
  var body = hero.querySelector("[data-demo-body]");
  var rate = hero.querySelector("[data-demo-tokens]");
  if (!wrap || !body) return;

  var reduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  if (typeof MutationObserver !== "function") return;

  /* ----------------------------------------------------------------------
     1 + 2. Reflect transcript activity onto the chrome.
     ---------------------------------------------------------------------- */
  var idleTimer = null;
  var IDLE_MS = 700;

  function markActive() {
    wrap.classList.add("is-streaming");
    if (idleTimer) window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(function () {
      wrap.classList.remove("is-streaming");
      idleTimer = null;
    }, IDLE_MS);
  }

  /* Character deltas since the last sample — the basis of the tok/s figure.
     Roughly 4 characters per token, which is the usual English ratio. */
  var lastLen = 0;
  var CHARS_PER_TOKEN = 4;

  var observer = new MutationObserver(function (records) {
    markActive();

    for (var i = 0; i < records.length; i++) {
      var r = records[i];

      /* A tool chip resolves when demo.js swaps its spinner for a tick. */
      if (r.removedNodes && r.removedNodes.length) {
        for (var j = 0; j < r.removedNodes.length; j++) {
          var gone = r.removedNodes[j];
          if (
            gone.nodeType === 1 &&
            gone.classList &&
            gone.classList.contains("spinner")
          ) {
            var chip = r.target;
            if (chip && chip.classList && chip.classList.contains("tool-call")) {
              chip.classList.add("is-done");
              /* Let the flash finish, then take the class off so a Replay
                 can trigger it again. */
              (function (c) {
                window.setTimeout(function () {
                  c.classList.remove("is-done");
                }, 800);
              })(chip);
            }
          }
        }
      }
    }
  });

  observer.observe(body, {
    childList: true,
    subtree: true,
    characterData: true
  });

  /* ----------------------------------------------------------------------
     3. Tokens per second.
     Sampled on a fixed 500 ms tick and smoothed, so the number moves like a
     real read-out instead of flickering every frame. demo.js also writes to
     this node; we simply win the race while streaming and leave its value
     alone once the transcript is idle.
     ---------------------------------------------------------------------- */
  if (rate) {
    var smoothed = 0;
    var TICK = 500;

    window.setInterval(function () {
      if (document.hidden) return;

      var len = body.textContent.length;
      var delta = len - lastLen;
      lastLen = len;

      if (delta <= 0) return;   /* idle, or the transcript was just cleared */

      var perSecond = (delta / CHARS_PER_TOKEN) * (1000 / TICK);
      smoothed = smoothed ? smoothed * 0.6 + perSecond * 0.4 : perSecond;

      var shown = Math.max(8, Math.round(smoothed));
      rate.textContent = String(shown);
    }, TICK);
  }

  /* ----------------------------------------------------------------------
     Watchdog. If the observer somehow never fires, nothing is hidden — but
     make sure we are not left showing a permanently "streaming" panel.
     ---------------------------------------------------------------------- */
  window.setTimeout(function () {
    if (!idleTimer) wrap.classList.remove("is-streaming");
  }, 45000);

})();
