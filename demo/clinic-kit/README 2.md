# Brightwater — Dental & Medical Clinic Kit

A premium, six-page website template for dental practices, medical clinics,
physiotherapy studios, veterinary surgeries and allied health providers.

Plain HTML, CSS and vanilla JavaScript. **No build step, no npm, no
frameworks, no external requests of any kind.** Unzip it, double-click
`index.html`, and the whole site works from `file://` exactly as it will on
a real server.

---

## Make it real

This kit is not a mockup: the appointment request on `appointments.html` and the
contact form both deliver to a real inbox, with every field arriving as a
readable summary.

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
appointments page (the form stays as the fallback), real OpenStreetMap embeds
for both practice locations, and privacy-first analytics.

One caution worth passing to the client: a web form is not the place for
symptoms or diagnoses. Health data is a special category under GDPR Article 9
and needs a much higher bar than a contact form clears. SETUP.md says so too.

**[SETUP.md](SETUP.md) is the full walkthrough**: choosing a form provider
(with real free-tier limits and prices for Web3Forms, Forminit, Formspree,
FormSubmit, Basin and Netlify Forms), getting a key, deploying to Netlify /
Vercel / Cloudflare Pages / ordinary shared hosting, connecting a domain, and a
plain-English note on what each provider stores and what that means for GDPR.

---

## Contents

| Page | File | What it covers |
|---|---|---|
| Home | `index.html` | Hero with appointment CTA, services grid, why-choose-us, team highlight, insurance & payment, testimonials, closing CTA |
| Treatments & fees | `services.html` | Five treatment categories in keyboard-operable tabs, 21 priced treatments, finance FAQ accordion |
| Our team | `team.html` | Four full practitioner profiles with credentials, education and special interests, plus a support-team grid |
| Appointments | `appointments.html` | Three-step booking form, time-slot picker, what-to-expect, opening hours, booking policies, FAQ |
| About | `about.html` | Practice story, eight-step timeline, technology, facility, accreditations |
| Contact | `contact.html` | Two locations with map placeholders, hours, emergency information, transport & parking, contact form |

Plus:

```
css/style.css              One stylesheet, ~4,400 lines, fully tokenised
config.js                  The only file you must edit
SETUP.md                   ZIP → live client site in 20 minutes
js/forms.js                Form delivery — shared across all kits
js/integrations.js         Analytics / maps / booking — shared across all kits
js/main.js                 One script, 15 self-contained modules
assets/favicon.svg         Scalable favicon
assets/og-*.png (one per page)        1200×630 social sharing card
assets/og-image-source.html  Editable source for the card above
README.md                  This file
LICENCE.txt                Full licence text
```

---

## File structure

```
clinic-kit/
├── index.html
├── services.html
├── team.html
├── appointments.html
├── about.html
├── contact.html
├── config.js            ← the only file you must edit
├── css/
│   └── style.css
├── js/
│   ├── forms.js         Form delivery — shared across all kits
│   ├── integrations.js  Analytics / maps / booking — shared across all kits
│   └── main.js
├── assets/
│   ├── favicon.svg
│   ├── og-home.png … og-contact.png   (one 1200×630 card per page)
│   └── og-image-source.html           (edit + re-screenshot to rebrand them)
├── robots.txt
├── sitemap.xml
├── README.md
└── LICENCE.txt
```

Every path in the kit is relative, so you can host the site at a domain root,
in a subfolder, or open it straight off a USB stick.

---

## Rebranding in about sixty seconds

Open `css/style.css`. The first block after the table of contents is
`01. DESIGN TOKENS`. **You only need to change six values:**

```css
:root {
  --brand:        #0c717f;  /* primary accent: links, icons, buttons      */
  --brand-strong: #0a5f6b;  /* hover / pressed state of the accent        */
  --brand-soft:   #e3f3f5;  /* pale tint, used for chips and callouts     */
  --accent:       #d98346;  /* secondary warm accent, used sparingly      */
  --ink:          #0f2530;  /* near-black for headings and solid buttons  */
  --radius:       16px;     /* global corner rounding                     */
}
```

