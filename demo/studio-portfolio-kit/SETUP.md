# From ZIP to live client site in 20 minutes

This guide takes one of these kits from a folder on your desktop to a working
website with a contact form that actually delivers.

No build step. No npm. No framework. You edit one file, upload a folder, done.

**The 20 minutes, roughly:**

| | | |
|---|---|---|
| 1 | Open it and look at it | 1 min |
| 2 | Get a form key | 3 min |
| 3 | Fill in `config.js` | 5 min |
| 4 | Replace the demo copy and images | *the rest of your afternoon, honestly* |
| 5 | Deploy | 5 min |
| 6 | Connect the domain | 5 min |

Step 4 is the real work and no template can do it for you. Steps 1–3 and 5–6
are what this guide covers, and they genuinely are twenty minutes.

---

## 1. Open it and look at it

Unzip the kit and double-click `index.html`. It opens in your browser from
`file://` and works — navigation, menus, tabs, dark mode, form validation, all
of it. There is nothing to install and nothing to run.

Nothing in the kit makes a single network request until you configure one. You
can check: open DevTools → Network, reload, and you will see only local files.

---

## 2. Get a form key

Every form in the kit is wired and waiting. It needs one key.

### Which provider should I use?

**Use Web3Forms** unless one of the exceptions below applies. It has the most
generous free tier of the lot, needs no credit card, its access key is
explicitly designed to sit in public HTML, and it is the least effort.

**Use Forminit** (formerly Getform, renamed January 2026) **if your client's
data must stay in the EU.** It is the only provider here that states form data
is stored in EU data centres, and it offers a DPA on request. If you are
building for a public body, a healthcare client, or anyone whose DPO will ask
where the data lives, this is the answer.

**Use Netlify Forms if you are deploying to Netlify anyway** — under Netlify's
credit-based plans, forms cost nothing and are unlimited, with Akismet spam
filtering included. It needs two extra attributes in your HTML (see below) and
it only works on Netlify.

Here is the honest comparison. All figures checked against the providers' own
docs and pricing pages in August 2026.

| | Free tier | Cheapest paid | Files on free | EU data residency | DPA | Spam filtering |
|---|---|---|---|---|---|---|
| **Web3Forms** | **250/mo**, unlimited forms | $15/mo, $149/yr | ✗ (Pro only, 5 MB) | ✗ US-East | ✗ | server-side filter + hCaptcha (free) |
| **Forminit** | 100/mo, 1 form | $19/mo (yearly) | ✓ 25 MB | **✓ EU data centres** | **✓ on request** | honeypot, reCAPTCHA, hCaptcha, Turnstile |
| **Formspree** | 50/mo, unlimited forms | $15/mo, $120/yr | ✗ (paid only) | ✗ AWS US, SCCs | ✗ published | Formshield ML + reCAPTCHA/hCaptcha/Turnstile |
| **FormSubmit** | **unlimited**, no account | — (free only) | ✓ 10 MB | ✗ undisclosed | ✗ | reCAPTCHA + honeypot |
| **Basin** | 50/mo, 1 form | $12.50/mo | ✓ 100 MB/file | ✗ Canada/US | ✓ (auto-accepted) | reCAPTCHA/hCaptcha/Turnstile, AI filter, blocklists |
| **Netlify Forms** | **free & unlimited** on credit plans (100/mo on legacy plans) | — | ✓ 8 MB request | ✗ US | ✓ in standard terms | **Akismet** + honeypot + reCAPTCHA |

Things the comparison table does not fit:

- **Web3Forms** requires an account now (the "no signup at all" era is over).
  Its access key is public by design — their FAQ answers "what if someone gets
  my access key?" with "nothing much… they can send you emails". File
  attachments need a paid plan. Its API refuses server-side calls by design;
  this kit calls it from the browser, which is the supported way.
- **Forminit** rate-limits anonymous submissions to one every 5 seconds, which
  is fine for a contact form and not fine for a busy signup. Set the form to
  **Public** mode in their dashboard — that is the mode meant for browsers —
  and lock it down with **Authorized Domains** rather than a secret.
