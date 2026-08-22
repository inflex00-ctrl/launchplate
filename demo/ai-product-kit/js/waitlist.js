/* ==========================================================================
   LUMEN — AI Product Kit
   waitlist.js — client-side validation, delivery, and the success state.

   Validation, the progress bar and the success panel live here. Delivery is
   js/forms.js, which posts to whichever provider is named in config.js. The
   success panel is only ever shown when something actually happened: with
   nothing configured the signup reports that it could not be delivered
   instead of pretending.
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

  /* -- Submit ---------------------------------------------------------- *
     Delivery is handled by forms.js, which posts to whichever provider is
     named in config.js. It always resolves — never rejects — so the
     success panel can only appear when something actually happened.     */

  if (window.SiteForms) window.SiteForms.manage(form);

  function submitWaitlist() {
    if (window.SiteForms) return window.SiteForms.send(form);
    /* forms.js not loaded — say so rather than pretending. */
    return Promise.resolve({
      ok: false,
      mode: "unconfigured",
      message: "The form script is not loaded. See SETUP.md.",
      status: 0
    });
  }

  /* The error banner lives next to the submit button and is created on
     demand, so an unconfigured kit never shows an empty box. */
  function showError(message) {
    var box = form.querySelector("[data-form-error]");
    if (!box) {
      box = document.createElement("p");
      box.setAttribute("data-form-error", "");
      box.setAttribute("role", "alert");
      box.className = "field__error";
      box.style.cssText = "display:block;margin-top:.75rem";
      if (submitBtn && submitBtn.parentNode) {
        submitBtn.parentNode.insertBefore(box, submitBtn.nextSibling);
      } else {
        form.appendChild(box);
      }
    }
    box.textContent = message;
    box.hidden = false;
  }

  function clearError() {
    var box = form.querySelector("[data-form-error]");
    if (box) box.hidden = true;
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

    clearError();
    submitBtn.setAttribute("aria-disabled", "true");
    submitBtn.disabled = true;
    if (submitLabel) submitLabel.textContent = "Joining…";

    submitWaitlist().then(function (result) {
      submitBtn.removeAttribute("aria-disabled");
      submitBtn.disabled = false;
      if (submitLabel) submitLabel.textContent = "Join the waitlist";

      if (!result.ok) {
        showError(result.message);
        return;
      }

      var email = document.getElementById("wl-email");

      if (successEmail && email) successEmail.textContent = email.value.trim();

      /* The queue position is template flourish: a static site cannot
         know it. Show it only if the owner has set a starting count in
         config.js, and otherwise hide the card rather than invent a
         number for a real visitor. */
      if (successPosition) {
        var base = window.SITE_CONFIG && window.SITE_CONFIG.waitlist
          ? parseInt(window.SITE_CONFIG.waitlist.baseCount, 10)
          : NaN;
        var card = successPosition.closest ? successPosition.closest(".queue-card") : null;
        if (isNaN(base)) {
          if (card) card.hidden = true;
        } else {
          if (card) card.hidden = false;
          successPosition.textContent = "#" + base.toLocaleString("en-GB");
        }
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