Then do the same in **section 02**, which holds the dark palette. It is
declared twice on purpose — once inside `@media (prefers-color-scheme: dark)`
guarded with `:root:not([data-theme="light"])`, and once on
`:root[data-theme="dark"]` — so that the OS preference and the on-page toggle
both work, in both directions. Keep the two blocks in step.

If your brand is warm rather than cool, also nudge the neutral ramp
(`--bg`, `--bg-subtle`, `--surface`, `--border`), which is very lightly tinted
toward the brand hue.

**Check your contrast after rebranding.** Body text should stay at or above
4.5:1 against its background in *both* themes. The shipped palette does.

### Other things worth knowing

- **Typography** — `--font-serif` drives every heading, `--font-sans` the rest.
  Both are system-font stacks, so nothing is downloaded. Swap them for a
  webfont if you like, but you will then be making an external request.
- **Type scale** — `--step--2` through `--step-6`, all `clamp()`-based, so the
  site scales smoothly from 320px to ultrawide without breakpoint jumps.
- **Spacing** — `--sp-1` … `--sp-12`.
- **Section rhythm** — `--section-y` controls the vertical padding of every
  band at once.

---

## Swapping in real photographs

Every image in this kit is drawn with CSS gradients and inline SVG, so the
template ships with no image weight and cannot show a broken-image icon.
Replacing them is deliberate and easy.

**A scene placeholder looks like this:**

```html
<div class="ph ph--reception ph--wide" role="img" aria-label="Our reception">
  <svg viewBox="0 0 400 300" …>…</svg>
</div>
```

**Replace it with:**

```html
<img class="ph ph--wide" src="assets/reception.jpg"
     alt="Our reception at Marlowe Quay" width="1200" height="675" loading="lazy">
```

Keep the `ph` class — it supplies the aspect ratio, rounded corners, object-fit
and shadow. Delete the `ph--reception` modifier (that is just the artwork) and
delete the inner `<svg>`. Add `loading="lazy"` to anything below the fold.

Aspect-ratio modifiers: `ph--wide` (16:9), `ph--square`, `ph--portrait` (3:4),
`ph--tall`, `ph--full`. Shape modifiers: `ph--pill`, `ph--flat`.

**Portraits** work the same way:

```html
<div class="portrait portrait--a portrait--tall" role="img" aria-label="Dr Aoife Brennan"></div>
<!-- becomes -->
<img class="portrait portrait--tall" src="assets/aoife.jpg" alt="Dr Aoife Brennan" width="600" height="750">
```

The `portrait--a` … `portrait--f` modifiers set three colour variables
(`--p-1`, `--p-2`, `--p-3`). You can also set them inline for a one-off.

**Recommended sizes** — scene images 1600×900, portraits 800×1000, OG card
1200×630. Export JPEG at about 75% quality, or WebP if you are comfortable
providing a fallback.

**Maps.** The drawn street grid is a placeholder, and swapping it for a real
map is a config change, not an HTML one:

```js
map: { enabled: true, provider: "osm", lat: 53.3462, lon: -6.2436, zoom: 16 }
```

OpenStreetMap is the default — no API key, no account, no tracking cookie,
nothing to pay. Find your coordinates by right-clicking your building on
openstreetmap.org and reading them out of the URL. This kit has two practices, so each
`.map` carries its own `data-map-lat` / `data-map-lon` in `contact.html`,
which override the config — edit those directly.

The illustration is only hidden, never removed, so setting `enabled: false`
brings it straight back. `provider: "google"` gives you a keyless Google embed
instead; it sets cookies, so you would need a consent banner for it in the EU,
which is exactly why OSM is the default.


---

## The JavaScript

`js/main.js` is one file, loaded with `defer`, containing fifteen independent
modules: theme toggle, mobile drawer, sticky header, tabs, filters, accordion,
scroll reveal, counters, parallax, form validation, slot picker, today's
opening hours, copy-to-clipboard, a `:has()` fallback, and the footer year.

