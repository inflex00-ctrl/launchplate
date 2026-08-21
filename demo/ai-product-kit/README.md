# AI Product Kit — "Lumen"

A six-page HTML template kit for AI tools, agents and LLM products.

Plain HTML, one stylesheet, a little vanilla JavaScript. No build step, no npm, no
framework, no CDN. Unzip it and double-click `index.html` — it works offline, from the
file system, exactly as it will on your server.

---

## 1. What is in the box

| File | What it is |
| --- | --- |
| `index.html` | Demo-first landing page: animated agent console, value props, use cases, social proof, CTA |
| `playground.html` | Prompt library: 12 input/output cards, category filtering, search, copy-to-clipboard |
| `models.html` | Model comparison: spec table, capability matrix, rate limits — tables become cards on mobile |
| `api.html` | API reference: sidebar with scroll-spy, tabbed multi-language code samples, parameter and error tables |
| `pricing.html` | Usage-based tiers, an interactive cost calculator, and an eight-question FAQ |
| `waitlist.html` | Waitlist flow: validated form, live progress bar, and a success state with referral link |
| `css/style.css` | The entire design system. One file, ~2,000 lines, heavily commented |
| `js/main.js` | Shared behaviour: theme toggle, mobile nav, tabs, clipboard, scroll reveal, scroll-spy |
| `js/demo.js` | The typewriter/streaming agent console on the landing page |
| `js/playground.js` | Category filter + search for the prompt library |
| `js/pricing.js` | The cost calculator |
| `js/waitlist.js` | Form validation and the success state |
| `assets/favicon.svg` | Favicon |
| `LICENCE.txt` | Full licence text |

Everything is self-contained. There are no external requests of any kind: no Google
Fonts, no analytics, no icon library. All icons are inline SVG. Type is a system font
stack, so pages render instantly and identically offline.

---

## 2. Structure

```
ai-product-kit/
├── index.html
├── playground.html
├── models.html
├── api.html
├── pricing.html
├── waitlist.html
├── css/
│   └── style.css
├── js/
│   ├── main.js
│   ├── demo.js
│   ├── playground.js
│   ├── pricing.js
│   └── waitlist.js
├── assets/
│   └── favicon.svg
├── README.md
└── LICENCE.txt
```

Each page is a complete, standalone document. Header and footer markup is duplicated
across pages on purpose — that is what makes the kit work with any stack you later
drop it into (Astro, Eleventy, Jekyll, Rails, Django, a PHP include, or nothing at
all). Copy the `<header>` and `<footer>` blocks into your own partial when you are
ready.

---

## 3. Rebranding in about a minute

Open `css/style.css`. The first block is `:root`. Change these six values and the
entire kit follows:

```css
:root {
  --brand:          #a45a10;   /* accent: links, highlights, active states */
  --brand-strong:   #82450a;   /* hover / pressed accent                   */
  --brand-contrast: #ffffff;   /* text colour that sits on top of --brand  */
  --brand-soft:     #fbf1e2;   /* ~10% tint, used for chips and callouts   */
  --ink:            #16161c;   /* near-black: primary buttons, headings    */
  --radius:         14px;      /* global corner rounding                   */
}
```

Then set the dark equivalents in the two dark-theme blocks further down (search for
`prefers-color-scheme: dark` and `[data-theme="dark"]` — both carry the same values, so
paste into both).

A good dark accent is a lighter, slightly desaturated version of your light accent:
it needs to clear 4.5:1 against `#0b0b0f`.

### Other things worth knowing

- **Neutral ramp.** `--bg`, `--bg-subtle`, `--bg-inset`, `--surface`, `--border`,
  `--text`, `--text-muted`, `--text-subtle`. Everything else derives from these. The
  supplied ramp is very slightly warm; swap in a cool grey ramp for a colder feel.
- **Type scale.** `--step--2` through `--step-6`, all `clamp()`-based, so the scale
  fluidly adapts between 320px and ultrawide. Change `--font-sans` in one place to
  adopt a different family.
- **Spacing.** `--sp-1` … `--sp-12`. Section rhythm is set by `.section`'s
  `padding-block`.
- **Syntax colours.** `--tok-keyword`, `--tok-string`, `--tok-number`, and friends,
  tuned for the dark code surface used in both themes.

---

## 4. Themes

Light is the default, defined on `:root`. Dark is defined twice, on purpose:

- `@media (prefers-color-scheme: dark)` scoped to `:root:not([data-theme="light"])` —
  so the OS preference wins when the visitor has expressed no preference;
- `:root[data-theme="dark"]` — so an explicit choice wins over the OS in both
  directions.

The toggle in the header writes `lumen-theme` to `localStorage`, wrapped in
`try/catch` so it degrades gracefully in private windows or when storage is blocked. A
tiny inline script in each `<head>` applies the stored theme before first paint, which
is what prevents the flash of the wrong palette. Keep that script inline and keep it
first — moving it to an external file reintroduces the flash.

---

## 5. Customising the pieces

**The landing-page demo** (`js/demo.js`) — edit `PROMPT` and the sequence inside
`run()`. `type()`, `addTool()`, `addList()` and `addMessage()` compose in any order, so
you can script a completely different conversation without touching the CSS.

