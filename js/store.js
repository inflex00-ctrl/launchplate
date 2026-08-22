/* ==========================================================================
   Launchplate storefront wiring
   --------------------------------------------------------------------------
   The catalogue (products/catalog.json) is the source of truth for pricing and
   the payment links (products/links.json) are the source of truth for checkout.
   Every price and every buy button is also rendered statically in the HTML, so
   the shop is fully functional (and sellable) with JavaScript disabled or when
   the page is opened straight off the filesystem. This script's job is simply
   to reconcile the markup with the JSON whenever it can be fetched.
   ========================================================================== */
(function () {
  'use strict';

  var SYM = { EUR: '€', USD: '$', GBP: '£' };

  function getJSON(path) {
    return fetch(path, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(path + ' -> ' + r.status);
      return r.json();
    });
  }

  /* ---- 1. Checkout: point every a.buy[data-sku] at its Stripe payment link -- */
  function wireCheckout() {
    var buttons = Array.prototype.slice.call(document.querySelectorAll('a.buy[data-sku]'));
    if (!buttons.length) return Promise.resolve();

    return getJSON('products/links.json').then(function (links) {
      buttons.forEach(function (a) {
        var url = links[a.dataset.sku];
        if (url) {
          a.href = url;
          a.rel = 'noopener';
          a.removeAttribute('aria-disabled');
          a.classList.remove('is-off');
        } else if (!/^https?:/i.test(a.getAttribute('href') || '')) {
          // No link in JSON and no usable static fallback — fail loudly, not silently.
          a.setAttribute('aria-disabled', 'true');
          a.classList.add('is-off');
          a.textContent = 'Checkout unavailable';
        }
      });
    }).catch(function () {
      /* Offline / file:// — the static hrefs baked into the HTML already work. */
    });
  }

  /* ---- 2. Catalogue: keep prices, names and page counts in sync ------------ */
  function syncCatalogue() {
    var needed = document.querySelector('[data-price],[data-name],[data-pages]');
    if (!needed) return Promise.resolve();

    return getJSON('products/catalog.json').then(function (cat) {
      var sym = SYM[cat.currency] || '€';
      var bySku = {};
      (cat.items || []).forEach(function (item) { bySku[item.sku] = item; });

      function fill(attr, format) {
        document.querySelectorAll('[data-' + attr + ']').forEach(function (el) {
          var item = bySku[el.getAttribute('data-' + attr)];
          if (item) el.textContent = format(item, sym);
        });
      }
      fill('price', function (i, s) { return s + i.price; });
      fill('name', function (i) { return i.name; });
      fill('pages', function (i) { return String(i.pages); });
    }).catch(function () { /* static markup already shows the right numbers */ });
  }

  /* ---- 3. Mobile navigation ------------------------------------------------ */
  function wireNav() {
    var toggle = document.getElementById('nav-toggle');
    if (!toggle) return;
    var panel = document.querySelector('.nav-panel');
    if (panel) {
      panel.addEventListener('click', function (e) {
        if (e.target.closest('a')) toggle.checked = false;
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') toggle.checked = false;
    });
  }

  /* ---- 4. Go ---------------------------------------------------------------- */
  function init() {
    wireNav();
    wireCheckout();
    syncCatalogue();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
