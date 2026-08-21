/* ==========================================================================
   LUMEN — AI Product Kit
   main.js — shared behaviour for every page.
   Vanilla JS. No dependencies. Safe to load with `defer`.
   --------------------------------------------------------------------------
   Modules
     1. Theme toggle (persisted, try/catch guarded)
     2. Mobile navigation drawer
     3. Sticky header state
     4. Copy to clipboard  [data-copy]
     5. Accessible tabs    [data-tabs]
     6. Scroll reveal      .reveal
     7. Scroll-spy         [data-spy]
     8. Misc (current year)
   ========================================================================== */

(function () {
  "use strict";

  var root = document.documentElement;

  /* ------------------------------------------------------------------ *
   * Tiny helpers
   * ------------------------------------------------------------------ */
  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  function on(el, evt, fn, opts) {
    if (el) el.addEventListener(evt, fn, opts);
  }

  /* Storage that never throws (private mode, blocked cookies, file://). */
  var store = {
    get: function (key) {
      try {
        return window.localStorage.getItem(key);
      } catch (err) {
        return null;
      }
    },
    set: function (key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch (err) {
        /* no-op */
      }
    }
  };

  /* ------------------------------------------------------------------ *
   * 1. Theme toggle
   * ------------------------------------------------------------------ */
  var THEME_KEY = "lumen-theme";

  function systemPrefersDark() {
    return (
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }

  function currentTheme() {
    var explicit = root.getAttribute("data-theme");
    if (explicit === "dark" || explicit === "light") return explicit;
    return systemPrefersDark() ? "dark" : "light";
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    $$("[data-theme-toggle]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
      btn.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
      );
    });
  }

  function initTheme() {
    applyTheme(currentTheme());

    $$("[data-theme-toggle]").forEach(function (btn) {
      on(btn, "click", function () {
        var next = currentTheme() === "dark" ? "light" : "dark";
        applyTheme(next);
        store.set(THEME_KEY, next);
      });
    });

    /* Follow the OS while the visitor has not made an explicit choice. */
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      var listener = function (e) {
        if (!store.get(THEME_KEY)) applyTheme(e.matches ? "dark" : "light");
      };
      if (mq.addEventListener) mq.addEventListener("change", listener);
      else if (mq.addListener) mq.addListener(listener);
    }
  }

  /* ------------------------------------------------------------------ *
   * 2. Mobile navigation
   * ------------------------------------------------------------------ */
  function initMobileNav() {
    var toggle = $("[data-nav-toggle]");
    var drawer = $("[data-mobile-nav]");
    if (!toggle || !drawer) return;

    function setOpen(open) {
      drawer.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
      if (open) {
        var first = drawer.querySelector("a, button");
        if (first) first.focus();
      }
    }

    on(toggle, "click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    on(document, "keydown", function (e) {
      if (e.key === "Escape" && drawer.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    $$("a", drawer).forEach(function (link) {
      on(link, "click", function () {
        setOpen(false);
      });
    });

    /* Close when the viewport grows past the breakpoint. */
    on(window, "resize", function () {
      if (window.innerWidth >= 900 && drawer.classList.contains("is-open")) {
        setOpen(false);
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * 3. Sticky header state
   * ------------------------------------------------------------------ */
  function initHeader() {
    var header = $("[data-header]");
    if (!header) return;

    var ticking = false;
    function update() {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
      ticking = false;
    }
    update();

    on(
      window,
      "scroll",
      function () {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
  }

  /* ------------------------------------------------------------------ *
   * 4. Copy to clipboard
   *    Markup: <button data-copy="#target-id">  or  data-copy-text="..."
   * ------------------------------------------------------------------ */
  var toastEl = null;
  var toastTimer = null;

  function showToast(message) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      toastEl.innerHTML =
        '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2"' +
        ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M4 10.5l4 4 8-9"/></svg><span></span>';
      document.body.appendChild(toastEl);
    }
    toastEl.querySelector("span").textContent = message;
    toastEl.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toastEl.classList.remove("is-visible");
    }, 1900);
  }

  /* Clipboard API is unavailable on file:// in some browsers — fall back. */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () {
        return legacyCopy(text);
      });
    }
    return legacyCopy(text);
  }

  function legacyCopy(text) {
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-1000px";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        var ok = document.execCommand("copy");
        document.body.removeChild(ta);
        ok ? resolve() : reject();
      } catch (err) {
        document.body.removeChild(ta);
        reject(err);
      }
    });
  }

  function initCopy() {
    $$("[data-copy], [data-copy-text]").forEach(function (btn) {
      on(btn, "click", function () {
        var text = btn.getAttribute("data-copy-text");

        if (!text) {
          var sel = btn.getAttribute("data-copy");
          var target = sel ? $(sel) : null;
          if (!target) {
            /* Fall back to the nearest code block. In a tabbed block that
               means the panel currently on screen, not the first one in the
               markup. */
            var block = btn.closest(".code-block");
            if (block) {
              target =
                $("[data-tabpanel]:not([hidden]) code", block) || $("pre code", block);
            }
          }
          if (!target) return;
          text = target.innerText;
        }

        copyText(text).then(
          function () {
            btn.classList.add("is-copied");
            var label = btn.querySelector("[data-copy-label]");
            var original = label ? label.textContent : null;
            if (label) label.textContent = "Copied";
            showToast(btn.getAttribute("data-copy-message") || "Copied to clipboard");
            window.setTimeout(function () {
              btn.classList.remove("is-copied");
              if (label && original !== null) label.textContent = original;
            }, 1900);
          },
          function () {
            showToast("Press " + (isMac() ? "⌘" : "Ctrl") + "+C to copy");
          }
        );
      });
    });
  }

  function isMac() {
    return /Mac|iPod|iPhone|iPad/.test(navigator.platform || "");
  }

  /* ------------------------------------------------------------------ *
   * 5. Accessible tabs
   *    <div data-tabs>
   *      <div role="tablist"> <button role="tab" aria-controls="p1"> …
   *      <div role="tabpanel" id="p1" data-tabpanel> …
   * ------------------------------------------------------------------ */
  function initTabs() {
    $$("[data-tabs]").forEach(function (group) {
      var tabs = $$('[role="tab"]', group);
      if (!tabs.length) return;

      function select(tab, focus) {
        tabs.forEach(function (t) {
          var selected = t === tab;
          t.setAttribute("aria-selected", selected ? "true" : "false");
          t.setAttribute("tabindex", selected ? "0" : "-1");
          var panel = document.getElementById(t.getAttribute("aria-controls"));
          if (panel) panel.hidden = !selected;
        });
        if (focus) tab.focus();
      }

      tabs.forEach(function (tab, i) {
        on(tab, "click", function () {
          select(tab, false);
        });

        on(tab, "keydown", function (e) {
          var idx = null;
          switch (e.key) {
            case "ArrowRight":
            case "ArrowDown":
              idx = (i + 1) % tabs.length;
              break;
            case "ArrowLeft":
            case "ArrowUp":
              idx = (i - 1 + tabs.length) % tabs.length;
              break;
            case "Home":
              idx = 0;
              break;
            case "End":
              idx = tabs.length - 1;
              break;
            default:
              return;
          }
          e.preventDefault();
          select(tabs[idx], true);
        });
      });

      /* Normalise initial state from the markup. */
      var initial =
        tabs.filter(function (t) {
          return t.getAttribute("aria-selected") === "true";
        })[0] || tabs[0];
      select(initial, false);
    });
  }

  /* ------------------------------------------------------------------ *
   * 6. Scroll reveal
   * ------------------------------------------------------------------ */
  function initReveal() {
    var items = $$(".reveal");
    if (!items.length) return;

    var reduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced || !("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    items.forEach(function (el) {
      io.observe(el);
    });
  }

  /* ------------------------------------------------------------------ *
   * 7. Scroll-spy for the docs sidebar
   * ------------------------------------------------------------------ */
  function initScrollSpy() {
    var nav = $("[data-spy]");
    if (!nav || !("IntersectionObserver" in window)) return;

    var links = $$('a[href^="#"]', nav);
    var map = {};
    var targets = [];

    links.forEach(function (link) {
      var id = link.getAttribute("href").slice(1);
      var section = document.getElementById(id);
      if (section) {
        map[id] = link;
        targets.push(section);
      }
    });
    if (!targets.length) return;

    var visible = {};
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          visible[entry.target.id] = entry.isIntersecting;
        });
        var activeId = null;
        for (var i = 0; i < targets.length; i++) {
          if (visible[targets[i].id]) {
            activeId = targets[i].id;
            break;
          }
        }
        if (!activeId) return;
        links.forEach(function (l) {
          l.classList.remove("is-active");
        });
        if (map[activeId]) map[activeId].classList.add("is-active");
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );

    targets.forEach(function (t) {
      io.observe(t);
    });
  }

  /* ------------------------------------------------------------------ *
   * 8. Misc
   * ------------------------------------------------------------------ */
  function initYear() {
    $$("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* Range inputs: paint the filled portion of the track (WebKit). */
  function initRangeFill() {
    function paint(input) {
      var min = parseFloat(input.min || "0");
      var max = parseFloat(input.max || "100");
      var val = parseFloat(input.value || "0");
      var pct = max > min ? ((val - min) / (max - min)) * 100 : 0;
      input.style.setProperty("--fill", pct + "%");
    }
    $$('input[type="range"]').forEach(function (input) {
      paint(input);
      on(input, "input", function () {
        paint(input);
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */
  function boot() {
    initTheme();
    initMobileNav();
    initHeader();
    initCopy();
    initTabs();
    initReveal();
    initScrollSpy();
    initYear();
    initRangeFill();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  /* Expose a couple of helpers for the per-page scripts. */
  window.Lumen = {
    $: $,
    $$: $$,
    on: on,
    store: store,
    toast: showToast,
    copyText: copyText
  };
})();
