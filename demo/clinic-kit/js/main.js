/* ==========================================================================
   BRIGHTWATER — Dental & Medical Clinic Kit
   main.js — shared behaviour for every page.

   Vanilla JavaScript. No dependencies, no build step. Loaded with `defer`,
   so the DOM is ready by the time this runs.

   Every module is defensive: if the markup it looks for is missing, it
   returns quietly. You can delete any page's markup without breaking the
   others.
   --------------------------------------------------------------------------
   MODULES
     1.  Theme toggle (persisted, try/catch guarded)
     2.  Mobile navigation drawer
     3.  Sticky header state
     4.  Accessible tabs            [data-tabs]
     5.  Filter chips               [data-filter] / [data-filter-item]
     6.  Accordion                  [data-accordion]
     7.  Scroll reveal              .reveal
     8.  Animated counters          [data-count]
     9.  Hero parallax              [data-parallax]
     10. Forms: validation + demo submit   [data-form]
     11. Time-slot picker           [data-slots]
     12. "Open now" / today's hours [data-hours]
     13. Copy to clipboard + toast  [data-copy-text]
     14. :has() fallback for radio cards
     15. Current year               [data-year]
   ========================================================================== */

(function () {
  "use strict";

  var root = document.documentElement;

  /* ------------------------------------------------------------------ *
   * Helpers
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

  function prefersReducedMotion() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  /* localStorage that never throws: private browsing, blocked cookies and
     some file:// contexts all reject access. */
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
   *    The matching no-flash snippet lives inline in each page's <head>.
   * ------------------------------------------------------------------ */

  var THEME_KEY = "brightwater-theme";

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

    /* Keep the address-bar colour in step with the palette. */
    var meta = $('meta[name="theme-color"]:not([media])');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#08151a" : "#f7fbfc");
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
   * 2. Mobile navigation drawer
   * ------------------------------------------------------------------ */

  function initMobileNav() {
    var toggle = $("[data-nav-toggle]");
    var drawer = $("[data-mobile-nav]");
    if (!toggle || !drawer) return;

    function setOpen(open) {
      drawer.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
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

    on(window, "resize", function () {
      if (window.innerWidth > 1020 && drawer.classList.contains("is-open")) {
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
   * 4. Accessible tabs
   *
   *    <div data-tabs>
   *      <div role="tablist" aria-label="…">
   *        <button role="tab" id="t1" aria-controls="p1" aria-selected="true">
   *      <div role="tabpanel" id="p1" aria-labelledby="t1" data-tabpanel>
   *
   *    Arrow keys move between tabs, Home/End jump to the ends.
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
          if (panel) {
            panel.hidden = !selected;
            /* Restart the entry animation on the panel that just opened. */
            if (selected && !prefersReducedMotion()) {
              panel.style.animation = "none";
              /* force reflow so the animation can be re-applied */
              void panel.offsetWidth;
              panel.style.animation = "";
            }
          }
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

      var initial =
        tabs.filter(function (t) {
          return t.getAttribute("aria-selected") === "true";
        })[0] || tabs[0];

      select(initial, false);
    });
  }

  /* ------------------------------------------------------------------ *
   * 5. Filter chips
   *
   *    <div data-filter="#results">
   *      <button class="filter-btn" data-filter-value="all" aria-pressed="true">
   *    <div id="results">
   *      <article data-filter-item data-tags="preventive cosmetic">
   *
   *    Buttons are real <button>s so they are keyboard-operable for free;
   *    aria-pressed communicates the active chip.
   * ------------------------------------------------------------------ */

  function initFilters() {
    $$("[data-filter]").forEach(function (bar) {
      var targetSel = bar.getAttribute("data-filter");
      var target = targetSel ? $(targetSel) : null;
      if (!target) return;

      var buttons = $$("[data-filter-value]", bar);
      var items = $$("[data-filter-item]", target);
      var live = $(bar.getAttribute("data-filter-status") || "#filter-status");

      function apply(value) {
        var shown = 0;

        items.forEach(function (item) {
          var tags = (item.getAttribute("data-tags") || "").split(/\s+/);
          var match = value === "all" || tags.indexOf(value) !== -1;

          if (match) {
            shown++;
            if (item.classList.contains("is-hidden")) {
              item.classList.remove("is-hidden");
              item.classList.add("is-entering");
              /* Next frame, drop the entering class so it transitions in. */
              window.requestAnimationFrame(function () {
                window.requestAnimationFrame(function () {
                  item.classList.remove("is-entering");
                });
              });
            }
          } else {
            item.classList.add("is-hidden");
            item.classList.remove("is-entering");
          }
        });

        buttons.forEach(function (b) {
          b.setAttribute(
            "aria-pressed",
            b.getAttribute("data-filter-value") === value ? "true" : "false"
          );
        });

        if (live) {
          live.textContent =
            shown + (shown === 1 ? " item shown" : " items shown");
        }
      }

      buttons.forEach(function (btn) {
        on(btn, "click", function () {
          apply(btn.getAttribute("data-filter-value"));
        });
      });

      var initial =
        buttons.filter(function (b) {
          return b.getAttribute("aria-pressed") === "true";
        })[0] || buttons[0];

      if (initial) apply(initial.getAttribute("data-filter-value"));
    });
  }

  /* ------------------------------------------------------------------ *
   * 6. Accordion
   *
   *    <div data-accordion>            (add data-accordion="single" to make
   *      <div class="acc-item">         opening one close the others)
   *        <h3><button class="acc-trigger" aria-expanded="false"
   *             aria-controls="p1">…</button></h3>
   *        <div class="acc-panel" id="p1"><div>…</div></div>
   * ------------------------------------------------------------------ */

  function initAccordion() {
    $$("[data-accordion]").forEach(function (group) {
      var single = group.getAttribute("data-accordion") === "single";
      var triggers = $$(".acc-trigger", group);

      triggers.forEach(function (trigger) {
        var item = trigger.closest(".acc-item");
        var panel = document.getElementById(trigger.getAttribute("aria-controls"));
        if (!item || !panel) return;

        /* Normalise the starting state from the markup. */
        var open = trigger.getAttribute("aria-expanded") === "true";
        item.classList.toggle("is-open", open);

        on(trigger, "click", function () {
          var isOpen = trigger.getAttribute("aria-expanded") === "true";

          if (single && !isOpen) {
            triggers.forEach(function (other) {
              if (other === trigger) return;
              other.setAttribute("aria-expanded", "false");
              var otherItem = other.closest(".acc-item");
              if (otherItem) otherItem.classList.remove("is-open");
            });
          }

          trigger.setAttribute("aria-expanded", isOpen ? "false" : "true");
          item.classList.toggle("is-open", !isOpen);
        });
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * 7. Scroll reveal
   * ------------------------------------------------------------------ */

  function initReveal() {
    var items = $$(".reveal");
    if (!items.length) return;

    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
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
      { rootMargin: "0px 0px -7% 0px", threshold: 0.06 }
    );

    items.forEach(function (el) {
      io.observe(el);
    });

    /* Anything already above the fold on load should not wait for a scroll
       event that may never come on a short page. */
    window.setTimeout(function () {
      items.forEach(function (el) {
        var box = el.getBoundingClientRect();
        if (box.top < window.innerHeight) el.classList.add("is-visible");
      });
    }, 60);
  }

  /* ------------------------------------------------------------------ *
   * 8. Animated counters
   *    <span data-count="1200" data-count-suffix="+">1,200+</span>
   * ------------------------------------------------------------------ */

  function initCounters() {
    var els = $$("[data-count]");
    if (!els.length) return;

    if (prefersReducedMotion() || !("IntersectionObserver" in window)) return;

    function run(el) {
      var target = parseFloat(el.getAttribute("data-count"));
      if (isNaN(target)) return;

      var suffix = el.getAttribute("data-count-suffix") || "";
      var prefix = el.getAttribute("data-count-prefix") || "";
      var decimals = parseInt(el.getAttribute("data-count-decimals") || "0", 10);
      var duration = parseInt(el.getAttribute("data-count-duration") || "1400", 10);
      var start = null;

      function frame(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        /* easeOutCubic */
        var eased = 1 - Math.pow(1 - p, 3);
        var value = target * eased;

        el.textContent =
          prefix +
          value.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
          }) +
          suffix;

        if (p < 1) window.requestAnimationFrame(frame);
      }

      window.requestAnimationFrame(frame);
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            run(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );

    els.forEach(function (el) {
      io.observe(el);
    });
  }

  /* ------------------------------------------------------------------ *
   * 9. Hero parallax
   *    Writes a small translate on [data-parallax] as the page scrolls.
   *    data-parallax="0.12" sets the strength (default 0.1).
   * ------------------------------------------------------------------ */

  function initParallax() {
    var els = $$("[data-parallax]");
    if (!els.length || prefersReducedMotion()) return;
    if (window.innerWidth < 760) return;

    var ticking = false;

    function update() {
      var y = window.scrollY;
      els.forEach(function (el) {
        var strength = parseFloat(el.getAttribute("data-parallax")) || 0.1;
        var offset = Math.max(Math.min(y * strength, 90), -90);
        el.style.setProperty("--par", offset.toFixed(1) + "px");
      });
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
   * 10. Forms — client-side validation and a demo submit
   *
   *     This template has no back end. On a valid submit we show the
   *     .form-status banner instead of posting anywhere. Wire your own
   *     endpoint by replacing the marked block below.
   * ------------------------------------------------------------------ */

  function initForms() {
    $$("[data-form]").forEach(function (form) {
      var status = $(".form-status", form) || $("#" + form.id + "-status");

      function fieldOf(control) {
        return control.closest(".field") || control.closest(".fieldset");
      }

      function validate(control) {
        var wrap = fieldOf(control);
        if (!wrap) return control.checkValidity();

        var ok = control.checkValidity();
        wrap.classList.toggle("is-invalid", !ok);

        var msg = $(".field-error span", wrap);
        if (msg && !ok) {
          msg.textContent =
            control.getAttribute("data-error") || control.validationMessage;
        }
        return ok;
      }

      /* Validate on blur once the visitor has left a field, and clear the
         error as soon as they start fixing it. */
      $$("input, select, textarea", form).forEach(function (control) {
        on(control, "blur", function () {
          if (control.value !== "" || control.required) validate(control);
        });

        on(control, "input", function () {
          var wrap = fieldOf(control);
          if (wrap && wrap.classList.contains("is-invalid")) validate(control);
        });
      });

      on(form, "submit", function (e) {
        e.preventDefault();

        var firstBad = null;
        $$("input, select, textarea", form).forEach(function (control) {
          if (control.disabled || control.type === "hidden") return;
          if (!validate(control) && !firstBad) firstBad = control;
        });

        if (firstBad) {
          firstBad.focus();
          if (status) {
            status.classList.add("is-visible", "form-status--error");
            var errText = $("[data-status-text]", status);
            if (errText) {
              errText.innerHTML =
                "<strong>Please check the highlighted fields.</strong> " +
                "A few details are missing or need correcting.";
            }
          }
          return;
        }

        /* ---- Replace this block with your own submission ----------------
           fetch("/api/appointments", {
             method: "POST",
             body: new FormData(form)
           });
           ---------------------------------------------------------------- */

        if (status) {
          status.classList.remove("form-status--error");
          status.classList.add("is-visible");
          var text = $("[data-status-text]", status);
          if (text) {
            text.innerHTML =
              "<strong>" +
              (form.getAttribute("data-success-title") || "Request received.") +
              "</strong> " +
              (form.getAttribute("data-success-body") ||
                "This is a demonstration form — no data was sent. Connect it to your own booking system or inbox before going live.");
          }
          status.setAttribute("tabindex", "-1");
          status.focus();
          status.scrollIntoView({
            behavior: prefersReducedMotion() ? "auto" : "smooth",
            block: "center"
          });
        }

        form.reset();
        $$(".radio-card", form).forEach(function (c) {
          c.classList.remove("is-checked");
        });
        $$(".slot", form).forEach(function (s) {
          s.setAttribute("aria-pressed", "false");
        });
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * 11. Time-slot picker
   *     <div data-slots data-slots-input="#preferred-time">
   *       <button type="button" class="slot" aria-pressed="false">09:00</button>
   * ------------------------------------------------------------------ */

  function initSlots() {
    $$("[data-slots]").forEach(function (group) {
      var inputSel = group.getAttribute("data-slots-input");
      var input = inputSel ? $(inputSel) : null;
      var slots = $$(".slot", group);

      slots.forEach(function (slot) {
        on(slot, "click", function () {
          if (slot.disabled) return;

          slots.forEach(function (s) {
            s.setAttribute("aria-pressed", s === slot ? "true" : "false");
          });

          if (input) {
            input.value = slot.getAttribute("data-value") || slot.textContent.trim();
          }
        });
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * 12. Today's opening hours
   *     Highlights the current day inside [data-hours] and, where the
   *     markup provides [data-open-state], says whether the clinic is open.
   * ------------------------------------------------------------------ */

  function initHours() {
    $$("[data-hours]").forEach(function (list) {
      var todayIndex = new Date().getDay(); /* 0 = Sunday */
      $$("[data-day]", list).forEach(function (li) {
        var days = li.getAttribute("data-day").split(",");
        if (
          days.indexOf(String(todayIndex)) !== -1
        ) {
          li.classList.add("is-today");
        }
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * 13. Copy to clipboard + toast
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
        '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" ' +
        'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" ' +
        'aria-hidden="true"><path d="M4 10.5l4 4 8-9"/></svg><span></span>';
      document.body.appendChild(toastEl);
    }

    toastEl.querySelector("span").textContent = message;
    toastEl.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toastEl.classList.remove("is-visible");
    }, 2000);
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
        if (ok) resolve();
        else reject();
      } catch (err) {
        document.body.removeChild(ta);
        reject(err);
      }
    });
  }

  function copyText(text) {
    /* The async clipboard API is unavailable on file:// in some browsers. */
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () {
        return legacyCopy(text);
      });
    }
    return legacyCopy(text);
  }

  function initCopy() {
    $$("[data-copy-text]").forEach(function (btn) {
      on(btn, "click", function () {
        var text = btn.getAttribute("data-copy-text");
        copyText(text).then(
          function () {
            showToast(btn.getAttribute("data-copy-message") || "Copied");
          },
          function () {
            showToast("Copy failed — please select and copy manually");
          }
        );
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * 14. Radio-card fallback for browsers without :has()
   * ------------------------------------------------------------------ */

  function initRadioCards() {
    var supportsHas = false;
    try {
      supportsHas = CSS.supports("selector(:has(*))");
    } catch (err) {
      supportsHas = false;
    }
    if (supportsHas) return;

    $$(".radio-card input").forEach(function (input) {
      function sync() {
        var name = input.getAttribute("name");
        $$('.radio-card input[name="' + name + '"]').forEach(function (other) {
          var card = other.closest(".radio-card");
          if (card) card.classList.toggle("is-checked", other.checked);
        });
      }
      on(input, "change", sync);
      sync();
    });
  }

  /* ------------------------------------------------------------------ *
   * 15. Current year
   * ------------------------------------------------------------------ */

  function initYear() {
    var year = String(new Date().getFullYear());
    $$("[data-year]").forEach(function (el) {
      el.textContent = year;
    });
  }

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */

  function init() {
    initTheme();
    initMobileNav();
    initHeader();
    initTabs();
    initFilters();
    initAccordion();
    initReveal();
    initCounters();
    initParallax();
    initForms();
    initSlots();
    initHours();
    initCopy();
    initRadioCards();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