- **Formspree**'s free tier does not include a custom redirect, so visitors
  without JavaScript land on a Formspree-branded thank-you page. Its
  restrict-to-domain feature is free and worth switching on, but it works off
  the `Referer` header — do not set a `Referrer-Policy` stricter than
  `strict-origin-when-cross-origin` or your own submissions get marked as spam.
- **FormSubmit** is genuinely free and unlimited with no account, which is
  remarkable, and correspondingly thin on everything else: its only privacy
  document is a two-page PDF dated 2019 with no GDPR language at all, and it
  has no domain restriction, so anyone who copies your endpoint out of your
  HTML can post to it. Fine for a personal site. Think hard before putting a
  client's enquiries through it. **Always use the random-string token, never
  the bare-email endpoint** — the bare form puts the address in your HTML for
  every scraper to find. Your first submission triggers a confirmation email
  you must click before anything is delivered.
- **Basin** has the best file limits and the richest spam tooling, and the
  stingiest free tier. Canadian company, Canadian and US hosting.
- **Netlify Forms** only works on a site deployed to Netlify — the form is
  detected at deploy time and submissions are intercepted at their edge. There
  is no endpoint you can post to from elsewhere.

### Getting the key

**Web3Forms** — go to web3forms.com, enter the email address that should
receive enquiries, create an account. You get an access key that looks like
`a1b2c3d4-e5f6-7890-abcd-ef1234567890`. That is what goes in `config.js`.

**Forminit** — sign up at forminit.com, create a form, set it to **Public**
mode, and add your live domain under Authorized Domains. Your endpoint looks
like `https://forminit.com/f/abc123`; the key is the `abc123` part.

**Formspree** — sign up, create a form. Your endpoint is
`https://formspree.io/f/xvojkqpb`; the key is `xvojkqpb`.

**FormSubmit** — no account. Send one submission to
`https://formsubmit.co/your@email.com`, click the confirmation email, and it
replies with a random string. Use *that string* as your key.

**Basin** — sign up, create a form, take the 12-character id out of
`https://usebasin.com/f/1a2b3c4d5e6f`.

**Netlify** — see the Netlify section further down; the "key" is your form's
`name` attribute.

---

## 3. Fill in `config.js`

`config.js` sits in the root of the kit, next to `index.html`. It is the only
file you need to edit to put the site live. Open it in any text editor.

```js
window.SITE_CONFIG = {

  business: {
    name:    "Van Dijk & Partners",
    email:   "hello@vandijk.nl",
    phone:   "+31 20 123 4567",
    address: "Keizersgracht 241, 1016 EA Amsterdam",
    url:     "https://www.vandijk.nl",
    replaceDemoDetails: true
  },

  forms: {
    provider:   "web3forms",
    key:        "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    fallback:   "mailto",
    minSeconds: 3,
    timeout:    15000
  },

  // …analytics, map and booking blocks follow, all optional
};
```

Save, reload the page, submit the form. It arrives in your inbox.

### What the `business` block does for you

Because `config.js` also lists the kit's demo details in a `demo` block at the
bottom, filling in `business` finds and replaces them across **every page** on
load: the business name in the header, every phone number, every `tel:` link,
every email address. One edit, six pages updated.

This is a convenience for getting a site in front of a client quickly. Before
you hand it over, do a find-and-replace in the HTML for real, and delete the
`demo` block. Text substitution at runtime is one more thing that can surprise
somebody later. To turn it off entirely, set `replaceDemoDetails: false`.

Some kits have secondary addresses (`events@`, `bookings@`, a second branch
phone number) listed under `demo.replace` with empty values. Fill in the
right-hand side of any you want swapped too.

### What happens if you skip this step

Nothing breaks, and nothing lies to the visitor. With no provider key:

- `fallback: "mailto"` (the default) opens the visitor's mail client with the
  whole form pre-filled as a message to `business.email`. For a one-person
  business this is a legitimate way to ship — no third party, no data
  processor, nothing to declare.
- `fallback: "notice"` shows "this form is not connected to an inbox yet.
  Nothing was sent." and keeps everything the visitor typed.

