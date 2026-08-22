# Directory & Marketplace Kit

A complete, production-ready template for launching a niche directory — AI tools, local
services, job boards, SaaS alternatives, plugins, anything with listings that people need
to filter through.

The demo content is **Stacklist**, a fictional directory of developer tools. Every tool,
review and statistic in it is invented. Replace the data with yours and you have a real
directory.

**No build step. No dependencies. No network requests.** Plain HTML, one CSS file and
vanilla JavaScript. Double-click `index.html` and it works — including the search, the
filters and the sorting — because the listing data is a JavaScript array, not a JSON file
fetched over HTTP.

---

## Make it real

This kit is not a mockup: the four-step listing submission on `submit.html` delivers
to your inbox, screenshots included where your provider supports attachments.

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

Optional and off by default: privacy-first analytics. SETUP.md also covers how
to put the listing data behind a git-based CMS so a client can add entries
without touching `js/data.js`.

**[SETUP.md](SETUP.md) is the full walkthrough**: choosing a form provider
(with real free-tier limits and prices for Web3Forms, Forminit, Formspree,
FormSubmit, Basin and Netlify Forms), getting a key, deploying to Netlify /
Vercel / Cloudflare Pages / ordinary shared hosting, connecting a domain, and a
plain-English note on what each provider stores and what that means for GDPR.

---

## Contents

| File | What it is |
| --- | --- |
| `index.html` | Home page — hero with search, featured and sponsored listings, category grid, animated stats, how-it-works, recently added, submit CTA |
| `browse.html` | The core page — the full listing grid with working search, category / price / rating / tag filters, sorting, grid-or-list view and a live results count |
| `listing.html` | Single listing detail — gallery, description, highlights, specification table, pricing plans, ratings and reviews, alternatives, sticky "visit site" panel. One file serves every listing via `?id=` |
| `category.html` | Category landing — intro copy, the same filter engine locked to one category, related categories, SEO prose block. One file serves every category via `?id=` |
| `submit.html` | Submit-a-listing flow — four steps with real validation, a live preview card, and paid placement tiers |
| `pricing.html` | Listing plans — free / featured / sponsored, a full comparison table and an FAQ |
| `css/style.css` | The entire stylesheet, driven by CSS custom properties |
| `js/data.js` | **The only file you need to edit to change the directory contents** |
| `config.js` | **The only file you must edit.** Business details, form provider, analytics |
| `js/forms.js` | Form delivery — validation, spam traps, provider transport. Shared across all kits |
| `js/integrations.js` | Analytics. Shared across all kits |
| `js/main.js` | Shared behaviour — theme, navigation, icons, generated logo marks, listing cards, scroll reveals, counters |
| `css/hero.css` | Home-page hero only — the dot backdrop and orange bloom, the search-bar halo, the live counters and the listing wall with its border beam. Delete the `<link>` in `index.html` and the hero falls back to a still version |
| `js/hero.js` | Home-page hero only — the split headline, the typed search placeholder and the counters. Safe to delete |
| `js/browse.js` | The filter, search and sort engine |
| `js/listing.js` | Builds the detail page from the dataset |
| `js/submit.js` | The multi-step form |
| `assets/favicon.svg` | Favicon, editable as text |
| `assets/og-image.png` | Social sharing image, 1200×630 |
| `assets/og-image-source.html` | The HTML the OG image is exported from — edit and re-screenshot |

```
directory-kit/
├── index.html
├── browse.html
├── listing.html
├── category.html
├── submit.html
├── pricing.html
├── config.js        ← the only file you must edit
├── SETUP.md         ZIP → live client site in 20 minutes
├── README.md
├── LICENCE.txt
├── assets/
│   ├── favicon.svg
│   ├── og-image.png
│   └── og-image-source.html
├── css/
│   ├── style.css
│   └── hero.css     ← home-page hero motion only
└── js/
    ├── data.js      ← your content lives here
    ├── forms.js         Form delivery — shared across all kits
    ├── integrations.js  Analytics — shared across all kits
    ├── main.js
    ├── hero.js      ← home-page hero motion only
    ├── browse.js
    ├── listing.js
    └── submit.js
```

---

## Quick start

1. Unzip the folder.
2. Open `index.html` in a browser. Everything works immediately, straight from disk.
3. Open `js/data.js` and start replacing listings with your own.
4. Change the six brand variables at the top of `css/style.css`.
5. Search the HTML files for `stacklist.example.com` and replace with your domain.
6. Upload the folder to any static host.

There is nothing to install and nothing to compile.

---

## Rebranding: the six variables

