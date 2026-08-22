/* =========================================================================
   MERIDIAN — Studio & Portfolio Kit
   Vanilla JS. No dependencies, no build step.
   Every module is optional: if its markup isn't on the page, it no-ops.
   ========================================================================= */

(function () {
  "use strict";

  var root = document.documentElement;
  var STORE_KEY = "meridian-theme";

  /* -----------------------------------------------------------------------
     Storage helpers — localStorage can throw in private mode / sandboxed
     iframes / when cookies are blocked, so every access is guarded.
     --------------------------------------------------------------------- */
  function readStore(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (err) {
      return null;
    }
  }

  function writeStore(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (err) {
      return false;
    }
  }

  function on(el, type, handler, opts) {
    if (el) el.addEventListener(type, handler, opts || false);
  }

  function all(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  /* =======================================================================
     1 · THEME TOGGLE
     The no-flash script in each <head> has already applied the stored theme.
     This wires the button, keeps aria state honest and reacts to the OS
     preference changing while the page is open.
     ===================================================================== */
  function initTheme() {
    var toggle = document.querySelector("[data-theme-toggle]");
    var media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

    function resolved() {
      var explicit = root.getAttribute("data-theme");
      if (explicit === "dark" || explicit === "light") return explicit;
      return media && media.matches ? "dark" : "light";
    }

    function sync() {
      if (!toggle) return;
      var mode = resolved();
      toggle.setAttribute("aria-pressed", String(mode === "dark"));
      toggle.setAttribute(
        "aria-label",
        mode === "dark" ? "Switch to light theme" : "Switch to dark theme"
      );
      var live = document.getElementById("theme-status");
      if (live) live.textContent = mode === "dark" ? "Dark theme" : "Light theme";
    }

    on(toggle, "click", function () {
      var next = resolved() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      writeStore(STORE_KEY, next);
      sync();
    });

    if (media) {
      var listener = function () {
        if (!root.getAttribute("data-theme")) sync();
      };
      if (media.addEventListener) media.addEventListener("change", listener);
      else if (media.addListener) media.addListener(listener);
    }

    sync();
  }

  /* =======================================================================
     2 · MOBILE NAVIGATION
     Focus trap, Escape to close, scroll lock, restores focus on close.
     ===================================================================== */
  function initMobileNav() {
    var panel = document.getElementById("mobile-nav");
    var openBtn = document.querySelector("[data-nav-open]");
    var closeBtn = document.querySelector("[data-nav-close]");
    if (!panel || !openBtn) return;

    var lastFocused = null;

    function focusables() {
      return all("a[href], button:not([disabled]), input, select, textarea", panel).filter(
        function (el) { return el.offsetParent !== null; }
      );
    }

    function open() {
      lastFocused = document.activeElement;
      panel.setAttribute("data-open", "true");
      panel.removeAttribute("aria-hidden");
      openBtn.setAttribute("aria-expanded", "true");
      document.body.classList.add("is-locked");
      var items = focusables();
      if (items.length) items[0].focus();
    }

    function close() {
      panel.setAttribute("data-open", "false");
      panel.setAttribute("aria-hidden", "true");
      openBtn.setAttribute("aria-expanded", "false");
      document.body.classList.remove("is-locked");
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    on(openBtn, "click", open);
    on(closeBtn, "click", close);

    all("a", panel).forEach(function (link) { on(link, "click", close); });

    on(document, "keydown", function (e) {
      if (panel.getAttribute("data-open") !== "true") return;

      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }

      if (e.key === "Tab") {
        var items = focusables();
        if (!items.length) return;
        var first = items[0];
        var last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    // Close if the viewport grows past the mobile breakpoint
    if (window.matchMedia) {
      var wide = window.matchMedia("(min-width: 1001px)");
      var onWide = function (e) { if (e.matches) close(); };
      if (wide.addEventListener) wide.addEventListener("change", onWide);
      else if (wide.addListener) wide.addListener(onWide);
    }
  }

  /* =======================================================================
     3 · STICKY HEADER STATE
     ===================================================================== */
  function initHeader() {
    var header = document.querySelector(".site-header");
    if (!header) return;
    var ticking = false;

    function update() {
      header.classList.toggle("is-stuck", window.scrollY > 8);
      ticking = false;
    }

    on(window, "scroll", function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });

    update();
  }

  /* =======================================================================
     4 · WORK FILTER
     Buttons are real <button aria-pressed>, so it is keyboard-operable by
     default. Arrow keys move between filters like a toolbar. The result
     count is announced through an aria-live region.
     ===================================================================== */
  function initFilters() {
    var bar = document.querySelector("[data-filter-bar]");
    var grid = document.querySelector("[data-filter-grid]");
    if (!bar || !grid) return;

    var buttons = all("[data-filter]", bar);
    var cards = all("[data-categories]", grid);
    var count = document.querySelector("[data-filter-count]");
    var empty = document.querySelector("[data-filter-empty]");
    var reduced = window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

    function apply(value, animate) {
      var shown = 0;

      cards.forEach(function (card) {
        var cats = (card.getAttribute("data-categories") || "").split(/\s+/);
        var match = value === "all" || cats.indexOf(value) !== -1;

        card.hidden = !match;
        card.classList.remove("is-entering");

        if (match) {
          shown++;
          if (animate && !reduced) {
            // Restart the entrance animation with a small stagger
            card.style.animationDelay = Math.min(shown * 40, 320) + "ms";
            void card.offsetWidth;
            card.classList.add("is-entering");
          }
        }
      });

      buttons.forEach(function (btn) {
        btn.setAttribute("aria-pressed", String(btn.getAttribute("data-filter") === value));
      });

      if (count) {
        count.textContent = shown + (shown === 1 ? " project" : " projects");
      }
      if (empty) {
        empty.hidden = shown !== 0;
      }

      // Keep the URL shareable without adding history entries
      try {
        var url = new URL(window.location.href);
        if (value === "all") url.searchParams.delete("filter");
        else url.searchParams.set("filter", value);
        window.history.replaceState({}, "", url);
      } catch (err) { /* file:// URLs — ignore */ }
    }

    buttons.forEach(function (btn, i) {
      on(btn, "click", function () {
        apply(btn.getAttribute("data-filter"), true);
      });

      on(btn, "keydown", function (e) {
        var dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        var next = buttons[(i + dir + buttons.length) % buttons.length];
        next.focus();
      });
    });

    // Honour ?filter=identity on load
    var initial = "all";
    try {
      var param = new URL(window.location.href).searchParams.get("filter");
      if (param && buttons.some(function (b) { return b.getAttribute("data-filter") === param; })) {
        initial = param;
      }
    } catch (err) { /* ignore */ }

    apply(initial, false);
  }

  /* =======================================================================
     5 · ACCORDION
     ===================================================================== */
  function initAccordions() {
    all("[data-accordion]").forEach(function (accordion) {
      var triggers = all(".accordion__trigger", accordion);

      triggers.forEach(function (trigger, i) {
        var panel = document.getElementById(trigger.getAttribute("aria-controls"));
        if (!panel) return;

        on(trigger, "click", function () {
          var isOpen = trigger.getAttribute("aria-expanded") === "true";
          trigger.setAttribute("aria-expanded", String(!isOpen));
          panel.setAttribute("data-open", String(!isOpen));
        });

        on(trigger, "keydown", function (e) {
          var dir = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
          if (!dir) return;
          e.preventDefault();
          triggers[(i + dir + triggers.length) % triggers.length].focus();
        });
      });
    });
  }

  /* =======================================================================
     6 · SCROLL REVEAL
     Progressive enhancement — without JS or IntersectionObserver every
     element simply stays visible.
     ===================================================================== */
  function initReveal() {
    var items = all("[data-reveal]");
    if (!items.length) return;

    var reduced = window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

    // No observer, or the visitor asked for less motion: show everything, plainly.
    if (reduced || !("IntersectionObserver" in window)) return;

    // Only now do we let the CSS hide anything. If this script never runs,
    // or throws before this point, every element stays visible.
    root.classList.add("reveal-on");

    var revealed = 0;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealed++;
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });

    items.forEach(function (el) {
      // Stagger siblings that share a parent
      var index = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.setProperty("--reveal-delay", Math.min(index * 70, 280) + "ms");
      observer.observe(el);
    });

    // Watchdog. Elements above the fold should reveal within a few frames.
    // If nothing has fired by now the observer is not working (some headless
    // renderers, print-to-PDF services, old WebViews) — so we stand down
    // entirely rather than leave the page blank.
    window.setTimeout(function () {
      if (revealed === 0) {
        observer.disconnect();
        root.classList.remove("reveal-on");
      }
    }, 1200);
  }

  /* =======================================================================
     7 · PROJECT BRIEF FORM
     Client-side validation only — this is a static template, so there is no
     backend. Point the <form action> at your own endpoint (see README).
     ===================================================================== */
  function initForm() {
    var form = document.querySelector("[data-brief-form]");
    if (!form) return;

    var status = form.querySelector("[data-form-status]");

    /* forms.js delivers the brief; manage() stops it attaching a second
       handler and plants the honeypot and time-trap. */
    if (window.SiteForms) window.SiteForms.manage(form);

    function fieldOf(input) {
      return input.closest(".field") || input.closest(".fieldset");
    }

    function validate(input) {
      var wrap = fieldOf(input);
      if (!wrap) return input.checkValidity();
      var ok = input.checkValidity();
      wrap.classList.toggle("is-invalid", !ok);
      input.setAttribute("aria-invalid", String(!ok));
      return ok;
    }

    all("input, textarea, select", form).forEach(function (input) {
      on(input, "blur", function () {
        if (input.value !== "" || input.required) validate(input);
      });
      on(input, "input", function () {
        var wrap = fieldOf(input);
        if (wrap && wrap.classList.contains("is-invalid")) validate(input);
      });
    });

    on(form, "submit", function (e) {
      e.preventDefault();

      var firstBad = null;
      all("input, textarea, select", form).forEach(function (input) {
        if (input.type === "hidden") return;
        if (!validate(input) && !firstBad) firstBad = input;
      });

      if (firstBad) {
        firstBad.focus();
        if (status) {
          status.setAttribute("data-visible", "true");
          status.innerHTML =
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ' +
            'stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/>' +
            '<path d="M12 7.5v5"/><path d="M12 16.2h.01"/></svg>' +
            "<span><strong>Almost there.</strong> A few required fields still need your attention " +
            "— they are highlighted above.</span>";
        }
        return;
      }

      var TICK =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ' +
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="m4 12.5 5 5L20 6.5"/></svg>';
      var WARN =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ' +
        'stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/>' +
        '<path d="M12 7.5v5"/><path d="M12 16.2h.01"/></svg>';

      function reveal(ok, message) {
        if (!status) return;
        status.setAttribute("data-visible", "true");
        status.setAttribute("data-form-state", ok ? "ok" : "error");
        status.innerHTML =
          (ok ? TICK : WARN) +
          "<span><strong>" +
          (ok ? "Brief received — thank you." : "Not sent.") +
          "</strong> " + message + "</span>";
        status.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      /* Real delivery. Configure a provider in config.js and this posts
         for real; leave it blank and it opens the visitor's mail client
         instead of quietly doing nothing. */
      if (!window.SiteForms) {
        reveal(true, "This template has no form script loaded. See SETUP.md.");
        form.reset();
        return;
      }

      var button = form.querySelector('button[type="submit"], [type="submit"]');
      window.SiteForms.setBusy(button, true);

      window.SiteForms.send(form).then(function (result) {
        window.SiteForms.setBusy(button, false);
        reveal(result.ok, result.message);
        if (result.ok && result.mode !== "mailto") form.reset();
      });
    });
  }

  /* =======================================================================
     8 · MISC — current year in the footer
     ===================================================================== */
  function initYear() {
    all("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* =======================================================================
     BOOT
     ===================================================================== */
  function boot() {
    initTheme();
    initMobileNav();
    initHeader();
    initFilters();
    initAccordions();
    initReveal();
    initForm();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
