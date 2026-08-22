# Law Firm & Professional Services Kit

A seven-page website template for law firms, accountants, consultancies, architects,
surveyors and any other practice that sells judgement rather than product.

Plain HTML, one CSS file, one small JavaScript file. **No build step, no npm, no
framework, no external requests.** Double-click `index.html` and the whole site works,
offline, exactly as it will on your client's server.

The demo firm is **Halloway & Finch LLP**, invented for this template. Every word is
placeholder copy written to show what real content looks like in the layout — it is not
legal advice and no part of it should survive into a live site.

---

## Contents

```
lawfirm-kit/
├── index.html             Home — positioning, practice areas, why us, attorneys, results, testimonials
├── practice-areas.html    Six practice areas in detail, with a FAQ and enquiry sidebar
├── attorneys.html         Team grid — portraits, focus, education, admissions, offices
├── attorney-detail.html   Single profile — bio, experience, matters, credentials, publications
├── about.html             Firm history, values, timeline, community work, awards
├── contact.html           Consultation request form, three offices with hours, map, FAQ
├── insights.html          Article listing with working category filter and newsletter strip
├── css/
│   └── style.css          The entire design system (one file, ~3,100 lines, commented)
├── js/
│   └── main.js            Theme toggle, mobile nav, reveals, filter, form validation (~10 KB)
├── README.md              This file
└── LICENSE.txt            Licence in full
```

Nothing else is required. There are no images, icon fonts, web fonts, analytics scripts
or CDN links: every icon is inline SVG and every photograph is a drawn placeholder, so
the site cannot break because a file went missing or a service went down.

### What each page demonstrates

| Page | Components you can lift |
| --- | --- |
| `index.html` | Hero with proof stats, practice grid, numbered feature list, team preview, statistics band, result cards, pull quote, testimonial cards, article cards |
| `practice-areas.html` | Sticky-aside detail sections, two-column definition lists, inline CTA bars, accordion FAQ, contact sidebar |
| `attorneys.html` | Portrait grid, statistic band (light variant), split section with generated artwork |
| `attorney-detail.html` | Profile header with contact panel, sticky section nav, prose column with sidebar, timeline, result cards, dotted-leader credential lists |
| `about.html` | Long-form prose, values grid, history timeline, award list, centred pull quote |
| `contact.html` | Full consultation form with validation, contact method rows, office cards with hours, map plate, FAQ |
| `insights.html` | Category filter, featured article, article rows, pagination, newsletter strip |

---

## Quick start

1. Unzip the folder anywhere.
2. Open `index.html` in a browser. That is the whole preview — no server needed.
3. Edit the HTML in any text editor. Every page is a single self-contained file with
   indented, commented markup.

To edit comfortably, use an editor with HTML support (VS Code, Sublime, Nova, even
Notepad++). If you want live reload while you work, any static server will do — for
example `python3 -m http.server` in the kit folder, then visit `localhost:8000`.

---

## Rebranding: the six variables

Open `css/style.css`. At the very top, section **01 — BRAND SEEDS**, are six values.
Every colour, rule, button, shadow and piece of generated artwork in both the light and
dark themes is derived from them.

```css
:root {
  --brand-paper: #f7f5f0;   /* 1. Page background in the light theme        */
  --brand-ink:   #15191f;   /* 2. Body and headline text                    */
  --brand-navy:  #1b2a41;   /* 3. Firm colour: dark bands, primary buttons  */
  --brand-accent:#7c2434;   /* 4. Accent: links, emphasis, the warm colour  */
  --brand-metal: #9a7b3f;   /* 5. Brass: rules, small caps, dark-theme links*/
  --brand-font-display: "Iowan Old Style", "Hoefler Text", Georgia,
                        "Times New Roman", Times, serif;  /* 6. Display face */
}
```

Change those six lines and the site is rebranded. Some combinations that stay credible:

| Look | paper | ink | navy | accent | metal |
| --- | --- | --- | --- | --- | --- |
| Default (navy / burgundy) | `#f7f5f0` | `#15191f` | `#1b2a41` | `#7c2434` | `#9a7b3f` |
| Forest & bronze | `#f6f4ef` | `#16191a` | `#1d3128` | `#7a4a1f` | `#8c7340` |
| Charcoal & oxblood | `#f5f4f2` | `#141414` | `#22252a` | `#6f2230` | `#8d7b56` |
| Slate & teal | `#f4f6f7` | `#12181c` | `#1e2c33` | `#12565c` | `#8a7b52` |
| Warm stone & claret | `#faf7f1` | `#191512` | `#2a2622` | `#762233` | `#a08240` |

**Keep the contrast.** The accent is used for links on the paper background, so it must
stay dark enough to read: aim for a contrast ratio of at least 4.5:1 against
`--brand-paper`. Any free contrast checker will tell you in a second.