What it will never do is show a success message for a message that went
nowhere. The template's own "not connected yet" notices disappear on their own
the moment you set a key.

### Spam protection

Every form gets two traps automatically, with no configuration:

- A **honeypot** field, invisible to people and irresistible to naive bots.
  The field name matches whatever your provider expects, so their server-side
  filtering sees it too.
- A **time-trap**: a form completed in under `minSeconds` (default 3) was not
  completed by a human. Raise it if spam still gets through; lower it to 1 for
  a single-field newsletter signup where 3 seconds is a real delay.

A caught submission is shown the success message and silently dropped. Telling
a bot it was caught only trains the next one.

Neither is a captcha, and neither is claimed to be. They stop drive-by spam.
For a form that is being targeted deliberately, add your provider's captcha —
all six support at least one, and Web3Forms' hCaptcha is free and needs two
lines of HTML.

### Adding your own forms

Any form you add works with no JavaScript at all — give it `data-form`:

```html
<form data-form data-form-type="Quote request" novalidate>
  <div class="field">
    <label for="email">Email</label>
    <input class="input" type="email" id="email" name="email" required>
  </div>
  <button class="btn btn--primary" type="submit">Send</button>
  <div class="form-status" data-form-status role="status" aria-live="polite">
    <span></span>
  </div>
</form>
```

That is it. Validation, the honeypot, the send, the button's sending state and
the result message are all handled.

Useful attributes:

| Attribute | Effect |
|---|---|
| `data-form` | Turns the form on. Required. |
| `data-form-type="…"` | Labels the submission — appears in your inbox. |
| `data-form-subject="…"` | Sets the email subject line exactly. |
| `data-form-status` | Where the result message is written. |
| `data-demo-notice` | On any element: hidden once a provider key is set. |

### What actually arrives in your inbox

The kits ask for very different things — a reservation wants a date and a party
size, an appointment wants a practitioner, a listing submission wants a URL and
a category. What you want to read is always the same, so every submission is
normalised before it is sent:

- `name` — composed from `first-name` + `last-name` when there is no single
  name field
- `email` — the reply-to address, found even if the field is called something
  else
- `subject` — e.g. *"Booking request from Aoife Ní Bhriain — Ember & Oak"*
- `message` — **every field on the form, one per line, in page order**, so a
  reservation with no free-text box still arrives as something a person can
  read
- plus `form_type`, `page` and `submitted_at` for triage

The honeypot is never forwarded.

### File uploads

The directory kit's submission form has a file input. Whether the files are
actually delivered depends on your provider: Forminit, FormSubmit, Basin and
Netlify accept attachments on their free tiers; Web3Forms and Formspree require
a paid plan. When files are present the kit posts `multipart/form-data`
automatically. If your provider drops them, the submission still arrives — you
just ask for the files by return email.

---

## 4. Optional extras

All of these are off until you configure them. An unconfigured kit makes no
external requests at all.

### Analytics

Cookieless and privacy-first only. Google Analytics is deliberately not offered
— it needs a consent banner in the EU, and a consent banner on a five-page
small-business site is a worse experience than not having the analytics.

```js
analytics: { provider: "plausible", domain: "vandijk.nl" }
```

| Provider | Cost | Where it runs | Config |
|---|---|---|---|
| **Plausible** | from €9/mo, or free self-hosted | EU (Germany) | `provider: "plausible"`, `domain` |
| **Umami** | free, self-hosted | wherever you host it | `provider: "umami"`, `id`, `src` |
| **Cloudflare Web Analytics** | free | Cloudflare's edge | `provider: "cloudflare"`, `token` |

None of the three sets a cookie or collects personal data, which is why none of
them needs a consent banner under the ePrivacy Directive. That stops being true
the moment you switch on a feature that stores an identifier — check your own
configuration rather than taking this paragraph as advice.

Nothing loads when the page is opened from `file://`, so building the site
locally never pollutes your statistics.

### Maps (clinic, restaurant, law firm kits)

The kits ship a drawn map illustration. Switch on a real one:

```js
map: { enabled: true, provider: "osm", lat: 52.3676, lon: 4.9041, zoom: 16 }
```