Everything visual is derived from six custom properties at the top of `css/style.css`,
in the `:root` block. Change these and the whole kit follows.

```css
:root {
  --brand: #d64518;           /* primary accent — buttons, links, focus rings */
  --brand-contrast: #ffffff;  /* text that sits on top of --brand */
  --accent: #b7791f;          /* secondary accent — sponsored badges, stars */
  --ink: #16130f;             /* primary text colour in light mode */
  --paper: #fbfaf8;           /* page background in light mode */
  --radius: 14px;             /* corner rounding for cards, inputs, buttons */
}
```

Two things worth knowing:

- **`--radius` cascades.** `--radius-sm` and `--radius-lg` are calculated from it, so a
  single change takes the whole kit from soft to sharp. Set it to `4px` for a technical
  look or `22px` for something friendlier.
- **Dark mode has its own values.** The dark palette is defined twice, further down the
  file — once under `@media (prefers-color-scheme: dark)` and once under
  `:root[data-theme="dark"]`. If you change `--brand`, brighten it in the dark blocks
  too; a colour that reads well on white is usually too dark on near-black.

To change the typeface, edit `--font`. The kit ships with a system font stack, which is
why it loads instantly and makes no network requests. If you add a web font, self-host it
rather than linking to a CDN so the "works offline" property survives.

---

## How to add or edit listings

**This is the important section.** All directory content lives in `js/data.js` in two
arrays: `CATEGORIES` and `LISTINGS`. Nothing else needs to be touched. Every page — the
home grids, the browse filters, the category pages, the detail pages, the structured data
— is rendered from these.

### A listing, field by field

