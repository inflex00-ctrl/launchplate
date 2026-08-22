/* ==========================================================================
   forms.js — real form delivery for a static kit.
   --------------------------------------------------------------------------
   Plain ES5-flavoured JavaScript. No build step, no dependencies, no npm.
   Works from file:// and from any host. Safe to load on a page with no form.

   WHAT IT DOES
     • Reads one object — window.SITE_CONFIG — that the site owner edits in
       config.js. Nothing else in the kit needs touching.
     • Posts <form data-form> to a hosted form backend with fetch(), so the
       visitor never leaves the page.
     • Normalises the very different field shapes across the kits (contact,
       appointment, reservation, waitlist, listing submission, project brief)
       into a readable email: a real subject line, a real reply-to address,
       and a plain-text summary of every field.
     • Adds a honeypot and a time-trap so the cheapest bots are dropped.
     • Degrades honestly. With no key configured it either opens the visitor's
       mail client (mailto:) or says plainly that the form is not connected
       yet. It never pretends to have sent something it did not send.

   HOW A KIT USES IT
     Each kit already has its own validation and success UX. Those handlers
     call SiteForms.send(form) at the point where they used to fake a submit:

         SiteForms.send(form).then(function (result) {
           if (result.ok) { ...show the kit's success panel... }
           else           { ...show result.message as an error...   }
         });

     send() NEVER rejects. It always resolves with a result object, so a
     network failure can never produce an unhandled promise rejection.

     Any form that carries data-form and is NOT claimed by kit code gets a
     built-in handler automatically — that is what makes a brand new form the
     buyer adds work with no JavaScript at all.

   RESULT OBJECT
     { ok: Boolean,
       mode: "sent" | "spam" | "mailto" | "unconfigured" | "error",
       message: String,     // safe to show to a visitor, plain text
       status: Number }     // HTTP status, 0 when no request was made

   PUBLIC API
     SiteForms.send(form[, extraFields])   → Promise<result>
     SiteForms.isConfigured()              → Boolean
     SiteForms.provider()                  → provider descriptor or null
     SiteForms.collect(form)               → Object of normalised fields
     SiteForms.mailtoHref(form)            → String
     SiteForms.prepare(form)               → adds the spam traps to one form
     SiteForms.manage(form)                → "kit code owns this form's submit"
     SiteForms.describe()                  → one-line diagnostic string
   ========================================================================== */