OpenStreetMap is the default: no API key, no account, no tracking cookie, no
bill. To find your coordinates, open openstreetmap.org, right-click your
building, choose "Show address", and read the numbers out of the URL.

The clinic kit has two locations, so each map carries its own coordinates in
the HTML (`data-map-lat`, `data-map-lon`) which override the config. Edit those
directly.

`provider: "google"` gives you a keyless Google embed instead. It sets cookies,
so you would need a consent banner for it in the EU. That is why OSM is the
default.

Switch it off again and the illustration comes straight back — nothing is
deleted from the page.

### Booking (clinic and restaurant kits)

If your client already runs Cal.com or Calendly:

```js
booking: { provider: "cal", url: "https://cal.com/vandijk/consult", height: 680 }
```

The embed appears above the form on the appointments/reservations page. **The
static form stays where it is** as the fallback, because a third-party embed
that fails to load must never leave a visitor with no way to get in touch. Set
`replaceForm: true` if you would rather have only the embed.

Both embeds are third-party iframes that set cookies, so switching one on means
you need a cookie notice in the EU. They do not load from `file://` — deploy
first, then check.

---

## 5. Deploy

The kit is plain HTML, CSS and JavaScript. It will run anywhere that serves
files. Pick whichever of these you already have an account with.

### Netlify (drag and drop, free)

1. Go to `app.netlify.com/drop`.
2. Drag the kit folder onto the page.
3. It is live, on HTTPS, in about ten seconds.

For a site you will update, connect a Git repository instead so a push
redeploys. `netlify.toml` is not needed; there is no build command.

### Cloudflare Pages (free, generous, good for EU traffic)

1. Cloudflare dashboard → Workers & Pages → Create → Pages.
2. Either connect a Git repo or use "Upload assets" and drop the folder in.
3. Build command: leave **empty**. Build output directory: `/`.

Cloudflare Web Analytics is one click from the same dashboard, which pairs
nicely with the analytics block above.

### Vercel

1. `vercel.com/new`, import the repo (or run `npx vercel` in the folder).
2. Framework preset: **Other**. Build command: leave empty. Output
   directory: leave empty.

### Any shared host (cPanel, Plesk, a VPS, your client's existing hosting)

Upload the contents of the kit folder into `public_html` (or `www`, or
`htdocs`) over FTP/SFTP. That is the whole deployment. Make sure
`index.html` ends up at the root of the folder, not inside a subfolder.

Two things worth checking on old shared hosting:

- **HTTPS.** Most hosts now offer free Let's Encrypt certificates in the
  control panel. Turn it on. Form providers and browsers both increasingly
  require it.
- **`.html` extensions.** The kits link between pages as `about.html`, which
  works everywhere. Some hosts rewrite to extensionless URLs; if yours does,
  both forms still work.

### GitHub Pages

Push the folder to a repo, then Settings → Pages → deploy from branch, root.
Add an empty `.nojekyll` file at the root so folders beginning with `_` are
not skipped.

### Netlify Forms specifically

If you chose Netlify Forms, you need two small markup changes that no other
provider requires, because Netlify detects forms by scanning your HTML at
deploy time.

On each `<form>`, add `data-netlify="true"` and a `name`:

```html
<form data-form data-netlify="true" name="contact"
      netlify-honeypot="bot-field" novalidate>
```

Then in `config.js`:

```js
forms: { provider: "netlify", key: "contact" }   // key = the form's name
```

`key` must match the `name` attribute. Deploy, then check Netlify's dashboard
under Forms → make sure form detection is enabled, and redeploy once if you
had to switch it on. Submissions appear in the dashboard and can be emailed on.

---

## 6. Connect the domain

**On Netlify / Vercel / Cloudflare Pages:** add the domain in the dashboard,
then at your registrar point the DNS at what they tell you — usually an `A`
record for the apex and a `CNAME` for `www`. Certificates are issued
automatically within a few minutes.

**On shared hosting:** point the domain's nameservers at the host, or add the
domain as an add-on domain in cPanel.

Then, in the kit:

