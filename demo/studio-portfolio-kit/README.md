# Studio & Portfolio Kit — "Meridian"

A six-page website template for design studios, agencies and freelancers.
Plain HTML, one CSS file, one small JavaScript file. **No build step, no npm, no
frameworks, no CDN, no external fonts, no image files.** Unzip it and
double-click `index.html` — it works offline, from the file system, immediately.

Light and dark themes ship as standard, with a working toggle that remembers the
visitor's choice.

---

## 1. What's in the box

```
studio-portfolio-kit/
├── index.html          Landing page — hero, selected work, services, testimonial, CTA
├── work.html           Portfolio archive — 12 projects, filterable by discipline
├── case-study.html     One project in depth — challenge / approach / outcome, metrics, gallery
├── services.html       Packages and pricing, process timeline, capabilities, FAQ
├── about.html          Studio story, team, values, awards
├── contact.html        Project-brief form, studio details, availability
├── css/
│   └── style.css       The entire design system (~2,700 lines, heavily commented)
├── js/
│   └── main.js         Theme toggle, mobile nav, filtering, accordion, form, reveals
├── og-cover.png        1200×630 social share image — replace with your own
├── README.md           This file
└── LICENCE.txt         Licence terms
```

Every page is self-contained HTML. There are no partials or includes to compile,
which means you can edit any page in any editor and see the result by refreshing
the browser.

### Page anatomy

Each page follows the same order, so moving a section between pages is a copy-paste:

1. `<head>` — title, meta description, Open Graph, Twitter card, favicon, JSON-LD
2. A tiny inline **no-flash theme script** (must stay in `<head>`, before the CSS)
3. `<header class="site-header">` and the mobile drawer
4. `<main id="main">` — the page content
5. `<footer class="site-footer">`
6. `<script src="js/main.js">`

---

## 2. Rebranding in about two minutes

Open `css/style.css`. The first block is called **BRAND SEEDS** and contains six
values. Change them and the whole kit re-skins itself — both themes, all
components, buttons, focus rings and the generated artwork.

```css
:root {
  --brand-paper:  #f5f2ec;   /* 1 — light-theme background            */
  --brand-ink:    #16130f;   /* 2 — light-theme text                  */
  --brand-accent: #b4482a;   /* 3 — links, buttons, focus, highlights  */
  --brand-support:#1e3a45;   /* 4 — second colour used in the artwork  */
  --brand-font-display:   ...;  /* 5 — headlines and the wordmark      */
  --brand-font-editorial: ...;  /* 6 — pull quotes, leads, numerals    */
}
```

Everything else in the stylesheet is derived from those six. A few notes:

- **Keep the contrast.** `--brand-ink` on `--brand-paper` should stay at 4.5:1 or
  better. The kit ships at roughly 15:1, so you have plenty of room.
- **Dark theme values** live in two places that must stay in sync:
  `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` and
  `:root[data-theme="dark"]`. They are duplicated on purpose so an explicit
  toggle always beats the operating-system setting. If you change one, change
  both — they are adjacent in the file, under section 03.
- **Artwork colours** are the `--art-*` tokens in section 02. They are what the
  CSS-generated placeholder images are painted with.
- **Fonts.** The kit deliberately uses system font stacks so there are zero
  network requests and no licensing to worry about. If you want a real typeface,
  self-host it and swap the two `--brand-font-*` values. Do not add a Google
  Fonts `<link>` unless you are happy to give up the offline guarantee.

Other useful knobs, all in section 02:

| Token | What it controls |
| --- | --- |
| `--shell` | Maximum content width (default `1360px`) |
| `--gutter` | Page side padding, fluid |
| `--section-y` | Vertical rhythm between sections |
| `--radius-md` / `--radius-lg` | Corner rounding on cards and artwork |
| `--dur`, `--ease` | Global motion speed and curve |

### Renaming the studio

"Meridian" appears in the wordmark, the footer, the copy and the JSON-LD. A
project-wide find-and-replace of `Meridian` plus `meridian.studio` covers it.
The wordmark itself is an inline SVG in the header, mobile drawer and footer of
each page — replace the three `<svg class="wordmark__mark">` blocks with your own
mark, or drop in an `<img>` at the same size.

