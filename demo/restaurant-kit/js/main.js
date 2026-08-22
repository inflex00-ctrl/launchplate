/* ==========================================================================
   EMBER & OAK — Restaurant & Café Kit
   main.js — every interactive behaviour in the kit.

   Vanilla JavaScript. No dependencies. Safe to load with `defer`.
   Everything degrades gracefully: with JS disabled the pages still read,
   the menu shows every category, and the forms submit normally.
   --------------------------------------------------------------------------
   MODULES
     1.  Theme toggle (persisted, try/catch guarded)
     2.  Mobile navigation drawer
     3.  Sticky header state
     4.  Scroll reveal (with automatic stagger)
     5.  Accessible tabs            [data-tabs]
     6.  Filter groups             [data-filter-group]
     7.  Lightbox                  [data-lightbox]
     8.  Accordion                 [data-accordion]
     9.  Hero parallax             [data-parallax]
     10. Opening-hours awareness   [data-hours]
     11. Animated counters         [data-count]
     12. Forms: validation + delivery via js/forms.js   [data-demo-form]
     13. Toasts
     14. Current year              [data-year]
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

  /* Storage that never throws — private mode, blocked cookies, file://. */
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

  var THEME_KEY = "emberoak-theme";

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

    /* Follow the OS until the visitor makes an explicit choice. */
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

    $$("a, button", drawer).forEach(function (el) {
      on(el, "click", function () {
        setOpen(false);
      });
    });

    on(window, "resize", function () {
      if (window.innerWidth >= 901 && drawer.classList.contains("is-open")) {
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
   * 4. Scroll reveal
   *    Add .reveal to anything. Add .stagger to a parent and its children
   *    are delayed automatically in document order.
   * ------------------------------------------------------------------ */

  function initReveal() {
    /* Auto-stagger: write the index into a custom property. */
    $$(".stagger").forEach(function (parent) {
      $$(":scope > *", parent).forEach(function (child, i) {
        child.style.setProperty("--i", String(i));
      });
    });

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
  }

  /* ------------------------------------------------------------------ *
   * 5. Accessible tabs
   *    <div data-tabs>
   *      <div role="tablist">
   *        <button role="tab" aria-controls="panel-1" aria-selected="true">
   *      <div role="tabpanel" id="panel-1">
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
          if (!panel) return;

          if (selected) {
            panel.hidden = false;
            /* Restart the entry animation so switching always feels alive. */
            if (!prefersReducedMotion()) {
              panel.style.animation = "none";
              /* force reflow */
              void panel.offsetWidth;
              panel.style.animation = "";
            }
          } else {
            panel.hidden = true;
          }
        });

        if (focus) tab.focus();

        /* Keep the active tab in view inside a scrolling tablist. */
        if (tab.scrollIntoView) {
          try {
            tab.scrollIntoView({
              block: "nearest",
              inline: "nearest",
              behavior: prefersReducedMotion() ? "auto" : "smooth"
            });
          } catch (err) {
            /* older browsers */
          }
        }
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
   * 6. Filter groups
   *    <div data-filter-group="gallery">
   *      <button data-filter="food" aria-pressed="false">
   *    <div data-filter-target="gallery">
   *      <button data-filter-tags="food interior">
   * ------------------------------------------------------------------ */

  function initFilters() {
    $$("[data-filter-group]").forEach(function (bar) {
      var name = bar.getAttribute("data-filter-group");
      var target = $('[data-filter-target="' + name + '"]');
      if (!target) return;

      var buttons = $$("[data-filter]", bar);
      var items = $$("[data-filter-tags]", target);
      var counter = $("[data-filter-count]", bar);
      var empty = $("[data-filter-empty]", target);
      var live = $('[data-filter-live="' + name + '"]');

      function apply(value) {
        var shown = 0;

        items.forEach(function (item) {
          var tags = (item.getAttribute("data-filter-tags") || "").split(/\s+/);
          var match = value === "all" || tags.indexOf(value) > -1;

          if (match) {
            var wasHidden = item.classList.contains("is-filtered-out");
            item.classList.remove("is-filtered-out");
            item.removeAttribute("aria-hidden");
            if (wasHidden && !prefersReducedMotion()) {
              item.classList.remove("is-entering");
              void item.offsetWidth;
              item.classList.add("is-entering");
            }
            shown++;
          } else {
            item.classList.add("is-filtered-out");
            item.classList.remove("is-entering");
            item.setAttribute("aria-hidden", "true");
          }
        });

        buttons.forEach(function (btn) {
          btn.setAttribute(
            "aria-pressed",
            btn.getAttribute("data-filter") === value ? "true" : "false"
          );
        });

        if (counter) {
          counter.textContent =
            shown + (shown === 1 ? " item" : " items");
        }

        if (empty) empty.hidden = shown !== 0;

        if (live) {
          live.textContent =
            shown === 0
              ? "No items match that filter."
              : "Showing " + shown + (shown === 1 ? " item." : " items.");
        }
      }

      buttons.forEach(function (btn) {
        on(btn, "click", function () {
          apply(btn.getAttribute("data-filter"));
        });
      });

      var initial =
        buttons.filter(function (b) {
          return b.getAttribute("aria-pressed") === "true";
        })[0] || buttons[0];

      if (initial) apply(initial.getAttribute("data-filter"));
    });
  }

  /* ------------------------------------------------------------------ *
   * 7. Lightbox
   *    Openers:  <button data-lightbox data-lb-title="…" data-lb-meta="…"
   *                      data-lb-art="ph ph-dish ph-dish--octopus">
   *    Only visible (non-filtered) items take part in prev/next.
   * ------------------------------------------------------------------ */

  function initLightbox() {
    var openers = $$("[data-lightbox]");
    if (!openers.length) return;

    var lb = document.createElement("div");
    lb.className = "lightbox";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "Image viewer");
    lb.innerHTML =
      '<div class="lightbox-bar">' +
      '<span data-lb-index></span>' +
      '<button type="button" class="lightbox-close" data-lb-close>' +
      '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"' +
      ' stroke-linecap="round" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15"/></svg>' +
      "Close</button>" +
      "</div>" +
      '<div class="lightbox-stage">' +
      '<figure class="lightbox-figure">' +
      '<div class="ph" data-lb-art></div>' +
      "<figcaption><span data-lb-title></span><small data-lb-meta></small></figcaption>" +
      "</figure>" +
      "</div>" +
      '<div class="lightbox-nav">' +
      '<button type="button" class="lightbox-btn" data-lb-prev aria-label="Previous image">' +
      '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.9"' +
      ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12 4l-6 6 6 6"/></svg></button>' +
      '<button type="button" class="lightbox-btn" data-lb-next aria-label="Next image">' +
      '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.9"' +
      ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M8 4l6 6-6 6"/></svg></button>' +
      "</div>";

    document.body.appendChild(lb);

    var art = $("[data-lb-art]", lb);
    var titleEl = $("[data-lb-title]", lb);
    var metaEl = $("[data-lb-meta]", lb);
    var indexEl = $("[data-lb-index]", lb);
    var closeBtn = $("[data-lb-close]", lb);
    var prevBtn = $("[data-lb-prev]", lb);
    var nextBtn = $("[data-lb-next]", lb);

    var pool = [];
    var pos = 0;
    var lastFocus = null;

    function visibleOpeners() {
      return openers.filter(function (o) {
        return !o.closest(".is-filtered-out") && !o.classList.contains("is-filtered-out");
      });
    }

    function render() {
      var el = pool[pos];
      if (!el) return;

      art.className = el.getAttribute("data-lb-art") || "ph";
      titleEl.textContent = el.getAttribute("data-lb-title") || "";
      metaEl.textContent = el.getAttribute("data-lb-meta") || "";
      indexEl.textContent = pos + 1 + " of " + pool.length;

      var multiple = pool.length > 1;
      prevBtn.hidden = !multiple;
      nextBtn.hidden = !multiple;
    }

    function open(el) {
      pool = visibleOpeners();
      pos = Math.max(0, pool.indexOf(el));
      render();
      lastFocus = document.activeElement;
      lb.classList.add("is-open");
      document.body.style.overflow = "hidden";
      closeBtn.focus();
    }

    function close() {
      lb.classList.remove("is-open");
      document.body.style.overflow = "";
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function step(delta) {
      if (!pool.length) return;
      pos = (pos + delta + pool.length) % pool.length;
      render();
    }

    openers.forEach(function (el) {
      on(el, "click", function () {
        open(el);
      });
    });

    on(closeBtn, "click", close);
    on(prevBtn, "click", function () { step(-1); });
    on(nextBtn, "click", function () { step(1); });

    on(lb, "click", function (e) {
      if (e.target === lb || e.target.classList.contains("lightbox-stage")) close();
    });

    on(document, "keydown", function (e) {
      if (!lb.classList.contains("is-open")) return;

      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      } else if (e.key === "Tab") {
        /* Simple focus trap across the three controls. */
        var focusables = [closeBtn, prevBtn, nextBtn].filter(function (b) {
          return !b.hidden;
        });
        var i = focusables.indexOf(document.activeElement);
        e.preventDefault();
        var nextIndex = e.shiftKey ? i - 1 : i + 1;
        if (nextIndex < 0) nextIndex = focusables.length - 1;
        if (nextIndex >= focusables.length) nextIndex = 0;
        focusables[nextIndex].focus();
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * 8. Accordion
   * ------------------------------------------------------------------ */

  function initAccordion() {
    $$("[data-accordion]").forEach(function (acc) {
      var single = acc.getAttribute("data-accordion") === "single";
      var triggers = $$(".acc-trigger", acc);

      triggers.forEach(function (trigger) {
        on(trigger, "click", function () {
          var open = trigger.getAttribute("aria-expanded") === "true";

          if (single && !open) {
            triggers.forEach(function (t) {
              t.setAttribute("aria-expanded", "false");
            });
          }

          trigger.setAttribute("aria-expanded", open ? "false" : "true");
        });
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * 9. Hero parallax — a few pixels only, and never for reduced motion.
   * ------------------------------------------------------------------ */

  function initParallax() {
    var layers = $$("[data-parallax]");
    if (!layers.length || prefersReducedMotion()) return;
    if (window.matchMedia && window.matchMedia("(max-width: 700px)").matches) return;

    var ticking = false;

    function update() {
      var y = window.scrollY;
      layers.forEach(function (layer) {
        var speed = parseFloat(layer.getAttribute("data-parallax")) || 0.1;
        var offset = Math.max(-60, Math.min(60, y * speed));
        layer.style.transform = "translate3d(0," + offset.toFixed(1) + "px,0)";
      });
      ticking = false;
    }

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

    update();
  }

  /* ------------------------------------------------------------------ *
   * 10. Opening hours
   *     Marks today's row and prints an open/closed badge.
   *     Markup: <tr data-day="4">  … 0 = Sunday
   *             <span data-hours-status data-open-from="17:30" data-open-to="23:00">
   * ------------------------------------------------------------------ */

  function initHours() {
    var today = new Date().getDay();

    $$("[data-day]").forEach(function (row) {
      if (parseInt(row.getAttribute("data-day"), 10) === today) {
        row.classList.add("is-today");
        var marker = row.querySelector("[data-today-label]");
        if (marker) marker.hidden = false;
      }
    });

    $$("[data-hours-status]").forEach(function (badge) {
      var from = badge.getAttribute("data-open-from");
      var to = badge.getAttribute("data-open-to");
      var closedDays = (badge.getAttribute("data-closed-days") || "")
        .split(",")
        .map(function (d) { return parseInt(d, 10); })
        .filter(function (d) { return !isNaN(d); });

      if (!from || !to) return;

      var now = new Date();
      var mins = now.getHours() * 60 + now.getMinutes();

      function toMins(hhmm) {
        var parts = hhmm.split(":");
        return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || "0", 10);
      }

      var openNow =
        closedDays.indexOf(now.getDay()) === -1 &&
        mins >= toMins(from) &&
        mins <= toMins(to);

      badge.textContent = openNow ? "Open now" : "Closed right now";
      badge.classList.toggle("badge-dot--closed", !openNow);
    });
  }

  /* ------------------------------------------------------------------ *
   * 11. Animated counters
   *     <span data-count="1200" data-count-suffix="+">0</span>
   * ------------------------------------------------------------------ */

  function initCounters() {
    var els = $$("[data-count]");
    if (!els.length) return;

    function paint(el, value) {
      var decimals = parseInt(el.getAttribute("data-count-decimals") || "0", 10);
      el.textContent =
        (el.getAttribute("data-count-prefix") || "") +
        value.toFixed(decimals) +
        (el.getAttribute("data-count-suffix") || "");
    }

    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      els.forEach(function (el) {
        paint(el, parseFloat(el.getAttribute("data-count")) || 0);
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          io.unobserve(el);

          var target = parseFloat(el.getAttribute("data-count")) || 0;
          var duration = 1300;
          var start = null;

          function frame(ts) {
            if (start === null) start = ts;
            var p = Math.min(1, (ts - start) / duration);
            /* easeOutExpo */
            var eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
            paint(el, target * eased);
            if (p < 1) window.requestAnimationFrame(frame);
          }

          window.requestAnimationFrame(frame);
        });
      },
      { threshold: 0.4 }
    );

    els.forEach(function (el) {
      paint(el, 0);
      io.observe(el);
    });
  }

  /* ------------------------------------------------------------------ *
   * 12. Forms
   *     Any <form data-demo-form> validates in the browser, then hands the
   *     submission to js/forms.js, which posts it to whichever provider is
   *     named in config.js. The success panel and toast below are shown
   *     only when the send actually succeeded.
   * ------------------------------------------------------------------ */

  function initForms() {
    /* Stop people booking a table in the past. */
    $$('input[type="date"][data-min-today]').forEach(function (input) {
      var now = new Date();
      var iso =
        now.getFullYear() +
        "-" +
        String(now.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(now.getDate()).padStart(2, "0");
      input.min = iso;
      if (!input.value && input.hasAttribute("data-default-today")) input.value = iso;
    });

    $$("[data-demo-form]").forEach(function (form) {
      var status = $("[data-form-status]", form) || $("#" + form.id + "-status");

      /* forms.js does the actual delivery; manage() stops it attaching a
         second handler and plants the honeypot and time-trap. */
      if (window.SiteForms) window.SiteForms.manage(form);

      function fieldOf(control) {
        return control.closest(".field") || control.closest("fieldset");
      }

      function validateControl(control) {
        var wrap = fieldOf(control);
        if (!wrap) return control.checkValidity();

        var valid = control.checkValidity();
        wrap.classList.toggle("is-invalid", !valid);

        var msg = wrap.querySelector(".field-error");
        if (msg && !valid) {
          msg.textContent =
            control.getAttribute("data-error") || control.validationMessage;
        }
        return valid;
      }

      $$("input, select, textarea", form).forEach(function (control) {
        on(control, "blur", function () {
          if (control.value !== "" || control.required) validateControl(control);
        });
        on(control, "input", function () {
          var wrap = fieldOf(control);
          if (wrap && wrap.classList.contains("is-invalid")) validateControl(control);
        });
      });

      on(form, "submit", function (e) {
        e.preventDefault();

        /* Honeypot: a filled hidden field means a bot. Pretend success. */
        var hp = form.querySelector(".hp input");
        if (hp && hp.value) return;

        var controls = $$("input, select, textarea", form);
        var firstBad = null;

        controls.forEach(function (control) {
          if (control.type === "hidden") return;
          if (!validateControl(control) && !firstBad) firstBad = control;
        });

        if (firstBad) {
          firstBad.focus();
          if (firstBad.scrollIntoView) {
            firstBad.scrollIntoView({
              block: "center",
              behavior: prefersReducedMotion() ? "auto" : "smooth"
            });
          }
          showToast("Please check the highlighted fields");
          return;
        }

        var btn = form.querySelector('button[type="submit"], .btn[type="submit"]');

        function reveal(ok, message) {
          if (status) {
            var body = status.querySelector("div") || status.querySelector("span");
            if (body) {
              body.innerHTML = ok
                ? "<strong>" +
                  (form.getAttribute("data-success-title") || "Thank you — that has been sent.") +
                  "</strong> " + message
                : "<strong>Not sent.</strong> " + message;
            }
            status.classList.add("is-visible");
            status.classList.toggle("form-status--error", !ok);
            status.setAttribute("data-form-state", ok ? "ok" : "error");
            status.setAttribute("tabindex", "-1");
            status.focus();
            if (status.scrollIntoView) {
              status.scrollIntoView({
                block: "center",
                behavior: prefersReducedMotion() ? "auto" : "smooth"
              });
            }
          }
          showToast(
            ok
              ? form.getAttribute("data-success-toast") || "Request sent"
              : "Could not send — please try again"
          );
        }

        /* Real delivery through forms.js. Unconfigured, it opens the
           visitor's mail client rather than faking a success. */
        if (!window.SiteForms) {
          reveal(true, "This template has no form script loaded. See SETUP.md.");
          form.reset();
          return;
        }

        window.SiteForms.setBusy(btn, true);
        window.SiteForms.send(form).then(function (result) {
          window.SiteForms.setBusy(btn, false);
          reveal(result.ok, result.message);
          if (result.ok && result.mode !== "mailto") form.reset();
        });
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * 13. Toasts
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
    }, 2600);
  }

  /* ------------------------------------------------------------------ *
   * 14. Current year
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

  function boot() {
    initTheme();
    initMobileNav();
    initHeader();
    initReveal();
    initTabs();
    initFilters();
    initLightbox();
    initAccordion();
    initParallax();
    initHours();
    initCounters();
    initForms();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
