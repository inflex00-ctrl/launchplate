/* ==========================================================================
   STACKLIST — main.js
   --------------------------------------------------------------------------
   Shared behaviour for every page. Plain ES5-flavoured JavaScript with no
   build step, no bundler and no network requests, so the template works when
   opened directly from disk (file:///…).

   Exposes a single global, `SL`, containing:

     SL.icon(name)            → inline SVG string for a UI icon
     SL.mark(listing, size)   → generated logo tile for a listing (no images)
     SL.mockup(kind, listing) → generated screenshot placeholder SVG
     SL.stars(rating)         → star rating markup
     SL.cardHTML(listing)     → one listing card
     SL.escape(str)           → HTML-escape a string
     SL.formatNumber(n)       → 1200 → "1.2k"
     SL.reveal(scope)         → wire up scroll reveals inside a scope
     SL.query()               → parsed query string as an object

   Page-specific logic lives in browse.js, listing.js and submit.js.
   ========================================================================== */

var SL = (function () {
  "use strict";

  /* ======================================================================
     Small helpers
     ====================================================================== */

  function $(sel, scope) {
    return (scope || document).querySelector(sel);
  }

  function $$(sel, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(sel));
  }

  function escapeHTML(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatNumber(n) {
    n = Number(n) || 0;
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    return String(n);
  }

  function formatDate(iso) {
    var d = new Date(iso + "T00:00:00");
    if (isNaN(d)) return iso;
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
  }

  function query() {
    var out = {};
    var qs = window.location.search.replace(/^\?/, "");
    if (!qs) return out;
    qs.split("&").forEach(function (pair) {
      if (!pair) return;
      var bits = pair.split("=");
      var k = decodeURIComponent(bits[0].replace(/\+/g, " "));
      var v = decodeURIComponent((bits[1] || "").replace(/\+/g, " "));
      out[k] = v;
    });
    return out;
  }

  function prefersReducedMotion() {
    return (
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  /* A per-page counter so generated SVG gradient ids never collide. */
  var uid = 0;
  function nextId(prefix) {
    uid += 1;
    return (prefix || "g") + "-" + uid;
  }

  /* ======================================================================
     ICONS — inline SVG, currentColor, 24×24 viewBox
     ====================================================================== */

  var ICONS = {
    search:
      '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    arrowRight: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
    arrowLeft: '<path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    checkCircle:
      '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>',
    x: '<path d="M18 6L6 18"/><path d="M6 6l12 12"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    chevronDown: '<path d="M6 9l6 6 6-6"/>',
    chevronRight: '<path d="M9 6l6 6-6 6"/>',
    external:
      '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/>',
    sun:
      '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z"/>',
    menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
    filter: '<path d="M3 5h18"/><path d="M7 12h10"/><path d="M11 19h2"/>',
    grid:
      '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    list:
      '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/><circle cx="2.2" cy="6" r=".9" fill="currentColor" stroke="none"/><circle cx="2.2" cy="12" r=".9" fill="currentColor" stroke="none"/><circle cx="2.2" cy="18" r=".9" fill="currentColor" stroke="none"/>',
    upload:
      '<path d="M12 16V4"/><path d="M7.5 8.5L12 4l4.5 4.5"/><path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.6v.6"/>',
    shield:
      '<path d="M12 3l7 3v5.5c0 4.2-2.9 7.9-7 9.5-4.1-1.6-7-5.3-7-9.5V6z"/>',
    verified:
      '<path d="M12 3l2.2 1.6 2.7-.2.9 2.5 2.2 1.6-1 2.5 1 2.5-2.2 1.6-.9 2.5-2.7-.2L12 21l-2.2-1.6-2.7.2-.9-2.5L4 15.5l1-2.5-1-2.5 2.2-1.6.9-2.5 2.7.2z" fill="currentColor" stroke="none"/><path d="M9 12.2l2 2 4-4.4" stroke="var(--surface, #fff)" stroke-width="2.2"/>',
    star: '<path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.7l5.8-.8z" fill="currentColor" stroke="none"/>',
    starHalf:
      '<defs><linearGradient id="__half"><stop offset="50%" stop-color="currentColor"/><stop offset="50%" stop-color="transparent"/></linearGradient></defs><path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.7l5.8-.8z" fill="url(#__half)" stroke="currentColor" stroke-width="1.2"/>',
    starEmpty:
      '<path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.7l5.8-.8z" fill="none" stroke="currentColor" stroke-width="1.4" opacity=".45"/>',
    chevronUp: '<path d="M6 15l6-6 6 6"/>',
    bolt: '<path d="M13 3L5 13.5h6L11 21l8-10.5h-6z"/>',
    users:
      '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><path d="M16 5.2A3.2 3.2 0 0117 11"/><path d="M18 14.6c2 .7 3 2.6 3 5.4"/>',
    trending: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.2 2"/>',
    tag:
      '<path d="M3 12.5V4a1 1 0 011-1h8.5L21 11.5 12.5 20z"/><circle cx="7.5" cy="7.5" r="1.4"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5L12 13l8.5-6.5"/>',
    rss:
      '<path d="M5 19a1 1 0 100-2 1 1 0 000 2z" fill="currentColor" stroke="none"/><path d="M4 11a9 9 0 019 9"/><path d="M4 5a15 15 0 0115 15"/>',
    github:
      '<path d="M12 2.5a9.5 9.5 0 00-3 18.5c.5.1.65-.2.65-.45v-1.7c-2.4.5-3-1-3-1-.4-1-1-1.3-1-1.3-.85-.55.05-.55.05-.55.9.05 1.4.95 1.4.95.8 1.4 2.1 1 2.6.75.1-.6.35-1 .6-1.25-1.9-.2-3.9-.95-3.9-4.25 0-.95.35-1.7.9-2.3-.1-.2-.4-1.1.1-2.3 0 0 .7-.25 2.4.9a8.3 8.3 0 014.4 0c1.7-1.15 2.4-.9 2.4-.9.5 1.2.2 2.1.1 2.3.55.6.9 1.35.9 2.3 0 3.3-2 4.05-3.9 4.25.35.3.65.9.65 1.8v2.7c0 .25.15.55.65.45A9.5 9.5 0 0012 2.5z" fill="currentColor" stroke="none"/>',
    xSocial:
      '<path d="M17.5 3h3l-6.6 7.5L21.7 21h-6l-4.7-6.1L5.6 21H2.5l7-8L2.6 3h6.2l4.3 5.6zm-1.1 16h1.7L7.7 4.8H5.9z" fill="currentColor" stroke="none"/>',
    rocket:
      '<path d="M13.5 3.5c3.5 0 7 3.5 7 7 0 4-3.5 7.5-7 9.5-3.5-2-7-5.5-7-9.5 0-3.5 3.5-7 7-7z"/><circle cx="13.5" cy="10" r="2.2"/><path d="M9 17l-2.5 4M18 17l2.5 4"/>',
    pulse: '<path d="M3 12h4l2.5-6 4 12 2.5-6H21"/>',
    database:
      '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
    key:
      '<circle cx="8" cy="12" r="4"/><path d="M12 12h9"/><path d="M17 12v3.5"/><path d="M20 12v2.5"/>',
    terminal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7.5 9.5l3 2.5-3 2.5"/><path d="M12.5 15h4"/>',
    plug:
      '<path d="M9 3v5"/><path d="M15 3v5"/><path d="M6 8h12v3a6 6 0 01-6 6 6 6 0 01-6-6z"/><path d="M12 17v4"/>',
    layers:
      '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    sparkle:
      '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
    globe:
      '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 010 18a14 14 0 010-18z"/>',
    heart:
      '<path d="M12 20s-7-4.4-7-9.2A3.8 3.8 0 0112 8.3 3.8 3.8 0 0119 10.8c0 4.8-7 9.2-7 9.2z"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  };

  function icon(name, cls) {
    var body = ICONS[name];
    if (!body) return "";
    /* The half-star carries an internal gradient. Give every instance its own
       id, otherwise a page with several half-stars emits duplicate ids and
       every one of them resolves against the first gradient in the document. */
    if (body.indexOf("__half") > -1) {
      body = body.split("__half").join(nextId("half"));
    }
    /* The width/height attributes are a floor, not a decision: an SVG with a
       viewBox and no intrinsic size expands to fill its container, which turns
       any un-styled icon into a giant. Every component rule in style.css that
       sets a size overrides these, because CSS beats presentational
       attributes. */
    return (
      '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" ' +
      'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" ' +
      'aria-hidden="true" focusable="false"' +
      (cls ? ' class="' + cls + '"' : "") +
      ">" +
      body +
      "</svg>"
    );
  }

  /* ======================================================================
     GENERATED LOGO MARKS
     Every listing gets a distinctive tile drawn from its `mark` field. No
     image files are involved: a two-stop gradient plus a geometric glyph.
     Add a new shape by adding a key to SHAPES below.
     ====================================================================== */

  var SHAPES = {
    orbit:
      '<circle cx="32" cy="32" r="9" fill="#fff" opacity=".95"/>' +
      '<ellipse cx="32" cy="32" rx="21" ry="9" fill="none" stroke="#fff" stroke-width="3" opacity=".7" transform="rotate(-28 32 32)"/>' +
      '<circle cx="49" cy="23" r="4" fill="#fff"/>',
    anchor:
      '<circle cx="32" cy="16" r="5" fill="none" stroke="#fff" stroke-width="4"/>' +
      '<path d="M32 21v27" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/>' +
      '<path d="M20 30h24" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/>' +
      '<path d="M15 38a17 17 0 0034 0" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/>',
    peaks:
      '<path d="M8 46l13-20 9 12 8-14 18 22z" fill="#fff" opacity=".95"/>' +
      '<circle cx="45" cy="18" r="5" fill="#fff" opacity=".65"/>',
    lens:
      '<circle cx="29" cy="29" r="14" fill="none" stroke="#fff" stroke-width="4.5"/>' +
      '<circle cx="29" cy="29" r="5" fill="#fff" opacity=".85"/>' +
      '<path d="M39.5 39.5L52 52" stroke="#fff" stroke-width="5.5" stroke-linecap="round"/>',
    bell:
      '<path d="M32 12a12 12 0 0112 12v10l4 6H16l4-6V24a12 12 0 0112-12z" fill="#fff" opacity=".95"/>' +
      '<path d="M27 44a5 5 0 0010 0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>',
    flame:
      '<path d="M32 8c8 10 3 13 8 18 3-2 4-5 4-5 4 7 6 11 6 16a18 18 0 01-36 0c0-9 8-14 12-21 2 4 4 6 4 6 2-6 2-10 2-14z" fill="#fff" opacity=".95"/>',
    layers:
      '<path d="M32 10l22 12-22 12-22-12z" fill="#fff" opacity=".95"/>' +
      '<path d="M12 32l20 11 20-11" fill="none" stroke="#fff" stroke-width="4" opacity=".72" stroke-linejoin="round"/>' +
      '<path d="M12 42l20 11 20-11" fill="none" stroke="#fff" stroke-width="4" opacity=".45" stroke-linejoin="round"/>',
    wave:
      '<path d="M6 26c7-8 13-8 20 0s13 8 20 0 13-8 12 0" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/>' +
      '<path d="M6 40c7-8 13-8 20 0s13 8 20 0 13-8 12 0" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" opacity=".6"/>',
    cube:
      '<path d="M32 9l20 11v24L32 55 12 44V20z" fill="none" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M12 20l20 11 20-11M32 31v24" stroke="#fff" stroke-width="3.4" opacity=".7" fill="none"/>',
    key:
      '<circle cx="23" cy="30" r="11" fill="none" stroke="#fff" stroke-width="5"/>' +
      '<path d="M34 30h20" stroke="#fff" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M46 30v9M52 30v6" stroke="#fff" stroke-width="5" stroke-linecap="round"/>',
    shield:
      '<path d="M32 8l19 8v14c0 12-8 21-19 26C21 51 13 42 13 30V16z" fill="#fff" opacity=".95"/>' +
      '<path d="M24 32l6 6 11-13" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" class="mark-knock"/>',
    vault:
      '<rect x="10" y="10" width="44" height="44" rx="7" fill="none" stroke="#fff" stroke-width="4.5"/>' +
      '<circle cx="32" cy="32" r="11" fill="none" stroke="#fff" stroke-width="4"/>' +
      '<path d="M32 15v6M32 43v6M15 32h6M43 32h6" stroke="#fff" stroke-width="4" stroke-linecap="round"/>',
    prism:
      '<path d="M32 8l24 44H8z" fill="none" stroke="#fff" stroke-width="4.5" stroke-linejoin="round"/>' +
      '<path d="M32 8v44M20 30h24" stroke="#fff" stroke-width="3.2" opacity=".7"/>',
    socket:
      '<circle cx="32" cy="32" r="21" fill="none" stroke="#fff" stroke-width="4.5"/>' +
      '<circle cx="25" cy="28" r="4" fill="#fff"/><circle cx="39" cy="28" r="4" fill="#fff"/>' +
      '<rect x="27" y="38" width="10" height="5" rx="2.5" fill="#fff"/>',
    loop:
      '<path d="M18 24a14 14 0 1114 22" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M11 17l7 7-7 7" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>',
    beam:
      '<path d="M10 32h44" stroke="#fff" stroke-width="5" stroke-linecap="round"/>' +
      '<circle cx="16" cy="32" r="7" fill="#fff"/>' +
      '<path d="M40 20l12 12-12 12" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>',
    brackets:
      '<path d="M24 14l-12 18 12 18M40 14l12 18-12 18" fill="none" stroke="#fff" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="32" cy="32" r="3.6" fill="#fff"/>',
    mesh:
      '<circle cx="32" cy="14" r="5" fill="#fff"/><circle cx="14" cy="44" r="5" fill="#fff"/><circle cx="50" cy="44" r="5" fill="#fff"/>' +
      '<circle cx="32" cy="34" r="5" fill="#fff" opacity=".7"/>' +
      '<path d="M32 19v10M28 37l-11 5M36 37l11 5M19 44h26" stroke="#fff" stroke-width="3.4" opacity=".75"/>',
    target:
      '<circle cx="32" cy="32" r="21" fill="none" stroke="#fff" stroke-width="4"/>' +
      '<circle cx="32" cy="32" r="12" fill="none" stroke="#fff" stroke-width="4" opacity=".75"/>' +
      '<circle cx="32" cy="32" r="4.5" fill="#fff"/>',
    grid:
      '<rect x="11" y="11" width="17" height="17" rx="4" fill="#fff"/>' +
      '<rect x="36" y="11" width="17" height="17" rx="4" fill="#fff" opacity=".62"/>' +
      '<rect x="11" y="36" width="17" height="17" rx="4" fill="#fff" opacity=".62"/>' +
      '<rect x="36" y="36" width="17" height="17" rx="4" fill="#fff" opacity=".9"/>',
    spark:
      '<path d="M34 6L16 36h13l-5 22 20-32H30z" fill="#fff" opacity=".96"/>',
    stack:
      '<rect x="12" y="12" width="40" height="10" rx="4" fill="#fff"/>' +
      '<rect x="12" y="27" width="40" height="10" rx="4" fill="#fff" opacity=".72"/>' +
      '<rect x="12" y="42" width="40" height="10" rx="4" fill="#fff" opacity=".45"/>',
    ring:
      '<circle cx="32" cy="32" r="19" fill="none" stroke="#fff" stroke-width="6" opacity=".45"/>' +
      '<path d="M32 13a19 19 0 0119 19" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/>',
    glyph:
      '<path d="M14 18h36" stroke="#fff" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M32 18v30" stroke="#fff" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M22 48h20" stroke="#fff" stroke-width="5" stroke-linecap="round"/>',
  };

  /**
   * Build the generated logo tile for a listing.
   * @param {object} listing
   * @param {string} size  one of "sm" | "md" | "lg" | "xl"
   */
  function mark(listing, size) {
    var m = (listing && listing.mark) || {};
    var shape = SHAPES[m.shape] ? m.shape : "grid";
    var from = m.from || "#444";
    var to = m.to || "#999";
    var gid = nextId("mk");

    return (
      '<span class="mark mark--' + (size || "md") + '" aria-hidden="true">' +
      '<svg viewBox="0 0 64 64" role="presentation">' +
      "<defs>" +
      '<linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="' + escapeHTML(from) + '"/>' +
      '<stop offset="100%" stop-color="' + escapeHTML(to) + '"/>' +
      "</linearGradient>" +
      "</defs>" +
      '<rect width="64" height="64" rx="0" fill="url(#' + gid + ')"/>' +
      '<g style="color:' + escapeHTML(from) + '">' + SHAPES[shape] + "</g>" +
      "</svg></span>"
    );
  }

  /* ======================================================================
     GENERATED SCREENSHOT MOCKUPS
     Gallery imagery drawn as SVG so the kit ships with no binary assets.
     ====================================================================== */

  function mockup(kind, listing) {
    var m = (listing && listing.mark) || {};
    var c1 = m.from || "#3b3b3b";
    var c2 = m.to || "#8a8a8a";
    var gid = nextId("mo");
    var head =
      '<svg viewBox="0 0 640 360" role="presentation" preserveAspectRatio="xMidYMid slice">' +
      "<defs>" +
      '<linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="' + c1 + '"/><stop offset="100%" stop-color="' + c2 + '"/>' +
      "</linearGradient></defs>" +
      '<rect width="640" height="360" fill="var(--surface-2)"/>' +
      /* window chrome */
      '<rect x="0" y="0" width="640" height="30" fill="var(--surface-3)"/>' +
      '<circle cx="18" cy="15" r="4.5" fill="' + c1 + '" opacity=".55"/>' +
      '<circle cx="34" cy="15" r="4.5" fill="' + c1 + '" opacity=".35"/>' +
      '<circle cx="50" cy="15" r="4.5" fill="' + c1 + '" opacity=".22"/>' +
      '<rect x="70" y="9" width="150" height="12" rx="6" fill="var(--line)"/>';

    var body = "";

    if (kind === "chart") {
      body =
        '<rect x="24" y="50" width="120" height="12" rx="6" fill="var(--line-strong)"/>' +
        '<rect x="24" y="72" width="70" height="9" rx="4.5" fill="var(--line)"/>';
      /* axis */
      body += '<path d="M60 300H610" stroke="var(--line-strong)" stroke-width="1.5"/>';
      body += '<path d="M60 100V300" stroke="var(--line-strong)" stroke-width="1.5"/>';
      /* gridlines */
      for (var g = 1; g <= 4; g++) {
        var gy = 300 - g * 48;
        body += '<path d="M60 ' + gy + 'H610" stroke="var(--line)" stroke-width="1" stroke-dasharray="3 4"/>';
      }
      /* area chart */
      var pts = [265, 240, 250, 205, 190, 205, 165, 140, 152, 118, 96, 108];
      var d = "";
      var dx = 550 / (pts.length - 1);
      pts.forEach(function (p, i) {
        d += (i === 0 ? "M" : "L") + (60 + i * dx).toFixed(1) + " " + p;
      });
      body +=
        '<path d="' + d + ' L610 300 L60 300 Z" fill="url(#' + gid + ')" opacity=".18"/>' +
        '<path d="' + d + '" fill="none" stroke="url(#' + gid + ')" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>';
      pts.forEach(function (p, i) {
        body += '<circle cx="' + (60 + i * dx).toFixed(1) + '" cy="' + p + '" r="3.6" fill="' + c2 + '"/>';
      });
    } else if (kind === "terminal") {
      body = '<rect x="0" y="30" width="640" height="330" fill="#12100f"/>';
      var lines = [
        [24, 70, 110, "#6ee7b7"],
        [140, 70, 190, "#e5e5e5"],
        [24, 98, 250, "#9aa0a6"],
        [24, 126, 320, "#9aa0a6"],
        [24, 154, 180, "#9aa0a6"],
        [24, 190, 110, "#6ee7b7"],
        [140, 190, 230, "#e5e5e5"],
        [24, 218, 300, "#9aa0a6"],
        [24, 246, 210, "#9aa0a6"],
        [24, 282, 96, "#fbbf24"],
        [130, 282, 260, "#e5e5e5"],
      ];
      lines.forEach(function (l) {
        body +=
          '<rect x="' + l[0] + '" y="' + l[1] + '" width="' + l[2] + '" height="10" rx="5" fill="' + l[3] + '" opacity=".8"/>';
      });
      body += '<rect x="24" y="312" width="9" height="14" fill="' + c2 + '"/>';
    } else if (kind === "table") {
      body =
        '<rect x="24" y="48" width="592" height="34" rx="8" fill="var(--surface-3)"/>';
      ["", "", "", ""].forEach(function (_, i) {
        body += '<rect x="' + (40 + i * 145) + '" y="59" width="' + (i === 0 ? 86 : 62) + '" height="11" rx="5.5" fill="var(--line-strong)"/>';
      });
      for (var r = 0; r < 6; r++) {
        var y = 96 + r * 40;
        body += '<rect x="24" y="' + y + '" width="592" height="34" rx="8" fill="var(--surface)"/>';
        body += '<rect x="40" y="' + (y + 11) + '" width="14" height="12" rx="4" fill="url(#' + gid + ')"/>';
        body += '<rect x="62" y="' + (y + 12) + '" width="' + (70 + ((r * 23) % 46)) + '" height="10" rx="5" fill="var(--line-strong)"/>';
        body += '<rect x="185" y="' + (y + 12) + '" width="' + (54 + ((r * 17) % 34)) + '" height="10" rx="5" fill="var(--line)"/>';
        body += '<rect x="330" y="' + (y + 12) + '" width="' + (46 + ((r * 29) % 40)) + '" height="10" rx="5" fill="var(--line)"/>';
        body +=
          '<rect x="475" y="' + (y + 10) + '" width="58" height="14" rx="7" fill="' + (r % 3 === 0 ? c2 : "var(--line)") + '" opacity="' + (r % 3 === 0 ? ".8" : "1") + '"/>';
      }
    } else {
      /* dashboard (default) */
      body =
        /* sidebar */
        '<rect x="0" y="30" width="140" height="330" fill="var(--surface-3)"/>' +
        '<rect x="18" y="50" width="22" height="22" rx="7" fill="url(#' + gid + ')"/>' +
        '<rect x="48" y="57" width="62" height="9" rx="4.5" fill="var(--line-strong)"/>';
      for (var s = 0; s < 6; s++) {
        body +=
          '<rect x="18" y="' + (98 + s * 30) + '" width="' + (s === 1 ? 100 : 78) + '" height="10" rx="5" fill="' + (s === 1 ? c2 : "var(--line)") + '" opacity="' + (s === 1 ? ".85" : "1") + '"/>';
      }
      /* stat tiles */
      for (var t = 0; t < 3; t++) {
        var tx = 164 + t * 158;
        body +=
          '<rect x="' + tx + '" y="50" width="142" height="78" rx="10" fill="var(--surface)" stroke="var(--line)"/>' +
          '<rect x="' + (tx + 16) + '" y="66" width="52" height="9" rx="4.5" fill="var(--line)"/>' +
          '<rect x="' + (tx + 16) + '" y="86" width="' + (60 + t * 12) + '" height="18" rx="6" fill="url(#' + gid + ')" opacity="' + (0.85 - t * 0.2) + '"/>';
      }
      /* main panel with bars */
      body += '<rect x="164" y="146" width="458" height="192" rx="10" fill="var(--surface)" stroke="var(--line)"/>';
      var bars = [58, 92, 74, 128, 104, 148, 120, 162, 138];
      bars.forEach(function (h, i) {
        var bx = 192 + i * 47;
        body +=
          '<rect x="' + bx + '" y="' + (312 - h) + '" width="26" height="' + h + '" rx="6" fill="url(#' + gid + ')" opacity="' + (0.45 + i * 0.06) + '"/>';
      });
      body += '<rect x="184" y="166" width="96" height="10" rx="5" fill="var(--line-strong)"/>';
    }

    return head + body + "</svg>";
  }

  /* ======================================================================
     STARS
     ====================================================================== */

  function stars(rating, size) {
    var r = Number(rating) || 0;
    var out = '<span class="stars' + (size ? " stars--" + size : "") + '" aria-hidden="true">';
    for (var i = 1; i <= 5; i++) {
      if (r >= i) out += icon("star");
      else if (r >= i - 0.5) out += icon("starHalf");
      else out += icon("starEmpty");
    }
    return out + "</span>";
  }

  /* ======================================================================
     LISTING CARD
     One function used by the home page, browse, category and alternatives.
     ====================================================================== */

  var PRICE_LABEL = {
    free: "Free",
    freemium: "Freemium",
    paid: "Paid",
    enterprise: "Enterprise",
  };

  /* The three most recently added listings wear the "New" badge. Working
     from a rank rather than a fixed date window means the badge stays
     meaningful however old the dataset gets — exactly three tools are new,
     whether you seeded the directory today or two years ago. */
  var NEW_COUNT = 3;
  var newestIds = null;

  function isNew(listing) {
    if (!listing || !listing.added) return false;
    if (newestIds === null) {
      newestIds = {};
      (window.STACKLIST ? STACKLIST.listings : [])
        .slice()
        .sort(function (a, b) {
          return (b.added || "").localeCompare(a.added || "");
        })
        .slice(0, NEW_COUNT)
        .forEach(function (l) {
          newestIds[l.id] = true;
        });
    }
    return newestIds[listing.id] === true;
  }

  function cardHTML(listing, opts) {
    opts = opts || {};
    var cat = window.STACKLIST ? STACKLIST.category(listing.category) : null;
    var classes = ["card"];
    if (opts.emphasis !== false) {
      if (listing.sponsored) classes.push("card--sponsored");
      else if (listing.featured) classes.push("card--featured");
    }

    var badges = "";
    if (listing.sponsored) {
      badges += '<span class="badge badge--sponsored">' + icon("bolt") + "Sponsored</span>";
    } else if (listing.featured) {
      badges += '<span class="badge badge--featured">' + icon("sparkle") + "Featured</span>";
    }
    if (isNew(listing)) {
      badges += '<span class="badge badge--new">New</span>';
    }
    badges +=
      '<span class="price-pill" data-price="' + escapeHTML(listing.pricing) + '">' +
      escapeHTML(PRICE_LABEL[listing.pricing] || listing.pricing) +
      "</span>";

    var tagHTML = (listing.tags || [])
      .slice(0, 3)
      .map(function (t) {
        return '<li><span class="tag">' + escapeHTML(t) + "</span></li>";
      })
      .join("");

    return (
      '<article class="' + classes.join(" ") + '" data-id="' + escapeHTML(listing.id) + '">' +
      '<div class="card__head">' +
      mark(listing, "md") +
      '<div class="card__heading">' +
      '<h3 class="card__title">' +
      '<a class="card__link" href="listing.html?id=' + encodeURIComponent(listing.id) + '">' +
      escapeHTML(listing.name) +
      "</a>" +
      (listing.verified
        ? '<span title="Verified listing">' + icon("verified") + '<span class="visually-hidden">Verified</span></span>'
        : "") +
      "</h3>" +
      '<span class="card__cat">' + escapeHTML(cat ? cat.name : listing.category) + "</span>" +
      "</div>" +
      "</div>" +
      '<div class="card__badges">' + badges + "</div>" +
      '<p class="card__tagline">' + escapeHTML(listing.tagline) + "</p>" +
      '<ul class="tags card__tags">' + tagHTML + "</ul>" +
      '<div class="card__meta">' +
      '<span class="rating-row">' +
      stars(listing.rating, "sm") +
      "<b>" + listing.rating.toFixed(1) + "</b>" +
      "<span>(" + formatNumber(listing.ratingCount) + ")</span>" +
      "</span>" +
      '<button type="button" class="card__vote" aria-pressed="false" ' +
      'aria-label="Upvote ' + escapeHTML(listing.name) + '" data-votes="' + listing.votes + '">' +
      icon("chevronUp") +
      "<b>" + formatNumber(listing.votes) + "</b>" +
      "</button>" +
      "</div>" +
      "</article>"
    );
  }

  /* Upvote buttons are a demo interaction — they never leave the page. */
  function wireVotes(scope) {
    $$(".card__vote", scope || document).forEach(function (btn) {
      if (btn.dataset.wired) return;
      btn.dataset.wired = "1";
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var pressed = btn.getAttribute("aria-pressed") === "true";
        var base = Number(btn.dataset.votes) || 0;
        btn.setAttribute("aria-pressed", pressed ? "false" : "true");
        var b = btn.querySelector("b");
        if (b) b.textContent = formatNumber(pressed ? base : base + 1);
      });
    });
  }

  /* ======================================================================
     SCROLL REVEALS (with stagger)
     ====================================================================== */

  function reveal(scope) {
    var nodes = $$("[data-reveal]", scope || document).filter(function (n) {
      return !n.classList.contains("is-visible");
    });
    if (!nodes.length) return;

    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      nodes.forEach(function (n) {
        n.classList.add("is-visible");
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        /* Stagger within a batch so a grid cascades rather than popping. */
        var shown = 0;
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var delay = el.dataset.revealDelay;
          if (delay === undefined) {
            delay = Math.min(shown * 55, 380);
            shown += 1;
          }
          el.style.setProperty("--reveal-delay", delay + "ms");
          el.classList.add("is-visible");
          io.unobserve(el);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    nodes.forEach(function (n) {
      io.observe(n);
    });

    /* Safety net. A reveal starts at opacity 0, so anything the observer never
       reports on would stay invisible for good — which can happen inside an
       off-screen iframe, a display:none ancestor that is later shown, or a
       browser that throttles observers in a background tab. After four
       seconds, show everything regardless. */
    window.setTimeout(function () {
      nodes.forEach(function (n) {
        n.classList.add("is-visible");
      });
    }, 4000);
  }

  /* Apply a stagger index to the children of a container. */
  function stagger(container, step, max) {
    step = step || 55;
    max = max || 420;
    Array.prototype.forEach.call(container.children, function (child, i) {
      child.style.setProperty("--reveal-delay", Math.min(i * step, max) + "ms");
    });
  }

  /* ======================================================================
     ANIMATED COUNTERS
     ====================================================================== */

  function countUp(el) {
    var target = parseFloat(el.dataset.count);
    if (isNaN(target)) return;
    var decimals = parseInt(el.dataset.decimals || "0", 10);
    var suffix = el.dataset.suffix || "";
    var prefix = el.dataset.prefix || "";

    function render(v) {
      var s;
      if (el.dataset.compact === "true") s = formatNumber(Math.round(v));
      else s = v.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      el.textContent = prefix + s + suffix;
    }

    if (prefersReducedMotion()) {
      render(target);
      return;
    }

    var start = null;
    var duration = 1500;
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      /* easeOutExpo */
      var eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      render(target * eased);
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function initCounters(scope) {
    var nodes = $$("[data-count]", scope || document);
    if (!nodes.length) return;

    if (!("IntersectionObserver" in window)) {
      nodes.forEach(countUp);
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          countUp(entry.target);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.4 }
    );
    nodes.forEach(function (n) {
      io.observe(n);
    });
  }

  /* ======================================================================
     THEME
     The no-flash script in each page's <head> sets the attribute before
     paint; this only handles the toggle afterwards.
     ====================================================================== */

  function currentTheme() {
    var attr = document.documentElement.getAttribute("data-theme");
    if (attr) return attr;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function initTheme() {
    var btn = $(".theme-toggle");
    if (!btn) return;

    function sync() {
      var dark = currentTheme() === "dark";
      btn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
      btn.setAttribute("aria-pressed", dark ? "true" : "false");
    }

    sync();

    btn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try {
        localStorage.setItem("stacklist-theme", next);
      } catch (e) {
        /* Private mode or blocked storage — the toggle still works for this
           page view, it just will not be remembered. */
      }
      sync();
    });

    /* Follow the system if the user has never chosen explicitly. */
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      var onChange = function () {
        var stored = null;
        try {
          stored = localStorage.getItem("stacklist-theme");
        } catch (e) {}
        if (!stored) {
          document.documentElement.removeAttribute("data-theme");
          sync();
        }
      };
      if (mq.addEventListener) mq.addEventListener("change", onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  }

  /* ======================================================================
     MOBILE NAVIGATION
     ====================================================================== */

  function initNav() {
    var toggle = $(".nav-toggle");
    var nav = $("#primary-nav");
    if (!toggle || !nav) return;

    function close() {
      toggle.setAttribute("aria-expanded", "false");
      nav.setAttribute("data-open", "false");
    }

    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", open ? "false" : "true");
      nav.setAttribute("data-open", open ? "false" : "true");
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        close();
        toggle.focus();
      }
    });

    /* Close when a link is chosen, and whenever we return to desktop. */
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) close();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) close();
    });
  }

  /* ======================================================================
     ICON PLACEHOLDERS
     Any element with data-icon="name" is filled with that inline SVG, which
     keeps the HTML readable instead of littered with path data.
     ====================================================================== */

  function paintIcons(scope) {
    $$("[data-icon]", scope || document).forEach(function (el) {
      if (el.dataset.iconPainted) return;
      el.dataset.iconPainted = "1";
      el.insertAdjacentHTML("afterbegin", icon(el.dataset.icon));
    });
  }

  /* ======================================================================
     FOOTER YEAR
     ====================================================================== */

  function initYear() {
    $$("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  /* ======================================================================
     BOOT
     ====================================================================== */

  function init() {
    paintIcons();
    initTheme();
    initNav();
    initYear();
    initCounters();
    reveal();
    wireVotes();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* ======================================================================
     PUBLIC API
     ====================================================================== */
  return {
    $: $,
    $$: $$,
    icon: icon,
    mark: mark,
    mockup: mockup,
    stars: stars,
    cardHTML: cardHTML,
    wireVotes: wireVotes,
    escape: escapeHTML,
    formatNumber: formatNumber,
    formatDate: formatDate,
    query: query,
    reveal: reveal,
    stagger: stagger,
    initCounters: initCounters,
    paintIcons: paintIcons,
    prefersReducedMotion: prefersReducedMotion,
    priceLabel: PRICE_LABEL,
    isNew: isNew,
    shapes: Object.keys(SHAPES),
  };
})();