### Typography

The display face is a system serif stack — Iowan Old Style and Hoefler Text on Apple
devices, Georgia everywhere else, Times as the final fallback. No font files are
downloaded, so headings paint on the first frame with no layout shift and no
third-party request. Body text uses the system UI stack for the same reason.

If you must use a licensed webfont, add it to `--brand-font-display` **after** you have
self-hosted it (`@font-face` at the top of the stylesheet). Do not link to a font CDN if
your client operates anywhere the GDPR applies.

### Type scale, spacing and width

Section 02 of the stylesheet holds the rest of the tokens: a fluid `clamp()` type scale
(`--step--2` through `--step-6`), section rhythm (`--section-y`), page width
(`--shell`, default 1240px) and radii. Change `--shell` alone to make the whole site
narrower or wider.

---

## Light and dark themes

The kit ships with both, and the dark theme is a night-time reading room, not a
tech-startup black: deep navy-black paper, warm brass rules, no neon.

* Light values live on `:root`.
* Dark values are declared **twice** — once under
  `@media (prefers-color-scheme: dark)` guarded as `:root:not([data-theme="light"])`,
  and once under `:root[data-theme="dark"]`. That is what makes the OS preference and
  the manual toggle both work, in either direction.
* The visitor's choice is stored in `localStorage` under `hf-theme`, inside a
  `try/catch` so private browsing cannot break the page.
* A tiny inline script in each page's `<head>` applies the stored theme **before first
  paint**, so there is no flash of the wrong theme. Keep it there; do not move it to
  `main.js`.

To ship light-only, delete both dark blocks (section 03) and remove the toggle button
from the header markup. To ship dark-only, swap the values on `:root`.

---

## Swapping in real photography

Every image in the kit is drawn with inline SVG so the template has nothing to load.
Replacing one with a real photograph is a two-line change.

**A portrait.** Find the block that starts `<div class="artwork portrait ...">` and
replace the whole `<div>` (through its closing `</div>`) with:

```html
<img class="artwork portrait" src="images/eleanor-halloway.jpg" width="800" height="1000"
     alt="Eleanor R. Halloway, Managing Partner" loading="lazy" decoding="async">
```

Keep the `artwork` and `portrait` classes: they carry the 4:5 crop, the rounded corner,
the frame and the shadow. Portraits look best shot at 4:5, at least 800×1000px, on a
plain background. Use `loading="lazy"` on everything below the fold, and never on the
hero image.

**An office or interior.** Same move, but the classes are `artwork scene scene--wide`
(16:10), `scene--tall` (3:4) or `scene--panorama` (21:9).

**An article thumbnail.** Replace `<div class="thumb thumb--a">…</div>` with an `<img>`
carrying the `thumb` class; the 16:9 crop comes with it.

**Alt text.** Decorative artwork can take `alt=""`. A portrait should name the person.
Do not describe an image as "photo of" — screen readers already announce it.

### Swapping in a real map

On `contact.html`, find `<div class="artwork scene scene--map map-plate">`. Replace the
inner `<svg>` with your embed, keeping the wrapper so the aspect ratio, corner and
address label survive:

```html
<iframe src="https://www.google.com/maps/embed?pb=YOUR_EMBED_ID"
        title="Map of our Boston office" style="border:0;width:100%;height:100%"
        loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
```

A static map image is often the better choice: it costs nothing, loads instantly and
sets no third-party cookies. Delete the `map-plate__pin` span if your map has its own
marker.

---

## Making the forms work

There is no back end in a static kit, so `js/main.js` validates the consultation form
and shows a confirmation message without sending anything. Wire it to a real handler in
one of these ways:

**1. A form service** (Formspree, Netlify Forms, Basin, Getform). Usually one attribute:

```html
<form class="form" action="https://formspree.io/f/YOUR_ID" method="POST" data-form>
```

Then delete the `event.preventDefault()` line in section 6 of `main.js` so the browser
submits normally, or keep the script and post with `fetch()`.

**2. Your own script.** Point `action` at your PHP/Node endpoint. The validation and
error styling keep working; only the submit handler changes.

**3. Email fallback.** `action="mailto:you@example.com"` works everywhere and looks
unprofessional everywhere. Use it only as a stopgap.