---

## 3. The artwork system (and how to swap in real images)

There are **no image files in this kit**. Every visual is generated from CSS
gradients so that the template weighs almost nothing, loads instantly, works
offline, and adapts to both themes automatically. The markup is always:

```html
<div class="art art--dune art--wide" role="img" aria-label="Describe the image">
  <span class="art__field" aria-hidden="true"></span>
</div>
```

Twelve compositions are available — mix them freely:

`art--meridian` · `art--dune` · `art--grid` · `art--halftone` · `art--strata`
`art--eclipse` · `art--aperture` · `art--terrain` · `art--pillars` · `art--split`
`art--signal` · `art--weave`

Aspect-ratio modifiers: `art--square` (1:1), `art--portrait` (3:4), `art--tall`
(2:3), `art--wide` (16:9), `art--cinema` (21:9), `art--panorama` (5:2). Add
`art--flush` to remove the corner radius, `art--fill` to fill its container.

### Replacing one with a photograph

Delete the whole `<div class="art">` block and put an image in its place:

```html
<img src="img/halden-01.jpg"
     alt="A Halden field scope on a glacier survey"
     class="art art--photo art--wide"
     loading="lazy" width="1600" height="900">
```

`art--photo` applies `object-fit: cover` so the picture fills the same crop the
generated artwork used. Keep the aspect modifier so the layout does not shift.

Create an `img/` folder next to `index.html` for your files. Recommended sizes:
hero banners 2400px wide, work cards 1600px, gallery items 1200px. Export as
WebP or AVIF with a JPEG fallback if you care about weight, and always keep the
`alt` text — the placeholders ship with descriptive labels for a reason.

The hover behaviour (image pushes in, caption veil rises) works identically for
photographs; it is driven by `.work-card`, not by the artwork.

### Team portraits

`about.html` uses art plates in place of photographs. Swap them for real headshots
the same way — `art--portrait` is the right crop. A separate abstract
`.portrait` component is used for the small circular avatars beside testimonials.

---

## 4. JavaScript

`js/main.js` is about 450 lines of plain ES5-compatible JavaScript with no
dependencies. Every module checks for its own markup first, so unused features
cost nothing. It handles:

- **Theme toggle** — writes `meridian-theme` to `localStorage`, wrapped in
  `try/catch` so private browsing and blocked-cookie contexts fail silently.
  The `<head>` script applies the stored theme *before first paint*, so there is
  no flash of the wrong colours. Keep it inline; moving it to an external file
  reintroduces the flash.
- **Mobile navigation** — focus trap, `Escape` to close, scroll lock, focus
  restored to the trigger on close.
- **Work filtering** — real `<button aria-pressed>` elements, arrow-key
  navigation, an `aria-live` result count, and a shareable `?filter=` URL.
- **Accordion** — `aria-expanded` / `aria-controls`, arrow-key navigation,
  animated with `grid-template-rows` so no height is ever hard-coded.
- **Scroll reveals** — `IntersectionObserver`, with a watchdog: if nothing has
  revealed within 1.2 seconds the effect disables itself entirely. Content is
  never left invisible because a script stalled.
- **Form validation** — inline, accessible, non-blocking. See below.

Removing the file entirely leaves a fully readable, fully navigable site: the
theme still follows the operating system, all content is visible, and the form
falls back to native browser validation.

---

## 5. Making the contact form actually send

The form in `contact.html` is client-side only — it validates, shows a success
state and resets. It does not post anywhere, because a static template has
nowhere to post to.

To connect it, point the `action` at your endpoint and let the browser submit:

```html
<form class="form" data-brief-form action="https://formspree.io/f/YOURID" method="post">
```

Then in `js/main.js`, inside the `submit` handler, delete the
`e.preventDefault()` on the success path (the validation branch above it should
stay). Any form backend works — Formspree, Basin, Netlify Forms
(`data-netlify="true"`), Getform, or your own handler. Every field already has a
sensible `name` attribute.

