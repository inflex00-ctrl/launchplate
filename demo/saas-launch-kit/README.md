# SaaS Launch Kit

A complete, production-ready website template for SaaS and software products.
Eight hand-built HTML pages, one shared stylesheet, one small JavaScript file.

**No build step. No npm. No frameworks. No CDN requests.**
Unzip it, double-click `index.html`, and the whole site works — offline, from
the filesystem, in any modern browser.

---

## Make it real

This kit is not a mockup: the release-notes signup on `changelog.html` posts for real.

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

Optional and off by default: privacy-first analytics (Plausible, Umami or
Cloudflare — no Google Analytics, no consent banner needed), and a `links`
block that repoints all 25 "Start free trial", 16 "Sign in" and 6 "Book a
demo" buttons at your real application in one edit.

**[SETUP.md](SETUP.md) is the full walkthrough**: choosing a form provider
(with real free-tier limits and prices for Web3Forms, Forminit, Formspree,
FormSubmit, Basin and Netlify Forms), getting a key, deploying to Netlify /
Vercel / Cloudflare Pages / ordinary shared hosting, connecting a domain, and a
plain-English note on what each provider stores and what that means for GDPR.

---

## Table of contents

1. [What's included](#whats-included)
2. [Quick start](#quick-start)
3. [File structure](#file-structure)
4. [Rebranding in 60 seconds](#rebranding-in-60-seconds)
5. [Dark mode](#dark-mode)
6. [Changing the content](#changing-the-content)
7. [Components reference](#components-reference)
8. [JavaScript behaviours](#javascript-behaviours)
9. [SEO checklist before launch](#seo-checklist-before-launch)
10. [Accessibility](#accessibility)
11. [Browser support](#browser-support)
12. [Deploying](#deploying)
13. [FAQ](#faq)
14. [Licence](#licence)

---

## What's included

| Page | File | What it covers |
| --- | --- | --- |
| **Landing page** | `index.html` | Hero with product mockup, logo strip, feature grid, three-step "how it works", two alternating product highlights, stat band, testimonials, FAQ accordion, closing CTA |
| **Pricing** | `pricing.html` | Three tiers, a working monthly/annual toggle with 20% annual discount, enterprise band, 26-row feature comparison table, billing FAQ |
| **Features** | `features.html` | Six deep-dive sections in alternating layout, integration grid, "what Northwind replaces" band, customer quote |
| **Changelog** | `changelog.html` | Eight dated releases with version tags and New / Improved / Fixed / Security / Breaking badges, sticky release metadata, subscribe card |
| **Documentation** | `docs.html` | Three-column docs shell: sticky sidebar nav, prose content with anchored headings, syntax-highlighted code blocks with copy buttons, callouts, reference tables, and a right-hand table of contents with scroll-spy |
| **About** | `about.html` | Founding story, values list, six-milestone timeline, eight-person team grid, open roles, hiring process |
| **Legal** | `legal.html` | Full privacy policy and terms of service with sticky anchor navigation, sub-processor and cookie tables, retention schedule |
| **404** *(bonus)* | `404.html` | Not-found page with navigation cards |

Plus: `robots.txt`, `sitemap.xml`, an SVG favicon, and a pre-rendered
1200×630 Open Graph image (with the HTML source used to generate it, so you can
re-render your own).

**Everything is hand-written.** No placeholder lorem ipsum — every page is
filled with realistic, persuasive marketing copy for a fictional B2B product
called *Northwind*, so you can see exactly how the layouts behave with real
sentence lengths.

### Highlights

- **One stylesheet, 2,243 lines**, organised into 27 numbered sections with a
  table of contents at the top.
- **Light and dark themes**, following the operating system by default, with a
  working toggle that persists to `localStorage`.
- **Fluid typography** using `clamp()` — the type scale interpolates smoothly
  between 320px and 1440px, so there are no awkward jumps at breakpoints.
- **Product mockups built in pure HTML and CSS** — dashboards, charts, tables
  and rows. No screenshots to replace, and they inherit your brand colour
  automatically.
- **All icons are inline SVG.** No icon font, no sprite sheet, no extra request.
- **Structured data on every page** — Organization, WebSite, SoftwareApplication,
  Product with Offers, FAQPage, BreadcrumbList, TechArticle, CollectionPage and
  AboutPage, as appropriate to each page type.

---

## Quick start

```
1. Unzip the folder anywhere.
2. Double-click index.html.
```

That's it. There is nothing to install and nothing to compile.

If you would rather work with a local server (recommended once you start
editing, so that anchors and relative links behave exactly as they will in
production), any static server works:

```bash
# Python 3 — no install required on macOS or Linux
python3 -m http.server 8000

# or Node
npx serve .
```

Then open <http://localhost:8000>.

---

## File structure

```
saas-launch-kit/
├── index.html              Landing page
├── features.html           Feature deep-dive
├── pricing.html            Plans, toggle, comparison table
├── docs.html               Documentation shell
├── changelog.html          Release history
├── about.html              Company page
├── legal.html              Privacy policy + terms
├── 404.html                Not-found page
│
├── config.js               ← the only file you must edit
│
├── css/
│   └── style.css           The entire design system (one file)
│
├── js/
│   ├── forms.js            Form delivery — shared across all kits
│   ├── integrations.js     Analytics — shared across all kits
│   └── main.js             Theme, nav, pricing toggle, copy, scroll-spy
│
├── assets/
│   ├── favicon.svg         SVG favicon (edit the two colours inside)
│   ├── og-image.png        1200×630 social sharing image
│   └── og-image-source.html   Source used to render og-image.png
│
├── robots.txt
├── sitemap.xml
├── LICENSE.txt
├── SETUP.md                ZIP → live client site in 20 minutes
└── README.md               This file
```

Header and footer markup is duplicated across pages on purpose — that is what
makes the kit work with zero tooling. When you change navigation, change it in
each HTML file (a find-and-replace across the folder takes seconds), or drop the
markup into whatever templating system your stack already uses.

---

## Rebranding in 60 seconds

Open `css/style.css`. At the very top of `:root` there is a block marked
**BRAND**. These six variables control the entire kit:

```css
:root {
  /* ---------- BRAND: the six variables to change ---------- */
  --brand:          #0f7a68;   /* 1. primary accent (buttons, links, marks) */
  --brand-hover:    #0b6152;   /* 2. accent on hover / pressed              */
  --brand-contrast: #ffffff;   /* 3. text colour that sits on the accent    */
  --brand-soft:     #e7f2ef;   /* 4. tinted accent surface (pills, wash)    */
  --brand-accent:   #b0541f;   /* 5. secondary highlight (badges, "new")    */
  --radius:         12px;      /* 6. global corner rounding                 */
}
```

Change those six values and every button, link, badge, focus ring, icon tile,
chart bar, pill, callout and mockup updates at once.

**Then repeat for dark mode.** The same six variables appear twice more, in the
two dark-theme blocks in section 02 of the stylesheet (once under
`@media (prefers-color-scheme: dark)`, once under `:root[data-theme="dark"]`).
Both blocks are marked `/* ---------- BRAND (dark) ---------- */`. Dark themes
need a lighter, less saturated accent than light themes — pick something around
55–70% lightness, and set `--brand-contrast` to a very dark tint of the same hue.

### A worked example — rebranding to indigo

```css
/* light */
--brand:          #4f46e5;
--brand-hover:    #4338ca;
--brand-contrast: #ffffff;
--brand-soft:     #eef0fd;
--brand-accent:   #b0541f;
--radius:         12px;

/* dark (both blocks) */
--brand:          #8b86f5;
--brand-hover:    #a4a0f8;
--brand-contrast: #16143a;
--brand-soft:     rgba(139, 134, 245, 0.14);
--brand-accent:   #e0864c;
```

Also update, in this order:

1. `--radius` — `0px` for a sharp, technical look; `18px` for something softer.
2. The two `<meta name="theme-color">` tags in each page's `<head>`.
3. `assets/favicon.svg` — one `fill` and one `stroke` colour.
4. `assets/og-image-source.html`, then re-render it (see below).
5. The word "Northwind" and the `<svg class="brand__mark">` logo in the header
   and footer of each page.

### Re-rendering the Open Graph image

`assets/og-image-source.html` is a plain 1200×630 HTML page. Open it in a
browser and screenshot it, or render it headlessly:

```bash
# macOS
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --window-size=1200,630 \
  --screenshot=assets/og-image.png \
  file://"$PWD"/assets/og-image-source.html
```

### Changing the typeface

The kit ships with system font stacks so there are **zero network requests** and
text renders instantly. If you want a custom face, self-host it (do not use a
CDN if you care about privacy and page weight) and change one variable:

```css
--font-sans: "Your Font", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Keep the system fonts at the end of the stack as a fallback.

### Other things worth knowing

- **Spacing** is driven by `--space-1` … `--space-12`. Section rhythm comes from
  `--section-y`; change it once to make the whole site denser or airier.
- **Type scale** is `--step--2` … `--step-6`, each a `clamp()`. Adjust the middle
  number of a clamp to change how fast a size grows with viewport width.
- **Elevation** is `--shadow-xs` … `--shadow-lg` plus `--shadow-brand`, defined
  separately for light and dark.
- **Container width** is `--container` (1180px), with `--container-wide` and
  `--container-narrow` variants.

---

## Dark mode

The kit implements the three-state pattern used by well-behaved sites:

| State | How it is set | What happens |
| --- | --- | --- |
| **System** (default) | No `data-theme` attribute | Follows `prefers-color-scheme` |
| **Light** | `<html data-theme="light">` | Forces light, beating the media query |
| **Dark** | `<html data-theme="dark">` | Forces dark |

Three details make it feel solid:

1. **No flash of the wrong theme.** A tiny inline script in every `<head>` reads
   `localStorage` and sets the attribute *before* first paint. Keep it inline and
   keep it before the stylesheet.
2. **`localStorage` is wrapped in `try/catch`** everywhere it is touched, so
   private browsing and blocked-cookie contexts degrade silently instead of
   throwing.
3. **The OS preference is still followed** after a manual choice is cleared, and
   `color-scheme` is set so form controls and scrollbars match the theme.

To make your site dark-by-default, add `data-theme="dark"` to the `<html>` tag
of each page.

---

## Changing the content

Everything is plain, well-indented HTML with descriptive class names. The
patterns you will use most:

**Section shell**

```html
<section class="section" aria-labelledby="x-heading">
  <div class="container">
    <div class="section-head section-head--center">
      <span class="eyebrow">Category</span>
      <h2 id="x-heading">The headline</h2>
      <p class="lede">A supporting sentence.</p>
    </div>
    <!-- content -->
  </div>
</section>
```

Add `section--alt` for a tinted band, `section--tight` for less vertical space.

**Pricing** — each plan's price lives in data attributes, so the toggle needs no
configuration:

```html
<span class="plan__amount" data-monthly="89" data-annual="71">71</span>
<span class="plan__billing-note"
      data-period-label
      data-label-monthly="Billed monthly"
      data-label-annual="$852 billed yearly">$852 billed yearly</span>
```

Change the numbers and the toggle keeps working. To add a fourth tier, duplicate
a `.plan` article and change `.price-grid`'s column count.

**FAQ** uses native `<details>` — it works with JavaScript disabled and is
keyboard-accessible for free.

**Code blocks** are highlighted by hand with four token classes: `tok-comment`,
`tok-key`, `tok-str`, `tok-num`, `tok-fn`. No highlighter library to load, and
the colours follow your brand.

---

## Components reference

Every class in the stylesheet, grouped by the section it lives in:

| Component | Key classes |
| --- | --- |
| Buttons | `.btn`, `--primary`, `--secondary`, `--ghost`, `--inverse`, `--lg`, `--sm`, `--block`, `.btn-row`, `.link-arrow` |
| Badges | `.badge` + `--brand` `--ok` `--warn` `--info` `--muted`, `.pill`, `.eyebrow`, `.dot` |
| Layout | `.container` (+ `--wide`, `--narrow`), `.section` (+ `--alt`, `--tight`), `.grid-2/3/4`, `.split`, `.with-aside`, `.bordered-grid` |
| Cards | `.card` (+ `--hover`, `--flat`), `.feature-icon`, `.feature-cell`, `.check-list` |
| Mockups | `.mock`, `.mock__bar`, `.mock__side`, `.mock__stats`, `.mock__chart`, `.mock__rows`, `.mock-code` |
| Social proof | `.logos`, `.logo-mark`, `.quote`, `.quote--feature`, `.avatar`, `.stats`, `.stat` |
| Pricing | `.price-grid`, `.plan`, `.plan--featured`, `.billing-toggle`, `.switch`, `.enterprise-band` |
| Tables | `.table-scroll`, `.table`, `.table__group`, `.table__yes`, `.table__no` |
| Docs | `.docs`, `.docs-sidebar`, `.docs-nav__*`, `.docs-toc`, `.prose`, `.code-block`, `.callout`, `.anchor`, `.docs-pager` |
| Changelog | `.changelog`, `.release`, `.release__version`, `.change-list`, `.change` |
| Legal | `.legal-layout`, `.legal-nav`, `.legal-meta`, `.legal-doc` |
| About | `.team-grid`, `.member`, `.value-list`, `.timeline`, `.milestone` |
| Forms | `.field`, `.input`, `.inline-form` |
| Utilities | `.sr-only`, `.center`, `.measure`, `.mt-*`, `.mb-*`, `.flex`, `.gap-*`, `.hide-sm` |

---

## JavaScript behaviours

`js/main.js` is roughly 290 lines, dependency-free, and heavily commented. It
handles seven things and nothing else:

1. **Theme toggle** — persists to `localStorage`, keeps `aria-pressed` and the
   button's accessible label in sync, and follows the OS when no explicit choice
   has been made.
2. **Sticky header** — adds `data-scrolled="true"` past 8px so the header gains a
   hairline border and a denser background.
3. **Mobile navigation** — full-screen panel, `aria-expanded` maintained,
   closes on link click, on `Escape`, and on resize past the breakpoint.
4. **Pricing toggle** — reads prices from data attributes, updates every plan,
   remembers the choice.
5. **Copy-to-clipboard** — uses the async Clipboard API with a `execCommand`
   fallback, and shows a "Copied" state for 1.8 seconds.
6. **Scroll-spy** — an `IntersectionObserver` highlights the current section in
   the docs sidebar, the docs table of contents and the legal navigation.
7. **Footer year** — fills any `[data-year]` element.

Every page works without JavaScript. Disable it and you lose the theme toggle,
the mobile menu, the pricing toggle and the copy buttons — all content stays
readable and every link still works.

---

## SEO checklist before launch

Every page ships with a unique `<title>`, meta description, canonical URL, Open
Graph and Twitter card tags, and page-appropriate JSON-LD. Before you deploy:

- [ ] Replace `https://northwind.example.com` everywhere. It appears in each
      page's canonical tag, OG tags, JSON-LD, `robots.txt` and `sitemap.xml`.
      One find-and-replace across the folder handles all of it.
- [ ] Rewrite the `<title>` and `<meta name="description">` for each page.
      Aim for 50–60 characters and 150–160 characters respectively.
- [ ] Update the JSON-LD blocks: organisation name, legal name, address,
      founding date, social profiles, prices, currency and FAQ entries. Validate
      with Google's Rich Results Test.
- [ ] Re-render `assets/og-image.png` with your own branding, and update the
      `og:image:alt` text.
- [ ] Change `@northwindhq` in the `twitter:site` tags.
- [ ] Update `<meta name="theme-color">` to your brand colour.
- [ ] Update `sitemap.xml` — remove pages you deleted, add pages you created.
- [ ] Point `robots.txt` at your real sitemap URL.
- [ ] Add analytics if you use it (a single script tag before `</body>`).
- [ ] Replace `#trial`, `#demo`, `#signin` and `#contact` placeholder links with
      real destinations.

---

## Accessibility

The kit was built with accessibility as a constraint rather than an audit:

- Semantic landmarks throughout — `header`, `nav`, `main`, `section`, `article`,
  `aside`, `footer`, each labelled where more than one of a kind exists.
- One `<h1>` per page and a heading hierarchy that never skips a level.
- A skip link as the first focusable element on every page.
- `:focus-visible` styles on every interactive element, with a 2px brand outline
  and 3px offset — visible in both themes.
- `aria-label` on every icon-only button; `aria-pressed` on the theme toggle;
  `aria-expanded` and `aria-controls` on the menu button; `role="switch"` with
  `aria-checked` on the billing toggle.
- `aria-current="page"` on the active navigation link.
- Decorative SVGs marked `aria-hidden="true"`; meaningful ones given
  `role="img"` and a label.
- Body text meets WCAG AA contrast in both themes; `--text-muted` and
  `--text-subtle` are tuned to stay above 4.5:1 on their intended surfaces.
- `prefers-reduced-motion: reduce` disables every transition and animation, and
  turns off smooth scrolling.
- Tables use `<caption>`, `<th scope="col">` and `<th scope="row">`.

If you change `--brand`, re-check contrast: `--brand` is used for text on
`--surface` and as a background behind `--brand-contrast`.

---

## Browser support

Tested on current versions of Chrome, Edge, Safari and Firefox, on macOS,
Windows, iOS and Android.

The stylesheet uses modern CSS: custom properties, `clamp()`, CSS Grid,
`color-mix()`, `:focus-visible`, `aspect-ratio` and `backdrop-filter`. All are
supported in every browser released since mid-2023. In older browsers the layout
degrades gracefully — `color-mix()` falls back to no background tint and
`backdrop-filter` to a solid header, but nothing breaks.

There is no Internet Explorer support and there will not be.

---

## Deploying

The kit is static files. Every host below works, and all of them are free for a
site this size.

### Netlify

Drag the whole folder onto <https://app.netlify.com/drop>. Done — you get a URL
immediately.

For continuous deployment from Git, push the folder to a repository and connect
it. Leave the build command empty and set the publish directory to the folder
containing `index.html`. Netlify serves `404.html` automatically. To keep
extensionless URLs, add a `netlify.toml`:

```toml
[[redirects]]
  from = "/features"
  to = "/features.html"
  status = 200
```

### Vercel

```bash
npm i -g vercel
vercel        # preview deployment
vercel --prod # production
```

Choose "Other" as the framework preset when prompted; there is no build step.
Vercel serves `404.html` for missing routes and strips `.html` from URLs by
default.

### Cloudflare Pages

Create a project, connect your repository, leave the build command empty and set
the output directory to `/`. Or upload the folder directly through the dashboard.
Cloudflare serves `404.html` automatically.

### GitHub Pages

1. Push the folder to a repository.
2. **Settings → Pages → Source: Deploy from a branch**.
3. Pick `main` and the folder containing `index.html` (`/` or `/docs`).

Add an empty `.nojekyll` file at the root so GitHub does not try to process the
site with Jekyll. Note that GitHub Pages serves `404.html` only on custom
domains and project sites — behaviour on user sites varies.

### Any other host

Upload the folder over FTP/SFTP to your web root. There are no server
requirements — no PHP, no Node, no database. It also works from an S3 bucket,
an nginx `root`, or a USB stick.

### A note on caching

Once live, set a long `Cache-Control` on `css/`, `js/` and `assets/`, and a short
one on the HTML. If you edit the CSS after launch, add a version query to the
link tags (`css/style.css?v=2`) so returning visitors get the update.

---

## FAQ

**Can I use this for a client project?**
Yes. Unlimited client projects, unlimited end products, commercial or personal.

**Can I use it more than once?**
Yes. One purchase covers every project you build, forever.

**Do I have to credit you?**
No. Attribution is appreciated but never required.

**Can I add it to a page builder / theme / starter I sell?**
No. You cannot redistribute the kit itself, or a derivative whose primary value
is the template — see the licence below.

**Can I convert it to React / Vue / Astro / Hugo / WordPress?**
Yes, for your own projects and client work. The markup and CSS are yours to port
anywhere. You just cannot sell the port as a template.

**Will it work if I open the files directly, without a server?**
Yes. That is a deliberate design constraint: every path is relative and nothing
is fetched over the network.

**Are there any tracking scripts or external requests?**
None. Zero third-party requests. No fonts, no analytics, no CDN.

**Can I remove the pages I don't need?**
Yes. Delete the file and remove it from the navigation arrays in each header and
footer, plus `sitemap.xml`.

---

## Licence

**SaaS Launch Kit — Standard Licence**

You may:

- Use the kit for **unlimited personal and commercial projects**.
- Use it for **client work**, including work you are paid for.
- **Modify** it however you like — change the code, the design, the copy.
- **Deploy** the result to as many domains as you want, forever.
- Keep using it after any subscription or support period ends.

You may not:

- **Resell, redistribute or sublicense the kit itself**, modified or unmodified,
  as a template, theme, starter kit, UI library or component pack.
- Include it in a product whose primary value is the template — for example a
  theme marketplace listing, a page-builder template pack, or a "1,000 templates"
  bundle.
- Claim authorship of the original template.

In short: **build anything you want with it — just don't sell the kit.**

The kit is provided "as is", without warranty of any kind, express or implied.
The authors are not liable for any claim, damages or other liability arising
from its use.

The full licence text is in `LICENSE.txt`.

---

*Built with plain HTML, CSS and JavaScript. No frameworks were harmed.*
