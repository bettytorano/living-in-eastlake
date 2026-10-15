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
  document.querySelectorAll("form.lead-form").forEach(function (form) {
    form.addEventListener("submit", function () {
      var btn = form.querySelector("button[type=submit]");
      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
    });
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

// GoHighLevel chat widget: on phones, lift the bubble above the Call Betty / Home Value bar.
// The widget lives in a shadow root, so page CSS can't reach it; inject a style once it appears.
(function () {
  var tries = 0;
  var timer = setInterval(function () {
    var host = document.querySelector("chat-widget");
    var root = host && host.shadowRoot;
    if (root && root.getElementById("lc_text-widget--btn")) {
      clearInterval(timer);
      if (root.getElementById("lift-for-cta")) return;
      var s = document.createElement("style");
      s.id = "lift-for-cta";
      s.textContent = "@media (max-width: 640px) { #lc_text-widget--btn, #lc_text-widget { bottom: 92px !important; } }";
      root.appendChild(s);
    } else if (++tries > 60) {
      clearInterval(timer);
    }
  }, 500);
})();