1. Set `business.url` in `config.js`.
2. Search the HTML for `example.com` and replace the placeholder domain — it
   appears in `sitemap.xml`, `robots.txt`, the canonical `<link>` tags and the
   Open Graph and structured-data blocks in each page's `<head>`.
3. If you are using Formspree or Forminit, add the live domain to their
   restrict-to-domain / authorized-domains setting now.

---

## 7. GDPR: what you are actually signing up to

Not legal advice. This is the shape of the thing, so you know what to tell a
client who asks.

**A contact form processes personal data.** A name, an email address and
"here is my problem" is personal data, and in the clinic kit's case it can
easily become health data, which is a special category under Article 9 and
needs a much higher bar. Tell clients not to collect diagnoses through a web
form.

**Your form provider is a data processor.** They receive, transmit and — all
six of them — store the submission. That means:

- You should have a **data processing agreement** with them. Forminit provides
  one on request; Basin's is auto-accepted in their terms; Netlify's is part of
  their standard terms. Web3Forms, Formspree and FormSubmit publish none.
  Formspree states it relies on Standard Contractual Clauses as a processor and
  holds SOC 2 Type II, which is a defensible position without a signed DPA.
- If the provider is outside the EU/EEA — which Web3Forms (US), Formspree (US),
  Basin (Canada/US), FormSubmit (undisclosed) and Netlify (US) all are — the
  submission is an **international transfer** and needs a lawful basis for it,
  in practice SCCs. **Forminit is the only one of the six that stores form data
  in EU data centres.**
- The provider's privacy notice should be reflected in your client's. Naming
  the processor is good practice and cheap to do.

**They keep the content.** Retention varies: Web3Forms 30 days on free / 1 year
on Pro, Formspree 30 days on free / unlimited on paid (and it can be switched
off per form), FormSubmit 30 days, Basin 30 days on free / up to unlimited,
Netlify indefinitely until you delete. Note that Web3Forms' FAQ still claims
"we do not store any form submissions" while their pricing page sells
submission history — treat the pricing page as the truth.

**The `mailto:` fallback has no processor at all.** If a client is nervous, or
the site takes two enquiries a month, leaving `forms.provider` empty and
`fallback: "mailto"` set is a completely legitimate configuration. The message
goes from the visitor's own mail client to your client's inbox and touches
nobody in between.

**Consent banners.** As shipped, and with any of the analytics options above,
these kits set no cookies and need no consent banner. Switching on the Google
Maps embed, a Cal.com or Calendly embed, or your provider's reCAPTCHA changes
that — all of them set cookies or contact Google. The OpenStreetMap embed and
hCaptcha are the friendlier choices.

**What to write in the privacy notice.** At minimum: what the form collects,
why, who processes it (name the provider), how long it is kept, and how to ask
for it to be deleted. The saas kit's `legal.html` is a reasonable skeleton.

---

## 8. Making it a CMS site

Short version: **you can, without a build step, but it is worth being honest
about the trade-off.**

Git-based CMSs — Decap (formerly Netlify CMS), Sveltia, Pages CMS — all work
the same way: they are a JavaScript admin panel that reads and writes Markdown
or YAML files in your Git repository, then your host rebuilds the site. The
rebuild is the problem. These kits have no build step, so there is nothing to
turn a Markdown file into HTML.

You have three honest options.

### Option A — CMS for content, kit stays static (recommended)

Use a CMS to edit **the data files the kit already reads**, not the HTML. The
directory kit's `js/data.js` and the restaurant kit's menu are the obvious
candidates: convert them to a `.json` file, load it with `fetch()`, and point
the CMS at the JSON. The client edits listings or menu items in a friendly
form; nothing needs to be rebuilt because the page reads the JSON at runtime.

This is genuinely no-build. It costs you one `fetch()` and means those pages
need a web server rather than `file://` — which they have, once deployed.

### Option B — CMS edits the HTML directly

Pages CMS and Decap can both be configured to edit an HTML file's fields
directly if you define them as a collection with an `html` widget. This works
with no build step at all. It is fiddly to configure, and a client with a rich
text editor pointed at your carefully-made HTML will eventually break the
layout. Suitable for editing a few specific blocks — opening hours, a
"currently booking for…" line — and not for whole pages.

