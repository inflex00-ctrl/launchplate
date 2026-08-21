/* ==========================================================================
   LUMEN — AI Product Kit
   demo.js — the simulated agent console on the landing page.

   Pure CSS + vanilla JS: types a prompt, shows a tool call, then streams a
   response with a blinking caret. Respects prefers-reduced-motion and can be
   replayed from the keyboard via the "Replay" button.
   ========================================================================== */

(function () {
  "use strict";

  var body = document.querySelector("[data-demo-body]");
  var field = document.querySelector("[data-demo-field]");
  var replay = document.querySelector("[data-demo-replay]");
  var counter = document.querySelector("[data-demo-tokens]");
  if (!body) return;

  var reduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var PROMPT =
    "Review the Q3 vendor agreement and flag anything that deviates from our standard terms.";

  var ICON_USER =
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"' +
    ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="10" cy="6.5" r="3"/><path d="M3.5 17c.9-3.3 3.5-5 6.5-5s5.6 1.7 6.5 5"/></svg>';

  var ICON_AI =
    '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">' +
    '<path d="M10 1.6l1.9 4.9 4.9 1.9-4.9 1.9L10 15.2 8.1 10.3 3.2 8.4l4.9-1.9L10 1.6z"/>' +
    '<path d="M15.6 13.2l.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8.8-2.1z" opacity=".55"/></svg>';

  var ICON_TOOL =
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"' +
    ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M13.5 2.5a4 4 0 00-4.9 5.1L2.6 13.6a1.5 1.5 0 002.1 2.1l6-6a4 4 0 004.9-4.9L13.3 7 11 7l-.4-2.3 2.9-2.2z"/></svg>';

  var ICON_CHECK =
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.4"' +
    ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M4 10.5l4 4 8-9"/></svg>';

  var timers = [];
  var running = false;

  function wait(ms) {
    return new Promise(function (resolve) {
      timers.push(window.setTimeout(resolve, reduced ? Math.min(ms, 40) : ms));
    });
  }

  function clearTimers() {
    timers.forEach(window.clearTimeout);
    timers = [];
  }

  /* -- Building blocks ------------------------------------------------ */

  /* Keep the newest output in view as the transcript grows. */
  function stick() {
    body.scrollTop = body.scrollHeight;
  }

  function addMessage(role) {
    var wrap = document.createElement("div");
    wrap.className = "msg msg--" + role;

    var avatar = document.createElement("div");
    avatar.className = "msg-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.innerHTML = role === "ai" ? ICON_AI : ICON_USER;

    var content = document.createElement("div");
    content.className = "msg-content";

    var label = document.createElement("div");
    label.className = "msg-role";
    label.textContent = role === "ai" ? "Lumen" : "You";

    var text = document.createElement("div");
    text.className = "msg-text";

    content.appendChild(label);
    content.appendChild(text);
    wrap.appendChild(avatar);
    wrap.appendChild(content);
    body.appendChild(wrap);
    stick();
    return text;
  }

  /* Types into an element, character by character, with a live caret. */
  function type(el, text, speed) {
    return new Promise(function (resolve) {
      var span = document.createElement("span");
      var caret = document.createElement("span");
      caret.className = "caret";
      caret.setAttribute("aria-hidden", "true");
      el.appendChild(span);
      el.appendChild(caret);

      if (reduced) {
        span.textContent = text;
        caret.remove();
        resolve();
        return;
      }

      var i = 0;
      (function step() {
        /* Type in small bursts so it reads like token streaming, not a
           mechanical teletype. */
        var burst = 1 + Math.floor(Math.random() * 3);
        i = Math.min(i + burst, text.length);
        span.textContent = text.slice(0, i);
        bumpCounter(burst);
        stick();

        if (i >= text.length) {
          caret.remove();
          resolve();
          return;
        }
        var jitter = speed + Math.random() * speed * 0.9;
        timers.push(window.setTimeout(step, jitter));
      })();
    });
  }

  function addList(el, items) {
    var ul = document.createElement("ul");
    el.appendChild(ul);

    return items.reduce(function (chain, item) {
      return chain.then(function () {
        var li = document.createElement("li");
        li.style.opacity = "0";
        ul.appendChild(li);
        li.textContent = "";
        li.style.opacity = "1";
        return type(li, item, 11).then(function () {
          return wait(90);
        });
      });
    }, Promise.resolve());
  }

  /* A tool-call chip that spins, then resolves to a checkmark. */
  function addTool(el, label, ms) {
    var chip = document.createElement("div");
    chip.className = "tool-call";
    chip.innerHTML =
      '<span class="spinner" aria-hidden="true"></span><span>' + label + "</span>";
    el.appendChild(chip);
    stick();

    return wait(ms).then(function () {
      var spinner = chip.querySelector(".spinner");
      if (spinner) {
        var ok = document.createElement("span");
        ok.innerHTML = ICON_CHECK;
        ok.style.display = "inline-flex";
        ok.style.color = "var(--success)";
        ok.firstChild.setAttribute("width", "12");
        ok.firstChild.setAttribute("height", "12");
        spinner.replaceWith(ok.firstChild);
      }
      var ms2 = document.createElement("span");
      ms2.className = "tok-dim";
      ms2.style.opacity = "0.7";
      ms2.style.marginLeft = "0.15rem";
      ms2.textContent = "· " + (ms / 1000).toFixed(1) + "s";
      chip.appendChild(ms2);
      return wait(180);
    });
  }

  /* Live token counter on the floating chip. */
  var tokens = 0;
  function bumpCounter(n) {
    if (!counter) return;
    tokens += n;
    counter.textContent = String(Math.round(tokens * 0.34) + 12);
  }

  /* -- The scene ------------------------------------------------------ */

  function run() {
    if (running) return;
    running = true;
    clearTimers();
    body.innerHTML = "";
    tokens = 0;
    if (counter) counter.textContent = "12";
    if (replay) replay.setAttribute("aria-disabled", "true");

    var seq = Promise.resolve();

    /* 1 — type the prompt into the composer */
    if (field) {
      field.textContent = "";
      seq = seq
        .then(function () {
          return wait(400);
        })
        .then(function () {
          if (reduced) {
            field.textContent = PROMPT;
            return wait(200);
          }
          return new Promise(function (resolve) {
            var i = 0;
            (function step() {
              i += 1 + Math.floor(Math.random() * 2);
              field.textContent = PROMPT.slice(0, i);
              if (i >= PROMPT.length) {
                timers.push(window.setTimeout(resolve, 320));
                return;
              }
              timers.push(window.setTimeout(step, 16 + Math.random() * 22));
            })();
          });
        });
    }

    /* 2 — the prompt becomes a user message */
    seq = seq.then(function () {
      if (field) field.textContent = "";
      var el = addMessage("user");
      el.textContent = PROMPT;
      return wait(520);
    });

    /* 3 — the agent works, then streams its answer */
    seq = seq.then(function () {
      var el = addMessage("ai");
      return addTool(el, "search_documents(q: \"vendor agreement Q3\")", 900)
        .then(function () {
          return addTool(el, "compare(baseline: \"MSA-standard-v4\")", 700);
        })
        .then(function () {
          var p = document.createElement("p");
          el.appendChild(p);
          return type(
            p,
            "I read all 84 pages and diffed them against your standard MSA. Three clauses deviate:",
            14
          );
        })
        .then(function () {
          return addList(el, [
            "§4.2 Payment terms are Net-60, not Net-30 — a 30-day cash-flow shift.",
            "§9.1 Liability cap sits at 1× fees; your policy floor is 2×.",
            "§12.4 Auto-renewal has no termination-for-convenience window."
          ]);
        })
        .then(function () {
          var p = document.createElement("p");
          el.appendChild(p);
          return type(
            p,
            "I have drafted redlines for each. Want me to send them to Legal?",
            14
          );
        });
    });

    seq = seq.then(function () {
      running = false;
      if (replay) replay.removeAttribute("aria-disabled");
    });

    seq.catch(function () {
      running = false;
      if (replay) replay.removeAttribute("aria-disabled");
    });
  }

  if (replay) {
    replay.addEventListener("click", function () {
      if (running) return;
      run();
    });
  }

  /* Start once the console scrolls into view (or immediately as a fallback). */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            io.disconnect();
            run();
          }
        });
      },
      { threshold: 0.25 }
    );
    io.observe(body);
  } else {
    run();
  }
})();
