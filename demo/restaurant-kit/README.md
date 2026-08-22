# Ember &amp; Oak — Restaurant &amp; Café Kit

A six-page website template for restaurants, cafés, bistros, wine bars and bakeries.
Plain HTML, one CSS file, one JS file. No build step, no npm, no framework, no CDN,
no network requests of any kind — **double-click `index.html` and it works**.

That last part matters more than it sounds. Local-business sites usually end up in the
hands of a non-technical owner. This kit is a folder of files they can back up, email,
or hand to the next person. Nothing rots.

---

## Make it real

This kit is not a mockup: the booking request on `reservations.html` and the contact
form both deliver to a real inbox, with the date, time, party size and every
other field arriving as a readable summary.

Everything runs off one file, **`config.js`**, in this folder. Fill in the
business details and a form-provider key and the site is deliverable:

```js
window.SITE_CONFIG = {
  business: { name: "…", email: "…", phone: "…" },
  forms:    { provider: "web3forms", key: "your-access-key" }
};
```

That is the whole integration. With nothing configured the kit still renders
and behaves sensibly — forms validate, then fall back to the visitor's own mail
app rather than pretending to have sent something.

Also optional, also off by default: a Cal.com or Calendly embed on the
reservations page (the form stays as the fallback), a real OpenStreetMap embed
in place of the drawn map, and privacy-first analytics.

**[SETUP.md](SETUP.md) is the full walkthrough**: choosing a form provider
(with real free-tier limits and prices for Web3Forms, Forminit, Formspree,
FormSubmit, Basin and Netlify Forms), getting a key, deploying to Netlify /
Vercel / Cloudflare Pages / ordinary shared hosting, connecting a domain, and a
plain-English note on what each provider stores and what that means for GDPR.

---

## What's in the box

| File | What it is |
| --- | --- |
| `index.html` | Home — hero with reservation CTA, story teaser, signature dishes, hours &amp; location, gallery strip, testimonials, closing CTA |
| `menu.html` | Full menu with working category tabs, dietary markers, set menu, allergen notes, print stylesheet |
| `reservations.html` | Booking form (date, time, party size, seating, occasion, notes), hours, policies, "what happens next" |
| `about.html` | The story, how we cook, chef profile, the team, values, sourcing |
| `gallery.html` | Filterable image grid with a keyboard-operable lightbox, plus private-hire section |
| `contact.html` | Address, map placeholder, hours, getting here, contact form, FAQ |
| `css/style.css` | The entire design system — one file, ~3,600 lines, driven by CSS custom properties |
| `config.js` | **The only file you must edit.** Business details, form provider, analytics, map, booking |
| `js/forms.js` | Form delivery — validation, spam traps, provider transport. Shared across all kits |
| `js/integrations.js` | Analytics, maps and booking embeds. Shared across all kits |
| `js/main.js` | Theme toggle, mobile nav, scroll reveal, tabs, filters, lightbox, accordion, parallax, hours logic, counters, form validation |
| `css/hero.css` | Home-page hero only — the candlelight bloom, the drifting haze and embers, the plated-dish assembly and the split-word headline. Delete the `<link>` in `index.html` and the hero falls back to a still, fully readable version |
| `js/hero.js` | Home-page hero only — splits the headline into words and drives the two-layer parallax. Safe to delete |
| `assets/favicon.svg` | Scalable favicon |
| `assets/og-*.png` | Social sharing cards, one per page (1200 × 630) |
| `assets/og-source.html` | The HTML the sharing cards are rendered from — edit and re-screenshot after rebranding |
| `robots.txt`, `sitemap.xml` | Ready to go — just swap in your domain |
| `SETUP.md` | ZIP → live client site in 20 minutes — providers, deployment, GDPR |
| `LICENCE.txt` | Full licence text |

Six pages, fifteen files, zero dependencies.

---

## Features

- **Light and dark themes.** Light on `:root`, dark under both `@media (prefers-color-scheme: dark)` and `[data-theme="dark"]`, so the page follows the operating system *and* obeys an explicit choice. The toggle persists to `localStorage` (wrapped in `try/catch`, so it survives private mode and `file://`), and a tiny inline script in `<head>` applies the saved theme before first paint — no flash of the wrong palette.
- **Motion that respects the reader.** Staggered scroll reveals, a drifting ember gradient in the hero, hover states with real feedback, animated tab and filter transitions, a slow marquee. Every one of them is switched off under `prefers-reduced-motion: reduce`.
- **Genuinely responsive**, 320px to ultrawide, with a `clamp()` type scale and a working mobile drawer.
- **Accessible**: semantic landmarks, one `<h1>` per page, visible focus rings, ARIA on tabs/filters/accordion/lightbox, keyboard operation throughout (arrow keys move between tabs, `Esc` closes the lightbox and the menu), labelled form controls, and text contrast at or above 4.5:1 in **both** themes.
- **Local SEO built in**: unique title, description, canonical, Open Graph and Twitter tags per page, plus JSON-LD using `Restaurant`, `Menu`, `LocalBusiness`, `ContactPage` and `Person`. Local schema is the single highest-leverage thing on a restaurant site — it is already wired, you only need to change the facts.
- **All imagery is CSS.** Every "photograph" is a layered gradient composition — plated dishes, candlelit rooms, glassware, portraits. The kit ships with almost no image weight, and the placeholders look intentional rather than grey.
- **Forms that behave.** Inline validation, a success panel, a honeypot field, and a `Sending…` state. They are wired as demos out of the box; pointing them at a real endpoint is one attribute change (see below).
- **The menu page prints properly.** `@media print` hides the chrome, unhides every tab panel, and drops the imagery, so the menu comes out of an A4 printer looking like a menu.

