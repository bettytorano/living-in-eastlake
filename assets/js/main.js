// Mobile menu toggle and footer year
document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Prevent double submits on lead forms
  var loadedAt = Date.now();
  document.querySelectorAll("form.lead-form").forEach(function (form) {
    form.addEventListener("submit", function () {
      // Spam check: how long the form was open before sending (bots post instantly or skip this script)
      var t = form.querySelector("input[name=fill_ms]");
      if (!t) { t = document.createElement("input"); t.type = "hidden"; t.name = "fill_ms"; form.appendChild(t); }
      t.value = String(Date.now() - loadedAt);
      var btn = form.querySelector("button[type=submit]");
      if (btn) { btn.dataset.label = btn.dataset.label || btn.textContent; btn.disabled = true; btn.textContent = "Sending…"; }
    });
  });
});

// Coming back to a form page (Back button / restored tab) must not leave the button stuck on "Sending…"
window.addEventListener("pageshow", function () {
  document.querySelectorAll("form.lead-form button[type=submit]").forEach(function (btn) {
    btn.disabled = false;
    if (btn.dataset.label) btn.textContent = btn.dataset.label;
  });
});

// Scrolling reviews: duplicate cards for a seamless loop; pause on tap; "Read more"
document.addEventListener("DOMContentLoaded", function () {
  var viewport = document.querySelector(".reviews-viewport");
  var track = viewport && viewport.querySelector(".reviews-track");
  if (!track) return;
  var originals = Array.prototype.slice.call(track.children);
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce) {
    originals.forEach(function (card) {
      var copy = card.cloneNode(true);
      copy.setAttribute("aria-hidden", "true");
      track.appendChild(copy);
    });
    track.style.setProperty("--reviews-duration", Math.max(40, originals.length * 14) + "s");
  }
  track.addEventListener("click", function (e) {
    var btn = e.target.closest(".review-more");
    if (btn) {
      var card = btn.closest(".review");
      var open = card.classList.toggle("open");
      btn.textContent = open ? "Show less" : "Read more";
      viewport.classList.toggle("paused", open);
      return;
    }
    viewport.classList.toggle("paused");
  });
  // Hide "Read more" on reviews short enough to show in full
  track.querySelectorAll(".review").forEach(function (card) {
    var q = card.querySelector("blockquote"), b = card.querySelector(".review-more");
    if (q && b && q.scrollHeight <= q.clientHeight + 2) b.hidden = true;
  });
});

// "Let's make a plan" contact popup
(function () {
  var dlg = document.getElementById("plan-dialog");
  if (!dlg || typeof dlg.showModal !== "function") return;
  document.querySelectorAll("[data-open-plan]").forEach(function (b) {
    b.addEventListener("click", function () { dlg.showModal(); var f = dlg.querySelector("input:not([type=hidden]):not([tabindex])"); if (f) f.focus(); });
  });
  dlg.querySelector("[data-close-plan]").addEventListener("click", function () { dlg.close(); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
})();

// When arriving at a #section link, keep the section in place while Instagram embeds and lazy images
// change the page height (they can add thousands of pixels for a few seconds), until the visitor scrolls.
(function () {
  if (!location.hash || typeof ResizeObserver === "undefined") return;
  var el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (!el) return;
  var done = false;
  var go = function () { if (!done) el.scrollIntoView({ behavior: "instant", block: "start" }); };
  var stop = function () { done = true; ro.disconnect(); };
  var ro = new ResizeObserver(go);
  ro.observe(document.body);
  ["wheel", "touchstart", "keydown", "mousedown"].forEach(function (e) { window.addEventListener(e, stop, { once: true, passive: true }); });
  setTimeout(stop, 8000);
  go();
})();


// Email typo hint under every lead form's email box: "Did you mean name@gmail.com?" (a suggestion only, never blocks)
(function () {
  var DOMAINS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "aol.com", "msn.com", "live.com",
    "me.com", "comcast.net", "cox.net", "att.net", "sbcglobal.net", "verizon.net", "exprealty.com"];
  function dist(a, b) {
    var row = [], i, j, prev, tmp;
    for (j = 0; j <= b.length; j++) row[j] = j;
    for (i = 1; i <= a.length; i++) {
      prev = row[0]; row[0] = i;
      for (j = 1; j <= b.length; j++) {
        tmp = row[j];
        row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
        prev = tmp;
      }
    }
    return row[b.length];
  }
  function suggest(email) {
    var at = email.lastIndexOf("@");
    if (at < 1) return null;
    var domain = email.slice(at + 1).toLowerCase();
    if (!domain || DOMAINS.indexOf(domain) >= 0) return null;
    var best = null, bestDist = 3;
    DOMAINS.forEach(function (d) { var k = dist(domain, d); if (k < bestDist) { bestDist = k; best = d; } });
    return best ? email.slice(0, at + 1) + best : null;
  }
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("form.lead-form input[type=email]").forEach(function (input) {
      var hint = document.createElement("p");
      hint.className = "email-hint";
      hint.hidden = true;
      hint.setAttribute("aria-live", "polite");
      input.insertAdjacentElement("afterend", hint);
      input.addEventListener("blur", function () {
        var s = suggest(input.value.trim());
        if (!s) { hint.hidden = true; return; }
        hint.textContent = "Did you mean ";
        var fix = document.createElement("button");
        fix.type = "button";
        fix.textContent = s;
        fix.addEventListener("click", function () { input.value = s; hint.hidden = true; input.focus(); });
        hint.appendChild(fix);
        hint.appendChild(document.createTextNode("?"));
        hint.hidden = false;
      });
      input.addEventListener("input", function () { hint.hidden = true; });
    });
  });
})();