**The prompt library** (`playground.html`) — cards live in the HTML, not in a JS array,
so the page is fully readable and indexable with JavaScript off. To add one, copy an
`<article class="prompt-card">` block and set `data-category` and `data-keywords`. Then
update the counts in the filter chips.

**The calculator** (`js/pricing.js`) — rates live in the `MODELS` object and plans in
`PLANS` at the top of the file. The slider scales are the `REQUESTS`, `INPUT_TOKENS`
and `OUTPUT_TOKENS` arrays: a slider's `max` attribute must equal `array.length - 1`.

**The waitlist form** (`js/waitlist.js`) — replace `fakeSubmit()` with a real `fetch()`
to your endpoint. Everything else (validation, progress bar, success state) stays as
it is.

**Code blocks** — syntax highlighting is hand-authored spans, no highlighter library
and no runtime cost. Wrap tokens in `<span class="tok-kw">`, `tok-str`, `tok-num`,
`tok-fn`, `tok-com`, `tok-prop`, `tok-punc`, `tok-op`, `tok-var`, `tok-meth`,
`tok-const`, `tok-tag`. Add `code-block--numbered` and wrap each line in
`<span class="ln">` for line numbers.

**Tabs** — any element with `data-tabs` containing `role="tab"` buttons and matching
`role="tabpanel"` panels is wired up automatically, including arrow-key, Home and End
navigation. Panel ids must match each tab's `aria-controls`.

**Copy buttons** — add `data-copy="#some-id"` to copy an element's text, or
`data-copy-text="literal"` to copy a string. Inside a tabbed code block, omitting both
copies whichever panel is currently visible.

---

## 6. Accessibility

Built in, not bolted on:

- Semantic landmarks (`header`, `nav`, `main`, `footer`), one `<h1>` per page, and a
  heading hierarchy that does not skip levels.
- A skip link, visible on focus.
- Visible `:focus-visible` rings everywhere, on both palettes.
- Every interactive widget is keyboard operable: tabs (arrows/Home/End), filter chips,
  sliders, the accordion (native `<details>`), and the mobile drawer (Escape closes).
- `aria-pressed`, `aria-expanded`, `aria-selected`, `aria-current` and `aria-live`
  used where they carry meaning.
- Icons are `aria-hidden`; icon-only buttons carry `aria-label`.
- Table headers use `scope`; card-mode tables expose labels via `data-label`.
- Text meets WCAG AA in both themes.
- `prefers-reduced-motion: reduce` disables the reveal animations and shortens the
  console demo.

---

## 7. SEO

Each page ships a unique `<title>` and meta description, canonical URL, Open Graph and
Twitter card tags, and JSON-LD: `SoftwareApplication` on the landing, models and
pricing pages, `TechArticle` on the API reference, `CollectionPage` on the playground,
and a `FAQPage` block on pricing.

Before launch, replace `https://lumen.example.com/` throughout, and produce the five
OG images referenced in `assets/` (1200×630 is the usual size).

---

## 8. Deployment

There is nothing to build. Upload the folder.

- **Netlify / Vercel / Cloudflare Pages** — drag the folder onto the dashboard, or
  point the project at the repository with no build command and the root as the
  publish directory.
- **GitHub Pages** — push to a repository, enable Pages on the branch root.
- **S3 / any static host / any shared hosting** — upload by FTP or `aws s3 sync`. Set
  `index.html` as the index document.
- **Inside an existing app** — copy `css/`, `js/` and `assets/` into your public
  directory and paste the page bodies into your templates. Watch the relative paths:
  everything is referenced as `css/style.css`, not `/css/style.css`, so it works from
  a subfolder or from `file://`.

Nothing here needs HTTPS, a server runtime, or a database. One caveat: the
clipboard API requires a secure context in some browsers, so copy buttons fall back to
a hidden-textarea method automatically when opened from `file://`.

### Browser support

Current Chrome, Edge, Firefox and Safari (last two versions). The kit uses
`color-mix()`, `clamp()` and CSS nesting-free modern syntax — all supported since
2023. There is no Internet Explorer support and there will not be.

---

## 9. Licence summary

The full text is in `LICENCE.txt`. In short:

**You may**

- use the kit in unlimited personal and commercial projects, for yourself or for
  clients, with no attribution required;
- modify it however you like, including replacing every colour, word and layout;
- charge clients for work built on it, and hand over the modified source to them.

**You may not**

- resell, sublicense or redistribute the kit itself — as-is or restyled — as a
  template, theme, kit or starter, whether free or paid;
- include it in a product whose main value is the template itself (template
  marketplaces, theme bundles, "500 templates" packs);
- claim authorship of the original kit.

The rule of thumb: sell what you *build* with it, not the kit.

---

## 10. Credits

Type is the system font stack, so it matches whatever the visitor's OS uses. All
icons were drawn for this kit as inline SVG. "Lumen", its customers, prices, metrics
and testimonials are fictional; replace them with your own before launch, and do not
publish the invented statistics as if they were yours.