---

## Rebranding in about a minute

Open `css/style.css`. The first block is `:root`. These six variables do most of the work:

```css
:root {
  --brand:          #a8481f;  /* the accent: links, prices, active states  */
  --brand-strong:   #8a3814;  /* hover / pressed accent                    */
  --brand-contrast: #fff8f2;  /* text colour that sits on top of --brand   */
  --brand-soft:     #f6e6db;  /* soft tint for chips and callouts          */
  --ink:            #1e1a16;  /* near-black for headings and dark surfaces */
  --radius:         6px;      /* global corner rounding                    */
}
```

Change those and the whole site follows. Then, if you want a different mood:

| Want | Change |
| --- | --- |
| A cooler, more modern palette | The warm neutral ramp below the brand block (`--bg`, `--bg-subtle`, `--surface`, `--border`, `--text`, …). Nudge them toward grey or blue. |
| A second accent (dietary marks, "fresh" signals) | `--accent-2` and `--accent-2-soft` |
| Different typography | `--font-display` (currently a serif stack) and `--font-sans`. Both are system stacks — no web font request. |
| Bigger or smaller headings | The `--step-*` scale. Every size on the site derives from it. |
| Tighter or looser pages | The `--sp-*` scale and `--container` / `--container-narrow`. |

**Do not forget the dark theme.** Section 02 of the stylesheet repeats the same variable
names twice — once inside `@media (prefers-color-scheme: dark)` and once under
`:root[data-theme="dark"]`. Both blocks must carry the same values. If you change the
brand colour, pick a lighter version for dark mode (the default kit goes from a deep
terracotta to a warm amber) and check the contrast.

Finally, search-and-replace the business facts. They appear in the page copy, the
`<footer>`, and the JSON-LD blocks at the top of each file:

```
Ember & Oak                      → your restaurant
14 Marlowe Street, Stoneybatter  → your street
Dublin 7, D07 XK92               → your town and postcode
+35315550184 / 01 555 0184       → your number
hello@emberandoak.example.com    → your email
https://emberandoak.example.com  → your domain (canonical + og:url + JSON-LD)
emberoak-theme                   → your localStorage key, if you like
```

---

## Swapping in real photographs

Every image in the kit is a `<div class="ph …">` — a CSS composition, not a file. Each one
is a drop-in replacement for an `<img>`:

```html
<!-- what ships -->
<div class="ph ph--wide ph-dish ph-dish--octopus" role="img"
     aria-label="Charred octopus with romesco and burnt lemon."></div>

<!-- what you replace it with -->
<img class="ph ph--wide" src="images/octopus.jpg"
     alt="Charred octopus with romesco and burnt lemon." loading="lazy">
```

The `.ph` class already handles the aspect ratio, the rounding and `object-fit: cover`,
so the layout does not move. Keep the aspect modifier (`ph--wide`, `ph--square`,
`ph--portrait`, `ph--tall`, `ph--ultra`, `ph--fill`) and drop the composition class
(`ph-dish…`, `ph-scene…`, `ph-drink…`, `ph-portrait-art…`).

Three things worth doing while you are in there:

1. **Write real `alt` text.** The kit's `aria-label`s are already written as proper
   descriptions — use them as a model. Purely decorative images should get `alt=""`.
2. **Add `loading="lazy"`** to everything below the fold, and `width`/`height` attributes
   so the page does not jump while images load.
3. **Resize before uploading.** 1600px wide is plenty for a full-width shot, 800px for a
   card. A restaurant site that takes six seconds to load costs bookings.

In the gallery, the lightbox reads its picture from `data-lb-art`. If you move to real
photographs, change each `data-lb-art="ph ph-scene ph-scene--bar"` to point at the same
image at full size — or swap the `<div data-lb-art>` inside `js/main.js` (module 7) for an
`<img>` and feed it a `data-lb-src`.

**Maps.** The drawn street grid is a placeholder, and swapping it for a real
map is a config change, not an HTML one:

```js
map: { enabled: true, provider: "osm", lat: 53.3536, lon: -6.2871, zoom: 16 }
```