```js
{
  id: "featherline",
  name: "Featherline",
  tagline: "Git-push deploys for Go, Rust and Node with no YAML to write.",
  description: "Featherline detects what your repository is, builds it in a …",
  category: "deployment",
  tags: ["ci-cd", "containers", "preview-environments", "cli", "free-tier"],
  pricing: "freemium",
  priceFrom: 0,
  priceNote: "Free for 3 projects · Pro from $19/mo",
  rating: 4.8,
  ratingCount: 512,
  votes: 2140,
  featured: true,
  sponsored: false,
  verified: true,
  added: "2026-01-22",
  launched: 2021,
  url: "https://featherline.example.com",
  platforms: ["Web", "CLI", "GitHub App", "GitLab"],
  mark: { shape: "orbit", from: "#0e7c5a", to: "#4ade80" },
  highlights: [ "…", "…" ],
  specs: [ ["Languages", "Go, Rust, Node"], ["Regions", "14"] ],
  gallery: [ { kind: "dashboard", caption: "Deploy timeline" } ],
  plans: [ { name: "Pro", price: "$19", period: "per month",
             note: "Most popular", features: ["…"], popular: true } ],
  reviews: [ { author: "Marta Ellison", role: "Backend engineer",
               rating: 5, date: "2026-02-08", title: "…", body: "…" } ]
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | Unique, lowercase, dashes, no spaces. This is the URL: `listing.html?id=featherline`. **Changing it breaks the listing's URL**, so pick it once. |
| `name` | yes | Display name. |
| `tagline` | yes | One sentence. Shown on cards and used in the page title. Aim for 40–90 characters. |
| `description` | yes | A paragraph. Shown on the detail page and searched by the filter engine. |
| `category` | yes | Must match the `id` of a category in `CATEGORIES`. |
| `tags` | yes | Lowercase, dashes. Drives the tag filter. See the note on tags below. |
| `pricing` | yes | Exactly one of `"free"`, `"freemium"`, `"paid"`, `"enterprise"`. Drives the price filter. |
| `priceFrom` | yes | A number, used for the "From $X/mo" headline. Use `0` for free. |
| `priceNote` | yes | The human sentence under the price, e.g. `"Free for 3 projects · Pro from $19/mo"`. |
| `rating` | yes | 0–5, one decimal. Drives the star display and the rating filter. |
| `ratingCount` | yes | How many reviews the rating is based on. |
| `votes` | yes | Upvote count. Drives the "Most upvoted" sort. |
| `featured` | yes | `true` puts it in *Featured this week* on the home page and gives it a tinted card. |
| `sponsored` | yes | `true` sorts it to the very top and labels it "Sponsored". |
| `verified` | yes | `true` shows the verification tick. |
| `added` | yes | `"YYYY-MM-DD"`. Drives the "Recently added" sort. The **three most recently added listings automatically get a "New" badge** — there is no flag to set. |
| `launched` | yes | Year, as a number. |
| `url` | yes | The tool's own site. Rendered with `rel="nofollow noopener"`; remove `nofollow` for paying listings if that is your policy. |
| `platforms` | yes | Array of strings. Appended to the specification table and the sidebar. |
| `mark` | yes | The generated logo tile. See below. |
| `highlights` | yes | 3–5 short sentences, shown as a tick list. |
| `specs` | yes | Array of `[label, value]` pairs for the specification table. Any length. |
| `gallery` | optional | Array of `{ kind, caption }`. `kind` is one of `"dashboard"`, `"terminal"`, `"chart"`, `"table"`. Omit the field entirely to hide the gallery. |
| `plans` | optional | Pricing plans. Add `popular: true` to one to highlight it. |
| `reviews` | optional | Each needs `author`, `role`, `rating`, `date`, `title`, `body`. |

### Adding a listing, in practice

1. Copy an existing listing block in `js/data.js`, braces and all.
2. Paste it inside the `LISTINGS` array and give it a new `id`.
3. Edit the fields.
4. Reload any page. It appears everywhere — grids, filters, counts, category page,
   its own detail page and the structured data — with no other change.

To remove a listing, delete its block. To reorder, don't bother: order is decided by the
sort control, not by position in the file.

### A note on tags

Tags are what make the filter feel alive, so make them **repeat across listings**. A tag
used by one listing is a dead end. The filter rail deliberately shows tags that appear on
two or more listings first, and only pads with single-use tags if there are too few.

The demo uses three cross-cutting facets that appear on many listings — `free-tier`,
`cli`, `self-hosted` — alongside specific ones. Copy that pattern: a handful of broad
facets everything can be tagged with, plus precise tags for discovery.

### The logo marks

There are no image files. Each listing's logo tile is generated from its `mark` field:

```js
mark: { shape: "orbit", from: "#0e7c5a", to: "#4ade80" }
```

`from` and `to` are the two stops of the background gradient. `shape` is one of the 24
built-in glyphs:

`orbit`, `anchor`, `peaks`, `lens`, `bell`, `flame`, `layers`, `wave`, `cube`, `key`,
`shield`, `vault`, `prism`, `socket`, `loop`, `beam`, `brackets`, `mesh`, `target`,
`grid`, `spark`, `stack`, `ring`, `glyph`

Pick different shapes and colour pairs for neighbouring listings and the grid reads like a
real logo wall. To add your own shape, add a key to the `SHAPES` object in `js/main.js` —
the value is SVG markup drawn on a 64×64 canvas.

**To use real logo images instead**, edit the `mark()` function in `js/main.js` to return
an `<img>` tag and add an `image` field to your listings.

### Adding or changing categories

```js
{
  id: "deployment",
  name: "Deployment & Hosting",
  short: "Deployment",
  icon: "rocket",
  blurb: "Ship code to production without babysitting a pipeline.",
  intro: "The paragraph at the top of category.html …",
  seo:   "The longer prose block at the bottom of category.html …"
}
```

- `id` must match the `category` field on your listings.
- `short` is used where space is tight, such as filter pills.
- `icon` is a key from the `ICONS` map in `js/main.js`. Useful ones for categories:
  `rocket`, `pulse`, `database`, `key`, `terminal`, `plug`, `layers`, `check`, `globe`,
  `bolt`, `tag`, `users`, `shield`, `eye`, `sparkle`, `trending`, `clock`, `grid`.
- `intro` and `seo` are the two prose blocks on the category page. **Write these
  properly** — for a directory they are the pages that rank.

The home page category grid, the browse filter list, the related-categories pills and the
per-category counts all update automatically.

---

## How the filtering works

`js/browse.js` runs everything client-side against the `LISTINGS` array. Filters combine:

1. **Search** — matches name, tagline, description, tags and category name.
2. **Category** — OR within the group (any checked category matches).
3. **Price tier** — OR within the group.
4. **Minimum rating** — a single threshold.
5. **Tags** — AND. A listing must carry *every* selected tag.

Sorting offers featured-first, highest rated, most upvoted, recently added and A–Z.

**Filter state is mirrored into the URL**, so any filtered view can be linked, bookmarked
and shared, and the back button behaves. That is why the home page chips work:
`browse.html?price=free` or `browse.html?tags=open-source&sort=rating` land pre-filtered.

Supported parameters: `q`, `category`, `price`, `rating`, `tags`, `sort`, `view`
(comma-separate multiple values, e.g. `?price=free,freemium`).

The results count is an `aria-live` region, so screen readers hear the count change as
filters are applied.

You can also drive the engine from your own code:

```js
SLBrowse.set({ pricing: ["free"], tags: ["open-source"] });  // applies and returns the count
SLBrowse.count();                                            // current number of results
SLBrowse.get();                                              // current filter state
```

### Scaling up

The engine filters in memory and re-renders the grid on every change. That is
comfortable into the low thousands of listings. Past that, add pagination or
"load more" in `renderGrid()` — the filtering itself stays fast; it is rendering
several thousand DOM nodes at once that gets expensive.

---

## Light and dark themes

The kit ships with both. The rules:

- Light values live on `:root`.
- Dark values are defined twice: under `@media (prefers-color-scheme: dark)` guarded with
  `:root:not([data-theme="light"])`, and under `:root[data-theme="dark"]`.

That combination means the site follows the operating system by default, the toggle
overrides it in either direction, and the choice is remembered in `localStorage` under the
key `stacklist-theme`.

Every page carries a small inline script in `<head>` that applies the stored theme
**before first paint**, so there is no white flash on load. If you add a page, copy that
script block across — it is the first `<script>` in every file.

All storage access is wrapped in `try/catch`, so private browsing and blocked-storage
settings degrade to "follows the system" rather than throwing.

---

## Motion

Scroll reveals with staggered timing, hover lift on cards, smooth filter transitions and
animated counters in the stats band.

All of it is inside `@media (prefers-reduced-motion: reduce)` guards. A visitor who has
asked their system to reduce motion gets the finished layout immediately with no
animation, no exceptions.

To add a reveal to something you build, give it `data-reveal` and call `SL.reveal()`.
For a counter, use `<span data-count="1200" data-compact="true">` — see the stats band in
`index.html` for the available attributes (`data-count`, `data-decimals`, `data-suffix`,
`data-prefix`, `data-compact`).

---

## SEO checklist before you launch

Directories live or die on search, so this is built in — but it needs your details.

- [ ] Replace `stacklist.example.com` everywhere with your domain (it appears in
      canonical tags, OG tags and JSON-LD).
- [ ] Rewrite the `<title>` and `<meta name="description">` on all six pages.
- [ ] Replace `assets/og-image.png` with your own 1200×630 image. Edit
      `assets/og-image-source.html` and re-export it, or drop in your own file under the
      same name — the `og:image` tags already point at it.
- [ ] Update the `Organization` block in `index.html` with your real name and logo.
- [ ] Write real `intro` and `seo` copy for every category — these are your ranking pages.
- [ ] Add a `sitemap.xml` and `robots.txt`.

Structured data already included: `WebSite` with `SearchAction` and `Organization` on the
home page, `CollectionPage` + `ItemList` + `BreadcrumbList` on browse and category pages,
`SoftwareApplication` + `AggregateRating` + `Review` + `Offer` + `BreadcrumbList` on
listing pages, and `FAQPage` + `Service` with offers on the pricing page. The listing and
category pages regenerate their JSON-LD from the dataset, so it can never drift out of
sync with what is on the page.

**If you are not listing software**, change `SoftwareApplication` in `js/listing.js` to
the right type for your directory — `LocalBusiness` for local services, `JobPosting` for
jobs, `Product` for physical goods. The rest of the graph stays the same.

---

## Wiring up the forms

They already do. The four-step listing submission delivers, with the uploaded
screenshots attached where your provider supports attachments.

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

It is a folder of static files, so anything works:

- **Netlify / Vercel / Cloudflare Pages** — drag the folder onto the dashboard, or point
  it at a repository. No build command, no output directory.
- **GitHub Pages** — push the folder, enable Pages on the branch.
- **Any host with FTP** — upload the folder. Shared hosting is fine.
- **From disk** — it genuinely works from `file:///`, which is useful for client previews.

There is no build step to configure and no environment variables to set.

### Browser support

Current Chrome, Edge, Firefox and Safari. The layout uses CSS Grid, `clamp()`,
`color-mix()` and `:has()`. Older browsers will see a slightly plainer page rather than a
broken one — the content, links and forms all still work.

---

## Licence summary

Included in full in `LICENCE.txt`.

**You may:**

- Use this kit for unlimited personal and commercial projects.
- Use it in client work, and charge your client for that work.
- Modify anything — the code, the design, the copy, the structure.
- Launch as many directories with it as you like.

**You may not:**

- Resell, redistribute or give away the kit itself, modified or not.
- Include it in another template, theme, kit or component library for sale.
- Upload it to a template marketplace.

The short version: build whatever you want with it, including for money. Just don't sell
the kit as a kit.

---

## A note on the demo content

Every tool, company, person, review, rating and statistic in `js/data.js` is fictional and
was written for this template. The example domains all use `.example.com`, which is
reserved for documentation and cannot be registered. Replace it all before launch — it is
placeholder content, not a starter dataset.