### Option C — add a static site generator

If the client genuinely needs to publish articles, the kits' insights and
changelog pages want a real SSG. Eleventy is the least invasive: point it at
the kit folder, move the repeated header and footer into an include, and turn
the article pages into templates. That is an afternoon of work and it does add
a build step, which the rest of this kit deliberately avoids. Do it when the
requirement is real, not pre-emptively.

### Setting up Decap, concretely

If you go with Option A or B, and you are on Netlify:

1. Create `admin/index.html` in the kit:

   ```html
   <!doctype html>
   <html><head><meta charset="utf-8"><title>Content</title></head>
   <body>
   <script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"></script>
   </body></html>
   ```

2. Create `admin/config.yml` describing where your content lives:

   ```yaml
   backend:
     name: git-gateway
     branch: main
   media_folder: "assets/uploads"
   public_folder: "/assets/uploads"
   collections:
     - name: "menu"
       label: "Menu"
       files:
         - file: "data/menu.json"
           name: "menu"
           label: "Menu"
           fields:
             - { name: dishes, label: Dishes, widget: list, fields: [
                 { name: name, label: Name, widget: string },
                 { name: price, label: Price, widget: string },
                 { name: description, label: Description, widget: text } ] }
   ```

3. Enable **Identity** and **Git Gateway** in the Netlify dashboard, invite the
   client as a user.

**Sveltia CMS** is a drop-in replacement for Decap with the same `config.yml`,
a much better UI and no dependency on Netlify Identity (it authenticates
straight against GitHub). If you are setting this up in 2026, use Sveltia and
keep the Decap config file. **Pages CMS** (pagescms.org) needs no admin files in
your repo at all — you add one `.pages.yml` and use their hosted editor — which
is the least intrusive of the three.

Whichever you pick, note that the `admin/` panel loads a large script from a
CDN. That is fine — it is behind a login and not part of the public site — but
it does mean the "no external requests" property applies to the site, not to
the admin page.

---

## Troubleshooting

**The form says "not connected to an inbox yet".** `forms.provider` or
`forms.key` is empty, or still holds a placeholder value. Check for typos in
the provider name — it must be one of `web3forms`, `forminit`, `formspree`,
`formsubmit`, `basin`, `netlify`, `custom`.

**Submissions never arrive.** Check the provider's dashboard first — most keep
a copy even when the email fails. With FormSubmit, make sure you clicked the
confirmation email. With Formspree or Forminit, check whether restrict-to-domain
is on and whether your live domain is actually in the list.

**It works locally but not on the live site.** Almost always domain
restriction. Add the live domain in your provider's settings. On Formspree,
also check your `Referrer-Policy`.

**Everything submits as spam.** Your `Referrer-Policy` is too strict for
Formspree's domain check, or `minSeconds` is set absurdly high.

**The form submits twice.** It should not — the kit blocks a second submission
while one is in flight. If you have added your own `action` attribute to a form
that also has `data-form`, remove the `action`.

**Nothing happens at all when I submit.** Open the browser console and type
`SiteForms.describe()`. It will tell you what it thinks is configured.
`SiteKit.status()` does the same for analytics, maps and booking.

**I get "This method is not allowed" from Web3Forms.** Their API refuses
server-side calls. The kit calls it from the browser, so this only appears if
you have proxied it through something. Don't.

---

## File map

```
your-kit/
├── index.html, about.html, …    the pages
├── config.js                    ← the only file you must edit
├── css/style.css                one stylesheet, CSS custom properties at the top
├── js/
│   ├── forms.js                 form delivery (shared, do not edit)
│   ├── integrations.js          analytics, maps, booking (shared, do not edit)
│   └── main.js                  this kit's own behaviour
├── assets/                      favicon, Open Graph images
├── robots.txt, sitemap.xml      edit the domain in these
└── README.md
```

`forms.js` and `integrations.js` are identical in all seven kits. If you own
several, you can update them all by copying one file over the others.