Every module returns quietly if its markup is absent, so you can delete any
section from any page without breaking the others.

### Making the forms actually send

They already do. The appointment request and the contact form both deliver.

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

### Motion

Scroll reveals, staggered entrances, hover feedback, hero orb drift and the
parallax are all switched off by a single `@media (prefers-reduced-motion:
reduce)` block at the end of the stylesheet, and `main.js` checks the same
preference before it animates anything.

---

## Accessibility

Built in, and worth keeping when you edit:

- Semantic landmarks (`header`, `nav`, `main`, `footer`, `section`, `article`)
  and exactly one `<h1>` per page.
- A skip link, and visible `:focus-visible` rings on every interactive element.
- Tabs implement the ARIA tabs pattern with arrow-key, Home and End support.
- The accordion, filter chips and slot picker are real `<button>`s with
  `aria-expanded` / `aria-pressed`.
- The mobile drawer traps nothing but closes on `Escape` and returns focus.
- Every form control has a `<label>`; errors are announced through a live
  region rather than colour alone.
- Text contrast is at or above 4.5:1 in both themes.

---

## Browser support

Current Chrome, Edge, Firefox and Safari, plus iOS and Android. Uses
`aspect-ratio`, `clamp()`, CSS custom properties, `grid-template-rows: 0fr`
animation, `:has()` and `color-mix()` — each with a graceful fallback where the
feature is load-bearing. No polyfills, no transpiling.

---

## Deployment

There is nothing to build. Upload the folder.

- **Netlify / Vercel / Cloudflare Pages** — drag the folder onto the dashboard,
  or connect a repository with no build command and the folder as the publish
  directory.
- **GitHub Pages** — push the contents to a repository and enable Pages on the
  branch root.
- **Traditional hosting** — upload by FTP to `public_html` or equivalent.
- **Anywhere else** — it is six HTML files and a handful of assets. It will work.

`robots.txt` and `sitemap.xml` ship ready to go; both need your domain swapped in
(search for `brightwaterdental.example.com`).

Before you go live:

1. Replace every `https://brightwaterdental.example.com/` URL in the
   `<link rel="canonical">`, Open Graph and JSON-LD blocks with your domain.
2. Replace the JSON-LD business data — address, geo coordinates, phone,
   opening hours, practitioners and offers — with your own. **Local structured
   data is the single highest-value SEO item for a clinic; do not skip it.**
3. Regenerate `assets/og-*.png` from `assets/og-image-source.html`.
4. Replace the favicon.
5. Add a real privacy policy, cookie notice and complaints procedure — the
   footer links are placeholders (`#`).
6. **Remove or rewrite the template disclaimers** (see below).

---

## The template disclaimers — read this

Every page carries a notice in the footer, and `services.html`,
`appointments.html`, `about.html` and `contact.html` carry a more prominent
one, stating that the content is placeholder material and not medical advice.

They are there because this kit ships with invented clinical claims, invented
prices, invented credentials and invented reviews for a practice that does not
exist. **Publishing that content as though it were real would be misleading,
and in most jurisdictions a regulatory problem.**

Delete the disclaimers only once you have replaced *all* of the placeholder
content with material you can stand behind — fees you actually charge,
registrations you actually hold, reviews you actually received. Health
advertising is regulated nearly everywhere; check your own regulator's rules
on claims, before-and-after imagery and testimonials before you publish.

Nothing in this template is medical or dental advice.

---

## Licence summary

**You may:**

- Use this kit on unlimited personal and commercial projects.
- Use it for client work, and charge your client whatever you like for it.
- Modify it however you wish, including removing attribution.
- Host the resulting sites anywhere, forever.

**You may not:**

- Resell, redistribute, sublicense or give away the kit itself, modified or
  unmodified.
- Include it in another template, theme, kit or component library offered for
  sale or for free.
- Offer it as a download, or on a template marketplace, site builder or
  "free templates" site.

In short: sell the *websites you build* with it, not the kit. One licence per
person or per team. See `LICENCE.txt` for the full text.
