/* =========================================================================
   HALLOWAY & FINCH — Law Firm & Professional Services Kit
   main.js — the only script in the kit. Vanilla, dependency-free, ~7 KB.

   Contents
     1. Theme toggle (light / dark, remembered)
     2. Mobile navigation
     3. Sticky-header shadow
     4. Scroll reveals
     5. Insights category filter
     6. Form validation & confirmation
     7. Current year stamps
   Every block exits quietly if its markup is not on the page, so the same
   file can be included on all seven pages.
   ========================================================================= */

(function () {
  'use strict';

  var root = document.documentElement;
  var STORAGE_KEY = 'hf-theme';

  root.classList.remove('no-js');

  /* ---------------------------------------------------------------------
     1. THEME TOGGLE
     The matching no-flash snippet in each page's <head> has already set
     data-theme before first paint; here we only handle the button.
     --------------------------------------------------------------------- */

  function storedTheme() {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      return null;
    }
  }

  function storeTheme(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch (err) {
      /* Private browsing, blocked cookies — the toggle still works
         for this page view, it simply will not be remembered. */
    }
  }

  function systemPrefersDark() {
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  function resolvedTheme() {
    var explicit = root.getAttribute('data-theme');
    if (explicit === 'dark' || explicit === 'light') return explicit;
    return systemPrefersDark() ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    var toggles = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < toggles.length; i++) {
      toggles[i].setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      toggles[i].setAttribute(
        'aria-label',
        theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
      );
    }
  }

  applyTheme(resolvedTheme());

  document.addEventListener('click', function (event) {
    var toggle = event.target.closest ? event.target.closest('[data-theme-toggle]') : null;
    if (!toggle) return;
    var next = resolvedTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    storeTheme(next);
  });

  /* Follow the OS while the visitor has never chosen for themselves. */
  if (window.matchMedia) {
    var query = window.matchMedia('(prefers-color-scheme: dark)');
    var onSchemeChange = function () {
      if (storedTheme()) return;
      applyTheme(systemPrefersDark() ? 'dark' : 'light');
    };
    if (query.addEventListener) query.addEventListener('change', onSchemeChange);
    else if (query.addListener) query.addListener(onSchemeChange);
  }

  /* ---------------------------------------------------------------------
     2. MOBILE NAVIGATION
     --------------------------------------------------------------------- */

  var navPanel = document.getElementById('mobile-nav');
  var navOpeners = document.querySelectorAll('[data-nav-open]');
  var navClosers = document.querySelectorAll('[data-nav-close]');

  if (navPanel && navOpeners.length) {
    var lastFocused = null;

    var focusablesIn = function (element) {
      return element.querySelectorAll(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
    };

    var setNav = function (open) {
      navPanel.setAttribute('data-open', open ? 'true' : 'false');
      navPanel.setAttribute('aria-hidden', open ? 'false' : 'true');
      document.body.classList.toggle('is-locked', open);

      for (var i = 0; i < navOpeners.length; i++) {
        navOpeners[i].setAttribute('aria-expanded', open ? 'true' : 'false');
      }

      if (open) {
        lastFocused = document.activeElement;
        var first = focusablesIn(navPanel)[0];
        if (first) first.focus();
      } else if (lastFocused && lastFocused.focus) {
        lastFocused.focus();
      }
    };

    setNav(false);

    for (var o = 0; o < navOpeners.length; o++) {
      navOpeners[o].addEventListener('click', function () { setNav(true); });
    }
    for (var c = 0; c < navClosers.length; c++) {
      navClosers[c].addEventListener('click', function () { setNav(false); });
    }

    /* Any link inside the panel closes it. */
    navPanel.addEventListener('click', function (event) {
      var link = event.target.closest ? event.target.closest('a[href]') : null;
      if (link) setNav(false);
    });

    document.addEventListener('keydown', function (event) {
      if (navPanel.getAttribute('data-open') !== 'true') return;

      if (event.key === 'Escape') {
        setNav(false);
        return;
      }

      if (event.key !== 'Tab') return;

      /* Keep the keyboard inside the open panel. */
      var items = focusablesIn(navPanel);
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    /* Returning to a desktop width must never leave the panel stranded. */
    if (window.matchMedia) {
      var wide = window.matchMedia('(min-width: 64em)');
      var onWide = function (event) {
        if (event.matches) setNav(false);
      };
      if (wide.addEventListener) wide.addEventListener('change', onWide);
      else if (wide.addListener) wide.addListener(onWide);
    }
  }

  /* ---------------------------------------------------------------------
     3. STICKY-HEADER SHADOW
     --------------------------------------------------------------------- */

  var header = document.querySelector('[data-header]');

  if (header) {
    var ticking = false;
    var syncHeader = function () {
      header.classList.toggle('is-stuck', window.scrollY > 12);
      ticking = false;
    };
    syncHeader();
    window.addEventListener(
      'scroll',
      function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(syncHeader);
      },
      { passive: true }
    );
  }

  /* ---------------------------------------------------------------------
     4. SCROLL REVEALS — one gentle fade-and-rise, once per element
     --------------------------------------------------------------------- */

  var revealables = document.querySelectorAll('[data-reveal]');

  if (revealables.length) {
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced || !('IntersectionObserver' in window)) {
      for (var r = 0; r < revealables.length; r++) revealables[r].classList.add('is-visible');
    } else {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          });
        },
        /* A fixed pixel inset, never a percentage: on a very tall viewport a
           percentage inset can exceed the page and leave low elements
           permanently hidden. */
        { rootMargin: '0px 0px -48px 0px', threshold: 0.02 }
      );

      for (var v = 0; v < revealables.length; v++) {
        /* Stagger siblings very slightly — dignified, not bouncy. */
        var group = revealables[v].getAttribute('data-reveal');
        if (group) revealables[v].style.setProperty('--reveal-delay', group + 'ms');
        observer.observe(revealables[v]);
      }

      /* Safety net: nothing may stay invisible because the observer never
         fired — a short page, a restored scroll position, a print request. */
      window.setTimeout(function () {
        for (var k = 0; k < revealables.length; k++) {
          var box = revealables[k].getBoundingClientRect();
          if (box.top < window.innerHeight && box.bottom > 0) {
            revealables[k].classList.add('is-visible');
          }
        }
      }, 1200);
    }
  }

  /* ---------------------------------------------------------------------
     5. INSIGHTS CATEGORY FILTER
     --------------------------------------------------------------------- */

  var filterButtons = document.querySelectorAll('[data-filter]');
  var filterables = document.querySelectorAll('[data-category]');
  var filterCount = document.querySelector('[data-filter-count]');

  if (filterButtons.length && filterables.length) {
    var applyFilter = function (value) {
      var shown = 0;

      for (var i = 0; i < filterables.length; i++) {
        var item = filterables[i];
        var match = value === 'all' || item.getAttribute('data-category') === value;
        item.classList.toggle('is-hidden', !match);
        if (match) shown++;
      }

      for (var b = 0; b < filterButtons.length; b++) {
        var isActive = filterButtons[b].getAttribute('data-filter') === value;
        filterButtons[b].setAttribute('aria-pressed', isActive ? 'true' : 'false');
      }

      if (filterCount) {
        filterCount.textContent =
          shown + (shown === 1 ? ' article' : ' articles') +
          (value === 'all' ? '' : ' in this category');
      }
    };

    for (var f = 0; f < filterButtons.length; f++) {
      filterButtons[f].addEventListener('click', function () {
        applyFilter(this.getAttribute('data-filter'));
      });
    }

    applyFilter('all');
  }

  /* ---------------------------------------------------------------------
     6. FORMS
     Client-side validation plus a confirmation message. There is no
     back end in a static kit — see the README for wiring this to your
     own handler, a form service, or a mailto: fallback.
     --------------------------------------------------------------------- */

  var forms = document.querySelectorAll('[data-form]');

  var isValidEmail = function (value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
  };

  var fieldWrapper = function (control) {
    return control.closest ? control.closest('.field') || control.closest('.consent') : null;
  };

  var validateControl = function (control) {
    var value = (control.value || '').trim();
    var valid = true;

    if (control.hasAttribute('required')) {
      if (control.type === 'checkbox') valid = control.checked;
      else valid = value.length > 0;
    }

    if (valid && value && control.type === 'email') valid = isValidEmail(value);

    var wrapper = fieldWrapper(control);
    if (wrapper) wrapper.classList.toggle('is-invalid', !valid);
    control.setAttribute('aria-invalid', valid ? 'false' : 'true');

    return valid;
  };

  for (var n = 0; n < forms.length; n++) {
    (function (form) {
      var status = form.querySelector('[data-form-status]');
      var controls = form.querySelectorAll('input, select, textarea');

      for (var i = 0; i < controls.length; i++) {
        controls[i].addEventListener('blur', function () {
          if (this.getAttribute('aria-invalid') === 'true' || (this.value || '').trim()) {
            validateControl(this);
          }
        });
        controls[i].addEventListener('input', function () {
          if (this.getAttribute('aria-invalid') === 'true') validateControl(this);
        });
      }

      form.addEventListener('submit', function (event) {
        event.preventDefault();

        var firstBad = null;
        var list = form.querySelectorAll('input, select, textarea');

        for (var c = 0; c < list.length; c++) {
          if (!validateControl(list[c]) && !firstBad) firstBad = list[c];
        }

        if (firstBad) {
          if (status) status.classList.remove('is-visible');
          firstBad.focus();
          return;
        }

        if (status) {
          status.classList.add('is-visible');
          status.setAttribute('tabindex', '-1');
          status.focus();
        }

        form.reset();

        var choices = form.querySelectorAll('.field, .consent');
        for (var w = 0; w < choices.length; w++) choices[w].classList.remove('is-invalid');
      });
    })(forms[n]);
  }

  /* ---------------------------------------------------------------------
     7. CURRENT YEAR
     --------------------------------------------------------------------- */

  var years = document.querySelectorAll('[data-year]');
  var thisYear = String(new Date().getFullYear());
  for (var y = 0; y < years.length; y++) years[y].textContent = thisYear;
})();
