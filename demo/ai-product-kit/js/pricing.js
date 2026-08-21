/* ==========================================================================
   LUMEN — AI Product Kit
   pricing.js — the usage cost calculator.

   Takes requests/month, tokens per request and cache hit rate, prices them
   against the published per-million rates, then picks whichever plan works
   out cheapest and shows the arithmetic line by line.

   Sliders are native <input type="range">, so the whole widget is keyboard
   operable (arrows, Home/End, Page Up/Down) with no extra code.
   ========================================================================== */

(function () {
  "use strict";

  var root = document.querySelector("[data-calc]");
  if (!root) return;

  /* -- Rates, in EUR per million tokens ------------------------------- */
  var MODELS = {
    flash: { label: "lumen-flash", input: 0.8, output: 2.4, cached: 0.08 },
    pro: { label: "lumen-pro", input: 2.6, output: 10.4, cached: 0.26 },
    max: { label: "lumen-max", input: 9.0, output: 36.0, cached: 0.9 }
  };

  /* -- Plans ----------------------------------------------------------- */
  var PLANS = [
    { id: "free", name: "Free", fee: 0, credit: 0, freeTokens: 5000000, discount: 0 },
    { id: "starter", name: "Starter", fee: 49, credit: 40, freeTokens: 0, discount: 0 },
    { id: "scale", name: "Scale", fee: 399, credit: 350, freeTokens: 0, discount: 0.15 }
  ];

  /* -- Slider scales (index → value) ----------------------------------- */
  var REQUESTS = [
    1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000,
    2500000, 5000000
  ];
  var INPUT_TOKENS = [200, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 128000];
  var OUTPUT_TOKENS = [50, 100, 200, 400, 800, 1600, 3200, 6400];

  /* -- Elements -------------------------------------------------------- */
  var el = {
    model: root.querySelector("[data-calc-model]"),
    requests: root.querySelector("[data-calc-requests]"),
    input: root.querySelector("[data-calc-input]"),
    output: root.querySelector("[data-calc-output]"),
    cache: root.querySelector("[data-calc-cache]"),
    batch: root.querySelector("[data-calc-batch]"),

    outRequests: root.querySelector('[data-out="requests"]'),
    outInput: root.querySelector('[data-out="input"]'),
    outOutput: root.querySelector('[data-out="output"]'),
    outCache: root.querySelector('[data-out="cache"]'),

    total: root.querySelector("[data-calc-total]"),
    plan: root.querySelector("[data-calc-plan]"),
    fresh: root.querySelector("[data-calc-fresh]"),
    freshTokens: root.querySelector("[data-calc-fresh-tokens]"),
    cached: root.querySelector("[data-calc-cached]"),
    cachedTokens: root.querySelector("[data-calc-cached-tokens]"),
    outcost: root.querySelector("[data-calc-outcost]"),
    outputTokens: root.querySelector("[data-calc-output-tokens]"),
    batchLine: root.querySelector("[data-calc-batch-line]"),
    batchSave: root.querySelector("[data-calc-batchsave]"),
    volumeLine: root.querySelector("[data-calc-volume-line]"),
    volume: root.querySelector("[data-calc-volume]"),
    fee: root.querySelector("[data-calc-fee]"),
    credit: root.querySelector("[data-calc-credit]"),
    grand: root.querySelector("[data-calc-grand]"),
    perRequest: root.querySelector("[data-calc-per-request]")
  };

  /* -- Formatting ------------------------------------------------------ */
  var nf = new Intl.NumberFormat("en-GB");

  function money(value, decimals) {
    var d = typeof decimals === "number" ? decimals : 2;
    return "€" + value.toLocaleString("en-GB", {
      minimumFractionDigits: d,
      maximumFractionDigits: d
    });
  }

  function compact(n) {
    if (n >= 1000000000) return round(n / 1000000000) + "B";
    if (n >= 1000000) return round(n / 1000000) + "M";
    if (n >= 1000) return round(n / 1000) + "K";
    return String(Math.round(n));
  }

  function round(n) {
    return Math.round(n * 10) / 10;
  }

  /* -- Core costing ---------------------------------------------------- */
  function computeUsage() {
    var rate = MODELS[el.model.value] || MODELS.pro;
    var requests = REQUESTS[Number(el.requests.value)];
    var perInput = INPUT_TOKENS[Number(el.input.value)];
    var perOutput = OUTPUT_TOKENS[Number(el.output.value)];
    var cacheRate = Number(el.cache.value) / 100;
    var batch = el.batch && el.batch.checked;

    var inputTokens = requests * perInput;
    var outputTokens = requests * perOutput;
    var cachedTokens = inputTokens * cacheRate;
    var freshTokens = inputTokens - cachedTokens;

    var freshCost = (freshTokens / 1e6) * rate.input;
    var cachedCost = (cachedTokens / 1e6) * rate.cached;
    var outputCost = (outputTokens / 1e6) * rate.output;

    var gross = freshCost + cachedCost + outputCost;

    /* Half the traffic at half price → a 25% cut on the whole bill. */
    var batchSaving = batch ? gross * 0.25 : 0;
    var usage = gross - batchSaving;

    return {
      rate: rate,
      requests: requests,
      inputTokens: inputTokens,
      outputTokens: outputTokens,
      cachedTokens: cachedTokens,
      freshTokens: freshTokens,
      freshCost: freshCost,
      cachedCost: cachedCost,
      outputCost: outputCost,
      batchSaving: batchSaving,
      usage: usage
    };
  }

  /* What one plan would charge for this usage. */
  function pricePlan(plan, u) {
    var billableUsage = u.usage;
    var volumeDiscount = 0;

    /* The free tier gives away tokens, not euros. Go one token over the
       allowance and you need a paid plan, so the free quote simply does
       not apply. */
    if (plan.freeTokens) {
      if (u.inputTokens + u.outputTokens > plan.freeTokens) return null;
      billableUsage = 0;
    }

    if (plan.discount) {
      volumeDiscount = billableUsage * plan.discount;
      billableUsage -= volumeDiscount;
    }

    var creditUsed = Math.min(plan.credit, billableUsage);
    var total = plan.fee + Math.max(0, billableUsage - creditUsed);

    return {
      plan: plan,
      volumeDiscount: volumeDiscount,
      creditUsed: creditUsed,
      billableUsage: billableUsage,
      total: total
    };
  }

  function cheapest(u) {
    var best = null;
    PLANS.forEach(function (plan) {
      var quote = pricePlan(plan, u);
      if (!quote) return;
      if (!best || quote.total < best.total) best = quote;
    });
    return best;
  }

  /* -- Render ---------------------------------------------------------- */
  function render() {
    var u = computeUsage();
    var best = cheapest(u);

    /* Slider read-outs */
    el.outRequests.textContent = nf.format(u.requests);
    el.outInput.textContent = nf.format(INPUT_TOKENS[Number(el.input.value)]);
    el.outOutput.textContent = nf.format(OUTPUT_TOKENS[Number(el.output.value)]);
    el.outCache.textContent = el.cache.value + "%";

    /* Line items */
    el.fresh.textContent = money(u.freshCost);
    el.freshTokens.textContent = "· " + compact(u.freshTokens) + " tok";
    el.cached.textContent = money(u.cachedCost);
    el.cachedTokens.textContent = "· " + compact(u.cachedTokens) + " tok";
    el.outcost.textContent = money(u.outputCost);
    el.outputTokens.textContent = "· " + compact(u.outputTokens) + " tok";

    el.batchLine.hidden = u.batchSaving <= 0;
    el.batchSave.textContent = "−" + money(u.batchSaving);

    el.volumeLine.hidden = !best.volumeDiscount;
    el.volume.textContent = "−" + money(best.volumeDiscount);

    el.fee.textContent = money(best.plan.fee);
    el.credit.textContent = "−" + money(best.creditUsed);
    el.grand.textContent = money(best.total);

    /* Headline number: whole euros above €100, cents below. */
    el.total.textContent =
      best.total >= 100
        ? Math.round(best.total).toLocaleString("en-GB")
        : best.total.toLocaleString("en-GB", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });

    /* Plan recommendation */
    var totalTokens = u.inputTokens + u.outputTokens;
    if (best.plan.id === "free") {
      el.plan.textContent =
        "This fits inside the free tier — " +
        compact(totalTokens) +
        " of your 5M monthly tokens.";
    } else {
      el.plan.textContent =
        "Cheapest on " +
        best.plan.name +
        ", including " +
        money(best.creditUsed) +
        " of usage credit.";
    }

    var perRequest = u.requests ? best.total / u.requests : 0;
    el.perRequest.textContent =
      "That is " +
      money(perRequest, 4) +
      " per request on " +
      u.rate.label +
      ".";
  }

  /* -- Wire up --------------------------------------------------------- */
  ["model", "requests", "input", "output", "cache", "batch"].forEach(function (key) {
    var node = el[key];
    if (!node) return;
    node.addEventListener("input", render);
    node.addEventListener("change", render);
  });

  render();
})();
