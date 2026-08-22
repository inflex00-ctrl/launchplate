/* ==========================================================================
   STACKLIST — submit.js
   --------------------------------------------------------------------------
   The four-step submission flow on submit.html.

   What it does:
     - builds the category chooser from STACKLIST.categories (data.js)
     - moves between the four .step-panel blocks, keeping the .stepper,
       an aria-live region and browser focus in step
     - validates the current panel with the Constraint Validation API before
       letting anyone move on, and writes the error next to the field it
       belongs to (aria-describedby, aria-invalid)
     - keeps the sidebar .preview-card in sync with what is being typed
     - shows the success panel on submit

   DELIVERY is not here. js/forms.js posts the finished submission to
   whichever provider is named in config.js; this file owns the step flow,
   the validation and the success/error panels only.

   Plain ES5-flavoured JavaScript, no build step, no dependencies, so it
   works opened straight from disk (file:///…) — unconfigured, the last
   step falls back to the visitor's mail app rather than faking a send.
   ========================================================================== */

var SLSubmit = (function () {
  "use strict";

  var $ = SL.$;
  var $$ = SL.$$;

  var els = {};
  var panels = [];
  var steps = [];
  var current = 0;

  /* Colour pairs for the generated preview logo. Same look as the marks in
     data.js, so the preview card matches the real directory. */
  var PALETTE = [
    ["#0e7c5a", "#4ade80"],
    ["#1d4ed8", "#60a5fa"],
    ["#7c3f12", "#f59e0b"],
    ["#155e75", "#22d3ee"],
    ["#6d28d9", "#c4b5fd"],
    ["#9a3412", "#fb923c"],
    ["#166534", "#86efac"],
    ["#3730a3", "#818cf8"],
  ];

  /* ======================================================================
     SMALL HELPERS
     ====================================================================== */

  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function checkedValue(name) {
    var el = els.form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : "";
  }

  function checkedInput(name) {
    return els.form.querySelector('input[name="' + name + '"]:checked');
  }

  /* Every radio in a group shares one error message and one invalid state. */
  function group(field) {
    if (field.type !== "radio" || !field.name) return [field];
    return $$('input[name="' + field.name + '"]', els.form);
  }

  /* Where the error message for a field belongs: inside its fieldset for a
     radio group, otherwise at the bottom of its .field wrapper. */
  function container(field) {
    return (
      field.closest("fieldset") || field.closest(".field") || field.parentNode
    );
  }

  function hash(str) {
    var h = 7;
    for (var i = 0; i < str.length; i++) {
      h = (h * 31 + str.charCodeAt(i)) % 2147483647;
    }
    return h;
  }

  /* ======================================================================
     VALIDATION
     Real constraint validation — the `required`, `type`, `minlength` and
     `maxlength` attributes in submit.html are what decides this, so adding a
     field to the markup is all it takes to have it checked here.
     ====================================================================== */

  var WARN_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5"/><path d="M12 16.2v.6"/></svg>';

  /* Friendlier than the browser's default strings, and written in the same
     voice as the rest of the page. Per-field overrides live in the markup as
     data-error-required / data-error-type. */
  function messageFor(field) {
    var v = field.validity;

    if (v.valueMissing) {
      return field.dataset.errorRequired || "This one is required.";
    }
    if (v.typeMismatch) {
      if (field.dataset.errorType) return field.dataset.errorType;
      return field.type === "email"
        ? "That does not look like an email address."
        : "Enter a full URL, including https://";
    }
    if (v.tooShort) {
      return (
        "A little more, please — " +
        field.minLength +
        " characters minimum, and you have " +
        field.value.length +
        "."
      );
    }
    if (v.tooLong) {
      return "That is over the " + field.maxLength + " character limit.";
    }
    if (v.patternMismatch) {
      return field.dataset.errorPattern || "That format is not quite right.";
    }
    /* Anything exotic falls back to whatever the browser would have said. */
    return field.validationMessage || "Please check this field.";
  }

  function showError(field, message) {
    var box = container(field);
    var id = (field.name || field.id) + "-error";
    var node = document.getElementById(id);

    if (!node) {
      node = document.createElement("p");
      node.className = "field__error";
      node.id = id;
      box.appendChild(node);
    }
    node.innerHTML = WARN_ICON + "<span>" + SL.escape(message) + "</span>";

    group(field).forEach(function (f) {
      f.setAttribute("aria-invalid", "true");
      if (f.dataset.describedby === undefined) {
        f.dataset.describedby = f.getAttribute("aria-describedby") || "";
      }
      f.setAttribute(
        "aria-describedby",
        (f.dataset.describedby ? f.dataset.describedby + " " : "") + id
      );
    });
  }

  function clearError(field) {
    var id = (field.name || field.id) + "-error";
    var node = document.getElementById(id);
    if (node && node.parentNode) node.parentNode.removeChild(node);

    group(field).forEach(function (f) {
      f.removeAttribute("aria-invalid");
      if (f.dataset.describedby !== undefined) {
        if (f.dataset.describedby) {
          f.setAttribute("aria-describedby", f.dataset.describedby);
        } else {
          f.removeAttribute("aria-describedby");
        }
      }
    });
  }

  /* Every control in a panel that the browser is willing to validate, with
     radio groups collapsed to one entry so a group cannot shout eight times. */
  function fieldsIn(panel) {
    var seen = {};
    return $$("input, select, textarea", panel).filter(function (f) {
      if (!f.willValidate || f.disabled) return false;
      if (f.type === "radio") {
        if (seen[f.name]) return false;
        seen[f.name] = true;
      }
      return true;
    });
  }

  function validatePanel(panel) {
    var firstBad = null;

    fieldsIn(panel).forEach(function (field) {
      if (field.checkValidity()) {
        clearError(field);
        return;
      }
      showError(field, messageFor(field));
      if (!firstBad) firstBad = field;
    });

    if (firstBad) {
      /* A radio group is invalid as a whole — send focus to its first option. */
      var target = group(firstBad)[0];
      target.focus();
      return false;
    }
    return true;
  }

  /* ======================================================================
     STEP NAVIGATION
     ====================================================================== */

  function announce() {
    var title = $(".step-panel__title", panels[current]);
    els.status.textContent =
      "Step " +
      (current + 1) +
      " of " +
      panels.length +
      ": " +
      (title ? title.textContent.trim() : "");
  }

  function paintStepper() {
    steps.forEach(function (item, i) {
      if (i < current) {
        item.setAttribute("data-done", "true");
        item.removeAttribute("aria-current");
      } else if (i === current) {
        item.removeAttribute("data-done");
        item.setAttribute("aria-current", "step");
      } else {
        item.removeAttribute("data-done");
        item.removeAttribute("aria-current");
      }
    });
  }

  function show(index, direction) {
    current = Math.max(0, Math.min(panels.length - 1, index));

    panels.forEach(function (panel, i) {
      panel.hidden = i !== current;
    });

    var panel = panels[current];
    if (direction) {
      panel.removeAttribute("data-enter");
      /* Force a reflow so the animation restarts on every step change. */
      void panel.offsetWidth;
      panel.setAttribute("data-enter", direction);
    }

    paintStepper();
    announce();

    if (direction) {
      var top =
        els.stepper.getBoundingClientRect().top + window.pageYOffset - 90;
      if (window.scrollTo && !SL.prefersReducedMotion()) {
        window.scrollTo({ top: top, behavior: "smooth" });
      } else {
        window.scrollTo(0, top);
      }
      /* Land the keyboard in the new panel rather than back at the top. */
      var title = $(".step-panel__title", panel);
      if (title) title.focus({ preventScroll: true });
    }
  }

  function next() {
    if (!validatePanel(panels[current])) return;
    if (current < panels.length - 1) show(current + 1, "next");
  }

  function back() {
    if (current > 0) show(current - 1, "back");
  }

  /* ======================================================================
     CATEGORY CHOOSER — built from data.js
     ====================================================================== */

  function buildCategories() {
    if (typeof STACKLIST === "undefined") return;

    els.categoryOptions.innerHTML = STACKLIST.categories
      .map(function (c, i) {
        var n = STACKLIST.countFor(c.id);
        return (
          '<label class="option">' +
          '<input type="radio" name="category" value="' + SL.escape(c.id) + '"' +
          (i === 0 ? " required" : "") +
          ' data-error-required="Pick the one category a developer would look in.">' +
          '<span class="option__check" aria-hidden="true">' +
          SL.icon("check") +
          "</span>" +
          '<span class="option__name">' + SL.icon(c.icon) + SL.escape(c.name) + "</span>" +
          '<span class="option__desc">' + SL.escape(c.blurb) + "</span>" +
          '<span class="option__desc"><b>' + n + "</b> tool" + (n === 1 ? "" : "s") +
          " listed today</span>" +
          "</label>"
        );
      })
      .join("");
  }

  /* ======================================================================
     LIVE PREVIEW
     A real .card, built from whatever has been filled in so far. Empty
     fields fall back to placeholder copy rather than collapsing the card.
     ====================================================================== */

  function previewMark(name) {
    if (!name) {
      return { mark: { shape: "grid", from: "#8f887f", to: "#cec8be" } };
    }
    var h = hash(name.toLowerCase());
    var pair = PALETTE[h % PALETTE.length];
    return {
      mark: {
        shape: SL.shapes[h % SL.shapes.length],
        from: pair[0],
        to: pair[1],
      },
    };
  }

  function renderPreview() {
    var name = val("tool-name");
    var tagline = val("tool-tagline");
    var catId = checkedValue("category");
    var cat =
      catId && typeof STACKLIST !== "undefined" ? STACKLIST.category(catId) : null;
    var tier = checkedInput("tier");
    var tierKey = tier ? tier.value : "free";

    var classes = ["card"];
    if (tierKey === "sponsored") classes.push("card--sponsored");
    else if (tierKey === "featured") classes.push("card--featured");

    var badges = "";
    if (tierKey === "sponsored") {
      badges +=
        '<span class="badge badge--sponsored">' + SL.icon("bolt") + "Sponsored</span>";
    } else if (tierKey === "featured") {
      badges +=
        '<span class="badge badge--featured">' + SL.icon("sparkle") + "Featured</span>";
    }
    badges += '<span class="badge">Awaiting review</span>';

    els.preview.innerHTML =
      '<article class="' + classes.join(" ") + '">' +
      '<div class="card__head">' +
      SL.mark(previewMark(name), "md") +
      '<div class="card__heading">' +
      '<h3 class="card__title">' + SL.escape(name || "Your tool") + "</h3>" +
      '<span class="card__cat">' +
      SL.escape(cat ? cat.name : "Category not chosen yet") +
      "</span>" +
      "</div></div>" +
      '<div class="card__badges">' + badges + "</div>" +
      '<p class="card__tagline">' +
      SL.escape(
        tagline || "Your one-line tagline sits here, exactly as it will in the directory."
      ) +
      "</p>" +
      '<div class="card__meta">' +
      '<span class="rating-row">' + SL.stars(0, "sm") + "<span>Not yet rated</span></span>" +
      "<span>In review</span>" +
      "</div>" +
      "</article>";
  }

  /* ======================================================================
     FILE CHOOSER
     The <input type="file"> is visually hidden inside the .dropzone <label>,
     so it stays keyboard reachable and properly labelled. Files are listed
     by name only — nothing is read, uploaded or previewed.
     ====================================================================== */

  function wireDropzone() {
    var input = els.assets;
    if (!input) return;

    input.addEventListener("change", function () {
      var files = input.files;

      if (!files || !files.length) {
        els.assetList.innerHTML = "";
        els.assetStatus.textContent =
          "No files chosen yet. You can send them later if you would rather.";
        return;
      }

      els.assetList.innerHTML = Array.prototype.map
        .call(files, function (f) {
          return '<li><span class="tag">' + SL.escape(f.name) + "</span></li>";
        })
        .join("");

      els.assetStatus.textContent =
        files.length +
        " file" +
        (files.length === 1 ? "" : "s") +
        " selected. Whether these are delivered depends on your form provider — " +
        "some accept attachments only on a paid plan. See SETUP.md.";
    });
  }

  /* ======================================================================
     SUBMIT
     ====================================================================== */

  function onSubmit(e) {
    /* ------------------------------------------------------------------
       DELIVERY
       -------------------------------------------------------------------
       Handled by js/forms.js: it posts to whichever provider is named in
       config.js, and with nothing configured it opens the visitor's mail
       client rather than faking a success.

       Note on the screenshots and logo files in step 3: whether they are
       actually delivered depends on the provider. Web3Forms and Formspree
       both need a paid plan for attachments; Forminit, Basin, FormSubmit
       and Netlify accept them on the free tier. If yours does not, the
       submission still arrives — the maker is simply asked for the files
       by return email. See SETUP.md.
       ------------------------------------------------------------------ */
    e.preventDefault();

    /* Enter inside a text field submits a form. Until the last step that
       should mean "next", not "send". */
    if (current < panels.length - 1) {
      next();
      return;
    }

    if (!validateAll()) return;

    if (!window.SiteForms) {
      showSuccess();
      return;
    }

    var button = els.form.querySelector('button[type="submit"], [type="submit"]');
    window.SiteForms.setBusy(button, true);

    window.SiteForms.send(els.form).then(function (result) {
      window.SiteForms.setBusy(button, false);
      if (result.ok) {
        showSuccess(result.mode);
      } else {
        showError(result.message);
      }
    });
  }

  /* A submission that could not be delivered must say so, in the flow,
     without throwing away everything the maker just typed. */
  function showError(message) {
    var box = document.getElementById("submit-error");
    if (!box) {
      box = document.createElement("p");
      box.id = "submit-error";
      box.setAttribute("role", "alert");
      box.className = "field-error";
      box.style.cssText = "display:block;margin-top:1rem";
      var last = panels[panels.length - 1];
      (last || els.form).appendChild(box);
    }
    box.textContent = message;
    box.hidden = false;
    els.status.textContent = message;
    box.scrollIntoView({
      behavior: SL.prefersReducedMotion() ? "auto" : "smooth",
      block: "center"
    });
  }

  /* Check every panel, not just the visible one, and jump to the first that
     fails — belt and braces for anyone who has tabbed around. */
  function validateAll() {
    for (var i = 0; i < panels.length; i++) {
      if (fieldsIn(panels[i]).every(function (f) { return f.checkValidity(); })) {
        continue;
      }
      if (i !== current) show(i, i < current ? "back" : "next");
      validatePanel(panels[i]);
      return false;
    }
    return true;
  }

  function showSuccess(mode) {
    var box = document.getElementById("submit-error");
    if (box) box.hidden = true;

    els.form.hidden = true;
    els.stepper.hidden = true;
    els.success.hidden = false;

    var name = val("tool-name");
    var email = val("maker-email");
    if (name) els.successName.textContent = name;
    if (email) els.successEmail.textContent = email;

    els.status.textContent =
      mode === "mailto"
        ? "Your email app has been opened with the submission ready to send."
        : "Submission received. An editor will be in touch by email.";

    var heading = document.getElementById("success-title");
    if (heading) heading.focus();
    els.success.scrollIntoView({
      behavior: SL.prefersReducedMotion() ? "auto" : "smooth",
      block: "center",
    });
  }

  function reset() {
    els.form.reset();
    fieldsIn(els.form).forEach(clearError);
    els.assetList.innerHTML = "";
    els.assetStatus.textContent =
      "No files chosen yet. You can send them later if you would rather.";
    els.success.hidden = true;
    els.form.hidden = false;
    els.stepper.hidden = false;
    show(0, "back");
    renderPreview();
    var first = document.getElementById("tool-name");
    if (first) first.focus();
  }

  /* ======================================================================
     INIT
     ====================================================================== */

  function init() {
    els.form = document.getElementById("submit-form");
    if (!els.form) return;

    els.stepper = document.getElementById("submit-stepper");
    els.status = document.getElementById("step-status");
    els.preview = document.getElementById("preview-body");
    els.categoryOptions = document.getElementById("category-options");
    els.assets = document.getElementById("assets");
    els.assetList = document.getElementById("assets-list");
    els.assetStatus = document.getElementById("assets-status");
    els.success = document.getElementById("submit-success");
    els.successName = document.getElementById("success-name");
    els.successEmail = document.getElementById("success-email");

    panels = $$(".step-panel[data-panel]", els.form);
    steps = $$(".stepper__item", els.stepper);

    /* forms.js owns delivery for this form: manage() stops it attaching a
       second submit handler and plants the honeypot and time-trap. */
    if (window.SiteForms) window.SiteForms.manage(els.form);

    /* Panel headings take focus on a step change without joining the tab
       order — set here so the markup stays free of plumbing attributes. */
    panels.forEach(function (panel) {
      var title = $(".step-panel__title", panel);
      if (title) title.setAttribute("tabindex", "-1");
    });

    buildCategories();
    wireDropzone();
    renderPreview();

    $$("[data-next]", els.form).forEach(function (btn) {
      btn.addEventListener("click", next);
    });
    $$("[data-back]", els.form).forEach(function (btn) {
      btn.addEventListener("click", back);
    });

    /* One delegated listener keeps the preview and the error states honest,
       whatever gets typed or clicked. */
    els.form.addEventListener("input", onFieldChange);
    els.form.addEventListener("change", onFieldChange);
    els.form.addEventListener("submit", onSubmit);

    var again = document.getElementById("submit-again");
    if (again) again.addEventListener("click", reset);

    show(0);
    SL.paintIcons();
    SL.reveal();
  }

  function onFieldChange(e) {
    var field = e.target;
    if (field && field.willValidate && field.getAttribute("aria-invalid") === "true") {
      if (field.checkValidity()) clearError(field);
    }
    renderPreview();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* ======================================================================
     PUBLIC API
     Exposed so the flow can be driven from the console while you are
     restyling it:  SLSubmit.goTo(2)
     ====================================================================== */
  return {
    init: init,
    goTo: function (i) {
      show(i, i > current ? "next" : "back");
    },
    step: function () {
      return current;
    },
    validate: function () {
      return validatePanel(panels[current]);
    },
    reset: reset,
  };
})();