OpenStreetMap is the default — no API key, no account, no tracking cookie,
nothing to pay. Find your coordinates by right-clicking your building on
openstreetmap.org and reading them out of the URL. Both the home page and the contact page
pick it up; the address card stays on top of the real map.

The illustration is only hidden, never removed, so setting `enabled: false`
brings it straight back. `provider: "google"` gives you a keyless Google embed
instead; it sets cookies, so you would need a consent banner for it in the EU,
which is exactly why OSM is the default.


---

## Making the forms send

They already do. The reservation and contact forms validate, show the success panel, and
deliver.

Set two things in `config.js` and enquiries arrive in a real inbox:

```js
forms: {
  provider: "web3forms",   // or forminit, formspree, formsubmit, basin, netlify, custom
  key:      "your-access-key",
  fallback: "mailto"       // what happens if you leave provider blank
}
```

`js/forms.js` handles the rest: it validates, blocks bots with a honeypot and a
time-trap, disables the button while sending, posts with `fetch()` so the
visitor never leaves the page, and writes the real result into the same status
banner the kit already uses. Every field is normalised into a readable email
with a proper subject line and reply-to address, whatever shape the form is.

Leave `provider` blank and the form falls back to the visitor's own mail app
(or says plainly that it is not connected yet, with `fallback: "notice"`). It
never shows a success message for something it did not send.

Adding your own form takes one attribute:

```html
<form data-form data-form-type="Quote request" novalidate>
  …your fields…
  <div class="form-status" data-form-status role="status" aria-live="polite"><span></span></div>
</form>
```

Full walkthrough, provider comparison with real limits and prices, deployment
and a GDPR note: **[SETUP.md](SETUP.md)**.

---

## Deployment

It is a folder of static files. Anything that serves files will serve this.

**Drag and drop** — Netlify Drop, Cloudflare Pages, or Vercel: drag the folder onto the
upload area. Done, with HTTPS, in under a minute.

**Git-based** — push the folder to GitHub and connect it to Netlify, Cloudflare Pages or
Vercel. No build command, publish directory `/`.

**GitHub Pages** — push to a repository, then Settings → Pages → deploy from branch.

**Classic hosting** — upload the whole folder by FTP/SFTP to `public_html` or `www`.
Keep the directory structure (`css/`, `js/`, `assets/`) intact; every link is relative.

Before you go live:

- [ ] Replace every `https://emberandoak.example.com` with your real domain (canonical, `og:url`, JSON-LD).
- [ ] Regenerate the social cards (below) so shared links show your name.
- [ ] Check the JSON-LD in Google's Rich Results Test.
- [ ] Update `robots.txt` and `sitemap.xml` — both ship with the kit, they just need your domain.
- [ ] Confirm the opening hours in the JSON-LD match the ones in the page copy. Search engines read both.

### Regenerating the social cards

`assets/og-source.html` contains all six cards at exactly 1200 × 630. Edit the text and
colours, then:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
  --hide-scrollbars --window-size=1200,3780 --screenshot=/tmp/og-strip.png \
  --virtual-time-budget=2500 file:///ABSOLUTE/PATH/TO/assets/og-source.html
```

Then slice the tall PNG into six 630px bands and save them as `og-home.png`,
`og-menu.png`, `og-reservations.png`, `og-about.png`, `og-gallery.png`, `og-contact.png`.
(Any image editor will do it; on a Mac, Preview's crop tool is enough.)

---

## Browser support

Current Chrome, Edge, Firefox and Safari, desktop and mobile. The kit uses
`color-mix()`, `aspect-ratio`, `clamp()`, CSS grid and `:focus-visible` — all supported
since 2023. Older browsers get a slightly plainer page rather than a broken one:
`backdrop-filter` and `text-wrap: balance` are behind `@supports` or degrade silently.

---

## A note on the demo content

**Ember &amp; Oak is a fictional restaurant.** The address, phone number, people, menu,
prices and reviews are all invented to demonstrate the template. Replace every one of them
before you publish. Publishing invented reviews or ratings as if they were real is, in
most jurisdictions, illegal — the `aggregateRating` in the JSON-LD in particular should be
removed until you have genuine reviews to point at.

---

## Licence summary

**You may:**

- Use this kit on unlimited personal and commercial projects.
- Use it for **client work** — build a site, charge for it, hand it over. No per-site fee, no attribution required.
- Modify anything: rewrite the CSS, restructure the pages, merge it into a larger site.
- Keep using it after any subscription or support period ends.

**You may not:**

- Resell, redistribute or give away the kit itself — as-is or lightly modified — as a
  template, theme, starter or on a template marketplace.
- Include it in a product whose main value is the template files (a theme bundle, a
  site-builder library, a "1,000 templates" pack).

In short: **sell the sites you build with it, not the kit.**

The full text is in `LICENCE.txt`.
