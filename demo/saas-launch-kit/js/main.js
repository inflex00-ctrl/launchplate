/* ==========================================================================
   NORTHWIND — SaaS Launch Kit
   main.js — all interactive behaviour. No dependencies, no build step.
   --------------------------------------------------------------------------
   Contents:
     1. Theme toggle (localStorage, try/catch guarded)
     2. Sticky header shadow state
     3. Mobile navigation
     4. Pricing: monthly / annual billing toggle
     5. Copy-to-clipboard for code blocks
     6. Scroll-spy for docs + legal side navigation
     7. Footer year
   ========================================================================== */

(function () {
  "use strict";

  var root = document.documentElement;

  /* ----------------------------------------------------------------------
     Safe storage helpers — private mode / disabled cookies must not break
     the page, so every access is wrapped.
     ---------------------------------------------------------------------- */
  var store = {
    get: function (key) {
      try { return window.localStorage.getItem(key); } catch (e) { return null; }
    },
    set: function (key, value) {
      try { window.localStorage.setItem(key, value); } catch (e) { /* ignore */ }
    }
  };

  /* ----------------------------------------------------------------------
     1. THEME
     The no-flash snippet in each page's <head> sets data-theme before paint.
     Here we only wire up the toggle button(s) and keep them announced
     correctly for assistive technology.
     ---------------------------------------------------------------------- */
  function systemPrefersDark() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function currentTheme() {
    return root.getAttribute("data-theme") || (systemPrefersDark() ? "dark" : "light");
  }

  function syncToggles() {
    var isDark = currentTheme() === "dark";
    var toggles = document.querySelectorAll("[data-theme-toggle]");
    for (var i = 0; i < toggles.length; i++) {
      toggles[i].setAttribute("aria-pressed", isDark ? "true" : "false");
      toggles[i].setAttribute(
        "aria-label",
        isDark ? "Switch to light theme" : "Switch to dark theme"
      );
    }
  }

  function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;
    store.set("nw-theme", theme);
    syncToggles();
  }

  document.addEventListener("click", function (event) {
    var toggle = event.target.closest ? event.target.closest("[data-theme-toggle]") : null;
    if (!toggle) return;
    setTheme(currentTheme() === "dark" ? "light" : "dark");
  });

  /* Follow the OS if the visitor has never made an explicit choice. */
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var onSchemeChange = function () {
      if (!store.get("nw-theme")) {
        root.removeAttribute("data-theme");
        syncToggles();
      }
    };
    if (mq.addEventListener) mq.addEventListener("change", onSchemeChange);
    else if (mq.addListener) mq.addListener(onSchemeChange);
  }

  syncToggles();

  /* ----------------------------------------------------------------------
     2. STICKY HEADER
     ---------------------------------------------------------------------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var updateHeader = function () {
      header.setAttribute("data-scrolled", window.scrollY > 8 ? "true" : "false");
    };
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
  }

  /* ----------------------------------------------------------------------
     3. MOBILE NAVIGATION
     ---------------------------------------------------------------------- */
  var navToggle = document.querySelector("[data-nav-toggle]");
  var mobileNav = document.getElementById("mobile-nav");

  function closeNav() {
    if (!mobileNav || !navToggle) return;
    mobileNav.setAttribute("data-open", "false");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open main menu");
    document.body.setAttribute("data-nav-open", "false");
  }

  function openNav() {
    if (!mobileNav || !navToggle) return;
    mobileNav.setAttribute("data-open", "true");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Close main menu");
    document.body.setAttribute("data-nav-open", "true");
  }

  if (navToggle && mobileNav) {
    navToggle.addEventListener("click", function () {
      if (mobileNav.getAttribute("data-open") === "true") closeNav();
      else openNav();
    });

    mobileNav.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeNav();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeNav();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) closeNav();
    });
  }

  /* ----------------------------------------------------------------------
     4. PRICING — monthly / annual toggle
     Prices live in data attributes on each .plan__amount:
         data-monthly="29" data-annual="23"
     Period captions live on [data-period-label] with
         data-label-monthly / data-label-annual text.
     ---------------------------------------------------------------------- */
  var billingSwitch = document.querySelector("[data-billing-switch]");

  function applyBilling(period) {
    var amounts = document.querySelectorAll("[data-monthly][data-annual]");
    for (var i = 0; i < amounts.length; i++) {
      var el = amounts[i];
      var value = el.getAttribute("data-" + period);
      if (value !== null) el.textContent = value;
    }

    var periods = document.querySelectorAll("[data-period-label]");
    for (var j = 0; j < periods.length; j++) {
      periods[j].textContent = periods[j].getAttribute("data-label-" + period) || "";
    }

    var labels = document.querySelectorAll("[data-billing-label]");
    for (var k = 0; k < labels.length; k++) {
      labels[k].setAttribute(
        "data-active",
        labels[k].getAttribute("data-billing-label") === period ? "true" : "false"
      );
    }

    if (billingSwitch) {
      billingSwitch.setAttribute("aria-checked", period === "annual" ? "true" : "false");
    }
    store.set("nw-billing", period);
  }

  if (billingSwitch) {
    var initial = store.get("nw-billing") === "monthly" ? "monthly" : "annual";
    applyBilling(initial);

    billingSwitch.addEventListener("click", function () {
      applyBilling(billingSwitch.getAttribute("aria-checked") === "true" ? "monthly" : "annual");
    });

    var labelBtns = document.querySelectorAll("[data-billing-label]");
    for (var l = 0; l < labelBtns.length; l++) {
      labelBtns[l].addEventListener("click", function () {
        applyBilling(this.getAttribute("data-billing-label"));
      });
    }
  }

  /* ----------------------------------------------------------------------
     5. COPY CODE
     ---------------------------------------------------------------------- */
  var copyButtons = document.querySelectorAll("[data-copy]");
  for (var c = 0; c < copyButtons.length; c++) {
    copyButtons[c].addEventListener("click", function () {
      var button = this;
      var block = button.closest(".code-block");
      var code = block ? block.querySelector("code, pre") : null;
      if (!code) return;

      var text = code.innerText;
      var done = function () {
        var label = button.querySelector("[data-copy-label]");
        if (label) label.textContent = "Copied";
        button.setAttribute("data-copied", "true");
        window.setTimeout(function () {
          if (label) label.textContent = "Copy";
          button.setAttribute("data-copied", "false");
        }, 1800);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
      } else {
        fallbackCopy(text, done);
      }
    });
  }

  function fallbackCopy(text, done) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    try { document.execCommand("copy"); done(); } catch (e) { /* ignore */ }
    document.body.removeChild(area);
  }

  /* ----------------------------------------------------------------------
     6. SCROLL-SPY (docs sidebar, docs TOC, legal nav)
     ---------------------------------------------------------------------- */
  var spyLinks = document.querySelectorAll("[data-spy] a[href^='#']");
  if (spyLinks.length && "IntersectionObserver" in window) {
    var map = {};
    var targets = [];

    for (var s = 0; s < spyLinks.length; s++) {
      var id = spyLinks[s].getAttribute("href").slice(1);
      var section = document.getElementById(id);
      if (!section) continue;
      if (!map[id]) map[id] = [];
      map[id].push(spyLinks[s]);
      if (targets.indexOf(section) === -1) targets.push(section);
    }

    var visible = [];

    var setActive = function (id) {
      for (var key in map) {
        if (!Object.prototype.hasOwnProperty.call(map, key)) continue;
        for (var n = 0; n < map[key].length; n++) {
          if (key === id) {
            map[key][n].classList.add("is-active");
            map[key][n].setAttribute("aria-current", "true");
          } else {
            map[key][n].classList.remove("is-active");
            map[key][n].removeAttribute("aria-current");
          }
        }
      }
    };

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var index = visible.indexOf(entry.target);
        if (entry.isIntersecting && index === -1) visible.push(entry.target);
        if (!entry.isIntersecting && index !== -1) visible.splice(index, 1);
      });

      if (!visible.length) return;
      visible.sort(function (a, b) {
        return a.getBoundingClientRect().top - b.getBoundingClientRect().top;
      });
      setActive(visible[0].id);
    }, { rootMargin: "-88px 0px -60% 0px", threshold: 0 });

    for (var t = 0; t < targets.length; t++) observer.observe(targets[t]);
    if (targets.length) setActive(targets[0].id);
  }

  /* ----------------------------------------------------------------------
     7. FOOTER YEAR
     ---------------------------------------------------------------------- */
  var years = document.querySelectorAll("[data-year]");
  for (var y = 0; y < years.length; y++) {
    years[y].textContent = String(new Date().getFullYear());
  }
})();
