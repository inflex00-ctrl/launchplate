/* ==========================================================================
   LUMEN — AI Product Kit
   waitlist.js — client-side validation, a fake submit, and the success state.

   There is no backend in a template, so submit() simulates a network round
   trip and then swaps in the success panel. Replace `fakeSubmit` with a real
   fetch() to your endpoint — everything else stays as it is.
   ========================================================================== */

(function () {
  "use strict";

  var form = document.querySelector("[data-waitlist-form]");
  if (!form) return;

  var formState = document.querySelector("[data-form-state]");
  var successState = document.querySelector("[data-success-state]");
  var progressBar = document.querySelector("[data-progress-bar]");
  var submitBtn = form.querySelector("[data-submit]");
  var submitLabel = form.querySelector("[data-submit-label]");
  var successEmail = document.querySelector("[data-success-email]");
  var successPosition = document.querySelector("[data-success-position]");
  var resetBtn = document.querySelector("[data-reset-form]");

  /* Deliberately permissive: just enough to catch a typo, not enough to
     reject somebody's perfectly legal address. */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var FIELDS = [
    {
      id: "wl-email",
      test: function (v) {
        return EMAIL_RE.test(v.trim());
      }
    },
    {
      id: "wl-name",
      test: function (v) {
        return v.trim().length >= 2;
      }
    },
    {
      id: "wl-role",
      test: function (v) {
        return v !== "";
      }
    }
  ];

  function fieldWrapper(input) {
    return input.closest(".field");
  }

  function setInvalid(input, invalid) {
    var wrap = fieldWrapper(input);
    if (wrap) wrap.classList.toggle("is-invalid", invalid);
    input.setAttribute("aria-invalid", invalid ? "true" : "false");
  }

  function validateField(spec) {
    var input = document.getElementById(spec.id);
    if (!input) return true;
    var ok = spec.test(input.value);
    setInvalid(input, !ok);
    return ok;
  }

  function validateTerms() {
    var terms = form.querySelector("[data-terms]");
    if (!terms) return true;
    var ok = terms.checked;
    var wrap = terms.closest(".field");
    if (wrap) wrap.classList.toggle("is-invalid", !ok);
    terms.setAttribute("aria-invalid", ok ? "false" : "true");
    return ok;
  }

  /* -- Live progress bar ---------------------------------------------- */
  function updateProgress() {
    if (!progressBar) return;
    var required = FIELDS.length + 1; /* + the consent checkbox */
    var done = 0;

    FIELDS.forEach(function (spec) {
      var input = document.getElementById(spec.id);
      if (input && spec.test(input.value)) done++;
    });

    var terms = form.querySelector("[data-terms]");
    if (terms && terms.checked) done++;

    progressBar.style.width = Math.round((done / required) * 100) + "%";
  }

  /* Clear an error as soon as the visitor fixes it — never scold while
     they are still typing a valid value. */
  FIELDS.forEach(function (spec) {
    var input = document.getElementById(spec.id);
    if (!input) return;

    input.addEventListener("blur", function () {
      if (input.value !== "") validateField(spec);
      updateProgress();
    });

    input.addEventListener("input", function () {
      var wrap = fieldWrapper(input);
      if (wrap && wrap.classList.contains("is-invalid") && spec.test(input.value)) {
        setInvalid(input, false);
      }
      updateProgress();
    });

    input.addEventListener("change", updateProgress);
  });

  var termsBox = form.querySelector("[data-terms]");
  if (termsBox) {
    termsBox.addEventListener("change", function () {
      if (termsBox.checked) validateTerms();
      updateProgress();
    });
  }

  /* -- Submit ---------------------------------------------------------- */
  function fakeSubmit() {
    /* Swap this for:
         return fetch("/api/waitlist", { method: "POST", body: data });        */
    return new Promise(function (resolve) {
      window.setTimeout(resolve, 900);
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var valid = true;
    var firstBad = null;

    FIELDS.forEach(function (spec) {
      if (!validateField(spec)) {
        valid = false;
        if (!firstBad) firstBad = document.getElementById(spec.id);
      }
    });

    if (!validateTerms()) {
      valid = false;
      if (!firstBad) firstBad = form.querySelector("[data-terms]");
    }

    updateProgress();

    if (!valid) {
      if (firstBad) firstBad.focus();
      return;
    }

    submitBtn.setAttribute("aria-disabled", "true");
    if (submitLabel) submitLabel.textContent = "Joining…";

    fakeSubmit().then(function () {
      var email = document.getElementById("wl-email");

      if (successEmail && email) successEmail.textContent = email.value.trim();

      /* A plausible queue position rather than a hard-coded one. */
      if (successPosition) {
        successPosition.textContent =
          "#" + (2848 + Math.floor(Math.random() * 40)).toLocaleString("en-GB");
      }

      if (formState) formState.hidden = true;
      if (successState) {
        successState.hidden = false;
        /* Move focus so screen-reader users land on the confirmation. */
        var heading = successState.querySelector("h2");
        if (heading) {
          heading.setAttribute("tabindex", "-1");
          heading.focus();
        }
        successState.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    });
  });

  /* -- Reset ----------------------------------------------------------- */
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      form.reset();
      form.querySelectorAll(".is-invalid").forEach(function (n) {
        n.classList.remove("is-invalid");
      });
      submitBtn.removeAttribute("aria-disabled");
      if (submitLabel) submitLabel.textContent = "Join the waitlist";
      if (successState) successState.hidden = true;
      if (formState) formState.hidden = false;
      updateProgress();
      var email = document.getElementById("wl-email");
      if (email) email.focus();
    });
  }

  updateProgress();
})();