(function (window, document) {
  "use strict";

  /* ------------------------------------------------------------------ *
   * 0. Small helpers — nothing here assumes a modern browser beyond
   *    fetch() and Promise, both guarded below.
   * ------------------------------------------------------------------ */

  var VERSION = "1.0.0";

  function isObj(v) {
    return v !== null && typeof v === "object";
  }

  function trim(v) {
    return String(v == null ? "" : v).replace(/^\s+|\s+$/g, "");
  }

  /* A very small deep-get so config lookups never throw on a half-filled
     SITE_CONFIG. get(cfg, "forms.provider") */
  function get(obj, path, fallback) {
    var parts = String(path).split(".");
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (!isObj(cur) || !(parts[i] in cur)) return fallback;
      cur = cur[parts[i]];
    }
    return cur === undefined || cur === "" ? fallback : cur;
  }

  /* Placeholder values shipped in config.js must never count as configured. */
  var PLACEHOLDER = /^(|YOUR_[A-Z0-9_]*|xxxxxxxx.*|paste-.*|your-.*|replace-me|TODO|CHANGE_ME)$/i;

  function realValue(v) {
    var s = trim(v);
    if (!s) return "";
    return PLACEHOLDER.test(s) ? "" : s;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* Human label for a field name: "first-name" → "First name" */
  function humanise(key) {
    var s = String(key).replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2");
    s = s.replace(/^\s+|\s+$/g, "");
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  /* ------------------------------------------------------------------ *
   * 1. Provider registry
   *
   *    Every entry describes one hosted form backend precisely enough to
   *    post to it. `build` returns { url, method, headers, body } and
   *    `read` turns the parsed response into { ok, message }.
   *
   *    Field notes, limits and GDPR posture for each are in SETUP.md.
   * ------------------------------------------------------------------ */

  var PROVIDERS = {
    /* ---------------------------------------------------------------- *
     * Web3Forms — the kit default.
     *   Endpoint : POST https://api.web3forms.com/submit
     *   Auth     : access_key in the payload. Public by design: the key
     *              only ever routes mail to the address it was created
     *              with, so it is safe in client-side HTML.
     *   Payload  : JSON (or multipart/form-data when a file is attached).
     *   Response : { "success": true|false, "message": "..." }
     *   Honeypot : a field named `botcheck`. Web3Forms now treats its own
     *              server-side honeypot handling as deprecated in favour
     *              of hCaptcha — the trap in this file is checked in the
     *              browser before we ever call them, so it still works.
     *   Files    : Web3Forms only accepts attachments on a paid plan.
     *              Everything else here is free-tier: 250 submissions a
     *              month, unlimited forms.
     *   Note     : the API deliberately refuses server-side calls (403).
     *              It is designed to be called from the browser, which is
     *              exactly what this file does.
     * ---------------------------------------------------------------- */
    web3forms: {
      label: "Web3Forms",
      keyLabel: "Access key",
      honeypot: "botcheck",
      files: true,
      filesNeedPaidPlan: true,
      docs: "https://docs.web3forms.com/",
      build: function (key, data, formData) {
        var payload = { access_key: key };
        for (var k in data) if (data.hasOwnProperty(k)) payload[k] = data[k];
        if (formData) {
          formData.append("access_key", key);
          return {
            url: "https://api.web3forms.com/submit",
            method: "POST",
            headers: { Accept: "application/json" },
            body: formData
          };
        }
        return {
          url: "https://api.web3forms.com/submit",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify(payload)
        };
      },
      read: function (res, json) {
        if (json && typeof json.success === "boolean") {
          return { ok: json.success, message: json.message || "" };
        }
        return { ok: res.ok, message: "" };
      }
    },

    /* ---------------------------------------------------------------- *
     * Formspree
     *   Endpoint : POST https://formspree.io/f/{form-id}
     *   Auth     : the form id is the endpoint; public by design.
     *   Payload  : JSON or FormData, with `Accept: application/json` to
     *              get a JSON reply rather than Formspree's HTML page.
     *   Response : {} + HTTP 200 on success; { errors:[{message,field}] }
     *   Honeypot : a field named `_gotcha`.
     *   Reply-to : send a field literally named `email`, or `_replyto`.
     *   Note     : free tier is 50 submissions a month and no file
     *              uploads; custom redirects are a paid feature, so the
     *              no-JavaScript fallback lands on Formspree's own thank
     *              you page. Restrict-to-domain is free and worth turning
     *              on — it depends on the Referer header, so keep the
     *              site's Referrer-Policy no stricter than
     *              strict-origin-when-cross-origin.
     * ---------------------------------------------------------------- */
    formspree: {
      label: "Formspree",
      keyLabel: "Form ID (the part after /f/)",
      honeypot: "_gotcha",
      files: true,
      docs: "https://help.formspree.io/",
      endpoint: function (key) {
        return /^https?:/i.test(key) ? key : "https://formspree.io/f/" + key;
      },
      build: function (key, data, formData) {
        var url = PROVIDERS.formspree.endpoint(key);
        if (formData) {
          return {
            url: url,
            method: "POST",
            headers: { Accept: "application/json" },
            body: formData
          };
        }
        var payload = {};
        for (var k in data) if (data.hasOwnProperty(k)) payload[k] = data[k];
        if (payload.email) payload._replyto = payload.email;
        if (payload.subject) payload._subject = payload.subject;
        return {
          url: url,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify(payload)
        };
      },
      /* Success is HTTP 200 with { "next": "https://formspree.io/thanks…" }.
         Failure is a 4xx with { error, errors:[{ code, field, message }] }. */
      read: function (res, json) {
        if (json && json.errors && json.errors.length) {
          return { ok: false, message: json.errors[0].message || "" };
        }
        if (json && json.error) return { ok: false, message: String(json.error) };
        return { ok: res.ok, message: "" };
      }
    },

    /* ---------------------------------------------------------------- *
     * FormSubmit
     *   Endpoint : POST https://formsubmit.co/ajax/{token-or-email}
     *              Use the random token, not a bare address — a bare
     *              address in public HTML is a spam magnet.
     *   Auth     : none. Free, no account. First submission triggers a
     *              confirmation email you must click.
     *   Payload  : JSON (Content-Type: application/json).
     *   Response : { "success": "true", "message": "..." }  (string!)
     *   Honeypot : a field named `_honey`.
     *   Extras   : _subject, _template, _captcha ("false" to disable).
     * ---------------------------------------------------------------- */
    formsubmit: {
      label: "FormSubmit",
      keyLabel: "Token (or your email address)",
      honeypot: "_honey",
      files: true,
      docs: "https://formsubmit.co/",
      build: function (key, data, formData) {
        var url = "https://formsubmit.co/ajax/" + encodeURIComponent(key);
        /* FormSubmit reads the Referer header to work out which site sent
           the form, and rejects the submission outright when it is
           missing or stripped. `_url` is the documented way to say it
           explicitly, which also makes the notification email useful. */
        var page = data.page || "";
        if (formData) {
          if (page) formData.append("_url", page);
          formData.append("_template", "table");
          return { url: url, method: "POST", headers: { Accept: "application/json" }, body: formData };
        }
        var payload = { _template: "table" };
        for (var k in data) if (data.hasOwnProperty(k)) payload[k] = data[k];
        if (payload.subject) payload._subject = payload.subject;
        if (page) payload._url = page;
        return {
          url: url,
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload)
        };
      },
      /* Two traps here, both deliberate:
         · `success` is the STRING "false", which is truthy in JavaScript,
           so `if (json.success)` would pass on every failure.
         · failures come back as HTTP 200, so res.ok proves nothing. */
      read: function (res, json) {
        if (json && json.success !== undefined) {
          var ok = json.success === true || String(json.success).toLowerCase() === "true";
          return { ok: ok, message: ok ? "" : json.message || "" };
        }
        return { ok: false, message: (json && json.message) || "" };
      }
    },

    /* ---------------------------------------------------------------- *
     * Forminit — formerly Getform.io, renamed January 2026. Old
     * getform.io endpoints redirect here.
     *   Endpoint : POST https://forminit.com/f/{form-id}
     *   Auth     : set the form to "Public" mode in the dashboard — that
     *              is the mode intended for browser use, because there is
     *              no server to keep a secret in. Lock it down with
     *              Authorized Domains rather than with a secret.
     *              Never put a sk_live_… API key in client-side HTML.
     *   Payload  : multipart FormData. Forminit's JSON shape is a nested
     *              "blocks" structure that cannot carry files, so the kit
     *              always posts FormData — one code path, files included.
     *   Response : { "success": true, "submission": {…} }
     *              { "success": false, "error": "…", "code": 400,
     *                "message": "…" }
     *   Honeypot : a field named `_gotcha`.
     *   Rate     : 1 request per 5 seconds without an API key.
     *   EU       : data stored in EU data centres, DPA on request.
     * ---------------------------------------------------------------- */
    forminit: {
      label: "Forminit",
      keyLabel: "Form ID (the part after /f/)",
      honeypot: "_gotcha",
      files: true,
      alwaysFormData: true,
      docs: "https://forminit.com/docs",
      build: function (key, data, formData) {
        var url = /^https?:/i.test(key) ? key : "https://forminit.com/f/" + key;
        var fd = formData;
        if (!fd) {
          fd = new FormData();
          for (var k in data) if (data.hasOwnProperty(k)) fd.append(k, data[k]);
        }
        /* Forminit reads the sender from its own field convention. Adding
           these alongside the plain names costs nothing and makes the
           dashboard show a real person rather than "unknown sender". */
        if (data.email) fd.append("fi-sender-email", data.email);
        if (data.name) fd.append("fi-sender-firstName", data.name);
        if (data.message) fd.append("fi-text-message", data.message);
        return {
          url: url,
          method: "POST",
          headers: { Accept: "application/json" },
          body: fd
        };
      },
      read: function (res, json) {
        if (json && typeof json.success === "boolean") {
          return { ok: json.success, message: json.success ? "" : json.message || "" };
        }
        return { ok: res.ok, message: "" };
      }
    },

    /* ---------------------------------------------------------------- *
     * Basin (usebasin.com)
     *   Endpoint : POST https://usebasin.com/f/{form-id}
     *   Payload  : JSON or FormData, Accept: application/json.
     *   Response : undocumented. Success is signalled by HTTP status
     *              alone; the body may carry `redirect_url`. Code
     *              against res.ok, which is what Basin's own JS does.
     *   Honeypot : Basin has server-side spam filtering; `_gotcha` is
     *              still honoured as a client-side trap.
     *   Note     : hosted in Canada / USA, no EU data region. Free tier
     *              is 50 submissions a month. See SETUP.md before
     *              choosing this one for an EU client.
     * ---------------------------------------------------------------- */
    basin: {
      label: "Basin",
      keyLabel: "Form ID (the part after /f/)",
      honeypot: "_gotcha",
      files: true,
      docs: "https://usebasin.com/docs",
      build: function (key, data, formData) {
        var url = /^https?:/i.test(key) ? key : "https://usebasin.com/f/" + key;
        if (formData) {
          return { url: url, method: "POST", headers: { Accept: "application/json" }, body: formData };
        }
        return {
          url: url,
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data)
        };
      },
      read: function (res, json) {
        if (json && json.error) return { ok: false, message: json.error };
        return { ok: res.ok, message: "" };
      }
    },

    /* ---------------------------------------------------------------- *
     * Netlify Forms
     *   Only works on a site deployed to Netlify, and only if the form
     *   markup was present in the HTML at deploy time so Netlify's build
     *   bot could detect it. The kit adds the required hidden field
     *   automatically; you must also add netlify + name to the <form>.
     *   See SETUP.md, "Netlify Forms", for the two-line markup change.
     *
     *   Endpoint : POST to the page's own path ("/")
     *   Payload  : application/x-www-form-urlencoded, incl. `form-name`
     *   Response : HTTP 200 with an HTML body. No JSON.
     *   Honeypot : a field named by the form's `netlify-honeypot` attr;
     *              the kit uses `bot-field`.
     * ---------------------------------------------------------------- */
    netlify: {
      label: "Netlify Forms",
      keyLabel: "Form name (matches the form's name attribute)",
      honeypot: "bot-field",
      files: true,
      localOnly: true,
      docs: "https://docs.netlify.com/manage/forms/setup/",
      build: function (key, data, formData) {
        var body;
        var headers = { Accept: "application/json" };
        if (formData) {
          formData.append("form-name", key);
          body = formData;
        } else {
          var pairs = ["form-name=" + encodeURIComponent(key)];
          for (var k in data) {
            if (!data.hasOwnProperty(k)) continue;
            pairs.push(encodeURIComponent(k) + "=" + encodeURIComponent(data[k]));
          }
          body = pairs.join("&");
          headers["Content-Type"] = "application/x-www-form-urlencoded";
        }
        return { url: location.pathname || "/", method: "POST", headers: headers, body: body };
      },
      read: function (res) {
        return { ok: res.ok, message: "" };
      }
    },

    /* ---------------------------------------------------------------- *
     * custom — your own endpoint. Posts JSON, expects HTTP 2xx.
     *   forms: { provider: "custom", key: "https://api.example.com/lead" }
     * ---------------------------------------------------------------- */
    custom: {
      label: "Custom endpoint",
      keyLabel: "Full URL of your endpoint",
      honeypot: "_gotcha",
      files: true,
      docs: "",
      build: function (key, data, formData) {
        if (formData) {
          return { url: key, method: "POST", headers: { Accept: "application/json" }, body: formData };
        }
        return {
          url: key,
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data)
        };
      },
      read: function (res, json) {
        if (json && json.success === false) return { ok: false, message: json.message || "" };
        if (json && json.error) return { ok: false, message: String(json.error) };
        return { ok: res.ok, message: "" };
      }
    }
  };

  /* ------------------------------------------------------------------ *
   * 2. Configuration
   * ------------------------------------------------------------------ */

  function cfg() {
    return isObj(window.SITE_CONFIG) ? window.SITE_CONFIG : {};
  }

  function providerName() {
    var name = String(get(cfg(), "forms.provider", "")).toLowerCase();
    return PROVIDERS[name] ? name : "";
  }

  function provider() {
    var n = providerName();
    return n ? PROVIDERS[n] : null;
  }

  function providerKey() {
    return realValue(get(cfg(), "forms.key", ""));
  }

  function isConfigured() {
    return !!(provider() && providerKey());
  }

  function businessEmail() {
    return realValue(get(cfg(), "business.email", ""));
  }

  function siteName() {
    return realValue(get(cfg(), "business.name", "")) || document.title || "this website";
  }

  /* "mailto" (default) or "notice". What happens when nothing is configured. */
  function fallbackMode() {
    var mode = String(get(cfg(), "forms.fallback", "mailto")).toLowerCase();
    if (mode !== "mailto" && mode !== "notice") mode = "mailto";
    if (mode === "mailto" && !businessEmail()) mode = "notice";
    return mode;
  }

  /* ------------------------------------------------------------------ *
   * 3. Spam traps
   *
   *    Two cheap, JS-free-visitor-friendly checks:
   *      • a honeypot input that is invisible to people and irresistible
   *        to naive bots
   *      • a timestamp planted when the page loads; a form completed in
   *        under `minSeconds` was not completed by a human
   *
   *    Neither is a captcha and neither is claimed to be. They remove the
   *    bulk of drive-by spam; the provider's own filtering does the rest.
   * ------------------------------------------------------------------ */

  var HP_STYLE =
    "position:absolute!important;left:-9999px!important;top:auto!important;" +
    "width:1px!important;height:1px!important;overflow:hidden!important;" +
    "opacity:0!important;pointer-events:none!important";

  var TS_ATTR = "data-form-ts";

  function minSeconds() {
    var n = parseFloat(get(cfg(), "forms.minSeconds", 3));
    return isNaN(n) || n < 0 ? 3 : n;
  }

  /* Names already used as honeypots in the kits' own markup, plus every
     provider's convention — checked on submit whether we injected them
     or the template shipped with them. */
  var HP_NAMES = ["_gotcha", "botcheck", "_honey", "bot-field", "website", "_hp", "url_field"];

  function prepare(form) {
    if (!form || form.getAttribute("data-form-prepared") === "1") return form;
    form.setAttribute("data-form-prepared", "1");

    var p = provider();
    var hpName = (p && p.honeypot) || "_gotcha";

    if (!form.querySelector('[name="' + hpName + '"]')) {
      var wrap = document.createElement("div");
      wrap.setAttribute("aria-hidden", "true");
      wrap.setAttribute("data-form-trap", "");
      wrap.style.cssText = HP_STYLE;
      var hp = document.createElement("input");
      hp.type = "text";
      hp.name = hpName;
      hp.tabIndex = -1;
      hp.autocomplete = "off";
      hp.value = "";
      /* A label keeps screen readers from announcing an unnamed input;
         aria-hidden on the wrapper keeps them from announcing it at all. */
      wrap.appendChild(hp);
      form.appendChild(wrap);
    }

    /* Time-trap. Stored as an attribute rather than a field so it is never
       posted to the provider as junk data. */
    form.setAttribute(TS_ATTR, String(Date.now()));

    return form;
  }

  /* Returns true when this submission looks automated. */
  function looksLikeSpam(form) {
    for (var i = 0; i < HP_NAMES.length; i++) {
      var nodes = form.querySelectorAll('[name="' + HP_NAMES[i] + '"]');
      for (var j = 0; j < nodes.length; j++) {
        if (trim(nodes[j].value)) return true;
      }
    }
    var started = parseInt(form.getAttribute(TS_ATTR), 10);
    if (started && (Date.now() - started) / 1000 < minSeconds()) return true;
    return false;
  }

  /* ------------------------------------------------------------------ *
   * 4. Field normalisation
   *
   *    The seven kits ask for very different things. What the site owner
   *    actually wants in their inbox is always the same: who, how to
   *    reply, and what they said. collect() produces that from any of the
   *    shapes, without any per-kit configuration.
   * ------------------------------------------------------------------ */

  /* Field names we never forward. */
  var SKIP = /^(_gotcha|botcheck|_honey|bot-field|_hp|url_field|access_key|form-name)$/i;

  /* Candidate names, most specific first. */
  var NAME_KEYS = ["name", "full-name", "full_name", "fullname", "your-name", "contact-name"];
  var FIRST_KEYS = ["first-name", "first_name", "firstname", "given-name"];
  var LAST_KEYS = ["last-name", "last_name", "lastname", "family-name", "surname"];
  var MESSAGE_KEYS = [
    "message", "matter", "notes", "brief", "details", "description",
    "enquiry", "inquiry", "comments", "usecase", "use-case"
  ];

  function firstOf(map, keys) {
    for (var i = 0; i < keys.length; i++) {
      if (map[keys[i]] && trim(map[keys[i]])) return trim(map[keys[i]]);
    }
    return "";
  }

  /* Read a form into { fieldName: "value" }, joining repeated fields
     (checkbox groups, multi-selects) with a comma. */
  function rawFields(form) {
    var out = {};
    var order = [];
    var els = form.elements;

    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var name = el.name;
      if (!name || el.disabled || SKIP.test(name)) continue;
      if (el.type === "file" || el.type === "submit" || el.type === "button" || el.type === "reset") continue;
      if ((el.type === "checkbox" || el.type === "radio") && !el.checked) continue;

      var value;
      if (el.type === "checkbox") {
        value = el.value && el.value !== "on" ? el.value : "Yes";
      } else if (el.multiple && el.options) {
        var picked = [];
        for (var o = 0; o < el.options.length; o++) {
          if (el.options[o].selected) picked.push(el.options[o].value);
        }
        value = picked.join(", ");
      } else {
        value = el.value;
      }

      value = trim(value);
      if (!value) continue;

      if (out.hasOwnProperty(name)) {
        out[name] = out[name] + ", " + value;
      } else {
        out[name] = value;
        order.push(name);
      }
    }

    out.__order = order;
    return out;
  }

  /* A readable plain-text block: every field, in the order it appears on
     the page, one per line. This is what makes a reservation or an
     appointment request legible in an inbox. */
  function summarise(map) {
    var lines = [];
    var order = map.__order || [];
    for (var i = 0; i < order.length; i++) {
      var k = order[i];
      lines.push(humanise(k) + ": " + map[k]);
    }
    return lines.join("\n");
  }

  function formKind(form) {
    var explicit = form.getAttribute("data-form-type");
    if (explicit) return explicit;
    var id = (form.id || "").toLowerCase();
    if (/book|appoint|reserv/.test(id)) return "Booking request";
    if (/waitlist/.test(id)) return "Waitlist signup";
    if (/submit|listing/.test(id)) return "Listing submission";
    if (/subscribe|newsletter/.test(id)) return "Subscription";
    if (form.hasAttribute("data-waitlist-form")) return "Waitlist signup";
    if (form.hasAttribute("data-brief-form")) return "Project brief";
    return "Website enquiry";
  }

  function collect(form, extra) {
    var map = rawFields(form);
    var data = {};
    var i;

    var order = map.__order || [];
    for (i = 0; i < order.length; i++) data[order[i]] = map[order[i]];

    /* --- who ---------------------------------------------------------- */
    var name = firstOf(map, NAME_KEYS);
    if (!name) {
      var f = firstOf(map, FIRST_KEYS);
      var l = firstOf(map, LAST_KEYS);
      name = trim(f + " " + l);
    }

    /* --- how to reply -------------------------------------------------- */
    var email = trim(map.email || map["e-mail"] || map["your-email"] || map["maker-email"] || "");
    if (!email) {
      var mailInput = form.querySelector('input[type="email"]');
      if (mailInput) email = trim(mailInput.value);
    }

    /* --- what they said ------------------------------------------------ */
    var message = firstOf(map, MESSAGE_KEYS);
    var summary = summarise(map);
    /* Always send the full summary as the body: a booking form with no
       free-text field must still arrive as something a person can read. */
    var body = summary;
    if (message && order.length > 1) {
      body = summary;
    } else if (message) {
      body = message;
    }

    var kind = formKind(form);
    var subject =
      form.getAttribute("data-form-subject") ||
      kind + (name ? " from " + name : "") + " — " + siteName();

    if (name) data.name = name;
    if (email) data.email = email;
    data.subject = subject;
    data.message = body;

    /* Useful context that costs nothing and helps triage. */
    data.form_type = kind;
    data.page = (function () {
      try {
        return location.href.split("#")[0];
      } catch (e) {
        return "";
      }
    })();
    data.submitted_at = new Date().toISOString();

    /* Web3Forms uses these for the From: header of the notification. */
    data.from_name = name || siteName();
    if (email) data.replyto = email;

    if (isObj(extra)) {
      for (var k in extra) if (extra.hasOwnProperty(k)) data[k] = extra[k];
    }

    return data;
  }

  /* Files present? Then we must post multipart, not JSON. */
  function filesIn(form) {
    var inputs = form.querySelectorAll('input[type="file"]');
    for (var i = 0; i < inputs.length; i++) {
      if (inputs[i].files && inputs[i].files.length) return true;
    }
    return false;
  }

  function buildFormData(form, data) {
    var fd = new FormData();
    for (var k in data) {
      if (data.hasOwnProperty(k) && k !== "__order") fd.append(k, data[k]);
    }
    var inputs = form.querySelectorAll('input[type="file"]');
    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      if (!input.files) continue;
      for (var f = 0; f < input.files.length; f++) {
        fd.append(input.name || "attachment", input.files[f]);
      }
    }
    return fd;
  }

  /* ------------------------------------------------------------------ *
   * 5. mailto: fallback
   *
   *    Not a consolation prize: for a one-person law firm this is a
   *    perfectly legitimate way to ship, and it needs no third party and
   *    no data processor at all.
   * ------------------------------------------------------------------ */

  function mailtoHref(form) {
    var to = businessEmail();
    if (!to) return "";
    var data = collect(form);
    var body = data.message || "";
    return (
      "mailto:" + to +
      "?subject=" + encodeURIComponent(data.subject || "Website enquiry") +
      "&body=" + encodeURIComponent(body)
    );
  }

  /* ------------------------------------------------------------------ *
   * 6. send()
   * ------------------------------------------------------------------ */

  var MESSAGES = {
    spam: "Thank you — your message has been received.",
    sent: "Thank you — your message has been sent.",
    mailto:
      "Your email app should now be open with this message ready to send. " +
      "If nothing happened, email us directly and we will pick it up.",
    unconfigured:
      "This form is not connected to an inbox yet. Nothing was sent. " +
      "(Site owner: add your form provider key in config.js — see SETUP.md.)",
    network:
      "We could not reach the server just now. Please check your connection " +
      "and try again, or contact us directly.",
    error: "Something went wrong sending your message. Please try again, or contact us directly."
  };

  function resolved(res) {
    /* Promise is guarded: if a browser somehow lacks it, callers get a
       tiny thenable rather than a TypeError. */
    if (typeof window.Promise === "function") return window.Promise.resolve(res);
    return {
      then: function (fn) {
        try { fn(res); } catch (e) { /* ignore */ }
        return this;
      },
      "catch": function () { return this; }
    };
  }

  function timeoutMs() {
    var n = parseInt(get(cfg(), "forms.timeout", 15000), 10);
    return isNaN(n) || n < 1000 ? 15000 : n;
  }

  /* Forms with a request in flight. A double-click, or Enter pressed
     twice, must not put two copies of the same enquiry in the inbox. */
  var inFlight = [];

  function busy(form) {
    return inFlight.indexOf(form) !== -1;
  }

  function send(form, extra) {
    if (!form) return resolved({ ok: false, mode: "error", message: MESSAGES.error, status: 0 });

    if (busy(form)) {
      return resolved({
        ok: false,
        mode: "busy",
        message: "Your message is still being sent — one moment.",
        status: 0
      });
    }

    prepare(form);

    /* --- 1. spam traps ------------------------------------------------ *
       A bot gets the success message and nothing else happens. Telling it
       that it was caught only teaches the next one.                       */
    if (looksLikeSpam(form)) {
      return resolved({ ok: true, mode: "spam", message: MESSAGES.spam, status: 0 });
    }

    /* --- 2. nothing configured ---------------------------------------- */
    if (!isConfigured()) {
      if (fallbackMode() === "mailto") {
        var href = mailtoHref(form);
        if (href) {
          try {
            window.location.href = href;
          } catch (e) { /* popup blocked or no mail handler — the copy below covers it */ }
          /* href is handed back so a kit can also render "or email us
             directly" as a real link when the mail client does not open. */
          return resolved({
            ok: true,
            mode: "mailto",
            message: MESSAGES.mailto,
            href: href,
            status: 0
          });
        }
      }
      return resolved({
        ok: false,
        mode: "unconfigured",
        message: MESSAGES.unconfigured,
        status: 0
      });
    }

    /* --- 3. real submission ------------------------------------------- */
    var p = provider();
    var key = providerKey();
    var data = collect(form, extra);
    delete data.__order;

    /* Post multipart when the form carries files, or when the provider
       only speaks multipart. Otherwise JSON, which is smaller and easier
       to debug in the network panel. */
    var multipart =
      typeof FormData === "function" && (p.alwaysFormData || (p.files && filesIn(form)));
    var req;
    try {
      req = p.build(key, data, multipart ? buildFormData(form, data) : null);
    } catch (e) {
      return resolved({ ok: false, mode: "error", message: MESSAGES.error, status: 0 });
    }

    if (typeof window.fetch !== "function") {
      /* Very old browser. Rather than fail silently, hand the visitor the
         mailto so their message still reaches somebody. */
      var alt = mailtoHref(form);
      if (alt) {
        try { window.location.href = alt; } catch (e2) { /* ignore */ }
        return resolved({ ok: true, mode: "mailto", message: MESSAGES.mailto, href: alt, status: 0 });
      }
      return resolved({ ok: false, mode: "error", message: MESSAGES.error, status: 0 });
    }

    var controller = null;
    var timer = null;
    var opts = { method: req.method, headers: req.headers, body: req.body };

    if (typeof window.AbortController === "function") {
      controller = new window.AbortController();
      opts.signal = controller.signal;
      timer = window.setTimeout(function () {
        try { controller.abort(); } catch (e) { /* ignore */ }
      }, timeoutMs());
    }

    inFlight.push(form);
    function done(result) {
      var i = inFlight.indexOf(form);
      if (i !== -1) inFlight.splice(i, 1);
      return result;
    }

    return window
      .fetch(req.url, opts)
      .then(function (res) {
        if (timer) window.clearTimeout(timer);
        return res.text().then(
          function (text) {
            var json = null;
            try { json = JSON.parse(text); } catch (e) { /* HTML or empty body */ }
            var verdict = p.read(res, json);
            if (verdict.ok) {
              return {
                ok: true,
                mode: "sent",
                message: verdict.message || MESSAGES.sent,
                status: res.status
              };
            }
            return {
              ok: false,
              mode: "error",
              message: verdict.message || MESSAGES.error,
              status: res.status
            };
          },
          function () {
            return {
              ok: res.ok,
              mode: res.ok ? "sent" : "error",
              message: res.ok ? MESSAGES.sent : MESSAGES.error,
              status: res.status
            };
          }
        );
      })
      ["catch"](function () {
        if (timer) window.clearTimeout(timer);
        return { ok: false, mode: "error", message: MESSAGES.network, status: 0 };
      })
      .then(done);
  }

  /* ------------------------------------------------------------------ *
   * 7. Built-in handler
   *
   *    Kits wire their own richer UX. This is the zero-JavaScript path
   *    for a form the site owner adds later: give it data-form and it
   *    works. Validation is the browser's own Constraint Validation API
   *    plus the .is-invalid convention every kit's CSS already styles.
   * ------------------------------------------------------------------ */

  var CLAIMED = "data-form-managed";

  function manage(form) {
    if (form) {
      form.setAttribute(CLAIMED, "1");
      prepare(form);
    }
    return form;
  }

  function statusNode(form) {
    return (
      form.querySelector("[data-form-status]") ||
      form.querySelector(".form-status") ||
      (form.id ? document.getElementById(form.id + "-status") : null) ||
      /* Some kits put the banner beside the form rather than inside it. */
      (form.parentElement
        ? form.parentElement.querySelector("[data-form-status], .form-status")
        : null)
    );
  }

  /* Writes a message into whichever status-banner shape the kit uses.
     Returns true if it found somewhere to put it. */
  function renderStatus(form, result) {
    var node = statusNode(form);
    if (!node) return false;

    var text = node.querySelector("[data-status-text]") || node.querySelector("span") || node.querySelector("p");
    var strong = result.ok ? "Thank you." : "Not sent.";
    var html = "<strong>" + strong + "</strong> " + escapeHtml(result.message);

    if (text) {
      text.innerHTML = html;
    } else {
      node.innerHTML = "<span>" + html + "</span>";
    }

    node.classList.add("is-visible");
    node.setAttribute("data-visible", "true");
    node.classList.toggle("form-status--error", !result.ok);
    node.setAttribute("data-form-state", result.ok ? "ok" : "error");
    node.setAttribute("tabindex", "-1");
    try { node.focus(); } catch (e) { /* ignore */ }
    return true;
  }

  function fieldOf(control) {
    if (!control.closest) return null;
    return control.closest(".field") || control.closest(".consent") || control.closest("fieldset");
  }

  function autoValidate(form) {
    var els = form.querySelectorAll("input, select, textarea");
    var firstBad = null;
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.disabled || el.type === "hidden" || !el.willValidate) continue;
      var ok = el.checkValidity();
      var wrap = fieldOf(el);
      if (wrap) wrap.classList.toggle("is-invalid", !ok);
      el.setAttribute("aria-invalid", ok ? "false" : "true");
      if (!ok && !firstBad) firstBad = el;
    }
    return firstBad;
  }

  function setBusy(btn, busy, label) {
    if (!btn) return;
    if (busy) {
      btn.setAttribute("aria-disabled", "true");
      btn.setAttribute("data-form-label", btn.textContent);
      btn.disabled = true;
      btn.textContent = label || btn.getAttribute("data-sending") || "Sending…";
    } else {
      btn.removeAttribute("aria-disabled");
      btn.disabled = false;
      var old = btn.getAttribute("data-form-label");
      if (old !== null) btn.textContent = old;
      btn.removeAttribute("data-form-label");
    }
  }

  function attachDefault(form) {
    prepare(form);

    form.addEventListener("submit", function (event) {
      /* The kit's own script may have claimed this form after we attached
         — deferred scripts and the auto-init timer can interleave. Re-check
         at submit time so a form can never be sent twice. We do not call
         preventDefault() here: the owning handler will. */
      if (form.getAttribute(CLAIMED) === "1") return;

      event.preventDefault();

      var firstBad = autoValidate(form);
      if (firstBad) {
        try { firstBad.focus(); } catch (e) { /* ignore */ }
        renderStatus(form, {
          ok: false,
          message: "Please check the highlighted fields and try again."
        });
        return;
      }

      var btn = form.querySelector('button[type="submit"], input[type="submit"], [type="submit"]');
      setBusy(btn, true);

      send(form).then(function (result) {
        setBusy(btn, false);
        if (!renderStatus(form, result) && !result.ok && result.mode === "unconfigured") {
          /* No banner anywhere in the markup — say it out loud rather than
             leaving the visitor staring at a form that did nothing. */
          try { window.alert(result.message); } catch (e) { /* ignore */ }
        }
        if (result.ok && result.mode !== "mailto") form.reset();
        /* A fresh timestamp so a second message is not caught by the trap. */
        form.setAttribute(TS_ATTR, String(Date.now()));
      });
    });
  }

  /* The kits carry visible "this form is not connected yet" notices. They
     are true of an unconfigured template and false the moment a provider
     key is set, so they are removed rather than left to mislead a real
     client's visitors. Mark any of your own copy the same way:
         <p data-demo-notice>…</p> */
  function updateDemoNotices() {
    var notices = document.querySelectorAll("[data-demo-notice]");
    var configured = isConfigured();
    for (var i = 0; i < notices.length; i++) {
      if (configured) {
        notices[i].setAttribute("hidden", "hidden");
        notices[i].style.display = "none";
      } else {
        notices[i].removeAttribute("hidden");
        notices[i].style.display = "";
      }
    }
  }

  function autoInit() {
    updateDemoNotices();

    var forms = document.querySelectorAll("form[data-form], form[data-site-form]");
    for (var i = 0; i < forms.length; i++) {
      var form = forms[i];
      if (form.getAttribute(CLAIMED) === "1") {
        prepare(form);
        continue;
      }
      attachDefault(form);
    }
    /* Traps on every other kit form too, so kit-owned handlers get them
       whether or not they remembered to call prepare(). */
    var others = document.querySelectorAll(
      "form[data-demo-form], form[data-brief-form], form[data-waitlist-form]"
    );
    for (var j = 0; j < others.length; j++) prepare(others[j]);
  }

  /* Kit scripts run on DOMContentLoaded and call manage() on the forms
     they own. Deferring auto-init by one task lets them get there first,
     so a form is never handled twice. */
  function scheduleInit() {
    window.setTimeout(autoInit, 0);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleInit);
  } else {
    scheduleInit();
  }

  /* ------------------------------------------------------------------ *
   * 8. Public API
   * ------------------------------------------------------------------ */

  window.SiteForms = {
    version: VERSION,
    providers: PROVIDERS,
    send: send,
    collect: collect,
    prepare: prepare,
    manage: manage,
    renderStatus: renderStatus,
    setBusy: setBusy,
    mailtoHref: mailtoHref,
    isConfigured: isConfigured,
    provider: provider,
    messages: MESSAGES,
    looksLikeSpam: looksLikeSpam,
    describe: function () {
      if (!isConfigured()) {
        return (
          "SiteForms " + VERSION + ": not configured. Forms will " +
          (fallbackMode() === "mailto"
            ? "open the visitor's mail client (" + businessEmail() + ")."
            : "show a 'not connected yet' notice.")
        );
      }
      return (
        "SiteForms " + VERSION + ": sending via " + provider().label +
        " for " + siteName() + "."
      );
    }
  };
})(window, document);
