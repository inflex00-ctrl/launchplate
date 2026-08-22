/* ==========================================================================
   STACKLIST — listing.js
   --------------------------------------------------------------------------
   Renders the single-listing page from ?id=<listing-id>.

   One HTML file serves every tool in the directory: the whole page — heading,
   gallery, specs, plans, reviews, alternatives, the sticky call to action and
   the structured data — is built from the matching entry in js/data.js.

   If the id is missing or unknown the page falls back to the first listing
   rather than showing an error, so the template always looks alive.
   ========================================================================== */

(function () {
  "use strict";

  if (typeof STACKLIST === "undefined" || typeof SL === "undefined") return;

  var $ = SL.$;
  var $$ = SL.$$;

  /* ======================================================================
     Pick the listing
     ====================================================================== */

  var id = SL.query().id;
  var listing = (id && STACKLIST.listing(id)) || STACKLIST.listings[0];
  var category = STACKLIST.category(listing.category);

  var SITE = "https://stacklist.example.com";

  /* ======================================================================
     Head: title, description, canonical, social tags
     ====================================================================== */

  function setMeta(selector, attr, value) {
    var el = document.querySelector(selector);
    if (el) el.setAttribute(attr, value);
  }

  var pageTitle = listing.name + " — " + listing.tagline.replace(/\.$/, "") + " | Stacklist";
  var pageDesc =
    listing.tagline +
    " " +
    listing.description.split(". ")[0] +
    ". Rated " +
    listing.rating.toFixed(1) +
    "/5 from " +
    listing.ratingCount +
    " reviews on Stacklist.";

  document.title = pageTitle;
  setMeta('meta[name="description"]', "content", pageDesc);
  setMeta('link[rel="canonical"]', "href", SITE + "/listing.html?id=" + listing.id);
  setMeta('meta[property="og:title"]', "content", pageTitle);
  setMeta('meta[property="og:description"]', "content", pageDesc);
  setMeta('meta[property="og:url"]', "content", SITE + "/listing.html?id=" + listing.id);
  setMeta('meta[name="twitter:title"]', "content", pageTitle);
  setMeta('meta[name="twitter:description"]', "content", pageDesc);

  /* ======================================================================
     Breadcrumbs
     ====================================================================== */

  $("#crumbs").innerHTML =
    "<ol>" +
    '<li><a href="index.html">Home</a></li>' +
    '<li><a href="browse.html">Browse</a></li>' +
    '<li><a href="category.html?id=' + encodeURIComponent(listing.category) + '">' +
    SL.escape(category ? category.name : listing.category) +
    "</a></li>" +
    '<li><span aria-current="page">' + SL.escape(listing.name) + "</span></li>" +
    "</ol>";

  /* ======================================================================
     Header block
     ====================================================================== */

  var badges = "";
  if (listing.sponsored) badges += '<span class="badge badge--sponsored">' + SL.icon("bolt") + "Sponsored</span>";
  else if (listing.featured) badges += '<span class="badge badge--featured">' + SL.icon("sparkle") + "Featured</span>";
  if (listing.verified) badges += '<span class="badge badge--verified">' + SL.icon("check") + "Verified</span>";
  badges +=
    '<span class="price-pill" data-price="' + listing.pricing + '">' +
    SL.priceLabel[listing.pricing] +
    "</span>";

  $("#detail-header").innerHTML =
    SL.mark(listing, "xl") +
    '<div class="detail__heading">' +
    '<h1 class="detail__title">' + SL.escape(listing.name) + "</h1>" +
    '<p class="detail__tagline">' + SL.escape(listing.tagline) + "</p>" +
    '<div class="card__badges mb-4">' + badges + "</div>" +
    '<div class="detail__metarow">' +
    '<span class="rating-row">' +
    SL.stars(listing.rating) +
    "<b>" + listing.rating.toFixed(1) + "</b>" +
    "<span>(" + listing.ratingCount + " reviews)</span>" +
    "</span>" +
    "<span>" + SL.icon("chevronUp") + " " + SL.formatNumber(listing.votes) + " upvotes</span>" +
    '<span><a href="category.html?id=' + encodeURIComponent(listing.category) + '">' +
    SL.escape(category ? category.name : listing.category) + "</a></span>" +
    "<span>Added " + SL.formatDate(listing.added) + "</span>" +
    "</div>" +
    "</div>";

  /* ======================================================================
     Gallery — generated SVG mockups, one per gallery entry
     ====================================================================== */

  var gallery = listing.gallery || [];

  if (gallery.length) {
    $("#gallery-stage").innerHTML = SL.mockup(gallery[0].kind, listing);
    $("#gallery-caption").textContent = gallery[0].caption;
    $("#gallery-thumbs").innerHTML = gallery
      .map(function (g, i) {
        return (
          '<li><button type="button" class="gallery__thumb" data-index="' + i + '"' +
          (i === 0 ? ' aria-current="true"' : "") +
          ' aria-label="Show screenshot ' + (i + 1) + ": " + SL.escape(g.caption) + '">' +
          SL.mockup(g.kind, listing) +
          "</button></li>"
        );
      })
      .join("");

    $("#gallery-thumbs").addEventListener("click", function (e) {
      var btn = e.target.closest(".gallery__thumb");
      if (!btn) return;
      var i = Number(btn.dataset.index);
      $("#gallery-stage").innerHTML = SL.mockup(gallery[i].kind, listing);
      $("#gallery-caption").textContent = gallery[i].caption;
      $$(".gallery__thumb").forEach(function (b) {
        b.removeAttribute("aria-current");
      });
      btn.setAttribute("aria-current", "true");
    });
  } else {
    $("#gallery").hidden = true;
  }

  /* ======================================================================
     Description, highlights, specs
     ====================================================================== */

  $("#overview-body").innerHTML =
    "<p>" + SL.escape(listing.description) + "</p>" +
    (category
      ? '<p class="text-muted">' + SL.escape(listing.name) + " is listed under " +
        '<a href="category.html?id=' + encodeURIComponent(category.id) + '">' +
        SL.escape(category.name) + "</a> and has been available since " + listing.launched + ".</p>"
      : "");

  $("#highlights").innerHTML = (listing.highlights || [])
    .map(function (h) {
      return "<li>" + SL.icon("check") + "<span>" + SL.escape(h) + "</span></li>";
    })
    .join("");

  $("#spec-body").innerHTML = (listing.specs || [])
    .map(function (row) {
      return (
        '<tr><th scope="row">' + SL.escape(row[0]) + "</th><td>" + SL.escape(row[1]) + "</td></tr>"
      );
    })
    .join("") +
    '<tr><th scope="row">Platforms</th><td>' +
    SL.escape((listing.platforms || []).join(", ")) +
    "</td></tr>";

  /* ======================================================================
     Plans
     ====================================================================== */

  $("#plans").innerHTML = (listing.plans || [])
    .map(function (p) {
      return (
        '<div class="plan' + (p.popular ? " plan--popular" : "") + '">' +
        '<h3 class="plan__name">' + SL.escape(p.name) + "</h3>" +
        '<p class="plan__price">' + SL.escape(p.price) + "</p>" +
        '<p class="plan__period">' + SL.escape(p.period) + "</p>" +
        (p.note ? '<p class="plan__note">' + SL.escape(p.note) + "</p>" : "") +
        '<ul class="plan__features">' +
        (p.features || [])
          .map(function (f) {
            return "<li>" + SL.icon("check") + "<span>" + SL.escape(f) + "</span></li>";
          })
          .join("") +
        "</ul></div>"
      );
    })
    .join("");

  /* ======================================================================
     Reviews
     ====================================================================== */

  /* A plausible star distribution derived from the average, so the bars are
     consistent with the headline number rather than invented separately. */
  function distribution(avg, total) {
    var weights = [0, 0, 0, 0, 0];
    for (var star = 1; star <= 5; star++) {
      var distance = Math.abs(star - avg);
      /* A bell around the average, plus a small flat floor. Real rating
         histograms always have a thin tail of unhappy reviewers, and a
         product showing a clean 0% on one, two and three stars reads as
         fabricated rather than excellent. */
      weights[star - 1] = Math.exp(-distance * distance * 1.35) + 0.015;
    }
    var sum = weights.reduce(function (a, b) { return a + b; }, 0);
    var counts = weights.map(function (w) {
      return Math.round((w / sum) * total);
    });
    /* Correct rounding drift onto the modal bucket. */
    var drift = total - counts.reduce(function (a, b) { return a + b; }, 0);
    var peak = Math.round(avg) - 1;
    counts[Math.max(0, Math.min(4, peak))] += drift;
    return counts;
  }

  var counts = distribution(listing.rating, listing.ratingCount);

  $("#rating-summary").innerHTML =
    '<div class="rating-summary__score">' +
    '<span class="rating-summary__num">' + listing.rating.toFixed(1) + "</span>" +
    SL.stars(listing.rating, "lg") +
    '<p class="rating-summary__count">' + listing.ratingCount + " reviews</p>" +
    "</div>" +
    '<div class="rating-bars">' +
    [5, 4, 3, 2, 1]
      .map(function (star) {
        var n = counts[star - 1];
        var pct = listing.ratingCount ? Math.round((n / listing.ratingCount) * 100) : 0;
        return (
          '<div class="rating-bar">' +
          "<span>" + star + " star</span>" +
          '<span class="rating-bar__track">' +
          '<span class="rating-bar__fill" style="width:' + pct + '%"></span>' +
          "</span>" +
          '<span class="tabular">' + pct + "%</span>" +
          "</div>"
        );
      })
      .join("") +
    "</div>";

  function initials(name) {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map(function (w) { return w.charAt(0); })
      .join("")
      .toUpperCase();
  }

  $("#reviews").innerHTML = (listing.reviews || [])
    .map(function (r) {
      return (
        '<li class="review">' +
        '<div class="review__head">' +
        '<span class="avatar" aria-hidden="true">' + SL.escape(initials(r.author)) + "</span>" +
        '<div class="review__who">' +
        '<p class="review__author">' + SL.escape(r.author) + "</p>" +
        '<p class="review__role">' + SL.escape(r.role) + "</p>" +
        "</div>" +
        '<span class="review__date">' + SL.formatDate(r.date) + "</span>" +
        "</div>" +
        SL.stars(r.rating, "sm") +
        '<span class="visually-hidden">Rated ' + r.rating + " out of 5</span>" +
        '<h3 class="review__title mt-3">' + SL.escape(r.title) + "</h3>" +
        '<p class="review__body">' + SL.escape(r.body) + "</p>" +
        "</li>"
      );
    })
    .join("");

  /* ======================================================================
     Alternatives — other tools in the same category
     ====================================================================== */

  var alternatives = STACKLIST.byCategory(listing.category)
    .filter(function (l) {
      return l.id !== listing.id;
    })
    .sort(function (a, b) {
      return b.rating - a.rating;
    });

  /* If the category is thin, top up with the best-rated tools elsewhere. */
  if (alternatives.length < 3) {
    STACKLIST.listings
      .filter(function (l) {
        return l.id !== listing.id && l.category !== listing.category;
      })
      .sort(function (a, b) { return b.rating - a.rating; })
      .slice(0, 3 - alternatives.length)
      .forEach(function (l) {
        alternatives.push(l);
      });
  }

  $("#alternatives").innerHTML = alternatives
    .map(function (l) {
      return (
        '<a class="alt" href="listing.html?id=' + encodeURIComponent(l.id) + '">' +
        SL.mark(l, "sm") +
        '<span class="alt__body">' +
        '<span class="alt__name">' + SL.escape(l.name) + "</span>" +
        '<span class="alt__meta">' + l.rating.toFixed(1) + " ★ · " + SL.priceLabel[l.pricing] + "</span>" +
        "</span>" +
        "</a>"
      );
    })
    .join("");

  $("#alt-heading").textContent = "Alternatives to " + listing.name;

  /* ======================================================================
     Sticky call to action
     ====================================================================== */

  var priceHeadline =
    listing.pricing === "free"
      ? "Free"
      : listing.priceFrom
      ? "From $" + listing.priceFrom + "/mo"
      : SL.priceLabel[listing.pricing];

  $("#cta-card").innerHTML =
    '<p class="cta-card__price">' + SL.escape(priceHeadline) + "</p>" +
    '<p class="cta-card__note">' + SL.escape(listing.priceNote) + "</p>" +
    '<a class="btn btn--primary btn--block" href="' + SL.escape(listing.url) + '" ' +
    'rel="nofollow noopener" target="_blank">Visit ' + SL.escape(listing.name) +
    SL.icon("external") + "</a>" +
    '<button type="button" class="btn btn--ghost btn--block" id="save-btn" aria-pressed="false">' +
    SL.icon("heart") + "Save for later</button>" +
    '<div class="cta-card__meta">' +
    "<div><span>Category</span><b>" + SL.escape(category ? category.name : "—") + "</b></div>" +
    "<div><span>Pricing</span><b>" + SL.priceLabel[listing.pricing] + "</b></div>" +
    "<div><span>Launched</span><b>" + listing.launched + "</b></div>" +
    "<div><span>Platforms</span><b>" + SL.escape((listing.platforms || []).join(", ")) + "</b></div>" +
    "<div><span>Listed</span><b>" + SL.formatDate(listing.added) + "</b></div>" +
    "</div>";

  /* The mobile action bar mirrors the sidebar. */
  $("#mobile-cta").innerHTML =
    '<div class="mobile-cta__price"><b>' + SL.escape(priceHeadline) + "</b>" +
    "<span>" + SL.escape(listing.name) + "</span></div>" +
    '<a class="btn btn--primary" href="' + SL.escape(listing.url) + '" ' +
    'rel="nofollow noopener" target="_blank">Visit site</a>';
  document.body.classList.add("has-mobile-cta");

  /* Save button is a local-only demo interaction. */
  var saveBtn = $("#save-btn");
  if (saveBtn) {
    var storeKey = "stacklist-saved";
    var saved = [];
    try {
      saved = JSON.parse(localStorage.getItem(storeKey) || "[]");
    } catch (e) {
      saved = [];
    }

    function paintSave() {
      var on = saved.indexOf(listing.id) > -1;
      saveBtn.setAttribute("aria-pressed", on ? "true" : "false");
      saveBtn.lastChild.textContent = on ? "Saved" : "Save for later";
    }
    paintSave();

    saveBtn.addEventListener("click", function () {
      var i = saved.indexOf(listing.id);
      if (i > -1) saved.splice(i, 1);
      else saved.push(listing.id);
      try {
        localStorage.setItem(storeKey, JSON.stringify(saved));
      } catch (e) {
        /* Storage unavailable — the button still reflects this page view. */
      }
      paintSave();
    });
  }

  /* ======================================================================
     Structured data — SoftwareApplication with rating, reviews, offers
     ====================================================================== */

  (function () {
    var node = document.getElementById("ld-listing");
    if (!node) return;

    var ld = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "SoftwareApplication",
          "@id": SITE + "/listing.html?id=" + listing.id + "#software",
          name: listing.name,
          description: listing.description,
          applicationCategory: "DeveloperApplication",
          applicationSubCategory: category ? category.name : listing.category,
          operatingSystem: (listing.platforms || []).join(", "),
          url: listing.url,
          datePublished: String(listing.launched),
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: listing.rating,
            reviewCount: listing.ratingCount,
            bestRating: 5,
            worstRating: 1
          },
          offers: (listing.plans || []).map(function (p) {
            var numeric = String(p.price).replace(/[^0-9.]/g, "");
            return {
              "@type": "Offer",
              name: p.name,
              price: numeric === "" ? "0" : numeric,
              priceCurrency: "USD",
              availability: "https://schema.org/InStock",
              description: (p.features || []).join(", ")
            };
          }),
          review: (listing.reviews || []).map(function (r) {
            return {
              "@type": "Review",
              name: r.title,
              reviewBody: r.body,
              datePublished: r.date,
              author: { "@type": "Person", name: r.author },
              reviewRating: {
                "@type": "Rating",
                ratingValue: r.rating,
                bestRating: 5,
                worstRating: 1
              }
            };
          })
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
            { "@type": "ListItem", position: 2, name: "Browse", item: SITE + "/browse.html" },
            {
              "@type": "ListItem",
              position: 3,
              name: category ? category.name : listing.category,
              item: SITE + "/category.html?id=" + listing.category
            },
            {
              "@type": "ListItem",
              position: 4,
              name: listing.name,
              item: SITE + "/listing.html?id=" + listing.id
            }
          ]
        }
      ]
    };

    node.textContent = JSON.stringify(ld, null, 2);
  })();

  /* ======================================================================
     Finish: paint icons, reveal, wire shared behaviour
     ====================================================================== */

  SL.paintIcons();
  SL.reveal();
})();
