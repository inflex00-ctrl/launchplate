/* ==========================================================================
   LUMEN — AI Product Kit
   playground.js — category filtering + text search for the prompt library.

   The cards live in the HTML, so the page is fully readable (and indexable)
   with JavaScript switched off. This only hides and shows what is already there.
   ========================================================================== */

(function () {
  "use strict";

  var grid = document.querySelector("[data-prompt-grid]");
  if (!grid) return;

  var cards = Array.prototype.slice.call(grid.querySelectorAll(".prompt-card"));
  var chips = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
  var search = document.querySelector("[data-prompt-search]");
  var countEl = document.querySelector("[data-result-count]");
  var emptyEl = document.querySelector("[data-empty]");
  var resetBtn = document.querySelector("[data-reset-filters]");

  var activeFilter = "all";
  var query = "";

  /* Build a searchable haystack once, rather than on every keystroke. */
  cards.forEach(function (card) {
    var title = card.querySelector("h3");
    var prompt = card.querySelector(".io-block .io-text");
    card._haystack = [
      title ? title.textContent : "",
      prompt ? prompt.textContent : "",
      card.getAttribute("data-keywords") || "",
      card.getAttribute("data-category") || ""
    ]
      .join(" ")
      .toLowerCase();
  });

  function matches(card) {
    var cat = card.getAttribute("data-category");
    var byCat = activeFilter === "all" || cat === activeFilter;
    var byText = !query || card._haystack.indexOf(query) !== -1;
    return byCat && byText;
  }

  function apply() {
    var shown = 0;

    cards.forEach(function (card) {
      var ok = matches(card);
      card.hidden = !ok;
      if (ok) shown++;
    });

    if (emptyEl) emptyEl.hidden = shown !== 0;

    if (countEl) {
      if (shown === cards.length) {
        countEl.textContent = "Showing all " + cards.length + " prompts";
      } else if (shown === 0) {
        countEl.textContent = "No prompts match";
      } else {
        countEl.textContent =
          "Showing " + shown + " of " + cards.length + " prompt" + (shown === 1 ? "" : "s");
      }
    }
  }

  /* -- Category chips (buttons, so Enter/Space work for free) ---------- */
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      activeFilter = chip.getAttribute("data-filter");
      chips.forEach(function (c) {
        c.setAttribute("aria-pressed", c === chip ? "true" : "false");
      });
      apply();
    });
  });

  /* Left/right arrows move between chips, like a toolbar. */
  chips.forEach(function (chip, i) {
    chip.addEventListener("keydown", function (e) {
      var next = null;
      if (e.key === "ArrowRight") next = chips[(i + 1) % chips.length];
      if (e.key === "ArrowLeft") next = chips[(i - 1 + chips.length) % chips.length];
      if (!next) return;
      e.preventDefault();
      next.focus();
    });
  });

  /* -- Search ---------------------------------------------------------- */
  if (search) {
    var debounce;
    search.addEventListener("input", function () {
      window.clearTimeout(debounce);
      debounce = window.setTimeout(function () {
        query = search.value.trim().toLowerCase();
        apply();
      }, 120);
    });

    search.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && search.value) {
        search.value = "";
        query = "";
        apply();
      }
    });
  }

  /* -- Reset ----------------------------------------------------------- */
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      activeFilter = "all";
      query = "";
      if (search) search.value = "";
      chips.forEach(function (c) {
        c.setAttribute("aria-pressed", c.getAttribute("data-filter") === "all" ? "true" : "false");
      });
      apply();
      if (chips[0]) chips[0].focus();
    });
  }

  apply();
})();
