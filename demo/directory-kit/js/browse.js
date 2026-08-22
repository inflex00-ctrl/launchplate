/* ==========================================================================
   STACKLIST — browse.js
   --------------------------------------------------------------------------
   The filtering engine. Powers browse.html, and category.html in a reduced
   form where the category is fixed and its filter group is hidden.

   Everything runs client-side against the LISTINGS array in data.js — there
   is no request of any kind, so it works from file:/// and on any static
   host without a backend.

   Filters applied, in order:
     1. text query   — matches name, tagline, description, tags, category
     2. category     — any of the checked categories
     3. pricing      — any of the checked price tiers
     4. rating       — minimum average rating
     5. tags         — listing must carry EVERY selected tag

   State is mirrored into the URL query string, so a filtered view can be
   linked, bookmarked and shared, and the back button behaves.

   Initialise with:
       SLBrowse.init({ lockCategory: "deployment" })   // optional
   ========================================================================== */

var SLBrowse = (function () {
  "use strict";

  var $ = SL.$;
  var $$ = SL.$$;

  /* Current filter state. */
  var state = {
    q: "",
    categories: [],
    pricing: [],
    rating: 0,
    tags: [],
    sort: "featured",
    view: "grid",
  };

  var lockedCategory = null;
  var els = {};
  var debounceTimer = null;

  /* ======================================================================
     SORTING
     ====================================================================== */

  var SORTS = {
    featured: function (a, b) {
      /* Sponsored first, then featured, then by vote count. */
      var as = (a.sponsored ? 2 : 0) + (a.featured ? 1 : 0);
      var bs = (b.sponsored ? 2 : 0) + (b.featured ? 1 : 0);
      if (as !== bs) return bs - as;
      return b.votes - a.votes;
    },
    rating: function (a, b) {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return b.ratingCount - a.ratingCount;
    },
    popular: function (a, b) {
      return b.votes - a.votes;
    },
    newest: function (a, b) {
      return (b.added || "").localeCompare(a.added || "");
    },
    name: function (a, b) {
      return a.name.localeCompare(b.name);
    },
  };

  var SORT_LABELS = {
    featured: "Featured first",
    rating: "Highest rated",
    popular: "Most upvoted",
    newest: "Recently added",
    name: "Name (A–Z)",
  };

  /* ======================================================================
     FILTERING
     ====================================================================== */

  function matches(listing) {
    /* 1. free-text query */
    if (state.q) {
      var needle = state.q.toLowerCase();
      var cat = STACKLIST.category(listing.category);
      var haystack = [
        listing.name,
        listing.tagline,
        listing.description,
        (listing.tags || []).join(" "),
        cat ? cat.name : "",
      ]
        .join(" ")
        .toLowerCase();
      if (haystack.indexOf(needle) === -1) return false;
    }

    /* 2. category */
    if (state.categories.length && state.categories.indexOf(listing.category) === -1) {
      return false;
    }

    /* 3. price tier */
    if (state.pricing.length && state.pricing.indexOf(listing.pricing) === -1) {
      return false;
    }

    /* 4. minimum rating */
    if (state.rating && listing.rating < state.rating) return false;

    /* 5. tags — every selected tag must be present */
    if (state.tags.length) {
      var have = listing.tags || [];
      for (var i = 0; i < state.tags.length; i++) {
        if (have.indexOf(state.tags[i]) === -1) return false;
      }
    }

    return true;
  }

  function results() {
    var pool = STACKLIST.listings.slice();
    if (lockedCategory) {
      pool = pool.filter(function (l) {
        return l.category === lockedCategory;
      });
    }
    var out = pool.filter(matches);
    out.sort(SORTS[state.sort] || SORTS.featured);
    return out;
  }

  /* ======================================================================
     RENDER
     ====================================================================== */

  function renderGrid(list) {
    var grid = els.grid;
    if (!grid) return;

    grid.className = "grid " + (state.view === "list" ? "grid--list" : "grid--listings");

    if (!list.length) {
      grid.innerHTML =
        '<div class="empty">' +
        '<div class="empty__icon">' + SL.icon("search") + "</div>" +
        "<h3>No tools match those filters</h3>" +
        "<p>Nothing in the directory fits every condition you have set. " +
        "Try removing a tag or widening the price range.</p>" +
        '<button type="button" class="btn btn--primary" data-clear-all>Clear all filters</button>' +
        "</div>";
      wireClearAll(grid);
      return;
    }

    var html = list
      .map(function (listing) {
        return SL.cardHTML(listing);
      })
      .join("");

    grid.innerHTML = html;

    /* Stagger the entry animation across the newly rendered cards. */
    if (!SL.prefersReducedMotion()) {
      Array.prototype.forEach.call(grid.children, function (card, i) {
        card.style.setProperty("--reveal-delay", Math.min(i * 32, 320) + "ms");
        card.setAttribute("data-filtering", "in");
      });
    }

    SL.wireVotes(grid);
  }

  function renderCount(list) {
    if (!els.count) return;
    var total = lockedCategory ? STACKLIST.countFor(lockedCategory) : STACKLIST.listings.length;
    var n = list.length;
    /* The noun agrees with whichever number it actually follows: "1 tool"
       when unfiltered, but "1 of 3 tools" when it trails the total. */
    var text =
      n === total
        ? "<b>" + n + "</b> " + (n === 1 ? "tool" : "tools")
        : "<b>" + n + "</b> of " + total + " " + (total === 1 ? "tool" : "tools");
    els.count.innerHTML = text + (state.q ? ' matching &ldquo;' + SL.escape(state.q) + "&rdquo;" : "");
  }

  function renderActiveFilters() {
    if (!els.active) return;
    var pills = [];

    if (state.q) {
      pills.push(["q", null, "Search: " + state.q]);
    }
    state.categories.forEach(function (c) {
      var cat = STACKLIST.category(c);
      pills.push(["categories", c, cat ? cat.short || cat.name : c]);
    });
    state.pricing.forEach(function (p) {
      pills.push(["pricing", p, SL.priceLabel[p] || p]);
    });
    if (state.rating) {
      pills.push(["rating", null, state.rating.toFixed(1) + "+ rating"]);
    }
    state.tags.forEach(function (t) {
      pills.push(["tags", t, "#" + t]);
    });

    if (!pills.length) {
      els.active.innerHTML = "";
      els.active.hidden = true;
      return;
    }

    els.active.hidden = false;
    els.active.innerHTML =
      pills
        .map(function (p) {
          return (
            '<button type="button" class="pill-clear" data-facet="' +
            SL.escape(p[0]) +
            '"' +
            (p[1] ? ' data-value="' + SL.escape(p[1]) + '"' : "") +
            ' aria-label="Remove filter: ' + SL.escape(p[2]) + '">' +
            SL.escape(p[2]) +
            SL.icon("x") +
            "</button>"
          );
        })
        .join("") +
      '<button type="button" class="btn btn--quiet btn--sm" data-clear-all>Clear all</button>';

    $$("[data-facet]", els.active).forEach(function (btn) {
      btn.addEventListener("click", function () {
        removeFacet(btn.dataset.facet, btn.dataset.value);
      });
    });
    wireClearAll(els.active);
  }

  function wireClearAll(scope) {
    $$("[data-clear-all]", scope).forEach(function (btn) {
      btn.addEventListener("click", function () {
        clearAll();
      });
    });
  }

  /* Re-run everything and repaint. */
  function apply(pushUrl) {
    var list = results();
    renderGrid(list);
    renderCount(list);
    renderActiveFilters();
    syncControls();
    if (pushUrl !== false) writeUrl();
  }

  /* ======================================================================
     STATE MUTATION
     ====================================================================== */

  function toggleIn(arr, value) {
    var i = arr.indexOf(value);
    if (i === -1) arr.push(value);
    else arr.splice(i, 1);
  }

  function removeFacet(facet, value) {
    if (facet === "q") state.q = "";
    else if (facet === "rating") state.rating = 0;
    else if (value) {
      var i = state[facet].indexOf(value);
      if (i > -1) state[facet].splice(i, 1);
    }
    apply();
  }

  function clearAll() {
    state.q = "";
    state.categories = [];
    state.pricing = [];
    state.rating = 0;
    state.tags = [];
    apply();
    if (els.search) els.search.focus();
  }

  /* Push control values back into the DOM after a state change. */
  function syncControls() {
    if (els.search && els.search.value !== state.q) els.search.value = state.q;

    $$('input[data-filter="categories"]').forEach(function (cb) {
      cb.checked = state.categories.indexOf(cb.value) > -1;
    });
    $$('input[data-filter="pricing"]').forEach(function (cb) {
      cb.checked = state.pricing.indexOf(cb.value) > -1;
    });
    $$('input[data-filter="rating"]').forEach(function (rb) {
      rb.checked = Number(rb.value) === state.rating;
    });
    $$(".tag-filter").forEach(function (btn) {
      btn.setAttribute(
        "aria-pressed",
        state.tags.indexOf(btn.dataset.tag) > -1 ? "true" : "false"
      );
    });
    if (els.sort) els.sort.value = state.sort;
    $$(".viewswitch button").forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.dataset.view === state.view ? "true" : "false");
    });
  }

  /* ======================================================================
     URL SYNCHRONISATION
     ====================================================================== */

  function writeUrl() {
    var parts = [];
    if (state.q) parts.push("q=" + encodeURIComponent(state.q));
    if (state.categories.length) parts.push("category=" + state.categories.join(","));
    if (state.pricing.length) parts.push("price=" + state.pricing.join(","));
    if (state.rating) parts.push("rating=" + state.rating);
    if (state.tags.length) parts.push("tags=" + state.tags.join(","));
    if (state.sort !== "featured") parts.push("sort=" + state.sort);
    if (state.view !== "grid") parts.push("view=" + state.view);

    var url = window.location.pathname + (parts.length ? "?" + parts.join("&") : "");
    if (lockedCategory) {
      /* category.html keeps its own identifying parameter first. */
      url =
        window.location.pathname +
        "?id=" +
        encodeURIComponent(lockedCategory) +
        (parts.length ? "&" + parts.join("&") : "");
    }

    try {
      window.history.replaceState(null, "", url);
    } catch (e) {
      /* file:// in some browsers refuses replaceState. Filtering still works;
         only the shareable URL is unavailable. */
    }
  }

  function readUrl() {
    var q = SL.query();
    if (q.q) state.q = q.q;
    if (q.category && !lockedCategory) state.categories = q.category.split(",").filter(Boolean);
    if (q.price) state.pricing = q.price.split(",").filter(Boolean);
    if (q.rating) state.rating = parseFloat(q.rating) || 0;
    if (q.tags) state.tags = q.tags.split(",").filter(Boolean);
    if (q.sort && SORTS[q.sort]) state.sort = q.sort;
    if (q.view === "list") state.view = "list";
  }

  /* ======================================================================
     BUILDING THE FILTER RAIL
     ====================================================================== */

  function buildCategoryFilters() {
    var host = $("#filter-categories");
    if (!host) return;
    host.innerHTML = STACKLIST.categories
      .map(function (c) {
        return (
          '<label class="check">' +
          '<input type="checkbox" data-filter="categories" value="' + SL.escape(c.id) + '">' +
          '<span class="check__text">' + SL.escape(c.name) +
          '<span class="check__count">' + STACKLIST.countFor(c.id) + "</span></span>" +
          "</label>"
        );
      })
      .join("");
  }

  function buildPricingFilters() {
    var host = $("#filter-pricing");
    if (!host) return;
    var tiers = ["free", "freemium", "paid", "enterprise"];
    var pool = lockedCategory ? STACKLIST.byCategory(lockedCategory) : STACKLIST.listings;
    host.innerHTML = tiers
      .filter(function (t) {
        /* A tier nothing matches is a dead control — hide it. On a category
           page that keeps the rail honest about what is actually there. */
        return pool.some(function (l) {
          return l.pricing === t;
        });
      })
      .map(function (t) {
        var n = pool.filter(function (l) {
          return l.pricing === t;
        }).length;
        return (
          '<label class="check">' +
          '<input type="checkbox" data-filter="pricing" value="' + t + '">' +
          '<span class="check__text">' + SL.priceLabel[t] +
          '<span class="check__count">' + n + "</span></span>" +
          "</label>"
        );
      })
      .join("");
  }

  function buildRatingFilters() {
    var host = $("#filter-rating");
    if (!host) return;
    var options = [
      [0, "Any rating"],
      [4.0, "4.0 and above"],
      [4.5, "4.5 and above"],
      [4.7, "4.7 and above"],
    ];
    host.innerHTML = options
      .map(function (o) {
        return (
          '<label class="check">' +
          '<input type="radio" name="rating" data-filter="rating" value="' + o[0] + '"' +
          (o[0] === 0 ? " checked" : "") +
          ">" +
          '<span class="check__text">' + o[1] + "</span>" +
          "</label>"
        );
      })
      .join("");
  }

  function buildTagFilters() {
    var host = $("#filter-tags");
    if (!host) return;

    /* Tags that appear on more than one tool come first, because those are
       the ones worth clicking — a tag that matches a single listing is a
       dead end. Only if there are too few of those do we top the cloud up
       with single-use tags, so a thin category still looks furnished. */
    var pool = lockedCategory ? STACKLIST.byCategory(lockedCategory) : STACKLIST.listings;
    var limit = lockedCategory ? 14 : 18;
    var counts = {};
    pool.forEach(function (l) {
      (l.tags || []).forEach(function (t) {
        counts[t] = (counts[t] || 0) + 1;
      });
    });

    var byFrequency = function (a, b) {
      if (counts[b] !== counts[a]) return counts[b] - counts[a];
      return a.localeCompare(b);
    };

    var shared = Object.keys(counts).filter(function (t) { return counts[t] > 1; }).sort(byFrequency);
    var single = Object.keys(counts).filter(function (t) { return counts[t] === 1; }).sort();

    var top = shared.slice(0, limit);
    if (top.length < limit) {
      top = top.concat(single.slice(0, limit - top.length));
    }

    host.innerHTML = top
      .map(function (t) {
        return (
          '<button type="button" class="tag-filter" data-tag="' + SL.escape(t) + '" ' +
          'aria-pressed="false">' + SL.escape(t) + "</button>"
        );
      })
      .join("");
  }

  /* ======================================================================
     EVENT WIRING
     ====================================================================== */

  function wire() {
    /* Search box — debounced so typing stays smooth, but Enter applies now */
    if (els.search) {
      els.search.addEventListener("input", function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
          state.q = els.search.value.trim();
          apply();
        }, 160);
      });
      els.search.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          clearTimeout(debounceTimer);
          state.q = els.search.value.trim();
          apply();
        }
        if (e.key === "Escape" && els.search.value) {
          els.search.value = "";
          state.q = "";
          apply();
        }
      });
    }

    /* Checkboxes and radios are delegated so rebuilding the rail is safe. */
    document.addEventListener("change", function (e) {
      var input = e.target.closest("[data-filter]");
      if (!input) return;
      var facet = input.dataset.filter;

      if (facet === "rating") {
        state.rating = parseFloat(input.value) || 0;
      } else if (facet === "categories" || facet === "pricing") {
        toggleIn(state[facet], input.value);
      }
      apply();
    });

    /* Tag cloud buttons */
    document.addEventListener("click", function (e) {
      var btn = e.target.closest(".tag-filter");
      if (!btn) return;
      toggleIn(state.tags, btn.dataset.tag);
      apply();
    });

    /* Sort */
    if (els.sort) {
      els.sort.addEventListener("change", function () {
        state.sort = els.sort.value;
        apply();
      });
    }

    /* Grid / list view */
    $$(".viewswitch button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.view = btn.dataset.view;
        apply();
      });
    });

    /* Mobile filter drawer */
    var trigger = $(".filter-trigger");
    var rail = $(".filters");
    if (trigger && rail) {
      trigger.addEventListener("click", function () {
        var open = trigger.getAttribute("aria-expanded") === "true";
        trigger.setAttribute("aria-expanded", open ? "false" : "true");
        rail.setAttribute("data-open", open ? "false" : "true");
      });
    }

    /* Clear-all buttons that live in the static markup */
    wireClearAll(document);
  }

  /* ======================================================================
     INIT
     ====================================================================== */

  function init(opts) {
    opts = opts || {};
    if (typeof STACKLIST === "undefined") return;

    lockedCategory = opts.lockCategory || null;
    if (opts.sort) state.sort = opts.sort;

    els.grid = $("#results-grid");
    els.count = $("#results-count");
    els.active = $("#active-filters");
    els.search = $("#filter-search");
    els.sort = $("#sort-select");

    buildCategoryFilters();
    buildPricingFilters();
    buildRatingFilters();
    buildTagFilters();

    readUrl();
    wire();
    apply(false);
    writeUrl();
  }

  return {
    init: init,
    /* Exposed so the pages — and anyone testing the template — can drive the
       filters programmatically:  SLBrowse.set({ pricing: ["free"] })  */
    set: function (patch) {
      Object.keys(patch || {}).forEach(function (k) {
        state[k] = patch[k];
      });
      apply();
      return results().length;
    },
    get: function () {
      return JSON.parse(JSON.stringify(state));
    },
    count: function () {
      return results().length;
    },
    results: results,
    sortLabels: SORT_LABELS,
  };
})();