// Address suggestions (Google Places) on "Property address" boxes. Google loads only when someone clicks into the box.
// The key is a browser key locked in Google Cloud (project "SellingEastlake") to sellingeastlake.com and the
// living-in-eastlake.pages.dev previews, and to the Maps JavaScript + Places APIs only.
(function () {
  var KEY = "AIzaSyCF__pbzNQ7tvbmCYGxkW_0H_ZKtks4a_U";
  var loading;
  function loadPlaces() {
    if (!loading) {
      loading = new Promise(function (resolve, reject) {
        window.__gmReady = function () { google.maps.importLibrary("places").then(resolve, reject); };
        var s = document.createElement("script");
        s.src = "https://maps.googleapis.com/maps/api/js?key=" + KEY + "&loading=async&callback=__gmReady";
        s.async = true;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    return loading;
  }

  function setup(input) {
    var form = input.form;
    input.parentNode.classList.add("addr-wrap");
    var list = document.createElement("ul");
    list.className = "addr-list";
    list.id = input.id + "-list";
    list.setAttribute("role", "listbox");
    list.hidden = true;
    input.insertAdjacentElement("afterend", list);
    input.setAttribute("autocomplete", "off");
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-controls", list.id);
    input.setAttribute("aria-expanded", "false");
    // Tells Betty's lead email whether the address was picked from Google's list or typed by hand
    var picked = document.createElement("input");
    picked.type = "hidden";
    picked.name = "address_picked";
    picked.value = "no";
    form.appendChild(picked);

    var places = null, token = null, timer, items = [], active = -1, seq = 0;
    input.addEventListener("focus", function () {
      loadPlaces().then(function (p) { places = p; }).catch(function () {});
    });
    input.addEventListener("input", function () {
      picked.value = "no";
      clearTimeout(timer);
      timer = setTimeout(lookup, 250);
    });
    input.addEventListener("keydown", function (e) {
      if (list.hidden) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); move(e.key === "ArrowDown" ? 1 : -1); }
      else if (e.key === "Enter" && active >= 0) { e.preventDefault(); choose(active); }
      else if (e.key === "Escape") { close(); }
    });
    input.addEventListener("blur", function () { setTimeout(close, 150); });

    function lookup() {
      var q = input.value.trim();
      if (q.length < 3) { close(); return; }
      // Typed before Google finished loading: look up as soon as it's ready
      if (!places) { loadPlaces().then(function (p) { places = p; lookup(); }).catch(close); return; }
      if (!token) token = new places.AutocompleteSessionToken();
      var mine = ++seq;
      places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: q,
        sessionToken: token,
        includedRegionCodes: ["us"],
        includedPrimaryTypes: ["street_address", "premise", "subpremise"],
        locationBias: { center: { lat: 32.64, lng: -116.97 }, radius: 40000 },
      }).then(function (res) {
        if (mine !== seq) return;
        items = (res.suggestions || [])
          .map(function (s) { return s.placePrediction && s.placePrediction.text.toString(); })
          .filter(Boolean)
          .map(function (t) { return t.replace(/, USA$/, ""); })
          .slice(0, 5);
        render();
      }).catch(function () { close(); });
    }
    function render() {
      list.innerHTML = "";
      active = -1;
      if (!items.length) { close(); return; }
      items.forEach(function (text, i) {
        var li = document.createElement("li");
        li.id = list.id + "-" + i;
        li.setAttribute("role", "option");
        li.textContent = text;
        li.addEventListener("mousedown", function (e) { e.preventDefault(); choose(i); });
        list.appendChild(li);
      });
      var credit = document.createElement("li");
      credit.className = "addr-credit";
      credit.setAttribute("aria-hidden", "true");
      credit.textContent = "Powered by Google";
      list.appendChild(credit);
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
    }
    function move(step) {
      var opts = list.querySelectorAll("[role=option]");
      active = (active + step + opts.length) % opts.length;
      opts.forEach(function (o, i) {
        o.classList.toggle("active", i === active);
        o.setAttribute("aria-selected", i === active ? "true" : "false");
      });
      input.setAttribute("aria-activedescendant", opts[active].id);
    }
    function choose(i) {
      input.value = items[i];
      picked.value = "yes";
      token = null;
      close();
    }
    function close() {
      list.hidden = true;
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("form.lead-form input[name=address]").forEach(setup);
  });
})();

// Form error page: say which field to fix when the server sends ?reason=email
document.addEventListener("DOMContentLoaded", function () {
  var msg = document.getElementById("form-error-reason");
  if (msg && /[?&]reason=email\b/.test(location.search)) {
    msg.textContent = "That email address doesn't seem to be able to receive mail. Please go back, double-check it and try again.";
    msg.hidden = false;
  }
});