**Before you launch a legal enquiry form,** check three things with your client: that
the destination inbox is monitored, that the confirmation wording does not imply an
attorney–client relationship (the template's does not — read it before you change it),
and that any data you collect is covered by their privacy notice.

Every control is already labelled, hinted and wired for `aria-invalid`, so validation
messages are announced to screen readers.

---

## Editing the content

* **One `<h1>` per page.** Keep it that way; it is how search engines and screen readers
  understand the page.
* **The template notice.** The beige bar at the top of every page announces that the
  content is placeholder. **Delete it before launch** — search for
  `<div class="template-notice">` and remove that block from all seven pages.
* **The legal disclaimer** in the footer (`<div class="disclaimer">`) must be rewritten,
  not deleted. Attorney advertising rules differ by jurisdiction, and most require some
  version of "prior results do not guarantee a similar outcome" wherever outcomes are
  mentioned. Have your client's compliance counsel approve the final wording.
* **Placeholder names.** Search each file for `Halloway`, `Finch`, `hallowayfinch`,
  `555-0142`, `Ashcroft` and `example` to catch every instance.
* **Nav and footer** are duplicated in each page (that is the price of no build step).
  When you add or rename a page, update it in all seven files — and set
  `aria-current="page"` on the link for the current page.

### SEO checklist before launch

Each page ships with a unique `<title>`, meta description, canonical URL, Open Graph and
Twitter tags, plus JSON-LD structured data — `LegalService` with address, opening hours
and service catalogue on every page, `BreadcrumbList` on interior pages, `Attorney`
/`Person` on the profile, `Blog` and `Article` on insights. Local-business schema matters
enormously in professional services; do not strip it out.

Replace, in every page:

1. `https://www.hallowayfinch.example` with the real domain (canonical, OG and JSON-LD).
2. The address, telephone, email, geo coordinates and opening hours in the JSON-LD.
3. `og-image.jpg` — create a 1200×630 social image and put it at the site root.
4. Titles and descriptions, keeping titles under about 60 characters where you can.

Then run the site through Google's Rich Results Test and a link checker.

---

## Accessibility

Built in, and worth keeping:

* Semantic landmarks (`header`, `nav`, `main`, `footer`, `aside`), one `h1` per page,
  and a "Skip to main content" link.
* Visible focus rings on every interactive element (`:focus-visible`).
* The mobile menu traps focus, closes on `Escape`, returns focus to the button that
  opened it, and is hidden from assistive technology when closed.
* Form controls are labelled; hints and errors are connected with `aria-describedby`;
  errors set `aria-invalid`.
* Colour contrast meets WCAG AA (4.5:1 for body text) in both themes.
* All motion is a single gentle fade-and-rise, and it is disabled entirely under
  `prefers-reduced-motion: reduce`.
* Everything works without JavaScript: reveals fall back to visible, and the only
  feature lost is the theme toggle and the filter.

If you change the palette, re-check contrast. It is the one thing a rebrand breaks.

---

## Deployment

The kit is static files, so anything that serves files will host it:

* **Shared hosting / cPanel** — upload the folder contents to `public_html` by FTP.
  This is why the kit has no build step: the site can be handed over and edited by
  whoever inherits it in two years.
* **Netlify / Vercel / Cloudflare Pages** — drag the folder onto the dashboard. No
  build command, publish directory `.`.
* **GitHub Pages** — push the folder and enable Pages on the branch.
* **A subfolder** — all links are relative, so `example.com/new-site/` works untouched.

Before you hand over: delete the template notice, replace the placeholder copy and
domain, add a favicon of your own if you want one other than the inline SVG monogram,
enable HTTPS, and set up a 404 page.

---

## Browser support

Current Chrome, Edge, Firefox and Safari, plus iOS and Android. Layout uses CSS Grid,
custom properties, `clamp()` and `color-mix()`; older browsers get a slightly plainer
page rather than a broken one. Internet Explorer is not supported.

The kit is print-friendly too: section 23 of the stylesheet turns any page into a clean
letterhead version, dropping navigation, dark bands and decoration.

---

## Licence summary

**You may:**

* Use this kit for unlimited personal and commercial projects.
* Use it for **client work** — including sites you are paid to build — with no per-site
  fee and no attribution required.
* Modify anything: the markup, the stylesheet, the script, the artwork.
* Deploy the result on as many domains as you like.

**You may not:**

* Resell, redistribute or give away the kit itself — as-is or modified — as a template,
  theme or starter, whether free or paid.
* Include it in another product whose value is the template (a theme marketplace listing,
  a bundle, a page-builder library, a training course's downloadable assets).
* Sublicense it. Your client buys the finished website; they do not acquire the right to
  resell the template.

One licence covers one person or one agency. See `LICENSE.txt` for the full terms.

---

## A note on the demo content

Halloway & Finch LLP does not exist. The attorneys, matters, results, awards, rankings
and testimonials were written to demonstrate the layout at realistic length. Nothing in
this kit is legal advice, and the demo copy must not be published as if it described a
real firm — in most jurisdictions, publishing invented results or testimonials for a real
practice is a disciplinary matter as well as a marketing one.

Write your own. The layout is built to hold real, specific, unglamorous detail, which is
what actually persuades a client to call.
