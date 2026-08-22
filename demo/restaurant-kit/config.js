/* ==========================================================================
   EMBER & OAK — SITE CONFIGURATION
   --------------------------------------------------------------------------
   THIS IS THE ONLY FILE YOU NEED TO EDIT TO PUT THIS SITE LIVE.

   Everything below is optional. A kit with this file untouched still
   renders, still validates its forms, and makes no external requests at
   all — it just cannot deliver an enquiry yet.

   Fill in `business` and `forms` and you have a working client site.
   Full walkthrough, including how to get a form key and where to deploy:
   see SETUP.md.

   Load order matters and is already correct in every page:
       config.js  →  js/forms.js  →  js/integrations.js  →  js/main.js
   ========================================================================== */

window.SITE_CONFIG = {

  /* ------------------------------------------------------------------ *
   * 1. THE BUSINESS
   *
   *    Filling these in does two things: the contact form uses the email
   *    address for its mailto: fallback, and — because `demo` below lists
   *    the placeholder details this template ships with — every phone
   *    number, email address and mention of the business name across all
   *    pages is swapped for yours automatically on load.
   *
   *    Leave a field blank and that detail is simply left as authored.
   *    Set replaceDemoDetails: false to switch the swapping off entirely
   *    and edit the HTML by hand instead.
   * ------------------------------------------------------------------ */
  business: {
    name:    "",           /* e.g. "Ember & Oak" */
    email:   "",           /* e.g. "hello@emberandoak.example.com" — where enquiries go */
    phone:   "",           /* e.g. "01 555 0184" */
    address: "",           /* e.g. "14 Marlowe Street" */
    url:     "",           /* e.g. "https://www.example.com" */
    replaceDemoDetails: true
  },

  /* ------------------------------------------------------------------ *
   * 2. FORMS  ← the important one
   *
   *    Pick a provider, paste its key, done. Every form in the kit then
   *    posts for real without the visitor leaving the page.
   *
   *    provider   one of:
   *                 "web3forms"  free 250/month, EU option, key is
   *                              public-safe by design.       RECOMMENDED
   *                 "forminit"   (was Getform) 100/month free, data
   *                              stored in the EU, DPA on request
   *                 "formspree"  50/month free, US-hosted, DPA on paid
   *                 "formsubmit" free & unlimited, no account, US-hosted
   *                 "basin"      50/month free, Canada/US-hosted
   *                 "netlify"    only on a site deployed to Netlify;
   *                              needs two extra HTML attributes, see
   *                              SETUP.md
   *                 "custom"     your own endpoint; `key` is the URL
   *
   *    key        Web3Forms  → the access key from your confirmation email
   *               Forminit   → the id after /f/ in your endpoint URL
   *               Formspree  → the id after /f/ in your endpoint URL
   *               FormSubmit → your token (get it from formsubmit.co)
   *               Basin      → the id after /f/ in your endpoint URL
   *               Netlify    → the form's `name` attribute
   *               custom     → the full URL to POST to
   *
   *    Every one of these keys is designed to sit in public HTML. None of
   *    them can read your submissions; they can only add to them.
   *
   *    fallback   what happens with no key set:
   *                 "mailto" (default) opens the visitor's mail client
   *                          pre-filled, using business.email
   *                 "notice" shows "this form is not connected yet"
   *
   *    minSeconds a form completed faster than this is treated as a bot.
   *               Three seconds is a comfortable default; raise it if you
   *               still get spam, lower it for a one-field signup.
   * ------------------------------------------------------------------ */
  forms: {
    provider:   "",        /* "web3forms" */
    key:        "",        /* "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" */
    fallback:   "mailto",
    minSeconds: 3,
    timeout:    15000
  },

  /* ------------------------------------------------------------------ *
   * 3. ANALYTICS  (optional, off by default)
   *
   *    Cookieless and privacy-first only. None of these sets a cookie or
   *    collects personal data, which is why none of them needs a consent
   *    banner in the EU. Google Analytics is deliberately not offered.
   *
   *      provider: "plausible"   + domain: "example.com"
   *      provider: "umami"       + id: "…", src: "https://…/script.js"
   *      provider: "cloudflare"  + token: "…"
   *      provider: ""            nothing loads at all  (default)
   *
   *    Nothing is loaded when the page is opened from file://, so testing
   *    locally never pollutes your statistics.
   * ------------------------------------------------------------------ */
  analytics: {
    provider: "",
    domain:   "",
    id:       "",
    src:      "",
    token:    ""
  },

  /* ------------------------------------------------------------------ *
   * 4. MAP  (optional, off by default)
   *
   *    The kit ships a drawn map illustration. Switch this on and it is
   *    replaced by a real OpenStreetMap embed: no API key, no account,
   *    no tracking cookie, nothing to pay.
   *
   *    Find your coordinates: open openstreetmap.org, right-click your
   *    building, "Show address" — the numbers are in the URL.
   *
   *    provider "osm" (default) | "google" (sets cookies — you would
   *    need a consent banner in the EU) | "custom" (+ src)
   * ------------------------------------------------------------------ */
  map: {
    enabled:  false,
    provider: "osm",
    lat:      53.3536,
    lon:      -6.2871,
    zoom:     16
  },

  /* ------------------------------------------------------------------ *
   * 5. BOOKING  (optional, off by default)
   *
   *    If you already run Cal.com or Calendly, paste the link and the
   *    embed appears on the reservations page. The kit's own
   *    reservation form stays exactly where it is as the fallback — set
   *    replaceForm: true to hide it and use the embed alone.
   *
   *    Note: both embeds are third-party iframes that do set cookies.
   *    They stay off unless you fill this in, and if you switch one on
   *    you will need a cookie notice in the EU.
   * ------------------------------------------------------------------ */
  booking: {
    provider:    "",       /* "cal" or "calendly" */
    url:         "",       /* "https://cal.com/your-name/30min" */
    height:      680,
    replaceForm: false
  },

  /* ------------------------------------------------------------------ *
   * 6. DEMO CONTENT  (leave this alone)
   *
   *    The placeholder details this template ships with. They are listed
   *    here so that filling in `business` above can find and replace them
   *    across every page. If you rewrite the copy by hand, you can delete
   *    this whole block.
   * ------------------------------------------------------------------ */
  demo: {
    name:     "Ember & Oak",
    email:    "hello@emberandoak.example.com",
    phone:    "01 555 0184",
    address:  "14 Marlowe Street",
    /* The exact string inside this template's tel: links. */
    tel:      "+35315550184",
    /* Extra strings to swap. Fill in the right-hand side to use them. */
    replace: {
      "events@emberandoak.example.com": "",
      "bookings@emberandoak.example.com": ""
    }
  }
};