If you use Netlify Forms, also add a hidden `form-name` input. If you handle
submissions yourself, remember the `consent` checkbox is your record of
permission — keep it.

---

## 6. Accessibility

The kit was built to WCAG 2.2 AA and checked in both themes:

- Semantic landmarks (`header`, `nav`, `main`, `article`, `aside`, `footer`),
  one `<h1>` per page and no skipped heading levels.
- A skip link, visible on focus.
- `:focus-visible` rings on every interactive element, in a colour that passes
  contrast against both backgrounds.
- Filters and the accordion are keyboard-operable, including arrow keys.
- All form controls have real `<label>` elements; grouped radios sit inside
  `<fieldset>` with a `<legend>`; errors are wired with `aria-describedby`.
- Decorative artwork is `aria-hidden`; meaningful artwork carries `role="img"`
  and a descriptive `aria-label`.
- `prefers-reduced-motion: reduce` disables every animation and transition.
- The page is fully usable at 320px and at 400% browser zoom.

If you replace the placeholder artwork with photographs, write real `alt` text.
That is the one accessibility guarantee only you can keep.

---

## 7. SEO

Each page ships with a unique `<title>` and meta description, canonical URL,
Open Graph and Twitter Card tags, and JSON-LD structured data:

| Page | Structured data |
| --- | --- |
| `index.html` | `Organization` |
| `work.html` | `CollectionPage` + `ItemList` |
| `case-study.html` | `CreativeWork` + `BreadcrumbList` |
| `services.html` | `WebPage` + `FAQPage` + `Offer` |
| `about.html` | `AboutPage` + `Organization` with `founder` / `employee` |
| `contact.html` | `ContactPage` + `ContactPoint` + opening hours |

**Before launch,** replace every occurrence of `https://meridian.studio/` with
your own domain — it appears in canonical tags, Open Graph URLs and the JSON-LD.
Replace `og-cover.png` with your own 1200×630 image and update the two `og:image`
/ `twitter:image` URLs to the absolute path on your domain (social scrapers do
not follow relative paths).

---

## 8. Deployment

There is nothing to build. Upload the folder.

- **Netlify / Vercel / Cloudflare Pages** — drag the folder onto the dashboard,
  or connect a Git repository with no build command and the project root as the
  publish directory.
- **GitHub Pages** — push to a repository, then Settings → Pages → deploy from
  the branch root.
- **Any shared host / S3 / nginx** — copy the files via FTP or `rsync`. No server
  configuration is required.

Optional polish before going live:

1. Add a `robots.txt` and `sitemap.xml`.
2. Set long cache headers on `css/` and `js/`.
3. Run Lighthouse — the kit scores in the high 90s out of the box; the remaining
   points are usually your own images.

Browser support: every current version of Chrome, Edge, Firefox and Safari, plus
Safari 15.4+ and equivalents. The kit uses `aspect-ratio`, `clamp()`, CSS custom
properties, `:focus-visible` and `color-mix()`. Older browsers degrade to a plain
but entirely readable layout.

---

## 9. Licence summary

**You may:**

- Use this kit for unlimited personal and commercial projects.
- Use it for client work, and charge your client for that work.
- Modify anything — code, copy, colours, structure — without restriction.
- Deploy the result on as many domains as you like.
- Keep using it forever; there is no subscription and no attribution required.

**You may not:**

- Resell, redistribute, sublicense or give away the kit itself, modified or not.
- Include it in a template marketplace, a theme bundle, a "starter pack", a
  course download, or any product whose value is the template files.
- Present it as your own template product.

In short: **sell what you build with it, not the thing itself.** Full terms in
`LICENCE.txt`.

---

## 10. Notes on the demo content

Meridian is a fictional studio. The projects, clients, team members, awards,
quotes and metrics are written examples — they exist to show how the layouts
behave with real sentences rather than lorem ipsum. Replace all of it before you
publish. In particular the case study's numbers, the award list and the pricing
are illustrative and should not be shipped as your own claims.
