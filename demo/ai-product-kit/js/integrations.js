/* ==========================================================================
   integrations.js — the optional, privacy-first plumbing around the kit.
   --------------------------------------------------------------------------
   Plain ES5-flavoured JavaScript. No build step, no dependencies, no npm.

   Everything here is OFF until it is switched on in config.js. On a kit with
   an untouched config.js this file makes ZERO network requests, injects
   nothing, and changes nothing on the page. That is the point: the template
   must render identically whether or not the buyer has configured anything.

   FOUR THINGS
     1. Business details  — one edit in config.js updates the phone number,
                            email address and business name across every page.
     2. Analytics         — Plausible, Umami or Cloudflare Web Analytics.
                            Cookieless, no consent banner required, EU hosted
                            (Plausible: Germany; Umami: wherever you host it).
                            No Google Analytics: it needs a consent banner in
                            the EU and the kits' buyers are EU freelancers.
     3. Maps              — an OpenStreetMap iframe. No API key, no account,
                            no tracking cookie. Falls back to the kit's drawn
                            map illustration when not configured.
     4. Booking           — a Cal.com or Calendly inline embed for the clinic
                            and restaurant kits, replacing the static form
                            only when a booking URL is configured.

   PUBLIC API
     SiteKit.config()      → the live SITE_CONFIG (never null)
     SiteKit.get(path, d)  → safe nested lookup, e.g. get("business.phone")
     SiteKit.status()      → a one-line summary of what is switched on
   ========================================================================== */

