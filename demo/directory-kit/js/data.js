/* ==========================================================================
   STACKLIST — data.js
   --------------------------------------------------------------------------
   THIS IS THE ONLY FILE YOU EDIT TO CHANGE THE DIRECTORY CONTENTS.

   Everything on every page — the home page grids, the browse page filters,
   the category pages, the detail page — is rendered from the two arrays
   below: CATEGORIES and LISTINGS.

   It is a plain <script src> file, not JSON fetched over the network, so the
   whole template keeps working when you open it straight from disk
   (file:///…) with no web server running.

   See the "How to add or edit a listing" section of README.md for a full
   field-by-field reference. The short version:

     - Every listing needs a UNIQUE `id` (lowercase, dashes, no spaces).
       The id is what listing.html?id=… looks up, so once a listing is
       published, changing its id breaks its URL.
     - `category` must match the `id` of one of the CATEGORIES below.
     - `pricing` must be one of: "free" | "freemium" | "paid" | "enterprise".
     - `mark` draws the logo tile. No image files are involved — pick a
       `shape` from the list in js/main.js and two hex colours.

   Delete every listing here and paste your own in; nothing else needs to
   change.
   ========================================================================== */

var STACKLIST = (function () {
  "use strict";

  /* ------------------------------------------------------------------------
     CATEGORIES
     `id`      — used by listing.category, browse.html?category=…, links
     `name`    — display name
     `short`   — compact label used in tight spaces (filter list, chips)
     `blurb`   — one line, shown under the category tile on the home page
     `intro`   — the paragraph at the top of category.html
     `seo`     — the longer prose block at the bottom of category.html
     `icon`    — key into the ICONS map in js/main.js
     ---------------------------------------------------------------------- */
  var CATEGORIES = [
    {
      id: "deployment",
      name: "Deployment & Hosting",
      short: "Deployment",
      icon: "rocket",
      blurb: "Ship code to production without babysitting a pipeline.",
      intro:
        "Deployment tooling has quietly become the most crowded shelf in the developer toolbox — and the most consequential. The platforms below cover the whole spread: opinionated git-push hosts that ask you for nothing but a repository, self-hosted control planes that turn a €5 VPS into a real deploy target, and edge networks built for teams who care about the ninety-ninth percentile in Jakarta.",
      seo:
        "Choosing a deployment platform is mostly a question of how much control you want to trade for how little operational work. Managed platforms-as-a-service detect your framework, build a container and hand you a URL — excellent while your architecture is boring, occasionally infuriating when it stops being boring. Self-hosted options invert that: you keep the bill and the flexibility, and you inherit the pager. In between sit the edge platforms, which are less about convenience and more about physics — moving compute closer to the request so that latency stops being a design constraint. Whichever direction you lean, three things matter more than the marketing page suggests: how fast a rollback is, whether preview environments are genuinely free, and what happens to your bill on the day something goes viral.",
    },
    {
      id: "observability",
      name: "Monitoring & Observability",
      short: "Observability",
      icon: "pulse",
      blurb: "Know what broke, when it broke, and who to wake up.",
      intro:
        "Observability tools are how you find out that production is unhappy before your users tell you. This category collects the three pieces most teams end up assembling: a place to send traces, logs and metrics; something to search them quickly when the graphs go strange; and an on-call rotation that pages the right person at three in the morning.",
      seo:
        "The observability market splits neatly along a cost axis. At one end, all-in-one platforms ingest everything you send them and charge accordingly — wonderful during an incident, alarming at renewal. At the other, focused tools do one signal properly and expect you to bring your own glue, usually OpenTelemetry. The pragmatic middle ground for a small team is to instrument with an open standard so you are never locked in, sample aggressively on the paths that are healthy, and keep full fidelity on errors and slow requests. Whatever you pick, budget for retention honestly: log volume grows with traffic and with every well-meaning debug statement someone forgets to remove.",
    },
    {
      id: "databases",
      name: "Databases & Storage",
      short: "Databases",
      icon: "database",
      blurb: "Somewhere durable to put the things that matter.",
      intro:
        "Every application eventually becomes an argument about its database. The tools here cover relational stores that branch like source control, embedded engines small enough to ship inside a binary, and object storage priced by people who have apparently met a real invoice.",
      seo:
        "Managed Postgres has become the sensible default for most products, and the interesting competition has moved to developer experience rather than the query engine — database branching per pull request, instant restores, connection pooling that survives serverless, and pricing that scales down to nothing on a hobby project. Alongside that, two specialised needs keep recurring: vector search for anything doing semantic retrieval, and cheap durable object storage for the files your relational database should never hold. The advice that survives contact with production is unglamorous. Keep the primary datastore boring and well understood. Add a specialised engine only when a query pattern genuinely does not fit. And test your restore path before you need it, because a backup you have never restored is a rumour, not a backup.",
    },
    {
      id: "auth",
      name: "Auth & Identity",
      short: "Auth",
      icon: "key",
      blurb: "Log people in without writing your own crypto.",
      intro:
        "Authentication is the classic build-versus-buy trap: three days to a working login form, three years to something you would trust with an enterprise contract. These tools cover session and passkey handling, fine-grained authorization, and the secrets your services need to talk to each other.",
      seo:
        "There are three separate problems in this category and confusing them is the usual source of pain. Authentication answers who is making this request — sessions, passkeys, magic links, social providers, SAML for the enterprise deal you have not closed yet. Authorization answers what they are allowed to do, and it is the one teams underestimate; role checks scattered through controllers work until the first customer asks for per-project permissions, at which point a policy service modelled on Google's Zanzibar paper starts to look like foresight rather than over-engineering. Secrets management is the third: keeping credentials out of your repository and scoped per environment. Buying the first, planning early for the second, and never improvising the third is a defensible strategy for almost every team.",
    },
    {
      id: "devtools",
      name: "CLI & Local Dev",
      short: "Local dev",
      icon: "terminal",
      blurb: "Make the machine you actually work on pleasant.",
      intro:
        "The tools you touch a hundred times a day deserve more attention than they usually get. This category is about the local loop: booting a full stack with one command, making your shell history useful, and giving every developer on the team an identical environment without a two-page onboarding document.",
      seo:
        "A slow or fragile local environment taxes every single change a team ships, and unlike most engineering problems it compounds quietly. The modern answer has converged on declaring the environment rather than documenting it — one checked-in file that pins language versions, services and dependencies, so a new laptop is productive in minutes and nobody debugs a problem that only exists on their machine. Around that sits a layer of quality-of-life tooling: process orchestrators that start your database, queue and API together with readable logs, and shell tooling that turns a scrolling wall of history into something searchable. None of this ships a feature by itself. All of it decides how quickly features get shipped.",
    },
    {
      id: "apis",
      name: "APIs & Integrations",
      short: "APIs",
      icon: "plug",
      blurb: "Talk to other people's systems without regret.",
      intro:
        "Sooner or later your product has to speak to somebody else's. These tools handle the awkward parts: webhooks that arrive twice or not at all, API surfaces that need to stay consistent across nine client languages, and the long tail of enterprise systems your sales team keeps promising.",
      seo:
        "Integration work fails in predictable ways, which is good news, because predictable failures can be bought off. Inbound webhooks need signature verification, idempotency and a replay button, and building that properly costs more engineering time than teams budget. Outbound APIs need a single source of truth — a specification that generates the SDKs and the documentation, so the Python client and the TypeScript client cannot drift apart. And integrations with the wider business software world need either a unified API layer or a headcount, because every CRM models a contact slightly differently and you will be the one reconciling it. Deciding which of these three you are actually in the business of building is worth an afternoon before it is worth a quarter.",
    },
    {
      id: "testing",
      name: "Testing & QA",
      short: "Testing",
      icon: "check",
      blurb: "Catch it in CI, not in the incident channel.",
      intro:
        "Testing tools earn their place by being fast enough that people keep running them. The picks here cover browser tests that survive a redesign, visual diffs attached to pull requests, and load testing you can write in the language you already use.",
      seo:
        "The economics of automated testing are decided almost entirely by flakiness. A suite that fails intermittently teaches a team to re-run rather than investigate, and once that habit sets in the suite has become expensive theatre. Modern end-to-end tooling attacks this with better selectors, automatic waiting and retry semantics that distinguish a genuine regression from a slow network. Visual regression testing solves the complementary problem — the change that breaks no assertion but moves a button off the screen — and works best when the diff appears in the pull request rather than in a dashboard nobody opens. Load testing, meanwhile, is the discipline most often skipped and most often regretted, usually about four hours into a launch day.",
    },
    {
      id: "frontend",
      name: "UI & Frontend",
      short: "Frontend",
      icon: "layers",
      blurb: "Interfaces that look considered and behave properly.",
      intro:
        "Frontend tooling has matured past the framework wars into something more useful: shared vocabulary. The tools below deal in design tokens, accessible components and typography scales — the unglamorous infrastructure that makes an interface feel deliberate instead of assembled.",
      seo:
        "The gap between an interface that works and one that feels professional is mostly consistency, and consistency is a tooling problem before it is a taste problem. Component libraries built on accessible primitives remove an entire class of bugs — focus traps, keyboard navigation, screen reader semantics — that teams otherwise rediscover one support ticket at a time. Design tokens give colour, spacing and type a single definition that design and code can both point at, which is what stops a product from acquiring eleven shades of grey. And a generated type scale, however trivial it sounds, is the difference between headings that feel rhythmic and headings that were chosen individually at eleven at night. None of these are large investments. All of them are visible in the final product.",
    },
  ];

  /* ------------------------------------------------------------------------
     LISTINGS
     ---------------------------------------------------------------------- */
  var LISTINGS = [
    /* ---------------------------------------------------------- deployment */
    {
      id: "featherline",
      name: "Featherline",
      tagline: "Git-push deploys for Go, Rust and Node with no YAML to write.",
      description:
        "Featherline detects what your repository is, builds it in a reproducible container and puts it behind a global anycast address. There is no pipeline definition file: the build plan is inferred from your lockfile and can be overridden with a handful of environment variables when the inference gets it wrong. Every branch gets its own URL, every deploy is atomic, and rolling back is a single click that swaps the routing table rather than rebuilding anything.",
      category: "deployment",
      tags: ["ci-cd", "containers", "preview-environments", "zero-config", "rollbacks", "free-tier", "cli"],
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
      highlights: [
        "Build plans inferred from your lockfile — no pipeline YAML",
        "Atomic deploys with instant routing-table rollback",
        "A preview URL for every branch, free on all plans",
        "Build cache shared across branches, so second builds are ~8s",
      ],
      specs: [
        ["Languages", "Go, Rust, Node, Python, Ruby, Elixir, static"],
        ["Regions", "14 (US, EU, APAC, South America)"],
        ["Build minutes", "Unlimited on Pro, 500/mo free"],
        ["Rollback time", "Under 2 seconds"],
        ["Custom domains", "Unlimited, with automatic TLS"],
        ["SLA", "99.95% on Pro and above"],
      ],
      gallery: [
        { kind: "dashboard", caption: "Deploy timeline with per-branch previews" },
        { kind: "terminal", caption: "One-command deploy from the CLI" },
        { kind: "chart", caption: "Build duration trends across the last 30 days" },
      ],
      plans: [
        { name: "Hobby", price: "$0", period: "forever", note: "3 projects", features: ["500 build minutes", "Preview URLs", "Community support"] },
        { name: "Pro", price: "$19", period: "per month", note: "Most popular", features: ["Unlimited projects", "Unlimited builds", "99.95% SLA"], popular: true },
        { name: "Team", price: "$49", period: "per seat / month", note: "For 3+ engineers", features: ["Role-based access", "Audit log", "Priority support"] },
      ],
      reviews: [
        { author: "Marta Ellison", role: "Backend engineer, Kestrel Health", rating: 5, date: "2026-02-08", title: "The rollback actually works", body: "We had a bad migration go out at 16:40 on a Friday and were back on the previous build in under five seconds. That single feature has paid for the subscription several times over." },
        { author: "Devon Achebe", role: "Solo founder", rating: 5, date: "2026-01-30", title: "Zero config is not marketing here", body: "Pointed it at a Go monorepo with three services and it worked out the build plan correctly on the first try, including the private module proxy." },
        { author: "Priya Raghunathan", role: "Platform lead, Tessellate", rating: 4, date: "2025-12-19", title: "Great, until you need something odd", body: "Superb for standard services. We had to drop to a custom Dockerfile for one binary with a CGO dependency, which is supported but not documented especially well." },
      ],
    },
    {
      id: "harborlite",
      name: "Harborlite",
      tagline: "A self-hosted PaaS that turns any VPS into a proper deploy target.",
      description:
        "Harborlite is a single binary you install on a server you already pay for. It gives you the parts of a managed platform that matter — git-push builds, TLS certificates, health checks, zero-downtime restarts and a web dashboard — without the per-seat pricing or the vendor relationship. It speaks Dockerfiles and Buildpacks, stores its state in SQLite, and can manage a fleet of machines from one control plane once you outgrow the first one.",
      category: "deployment",
      tags: ["self-hosted", "open-source", "docker", "vps", "buildpacks", "free-tier", "cli"],
      pricing: "free",
      priceFrom: 0,
      priceNote: "Open source (Apache 2.0) · Paid support available",
      rating: 4.6,
      ratingCount: 318,
      votes: 1685,
      featured: false,
      sponsored: false,
      verified: true,
      added: "2025-11-04",
      launched: 2022,
      url: "https://harborlite.example.com",
      platforms: ["Linux", "CLI", "Web dashboard"],
      mark: { shape: "anchor", from: "#0f6f8c", to: "#38bdf8" },
      highlights: [
        "One binary, one command, no Kubernetes anywhere in sight",
        "Automatic TLS via ACME with wildcard support",
        "Zero-downtime restarts with configurable health checks",
        "Runs comfortably on a 1 GB instance",
      ],
      specs: [
        ["Licence", "Apache 2.0"],
        ["Install", "Single static binary (~28 MB)"],
        ["State store", "SQLite, file-backed"],
        ["Build systems", "Dockerfile, Cloud Native Buildpacks"],
        ["Multi-server", "Yes, from v3.0"],
        ["Minimum host", "1 vCPU / 1 GB RAM"],
      ],
      gallery: [
        { kind: "dashboard", caption: "Fleet overview across four self-hosted nodes" },
        { kind: "terminal", caption: "Installing the control plane on a fresh VPS" },
        { kind: "table", caption: "Per-application health and restart history" },
      ],
      plans: [
        { name: "Self-hosted", price: "$0", period: "forever", note: "Apache 2.0", features: ["All features", "Unlimited servers", "Community Discord"], popular: true },
        { name: "Supported", price: "$99", period: "per month", note: "For production teams", features: ["Same software", "4-hour response SLA", "Upgrade assistance"] },
      ],
      reviews: [
        { author: "Tomas Břetislav", role: "Infrastructure consultant", rating: 5, date: "2026-02-01", title: "Replaced a €600/mo bill", body: "Three client projects moved from a managed host onto two mid-size VPS instances. Same workflow for the developers, roughly a tenth of the cost." },
        { author: "Aisha Nkemdirim", role: "CTO, Rowanpost", rating: 4, date: "2025-12-11", title: "Excellent, with the usual caveat", body: "It genuinely does what a managed platform does. You are still the one who gets paged when the disk fills up, which is the entire trade you are making." },
        { author: "Lucas Fiore", role: "Full-stack developer", rating: 5, date: "2025-10-28", title: "The SQLite decision is inspired", body: "No external database to run for the control plane means backing the whole thing up is a file copy. More projects should be built this way." },
      ],
    },
    {
      id: "ridgeway",
      name: "Ridgeway",
      tagline: "Multi-region edge deploys with automatic failover and traffic shaping.",
      description:
        "Ridgeway runs your application in every region you enable and routes each request to the healthiest nearby instance. Failover is handled at the network layer, so a region going dark is a latency event rather than an outage. Traffic shaping lets you move a percentage of requests onto a new release, watch the error rate, and either continue the rollout or abandon it — all without touching DNS.",
      category: "deployment",
      tags: ["edge", "multi-region", "canary-releases", "failover", "latency", "cli"],
      pricing: "paid",
      priceFrom: 39,
      priceNote: "From $39/mo, usage-based above 1M requests",
      rating: 4.4,
      ratingCount: 176,
      votes: 742,
      featured: false,
      sponsored: false,
      verified: false,
      added: "2026-02-17",
      launched: 2023,
      url: "https://ridgeway.example.com",
      platforms: ["Web", "CLI", "Terraform provider"],
      mark: { shape: "peaks", from: "#7c3f12", to: "#f59e0b" },
      highlights: [
        "Health-aware routing across up to 22 regions",
        "Percentage-based canary rollouts with automatic abort",
        "Region failover measured in hundreds of milliseconds",
        "First-class Terraform provider for infrastructure teams",
      ],
      specs: [
        ["Regions", "22"],
        ["Cold start", "~40 ms for a warmed image"],
        ["Traffic shaping", "1% granularity, header and geo rules"],
        ["Failover", "Automatic, sub-second"],
        ["Included requests", "1M per month"],
        ["Compliance", "SOC 2 Type II"],
      ],
      gallery: [
        { kind: "chart", caption: "p95 latency by region before and after rollout" },
        { kind: "dashboard", caption: "Canary release at 10% with live error rate" },
        { kind: "table", caption: "Region health and traffic distribution" },
      ],
      plans: [
        { name: "Starter", price: "$39", period: "per month", note: "3 regions", features: ["1M requests", "Canary rollouts", "Email support"] },
        { name: "Growth", price: "$149", period: "per month", note: "All regions", features: ["10M requests", "Traffic shaping rules", "99.99% SLA"], popular: true },
        { name: "Scale", price: "Custom", period: "annual", note: "Committed usage", features: ["Volume pricing", "Private interconnect", "Named engineer"] },
      ],
      reviews: [
        { author: "Hannah Vogt", role: "SRE, Northbeam Logistics", rating: 5, date: "2026-03-02", title: "Failover we could actually test", body: "We ran a game day, pulled a region, and watched traffic drain in about 400 ms. That was the whole evaluation, honestly." },
        { author: "Ravi Sundaram", role: "Engineering manager", rating: 4, date: "2026-01-14", title: "Powerful but priced for teams", body: "The canary tooling is the best I have used. It is not a hobby-project budget, and the docs assume you know your networking." },
        { author: "Elin Karlsson", role: "Backend developer", rating: 4, date: "2025-11-22", title: "Terraform provider is complete", body: "Rare to find one that covers every resource on day one. Everything we needed was declarable." },
      ],
    },

    /* ------------------------------------------------------- observability */
    {
      id: "sightglass",
      name: "Sightglass",
      tagline: "Traces, logs and metrics on one queryable timeline.",
      description:
        "Sightglass takes OpenTelemetry data and stops treating the three signals as separate products. A slow trace links to the exact log lines it produced and to the host metrics from that minute, on one timeline you can scrub through. Queries are written in a small SQL-like language that autocompletes against your actual attributes, and any query can become an alert without being rewritten.",
      category: "observability",
      tags: ["opentelemetry", "tracing", "logs", "metrics", "alerting", "free-tier", "cli"],
      pricing: "freemium",
      priceFrom: 0,
      priceNote: "50 GB/mo free · $0.28/GB after",
      rating: 4.7,
      ratingCount: 402,
      votes: 1893,
      featured: true,
      sponsored: false,
      verified: true,
      added: "2026-01-09",
      launched: 2021,
      url: "https://sightglass.example.com",
      platforms: ["Web", "OTLP", "CLI", "Grafana plugin"],
      mark: { shape: "lens", from: "#155e75", to: "#22d3ee" },
      highlights: [
        "One timeline correlating traces, logs and host metrics",
        "Standard OTLP ingest — no proprietary agent required",
        "Any saved query can become an alert in one click",
        "Tail-based sampling that always keeps errors and slow spans",
      ],
      specs: [
        ["Ingest protocol", "OTLP (gRPC and HTTP)"],
        ["Retention", "30 days traces, 90 days metrics"],
        ["Query language", "SQL-like, with attribute autocomplete"],
        ["Sampling", "Head and tail-based"],
        ["Free tier", "50 GB per month"],
        ["Integrations", "PagerDuty, Slack, webhook, Pagerbell"],
      ],
      gallery: [
        { kind: "chart", caption: "Latency distribution with the slow tail selected" },
        { kind: "dashboard", caption: "A single trace correlated with its log lines" },
        { kind: "table", caption: "Top endpoints by error rate this hour" },
      ],
      plans: [
        { name: "Free", price: "$0", period: "forever", note: "50 GB/mo", features: ["30-day retention", "3 users", "Community support"] },
        { name: "Team", price: "$0.28", period: "per GB ingested", note: "No seat charges", features: ["Unlimited users", "Tail sampling", "Alert routing"], popular: true },
        { name: "Enterprise", price: "Custom", period: "annual", note: "Volume commitment", features: ["Custom retention", "SSO and SCIM", "Dedicated support"] },
      ],
      reviews: [
        { author: "Jonas Weibel", role: "Staff engineer, Cindermill", rating: 5, date: "2026-02-21", title: "Per-GB, not per-seat", body: "Being able to give the whole company logins without the bill moving changed how we run incidents. Everyone can look now." },
        { author: "Nadia Osei", role: "SRE lead", rating: 5, date: "2026-01-27", title: "Correlation is the whole product", body: "Jumping from a slow span straight to the log lines that span emitted removes the worst twenty minutes of every investigation." },
        { author: "Ben Halloran", role: "Backend developer", rating: 4, date: "2025-12-05", title: "Query language takes a week", body: "It is closer to SQL than PromQL, which I prefer, but there is still a learning curve. The autocomplete carries you through it." },
      ],
    },
    {
      id: "pagerbell",
      name: "Pagerbell",
      tagline: "On-call scheduling and incident comms without the enterprise tax.",
      description:
        "Pagerbell handles rotations, escalation policies, overrides and the actual phone call at three in the morning. Incidents get a dedicated channel, a running timeline that captures who did what, and a post-incident document that writes its own first draft from that timeline. Pricing is per responder rather than per user, so the people who only read the incident report do not appear on your invoice.",
      category: "observability",
      tags: ["on-call", "incident-response", "escalation", "postmortems", "slack", "free-tier"],
      pricing: "freemium",
      priceFrom: 0,
      priceNote: "Free for 5 responders · $9/responder after",
      rating: 4.5,
      ratingCount: 267,
      votes: 1104,
      featured: false,
      sponsored: false,
      verified: true,
      added: "2025-12-15",
      launched: 2022,
      url: "https://pagerbell.example.com",
      platforms: ["Web", "iOS", "Android", "Slack", "Microsoft Teams"],
      mark: { shape: "bell", from: "#9a3412", to: "#fb923c" },
      highlights: [
        "Rotations, overrides and escalation policies that are readable",
        "Incident timeline assembled automatically from activity",
        "Post-incident review drafted from the timeline",
        "Billed per responder, not per person with an account",
      ],
      specs: [
        ["Notification channels", "Phone, SMS, push, email, Slack, Teams"],
        ["Escalation levels", "Unlimited"],
        ["Schedule types", "Weekly, follow-the-sun, custom rotation"],
        ["Status page", "Included, custom domain on paid plans"],
        ["Free tier", "5 responders"],
        ["Alert sources", "Sightglass, Emberlog, Prometheus, webhook"],
      ],
      gallery: [
        { kind: "dashboard", caption: "Current rotation with upcoming overrides" },
        { kind: "table", caption: "Incident timeline with automatic annotations" },
        { kind: "chart", caption: "Mean time to acknowledge over six months" },
      ],
      plans: [
        { name: "Free", price: "$0", period: "forever", note: "5 responders", features: ["Push and email alerts", "1 schedule", "Basic status page"] },
        { name: "Standard", price: "$9", period: "per responder / month", note: "Most teams", features: ["Phone and SMS", "Unlimited schedules", "Postmortem drafts"], popular: true },
        { name: "Business", price: "$19", period: "per responder / month", note: "Compliance-minded", features: ["SSO", "Audit log", "Custom escalation SLAs"] },
      ],
      reviews: [
        { author: "Claire Bouchard", role: "Head of engineering, Verdance", rating: 5, date: "2026-02-12", title: "Per-responder pricing is honest", body: "We have forty engineers and eight on the rotation. We pay for eight. It is astonishing how rare that is." },
        { author: "Yusuf Demirci", role: "DevOps engineer", rating: 4, date: "2026-01-06", title: "Postmortem drafts save real time", body: "The generated first draft is about seventy per cent there, which is exactly the seventy per cent nobody wants to write." },
        { author: "Sara Lindqvist", role: "Platform engineer", rating: 4, date: "2025-11-18", title: "Mobile app needs polish", body: "Alerting is reliable and the escalation logic is solid. The Android app has been slower to improve than the web experience." },
      ],
    },
    {
      id: "emberlog",
      name: "Emberlog",
      tagline: "Structured log search that stays fast at a billion lines.",
      description:
        "Emberlog is a log store built around the assumption that you will search it while something is on fire. Ingest is schema-on-read, so you send whatever JSON you already emit; the query engine builds sparse indexes as data lands and keeps full-text search under a second across a billion events. Live tail streams matching lines as they arrive, and any search can be pinned to a dashboard or turned into a threshold alert.",
      category: "observability",
      tags: ["logs", "search", "live-tail", "structured-logging", "retention", "cli", "self-hosted"],
      pricing: "paid",
      priceFrom: 25,
      priceNote: "From $25/mo for 100 GB retained",
      rating: 4.3,
      ratingCount: 143,
      votes: 596,
      featured: false,
      sponsored: false,
      verified: false,
      added: "2026-02-25",
      launched: 2023,
      url: "https://emberlog.example.com",
      platforms: ["Web", "CLI", "Fluent Bit", "Vector"],
      mark: { shape: "flame", from: "#b91c1c", to: "#fb7185" },
      highlights: [
        "Sub-second full-text search across a billion events",
        "Schema-on-read ingest — send the JSON you already have",
        "Live tail with the same filters as historical search",
        "Retention configured per stream, not per account",
      ],
      specs: [
        ["Ingest", "HTTP, Fluent Bit, Vector, syslog"],
        ["Indexing", "Sparse, built at ingest"],
        ["Search latency", "<1s p95 at 1B events"],
        ["Retention", "7 to 400 days, per stream"],
        ["Export", "S3-compatible archive"],
        ["Alerting", "Threshold and absence"],
      ],
      gallery: [
        { kind: "terminal", caption: "Live tail filtered to a single request id" },
        { kind: "table", caption: "Structured fields extracted at query time" },
        { kind: "chart", caption: "Log volume by service and severity" },
      ],
      plans: [
        { name: "Starter", price: "$25", period: "per month", note: "100 GB retained", features: ["30-day retention", "Live tail", "5 users"] },
        { name: "Pro", price: "$95", period: "per month", note: "500 GB retained", features: ["Custom retention", "S3 archive", "Unlimited users"], popular: true },
        { name: "Archive+", price: "$240", period: "per month", note: "2 TB retained", features: ["400-day retention", "Priority ingest", "Phone support"] },
      ],
      reviews: [
        { author: "Miguel Ferreira", role: "Backend lead, Halcyon Retail", rating: 5, date: "2026-03-05", title: "Fast when it counts", body: "Searched eleven months of logs mid-incident and got results before I finished explaining the query to a colleague." },
        { author: "Anya Petrova", role: "Software engineer", rating: 4, date: "2026-01-19", title: "Per-stream retention is smart", body: "Keeping audit logs for a year and debug logs for a week on the same account is the flexibility everyone needs and few vendors offer." },
        { author: "Callum Reid", role: "DevOps", rating: 4, date: "2025-12-28", title: "Dashboards are basic", body: "Search is genuinely excellent. The dashboard builder feels like a version one, so we still visualise elsewhere." },
      ],
    },

    /* ----------------------------------------------------------- databases */
    {
      id: "cobaltdb",
      name: "Cobaltdb",
      tagline: "Serverless Postgres with branching that feels like Git.",
      description:
        "Cobaltdb separates storage from compute so a database branch is a copy-on-write pointer rather than a dump and restore. Branch production, run your migration against real data volumes, open the pull request with a connection string attached, and throw the branch away when it merges. Compute scales to zero between requests, so a preview branch that nobody visits costs nothing, and a connection pooler sits in front so serverless functions do not exhaust your connection limit.",
      category: "databases",
      tags: ["postgres", "serverless", "branching", "migrations", "scale-to-zero", "free-tier", "cli"],
      pricing: "freemium",
      priceFrom: 0,
      priceNote: "Free tier with 10 branches · Pro from $29/mo",
      rating: 4.9,
      ratingCount: 731,
      votes: 3420,
      featured: true,
      sponsored: true,
      verified: true,
      added: "2026-03-01",
      launched: 2020,
      url: "https://cobaltdb.example.com",
      platforms: ["Web", "CLI", "GitHub App", "Terraform", "Vercel"],
      mark: { shape: "layers", from: "#1d4ed8", to: "#60a5fa" },
      highlights: [
        "Copy-on-write branches created in about 300 ms",
        "Compute scales to zero — idle branches cost nothing",
        "Point-in-time restore to any second in the retention window",
        "Built-in pooler sized for serverless connection churn",
      ],
      specs: [
        ["Engine", "PostgreSQL 15, 16 and 17"],
        ["Branch creation", "~300 ms, copy-on-write"],
        ["Scale to zero", "Yes, after 5 minutes idle"],
        ["Point-in-time restore", "30 days on Pro"],
        ["Max storage", "4 TB per project"],
        ["Extensions", "pgvector, PostGIS, pg_cron, 60+ others"],
      ],
      gallery: [
        { kind: "dashboard", caption: "Branch tree with a migration running on a preview" },
        { kind: "terminal", caption: "Creating a branch and connecting from the CLI" },
        { kind: "chart", caption: "Compute usage showing scale-to-zero between bursts" },
      ],
      plans: [
        { name: "Free", price: "$0", period: "forever", note: "10 branches", features: ["0.5 GB storage", "Scale to zero", "7-day restore"] },
        { name: "Pro", price: "$29", period: "per month", note: "Most popular", features: ["Unlimited branches", "30-day restore", "Autoscaling compute"], popular: true },
        { name: "Business", price: "$149", period: "per month", note: "Production workloads", features: ["Private networking", "SOC 2 report", "99.99% SLA"] },
      ],
      reviews: [
        { author: "Iris Nakamura", role: "Principal engineer, Foldwork", rating: 5, date: "2026-03-11", title: "Branching changed our review process", body: "Every pull request now carries a database with production-shaped data. Migration bugs that used to reach staging are caught by the author." },
        { author: "Karl Adeyemi", role: "Founder, Threadmark", rating: 5, date: "2026-02-18", title: "Scale to zero is the reason we could ship", body: "Forty preview environments cost us almost nothing because none of them are awake. On a fixed-instance host this would have been unaffordable." },
        { author: "Sofia Marchetti", role: "Data engineer", rating: 5, date: "2026-01-24", title: "It is just Postgres", body: "No dialect quirks, no missing extensions. Our existing tooling connected without a single change, which is not something I expected." },
      ],
    },
    {
      id: "tidewater",
      name: "Tidewater",
      tagline: "Embedded vector search you can ship inside your binary.",
      description:
        "Tidewater is a vector index that runs in-process. There is no server to deploy, no cluster to size and no network hop between your application and its embeddings — you link a library, point it at a file and query it. It handles hundreds of millions of vectors on a single machine with an on-disk HNSW index, supports metadata filtering during the search rather than after it, and keeps memory use predictable enough to run alongside your application.",
      category: "databases",
      tags: ["vector-search", "embedded", "open-source", "rag", "hnsw", "free-tier"],
      pricing: "free",
      priceFrom: 0,
      priceNote: "Open source (MIT) · No hosted tier",
      rating: 4.6,
      ratingCount: 209,
      votes: 1372,
      featured: false,
      sponsored: false,
      verified: true,
      added: "2025-10-30",
      launched: 2023,
      url: "https://tidewater.example.com",
      platforms: ["Rust", "Python", "Go", "Node", "WASM"],
      mark: { shape: "wave", from: "#0e7490", to: "#5eead4" },
      highlights: [
        "Runs in-process — no server, no cluster, no network hop",
        "Metadata filters applied during traversal, not after",
        "On-disk index keeps memory flat as the corpus grows",
        "Compiles to WASM, so it runs in the browser too",
      ],
      specs: [
        ["Licence", "MIT"],
        ["Index type", "HNSW, on-disk with memory-mapped pages"],
        ["Scale", "~250M vectors per node"],
        ["Bindings", "Rust, Python, Go, Node, WASM"],
        ["Distance metrics", "Cosine, dot product, L2"],
        ["Quantisation", "Scalar and binary"],
      ],
      gallery: [
        { kind: "terminal", caption: "Building an index from a Parquet file" },
        { kind: "chart", caption: "Recall against latency at three quantisation levels" },
        { kind: "table", caption: "Filtered search results with metadata columns" },
      ],
      plans: [
        { name: "Open source", price: "$0", period: "forever", note: "MIT licence", features: ["Every feature", "All bindings", "GitHub issues"], popular: true },
      ],
      reviews: [
        { author: "Ola Sørensen", role: "ML engineer, Brightsill", rating: 5, date: "2026-02-04", title: "Deleted an entire service", body: "We were running a vector database cluster for four million documents. It is now a file next to the binary and queries got faster." },
        { author: "Grace Okonkwo", role: "Search engineer", rating: 4, date: "2025-12-22", title: "Filtering during traversal matters", body: "Post-filtering wrecks recall when your filters are selective. Doing it inside the search is the reason we switched." },
        { author: "Henrik Lund", role: "Staff engineer", rating: 5, date: "2025-11-09", title: "Documentation is unusually good", body: "The tuning guide explains the recall trade-offs honestly instead of quoting one benchmark. Rare and appreciated." },
      ],
    },
    {
      id: "slatestore",
      name: "Slatestore",
      tagline: "S3-compatible object storage with egress you can predict.",
      description:
        "Slatestore is object storage for teams tired of discovering their bandwidth bill after the fact. The API is S3-compatible, so existing SDKs and tools work unchanged, but egress is included up to a generous multiple of stored data rather than metered per gigabyte. Objects can be served straight from an edge cache with signed URLs, lifecycle rules move cold data to cheaper tiers automatically, and every bucket can be replicated to a second region with one setting.",
      category: "databases",
      tags: ["object-storage", "s3-compatible", "cdn", "backups", "lifecycle", "cli", "self-hosted"],
      pricing: "paid",
      priceFrom: 6,
      priceNote: "$6/TB stored, egress included",
      rating: 4.2,
      ratingCount: 98,
      votes: 431,
      featured: false,
      sponsored: false,
      verified: false,
      added: "2026-02-06",
      launched: 2022,
      url: "https://slatestore.example.com",
      platforms: ["S3 API", "Web", "CLI", "rclone"],
      mark: { shape: "cube", from: "#3f3f46", to: "#a1a1aa" },
      highlights: [
        "Egress included up to 10× stored volume, then flat-rate",
        "Drop-in S3 API — existing SDKs need only an endpoint change",
        "Edge cache with signed URLs on every bucket",
        "Cross-region replication as a single toggle",
      ],
      specs: [
        ["API", "S3-compatible (v4 signatures)"],
        ["Storage price", "$6 per TB per month"],
        ["Egress", "10× stored volume included"],
        ["Durability", "11 nines, 3 replicas"],
        ["Regions", "6"],
        ["Max object size", "5 TB"],
      ],
      gallery: [
        { kind: "table", caption: "Bucket browser with lifecycle rules applied" },
        { kind: "chart", caption: "Storage and egress trend for the current month" },
        { kind: "terminal", caption: "Syncing a bucket with the standard AWS CLI" },
      ],
      plans: [
        { name: "Pay as you go", price: "$6", period: "per TB / month", note: "No minimum", features: ["Included egress", "Edge cache", "Email support"], popular: true },
        { name: "Committed", price: "$4.50", period: "per TB / month", note: "50 TB commitment", features: ["Lower rate", "Replication included", "Priority support"] },
      ],
      reviews: [
        { author: "Peter Åkerlund", role: "Backend developer, Mossline", rating: 5, date: "2026-03-08", title: "Predictable is worth paying for", body: "Our old provider charged us more for bandwidth than storage during a traffic spike. This bill is boring, which is the point." },
        { author: "Deniz Yalçın", role: "Technical lead", rating: 4, date: "2026-01-11", title: "Drop-in really was drop-in", body: "Changed the endpoint in our config and ran the test suite. Nothing else needed touching." },
        { author: "Rosa Villalba", role: "DevOps engineer", rating: 3, date: "2025-12-02", title: "Console is a bit thin", body: "The storage itself is solid. The web console lacks bulk operations that the CLI handles fine, so we mostly avoid it." },
      ],
    },

    /* ---------------------------------------------------------------- auth */
    {
      id: "keyring-labs",
      name: "Keyring Labs",
      tagline: "Drop-in auth with passkeys, SSO and organisation management.",
      description:
        "Keyring Labs covers the whole authentication surface a B2B product eventually needs: passkeys and passwords, social providers, magic links, SAML and OIDC for enterprise customers, and the organisation model — invitations, roles, domain capture — that teams usually rebuild badly on top of a simpler auth library. The hosted pages can be themed to match your product, or you can ignore them entirely and drive everything through the API.",
      category: "auth",
      tags: ["passkeys", "sso", "saml", "multi-tenant", "rbac", "free-tier", "self-hosted"],
      pricing: "freemium",
      priceFrom: 0,
      priceNote: "Free to 10,000 MAU · $0.02/MAU after",
      rating: 4.7,
      ratingCount: 388,
      votes: 1620,
      featured: false,
      sponsored: false,
      verified: true,
      added: "2025-12-01",
      launched: 2021,
      url: "https://keyringlabs.example.com",
      platforms: ["Web", "React", "Vue", "Svelte", "REST API", "iOS", "Android"],
      mark: { shape: "key", from: "#7c2d12", to: "#fbbf24" },
      highlights: [
        "Passkeys as a first-class method, not a bolted-on extra",
        "SAML and OIDC included on the standard plan",
        "Organisations, invitations and roles handled for you",
        "Hosted pages you can theme, or a headless API",
      ],
      specs: [
        ["Methods", "Passkeys, password, magic link, OAuth, SAML, OIDC"],
        ["Free tier", "10,000 monthly active users"],
        ["Multi-tenancy", "Organisations with roles and invitations"],
        ["Session model", "JWT or opaque, configurable"],
        ["SDKs", "React, Vue, Svelte, Node, Python, Go"],
        ["Compliance", "SOC 2 Type II, GDPR, HIPAA available"],
      ],
      gallery: [
        { kind: "dashboard", caption: "Organisation members with role assignments" },
        { kind: "terminal", caption: "Verifying a session token server-side" },
        { kind: "table", caption: "Enterprise SSO connections per customer" },
      ],
      plans: [
        { name: "Free", price: "$0", period: "forever", note: "10k MAU", features: ["All auth methods", "1 organisation", "Community support"] },
        { name: "Pro", price: "$0.02", period: "per MAU / month", note: "SSO included", features: ["Unlimited orgs", "SAML and OIDC", "Custom domains"], popular: true },
        { name: "Enterprise", price: "Custom", period: "annual", note: "Regulated industries", features: ["HIPAA BAA", "Data residency", "Dedicated support"] },
      ],
      reviews: [
        { author: "Théo Lemoine", role: "Founder, Quarryhill", rating: 5, date: "2026-02-27", title: "SSO without an upgrade call", body: "Most competitors put SAML behind an enterprise plan. Having it on the standard tier is why we won a deal in March." },
        { author: "Amara Sithole", role: "Frontend engineer", rating: 5, date: "2026-01-16", title: "Passkeys took an afternoon", body: "The React SDK handled the whole ceremony including the fallbacks. I expected two days of WebAuthn misery." },
        { author: "Jasper Coen", role: "Security engineer", rating: 4, date: "2025-11-30", title: "Solid, watch the MAU definition", body: "Excellent product. Read the billing docs carefully — a monthly active user is counted more broadly than you might assume." },
      ],
    },
    {
      id: "gatepost",
      name: "Gatepost",
      tagline: "Open-source authorization modelled on Google's Zanzibar paper.",
      description:
        "Gatepost answers one question extremely fast: can this subject perform this action on this resource? Permissions are expressed as relationships in a schema rather than as roles hard-coded through your controllers, which means nested groups, per-project access and resource sharing stop being special cases. It ships as a single service with a gRPC and HTTP API, keeps a consistency token so you never read a stale permission after a write, and is genuinely open source rather than open-core.",
      category: "auth",
      tags: ["authorization", "zanzibar", "rbac", "open-source", "fine-grained", "free-tier", "self-hosted"],
      pricing: "free",
      priceFrom: 0,
      priceNote: "Open source (Apache 2.0) · Cloud tier in beta",
      rating: 4.5,
      ratingCount: 221,
      votes: 1188,
      featured: false,
      sponsored: false,
      verified: true,
      added: "2025-09-18",
      launched: 2022,
      url: "https://gatepost.example.com",
      platforms: ["Docker", "Kubernetes", "gRPC", "HTTP API"],
      mark: { shape: "shield", from: "#166534", to: "#86efac" },
      highlights: [
        "Relationship-based permissions instead of scattered role checks",
        "Consistency tokens prevent stale reads after a permission change",
        "Sub-5 ms checks at p99 with a warm cache",
        "Apache 2.0 with no feature held back for a paid tier",
      ],
      specs: [
        ["Licence", "Apache 2.0"],
        ["Model", "Relationship-based (Zanzibar)"],
        ["Check latency", "<5 ms p99, warm"],
        ["Storage", "Postgres, CockroachDB, in-memory"],
        ["APIs", "gRPC and HTTP/JSON"],
        ["Schema tooling", "Playground, test framework, migrations"],
      ],
      gallery: [
        { kind: "terminal", caption: "Defining a schema and running permission tests" },
        { kind: "dashboard", caption: "Relationship explorer for a shared document" },
        { kind: "chart", caption: "Check latency under load with cache warm and cold" },
      ],
      plans: [
        { name: "Self-hosted", price: "$0", period: "forever", note: "Apache 2.0", features: ["Every feature", "Unlimited checks", "Community support"], popular: true },
        { name: "Cloud (beta)", price: "$0.10", period: "per 10k checks", note: "Managed", features: ["Hosted and scaled", "Regional replicas", "Email support"] },
      ],
      reviews: [
        { author: "Ingrid Bauer", role: "Architect, Palisade Systems", rating: 5, date: "2026-02-14", title: "Finally a model that fits sharing", body: "Our permission logic had grown into a four-hundred-line function. Expressing it as relationships shrank it to a schema file we can actually reason about." },
        { author: "Noah Feinberg", role: "Backend engineer", rating: 4, date: "2026-01-03", title: "Powerful, genuinely a learning curve", body: "Zanzibar concepts take a week to click. Once they do, you stop wanting to model permissions any other way." },
        { author: "Leyla Aydın", role: "Principal engineer", rating: 5, date: "2025-10-21", title: "Real open source", body: "No enterprise features held hostage. The test framework for permission schemas is better than most commercial tooling." },
      ],
    },
    {
      id: "vaultwing",
      name: "Vaultwing",
      tagline: "Secrets management with per-environment scoping and short-lived tokens.",
      description:
        "Vaultwing stores the credentials your services need and hands them out as short-lived, narrowly scoped tokens rather than long-lived strings pasted into a dashboard. Secrets are organised by project and environment with inheritance, so a staging value can override a shared default without duplication. Every read is logged with the identity that made it, rotation can be scheduled or triggered by a webhook, and a local agent injects values into your process environment without ever writing them to disk.",
      category: "auth",
      tags: ["secrets", "rotation", "audit-log", "environments", "compliance", "cli"],
      pricing: "paid",
      priceFrom: 15,
      priceNote: "From $15/mo for 5 users",
      rating: 4.4,
      ratingCount: 156,
      votes: 623,
      featured: false,
      sponsored: false,
      verified: false,
      added: "2026-01-31",
      launched: 2023,
      url: "https://vaultwing.example.com",
      platforms: ["CLI", "Web", "Kubernetes operator", "GitHub Actions"],
      mark: { shape: "vault", from: "#3730a3", to: "#818cf8" },
      highlights: [
        "Short-lived scoped tokens instead of long-lived secrets",
        "Environment inheritance with per-environment overrides",
        "Every read attributed in a tamper-evident audit log",
        "Local agent injects values without touching the filesystem",
      ],
      specs: [
        ["Token lifetime", "Configurable, 60s to 24h"],
        ["Inheritance", "Project → environment → service"],
        ["Rotation", "Scheduled or webhook-triggered"],
        ["Audit log", "Tamper-evident, exportable"],
        ["Integrations", "Kubernetes, GitHub Actions, Terraform, Docker"],
        ["Compliance", "SOC 2 Type II"],
      ],
      gallery: [
        { kind: "table", caption: "Secrets by environment with inherited values marked" },
        { kind: "terminal", caption: "Running a process with injected credentials" },
        { kind: "dashboard", caption: "Audit trail filtered to a single secret" },
      ],
      plans: [
        { name: "Team", price: "$15", period: "per month", note: "Up to 5 users", features: ["Unlimited secrets", "Audit log", "CLI and agent"] },
        { name: "Business", price: "$8", period: "per user / month", note: "6+ users", features: ["SSO", "Scheduled rotation", "Kubernetes operator"], popular: true },
        { name: "Enterprise", price: "Custom", period: "annual", note: "Regulated", features: ["HSM-backed keys", "Data residency", "Named engineer"] },
      ],
      reviews: [
        { author: "Fiona Kelleher", role: "Security lead, Ambergate", rating: 5, date: "2026-03-04", title: "Short-lived tokens by default", body: "The default being a sixty-minute token rather than a permanent string removed most of our credential-sprawl problem in a fortnight." },
        { author: "Dmitri Volkov", role: "Platform engineer", rating: 4, date: "2026-02-09", title: "Inheritance saves duplication", body: "We were maintaining the same forty variables across four environments. Now we maintain the differences." },
        { author: "Naomi Bergström", role: "SRE", rating: 4, date: "2025-12-16", title: "Agent is excellent, docs are terse", body: "The injection agent is the best part and gets about a page of documentation. Worth the trial-and-error, but only just." },
      ],
    },

    /* ---------------------------------------------------------- devtools */
    {
      id: "loomstack",
      name: "Loomstack",
      tagline: "One checked-in file that gives every developer an identical environment.",
      description:
        "Loomstack replaces the onboarding document with a manifest. It pins language versions, system libraries and background services per project, then builds that environment reproducibly on macOS and Linux without touching the rest of the machine. Environments activate when you enter the directory and deactivate when you leave, so two projects on incompatible runtimes stop being a scheduling problem. Everything resolves from a lockfile, which means the environment a new hire gets in March is the environment CI used in January.",
      category: "devtools",
      tags: ["reproducible-builds", "onboarding", "environments", "lockfile", "cross-platform", "free-tier", "cli"],
      pricing: "freemium",
      priceFrom: 0,
      priceNote: "Free for individuals · Teams from $12/user/mo",
      rating: 4.7,
      ratingCount: 421,
      votes: 1893,
      featured: true,
      sponsored: false,
      verified: true,
      added: "2026-02-03",
      launched: 2022,
      url: "https://loomstack.example.com",
      platforms: ["macOS", "Linux", "CLI", "GitHub Actions"],
      mark: { shape: "prism", from: "#6d28d9", to: "#c4b5fd" },
      highlights: [
        "One manifest pins languages, libraries and services together",
        "Environments activate and deactivate per directory automatically",
        "Byte-identical resolution from a committed lockfile",
        "Same environment locally and in CI, no second configuration",
      ],
      specs: [
        ["Platforms", "macOS (Intel, Apple silicon), Linux x86_64 and ARM"],
        ["Languages", "40+ runtimes via the package index"],
        ["Services", "Postgres, MySQL, Redis, Kafka, MinIO and others"],
        ["Isolation", "Per-project, no global state mutated"],
        ["Cold setup", "Around 90 seconds on a fresh machine"],
        ["CI support", "First-party action with layer caching"],
      ],
      gallery: [
        { kind: "terminal", caption: "Entering a directory activates its environment" },
        { kind: "table", caption: "Resolved package versions from the lockfile" },
        { kind: "dashboard", caption: "Team view of environment drift across projects" },
      ],
      plans: [
        { name: "Individual", price: "$0", period: "forever", note: "Unlimited projects", features: ["All runtimes", "Local caching", "Community support"] },
        { name: "Team", price: "$12", period: "per user / month", note: "Most popular", features: ["Shared binary cache", "Drift reporting", "Private package index"], popular: true },
        { name: "Enterprise", price: "Custom", period: "annual", note: "Regulated teams", features: ["Air-gapped mirror", "SBOM export", "Named engineer"] },
      ],
      reviews: [
        { author: "Sofia Marchetti", role: "Staff engineer, Vantagepoint", rating: 5, date: "2026-03-06", title: "Onboarding went from two days to an hour", body: "New engineers used to spend their first day fighting native extensions. Now they clone the repository, run one command and open a pull request before lunch." },
        { author: "Callum Reid", role: "Developer experience lead", rating: 5, date: "2026-01-27", title: "Killed 'works on my machine' outright", body: "CI and local now resolve from the same lockfile. We have not had an environment-only failure since we migrated in November." },
        { author: "Yuki Tanabe", role: "Backend developer", rating: 4, date: "2025-12-02", title: "Excellent once the cache is warm", body: "The first build on a new machine is slower than I would like. Every one after that is effectively instant, so it evens out." },
      ],
    },
    {
      id: "quayside",
      name: "Quayside",
      tagline: "Start your whole stack with one command and readable logs.",
      description:
        "Quayside is a process orchestrator for local development. You describe the processes your application needs — an API, a worker, a database, a bundler — along with what each one depends on and how to tell when it is genuinely ready, and Quayside starts them in the right order. Logs are multiplexed into one colour-coded stream you can filter by process, and a failing service restarts on its own rather than leaving you with a half-booted stack and no obvious explanation.",
      category: "devtools",
      tags: ["open-source", "process-manager", "local-dev", "logs", "health-checks", "free-tier", "cli", "self-hosted"],
      pricing: "free",
      priceFrom: 0,
      priceNote: "Open source (MIT) · Free forever",
      rating: 4.6,
      ratingCount: 287,
      votes: 1476,
      featured: false,
      sponsored: false,
      verified: true,
      added: "2025-09-18",
      launched: 2021,
      url: "https://quayside.example.com",
      platforms: ["macOS", "Linux", "Windows", "CLI"],
      mark: { shape: "socket", from: "#0f766e", to: "#5eead4" },
      highlights: [
        "Dependency-ordered startup with real readiness probes",
        "One multiplexed log stream, filterable per process",
        "Automatic restart with backoff on crash",
        "Single binary, no daemon left running in the background",
      ],
      specs: [
        ["Licence", "MIT"],
        ["Config", "One YAML file, roughly 20 lines typical"],
        ["Readiness", "TCP, HTTP, log-match or custom command"],
        ["Log output", "Interleaved TTY view or JSON for tooling"],
        ["Binary size", "About 11 MB, no runtime dependency"],
        ["Platforms", "macOS, Linux, Windows"],
      ],
      gallery: [
        { kind: "terminal", caption: "Six processes booting in dependency order" },
        { kind: "dashboard", caption: "Process status with restart counts" },
        { kind: "table", caption: "Readiness probe configuration per service" },
      ],
      plans: [
        { name: "Open source", price: "$0", period: "forever", note: "MIT licensed", features: ["Every feature", "No account required", "Community Discord"], popular: true },
      ],
      reviews: [
        { author: "Andrés Quiroga", role: "Full-stack developer", rating: 5, date: "2026-02-21", title: "Replaced a shell script nobody understood", body: "We had a start script with sleep statements in it that had been copied between four repositories. Twenty lines of config later, it boots correctly every time." },
        { author: "Grace Oyelaran", role: "Engineering manager", rating: 4, date: "2026-01-09", title: "Log filtering is the killer feature", body: "Being able to hide the bundler's chatter and watch only the API is worth the migration on its own. Windows support is slightly behind." },
        { author: "Milos Petrovic", role: "Platform engineer", rating: 5, date: "2025-11-15", title: "Does one thing properly", body: "No dashboard, no telemetry, no account. It starts processes in order and gets out of the way, which is exactly what I wanted." },
      ],
    },
    {
      id: "backscroll",
      name: "Backscroll",
      tagline: "Shell history that remembers context, not just command strings.",
      description:
        "Backscroll records every command with the directory it ran in, the git branch that was checked out, its exit status and how long it took. Searching is fuzzy and instant, and results can be narrowed to the current project or the last failed run. History syncs between machines through an end-to-end encrypted store, so the incantation you worked out on your laptop is available on the server you are debugging from at midnight.",
      category: "devtools",
      tags: ["shell", "history", "search", "sync", "encryption", "free-tier", "self-hosted"],
      pricing: "freemium",
      priceFrom: 0,
      priceNote: "Free local-only · Sync from $4/mo",
      rating: 4.5,
      ratingCount: 634,
      votes: 2317,
      featured: false,
      sponsored: false,
      verified: false,
      added: "2026-01-11",
      launched: 2023,
      url: "https://backscroll.example.com",
      platforms: ["zsh", "bash", "fish", "nushell"],
      mark: { shape: "loop", from: "#334155", to: "#94a3b8" },
      highlights: [
        "Every command stored with directory, branch, exit code and duration",
        "Fuzzy search that returns in single-digit milliseconds",
        "Filter to the current project or to commands that failed",
        "End-to-end encrypted sync across machines",
      ],
      specs: [
        ["Shells", "zsh, bash, fish, nushell"],
        ["Storage", "Local SQLite, optional encrypted sync"],
        ["Search latency", "Under 5 ms on 500k entries"],
        ["Encryption", "XChaCha20-Poly1305, key never leaves your device"],
        ["Import", "From existing shell history files"],
        ["Self-hosting", "Sync server available as a container"],
      ],
      gallery: [
        { kind: "terminal", caption: "Fuzzy searching history filtered to one repository" },
        { kind: "chart", caption: "Command duration trends over a working week" },
        { kind: "table", caption: "Recent failures with exit codes and directories" },
      ],
      plans: [
        { name: "Local", price: "$0", period: "forever", note: "No account", features: ["Full search", "All shells", "Import from history"] },
        { name: "Sync", price: "$4", period: "per month", note: "Most popular", features: ["Encrypted multi-machine sync", "Web search UI", "Unlimited retention"], popular: true },
        { name: "Self-hosted", price: "$0", period: "forever", note: "Bring your own server", features: ["Container image", "Same encryption", "Community support"] },
      ],
      reviews: [
        { author: "Rebecca Lindqvist", role: "Site reliability engineer", rating: 5, date: "2026-03-01", title: "Filtering to failures is inspired", body: "Being able to ask 'what did I run in this repository that exited non-zero' has recovered more lost work than I would like to admit." },
        { author: "Oliver Bankole", role: "Developer", rating: 4, date: "2026-02-05", title: "Fast, and the sync is honest about crypto", body: "Documentation states plainly that the key never leaves the device and explains the scheme. That is rarer than it should be." },
        { author: "Anneke de Vries", role: "Data engineer", rating: 4, date: "2025-12-30", title: "Slight learning curve on the keybindings", body: "Defaults conflicted with two of my existing bindings. Configurable, but I had to read the manual to work out how." },
      ],
    },

    /* -------------------------------------------------------------- apis */
    {
      id: "relayward",
      name: "Relayward",
      tagline: "Webhook infrastructure with signatures, retries and a replay button.",
      description:
        "Relayward sits in front of your webhook endpoints and absorbs the parts nobody enjoys building. Inbound events are signature-verified, deduplicated by idempotency key and queued durably, so a deploy or a slow database becomes a delay rather than lost data. Failed deliveries retry on an exponential schedule and every event is stored with its full payload, which means replaying last Tuesday's batch is a filter and a button rather than a support ticket to your customer.",
      category: "apis",
      tags: ["webhooks", "retries", "idempotency", "replay", "queues", "cli"],
      pricing: "paid",
      priceFrom: 29,
      priceNote: "From $29/mo, includes 1M events",
      rating: 4.7,
      ratingCount: 244,
      votes: 1108,
      featured: true,
      sponsored: true,
      verified: true,
      added: "2026-02-24",
      launched: 2022,
      url: "https://relayward.example.com",
      platforms: ["Web", "REST API", "CLI", "Terraform provider"],
      mark: { shape: "beam", from: "#a21caf", to: "#f0abfc" },
      highlights: [
        "Signature verification and idempotency handled before your code runs",
        "Durable queue absorbs deploys and downstream outages",
        "Full payload retention with one-click replay by filter",
        "Per-endpoint rate limiting and circuit breaking",
      ],
      specs: [
        ["Throughput", "Tested to 20k events/second sustained"],
        ["Retention", "30 days standard, 12 months on Growth"],
        ["Retries", "Exponential backoff, up to 5 days"],
        ["Signatures", "HMAC-SHA256, Ed25519, provider presets"],
        ["Delivery guarantee", "At-least-once with idempotency keys"],
        ["Compliance", "SOC 2 Type II, GDPR data residency in EU"],
      ],
      gallery: [
        { kind: "dashboard", caption: "Delivery success rate by endpoint over 24 hours" },
        { kind: "table", caption: "Event log with status, attempts and payload size" },
        { kind: "chart", caption: "Retry distribution during a downstream outage" },
      ],
      plans: [
        { name: "Starter", price: "$29", period: "per month", note: "1M events", features: ["30-day retention", "Replay", "Email support"] },
        { name: "Growth", price: "$119", period: "per month", note: "Most popular", features: ["10M events", "12-month retention", "Circuit breaking"], popular: true },
        { name: "Scale", price: "Custom", period: "annual", note: "High volume", features: ["Volume pricing", "EU data residency", "99.99% SLA"] },
      ],
      reviews: [
        { author: "Jonas Wexler", role: "Integrations lead, Brightmark", rating: 5, date: "2026-03-09", title: "Replay saved a customer relationship", body: "A bug meant we dropped four hours of events. We filtered to the window, replayed, and the customer never noticed. That feature alone justifies the line item." },
        { author: "Amara Diallo", role: "Backend engineer", rating: 5, date: "2026-02-12", title: "Idempotency done properly", body: "We had built two-thirds of this ourselves and it was the flakiest service we owned. Deleting it was a genuinely good day." },
        { author: "Stefan Novotny", role: "CTO, Loamworks", rating: 4, date: "2026-01-06", title: "Pricing steps are steep", body: "Excellent product. The jump from Starter to Growth is a large one if you are sitting at two million events a month." },
      ],
    },
    {
      id: "specwright",
      name: "Specwright",
      tagline: "One specification that generates your SDKs, docs and mock server.",
      description:
        "Specwright treats your OpenAPI description as the single source of truth and generates everything downstream from it. Client libraries for nine languages, reference documentation with runnable examples, and a mock server that returns schema-valid responses all come from the same file, so they cannot drift apart. Breaking-change detection runs in continuous integration and will fail a pull request that removes a field, which turns API compatibility from a convention into a rule.",
      category: "apis",
      tags: ["openapi", "sdk-generation", "documentation", "mock-server", "versioning", "free-tier", "cli"],
      pricing: "freemium",
      priceFrom: 0,
      priceNote: "Free for public APIs · Pro from $49/mo",
      rating: 4.5,
      ratingCount: 198,
      votes: 867,
      featured: false,
      sponsored: false,
      verified: true,
      added: "2025-12-08",
      launched: 2021,
      url: "https://specwright.example.com",
      platforms: ["CLI", "Web", "GitHub App", "CI plugins"],
      mark: { shape: "brackets", from: "#1e40af", to: "#93c5fd" },
      highlights: [
        "Nine idiomatic SDKs generated from one specification",
        "Reference docs with examples that execute against a mock",
        "Breaking-change detection that fails the pull request",
        "Schema-valid mock server for consumers before you ship",
      ],
      specs: [
        ["Languages", "TypeScript, Python, Go, Ruby, PHP, Java, C#, Rust, Kotlin"],
        ["Spec versions", "OpenAPI 3.0 and 3.1"],
        ["Docs hosting", "Included, custom domain supported"],
        ["Mock server", "Hosted or run locally from the CLI"],
        ["CI integration", "GitHub, GitLab, CircleCI, Buildkite"],
        ["Publishing", "npm, PyPI, Go modules, Maven, NuGet"],
      ],
      gallery: [
        { kind: "table", caption: "Generated SDK versions across nine languages" },
        { kind: "terminal", caption: "Breaking-change check failing on a removed field" },
        { kind: "dashboard", caption: "Documentation traffic by endpoint" },
      ],
      plans: [
        { name: "Open", price: "$0", period: "forever", note: "Public APIs", features: ["3 SDK languages", "Hosted docs", "Community support"] },
        { name: "Pro", price: "$49", period: "per month", note: "Most popular", features: ["All 9 languages", "Private specs", "Breaking-change CI"], popular: true },
        { name: "Business", price: "$199", period: "per month", note: "Multi-API", features: ["Unlimited specs", "Custom domain docs", "Publishing automation"] },
      ],
      reviews: [
        { author: "Helena Broz", role: "API architect, Meridian Freight", rating: 5, date: "2026-02-18", title: "Our clients stopped drifting", body: "The Python and TypeScript SDKs used to be maintained by different people and disagreed about pagination. Now they are generated and identical." },
        { author: "Tunde Adeyemi", role: "Developer advocate", rating: 4, date: "2026-01-20", title: "Docs output is genuinely good", body: "Runnable examples against the mock server cut our support volume noticeably. Theming the docs took longer than expected." },
        { author: "Clara Nyström", role: "Staff engineer", rating: 5, date: "2025-11-29", title: "Breaking-change gate changed our culture", body: "Once removing a field fails CI, people start thinking about deprecation windows. That was worth more than the code generation." },
      ],
    },
    {
      id: "unibridge",
      name: "Unibridge",
      tagline: "One API for the twenty CRMs your sales team keeps promising.",
      description:
        "Unibridge normalises the long tail of business software behind a single schema. Contacts, companies, deals and tickets look the same whether they came from a modern SaaS CRM or a self-hosted system from 2009, and field mappings that do not fit the standard model are exposed rather than silently dropped. Syncs are incremental and bidirectional with conflict rules you configure, and a sandbox with seeded data lets you build the integration before the customer grants access.",
      category: "apis",
      tags: ["unified-api", "crm", "sync", "enterprise", "field-mapping"],
      pricing: "enterprise",
      priceFrom: 0,
      priceNote: "Custom pricing · Typically from $1,200/mo",
      rating: 4.3,
      ratingCount: 89,
      votes: 412,
      featured: false,
      sponsored: false,
      verified: true,
      added: "2026-01-16",
      launched: 2020,
      url: "https://unibridge.example.com",
      platforms: ["REST API", "Webhooks", "Web console", "SDKs"],
      mark: { shape: "mesh", from: "#155e63", to: "#67e8f9" },
      highlights: [
        "One schema across 20+ CRM, ATS and ticketing systems",
        "Non-standard fields surfaced, never silently discarded",
        "Bidirectional incremental sync with configurable conflict rules",
        "Seeded sandbox so you can build before the customer connects",
      ],
      specs: [
        ["Integrations", "24 live, 6 in beta"],
        ["Objects", "Contacts, companies, deals, tickets, notes, custom"],
        ["Sync", "Incremental, bidirectional, webhook-driven"],
        ["Latency", "Typically under 60 seconds end to end"],
        ["Compliance", "SOC 2 Type II, ISO 27001, HIPAA available"],
        ["Support", "Named integration engineer on all contracts"],
      ],
      gallery: [
        { kind: "table", caption: "Field mapping between a source CRM and the unified schema" },
        { kind: "dashboard", caption: "Sync health across connected customer accounts" },
        { kind: "chart", caption: "Records synchronised per integration over 30 days" },
      ],
      plans: [
        { name: "Pilot", price: "Custom", period: "3 months", note: "Proof of concept", features: ["3 integrations", "Sandbox access", "Integration engineer"] },
        { name: "Platform", price: "Custom", period: "annual", note: "Most common", features: ["All integrations", "Bidirectional sync", "99.9% SLA"], popular: true },
        { name: "Regulated", price: "Custom", period: "annual", note: "HIPAA / ISO", features: ["Data residency", "BAA available", "Penetration test reports"] },
      ],
      reviews: [
        { author: "Marcus Thorne", role: "VP Engineering, Cadenza Software", rating: 5, date: "2026-02-27", title: "Removed a roadmap item per quarter", body: "Every enterprise deal used to come with a bespoke CRM integration. Now it is a configuration change, and our roadmap belongs to us again." },
        { author: "Ingeborg Halvorsen", role: "Solutions architect", rating: 4, date: "2026-01-23", title: "Strong, and priced like enterprise software", body: "The sandbox is the best I have used and the field-mapping transparency is exactly right. It is not a small line item, so it needs several deals to justify." },
        { author: "Kwame Boateng", role: "Integration engineer", rating: 4, date: "2025-12-05", title: "Long tail is genuinely covered", body: "Two of our customers run systems I assumed we would have to build ourselves. Both were already supported, one only in beta." },
      ],
    },

    /* ----------------------------------------------------------- testing */
    {
      id: "kestrelrun",
      name: "Kestrelrun",
      tagline: "Browser tests that survive a redesign and tell you why they failed.",
      description:
        "Kestrelrun runs end-to-end tests against real browsers with automatic waiting, so the sleep statements disappear from your suite. Selectors resolve by accessible role and visible text first, which means a class-name change during a redesign no longer breaks forty tests. When something does fail you get a trace: a timeline with DOM snapshots, network activity and a video, so the difference between a genuine regression and a slow response is visible rather than inferred.",
      category: "testing",
      tags: ["end-to-end", "browser-testing", "traces", "parallel", "flake-detection", "free-tier", "cli"],
      pricing: "freemium",
      priceFrom: 0,
      priceNote: "Free open-source runner · Cloud grid from $39/mo",
      rating: 4.8,
      ratingCount: 556,
      votes: 2410,
      featured: true,
      sponsored: false,
      verified: true,
      added: "2026-02-10",
      launched: 2021,
      url: "https://kestrelrun.example.com",
      platforms: ["CLI", "Chromium", "Firefox", "WebKit", "CI"],
      mark: { shape: "target", from: "#047857", to: "#6ee7b7" },
      highlights: [
        "Selectors resolve by accessible role and visible text",
        "Automatic waiting removes sleeps from the suite entirely",
        "Failure traces with DOM snapshots, network log and video",
        "Flake detection that quarantines rather than blocks the merge",
      ],
      specs: [
        ["Browsers", "Chromium, Firefox, WebKit"],
        ["Runner licence", "MIT, free forever"],
        ["Parallelism", "Unlimited locally, 20 workers on Cloud"],
        ["Trace size", "Roughly 2 MB per failed test"],
        ["Languages", "TypeScript, JavaScript, Python"],
        ["CI", "Any, with first-party GitHub and GitLab reporters"],
      ],
      gallery: [
        { kind: "dashboard", caption: "Suite run with three flaky tests quarantined" },
        { kind: "terminal", caption: "Running the suite with eight parallel workers" },
        { kind: "chart", caption: "Flake rate trending down across six weeks" },
      ],
      plans: [
        { name: "Runner", price: "$0", period: "forever", note: "MIT licensed", features: ["All browsers", "Local parallelism", "Trace viewer"] },
        { name: "Cloud", price: "$39", period: "per month", note: "Most popular", features: ["20 hosted workers", "Trace storage", "Flake analytics"], popular: true },
        { name: "Team", price: "$199", period: "per month", note: "Larger suites", features: ["100 workers", "90-day trace retention", "Priority support"] },
      ],
      reviews: [
        { author: "Nadia Hussein", role: "QA lead, Foldmark", rating: 5, date: "2026-03-11", title: "Traces ended the re-run habit", body: "People used to hit re-run because investigating was too slow. With a video and a DOM snapshot on every failure they actually look, and the flake rate has halved." },
        { author: "Peter Almeida", role: "Frontend engineer", rating: 5, date: "2026-02-04", title: "Survived a full redesign", body: "We rewrote the markup of our checkout and four tests broke, all legitimately. Under the old suite it would have been most of them." },
        { author: "Rosalind Achterberg", role: "Test automation engineer", rating: 4, date: "2025-12-22", title: "Cloud workers are the paid hook", body: "The free runner is complete and generous. You will still end up paying once the suite takes longer than your patience in CI." },
      ],
    },
    {
      id: "pixelward",
      name: "Pixelward",
      tagline: "Visual regression review that lives inside the pull request.",
      description:
        "Pixelward screenshots your components and pages on every commit and posts the differences where the review already happens. Diffs are perceptual rather than pixel-exact, so anti-aliasing and font rendering stop generating noise, and a reviewer approves or rejects a change without leaving the pull request. Baselines are tracked per branch and per viewport, which means a deliberate redesign updates cleanly instead of producing four hundred failures nobody reads.",
      category: "testing",
      tags: ["visual-regression", "screenshots", "code-review", "baselines", "responsive", "cli"],
      pricing: "enterprise",
      priceFrom: 0,
      priceNote: "Custom pricing · Typically from $600/mo",
      rating: 4.4,
      ratingCount: 132,
      votes: 578,
      featured: false,
      sponsored: false,
      verified: true,
      added: "2025-10-30",
      launched: 2020,
      url: "https://pixelward.example.com",
      platforms: ["GitHub", "GitLab", "CLI", "Storybook"],
      mark: { shape: "grid", from: "#9d174d", to: "#f9a8d4" },
      highlights: [
        "Perceptual diffing that ignores anti-aliasing noise",
        "Approve or reject directly in the pull request",
        "Baselines per branch and per viewport",
        "Storybook integration captures every component state",
      ],
      specs: [
        ["Viewports", "Unlimited, configured per project"],
        ["Diff engine", "Perceptual, tunable sensitivity"],
        ["Integrations", "GitHub, GitLab, Bitbucket, Storybook"],
        ["Retention", "12 months of baselines"],
        ["Concurrency", "Negotiated per contract"],
        ["Compliance", "SOC 2 Type II"],
      ],
      gallery: [
        { kind: "dashboard", caption: "Pull request with 12 visual changes awaiting review" },
        { kind: "table", caption: "Baseline coverage by component and viewport" },
        { kind: "chart", caption: "Visual changes per release across a quarter" },
      ],
      plans: [
        { name: "Team", price: "Custom", period: "annual", note: "Single product", features: ["Unlimited viewports", "PR integration", "12-month baselines"] },
        { name: "Organisation", price: "Custom", period: "annual", note: "Most common", features: ["Multiple products", "Storybook capture", "SSO and audit log"], popular: true },
        { name: "Enterprise", price: "Custom", period: "annual", note: "Regulated", features: ["Self-hosted runners", "Data residency", "Named engineer"] },
      ],
      reviews: [
        { author: "Emil Sørensen", role: "Design systems lead, Northgate", rating: 5, date: "2026-02-16", title: "Caught what assertions never would", body: "A padding token change moved a button off a card on mobile only. No functional test would ever have seen it. The diff was in the pull request within four minutes." },
        { author: "Priti Deshmukh", role: "Frontend architect", rating: 4, date: "2026-01-12", title: "Perceptual diffing is the difference", body: "We had abandoned an earlier tool because font rendering produced constant false positives. This one is quiet enough that people trust it." },
        { author: "Gareth Llywelyn", role: "Engineering manager", rating: 4, date: "2025-11-08", title: "Great tool, enterprise sales cycle", body: "The product is excellent and the procurement process is exactly what you would expect. Budget six weeks before you are running." },
      ],
    },
    {
      id: "surgeforge",
      name: "Surgeforge",
      tagline: "Load tests written in the language your team already knows.",
      description:
        "Surgeforge lets you express a load test as ordinary code rather than a recorded script or a form in a dashboard. Scenarios are functions, assertions are the ones you already write, and thresholds fail the build when p99 latency or error rate crosses a line you set. It runs the same test from your laptop for a hundred virtual users or across distributed workers for a hundred thousand, and it reports the percentiles that matter rather than an average that hides everything.",
      category: "testing",
      tags: ["load-testing", "performance", "open-source", "thresholds", "distributed", "free-tier", "cli", "self-hosted"],
      pricing: "free",
      priceFrom: 0,
      priceNote: "Open source (AGPL) · Managed workers optional",
      rating: 4.5,
      ratingCount: 209,
      votes: 934,
      featured: false,
      sponsored: false,
      verified: false,
      added: "2025-11-20",
      launched: 2022,
      url: "https://surgeforge.example.com",
      platforms: ["CLI", "Docker", "Kubernetes", "CI"],
      mark: { shape: "spark", from: "#c2410c", to: "#fdba74" },
      highlights: [
        "Scenarios written as plain TypeScript or Python functions",
        "Thresholds on p95 and p99 that fail the build",
        "Same test runs locally or across distributed workers",
        "Percentile-first reporting, no misleading averages",
      ],
      specs: [
        ["Licence", "AGPL-3.0"],
        ["Protocols", "HTTP/1.1, HTTP/2, WebSocket, gRPC"],
        ["Scale", "Tested to 250k virtual users distributed"],
        ["Languages", "TypeScript, Python"],
        ["Output", "Terminal, JSON, Prometheus, OpenTelemetry"],
        ["Orchestration", "Docker Compose or Kubernetes operator"],
      ],
      gallery: [
        { kind: "chart", caption: "Latency percentiles as load ramps to 50k users" },
        { kind: "terminal", caption: "A threshold failing the run on p99 regression" },
        { kind: "dashboard", caption: "Distributed worker utilisation during a soak test" },
      ],
      plans: [
        { name: "Open source", price: "$0", period: "forever", note: "AGPL-3.0", features: ["Every feature", "Self-orchestrated", "Community forum"], popular: true },
        { name: "Managed workers", price: "$0.08", period: "per worker hour", note: "Pay as you go", features: ["No infrastructure", "Global regions", "Result retention"] },
      ],
      reviews: [
        { author: "Beatriz Salgado", role: "Performance engineer", rating: 5, date: "2026-02-25", title: "Tests live with the code now", body: "Because scenarios are just functions, our load tests sit in the repository and get reviewed like anything else. They stopped rotting." },
        { author: "Henrik Lindgren", role: "Backend developer", rating: 4, date: "2026-01-18", title: "Percentile reporting is the right default", body: "The previous tool we used led with the mean, which made a genuinely bad p99 look acceptable for about two quarters." },
        { author: "Chiamaka Eze", role: "SRE", rating: 4, date: "2025-12-14", title: "Distributed mode needs care", body: "Running at real scale means running the workers, and the Kubernetes operator assumes you know it well. Local mode is effortless." },
      ],
    },

    /* ---------------------------------------------------------- frontend */
    {
      id: "tokenmill",
      name: "Tokenmill",
      tagline: "One definition of colour, spacing and type that design and code share.",
      description:
        "Tokenmill holds your design decisions in one place and compiles them out to wherever they are needed — CSS custom properties, Tailwind config, iOS and Android resources, and a design-tool library that stays in step. Themes are expressed as overrides rather than duplicates, so a dark palette or a white-label brand is a short file instead of a second system. Changes are versioned and diffable, which makes a token update a reviewable pull request rather than a message in a channel.",
      category: "frontend",
      tags: ["design-tokens", "theming", "css-variables", "white-label", "versioning", "free-tier", "cli"],
      pricing: "freemium",
      priceFrom: 0,
      priceNote: "Free for one theme · Teams from $29/mo",
      rating: 4.6,
      ratingCount: 187,
      votes: 812,
      featured: false,
      sponsored: false,
      verified: true,
      added: "2026-01-05",
      launched: 2022,
      url: "https://tokenmill.example.com",
      platforms: ["CLI", "Web", "Figma plugin", "npm package"],
      mark: { shape: "stack", from: "#7e22ce", to: "#d8b4fe" },
      highlights: [
        "Compiles to CSS variables, Tailwind, iOS and Android from one source",
        "Themes as overrides, not duplicated palettes",
        "Token changes arrive as reviewable, diffable pull requests",
        "Contrast checking built into the build step",
      ],
      specs: [
        ["Outputs", "CSS, SCSS, Tailwind, Swift, Kotlin, JSON"],
        ["Standard", "W3C Design Tokens Community Group format"],
        ["Themes", "Unlimited on paid plans, one on Free"],
        ["Design tools", "Figma plugin, two-way sync"],
        ["Validation", "WCAG contrast checks fail the build"],
        ["Distribution", "Private npm registry or git"],
      ],
      gallery: [
        { kind: "table", caption: "Token set with resolved values per theme" },
        { kind: "terminal", caption: "Build failing on an insufficient contrast pair" },
        { kind: "dashboard", caption: "Token usage across three product surfaces" },
      ],
      plans: [
        { name: "Solo", price: "$0", period: "forever", note: "One theme", features: ["All outputs", "CLI", "Community support"] },
        { name: "Team", price: "$29", period: "per month", note: "Most popular", features: ["Unlimited themes", "Figma sync", "Contrast validation"], popular: true },
        { name: "Platform", price: "$99", period: "per month", note: "White-label", features: ["Per-tenant themes", "Private registry", "Priority support"] },
      ],
      reviews: [
        { author: "Lena Fischbach", role: "Design systems engineer, Halcyon", rating: 5, date: "2026-03-03", title: "Eleven greys became four", body: "Auditing what we actually used and compiling from one source removed most of a year of accumulated drift in an afternoon." },
        { author: "Osian Pritchard", role: "Frontend lead", rating: 4, date: "2026-02-07", title: "White-label themes as overrides", body: "We serve six branded tenants. Each one is now about thirty lines rather than a forked stylesheet nobody dared touch." },
        { author: "Junko Watanabe", role: "Product designer", rating: 5, date: "2025-12-27", title: "The Figma sync actually holds", body: "Two-way sync usually means one direction works. This one has survived four months without a manual reconciliation." },
      ],
    },
    {
      id: "understory",
      name: "Understory",
      tagline: "Unstyled, accessible component primitives you can actually design on.",
      description:
        "Understory ships the behaviour and none of the opinions. Dialogs trap focus and restore it, comboboxes implement the full keyboard specification, menus handle typeahead and roving tabindex, and every component is a set of composable parts with no styles attached. That means an entire class of accessibility bugs is solved before you start, while the visual design stays completely yours rather than something you fight a theme system to override.",
      category: "frontend",
      tags: ["accessibility", "headless-ui", "open-source", "keyboard-navigation", "components", "free-tier"],
      pricing: "free",
      priceFrom: 0,
      priceNote: "Open source (MIT) · Free forever",
      rating: 4.9,
      ratingCount: 743,
      votes: 3120,
      featured: true,
      sponsored: false,
      verified: true,
      added: "2025-12-12",
      launched: 2020,
      url: "https://understory.example.com",
      platforms: ["React", "Vue", "Svelte", "Web Components"],
      mark: { shape: "ring", from: "#166534", to: "#bbf7d0" },
      highlights: [
        "Full WAI-ARIA authoring practice compliance, tested per component",
        "Composable parts with zero styles to override",
        "Focus management and keyboard behaviour handled correctly",
        "Framework builds for React, Vue, Svelte and Web Components",
      ],
      specs: [
        ["Licence", "MIT"],
        ["Components", "38 primitives"],
        ["Bundle impact", "Tree-shakeable, ~2 KB per component gzipped"],
        ["Testing", "Screen reader assertions in CI across 3 readers"],
        ["Frameworks", "React 18+, Vue 3, Svelte 5, Web Components"],
        ["SSR", "Supported, hydration-safe ids"],
      ],
      gallery: [
        { kind: "dashboard", caption: "Component catalogue with keyboard interaction map" },
        { kind: "table", caption: "ARIA pattern conformance per component" },
        { kind: "terminal", caption: "Screen reader assertions running in CI" },
      ],
      plans: [
        { name: "Open source", price: "$0", period: "forever", note: "MIT licensed", features: ["All 38 components", "Every framework", "Community Discord"], popular: true },
        { name: "Sponsor", price: "$25", period: "per month", note: "Support the project", features: ["Logo in README", "Roadmap input", "Same software"] },
      ],
      reviews: [
        { author: "Fenella Mbeki", role: "Accessibility consultant", rating: 5, date: "2026-03-08", title: "The audits stopped finding widget bugs", body: "Focus traps, escape handling, roving tabindex — these are the findings that fill an audit report. Teams using this ship without them." },
        { author: "Arturo Benitez", role: "Senior frontend engineer", rating: 5, date: "2026-02-19", title: "Unstyled means unstyled", body: "No theme to fight, no specificity war, no !important. It renders correct markup with correct behaviour and leaves the rest alone." },
        { author: "Saoirse Duffy", role: "UI engineer", rating: 5, date: "2026-01-25", title: "The combobox alone justifies it", body: "We had rebuilt an autocomplete three times and it was still wrong with a screen reader. Replaced in a morning and it passes." },
      ],
    },
    {
      id: "meridian-type",
      name: "Meridian Type",
      tagline: "Fluid type and spacing scales that stay in proportion at every width.",
      description:
        "Meridian Type generates a modular scale for type and spacing and expresses it as fluid CSS clamp values, so headings interpolate smoothly between a phone and an ultrawide monitor instead of jumping at breakpoints. It reasons about vertical rhythm and line length together, warns when a measure runs past a comfortable reading width, and outputs plain custom properties that work in any stack. The preview shows real paragraphs at every viewport, which makes the decision a visual one rather than a spreadsheet.",
      category: "frontend",
      tags: ["typography", "fluid-type", "clamp", "spacing-scale", "css", "cli"],
      pricing: "paid",
      priceFrom: 12,
      priceNote: "$12/mo or $99 one-time licence",
      rating: 4.4,
      ratingCount: 118,
      votes: 507,
      featured: false,
      sponsored: true,
      verified: true,
      added: "2026-02-20",
      launched: 2023,
      url: "https://meridiantype.example.com",
      platforms: ["Web", "CLI", "VS Code extension"],
      mark: { shape: "glyph", from: "#1e3a8a", to: "#7dd3fc" },
      highlights: [
        "Fluid clamp() scales that interpolate instead of jumping",
        "Line length warnings when the measure exceeds comfort",
        "Type and spacing derived from one shared ratio",
        "Plain CSS custom properties, no runtime and no framework",
      ],
      specs: [
        ["Output", "CSS custom properties, SCSS map, Tailwind config"],
        ["Scales", "Type, spacing, radius, shadow"],
        ["Ratios", "Preset musical ratios or custom"],
        ["Preview", "Live at 320px through 2560px"],
        ["Licence", "Per-seat, unlimited projects"],
        ["Runtime cost", "None, output is static CSS"],
      ],
      gallery: [
        { kind: "chart", caption: "Type scale interpolation from 320px to 2560px" },
        { kind: "dashboard", caption: "Live preview with measure warnings on two levels" },
        { kind: "table", caption: "Generated custom properties with computed extremes" },
      ],
      plans: [
        { name: "Monthly", price: "$12", period: "per month", note: "Cancel anytime", features: ["All outputs", "Live preview", "VS Code extension"] },
        { name: "One-time", price: "$99", period: "once", note: "Best value", features: ["Perpetual licence", "One year of updates", "All outputs"], popular: true },
        { name: "Studio", price: "$249", period: "once", note: "Up to 10 seats", features: ["Team licence", "Shared presets", "Priority email"] },
      ],
      reviews: [
        { author: "Dorian Halloway", role: "Art director, Fieldnote Studio", rating: 5, date: "2026-03-05", title: "Headings finally feel composed", body: "Choosing sizes individually at eleven at night is exactly how we used to do it. One ratio and a fluid scale replaced all of that guesswork." },
        { author: "Ilse Vermeulen", role: "Frontend developer", rating: 4, date: "2026-02-11", title: "Output is refreshingly plain", body: "It hands you custom properties and disappears. No dependency, no build step, nothing to keep up to date." },
        { author: "Mateo Iglesias", role: "Designer and developer", rating: 4, date: "2026-01-08", title: "Worth it at one-time, less so monthly", body: "The perpetual licence is easy to justify. Paying monthly for something that outputs static CSS is a harder sell to a manager." },
      ],
    },
  ];

  /* ------------------------------------------------------------------------
     Public API — everything the pages read comes from this object.
     ---------------------------------------------------------------------- */
  return {
    categories: CATEGORIES,
    listings: LISTINGS,

    /* Look up one category by its id. */
    category: function (id) {
      for (var i = 0; i < CATEGORIES.length; i++) {
        if (CATEGORIES[i].id === id) return CATEGORIES[i];
      }
      return null;
    },

    /* Look up one listing by its id. */
    listing: function (id) {
      for (var i = 0; i < LISTINGS.length; i++) {
        if (LISTINGS[i].id === id) return LISTINGS[i];
      }
      return null;
    },

    /* Every listing in a category. */
    byCategory: function (id) {
      return LISTINGS.filter(function (l) {
        return l.category === id;
      });
    },

    /* How many listings each category holds — used for the category tiles. */
    countFor: function (id) {
      return LISTINGS.filter(function (l) {
        return l.category === id;
      }).length;
    },

    /* Every distinct tag across the directory, alphabetically. */
    allTags: function () {
      var seen = {};
      LISTINGS.forEach(function (l) {
        (l.tags || []).forEach(function (t) {
          seen[t] = true;
        });
      });
      return Object.keys(seen).sort();
    },
  };
})();

/* Make the data available to the pages. */
if (typeof window !== "undefined") window.STACKLIST = STACKLIST;