(function (window, document) {
  "use strict";

  var VERSION = "1.0.0";

  function isObj(v) {
    return v !== null && typeof v === "object";
  }

  function trim(v) {
    return String(v == null ? "" : v).replace(/^\s+|\s+$/g, "");
  }

  var PLACEHOLDER = /^(|YOUR_[A-Z0-9_]*|xxxxxxxx.*|paste-.*|your-.*|replace-me|TODO|CHANGE_ME|example\.com)$/i;

  function cfg() {
    return isObj(window.SITE_CONFIG) ? window.SITE_CONFIG : {};
  }

  function get(path, fallback) {
    var parts = String(path).split(".");
    var cur = cfg();
    for (var i = 0; i < parts.length; i++) {
      if (!isObj(cur) || !(parts[i] in cur)) return fallback;
      cur = cur[parts[i]];
    }
    if (cur === undefined || cur === null || cur === "") return fallback;
    if (typeof cur === "string" && PLACEHOLDER.test(trim(cur))) return fallback;
    return cur;
  }

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  var enabled = [];

  /* ================================================================== *
   * 1. BUSINESS DETAILS
   *
   *    The kits ship with plausible fictional details — a phone number,
   *    an email address, a business name. Rather than making the buyer
   *    find all thirty-eight occurrences by hand, config.js lists the
   *    placeholder values under `demo` and the real ones under
   *    `business`. This swaps one for the other on load.
   *
   *    It only ever runs when both sides of a pair are filled in, so an
   *    untouched config.js leaves every page exactly as authored.
   *
   *    Also supports explicit markup binding, which is more precise and
   *    survives a redesign:
   *        <span data-site="business.name"></span>
   *        <a data-site-href="tel:business.phone" data-site="business.phone">
   * ================================================================== */

  /* Text nodes we must never rewrite. */
  var TEXT_SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, NOSCRIPT: 1, CODE: 1, PRE: 1, KBD: 1, SAMP: 1 };

  function replaceInTextNodes(pairs) {
    if (!pairs.length || !document.createTreeWalker) return;
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    var node;
    var hits = [];
    while ((node = walker.nextNode())) {
      var parent = node.parentNode;
      if (!parent || TEXT_SKIP[parent.nodeName]) continue;
      var text = node.nodeValue;
      if (!text || text.indexOf("@") === -1 && !/[A-Za-z0-9]/.test(text)) continue;
      var next = text;
      for (var i = 0; i < pairs.length; i++) {
        if (next.indexOf(pairs[i][0]) !== -1) next = next.split(pairs[i][0]).join(pairs[i][1]);
      }
      if (next !== text) hits.push([node, next]);
    }
    for (var h = 0; h < hits.length; h++) hits[h][0].nodeValue = hits[h][1];
  }

  function replaceInAttributes(pairs) {
    var attrs = ["href", "content", "title", "alt", "aria-label", "placeholder", "value"];
    var nodes = document.querySelectorAll("[href],[content],[title],[alt],[aria-label],[placeholder],[value]");
    for (var i = 0; i < nodes.length; i++) {
      for (var a = 0; a < attrs.length; a++) {
        var v = nodes[i].getAttribute(attrs[a]);
        if (!v) continue;
        var next = v;
        for (var p = 0; p < pairs.length; p++) {
          if (next.indexOf(pairs[p][0]) !== -1) next = next.split(pairs[p][0]).join(pairs[p][1]);
        }
        if (next !== v) nodes[i].setAttribute(attrs[a], next);
      }
    }
  }

  /* "+353 1 555 0184" → "+35315550184", so tel: hrefs can be swapped too. */
  function telDigits(v) {
    var s = trim(v).replace(/[^\d+]/g, "");
    return s;
  }

  function applyBusinessDetails() {
    if (get("business.replaceDemoDetails", true) === false) return;

    var pairs = [];
    var demo = isObj(cfg().demo) ? cfg().demo : {};

    function pair(demoValue, realValue) {
      var d = trim(demoValue);
      var r = trim(realValue);
      if (!d || !r || d === r) return;
      pairs.push([d, r]);
    }

    var realName = get("business.name", "");
    pair(demo.name, realName);

    /* Kits write the business name more than one way — "Halloway & Finch
       LLP" in the footer, "Halloway & Finch" in the header lockup. Any
       shorter spellings are listed in demo.nameAlt and map to the same
       replacement. */
    if (realName && Object.prototype.toString.call(demo.nameAlt) === "[object Array]") {
      for (var a = 0; a < demo.nameAlt.length; a++) pair(demo.nameAlt[a], realName);
    }

    pair(demo.email, get("business.email", ""));
    pair(demo.phone, get("business.phone", ""));
    pair(demo.address, get("business.address", ""));

    /* tel: hrefs carry the compact E.164 form, which is usually not what
       the page displays. demo.tel is that exact string; fall back to
       stripping the display number when it is not given. */
    var demoTel = trim(demo.tel) || telDigits(demo.phone);
    var realTel = telDigits(get("business.phone", ""));
    if (demoTel && realTel && demoTel !== realTel) pairs.push([demoTel, realTel]);

    /* Extra pairs the kit author or buyer wants, as { "old": "new" }. */
    var extra = isObj(demo.replace) ? demo.replace : null;
    if (extra) {
      for (var k in extra) if (extra.hasOwnProperty(k)) pair(k, extra[k]);
    }

    /* Longest search string first, so "Halloway & Finch LLP" is consumed
       before the bare "Halloway & Finch" can eat half of it. */
    pairs.sort(function (x, y) {
      return y[0].length - x[0].length;
    });

    if (pairs.length) {
      replaceInTextNodes(pairs);
      replaceInAttributes(pairs);
      enabled.push("business details");
    }

    /* Explicit bindings always win, and run even with no demo block. */
    var bound = document.querySelectorAll("[data-site]");
    for (var i = 0; i < bound.length; i++) {
      var el = bound[i];
      var value = get(el.getAttribute("data-site"), "");
      if (value) el.textContent = value;
      var hrefSpec = el.getAttribute("data-site-href");
      if (hrefSpec) {
        var m = /^(tel:|mailto:|)(.+)$/.exec(hrefSpec);
        var target = get(m[2], "");
        if (target) {
          el.setAttribute("href", m[1] === "tel:" ? "tel:" + telDigits(target) : m[1] + target);
        }
      }
    }
  }

  /* ================================================================== *
   * 2. ANALYTICS
   *
   *    All three options below are cookieless and do not collect personal
   *    data, which is why none of them needs a consent banner under the
   *    ePrivacy Directive. Read SETUP.md before assuming that applies to
   *    your own configuration — it stops being true the moment you turn
   *    on a feature that stores an identifier.
   *
   *    config.js:
   *      analytics: { provider: "plausible", domain: "example.com" }
   *      analytics: { provider: "umami", id: "…", src: "https://…/script.js" }
   *      analytics: { provider: "cloudflare", token: "…" }
   *      analytics: { provider: "" }            ← default: nothing loads
   * ================================================================== */

  function loadScript(attrs) {
    var s = document.createElement("script");
    s.defer = true;
    for (var k in attrs) if (attrs.hasOwnProperty(k)) s.setAttribute(k, attrs[k]);
    document.head.appendChild(s);
    return s;
  }

  function initAnalytics() {
    var provider = String(get("analytics.provider", "")).toLowerCase();
    if (!provider) return;

    /* Never phone home from a local file — it would only pollute the
       buyer's stats while they are building the site. */
    if (window.location.protocol === "file:") return;
    if (get("analytics.respectDoNotTrack", false) && navigator.doNotTrack === "1") return;

    if (provider === "plausible") {
      var domain = get("analytics.domain", "");
      if (!domain) return;
      loadScript({
        src: get("analytics.src", "https://plausible.io/js/script.js"),
        "data-domain": domain
      });
      enabled.push("Plausible");
    } else if (provider === "umami") {
      var id = get("analytics.id", "");
      var src = get("analytics.src", "");
      if (!id || !src) return;
      loadScript({ src: src, "data-website-id": id });
      enabled.push("Umami");
    } else if (provider === "cloudflare") {
      var token = get("analytics.token", "");
      if (!token) return;
      loadScript({
        src: "https://static.cloudflareinsights.com/beacon.min.js",
        "data-cf-beacon": '{"token":"' + token + '"}'
      });
      enabled.push("Cloudflare Web Analytics");
    } else if (provider === "custom") {
      var custom = get("analytics.src", "");
      if (!custom) return;
      loadScript({ src: custom });
      enabled.push("custom analytics");
    }
  }

  /* ================================================================== *
   * 3. MAPS
   *
   *    Every kit that shows a location ships a drawn map illustration
   *    inside an element tagged data-map. Configure a location and the
   *    illustration is replaced with an OpenStreetMap iframe: no API key,
   *    no account, no tracking cookie, and it costs nothing.
   *
   *    Per-element attributes win over the global config, which is what
   *    lets the clinic kit show two different practices on one page.
   *
   *      <div class="map" data-map
   *           data-map-lat="53.3462" data-map-lon="-6.2436"
   *           data-map-zoom="16" data-map-label="Marlowe Quay">
   *
   *    config.js:
   *      map: { enabled: true, lat: 53.3462, lon: -6.2436, zoom: 16 }
   * ================================================================== */

  function osmSrc(lat, lon, zoom) {
    /* A bbox roughly one "zoom step" wide. OSM's embed API wants a bbox
       rather than a zoom level, so derive one. */
    var span = 0.01 / Math.pow(2, Math.max(0, zoom - 15));
    var latSpan = span;
    var lonSpan = span / Math.max(0.2, Math.cos((lat * Math.PI) / 180));
    var bbox = [
      (lon - lonSpan).toFixed(6),
      (lat - latSpan).toFixed(6),
      (lon + lonSpan).toFixed(6),
      (lat + latSpan).toFixed(6)
    ].join(",");
    return (
      "https://www.openstreetmap.org/export/embed.html?bbox=" +
      encodeURIComponent(bbox) +
      "&layer=mapnik&marker=" +
      encodeURIComponent(lat + "," + lon)
    );
  }

  function num(v) {
    var n = parseFloat(v);
    return isNaN(n) ? null : n;
  }

  function initMaps() {
    var holders = document.querySelectorAll("[data-map]");
    if (!holders.length) return;

    var globalEnabled = get("map.enabled", false) === true;
    var gLat = num(get("map.lat", null));
    var gLon = num(get("map.lon", null));
    var gZoom = num(get("map.zoom", 16)) || 16;
    var provider = String(get("map.provider", "osm")).toLowerCase();
    var used = false;

    for (var i = 0; i < holders.length; i++) {
      var el = holders[i];

      var lat = num(el.getAttribute("data-map-lat"));
      var lon = num(el.getAttribute("data-map-lon"));
      var zoom = num(el.getAttribute("data-map-zoom")) || gZoom;
      var label = el.getAttribute("data-map-label") || get("business.name", "Our location");

      /* Element coordinates are the kit's own demo location. Only use
         them when the buyer has explicitly switched maps on; otherwise
         the drawn illustration stays, which is the honest default for a
         template whose address is fictional. */
      if (!globalEnabled) continue;
      if (lat === null || lon === null) {
        lat = gLat;
        lon = gLon;
      }
      if (lat === null || lon === null) continue;

      var src;
      if (provider === "osm") {
        src = osmSrc(lat, lon, zoom);
      } else if (provider === "google") {
        /* Keyless Google embed. It sets cookies — you will need consent
           for it in the EU. OSM is the default for exactly this reason. */
        src = "https://maps.google.com/maps?q=" + lat + "," + lon + "&z=" + zoom + "&output=embed";
      } else if (provider === "custom") {
        src = get("map.src", "");
        if (!src) continue;
      } else {
        continue;
      }

      var frame = document.createElement("iframe");
      frame.setAttribute("src", src);
      frame.setAttribute("title", label + " — map");
      frame.setAttribute("loading", "lazy");
      frame.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
      frame.setAttribute("aria-label", "Map showing " + label);
      frame.style.cssText =
        "position:absolute;inset:0;width:100%;height:100%;border:0;display:block";

      /* The kit's .map elements are already the right shape; make sure
         the iframe can fill whatever shape that is. */
      var computed = window.getComputedStyle ? window.getComputedStyle(el).position : "";
      if (computed === "static" || !computed) el.style.position = "relative";
      el.style.overflow = "hidden";

      /* Hide the drawn artwork, but keep the address card and the
         "get directions" label sitting on top of the real map — they are
         information, not decoration. Inline display:none is used because
         the [hidden] attribute loses to the kits' own class rules.
         Nothing is removed from the DOM, so flipping the config back
         restores the illustration exactly. */
      var decorative = el.querySelectorAll(
        ":scope > svg, :scope > canvas, .artwork__svg, .artwork__grain, " +
          ".map-pin, .map-plate__pin, .visually-hidden"
      );
      for (var c = 0; c < decorative.length; c++) {
        decorative[c].setAttribute("hidden", "hidden");
        decorative[c].style.display = "none";
      }

      el.appendChild(frame);

      /* The address card must stay above the iframe. */
      var keep = el.querySelectorAll(".map-card, .map-plate__label");
      for (var k = 0; k < keep.length; k++) {
        keep[k].style.position = keep[k].style.position || "relative";
        keep[k].style.zIndex = "2";
      }

      el.setAttribute("data-map-live", "1");

      /* The "illustrative placeholder" caption is no longer true. */
      var caption = el.parentNode && el.parentNode.querySelector
        ? el.parentNode.querySelector(".ph-caption, [data-map-caption]")
        : null;
      if (caption) caption.setAttribute("hidden", "hidden");

      used = true;
    }

    if (used) enabled.push("OpenStreetMap");
  }

  /* ================================================================== *
   * 4. BOOKING
   *
   *    Clinic and restaurant kits ship a full static request form. If the
   *    buyer already runs Cal.com or Calendly, point config.js at it and
   *    the embed appears in the slot marked data-booking-embed — the form
   *    stays as the no-JavaScript fallback unless data-booking-replace is
   *    set on it.
   *
   *    config.js:
   *      booking: { provider: "cal", url: "https://cal.com/you/30min" }
   *      booking: { provider: "calendly", url: "https://calendly.com/you/30min" }
   *
   *    Both embeds are third-party iframes that set cookies. They are off
   *    by default and SETUP.md says plainly what that means for consent.
   * ================================================================== */

  function initBooking() {
    var slots = document.querySelectorAll("[data-booking-embed]");
    if (!slots.length) return;

    var url = get("booking.url", "");
    var provider = String(get("booking.provider", "")).toLowerCase();
    if (!url) return;
    if (!provider) provider = /calendly\.com/i.test(url) ? "calendly" : "cal";
    if (window.location.protocol === "file:" && get("booking.allowFileProtocol", false) !== true) {
      /* Third-party embeds mostly refuse to load from file://; showing an
         empty box would look broken. Keep the form instead. */
      return;
    }

    var embedUrl = url;
    if (provider === "cal") {
      embedUrl += (url.indexOf("?") === -1 ? "?" : "&") + "embed=true";
    } else if (provider === "calendly") {
      embedUrl +=
        (url.indexOf("?") === -1 ? "?" : "&") +
        "embed_domain=" + encodeURIComponent(window.location.hostname) +
        "&embed_type=Inline&hide_gdpr_banner=0";
    }

    for (var i = 0; i < slots.length; i++) {
      var slot = slots[i];
      var frame = document.createElement("iframe");
      frame.setAttribute("src", embedUrl);
      frame.setAttribute("title", get("booking.title", "Book an appointment"));
      frame.setAttribute("loading", "lazy");
      frame.style.cssText =
        "width:100%;min-height:" + (get("booking.height", 680) | 0) + "px;border:0;display:block";
      slot.innerHTML = "";
      slot.appendChild(frame);
      slot.removeAttribute("hidden");
      slot.setAttribute("data-booking-live", "1");

      /* Optionally stand the embed in for the static form. Off unless the
         buyer asks for it: a booking embed that fails to load must never
         leave the page with no way to get in touch. */
      var target = slot.getAttribute("data-booking-replace");
      if (target && get("booking.replaceForm", false) === true) {
        var replaced = document.querySelectorAll(target);
        for (var r = 0; r < replaced.length; r++) {
          replaced[r].setAttribute("hidden", "hidden");
        }
      }
    }

    enabled.push(provider === "calendly" ? "Calendly" : "Cal.com");
  }

  /* ================================================================== *
   * 5. CALL-TO-ACTION LINKS
   *
   *    The SaaS kit's buttons point at in-page placeholders — #trial,
   *    #signin, #demo — because a template has no app to send anybody to.
   *    Give them real destinations here and every button across every
   *    page is repointed:
   *
   *      links: { trial: "https://app.example.com/signup",
   *               signin: "https://app.example.com/login" }
   *
   *    Any key maps to every <a href="#key"> on the page. Leave a key out
   *    and its buttons are left exactly as authored, so an unconfigured
   *    kit still scrolls to its own anchors rather than 404ing.
   * ================================================================== */

  function initLinks() {
    var links = cfg().links;
    if (!isObj(links)) return;
    var used = 0;

    for (var key in links) {
      if (!links.hasOwnProperty(key)) continue;
      var href = trim(links[key]);
      if (!href || PLACEHOLDER.test(href)) continue;

      var nodes = document.querySelectorAll('a[href="#' + key + '"]');
      for (var i = 0; i < nodes.length; i++) {
        nodes[i].setAttribute("href", href);
        /* Send off-site links out safely, and leave same-page ones alone.
           Comparing hosts via the anchor itself avoids the file:// case,
           where location.host is the empty string and a naive substring
           test matches everything. */
        if (/^https?:\/\//i.test(href) && nodes[i].host && nodes[i].host !== window.location.host) {
          nodes[i].setAttribute("rel", "noopener");
        }
        used++;
      }
    }

    if (used) enabled.push(used + " CTA link" + (used === 1 ? "" : "s"));
  }

  /* ================================================================== *
   * 6. Boot
   * ================================================================== */

  function boot() {
    /* Each step is independently guarded: a typo in one config block must
       never stop the others, and must never throw on the page. */
    try { applyBusinessDetails(); } catch (e) { warn("business details", e); }
    try { initAnalytics(); } catch (e) { warn("analytics", e); }
    try { initMaps(); } catch (e) { warn("maps", e); }
    try { initBooking(); } catch (e) { warn("booking", e); }
    try { initLinks(); } catch (e) { warn("CTA links", e); }
  }

  function warn(what, e) {
    if (window.console && console.warn) {
      console.warn("[site] " + what + " not applied: " + (e && e.message ? e.message : e));
    }
  }

  ready(boot);

  window.SiteKit = {
    version: VERSION,
    config: cfg,
    get: get,
    status: function () {
      return enabled.length
        ? "SiteKit " + VERSION + ": " + enabled.join(", ") + " active."
        : "SiteKit " + VERSION + ": nothing configured — the kit is running as a plain static site.";
    }
  };
})(window, document);
